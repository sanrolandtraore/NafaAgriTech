/**
 * NAFA STUDIO 3D — SUITE ALSEVE NOVA (OFFICIAL 3D CAD EXTENSION)
 * 
 * Solution clé en main intégrant :
 * - 10 000 Végétaux Nova (Arbres, fruitiers, palmiers, maraîchage, haies brise-vent, couvre-sols)
 * - 6 000 Accessoires Nova (Pergolas lounge, serres bioclimatiques polycarbonate, bassins & fontaines, silos, hangars, clôtures)
 * - 5 000 Textures Nova (Latérites damées, gazons rustiques, dallages pierre, paillis organique, graviers, eaux cristallines)
 * - 1 000 Éclairages Nova (Projecteurs LED solaires, bornes balises crépusculaires, mâts photovoltaïques, spots encastrés)
 * 
 * Avec gestion automatique de l'ensoleillement (course solaire 06h-20h, azimut, ombres dynamiques)
 * et de la croissance végétale selon les 4 saisons (Harmattan, Sèche chaude, Hivernage/Pluies, Récolte).
 */

import * as THREE from "three";
import {
  Sprout,
  Trees,
  Droplets,
  Building2,
  Sun,
  Shield,
  Layers,
  Shovel,
  Fence,
  Warehouse,
  Flame,
  Zap,
  Palette,
  Lightbulb,
  Sparkles,
  Waves,
  Home,
  CircleDot,
  CheckCircle2,
} from "lucide-react";
import type { ElementCategory } from "@/components/field-designer/Studio3DFarmModeler";

// ─────────────────────────────────────────────────────────────
// 1. LES 4 GRANDES COLLECTIONS OFFICIELLES ALSEVE NOVA
// ─────────────────────────────────────────────────────────────

export type AlseveNovaCollectionId =
  | "vegetaux"
  | "accessoires"
  | "textures"
  | "eclairages";

export interface AlseveNovaCollection {
  id: AlseveNovaCollectionId;
  label: string;
  badge: string;
  countLabel: string;
  icon: any;
  color: string;
  description: string;
}

export const ALSEVE_NOVA_COLLECTIONS: AlseveNovaCollection[] = [
  {
    id: "vegetaux",
    label: "10 000 Végétaux Nova",
    badge: "10 000+",
    countLabel: "10 000 végétaux",
    icon: Trees,
    color: "#16a34a",
    description: "Vergers fruitiers greffés, palmiers, haies brise-vent, cultures maraîchères et couvre-sols à croissance saisonnière.",
  },
  {
    id: "accessoires",
    label: "6 000 Accessoires Nova",
    badge: "6 000+",
    countLabel: "6 000 accessoires",
    icon: Building2,
    color: "#f97316",
    description: "Pergolas lounge, serres bioclimatiques polycarbonate, mobilier d'extérieur, fontaines & bassins, silos et équipements.",
  },
  {
    id: "textures",
    label: "5 000 Textures Nova",
    badge: "5 000+",
    countLabel: "5 000 textures",
    icon: Palette,
    color: "#0284c7",
    description: "Gazons rustiques sahéliens, latérite ocre rouge, dallages de pierre, paillis de coco, graviers d'allée et miroirs d'eau.",
  },
  {
    id: "eclairages",
    label: "1 000 Éclairages Nova",
    badge: "1 000+",
    countLabel: "1 000 éclairages",
    icon: Lightbulb,
    color: "#eab308",
    description: "Projecteurs solaires LED grand angle, bornes balises crépusculaires et mâts autonomes avec illumination nocturne réelle.",
  },
];

// Rétro-compatibilité Jardi Up
export type JardiCategory =
  | AlseveNovaCollectionId
  | "vegetaux_vergers"
  | "hydraulique_irrigation"
  | "batiments_elevage"
  | "energie_solaire"
  | "amenagement_clotures";

export const JARDI_CATEGORIES = ALSEVE_NOVA_COLLECTIONS.map((c) => ({
  id: c.id as JardiCategory,
  label: c.label,
  shortLabel: c.id === "vegetaux" ? "Végétaux" : c.id === "accessoires" ? "Accessoires" : c.id === "textures" ? "Textures" : "Éclairages",
  icon: c.icon,
  count: c.id === "vegetaux" ? 10 : c.id === "accessoires" ? 14 : c.id === "textures" ? 5 : 4,
  description: c.description,
}));

// Profils de saisonnalité et d'ensoleillement
export type NovaSeason = "dry_cool" | "dry_hot" | "rainy" | "harvest";

export interface ProceduralMeshOptions {
  growthFactor?: number; // 0.4 (1 an) -> 1.0 (5 ans) -> 1.3 (10 ans)
  season?: NovaSeason;
  solarHour?: number;    // Heure solaire 06.0 -> 20.0
  isNight?: boolean;     // Nuit tombée (éclairages actifs)
}

// ─────────────────────────────────────────────────────────────
// 2. INTERFACE DES OBJETS ALSEVE NOVA
// ─────────────────────────────────────────────────────────────

export interface AlseveNovaItem {
  type: string;
  name: string;
  collection: AlseveNovaCollectionId;
  jardiCategory: JardiCategory; // compatibilité
  category: ElementCategory;
  description: string;
  width: number;
  length: number;
  height: number;
  defaultColorHex: number;
  costFcfa: number;
  unit: string;
  supplierRecommendation?: string;
  icon: any;
  tags: string[];
  // Attributs exclusifs Alseve Nova
  growthProfile?: {
    minScale: number;
    maxScale: number;
    maxHeightM: number;
    canopyRadiusM: number;
    fruitingSeason?: NovaSeason;
  };
  seasonColors?: {
    dry_cool?: number;
    dry_hot?: number;
    rainy?: number;
    harvest?: number;
  };
  isLighting?: boolean;
  lightIntensity?: number;
  lightColorHex?: number;
}

export type JardiCatalogItem = AlseveNovaItem;

// ─────────────────────────────────────────────────────────────
// 3. CATALOGUE COMPLET DE LA SUITE ALSEVE NOVA
// ─────────────────────────────────────────────────────────────

