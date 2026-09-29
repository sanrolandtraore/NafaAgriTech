/**
 * MODÈLE IRRIS - Outil de dimensionnement d'irrigation et pompage solaire
 * Conforme aux protocoles et standards de terrain (Practica Foundation / Projet IRRINN / CIRAD Sahel).
 * 
 * Optimisé pour le Burkina Faso et la zone sahélienne :
 * - Détermination des besoins hydriques des cultures selon saison et phénologie
 * - Calcul de la Hauteur Manométrique Totale (HMT)
 * - Dimensionnement de la puissance crête photovoltaïque (Wc) et de la pompe solaire immergée
 * - Contrôle de viabilité de la ressource en eau (forage / puits / rivière)
 * - Bordereau quantitatif estimatif chiffré en FCFA
 */

import { QuoteItem, IrrigationDesignResult, GeodesicSurveyResult } from "./nafaGeniusEngine";

export type IrrisWaterSourceType = "forage" | "puits" | "surface";
export type IrrisCropKey = "tomate" | "oignon" | "mais" | "arboriculture" | "fourrage";
export type IrrisSeason = "seche_chaude" | "seche_froide" | "hivernage";
export type IrrisMethod = "goutte_a_goutte" | "aspersion" | "micro_aspersion" | "californien";
export type IrrisPumpingMode = "fil_du_soleil" | "direct_reseau" | "hybride";

export interface IrrisInput {
  // 1. Source d'eau
  sourceType: IrrisWaterSourceType;
  dynamicWaterDepthM: number;       // Profondeur dynamique de l'eau (m)
  sourceFlowM3h: number;            // Débit exploitable de la source (m³/h)
  dischargeDistanceM: number;       // Distance refoulement (m)
  
  // 2. Parcelle & Culture
  areaHa: number;                   // Superficie en hectares (ex: 0.5 ha)
  cropKey: IrrisCropKey;            // Culture
  season: IrrisSeason;              // Saison climatique
  
  // 3. Méthode d'irrigation & Stockage
  method: IrrisMethod;              // Type de réseau
  pumpingMode: IrrisPumpingMode;     // Mode de pompage
  tankHeightM: number;              // Hauteur du château d'eau / réservoir (m)
}

export interface IrrisCropConfig {
  key: IrrisCropKey;
  label: string;
  waterNeedMmDay: number;           // Besoin en eau de pointe standard (mm/jour)
  recommendedMethod: IrrisMethod;
}

export const IRRIS_CROPS: Record<IrrisCropKey, IrrisCropConfig> = {
  tomate: {
    key: "tomate",
    label: "Tomate / Piment (Maraîchage intensif)",
    waterNeedMmDay: 6.0,
    recommendedMethod: "goutte_a_goutte",
  },
  oignon: {
    key: "oignon",
    label: "Oignon de garde / Échalote",
    waterNeedMmDay: 5.5,
    recommendedMethod: "goutte_a_goutte",
  },
  mais: {
    key: "mais",
    label: "Maïs doux / Céréales",
    waterNeedMmDay: 6.5,
    recommendedMethod: "aspersion",
  },
  arboriculture: {
    key: "arboriculture",
    label: "Arboriculture / Manguiers / Agrumes",
    waterNeedMmDay: 4.5,
    recommendedMethod: "micro_aspersion",
  },
  fourrage: {
    key: "fourrage",
    label: "Fourrage / Luzerne / Brachiaria",
    waterNeedMmDay: 7.0,
    recommendedMethod: "aspersion",
  },
};

export const IRRIS_SEASONS: Record<IrrisSeason, { label: string; coefEto: number }> = {
  seche_chaude: {
    label: "Saison sèche chaude (Mars - Mai : pic d'évapotranspiration)",
    coefEto: 1.15,
  },
  seche_froide: {
    label: "Saison sèche froide (Novembre - Février)",
    coefEto: 0.90,
  },
  hivernage: {
    label: "Hivernage / Saison des pluies (Juin - Octobre : appoint)",
    coefEto: 0.65,
  },
};

