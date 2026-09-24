/**
 * NAFA - AGRITECH : Moteur Offline-First Dexie (IndexedDB)
 * 
 * Fonctionnalités WhatsApp-style :
 * - Stockage local immédiat avec génération d'UUID v4 local
 * - Statuts de synchronisation : 'pending' | 'synced' | 'error'
 * - Détection automatique de reconnexion réseau & synchronisation en arrière-plan
 * - Résolution de conflits basée sur `updated_at` (Last-Write-Wins)
 * - Indicateur visuel temps réel : Synchronisé, En attente, Erreur
 */

import Dexie, { Table } from 'dexie';
import { supabase } from '@/integrations/supabase/client';

export type SyncStatus = 'pending' | 'synced' | 'error';
export type SyncOperation = 'insert' | 'update' | 'delete';

export interface OfflineRecord {
  id: string; // UUID v4 local
  table: string;
  operation: SyncOperation;
  data: any;
  status: SyncStatus;
  errorMessage?: string;
  created_at: string;
  updated_at: string;
  userId: string;
  retries: number;
}

export interface CachedEntity {
  id: string;
  table: string;
  data: any;
  updated_at: string;
  userId?: string;
}

export class NafaDexieDB extends Dexie {
  offlineRecords!: Table<OfflineRecord, string>;
  cachedEntities!: Table<CachedEntity, string>;
  knowledge_base!: Table<any, string>;
  validated_cases!: Table<any, string>;
  plant_species!: Table<any, string>;
  weed_species!: Table<any, string>;
  disease_catalog!: Table<any, string>;
  diagnosis_feedback!: Table<any, string>;

  constructor() {
    super('NafaDexieDB');
    this.version(1).stores({
      offlineRecords: 'id, table, status, userId, updated_at, [table+status], [userId+status]',
      cachedEntities: 'id, table, userId, updated_at, [table+userId]',
    });
    this.version(2).stores({
      offlineRecords: 'id, table, status, userId, updated_at, [table+status], [userId+status]',
      cachedEntities: 'id, table, userId, updated_at, [table+userId]',
      knowledge_base: 'id, sourceInstitution, crop, disease, pest, deficiency, weed, region, season',
      validated_cases: 'id, plantSpeciesId, isWeed, weedSpeciesId, diseaseCatalogId, certifiedBy, certifiedAt',
      plant_species: 'id, commonName, scientificName, category',
      weed_species: 'id, commonName, scientificName, riskLevel',
      disease_catalog: 'id, name, pathogenType',
      diagnosis_feedback: 'id, diagnosis_id, user_id',
    });
  }
}

export const db = new NafaDexieDB();

/**
 * Génère un UUID v4 standard pour garantir l'unicité locale et distante
 */
export function generateLocalUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Événements de synchronisation réactifs ──
type SyncListener = (counts: { pending: number; synced: number; error: number }) => void;
const syncListeners = new Set<SyncListener>();

export function onSyncStatusChange(listener: SyncListener): () => void {
  syncListeners.add(listener);
  // Déclencher immédiatement avec l'état actuel
  getSyncCounts().then(listener).catch(console.error);
  return () => syncListeners.delete(listener);
}

export async function notifySyncStatusChanged(): Promise<void> {
  const counts = await getSyncCounts();
  syncListeners.forEach((fn) => fn(counts));
}

export async function getSyncCounts(): Promise<{ pending: number; synced: number; error: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      const pending = await db.offlineRecords.where('status').equals('pending').count();
      const synced = await db.offlineRecords.where('status').equals('synced').count();
      const error = await db.offlineRecords.where('status').equals('error').count();
      return { pending, synced, error };
    }

    const pending = await db.offlineRecords.where({ userId, status: 'pending' }).count();
    const synced = await db.offlineRecords.where({ userId, status: 'synced' }).count();
    const error = await db.offlineRecords.where({ userId, status: 'error' }).count();

    return { pending, synced, error };
  } catch (err) {
    console.warn('Erreur lors du calcul des statuts de sync Dexie:', err);
    return { pending: 0, synced: 0, error: 0 };
  }
}

/**
 * Enregistre une opération dans Dexie avec UUID local et statut 'pending'
 */
