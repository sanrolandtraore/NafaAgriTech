/**
 * Diagnostic Bioclimatique & Indice de Stress Thermique THI (Temperature-Humidity Index)
 * pour l'aviculture et l'élevage en milieu tropical et sahélien.
 * 
 * Références scientifiques :
 * - Kibler H.H. (1964) - Thermal effects of various temperature-humidity combinations
 *   on Holstein cows. Res. Bull. Mo. Agric. Exp. Stn. 862: 1-42.
 * - NRC (1981) - Effect of Environment on Nutrient Requirements of Domestic Animals.
 * - Zulovich J.M. & DeShazer J.A. (1990) - Estimating egg production declines from
 *   temperature and humidity conditions. ASAE Paper 90-4021.
 * - CIGR (2002) - Climatization of Animal Houses, Working Group on Climatization.
 */

import { Provenance, createProvenance } from "../provenance";

export type LivestockType = "poultry_broiler" | "poultry_layer" | "dairy_cattle" | "beef_cattle" | "sheep_goat";

export type ThiStressLevel = "comfort" | "mild_stress" | "moderate_stress" | "severe_danger" | "emergency_lethal";

export interface BioclimaticThiInput {
  animalType: LivestockType;
  /** Température de l'air ambiant (°C) */
  temperatureC: number;
  /** Humidité relative ambiante (%) */
  relativeHumidityPercent: number;
  /** Effectif du troupeau / bande (nombre d'animaux) */
  animalsCount: number;
  /** Poids moyen d'un animal (kg) */
  averageWeightKg: number;
  /** Vitesse actuelle de l'air au niveau des animaux (m/s), défaut = 0.2 (stagnant) */
  currentAirVelocityMs?: number;
}

export interface BioclimaticThiResult {
  /** Indice de température et d'humidité THI calculé */
  thiIndex: number;
  /** Niveau de stress bioclimatique */
  stressLevel: ThiStressLevel;
  /** Chute estimée de consommation alimentaire due au stress (%) */
  estimatedFeedIntakeDeclinePercent: number;
  /** Chute estimée de production (gain de poids / ponte / lait) (%) */
  estimatedProductionDropPercent: number;
  /** Chaleur sensible totale produite par les animaux à évacuer (Watts) */
  totalSensibleHeatWatts: number;
  /** Débit de ventilation d'extraction recommandé en été (m³/h) selon normes CIGR */
  recommendedVentilationFlowRateM3h: number;
  /** Vitesse de l'air minimale recommandée au niveau des oiseaux/animaux (m/s) (effet wind-chill) */
  targetAirVelocityMs: number;
  /** Recommandations techniques zootechniques */
  recommendations: string[];
  /** Traçabilité scientifique */
  provenance: Provenance;
}

/**
 * Calcule l'indice officiel THI (Kibler / NOAA) à partir de la température et de l'humidité relative.
 * THI = (1.8 * T + 32) - (0.55 - 0.0055 * RH) * (1.8 * T - 26)
 */
export function calculateThiIndex(tempC: number, rhPercent: number): number {
  const tf = 1.8 * tempC + 32;
  const thi = tf - (0.55 - 0.0055 * rhPercent) * (tf - 58); // tf - 58 = 1.8 * T - 26
  return Math.round(thi * 10) / 10;
}

/**
 * Diagnostic bioclimatique complet du bâtiment d'élevage selon l'indice THI et les normes CIGR.
 */
