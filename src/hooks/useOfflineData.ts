import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  cacheData,
  getCachedData,
  addToSyncQueue,
  applyOptimisticInsert,
  applyOptimisticUpdate,
  applyOptimisticDelete,
} from '@/lib/offlineDb';

interface UseOfflineDataOptions {
  table: string;
  queryKey?: string;
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  filter?: { column: string; value: any }[];
  limit?: number;
}

export function isMissingTableError(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : (err.message || err.details || err.hint || '');
  const code = err.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('Could not find the table') ||
    msg.includes('in the schema cache') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

export function isMissingColumnError(err: any, column?: string): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : (err.message || err.details || err.hint || '');
  const code = err.code || '';
  const isColError =
    code === 'PGRST204' ||
    code === '42703' ||
    msg.includes('Could not find the') ||
    msg.includes('column of') ||
    msg.includes('in the schema cache') ||
    (msg.includes('column') && msg.includes('does not exist'));

  if (!isColError) return false;
  if (column) {
    return msg.includes(column);
  }
  return true;
}

export function isValidUuid(str: unknown): str is string {
  if (typeof str !== 'string' || !str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

export function isInvalidUuidError(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : (err.message || err.details || err.hint || '');
  const code = err.code || '';
  return code === '22P02' || msg.includes('invalid input syntax for type uuid');
}

const isOfflineTempId = (value: unknown): value is string => (
  typeof value === 'string' && value.startsWith('offline-')
);

function hasTempReference(value: any, key?: string): boolean {
  const isIdKey = key === 'id' || key?.endsWith('_id') || key?.endsWith('_ids') || key === 'assigned_members';

  if (typeof value === 'string') {
    return isIdKey && isOfflineTempId(value);
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasTempReference(item, key));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).some(([entryKey, entryValue]) => hasTempReference(entryValue, entryKey));
  }

  return false;
}