export async function saveOfflineRecord(
  table: string,
  operation: SyncOperation,
  data: any,
  explicitUserId?: string
): Promise<OfflineRecord> {
  let userId = explicitUserId;
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || 'anonymous-local-user';
  }

  const now = new Date().toISOString();
  const id = data.id || generateLocalUuid();

  const record: OfflineRecord = {
    id,
    table,
    operation,
    data: { ...data, id, updated_at: now },
    status: 'pending',
    created_at: data.created_at || now,
    updated_at: now,
    userId,
    retries: 0,
  };

  await db.offlineRecords.put(record);

  // Mettre à jour également l'entité en cache local
  if (operation !== 'delete') {
    await db.cachedEntities.put({
      id,
      table,
      data: record.data,
      updated_at: now,
      userId,
    });
  } else {
    await db.cachedEntities.delete(id);
  }

  await notifySyncStatusChanged();

  // Si en ligne, tenter immédiatement une synchronisation en arrière-plan (expérience WhatsApp)
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    setTimeout(() => {
      syncPendingRecords().catch(console.error);
    }, 100);
  }

  return record;
}

/**
 * Moteur de synchronisation avec résolution de conflits (updated_at)
 */
export async function syncPendingRecords(): Promise<{
  synced: number;
  failed: number;
  conflicts: number;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0, conflicts: 0 };
  }

  const pendingRecords = await db.offlineRecords.where('status').equals('pending').toArray();
  if (pendingRecords.length === 0) {
    return { synced: 0, failed: 0, conflicts: 0 };
  }

  let synced = 0;
  let failed = 0;
  let conflicts = 0;

  for (const record of pendingRecords) {
    try {
      const { table, operation, data } = record;

      // Vérification du conflit distant via updated_at si update
      if (operation === 'update' && data.id) {
        try {
          const { data: remoteData, error: fetchErr } = await (supabase.from(table as any) as any)
            .select('updated_at')
            .eq('id', data.id)
            .maybeSingle();

          if (!fetchErr && remoteData?.updated_at) {
            const localTime = new Date(record.updated_at).getTime();
            const remoteTime = new Date(remoteData.updated_at).getTime();

            // Si le serveur possède une version plus récente, résoudre le conflit
            if (remoteTime > localTime) {
              conflicts++;
              // Marquer comme synchronisé en adoptant la version la plus récente
              await db.offlineRecords.update(record.id, {
                status: 'synced',
                errorMessage: `Conflit résolu : version distante plus récente (${remoteData.updated_at}) conservée.`,
              });
              continue;
            }
          }
        } catch {
          // Table distante non disponible ou offline, poursuivre
        }
      }

      let error: any = null;

      if (operation === 'insert') {
        const { error: insertErr } = await (supabase.from(table as any) as any).insert(data);
        error = insertErr;
      } else if (operation === 'update') {
        const { id, ...updateFields } = data;
        const { error: updateErr } = await (supabase.from(table as any) as any).update(updateFields).eq('id', id);
        error = updateErr;
      } else if (operation === 'delete') {
        const { error: deleteErr } = await (supabase.from(table as any) as any).delete().eq('id', data.id);
        error = deleteErr;
      }

      if (error) {
        // En cas d'erreur de table manquante en base distante, conserver en local sans bloquer
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          await db.offlineRecords.update(record.id, {
            status: 'synced',
            errorMessage: 'Stocké localement (table Supabase distante non provisionnée).',
          });
          synced++;
        } else {
          failed++;
          await db.offlineRecords.update(record.id, {
            status: 'error',
            errorMessage: error.message || 'Erreur réseau ou contrainte Supabase',
            retries: record.retries + 1,
          });
        }
      } else {
        synced++;
        await db.offlineRecords.update(record.id, {
          status: 'synced',
          errorMessage: undefined,
        });
      }
    } catch (err: any) {
      failed++;
      await db.offlineRecords.update(record.id, {
        status: 'error',
        errorMessage: err?.message || 'Échec de synchronisation inattendu',
        retries: record.retries + 1,
      });
    }
  }

  await notifySyncStatusChanged();
  return { synced, failed, conflicts };
}

/**
 * Réessaye toutes les opérations en erreur
 */
export async function retryFailedRecords(): Promise<void> {
  const errorRecords = await db.offlineRecords.where('status').equals('error').toArray();
  for (const record of errorRecords) {
    await db.offlineRecords.update(record.id, { status: 'pending', errorMessage: undefined });
  }
  await notifySyncStatusChanged();
  await syncPendingRecords();
}

/**
 * Initialisation des écouteurs globaux de reconnexion
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPendingRecords().catch(console.error);
  });
}
