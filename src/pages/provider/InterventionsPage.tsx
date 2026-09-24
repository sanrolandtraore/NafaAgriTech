import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Plus, Trash2, MapPin, Calendar, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { partnerStorage, MissionIntervention, PartnerMission } from "@/lib/partnerStorage";
import { getEffectiveUserId } from "@/lib/deviceIdentity";

const TYPES = ["visite de suivi", "diagnostic", "traitement", "conseil technique", "formation", "autre"];

export default function InterventionsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MissionIntervention[]>([]);
  const [missions, setMissions] = useState<PartnerMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [missionId, setMissionId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState(TYPES[0]);
  const [observations, setObservations] = useState("");
  const [actions, setActions] = useState("");
  const [reco, setReco] = useState("");
  const [products, setProducts] = useState("");
  const [duration, setDuration] = useState("");
  const [cost, setCost] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [i, m] = await Promise.all([
        partnerStorage.getInterventions(user?.id),
        partnerStorage.getMissions(user?.id),
      ]);
      setItems(i);
      setMissions(m);
      if (m.length > 0 && !missionId) {
        setMissionId(m[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("nafa-partner-data-updated", handleUpdate);
    return () => window.removeEventListener("nafa-partner-data-updated", handleUpdate);
  }, [user]);

  const reset = () => {
    setMissionId(missions[0]?.id ?? "");
    setDate(new Date().toISOString().slice(0, 10));
    setType(TYPES[0]);
    setObservations("");
    setActions("");
    setReco("");
    setProducts("");
    setDuration("");
    setCost("");
  };

  const save = async () => {
    if (!missionId) {
      toast.error("Veuillez sélectionner ou créer une mission au préalable.");
      return;
    }
    setSaving(true);
    try {
      await partnerStorage.saveIntervention({
        provider_id: getEffectiveUserId(user?.id),
        mission_id: missionId,
        intervention_date: date,
        intervention_type: type,
        observations: observations.trim() || null,
        actions_done: actions.trim() || null,
        recommendations: reco.trim() || null,
        products_used: products.trim() || null,
        duration_hours: duration ? Number(duration) : null,
        cost: cost ? Number(cost) : null,
      });

      toast.success("Compte-rendu d'intervention enregistré !");
      setOpen(false);
      reset();
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (confirm("Supprimer ce compte-rendu d'intervention ?")) {
      await partnerStorage.deleteIntervention(id);
      toast.success("Intervention supprimée");
      loadData();
    }
  };

  const missionTitle = (id: string) => {
    const m = missions.find((x) => x.id === id);
    return m ? `${m.title} (${m.client_name})` : "Mission générale";
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">Interventions Terrain</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Journal des passages, travaux réalisés, produits appliqués et recommandations.
            </p>
          </div>
        </div>
        <Button
          onClick={() => { reset(); setOpen(true); }}
          className="gradient-primary text-primary-foreground font-semibold shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Nouvelle intervention
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="h-36 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm space-y-2">
            <p>Aucune intervention terrain enregistrée.</p>
            <Button size="sm" variant="outline" onClick={() => { reset(); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Rédiger un compte-rendu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((it) => (
            <Card key={it.id} className="hover:border-primary/50 transition-all flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[11px] capitalize">
                    {it.intervention_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(it.intervention_date).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <CardTitle className="text-base font-bold leading-snug pt-1">
                  {missionTitle(it.mission_id)}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2.5 text-xs">
                {it.observations && (
                  <div>
                    <span className="font-semibold text-foreground">Observations : </span>
                    <span className="text-muted-foreground">{it.observations}</span>
                  </div>
                )}
                {it.actions_done && (
                  <div>
                    <span className="font-semibold text-foreground">Actions réalisées : </span>
                    <span className="text-muted-foreground">{it.actions_done}</span>
                  </div>
                )}
                {it.products_used && (
                  <div>
                    <span className="font-semibold text-foreground">Produits / Matériel : </span>
                    <span className="text-muted-foreground">{it.products_used}</span>
                  </div>
                )}
                {it.recommendations && (
                  <div className="bg-primary/5 p-2 rounded-md border border-primary/20 text-foreground">
                    <span className="font-semibold">Conseils au producteur : </span>
                    <span>{it.recommendations}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {it.duration_hours != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {it.duration_hours}h
                      </span>
                    )}
                    {it.cost != null && <span className="font-medium text-foreground">{it.cost.toLocaleString("fr-FR")} FCFA</span>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => remove(it.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-heading font-bold">
              Compte-rendu d'intervention terrain
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>Mission rattachée *</Label>
              <Select value={missionId} onValueChange={setMissionId}>
                <SelectTrigger><SelectValue placeholder="Choisir la mission" /></SelectTrigger>
                <SelectContent>
                  {missions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title} — {m.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type d'intervention</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Date de passage</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Constats / Observations sur la parcelle ou le troupeau</Label>
              <Textarea
                rows={2}
                placeholder="État végétatif, présence d'adventices, ravageurs observés..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Travaux & Actions effectués</Label>
              <Textarea
                rows={2}
                placeholder="Labour à 25cm, pulvérisation 200L/ha, réglage semoir..."
                value={actions}
                onChange={(e) => setActions(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Produits et intrants appliqués</Label>
              <Input
                placeholder="ex. NPK 14-23-14 (3 sacs), bio-insecticide (2L)..."
                value={products}
                onChange={(e) => setProducts(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Recommandations données au producteur</Label>
              <Textarea
                rows={2}
                placeholder="Prochaine irrigation dans 3 jours, buttage, surveillance..."
                value={reco}
                onChange={(e) => setReco(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Durée (heures)</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="ex: 3.5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Coût facturé (FCFA)</Label>
                <Input
                  type="number"
                  placeholder="ex: 25000"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground font-semibold">
              {saving ? "Enregistrement…" : "Enregistrer l'intervention"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
