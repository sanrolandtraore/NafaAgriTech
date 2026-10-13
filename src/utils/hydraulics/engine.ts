/**
 * NAFA FIELD DESIGNER — MOTEUR HYDRAULIQUE DÉTERMINISTE
 * Calculs physiques stricts basés sur les formules de Hazen-Williams et Christiansen.
 * 
 * Références scientifiques & normes :
 * - Formule de Hazen-Williams pour les pertes de charge linéaires en régime turbulent lisse.
 * - Facteur F de Christiansen pour rampes et conduites à sorties multiples équidistantes.
 * - Vitesse d'écoulement et alertes de coup de bélier (v > 2.5 m/s) et sédimentation (v < 0.5 m/s).
 */

import { Provenance, createProvenance } from "@/engineering/provenance";
import {
  pipeFrictionLoss,
  pipeArea,
  reynoldsNumber,
  flowRegime,
  darcyFrictionFactor,
  FlowRegime,
} from "@/engineering/hydraulics/friction";
import { waterKinematicViscosity, GRAVITY } from "@/engineering/hydraulics/waterProperties";
import { solveNetwork, NetworkModel, NetworkSolution } from "@/engineering/hydraulics/networkSolver";
import { calculateNpsh, NpshInput, NpshAnalysisResult as ExactNpshResult } from "@/engineering/hydraulics/npsh";
import {
  evaluateIrrigationUniformity,
  calculateEmitterFlowLh,
  EmitterSpecification,
  UniformityResult,
} from "@/engineering/hydraulics/emitters";

export {
  solveNetwork,
  calculateNpsh,
  evaluateIrrigationUniformity,
  calculateEmitterFlowLh,
  pipeFrictionLoss,
  pipeArea,
  reynoldsNumber,
  flowRegime,
  darcyFrictionFactor,
};
export type { NetworkModel, NetworkSolution, NpshInput, ExactNpshResult, EmitterSpecification, UniformityResult, FlowRegime };

export type PipeMaterial = "PEHD" | "PVC" | "Acier";

export const MATERIAL_ROUGHNESS: Record<PipeMaterial, number> = {
  PEHD: 140,
  PVC: 150,
  Acier: 100,
};

export interface HydraulicInput {
  /** Débit volumique circulant dans la conduite en m³/h */
  flowRate: number;
  /** Pression statique disponible à la source en Bar */
  staticPressure: number;
  /** Longueur totale de la conduite en mètres */
  length: number;
  /** Diamètre intérieur utile de la conduite en millimètres */
  internalDiameter: number;
  /** Type de matériau de la conduite ou coefficient C de Hazen-Williams */
  material?: PipeMaterial;
  /** Coefficient de rugosité C de Hazen-Williams (si personnalisé) */
  roughnessCoefficient?: number;
  /** Dénivelé topographique Δh en mètres (positif si montée, négatif si descente) */
  elevationDifference: number;
  /** Nombre de sorties ou distributeurs équidistants sur la conduite (1 pour conduite simple) */
  outletsCount: number;
  /** Pression minimale requise au point critique en Bar (défaut : 1.0 Bar pour goutte-à-goutte) */
  requiredPressure?: number;
}

export interface HydraulicWarning {
  code: "HAMMER_RISK" | "SEDIMENTATION_RISK" | "INSUFFICIENT_PRESSURE" | "NEGATIVE_PRESSURE" | "EXCESSIVE_HEAD_LOSS";
  level: "warning" | "danger";
  message: string;
}

