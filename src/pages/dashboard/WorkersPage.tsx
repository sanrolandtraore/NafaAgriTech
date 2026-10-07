import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useOfflineData } from "@/hooks/useOfflineData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Users, Edit2, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;

const statusColors: Record<string, string> = { active: "bg-success/10 text-success", inactive: "bg-muted text-muted-foreground" };

const WorkersPage = () => {
  const { data: workers, loading, isOffline, insertRow, updateRow, deleteRow } = useOfflineData({
    table: "workers",
    select: "*, farms(name)",
  });
  const [farms, setFarms] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ farm_id: "", full_name: "", role: "ouvrier", phone: "", daily_rate: "", status: "active", notes: "" });

  useEffect(() => {
    db.from("farms").select("id, name").then(({ data }) => setFarms(data || []));
  }, []);

  const resetForm = () => {
    setForm({ farm_id: "", full_name: "", role: "ouvrier", phone: "", daily_rate: "", status: "active", notes: "" });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.farm_id) { toast.error("Veuillez sélectionner une exploitation"); return; }
    if (!form.full_name.trim()) { toast.error("Le nom est requis"); return; }
    const payload = { ...form, daily_rate: parseFloat(form.daily_rate) || 0 };
    if (editing) {
      const ok = await updateRow(editing.id, payload);
      if (ok) toast.success("Ouvrier modifié !");
    } else {
      const result = await insertRow(payload);
      if (result) toast.success("Ouvrier ajouté !");
    }
    resetForm(); setOpen(false);
  };

  const handleEdit = (w: any) => {
    setForm({ farm_id: w.farm_id, full_name: w.full_name, role: w.role, phone: w.phone || "", daily_rate: String(w.daily_rate || 0), status: w.status, notes: w.notes || "" });
    setEditing(w); setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet ouvrier ?")) return;
    const ok = await deleteRow(id);
    if (ok) toast.success("Ouvrier supprimé");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            Main d'œuvre
            {isOffline && <WifiOff className="h-4 w-4 text-warning" />}
          </h1>
          <p className="text-muted-foreground mt-1">Gérez vos ouvriers et leurs affectations</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground" disabled={farms.length === 0}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Modifier ouvrier" : "Nouvel ouvrier"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Exploitation *</Label>
                <Select value={form.farm_id} onValueChange={(v) => setForm({ ...form, farm_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nom complet *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ouvrier">Ouvrier</SelectItem>
                      <SelectItem value="chef_equipe">Chef d'équipe</SelectItem>
                      <SelectItem value="technicien">Technicien</SelectItem>
                      <SelectItem value="saisonnier">Saisonnier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Tarif journalier (FCFA)</Label><Input type="number" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">{editing ? "Modifier" : "Ajouter"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>)}</div>
      ) : workers.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12"><Users className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">Aucun ouvrier enregistré</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workers.map((w: any) => (
            <Card key={w.id} className={`shadow-sm hover:shadow-warm transition-shadow ${w._offline ? "border-warning/50" : ""}`}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{w.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{w.farms?.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className={statusColors[w.status] || ""}>{w.status === "active" ? "Actif" : "Inactif"}</Badge>
                  {w._offline && <Badge variant="outline" className="bg-warning/10 text-warning text-xs">hors-ligne</Badge>}
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(w)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(w.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Rôle:</span> {w.role}</div>
                  {w.phone && <div><span className="text-muted-foreground">Tél:</span> {w.phone}</div>}
                  <div><span className="text-muted-foreground">Tarif/jour:</span> {(w.daily_rate || 0).toLocaleString()} FCFA</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkersPage;
