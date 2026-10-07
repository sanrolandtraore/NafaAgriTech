import { describe, it, expect } from "vitest";
import {
  computeWcadiIrrigationProject,
  WCADI_CROP_STANDARDS,
  LOCAL_MARKETPLACE_PRICING,
} from "../lib/nafaWcadiHydraulicEngine";
import { generateWcadiHydraulicPdf } from "../lib/nafaWcadiHydraulicPdf";

describe("Studio d'Ingénierie Hydraulique NAFA (Style Rivulis WCADI)", () => {
  const mockGpsParcelle1Ha = [
    { lat: 12.350, lng: -1.520 },
    { lat: 12.350, lng: -1.510 },
    { lat: 12.341, lng: -1.510 },
    { lat: 12.341, lng: -1.520 },
  ];

  it("calcule la superficie, les barres de tuyaux PEHD et le débit de secteur", () => {
    const project = computeWcadiIrrigationProject({
      projectName: "Test Parcelle Maraîchère",
      points: mockGpsParcelle1Ha,
      cropKey: "tomate",
      waterSource: "forage",
      energySource: "solaire_fil_du_soleil",
      sourceFlowM3h: 10.0,
      dynamicWaterDepthM: 40,
    });

    expect(project.id).toBeDefined();
    expect(project.gpsSurvey.areaHa).toBeGreaterThan(0.5);
    expect(project.hydraulicResults.mainPipeDiameterMm).toBeGreaterThanOrEqual(50);
    expect(project.hydraulicResults.mainPipeBarsCount).toBeGreaterThan(5);
    expect(project.hydraulicResults.totalDripTapeLengthM).toBeGreaterThan(1000);
    expect(project.hydraulicResults.numSectors).toBeGreaterThanOrEqual(1);
    expect(project.hydraulicResults.pumpPowerKw).toBeGreaterThan(0.5);
    expect(project.hydraulicResults.maxLateralRunLengthM).toBeGreaterThan(20);
    expect(project.hydraulicResults.emissionUniformityPct).toBeGreaterThanOrEqual(90);
  });

  it("génère une nomenclature chiffrée avec les prix locaux de la marketplace", () => {
    const project = computeWcadiIrrigationProject({
      points: mockGpsParcelle1Ha,
      cropKey: "oignon",
      waterSource: "forage",
      energySource: "solaire_fil_du_soleil",
      sourceFlowM3h: 6.0,
    });

    expect(project.billOfMaterials.length).toBeGreaterThanOrEqual(5);
    expect(project.financialTotalFcfa).toBeGreaterThan(500000);

    const pehdMain = project.billOfMaterials.find((b) => b.category === "tuyauterie_principale");
    expect(pehdMain).toBeDefined();
    expect(pehdMain?.unit).toBe("barre_6m");

    const pumpItem = project.billOfMaterials.find((b) => b.category === "pompage_energie");
    expect(pumpItem).toBeDefined();
    expect(pumpItem?.sourceSupplierName).toContain("FASO SOLAIRE");
  });

  it("exporte un document PDF certifié complet", () => {
    const project = computeWcadiIrrigationProject({
      points: mockGpsParcelle1Ha,
      cropKey: "mais",
      waterSource: "bassin_barrage",
      energySource: "groupe_electrogene",
      sourceFlowM3h: 15.0,
    });

    const doc = generateWcadiHydraulicPdf(project, "El Hadj Ouedraogo", "Koubri");
    expect(doc).toBeDefined();
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0); // Format A4
  });
});