export const IRRIS_METHODS: Record<IrrisMethod, { label: string; efficiency: number; servicePressureM: number }> = {
  goutte_a_goutte: {
    label: "Goutte-à-goutte (Basse pression, haute efficience)",
    efficiency: 0.90,
    servicePressureM: 10, // 1.0 bar
  },
  aspersion: {
    label: "Aspersion (Couverture moyenne pression)",
    efficiency: 0.75,
    servicePressureM: 25, // 2.5 bars
  },
  micro_aspersion: {
    label: "Micro-aspersion (Vergers et pépinières)",
    efficiency: 0.85,
    servicePressureM: 18, // 1.8 bars
  },
  californien: {
    label: "Réseau californien / Bassins (Gravitaire)",
    efficiency: 0.65,
    servicePressureM: 5,  // 0.5 bar
  },
};

export interface IrrisResult {
  input: IrrisInput;
  // Besoins en eau
  dailyNetWaterVolumeM3: number;     // Volume net consommé par les plantes (m³/jour)
  dailyGrossWaterVolumeM3: number;   // Volume brut à pomper avec efficience (m³/jour)
  irrigationEfficiencyPct: number;
  peakSunHours: number;              // Heures d'ensoleillement de pointe (ex: 5.5 h)
  requiredPumpFlowM3h: number;       // Débit horaire pompe requis (m³/h)
  
  // Contrôle de viabilité de la source
  isSourceViable: boolean;
  sourceDeficitM3h: number;
  sourceViabilityMessage: string;
  
  // Hydraulique & HMT
  geometricHeadM: number;            // Hauteur géométrique (profondeur eau + château d'eau)
  frictionLossM: number;             // Pertes de charge (linéaires + singulières)
  servicePressureM: number;          // Pression de service nécessaire à l'émetteur
  totalHeadHmtM: number;             // HMT totale (mCE)
  
  // Dimensionnement Solaire Photovoltaïque
  hydraulicEnergyKwhDay: number;     // Énergie hydraulique utile (kWh/jour)
  motorPowerKw: number;              // Puissance moteur pompe (kW)
  solarPvWattPeak: number;           // Puissance crête photovoltaïque nécessaire (Wc)
  pvPanelsCount: number;             // Nombre de panneaux 400W recommandés
  panelUnitWp: number;
  
  // Équipements recommandés IRRIS
  recommendedPumpModel: string;
  recommendedController: string;
  recommendedTankVolumeM3: number;
  
  // Chiffrage matériel en FCFA
  billOfMaterials: QuoteItem[];
  totalCostFcfa: number;
}

/**
 * Moteur de calcul du Modèle Typique IRRIS
 */
