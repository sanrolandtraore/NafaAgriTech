/**
 * Formulation de Rations à Moindre Coût (Least-Cost Feed Formulation)
 * par Programmation Linéaire (Simplex) avec matières premières locales sahéliennes
 * et profils nutritionnels normés INRAE / NRC / CIRAD.
 * 
 * Références normatives & scientifiques :
 * - NRC (1994) - Nutrient Requirements of Poultry, Ninth Revised Edition,
 *   National Academy Press, Washington, D.C.
 * - Sauvant D., Perez J.M., Tran G. (2004) - Tables de composition et de valeur
 *   nutritive des matières premières destinées aux animaux d'élevage, INRA-AFZ.
 * - Feedipedia / CIRAD (2020) - Animal feed resources information system.
 */

import { solveLinearProgram, LinearConstraint, VariableBound } from "./linearProgramming";
import { Provenance, createProvenance } from "../provenance";

export interface FeedIngredientNutrientProfile {
  id: string;
  name: string;
  /** Prix unitaire d'achat en FCFA par kg */
  priceFcfaPerKg: number;
  /** Énergie Métabolisable (kcal/kg) pour volailles */
  metabolizableEnergyKcalKg: number;
  /** Protéines Brutes (% de la matière) */
  crudeProteinPercent: number;
  /** Lysine totale / digestible (%) */
  lysinePercent: number;
  /** Méthionine (%) */
  methioninePercent: number;
  /** Calcium (%) */
  calciumPercent: number;
  /** Phosphore assimilable (%) */
  availablePhosphorusPercent: number;
  /** Cellulose Brute (%) */
  crudeFiberPercent: number;
  /** Taux maximal d'incorporation recommandé dans la ration (%) */
  maxInclusionPercent?: number;
  /** Taux minimal d'incorporation imposé (%) */
  minInclusionPercent?: number;
}

export interface NutritionalRequirementsTarget {
  specieAndStageName: string;
  /** Énergie Métabolisable minimale requise (kcal/kg) */
  minEnergyKcalKg: number;
  /** Protéines Brutes minimales (%) */
  minCrudeProteinPercent: number;
  /** Lysine minimale (%) */
  minLysinePercent: number;
  /** Méthionine minimale (%) */
  minMethioninePercent: number;
  /** Calcium minimal (%) */
  minCalciumPercent: number;
  /** Calcium maximal (%) pour éviter la toxicité rénale */
  maxCalciumPercent?: number;
  /** Phosphore disponible minimal (%) */
  minPhosphorusPercent: number;
  /** Cellulose brute maximale admissible (%) pour digestibilité monogastriques */
  maxCrudeFiberPercent: number;
}

export interface FormulationInput {
  target: NutritionalRequirementsTarget;
  availableIngredients: FeedIngredientNutrientProfile[];
  /** Poids total du lot à formuler en kg (défaut = 100 kg pour lecture directe en %) */
  batchWeightKg?: number;
}

export interface IngredientInclusion {
  ingredientId: string;
  ingredientName: string;
  percentageInRation: number; // %
  weightInBatchKg: number; // kg
  costContributionFcfa: number; // FCFA
  pricePerKgFcfa: number;
}

export interface FormulationResult {
  isFeasible: boolean;
  statusMessage: string;
  /** Coût de revient minimal de l'aliment complet en FCFA par kg */
  costPerKgFcfa: number;
  /** Coût du lot complet en FCFA */
  totalBatchCostFcfa: number;
  /** Poids du lot formulé en kg */
  batchWeightKg: number;
  /** Composition détaillée des matières premières retenues */
  inclusions: IngredientInclusion[];
  /** Teneurs nutritionnelles réelles atteintes par la ration optimale */
  achievedNutrients: {
    energyKcalKg: number;
    crudeProteinPercent: number;
    lysinePercent: number;
    methioninePercent: number;
    calciumPercent: number;
    availablePhosphorusPercent: number;
    crudeFiberPercent: number;
  };
  /** Nombre d'itérations du solveur Simplex */
  iterations: number;
  /** Traçabilité scientifique */
  provenance: Provenance;
}

