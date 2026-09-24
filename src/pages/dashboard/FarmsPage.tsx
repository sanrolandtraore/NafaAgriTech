import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, MapPin, Trash2, Edit, Navigation, WifiOff } from "lucide-react";
import { useOfflineData } from "@/hooks/useOfflineData";

const regions = [
  "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya",
  "Kaya", "Tenkodogo", "Fada N'Gourma", "Dédougou", "Ziniaré",
  "Manga", "Dori", "Gaoua", "Djibo", "Léo", "Kongoussi",
  "Réo", "Yako", "Nouna", "Tougan", "Diébougou", "Pô",
  "Boromo", "Houndé", "Orodara", "Solenzo",
];

const FarmsPage = () => {
  const { user } = useAuth();
  const { data: farms, loading, isOffline, refetch, insertRow, updateRow, deleteRow } = useOfflineData({
    table: 'farms',
    select: '*, climate_zones(name)',
  });
  const { data: climateZones } = useOfflineData({ table: 'climate_zones' });

  const [open, setOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<any>(null);
  const [form, setForm] = useState({ name: "", location_name: "", total_area_ha: "", climate_zone_id: "" });
  const [autoLocating, setAutoLocating] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const resetForm = () => {
    setForm({ name: "", location_name: "", total_area_ha: "", climate_zone_id: "" });
    setEditingFarm(null);
    setDetectedCoords(null);
  };

  const autoLocate = () => {
    if (!navigator.geolocation) { toast.error("GPS non disponible"); return; }
    setAutoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectedCoords({ lat: Math.round(pos.coords.latitude * 1000000) / 1000000, lng: Math.round(pos.coords.longitude * 1000000) / 1000000 });
        toast.success("Position détectée");
        setAutoLocating(false);
      },
      () => { toast.error("Erreur GPS"); setAutoLocating(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload = {
      name: form.name,
      location_name: form.location_name || null,
      latitude: detectedCoords?.lat || null,
      longitude: detectedCoords?.lng || null,
      total_area_ha: form.total_area_ha ? parseFloat(form.total_area_ha) : null,
      climate_zone_id: form.climate_zone_id || null,
      user_id: user.id,
    };

    if (editingFarm) {
      // Don't send user_id on update
      const { user_id: _, ...updatePayload } = payload;
      const ok = await updateRow(editingFarm.id, updatePayload);
      if (ok) toast.success("Exploitation mise à jour !");
    } else {
      const result = await insertRow(payload);
      if (result) toast.success("Exploitation créée !");
    }
    resetForm(); setOpen(false);
  };

  const handleEdit = (farm: any) => {
    setEditingFarm(farm);
    setForm({
      name: farm.name,
      location_name: farm.location_name || "",
      total_area_ha: farm.total_area_ha?.toString() || "",
      climate_zone_id: farm.climate_zone_id || "",
    });
    if (farm.latitude) setDetectedCoords({ lat: farm.latitude, lng: farm.longitude });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette exploitation et toutes ses parcelles ?")) return;
    const ok = await deleteRow(id);
    if (ok) toast.success("Exploitation supprimée");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Exploitations</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos exploitations agricoles
            {isOffline && <Badge variant="outline" className="ml-2 text-xs"><WifiOff className="h-3 w-3 mr-1" />Hors-ligne</Badge>}
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Nouvelle exploitation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingFarm ? "Modifier" : "Nouvelle"} exploitation</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ma ferme" />
              </div>
              <div className="space-y-2">
                <Label>Localité</Label>
                <Select value={form.location_name} onValueChange={(v) => setForm({ ...form, location_name: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir la région" /></SelectTrigger>
                  <SelectContent>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Position GPS</span>
                  <Button type="button" variant="outline" size="sm" onClick={autoLocate} disabled={autoLocating}>
                    <Navigation className={`h-4 w-4 mr-1 ${autoLocating ? "animate-pulse" : ""}`} />
                    {autoLocating ? "Détection..." : "Localiser"}
                  </Button>
                </div>
                {detectedCoords && (
                  <p className="text-sm font-mono text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{detectedCoords.lat}, {detectedCoords.lng}</span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Superficie totale (ha)</Label>
                <Input type="number" step="any" value={form.total_area_ha} onChange={(e) => setForm({ ...form, total_area_ha: e.target.value })} placeholder="5" />
              </div>
              <div className="space-y-2">
                <Label>Zone climatique</Label>
                <Select value={form.climate_zone_id} onValueChange={(v) => setForm({ ...form, climate_zone_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>{climateZones.map((z: any) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">
                {editingFarm ? "Mettre à jour" : "Créer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>)}
        </div>
      ) : farms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">Aucune exploitation. Créez votre première exploitation pour commencer.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm: any) => (
            <Card key={farm.id} className={`shadow-sm hover:shadow-warm transition-shadow ${farm._offline ? 'border-dashed border-amber-400' : ''}`}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">
                    {farm.name}
                    {farm._offline && <Badge variant="outline" className="ml-2 text-xs">En attente</Badge>}
                  </CardTitle>
                  {farm.location_name && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{farm.location_name}</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(farm)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(farm.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {farm.total_area_ha && <p className="text-sm"><span className="text-muted-foreground">Superficie:</span> {farm.total_area_ha} ha</p>}
                {farm.climate_zones && <p className="text-sm"><span className="text-muted-foreground">Zone:</span> {farm.climate_zones.name}</p>}
                {farm.latitude && (
                  <p className="text-xs text-muted-foreground font-mono">GPS: {farm.latitude}, {farm.longitude}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmsPage;
