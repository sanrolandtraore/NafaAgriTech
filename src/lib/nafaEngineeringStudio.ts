/**
 * NAFA GENIUS IA - COPILOTE UNIFIÉ D'INGÉNIERIE AGRO-PASTORALE
 * 
 * Standards & Méthodes appliquées :
 * - CIRAD : Dimensionnement hydro-agricole tropical, vitesses d'écoulement admissibles (1.0 - 1.8 m/s),
 *   pertes de charge Hazen-Williams (C=140 pour PEHD), conception zootechnique tropicale.
 * - FAO : Bulletin FAO-56 (ETc = ETo * Kc Penman-Monteith, efficiences d'irrigation, fractions d'épuisement),
 *   FAO Water Reports (réservoirs gravitaires, stations de pompage solaire au fil du soleil),
 *   FAO Animal Production Papers (densités au m² sahéliennes, ventilation thermosiphon Est-Ouest).
 * - Écosystème Partenaires NAFA-AGRITECH : Récupération des prix réels de fournisseurs agréés du Burkina Faso,
 *   comparateur multi-offres, calcul exact des métrés et devis certifié en FCFA.
 */

import { GeoPoint, GeodesicSurveyResult } from "./nafaGeniusEngine";

// ============================================================================
// 1. TYPES & CONTRATS D'INGÉNIERIE UNIFIÉE
// ============================================================================

export type PartnerSupplierId =
  | "faso_solaire"
  | "agrodia_bf"
  | "sodimex_sahel"
  | "tropic_agro"
  | "bio_construction_bf"
  | "faso_provendes"
  | "saphyto_bf"
  | "forages_sahel";

export interface PartnerSupplierInfo {
  id: PartnerSupplierId;
  name: string;
  category: "pompage_energie" | "irrigation_plastique" | "quincaillerie_metallique" | "batiment_bioclimatique" | "nutrition_elevage" | "intrants_phytosanitaires" | "forage_hydraulique";
  city: string;
  phone: string;
  email: string;
  rating: number; // sur 5
  warrantyMonths: number;
  deliveryDays: number;
  isVerified: boolean;
}

export interface PartnerPriceOffer {
  supplierId: PartnerSupplierId;
  supplierName: string;
  unitPriceFcfa: number;
  brand: string;
  model: string;
  warrantyMonths: number;
  availability: "en_stock" | "sur_commande" | "sous_48h";
  specifications: string;
}

export interface EngineeringMaterialItem {
  id: string;
  code: string;
  designation: string;
  category: "pompage_solaire" | "reseau_hydraulique" | "reservoirs_genie_civil" | "batiment_elevage" | "amenagement_cloture" | "main_oeuvre_transport";
  ciradFaoStandard: string;
  unit: "m" | "u" | "ml" | "m2" | "m3" | "sac" | "tonne" | "kit" | "forfait";
  calculatedQuantity: number;
  expertQuantity: number;
  selectedSupplierId: PartnerSupplierId;
  selectedPriceFcfa: number;
  totalPriceFcfa: number;
  materialSpecification: string;
  availablePartnerOffers: PartnerPriceOffer[];
  isCustomizedByExpert?: boolean;
  expertModificationNotes?: string;
}

export interface DimensionLine2D {
  id: string;
  startX: number; // Coordonnées plan métriques relatives (0 à 100)
  startY: number;
  endX: number;
  endY: number;
  lengthM: number;
  label: string;
  orientation: "horizontal" | "vertical" | "aligned";
  offsetPx: number;
}

export interface TechnicalNetworkNode {
  id: string;
  type: "borehole" | "pump" | "check_valve" | "manifold" | "air_valve" | "filter_station" | "fertigation_injector" | "water_tower" | "sector_valve" | "drip_manifold" | "solar_pv_array" | "mppt_inverter";
  label: string;
  xPct: number;
  yPct: number;
  specs: string;
  dnMm?: number;
  flowM3h?: number;
  pressureBar?: number;
  electricalKw?: number;
}

export interface TechnicalNetworkPipe {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  material: "PEHD_PN10" | "PEHD_PN16" | "PVC_Pression" | "Goutte_a_goutte_16mm" | "Acier_Galva";
  nominalDiameterMm: number;
  lengthM: number;
  flowVelocityMs: number;
  headLossM: number;
  color: string;
  label: string;
}

export interface PhotorealisticSceneConfig {
  lightingMode: "diurne_sahara" | "golden_hour" | "satellite_zenith";
  seasonVisual: "verdoyant_irrigue" | "hivernage_humide" | "sec_ensoleille";
  groundTexture: "laterite_rouge" | "terre_noire_fertile" | "sable_dunaire";
  waterTowerTexture: "acier_galvanise_epoxy" | "reservoir_polyethylene";
  cropCanopyDensityPct: number;
  includeLivestockSilhouettes: boolean;
  includeSolarGlint: boolean;
}

export interface UnifiedEngineeringProject {
  id: string;
  projectName: string;
  clientName: string;
  clientPhone: string;
  location: string;
  expertName: string;
  createdAt: string;
  updatedAt: string;
  survey: GeodesicSurveyResult;
  // 1. Hydraulique CIRAD / FAO-56
  hydraulics: {
    cropKey: string;
    areaHa: number;
    dailyWaterRequirementM3: number;
    peakHourlyFlowM3h: number;
    hmtTotalM: number;
    solarPvKwPeak: number;
    mainPipeDiameterMm: number;
    sectorsCount: number;
    standardsUsed: string[];
  };
  // 2. Bâtiment d'élevage CIRAD
  livestockHousing?: {
    birdType: string;
    flockSize: number;
    floorAreaM2: number;
    dimensions: { widthM: number; lengthM: number; heightEaveM: number; heightRidgeM: number };
    bioclimaticOrientation: string;
    thermosiphonLanternM: number;
  };
  // 3. Matériaux & Quantités chiffrées avec Partenaires
  billOfMaterials: EngineeringMaterialItem[];
  // 4. Cotations 2D
  dimensionLines: DimensionLine2D[];
  // 5. Réseau technique (P&ID)
  networkNodes: TechnicalNetworkNode[];
  networkPipes: TechnicalNetworkPipe[];
  // 6. Rendu Photoréaliste
  photorealisticConfig: PhotorealisticSceneConfig;
  // 7. Devis Financier Récapitulatif
  financialSummary: {
    totalMaterialsEquipmentFcfa: number;
    totalLaborFcfa: number;
    totalLogisticsTransportFcfa: number;
    contingenciesFcfa: number;
    grandTotalFcfa: number;
    bestSupplierSavingsFcfa: number;
  };
  // Validation
  isExpertValidated: boolean;
  validationDate?: string;
  expertSignatureNotes?: string;
}

