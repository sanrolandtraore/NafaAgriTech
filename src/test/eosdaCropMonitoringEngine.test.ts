/**
 * TESTS UNITAIRES — MOTEUR DE TÉLÉDÉTECTION SATELLITAIRE & MONITORING EOSDA
 * Vérification des algorithmes de calcul d'indices spectraux et de modulation VRA
 */

import { describe, it, expect } from "vitest";
import {
  calculateNdvi,
  calculateNdwi,
  calculateMsavi,
  analyzeFieldSatelliteData,
} from "@/lib/eosdaCropMonitoringEngine";

describe("EOSDA Satellite Crop Monitoring Engine", () => {
  describe("Indices Multispectraux (Formules physiques)", () => {
    it("calcule correctement le NDVI normalisé", () => {
      // Cas standard végétation saine : NIR élevé (0.8), RED faible (0.2)
      const ndvi = calculateNdvi(0.8, 0.2);
      expect(ndvi).toBeCloseTo(0.6, 2);

      // Cas sol nu / eau : NIR faible (0.1), RED moyen (0.3)
      const ndviLow = calculateNdvi(0.1, 0.3);
      expect(ndviLow).toBeCloseTo(-0.5, 2);

      // Division par zéro protégée
      expect(calculateNdvi(0, 0)).toBe(0);
    });

    it("calcule correctement le NDWI pour le stress hydrique foliaire", () => {
      // Réflectance NIR (0.6) et SWIR (0.2)
      const ndwi = calculateNdwi(0.6, 0.2);
      expect(ndwi).toBeCloseTo(0.5, 2);

      // Sécheresse extrême
      const ndwiDry = calculateNdwi(0.2, 0.5);
      expect(ndwiDry).toBeLessThan(0);

      // Division par zéro protégée
      expect(calculateNdwi(0, 0)).toBe(0);
    });

    it("calcule correctement le MSAVI adapté aux sols sahéliens dénudés", () => {
      const msavi = calculateMsavi(0.7, 0.3);
      expect(msavi).toBeGreaterThan(0);
      expect(msavi).toBeLessThanOrEqual(1);

      // Cas limite zéro
      expect(calculateMsavi(0, 0)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Analyse Complète Parcelle (EOSDA Time-Series & VRA Zoning)", () => {
    const mockPoints = [
      { lat: 12.35, lng: -1.52 },
      { lat: 12.36, lng: -1.52 },
      { lat: 12.36, lng: -1.51 },
      { lat: 12.35, lng: -1.51 },
    ];

    it("génère une série temporelle Sentinel-2 sur 5 passages récents", () => {
      const analysis = analyzeFieldSatelliteData("field-101", "Parcelle Tomate Nord", 2.5, mockPoints, "tomate");

      expect(analysis.fieldId).toBe("field-101");
      expect(analysis.areaHa).toBe(2.5);
      expect(analysis.timeSeries.length).toBe(5);

      // Vérification des passages Sentinel-2
      analysis.timeSeries.forEach((pass) => {
        expect(["Sentinel-2A", "Sentinel-2B"]).toContain(pass.satellite);
        expect(pass.ndvi).toBeGreaterThan(0);
        expect(pass.ndvi).toBeLessThanOrEqual(1);
        expect(pass.cloudCoverPct).toBeGreaterThanOrEqual(0);
        expect(pass.cloudCoverPct).toBeLessThanOrEqual(100);
      });
    });

    it("découpe la parcelle en 3 zones VRA avec économie d'engrais calculée", () => {
      const analysis = analyzeFieldSatelliteData("field-102", "Parcelle Oignon Est", 4.0, mockPoints, "oignon");

      expect(analysis.vraZoning.zones.length).toBe(3);
      const [lowZone, midZone, highZone] = analysis.vraZoning.zones;

      expect(lowZone.productivityLevel).toBe("faible");
      expect(midZone.productivityLevel).toBe("moyenne");
      expect(highZone.productivityLevel).toBe("elevee");

      // La somme des pourcentages de surface doit être égale à 100%
      const totalPct = lowZone.areaPct + midZone.areaPct + highZone.areaPct;
      expect(totalPct).toBe(100);

      // Vérification des sacs INERA recommandés
      expect(analysis.vraZoning.totalNpkBags).toBeGreaterThan(0);
      expect(analysis.vraZoning.totalUreaBags).toBeGreaterThan(0);
      expect(analysis.vraZoning.inputSavingsPct).toBeGreaterThanOrEqual(10);
    });

    it("fournit une recommandation de scouting terrain cohérente", () => {
      const analysis = analyzeFieldSatelliteData("field-103", "Parcelle Maïs Sud", 1.8, mockPoints, "mais");

      expect(analysis.scoutingRecommendation).toBeDefined();
      expect(["normale", "urgente", "critique"]).toContain(analysis.scoutingRecommendation.priority);
      expect(analysis.scoutingRecommendation.diagnosisHypothesis.length).toBeGreaterThan(10);
    });
  });
});
