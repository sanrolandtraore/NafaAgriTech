/**
 * Modélisation des émetteurs d'irrigation (goutteurs et asperseurs)
 * et calculs d'uniformité de distribution
 * 
 * Références normatives & scientifiques :
 * - ISO 9261:2004 - Matériel d'irrigation agricole - Émetteurs et tuyaux émetteurs
 * - ASAE EP458 / ASABE S526 - Field evaluation of microirrigation systems
 * - Christiansen J.E. (1942) - Irrigation by sprinkling, Bulletin 670, Univ. California
 * - Keller J. & Karmeli D. (1974) - Trickle irrigation design parameters
 * - Merriam J.L. & Keller J. (1978) - Farm irrigation system evaluation: A guide for estimation of irrigation efficiencies
 */

import { Provenance, createProvenance } from "../provenance";

export type EmitterType = "dripper_non_pc" | "dripper_pc" | "micro_sprinkler" | "sprinkler";

export interface EmitterSpecification {
  /** Type d'émetteur */
  type: EmitterType;
  /** Débit nominal (L/h) */
  nominalFlowLh: number;
  /** Pression nominale recommandée (bar ou m d'eau) */
  nominalPressureM: number;
  /**
   * Exposant d'émetteur x dans q = k * h^x
   * Typiquement :
   * - 0.5 pour orifice turbulent / non-autorégulant
   * - 0.05 à 0.15 pour autorégulant (PC) dans sa plage de régulation
   * - 0.7 à 1.0 pour émetteurs à vortex ou tubes capillaires
   */
  flowExponentX: number;
  /** Plage de pression minimale de régulation (m) pour émetteurs autorégulants */
  minRegulatingPressureM?: number;
  /** Plage de pression maximale de régulation (m) pour émetteurs autorégulants */
  maxRegulatingPressureM?: number;
  /** Coefficient de variation de fabrication CV du constructeur (norme ISO 9261) */
  manufacturerCv?: number;
}

export interface LateralUniformityInput {
  /** Spécification des émetteurs */
  emitter: EmitterSpecification;
  /** Pressions calculées à chaque émetteur le long de la rampe ou du bloc (m de colonne d'eau) */
  pressuresM: number[];
  /** Nombre d'émetteurs par plante (défaut = 1) */
  emittersPerPlant?: number;
}

export interface UniformityResult {
  /** Débits individuels de chaque émetteur (L/h) */
  emitterFlowsLh: number[];
  /** Débit moyen (L/h) */
  meanFlowLh: number;
  /** Débit minimal (L/h) */
  minFlowLh: number;
  /** Débit maximal (L/h) */
  maxFlowLh: number;
  /** Pression minimale (m) */
  minPressureM: number;
  /** Pression maximale (m) */
  maxPressureM: number;
  /** Variation relative de pression : (Pmax - Pmin) / Pnom (%) */
  pressureVariationPercent: number;
  /** Variation relative de débit : (Qmax - Qmin) / Qnom (%) */
  flowVariationPercent: number;
  /** Coefficient d'uniformité de Christiansen CU (%) */
  christiansenCuPercent: number;
  /** Uniformité de distribution du quart inférieur DU_lq (%) */
  distributionUniformityDuPercent: number;
  /** Uniformité d'émission de Keller-Karmeli EU (%) */
  emissionUniformityEuPercent: number;
  /** Qualification technique */
  rating: "excellent" | "good" | "acceptable" | "poor" | "unacceptable";
  /** Respecte la règle d'or ASAE des 20% de variation de pression */
  satisfiesAsae20PercentRule: boolean;
  /** Traçabilité scientifique */
  provenance: Provenance;
}

/**
 * Calcule le coefficient k d'un émetteur tel que q = k * h^x
 * où q est en L/h et h en mètres de colonne d'eau.
 */
export function calculateEmitterK(spec: EmitterSpecification): number {
  if (spec.nominalPressureM <= 0 || spec.nominalFlowLh <= 0) {
    throw new Error("La pression et le débit nominaux doivent être strictement positifs.");
  }
  return spec.nominalFlowLh / Math.pow(spec.nominalPressureM, spec.flowExponentX);
}

/**
 * Calcule le débit d'un émetteur (en L/h) sous une charge donnée h (en m).
 * Gère le palier de compensation pour les émetteurs autorégulants (PC).
 */
export function calculateEmitterFlowLh(spec: EmitterSpecification, pressureM: number): number {
  if (pressureM <= 0) return 0;

  const k = calculateEmitterK(spec);

  // Si autorégulant et dans la plage [Pmin, Pmax]
  if (
    spec.type === "dripper_pc" &&
    spec.minRegulatingPressureM !== undefined &&
    spec.maxRegulatingPressureM !== undefined
  ) {
    if (pressureM >= spec.minRegulatingPressureM && pressureM <= spec.maxRegulatingPressureM) {
      // Débit compensé avec exposant résiduel faible x
      return k * Math.pow(pressureM, spec.flowExponentX);
    } else if (pressureM < spec.minRegulatingPressureM) {
      // Sous la pression minimale de régulation, comportement d'orifice non régulé (x ~ 0.5)
      const kLow =
        (k * Math.pow(spec.minRegulatingPressureM, spec.flowExponentX)) /
        Math.sqrt(spec.minRegulatingPressureM);
      return kLow * Math.sqrt(pressureM);
    } else {
      // Au-dessus de la pression max de régulation
      return k * Math.pow(spec.maxRegulatingPressureM, spec.flowExponentX);
    }
  }

  return k * Math.pow(pressureM, spec.flowExponentX);
}

