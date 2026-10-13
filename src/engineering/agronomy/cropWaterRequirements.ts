/**
 * Moteur FAO-56 : Besoins en eau des cultures (ETc), ajustement climatique du Kc,
 * et dynamique du bilan hydrique du sol (TAW, RAW, Ks, stress hydrique).
 * 
 * Références normatives :
 * - FAO-56 Chapter 6 : ETc under standard conditions (single crop coefficient)
 * - FAO-56 Chapter 7 : ETc under soil water stress conditions (Ks factor)
 * - FAO-56 Chapter 8 : ETc for non-pristine conditions & salinity
 */

import { Provenance, createProvenance } from "../provenance";

export interface CropGrowthStageSpec {
  /** Nom du stade phonologique */
  stageName: "initial" | "development" | "mid_season" | "late_season";
  /** Durée du stade en jours */
  durationDays: number;
  /** Coefficient cultural Kc tabulé standard (FAO-56 Table 12) */
  kcTabulated: number;
  /** Hauteur moyenne de la plante à ce stade en mètres (pour ajustement éq. 62) */
  plantHeightM: number;
  /** Profondeur racinaire effective moyenne Zr en mètres */
  rootingDepthM: number;
  /** Fraction d'épuisement tabulée p (FAO-56 Table 22) */
  depletionFractionPTab: number;
}

export interface SoilWaterProperties {
  /** Humidité volumique à la capacité au champ theta_FC (m³/m³ ou fraction volumique ex: 0.30) */
  fieldCapacityThetaFc: number;
  /** Humidité volumique au point de flétrissement permanent theta_WP (fraction volumique ex: 0.15) */
  wiltingPointThetaWp: number;
  /** Épaisseur totale explorable du sol par les racines max (m) */
  maxRootingZoneM?: number;
}

export interface CropWaterRequirementsInput {
  /** Nom de la culture (ex: "Tomate", "Maïs", "Oignon") */
  cropName: string;
  /** Évapotranspiration de référence ET0 (mm/jour) */
  et0MmDay: number;
  /** Spécification du stade phénologique courant */
  stage: CropGrowthStageSpec;
  /** Propriétés hydriques du sol */
  soil: SoilWaterProperties;
  /** Vitesse moyenne du vent à 2 m (m/s) pour ajustement climatique */
  windSpeed2mMs?: number;
  /** Humidité relative minimale journalière RHmin (%) pour ajustement climatique */
  rhMinPercent?: number;
  /** Épuisement actuel de la réserve racinaire Dr en mm (défaut = 0, sol à la capacité au champ) */
  currentDepletionDrMm?: number;
}

export interface CropWaterRequirementsResult {
  /** Culture */
  cropName: string;
  /** Stade */
  stageName: string;
  /** Coefficient cultural Kc effectif corrigé du climat */
  kcAdjusted: number;
  /** Évapotranspiration maximale sans stress hydrique ETc (mm/jour) */
  etcMaxMmDay: number;
  /** Réserve Utile Totale TAW en mm d'eau */
  totalAvailableWaterTawMm: number;
  /** Fraction d'épuisement critique p corrigée pour le flux ETc */
  depletionFractionPCorrected: number;
  /** Réserve Facilement Utilisable RAW en mm d'eau */
  readilyAvailableWaterRawMm: number;
  /** Coefficient de réduction de stress hydrique Ks (0 = flétrissement complet, 1 = aucun stress) */
  stressCoefficientKs: number;
  /** Évapotranspiration réelle ajustée du stress ETc_adj (mm/jour) */
  etcAdjustedMmDay: number;
  /** Dose nette d'irrigation requise pour ramener à la capacité au champ (mm) */
  netIrrigationRequirementMm: number;
  /** Situation de stress hydrique avérée */
  isUnderWaterStress: boolean;
  /** Traçabilité scientifique */
  provenance: Provenance;
}

/**
 * Ajuste le coefficient cultural Kc pour le vent et l'humidité relative
 * selon l'équation 62 du manuel FAO-56.
 */
export function adjustKcForClimate(
  kcTab: number,
  plantHeightM: number,
  windSpeed2mMs: number = 2.0,
  rhMinPercent: number = 45.0,
): number {
  if (plantHeightM <= 0) return kcTab;
  // FAO-56 Equation 62 :
  // Kc = Kc_tab + [0.04 * (u2 - 2) - 0.004 * (RHmin - 45)] * (h / 3)^0.3
  const heightFactor = Math.pow(Math.min(plantHeightM, 10) / 3, 0.3);
  const adjustment = (0.04 * (windSpeed2mMs - 2) - 0.004 * (rhMinPercent - 45)) * heightFactor;
  return Math.max(0.1, kcTab + adjustment);
}

/**
 * Corrige la fraction d'épuisement critique p en fonction de ETc
 * selon l'équation 84 de la FAO-56 (Table 22 footnote).
 */
export function adjustDepletionFractionP(pTab: number, etcMmDay: number): number {
  // FAO-56 : p = p_tab + 0.04 * (5 - ETc)
  // Limité aux bornes physiques [0.1, 0.8]
  const p = pTab + 0.04 * (5 - etcMmDay);
  return Math.max(0.1, Math.min(0.8, p));
}

/**
 * Calcule les besoins en eau des cultures (ETc), les réserves du sol (TAW, RAW),
 * et le coefficient de stress hydrique Ks selon les chapitres 6 et 7 de la FAO-56.
 */
