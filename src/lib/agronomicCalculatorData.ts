/**
 * Base de Données Agronomique pour Calculateur de Campagne (Inspiré de Fincabout & INERA/Sahel)
 * Données réelles calibrées pour l'Afrique de l'Ouest et les normes sahéliennes.
 */

export interface PhytoTreatment {
  stage: string; // Ex: "Semis / Levée (0-15j)"
  type: "herbicide" | "insecticide" | "fongicide" | "bio" | "nematicide";
  productName: string;
  activeIngredient: string;
  targetPests: string; // Ravageurs ou maladies ciblés
  doseCommercialeHa: number; // En L/ha ou kg/ha
  unit: "L/ha" | "kg/ha";
  volumeBouillieHa: number; // Volume d'eau recommandé en L/ha (ex: 200 L)
  pricePerUnitFcfa: number; // Prix moyen d'un litre ou kg au Burkina Faso
  darDays: number; // Délai avant récolte
}

export interface CropAgroSpec {
  id: string;
  name: string;
  scientificName: string;
  category: "cereale" | "legumineuse" | "maraichage" | "rente" | "fruitier";
  iconType: string;
  cycleDays: number; // Durée du cycle
  rowSpacingCm: number; // Écartement entre lignes
  plantSpacingCm: number; // Écartement sur la ligne
  seedsPerHole: number; // Nombre de graines par poquet
  pmgGram: number; // Poids de Mille Grains en grammes
  germinationRate: number; // Taux de germination moyen (0-1)
  seedRateKgHa: number; // Dose de semence standard recommandée en kg/ha
  seedPricePerKgFcfa: number; // Prix moyen des semences certifiées
  expectedYieldKgHa: number; // Rendement potentiel en kg/ha
  marketPriceKgFcfa: number; // Prix moyen de vente au kg en FCFA
  fertilizerNeeds: {
    manureTonHa: number;
    npkKgHa: number;
    ureaKgHa: number;
    npkFormula: string;
  };
  waterEtcDailyMm: number; // Besoin en eau moyen mm/jour
  phytoProgram: PhytoTreatment[];
}