/**
 * Évalue l'uniformité hydraulique d'une rampe ou d'un réseau d'émetteurs
 * selon les normes ASAE EP458 et Christiansen (1942).
 */
export function evaluateIrrigationUniformity(input: LateralUniformityInput): UniformityResult {
  if (!input.pressuresM || input.pressuresM.length === 0) {
    throw new Error("La liste des pressions aux émetteurs ne peut pas être vide.");
  }

  const flows = input.pressuresM.map((p) => calculateEmitterFlowLh(input.emitter, p));
  const n = flows.length;

  const meanFlow = flows.reduce((s, q) => s + q, 0) / n;
  const minFlow = Math.min(...flows);
  const maxFlow = Math.max(...flows);

  const minP = Math.min(...input.pressuresM);
  const maxP = Math.max(...input.pressuresM);

  // 1. Variations de pression et de débit relatives
  const pressureVariationPercent = ((maxP - minP) / input.emitter.nominalPressureM) * 100;
  const flowVariationPercent = ((maxFlow - minFlow) / input.emitter.nominalFlowLh) * 100;

  // Règle d'or ASAE / Keller : variation de pression <= 20% (soit delta Q <= 10% pour orifice)
  const satisfiesAsae20PercentRule = pressureVariationPercent <= 20.0;

  // 2. Coefficient d'uniformité de Christiansen CU
  // CU = 100 * (1 - sum(|q_i - q_bar|) / (n * q_bar))
  const sumAbsDev = flows.reduce((s, q) => s + Math.abs(q - meanFlow), 0);
  const christiansenCuPercent = Math.max(0, 100 * (1 - sumAbsDev / (n * meanFlow)));

  // 3. Distribution Uniformity du quart inférieur (DU_lq)
  // Moyenne des 25% des valeurs les plus faibles divisée par la moyenne générale
  const sortedFlows = [...flows].sort((a, b) => a - b);
  const quarterCount = Math.max(1, Math.floor(n * 0.25));
  const lowestQuarterSum = sortedFlows.slice(0, quarterCount).reduce((s, q) => s + q, 0);
  const lowestQuarterMean = lowestQuarterSum / quarterCount;
  const distributionUniformityDuPercent = Math.max(0, (lowestQuarterMean / meanFlow) * 100);

  // 4. Uniformité d'émission de Keller-Karmeli (EU) pour le micro-irrigation
  // EU = 100 * (1 - 1.27 * CV / sqrt(n_e)) * (q_min / q_bar)
  const cv = input.emitter.manufacturerCv ?? 0.05; // 5% par défaut (classe A ISO 9261)
  const ne = input.emittersPerPlant ?? 1;
  const cvFactor = 1 - (1.27 * cv) / Math.sqrt(ne);
  const emissionUniformityEuPercent = Math.max(0, 100 * cvFactor * (minFlow / meanFlow));

  // 5. Qualification selon standards ASAE EP458
  let rating: UniformityResult["rating"];
  if (emissionUniformityEuPercent >= 90) {
    rating = "excellent";
  } else if (emissionUniformityEuPercent >= 80) {
    rating = "good";
  } else if (emissionUniformityEuPercent >= 70) {
    rating = "acceptable";
  } else if (emissionUniformityEuPercent >= 60) {
    rating = "poor";
  } else {
    rating = "unacceptable";
  }

  const warnings: string[] = [];
  if (!satisfiesAsae20PercentRule) {
    warnings.push(
      `Variation de pression excessive le long de la rampe (${pressureVariationPercent.toFixed(1)}% > 20% limite ASAE). Risque de sur-arrosage en tête et de déficit hydrique en bout de ligne.`,
    );
  }
  if (rating === "poor" || rating === "unacceptable") {
    warnings.push(
      `Uniformité d'émission globale insuffisante (EU = ${emissionUniformityEuPercent.toFixed(1)}%). Dimensionner un diamètre de rampe plus grand ou utiliser des émetteurs autorégulants (PC).`,
    );
  }

  const provenance = createProvenance(
    "IrrigationEmittersEngine",
    "1.0.0",
    [
      {
        name: "Coefficient d'Uniformité de Christiansen (CU)",
        reference: "Christiansen J.E. (1942) Irrigation by sprinkling, Bulletin 670, Univ. California",
      },
      {
        name: "Uniformité d'émission de Keller-Karmeli (EU)",
        reference: "Keller J. & Karmeli D. (1974) Trickle irrigation design parameters",
      },
      {
        name: "Évaluation de la micro-irrigation",
        reference: "ASAE EP458 / ASABE S526 Field evaluation of microirrigation systems",
      },
      {
        name: "Spécification des émetteurs",
        reference: "ISO 9261:2004 Matériel d'irrigation agricole - Émetteurs et tuyaux émetteurs",
      },
    ],
    [
      "Pression constante au niveau de chaque orifice individuel",
      "Coefficient de variation de fabrication uniforme conforme constructeur",
    ],
    warnings,
  );

  return {
    emitterFlowsLh: flows,
    meanFlowLh: meanFlow,
    minFlowLh: minFlow,
    maxFlowLh: maxFlow,
    minPressureM: minP,
    maxPressureM: maxP,
    pressureVariationPercent,
    flowVariationPercent,
    christiansenCuPercent,
    distributionUniformityDuPercent,
    emissionUniformityEuPercent,
    rating,
    satisfiesAsae20PercentRule,
    provenance,
  };
}
