import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateIoU,
  VideoAnimalTracker,
  LIVESTOCK_DENSITY_STANDARDS,
  DetectionBox,
  AnimalSpeciesType,
} from "../lib/livestockVisionCounter";
import { livestockCountStorage } from "../lib/livestockCountStorage";
import { generateLivestockCountPdf } from "../lib/livestockCountPdf";

describe("Module de Vision & Comptage Intelligent d'Animaux", () => {
  describe("1. Géométrie & Intersection over Union (IoU)", () => {
    it("calcule un IoU de 1.0 pour deux boîtes identiques", () => {
      const boxA: DetectionBox = { id: "1", x: 0.1, y: 0.1, width: 0.2, height: 0.2, confidence: 0.9 };
      const boxB: DetectionBox = { id: "2", x: 0.1, y: 0.1, width: 0.2, height: 0.2, confidence: 0.9 };
      expect(calculateIoU(boxA, boxB)).toBeCloseTo(1.0, 3);
    });

    it("calcule un IoU de 0.0 pour deux boîtes totalement disjointes", () => {
      const boxA: DetectionBox = { id: "1", x: 0.1, y: 0.1, width: 0.1, height: 0.1, confidence: 0.9 };
      const boxB: DetectionBox = { id: "2", x: 0.5, y: 0.5, width: 0.1, height: 0.1, confidence: 0.9 };
      expect(calculateIoU(boxA, boxB)).toBe(0.0);
    });

    it("calcule un IoU correct pour un chevauchement partiel", () => {
      const boxA: DetectionBox = { id: "1", x: 0.0, y: 0.0, width: 0.2, height: 0.2, confidence: 0.9 };
      const boxB: DetectionBox = { id: "2", x: 0.1, y: 0.0, width: 0.2, height: 0.2, confidence: 0.9 };
      // Intersection = 0.1 * 0.2 = 0.02
      // Union = 0.04 + 0.04 - 0.02 = 0.06
      // IoU = 0.02 / 0.06 = 1/3 ~ 0.333
      expect(calculateIoU(boxA, boxB)).toBeCloseTo(0.333, 2);
    });
  });

  describe("2. VideoAnimalTracker — Déduplication temporelle & Anti double comptage", () => {
    it("ne compte qu'une seule fois un individu présent sur plusieurs frames consécutives", () => {
      const tracker = new VideoAnimalTracker();

      // Frame 0 : Un poulet détecté en (0.2, 0.2)
      const frame0Boxes: DetectionBox[] = [
        { id: "f0_1", x: 0.2, y: 0.2, width: 0.05, height: 0.05, confidence: 0.95 },
      ];
      const updatedF0 = tracker.updateFrame(frame0Boxes, 0);
      expect(updatedF0[0].trackId).toBeDefined();
      expect(tracker.getTotalUniqueCount()).toBe(1);

      // Frame 1 : Le même poulet a légèrement bougé en (0.21, 0.205)
      const frame1Boxes: DetectionBox[] = [
        { id: "f1_1", x: 0.21, y: 0.205, width: 0.05, height: 0.05, confidence: 0.94 },
      ];
      const updatedF1 = tracker.updateFrame(frame1Boxes, 1);
      expect(updatedF1[0].trackId).toBe(updatedF0[0].trackId); // Même ID attribué
      expect(tracker.getTotalUniqueCount()).toBe(1); // Effectif total reste 1

      // Frame 2 : Un second poulet entre dans l'enclos en (0.7, 0.7)
      const frame2Boxes: DetectionBox[] = [
        { id: "f2_1", x: 0.22, y: 0.21, width: 0.05, height: 0.05, confidence: 0.96 },
        { id: "f2_2", x: 0.7, y: 0.7, width: 0.05, height: 0.05, confidence: 0.92 },
      ];
      tracker.updateFrame(frame2Boxes, 2);
      expect(tracker.getTotalUniqueCount()).toBe(2); // Deux sujets au total
    });
  });

  describe("3. Normes Zootechniques & Densité Sahélienne", () => {
    it("fournit des seuils de densité adaptés pour la volaille en climat chaud", () => {
      const volailleStandard = LIVESTOCK_DENSITY_STANDARDS.volaille;
      expect(volailleStandard.standardMaxDensityPerM2).toBe(10);
      expect(volailleStandard.alertThresholdPerM2).toBe(12);
      expect(volailleStandard.unit).toBe("sujets.m²");
    });

    it("fournit des seuils de densité adaptés pour les bovins en stabulation", () => {
      const bovinStandard = LIVESTOCK_DENSITY_STANDARDS.bovin;
      expect(bovinStandard.standardMaxDensityPerM2).toBeLessThanOrEqual(0.3);
    });
  });

  describe("4. Persistance Locale & Synchronisation Offline", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("enregistre un comptage avec statut 'pending' hors-ligne", async () => {
      const saved = await livestockCountStorage.saveCount({
        species: "volaille",
        sourceType: "photo",
        detectedCount: 150,
        correctedCount: 155,
        confidenceScore: 92,
        confidenceLevel: "haute",
        surfaceAreaM2: 15,
        densityPerM2: 10.3,
        isOvercrowded: false,
        technicianNotes: "Enclos propre et aéré",
        detectionsSnapshot: [],
      });

      expect(saved.id).toBeDefined();
      expect(saved.syncStatus).toBe("pending");

      const all = livestockCountStorage.getAll();
      expect(all.length).toBe(1);
      expect(all[0].correctedCount).toBe(155);
    });
  });

  describe("5. Générateur de Rapport PDF", () => {
    it("génère un document PDF valide pour un rapport d'audit", () => {
      const mockRecord = {
        id: "test_rec_001",
        species: "volaille" as AnimalSpeciesType,
        countedAt: new Date().toISOString(),
        sourceType: "photo" as const,
        detectedCount: 420,
        correctedCount: 425,
        confidenceScore: 95,
        confidenceLevel: "haute" as const,
        surfaceAreaM2: 40,
        densityPerM2: 10.6,
        isOvercrowded: false,
        syncStatus: "synced" as const,
        detectionsSnapshot: [],
      };

      const doc = generateLivestockCountPdf({
        record: mockRecord,
        farmName: "Ferme Wend-Panga",
        location: "Koubri, Burkina Faso",
        technicianName: "Dr. Oumar Traoré",
      });

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0); // A4 portrait
    });
  });
});