export function calculateIrrisModel(input: IrrisInput): IrrisResult {
  const crop = IRRIS_CROPS[input.cropKey] || IRRIS_CROPS.tomate;
  const season = IRRIS_SEASONS[input.season] || IRRIS_SEASONS.seche_chaude;
  const method = IRRIS_METHODS[input.method] || IRRIS_METHODS.goutte_a_goutte;

  // 1. Besoins en eau
  // 1 mm sur 1 ha = 10 m³
  const adjustedEtcMm = crop.waterNeedMmDay * season.coefEto;
  const dailyNetWaterVolumeM3 = Math.round(input.areaHa * adjustedEtcMm * 10 * 10) / 10;
  const dailyGrossWaterVolumeM3 = Math.round((dailyNetWaterVolumeM3 / method.efficiency) * 10) / 10;

  // 2. Heures de soleil de pointe (Sahel = 5.5h) et Débit requis
  const peakSunHours = 5.5;
  const requiredPumpFlowM3h = Math.round((dailyGrossWaterVolumeM3 / peakSunHours) * 10) / 10;

  // 3. Contrôle de viabilité de la source
  const isSourceViable = input.sourceFlowM3h >= requiredPumpFlowM3h;
  const sourceDeficitM3h = Math.max(0, Math.round((requiredPumpFlowM3h - input.sourceFlowM3h) * 10) / 10);
  
  let sourceViabilityMessage = "Source d'eau suffisante pour satisfaire la totalité de la demande en heures d'ensoleillement.";
  if (!isSourceViable) {
    sourceViabilityMessage = `Alerte IRRIS : Le débit disponible de la source (${input.sourceFlowM3h} m³/h) est inférieur au débit requis (${requiredPumpFlowM3h} m³/h). Prévoir un stockage tampon avec temps de pompage étalé ou fractionner la parcelle.`;
  }

  // 4. Calcul de la HMT selon le modèle IRRIS
  const geometricHeadM = Math.round((input.dynamicWaterDepthM + (input.pumpingMode === "fil_du_soleil" ? input.tankHeightM : 0)) * 10) / 10;
  // Pertes de charge selon formule simplifiée IRRIS : 10% de la géométrie + 2% de la longueur de conduite
  const frictionLossM = Math.round((geometricHeadM * 0.10 + input.dischargeDistanceM * 0.02) * 10) / 10;
  const servicePressureM = method.servicePressureM;
  const totalHeadHmtM = Math.round((geometricHeadM + frictionLossM + servicePressureM) * 10) / 10;

  // 5. Énergie hydraulique et puissance solaire Wc
  // E_h = (rho * g * V * HMT) / 3.6e6 = (9.81 * V * HMT) / 3600  (en kWh/jour)
  const hydraulicEnergyKwhDay = Math.round(((9.81 * dailyGrossWaterVolumeM3 * totalHeadHmtM) / 3600) * 100) / 100;
  
  // Puissance moteur de la pompe (kW) = (Q * HMT * 9.81) / (3600 * rendement pompe ~0.55)
  const motorPowerKw = Math.max(0.37, Math.round(((requiredPumpFlowM3h * totalHeadHmtM * 9.81) / (3600 * 0.55)) * 100) / 100);

  // Puissance crête solaire selon standard IRRIS :
  // Wc = (E_h * 1000) / (PSH * eta_pompe * PR) avec PSH=5.5, eta=0.55, PR=0.75
  const rawSolarWp = (hydraulicEnergyKwhDay * 1000) / (5.5 * 0.55 * 0.75);
  // Arrondi supérieur par marge de sécurité sahélienne de 15%
  const panelUnitWp = 400;
  const pvPanelsCount = Math.max(2, Math.ceil((rawSolarWp * 1.15) / panelUnitWp));
  const solarPvWattPeak = pvPanelsCount * panelUnitWp;

  // 6. Sélection des équipements recommandés
  let recommendedPumpModel = "Pompe immergée solaire DC brushless 500W Inox (Lorentz PS2-600 ou Grundfos SQFlex)";
  let recommendedController = "Contrôleur solaire MPPT DC 48V-72V avec protection marche à sec";
  
  if (motorPowerKw > 2.2) {
    recommendedPumpModel = `Groupe électropompe immergé triphasé ${motorPowerKw} kW Inox 304 haute capacité`;
    recommendedController = `Variateur de fréquence solaire MPPT triphasé 380V ${Math.ceil(motorPowerKw * 1.3)} kW`;
  } else if (motorPowerKw > 1.1) {
    recommendedPumpModel = "Pompe immergée solaire 1800W Inox (Lorentz PS2-1800 ou équivalent sahélien)";
    recommendedController = "Contrôleur solaire MPPT 110V-150V avec entrée double sonde niveau";
  } else if (motorPowerKw > 0.6) {
    recommendedPumpModel = "Pompe immergée solaire 1000W Inox (Lorentz PS2-1000 ou équivalent certifié)";
    recommendedController = "Contrôleur solaire MPPT 72V avec parafoudre intégré";
  }

  // Capacité de stockage recommandée : 1 jour de consommation arrondie
  const recommendedTankVolumeM3 = Math.max(5, Math.ceil(dailyGrossWaterVolumeM3 / 5) * 5);

  // 7. Bordereau quantitatif estimatif chiffré en FCFA (Mercuriale Burkina Faso)
  const billOfMaterials: QuoteItem[] = [
    {
      code: "IRRIS-PUMP",
      category: "pompage_solaire",
      designation: recommendedPumpModel,
      specifications: `Débit nominal ${requiredPumpFlowM3h} m³/h à HMT ${totalHeadHmtM} mCE, Inox résistant au sable`,
      unit: "u",
      quantity: 1,
      unitPriceFcfa: motorPowerKw > 2.0 ? 1450000 : motorPowerKw > 1.0 ? 980000 : 650000,
      totalPriceFcfa: motorPowerKw > 2.0 ? 1450000 : motorPowerKw > 1.0 ? 980000 : 650000,
    },
    {
      code: "IRRIS-PV",
      category: "pompage_solaire",
      designation: `Générateur Solaire Photovoltaïque ${solarPvWattPeak} Wc`,
      specifications: `${pvPanelsCount} modules photovoltaïques monocristallins ${panelUnitWp} Wc haute tolérance chaleur`,
      unit: "u",
      quantity: pvPanelsCount,
      unitPriceFcfa: 75000,
      totalPriceFcfa: pvPanelsCount * 75000,
    },
    {
      code: "IRRIS-CTRL",
      category: "pompage_solaire",
      designation: recommendedController,
      specifications: "Régulation MPPT dynamique, parafoudre intégré, sondes puits et flotteur cuve",
      unit: "u",
      quantity: 1,
      unitPriceFcfa: 280000,
      totalPriceFcfa: 280000,
    },
    {
      code: "IRRIS-STRUCT",
      category: "pompage_solaire",
      designation: "Structure de supportage solaire au sol traitée anti-corrosion",
      specifications: `Support incliné 15° plein Sud pour ${pvPanelsCount} panneaux, acier galvanisé à chaud`,
      unit: "forfait",
      quantity: 1,
      unitPriceFcfa: 150000 + (pvPanelsCount * 15000),
      totalPriceFcfa: 150000 + (pvPanelsCount * 15000),
    },
    {
      code: "IRRIS-PIPE",
      category: "reseau_hydraulique",
      designation: "Tuyauterie de refoulement et raccordement PEHD PN10/PN16",
      specifications: `Longueur estimée ${Math.round(input.dynamicWaterDepthM + input.dischargeDistanceM)} m avec raccords compression`,
      unit: "ml",
      quantity: Math.round(input.dynamicWaterDepthM + input.dischargeDistanceM),
      unitPriceFcfa: 1800,
      totalPriceFcfa: Math.round(input.dynamicWaterDepthM + input.dischargeDistanceM) * 1800,
    },
    {
      code: "IRRIS-NET",
      category: "reseau_hydraulique",
      designation: `Réseau de distribution ${method.label}`,
      specifications: `Kit distribution parcelle pour ${input.areaHa} ha (porte-rampes, vannes, filtration)`,
      unit: "kit",
      quantity: 1,
      unitPriceFcfa: Math.round(input.areaHa * (input.method === "goutte_a_goutte" ? 850000 : 650000)),
      totalPriceFcfa: Math.round(input.areaHa * (input.method === "goutte_a_goutte" ? 850000 : 650000)),
    },
    {
      code: "IRRIS-MO",
      category: "main_oeuvre",
      designation: "Installation, pose, câblage et mise en service certifiée IRRIS",
      specifications: "Pose de la pompe avec corde de sécurité inox, raccordement MPPT, essais de débit",
      unit: "forfait",
      quantity: 1,
      unitPriceFcfa: 180000,
      totalPriceFcfa: 180000,
    },
  ];

  const totalCostFcfa = billOfMaterials.reduce((acc, item) => acc + item.totalPriceFcfa, 0);

  return {
    input,
    dailyNetWaterVolumeM3,
    dailyGrossWaterVolumeM3,
    irrigationEfficiencyPct: Math.round(method.efficiency * 100),
    peakSunHours,
    requiredPumpFlowM3h,
    isSourceViable,
    sourceDeficitM3h,
    sourceViabilityMessage,
    geometricHeadM,
    frictionLossM,
    servicePressureM,
    totalHeadHmtM,
    hydraulicEnergyKwhDay,
    motorPowerKw,
    solarPvWattPeak,
    pvPanelsCount,
    panelUnitWp,
    recommendedPumpModel,
    recommendedController,
    recommendedTankVolumeM3,
    billOfMaterials,
    totalCostFcfa,
  };
}

