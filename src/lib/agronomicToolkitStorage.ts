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
    label: "Tous les outils de Conception de Parcelles",
    shortLabel: "Tous",
    iconName: "Layers",
    description: "Ensemble des outils professionnels de conception et d'intervention terrain NAFA.",
  },
  {
    id: "terrain_carto",
    label: "Mesure GPS & Cartographie SIG",
    shortLabel: "Terrain",
    iconName: "Globe",
    description: "Arpentage par satellite/GPS, mesure de parcelles et SIG parcellaire.",
  },
  {
    id: "agronomie",
    label: "Cultures & Diagnostic",
    shortLabel: "Cultures",
    iconName: "Sprout",
    description: "Conception des rangs de semis, densités et diagnostic phytosanitaire.",
  },
  {
    id: "irrigation",
    label: "Irrigation & Eau",
    shortLabel: "Irrigation",
    iconName: "Droplets",
    description: "Réseaux goutte-à-goutte, dimensionnement PEHD et pompage solaire.",
  },
  {
    id: "ingenierie",
    label: "Bâtiments & Modélisation",
    shortLabel: "Bâtiments",
    iconName: "PencilRuler",
    description: "Conception bioclimatique d'élevage, plan de ferme 2D et métrés réels.",
  },
  {
    id: "gestion_analyse",
    label: "Devis, Rapports & Copilote",
    shortLabel: "Gestion",
    iconName: "BarChart3",
    description: "Devis officiels en FCFA, rapports de visite terrain et IA déontologique.",
  },
];

export const AGRONOMIC_TOOLS_CATALOG: AgronomicToolItem[] = [
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
