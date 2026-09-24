/**
 * NAFA - AGRITECH : Compteur Dynamique Réel de la Plateforme
 * 
 * Zéro Donnée Fictive / Zéro Mock :
 * Calcule avec exactitude et transparence le nombre réel :
 * - D'agriculteurs (comptes réels enregistrés, parcelles locales ou distantes)
 * - D'éleveurs (comptes réels enregistrés, cheptels/troupeaux locaux ou distants)
 * - D'entreprises partenaires agréées (fournisseurs, banques, assurances, institutions)
 * - D'experts agronomiques & vétérinaires certifiés
 */

import { useState, useEffect, useCallback } from "react";
import { partnerStorage } from "./partnerStorage";
import { getStoredPhoneAccounts, getLocalSession } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformMetrics {
  farmersCount: number;
  breedersCount: number;
  partnersCount: number;
  expertsCount: number;
  totalActors: number;
  isRealData: true;
  lastUpdated: string;
}

const METRICS_CACHE_KEY = "nafa_live_platform_metrics_v1";

/**
 * Calcule les métriques réelles actuelles depuis le stockage local et Supabase
 */
export async function calculatePlatformMetrics(): Promise<PlatformMetrics> {
  const farmersSet = new Set<string>();
  const breedersSet = new Set<string>();
  const expertsSet = new Set<string>();
  const partnersSet = new Set<string>();

  // 1. Récupérer les entreprises partenaires réelles
  try {
    const partnerEntries = await partnerStorage.getEntries();
    partnerEntries.forEach((p) => {
      if (p.id) partnersSet.add(p.id);
    });
  } catch (err) {
    console.warn("[PlatformMetrics] Erreur lecture partenaires locaux:", err);
  }

  // 2. Récupérer les comptes enregistrés dans le registre téléphonique local
  try {
    const phoneAccounts = getStoredPhoneAccounts();
    Object.values(phoneAccounts).forEach((acc) => {
      const role = (acc.roles && acc.roles[0]) || "agriculteur";
      const identifier = acc.userId || acc.phone || acc.email;
      if (!identifier) return;

      if (role === "eleveur") {
        breedersSet.add(identifier);
      } else if (role === "expert" || role === "veterinaire" || role === "prestataire") {
        expertsSet.add(identifier);
      } else if (role === "partenaire") {
        partnersSet.add(identifier);
      } else {
        farmersSet.add(identifier);
      }
    });
  } catch (err) {
    console.warn("[PlatformMetrics] Erreur lecture comptes locaux:", err);
  }

  // 3. Inspecter la session locale courante
  try {
    const currentSession = getLocalSession();
    if (currentSession) {
      const role = (currentSession.roles && currentSession.roles[0]) || "agriculteur";
      const id = currentSession.userId || currentSession.phone || currentSession.email;
      if (id) {
        if (role === "eleveur") {
          breedersSet.add(id);
        } else if (role === "expert" || role === "veterinaire" || role === "prestataire") {
          expertsSet.add(id);
        } else if (role === "partenaire") {
          partnersSet.add(id);
        } else {
          farmersSet.add(id);
        }
      }
    }
  } catch (_e) {
    // ignore
  }

  // 4. Si connecté, synchroniser avec la base distante Supabase (comptes supplémentaires sans doublons)
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const { data: remoteProfiles } = await supabase
        .from("profiles")
        .select("id, role")
        .limit(500);

      if (remoteProfiles && Array.isArray(remoteProfiles)) {
        remoteProfiles.forEach((p: { id: string; role?: string }) => {
          if (!p.id) return;
          const role = p.role || "agriculteur";
          if (role === "eleveur") {
            breedersSet.add(p.id);
          } else if (role === "expert" || role === "veterinaire" || role === "prestataire") {
            expertsSet.add(p.id);
          } else if (role === "partenaire") {
            partnersSet.add(p.id);
          } else {
            farmersSet.add(p.id);
          }
        });
      }
    } catch (_e) {
      // Échec silencieux si pas d'accès réseau ou table inexistante
    }
  }

  const farmersCount = farmersSet.size;
  const breedersCount = breedersSet.size;
  const expertsCount = expertsSet.size;
  const partnersCount = partnersSet.size;
  const totalActors = farmersCount + breedersCount + expertsCount + partnersCount;

  const result: PlatformMetrics = {
    farmersCount,
    breedersCount,
    partnersCount,
    expertsCount,
    totalActors,
    isRealData: true,
    lastUpdated: new Date().toISOString(),
  };

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(METRICS_CACHE_KEY, JSON.stringify(result));
    }
  } catch (_e) {
    // ignore
  }

  return result;
}

/**
 * Récupère immédiatement le cache local de métriques si disponible
 */
export function getCachedPlatformMetrics(): PlatformMetrics | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(METRICS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlatformMetrics;
  } catch (_e) {
    return null;
  }
}

/**
 * Déclenche une notification de mise à jour des métriques dans l'application
 */
export function notifyMetricsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nafa:metrics_updated"));
  }
}

/**
 * Hook React pour afficher et écouter en direct les compteurs réels de la plateforme
 */
export function usePlatformMetrics() {
  const [metrics, setMetrics] = useState<PlatformMetrics>(() => {
    return (
      getCachedPlatformMetrics() || {
        farmersCount: 0,
        breedersCount: 0,
        partnersCount: 0,
        expertsCount: 0,
        totalActors: 0,
        isRealData: true,
        lastUpdated: new Date().toISOString(),
      }
    );
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await calculatePlatformMetrics();
      setMetrics(data);
    } catch (e) {
      console.warn("[usePlatformMetrics] Erreur calcul métriques:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handleEvent = () => {
      void refresh();
    };

    window.addEventListener("nafa:metrics_updated", handleEvent);
    window.addEventListener("storage", handleEvent);
    window.addEventListener("online", handleEvent);

    return () => {
      window.removeEventListener("nafa:metrics_updated", handleEvent);
      window.removeEventListener("storage", handleEvent);
      window.removeEventListener("online", handleEvent);
    };
  }, [refresh]);

  return { metrics, loading, refresh };
}
