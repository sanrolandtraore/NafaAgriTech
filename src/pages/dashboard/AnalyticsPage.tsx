import { useEffect, useState } from "react";
import PremiumGate from "@/components/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, TrendingUp, Calculator } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const AnalyticsPage = () => {
  const [cycles, setCycles] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [harvests, setHarvests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulation state
  const [simArea, setSimArea] = useState("5");
  const [simCropId, setSimCropId] = useState("");
  const [crops, setCrops] = useState<any[]>([]);
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      db.from("crop_cycles").select("id, season, expected_yield_kg, expected_revenue, actual_yield_kg, actual_revenue, plant_count, parcels(name, area_ha), crop_references(name)").order("created_at", { ascending: false }),
      db.from("cost_entries").select("amount, category").then(r => r),
      db.from("harvests").select("quantity_kg, unit_price_kg, sold, crop_cycles(season, crop_references(name))"),
      db.from("crop_references").select("*"),
    ]).then(([cyclesRes, costsRes, harvestsRes, cropsRes]) => {
      setCycles(cyclesRes.data || []);
      setCosts(costsRes.data || []);
      setHarvests(harvestsRes.data || []);
      setCrops(cropsRes.data || []);
      setLoading(false);
    });
  }, []);

  // Cycle comparison chart data
  const cycleChartData = cycles.slice(0, 8).map(c => ({
    name: `${c.crop_references?.name?.substring(0, 8) || "?"} · ${c.season?.substring(0, 10)}`,
    "Rendement estimé": Math.round(c.expected_yield_kg || 0),
    "Rendement réel": Math.round(c.actual_yield_kg || 0),
  }));

  // Cost breakdown
  const categoryLabels: Record<string, string> = { intrant: "Intrants", main_oeuvre: "Main d'œuvre", equipement: "Équipement", transport: "Transport", autre: "Autre" };
  const costByCategory = costs.reduce((acc: Record<string, number>, c: any) => {
    acc[c.category] = (acc[c.category] || 0) + Number(c.amount);
    return acc;
  }, {} as Record<string, number>);
  const costPieData = Object.entries(costByCategory).map(([k, v]) => ({ name: categoryLabels[k] || k, value: Math.round(v as number) }));

  // Revenue chart
  const revenueData = cycles.filter(c => c.expected_revenue).slice(0, 8).map(c => ({
    name: `${c.crop_references?.name?.substring(0, 8) || "?"}\n${c.parcels?.name?.substring(0, 8)}`,
    "Revenu projeté": Math.round(c.expected_revenue || 0),
    "Revenu réel": Math.round(c.actual_revenue || 0),
  }));

  // Simulation
  const runSimulation = () => {
    const crop = crops.find(c => c.id === simCropId);
    if (!crop) { toast.error("Sélectionnez une culture"); return; }
    const area = parseFloat(simArea) || 0;
    const yieldKg = area * (crop.avg_yield_per_ha || 0);
    const revenue = yieldKg * (crop.avg_price_per_kg || 0);
    const plants = area * (crop.plants_per_ha || 0);
    // Estimate input costs from input_requirements
    let inputCost = 0;
    if (crop.input_requirements && Array.isArray(crop.input_requirements)) {
      crop.input_requirements.forEach((inp: any) => {
        inputCost += (inp.quantity_per_ha || 0) * area * (inp.unit_price || 0);
      });
    }
    setSimResult({ area, crop: crop.name, yieldKg, revenue, plants, inputCost, profit: revenue - inputCost });
  };

  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="h-40" /></Card>)}</div>;

  return (
    <PremiumGate feature="analytics">
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Analyse & Simulation</h1>
        <p className="text-muted-foreground mt-1">Tableaux de bord, comparaisons et scénarios what-if</p>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Cycles</p><p className="text-2xl font-bold">{cycles.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total récolté</p><p className="text-2xl font-bold">{fmt(harvests.reduce((s, h) => s + Number(h.quantity_kg), 0))} kg</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Coûts totaux</p><p className="text-2xl font-bold">{fmt(costs.reduce((s, c) => s + Number(c.amount), 0))} FCFA</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Revenu ventes</p><p className="text-2xl font-bold">{fmt(harvests.filter(h => h.sold).reduce((s, h) => s + Number(h.quantity_kg) * Number(h.unit_price_kg || 0), 0))} FCFA</p></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {cycleChartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Comparaison rendements</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cycleChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString()} kg`} />
                  <Bar dataKey="Rendement estimé" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Rendement réel" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {costPieData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Répartition des coûts</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={costPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value.toLocaleString()}`}>
                    {costPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v.toLocaleString()} FCFA`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {revenueData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Revenus par cycle</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString()} FCFA`} />
                  <Bar dataKey="Revenu projeté" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Revenu réel" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Simulation */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Simulation what-if</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Culture</Label>
              <Select value={simCropId} onValueChange={setSimCropId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{crops.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.variety && `(${c.variety})`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Surface (ha)</Label><Input type="number" value={simArea} onChange={(e) => setSimArea(e.target.value)} /></div>
            <div className="flex items-end"><Button onClick={runSimulation} className="gradient-primary text-primary-foreground w-full"><Calculator className="h-4 w-4 mr-2" />Simuler</Button></div>
          </div>
          {simResult && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4">
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Culture</p><p className="text-lg font-bold">{simResult.crop}</p><p className="text-xs text-muted-foreground">{fmt(simResult.area)} ha</p></div>
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Plants estimés</p><p className="text-lg font-bold">{fmt(simResult.plants)}</p></div>
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Rendement estimé</p><p className="text-lg font-bold">{fmt(simResult.yieldKg)} kg</p></div>
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Revenu estimé</p><p className="text-lg font-bold">{fmt(simResult.revenue)} FCFA</p></div>
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Coût intrants</p><p className="text-lg font-bold">{fmt(simResult.inputCost)} FCFA</p></div>
              <div className={`rounded-lg p-3 ${simResult.profit >= 0 ? "bg-success/10" : "bg-destructive/10"}`}><p className="text-xs text-muted-foreground">Profit estimé</p><p className="text-lg font-bold">{fmt(simResult.profit)} FCFA</p></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PremiumGate>
  );
};

export default AnalyticsPage;