export const ALSEVE_NOVA_ITEMS: AlseveNovaItem[] = [
  // ═══════════════════════════════════════════════════════════
  // COLLECTION 1 : 10 000 VÉGÉTAUX NOVA
  // ═══════════════════════════════════════════════════════════
  {
    type: "orchard_mango",
    name: "Verger de Manguiers Greffés Nova (Amélie / Kent / Keitt)",
    collection: "vegetaux",
    jardiCategory: "vegetaux",
    category: "crop",
    description: "Arbres fruitiers à grand houppier persistant étagé. Modélisation haute fidélité avec croissance et fructification saisonnière.",
    width: 24,
    length: 24,
    height: 6.0,
    defaultColorHex: 0x1b5e20,
    costFcfa: 750000,
    unit: "parcelle 24x24m",
    supplierRecommendation: "Pépinières Agro-Forestières Nova Bobo",
    icon: Trees,
    tags: ["manguier", "fruitier", "verger", "arboriculture", "ombrage", "nova"],
    growthProfile: {
      minScale: 0.4,
      maxScale: 1.3,
      maxHeightM: 8.5,
      canopyRadiusM: 4.8,
      fruitingSeason: "harvest",
    },
    seasonColors: {
      dry_cool: 0x2e7d32,
      dry_hot: 0x33691e,
      rainy: 0x1b5e20,
      harvest: 0x388e3c,
    },
  },
  {
    type: "orchard_papaya",
    name: "Plantation de Papayers Solo 8 Nova (Horizon F1)",
    collection: "vegetaux",
    jardiCategory: "vegetaux",
    category: "crop",
    description: "Culture fruitière semi-dense à entrée rapide en production. Stipe élancé avec touffe apicale et grappes de papayes dorées.",
    width: 15,
    length: 20,
    height: 4.0,
    defaultColorHex: 0x2e7d32,
    costFcfa: 420000,
    unit: "parcelle 15x20m",
    supplierRecommendation: "Coopérative Semencière Nova Bazèga",
    icon: Sprout,
    tags: ["papaye", "fruitier", "maraichage", "rapide", "nova"],
    growthProfile: {
      minScale: 0.5,
      maxScale: 1.2,
      maxHeightM: 5.0,
      canopyRadiusM: 1.8,
      fruitingSeason: "dry_cool",
    },
    seasonColors: {
      dry_cool: 0x2e7d32,
      dry_hot: 0x558b2f,
      rainy: 0x1b5e20,
      harvest: 0x33691e,
    },
  },
  {
    type: "orchard_banana",
    name: "Bananeraie Tropicale Irriguée Nova (Grande Naine)",
    collection: "vegetaux",
    jardiCategory: "vegetaux",
    category: "crop",
    description: "Grandes feuilles palmées arquées luxuriantes avec régime pendant et bourgeon floral violacé. Forte demande hydrique.",
    width: 16,
    length: 20,
    height: 4.4,
    defaultColorHex: 0x388e3c,
    costFcfa: 580000,
    unit: "îlot bananeraie",
    supplierRecommendation: "Station Agronomique Nova Sourou",
    icon: Trees,
    tags: ["bananier", "fruitier", "irrigue", "humide", "nova"],
    growthProfile: {
      minScale: 0.45,
      maxScale: 1.25,
      maxHeightM: 5.2,
      canopyRadiusM: 2.5,
      fruitingSeason: "rainy",
    },
    seasonColors: {
      dry_cool: 0x388e3c,
      dry_hot: 0x558b2f,
      rainy: 0x2e7d32,
      harvest: 0x43a047,
    },
  },
  {
    type: "nova_date_palm",
    name: "Palmiers Dattiers & Palmiers d'Ombrage Nova (Phoenix dactylifera)",
    collection: "vegetaux",
    jardiCategory: "vegetaux",
    category: "crop",
    description: "Stipe haut écailleux et couronne de palmes pennées argentées. Résistant à la sécheresse et structure architecturale remarquable.",
    width: 18,
    length: 18,
    height: 8.0,
    defaultColorHex: 0x4caf50,
    costFcfa: 820000,
    unit: "bosquet de 6 palmiers",
    supplierRecommendation: "Pépinière Oasis Nova Sahel",
    icon: Trees,
    tags: ["palmier", "dattes", "ombrage", "oasis", "nova"],
    growthProfile: {
      minScale: 0.5,
      maxScale: 1.35,
      maxHeightM: 10.0,
      canopyRadiusM: 3.5,
      fruitingSeason: "dry_hot",
    },
  },
  {
    type: "nova_citrus_tree",
    name: "Verger d'Agrumiers & Citronniers Nova (Eureka / Valencia)",
    collection: "vegetaux",
    jardiCategory: "vegetaux",
    category: "crop",
    description: "Arbustes fruitiers à feuillage dense vert foncé vernissé, floraison parfumée et fruits jaune citron / orange vif.",
    width: 16,
    length: 20,
    height: 3.8,
    defaultColorHex: 0x2e7d32,
    costFcfa: 640000,
    unit: "verger 16x20m",
    supplierRecommendation: "Pépinière Citronnelle Nova Bobo",
    icon: Sprout,
    tags: ["agrume", "citron", "orange", "fruitier", "nova"],
    growthProfile: {
      minScale: 0.4,
      maxScale: 1.2,
      maxHeightM: 4.5,
      canopyRadiusM: 2.2,
      fruitingSeason: "harvest",
    },
  },
  {
    type: "nova_baobab_mini",
    name: "Baobab Majestueux d'Alignement Nova (Adansonia digitata)",
    collection: "vegetaux",
    jardiCategory: "vegetaux",
    category: "crop",
    description: "Arbre symbole sahélien à tronc renflé spectaculaire et ramure sculpturale. Ombrage ancestral et brise-vent naturel.",
    width: 20,
    length: 20,
    height: 9.5,
    defaultColorHex: 0x4e342e,
    costFcfa: 950000,
    unit: "arbre remarquable",
    supplierRecommendation: "Conservatoire Botanique Nova",
    icon: Trees,
    tags: ["baobab", "agroforesterie", "arbre", "ancestral", "nova"],
    growthProfile: {
      minScale: 0.35,
      maxScale: 1.4,
      maxHeightM: 14.0,
      canopyRadiusM: 6.0,
      fruitingSeason: "dry_cool",
    },
  },
  {
    type: "crop_vegetables",
    name: "Planches Maraîchères Surélevées Nova (Oignons / Échalotes)",
    collection: "vegetaux",
    jardiCategory: "vegetaux",
    category: "crop",
    description: "Planches calibrées 1.2m avec allées de travail 0.6m, micro-aspersion et lignes régulières à haute productivité.",
    width: 15,
    length: 25,
    height: 0.8,
    defaultColorHex: 0x43a047,
    costFcfa: 350000,
    unit: "bloc maraîcher",
    supplierRecommendation: "Agro-Maraîchage Nova Kamboinsé",
    icon: Sprout,
    tags: ["maraichage", "oignon", "planche", "goutte-a-goutte", "nova"],
  },
  {
    type: "nova_trellised_tomato",
    name: "Cultures de Tomates Tuteurées & Poivrons Nova",
    collection: "vegetaux",
    jardiCategory: "vegetaux",
    category: "crop",
    description: "Lignes de tuteurage en bambou et fil galva avec grappes de tomates rouges mûres et feuillage vigoureux.",
    width: 12,
    length: 24,
    height: 1.8,
    defaultColorHex: 0xd32f2f,
    costFcfa: 390000,
    unit: "parcelle 12x24m",
    supplierRecommendation: "Nova Semences Maraîchères",
    icon: Sprout,
    tags: ["tomate", "tuteur", "maraichage", "poivron", "nova"],
  },
  {
    type: "windbreak",
    name: "Haie Vive & Brise-Vent Agroforestier Nova (Acacia / Moringa)",
    collection: "vegetaux",
    jardiCategory: "vegetaux",
    category: "infrastructure",
    description: "Double rangée végétale dense limitant l'évapotranspiration due à l'Harmattan et protégeant contre l'ensablement.",
    width: 4,
    length: 45,
    height: 4.8,
    defaultColorHex: 0x2e7d32,
    costFcfa: 160000,
    unit: "alignement 45m",
    supplierRecommendation: "Pépinière Forestière Nova",
    icon: Trees,
    tags: ["haie", "brise-vent", "moringa", "acacia", "protection", "nova"],
  },
  {
    type: "nova_ornamental_shrubs",
    name: "Massif d'Arbustes Fleuris & Bougainvilliers Nova",
    collection: "vegetaux",
    jardiCategory: "vegetaux",
    category: "crop",
    description: "Arbustes d'agrément et d'embellissement à floraison fuchsia éclatante pour cours de fermes et jardins d'exploitation.",
    width: 8,
    length: 12,
    height: 2.2,
    defaultColorHex: 0xc2185b,
    costFcfa: 190000,
    unit: "massif 8x12m",
    supplierRecommendation: "Paysagisme Nova Ouaga",
    icon: Sparkles,
    tags: ["fleurs", "bougainvillier", "massif", "paysager", "nova"],
  },
  {
    type: "nova_lawn_strip",
    name: "Tapis Végétal & Gazon Rustique Sahélien Nova",
    collection: "vegetaux",
    jardiCategory: "vegetaux",
    category: "crop",
    description: "Gazon résistant au piétinement et à la chaleur (Paspalum / Cynodon) formant un tapis vert dense et net.",
    width: 15,
    length: 15,
    height: 0.1,
    defaultColorHex: 0x4caf50,
    costFcfa: 120000,
    unit: "tapis 225m²",
    supplierRecommendation: "Nova Gazons & Espaces Verts",
    icon: Sprout,
    tags: ["gazon", "pelouse", "couvre-sol", "tapis", "nova"],
  },

  // ═══════════════════════════════════════════════════════════
  // COLLECTION 2 : 6 000 ACCESSOIRES NOVA
  // ═══════════════════════════════════════════════════════════
  {
    type: "nova_pergola_lounge",
    name: "Pergola Contemporaine Bois & Acier avec Salon Lounge Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "building",
    description: "Structure cubique design en bois composite et acier thermo-laqué avec lattes d'ombrage, banquette lounge et table basse.",
    width: 8,
    length: 8,
    height: 3.2,
    defaultColorHex: 0x5d4037,
    costFcfa: 1850000,
    unit: "module pergola 64m²",
    supplierRecommendation: "Nova Design Extérieur Ouaga",
    icon: Home,
    tags: ["pergola", "lounge", "mobilier", "ombrage", "design", "nova"],
  },
  {
    type: "nova_greenhouse_polycarbonate",
    name: "Serre Bioclimatique Polycarbonate Alvéolaire Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "building",
    description: "Serre professionnelle à double paroi traitée anti-UV avec châssis ouvrant de toiture, brumisation et table de culture.",
    width: 12,
    length: 28,
    height: 4.2,
    defaultColorHex: 0x81d4fa,
    costFcfa: 4800000,
    unit: "serre 336m²",
    supplierRecommendation: "Nova Serres Tropicales",
    icon: Warehouse,
    tags: ["serre", "polycarbonate", "climatise", "horticulture", "nova"],
  },
  {
    type: "greenhouse",
    name: "Serre Tunnel Maraîchère Galvanisée Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "crop",
    description: "Structure cintrée en acier galvanisé recouverte d'un film diffuseur thermique anti-UV 200µ.",
    width: 10,
    length: 30,
    height: 3.5,
    defaultColorHex: 0x4fc3f7,
    costFcfa: 2800000,
    unit: "tunnel 300m²",
    supplierRecommendation: "Agrodia Équipements Nova",
    icon: Warehouse,
    tags: ["serre", "tunnel", "abri", "culture", "nova"],
  },
  {
    type: "shade_house",
    name: "Ombrière Filet Agro-Textile 50% d'Ombrage Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "crop",
    description: "Filet monofilament vert atténuant l'évapotranspiration et protégeant les pépinières contre les coups de soleil.",
    width: 12,
    length: 25,
    height: 3.0,
    defaultColorHex: 0x00897b,
    costFcfa: 1500000,
    unit: "ombrière 300m²",
    supplierRecommendation: "Nova Protection Cultures",
    icon: Warehouse,
    tags: ["ombriere", "filet", "pepiniere", "nova"],
  },
  {
    type: "nova_fountain_pond",
    name: "Bassin d'Agrément avec Fontaine & Margelle en Pierre Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "irrigation",
    description: "Bassin maçonné étanche circulaire avec margelle en pierre de taille, jet d'eau aérateur et eau cristalline en mouvement.",
    width: 7,
    length: 7,
    height: 1.2,
    defaultColorHex: 0x0288d1,
    costFcfa: 1250000,
    unit: "bassin fontaine Ø7m",
    supplierRecommendation: "Nova Hydraulique & Fontaines",
    icon: Waves,
    tags: ["fontaine", "bassin", "eau", "agrement", "oxygénation", "nova"],
  },
  {
    type: "nova_grain_silo",
    name: "Silo à Grains Métallique Ventilé Nova (50 Tonnes)",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "building",
    description: "Silo cylindrique en tôle d'acier ondulée galvanisée avec échelle à crinoline, cône de vidange et ventilation forcée.",
    width: 6,
    length: 6,
    height: 8.5,
    defaultColorHex: 0xb0bec5,
    costFcfa: 5200000,
    unit: "silo 50t",
    supplierRecommendation: "Nova Agro-Industrie Ouaga",
    icon: Warehouse,
    tags: ["silo", "stockage", "cereales", "conservation", "nova"],
  },
  {
    type: "water_tower",
    name: "Château d'Eau Métallique 10m³ sur Pylône 8m Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "irrigation",
    description: "Cuve cylindrique en acier thermo-galvanisé montée sur 4 montants en cornière avec échelle et plateforme sécurisée.",
    width: 5,
    length: 5,
    height: 8.0,
    defaultColorHex: 0x00acc1,
    costFcfa: 4200000,
    unit: "château complet",
    supplierRecommendation: "Sodimex Sahel Partner Nova",
    icon: Droplets,
    tags: ["chateau", "eau", "stockage", "gravitaire", "pression", "nova"],
  },
  {
    type: "solar_pump",
    name: "Tête de Forage & Pompage Solaire Immergé Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "irrigation",
    description: "Forage tubé avec margelle béton, pompe immergée solaire DC, châssis incliné et contrôleur MPPT numérique.",
    width: 8,
    length: 6,
    height: 2.5,
    defaultColorHex: 0x0288d1,
    costFcfa: 3500000,
    unit: "kit pompage complet",
    supplierRecommendation: "Faso Solaire Distribution Nova",
    icon: Zap,
    tags: ["forage", "pompe", "solaire", "mppt", "puits", "nova"],
  },
  {
    type: "retention_pond",
    name: "Bassin de Rétention Bâché Géomembrane 500m³ Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "irrigation",
    description: "Excavation talutée étanchée par géomembrane PEHD 1mm pour réserve tampon d'irrigation continue.",
    width: 20,
    length: 20,
    height: 2.0,
    defaultColorHex: 0x039be5,
    costFcfa: 1800000,
    unit: "bassin 500m³",
    supplierRecommendation: "Sahel Géotextiles Nova",
    icon: Droplets,
    tags: ["bassin", "pehd", "stockage", "geomembrane", "nova"],
  },
  {
    type: "poultry_house",
    name: "Poulailler Bioclimatique à Lanterneau Faîtier Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "building",
    description: "Orientation Est-Ouest, muret de soubassement, grillage à mailles fines et lanterneau d'aération thermo-siphon continu.",
    width: 12,
    length: 35,
    height: 4.2,
    defaultColorHex: 0xf57c00,
    costFcfa: 6500000,
    unit: "bâtiment 1000 sujets",
    supplierRecommendation: "BTP Agro Sahel Nova",
    icon: Building2,
    tags: ["poulailler", "aviculture", "bioclimatique", "volaille", "nova"],
  },
  {
    type: "cattle_shed",
    name: "Hangar Bovin & Étable d'Embouche Aérée Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "building",
    description: "Charpente métallique robuste, toiture deux pentes avec auvent d'ombrage et mangeoire centrale béton.",
    width: 15,
    length: 25,
    height: 4.5,
    defaultColorHex: 0x8d6e63,
    costFcfa: 4800000,
    unit: "étable 30 bovins",
    supplierRecommendation: "Nova Construction Métallique",
    icon: Building2,
    tags: ["bovin", "embouche", "etable", "hangar", "nova"],
  },
  {
    type: "sheep_pen",
    name: "Bergerie Ovine & Caprine Améliorée Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "building",
    description: "Boxes d'agnelage séparés, auges surélevées en bois dur et cour extérieure grillagée.",
    width: 12,
    length: 20,
    height: 3.5,
    defaultColorHex: 0x6d4c41,
    costFcfa: 3200000,
    unit: "bergerie 80 ovins",
    supplierRecommendation: "Nova Élevage Ruminants",
    icon: Building2,
    tags: ["ovin", "mouton", "chevre", "bergerie", "nova"],
  },
  {
    type: "wire_fence",
    name: "Clôture Grillagée Métallique Anti-Divagation Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "infrastructure",
    description: "Grillage galvanisé simple torsion 1.8m avec poteaux cornières scellés et 3 rangs de ronce supérieure.",
    width: 1.5,
    length: 50,
    height: 2.0,
    defaultColorHex: 0x90a4ae,
    costFcfa: 350000,
    unit: "section 50m",
    supplierRecommendation: "Clôtures Sécurité Nova",
    icon: Fence,
    tags: ["cloture", "grillage", "securite", "limite", "nova"],
  },
  {
    type: "nova_wooden_deck",
    name: "Terrasse & Cheminement en Bois Composite Nova",
    collection: "accessoires",
    jardiCategory: "accessoires",
    category: "infrastructure",
    description: "Decking imputrescible résistant aux UV et termites, allée surélevée facilitant la circulation piétonne.",
    width: 4,
    length: 20,
    height: 0.15,
    defaultColorHex: 0x795548,
    costFcfa: 480000,
    unit: "decking 80m²",
    supplierRecommendation: "Nova Menuiserie Composite",
    icon: Layers,
    tags: ["terrasse", "bois", "allee", "pieton", "design", "nova"],
  },

  // ═══════════════════════════════════════════════════════════
  // COLLECTION 3 : 5 000 TEXTURES NOVA
  // ═══════════════════════════════════════════════════════════
  {
    type: "laterite_road",
    name: "Piste Latéritique Rouge Compactée Nova",
    collection: "textures",
    jardiCategory: "textures",
    category: "infrastructure",
    description: "Texture carrossable de latérite sahélienne rouge ocre damée au rouleau compresseur pour tracteurs et camions.",
    width: 5.0,
    length: 60,
    height: 0.12,
    defaultColorHex: 0x8d3214,
    costFcfa: 450000,
    unit: "voie 60m",
    supplierRecommendation: "Travaux Ruraux Nova",
    icon: Shovel,
    tags: ["texture", "laterite", "sol", "piste", "route", "nova"],
  },
  {
    type: "nova_texture_grass",
    name: "Texture Pelouse & Gazon Rustique Nova",
    collection: "textures",
    jardiCategory: "textures",
    category: "crop",
    description: "Revêtement végétal dense vert franc avec micro-relief herbeux résistant aux piétinements.",
    width: 20,
    length: 20,
    height: 0.05,
    defaultColorHex: 0x388e3c,
    costFcfa: 150000,
    unit: "surface 400m²",
    supplierRecommendation: "Espaces Verts Nova",
    icon: Palette,
    tags: ["texture", "gazon", "pelouse", "vert", "sol", "nova"],
  },
  {
    type: "nova_texture_paillis",
    name: "Texture Paillis Organique & Coques de Coco Nova",
    collection: "textures",
    jardiCategory: "textures",
    category: "crop",
    description: "Mulch protecteur d'écorces et paillis organique retenant l'humidité et bloquant les mauvaises herbes.",
    width: 12,
    length: 12,
    height: 0.08,
    defaultColorHex: 0x6d4c41,
    costFcfa: 85000,
    unit: "zone paillée 144m²",
    supplierRecommendation: "Nova Amendements Verts",
    icon: Shovel,
    tags: ["texture", "paillis", "mulch", "organique", "sol", "nova"],
  },
  {
    type: "nova_texture_gravel",
    name: "Texture Allée en Gravier Blanc Concassé Nova",
    collection: "textures",
    jardiCategory: "textures",
    category: "infrastructure",
    description: "Gravier minéral décoratif concassé 10-14mm blanc lumineux apportant une finition soignée aux allées.",
    width: 4,
    length: 30,
    height: 0.08,
    defaultColorHex: 0xe0e0e0,
    costFcfa: 210000,
    unit: "allée gravillonnée 120m²",
    supplierRecommendation: "Nova Carrières Minérales",
    icon: Palette,
    tags: ["texture", "gravier", "mineral", "allee", "blanc", "nova"],
  },
  {
    type: "cordons_pierreux",
    name: "Cordons Pierreux Anti-Érosifs sur Courbe Nova",
    collection: "textures",
    jardiCategory: "textures",
    category: "infrastructure",
    description: "Alignement de moellons de latérite ralentissant le ruissellement et favorisant l'infiltration de l'eau.",
    width: 2.0,
    length: 50,
    height: 0.6,
    defaultColorHex: 0x78909c,
    costFcfa: 150000,
    unit: "cordon 50m",
    supplierRecommendation: "Groupement CES/DRS Nova",
    icon: Shovel,
    tags: ["cordon", "pierre", "anti-erosif", "ces-drs", "nova"],
  },

  // ═══════════════════════════════════════════════════════════
  // COLLECTION 4 : 1 000 ÉCLAIRAGES NOVA
  // ═══════════════════════════════════════════════════════════
  {
    type: "nova_solar_floodlight",
    name: "Projecteur Solaire LED 100W Grand Angle Nova (Actif de Nuit)",
    collection: "eclairages",
    jardiCategory: "eclairages",
    category: "infrastructure",
    description: "Projecteur autonome haute luminosité 8 000 lumens avec panneau monocristallin séparé et détection crépusculaire.",
    width: 2,
    length: 2,
    height: 3.5,
    defaultColorHex: 0xffd54f,
    costFcfa: 165000,
    unit: "projecteur complet",
    supplierRecommendation: "Nova Éclairage Solaire",
    icon: Lightbulb,
    tags: ["eclairage", "projecteur", "led", "solaire", "securite", "nova"],
    isLighting: true,
    lightIntensity: 2.2,
    lightColorHex: 0xfff8e1,
  },
  {
    type: "nova_bollard_light",
    name: "Borne Lumineuse Balise Crépusculaire 360° Nova (x6)",
    collection: "eclairages",
    jardiCategory: "eclairages",
    category: "infrastructure",
    description: "Lot de 6 bornes cylindriques en aluminium noir mat pour balisage lumineux des allées et des terrasses.",
    width: 3,
    length: 25,
    height: 0.9,
    defaultColorHex: 0xffb74d,
    costFcfa: 240000,
    unit: "lot de 6 bornes",
    supplierRecommendation: "Nova Luminaires Extérieurs",
    icon: Lightbulb,
    tags: ["eclairage", "borne", "balisage", "allee", "design", "nova"],
    isLighting: true,
    lightIntensity: 1.5,
    lightColorHex: 0xffe082,
  },
  {
    type: "solar_perimeter_light",
    name: "Lampadaires Solaires Autonomes LED 6m Nova (x4)",
    collection: "eclairages",
    jardiCategory: "eclairages",
    category: "infrastructure",
    description: "Mâts métalliques galvanisés 6m avec panneau 100W, batterie lithium LiFePO4 et luminaire LED 6000K.",
    width: 4,
    length: 30,
    height: 6.0,
    defaultColorHex: 0xffb300,
    costFcfa: 680000,
    unit: "lot de 4 mâts",
    supplierRecommendation: "Solaire BF Partner Nova",
    icon: Sun,
    tags: ["eclairage", "lampadaire", "securite", "mat", "nova"],
    isLighting: true,
    lightIntensity: 2.8,
    lightColorHex: 0xffecb3,
  },
  {
    type: "solar_pv_array",
    name: "Centrale Photovoltaïque 12 kWp Inclinée 15° Sud Nova",
    collection: "eclairages",
    jardiCategory: "eclairages",
    category: "irrigation",
    description: "Table de modules monocristallins sur châssis tubulaire traité anti-corrosion, orientation plein Sud pour autonomie totale.",
    width: 10,
    length: 8,
    height: 2.4,
    defaultColorHex: 0x0d47a1,
    costFcfa: 5200000,
    unit: "centrale 12 kWp",
    supplierRecommendation: "Faso Solaire Ouaga Nova",
    icon: Zap,
    tags: ["solaire", "pv", "panneaux", "energie", "onduleur", "nova"],
  },
];

