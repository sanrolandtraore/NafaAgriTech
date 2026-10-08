/**
 * NAFA-AGRITECH — Moteur Géodésique & Système de Levé de Coordonnées GPS
 * Spécifiquement conçu pour l'arpentage foncier, le bornage et le relevé de parcelles au Burkina Faso & Sahel.
 * 
 * Normes & Standards :
 * - Ellipsoïde de référence WGS84 (EPSG:4326) & Projection UTM Zone 30N
 * - Calculs sphériques haute fidélité (Shoelace & Haversine)
 * - Conversion bidirectionnelle Degrés Décimaux (DD) <-> Degrés Minutes Secondes (DMS)
 * - Exports normalisés SIG : GeoJSON, GPX, KML, CSV
 * - Génération de Procès-Verbal de Levé Topographique certifié en PDF
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { partnerBrandingStorage, PartnerBranding } from "./partnerBrandingStorage";

// Rayon moyen de la Terre en mètres (WGS84)
const EARTH_RADIUS_M = 6378137;
const STORAGE_KEY = "nafa_gps_survey_sessions";

export type WaypointCategory =
  | "borne"
  | "sommet"
  | "forage"
  | "puits"
  | "batiment"
  | "magasin"
  | "cloture"
  | "arbre_repere"
  | "autre";

export interface SurveyWaypoint {
  id: string;
  index: number;
  label: string;
  category: WaypointCategory;
  lat: number;
  lng: number;
  altitude?: number; // en mètres
  accuracy?: number; // précision en mètres (±X m)
  timestamp: number;
  distanceToNextM?: number;
  bearingToNextDeg?: number;
  notes?: string;
}

export interface GpsSurveySession {
  id: string;
  title: string;
  parcelName: string;
  clientName: string;
  producerPhone?: string;
  locality: string;
  commune?: string;
  region?: string;
  surveyorName?: string;
  surveyorTitle?: string;
  surveyDate: string;
  mode: "polygon" | "waypoints" | "track";
  waypoints: SurveyWaypoint[];
  areaM2: number;
  areaHa: number;
  perimeterM: number;
  centroid: { lat: number; lng: number };
  averageAccuracyM: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 1. CALCULS GÉODÉSIQUES ET GÉOMÉTRIQUES WGS84
// ============================================================================

/**
 * Distance orthodromique entre deux coordonnées GPS en mètres (Haversine)
 */
export function calculateDistanceM(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_M * c * 100) / 100;
}

/**
 * Calcul du gisement / cap / azimut de p1 vers p2 en degrés par rapport au Nord (0-360°)
 */
export function calculateBearingDeg(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round(((brng + 360) % 360) * 10) / 10;
}

/**
 * Calcul de la superficie d'un polygone fermé en m² (Shoelace sphérique WGS84)
 */
export function calculatePolygonAreaM2(coords: { lat: number; lng: number }[]): number {
  if (coords.length < 3) return 0;

  let total = 0;
  const len = coords.length;

  for (let i = 0; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];

    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

    total += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const area = Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2.0);
  return Math.round(area * 100) / 100;
}

/**
 * Calcul du périmètre total d'un polygone fermé en mètres
 */
export function calculatePerimeterM(coords: { lat: number; lng: number }[]): number {
  if (coords.length < 2) return 0;
  let perimeter = 0;
  const len = coords.length;

  for (let i = 0; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    perimeter += calculateDistanceM(p1, p2);
  }
  return Math.round(perimeter * 100) / 100;
}

/**
 * Calcul du centre géométrique moyen (Centroïde)
 */
export function calculateCentroid(coords: { lat: number; lng: number }[]): { lat: number; lng: number } {
  if (coords.length === 0) return { lat: 12.3714, lng: -1.5197 }; // Ouagadougou par défaut
  let sumLat = 0;
  let sumLng = 0;
  for (const c of coords) {
    sumLat += c.lat;
    sumLng += c.lng;
  }
  return {
    lat: Math.round((sumLat / coords.length) * 1000000) / 1000000,
    lng: Math.round((sumLng / coords.length) * 1000000) / 1000000,
  };
}

