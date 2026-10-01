import { describe, it, expect } from "vitest";
import { BURKINA_ALL_CROPS_TECHNICAL_SHEETS, WEST_AFRICA_12_CROPS } from "@/lib/cropLibraryData";

describe("Base de Données des Fiches Techniques Agronomiques (200+ Cultures)", () => {
  it("contient un minimum absolu de 200 cultures ouest-africaines et sahéliennes", () => {
    expect(BURKINA_ALL_CROPS_TECHNICAL_SHEETS.length).toBeGreaterThanOrEqual(200);
    // Actuellement 235 cultures enregistrées
    expect(BURKINA_ALL_CROPS_TECHNICAL_SHEETS.length).toBe(235);
  });

  it("accorde une priorité majeure aux cultures cultivées au Burkina Faso (> 150)", () => {
    const burkinaPriority = BURKINA_ALL_CROPS_TECHNICAL_SHEETS.filter(c => c.is_burkina_priority);
    expect(burkinaPriority.length).toBeGreaterThanOrEqual(150);
    expect(burkinaPriority.length).toBe(188);
  });

  it("garantit l'intégrité de chaque fiche technique agronomique", () => {
    for (const crop of BURKINA_ALL_CROPS_TECHNICAL_SHEETS) {
      expect(crop.id).toBeDefined();
      expect(crop.id.startsWith("sheet-")).toBe(true);
      expect(crop.crop_key).toBeDefined();
      expect(crop.name_fr).toBeDefined();
      expect(crop.category).toBeDefined();
      expect(crop.cycle_days_min).toBeGreaterThan(0);
      expect(crop.cycle_days_max).toBeGreaterThanOrEqual(crop.cycle_days_min);
      expect(crop.water_needs_mm).toBeGreaterThan(0);
      expect(crop.npk_needs).toBeDefined();
      expect(typeof crop.npk_needs.N).toBe("number");
      expect(typeof crop.npk_needs.P).toBe("number");
      expect(typeof crop.npk_needs.K).toBe("number");
      expect(Array.isArray(crop.recommended_varieties)).toBe(true);
      expect(crop.recommended_varieties.length).toBeGreaterThan(0);
      expect(Array.isArray(crop.common_pests)).toBe(true);
      expect(Array.isArray(crop.common_diseases)).toBe(true);
      expect(Array.isArray(crop.climate_zones)).toBe(true);
      expect(Array.isArray(crop.seasons)).toBe(true);
      expect(crop.yield_potential_t_ha).toBeGreaterThan(0);
      expect(crop.notes).toBeDefined();
    }
  });

  it("couvre l'ensemble des 10 filières agronomiques clés", () => {
    const categories = new Set(BURKINA_ALL_CROPS_TECHNICAL_SHEETS.map(c => c.category));
    expect(categories.has("Céréales")).toBe(true);
    expect(categories.has("Légumineuses & Protéagineux")).toBe(true);
    expect(categories.has("Tubercules & Racines")).toBe(true);
    expect(categories.has("Maraîchage & Légumes-Fruits")).toBe(true);
    expect(categories.has("Légumes-Feuilles")).toBe(true);
    expect(categories.has("Légumes-Bulbes & Brassicacées")).toBe(true);
    expect(categories.has("Cultures Industrielles")).toBe(true);
    expect(categories.has("Arboriculture Fruitière")).toBe(true);
    expect(categories.has("Aromatiques & Médicinales")).toBe(true);
    expect(categories.has("Plantes Fourragères")).toBe(true);
    expect(categories.size).toBe(10);
  });

  it("maintient la rétrocompatibilité complète avec WEST_AFRICA_12_CROPS", () => {
    expect(WEST_AFRICA_12_CROPS).toBe(BURKINA_ALL_CROPS_TECHNICAL_SHEETS);
    expect(WEST_AFRICA_12_CROPS.length).toBe(BURKINA_ALL_CROPS_TECHNICAL_SHEETS.length);
  });

  it("respecte la règle absolue de zéro mention de plateformes tierces", () => {
    const jsonStr = JSON.stringify(BURKINA_ALL_CROPS_TECHNICAL_SHEETS).toLowerCase();
    expect(jsonStr).not.toContain("fincabout");
    expect(jsonStr).not.toContain("wefarmup");
    expect(jsonStr).not.toContain("mesparcelles");
    expect(jsonStr).not.toContain("shutterstock");
  });
});
