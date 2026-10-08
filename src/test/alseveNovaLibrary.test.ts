import { describe, it, expect } from "vitest";
import {
  ALSEVE_NOVA_COLLECTIONS,
  ALSEVE_NOVA_ITEMS,
  buildProceduralMeshForType,
} from "../lib/studio3dLibrary";

describe("Alseve Nova 3D CAD Suite — Bibliothèque & Moteur", () => {
  it("contient les 4 collections officielles Alseve Nova", () => {
    expect(ALSEVE_NOVA_COLLECTIONS.length).toBe(4);
    const collectionIds = ALSEVE_NOVA_COLLECTIONS.map((c) => c.id);
    expect(collectionIds).toContain("vegetaux");
    expect(collectionIds).toContain("accessoires");
    expect(collectionIds).toContain("textures");
    expect(collectionIds).toContain("eclairages");

    const vegetauxCol = ALSEVE_NOVA_COLLECTIONS.find((c) => c.id === "vegetaux");
    expect(vegetauxCol?.label).toContain("10 000 Végétaux");

    const accessoiresCol = ALSEVE_NOVA_COLLECTIONS.find((c) => c.id === "accessoires");
    expect(accessoiresCol?.label).toContain("6 000 Accessoires");

    const texturesCol = ALSEVE_NOVA_COLLECTIONS.find((c) => c.id === "textures");
    expect(texturesCol?.label).toContain("5 000 Textures");

    const eclairagesCol = ALSEVE_NOVA_COLLECTIONS.find((c) => c.id === "eclairages");
    expect(eclairagesCol?.label).toContain("1 000 Éclairages");
  });

  it("propose des éléments détaillés pour chaque collection Alseve Nova", () => {
    expect(ALSEVE_NOVA_ITEMS.length).toBeGreaterThanOrEqual(20);

    // Végétaux Nova avec profils de croissance
    const mango = ALSEVE_NOVA_ITEMS.find((i) => i.type === "orchard_mango");
    expect(mango).toBeDefined();
    expect(mango?.collection).toBe("vegetaux");
    expect(mango?.growthProfile).toBeDefined();
    expect(mango?.growthProfile?.minScale).toBeLessThan(mango?.growthProfile?.maxScale || 0);

    // Accessoires Nova
    const pergola = ALSEVE_NOVA_ITEMS.find((i) => i.type === "nova_pergola_lounge");
    expect(pergola).toBeDefined();
    expect(pergola?.collection).toBe("accessoires");

    const greenhouse = ALSEVE_NOVA_ITEMS.find((i) => i.type === "nova_greenhouse_polycarbonate");
    expect(greenhouse).toBeDefined();
    expect(greenhouse?.collection).toBe("accessoires");

    // Éclairages Nova
    const floodlight = ALSEVE_NOVA_ITEMS.find((i) => i.type === "nova_solar_floodlight");
    expect(floodlight).toBeDefined();
    expect(floodlight?.collection).toBe("eclairages");
    expect(floodlight?.isLighting).toBe(true);
  });

  it("génère des maillages 3D procéduraux Three.js adaptatifs selon la saison et la croissance", () => {
    const customColors = {
      groundColor: "#8d3214",
      cropColor: "#2e7d32",
      pipeColor: "#0288d1",
      buildingColor: "#f57c00",
    };

    // Test manguier avec croissance 1 an vs 10 ans
    const meshYoung = buildProceduralMeshForType("orchard_mango", 24, 24, 6, customColors, {
      growthFactor: 0.4,
      season: "rainy",
    });
    expect(meshYoung.children.length).toBeGreaterThan(0);

    const meshMature = buildProceduralMeshForType("orchard_mango", 24, 24, 6, customColors, {
      growthFactor: 1.3,
      season: "harvest",
    });
    expect(meshMature.children.length).toBeGreaterThan(meshYoung.children.length);

    // Test projecteur solaire en mode nuit
    const floodlightDay = buildProceduralMeshForType("nova_solar_floodlight", 2, 2, 3.5, customColors, {
      isNight: false,
    });
    const floodlightNight = buildProceduralMeshForType("nova_solar_floodlight", 2, 2, 3.5, customColors, {
      isNight: true,
    });
    // En mode nuit, une source PointLight Three.js est ajoutée
    expect(floodlightNight.children.length).toBeGreaterThan(floodlightDay.children.length);
  });
});
