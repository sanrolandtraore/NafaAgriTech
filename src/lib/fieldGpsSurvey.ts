/**
 * NAFA FIELD DESIGNER — MOTEUR D'ARPENTAGE GPS & MESURE DE PARCELLE
 * Conforme aux exigences terrain des agronomes sahéliens :
 * - Mode marche autour de la parcelle (A → B → C → D → A)
 * - Calcul géodésique précis (Shoelace WGS84 projeté)
 * - Périmètre, m², hectares, dimensions, orientation
 * - Tolérance GPS, correction et fermeture automatique
 */

import { GeoPoint } from "@/types/fieldDesigner";

// Rayon moyen de la Terre en mètres (WGS84)
const EARTH_RADIUS_M = 6378137;

/**
 * Calcule la distance orthodromique entre 2 points GPS en mètres (Haversine)
 */
export function calculateDistanceM(p1: GeoPoint, p2: GeoPoint): number {
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Calcule la surface d'un polygone GPS en m² (Formule Shoelace sphérique WGS84)
 */
export function calculatePolygonAreaM2(points: GeoPoint[]): number {
  if (points.length < 3) return 0;

  let total = 0;
  const len = points.length;

  for (let i = 0; i < len; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % len];

    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

    total += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const area = Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2.0);
  return Math.round(area * 100) / 100;
}

/**
 * Calcule le périmètre total d'un polygone fermé en mètres
 */
export function calculatePerimeterM(points: GeoPoint[]): number {
  if (points.length < 2) return 0;
  let perimeter = 0;
  const len = points.length;

  for (let i = 0; i < len; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % len];
    perimeter += calculateDistanceM(p1, p2);
  }
  return Math.round(perimeter * 10) / 10;
}

/**
 * Calcule le centroïde moyen d'un groupe de points GPS
 */
export function calculateCentroid(points: GeoPoint[]): { lat: number; lng: number } {
  if (points.length === 0) return { lat: 12.3714, lng: -1.5197 }; // Ouagadougou par défaut
  let sumLat = 0;
  let sumLng = 0;
  points.forEach((p) => {
    sumLat += p.lat;
    sumLng += p.lng;
  });
  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length,
  };
}

/**
 * Estime l'orientation principale (en degrés par rapport au Nord) et dimensions approximatives
 */
export function calculateFieldDimensions(points: GeoPoint[]): {
  lengthM: number;
  widthM: number;
  orientationDeg: number;
} {
  if (points.length < 3) {
    return { lengthM: 0, widthM: 0, orientationDeg: 0 };
  }

  // Trouver les 2 points les plus éloignés (axe longitudinal)
  let maxDist = 0;
  let pA = points[0];
  let pB = points[1];

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = calculateDistanceM(points[i], points[j]);
      if (d > maxDist) {
        maxDist = d;
        pA = points[i];
        pB = points[j];
      }
    }
  }

  const lengthM = Math.round(maxDist);
  const areaM2 = calculatePolygonAreaM2(points);
  const widthM = lengthM > 0 ? Math.round(areaM2 / lengthM) : 0;

  // Calcul du cap / azimut de l'axe principal
  const dLng = ((pB.lng - pA.lng) * Math.PI) / 180;
  const lat1 = (pA.lat * Math.PI) / 180;
  const lat2 = (pB.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;

  return {
    lengthM,
    widthM: widthM || Math.round(lengthM * 0.6),
    orientationDeg: Math.round(brng),
  };
}

export interface LiveSurveyState {
  isRecording: boolean;
  points: GeoPoint[];
  distanceWalkedM: number;
  currentAreaM2: number;
  currentAreaHa: number;
  perimeterM: number;
  currentAccuracyM: number | null;
  lastPoint: GeoPoint | null;
  canClose: boolean;
}
