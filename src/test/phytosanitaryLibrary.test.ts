import { describe, it, expect, beforeEach } from "vitest";
import {
  PHYTO_CROPS,
  PHYTO_CASES_CATALOG,
  KNOWLEDGE_SOURCES,
  phytosanitaryStorage,
  searchPhytosanitaryLibrary,
  PlantHealthCase,
} from "@/lib/phytosanitaryLibrary";
import {
  executeDifferentialDiagnosis,
  DiagnosisInput,
} from "@/lib/phytosanitaryDiagnosticEngine";

describe("Bibliothèque Phytosanitaire Intelligente Propriétaire NAFA-AGRITECH", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("1. Référentiel des Cultures & Connaissances Réelles (TOM2024 / INERA)", () => {
    it("définit les cultures vivrières et maraîchères majeures du Burkina Faso avec noms vernaculaires", () => {
      expect(PHYTO_CROPS.length).toBeGreaterThanOrEqual(5);

      const tomate = PHYTO_CROPS.find((c) => c.id === "tomate");
      expect(tomate).toBeDefined();
      expect(tomate?.scientificName).toBe("Solanum lycopersicum");
      expect(tomate?.localNames.moore).toBe("Koom-kamba");

      const mais = PHYTO_CROPS.find((c) => c.id === "mais");
      expect(mais).toBeDefined();
      expect(mais?.localNames.moore).toBe("Kama");

      const oignon = PHYTO_CROPS.find((c) => c.id === "oignon");
      expect(oignon).toBeDefined();
      expect(oignon?.localNames.moore).toBe("Djabla");
    });

    it("vérifie que chaque source scientifique possède une licence explicite et une date de vérification", () => {
      Object.values(KNOWLEDGE_SOURCES).forEach((src) => {
        expect(src.institution).toBeDefined();
        expect(src.licenseType).toMatch(/CC-BY-4.0|Public_Domain|INERA_Accord|Open_Access/);
        expect(src.verifiedAt).toBeDefined();
        expect(src.redistributionTerms.length).toBeGreaterThan(10);
      });
    });

    it("contient les bio-agresseurs prioritaires documentés du dataset TOM2024", () => {
      const cases = phytosanitaryStorage.getAllCases();

      // Tuta absoluta sur tomate
      const tuta = cases.find((c) => c.id === "case_tom_tuta_absoluta");
      expect(tuta).toBeDefined();
      expect(tuta?.riskLevel).toBe("critique");
      expect(tuta?.sourceId).toBe("TOM2024_BF");

      // Ralstonia sur tomate
      const ralstonia = cases.find((c) => c.id === "case_tom_ralstonia");
      expect(ralstonia).toBeDefined();
      expect(ralstonia?.category).toBe("bacterienne");

      // Spodoptera frugiperda sur maïs
      const spodoptera = cases.find((c) => c.id === "case_mais_spodoptera");
      expect(spodoptera).toBeDefined();
      expect(spodoptera?.cropId).toBe("mais");

      // Thrips tabaci sur oignon
      const thrips = cases.find((c) => c.id === "case_oignon_thrips");
      expect(thrips).toBeDefined();
      expect(thrips?.cropId).toBe("oignon");
    });

    it("impose des homologations CSP-CILSS et Délais Avant Récolte (DAR) stricts sans invention de doses", () => {
      const cases = phytosanitaryStorage.getAllCases();
      cases.forEach((c) => {
        c.protocols.forEach((proto) => {
          if (proto.protocolType === "chimique_csp") {
            expect(proto.cspRegistrationNumber).toBeDefined();
            expect(proto.preHarvestIntervalDays).toBeGreaterThanOrEqual(1);
            expect(proto.dosage).toBeDefined();
          }
          if (proto.protocolType === "biologique") {
            expect(proto.isCertifiedInera).toBe(true);
            expect(proto.instructions.length).toBeGreaterThan(20);
          }
        });
      });
    });
  });

  describe("2. Recherche Multi-critères & Fonctionnalités Hors-Ligne", () => {
    it("recherche efficacement par nom de bio-agresseur", () => {
      const results = searchPhytosanitaryLibrary({ query: "Tuta" });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].diseaseNameFr).toContain("Mineuse de la tomate");
    });

    it("recherche par nom local en Mooré", () => {
      const results = searchPhytosanitaryLibrary({ query: "yaare-biiga" });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].id).toBe("case_tom_tuta_absoluta");
    });

    it("filtre par culture et par catégorie", () => {
      const tomateRavageurs = searchPhytosanitaryLibrary({
        cropId: "tomate",
        category: "ravageur",
      });
      expect(tomateRavageurs.every((c) => c.cropId === "tomate" && c.category === "ravageur")).toBe(true);

      const oignonCases = searchPhytosanitaryLibrary({ cropId: "oignon" });
      expect(oignonCases.length).toBeGreaterThanOrEqual(2);
    });

    it("gère la mise en cache et le basculement hors-ligne", () => {
      const isDownloaded = phytosanitaryStorage.toggleOfflineDownload("case_tom_tuta_absoluta");
      expect(isDownloaded).toBe(true);
      expect(phytosanitaryStorage.isCaseAvailableOffline("case_tom_tuta_absoluta")).toBe(true);

      const offlineCases = searchPhytosanitaryLibrary({ offlineOnly: true });
      expect(offlineCases.some((c) => c.id === "case_tom_tuta_absoluta")).toBe(true);
    });
  });

  describe("3. Moteur de Diagnostic Différentiel Multi-Hypothèses", () => {
    it("distingue Tuta absoluta avec galeries et excréments noirs sur tomate", () => {
      const input: DiagnosisInput = {
        cropId: "tomate",
        affectedOrgan: "feuilles",
        symptomsDescription: "mines et galeries translucides sur les feuilles avec petites crottes noires déjections",
        season: "saison_seche_chaude",
      };

      const result = executeDifferentialDiagnosis(input);

      expect(result.primaryHypothesis).toBeDefined();
      expect(result.primaryHypothesis?.caseId).toBe("case_tom_tuta_absoluta");
      expect(result.primaryHypothesis?.likelihoodRank).toMatch(/très_plausible|plausible/);
      expect(result.primaryHypothesis?.chemicalCspProtocol?.cspRegistrationNumber).toBeDefined();
      expect(result.agronomicDisclaimer).toContain("CSP-CILSS");
    });

    it("distingue le Flétrissement bactérien (Ralstonia) sans jaunissement préalable", () => {
      const input: DiagnosisInput = {
        cropId: "tomate",
        affectedOrgan: "feuilles",
        symptomsDescription: "flétrissement brutal de tout le pied alors que les feuilles sont encore totalement vertes",
        season: "hivernage",
      };

      const result = executeDifferentialDiagnosis(input);

      expect(result.primaryHypothesis).toBeDefined();
      expect(result.primaryHypothesis?.caseId).toBe("case_tom_ralstonia");
      expect(result.primaryHypothesis?.recommendedConfirmationTest).toContain("verre d'eau");
    });

    it("propose des questions de confirmation de terrain pour trancher les ambiguïtés", () => {
      const input: DiagnosisInput = {
        cropId: "tomate",
        affectedOrgan: "feuilles",
        symptomsDescription: "flétrissement et galeries suspectes",
      };

      const result = executeDifferentialDiagnosis(input);
      expect(result.clarificationQuestions.length).toBeGreaterThan(0);
      expect(result.requiresFieldConfirmation).toBe(true);
    });

    it("identifie la Chenille légionnaire d'automne sur maïs grâce à la sciure dans le cornet", () => {
      const input: DiagnosisInput = {
        cropId: "mais",
        affectedOrgan: "feuilles",
        symptomsDescription: "sciure abondante au fond du cornet et trous en dentelle",
        season: "hivernage",
      };

      const result = executeDifferentialDiagnosis(input);
      expect(result.primaryHypothesis).toBeDefined();
      expect(result.primaryHypothesis?.caseId).toBe("case_mais_spodoptera");
      expect(result.primaryHypothesis?.biologicalProtocol?.title).toContain("cendre");
    });
  });

  describe("4. Processus de Validation Expert", () => {
    it("permet à un agronome d'ajouter une validation officielle traçable", () => {
      phytosanitaryStorage.addExpertValidation({
        id: "val_test_99",
        caseId: "case_oignon_thrips",
        expertName: "Dr. Kaboré",
        institution: "INERA",
        decision: "approved",
        reviewNotes: "Re-confirmé au champ en saison fraîche 2024.",
        validatedAt: new Date().toISOString(),
      });

      const updatedCase = phytosanitaryStorage.getCaseById("case_oignon_thrips");
      expect(updatedCase?.validations.length).toBeGreaterThanOrEqual(2);
      expect(updatedCase?.validations[0].reviewNotes).toContain("Re-confirmé au champ");
    });
  });
});