export interface HydraulicResult {
  /** Vitesse d'écoulement moyenne v en m/s */
  velocity: number;
  /** Facteur de réduction de Christiansen F (sans dimension) */
  christiansenFactor: number;
  /** Perte de charge linéaire unitaire J en m/m */
  unitFrictionLoss: number;
  /** Perte de charge linéaire brute (sans sorties) en mCE */
  plainFrictionLossMce: number;
  /** Perte de charge linéaire effective après facteur de Christiansen en mCE */
  linearFrictionLossMce: number;
  /** Perte de charge linéaire en Bar */
  linearFrictionLossBar: number;
  /** Pertes de charge singulières estimées (raccords/accessoires, 10% des pertes linéaires) en mCE */
  singularLossMce: number;
  /** Pertes de charge singulières en Bar */
  singularLossBar: number;
  /** Impact du dénivelé topographique sur la charge en mCE */
  elevationHeadMce: number;
  /** Impact du dénivelé topographique en Bar */
  elevationHeadBar: number;
  /** Pertes de charge totales cumulées (linéaires + singulières) en mCE */
  totalFrictionLossMce: number;
  /** Pertes de charge totales en Bar */
  totalFrictionLossBar: number;
  /** Pression statique initiale à la source en mCE */
  staticPressureMce: number;
  /** Pression résiduelle au point critique en mCE */
  residualPressureMce: number;
  /** Pression résiduelle au point critique en Bar */
  residualPressureBar: number;
  /** Pression minimale requise en Bar */
  requiredPressureBar: number;
  /** Marge de pression par rapport au besoin en Bar (residual - required) */
  pressureMarginBar: number;
  /** Indicateur si le dimensionnement satisfait la pression requise */
  isPressureAdequate: boolean;
  /** Nombre de Reynolds de l'écoulement */
  reynoldsNumber?: number;
  /** Régime d'écoulement */
  flowRegime?: FlowRegime;
  /** Traçabilité scientifique complète de l'ingénierie */
  provenance?: Provenance;
  /** Liste des alertes et avertissements techniques générés */
  warnings: HydraulicWarning[];
}

export interface HydraulicAnalysis {
  isValid: boolean;
  missingFields: string[];
  input: Partial<HydraulicInput>;
  result: HydraulicResult | null;
  warnings: HydraulicWarning[];
}

/** Facteur de conversion exact : 1 Bar = 10.197162 mCE (eau à 20°C, g = 9.80665 m/s²) */
export const BAR_TO_MCE = 10.197162;
export const MCE_TO_BAR = 1 / BAR_TO_MCE;

/**
 * Calcule le facteur de réduction de Christiansen F pour une conduite à sorties multiples.
 * Formule exacte basée sur Hazen-Williams (exposant m = 1.852) :
 * F = (1 / (m + 1)) + (1 / (2 * N)) + (sqrt(m - 1) / (6 * N²))
 */
export function calculateChristiansenFactor(outletsCount: number): number {
  const n = Math.max(1, Math.round(outletsCount));
  if (n <= 1) return 1.0;

  const m = 1.852;
  const term1 = 1 / (m + 1); // ~0.35063
  const term2 = 1 / (2 * n);
  const term3 = Math.sqrt(m - 1) / (6 * n * n);

  return term1 + term2 + term3;
}

/**
 * Calcule la perte de charge linéaire unitaire selon la formule métrique universelle de Hazen-Williams.
 * J = 10.67 * (Q^1.852) / (C^1.852 * D^4.8704)
 * @param flowRateM3h Débit en m³/h
 * @param internalDiameterMm Diamètre intérieur en mm
 * @param roughnessC Coefficient C de Hazen-Williams
 * @returns Perte de charge unitaire J en mCE / m
 */
export function calculateHazenWilliamsUnitLoss(
  flowRateM3h: number,
  internalDiameterMm: number,
  roughnessC: number
): number {
  if (flowRateM3h <= 0 || internalDiameterMm <= 0 || roughnessC <= 0) return 0;

  const qM3s = flowRateM3h / 3600; // m³/s
  const dM = internalDiameterMm / 1000; // m

  const numerator = 10.67 * Math.pow(qM3s, 1.852);
  const denominator = Math.pow(roughnessC, 1.852) * Math.pow(dM, 4.8704);

  return numerator / denominator;
}

