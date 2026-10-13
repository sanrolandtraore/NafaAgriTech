/**
 * Tests de validation du moteur d'optimisation linéaire (Simplex),
 * de formulation de rations à moindre coût et du diagnostic bioclimatique THI.
 */

import { describe, it, expect } from "vitest";
import { solveLinearProgram } from "../../engineering/zootechnics/linearProgramming";
import {
  formulateLeastCostRation,
  SAHELIAN_FEED_LIBRARY,
  STANDARD_POULTRY_TARGETS,
} from "../../engineering/zootechnics/leastCostRation";
import {
  calculateThiIndex,
  diagnoseBioclimaticStress,
} from "../../engineering/zootechnics/bioclimaticThi";

describe("Solveur Simplex Linéaire Exact (Deux Phases)", () => {
  it("résout un problème linéaire de référence avec contraintes d'inégalités >= et <=", () => {
    // Problème :
    // Min Z = 2*x1 + 3*x2
    // S.C. :
    // x1 + x2 >= 10
    // 2*x1 + x2 >= 14
    // x1, x2 >= 0
    // Solution théorique : sommets réalisables (0, 14) -> Z=42, (4, 6) -> Z=26, (10, 0) -> Z=20
    // Minimum en (10, 0) : Z = 20
    const solution = solveLinearProgram({
      objective: "minimize",
      costCoefficients: [2, 3],
      constraints: [
        { coefficients: [1, 1], operator: ">=", rhs: 10 },
        { coefficients: [2, 1], operator: ">=", rhs: 14 },
      ],
    });

    expect(solution.isFeasible).toBe(true);
    expect(solution.isUnbounded).toBe(false);
    expect(solution.optimalValue).toBeCloseTo(20.0, 4);
    expect(solution.variableValues[0]).toBeCloseTo(10.0, 4);
    expect(solution.variableValues[1]).toBeCloseTo(0.0, 4);
  });

  it("identifie rigoureusement un système de contraintes infaisable", () => {
    // x1 >= 10 et x1 <= 5
    const solution = solveLinearProgram({
      objective: "minimize",
      costCoefficients: [1],
      constraints: [
        { coefficients: [1], operator: ">=", rhs: 10 },
        { coefficients: [1], operator: "<=", rhs: 5 },
      ],
    });

    expect(solution.isFeasible).toBe(false);
    expect(solution.statusMessage).toContain("infaisable");
  });
});

describe("Formulation de rations à moindre coût (Least-Cost Formulation)", () => {
  it("optimise à moindre coût la ration démarrage poulet de chair avec ingrédients sahéliens", () => {
    const target = STANDARD_POULTRY_TARGETS.broiler_starter;
    const result = formulateLeastCostRation({
      target,
      availableIngredients: SAHELIAN_FEED_LIBRARY,
      batchWeightKg: 100, // lot de 100 kg
    });

    expect(result.isFeasible).toBe(true);
    // Coût de revient typique d'un aliment démarrage en Afrique de l'Ouest : 270 à 330 FCFA/kg
    expect(result.costPerKgFcfa).toBeGreaterThan(250);
    expect(result.costPerKgFcfa).toBeLessThan(350);

    // Vérifier le respect strict des contraintes nutritionnelles NRC
    expect(result.achievedNutrients.crudeProteinPercent).toBeGreaterThanOrEqual(target.minCrudeProteinPercent - 0.05);
    expect(result.achievedNutrients.energyKcalKg).toBeGreaterThanOrEqual(target.minEnergyKcalKg - 10);
    expect(result.achievedNutrients.lysinePercent).toBeGreaterThanOrEqual(target.minLysinePercent - 0.01);
    expect(result.achievedNutrients.methioninePercent).toBeGreaterThanOrEqual(target.minMethioninePercent - 0.01);

    // Somme des proportions = 100%
    const totalPct = result.inclusions.reduce((s, inc) => s + inc.percentageInRation, 0);
    expect(totalPct).toBeCloseTo(100.0, 1);

    // Vérifier la limitation toxicologique du tourteau de coton (max 15%)
    const cottonInclusion = result.inclusions.find((inc) => inc.ingredientId === "cottonseed_meal");
    if (cottonInclusion) {
      expect(cottonInclusion.percentageInRation).toBeLessThanOrEqual(15.01);
    }
  });

  it("incorpore une forte teneur en coquilles d'huître pour l'aliment poule pondeuse (3.5% Ca)", () => {
    const target = STANDARD_POULTRY_TARGETS.layer_production;
    const result = formulateLeastCostRation({
      target,
      availableIngredients: SAHELIAN_FEED_LIBRARY,
      batchWeightKg: 100,
    });

    expect(result.isFeasible).toBe(true);
    expect(result.achievedNutrients.calciumPercent).toBeGreaterThanOrEqual(3.5);

    // Coquilles d'huître doivent être incorporées pour fournir le calcium de ponte
    const oysterInclusion = result.inclusions.find((inc) => inc.ingredientId === "oyster_shell");
    expect(oysterInclusion).toBeDefined();
    expect(oysterInclusion!.percentageInRation).toBeGreaterThan(6.0);
  });
});

describe("Diagnostic Bioclimatique & Indice THI", () => {
  it("calcule avec exactitude l'indice THI officiel Kibler/NOAA", () => {
    // Conditions chaudes et humides : T = 35°C, RH = 50%
    // TF = 1.8 * 35 + 32 = 95
    // THI = 95 - (0.55 - 0.0055 * 50) * (95 - 58) = 95 - (0.55 - 0.275) * 37 = 95 - 0.275 * 37 = 95 - 10.175 = 84.8
    const thi = calculateThiIndex(35.0, 50.0);
    expect(thi).toBeCloseTo(84.8, 1);
  });

  it("diagnostique le niveau de stress thermique et dimensionne la ventilation CIGR pour 5000 poulets", () => {
    // 5 000 poulets de chair de 1.8 kg sous 38°C et 35% d'humidité (saison chaude sahélienne)
    const diag = diagnoseBioclimaticStress({
      animalType: "poultry_broiler",
      temperatureC: 38.0,
      relativeHumidityPercent: 35.0,
      animalsCount: 5000,
      averageWeightKg: 1.8,
    });

    // Sous 38°C / 35%, THI ≈ 84-86 (zone de danger sévère)
    expect(diag.thiIndex).toBeGreaterThan(82);
    expect(diag.stressLevel).toBe("severe_danger");
    expect(diag.estimatedFeedIntakeDeclinePercent).toBeGreaterThanOrEqual(25);

    // Biomasse totale = 5000 * 1.8 = 9 000 kg
    // Ventilation CIGR recommandée : 9 000 * 7 = 63 000 m³/h
    expect(diag.recommendedVentilationFlowRateM3h).toBe(63000);

    // Chaleur sensible totale produite : 5000 * 10.6 * (1.8^0.75) ≈ 82 kW
    expect(diag.totalSensibleHeatWatts).toBeGreaterThan(70000);
    expect(diag.totalSensibleHeatWatts).toBeLessThan(95000);

    // Vitesse cible pour effet wind-chill d'extraction
    expect(diag.targetAirVelocityMs).toBeGreaterThanOrEqual(2.0);
  });
});
