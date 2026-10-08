import { describe, it, expect } from "vitest";
import {
  BURKINA_TOPONYMS,
  searchBurkinaToponyms,
  findNearestToponym,
} from "../lib/burkinaToponyms";

describe("Burkina Faso Toponyms & Map Labels", () => {
  it("contient un catalogue riche de localités agricoles et chefs-lieux", () => {
    expect(BURKINA_TOPONYMS.length).toBeGreaterThanOrEqual(30);

    // Vérifier les pôles agricoles essentiels
    const bama = BURKINA_TOPONYMS.find((t) => t.id === "bama");
    expect(bama).toBeDefined();
    expect(bama?.name).toContain("Vallée du Kou");
    expect(bama?.category).toBe("pole_agricole");

    const bagre = BURKINA_TOPONYMS.find((t) => t.id === "bagre");
    expect(bagre).toBeDefined();
    expect(bagre?.name).toContain("Bagré");

    const ineraKamboise = BURKINA_TOPONYMS.find((t) => t.id === "kamboise_inera");
    expect(ineraKamboise).toBeDefined();
    expect(ineraKamboise?.category).toBe("station_recherche");
  });

  it("permet la recherche textuelle par nom, région, province et description", () => {
    const kouResults = searchBurkinaToponyms("Kou");
    expect(kouResults.length).toBeGreaterThan(0);
    expect(kouResults.some((t) => t.name.includes("Bama"))).toBe(true);

    const sourouResults = searchBurkinaToponyms("Sourou");
    expect(sourouResults.length).toBeGreaterThan(0);
    expect(sourouResults.some((t) => t.name.includes("Sourou"))).toBe(true);

    const ineraResults = searchBurkinaToponyms("INERA");
    expect(ineraResults.length).toBeGreaterThanOrEqual(3);
  });

  it("calcule avec précision la localité la plus proche à partir d'un point GPS", () => {
    // Coordonnées proches de Bama (11.39, -4.41)
    const nearestToBama = findNearestToponym(11.395, -4.415);
    expect(nearestToBama).not.toBeNull();
    expect(nearestToBama?.toponym.id).toBe("bama");
    expect(nearestToBama?.distanceKm).toBeLessThan(2);

    // Coordonnées proches du centre de Ouagadougou (12.37, -1.52)
    const nearestToOuaga = findNearestToponym(12.370, -1.518);
    expect(nearestToOuaga).not.toBeNull();
    expect(nearestToOuaga?.toponym.id).toBe("ouagadougou");
    expect(nearestToOuaga?.distanceKm).toBeLessThan(3);
  });

  it("gère les cas de recherche vide ou query vide", () => {
    const defaultList = searchBurkinaToponyms("");
    expect(defaultList.length).toBeGreaterThan(0);
    expect(defaultList.length).toBeLessThanOrEqual(10);
  });
});
