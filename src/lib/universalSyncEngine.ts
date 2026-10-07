/**
 * NAFA - AGRITECH : Moteur Universel de Synchronisation Globale
 * 
 * Synchronise automatiquement et de manière centralisée TOUTES les modifications partout :
 * 1. File Offline-First IDB (Tables Supabase / PostgREST) via syncManager.ts
 * 2. File Dexie DB (Records d'intervention, diagnostics, cas validés) via dexieDb.ts
 * 3. File Field Designer & Studio CAO/3D (Exploitations, Parcelles, Irrigation, Devis) via fieldDesignerStorage.ts
 * 4. Canaux Supabase Realtime (Abonnement en direct aux tables clés : farms, fields, offers, quotes, alerts)
 * 5. Broadcast Channel inter-onglets (pour répercuter instantanément les changements sur tous les onglets ouverts)
 * 6. Événements globaux ('nafa:sync-completed', 'nafa:data-updated', 'online')
 * 7. Résilience réseau (anti-thundering herd avec jitter, reconnexion automatique, cycle de vérification périodique)
 */

import { supabase } from "@/integrations/supabase/client";
import { processSyncQueue, syncOnReconnect } from "./syncManager";
import { 
  syncPendingRecords, 
  getSyncCounts, 
  onSyncStatusChange,
  resolveStuckSyncErrors 
} from "./dexieDb";
import { fieldDesignerStorage, subscribeToSyncState } from "./fieldDesignerStorage";
import { toast } from "sonner";

export interface UniversalSyncSummary {
  status: "idle" | "syncing" | "synced" | "error" | "offline";
  totalPending: number;
  totalSynced: number;
  totalFailed: number;
  lastSyncedAt: string | null;
  details: {
    offlineDbPending: number;
    dexiePending: number;
    fieldDesignerPending: number;
  };
}

type UniversalSyncListener = (summary: UniversalSyncSummary) => void;
const listeners = new Set<UniversalSyncListener>();

let isGlobalSyncRunning = false;
let autoSyncIntervalId: any = null;
let broadcastChannel: BroadcastChannel | null = null;
let realtimeSubscription: any = null;

let currentSummary: UniversalSyncSummary = {
  status: typeof navigator !== "undefined" && navigator.onLine ? "synced" : "offline",
  totalPending: 0,
  totalSynced: 0,
  totalFailed: 0,
  lastSyncedAt: null,
  details: {
    offlineDbPending: 0,
    dexiePending: 0,
    fieldDesignerPending: 0,
  },
};

function updateSummary(partial: Partial<UniversalSyncSummary>) {
  currentSummary = { ...currentSummary, ...partial };
  listeners.forEach((fn) => fn(currentSummary));
}

// ── Initialisation du BroadcastChannel inter-onglets ──
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel("nafa_universal_sync_channel");
    broadcastChannel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === "SYNC_TRIGGERED") {
        // Un autre onglet a lancé la synchro ou mis à jour une donnée
        notifyAppOfUpdate(payload?.source || "cross-tab");
      } else if (type === "DATA_MODIFIED") {
        notifyAppOfUpdate(payload?.table || "unknown");
      }
    };
  } catch (e) {
    console.warn("BroadcastChannel indisponible:", e);
  }
}

/**
 * Notifie l'application complète (tous les hooks useOfflineData, composants et pages)
 * qu'une mise à jour de données est survenue.
 */
export function notifyAppOfUpdate(sourceTable?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("nafa:sync-completed", { detail: { source: sourceTable, timestamp: Date.now() } })
  );
  window.dispatchEvent(
    new CustomEvent("nafa:data-updated", { detail: { table: sourceTable, timestamp: Date.now() } })
  );
}

/**
 * Diffuse à tous les onglets du navigateur qu'une modification a été enregistrée
 */
export function broadcastDataChange(table: string, data?: any) {
  notifyAppOfUpdate(table);
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: "DATA_MODIFIED",
        payload: { table, data, timestamp: Date.now() },
      });
    } catch (_e) {}
  }
}

/**
 * Récupère le décompte cumulé de toutes les modifications locales en attente
 */
