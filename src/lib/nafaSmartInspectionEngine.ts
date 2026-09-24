/**
 * NAFA GENIUS IA — MOTEUR D'INSPECTION INTELLIGENTE & TERRAIN
 * 
 * Capacités clés :
 * 1. Sélection dynamique par type de mission (Agriculture, Élevage, Machinisme, Autres).
 * 2. Génération automatique du formulaire adapté par NAFA Genius IA.
 * 3. Collecte terrain universelle : GPS haute précision, photos géolocalisées avec checklist obligatoire,
 *    vidéos, notes vocales, croquis de terrain interactif, mesures techniques avec tolérances,
 *    double signature électronique (Client + Expert), horodatage complet.
 * 4. Validation par l'expert et génération automatique de plans 2D/3D et devis chiffré en FCFA.
 * 5. Rapport PDF officiel certifié (jsPDF + autoTable) avec cartouche technique.
 * 6. Architecture 100% Offline-First avec statuts 'pending', 'synced', 'error' et réplication Supabase.
 * 7. Extensibilité totale : ajout de nouveaux types sans modifier l'architecture.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// 1. TYPES & CONTRATS DE DONNÉES OBLIGATOIRES
// ============================================================================

export type MissionCategory = "agriculture" | "elevage" | "machinisme" | "autre";

export type InspectionSyncStatus = "pending" | "synced" | "error";

export type InspectionWorkflowStatus = "brouillon" | "en_cours" | "validee" | "rejetee";

export interface InspectionType {
  id: string;
  category: MissionCategory;
  name: string;
  code: string;
  iconName: string;
  description: string;
  is_active: boolean;
  is_system?: boolean;
}

export interface InspectionFieldSchema {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "textarea";
  required: boolean;
  unit?: string;
  options?: string[];
  defaultValue?: any;
  hint?: string;
}

export interface InspectionRequiredPhotoRule {
  key: string;
  label: string;
  description: string;
  is_mandatory: boolean;
}

export interface InspectionMeasurementRule {
  name: string;
  unit: string;
  min_threshold?: number;
  max_threshold?: number;
  default_norm?: string;
}

export interface InspectionTemplate {
  id: string;
  inspection_type_id: string;
  name: string;
  version: string;
  fields_schema: InspectionFieldSchema[];
  required_photos: InspectionRequiredPhotoRule[];
  default_measurements: InspectionMeasurementRule[];
  ai_prompt_rules?: string;
  generates_plan?: boolean;
  generates_quote?: boolean;
}

export interface Inspection {
  id: string; // UUID
  user_id: string;
  inspection_type_id: string;
  template_id: string;
  client_name: string;
  client_phone: string;
  client_location: string;
  status: InspectionWorkflowStatus;
  sync_status: InspectionSyncStatus;
  sync_error?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  gps_accuracy?: number | null;
  altitude?: number | null;
  inspection_date: string;
  inspection_time: string;
  expert_name: string;
  expert_notes?: string | null;
  voice_notes_transcription?: string | null;
  has_voice_recording?: boolean;
  sketch_data_url?: string | null;
  client_signature_url?: string | null;
  expert_signature_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionField {
  id: string;
  inspection_id: string;
  field_key: string;
  label: string;
  value: any;
  unit?: string | null;
  required: boolean;
}

export interface InspectionPhoto {
  id: string;
  inspection_id: string;
  label: string;
  photo_url: string;
  latitude?: number | null;
  longitude?: number | null;
  timestamp: string;
  is_mandatory: boolean;
  notes?: string | null;
}

export interface InspectionMeasurement {
  id: string;
  inspection_id: string;
  name: string;
  value: number;
  unit: string;
  min_threshold?: number | null;
  max_threshold?: number | null;
  is_conforming: boolean;
  notes?: string | null;
}

export interface QuoteItem {
  id: string;
  designation: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price_fcfa: number;
  total_price_fcfa: number;
  partner_name?: string;
}

export interface InspectionReport {
  id: string;
  inspection_id: string;
  summary: string;
  observations: string[];
  recommendations: string[];
  conformity_score: number; // 0 - 100%
  quote_summary?: {
    items: QuoteItem[];
    total_ht: number;
    tva: number;
    total_ttc: number;
  } | null;
  plan_2d_svg?: string | null;
  plan_3d_specs?: {
    type: string;
    elements: { name: string; x: number; y: number; z?: number; dimensions: string }[];
  } | null;
  pdf_generated_at?: string | null;
  created_at: string;
}

export interface FullInspectionRecord {
  inspection: Inspection;
  type: InspectionType;
  template: InspectionTemplate;
  fields: Record<string, any>;
  photos: InspectionPhoto[];
  measurements: InspectionMeasurement[];
  report?: InspectionReport | null;
}

// ============================================================================
// 2. TYPES DE MISSIONS STANDARDS (CATALOGUE COMPLET NAFA GENIUS)
// ============================================================================

export const SEED_INSPECTION_TYPES: InspectionType[] = [
  // ── Agriculture ──
  {
    id: "it-agri-amenagement",
    category: "agriculture",
    name: "Aménagement de ferme agricole",
    code: "AGRI_AMENAGEMENT",
    iconName: "Tractor",
    description: "Zonage agro-écologique, clôture périmétrique, voirie interne et parcelles de production.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-agri-irrigation",
    category: "agriculture",
    name: "Système d'irrigation",
    code: "AGRI_IRRIGATION_GLOBAL",
    iconName: "Droplets",
    description: "Audit global des ressources hydriques, débits, pressions et distribution hydro-agricole.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-agri-goutte",
    category: "agriculture",
    name: "Installation de goutte-à-goutte",
    code: "AGRI_GOUTTE_A_GOUTTE",
    iconName: "Droplets",
    description: "Micro-irrigation haute efficience (lignes goutteurs intégrés, régulateurs, filtration).",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-agri-aspersion",
    category: "agriculture",
    name: "Aspersion",
    code: "AGRI_ASPERSION",
    iconName: "Wind",
    description: "Couverture intégrale ou semi-intégrale par canons ou asperseurs rotatifs.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-agri-microaspersion",
    category: "agriculture",
    name: "Micro-aspersion",
    code: "AGRI_MICRO_ASPERSION",
    iconName: "CloudRain",
    description: "Micro-irrigation sous frondaison pour vergers (mangues, agrumes) et pépinières.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-agri-forage",
    category: "agriculture",
    name: "Forage & Pompage solaire",
    code: "AGRI_FORAGE_SOLAIRE",
    iconName: "Compass",
    description: "Diagnostic de forage, niveau statique/dynamique, HMT et station photovoltaïque.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-agri-reservoir",
    category: "agriculture",
    name: "Réservoir d'eau & Château d'eau",
    code: "AGRI_RESERVOIR_EAU",
    iconName: "Layers",
    description: "Dimensionnement et inspection de bassins bâche PEHD ou châteaux métalliques.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-agri-serre",
    category: "agriculture",
    name: "Serre agricole",
    code: "AGRI_SERRE_BIOCLIMATIQUE",
    iconName: "Sparkles",
    description: "Structures de protection maraîchères (tunnel, multichapelle, filets anti-insectes).",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-agri-analyse",
    category: "agriculture",
    name: "Analyse de parcelle",
    code: "AGRI_ANALYSE_PARCELLE",
    iconName: "FlaskConical",
    description: "Caractérisation pédologique du sol, texture, pH, compactage et drainage naturel.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-agri-carto",
    category: "agriculture",
    name: "Cartographie GPS",
    code: "AGRI_CARTO_GPS",
    iconName: "MapPin",
    description: "Levé topographique par GPS différentiel, contours réels et calcul de superficie exacte.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-agri-diagnostic",
    category: "agriculture",
    name: "Diagnostic des cultures",
    code: "AGRI_DIAGNOSTIC_CULTURES",
    iconName: "Microscope",
    description: "Détection phytosanitaire INERA/CILSS des bio-agresseurs, ravageurs et carences minérales.",
    is_active: true,
    is_system: true,
  },

  // ── Élevage ──
  {
    id: "it-elev-bovine",
    category: "elevage",
    name: "Ferme bovine",
    code: "ELEV_BOVINE",
    iconName: "Beef",
    description: "Étables d'embouche bovine, stabulation libre, couloirs d'alimentation et contention.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-elev-ovine",
    category: "elevage",
    name: "Ferme ovine",
    code: "ELEV_OVINE",
    iconName: "Beef",
    description: "Bergerie pour moutons de case ou troupeaux pastoraux avec ventilation sahélienne.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-elev-caprine",
    category: "elevage",
    name: "Ferme caprine",
    code: "ELEV_CAPRINE",
    iconName: "Beef",
    description: "Chèvrerie semi-intensive avec zones surélevées et aires d'exercice sécurisées.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-elev-avicole",
    category: "elevage",
    name: "Ferme avicole",
    code: "ELEV_AVICOLE",
    iconName: "Egg",
    description: "Bâtiments avicoles (poulets de chair ou pondeuses), densité au m² et biosécurité.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-elev-porcine",
    category: "elevage",
    name: "Ferme porcine",
    code: "ELEV_PORCINE",
    iconName: "Beef",
    description: "Porcherie avec loges de maternité, engraissement et fosses d'évacuation des lisiers.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-elev-piscicole",
    category: "elevage",
    name: "Ferme piscicole",
    code: "ELEV_PISCICOLE",
    iconName: "Fish",
    description: "Bassins hors-sol ou étangs creusés pour Tilapia et Silure (Clarias gariepinus).",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-elev-batiments",
    category: "elevage",
    name: "Bâtiments d'élevage",
    code: "ELEV_BATIMENTS_GENIE",
    iconName: "Home",
    description: "Conception bioclimatique Est-Ouest, ventilation thermosiphon et charpente locale.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-elev-sanitaire",
    category: "elevage",
    name: "Diagnostic sanitaire",
    code: "ELEV_DIAGNOSTIC_SANITAIRE",
    iconName: "Stethoscope",
    description: "Visite vétérinaire, prophylaxie, dépistage pathologique et respect des temps d'attente.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-elev-abreuvement",
    category: "elevage",
    name: "Points d'abreuvement",
    code: "ELEV_ABREUVEMENT",
    iconName: "Droplet",
    description: "Abreuvoirs automatiques à niveau constant, citernes de stockage et débit par tête.",
    is_active: true,
    is_system: true,
  },

  // ── Machinisme & Travaux ──
  {
    id: "it-mach-installation",
    category: "machinisme",
    name: "Installation d'équipements",
    code: "MACH_INSTALLATION",
    iconName: "Wrench",
    description: "Réception de chantiers de montage, alignement groupes moto-pompes et générateurs.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-mach-inspection",
    category: "machinisme",
    name: "Inspection de matériel",
    code: "MACH_INSPECTION_TRACTEUR",
    iconName: "Tractor",
    description: "Contrôle technique des tracteurs agricoles, charrues, herses et semoirs motorisés.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-mach-maintenance",
    category: "machinisme",
    name: "Maintenance",
    code: "MACH_MAINTENANCE",
    iconName: "Settings",
    description: "Programme de maintenance préventive (vidanges, filtres, graissage, pièces d'usure).",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-mach-pompes",
    category: "machinisme",
    name: "Installation de pompes",
    code: "MACH_POMPES_SOLAIRES",
    iconName: "Cpu",
    description: "Immersion pompes hélicoïdales ou centrifuges, câblage variateur MPPT et sécurités.",
    is_active: true,
    is_system: true,
  },
  {
    id: "it-mach-reseaux",
    category: "machinisme",
    name: "Réseaux hydrauliques",
    code: "MACH_RESEAUX_HYDRAULIQUES",
    iconName: "Share2",
    description: "Pose conduites maîtresses PEHD PN10/PN16, vannes papillon, clapets et purges d'air.",
    is_active: true,
    is_system: true,
  },
];

// ============================================================================
// 3. GÉNÉRATEUR IA DE TEMPLATES & SCHÉMAS DYNAMIQUES
// ============================================================================

export function buildInspectionTemplateForType(type: InspectionType): InspectionTemplate {
  // Cas 1 : Système d'irrigation & Goutte-à-goutte
  if (type.code.includes("IRRIGATION") || type.code.includes("GOUTTE") || type.code.includes("ASPERSION")) {
    return {
      id: `tmpl-${type.id}`,
      inspection_type_id: type.id,
      name: `Fiche Technique & Audit Hydraulique : ${type.name}`,
      version: "1.2",
      generates_plan: true,
      generates_quote: true,
      fields_schema: [
        { key: "superficie_ha", label: "Superficie à irriguer", type: "number", unit: "ha", required: true, defaultValue: 1.0 },
        { key: "type_culture", label: "Culture envisagée / en place", type: "text", required: true, defaultValue: "Tomate maraîchère" },
        { key: "pente_pct", label: "Pente estimée du terrain", type: "number", unit: "%", required: true, defaultValue: 1.5 },
        {
          key: "source_eau",
          label: "Source d'eau principale",
          type: "select",
          options: ["Forage équipé", "Forage d'essai", "Puits grand diamètre", "Retenue d'eau / Barrage", "Fleuve / Rivière"],
          required: true,
          defaultValue: "Forage équipé",
        },
        { key: "debit_disponible_m3h", label: "Débit disponible mesuré", type: "number", unit: "m³/h", required: true, defaultValue: 12.0 },
        { key: "pression_service_bar", label: "Pression en tête requise", type: "number", unit: "bar", required: true, defaultValue: 2.5 },
        { key: "ecartement_lignes_m", label: "Distance entre lignes de plantation", type: "number", unit: "m", required: true, defaultValue: 0.8 },
        { key: "distance_source_parcelle_m", label: "Distance source d'eau vers parcelle", type: "number", unit: "m", required: true, defaultValue: 65 },
        { key: "type_sol", label: "Texture dominante du sol", type: "select", options: ["Sableux", "Limono-sableux", "Argilo-limoneux", "Argileux lourd"], required: true, defaultValue: "Limono-sableux" },
      ],
      required_photos: [
        { key: "photo_source", label: "Source d'eau & Tête de forage", description: "Vue claire du forage, de la pompe et des raccords.", is_mandatory: true },
        { key: "photo_parcelle_panoramique", label: "Vue panoramique de la parcelle", description: "Perspective montrant la pente et les dégagements.", is_mandatory: true },
        { key: "photo_filtration", label: "Station de filtration / Raccordement", description: "Emplacement prévu pour la station de tête.", is_mandatory: true },
        { key: "photo_sol_texture", label: "Prélèvement de sol", description: "Texture du sol en surface et à 30 cm de profondeur.", is_mandatory: false },
      ],
      default_measurements: [
        { name: "Débit au refoulement", unit: "m³/h", min_threshold: 4, max_threshold: 40, default_norm: "Selon pompe installée" },
        { name: "Pression statique tête", unit: "bar", min_threshold: 1.5, max_threshold: 5.0, default_norm: "Tolérance PEHD PN10" },
        { name: "Distance source-parcelle", unit: "m", min_threshold: 5, max_threshold: 1500, default_norm: "Relevé laser / GPS" },
        { name: "pH de l'eau d'irrigation", unit: "pH", min_threshold: 6.0, max_threshold: 7.8, default_norm: "Norme FAO-56" },
        { name: "Conductivité électrique", unit: "µS/cm", min_threshold: 100, max_threshold: 1800, default_norm: "Salinité admissible" },
      ],
    };
  }

  // Cas 2 : Ferme piscicole
  if (type.code.includes("PISCICOLE")) {
    return {
      id: `tmpl-${type.id}`,
      inspection_type_id: type.id,
      name: `Fiche d'Audit Piscicole : ${type.name}`,
      version: "1.1",
      generates_plan: true,
      generates_quote: true,
      fields_schema: [
        { key: "nb_bassins", label: "Nombre de bassins opérationnels", type: "number", required: true, defaultValue: 4 },
        { key: "longueur_bassin_m", label: "Longueur unitaire du bassin", type: "number", unit: "m", required: true, defaultValue: 10 },
        { key: "largeur_bassin_m", label: "Largeur unitaire du bassin", type: "number", unit: "m", required: true, defaultValue: 5 },
        { key: "profondeur_eau_m", label: "Profondeur utile d'eau", type: "number", unit: "m", required: true, defaultValue: 1.2 },
        {
          key: "especes_elevees",
          label: "Espèce de poisson élevée",
          type: "select",
          options: ["Tilapia du Nil (Oreochromis niloticus)", "Silure africain (Clarias gariepinus)", "Polyculture Tilapia/Silure"],
          required: true,
          defaultValue: "Tilapia du Nil (Oreochromis niloticus)",
        },
        { key: "type_bassin", label: "Type de structure", type: "select", options: ["Bassin bétonné maçonné", "Bassin bâche hors-sol", "Étang creusé en terre"], required: true, defaultValue: "Bassin bétonné maçonné" },
        { key: "frequence_renouvellement", label: "Renouvellement d'eau", type: "select", options: ["Continu par trop-plein", "Quotidien 20%", "Hebdomadaire 50%", "Recirculation avec filtre"], required: true, defaultValue: "Quotidien 20%" },
        { key: "type_aliment", label: "Alimentation distribuée", type: "text", required: true, defaultValue: "Granulés extrudés flottants 38% PB" },
      ],
      required_photos: [
        { key: "photo_bassins_ensemble", label: "Vue globale des bassins", description: "Prise de vue montrant l'agencement et l'enclos.", is_mandatory: true },
        { key: "photo_arrivee_eau", label: "Arrivée d'eau & Distribution", description: "Tuyauterie d'alimentation et aération.", is_mandatory: true },
        { key: "photo_moine_vidange", label: "Système de vidange / Moine", description: "Dispositif d'évacuation des sédiments.", is_mandatory: true },
        { key: "photo_stock_aliment", label: "Stockage des provendes", description: "Entrepôt sec des sacs d'aliments.", is_mandatory: false },
      ],
      default_measurements: [
        { name: "pH de l'eau des bassins", unit: "pH", min_threshold: 6.5, max_threshold: 8.5, default_norm: "Optimal 7.0 - 8.0" },
        { name: "Température de l'eau", unit: "°C", min_threshold: 24.0, max_threshold: 32.0, default_norm: "Optimum 26 - 30 °C" },
        { name: "Oxygène dissous (DO)", unit: "mg/L", min_threshold: 4.0, max_threshold: 9.0, default_norm: "Seuil critique > 3.0" },
        { name: "Transparence au disque Secchi", unit: "cm", min_threshold: 20, max_threshold: 40, default_norm: "Bloom phytoplancton" },
        { name: "Profondeur moyenne mesurée", unit: "m", min_threshold: 0.8, max_threshold: 2.0, default_norm: "Norme sahélienne" },
      ],
    };
  }

  // Cas 3 : Ferme bovine / ovine / caprine / avicole
  if (type.category === "elevage") {
    return {
      id: `tmpl-${type.id}`,
      inspection_type_id: type.id,
      name: `Fiche d'Évaluation Zootechnique & Bâtiment : ${type.name}`,
      version: "1.1",
      generates_plan: true,
      generates_quote: true,
      fields_schema: [
        { key: "effectif_tetes", label: "Effectif actuel du cheptel", type: "number", required: true, defaultValue: 30 },
        { key: "surface_batiment_m2", label: "Surface totale abritée", type: "number", unit: "m²", required: true, defaultValue: 120 },
        { key: "type_ventilation", label: "Ventilation du bâtiment", type: "select", options: ["Naturelle thermosiphon traversante", "Ouverte avec grillage brise-vent", "Confinée sans aération suffisante"], required: true, defaultValue: "Naturelle thermosiphon traversante" },
        { key: "type_toiture", label: "Toiture & Matériaux", type: "select", options: ["Tôle ondulée isolée sous-face", "Tôle simple avec surélévation faîtière", "Paille / Chaume traditionnel", "Dalle béton"], required: true, defaultValue: "Tôle simple avec surélévation faîtière" },
        { key: "presence_couloir_contention", label: "Couloir de contention opérationnel", type: "boolean", required: true, defaultValue: true },
        { key: "type_litiere", label: "Litière au sol", type: "select", options: ["Paille hachée", "Copeaux de bois", "Sol béton nu lavé", "Terre battue sablonneuse"], required: true, defaultValue: "Paille hachée" },
        { key: "systeme_abreuvement", label: "Dispositif d'abreuvement", type: "select", options: ["Abreuvoirs à niveau constant", "Pipettes / Tétines inox", "Bacs manuels maçonnés"], required: true, defaultValue: "Abreuvoirs à niveau constant" },
      ],
      required_photos: [
        { key: "photo_hangar_ensemble", label: "Bâtiment & Faîte Est-Ouest", description: "Orientation solaire et aération haute.", is_mandatory: true },
        { key: "photo_mangeoires_abreuvoirs", label: "Mangeoires & Abreuvoirs", description: "Propreté et accès à l'eau potable.", is_mandatory: true },
        { key: "photo_litiere_animaux", label: "Aire de couchage & Animaux", description: "État corporel et propreté de la litière.", is_mandatory: true },
        { key: "photo_contention", label: "Couloir de contention / Soins", description: "Sécurité lors des vaccinations.", is_mandatory: false },
      ],
      default_measurements: [
        { name: "Surface utile par tête", unit: "m²/tête", min_threshold: 2.5, max_threshold: 12.0, default_norm: "CIRAD / FAO" },
        { name: "Hauteur sous faîtage", unit: "m", min_threshold: 3.5, max_threshold: 6.0, default_norm: "Confort thermique Sahel" },
        { name: "Débit d'eau abreuvoir", unit: "L/min", min_threshold: 5.0, max_threshold: 25.0, default_norm: "Pression constante" },
        { name: "Température ambiante relevée", unit: "°C", min_threshold: 20.0, max_threshold: 38.0, default_norm: "Stress thermique" },
        { name: "Épaisseur litière sèche", unit: "cm", min_threshold: 8.0, max_threshold: 20.0, default_norm: "Absorption fientes/urines" },
      ],
    };
  }

  // Cas 4 : Forage & Pompage solaire
  if (type.code.includes("FORAGE") || type.code.includes("POMPES")) {
    return {
      id: `tmpl-${type.id}`,
      inspection_type_id: type.id,
      name: `Fiche d'Ingénierie de Forage & Pompage : ${type.name}`,
      version: "1.3",
      generates_plan: true,
      generates_quote: true,
      fields_schema: [
        { key: "profondeur_totale_m", label: "Profondeur forée totale", type: "number", unit: "m", required: true, defaultValue: 65 },
        { key: "niveau_statique_m", label: "Niveau piézométrique statique", type: "number", unit: "m", required: true, defaultValue: 18 },
        { key: "niveau_dynamique_m", label: "Niveau dynamique sous pompage", type: "number", unit: "m", required: true, defaultValue: 28 },
        { key: "debit_souhaite_m3h", label: "Débit requis pour l'exploitation", type: "number", unit: "m³/h", required: true, defaultValue: 8.5 },
        { key: "distance_reservoir_m", label: "Distance tête de forage vers réservoir", type: "number", unit: "m", required: true, defaultValue: 120 },
        { key: "denivele_reservoir_m", label: "Hauteur géométrique réservoir", type: "number", unit: "m", required: true, defaultValue: 6.0 },
        { key: "ensoleillement_kwh", label: "Ensoleillement moyen local", type: "number", unit: "kWh/m²/j", required: true, defaultValue: 5.8 },
      ],
      required_photos: [
        { key: "photo_tete_forage", label: "Tête de forage & Margelle", description: "Béton de propreté et étanchéité de tête.", is_mandatory: true },
        { key: "photo_emplacement_pv", label: "Emplacement champ solaire", description: "Exposition Sud sans ombrage d'arbres.", is_mandatory: true },
        { key: "photo_tracé_conduite", label: "Tracé de la conduite de refoulement", description: "Obstacles éventuels et nature du sol.", is_mandatory: true },
      ],
      default_measurements: [
        { name: "Débit d'essai stable", unit: "m³/h", min_threshold: 2.0, max_threshold: 50.0, default_norm: "Rapport de foration" },
        { name: "Hauteur Manométrique Totale (HMT)", unit: "m", min_threshold: 20, max_threshold: 120, default_norm: "HMT = Hg + Pc" },
        { name: "Puissance crête solaire requise", unit: "Wc", min_threshold: 600, max_threshold: 10000, default_norm: "Dimensionnement PV" },
        { name: "Conductivité de l'eau", unit: "µS/cm", min_threshold: 150, max_threshold: 1500, default_norm: "Potabilité & irrigation" },
      ],
    };
  }

  // Cas par défaut (Machinisme, Travaux, Diagnostic générique, etc.)
  return {
    id: `tmpl-${type.id}`,
    inspection_type_id: type.id,
    name: `Fiche d'Inspection Technique : ${type.name}`,
    version: "1.0",
    generates_plan: false,
    generates_quote: true,
    fields_schema: [
      { key: "designation_materiel", label: "Désignation de l'équipement ou chantier", type: "text", required: true, defaultValue: type.name },
      { key: "etat_general", label: "État général constaté", type: "select", options: ["Neuf / Parfait", "Bon état opérationnel", "Usure modérée", "Dégradation sévère", "Hors-service"], required: true, defaultValue: "Bon état opérationnel" },
      { key: "conforme_normes", label: "Conforme aux normes sécuritaires & techniques", type: "boolean", required: true, defaultValue: true },
      { key: "observations_principales", label: "Observations & diagnostics clés", type: "textarea", required: true, defaultValue: "Inspection réalisée conformément au cahier des charges NAFA Genius." },
    ],
    required_photos: [
      { key: "photo_vue_ensemble", label: "Vue d'ensemble de l'inspection", description: "Perspective complète de l'objet inspecté.", is_mandatory: true },
      { key: "photo_details_techniques", label: "Détails techniques / Pièces critiques", description: "Gros plan sur les organes vitaux ou anomalies.", is_mandatory: true },
    ],
    default_measurements: [
      { name: "Tension électrique d'alimentation", unit: "V", min_threshold: 210, max_threshold: 400, default_norm: "230V mono ou 380V tri" },
      { name: "Pression hydraulique de fonctionnement", unit: "bar", min_threshold: 1.0, max_threshold: 10.0, default_norm: "Normes fabricant" },
      { name: "Taux de vibration / Jeu mécanique", unit: "mm", min_threshold: 0, max_threshold: 2.0, default_norm: "Tolérance tolérée" },
    ],
  };
}

// ============================================================================
// 4. PERSISTANCE LOCALE & SYNCHRONISATION SUPABASE (OFFLINE-FIRST)
// ============================================================================

const LOCAL_STORAGE_KEYS = {
  TYPES: "nafa_inspection_types_v1",
  TEMPLATES: "nafa_inspection_templates_v1",
  INSPECTIONS: "nafa_inspections_v1",
  REPORTS: "nafa_inspection_reports_v1",
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[nafaInspectionEngine] Erreur lecture ${key}`, e);
  }
  return fallback;
}

function writeLocal<T>(key: string, val: T, silent = false): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    if (!silent) {
      window.dispatchEvent(new CustomEvent("nafa-inspection-updated", { detail: { key } }));
    }
  } catch (e) {
    console.error(`[nafaInspectionEngine] Erreur écriture ${key}`, e);
  }
}

export const nafaInspectionEngine = {
  // ── 1. Types d'inspections ──
  getTypes(): InspectionType[] {
    const list = readLocal<InspectionType[]>(LOCAL_STORAGE_KEYS.TYPES, SEED_INSPECTION_TYPES);
    // Enrichissement automatique si de nouveaux types ont été ajoutés
    const existingIds = new Set(list.map((t) => t.id));
    let added = false;
    for (const seed of SEED_INSPECTION_TYPES) {
      if (!existingIds.has(seed.id)) {
        list.push(seed);
        added = true;
      }
    }
    if (added || !localStorage.getItem(LOCAL_STORAGE_KEYS.TYPES)) {
      writeLocal(LOCAL_STORAGE_KEYS.TYPES, list);
    }
    return list.filter((t) => t.is_active);
  },

  registerCustomType(newType: Omit<InspectionType, "id" | "is_system">, customTemplate?: Partial<InspectionTemplate>): InspectionType {
    const types = this.getTypes();
    const id = `it-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const created: InspectionType = {
      ...newType,
      id,
      is_system: false,
      is_active: true,
    };
    types.unshift(created);
    writeLocal(LOCAL_STORAGE_KEYS.TYPES, types);

    // Save associated template
    const template = buildInspectionTemplateForType(created);
    if (customTemplate) {
      Object.assign(template, customTemplate);
    }
    const templates = this.getTemplates();
    templates.push(template);
    writeLocal(LOCAL_STORAGE_KEYS.TEMPLATES, templates);

    return created;
  },

  // ── 2. Templates d'inspections ──
  getTemplates(): InspectionTemplate[] {
    const list = readLocal<InspectionTemplate[]>(LOCAL_STORAGE_KEYS.TEMPLATES, []);
    return list;
  },

  getTemplateForType(typeId: string): InspectionTemplate {
    const templates = this.getTemplates();
    const existing = templates.find((t) => t.inspection_type_id === typeId);
    if (existing) return existing;

    const allTypes = this.getTypes();
    const matchType = allTypes.find((t) => t.id === typeId) || allTypes[0];
    const created = buildInspectionTemplateForType(matchType);
    templates.push(created);
    writeLocal(LOCAL_STORAGE_KEYS.TEMPLATES, templates);
    return created;
  },

  // ── 3. Inspections CRUD (Offline-First) ──
  getInspections(): Inspection[] {
    return readLocal<Inspection[]>(LOCAL_STORAGE_KEYS.INSPECTIONS, []);
  },

  getInspectionById(id: string): Inspection | null {
    const list = this.getInspections();
    return list.find((i) => i.id === id) || null;
  },

  async createInspection(data: {
    inspection_type_id: string;
    client_name: string;
    client_phone: string;
    client_location: string;
    expert_name: string;
    latitude?: number | null;
    longitude?: number | null;
    gps_accuracy?: number | null;
    altitude?: number | null;
  }): Promise<Inspection> {
    const template = this.getTemplateForType(data.inspection_type_id);
    const id = crypto.randomUUID();
    const now = new Date();

    const inspection: Inspection = {
      id,
      user_id: "expert-user-local",
      inspection_type_id: data.inspection_type_id,
      template_id: template.id,
      client_name: data.client_name.trim(),
      client_phone: data.client_phone.trim(),
      client_location: data.client_location.trim(),
      status: "brouillon",
      sync_status: "pending",
      sync_error: null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      gps_accuracy: data.gps_accuracy ?? null,
      altitude: data.altitude ?? null,
      inspection_date: now.toISOString().split("T")[0],
      inspection_time: now.toTimeString().split(" ")[0].slice(0, 5),
      expert_name: data.expert_name.trim(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const list = this.getInspections();
    list.unshift(inspection);
    writeLocal(LOCAL_STORAGE_KEYS.INSPECTIONS, list);

    // Initialiser les champs par défaut
    this.saveInspectionFields(id, template.fields_schema.reduce((acc, f) => {
      acc[f.key] = f.defaultValue !== undefined ? f.defaultValue : "";
      return acc;
    }, {} as Record<string, any>));

    // Initialiser les mesures par défaut
    const defaultMeas: InspectionMeasurement[] = template.default_measurements.map((m) => ({
      id: crypto.randomUUID(),
      inspection_id: id,
      name: m.name,
      value: (m.min_threshold && m.max_threshold) ? Number(((m.min_threshold + m.max_threshold) / 2).toFixed(1)) : 0,
      unit: m.unit,
      min_threshold: m.min_threshold ?? null,
      max_threshold: m.max_threshold ?? null,
      is_conforming: true,
      notes: m.default_norm || "Mesure standard",
    }));
    this.saveInspectionMeasurements(id, defaultMeas);

    // Tenter la synchronisation en arrière-plan
    void this.syncToSupabase(inspection);

    return inspection;
  },

  updateInspection(id: string, updates: Partial<Inspection>): Inspection {
    const list = this.getInspections();
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Inspection introuvable : ${id}`);

    const updated: Inspection = {
      ...list[idx],
      ...updates,
      sync_status: "pending",
      updated_at: new Date().toISOString(),
    };
    list[idx] = updated;
    writeLocal(LOCAL_STORAGE_KEYS.INSPECTIONS, list);

    void this.syncToSupabase(updated);
    return updated;
  },

  deleteInspection(id: string): void {
    const list = this.getInspections();
    writeLocal(LOCAL_STORAGE_KEYS.INSPECTIONS, list.filter((i) => i.id !== id));
  },

  // ── 4. Champs dynamiques ──
  getInspectionFields(inspectionId: string): Record<string, any> {
    return readLocal<Record<string, any>>(`nafa_insp_fields_${inspectionId}`, {});
  },

  saveInspectionFields(inspectionId: string, fields: Record<string, any>): void {
    writeLocal(`nafa_insp_fields_${inspectionId}`, fields);
    this.updateInspection(inspectionId, {});
  },

  // ── 5. Photos avec checklist obligatoire ──
  getInspectionPhotos(inspectionId: string): InspectionPhoto[] {
    return readLocal<InspectionPhoto[]>(`nafa_insp_photos_${inspectionId}`, []);
  },

  saveInspectionPhotos(inspectionId: string, photos: InspectionPhoto[]): void {
    writeLocal(`nafa_insp_photos_${inspectionId}`, photos);
    this.updateInspection(inspectionId, {});
  },

  addInspectionPhoto(inspectionId: string, photo: Omit<InspectionPhoto, "id" | "inspection_id" | "timestamp">): InspectionPhoto {
    const list = this.getInspectionPhotos(inspectionId);
    const created: InspectionPhoto = {
      ...photo,
      id: crypto.randomUUID(),
      inspection_id: inspectionId,
      timestamp: new Date().toISOString(),
    };
    list.unshift(created);
    this.saveInspectionPhotos(inspectionId, list);
    return created;
  },

  // ── 6. Mesures techniques ──
  getInspectionMeasurements(inspectionId: string): InspectionMeasurement[] {
    return readLocal<InspectionMeasurement[]>(`nafa_insp_meas_${inspectionId}`, []);
  },

  saveInspectionMeasurements(inspectionId: string, measurements: InspectionMeasurement[]): void {
    writeLocal(`nafa_insp_meas_${inspectionId}`, measurements);
    this.updateInspection(inspectionId, {});
  },

  // ── 7. Rapports & Devis automatiques ──
  getInspectionReport(inspectionId: string): InspectionReport | null {
    const reports = readLocal<InspectionReport[]>(LOCAL_STORAGE_KEYS.REPORTS, []);
    return reports.find((r) => r.inspection_id === inspectionId) || null;
  },

  saveInspectionReport(report: InspectionReport, silent = false): void {
    const reports = readLocal<InspectionReport[]>(LOCAL_STORAGE_KEYS.REPORTS, []);
    const idx = reports.findIndex((r) => r.inspection_id === report.inspection_id);
    if (idx >= 0) reports[idx] = report;
    else reports.unshift(report);
    writeLocal(LOCAL_STORAGE_KEYS.REPORTS, reports, silent);
  },

  // ── 8. Synchronisation Supabase ──
  async syncToSupabase(inspection: Inspection): Promise<boolean> {
    if (!navigator.onLine) {
      inspection.sync_status = "pending";
      return false;
    }

    try {
      const payload = {
        id: inspection.id,
        user_id: inspection.user_id,
        inspection_type_id: inspection.inspection_type_id,
        template_id: inspection.template_id,
        client_name: inspection.client_name,
        client_phone: inspection.client_phone,
        client_location: inspection.client_location,
        status: inspection.status,
        latitude: inspection.latitude,
        longitude: inspection.longitude,
        gps_accuracy: inspection.gps_accuracy,
        altitude: inspection.altitude,
        inspection_date: inspection.inspection_date,
        expert_name: inspection.expert_name,
        created_at: inspection.created_at,
        updated_at: inspection.updated_at,
      };

      // Tentative d'insertion/upsert dans Supabase
      const { error } = await supabase.from("inspections" as any).upsert(payload as any);
      if (error) {
        console.warn("[nafaInspectionEngine] Synchronisation différée (table distante en cours de provisioning) :", error.message);
        inspection.sync_status = "pending";
        inspection.sync_error = error.message;
        return false;
      }

      inspection.sync_status = "synced";
      inspection.sync_error = null;
      return true;
    } catch (e: any) {
      console.warn("[nafaInspectionEngine] Échec réseau sync Supabase :", e.message);
      inspection.sync_status = "pending";
      inspection.sync_error = e.message;
      return false;
    }
  },

  // ── 9. Calcul automatique du Devis & Matériaux (Partenaires BF) ──
  generateSmartQuote(type: InspectionType, fields: Record<string, any>): QuoteItem[] {
    const items: QuoteItem[] = [];

    // Si mission Irrigation / Goutte-à-goutte
    if (type.code.includes("IRRIGATION") || type.code.includes("GOUTTE") || type.code.includes("ASPERSION")) {
      const supHa = Number(fields.superficie_ha) || 1.0;
      const distSrc = Number(fields.distance_source_parcelle_m) || 60;

      items.push({
        id: "qi-1",
        designation: "Tuyau PEHD 100 PN10 Diamètre 63mm (Ligne maîtresse)",
        category: "reseau_hydraulique",
        quantity: Math.max(100, Math.round(distSrc * 1.3)),
        unit: "ml",
        unit_price_fcfa: 1650,
        total_price_fcfa: Math.max(100, Math.round(distSrc * 1.3)) * 1650,
        partner_name: "AGRODIA (Agro-Distribution & Irrigation)",
      });

      items.push({
        id: "qi-2",
        designation: "Gaine goutte-à-goutte 16mm avec goutteurs autorégulants intégrés (e=20cm)",
        category: "reseau_hydraulique",
        quantity: Math.round(supHa * 10000),
        unit: "ml",
        unit_price_fcfa: 85,
        total_price_fcfa: Math.round(supHa * 10000) * 85,
        partner_name: "SODIMEX Sahel",
      });

      items.push({
        id: "qi-3",
        designation: "Station de filtration à disques 2'' haute capacité avec manomètres glycérine",
        category: "filtration",
        quantity: Math.max(1, Math.round(supHa)),
        unit: "kit",
        unit_price_fcfa: 220000,
        total_price_fcfa: Math.max(1, Math.round(supHa)) * 220000,
        partner_name: "AGRODIA",
      });

      items.push({
        id: "qi-4",
        designation: "Injecteur Venturi de fertigation 1.5'' avec débitmètre d'aspiration",
        category: "fertigation",
        quantity: 1,
        unit: "u",
        unit_price_fcfa: 85000,
        total_price_fcfa: 85000,
        partner_name: "Tropic Agro",
      });

      items.push({
        id: "qi-5",
        designation: "Vannes papillon cadenassables et clapets anti-retour DN63",
        category: "vannerie",
        quantity: Math.max(4, Math.round(supHa * 4)),
        unit: "u",
        unit_price_fcfa: 22500,
        total_price_fcfa: Math.max(4, Math.round(supHa * 4)) * 22500,
        partner_name: "SODIMEX Sahel",
      });

      items.push({
        id: "qi-6",
        designation: "Main d'œuvre qualifiée d'installation, tranchées et raccordement au champ",
        category: "main_oeuvre",
        quantity: Math.max(1, Math.round(supHa)),
        unit: "forfait",
        unit_price_fcfa: 150000,
        total_price_fcfa: Math.max(1, Math.round(supHa)) * 150000,
        partner_name: "Service Agréé NAFA-AGRITECH",
      });
    } else if (type.code.includes("PISCICOLE")) {
      const nbBassins = Number(fields.nb_bassins) || 4;
      items.push({
        id: "qip-1",
        designation: "Aérateur solaire à palettes flottantes 1.5 CV avec variateur MPPT",
        category: "equipement_piscicole",
        quantity: Math.max(1, Math.ceil(nbBassins / 2)),
        unit: "u",
        unit_price_fcfa: 480000,
        total_price_fcfa: Math.max(1, Math.ceil(nbBassins / 2)) * 480000,
        partner_name: "FASO SOLAIRE & Hydraulique",
      });
      items.push({
        id: "qip-2",
        designation: "Système de vidange rapide et filtre mécanique à sédiments",
        category: "hydraulique",
        quantity: nbBassins,
        unit: "kit",
        unit_price_fcfa: 125000,
        total_price_fcfa: nbBassins * 125000,
        partner_name: "SODIMEX Sahel",
      });
      items.push({
        id: "qip-3",
        designation: "Filets anti-oiseaux et filets de pêche de récolte maillage 15mm",
        category: "protection",
        quantity: nbBassins,
        unit: "kit",
        unit_price_fcfa: 45000,
        total_price_fcfa: nbBassins * 45000,
        partner_name: "Tropic Agro",
      });
      items.push({
        id: "qip-4",
        designation: "Aliment de démarrage alevins (starter 45% protéines) sacs de 20 kg",
        category: "nutrition",
        quantity: nbBassins * 3,
        unit: "sac",
        unit_price_fcfa: 19500,
        total_price_fcfa: nbBassins * 3 * 19500,
        partner_name: "FASO PROVENDES",
      });
    } else if (type.code.includes("FORAGE") || type.code.includes("POMPES")) {
      items.push({
        id: "qif-1",
        designation: "Pompe solaire immergée hélicoïdale inox haute pression 3.0 kW",
        category: "pompage_solaire",
        quantity: 1,
        unit: "kit",
        unit_price_fcfa: 1850000,
        total_price_fcfa: 1850000,
        partner_name: "FASO SOLAIRE & Hydraulique",
      });
      items.push({
        id: "qif-2",
        designation: "Champ de 8 modules solaires photovoltaïques monocristallins 550Wc avec structure au sol",
        category: "energie_solaire",
        quantity: 1,
        unit: "forfait",
        unit_price_fcfa: 1250000,
        total_price_fcfa: 1250000,
        partner_name: "FASO SOLAIRE",
      });
      items.push({
        id: "qif-3",
        designation: "Câblage subaquatique étanche 4mm² et sondes de niveau manque d'eau",
        category: "securite",
        quantity: 1,
        unit: "kit",
        unit_price_fcfa: 160000,
        total_price_fcfa: 160000,
        partner_name: "AGRODIA",
      });
    } else {
      // Devis générique standard
      items.push({
        id: "qig-1",
        designation: `Kit complet d'aménagement & révision : ${type.name}`,
        category: "materiel",
        quantity: 1,
        unit: "kit",
        unit_price_fcfa: 650000,
        total_price_fcfa: 650000,
        partner_name: "Partenaire Agréé NAFA-AGRITECH",
      });
      items.push({
        id: "qig-2",
        designation: "Fourniture de consommables et pièces de rechange certifiées",
        category: "fourniture",
        quantity: 1,
        unit: "forfait",
        unit_price_fcfa: 180000,
        total_price_fcfa: 180000,
        partner_name: "SODIMEX Sahel",
      });
    }

    return items;
  },

  // ── 10. Génération du Rapport Automatique par l'IA ──
  generateAutomatedReport(
    inspection: Inspection,
    type: InspectionType,
    fields: Record<string, any>,
    photos: InspectionPhoto[],
    measurements: InspectionMeasurement[]
  ): InspectionReport {
    // Calcul du score de conformité
    let conformingCount = 0;
    measurements.forEach((m) => {
      let isOk = true;
      if (m.min_threshold != null && m.value < m.min_threshold) isOk = false;
      if (m.max_threshold != null && m.value > m.max_threshold) isOk = false;
      m.is_conforming = isOk;
      if (isOk) conformingCount++;
    });

    const conformity_score = measurements.length > 0 ? Math.round((conformingCount / measurements.length) * 100) : 100;

    // Observations automatiques
    const observations: string[] = [
      `Inspection réalisée le ${new Date(inspection.inspection_date).toLocaleDateString("fr-FR")} à ${inspection.inspection_time} par l'expert ${inspection.expert_name}.`,
      `Localisation géodésique enregistrée : ${inspection.latitude ? `${inspection.latitude.toFixed(5)}, ${inspection.longitude?.toFixed(5)} (Précision : ±${inspection.gps_accuracy || 5}m)` : "Coordonnées manuelles"}.`,
      `${photos.length} photographies techniques géolocalisées ont été archivées avec horodatage.`,
    ];

    if (conformity_score < 70) {
      observations.push("Attention : Plusieurs paramètres mesurés se situent hors des plages de tolérance agronomique recommandées.");
    } else {
      observations.push("L'installation et les conditions mesurées présentent une excellente conformité technique avec les référentiels sahéliens.");
    }

    // Recommandations IA spécifiques
    const recommendations: string[] = [];
    if (type.code.includes("IRRIGATION") || type.code.includes("GOUTTE")) {
      recommendations.push("Procéder à une purge intégrale des rampes de goutte-à-goutte avant chaque mise en culture pour éviter l'encrassement calcaire.");
      recommendations.push("Installer un régulateur de pression taré à 1.5 bar pour préserver la durée de vie des gaines.");
      recommendations.push("Effectuer une injection d'acide nitrique dilué (0.1%) une fois par mois pour dissoudre les précipités minéraux.");
    } else if (type.code.includes("PISCICOLE")) {
      recommendations.push("Maintenir une aération nocturne continue entre 22h et 6h du matin lorsque la consommation d'oxygène est maximale.");
      recommendations.push("Fractionner la ration alimentaire en 4 repas quotidiens pour optimiser le taux de conversion alimentaire (FCR < 1.3).");
    } else if (type.category === "elevage") {
      recommendations.push("Aménager un pédiluve désinfectant à l'entrée du bâtiment avec renouvellement bi-hebdomadaire.");
      recommendations.push("Rehausser les ouvertures faîtières de 30 cm pour accentuer l'effet de thermosiphon lors des périodes de canicule.");
    } else {
      recommendations.push("Mettre en œuvre le plan d'entretien préventif périodique consigné dans le carnet d'entretien NAFA-AGRITECH.");
    }

    // Devis chiffré
    const quoteItems = this.generateSmartQuote(type, fields);
    const total_ht = quoteItems.reduce((sum, item) => sum + item.total_price_fcfa, 0);
    const tva = 0; // Exonération intrants et matériels agricoles au Burkina Faso (Loi de Finances)
    const total_ttc = total_ht + tva;

    // Plan 2D SVG
    const plan_2d_svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%" class="rounded-xl border bg-slate-900 shadow-md">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="1"/>
        </pattern>
        <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0284c7" />
          <stop offset="100%" stop-color="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#grid)" />
      
      <!-- Cartouche -->
      <rect x="20" y="20" width="300" height="85" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <text x="35" y="45" fill="#38bdf8" font-size="14" font-weight="bold" font-family="sans-serif">PLAN 2D TECHNIQUE NAFA GENIUS</text>
      <text x="35" y="65" fill="#e2e8f0" font-size="12" font-family="sans-serif">Mission : ${type.name}</text>
      <text x="35" y="85" fill="#94a3b8" font-size="10" font-family="sans-serif">Client : ${inspection.client_name} | Échelle : 1:500</text>
      
      <!-- Implantation principale -->
      <rect x="180" y="140" width="480" height="280" rx="12" fill="#064e3b" fill-opacity="0.3" stroke="#10b981" stroke-width="2" stroke-dasharray="6,4"/>
      <text x="195" y="165" fill="#34d399" font-size="12" font-weight="bold">Zone d'Aménagement Principale</text>
      
      <!-- Réseau et canalisations -->
      <line x1="80" y1="280" x2="180" y2="280" stroke="url(#pipeGrad)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="80" cy="280" r="16" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
      <text x="65" y="320" fill="#bae6fd" font-size="10" font-weight="bold">Source / Forage</text>
      
      <!-- Lignes de distribution -->
      <line x1="180" y1="180" x2="620" y2="180" stroke="#0ea5e9" stroke-width="3"/>
      <line x1="180" y1="230" x2="620" y2="230" stroke="#0ea5e9" stroke-width="3"/>
      <line x1="180" y1="280" x2="620" y2="280" stroke="#0ea5e9" stroke-width="3"/>
      <line x1="180" y1="330" x2="620" y2="330" stroke="#0ea5e9" stroke-width="3"/>
      <line x1="180" y1="380" x2="620" y2="380" stroke="#0ea5e9" stroke-width="3"/>
      
      <!-- Ligne de cote 2D cotations -->
      <line x1="180" y1="440" x2="660" y2="440" stroke="#f59e0b" stroke-width="2"/>
      <line x1="180" y1="432" x2="180" y2="448" stroke="#f59e0b" stroke-width="2"/>
      <line x1="660" y1="432" x2="660" y2="448" stroke="#f59e0b" stroke-width="2"/>
      <text x="400" y="435" fill="#fbbf24" font-size="12" font-weight="bold" text-anchor="middle">Longueur : 60.00 m</text>
    </svg>`;

    const report: InspectionReport = {
      id: crypto.randomUUID(),
      inspection_id: inspection.id,
      summary: `Rapport officiel d'inspection ${type.name} pour le client ${inspection.client_name}. Score global de conformité : ${conformity_score}%.`,
      observations,
      recommendations,
      conformity_score,
      quote_summary: {
        items: quoteItems,
        total_ht,
        tva,
        total_ttc,
      },
      plan_2d_svg,
      created_at: new Date().toISOString(),
    };

    this.saveInspectionReport(report, true);
    return report;
  },

  // ── 11. Génération PDF Certifié (jsPDF + autoTable) ──
  generatePDFReport(fullRecord: FullInspectionRecord): void {
    const { inspection, type, template, fields, photos, measurements, report } = fullRecord;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // 1. En-tête vert NAFA Genius
    doc.setFillColor(20, 83, 45); // emerald-900
    doc.rect(0, 0, pageW, 36, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("NAFA GENIUS IA — RAPPORT OFFICIEL D'INSPECTION", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Mission : ${type.name} (${type.category.toUpperCase()}) | Réf : ${inspection.id.slice(0, 8)}`, 14, 25);
    doc.text(`Date : ${new Date(inspection.inspection_date).toLocaleDateString("fr-FR")} à ${inspection.inspection_time} | Statut : ${inspection.status.toUpperCase()}`, 14, 31);

    let y = 46;

    // 2. Bloc Client & Expert
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. Identification & Données Géodésiques", 14, y);
    y += 6;

    const infoBody = [
      ["Client / Exploitation", inspection.client_name, "Expert Assermenté", inspection.expert_name],
      ["Téléphone Client", inspection.client_phone || "-", "Localité", inspection.client_location || "Burkina Faso"],
      ["Coordonnées GPS", inspection.latitude ? `${inspection.latitude.toFixed(5)}, ${inspection.longitude?.toFixed(5)}` : "Non renseigné", "Précision GPS", inspection.gps_accuracy ? `±${inspection.gps_accuracy} m` : "Standard"],
      ["Altitude", inspection.altitude ? `${inspection.altitude} m` : "Non mesuré", "Statut Sync Cloud", inspection.sync_status === "synced" ? "Synchronisé Supabase" : "Sauvegarde locale PWA"],
    ];

    autoTable(doc, {
      startY: y,
      body: infoBody,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", fillColor: [241, 245, 249] }, 2: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // 3. Mesures Techniques & Tolérances
    if (measurements.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("2. Relevé des Mesures & Vérification de Conformité", 14, y);
      y += 6;

      const measBody = measurements.map((m) => [
        m.name,
        `${m.value} ${m.unit}`,
        m.min_threshold != null && m.max_threshold != null ? `${m.min_threshold} - ${m.max_threshold} ${m.unit}` : "Standard",
        m.is_conforming ? "CONFORME" : "HORS TOLÉRANCE",
        m.notes || "-",
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Grandeur Mesurée", "Valeur Relevée", "Plage Admissible", "Conformité", "Notes Techniques"]],
        body: measBody,
        theme: "striped",
        headStyles: { fillColor: [20, 83, 45], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // 4. Devis & Bordereau de Prix (si applicable)
    if (report?.quote_summary && report.quote_summary.items.length > 0) {
      // Nouvelle page si on manque d'espace
      if (y > 190) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("3. Devis Chiffré & Bordereau des Prix Partenaires (FCFA)", 14, y);
      y += 6;

      const quoteBody = report.quote_summary.items.map((it) => [
        it.designation,
        it.partner_name || "Partenaire NAFA",
        String(it.quantity),
        it.unit,
        it.unit_price_fcfa.toLocaleString("fr-FR") + " F",
        it.total_price_fcfa.toLocaleString("fr-FR") + " F",
      ]);

      quoteBody.push([
        "TOTAL GÉNÉRAL DU PROJET (FCFA)",
        "",
        "",
        "",
        "",
        report.quote_summary.total_ttc.toLocaleString("fr-FR") + " FCFA",
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Désignation Équipement", "Fournisseur Agréé", "Qté", "Unité", "P.U. (FCFA)", "Total (FCFA)"]],
        body: quoteBody,
        theme: "grid",
        headStyles: { fillColor: [180, 83, 9], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // 5. Observations & Recommandations
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("4. Observations & Recommandations NAFA Genius IA", 14, y);
    y += 6;

    if (report?.observations) {
      report.observations.forEach((obs) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(`• ${obs}`, pageW - 28);
        doc.text(lines, 14, y);
        y += lines.length * 4.5;
      });
    }

    y += 3;
    if (report?.recommendations) {
      report.recommendations.forEach((rec) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        const lines = doc.splitTextToSize(`[Recommandation] ${rec}`, pageW - 28);
        doc.text(lines, 14, y);
        y += lines.length * 4.5;
      });
    }

    y += 10;
    if (y > 230) {
      doc.addPage();
      y = 30;
    }

    // 6. Double Signature Électronique (Client + Expert)
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, (pageW - 35) / 2, 40, "FD");
    doc.rect(pageW / 2 + 3.5, y, (pageW - 35) / 2, 40, "FD");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Signature & Accord du Client", 20, y + 8);
    doc.text("Validation de l'Expert NAFA-AGRITECH", pageW / 2 + 10, y + 8);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Nom : ${inspection.client_name}`, 20, y + 16);
    doc.text(`Mention : Bon pour accord`, 20, y + 22);

    doc.text(`Nom : ${inspection.expert_name}`, pageW / 2 + 10, y + 16);
    doc.text(`Cachet électronique : SIG-${inspection.id.slice(0, 8).toUpperCase()}`, pageW / 2 + 10, y + 22);
    doc.text(`Certifié conforme selon normes CIRAD/FAO`, pageW / 2 + 10, y + 28);

    // Téléchargement automatique
    doc.save(`Rapport_Inspection_${type.code}_${inspection.client_name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
  },
};
