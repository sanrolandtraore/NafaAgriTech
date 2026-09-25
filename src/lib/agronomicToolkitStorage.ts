/**
 * NAFA - AGRITECH : Suite d'Outils Professionnels « Services Agronomiques & Conseils »
 * 
 * Spécifications UX & Métier :
 * 1. Organisation visuelle en cartes interactives (Zéro liste interminable).
 * 2. 5 Grandes Catégories + Carte Spéciale NAFA Genius IA.
 * 3. Recherche Intelligente « Que voulez-vous faire ? ».
 * 4. Gestion des Outils Favoris ⭐ et Outils Récemment Utilisés.
 * 5. Badges de Connectivité : 🟢 Hors ligne (Offline-First) / ☁️ Connexion requise.
 * 6. IA Contextuelle liée à chaque outil ouvert.
 */

export type ToolkitCategory =
  | "all"
  | "terrain_carto"
  | "agronomie"
  | "irrigation"
  | "ingenierie"
  | "gestion_analyse";

export interface ToolkitBadge {
  label: string;
  variant: "ia" | "gps" | "offline" | "new" | "pdf" | "fcfa" | "cad";
}

export interface ContextualAiAction {
  label: string;
  prompt: string;
  targetTool?: string;
}

export interface AgronomicToolItem {
  id: string;
  title: string;
  category: ToolkitCategory;
  categoryLabel: string;
  description: string;
  route: string;
  iconName: string; // Lucide icon identifier
  isOffline: boolean;
  badges: string[]; // e.g. ["GPS", "Hors ligne", "IA"]
  keywords: string[];
  contextualAi: {
    roleDescription: string;
    suggestedActions: ContextualAiAction[];
  };
}

export interface ToolkitCategoryConfig {
  id: ToolkitCategory;
  label: string;
  shortLabel: string;
  iconName: string;
  description: string;
}

export const TOOLKIT_CATEGORIES: ToolkitCategoryConfig[] = [
  {
    id: "all",
    label: "Tous les outils",
    shortLabel: "Tous",
    iconName: "Layers",
    description: "Ensemble des applications et utilitaires d'ingénierie agronomique.",
  },
  {
    id: "terrain_carto",
    label: "Terrain & Cartographie",
    shortLabel: "Terrain",
    iconName: "Globe",
    description: "Relevés GPS, arpentage métrique et aménagement parcellaire.",
  },
  {
    id: "agronomie",
    label: "Agronomie & Santé Végétale",
    shortLabel: "Agronomie",
    iconName: "Sprout",
    description: "Diagnostic phytosanitaire par vision IA, sols et fertilisation.",
  },
  {
    id: "irrigation",
    label: "Irrigation & Eau",
    shortLabel: "Irrigation",
    iconName: "Droplets",
    description: "Dimensionnement hydraulique, pompage solaire et réseaux goutte-à-goutte.",
  },
  {
    id: "ingenierie",
    label: "Conception & Ingénierie",
    shortLabel: "Ingénierie",
    iconName: "PencilRuler",
    description: "Modélisation de fermes 2D/3D, serres et calcul de devis.",
  },
  {
    id: "gestion_analyse",
    label: "Gestion & Analyse",
    shortLabel: "Gestion",
    iconName: "BarChart3",
    description: "Rapports techniques d'inspection, audits et export PDF officiel.",
  },
];

