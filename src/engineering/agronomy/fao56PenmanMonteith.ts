/**
 * Moteur officiel FAO-56 : Évapotranspiration de Référence (ET0) Penman-Monteith
 * et Besoins en Eau des Cultures (ETc).
 * 
 * Référence bibliographique & normative :
 * Allen R.G., Pereira L.S., Raes D., Smith M. (1998)
 * "Crop evapotranspiration - Guidelines for computing crop water requirements"
 * FAO Irrigation and Drainage Paper No. 56, Food and Agriculture Organization of the
 * United Nations, Rome, Italie. ISBN 92-5-104219-5.
 */

import { Provenance, createProvenance } from "../provenance";

export interface Fao56DailyWeatherInput {
  /** Latitude de la station en degrés décimaux (positif = Nord, négatif = Sud) */
  latitudeDeg: number;
  /** Altitude de la station au-dessus du niveau de la mer (m) */
  altitudeM: number;
  /** Jour de l'année (1 à 365/366) */
  dayOfYear: number;
  /** Température maximale quotidienne de l'air (°C) */
  tMaxC: number;
  /** Température minimale quotidienne de l'air (°C) */
  tMinC: number;
  /** Vitesse moyenne du vent mesurée à 2 m de hauteur (m/s) */
  windSpeed2mMs: number;
  /**
   * Humidité de l'air (fournir AU MOINS UNE des options suivantes) :
   * - rhMaxPercent et rhMinPercent (recommandé FAO-56 éq. 17)
   * - rhMeanPercent (éq. 19)
   * - tDewC (température du point de rosée, éq. 14)
   * - actualVaporPressureKpa (mesure directe de ea)
   */
  rhMaxPercent?: number;
  rhMinPercent?: number;
  rhMeanPercent?: number;
  tDewC?: number;
  actualVaporPressureKpa?: number;
  /**
   * Ensoleillement / Rayonnement solaire :
   * - solarRadiationRsMjM2Day : Rayonnement solaire global mesuré (MJ/m²/jour)
   * - sunshineHoursActualN : Durée d'insolation réelle n (heures)
   * Si aucun n'est fourni, la formule de Hargreaves pour Rs estimé (éq. 50) sera utilisée.
   */
  solarRadiationRsMjM2Day?: number;
  sunshineHoursActualN?: number;
}

export interface Fao56Et0IntermediateResult {
  /** Pression atmosphérique (kPa) - éq. 7 */
  atmosphericPressureKpa: number;
  /** Constante psychrométrique gamma (kPa/°C) - éq. 8 */
  psychrometricConstantGamma: number;
  /** Température moyenne quotidienne (°C) - éq. 9 */
  tMeanC: number;
  /** Pression de vapeur saturante e0(Tmax) (kPa) - éq. 11 */
  e0TmaxKpa: number;
  /** Pression de vapeur saturante e0(Tmin) (kPa) - éq. 11 */
  e0TminKpa: number;
  /** Pression moyenne de vapeur saturante es (kPa) - éq. 12 */
  esKpa: number;
  /** Pente de la courbe de pression de vapeur saturante Delta (kPa/°C) - éq. 13 */
  deltaSlopeKpaPerC: number;
  /** Pression de vapeur réelle ea (kPa) - éq. 14-19 */
  eaKpa: number;
  /** Déficit de pression de vapeur (es - ea) (kPa) */
  vaporPressureDeficitKpa: number;
  /** Rayonnement extraterrestre Ra (MJ/m²/jour) - éq. 21 */
  extraterrestrialRadiationRa: number;
  /** Durée maximale d'insolation théorique N (heures) - éq. 34 */
  maxDaylightHoursN: number;
  /** Rayonnement solaire global Rs retenu (MJ/m²/jour) - éq. 35 ou 50 */
  solarRadiationRsMjM2Day: number;
  /** Rayonnement de ciel clair Rso (MJ/m²/jour) - éq. 36 ou 37 */
  clearSkyRadiationRso: number;
  /** Rayonnement net d'ondes courtes Rns (MJ/m²/jour) - éq. 38 */
  netShortwaveRadiationRns: number;
  /** Rayonnement net d'ondes longues Rnl (MJ/m²/jour) - éq. 39 */
  netLongwaveRadiationRnl: number;
  /** Rayonnement net total Rn (MJ/m²/jour) - éq. 40 */
  netRadiationRnMjM2Day: number;
  /** Terme radiatif Penman-Monteith (mm/jour) */
  radiationTermMmDay: number;
  /** Terme aérodynamique Penman-Monteith (mm/jour) */
  aerodynamicTermMmDay: number;
}

export interface Fao56Et0Result {
  /** Évapotranspiration de référence Penman-Monteith ET0 (mm/jour) - éq. 6 */
  et0MmDay: number;
  /** Détail des variables intermédiaires */
  intermediates: Fao56Et0IntermediateResult;
  /** Traçabilité scientifique */
  provenance: Provenance;
}

/**
 * Calcule l'évapotranspiration de référence journalière ET0 selon la méthode
 * standard universelle FAO-56 Penman-Monteith (Allen et al., 1998).
 */
