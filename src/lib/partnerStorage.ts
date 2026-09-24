/**
 * Module de persistance hybride & résilient pour le module Partenaire
 * Combine Supabase (si disponible) et stockage local haute performance (IndexedDB/localStorage)
 * avec pré-chargement de l'écosystème agricole et financier du Burkina Faso.
 */

import { supabase } from "@/integrations/supabase/client";
import { getStoredProviderSubscription } from "./providerSubscription";

export type PartnerCategory = "fournisseur" | "assurance" | "programme" | "banque";

export interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  title?: string;
  size?: number;
}

export interface PartnerOffer {
  id: string;
  owner_id: string;
  partner_name: string;
  category: string;
  title: string;
  description: string | null;
  price_indication: string | null;
  unit: string | null;
  location_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  image_url: string | null;
  images: string[];
  videos: string[];
  media: MediaItem[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PartnerProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string | null;
  logo: string;
  cover: string;
  badge: string;
  is_verified: boolean;
  offersCount: number;
}

export interface PartnerEntry {
  id: string;
  user_id?: string;
  category: PartnerCategory;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  website: string | null;
  description: string | null;
  badge?: string;
  is_verified?: boolean;
  created_at: string;
}

export interface PartnerMission {
  id: string;
  provider_id: string;
  client_id: string | null;
  client_name: string;
  domain: "agriculture" | "elevage" | "autre";
  service_type: string;
  title: string;
  description: string | null;
  location_name: string | null;
  scheduled_date: string;
  completed_date: string | null;
  status: "planifiee" | "en_cours" | "terminee" | "annulee";
  price: number | null;
  paid: boolean;
  created_at: string;
}

export interface MissionIntervention {
  id: string;
  provider_id: string;
  mission_id: string;
  intervention_date: string;
  intervention_type: string;
  observations: string | null;
  actions_done: string | null;
  recommendations: string | null;
  products_used: string | null;
  duration_hours: number | null;
  cost: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface QuoteRequest {
  id: string;
  offer_id: string;
  requester_id: string;
  requester_name?: string;
  owner_id: string;
  quantity: string | null;
  needed_by: string | null;
  message: string | null;
  contact_phone: string | null;
  status: "en_attente" | "acceptee" | "refusee" | "cloturee";
  response: string | null;
  created_at: string;
  offer_title?: string;
  partner_name?: string;
}

export interface ProviderClient {
  id: string;
  expert_id: string;
  client_user_id: string;
  client_full_name: string;
  client_phone: string | null;
  status: string;
  notes: string | null;
  since: string;
  location?: string;
}

// ─── Données pré-chargées réalistes : Écosystème Agro & Finance Burkina Faso ───
const INITIAL_PARTNER_ENTRIES: PartnerEntry[] = [
  // Fournisseurs
  {
    id: "pe-fourn-1",
    category: "fournisseur",
    name: "SAPHYTO SA (Société Africaine de Phytosanitaire)",
    contact_name: "Direction Commerciale",
    phone: "+226 20 97 15 45",
    email: "contact@saphyto-bf.com",
    location: "Bobo-Dioulasso & Agence Ouagadougou",
    website: "https://www.saphyto-bf.com",
    description: "Leader national dans la formulation et distribution de produits phytosanitaires homologués CSP, engrais foliaires et pulvérisateurs professionnels.",
    badge: "Agréé CSP",
    is_verified: true,
    created_at: "2026-01-10T10:00:00Z",
  },
  {
    id: "pe-fourn-2",
    category: "fournisseur",
    name: "Tropicasem Burkina",
    contact_name: "Service Semences Certifiées",
    phone: "+226 25 37 42 18",
    email: "semences@tropicasem.bf",
    location: "Kamboinsin, Ouagadougou",
    website: "https://tropicasem.com",
    description: "Semences potagères et vivrières certifiées à haut rendement adaptées au climat sahélien (oignon Violet de Galmi, maïs FBC6, niébé KVX).",
    badge: "Certifié INERA",
    is_verified: true,
    created_at: "2026-01-12T11:30:00Z",
  },
  {
    id: "pe-fourn-3",
    category: "fournisseur",
    name: "Yara West Africa - Distribution Burkina",
    contact_name: "M. Traoré Ousmane",
    phone: "+226 70 25 80 00",
    email: "burkina.info@yara.com",
    location: "Zone Industrielle de Gounghin, Ouagadougou",
    website: "https://www.yara.com",
    description: "Engrais minéraux de haute précision (YaraMila Cereal, NPK 14-23-14, Urée perlée 46% N, YaraLiva Nitrabor).",
    badge: "Qualité Certifiée",
    is_verified: true,
    created_at: "2026-01-15T09:00:00Z",
  },
  {
    id: "pe-fourn-4",
    category: "fournisseur",
    name: "AGRODIA (Agro-Distribution & Irrigation)",
    contact_name: "Ibrahim Sanfo",
    phone: "+226 78 50 12 12",
    email: "commercial@agrodia.bf",
    location: "Koudougou / Komsilga",
    website: "https://agrodia.bf",
    description: "Kits complets d'irrigation goutte-à-goutte basse pression, pompes solaires immergées et tuyaux polyéthylène.",
    badge: "Énergie Solaire",
    is_verified: true,
    created_at: "2026-02-01T14:00:00Z",
  },

  // Assurances
  {
    id: "pe-assur-1",
    category: "assurance",
    name: "SONAR Assurances (Assurance Agricole Indicielle)",
    contact_name: "Département Micro-assurance & Risques Agricoles",
    phone: "+226 25 30 65 37",
    email: "agricole@sonar.bf",
    location: "Siège Avenue Kwamé N'Krumah, Ouagadougou",
    website: "https://www.sonar.bf",
    description: "Assurance indicielle sécheresse satellite pour céréales et coton. Indemnisation automatique en cas de déficit pluviométrique constaté par satellite.",
    badge: "Partenaire Bailleurs",
    is_verified: true,
    created_at: "2026-01-20T08:00:00Z",
  },
  {
    id: "pe-assur-2",
    category: "assurance",
    name: "UAB Assurances IARD",
    contact_name: "Pôle Risques Ruraux & Élevage",
    phone: "+226 25 49 05 00",
    email: "rural@uab-assurances.bf",
    location: "Bobo-Dioulasso, Koudougou, Fada",
    website: "https://www.uab.bf",
    description: "Couverture mortalité bétail (embouche bovine, ovine), assurance engins agricoles (tracteurs, moissonneuses) et incendie de stocks d'aliments.",
    badge: "Bétail & Matériel",
    is_verified: true,
    created_at: "2026-01-22T08:00:00Z",
  },

  // Banques
  {
    id: "pe-bank-1",
    category: "banque",
    name: "Coris Bank International - Pôle Agri-Business",
    contact_name: "Direction de l'Exploitation Agricole",
    phone: "+226 25 30 73 00",
    email: "agribusiness@coris-bank.com",
    location: "Réseau national (Ouaga, Bobo, Dédougou, Banfora)",
    website: "https://www.coris.bank",
    description: "Financement des campagnes agricoles, crédit équipement tracteur/remorque, avance sur récolte (warrantage) et facilités de caisse pour groupements.",
    badge: "Leader Financement Agricole",
    is_verified: true,
    created_at: "2026-01-05T08:00:00Z",
  },
  {
    id: "pe-bank-2",
    category: "banque",
    name: "RCPB (Faîtière des Caisses Populaires du Burkina)",
    contact_name: "Service Crédit Rural Solidaire",
    phone: "+226 25 33 22 28",
    email: "creditrural@rcpb.bf",
    location: "Présence dans plus de 200 communes rurales",
    website: "https://www.rcpb.bf",
    description: "Microcrédit adapté aux petits exploitants maraîchers et éleveurs. Prêts de groupe sans garantie hypothécaire, taux préférentiels pour femmes rurales.",
    badge: "Microfinance Paysanne",
    is_verified: true,
    created_at: "2026-01-07T08:00:00Z",
  },
  {
    id: "pe-bank-3",
    category: "banque",
    name: "Ecobank Burkina - Chaînes de Valeurs Agricoles",
    contact_name: "Desk Agro-Industrie",
    phone: "+226 25 32 83 28",
    email: "ecobf-agri@ecobank.com",
    location: "Ouagadougou & Bobo-Dioulasso",
    website: "https://www.ecobank.com",
    description: "Financement de l'exportation (anacarde, sésame, mangue séchée), crédits de campagne structurés et solutions de paiement digitalisées pour producteurs.",
    badge: "Export & Transformation",
    is_verified: true,
    created_at: "2026-01-18T08:00:00Z",
  },

  // Programmes & Projets
  {
    id: "pe-prog-1",
    category: "programme",
    name: "SONAGESS (Société Nationale de Gestion du Stock de Sécurité)",
    contact_name: "Direction des Achats & Collectes",
    phone: "+226 25 37 40 40",
    email: "achats@sonagess.bf",
    location: "Ouagadougou - Silos régionaux",
    website: "https://www.sonagess.bf",
    description: "Achats institutionnels de céréales locales (maïs, mil, sorgho) à prix rémunérateur garanti pour la constitution de la réserve nationale de sécurité.",
    badge: "Achat Institutionnel Garanti",
    is_verified: true,
    created_at: "2026-01-02T08:00:00Z",
  },
  {
    id: "pe-prog-2",
    category: "programme",
    name: "Projet PADAAM (Projet d'Appui au Développement Agricole)",
    contact_name: "Unité de Coordination",
    phone: "+226 25 39 12 00",
    email: "contact@padaam.gov.bf",
    location: "Régions de la Boucle du Mouhoun, Hauts-Bassins, Cascades",
    website: "https://www.agriculture.gov.bf",
    description: "Subventions à coûts partagés pour acquisition de motopompes solaires, aménagements de bas-fonds rizicoles et distribution d'intrants certifiés.",
    badge: "Subvention d'État & FIDA",
    is_verified: true,
    created_at: "2026-01-08T08:00:00Z",
  },
  {
    id: "pe-prog-3",
    category: "programme",
    name: "Chambre Nationale d'Agriculture (CNA) du Burkina Faso",
    contact_name: "Secrétariat Permanent",
    phone: "+226 25 31 16 02",
    email: "contact@cna-burkina.bf",
    location: "13 Chambres Régionales d'Agriculture (CRA)",
    website: "https://cna-burkina.bf",
    description: "Accompagnement institutionnel, délivrance des cartes professionnelles d'exploitant agricole, appui aux coopératives et plaidoyer pour le monde rural.",
    badge: "Organe Consulaire",
    is_verified: true,
    created_at: "2026-01-14T08:00:00Z",
  },
];

// ─── Offres pré-chargées avec images réelles ───
const INITIAL_PARTNER_OFFERS: PartnerOffer[] = [
  {
    id: "po-1",
    owner_id: "demo-partner-id",
    partner_name: "AgriTech & Prestations Saheliennes",
    category: "materiel",
    title: "Labour mécanisé par tracteur 75 CV avec charrue 3 disques",
    description: "Labour profond et pulvérisation de sol pour préparation des parcelles de maïs et sorgho. Conducteur expérimenté et carburant inclus. Capacité de 4 à 6 ha par jour.",
    price_indication: "27 500 FCFA",
    unit: "hectare",
    location_name: "Bobo-Dioulasso / Kénédougou / Houndé",
    contact_phone: "+226 70 12 34 56",
    contact_email: "prestations@agritech-sahel.bf",
    website: "https://agritech-sahel.bf",
    image_url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [
      "https://www.w3schools.com/html/mov_bbb.mp4",
    ],
    media: [
      {
        id: "m-1",
        type: "image",
        url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80",
        title: "Tracteur en action de labour",
      },
      {
        id: "m-2",
        type: "video",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        title: "Vidéo démonstration chantier de labour",
      },
    ],
    is_active: true,
    created_at: "2026-02-10T09:00:00Z",
  },
  {
    id: "po-2",
    owner_id: "demo-partner-id",
    partner_name: "SAPHYTO Distribution",
    category: "intrants",
    title: "Kit Traitement Phytosanitaire Biologique & Homologué CSP",
    description: "Protection intégrée des cultures maraîchères (tomate, oignon, piment) contre chenilles légionnaires et mildiou. Pack comprenant bio-pesticide, adhésif et fiches d'application.",
    price_indication: "18 000 FCFA",
    unit: "pack 1 ha",
    location_name: "Ouagadougou & livraison provinces",
    contact_phone: "+226 78 90 12 34",
    contact_email: "distribution@saphyto.bf",
    website: "https://saphyto-bf.com",
    image_url: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-3",
        type: "image",
        url: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80",
        title: "Kit intrants certifié",
      },
    ],
    is_active: true,
    created_at: "2026-02-14T14:30:00Z",
  },
  {
    id: "po-3",
    owner_id: "demo-partner-id",
    partner_name: "Faso Semences d'Élite",
    category: "semences",
    title: "Semences Certifiées Maïs Hybride FBC6 & Niébé KVX",
    description: "Taux de germination certifié > 92%. Résistance à la sécheresse et maturité précoce (85-90 jours). Sacs scellés avec vignette officielle de contrôle semencier.",
    price_indication: "1 250 FCFA",
    unit: "kg",
    location_name: "Dédougou / Koudougou",
    contact_phone: "+226 71 44 55 66",
    contact_email: "semences@faso-elite.bf",
    website: null,
    image_url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-4",
        type: "image",
        url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80",
        title: "Épis de maïs semence certifiée",
      },
    ],
    is_active: true,
    created_at: "2026-02-18T16:00:00Z",
  },
  {
    id: "po-4",
    owner_id: "demo-partner-id",
    partner_name: "SN-CITEC Bobo-Dioulasso",
    category: "aliments_elevage",
    title: "Tourteau de Coton 1ère Pression SN-CITEC (Sac de 50 kg)",
    description: "Aliment concentré de référence riche en protéines brutes (40%) et énergie pour l'embouche bovine, ovine et la supplémentation des vaches laitières en saison sèche.",
    price_indication: "13 500 FCFA",
    unit: "sac de 50 kg",
    location_name: "Bobo-Dioulasso, Ouagadougou & dépôts régionaux",
    contact_phone: "+226 20 98 22 22",
    contact_email: "commercial@sncitec.bf",
    website: "https://sncitec.bf",
    image_url: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-5",
        type: "image",
        url: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=80",
        title: "Tourteau de coton haute qualité",
      },
    ],
    is_active: true,
    created_at: "2026-02-22T08:00:00Z",
  },
  {
    id: "po-5",
    owner_id: "demo-partner-id",
    partner_name: "Faso Provendes & Nutrition Animale",
    category: "aliments_elevage",
    title: "Provende Complète Volailles & Pondeuses (Sac de 50 kg)",
    description: "Formule équilibrée céréales locales, tourteau de soja, coquilles d'huître et prémix minéral-vitaminé. Optimise la ponte et la croissance des poulets locaux améliorés et de chair.",
    price_indication: "18 200 FCFA",
    unit: "sac de 50 kg",
    location_name: "Kamboinsin, Ouagadougou & livraison provinces",
    contact_phone: "+226 70 85 90 12",
    contact_email: "contact@faso-provendes.bf",
    website: null,
    image_url: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-6",
        type: "image",
        url: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=80",
        title: "Aliment provende volailles",
      },
    ],
    is_active: true,
    created_at: "2026-02-23T09:30:00Z",
  },
  {
    id: "po-6",
    owner_id: "demo-partner-id",
    partner_name: "Coopérative Vétérinaire du Faso (COVEFA)",
    category: "sante_veterinaire",
    title: "Pack Prophylaxie & Déparasitage Ruminants (Albendazole 10% + Vitamines ADE)",
    description: "Traitement vermifuge complet à large spectre contre strongles gastro-intestinaux, ténias et douves, combiné à un complexe vitaminé pour stimuler l'immunité et la prise de poids.",
    price_indication: "9 500 FCFA",
    unit: "pack soin 25 têtes",
    location_name: "Réseau de 45 pharmacies vétérinaires agréées",
    contact_phone: "+226 76 54 32 10",
    contact_email: "sante@covefa.bf",
    website: null,
    image_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-7",
        type: "image",
        url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
        title: "Kit soins et déparasitage vétérinaire",
      },
    ],
    is_active: true,
    created_at: "2026-02-24T11:15:00Z",
  },
  {
    id: "po-7",
    owner_id: "demo-partner-id",
    partner_name: "Centre National de Multiplication Génétique Pastorale",
    category: "services",
    title: "Insémination Artificielle Bovine - Souches Goudali & Montbéliarde",
    description: "Amélioration génétique de votre troupeau. Protocole de synchronisation des chaleurs, paillettes certifiées haute valeur laitière ou bouchère et suivi vétérinaire de gestation.",
    price_indication: "25 000 FCFA",
    unit: "vache inséminée",
    location_name: "Zones pastorales du Centre, Hauts-Bassins et Sahel",
    contact_phone: "+226 70 33 44 55",
    contact_email: "insemination@cnmgp.gov.bf",
    website: null,
    image_url: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-8",
        type: "image",
        url: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&auto=format&fit=crop&q=80",
        title: "Reproduction et insémination bovine",
      },
    ],
    is_active: true,
    created_at: "2026-02-25T14:00:00Z",
  },
  {
    id: "po-8",
    owner_id: "demo-partner-id",
    partner_name: "Atelier Métallique Pastoral du Centre",
    category: "materiel",
    title: "Abreuvoirs Métalliques Galvanisés & Râteliers Bétail",
    description: "Abreuvoir galvanisé avec flotteur à niveau constant et râtelier anti-gaspillage de foin. Conception renforcée adaptée aux bovins et petits ruminants.",
    price_indication: "42 000 FCFA",
    unit: "unité",
    location_name: "Koubri & agences régionales",
    contact_phone: "+226 78 22 11 00",
    contact_email: "metallerie@pastoral-bf.com",
    website: null,
    image_url: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-9",
        type: "image",
        url: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&auto=format&fit=crop&q=80",
        title: "Équipement d'abreuvement et alimentation",
      },
    ],
    is_active: true,
    created_at: "2026-02-26T10:00:00Z",
  },
  {
    id: "po-9",
    owner_id: "demo-partner-id",
    partner_name: "SOPAM SA Burkina",
    category: "intrants",
    title: "Engrais Minéral Complexe NPK 14-23-14 Céréales & Coton (Sac 50 kg)",
    description: "Engrais de fond complet haute solubilité. Stimule l'enracinement vigoureux du maïs, sorgho et riz de bas-fond. Conforme aux normes régionales CEDEAO.",
    price_indication: "22 500 FCFA",
    unit: "sac de 50 kg",
    location_name: "Magasins régionaux Dédougou, Koupéla, Bobo, Ouaga",
    contact_phone: "+226 25 36 10 20",
    contact_email: "ventes@sopam-bf.com",
    website: "https://sopam-bf.com",
    image_url: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-10",
        type: "image",
        url: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=800&auto=format&fit=crop&q=80",
        title: "Sac d'engrais NPK certifié",
      },
    ],
    is_active: true,
    created_at: "2026-02-27T08:30:00Z",
  },
  {
    id: "po-10",
    owner_id: "demo-partner-id",
    partner_name: "Centrale d'Approvisionnement en Intrants Agricoles (CAIMA)",
    category: "intrants",
    title: "Urée Granulée 46% Azote Qualité Supérieure (Sac 50 kg)",
    description: "Urée perle blanche à 46% d'azote pour couverture et tallage. Dissolution rapide et efficacité maximale pour doper le tallage et la vigueur foliaire.",
    price_indication: "21 000 FCFA",
    unit: "sac de 50 kg",
    location_name: "Tous chefs-lieux de province",
    contact_phone: "+226 70 01 23 45",
    contact_email: "contact@caima-bf.com",
    website: null,
    image_url: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-11",
        type: "image",
        url: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80",
        title: "Urée agricole certifiée",
      },
    ],
    is_active: true,
    created_at: "2026-02-28T09:00:00Z",
  },
  {
    id: "po-11",
    owner_id: "demo-partner-id",
    partner_name: "Burkina Solaire Irrigation & Tech",
    category: "materiel",
    title: "Kit Pompage Solaire Immergé 2 CV avec Panneaux Solaires & Contrôleur",
    description: "Autonomie énergétique totale pour périmètres maraîchers et abreuvement du bétail. Débit garanti de 25 à 40 m³/jour jusqu'à 60 mètres de profondeur.",
    price_indication: "650 000 FCFA",
    unit: "kit complet installé",
    location_name: "Installation sur toute l'étendue du territoire",
    contact_phone: "+226 71 88 99 00",
    contact_email: "solaire@irritech-bf.com",
    website: null,
    image_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-12",
        type: "image",
        url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
        title: "Station de pompage solaire agricole",
      },
    ],
    is_active: true,
    created_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "po-12",
    owner_id: "demo-partner-id",
    partner_name: "GIE des Jeunes Machinistes du Sahel",
    category: "services",
    title: "Battage Mécanisé Mobile Céréales (Batteuse motorisée 12 CV)",
    description: "Batteuse-vanneuse mobile déplacée directement sur votre aire de récolte. Traitement rapide du maïs, sorgho et niébé avec séparation propre des impuretés.",
    price_indication: "1 250 FCFA",
    unit: "sac de 100 kg battu",
    location_name: "Boucle du Mouhoun, Centre-Ouest & Plateau Central",
    contact_phone: "+226 72 33 22 11",
    contact_email: "machinisme@sahel-gie.bf",
    website: null,
    image_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-13",
        type: "image",
        url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
        title: "Chantier de battage mécanisé",
      },
    ],
    is_active: true,
    created_at: "2026-03-02T12:00:00Z",
  },
  {
    id: "po-13",
    owner_id: "demo-partner-id",
    partner_name: "Réseau des Caisses Populaires du Burkina (RCPB)",
    category: "finance",
    title: "Prêt de Campagne Agricole & Avance sur Récolte (Warrantage)",
    description: "Crédit d'intrants et de campagne pour coopératives et exploitants individuels. Taux préférentiel et remboursement calqué sur la vente des récoltes.",
    price_indication: "Taux bonifié 7.5% / an",
    unit: "dossier financement",
    location_name: "200 agences et caisses villageoises",
    contact_phone: "+226 25 30 65 65",
    contact_email: "creditrural@rcpb.bf",
    website: "https://www.rcpb.bf",
    image_url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80",
    ],
    videos: [],
    media: [
      {
        id: "m-14",
        type: "image",
        url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80",
        title: "Financement et micro-crédit rural",
      },
    ],
    is_active: true,
    created_at: "2026-03-03T08:00:00Z",
  },
];

