/**
 * NAFA AGRITECH — SERVICE DE DÉTECTION DE LA GÉOLOCALISATION
 * 
 * Exécute la capture de position dès l'authentification de l'utilisateur :
 * 1. Navigateur HTML5 (Précis) : Coordonnées GPS réelles via navigator.geolocation.
 * 2. Adresse IP (Alternative) : Estimation de la ville, région et pays via IPinfo / IPapi en cas de refus ou timeout.
 * 3. Référentiel Toponymique : Rapprochement immédiat avec la base des pôles agricoles et communes du Burkina Faso.
 * 
 * Émet l'événement "location:detected" sur l'EventBus pour actualiser le moteur métier en temps réel.
 */

import { nafaEventBus } from "./eventBus";
import { findNearestToponym, BurkinaToponym } from "@/lib/burkinaToponyms";

export type GeolocationMethod = "browser_gps" | "ip_lookup" | "toponym_fallback";

export interface UserLocationState {
  latitude: number;
  longitude: number;
  altitudeM?: number | null;
  accuracyM: number;
  method: GeolocationMethod;
  city: string;
  province: string;
  region: string;
  country: string;
  nearestToponym?: BurkinaToponym | null;
  distanceToToponymKm?: number;
  ipAddress?: string;
  detectedAt: string;
  isApproximate: boolean;
}

const LOCAL_LOCATION_KEY = "nafa_user_location_v1";

// Position par défaut au Burkina Faso (Ouagadougou / Kamboinsé, Pôle Agricole Central)
export const DEFAULT_BURKINA_LOCATION: UserLocationState = {
  latitude: 12.3714,
  longitude: -1.5197,
  altitudeM: 305,
  accuracyM: 2500,
  method: "toponym_fallback",
  city: "Ouagadougou",
  province: "Kadiogo",
  region: "Centre",
  country: "Burkina Faso",
  detectedAt: new Date().toISOString(),
  isApproximate: true,
};

class UserGeolocationService {
  private currentLocation: UserLocationState | null = null;
  private isDetecting: boolean = false;

  constructor() {
    this.restoreCachedLocation();
  }

  /**
   * Restaure la dernière localisation connue depuis le cache local
   */
  private restoreCachedLocation(): void {
    try {
      const cached = localStorage.getItem(LOCAL_LOCATION_KEY);
      if (cached) {
        this.currentLocation = JSON.parse(cached);
      }
    } catch (_err) {
      this.currentLocation = null;
    }
  }

  /**
   * Sauvegarde la localisation en cache et notifie le bus
   */
  private saveAndEmit(location: UserLocationState): void {
    this.currentLocation = location;
    try {
      localStorage.setItem(LOCAL_LOCATION_KEY, JSON.stringify(location));
    } catch (_err) {
      // Ignorer si localStorage plein ou indisponible
    }
    nafaEventBus.emit("location:detected", location);
  }

