/**
 * NAFA-AGRITECH — Persistance Locale & Synchronisation des Comptages d'Animaux
 * Supporte le mode 100% hors-ligne (Offline-First) sur le terrain et la réplication Supabase.
 */

import { supabase } from "@/integrations/supabase/client";
import { AnimalSpeciesType, VisionAnalysisResult, DetectionBox } from "./livestockVisionCounter";

export interface LivestockCountRecord {
  id: string;
  farmId?: string;
  animalGroupId?: string;
  species: AnimalSpeciesType;
  countedAt: string;
  sourceType: "photo" | "video" | "camera_flux" | "manual";
  detectedCount: number;
  correctedCount: number;
  confidenceScore: number;
  confidenceLevel: "haute" | "moyenne" | "faible";
  surfaceAreaM2?: number;
  densityPerM2?: number;
  isOvercrowded?: boolean;
  qualityWarning?: string;
  technicianNotes?: string;
  observerName?: string;
  syncStatus: "synced" | "pending" | "error";
  imageThumbnailDataUrl?: string; // Image avec bounding boxes
  detectionsSnapshot: DetectionBox[];
}

const STORAGE_KEY = "nafa_livestock_counts_v1";

export const livestockCountStorage = {
  /**
   * Récupère tous les comptages enregistrés localement
   */
  getAll(): LivestockCountRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error("Erreur lecture storage comptages:", e);
      return [];
    }
  },

  /**
   * Sauvegarde un nouveau comptage localement et tente la synchro
   */
  async saveCount(countData: Omit<LivestockCountRecord, "id" | "countedAt" | "syncStatus">): Promise<LivestockCountRecord> {
    const record: LivestockCountRecord = {
      ...countData,
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      countedAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    const list = this.getAll();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    // Si un animalGroupId est renseigné, mise à jour de l'effectif actuel dans animals
    if (record.animalGroupId) {
      try {
        await this.updateAnimalBatchCount(record.animalGroupId, record.correctedCount);
      } catch (err) {
        console.warn("Mise à jour lot d'animaux locale différée:", err);
      }
    }

    // Tente la synchronisation en arrière-plan
    this.syncRecordToRemote(record).catch(() => {
      // Reste en pending silencieusement pour le mode hors-ligne
    });

    return record;
  },

  /**
   * Met à jour un comptage existant (ex: validation ou ajustement a posteriori)
   */
  updateCount(id: string, updates: Partial<LivestockCountRecord>): void {
    const list = this.getAll();
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, syncStatus: "pending" };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      this.syncRecordToRemote(list[idx]).catch(() => {});
    }
  },

  /**
   * Supprime un comptage
   */
  deleteCount(id: string): void {
    const list = this.getAll().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },

  /**
   * Met à jour l'effectif actuel dans la table `animals`
   */
  async updateAnimalBatchCount(animalGroupId: string, newHeadCount: number): Promise<void> {
    try {
      // 1. Mise à jour Supabase si connecté
      const { error } = await (supabase.from("animals" as any) as any)
        .update({
          group_size: newHeadCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", animalGroupId);

      if (error) {
        console.warn("Échec update Supabase animals:", error.message);
      }
    } catch (_e) {
      // Mode offline
    }
  },

  /**
   * Synchronise un enregistrement avec le cloud Supabase
   */
  async syncRecordToRemote(record: LivestockCountRecord): Promise<boolean> {
    try {
      // Insertion dans la table des audits zootechniques / livestock_counts
      const payload = {
        id: record.id,
        farm_id: record.farmId || null,
        animal_id: record.animalGroupId || null,
        species: record.species,
        counted_at: record.countedAt,
        source_type: record.sourceType,
        detected_count: record.detectedCount,
        corrected_count: record.correctedCount,
        confidence_score: record.confidenceScore,
        confidence_level: record.confidenceLevel,
        surface_m2: record.surfaceAreaM2 || null,
        density_per_m2: record.densityPerM2 || null,
        is_overcrowded: record.isOvercrowded || false,
        technician_notes: record.technicianNotes || null,
        observer_name: record.observerName || null,
        metadata: {
          qualityWarning: record.qualityWarning,
          detectionsCount: record.detectionsSnapshot?.length || 0,
        },
      };

      const { error } = await (supabase.from("livestock_counts" as any) as any).upsert(payload);

      if (!error) {
        const list = this.getAll();
        const idx = list.findIndex(c => c.id === record.id);
        if (idx !== -1) {
          list[idx].syncStatus = "synced";
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
        return true;
      }
      return false;
    } catch (_err) {
      return false;
    }
  },

  /**
   * Tente de synchroniser tous les éléments en attente
   */
  async syncAllPending(): Promise<{ synced: number; failed: number }> {
    const list = this.getAll();
    let synced = 0;
    let failed = 0;

    for (const record of list) {
      if (record.syncStatus === "pending") {
        const success = await this.syncRecordToRemote(record);
        if (success) synced++;
        else failed++;
      }
    }

    return { synced, failed };
  },
};