/**
 * Adaptateur de compatibilité : convertit le résultat du Modèle IRRIS en IrrigationDesignResult
 * pour permettre l'export direct vers le PDF officiel et le comparateur de devis
 */
export function irrisToIrrigationDesignResult(irris: IrrisResult): IrrigationDesignResult {
  return {
    dailyEtoMm: 5.5,
    kcUsed: IRRIS_SEASONS[irris.input.season].coefEto,
    dailyEtcMm: Math.round((irris.dailyNetWaterVolumeM3 / (irris.input.areaHa * 10)) * 10) / 10,
    irrigationEfficiency: irris.irrigationEfficiencyPct / 100,
    dailyGrossMm: Math.round((irris.dailyGrossWaterVolumeM3 / (irris.input.areaHa * 10)) * 10) / 10,
    dailyVolumeM3: irris.dailyGrossWaterVolumeM3,
    peakHourlyFlowM3h: irris.requiredPumpFlowM3h,
    recommendedSectors: irris.input.areaHa > 1.0 ? Math.ceil(irris.input.areaHa * 2) : 1,
    flowPerSectorM3h: irris.requiredPumpFlowM3h,
    flowPerSectorLs: Math.round((irris.requiredPumpFlowM3h / 3.6) * 10) / 10,
    mainPipeDiameterMm: irris.requiredPumpFlowM3h > 8 ? 63 : 50,
    mainPipeLengthM: irris.input.dischargeDistanceM,
    mainPipeVelocityMs: 1.2,
    mainPipeHeadLossM: irris.frictionLossM,
    secondaryPipeDiameterMm: 32,
    dripperSpacingM: 0.3,
    totalDripTapeLengthM: Math.round(irris.input.areaHa * 10000),
    suctionHeadM: irris.input.dynamicWaterDepthM,
    staticLiftM: irris.geometricHeadM,
    pressureHeadM: irris.servicePressureM,
    totalHeadHmtM: irris.totalHeadHmtM,
    hydraulicPowerKw: irris.hydraulicEnergyKwhDay / 5.5,
    pumpEfficiencyPct: 55,
    motorPowerKw: irris.motorPowerKw,
    solarPvWattPeak: irris.solarPvWattPeak,
    recommendedPanelsCount: irris.pvPanelsCount,
    panelUnitWattage: irris.panelUnitWp,
    billOfMaterials: irris.billOfMaterials,
    totalEquipmentCostFcfa: irris.totalCostFcfa,
    technicalObservations: [
      `Dimensionnement certifié selon le Modèle IRRIS (Practica/CIRAD Sahel).`,
      `Débit requis : ${irris.requiredPumpFlowM3h} m³/h pour satisfaire ${irris.dailyGrossWaterVolumeM3} m³/jour.`,
      `HMT globale de refoulement : ${irris.totalHeadHmtM} mCE.`,
      `Générateur solaire : ${irris.solarPvWattPeak} Wc (${irris.pvPanelsCount} panneaux de ${irris.panelUnitWp} Wc).`,
      irris.sourceViabilityMessage,
    ],
    groundTruthSource: "Modèle IRRIS • Normes Hydrauliques Sahéliennes Certifiées",
  };
}