// ============================================================================
// 2. CONVERSION DE FORMATS DE COORDONNÉES (DD <-> DMS & UTM)
// ============================================================================

/**
 * Convertit des Degrés Décimaux en Degrés Minutes Secondes (DMS)
 * Exemple: 12.371428 -> 12° 22' 17.14" N
 */
export function toDMS(val: number, isLatitude: boolean): string {
  const abs = Math.abs(val);
  const degrees = Math.floor(abs);
  const minutesNotTruncated = (abs - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.round((minutesNotTruncated - minutes) * 60 * 100) / 100;

  let direction = "";
  if (isLatitude) {
    direction = val >= 0 ? "N" : "S";
  } else {
    direction = val >= 0 ? "E" : "W";
  }

  return `${degrees}° ${minutes}' ${seconds.toFixed(2)}" ${direction}`;
}

/**
 * Parse une chaîne DMS vers Degrés Décimaux (DD)
 * Formats acceptés : 12° 22' 17.14" N, 12 22 17.14 N, 12:22:17.14N
 */
export function parseDMSToDD(dmsStr: string): number | null {
  if (!dmsStr) return null;
  const clean = dmsStr.trim().toUpperCase();

  const regex = /([0-9]+)[°\s:]+([0-9]+)['\s:]+([0-9.]+)["]?\s*([NSEW])?/;
  const match = clean.match(regex);
  if (!match) {
    const floatVal = parseFloat(clean);
    return isNaN(floatVal) ? null : floatVal;
  }

  const deg = parseFloat(match[1]);
  const min = parseFloat(match[2]);
  const sec = parseFloat(match[3]);
  const dir = match[4];

  let dd = deg + min / 60 + sec / 3600;
  if (dir === "S" || dir === "W") {
    dd = -dd;
  }
  return Math.round(dd * 1000000) / 1000000;
}

/**
 * Conversion approximative WGS84 vers coordonnées UTM Zone 30N (Burkina Faso)
 */
export function toApproximateUtmZone30N(lat: number, lng: number): { easting: number; northing: number; zone: string } {
  // Projection transverse de Mercator simplifiée pour le fuseau 30N (-6° à 0°)
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const centralMeridianRad = (-3.0 * Math.PI) / 180; // Méridien central du fuseau 30

  const k0 = 0.9996;
  const falseEasting = 500000.0;
  const falseNorthing = 0.0;

  const dLng = lngRad - centralMeridianRad;
  const easting = falseEasting + k0 * EARTH_RADIUS_M * dLng * Math.cos(latRad);
  const northing = falseNorthing + k0 * EARTH_RADIUS_M * latRad;

  return {
    easting: Math.round(easting),
    northing: Math.round(northing),
    zone: "30N",
  };
}

// ============================================================================
// 3. RECALCUL ET ENRICHISSEMENT DES WAYPOINTS D'UNE SESSION
// ============================================================================

export function enrichWaypoints(waypoints: SurveyWaypoint[], isClosedPolygon = true): SurveyWaypoint[] {
  const len = waypoints.length;
  if (len === 0) return [];

  return waypoints.map((pt, i) => {
    let distanceToNextM: number | undefined = undefined;
    let bearingToNextDeg: number | undefined = undefined;

    if (i < len - 1) {
      const next = waypoints[i + 1];
      distanceToNextM = calculateDistanceM(pt, next);
      bearingToNextDeg = calculateBearingDeg(pt, next);
    } else if (isClosedPolygon && len >= 3) {
      const first = waypoints[0];
      distanceToNextM = calculateDistanceM(pt, first);
      bearingToNextDeg = calculateBearingDeg(pt, first);
    }

    return {
      ...pt,
      index: i + 1,
      distanceToNextM,
      bearingToNextDeg,
    };
  });
}

// ============================================================================
// 4. PERSISTANCE LOCALE (OFFLINE-FIRST)
// ============================================================================

export const gpsSurveyStorage = {
  getAll(): GpsSurveySession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getById(id: string): GpsSurveySession | null {
    const all = this.getAll();
    return all.find((s) => s.id === id) || null;
  },

  save(session: GpsSurveySession): GpsSurveySession {
    const all = this.getAll();
    const existingIndex = all.findIndex((s) => s.id === session.id);

    // Mettre à jour l'horodatage
    const enrichedSession: GpsSurveySession = {
      ...session,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      all[existingIndex] = enrichedSession;
    } else {
      all.unshift(enrichedSession);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent("nafa_gps_surveys_updated"));
    } catch (e) {
      console.error("Erreur de sauvegarde locale du levé GPS :", e);
    }

    return enrichedSession;
  },

  delete(id: string): void {
    const all = this.getAll().filter((s) => s.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent("nafa_gps_surveys_updated"));
    } catch (e) {
      console.error("Erreur de suppression du levé GPS :", e);
    }
  },
};

