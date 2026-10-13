/**
 * Tests de validation du module des émetteurs d'irrigation et d'uniformité (ASAE EP458 / Christiansen)
 */

import { describe, it, expect } from "vitest";
import {
  calculateEmitterK,
  calculateEmitterFlowLh,
  evaluateIrrigationUniformity,
  EmitterSpecification,
} from "../../engineering/hydraulics/emitters";

describe("Modélisation des émetteurs d'irrigation", () => {
  const nonPcDripper: EmitterSpecification = {
    type: "dripper_non_pc",
    nominalFlowLh: 2.0, // 2 L/h à 10 m (1 bar)
    nominalPressureM: 10.0,
    flowExponentX: 0.5,
    manufacturerCv: 0.04,
  };

  const pcDripper: EmitterSpecification = {
    type: "dripper_pc",
    nominalFlowLh: 4.0,
    nominalPressureM: 15.0,
    flowExponentX: 0.05, // résiduel très faible
    minRegulatingPressureM: 5.0,
    maxRegulatingPressureM: 35.0,
    manufacturerCv: 0.03,
  };

  it("calcule le coefficient k exact pour un émetteur à orifice turbulent", () => {
    const k = calculateEmitterK(nonPcDripper);
    // k = 2.0 / sqrt(10) ≈ 0.6324555
    expect(k).toBeCloseTo(2.0 / Math.sqrt(10), 6);
  });

  it("vérifie que quadrupler la pression double le débit pour un orifice (x = 0.5)", () => {
    const q1 = calculateEmitterFlowLh(nonPcDripper, 10.0);
    const q4 = calculateEmitterFlowLh(nonPcDripper, 40.0);
    expect(q1).toBeCloseTo(2.0, 5);
    expect(q4).toBeCloseTo(4.0, 5);
    expect(q4 / q1).toBeCloseTo(2.0, 5);
  });

  it("maintient un débit quasi constant pour un émetteur autorégulant (PC) dans sa plage", () => {
    const qAtMin = calculateEmitterFlowLh(pcDripper, 5.0);
    const qAtNom = calculateEmitterFlowLh(pcDripper, 15.0);
    const qAtMax = calculateEmitterFlowLh(pcDripper, 35.0);

    expect(qAtNom).toBeCloseTo(4.0, 3);
    // Variation maximale inférieure à 6 % sur toute la plage 5m à 35m
    const variation = Math.abs(qAtMax - qAtMin) / qAtNom;
    expect(variation).toBeLessThan(0.12);
  });

  it("calcule une uniformité parfaite (100%) lorsque la pression est rigoureusement constante", () => {
    const pressures = Array(20).fill(10.0);
    const result = evaluateIrrigationUniformity({
      emitter: nonPcDripper,
      pressuresM: pressures,
      emittersPerPlant: 1,
    });

    expect(result.christiansenCuPercent).toBeCloseTo(100.0, 4);
    expect(result.distributionUniformityDuPercent).toBeCloseTo(100.0, 4);
    expect(result.pressureVariationPercent).toBe(0);
    expect(result.flowVariationPercent).toBe(0);
    expect(result.satisfiesAsae20PercentRule).toBe(true);
    // EU = 100 * (1 - 1.27 * 0.04) * (2/2) = 100 * (1 - 0.0508) = 94.92 %
    expect(result.emissionUniformityEuPercent).toBeCloseTo(94.92, 1);
    expect(result.rating).toBe("excellent");
  });

  it("détecte la violation de la règle ASAE des 20% quand le gradient de pression est excessif", () => {
    // Rampe avec chute de 12 m à 8 m (delta P = 4 m pour Pnom = 10 m -> 40% de variation)
    const pressures = [12.0, 11.5, 11.0, 10.5, 10.0, 9.5, 9.0, 8.5, 8.0];
    const result = evaluateIrrigationUniformity({
      emitter: nonPcDripper,
      pressuresM: pressures,
      emittersPerPlant: 1,
    });

    expect(result.pressureVariationPercent).toBeCloseTo(40.0, 2);
    expect(result.satisfiesAsae20PercentRule).toBe(false);
    expect(result.provenance.validityWarnings.some((w) => w.includes("20% limite ASAE"))).toBe(true);
    // Christiansen CU reste raisonnable (~95%) mais la règle de pression est violée
    expect(result.christiansenCuPercent).toBeGreaterThan(90);
  });

  it("améliore l'uniformité d'émission (EU) lorsqu'il y a 2 émetteurs par plante (loi statistique en 1/sqrt(ne))", () => {
    const pressures = [10.5, 10.2, 10.0, 9.8, 9.5];
    const res1 = evaluateIrrigationUniformity({
      emitter: nonPcDripper,
      pressuresM: pressures,
      emittersPerPlant: 1,
    });
    const res2 = evaluateIrrigationUniformity({
      emitter: nonPcDripper,
      pressuresM: pressures,
      emittersPerPlant: 2,
    });

    expect(res2.emissionUniformityEuPercent).toBeGreaterThan(res1.emissionUniformityEuPercent);
  });
});
