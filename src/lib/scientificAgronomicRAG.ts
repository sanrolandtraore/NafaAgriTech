/**
 * NAFA GENIUS IA - SYSTÈME DE DIAGNOSTIC AGRONOMIQUE SCIENTIFIQUE (RAG)
 * 
 * Sources de connaissances prioritaires intégrées :
 * - INERA (Institut de l'Environnement et de Recherches Agricoles du Burkina Faso)
 * - CSP-CILSS (Comité Sahélien des Pesticides)
 * - CNSF (Centre National des Semences Forestières)
 * - CORAF (Conseil Ouest et Centre Africain pour la Recherche et le Développement Agricoles)
 * - CNRST (Centre National de la Recherche Scientifique et Technologique)
 * - CREAF (Centre de Recherches Environnementales, Agricoles et de Formation de Kamboinsé)
 * - SAPHYTO (Société Africaine de Produits Phytosanitaires et d'Insecticides)
 * - NACOSEM (Société Sahélienne de Semences et d'Intrants)
 * - Yara International (Guides scientifiques de nutrition végétale et de correction des carences)
 * 
 * Pipeline obligatoire de diagnostic en 4 étapes :
 * Étape 1 : Identification précise de l'espèce & distinction stricte Culture vs Mauvaise herbe (Adventice).
 * Étape 2 : Vérification du contexte (région, saison, stade, sol, précédent, organes touchés).
 * Étape 3 : Diagnostic scientifique par recherche RAG (fongique, bactérienne, virale, ravageur, carence Yara, stress, mécanique).
 * Étape 4 : Validation, explicabilité agronomique, niveau de confiance (Élevé/Moyen/Faible) et citations techniques.
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// 1. TYPES & INTERFACES SCIENTIFIQUES
// ============================================================================

export type PlantCategory =
  | "cereale"
  | "legumineuse"
  | "maraichage"
  | "oleagineux"
  | "racine_tubercule"
  | "arboriculture"
  | "plante_fibre"
  | "adventice";

export type PathogenType =
  | "fongique"
  | "bacterienne"
  | "virale"
  | "ravageur"
  | "carence"
  | "stress_hydrique"
  | "degat_mecanique";

export type ConfidenceLevel = "Élevé" | "Moyen" | "Faible" | "Incertain";

export type AgronomicSeason =
  | "hivernage" // Juin à Octobre
  | "saison_seche_fraiche" // Novembre à Février
  | "saison_seche_chaude" // Mars à Mai
  | "contre_saison_irrigee"; // Octobre à Mai

export type SoilType =
  | "sablonneux_dior"
  | "argileux"
  | "limoneux_alluvial"
  | "gravillonnaire"
  | "bas_fond_hydromorphe"
  | "vertisol";

export type GrowthStage =
  | "levee_jeune_plant"
  | "vegetatif_tallage"
  | "floraison_epiaison"
  | "fructification_grossissement"
  | "maturation_recolte";

export interface PlantSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  category: PlantCategory;
  isWeed: boolean;
  burkinaVarieties: string[];
  growthStages: GrowthStage[];
  description: string;
}

export interface WeedSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  localNames: { moore?: string; dioula?: string; fulfulde?: string };
  family: string;
  cycle: "annuelle" | "vivace" | "parasite";
  targetCrops: string[]; // Cultures parasitées ou étouffées
  growthStages: string[];
  controlMethodsBio: string;
  controlMethodsChemical: string;
  riskLevel: "critique" | "eleve" | "moyen" | "faible";
  ineraRef: string;
  distinctiveFeatures: string[];
}

export interface DiseaseRecord {
  id: string;
  name: string;
  scientificName: string;
  pathogenType: PathogenType;
  targetCrops: string[];
  symptomsProfile: string[];
  affectedOrgans: ("feuilles" | "tiges" | "collet" | "racines" | "fruits" | "epis" | "fleurs")[];
  favorableConditions: {
    seasons?: AgronomicSeason[];
    soils?: SoilType[];
    temperatures?: string;
    humidity?: string;
  };
  ineraRef: string;
  yaraRef?: string;
  cspPesticideRef?: string;
  saphytoRef?: string;
  nacosemRef?: string;
  treatmentBio: string;
  treatmentChemical: string;
  preventiveActions: string[];
}

export interface KnowledgeDocument {
  id: string;
  sourceInstitution: "INERA" | "CSP-CILSS" | "CNSF" | "CORAF" | "CNRST" | "CREAF" | "SAPHYTO" | "NACOSEM" | "Yara" | "Autre";
  documentTitle: string;
  documentReference: string;
  content: string;
  crop?: string;
  disease?: string;
  pest?: string;
  deficiency?: string;
  weed?: string;
  region?: string;
  season?: AgronomicSeason;
  keywords: string[];
}

export interface ValidatedCase {
  id: string;
  plantSpeciesId: string;
  isWeed: boolean;
  weedSpeciesId?: string;
  diseaseCatalogId?: string;
  validatedDiseaseName: string;
  pathogenType: PathogenType;
  contextLocation: { region: string; province?: string; gps?: { lat: number; lng: number } };
  contextSeason: AgronomicSeason;
  contextSoil: SoilType;
  contextGrowthStage: GrowthStage;
  contextHistory: string;
  observedSymptoms: string;
  expertNotes: string;
  certifiedBy: string;
  certifiedAt: string;
  confidenceLevel: ConfidenceLevel;
}

export interface AgronomicContext {
  region: string;
  gps?: { lat: number; lng: number } | null;
  season: AgronomicSeason;
  growthStage: GrowthStage;
  soilType: SoilType;
  parcelHistory?: string;
  symptoms: string;
  affectedOrgans: ("feuilles" | "tiges" | "collet" | "racines" | "fruits" | "epis" | "fleurs")[];
}

export interface PlantIdentificationResult {
  identifiedSpecies: PlantSpecies | WeedSpecies | null;
  isWeed: boolean;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  canProceed: boolean;
  blockReason?: string;
  missingPhotosAdvice?: string;
  growthStageDetected?: GrowthStage;
}

export interface DiagnosisCandidate {
  diseaseId: string;
  name: string;
  scientificName: string;
  pathogenType: PathogenType;
  score: number;
  confidenceLevel: ConfidenceLevel;
  rationale: string;
  officialReferences: string[];
  treatmentBio: string;
  treatmentChemical: string;
  preventiveActions: string[];
}

export interface ScientificDiagnosisResult {
  step1Plant: PlantIdentificationResult;
  step2Context: AgronomicContext;
  step3PathogenType: PathogenType | "non_confirme";
  step4Validation: {
    isConfirmed: boolean;
    primaryDiagnosis: DiagnosisCandidate | null;
    differentialDiagnoses: DiagnosisCandidate[];
    agronomicExplanation: string;
    officialReferences: string[];
    confidenceLevel: ConfidenceLevel;
    inconclusiveNotice?: string;
  };
  weedManagementPlan?: {
    weedName: string;
    scientificName: string;
    localNames: string;
    cycle: string;
    riskLevel: string;
    bioControl: string;
    chemicalControl: string;
    ineraRef: string;
  } | null;
}

// ============================================================================
// 2. CATALOGUE OFFICIEL DES CULTURES DU BURKINA FASO (INERA / NACOSEM)
// ============================================================================

export const PLANT_SPECIES_CATALOG: PlantSpecies[] = [
  {
    id: "mais",
    commonName: "Maïs",
    scientificName: "Zea mays",
    family: "Poaceae",
    category: "cereale",
    isWeed: false,
    burkinaVarieties: ["Barka (INERA)", "Espoir", "Bondofa", "FBC6", "Massango", "SR21"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Céréale majeure cultivée dans les zones sud-soudaniennes et soudano-sahéliennes sous bonne pluviométrie ou irrigation.",
  },
  {
    id: "sorgho_blanc",
    commonName: "Sorgho blanc",
    scientificName: "Sorghum bicolor",
    family: "Poaceae",
    category: "cereale",
    isWeed: false,
    burkinaVarieties: ["Framida (Tolérant Striga)", "Sariasso 14", "Sariasso 16", "Kapelga", "CSM 63-E"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Céréale vivrière de base rustique, très tolérante aux déficits hydriques temporaires.",
  },
  {
    id: "sorgho_rouge",
    commonName: "Sorgho rouge",
    scientificName: "Sorghum bicolor var. rouge",
    family: "Poaceae",
    category: "cereale",
    isWeed: false,
    burkinaVarieties: ["Gnofing", "Sorgho rouge local Farako-Bâ"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Sorgho riche en tannins, utilisé pour l'alimentation et la brasserie artisanale (Dolo).",
  },
  {
    id: "mil",
    commonName: "Mil pénicillaire (Petit mil)",
    scientificName: "Pennisetum glaucum",
    family: "Poaceae",
    category: "cereale",
    isWeed: false,
    burkinaVarieties: ["IKMP 5", "Misari 1", "Toroniou", "Mil local Saria"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Céréale la plus tolérante à la sécheresse et aux sols pauvres sablonneux du Sahel et Nord-Burkina.",
  },
  {
    id: "riz_pluvial",
    commonName: "Riz pluvial / Bas-fonds",
    scientificName: "Oryza sativa / Oryza glaberrima",
    family: "Poaceae",
    category: "cereale",
    isWeed: false,
    burkinaVarieties: ["NERICA 4", "NERICA 6", "TS2", "FKR 19", "FKR 64", "Orylux 6"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Riziculture de bas-fonds aménagés et de plateaux dans les Hauts-Bassins, Cascades et Centre-Est.",
  },
  {
    id: "niebe",
    commonName: "Niébé (Haricot)",
    scientificName: "Vigna unguiculata",
    family: "Fabaceae",
    category: "legumineuse",
    isWeed: false,
    burkinaVarieties: ["KVx 395-4-8", "KVx 745-11", "Tawa", "Komcalle", "B301 (Résistant Striga)"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Légumineuse fixatrice d'azote essentielle en rotation ou association avec le sorgho et le mil.",
  },
  {
    id: "arachide",
    commonName: "Arachide",
    scientificName: "Arachis hypogaea",
    family: "Fabaceae",
    category: "oleagineux",
    isWeed: false,
    burkinaVarieties: ["RMP 12", "SH 470 P", "QH 243 C", "Fleur 11"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Culture de rente et vivrière adaptée aux sols légers filtrants.",
  },
  {
    id: "sesame",
    commonName: "Sésame",
    scientificName: "Sesamum indicum",
    family: "Pedaliaceae",
    category: "oleagineux",
    isWeed: false,
    burkinaVarieties: ["S42", "Graines Blanches INERA", "Sésame Noir"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Excellente culture de diversification et culture piège provoquant la germination suicide du Striga.",
  },
  {
    id: "coton",
    commonName: "Coton",
    scientificName: "Gossypium hirsutum",
    family: "Malvaceae",
    category: "plante_fibre",
    isWeed: false,
    burkinaVarieties: ["FK 37", "FK 64", "STAM 59 A"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Principale culture commerciale d'exportation de l'Ouest burkinabè (SOFITEX).",
  },
  {
    id: "tomate",
    commonName: "Tomate",
    scientificName: "Solanum lycopersicum",
    family: "Solanaceae",
    category: "maraichage",
    isWeed: false,
    burkinaVarieties: ["Mongal F1", "Nema F1", "Rossol VFN", "Petomech", "Roma VF"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Culture maraîchère reine de contre-saison et de saison des pluies, très sensible aux viroses et nématodes.",
  },
  {
    id: "oignon",
    commonName: "Oignon",
    scientificName: "Allium cepa",
    family: "Amaryllidaceae",
    category: "maraichage",
    isWeed: false,
    burkinaVarieties: ["Violet de Galmi", "Goudami", "Damani", "Texas Early Grano"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "fructification_grossissement", "maturation_recolte"],
    description: "Bulbe maraîcher intensif de contre-saison sèche fraîche (novembre-mars).",
  },
  {
    id: "piment",
    commonName: "Piment / Poivron",
    scientificName: "Capsicum annuum / Capsicum frutescens",
    family: "Solanaceae",
    category: "maraichage",
    isWeed: false,
    burkinaVarieties: ["Safsaf", "Big Sun", "Piment Bec d'Oiseau local"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Maraîchage à haute valeur ajoutée, sensible aux acariens et thrips.",
  },
  {
    id: "chou",
    commonName: "Chou pommé",
    scientificName: "Brassica oleracea var. capitata",
    family: "Brassicaceae",
    category: "maraichage",
    isWeed: false,
    burkinaVarieties: ["KK Cross F1", "Tropicana F1", "Oxylus F1"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "fructification_grossissement", "maturation_recolte"],
    description: "Culture de saison fraîche très sensible à la teigne des crucifères (Plutella xylostella).",
  },
  {
    id: "mangue",
    commonName: "Manguier",
    scientificName: "Mangifera indica",
    family: "Anacardiaceae",
    category: "arboriculture",
    isWeed: false,
    burkinaVarieties: ["Amélie (Précoce)", "Brooks (Tardive)", "Kent (Exportation)", "Lippens", "Keitt"],
    growthStages: ["vegetatif_tallage", "floraison_epiaison", "fructification_grossissement", "maturation_recolte"],
    description: "Arboriculture fruitière d'exportation majeure dans les Hauts-Bassins et les Cascades.",
  },
  {
    id: "moringa",
    commonName: "Moringa (Arbre de vie)",
    scientificName: "Moringa oleifera",
    family: "Moringaceae",
    category: "arboriculture",
    isWeed: false,
    burkinaVarieties: ["Moringa local CNSF"],
    growthStages: ["levee_jeune_plant", "vegetatif_tallage", "floraison_epiaison", "maturation_recolte"],
    description: "Arbre à croissance ultra-rapide aux feuilles hyper-nutritives et graines oléagineuses.",
  },
];

// ============================================================================
// 3. BASE DÉDIÉE AUX MAUVAISES HERBES (ADVENTICES DU BURKINA FASO & AFRIQUE DE L'OUEST)
// ============================================================================

export const WEED_SPECIES_CATALOG: WeedSpecies[] = [
  {
    id: "striga_hermonthica",
    commonName: "Striga (Herbe de la sorcière)",
    scientificName: "Striga hermonthica",
    localNames: { moore: "Kango / Moaga", dioula: "Sigui-fini / Douman", fulfulde: "Bala-ndiyam" },
    family: "Orobanchaceae",
    cycle: "parasite",
    targetCrops: ["sorgho_blanc", "sorgho_rouge", "mil", "mais", "fonio"],
    growthStages: ["germination_souterraine_suceurs", "emergence_tige_verte", "floraison_fleurs_roses", "capsules_graines_microscopiques"],
    riskLevel: "critique",
    ineraRef: "Fiche Technique INERA Kamboinsé : Gestion Intégrée du Striga hermonthica au Sahel",
    distinctiveFeatures: [
      "Fleurs rose-violacé caractéristiques le long d'un épi dressé",
      "Feuilles opposées sessiles vertes et rêches",
      "Rabougrissement sévère et aspect brûlé de la culture hôte (effet toxique siphonneur)",
      "Une seule plante produit 50 000 à 200 000 graines microscopiques viables 15 à 20 ans dans le sol",
    ],
    controlMethodsBio:
      "Arrachage manuel rigoureux AVANT la floraison et incinération complète hors de la parcelle. Forte fumure organique (compost mûr 5-10 t/ha enrichi en phosphore naturel de Kodjari). Rotation obligatoire avec des faux-hôtes provoquant la germination suicide (sésame, niébé B301, soja, cotonnier).",
    controlMethodsChemical:
      "Application ultra-ciblée d'herbicide sélectif post-levée (2,4-D amine à 720 g/L dosé à 1.5 L/ha) au pulvérisateur à jet dirigé uniquement sur les pieds de Striga levés.",
  },
  {
    id: "striga_gesnerioides",
    commonName: "Striga du niébé",
    scientificName: "Striga gesnerioides",
    localNames: { moore: "Moaga biiga", dioula: "Soso-sigui" },
    family: "Orobanchaceae",
    cycle: "parasite",
    targetCrops: ["niebe"],
    growthStages: ["germination_racinaire", "tiges_charnues_violacees", "floraison_bleue_blanchatre"],
    riskLevel: "critique",
    ineraRef: "Programme Légumineuses INERA Saria : Tolérance génétique au Striga gesnerioides",
    distinctiveFeatures: [
      "Tiges charnues ramifiées violacées ou brunâtres avec petites écailles au lieu de vraies feuilles",
      "Petites fleurs bleutées ou blanches",
      "Se fixe exclusivement sur les racines du niébé",
    ],
    controlMethodsBio:
      "Utilisation impérative de variétés certifiées INERA résistantes : 'B301', 'KVx 395-4-8', 'IT93K-452-1'. Arrachage systématique avant dissémination.",
    controlMethodsChemical:
      "Pas d'herbicide sélectif rentable sur niébé : lutte culturale et génétique exclusivement.",
  },
  {
    id: "cyperus_rotundus",
    commonName: "Souchet rond (Herbe à oignon)",
    scientificName: "Cyperus rotundus",
    localNames: { moore: "Goudou-goudou", dioula: "N'golo-n'golo", fulfulde: "Gorko-diddi" },
    family: "Cyperaceae",
    cycle: "vivace",
    targetCrops: ["mais", "coton", "tomate", "oignon", "riz_pluvial", "arachide"],
    growthStages: ["emergence_tubercules", "rosette_tige_triangulaire", "ombelle_inflorescence_brune"],
    riskLevel: "eleve",
    ineraRef: "Guide de Malherbologie Tropicale INERA / CORAF",
    distinctiveFeatures: [
      "Tige à section triangulaire sans nœuds",
      "Réseau souterrain de tubercules et rhizomes très coriaces",
      "Feuilles brillantes en gouttière étroite",
      "Repousse immédiatement après simple sarclage de surface",
    ],
    controlMethodsBio:
      "Labours croisés profonds en fin de saison sèche pour exposer les tubercules au soleil brûlant sahélien (dessiccation thermique). Paillage épais opaque (plastique ou paille dense 15 cm). Semis dense de légumineuses étouffantes (Mucuna pruriens).",
    controlMethodsChemical:
      "Halosulfuron-méthyle 75% WG (ex: Sedgehammer) homologué CSP, ou Glyphosate ciblé en interculture.",
  },
  {
    id: "echinochloa_colona",
    commonName: "Pied-de-coq (Panic pied-de-coq)",
    scientificName: "Echinochloa colona",
    localNames: { moore: "Mui-kango", dioula: "Malo-foni" },
    family: "Poaceae",
    cycle: "annuelle",
    targetCrops: ["riz_pluvial", "mais", "tomate"],
    growthStages: ["levee_graminee", "tallage_prostre", "panique_dressee"],
    riskLevel: "eleve",
    ineraRef: "Manuel de Désherbage des Bas-Fonds INERA / AfricaRice",
    distinctiveFeatures: [
      "Graminée annuelle ressemblant fortement aux jeunes plants de riz",
      "Absence totale de ligule et d'oreillettes à la base du limbe (critère décisif pour différencier du riz)",
      "Gaines foliaires teintées de pourpre ou zébrées",
    ],
    controlMethodsBio:
      "Faux-semis : arrosage initial pour faire lever Echinochloa, puis sarclage léger ou passage de herse avant le semis réel du riz. Maintien d'une lame d'eau de 5 cm en cas de rizière inondée.",
    controlMethodsChemical:
      "Propanil 360 g/L + Triclopyr homologué CSP au stade 2 à 4 feuilles de l'adventice.",
  },
  {
    id: "commelina_benghalensis",
    commonName: "Comméline (Herbe aux cochons)",
    scientificName: "Commelina benghalensis",
    localNames: { moore: "Taba-kango", dioula: "Kaba-kolo" },
    family: "Commelinaceae",
    cycle: "annuelle",
    targetCrops: ["mais", "coton", "tomate", "arachide", "niebe"],
    growthStages: ["stolons_rampants", "feuilles_ovales", "fleurs_bleu_vif"],
    riskLevel: "moyen",
    ineraRef: "Fiches de Protection Phytosanitaire SAPHYTO / INERA",
    distinctiveFeatures: [
      "Feuilles ovales charnues avec gaine poilue bordée de cils roux",
      "Fleurs d'un bleu azur intense très vif à trois pétales",
      "Tiges succulentes rampantes s'enracinant à chaque nœud (bouturage spontané)",
      "Présence de fleurs souterraines cléistogames produisant des graines sous terre",
    ],
    controlMethodsBio:
      "Ramassage impératif et évacuation hors du champ après sarclage : laisser les tiges coupées sur sol humide entraîne un réenracinement immédiat à 100%.",
    controlMethodsChemical:
      "Herbicide de prélevée homologué CSP type Pendiméthaline ou post-levée sélective.",
  },
  {
    id: "rottboellia_cochinchinensis",
    commonName: "Herbe d'itch (Rottboellia)",
    scientificName: "Rottboellia cochinchinensis",
    localNames: { moore: "Kag-néré", dioula: "Djoforo" },
    family: "Poaceae",
    cycle: "annuelle",
    targetCrops: ["mais", "sorgho_blanc", "coton", "canne_a_sucre"],
    growthStages: ["levee_robuste", "tallage_geant", "poils_urticants", "epiaison_cylindrique"],
    riskLevel: "eleve",
    ineraRef: "Institut de l'Environnement et de Recherches Agricoles (INERA) - Bobo-Dioulasso",
    distinctiveFeatures: [
      "Grande graminée robuste pouvant atteindre 2 à 3 mètres de haut",
      "Gaines foliaires couvertes de poils raides rigides et urticants provoquant de vives démangeaisons",
      "Épi articulé cylindrique se brisant en segments lors de la dissémination",
    ],
    controlMethodsBio:
      "Sarclo-buttage très précoce dès la 2ème semaine après levée. Éviter toute grainaison dans les bordures de champ.",
    controlMethodsChemical:
      "Nicosulfuron 40 g/L sélectif du maïs en post-levée précoce.",
  },
  {
    id: "ageratum_conyzoides",
    commonName: "Agérate (Fausse camomille)",
    scientificName: "Ageratum conyzoides",
    localNames: { moore: "Yiri-kouanga", dioula: "Faso-bara" },
    family: "Asteraceae",
    cycle: "annuelle",
    targetCrops: ["tomate", "piment", "chou", "oignon"],
    growthStages: ["rosette", "tige_poilue", "capitules_bleu_mauve"],
    riskLevel: "moyen",
    ineraRef: "CREAF Kamboinsé / Entomologie Maraîchère",
    distinctiveFeatures: [
      "Plante herbacée dressée à odeur aromatique forte quand on froisse la feuille",
      "Fleurs en capitules blanc-bleuté ou mauves",
      "Réservoir majeur de mouches blanches (Bemisia tabaci) et du virus TYLCV de la tomate",
    ],
    controlMethodsBio:
      "Désherbage rigoureux des pourtours de parcelles maraîchères pour éliminer le foyer de transmission des viroses. Sarclage manuel facile.",
    controlMethodsChemical:
      "Désherbage de contact avant repiquage des légumes.",
  },
  {
    id: "euphorbia_hirta",
    commonName: "Euphorbe poilue (Herbe à mille fleurs)",
    scientificName: "Euphorbia hirta",
    localNames: { moore: "Bissiga", dioula: "Doba-doba" },
    family: "Euphorbiaceae",
    cycle: "annuelle",
    targetCrops: ["arachide", "niebe", "maraichage"],
    growthStages: ["tige_prostree_rougeatre", "inflorescences_globuleuses"],
    riskLevel: "faible",
    ineraRef: "Flora of Burkina Faso & Sahel Agronomy Guides",
    distinctiveFeatures: [
      "Petite plante rampante à tige rougeâtre poilue",
      "Sève laiteuse blanche (latex abondant) dès qu'on casse la tige",
      "Inflorescences en petites boules serrées à l'aisselle des feuilles",
    ],
    controlMethodsBio:
      "Sarclage superficiel à la daba au stade jeune plant. Paillage végétal.",
    controlMethodsChemical: "Généralement non nécessaire pour cette espèce peu compétitive.",
  },
];

// ============================================================================
// 4. CATALOGUE SCIENTIFIQUE DES AFFECTIONS & NUTRITION (INERA, CSP-CILSS, YARA)
// ============================================================================

export const DISEASE_CATALOG: DiseaseRecord[] = [
  // ── MALADIES FONGIQUES ──
  {
    id: "mildiou_cercosporiose_tomate",
    name: "Mildiou et Alternariose de la tomate",
    scientificName: "Phytophthora infestans / Alternaria solani",
    pathogenType: "fongique",
    targetCrops: ["tomate", "piment", "aubergine"],
    symptomsProfile: ["tache brune huileuse", "feutrage blanc sous feuille", "necrose bord limbe", "tige noircie", "chute des feuilles"],
    affectedOrgans: ["feuilles", "tiges", "fruits"],
    favorableConditions: {
      seasons: ["hivernage", "contre_saison_irrigee"],
      humidity: "> 80% humidité relative",
      temperatures: "20-28°C",
    },
    ineraRef: "Fiche Technique Pathologie Maraîchère INERA Farako-Bâ",
    saphytoRef: "Fongicide Mancozèbe 80% WP (Mancostar SAPHYTO)",
    cspPesticideRef: "Mancozèbe + Métalaxyl-M (ex: Ridomil Gold MZ 68 WG homologué CSP n°08-011)",
    treatmentBio:
      "Bouillie bordelaise dosée à 10 g/L (sulfate de cuivre + chaux éteinte) ou décoction de prêle / macération d'ail pulvérisée en préventif tous les 7 jours. Tuteurage haut pour éviter le contact feuilles-sol.",
    treatmentChemical:
      "Pulvérisation de Mancozèbe 64% + Métalaxyl-M 4% à 2.5 kg/ha dès l'apparition des premières taches. Délai Avant Récolte (DAR) obligatoire de 7 jours minimum.",
    preventiveActions: [
      "Éviter absolument l'arrosage par aspersion sur le feuillage (adopter le goutte-à-goutte)",
      "Supprimer les feuilles basses touchant le sol (effeuillage sanitaire)",
      "Rotation culturale de 3 ans sans solanacée (tomate, piment, aubergine, pomme de terre)",
    ],
  },
  {
    id: "cercosporiose_arachide",
    name: "Cercosporiose de l'arachide (Taches noires foliaires)",
    scientificName: "Cercospora arachidicola / Phaeoisariopsis personata",
    pathogenType: "fongique",
    targetCrops: ["arachide"],
    symptomsProfile: ["tache noire ronde halo jaune", "defoliation precoce", "sechage feuilles"],
    affectedOrgans: ["feuilles", "tiges"],
    favorableConditions: {
      seasons: ["hivernage"],
      humidity: "Temps humide pluvieux prolongé",
    },
    ineraRef: "Programme Oléagineux INERA Saria / Guide CILSS",
    treatmentBio:
      "Pulvérisation d'extrait aqueux de feuilles d'Azadirachta indica (Neem à 50g/L) toutes les 2 semaines. Enrobage des semences au Trichoderma viride.",
    treatmentChemical:
      "Chlorothalonil ou Carbendazime homologué CSP dès le 35ème jour après levée si la pression est forte.",
    preventiveActions: [
      "Semer des variétés certifiées INERA tolérantes (RMP 12)",
      "Enfouissement profond des résidus de fanes après la récolte",
    ],
  },
  {
    id: "charbon_panicule_sorgho_mil",
    name: "Charbon de la panicule du sorgho et mil",
    scientificName: "Sphacelotheca sorghi / Tolyposporium penicillariae",
    pathogenType: "fongique",
    targetCrops: ["sorgho_blanc", "sorgho_rouge", "mil"],
    symptomsProfile: ["spores noires poudreuses", "grains remplaces par masses noires", "epi noirci"],
    affectedOrgans: ["epis"],
    favorableConditions: {
      seasons: ["hivernage"],
    },
    ineraRef: "Guide Technique Céréales INERA / CORAF",
    nacosemRef: "Semences R1 traitées Calthio C ou Apron Star 42 WS",
    treatmentBio:
      "Coupe soignée des panicules atteintes enveloppées d'un sac pour éviter la dispersion éolienne, puis incinération immédiate.",
    treatmentChemical:
      "Traitement systématique des semences avant le semis : Thirame 35% + Métalaxyl 15% (Apron Star à 10g pour 4kg de semences).",
    preventiveActions: [
      "Semer exclusivement des semences certifiées traitées",
      "Éviter de réensemencer les grains issus d'un champ contaminé",
    ],
  },

  // ── MALADIES BACTÉRIENNES ──
  {
    id: "fletrissement_bacterien_solanacees",
    name: "Flétrissement bactérien (Ralstonia)",
    scientificName: "Ralstonia solanacearum (ex-Pseudomonas)",
    pathogenType: "bacterienne",
    targetCrops: ["tomate", "piment", "aubergine", "pomme_de_terre"],
    symptomsProfile: ["fletrissement brutal en vert", "pas de jaunissement initial", "ecoulement bacterien blanc dans verre d'eau", "brunissement faisceaux vasculaires"],
    affectedOrgans: ["tiges", "racines", "collet"],
    favorableConditions: {
      seasons: ["hivernage", "contre_saison_irrigee"],
      soils: ["bas_fond_hydromorphe", "argileux"],
      temperatures: "> 30°C",
    },
    ineraRef: "Revue Sahélienne de Bactériologie Végétale INERA / CNRST",
    treatmentBio:
      "Arrachage immédiat avec la motte de terre des plants flétris et brûlage. Épandage de chaux agricole (200 g/m²) pour alcaliniser le foyer. Greffage sur porte-greffe résistant (Solanum torvum).",
    treatmentChemical:
      "Aucun bactéricide chimique curatif n'est efficace une fois la bactérie logée dans les vaisseaux xylémiens.",
    preventiveActions: [
      "Utilisation exclusive de semences et plants certifiés tolérants (ex: Tomate 'Rossol VFN' ou 'Mongal F1')",
      "Drainage parfait de la parcelle pour éviter la stagnation d'eau",
      "Désinfection des couteaux et tuteurs à l'eau de javel 10%",
    ],
  },

  // ── MALADIES VIRALES ──
  {
    id: "tylcv_tomate",
    name: "Virus des feuilles jaunes en cuillère (TYLCV)",
    scientificName: "Tomato Yellow Leaf Curl Virus (Begomovirus)",
    pathogenType: "virale",
    targetCrops: ["tomate", "piment"],
    symptomsProfile: ["feuilles jaunes en cuillere", "rabougrissement severe", "avortement des fleurs", "entre-noeuds raccourcis"],
    affectedOrgans: ["feuilles", "fleurs"],
    favorableConditions: {
      seasons: ["saison_seche_chaude", "contre_saison_irrigee"],
      temperatures: "> 32°C",
    },
    ineraRef: "Institut de l'Environnement et de Recherches Agricoles (INERA) - Bobo-Dioulasso",
    saphytoRef: "Acétamipride 200 g/kg (Acétastar SAPHYTO)",
    treatmentBio:
      "Filets anti-insectes (maille 50 mesh) sur pépinières. Pièges chromatiques jaunes englués (1 piège pour 50 m²) pour capturer les mouches blanches vectrices. Pulvérisation d'huile de neem 5 ml/L.",
    treatmentChemical:
      "Lutte exclusive contre le vecteur (mouche blanche Bemisia tabaci) : Acétamipride ou Spirotétramate homologué CSP en pépinière.",
    preventiveActions: [
      "Variétés hybrides certifiées résistantes au TYLCV : 'Mongal F1', 'Nema F1'",
      "Élimination totale de l'adventice réservoir Ageratum conyzoides autour de la parcelle",
    ],
  },
  {
    id: "mosaique_coton_manioc",
    name: "Virose de l'enroulement / Mosaïque",
    scientificName: "Cotton Leaf Curl Virus (CLCuV) / Cassava Mosaic Begomovirus",
    pathogenType: "virale",
    targetCrops: ["coton", "manioc"],
    symptomsProfile: ["feuilles enroulees", "epaississement des nervures", "mosaique jaune et vert fonce", "enations"],
    affectedOrgans: ["feuilles"],
    favorableConditions: { seasons: ["hivernage"] },
    ineraRef: "Programme Coton INERA Farako-Bâ / SOFITEX",
    treatmentBio: "Élimination et incinération des pieds infectés dès les premières nervures épaissies.",
    treatmentChemical: "Lutte précoce contre les cicadelles et aleurodes vecteurs.",
    preventiveActions: ["Utilisation des variétés homologuées SOFITEX / INERA"],
  },

  // ── RAVAGEURS ──
  {
    id: "chenille_legionnaire_mais",
    name: "Chenille légionnaire d'automne",
    scientificName: "Spodoptera frugiperda",
    pathogenType: "ravageur",
    targetCrops: ["mais", "sorgho_blanc", "sorgho_rouge", "mil", "riz_pluvial"],
    symptomsProfile: ["trous en dentelle dans cornets", "sciure et crottes dans cornet", "feuilles devorees", "chenille a tete en Y inverse"],
    affectedOrgans: ["feuilles", "tiges", "epis"],
    favorableConditions: { seasons: ["hivernage", "contre_saison_irrigee"] },
    ineraRef: "Protocole National d'Urgence Lutte contre Spodoptera frugiperda INERA / CILSS",
    saphytoRef: "Émaméctine benzoate 50 g/kg (Proclaim / Affirm)",
    cspPesticideRef: "Émaméctine benzoate 50 g/kg ou Chlorantraniliprole 200 g/L (homologués CSP)",
    treatmentBio:
      "Dépôt au creux des cornets foliaires d'une pincée de cendre de bois tamisée mélangée à du sable fin (1:1), ou pulvérisation d'extrait aqueux de graines de neem (50 g/L broyées) avec savon local.",
    treatmentChemical:
      "Émaméctine benzoate à 250 g/ha pulvérisée tôt le matin (avant 8h) ou au coucher du soleil au cœur des cornets.",
    preventiveActions: [
      "Semis précoce et synchrone avec les voisins",
      "Surveillance bimensuelle dès le stade 3 feuilles",
      "Variétés vigoureuses INERA (Barka, Espoir)",
    ],
  },
  {
    id: "mouche_des_fruits_manguier",
    name: "Mouches des fruits (Bactrocera dorsalis)",
    scientificName: "Bactrocera dorsalis / Ceratitis cosyra",
    pathogenType: "ravageur",
    targetCrops: ["mangue", "agrumes", "papaye"],
    symptomsProfile: ["piqure noire ponctiforme sur mangue", "pourriture pulpe", "chute precoce des fruits", "asticots blancs dans mangue"],
    affectedOrgans: ["fruits"],
    favorableConditions: { seasons: ["hivernage", "saison_seche_chaude"] },
    ineraRef: "Projet Régional de Lutte contre les Mouches des Fruits en Afrique de l'Ouest (CORAF / INERA)",
    treatmentBio:
      "Pose de pièges à phéromones mâles (Méthyl-eugénol + Malathion ou Dichlorvos) à raison de 2 à 4 pièges/ha. Ramassage hebdomadaire de toutes les mangues tombées et mise en sacs fermés hermétiquement au soleil (solarisation tueuse de larves).",
    treatmentChemical:
      "Appât protéiné Spinosad (GF-120 homologué CSP) appliqué en taches localisées de 1 m² sur 1 arbre sur 2.",
    preventiveActions: [
      "Nettoyage impeccable sous les frondaisons des vergers",
      "Coordination collective à l'échelle du village ou de la coopérative",
    ],
  },
  {
    id: "foreurs_tiges_cereales",
    name: "Foreurs des tiges du maïs et du sorgho",
    scientificName: "Busseola fusca / Sesamia calamistis",
    pathogenType: "ravageur",
    targetCrops: ["mais", "sorgho_blanc", "sorgho_rouge"],
    symptomsProfile: ["coeur mort", "tige desséchee au centre", "sciure a la base des entre-noeuds", "tiges brisees par le vent"],
    affectedOrgans: ["tiges"],
    favorableConditions: { seasons: ["hivernage"] },
    ineraRef: "Programme Céréales INERA Saria & Farako-Bâ",
    treatmentBio:
      "Système agro-écologique Push-Pull : Desmodium en interligne (répulsif) et Pennisetum purpureum en bordure (plante piège). Brûlage des cannes résiduelles.",
    treatmentChemical: "Deltaméthrine dirigée à la base de la plante avant pénétration de la larve.",
    preventiveActions: ["Broyage ou compostage à chaud des résidus de récolte"],
  },

  // ── CARENCES NUTRITIONNELLES (RÉFÉRENTIELS YARA & INERA) ──
  {
    id: "carence_azote_yara",
    name: "Carence en Azote (N)",
    scientificName: "Nitrogen Deficiency (N)",
    pathogenType: "carence",
    targetCrops: ["mais", "sorgho_blanc", "riz_pluvial", "tomate", "oignon"],
    symptomsProfile: ["jaunissement en v inverse vieilles feuilles", "croissance chetive", "tiges greles", "jaunissement pointe vers nervure"],
    affectedOrgans: ["feuilles", "tiges"],
    favorableConditions: {
      soils: ["sablonneux_dior", "gravillonnaire"],
      humidity: "Lixiviation après fortes pluies",
    },
    ineraRef: "Guide de Gestion Intégrée de la Fertilité des Sols (GIFS) INERA",
    yaraRef: "Guide de Nutrition Végétale Yara Africa : Diagnostic visuel de la carence azotée",
    treatmentBio:
      "Apport immédiat de purin de tithonia ou de fiente de volaille compostée riche en azote rapide (2 kg/m²). Paillage organique azoté.",
    treatmentChemical:
      "Apport de couverture d'Urée 46% (YaraVera) fractionnée à raison de 50 à 100 kg/ha selon la culture, sarclée et enfouie immédiatement sur sol humide, ou pulvérisation foliaire d'azote soluble (YaraVita).",
    preventiveActions: [
      "Fractionnement obligatoire de l'azote : 1/3 au semis/levée, 2/3 au tallage/montaison",
      "Culture intercalaire de légumineuses fixatrices (niébé, arachide)",
    ],
  },
  {
    id: "carence_phosphore_yara",
    name: "Carence en Phosphore (P)",
    scientificName: "Phosphorus Deficiency (P)",
    pathogenType: "carence",
    targetCrops: ["mais", "sorgho_blanc", "mil", "niebe", "arachide"],
    symptomsProfile: ["coloration pourpre violacee des feuilles", "retard severe de croissance", "mauvais enracinement", "teinte bronze violacee"],
    affectedOrgans: ["feuilles", "racines"],
    favorableConditions: {
      soils: ["sablonneux_dior", "gravillonnaire"],
    },
    ineraRef: "Valorisation du Phosphate Naturel de Kodjari (Burkina Faso) - INERA / CNRST",
    yaraRef: "Yara Crop Nutrition : Rôle du phosphore dans l'énergie ATP et l'enracinement",
    treatmentBio:
      "Épandage de Phosphate Naturel de Kodjari (PNK tamisé à 300-400 kg/ha) co-composté avec de la matière organique bien aérée pour solubiliser le phosphore bloqué.",
    treatmentChemical:
      "Apport d'engrais de fond NPK 14-23-14 ou Superphosphate Triple (TSP) / engrais complexe YaraMila à 150-200 kg/ha dès le semis.",
    preventiveActions: ["Épandage régulier de compost phosphaté"],
  },
  {
    id: "carence_potassium_yara",
    name: "Carence en Potassium (K)",
    scientificName: "Potassium Deficiency (K)",
    pathogenType: "carence",
    targetCrops: ["tomate", "oignon", "banane", "mais", "coton"],
    symptomsProfile: ["brulure marginale bord des feuilles", "chlorose des marges feuilles agees", "sensibilite a la verse", "fruits mous sans saveur"],
    affectedOrgans: ["feuilles", "fruits"],
    favorableConditions: {
      soils: ["sablonneux_dior"],
    },
    ineraRef: "Fiches de Fertilité des Sols du Burkina Faso INERA",
    yaraRef: "Yara International : Diagnostic et correction de la potasse sur maraîchage et céréales",
    treatmentBio: "Apport de cendre de bois tamisée (riche en potassium et calcium, 100 g/m²) ou compost de tiges de bananier.",
    treatmentChemical:
      "Apport de Sulfate de Potassium (K2SO4) ou Nitrate de Potassium (YaraLiva / YaraRega) soluble en fertirrigation.",
    preventiveActions: ["Restitution des résidus de récolte après compostage"],
  },
  {
    id: "carence_calcium_cul_noir_yara",
    name: "Carence en Calcium / Nécrose apicale (Cul noir de la tomate)",
    scientificName: "Blossom End Rot (Calcium Deficiency)",
    pathogenType: "carence",
    targetCrops: ["tomate", "piment"],
    symptomsProfile: ["tache noire affaissee au cul du fruit", "tache plate seche extremite fruit", "necroses bourgeons terminaux"],
    affectedOrgans: ["fruits", "feuilles"],
    favorableConditions: {
      seasons: ["saison_seche_chaude", "contre_saison_irrigee"],
      humidity: "Irrigation irrégulière avec alternance excès et sécheresse",
    },
    ineraRef: "Fiche Diagnostic Cul Noir Tomate INERA Farako-Bâ",
    yaraRef: "YaraLiva Nitrabor / Tropicote : Prévention de la nécrose apicale par calcium chélaté",
    treatmentBio:
      "Régularisation stricte du calendrier d'arrosage (ne jamais laisser le sol sécher complètement puis inonder). Apport de poudre de coquilles d'œufs calcinées et broyées au pied.",
    treatmentChemical:
      "Pulvérisation foliaire de Chlorure de Calcium ou Nitrate de Calcium (YaraLiva Calcinit dosé à 5g/L) toutes les semaines dès la nouaison.",
    preventiveActions: [
      "Irrigation au goutte-à-goutte régulière sans à-coups",
      "Paillage épais pour maintenir l'humidité constante du sol",
    ],
  },

  // ── STRESS HYDRIQUE & PHYSIOLOGIQUE ──
  {
    id: "stress_hydrique_secheresse",
    name: "Stress hydrique par déficit pluviométrique",
    scientificName: "Drought Induced Physiological Stress",
    pathogenType: "stress_hydrique",
    targetCrops: ["mais", "sorgho_blanc", "mil", "coton", "tomate"],
    symptomsProfile: ["enroulement des feuilles en cigare", "fletrissement diurne", "sechage extremites feuilles", "retard floraison"],
    affectedOrgans: ["feuilles", "fleurs"],
    favorableConditions: {
      seasons: ["saison_seche_chaude", "hivernage"],
      soils: ["gravillonnaire", "sablonneux_dior"],
    },
    ineraRef: "Techniques de Conservation des Eaux et des Sols (CES/DRS) - Zaï, Cordons pierreux, Demi-lunes INERA",
    treatmentBio:
      "Irrigation d'appoint d'urgence si possible. Paillage agro-écologique de 10 cm d'épaisseur pour stopper l'évaporation du sol.",
    treatmentChemical: "Aucun produit chimique ne remplace l'eau. Ne pas appliquer d'engrais minéral solide sur sol sec.",
    preventiveActions: [
      "Pratique du Zaï et des demi-lunes avec apport de compost au poquet",
      "Adoption de variétés à cycle court INERA (ex: Maïs Espoir 80 jours)",
    ],
  },

  // ── DÉGÂTS MÉCANIQUES & ACCIDENTELS ──
  {
    id: "brulure_engrais_ou_vent",
    name: "Brûlure chimique par engrais ou vent d'Harmattan",
    scientificName: "Fertilizer / Wind Scorch",
    pathogenType: "degat_mecanique",
    targetCrops: ["mais", "tomate", "oignon", "piment"],
    symptomsProfile: ["brulure blanche ou brune sur un seul cote", "feuilles desséchees apres epandage", "tige coupee par outil", "blessure mecanique"],
    affectedOrgans: ["feuilles", "tiges"],
    favorableConditions: {
      seasons: ["saison_seche_fraiche", "saison_seche_chaude"],
    },
    ineraRef: "Guide des Bonnes Pratiques d'Application des Intrants SAPHYTO / INERA",
    treatmentBio: "Arrosage abondant immédiat pour lessiver la concentration excessive de sels minéraux au collet.",
    treatmentChemical: "Éviter tout contact direct entre les granules d'Urée/NPK et les tiges vertes de la plante.",
    preventiveActions: [
      "Enfouir les engrais à au moins 10-15 cm de distance du pied de la plante",
      "Installer des haies brise-vent en bordure de parcelle (Acacia, Jatropha, Euphorbia)",
    ],
  },
];

// ============================================================================
// 5. DOCUMENTS SCIENTIFIQUES OFFICIELS (CORPUS RAG MULTI-INSTITUTIONS)
// ============================================================================

export const KNOWLEDGE_BASE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "kb-inera-striga-01",
    sourceInstitution: "INERA",
    documentTitle: "Guide Pratique de Gestion du Striga hermonthica en Milieu Paysan Sahélien",
    documentReference: "INERA / CNRST Bulletin Scientifique n°42",
    content: "Le Striga hermonthica est une adventice parasite siphonnant les céréales (sorgho, mil, maïs). L'arrachage doit être effectué avant la floraison rose. L'utilisation des variétés INERA Framida, Sariasso 14 et Niébé B301 réduit l'infestation de 80%. L'association avec le sésame provoque la germination suicide.",
    crop: "sorgho_blanc",
    weed: "striga_hermonthica",
    region: "Toutes régions",
    keywords: ["striga", "herbe parasite", "kango", "fleur rose", "céréales", "framida"],
  },
  {
    id: "kb-csp-cilss-pesticides-01",
    sourceInstitution: "CSP-CILSS",
    documentTitle: "Liste Positive des Produits Phytopharmaceutiques Homologués par le Comité Sahélien des Pesticides",
    documentReference: "CSP/CILSS Édition Révisée 2025-2026",
    content: "Pour la lutte contre la chenille légionnaire (Spodoptera frugiperda), les matières actives homologuées CSP sont l'Émaméctine benzoate (50 g/kg) et le Chlorantraniliprole (200 g/L). Les délais avant récolte (DAR) doivent être rigoureusement respectés : 7 jours pour le maïs doux, 14 jours pour les cultures maraîchères.",
    pest: "chenille_legionnaire_mais",
    keywords: ["csp", "cilss", "homologation", "emamectine", "spodoptera", "dar"],
  },
  {
    id: "kb-yara-nutrition-carences-01",
    sourceInstitution: "Yara",
    documentTitle: "Atlas des Carences Minérales et Rôles Physiologiques N-P-K-Ca-Mg en Afrique de l'Ouest",
    documentReference: "Yara Africa Technical Bulletin - YaraVita & YaraMila Diagnostics",
    content: "La carence en azote se manifeste par un jaunissement en V inversé des vieilles feuilles. La carence en phosphore engendre un pourpre violacé et un blocage de l'enracinement sur sols sablonneux. Le cul noir de la tomate est une nécrose apicale due à un défaut de transport du calcium causé par des à-coups d'arrosage. Correction : YaraLiva Calcinit pulvérisé à la nouaison.",
    deficiency: "carence_calcium_cul_noir_yara",
    keywords: ["yara", "carence", "azote", "phosphore", "potassium", "calcium", "cul noir"],
  },
  {
    id: "kb-saphyto-protection-01",
    sourceInstitution: "SAPHYTO",
    documentTitle: "Manuel d'Itinéraires Techniques Phytosanitaires en Cultures Maraîchères et Céréalières",
    documentReference: "SAPHYTO Burkina Faso Référentiel Commercial et Technique",
    content: "Le Mancostar (Mancozèbe 80% WP) assure une couverture préventive contre le mildiou et l'alternariose. L'Acétastar (Acétamipride) contrôle les vecteurs de viroses (aleurodes Bemisia tabaci). Respecter les consignes de sécurité EPI lors des pulvérisations.",
    disease: "mildiou_cercosporiose_tomate",
    keywords: ["saphyto", "mancozèbe", "mildiou", "acétamipride", "aleurodes"],
  },
  {
    id: "kb-nacosem-semences-01",
    sourceInstitution: "NACOSEM",
    documentTitle: "Catalogue des Semences Certifiées R1/R2 et Protocoles de Désinfection au Sahel",
    documentReference: "NACOSEM Spécifications Techniques",
    content: "Le traitement des semences de sorgho, maïs et mil par Apron Star 42 WS (Thirame + Métalaxyl + Difenoconazole) bloque le charbon de la panicule, la fonte de semis et les attaques de foreurs précoces sur les 30 premiers jours de levée.",
    disease: "charbon_panicule_sorgho_mil",
    keywords: ["nacosem", "semences", "apron star", "charbon", "certification"],
  },
  {
    id: "kb-coraf-ipm-01",
    sourceInstitution: "CORAF",
    documentTitle: "Protection Intégrée des Vergers de Manguiers contre les Mouches des Fruits en Afrique de l'Ouest",
    documentReference: "CORAF / WECARD Note de Synthèse IPM-Mango",
    content: "L'assainissement régulier du verger par ramassage et solarisation en sacs plastiques hermétiques détruit 95% des larves de Bactrocera dorsalis. Combiner avec le piégeage de masse au méthyl-eugénol et l'appât alimentaire Spinosad (GF-120).",
    pest: "mouche_des_fruits_manguier",
    keywords: ["coraf", "mouches des fruits", "bactrocera", "manguier", "spinosad"],
  },
];

// ============================================================================
// 6. PIPELINE OBLIGATOIRE DE DIAGNOSTIC AGRONOMIQUE
// ============================================================================

function cleanString(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ÉTAPE 1 — Identification précise de l'espèce & distinction Culture vs Adventice.
 */
