/**
 * Définition et gestion des profils de partenaires spécialisés NAFA - AGRITECH
 * Chaque partenaire choisit son profil de spécialisation et ses types de produits/services.
 * Les comptes partenaires ne sont PAS unifiés en bloc générique mais adaptés à leur corps de métier.
 */

export type PartnerProfileType =
  | "fournisseur_intrants"
  | "expert_agronome"
  | "elevage_veterinaire"
  | "institution_agri"
  | "polyvalent";

export interface PartnerProfileMeta {
  id: PartnerProfileType;
  title: string;
  shortLabel: string;
  badge: string;
  iconName: string;
  category: string;
  tagline: string;
  description: string;
  defaultProducts: string[];
  defaultServices: string[];
  suggestedTags: string[];
  dashboardTitle: string;
  dashboardSubtitle: string;
}

export const PARTNER_PROFILES: Record<PartnerProfileType, PartnerProfileMeta> = {
  fournisseur_intrants: {
    id: "fournisseur_intrants",
    title: "Fournisseur d'Intrants, Matériel & Équipements",
    shortLabel: "Intrants & Matériel",
    badge: "Fournisseur d'Intrants & Matériel Agréé",
    iconName: "FlaskConical",
    category: "intrants",
    tagline: "Vente d'engrais NPK/Urée, semences certifiées, matériel agricole (motoculteurs, tracteurs, pièces) et produits phytosanitaires homologués CSP",
    description: "Boutiques et distributeurs d'engrais minéraux et organiques, semenciers agréés, vente et location de matériel agricole et outillage de traitement.",
    defaultProducts: [
      "Engrais NPK 15-15-15 (sacs 50 kg)",
      "Urée 46% granulée",
      "Fumure organique & compost enrichi",
      "Semences certifiées de maïs hybride",
      "Semences certifiées de riz de bas-fond",
      "Produits phytosanitaires homologués CSP",
      "Pulvérisateurs à dos et équipements de protection (EPI)",
      "Motoculteurs & petit matériel agricole",
      "Pièces de rechange et disques de charrue",
    ],
    defaultServices: [
      "Vente d'intrants en gros et demi-gros",
      "Livraison d'engrais et matériel sur exploitation",
      "Conseil de dosage et d'épandage au comptoir",
      "Location et mise à disposition de matériel agricole",
    ],
    suggestedTags: ["NPK", "Urée", "Semences certifiées", "Matériel agricole", "Engrais bio", "Traitement phyto", "Pulvérisateurs"],
    dashboardTitle: "Espace Fournisseur d'Intrants, Matériel & Équipements",
    dashboardSubtitle: "Gérez votre catalogue d'intrants, fertilisants, semences et matériel agricole, traitez les commandes et servez vos clients producteurs.",
  },

  expert_agronome: {
    id: "expert_agronome",
    title: "Cabinet d'Agronomie & Conseil Technique",
    shortLabel: "Agronome & Conseil",
    badge: "Cabinet d'Agronomie Agréé",
    iconName: "Microscope",
    category: "service",
    tagline: "Diagnostics phytosanitaires avancés, ordonnances officielles, analyses de sol et cartographie GPS",
    description: "Ingénieurs et conseillers agronomes certifiés, spécialistes en protection des cultures, pédologie, télédétection et amélioration des rendements.",
    defaultProducts: [
      "Fiches techniques culturales illustrées",
      "Kits d'échantillonnage et analyse rapide du sol",
    ],
    defaultServices: [
      "Diagnostic des maladies foliaires et carences",
      "Prescription d'ordonnances phytosanitaires signées",
      "Scouting géolocalisé et surveillance de ravageurs",
      "Cartographie GPS polygone et délimitation de parcelles",
      "Plan prévisionnel de fertilisation et de fumure",
      "Formation pratique des producteurs et coopératives",
    ],
    suggestedTags: ["Diagnostic avancé", "Ordonnance phyto", "Cartographie GPS", "Scouting", "Fertilité des sols"],
    dashboardTitle: "Cabinet d'Agronomie & Expertise Conseil",
    dashboardSubtitle: "Délivrez vos ordonnances agronomiques, réalisez les diagnostics avancés et auditez les parcelles clientes.",
  },

  elevage_veterinaire: {
    id: "elevage_veterinaire",
    title: "Santé Animale, Élevage & Zootechnie",
    shortLabel: "Vétérinaire & Élevage",
    badge: "Cabinet Vétérinaire & Élevage Agréé",
    iconName: "Beef",
    category: "elevage",
    tagline: "Soins vétérinaires, vaccins et prophylaxie, alimentation du bétail et insémination artificielle",
    description: "Docteurs vétérinaires, techniciens d'élevage, pharmaciens vétérinaires, fabricants d'aliments et provendes pour bovins, ovins, caprins et volailles.",
    defaultProducts: [
      "Aliments bétail concentrés & tourteaux",
      "Blocs à lécher et sels minéraux",
      "Médicaments vétérinaires et antiparasitaires autorisés",
      "Poussins d'un jour et volailles améliorées",
      "Matériel d'élevage et abreuvoirs",
    ],
    defaultServices: [
      "Campagnes de vaccination et déparasitage du bétail",
      "Insémination artificielle et amélioration génétique",
      "Formulation de rations alimentaires adaptées",
      "Suivi prophylactique et sanitaire d'élevages",
      "Soins d'urgence et chirurgie vétérinaire",
    ],
    suggestedTags: ["Vaccins bétail", "Aliment volaille", "Insémination", "Soins vétérinaires", "Embouche"],
    dashboardTitle: "Espace Santé Animale & Zootechnie",
    dashboardSubtitle: "Gérez les consultations vétérinaires, suivez les troupeaux clients et distribuez les provendes.",
  },

  institution_agri: {
    id: "institution_agri",
    title: "Banque, Microfinance & Assurance Agricole",
    shortLabel: "Finance & Assurance",
    badge: "Institution Partenaire Agréée",
    iconName: "Landmark",
    category: "banque",
    tagline: "Crédits de campagne agricole, financement d'équipements, assurances récoltes et programmes bailleurs",
    description: "Systèmes financiers décentralisés (SFD), banques agricoles, compagnies d'assurance indicielle climat, bailleurs de fonds et projets de développement rural.",
    defaultProducts: [
      "Crédits de campagne pour intrants et semences",
      "Financement et crédit-bail pour tracteurs et motopompes",
      "Assurance indicielle récolte sécheresse et inondation",
      "Assurance mortalité du bétail",
    ],
    defaultServices: [
      "Instruction rapide des demandes de prêt agricole",
      "Octroi de bons d'achat et subventions partenaires",
      "Indemnisation automatique sur sinistre climatique",
      "Accompagnement à la bancarisation des producteurs",
    ],
    suggestedTags: ["Crédit de campagne", "Assurance récolte", "Financement tracteur", "Subventions", "Microfinance"],
    dashboardTitle: "Espace Banque, Microfinance & Assurance",
    dashboardSubtitle: "Analysez les demandes de crédit de campagne, gérez les polices d'assurance récoltes et suivez les portefeuilles.",
  },

  polyvalent: {
    id: "polyvalent",
    title: "Hub Entreprise Agro-Pastorale Polyvalente",
    shortLabel: "Entreprise Globale",
    badge: "Partenaire Multi-Services Agréé",
    iconName: "Handshake",
    category: "autre",
    tagline: "Entreprise intégrée combinant intrants, travaux mécanisés, élevage et conseil technique",
    description: "Grandes entreprises agricoles et coopératives régionales opérant simultanément dans l'approvisionnement, la prestation de travaux mécanisés et le conseil agronomique.",
    defaultProducts: [
      "Intrants et semences certifiées",
      "Matériel et pièces de rechange",
      "Aliments du bétail",
    ],
    defaultServices: [
      "Chantiers de mécanisation agricole",
      "Vente et distribution d'intrants",
      "Diagnostics agronomiques et conseil",
      "Appui aux filières animales et végétales",
    ],
    suggestedTags: ["Multi-services", "Intrants", "Tracteurs", "Conseil", "Élevage"],
    dashboardTitle: "Hub Entreprise Agro-Pastorale Polyvalente",
    dashboardSubtitle: "Supervisez l'ensemble de vos pôles d'activités agro-pastorales et commerciales.",
  },
};

export const PARTNER_PROFILE_LIST = Object.values(PARTNER_PROFILES);

const STORAGE_KEY_PREFIX = "nafa_partner_profile_type_";

export function getStoredPartnerProfileType(userId?: string): PartnerProfileType {
  try {
    if (userId) {
      const userSpecific = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      if (userSpecific && userSpecific in PARTNER_PROFILES) {
        return userSpecific as PartnerProfileType;
      }
    }
    const generic = localStorage.getItem("nafa_current_partner_type");
    if (generic && generic in PARTNER_PROFILES) {
      return generic as PartnerProfileType;
    }
  } catch (e) {
    console.warn("Erreur lecture type partenaire local:", e);
  }
  return "fournisseur_intrants"; // Profil par défaut le plus courant pour un partenaire
}

export function saveStoredPartnerProfileType(type: PartnerProfileType, userId?: string): void {
  try {
    localStorage.setItem("nafa_current_partner_type", type);
    if (userId) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, type);
    }
    window.dispatchEvent(new CustomEvent("nafa-partner-type-updated", { detail: { type } }));
  } catch (e) {
    console.error("Erreur sauvegarde type partenaire local:", e);
  }
}
