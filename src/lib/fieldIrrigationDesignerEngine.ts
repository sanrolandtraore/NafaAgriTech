/**
 * NAFA FIELD DESIGNER — CONCEPTEUR D'IRRIGATION (SAHEL & AFRIQUE DE L'OUEST)
 * Goutte-à-goutte, Aspersion, Micro-aspersion, Pivot, Gravitaire.
 * Dimensionnement hydraulique, pompage solaire fil-du-soleil, tuyauterie et secteurs.
 */

import {
  IrrigationSystemType,
  WaterSourceType,
  PumpType,
  IrrigationProject,
} from "@/types/fieldDesigner";

export interface IrrigationDesignInput {
  areaHa: number;
  systemType: IrrigationSystemType;
  waterSource: WaterSourceType;
  dynamicWaterDepthM: number;
  sourceFlowM3h: number;
  pumpType: PumpType;
  cropKey: string;
  parcelLengthM?: number;
  parcelWidthM?: number;
}

export interface CalculatedIrrigationResult {
  mainPipeLengthM: number;
  mainPipeDiameterMm: number;
  subPipeLengthM: number;
  subPipeDiameterMm: number;
  lateralLengthM: number;
  lateralSpacingM: number;
  emitterSpacingM: number;
  emitterFlowLh: number;
  totalEmittersCount: number;
  totalFlowRateM3h: number;
  numSectors: number;
  pumpPowerKw: number;
  pumpPowerHp: number;
  tankVolumeM3: number;
  tankHeightM: number;
  dailyIrrigationHours: number;
  isTechnicalEstimate: boolean;
  technicalSummary: string;
}

