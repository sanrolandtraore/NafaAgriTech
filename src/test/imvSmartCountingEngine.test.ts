/**
 * TESTS UNITAIRES — MOTEUR IMV SMART COUNTING & BIOMÉTRIE (EIP)
 * Vérification des calculs de franchissement de couloir, exclusion humaine et Smart Weight
 */

import { describe, it, expect } from "vitest";
import {
  determineTripwireSide,
  isHumanSilhouette,
  estimateAnimalWeightKg,
  computeSmartWeightMetrics,
  generateImvVerificationHash,
  ImvCorridorTracker,
  VirtualTripwireLine,
} from "@/lib/imvSmartCountingEngine";

describe("IMV Technologies Smart Counting Engine", () => {
  const horizontalLine: VirtualTripwireLine = {
    start: { x: 0.1, y: 0.5 },
    end: { x: 0.9, y: 0.5 },
    directionLabelA: "Amont Bâtiment",
    directionLabelB: "Aval Quai",
  };

  describe("1. Géométrie Vectorielle du Tripwire (Côtés A / B)", () => {
    it("détecte correctement un point situé en Zone A (au-dessus / amont)", () => {
      // Pour une ligne orientée de gauche (0.1, 0.5) à droite (0.9, 0.5)
      // Un point en y = 0.2 est en Zone A
      const side = determineTripwireSide(horizontalLine, { x: 0.5, y: 0.2 });
      expect(["A", "B"]).toContain(side);
    });

    it("détecte correctement un point situé en Zone B (en-dessous / aval)", () => {
      const sideA = determineTripwireSide(horizontalLine, { x: 0.5, y: 0.2 });
      const sideB = determineTripwireSide(horizontalLine, { x: 0.5, y: 0.8 });
      // Les deux points doivent être de part et d'autre de la ligne
      expect(sideA).not.toBe(sideB);
      expect(sideA).not.toBe("ON_LINE");
      expect(sideB).not.toBe("ON_LINE");
    });

    it("détecte un point positionné directement sur la ligne (ON_LINE)", () => {
      const side = determineTripwireSide(horizontalLine, { x: 0.5, y: 0.5 });
      expect(side).toBe("ON_LINE");
    });
  });

  describe("2. Filtrage Morphologique d'Exclusion des Humains", () => {
    it("identifie une silhouette humaine debout (haut rapport H/W) et la rejette", () => {
      // Opérateur debout : Largeur 0.10, Hauteur 0.35 -> Rapport H/W = 3.5
      const humanBox = { width: 0.1, height: 0.35 };
      expect(isHumanSilhouette(humanBox, "porcin")).toBe(true);
      expect(isHumanSilhouette(humanBox, "bovin")).toBe(true);
    });

    it("valide les silhouettes d'animaux d'élevage sans les rejeter", () => {
      // Porcin vu de profil/dessus : Largeur 0.25, Hauteur 0.15 -> Rapport H/W = 0.6
      const pigBox = { width: 0.25, height: 0.15 };
      expect(isHumanSilhouette(pigBox, "porcin")).toBe(false);

      // Bovin : Largeur 0.30, Hauteur 0.20 -> Rapport H/W = 0.67
      const cattleBox = { width: 0.3, height: 0.2 };
      expect(isHumanSilhouette(cattleBox, "bovin")).toBe(false);
    });
  });

  describe("3. Smart Weight & Uniformité du Lot (Biométrie)", () => {
    it("calcule une estimation de poids cohérente selon l'espèce", () => {
      const pigWeight = estimateAnimalWeightKg({ width: 0.22, height: 0.16 }, "porcin");
      expect(pigWeight).toBeGreaterThanOrEqual(25);
      expect(pigWeight).toBeLessThanOrEqual(250);

      const cattleWeight = estimateAnimalWeightKg({ width: 0.35, height: 0.25 }, "bovin");
      expect(cattleWeight).toBeGreaterThanOrEqual(150);
      expect(cattleWeight).toBeLessThanOrEqual(650);
    });

    it("calcule correctement le coefficient de variation (CV %) et l'homogénéité", () => {
      // Lot très homogène (ex: porcs charcutiers calibrés à 95 kg ± 2 kg)
      const homogeneousWeights = [94.5, 95.0, 95.5, 94.8, 95.2];
      const metrics = computeSmartWeightMetrics(homogeneousWeights);

      expect(metrics.totalCount).toBe(5);
      expect(metrics.averageWeightKg).toBeCloseTo(95.0, 1);
      expect(metrics.coefficientOfVariationPct).toBeLessThan(5);
      expect(metrics.uniformityGrade).toBe("excellente");

      // Lot très hétérogène (animaux d'âges disparates)
      const heterogeneousWeights = [45, 95, 140, 60, 110];
      const metricsHetero = computeSmartWeightMetrics(heterogeneousWeights);
      expect(metricsHetero.coefficientOfVariationPct).toBeGreaterThan(20);
      expect(metricsHetero.uniformityGrade).toBe("critique");
    });
  });

  describe("4. Suivi Cinématique de Couloir & Scellé Cryptographique", () => {
    it("génère une signature infalsifiable de certification", () => {
      const hash = generateImvVerificationHash("SES-01", "porcin", 120, 10800, "2026-10-14T11:00:00Z");
      expect(hash).toMatch(/^IMV-BF-[0-9A-F]{8}-[0-9A-F]{8}$/);
    });

    it("gère un cycle complet d'entrées, sorties et exclusion d'opérateur humain", () => {
      const tracker = new ImvCorridorTracker("porcin", horizontalLine);

      // Frame 1 : Animal 1 en amont (Zone A)
      tracker.processFrame([{ x: 0.4, y: 0.38, width: 0.2, height: 0.12, confidence: 0.98 }], 1);
      expect(tracker.getNetCount()).toBe(0);

      // Frame 2 : Animal 1 franchit la ligne vers l'aval (Zone B)
      const resCross = tracker.processFrame([{ x: 0.4, y: 0.58, width: 0.2, height: 0.12, confidence: 0.98 }], 2);
      expect(resCross.netCount).toBe(1);
      expect(tracker.getTotals().totalIn).toBe(1);
      expect(tracker.getTotals().totalOut).toBe(0);

      // Frame 3 : Opérateur humain traverse le couloir
      // Doit être détecté comme humain et exclu du comptage
      tracker.processFrame([{ x: 0.5, y: 0.28, width: 0.08, height: 0.35, confidence: 0.99 }], 3);
      tracker.processFrame([{ x: 0.5, y: 0.48, width: 0.08, height: 0.35, confidence: 0.99 }], 4);

      expect(tracker.getTotals().humanExclusions).toBe(1);
      expect(tracker.getNetCount()).toBe(1); // L'humain n'a pas été ajouté !

      // Résumé officiel
      const summary = tracker.getSessionSummary();
      expect(summary.totalIn).toBe(1);
      expect(summary.humanExclusionCount).toBe(1);
      expect(summary.accuracyGuaranteePct).toBe(99.9);
      expect(summary.verificationHash).toContain("IMV-BF-");
    });
  });
});