export const AGRONOMIC_TOOLS_CATALOG: AgronomicToolItem[] = [
  // ─── 1. TERRAIN & CARTOGRAPHIE ───
  {
    id: "tool-inspection-terrain",
    title: "Inspection terrain",
    category: "terrain_carto",
    categoryLabel: "Terrain & Cartographie",
    description: "Collecte terrain GPS, photos horodatées et score de conformité.",
    route: "/dashboard/smart-inspection",
    iconName: "ClipboardCheck",
    isOffline: true,
    badges: ["IA", "GPS", "Hors ligne"],
    keywords: ["inspection", "terrain", "gps", "audit", "visite", "contrôle", "mesure parcelle"],
    contextualAi: {
      roleDescription: "Assistant d'inspection agronomique certifié Sahel.",
      suggestedActions: [
        { label: "Générer la checklist", prompt: "Prépare la checklist technique pour un audit d'aménagement." },
        { label: "Vérifier la conformité", prompt: "Analyse les mesures collectées et identifie les anomalies." },
      ],
    },
  },
  {
    id: "tool-cartographie-gps",
    title: "Cartographie GPS",
    category: "terrain_carto",
    categoryLabel: "Terrain & Cartographie",
    description: "Mesurer et cartographier les parcelles par satellite et GPS.",
    route: "/dashboard/expert-cartography",
    iconName: "MapPin",
    isOffline: true,
    badges: ["GPS", "Hors ligne"],
    keywords: ["cartographie", "gps", "polygone", "satellite", "bornage", "parcelles", "mesurer une parcelle"],
    contextualAi: {
      roleDescription: "Système d'information géographique (SIG) et géomètre agricole.",
      suggestedActions: [
        { label: "Calculer le périmètre", prompt: "Vérifie les coordonnées du polygone et calcule le linéaire de clôture." },
        { label: "Importer coordonnées", prompt: "Convertis les coordonnées UTM en degrés décimaux." },
      ],
    },
  },
  {
    id: "tool-mesure-parcelle",
    title: "Mesure de parcelle",
    category: "terrain_carto",
    categoryLabel: "Terrain & Cartographie",
    description: "Relevé des contours et calcul géométrique des parcelles.",
    route: "/dashboard/parcels",
    iconName: "Ruler",
    isOffline: true,
    badges: ["GPS", "Hors ligne"],
    keywords: ["mesure de parcelle", "mesurer parcelle", "arpentage", "limites", "surface"],
    contextualAi: {
      roleDescription: "Calculateur de géométrie parcellaire.",
      suggestedActions: [
        { label: "Optimiser le découpage", prompt: "Propose un découpage optimal des planches de culture." },
      ],
    },
  },
  {
    id: "tool-calcul-superficie",
    title: "Calcul superficie",
    category: "terrain_carto",
    categoryLabel: "Terrain & Cartographie",
    description: "Calcul de surface hectare, ares et conversion métrique.",
    route: "/dashboard/expert-calculator?tab=surface",
    iconName: "Maximize2",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["calcul superficie", "surface", "hectare", "are", "m2", "dimension"],
    contextualAi: {
      roleDescription: "Convertisseur et calculateur métrique agricole.",
      suggestedActions: [
        { label: "Conversion locale", prompt: "Convertis les superficies traditionnelles en hectares standard." },
      ],
    },
  },
  {
    id: "tool-releve-points",
    title: "Relevé de points",
    category: "terrain_carto",
    categoryLabel: "Terrain & Cartographie",
    description: "Enregistrement de waypoints GPS et jalons d'aménagement.",
    route: "/dashboard/scouting",
    iconName: "Navigation",
    isOffline: true,
    badges: ["GPS", "Hors ligne"],
    keywords: ["relevé de points", "waypoints", "jalons", "repères", "gps terrain"],
    contextualAi: {
      roleDescription: "Enregistreur topographique de terrain.",
      suggestedActions: [
        { label: "Aligner les points", prompt: "Corrige l'alignement des jalons d'implantation de haies." },
      ],
    },
  },
  {
    id: "tool-amenagement-ferme",
    title: "Aménagement de ferme",
    category: "terrain_carto",
    categoryLabel: "Terrain & Cartographie",
    description: "Zonage, pistes d'accès, clôtures et implantation de parcelles.",
    route: "/dashboard/genius?tool=designer",
    iconName: "Compass",
    isOffline: true,
    badges: ["IA", "Nouveau"],
    keywords: ["aménagement de ferme", "plan de masse", "clôture", "zonage", "accès"],
    contextualAi: {
      roleDescription: "Architecte paysagiste et ruraliste sahélien.",
      suggestedActions: [
        { label: "Zonage agro-écologique", prompt: "Propose une disposition bioclimatique intégrant brise-vent et zones de vie." },
      ],
    },
  },
  {
    id: "tool-geolocalisation",
    title: "Géolocalisation",
    category: "terrain_carto",
    categoryLabel: "Terrain & Cartographie",
    description: "Positionnement en temps réel et boussole d'orientation terrain.",
    route: "/dashboard/scouting",
    iconName: "LocateFixed",
    isOffline: true,
    badges: ["GPS", "Hors ligne"],
    keywords: ["géolocalisation", "coordonnées", "latitude", "longitude", "position"],
    contextualAi: {
      roleDescription: "Assistant géodésique.",
      suggestedActions: [
        { label: "Précision GPS", prompt: "Évalue la précision métrique du relevé satellite actuel." },
      ],
    },
  },

  // ─── 2. AGRONOMIE & SANTÉ VÉGÉTALE ───
  {
    id: "tool-diagnostic-cultures",
    title: "Diagnostic des cultures",
    category: "agronomie",
    categoryLabel: "Agronomie & Santé Végétale",
    description: "Identifier les cultures, maladies et adventices par IA.",
    route: "/dashboard/expert-diagnosis",
    iconName: "Microscope",
    isOffline: true,
    badges: ["IA", "Hors ligne"],
    keywords: ["diagnostic des cultures", "maladie", "ravageur", "carence", "vision ia", "diagnostiquer une maladie"],
    contextualAi: {
      roleDescription: "Phytopathologiste certifié INERA/CIRAD.",
      suggestedActions: [
        { label: "Diagnostiquer symptôme", prompt: "Analyse les taches foliaires et propose un protocole de traitement bio." },
        { label: "Calculer seuil d'attaque", prompt: "Estime l'incidence de l'infestation sur le rendement final." },
      ],
    },
  },
  {
    id: "tool-identification-plantes",
    title: "Identification des plantes",
    category: "agronomie",
    categoryLabel: "Agronomie & Santé Végétale",
    description: "Reconnaissance botanique instantanée des espèces sahéliennes.",
    route: "/dashboard/expert-diagnosis?mode=plant_id",
    iconName: "Sprout",
    isOffline: true,
    badges: ["IA", "Hors ligne"],
    keywords: ["identification des plantes", "botanique", "espèces", "variétés", "arbres"],
    contextualAi: {
      roleDescription: "Botaniste expert en flore ouest-africaine.",
      suggestedActions: [
        { label: "Caractéristiques espèce", prompt: "Donne les besoins en eau et la résistance à la sécheresse de cette espèce." },
      ],
    },
  },
  {
    id: "tool-identification-adventices",
    title: "Identification des mauvaises herbes",
    category: "agronomie",
    categoryLabel: "Agronomie & Santé Végétale",
    description: "Détection des adventices envahissantes et désherbage ciblé.",
    route: "/dashboard/expert-diagnosis?mode=weeds",
    iconName: "Leaf",
    isOffline: true,
    badges: ["IA", "Hors ligne"],
    keywords: ["identification des mauvaises herbes", "adventices", "striga", "sarclage", "désherbage"],
    contextualAi: {
      roleDescription: "Spécialiste en malherbologie.",
      suggestedActions: [
        { label: "Lutte contre le Striga", prompt: "Donne le protocole de rotation et pièges à graines contre le Striga hermonthica." },
      ],
    },
  },
  {
    id: "tool-diagnostic-maladies",
    title: "Diagnostic des maladies",
    category: "agronomie",
    categoryLabel: "Agronomie & Santé Végétale",
    description: "Analyse des symptômes fongiques, bactériens et viraux.",
    route: "/dashboard/expert-diagnosis?mode=disease",
    iconName: "Activity",
    isOffline: true,
    badges: ["IA", "Hors ligne"],
    keywords: ["diagnostic des maladies", "diagnostiquer", "diagnostiquer une maladie", "maladie", "mildiou", "oïdium", "anthracnose", "virose", "flétrissement", "bactériose"],
    contextualAi: {
      roleDescription: "Diagnostic clinique des pathologies végétales.",
      suggestedActions: [
        { label: "Traitement biologique", prompt: "Propose un fongicide naturel homologué CSP (bouillie bordelaise, neem)." },
      ],
    },
  },
  {
    id: "tool-diagnostic-ravageurs",
    title: "Diagnostic des ravageurs",
    category: "agronomie",
    categoryLabel: "Agronomie & Santé Végétale",
    description: "Typage d'insectes, chenilles légionnaires et seuils d'infestation.",
    route: "/dashboard/expert-diagnosis?mode=pests",
    iconName: "Bug",
    isOffline: true,
    badges: ["IA", "Hors ligne"],
    keywords: ["diagnostic des ravageurs", "insectes", "chenille légionnaire", "criquets", "pucerons", "sauteriaux"],
    contextualAi: {
      roleDescription: "Entomologiste agricole.",
      suggestedActions: [
        { label: "Seuil d'intervention", prompt: "Indique si le taux de chenilles par plant justifie un traitement phytosanitaire." },
      ],
    },
  },
  {
    id: "tool-analyse-sols",
    title: "Analyse des sols",
    category: "agronomie",
    categoryLabel: "Agronomie & Santé Végétale",
    description: "Interprétation pH, texture, matière organique et carences.",
    route: "/dashboard/expert-calculator?tab=soil",
    iconName: "FlaskConical",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["analyse des sols", "sol", "ph", "texture", "fertilité", "matière organique", "azote", "phosphore"],
    contextualAi: {
      roleDescription: "Pédologue et chimiste des sols.",
      suggestedActions: [
        { label: "Recommandation chaulage", prompt: "Calcule la dose de calcaire dolomite pour corriger un sol acide (pH < 5.5)." },
      ],
    },
  },
  {
    id: "tool-recommandation-fertilisation",
    title: "Recommandation de fertilisation",
    category: "agronomie",
    categoryLabel: "Agronomie & Santé Végétale",
    description: "Plan de fumure équilibré NPK, Urée et compost enrichi.",
    route: "/dashboard/expert-prescriptions?type=fertilizer",
    iconName: "Wheat",
    isOffline: true,
    badges: ["Prescription", "Hors ligne"],
    keywords: ["recommandation de fertilisation", "plan de fertilisation", "npk", "urée", "fumure", "engrais", "doses"],
    contextualAi: {
      roleDescription: "Conseiller en nutrition des cultures.",
      suggestedActions: [
        { label: "Fractionnement NPK", prompt: "Planifie les apports de fond et de couverture selon les stades de la culture." },
      ],
    },
  },
  {
    id: "tool-conseil-cultural",
    title: "Conseil cultural",
    category: "agronomie",
    categoryLabel: "Agronomie & Santé Végétale",
    description: "Itinéraires techniques, densités de semis et calendrier INERA.",
    route: "/dashboard/crop-library",
    iconName: "BookOpen",
    isOffline: true,
    badges: ["INERA", "Hors ligne"],
    keywords: ["conseil cultural", "fiches techniques", "variétés", "cycle", "semis", "densité", "itinéraires"],
    contextualAi: {
      roleDescription: "Référent agronomique INERA/CIRAD.",
      suggestedActions: [
        { label: "Itinéraire technique complet", prompt: "Génère l'itinéraire cultural de l'oignon Violet de Galmi en saison sèche." },
      ],
    },
  },
  {
    id: "tool-suivi-cultures",
    title: "Suivi des cultures",
    category: "agronomie",
    categoryLabel: "Agronomie & Santé Végétale",
    description: "Carnet de bord agronomique, stades phénologiques et observations.",
    route: "/dashboard/scouting",
    iconName: "Eye",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["suivi des cultures", "phénologie", "levée", "floraison", "maturation", "carnet de bord"],
    contextualAi: {
      roleDescription: "Superviseur de cycle cultural.",
      suggestedActions: [
        { label: "Estimer la date de récolte", prompt: "Calcule la date de récolte prévisionnelle selon la somme de températures." },
      ],
    },
  },

  // ─── 3. IRRIGATION & GESTION DE L'EAU ───
  {
    id: "tool-concepteur-irrigation",
    title: "Concepteur d'irrigation",
    category: "irrigation",
    categoryLabel: "Irrigation & Eau",
    description: "Concevoir et dimensionner un système d'irrigation complet.",
    route: "/dashboard/genius?tool=irrigation",
    iconName: "Droplets",
    isOffline: true,
    badges: ["IA", "Hors ligne", "CAD"],
    keywords: ["concepteur d'irrigation", "concevoir une irrigation", "goutte-à-goutte", "dimensionner irrigation", "réseau d'eau"],
    contextualAi: {
      roleDescription: "Ingénieur hydraulicien agricole spécialisé en micro-irrigation.",
      suggestedActions: [
        { label: "Dimensionner le secteur", prompt: "Calcule le débit total et le diamètre du collecteur pour 1 hectare maraîcher." },
        { label: "Générer le plan CAD", prompt: "Modélise le réseau primaire, secondaire et porte-rampes." },
      ],
    },
  },
  {
    id: "tool-calcul-debit",
    title: "Calcul du débit",
    category: "irrigation",
    categoryLabel: "Irrigation & Eau",
    description: "Détermination des besoins hydrauliques en m³/h et l/s.",
    route: "/dashboard/expert-calculator?tab=hydraulic",
    iconName: "Gauge",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["calcul du débit", "calculer un débit", "débit", "m3/h", "litres seconde", "besoin en eau"],
    contextualAi: {
      roleDescription: "Calculateur hydraulique.",
      suggestedActions: [
        { label: "Débit de pointe", prompt: "Calcule le débit de pointe horaire requis pour l'évapotranspiration sahélienne." },
      ],
    },
  },
  {
    id: "tool-calcul-pression",
    title: "Calcul de pression",
    category: "irrigation",
    categoryLabel: "Irrigation & Eau",
    description: "Pertes de charge linéaires, singulières et pression résiduelle.",
    route: "/dashboard/expert-calculator?tab=pressure",
    iconName: "Activity",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["calcul de pression", "pression", "perte de charge", "bar", "hmt", "darcy-weisbach"],
    contextualAi: {
      roleDescription: "Spécialiste de la dynamique des fluides sous pression.",
      suggestedActions: [
        { label: "Pertes de charge", prompt: "Calcule la perte de charge sur 150m de conduite PEHD 50mm avec débit de 8 m3/h." },
      ],
    },
  },
  {
    id: "tool-dimensionnement-tuyaux",
    title: "Dimensionnement des tuyaux",
    category: "irrigation",
    categoryLabel: "Irrigation & Eau",
    description: "Calcul du diamètre optimal (PEHD / PVC) selon vitesse d'eau.",
    route: "/dashboard/genius?tool=pipes",
    iconName: "Pipette",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["dimensionnement des tuyaux", "tuyaux", "pehd", "pvc", "diamètre", "vitesse"],
    contextualAi: {
      roleDescription: "Ingénieur canalisations et adduction d'eau.",
      suggestedActions: [
        { label: "Vérifier la vitesse", prompt: "Vérifie que la vitesse d'écoulement reste comprise entre 1.0 et 1.8 m/s." },
      ],
    },
  },
  {
    id: "tool-dimensionnement-pompe",
    title: "Dimensionnement de pompe",
    category: "irrigation",
    categoryLabel: "Irrigation & Eau",
    description: "Calcul HMT, puissance requise et choix pompe solaire/thermique.",
    route: "/dashboard/genius?tool=pump",
    iconName: "Sun",
    isOffline: true,
    badges: ["Énergie", "Hors ligne"],
    keywords: ["dimensionnement de pompe", "pompe solaire", "hmt", "puissance", "champ photovoltaïque", "forage"],
    contextualAi: {
      roleDescription: "Expert en pompage solaire autonome.",
      suggestedActions: [
        { label: "Dimensionner panneaux", prompt: "Calcule la puissance crête (Wc) de panneaux solaires pour relever 30 m3/jour à 45m HMT." },
      ],
    },
  },
  {
    id: "tool-goutte-a-goutte",
    title: "Goutte-à-goutte",
    category: "irrigation",
    categoryLabel: "Irrigation & Eau",
    description: "Plan de pose des gaines, espacement goutteurs et régulation.",
    route: "/dashboard/genius?tool=drip",
    iconName: "Droplets",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["goutte-à-goutte", "gaines", "goutteurs intégrés", "micro-débit", "arrosage localisé"],
    contextualAi: {
      roleDescription: "Spécialiste de la micro-irrigation goutte-à-goutte.",
      suggestedActions: [
        { label: "Espacement des goutteurs", prompt: "Recommande l'espacement et débit horaire pour culture de tomate en sol sableux." },
      ],
    },
  },
  {
    id: "tool-aspersion",
    title: "Aspersion",
    category: "irrigation",
    categoryLabel: "Irrigation & Eau",
    description: "Disposition des arroseurs, rayon de couverture et pluviométrie.",
    route: "/dashboard/genius?tool=sprinkler",
    iconName: "ShowerHead",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["aspersion", "arroseurs", "canons", "pluviométrie", "recouvrement"],
    contextualAi: {
      roleDescription: "Ingénieur irrigation par aspersion.",
      suggestedActions: [
        { label: "Taux de recouvrement", prompt: "Calcule le taux de recouvrement triangulaire pour un espacement de 12x12m." },
      ],
    },
  },
  {
    id: "tool-micro-aspersion",
    title: "Micro-aspersion",
    category: "irrigation",
    categoryLabel: "Irrigation & Eau",
    description: "Irrigation de précision sous canopée pour vergers et pépinières.",
    route: "/dashboard/genius?tool=micro-sprinkler",
    iconName: "Waves",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["micro-aspersion", "verger", "arbres", "pépinière", "micro-jet"],
    contextualAi: {
      roleDescription: "Conseiller arboricole et pépiniériste.",
      suggestedActions: [
        { label: "Débit par arbre", prompt: "Calcule le volume d'eau par micro-asperseur pour manguiers en période de nouaison." },
      ],
    },
  },
  {
    id: "tool-gestion-eau",
    title: "Gestion de l'eau",
    category: "irrigation",
    categoryLabel: "Irrigation & Eau",
    description: "Plan de rotation d'arrosage, bilan hydrique et réserve utile.",
    route: "/dashboard/crop-planning",
    iconName: "Zap",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["gestion de l'eau", "bilan hydrique", "tours d'eau", "réserve utile", "évapotranspiration"],
    contextualAi: {
      roleDescription: "Gestionnaire des ressources en eau agricoles.",
      suggestedActions: [
        { label: "Calendrier des tours d'eau", prompt: "Établis le calendrier de rotation des vannes par bloc cultural." },
      ],
    },
  },

  // ─── 4. CONCEPTION & INGÉNIERIE ───
  {
    id: "tool-precision-cad-3d",
    title: "Studio CAO / SIG / IRRICAD 3D",
    category: "ingenierie",
    categoryLabel: "Conception & Ingénierie",
    description: "Plans ultra-précis AutoCAD DXF, MNT QGIS, hydraulique IRRICAD et Netafim.",
    route: "/dashboard/genius?tab=cad_studio",
    iconName: "Compass",
    isOffline: true,
    badges: ["AutoCAD", "QGIS", "IRRICAD", "Netafim"],
    keywords: ["autocad", "qgis", "irricad", "netafim", "dxf", "cao", "sig", "3d", "précision", "plans d'ingénierie", "netafim irrigation"],
    contextualAi: {
      roleDescription: "Expert en CAO rurale, SIG géodésique et modélisation hydraulique de précision.",
      suggestedActions: [
        { label: "Générer DXF AutoCAD", prompt: "Exporte le plan de masse et le réseau d'irrigation en format DXF R12 avec calques ISO." },
        { label: "Topographie QGIS", prompt: "Affiche les courbes de niveau MNT et calcule les pentes géodésiques WGS84." },
        { label: "Calcul IRRICAD", prompt: "Vérifie les vitesses d'écoulement et les pertes de charge Hazen-Williams." },
        { label: "Devis Netafim", prompt: "Établis la nomenclature détaillée du matériel Netafim avec références officielles en FCFA." },
      ],
    },
  },
  {
    id: "tool-nafa-farm-designer",
    title: "NAFA Farm Designer",
    category: "ingenierie",
    categoryLabel: "Conception & Ingénierie",
    description: "Studio de modélisation 2D vectorielle et plan de masse d'exploitation.",
    route: "/dashboard/genius?tool=designer",
    iconName: "PencilRuler",
    isOffline: true,
    badges: ["IA", "CAD", "Hors ligne"],
    keywords: ["nafa farm designer", "farm designer", "plan 2d", "modélisation", "conception ferme", "plan de masse"],
    contextualAi: {
      roleDescription: "Studio de CAO/DAO d'ingénierie rurale NAFA Genius.",
      suggestedActions: [
        { label: "Générer le plan de masse", prompt: "Dessine le plan côté d'une ferme de 2 hectares avec zone d'irrigation et forage." },
        { label: "Exporter en DXF/SVG", prompt: "Prépare l'export vectoriel côté pour l'entrepreneur des travaux." },
      ],
    },
  },
  {
    id: "tool-visualisation-3d",
    title: "Visualisation 3D",
    category: "ingenierie",
    categoryLabel: "Conception & Ingénierie",
    description: "Aperçu volumétrique tridimensionnel des aménagements et serres.",
    route: "/dashboard/genius?tool=3d",
    iconName: "Boxes",
    isOffline: true,
    badges: ["3D", "Hors ligne"],
    keywords: ["visualisation 3d", "3d", "perspective", "relief", "bâtiments", "ombrage"],
    contextualAi: {
      roleDescription: "Moteur de rendu architectural 3D.",
      suggestedActions: [
        { label: "Aperçu volumétrique", prompt: "Calcule les ombres portées des serres et réservoirs selon la course solaire." },
      ],
    },
  },
  {
    id: "tool-conception-ferme",
    title: "Conception de ferme",
    category: "ingenierie",
    categoryLabel: "Conception & Ingénierie",
    description: "Ingénierie globale : parcelles, bassins, hangars et logements.",
    route: "/dashboard/genius?tool=farm",
    iconName: "Building2",
    isOffline: true,
    badges: ["IA", "Nouveau"],
    keywords: ["conception de ferme", "ferme intégrée", "projet agricole", "plan d'exploitation"],
    contextualAi: {
      roleDescription: "Ingénieur en génie rural.",
      suggestedActions: [
        { label: "Bilan global du projet", prompt: "Établis le dimensionnement prévisionnel des infrastructures pour 5 hectares." },
      ],
    },
  },
  {
    id: "tool-conception-serre",
    title: "Conception de serre",
    category: "ingenierie",
    categoryLabel: "Conception & Ingénierie",
    description: "Plans de structure tunnel ou multi-chapelle avec aération bioclimatique.",
    route: "/dashboard/genius?tool=greenhouse",
    iconName: "Home",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["conception de serre", "serre", "tunnel", "ombrière", "structure maraîchère"],
    contextualAi: {
      roleDescription: "Spécialiste serres tropicales et sahéliennes.",
      suggestedActions: [
        { label: "Aération bioclimatique", prompt: "Dimensionne les ouvrants latéraux et filet insect-proof pour réduire la température." },
      ],
    },
  },
  {
    id: "tool-conception-infrastructures",
    title: "Conception d'infrastructures",
    category: "ingenierie",
    categoryLabel: "Conception & Ingénierie",
    description: "Bassin de stockage, clôtures grillagées, forage et pistes.",
    route: "/dashboard/genius?tool=infra",
    iconName: "Boxes",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["conception d'infrastructures", "bassin", "clôture", "magasin", "pistes"],
    contextualAi: {
      roleDescription: "Ingénieur travaux agricoles et BTP rural.",
      suggestedActions: [
        { label: "Dimensionnement bassin", prompt: "Calcule le cubage d'un bassin de rétention pour 3 jours d'autonomie d'irrigation." },
      ],
    },
  },
  {
    id: "tool-calcul-materiaux",
    title: "Calcul des matériaux",
    category: "ingenierie",
    categoryLabel: "Conception & Ingénierie",
    description: "Nomenclature (BOM) automatique des fournitures et composants.",
    route: "/dashboard/genius?tool=bom",
    iconName: "FileSpreadsheet",
    isOffline: true,
    badges: ["IA", "Hors ligne"],
    keywords: ["calcul des matériaux", "bom", "nomenclature", "fournitures", "pièces", "vannes"],
    contextualAi: {
      roleDescription: "Métreur et économiste de la construction agricole.",
      suggestedActions: [
        { label: "Générer la BOM", prompt: "Extrais la liste exacte des tuyaux, coudes, vannes et raccords avec leurs diamètres." },
      ],
    },
  },
  {
    id: "tool-calculateur-devis",
    title: "Calculateur de devis",
    category: "ingenierie",
    categoryLabel: "Conception & Ingénierie",
    description: "Chiffrage instantané en FCFA avec tarifs partenaires certifiés.",
    route: "/dashboard/quote-requests",
    iconName: "Wallet",
    isOffline: true,
    badges: ["FCFA", "Hors ligne"],
    keywords: ["calculateur de devis", "faire un devis", "devis", "prix", "chiffrage", "budget", "fcfa"],
    contextualAi: {
      roleDescription: "Chiffreur de projets agricoles agréé Sahel.",
      suggestedActions: [
        { label: "Chiffrer le devis", prompt: "Applique la grille tarifaire certifiée en FCFA et calcule le montant total HT et TTC." },
      ],
    },
  },

  // ─── 5. GESTION & ANALYSE ───
  {
    id: "tool-rapport-inspection",
    title: "Rapport d'inspection",
    category: "gestion_analyse",
    categoryLabel: "Gestion & Analyse",
    description: "Synthèse d'audit technique avec score de conformité et photos.",
    route: "/dashboard/smart-inspection",
    iconName: "ClipboardList",
    isOffline: true,
    badges: ["PDF", "Hors ligne"],
    keywords: ["rapport d'inspection", "audit", "inspection", "conformité", "procès-verbal"],
    contextualAi: {
      roleDescription: "Auditeur agronomique certifié.",
      suggestedActions: [
        { label: "Synthèse de conformité", prompt: "Rédige le résumé exécutif des non-conformités observées sur la parcelle." },
      ],
    },
  },
  {
    id: "tool-rapport-agronomique",
    title: "Rapport agronomique",
    category: "gestion_analyse",
    categoryLabel: "Gestion & Analyse",
    description: "Bilan phytosanitaire complet et recommandations d'expert.",
    route: "/dashboard/expert-analytics",
    iconName: "FileCheck",
    isOffline: true,
    badges: ["PDF", "Hors ligne"],
    keywords: ["rapport agronomique", "bilan agronomique", "recommandations", "générer un rapport"],
    contextualAi: {
      roleDescription: "Consultant agronome en chef.",
      suggestedActions: [
        { label: "Rédiger les recommandations", prompt: "Formule les préconisations agronomiques prioritaires pour le producteur." },
      ],
    },
  },
  {
    id: "tool-tableau-bord-exploitation",
    title: "Tableau de bord exploitation",
    category: "gestion_analyse",
    categoryLabel: "Gestion & Analyse",
    description: "KPIs de rendement, charges opérationnelles et marge nette.",
    route: "/dashboard/expert-analytics",
    iconName: "BarChart3",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["tableau de bord exploitation", "kpi", "rendement", "charges", "statistiques", "exploitation"],
    contextualAi: {
      roleDescription: "Analyste financier et agro-économiste.",
      suggestedActions: [
        { label: "Calculer la marge nette", prompt: "Compare le coût des intrants et carburant au chiffre d'affaires prévisionnel." },
      ],
    },
  },
  {
    id: "tool-suivi-projet",
    title: "Suivi de projet",
    category: "gestion_analyse",
    categoryLabel: "Gestion & Analyse",
    description: "Jalons des chantiers d'aménagement, calendrier et livrables.",
    route: "/dashboard/missions",
    iconName: "PieChart",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["suivi de projet", "planning", "chantiers", "jalons", "missions", "livrables"],
    contextualAi: {
      roleDescription: "Chef de projet aménagement rural.",
      suggestedActions: [
        { label: "Planifier les étapes", prompt: "Établis le diagramme de Gantt des travaux de nivellement et pose de tuyaux." },
      ],
    },
  },
  {
    id: "tool-analyse-donnees",
    title: "Analyse des données",
    category: "gestion_analyse",
    categoryLabel: "Gestion & Analyse",
    description: "Statistiques comparatives inter-saisons et corrélations météo.",
    route: "/dashboard/expert-analytics",
    iconName: "Activity",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["analyse des données", "données", "comparaison", "statistiques", "climat", "historique"],
    contextualAi: {
      roleDescription: "Data scientist agricole.",
      suggestedActions: [
        { label: "Corrélations rendements", prompt: "Analyse l'impact des variations pluviométriques sur le rendement du maïs." },
      ],
    },
  },
  {
    id: "tool-historique-interventions",
    title: "Historique des interventions",
    category: "gestion_analyse",
    categoryLabel: "Gestion & Analyse",
    description: "Registre horodaté de toutes les visites, traitements et expertises.",
    route: "/dashboard/interventions",
    iconName: "History",
    isOffline: true,
    badges: ["Hors ligne"],
    keywords: ["historique des interventions", "registre", "interventions", "visites", "traitements"],
    contextualAi: {
      roleDescription: "Archiviste et gestionnaire de traçabilité.",
      suggestedActions: [
        { label: "Exporter le carnet", prompt: "Exporte le carnet de traçabilité réglementaire pour la certification biologique." },
      ],
    },
  },
  {
    id: "tool-generation-rapports-pdf",
    title: "Génération de rapports PDF",
    category: "gestion_analyse",
    categoryLabel: "Gestion & Analyse",
    description: "Export de documents officiels signés avec en-tête professionnel.",
    route: "/dashboard/expert-prescriptions",
    iconName: "Download",
    isOffline: true,
    badges: ["PDF", "Hors ligne"],
    keywords: ["génération de rapports pdf", "générer un rapport", "pdf", "export", "impression", "ordonnance"],
    contextualAi: {
      roleDescription: "Générateur d'éditions certifiées NAFA.",
      suggestedActions: [
        { label: "Certifier l'ordonnance", prompt: "Appose le cachet numérique et la signature de l'expert sur le rapport PDF." },
      ],
    },
  },
];

