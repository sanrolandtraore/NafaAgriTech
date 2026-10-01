-- ============================================================================
-- NAFA-AGRITECH: Migration d'optimisation pour 100 000 utilisateurs simultanés
-- Haute Concurrence, Indexation Composite, File de Traitement Asynchrone & RLS Optimisées
-- Date: 2026-10-01
-- ============================================================================

-- 1. Index composites haute performance pour la Marketplace (Vitrine & Commandes)
-- Évite les Sequential Scans et optimise le tri DESC + pagination à forte charge

DO $$ 
BEGIN
  -- Marketplace Products
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_products') THEN
    CREATE INDEX IF NOT EXISTS idx_marketplace_products_cat_status_created 
      ON public.marketplace_products (category, status, created_at DESC);
      
    CREATE INDEX IF NOT EXISTS idx_marketplace_products_vendor_status 
      ON public.marketplace_products (vendor_id, status);

    CREATE INDEX IF NOT EXISTS idx_marketplace_products_active_covering
      ON public.marketplace_products (status, created_at DESC)
      WHERE status = 'available';
  END IF;

  -- Marketplace Orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_orders') THEN
    CREATE INDEX IF NOT EXISTS idx_marketplace_orders_client_status_created 
      ON public.marketplace_orders (client_id, status, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_marketplace_orders_provider_status_created 
      ON public.marketplace_orders (provider_id, status, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status_created 
      ON public.marketplace_orders (status, created_at DESC);
  END IF;

  -- Parcels / Parcelles agricoles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parcels') THEN
    CREATE INDEX IF NOT EXISTS idx_parcels_user_created 
      ON public.parcels (user_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_parcels_crop_type 
      ON public.parcels (crop_type) WHERE crop_type IS NOT NULL;
  END IF;

  -- Farm Visits / Inspections
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'farm_visits') THEN
    CREATE INDEX IF NOT EXISTS idx_farm_visits_auditor_status 
      ON public.farm_visits (auditor_id, status, scheduled_date DESC);

    CREATE INDEX IF NOT EXISTS idx_farm_visits_farm_status 
      ON public.farm_visits (farm_id, status);
  END IF;

  -- Profiles & Auth lookups
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_role_created 
      ON public.profiles (role, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_profiles_phone_lookup 
      ON public.profiles (phone) WHERE phone IS NOT NULL;
  END IF;
END $$;

-- 2. Table pour l'orchestration des tâches asynchrones en arrière-plan (Background Jobs)
-- Supporte l'idempotence, le rate limiting applicatif, les retries et le status polling
CREATE TABLE IF NOT EXISTS public.background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  idempotency_key TEXT UNIQUE,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index critique pour le polling ultra-rapide des workers sans verrouillage
CREATE INDEX IF NOT EXISTS idx_background_jobs_queue_poll 
  ON public.background_jobs (priority DESC, scheduled_at ASC) 
  WHERE status = 'pending';

-- Index pour la consultation du statut par le client frontend
CREATE INDEX IF NOT EXISTS idx_background_jobs_user_status_created 
  ON public.background_jobs (user_id, status, created_at DESC);

-- Index pour la vérification rapide d'idempotence
CREATE INDEX IF NOT EXISTS idx_background_jobs_idempotency 
  ON public.background_jobs (idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- 3. Sécurité RLS Durcie et Haute Performance
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

-- Note d'ingénierie 100k : l'utilisation de (SELECT auth.uid()) met en cache le résultat
-- de la sous-requête dans le plan d'exécution PostgreSQL, évitant l'évaluation par-row.
DROP POLICY IF EXISTS "Users can view their own background jobs" ON public.background_jobs;
CREATE POLICY "Users can view their own background jobs"
  ON public.background_jobs
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can enqueue background jobs" ON public.background_jobs;
CREATE POLICY "Users can enqueue background jobs"
  ON public.background_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Service role has full access to background jobs" ON public.background_jobs;
CREATE POLICY "Service role has full access to background jobs"
  ON public.background_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Procédure de purge automatique des anciens jobs pour éviter le table bloat
CREATE OR REPLACE FUNCTION public.cleanup_stale_background_jobs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprime les jobs terminés ou échoués de plus de 7 jours
  DELETE FROM public.background_jobs
  WHERE status IN ('completed', 'failed', 'cancelled')
    AND completed_at < now() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
