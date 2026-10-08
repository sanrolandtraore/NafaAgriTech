export type SubscriptionTier = "free" | "starter" | "pro_prestataire" | "enterprise";
export type ProviderActivityType = "services_agronomiques" | "vente_intrants" | "location_materiel" | "polyvalent";

export interface ProviderSubscription {
  tier: SubscriptionTier;
  activityType: ProviderActivityType;
  companyName: string;
  phone: string;
  email: string;
  location: string;
  serviceArea?: string;
  contactPhone?: string;
  contactEmail?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  paymentMethod: "orange_money" | "moov_money" | "wave" | "virement" | "especes";
  paymentReference?: string;
  toolsUnlocked: string[];
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  title: string;
  targetBadge: string;
  monthlyPriceFCFA: number;
  annualPriceFCFA: number;
  popular?: boolean;
  tagline: string;
  features: string[];
  toolsIncluded: {
    name: string;
    description: string;
    route: string;
  }[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    title: "Accès Découverte",
    targetBadge: "Visiteur / Test",
    monthlyPriceFCFA: 0,
    annualPriceFCFA: 0,
    tagline: "Pour découvrir l'écosystème NAFA - AGRITECH",
    features: [
      "Consultation du catalogue d'offres",
      "Fiches techniques cultures (accès limité)",
      "1 diagnostic d'essai",
      "Support communautaire",
    ],
    toolsIncluded: [
      { name: "Marché public", description: "Consulter les offres et prestataires", route: "/dashboard/marketplace" },
      { name: "Fiches techniques de base", description: "Cultures sahéliennes", route: "/dashboard/crop-library" },
    ],
  },
  {
    id: "starter",
    title: "Pack Indépendant / Vendeur",
    targetBadge: "Vente & Magasins",
    monthlyPriceFCFA: 15000,
    annualPriceFCFA: 150000,
    tagline: "Pour les boutiques d'intrants, semenciers et quincailleries agricoles",
    features: [
      "Publication illimitée de produits (intrants, semences, petit matériel)",
      "Réception directe des demandes de devis clients",
      "Visibilité prioritaire sur le Marché NAFA - AGRITECH",
      "Calculatrice de doses pour conseiller les clients au comptoir",
      "Factures et bons de commande PDF",
    ],
    toolsIncluded: [
      { name: "Gestion de mes offres & catalogue", description: "Gérer stock, prix et visibilité", route: "/dashboard/partenaire-mes-offres" },
      { name: "Marché NAFA - AGRITECH", description: "Présence auprès des producteurs", route: "/dashboard/marketplace" },
      { name: "Calculatrice agronomique", description: "Aide au calcul de doses et fertilisation", route: "/dashboard/expert-calculator" },
      { name: "Fiches techniques 12 cultures", description: "Conseil client certifié", route: "/dashboard/crop-library" },
    ],
  },
  {
    id: "pro_prestataire",
    popular: true,
    title: "Pack Pro Prestataire & Location",
    targetBadge: "Services & Mécanisation",
    monthlyPriceFCFA: 35000,
    annualPriceFCFA: 350000,
    tagline: "Pour les entrepreneurs de travaux agricoles, loueurs de tracteurs, drones et experts agronomes",
    features: [
      "Toute la suite d'aide à la décision NAFA - AGRITECH débloquée",
      "Fiches techniques de cultures et référentiels agronomiques",
      "Générateur d'ordonnances agronomiques certifiées PDF",
      "Observation terrain géolocalisée avec relevé GPS et export de rapports",
      "Gestion de la flotte de matériel en location & réservations avec acompte séquestre",
      "Carnet de suivi des exploitations clientes et tournées",
      "Export PDF/CSV des rapports et comptes-rendus d'intervention",
      "Badge officiel 'Partenaire Agréé NAFA - AGRITECH'",
    ],
    toolsIncluded: [
      { name: "Fiches Techniques Cultures", description: "Référentiels ouest-africains certifiés", route: "/dashboard/crop-library" },
      { name: "Ordonnances Agros PDF", description: "Génération signée et QR-code", route: "/dashboard/expert-prescriptions" },
      { name: "Observation terrain GPS", description: "Patrouilles parcellaires et relevés", route: "/dashboard/scouting" },
      { name: "Matériel & Intrants (Vente & Location)", description: "Offres matériel, semences et intrants", route: "/dashboard/marketplace?cat=machinisme" },
      { name: "Calculatrice Agro & Doses", description: "Semis, fractionnement NPK, eau ETc", route: "/dashboard/expert-calculator" },
      { name: "Cartographie GPS Polygone", description: "Mesure de surface et limites", route: "/dashboard/expert-cartography" },
      { name: "Carnet Clients & Tournées", description: "Gestion des exploitations suivies", route: "/dashboard/expert-clients" },
    ],
  },
  {
    id: "enterprise",
    title: "Pack Coopérative & Agro-industrie",
    targetBadge: "Multi-utilisateurs",
    monthlyPriceFCFA: 75000,
    annualPriceFCFA: 750000,
    tagline: "Pour les coopératives, unions, ONG, projets de développement et concessions",
    features: [
      "Comptes multi-agents de terrain (jusqu'à 15 techniciens)",
      "Synchronisation flotte complète de matériel et machines",
      "Cartographie SIG consolidée des parcelles membres",
      "Gestion centralisée des intrants et approvisionnements groupés",
      "Tableau de bord statistique KPI & audits d'impact",
      "Support agronomique dédié 7j/7 et formations d'équipes",
    ],
    toolsIncluded: [
      { name: "Suite complète Aide à la Décision", description: "Tous les outils NAFA - AGRITECH en illimité", route: "/dashboard/expert-toolbox" },
      { name: "Statistiques & KPIs d'impact", description: "Rapports consolidés pour partenaires/bailleurs", route: "/dashboard/expert-analytics" },
      { name: "Annuaire des partenaires régionaux", description: "Réseau national d'acteurs", route: "/dashboard/partners-directory" },
    ],
  },
];

