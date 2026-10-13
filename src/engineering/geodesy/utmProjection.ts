/**
 * Projection Transverse Universelle de Mercator (UTM) exacte sur ellipsoïde WGS84
 * Séries de Krüger d'ordre 6 (conformes EPSG / NGA)
 * Gestion bizonale complète de l'Afrique de l'Ouest (Zone 30N et Zone 31N)
 * 
 * Références normatives :
 * - Krüger L. (1912) - Konforme Abbildung des Erdellipsoids in der Ebene,
 *   Königlich Preussisches Geodätisches Institut, Neue Folge 52, Potsdam.
 * - Karney C.F.F. (2011) - Transverse Mercator with an accuracy of a few nanometers.
 *   Journal of Geodesy 85(8): 475-485.
 * - EPSG Guidance Note 7-2: Coordinate Conversions & Transformations including Formulas.
 */

import { WGS84, LatLonPoint } from "./wgs84Ellipsoid";
import { Provenance, createProvenance } from "../provenance";

export interface UtmCoordinate {
  /** Coordonnée Esting E en mètres (Faux Est = 500 000 m au méridien central) */
  eastingM: number;
  /** Coordonnée Northing N en mètres (Faux Nord = 0 m à l'Équateur pour l'hémisphère Nord) */
  northingM: number;
  /** Numéro du fuseau UTM (ex: 30 ou 31 pour le Burkina Faso) */
  zoneNumber: number;
  /** Hémisphère ("N" ou "S") */
  hemisphere: "N" | "S";
  /** Code EPSG officiel (ex: "EPSG:32630" pour WGS 84 / UTM zone 30N) */
  epsgCode: string;
  /** Méridien central du fuseau en degrés */
  centralMeridianDeg: number;
  /** Facteur d'échelle ponctuel k (environ 0.9996 au méridien central, 1.000 à ~180 km) */
  scaleFactorK: number;
  /** Convergence des méridiens gamma en degrés (angle entre Nord géographique et Nord grille) */
  convergenceDeg: number;
  /** Traçabilité scientifique */
  provenance: Provenance;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Détermine le fuseau UTM standard (1 à 60) à partir de la longitude décimale.
 * Pour le Burkina Faso :
 * - Longitude < 0° (Ouest de Greenwich, incluant Ouagadougou, Bobo, Koudougou) -> Zone 30N
 * - Longitude >= 0° (Est de Greenwich, incluant Fada N'Gourma, Diapaga) -> Zone 31N
 */
export function getUtmZoneNumber(lng: number): number {
  let normalizedLng = ((lng + 180) % 360) - 180;
  if (normalizedLng < -180) normalizedLng += 360;
  return Math.floor((normalizedLng + 180) / 6) + 1;
}

/**
 * Calcule la longitude du méridien central d'un fuseau UTM donné (en degrés).
 * Formule : lambda0 = 6 * zone - 183
 */
export function getUtmCentralMeridian(zoneNumber: number): number {
  if (zoneNumber < 1 || zoneNumber > 60) {
    throw new RangeError(`Zone UTM invalide (1 à 60) : ${zoneNumber}`);
  }
  return 6 * zoneNumber - 183;
}

/**
 * Projection directe exacte WGS84 (Lat, Lng) -> UTM (E, N)
 * selon les séries de Krüger d'ordre 6.
 * Précision : micrométrique (< 0.1 mm) par rapport aux tables de référence NGA.
 */
export function projectLatLonToUtm(
  point: LatLonPoint,
  forcedZoneNumber?: number,
): UtmCoordinate {
  const { lat, lng } = point;

  if (lat < -80 || lat > 84) {
    throw new RangeError(`Latitude hors domaine standard UTM (-80° à +84°) : ${lat}`);
  }

  const zoneNumber = forcedZoneNumber ?? getUtmZoneNumber(lng);
  const hemisphere = lat >= 0 ? "N" : "S";
  const centralMeridianDeg = getUtmCentralMeridian(zoneNumber);
  const centralMeridianRad = centralMeridianDeg * DEG_TO_RAD;

  const phi = lat * DEG_TO_RAD;
  const lambda = lng * DEG_TO_RAD;
  const dLambda = lambda - centralMeridianRad;

  const { a, f } = WGS84;
  const k0 = 0.9996; // Facteur d'échelle central UTM
  const falseEasting = 500000.0;
  const falseNorthing = hemisphere === "N" ? 0.0 : 10000000.0;

  // Troisième aplatissement n = f / (2 - f)
  const n = f / (2 - f);
  const n2 = n * n;
  const n3 = n2 * n;
  const n4 = n3 * n;
  const n5 = n4 * n;
  const n6 = n5 * n;

  // Rayon de la sphère conforme A
  const A =
    (a / (1 + n)) *
    (1 + (1 / 4) * n2 + (1 / 64) * n4 + (1 / 256) * n6);

  // Coefficients alpha de Krüger (ordre 6)
  const a1 = (1 / 2) * n - (2 / 3) * n2 + (5 / 16) * n3 + (41 / 180) * n4 - (127 / 288) * n5 + (7891 / 37800) * n6;
  const a2 = (13 / 48) * n2 - (3 / 5) * n3 + (557 / 1440) * n4 + (281 / 630) * n5 - (1983433 / 1935360) * n6;
  const a3 = (61 / 240) * n3 - (103 / 140) * n4 + (15061 / 26880) * n5 + (167603 / 181440) * n6;
  const a4 = (49561 / 161280) * n4 - (179 / 168) * n5 + (6601661 / 7257600) * n6;
  const a5 = (34729 / 80640) * n5 - (3418889 / 1995840) * n6;
  const a6 = (212378941 / 319334400) * n6;

  // Latitude conforme psi
  const sinPhi = Math.sin(phi);
  const e = Math.sqrt(WGS84.e2);
  const tau = Math.tan(phi);
  const sigma = Math.sinh(e * Math.atanh(e * sinPhi));
  const tauPrime = tau * Math.sqrt(1 + sigma * sigma) - sigma * Math.sqrt(1 + tau * tau);

  const xiPrime = Math.atan2(tauPrime, Math.cos(dLambda));
  const etaPrime = Math.asinh(Math.sin(dLambda) / Math.sqrt(tauPrime * tauPrime + Math.cos(dLambda) * Math.cos(dLambda)));

  // Séries de Krüger
  let xi = xiPrime;
  let eta = etaPrime;
  let pPrime = 1.0;
  let qPrime = 0.0;

  const alphas = [a1, a2, a3, a4, a5, a6];
  for (let j = 1; j <= 6; j++) {
    const alphaJ = alphas[j - 1];
    const twoJ = 2 * j;
    xi += alphaJ * Math.sin(twoJ * xiPrime) * Math.cosh(twoJ * etaPrime);
    eta += alphaJ * Math.cos(twoJ * xiPrime) * Math.sinh(twoJ * etaPrime);

    pPrime += twoJ * alphaJ * Math.cos(twoJ * xiPrime) * Math.cosh(twoJ * etaPrime);
    qPrime += twoJ * alphaJ * Math.sin(twoJ * xiPrime) * Math.sinh(twoJ * etaPrime);
  }

  const eastingM = falseEasting + k0 * A * eta;
  const northingM = falseNorthing + k0 * A * xi;

  // Facteur d'échelle ponctuel k et convergence méridienne gamma
  const gammaPrime = Math.atan(Math.tan(xiPrime) * Math.tanh(etaPrime));
  const gamma = Math.atan2(qPrime, pPrime) + gammaPrime;
  const convergenceDeg = gamma * RAD_TO_DEG;

  // Facteur d'échelle ponctuel k selon EPSG Guidance Note 7-2 (série de Krüger)
  const ep2 = WGS84.ep2;
  const cosPhi = Math.cos(phi);
  const cos2Phi = cosPhi * cosPhi;
  const tanPhi = Math.tan(phi);
  const tan2Phi = tanPhi * tanPhi;
  const dLamCos = dLambda * cosPhi;
  const dLamCos2 = dLamCos * dLamCos;
  const dLamCos4 = dLamCos2 * dLamCos2;

  const term2 = (1 / 2) * dLamCos2 * (1 + ep2 * cos2Phi);
  const term4 = (1 / 24) * dLamCos4 * (5 - 4 * tan2Phi + 9 * ep2 * cos2Phi);
  const scaleFactorK = k0 * (1 + term2 + term4);

  const epsgCode = `EPSG:${hemisphere === "N" ? 32600 + zoneNumber : 32700 + zoneNumber}`;

  const provenance = createProvenance(
    "UtmKrugerEngine",
    "1.0.0",
    [
      {
        name: "Projection Transverse de Mercator exacte (Krüger ordre 6)",
        reference: "Krüger L. (1912) Königlich Preussisches Geodätisches Institut 52 / Karney (2011)",
      },
      {
        name: "Standard EPSG WGS 84 / UTM",
        reference: `EPSG Geodetic Parameter Registry ${epsgCode}`,
      },
    ],
    [
      `Fuseau UTM ${zoneNumber}${hemisphere}`,
      `Méridien central : ${centralMeridianDeg}°`,
      "Ellipsoïde WGS84",
    ],
    [],
  );

  return {
    eastingM,
    northingM,
    zoneNumber,
    hemisphere,
    epsgCode,
    centralMeridianDeg,
    scaleFactorK,
    convergenceDeg,
    provenance,
  };
}

/**
 * Détecte si un groupe de sommets chevauche une limite de fuseau UTM (ex: 0° entre 30N et 31N).
 * Renvoie le fuseau optimal et signale une alerte si le franchissement de fuseau est détecté.
 */
export function analyzeParcelUtmZone(points: LatLonPoint[]): {
  recommendedZone: number;
  crossesZoneBoundary: boolean;
  zonesDetected: number[];
  meanLongitudeDeg: number;
} {
  if (points.length === 0) {
    return { recommendedZone: 30, crossesZoneBoundary: false, zonesDetected: [30], meanLongitudeDeg: -1.5 };
  }

  const zones = Array.from(new Set(points.map((p) => getUtmZoneNumber(p.lng))));
  const meanLng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  const recommendedZone = getUtmZoneNumber(meanLng);

  return {
    recommendedZone,
    crossesZoneBoundary: zones.length > 1,
    zonesDetected: zones,
    meanLongitudeDeg: meanLng,
  };
}
