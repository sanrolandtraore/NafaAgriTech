/**
 * NAFA STUDIO 3D — BIBLIOTHÈQUE D'ÉLÉMENTS TYPIQUES (INSPIRÉ JARDI UP 3D)
 * 
 * Bibliothèque exhaustive d'objets tridimensionnels adaptés aux exploitations agricoles,
 * périmètres maraîchers, vergers, fermes d'élevage et parcs agro-pastoraux du Burkina Faso / Sahel.
 * 
 * Catégories :
 * 1. Vegetaux & Vergers (Manguiers greffés, Papayers, Bananiers, Agrumes, Acacias, Moringa, Maraîchage en planches/buttes)
 * 2. Hydraulique & Irrigation (Château d'eau galva/béton, Tête de forage solaire, Bassin bâché, Borne d'irrigation, Rampes)
 * 3. Bâtiments & Élevage (Poulailler bioclimatique à lanterneau, Étable bovine aérée, Bergerie ovine, Porcherie, Magasin d'intrants)
 * 4. Énergie & Solaire (Champs photovoltaïques inclinés, Local onduleur/batteries, Clôture électrique solaire)
 * 5. Aménagement, Clôtures & Voirie (Haie vive épineuse, Clôture grillagée, Piste latéritique, Cordons pierreux, Demi-lunes)
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
} from "lucide-react";
import type { ElementCategory } from "@/components/field-designer/Studio3DFarmModeler";

export type JardiCategory =
  | "vegetaux_vergers"
  | "hydraulique_irrigation"
  | "batiments_elevage"
  | "energie_solaire"
  | "amenagement_clotures";

export interface JardiCatalogItem {
  type: string;
  name: string;
  jardiCategory: JardiCategory;
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
}

export const JARDI_CATEGORIES: Array<{
  id: JardiCategory;
  label: string;
  shortLabel: string;
  icon: any;
  count: number;
  description: string;
}> = [
  {
    id: "vegetaux_vergers",
    label: "Végétation & Vergers",
    shortLabel: "Végétaux",
    icon: Trees,
    count: 6,
    description: "Manguiers, papayers, bananiers, agrumes, haies vives et planches maraîchères calibrées.",
  },
  {
    id: "hydraulique_irrigation",
    label: "Hydraulique & Irrigation",
    shortLabel: "Hydraulique",
    icon: Droplets,
    count: 6,
    description: "Châteaux d'eau, stations de pompage solaire, bassins bâchés, bornes et têtes de réseau.",
  },
  {
    id: "batiments_elevage",
    label: "Bâtiments & Élevage",
    shortLabel: "Élevage",
    icon: Building2,
    count: 6,
    description: "Poulaillers bioclimatiques avec lanterneau faîtier, bergeries, étables et magasins d'intrants.",
  },
  {
    id: "energie_solaire",
    label: "Énergie & Solaire",
    shortLabel: "Solaire",
    icon: Zap,
    count: 3,
    description: "Champs photovoltaïques sur châssis incliné 15° Sud, onduleurs et générateurs hybrides.",
  },
  {
    id: "amenagement_clotures",
    label: "Clôtures & Aménagement Rural",
    shortLabel: "Clôtures & Sol",
    icon: Shovel,
    count: 5,
    description: "Clôtures grillagées anti-divagation, pistes latéritiques, cordons pierreux et demi-lunes.",
  },
];

export const JARDI_CATALOG_ITEMS: JardiCatalogItem[] = [
  // ── 1. VÉGÉTAUX & VERGERS ──
  {
    type: "orchard_mango",
    name: "Verger de Manguiers Greffés (Amélie / Kent)",
    jardiCategory: "vegetaux_vergers",
    category: "crop",
    description: "Arbres fruitiers à grand houppier persistant. Espacement standard 10m × 10m ou 8m × 8m.",
    width: 24,
    length: 24,
    height: 5.5,
    defaultColorHex: 0x1b5e20,
    costFcfa: 750000,
    unit: "parcelle 24x24m",
    supplierRecommendation: "Pépinières Agro-Forestières Bobo-Dioulasso",
    icon: Trees,
    tags: ["manguier", "fruitier", "verger", "arboriculture", "ombrage"],
  },
  {
    type: "orchard_papaya",
    name: "Plantation de Papayers Solo 8 / Horizon",
    jardiCategory: "vegetaux_vergers",
    category: "crop",
    description: "Culture fruitière semi-dense à entrée rapide en production (9 mois). Stipe élancé avec touffe apicale.",
    width: 15,
    length: 20,
    height: 3.8,
    defaultColorHex: 0x2e7d32,
    costFcfa: 420000,
    unit: "parcelle 15x20m",
    supplierRecommendation: "Coopérative Maraîchère du Bazèga",
    icon: Sprout,
    tags: ["papaye", "fruitier", "maraichage", "rapide"],
  },
  {
    type: "orchard_banana",
    name: "Bananiers en Bananeraie Irriguée",
    jardiCategory: "vegetaux_vergers",
    category: "crop",
    description: "Grandes feuilles palmées avec régime en formation. Forte demande hydrique au goutte-à-goutte.",
    width: 16,
    length: 20,
    height: 4.2,
    defaultColorHex: 0x388e3c,
    costFcfa: 580000,
    unit: "îlot bananeraie",
    supplierRecommendation: "Station INERA Vallée du Sourou",
    icon: Trees,
    tags: ["bananier", "fruitier", "irrigue", "humide"],
  },
  {
    type: "crop_vegetables",
    name: "Planches Maraîchères Surélevées (Oignon / Tomate)",
    jardiCategory: "vegetaux_vergers",
    category: "crop",
    description: "Planches calibrées de 1.2m avec allées de circulation de 0.6m. Deux rampes goutte-à-goutte par planche.",
    width: 15,
    length: 25,
    height: 1.0,
    defaultColorHex: 0x4caf50,
    costFcfa: 350000,
    unit: "bloc maraîcher",
    supplierRecommendation: "Tropic Agro Ouagadougou",
    icon: Sprout,
    tags: ["maraichage", "tomate", "oignon", "goutte-a-goutte", "planche"],
  },
  {
    type: "greenhouse",
    name: "Serre Tunnel Maraîchère Tropicalisée 3D",
    jardiCategory: "vegetaux_vergers",
    category: "crop",
    description: "Structure cintrée en acier galvanisé recouverte d'un film polyéthylène diffuseur anti-UV 200µ.",
    width: 10,
    length: 30,
    height: 3.5,
    defaultColorHex: 0x81d4fa,
    costFcfa: 2800000,
    unit: "unité 300m²",
    supplierRecommendation: "Agrodia Équipements",
    icon: Warehouse,
    tags: ["serre", "tunnel", "abri", "culture protegee", "hors sol"],
  },
  {
    type: "shade_house",
    name: "Ombrière Filet Agro-Textile 50% d'Ombrage",
    jardiCategory: "vegetaux_vergers",
    category: "crop",
    description: "Filet monofilament vert atténuant l'évapotranspiration et protégeant contre les brûlures solaires.",
    width: 12,
    length: 25,
    height: 3.0,
    defaultColorHex: 0x4db6ac,
    costFcfa: 1500000,
    unit: "unité 300m²",
    supplierRecommendation: "Tropic Agro BF",
    icon: Warehouse,
    tags: ["ombriere", "ombrage", "filet", "anti-uv"],
  },

  // ── 2. HYDRAULIQUE & IRRIGATION ──
  {
    type: "water_tower",
    name: "Château d'Eau Métallique 10m³ sur Pylône 8m",
    jardiCategory: "hydraulique_irrigation",
    category: "irrigation",
    description: "Cuve cylindrique en acier galvanisé ou polyéthylène renforcé montée sur 4 montants en cornière.",
    width: 5,
    length: 5,
    height: 8.0,
    defaultColorHex: 0x00acc1,
    costFcfa: 4200000,
    unit: "château complet",
    supplierRecommendation: "Sodimex Sahel Ouaga",
    icon: Droplets,
    tags: ["chateau", "eau", "stockage", "pression", "gravitaire"],
  },
  {
    type: "solar_pump",
    name: "Tête de Forage & Pompage Solaire Immergé",
    jardiCategory: "hydraulique_irrigation",
    category: "irrigation",
    description: "Forage tubé PVC avec margelle béton, pompe hélicoïdale immergée et boîtier de contrôle MPPT.",
    width: 8,
    length: 6,
    height: 2.5,
    defaultColorHex: 0x0288d1,
    costFcfa: 3500000,
    unit: "kit complet",
    supplierRecommendation: "Faso Solaire Distribution",
    icon: Zap,
    tags: ["forage", "pompe", "solaire", "mppt", "puits"],
  },
  {
    type: "retention_pond",
    name: "Bassin de Rétention Bâché Géomembrane 500m³",
    jardiCategory: "hydraulique_irrigation",
    category: "irrigation",
    description: "Excavation talutée étanchée par géomembrane PEHD 1mm pour stockage tampon d'irrigation.",
    width: 20,
    length: 20,
    height: 2.0,
    defaultColorHex: 0x039be5,
    costFcfa: 1800000,
    unit: "bassin 500m³",
    supplierRecommendation: "Sahel Géotextiles",
    icon: Droplets,
    tags: ["bassin", "geomembrane", "pehd", "stockage", "tampon"],
  },
  {
    type: "filtration_station",
    name: "Station de Filtration & Fertirrigation à Disques",
    jardiCategory: "hydraulique_irrigation",
    category: "irrigation",
    description: "Batterie de filtres à disques 120 mesh avec injecteur Venturi et bac de fertilisation en ligne.",
    width: 4,
    length: 5,
    height: 2.0,
    defaultColorHex: 0x00838f,
    costFcfa: 950000,
    unit: "station complète",
    supplierRecommendation: "Rivulis / Tropic Agro BF",
    icon: Droplets,
    tags: ["filtration", "fertirrigation", "venturi", "disque", "tete de reseau"],
  },
  {
    type: "irrigation_valve_station",
    name: "Borne / Regard de Vannes Sectorielles",
    jardiCategory: "hydraulique_irrigation",
    category: "irrigation",
    description: "Regard enterré maçonné avec électrovannes et vannes manuelles pour gestion par secteur.",
    width: 2.5,
    length: 2.5,
    height: 0.8,
    defaultColorHex: 0x0097a7,
    costFcfa: 250000,
    unit: "borne sectorielle",
    supplierRecommendation: "Tropic Agro BF",
    icon: Droplets,
    tags: ["vanne", "regard", "secteur", "distribution"],
  },
  {
    type: "drip_manifold",
    name: "Collecteur & Rampes Goutte-à-Goutte au Sol",
    jardiCategory: "hydraulique_irrigation",
    category: "irrigation",
    description: "Tuyau porte-rampes PEHD Ø50mm avec départs de gaines goutte-à-goutte autorégulantes 1.6 L/h.",
    width: 12,
    length: 30,
    height: 0.25,
    defaultColorHex: 0x0277bd,
    costFcfa: 480000,
    unit: "réseau parcelle",
    supplierRecommendation: "Rivulis BF Partner",
    icon: Droplets,
    tags: ["tuyaux", "rampes", "goutteurs", "pehd", "collecteur"],
  },

  // ── 3. BÂTIMENTS & ÉLEVAGE ──
  {
    type: "poultry_house",
    name: "Poulailler Bioclimatique à Lanterneau Faîtier",
    jardiCategory: "batiments_elevage",
    category: "building",
    description: "Orientation Est-Ouest, muret de soubassement 60cm, grillage maille fine et lanterneau d'aération thermo-siphon.",
    width: 12,
    length: 35,
    height: 4.2,
    defaultColorHex: 0xf57c00,
    costFcfa: 6500000,
    unit: "bâtiment 1000 sujets",
    supplierRecommendation: "BTP Agro Sahel Ouaga",
    icon: Building2,
    tags: ["poulailler", "aviculture", "bioclimatique", "lanterneau", "volaille"],
  },
  {
    type: "cattle_shed",
    name: "Hangar Bovin & Étable d'Embouche Aérée",
    jardiCategory: "batiments_elevage",
    category: "building",
    description: "Charpente métallique robuste, toit bac alu deux pentes avec auvent d'ombrage et couloir central d'alimentation.",
    width: 15,
    length: 25,
    height: 4.5,
    defaultColorHex: 0x8d6e63,
    costFcfa: 4800000,
    unit: "étable 30 bovins",
    supplierRecommendation: "Chantier Métallique du Kadiogo",
    icon: Building2,
    tags: ["bovin", "embouche", "etable", "hangar", "cheptel"],
  },
  {
    type: "sheep_pen",
    name: "Bergerie Ovine & Caprine Améliorée",
    jardiCategory: "batiments_elevage",
    category: "building",
    description: "Boxes d'agnelage séparés, auges en bois surélevées et cour extérieure grillagée.",
    width: 12,
    length: 20,
    height: 3.5,
    defaultColorHex: 0x6d4c41,
    costFcfa: 3200000,
    unit: "bergerie 80 ovins",
    supplierRecommendation: "Artisans Bois & Métal Fada",
    icon: Building2,
    tags: ["ovin", "caprin", "mouton", "chevre", "bergerie"],
  },
  {
    type: "solar_coldroom",
    name: "Chambre Froide Solaire Autonome (Conservation)",
    jardiCategory: "batiments_elevage",
    category: "building",
    description: "Panneaux sandwich isothermes 100mm, groupe frigorifique solaire DC sans batterie chimique (stockage thermique).",
    width: 8,
    length: 10,
    height: 3.5,
    defaultColorHex: 0x37474f,
    costFcfa: 8500000,
    unit: "module 20 tonnes",
    supplierRecommendation: "Koolboks / Solaire Innovation BF",
    icon: Warehouse,
    tags: ["froid", "conservation", "solaire", "isotherme", "recolte"],
  },
  {
    type: "input_warehouse",
    name: "Magasin d'Intrants & Stockage Sécurisé",
    jardiCategory: "batiments_elevage",
    category: "building",
    description: "Bâtiment maçonné ventilé avec dalles anti-humidité pour engrais, semences et matériel technique.",
    width: 10,
    length: 15,
    height: 3.8,
    defaultColorHex: 0x546e7a,
    costFcfa: 3800000,
    unit: "hangar magasin",
    supplierRecommendation: "Entreprise Générale Sahel",
    icon: Warehouse,
    tags: ["magasin", "intrants", "engrais", "semences", "securise"],
  },
  {
    type: "water_trough",
    name: "Abreuvoir Automatique Maçonné avec Flotteur",
    jardiCategory: "batiments_elevage",
    category: "building",
    description: "Bac béton vibré avec vanne flotteur laiton et trop-plein vers puisard filtrant.",
    width: 2.0,
    length: 6.0,
    height: 0.8,
    defaultColorHex: 0x78909c,
    costFcfa: 180000,
    unit: "abreuvoir 6m",
    supplierRecommendation: "Maçonnerie Locale",
    icon: Droplets,
    tags: ["abreuvoir", "beton", "bovins", "ovins", "flotteur"],
  },

  // ── 4. ÉNERGIE & SOLAIRE ──
  {
    type: "solar_pv_array",
    name: "Champ Photovoltaïque 12 kWp Incliné 15° Sud",
    jardiCategory: "energie_solaire",
    category: "irrigation",
    description: "Table de modules monocristallins sur châssis tubulaire traité anti-corrosion, orientation plein Sud.",
    width: 10,
    length: 8,
    height: 2.4,
    defaultColorHex: 0x0d47a1,
    costFcfa: 5200000,
    unit: "centrale 12 kWp",
    supplierRecommendation: "Faso Solaire Ouaga",
    icon: Zap,
    tags: ["solaire", "pv", "panneaux", "energie", "onduleur"],
  },
  {
    type: "generator_shelter",
    name: "Abri Technique Onduleur / Groupe de Secours",
    jardiCategory: "energie_solaire",
    category: "building",
    description: "Abri ventilé avec porte cadenassée, socle anti-vibratile et extincteur automatique.",
    width: 4,
    length: 5,
    height: 2.8,
    defaultColorHex: 0x455a64,
    costFcfa: 1100000,
    unit: "local technique",
    supplierRecommendation: "BTP Sahel",
    icon: Warehouse,
    tags: ["abri", "groupe", "onduleur", "technique"],
  },
  {
    type: "solar_perimeter_light",
    name: "Lampadaires Solaires Autonomes LED (x4)",
    jardiCategory: "energie_solaire",
    category: "infrastructure",
    description: "Mâts métalliques 6m avec panneau 80W, batterie lithium et luminaire LED 6000 lumens détection crépusculaire.",
    width: 4,
    length: 30,
    height: 6.0,
    defaultColorHex: 0xffb300,
    costFcfa: 680000,
    unit: "lot de 4 mâts",
    supplierRecommendation: "Solaire BF",
    icon: Sun,
    tags: ["eclairage", "securite", "lampadaire", "led"],
  },

  // ── 5. CLÔTURES & AMÉNAGEMENT RURAL ──
  {
    type: "wire_fence",
    name: "Clôture Grillagée Métallique Anti-Divagation",
    jardiCategory: "amenagement_clotures",
    category: "infrastructure",
    description: "Grillage simple torsion galvanisé 1.8m avec poteaux cornières scellés et 3 rangs de ronce supérieure.",
    width: 1.5,
    length: 50,
    height: 2.0,
    defaultColorHex: 0x90a4ae,
    costFcfa: 350000,
    unit: "section 50m",
    supplierRecommendation: "Quincaillerie Moderne Ouaga",
    icon: Fence,
    tags: ["cloture", "grillage", "anti-divagation", "securite", "limite"],
  },
  {
    type: "windbreak",
    name: "Haie Vive & Brise-Vent Agroforestier (Acacia/Moringa)",
    jardiCategory: "amenagement_clotures",
    category: "infrastructure",
    description: "Double rangée d'arbres épineux et essences locales limitant le dessèchement dû à l'Harmattan.",
    width: 4,
    length: 45,
    height: 4.8,
    defaultColorHex: 0x2e7d32,
    costFcfa: 160000,
    unit: "alignement 45m",
    supplierRecommendation: "Pépinière Communale",
    icon: Trees,
    tags: ["haie", "brise-vent", "acacia", "moringa", "agroforesterie"],
  },
  {
    type: "laterite_road",
    name: "Piste d'Exploitation Latéritique Carrossable",
    jardiCategory: "amenagement_clotures",
    category: "infrastructure",
    description: "Voie de circulation compactée 4m de large pour tracteurs, charrettes et camionnettes de récolte.",
    width: 4.5,
    length: 60,
    height: 0.15,
    defaultColorHex: 0x8d3214,
    costFcfa: 450000,
    unit: "piste 60m",
    supplierRecommendation: "Travaux Ruraux Sahel",
    icon: Shovel,
    tags: ["piste", "route", "laterite", "voie", "tracteur"],
  },
  {
    type: "cordons_pierreux",
    name: "Cordons Pierreux Anti-Érosifs sur Courbe de Niveau",
    jardiCategory: "amenagement_clotures",
    category: "infrastructure",
    description: "Alignement de moellons de latérite ralentissant le ruissellement et favorisant l'infiltration de l'eau.",
    width: 2.0,
    length: 50,
    height: 0.6,
    defaultColorHex: 0x78909c,
    costFcfa: 150000,
    unit: "cordon 50m",
    supplierRecommendation: "Groupement Villageois CES/DRS",
    icon: Shovel,
    tags: ["cordon", "pierre", "anti-erosif", "ces-drs", "eau"],
  },
  {
    type: "demi_lunes",
    name: "Dispositif de Demi-Lunes Sahéliennes Aménagées",
    jardiCategory: "amenagement_clotures",
    category: "crop",
    description: "Cuvettes semi-circulaires perpendiculaires à la pente piégeant l'eau et le compost organique.",
    width: 18,
    length: 25,
    height: 0.5,
    defaultColorHex: 0x8d6e63,
    costFcfa: 220000,
    unit: "parcelle 450m²",
    supplierRecommendation: "Programme CES/DRS",
    icon: Sprout,
    tags: ["demi-lunes", "zai", "eau", "restauration", "sol"],
  },
];

/**
 * Générateur procédural de géométries 3D ultra-détaillées pour Three.js.
 * Remplace les simples boîtes par de véritables objets réalistes.
 */
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
  }
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

  switch (type) {
    // ── MANGUIERS GREFFÉS ──
    case "orchard_mango": {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.6 });
      const fruitMat = new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.3 });

      const spacing = 10;
      for (let x = -width / 2 + 5; x <= width / 2 - 5; x += spacing) {
        for (let z = -length / 2 + 5; z <= length / 2 - 5; z += spacing) {
          // Tronc évasé à la base
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.65, 2.2, 10), trunkMat);
          trunk.position.set(x, 1.1, z);
          trunk.castShadow = true;
          group.add(trunk);

          // Houppier volumineux sphérique & étages
          const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 2), foliageMat);
          crown.position.set(x, 3.4, z);
          crown.castShadow = true;
          group.add(crown);

          const crownTop = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), foliageMat);
          crownTop.position.set(x, 4.4, z);
          crownTop.castShadow = true;
          group.add(crownTop);

          // Quelques fruits dorés visibles
          for (let f = 0; f < 3; f++) {
            const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), fruitMat);
            fruit.position.set(x + (f - 1) * 1.2, 2.8 + (f % 2) * 0.4, z + (f === 1 ? 1.5 : -1.2));
            group.add(fruit);
          }
        }
      }
      break;
    }

    // ── PAPAYERS SOLO ──
    case "orchard_papaya": {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.8 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.5 });
      const fruitMat = new THREE.MeshStandardMaterial({ color: 0xfdd835, roughness: 0.3 });

      const spacing = 5;
      for (let x = -width / 2 + 3; x <= width / 2 - 3; x += spacing) {
        for (let z = -length / 2 + 3; z <= length / 2 - 3; z += spacing) {
          const stipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.0, 8), trunkMat);
          stipe.position.set(x, 1.5, z);
          stipe.castShadow = true;
          group.add(stipe);

          // Fruits serrés sous la couronne
          for (let p = 0; p < 4; p++) {
            const pap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.45, 6), fruitMat);
            const ang = (p * Math.PI) / 2;
            pap.position.set(x + Math.cos(ang) * 0.35, 2.7, z + Math.sin(ang) * 0.35);
            group.add(pap);
          }

          // Feuilles palmées sommitales
          for (let l = 0; l < 6; l++) {
            const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.4), leafMat);
            const ang = (l * Math.PI) / 3;
            leaf.position.set(x + Math.cos(ang) * 0.9, 3.2, z + Math.sin(ang) * 0.9);
            leaf.rotation.y = ang;
            leaf.rotation.z = 0.35;
            group.add(leaf);
          }
        }
      }
      break;
    }

    // ── BANANIERS ──
    case "orchard_banana": {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x558b2f, roughness: 0.7 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.4 });

      const spacing = 6;
      for (let x = -width / 2 + 3; x <= width / 2 - 3; x += spacing) {
        for (let z = -length / 2 + 3; z <= length / 2 - 3; z += spacing) {
          const pseudoTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 2.4, 8), trunkMat);
          pseudoTrunk.position.set(x, 1.2, z);
          pseudoTrunk.castShadow = true;
          group.add(pseudoTrunk);

          // Grandes feuilles arquées
          for (let b = 0; b < 5; b++) {
            const leaf = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.7), leafMat);
            const ang = (b * Math.PI * 2) / 5;
            leaf.position.set(x + Math.cos(ang) * 1.2, 2.4, z + Math.sin(ang) * 1.2);
            leaf.rotation.y = ang;
            leaf.rotation.z = -0.4;
            group.add(leaf);
          }
        }
      }
      break;
    }

    // ── CHÂTEAU D'EAU MÉTALLIQUE ──
    case "water_tower": {
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.8, roughness: 0.3 });
      const tankMat = new THREE.MeshStandardMaterial({ color: pipeCol, metalness: 0.6, roughness: 0.3 });
      const ladderMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.9 });

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

      // Croisillons métalliques de renfort
      const braceMat = new THREE.MeshBasicMaterial({ color: 0x607d8b });
      for (let lvl = 1; lvl <= 2; lvl++) {
        const yb = (legH * lvl) / 3;
        const ring = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.1, width * 0.8), braceMat);
        ring.position.set(0, yb, 0);
        group.add(ring);
      }

      // Cuve d'eau cylindrique supérieure
      const tankGeo = new THREE.CylinderGeometry(width * 0.48, width * 0.48, 2.6, 24);
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(0, height - 1.4, 0);
      tank.castShadow = true;
      group.add(tank);

      // Dôme toit de la cuve
      const domeGeo = new THREE.SphereGeometry(width * 0.48, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, tankMat);
      dome.position.set(0, height - 0.1, 0);
      group.add(dome);

      // Échelle d'accès
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.3, legH, 0.05), ladderMat);
      ladder.position.set(span + 0.15, legH / 2, 0);
      group.add(ladder);
      break;
    }

    // ── FORAGE & POMPAGE SOLAIRE ──
    case "solar_pump": {
      const wellBaseMat = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.8 });
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x0d47a1, metalness: 0.9, roughness: 0.1 });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });

      // Margelle béton du forage
      const well = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.8, 16), wellBaseMat);
      well.position.set(0, 0.4, 2.2);
      well.castShadow = true;
      group.add(well);

      // Tête de tubage en acier
      const pipeHead = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 12), frameMat);
      pipeHead.position.set(0, 0.9, 2.2);
      group.add(pipeHead);

      // Table photovoltaïque inclinée 15°
      for (let i = -1; i <= 1; i++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(width * 0.28, 0.08, length * 0.65), panelMat);
        panel.position.set(i * width * 0.31, 1.7, -1.0);
        panel.rotation.x = 0.32; // ~18° inclinaison optimale Sahel
        panel.castShadow = true;
        group.add(panel);

        // Pieds du châssis
        const legFront = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2), frameMat);
        legFront.position.set(i * width * 0.31, 0.6, -0.2);
        group.add(legFront);

        const legBack = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2), frameMat);
        legBack.position.set(i * width * 0.31, 1.1, -1.8);
        group.add(legBack);
      }
      break;
    }

    // ── POULAILLER BIOCLIMATIQUE AVEC LANTERNEAU ──
    case "poultry_house": {
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xef6c00, roughness: 0.7 });
      const meshMat = new THREE.MeshStandardMaterial({
        color: 0xb0bec5,
        wireframe: true,
      });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, metalness: 0.4, roughness: 0.5 });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x455a64 });

      // Muret soubassement 60cm
      const baseWall = new THREE.Mesh(new THREE.BoxGeometry(width, 0.8, length), wallMat);
      baseWall.position.set(0, 0.4, 0);
      baseWall.castShadow = true;
      group.add(baseWall);

      // Grillage d'aération périphérique sur 1.8m
      const meshWall = new THREE.Mesh(new THREE.BoxGeometry(width * 0.98, 1.8, length * 0.98), meshMat);
      meshWall.position.set(0, 1.7, 0);
      group.add(meshWall);

      // Poteaux d'ossature
      for (let z = -length / 2; z <= length / 2; z += length / 4) {
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8), frameMat);
        p1.position.set(-width / 2, 1.4, z);
        const p2 = p1.clone();
        p2.position.set(width / 2, 1.4, z);
        group.add(p1);
        group.add(p2);
      }

      // Toiture bac alu avec débord et double pente
      const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(width * 0.58, 0.1, length + 1.2), roofMat);
      roofLeft.position.set(-width * 0.25, 2.9, 0);
      roofLeft.rotation.z = 0.28;
      roofLeft.castShadow = true;

      const roofRight = roofLeft.clone();
      roofRight.position.x = width * 0.25;
      roofRight.rotation.z = -0.28;

      group.add(roofLeft);
      group.add(roofRight);

      // Lanterneau faîtier d'évacuation d'air chaud
      const lanternRoof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.3, 0.08, length * 0.8), roofMat);
      lanternRoof.position.set(0, 3.4, 0);
      group.add(lanternRoof);
      break;
    }

    // ── ÉTABLE D'EMBOUCHE BOVINE ──
    case "cattle_shed": {
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.5, roughness: 0.4 });
      const postMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
      const troughMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae });

      // Poteaux bois / métal
      const stepZ = length / 4;
      for (let z = -length / 2; z <= length / 2; z += stepZ) {
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, height), postMat);
        postL.position.set(-width / 2, height / 2, z);
        const postR = postL.clone();
        postR.position.set(width / 2, height / 2, z);
        group.add(postL);
        group.add(postR);
      }

      // Grande toiture deux pentes
      const roofL = new THREE.Mesh(new THREE.BoxGeometry(width * 0.56, 0.12, length + 1.5), roofMat);
      roofL.position.set(-width * 0.26, height + 0.3, 0);
      roofL.rotation.z = 0.24;
      roofL.castShadow = true;

      const roofR = roofL.clone();
      roofR.position.x = width * 0.26;
      roofR.rotation.z = -0.24;

      group.add(roofL);
      group.add(roofR);

      // Mangeoire / auge centrale béton
      const trough = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, length * 0.85), troughMat);
      trough.position.set(0, 0.35, 0);
      group.add(trough);
      break;
    }

    // ── BERGERIE OVINE AMÉLIORÉE ──
    case "sheep_pen": {
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xa1887f, metalness: 0.2 });

      // Murs semi-ouverts
      const walls = new THREE.Mesh(new THREE.BoxGeometry(width, 1.6, length), wallMat);
      walls.position.set(0, 0.8, 0);
      group.add(walls);

      // Toiture simple pente inclinée
      const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.8, 0.1, length + 0.8), roofMat);
      roof.position.set(0, height, 0);
      roof.rotation.x = 0.12;
      roof.castShadow = true;
      group.add(roof);
      break;
    }

    // ── CLÔTURE GRILLAGÉE ANTI-DIVAGATION ──
    case "wire_fence": {
      const meshMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, wireframe: true });
      const postMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });

      // Grillage
      const fence = new THREE.Mesh(new THREE.BoxGeometry(0.08, height, length), meshMat);
      fence.position.set(0, height / 2, 0);
      group.add(fence);

      // Poteaux tous les 4 mètres
      for (let z = -length / 2; z <= length / 2; z += 4) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, height + 0.3), postMat);
        post.position.set(0, (height + 0.3) / 2, z);
        group.add(post);
      }
      break;
    }

    // ── PISTE D'EXPLOITATION LATÉRITIQUE ──
    case "laterite_road": {
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x8d3214, roughness: 0.95 });
      const road = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, length), roadMat);
      road.position.set(0, 0.04, 0);
      road.receiveShadow = true;
      group.add(road);
      break;
    }

    // ── CHAMP PHOTOVOLTAÏQUE 12 KWP ──
    case "solar_pv_array": {
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x0d47a1, metalness: 0.95, roughness: 0.1 });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.8 });

      for (let r = -1; r <= 1; r++) {
        for (let c = -2; c <= 2; c++) {
          const mod = new THREE.Mesh(new THREE.BoxGeometry(width * 0.16, 0.06, length * 0.28), panelMat);
          mod.position.set(c * (width * 0.18), 1.2 + r * 0.4, r * (length * 0.3));
          mod.rotation.x = 0.28;
          mod.castShadow = true;
          group.add(mod);
        }
      }

      // Châssis métallique support
      const frame = new THREE.Mesh(new THREE.BoxGeometry(width * 0.95, 0.1, length * 0.9), frameMat);
      frame.position.set(0, 0.8, 0);
      group.add(frame);
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

    // ── DÉFAUT : BOX TECHNIQUE PROPRE ──
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
