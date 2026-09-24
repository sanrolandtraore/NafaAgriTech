import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Baby, WifiOff, CheckCircle2, HeartHandshake, Calendar, Filter } from "lucide-react";
import { useOfflineData } from "@/hooks/useOfflineData";
import BackNavigationButton from "@/components/BackNavigationButton";

export const reproTypes = [
  { value: "saillie", label: "Saillie naturelle" },
  { value: "insemination", label: "Insémination artificielle" },
  { value: "gestation", label: "Gestation confirmée" },
  { value: "mise_bas", label: "Mise bas / Naissance" },
  { value: "avortement", label: "Avortement" },
  { value: "sevrage", label: "Sevrage des jeunes" },
];

export const offspringOptions = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "10", "12", "15", "20"];

const AnimalReproductionPage = () => {
  const { data: events, loading: loadingEvents, isOffline, insertRow, updateRow, deleteRow } = useOfflineData({
    table: "animal_reproductions",
    select: "*",
    orderBy: "event_date",
  });

  const { data: animals, loading: loadingAnimals } = useOfflineData({
    table: "animals",
    select: "id, name, group_label, identification_number, species, sex, status",
    orderBy: "name",
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [resolvingGestation, setResolvingGestation] = useState<any | null>(null);

  const [filterType, setFilterType] = useState<string>("all");

  const [form, setForm] = useState({
    animal_id: "",
    event_type: "saillie",
    event_date: new Date().toISOString().split("T")[0],
    partner_id: "",
    expected_birth_date: "",
    actual_birth_date: "",
    offspring_count: "1",
    offspring_alive: "1",
    cost: "",
    notes: "",
  });

  // Modal de mise-bas rapide
  const [birthForm, setBirthForm] = useState({
    actual_birth_date: new Date().toISOString().split("T")[0],
    offspring_count: "1",
    offspring_alive: "1",
    notes: "",
  });

  const animalsMap = useMemo(() => {
    const map = new Map<string, any>();
    (animals || []).forEach((a: any) => map.set(a.id, a));
    return map;
  }, [animals]);

  const activeAnimals = useMemo(() => {
    return (animals || []).filter((a: any) => (a.status || "actif") === "actif");
  }, [animals]);

  const females = useMemo(() => {
    const directFemales = activeAnimals.filter((a: any) => a.sex === "femelle");
    // Fallback: if user didn't set sex, allow all active animals
    return directFemales.length > 0 ? directFemales : activeAnimals;
  }, [activeAnimals]);

  const males = useMemo(() => {
    return activeAnimals.filter((a: any) => a.sex === "male");
  }, [activeAnimals]);

  const getAnimalDisplayName = (animalId: string) => {
    const a = animalsMap.get(animalId);
    if (!a) return "Animal";
    return `${a.name || a.identification_number || a.group_label || "Animal"} (${a.species})`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animal_id) {
      toast.error("Veuillez sélectionner la femelle reproductrice");
      return;
    }

    const payload = {
      animal_id: form.animal_id,
      event_type: form.event_type,
      event_date: form.event_date,
      partner_id: form.partner_id || null,
      expected_birth_date: form.expected_birth_date || null,
      actual_birth_date: form.actual_birth_date || null,
      offspring_count: form.offspring_count ? Number(form.offspring_count) : 0,
      offspring_alive: form.offspring_alive ? Number(form.offspring_alive) : 0,
      cost: form.cost ? Number(form.cost) : 0,
      notes: form.notes || null,
    };

    const result = await insertRow(payload);
    if (result) {
      toast.success("Événement de reproduction enregistré ✓");
      setOpenCreate(false);
      setForm({
        animal_id: "",
        event_type: "saillie",
        event_date: new Date().toISOString().split("T")[0],
        partner_id: "",
        expected_birth_date: "",
        actual_birth_date: "",
        offspring_count: "1",
        offspring_alive: "1",
        cost: "",
        notes: "",
      });
    }
  };

  const handleOpenBirthModal = (gestationEvent: any) => {
    setResolvingGestation(gestationEvent);
    setBirthForm({
      actual_birth_date: new Date().toISOString().split("T")[0],
      offspring_count: gestationEvent.offspring_count ? String(gestationEvent.offspring_count) : "1",
      offspring_alive: gestationEvent.offspring_alive ? String(gestationEvent.offspring_alive) : "1",
      notes: gestationEvent.notes || "",
    });
  };

  const handleConfirmBirth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingGestation) return;

    const updates = {
      event_type: "mise_bas",
      actual_birth_date: birthForm.actual_birth_date,
      offspring_count: Number(birthForm.offspring_count || 1),
      offspring_alive: Number(birthForm.offspring_alive || 1),
      notes: birthForm.notes ? `${birthForm.notes} (Mise bas confirmée)` : "Mise bas confirmée",
    };

    const ok = await updateRow(resolvingGestation.id, updates);
    if (ok) {
      toast.success("Mise bas enregistrée avec succès");
      setResolvingGestation(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet enregistrement de reproduction ?")) return;
    const ok = await deleteRow(id);
    if (ok) toast.success("Supprimé");
  };

  // Gestations en cours (prévues et non encore mises bas)
  const gestationsEnCours = useMemo(() => {
    return (events || []).filter(
      (e: any) => e.expected_birth_date && !e.actual_birth_date && ["saillie", "insemination", "gestation"].includes(e.event_type)
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    let list = events as any[];
    if (filterType !== "all") {
      list = list.filter((e) => e.event_type === filterType);
    }
    return list;
  }, [events, filterType]);

  const showOffspring = ["mise_bas", "avortement"].includes(form.event_type);
  const loading = loadingEvents || loadingAnimals;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold flex items-center gap-2">
              <Baby className="h-7 w-7 text-sky-500" />
              Reproduction & Amélioration Génétique
            </h1>
            <p className="text-muted-foreground text-sm">
              Suivi des saillies, inséminations artificielles, gestations et mises-bas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isOffline && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
              <WifiOff className="h-3 w-3 mr-1" />
              Mode hors-ligne
            </Badge>
          )}
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="h-10 font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs">
                <Plus className="h-4 w-4 mr-1.5" />
                Déclarer saillie / gestation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Baby className="h-5 w-5 text-sky-600" />
                  Nouvel événement de reproduction
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Reproductrice (Mère) *</Label>
                  <Select value={form.animal_id} onValueChange={(v) => setForm({ ...form, animal_id: v })}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choisir la femelle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {females.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name || a.identification_number || a.group_label || "Animal"} ({a.species})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Type d'acte *</Label>
                    <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {reproTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Date de l'acte *</Label>
                    <Input
                      type="date"
                      value={form.event_date}
                      onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Reproducteur (Père ou référence semence)</Label>
                  <Select value={form.partner_id} onValueChange={(v) => setForm({ ...form, partner_id: v })}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choisir un mâle du cheptel ou laisser vide..." />
                    </SelectTrigger>
                    <SelectContent>
                      {males.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name || a.identification_number || "Mâle"} ({a.species})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Date prévue de mise bas</Label>
                    <Input
                      type="date"
                      value={form.expected_birth_date}
                      onChange={(e) => setForm({ ...form, expected_birth_date: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Date réelle de mise bas</Label>
                    <Input
                      type="date"
                      value={form.actual_birth_date}
                      onChange={(e) => setForm({ ...form, actual_birth_date: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {showOffspring && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-sky-50 dark:bg-sky-950/20 rounded-xl border border-sky-200">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Petits nés</Label>
                      <Select value={form.offspring_count} onValueChange={(v) => setForm({ ...form, offspring_count: v })}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {offspringOptions.map((n) => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Petits vivants</Label>
                      <Select value={form.offspring_alive} onValueChange={(v) => setForm({ ...form, offspring_alive: v })}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {offspringOptions.map((n) => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Coût de l'acte / paille (FCFA)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Notes & Lignée</Label>
                    <Input
                      placeholder="Gestation confirmée par palpation..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-10 font-bold bg-sky-600 hover:bg-sky-700 text-white mt-2">
                  Enregistrer l'événement
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alertes Gestations en cours avec action 1-clic */}
      {gestationsEnCours.length > 0 && (
        <Card className="rounded-2xl border-sky-500/40 bg-sky-50/50 dark:bg-sky-950/20 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Baby className="h-5 w-5 text-sky-600" />
              <span className="font-bold text-sm text-foreground">
                Gestations en cours de suivi ({gestationsEnCours.length})
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {gestationsEnCours.map((e: any) => {
                const isOverdue = new Date(e.expected_birth_date) < new Date();
                return (
                  <div key={e.id} className="p-3 rounded-xl bg-background border flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{getAnimalDisplayName(e.animal_id)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-sky-600" />
                        Terme prévu :{" "}
                        <strong className={isOverdue ? "text-amber-600" : "text-sky-700"}>
                          {new Date(e.expected_birth_date).toLocaleDateString("fr-FR")}
                        </strong>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleOpenBirthModal(e)}
                      className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Mise bas
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barre de filtres */}
      <div className="flex gap-2 flex-wrap items-center bg-muted/40 p-2.5 rounded-2xl border border-border/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground px-2">
          <Filter className="h-3.5 w-3.5" />
          Filtrer les actes :
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-52 h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types de reproduction</SelectItem>
            {reproTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Liste des événements */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground space-y-2">
            <p className="font-semibold text-base">Aucun événement de reproduction enregistré</p>
            <p className="text-xs text-muted-foreground">
              Déclarez une saillie, une insémination ou une mise-bas avec le bouton ci-dessus.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((e: any) => {
            const motherName = getAnimalDisplayName(e.animal_id);
            const partnerName = e.partner_id ? getAnimalDisplayName(e.partner_id) : null;
            const typeConfig = reproTypes.find((t) => t.value === e.event_type);

            return (
              <Card key={e.id} className={`rounded-2xl border transition-all hover:shadow-xs ${e._offline ? "border-dashed border-amber-400" : ""}`}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Baby className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-foreground truncate">{motherName}</span>
                        <Badge variant="outline" className="text-xs font-semibold">
                          {typeConfig?.label || e.event_type}
                        </Badge>
                        {e._offline && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">En attente</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>Date : {new Date(e.event_date).toLocaleDateString("fr-FR")}</span>
                        {partnerName && <span>• Père : <strong className="text-foreground">{partnerName}</strong></span>}
                        {e.expected_birth_date && <span>• Prévu le : {new Date(e.expected_birth_date).toLocaleDateString("fr-FR")}</span>}
                        {e.actual_birth_date && <span>• Mise bas réelle : {new Date(e.actual_birth_date).toLocaleDateString("fr-FR")}</span>}
                        {e.offspring_count > 0 && (
                          <span className="font-bold text-emerald-600">
                            • {e.offspring_alive}/{e.offspring_count} petits vivants
                          </span>
                        )}
                        {e.cost > 0 && <span className="font-bold text-foreground">• {Number(e.cost).toLocaleString()} FCFA</span>}
                      </div>
                      {e.notes && <p className="text-[11px] text-muted-foreground italic truncate">« {e.notes} »</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {e.expected_birth_date && !e.actual_birth_date && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenBirthModal(e)}
                        className="h-8 text-xs font-bold text-sky-600 border-sky-300"
                      >
                        Mise bas
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(e.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Mise Bas Rapide */}
      <Dialog open={Boolean(resolvingGestation)} onOpenChange={(open) => !open && setResolvingGestation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-emerald-600" />
              Enregistrer la mise bas / naissance
            </DialogTitle>
          </DialogHeader>
          {resolvingGestation && (
            <form onSubmit={handleConfirmBirth} className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">
                Mère : <strong className="text-foreground">{getAnimalDisplayName(resolvingGestation.animal_id)}</strong>
              </p>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Date réelle de mise bas *</Label>
                <Input
                  type="date"
                  value={birthForm.actual_birth_date}
                  onChange={(e) => setBirthForm({ ...birthForm, actual_birth_date: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Total nés</Label>
                  <Select
                    value={birthForm.offspring_count}
                    onValueChange={(v) => setBirthForm({ ...birthForm, offspring_count: v })}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {offspringOptions.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Petits vivants</Label>
                  <Select
                    value={birthForm.offspring_alive}
                    onValueChange={(v) => setBirthForm({ ...birthForm, offspring_alive: v })}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {offspringOptions.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Observations de mise bas</Label>
                <Input
                  placeholder="État de la mère, vigueur des petits..."
                  value={birthForm.notes}
                  onChange={(e) => setBirthForm({ ...birthForm, notes: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setResolvingGestation(null)}>
                  Annuler
                </Button>
                <Button type="submit" className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                  Valider la mise bas
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnimalReproductionPage;
