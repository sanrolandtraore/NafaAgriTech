/**
 * NAFA-AGRITECH — Gestionnaire & Historique Centralisé des Exports PDF
 * Enregistre, indexe et permet la consultation/réimpression de tous les documents PDF
 * générés sur la plateforme (Ingénierie, Inspections, Élevage, Devis, Diagnostics, etc.)
 */

import jsPDF from "jspdf";
import { toast } from "sonner";

export type PdfModuleType =
  | "field_designer"
  | "studio_3d"
  | "inspection"
  | "crop_diagnosis"
  | "livestock"
  | "quote_finance"
  | "cartography"
  | "farm_management";

export interface PdfExportRecord {
  id: string;
  title: string;
  filename: string;
  module: PdfModuleType;
  categoryLabel: string;
  createdAt: string; // Date ISO
  createdTimestamp: number;
  authorName?: string;
  clientName?: string;
  summary?: string;
  pageCount?: number;
  fileSizeBytes?: number;
  dataSnapshot?: any;
}

const STORAGE_KEY = "nafa_pdf_export_history";
const MAX_RECORDS = 150;

export const PDF_MODULE_METADATA: Record<PdfModuleType, { label: string; color: string }> = {
  field_designer: { label: "Field Designer & CAO", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  studio_3d: { label: "Studio 3D & Ouvrages", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  inspection: { label: "Inspection Terrain", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  crop_diagnosis: { label: "Diagnostic Végétal", color: "bg-lime-500/20 text-lime-400 border-lime-500/30" },
  livestock: { label: "Élevage & Zootechnie", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  quote_finance: { label: "Devis & Financement", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  cartography: { label: "Cartographie & GPS", color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  farm_management: { label: "Gestion & Récoltes", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

function dispatchHistoryUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nafa_pdf_history_updated"));
  }
}

export const pdfExportHistory = {
  /**
   * Récupère tous les enregistrements ordonnés du plus récent au plus ancien
   */
  getHistory(moduleFilter?: PdfModuleType): PdfExportRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const records: PdfExportRecord[] = JSON.parse(raw);
      if (!Array.isArray(records)) return [];
      
      const sorted = records.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
      if (moduleFilter) {
        return sorted.filter((r) => r.module === moduleFilter);
      }
      return sorted;
    } catch (e) {
      console.warn("Erreur lecture historique PDF :", e);
      return [];
    }
  },

  /**
   * Enregistre un document et déclenche le téléchargement du jsPDF
   */
  saveAndRecordPdf(options: {
    title: string;
    filename: string;
    module: PdfModuleType;
    categoryLabel?: string;
    doc: jsPDF;
    summary?: string;
    authorName?: string;
    clientName?: string;
    dataSnapshot?: any;
    notifyToast?: boolean;
  }): PdfExportRecord {
    const {
      title,
      filename,
      module,
      categoryLabel,
      doc,
      summary,
      authorName,
      clientName,
      dataSnapshot,
      notifyToast = true,
    } = options;

    // 1. Déclencher le téléchargement du fichier PDF
    const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    doc.save(cleanFilename);

    // 2. Calculer le nombre de pages approximatif
    let pageCount = 1;
    try {
      if (typeof (doc as any).getNumberOfPages === "function") {
        pageCount = (doc as any).getNumberOfPages();
      } else if (Array.isArray(doc.internal?.pages)) {
        pageCount = Math.max(1, doc.internal.pages.length - 1);
      }
    } catch {
      // fallback
    }


    // 3. Créer l'enregistrement d'historique
    const now = new Date();
    const record: PdfExportRecord = {
      id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      filename: cleanFilename,
      module,
      categoryLabel: categoryLabel || PDF_MODULE_METADATA[module]?.label || "Document Technique",
      createdAt: now.toISOString(),
      createdTimestamp: now.getTime(),
      authorName,
      clientName,
      summary,
      pageCount,
      dataSnapshot: dataSnapshot ? JSON.parse(JSON.stringify(dataSnapshot)) : undefined,
    };

    // 4. Persister dans le stockage local
    const current = this.getHistory();
    const updated = [record, ...current].slice(0, MAX_RECORDS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Échec sauvegarde historique PDF local :", e);
    }

    dispatchHistoryUpdate();

    if (notifyToast) {
      toast.success(`PDF "${cleanFilename}" téléchargé et archivé dans l'historique !`);
    }

    return record;
  },

  /**
   * Enregistre un export sans instance doc préalable
   */
  recordExport(recordData: {
    title: string;
    filename: string;
    module: PdfModuleType;
    categoryLabel?: string;
    summary?: string;
    authorName?: string;
    clientName?: string;
    pageCount?: number;
    dataSnapshot?: any;
  }): PdfExportRecord {
    const now = new Date();
    const cleanFilename = recordData.filename.endsWith(".pdf") ? recordData.filename : `${recordData.filename}.pdf`;
    const record: PdfExportRecord = {
      id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: recordData.title,
      filename: cleanFilename,
      module: recordData.module,
      categoryLabel: recordData.categoryLabel || PDF_MODULE_METADATA[recordData.module]?.label || "Document",
      createdAt: now.toISOString(),
      createdTimestamp: now.getTime(),
      authorName: recordData.authorName,
      clientName: recordData.clientName,
      summary: recordData.summary,
      pageCount: recordData.pageCount || 1,
      dataSnapshot: recordData.dataSnapshot,
    };

    const current = this.getHistory();
    const updated = [record, ...current].slice(0, MAX_RECORDS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Échec sauvegarde record PDF :", e);
    }

    dispatchHistoryUpdate();
    return record;
  },

  /**
   * Supprime un enregistrement de l'historique
   */
  deleteRecord(id: string): void {
    const current = this.getHistory();
    const updated = current.filter((r) => r.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Échec suppression record PDF :", e);
    }
    dispatchHistoryUpdate();
    toast.info("Document retiré de l'historique.");
  },

  /**
   * Réinitialise complètement l'historique
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Échec purge historique PDF :", e);
    }
    dispatchHistoryUpdate();
    toast.info("Historique des exports PDF réinitialisé.");
  },

  /**
   * Export de l'historique en JSON pour sauvegarde / audit
   */
  exportHistoryAsJson(): string {
    const data = this.getHistory();
    return JSON.stringify(data, null, 2);
  },

  /**
   * Importe un historique JSON
   */
  importHistoryFromJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        dispatchHistoryUpdate();
        toast.success(`${parsed.length} documents restaurés dans l'historique.`);
        return true;
      }
    } catch (e) {
      toast.error("Format de fichier d'historique invalide.");
    }
    return false;
  },
};
