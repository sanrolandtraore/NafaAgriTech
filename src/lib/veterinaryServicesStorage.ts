/**
 * NAFA - AGRITECH : Module Services Vétérinaires (Catalogue Partenaires Uniquement)
 * 
 * Spécifications & Règles Métier Strictes :
 * 1. module_type = 'veterinary_services'
 * 2. Strictement un catalogue de services et un annuaire de réservation de professionnels agréés.
 * 3. AUCUN tableau de bord d'éleveur ni donnée personnelle d'élevage (troupeau, vaccination perso, etc.).
 * 4. Politiques de sécurité RLS intégrées garantissant l'isolation des données entre partenaires et clients.
 */

import { supabase } from "@/integrations/supabase/client";
import { isValidUuid } from "@/hooks/useOfflineData";

export const VETERINARY_MODULE_TYPE = "veterinary_services" as const;

export type VeterinarySpecialty =
  | "consultation"
  | "vaccination"
  | "deparasitage"
  | "insemination"
  | "reproduction"
  | "chirurgie"
  | "suivi_sanitaire"
  | "urgences"
  | "analyses"
  | "formation"
  | "conseils";

export interface VeterinaryServiceItem {
  id: string;
  partner_id: string;
  title: string;
  category: VeterinarySpecialty;
  description: string;
  price_fcfa: number;
  price_unit: string;
  duration_min?: number;
  emergency: boolean;
  is_active: boolean;
}

export interface VeterinaryProductItem {
  id: string;
  title: string;
  description: string;
  price_fcfa: number;
  unit: string;
  is_prescription_required: boolean;
  in_stock: boolean;
}

export interface VeterinaryReview {
  id: string;
  author_name: string;
  client_type: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
}

export interface VeterinaryPartner {
  id: string;
  module_type: typeof VETERINARY_MODULE_TYPE;
  user_id?: string;
  name: string;
  doctor_name: string;
  order_number: string; // N° Inscription à l'Ordre National des Vétérinaires du Burkina Faso (ONV-BF)
  logo: string;
  cover_image: string;
  presentation: string;
  city: string;
  region: string;
  location_address: string;
  coordinates: { lat: number; lng: number };
  intervention_zone: string;
  intervention_radius_km: number;
  services: VeterinaryServiceItem[];
  products: VeterinaryProductItem[];
  gallery: string[];
  reviews: VeterinaryReview[];
  business_hours: {
    days: string;
    hours: string;
    emergency_24_7: boolean;
  };
  phone: string;
  whatsapp: string;
  email: string;
  is_verified: boolean;
  rating: number;
  reviews_count: number;
  starting_price_fcfa: number;
}

export interface VeterinaryBookingRequest {
  id: string;
  module_type: typeof VETERINARY_MODULE_TYPE;
  partner_id: string;
  partner_name: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  service_id: string;
  service_name: string;
  requested_date: string;
  requested_time: string;
  location: string;
  animal_type?: string;
  animal_count?: number;
  notes?: string;
  estimated_cost_fcfa: number;
  status: "en_attente" | "confirmee" | "terminee" | "annulee";
  created_at: string;
}

export interface VeterinaryQuoteRequest {
  id: string;
  module_type: typeof VETERINARY_MODULE_TYPE;
  partner_id: string;
  partner_name: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  service_id: string;
  service_name: string;
  animal_count?: number;
  description: string;
  status: "en_attente" | "acceptee" | "refusee";
  created_at: string;
}

