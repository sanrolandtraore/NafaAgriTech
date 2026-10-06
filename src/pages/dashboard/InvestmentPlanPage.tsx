import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calculator, TrendingUp, Leaf, DollarSign, Package } from "lucide-react";

// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;

const InvestmentPlanPage = () => {
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [plan, setPlan] = useState<any>(null);
  const [inputs, setInputs] = useState<any[]>([]);
  const [cycle, setCycle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    db
      .from("crop_cycles")
      .select("id, season, status, parcels(name), crop_references(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCycles(data || []));
  }, []);

  const loadCycleData = async (cycleId: string) => {
    setSelectedCycleId(cycleId);
    setLoading(true);

    const [cycleRes, planRes, inputsRes] = await Promise.all([
      db
        .from("crop_cycles")
        .select("*, parcels(name, area_ha, calculated_area_ha), crop_references(name, plants_per_ha, avg_yield_per_ha, avg_price_per_kg)")
        .eq("id", cycleId)
        .single(),
      db.from("investment_plans").select("*").eq("crop_cycle_id", cycleId).maybeSingle(),
      db.from("crop_cycle_inputs").select("*").eq("crop_cycle_id", cycleId).order("input_name"),
    ]);

    setCycle(cycleRes.data);
    setPlan(planRes.data);
    setInputs(inputsRes.data || []);
    setLoading(false);
  };

  const runCalculation = async () => {
    if (!selectedCycleId) return;
    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-crop-cycle", {
        body: { crop_cycle_id: selectedCycleId },
      });
      if (error) throw error;
      toast.success("Calculs exécutés avec succès !");
      loadCycleData(selectedCycleId);
    } catch (err: any) {
      toast.error(err.message || "Erreur de calcul");
    }
    setCalculating(false);
  };

  const fmt = (n: number | null) => (n != null ? Math.round(n).toLocaleString("fr-FR") : "—");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Plan d'investissement</h1>
          <p className="text-muted-foreground mt-1">Projections rendement, intrants & ROI</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select value={selectedCycleId} onValueChange={loadCycleData}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un cycle cultural" /></SelectTrigger>
                <SelectContent>
                  {cycles.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.crop_references?.name || "—"} · {c.parcels?.name} · {c.season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={runCalculation}
              disabled={!selectedCycleId || calculating}
              className="gradient-primary text-primary-foreground"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {calculating ? "Calcul en cours..." : "Recalculer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>
          ))}
        </div>
      ) : cycle ? (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Leaf className="h-4 w-4" /> Plants estimés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(cycle.plant_count)}</p>
                <p className="text-xs text-muted-foreground">
                  Sur {fmt(cycle.parcels?.calculated_area_ha || cycle.parcels?.area_ha)} ha
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Rendement projeté
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(cycle.expected_yield_kg)} kg</p>
                <p className="text-xs text-muted-foreground">Coeff. climat: {cycle.climate_coefficient}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Revenu projeté
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(cycle.expected_revenue)} FCFA</p>
              </CardContent>
            </Card>

            <Card className={plan?.expected_roi_percent > 0 ? "border-success/30" : "border-destructive/30"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> ROI estimé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{plan ? `${plan.expected_roi_percent}%` : "—"}</p>
                <p className="text-xs text-muted-foreground">
                  Seuil rentabilité: {plan ? `${fmt(plan.break_even_yield_kg)} kg` : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Input Requirements */}
          {inputs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" /> Intrants requis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2">Intrant</th>
                        <th className="text-right py-2">Qté/ha</th>
                        <th className="text-right py-2">Total</th>
                        <th className="text-right py-2">Unité</th>
                        <th className="text-right py-2">Prix unit.</th>
                        <th className="text-right py-2">Coût total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inputs.map((inp: any) => (
                        <tr key={inp.id} className="border-b">
                          <td className="py-2 font-medium">{inp.input_name}</td>
                          <td className="text-right">{inp.quantity_per_ha}</td>
                          <td className="text-right">{fmt(inp.total_quantity)}</td>
                          <td className="text-right">{inp.unit}</td>
                          <td className="text-right">{fmt(inp.unit_price)} FCFA</td>
                          <td className="text-right font-medium">{fmt(inp.total_cost)} FCFA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Investment Breakdown */}
          {plan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Détail investissement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Intrants</p>
                    <p className="text-lg font-bold">{fmt(plan.total_input_cost)} FCFA</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Main d'œuvre</p>
                    <p className="text-lg font-bold">{fmt(plan.total_labor_cost)} FCFA</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Équipement</p>
                    <p className="text-lg font-bold">{fmt(plan.total_equipment_cost)} FCFA</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Transport</p>
                    <p className="text-lg font-bold">{fmt(plan.total_transport_cost)} FCFA</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center rounded-lg bg-primary/10 p-4">
                  <span className="font-medium">Investissement total</span>
                  <span className="text-xl font-bold">{fmt(plan.total_investment)} FCFA</span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Sélectionnez un cycle cultural pour voir les projections
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvestmentPlanPage;