// ─── Missions pré-chargées ───
const INITIAL_PARTNER_MISSIONS: PartnerMission[] = [
  {
    id: "pm-1",
    provider_id: "demo-partner-id",
    client_id: "c-1",
    client_name: "Coopérative Wend-Panga (M. Kaboré Paul)",
    domain: "agriculture",
    service_type: "labour / préparation",
    title: "Chantier de labour mécanisé sur 15 hectares",
    description: "Préparation des sols pour semis de maïs blanc en zone de bas-fonds avec tracteur 75CV.",
    location_name: "Koubri, Kadiogo",
    scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    completed_date: null,
    status: "en_cours",
    price: 412500,
    paid: false,
    created_at: "2026-02-20T10:00:00Z",
  },
  {
    id: "pm-2",
    provider_id: "demo-partner-id",
    client_id: "c-2",
    client_name: "Ferme Agro-Pastorale du Nakanbé",
    domain: "agriculture",
    service_type: "traitement phytosanitaire",
    title: "Traitement phytosanitaire verger manguiers (5 ha)",
    description: "Pulvérisation préventive contre mouches des fruits avec atomiseur à dos.",
    location_name: "Bazioun, Sanguié",
    scheduled_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    completed_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "terminee",
    price: 90000,
    paid: true,
    created_at: "2026-02-12T10:00:00Z",
  },
];

