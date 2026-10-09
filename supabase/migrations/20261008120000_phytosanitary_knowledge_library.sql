-- ============================================================================
-- BIBLIOTHÈQUE PHYTOSANITAIRE INTELLIGENTE PROPRIÉTAIRE NAFA-AGRITECH
-- Référentiels : TOM2024 (Burkina Faso), INERA Farako-Bâ, CSP-CILSS, PlantDoc (CC-BY), PlantwisePlus (CABI)
-- ============================================================================

-- 1. Table: crops (Cultures prioritaires au Sahel & Afrique de l'Ouest)
CREATE TABLE IF NOT EXISTS public.crops (
  id TEXT PRIMARY KEY,
  common_name_fr TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  local_names JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"moore": "Kama", "dioula": "Kaba", "fulfulde": "Kamanaari"}
  category TEXT NOT NULL CHECK (category IN ('cereale', 'maraichage', 'legumineuse', 'oleagineux', 'arboriculture', 'racine_tubercule', 'plante_fibre')),
  growth_stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  icon_name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Table: sources (Sources scientifiques et réglementaires vérifiées)
CREATE TABLE IF NOT EXISTS public.sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  institution TEXT NOT NULL, -- 'INERA', 'CSP-CILSS', 'CABI_Plantwise', 'TOM2024', 'PlantDoc', 'CNSF', 'Yara'
  document_reference TEXT,
  url TEXT,
  license_type TEXT NOT NULL, -- 'CC-BY-4.0', 'Public_Domain', 'INERA_Accord', 'Open_Access'
  redistribution_terms TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Table: plant_health_cases (Fiches sanitaires végétales)
CREATE TABLE IF NOT EXISTS public.plant_health_cases (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  disease_name_fr TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  local_names JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT NOT NULL CHECK (category IN ('fongique', 'bacterienne', 'virale', 'ravageur', 'carence', 'stress_abiotique')),
  affected_organs JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['feuilles', 'tiges', 'fruits', 'racines', 'collet', 'epis']
  epidemiology TEXT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('critique', 'eleve', 'moyen', 'faible')),
  source_id TEXT REFERENCES public.sources(id) ON DELETE SET NULL,
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('draft', 'pending', 'validated', 'archived')),
  last_verified_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Table: symptoms (Symptômes phénotypiques atomiques)
