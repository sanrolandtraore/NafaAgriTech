import { useState } from "react";
import PremiumGate from "@/components/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, Download, FileText, Loader2 } from "lucide-react";
import ExportPreviewTable from "@/components/ExportPreviewTable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { isMissingTableError } from "@/hooks/useOfflineData";
import { getCachedData } from "@/lib/offlineDb";

// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;

type ExportType = "cycles" | "costs" | "activities" | "harvests" | "investment" | "workers" | "equipment";

const exportOptions: { value: ExportType; label: string }[] = [
  { value: "cycles", label: "Cycles culturaux" },
  { value: "costs", label: "Coûts cultures" },
  { value: "activities", label: "Activités" },
  { value: "harvests", label: "Récoltes & Lots" },
  { value: "investment", label: "Plans d'investissement" },
  { value: "workers", label: "Main d'œuvre" },
  { value: "equipment", label: "Équipements" },
];

const fetchData = async (type: ExportType) => {
  switch (type) {
    case "cycles": return db.from("crop_cycles").select("season, status, start_date, end_date, expected_yield_kg, expected_revenue, actual_yield_kg, actual_revenue, plant_count, parcels(name, area_ha), crop_references(name)").order("created_at", { ascending: false });
    case "costs": return db.from("cost_entries").select("date, category, description, amount, crop_cycles(season, parcels(name))").order("date", { ascending: false });
    case "activities": return db.from("activity_logs").select("date, activity_type, description, quantity, unit, cost, crop_cycles(season, parcels(name))").order("date", { ascending: false });
    case "harvests": return db.from("harvests").select("date, lot_number, quantity_kg, quality_grade, unit_price_kg, buyer, sold, crop_cycles(season, crop_references(name))").order("date", { ascending: false });
    case "investment": return db.from("investment_plans").select("total_input_cost, total_labor_cost, total_equipment_cost, total_transport_cost, total_investment, expected_revenue, expected_roi_percent, break_even_yield_kg, crop_cycles(season, parcels(name), crop_references(name))").order("created_at", { ascending: false });
    case "workers": return db.from("workers").select("full_name, role, phone, daily_rate, status, farms(name)").order("full_name");
    case "equipment": {
      try {
        const res = await db.from("equipment").select("name, type, status, purchase_date, purchase_cost, farms(name)").order("name");
        if (res.error && isMissingTableError(res.error)) {
          const cached = await getCachedData("equipment", "useOfflineData_equipment_*, farms(name)");
          return { data: (cached as any[]) || [], error: null };
        }
        return res;
      } catch (err: any) {
        if (isMissingTableError(err)) {
          const cached = await getCachedData("equipment", "useOfflineData_equipment_*, farms(name)");
          return { data: (cached as any[]) || [], error: null };
        }
        return { data: null, error: err };
      }
    }
  }
};

const flattenRow = (row: any): Record<string, any> => {
  const flat: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v as Record<string, any>)) flat[`${k}_${k2}`] = v2;
    } else flat[k] = v;
  }
  return flat;
};

