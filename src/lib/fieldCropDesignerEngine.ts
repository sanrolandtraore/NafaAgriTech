/**
 * NAFA FIELD DESIGNER — MOTEUR CROP DESIGNER (CONCEPTION DE CULTURE)
 * Calculs de lignes de plantation, interligne, espacement, densité, semences et besoins en eau.
 * Toutes les valeurs restent 100% éditables par l'agronome.
 */

import { CropConfig, CropPlan, PlantingType } from "@/types/fieldDesigner";

export interface CropDesignParams {
  areaHa: number;
  crop: CropConfig;
  variety: string;
  rowSpacingCm: number;
  plantSpacingCm: number;
  orientationDeg: number;
  plantingType: PlantingType;
  parcelLengthM?: number;
  parcelWidthM?: number;
}

export interface CalculatedCropPlan {
  numRows: number;
  totalRowLengthM: number;
  numPlants: number;
  densityPlantsHa: number;
  seedQuantityKg: number;
  estimatedYieldTonnes: number;
  waterNeedsM3Day: number;
  plantingRowCoordinates: { x1: number; y1: number; x2: number; y2: number }[];
}

export function computeCropPlan(params: CropDesignParams): CalculatedCropPlan {
  const areaM2 = params.areaHa * 10000;
  const rowSpacingM = Math.max(0.1, params.rowSpacingCm / 100);
  const plantSpacingM = Math.max(0.05, params.plantSpacingCm / 100);

  // Dimensions estimées de la parcelle
  const lengthM = params.parcelLengthM && params.parcelLengthM > 0
    ? params.parcelLengthM
    : Math.sqrt(areaM2 * 1.5);
  const widthM = params.parcelWidthM && params.parcelWidthM > 0
    ? params.parcelWidthM
    : areaM2 / lengthM;

  // Calcul du nombre de lignes selon l'orientation
  // Si orientation proche de 0° ou 180° (Nord-Sud), les lignes parcourent la longueur
  const numRows = Math.max(1, Math.floor(widthM / rowSpacingM));
  const totalRowLengthM = Math.round(numRows * lengthM);

  // Nombre de plants et densité réelle
  const plantsPerRow = Math.max(1, Math.floor(lengthM / plantSpacingM));
  const numPlants = numRows * plantsPerRow;
  const densityPlantsHa = Math.round(10000 / (rowSpacingM * plantSpacingM));

  // Estimation semences (selon type de culture)
  let seedGramsPerPlant = 0.05; // 50mg standard
  if (params.crop.id === "mais" || params.crop.id === "haricot" || params.crop.id === "soja") {
    seedGramsPerPlant = 0.35;
  } else if (params.crop.id === "arachide") {
    seedGramsPerPlant = 0.7;
  } else if (params.crop.id === "pomme_de_terre") {
    seedGramsPerPlant = 40.0; // tubercule plant
  } else if (params.crop.id === "oignon" || params.crop.id === "carotte" || params.crop.id === "chou") {
    seedGramsPerPlant = 0.005;
  }
  const seedQuantityKg = Math.round(((numPlants * seedGramsPerPlant) / 1000) * 100) / 100;

  // Rendement estimatif sahélien moyen (tonnes/ha)
  let baseYieldTonnesHa = 15;
  if (params.crop.id === "oignon") baseYieldTonnesHa = 35;
  else if (params.crop.id === "tomate") baseYieldTonnesHa = 40;
  else if (params.crop.id === "mais") baseYieldTonnesHa = 4.5;
  else if (params.crop.id === "riz") baseYieldTonnesHa = 5.5;
  else if (params.crop.id === "haricot" || params.crop.id === "soja") baseYieldTonnesHa = 2.0;
  else if (params.crop.id === "pasteque") baseYieldTonnesHa = 30;
  else if (params.crop.id === "pomme_de_terre") baseYieldTonnesHa = 25;

  const estimatedYieldTonnes = Math.round(baseYieldTonnesHa * params.areaHa * 10) / 10;

  // Besoins journaliers en eau (Sahel : ETo moyen = 6.0 mm/jour)
  const etoSahelMmDay = 6.0;
  const etcMmDay = etoSahelMmDay * (params.crop.kcMid || 1.0);
  // 1 mm sur 1 ha = 10 m³
  const waterNeedsM3Day = Math.round(etcMmDay * 10 * params.areaHa * 10) / 10;

  // Coordonnées 2D simplifiées des lignes pour affichage interactif
  const coords: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const displayRows = Math.min(numRows, 40); // limiter à 40 pour performance SVG
  const stepY = 100 / (displayRows + 1);

  for (let i = 1; i <= displayRows; i++) {
    coords.push({
      x1: 5,
      y1: i * stepY,
      x2: 95,
      y2: i * stepY,
    });
  }

  return {
    numRows,
    totalRowLengthM,
    numPlants,
    densityPlantsHa,
    seedQuantityKg,
    estimatedYieldTonnes,
    waterNeedsM3Day,
    plantingRowCoordinates: coords,
  };
}