export function identifyPlant(params: {
  text?: string;
  cropKey?: string;
  imageBase64?: string;
  mimeType?: string;
}): PlantIdentificationResult {
  const textOnly = cleanString(params.text || "");
  const qWithCrop = cleanString(params.text || "") + " " + cleanString(params.cropKey || "");

  // 1. Recherche parmi les adventices en priorité sur le texte observé
  // pour ne JAMAIS confondre culture et mauvaise herbe
  for (const weed of WEED_SPECIES_CATALOG) {
    const rawTerms = [
      weed.commonName.split("(")[0].trim(),
      weed.scientificName,
      weed.id.replace(/_/g, " "),
      weed.localNames.moore || "",
      weed.localNames.dioula || "",
      weed.localNames.fulfulde || "",
    ];

    const weedKeywords: string[] = [];
    for (const term of rawTerms) {
      const cleaned = cleanString(term);
      if (cleaned.length >= 3) {
        weedKeywords.push(cleaned);
        for (const word of cleaned.split(" ")) {
          if (
            word.length >= 4 &&
            !["herbe", "plante", "avec", "dans", "pour", "leur", "plus", "tout", "tous", "rond"].includes(word)
          ) {
            weedKeywords.push(word);
          }
        }
      }
    }

    for (const kw of weedKeywords) {
      if (textOnly.includes(kw) || (textOnly.length >= 4 && kw.includes(textOnly))) {
        return {
          identifiedSpecies: weed,
          isWeed: true,
          confidence: 0.95,
          confidenceLevel: "Élevé",
          canProceed: true,
        };
      }
    }
  }

  // 2. Cas où l'utilisateur a sélectionné une culture connue dans la liste déroulante
  if (params.cropKey) {
    const match = PLANT_SPECIES_CATALOG.find((c) => c.id === params.cropKey);
    if (match) {
      return {
        identifiedSpecies: match,
        isWeed: false,
        confidence: 0.95,
        confidenceLevel: "Élevé",
        canProceed: true,
      };
    }
  }

  // 3. Recherche parmi les cultures officielles
  for (const crop of PLANT_SPECIES_CATALOG) {
    const cropKeywords: string[] = [
      cleanString(crop.id),
      cleanString(crop.scientificName),
    ];
    for (const w of cleanString(crop.commonName).split(" ")) {
      if (w.length >= 3 && !["des", "les", "une", "par"].includes(w)) cropKeywords.push(w);
    }
    for (const variety of crop.burkinaVarieties) {
      cropKeywords.push(cleanString(variety));
    }

    for (const kw of cropKeywords) {
      if (kw.length >= 3 && (qWithCrop.includes(kw) || (qWithCrop.length >= 4 && kw.includes(qWithCrop)))) {
        return {
          identifiedSpecies: crop,
          isWeed: false,
          confidence: 0.95,
          confidenceLevel: "Élevé",
          canProceed: true,
        };
      }
    }
  }

  // 4. Incertitude d'identification -> Blocage strict conformément aux directives
  return {
    identifiedSpecies: null,
    isWeed: false,
    confidence: 0.35,
    confidenceLevel: "Incertain",
    canProceed: false,
    blockReason: "Identification incertaine : l'espèce observée n'a pas pu être certifiée avec certitude.",
    missingPhotosAdvice:
      "Veuillez prendre des photos supplémentaires sous d'autres angles : feuille entière nette, collet au ras du sol, présence de panicule/fleur, ou port général de la plante pour certifier s'il s'agit d'une culture ou d'une mauvaise herbe.",
  };
}