/**
 * Bibliothèque de matières premières d'Afrique de l'Ouest (tables INRAE-CIRAD / Mercuriale Sahel)
 */
export const SAHELIAN_FEED_LIBRARY: FeedIngredientNutrientProfile[] = [
  {
    id: "corn_yellow",
    name: "Maïs grain jaune concassé",
    priceFcfaPerKg: 220,
    metabolizableEnergyKcalKg: 3350,
    crudeProteinPercent: 8.5,
    lysinePercent: 0.24,
    methioninePercent: 0.18,
    calciumPercent: 0.02,
    availablePhosphorusPercent: 0.10,
    crudeFiberPercent: 2.2,
    maxInclusionPercent: 70,
  },
  {
    id: "soybean_meal_46",
    name: "Tourteau de soja délipidé 46%",
    priceFcfaPerKg: 460,
    metabolizableEnergyKcalKg: 2450,
    crudeProteinPercent: 46.0,
    lysinePercent: 2.90,
    methioninePercent: 0.65,
    calciumPercent: 0.30,
    availablePhosphorusPercent: 0.22,
    crudeFiberPercent: 5.5,
    maxInclusionPercent: 35,
  },
  {
    id: "cottonseed_meal",
    name: "Tourteau de coton local (Burkina Faso)",
    priceFcfaPerKg: 190,
    metabolizableEnergyKcalKg: 2150,
    crudeProteinPercent: 41.0,
    lysinePercent: 1.65,
    methioninePercent: 0.58,
    calciumPercent: 0.22,
    availablePhosphorusPercent: 0.35,
    crudeFiberPercent: 12.0,
    maxInclusionPercent: 15, // Limitation impérative à 15% due au gossypol libre toxique
  },
  {
    id: "wheat_bran",
    name: "Son de blé tendre",
    priceFcfaPerKg: 140,
    metabolizableEnergyKcalKg: 1800,
    crudeProteinPercent: 15.0,
    lysinePercent: 0.55,
    methioninePercent: 0.22,
    calciumPercent: 0.12,
    availablePhosphorusPercent: 0.30,
    crudeFiberPercent: 9.8,
    maxInclusionPercent: 18,
  },
  {
    id: "fish_meal_local",
    name: "Farine de poisson locale",
    priceFcfaPerKg: 580,
    metabolizableEnergyKcalKg: 2800,
    crudeProteinPercent: 58.0,
    lysinePercent: 4.40,
    methioninePercent: 1.55,
    calciumPercent: 5.20,
    availablePhosphorusPercent: 2.80,
    crudeFiberPercent: 1.0,
    maxInclusionPercent: 8,
  },
  {
    id: "oyster_shell",
    name: "Coquilles d'huître broyées (calcaire marin)",
    priceFcfaPerKg: 90,
    metabolizableEnergyKcalKg: 0,
    crudeProteinPercent: 0,
    lysinePercent: 0,
    methioninePercent: 0,
    calciumPercent: 38.0,
    availablePhosphorusPercent: 0,
    crudeFiberPercent: 0,
    maxInclusionPercent: 10,
  },
  {
    id: "dicalcium_phosphate",
    name: "Phosphate bicalcique (minéral)",
    priceFcfaPerKg: 420,
    metabolizableEnergyKcalKg: 0,
    crudeProteinPercent: 0,
    lysinePercent: 0,
    methioninePercent: 0,
    calciumPercent: 24.0,
    availablePhosphorusPercent: 18.0,
    crudeFiberPercent: 0,
    maxInclusionPercent: 3,
  },
  {
    id: "premix_cmv_broiler",
    name: "Prémix CMV Minéral-Vitaminé Chair 0.5%",
    priceFcfaPerKg: 1800,
    metabolizableEnergyKcalKg: 0,
    crudeProteinPercent: 0,
    lysinePercent: 0,
    methioninePercent: 0,
    calciumPercent: 12.0,
    availablePhosphorusPercent: 0,
    crudeFiberPercent: 0,
    minInclusionPercent: 0.5,
    maxInclusionPercent: 0.5, // Taux fixe obligatoire de 0.5%
  },
  {
    id: "vegetable_oil",
    name: "Huile végétale brute (arachide/coton)",
    priceFcfaPerKg: 850,
    metabolizableEnergyKcalKg: 8800,
    crudeProteinPercent: 0,
    lysinePercent: 0,
    methioninePercent: 0,
    calciumPercent: 0,
    availablePhosphorusPercent: 0,
    crudeFiberPercent: 0,
    maxInclusionPercent: 4.0, // max 4% de matière grasse ajoutée
  },
  {
    id: "dl_methionine",
    name: "DL-Méthionine pure 99%",
    priceFcfaPerKg: 4200,
    metabolizableEnergyKcalKg: 5000,
    crudeProteinPercent: 58.0,
    lysinePercent: 0,
    methioninePercent: 99.0,
    calciumPercent: 0,
    availablePhosphorusPercent: 0,
    crudeFiberPercent: 0,
    maxInclusionPercent: 0.35,
  },
  {
    id: "l_lysine_hcl",
    name: "L-Lysine HCl 78%",
    priceFcfaPerKg: 2400,
    metabolizableEnergyKcalKg: 4200,
    crudeProteinPercent: 94.0,
    lysinePercent: 78.0,
    methioninePercent: 0,
    calciumPercent: 0,
    availablePhosphorusPercent: 0,
    crudeFiberPercent: 0,
    maxInclusionPercent: 0.35,
  },
];