// ============================================================================
// 5. EXPORT SIG & DONNÉES GÉOSPATIALES (GEOJSON, GPX, KML, CSV)
// ============================================================================

/**
 * Exporte la session au format standard GeoJSON (FeatureCollection)
 */
export function exportToGeoJson(session: GpsSurveySession): string {
  const features: any[] = [];

  // 1. Sommets individuels (Points)
  session.waypoints.forEach((wp) => {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [wp.lng, wp.lat, wp.altitude ?? 0],
      },
      properties: {
        id: wp.id,
        index: wp.index,
        label: wp.label,
        category: wp.category,
        accuracy_m: wp.accuracy,
        distance_next_m: wp.distanceToNextM,
        bearing_deg: wp.bearingToNextDeg,
        notes: wp.notes,
        timestamp: new Date(wp.timestamp).toISOString(),
      },
    });
  });

  // 2. Polygone de la parcelle si au moins 3 points
  if (session.waypoints.length >= 3) {
    const ring = session.waypoints.map((w) => [w.lng, w.lat]);
    // Fermeture de l'anneau
    ring.push([session.waypoints[0].lng, session.waypoints[0].lat]);

    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [ring],
      },
      properties: {
        title: session.title,
        parcelName: session.parcelName,
        clientName: session.clientName,
        locality: session.locality,
        area_m2: session.areaM2,
        area_ha: session.areaHa,
        perimeter_m: session.perimeterM,
        average_accuracy_m: session.averageAccuracyM,
        survey_date: session.surveyDate,
      },
    });
  }

  const geoJson = {
    type: "FeatureCollection",
    name: session.title || "Leve_GPS_NAFA",
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
    },
    features,
  };

  return JSON.stringify(geoJson, null, 2);
}

/**
 * Exporte au format GPX (GPS eXchange Format pour Garmin, OsmAnd, etc.)
 */
export function exportToGpx(session: GpsSurveySession): string {
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="NAFA-AGRITECH Leve GPS WGS84" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(session.title)}</name>
    <desc>Parcelle : ${escapeXml(session.parcelName)} - Client : ${escapeXml(session.clientName)} - Localité : ${escapeXml(session.locality)}</desc>
    <time>${session.surveyDate}</time>
  </metadata>
`;

  // Waypoints
  session.waypoints.forEach((wp) => {
    gpx += `  <wpt lat="${wp.lat}" lon="${wp.lng}">
    <ele>${wp.altitude ?? 0}</ele>
    <time>${new Date(wp.timestamp).toISOString()}</time>
    <name>${escapeXml(wp.label)}</name>
    <cmt>${escapeXml(wp.category)} - Précision ±${wp.accuracy ?? 0}m</cmt>
    <desc>${escapeXml(wp.notes || "")}</desc>
  </wpt>
