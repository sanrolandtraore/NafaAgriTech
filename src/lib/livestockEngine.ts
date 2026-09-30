/**
 * Moteur zootechnique pour NAFA - AGRITECH: Farm Forward
 * Spécifique aux filières d'élevage sahéliennes et d'Afrique de l'Ouest :
 * 1. Embouche bovine & ovine (engraissement)
 * 2. Aviculture (poules pondeuses & poulets de chair)
 * 3. Pisciculture (tilapia & silure / Clarias)
 */

export interface FatteningSimulationParams {
  species: 'bovin' | 'ovin' | 'caprin';
  headCount: number;
  durationDays: number;
  initialWeightKg: number;
  targetGmqGrams: number; // Gain Moyen Quotidien en grammes/jour (ex: 800g pour bovin, 150g pour ovin)
  purchasePricePerHead: number; // Prix d'achat unitaire en FCFA
  dailyFeedCostPerHead: number; // Coût journalier de la ration (tourteau, son, fanes) en FCFA
  healthCostPerHead?: number; // Frais vétérinaires (déparasitage, vitamines, vaccins) en FCFA
  sellingPricePerKgLive?: number; // Prix de vente au kg vif en FCFA (optionnel)
  sellingPricePerHead?: number; // Prix de vente forfaitaire par tête en FCFA
}

export interface FatteningSimulationResult {
  finalWeightKg: number;
  weightGainPerHeadKg: number;
  totalWeightGainKg: number;
  totalPurchaseCost: number;
  totalFeedCost: number;
  totalHealthCost: number;
  totalInvestment: number;
  estimatedSellingPricePerHead: number;
  totalRevenue: number;
  netMargin: number;
  marginPerHead: number;
  roiPercent: number;
  breakEvenPricePerHead: number;
}

/**
 * Calculateur de rentabilité pour l'embouche bovine et ovine
 */
export function calculateFatteningPlan(params: FatteningSimulationParams): FatteningSimulationResult {
  const {
    headCount,
    durationDays,
    initialWeightKg,
    targetGmqGrams,
    purchasePricePerHead,
    dailyFeedCostPerHead,
    healthCostPerHead = params.species === 'bovin' ? 5000 : 1500,
    sellingPricePerKgLive,
    sellingPricePerHead,
  } = params;

  if (headCount <= 0 || durationDays <= 0) {
    return {
      finalWeightKg: initialWeightKg,
      weightGainPerHeadKg: 0,
      totalWeightGainKg: 0,
      totalPurchaseCost: 0,
      totalFeedCost: 0,
      totalHealthCost: 0,
      totalInvestment: 0,
      estimatedSellingPricePerHead: 0,
      totalRevenue: 0,
      netMargin: 0,
      marginPerHead: 0,
      roiPercent: 0,
      breakEvenPricePerHead: 0,
    };
  }

  const weightGainPerHeadKg = Math.round((targetGmqGrams * durationDays) / 1000);
  const finalWeightKg = initialWeightKg + weightGainPerHeadKg;
  const totalWeightGainKg = weightGainPerHeadKg * headCount;

  const totalPurchaseCost = purchasePricePerHead * headCount;
  const totalFeedCost = dailyFeedCostPerHead * durationDays * headCount;
  const totalHealthCost = healthCostPerHead * headCount;
  const totalInvestment = totalPurchaseCost + totalFeedCost + totalHealthCost;

  let unitSellingPrice = sellingPricePerHead || 0;
  if (!unitSellingPrice && sellingPricePerKgLive) {
    unitSellingPrice = Math.round(finalWeightKg * sellingPricePerKgLive);
  } else if (!unitSellingPrice) {
    // Estimation par défaut selon l'espèce
    const defaultRate = params.species === 'bovin' ? 1500 : 2000;
    unitSellingPrice = Math.round(finalWeightKg * defaultRate);
  }

  const totalRevenue = unitSellingPrice * headCount;
  const netMargin = totalRevenue - totalInvestment;
  const marginPerHead = Math.round(netMargin / headCount);
  const roiPercent = totalInvestment > 0 ? Math.round((netMargin / totalInvestment) * 10000) / 100 : 0;
  const breakEvenPricePerHead = Math.round(totalInvestment / headCount);

  return {
    finalWeightKg,
    weightGainPerHeadKg,
    totalWeightGainKg,
    totalPurchaseCost,
    totalFeedCost,
    totalHealthCost,
    totalInvestment,
    estimatedSellingPricePerHead: unitSellingPrice,
    totalRevenue,
    netMargin,
    marginPerHead,
    roiPercent,
    breakEvenPricePerHead,
  };
}