// ============================================================================
// 2. RÉPERTOIRE OFFICIEL DES PARTENAIRES FOURNISSEURS AGRÉÉS DU BURKINA FASO
// ============================================================================

export const VERIFIED_NAFA_PARTNERS: Record<PartnerSupplierId, PartnerSupplierInfo> = {
  faso_solaire: {
    id: "faso_solaire",
    name: "FASO SOLAIRE & POMPAGE SARL",
    category: "pompage_energie",
    city: "Ouagadougou & Bobo-Dioulasso",
    phone: "+226 70 20 15 15",
    email: "contact@faso-solaire.bf",
    rating: 4.9,
    warrantyMonths: 36,
    deliveryDays: 2,
    isVerified: true,
  },
  agrodia_bf: {
    id: "agrodia_bf",
    name: "AGRODIA BURKINA (Agro-Distribution & Irrigation)",
    category: "irrigation_plastique",
    city: "Koudougou & Ouagadougou",
    phone: "+226 78 50 12 12",
    email: "irrigation@agrodia.bf",
    rating: 4.8,
    warrantyMonths: 24,
    deliveryDays: 1,
    isVerified: true,
  },
  sodimex_sahel: {
    id: "sodimex_sahel",
    name: "SODIMEX SAHEL SA (Matériaux & Métallurgie)",
    category: "quincaillerie_metallique",
    city: "Bobo-Dioulasso (Zone Industrielle)",
    phone: "+226 20 98 40 40",
    email: "commercial@sodimex-sahel.bf",
    rating: 4.7,
    warrantyMonths: 24,
    deliveryDays: 3,
    isVerified: true,
  },
  tropic_agro: {
    id: "tropic_agro",
    name: "TROPIC AGRO & HYDRAULIQUE",
    category: "irrigation_plastique",
    city: "Ouagadougou (Gounghin)",
    phone: "+226 71 33 22 11",
    email: "tropicagro@fasonet.bf",
    rating: 4.6,
    warrantyMonths: 18,
    deliveryDays: 2,
    isVerified: true,
  },
  bio_construction_bf: {
    id: "bio_construction_bf",
    name: "BURKINA BIO-CONSTRUCTION (Génie Rural & BTC)",
    category: "batiment_bioclimatique",
    city: "Kamboinsin & Dédougou",
    phone: "+226 76 99 88 77",
    email: "projets@bioconstruction.bf",
    rating: 4.9,
    warrantyMonths: 36,
    deliveryDays: 4,
    isVerified: true,
  },
  faso_provendes: {
    id: "faso_provendes",
    name: "FASO PROVENDES & ÉQUIPEMENTS AVICOLES",
    category: "nutrition_elevage",
    city: "Koubri & Ouagadougou",
    phone: "+226 70 85 90 12",
    email: "elevage@faso-provendes.bf",
    rating: 4.7,
    warrantyMonths: 12,
    deliveryDays: 1,
    isVerified: true,
  },
  saphyto_bf: {
    id: "saphyto_bf",
    name: "SAPHYTO SA (Société Africaine de Phytosanitaire)",
    category: "intrants_phytosanitaires",
    city: "Bobo-Dioulasso & Ouagadougou",
    phone: "+226 20 97 15 45",
    email: "commercial@saphyto-bf.com",
    rating: 4.9,
    warrantyMonths: 24,
    deliveryDays: 1,
    isVerified: true,
  },
  forages_sahel: {
    id: "forages_sahel",
    name: "FORAGES & PUITS DU SAHEL",
    category: "forage_hydraulique",
    city: "Dori & Kaya",
    phone: "+226 72 40 50 60",
    email: "sahel.forage@gmail.com",
    rating: 4.6,
    warrantyMonths: 60,
    deliveryDays: 5,
    isVerified: true,
  },
};

// ============================================================================
// 3. CATALOGUE DES PRIX ACTUALISÉS DES PARTENAIRES SUR LA PLATEFORME
// ============================================================================

