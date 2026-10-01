import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  NAFA_BOTANICAL_CATALOG,
  findNafaBotanicalSpecies,
  getNafaWeedTaxa,
  getNafaCropTaxa,
  OPEN_DATA_REPOSITORIES,
} from "@/lib/nafaBotanicalDatabase";
import {
  identifyPlantWithNafaEngine,
  PLANTNET_TO_NAFA_CROP_MAP,
  PLANTNET_TO_NAFA_WEED_MAP,
} from "@/lib/nafaPlantIdentifier";
import {
  nafaFieldObservationsStorage,
  NafaBotanicalObservation,
} from "@/lib/nafaFieldObservations";

describe("Base de Données Botanique Propriétaire NAFA-AGRITECH & Moteur Autonome", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("1. Catalogue Botanique & Sources Scientifiques Open Data", () => {
    it("contient au moins 42 taxons certifiés pour l'Afrique de l'Ouest et le Sahel", () => {
      expect(NAFA_BOTANICAL_CATALOG.length).toBeGreaterThanOrEqual(42);
    });

    it("référence explicitement les dépôts de données ouvertes scientifiques fiables", () => {
      expect(OPEN_DATA_REPOSITORIES.inera).toBeDefined();
      expect(OPEN_DATA_REPOSITORIES.inera.institution).toContain("INERA");
      expect(OPEN_DATA_REPOSITORIES.fao_ecocrop.institution).toContain("FAO");
      expect(OPEN_DATA_REPOSITORIES.cirad.institution).toContain("CIRAD");
      expect(OPEN_DATA_REPOSITORIES.gbif.institution).toContain("GBIF");
      expect(OPEN_DATA_REPOSITORIES.plantvillage.openBaseline).toBe(true);
    });

    it("associe à chaque taxon une taxonomie complète et des sources légales", () => {
      for (const taxon of NAFA_BOTANICAL_CATALOG) {
        expect(taxon.id).toBeTruthy();
        expect(taxon.scientificName).toBeTruthy();
        expect(taxon.scientificNameWithoutAuthor).toBeTruthy();
        expect(taxon.genus).toBeTruthy();
        expect(taxon.family).toBeTruthy();
        expect(taxon.openDataSource).toBeTruthy();
        expect(taxon.agroEcologicalZones.length).toBeGreaterThanOrEqual(1);
        expect(taxon.distinctiveFeatures.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("inclut les noms vernaculaires en langues locales burkinabè (Mooré, Dioula, Fulfulde)", () => {
      const mais = NAFA_BOTANICAL_CATALOG.find((t) => t.id === "mais");
      expect(mais).toBeDefined();
      expect(mais?.vernacularNames.moore).toContain("Kama");
      expect(mais?.vernacularNames.dioula).toContain("Kaba");

      const striga = NAFA_BOTANICAL_CATALOG.find((t) => t.id === "striga_hermonthica");
      expect(striga).toBeDefined();
      expect(striga?.vernacularNames.moore).toContain("Wilinga");
    });
  });

  describe("2. Classification Stricte : Cultures vs. Adventices Majeures", () => {
    it("distingue rigoureusement les cultures vivrières et de rente des adventices", () => {
      const crops = getNafaCropTaxa();
      const weeds = getNafaWeedTaxa();

      expect(crops.length).toBeGreaterThan(25);
      expect(weeds.length).toBeGreaterThanOrEqual(8);

      const striga = weeds.find((w) => w.id === "striga_hermonthica");
      expect(striga).toBeDefined();
      expect(striga?.isWeed).toBe(true);

      const tomate = crops.find((c) => c.id === "tomate");
      expect(tomate).toBeDefined();
      expect(tomate?.isWeed).toBe(false);
    });

    it("maintient les dictionnaires de correspondance rapides pour rétro-compatibilité", () => {
      expect(PLANTNET_TO_NAFA_CROP_MAP["solanum lycopersicum"]).toBe("tomate");
      expect(PLANTNET_TO_NAFA_CROP_MAP["zea mays"]).toBe("mais");
      expect(PLANTNET_TO_NAFA_WEED_MAP["striga hermonthica"]).toBe("striga_hermonthica");
      expect(PLANTNET_TO_NAFA_WEED_MAP["cyperus rotundus"]).toBe("cyperus_rotundus");
    });
  });

  describe("3. Moteur de Recherche Botanique Multi-Critères", () => {
    it("retrouve une plante par son nom scientifique latin complet ou abrégé", () => {
      const match1 = findNafaBotanicalSpecies("Solanum lycopersicum");
      expect(match1?.id).toBe("tomate");

      const match2 = findNafaBotanicalSpecies("Oryza sativa");
      expect(match2?.id).toBe("riz");
    });

    it("retrouve une plante par son nom vernaculaire en Mooré ou Dioula", () => {
      const matchMoore = findNafaBotanicalSpecies("Wilinga");
      expect(matchMoore?.id).toBe("striga_hermonthica");

      const matchDioula = findNafaBotanicalSpecies("Tiganin");
      expect(matchDioula?.id).toBe("arachide");
    });

    it("retrouve une plante par son identifiant ou nom commun français", () => {
      const matchFr = findNafaBotanicalSpecies("sorgho");
      expect(matchFr?.id).toBe("sorgho");

      const matchGombo = findNafaBotanicalSpecies("Gombo");
      expect(matchGombo?.id).toBe("gombo");
    });
  });

  describe("4. Moteur d'Identification Autonome NAFA Vision (100% Hors-Ligne)", () => {
    it("garantit ZÉRO appel réseau HTTP externe", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const result = await identifyPlantWithNafaEngine({
        hints: "Culture de tomate en maraîchage avec feuilles composées",
      });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.status).toBe("success");
      expect(result.identifiedSpecies?.id).toBe("tomate");
      expect(result.apiSource).toBe("nafa_proprietary_engine");
      expect(result.engineSource).toBe("nafa_proprietary_engine");
      expect(result.confidenceScore).toBeGreaterThanOrEqual(80);

      fetchSpy.mockRestore();
    });

    it("détecte une adventice parasitaire avec un score élevé et génère une alerte agronomique", async () => {
      const result = await identifyPlantWithNafaEngine({
        hints: "Striga wilinga parasite sorgho fleurs roses",
      });

      expect(result.isWeed).toBe(true);
      expect(result.matchedWeedKey).toBe("striga_hermonthica");
      expect(result.identifiedSpecies?.id).toBe("striga_hermonthica");
      expect(result.message).toContain("Alerte adventice");
    });

    it("gère l'analyse foliaire d'organe végétal simulée ou fournie", async () => {
      const result = await identifyPlantWithNafaEngine({
        organ: "leaf",
        hints: "Niebe feuille trifoliée légumineuse",
      });

      expect(result.status).toBe("success");
      expect(result.identifiedSpecies?.id).toBe("niebe");
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe("5. Apprentissage Continu & Observations Terrain Validées (INERA / NAFA)", () => {
    it("initialise les observations étalons terrain vérifiées par les agronomes", () => {
      const initial = nafaFieldObservationsStorage.getAll();
      expect(initial.length).toBeGreaterThanOrEqual(3);

      const koubriObs = initial.find((o) => o.location.commune === "Koubri");
      expect(koubriObs).toBeDefined();
      expect(koubriObs?.speciesId).toBe("tomate");
      expect(koubriObs?.status).toBe("valide_par_expert");
    });

    it("permet à un agronome terrain d'enregistrer une nouvelle observation locale", () => {
      const newObs: Omit<NafaBotanicalObservation, "id" | "createdAt" | "syncStatus"> = {
        speciesId: "mais",
        scientificName: "Zea mays L.",
        commonName: "Maïs",
        organ: "leaf",
        location: {
          region: "Hauts-Bassins",
          province: "Houet",
          commune: "Bama",
          latitude: 11.38,
          longitude: -4.42,
        },
        validator: {
          expertId: "expert-inera-002",
          expertName: "Dr. Traoré",
          institution: "INERA Farako-Bâ",
        },
        status: "valide_par_expert",
        botanicalTraitsObserved: [
          "Limbe linéaire rubané",
          "Nervation parallèle",
          "Inflorescence terminale en panicule",
        ],
        confidenceScore: 98,
      };

      const saved = nafaFieldObservationsStorage.save(newObs);
      expect(saved.id).toBeTruthy();
      expect(saved.syncStatus).toBe("pending_sync");

      const all = nafaFieldObservationsStorage.getAll();
      expect(all.some((o) => o.id === saved.id)).toBe(true);

      const bySpecies = nafaFieldObservationsStorage.getBySpecies("mais");
      expect(bySpecies.length).toBeGreaterThanOrEqual(1);
    });

    it("fournit des statistiques fiables sur la base d'observations", () => {
      const stats = nafaFieldObservationsStorage.getStats();
      expect(stats.totalObservations).toBeGreaterThanOrEqual(3);
      expect(stats.validatedCount).toBeGreaterThanOrEqual(3);
      expect(stats.speciesCovered).toBeGreaterThanOrEqual(3);
    });
  });
});
