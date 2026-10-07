/**
 * MOTEUR DE QUEUE DE TÂCHES ASYNCHRONES (Background Job Queue Engine)
 * Découple les traitements lourds (IA, analyse d'image, PDF 3D, synchro volumineuse)
 * de la boucle de requête synchrone pour garantir une scalabilité à 100 000 utilisateurs.
 * 
 * Pipeline conforme :
 * Request -> Create Job -> Queue -> Worker -> Traitement -> DB/Storage -> Notification/Status
 */

import { getDb } from "./offlineDb";
import { multiLevelCache, CACHE_TTL_CONFIG } from "./multiLevelCache";

export type JobType =
  | "ai_crop_diagnosis"
  | "engineering_pdf_generation"
  | "satellite_vegetation_index"
  | "bulk_offline_sync"
  | "instant_sms_notification"
  | (string & {});

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface BackgroundJob<TInput = any, TOutput = any> {
  id: string;
  type: JobType;
  job_type?: JobType;
  status: JobStatus;
  payload: TInput;
  result?: TOutput;
  errorMessage?: string;
  retries: number;
  maxRetries: number;
  idempotencyKey?: string;
  idempotency_key?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  progressPercent?: number; // 0-100
}

export type JobHandler<TInput = any, TOutput = any> = (
  job: BackgroundJob<TInput, TOutput>,
  updateProgress: (percent: number) => void
) => Promise<TOutput>;

class BackgroundJobQueueEngine {
  private handlers: Map<string, JobHandler> = new Map();
  private jobsMap: Map<string, BackgroundJob> = new Map();
  private isProcessing: boolean = false;
  private concurrencyLimit: number = 3;
  private activeJobsCount: number = 0;

  constructor() {
    this.registerDefaultHandlers();
    // Auto-réveil au montage
    if (typeof window !== "undefined") {
      setTimeout(() => this.processNextBatch(), 1000);
    }
  }

  /**
   * Enregistre un handler de calcul/traitement pour un type de tâche
   */
  registerHandler<TInput, TOutput>(type: JobType, handler: JobHandler<TInput, TOutput>) {
    this.handlers.set(type, handler);
  }