export async function computeGlobalPendingCount(): Promise<{
  totalPending: number;
  offlineDbPending: number;
  dexiePending: number;
  fieldDesignerPending: number;
}> {
  let offlineDbPending = 0;
  let dexiePending = 0;
  let fieldDesignerPending = 0;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const { getSyncQueueCount } = await import("./offlineDb");
      offlineDbPending = await getSyncQueueCount(user.id);
    }
  } catch (_e) {}

  try {
    const dexieCounts = await getSyncCounts();
    dexiePending = dexieCounts.pending + dexieCounts.error;
  } catch (_e) {}

  try {
    fieldDesignerPending = await fieldDesignerStorage.getSyncQueueCount();
  } catch (_e) {}

  const totalPending = offlineDbPending + dexiePending + fieldDesignerPending;
  return { totalPending, offlineDbPending, dexiePending, fieldDesignerPending };
}

/**
 * Lance la synchronisation globale de TOUS les modules et bases locales vers Supabase
 * @param options.silent - Si true, pas de toasts intempestifs (ex: synchro de fond)
 */
export async function syncAllDatastores(options: { silent?: boolean } = {}): Promise<{
  synced: number;
  failed: number;
}> {
  if (isGlobalSyncRunning) {
    return { synced: 0, failed: 0 };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    updateSummary({ status: "offline" });
    return { synced: 0, failed: 0 };
  }

  isGlobalSyncRunning = true;
  updateSummary({ status: "syncing" });

  if (!options.silent) {
    const { totalPending } = await computeGlobalPendingCount();
    if (totalPending > 0) {
      toast.info(`Synchronisation globale de ${totalPending} modification(s) en cours...`);
    }
  }

  let totalSynced = 0;
  let totalFailed = 0;

  try {
    // 1. Synchronisation de la file IndexedDB offlineDb (Supabase tables)
    try {
      const offlineRes = await processSyncQueue();
      totalSynced += offlineRes.synced;
      totalFailed += offlineRes.failed;
    } catch (e) {
      console.warn("Erreur sync offlineDb:", e);
      totalFailed++;
    }

    // 2. Synchronisation de Dexie DB (Records, diagnostics, interventions)
    try {
      const dexieRes = await syncPendingRecords();
      totalSynced += dexieRes.synced;
      totalFailed += dexieRes.failed;
    } catch (e) {
      console.warn("Erreur sync Dexie:", e);
      totalFailed++;
    }

    // 3. Synchronisation de Field Designer (Exploitations, Parcelles, Irrigation, Devis)
    try {
      const fieldRes = await fieldDesignerStorage.processSyncQueue();
      totalSynced += fieldRes.synced;
      totalFailed += fieldRes.failed;
    } catch (e) {
      console.warn("Erreur sync Field Designer:", e);
      totalFailed++;
    }

    // Calcul des éléments restants
    const counts = await computeGlobalPendingCount();
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    updateSummary({
      status: counts.totalPending === 0 ? "synced" : totalFailed > 0 ? "error" : "synced",
      totalPending: counts.totalPending,
      totalSynced: currentSummary.totalSynced + totalSynced,
      totalFailed: currentSummary.totalFailed + totalFailed,
      lastSyncedAt: nowTime,
      details: counts,
    });

    // Notifier toute l'application que les données ont été synchronisées
    notifyAppOfUpdate("all");

    // Broadcaster aux autres onglets
    if (broadcastChannel && totalSynced > 0) {
      try {
        broadcastChannel.postMessage({
          type: "SYNC_TRIGGERED",
          payload: { synced: totalSynced, timestamp: Date.now() },
        });
      } catch (_e) {}
    }

    if (!options.silent) {
      if (totalSynced > 0) {
        toast.success(`Synchronisation terminée : ${totalSynced} mise(s) à jour envoyée(s) partout.`);
      } else if (counts.totalPending === 0) {
        toast.success("Toutes les données sont parfaitement à jour sur la plateforme.");
      }
    }
  } catch (err) {
    console.error("Erreur durant la synchronisation universelle:", err);
    updateSummary({ status: "error" });
  } finally {
    isGlobalSyncRunning = false;
  }

  return { synced: totalSynced, failed: totalFailed };
}