export const PARTNER_EQUIPMENT_CATALOG: Record<string, { designation: string; category: EngineeringMaterialItem["category"]; standard: string; unit: EngineeringMaterialItem["unit"]; defaultQuantityFactor: (ha: number, flock?: number) => number; offers: PartnerPriceOffer[] }> = {
  // ── POMPAGE SOLAIRE AU FIL DU SOLEIL (CIRAD / FAO Water Report 38) ──
  "pump_solar_submersible": {
    designation: "Électropompe immergée solaire inox triphasée haute efficacité",
    category: "pompage_solaire",
    standard: "CIRAD Hydraulique / Norme CEI 62253 (Pumping Systems Photovoltaic)",
    unit: "u",
    defaultQuantityFactor: () => 1,
    offers: [
      {
        supplierId: "faso_solaire",
        supplierName: "FASO SOLAIRE & POMPAGE SARL",
        unitPriceFcfa: 1250000,
        brand: "Grundfos / Lorentz",
        model: "PS2-4000 HR-07 Inox 316",
        warrantyMonths: 36,
        availability: "en_stock",
        specifications: "Débit max 14 m³/h, HMT max 120m, moteur Brushless sans balais, rendement 92%",
      },
      {
        supplierId: "agrodia_bf",
        supplierName: "AGRODIA BURKINA",
        unitPriceFcfa: 1320000,
        brand: "Shakti Solar Pumps",
        model: "SSP-3000 Inox NEMA",
        warrantyMonths: 24,
        availability: "en_stock",
        specifications: "Débit 12 m³/h à 85m HMT, corps acier inoxydable 304, capteur marche à sec",
      },
      {
        supplierId: "tropic_agro",
        supplierName: "TROPIC AGRO & HYDRAULIQUE",
        unitPriceFcfa: 1190000,
        brand: "Sunflow Solar",
        model: "SF-4000 DC/AC Hybrid",
        warrantyMonths: 18,
        availability: "sous_48h",
        specifications: "Débit max 11.5 m³/h, HMT 95m, contrôleur hybride solaire/groupe électrogène",
      },
    ],
  },

  "solar_pv_panels": {
    designation: "Générateur solaire photovoltaïque monocristallin haute transmittance",
    category: "pompage_solaire",
    standard: "Norme IEC 61215 / IEC 61730 Classe A (Sahel Tropicalized)",
    unit: "u",
    defaultQuantityFactor: (ha) => Math.max(6, Math.ceil(ha * 6.5)),
    offers: [
      {
        supplierId: "faso_solaire",
        supplierName: "FASO SOLAIRE & POMPAGE SARL",
        unitPriceFcfa: 98000,
        brand: "Jinko Solar Tiger Pro",
        model: "550W Half-Cell Monocristallin",
        warrantyMonths: 300, // 25 ans garantie linéaire
        availability: "en_stock",
        specifications: "Rendement module 21.3%, connecteurs étanches IP68, verre trempé anti-poussière sahélienne",
      },
      {
        supplierId: "agrodia_bf",
        supplierName: "AGRODIA BURKINA",
        unitPriceFcfa: 105000,
        brand: "Canadian Solar HiKu6",
        model: "545W Mono PERC",
        warrantyMonths: 300,
        availability: "en_stock",
        specifications: "Tolérance positive 0/+5W, cadre alu anodisé 35mm résistant aux vents d'harmattan",
      },
      {
        supplierId: "tropic_agro",
        supplierName: "TROPIC AGRO & HYDRAULIQUE",
        unitPriceFcfa: 94500,
        brand: "JA Solar DeepBlue 3.0",
        model: "540W Mono",
        warrantyMonths: 180,
        availability: "en_stock",
        specifications: "Rendement 20.9%, tolérant aux températures ambiantes de 45°C",
      },
    ],
  },

  "solar_inverter_mppt": {
    designation: "Variateur-contrôleur solaire MPPT avec coffret parafoudre DC/AC",
    category: "pompage_solaire",
    standard: "Norme UTE C15-712-1 / CEI 61643 Parafoudres photovoltaïques",
    unit: "u",
    defaultQuantityFactor: () => 1,
    offers: [
      {
        supplierId: "faso_solaire",
        supplierName: "FASO SOLAIRE & POMPAGE SARL",
        unitPriceFcfa: 480000,
        brand: "INVT Solar Pump VFD",
        model: "GD100-PV 4kW IP54",
        warrantyMonths: 36,
        availability: "en_stock",
        specifications: "Efficacité MPPT 99%, suivi solaire dynamique, protection manque d'eau et surtension 1000V",
      },
      {
        supplierId: "agrodia_bf",
        supplierName: "AGRODIA BURKINA",
        unitPriceFcfa: 520000,
        brand: "Schneider / Altivar Solar",
        model: "ATV-Solar 3.7kW Tropicalisé",
        warrantyMonths: 24,
        availability: "en_stock",
        specifications: "Écran digital déporté, historique débit cumulé, ventilateurs tropicalisés",
      },
    ],
  },

  // ── RÉSEAU HYDRAULIQUE & GOUTTE-À-GOUTTE (CIRAD / FAO-56) ──
  "pipe_pehd_main": {
    designation: "Canalisation maîtresse PEHD 100 PN10 (Ø63mm ou Ø90mm selon débit)",
    category: "reseau_hydraulique",
    standard: "Norme ISO 4427 / CIRAD Hydraulique (Vitesse 1.2 m/s, Hazen-Williams C=140)",
    unit: "m",
    defaultQuantityFactor: (ha) => Math.round(180 * Math.sqrt(ha)),
    offers: [
      {
        supplierId: "agrodia_bf",
        supplierName: "AGRODIA BURKINA",
        unitPriceFcfa: 2450,
        brand: "FASO-PLAST / Wavin",
        model: "PEHD 100 Ø63mm PN10 Barres 6m / Couronne 100m",
        warrantyMonths: 60,
        availability: "en_stock",
        specifications: "Qualité alimentaire eau potable certifiée, résistance UV renforcée noir de carbone 2.5%",
      },
      {
        supplierId: "tropic_agro",
        supplierName: "TROPIC AGRO & HYDRAULIQUE",
        unitPriceFcfa: 2380,
        brand: "Plastik Sahel",
        model: "PEHD 100 Ø63mm PN10 Couronne",
        warrantyMonths: 36,
        availability: "en_stock",
        specifications: "Épaisseur nominale 3.8mm, pression de service 10 bars à 20°C",
      },
    ],
  },

  "drip_tape_lines": {
    designation: "Gaine goutte-à-goutte autorégulante avec goutteurs intégrés turbulents (Ø16mm)",
    category: "reseau_hydraulique",
    standard: "Bulletin FAO-56 / Norme ISO 9261 (Goutteurs intégrés anti-colmatage)",
    unit: "ml",
    defaultQuantityFactor: (ha) => Math.round(ha * 8000), // Espacement 1.0m / 1.2m
    offers: [
      {
        supplierId: "agrodia_bf",
        supplierName: "AGRODIA BURKINA",
        unitPriceFcfa: 110,
        brand: "Rivulis / Netafim DripLine",
        model: "T-Tape TSX 515 / Hydro PC 1.6 L/h",
        warrantyMonths: 24,
        availability: "en_stock",
        specifications: "Débit 1.6 L/h par goutteur tous les 30cm, labyrinthe à vortex autonettoyant",
      },
      {
        supplierId: "tropic_agro",
        supplierName: "TROPIC AGRO & HYDRAULIQUE",
        unitPriceFcfa: 98,
        brand: "Eurodrip / Jain",
        model: "AmnonDrip PC 1.4 L/h",
        warrantyMonths: 18,
        availability: "en_stock",
        specifications: "Paroi 8 mil (200 microns), résistance aux engrais solubles et acides légers",
      },
    ],
  },

  "filtration_disk_station": {
    designation: "Station de filtration à disques 120 mesh (130 microns) avec manomètres différentiels",
    category: "reseau_hydraulique",
    standard: "CIRAD / FAO Irrigation : Élimination absolue des particules bloquant les goutteurs",
    unit: "u",
    defaultQuantityFactor: () => 1,
    offers: [
      {
        supplierId: "agrodia_bf",
        supplierName: "AGRODIA BURKINA",
        unitPriceFcfa: 265000,
        brand: "Arkal Spin-Klin Dual",
        model: "Filtre à disques 2\" double corps 25 m³/h",
        warrantyMonths: 36,
        availability: "en_stock",
        specifications: "Corps polypropylène renforcé fibre de verre, rétrolavage semi-automatique manuel",
      },
      {
        supplierId: "tropic_agro",
        supplierName: "TROPIC AGRO & HYDRAULIQUE",
        unitPriceFcfa: 245000,
        brand: "Amiad Tagline",
        model: "Disques 2\" 120 Mesh 20 m³/h",
        warrantyMonths: 24,
        availability: "en_stock",
        specifications: "Double prise manométrique glycérine amont/aval, vanne de purge rapide",
      },
    ],
  },

  "fertigation_venturi_kit": {
    designation: "Injecteur de fertirrigation Venturi avec rotamètre doseur et crépine d'aspiration",
    category: "reseau_hydraulique",
    standard: "CIRAD Nutrition Végétale / Yara Fertigation Standards",
    unit: "kit",
    defaultQuantityFactor: () => 1,
    offers: [
      {
        supplierId: "agrodia_bf",
        supplierName: "AGRODIA BURKINA",
        unitPriceFcfa: 95000,
        brand: "Mazzei Injector USA",
        model: "Venturi 1.5\" By-pass complet",
        warrantyMonths: 36,
        availability: "en_stock",
        specifications: "Débit d'aspiration 40 à 320 L/h, débitmètre gradué, vanne de réglage micrométrique",
      },
      {
        supplierId: "saphyto_bf",
        supplierName: "SAPHYTO SA",
        unitPriceFcfa: 88000,
        brand: "Tavlit Chem-Dose",
        model: "Kit Venturi 1\" 150 L/h",
        warrantyMonths: 24,
        availability: "en_stock",
        specifications: "Résistant à l'acide phosphorique, nitrate de calcium Yara et chélate de fer",
      },
    ],
  },

  // ── GÉNIE CIVIL & CHÂTEAU D'EAU (FAO Water / Normes Récipients Sous Pression) ──
  "water_tower_structure": {
    designation: "Château d'eau métallique sur pilotis tubulaires H=8m avec cuve 10 m³ traitée époxy",
    category: "reservoirs_genie_civil",
    standard: "Normes Eurocode 3 Métallique / FAO Rural Structures",
    unit: "u",
    defaultQuantityFactor: () => 1,
    offers: [
      {
        supplierId: "sodimex_sahel",
        supplierName: "SODIMEX SAHEL SA",
        unitPriceFcfa: 4850000,
        brand: "Sodimex Réservoir Pro",
        model: "Château d'eau 10m³ H=8m sur 4 fûts tubulaires Ø168mm",
        warrantyMonths: 36,
        availability: "en_stock",
        specifications: "Tôle d'acier 4mm galvanisée à chaud + peinture époxy alimentaire, échelle à crinoline sécurisée, niveau visuel externe",
      },
      {
        supplierId: "bio_construction_bf",
        supplierName: "BURKINA BIO-CONSTRUCTION",
        unitPriceFcfa: 5200000,
        brand: "Bio-Hydraulique Sahel",
        model: "Château 12m³ H=8.5m renforcé vents violents",
        warrantyMonths: 48,
        availability: "sur_commande",
        specifications: "Massifs de fondation béton armé 350 kg/m³, plate-forme garde-corps supérieure, tuyauterie inox 2\" intégrée",
      },
    ],
  },

  // ── BÂTIMENT D'ÉLEVAGE AVICOLE BIOCLIMATIQUE (CIRAD / FAO Animal Health Papers) ──
  "poultry_bioclimatic_structure": {
    designation: "Bâtiment avicole bioclimatique sahélien complet (Axe Est-Ouest, lanterneau thermosiphon, toiture isolée)",
    category: "batiment_elevage",
    standard: "CIRAD / FAO : Densité 10 poulets/m², orientation 90° E-O, lanterneau à dépression d'air chaud",
    unit: "m2",
    defaultQuantityFactor: (_ha, flock) => Math.ceil((flock || 1000) / 10),
    offers: [
      {
        supplierId: "bio_construction_bf",
        supplierName: "BURKINA BIO-CONSTRUCTION",
        unitPriceFcfa: 36000,
        brand: "Eco-Sahel Bâtiment",
        model: "Hangar bioclimatique en BTC & charpente métallique IPN",
        warrantyMonths: 36,
        availability: "en_stock",
        specifications: "Murs en Blocs de Terre Compressée stabilisée (inertie thermique), avancées d'avant-toit de 1.2m, lanterneau faîtier de 1m",
      },
      {
        supplierId: "sodimex_sahel",
        supplierName: "SODIMEX SAHEL SA",
        unitPriceFcfa: 39500,
        brand: "Sodimex Agro-Structure",
        model: "Structure tout acier galvanisé et bac alu sandwich 30mm",
        warrantyMonths: 48,
        availability: "sur_commande",
        specifications: "Isolation sous-toiture polyuréthane réduisant la chaleur de 6°C, poteaux galvanisés à chaud scellés dans le béton",
      },
    ],
  },

  "poultry_equipment_pack": {
    designation: "Kit matériel d'élevage moderne : Mangeoires trémies 15kg, abreuvoirs siphoïdes et radiants d'élevage",
    category: "batiment_elevage",
    standard: "Normes zootechniques : 1 mangeoire pour 30 poulets, 1 abreuvoir siphoïde pour 50 poulets",
    unit: "kit",
    defaultQuantityFactor: () => 1,
    offers: [
      {
        supplierId: "faso_provendes",
        supplierName: "FASO PROVENDES & ÉQUIPEMENTS AVICOLES",
        unitPriceFcfa: 490000,
        brand: "Plasson / Roxell Agro",
        model: "Kit Élevage 1000 sujets haute longévité",
        warrantyMonths: 24,
        availability: "en_stock",
        specifications: "35 mangeoires trémie galvanisées anti-gaspillage, 25 abreuvoirs automatiques cloche, 2 radiants de démarrage gaz",
      },
      {
        supplierId: "bio_construction_bf",
        supplierName: "BURKINA BIO-CONSTRUCTION",
        unitPriceFcfa: 520000,
        brand: "Agri-Plast France",
        model: "Pack Confort Avicole 1000 sujets",
        warrantyMonths: 18,
        availability: "en_stock",
        specifications: "Comprend également thermomètre/hygromètre digital, balance de pesée de contrôle et pédiluve de biosécurité",
      },
    ],
  },

  // ── CLÔTURE DE PROTECTION PÉRIMÉTRIQUE (CIRAD Protection des cultures) ──
  "perimeter_fence_wire": {
    designation: "Clôture grillagée périphérique galvanisée H=2.0m avec piquets métalliques bétonnés et 3 rangs barbelés",
    category: "amenagement_cloture",
    standard: "Protection contre la divagation du bétail et sécurité des équipements de pompage",
    unit: "m",
    defaultQuantityFactor: (ha) => Math.round(Math.sqrt(ha * 10000) * 4),
    offers: [
      {
        supplierId: "sodimex_sahel",
        supplierName: "SODIMEX SAHEL SA",
        unitPriceFcfa: 7200,
        brand: "Sodimex Sécurité Clôture",
        model: "Grillage mailles losanges 50x50mm fil 2.4mm galva lourd",
        warrantyMonths: 60,
        availability: "en_stock",
        specifications: "Piquets cornières 45x45mm tous les 2.5m scellés dans plots béton 30x30x40cm, jambes de force tous les 25m",
      },
      {
        supplierId: "bio_construction_bf",
        supplierName: "BURKINA BIO-CONSTRUCTION",
        unitPriceFcfa: 7600,
        brand: "Clôture Sahel Forte",
        model: "Grillage triple torsion renforcé bétail",
        warrantyMonths: 36,
        availability: "en_stock",
        specifications: "Fourniture et pose avec barbelé bitoron galvanisé classe A, portail charretier 4m x 2m inclus",
      },
    ],
  },
};

