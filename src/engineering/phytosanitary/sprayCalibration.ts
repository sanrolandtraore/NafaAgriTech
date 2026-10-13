/**
 * Étalonnage des pulvérisateurs et calcul des volumes de bouillie de traitement
 * selon les normes internationales de la FAO pour l'application des pesticides.
 * 
 * Références normatives :
 * - FAO (1998) - Guidelines on good practice for ground application of pesticides.
 * - FAO (2001) - Equipment for crop protection - International standards.
 * - CILSS / Comité Sahélien des Pesticides (CSP) - Bonnes pratiques phytosanitaires.
 */

import { Provenance, createProvenance } from "../provenance";

export interface SprayerCalibrationInput {
  /** Capacité de la cuve du pulvérisateur à dos ou tracté en litres (ex: 16 L) */
  tankCapacityLiters: number;
  /** Débit mesuré de la buse ou des buses en litres par minute (L/min) */
  nozzleFlowRateLitersPerMin: number;
  /** Vitesse d'avancement de l'opérateur ou du tracteur en km/h (ex: 3.6 km/h = 1.0 m/s) */
  walkingSpeedKmH: number;
  /** Largeur de traitement / largeur de bande efficace couverte en mètres (ex: 1.0 m pour buse miroir) */
  spraySwathWidthM: number;
  /** Superficie réelle de la parcelle à traiter en hectares (ha) */
  fieldAreaHa: number;
  /** Dose commerciale homologuée par le CSP par hectare (ex: 1.0 L/ha ou 2.5 kg/ha) */
  productDosePerHa: number;
  /** Unité de la dose ("L/ha" pour liquide ou "kg/ha" pour poudre/granulés) */
  doseUnit: "L/ha" | "kg/ha";
}

export interface SprayerCalibrationResult {
  /** Volume d'application calculé à l'hectare en L/ha (éq. FAO : 600 * q / (v * l)) */
  sprayVolumePerHaLiters: number;
  /** Volume total de bouillie nécessaire pour toute la parcelle en litres */
  totalSprayVolumeLiters: number;
  /** Nombre total de pleins de pulvérisateur à préparer */
  numberOfTanksRequired: number;
  /** Quantité de produit commercial à verser dans chaque cuve pleine (mL si liquide, g si poudre) */
  productAmountPerTank: number;
  /** Unité de mesure pour le dosage par cuve ("mL" ou "g") */
  amountPerTankUnit: "mL" | "g";
  /** Quantité de produit commercial pour la dernière cuve partielle éventuelle */
  productAmountForLastPartialTank?: number;
  /** Volume d'eau de la dernière cuve partielle éventuelle en litres */
  waterVolumeForLastPartialTank?: number;
  /** Quantité totale de produit commercial requise pour la parcelle */
  totalProductNeeded: number;
  totalProductUnit: "L" | "kg";
  /** Alertes d'étalonnage (dérive, risque de sous/sur-dosage) */
  warnings: string[];
  /** Traçabilité scientifique */
  provenance: Provenance;
}

/**
 * Calcule l'étalonnage exact du pulvérisateur et le dosage par cuve selon la formule FAO.
 */
