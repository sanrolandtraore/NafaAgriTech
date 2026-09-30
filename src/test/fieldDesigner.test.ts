import { describe, it, expect } from "vitest";
import {
  calculateDistanceM,
  calculatePolygonAreaM2,
  calculatePerimeterM,
  calculateFieldDimensions,
} from "@/lib/fieldGpsSurvey";
import { computeCropPlan } from "@/lib/fieldCropDesignerEngine";
import { DEFAULT_SAHEL_CROPS } from "@/lib/fieldDesignerCrops";
import { computeIrrigationDesign } from "@/lib/fieldIrrigationDesignerEngine";
import { recommendLivestockBuilding } from "@/lib/fieldLivestockDesignerEngine";
import {
  generateBuildingBillOfQuantities,
  generateIrrigationBillOfQuantities,
} from "@/lib/fieldMaterialsEstimator";
import { runFieldAiCopilot } from "@/lib/fieldAiCopilotEngine";
import { GeoPoint, Farm, Field, FarmBuilding, IrrigationProject } from "@/types/fieldDesigner";

describe("NAFA FIELD DESIGNER — Suite de Tests Métier & Algorithmique", () => {
  // ── 1. MOTEUR GÉODÉSIQUE & GPS TERRAIN ──
  describe("1. Arpentage GPS & Calculs Géodésiques", () => {
    // Coordonnées de test : Parcelle carrée d'environ 100m x 100m (1 hectare) à Bama (Burkina Faso)
    const square1HaPoints: GeoPoint[] = [
      { lat: 11.391245, lng: -4.412154, label: "Borne B1" },
      { lat: 11.391245, lng: -4.411237, label: "Borne B2" },
      { lat: 11.390342, lng: -4.411237, label: "Borne B3" },
      { lat: 11.390342, lng: -4.412154, label: "Borne B4" },
    ];

    it("calcule précisément la distance orthodromique entre deux points (Haversine)", () => {
      const p1 = square1HaPoints[0];
      const p2 = square1HaPoints[1];
      const distance = calculateDistanceM(p1, p2);
      expect(distance).toBeGreaterThan(95);
      expect(distance).toBeLessThan(105);
    });

    it("calcule la superficie en m² et en hectares avec la formule Shoelace WGS84", () => {
      const areaM2 = calculatePolygonAreaM2(square1HaPoints);
      const areaHa = areaM2 / 10000;
      expect(areaM2).toBeGreaterThan(9500);
      expect(areaM2).toBeLessThan(10500);
      expect(areaHa).toBeCloseTo(1.0, 1);
    });

    it("calcule le périmètre cumulé d'une parcelle fermée", () => {
      const perimeter = calculatePerimeterM(square1HaPoints);
      expect(perimeter).toBeGreaterThan(380);
      expect(perimeter).toBeLessThan(420);
    });

    it("estime les dimensions (longueur, largeur) et l'orientation géodésique", () => {
      const dims = calculateFieldDimensions(square1HaPoints);
      expect(dims.lengthM).toBeGreaterThan(120); // diagonale ~141m
      expect(dims.widthM).toBeGreaterThan(50);
      expect(dims.orientationDeg).toBeGreaterThanOrEqual(0);
      expect(dims.orientationDeg).toBeLessThanOrEqual(360);
    });
  });

  // ── 2. CROP DESIGNER (CONCEPTION DE CULTURE) ──
  describe("2. Crop Designer — Rangs, Densité, Semences et Eau", () => {
    const oignonCrop = DEFAULT_SAHEL_CROPS.find((c) => c.id === "oignon")!;

    it("calcule la géométrie de plantation pour 1 ha d'oignon (interligne 20cm, plant 10cm)", () => {
      const plan = computeCropPlan({
        areaHa: 1.0,
        crop: oignonCrop,
        variety: "Safary",
        rowSpacingCm: 20,
        plantSpacingCm: 10,
        orientationDeg: 90,
        plantingType: "repiquage",
      });

      expect(plan.densityPlantsHa).toBe(500000);
      expect(plan.numRows).toBeGreaterThan(300);
      expect(plan.totalRowLengthM).toBeGreaterThan(40000);
      expect(plan.numPlants).toBeGreaterThan(400000);
      expect(plan.seedQuantityKg).toBeGreaterThan(1.0);
      expect(plan.waterNeedsM3Day).toBeGreaterThan(50);
      expect(plan.plantingRowCoordinates.length).toBeGreaterThan(0);
    });

    it("calcule la densité adéquate pour le maïs grain (interligne 80cm, plant 25cm)", () => {
      const maisCrop = DEFAULT_SAHEL_CROPS.find((c) => c.id === "mais")!;
      const plan = computeCropPlan({
        areaHa: 2.0,
        crop: maisCrop,
        variety: "Bondofa",
        rowSpacingCm: 80,
        plantSpacingCm: 25,
        orientationDeg: 90,
        plantingType: "semis_direct",
      });

      expect(plan.densityPlantsHa).toBe(50000);
      expect(plan.numPlants).toBeGreaterThan(80000);
      expect(plan.seedQuantityKg).toBeGreaterThan(25);
    });
  });

  // ── 3. IRRIGATION DESIGNER ──
  describe("3. Irrigation Designer — Réseau Goutte-à-goutte & Pompage Solaire", () => {
    it("dimensionne un réseau goutte-à-goutte pour 1 ha maraîcher avec forage de 6 m³/h", () => {
      const res = computeIrrigationDesign({
        areaHa: 1.0,
        systemType: "goutte_a_goutte",
        waterSource: "forage",
        dynamicWaterDepthM: 40,
        sourceFlowM3h: 6.0,
        pumpType: "solaire_fil_du_soleil",
        cropKey: "maraichage",
      });

      expect(res.mainPipeDiameterMm).toBeGreaterThanOrEqual(40);
      expect(res.numSectors).toBeGreaterThanOrEqual(1);
      expect(res.pumpPowerKw).toBeGreaterThan(0.5);
      expect(res.pumpPowerHp).toBeGreaterThan(0.7);
      expect(res.tankVolumeM3).toBeGreaterThanOrEqual(5);
      expect(res.isTechnicalEstimate).toBe(true);
      expect(res.technicalSummary.toLowerCase()).toContain("solaire");
    });
  });

  // ── 4. LIVESTOCK BUILDING DESIGNER ──
  describe("4. Livestock Building Designer — Modèles Bioclimatiques", () => {
    it("dimensionne un poulailler de chair sahélien pour 2 000 poulets", () => {
      const rec = recommendLivestockBuilding({
        buildingType: "poulailler",
        subType: "chair",
        targetCapacity: 2000,
      });

      expect(rec.buildingType).toBe("poulailler");
      expect(rec.capacityAnimals).toBe(2000);
      expect(rec.areaM2).toBeGreaterThanOrEqual(180);
      expect(rec.widthM).toBeLessThanOrEqual(10); // largeur max 10m pour ventilation passive
      expect(rec.orientation).toContain("Est-Ouest");
      expect(rec.ventilation).toContain("Lanterneau");
    });

    it("dimensionne une étable pour 50 bovins d'engraissement", () => {
      const rec = recommendLivestockBuilding({
        buildingType: "etable",
        subType: "engraissement",
        targetCapacity: 50,
      });

      expect(rec.areaM2).toBeGreaterThanOrEqual(225); // 4.5 m²/tête
      expect(rec.heightM).toBeGreaterThanOrEqual(4.0);
    });
  });

  // ── 5. MÉTRÉS & DEVIS OFFICIEL FCFA ──
  describe("5. Métrés et Devis Estimatif FCFA", () => {
    const testBuilding: FarmBuilding = {
      id: "bld_test",
      farmId: "farm_1",
      name: "Poulailler Test 2000",
      buildingType: "poulailler",
      lengthM: 22,
      widthM: 9,
      heightM: 3.8,
      areaM2: 198,
      orientation: "Est-Ouest",
      ventilation: "Lanterneau",
      roofType: "Tôles Bac Aluzinc",
      wallMaterial: "Agglos 15cm",
      equipment: ["Mangeoires", "Abreuvoirs"],
      posX: 10,
      posY: 10,
      rotationDeg: 0,
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("génère des métrés complets avec ciment, parpaings, tôles et fer pour un bâtiment", () => {
      const boq = generateBuildingBillOfQuantities(testBuilding);

      expect(boq.items.length).toBeGreaterThanOrEqual(6);
      expect(boq.subtotalMaterialsFCFA).toBeGreaterThan(1000000);
      expect(boq.laborCostFCFA).toBeGreaterThan(0);
      expect(boq.totalGeneralFCFA).toBeGreaterThan(boq.subtotalMaterialsFCFA);

      const cementItem = boq.items.find((i) => i.category === "maconnerie" && i.unit === "sac");
      expect(cementItem).toBeDefined();
      expect(cementItem!.quantity).toBeGreaterThan(50);
    });

    it("génère les métrés pour un réseau d'irrigation avec tuyaux PEHD et filtration", () => {
      const testIrrig: IrrigationProject = {
        id: "irrig_1",
        farmId: "farm_1",
        systemType: "goutte_a_goutte",
        waterSource: "forage",
        dynamicWaterDepthM: 35,
        sourceFlowM3h: 6,
        pumpType: "solaire_fil_du_soleil",
        pumpPowerKw: 2.2,
        tankHeightM: 4,
        tankVolumeM3: 15,
        mainPipeLengthM: 120,
        mainPipeDiameterMm: 50,
        subPipeLengthM: 100,
        subPipeDiameterMm: 40,
        lateralLengthM: 12500,
        lateralSpacingM: 0.8,
        emitterSpacingM: 0.3,
        emitterFlowLh: 2,
        totalEmittersCount: 41000,
        totalFlowRateM3h: 8.2,
        numSectors: 2,
        dailyIrrigationHours: 3.5,
        isTechnicalEstimate: true,
        syncStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const boq = generateIrrigationBillOfQuantities(testIrrig);
      expect(boq.items.length).toBeGreaterThanOrEqual(4);
      expect(boq.totalGeneralFCFA).toBeGreaterThan(500000);
    });
  });

  // ── 6. AI AGRONOMY COPILOT ──
  describe("6. NAFA AI Agronomy Copilot (Zéro Hallucination)", () => {
    const testFarm: Farm = {
      id: "f_1",
      name: "Ferme du Kou",
      producerName: "Alassane Kaboré",
      producerPhone: "+226 70 00 00 00",
      locality: "Bama",
      region: "Hauts-Bassins",
      province: "Houet",
      commune: "Bama",
      villageSector: "Secteur 1",
      gps: { lat: 11.39, lng: -4.41 },
      farmType: "maraichage",
      totalAreaHa: 2.0,
      mainCrops: ["Tomate", "Oignon"],
      livestockTypes: [],
      irrigationType: "Goutte-à-goutte",
      photos: [],
      syncStatus: "synced",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const testField: Field = {
      id: "fld_1",
      farmId: "f_1",
      name: "Parcelle Tomate",
      points: [
        { lat: 11.39, lng: -4.41 },
        { lat: 11.391, lng: -4.41 },
        { lat: 11.391, lng: -4.411 },
      ],
      areaM2: 10000,
      areaHa: 1.0,
      perimeterM: 400,
      status: "active",
      syncStatus: "synced",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("structure l'analyse strictement en 5 sections distinctes sans inventer de données", () => {
      const output = runFieldAiCopilot({
        farm: testFarm,
        fields: [testField],
        cropPlans: [],
        buildings: [],
      });

      expect(output.sections.length).toBe(5);
      expect(output.sections[0].category).toBe("measured");
      expect(output.sections[1].category).toBe("input");
      expect(output.sections[2].category).toBe("calculated");
      expect(output.sections[3].category).toBe("hypothesis");
      expect(output.sections[4].category).toBe("recommendation");

      expect(output.sections[0].items[0]).toContain("11.39000° N");
      expect(output.sections[4].items.some((i) => i.includes("INERA") || i.includes("compost"))).toBe(true);
    });
  });
});