/**
 * Profils nutritionnels normés NRC (1994) / INRAE pour volailles
 */
export const STANDARD_POULTRY_TARGETS: Record<string, NutritionalRequirementsTarget> = {
  broiler_starter: {
    specieAndStageName: "Poulet de chair — Démarrage (J0 à J14)",
    minEnergyKcalKg: 3000,
    minCrudeProteinPercent: 21.5,
    minLysinePercent: 1.15,
    minMethioninePercent: 0.48,
    minCalciumPercent: 0.95,
    maxCalciumPercent: 1.25,
    minPhosphorusPercent: 0.45,
    maxCrudeFiberPercent: 4.5,
  },
  broiler_grower: {
    specieAndStageName: "Poulet de chair — Croissance (J15 à J28)",
    minEnergyKcalKg: 3100,
    minCrudeProteinPercent: 19.5,
    minLysinePercent: 1.00,
    minMethioninePercent: 0.42,
    minCalciumPercent: 0.88,
    maxCalciumPercent: 1.15,
    minPhosphorusPercent: 0.40,
    maxCrudeFiberPercent: 5.0,
  },
  broiler_finisher: {
    specieAndStageName: "Poulet de chair — Finition (J29 à l'abattage)",
    minEnergyKcalKg: 3150,
    minCrudeProteinPercent: 18.0,
    minLysinePercent: 0.90,
    minMethioninePercent: 0.38,
    minCalciumPercent: 0.82,
    maxCalciumPercent: 1.05,
    minPhosphorusPercent: 0.35,
    maxCrudeFiberPercent: 5.0,
  },
  layer_production: {
    specieAndStageName: "Poule pondeuse — Ponte (pic de production)",
    minEnergyKcalKg: 2750,
    minCrudeProteinPercent: 17.0,
    minLysinePercent: 0.82,
    minMethioninePercent: 0.38,
    minCalciumPercent: 3.50, // Besoin très élevé en calcium pour la coquille
    maxCalciumPercent: 4.20,
    minPhosphorusPercent: 0.38,
    maxCrudeFiberPercent: 5.5,
  },
};

/**
 * Formule une ration à moindre coût par programmation linéaire (Simplex).
 */