export function calculateSprayerCalibration(input: SprayerCalibrationInput): SprayerCalibrationResult {
  const {
    tankCapacityLiters,
    nozzleFlowRateLitersPerMin,
    walkingSpeedKmH,
    spraySwathWidthM,
    fieldAreaHa,
    productDosePerHa,
    doseUnit,
  } = input;

  if (tankCapacityLiters <= 0) throw new RangeError("La capacité de la cuve doit être > 0.");
  if (nozzleFlowRateLitersPerMin <= 0) throw new RangeError("Le débit de buse doit être > 0.");
  if (walkingSpeedKmH <= 0) throw new RangeError("La vitesse d'avancement doit être > 0.");
  if (spraySwathWidthM <= 0) throw new RangeError("La largeur de traitement doit être > 0.");
  if (fieldAreaHa <= 0) throw new RangeError("La surface de la parcelle doit être > 0.");
  if (productDosePerHa <= 0) throw new RangeError("La dose homologuée doit être > 0.");

  // Formule universelle FAO d'application au sol :
  // V_ha = (600 * q) / (v * l)
  // où q est en L/min, v en km/h, l en mètres -> résultat directement en L/ha
  const sprayVolumePerHaLiters =
    (600 * nozzleFlowRateLitersPerMin) / (walkingSpeedKmH * spraySwathWidthM);

  const totalSprayVolumeLiters = sprayVolumePerHaLiters * fieldAreaHa;

  // Nombre de pleins de cuve
  const exactTanks = totalSprayVolumeLiters / tankCapacityLiters;
  const fullTanksCount = Math.floor(exactTanks);
  const remainingVolume = totalSprayVolumeLiters - fullTanksCount * tankCapacityLiters;

  const numberOfTanksRequired = remainingVolume > 0.05 ? fullTanksCount + 1 : fullTanksCount;

  // Concentration volumique de produit par litre de bouillie : C = Dose_ha / V_ha
  const productPerLiter = productDosePerHa / sprayVolumePerHaLiters;

  // Quantité par cuve pleine
  const amountUnit = doseUnit === "L/ha" ? "mL" : "g";
  const factor = 1000; // 1 L = 1000 mL, 1 kg = 1000 g
  const productAmountPerTank = Math.round(productPerLiter * tankCapacityLiters * factor * 10) / 10;

  let productAmountForLastPartialTank: number | undefined = undefined;
  let waterVolumeForLastPartialTank: number | undefined = undefined;

  if (remainingVolume > 0.05) {
    waterVolumeForLastPartialTank = Math.round(remainingVolume * 10) / 10;
    productAmountForLastPartialTank =
      Math.round(productPerLiter * remainingVolume * factor * 10) / 10;
  }

  const totalProductNeeded = Math.round(productDosePerHa * fieldAreaHa * 1000) / 1000;
  const totalProductUnit = doseUnit === "L/ha" ? "L" : "kg";

  const warnings: string[] = [];

  // Vitesse de marche recommandée pour opérateur à dos : 2.5 à 4.5 km/h
  if (walkingSpeedKmH < 2.5) {
    warnings.push(
      `Vitesse de marche lente (${walkingSpeedKmH} km/h < 2.5 km/h) : Risque de surdosage localisé et d'exposition excessive de l'opérateur.`,
    );
  } else if (walkingSpeedKmH > 5.0) {
    warnings.push(
      `Vitesse de marche très élevée (${walkingSpeedKmH} km/h > 5.0 km/h) : Risque de mauvaise couverture foliaire et de sous-dosage.`,
    );
  }

  // Volume de bouillie typique en plein champ au Sahel : 150 à 300 L/ha
  if (sprayVolumePerHaLiters < 80) {
    warnings.push(
      `Volume de bouillie très faible (${sprayVolumePerHaLiters.toFixed(0)} L/ha < 80 L/ha) : Risque de dérive éolienne et de couverture hétérogène (gouttelettes trop fines).`,
    );
  } else if (sprayVolumePerHaLiters > 400) {
    warnings.push(
      `Volume de bouillie élevé (${sprayVolumePerHaLiters.toFixed(0)} L/ha > 400 L/ha) : Risque de ruissellement du produit au sol sans rétention foliaire.`,
    );
  }

  const provenance = createProvenance(
    "SprayerCalibrationEngine",
    "1.0.0",
    [
      {
        name: "Formule universelle d'application des pesticides FAO",
        reference: "FAO (1998) Guidelines on good practice for ground application of pesticides",
      },
      {
        name: "Directives d'étalonnage CILSS / Comité Sahélien des Pesticides",
        reference: "Guide des bonnes pratiques phytosanitaires au Sahel, CILSS/CSP",
      },
    ],
    [
      "Débit de buse constant sous pression de service nominale",
      "Vitesse de déplacement régulière et hauteur de buse constante",
      "Pulvérisation sans vent fort (< 10 km/h) aux heures fraîches",
    ],
    warnings,
  );

  return {
    sprayVolumePerHaLiters: Math.round(sprayVolumePerHaLiters * 10) / 10,
    totalSprayVolumeLiters: Math.round(totalSprayVolumeLiters * 10) / 10,
    numberOfTanksRequired,
    productAmountPerTank,
    amountPerTankUnit: amountUnit,
    productAmountForLastPartialTank,
    waterVolumeForLastPartialTank,
    totalProductNeeded,
    totalProductUnit,
    warnings,
    provenance,
  };
}