export function computeIrrigationDesign(
  input: IrrigationDesignInput
): CalculatedIrrigationResult {
  const areaM2 = input.areaHa * 10000;
  const lengthM = input.parcelLengthM && input.parcelLengthM > 0
    ? input.parcelLengthM
    : Math.sqrt(areaM2 * 1.4);
  const widthM = input.parcelWidthM && input.parcelWidthM > 0
    ? input.parcelWidthM
    : areaM2 / lengthM;

  let lateralSpacingM = 1.0;
  let emitterSpacingM = 0.3;
  let emitterFlowLh = 2.0;
  let operatingPressureBar = 1.0;

  if (input.systemType === "goutte_a_goutte") {
    lateralSpacingM = 0.8;
    emitterSpacingM = 0.3;
    emitterFlowLh = 2.0;
    operatingPressureBar = 1.0;
  } else if (input.systemType === "aspersion") {
    lateralSpacingM = 12.0;
    emitterSpacingM = 12.0;
    emitterFlowLh = 800.0;
    operatingPressureBar = 2.5;
  } else if (input.systemType === "micro_aspersion") {
    lateralSpacingM = 4.0;
    emitterSpacingM = 4.0;
    emitterFlowLh = 70.0;
    operatingPressureBar = 1.5;
  } else if (input.systemType === "pivot") {
    lateralSpacingM = 25.0;
    emitterSpacingM = 3.0;
    emitterFlowLh = 1200.0;
    operatingPressureBar = 3.0;
  } else {
    // gravitaire
    lateralSpacingM = 2.0;
    emitterSpacingM = 5.0;
    emitterFlowLh = 2000.0;
    operatingPressureBar = 0.2;
  }

  // Nombre de rampes et longueur
  const numLaterals = Math.max(1, Math.floor(widthM / lateralSpacingM));
  const lateralLengthM = Math.round(numLaterals * lengthM);

  // Nombre d'émetteurs (goutteurs ou asperseurs)
  const emittersPerLateral = Math.max(1, Math.floor(lengthM / emitterSpacingM));
  const totalEmittersCount = numLaterals * emittersPerLateral;

  // Débit total instantané du réseau en m³/h
  const rawInstantFlowM3h = (totalEmittersCount * emitterFlowLh) / 1000;

  // Débit disponible de la source
  const sourceFlow = Math.max(2.0, input.sourceFlowM3h || 6.0);

  // Nombre de secteurs nécessaires pour que le débit d'un secteur <= débit de la source
  // Au Sahel, pour les forages maraîchers (5-10 m³/h), le découpage en secteurs est capital
  const numSectors = Math.max(1, Math.ceil(rawInstantFlowM3h / sourceFlow));
  const sectorFlowM3h = Math.round((rawInstantFlowM3h / numSectors) * 10) / 10;

  // Conduite principale et secondaire
  const mainPipeLengthM = Math.round(widthM + 25); // du forage jusqu'à l'entrée parcelle
  const subPipeLengthM = Math.round(widthM);

  // Diamètre recommandé selon la vitesse d'écoulement optimale (1.0 à 1.5 m/s)
  // Formule simplifiée D = sqrt(4 * Q / (pi * V))
  let mainPipeDiameterMm = 50;
  if (sectorFlowM3h > 25) mainPipeDiameterMm = 90;
  else if (sectorFlowM3h > 15) mainPipeDiameterMm = 75;
  else if (sectorFlowM3h > 8) mainPipeDiameterMm = 63;
  else if (sectorFlowM3h > 4) mainPipeDiameterMm = 50;
  else mainPipeDiameterMm = 40;

  const subPipeDiameterMm = Math.max(32, mainPipeDiameterMm - 13);

  // Calcul Hauteur Manométrique Totale (HMT en mètres de colonne d'eau)
  // HMT = Profondeur dynamique + Dénivelé + Pression de service (bar * 10) + Pertes de charge (est. 15%)
  const staticDynamicDepth = Math.max(5, input.dynamicWaterDepthM || 35);
  const pressureMce = operatingPressureBar * 10;
  const frictionLossesMce = (staticDynamicDepth + pressureMce) * 0.15;
  const hmtMce = Math.round(staticDynamicDepth + pressureMce + frictionLossesMce);

  // Puissance hydraulique requise (kW) = (Q m³/h * HMT mce) / (367 * rendement)
  const pumpEfficiency = 0.6; // 60% standard
  const pumpPowerKw = Math.round(((sectorFlowM3h * hmtMce) / (367 * pumpEfficiency)) * 10) / 10;
  const pumpPowerHp = Math.round(pumpPowerKw * 1.341 * 10) / 10;

  // Volume réservoir tampon recommandé (ex: 2h de pompage ou 20% du besoin journalier)
  // Besoin journalier estimé = 6 mm * 10 m³ * ha = 60 m³/ha/jour
  const dailyVolumeNeededM3 = Math.round(6.0 * 10 * input.areaHa * 10) / 10;
  const tankVolumeM3 = Math.max(5, Math.round(dailyVolumeNeededM3 * 0.25));
  const tankHeightM = input.systemType === "goutte_a_goutte" ? 4.0 : 6.0;

  // Durée quotidienne d'arrosage par secteur
  const dailyIrrigationHours = Math.round((dailyVolumeNeededM3 / rawInstantFlowM3h) * 10) / 10;

  return {
    mainPipeLengthM,
    mainPipeDiameterMm,
    subPipeLengthM,
    subPipeDiameterMm,
    lateralLengthM,
    lateralSpacingM,
    emitterSpacingM,
    emitterFlowLh,
    totalEmittersCount,
    totalFlowRateM3h: Math.round(rawInstantFlowM3h * 10) / 10,
    numSectors,
    pumpPowerKw,
    pumpPowerHp,
    tankVolumeM3,
    tankHeightM,
    dailyIrrigationHours: Math.min(8, Math.max(1, dailyIrrigationHours)),
    isTechnicalEstimate: true,
    technicalSummary: `Réseau de ${numSectors} secteur(s) autonome(s) de ${sectorFlowM3h} m³/h sous HMT ${hmtMce} mCE. Conduite PEHD Ø${mainPipeDiameterMm}mm et pompe solaire de ${pumpPowerKw} kW (${pumpPowerHp} HP).`,
  };
}
