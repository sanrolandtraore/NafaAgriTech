/**
 * Calcul exact du NPSH disponible (NPSHa) et analyse de cavitation
 * 
 * Références normatives & scientifiques :
 * - ISO 9906:2012 - Rotodynamic pumps - Hydraulic performance acceptance tests
 * - ANSI/HI 9.6.1-2017 - Rotodynamic Pumps Guideline for NPSH Margin
 * - FAO-56 Irrigation and Drainage Paper 56 (formule barométrique)
 * - Buck (1996) & CIPM Tanaka (2001) pour les propriétés de l'eau
 */

import {
  atmosphericPressureKpa,
  waterVaporPressureKpa,
  waterDensity,
  waterKinematicViscosity,
  GRAVITY,
} from "./waterProperties";
import { pipeArea, pipeFrictionLoss, minorLoss } from "./friction";
import { Provenance, createProvenance } from "../provenance";

export interface SuctionPipeSpec {
  /** Longueur de la conduite d'aspiration (m) */
  lengthM: number;
  /** Diamètre intérieur (m) */
  diameterM: number;
  /** Rugosité absolue (m), ex: 0.000007 pour PEHD, 0.00015 pour acier galvanisé */
  roughnessM: number;
  /** Somme des coefficients de pertes singulières (crépine, clapet de pied, coudes) */
  minorLossCoefficientK?: number;
}

export interface NpshInput {
  /** Débit de fonctionnement (m³/s) */
  flowM3s: number;
  /**
   * NPSH requis fourni par le constructeur de la pompe pour ce débit (m).
   * Si non fourni, le calcul fournira NPSHa sans verdict comparatif.
   */
  npshRequiredM?: number;
  /** Altitude géographique de l'installation (m au-dessus du niveau de la mer) */
  altitudeM: number;
  /** Température de l'eau (°C), défaut 20°C */
  waterTemperatureC?: number;
  /**
   * Dénivelé géométrique entre le plan d'eau et l'axe de la pompe (m).
   * Convention : 
   * - positif si la pompe est EN CHARGE (plan d'eau plus haut que la pompe)
   * - négatif si la pompe est EN ASPIRATION (pompe située au-dessus du plan d'eau)
   */
  staticSuctionHeadM: number;
  /** Conduite d'aspiration */
  suctionPipe: SuctionPipeSpec;
  /** Accélération de la pesanteur (m/s²), défaut 9.80665 */
  gravity?: number;
  /** Pression atmosphérique mesurée manuellement au baromètre (Pa), optionnel */
  measuredAtmosphericPressurePa?: number;
}

export type CavitationRisk = "safe" | "marginal" | "critical_cavitation";

export interface NpshAnalysisResult {
  /** Pression atmosphérique retenue (Pa) */
  atmosphericPressurePa: number;
  /** Charge de pression atmosphérique (m de colonne d'eau) */
  atmosphericHeadM: number;
  /** Pression de vapeur saturante (Pa) */
  vaporPressurePa: number;
  /** Charge de pression de vapeur (m de colonne d'eau) */
  vaporPressureHeadM: number;
  /** Pertes de charge totales dans la conduite d'aspiration (m) */
  suctionHeadLossM: number;
  /** Vitesse moyenne dans l'aspiration (m/s) */
  suctionVelocityMs: number;
  /** NPSH disponible calculé (m) */
  npshAvailableM: number;
  /** NPSH requis (m) */
  npshRequiredM?: number;
  /** Marge disponible : NPSHa - NPSHr (m) */
  marginM?: number;
  /** Marge minimale recommandée selon ANSI/HI 9.6.1 (m) */
  recommendedMarginM?: number;
  /** Évaluation du risque */
  risk: CavitationRisk;
  /** Hauteur maximale d'aspiration admissible (m) pour garder la marge recommandée */
  maxPermissibleSuctionLiftM?: number;
  /** Traçabilité scientifique complète */
  provenance: Provenance;
}

/**
 * Calcule le NPSH disponible (NPSHa) et évalue le risque de cavitation
 * selon la norme ANSI/HI 9.6.1 et ISO 9906.
 */