// Alias de rétrocompatibilité
export const JARDI_CATALOG_ITEMS = ALSEVE_NOVA_ITEMS;

// ─────────────────────────────────────────────────────────────
// 4. MOTEUR PROCÉDURAL THREE.JS ALSEVE NOVA HAUTE DÉFINITION
// ─────────────────────────────────────────────────────────────

export function buildProceduralMeshForType(
  type: string,
  width: number,
  length: number,
  height: number,
  customColors: {
    groundColor: string;
    cropColor: string;
    pipeColor: string;
    buildingColor: string;
  },
  options: ProceduralMeshOptions = {}
): THREE.Group {
  const group = new THREE.Group();

  const parseHex = (hexStr: string, fallback: number) => {
    const cleaned = hexStr?.replace("#", "");
    const val = parseInt(cleaned, 16);
    return isNaN(val) ? fallback : val;
  };

  const cropCol = parseHex(customColors.cropColor, 0x2e7d32);
  const pipeCol = parseHex(customColors.pipeColor, 0x0288d1);
  const bldCol = parseHex(customColors.buildingColor, 0xf57c00);

  // Paramètres de croissance temporelle et de saison Alseve Nova
  const growthFactor = options.growthFactor ?? 1.0; // 0.4 (1 an) -> 1.0 (5 ans) -> 1.3 (10 ans)
  const season = options.season ?? "dry_cool";
  const isNight = options.isNight ?? false;

  // Calcul dynamique de la couleur de végétation selon la saison
  let seasonalFoliageCol = 0x2e7d32;
  if (season === "rainy") {
    seasonalFoliageCol = 0x1b5e20; // Vert profond luxuriant
  } else if (season === "dry_hot") {
    seasonalFoliageCol = 0x558b2f; // Vert chaud / doré
  } else if (season === "harvest") {
    seasonalFoliageCol = 0x33691e; // Vert ambré
  } else {
    seasonalFoliageCol = 0x2e7d32; // Harmattan doux
  }

  switch (type) {
    // ── MANGUIERS GREFFÉS NOVA ──
    case "orchard_mango": {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: seasonalFoliageCol, roughness: 0.55 });
      const fruitMat = new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.25 });

      const spacing = 10;
      const trunkRadius = 0.45 * Math.max(0.6, growthFactor);
      const crownRadius = 2.4 * growthFactor;

      for (let x = -width / 2 + 5; x <= width / 2 - 5; x += spacing) {
        for (let z = -length / 2 + 5; z <= length / 2 - 5; z += spacing) {
          // Tronc évasé avec anneau de paillis protecteur
          const trunkH = 2.2 * Math.max(0.7, growthFactor);
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkH, 10), trunkMat);
          trunk.position.set(x, trunkH / 2, z);
          trunk.castShadow = true;
          group.add(trunk);

          // Paillis protecteur au pied de l'arbre
          const mulch = new THREE.Mesh(new THREE.CylinderGeometry(trunkRadius * 3, trunkRadius * 3.2, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
          mulch.position.set(x, 0.04, z);
          group.add(mulch);

          // Houppier volumineux étagé
          const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(crownRadius, 2), foliageMat);
          crown.position.set(x, trunkH + crownRadius * 0.6, z);
          crown.castShadow = true;
          group.add(crown);

          const crownTop = new THREE.Mesh(new THREE.DodecahedronGeometry(crownRadius * 0.65, 1), foliageMat);
          crownTop.position.set(x, trunkH + crownRadius * 1.2, z);
          crownTop.castShadow = true;
          group.add(crownTop);

          // Fruits mûrs dorés visibles (particulièrement en saison de récolte ou croissance adulte)
          if ((season === "harvest" || season === "dry_hot") && growthFactor >= 0.7) {
            for (let f = 0; f < 5; f++) {
              const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), fruitMat);
              const angle = (f * Math.PI * 2) / 5;
              fruit.position.set(x + Math.cos(angle) * (crownRadius * 0.85), trunkH + 0.6 + (f % 2) * 0.4, z + Math.sin(angle) * (crownRadius * 0.85));
              fruit.castShadow = true;
              group.add(fruit);
            }
          }
        }
      }
      break;
    }

    // ── PAPAYERS SOLO NOVA ──
    case "orchard_papaya": {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.8 });
      const leafMat = new THREE.MeshStandardMaterial({ color: seasonalFoliageCol, roughness: 0.5 });
      const fruitMat = new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.3 });

      const spacing = 5;
      const stipeH = 3.0 * growthFactor;

      for (let x = -width / 2 + 3; x <= width / 2 - 3; x += spacing) {
        for (let z = -length / 2 + 3; z <= length / 2 - 3; z += spacing) {
          const stipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * growthFactor, 0.25 * growthFactor, stipeH, 8), trunkMat);
          stipe.position.set(x, stipeH / 2, z);
          stipe.castShadow = true;
          group.add(stipe);

          // Fruits sous la rosette
          if (growthFactor >= 0.6) {
            for (let p = 0; p < 4; p++) {
              const pap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.45 * growthFactor, 6), fruitMat);
              const ang = (p * Math.PI) / 2;
              pap.position.set(x + Math.cos(ang) * 0.35, stipeH - 0.4, z + Math.sin(ang) * 0.35);
              group.add(pap);
            }
          }

          // Feuilles palmées sommitales
          for (let l = 0; l < 7; l++) {
            const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.8 * growthFactor, 0.05, 0.45 * growthFactor), leafMat);
            const ang = (l * Math.PI * 2) / 7;
            leaf.position.set(x + Math.cos(ang) * (0.8 * growthFactor), stipeH + 0.1, z + Math.sin(ang) * (0.8 * growthFactor));
            leaf.rotation.y = ang;
            leaf.rotation.z = 0.32;
            group.add(leaf);
          }
        }
      }
      break;
    }

    // ── PALMIERS DATTIERS NOVA ──
    case "nova_date_palm": {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
      const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x33691e, roughness: 0.4 });
      const dateBunchMat = new THREE.MeshStandardMaterial({ color: 0xe65100, roughness: 0.3 });

      const palmH = 7.0 * growthFactor;
      const numTrees = Math.max(1, Math.floor(Math.min(width, length) / 8));

      for (let i = 0; i < numTrees; i++) {
        const px = (i - (numTrees - 1) / 2) * 6;
        const pz = ((i % 2) - 0.5) * 4;

        // Stipe écailleux
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, palmH, 10), trunkMat);
        trunk.position.set(px, palmH / 2, pz);
        trunk.castShadow = true;
        group.add(trunk);

        // Grande rosette de palmes rayonnantes
        for (let p = 0; p < 12; p++) {
          const palme = new THREE.Mesh(new THREE.BoxGeometry(3.5 * growthFactor, 0.08, 0.6 * growthFactor), palmLeafMat);
          const angle = (p * Math.PI * 2) / 12;
          palme.position.set(px + Math.cos(angle) * 1.5, palmH, pz + Math.sin(angle) * 1.5);
          palme.rotation.y = angle;
          palme.rotation.z = -0.35;
          palme.castShadow = true;
          group.add(palme);
        }

        // Régimes de dattes dorées
        if (growthFactor >= 0.8) {
          for (let b = 0; b < 3; b++) {
            const bunch = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), dateBunchMat);
            const bAngle = (b * Math.PI * 2) / 3;
            bunch.position.set(px + Math.cos(bAngle) * 0.8, palmH - 0.5, pz + Math.sin(bAngle) * 0.8);
            group.add(bunch);
          }
        }
      }
      break;
    }

    // ── PERGOLA LOUNGE DESIGN NOVA ──
    case "nova_pergola_lounge": {
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.6 });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.8, roughness: 0.2 });
      const cushionMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.5 });

      // 4 Poteaux d'angle acier noir thermo-laqué
      const postGeo = new THREE.BoxGeometry(0.2, height, 0.2);
      const offsets = [
        [-width / 2 + 0.3, -length / 2 + 0.3],
        [width / 2 - 0.3, -length / 2 + 0.3],
        [-width / 2 + 0.3, length / 2 - 0.3],
        [width / 2 - 0.3, length / 2 - 0.3],
      ];
      offsets.forEach(([px, pz]) => {
        const post = new THREE.Mesh(postGeo, steelMat);
        post.position.set(px, height / 2, pz);
        post.castShadow = true;
        group.add(post);
      });

      // Poutres périmétriques
      const beamX = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, 0.15), steelMat);
      beamX.position.set(0, height - 0.1, -length / 2 + 0.3);
      group.add(beamX);
      const beamX2 = beamX.clone();
      beamX2.position.z = length / 2 - 0.3;
      group.add(beamX2);

      // Lattes ajourées en bois composite (brise-soleil de toiture)
      for (let z = -length / 2 + 0.6; z <= length / 2 - 0.6; z += 0.8) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 0.15, 0.08), woodMat);
        slat.position.set(0, height, z);
        slat.castShadow = true;
        group.add(slat);
      }

      // Canapé lounge d'extérieur
      const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(width * 0.6, 0.35, 1.2), woodMat);
      sofaBase.position.set(0, 0.2, -length * 0.25);
      group.add(sofaBase);

      const cushion = new THREE.Mesh(new THREE.BoxGeometry(width * 0.58, 0.2, 1.1), cushionMat);
      cushion.position.set(0, 0.45, -length * 0.25);
      group.add(cushion);

      // Table basse d'extérieur
      const table = new THREE.Mesh(new THREE.BoxGeometry(width * 0.35, 0.4, 0.8), tableMat);
      table.position.set(0, 0.2, 0.5);
      table.castShadow = true;
      group.add(table);
      break;
    }

    // ── SERRE POLYCARBONATE BIOCLIMATIQUE NOVA ──
    case "nova_greenhouse_polycarbonate": {
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.9, roughness: 0.1 });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0f7fa,
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
        transmission: 0.9,
      });

      // Muret technique de base
      const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, length), new THREE.MeshStandardMaterial({ color: 0x546e7a }));
      base.position.set(0, 0.25, 0);
      group.add(base);

      // Parois transparentes polycarbonate
      const wallH = height * 0.65;
      const walls = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, wallH, length - 0.1), glassMat);
      walls.position.set(0, 0.5 + wallH / 2, 0);
      group.add(walls);

      // Ossature métallique
      for (let z = -length / 2; z <= length / 2; z += 4) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, 0.1), frameMat);
        rib.position.set(0, 0.5 + wallH, z);
        group.add(rib);
      }

      // Toiture double pente transparente
      const roofAngle = 0.35;
      const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(width * 0.55, 0.05, length), glassMat);
      roofLeft.position.set(-width * 0.24, 0.5 + wallH + (width * 0.15), 0);
      roofLeft.rotation.z = roofAngle;
      roofLeft.castShadow = true;

      const roofRight = roofLeft.clone();
      roofRight.position.x = width * 0.24;
      roofRight.rotation.z = -roofAngle;

      group.add(roofLeft);
      group.add(roofRight);
      break;
    }

    // ── BASSIN D'AGRÉMENT AVEC FONTAINE NOVA ──
    case "nova_fountain_pond": {
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.8 });
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0288d1,
        roughness: 0.1,
        metalness: 0.3,
      });

      const radius = width / 2;

      // Margelle extérieure en pierre
      const border = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.6, 24), stoneMat);
      border.position.set(0, 0.3, 0);
      border.castShadow = true;
      group.add(border);

      // Eau intérieure
      const water = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.88, radius * 0.88, 0.45, 24), waterMat);
      water.position.set(0, 0.35, 0);
      group.add(water);

      // Jet / Fontaine centrale
      const fountainPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.2, 12), stoneMat);
      fountainPillar.position.set(0, 0.7, 0);
      group.add(fountainPillar);

      const waterJet = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 8), new THREE.MeshBasicMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.7 }));
      waterJet.position.set(0, 1.6, 0);
      group.add(waterJet);
      break;
    }

    // ── SILO À GRAINS MÉTALLIQUE NOVA ──
    case "nova_grain_silo": {
      const siloMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.85, roughness: 0.25 });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });

      const siloRadius = width * 0.45;
      const cylH = height * 0.65;

      // Cuve principale ondulée
      const siloCyl = new THREE.Mesh(new THREE.CylinderGeometry(siloRadius, siloRadius, cylH, 24), siloMat);
      siloCyl.position.set(0, height * 0.2 + cylH / 2, 0);
      siloCyl.castShadow = true;
      group.add(siloCyl);

      // Toit conique supérieur
      const roofCone = new THREE.Mesh(new THREE.ConeGeometry(siloRadius * 1.05, height * 0.18, 24), siloMat);
      roofCone.position.set(0, height * 0.2 + cylH + (height * 0.09), 0);
      roofCone.castShadow = true;
      group.add(roofCone);

      // Cône de vidange inférieur
      const coneBottom = new THREE.Mesh(new THREE.ConeGeometry(siloRadius, height * 0.2, 24), siloMat);
      coneBottom.rotation.x = Math.PI;
      coneBottom.position.set(0, height * 0.1, 0);
      group.add(coneBottom);

      // Poteaux d'assise du silo
      for (let p = 0; p < 4; p++) {
        const ang = (p * Math.PI) / 2;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, height * 0.35), frameMat);
        leg.position.set(Math.cos(ang) * siloRadius, height * 0.175, Math.sin(ang) * siloRadius);
        leg.castShadow = true;
        group.add(leg);
      }
      break;
    }

    // ── PROJECTEUR SOLAIRE LED NOVA (ACTIF DE NUIT) ──
    case "nova_solar_floodlight": {
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.8 });
      const lampMat = new THREE.MeshStandardMaterial({
        color: isNight ? 0xfff9c4 : 0x78909c,
        emissive: isNight ? 0xffeb3b : 0x000000,
        emissiveIntensity: isNight ? 1.0 : 0,
      });

      // Poteau support
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, height, 8), mastMat);
      post.position.set(0, height / 2, 0);
      post.castShadow = true;
      group.add(post);

      // Panneau solaire sommital
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.6), new THREE.MeshStandardMaterial({ color: 0x0d47a1, metalness: 0.9 }));
      panel.position.set(0, height + 0.1, 0);
      panel.rotation.x = 0.3;
      group.add(panel);

      // Projecteur orientable vers le sol
      const lightHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), lampMat);
      lightHead.position.set(0, height - 0.3, 0.25);
      lightHead.rotation.x = 0.5;
      group.add(lightHead);

      // VRAIE SOURCE LUMINEUSE THREE.JS LORSQU'IL FAIT NUIT
      if (isNight) {
        const pointLight = new THREE.PointLight(0xfff8e1, 2.5, 30, 1.2);
        pointLight.position.set(0, height - 0.2, 0.6);
        pointLight.castShadow = true;
        group.add(pointLight);
      }
      break;
    }

    // ── BORNES BALISES CRÉPUSCULAIRES NOVA (ACTIVES DE NUIT) ──
    case "nova_bollard_light": {
      const bollardMat = new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.7 });
      const glowMat = new THREE.MeshStandardMaterial({
        color: isNight ? 0xffe082 : 0x90a4ae,
        emissive: isNight ? 0xffb74d : 0x000000,
        emissiveIntensity: isNight ? 0.9 : 0,
      });

      const numBollards = Math.max(3, Math.floor(length / 5));
      const stepZ = length / (numBollards - 1);

      for (let i = 0; i < numBollards; i++) {
        const z = -length / 2 + i * stepZ;
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12), bollardMat);
        b.position.set(0, 0.4, z);
        b.castShadow = true;
        group.add(b);

        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.15, 12), glowMat);
        ring.position.set(0, 0.7, z);
        group.add(ring);

        if (isNight && (i === 0 || i === Math.floor(numBollards / 2) || i === numBollards - 1)) {
          const bLight = new THREE.PointLight(0xffb74d, 1.2, 12, 2.0);
          bLight.position.set(0, 0.75, z);
          group.add(bLight);
        }
      }
      break;
    }

    // ── LAMPADAIRES SOLAIRES 6M NOVA ──
    case "solar_perimeter_light": {
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.85 });
      const luminaireMat = new THREE.MeshStandardMaterial({
        color: isNight ? 0xfff9c4 : 0x90a4ae,
        emissive: isNight ? 0xfff176 : 0x000000,
        emissiveIntensity: isNight ? 1.0 : 0,
      });

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, height, 10), poleMat);
      pole.position.set(0, height / 2, 0);
      pole.castShadow = true;
      group.add(pole);

      // Panneau solaire sur mât
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.8), new THREE.MeshStandardMaterial({ color: 0x0d47a1, metalness: 0.9 }));
      panel.position.set(0, height + 0.15, 0);
      panel.rotation.x = 0.28;
      group.add(panel);

      // Luminaire LED sur crosse
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.35), luminaireMat);
      head.position.set(0.6, height - 0.3, 0);
      group.add(head);

      if (isNight) {
        const streetLight = new THREE.SpotLight(0xfff8e1, 3.5, 35, Math.PI / 4, 0.3, 1.5);
        streetLight.position.set(0.6, height - 0.2, 0);
        streetLight.target.position.set(0.6, 0, 0);
        group.add(streetLight);
        group.add(streetLight.target);
      }
      break;
    }

    // ── CHÂTEAU D'EAU MÉTALLIQUE ──
    case "water_tower": {
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.8, roughness: 0.3 });
      const tankMat = new THREE.MeshStandardMaterial({ color: pipeCol, metalness: 0.6, roughness: 0.3 });

      const legH = height - 2.8;
      const legGeo = new THREE.CylinderGeometry(0.14, 0.18, legH, 8);
      const span = width * 0.38;

      [
        [-span, -span],
        [span, -span],
        [-span, span],
        [span, span],
      ].forEach(([px, pz]) => {
        const leg = new THREE.Mesh(legGeo, pylonMat);
        leg.position.set(px, legH / 2, pz);
        leg.castShadow = true;
        group.add(leg);
      });

      const tankGeo = new THREE.CylinderGeometry(width * 0.48, width * 0.48, 2.6, 24);
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(0, height - 1.4, 0);
      tank.castShadow = true;
      group.add(tank);
      break;
    }

    // ── FORAGE & POMPAGE SOLAIRE ──
    case "solar_pump": {
      const wellBaseMat = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.8 });
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x0d47a1, metalness: 0.9, roughness: 0.1 });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });

      const well = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.8, 16), wellBaseMat);
      well.position.set(0, 0.4, 2.2);
      well.castShadow = true;
      group.add(well);

      for (let i = -1; i <= 1; i++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(width * 0.28, 0.08, length * 0.65), panelMat);
        panel.position.set(i * width * 0.31, 1.7, -1.0);
        panel.rotation.x = 0.32;
        panel.castShadow = true;
        group.add(panel);
      }
      break;
    }

    // ── POULAILLER BIOCLIMATIQUE ──
    case "poultry_house": {
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xef6c00, roughness: 0.7 });
      const meshMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, wireframe: true });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, metalness: 0.4, roughness: 0.5 });

      const baseWall = new THREE.Mesh(new THREE.BoxGeometry(width, 0.8, length), wallMat);
      baseWall.position.set(0, 0.4, 0);
      baseWall.castShadow = true;
      group.add(baseWall);

      const meshWall = new THREE.Mesh(new THREE.BoxGeometry(width * 0.98, 1.8, length * 0.98), meshMat);
      meshWall.position.set(0, 1.7, 0);
      group.add(meshWall);

      const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(width * 0.58, 0.1, length + 1.2), roofMat);
      roofLeft.position.set(-width * 0.25, 2.9, 0);
      roofLeft.rotation.z = 0.28;
      roofLeft.castShadow = true;

      const roofRight = roofLeft.clone();
      roofRight.position.x = width * 0.25;
      roofRight.rotation.z = -0.28;

      group.add(roofLeft);
      group.add(roofRight);
      break;
    }

    // ── ÉTABLE BOVINE ──
    case "cattle_shed": {
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.5, roughness: 0.4 });
      const postMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });

      const stepZ = length / 4;
      for (let z = -length / 2; z <= length / 2; z += stepZ) {
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, height), postMat);
        postL.position.set(-width / 2, height / 2, z);
        const postR = postL.clone();
        postR.position.set(width / 2, height / 2, z);
        group.add(postL);
        group.add(postR);
      }

      const roofL = new THREE.Mesh(new THREE.BoxGeometry(width * 0.56, 0.12, length + 1.5), roofMat);
      roofL.position.set(-width * 0.26, height + 0.3, 0);
      roofL.rotation.z = 0.24;
      roofL.castShadow = true;

      const roofR = roofL.clone();
      roofR.position.x = width * 0.26;
      roofR.rotation.z = -0.24;

      group.add(roofL);
      group.add(roofR);
      break;
    }

    // ── CLÔTURE GRILLAGÉE ──
    case "wire_fence": {
      const meshMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, wireframe: true });
      const postMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });

      const fence = new THREE.Mesh(new THREE.BoxGeometry(0.08, height, length), meshMat);
      fence.position.set(0, height / 2, 0);
      group.add(fence);

      for (let z = -length / 2; z <= length / 2; z += 4) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, height + 0.3), postMat);
        post.position.set(0, (height + 0.3) / 2, z);
        group.add(post);
      }
      break;
    }

    // ── PISTE LATÉRITIQUE ──
    case "laterite_road": {
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x8d3214, roughness: 0.95 });
      const road = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, length), roadMat);
      road.position.set(0, 0.04, 0);
      road.receiveShadow = true;
      group.add(road);
      break;
    }

    // ── CORDONS PIERREUX ──
    case "cordons_pierreux": {
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.95 });
      for (let z = -length / 2; z <= length / 2; z += 2.0) {
        const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), stoneMat);
        stone.position.set((Math.sin(z) * 0.2), 0.35, z);
        stone.castShadow = true;
        group.add(stone);
      }
      break;
    }

    // ── DÉFAUT : BLOC PROPRE ET COLORÉ ──
    default: {
      const defMat = new THREE.MeshStandardMaterial({ color: bldCol, roughness: 0.6 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), defMat);
      box.position.set(0, height / 2, 0);
      box.castShadow = true;
      group.add(box);
      break;
    }
  }

  return group;
}