/**
 * Configure les abonnements Realtime Supabase pour recevoir les mises à jour
 * des autres utilisateurs/terminaux en direct
 */
export function initSupabaseRealtimeSync(): () => void {
  if (realtimeSubscription) return () => {};

  try {
    const channel = supabase
      .channel("nafa-global-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "farms" },
        () => notifyAppOfUpdate("farms")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parcels" },
        () => notifyAppOfUpdate("parcels")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        () => notifyAppOfUpdate("services")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers" },
        () => notifyAppOfUpdate("offers")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quote_requests" },
        () => notifyAppOfUpdate("quote_requests")
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Realtime actif
        }
      });

    realtimeSubscription = channel;

    return () => {
      if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription);
        realtimeSubscription = null;
      }
    };
  } catch (e) {
    console.warn("Realtime Supabase non disponible:", e);
    return () => {};
  }
}

/**
 * Démarre le service global de synchronisation en arrière-plan
 * (Listeners de reconnexion, intervalle d'auto-sync et écouteurs d'état)
 */
export function startUniversalSyncEngine(intervalSeconds = 60): () => void {
  if (typeof window === "undefined") return () => {};

  // 1. Initialiser le décompte initial
  computeGlobalPendingCount().then((details) => {
    updateSummary({
      totalPending: details.totalPending,
      details,
      status: navigator.onLine ? (details.totalPending > 0 ? "syncing" : "synced") : "offline",
    });
  });

  // 2. Écouter les changements en ligne / hors-ligne
  const handleOnline = () => {
    updateSummary({ status: "syncing" });
    // Délai aléatoire anti-collision (Jitter)
    const jitter = 500 + Math.floor(Math.random() * 2000);
    setTimeout(() => {
      syncAllDatastores({ silent: false });
    }, jitter);
  };

  const handleOffline = () => {
    updateSummary({ status: "offline" });
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // 3. Connecter les listeners de Dexie et Field Designer
  const unsubDexie = onSyncStatusChange((dCounts) => {
    computeGlobalPendingCount().then((details) => {
      updateSummary({
        totalPending: details.totalPending,
        details,
        status: !navigator.onLine ? "offline" : details.totalPending > 0 ? "syncing" : "synced",
      });
    });
  });

  const unsubField = subscribeToSyncState((fState) => {
    computeGlobalPendingCount().then((details) => {
      updateSummary({
        totalPending: details.totalPending,
        details,
        status: !navigator.onLine ? "offline" : details.totalPending > 0 ? "syncing" : "synced",
      });
    });
  });

  // 4. Initialiser Realtime
  const unsubRealtime = initSupabaseRealtimeSync();

  // 5. Intervalle régulier d'arrière-plan (pulse sync)
  if (intervalSeconds > 0 && !autoSyncIntervalId) {
    autoSyncIntervalId = setInterval(() => {
      if (navigator.onLine && !isGlobalSyncRunning) {
        computeGlobalPendingCount().then(({ totalPending }) => {
          if (totalPending > 0) {
            syncAllDatastores({ silent: true });
          }
        });
      }
    }, intervalSeconds * 1000);
  }

  // Si on est en ligne au démarrage, lancer un premier check discret
  if (navigator.onLine) {
    setTimeout(() => {
      syncAllDatastores({ silent: true });
    }, 1500);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    unsubDexie();
    unsubField();
    unsubRealtime();
    if (autoSyncIntervalId) {
      clearInterval(autoSyncIntervalId);
      autoSyncIntervalId = null;
    }
  };
}

/**
 * Souscription réactive au statut de synchronisation universelle
 */
export function onUniversalSyncChange(fn: UniversalSyncListener): () => void {
  listeners.add(fn);
  fn(currentSummary);
  return () => listeners.delete(fn);
}

/**
 * Récupère l'état courant de la synchronisation universelle
 */
export function getUniversalSyncSummary(): UniversalSyncSummary {
  return currentSummary;
}
