import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Map, Navigation, Eye, EyeOff, WifiOff } from "lucide-react";
import { GPSPolygonCapture, coordsToGeoJSON, computeAreaHa, computePerimeterM } from "@/components/GPSPolygonCapture";
import { Skeleton } from "@/components/ui/skeleton";
import { useOfflineData } from "@/hooks/useOfflineData";

const ParcelMapPreview = lazy(() => import("@/components/ParcelMapPreview"));

const soilTypes = [
  "Argileux", "Sableux", "Limoneux", "Argilo-sableux", "Argilo-limoneux",
  "Sablo-limoneux", "Latéritique", "Gravillonnaire", "Alluvial", "Vertisol",
];
const irrigationTypes = [
  "Pluviale", "Goutte-à-goutte", "Aspersion", "Gravitaire", "Pompage",
  "Bas-fond", "Submersion", "Aucune",
];
const parcelStatuses = [
  { value: "active", label: "Active" },
  { value: "jachère", label: "En jachère" },
  { value: "préparation", label: "En préparation" },
  { value: "inactive", label: "Inactive" },
];

const ParcelsPage = () => {
  const navigate = useNavigate();
  const { data: parcels, loading, isOffline, refetch, insertRow, updateRow, deleteRow } = useOfflineData({
    table: 'parcels',
    select: '*, farms(name)',
  });
  const { data: farms } = useOfflineData({ table: 'farms', select: 'id, name' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", farm_id: "", area_ha: "", soil_type: "", irrigation_type: "", status: "active",
  });
  const [gpsPoints, setGpsPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [showMap, setShowMap] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ name: "", farm_id: "", area_ha: "", soil_type: "", irrigation_type: "", status: "active" });
    setEditing(null);
    setGpsPoints([]);
    setMapCenter(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.farm_id) {
      toast.error("Veuillez sélectionner une exploitation");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Le nom de la parcelle est requis");
      return;
    }
    const geometry = coordsToGeoJSON(gpsPoints);
    let calculatedArea = 0;
    let perimeterM = 0;
    if (gpsPoints.length >= 3) {
      calculatedArea = computeAreaHa(gpsPoints);
      perimeterM = computePerimeterM(gpsPoints);
    }
    const inputArea = parseFloat(form.area_ha);
    const effectiveArea = Number.isFinite(inputArea) && inputArea > 0 ? inputArea : calculatedArea;

    const payload: any = {
      name: form.name,
      farm_id: form.farm_id,
      area_ha: effectiveArea,
      calculated_area_ha: calculatedArea > 0 ? calculatedArea : null,
      perimeter_m: perimeterM > 0 ? perimeterM : null,
      soil_type: form.soil_type || null,
      irrigation_type: form.irrigation_type || null,
      status: form.status,
    };

    if (gpsPoints.length > 0) {
      payload.latitude = gpsPoints.reduce((s, c) => s + c.lat, 0) / gpsPoints.length;
      payload.longitude = gpsPoints.reduce((s, c) => s + c.lng, 0) / gpsPoints.length;
    }
    if (geometry) {
      payload.geometry = geometry;
    }

    if (editing) {
      const ok = await updateRow(editing.id, payload);
      if (ok) {
        toast.success("Parcelle mise à jour !");
        // Trigger backend area calculation if online
        if (geometry && navigator.onLine) {
          try {
            await supabase.functions.invoke("calculate-crop-cycle", {
              body: { parcel_id: editing.id, geometry },
            });
          } catch (_) { /* silent */ }
        }
      }
    } else {
      const result = await insertRow(payload);
      if (result) {
        toast.success("Parcelle créée !");
        if (geometry && navigator.onLine && result.id) {
          try {
            await supabase.functions.invoke("calculate-crop-cycle", {
              body: { parcel_id: result.id, geometry },
            });
          } catch (_) { /* silent */ }
        }
      }
    }

    resetForm();
    setOpen(false);
  };

  const handleEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name,
      farm_id: p.farm_id,
      area_ha: p.area_ha?.toString() || "",
      soil_type: p.soil_type || "",
      irrigation_type: p.irrigation_type || "",
      status: p.status || "active",
    });
    if (p.geometry?.coordinates?.[0]) {
      const coords = p.geometry.coordinates[0].slice(0, -1);
      setGpsPoints(coords.map((c: number[]) => ({ lat: c[1], lng: c[0] })));
    } else {
      setGpsPoints([]);
    }
    if (p.latitude) setMapCenter({ lat: p.latitude, lng: p.longitude });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette parcelle ?")) return;
    const ok = await deleteRow(id);
    if (ok) toast.success("Parcelle supprimée");
  };

  const getParcelCoords = (p: any): { lat: number; lng: number }[] => {
    if (p.geometry?.coordinates?.[0]) {
      return p.geometry.coordinates[0].slice(0, -1).map((c: number[]) => ({ lat: c[1], lng: c[0] }));
    }
    return [];
  };

  const statusBadge = (status: string) => {
    const s = parcelStatuses.find(ps => ps.value === status);
    const variant = status === "active" ? "default" : status === "jachère" ? "secondary" : "outline";
    return <Badge variant={variant}>{s?.label || status}</Badge>;
  };

  const totalArea = parcels.reduce((s: number, p: any) => s + Number(p.calculated_area_ha || p.area_ha || 0), 0);
  const gpsCount = parcels.filter((p: any) => p.geometry).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Parcelles</h1>
          <p className="text-muted-foreground mt-1">
            {parcels.length} parcelle{parcels.length !== 1 ? "s" : ""} · {Math.round(totalArea * 100) / 100} ha · {gpsCount} cartographiée{gpsCount !== 1 ? "s" : ""}
            {isOffline && <Badge variant="outline" className="ml-2 text-xs"><WifiOff className="h-3 w-3 mr-1" />Hors-ligne</Badge>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/gps-survey")}
            className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Navigation className="h-4 w-4" />
            Levé GPS de Terrain
          </Button>

          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground" disabled={farms.length === 0}>
                <Plus className="h-4 w-4 mr-2" />Nouvelle parcelle
              </Button>
            </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouvelle"} parcelle</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Exploitation *</Label>
                <Select value={form.farm_id} onValueChange={(v) => setForm({ ...form, farm_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir l'exploitation" /></SelectTrigger>
                  <SelectContent>{farms.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nom de la parcelle *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Parcelle A" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type de sol</Label>
                  <Select value={form.soil_type} onValueChange={(v) => setForm({ ...form, soil_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>{soilTypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Irrigation</Label>
                  <Select value={form.irrigation_type} onValueChange={(v) => setForm({ ...form, irrigation_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>{irrigationTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Superficie manuelle (ha)</Label>
                  <Input type="number" step="any" value={form.area_ha} onChange={(e) => setForm({ ...form, area_ha: e.target.value })} placeholder="2.5" />
                  <p className="text-xs text-muted-foreground">Remplacée par le calcul GPS</p>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{parcelStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Navigation className="h-4 w-4 text-primary" />
                  Cartographie GPS du contour
                </div>
                <GPSPolygonCapture
                  value={gpsPoints}
                  onChange={setGpsPoints}
                  onCenterDetected={(lat, lng) => setMapCenter({ lat, lng })}
                />
                {gpsPoints.length >= 2 && (
                  <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-lg" />}>
                    <ParcelMapPreview coordinates={gpsPoints} height="200px" center={mapCenter} />
                  </Suspense>
                )}
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">
                {editing ? "Mettre à jour" : "Créer la parcelle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}</div>
      ) : parcels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Map className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">{farms.length === 0 ? "Créez d'abord une exploitation" : "Aucune parcelle. Ajoutez-en une !"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parcels.map((p: any) => {
            const coords = getParcelCoords(p);
            return (
              <Card key={p.id} className={`shadow-sm hover:shadow-warm transition-shadow overflow-hidden ${p._offline ? 'border-dashed border-amber-400' : ''}`}>
                {coords.length >= 3 && showMap === p.id && (
                  <Suspense fallback={<Skeleton className="h-[180px] w-full" />}>
                    <ParcelMapPreview coordinates={coords} height="180px" />
                  </Suspense>
                )}
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">
                      {p.name}
                      {p._offline && <Badge variant="outline" className="ml-2 text-xs">En attente</Badge>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{p.farms?.name}</p>
                  </div>
                  <div className="flex gap-1">
                    {coords.length >= 3 && (
                      <Button variant="ghost" size="icon" onClick={() => setShowMap(showMap === p.id ? null : p.id)} title="Carte">
                        {showMap === p.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(p.status)}
                    {p.geometry && (
                      <Badge variant="outline" className="text-primary border-primary/30">
                        <Navigation className="h-3 w-3 mr-1" />GPS
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <p><span className="text-muted-foreground">Superficie:</span> <strong>{p.calculated_area_ha || p.area_ha}</strong> ha</p>
                    {p.perimeter_m && <p><span className="text-muted-foreground">Périmètre:</span> {Math.round(p.perimeter_m)} m</p>}
                    {p.soil_type && <p><span className="text-muted-foreground">Sol:</span> {p.soil_type}</p>}
                    {p.irrigation_type && <p><span className="text-muted-foreground">Irrigation:</span> {p.irrigation_type}</p>}
                  </div>
                  {p.geometry && (
                    <p className="text-xs text-muted-foreground">{coords.length} points GPS enregistrés</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParcelsPage;