export const CROPS_AGRO_DATABASE: CropAgroSpec[] = [
  {
    id: "mais",
    name: "Maïs (Hybride & Variétés améliorées)",
    scientificName: "Zea mays",
    category: "cereale",
    iconType: "crops",
    cycleDays: 95,
    rowSpacingCm: 80,
    plantSpacingCm: 40,
    seedsPerHole: 2,
    pmgGram: 280,
    germinationRate: 0.9,
    seedRateKgHa: 20,
    seedPricePerKgFcfa: 1250,
    expectedYieldKgHa: 4500,
    marketPriceKgFcfa: 220,
    fertilizerNeeds: {
      manureTonHa: 5,
      npkKgHa: 200,
      ureaKgHa: 100,
      npkFormula: "NPK 14-23-14",
    },
    waterEtcDailyMm: 5.5,
    phytoProgram: [
      {
        stage: "Semis (0-3j)",
        type: "herbicide",
        productName: "Atrazine 500 SC / Calliherb",
        activeIngredient: "Atrazine 500g/L",
        targetPests: "Graminées & adventices pré-levée",
        doseCommercialeHa: 3.0,
        unit: "L/ha",
        volumeBouillieHa: 250,
        pricePerUnitFcfa: 5500,
        darDays: 60,
      },
      {
        stage: "Végétatif (20-35j)",
        type: "insecticide",
        productName: "Emamectine 50 WG / Voliam Targo",
        activeIngredient: "Emamectine benzoate 50g/kg",
        targetPests: "Chenille légionnaire d'automne (Spodoptera frugiperda)",
        doseCommercialeHa: 0.25,
        unit: "kg/ha",
        volumeBouillieHa: 200,
        pricePerUnitFcfa: 18000,
        darDays: 14,
      },
      {
        stage: "Floraison / Épiaison",
        type: "fongicide",
        productName: "Mancozèbe 80 WP",
        activeIngredient: "Mancozèbe 800g/kg",
        targetPests: "Helminthosporiose & Rouille du maïs",
        doseCommercialeHa: 2.0,
        unit: "kg/ha",
        volumeBouillieHa: 200,
        pricePerUnitFcfa: 4500,
        darDays: 21,
      },
      {
        stage: "Alternative Bio",
        type: "bio",
        productName: "Extrait de Neem Sahélien (Azadirachtine)",
        activeIngredient: "Azadirachtine 1% Bio",
        targetPests: "Foreurs de tiges et pucerons",
        doseCommercialeHa: 2.5,
        unit: "L/ha",
        volumeBouillieHa: 200,
        pricePerUnitFcfa: 3500,
        darDays: 3,
      },
    ],
  },
  {
    id: "tomate",
    name: "Tomate de pleine terre & maraîchage",
    scientificName: "Solanum lycopersicum",
    category: "maraichage",
    iconType: "crops",
    cycleDays: 85,
    rowSpacingCm: 80,
    plantSpacingCm: 50,
    seedsPerHole: 1,
    pmgGram: 3.2,
    germinationRate: 0.85,
    seedRateKgHa: 0.25, // 250g pour repiquage
    seedPricePerKgFcfa: 95000, // Variétés hybrides type Mongal F1
    expectedYieldKgHa: 28000,
    marketPriceKgFcfa: 350,
    fertilizerNeeds: {
      manureTonHa: 15,
      npkKgHa: 300,
      ureaKgHa: 150,
      npkFormula: "NPK 15-15-15",
    },
    waterEtcDailyMm: 6.2,
    phytoProgram: [
      {
        stage: "Pépinière & Repiquage (+10j)",
        type: "nematicide",
        productName: "Oxamyl 10G / Nemacur",
        activeIngredient: "Oxamyl 10%",
        targetPests: "Nématodes à galles (Meloidogyne)",
        doseCommercialeHa: 1.5,
        unit: "kg/ha",
        volumeBouillieHa: 300,
        pricePerUnitFcfa: 8000,
        darDays: 45,
      },
      {
        stage: "Croissance & Ramification (+25j)",
        type: "insecticide",
        productName: "Acétamipride 20 SP",
        activeIngredient: "Acétamipride 200g/kg",
        targetPests: "Mouches blanches (Bemisia tabaci - TYLCV)",
        doseCommercialeHa: 0.3,
        unit: "kg/ha",
        volumeBouillieHa: 250,
        pricePerUnitFcfa: 12000,
        darDays: 7,
      },
      {
        stage: "Floraison & Fructification (+45j)",
        type: "fongicide",
        productName: "Chlorothalonil + Métalaxyl-M",
        activeIngredient: "Chlorothalonil + Métalaxyl",
        targetPests: "Mildiou (Phytophthora) & Alternariose",
        doseCommercialeHa: 2.0,
        unit: "L/ha",
        volumeBouillieHa: 300,
        pricePerUnitFcfa: 7500,
        darDays: 7,
      },
      {
        stage: "Grossissement des fruits (+60j)",
        type: "insecticide",
        productName: "Indoxacarbe 150 SC",
        activeIngredient: "Indoxacarbe 150g/L",
        targetPests: "Noctuelle de la tomate (Helicoverpa armigera) & Tuta absoluta",
        doseCommercialeHa: 0.35,
        unit: "L/ha",
        volumeBouillieHa: 250,
        pricePerUnitFcfa: 16500,
        darDays: 3,
      },
      {
        stage: "Bio-Protection continue",
        type: "bio",
        productName: "Bacillus thuringiensis (Bt)",
        activeIngredient: "Bt kurstaki 32000 UI/mg",
        targetPests: "Chenilles mineuses et noctuelles",
        doseCommercialeHa: 1.0,
        unit: "kg/ha",
        volumeBouillieHa: 250,
        pricePerUnitFcfa: 9000,
        darDays: 1,
      },
    ],
  },
  {
    id: "oignon",
    name: "Oignon bulbe (Violet de Galmi)",
    scientificName: "Allium cepa",
    category: "maraichage",
    iconType: "crops",
    cycleDays: 120,
    rowSpacingCm: 20,
    plantSpacingCm: 15,
    seedsPerHole: 1,
    pmgGram: 4.0,
    germinationRate: 0.85,
    seedRateKgHa: 4.5,
    seedPricePerKgFcfa: 25000,
    expectedYieldKgHa: 35000,
    marketPriceKgFcfa: 400,
    fertilizerNeeds: {
      manureTonHa: 12,
      npkKgHa: 250,
      ureaKgHa: 120,
      npkFormula: "NPK 14-23-14",
    },
    waterEtcDailyMm: 4.8,
    phytoProgram: [
      {
        stage: "Post-repiquage (+20j)",
        type: "insecticide",
        productName: "Lambdacyhalothrine 50 EC",
        activeIngredient: "Lambda-cyhalothrine 50g/L",
        targetPests: "Thrips de l'oignon (Thrips tabaci)",
        doseCommercialeHa: 0.8,
        unit: "L/ha",
        volumeBouillieHa: 200,
        pricePerUnitFcfa: 5000,
        darDays: 14,
      },
      {
        stage: "Bulbaison (+50j)",
        type: "fongicide",
        productName: "Cuivre Oxychlorure 50 WP",
        activeIngredient: "Cuivre métal 500g/kg",
        targetPests: "Brûlure foliaire & Pourriture bactérienne",
        doseCommercialeHa: 2.5,
        unit: "kg/ha",
        volumeBouillieHa: 250,
        pricePerUnitFcfa: 4200,
        darDays: 10,
      },
    ],
  },
  {
    id: "niebe",
    name: "Niébé / Haricot (Variétés INERA)",
    scientificName: "Vigna unguiculata",
    category: "legumineuse",
    iconType: "crops",
    cycleDays: 70,
    rowSpacingCm: 75,
    plantSpacingCm: 30,
    seedsPerHole: 2,
    pmgGram: 180,
    germinationRate: 0.9,
    seedRateKgHa: 25,
    seedPricePerKgFcfa: 1500,
    expectedYieldKgHa: 1600,
    marketPriceKgFcfa: 550,
    fertilizerNeeds: {
      manureTonHa: 2,
      npkKgHa: 100,
      ureaKgHa: 0, // Fixation symbiotique d'azote
      npkFormula: "NPK 14-23-14",
    },
    waterEtcDailyMm: 4.0,
    phytoProgram: [
      {
        stage: "Boutons floraux (+35j)",
        type: "insecticide",
        productName: "Deltaméthrine + Triazophos",
        activeIngredient: "Deltaméthrine 12g/L + Triazophos",
        targetPests: "Thrips des fleurs (Megalurothrips sjostedti)",
        doseCommercialeHa: 1.0,
        unit: "L/ha",
        volumeBouillieHa: 200,
        pricePerUnitFcfa: 6500,
        darDays: 14,
      },
      {
        stage: "Gousses (+50j)",
        type: "insecticide",
        productName: "Acétamipride + Lambdacyhalothrine",
        activeIngredient: "Acétamipride 16g/L + Lambda",
        targetPests: "Punaise suceuse (Clavigralla) & Maruca vitrata",
        doseCommercialeHa: 1.0,
        unit: "L/ha",
        volumeBouillieHa: 200,
        pricePerUnitFcfa: 7000,
        darDays: 10,
      },
    ],
  },
  {
    id: "riz",
    name: "Riz irrigué / Bas-fonds",
    scientificName: "Oryza sativa",
    category: "cereale",
    iconType: "crops",
    cycleDays: 110,
    rowSpacingCm: 20,
    plantSpacingCm: 20,
    seedsPerHole: 2,
    pmgGram: 28,
    germinationRate: 0.9,
    seedRateKgHa: 45,
    seedPricePerKgFcfa: 800,
    expectedYieldKgHa: 6000,
    marketPriceKgFcfa: 250,
    fertilizerNeeds: {
      manureTonHa: 5,
      npkKgHa: 200,
      ureaKgHa: 150,
      npkFormula: "NPK 14-23-14",
    },
    waterEtcDailyMm: 7.5,
    phytoProgram: [
      {
        stage: "Post-levée (15-20j)",
        type: "herbicide",
        productName: "Propanil 360 + 2,4-D",
        activeIngredient: "Propanil 360g/L + 2,4-D",
        targetPests: "Adventices aquatiques & graminées du riz",
        doseCommercialeHa: 4.0,
        unit: "L/ha",
        volumeBouillieHa: 250,
        pricePerUnitFcfa: 5200,
        darDays: 45,
      },
      {
        stage: "Tallage & Montaison",
        type: "fongicide",
        productName: "Tricyclazole 75 WP",
        activeIngredient: "Tricyclazole 75%",
        targetPests: "Pyriculariose du riz (Pyricularia oryzae)",
        doseCommercialeHa: 0.4,
        unit: "kg/ha",
        volumeBouillieHa: 200,
        pricePerUnitFcfa: 9500,
        darDays: 28,
      },
    ],
  },
  {
    id: "coton",
    name: "Coton conventionnel & biologique",
    scientificName: "Gossypium hirsutum",
    category: "rente",
    iconType: "crops",
    cycleDays: 135,
    rowSpacingCm: 80,
    plantSpacingCm: 40,
    seedsPerHole: 3,
    pmgGram: 100,
    germinationRate: 0.85,
    seedRateKgHa: 15,
    seedPricePerKgFcfa: 600,
    expectedYieldKgHa: 1800,
    marketPriceKgFcfa: 325,
    fertilizerNeeds: {
      manureTonHa: 3,
      npkKgHa: 150,
      ureaKgHa: 50,
      npkFormula: "NPK 14-18-18 (Spécial Coton)",
    },
    waterEtcDailyMm: 5.0,
    phytoProgram: [
      {
        stage: "Fenêtre 1 (30-45j)",
        type: "insecticide",
        productName: "Bifenthrine + Triazophos",
        activeIngredient: "Bifenthrine 25g/L",
        targetPests: "Pucerons & Chenilles carpophages",
        doseCommercialeHa: 1.0,
        unit: "L/ha",
        volumeBouillieHa: 150,
        pricePerUnitFcfa: 6800,
        darDays: 30,
      },
    ],
  },
  {
    id: "arachide",
    name: "Arachide (Variétés SH 470 P & RMP 12)",
    scientificName: "Arachis hypogaea",
    category: "legumineuse",
    iconType: "peanut",
    cycleDays: 95,
    rowSpacingCm: 50,
    plantSpacingCm: 15,
    seedsPerHole: 1,
    pmgGram: 450,
    germinationRate: 0.85,
    seedRateKgHa: 60,
    seedPricePerKgFcfa: 1200,
    expectedYieldKgHa: 1800,
    marketPriceKgFcfa: 450,
    fertilizerNeeds: {
      manureTonHa: 3,
      npkKgHa: 100,
      ureaKgHa: 0,
      npkFormula: "NPK 14-23-14",
    },
    waterEtcDailyMm: 4.5,
    phytoProgram: [
      {
        stage: "Semis (protection semence)",
        type: "fongicide",
        productName: "Thirame + Carboxine",
        activeIngredient: "Thirame 200g/kg",
        targetPests: "Fonte des semis & pourriture collet",
        doseCommercialeHa: 0.2,
        unit: "kg/ha",
        volumeBouillieHa: 10,
        pricePerUnitFcfa: 4500,
        darDays: 60,
      },
      {
        stage: "Floraison / Gynophorisation (40-55j)",
        type: "fongicide",
        productName: "Chlorothalonil 500 SC",
        activeIngredient: "Chlorothalonil 500g/L",
        targetPests: "Cercosporiose précoce & rouille",
        doseCommercialeHa: 1.5,
        unit: "L/ha",
        volumeBouillieHa: 200,
        pricePerUnitFcfa: 6500,
        darDays: 25,
      },
    ],
  },
  {
    id: "sesame",
    name: "Sésame Blanc d'Exportation (S-42)",
    scientificName: "Sesamum indicum",
    category: "rente",
    iconType: "grain",
    cycleDays: 90,
    rowSpacingCm: 60,
    plantSpacingCm: 20,
    seedsPerHole: 3,
    pmgGram: 3.2,
    germinationRate: 0.8,
    seedRateKgHa: 5,
    seedPricePerKgFcfa: 2500,
    expectedYieldKgHa: 900,
    marketPriceKgFcfa: 650,
    fertilizerNeeds: {
      manureTonHa: 2,
      npkKgHa: 100,
      ureaKgHa: 50,
      npkFormula: "NPK 14-23-14",
    },
    waterEtcDailyMm: 3.8,
    phytoProgram: [
      {
        stage: "Levée / 4 Feuilles (15-25j)",
        type: "insecticide",
        productName: "Deltaméthrine 25 EC",
        activeIngredient: "Deltaméthrine 25g/L",
        targetPests: "Altises & pucerons du sésame",
        doseCommercialeHa: 0.5,
        unit: "L/ha",
        volumeBouillieHa: 150,
        pricePerUnitFcfa: 4500,
        darDays: 20,
      },
    ],
  },
  {
    id: "sorgho",
    name: "Sorgho Blanc Sahélien (Framida / Kapelga)",
    scientificName: "Sorghum bicolor",
    category: "cereale",
    iconType: "wheat",
    cycleDays: 110,
    rowSpacingCm: 80,
    plantSpacingCm: 30,
    seedsPerHole: 3,
    pmgGram: 28,
    germinationRate: 0.85,
    seedRateKgHa: 12,
    seedPricePerKgFcfa: 750,
    expectedYieldKgHa: 2200,
    marketPriceKgFcfa: 250,
    fertilizerNeeds: {
      manureTonHa: 4,
      npkKgHa: 100,
      ureaKgHa: 50,
      npkFormula: "NPK 14-23-14",
    },
    waterEtcDailyMm: 4.2,
    phytoProgram: [
      {
        stage: "Semis (traitement de semence)",
        type: "insecticide",
        productName: "Gaucho / Célest",
        activeIngredient: "Imidaclopride + Fludioxonil",
        targetPests: "Foreurs de tige précoce & charbon",
        doseCommercialeHa: 0.1,
        unit: "kg/ha",
        volumeBouillieHa: 5,
        pricePerUnitFcfa: 5000,
        darDays: 60,
      },
    ],
  },
  {
    id: "poivron",
    name: "Piment & Poivron (Yolo Wonder / Bec d'Oiseau)",
    scientificName: "Capsicum annuum / frutescens",
    category: "maraichage",
    iconType: "pepper",
    cycleDays: 120,
    rowSpacingCm: 70,
    plantSpacingCm: 40,
    seedsPerHole: 1,
    pmgGram: 6.0,
    germinationRate: 0.85,
    seedRateKgHa: 0.35,
    seedPricePerKgFcfa: 65000,
    expectedYieldKgHa: 18000,
    marketPriceKgFcfa: 400,
    fertilizerNeeds: {
      manureTonHa: 15,
      npkKgHa: 400,
      ureaKgHa: 150,
      npkFormula: "NPK 15-15-15",
    },
    waterEtcDailyMm: 6.0,
    phytoProgram: [
      {
        stage: "Reprise pépinière (10-15j)",
        type: "insecticide",
        productName: "Acétamipride 20 SP",
        activeIngredient: "Acétamipride 200g/kg",
        targetPests: "Thrips, aleurodes & mouches blanches",
        doseCommercialeHa: 0.25,
        unit: "kg/ha",
        volumeBouillieHa: 200,
        pricePerUnitFcfa: 4000,
        darDays: 14,
      },
      {
        stage: "Nouaison & Grossissement",
        type: "fongicide",
        productName: "Mancozèbe + Métalaxyl",
        activeIngredient: "Mancozèbe 64% + Métalaxyl 8%",
        targetPests: "Anthracnose & Mildiou",
        doseCommercialeHa: 2.0,
        unit: "kg/ha",
        volumeBouillieHa: 300,
        pricePerUnitFcfa: 7500,
        darDays: 7,
      },
    ],
  },
];