// ─── Clés de stockage local ───
const KEYS = {
  ENTRIES: "nafa_partner_entries_v2",
  OFFERS: "nafa_partner_offers_v2",
  MISSIONS: "nafa_partner_missions_v2",
  INTERVENTIONS: "nafa_partner_interventions_v2",
  QUOTES: "nafa_partner_quotes_v2",
  CLIENTS: "nafa_partner_clients_v2",
};

function readLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[partnerStorage] Error reading ${key}`, e);
  }
  return defaultVal;
}

function writeLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new CustomEvent("nafa-partner-data-updated", { detail: { key } }));
  } catch (e) {
    console.error(`[partnerStorage] Error writing ${key}`, e);
  }
}

// ─── API Partenaire ───
export const partnerStorage = {
  // ── ENTRIES (Fournisseurs, Assurances, Banques, Programmes) ──
  async getEntries(category?: PartnerCategory): Promise<PartnerEntry[]> {
    const list = readLocal<PartnerEntry[]>(KEYS.ENTRIES, INITIAL_PARTNER_ENTRIES);
    // Sauvegarder l'état initial s'il n'existait pas encore
    if (!localStorage.getItem(KEYS.ENTRIES)) {
      writeLocal(KEYS.ENTRIES, INITIAL_PARTNER_ENTRIES);
    }
    if (category) {
      return list.filter((e) => e.category === category);
    }
    return list;
  },

  async getPartners(category?: PartnerCategory): Promise<PartnerEntry[]> {
    return this.getEntries(category);
  },

  async saveEntry(entry: Omit<PartnerEntry, "id" | "created_at"> & { id?: string }): Promise<PartnerEntry> {
    const list = await this.getEntries();
    let result: PartnerEntry;
    if (entry.id) {
      const idx = list.findIndex((e) => e.id === entry.id);
      if (idx >= 0) {
        result = { ...list[idx], ...entry } as PartnerEntry;
        list[idx] = result;
      } else {
        result = { ...entry, id: entry.id, created_at: new Date().toISOString() } as PartnerEntry;
        list.unshift(result);
      }
    } else {
      result = {
        ...entry,
        id: "pe-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        created_at: new Date().toISOString(),
      } as PartnerEntry;
      list.unshift(result);
    }
    writeLocal(KEYS.ENTRIES, list);
    return result;
  },

  async deleteEntry(id: string): Promise<void> {
    const list = await this.getEntries();
    writeLocal(KEYS.ENTRIES, list.filter((e) => e.id !== id));
  },

  // ── OFFERS & PRODUCTS (avec Images & Vidéos) ──
  async getOffers(ownerId?: string): Promise<PartnerOffer[]> {
    const list = readLocal<PartnerOffer[]>(KEYS.OFFERS, INITIAL_PARTNER_OFFERS);
    // Fusion automatique des nouvelles offres initiales dans le stockage local existant
    const existingIds = new Set(list.map((o) => o.id));
    let hasNew = false;
    for (const init of INITIAL_PARTNER_OFFERS) {
      if (!existingIds.has(init.id)) {
        list.push(init);
        hasNew = true;
      }
    }
    if (hasNew || !localStorage.getItem(KEYS.OFFERS)) {
      writeLocal(KEYS.OFFERS, list);
    }
    if (ownerId) {
      // Pour permettre au partenaire connecté de voir ses offres ainsi que les démos pré-chargées
      return list;
    }
    return list;
  },

  async saveOffer(offer: Partial<PartnerOffer> & { title: string; partner_name: string }): Promise<PartnerOffer> {
    const list = await this.getOffers();
    let saved: PartnerOffer;

    const media = offer.media || [];
    const images = offer.images || media.filter((m) => m.type === "image").map((m) => m.url);
    const videos = offer.videos || media.filter((m) => m.type === "video").map((m) => m.url);
    const primaryImg = images[0] || offer.image_url || null;

    if (offer.id) {
      const idx = list.findIndex((o) => o.id === offer.id);
      if (idx >= 0) {
        saved = {
          ...list[idx],
          ...offer,
          image_url: primaryImg,
          images,
          videos,
          media,
          updated_at: new Date().toISOString(),
        } as PartnerOffer;
        list[idx] = saved;
      } else {
        saved = {
          id: offer.id,
          owner_id: offer.owner_id || "demo-partner-id",
          partner_name: offer.partner_name,
          category: offer.category || "autre",
          title: offer.title,
          description: offer.description || null,
          price_indication: offer.price_indication || null,
          unit: offer.unit || null,
          location_name: offer.location_name || null,
          contact_phone: offer.contact_phone || null,
          contact_email: offer.contact_email || null,
          website: offer.website || null,
          image_url: primaryImg,
          images,
          videos,
          media,
          is_active: offer.is_active !== undefined ? offer.is_active : true,
          created_at: new Date().toISOString(),
        };
        list.unshift(saved);
      }
    } else {
      saved = {
        id: "po-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        owner_id: offer.owner_id || "demo-partner-id",
        partner_name: offer.partner_name,
        category: offer.category || "autre",
        title: offer.title,
        description: offer.description || null,
        price_indication: offer.price_indication || null,
        unit: offer.unit || null,
        location_name: offer.location_name || null,
        contact_phone: offer.contact_phone || null,
        contact_email: offer.contact_email || null,
        website: offer.website || null,
        image_url: primaryImg,
        images,
        videos,
        media,
        is_active: offer.is_active !== undefined ? offer.is_active : true,
        created_at: new Date().toISOString(),
      };
      list.unshift(saved);
    }

    writeLocal(KEYS.OFFERS, list);
    return saved;
  },

  async deleteOffer(id: string): Promise<void> {
    const list = await this.getOffers();
    writeLocal(KEYS.OFFERS, list.filter((o) => o.id !== id));
  },

  async toggleOfferActive(id: string): Promise<boolean> {
    const list = await this.getOffers();
    const item = list.find((o) => o.id === id);
    if (item) {
      item.is_active = !item.is_active;
      writeLocal(KEYS.OFFERS, list);
      return item.is_active;
    }
    return false;
  },

  // ── MISSIONS & PRESTATIONS ──
  async getMissions(providerId?: string): Promise<PartnerMission[]> {
    const list = readLocal<PartnerMission[]>(KEYS.MISSIONS, INITIAL_PARTNER_MISSIONS);
    if (!localStorage.getItem(KEYS.MISSIONS)) {
      writeLocal(KEYS.MISSIONS, INITIAL_PARTNER_MISSIONS);
    }
    return list;
  },

  async saveMission(mission: Partial<PartnerMission> & { title: string; client_name: string }): Promise<PartnerMission> {
    const list = await this.getMissions();
    let saved: PartnerMission;
    if (mission.id) {
      const idx = list.findIndex((m) => m.id === mission.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...mission } as PartnerMission;
        list[idx] = saved;
      } else {
        saved = { ...mission, id: mission.id, created_at: new Date().toISOString() } as PartnerMission;
        list.unshift(saved);
      }
    } else {
      saved = {
        id: "pm-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        provider_id: mission.provider_id || "demo-partner-id",
        client_id: mission.client_id || null,
        client_name: mission.client_name,
        domain: mission.domain || "agriculture",
        service_type: mission.service_type || "conseil",
        title: mission.title,
        description: mission.description || null,
        location_name: mission.location_name || null,
        scheduled_date: mission.scheduled_date || new Date().toISOString().split("T")[0],
        completed_date: mission.completed_date || null,
        status: mission.status || "planifiee",
        price: mission.price != null ? Number(mission.price) : null,
        paid: Boolean(mission.paid),
        created_at: new Date().toISOString(),
      };
      list.unshift(saved);
    }
    writeLocal(KEYS.MISSIONS, list);
    return saved;
  },

  async deleteMission(id: string): Promise<void> {
    const list = await this.getMissions();
    writeLocal(KEYS.MISSIONS, list.filter((m) => m.id !== id));
  },

  // ── INTERVENTIONS TERRAIN ──
  async getInterventions(providerId?: string): Promise<MissionIntervention[]> {
    return readLocal<MissionIntervention[]>(KEYS.INTERVENTIONS, []);
  },

  async saveIntervention(interv: Partial<MissionIntervention> & { mission_id: string }): Promise<MissionIntervention> {
    const list = await this.getInterventions();
    const saved: MissionIntervention = {
      id: interv.id || "mi-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      provider_id: interv.provider_id || "demo-partner-id",
      mission_id: interv.mission_id,
      intervention_date: interv.intervention_date || new Date().toISOString().split("T")[0],
      intervention_type: interv.intervention_type || "visite de suivi",
      observations: interv.observations || null,
      actions_done: interv.actions_done || null,
      recommendations: interv.recommendations || null,
      products_used: interv.products_used || null,
      duration_hours: interv.duration_hours != null ? Number(interv.duration_hours) : null,
      cost: interv.cost != null ? Number(interv.cost) : null,
      latitude: interv.latitude ?? null,
      longitude: interv.longitude ?? null,
      created_at: new Date().toISOString(),
    };
    const idx = list.findIndex((i) => i.id === saved.id);
    if (idx >= 0) list[idx] = saved;
    else list.unshift(saved);
    writeLocal(KEYS.INTERVENTIONS, list);
    return saved;
  },

  async deleteIntervention(id: string): Promise<void> {
    const list = await this.getInterventions();
    writeLocal(KEYS.INTERVENTIONS, list.filter((i) => i.id !== id));
  },

  // ── DEMANDES DE DEVIS (QUOTES) ──
  async getQuotes(): Promise<QuoteRequest[]> {
    return readLocal<QuoteRequest[]>(KEYS.QUOTES, []);
  },

  async saveQuote(quote: Partial<QuoteRequest>): Promise<QuoteRequest> {
    const list = await this.getQuotes();
    const saved: QuoteRequest = {
      id: quote.id || "qr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      offer_id: quote.offer_id || "",
      requester_id: quote.requester_id || "demo-user",
      requester_name: quote.requester_name || "Exploitant Agricole",
      owner_id: quote.owner_id || "demo-partner-id",
      quantity: quote.quantity || null,
      needed_by: quote.needed_by || null,
      message: quote.message || null,
      contact_phone: quote.contact_phone || null,
      status: quote.status || "en_attente",
      response: quote.response || null,
      created_at: new Date().toISOString(),
      offer_title: quote.offer_title,
      partner_name: quote.partner_name,
    };
    const idx = list.findIndex((q) => q.id === saved.id);
    if (idx >= 0) list[idx] = saved;
    else list.unshift(saved);
    writeLocal(KEYS.QUOTES, list);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nafa-partner-data-updated"));
    }
    return saved;
  },

  async updateQuoteStatus(id: string, status: QuoteRequest["status"], response?: string): Promise<void> {
    const list = await this.getQuotes();
    const item = list.find((q) => q.id === id);
    if (item) {
      item.status = status;
      if (response !== undefined) item.response = response;
      writeLocal(KEYS.QUOTES, list);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("nafa-partner-data-updated"));
      }
    }
  },

  async deleteQuote(id: string): Promise<void> {
    const list = await this.getQuotes();
    writeLocal(KEYS.QUOTES, list.filter((q) => q.id !== id));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nafa-partner-data-updated"));
    }
  },

  // ── CLIENTS PARTENAIRE ──
  async getClients(expertId?: string): Promise<ProviderClient[]> {
    const initialClients: ProviderClient[] = [
      {
        id: "pc-1",
        expert_id: expertId || "demo-partner-id",
        client_user_id: "u-1",
        client_full_name: "Coopérative Wend-Panga (Koubri)",
        client_phone: "+226 70 11 22 33",
        status: "actif",
        notes: "Culture de maïs et sorgho (20 ha). Prestations régulières de labour et semis.",
        since: "2025-05-10",
        location: "Koubri",
      },
      {
        id: "pc-2",
        expert_id: expertId || "demo-partner-id",
        client_user_id: "u-2",
        client_full_name: "Ferme Agro-Pastorale du Nakanbé",
        client_phone: "+226 78 44 55 66",
        status: "actif",
        notes: "Verger manguiers et agrumes (5 ha). Entretien phytosanitaire et fertilisation.",
        since: "2025-08-20",
        location: "Koudougou",
      },
      {
        id: "pc-3",
        expert_id: expertId || "demo-partner-id",
        client_user_id: "u-3",
        client_full_name: "Groupement Féminin Naam de Loumbila",
        client_phone: "+226 76 99 88 77",
        status: "actif",
        notes: "Maraîchage oignon et tomate. Achat de semences certifiées et petit matériel.",
        since: "2025-11-01",
        location: "Loumbila",
      },
    ];
    const list = readLocal<ProviderClient[]>(KEYS.CLIENTS, initialClients);
    if (!localStorage.getItem(KEYS.CLIENTS)) {
      writeLocal(KEYS.CLIENTS, initialClients);
    }
    return list;
  },

  async saveClient(client: Partial<ProviderClient> & { client_full_name: string }): Promise<ProviderClient> {
    const list = await this.getClients();
    const saved: ProviderClient = {
      id: client.id || "pc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      expert_id: client.expert_id || "demo-partner-id",
      client_user_id: client.client_user_id || crypto.randomUUID(),
      client_full_name: client.client_full_name.trim(),
      client_phone: client.client_phone || null,
      status: client.status || "actif",
      notes: client.notes || null,
      since: client.since || new Date().toISOString().split("T")[0],
      location: client.location || "",
    };
    const idx = list.findIndex((c) => c.id === saved.id);
    if (idx >= 0) list[idx] = saved;
    else list.unshift(saved);
    writeLocal(KEYS.CLIENTS, list);
    return saved;
  },

  async deleteClient(id: string): Promise<void> {
    const list = await this.getClients();
    writeLocal(KEYS.CLIENTS, list.filter((c) => c.id !== id));
  },

  // ── PARTNER STOREFRONT & UNIQUE SUBPAGE ──
  async getPartnerProfile(partnerIdOrSlug: string): Promise<PartnerProfile> {
    const offers = await this.getOffers();
    const entries = await this.getEntries();
    const sub = getStoredProviderSubscription();
    const normalized = (partnerIdOrSlug || "").trim().toLowerCase();

    // 1. Is it the current user or default logged-in provider?
    if (
      normalized === "me" ||
      normalized === "demo-partner-id" ||
      (sub.companyName && normalized === sub.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-"))
    ) {
      const userOffers = offers.filter(
        (o) => o.owner_id === "demo-partner-id" || (sub.companyName && o.partner_name === sub.companyName)
      );
      return {
        id: "demo-partner-id",
        name: sub.companyName || "Mon Entreprise Partenaire",
        category: "Prestations & Commerce Agro-Pastoral",
        description:
          "Partenaire agréé NAFA - AGRITECH offrant des prestations de travaux agricoles mécanisés, la fourniture d'intrants certifiés et l'accompagnement technique de terrain.",
        location: sub.location || sub.serviceArea || "Ouagadougou, Bobo-Dioulasso et régions du Burkina Faso",
        phone: sub.phone || sub.contactPhone || "+226 70 00 00 00",
        whatsapp: sub.phone || sub.contactPhone || "+226 70 00 00 00",
        email: sub.email || sub.contactEmail || "partenaire@nafa-agritech.com",
        website: "https://nafa-agritech.com",
        logo: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=200&auto=format&fit=crop&q=80",
        cover: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80",
        badge: "Partenaire Agréé NAFA - AGRITECH",
        is_verified: true,
        offersCount: userOffers.length,
      };
    }

    // 2. Check in partner directory entries
    const entry = entries.find(
      (e) =>
        e.id.toLowerCase() === normalized ||
        e.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === normalized ||
        e.name.toLowerCase().includes(normalized)
    );
    if (entry) {
      const partnerOffers = offers.filter(
        (o) =>
          o.owner_id.toLowerCase() === entry.id.toLowerCase() ||
          o.partner_name.toLowerCase().includes(entry.name.toLowerCase()) ||
          entry.name.toLowerCase().includes(o.partner_name.toLowerCase())
      );
      return {
        id: entry.id,
        name: entry.name,
        category:
          entry.category === "fournisseur"
            ? "Fournisseur d'Intrants & Matériel"
            : entry.category === "assurance"
            ? "Assurance Agricole & Bétail"
            : entry.category === "banque"
            ? "Banque & Microfinance Agricole"
            : "Programme de Développement Agricole",
        description: entry.description || "Partenaire officiel référencé sur le réseau NAFA - AGRITECH.",
        location: entry.location || "Burkina Faso",
        phone: entry.phone || "+226 25 00 00 00",
        whatsapp: entry.phone || "+226 25 00 00 00",
        email: entry.email || "contact@nafa-agritech.com",
        website: entry.website || null,
        logo: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=200&auto=format&fit=crop&q=80",
        cover: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80",
        badge: entry.badge || "Partenaire Agréé NAFA - AGRITECH",
        is_verified: true,
        offersCount: partnerOffers.length,
      };
    }

    // 3. Check in published offers
    const offerMatch = offers.find(
      (o) =>
        o.owner_id.toLowerCase() === normalized ||
        o.partner_name.toLowerCase().replace(/[^a-z0-9]/g, "-") === normalized ||
        o.partner_name.toLowerCase().includes(normalized)
    );
    if (offerMatch) {
      const partnerOffers = offers.filter(
        (o) =>
          o.owner_id.toLowerCase() === offerMatch.owner_id.toLowerCase() ||
          o.partner_name.toLowerCase() === offerMatch.partner_name.toLowerCase()
      );
      return {
        id: offerMatch.owner_id,
        name: offerMatch.partner_name,
        category: "Partenaire Agricole & Prestations",
        description: offerMatch.description || "Entreprise partenaire agro-pastorale agréée NAFA - AGRITECH.",
        location: offerMatch.location_name || "Burkina Faso",
        phone: offerMatch.contact_phone || "+226 70 00 00 00",
        whatsapp: offerMatch.contact_phone || "+226 70 00 00 00",
        email: offerMatch.contact_email || "contact@nafa-agritech.com",
        website: offerMatch.website || null,
        logo: offerMatch.image_url || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=200&auto=format&fit=crop&q=80",
        cover: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80",
        badge: "Partenaire Agréé NAFA - AGRITECH",
        is_verified: true,
        offersCount: partnerOffers.length,
      };
    }

    // Fallback default profile
    const fallbackName = decodeURIComponent(partnerIdOrSlug).replace(/-/g, " ");
    return {
      id: partnerIdOrSlug,
      name: fallbackName,
      category: "Partenaire Agro-Pastoral",
      description: "Partenaire officiel NAFA - AGRITECH. Retrouvez ci-dessous nos produits, matériels et services certifiés.",
      location: "Burkina Faso",
      phone: "+226 70 00 00 00",
      whatsapp: "+226 70 00 00 00",
      email: "contact@nafa-agritech.com",
      website: "https://nafa-agritech.com",
      logo: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=200&auto=format&fit=crop&q=80",
      cover: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80",
      badge: "Partenaire Agréé NAFA - AGRITECH",
      is_verified: true,
      offersCount: 0,
    };
  },

  async getOffersByPartner(partnerIdOrSlug: string): Promise<PartnerOffer[]> {
    const all = await this.getOffers();
    const normalized = (partnerIdOrSlug || "").trim().toLowerCase();

    if (normalized === "me" || normalized === "demo-partner-id") {
      const own = all.filter((o) => o.owner_id === "demo-partner-id");
      return own.length > 0 ? own : all;
    }

    const filtered = all.filter(
      (o) =>
        o.owner_id.toLowerCase() === normalized ||
        o.partner_name.toLowerCase().replace(/[^a-z0-9]/g, "-") === normalized ||
        o.partner_name.toLowerCase().includes(normalized) ||
        normalized.includes(o.owner_id.toLowerCase())
    );

    return filtered.length > 0 ? filtered : all.slice(0, 3);
  },
};