`;
  });

  // Track si plus d'un point
  if (session.waypoints.length >= 2) {
    gpx += `  <trk>
    <name>${escapeXml(session.parcelName || "Périmètre de la parcelle")}</name>
    <trkseg>
`;
    session.waypoints.forEach((wp) => {
      gpx += `      <trkpt lat="${wp.lat}" lon="${wp.lng}">
        <ele>${wp.altitude ?? 0}</ele>
        <time>${new Date(wp.timestamp).toISOString()}</time>
      </trkpt>
`;
    });
    // Fermeture
    if (session.waypoints.length >= 3) {
      const first = session.waypoints[0];
      gpx += `      <trkpt lat="${first.lat}" lon="${first.lng}">
        <ele>${first.altitude ?? 0}</ele>
        <time>${new Date(first.timestamp).toISOString()}</time>
      </trkpt>
`;
    }
    gpx += `    </trkseg>
  </trk>
`;
  }

  gpx += `</gpx>`;
  return gpx;
}

/**
 * Exporte au format KML (Google Earth / Google Maps)
 */
export function exportToKml(session: GpsSurveySession): string {
  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(session.title)}</name>
    <description>Parcelle: ${escapeXml(session.parcelName)} | Superficie: ${session.areaHa} ha (${session.areaM2} m²)</description>
    <Style id="polyStyle">
      <LineStyle>
        <color>ff008015</color>
        <width>3</width>
      </LineStyle>
      <PolyStyle>
        <color>4000e020</color>
      </PolyStyle>
    </Style>
`;

  // Placemarks des points
  session.waypoints.forEach((wp) => {
    kml += `    <Placemark>
      <name>${escapeXml(wp.label)}</name>
      <description>Type: ${escapeXml(wp.category)}&#10;Précision: ±${wp.accuracy ?? 0}m&#10;Alt: ${wp.altitude ?? 0}m</description>
      <Point>
        <coordinates>${wp.lng},${wp.lat},${wp.altitude ?? 0}</coordinates>
      </Point>
    </Placemark>
`;
  });

  // Polygone si >= 3 points
  if (session.waypoints.length >= 3) {
    const coordsStr = session.waypoints
      .map((w) => `${w.lng},${w.lat},${w.altitude ?? 0}`)
      .concat([`${session.waypoints[0].lng},${session.waypoints[0].lat},${session.waypoints[0].altitude ?? 0}`])
      .join(" ");

    kml += `    <Placemark>
      <name>${escapeXml(session.parcelName || "Périmètre de la parcelle")}</name>
      <styleUrl>#polyStyle</styleUrl>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordsStr}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
`;
  }

  kml += `  </Document>
</kml>`;
  return kml;
}

/**
 * Exporte le tableau des coordonnées au format CSV (séparateur point-virgule)
 */
