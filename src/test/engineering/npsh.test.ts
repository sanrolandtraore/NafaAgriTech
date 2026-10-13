/**
 * Tests de validation du module NPSH et analyse de cavitation
 */

import { describe, it, expect } from "vitest";
import { calculateNpsh } from "../../engineering/hydraulics/npsh";

describe("Calcul NPSH disponible et risque de cavitation", () => {
  // Cas nominal : pompe d'irrigation standard, altitude 300 m (ex: région Ouagadougou / Sahel),
  // eau à 25°C, aspiration géométrique 3.0 m (au-dessus de l'eau), débit 10 m³/h (0.002778 m³/s),
  // conduite PEHD D=63mm (ID=55.4mm), L=6m, crépine clapet K=6.5
  it("calcule avec précision le NPSHa en conditions de plaine sahelienne (300m, 25°C)", () => {
    const result = calculateNpsh({
      flowM3s: 10 / 3600, // ~0.00278 m³/s
      altitudeM: 300,
      waterTemperatureC: 25,
      staticSuctionHeadM: -3.0, // pompe 3m au-dessus du plan d'eau
      suctionPipe: {
        lengthM: 6,
        diameterM: 0.0554, // DN63 PEHD PN10
        roughnessM: 0.000007,
        minorLossCoefficientK: 6.5, // crépine + clapet + coude 90
      },
      npshRequiredM: 3.5, // NPSHr typique pompe de surface à 10 m³/h
    });

    // Pression atmosphérique à 300m ~ 97.7 kPa (~9.98 m d'eau)
    expect(result.atmosphericHeadM).toBeGreaterThan(9.8);
    expect(result.atmosphericHeadM).toBeLessThan(10.2);

    // Pression de vapeur à 25°C ~ 3.17 kPa (~0.32 m d'eau)
    expect(result.vaporPressureHeadM).toBeGreaterThan(0.3);
    expect(result.vaporPressureHeadM).toBeLessThan(0.35);

    // Pertes à l'aspiration modérées à cette vitesse (v ~ 1.15 m/s)
    expect(result.suctionVelocityMs).toBeGreaterThan(1.0);
    expect(result.suctionVelocityMs).toBeLessThan(1.3);
    expect(result.suctionHeadLossM).toBeGreaterThan(0.4);
    expect(result.suctionHeadLossM).toBeLessThan(0.8);

    // NPSHa = Patm/(rho g) - Pv/(rho g) - 3.0 - Hf
    // ~ 10.0 - 0.32 - 3.0 - 0.55 = ~6.13 m
    expect(result.npshAvailableM).toBeGreaterThan(5.8);
    expect(result.npshAvailableM).toBeLessThan(6.4);

    // NPSHr = 3.5 m -> Marge ~ 2.6 m > 0.6 m recommandée
    expect(result.marginM).toBeGreaterThan(2.0);
    expect(result.risk).toBe("safe");
    expect(result.maxPermissibleSuctionLiftM).toBeGreaterThan(4.9);
  });

  it("détecte une cavitation critique lorsque la hauteur d'aspiration ou la température est trop élevée", () => {
    // Cas critique : eau chaude (40°C), altitude 1800 m, aspiration 6.5 m au-dessus de l'eau,
    // NPSHr = 4.0 m
    const result = calculateNpsh({
      flowM3s: 15 / 3600,
      altitudeM: 1800, // Patm réduite ~ 81.5 kPa (~8.37 m)
      waterTemperatureC: 40, // Pv accrue ~ 7.38 kPa (~0.76 m)
      staticSuctionHeadM: -6.5, // aspiration profonde
      suctionPipe: {
        lengthM: 10,
        diameterM: 0.050,
        roughnessM: 0.000007,
        minorLossCoefficientK: 8.0,
      },
      npshRequiredM: 4.0,
    });

    // Patm ~ 8.37 m, Pv ~ 0.76 m -> Patm - Pv ~ 7.61 m
    // Z = -6.5 m -> 7.61 - 6.5 = 1.11 m
    // Moins les pertes d'aspiration -> NPSHa < 0.5 m < NPSHr (4.0 m)
    expect(result.npshAvailableM).toBeLessThan(1.0);
    expect(result.risk).toBe("critical_cavitation");
    expect(result.marginM).toBeLessThan(0);
    expect(result.provenance.validityWarnings.some((w) => w.includes("CAVITATION CRITIQUE"))).toBe(true);
  });

  it("identifie une marge marginale (risque d'amorçage de cavitation)", () => {
    const result = calculateNpsh({
      flowM3s: 12 / 3600,
      altitudeM: 500,
      waterTemperatureC: 30,
      staticSuctionHeadM: -4.5,
      suctionPipe: {
        lengthM: 8,
        diameterM: 0.0554,
        roughnessM: 0.000007,
        minorLossCoefficientK: 5.0,
      },
      npshRequiredM: 3.6, // NPSHa ~ 3.97m -> marge ~ 0.37m, inférieure au 0.60m recommandé
    });

    expect(result.risk).toBe("marginal");
    expect(result.marginM).toBeGreaterThanOrEqual(0);
    expect(result.marginM).toBeLessThan(result.recommendedMarginM!);
  });

  it("augmente le NPSHa lorsque la pompe est en charge (plan d'eau au-dessus de la pompe)", () => {
    const result = calculateNpsh({
      flowM3s: 10 / 3600,
      altitudeM: 300,
      waterTemperatureC: 20,
      staticSuctionHeadM: +2.5, // réservoir surélevé de 2.5 m
      suctionPipe: {
        lengthM: 5,
        diameterM: 0.063,
        roughnessM: 0.000007,
        minorLossCoefficientK: 2.0,
      },
      npshRequiredM: 3.0,
    });

    // En charge : NPSHa > 12 m
    expect(result.npshAvailableM).toBeGreaterThan(12.0);
    expect(result.risk).toBe("safe");
  });

  it("rejette des débits ou dimensions non physiques", () => {
    expect(() =>
      calculateNpsh({
        flowM3s: 0,
        altitudeM: 0,
        staticSuctionHeadM: 0,
        suctionPipe: { lengthM: 5, diameterM: 0.05, roughnessM: 0.00001 },
      }),
    ).toThrow(/strictement positif/);

    expect(() =>
      calculateNpsh({
        flowM3s: 0.001,
        altitudeM: 0,
        staticSuctionHeadM: 0,
        suctionPipe: { lengthM: 0, diameterM: 0.05, roughnessM: 0.00001 },
      }),
    ).toThrow(/strictement positives/);
  });
});