/**
 * Calcule la vitesse d'écoulement moyenne v = Q / A.
 * @param flowRateM3h Débit en m³/h
 * @param internalDiameterMm Diamètre intérieur en mm
 * @returns Vitesse en m/s
 */
export function calculateFlowVelocity(flowRateM3h: number, internalDiameterMm: number): number {
  if (flowRateM3h <= 0 || internalDiameterMm <= 0) return 0;

  const qM3s = flowRateM3h / 3600;
  const dM = internalDiameterMm / 1000;
  const areaM2 = (Math.PI * Math.pow(dM, 2)) / 4;

  return qM3s / areaM2;
}

/**
 * Valide les champs requis pour le calcul hydraulique.
 */
export function validateHydraulicInput(input: Partial<HydraulicInput>): string[] {
  const missing: string[] = [];

  if (input.flowRate === undefined || input.flowRate === null || Number.isNaN(input.flowRate) || input.flowRate <= 0) {
    missing.push("Débit source (m³/h)");
  }
  if (input.staticPressure === undefined || input.staticPressure === null || Number.isNaN(input.staticPressure) || input.staticPressure <= 0) {
    missing.push("Pression statique disponible (Bar)");
  }
  if (input.length === undefined || input.length === null || Number.isNaN(input.length) || input.length <= 0) {
    missing.push("Longueur de conduite (m)");
  }
  if (input.internalDiameter === undefined || input.internalDiameter === null || Number.isNaN(input.internalDiameter) || input.internalDiameter <= 0) {
    missing.push("Diamètre intérieur (mm)");
  }
  if (input.elevationDifference === undefined || input.elevationDifference === null || Number.isNaN(input.elevationDifference)) {
    missing.push("Dénivelé topographique (m)");
  }
  if (input.outletsCount === undefined || input.outletsCount === null || Number.isNaN(input.outletsCount) || input.outletsCount <= 0) {
    missing.push("Nombre de sorties");
  }

  return missing;
}

/**
 * Exécute l'analyse et le dimensionnement hydraulique déterministe complet.
 */
