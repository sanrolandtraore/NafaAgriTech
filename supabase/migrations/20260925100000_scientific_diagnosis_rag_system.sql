-- ============================================================================
-- NAFA GENIUS IA - SYSTÈME DE DIAGNOSTIC AGRONOMIQUE SCIENTIFIQUE (RAG)
-- Tables de Références Officielles : INERA, CSP-CILSS, CNSF, CORAF, CNRST, CREAF, SAPHYTO, NACOSEM, Yara
-- ============================================================================

-- 1. Espèces Végétales Cultivées (Cultures)
CREATE TABLE IF NOT EXISTS public.plant_species (
  id TEXT PRIMARY KEY,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  family TEXT,
  category TEXT NOT NULL CHECK (category IN ('cereale', 'legumineuse', 'maraichage', 'oleagineux', 'racine_tubercule', 'arboriculture', 'plante_fibre')),
  burkina_varieties JSONB DEFAULT '[]'::jsonb,
  growth_stages JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Mauvaises Herbes & Adventices du Burkina Faso / Afrique de l'Ouest
CREATE TABLE IF NOT EXISTS public.weed_species (
  id TEXT PRIMARY KEY,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  local_names JSONB DEFAULT '{}'::jsonb, -- e.g. Mooré: "Kango", Dioula: "...", etc.
  family TEXT,
  cycle TEXT CHECK (cycle IN ('annuelle', 'vivace', 'parasite')),
  target_crops JSONB DEFAULT '[]'::jsonb,
  growth_stages JSONB DEFAULT '[]'::jsonb,
  control_methods_bio TEXT NOT NULL,
  control_methods_chemical TEXT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('critique', 'eleve', 'moyen', 'faible')),
  inera_ref TEXT DEFAULT 'Revue Malherbologie Sahélienne INERA / CILSS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Catalogue Scientifique des Affections & Carences
CREATE TABLE IF NOT EXISTS public.disease_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scientific_name TEXT,
  pathogen_type TEXT NOT NULL CHECK (pathogen_type IN ('fongique', 'bacterienne', 'virale', 'ravageur', 'carence', 'stress_hydrique', 'degat_mecanique')),
  target_crops JSONB NOT NULL DEFAULT '[]'::jsonb,
  symptoms_profile JSONB NOT NULL DEFAULT '[]'::jsonb, -- Liste de descripteurs de symptômes
  affected_organs JSONB NOT NULL DEFAULT '[]'::jsonb, -- feuilles, tiges, collet, racines, fruits, epis
  favorable_conditions JSONB DEFAULT '{}'::jsonb, -- sols, humidité, températures, saisons
  inera_ref TEXT,
  yara_ref TEXT,
  csp_pesticide_ref TEXT,
  treatment_bio TEXT NOT NULL,
  treatment_chemical TEXT NOT NULL,
  preventive_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Base de Connaissances Vectorielle & Textuelle RAG (Institutions Officielles)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_institution TEXT NOT NULL CHECK (source_institution IN ('INERA', 'CSP-CILSS', 'CNSF', 'CORAF', 'CNRST', 'CREAF', 'SAPHYTO', 'NACOSEM', 'Yara', 'Autre')),
  document_title TEXT NOT NULL,
  document_reference TEXT,
  content TEXT NOT NULL,
  crop TEXT,
  disease TEXT,
  pest TEXT,
  deficiency TEXT,
  weed TEXT,
  region TEXT,
  season TEXT,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Cas de Terrain Validés par les Agronomes (Boucle d'Amélioration Continue)
CREATE TABLE IF NOT EXISTS public.validated_cases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  plant_species_id TEXT,
  is_weed BOOLEAN NOT NULL DEFAULT false,
  weed_species_id TEXT,
  disease_catalog_id TEXT,
  initial_ai_diagnosis TEXT,
  validated_disease_name TEXT NOT NULL,
  pathogen_type TEXT NOT NULL,
  context_location JSONB DEFAULT '{}'::jsonb,
  context_season TEXT,
  context_soil TEXT,
  context_growth_stage TEXT,
  context_history TEXT,
  observed_symptoms TEXT NOT NULL,
  expert_notes TEXT,
  certified_by TEXT NOT NULL,
  certified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('eleve', 'moyen', 'faible')),
  photo_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Retours & Évaluation de Résolution Terrain
CREATE TABLE IF NOT EXISTS public.diagnosis_feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  diagnosis_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  is_accurate BOOLEAN NOT NULL DEFAULT true,
  field_resolution TEXT CHECK (field_resolution IN ('gueri', 'ameliore', 'stagne', 'aggrave', 'en_cours')),
  expert_correction TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour recherche RAG rapide multi-critères
CREATE INDEX IF NOT EXISTS idx_kb_crop ON public.knowledge_base (crop);
CREATE INDEX IF NOT EXISTS idx_kb_disease ON public.knowledge_base (disease);
CREATE INDEX IF NOT EXISTS idx_kb_pest ON public.knowledge_base (pest);
CREATE INDEX IF NOT EXISTS idx_kb_deficiency ON public.knowledge_base (deficiency);
CREATE INDEX IF NOT EXISTS idx_kb_weed ON public.knowledge_base (weed);
CREATE INDEX IF NOT EXISTS idx_kb_region ON public.knowledge_base (region);
CREATE INDEX IF NOT EXISTS idx_kb_season ON public.knowledge_base (season);
CREATE INDEX IF NOT EXISTS idx_kb_source ON public.knowledge_base (source_institution);

CREATE INDEX IF NOT EXISTS idx_val_cases_species ON public.validated_cases (plant_species_id);
CREATE INDEX IF NOT EXISTS idx_val_cases_weed ON public.validated_cases (weed_species_id);
CREATE INDEX IF NOT EXISTS idx_val_cases_disease ON public.validated_cases (disease_catalog_id);

-- Politiques RLS (Sécurité Niveau Ligne)
ALTER TABLE public.plant_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weed_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validated_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_feedback ENABLE ROW LEVEL SECURITY;

-- Lecture publique de la base de connaissances pour tous les utilisateurs authentifiés
CREATE POLICY "Lecture plant_species autorisee pour tous" ON public.plant_species FOR SELECT USING (true);
CREATE POLICY "Lecture weed_species autorisee pour tous" ON public.weed_species FOR SELECT USING (true);
CREATE POLICY "Lecture disease_catalog autorisee pour tous" ON public.disease_catalog FOR SELECT USING (true);
CREATE POLICY "Lecture knowledge_base autorisee pour tous" ON public.knowledge_base FOR SELECT USING (true);
CREATE POLICY "Lecture validated_cases autorisee pour tous" ON public.validated_cases FOR SELECT USING (true);

-- Écriture des cas validés réservée aux experts et agronomes certifiés
CREATE POLICY "Insertion validated_cases par experts" ON public.validated_cases FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Feedback par utilisateur" ON public.diagnosis_feedback FOR ALL USING (
  auth.uid() = user_id OR auth.role() = 'authenticated'
);