const AgriculteurExportPage = () => {
  const [selected, setSelected] = useState<ExportType>("cycles");
  const [loading, setLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[] | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchData(selected);
      if (error) {
        if (isMissingTableError(error)) {
          toast.info("Aucune donnée disponible pour ce module");
          setPreviewRows(null);
          return;
        }
        throw error;
      }
      if (!data?.length) { toast.info("Aucune donnée à exporter"); setPreviewRows(null); return; }
      const rows = data.map(flattenRow);
      setPreviewHeaders(Object.keys(rows[0]));
      setPreviewRows(rows);
    } catch (err: any) {
      if (isMissingTableError(err)) {
        toast.info("Aucune donnée disponible pour ce module");
        setPreviewRows(null);
      } else {
        toast.error(err.message);
      }
    }
    finally { setLoading(false); }
  };

  return (
    <PremiumGate feature="export">
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Export — Cultures & Ressources</h1>
        <p className="text-muted-foreground mt-1">Prévisualisez et modifiez vos données avant export</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Sélection du rapport</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type de données</Label>
            <Select value={selected} onValueChange={v => { setSelected(v as ExportType); setPreviewRows(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {exportOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={loadPreview} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
            {loading ? "Chargement..." : "Charger l'aperçu"}
          </Button>
        </CardContent>
      </Card>

      {previewRows && (
        <ExportPreviewTable
          rows={previewRows}
          headers={previewHeaders}
          title={exportOptions.find(o => o.value === selected)?.label || selected}
          filePrefix={`nafa_${selected}`}
          headerColor={[139, 90, 43]}
          onRowsChange={setPreviewRows}
        />
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Dossier de financement</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Générez un dossier complet pour présentation bancaire.</p>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const [cyclesRes, plansRes, costsRes, harvestsRes] = await Promise.all([
                  db.from("crop_cycles").select("season, status, start_date, expected_yield_kg, expected_revenue, plant_count, parcels(name, area_ha, farms(name)), crop_references(name)"),
                  db.from("investment_plans").select("*, crop_cycles(season, parcels(name), crop_references(name))"),
                  db.from("cost_entries").select("date, category, description, amount"),
                  db.from("harvests").select("date, lot_number, quantity_kg, quality_grade, unit_price_kg, sold"),
                ]);
                const doc = new jsPDF();
                doc.setFontSize(20); doc.text("DOSSIER DE FINANCEMENT", 14, 20);
                doc.setFontSize(10); doc.text("NAFA - AGRITECH — Plateforme de Gestion Agricole", 14, 28);
                doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 14, 34);
                let y = 45;
                doc.setFontSize(14); doc.text("1. Cycles culturaux", 14, y);
                autoTable(doc, { startY: y + 5, head: [["Exploitation", "Parcelle", "Culture", "Saison", "Surface ha", "Rend. kg", "Revenu FCFA"]], body: (cyclesRes.data || []).map((c: any) => [c.parcels?.farms?.name || "", c.parcels?.name || "", c.crop_references?.name || "", c.season, String(c.parcels?.area_ha || ""), String(Math.round(c.expected_yield_kg || 0)), String(Math.round(c.expected_revenue || 0))]), styles: { fontSize: 7 }, headStyles: { fillColor: [139, 90, 43] } });
                y = (doc as any).lastAutoTable.finalY + 10;
                doc.setFontSize(14); doc.text("2. Plans d'investissement", 14, y);
                autoTable(doc, { startY: y + 5, head: [["Cycle", "Investissement", "Revenu projeté", "ROI", "Seuil kg"]], body: (plansRes.data || []).map((p: any) => [`${p.crop_cycles?.crop_references?.name} · ${p.crop_cycles?.season}`, String(Math.round(p.total_investment)), String(Math.round(p.expected_revenue)), `${p.expected_roi_percent}%`, String(Math.round(p.break_even_yield_kg || 0))]), styles: { fontSize: 7 }, headStyles: { fillColor: [139, 90, 43] } });
                y = (doc as any).lastAutoTable.finalY + 10;
                if (y > 250) { doc.addPage(); y = 20; }
                const totalCosts = (costsRes.data || []).reduce((s: number, c: any) => s + Number(c.amount), 0);
                const totalHarvest = (harvestsRes.data || []).reduce((s: number, h: any) => s + Number(h.quantity_kg), 0);
                const totalSales = (harvestsRes.data || []).filter((h: any) => h.sold).reduce((s: number, h: any) => s + Number(h.quantity_kg) * Number(h.unit_price_kg || 0), 0);
                doc.setFontSize(14); doc.text("3. Résumé financier", 14, y);
                doc.setFontSize(10);
                doc.text(`Total coûts: ${Math.round(totalCosts).toLocaleString()} FCFA`, 14, y + 8);
                doc.text(`Total récolté: ${Math.round(totalHarvest).toLocaleString()} kg`, 14, y + 14);
                doc.text(`Revenu ventes: ${Math.round(totalSales).toLocaleString()} FCFA`, 14, y + 20);
                doc.save(`nafa_dossier_financement.pdf`);
                toast.success("Dossier généré !");
              } catch (err: any) { toast.error(err.message); }
              finally { setLoading(false); }
            }}
          >
            <FileText className="h-4 w-4 mr-2" />{loading ? "Génération..." : "Générer le dossier de financement"}
          </Button>
        </CardContent>
      </Card>
    </div>
    </PremiumGate>
  );
};

export default AgriculteurExportPage;
