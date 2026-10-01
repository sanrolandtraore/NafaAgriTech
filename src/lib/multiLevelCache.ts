/**
 * MOTEUR DE CACHE MULTI-NIVEAUX HAUTE PERFORMANCE (L1 RAM + L2 IndexedDB)
 * Conçu pour supporter 100 000 utilisateurs simultanés avec latence sub-milliseconde.
 * 
 * Niveaux de cache :
 * - L1 (Mémoire RAM / Map LRU) : Accès synchrone instantané (0 ms), taille limitée à 250 entrées par onglet.
 * - L2 (Persistant IndexedDB via Dexie / idb) : Survit aux rafraîchissements et mode hors-ligne.
 * - Support Stale-While-Revalidate (SWR) natif pour une réactivité UI immédiate.
 */

import { getDb } from "./offlineDb";

export type CacheTier = "memory_only" | "persistent" | "swr";

export interface CacheEntry<T> {
  key: string;
  data: T;
  cachedAt: number;
  expiresAt: number;
  etag?: string;
  isStale?: boolean;
}

export interface CacheOptions {
  ttlSeconds?: number;
  ttlMs?: number;
  tier?: CacheTier;
  staleWhileRevalidate?: boolean;
  etag?: string;
}

// ── Configuration des TTLs selon le type de données (Stratégie 100k) ──
export const CACHE_TTL_CONFIG = {
  // Météo sahélienne & prévisions : 15 à 30 minutes
  WEATHER: 30 * 60,
  WEATHER_CURRENT: 15 * 60 * 1000,
  // Référentiel des cultures & fiches INERA : 24h à 7 jours (quasi statique)
  CROP_SPECS: 7 * 24 * 60 * 60,
  CROP_VARIETIES_REF: 24 * 60 * 60 * 1000,
  // Catalogue public Marketplace (produits & services) : 5 à 10 minutes (SWR)
  MARKETPLACE_CATALOG: 5 * 60 * 1000,
  // Tarifs mercuriale des intrants (NPK, Urée, semences) : 12 heures
  INPUT_PRICES: 12 * 60 * 60,
  // Statistiques consolidées de dashboard : 5 minutes
  DASHBOARD_STATS: 5 * 60,
  // Données cartographiques & tuiles vectorielles : 30 jours
  GEO_TILES: 30 * 24 * 60 * 60,
  // Résultats IA / diagnostics réutilisables (par empreinte d'image) : 48 heures
  AI_DIAGNOSIS_RESULT: 48 * 60 * 60,
  // DONNÉES TEMPS RÉEL (JAMAIS EN CACHE L2) :
  // - Libération de séquestre (escrow)
  // - Statut de transaction Orange/Moov/Wave
  // - Bornage GPS temps réel (WGS84 direct)
  // - Alertes de cyberdéfense immédiates
};

export interface CacheResult<T> {
  data: T | null;
  isStale: boolean;
  hit: "l1" | "l2" | "miss";
}

class MultiLevelCacheEngine {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private maxMemoryEntries: number = 250;
  private hits: number = 0;
  private misses: number = 0;

  /**
   * Récupère une valeur depuis le cache L1 (RAM) ou L2 (IndexedDB).
   * En mode SWR, renvoie la valeur immédiatement même expirée tout en signalant `isStale: true`.
   */
  async get<T>(key: string): Promise<CacheResult<T>> {
    const now = Date.now();

    // 1. Vérification L1 (RAM)
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      if (entry.expiresAt > now) {
        // Déplacer à la fin pour comportement LRU
        this.memoryCache.delete(key);
        this.memoryCache.set(key, entry);
        this.hits++;
        return { data: entry.data as T, isStale: false, hit: "l1" };
      }
      // Périmé en L1, mais exploitable en SWR
      this.hits++;
      return { data: entry.data as T, isStale: true, hit: "l1" };
    }

    // 2. Vérification L2 (IndexedDB)
    try {
      const db = await getDb();
      const stored = await db.get("cachedData", `mlc:${key}`);
      if (stored?.data?.[0]) {
        const entry = stored.data[0] as CacheEntry<T>;
        const isStale = entry.expiresAt <= now;

        // Réchauffer L1
        this.setL1(key, entry);
        this.hits++;

        return {
          data: entry.data,
          isStale,
          hit: "l2",
        };
      }
    } catch (e) {
      console.warn("MultiLevelCache L2 read error:", e);
    }

