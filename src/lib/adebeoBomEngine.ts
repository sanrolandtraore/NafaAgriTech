/**
 * NAFA STUDIO 3D x ADEBEO / SKETCHUP
 * Moteur de Calepinage, Métrés et Quantitatifs Précis (BOM - Bill of Materials)
 * 
 * Normes de construction sahéliennes et règles de l'art (INERA / CILSS / DTU Ouest-Africains) :
 * - Bâtiments avicoles bioclimatiques : muret 0.8m, ventilation traversante, lanterneau, débord toiture 1.2m
 * - Serres bioclimatiques / ombrières : arceaux galvanisés, filet d'ombrage 50%, film thermique 200µ
 * - Hangars et magasins de stockage : dalles renforcées, charpente métallique IPN/HEA ou tubes carrés
 * - Forages, châteaux d'eau & stations solaires : tours métalliques, cuves PEHD, panneaux photovoltaïques
 * - Canalisations & VRD : PEHD PN10, tranchées avec lit de sable, regards et vannes
 * - Clôtures : grillage maillon losange, piquets cornières, jambes de force, fil barbelé
 */

import { FarmElement3D } from "@/components/field-designer/Studio3DFarmModeler";

export interface BomMaterialLine {
  id: string;
  lot: "01_GROS_OEUVRE" | "02_CHARPENTE_TOITURE" | "03_SECOND_OEUVRE" | "04_HYDRAULIQUE_SOLAIRE" | "05_VRD_CLOTURE" | "06_AGRONOMIE";
  lotLabel: string;
  designation: string;
  specification: string;
  unit: "unité" | "sac 50kg" | "m²" | "m³" | "ml" | "kg" | "rouleau" | "forfait";
  quantity: number;
  unitPriceFcfa: number;
  totalPriceFcfa: number;
  elementSource?: string;
}

export interface AdebeoBomTakeOff {
  projectName: string;
  generatedAt: string;
  metrics: {
    totalBuiltAreaM2: number;
    totalFencingLinearM: number;
    totalPipingLinearM: number;
    totalSolarPowerWp: number;
    totalWaterStorageLiters: number;
    totalCinderBlocks: number;
    totalCementBags50kg: number;
    totalRoofingSheetsCount: number;
  };
  lines: BomMaterialLine[];
  lotsSummary: Array<{
    lot: string;
    label: string;
    totalFcfa: number;
    percentage: number;
  }>;
  grandTotalFcfa: number;
}

/**
 * Calcule le métré et quantitatif détaillé (BOM) pour une liste d'éléments 3D
 */