export function calculateHydraulics(input: HydraulicInput): HydraulicResult {
  const roughnessC = input.roughnessCoefficient ||
    (input.material ? MATERIAL_ROUGHNESS[input.material] : MATERIAL_ROUGHNESS.PEHD);

  const requiredPressureBar = input.requiredPressure !== undefined && input.requiredPressure > 0
    ? input.requiredPressure
    : 1.0;

  // 1. Vitesse d'écoulement
  const velocity = calculateFlowVelocity(input.flowRate, input.internalDiameter);

  // 2. Facteur de Christiansen
  const christiansenFactor = calculateChristiansenFactor(input.outletsCount);

  // 3. Pertes de charge linéaires Hazen-Williams
  const unitFrictionLoss = calculateHazenWilliamsUnitLoss(input.flowRate, input.internalDiameter, roughnessC);
  const plainFrictionLossMce = unitFrictionLoss * input.length;
  const linearFrictionLossMce = plainFrictionLossMce * christiansenFactor;
  const linearFrictionLossBar = linearFrictionLossMce * MCE_TO_BAR;

  // 4. Pertes singulières (10% par défaut)
  const singularLossMce = linearFrictionLossMce * 0.10;
  const singularLossBar = singularLossMce * MCE_TO_BAR;

  // 5. Impact de la topographie (dénivelé)
  // Montée (elevationDifference > 0) consomme de la pression ; descente en apporte.
  const elevationHeadMce = input.elevationDifference;
  const elevationHeadBar = elevationHeadMce * MCE_TO_BAR;

  // 6. Pertes de charge cumulées
  const totalFrictionLossMce = linearFrictionLossMce + singularLossMce;
  const totalFrictionLossBar = totalFrictionLossMce * MCE_TO_BAR;

  // 7. Pressions
  const staticPressureMce = input.staticPressure * BAR_TO_MCE;
  const residualPressureMce = staticPressureMce - totalFrictionLossMce - elevationHeadMce;
  const residualPressureBar = residualPressureMce * MCE_TO_BAR;
  const pressureMarginBar = residualPressureBar - requiredPressureBar;
  const isPressureAdequate = residualPressureBar >= requiredPressureBar;

  // 8. Détection des alertes et warnings physiques
  const warnings: HydraulicWarning[] = [];

  if (velocity > 2.5) {
    warnings.push({
      code: "HAMMER_RISK",
      level: "danger",
      message: `Vitesse excessive (${velocity.toFixed(2)} m/s > 2.5 m/s) : Risque élevé de coup de bélier et de rupture de canalisation. Augmentez le diamètre intérieur.`,
    });
  } else if (velocity < 0.5 && velocity > 0) {
    warnings.push({
      code: "SEDIMENTATION_RISK",
      level: "warning",
      message: `Vitesse d'écoulement trop faible (${velocity.toFixed(2)} m/s < 0.5 m/s) : Risque de sédimentation de particules et de colmatage progressif.`,
    });
  }

  if (residualPressureBar < 0) {
    warnings.push({
      code: "NEGATIVE_PRESSURE",
      level: "danger",
      message: `Pression résiduelle négative (${residualPressureBar.toFixed(2)} Bar) : Débit nul ou cavitation au point critique. Augmentez la pression source ou le diamètre.`,
    });
  } else if (!isPressureAdequate) {
    warnings.push({
      code: "INSUFFICIENT_PRESSURE",
      level: "danger",
      message: `Pression résiduelle insuffisante (${residualPressureBar.toFixed(2)} Bar < ${requiredPressureBar.toFixed(2)} Bar requis) : Les distributeurs ne délivreront pas leur débit nominal.`,
    });
  }

  if (totalFrictionLossBar > input.staticPressure * 0.35) {
    warnings.push({
      code: "EXCESSIVE_HEAD_LOSS",
      level: "warning",
      message: `Pertes de charge élevées (${totalFrictionLossBar.toFixed(2)} Bar, soit > 35% de la pression disponible) : Rendement énergétique non optimal.`,
    });
  }

  const qM3s = input.flowRate / 3600;
  const dM = input.internalDiameter / 1000;
  const nu = waterKinematicViscosity(20);
  const re = reynoldsNumber(qM3s, dM, nu);
  const regime = flowRegime(re);

  const provenance = createProvenance(
    "NafaHydraulicsEngine",
    "2.0.0",
    [
      {
        name: "Hazen-Williams métrique",
        reference: "Hazen A. & Williams G.S. (1920) Hydraulic Tables",
      },
      {
        name: "Facteur F de réduction de Christiansen",
        reference: "Christiansen J.E. (1942) Irrigation by Sprinkling, Bulletin 670, University of California",
      },
      {
        name: "Dimensionnement d'irrigation",
        reference: "Keller J. & Bliesner R.D. (1990) Sprinkle and Trickle Irrigation",
      },
    ],
    [
      "Écoulement d'eau à 20°C (viscosité cinématique ν ≈ 1.004e-6 m²/s)",
      "Sorties multiples équidistantes à débits identiques",
      "Régime permanent",
    ],
    warnings.map((w) => w.message),
  );

  return {
    velocity: Math.round(velocity * 100) / 100,
    christiansenFactor: Math.round(christiansenFactor * 1000) / 1000,
    unitFrictionLoss: Math.round(unitFrictionLoss * 10000) / 10000,
    plainFrictionLossMce: Math.round(plainFrictionLossMce * 100) / 100,
    linearFrictionLossMce: Math.round(linearFrictionLossMce * 100) / 100,
    linearFrictionLossBar: Math.round(linearFrictionLossBar * 100) / 100,
    singularLossMce: Math.round(singularLossMce * 100) / 100,
    singularLossBar: Math.round(singularLossBar * 100) / 100,
    elevationHeadMce: Math.round(elevationHeadMce * 100) / 100,
    elevationHeadBar: Math.round(elevationHeadBar * 100) / 100,
    totalFrictionLossMce: Math.round(totalFrictionLossMce * 100) / 100,
    totalFrictionLossBar: Math.round(totalFrictionLossBar * 100) / 100,
    staticPressureMce: Math.round(staticPressureMce * 100) / 100,
    residualPressureMce: Math.round(residualPressureMce * 100) / 100,
    residualPressureBar: Math.round(residualPressureBar * 100) / 100,
    requiredPressureBar: Math.round(requiredPressureBar * 100) / 100,
    pressureMarginBar: Math.round(pressureMarginBar * 100) / 100,
    isPressureAdequate,
    reynoldsNumber: Math.round(re),
    flowRegime: regime,
    provenance,
    warnings,
  };
}

