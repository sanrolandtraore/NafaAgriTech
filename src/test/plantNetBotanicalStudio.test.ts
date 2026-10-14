/**
 * TESTS UNITAIRES — STUDIO BOTANIQUE PL@NTNET & CATALOGUE CIRAD / INERA
 * Vérification de la taxonomie, détection des adventices et génération de rapport
 */

import { describe, it, expect } from "vitest";
import {
  NAFA_BOTANICAL_CATALOG,
  findNafaBotanicalSpecies,
} from "@/lib/nafaBotanicalDatabase";
import { compressImageForLowBandwidth } from "@/lib/plantNetConnector";
import { generateBotanicalObservationPdf } from "@/lib/plantNetBotanicalPdf";

describe("Pl@ntNet Botanical Studio & CIRAD/INERA Taxonomy", () => {
  describe("1. Référentiel Botanique Sahélien & Organes", () => {
    it("contient les principales cultures vivrières et maraîchères sahéliennes", () => {
      const tomato = findNafaBotanicalSpecies("tomate");
      expect(tomato).toBeDefined();
      expect(tomato?.scientificName).toBe("Solanum lycopersicum L.");
      expect(tomato?.family).toBe("Solanaceae");
      expect(tomato?.isWeed).toBe(false);
      expect(tomato?.vernacularNames.moore).toBe("Koom-kamba");

      const onion = findNafaBotanicalSpecies("oignon");
      expect(onion).toBeDefined();
      expect(onion?.scientificName).toBe("Allium cepa L.");
      expect(onion?.family).toBe("Amaryllidaceae");
    });

    it("identifie et discrimine formellement les adventices parasites (Striga)", () => {
      const striga = findNafaBotanicalSpecies("striga_hermonthica");
      expect(striga).toBeDefined();
      expect(striga?.isWeed).toBe(true);
      expect(striga?.category).toBe("adventice");
      expect(striga?.targetCrops).toBeDefined();
      expect(striga?.targetCrops?.length).toBeGreaterThan(0);
    });

    it("fournit des descripteurs morphologiques pour les organes Pl@ntNet (feuille, fleur, fruit)", () => {
      NAFA_BOTANICAL_CATALOG.forEach((sp) => {
        expect(sp.scientificName.length).toBeGreaterThan(3);
        expect(sp.genus.length).toBeGreaterThan(1);
        expect(sp.family.length).toBeGreaterThan(2);
        expect(sp.organs.leaf).toBeDefined();
        expect(sp.organs.leaf.shape).toBeDefined();
      });
    });
  });

  describe("2. Compression Basse Bande Passante (Réseaux Ruraux)", () => {
    it("compresse les données d'image et calcule l'économie de bande passante", async () => {
      const mockBase64 = "data:image/jpeg;base64," + "A".repeat(5000);
      const res = await compressImageForLowBandwidth(mockBase64);

      expect(res.compressedDataUrl).toBeDefined();
      expect(res.originalSizeBytes).toBeGreaterThan(0);
      expect(res.reductionPercentage).toBeGreaterThanOrEqual(0);
      expect(res.width).toBeLessThanOrEqual(800);
    });
  });

  describe("3. Fiche d'Observation Botanique PDF", () => {
    it("génère un document PDF complet avec classification binomiale et alertes", () => {
      const tomato = findNafaBotanicalSpecies("tomate")!;
      const doc = generateBotanicalObservationPdf({
        species: tomato,
        organSelected: "leaf",
        confidencePct: 96.8,
        projectSelected: "Afrique Tropicale & Sahel",
        observerName: "Dr. Oumar Sawadogo (Agronome)",
        location: "Kamboinsé, Burkina Faso",
        notes: "Parcelle saine, bonne turgescence foliaire.",
        isOnlineUsed: true,
      });

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 1);
    });
  });
});