CREATE TABLE IF NOT EXISTS public.symptoms (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES public.plant_health_cases(id) ON DELETE CASCADE,
  organ TEXT NOT NULL, -- 'feuilles', 'tiges', 'fruits', 'collet', 'racines'
  description_fr TEXT NOT NULL,
  visual_pattern TEXT, -- 'halo_chlorotique', 'taches_concentriques', 'flétrissement_unilateral', 'galeries', 'mosaïque'
  color_phenotype TEXT, -- 'jaunissement', 'brunissement', 'necrose_noire', 'poussiere_blanche', 'argenture'
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Table: case_images (Galerie photos de référence avec métadonnées d'acquisition)
CREATE TABLE IF NOT EXISTS public.case_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  case_id TEXT NOT NULL REFERENCES public.plant_health_cases(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption_fr TEXT NOT NULL,
  organ TEXT NOT NULL,
  growth_stage TEXT,
  is_reference_hero BOOLEAN NOT NULL DEFAULT false,
  dataset_source TEXT NOT NULL, -- 'TOM2024_BF', 'PlantDoc', 'INERA_Champ', 'Plantwise'
  license TEXT NOT NULL, -- 'CC-BY-4.0', 'INERA_Proprietary', 'Public_Domain'
  photographer TEXT,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  country TEXT DEFAULT 'BF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Table: diagnostic_rules (Règles différentielles & confirmation au champ)
CREATE TABLE IF NOT EXISTS public.diagnostic_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  case_id TEXT NOT NULL REFERENCES public.plant_health_cases(id) ON DELETE CASCADE,
  required_symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
  confusing_cases JSONB NOT NULL DEFAULT '[]'::jsonb, -- Cas entraînant des confusions diagnostiques
  differentiation_key TEXT NOT NULL, -- Critère déterminant permettant de trancher
  favorable_weather JSONB NOT NULL DEFAULT '{}'::jsonb, -- Saisons, température (°C), hygrométrie (%)
  confirmation_method TEXT NOT NULL, -- Ex: 'Test du verre d'eau pour Ralstonia', 'Loupe x20 pour acariens'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Table: treatment_protocols (Protocoles de traitement & lutte intégrée IPM)
CREATE TABLE IF NOT EXISTS public.treatment_protocols (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  case_id TEXT NOT NULL REFERENCES public.plant_health_cases(id) ON DELETE CASCADE,
  protocol_type TEXT NOT NULL CHECK (protocol_type IN ('preventif', 'biologique', 'chimique_csp', 'cultural')),
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  active_substance TEXT, -- Ex: 'Azadirachtine', 'Cuivre hydroxyde'
  dosage TEXT NOT NULL,
  pre_harvest_interval_days INTEGER, -- DAR (jours)
  csp_registration_number TEXT, -- Numéro d'homologation CSP-CILSS
  safety_warnings TEXT,
  is_certified_inera BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Table: expert_validations (Historique des validations par les pairs agronomes)
CREATE TABLE IF NOT EXISTS public.expert_validations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  case_id TEXT NOT NULL REFERENCES public.plant_health_cases(id) ON DELETE CASCADE,
  expert_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expert_name TEXT NOT NULL,
  institution TEXT NOT NULL, -- 'INERA', 'Direction Protection Végétaux (DPV)', 'Ordre Agronomes BF'
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'correction_requested')),
  review_notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour requêtes performantes & recherche instantanée
CREATE INDEX IF NOT EXISTS idx_ph_cases_crop ON public.plant_health_cases (crop_id);
CREATE INDEX IF NOT EXISTS idx_ph_cases_category ON public.plant_health_cases (category);
CREATE INDEX IF NOT EXISTS idx_ph_cases_status ON public.plant_health_cases (validation_status);
CREATE INDEX IF NOT EXISTS idx_symptoms_case ON public.symptoms (case_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_organ ON public.symptoms (organ);
CREATE INDEX IF NOT EXISTS idx_case_images_case ON public.case_images (case_id);
CREATE INDEX IF NOT EXISTS idx_case_images_hero ON public.case_images (is_reference_hero);
CREATE INDEX IF NOT EXISTS idx_diag_rules_case ON public.diagnostic_rules (case_id);
CREATE INDEX IF NOT EXISTS idx_treatments_case ON public.treatment_protocols (case_id);
CREATE INDEX IF NOT EXISTS idx_treatments_type ON public.treatment_protocols (protocol_type);
CREATE INDEX IF NOT EXISTS idx_validations_case ON public.expert_validations (case_id);

-- Politiques RLS (Row Level Security)
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_health_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_validations ENABLE ROW LEVEL SECURITY;

-- Lecture libre pour tous les utilisateurs (Agriculteurs, Éleveurs, Experts)
CREATE POLICY "Lecture crops pour tous" ON public.crops FOR SELECT USING (true);
CREATE POLICY "Lecture sources pour tous" ON public.sources FOR SELECT USING (true);
CREATE POLICY "Lecture plant_health_cases pour tous" ON public.plant_health_cases FOR SELECT USING (true);
CREATE POLICY "Lecture symptoms pour tous" ON public.symptoms FOR SELECT USING (true);
CREATE POLICY "Lecture case_images pour tous" ON public.case_images FOR SELECT USING (true);
CREATE POLICY "Lecture diagnostic_rules pour tous" ON public.diagnostic_rules FOR SELECT USING (true);
CREATE POLICY "Lecture treatment_protocols pour tous" ON public.treatment_protocols FOR SELECT USING (true);
CREATE POLICY "Lecture expert_validations pour tous" ON public.expert_validations FOR SELECT USING (true);

-- Écriture & Validation réservées aux utilisateurs authentifiés (Agronomes / Experts)
CREATE POLICY "Gestion plant_health_cases par authentifiés" ON public.plant_health_cases 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gestion symptoms par authentifiés" ON public.symptoms 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gestion case_images par authentifiés" ON public.case_images 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gestion diagnostic_rules par authentifiés" ON public.diagnostic_rules 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gestion treatment_protocols par authentifiés" ON public.treatment_protocols 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Gestion expert_validations par authentifiés" ON public.expert_validations 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