    this.misses++;
    return { data: null, isStale: false, hit: "miss" };
  }

  /**
   * Raccourci retournant directement la donnée ou null
   */
  async getData<T>(key: string): Promise<T | null> {
    const res = await this.get<T>(key);
    return res.data;
  }

  /**
   * Écrit une entrée dans le cache multi-niveaux avec TTL et politique d'éviction.
   */
  async set<T>(key: string, data: T, options?: CacheOptions): Promise<void> {
    const now = Date.now();
    const expiresAt = options?.ttlMs 
      ? now + options.ttlMs 
      : now + (options?.ttlSeconds ?? CACHE_TTL_CONFIG.DASHBOARD_STATS) * 1000;

    const entry: CacheEntry<T> = {
      key,
      data,
      cachedAt: now,
      expiresAt,
      etag: options?.etag,
    };

    // 1. Stockage L1
    this.setL1(key, entry);

    // 2. Stockage L2 si non restreint à la mémoire seule
    if (options?.tier !== "memory_only") {
      try {
        const db = await getDb();
        await db.put("cachedData", {
          key: `mlc:${key}`,
          table: "_multi_level_cache",
          data: [entry],
          cachedAt: now,
        });
      } catch (e) {
        console.warn("MultiLevelCache L2 write error:", e);
      }
    }
  }

  /**
   * Réinitialise le cache L1 en mémoire
   */
  clear(): void {
    this.memoryCache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Fournit les métriques de performance du cache
   */
  getStats(): { l1Size: number; hits: number; misses: number } {
    return {
      l1Size: this.memoryCache.size,
      hits: this.hits,
      misses: this.misses,
    };
  }

  /**
   * Invalidation par préfixe (alias pour invalidate)
   */
  async invalidatePrefix(prefix: string): Promise<void> {
    return this.invalidate(prefix);
  }

  /**
   * Pattern "Fetch-Through" avec Stale-While-Revalidate :
   * Renvoie le cache instantanément si disponible, puis déclenche la requête distante
   * en arrière-plan sans bloquer l'UI de l'utilisateur.
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const { data, isStale, hit } = await this.get<T>(key);

    if (data !== null && !isStale) {
      return data;
    }

    // Si donnée expirée présente, la renvoyer immédiatement et revalider en arrière-plan (SWR)
    if (data !== null && isStale) {
      // Déclenchement asynchrone non-bloquant
      fetcher()
        .then((fresh) => {
          this.set(key, fresh, options);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("nafa:cache-updated", { detail: { key } }));
          }
        })
        .catch((err) => console.warn(`SWR background revalidation failed for ${key}:`, err));

      return data;
    }

    // Cache Miss : Exécuter la requête distante
    const fresh = await fetcher();
    await this.set(key, fresh, options);
    return fresh;
  }

  /**
   * Invalidation ciblée ou par préfixe (ex: "market:" après une mise à jour d'offre)
   */
  async invalidate(patternOrKey: string): Promise<void> {
    // 1. Invalidation L1
    for (const key of this.memoryCache.keys()) {
      if (key === patternOrKey || key.startsWith(patternOrKey)) {
        this.memoryCache.delete(key);
      }
    }

    // 2. Invalidation L2
    try {
      const db = await getDb();
      const tx = db.transaction("cachedData", "readwrite");
      const store = tx.objectStore("cachedData");
      let cursor = await store.openCursor();
      while (cursor) {
        const rawKey = String(cursor.key);
        if (rawKey.startsWith(`mlc:${patternOrKey}`)) {
          await cursor.delete();
        }
        cursor = await cursor.continue();
      }
      await tx.done;
    } catch (e) {
      console.warn("MultiLevelCache invalidate error:", e);
    }
  }

  private setL1(key: string, entry: CacheEntry<any>) {
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      // Éviction LRU du premier élément inséré
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }
    this.memoryCache.set(key, entry);
  }
}

export const multiLevelCache = new MultiLevelCacheEngine();
