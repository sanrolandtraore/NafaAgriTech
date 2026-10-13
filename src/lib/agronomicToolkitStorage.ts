/**
 * NAFA - AGRITECH : Suite d'Outils Professionnels NAFA FIELD DESIGNER
 * 
 * Spécifications UX & Métier :
 * 1. Présentation des outils officiels de NAFA FIELD DESIGNER (Zéro outil générique obsolète).
 * 2. Arpentage GPS, Cartographie SIG, Lignes de semis, Irrigation, Bâtiments bioclimatiques, Devis & Rapports.
 * 3. Recherche Intelligente « Que voulez-vous faire ? ».
 * 4. Gestion des Outils Favoris et Récemment Utilisés.
 * 5. Badges de Connectivité : 100% Offline-First / Données certifiées Sahel.
 * 6. Assistance contextuelle liée à chaque outil du studio.
 */

export type ToolkitCategory =
  | "all"
  | "terrain_carto"
  | "agronomie"
  | "irrigation"
  | "ingenierie"
  | "gestion_analyse"
  | "conseil_clients";

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
  badges: string[]; // e.g. ["GPS", "Hors ligne", "Terrain"]
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
    label: "Toutes les fonctionnalités",
    shortLabel: "Tout le module",
    iconName: "Layers",
    description: "Ensemble des fonctionnalités du module Agronome & Conseil unifiées en un seul bloc.",
  },
  {
    id: "terrain_carto",
    label: "Terrain, Arpentage & Diagnostic",
    shortLabel: "Terrain & Diag",
    iconName: "Navigation",
    description: "Arpentage satellite/GPS en marchant, satellite NDVI, diagnostic végétal et bornage.",
  },
  {
    id: "agronomie",
    label: "Cultures, Calculs & Semis",
    shortLabel: "Cultures & Calculs",
    iconName: "Sprout",
    description: "Conception des rangs de semis, densités, calculs NPK et planification culturale.",
  },
  {
    id: "irrigation",
    label: "Irrigation & Pompage Solaire",
    shortLabel: "Irrigation & Eau",
    iconName: "Droplets",
    description: "Réseaux goutte-à-goutte, dimensionnement PEHD et pompage solaire.",
  },
  {
    id: "ingenierie",
    label: "Bâtiments & Modélisation 3D",
    shortLabel: "Bâtiments & 3D",
    iconName: "PencilRuler",
    description: "Conception bioclimatique d'élevage, plan de ferme 2D/3D et métrés réels.",
  },
  {
    id: "conseil_clients",
    label: "Conseil, Clients & Facturation",
    shortLabel: "Conseil & Clients",
    iconName: "Users",
    description: "Portefeuille clients, demandes de devis, facturation proforma et identité professionnelle.",
  },
  {
    id: "gestion_analyse",
    label: "Devis, Rapports & Copilote",
    shortLabel: "Devis & Rapports",
    iconName: "BarChart3",
    description: "Devis officiels en FCFA, rapports de visite terrain et copilote agronomique.",
  },
];