export interface LayerSimulationParams {
  henCount: number;
  layingRatePercent: number; // ex: 80%
  eggTrayPriceFcfa: number; // Prix alvéole (30 œufs), ex: 2200 FCFA
  dailyFeedGramsPerHen?: number; // ex: 120g
  feedKgPriceFcfa: number; // ex: 350 FCFA/kg (17 500 FCFA le sac de 50 kg)
  veterinaryMonthlyCostPerHen?: number; // ex: 100 FCFA/poule/mois
}

export interface LayerSimulationResult {
  dailyEggs: number;
  dailyTrays: number;
  monthlyEggs: number;
  monthlyTrays: number;
  monthlyRevenueFcfa: number;
  dailyFeedKg: number;
  monthlyFeedKg: number;
  monthlyFeedCostFcfa: number;
  monthlyHealthCostFcfa: number;
  monthlyTotalCostFcfa: number;
  monthlyNetProfitFcfa: number;
  profitPerHenMonthlyFcfa: number;
}

/**
 * Calculateur de production et rentabilité pour volailles pondeuses
 */
export function calculateLayerProduction(params: LayerSimulationParams): LayerSimulationResult {
  const {
    henCount,
    layingRatePercent,
    eggTrayPriceFcfa,
    dailyFeedGramsPerHen = 120,
    feedKgPriceFcfa,
    veterinaryMonthlyCostPerHen = 100,
  } = params;

  if (henCount <= 0) {
    return {
      dailyEggs: 0,
      dailyTrays: 0,
      monthlyEggs: 0,
      monthlyTrays: 0,
      monthlyRevenueFcfa: 0,
      dailyFeedKg: 0,
      monthlyFeedKg: 0,
      monthlyFeedCostFcfa: 0,
      monthlyHealthCostFcfa: 0,
      monthlyTotalCostFcfa: 0,
      monthlyNetProfitFcfa: 0,
      profitPerHenMonthlyFcfa: 0,
    };
  }

  const dailyEggs = Math.round(henCount * (layingRatePercent / 100));
  const dailyTrays = Math.round((dailyEggs / 30) * 10) / 10;
  const monthlyEggs = dailyEggs * 30;
  const monthlyTrays = Math.round(monthlyEggs / 30);
  const monthlyRevenueFcfa = monthlyTrays * eggTrayPriceFcfa;

  const dailyFeedKg = Math.round(((henCount * dailyFeedGramsPerHen) / 1000) * 10) / 10;
  const monthlyFeedKg = Math.round(dailyFeedKg * 30);
  const monthlyFeedCostFcfa = Math.round(monthlyFeedKg * feedKgPriceFcfa);
  const monthlyHealthCostFcfa = henCount * veterinaryMonthlyCostPerHen;
  const monthlyTotalCostFcfa = monthlyFeedCostFcfa + monthlyHealthCostFcfa;

  const monthlyNetProfitFcfa = monthlyRevenueFcfa - monthlyTotalCostFcfa;
  const profitPerHenMonthlyFcfa = Math.round(monthlyNetProfitFcfa / henCount);

  return {
    dailyEggs,
    dailyTrays,
    monthlyEggs,
    monthlyTrays,
    monthlyRevenueFcfa,
    dailyFeedKg,
    monthlyFeedKg,
    monthlyFeedCostFcfa,
    monthlyHealthCostFcfa,
    monthlyTotalCostFcfa,
    monthlyNetProfitFcfa,
    profitPerHenMonthlyFcfa,
  };
}

