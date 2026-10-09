import { describe, it, expect } from "vitest";
import {
  calculateHydraulics,
  calculateChristiansenFactor,
  calculateHazenWilliamsUnitLoss,
  calculateFlowVelocity,
  validateHydraulicInput,
  MATERIAL_ROUGHNESS,
  HydraulicInput,
} from "./engine";

describe("Noyau de calcul hydraulique déterministe (Hazen-Williams & Christiansen)", () => {
  describe("Facteur de réduction de Christiansen (F)", () => {
    it("vaut exactement 1.0 pour une conduite simple sans sorties multiples (N = 1)", () => {
      const f = calculateChristiansenFactor(1);
      expect(f).toBe(1.0);
    });

    it("diminue de façon monotone à mesure que le nombre de sorties augmente", () => {
      const f5 = calculateChristiansenFactor(5);
      const f10 = calculateChristiansenFactor(10);
      const f50 = calculateChristiansenFactor(50);
      const f100 = calculateChristiansenFactor(100);

      expect(f5).toBeGreaterThan(f10);
      expect(f10).toBeGreaterThan(f50);
      expect(f50).toBeGreaterThan(f100);
      // Pour N grand, F tend vers 1 / (1.852 + 1) = 0.35063
      expect(f100).toBeCloseTo(0.355, 2);
    });

    it("calcule la valeur exacte pour N = 10 sorties selon l'équation de Christiansen", () => {
      // F = 1/2.852 + 1/20 + sqrt(0.852)/(600) = 0.35063 + 0.05 + 0.001538 = 0.40217
      const f10 = calculateChristiansenFactor(10);
      expect(f10).toBeCloseTo(0.402, 3);
    });
  });

  describe("Vitesse d'écoulement et alertes physiques", () => {
    it("calcule la vitesse avec précision selon v = Q / A", () => {
      // Q = 3.6 m³/h = 0.001 m³/s
      // Diamètre intérieur = 50 mm = 0.05 m
      // Section = PI * 0.05² / 4 = 0.0019635 m²
      // v = 0.001 / 0.0019635 = 0.509 m/s
      const v = calculateFlowVelocity(3.6, 50);
      expect(v).toBeCloseTo(0.509, 2);
    });

    it("déclenche une alerte de coup de bélier si v > 2.5 m/s", () => {
      // Débit élevé dans une petite section : 20 m³/h dans du Ø32 mm
      const res = calculateHydraulics({
        flowRate: 20,
        staticPressure: 3.0,
        length: 100,
        internalDiameter: 32,
        material: "PEHD",
        elevationDifference: 0,
        outletsCount: 1,
        requiredPressure: 1.0,
      });

      expect(res.velocity).toBeGreaterThan(2.5);
      const hammerWarning = res.warnings.find((w) => w.code === "HAMMER_RISK");
      expect(hammerWarning).toBeDefined();
      expect(hammerWarning?.level).toBe("danger");
      expect(hammerWarning?.message).toMatch(/coup de bélier/i);
    });

    it("déclenche un avertissement de sédimentation si v < 0.5 m/s", () => {
      // Débit faible dans un gros tuyau : 0.5 m³/h dans du Ø63 mm
      const res = calculateHydraulics({
        flowRate: 0.5,
        staticPressure: 2.5,
        length: 50,
        internalDiameter: 63,
        material: "PEHD",
        elevationDifference: 0,
        outletsCount: 1,
        requiredPressure: 1.0,
      });

      expect(res.velocity).toBeLessThan(0.5);
      const sedWarning = res.warnings.find((w) => w.code === "SEDIMENTATION_RISK");
      expect(sedWarning).toBeDefined();
      expect(sedWarning?.level).toBe("warning");
      expect(sedWarning?.message).toMatch(/sédimentation/i);
    });
  });

  describe("Pertes de charge Hazen-Williams selon le matériau", () => {
    it("calcule des pertes plus faibles pour le PVC (C=150) que pour le PEHD (C=140) et l'Acier (C=100)", () => {
      const baseInput = {
        flowRate: 10,
        staticPressure: 4.0,
        length: 150,
        internalDiameter: 50,
        elevationDifference: 0,
        outletsCount: 1,
        requiredPressure: 1.0,
      };

      const resPvc = calculateHydraulics({ ...baseInput, material: "PVC" });
      const resPehd = calculateHydraulics({ ...baseInput, material: "PEHD" });
      const resSteel = calculateHydraulics({ ...baseInput, material: "Acier" });

      expect(resPvc.linearFrictionLossMce).toBeLessThan(resPehd.linearFrictionLossMce);
      expect(resPehd.linearFrictionLossMce).toBeLessThan(resSteel.linearFrictionLossMce);
    });

    it("calcule la perte de charge unitaire avec la formule universelle Hazen-Williams", () => {
      // Q = 7.2 m³/h = 0.002 m³/s, D = 40 mm = 0.04 m, C = 140
      const j = calculateHazenWilliamsUnitLoss(7.2, 40, 140);
      expect(j).toBeGreaterThan(0.01);
      expect(j).toBeLessThan(0.1);
    });
  });

  describe("Dénivelé topographique et pression résiduelle au point critique", () => {
    it("réduit la pression résiduelle en cas de montée topographique (Δh > 0)", () => {
      const flat = calculateHydraulics({
        flowRate: 6.0,
        staticPressure: 2.5,
        length: 100,
        internalDiameter: 50,
        material: "PEHD",
        elevationDifference: 0,
        outletsCount: 20,
        requiredPressure: 1.0,
      });

      const uphill = calculateHydraulics({
        flowRate: 6.0,
        staticPressure: 2.5,
        length: 100,
        internalDiameter: 50,
        material: "PEHD",
        elevationDifference: 10, // Montée de 10 mètres
        outletsCount: 20,
        requiredPressure: 1.0,
      });

      expect(uphill.residualPressureMce).toBeCloseTo(flat.residualPressureMce - 10, 1);
      expect(uphill.residualPressureBar).toBeLessThan(flat.residualPressureBar);
    });

    it("déclenche une alerte rouge si la pression résiduelle est inférieure à la pression requise", () => {
      // Pression statique insuffisante de 0.8 Bar alors qu'on exige 1.5 Bar
      const res = calculateHydraulics({
        flowRate: 8.0,
        staticPressure: 0.8,
        length: 200,
        internalDiameter: 40,
        material: "PEHD",
        elevationDifference: 5,
        outletsCount: 10,
        requiredPressure: 1.5,
      });

      expect(res.isPressureAdequate).toBe(false);
      const alert = res.warnings.find((w) => w.code === "INSUFFICIENT_PRESSURE" || w.code === "NEGATIVE_PRESSURE");
      expect(alert).toBeDefined();
      expect(alert?.level).toBe("danger");
    });
  });

  describe("Validation des entrées techniques", () => {
    it("détecte les champs obligatoires manquants ou invalides", () => {
      const missing = validateHydraulicInput({
        flowRate: 0, // Invalide
        staticPressure: undefined,
        length: -10, // Invalide
      });

      expect(missing).toContain("Débit source (m³/h)");
      expect(missing).toContain("Pression statique disponible (Bar)");
      expect(missing).toContain("Longueur de conduite (m)");
      expect(missing).toContain("Diamètre intérieur (mm)");
    });

    it("valide une saisie complète avec succès", () => {
      const missing = validateHydraulicInput({
        flowRate: 6.5,
        staticPressure: 3.0,
        length: 120,
        internalDiameter: 50,
        elevationDifference: 2,
        outletsCount: 15,
      });

      expect(missing.length).toBe(0);
    });
  });
});