export interface AgroCalculationResults {
  areaHa: number;
  areaM2: number;
  // Semences
  plantDensity: number; // Nombre de plants total sur la parcelle
  seedsCount: number; // Nombre de graines nécessaires
  seedWeightKg: number; // Poids total en kg
  seedCostFcfa: number; // Coût estimé semences
  // Phyto
  phytoTreatments: Array<{
    treatment: PhytoTreatment;
    quantityTotal: number; // Litres ou kg pour la parcelle
    waterVolumeLiters: number; // Volume total d'eau
    sprayerCount16L: number; // Nombre de pulvérisateurs 16L
    dosePerSprayerMlOrG: number; // Dose par pulvérisateur
    costFcfa: number;
  }>;
  totalPhytoCostFcfa: number;
  totalSprayersCount: number;
  // Fertilisants
  manureTons: number;
  npkKg: number;
  npkBags50kg: number;
  ureaKg: number;
  ureaBags50kg: number;
  fertilizerCostFcfa: number;
  // Eau
  totalWaterM3: number;
  dailyWaterM3: number;
  // Rendement & Rentabilité
  expectedYieldKg: number;
  potentialRevenueFcfa: number;
  totalInputsCostFcfa: number;
  grossMarginFcfa: number;
}

export function computeComprehensiveAgro(
  crop: CropAgroSpec,
  areaHa: number,
  customSeedsPerHole?: number,
  customRowCm?: number,
  customPlantCm?: number
): AgroCalculationResults {
  const rowM = (customRowCm || crop.rowSpacingCm) / 100;
  const plantM = (customPlantCm || crop.plantSpacingCm) / 100;
  const seedsPerHole = customSeedsPerHole || crop.seedsPerHole;
  const areaM2 = areaHa * 10000;

  // Densité théorique de poquets
  const holesCount = Math.round(areaM2 / (rowM * plantM));
  // Total graines en tenant compte de la germination
  const totalSeeds = Math.round((holesCount * seedsPerHole) / crop.germinationRate);
  // Poids en kg = (graines * PMG en g) / 1000 / 1000
  const seedWeightKg = Number(((totalSeeds * crop.pmgGram) / 1_000_000).toFixed(2));
  const seedCostFcfa = Math.round(seedWeightKg * crop.seedPricePerKgFcfa);

  // Phyto
  const phytoTreatments = crop.phytoProgram.map((treatment) => {
    const quantityTotal = Number((treatment.doseCommercialeHa * areaHa).toFixed(2));
    const waterVolumeLiters = Math.round(treatment.volumeBouillieHa * areaHa);
    const sprayerCount16L = Math.max(1, Math.ceil(waterVolumeLiters / 16));
    // Dose par pulvérisateur = quantité totale / nombre de pulvérisateurs
    const dosePerSprayerMlOrG = Number(((quantityTotal * 1000) / sprayerCount16L).toFixed(1));
    const costFcfa = Math.round(quantityTotal * treatment.pricePerUnitFcfa);

    return {
      treatment,
      quantityTotal,
      waterVolumeLiters,
      sprayerCount16L,
      dosePerSprayerMlOrG,
      costFcfa,
    };
  });

  const totalPhytoCostFcfa = phytoTreatments.reduce((sum, t) => sum + t.costFcfa, 0);
  const totalSprayersCount = phytoTreatments.reduce((sum, t) => sum + t.sprayerCount16L, 0);

  // Fertilisants
  const manureTons = Number((crop.fertilizerNeeds.manureTonHa * areaHa).toFixed(1));
  const npkKg = Math.round(crop.fertilizerNeeds.npkKgHa * areaHa);
  const npkBags50kg = Math.ceil(npkKg / 50);
  const ureaKg = Math.round(crop.fertilizerNeeds.ureaKgHa * areaHa);
  const ureaBags50kg = Math.ceil(ureaKg / 50);
  // Prix moyen sac NPK ~ 22 500 FCFA, sac Urée ~ 24 000 FCFA au Burkina
  const fertilizerCostFcfa = npkBags50kg * 22500 + ureaBags50kg * 24000;

  // Eau
  const dailyWaterM3 = Number(((crop.waterEtcDailyMm * areaM2) / 1000).toFixed(1));
  const totalWaterM3 = Number(((crop.waterEtcDailyMm * crop.cycleDays * areaM2) / 1000).toFixed(1));

  // Rendement & Économie
  const expectedYieldKg = Math.round(crop.expectedYieldKgHa * areaHa);
  const potentialRevenueFcfa = Math.round(expectedYieldKg * crop.marketPriceKgFcfa);
  const totalInputsCostFcfa = seedCostFcfa + totalPhytoCostFcfa + fertilizerCostFcfa;
  const grossMarginFcfa = potentialRevenueFcfa - totalInputsCostFcfa;

  return {
    areaHa,
    areaM2,
    plantDensity: holesCount,
    seedsCount: totalSeeds,
    seedWeightKg,
    seedCostFcfa,
    phytoTreatments,
    totalPhytoCostFcfa,
    totalSprayersCount,
    manureTons,
    npkKg,
    npkBags50kg,
    ureaKg,
    ureaBags50kg,
    fertilizerCostFcfa,
    totalWaterM3,
    dailyWaterM3,
    expectedYieldKg,
    potentialRevenueFcfa,
    totalInputsCostFcfa,
    grossMarginFcfa,
  };
}