export function diagnoseBioclimaticStress(input: BioclimaticThiInput): BioclimaticThiResult {
  const { temperatureC, relativeHumidityPercent, animalType, animalsCount, averageWeightKg } = input;

  if (temperatureC < -10 || temperatureC > 60) {
    throw new RangeError(`Température hors plage physiologique : ${temperatureC}°C`);
  }
  if (relativeHumidityPercent < 0 || relativeHumidityPercent > 100) {
    throw new RangeError(`Humidité relative invalide (0-100%) : ${relativeHumidityPercent}%`);
  }
  if (animalsCount <= 0 || averageWeightKg <= 0) {
    throw new RangeError("Effectif et poids moyen doivent être strictement positifs.");
  }

  const thi = calculateThiIndex(temperatureC, relativeHumidityPercent);

  let stressLevel: ThiStressLevel = "comfort";
  let feedDropPct = 0;
  let prodDropPct = 0;
  let targetAirVelocityMs = 0.3; // brassage minimal hivernage
  const recommendations: string[] = [];

  // Seuils spécifiques selon l'espèce
  if (animalType === "poultry_broiler" || animalType === "poultry_layer") {
    // Volailles (très sensibles à partir de THI 70)
    if (thi < 70) {
      stressLevel = "comfort";
      recommendations.push("Ambiance bioclimatique optimale. Maintenir la ventilation hygiénique standard.");
    } else if (thi < 75) {
      stressLevel = "mild_stress";
      feedDropPct = 5.0;
      prodDropPct = 3.0;
      targetAirVelocityMs = 1.0;
      recommendations.push(
        "Stress thermique modéré débutant : déclencher la ventilation tunnel et distribuer l'aliment aux heures fraîches.",
      );
    } else if (thi < 82) {
      stressLevel = "moderate_stress";
      feedDropPct = 15.0;
      prodDropPct = 12.0;
      targetAirVelocityMs = 2.0;
      recommendations.push(
        "Stress thermique sévère : halètement intense des volailles. Activer le refroidissement évaporatif (cooling pads/brumisation) et ajouter de la vitamine C et des électrolytes dans l'eau de boisson.",
      );
    } else if (thi < 88) {
      stressLevel = "severe_danger";
      feedDropPct = 30.0;
      prodDropPct = 25.0;
      targetAirVelocityMs = 2.5;
      recommendations.push(
        "DANGER CRITIQUE DE COUPOIR : Risque de mortalité massive par défaillance cardiaque. Vitesse d'air tunnel maximale requise (>= 2.5 m/s), jeûne hydrique diurne et aspersion de toiture.",
      );
    } else {
      stressLevel = "emergency_lethal";
      feedDropPct = 50.0;
      prodDropPct = 40.0;
      targetAirVelocityMs = 3.0;
      recommendations.push(
        "URGENCE LÉTALE ABSOLUE (THI >= 88) : Mortalité immédiate sans intervention d'urgence. Arrosage d'urgence des toitures, évacuation manuelle des oiseaux comprimés, groupe électrogène de secours actif.",
      );
    }
  } else {
    // Ruminants (bovins, ovins)
    if (thi < 68) {
      stressLevel = "comfort";
      recommendations.push("Confort thermique optimal pour les ruminants.");
    } else if (thi < 72) {
      stressLevel = "mild_stress";
      feedDropPct = 4.0;
      prodDropPct = 5.0;
      targetAirVelocityMs = 1.0;
      recommendations.push("Stress thermique léger : ombrage suffisant et abreuvement à volonté requis.");
    } else if (thi < 79) {
      stressLevel = "moderate_stress";
      feedDropPct = 12.0;
      prodDropPct = 15.0;
      targetAirVelocityMs = 1.8;
      recommendations.push("Stress thermique modéré : brassage d'air forcé et brumisation intermittente.");
    } else {
      stressLevel = "severe_danger";
      feedDropPct = 25.0;
      prodDropPct = 30.0;
      targetAirVelocityMs = 2.5;
      recommendations.push("Stress thermique sévère : risque de colapsus chez les animaux à haut rendement.");
    }
  }

  // Normes CIGR pour le dimensionnement de la ventilation d'été
  // Débit massique de ventilation d'été maximal : ~ 6.0 à 8.0 m³/h par kg de masse vive pour volailles
  let cubicMetersPerHourPerKg = 6.0;
  if (animalType === "poultry_broiler" || animalType === "poultry_layer") {
    cubicMetersPerHourPerKg = 7.0; // 7 m³/h par kg de poulet par temps très chaud
  } else {
    cubicMetersPerHourPerKg = 2.5; // pour gros ruminants
  }

  const totalBiomassKg = animalsCount * averageWeightKg;
  const recommendedVentilationFlowRateM3h = Math.round(totalBiomassKg * cubicMetersPerHourPerKg);

  // Production de chaleur sensible animale selon formule allométrique CIGR :
  // Heat sensible (W/animal) ≈ 10.6 * W^0.75 (valeur nominale adaptée au climat chaud)
  const heatPerAnimalWatts = 10.6 * Math.pow(averageWeightKg, 0.75);
  const totalSensibleHeatWatts = Math.round(heatPerAnimalWatts * animalsCount);

  const provenance = createProvenance(
    "BioclimaticThiEngine",
    "1.0.0",
    [
      {
        name: "Indice de Température et d'Humidité THI",
        reference: "Kibler H.H. (1964) Res. Bull. Mo. Agric. Exp. Stn. 862 / NOAA",
      },
      {
        name: "Standard de Climatisation et Ventilation des Bâtiments d'Élevage",
        reference: "CIGR Report of Working Group on Climatization of Animal Houses (2002)",
      },
      {
        name: "Seuils bioclimatiques avicoles en milieu tropical",
        reference: "Zulovich & DeShazer (1990) ASAE Paper 90-4021 / NRC (1981)",
      },
    ],
    [
      `Troupeau de ${animalsCount} animaux (${totalBiomassKg.toFixed(0)} kg de biomasse vive)`,
      "Évacuation de la chaleur sensible par ventilation dynamique forcée",
    ],
    [],
  );

  return {
    thiIndex: thi,
    stressLevel,
    estimatedFeedIntakeDeclinePercent: feedDropPct,
    estimatedProductionDropPercent: prodDropPct,
    totalSensibleHeatWatts,
    recommendedVentilationFlowRateM3h,
    targetAirVelocityMs,
    recommendations,
    provenance,
  };
}