export function calculateFao56DailyEt0(input: Fao56DailyWeatherInput): Fao56Et0Result {
  const { latitudeDeg, altitudeM, dayOfYear, tMaxC, tMinC, windSpeed2mMs } = input;

  if (dayOfYear < 1 || dayOfYear > 366) {
    throw new RangeError(`Jour de l'année invalide (1 à 366) : ${dayOfYear}`);
  }
  if (tMaxC < tMinC) {
    throw new RangeError(`Tmax (${tMaxC}°C) ne peut pas être inférieur à Tmin (${tMinC}°C)`);
  }
  if (windSpeed2mMs < 0) {
    throw new RangeError(`La vitesse du vent ne peut pas être négative : ${windSpeed2mMs}`);
  }

  // Équation 9 : Température moyenne quotidienne Tmean = (Tmax + Tmin) / 2
  const tMeanC = (tMaxC + tMinC) / 2;

  // Équation 7 : Pression atmosphérique P (kPa)
  const atmosphericPressureKpa = 101.3 * Math.pow((293 - 0.0065 * altitudeM) / 293, 5.26);

  // Équation 8 : Constante psychrométrique gamma (kPa/°C)
  // gamma = 0.665e-3 * P
  const psychrometricConstantGamma = 0.665e-3 * atmosphericPressureKpa;

  // Équation 11 : Pression de vapeur saturante e0(T) = 0.6108 * exp(17.27 * T / (T + 237.3))
  const satVaporPressure = (t: number) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3));
  const e0TmaxKpa = satVaporPressure(tMaxC);
  const e0TminKpa = satVaporPressure(tMinC);

  // Équation 12 : Pression moyenne de vapeur saturante es = (e0(Tmax) + e0(Tmin)) / 2
  const esKpa = (e0TmaxKpa + e0TminKpa) / 2;

  // Équation 13 : Pente de la courbe de pression de vapeur saturante Delta (kPa/°C)
  const deltaSlopeKpaPerC =
    (4098 * (0.6108 * Math.exp((17.27 * tMeanC) / (tMeanC + 237.3)))) /
    Math.pow(tMeanC + 237.3, 2);

  // Équations 14-19 : Pression de vapeur réelle ea (kPa)
  let eaKpa: number;
  if (input.actualVaporPressureKpa !== undefined) {
    eaKpa = input.actualVaporPressureKpa;
  } else if (input.tDewC !== undefined) {
    // Équation 14
    eaKpa = satVaporPressure(input.tDewC);
  } else if (input.rhMaxPercent !== undefined && input.rhMinPercent !== undefined) {
    // Équation 17 (méthode recommandée FAO-56)
    eaKpa = (e0TminKpa * (input.rhMaxPercent / 100) + e0TmaxKpa * (input.rhMinPercent / 100)) / 2;
  } else if (input.rhMaxPercent !== undefined) {
    // Équation 18
    eaKpa = e0TminKpa * (input.rhMaxPercent / 100);
  } else if (input.rhMeanPercent !== undefined) {
    // Équation 19
    eaKpa = (input.rhMeanPercent / 100) * ((e0TmaxKpa + e0TminKpa) / 2);
  } else {
    // En absence totale de données d'humidité : hypothèse Tdew ≈ Tmin (FAO-56 p. 58)
    eaKpa = e0TminKpa;
  }

  // Sécurité physique : ea ne peut pas dépasser es
  eaKpa = Math.min(eaKpa, esKpa);
  const vaporPressureDeficitKpa = Math.max(0, esKpa - eaKpa);

  // Équation 22 : Conversion latitude en radians phi
  const phi = (Math.PI / 180) * latitudeDeg;

  // Équation 23 : Distance relative Terre-Soleil dr
  const dr = 1 + 0.033 * Math.cos(((2 * Math.PI) / 365) * dayOfYear);

  // Équation 24 : Déclinaison solaire delta (radians)
  const solarDeclination = 0.409 * Math.sin(((2 * Math.PI) / 365) * dayOfYear - 1.39);

  // Équation 25 : Angle horaire au coucher du soleil omega_s (radians)
  const cosOmegaS = -Math.tan(phi) * Math.tan(solarDeclination);
  // Clamping pour zones polaires éventuelles
  const omegaS = Math.acos(Math.max(-1, Math.min(1, cosOmegaS)));

  // Équation 21 : Rayonnement extraterrestre journalier Ra (MJ/m²/jour)
  // Gsc = 0.0820 MJ/m²/min (constante solaire)
  const gsc = 0.082;
  const extraterrestrialRadiationRa =
    ((24 * 60) / Math.PI) *
    gsc *
    dr *
    (omegaS * Math.sin(phi) * Math.sin(solarDeclination) +
      Math.cos(phi) * Math.cos(solarDeclination) * Math.sin(omegaS));

  // Équation 34 : Durée maximale d'insolation N (heures)
  const maxDaylightHoursN = (24 / Math.PI) * omegaS;

  // Équation 35 : Rayonnement solaire global Rs
  let solarRadiationRsMjM2Day: number;
  if (input.solarRadiationRsMjM2Day !== undefined) {
    solarRadiationRsMjM2Day = input.solarRadiationRsMjM2Day;
  } else if (input.sunshineHoursActualN !== undefined) {
    // Formule d'Ångström-Prescott avec constantes FAO par défaut as=0.25, bs=0.50
    const as = 0.25;
    const bs = 0.5;
    solarRadiationRsMjM2Day =
      (as + bs * (input.sunshineHoursActualN / maxDaylightHoursN)) *
      extraterrestrialRadiationRa;
  } else {
    // Équation 50 : Formule de Hargreaves-Samani pour Rs en absence de radiation ou insolation
    // k_Rs = 0.16 pour zones continentales intérieures (défaut Sahel/Afrique de l'Ouest)
    const kRs = 0.16;
    solarRadiationRsMjM2Day =
      kRs * Math.sqrt(Math.max(0, tMaxC - tMinC)) * extraterrestrialRadiationRa;
  }

  // Équation 37 : Rayonnement de ciel clair Rso (MJ/m²/jour)
  const clearSkyRadiationRso = (0.75 + 2e-5 * altitudeM) * extraterrestrialRadiationRa;

  // Équation 38 : Rayonnement net d'ondes courtes Rns (MJ/m²/jour), albédo référence alpha = 0.23
  const alphaAlbedo = 0.23;
  const netShortwaveRadiationRns = (1 - alphaAlbedo) * solarRadiationRsMjM2Day;

  // Équation 39 : Rayonnement net d'ondes longues Rnl (MJ/m²/jour)
  // Constante de Stefan-Boltzmann sigma = 4.903e-9 MJ/K⁴/m²/jour
  const sigmaStefanBoltzmann = 4.903e-9;
  const tMaxK4 = Math.pow(tMaxC + 273.16, 4);
  const tMinK4 = Math.pow(tMinC + 273.16, 4);
  const rsRatio = clearSkyRadiationRso > 0 ? solarRadiationRsMjM2Day / clearSkyRadiationRso : 0.8;
  const clampedRsRatio = Math.min(1.0, Math.max(0.3, rsRatio));

  const netLongwaveRadiationRnl =
    sigmaStefanBoltzmann *
    ((tMaxK4 + tMinK4) / 2) *
    (0.34 - 0.14 * Math.sqrt(eaKpa)) *
    (1.35 * clampedRsRatio - 0.35);

  // Équation 40 : Rayonnement net total Rn (MJ/m²/jour)
  const netRadiationRnMjM2Day = netShortwaveRadiationRns - netLongwaveRadiationRnl;

  // Équation 6 : Équation de Penman-Monteith FAO-56 journalière (G = 0 pour pas journalier)
  // ET0 = [0.408 * Delta * (Rn - G) + gamma * (900 / (T + 273)) * u2 * (es - ea)] / [Delta + gamma * (1 + 0.34 * u2)]
  const numRad = 0.408 * deltaSlopeKpaPerC * netRadiationRnMjM2Day;
  const numAero =
    psychrometricConstantGamma *
    (900 / (tMeanC + 273)) *
    windSpeed2mMs *
    vaporPressureDeficitKpa;
  const denominator =
    deltaSlopeKpaPerC + psychrometricConstantGamma * (1 + 0.34 * windSpeed2mMs);

  const et0MmDay = Math.max(0, (numRad + numAero) / denominator);

  const intermediates: Fao56Et0IntermediateResult = {
    atmosphericPressureKpa,
    psychrometricConstantGamma,
    tMeanC,
    e0TmaxKpa,
    e0TminKpa,
    esKpa,
    deltaSlopeKpaPerC,
    eaKpa,
    vaporPressureDeficitKpa,
    extraterrestrialRadiationRa,
    maxDaylightHoursN,
    solarRadiationRsMjM2Day,
    clearSkyRadiationRso,
    netShortwaveRadiationRns,
    netLongwaveRadiationRnl,
    netRadiationRnMjM2Day,
    radiationTermMmDay: numRad / denominator,
    aerodynamicTermMmDay: numAero / denominator,
  };

  const provenance = createProvenance(
    "Fao56PenmanMonteithEngine",
    "1.0.0",
    [
      {
        name: "Équation FAO-56 Penman-Monteith (éq. 6)",
        reference: "Allen R.G. et al. (1998) FAO Irrigation and Drainage Paper No. 56, Rome",
      },
      {
        name: "Pression de vapeur saturante de Tetens/Buck (éq. 11-13)",
        reference: "Tetens O. (1930) / Buck A.L. (1981) J. Appl. Meteorol.",
      },
      {
        name: "Rayonnement solaire et extraterrestre (éq. 21-40)",
        reference: "Duffie J.A. & Beckman W.A. (1991) Solar Engineering of Thermal Processes",
      },
    ],
    [
      "Surface de référence standardisée : gazon vert hypothétique de 0.12 m de hauteur, rs = 70 s/m, albédo = 0.23",
      "Flux thermique du sol G = 0 MJ/m²/jour sur pas de temps de 24 heures",
      "Vitesse du vent ramenée à 2.0 m de hauteur",
    ],
    [],
  );

  return {
    et0MmDay,
    intermediates,
    provenance,
  };
}
