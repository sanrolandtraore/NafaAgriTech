/**
 * NAFA FIELD DESIGNER — CALCULATEUR DE MÉTRÉS & DEVIS OFFICIEL FCFA
 * Convertit les dimensions des bâtiments ou des réseaux d'irrigation en métrés réels
 * et génère des lignes de devis basées sur la mercuriale officielle du Burkina Faso.
 */

import { QuoteItem, FarmBuilding, IrrigationProject } from "@/types/fieldDesigner";
import { materialsStorage } from "@/lib/fieldDesignerPrices";

export interface EstimateOptions {
  includeLabor?: boolean;
  includeTransport?: boolean;
  contingencyPercent?: number;
}

export function generateBuildingBillOfQuantities(
  building: FarmBuilding,
  options: EstimateOptions = { includeLabor: true, includeTransport: true, contingencyPercent: 5 }
): {
  items: QuoteItem[];
  subtotalMaterialsFCFA: number;
  laborCostFCFA: number;
  transportCostFCFA: number;
  contingenciesCostFCFA: number;
  totalGeneralFCFA: number;
} {
  const items: QuoteItem[] = [];
  const prices = materialsStorage.getAll();

  const getPrice = (code: string, fallback: number) => {
    const found = prices.find((p) => p.code === code);
    return found ? found.defaultUnitPriceFCFA : fallback;
  };

  const perimeter = 2 * (building.lengthM + building.widthM);
  const floorArea = building.lengthM * building.widthM;

  // 1. Gros Œuvre & Maçonnerie
  // Fondations & Murets : hauteur moyenne muret 0.8m pour bâtiment d'élevage (ou 3.0m pour magasin)
  const wallHeight = building.buildingType === "magasin" || building.buildingType === "logement" ? 3.0 : 0.8;
  const wallArea = perimeter * wallHeight;
  // Parpaings 15cm : ~12.5 parpaings / m²
  const agglosCount = Math.ceil(wallArea * 12.5);
  items.push({
    id: `item_agg_${Date.now()}_1`,
    designation: `Parpaings / Agglos de 15 cm pour soubassement et murets (${wallArea.toFixed(1)} m²)`,
    category: "maconnerie",
    unit: "unité",
    quantity: agglosCount,
    unitPriceFCFA: getPrice("AGG_15_CREUX", 260),
    totalFCFA: agglosCount * getPrice("AGG_15_CREUX", 260),
  });

  // Ciment CPJ 35 (chape sol 8cm + mortier murets + enduits)
  // Béton dallage : floorArea * 0.08m = V m³ * 300kg/m³ = kg / 50 = sacs
  const concreteVolumeM3 = floorArea * 0.08;
  const cementSacksSlab = Math.ceil(concreteVolumeM3 * 6.5);
  const cementSacksWalls = Math.ceil(agglosCount / 35); // 1 sac pour ~35 agglos
  const totalCementSacks = cementSacksSlab + cementSacksWalls + 5; // marge
  items.push({
    id: `item_cim_${Date.now()}_2`,
    designation: `Ciment CPJ 35 pour dallage béton (${floorArea.toFixed(0)}m²), semelles et maçonnerie`,
    category: "maconnerie",
    unit: "sac",
    quantity: totalCementSacks,
    unitPriceFCFA: getPrice("CIM_CPJ35", 5800),
    totalFCFA: totalCementSacks * getPrice("CIM_CPJ35", 5800),
  });

  // Sable et Gravier (chargements 10m³)
  const sandTrucks = Math.max(1, Math.ceil(concreteVolumeM3 / 8.0));
  items.push({
    id: `item_sable_${Date.now()}_3`,
    designation: "Sable propre de fleuve pour béton et mortiers de pose",
    category: "maconnerie",
    unit: "camion 10m³",
    quantity: sandTrucks,
    unitPriceFCFA: getPrice("SABLE_CAMION", 65000),
    totalFCFA: sandTrucks * getPrice("SABLE_CAMION", 65000),
  });

  const gravelTrucks = Math.max(1, Math.ceil(concreteVolumeM3 / 7.0));
  items.push({
    id: `item_gravier_${Date.now()}_4`,
    designation: "Gravier concassé 15/25 pour chape armée et plots de fondation",
    category: "maconnerie",
    unit: "camion 10m³",
    quantity: gravelTrucks,
    unitPriceFCFA: getPrice("GRAVIER_CAMION", 120000),
    totalFCFA: gravelTrucks * getPrice("GRAVIER_CAMION", 120000),
  });

  // Fer à béton (HA8 & HA6 pour chaînage bas et dallage)
  const rebarBars = Math.ceil(perimeter / 2.5) + Math.ceil(floorArea / 5);
  items.push({
    id: `item_fer_${Date.now()}_5`,
    designation: "Ferraillage HA 8mm pour semelles filantes, potelets et armature chape",
    category: "ferraillage",
    unit: "barre 12m",
    quantity: rebarBars,
    unitPriceFCFA: getPrice("FER_HA8", 3200),
    totalFCFA: rebarBars * getPrice("FER_HA8", 3200),
  });

  // 2. Charpente Métallique & Couverture Tôles Aluzinc
  // Surface toiture avec débords 1.2m : (L + 2.4) * (W + 2.4)
  const roofArea = (building.lengthM + 2.4) * (building.widthM + 2.4);
  // Tôles Bac 6m : largeur utile ~0.90m -> ~5.4 m² par feuille
  const roofSheetsCount = Math.ceil(roofArea / 5.0);
  items.push({
    id: `item_tole_${Date.now()}_6`,
    designation: `Tôles Bac Aluzinc 0.35mm pare-soleil avec débords thermiques (${roofArea.toFixed(0)}m²)`,
    category: "charpente_couverture",
    unit: "feuille 6m",
    quantity: roofSheetsCount,
    unitPriceFCFA: getPrice("TOLE_BAC_035", 14500),
    totalFCFA: roofSheetsCount * getPrice("TOLE_BAC_035", 14500),
  });

  // Pannes tubes carrés 40x40 et fermes 60x40
  const raftersTubesCount = Math.ceil(building.lengthM / 3.0) * 4;
  items.push({
    id: `item_tube_${Date.now()}_7`,
    designation: "Tubes rectangulaires acier 60x40mm & carrés 40x40mm pour fermes et pannes",
    category: "charpente_couverture",
    unit: "barre 6m",
    quantity: raftersTubesCount,
    unitPriceFCFA: getPrice("TUBE_RECT_6040", 11800),
    totalFCFA: raftersTubesCount * getPrice("TUBE_RECT_6040", 11800),
  });

  // Grillage anti-moineaux si poulailler / étable / bergerie
  if (
    building.buildingType === "poulailler" ||
    building.buildingType === "etable" ||
    building.buildingType === "bergerie"
  ) {
    const meshRolls = Math.max(1, Math.ceil(perimeter / 22));
    items.push({
      id: `item_grillage_${Date.now()}_8`,
      designation: "Grillage galvanisé petite maille 19mm aération anti-passereaux et prédateurs",
      category: "equipement_elevage",
      unit: "rouleau 25m",
      quantity: meshRolls,
      unitPriceFCFA: getPrice("GRILLAGE_AVICOLE", 28000),
      totalFCFA: meshRolls * getPrice("GRILLAGE_AVICOLE", 28000),
    });
  }

  // Sous-total Matériaux
  const subtotalMaterialsFCFA = items.reduce((sum, item) => sum + item.totalFCFA, 0);

  // Main d'œuvre estimée (environ 25% du coût des matériaux pour la construction)
  const laborDaysMacon = Math.max(5, Math.ceil(floorArea / 12));
  const laborCostFCFA = options.includeLabor ? laborDaysMacon * 7000 * 3 : 0; // équipe maçons + manœuvres

  // Transport
  const transportCostFCFA = options.includeTransport ? getPrice("TRANSPORT_MATERIAUX", 45000) * 2 : 0;

  // Imprévus (5%)
  const rawSum = subtotalMaterialsFCFA + laborCostFCFA + transportCostFCFA;
  const pct = options.contingencyPercent ?? 5;
  const contingenciesCostFCFA = Math.round((rawSum * pct) / 100);

  const totalGeneralFCFA = rawSum + contingenciesCostFCFA;

  return {
    items,
    subtotalMaterialsFCFA,
    laborCostFCFA,
    transportCostFCFA,
    contingenciesCostFCFA,
    totalGeneralFCFA,
  };
}

