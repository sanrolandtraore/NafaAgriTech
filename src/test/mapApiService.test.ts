import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  reverseGeocodeWithMapApi,
  searchPlacesWithMapApi,
  fetchElevationForCoordinates,
} from "@/lib/mapApiService";

describe("Map API Service — Géocodage, Toponymes et Altitude", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("gère le fallback hors-ligne de géocodage inverse sur les toponymes burkinabè", async () => {
    // Simuler le mode hors-ligne
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

    // Coordonnées de Bobo-Dioulasso (11.1772, -4.2979)
    const result = await reverseGeocodeWithMapApi(11.1772, -4.2979);
    expect(result).toBeDefined();
    expect(result.country).toBe("Burkina Faso");
    expect(result.placeName).toContain("Bobo-Dioulasso");
    expect(result.region).toBe("Hauts-Bassins");
    expect(result.source).toBe("burkina_toponyms_local");
  });

  it("recherche des localités dans le référentiel toponymique burkinabè", async () => {
    const results = await searchPlacesWithMapApi("Bagré");
    expect(results.length).toBeGreaterThan(0);
    const bagre = results.find((r) => r.name.toLowerCase().includes("bagré"));
    expect(bagre).toBeDefined();
    expect(bagre?.lat).toBeCloseTo(11.5, 0.5);
  });

  it("retourne un tableau vide pour des requêtes de recherche trop courtes", async () => {
    const results = await searchPlacesWithMapApi("a");
    expect(results).toEqual([]);
  });

  it("effectue le reverse geocoding via l'API Nominatim lorsque le réseau est disponible", async () => {
    const mockOsmResponse = {
      name: "Parcelle Bama Centre",
      display_name: "Bama, Houet, Hauts-Bassins, Burkina Faso",
      address: {
        village: "Bama",
        county: "Houet",
        state: "Hauts-Bassins",
        country: "Burkina Faso",
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOsmResponse,
    } as any);

    const res = await reverseGeocodeWithMapApi(11.39, -4.42);
    expect(res.placeName).toBe("Bama");
    expect(res.province).toBe("Houet");
    expect(res.region).toBe("Hauts-Bassins");
    expect(res.source).toBe("map_api_nominatim");
  });

  it("récupère l'altitude via l'API Open-Meteo", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ elevation: [298.5] }),
    } as any);

    const elevation = await fetchElevationForCoordinates(12.37, -1.52);
    expect(elevation).toBe(299);
  });
});
