/**
 * Tests de validation du moteur d'étalonnage des pulvérisateurs et calcul des bouillies
 * selon les normes internationales de la FAO et les directives CSP.
 */

import { describe, it, expect } from "vitest";
import { calculateSprayerCalibration } from "../../engineering/phytosanitary/sprayCalibration";

describe("Étalonnage phytosanitaire et dosage de bouillie (FAO/CSP)", () => {
  it("calcule avec exactitude le volume de bouillie et le dosage par cuve pour un traitement liquide", () => {
    // Cas nominal en maraîchage sahélien :
    // Pulvérisateur à dos de 16 L, buse miroir débit 1.2 L/min, opérateur marchant à 3.6 km/h (1.0 m/s),
    // largeur traitée 1.0 m, parcelle de 0.5 ha, dose homologuée CSP de 1.0 L/ha
    const result = calculateSprayerCalibration({
      tankCapacityLiters: 16,
      nozzleFlowRateLitersPerMin: 1.2,
      walkingSpeedKmH: 3.6,
      spraySwathWidthM: 1.0,
      fieldAreaHa: 0.5,
      productDosePerHa: 1.0,
      doseUnit: "L/ha",
    });

    // V_ha = 600 * 1.2 / (3.6 * 1.0) = 200.0 L/ha
    expect(result.sprayVolumePerHaLiters).toBeCloseTo(200.0, 1);

    // Volume total pour 0.5 ha = 100 L
    expect(result.totalSprayVolumeLiters).toBeCloseTo(100.0, 1);

    // Pleins de cuve de 16 L : 100 / 16 = 6.25 -> 7 cuves nécessaires
    expect(result.numberOfTanksRequired).toBe(7);

    // Quantité par cuve pleine de 16 L : (1000 mL * 16 L) / 200 L = 80 mL
    expect(result.productAmountPerTank).toBe(80.0);
    expect(result.amountPerTankUnit).toBe("mL");

    // Dernière cuve partielle de 4 L d'eau : 20 mL de produit
    expect(result.waterVolumeForLastPartialTank).toBe(4.0);
    expect(result.productAmountForLastPartialTank).toBe(20.0);

    // Quantité totale de produit pour 0.5 ha = 0.5 L
    expect(result.totalProductNeeded).toBe(0.5);
    expect(result.totalProductUnit).toBe("L");
    expect(result.provenance.engine).toBe("SprayerCalibrationEngine");
  });

  it("gère les formulations en poudre mouillable (kg/ha -> grammes par cuve)", () => {
    // Traitement fongicide : dose 2.5 kg/ha, volume 250 L/ha, cuve 15 L
    const result = calculateSprayerCalibration({
      tankCapacityLiters: 15,
      nozzleFlowRateLitersPerMin: 1.25,
      walkingSpeedKmH: 3.0,
      spraySwathWidthM: 1.0, // V_ha = 600 * 1.25 / 3 = 250 L/ha
      fieldAreaHa: 1.0,
      productDosePerHa: 2.5,
      doseUnit: "kg/ha",
    });

    expect(result.sprayVolumePerHaLiters).toBeCloseTo(250.0, 1);
    expect(result.amountPerTankUnit).toBe("g");
    // Par cuve de 15 L : (2500 g * 15 L) / 250 L = 150 g
    expect(result.productAmountPerTank).toBe(150.0);
    expect(result.totalProductNeeded).toBe(2.5);
  });

  it("déclenche des avertissements lorsque la vitesse ou le volume sortent des plages optimales", () => {
    const result = calculateSprayerCalibration({
      tankCapacityLiters: 16,
      nozzleFlowRateLitersPerMin: 0.5,
      walkingSpeedKmH: 5.5, // trop rapide (> 5 km/h)
      spraySwathWidthM: 1.5,
      fieldAreaHa: 1.0,
      productDosePerHa: 1.0,
      doseUnit: "L/ha",
    });

    expect(result.warnings.some((w) => w.includes("Vitesse de marche très élevée"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("Volume de bouillie très faible"))).toBe(true);
  });
});
