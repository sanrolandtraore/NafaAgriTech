/**
 * NAFA-AGRITECH — Service d'API Cartographique & Géolocalisation (Map API)
 * 
 * Fournit l'intégration des APIs cartographiques pour :
 * 1. Le géocodage inverse (coordonnées GPS lat/lng -> nom du lieu, village, commune au Burkina Faso)
 * 2. La recherche de toponymes et coordonnées GPS par API (OpenStreetMap Nominatim)
 * 3. L'estimation d'altitude réelle au-dessus du niveau de la mer (Open-Meteo SRTM Elevation API)
 * 4. La capture interactive au clic et glisser-déposer sur cartes Leaflet
 * 5. Le fallback hors-ligne 100% garanti via la base toponymique nationale burkinabè
 */

import { findNearestToponym, searchBurkinaToponyms, BurkinaToponym } from "./burkinaToponyms";

export interface MapGeocodingResult {
  lat: number;
  lng: number;
  placeName: string;
  villageOrCity?: string;
  commune?: string;
  province?: string;
  region?: string;
  country: string;
  formattedAddress: string;
  source: "map_api_nominatim" | "burkina_toponyms_local" | "gps_coordinates";
  altitudeM?: number;
}

export interface MapPlaceSearchResult {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  description: string;
  source: "api_osm" | "local_toponym";
}

// Cache mémoire pour optimiser la réactivité et économiser la bande passante
const geocodeCache = new Map<string, MapGeocodingResult>();
const elevationCache = new Map<string, number>();

/**
 * Géocodage inverse par Map API (Coordonnées GPS -> Nom du lieu)
 */
export async function reverseGeocodeWithMapApi(
  lat: number,
  lng: number
): Promise<MapGeocodingResult> {
  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Tentative d'appel à l'API Map OpenStreetMap Nominatim si connecté
  if (navigator.onLine) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1&accept-language=fr`;
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          // User-agent conforme aux consignes d'usage OSM Nominatim
          "User-Agent": "NafaAgritech-GpsSurveyor/2.0 (contact@nafa-agritech.bf)",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};

        const villageOrCity =
          address.village ||
          address.town ||
          address.city ||
          address.suburb ||
          address.hamlet ||
          address.locality;

        const commune = address.municipality || address.county;
        const state = address.state || address.region;
        const country = address.country || "Burkina Faso";

        const placeName =
          villageOrCity ||
          data.name ||
          (commune ? `Commune de ${commune}` : `Secteur ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°W`);

        const result: MapGeocodingResult = {
          lat,
          lng,
          placeName,
          villageOrCity,
          commune,
          province: address.county,
          region: state,
          country,
          formattedAddress: data.display_name || `${placeName}, ${country}`,
          source: "map_api_nominatim",
        };

        geocodeCache.set(cacheKey, result);
        return result;
      }
    } catch (apiErr) {
      console.warn("Map API Nominatim indisponible, bascule sur le référentiel toponymique local:", apiErr);
    }
  }

  // 2. Bascule hors-ligne robuste : plus proche toponyme du Burkina Faso
  const nearest = findNearestToponym(lat, lng);
  if (nearest) {
    const t = nearest.toponym;
    const distKm = nearest.distanceKm.toFixed(1);
    const placeName =
      nearest.distanceKm < 0.5
        ? t.name
        : `${t.name} (à ${distKm} km)`;

    const result: MapGeocodingResult = {
      lat,
      lng,
      placeName,
      villageOrCity: t.name,
      province: t.province,
      region: t.region,
      country: "Burkina Faso",
      formattedAddress: `${placeName}, ${t.province}, Région ${t.region}`,
      source: "burkina_toponyms_local",
    };

    geocodeCache.set(cacheKey, result);
    return result;
  }

  // 3. Fallback brut de coordonnées
  const fallback: MapGeocodingResult = {
    lat,
    lng,
    placeName: `Point GPS (${lat.toFixed(5)}°, ${lng.toFixed(5)}°)`,
    country: "Burkina Faso",
    formattedAddress: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
    source: "gps_coordinates",
  };
  return fallback;
}

/**
 * Recherche de lieux par API Map & référentiel toponymique
 */
export async function searchPlacesWithMapApi(
  query: string
): Promise<MapPlaceSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const localMatches: MapPlaceSearchResult[] = searchBurkinaToponyms(trimmed).slice(0, 8).map((t) => ({
    id: `local_${t.id}`,
    name: t.name,
    category: t.category.replace(/_/g, " "),
    lat: t.lat,
    lng: t.lng,
    description: `${t.province}, Région ${t.region} ${t.description ? "— " + t.description : ""}`,
    source: "local_toponym",
  }));

  if (!navigator.onLine) {
    return localMatches;
  }

  try {
    const encoded = encodeURIComponent(trimmed);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=jsonv2&countrycodes=bf&limit=8&addressdetails=1&accept-language=fr`;

    const resp = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "NafaAgritech-GpsSurveyor/2.0 (contact@nafa-agritech.bf)",
      },
    });

    if (resp.ok) {
      const data: any[] = await resp.json();
      const osmMatches: MapPlaceSearchResult[] = data.map((item, idx) => ({
        id: `osm_${item.place_id || idx}`,
        name: item.name || item.display_name.split(",")[0],
        category: item.type || "lieu",
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        description: item.display_name,
        source: "api_osm",
      }));

      // Fusionner en évitant les doublons trop proches
      const combined = [...localMatches];
      osmMatches.forEach((osmItem) => {
        const alreadyPresent = combined.some(
          (c) => Math.abs(c.lat - osmItem.lat) < 0.005 && Math.abs(c.lng - osmItem.lng) < 0.005
        );
        if (!alreadyPresent) {
          combined.push(osmItem);
        }
      });

      return combined.slice(0, 10);
    }
  } catch (err) {
    console.warn("Erreur recherche API Map:", err);
  }

  return localMatches;
}

/**
 * Récupère l'altitude exacte via l'API Open-Meteo Elevation
 */
export async function fetchElevationForCoordinates(
  lat: number,
  lng: number
): Promise<number | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (elevationCache.has(key)) {
    return elevationCache.get(key)!;
  }

  if (!navigator.onLine) return null;

  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const json = await resp.json();
      if (Array.isArray(json.elevation) && typeof json.elevation[0] === "number") {
        const alt = Math.round(json.elevation[0]);
        elevationCache.set(key, alt);
        return alt;
      }
    }
  } catch (err) {
    console.warn("Erreur fetch elevation:", err);
  }

  return null;
}