export function formulateLeastCostRation(input: FormulationInput): FormulationResult {
  const { target, availableIngredients } = input;
  const batchWeight = input.batchWeightKg ?? 100;

  if (availableIngredients.length === 0) {
    throw new Error("Aucun ingrédient fourni pour la formulation.");
  }

  const n = availableIngredients.length;

  // Variables x_j : proportion de l'ingrédient j dans la ration (somme = 1.0)
  // Fonction objectif : min sum(c_j * x_j) où c_j est le prix en FCFA/kg
  const costCoefficients = availableIngredients.map((ing) => ing.priceFcfaPerKg);

  const constraints: LinearConstraint[] = [];

  // Contrainte 1 : Somme des proportions = 1.0 (soit 100% de la formule)
  constraints.push({
    coefficients: Array(n).fill(1.0),
    operator: "=",
    rhs: 1.0,
    name: "Somme des ingrédients = 100%",
  });

  // Contrainte 2 : Énergie Métabolisable >= minEnergy
  constraints.push({
    coefficients: availableIngredients.map((ing) => ing.metabolizableEnergyKcalKg),
    operator: ">=",
    rhs: target.minEnergyKcalKg,
    name: `Énergie EM >= ${target.minEnergyKcalKg} kcal/kg`,
  });

  // Contrainte 3 : Protéines Brutes >= minProtein
  constraints.push({
    coefficients: availableIngredients.map((ing) => ing.crudeProteinPercent),
    operator: ">=",
    rhs: target.minCrudeProteinPercent,
    name: `Protéines PB >= ${target.minCrudeProteinPercent}%`,
  });

  // Contrainte 4 : Lysine >= minLysine
  constraints.push({
    coefficients: availableIngredients.map((ing) => ing.lysinePercent),
    operator: ">=",
    rhs: target.minLysinePercent,
    name: `Lysine >= ${target.minLysinePercent}%`,
  });

  // Contrainte 5 : Méthionine >= minMethionine
  constraints.push({
    coefficients: availableIngredients.map((ing) => ing.methioninePercent),
    operator: ">=",
    rhs: target.minMethioninePercent,
    name: `Méthionine >= ${target.minMethioninePercent}%`,
  });

  // Contrainte 6 : Calcium >= minCalcium
  constraints.push({
    coefficients: availableIngredients.map((ing) => ing.calciumPercent),
    operator: ">=",
    rhs: target.minCalciumPercent,
    name: `Calcium >= ${target.minCalciumPercent}%`,
  });

  // Contrainte 7 : Calcium <= maxCalcium (si spécifié)
  if (target.maxCalciumPercent !== undefined) {
    constraints.push({
      coefficients: availableIngredients.map((ing) => ing.calciumPercent),
      operator: "<=",
      rhs: target.maxCalciumPercent,
      name: `Calcium <= ${target.maxCalciumPercent}%`,
    });
  }

  // Contrainte 8 : Phosphore disponible >= minPhosphorus
  constraints.push({
    coefficients: availableIngredients.map((ing) => ing.availablePhosphorusPercent),
    operator: ">=",
    rhs: target.minPhosphorusPercent,
    name: `Phosphore >= ${target.minPhosphorusPercent}%`,
  });

  // Contrainte 9 : Cellulose Brute <= maxFiber
  constraints.push({
    coefficients: availableIngredients.map((ing) => ing.crudeFiberPercent),
    operator: "<=",
    rhs: target.maxCrudeFiberPercent,
    name: `Cellulose CB <= ${target.maxCrudeFiberPercent}%`,
  });

  // Bornes d'incorporation par ingrédient (en fraction [0, 1])
  const bounds: VariableBound[] = availableIngredients.map((ing) => ({
    min: ing.minInclusionPercent !== undefined ? ing.minInclusionPercent / 100 : 0,
    max: ing.maxInclusionPercent !== undefined ? ing.maxInclusionPercent / 100 : 1.0,
  }));

  // Résolution exacte par l'algorithme du Simplex
  const lpSolution = solveLinearProgram({
    objective: "minimize",
    costCoefficients,
    constraints,
    bounds,
  });

  if (!lpSolution.isFeasible) {
    return {
      isFeasible: false,
      statusMessage: lpSolution.statusMessage,
      costPerKgFcfa: 0,
      totalBatchCostFcfa: 0,
      batchWeightKg: batchWeight,
      inclusions: [],
      achievedNutrients: {
        energyKcalKg: 0,
        crudeProteinPercent: 0,
        lysinePercent: 0,
        methioninePercent: 0,
        calciumPercent: 0,
        availablePhosphorusPercent: 0,
        crudeFiberPercent: 0,
      },
      iterations: lpSolution.iterations,
      provenance: createProvenance(
        "LeastCostFeedEngine",
        "1.0.0",
        [{ name: "Simplex Deux Phases", reference: "Dantzig G.B. (1963)" }],
        [],
        [lpSolution.statusMessage],
      ),
    };
  }

  // Calcul du profil nutritionnel réel de l'aliment optimisé
  const proportions = lpSolution.variableValues;
  const inclusions: IngredientInclusion[] = [];
  let achievedEnergy = 0;
  let achievedProtein = 0;
  let achievedLys = 0;
  let achievedMet = 0;
  let achievedCa = 0;
  let achievedP = 0;
  let achievedFiber = 0;

  for (let j = 0; j < n; j++) {
    const prop = proportions[j];
    const ing = availableIngredients[j];
    const pct = Math.round(prop * 10000) / 100; // % avec 2 décimales
    const weightKg = (prop * batchWeight);
    const cost = prop * ing.priceFcfaPerKg;

    if (prop > 1e-4) {
      inclusions.push({
        ingredientId: ing.id,
        ingredientName: ing.name,
        percentageInRation: pct,
        weightInBatchKg: Math.round(weightKg * 100) / 100,
        costContributionFcfa: Math.round(cost * batchWeight),
        pricePerKgFcfa: ing.priceFcfaPerKg,
      });
    }

    achievedEnergy += prop * ing.metabolizableEnergyKcalKg;
    achievedProtein += prop * ing.crudeProteinPercent;
    achievedLys += prop * ing.lysinePercent;
    achievedMet += prop * ing.methioninePercent;
    achievedCa += prop * ing.calciumPercent;
    achievedP += prop * ing.availablePhosphorusPercent;
    achievedFiber += prop * ing.crudeFiberPercent;
  }

  const costPerKg = Math.round(lpSolution.optimalValue * 100) / 100;
  const totalCost = Math.round(costPerKg * batchWeight);

  const provenance = createProvenance(
    "LeastCostFeedEngine",
    "1.0.0",
    [
      {
        name: "Formulation à moindre coût par programmation linéaire",
        reference: "Dantzig G.B. (1963) Linear Programming and Extensions",
      },
      {
        name: "Normes nutritionnelles avicoles",
        reference: "NRC (1994) Nutrient Requirements of Poultry, 9th Rev. Ed.",
      },
      {
        name: "Valeurs nutritives des matières premières tropicales",
        reference: "INRA-AFZ (Sauvant et al. 2004) / Feedipedia (CIRAD)",
      },
    ],
    [
      `Lot de ${batchWeight} kg d'aliment complet`,
      "Matières premières d'Afrique de l'Ouest",
    ],
    [],
  );

  return {
    isFeasible: true,
    statusMessage: "Formule optimisée à moindre coût trouvée avec succès.",
    costPerKgFcfa: costPerKg,
    totalBatchCostFcfa: totalCost,
    batchWeightKg: batchWeight,
    inclusions,
    achievedNutrients: {
      energyKcalKg: Math.round(achievedEnergy),
      crudeProteinPercent: Math.round(achievedProtein * 100) / 100,
      lysinePercent: Math.round(achievedLys * 100) / 100,
      methioninePercent: Math.round(achievedMet * 100) / 100,
      calciumPercent: Math.round(achievedCa * 100) / 100,
      availablePhosphorusPercent: Math.round(achievedP * 100) / 100,
      crudeFiberPercent: Math.round(achievedFiber * 100) / 100,
    },
    iterations: lpSolution.iterations,
    provenance,
  };
}