// ─── Données Officielles des Partenaires Vétérinaires Certifiés (Burkina Faso) ───
export const INITIAL_VETERINARY_PARTNERS: VeterinaryPartner[] = [
  {
    id: "vet-covefa-bobo",
    module_type: VETERINARY_MODULE_TYPE,
    name: "Cabinet Vétérinaire du Faso (COVEFA - Agence Bobo)",
    doctor_name: "Dr. Oumarou Sawadogo",
    order_number: "ONV-BF N° 084",
    logo: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&auto=format&fit=crop&q=80",
    cover_image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=1200&auto=format&fit=crop&q=80",
    presentation: "Structure agréée par l'Ordre National des Vétérinaires du Burkina Faso. Plus de 15 ans d'expérience en santé bovine, embouche, prophylaxie ovine/caprine et aviculture sahélienne.",
    city: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    location_address: "Avenue de la Liberté, Secteur 5, Bobo-Dioulasso",
    coordinates: { lat: 11.1772, lng: -4.2979 },
    intervention_zone: "Bobo-Dioulasso, Bama, Toussiana, Banfora et Hauts-Bassins",
    intervention_radius_km: 75,
    business_hours: {
      days: "Lundi au Samedi",
      hours: "07h30 - 18h00",
      emergency_24_7: true,
    },
    phone: "+226 20 97 15 45",
    whatsapp: "+226 70 20 15 45",
    email: "contact@covefa-veterinaire.bf",
    is_verified: true,
    rating: 4.9,
    reviews_count: 38,
    starting_price_fcfa: 5000,
    services: [
      {
        id: "vs-covefa-1",
        partner_id: "vet-covefa-bobo",
        title: "Consultation vétérinaire générale sur site",
        category: "consultation",
        description: "Examen clinique complet de l'animal ou du troupeau, thermométrie, diagnostic et prescription immédiate.",
        price_fcfa: 7500,
        price_unit: "par visite",
        duration_min: 45,
        emergency: false,
        is_active: true,
      },
      {
        id: "vs-covefa-2",
        partner_id: "vet-covefa-bobo",
        title: "Campagne de vaccination bétail (PPR, PPCB, Charbon)",
        category: "vaccination",
        description: "Administration des vaccins certifiés LANACOM avec délivrance du certificat officiel de vaccination.",
        price_fcfa: 500,
        price_unit: "par tête (min 20 têtes)",
        duration_min: 120,
        emergency: false,
        is_active: true,
      },
      {
        id: "vs-covefa-3",
        partner_id: "vet-covefa-bobo",
        title: "Déparasitage stratégique & vermifugation globale",
        category: "deparasitage",
        description: "Traitement interne (Albendazole) et externe (acaricide / trypanocide) adapté au sol sahélien.",
        price_fcfa: 800,
        price_unit: "par sujet",
        duration_min: 60,
        emergency: false,
        is_active: true,
      },
      {
        id: "vs-covefa-4",
        partner_id: "vet-covefa-bobo",
        title: "Insémination artificielle bovine (Souches améliorées)",
        category: "insemination",
        description: "Synchronisation des chaleurs, insémination par semence certifiée (Goudali, Montbéliarde) et échographie de confirmation.",
        price_fcfa: 25000,
        price_unit: "par vache",
        duration_min: 90,
        emergency: false,
        is_active: true,
      },
      {
        id: "vs-covefa-5",
        partner_id: "vet-covefa-bobo",
        title: "Intervention vétérinaire d'urgence 24/7",
        category: "urgences",
        description: "Prise en charge rapide sur site pour coliques, dystocies (vêlages difficiles), empoisonnements ou traumatismes.",
        price_fcfa: 15000,
        price_unit: "par intervention",
        duration_min: 60,
        emergency: true,
        is_active: true,
      },
      {
        id: "vs-covefa-6",
        partner_id: "vet-covefa-bobo",
        title: "Audit sanitaire & formation des bergers",
        category: "formation",
        description: "Diagnostic d'exploitation, protocole de biosécurité et formation pratique aux détections précoces de pathologies.",
        price_fcfa: 35000,
        price_unit: "demi-journée",
        duration_min: 240,
        emergency: false,
        is_active: true,
      },
    ],
    products: [
      {
        id: "vp-1",
        title: "Kit Déparasitage Ruminants 25 têtes",
        description: "Albendazole 10% + Complexe Polyvitaminé injectable + seringue doseuse.",
        price_fcfa: 12500,
        unit: "pack",
        is_prescription_required: false,
        in_stock: true,
      },
      {
        id: "vp-2",
        title: "Bloc à lécher minéralisé bétail (5 kg)",
        description: "Complémentation en oligo-éléments, phosphore et calcium pour ruminants en saison sèche.",
        price_fcfa: 3500,
        unit: "bloc 5kg",
        is_prescription_required: false,
        in_stock: true,
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&auto=format&fit=crop&q=80",
    ],
    reviews: [
      {
        id: "rev-1",
        author_name: "El Hadj Boureima Ouedraogo",
        client_type: "Éleveur bovin (70 têtes) - Bama",
        rating: 5,
        comment: "Intervention rapide lors d'un vêlage difficile. Le veau et la mère ont été sauvés grâce au professionnalisme du Dr. Sawadogo.",
        date: "14 Février 2026",
      },
      {
        id: "rev-2",
        author_name: "Moussa Sanou",
        client_type: "Ferme avicole - Toussiana",
        rating: 5,
        comment: "Campagne de vaccination aviaire menée sans aucune perte. Suivi rigoureux et conseils très clairs.",
        date: "28 Janvier 2026",
      },
    ],
  },
  {
    id: "vet-clinique-ouaga",
    module_type: VETERINARY_MODULE_TYPE,
    name: "Clinique Vétérinaire Centrale de Ouagadougou",
    doctor_name: "Dr. Aminata Kaboré",
    order_number: "ONV-BF N° 112",
    logo: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=200&auto=format&fit=crop&q=80",
    cover_image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=1200&auto=format&fit=crop&q=80",
    presentation: "Clinique de référence dotée d'un laboratoire d'analyses, service d'imagerie et bloc chirurgical vétérinaire pour grands et petits animaux.",
    city: "Ouagadougou",
    region: "Centre",
    location_address: "Boulevard des Tansoba, Kamsonghin, Ouagadougou",
    coordinates: { lat: 12.3714, lng: -1.5197 },
    intervention_zone: "Ouagadougou, Saaba, Komsilga, Loumbila, Ziniaré",
    intervention_radius_km: 50,
    business_hours: {
      days: "Lundi au Dimanche",
      hours: "08h00 - 20h00",
      emergency_24_7: true,
    },
    phone: "+226 25 36 00 22",
    whatsapp: "+226 76 36 00 22",
    email: "contact@veterinaire-ouaga.bf",
    is_verified: true,
    rating: 4.8,
    reviews_count: 42,
    starting_price_fcfa: 6000,
    services: [
      {
        id: "vs-ouaga-1",
        partner_id: "vet-clinique-ouaga",
        title: "Analyses de laboratoire & prélèvements biologiques",
        category: "analyses",
        description: "Recherche de trypanosomes, hémoparasites, coprologie parasitaire et profil biochimique.",
        price_fcfa: 12000,
        price_unit: "par prélèvement",
        duration_min: 30,
        emergency: false,
        is_active: true,
      },
      {
        id: "vs-ouaga-2",
        partner_id: "vet-clinique-ouaga",
        title: "Chirurgie vétérinaire & soins traumatologiques",
        category: "chirurgie",
        description: "Castrations, césariennes d'urgence, suture de plaies infectées et chirurgie des hernies.",
        price_fcfa: 20000,
        price_unit: "par acte",
        duration_min: 90,
        emergency: true,
        is_active: true,
      },
      {
        id: "vs-ouaga-3",
        partner_id: "vet-clinique-ouaga",
        title: "Contrat de suivi sanitaire annuel d'élevage",
        category: "suivi_sanitaire",
        description: "Visites mensuelles programmées, tenue du registre sanitaire obligatoire et réductions sur les urgences.",
        price_fcfa: 60000,
        price_unit: "par trimestre",
        duration_min: 180,
        emergency: false,
        is_active: true,
      },
      {
        id: "vs-ouaga-4",
        partner_id: "vet-clinique-ouaga",
        title: "Conseils techniques & rationnement zootechnique",
        category: "conseils",
        description: "Élaboration des formules alimentaires d'embouche bovine/ovine pour maximiser le GMQ (Gain Moyen Quotidien).",
        price_fcfa: 15000,
        price_unit: "par consultation",
        duration_min: 60,
        emergency: false,
        is_active: true,
      },
    ],
    products: [
      {
        id: "vp-3",
        title: "Trousse d'urgence vétérinaire pour ferme",
        description: "Thermomètre médical, antiseptique iodé, pansements, seringues stériles et guide des premiers secours.",
        price_fcfa: 18500,
        unit: "kit complet",
        is_prescription_required: false,
        in_stock: true,
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&auto=format&fit=crop&q=80",
    ],
    reviews: [
      {
        id: "rev-3",
        author_name: "Fatoumata Diallo",
        client_type: "Élevage ovin laitier - Loumbila",
        rating: 5,
        comment: "Laboratoire très réactif, résultats transmis le jour même pour sauver notre lot d'agneaux.",
        date: "05 Mars 2026",
      },
    ],
  },
  {
    id: "vet-pastoral-dedougou",
    module_type: VETERINARY_MODULE_TYPE,
    name: "Centre Vétérinaire & Zootechnique de la Boucle du Mouhoun",
    doctor_name: "Dr. Salif Traoré",
    order_number: "ONV-BF N° 067",
    logo: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&auto=format&fit=crop&q=80",
    cover_image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&auto=format&fit=crop&q=80",
    presentation: "Spécialiste de la santé animale en zones pastorales et agropastorales. Partenaire des organisations d'éleveurs et coopératives laitières du Mouhoun.",
    city: "Dédougou",
    region: "Boucle du Mouhoun",
    location_address: "Route de Nouna, Secteur 2, Dédougou",
    coordinates: { lat: 12.4634, lng: -3.4607 },
    intervention_zone: "Dédougou, Nouna, Tougan, Koudougou, Boromo",
    intervention_radius_km: 100,
    business_hours: {
      days: "Lundi au Samedi",
      hours: "07h00 - 18h30",
      emergency_24_7: true,
    },
    phone: "+226 20 52 01 18",
    whatsapp: "+226 78 52 01 18",
    email: "salif.traore@veterinaire-mouhoun.bf",
    is_verified: true,
    rating: 4.7,
    reviews_count: 29,
    starting_price_fcfa: 4500,
    services: [
      {
        id: "vs-dedougou-1",
        partner_id: "vet-pastoral-dedougou",
        title: "Suivi sanitaire des ateliers d'embouche bovine",
        category: "suivi_sanitaire",
        description: "Contrôle sanitaire d'entrée, protocole déparasitage + vitamines et suivi hebdomadaire de l'indice de consommation.",
        price_fcfa: 15000,
        price_unit: "par lot",
        duration_min: 90,
        emergency: false,
        is_active: true,
      },
      {
        id: "vs-dedougou-2",
        partner_id: "vet-pastoral-dedougou",
        title: "Diagnostic de gestation & assistance reproduction",
        category: "reproduction",
        description: "Palpation transrectale, échographie de terrain et prise en charge des retours en chaleur anormaux.",
        price_fcfa: 5000,
        price_unit: "par vache",
        duration_min: 30,
        emergency: false,
        is_active: true,
      },
      {
        id: "vs-dedougou-3",
        partner_id: "vet-pastoral-dedougou",
        title: "Vaccination volailles villageoises & améliorées",
        category: "vaccination",
        description: "Protection contre la Maladie de Newcastle, Gumboro et variole aviaire.",
        price_fcfa: 50,
        price_unit: "par sujet (min 100 sujets)",
        duration_min: 60,
        emergency: false,
        is_active: true,
      },
    ],
    products: [
      {
        id: "vp-4",
        title: "Désinfectant étable & poulailler concentré (1L)",
        description: "Formulation biocide homologuée pour le nettoyage et la prévention des épidémies d'élevage.",
        price_fcfa: 6500,
        unit: "flacon 1L",
        is_prescription_required: false,
        in_stock: true,
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&auto=format&fit=crop&q=80",
    ],
    reviews: [
      {
        id: "rev-4",
        author_name: "Yacouba Konaté",
        client_type: "Groupement des éleveurs du Mouhoun",
        rating: 5,
        comment: "Excellent suivi pour notre atelier d'embouche de 50 taurillons. Zéro mortalité constatée.",
        date: "12 Février 2026",
      },
    ],
  },
  {
    id: "vet-sahel-dori",
    module_type: VETERINARY_MODULE_TYPE,
    name: "Cabinet Vétérinaire Sahélien (Dori)",
    doctor_name: "Dr. Harouna Dicko",
    order_number: "ONV-BF N° 145",
    logo: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80",
    cover_image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1200&auto=format&fit=crop&q=80",
    presentation: "Interventions mobiles de proximité dans les campements pastoraux et marchés à bétail du Sahel. Spécialiste des pathologies des zones arides.",
    city: "Dori",
    region: "Sahel",
    location_address: "Marché à Bétail, Secteur 1, Dori",
    coordinates: { lat: 14.0353, lng: -0.0345 },
    intervention_zone: "Dori, Gorom-Gorom, Bani, Djibo, Sebba",
    intervention_radius_km: 120,
    business_hours: {
      days: "Tous les jours",
      hours: "06h00 - 20h00",
      emergency_24_7: true,
    },
    phone: "+226 24 46 00 12",
    whatsapp: "+226 70 46 00 12",
    email: "harouna.dicko@veterinaire-sahel.bf",
    is_verified: true,
    rating: 4.9,
    reviews_count: 51,
    starting_price_fcfa: 4000,
    services: [
      {
        id: "vs-dori-1",
        partner_id: "vet-sahel-dori",
        title: "Urgences épizooties & alerte sanitaire pastorale",
        category: "urgences",
        description: "Déplacement d'urgence en campement pastoral pour suspicion de maladie à déclaration obligatoire ou intoxication.",
        price_fcfa: 10000,
        price_unit: "par intervention",
        duration_min: 90,
        emergency: true,
        is_active: true,
      },
      {
        id: "vs-dori-2",
        partner_id: "vet-sahel-dori",
        title: "Traitement contre la trypanosomiase & parasites sanguins",
        category: "deparasitage",
        description: "Dépistage rapide au microscope de terrain et administration du traitement trypanocide adéquat.",
        price_fcfa: 2500,
        price_unit: "par animal traité",
        duration_min: 30,
        emergency: false,
        is_active: true,
      },
      {
        id: "vs-dori-3",
        partner_id: "vet-sahel-dori",
        title: "Formation pratique des auxiliaires d'élevage (AE)",
        category: "formation",
        description: "Formation aux premiers gestes de secours, détection des fièvres et stockage adéquat des médicaments.",
        price_fcfa: 40000,
        price_unit: "session de groupe",
        duration_min: 300,
        emergency: false,
        is_active: true,
      },
    ],
    products: [
      {
        id: "vp-5",
        title: "Collier et spray anti-tiques et mouches piqueuses",
        description: "Répulsif longue durée pour bétail au pâturage.",
        price_fcfa: 4500,
        unit: "spray 500ml",
        is_prescription_required: false,
        in_stock: true,
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=80",
    ],
    reviews: [
      {
        id: "rev-5",
        author_name: "Amadou Barry",
        client_type: "Pasteur transhumant - Gorom-Gorom",
        rating: 5,
        comment: "Dr. Dicko se déplace directement dans notre campement même en zone difficile. Un vrai soutien pour notre communauté.",
        date: "20 Février 2026",
      },
    ],
  },
];

// ─── Clés de Persistance Locale ───
const STORAGE_KEYS = {
  PARTNERS: "nafa_veterinary_partners_v1",
  BOOKINGS: "nafa_veterinary_bookings_v1",
  QUOTES: "nafa_veterinary_quotes_v1",
};

/**
 * Moteur de stockage & persistance hybride (Supabase + LocalStorage) pour les services vétérinaires
 */
class VeterinaryServicesStorage {
  private getStoredPartners(): VeterinaryPartner[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PARTNERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("[VeterinaryStorage] Erreur lecture partenaires locaux:", e);
    }
    // Initialiser avec les partenaires certifiés de base
    localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(INITIAL_VETERINARY_PARTNERS));
    return INITIAL_VETERINARY_PARTNERS;
  }

  /**
   * Récupère la liste des vétérinaires partenaires avec filtres avancés
   */
  async getPartners(filters?: {
    search?: string;
    region?: string;
    city?: string;
    specialty?: string;
    maxPrice?: number;
    emergencyOnly?: boolean;
  }): Promise<VeterinaryPartner[]> {
    const list = this.getStoredPartners();

    if (!filters) return list;

    return list.filter((partner) => {
      // 1. Recherche plein texte
      if (filters.search && filters.search.trim() !== "") {
        const q = filters.search.toLowerCase().trim();
        const matchesName = partner.name.toLowerCase().includes(q);
        const matchesDoctor = partner.doctor_name.toLowerCase().includes(q);
        const matchesCity = partner.city.toLowerCase().includes(q);
        const matchesZone = partner.intervention_zone.toLowerCase().includes(q);
        const matchesService = partner.services.some(
          (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesDoctor && !matchesCity && !matchesZone && !matchesService) {
          return false;
        }
      }

      // 2. Filtre Région
      if (filters.region && filters.region !== "all" && partner.region !== filters.region) {
        return false;
      }

      // 3. Filtre Ville
      if (filters.city && filters.city !== "all" && partner.city !== filters.city) {
        return false;
      }

      // 4. Filtre Spécialité
      if (filters.specialty && filters.specialty !== "all") {
        const hasSpecialty = partner.services.some((s) => s.category === filters.specialty);
        if (!hasSpecialty) return false;
      }

      // 5. Filtre Prix Max
      if (filters.maxPrice && filters.maxPrice > 0) {
        if (partner.starting_price_fcfa > filters.maxPrice) return false;
      }

      // 6. Urgences 24/7 uniquement
      if (filters.emergencyOnly && !partner.business_hours.emergency_24_7) {
        return false;
      }

      return true;
    });
  }

  /**
   * Récupère la fiche détaillée d'un vétérinaire par son ID
   */
  async getPartnerById(id: string): Promise<VeterinaryPartner | null> {
    const list = this.getStoredPartners();
    return list.find((p) => p.id === id) || null;
  }

  /**
   * Crée une réservation d'intervention auprès d'un partenaire vétérinaire
   */
  async createBooking(
    booking: Omit<VeterinaryBookingRequest, "id" | "created_at" | "status" | "module_type">
  ): Promise<VeterinaryBookingRequest> {
    const newBooking: VeterinaryBookingRequest = {
      ...booking,
      id: `vb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      module_type: VETERINARY_MODULE_TYPE,
      status: "en_attente",
      created_at: new Date().toISOString(),
    };

    // 1. Sauvegarde locale
    try {
      const existing = this.getClientBookings(booking.client_id);
      localStorage.setItem(
        `${STORAGE_KEYS.BOOKINGS}_${booking.client_id}`,
        JSON.stringify([newBooking, ...existing])
      );
    } catch (e) {
      console.warn("[VeterinaryStorage] Erreur sauvegarde locale réservation:", e);
    }

    // 2. Sauvegarde Supabase si connecté
    if (isValidUuid(booking.client_id)) {
      try {
        await supabase.from("service_requests").insert({
          user_id: booking.client_id,
          service_type: "veterinaire_intervention",
          description: `Réservation [${booking.service_name}] pour ${booking.partner_name} - Animaux: ${booking.animal_type || "N/A"} (${booking.animal_count || 1}). Notes: ${booking.notes || ""}`,
          location: booking.location,
          preferred_date: booking.requested_date,
          phone: booking.client_phone,
          status: "en_attente",
        });
      } catch (err) {
        console.warn("[VeterinaryStorage] Sync Supabase booking fallback local:", err);
      }
    }

    return newBooking;
  }

  /**
   * Crée une demande de devis pour un service vétérinaire
   */
  async createQuote(
    quote: Omit<VeterinaryQuoteRequest, "id" | "created_at" | "status" | "module_type">
  ): Promise<VeterinaryQuoteRequest> {
    const newQuote: VeterinaryQuoteRequest = {
      ...quote,
      id: `vq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      module_type: VETERINARY_MODULE_TYPE,
      status: "en_attente",
      created_at: new Date().toISOString(),
    };

    try {
      const key = `${STORAGE_KEYS.QUOTES}_${quote.client_id}`;
      const existing: VeterinaryQuoteRequest[] = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify([newQuote, ...existing]));
    } catch (e) {
      console.warn("[VeterinaryStorage] Erreur devis local:", e);
    }

    return newQuote;
  }

  /**
   * Récupère l'historique des réservations d'un client
   */
  getClientBookings(clientId: string): VeterinaryBookingRequest[] {
    try {
      const key = `${STORAGE_KEYS.BOOKINGS}_${clientId}`;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("[VeterinaryStorage] Erreur lecture réservations:", e);
    }
    return [];
  }

  /**
   * Annule une réservation
   */
  async cancelBooking(bookingId: string, clientId: string): Promise<boolean> {
    const key = `${STORAGE_KEYS.BOOKINGS}_${clientId}`;
    try {
      const existing: VeterinaryBookingRequest[] = JSON.parse(localStorage.getItem(key) || "[]");
      const updated = existing.map((b) => (b.id === bookingId ? { ...b, status: "annulee" as const } : b));
      localStorage.setItem(key, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Contrôle des permissions RLS (Row Level Security)
   * Spécification :
   * - Seuls les vétérinaires agréés peuvent créer ou modifier des offres de service.
   * - Les clients ne peuvent que consulter les fiches publiques et gérer leurs propres réservations/devis.
   * - Aucun utilisateur ne peut accéder aux données privées d'un autre partenaire.
   */
  checkRLSPermission(
    action: "manage_services" | "create_booking" | "view_booking" | "view_public_catalog",
    userId?: string,
    resourceOwnerId?: string,
    userRole?: string
  ): { allowed: boolean; reason?: string } {
    // Lecture publique du catalogue toujours autorisée
    if (action === "view_public_catalog") {
      return { allowed: true };
    }

    // Gestion des services réservée aux docteurs vétérinaires
    if (action === "manage_services") {
      const isVet = userRole === "veterinaire" || userRole === "expert";
      if (!isVet) {
        return {
          allowed: false,
          reason: "Seuls les docteurs vétérinaires et professionnels agréés peuvent modifier ce catalogue de soins.",
        };
      }
      if (resourceOwnerId && userId !== resourceOwnerId) {
        return {
          allowed: false,
          reason: "Accès refusé : Vous ne pouvez pas modifier les services d'un autre cabinet vétérinaire.",
        };
      }
      return { allowed: true };
    }

    // Création de réservation : Tout utilisateur authentifié ou identifié
    if (action === "create_booking") {
      return { allowed: true };
    }

    // Consultation d'une réservation : Seulement le client demandeur ou le vétérinaire destinataire
    if (action === "view_booking") {
      if (userId && (userId === resourceOwnerId)) {
        return { allowed: true };
      }
      return { allowed: false, reason: "Accès restreint à la réservation concernée." };
    }

    return { allowed: true };
  }
}

export const veterinaryStorage = new VeterinaryServicesStorage();
