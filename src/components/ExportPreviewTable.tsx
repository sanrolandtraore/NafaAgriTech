import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, FileSpreadsheet, Eye, Trash2, RotateCcw, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { pdfExportHistory } from "@/lib/pdfExportHistory";
import PdfExportHistoryModal from "@/components/export/PdfExportHistoryModal";

export interface ExportPreviewProps {
  rows: Record<string, any>[];
  headers: string[];
  title: string;
  filePrefix: string;
  headerColor?: [number, number, number];
  onRowsChange: (rows: Record<string, any>[]) => void;
}

/** Human-readable labels for common DB column names */
const columnLabels: Record<string, string> = {
  season: "Saison", status: "Statut", start_date: "Début", end_date: "Fin",
  expected_yield_kg: "Rend. estimé (kg)", expected_revenue: "Revenu estimé",
  actual_yield_kg: "Rend. réel (kg)", actual_revenue: "Revenu réel",
  plant_count: "Nb plantes", parcels_name: "Parcelle", parcels_area_ha: "Surface (ha)",
  crop_references_name: "Culture", date: "Date", category: "Catégorie",
  description: "Description", amount: "Montant (FCFA)", crop_cycles_season: "Saison",
  crop_cycles_parcels_name: "Parcelle", activity_type: "Type activité",
  quantity: "Quantité", unit: "Unité", cost: "Coût", lot_number: "N° lot",
  quantity_kg: "Quantité (kg)", quality_grade: "Qualité", unit_price_kg: "Prix/kg",
  buyer: "Acheteur", sold: "Vendu", crop_cycles_crop_references_name: "Culture",
  total_input_cost: "Coût intrants", total_labor_cost: "Coût MO",
  total_equipment_cost: "Coût équip.", total_transport_cost: "Coût transport",
  total_investment: "Investissement total", expected_roi_percent: "ROI (%)",
  break_even_yield_kg: "Seuil rentab. (kg)", full_name: "Nom complet",
  role: "Rôle", phone: "Téléphone", daily_rate: "Tarif/jour", farms_name: "Exploitation",
  name: "Nom", type: "Type", purchase_date: "Date achat", purchase_cost: "Coût achat",
  identification_number: "N° identif.", species: "Espèce", breed: "Race", sex: "Sexe",
  birth_date: "Date naissance", acquisition_date: "Date acquis.", acquisition_cost: "Coût acquis.",
  weight_kg: "Poids (kg)", event_date: "Date", event_type: "Type événement",
  medication: "Médicament", dosage: "Dosage", vet_name: "Vétérinaire", next_date: "Prochain RDV",
  animals_name: "Animal", animals_species: "Espèce", expected_birth_date: "Naissance prévue",
  actual_birth_date: "Naissance réelle", offspring_count: "Nb petits", offspring_alive: "Vivants",
  feeding_date: "Date", feed_type: "Type aliment", feed_name: "Aliment",
  unit_price: "Prix unitaire", supplier: "Fournisseur", last_purchase_date: "Dernier achat",
  expense_date: "Date", sale_date: "Date", sale_type: "Type vente",
  total_amount: "Montant total", payment_status: "Paiement",
  created_at: "Créé le", service_type: "Type service", location: "Lieu",
  preferred_date: "Date souhaitée", expert_notes: "Notes expert", estimated_cost: "Coût estimé",
  collecte_date: "Date collecte", product_name: "Produit", product_type: "Type produit",
  warehouse: "Entrepôt", notes: "Notes", membre: "Membre", vente: "Vente",
  member_share: "Part membre", paid: "Payé", paid_date: "Date paiement",
  joined_date: "Date adhésion", member_type: "Type membre",
  crop_type: "Culture", livestock_type: "Élevage", area_ha: "Surface (ha)",
};

