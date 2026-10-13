/**
 * Tests de validation du moteur FAO-56 : Besoins en eau des cultures (ETc),
 * correction climatique du Kc, bilan hydrique du sol (TAW, RAW) et stress hydrique (Ks).
 */

import { describe, it, expect } from "vitest";
import {
  calculateCropWaterRequirements,
  adjustKcForClimate,
  adjustDepletionFractionP,
  CropGrowthStageSpec,
  SoilWaterProperties,
} from "../../engineering/agronomy/cropWaterRequirements";

describe("Moteur FAO-56 : Besoins en eau des cultures (ETc) et dynamique de stress (Ks)", () => {
  const tomatoMidSeason: CropGrowthStageSpec = {
    stageName: "mid_season",
    durationDays: 40,
    kcTabulated: 1.15, // Kc mid standard tomate (FAO-56 Table 12)
    plantHeightM: 0.8,
    rootingDepthM: 0.7, // enracinement 70 cm
    depletionFractionPTab: 0.40, // tomate p = 0.40
  };

  const sandyLoamSoil: SoilWaterProperties = {
    fieldCapacityThetaFc: 0.28, // 28% vol
    wiltingPointThetaWp: 0.14, // 14% vol
  };

  it("calcule avec rigueur TAW et RAW sur sol sablo-limoneux", () => {
    // TAW = 1000 * (0.28 - 0.14) * 0.7 = 1000 * 0.14 * 0.7 = 98.0 mm
    const res = calculateCropWaterRequirements({
      cropName: "Tomate plein champ",
      et0MmDay: 5.0,
      stage: tomatoMidSeason,
      soil: sandyLoamSoil,
      windSpeed2mMs: 2.0,
      rhMinPercent: 45.0,
      currentDepletionDrMm: 20.0,
    });

    expect(res.totalAvailableWaterTawMm).toBeCloseTo(98.0, 1);
    // À ETc = 5.75 mm/j, p_corr = 0.40 + 0.04*(5 - 5.75) = 0.40 - 0.03 = 0.37
    expect(res.depletionFractionPCorrected).toBeCloseTo(0.37, 2);
    // RAW = 0.37 * 98.0 = 36.26 mm
    expect(res.readilyAvailableWaterRawMm).toBeCloseTo(36.26, 1);
    // Dr = 20 mm < RAW (36.3 mm) -> aucun stress, Ks = 1.0
    expect(res.stressCoefficientKs).toBe(1.0);
    expect(res.isUnderWaterStress).toBe(false);
    expect(res.etcAdjustedMmDay).toBeCloseTo(res.etcMaxMmDay, 2);
  });

  it("ajuste le Kc à la hausse en climat sahélien venteux et très sec (éq. 62)", () => {
    // Sahel : vent 3.5 m/s, RHmin 15 %, plante h = 0.8 m
    const kcAdjusted = adjustKcForClimate(1.15, 0.8, 3.5, 15.0);
    // delta = [0.04 * (3.5 - 2) - 0.004 * (15 - 45)] * (0.8 / 3)^0.3
    // delta = [0.04 * 1.5 - 0.004 * (-30)] * (0.2667)^0.3
    // delta = [0.06 + 0.12] * 0.6728 = 0.18 * 0.6728 = +0.121
    // Kc = 1.15 + 0.121 = 1.271
    expect(kcAdjusted).toBeGreaterThan(1.25);
    expect(kcAdjusted).toBeLessThan(1.30);
  });

  it("active le facteur de réduction de stress hydrique Ks lorsque Dr > RAW", () => {
    // Même sol et culture, mais épuisement Dr = 65 mm (> RAW 36.3 mm)
    const res = calculateCropWaterRequirements({
      cropName: "Tomate plein champ",
      et0MmDay: 5.0,
      stage: tomatoMidSeason,
      soil: sandyLoamSoil,
      windSpeed2mMs: 2.0,
      rhMinPercent: 45.0,
      currentDepletionDrMm: 65.0, // sol asséché
    });

    expect(res.isUnderWaterStress).toBe(true);
    // Ks = (TAW - Dr) / (TAW - RAW) = (98.0 - 65.0) / (98.0 - 36.26) = 33.0 / 61.74 = ~0.534
    expect(res.stressCoefficientKs).toBeGreaterThan(0.50);
    expect(res.stressCoefficientKs).toBeLessThan(0.58);
    // L'évapotranspiration réelle ETc_adj est réduite de moitié par fermeture des stomates
    expect(res.etcAdjustedMmDay).toBeLessThan(res.etcMaxMmDay * 0.6);
    expect(res.provenance.validityWarnings.some((w) => w.includes("STRESS HYDRIQUE ACTIF"))).toBe(true);
  });

  it("ramène Ks à 0 lorsque le sol atteint le point de flétrissement permanent (Dr >= TAW)", () => {
    const res = calculateCropWaterRequirements({
      cropName: "Tomate plein champ",
      et0MmDay: 5.0,
      stage: tomatoMidSeason,
      soil: sandyLoamSoil,
      currentDepletionDrMm: 98.0, // réserve utile entièrement épuisée
    });

    expect(res.stressCoefficientKs).toBe(0.0);
    expect(res.etcAdjustedMmDay).toBe(0.0);
  });

  it("corrige la fraction d'épuisement p de manière inversement proportionnelle à ETc", () => {
    // Si forte demande évaporative ETc = 8 mm/j -> p diminue (la plante stresse plus vite)
    const pHighDemand = adjustDepletionFractionP(0.5, 8.0);
    // Si faible demande ETc = 2 mm/j -> p augmente (la plante supporte plus d'assèchement)
    const pLowDemand = adjustDepletionFractionP(0.5, 2.0);

    expect(pHighDemand).toBeLessThan(0.5);
    expect(pLowDemand).toBeGreaterThan(0.5);
  });
});