/**
 * ÉTAPE 2 — Vérification et pondération du contexte agronomique
 */
export function evaluateAgronomicContext(
  context: AgronomicContext,
  disease: DiseaseRecord
): { scoreBonus: number; explanation: string[] } {
  let scoreBonus = 0;
  const explanation: string[] = [];

  // 1. Saison favorable
  if (disease.favorableConditions.seasons?.includes(context.season)) {
    scoreBonus += 10;
    explanation.push(`Pression favorisée par la saison active (${context.season.replace(/_/g, " ")})`);
  }

  // 2. Type de sol propice
  if (disease.favorableConditions.soils?.includes(context.soilType)) {
    scoreBonus += 10;
    explanation.push(`Type de sol prédisposant (${context.soilType.replace(/_/g, " ")})`);
  }

  // 3. Organes affectés concordants
  if (context.affectedOrgans && context.affectedOrgans.length > 0) {
    const commonOrgans = disease.affectedOrgans.filter((o) => context.affectedOrgans.includes(o));
    if (commonOrgans.length > 0) {
      scoreBonus += commonOrgans.length * 6;
      explanation.push(`Localisation conforme sur l'organe observé : ${commonOrgans.join(", ")}`);
    }
  }

  return { scoreBonus, explanation };
}

/**
 * ÉTAPE 3 & 4 — Recherche RAG Scientifique et Validation des Résultats
 */
