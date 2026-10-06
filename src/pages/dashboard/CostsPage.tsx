import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useOfflineData } from "@/hooks/useOfflineData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, DollarSign, WifiOff } from "lucide-react";

// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;


const categories = [
  { value: "intrant", label: "Intrant" },
  { value: "main_oeuvre", label: "Main d'œuvre" },
  { value: "equipement", label: "Équipement" },
  { value: "transport", label: "Transport" },
  { value: "autre", label: "Autre" },
];

const CostsPage = () => {
  const { data: costs, loading, isOffline, insertRow, deleteRow } = useOfflineData({
    table: "cost_entries",
    select: "*, crop_cycles(season, parcels(name), crop_references(name))",
    orderBy: "date",
  });
  const [cycles, setCycles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ crop_cycle_id: "", category: "intrant" as string, description: "", amount: "", date: new Date().toISOString().split("T")[0] });

  useEffect(() => {
    db.from("crop_cycles").select("id, season, parcels(name), crop_references(name)").then(({ data }) => setCycles(data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.crop_cycle_id) { toast.error("Veuillez sélectionner un cycle cultural"); return; }
    if (!form.description.trim()) { toast.error("La description est requise"); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Le montant doit être supérieur à 0"); return; }
    const result = await insertRow({
      crop_cycle_id: form.crop_cycle_id,
      category: form.category as any,
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
    });
    if (result) {
      toast.success("Coût enregistré !");
      setForm({ crop_cycle_id: "", category: "intrant", description: "", amount: "", date: new Date().toISOString().split("T")[0] });
      setOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce coût ?")) return;
    const ok = await deleteRow(id);
    if (ok) toast.success("Supprimé");
  };

  const totalCost = costs.reduce((s, c: any) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            Coûts
            {isOffline && <WifiOff className="h-4 w-4 text-warning" />}
          </h1>
          <p className="text-muted-foreground mt-1">Suivi des dépenses par cycle cultural</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground" disabled={cycles.length === 0}><Plus className="h-4 w-4 mr-2" />Nouveau coût</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Enregistrer un coût</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Cycle cultural *</Label>
                <Select value={form.crop_cycle_id} onValueChange={(v) => setForm({ ...form, crop_cycle_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{cycles.map((c) => <SelectItem key={c.id} value={c.id}>{c.crop_references?.name || "N/A"} - {c.parcels?.name} ({c.season})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Description *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Engrais NPK" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Montant (FCFA) *</Label><Input type="number" step="any" min="0" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {!loading && costs.length > 0 && (
        <Card className="gradient-warm shadow-warm">
          <CardContent className="py-4 flex items-center justify-between">
            <span className="font-heading font-bold text-accent-foreground">Coût total</span>
            <span className="text-2xl font-heading font-bold text-accent-foreground">{totalCost.toLocaleString()} FCFA</span>
          </CardContent>
        </Card>
      )}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="h-16" /></Card>)}</div>
      ) : costs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">{cycles.length === 0 ? "Créez d'abord un cycle cultural" : "Aucun coût enregistré"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {costs.map((c: any) => (
            <Card key={c.id} className={`shadow-sm ${c._offline ? "border-warning/50" : ""}`}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{c.description}</span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{categories.find(cat => cat.value === c.category)?.label}</span>
                    {c._offline && <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded">hors-ligne</span>}
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{c.crop_cycles?.crop_references?.name} · {c.crop_cycles?.parcels?.name}</span>
                    <span>{new Date(c.date).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-accent">{Number(c.amount).toLocaleString()} FCFA</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CostsPage;
