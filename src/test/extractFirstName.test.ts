import { describe, it, expect } from "vitest";
import { extractFirstName } from "@/components/copilot/UniversalNafaCopilotWidget";

describe("extractFirstName helper for Nafa assistant", () => {
  it("extracts simple first name", () => {
    expect(extractFirstName("Roland Traoré")).toBe("Roland");
    expect(extractFirstName("Ousmane Diallo")).toBe("Ousmane");
    expect(extractFirstName("aminata traoré")).toBe("Aminata");
  });

  it("handles honorifics and titles", () => {
    expect(extractFirstName("Dr. Aminata Traoré")).toBe("Aminata");
    expect(extractFirstName("Dr Moussa Kaboré")).toBe("Moussa");
    expect(extractFirstName("Ing. Paul Sawadogo")).toBe("Paul");
    expect(extractFirstName("Prof. Amadou Zongo")).toBe("Amadou");
    expect(extractFirstName("M. Seydou Compaoré")).toBe("Seydou");
    expect(extractFirstName("Mme Fatou Ouedraogo")).toBe("Fatou");
  });

  it("handles compound first names", () => {
    expect(extractFirstName("Jean-Baptiste Sanon")).toBe("Jean-Baptiste");
    expect(extractFirstName("Marie-Claire Bationo")).toBe("Marie-Claire");
  });

  it("handles empty or null values gracefully", () => {
    expect(extractFirstName(null)).toBe("");
    expect(extractFirstName(undefined)).toBe("");
    expect(extractFirstName("   ")).toBe("");
  });
});
