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
      { name: "Marketplace publique", description: "Consulter les offres et prestataires", route: "/dashboard/marketplace" },
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
      "Visibilité prioritaire sur le Marketplace NAFA - AGRITECH",
      "Calculatrice de doses pour conseiller les clients au comptoir",
      "Factures et bons de commande PDF",
    ],
    toolsIncluded: [
      { name: "Gestion de mes offres & catalogue", description: "Gérer stock, prix et visibilité", route: "/dashboard/partenaire-mes-offres" },
      { name: "Marketplace NAFA - AGRITECH", description: "Présence auprès des producteurs", route: "/dashboard/marketplace" },
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
      "Diagnostic avancé illimité (maladies, ravageurs, carences)",
      "Générateur d'ordonnances agronomiques certifiées PDF",
      "Scouting terrain géolocalisé avec relevé GPS et export de rapports",
      "Gestion de la flotte de matériel en location & réservations avec acompte séquestre",
      "Carnet de suivi des exploitations clientes et tournées",
      "Export PDF/CSV des diagnostics et comptes-rendus d'intervention",
      "Badge officiel 'Partenaire Agréé NAFA - AGRITECH'",
    ],
    toolsIncluded: [
      { name: "Diagnostic Végétal", description: "Analyse instantanée et précise", route: "/dashboard/expert-diagnosis" },
      { name: "Ordonnances Agros PDF", description: "Génération signée et QR-code", route: "/dashboard/expert-prescriptions" },
      { name: "Scouting terrain GPS", description: "Patrouilles parcellaires et relevés", route: "/dashboard/scouting" },
      { name: "Gestion Matériel & Location", description: "Flotte tracteurs, drones, moissonneuses", route: "/dashboard/equipment" },
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

export function getStoredProviderSubscription(userId?: string): ProviderSubscription {
  try {
    if (userId) {
      const userRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
      if (userRaw) return JSON.parse(userRaw);
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (e) {
    console.error("Failed to parse provider subscription", e);
  }

  return {
    tier: "pro_prestataire",
    activityType: "polyvalent",
    companyName: "Mon Entreprise Partenaire",
    phone: "+226 ",
    email: "partenaire@nafa-agritech.com",
    location: "Burkina Faso",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    isActive: true,
    paymentMethod: "orange_money",
    paymentReference: "OM-88492048",
    toolsUnlocked: [
      "diagnostic_ia",
      "ordonnances_pdf",
      "scouting_gps",
      "location_materiel",
      "calculatrice_agro",
      "cartographie_gps",
      "carnet_clients",
      "marketplace_offres",
    ],
  };
}

export function saveProviderSubscription(sub: ProviderSubscription, userId?: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sub));
    if (userId) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(sub));
    }
    window.dispatchEvent(new CustomEvent("nafa-subscription-updated", { detail: sub }));
  } catch (e) {
    console.error("Failed to save provider subscription", e);
  }
}
