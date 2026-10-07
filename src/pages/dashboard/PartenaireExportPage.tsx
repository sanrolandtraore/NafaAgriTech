import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, Download, FileText, Loader2, Store } from "lucide-react";
import ExportPreviewTable from "@/components/ExportPreviewTable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { partnerStorage } from "@/lib/partnerStorage";
import { useAuth } from "@/contexts/AuthContext";

type ExportType = "offers" | "missions" | "clients" | "interventions" | "quotes";

const exportOptions: { value: ExportType; label: string }[] = [
  { value: "offers", label: "Catalogue des offres & produits" },
  { value: "missions", label: "Missions & Prestations facturées" },
  { value: "clients", label: "Portefeuille clients & exploitants" },
  { value: "interventions", label: "Comptes-rendus d'interventions terrain" },
  { value: "quotes", label: "Demandes de devis" },
];

export default function PartenaireExportPage() {
  const { user, profile } = useAuth();
  const [selected, setSelected] = useState<ExportType>("offers");
  const [loading, setLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[] | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);

  const loadData = async (type: ExportType) => {
    switch (type) {
      case "offers": {
        const data = await partnerStorage.getOffers(user?.id);
        return data.map((o) => ({
          Titre: o.title,
          Catégorie: o.category,
          Prix: o.price_indication ? `${o.price_indication}${o.unit ? ` / ${o.unit}` : ""}` : "-",
          Entreprise: o.partner_name,
          Localisation: o.location_name || "-",
          Téléphone: o.contact_phone || "-",
          En_ligne: o.is_active ? "Oui" : "Non",
          Médias: `${o.media?.length || 0} (photos/vidéos)`,
        }));
      }
      case "missions": {
        const data = await partnerStorage.getMissions(user?.id);
        return data.map((m) => ({
          Mission: m.title,
          Client: m.client_name,
          Domaine: m.domain,
          Prestation: m.service_type,
          Date_prévue: m.scheduled_date,
          Statut: m.status,
          Montant_FCFA: m.price != null ? Number(m.price).toLocaleString("fr-FR") : "-",
          Payé: m.paid ? "Oui" : "Non",
        }));
      }
      case "clients": {
        const data = await partnerStorage.getClients(user?.id);
        return data.map((c) => ({
          Nom_client: c.client_full_name,
          Téléphone: c.client_phone || "-",
          Localité: c.location || "-",
          Statut: c.status,
          Depuis_le: c.since,
          Notes: c.notes || "-",
        }));
      }
      case "interventions": {
        const data = await partnerStorage.getInterventions(user?.id);
        return data.map((i) => ({
          Date: i.intervention_date,
          Type: i.intervention_type,
          Durée_h: i.duration_hours || "-",
          Coût_FCFA: i.cost != null ? i.cost.toLocaleString("fr-FR") : "-",
          Observations: i.observations || "-",
          Actions: i.actions_done || "-",
          Recommandations: i.recommendations || "-",
        }));
      }
      case "quotes": {
        const data = await partnerStorage.getQuotes();
        return data.map((q) => ({
          Offre: q.offer_title || "-",
          Demandeur: q.requester_name || "-",
          Téléphone: q.contact_phone || "-",
          Quantité: q.quantity || "-",
          Date_besoin: q.needed_by || "-",
          Statut: q.status,
          Message: q.message || "-",
          Réponse: q.response || "-",
        }));
      }
    }
  };

  const loadPreview = async () => {
    setLoading(true);
    try {
      const data = await loadData(selected);
      if (!data?.length) {
        toast.info("Aucune donnée enregistrée à exporter");
        setPreviewRows(null);
        return;
      }
      setPreviewHeaders(Object.keys(data[0]));
      setPreviewRows(data);
      toast.success("Aperçu généré avec succès !");
    } catch (e: any) {
      toast.error(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const rows = previewRows || (await loadData(selected));
      if (!rows?.length) {
        toast.error("Aucune donnée à exporter");
        return;
      }
      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(";"),
        ...rows.map((row) =>
          headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(";")
        ),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nafa_${selected}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Fichier CSV exporté !");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'export CSV");
    }
  };

  const exportPDF = async () => {
    try {
      const rows = previewRows || (await loadData(selected));
      if (!rows?.length) {
        toast.error("Aucune donnée à exporter");
        return;
      }
      const headers = Object.keys(rows[0]);
      const tableData = rows.map((r) => headers.map((h) => String(r[h] ?? "")));

      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.text("NAFA - AGRITECH — Bilan Partenaire Commercial", 14, 15);
      doc.setFontSize(10);
      doc.text(
        `Document : ${exportOptions.find((o) => o.value === selected)?.label} | Entreprise : ${profile?.full_name || "Partenaire"} | Date : ${new Date().toLocaleDateString("fr-FR")}`,
        14,
        22
      );

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [40, 116, 166] },
      });

      doc.save(`nafa_${selected}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Rapport PDF généré !");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'export PDF");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">Export & Bilans Partenaire</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Générez des rapports PDF certifiés ou exportez vos données au format CSV (Excel).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Sélection des données à exporter</CardTitle>
          <CardDescription className="text-xs">
            Choisissez la table commerciale et téléchargez votre bilan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Type de données</Label>
              <Select value={selected} onValueChange={(v) => { setSelected(v as ExportType); setPreviewRows(null); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exportOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={loadPreview} disabled={loading} variant="secondary" className="text-xs">
              {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Eye className="h-4 w-4 mr-1.5" />}
              Prévisualiser
            </Button>
            <Button onClick={exportPDF} disabled={loading} className="gradient-primary text-primary-foreground text-xs font-semibold">
              <Download className="h-4 w-4 mr-1.5" /> Exporter en PDF
            </Button>
            <Button onClick={exportCSV} disabled={loading} variant="outline" className="text-xs">
              <FileText className="h-4 w-4 mr-1.5" /> Exporter en CSV (Excel)
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewRows && previewRows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Aperçu des données ({previewRows.length} lignes)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExportPreviewTable
              headers={previewHeaders}
              rows={previewRows}
              title={exportOptions.find((o) => o.value === selected)?.label || selected}
              filePrefix={`nafa_${selected}`}
              headerColor={[40, 116, 166]}
              onRowsChange={setPreviewRows}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
