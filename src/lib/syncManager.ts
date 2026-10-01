import { supabase } from '@/integrations/supabase/client';
import { getSyncQueue, removeSyncQueueItem, updateSyncQueueItem, getSyncQueueCount, replaceOfflineId } from './offlineDb';
import { toast } from 'sonner';
import { isMissingTableError } from '@/hooks/useOfflineData';

const MAX_RETRIES = 5;
const BATCH_SIZE = 5;
const BATCH_INTERVAL_MS = 60;

type SyncListener = (pending: number) => void;
const listeners = new Set<SyncListener>();
let isSyncInProgress = false;

export function onSyncChange(fn: SyncListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isSyncing(): boolean {
  return isSyncInProgress;
}

/**
 * Calcule un délai de dispersion aléatoire (Jitter) pour éviter l'effet
 * Thundering Herd lorsque des milliers de terminaux retrouvent le réseau.
 * @param minMs Délai minimal (défaut 500ms)
 * @param maxMs Délai maximal (défaut 5000ms)
 */
export function calculateReconnectJitter(minMs = 500, maxMs = 5000): number {
  return Math.floor(minMs + Math.random() * (maxMs - minMs));
}

async function notifyListeners() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const count = await getSyncQueueCount(user.id);
  listeners.forEach(fn => fn(count));
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRateLimitOrOverload(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.statusCode || err.code;
  if (status === 429 || status === 503 || status === '429' || status === '503') return true;
  const msg = String(err.message || '').toLowerCase();
  return msg.includes('too many requests') || msg.includes('rate limit') || msg.includes('overload');
}

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (isSyncInProgress) {
    return { synced: 0, failed: 0 };
  }

  isSyncInProgress = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { synced: 0, failed: 0 };

    const queue = await getSyncQueue(user.id);
    let synced = 0;
    let failed = 0;

    // Découpage en micro-lots (chunking) pour lisser la charge PostgREST / PgBouncer
    for (let index = 0; index < queue.length; index++) {
      const item = queue[index];
      if (item.retries >= MAX_RETRIES) {
        failed++;
        continue;
      }

      // Petite temporisation toutes les BATCH_SIZE requêtes pour protéger la bande passante mobile
      if (index > 0 && index % BATCH_SIZE === 0) {
        await delay(BATCH_INTERVAL_MS);
      }

      try {
        let error: any = null;

        switch (item.operation) {
          case 'insert': {
            const { id: tempId, _offline, ...insertData } = item.data;
            const res = await (supabase.from(item.table as any) as any).insert(insertData).select().single();
            error = res.error;
            if (!error && typeof tempId === 'string' && tempId.startsWith('offline-') && res.data?.id) {
              await replaceOfflineId(tempId, res.data.id);
              // The queue snapshot is already in memory; update following items
              // so dependent inserts/updates use the freshly assigned server id.
              for (let pendingIndex = index + 1; pendingIndex < queue.length; pendingIndex++) {
                queue[pendingIndex] = {
                  ...queue[pendingIndex],
                  data: replaceReferences(queue[pendingIndex].data, tempId, res.data.id),
                };
              }
            }
            break;
          }
          case 'update': {
            const { id, ...updateData } = item.data;
            const res = await (supabase.from(item.table as any) as any).update(updateData).eq('id', id);
            error = res.error;
            break;
          }
          case 'delete': {
            const res = await (supabase.from(item.table as any) as any).delete().eq('id', item.data.id);
            error = res.error;
            break;
          }
        }

        if (error) {
          if (isMissingTableError(error)) {
            console.warn(`Table distante non disponible pour "${item.table}". L'élément reste conservé localement.`);
            await removeSyncQueueItem(item.id);
          } else if (isRateLimitOrOverload(error)) {
            console.warn(`Serveur sous forte charge (HTTP 429/503) pour "${item.table}". Interruption momentanée de la synchronisation.`);
            await updateSyncQueueItem(item.id, { retries: item.retries + 1 });
            failed++;
            // Circuit-breaker: suspend la synchronisation immédiate des éléments restants
            break;
          } else {
            console.error(`Sync failed for ${item.table}:`, error);
            await updateSyncQueueItem(item.id, { retries: item.retries + 1 });
            failed++;
          }
        } else {
          await removeSyncQueueItem(item.id);
          synced++;
        }
      } catch (err) {
        if (isMissingTableError(err)) {
          console.warn(`Table distante non disponible pour "${item.table}". L'élément reste conservé localement.`);
          await removeSyncQueueItem(item.id);
        } else if (isRateLimitOrOverload(err)) {
          console.warn(`Serveur sous forte charge (HTTP 429/503). Pause de synchronisation.`);
          await updateSyncQueueItem(item.id, { retries: item.retries + 1 });
          failed++;
          break;
        } else {
          console.error(`Sync error for ${item.table}:`, err);
          await updateSyncQueueItem(item.id, { retries: item.retries + 1 });
          failed++;
        }
      }
    }

    await notifyListeners();
    return { synced, failed };
  } finally {
    isSyncInProgress = false;
  }
}

function replaceReferences(value: any, fromId: string, toId: string): any {
  if (value === fromId) return toId;
  if (Array.isArray(value)) return value.map((item) => replaceReferences(item, fromId, toId));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceReferences(item, fromId, toId)]));
  }
  return value;
}

export async function syncOnReconnect(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const count = await getSyncQueueCount(user.id);
  if (count === 0) {
    // Still notify so UIs can refetch fresh server data after reconnect
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nafa:sync-completed'));
    }
    return;
  }

  toast.info(`Synchronisation de ${count} modification(s)...`);
  const { synced, failed } = await processSyncQueue();

  if (synced > 0) {
    toast.success(`${synced} modification(s) synchronisée(s)`);
  }
  if (failed > 0) {
    toast.error(`${failed} modification(s) en échec, nouvelle tentative plus tard`);
  }
}

// Auto-sync when coming back online avec protection anti-Thundering Herd (Jitter 500ms à 5000ms)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const jitterDelay = calculateReconnectJitter(500, 5000);
    setTimeout(async () => {
      await syncOnReconnect();
      // Notify the rest of the app (hooks, dashboards) that they should refetch
      window.dispatchEvent(new CustomEvent('nafa:sync-completed'));
    }, jitterDelay);
  });
}

