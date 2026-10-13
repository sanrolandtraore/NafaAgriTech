/**
 * Propriétés physiques de l'eau liquide en fonction de la température.
 *
 * Références :
 * - Masse volumique : Tanaka M. et al. (2001), "Recommended table for the density
 *   of water between 0 °C and 40 °C based on recent experimental reports",
 *   Metrologia 38, 301-309 (formule CIPM).
 * - Viscosité dynamique : équation de Vogel, constantes A = 2.414e-5 Pa·s,
 *   B = 247.8 K, C = 140 K (écart < 1 % entre 0 et 100 °C).
 * - Pression de vapeur saturante : équation de Buck (1996), Buck A. L. (1981)
 *   J. Appl. Meteorol. 20, 1527-1532, version révisée.
 */

export const GRAVITY = 9.80665; // m/s², valeur normale (CGPM 1901)

export interface WaterProperties {
  temperatureC: number;
  /** kg/m³ */
  density: number;
  /** Pa·s */
  dynamicViscosity: number;
  /** m²/s */
  kinematicViscosity: number;
  /** kPa */
  vaporPressureKpa: number;
  /** Pression de vapeur exprimée en mètres de colonne d'eau à cette température. */
  vaporPressureHead: number;
}

function assertTemperature(t: number): void {
  if (!Number.isFinite(t) || t < 0 || t > 60) {
    throw new RangeError(
      `Température de l'eau hors domaine de validité (0-60 °C) : ${t}`,
    );
  }
}

/** Masse volumique (kg/m³), formule CIPM de Tanaka et al. (2001). */
export function waterDensity(temperatureC: number): number {
  assertTemperature(temperatureC);
  const a1 = -3.983035;
  const a2 = 301.797;
  const a3 = 522528.9;
  const a4 = 69.34881;
  const a5 = 999.97495;
  const t = temperatureC;
  return a5 * (1 - ((t + a1) ** 2 * (t + a2)) / (a3 * (t + a4)));
}

/** Viscosité dynamique (Pa·s), équation de Vogel. */
export function waterDynamicViscosity(temperatureC: number): number {
  assertTemperature(temperatureC);
  const tK = temperatureC + 273.15;
  return 2.414e-5 * 10 ** (247.8 / (tK - 140));
}

/** Viscosité cinématique (m²/s). */
export function waterKinematicViscosity(temperatureC: number): number {
  return waterDynamicViscosity(temperatureC) / waterDensity(temperatureC);
}

/** Pression de vapeur saturante (kPa), équation de Buck (1996). */
export function waterVaporPressureKpa(temperatureC: number): number {
  assertTemperature(temperatureC);
  const t = temperatureC;
  return 0.61121 * Math.exp((18.678 - t / 234.5) * (t / (257.14 + t)));
}

export function getWaterProperties(temperatureC: number): WaterProperties {
  const density = waterDensity(temperatureC);
  const dynamicViscosity = waterDynamicViscosity(temperatureC);
  const vaporPressureKpa = waterVaporPressureKpa(temperatureC);
  return {
    temperatureC,
    density,
    dynamicViscosity,
    kinematicViscosity: dynamicViscosity / density,
    vaporPressureKpa,
    vaporPressureHead: (vaporPressureKpa * 1000) / (density * GRAVITY),
  };
}

/**
 * Pression atmosphérique (kPa) selon l'altitude, atmosphère normalisée
 * (FAO-56 éq. 7, issue de l'atmosphère standard) : P = 101.3 ((293 - 0.0065 z)/293)^5.26
 */
export function atmosphericPressureKpa(altitudeM: number): number {
  if (!Number.isFinite(altitudeM) || altitudeM < -500 || altitudeM > 6000) {
    throw new RangeError(`Altitude hors domaine (-500 à 6000 m) : ${altitudeM}`);
  }
  return 101.3 * ((293 - 0.0065 * altitudeM) / 293) ** 5.26;
}

/** Conversion d'une pression (kPa) en hauteur d'eau (m) pour une masse volumique donnée. */
export function kpaToHead(kpa: number, density: number): number {
  return (kpa * 1000) / (density * GRAVITY);
}

/** Conversion d'une hauteur d'eau (m) en pression (kPa). */
export function headToKpa(head: number, density: number): number {
  return (head * density * GRAVITY) / 1000;
}