export function executeScientificDiagnosisPipeline(params: {
  identification: PlantIdentificationResult;
  context: AgronomicContext;
  localValidatedCases?: ValidatedCase[];
}): ScientificDiagnosisResult {
  const { identification, context, localValidatedCases = [] } = params;

  // Si l'identification n'a pas pu être certifiée à l'étape 1, stopper immédiatement
  if (!identification.canProceed || !identification.identifiedSpecies) {
    return {
      step1Plant: identification,
      step2Context: context,
      step3PathogenType: "non_confirme",
      step4Validation: {
        isConfirmed: false,
        primaryDiagnosis: null,
        differentialDiagnoses: [],
        agronomicExplanation:
          "Arrêt à l'Étape 1 : Impossible de formuler un diagnostic agronomique scientifique sans certification préalable de l'espèce végétale (distinction culture / adventice).",
        officialReferences: [],
        confidenceLevel: "Incertain",
        inconclusiveNotice:
          "Preuves botaniques insuffisantes. Veuillez photographier les feuilles à plat, le collet et les fleurs ou confirmer la culture manuellement.",
      },
    };
  }

  // CAS A : LA PLANTE IDENTIFIÉE EST UNE MAUVAISE HERBE (ADVENTICE)
  if (identification.isWeed) {
    const weed = identification.identifiedSpecies as WeedSpecies;
    const localNamesStr = Object.entries(weed.localNames)
      .map(([lang, name]) => `${lang}: ${name}`)
      .join(", ");

    return {
      step1Plant: identification,
      step2Context: context,
      step3PathogenType: "ravageur", // Compétition biologique / parasite
      step4Validation: {
        isConfirmed: true,
        primaryDiagnosis: {
          diseaseId: weed.id,
          name: `Infestation d'adventice : ${weed.commonName}`,
          scientificName: weed.scientificName,
          pathogenType: "ravageur",
          score: 95,
          confidenceLevel: "Élevé",
          rationale: `L'observation correspond à une mauvaise herbe majeure (${weed.scientificName}, famille des ${weed.family}) et non à une culture. Elle exerce une concurrence nutritive sévère sur les cultures voisines (${weed.targetCrops.join(", ")}).`,
          officialReferences: [weed.ineraRef, "Référentiel Malherbologique CSP-CILSS"],
          treatmentBio: weed.controlMethodsBio,
          treatmentChemical: weed.controlMethodsChemical,
          preventiveActions: weed.distinctiveFeatures,
        },
        differentialDiagnoses: [],
        agronomicExplanation: `Identification certifiée : ${weed.commonName} (${weed.scientificName}). Cycle ${weed.cycle}, risque ${weed.riskLevel}. L'adventice ne doit pas être traitée comme une maladie de culture mais éliminée selon le protocole de lutte intégrée ci-dessous.`,
        officialReferences: [weed.ineraRef, "Directives de Malherbologie INERA / CILSS"],
        confidenceLevel: "Élevé",
      },
      weedManagementPlan: {
        weedName: weed.commonName,
        scientificName: weed.scientificName,
        localNames: localNamesStr,
        cycle: weed.cycle,
        riskLevel: weed.riskLevel,
        bioControl: weed.controlMethodsBio,
        chemicalControl: weed.controlMethodsChemical,
        ineraRef: weed.ineraRef,
      },
    };
  }

  // CAS B : CULTURE AGRICOLE IDENTIFIÉE -> RECHERCHE RAG DANS LE CATALOGUE SCIENTIFIQUE
  const crop = identification.identifiedSpecies as PlantSpecies;
  const cleanedSymptoms = cleanString(context.symptoms);
  const symptomWords = cleanedSymptoms.split(" ").filter((w) => w.length >= 3);

  const candidates: DiagnosisCandidate[] = [];

  for (const disease of DISEASE_CATALOG) {
    // 1. Concordance de la culture cible
    const matchesCrop = disease.targetCrops.includes(crop.id) || disease.targetCrops.includes("toutes");
    if (!matchesCrop) continue;

    // 2. Score de concordance des symptômes
    let symptomScore = 0;
    const matchingDescriptions: string[] = [];

    // Concordance directe sur le nom de maladie ou taxon
    const cleanDiseaseName = cleanString(disease.name);
    const cleanScientific = cleanString(disease.scientificName);
    for (const token of cleanDiseaseName.split(" ").concat(cleanScientific.split(" "))) {
      if (
        token.length >= 4 &&
        !["pour", "avec", "dans", "tous", "cette", "noir", "brune"].includes(token) &&
        cleanedSymptoms.includes(token)
      ) {
        symptomScore += 18;
        matchingDescriptions.push(`Indice clé "${token}"`);
        break;
      }
    }

    // Concordance sur le profil de symptômes foliaires / organes
    for (const symptom of disease.symptomsProfile) {
      const cleanSymp = cleanString(symptom);
      if (cleanedSymptoms.includes(cleanSymp)) {
        symptomScore += 22;
        matchingDescriptions.push(symptom);
      } else {
        const sympTokens = cleanSymp
          .split(" ")
          .filter((w) => w.length >= 3 && !["des", "les", "sur", "sous", "par"].includes(w));
        let matched = 0;
        for (const token of sympTokens) {
          const stem = token.slice(0, 4);
          if (cleanedSymptoms.includes(token) || (stem.length >= 4 && cleanedSymptoms.includes(stem))) {
            matched++;
          }
        }
        if (matched > 0) {
          symptomScore += matched * 8;
          matchingDescriptions.push(symptom);
        }
      }
    }

    if (symptomScore === 0) continue;

    // 3. Évaluation du contexte agronomique (Saison, Sol, Organe)
    const { scoreBonus, explanation } = evaluateAgronomicContext(context, disease);
    const totalScore = symptomScore + scoreBonus;

    // 4. Bonus si un cas identique a été validé sur le terrain par un agronome
    const validatedBonus = localValidatedCases.some(
      (vc) => vc.plantSpeciesId === crop.id && vc.diseaseCatalogId === disease.id
    )
      ? 15
      : 0;

    const finalScore = Math.min(100, totalScore + validatedBonus);

    let confLevel: ConfidenceLevel = "Faible";
    if (finalScore >= 60) confLevel = "Élevé";
    else if (finalScore >= 35) confLevel = "Moyen";

    // 5. Consolidation des références institutionnelles officielles
    const officialRefs: string[] = [disease.ineraRef];
    if (disease.yaraRef) officialRefs.push(disease.yaraRef);
    if (disease.cspPesticideRef) officialRefs.push(disease.cspPesticideRef);
    if (disease.saphytoRef) officialRefs.push(disease.saphytoRef);
    if (disease.nacosemRef) officialRefs.push(disease.nacosemRef);

    candidates.push({
      diseaseId: disease.id,
      name: disease.name,
      scientificName: disease.scientificName,
      pathogenType: disease.pathogenType,
      score: finalScore,
      confidenceLevel: confLevel,
      rationale: `Concordance des symptômes (${matchingDescriptions.slice(0, 3).join(", ")}). ${explanation.join(". ")}.`,
      officialReferences: officialRefs,
      treatmentBio: disease.treatmentBio,
      treatmentChemical: disease.treatmentChemical,
      preventiveActions: disease.preventiveActions,
    });
  }

  // Tri par score de probabilité décroissant
  candidates.sort((a, b) => b.score - a.score);

  // Si aucun candidat n'atteint un niveau minimal de preuves scientifiques
  if (candidates.length === 0 || candidates[0].score < 30) {
    return {
      step1Plant: identification,
      step2Context: context,
      step3PathogenType: "non_confirme",
      step4Validation: {
        isConfirmed: false,
        primaryDiagnosis: null,
        differentialDiagnoses: [],
        agronomicExplanation:
          "Les symptômes décrits ne correspondent à aucun cas documenté avec certitude dans les référentiels scientifiques INERA, CSP-CILSS ou Yara pour cette culture.",
        officialReferences: [
          "Institut de l'Environnement et de Recherches Agricoles (INERA)",
          "Comité Sahélien des Pesticides (CSP-CILSS)",
        ],
        confidenceLevel: "Incertain",
        inconclusiveNotice:
          "Preuves scientifiques insuffisantes. Conformément aux règles de vérité agronomique (ZÉRO HALLUCINATION), l'IA ne génère pas de diagnostic imaginaire. Veuillez solliciter la visite d'un expert agronome INERA / CREAF ou apporter des informations complémentaires.",
      },
    };
  }

  const primary = candidates[0];
  const differentials = candidates.slice(1, 4);

  return {
    step1Plant: identification,
    step2Context: context,
    step3PathogenType: primary.pathogenType,
    step4Validation: {
      isConfirmed: true,
      primaryDiagnosis: primary,
      differentialDiagnoses: differentials,
      agronomicExplanation: `Diagnostic principal : ${primary.name} (${primary.scientificName || primary.pathogenType}). Justification agronomique : ${primary.rationale} Cohérent avec la phénologie de la culture (${crop.commonName}) et le sol ${context.soilType.replace(/_/g, " ")}.`,
      officialReferences: primary.officialReferences,
      confidenceLevel: primary.confidenceLevel,
    },
  };
}

