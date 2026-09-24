/**
 * NAFA - AGRITECH : Gestionnaire de Stockage Dédié Espace Partenaire
 * Cloisonnement Métier Absolu & Isolation Totale par Partenaire (owner_id === user.id)
 * 
 * Sections gérées :
 * 1. Présentation
 * 2. Services
 * 3. Produits
 * 4. Réalisations
 * 5. Galerie
 * 6. Avis
 * 7. Contact
 * 8. Devis
 * 9. Commandes
 * 10. Tableau de bord
 * 11. Statistiques
 */

import { saveOfflineRecord, generateLocalUuid } from "@/lib/dexieDb";

export interface DedicatedPartnerPresentation {
  companyName: string;
  category: string;
  tagline: string;
  description: string;
  legalStatus: string;
  licenseNumber: string;
  yearsOfExperience: number;
  expertiseDomains: string[];
  logoUrl: string;
  bannerUrl: string;
  isVerified: boolean;
}

export interface DedicatedPartnerService {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  priceEstimate: string;
  turnaroundTime: string;
  isAvailable: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface DedicatedPartnerProduct {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  created_at: string;
  updated_at: string;
}

export interface DedicatedPartnerProject {
  id: string;
  owner_id: string;
  title: string;
  clientName: string;
  completionDate: string;
  location: string;
  description: string;
  results: string;
  imageUrl: string;
  created_at: string;
}

export interface DedicatedPartnerMedia {
  id: string;
  owner_id: string;
  title: string;
  url: string;
  type: "image" | "video";
  category: string;
  created_at: string;
}

export interface DedicatedPartnerReview {
  id: string;
  owner_id: string;
  authorName: string;
  authorLocation: string;
  rating: number; // 1 à 5
  comment: string;
  date: string;
  reply?: string;
}

export interface DedicatedPartnerContact {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  region: string;
  coordinates: { lat: number; lng: number };
  workingHours: string;
}

export interface DedicatedPartnerQuote {
  id: string;
  owner_id: string;
  clientName: string;
  clientPhone: string;
  serviceOrProduct: string;
  estimatedAmountFcfa: number;
  status: "reçu" | "chiffré" | "envoyé" | "accepté" | "refusé";
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DedicatedPartnerOrder {
  id: string;
  owner_id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: string;
  totalAmountFcfa: number;
  status: "en_attente" | "en_preparation" | "expediee" | "livree" | "annulee";
  date: string;
  paymentStatus: "payé" | "en_attente" | "acompte";
  created_at: string;
  updated_at: string;
}

export interface DedicatedPartnerBundle {
  presentation: DedicatedPartnerPresentation;
  services: DedicatedPartnerService[];
  products: DedicatedPartnerProduct[];
  projects: DedicatedPartnerProject[];
  gallery: DedicatedPartnerMedia[];
  reviews: DedicatedPartnerReview[];
  contact: DedicatedPartnerContact;
  quotes: DedicatedPartnerQuote[];
  orders: DedicatedPartnerOrder[];
}

/** Données par défaut initiales pour un partenaire fraîchement créé */
function getDefaultPartnerBundle(ownerId: string): DedicatedPartnerBundle {
  return {
    presentation: {
      companyName: "Mon Entreprise Agricole Partenaire",
      category: "Fournisseur & Services Agro-Pastoraux",
      tagline: "Expertise, intrants certifiés et machinisme au service du monde rural.",
      description: "Entreprise agréée partenaire de la plateforme NAFA - AGRITECH Burkina Faso.",
      legalStatus: "SARL",
      licenseNumber: "BF-OUA-2026-B-14502",
      yearsOfExperience: 5,
      expertiseDomains: ["Machinisme Agricole", "Intrants Certifiés", "Irrigation Solaire"],
      logoUrl: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=200&auto=format&fit=crop&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80",
      isVerified: true,
    },
    services: [
      {
        id: `srv-${ownerId}-1`,
        owner_id: ownerId,
        title: "Labour profond & Préparation de sol motorisée",
        description: "Chantier au tracteur équipé de charrue à disques réversible pour grandes surfaces maraîchères et céréalières.",
        priceEstimate: "45 000 FCFA / hectare",
        turnaroundTime: "48h après réservation",
        isAvailable: true,
        category: "Machinisme",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `srv-${ownerId}-2`,
        owner_id: ownerId,
        title: "Installation de système d'irrigation goutte-à-goutte",
        description: "Pose complète avec tête de filtration à disques, venturi fertilisant et rampes goutteurs autorégulants.",
        priceEstimate: "Sur devis (dès 650 000 FCFA / ha)",
        turnaroundTime: "5 jours ouvrés",
        isAvailable: true,
        category: "Irrigation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    products: [
      {
        id: `prd-${ownerId}-1`,
        owner_id: ownerId,
        name: "Semences d'Oignon Violet de Galmi Certifiées",
        description: "Semences sélectionnées à haute germination (95%), résistantes à la pourriture basale.",
        price: 32500,
        unit: "Boîte 500g",
        stock: 45,
        imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80",
        category: "Intrants & Semences",
        isAvailable: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `prd-${ownerId}-2`,
        owner_id: ownerId,
        name: "Kit Pompe Solaire Immergée 48V DC 3m³/h",
        description: "Pompe hélicoïdale en inox sans balais avec contrôleur MPPT étanche IP65.",
        price: 480000,
        unit: "Kit complet",
        stock: 8,
        imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80",
        category: "Irrigation & Solaire",
        isAvailable: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    projects: [],
    gallery: [
      {
        id: `med-${ownerId}-1`,
        owner_id: ownerId,
        title: "Parc de tracteurs en intervention terrain",
        url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80",
        type: "image",
        category: "Équipements",
        created_at: new Date().toISOString(),
      },
      {
        id: `med-${ownerId}-2`,
        owner_id: ownerId,
        title: "Installation solaire de pompage au Sourou",
        url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
        type: "image",
        category: "Installations",
        created_at: new Date().toISOString(),
      },
    ],
    reviews: [],
    contact: {
      phone: "+226 25 36 00 00",
      whatsapp: "+226 25 36 00 00",
      email: "contact@entreprise-partenaire.bf",
      address: "Avenue Kadiogo, Secteur 14",
      city: "Ouagadougou",
      region: "Centre",
      coordinates: { lat: 12.3714, lng: -1.5197 },
      workingHours: "Lundi - Samedi : 07h30 - 18h00",
    },
    quotes: [],
    orders: [],
  };
}

const STORAGE_PREFIX = "nafa_partner_dedicated_";

/**
 * Récupère le bundle complet du partenaire de manière strictement isolée par son ownerId
 */
export function getDedicatedPartnerBundle(ownerId: string): DedicatedPartnerBundle {
  const safeId = ownerId || "default-partner";
  const key = `${STORAGE_PREFIX}${safeId}`;
  const raw = localStorage.getItem(key);
  if (!raw) {
    const initial = getDefaultPartnerBundle(safeId);
    saveDedicatedPartnerBundle(safeId, initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    const initial = getDefaultPartnerBundle(safeId);
    return initial;
  }
}

/**
 * Sauvegarde le bundle complet localement et en file Dexie pour synchronisation Supabase
 */
export async function saveDedicatedPartnerBundle(ownerId: string, bundle: DedicatedPartnerBundle): Promise<void> {
  const safeId = ownerId || "default-partner";
  const key = `${STORAGE_PREFIX}${safeId}`;
  localStorage.setItem(key, JSON.stringify(bundle));

  // Pousser dans Dexie DB pour résilience hors-ligne et synchronisation
  try {
    await saveOfflineRecord("partner_bundles", "update", { id: safeId, ...bundle }, safeId);
  } catch (err) {
    console.warn("Erreur sauvegarde Dexie partner bundle:", err);
  }
}

/**
 * Sauvegarde d'un nouveau service avec UUID unique
 */
export async function addPartnerService(
  ownerId: string,
  service: Omit<DedicatedPartnerService, "id" | "owner_id" | "created_at" | "updated_at">
): Promise<DedicatedPartnerService> {
  const bundle = getDedicatedPartnerBundle(ownerId);
  const now = new Date().toISOString();
  const newService: DedicatedPartnerService = {
    ...service,
    id: generateLocalUuid(),
    owner_id: ownerId,
    created_at: now,
    updated_at: now,
  };
  bundle.services.unshift(newService);
  await saveDedicatedPartnerBundle(ownerId, bundle);
  return newService;
}

/**
 * Suppression d'un service vérifiant strictement l'appartenance
 */
export async function deletePartnerService(ownerId: string, serviceId: string): Promise<boolean> {
  const bundle = getDedicatedPartnerBundle(ownerId);
  const beforeCount = bundle.services.length;
  bundle.services = bundle.services.filter((s) => s.id !== serviceId || s.owner_id !== ownerId);
  if (bundle.services.length !== beforeCount) {
    await saveDedicatedPartnerBundle(ownerId, bundle);
    return true;
  }
  return false;
}

/**
 * Sauvegarde d'un nouveau produit avec UUID unique
 */
export async function addPartnerProduct(
  ownerId: string,
  product: Omit<DedicatedPartnerProduct, "id" | "owner_id" | "created_at" | "updated_at">
): Promise<DedicatedPartnerProduct> {
  const bundle = getDedicatedPartnerBundle(ownerId);
  const now = new Date().toISOString();
  const newProduct: DedicatedPartnerProduct = {
    ...product,
    id: generateLocalUuid(),
    owner_id: ownerId,
    created_at: now,
    updated_at: now,
  };
  bundle.products.unshift(newProduct);
  await saveDedicatedPartnerBundle(ownerId, bundle);
  return newProduct;
}

/**
 * Suppression d'un produit vérifiant strictement l'appartenance
 */
export async function deletePartnerProduct(ownerId: string, productId: string): Promise<boolean> {
  const bundle = getDedicatedPartnerBundle(ownerId);
  const beforeCount = bundle.products.length;
  bundle.products = bundle.products.filter((p) => p.id !== productId || p.owner_id !== ownerId);
  if (bundle.products.length !== beforeCount) {
    await saveDedicatedPartnerBundle(ownerId, bundle);
    return true;
  }
  return false;
}

/**
 * Mise à jour du statut d'une commande
 */
export async function updatePartnerOrderStatus(
  ownerId: string,
  orderId: string,
  status: DedicatedPartnerOrder["status"]
): Promise<boolean> {
  const bundle = getDedicatedPartnerBundle(ownerId);
  const order = bundle.orders.find((o) => o.id === orderId && o.owner_id === ownerId);
  if (order) {
    order.status = status;
    order.updated_at = new Date().toISOString();
    await saveDedicatedPartnerBundle(ownerId, bundle);
    return true;
  }
  return false;
}

/**
 * Mise à jour du statut d'un devis
 */
export async function updatePartnerQuoteStatus(
  ownerId: string,
  quoteId: string,
  status: DedicatedPartnerQuote["status"]
): Promise<boolean> {
  const bundle = getDedicatedPartnerBundle(ownerId);
  const quote = bundle.quotes.find((q) => q.id === quoteId && q.owner_id === ownerId);
  if (quote) {
    quote.status = status;
    quote.updated_at = new Date().toISOString();
    await saveDedicatedPartnerBundle(ownerId, bundle);
    return true;
  }
  return false;
}