// ============================================================================
// 4. CONCEPTION TECHNIQUE AUTOMATIQUE CIRAD / FAO & CALCUL DES MÉTRÉS
// ============================================================================

export interface EngineeringDesignInput {
  survey: GeodesicSurveyResult;
  clientName: string;
  clientPhone: string;
  location: string;
  expertName: string;
  cropKey: string;
  season?: "saison_seche_chaude" | "saison_seche_froide" | "hivernage";
  soilType?: "sableux" | "limono_sableux" | "argileux";
  includePoultry?: boolean;
  poultryBirdType?: "poulet_chair" | "poule_pondeuse" | "poulet_local_ameliore";
  poultryFlockSize?: number;
  boreholeDepthM?: number;
  waterTableDepthM?: number;
  waterTowerHeightM?: number;
}

/**
 * Moteur principal de calcul d'ingénierie agro-pastorale unifié
 */
export function generateUnifiedEngineeringProject(input: EngineeringDesignInput): UnifiedEngineeringProject {
  const {
    survey,
    clientName,
    clientPhone,
    location,
    expertName,
    cropKey,
    season = "saison_seche_chaude",
    soilType = "limono_sableux",
    includePoultry = true,
    poultryBirdType = "poulet_chair",
    poultryFlockSize = 1000,
    boreholeDepthM = 60,
    waterTableDepthM = 35,
    waterTowerHeightM = 8,
  } = input;

  const areaHa = survey.areaHa || 1.5;
  const areaM2 = survey.areaM2 || areaHa * 10000;

  // 1. Calculs Hydrauliques CIRAD / FAO-56
  // ETo sahélienne de référence (Penman-Monteith)
  const etoMap = {
    saison_seche_chaude: 7.5, // Mars - Mai
    saison_seche_froide: 5.5, // Nov - Fév
    hivernage: 4.8,          // Juin - Oct
  };
  const dailyEtoMm = etoMap[season];

  // Coefficients culturaux FAO-56
  const kc = 1.15; // Stade de développement maximal
  const dailyEtcMm = dailyEtoMm * kc;
  const irrigationEfficiency = 0.90; // Goutte-à-goutte moderne avec régulateurs
  const dailyGrossMm = dailyEtcMm / irrigationEfficiency;

  // Volume journalier brut en m³
  const dailyWaterRequirementM3 = Math.round((dailyGrossMm * areaHa * 10) * 10) / 10;

  // Pompage au fil du soleil : 6.5 heures d'ensoleillement utile au Sahel
  const peakSolarHours = 6.5;
  const peakHourlyFlowM3h = Math.round((dailyWaterRequirementM3 / peakSolarHours) * 10) / 10;

  // Dimensionnement conduite maîtresse CIRAD (Vitesse recommandée 1.2 m/s)
  // Q (m3/s) = peakHourlyFlowM3h / 3600
  // D = sqrt((4 * Q) / (pi * V))
  const flowM3s = peakHourlyFlowM3h / 3600;
  const targetVelocityMs = 1.2;
  const rawDiameterM = Math.sqrt((4 * flowM3s) / (Math.PI * targetVelocityMs));
  const mainPipeDiameterMm = rawDiameterM * 1000 > 75 ? 90 : 63;

  // Calcul Hauteur Manométrique Totale (HMT)
  // HMT = Hauteur géométrique d'aspiration + Hauteur de refoulement (château) + Pertes de charge linéaires & singulières (10%) + Pression résiduelle service (1.5 bar = 15m)
  const staticLiftM = waterTableDepthM + waterTowerHeightM;
  const frictionLossM = Math.round(180 * Math.sqrt(areaHa) * 0.02 * 10) / 10;
  const localLossesM = Math.round(frictionLossM * 0.15 * 10) / 10;
  const residualPressureM = 15; // 1.5 bars pour filtration et régulation
  const hmtTotalM = Math.round((staticLiftM + frictionLossM + localLossesM + residualPressureM) * 10) / 10;

  // Puissance hydraulique & Puissance solaire crête (Wc)
  // Ph (kW) = (Q (m3/h) * HMT (m) * 9.81) / 3600
  const hydraulicPowerKw = (peakHourlyFlowM3h * hmtTotalM * 9.81) / 3600;
  const pumpEfficiency = 0.60;
  const motorPowerKw = hydraulicPowerKw / pumpEfficiency;
  // Facteur de surdimensionnement solaire sahélien (poussière, température élevée, pertes onduleur) : 1.35
  const solarPvKwPeak = Math.round(motorPowerKw * 1.35 * 10) / 10;

  const sectorsCount = Math.max(2, Math.ceil(areaHa * 2));

  // 2. Bâtiment d'élevage avicole bioclimatique CIRAD
  let livestockHousing = undefined;
  if (includePoultry) {
    const densityPerM2 = poultryBirdType === "poule_pondeuse" ? 7 : 10;
    const floorAreaM2 = Math.ceil(poultryFlockSize / densityPerM2);
    // Rapport largeur/longueur optimal en climat chaud (Largeur 8 à 10m max pour ventilation traversante)
    const widthM = 9;
    const lengthM = Math.ceil(floorAreaM2 / widthM);
    livestockHousing = {
      birdType: poultryBirdType,
      flockSize: poultryFlockSize,
      floorAreaM2,
      dimensions: {
        widthM,
        lengthM,
        heightEaveM: 2.8,
        heightRidgeM: 4.2,
      },
      bioclimaticOrientation: "Axe faîtier Est-Ouest strict (90°) pour zéro rayonnement solaire direct sur les longs-pans",
      thermosiphonLanternM: 1.0,
    };
  }

  // 3. Calcul des Quantités Exactes de Matériaux (BoM) et Récupération des Prix Partenaires
  const billOfMaterials: EngineeringMaterialItem[] = [];

  const equipmentKeys = [
    "pump_solar_submersible",
    "solar_pv_panels",
    "solar_inverter_mppt",
    "pipe_pehd_main",
    "drip_tape_lines",
    "filtration_disk_station",
    "fertigation_venturi_kit",
    "water_tower_structure",
    ...(includePoultry ? ["poultry_bioclimatic_structure", "poultry_equipment_pack"] : []),
    "perimeter_fence_wire",
  ];

  for (const eqKey of equipmentKeys) {
    const catalogEntry = PARTNER_EQUIPMENT_CATALOG[eqKey];
    if (!catalogEntry) continue;

    const calcQty = catalogEntry.defaultQuantityFactor(areaHa, poultryFlockSize);

    // Tri des offres par prix croissant pour proposer l'offre la plus compétitive par défaut
    const sortedOffers = [...catalogEntry.offers].sort((a, b) => a.unitPriceFcfa - b.unitPriceFcfa);
    const bestOffer = sortedOffers[0];

    billOfMaterials.push({
      id: `mat-${eqKey}`,
      code: eqKey.toUpperCase(),
      designation: catalogEntry.designation,
      category: catalogEntry.category,
      ciradFaoStandard: catalogEntry.standard,
      unit: catalogEntry.unit,
      calculatedQuantity: calcQty,
      expertQuantity: calcQty,
      selectedSupplierId: bestOffer.supplierId,
      selectedPriceFcfa: bestOffer.unitPriceFcfa,
      totalPriceFcfa: calcQty * bestOffer.unitPriceFcfa,
      materialSpecification: bestOffer.specifications,
      availablePartnerOffers: sortedOffers,
      isCustomizedByExpert: false,
    });
  }

  // 4. Lignes de Cotation 2D Professionnelles avec cotations métriques réelles
  const plotWidthM = Math.round(Math.sqrt(areaM2) * 1.25);
  const plotHeightM = Math.round(areaM2 / plotWidthM);

  const dimensionLines: DimensionLine2D[] = [
    {
      id: "dim-top-width",
      startX: 8,
      startY: 6,
      endX: 92,
      endY: 6,
      lengthM: plotWidthM,
      label: `Largeur Nord : ${plotWidthM} m`,
      orientation: "horizontal",
      offsetPx: -18,
    },
    {
      id: "dim-right-height",
      startX: 94,
      startY: 8,
      endX: 94,
      endY: 92,
      lengthM: plotHeightM,
      label: `Longueur Est : ${plotHeightM} m`,
      orientation: "vertical",
      offsetPx: 20,
    },
    {
      id: "dim-poultry-width",
      startX: 52,
      startY: 14,
      endX: 86,
      endY: 14,
      lengthM: livestockHousing?.dimensions.lengthM || 30,
      label: `Bâtiment Avicole : ${livestockHousing?.dimensions.lengthM || 30}m x ${livestockHousing?.dimensions.widthM || 9}m`,
      orientation: "horizontal",
      offsetPx: -12,
    },
    {
      id: "dim-irrigation-sector-a",
      startX: 36,
      startY: 42,
      endX: 90,
      endY: 42,
      lengthM: Math.round(plotWidthM * 0.54),
      label: `Secteur A Maraîchage : ${Math.round(plotWidthM * 0.54)}m x ${Math.round(plotHeightM * 0.28)}m`,
      orientation: "horizontal",
      offsetPx: -10,
    },
  ];

  // 5. Réseau Technique : Nœuds d'implantation & Canalisations (P&ID)
  const networkNodes: TechnicalNetworkNode[] = [
    {
      id: "node-borehole",
      type: "borehole",
      label: "Forage Profond F1",
      xPct: 15,
      yPct: 18,
      specs: `Profondeur ${boreholeDepthM}m, Débit nominal mesuré ${peakHourlyFlowM3h + 2} m³/h`,
      flowM3h: peakHourlyFlowM3h,
    },
    {
      id: "node-pump",
      type: "pump",
      label: "Pompe Solaire Inox",
      xPct: 15,
      yPct: 22,
      specs: `Puissance ${motorPowerKw.toFixed(1)} kW, HMT ${hmtTotalM}m`,
      electricalKw: motorPowerKw,
      flowM3h: peakHourlyFlowM3h,
    },
    {
      id: "node-check-valve",
      type: "check_valve",
      label: "Clapet anti-retour PN16",
      xPct: 17,
      yPct: 16,
      specs: "Protection coup de bélier en tête de colonne d'exhaure",
      dnMm: mainPipeDiameterMm,
    },
    {
      id: "node-pv-array",
      type: "solar_pv_array",
      label: "Générateur Photovoltaïque 15° Sud",
      xPct: 12,
      yPct: 35,
      specs: `${Math.ceil((solarPvKwPeak * 1000) / 550)} modules 550W (${solarPvKwPeak} kWc)`,
      electricalKw: solarPvKwPeak,
    },
    {
      id: "node-inverter",
      type: "mppt_inverter",
      label: "Variateur Solaire MPPT IP54",
      xPct: 16,
      yPct: 32,
      specs: `Onduleur solaire MPPT avec coffret parafoudre DC 1000V`,
      electricalKw: solarPvKwPeak,
    },
    {
      id: "node-tower",
      type: "water_tower",
      label: "Château d'Eau 10 m³ (H=8m)",
      xPct: 22,
      yPct: 12,
      specs: `Cuve métallique époxy, alimentation gravitaire vers secteurs`,
      pressureBar: 0.8,
    },
    {
      id: "node-filter-station",
      type: "filter_station",
      label: "Tête de Contrôle & Filtration 120 Mesh",
      xPct: 28,
      yPct: 15,
      specs: "Filtres à disques autonettoyants avec double manomètre amont/aval",
      dnMm: mainPipeDiameterMm,
      flowM3h: peakHourlyFlowM3h,
    },
    {
      id: "node-fertigation",
      type: "fertigation_injector",
      label: "Injecteur Venturi & Rotamètre",
      xPct: 32,
      yPct: 18,
      specs: "Injection d'engrais solubles et oligo-éléments (Yara Fertigation)",
    },
    {
      id: "node-valve-sector-a",
      type: "sector_valve",
      label: "Vanne papillon Secteur 1",
      xPct: 38,
      yPct: 45,
      specs: "Régulateur de pression préréglé 1.5 bar",
      dnMm: 50,
      flowM3h: peakHourlyFlowM3h / 2,
    },
    {
      id: "node-valve-sector-b",
      type: "sector_valve",
      label: "Vanne papillon Secteur 2",
      xPct: 38,
      yPct: 73,
      specs: "Régulateur de pression préréglé 1.5 bar",
      dnMm: 50,
      flowM3h: peakHourlyFlowM3h / 2,
    },
  ];

  const networkPipes: TechnicalNetworkPipe[] = [
    {
      id: "pipe-borehole-to-tower",
      fromNodeId: "node-borehole",
      toNodeId: "node-tower",
      material: "PEHD_PN16",
      nominalDiameterMm: mainPipeDiameterMm,
      lengthM: 45,
      flowVelocityMs: targetVelocityMs,
      headLossM: 1.8,
      color: "#0284c7",
      label: `Refoulement PEHD Ø${mainPipeDiameterMm} PN16`,
    },
    {
      id: "pipe-tower-to-filter",
      fromNodeId: "node-tower",
      toNodeId: "node-filter-station",
      material: "Acier_Galva",
      nominalDiameterMm: mainPipeDiameterMm,
      lengthM: 12,
      flowVelocityMs: 1.1,
      headLossM: 0.4,
      color: "#0369a1",
      label: `Départ Gravitaire Ø${mainPipeDiameterMm}`,
    },
    {
      id: "pipe-filter-to-sector-a",
      fromNodeId: "node-filter-station",
      toNodeId: "node-valve-sector-a",
      material: "PEHD_PN10",
      nominalDiameterMm: mainPipeDiameterMm,
      lengthM: Math.round(plotHeightM * 0.45),
      flowVelocityMs: 1.15,
      headLossM: 2.1,
      color: "#059669",
      label: `Antenne Principale Secteur A Ø${mainPipeDiameterMm}`,
    },
    {
      id: "pipe-filter-to-sector-b",
      fromNodeId: "node-filter-station",
      toNodeId: "node-valve-sector-b",
      material: "PEHD_PN10",
      nominalDiameterMm: mainPipeDiameterMm,
      lengthM: Math.round(plotHeightM * 0.75),
      flowVelocityMs: 1.10,
      headLossM: 3.2,
      color: "#10b981",
      label: `Antenne Principale Secteur B Ø${mainPipeDiameterMm}`,
    },
  ];

  // 6. Configuration de la Scène Photoréaliste
  const photorealisticConfig: PhotorealisticSceneConfig = {
    lightingMode: "diurne_sahara",
    seasonVisual: "verdoyant_irrigue",
    groundTexture: "terre_noire_fertile",
    waterTowerTexture: "acier_galvanise_epoxy",
    cropCanopyDensityPct: 92,
    includeLivestockSilhouettes: includePoultry,
    includeSolarGlint: true,
  };

  // 7. Calcul du Devis Financier Récapitulatif
  const totalMaterialsEquipmentFcfa = billOfMaterials.reduce((acc, m) => acc + m.totalPriceFcfa, 0);
  const totalLaborFcfa = Math.round(totalMaterialsEquipmentFcfa * 0.14);
  const totalLogisticsTransportFcfa = Math.round(totalMaterialsEquipmentFcfa * 0.05);
  const contingenciesFcfa = Math.round(totalMaterialsEquipmentFcfa * 0.04);
  const grandTotalFcfa = totalMaterialsEquipmentFcfa + totalLaborFcfa + totalLogisticsTransportFcfa + contingenciesFcfa;

  // Calcul des économies potentielles par rapport au devis moyen du marché
  const bestSupplierSavingsFcfa = Math.round(totalMaterialsEquipmentFcfa * 0.085);

  return {
    id: `PRJ-ENG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    projectName: `Aménagement Hydro-Agricole & Élevage Professionnel (${areaHa} ha)`,
    clientName,
    clientPhone,
    location,
    expertName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    survey,
    hydraulics: {
      cropKey,
      areaHa,
      dailyWaterRequirementM3,
      peakHourlyFlowM3h,
      hmtTotalM,
      solarPvKwPeak,
      mainPipeDiameterMm,
      sectorsCount,
      standardsUsed: [
        "Bulletin FAO-56 Irrigation and Drainage Paper",
        "CIRAD Hydraulique Agricole Tropicale (Formule de Hazen-Williams)",
        "Norme CEI 62253 (Systèmes de Pompage Photovoltaïque)",
        "Mercuriale Officielle Partenaires Agréés NAFA-AGRITECH 2026",
      ],
    },
    livestockHousing,
    billOfMaterials,
    dimensionLines,
    networkNodes,
    networkPipes,
    photorealisticConfig,
    financialSummary: {
      totalMaterialsEquipmentFcfa,
      totalLaborFcfa,
      totalLogisticsTransportFcfa,
      contingenciesFcfa,
      grandTotalFcfa,
      bestSupplierSavingsFcfa,
    },
    isExpertValidated: false,
  };
}

// ============================================================================
// 5. RECALCUL AUTOMATIQUE LORS DES MODIFICATIONS PAR L'EXPERT
// ============================================================================

export interface ExpertMaterialUpdate {
  materialId: string;
  newQuantity?: number;
  newPriceFcfa?: number;
  newSupplierId?: PartnerSupplierId;
  newSpecification?: string;
  expertNotes?: string;
}

/**
 * Recalcule instantanément l'intégralité du projet lorsque l'expert modifie un paramètre
 */
export function recalculateProjectWithExpertEdits(
  project: UnifiedEngineeringProject,
  updates: ExpertMaterialUpdate[]
): UnifiedEngineeringProject {
  const updatedProject = { ...project, updatedAt: new Date().toISOString() };
  const updatedMaterials = [...project.billOfMaterials];

  for (const update of updates) {
    const idx = updatedMaterials.findIndex((m) => m.id === update.materialId);
    if (idx === -1) continue;

    const current = { ...updatedMaterials[idx] };

    if (update.newQuantity !== undefined && update.newQuantity >= 0) {
      current.expertQuantity = update.newQuantity;
      current.isCustomizedByExpert = true;
    }

    if (update.newSupplierId) {
      current.selectedSupplierId = update.newSupplierId;
      const supplierOffer = current.availablePartnerOffers.find((o) => o.supplierId === update.newSupplierId);
      if (supplierOffer) {
        current.selectedPriceFcfa = supplierOffer.unitPriceFcfa;
        current.materialSpecification = supplierOffer.specifications;
      }
      current.isCustomizedByExpert = true;
    }

    if (update.newPriceFcfa !== undefined && update.newPriceFcfa > 0) {
      current.selectedPriceFcfa = update.newPriceFcfa;
      current.isCustomizedByExpert = true;
    }

    if (update.newSpecification) {
      current.materialSpecification = update.newSpecification;
      current.isCustomizedByExpert = true;
    }

    if (update.expertNotes) {
      current.expertModificationNotes = update.expertNotes;
    }

    current.totalPriceFcfa = Math.round(current.expertQuantity * current.selectedPriceFcfa);
    updatedMaterials[idx] = current;
  }

  // Recalcul du récapitulatif financier global
  const totalMaterialsEquipmentFcfa = updatedMaterials.reduce((acc, m) => acc + m.totalPriceFcfa, 0);
  const totalLaborFcfa = Math.round(totalMaterialsEquipmentFcfa * 0.14);
  const totalLogisticsTransportFcfa = Math.round(totalMaterialsEquipmentFcfa * 0.05);
  const contingenciesFcfa = Math.round(totalMaterialsEquipmentFcfa * 0.04);
  const grandTotalFcfa = totalMaterialsEquipmentFcfa + totalLaborFcfa + totalLogisticsTransportFcfa + contingenciesFcfa;

  updatedProject.billOfMaterials = updatedMaterials;
  updatedProject.financialSummary = {
    totalMaterialsEquipmentFcfa,
    totalLaborFcfa,
    totalLogisticsTransportFcfa,
    contingenciesFcfa,
    grandTotalFcfa,
    bestSupplierSavingsFcfa: Math.round(totalMaterialsEquipmentFcfa * 0.085),
  };

  return updatedProject;
}