const getLabel = (key: string) => columnLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const ExportPreviewTable = ({ rows, headers, title, filePrefix, headerColor = [139, 90, 43], onRowsChange }: ExportPreviewProps) => {
  const [search, setSearch] = useState("");
  const [deletedIndices, setDeletedIndices] = useState<Set<number>>(new Set());
  const [showPdfHistory, setShowPdfHistory] = useState(false);

  const visibleRows = rows.filter((row, idx) => {
    if (deletedIndices.has(idx)) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return headers.some(h => String(row[h] ?? "").toLowerCase().includes(s));
  });

  const handleCellEdit = useCallback((rowIdx: number, col: string, value: string) => {
    const updated = [...rows];
    updated[rowIdx] = { ...updated[rowIdx], [col]: value };
    onRowsChange(updated);
  }, [rows, onRowsChange]);

  const handleDeleteRow = useCallback((originalIdx: number) => {
    setDeletedIndices(prev => new Set(prev).add(originalIdx));
  }, []);

  const handleRestore = useCallback(() => {
    setDeletedIndices(new Set());
  }, []);

  const getExportRows = () => rows.filter((_, idx) => !deletedIndices.has(idx));

  const exportCSV = () => {
    const exportRows = getExportRows();
    if (!exportRows.length) { toast.error("Aucune donnée à exporter"); return; }
    const csv = [
      headers.map(getLabel).join(";"),
      ...exportRows.map(r => headers.map(h => `"${r[h] ?? ""}"`).join(";")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filePrefix}_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exporté !");
  };

  const exportPDF = () => {
    const exportRows = getExportRows();
    if (!exportRows.length) { toast.error("Aucune donnée à exporter"); return; }
    const doc = new jsPDF({ orientation: headers.length > 6 ? "landscape" : "portrait" });
    doc.setFontSize(16); doc.text(`NAFA - AGRITECH — ${title}`, 14, 18);
    doc.setFontSize(9); doc.text(`Généré le ${new Date().toLocaleDateString("fr")}`, 14, 25);
    autoTable(doc, {
      startY: 30,
      head: [headers.map(getLabel)],
      body: exportRows.map(r => headers.map(h => String(r[h] ?? ""))),
      styles: { fontSize: 7 },
      headStyles: { fillColor: headerColor },
    });
    const filename = `${filePrefix}_${new Date().toISOString().split("T")[0]}.pdf`;
    pdfExportHistory.saveAndRecordPdf({
      title: `Export de Données - ${title}`,
      filename,
      module: "farm_management",
      categoryLabel: "Export Table & Données",
      doc,
      summary: `Export tableau de ${exportRows.length} lignes (${headers.length} colonnes) — ${title}.`,
      dataSnapshot: {
        filePrefix,
        rowsCount: exportRows.length,
        headersCount: headers.length,
      },
    });
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Aperçu des données
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {visibleRows.length} ligne{visibleRows.length > 1 ? "s" : ""}
              {deletedIndices.size > 0 && (
                <span className="text-destructive ml-1">
                  ({deletedIndices.size} supprimée{deletedIndices.size > 1 ? "s" : ""})
                </span>
              )}
              {" · "}Cliquez sur une cellule pour modifier
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {deletedIndices.size > 0 && (
              <Button variant="ghost" size="sm" onClick={handleRestore}>
                <RotateCcw className="h-4 w-4 mr-1" />Restaurer
              </Button>
            )}
            <Button size="sm" onClick={exportPDF}>
              <FileText className="h-4 w-4 mr-1" />PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPdfHistory(true)}
              className="border-primary/30 hover:bg-primary/10"
              title="Consulter l'historique de tous les documents PDF exportés"
            >
              <FileText className="h-4 w-4 mr-1 text-primary" />Historique PDF
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />CSV
            </Button>

          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les données..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearch("")}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Table */}
        <ScrollArea className="max-h-[500px] border rounded-lg">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10 text-center">#</TableHead>
                  {headers.map(h => (
                    <TableHead key={h} className="whitespace-nowrap text-xs font-semibold">
                      {getLabel(h)}
                    </TableHead>
                  ))}
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length + 2} className="text-center py-8 text-muted-foreground">
                      {search ? "Aucun résultat pour cette recherche" : "Aucune donnée"}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((row, visIdx) => {
                    const originalIdx = rows.indexOf(row);
                    return (
                      <TableRow key={originalIdx} className="group hover:bg-muted/30">
                        <TableCell className="text-center text-xs text-muted-foreground">{visIdx + 1}</TableCell>
                        {headers.map(h => (
                          <TableCell key={h} className="p-0">
                            <input
                              className="w-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-accent/30 focus:ring-1 focus:ring-primary/30 rounded transition-colors min-w-[80px]"
                              value={String(row[h] ?? "")}
                              onChange={e => handleCellEdit(originalIdx, h, e.target.value)}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteRow(originalIdx)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{getExportRows().length} lignes à exporter</Badge>
          <Badge variant="secondary">{headers.length} colonnes</Badge>
        </div>
      </CardContent>

      <PdfExportHistoryModal
        open={showPdfHistory}
        onOpenChange={setShowPdfHistory}
        defaultModuleFilter="farm_management"
        title="Historique des Exports de Données PDF"
      />
    </Card>
  );
};


export default ExportPreviewTable;
