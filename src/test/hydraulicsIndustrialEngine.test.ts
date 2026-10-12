import { describe, it, expect } from "vitest";
import {
  calculateHydraulics,
  calculateSingularLossesFromFittings,
  calculateSolarPumpingSizing,
  calculateNpshAnalysis,
  FITTING_K_FACTORS,
} from "@/utils/hydraulics/engine";

describe("Moteur Hydraulique Industriel & Solaire (Standards IrriPro / EPANET)", () => {
  it("calcule avec rigueur les pertes singulières d'un réseau complet de raccords", () => {
    // Vitesse v = 1.5 m/s
    // dynamicHead = v² / (2*g) = 2.25 / 19.6133 = ~0.1147 mCE
    const fittings = [
      { type: "coude_90" as const, count: 4 }, // 4 * 0.90 = 3.6
      { type: "clapet_anti_retour" as const, count: 1 }, // 2.5
      { type: "filtre_tamis_disques" as const, count: 1 }, // 3.0
      { type: "vanne_passage_direct" as const, count: 2 }, // 2 * 0.20 = 0.4
    ];
    // total K = 3.6 + 2.5 + 3.0 + 0.4 = 9.5
    // hs = 9.5 * 0.1147 = ~1.09 mCE
    const singularLossMce = calculateSingularLossesFromFittings(1.5, fittings);
    expect(singularLossMce).toBeGreaterThan(1.0);
    expect(singularLossMce).toBeLessThan(1.2);
  });

  it("calcule le dimensionnement solaire photovoltaïque au fil du soleil pour un forage sahélien", () => {
    // Volume journalier = 40 m³/jour pour maraîchage 1 hectare
    // HMT = 50 mCE
    // HSP = 5.5 h/jour (Burkina Faso)
    const result = calculateSolarPumpingSizing({
      dailyVolumeM3: 40,
      hmtMce: 50,
      peakSunHours: 5.5,
      ambientTemperatureC: 38,
      motorPumpEfficiency: 0.62,
      inverterEfficiency: 0.95,
      dirtLossFactor: 0.05,
      panelNominalPowerW: 550,
    });

    expect(result.hydraulicEnergyKwhPerDay).toBeGreaterThan(5.0);
    expect(result.installedPanelsCount).toBeGreaterThanOrEqual(4);
    expect(result.installedTotalPowerWc).toBeGreaterThanOrEqual(2200);
    expect(result.averagePumpFlowRateM3h).toBeCloseTo(40 / 5.5, 1);
    expect(result.performanceRatio).toBeGreaterThan(0.65);
    expect(result.performanceRatio).toBeLessThan(0.85);
  });

  it("détecte le risque de cavitation lorsque la hauteur d'aspiration dépasse la marge NPSH", () => {
    // Pompe de surface avec hauteur géométrique d'aspiration de 7m (très risqué au Sahel à 38°C)
    const resultRisk = calculateNpshAnalysis({
      altitudeM: 300,
      waterTemperatureC: 35,
      suctionLiftM: 7.0,
      suctionFrictionLossMce: 1.2,
      npshRequiredM: 3.5,
    });

    expect(resultRisk.isCavitationRisk).toBe(true);
    expect(resultRisk.safetyMarginM).toBeLessThan(0.5);
    expect(resultRisk.recommendation).toContain("Alerte cavitation");

    // Même pompe mais en immersion ou charge positive (aspiration 1.5m)
    const resultSafe = calculateNpshAnalysis({
      altitudeM: 300,
      waterTemperatureC: 25,
      suctionLiftM: 1.5,
      suctionFrictionLossMce: 0.3,
      npshRequiredM: 3.0,
    });

    expect(resultSafe.isCavitationRisk).toBe(false);
    expect(resultSafe.safetyMarginM).toBeGreaterThan(0.5);
    expect(resultSafe.recommendation).toContain("Installation conforme");
  });

  it("maintient l'exactitude des calculs Hazen-Williams et Christiansen sans régression", () => {
    const res = calculateHydraulics({
      flowRate: 10,
      staticPressure: 2.5,
      length: 100,
      internalDiameter: 50,
      elevationDifference: 5,
      outletsCount: 20,
      requiredPressure: 1.0,
    });

    expect(res.velocity).toBeGreaterThan(1.3);
    expect(res.velocity).toBeLessThan(1.5);
    expect(res.christiansenFactor).toBeGreaterThan(0.35);
    expect(res.christiansenFactor).toBeLessThan(0.40);
    expect(res.isPressureAdequate).toBe(true);
  });
});