export function calculateAdebeoBom(elements: FarmElement3D[], projectName: string = "Projet Agricole"): AdebeoBomTakeOff {
  const lines: BomMaterialLine[] = [];

  let totalBuiltAreaM2 = 0;
  let totalFencingLinearM = 0;
  let totalPipingLinearM = 0;
  let totalSolarPowerWp = 0;
  let totalWaterStorageLiters = 0;
  let totalCinderBlocks = 0;
  let totalCementBags50kg = 0;
  let totalRoofingSheetsCount = 0;

  elements.forEach((el, index) => {
    const areaM2 = Math.round(el.width * el.length * 10) / 10;
    const perimeterM = Math.round(2 * (el.width + el.length) * 10) / 10;
    const lowerType = `${el.type || ""} ${el.name || ""}`.toLowerCase();

    // ── 1. BÂTIMENTS AVICOLES & ÉLEVAGE BIOCLIMATIQUE ──
    if (
      el.category === "building" &&
      (lowerType.includes("avic") ||
        lowerType.includes("poulailler") ||
        lowerType.includes("elevage") ||
        lowerType.includes("bergerie") ||
        lowerType.includes("poultry") ||
        lowerType.includes("volaill"))
    ) {
      totalBuiltAreaM2 += areaM2;

      // A. Muret de soubassement (H = 0.80 m)
      const muretWallAreaM2 = perimeterM * 0.8;
      const blocksCount = Math.ceil(muretWallAreaM2 * 12.5); // 12.5 parpaings/m² en 15x20x40
      totalCinderBlocks += blocksCount;
      lines.push({
        id: `bom-${index}-blocks`,
        lot: "01_GROS_OEUVRE",
        lotLabel: "Lot 01 — Gros-Œuvre & Maçonnerie",
        designation: "Parpaings creux 15×20×40",
        specification: `Muret de soubassement ventilé H: 0.80m (${el.name})`,
        unit: "unité",
        quantity: blocksCount,
        unitPriceFcfa: 450,
        totalPriceFcfa: blocksCount * 450,
        elementSource: el.name,
      });

      // B. Dalle béton armé hydrofuge ép. 10cm
      const dalleConcreteVolM3 = Math.round(areaM2 * 0.1 * 10) / 10;
      const cementBags = Math.ceil(dalleConcreteVolM3 * 7) + Math.ceil(blocksCount / 50); // 350kg/m3 pour béton + mortier
      totalCementBags50kg += cementBags;
      lines.push({
        id: `bom-${index}-cement`,
        lot: "01_GROS_OEUVRE",
        lotLabel: "Lot 01 — Gros-Œuvre & Maçonnerie",
        designation: "Ciment Portland CPJ 35 (Sacs 50kg)",
        specification: `Dalle béton hydrofuge 10cm + mortier muret (${dalleConcreteVolM3} m³ béton)`,
        unit: "sac 50kg",
        quantity: cementBags,
        unitPriceFcfa: 5500,
        totalPriceFcfa: cementBags * 5500,
        elementSource: el.name,
      });

      // Sable et gravier concassé
      const sandM3 = Math.round(dalleConcreteVolM3 * 0.5 * 10) / 10;
      lines.push({
        id: `bom-${index}-sand`,
        lot: "01_GROS_OEUVRE",
        lotLabel: "Lot 01 — Gros-Œuvre & Maçonnerie",
        designation: "Sable fluvial et gravier concassé 5/15",
        specification: "Agrégats pour béton de dallage et mortier de pose",
        unit: "m³",
        quantity: sandM3,
        unitPriceFcfa: 18000,
        totalPriceFcfa: Math.round(sandM3 * 18000),
        elementSource: el.name,
      });

      // C. Charpente métallique & Toiture
      // Débord toiture de 1.20m de chaque côté pour ombrage bioclimatique sahélien
      const roofLength = el.length + 2.4;
      const roofWidth = el.width + 2.4;
      const roofAreaM2 = Math.round(roofLength * roofWidth * 1.05); // +5% pente
      const tolesCount = Math.ceil(roofAreaM2 / (0.85 * 2.5)); // Tôle utile 0.85m x 2.50m
      totalRoofingSheetsCount += tolesCount;

      lines.push({
        id: `bom-${index}-toles`,
        lot: "02_CHARPENTE_TOITURE",
        lotLabel: "Lot 02 — Charpente & Couverture",
        designation: "Tôles bac alu 6/10ème laquées",
        specification: `Couverture à double pente avec débords d'ombrage 1.2m (${roofAreaM2} m²)`,
        unit: "unité",
        quantity: tolesCount,
        unitPriceFcfa: 12500,
        totalPriceFcfa: tolesCount * 12500,
        elementSource: el.name,
      });

      const fermesCount = Math.ceil(el.length / 3) + 1; // 1 ferme tous les 3 mètres
      lines.push({
        id: `bom-${index}-fermes`,
        lot: "02_CHARPENTE_TOITURE",
        lotLabel: "Lot 02 — Charpente & Couverture",
        designation: "Fermes métalliques en tubes carrés 60×60×2 & pannes",
        specification: `${fermesCount} fermes triangulées avec lanterneau d'aération haute faîtière`,
        unit: "unité",
        quantity: fermesCount,
        unitPriceFcfa: 75000,
        totalPriceFcfa: fermesCount * 75000,
        elementSource: el.name,
      });

      // D. Grillage anti-moineaux & rideaux
      const openingAreaM2 = perimeterM * (el.height - 0.8);
      lines.push({
        id: `bom-${index}-grillage`,
        lot: "03_SECOND_OEUVRE",
        lotLabel: "Lot 03 — Second-Œuvre & Équipements",
        designation: "Grillage triple torsion galvanisé anti-moineaux & prédateurs",
        specification: `Protection des ouvertures ventilées (${Math.round(openingAreaM2)} m²)`,
        unit: "m²",
        quantity: Math.round(openingAreaM2),
        unitPriceFcfa: 2200,
        totalPriceFcfa: Math.round(openingAreaM2 * 2200),
        elementSource: el.name,
      });
    }

    // ── 2. SERRES BIOCLIMATIQUES & OMBRIÈRES ──
    else if (el.category === "building" && (lowerType.includes("serre") || lowerType.includes("ombriere") || lowerType.includes("greenhouse"))) {
      totalBuiltAreaM2 += areaM2;
      const arceauxCount = Math.ceil(el.length / 1.5) + 1;

      lines.push({
        id: `bom-${index}-arceaux`,
        lot: "02_CHARPENTE_TOITURE",
        lotLabel: "Lot 02 — Charpente & Couverture",
        designation: "Arceaux métalliques galvanisés Ø 32 mm",
        specification: `Ossature arceau plein cintre entraxe 1.5m (${el.name})`,
        unit: "unité",
        quantity: arceauxCount,
        unitPriceFcfa: 18500,
        totalPriceFcfa: arceauxCount * 18500,
        elementSource: el.name,
      });

      lines.push({
        id: `bom-${index}-filet`,
        lot: "02_CHARPENTE_TOITURE",
        lotLabel: "Lot 02 — Charpente & Couverture",
        designation: "Filet d'ombrage 50% anti-UV & thermique",
        specification: `Régulation thermique bioclimatique maraîchère (${areaM2 * 1.4} m²)`,
        unit: "m²",
        quantity: Math.round(areaM2 * 1.4),
        unitPriceFcfa: 1500,
        totalPriceFcfa: Math.round(areaM2 * 1.4 * 1500),
        elementSource: el.name,
      });

      lines.push({
        id: `bom-${index}-brumisation`,
        lot: "04_HYDRAULIQUE_SOLAIRE",
        lotLabel: "Lot 04 — Hydraulique & Solaire",
        designation: "Ligne de brumisation / micro-aspersion suspendue",
        specification: `Tuyaux PEHD Ø 20mm avec nébuliseurs 4 voies (${Math.round(el.length)} ml)`,
        unit: "ml",
        quantity: Math.round(el.length),
        unitPriceFcfa: 3500,
        totalPriceFcfa: Math.round(el.length * 3500),
        elementSource: el.name,
      });
    }

    // ── 3. HANGARS & MAGASINS DE STOCKAGE ──
    else if (el.category === "building" && (lowerType.includes("hangar") || lowerType.includes("magasin") || lowerType.includes("stockage") || lowerType.includes("silo"))) {
      totalBuiltAreaM2 += areaM2;
      const poteauxCount = (Math.ceil(el.length / 4) + 1) * 2;
      const concreteM3 = Math.round(areaM2 * 0.15 * 10) / 10;
      const cementBags = Math.ceil(concreteM3 * 7.5);
      totalCementBags50kg += cementBags;

      lines.push({
        id: `bom-${index}-poteaux`,
        lot: "02_CHARPENTE_TOITURE",
        lotLabel: "Lot 02 — Charpente & Couverture",
        designation: "Poteaux métalliques profilés IPE 140 / HEA 120",
        specification: `Hauteur ${el.height}m sur platines ancrées au sol (${poteauxCount} poteaux)`,
        unit: "unité",
        quantity: poteauxCount,
        unitPriceFcfa: 48000,
        totalPriceFcfa: poteauxCount * 48000,
        elementSource: el.name,
      });

      lines.push({
        id: `bom-${index}-dalle-renforcee`,
        lot: "01_GROS_OEUVRE",
        lotLabel: "Lot 01 — Gros-Œuvre & Maçonnerie",
        designation: "Dalle béton armé 15cm pour charges lourdes & tracteurs",
        specification: `Ciment CPJ 42.5 + treillis soudé ST25C (${areaM2} m²)`,
        unit: "sac 50kg",
        quantity: cementBags,
        unitPriceFcfa: 5800,
        totalPriceFcfa: cementBags * 5800,
        elementSource: el.name,
      });

      const tolesCount = Math.ceil((areaM2 * 1.15) / 2.0);
      totalRoofingSheetsCount += tolesCount;
      lines.push({
        id: `bom-${index}-tole-hangar`,
        lot: "02_CHARPENTE_TOITURE",
        lotLabel: "Lot 02 — Charpente & Couverture",
        designation: "Tôles galvanisées prélaquées 7/10ème haute résistance",
        specification: `Couverture étanche avec faîtières crantées (${tolesCount} tôles)`,
        unit: "unité",
        quantity: tolesCount,
        unitPriceFcfa: 14500,
        totalPriceFcfa: tolesCount * 14500,
        elementSource: el.name,
      });
    }

    // ── 4. CHÂTEAU D'EAU, FORAGE & POMPAGE SOLAIRE ──
    else if (
      lowerType.includes("chateau") ||
      lowerType.includes("reservoir") ||
      lowerType.includes("forage") ||
      lowerType.includes("solaire") ||
      lowerType.includes("pompe") ||
      lowerType.includes("water") ||
      lowerType.includes("tower") ||
      lowerType.includes("solar") ||
      lowerType.includes("pump")
    ) {
      const capacityL = lowerType.includes("10") ? 10000 : 5000;
      totalWaterStorageLiters += capacityL;
      totalSolarPowerWp += 3600; // 8 panneaux de 450 Wc

      lines.push({
        id: `bom-${index}-tour`,
        lot: "04_HYDRAULIQUE_SOLAIRE",
        lotLabel: "Lot 04 — Hydraulique & Solaire",
        designation: "Tour métallique support cuve H: 6m à 9m",
        specification: `Structure cornières 60×6 contreventée avec socles béton armé (${el.name})`,
        unit: "unité",
        quantity: 1,
        unitPriceFcfa: 1650000,
        totalPriceFcfa: 1650000,
        elementSource: el.name,
      });

      lines.push({
        id: `bom-${index}-cuve`,
        lot: "04_HYDRAULIQUE_SOLAIRE",
        lotLabel: "Lot 04 — Hydraulique & Solaire",
        designation: `Cuve de stockage PEHD qualité alimentaire ${capacityL.toLocaleString("fr-FR")} L`,
        specification: "Multicouche anti-algues traitée anti-UV avec vanne de vidange et trop-plein",
        unit: "unité",
        quantity: 1,
        unitPriceFcfa: capacityL === 10000 ? 1150000 : 650000,
        totalPriceFcfa: capacityL === 10000 ? 1150000 : 650000,
        elementSource: el.name,
      });

      lines.push({
        id: `bom-${index}-panneaux`,
        lot: "04_HYDRAULIQUE_SOLAIRE",
        lotLabel: "Lot 04 — Hydraulique & Solaire",
        designation: "Générateur photovoltaïque 8 modules monocristallins 450 Wc",
        specification: "Puissance crête 3 600 Wc avec structure support inclinée 12° Sud",
        unit: "forfait",
        quantity: 1,
        unitPriceFcfa: 1200000,
        totalPriceFcfa: 1200000,
        elementSource: el.name,
      });
    }

    // ── 5. CLÔTURE DU PÉRIMÈTRE ──
    else if (lowerType.includes("cloture") || lowerType.includes("fence") || lowerType.includes("grillage")) {
      const ml = Math.round(el.linearMeters || (el.width + el.length));
      totalFencingLinearM += ml;
      const piquetsCount = Math.ceil(ml / 2.5);

      lines.push({
        id: `bom-${index}-grillage-cloture`,
        lot: "05_VRD_CLOTURE",
        lotLabel: "Lot 05 — Clôtures & Aménagements VRD",
        designation: "Grillage maillon losange galvanisé H: 1.80m",
        specification: `Clôture périmétrique anti-intrusion et divagation du bétail (${ml} ml)`,
        unit: "ml",
        quantity: ml,
        unitPriceFcfa: 3800,
        totalPriceFcfa: ml * 3800,
        elementSource: el.name,
      });

      lines.push({
        id: `bom-${index}-piquets`,
        lot: "05_VRD_CLOTURE",
        lotLabel: "Lot 05 — Clôtures & Aménagements VRD",
        designation: "Piquets métalliques en cornière 40×4 avec jambes de force",
        specification: `Scellés dans des plots béton tous les 2.50m (${piquetsCount} piquets)`,
        unit: "unité",
        quantity: piquetsCount,
        unitPriceFcfa: 4200,
        totalPriceFcfa: piquetsCount * 4200,
        elementSource: el.name,
      });
    }

    // ── 6. CANALISATIONS & RÉSEAUX HYDRAULIQUES ──
    else if (
      el.category === "irrigation" ||
      lowerType.includes("canalisation") ||
      lowerType.includes("tuyau") ||
      lowerType.includes("pehd") ||
      lowerType.includes("pipe") ||
      lowerType.includes("drip") ||
      el.linearMeters
    ) {
      const ml = Math.round(el.linearMeters || Math.max(el.length, el.width));
      totalPipingLinearM += ml;

      lines.push({
        id: `bom-${index}-pehd`,
        lot: "04_HYDRAULIQUE_SOLAIRE",
        lotLabel: "Lot 04 — Hydraulique & Solaire",
        designation: "Tuyau PEHD PN10 Ø 50mm ou Ø 63mm",
        specification: `Conduite maîtresse enterrée à 60cm sur lit de sable (${ml} ml)`,
        unit: "ml",
        quantity: ml,
        unitPriceFcfa: 1850,
        totalPriceFcfa: ml * 1850,
        elementSource: el.name,
      });

      const vannesCount = Math.max(1, Math.ceil(ml / 50));
      lines.push({
        id: `bom-${index}-vannes`,
        lot: "04_HYDRAULIQUE_SOLAIRE",
        lotLabel: "Lot 04 — Hydraulique & Solaire",
        designation: "Vannes d'arrêt à passage intégral & regards béton",
        specification: `Sectionnement hydraulique (${vannesCount} regards avec vannes laiton)`,
        unit: "unité",
        quantity: vannesCount,
        unitPriceFcfa: 25000,
        totalPriceFcfa: vannesCount * 25000,
        elementSource: el.name,
      });
    }

    // ── 7. VÉGÉTAUX, ARBRES & CULTURES ──
    else if (el.category === "crop" || lowerType.includes("arbre") || lowerType.includes("fruitier") || lowerType.includes("manguier") || lowerType.includes("haie")) {
      const plantsCount = Math.max(1, Math.round(areaM2 / 20) || 5);

      lines.push({
        id: `bom-${index}-plants`,
        lot: "06_AGRONOMIE",
        lotLabel: "Lot 06 — Végétaux & Plantation Agroforestière",
        designation: `Plants sélectionnés certifiés INERA (${el.name})`,
        specification: `Jeunes plants greffés vigoureux avec tuteurs et protection (${plantsCount} unités)`,
        unit: "unité",
        quantity: plantsCount,
        unitPriceFcfa: 2500,
        totalPriceFcfa: plantsCount * 2500,
        elementSource: el.name,
      });

      lines.push({
        id: `bom-${index}-compost`,
        lot: "06_AGRONOMIE",
        lotLabel: "Lot 06 — Végétaux & Plantation Agroforestière",
        designation: "Compost organique mûr & amendement minéral",
        specification: `Fumure de fond pour fosses de plantation 60×60×60cm (${plantsCount} fosses)`,
        unit: "sac 50kg",
        quantity: plantsCount * 2,
        unitPriceFcfa: 3000,
        totalPriceFcfa: plantsCount * 2 * 3000,
        elementSource: el.name,
      });
    }

    // ── 8. INFRASTRUCTURE GÉNÉRIQUE / PAR DÉFAUT ──
    else {
      lines.push({
        id: `bom-${index}-equipement`,
        lot: "03_SECOND_OEUVRE",
        lotLabel: "Lot 03 — Second-Œuvre & Équipements",
        designation: el.name,
        specification: `Fourniture et pose conforme au plan 3D (${el.width}m × ${el.length}m × ${el.height}m)`,
        unit: "forfait",
        quantity: 1,
        unitPriceFcfa: el.costFcfa || 150000,
        totalPriceFcfa: el.costFcfa || 150000,
        elementSource: el.name,
      });
    }
  });

  // Calcul du total et des pourcentages par Lot
  const grandTotalFcfa = lines.reduce((acc, l) => acc + l.totalPriceFcfa, 0);

  const lotsMap = new Map<string, { label: string; total: number }>();
  lines.forEach((l) => {
    const existing = lotsMap.get(l.lot) || { label: l.lotLabel, total: 0 };
    existing.total += l.totalPriceFcfa;
    lotsMap.set(l.lot, existing);
  });

  const lotsSummary = Array.from(lotsMap.entries()).map(([lot, info]) => ({
    lot,
    label: info.label,
    totalFcfa: info.total,
    percentage: grandTotalFcfa > 0 ? Math.round((info.total / grandTotalFcfa) * 100) : 0,
  }));

  return {
    projectName,
    generatedAt: new Date().toISOString(),
    metrics: {
      totalBuiltAreaM2,
      totalFencingLinearM,
      totalPipingLinearM,
      totalSolarPowerWp,
      totalWaterStorageLiters,
      totalCinderBlocks,
      totalCementBags50kg,
      totalRoofingSheetsCount,
    },
    lines,
    lotsSummary,
    grandTotalFcfa,
  };
}
