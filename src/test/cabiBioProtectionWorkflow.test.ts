import { describe, it, expect } from "vitest";
import {
  CABI_CSP_BURKINA_REGISTRY,
  findRegisteredTreatmentsForPest,
} from "@/lib/cabiBioProtectionRegistry";
import {
  WEST_AFRICA_EPPO_MAPPING,
  resolvePhytoDiagnosisWithFallback,
} from "@/lib/plantNetConnector";

describe("Référentiel CABI BioProtection, Homologations CSP-CILSS & Résilience In-Situ", () => {
  it("1. Le registre du Burkina Faso contient des produits biologiques et chimiques homologués", () => {
    expect(CABI_CSP_BURKINA_REGISTRY.length).toBeGreaterThanOrEqual(8);

    const bioProducts = CABI_CSP_BURKINA_REGISTRY.filter(
      (p) => p.type === "biologique" || p.type === "biopesticide"
    );
    const cspChemicalProducts = CABI_CSP_BURKINA_REGISTRY.filter(
      (p) => p.type === "chimique_homologue_csp"
    );

    expect(bioProducts.length).toBeGreaterThanOrEqual(4);
    expect(cspChemicalProducts.length).toBeGreaterThanOrEqual(4);

    // Zéro produit de classe OMS Ia ou Ib (hautement dangereux)
    const dangerousClasses = CABI_CSP_BURKINA_REGISTRY.filter(
      (p) => (p.whoToxicityClass as any) === "Ia" || (p.whoToxicityClass as any) === "Ib"
    );
    expect(dangerousClasses.length).toBe(0);
  });

  it("2. La recherche de traitements pour la mineuse de la tomate (Tuta absoluta) renvoie des solutions exactes", () => {
    const treatments = findRegisteredTreatmentsForPest("Tuta absoluta", "Tomate");

    expect(treatments.biological.length).toBeGreaterThanOrEqual(1);
    expect(treatments.chemicalCsp.length).toBeGreaterThanOrEqual(1);

    // Bio : Azadirachtine (Neem)
    const neem = treatments.biological.find((b) =>
      b.activeSubstance.toLowerCase().includes("azadirachtine")
    );
    expect(neem).toBeDefined();
    expect(neem?.dosageKnapsack15L).toContain("15L");
    expect(neem?.preHarvestIntervalDays).toBeLessThanOrEqual(3);

    // Chimique CSP : Coragen ou Emamectine
    const coragen = treatments.chemicalCsp.find((c) =>
      c.commercialName.toLowerCase().includes("coragen")
    );
    expect(coragen).toBeDefined();
    expect(coragen?.cspRegistrationNumber).toBeTruthy();
    expect(coragen?.preHarvestIntervalDays).toBe(3);
  });

  it("3. La recherche de traitements pour la chenille légionnaire (Spodoptera frugiperda) sur maïs", () => {
    const treatments = findRegisteredTreatmentsForPest("Spodoptera frugiperda", "Maïs");

    expect(treatments.biological.length).toBeGreaterThanOrEqual(1);
    expect(treatments.chemicalCsp.length).toBeGreaterThanOrEqual(1);

    // Bio-T (Bacillus thuringiensis)
    const bt = treatments.biological.find((b) =>
      b.activeSubstance.toLowerCase().includes("bacillus thuringiensis")
    );
    expect(bt).toBeDefined();
    expect(bt?.dosageKnapsack15L).toBeTruthy();

    // Emastar (Émamectine benzoate)
    const emastar = treatments.chemicalCsp.find((c) =>
      c.activeSubstance.toLowerCase().includes("emamectine") ||
      c.activeSubstance.toLowerCase().includes("émamectine")
    );
    expect(emastar).toBeDefined();
    expect(emastar?.preHarvestIntervalDays).toBe(7);
  });

  it("4. La table OEPP/EPPO normalise les bioagresseurs majeurs du Sahel", () => {
    expect(WEST_AFRICA_EPPO_MAPPING["tuta_absoluta"].eppoCode).toBe("GNORAB");
    expect(WEST_AFRICA_EPPO_MAPPING["spodoptera_frugiperda"].eppoCode).toBe("LAPHFR");
    expect(WEST_AFRICA_EPPO_MAPPING["thrips_tabaci"].eppoCode).toBe("THRITA");
    expect(WEST_AFRICA_EPPO_MAPPING["ralstonia_solanacearum"].eppoCode).toBe("PSENSO");
  });

  it("5. Le résolveur phytosanitaire s'exécute de façon déterministe en mode hors-ligne", async () => {
    const offlineResult = await resolvePhytoDiagnosisWithFallback({
      imageFileOrData: "dummy_image_data",
      cropHint: "Tomate",
      forceOffline: true,
    });

    expect(offlineResult).toBeDefined();
    expect(offlineResult.scientificName).toBe("Tuta absoluta");
    expect(offlineResult.frenchCommonName).toBe("Mineuse de la tomate");
    expect(offlineResult.confidencePct).toBeGreaterThan(80);
    expect(offlineResult.diagnosticNotes).toContain("INERA");
  });
});