  /**
   * 1. Capture via l'API HTML5 navigator.geolocation (Précision GPS réelle)
   */
  private captureBrowserGps(timeoutMs: number = 7000): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !navigator || !navigator.geolocation) {
        return reject(new Error("L'API de géolocalisation HTML5 n'est pas disponible."));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 180000, // 3 minutes
        }
      );
    });
  }

  /**
   * 2. Capture alternative via IP (IPinfo / IPapi)
   */
  private async captureIpLocation(timeoutMs: number = 4000): Promise<{
    lat: number;
    lng: number;
    city: string;
    region: string;
    country: string;
    ip?: string;
  }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Essai 1 : ipapi.co (très rapide et précis pour l'Afrique de l'Ouest)
      const res = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            lat,
            lng,
            city: data.city || "Ouagadougou",
            region: data.region || "Centre",
            country: data.country_name || "Burkina Faso",
            ip: data.ip,
          };
        }
      }
    } catch (_e1) {
      // Échec ou timeout sur ipapi.co, tentative de fallback 2
    }

    try {
      // Essai 2 : ipinfo.io
      const res2 = await fetch("https://ipinfo.io/json", {
        headers: { Accept: "application/json" },
      });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2.loc) {
          const [latStr, lngStr] = data2.loc.split(",");
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          if (!isNaN(lat) && !isNaN(lng)) {
            return {
              lat,
              lng,
              city: data2.city || "Ouagadougou",
              region: data2.region || "Centre",
              country: data2.country === "BF" ? "Burkina Faso" : (data2.country || "Burkina Faso"),
              ip: data2.ip,
            };
          }
        }
      }
    } catch (_e2) {
      // Fallback
    }

    throw new Error("Impossible de résoudre la géolocalisation par IP.");
  }

  /**
   * MÉTHODE PRINCIPALE : Détection automatique au Login
   * Tente le GPS précis du navigateur, puis bascule automatiquement sur l'IP en cas de refus.
   */
  public async detectLocationAtLogin(options: { forceRefresh?: boolean } = {}): Promise<UserLocationState> {
    if (this.isDetecting) {
      if (this.currentLocation) return this.currentLocation;
    }

    this.isDetecting = true;

    try {
      // ── ÉTAPE 1 : TENTATIVE VIA LE NAVIGATEUR (PRÉCIS) ──
      try {
        const gpsPos = await this.captureBrowserGps(6000);
        const lat = gpsPos.coords.latitude;
        const lng = gpsPos.coords.longitude;
        const accuracy = Math.round(gpsPos.coords.accuracy || 10);
        const altitude = gpsPos.coords.altitude;

        // Rapprochement toponymique burkinabè
        const nearest = findNearestToponym(lat, lng);

        const location: UserLocationState = {
          latitude: lat,
          longitude: lng,
          altitudeM: altitude ? Math.round(altitude) : null,
          accuracyM: accuracy,
          method: "browser_gps",
          city: nearest?.toponym.name || "Pôle Agricole Détecté",
          province: nearest?.toponym.province || "Province Arpentée",
          region: nearest?.toponym.region || "Région Agricole",
          country: "Burkina Faso",
          nearestToponym: nearest?.toponym || null,
          distanceToToponymKm: nearest?.distanceKm,
          detectedAt: new Date().toISOString(),
          isApproximate: accuracy > 500,
        };

        this.saveAndEmit(location);
        return location;
      } catch (browserErr: any) {
        // L'utilisateur a refusé l'autorisation ou timeout => Passage immédiat à l'Étape 2 (IP)
        console.warn("[UserGeolocationService] Géolocalisation navigateur refusée ou indisponible, bascule sur IP...", browserErr?.message);
      }

      // ── ÉTAPE 2 : TENTATIVE ALTERNATIVE VIA ADRESSE IP ──
      try {
        const ipResult = await this.captureIpLocation(4000);
        const nearest = findNearestToponym(ipResult.lat, ipResult.lng);

        const location: UserLocationState = {
          latitude: ipResult.lat,
          longitude: ipResult.lng,
          altitudeM: null,
          accuracyM: 5000, // Estimation à l'échelle de la ville
          method: "ip_lookup",
          city: ipResult.city || nearest?.toponym.name || "Ouagadougou",
          province: nearest?.toponym.province || "Kadiogo",
          region: ipResult.region || nearest?.toponym.region || "Centre",
          country: ipResult.country || "Burkina Faso",
          nearestToponym: nearest?.toponym || null,
          distanceToToponymKm: nearest?.distanceKm,
          ipAddress: ipResult.ip,
          detectedAt: new Date().toISOString(),
          isApproximate: true,
        };

        this.saveAndEmit(location);
        return location;
      } catch (ipErr: any) {
        console.warn("[UserGeolocationService] Géolocalisation IP échouée ou hors-ligne, recours au référentiel local...", ipErr?.message);
      }

      // ── ÉTAPE 3 : RECOURS AU DERNIER POINT CONNU OU RÉFÉRENTIEL PAR DÉFAUT ──
      if (this.currentLocation && !options.forceRefresh) {
        nafaEventBus.emit("location:detected", this.currentLocation);
        return this.currentLocation;
      }

      const defaultLoc: UserLocationState = {
        ...DEFAULT_BURKINA_LOCATION,
        detectedAt: new Date().toISOString(),
      };
      this.saveAndEmit(defaultLoc);
      return defaultLoc;
    } finally {
      this.isDetecting = false;
    }
  }

  /**
   * Retourne la position actuelle connue
   */
  public getCurrentLocation(): UserLocationState {
    return this.currentLocation || DEFAULT_BURKINA_LOCATION;
  }
}

export const userGeolocationService = new UserGeolocationService();
export default userGeolocationService;
