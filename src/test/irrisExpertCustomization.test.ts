import { describe, it, expect } from "vitest";
import {
  calculateIrrisModel,
  irrisToIrrigationDesignResult,
  IrrisInput,
  IRRIS_ENERGY_SOURCES,
  IRRIS_PUMP_TYPES,
  IRRIS_PIPE_MATERIALS,
} from "@/lib/irrisModelEngine";

describe("Modèle IRRIS - Personnalisation Totale par l'Expert en Génie Rural", () => {
  const baseInput: IrrisInput = {
    sourceType: "forage",
    dynamicWaterDepthM: 30,
    sourceFlowM3h: 6.0,
    dischargeDistanceM: 50,
    areaHa: 1.0,
    cropKey: "tomate",
    season: "seche_chaude",
    method: "goutte_a_goutte",
    pumpingMode: "fil_du_soleil",
    tankHeightM: 5,
  };

  it("calcule la conception standard par défaut", () => {
    const res = calculateIrrisModel(baseInput);

    expect(res.dailyNetWaterVolumeM3).toBeGreaterThan(0);
    expect(res.dailyGrossWaterVolumeM3).toBeGreaterThan(res.dailyNetWaterVolumeM3);
    expect(res.requiredPumpFlowM3h).toBeGreaterThan(0);
    expect(res.totalHeadHmtM).toBeGreaterThan(baseInput.dynamicWaterDepthM);
    expect(res.isSolarPowered).toBe(true);
    expect(res.solarPvWattPeak).toBeGreaterThan(0);
    expect(res.pvPanelsCount).toBeGreaterThan(0);
    expect(res.billOfMaterials.length).toBeGreaterThanOrEqual(6);
    expect(res.totalCostFcfa).toBeGreaterThan(1000000);
    expect(res.isExpertCustomized).toBe(false);
  });

  it("permet à l'expert de choisir une source d'énergie réseau SONABEL ou groupe thermique", () => {
    // Cas 1 : Réseau conventionnel SONABEL
    const sonabelInput: IrrisInput = {
      ...baseInput,
      energySource: "reseau_sonabel",
    };
    const sonabelRes = calculateIrrisModel(sonabelInput);

    expect(sonabelRes.isSolarPowered).toBe(false);
    expect(sonabelRes.solarPvWattPeak).toBe(0);
    expect(sonabelRes.pvPanelsCount).toBe(0);
    expect(sonabelRes.energySourceLabel).toContain("SONABEL");
    expect(sonabelRes.billOfMaterials.some((it) => it.code === "IRRIS-GRID-BOX")).toBe(true);
    expect(sonabelRes.isExpertCustomized).toBe(true);

    // Cas 2 : Groupe électrogène diesel
    const gensetInput: IrrisInput = {
      ...baseInput,
      energySource: "groupe_electrogene",
    };
    const gensetRes = calculateIrrisModel(gensetInput);

    expect(gensetRes.isSolarPowered).toBe(false);
    expect(gensetRes.billOfMaterials.some((it) => it.code === "IRRIS-GENSET-MAIN")).toBe(true);
  });

  it("permet à l'expert de choisir un système hybride avec coffret ATS", () => {
    const hybrideInput: IrrisInput = {
      ...baseInput,
      energySource: "hybride_solaire_reseau",
    };
    const hybrideRes = calculateIrrisModel(hybrideInput);

    expect(hybrideRes.isSolarPowered).toBe(true);
    expect(hybrideRes.solarPvWattPeak).toBeGreaterThan(0);
    expect(hybrideRes.billOfMaterials.some((it) => it.code === "IRRIS-ATS-GRID")).toBe(true);
  });

  it("permet à l'expert de spécifier le modèle exact de pompe, la puissance et son prix", () => {
    const customPumpInput: IrrisInput = {
      ...baseInput,
      customPumpModel: "Lorentz PS2-1800 HR-07 Inox Spécial Forage",
      customPumpPowerKw: 1.8,
      customPumpPriceFcfa: 1100000,
    };
    const res = calculateIrrisModel(customPumpInput);

    expect(res.recommendedPumpModel).toBe("Lorentz PS2-1800 HR-07 Inox Spécial Forage");
    expect(res.motorPowerKw).toBe(1.8);
    const pumpItem = res.billOfMaterials.find((it) => it.code === "IRRIS-PUMP");
    expect(pumpItem).toBeDefined();
    expect(pumpItem?.designation).toBe("Lorentz PS2-1800 HR-07 Inox Spécial Forage");
    expect(pumpItem?.unitPriceFcfa).toBe(1100000);
    expect(pumpItem?.totalPriceFcfa).toBe(1100000);
  });

  it("permet à l'expert de personnaliser le matériau et le diamètre de tuyau avec impact sur la HMT", () => {
    // Tuyau petit diamètre (DN32) = pertes de charge plus fortes
    const smallPipeInput: IrrisInput = {
      ...baseInput,
      pipeMaterial: "pehd_pn16",
      customPipeDiameterMm: 32,
    };
    const smallRes = calculateIrrisModel(smallPipeInput);

    // Tuyau grand diamètre (DN75) = pertes de charge réduites
    const largePipeInput: IrrisInput = {
      ...baseInput,
      pipeMaterial: "pehd_pn10",
      customPipeDiameterMm: 75,
    };
    const largeRes = calculateIrrisModel(largePipeInput);

    expect(smallRes.frictionLossM).toBeGreaterThan(largeRes.frictionLossM);
    expect(smallRes.totalHeadHmtM).toBeGreaterThan(largeRes.totalHeadHmtM);
    expect(smallRes.effectivePipeDiameterMm).toBe(32);
    expect(largeRes.effectivePipeDiameterMm).toBe(75);
  });

  it("permet à l'expert de modifier directement les lignes du bordereau et les prix marketplace", () => {
    const initial = calculateIrrisModel(baseInput);

    // L'expert modifie le prix de la pompe et ajoute un filtre à disques
    const customBOM = initial.billOfMaterials.map((item) => {
      if (item.code === "IRRIS-PUMP") {
        return { ...item, unitPriceFcfa: 750000, totalPriceFcfa: 750000 };
      }
      return item;
    });

    customBOM.push({
      code: "EXP-FILT-01",
      category: "reseau_hydraulique",
      designation: "Filtre à disques 2 pouces 120 mesh",
      specifications: "Offre AGRODIA BURKINA",
      unit: "kit",
      quantity: 2,
      unitPriceFcfa: 120000,
      totalPriceFcfa: 240000,
      supplierName: "AGRODIA BURKINA",
    });

    const customizedInput: IrrisInput = {
      ...baseInput,
      customBillOfMaterials: customBOM,
    };

    const customizedRes = calculateIrrisModel(customizedInput);

    expect(customizedRes.billOfMaterials.length).toBe(customBOM.length);
    expect(customizedRes.billOfMaterials.some((it) => it.code === "EXP-FILT-01")).toBe(true);
    const expectedTotal = customBOM.reduce((acc, it) => acc + it.totalPriceFcfa, 0);
    expect(customizedRes.totalCostFcfa).toBe(expectedTotal);
  });

  it("transmet correctement les choix personnalisés vers le devis officiel et le dossier PDF", () => {
    const customInput: IrrisInput = {
      ...baseInput,
      energySource: "hybride_solaire_reseau",
      customPumpModel: "Grundfos SQFlex 2.5-2",
      customPumpPowerKw: 1.4,
      pipeMaterial: "pvc_pression",
      customPipeDiameterMm: 63,
      customDripperSpacingM: 0.4,
    };

    const res = calculateIrrisModel(customInput);
    const adaptedIrrigation = irrisToIrrigationDesignResult(res);

    expect(adaptedIrrigation.mainPipeDiameterMm).toBe(63);
    expect(adaptedIrrigation.dripperSpacingM).toBe(0.4);
    expect(adaptedIrrigation.motorPowerKw).toBe(1.4);
    expect(adaptedIrrigation.totalHeadHmtM).toBe(res.totalHeadHmtM);
    expect(adaptedIrrigation.totalEquipmentCostFcfa).toBe(res.totalCostFcfa);
    expect(adaptedIrrigation.technicalObservations.some((obs) => obs.includes("Grundfos SQFlex 2.5-2"))).toBe(true);
  });
});
