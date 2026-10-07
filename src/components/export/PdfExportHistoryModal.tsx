import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Search,
  Download,
  Trash2,
  Calendar,
  User,
  RotateCcw,
  Layers,
  FileCheck2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import {
  pdfExportHistory,
  PdfExportRecord,
  PdfModuleType,
  PDF_MODULE_METADATA,
} from "@/lib/pdfExportHistory";
import { toast } from "sonner";

interface PdfExportHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultModuleFilter?: PdfModuleType;
  title?: string;
}

export default function PdfExportHistoryModal({
  open,
  onOpenChange,
  defaultModuleFilter,
  title = "Historique des Exports PDF & Documents",
}: PdfExportHistoryModalProps) {
  const [history, setHistory] = useState<PdfExportRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<PdfModuleType | "all">(
    defaultModuleFilter || "all"
  );

  const loadHistory = () => {
    setHistory(pdfExportHistory.getHistory());
  };

  useEffect(() => {
    if (open) {
      loadHistory();
      if (defaultModuleFilter) {
        setSelectedModule(defaultModuleFilter);
      }
    }

    const handleUpdate = () => {
      loadHistory();
    };

    window.addEventListener("nafa_pdf_history_updated", handleUpdate);
    return () => {
      window.removeEventListener("nafa_pdf_history_updated", handleUpdate);
    };
  }, [open, defaultModuleFilter]);

  // Filtrage combiné : module et recherche texte
  const filteredHistory = history.filter((item) => {
    const matchesModule =
      selectedModule === "all" ? true : item.module === selectedModule;
    if (!matchesModule) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.filename.toLowerCase().includes(q) ||
      (item.clientName && item.clientName.toLowerCase().includes(q)) ||
      (item.authorName && item.authorName.toLowerCase().includes(q)) ||
      (item.summary && item.summary.toLowerCase().includes(q)) ||
      item.categoryLabel.toLowerCase().includes(q)
    );
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pdfExportHistory.deleteRecord(id);
    loadHistory();
  };

  const handleClearAll = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vider tout l'historique des exports PDF ?")) {
      pdfExportHistory.clearHistory();
      loadHistory();
    }
  };

  const handleDownloadAgain = (item: PdfExportRecord) => {
    // Si un snapshot de données est stocké, on peut régénérer ou informer l'utilisateur
    toast.info(`Document "${item.filename}" archivé à la date du ${new Date(item.createdAt).toLocaleDateString("fr-FR")}.`);
  };

  const handleExportJsonBackup = () => {
    const jsonStr = pdfExportHistory.exportHistoryAsJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nafa_historique_pdf_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sauvegarde de l'historique exportée !");
  };

  const modulePills: { id: PdfModuleType | "all"; label: string }[] = [
    { id: "all", label: `Tous (${history.length})` },
    { id: "field_designer", label: "CAO & Plans" },
    { id: "studio_3d", label: "Studio 3D" },
    { id: "inspection", label: "Inspections" },
    { id: "crop_diagnosis", label: "Diagnostics" },
    { id: "livestock", label: "Élevage" },
    { id: "quote_finance", label: "Devis & Banque" },
    { id: "farm_management", label: "Gestion" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-[28px] border-2 border-emerald-500/30">
        <DialogHeader className="p-5 pb-3 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-heading font-black flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <span>{title}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-emerald-100/70">
                Retrouvez, consultez et gérez tous vos dossiers techniques, devis et rapports officiels exportés.
              </DialogDescription>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs px-2.5 py-1">
              {history.length} document{history.length > 1 ? "s" : ""} archivé{history.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </DialogHeader>

        {/* Barre d'Outils : Recherche & Filtres Rapides */}
        <div className="p-4 space-y-3 border-b bg-muted/20 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom de fichier, titre, exploitant ou mot-clé..."
              className="pl-9 pr-8 text-xs h-9 rounded-xl"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtres par Module Métier */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {modulePills.map((pill) => {
              const isActive = selectedModule === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedModule(pill.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des Documents Archivés */}
        <ScrollArea className="flex-1 p-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto">
                <FileCheck2 className="h-6 w-6 opacity-40" />
              </div>
              <h4 className="font-bold text-sm text-foreground">
                Aucun document PDF trouvé dans l'historique
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchTerm
                  ? "Aucun export ne correspond à votre recherche actuelle. Essayez d'autres mots-clés."
                  : "Lorsque vous générez et téléchargez un rapport technique, devis ou dossier, il apparaît automatiquement ici pour consultation ultérieure."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredHistory.map((item) => {
                const meta = PDF_MODULE_METADATA[item.module] || {
                  label: item.categoryLabel,
                  color: "bg-muted text-muted-foreground",
                };
                const dateFormatted = new Date(item.createdAt).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:p-3.5 rounded-2xl border bg-card hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[280px] sm:max-w-[400px]">
                            {item.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 px-2 font-bold ${meta.color}`}
                          >
                            {item.categoryLabel}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="h-3 w-3" />
                            {dateFormatted}
                          </span>
                          {item.clientName && (
                            <span className="flex items-center gap-1 truncate max-w-[160px]">
                              <User className="h-3 w-3" />
                              {item.clientName}
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-muted-foreground/70">
                            {item.filename}
                          </span>
                        </div>

                        {item.summary && (
                          <p className="text-[11px] text-foreground/80 line-clamp-1 italic">
                            « {item.summary} »
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                        title="Supprimer de l'historique"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Pied de dialogue */}
        <div className="p-3.5 border-t bg-muted/20 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportJsonBackup}
              disabled={history.length === 0}
              className="h-8 text-xs rounded-xl gap-1.5 font-bold"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Sauvegarde JSON</span>
            </Button>
            {history.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                className="h-8 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl"
              >
                Vider l'historique
              </Button>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 rounded-xl px-4 font-bold"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