export function generateIrrigationBillOfQuantities(
  project: IrrigationProject,
  options: EstimateOptions = { includeLabor: true, includeTransport: true, contingencyPercent: 5 }
): {
  items: QuoteItem[];
  subtotalMaterialsFCFA: number;
  laborCostFCFA: number;
  transportCostFCFA: number;
  contingenciesCostFCFA: number;
  totalGeneralFCFA: number;
} {
  const items: QuoteItem[] = [];
  const prices = materialsStorage.getAll();

  const getPrice = (code: string, fallback: number) => {
    const found = prices.find((p) => p.code === code);
    return found ? found.defaultUnitPriceFCFA : fallback;
  };

  // 1. Tuyau Conduite Principale PEHD Ø50 ou Ø63
  const mainCoils = Math.max(1, Math.ceil(project.mainPipeLengthM / 100));
  const mainCode = project.mainPipeDiameterMm >= 63 ? "TUYAU_PEHD_63" : "TUYAU_PEHD_50";
  items.push({
    id: `item_pehd_${Date.now()}_1`,
    designation: `Tuyau PEHD PN10 Ø${project.mainPipeDiameterMm}mm pour refoulement et conduite principale (${project.mainPipeLengthM}m)`,
    category: "plomberie_irrigation",
    unit: "couronne 100m",
    quantity: mainCoils,
    unitPriceFCFA: getPrice(mainCode, 78000),
    totalFCFA: mainCoils * getPrice(mainCode, 78000),
  });

  // 2. Gaine Goutte-à-Goutte ou Rampes
  if (project.systemType === "goutte_a_goutte") {
    const coils1000m = Math.max(1, Math.ceil(project.lateralLengthM / 1000));
    items.push({
      id: `item_gaine_${Date.now()}_2`,
      designation: `Gaine goutte-à-goutte Ø16mm goutteurs intégrés turbulents (${project.lateralLengthM}m)`,
      category: "plomberie_irrigation",
      unit: "bobine 1000m",
      quantity: coils1000m,
      unitPriceFCFA: getPrice("GAINE_GOUTTE_16", 85000),
      totalFCFA: coils1000m * getPrice("GAINE_GOUTTE_16", 85000),
    });
  }

  // 3. Système de filtration & Fertigation
  items.push({
    id: `item_filtre_${Date.now()}_3`,
    designation: "Tête de filtration à disques 2 pouces 120 mesh anti-colmatage",
    category: "plomberie_irrigation",
    unit: "unité",
    quantity: 1,
    unitPriceFCFA: getPrice("FILTRE_DISQUE_2", 45000),
    totalFCFA: getPrice("FILTRE_DISQUE_2", 45000),
  });

  items.push({
    id: `item_venturi_${Date.now()}_4`,
    designation: "Kit injecteur d'engrais soluble Venturi avec vanne de régulation",
    category: "plomberie_irrigation",
    unit: "kit",
    quantity: 1,
    unitPriceFCFA: getPrice("KIT_VENTURI_FERTI", 35000),
    totalFCFA: getPrice("KIT_VENTURI_FERTI", 35000),
  });

  // 4. Vannes de sectorisation
  const valvsCount = Math.max(2, project.numSectors + 1);
  items.push({
    id: `item_vannes_${Date.now()}_5`,
    designation: `Vannes d'arrêt sphériques PVC Ø${project.mainPipeDiameterMm}mm pour sectorisation`,
    category: "plomberie_irrigation",
    unit: "unité",
    quantity: valvsCount,
    unitPriceFCFA: getPrice("VANNE_SPHERIQUE_2", 9500),
    totalFCFA: valvsCount * getPrice("VANNE_SPHERIQUE_2", 9500),
  });

  // 5. Pompage solaire si choisi
  if (project.pumpType.includes("solaire")) {
    items.push({
      id: `item_pompe_${Date.now()}_6`,
      designation: `Système de pompage solaire immergé ${project.pumpPowerKw} kW avec contrôleur MPPT et champ photovoltaïque`,
      category: "plomberie_irrigation",
      unit: "kit complet",
      quantity: 1,
      unitPriceFCFA: getPrice("POMPE_SOLAIRE_3HP", 1850000),
      totalFCFA: getPrice("POMPE_SOLAIRE_3HP", 1850000),
    });
  }

  const subtotalMaterialsFCFA = items.reduce((sum, item) => sum + item.totalFCFA, 0);

  // Main d'oeuvre raccordement
  const laborCostFCFA = options.includeLabor ? getPrice("MO_INSTALL_IRRIG", 150000) : 0;
  const transportCostFCFA = options.includeTransport ? getPrice("TRANSPORT_MATERIAUX", 45000) : 0;

  const rawSum = subtotalMaterialsFCFA + laborCostFCFA + transportCostFCFA;
  const pct = options.contingencyPercent ?? 5;
  const contingenciesCostFCFA = Math.round((rawSum * pct) / 100);

  const totalGeneralFCFA = rawSum + contingenciesCostFCFA;

  return {
    items,
    subtotalMaterialsFCFA,
    laborCostFCFA,
    transportCostFCFA,
    contingenciesCostFCFA,
    totalGeneralFCFA,
  };
}