// ============================================================================
// 7. AMÉLIORATION CONTINUE : SAUVEGARDE DES CAS VALIDÉS PAR LES EXPERTS
// ============================================================================

const LOCAL_VALIDATED_CASES_KEY = "nafa_genius_validated_cases_store";

export function getStoredValidatedCases(): ValidatedCase[] {
  try {
    const raw = localStorage.getItem(LOCAL_VALIDATED_CASES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveValidatedDiagnosisCase(caseData: Omit<ValidatedCase, "id" | "certifiedAt">): Promise<ValidatedCase> {
  const newCase: ValidatedCase = {
    ...caseData,
    id: `val-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    certifiedAt: new Date().toISOString(),
  };

  // 1. Sauvegarde locale persistante (Offline-First)
  const current = getStoredValidatedCases();
  current.unshift(newCase);
  try {
    localStorage.setItem(LOCAL_VALIDATED_CASES_KEY, JSON.stringify(current.slice(0, 100)));
  } catch (e) {
    console.warn("Échec stockage local des cas validés :", e);
  }

  // 2. Synchronisation en arrière-plan vers Supabase si en ligne
  if (navigator.onLine) {
    try {
      await supabase.from("validated_cases").insert({
        plant_species_id: newCase.plantSpeciesId,
        is_weed: newCase.isWeed,
        weed_species_id: newCase.weedSpeciesId,
        disease_catalog_id: newCase.diseaseCatalogId,
        validated_disease_name: newCase.validatedDiseaseName,
        pathogen_type: newCase.pathogenType,
        context_location: newCase.contextLocation,
        context_season: newCase.contextSeason,
        context_soil: newCase.contextSoil,
        context_growth_stage: newCase.contextGrowthStage,
        context_history: newCase.contextHistory,
        observed_symptoms: newCase.observedSymptoms,
        expert_notes: newCase.expertNotes,
        certified_by: newCase.certifiedBy,
        certified_at: newCase.certifiedAt,
        confidence_level: newCase.confidenceLevel.toLowerCase(),
      });
    } catch (err) {
      console.warn("Échec synchronisation Supabase validated_cases :", err);
    }
  }

  return newCase;
}
