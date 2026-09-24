import { describe, it, expect } from "vitest";
import {
  generateUnifiedEngineeringProject,
  recalculateProjectWithExpertEdits,
  VERIFIED_NAFA_PARTNERS,
  PARTNER_EQUIPMENT_CATALOG,
  ExpertMaterialUpdate,
} from "../lib/nafaEngineeringStudio";
import { analyzeGeodesicSurvey } from "../lib/nafaGeniusEngine";

describe("NAFA Genius IA - Copilote Unifié d'Ingénierie Agro-Pastorale", () => {
  const sampleSurvey = analyzeGeodesicSurvey([
    { lat: 11.391245, lng: -4.412154, alt: 312.4, label: "B1 - Nord-Ouest" },
    { lat: 11.391320, lng: -4.410310, alt: 312.0, label: "B2 - Nord-Est" },
    { lat: 11.389950, lng: -4.410220, alt: 310.8, label: "B3 - Sud-Est" },
    { lat: 11.389880, lng: -4.412080, alt: 311.2, label: "B4 - Sud-Ouest" },
  ]);

  it("génère un projet complet conforme aux standards CIRAD et FAO-56", () => {
    const project = generateUnifiedEngineeringProject({
      survey: sampleSurvey,
      clientName: "Issa Ouédraogo",
      clientPhone: "+226 70 00 00 00",
      location: "Bama, Houet, Burkina Faso",
      expertName: "Dr. Oumarou Sawadogo",
      cropKey: "tomate",
      season: "saison_seche_chaude",
      includePoultry: true,
      poultryBirdType: "poulet_chair",
      poultryFlockSize: 2000,
      boreholeDepthM: 60,
      waterTableDepthM: 35,
      waterTowerHeightM: 8,
    });

    expect(project).toBeDefined();
    expect(project.clientName).toBe("Issa Ouédraogo");
    expect(project.survey.areaHa).toBeGreaterThan(0);

    // 1. Hydraulique CIRAD & FAO-56
    expect(project.hydraulics.dailyWaterRequirementM3).toBeGreaterThan(0);
    expect(project.hydraulics.peakHourlyFlowM3h).toBeGreaterThan(0);
    expect(project.hydraulics.hmtTotalM).toBeGreaterThan(43); // Static lift (35+8) + pertes + pression résiduelle
    expect(project.hydraulics.solarPvKwPeak).toBeGreaterThan(0);
    expect([63, 90]).toContain(project.hydraulics.mainPipeDiameterMm);
    expect(project.hydraulics.standardsUsed).toContain("Bulletin FAO-56 Irrigation and Drainage Paper");
    expect(project.hydraulics.standardsUsed).toContain("CIRAD Hydraulique Agricole Tropicale (Formule de Hazen-Williams)");

    // 2. Bâtiment avicole bioclimatique CIRAD
    expect(project.livestockHousing).toBeDefined();
    if (project.livestockHousing) {
      expect(project.livestockHousing.flockSize).toBe(2000);
      expect(project.livestockHousing.floorAreaM2).toBe(200); // 2000 sujets / 10 par m²
      expect(project.livestockHousing.dimensions.widthM).toBeLessThanOrEqual(10); // Largeur 8-10m max pour ventilation naturelle
      expect(project.livestockHousing.thermosiphonLanternM).toBe(1.0); // Lanterneau faîtier
      expect(project.livestockHousing.bioclimaticOrientation).toContain("Est-Ouest");
    }

    // 3. Cotations 2D
    expect(project.dimensionLines.length).toBeGreaterThanOrEqual(4);
    for (const dim of project.dimensionLines) {
      expect(dim.lengthM).toBeGreaterThan(0);
      expect(dim.label).toBeDefined();
    }

    // 4. Schéma technique P&ID
    expect(project.networkNodes.length).toBeGreaterThanOrEqual(6);
    const nodeTypes = project.networkNodes.map((n) => n.type);
    expect(nodeTypes).toContain("borehole");
    expect(nodeTypes).toContain("water_tower");
    expect(nodeTypes).toContain("filter_station");
    expect(nodeTypes).toContain("fertigation_injector");
    expect(nodeTypes).toContain("sector_valve");

    expect(project.networkPipes.length).toBeGreaterThanOrEqual(4);
    for (const pipe of project.networkPipes) {
      expect(pipe.flowVelocityMs).toBeGreaterThanOrEqual(0.8);
      expect(pipe.flowVelocityMs).toBeLessThanOrEqual(1.8); // Conforme aux normes CIRAD (vitesse admissible < 1.8 m/s)
      expect(pipe.headLossM).toBeGreaterThan(0);
    }
  });

  it("inclut les fournisseurs agréés du Burkina Faso avec plusieurs offres par équipement", () => {
    expect(VERIFIED_NAFA_PARTNERS.faso_solaire).toBeDefined();
    expect(VERIFIED_NAFA_PARTNERS.agrodia_bf).toBeDefined();
    expect(VERIFIED_NAFA_PARTNERS.sodimex_sahel).toBeDefined();
    expect(VERIFIED_NAFA_PARTNERS.tropic_agro).toBeDefined();
    expect(VERIFIED_NAFA_PARTNERS.bio_construction_bf).toBeDefined();
    expect(VERIFIED_NAFA_PARTNERS.faso_provendes).toBeDefined();

    // Vérification du catalogue
    for (const [key, item] of Object.entries(PARTNER_EQUIPMENT_CATALOG)) {
      expect(item.offers.length).toBeGreaterThanOrEqual(2);
      for (const offer of item.offers) {
        expect(offer.unitPriceFcfa).toBeGreaterThan(0);
        expect(offer.warrantyMonths).toBeGreaterThanOrEqual(12);
        expect(offer.supplierName).toBeDefined();
      }
    }
  });

  it("calcule avec exactitude le bordereau des matériaux (BPU) et les métrés", () => {
    const project = generateUnifiedEngineeringProject({
      survey: sampleSurvey,
      clientName: "Moussa Traoré",
      clientPhone: "+226 76 11 22 33",
      location: "Koubri, Kadiogo, Burkina Faso",
      cropKey: "oignon",
      includePoultry: true,
      poultryFlockSize: 1000,
    });

    const bom = project.billOfMaterials;
    expect(bom.length).toBeGreaterThanOrEqual(8);

    // Conduite principale PEHD
    const mainPipe = bom.find((i) => i.code === "PIPE_PEHD_MAIN");
    expect(mainPipe).toBeDefined();
    expect(mainPipe?.calculatedQuantity).toBeGreaterThan(50);
    expect(mainPipe?.unit).toBe("m");

    // Lignes de goutte-à-goutte
    const dripLines = bom.find((i) => i.code === "DRIP_TAPE_LINES");
    expect(dripLines).toBeDefined();
    // ~8333 m par hectare pour espacement 1.2m
    expect(dripLines?.calculatedQuantity).toBeGreaterThan(5000);
    expect(dripLines?.unit).toBe("ml");

    // Pompe solaire
    const solarPump = bom.find((i) => i.code === "PUMP_SOLAR_SUBMERSIBLE");
    expect(solarPump).toBeDefined();
    expect(solarPump?.calculatedQuantity).toBe(1);

    // Panneaux solaires photovoltaïques
    const pvPanels = bom.find((i) => i.code === "SOLAR_PV_PANELS");
    expect(pvPanels).toBeDefined();
    expect(pvPanels?.calculatedQuantity).toBeGreaterThan(4);
  });

  it("génère un devis financier équilibré avec ventilation main-d'œuvre, logistique et imprévus", () => {
    const project = generateUnifiedEngineeringProject({
      survey: sampleSurvey,
      clientName: "Fatou Sanogo",
      clientPhone: "+226 78 99 88 77",
      location: "Bama",
      cropKey: "tomate",
    });

    const fin = project.financialSummary;
    expect(fin.totalMaterialsEquipmentFcfa).toBeGreaterThan(0);
    // Main-d'œuvre = 14%
    expect(fin.totalLaborFcfa).toBe(Math.round(fin.totalMaterialsEquipmentFcfa * 0.14));
    // Logistique & transport = 5%
    expect(fin.totalLogisticsTransportFcfa).toBe(Math.round(fin.totalMaterialsEquipmentFcfa * 0.05));
    // Imprévus = 4%
    expect(fin.contingenciesFcfa).toBe(Math.round(fin.totalMaterialsEquipmentFcfa * 0.04));
    // Total = Somme
    expect(fin.grandTotalFcfa).toBe(
      fin.totalMaterialsEquipmentFcfa +
      fin.totalLaborFcfa +
      fin.totalLogisticsTransportFcfa +
      fin.contingenciesFcfa
    );
  });

  it("recalcule dynamiquement l'intégralité du projet lorsque l'expert modifie un fournisseur ou un prix", () => {
    const initialProject = generateUnifiedEngineeringProject({
      survey: sampleSurvey,
      clientName: "Issa Ouédraogo",
      clientPhone: "+226 70 00 00 00",
      location: "Bama",
      cropKey: "tomate",
      includePoultry: false,
    });

    const pumpItem = initialProject.billOfMaterials.find((m) => m.code === "PUMP_SOLAR_SUBMERSIBLE");
    expect(pumpItem).toBeDefined();
    if (!pumpItem) return;

    const initialTotal = initialProject.financialSummary.grandTotalFcfa;
    const initialSupplier = pumpItem.selectedSupplierId;

    // L'expert choisit une offre alternative avec une garantie plus longue
    const alternativeOffer = pumpItem.availablePartnerOffers.find((o) => o.supplierId !== initialSupplier);
    expect(alternativeOffer).toBeDefined();
    if (!alternativeOffer) return;

    const update: ExpertMaterialUpdate = {
      materialId: pumpItem.id,
      newSupplierId: alternativeOffer.supplierId,
      newPriceFcfa: alternativeOffer.unitPriceFcfa,
      expertNotes: "Sélection de l'offre alternative pour garantie étendue.",
    };

    const recalculated = recalculateProjectWithExpertEdits(initialProject, [update]);

    const updatedPump = recalculated.billOfMaterials.find((m) => m.id === pumpItem.id);
    expect(updatedPump?.selectedSupplierId).toBe(alternativeOffer.supplierId);
    expect(updatedPump?.selectedPriceFcfa).toBe(alternativeOffer.unitPriceFcfa);
    expect(updatedPump?.isCustomizedByExpert).toBe(true);

    // Le montant global a été recalculé automatiquement avec la main d'œuvre et le transport
    expect(recalculated.financialSummary.grandTotalFcfa).not.toBe(initialTotal);
    expect(recalculated.financialSummary.grandTotalFcfa).toBe(
      recalculated.financialSummary.totalMaterialsEquipmentFcfa +
      recalculated.financialSummary.totalLaborFcfa +
      recalculated.financialSummary.totalLogisticsTransportFcfa +
      recalculated.financialSummary.contingenciesFcfa
    );
  });

  it("permet à l'expert d'ajuster manuellement la quantité d'un matériau avec mise à jour immédiate", () => {
    const project = generateUnifiedEngineeringProject({
      survey: sampleSurvey,
      clientName: "Issa Ouédraogo",
      clientPhone: "+226 70 00 00 00",
      location: "Bama",
      cropKey: "tomate",
    });

    const mainPipe = project.billOfMaterials.find((m) => m.code === "PIPE_PEHD_MAIN");
    expect(mainPipe).toBeDefined();
    if (!mainPipe) return;

    const initialQty = mainPipe.expertQuantity;
    const newQty = initialQty + 100; // Ajout de 100m pour raccordement éloigné

    const update: ExpertMaterialUpdate = {
      materialId: mainPipe.id,
      newQuantity: newQty,
      expertNotes: "Ajout de 100m de PEHD pour raccordement au château d'eau distant de 150m.",
    };

    const recalculated = recalculateProjectWithExpertEdits(project, [update]);
    const updatedPipe = recalculated.billOfMaterials.find((m) => m.id === mainPipe.id);

    expect(updatedPipe?.expertQuantity).toBe(newQty);
    expect(updatedPipe?.totalPriceFcfa).toBe(newQty * (updatedPipe?.selectedPriceFcfa || 0));
    expect(updatedPipe?.isCustomizedByExpert).toBe(true);
  });
});
