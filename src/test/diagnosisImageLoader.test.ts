import { describe, it, expect, vi } from "vitest";
import { optimizeAndCompressImage, createSyntheticSampleImage } from "@/lib/imageOptimization";

describe("Moteur d'Optimisation et de Chargement d'Images pour le Diagnostic", () => {
  it("génère un échantillon synthétique représentatif en 1 clic pour tester le diagnostic", async () => {
    const sampleFile = await createSyntheticSampleImage(
      "Feuille de Tomate Mildiou",
      "#2e7d32",
      "#388e3c",
      [{ x: 260, y: 220, r: 35, color: "#5d4037" }]
    );

    expect(sampleFile).toBeDefined();
    expect(sampleFile.name).toContain("feuille_de_tomate_mildiou.jpg");
    expect(sampleFile.type).toBe("image/jpeg");
    expect(sampleFile.size).toBeGreaterThan(0);
  });

  it("accepte et compresse un fichier image avec conservation de la structure", async () => {
    // Créer un faux blob image JPEG
    const sampleBlob = new Blob(["fake-image-bytes-jpeg"], { type: "image/jpeg" });
    const originalFile = new File([sampleBlob], "maladie_mais_lourde.jpg", { type: "image/jpeg" });

    // optimizeAndCompressImage doit retourner un résultat complet
    const result = await optimizeAndCompressImage(originalFile, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.85,
    });

    expect(result).toBeDefined();
    expect(result.file).toBeDefined();
    expect(result.file.name).toBe("maladie_mais_lourde.jpg");
    expect(result.previewUrl).toBeDefined();
    expect(typeof result.base64).toBe("string");
    expect(result.originalSize).toBe(originalFile.size);
  });
});