export function useOfflineData<T = any>({
  table,
  queryKey,
  select = '*',
  orderBy = 'created_at',
  ascending = false,
  filter,
  limit = 500,
}: UseOfflineDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const isMounted = useRef(true);
  const stableFilter = JSON.stringify(filter ?? []);
  const cacheKey = queryKey || `${select}|${orderBy}|${ascending}|${limit}|${stableFilter}`;

  useEffect(() => {
    isMounted.current = true;
    if (typeof window === 'undefined') return;
    const goOnline = () => { if (isMounted.current) setIsOffline(false); };
    const goOffline = () => { if (isMounted.current) setIsOffline(true); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      isMounted.current = false;
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const resolveActiveSession = useCallback(async (): Promise<{ session: any; isRemote: boolean } | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) return { session: data.session, isRemote: true };
    } catch (_e) {}

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('nafa_session_v1');
        if (raw) {
          const s = JSON.parse(raw);
          if (s?.userId) {
            return {
              session: { user: { id: s.userId, email: s.email, user_metadata: { full_name: s.fullName } } } as any,
              isRemote: false,
            };
          }
        }
      } catch (_e) {}
    }
    return null;
  }, []);

  const fetchData = useCallback(async () => {
    // Populate immediately with cached data if available (stale-while-revalidate)
    const cached = await getCachedData(table, cacheKey);
    if (!isMounted.current) return;
    if (cached && cached.length > 0) {
      setData(cached as T[]);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const parsedFilter: { column: string; value: any }[] = JSON.parse(stableFilter);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        // If there is no remote Supabase session, avoid failing network requests
        const sessionInfo = await resolveActiveSession();
        if (!isMounted.current) return;
        if (!sessionInfo?.isRemote) {
          if (cached) {
            setData(cached as T[]);
          }
          setLoading(false);
          return;
        }

        let query = (supabase.from(table as any) as any).select(select);
        for (const f of parsedFilter) {
          query = query.eq(f.column, f.value);
        }
        query = query.order(orderBy, { ascending }).limit(limit);

        const { data: result, error } = await query;
        if (!isMounted.current) return;
        if (error) throw error;

        // Preserve and merge locally created or pending items so they are never wiped
        const currentCached = await getCachedData(table, cacheKey);
        if (!isMounted.current) return;
        const localPending = (currentCached || []).filter(
          (r: any) => r && (r._offline || (typeof r.id === 'string' && (r.id.startsWith('local-') || r.id.startsWith('offline-'))))
        );
        const remoteIds = new Set((result || []).map((r: any) => r.id));
        const merged = [...localPending.filter((r: any) => !remoteIds.has(r.id)), ...(result || [])];

        setData(merged);
        await cacheData(table, cacheKey, merged);
      } catch (err: any) {
        if (!isMounted.current) return;
        if (isMissingTableError(err) || isInvalidUuidError(err)) {
          console.warn(`Table ou filtre "${table}" non résolu sur le serveur (${err.code || err.message}). Utilisation du cache local.`);
          const fallbackCached = await getCachedData(table, cacheKey);
          if (isMounted.current) {
            setData((fallbackCached as T[]) || []);
            setLoading(false);
          }
          return;
        }
        console.warn('Fetch error, falling back to cache:', err);
        const fallbackCached = await getCachedData(table, cacheKey);
        if (isMounted.current && fallbackCached) {
          setData(fallbackCached as T[]);
        }
      }
    } else {
      const fallbackCached = await getCachedData(table, cacheKey);
      if (isMounted.current) {
        if (fallbackCached) {
          setData(fallbackCached as T[]);
        } else {
          toast.warning('Aucune donnée en cache pour le mode hors-ligne');
        }
      }
    }

    if (isMounted.current) {
      setLoading(false);
    }
  }, [table, cacheKey, select, orderBy, ascending, stableFilter, limit, resolveActiveSession]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch fresh data after reconnect, queued sync, or global data update
  useEffect(() => {
    const handleSynced = () => { fetchData(); };
    window.addEventListener('nafa:sync-completed', handleSynced);
    window.addEventListener('nafa:data-updated', handleSynced);
    return () => {
      window.removeEventListener('nafa:sync-completed', handleSynced);
      window.removeEventListener('nafa:data-updated', handleSynced);
    };
  }, [fetchData]);

  const queueOfflineInsert = useCallback(async (row: any, message: string) => {
    const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const offlineRow = { ...row, id: tempId, _offline: true, created_at: new Date().toISOString() };
    await addToSyncQueue({ table, operation: 'insert', data: offlineRow });
    await applyOptimisticInsert(table, cacheKey, offlineRow);
    setData(prev => [offlineRow as T, ...prev]);
    setLoading(false);
    toast.info(message);
    return offlineRow;
  }, [table, cacheKey]);

  const insertRow = useCallback(async (row: any) => {
    const fallbackLocalInsert = async () => {
      const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const localRow = { ...row, id: tempId, created_at: new Date().toISOString() };
      await applyOptimisticInsert(table, cacheKey, localRow);
      setData(prev => [localRow as T, ...prev]);
      setLoading(false);
      return localRow;
    };

    if (!navigator.onLine) {
      return queueOfflineInsert(row, 'Enregistré hors-ligne, sera synchronisé au retour de la connexion');
    }

    const sessionInfo = await resolveActiveSession();
    // If no remote Supabase session, save locally without blocking the user
    if (!sessionInfo?.session?.user || !sessionInfo.isRemote) {
      return fallbackLocalInsert();
    }

    if (hasTempReference(row)) {
      return queueOfflineInsert(
        row,
        'Cette donnée dépend d’un élément pas encore synchronisé. Elle sera envoyée automatiquement juste après.'
      );
    }

    try {
      const { data: result, error } = await (supabase.from(table as any) as any).insert(row).select();
      if (error) {
        console.warn(`Table distante ou contrainte "${table}" (${error.code || error.message}). Enregistrement local.`);
        return fallbackLocalInsert();
      }
      await fetchData();
      return result?.[0] || null;
    } catch (err: any) {
      console.warn(`Erreur réseau insertion "${table}". Enregistrement local:`, err);
      return fallbackLocalInsert();
    }
  }, [table, cacheKey, resolveActiveSession, fetchData, queueOfflineInsert]);

  const updateRow = useCallback(async (id: string, updates: any) => {
    const fallbackLocalUpdate = async () => {
      await applyOptimisticUpdate(table, cacheKey, id, updates);
      setData(prev => prev.map((r: any) => r.id === id ? { ...r, ...updates } : r));
      return true;
    };

    if (!navigator.onLine) {
      await addToSyncQueue({ table, operation: 'update', data: { id, ...updates } });
      await applyOptimisticUpdate(table, cacheKey, id, updates);
      setData(prev => prev.map((r: any) => r.id === id ? { ...r, ...updates } : r));
      toast.info('Modification enregistrée hors-ligne');
      return true;
    }

    const sessionInfo = await resolveActiveSession();
    if (!sessionInfo?.session?.user || !sessionInfo.isRemote || isOfflineTempId(id) || hasTempReference(updates)) {
      await addToSyncQueue({ table, operation: 'update', data: { id, ...updates } });
      await applyOptimisticUpdate(table, cacheKey, id, updates);
      setData(prev => prev.map((r: any) => r.id === id ? { ...r, ...updates, _offline: true } : r));
      return true;
    }

    try {
      const { error } = await (supabase.from(table as any) as any).update(updates).eq('id', id);
      if (error) {
        console.warn(`Erreur update distante "${table}":`, error);
        return fallbackLocalUpdate();
      }
      await fetchData();
      return true;
    } catch (err) {
      console.warn(`Exception update distante "${table}":`, err);
      return fallbackLocalUpdate();
    }
  }, [table, cacheKey, resolveActiveSession, fetchData]);

  const deleteRow = useCallback(async (id: string) => {
    const fallbackLocalDelete = async () => {
      await applyOptimisticDelete(table, cacheKey, id);
      setData(prev => prev.filter((r: any) => r.id !== id));
      return true;
    };

    if (!navigator.onLine) {
      await addToSyncQueue({ table, operation: 'delete', data: { id } });
      await applyOptimisticDelete(table, cacheKey, id);
      setData(prev => prev.filter((r: any) => r.id !== id));
      toast.info('Suppression enregistrée hors-ligne');
      return true;
    }

    const sessionInfo = await resolveActiveSession();
    if (!sessionInfo?.session?.user || !sessionInfo.isRemote || isOfflineTempId(id)) {
      await addToSyncQueue({ table, operation: 'delete', data: { id } });
      await applyOptimisticDelete(table, cacheKey, id);
      setData(prev => prev.filter((r: any) => r.id !== id));
      return true;
    }

    try {
      const { error } = await (supabase.from(table as any) as any).delete().eq('id', id);
      if (error) {
        console.warn(`Erreur delete distante "${table}":`, error);
        return fallbackLocalDelete();
      }
      await fetchData();
      return true;
    } catch (err) {
      console.warn(`Exception delete distante "${table}":`, err);
      return fallbackLocalDelete();
    }
  }, [table, cacheKey, resolveActiveSession, fetchData]);

  return { data, loading, isOffline, refetch: fetchData, insertRow, updateRow, deleteRow };
}