export interface BroilerSimulationParams {
  batchSize: number; // Nombre de poussins au départ (ex: 500)
  mortalityRatePercent?: number; // Taux de mortalité (ex: 4%)
  targetWeightKg?: number; // Poids vif final (ex: 2.0 kg)
  feedConversionRatio?: number; // Indice de consommation (ex: 1.85)
  chickUnitPriceFcfa: number; // Prix du poussin d'un jour (ex: 500 FCFA)
  feedKgAvgPriceFcfa: number; // Prix moyen kg aliment démarrage/croissance/finition (ex: 400 FCFA)
  healthCostPerChickenFcfa?: number; // Vaccins, vitamines (ex: 150 FCFA)
  sellingPricePerChickenFcfa: number; // Prix de vente du poulet (ex: 2500 FCFA)
}

export interface BroilerSimulationResult {
  survivingChickens: number;
  totalLiveWeightKg: number;
  totalFeedKg: number;
  totalFeedBags50kg: number;
  chicksCostFcfa: number;
  feedCostFcfa: number;
  healthCostFcfa: number;
  totalCostFcfa: number;
  grossRevenueFcfa: number;
  netMarginFcfa: number;
  marginPerChickenFcfa: number;
  roiPercent: number;
}

/**
 * Calculateur de rentabilité pour une bande de poulets de chair
 */
export function calculateBroilerBatch(params: BroilerSimulationParams): BroilerSimulationResult {
  const {
    batchSize,
    mortalityRatePercent = 4,
    targetWeightKg = 2.0,
    feedConversionRatio = 1.85,
    chickUnitPriceFcfa,
    feedKgAvgPriceFcfa,
    healthCostPerChickenFcfa = 150,
    sellingPricePerChickenFcfa,
  } = params;

  if (batchSize <= 0) {
    return {
      survivingChickens: 0,
      totalLiveWeightKg: 0,
      totalFeedKg: 0,
      totalFeedBags50kg: 0,
      chicksCostFcfa: 0,
      feedCostFcfa: 0,
      healthCostFcfa: 0,
      totalCostFcfa: 0,
      grossRevenueFcfa: 0,
      netMarginFcfa: 0,
      marginPerChickenFcfa: 0,
      roiPercent: 0,
    };
  }

  const survivingChickens = Math.round(batchSize * (1 - mortalityRatePercent / 100));
  const totalLiveWeightKg = Math.round(survivingChickens * targetWeightKg);
  const totalFeedKg = Math.round(totalLiveWeightKg * feedConversionRatio);
  const totalFeedBags50kg = Math.ceil(totalFeedKg / 50);

  const chicksCostFcfa = batchSize * chickUnitPriceFcfa;
  const feedCostFcfa = Math.round(totalFeedKg * feedKgAvgPriceFcfa);
  const healthCostFcfa = batchSize * healthCostPerChickenFcfa;
  const totalCostFcfa = chicksCostFcfa + feedCostFcfa + healthCostFcfa;

  const grossRevenueFcfa = survivingChickens * sellingPricePerChickenFcfa;
  const netMarginFcfa = grossRevenueFcfa - totalCostFcfa;
  const marginPerChickenFcfa = Math.round(netMarginFcfa / survivingChickens);
  const roiPercent = totalCostFcfa > 0 ? Math.round((netMarginFcfa / totalCostFcfa) * 10000) / 100 : 0;

  return {
    survivingChickens,
    totalLiveWeightKg,
    totalFeedKg,
    totalFeedBags50kg,
    chicksCostFcfa,
    feedCostFcfa,
    healthCostFcfa,
    totalCostFcfa,
    grossRevenueFcfa,
    netMarginFcfa,
    marginPerChickenFcfa,
    roiPercent,
  };
}

/**
 * Durées moyennes de gestation / incubation par espèce (jours)
 * Normes zootechniques adaptées au cheptel sahélien (INERA / CIRDES)
 */
