/**
 * Validation topologique de parcelles et propagation d'incertitude GPS cadastrale
 * 
 * Références normatives & scientifiques :
 * - RFC 7946 - The GeoJSON Format Specification (Section 3.1.6 : Polygon Rings)
 * - ISO 19152:2012 - Land Administration Domain Model (LADM)
 * - Mikhail E.M. & Gracie G. (1981) - Analysis and Adjustment of Survey Measurements,
 *   Van Nostrand Reinhold (Propagation des variances pour le calcul de surface par coordonnées).
 * - OGC Simple Feature Access - Part 1: Common Architecture.
 */

import { LatLonPoint, calculateGeodesicPolygonArea } from "./wgs84Ellipsoid";
import { projectLatLonToUtm } from "./utmProjection";
import { Provenance, createProvenance } from "../provenance";

export interface SurveyVertexWithAccuracy extends LatLonPoint {
  /** Précision de position horizontale 1-sigma en mètres (rapportée par le récepteur GPS) */
  horizontalAccuracyM?: number;
  /** Identifiant du sommet */
  id?: string;
}

export interface SelfIntersectionAnomaly {
  segment1Index: number;
  segment2Index: number;
  approximateLocation: LatLonPoint;
}

export interface TopologyValidationResult {
  /** Le polygone est-il valide et sans auto-intersection ? */
  isValid: boolean;
  /** Présence d'auto-intersections (nœud papillon, sablier) */
  hasSelfIntersections: boolean;
  /** Liste des anomalies d'intersection détectées */
  intersections: SelfIntersectionAnomaly[];
  /** Sommets consécutifs doublons (< 5 cm d'écart) */
  duplicateVerticesIndices: number[];
  /** Orientation de l'anneau extérieur */
  orientation: "counter_clockwise" | "clockwise";
  /** Est conforme à la spécification GeoJSON RFC 7946 (sens anti-horaire pour anneau extérieur) */
  isRfc7946Compliant: boolean;
  /** Messages d'erreur ou avertissements topologiques */
  warnings: string[];
}

export interface ParcelAreaWithUncertaintyResult {
  /** Surface géodésique estimée en m² */
  areaM2: number;
  /** Surface en hectares */
  areaHa: number;
  /** Écart-type d'incertitude 1-sigma sur la surface (m²) */
  sigmaAreaM2: number;
  /** Écart-type d'incertitude 1-sigma sur la surface (ha) */
  sigmaAreaHa: number;
  /** Demi-intervalle de confiance à 95% (+/- deltaAreaM2) */
  margin95M2: number;
  /** Demi-intervalle de confiance à 95% (+/- deltaAreaHa) */
  margin95Ha: number;
  /** Intervalle de confiance [min, max] en hectares à 95% */
  confidenceIntervalHa95: [number, number];
  /** Incertitude relative sur la surface en % */
  relativeUncertaintyPercent: number;
  /** Qualité cadastrale globale du levé */
  surveyQualityGrade: "cadastral_centimetric" | "metric_professional" | "recreational_approximate";
  /** Validation topologique */
  topology: TopologyValidationResult;
  /** Traçabilité scientifique */
  provenance: Provenance;
}

/** Test d'intersection entre deux segments 2D [p1, p2] et [p3, p4] */
function doSegmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number },
): boolean {
  const ccw = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) =>
    (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Valide la topologie stricte d'un polygone de sommets
 */
export function validateParcelTopology(vertices: LatLonPoint[]): TopologyValidationResult {
  const n = vertices.length;
  const warnings: string[] = [];

  if (n < 3) {
    return {
      isValid: false,
      hasSelfIntersections: false,
      intersections: [],
      duplicateVerticesIndices: [],
      orientation: "counter_clockwise",
      isRfc7946Compliant: false,
      warnings: ["Un polygone doit comporter au moins 3 sommets distincts."],
    };
  }

  // 1. Détection des sommets doublons consécutifs
  const duplicateIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const dLat = Math.abs(vertices[i].lat - vertices[next].lat);
    const dLng = Math.abs(vertices[i].lng - vertices[next].lng);
    // ~ 1e-6 degré ≈ 11 cm
    if (dLat < 5e-7 && dLng < 5e-7) {
      duplicateIndices.push(i);
      warnings.push(`Sommet doublon quasi-confondu détecté à l'index ${i} et ${next}.`);
    }
  }

  // 2. Détection des auto-intersections
  const intersections: SelfIntersectionAnomaly[] = [];
  // Projection locale pour test d'intersection plan
  const localPts = vertices.map((v) => {
    const utm = projectLatLonToUtm(v);
    return { x: utm.eastingM, y: utm.northingM };
  });

  for (let i = 0; i < n; i++) {
    const iNext = (i + 1) % n;
    const p1 = localPts[i];
    const p2 = localPts[iNext];

    // Ne pas tester les segments adjacents ni le segment lui-même
    for (let j = i + 2; j < n; j++) {
      const jNext = (j + 1) % n;
      if (jNext === i) continue; // segment adjacent en fermeture

      const p3 = localPts[j];
      const p4 = localPts[jNext];

      if (doSegmentsIntersect(p1, p2, p3, p4)) {
        intersections.push({
          segment1Index: i,
          segment2Index: j,
          approximateLocation: {
            lat: (vertices[i].lat + vertices[j].lat) / 2,
            lng: (vertices[i].lng + vertices[j].lng) / 2,
          },
        });
        warnings.push(
          `Auto-intersection topologique détectée entre le segment [${i}->${iNext}] et le segment [${j}->${jNext}] (forme en nœud papillon).`,
        );
      }
    }
  }

  // 3. Orientation (sens horaire vs anti-horaire)
  const areaGeo = calculateGeodesicPolygonArea(vertices);
  const orientation = areaGeo.orientation;
  const isRfc7946Compliant = orientation === "counter_clockwise";

  if (!isRfc7946Compliant) {
    warnings.push(
      "L'orientation de l'anneau extérieur est dans le sens horaire. La norme GeoJSON RFC 7946 exige le sens trigonométrique (anti-horaire).",
    );
  }

  const isValid = intersections.length === 0 && duplicateIndices.length === 0;

  return {
    isValid,
    hasSelfIntersections: intersections.length > 0,
    intersections,
    duplicateVerticesIndices: duplicateIndices,
    orientation,
    isRfc7946Compliant,
    warnings,
  };
}

