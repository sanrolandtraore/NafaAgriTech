/**
 * NAFA FIELD DESIGNER — MOTEUR HYDRAULIQUE DÉTERMINISTE
 * Calculs physiques stricts basés sur les formules de Hazen-Williams et Christiansen.
 * 
 * Références scientifiques & normes :
 * - Formule de Hazen-Williams pour les pertes de charge linéaires en régime turbulent lisse.
 * - Facteur F de Christiansen pour rampes et conduites à sorties multiples équidistantes.
 * - Vitesse d'écoulement et alertes de coup de bélier (v > 2.5 m/s) et sédimentation (v < 0.5 m/s).
 */

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
    warnings,
  };
}