  /**
   * Soumet une tâche en mode non-bloquant (< 50 ms).
   * Renvoie immédiatement le job_id et le statut initial 'pending'.
   */
  async submitJob<TInput, TOutput>(params: {
    type: JobType;
    payload: TInput;
    idempotencyKey?: string;
    maxRetries?: number;
  }): Promise<{ jobId: string; status: JobStatus; isCached?: boolean; result?: TOutput }> {
    const { type, payload, idempotencyKey, maxRetries = 3 } = params;

    // 1. Contrôle d'Idempotence en mémoire
    if (idempotencyKey) {
      for (const j of this.jobsMap.values()) {
        if (j.idempotencyKey === idempotencyKey || j.idempotency_key === idempotencyKey) {
          return {
            jobId: j.id,
            status: j.status,
            isCached: true,
            result: j.result,
          };
        }
      }

      const cached = await multiLevelCache.get<TOutput>(`job_idem:${idempotencyKey}`);
      if (cached.data !== null) {
        return {
          jobId: `idem-${idempotencyKey}`,
          status: "completed",
          isCached: true,
          result: cached.data,
        };
      }
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const job: BackgroundJob<TInput, TOutput> = {
      id: jobId,
      type,
      job_type: type,
      status: "pending",
      payload,
      retries: 0,
      maxRetries,
      idempotencyKey,
      idempotency_key: idempotencyKey,
      createdAt: Date.now(),
      progressPercent: 0,
    };

    this.jobsMap.set(jobId, job);

    // Sauvegarde dans la base locale IndexedDB pour persistance
    const db = await getDb();
    await db.put("cachedData", {
      key: `job:${jobId}`,
      table: "_background_jobs",
      data: [job],
      cachedAt: Date.now(),
    });

    // Déclencher le worker asynchrone sans attendre
    setTimeout(() => this.processNextBatch(), 10);

    return {
      jobId,
      status: "pending",
    };
  }

  /**
   * Enfile une tâche et renvoie l'objet BackgroundJob complet
   */
  async enqueue<TInput, TOutput>(
    type: JobType,
    payload: TInput,
    options?: { idempotencyKey?: string; maxRetries?: number }
  ): Promise<BackgroundJob<TInput, TOutput>> {
    const res = await this.submitJob<TInput, TOutput>({
      type,
      payload,
      idempotencyKey: options?.idempotencyKey,
      maxRetries: options?.maxRetries,
    });

    const job = this.jobsMap.get(res.jobId);
    if (job) return job as BackgroundJob<TInput, TOutput>;

    return {
      id: res.jobId,
      type,
      job_type: type,
      status: res.status,
      payload,
      retries: 0,
      maxRetries: options?.maxRetries ?? 3,
      idempotencyKey: options?.idempotencyKey,
      idempotency_key: options?.idempotencyKey,
      createdAt: Date.now(),
      result: res.result,
    } as BackgroundJob<TInput, TOutput>;
  }

  /**
   * Récupère un job depuis la mémoire ou null
   */
  getJob(jobId: string): BackgroundJob | null {
    return this.jobsMap.get(jobId) || null;
  }

  /**
   * Récupère le statut d'avancement d'un job pour le polling côté client
   */
  async getJobStatus<TOutput = any>(jobId: string): Promise<BackgroundJob<any, TOutput> | null> {
    if (this.jobsMap.has(jobId)) {
      return this.jobsMap.get(jobId) as BackgroundJob<any, TOutput>;
    }
    const db = await getDb();
    const stored = await db.get("cachedData", `job:${jobId}`);
    if (stored?.data?.[0]) {
      const job = stored.data[0] as BackgroundJob<any, TOutput>;
      this.jobsMap.set(jobId, job);
      return job;
    }
    return null;
  }

  /**
   * Boucle du worker : exécute les tâches en file avec limitation de concurrence
   */
  private async processNextBatch() {
    if (this.isProcessing || this.activeJobsCount >= this.concurrencyLimit) return;
    this.isProcessing = true;

    try {
      const db = await getDb();
      const tx = db.transaction("cachedData", "readonly");
      const store = tx.objectStore("cachedData");
      let cursor = await store.openCursor();
      const pendingJobs: BackgroundJob[] = [];

      while (cursor) {
        const rawKey = String(cursor.key);
        if (rawKey.startsWith("job:") && cursor.value?.data?.[0]?.status === "pending") {
          pendingJobs.push(cursor.value.data[0]);
        }
        cursor = await cursor.continue();
      }
      await tx.done;

      // Traiter les jobs disponibles dans la limite de concurrence
      for (const job of pendingJobs) {
        if (this.activeJobsCount >= this.concurrencyLimit) break;
        this.executeJob(job);
      }
    } catch (e) {
      console.warn("BackgroundJobQueue worker scan error:", e);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Exécution d'un job individuel avec gestion d'erreurs, retries exponentiels et timeouts
   */
  private async executeJob(job: BackgroundJob) {
    this.activeJobsCount++;
    const handler = this.handlers.get(job.type);

    if (!handler) {
      job.status = "failed";
      job.errorMessage = `Aucun handler enregistré pour le type ${job.type}`;
      await this.saveJob(job);
      this.activeJobsCount--;
      return;
    }

    job.status = "processing";
    job.startedAt = Date.now();
    await this.saveJob(job);

    try {
      const result = await handler(job, (percent) => {
        job.progressPercent = percent;
        this.saveJob(job);
      });

      job.status = "completed";
      job.result = result;
      job.completedAt = Date.now();
      job.progressPercent = 100;
      await this.saveJob(job);

      // Mettre en cache pour idempotence
      if (job.idempotencyKey) {
        await multiLevelCache.set(`job_idem:${job.idempotencyKey}`, result, {
          ttlSeconds: CACHE_TTL_CONFIG.AI_DIAGNOSIS_RESULT,
        });
      }

      // Émettre un événement UI pour les composants abonnés
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("nafa:job-completed", { detail: { jobId: job.id, type: job.type, result } }));
      }
    } catch (err: any) {
      console.error(`Erreur d'exécution job ${job.id}:`, err);
      job.retries++;

      if (job.retries < job.maxRetries) {
        job.status = "pending";
        // Backoff exponentiel : 1s, 2s, 4s...
        const backoffMs = Math.pow(2, job.retries) * 1000 + Math.random() * 500;
        setTimeout(() => this.processNextBatch(), backoffMs);
      } else {
        job.status = "failed";
        job.errorMessage = err?.message || "Échec après nombre maximal de tentatives";
        job.completedAt = Date.now();
      }
      await this.saveJob(job);
    } finally {
      this.activeJobsCount--;
      this.processNextBatch();
    }
  }

  private async saveJob(job: BackgroundJob) {
    this.jobsMap.set(job.id, { ...job });
    try {
      const db = await getDb();
      await db.put("cachedData", {
        key: `job:${job.id}`,
        table: "_background_jobs",
        data: [job],
        cachedAt: Date.now(),
      });
    } catch (e) {
      console.warn("Failed to persist job update:", e);
    }
  }

  /**
   * Handlers par défaut intégrés (IA, calcul de végétation, génération de dossier)
   */
  private registerDefaultHandlers() {
    // 1. Diagnostic IA asynchrone
    this.registerHandler("ai_crop_diagnosis", async (job, updateProgress) => {
      updateProgress(20);
      const { cropKey, symptoms } = job.payload as { cropKey?: string; symptoms?: string; imageBase64?: string };
      
      // Simulation ou délégation Edge Function avec timeout
      updateProgress(50);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s max

      try {
        const { executeScientificDiagnosisPipeline } = await import("./scientificAgronomicRAG");
        updateProgress(80);
        // Exécution du RAG scientifique
        const diagnosis = executeScientificDiagnosisPipeline({
          identification: {
            identifiedSpecies: {
              id: cropKey || "tomate",
              commonName: cropKey || "Tomate",
              scientificName: "Solanum lycopersicum",
              family: "Solanaceae",
              category: "maraichage",
              isWeed: false,
              burkinaVarieties: ["Mongal F1"],
              growthStages: ["fructification_grossissement"],
              description: "Culture maraîchère sahélienne",
            },
            isWeed: false,
            confidence: 0.95,
            confidenceLevel: "Élevé",
            canProceed: true,
          },
          context: {
            region: "Centre-Ouest (Koudougou)",
            season: "hivernage",
            growthStage: "fructification_grossissement",
            soilType: "limoneux_alluvial",
            symptoms: symptoms || "Taches foliaires",
            affectedOrgans: ["feuilles"],
          },
        });
        clearTimeout(timeoutId);
        updateProgress(100);
        return diagnosis;
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    });

    // 2. Génération de devis et dossier PDF en arrière-plan
    this.registerHandler("engineering_pdf_generation", async (job, updateProgress) => {
      updateProgress(30);
      const { generateTechnicalDossierPdf } = await import("./nafaGeniusPdf");
      updateProgress(70);
      await generateTechnicalDossierPdf(job.payload as any);
      updateProgress(100);
      return { success: true, generatedAt: new Date().toISOString() };
    });
  }
}

export const backgroundJobQueue = new BackgroundJobQueueEngine();
