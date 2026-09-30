/**
 * NAFA FIELD DESIGNER — AI AGRONOMY COPILOT ENGINE
 * Copilote agronomique de terrain strict :
 * - Exploite UNIQUEMENT les données réelles du projet
 * - Distingue explicitement :
 *   1. Données mesurées (GPS, surface, périmètre)
 *   2. Données saisies (cultures, nombres, variété)
 *   3. Calculs agronomiques (densité, débits, métrés)
 *   4. Hypothèses techniques (climat, pertes de charge)
 *   5. Recommandations certifiées (variétés INERA, fumure, rotations)
 * - Règle d'or : AI propose → AGRONOME valide → AGRONOME modifie → PLAN FINAL.
 */

import { Farm, Field, CropPlan, IrrigationProject, FarmBuilding } from "@/types/fieldDesigner";

export interface CopilotAnalysisInput {
  farm: Farm;
  fields: Field[];
  cropPlans: CropPlan[];
  irrigation?: IrrigationProject;
  buildings: FarmBuilding[];
}

export interface StructuredCopilotSection {
  title: string;
  category: "measured" | "input" | "calculated" | "hypothesis" | "recommendation";
  items: string[];
}

export interface CopilotOutput {
  summary: string;
  sections: StructuredCopilotSection[];
  spatialOptimizationTip: string;
  ineraReferenceNote: string;
}

export function runFieldAiCopilot(input: CopilotAnalysisInput): CopilotOutput {
  const { farm, fields, cropPlans, irrigation, buildings } = input;

  const totalFieldsAreaHa = fields.reduce((sum, f) => sum + f.areaHa, 0);
  const totalPerimeterM = fields.reduce((sum, f) => sum + f.perimeterM, 0);
  const totalBuildingsM2 = buildings.reduce((sum, b) => sum + b.areaM2, 0);

  // 1. Données mesurées réelles
  const measuredItems: string[] = [];
  if (farm.gps) {
    measuredItems.push(`Coordonnées GPS in-situ : ${farm.gps.lat.toFixed(5)}° N, ${farm.gps.lng.toFixed(5)}° W`);
  }
  if (fields.length > 0) {
    measuredItems.push(`${fields.length} parcelle(s) mesurée(s) au GPS : surface cumulée = ${totalFieldsAreaHa.toFixed(2)} ha (${(totalFieldsAreaHa * 10000).toLocaleString()} m²)`);
    measuredItems.push(`Périmètre cadastral total mesuré : ${totalPerimeterM.toLocaleString()} m linéaires`);
  } else {
    measuredItems.push("Aucune mesure GPS de parcelle enregistrée pour l'instant (à mesurer en direct sur le terrain).");
  }

  // 2. Données saisies
  const inputItems: string[] = [
    `Exploitation : « ${farm.name} » (${farm.farmType}) à ${farm.locality}, Région : ${farm.region || "Non renseignée"}`,
    `Producteur : ${farm.producerName} (${farm.producerPhone || "Téléphone non renseigné"})`,
  ];
  if (cropPlans.length > 0) {
    cropPlans.forEach((cp) => {
      inputItems.push(`Culture planifiée : ${cp.cropName} (Variété : ${cp.variety || "Standard"}) sur ${cp.areaHa} ha, interligne ${cp.rowSpacingCm}cm x ${cp.plantSpacingCm}cm`);
    });
  }
  if (buildings.length > 0) {
    buildings.forEach((b) => {
      inputItems.push(`Bâtiment saisi : ${b.name} (${b.buildingType}, ${b.lengthM}m x ${b.widthM}m = ${b.areaM2} m²)`);
    });
  }

  // 3. Calculs agronomiques
  const calculatedItems: string[] = [];
  cropPlans.forEach((cp) => {
    calculatedItems.push(`Densité de peuplement : ${cp.densityPlantsHa.toLocaleString()} plants/ha (Total estimé : ${cp.numPlants.toLocaleString()} plants sur ${cp.numRows} lignes)`);
    calculatedItems.push(`Besoins semences estimés : ${cp.seedQuantityKg} kg pour la parcelle`);
  });
  if (irrigation) {
    calculatedItems.push(`Débit instantané d'arrosage : ${irrigation.totalFlowRateM3h} m³/h réparti sur ${irrigation.numSectors} secteur(s)`);
    calculatedItems.push(`Hauteur d'eau journalière requise : ${irrigation.dailyIrrigationHours} h de pompage/secteur`);
  }
  if (buildings.length > 0) {
    calculatedItems.push(`Surface couverte totale des infrastructures : ${totalBuildingsM2} m²`);
  }

  // 4. Hypothèses techniques retenues
  const hypothesisItems: string[] = [
    "Évapotranspiration de référence sahélienne retenue : ETo = 6.0 mm/jour (Saison sèche active au Burkina Faso)",
    "Pertes de charge linéaires et singulières estimées à 15% dans le calcul de la HMT de refoulement",
    "Rendement moyen de l'électropompe solaire MPPT estimé à 60% en fil-du-soleil",
  ];

  // 5. Recommandations certifiées
  const recommendationItems: string[] = [];
  if (farm.region === "Boucle du Mouhoun" || farm.region === "Hauts-Bassins") {
    recommendationItems.push("Zone ouest à fort potentiel maraîcher : privilégier un apport organique initial de 15 t/ha de compost bien mûr pour alléger les limons et stabiliser la rétention hydrique.");
  } else {
    recommendationItems.push("Zone centrale/sahélienne : combiner zaï amélioré ou demi-lunes avec paillage au sol pour réduire l'évaporation directe de 30% sous fortes chaleurs.");
  }
  if (cropPlans.some((cp) => cp.cropId === "tomate")) {
    recommendationItems.push("Tomate : rotation stricte de 3 ans recommandée avec des poacées (maïs, sorgho) pour rompre le cycle du flétrissement bactérien (Ralstonia solanacearum).");
  }
  if (buildings.some((b) => b.buildingType === "poulailler")) {
    recommendationItems.push("Poulailler : orienter impérativement l'axe longitudinal Est-Ouest avec débord de toit minimal de 1.20 m pour éliminer le rayonnement solaire direct sur les murets.");
  }

  return {
    summary: `Analyse agronomique consolidée pour « ${farm.name} » basée sur ${fields.length} parcelle(s) et ${buildings.length} infrastructure(s).`,
    sections: [
      {
        title: "1. Données Mesurées (GPS & Cadastre Réel)",
        category: "measured",
        items: measuredItems,
      },
      {
        title: "2. Données Saisies par l'Agronome",
        category: "input",
        items: inputItems,
      },
      {
        title: "3. Calculs Techniques & Hydrauliques",
        category: "calculated",
        items: calculatedItems,
      },
      {
        title: "4. Hypothèses de Modélisation (À valider)",
        category: "hypothesis",
        items: hypothesisItems,
      },
      {
        title: "5. Recommandations Agronomiques & Prophylactiques",
        category: "recommendation",
        items: recommendationItems,
      },
    ],
    spatialOptimizationTip: "Organiser les parcelles à forte exigence hydrique (maraîchage) au plus près de la source d'eau (forage/bassin) pour minimiser les diamètres et pertes de charge de la conduite principale.",
    ineraReferenceNote: "Recommandations calibrées sur les référentiels de vulgarisation de l'INERA Farako-Bâ et les normes FAO-56.",
  };
}
