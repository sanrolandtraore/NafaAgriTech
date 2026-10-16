/**
 * NAFA - AGRITECH : Catalogue d'Outils Agronomiques & Conseil
 * 
 * Spécifications UX & Métier :
 * 1. Outils pratiques et simples de gestion agronomique, cultures, prescriptions, clientèle et facturation.
 * 2. Recherche Intelligente « Que voulez-vous faire ? ».
 * 3. Gestion des Outils Favoris et Récemment Utilisés.
 * 4. Badges de Connectivité : 100% Offline-First / Données certifiées Sahel.
 */

export type ToolkitCategory =
  | "all"
  | "agronomie"
  | "conseil_clients"
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
  badges: string[];
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
    description: "Ensemble des outils pratiques du module Agronome & Conseil.",
  },
  {
    id: "agronomie",
    label: "Cultures, Calculs & Fiches",
    shortLabel: "Cultures & Calculs",
    iconName: "Sprout",
    description: "Fiches techniques des cultures, calculateur NPK/semis, planification et suivi des parcelles.",
  },
  {
    id: "conseil_clients",
    label: "Conseil, Clients & Facturation",
    shortLabel: "Conseil & Clients",
    iconName: "Users",
    description: "Portefeuille clients, prescriptions, demandes de devis, facturation proforma et identité professionnelle.",
  },
  {
    id: "gestion_analyse",
    label: "Formations & Performances",
    shortLabel: "Formations & Suivi",
    iconName: "BarChart3",
    description: "Formation continue agronomique et indicateurs de performance du cabinet.",
  },
];

