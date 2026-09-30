import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';

interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
  userId: string;
}

function replaceValue(value: unknown, fromId: string, toId: string): unknown {
  if (value === fromId) return toId;
  if (Array.isArray(value)) return value.map((item) => replaceValue(item, fromId, toId));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceValue(item, fromId, toId)]));
  }
  return value;
}

interface OfflineDBSchema extends DBSchema {
  cachedData: {
    key: string; // "userId:table:queryKey" or reserved system key
    value: {
      key: string;
      table: string;
      data: any[];
      cachedAt: number;
      userId?: string;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-table': string; 'by-timestamp': number; 'by-user': string };
  };
}

const DB_NAME = 'nafa-offline';
const DB_VERSION = 3;

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch (_e) {}
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('nafa_session_v1') : null;
    if (raw) {
      const s = JSON.parse(raw);
      if (s?.userId) return s.userId;
    }
  } catch (_e) {}
  return null;
}

function scopedCacheKey(userId: string | null, table: string, queryKey: string): string {
  return `${userId ?? 'public'}:${table}:${queryKey}`;
}

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

export async function getDb(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (!db.objectStoreNames.contains('cachedData')) {
        db.createObjectStore('cachedData', { keyPath: 'key' });
      } else if (oldVersion < 3) {
        transaction.objectStore('cachedData').clear();
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-table', 'table');
        syncStore.createIndex('by-timestamp', 'timestamp');
        syncStore.createIndex('by-user', 'userId');
      } else if (oldVersion < 2) {
        const store = transaction.objectStore('syncQueue') as IDBObjectStore;
        if (!store.indexNames.contains('by-user')) store.createIndex('by-user', 'userId');
      }
    },
  });
  
  return dbInstance;
}

// ── Cache operations ──

export async function cacheData(table: string, queryKey: string, data: any[]): Promise<void> {
  const userId = await getCurrentUserId();
  const db = await getDb();
  const key = scopedCacheKey(userId, table, queryKey);
  await db.put('cachedData', { key, table, userId: userId ?? undefined, data, cachedAt: Date.now() });
}

export async function getCachedData(table: string, queryKey: string): Promise<any[] | null> {
  const userId = await getCurrentUserId();
  const db = await getDb();
  const key = scopedCacheKey(userId, table, queryKey);
  const entry = await db.get('cachedData', key);
  return entry?.data ?? null;
}

export async function clearTableCache(table: string): Promise<void> {
  const userId = await getCurrentUserId();
  const db = await getDb();
  const tx = db.transaction('cachedData', 'readwrite');
  const store = tx.objectStore('cachedData');
  let cursor = await store.openCursor();
  while (cursor) {
    if (cursor.value.table === table && (cursor.value.userId ?? null) === userId) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }
  await tx.done;
}

// ── Sync queue operations ──

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries' | 'userId'>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Une session authentifiée est requise pour mettre une modification hors ligne en file.');
  const db = await getDb();
  const id = `${Date.now()}-${crypto.randomUUID()}`;
  await db.put('syncQueue', { ...item, id, userId: user.id, timestamp: Date.now(), retries: 0 });
  return id;
}

export async function getSyncQueue(userId?: string): Promise<SyncQueueItem[]> {
  const db = await getDb();
  // Never expose the complete local queue to a caller that omitted an owner.
  // This prevents cross-account leakage if a future caller forgets to pass userId.
  if (!userId) return [];
  return db.getAllFromIndex('syncQueue', 'by-user', userId);
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('syncQueue', id);
}

export async function updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
  const db = await getDb();
  const item = await db.get('syncQueue', id);
  if (item) {
    await db.put('syncQueue', { ...item, ...updates });
  }
}

export async function getSyncQueueCount(userId?: string): Promise<number> {
  const db = await getDb();
  // Never return an aggregate count across users.
  if (!userId) return 0;
  return db.countFromIndex('syncQueue', 'by-user', userId);
}