export function exportToCsv(session: GpsSurveySession): string {
  const headers = [
    "N°",
    "Identifiant_Borne",
    "Type",
    "Latitude_DD",
    "Longitude_DD",
    "Latitude_DMS",
    "Longitude_DMS",
    "Altitude_m",
    "Precision_m",
    "Distance_Suivant_m",
    "Cap_Degres",
    "UTM_Est",
    "UTM_Nord",
    "UTM_Zone",
    "Notes",
  ];

  const rows = session.waypoints.map((wp) => {
    const utm = toApproximateUtmZone30N(wp.lat, wp.lng);
    return [
      wp.index,
      `"${wp.label}"`,
      `"${wp.category}"`,
      wp.lat.toFixed(6),
      wp.lng.toFixed(6),
      `"${toDMS(wp.lat, true)}"`,
      `"${toDMS(wp.lng, false)}"`,
      wp.altitude ?? "",
      wp.accuracy ?? "",
      wp.distanceToNextM ?? "",
      wp.bearingToNextDeg ?? "",
      utm.easting,
      utm.northing,
      utm.zone,
      `"${(wp.notes || "").replace(/"/g, '""')}"`,
    ].join(";");
  });

  return [headers.join(";"), ...rows].join("\r\n");
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ============================================================================
// 6. GÉNÉRATION DU PROCÈS-VERBAL DE LEVÉ TOPOGRAPHIQUE EN PDF
// ============================================================================

export function generateGpsSurveyPdf(session: GpsSurveySession, branding?: PartnerBranding): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const b = branding || partnerBrandingStorage.get();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // En-tête professionnel
  const companyName = b.companyName || "CABINET D'INGÉNIERIE & GÉOMÉTRIE RURALE";
  const expertName = b.expertName || session.surveyorName || "Opérateur Géomètre Agréé";
  const expertTitle = b.expertTitle || session.surveyorTitle || "Ingénieur Topographe & Agronome";

  // Bandeau supérieur
  doc.setFillColor(21, 128, 61); // Vert Sahel
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setFillColor(234, 179, 8); // Bande jaune or
  doc.rect(0, 26, pageWidth, 2.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(companyName.toUpperCase(), 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("RÉGLEMENTATION CADASTRALE & SYSTÈME GÉODÉSIQUE WGS84 • BURKINA FASO", 14, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PROCÈS-VERBAL DE BORNAGE GPS", pageWidth - 14, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Réf : LEV-${session.id.slice(-6).toUpperCase()}`, pageWidth - 14, 20, { align: "right" });

  // Titre du document
  let y = 38;
  doc.setTextColor(20, 30, 45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PROCÈS-VERBAL DE LEVÉ DE COORDONNÉES GPS", 14, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 115);
  doc.text("Relevé in-situ des bornes, sommets périmétriques et infrastructures agricoles.", 14, y);

  y += 8;

  // Cartouche Informations Générales
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(14, y, pageWidth - 28, 38, 3, 3, "FD");

  doc.setTextColor(30, 40, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DONNÉES DU CHANTIER & D'EXPLOITATION", 20, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Parcelle / Chantier : ${session.parcelName || "Parcelle Principale"}`, 20, y + 16);
  doc.text(`Propriétaire / Client : ${session.clientName || "Non spécifié"}`, 20, y + 22);
  doc.text(`Localité / Commune : ${session.locality || "Non spécifiée"}`, 20, y + 28);
  doc.text(`Date d'intervention : ${new Date(session.surveyDate).toLocaleDateString("fr-FR")}`, 20, y + 34);

  const col2X = pageWidth / 2 + 10;
  doc.text(`Opérateur : ${expertName} (${expertTitle})`, col2X, y + 16);
  doc.text(`Système Géodésique : WGS84 (EPSG:4326) / UTM 30N`, col2X, y + 22);
  doc.text(`Précision Satellite Moyenne : ±${session.averageAccuracyM.toFixed(1)} mètres`, col2X, y + 28);
  doc.text(`Mode de levé : ${session.mode === "polygon" ? "Arpentage Polygonal" : "Points isolés / Waypoints"}`, col2X, y + 34);

  y += 44;

  // 4 Cartes de métriques clés
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cardHeight = 18;

  const metrics = [
    { label: "SUPERFICIE NETTE", value: `${session.areaHa.toFixed(3)} ha`, sub: `${session.areaM2.toLocaleString("fr-FR")} m²` },
    { label: "PÉRIMÈTRE", value: `${session.perimeterM.toFixed(1)} m`, sub: `${(session.perimeterM / 1000).toFixed(3)} km` },
    { label: "BORNES LEVÉES", value: `${session.waypoints.length} sommets`, sub: "Points géoréférencés" },
    { label: "CENTROÏDE", value: `${session.centroid.lat.toFixed(4)}°`, sub: `${session.centroid.lng.toFixed(4)}° WGS84` },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(240, 248, 240);
    doc.setDrawColor(180, 220, 180);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(21, 128, 61);
    doc.text(m.label, x + 3, y + 5);

    doc.setFontSize(10.5);
    doc.setTextColor(20, 30, 45);
    doc.text(m.value, x + 3, y + 11.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 115, 130);
    doc.text(m.sub, x + 3, y + 15.5);
  });

  y += cardHeight + 6;

  // Tableau détaillé des sommets / bornes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 30, 45);
  doc.text("TABLEAU OFFICIEL DES BORNES & COORDONNÉES GÉODÉSIQUES", 14, y);
  y += 3;

  const tableData = session.waypoints.map((wp) => {
    const utm = toApproximateUtmZone30N(wp.lat, wp.lng);
    const dmsLat = toDMS(wp.lat, true);
    const dmsLng = toDMS(wp.lng, false);

    return [
      wp.label || `P${wp.index}`,
      wp.category.replace("_", " "),
      `${wp.lat.toFixed(6)}°\n${dmsLat}`,
      `${wp.lng.toFixed(6)}°\n${dmsLng}`,
      `${utm.easting} / ${utm.northing}`,
      wp.altitude ? `${wp.altitude} m` : "-",
      wp.accuracy ? `±${wp.accuracy}m` : "-",
      wp.distanceToNextM ? `${wp.distanceToNextM} m` : "-",
      wp.bearingToNextDeg ? `${wp.bearingToNextDeg}°` : "-",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Borne",
        "Nature",
        "Latitude (DD & DMS)",
        "Longitude (DD & DMS)",
        "UTM 30N (X / Y)",
        "Alt.",
        "Préc.",
        "Dist. suiv.",
        "Cap",
      ],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [21, 128, 61],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [35, 45, 60],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "center", cellWidth: 16 },
      1: { halign: "center", cellWidth: 20 },
      2: { cellWidth: 32 },
      3: { cellWidth: 32 },
      4: { halign: "center", cellWidth: 26 },
      5: { halign: "center", cellWidth: 12 },
      6: { halign: "center", cellWidth: 12 },
      7: { halign: "center", cellWidth: 17 },
      8: { halign: "center", cellWidth: 13 },
    },
    margin: { left: 14, right: 14 },
  });

  // Positionner le bloc signature en bas de page
  const finalY = (doc as any).lastAutoTable?.finalY || y + 60;
  let signatureY = finalY + 8;

  if (signatureY + 40 > pageHeight - 15) {
    doc.addPage();
    signatureY = 25;
  }

  // Zone d'attestation et de visa
  doc.setDrawColor(200, 210, 220);
  doc.setFillColor(252, 253, 255);
  doc.roundedRect(14, signatureY, pageWidth - 28, 32, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 45, 60);
  doc.text("ATTESTATION DE CONFORMITÉ TOPOGRAPHIQUE & VISA", 20, signatureY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 90, 105);
  doc.text(
    "Je soussigné certifie que les présentes coordonnées géodésiques ont été relevées in-situ selon les méthodes",
    20,
    signatureY + 13
  );
  doc.text(
    "de géopositionnement par satellite WGS84 et correspondent fidèlement à la délimitation de la parcelle.",
    20,
    signatureY + 18
  );

  doc.setFont("helvetica", "bold");
  doc.text(`Fait à ${session.locality || "Ouagadougou"}, le ${new Date().toLocaleDateString("fr-FR")}`, 20, signatureY + 26);
  doc.text("Cachet & Signature de l'Opérateur :", pageWidth - 70, signatureY + 26);

  // Pied de page
  const footerText = b.companyName
    ? `${b.companyName} • ${b.phone || ""} • ${b.email || ""}`
    : "Dossier officiel de levé géodésique • NAFA-AGRITECH Burkina Faso";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120, 130, 140);
  doc.text(footerText, 14, pageHeight - 8);
  doc.text("Page 1 sur 1", pageWidth - 14, pageHeight - 8, { align: "right" });

  return doc;
}