/**
 * Calcule la surface géodésique avec propagation formelle des incertitudes
 * de positionnement GPS selon la formule différentielle de Gauss-Shoelace (Mikhail & Gracie, 1981).
 */
export function calculateParcelAreaWithUncertainty(
  vertices: SurveyVertexWithAccuracy[],
  defaultGpsAccuracyM: number = 3.5,
): ParcelAreaWithUncertaintyResult {
  const n = vertices.length;
  const topology = validateParcelTopology(vertices);

  if (n < 3) {
    throw new Error("Un polygone doit comporter au moins 3 sommets pour calculer sa surface.");
  }

  // 1. Surface et périmètre géodésiques exacts sur ellipsoïde WGS84
  const areaResult = calculateGeodesicPolygonArea(vertices);
  const areaM2 = areaResult.areaM2;
  const areaHa = areaResult.areaHa;

  // 2. Projection en coordonnées métriques planes locales pour la matrice jacobienne
  const utmCoords = vertices.map((v) => projectLatLonToUtm(v));

  // 3. Propagation d'erreur de Gauss sur la surface Shoelace :
  // S = 1/2 sum(x_i y_{i+1} - x_{i+1} y_i)
  // dS/dx_i = (y_{i+1} - y_{i-1}) / 2
  // dS/dy_i = (x_{i-1} - x_{i+1}) / 2
  // Pour une incertitude de position horizontale sigma_i, sigma_x = sigma_y = sigma_i / sqrt(2)
  // sigma_S² = 1/8 * sum [ sigma_i² * ((y_{i+1} - y_{i-1})² + (x_{i+1} - x_{i-1})²) ]
  let sumVariance = 0;
  for (let i = 0; i < n; i++) {
    const prev = (i - 1 + n) % n;
    const next = (i + 1) % n;

    const dx = utmCoords[next].eastingM - utmCoords[prev].eastingM;
    const dy = utmCoords[next].northingM - utmCoords[prev].northingM;
    const chordSq = dx * dx + dy * dy;

    // Précision 1-sigma du récepteur GPS à ce sommet
    const sigmaGps = vertices[i].horizontalAccuracyM ?? defaultGpsAccuracyM;
    sumVariance += (sigmaGps * sigmaGps * chordSq) / 8.0;
  }

  const sigmaAreaM2 = Math.sqrt(sumVariance);
  const sigmaAreaHa = sigmaAreaM2 / 10000;

  // Intervalle de confiance à 95% (facteur d'élargissement k = 1.96 pour distribution normale)
  const margin95M2 = 1.96 * sigmaAreaM2;
  const margin95Ha = 1.96 * sigmaAreaHa;

  const minHa = Math.max(0, areaHa - margin95Ha);
  const maxHa = areaHa + margin95Ha;
  const relativeUncertaintyPercent = areaM2 > 0 ? (margin95M2 / areaM2) * 100 : 0;

  // Qualification métrologique de la mesure
  const avgAccuracy =
    vertices.reduce((s, v) => s + (v.horizontalAccuracyM ?? defaultGpsAccuracyM), 0) / n;
  let surveyQualityGrade: ParcelAreaWithUncertaintyResult["surveyQualityGrade"];
  if (avgAccuracy <= 0.05) {
    surveyQualityGrade = "cadastral_centimetric"; // RTK / GNSS différentiel centimétrique
  } else if (avgAccuracy <= 1.5) {
    surveyQualityGrade = "metric_professional"; // DGPS submétrique
  } else {
    surveyQualityGrade = "recreational_approximate"; // GPS autonome standard / smartphone
  }

  const provenance = createProvenance(
    "CadastralUncertaintyEngine",
    "1.0.0",
    [
      {
        name: "Propagation des incertitudes de surface par coordonnées",
        reference: "Mikhail E.M. & Gracie G. (1981) Analysis and Adjustment of Survey Measurements",
      },
      {
        name: "Surface géodésique sur ellipsoïde WGS84",
        reference: "Karney C.F.F. (2013) Journal of Geodesy 87(1)",
      },
      {
        name: "Guide pour l'expression de l'incertitude de mesure (GUM)",
        reference: "JCGM 100:2008 Evaluation of measurement data",
      },
    ],
    [
      "Incertitudes de positionnement isotropes et non corrélées entre sommets",
      "Facteur d'élargissement de Student/Gauss k = 1.96 (niveau de confiance 95%)",
    ],
    topology.warnings,
  );

  return {
    areaM2,
    areaHa,
    sigmaAreaM2,
    sigmaAreaHa,
    margin95M2,
    margin95Ha,
    confidenceIntervalHa95: [minHa, maxHa],
    relativeUncertaintyPercent,
    surveyQualityGrade,
    topology,
    provenance,
  };
}
