import { describe, it, expect, vi, beforeEach } from 'vitest';
import { multiLevelCache, CACHE_TTL_CONFIG } from '@/lib/multiLevelCache';
import { backgroundJobQueue, BackgroundJob } from '@/lib/backgroundJobQueue';
import { calculateReconnectJitter, isSyncing } from '@/lib/syncManager';

describe('Architecture Haute Échelle & 100k Concurrency', () => {
  beforeEach(() => {
    multiLevelCache.clear();
  });

  describe('1. Moteur de Cache Multi-Niveaux (L1 RAM + L2 Persistent)', () => {
    it('enregistre et restitue une donnée avec hit L1 instantané', async () => {
      const weatherData = { temp: 34, humidity: 42, condition: 'Soleil voilé' };
      await multiLevelCache.set('weather:ouaga:center', weatherData, { ttlMs: 10000 });

      const retrieved = await multiLevelCache.get('weather:ouaga:center');
      expect(retrieved.data).toEqual(weatherData);
      expect(retrieved.hit).toBe('l1');
      expect(retrieved.isStale).toBe(false);

      const stats = multiLevelCache.getStats();
      expect(stats.l1Size).toBeGreaterThan(0);
      expect(stats.hits).toBeGreaterThan(0);
    });

    it('gère l\'expiration TTL proprement', async () => {
      await multiLevelCache.set('short_lived_key', { test: true }, { ttlMs: 10 });
      
      // Immédiatement disponible
      const instant = await multiLevelCache.get('short_lived_key');
      expect(instant.data).toEqual({ test: true });
      expect(instant.isStale).toBe(false);

      // Après attente du TTL
      await new Promise(r => setTimeout(r, 20));
      const expired = await multiLevelCache.get('short_lived_key');
      expect(expired.isStale).toBe(true);
    });

    it('supporte l\'invalidation granulaire par préfixe', async () => {
      await multiLevelCache.set('market:seeds:corn', { price: 1500 });
      await multiLevelCache.set('market:seeds:sorghum', { price: 1200 });
      await multiLevelCache.set('weather:koudougou', { temp: 32 });

      await multiLevelCache.invalidatePrefix('market:');

      expect((await multiLevelCache.get('market:seeds:corn')).data).toBeNull();
      expect((await multiLevelCache.get('market:seeds:sorghum')).data).toBeNull();
      expect((await multiLevelCache.get('weather:koudougou')).data).toEqual({ temp: 32 });
    });

    it('dispose des configurations de TTL adaptées aux domaines agronomiques', () => {
      expect(CACHE_TTL_CONFIG.WEATHER_CURRENT).toBe(15 * 60 * 1000);
      expect(CACHE_TTL_CONFIG.MARKETPLACE_CATALOG).toBe(5 * 60 * 1000);
      expect(CACHE_TTL_CONFIG.CROP_VARIETIES_REF).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('2. File de Traitement Asynchrone (Background Job Queue)', () => {
    it('met en file une tâche lourde et retourne immédiatement un job_id en statut pending', async () => {
      const mockHandler = vi.fn().mockImplementation(async (payload) => {
        return { diagnosed: true, crop: payload.crop };
      });

      backgroundJobQueue.registerHandler('test_crop_analysis', mockHandler);

      const job = await backgroundJobQueue.enqueue('test_crop_analysis', {
        crop: 'Arachide',
        parcelId: 'parc-101',
      }, { idempotencyKey: 'idem-test-101' });

      expect(job.id).toBeDefined();
      expect(job.job_type).toBe('test_crop_analysis');
      expect(job.status).toBe('pending');
      expect(job.idempotency_key).toBe('idem-test-101');
    });

    it('retourne le même job en cas de soumission identique (Idempotence)', async () => {
      const job1 = await backgroundJobQueue.enqueue('test_crop_analysis', { test: 1 }, { idempotencyKey: 'idem-unique-key' });
      const job2 = await backgroundJobQueue.enqueue('test_crop_analysis', { test: 1 }, { idempotencyKey: 'idem-unique-key' });

      expect(job1.id).toBe(job2.id);
    });

    it('exécute les tâches via les workers enregistrés avec transition vers completed', async () => {
      const executed = vi.fn().mockResolvedValue({ success: true, ratio: 98 });
      backgroundJobQueue.registerHandler('custom_calc', executed);

      const job = await backgroundJobQueue.enqueue('custom_calc', { area: 5 });
      
      // Attente du cycle de processing
      await new Promise(r => setTimeout(r, 60));

      const updated = backgroundJobQueue.getJob(job.id);
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('completed');
      expect(updated?.result).toEqual({ success: true, ratio: 98 });
      expect(executed).toHaveBeenCalledTimes(1);
    });

    it('gère les retries en cas d\'erreur transitoire', async () => {
      let attempts = 0;
      backgroundJobQueue.registerHandler('failing_task', async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('Timeout passerelle satellite');
        }
        return { recovered: true };
      });

      const job = await backgroundJobQueue.enqueue('failing_task', { try: true });
      await new Promise(r => setTimeout(r, 120));

      const finalJob = backgroundJobQueue.getJob(job.id);
      expect(finalJob).toBeDefined();
      expect(finalJob?.status).toBe('completed');
      expect(attempts).toBe(2);
    });
  });

  describe('3. Mode Offline & Protection Anti-Thundering Herd', () => {
    it('calcule un Jitter de reconnexion aléatoire entre minMs et maxMs', () => {
      const min = 500;
      const max = 5000;
      for (let i = 0; i < 20; i++) {
        const jitter = calculateReconnectJitter(min, max);
        expect(jitter).toBeGreaterThanOrEqual(min);
        expect(jitter).toBeLessThanOrEqual(max);
      }
    });

    it('expose l\'état de synchronisation isSyncing', () => {
      expect(typeof isSyncing()).toBe('boolean');
      expect(isSyncing()).toBe(false);
    });
  });
});
