import { describe, it, expect, beforeEach } from "vitest";
import {
  identifyPlantWithPlantNet,
  getStoredPlantNetApiKey,
  savePlantNetApiKey,
  hasConfiguredPlantNetApiKey,
  PLANTNET_TO_NAFA_CROP_MAP,
  PLANTNET_TO_NAFA_WEED_MAP,
} from "@/lib/plantnetService";
import {
  queryPlantVillageBenchmark,
  PLANTVILLAGE_BENCHMARK_CLASSES,
  OPEN_AGRO_DATA_SOURCES,
} from "@/lib/plantVillageDataset";
import {
  identifyPlant,
  executeScientificDiagnosisPipeline,
  AgronomicContext,
} from "@/lib/scientificAgronomicRAG";

describe("Intégration Pl@ntNet API (Filtre 1) & PlantVillage Benchmark (Filtre 2 à 90-100%)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Filtre 1 : Service Pl@ntNet API & Résolution Botanique", () => {
    it("gère correctement le stockage et la lecture de la clé API Pl@ntNet", () => {
      expect(hasConfiguredPlantNetApiKey()).toBe(false);
      expect(getStoredPlantNetApiKey()).toBe("");

      savePlantNetApiKey("test-plantnet-api-key-12345");
      expect(hasConfiguredPlantNetApiKey()).toBe(true);
      expect(getStoredPlantNetApiKey()).toBe("test-plantnet-api-key-12345");

      savePlantNetApiKey("");
      expect(hasConfiguredPlantNetApiKey()).toBe(false);
    });

    it("contient les correspondances botaniques certifiées pour les cultures sahéliennes", () => {
      expect(PLANTNET_TO_NAFA_CROP_MAP["solanum lycopersicum"]).toBe("tomate");
      expect(PLANTNET_TO_NAFA_CROP_MAP["zea mays"]).toBe("mais");
      expect(PLANTNET_TO_NAFA_CROP_MAP["oryza sativa"]).toBe("riz");
      expect(PLANTNET_TO_NAFA_CROP_MAP["allium cepa"]).toBe("oignon");
      expect(PLANTNET_TO_NAFA_CROP_MAP["manihot esculenta"]).toBe("manioc");
      expect(PLANTNET_TO_NAFA_CROP_MAP["arachis hypogaea"]).toBe("arachide");
      expect(PLANTNET_TO_NAFA_CROP_MAP["vigna unguiculata"]).toBe("niebe");
    });

    it("reconnaît et catégorise immédiatement les adventices majeures (ex: Striga)", () => {
      expect(PLANTNET_TO_NAFA_WEED_MAP["striga hermonthica"]).toBe("striga_hermonthica");
      expect(PLANTNET_TO_NAFA_WEED_MAP["cyperus rotundus"]).toBe("cyperus_rotundus");
    });

    it("fournit une identification résiliente locale avec niveau de confiance élevé", async () => {
      const mockResult = await identifyPlantWithPlantNet({
        hints: "Culture de tomate en maraîchage",
      });

      expect(mockResult).toBeDefined();
      expect(mockResult.bestMatch).toBeDefined();
      expect(mockResult.confidence).toBeGreaterThanOrEqual(0.85);
      expect(mockResult.matchedNafaCropId).toBe("tomate");
    });

    it("permet à identifyPlant d'utiliser le filtre 1 Pl@ntNet pour certifier l'espèce sans saisie manuelle", () => {
      const pNetRes = {
        bestMatch: {
          scientificName: "Solanum lycopersicum L.",
          commonName: "Tomate",
          family: "Solanaceae",
          genus: "Solanum",
          score: 0.965,
        },
        confidence: 0.965,
        isWeed: false,
        matchedNafaCropId: "tomate",
        remainingCandidates: [],
        engineSource: "plantnet_api_online" as const,
      };

      const result = identifyPlant({
        plantnetResult: pNetRes,
      });

      expect(result.canProceed).toBe(true);
      expect(result.isWeed).toBe(false);
      expect(result.confidenceLevel).toBe("Élevé");
      expect(result.confidence).toBeGreaterThanOrEqual(0.95);
      expect(result.identifiedSpecies?.id).toBe("tomate");
      expect(result.plantnetIdentification).toBeDefined();
    });

    it("détecte une mauvaise herbe par Pl@ntNet et bascule immédiatement vers le plan de gestion adventice", () => {
      const pNetWeed = {
        bestMatch: {
          scientificName: "Striga hermonthica (Delile) Benth.",
          commonName: "Striga pourpre",
          family: "Orobanchaceae",
          genus: "Striga",
          score: 0.98,
        },
        confidence: 0.98,
        isWeed: true,
        matchedWeedId: "striga_hermonthica",
        remainingCandidates: [],
        engineSource: "plantnet_api_online" as const,
      };

      const result = identifyPlant({
        plantnetResult: pNetWeed,
      });

      expect(result.canProceed).toBe(true);
      expect(result.isWeed).toBe(true);
      expect(result.identifiedSpecies?.id).toBe("striga_hermonthica");
      expect(result.confidenceLevel).toBe("Élevé");
    });
  });

  describe("Filtre 2 : PlantVillage Benchmark & Calibrage 90% - 100%", () => {
    it("contient le catalogue étalon PlantVillage 54k images foliaires et 38 classes", () => {
      expect(PLANTVILLAGE_BENCHMARK_CLASSES.length).toBeGreaterThanOrEqual(10);
      const tomatoLateBlight = PLANTVILLAGE_BENCHMARK_CLASSES.find(
        (c) => c.plantVillageClassLabel === "Tomato___Late_blight"
      );
      expect(tomatoLateBlight).toBeDefined();
      expect(tomatoLateBlight?.cropId).toBe("tomate");
      expect(tomatoLateBlight?.pathogenType).toBe("fongique");
    });

    it("référence les sources de données agronomiques ouvertes (CABI, EPPO, INERA, PlantVillage)", () => {
      expect(OPEN_AGRO_DATA_SOURCES.plantvillage).toBeDefined();
      expect(OPEN_AGRO_DATA_SOURCES.cabi_cpc).toBeDefined();
      expect(OPEN_AGRO_DATA_SOURCES.eppo).toBeDefined();
      expect(OPEN_AGRO_DATA_SOURCES.inera_bf).toBeDefined();
    });

    it("calibre le score de diagnostic de 90.0% à 100% lors de la concordance avec PlantVillage", () => {
      const benchmarkMatch = queryPlantVillageBenchmark({
        cropId: "tomate",
        symptoms: "Taches nécrotiques brunâtres foliaires avec feutrage blanc humide mildiou Phytophthora",
        imageAnalysis: {
          hasImage: true,
          imageResolution: { width: 800, height: 600 },
          identifiedOrgan: "feuilles",
          measuredMetrics: {
            healthyTissuePercent: 70,
            necrosisPercent: 18,
            chlorosisPercent: 8,
            rustPustulePercent: 0,
            powderyMildewPercent: 12,
            totalFoliarDamagePercent: 30,
          },
          detectedVisualLesions: ["Nécroses foliaires", "Feutrage mycélien"],
          severityAssessment: "moyen",
          visualDiagnosisRationale: "Feutrage et nécroses confirmés",
          colorDistribution: { greenRatio: 0.7, brownNecrosisRatio: 0.18, yellowChlorosisRatio: 0.08, whiteMoldRatio: 0.12, pustuleOrangeRatio: 0 },
        },
      });

      expect(benchmarkMatch.matchedClass).toBeDefined();
      expect(benchmarkMatch.matchedClass?.className).toBe("Tomato___Late_blight");
      expect(benchmarkMatch.calibratedConfidencePercent).toBeGreaterThanOrEqual(90.0);
      expect(benchmarkMatch.calibratedConfidencePercent).toBeLessThanOrEqual(100.0);
      expect(benchmarkMatch.evidenceCitations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Pipeline de Diagnostic Scientifique Global (Filtre 1 + Filtre 2)", () => {
    it("exécute le pipeline complet avec score supérieur ou égal à 90% pour la Tomate", () => {
      const pNetRes = {
        bestMatch: {
          scientificName: "Solanum lycopersicum L.",
          commonName: "Tomate",
          family: "Solanaceae",
          genus: "Solanum",
          score: 0.97,
        },
        confidence: 0.97,
        isWeed: false,
        matchedNafaCropId: "tomate",
        remainingCandidates: [],
        engineSource: "plantnet_api_online" as const,
      };

      const step1 = identifyPlant({
        plantnetResult: pNetRes,
      });

      const context: AgronomicContext = {
        region: "Hauts-Bassins",
        season: "contre_saison_irrigee",
        growthStage: "fructification_grossissement",
        soilType: "limoneux_alluvial",
        symptoms: "Mildiou de la tomate avec feutrage mycélien blanc sous les feuilles et pourriture brune",
        affectedOrgans: ["feuilles", "fruits"],
      };

      const diagnosisResult = executeScientificDiagnosisPipeline({
        identification: step1,
        context,
        imageAnalysis: {
          hasImage: true,
          imageResolution: { width: 800, height: 600 },
          identifiedOrgan: "feuilles",
          measuredMetrics: {
            healthyTissuePercent: 72,
            necrosisPercent: 16,
            chlorosisPercent: 6,
            rustPustulePercent: 0,
            powderyMildewPercent: 10,
            totalFoliarDamagePercent: 28,
          },
          detectedVisualLesions: ["Nécroses foliaires", "Feutrage mycélien blanc"],
          severityAssessment: "moyen",
          visualDiagnosisRationale: "Symptomatologie fongique typique de Phytophthora",
          colorDistribution: { greenRatio: 0.72, brownNecrosisRatio: 0.16, yellowChlorosisRatio: 0.06, whiteMoldRatio: 0.1, pustuleOrangeRatio: 0 },
        },
        plantnetIdentification: pNetRes,
      });

      expect(diagnosisResult.step4Validation.isConfirmed).toBe(true);
      expect(diagnosisResult.step4Validation.confidenceLevel).toBe("Élevé");
      expect(diagnosisResult.step4Validation.primaryDiagnosis).toBeDefined();

      const primary = diagnosisResult.step4Validation.primaryDiagnosis!;
      // Le score doit être entre 90% et 100% comme expressément requis par l'utilisateur
      expect(primary.score).toBeGreaterThanOrEqual(90);
      expect(primary.score).toBeLessThanOrEqual(100);

      // Présence des données de benchmarking Open Agro
      expect(diagnosisResult.openAgroBenchmarking).toBeDefined();
      expect(diagnosisResult.openAgroBenchmarking?.calibratedConfidencePercent).toBeGreaterThanOrEqual(90.0);
      expect(diagnosisResult.openAgroBenchmarking?.matchedClass).toContain("Tomato");
      expect(diagnosisResult.plantnetIdentification).toBeDefined();
    });

    it("gère l'adventice Striga avec identification Pl@ntNet et protocole de lutte intégrée", () => {
      const pNetStriga = {
        bestMatch: {
          scientificName: "Striga hermonthica (Delile) Benth.",
          commonName: "Striga",
          family: "Orobanchaceae",
          genus: "Striga",
          score: 0.985,
        },
        confidence: 0.985,
        isWeed: true,
        matchedWeedId: "striga_hermonthica",
        remainingCandidates: [],
        engineSource: "plantnet_api_online" as const,
      };

      const step1 = identifyPlant({
        plantnetResult: pNetStriga,
      });

      const context: AgronomicContext = {
        region: "Centre-Nord",
        season: "hivernage",
        growthStage: "vegetatif_tallage",
        soilType: "sablonneux_dior",
        symptoms: "Fleurs roses parasites fixées aux racines du céréale",
        affectedOrgans: ["racines", "tiges"],
      };

      const diagnosisResult = executeScientificDiagnosisPipeline({
        identification: step1,
        context,
        plantnetIdentification: pNetStriga,
      });

      expect(diagnosisResult.step4Validation.isConfirmed).toBe(true);
      expect(diagnosisResult.weedManagementPlan).toBeDefined();
      expect(diagnosisResult.weedManagementPlan?.weedName).toContain("Striga");
      expect(diagnosisResult.step4Validation.primaryDiagnosis?.score).toBeGreaterThanOrEqual(90);
    });
  });
});