export const GESTATION_DAYS_BY_SPECIES: Record<string, number> = {
  bovin: 283,      // ~9 mois et 10 jours (Zébu Peulh, Gudali, Métis)
  ovin: 150,       // ~5 mois (Mouton du Sahel, Djallonké, Bali-Bali)
  caprin: 150,     // ~5 mois (Chèvre rousse de Maradi, Chèvre du Sahel)
  porcin: 114,     // 3 mois, 3 semaines, 3 jours (Large White, Porc local)
  volaille: 21,    // 21 jours d'incubation (Poule), 28 jours pour pintade
  pisciculture: 3, // Éclosion des œufs de tilapias/silures
};

/**
 * Récupère la durée de gestation moyenne en jours
 */
export function getGestationPeriodDays(species: string): number {
  const norm = species.toLowerCase().trim();
  return GESTATION_DAYS_BY_SPECIES[norm] || 150;
}

/**
 * Calcule la date présumée de mise bas à partir de la date d'acte et de l'espèce
 */
export function calculateExpectedBirthDate(serviceDate: string, species: string): string {
  if (!serviceDate) return "";
  const d = new Date(serviceDate);
  if (isNaN(d.getTime())) return "";

  const days = getGestationPeriodDays(species);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export interface WaterNeedsParams {
  species: string;
  headCount: number;
  isHotDrySeason?: boolean; // Période chaude et sèche sahélienne (mars - mai, temp > 38°C)
}

export interface WaterNeedsResult {
  dailyPerHeadLiters: number;
  dailyTotalLiters: number;
  monthlyTotalLiters: number;
  isHotDrySeason: boolean;
  recommendation: string;
}

/**
 * Calculateur des besoins hydriques pour l'élevage en zone sahélienne (Burkina Faso)
 * En saison sèche chaude (mars-mai), la consommation en eau augmente de 35 à 50%
 */
export function calculateSahelianWaterNeeds(params: WaterNeedsParams): WaterNeedsResult {
  const { species, headCount, isHotDrySeason = false } = params;
  const count = Math.max(0, headCount);
  const spec = species.toLowerCase().trim();

  let normalLiters = 45;
  let hotDryLiters = 70;
  let recommendation = "Veiller à un abreuvoir ombragé et de l'eau propre à volonté.";

  if (spec === "bovin") {
    normalLiters = 45;
    hotDryLiters = 70;
    recommendation = "Bovins : Distribuer de l'eau fraîche 2 à 3 fois par jour ou en continu à l'ombre.";
  } else if (spec === "ovin") {
    normalLiters = 5;
    hotDryLiters = 8;
    recommendation = "Ovins : Abreuvement indispensable aux heures chaudes pour éviter le stress thermique.";
  } else if (spec === "caprin") {
    normalLiters = 5;
    hotDryLiters = 8;
    recommendation = "Caprins : Eau propre renouvelée quotidiennement avec apport en sel minéral.";
  } else if (spec === "porcin") {
    normalLiters = 18;
    hotDryLiters = 28;
    recommendation = "Porcins : Eau de boisson abondante et brumisation/bain de boue pour thermorégulation.";
  } else if (spec === "volaille") {
    normalLiters = 0.25;
    hotDryLiters = 0.35;
    recommendation = "Volailles : Ajouter un complexe anti-stress / électrolytes dans l'eau lors des pics de chaleur (>35°C).";
  } else if (spec === "pisciculture") {
    normalLiters = 100;
    hotDryLiters = 200;
    recommendation = "Pisciculture : Compensation quotidienne de l'évaporation et maintien de l'oxygénation de l'eau.";
  }

  const perHead = isHotDrySeason ? hotDryLiters : normalLiters;
  const dailyTotal = Math.round(perHead * count * 10) / 10;
  const monthlyTotal = Math.round(dailyTotal * 30);

  return {
    dailyPerHeadLiters: perHead,
    dailyTotalLiters: dailyTotal,
    monthlyTotalLiters: monthlyTotal,
    isHotDrySeason,
    recommendation,
  };
}