// When an offline insert receives its server id, rewrite references in both the
// pending queue and local cache before the next dependent operation is sent.
export async function replaceOfflineId(fromId: string, toId: string): Promise<void> {
  const userId = await getCurrentUserId();
  const db = await getDb();
  const tx = db.transaction(['syncQueue', 'cachedData'], 'readwrite');
  const queueStore = tx.objectStore('syncQueue');
  let queueCursor = await queueStore.openCursor();
  while (queueCursor) {
    if (queueCursor.value.userId === userId) await queueCursor.update({ ...queueCursor.value, data: replaceValue(queueCursor.value.data, fromId, toId) as any });
    queueCursor = await queueCursor.continue();
  }

  const cacheStore = tx.objectStore('cachedData');
  let cacheCursor = await cacheStore.openCursor();
  while (cacheCursor) {
    if ((cacheCursor.value.userId ?? null) === userId) await cacheCursor.update({ ...cacheCursor.value, data: replaceValue(cacheCursor.value.data, fromId, toId) as any });
    cacheCursor = await cacheCursor.continue();
  }
  await tx.done;
}

export async function clearUserOfflineData(userId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['cachedData', 'syncQueue'], 'readwrite');
  const cacheStore = tx.objectStore('cachedData');
  let cacheCursor = await cacheStore.openCursor();
  while (cacheCursor) {
    if (cacheCursor.value.userId === userId || cacheCursor.value.table === '_session' || cacheCursor.value.table === '_credentials') {
      await cacheCursor.delete();
    }
    cacheCursor = await cacheCursor.continue();
  }
  const queueStore = tx.objectStore('syncQueue');
  let queueCursor = await queueStore.openCursor();
  while (queueCursor) {
    if (queueCursor.value.userId === userId) await queueCursor.delete();
    queueCursor = await queueCursor.continue();
  }
  await tx.done;
}

// ── Offline session ──

const SESSION_KEY = 'offline-session';

export interface OfflineSession {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  profile: { full_name: string; phone: string | null; email: string | null; avatar_url: string | null };
  savedAt: number;
}

export async function saveOfflineSession(session: OfflineSession): Promise<void> {
  const db = await getDb();
  await db.put('cachedData', { key: SESSION_KEY, table: '_session', userId: session.userId, data: [session], cachedAt: Date.now() });
}

export async function getOfflineSession(): Promise<OfflineSession | null> {
  const db = await getDb();
  const entry = await db.get('cachedData', SESSION_KEY);
  if (!entry?.data?.[0]) return null;
  const session = entry.data[0] as OfflineSession;
  // The local cache is read-only and short lived. It is not a replacement for
  // a Supabase session and must not keep access alive indefinitely on a lost device.
  if (Date.now() - session.savedAt > 7 * 24 * 60 * 60 * 1000) return null;
  return session;

}

export async function clearOfflineSession(): Promise<void> {
  const db = await getDb();
  await db.delete('cachedData', SESSION_KEY);
}

// ── Optimistic local cache update ──

export async function applyOptimisticInsert(table: string, queryKey: string, newRow: any): Promise<void> {
  const cached = await getCachedData(table, queryKey);
  const currentList = Array.isArray(cached) ? cached : [];
  if (!currentList.some((r: any) => r.id === newRow.id)) {
    await cacheData(table, queryKey, [newRow, ...currentList]);
  }
}

export async function applyOptimisticUpdate(table: string, queryKey: string, id: string, updates: any): Promise<void> {
  const cached = await getCachedData(table, queryKey);
  if (Array.isArray(cached)) {
    const updated = cached.map((row: any) => (row.id === id ? { ...row, ...updates } : row));
    await cacheData(table, queryKey, updated);
  }
}

export async function applyOptimisticDelete(table: string, queryKey: string, id: string): Promise<void> {
  const cached = await getCachedData(table, queryKey);
  if (Array.isArray(cached)) {
    await cacheData(table, queryKey, cached.filter((row: any) => row.id !== id));
  }
}