export const AGRONOMIC_TOOLS_CATALOG: AgronomicToolItem[] = [
  // ─── 0. APPLICATION TOUT-EN-UN (ARPENTAGE + SATELLITE + DIAGNOSTIC) ───
  {
    id: "tool-field-suite-all-in-one",
    title: "Application Tout-en-un (Arpentage • Satellite • Diagnostic)",
    category: "terrain_carto",
    categoryLabel: "Suite Complète de Terrain",
    description: "Arpentez les bordures au GPS en marchant, analysez la végétation par imagerie satellite (NDVI & stress) et laissez-vous guider vers les anomalies pour diagnostiquer et prescrire.",
    route: "/dashboard/field-suite",
    iconName: "Sparkles",
    isOffline: true,
    badges: ["Tout-en-un", "GPS Marche", "Satellite NDVI", "Diagnostic IA"],
    keywords: ["tout-en-un", "arpentage", "satellite", "ndvi", "diagnostic", "guidage", "marche gps", "stress azoté", "maladie", "plante", "terrain", "agronome"],
    contextualAi: {
      roleDescription: "Copilote d'intervention de terrain : arpentage, télédétection satellite et phytopathologie.",
      suggestedActions: [
        { label: "Lancer la marche d'arpentage", prompt: "Démarre le détourage au GPS le long des bordures de la parcelle." },
        { label: "Analyser le stress NDVI", prompt: "Génère la carte de réflectance satellite et identifie les foyers d'anomalies." },
        { label: "Me guider vers l'anomalie", prompt: "Active le radar de guidage GPS vers le point critique détecté par satellite." },
      ],
    },
  },
  // ─── 1. TERRAIN & CARTOGRAPHIE (NAFA FIELD DESIGNER) ───
  {
    id: "tool-mesure-gps",
    title: "Mesure GPS & Arpentage de Parcelle",
    category: "terrain_carto",
    categoryLabel: "Mesure GPS & Cartographie SIG",
    description: "Mesure de parcelle live au GPS du téléphone (A-B-C-D-A), calcul automatique m², hectares, périmètre et fermeture de polygone.",
    route: "/dashboard/field-designer?tab=gps",
    iconName: "Compass",
    isOffline: true,
    badges: ["GPS", "Hors ligne", "Terrain"],
    keywords: ["mesure de parcelle", "mesurer une parcelle", "gps", "arpentage", "polygone", "surface", "hectare", "borne", "wgs84", "calcul superficie"],
    contextualAi: {
      roleDescription: "Expert en topographie géodésique et arpentage foncier sahélien.",
      suggestedActions: [
        { label: "Démarrer l'arpentage GPS", prompt: "Active le GPS haute précision et guide-moi pour la fermeture de la parcelle." },
        { label: "Calculer la superficie", prompt: "Convertis les coordonnées capturées en surface nette exploitable en hectares." },
      ],
    },
  },
  {
    id: "tool-leve-gps-bornage",
    title: "Levé de Coordonnées GPS & Bornage",
    category: "terrain_carto",
    categoryLabel: "Mesure GPS & Cartographie SIG",
    description: "Levé complet des bornes et sommets (WGS84 / UTM 30N), mode marche continue, conversion DD/DMS, export SIG (GeoJSON, GPX, KML, CSV) et procès-verbal officiel PDF.",
    route: "/dashboard/gps-survey",
    iconName: "Navigation",
    isOffline: true,
    badges: ["GPS", "WGS84", "PDF", "Hors ligne"],
    keywords: ["levé gps", "lever des coordonnées", "bornage", "coordonnées gps", "utm", "wgs84", "arpentage", "gpx", "kml", "procès-verbal", "borne"],
    contextualAi: {
      roleDescription: "Ingénieur topographe et géomètre expert sahélien.",
      suggestedActions: [
        { label: "Démarrer le relevé des bornes", prompt: "Assiste-moi pour le relevé GPS précis des bornes de la parcelle." },
        { label: "Générer le procès-verbal", prompt: "Prépare le procès-verbal officiel de levé avec les coordonnées UTM et WGS84." },
      ],
    },
  },
  {
    id: "tool-farm-map-sig",
    title: "Carte de l'Exploitation & SIG Parcellaire",
    category: "terrain_carto",
    categoryLabel: "Mesure GPS & Cartographie SIG",
    description: "Carte interactive SIG parcellaire avancée : dessin polygone, lignes, points d'eau, forages, routes et clôtures.",
    route: "/dashboard/field-designer?tab=builder",
    iconName: "MapPin",
    isOffline: true,
    badges: ["SIG", "Hors ligne", "Satellite"],
    keywords: ["cartographie", "cartographie gps", "sig", "farm map", "satellite", "polygone", "points", "forage", "bassin", "clôture"],
    contextualAi: {
      roleDescription: "Ingénieur SIG et cartographe d'exploitation agricole.",
      suggestedActions: [
        { label: "Implanter les infrastructures", prompt: "Positionne les forages et réservoirs sur le plan cadastral." },
      ],
    },
  },

  // ─── 2. CULTURES & DIAGNOSTIC (NAFA FIELD DESIGNER) ───
  {
    id: "tool-crop-designer",
    title: "Conception des Cultures — Lignes de Plantation",
    category: "agronomie",
    categoryLabel: "Cultures & Diagnostic",
    description: "Conception automatique des lignes de semis, interlignes, espacement, calcul de densité (plants/ha), semences et besoin journalier en eau.",
    route: "/dashboard/field-designer?tab=crop",
    iconName: "Sprout",
    isOffline: true,
    badges: ["Cultures", "Hors ligne", "FAO-56"],
    keywords: ["crop designer", "lignes de plantation", "interligne", "espacement", "densité", "plants", "semences", "eau", "culture", "conseil cultural"],
    contextualAi: {
      roleDescription: "Conseiller principal en agronomie de précision et densité de semis.",
      suggestedActions: [
        { label: "Calculer la densité optimale", prompt: "Calcule l'interligne et l'écartement recommandé pour maximiser le rendement." },
      ],
    },
  },
  {
    id: "tool-crop-library",
    title: "Bibliothèque des Cultures Sahéliennes",
    category: "agronomie",
    categoryLabel: "Cultures & Diagnostic",
    description: "Référentiel agronomique dynamique de 20 cultures sahéliennes (Oignon Safary, Tomate, Maïs, etc.) avec paramètres 100% éditables.",
    route: "/dashboard/crop-library",
    iconName: "BookOpen",
    isOffline: true,
    badges: ["INERA", "Hors ligne", "Personnalisable"],
    keywords: ["bibliothèque des cultures", "fiches techniques", "oignon", "tomate", "maïs", "riz", "arachide", "inera", "fao", "cycle", "variétés"],
    contextualAi: {
      roleDescription: "Conservateur du référentiel agronomique et variétal d'Afrique de l'Ouest.",
      suggestedActions: [
        { label: "Consulter la fiche culture", prompt: "Affiche les coefficients culturaux Kc et les besoins en fertilisation NPK." },
      ],
    },
  },
  {
    id: "tool-diagnostic-vegetal",
    title: "Diagnostic des Cultures & Ravageurs",
    category: "agronomie",
    categoryLabel: "Cultures & Diagnostic",
    description: "Diagnostic phytosanitaire in-situ : symptômes foliaires, chenilles légionnaires, bactérioses, viroses et préconisations de lutte intégrée.",
    route: "/dashboard/field-designer?tab=diagnostic",
    iconName: "Microscope",
    isOffline: true,
    badges: ["Diagnostic", "Santé végétale", "Hors ligne"],
    keywords: ["diagnostic des cultures", "diagnostic des maladies", "diagnostic des ravageurs", "diagnostiquer une maladie", "chenille", "parasites", "phytosanitaire", "maladie"],
    contextualAi: {
      roleDescription: "Pathologiste végétal et entomologiste agricole.",
      suggestedActions: [
        { label: "Diagnostiquer l'affection", prompt: "Identifie l'agent causal d'après les symptômes foliaires constatés." },
      ],
    },
  },

  // ─── 3. IRRIGATION & EAU (NAFA FIELD DESIGNER) ───
  {
    id: "tool-irrigation-designer",
    title: "Concepteur d'Irrigation — Réseaux & Pompage",
    category: "irrigation",
    categoryLabel: "Irrigation & Eau",
    description: "Dimensionnement hydraulique : goutte-à-goutte, aspersion, pivot, calcul linéaire tuyaux PEHD, débits m³/h, secteurs et pompe solaire (kW/CV).",
    route: "/dashboard/field-designer?tab=irrigation",
    iconName: "Droplets",
    isOffline: true,
    badges: ["Hydraulique", "Hors ligne", "Solaire"],
    keywords: ["concepteur d'irrigation", "concevoir une irrigation", "irrigation designer", "calcul du débit", "calcul de pression", "dimensionnement des tuyaux", "dimensionnement de pompe", "goutte-à-goutte", "aspersion", "pehd", "pompe solaire", "eau"],
    contextualAi: {
      roleDescription: "Ingénieur hydraulicien agricole spécialisé en pompage solaire et micro-irrigation.",
      suggestedActions: [
        { label: "Dimensionner le pompage solaire", prompt: "Calcule la puissance crête des panneaux et le diamètre PEHD requis." },
      ],
    },
  },

  // ─── 4. BÂTIMENTS & INGÉNIERIE (NAFA FIELD DESIGNER) ───
  {
    id: "tool-farm-builder",
    title: "Concepteur de Ferme 2D",
    category: "ingenierie",
    categoryLabel: "Bâtiments & Modélisation",
    description: "Canvas vectoriel 2D avec grille métrique : disposition, rotation, redimensionnement et duplication des infrastructures et bâtiments.",
    route: "/dashboard/field-designer?tab=builder",
    iconName: "PencilRuler",
    isOffline: true,
    badges: ["CAO 2D", "Hors ligne", "Métrique"],
    keywords: ["farm builder", "nafa farm designer", "concepteur 2d", "conception de ferme", "plan de masse", "aménagement", "infrastructures", "bâtiments", "serres"],
    contextualAi: {
      roleDescription: "Architecte rural et modélisateur de fermes agricoles intégrées.",
      suggestedActions: [
        { label: "Optimiser le plan de masse", prompt: "Réorganise les flux d'accès, sens du vent et zones de biosécurité sur la grille." },
      ],
    },
  },
  {
    id: "tool-livestock-designer",
    title: "Conception d'Élevage — Bâtiments Bioclimatiques",
    category: "ingenierie",
    categoryLabel: "Bâtiments & Modélisation",
    description: "Modélisation de bâtiments d'élevage bioclimatiques sahéliens (poulaillers, étables bovines, bergeries, porcheries, pisciculture) et métrés.",
    route: "/dashboard/field-designer?tab=batiment",
    iconName: "Home",
    isOffline: true,
    badges: ["Bioclimatique", "Hors ligne", "Métrés"],
    keywords: ["livestock designer", "bâtiment d'élevage", "conception de batiment", "poulailler", "étable", "bergerie", "porcherie", "pisciculture", "bioclimatique", "ventilation", "sahel"],
    contextualAi: {
      roleDescription: "Spécialiste en zootechnie et conception de bâtiments d'élevage tropicaux.",
      suggestedActions: [
        { label: "Dimensionner un poulailler", prompt: "Calcule la surface, hauteur sous faîtage et murets grillagés pour 2000 poulets." },
      ],
    },
  },
  {
    id: "tool-materials-estimator",
    title: "Métrés & Estimation des Matériaux",
    category: "ingenierie",
    categoryLabel: "Bâtiments & Modélisation",
    description: "Calcul quantitatif des matériaux de construction (ciment, sable, gravier, parpaings, fer, tôles, tuyaux) basé sur la mercuriale locale réelle en FCFA.",
    route: "/dashboard/field-designer?tab=devis",
    iconName: "Layers",
    isOffline: true,
    badges: ["Métrés", "FCFA", "Hors ligne"],
    keywords: ["calcul des matériaux", "métrés", "ciment", "parpaings", "fer", "tôles", "pehd", "prix réels", "burkina faso", "quantités"],
    contextualAi: {
      roleDescription: "Économiste de la construction agricole et métreur en génie rural.",
      suggestedActions: [
        { label: "Estimer les matériaux", prompt: "Génère l'avant-métré des fondations, élévation et toiture avec les prix locaux." },
      ],
    },
  },
  {
    id: "tool-farm-3d-modeler",
    title: "Modélisation & Aménagement 3D de Ferme",
    category: "ingenierie",
    categoryLabel: "Bâtiments & Modélisation",
    description: "Conception 3D interactive de ferme : parcelles de cultures, réseau d'irrigation, château d'eau, champ solaire, bâtiments d'élevage et export HD.",
    route: "/dashboard/field-designer?tab=modeler3d",
    iconName: "Box",
    isOffline: true,
    badges: ["3D Réaliste", "NAFA Studio 3D", "Hors ligne"],
    keywords: ["modélisation 3d", "aménagement 3d", "nafa 3d", "3d", "ferme 3d", "irrigation 3d", "bâtiment 3d", "rendu réaliste", "plan 3d"],
    contextualAi: {
      roleDescription: "Architecte modélisateur 3D d'aménagements agricoles et pastoraux modernes.",
      suggestedActions: [
        { label: "Générer un rendu 3D HD", prompt: "Positionne les infrastructures solaires et d'élevage pour un aménagement optimisé." },
      ],
    },
  },

  // ─── 5. GESTION, DEVIS & RAPPORTS (NAFA FIELD DESIGNER) ───
  {
    id: "tool-field-quotes",
    title: "Calculateur de Devis Officiels FCFA",
    category: "gestion_analyse",
    categoryLabel: "Devis, Rapports & Copilote",
    description: "Édition et chiffrage des devis d'aménagement en FCFA avec fournitures, main-d'œuvre, transport, aléas et export PDF professionnel.",
    route: "/dashboard/field-designer?tab=devis",
    iconName: "Wallet",
    isOffline: true,
    badges: ["Devis", "PDF", "FCFA", "Hors ligne"],
    keywords: ["calculateur de devis", "faire un devis", "devis", "chiffrage", "fcfa", "main-d'œuvre", "transport", "pdf officiel", "génération de devis"],
    contextualAi: {
      roleDescription: "Responsable administratif et financier de projets agro-pastoraux.",
      suggestedActions: [
        { label: "Établir le devis officiel", prompt: "Compile les postes de dépenses et applique les taux de pose et transport." },
      ],
    },
  },
  {
    id: "tool-field-visits",
    title: "Rapports de Visite & Diagnostic Terrain",
    category: "gestion_analyse",
    categoryLabel: "Devis, Rapports & Copilote",
    description: "Rapports d'intervention in-situ avec relevé GPS, culture observée, stade phénologique, mesures physiques, préconisations et export PDF immédiat.",
    route: "/dashboard/field-designer?tab=interventions",
    iconName: "ClipboardCheck",
    isOffline: true,
    badges: ["Visite", "PDF", "Hors ligne", "Terrain"],
    keywords: ["rapport de visite", "rapport d'inspection", "rapport agronomique", "visite terrain", "diagnostic", "stade phénologique", "préconisations", "pdf", "génération de rapports pdf"],
    contextualAi: {
      roleDescription: "Auditeur agronomique et rédacteur de procès-verbaux de terrain.",
      suggestedActions: [
        { label: "Rédiger le rapport de visite", prompt: "Structure les constats phytosanitaires et planifie la prochaine visite." },
      ],
    },
  },
  {
    id: "tool-field-copilot",
    title: "Copilote NAFA IA Terrain",
    category: "gestion_analyse",
    categoryLabel: "Devis, Rapports & Copilote",
    description: "Copilote agronomique d'ingénierie en 5 piliers déontologiques (mesuré, saisi, calculs, hypothèses, recommandations) soumis à validation humaine.",
    route: "/dashboard/field-designer?tab=copilot",
    iconName: "Sparkles",
    isOffline: true,
    badges: ["Copilote", "5 Piliers", "Hors ligne"],
    keywords: ["copilote nafa ia", "nafa genius", "intelligence agronomique", "5 piliers", "conseil", "expertise", "zéro hallucination"],
    contextualAi: {
      roleDescription: "Copilote expert en ingénierie agronomique sahélienne.",
      suggestedActions: [
        { label: "Analyser la parcelle", prompt: "Vérifie la cohérence entre sol, culture, irrigation et climat local." },
      ],
    },
  },

  // ─── 6. TERRAIN & DIAGNOSTIC DIRECT ───
  {
    id: "tool-expert-diagnosis-suite",
    title: "Diagnostic Photo Instantané & Ordonnances",
    category: "terrain_carto",
    categoryLabel: "Terrain, Arpentage & Diagnostic",
    description: "Diagnostic phytosanitaire par analyse photo directe, détection des bioagresseurs et rédaction d'ordonnances homologuées Sahel.",
    route: "/dashboard/diagnostic",
    iconName: "Microscope",
    isOffline: true,
    badges: ["Diagnostic IA", "Photo", "Ordonnance", "Hors ligne"],
    keywords: ["diagnostic", "maladie", "photo", "ravageur", "ordonnance", "phytosanitaire", "inera", "conseil", "plante"],
    contextualAi: {
      roleDescription: "Expert phytopathologiste et prescripteur de traitements agronomiques homologués.",
      suggestedActions: [
        { label: "Analyser une photo", prompt: "Prends ou charge une photo foliaire pour diagnostiquer la maladie." },
        { label: "Générer une ordonnance", prompt: "Établis l'ordonnance de traitement homologué au Sahel." },
      ],
    },
  },
  {
    id: "tool-inspection-intelligente",
    title: "Inspection Intelligente & Protocoles Terrain",
    category: "terrain_carto",
    categoryLabel: "Terrain, Arpentage & Diagnostic",
    description: "Protocoles d'audit et fiches de contrôle sur le terrain avec dictée vocale, relevé de points critiques et rapport officiel horodaté.",
    route: "/dashboard/inspections",
    iconName: "ClipboardCheck",
    isOffline: true,
    badges: ["Audit", "Vocal", "PDF", "Hors ligne"],
    keywords: ["inspection", "audit", "fiche de contrôle", "mission", "rapport terrain", "visite", "vocal"],
    contextualAi: {
      roleDescription: "Auditeur agronomique certifié pour le contrôle de conformité des exploitations.",
      suggestedActions: [
        { label: "Démarrer une inspection", prompt: "Lance un protocole d'inspection pour cette parcelle." },
      ],
    },
  },
  {
    id: "tool-scouting-parcelles",
    title: "Suivi des Parcelles & Scouting Terrain",
    category: "terrain_carto",
    categoryLabel: "Terrain, Arpentage & Diagnostic",
    description: "Carnet de tournée et relevés d'observations géolocalisées in-situ avec photos et historique de vigueur des cultures.",
    route: "/dashboard/scouting",
    iconName: "Eye",
    isOffline: true,
    badges: ["Scouting", "GPS", "Historique", "Hors ligne"],
    keywords: ["scouting", "suivi parcelles", "tournée", "observation", "géolocalisation", "historique"],
    contextualAi: {
      roleDescription: "Conseiller de terrain assurant le suivi hebdomadaire des parcelles d'agriculteurs.",
      suggestedActions: [
        { label: "Ajouter une observation", prompt: "Enregistre une nouvelle observation de terrain avec géolocalisation." },
      ],
    },
  },
  {
    id: "tool-expert-cartography-sig",
    title: "Cartographie GPS & SIG Parcellaire",
    category: "terrain_carto",
    categoryLabel: "Terrain, Arpentage & Diagnostic",
    description: "Capture de polygones, calcul précis des surfaces, délimitation des zones d'eau et export cartographique.",
    route: "/dashboard/expert-cartography",
    iconName: "MapPin",
    isOffline: true,
    badges: ["SIG", "Polygone", "Surface", "Hors ligne"],
    keywords: ["cartographie", "polygone", "sig", "carte", "surface", "parcelle"],
    contextualAi: {
      roleDescription: "Cartographe et géomaticien agricole.",
      suggestedActions: [
        { label: "Tracer une parcelle", prompt: "Dessine le polygone de la parcelle pour calculer la superficie." },
      ],
    },
  },

  // ─── 7. CULTURES, CALCULS & INGÉNIERIE ───
  {
    id: "tool-expert-calculator",
    title: "Calculateur Agricole Expert (NPK, Semis, Eau)",
    category: "agronomie",
    categoryLabel: "Cultures, Calculs & Semis",
    description: "Calculs scientifiques certifiés : fumure NPK, doses de semences, besoins hydriques ETc (FAO-56), prévisions de rendement et marge.",
    route: "/dashboard/expert-calculator",
    iconName: "Calculator",
    isOffline: true,
    badges: ["Calculs", "FAO-56", "NPK", "Hors ligne"],
    keywords: ["calculateur", "calcul", "npk", "engrais", "semis", "etc", "eau", "rendement", "marge", "doses"],
    contextualAi: {
      roleDescription: "Spécialiste du calcul agronomique, de la fertilisation raisonnée et de l'hydraulique.",
      suggestedActions: [
        { label: "Calculer les besoins NPK", prompt: "Détermine le plan de fumure adapté aux analyses de sol." },
      ],
    },
  },
  {
    id: "tool-crop-planning",
    title: "Planification des Cultures & Calendrier Cultural",
    category: "agronomie",
    categoryLabel: "Cultures, Calculs & Semis",
    description: "Calendrier prévisionnel complet des cycles culturaux : dates de semis, repiquage, stades critiques, sarclages et récoltes.",
    route: "/dashboard/crop-planning",
    iconName: "Calendar",
    isOffline: true,
    badges: ["Calendrier", "Cycles", "Hors ligne"],
    keywords: ["planification", "calendrier cultural", "cycle", "semis", "récolte", "stade", "rotation"],
    contextualAi: {
      roleDescription: "Conseiller en planification des assolements et rotations culturales sahéliennes.",
      suggestedActions: [
        { label: "Planifier un cycle", prompt: "Établis le calendrier prévisionnel des interventions du cycle cultural." },
      ],
    },
  },
  {
    id: "tool-parcelles-exploitations",
    title: "Gestion des Parcelles & Exploitations",
    category: "agronomie",
    categoryLabel: "Cultures, Calculs & Semis",
    description: "Registre détaillé des parcelles enregistrées, historique des assolements, textures de sols et bilans culturaux.",
    route: "/dashboard/parcels",
    iconName: "Sprout",
    isOffline: true,
    badges: ["Parcelles", "Cultures", "Registre", "Hors ligne"],
    keywords: ["parcelles", "exploitations", "registre", "sol", "cultures", "assolements"],
    contextualAi: {
      roleDescription: "Gestionnaire technique d'exploitations agricoles.",
      suggestedActions: [
        { label: "Créer une parcelle", prompt: "Ajoute une nouvelle parcelle dans le registre de l'exploitation." },
      ],
    },
  },

  // ─── 8. CONSEIL, CLIENTS, DEVIS & DOCUMENTS PROFESSIONNELS ───
  {
    id: "tool-expert-clients",
    title: "Portefeuille Clients & Exploitations Suivies",
    category: "conseil_clients",
    categoryLabel: "Conseil, Clients & Facturation",
    description: "Carnet de clientèle pour l'agronome : liste des exploitants suivis, historique des visites, contrats de conseil et coordonnées directes.",
    route: "/dashboard/expert-clients",
    iconName: "Users",
    isOffline: true,
    badges: ["Clients", "Contrats", "Gestion", "Hors ligne"],
    keywords: ["clients", "portefeuille", "agriculteurs", "exploitants", "suivi", "carnet", "tournée", "visite"],
    contextualAi: {
      roleDescription: "Gestionnaire de portefeuille clients et chargé de relation avec les producteurs agricoles.",
      suggestedActions: [
        { label: "Ajouter un client", prompt: "Enregistre une nouvelle exploitation agricole dans le carnet client." },
      ],
    },
  },
  {
    id: "tool-quote-requests",
    title: "Demandes de Devis & Missions Reçues",
    category: "conseil_clients",
    categoryLabel: "Conseil, Clients & Facturation",
    description: "Gestion des sollicitations d'agriculteurs et d'investisseurs : demandes d'arpentage, conception d'irrigation, forages et conseils.",
    route: "/dashboard/quote-requests",
    iconName: "FileText",
    isOffline: true,
    badges: ["Devis reçus", "Missions", "Clients"],
    keywords: ["demandes de devis", "devis", "missions", "sollicitations", "investisseurs", "rendez-vous"],
    contextualAi: {
      roleDescription: "Coordonnateur des missions d'ingénierie et des propositions commerciales.",
      suggestedActions: [
        { label: "Traiter les demandes", prompt: "Examine les nouvelles demandes d'intervention reçues des exploitants." },
      ],
    },
  },
  {
    id: "tool-partenaire-factures",
    title: "Facturation & Proformas en FCFA",
    category: "conseil_clients",
    categoryLabel: "Conseil, Clients & Facturation",
    description: "Édition rapide de factures proformas, factures d'honoraires et reçus de prestations agronomiques en FCFA conformes.",
    route: "/dashboard/partenaire-factures",
    iconName: "Receipt",
    isOffline: true,
    badges: ["FCFA", "Factures", "Proformas", "PDF"],
    keywords: ["facturation", "factures", "proformas", "honoraires", "prestations", "fcfa", "reçus"],
    contextualAi: {
      roleDescription: "Comptable et gestionnaire de facturation pour cabinets d'expertise agricole.",
      suggestedActions: [
        { label: "Créer une facture proforma", prompt: "Prépare une facture proforma pour une prestation d'arpentage." },
      ],
    },
  },
  {
    id: "tool-partner-branding",
    title: "Identité Professionnelle & Documents Officiels",
    category: "conseil_clients",
    categoryLabel: "Conseil, Clients & Facturation",
    description: "Personnalisez tous vos PDF (devis, rapports d'inspection, plans) avec le nom de votre cabinet, logo textuel, numéro d'agrément et coordonnées.",
    route: "/dashboard/identite-professionnelle",
    iconName: "Building2",
    isOffline: true,
    badges: ["Branding", "Agrément", "PDF", "Cabinet"],
    keywords: ["identité", "documents", "branding", "logo", "agrément", "cabinet", "en-tête", "rapports personnalisés"],
    contextualAi: {
      roleDescription: "Responsable conformité et valorisation de l'identité de marque du cabinet.",
      suggestedActions: [
        { label: "Configurer mon cabinet", prompt: "Mets à jour le nom, numéro d'agrément et coordonnées qui apparaissent sur les PDF." },
      ],
    },
  },
  {
    id: "tool-expert-analytics",
    title: "Analytique & Performances du Conseil",
    category: "conseil_clients",
    categoryLabel: "Conseil, Clients & Facturation",
    description: "Tableau de bord statistique : nombre d'interventions, parcelles arpentées, rendements moyens des clients conseillés et honoraires.",
    route: "/dashboard/expert-analytics",
    iconName: "BarChart3",
    isOffline: true,
    badges: ["Statistiques", "KPIs", "Performances"],
    keywords: ["statistiques", "analytique", "performances", "kpi", "suivi activité", "rendements"],
    contextualAi: {
      roleDescription: "Analyste d'impact agronomique et de rentabilité des exploitations.",
      suggestedActions: [
        { label: "Consulter les indicateurs", prompt: "Affiche le récapitulatif des interventions et des surfaces traitées ce mois-ci." },
      ],
    },
  },
  {
    id: "tool-education-catalog",
    title: "Académie & Formation Continue Agronomique",
    category: "conseil_clients",
    categoryLabel: "Conseil, Clients & Facturation",
    description: "Guides techniques avancés, bonnes pratiques agroécologiques, formations certifiantes et manuels de terrain.",
    route: "/dashboard/education",
    iconName: "GraduationCap",
    isOffline: true,
    badges: ["Formation", "Guides", "Certifications"],
    keywords: ["formation", "académie", "cours", "bonnes pratiques", "agroécologie", "guides"],
    contextualAi: {
      roleDescription: "Responsable formation et transmission des savoirs agronomiques.",
      suggestedActions: [
        { label: "Consulter les formations", prompt: "Ouvre le catalogue des modules de formation continue." },
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
  "tool-mesure-gps",
  "tool-crop-designer",
  "tool-irrigation-designer",
  "tool-farm-builder",
  "tool-field-quotes",
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
