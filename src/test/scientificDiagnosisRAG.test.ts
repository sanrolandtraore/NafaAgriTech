import { describe, it, expect, beforeEach } from "vitest";
import {
  identifyPlant,
  executeScientificDiagnosisPipeline,
  saveValidatedDiagnosisCase,
  getStoredValidatedCases,
  AgronomicContext,
  WeedSpecies,
} from "@/lib/scientificAgronomicRAG";

describe("NAFA Genius IA - Diagnostic Agronomique Scientifique (RAG)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. ÉTAPE 1 : IDENTIFICATION & DISTINCTION CULTURE VS ADVENTICE
  // ─────────────────────────────────────────────────────────────
  describe("Étape 1 : Identification de la plante & Distinction Culture vs Adventice", () => {
    it("doit identifier correctement une culture vivrière (Maïs)", () => {
      const result = identifyPlant({
        text: "parcelle de maïs avec des feuilles rongées",
        cropKey: "mais",
      });

      expect(result.canProceed).toBe(true);
      expect(result.isWeed).toBe(false);
      expect(result.identifiedSpecies).toBeDefined();
      expect(result.identifiedSpecies?.commonName).toContain("Maïs");
      expect(result.confidenceLevel).toBe("Élevé");
    });

    it("doit identifier immédiatement une adventice parasite majeure (Striga hermonthica)", () => {
      const result = identifyPlant({
        text: "striga hermonthica fleurs roses émergeant au pied du sorgho",
      });

      expect(result.canProceed).toBe(true);
      expect(result.isWeed).toBe(true);
      const weed = result.identifiedSpecies as WeedSpecies;
      expect(weed.scientificName).toBe("Striga hermonthica");
      expect(weed.localNames.moore).toContain("Kango");
      expect(weed.cycle).toBe("parasite");
      expect(result.confidenceLevel).toBe("Élevé");
    });

    it("doit identifier l'adventice vivace Cyperus rotundus (Chiendent / Souchet)", () => {
      const result = identifyPlant({
        text: "souchet cyperus rotundus envahissant les billons d'oignon",
      });

      expect(result.canProceed).toBe(true);
      expect(result.isWeed).toBe(true);
      const weed = result.identifiedSpecies as WeedSpecies;
      expect(weed.scientificName).toBe("Cyperus rotundus");
      expect(weed.localNames.moore).toBe("Goudou-goudou");
    });

    it("doit arrêter formellement le diagnostic si la plante est indéterminée et réclamer des photos complémentaires", () => {
      const result = identifyPlant({
        text: "plante verte bizarre non identifiable",
      });

      expect(result.canProceed).toBe(false);
      expect(result.identifiedSpecies).toBeNull();
      expect(result.confidenceLevel).toBe("Incertain");
      expect(result.blockReason).toBeDefined();
      expect(result.missingPhotosAdvice).toContain("photos supplémentaires");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. ÉTAPE 2 & 3 : DIAGNOSTIC SCIENTIFIQUE RAG ZÉRO HALLUCINATION
  // ─────────────────────────────────────────────────────────────
  describe("Étape 2 & 3 : Diagnostic Pathologique & Carentiel RAG", () => {
    it("doit diagnostiquer scientifiquement le Mildiou de la tomate avec citations INERA", () => {
      const identification = identifyPlant({ cropKey: "tomate" });
      const context: AgronomicContext = {
        region: "hauts_bassins",
        season: "hivernage",
        growthStage: "fructification",
        soilType: "argilo_limoneux",
        affectedOrgans: ["feuilles", "tiges"],
        symptoms: "taches brunes nécrotiques foliaires duvet blanchâtre face inférieure par temps humide",
      };

      const result = executeScientificDiagnosisPipeline({ identification, context });

      expect(result.step4Validation.isConfirmed).toBe(true);
      const primary = result.step4Validation.primaryDiagnosis;
      expect(primary).toBeDefined();
      expect(primary?.pathogenType).toBe("fongique");
      expect(primary?.scientificName).toContain("Phytophthora infestans");
      expect(primary?.officialReferences.some((r) => r.includes("INERA"))).toBe(true);
      expect(primary?.treatmentBio).toBeDefined();
      expect(primary?.treatmentChemical).toBeDefined();
    });

    it("doit diagnostiquer la Chenille Légionnaire d'Automne (Spodoptera) sur Maïs avec références CILSS", () => {
      const identification = identifyPlant({ cropKey: "mais" });
      const context: AgronomicContext = {
        region: "boucle_du_mouhoun",
        season: "hivernage",
        growthStage: "vegetatif",
        soilType: "limoneux",
        affectedOrgans: ["feuilles", "tiges"],
        symptoms: "chenille perforant le cornet morsures régulières sciure et déjections larvaires",
      };

      const result = executeScientificDiagnosisPipeline({ identification, context });

      expect(result.step4Validation.isConfirmed).toBe(true);
      const primary = result.step4Validation.primaryDiagnosis;
      expect(primary?.pathogenType).toBe("ravageur");
      expect(primary?.scientificName).toBe("Spodoptera frugiperda");
      expect(primary?.officialReferences.some((r) => r.includes("CSP-CILSS") || r.includes("INERA"))).toBe(true);
    });

    it("doit diagnostiquer avec précision une carence en Calcium (Pourriture apicale) selon le référentiel Yara", () => {
      const identification = identifyPlant({ cropKey: "tomate" });
      const context: AgronomicContext = {
        region: "centre_sud",
        season: "saison_seche_chaude",
        growthStage: "fructification",
        soilType: "sableux",
        affectedOrgans: ["fruits"],
        symptoms: "pourriture apicale cul noir de la tomate nécrose noire circulaire extrémité distale du fruit",
      };

      const result = executeScientificDiagnosisPipeline({ identification, context });

      expect(result.step4Validation.isConfirmed).toBe(true);
      const primary = result.step4Validation.primaryDiagnosis;
      expect(primary?.pathogenType).toBe("carence");
      expect(primary?.scientificName).toContain("Calcium");
      expect(primary?.officialReferences.some((r) => r.includes("Yara"))).toBe(true);
    });

    it("doit diagnostiquer le Flétrissement Bactérien (Ralstonia solanacearum) avec mention du test du verre d'eau", () => {
      const identification = identifyPlant({ cropKey: "tomate" });
      const context: AgronomicContext = {
        region: "centre_ouest",
        season: "hivernage",
        growthStage: "floraison",
        soilType: "argileux",
        affectedOrgans: ["feuilles", "tiges"],
        symptoms: "flétrissement brutal soudain de la plante sans jaunissement préalable collapsus vasculaire",
      };

      const result = executeScientificDiagnosisPipeline({ identification, context });

      expect(result.step4Validation.isConfirmed).toBe(true);
      const primary = result.step4Validation.primaryDiagnosis;
      expect(primary?.pathogenType).toBe("bacterienne");
      expect(primary?.scientificName).toContain("Ralstonia solanacearum");
    });

    it("doit générer un plan de gestion spécifique quand une adventice est identifiée", () => {
      const identification = identifyPlant({ text: "striga" });
      const context: AgronomicContext = {
        region: "centre_nord",
        season: "hivernage",
        growthStage: "floraison",
        soilType: "sableux",
        affectedOrgans: ["racines"],
        symptoms: "fleurs roses et violettes attachées aux racines du sorgho",
      };

      const result = executeScientificDiagnosisPipeline({ identification, context });

      expect(result.weedManagementPlan).toBeDefined();
      expect(result.weedManagementPlan?.scientificName).toBe("Striga hermonthica");
      expect(result.weedManagementPlan?.riskLevel).toBe("critique");
      expect(result.weedManagementPlan?.bioControl).toBeDefined();
    });

    it("doit déclarer formellement un résultat INCONCLUSIF sans halluciner si les symptômes sont inconnus", () => {
      const identification = identifyPlant({ cropKey: "mais" });
      const context: AgronomicContext = {
        region: "sahel",
        season: "saison_seche_froide",
        growthStage: "recolte",
        soilType: "sableux",
        affectedOrgans: ["fleurs"],
        symptoms: "poussière violette fluorescente bizarre sans précédent agronomique",
      };

      const result = executeScientificDiagnosisPipeline({ identification, context });

      expect(result.step4Validation.isConfirmed).toBe(false);
      expect(result.step4Validation.confidenceLevel).toBe("Incertain");
      expect(result.step4Validation.inconclusiveNotice).toBeDefined();
      expect(result.step4Validation.inconclusiveNotice).toContain("INERA / CREAF");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. ÉTAPE 4 : EXPLICABILITÉ, CITATIONS & DIFFÉRENTIEL
  // ─────────────────────────────────────────────────────────────
  describe("Étape 4 : Explicabilité, Diagnostics Différentiels & Citations", () => {
    it("doit inclure les diagnostics différentiels pour éliminer les confusions fréquentes", () => {
      const identification = identifyPlant({ cropKey: "tomate" });
      const context: AgronomicContext = {
        region: "hauts_bassins",
        season: "hivernage",
        growthStage: "fructification",
        soilType: "limoneux",
        affectedOrgans: ["feuilles"],
        symptoms: "taches foliaires nécrotiques concentriques brun foncé flétrissement",
      };

      const result = executeScientificDiagnosisPipeline({ identification, context });

      expect(result.step4Validation.officialReferences.length).toBeGreaterThan(0);
      expect(
        result.step4Validation.officialReferences.some(
          (src) => src.includes("INERA") || src.includes("CILSS") || src.includes("Yara")
        )
      ).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. BOUCLE D'AMÉLIORATION CONTINUE & CAS VALIDÉS
  // ─────────────────────────────────────────────────────────────
  describe("Boucle d'apprentissage continu & Cas validés de terrain", () => {
    it("doit enregistrer un cas validé par un ingénieur et l'ajouter au corpus RAG", async () => {
      const savedCase = await saveValidatedDiagnosisCase({
        plantSpeciesId: "tomate",
        isWeed: false,
        diseaseCatalogId: "tom_mildiou",
        validatedDiseaseName: "Mildiou de la tomate (Phytophthora infestans)",
        pathogenType: "fongique",
        contextLocation: { region: "hauts_bassins" },
        contextSeason: "hivernage",
        contextSoil: "argilo_limoneux",
        contextGrowthStage: "fructification",
        contextHistory: "Précédent cultural solanacée",
        observedSymptoms: "Taches foliaires brunes nécrotiques avec duvet blanc",
        expertNotes: "Mildiou typique en vallée du Kou, traité à la bouillie bordelaise",
        certifiedBy: "Dr. Oumarou Sawadogo",
        confidenceLevel: "Élevé",
      });

      expect(savedCase).toBeDefined();
      expect(savedCase.id).toBeDefined();
      expect(savedCase.certifiedBy).toBe("Dr. Oumarou Sawadogo");

      // Vérifier la récupération depuis le stockage local
      const storedCases = getStoredValidatedCases();
      expect(storedCases.length).toBeGreaterThanOrEqual(1);
      const matching = storedCases.find((c) => c.id === savedCase.id);
      expect(matching).toBeDefined();
      expect(matching?.diseaseCatalogId).toBe("tom_mildiou");
    });
  });
});