export function calculateNpsh(input: NpshInput): NpshAnalysisResult {
  const g = input.gravity ?? GRAVITY;
  const tempC = input.waterTemperatureC ?? 20;

  if (input.flowM3s <= 0) {
    throw new Error("Le débit doit être strictement positif pour calculer le NPSH.");
  }
  if (input.suctionPipe.diameterM <= 0 || input.suctionPipe.lengthM <= 0) {
    throw new Error("Les dimensions de la conduite d'aspiration doivent être strictement positives.");
  }

  // 1. Masse volumique et pression de vapeur (Pa)
  const rho = waterDensity(tempC);
  const pVapor = waterVaporPressureKpa(tempC) * 1000;

  // 2. Pression atmosphérique (Pa)
  const pAtm =
    input.measuredAtmosphericPressurePa !== undefined
      ? input.measuredAtmosphericPressurePa
      : atmosphericPressureKpa(input.altitudeM) * 1000;

  const atmHead = pAtm / (rho * g);
  const vaporHead = pVapor / (rho * g);

  // 3. Hydraulique d'aspiration
  const area = pipeArea(input.suctionPipe.diameterM);
  const velocity = input.flowM3s / area;
  const nu = waterKinematicViscosity(tempC);

  const linearLoss = pipeFrictionLoss({
    flowM3s: input.flowM3s,
    lengthM: input.suctionPipe.lengthM,
    diameterM: input.suctionPipe.diameterM,
    kinematicViscosity: nu,
    roughness: input.suctionPipe.roughnessM * 1000, // conversion m -> mm
    formula: "D-W",
    frictionModel: "colebrook",
    gravity: g,
  });

  const minor = minorLoss(
    input.flowM3s,
    input.suctionPipe.diameterM,
    input.suctionPipe.minorLossCoefficientK ?? 0,
    g,
  );

  const totalSuctionHeadLossM = linearLoss.headLossM + minor.headLossM;

  // 4. NPSH disponible : NPSHa = (P_atm - P_v)/(rho*g) + Z_s - hf_aspiration
  // Rappel : Z_s est algébrique (+ si en charge, - si au-dessus du plan d'eau)
  const npshAvailable = atmHead - vaporHead + input.staticSuctionHeadM - totalSuctionHeadLossM;

  // 5. Comparaison au NPSH requis
  let margin: number | undefined;
  let recommendedMargin: number | undefined;
  let risk: CavitationRisk = "safe";
  let maxPermissibleSuctionLiftM: number | undefined;

  const warnings: string[] = [];

  // Vitesse recommandée à l'aspiration : <= 1.5 m/s pour limiter les pertes et la turbulence
  if (velocity > 1.8) {
    warnings.push(
      `Vitesse d'aspiration élevée (${velocity.toFixed(2)} m/s). La norme recommande v <= 1.2 à 1.5 m/s à l'aspiration pour éviter tourbillons et décollements.`,
    );
  }

  if (input.npshRequiredM !== undefined) {
    if (input.npshRequiredM < 0) {
      throw new Error("NPSH requis constructeur invalide (doit être >= 0).");
    }
    margin = npshAvailable - input.npshRequiredM;

    // Norme ANSI/HI 9.6.1 : marge minimale = max(0.6 m, 1.15 * NPSHr) pour service d'eau générale
    recommendedMargin = Math.max(0.6, 0.15 * input.npshRequiredM);

    if (margin < 0) {
      risk = "critical_cavitation";
      warnings.push(
        `CAVITATION CRITIQUE : NPSHa (${npshAvailable.toFixed(2)} m) est inférieur au NPSHr constructeur (${input.npshRequiredM.toFixed(2)} m). Risque immédiat de destruction de la roue et perte de débit.`,
      );
    } else if (margin < recommendedMargin) {
      risk = "marginal";
      warnings.push(
        `Marge NPSH insuffisante (${margin.toFixed(2)} m < ${recommendedMargin.toFixed(2)} m recommandé par ANSI/HI 9.6.1). Cavitation partielle probable lors de hausses de température ou baisses du plan d'eau.`,
      );
    } else {
      risk = "safe";
    }

    // Hauteur géométrique maximale d'aspiration (valeur absolue de la hauteur au-dessus du plan d'eau)
    // NPSHa_min = atmHead - vaporHead - Z_lift_max - totalSuctionHeadLossM >= NPSHr + recommendedMargin
    // Z_lift_max = atmHead - vaporHead - totalSuctionHeadLossM - (NPSHr + recommendedMargin)
    const rawLiftMax = atmHead - vaporHead - totalSuctionHeadLossM - (input.npshRequiredM + recommendedMargin);
    maxPermissibleSuctionLiftM = Math.max(0, rawLiftMax);
  }

  const provenance = createProvenance(
    "NpshCavitationEngine",
    "1.0.0",
    [
      {
        name: "Bernoulli d'aspiration & NPSHa",
        reference: "ISO 9906:2012 Rotodynamic pumps - Hydraulic performance acceptance tests",
      },
      {
        name: "Marge NPSH de sécurité",
        reference: "ANSI/HI 9.6.1-2017 Rotodynamic Pumps Guideline for NPSH Margin",
      },
      {
        name: "Pression barométrique",
        reference: "FAO-56 Equation 7 (formule barométrique internationale)",
      },
      {
        name: "Pression de vapeur saturante",
        reference: "Buck A.L. (1996) Arden Buck Equation pour la pression de vapeur saturante",
      },
      {
        name: "Masse volumique de l'eau",
        reference: "Tanaka M. et al. (2001) Formule CIPM, Metrologia 38, 301-309",
      },
    ],
    [
      "Régime permanent d'écoulement à débit constant",
      "Écoulement monophasique liquide homogène",
      "Température de l'eau uniforme le long de l'aspiration",
    ],
    warnings,
  );

  return {
    atmosphericPressurePa: pAtm,
    atmosphericHeadM: atmHead,
    vaporPressurePa: pVapor,
    vaporPressureHeadM: vaporHead,
    suctionHeadLossM: totalSuctionHeadLossM,
    suctionVelocityMs: velocity,
    npshAvailableM: npshAvailable,
    npshRequiredM: input.npshRequiredM,
    marginM: margin,
    recommendedMarginM: recommendedMargin,
    risk,
    maxPermissibleSuctionLiftM,
    provenance,
  };
}
