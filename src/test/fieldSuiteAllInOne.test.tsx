import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fieldSuiteStorage,
  generateSatelliteNdviAnalysis,
  FieldSuiteMission,
} from "@/lib/fieldSuiteStorage";
import {
  calculateDistanceM,
  calculateBearingDeg,
  calculatePolygonAreaM2,
  calculatePerimeterM,
  calculateCentroid,
} from "@/lib/gpsSurveyEngine";
import { generateFieldSuiteReportPdf } from "@/lib/fieldSuitePdf";

describe("Suite Tout-en-Un Agronome (Arpentage + Satellite + Diagnostic)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("1. Arpentage : Calcule correctement la superficie, le périmètre et le centroïde", () => {
    // Polygone régulier test à Ouagadougou / Loumbila
    const coords = [
      { lat: 12.518, lng: -1.403 },
      { lat: 12.519, lng: -1.401 },
      { lat: 12.517, lng: -1.401 },
      { lat: 12.517, lng: -1.403 },
    ];

    const areaM2 = calculatePolygonAreaM2(coords);
    const perimeterM = calculatePerimeterM(coords);
    const centroid = calculateCentroid(coords);

    expect(areaM2).toBeGreaterThan(1000);
    expect(perimeterM).toBeGreaterThan(100);
    expect(centroid.lat).toBeCloseTo(12.5177, 2);
    expect(centroid.lng).toBeCloseTo(-1.402, 2);
  });

  it("2. Imagerie Satellite NDVI : Génère la répartition du stress et les foyers d'anomalies", () => {
    const coords = [
      { lat: 12.518, lng: -1.403 },
      { lat: 12.519, lng: -1.401 },
      { lat: 12.517, lng: -1.401 },
      { lat: 12.517, lng: -1.403 },
    ];
    const centroid = { lat: 12.518, lng: -1.402 };
    const areaM2 = 18500;

    const sat = generateSatelliteNdviAnalysis(coords, centroid, areaM2, "Maïs");

    expect(sat.meanNdvi).toBeGreaterThan(0.4);
    expect(sat.optimalAreaPct + sat.moderateAreaPct + sat.stressAreaPct).toBe(100);
    expect(sat.hotspots.length).toBe(3);

    // Vérifier les 3 anomalies ciblées
    const a1 = sat.hotspots.find((h) => h.code === "A1");
    const a2 = sat.hotspots.find((h) => h.code === "A2");
    const a3 = sat.hotspots.find((h) => h.code === "A3");

    expect(a1).toBeDefined();
    expect(a1?.predictedIssue).toContain("Azotée");
    expect(a2).toBeDefined();
    expect(a2?.predictedIssue).toContain("hydrique");
    expect(a3).toBeDefined();
    expect(a3?.predictedIssue).toContain("parasitaire");
  });

  it("3. Guidage GPS & Radar : Calcule en temps réel la distance et l'azimut vers l'anomalie", () => {
    const livePos = { lat: 12.518, lng: -1.403 };
    const anomalyTarget = { lat: 12.5185, lng: -1.402 };

    const distanceM = calculateDistanceM(livePos, anomalyTarget);
    const bearingDeg = calculateBearingDeg(livePos, anomalyTarget);

    expect(distanceM).toBeGreaterThan(0);
    expect(bearingDeg).toBeGreaterThanOrEqual(0);
    expect(bearingDeg).toBeLessThanOrEqual(360);

    // Test de proximité d'arrivée (< 5m)
    const veryClosePos = { lat: 12.5185001, lng: -1.4020001 };
    const distClose = calculateDistanceM(veryClosePos, anomalyTarget);
    expect(distClose).toBeLessThan(5);
  });

  it("4. Stockage Mission & Démo : Permet de créer, persister et récupérer une mission complète", () => {
    const demo = fieldSuiteStorage.createDemoMission();
    expect(demo.waypoints.length).toBe(4);
    expect(demo.satelliteData).toBeDefined();
    expect(demo.areaHa).toBeGreaterThan(1);

    fieldSuiteStorage.save(demo);
    const retrieved = fieldSuiteStorage.getById(demo.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.parcelName).toBe(demo.parcelName);
  });

  it("5. Rapport PDF : Génère le rapport d'intervention sans lever d'exception", () => {
    const demo = fieldSuiteStorage.createDemoMission();

    // Mock doc.save pour l'environnement jsdom
    const saveMock = vi.fn();
    vi.spyOn(window, "open").mockImplementation(() => null);

    // On s'assure que l'appel s'exécute de bout en bout
    expect(() => {
      generateFieldSuiteReportPdf(demo);
    }).not.toThrow();
  });
});