const LOCAL_STORAGE_KEY = "nafa_provider_subscription";

export const CERTIFIED_DEFAULT_PARTNERS: string[] = [];

export function isSubscriptionActive(sub?: ProviderSubscription | null): boolean {
  if (!sub || !sub.isActive) return false;
  if (!sub.endDate) return false;
  const end = new Date(sub.endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return end.getTime() >= now.getTime();
}

export function getSubscriptionDaysRemaining(sub?: ProviderSubscription | null): number {
  if (!sub || !sub.endDate || !sub.isActive) return 0;
  const end = new Date(sub.endDate).getTime();
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Vérifie si un partenaire spécifique possède un abonnement payant actif lui permettant d'afficher ses offres sur la Marketplace.
 */
export function isPartnerSubscriptionActive(partnerId?: string | null): boolean {
  if (!partnerId) return false;
  if (CERTIFIED_DEFAULT_PARTNERS.length > 0 && CERTIFIED_DEFAULT_PARTNERS.some((id) => partnerId.startsWith(id) || partnerId.includes(id))) {
    return true;
  }

  // Vérifier la souscription stockée pour ce partenaire
  try {
    const userRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${partnerId}`);
    if (userRaw) {
      const sub = JSON.parse(userRaw) as ProviderSubscription;
      return isSubscriptionActive(sub) && sub.tier !== "free";
    }
    const mapRaw = localStorage.getItem("nafa_partner_subscriptions_map");
    if (mapRaw) {
      const map = JSON.parse(mapRaw);
      if (map[partnerId]) {
        return isSubscriptionActive(map[partnerId]) && map[partnerId].tier !== "free";
      }
    }
    const globalRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (globalRaw) {
      const sub = JSON.parse(globalRaw) as ProviderSubscription;
      return isSubscriptionActive(sub) && sub.tier !== "free";
    }
  } catch {
    // Ignorer
  }
  return false;
}

export function getStoredProviderSubscription(userId?: string): ProviderSubscription {
  try {
    if (userId) {
      const userRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
      if (userRaw) return JSON.parse(userRaw);
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse provider subscription", e);
  }

  // Par défaut, un compte partenaire démarre en statut Découverte non activé
  // Il doit souscrire via Orange Money, Moov, Wave ou Carte pour publier sur la Marketplace
  return {
    tier: "free",
    activityType: "services_agronomiques",
    companyName: "Mon Entreprise Partenaire",
    phone: "+226 ",
    email: "partenaire@nafaagritech.app",
    location: "Burkina Faso",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isActive: false,
    paymentMethod: "orange_money",
    paymentReference: undefined,
    toolsUnlocked: [
      "marketplace_visiteur",
      "fiches_techniques_base",
    ],
  };
}

export function saveProviderSubscription(sub: ProviderSubscription, userId?: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sub));
    if (userId) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(sub));
      const mapRaw = localStorage.getItem("nafa_partner_subscriptions_map");
      const map = mapRaw ? JSON.parse(mapRaw) : {};
      map[userId] = sub;
      localStorage.setItem("nafa_partner_subscriptions_map", JSON.stringify(map));
    }
    window.dispatchEvent(new CustomEvent("nafa-subscription-updated", { detail: sub }));
  } catch (e) {
    console.error("Failed to save provider subscription", e);
  }
}