// ══════════════════════════════════════════════════════════════════════
// EXTENSIONS INDUSTRIELLES : PERTES SINGULIÈRES, SOLAIRE ET CAVITATION
// ══════════════════════════════════════════════════════════════════════

/** Coefficients de pertes singulières K normalisés (ISO / Darcy-Weisbach) */
export const FITTING_K_FACTORS = {
  coude_90: 0.90,
  coude_45: 0.42,
  te_passage_direct: 0.35,
  te_derivation: 1.50,
  clapet_anti_retour: 2.50,
  vanne_passage_direct: 0.20,
  vanne_papillon: 0.80,
  filtre_tamis_disques: 3.00,
  reduction: 0.45,
} as const;

export type FittingType = keyof typeof FITTING_K_FACTORS;

export interface FittingLossItem {
  type: FittingType;
  count: number;
}

/**
 * Calcule la perte de charge singulière totale hs = sum(K) * (v² / (2*g)) en mCE.
 * @param velocity Vitesse d'écoulement v en m/s
 * @param fittings Liste des raccords et accessoires
 */
export function calculateSingularLossesFromFittings(
  velocity: number,
  fittings: FittingLossItem[]
): number {
  if (velocity <= 0 || !fittings || fittings.length === 0) return 0;
  const g = 9.80665;
  const dynamicHead = (velocity * velocity) / (2 * g);

  let totalK = 0;
  for (const item of fittings) {
    const k = FITTING_K_FACTORS[item.type] ?? 0.5;
    totalK += k * Math.max(0, item.count);
  }

  return Math.round(totalK * dynamicHead * 100) / 100;
}

export interface SolarPumpingSizingInput {
  /** Besoin volumique journalier en m³/jour */
  dailyVolumeM3: number;
  /** Hauteur Manométrique Totale en mCE */
  hmtMce: number;
  /** Ensoleillement moyen en Heures Plein Soleil (HSP en h/jour, défaut 5.5 au Sahel) */
  peakSunHours?: number;
  /** Température ambiante moyenne en °C (défaut 38°C sous climat sahélien) */
  ambientTemperatureC?: number;
  /** Rendement global groupe motopompe (pompe + moteur brushless DC, défaut 0.62) */
  motorPumpEfficiency?: number;
  /** Rendement onduleur/variateur solaire (défaut 0.95) */
  inverterEfficiency?: number;
  /** Perte par poussière harmattan & salissure (défaut 0.05 soit 5%) */
  dirtLossFactor?: number;
  /** Puissance unitaire d'un panneau solaire standard en Wc (défaut 550 Wc) */
  panelNominalPowerW?: number;
}