export function calculateCropWaterRequirements(
  input: CropWaterRequirementsInput,
): CropWaterRequirementsResult {
  const { cropName, et0MmDay, stage, soil } = input;

  if (et0MmDay <= 0) {
    throw new RangeError(`ET0 doit être strictement positif : ${et0MmDay}`);
  }
  if (soil.fieldCapacityThetaFc <= soil.wiltingPointThetaWp) {
    throw new RangeError(
      `Capacité au champ theta_FC (${soil.fieldCapacityThetaFc}) doit être strictement supérieure au point de flétrissement theta_WP (${soil.wiltingPointThetaWp})`,
    );
  }
  if (stage.rootingDepthM <= 0) {
    throw new RangeError(`La profondeur racinaire Zr doit être strictement positive : ${stage.rootingDepthM}`);
  }

  // 1. Ajustement climatique du Kc (éq. 62 FAO-56)
  // L'ajustement s'applique pour mid_season et late_season si u2 != 2 ou RHmin != 45
  let kcAdjusted = stage.kcTabulated;
  if (
    (stage.stageName === "mid_season" || stage.stageName === "late_season") &&
    (input.windSpeed2mMs !== undefined || input.rhMinPercent !== undefined)
  ) {
    kcAdjusted = adjustKcForClimate(
      stage.kcTabulated,
      stage.plantHeightM,
      input.windSpeed2mMs ?? 2.0,
      input.rhMinPercent ?? 45.0,
    );
  }

  // 2. Évapotranspiration potentielle de la culture ETc = Kc * ET0 (éq. 56)
  const etcMaxMmDay = kcAdjusted * et0MmDay;

  // 3. Réserve Utile Totale TAW = 1000 * (theta_FC - theta_WP) * Zr (éq. 82)
  const totalAvailableWaterTawMm =
    1000 * (soil.fieldCapacityThetaFc - soil.wiltingPointThetaWp) * stage.rootingDepthM;

  // 4. Correction de la fraction d'épuisement p selon ETc (éq. 84 note)
  const depletionFractionPCorrected = adjustDepletionFractionP(
    stage.depletionFractionPTab,
    etcMaxMmDay,
  );

  // 5. Réserve Facilement Utilisable RAW = p * TAW (éq. 83)
  const readilyAvailableWaterRawMm = depletionFractionPCorrected * totalAvailableWaterTawMm;

  // 6. Épuisement courant Dr et calcul du coefficient de stress Ks (éq. 84)
  const currentDr = Math.max(0, input.currentDepletionDrMm ?? 0);
  let stressCoefficientKs = 1.0;
  if (currentDr > readilyAvailableWaterRawMm) {
    // Stress hydrique : Ks = (TAW - Dr) / (TAW - RAW) = (TAW - Dr) / ((1 - p) * TAW)
    const denominator = (1 - depletionFractionPCorrected) * totalAvailableWaterTawMm;
    stressCoefficientKs = denominator > 0 ? (totalAvailableWaterTawMm - currentDr) / denominator : 0;
    stressCoefficientKs = Math.max(0, Math.min(1.0, stressCoefficientKs));
  }

  // 7. Évapotranspiration réelle ajustée du stress (éq. 81)
  const etcAdjustedMmDay = stressCoefficientKs * etcMaxMmDay;

  // 8. Besoin net en irrigation pour recharger la zone racinaire à la capacité au champ
  const netIrrigationRequirementMm = currentDr;
  const isUnderWaterStress = stressCoefficientKs < 0.999;

  const warnings: string[] = [];
  if (isUnderWaterStress) {
    warnings.push(
      `STRESS HYDRIQUE ACTIF (Ks = ${stressCoefficientKs.toFixed(2)}) : L'épuisement de la réserve (${currentDr.toFixed(1)} mm) dépasse la réserve facilement utilisable RAW (${readilyAvailableWaterRawMm.toFixed(1)} mm). Irrigation requise d'urgence pour éviter une chute de rendement.`,
    );
  }

  const provenance = createProvenance(
    "Fao56CropWaterEngine",
    "1.0.0",
    [
      {
        name: "Coefficient cultural Kc et ETc standard",
        reference: "FAO Irrigation and Drainage Paper No. 56, Chapter 6 (Allen et al., 1998)",
      },
      {
        name: "Ajustement climatique du Kc (éq. 62)",
        reference: "FAO-56 Section 6.2, Equation 62",
      },
      {
        name: "Bilan hydrique TAW / RAW (éq. 82-83)",
        reference: "FAO-56 Chapter 8, Equations 82-83",
      },
      {
        name: "Facteur de stress hydrique Ks (éq. 84)",
        reference: "FAO-56 Chapter 8, Equation 84",
      },
    ],
    [
      "Sol homogène sur la profondeur racinaire Zr",
      "Écoulement d'eau non saturé sous régime gravitaire normal",
    ],
    warnings,
  );

  return {
    cropName,
    stageName: stage.stageName,
    kcAdjusted,
    etcMaxMmDay,
    totalAvailableWaterTawMm,
    depletionFractionPCorrected,
    readilyAvailableWaterRawMm,
    stressCoefficientKs,
    etcAdjustedMmDay,
    netIrrigationRequirementMm,
    isUnderWaterStress,
    provenance,
  };
}