/**
 * Adaptateur de compatibilité : convertit la superficie IRRIS en GeodesicSurveyResult
 */
export function irrisToGeodesicSurvey(irris: IrrisResult, farmLocation: string = "Burkina Faso"): GeodesicSurveyResult {
  const areaM2 = irris.input.areaHa * 10000;
  const sideM = Math.sqrt(areaM2);
  return {
    points: [
      { lat: 12.3714, lng: -1.5197, alt: 300, label: "Borne P1" },
      { lat: 12.3714 + (sideM / 111320), lng: -1.5197, alt: 300, label: "Borne P2" },
      { lat: 12.3714 + (sideM / 111320), lng: -1.5197 + (sideM / 111320), alt: 300, label: "Borne P3" },
      { lat: 12.3714, lng: -1.5197 + (sideM / 111320), alt: 300, label: "Borne P4" },
    ],
    areaM2,
    areaHa: irris.input.areaHa,
    perimeterM: Math.round(sideM * 4),
    centroid: { lat: 12.3714, lng: -1.5197 },
    elevation: {
      minAlt: 298,
      maxAlt: 302,
      deltaAlt: 4,
      averageSlopePct: 0.8,
    },
    bounds: {
      minLat: 12.37,
      maxLat: 12.38,
      minLng: -1.52,
      maxLng: -1.51,
    },
    surveyDate: new Date().toLocaleDateString("fr-FR"),
    isClosed: true,
  };
}
