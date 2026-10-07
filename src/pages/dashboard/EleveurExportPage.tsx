import { useState } from "react";
import PremiumGate from "@/components/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, Loader2 } from "lucide-react";
import ExportPreviewTable from "@/components/ExportPreviewTable";

// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;

type ExportType = "animals" | "health" | "reproductions" | "feedings" | "feed_stocks" | "livestock_expenses" | "livestock_sales";

const exportOptions: { value: ExportType; label: string }[] = [
  { value: "animals", label: "Registre animaux" },
  { value: "health", label: "Santé animale" },
  { value: "reproductions", label: "Reproduction" },
  { value: "feedings", label: "Alimentation" },
  { value: "feed_stocks", label: "Stocks aliments" },
  { value: "livestock_expenses", label: "Dépenses élevage" },
  { value: "livestock_sales", label: "Ventes élevage" },
];

const fetchData = async (type: ExportType) => {
  switch (type) {
    case "animals": return db.from("animals").select("name, identification_number, species, breed, sex, status, birth_date, acquisition_date, acquisition_cost, weight_kg, farms(name)").order("created_at", { ascending: false });
    case "health": return db.from("animal_health_events").select("event_date, event_type, description, medication, dosage, cost, vet_name, next_date, animals(name, species)").order("event_date", { ascending: false });
    case "reproductions": return db.from("animal_reproductions").select("event_date, event_type, expected_birth_date, actual_birth_date, offspring_count, offspring_alive, cost, animals!animal_reproductions_animal_id_fkey(name, species)").order("event_date", { ascending: false });
    case "feedings": return db.from("animal_feedings").select("feeding_date, feed_type, quantity_kg, cost, animals(name), farms(name)").order("feeding_date", { ascending: false });
    case "feed_stocks": return db.from("feed_stocks").select("feed_name, quantity_kg, unit_price, supplier, last_purchase_date, farms(name)").order("feed_name");
    case "livestock_expenses": return db.from("livestock_expenses").select("expense_date, category, description, amount, farms(name), animals(name)").order("expense_date", { ascending: false });
    case "livestock_sales": return db.from("livestock_sales").select("sale_date, sale_type, description, quantity, unit_price, total_amount, buyer, farms(name), animals(name)").order("sale_date", { ascending: false });
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

const EleveurExportPage = () => {
  const [selected, setSelected] = useState<ExportType>("animals");
  const [loading, setLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[] | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchData(selected);
      if (error) throw error;
      if (!data?.length) { toast.error("Aucune donnée à exporter"); setPreviewRows(null); return; }
      const rows = data.map(flattenRow);
      setPreviewHeaders(Object.keys(rows[0]));
      setPreviewRows(rows);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <PremiumGate feature="export">
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Export — Élevage</h1>
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
          filePrefix={`nafa_elevage_${selected}`}
          headerColor={[34, 120, 74]}
          onRowsChange={setPreviewRows}
        />
      )}
    </div>
    </PremiumGate>
  );
};

export default EleveurExportPage;
