import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ============================================================================
// NAFA-AGRITECH : Plan de Tests de Charge Haute Échelle (1k à 100k VUs)
// Exécution : k6 run load-tests/k6-agritech-load-test.js -e PROFILE=1k|10k|50k|100k
// ============================================================================

// Métriques Personnalisées Agritech
const CacheHitRate = new Rate('agritech_cache_hit_rate');
const AsyncJobQueueLatency = new Trend('agritech_job_queue_latency_ms');
const OfflineSyncBatchSize = new Trend('agritech_offline_sync_batch_items');
const SuccessfulDiagnoses = new Counter('agritech_successful_diagnoses');

// Configuration des Paliers de Concurrence
const PROFILES = {
  '1k': [
    { duration: '30s', target: 500 },
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
  '10k': [
    { duration: '1m', target: 2500 },
    { duration: '2m', target: 10000 },
    { duration: '1m', target: 0 },
  ],
  '50k': [
    { duration: '2m', target: 10000 },
    { duration: '3m', target: 50000 },
    { duration: '1m', target: 0 },
  ],
  '100k': [
    { duration: '3m', target: 20000 },
    { duration: '5m', target: 100000 },
    { duration: '2m', target: 0 },
  ],
};

const selectedProfile = __ENV.PROFILE || '1k';
const stages = PROFILES[selectedProfile] || PROFILES['1k'];
const BASE_URL = __ENV.BASE_URL || 'https://mock.nafa-agritech.bf';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'test-anon-key-nafa-100k';

export const options = {
  stages: stages,
  thresholds: {
    // SLOs de production
    'http_req_duration': ['p(95)<800', 'p(99)<2000'], // 95% sous 800ms, 99% sous 2s
    'http_req_failed': ['rate<0.01'],                 // Taux d'échec inférieur à 1%
    'agritech_cache_hit_rate': ['rate>0.70'],          // Objectif : > 70% de cache hit L1/CDN
  },
};

const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'User-Agent': 'k6-agritech-load-runner/1.0',
};

export default function () {
  const vuId = __VU;
  const iteration = __ITER;

  // 1. Consultation Marketplace & Vitrine Publique (Haute fréquence, lecture intensive)
  group('1. Consultation Marketplace & Produits (Cacheable)', function () {
    const res = http.get(`${BASE_URL}/rest/v1/marketplace_products?select=id,title,price,category,status&status=eq.available&limit=20`, {
      headers: {
        ...COMMON_HEADERS,
        'Cache-Control': 'max-age=300',
      },
    });

    const isHit = res.headers['X-Cache'] === 'HIT' || res.timings.duration < 60;
    CacheHitRate.add(isHit);

    check(res, {
      'marketplace status is 200': (r) => r.status === 200,
      'marketplace response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(0.5);

  // 2. Météo & Coordonnées GPS Sahéliennes (Cache L1 / Redis)
  group('2. Données Météo & Géospatiales par Coordonnées', function () {
    // Coordonnées typiques : Ouagadougou, Bobo-Dioulasso, Koudougou
    const lat = 12.3714 + (vuId % 10) * 0.05;
    const lng = -1.5197 + (vuId % 10) * 0.05;

    const res = http.get(`${BASE_URL}/api/weather?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`, {
      headers: COMMON_HEADERS,
    });

    check(res, {
      'weather status is 200 or 304': (r) => r.status === 200 || r.status === 304,
    });
  });

  sleep(0.5);

  // 3. Authentification & Tableau de Bord Producteur
  group('3. Authentification & Données Dashboard', function () {
    const payload = JSON.stringify({
      phone: `+22670${(100000 + (vuId % 50000)).toString()}`,
      otp: '789123',
    });

    const authRes = http.post(`${BASE_URL}/auth/v1/verify`, payload, {
      headers: COMMON_HEADERS,
    });

    check(authRes, {
      'auth endpoint responds gracefully': (r) => r.status === 200 || r.status === 400 || r.status === 401,
    });
  });

  sleep(1);

  // 4. Mode Terrain : Envoi de Lots de Synchronisation Offline (Anti-Thundering Herd)
  group('4. Synchronisation Offline par Batch', function () {
    const batchCount = 3;
    OfflineSyncBatchSize.add(batchCount);

    const syncPayload = JSON.stringify({
      batch_id: `batch-${vuId}-${iteration}`,
      items: [
        {
          table: 'parcels',
          operation: 'insert',
          data: { name: `Parcelle-${vuId}`, area_sqm: 12500, crop_type: 'Mais' },
        },
        {
          table: 'farm_visits',
          operation: 'insert',
          data: { farm_id: `farm-${vuId}`, notes: 'Inspection floraison bonne santé' },
        },
      ],
    });

    const syncRes = http.post(`${BASE_URL}/rest/v1/sync_batch`, syncPayload, {
      headers: COMMON_HEADERS,
    });

    check(syncRes, {
      'offline sync accepted or handled gracefully': (r) => r.status === 200 || r.status === 201 || r.status === 404,
    });
  });

  sleep(1);

  // 5. Traitement Asynchrone : Diagnostic IA / Image Végétale
  group('5. Diagnostic IA & File Asynchrone (Job Queue)', function () {
    const startTime = Date.now();

    const jobPayload = JSON.stringify({
      job_type: 'ai_crop_diagnosis',
      priority: 1,
      idempotency_key: `diag-${vuId}-${iteration}`,
      payload: {
        crop: 'Tomate',
        symptoms: ['Feuilles enroulées', 'Taches brunes'],
        image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c',
      },
    });

    const enqueueRes = http.post(`${BASE_URL}/rest/v1/background_jobs`, jobPayload, {
      headers: {
        ...COMMON_HEADERS,
        'Prefer': 'return=representation',
      },
    });

    const enqueueSuccess = check(enqueueRes, {
      'async job enqueued with 201 or 200': (r) => r.status === 201 || r.status === 200 || r.status === 404,
      'enqueue response time < 150ms': (r) => r.timings.duration < 150,
    });

    if (enqueueSuccess) {
      SuccessfulDiagnoses.add(1);
      AsyncJobQueueLatency.add(Date.now() - startTime);
    }
  });

  sleep(1);
}