export const AGRONOMIC_TOOLS_CATALOG: AgronomicToolItem[] = [
  // ─── 1. CULTURES, CALCULS & FICHES PRATIQUES ───
  {
    id: "tool-crop-library",
    title: "Bibliothèque des Cultures Sahéliennes",
    category: "agronomie",
    categoryLabel: "Cultures, Calculs & Fiches",
    description: "Référentiel agronomique pratique des cultures sahéliennes (Oignon, Tomate, Maïs, Riz, Niébé, etc.) avec cycles, rendements et bonnes pratiques.",
    route: "/dashboard/crop-library",
    iconName: "BookOpen",
    isOffline: true,
    badges: ["INERA", "Hors ligne", "Fiches"],
    keywords: ["bibliothèque des cultures", "fiches techniques", "oignon", "tomate", "maïs", "riz", "arachide", "inera", "fao", "cycle", "variétés"],
    contextualAi: {
      roleDescription: "Conservateur du référentiel agronomique et variétal d'Afrique de l'Ouest.",
      suggestedActions: [
        { label: "Consulter la fiche culture", prompt: "Affiche les besoins en eau et en fertilisation NPK pour cette culture." },
      ],
    },
  },
  {
    id: "tool-expert-calculator",
    title: "Calculateur Agricole (NPK, Semis, Eau)",
    category: "agronomie",
    categoryLabel: "Cultures, Calculs & Fiches",
    description: "Calculs pratiques et rapides : doses d'engrais NPK et Urée, quantités de semences, besoins en eau et prévisions de rendement en FCFA.",
    route: "/dashboard/expert-calculator",
    iconName: "Calculator",
    isOffline: true,
    badges: ["Calculs", "NPK", "Semis", "Hors ligne"],
    keywords: ["calculateur", "calcul", "npk", "engrais", "semis", "eau", "rendement", "marge", "doses", "fumure"],
    contextualAi: {
      roleDescription: "Conseiller en calcul agronomique et fertilisation raisonnée.",
      suggestedActions: [
        { label: "Calculer les besoins NPK", prompt: "Détermine le nombre de sacs d'engrais nécessaires selon la superficie." },
      ],
    },
  },
  {
    id: "tool-crop-planning",
    title: "Planification des Cultures & Calendrier Cultural",
    category: "agronomie",
    categoryLabel: "Cultures, Calculs & Fiches",
    description: "Calendrier prévisionnel simple des cycles culturaux : dates de semis, repiquage, sarclages, apports d'engrais et récoltes.",
    route: "/dashboard/crop-planning",
    iconName: "Calendar",
    isOffline: true,
    badges: ["Calendrier", "Cycles", "Hors ligne"],
    keywords: ["planification", "calendrier cultural", "cycle", "semis", "récolte", "stade", "rotation", "planifier"],
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
    categoryLabel: "Cultures, Calculs & Fiches",
    description: "Registre simple des parcelles enregistrées, cultures en cours, superficies et suivi des récoltes.",
    route: "/dashboard/parcels",
    iconName: "Sprout",
    isOffline: true,
    badges: ["Parcelles", "Cultures", "Registre", "Hors ligne"],
    keywords: ["parcelles", "exploitations", "registre", "sol", "cultures", "assolements"],
    contextualAi: {
      roleDescription: "Gestionnaire d'exploitations agricoles.",
      suggestedActions: [
        { label: "Créer une parcelle", prompt: "Ajoute une nouvelle parcelle dans le registre de l'exploitation." },
      ],
    },
  },
  {
    id: "tool-prescriptions",
    title: "Prescriptions & Conseils Techniques",
    category: "conseil_clients",
    categoryLabel: "Conseil, Clients & Facturation",
    description: "Rédaction et suivi des fiches de conseils et recommandations agronomiques destinées aux producteurs accompagnés.",
    route: "/dashboard/expert-prescriptions",
    iconName: "FileText",
    isOffline: true,
    badges: ["Conseils", "Ordonnances", "PDF", "Hors ligne"],
    keywords: ["prescriptions", "ordonnance", "conseil", "recommandations", "producteurs", "traitement", "suivi"],
    contextualAi: {
      roleDescription: "Conseiller agronomique rédigeant des recommandations culturales claires.",
      suggestedActions: [
        { label: "Rédiger une prescription", prompt: "Prépare une fiche de recommandation simple pour un producteur." },
      ],
    },
  },

  // ─── 2. CONSEIL, CLIENTS, DEVIS & FACTURATION ───
  {
    id: "tool-expert-clients",
    title: "Portefeuille Clients & Exploitations Suivies",
    category: "conseil_clients",
    categoryLabel: "Conseil, Clients & Facturation",
    description: "Carnet de clientèle : liste des exploitants suivis, historique des visites, contrats de conseil et coordonnées directes.",
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
    id: "tool-proposer-prestations",
    title: "Proposer mes Prestations & Tarifs",
    category: "conseil_clients",
    categoryLabel: "Conseil, Clients & Facturation",
    description: "Publiez vos offres de conseil, suivi d'exploitation et accompagnement technique avec vos tarifs en FCFA.",
    route: "/dashboard/partenaire-mes-offres",
    iconName: "Store",
    isOffline: true,
    badges: ["Prestations", "Tarifs FCFA", "Catalogue"],
    keywords: ["proposer", "prestations", "offres", "tarifs", "services", "conseil", "catalogue"],
    contextualAi: {
      roleDescription: "Conseiller commercial pour prestations agronomiques.",
      suggestedActions: [
        { label: "Publier une offre", prompt: "Crée une nouvelle prestation de conseil agronomique." },
      ],
    },
  },
  {
    id: "tool-quote-requests",
    title: "Demandes de Devis & Commandes Reçues",
    category: "conseil_clients",
    categoryLabel: "Conseil, Clients & Facturation",
    description: "Gestion des sollicitations d'agriculteurs et d'investisseurs : demandes d'accompagnement, conseils et suivi cultural.",
    route: "/dashboard/quote-requests",
    iconName: "FileText",
    isOffline: true,
    badges: ["Devis reçus", "Missions", "Clients"],
    keywords: ["demandes de devis", "devis", "missions", "sollicitations", "investisseurs", "rendez-vous", "faire un devis"],
    contextualAi: {
      roleDescription: "Coordonnateur des missions de conseil et des propositions commerciales.",
      suggestedActions: [
        { label: "Traiter les demandes", prompt: "Examine les nouvelles demandes d'accompagnement reçues." },
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
    keywords: ["facturation", "factures", "proformas", "honoraires", "prestations", "fcfa", "reçus", "devis fcfa"],
    contextualAi: {
      roleDescription: "Comptable et gestionnaire de facturation pour cabinets de conseil agricole.",
      suggestedActions: [
        { label: "Créer une facture proforma", prompt: "Prépare une facture proforma en FCFA pour une prestation de conseil." },
      ],
    },
  },
  {
    id: "tool-partner-branding",
    title: "Identité Professionnelle & Documents Officiels",
    category: "conseil_clients",
    categoryLabel: "Conseil, Clients & Facturation",
    description: "Personnalisez tous vos documents PDF (devis, factures, fiches conseils) avec le nom de votre cabinet, logo, agrément et coordonnées.",
    route: "/dashboard/identite-professionnelle",
    iconName: "Building2",
    isOffline: true,
    badges: ["Branding", "Agrément", "PDF", "Cabinet"],
    keywords: ["identité", "documents", "branding", "logo", "agrément", "cabinet", "en-tête"],
    contextualAi: {
      roleDescription: "Responsable conformité et valorisation de l'identité de marque du cabinet.",
      suggestedActions: [
        { label: "Configurer mon cabinet", prompt: "Mets à jour le nom, numéro d'agrément et coordonnées qui apparaissent sur les PDF." },
      ],
    },
  },

  // ─── 3. FORMATIONS & PERFORMANCES ───
  {
    id: "tool-expert-analytics",
    title: "Analytique & Performances du Conseil",
    category: "gestion_analyse",
    categoryLabel: "Formations & Performances",
    description: "Tableau de bord statistique : nombre d'accompagnements, rendements moyens des clients conseillés et suivi des honoraires.",
    route: "/dashboard/expert-analytics",
    iconName: "BarChart3",
    isOffline: true,
    badges: ["Statistiques", "KPIs", "Performances"],
    keywords: ["statistiques", "analytique", "performances", "kpi", "suivi activité", "rendements"],
    contextualAi: {
      roleDescription: "Analyste d'impact agronomique et de rentabilité des exploitations.",
      suggestedActions: [
        { label: "Consulter les indicateurs", prompt: "Affiche le récapitulatif des activités ce mois-ci." },
      ],
    },
  },
  {
    id: "tool-education-catalog",
    title: "Académie & Formation Continue Agronomique",
    category: "gestion_analyse",
    categoryLabel: "Formations & Performances",
    description: "Guides pratiques, bonnes pratiques agroécologiques, formations certifiantes et manuels de vulgarisation.",
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
  FAVORITES: "nafa_agronomic_favorite_tools_v2",
  RECENTS: "nafa_agronomic_recent_tools_v2",
};

// ─── Favoris par défaut au premier chargement ───
const DEFAULT_FAVORITE_IDS = [
  "tool-crop-library",
  "tool-expert-calculator",
  "tool-crop-planning",
  "tool-expert-clients",
];

export const agronomicToolkitStorage = {
  getAllTools(): AgronomicToolItem[] {
    return AGRONOMIC_TOOLS_CATALOG;
  },

  getToolById(id: string): AgronomicToolItem | undefined {
    return AGRONOMIC_TOOLS_CATALOG.find((t) => t.id === id);
  },

  getToolsByCategory(category: ToolkitCategory): AgronomicToolItem[] {
    if (category === "all") return AGRONOMIC_TOOLS_CATALOG;
    return AGRONOMIC_TOOLS_CATALOG.filter((t) => t.category === category);
  },

  searchTools(query: string, category: ToolkitCategory = "all"): AgronomicToolItem[] {
    const list = this.getToolsByCategory(category);
    if (!query || query.trim() === "") return list;

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

      return tokens.every((token) => {
        if (fullText.includes(token)) return true;
        if (token.startsWith("fertili")) return fullText.includes("fertili") || fullText.includes("npk");
        const root = token.length > 4 ? token.slice(0, token.length > 6 ? -3 : -2) : token;
        return fullText.includes(root);
      });
    });
  },

  getFavoriteToolIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("[ToolkitStorage] Erreur lecture favoris:", e);
    }
    return DEFAULT_FAVORITE_IDS;
  },

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

  isFavorite(toolId: string): boolean {
    return this.getFavoriteToolIds().includes(toolId);
  },

  getFavoriteTools(): AgronomicToolItem[] {
    const ids = this.getFavoriteToolIds();
    return ids
      .map((id) => this.getToolById(id))
      .filter((tool): tool is AgronomicToolItem => Boolean(tool));
  },

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