// ─── Clés de Persistance Locale ───
const STORAGE_KEYS = {
  FAVORITES: "nafa_agronomic_favorite_tools_v1",
  RECENTS: "nafa_agronomic_recent_tools_v1",
};

// ─── Favoris par défaut au premier chargement ───
const DEFAULT_FAVORITE_IDS = [
  "tool-inspection-terrain",
  "tool-cartographie-gps",
  "tool-diagnostic-cultures",
  "tool-concepteur-irrigation",
  "tool-nafa-farm-designer",
  "tool-calculateur-devis",
];

export const agronomicToolkitStorage = {
  /**
   * Retourne tous les outils du catalogue
   */
  getAllTools(): AgronomicToolItem[] {
    return AGRONOMIC_TOOLS_CATALOG;
  },

  /**
   * Retourne un outil par son identifiant
   */
  getToolById(id: string): AgronomicToolItem | undefined {
    return AGRONOMIC_TOOLS_CATALOG.find((t) => t.id === id);
  },

  /**
   * Retourne les outils filtrés par catégorie
   */
  getToolsByCategory(category: ToolkitCategory): AgronomicToolItem[] {
    if (category === "all") return AGRONOMIC_TOOLS_CATALOG;
    return AGRONOMIC_TOOLS_CATALOG.filter((t) => t.category === category);
  },

  /**
   * Recherche intelligente multi-critères (« Que voulez-vous faire ? »)
   */
  searchTools(query: string, category: ToolkitCategory = "all"): AgronomicToolItem[] {
    const list = this.getToolsByCategory(category);
    if (!query || query.trim() === "") return list;

    // Normalisation sans accents et suppression de la ponctuation
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, " ")
        .trim();

    const stopWords = new Set(["un", "une", "des", "le", "la", "les", "du", "de", "d", "et", "en", "au", "aux", "pour", "comment", "faire"]);
    const rawTokens = normalize(query).split(/\s+/).filter(Boolean);
    const significantTokens = rawTokens.filter((t) => !stopWords.has(t) && t.length > 2);
    const tokens = significantTokens.length > 0 ? significantTokens : rawTokens;

    return list.filter((tool) => {
      const fullText = normalize(
        `${tool.title} ${tool.description} ${tool.categoryLabel} ${tool.keywords.join(" ")}`
      );

      // Correspondance si les tokens principaux sont trouvés dans les métadonnées de l'outil
      return tokens.every((token) => {
        if (fullText.includes(token)) return true;
        
        // Racines spécifiques pour le vocabulaire agronomique français
        if (token.startsWith("diagnost")) return fullText.includes("diagnost");
        if (token.startsWith("concev") || token.startsWith("concep")) return fullText.includes("concep") || fullText.includes("concev");
        if (token.startsWith("irrig")) return fullText.includes("irrig");
        if (token.startsWith("mesur")) return fullText.includes("mesur");
        if (token.startsWith("fertili")) return fullText.includes("fertili");

        // Racine générique
        const root = token.length > 4 ? token.slice(0, token.length > 6 ? -3 : -2) : token;
        return fullText.includes(root);
      });
    });
  },

  /**
   * Récupère la liste des IDs d'outils favoris
   */
  getFavoriteToolIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("[ToolkitStorage] Erreur lecture favoris:", e);
    }
    return DEFAULT_FAVORITE_IDS;
  },

  /**
   * Ajoute ou retire un outil des favoris
   */
  toggleFavoriteTool(toolId: string): boolean {
    const favorites = this.getFavoriteToolIds();
    const index = favorites.indexOf(toolId);
    let isNowFavorite = false;

    if (index >= 0) {
      favorites.splice(index, 1);
      isNowFavorite = false;
    } else {
      favorites.unshift(toolId);
      isNowFavorite = true;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn("[ToolkitStorage] Erreur sauvegarde favoris:", e);
    }

    return isNowFavorite;
  },

  /**
   * Vérifie si un outil est dans les favoris
   */
  isFavorite(toolId: string): boolean {
    return this.getFavoriteToolIds().includes(toolId);
  },

  /**
   * Récupère les objets outils complets pour les favoris
   */
  getFavoriteTools(): AgronomicToolItem[] {
    const ids = this.getFavoriteToolIds();
    return ids
      .map((id) => this.getToolById(id))
      .filter((tool): tool is AgronomicToolItem => Boolean(tool));
  },

  /**
   * Enregistre l'utilisation récente d'un outil
   */
  recordToolUsage(toolId: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECENTS);
      const recents: string[] = raw ? JSON.parse(raw) : [];
      const updated = [toolId, ...recents.filter((id) => id !== toolId)].slice(0, 6);
      localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(updated));
    } catch (e) {
      console.warn("[ToolkitStorage] Erreur enregistrement récent:", e);
    }
  },

  /**
   * Récupère les 4 à 6 outils récemment utilisés
   */
  getRecentTools(): AgronomicToolItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECENTS);
      if (!raw) return [];
      const ids: string[] = JSON.parse(raw);
      return ids
        .map((id) => this.getToolById(id))
        .filter((tool): tool is AgronomicToolItem => Boolean(tool));
    } catch {
      return [];
    }
  },
};