export interface SolarPumpingSizingResult {
  /** Énergie hydraulique nette quotidienne requise en kWh/jour */
  hydraulicEnergyKwhPerDay: number;
  /** Énergie électrique journalière requise en kWh/jour */
  electricalEnergyKwhPerDay: number;
  /** Puissance crête photovoltaïque théorique minimale en Watts-Crête (Wc) */
  theoreticalPeakPowerWc: number;
  /** Ratio de performance globale du générateur solaire (PR sans dimension) */
  performanceRatio: number;
  /** Puissance crête photovoltaïque réelle recommandée avec marges thermiques et poussière en Wc */
  recommendedPeakPowerWc: number;
  /** Nombre de panneaux solaires nécessaires (ex: modules 550Wc) */
  installedPanelsCount: number;
  /** Puissance totale installée en Wc */
  installedTotalPowerWc: number;
  /** Débit horaire moyen de pompage au fil du soleil en m³/h */
  averagePumpFlowRateM3h: number;
  /** Puissance nominale du moteur requise en kW */
  pumpMotorPowerKw: number;
  /** Puissance nominale en CV / HP */
  pumpMotorPowerHp: number;
}

/**
 * Dimensionne un système de pompage solaire photovoltaïque au fil du soleil calibré pour le Sahel.
 * Prend en compte l'irradiance HSP, les coefficients thermiques de cellules à haute température (> 40°C),
 * et les pertes d'harmattan.
 */
export function calculateSolarPumpingSizing(
  input: SolarPumpingSizingInput
): SolarPumpingSizingResult {
  const dailyV = Math.max(0.1, input.dailyVolumeM3);
  const hmt = Math.max(1.0, input.hmtMce);
  const hsp = Math.max(3.0, input.peakSunHours || 5.5);
  const tAmb = input.ambientTemperatureC !== undefined ? input.ambientTemperatureC : 38;
  const etaPump = input.motorPumpEfficiency || 0.62;
  const etaInv = input.inverterEfficiency || 0.95;
  const dirtLoss = input.dirtLossFactor !== undefined ? input.dirtLossFactor : 0.05;
  const panelW = input.panelNominalPowerW || 550;

  // 1. Énergie hydraulique requise : E_hydr = (rho * g * V * HMT) / (3.6e6) en kWh/jour
  // rho * g = 9810 N/m³ -> 9810 * V * HMT / 3600000 = (2.725e-3) * V * HMT
  const hydraulicEnergyKwhPerDay = (dailyV * hmt * 9.81) / 3600;

  // 2. Dégradation thermique sous climat sahélien
  // Température cellule estimée : T_cell = T_amb + ((NOCT - 20) / 800) * G (NOCT ~ 45°C)
  const tCell = tAmb + 28; // Typiquement ~66°C à midi sous 1000 W/m²
  const gammaTemp = -0.004; // -0.40% par °C au-delà de 25°C
  const tempLoss = Math.max(0, (tCell - 25) * Math.abs(gammaTemp)); // ~16.4% de perte thermique

  // 3. Performance Ratio réel
  const performanceRatio = (1 - tempLoss) * (1 - dirtLoss) * etaInv;

  // 4. Énergie électrique quotidienne requise
  const electricalEnergyKwhPerDay = hydraulicEnergyKwhPerDay / etaPump;

  // 5. Puissance crête théorique et recommandée
  const theoreticalPeakPowerWc = (electricalEnergyKwhPerDay / hsp) * 1000;
  const recommendedPeakPowerWc = (theoreticalPeakPowerWc / performanceRatio);

  // 6. Nombre de panneaux (arrondi supérieur)
  const installedPanelsCount = Math.max(2, Math.ceil(recommendedPeakPowerWc / panelW));
  const installedTotalPowerWc = installedPanelsCount * panelW;

  // 7. Débit moyen pendant les heures d'ensoleillement
  const averagePumpFlowRateM3h = Math.round((dailyV / hsp) * 10) / 10;

  // 8. Puissance moteur mécanique
  const pumpMotorPowerKw = Math.round(((averagePumpFlowRateM3h * hmt * 9.81) / (3600 * etaPump)) * 10) / 10;
  const pumpMotorPowerHp = Math.round(pumpMotorPowerKw * 1.341 * 10) / 10;

  return {
    hydraulicEnergyKwhPerDay: Math.round(hydraulicEnergyKwhPerDay * 100) / 100,
    electricalEnergyKwhPerDay: Math.round(electricalEnergyKwhPerDay * 100) / 100,
    theoreticalPeakPowerWc: Math.round(theoreticalPeakPowerWc),
    performanceRatio: Math.round(performanceRatio * 100) / 100,
    recommendedPeakPowerWc: Math.round(recommendedPeakPowerWc),
    installedPanelsCount,
    installedTotalPowerWc,
    averagePumpFlowRateM3h,
    pumpMotorPowerKw,
    pumpMotorPowerHp,
  };
}

export interface NpshAnalysisInput {
  /** Température de l'eau en °C (défaut 28°C au Sahel) */
  waterTemperatureC?: number;
  /** Altitude de l'installation en mètres (défaut 300m au Burkina Faso) */
  altitudeM?: number;
  /** Hauteur géométrique d'aspiration en mètres (distance verticale eau -> axe pompe) */
  suctionLiftM: number;
  /** Pertes de charge cumulées dans la tuyauterie d'aspiration en mCE */
  suctionFrictionLossMce: number;
  /** NPSH requis fourni par le fabricant de la pompe en mètres (NPSHr, défaut 3.2 m) */
  npshRequiredM?: number;
}

export interface NpshAnalysisResult {
  /** Pression atmosphérique locale Patm en mCE */
  atmosphericPressureMce: number;
  /** Pression de vapeur saturante Pv en mCE */
  vaporPressureMce: number;
  /** NPSH disponible net (NPSHa) en mètres */
  npshAvailableM: number;
  /** NPSH requis (NPSHr) en mètres */
  npshRequiredM: number;
  /** Marge de sécurité (NPSHa - NPSHr) en mètres */
  safetyMarginM: number;
  /** Risque avéré de cavitation */
  isCavitationRisk: boolean;
  /** Recommandation technique d'ingénierie */
  recommendation: string;
}

/**
 * Évalue la cavitation d'une pompe selon le critère NPSHa >= NPSHr + 0.5m.
 */
export function calculateNpshAnalysis(input: NpshAnalysisInput): NpshAnalysisResult {
  const alt = input.altitudeM !== undefined ? input.altitudeM : 300;
  const temp = input.waterTemperatureC !== undefined ? input.waterTemperatureC : 28;
  const suctionLift = Math.max(0, input.suctionLiftM);
  const frictionLoss = Math.max(0, input.suctionFrictionLossMce);
  const npshr = input.npshRequiredM !== undefined ? input.npshRequiredM : 3.2;

  // 1. Pression atmosphérique en fonction de l'altitude : Patm = 10.33 * exp(-alt / 8400) en mCE
  const atmosphericPressureMce = Math.round(10.33 * Math.exp(-alt / 8400) * 100) / 100;

  // 2. Pression de vapeur saturante de l'eau (formule d'Antoine)
  // Pv en kPa convertie en mCE (1 kPa = 0.10197 mCE)
  const pvKpa = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  const vaporPressureMce = Math.round(pvKpa * 0.10197 * 100) / 100;

  // 3. NPSHa = Patm - SuctionLift - SuctionLoss - Pv
  const npshAvailableM = Math.round((atmosphericPressureMce - suctionLift - frictionLoss - vaporPressureMce) * 100) / 100;
  const safetyMarginM = Math.round((npshAvailableM - npshr) * 100) / 100;
  const isCavitationRisk = safetyMarginM < 0.5;

  let recommendation = "Installation conforme : marge de cavitation sécurisée.";
  if (isCavitationRisk) {
    recommendation = `Alerte cavitation (Marge : ${safetyMarginM.toFixed(2)} m < 0.5 m recommandé) : risque de destruction des aubes de la turbine et de bruit intense. Rapprochez la pompe de l'eau, augmentez le diamètre d'aspiration ou utilisez une pompe immergée.`;
  }

  return {
    atmosphericPressureMce,
    vaporPressureMce,
    npshAvailableM,
    npshRequiredM: npshr,
    safetyMarginM,
    isCavitationRisk,
    recommendation,
  };
}
