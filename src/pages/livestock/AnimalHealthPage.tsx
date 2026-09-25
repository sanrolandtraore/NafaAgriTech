import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Heart, AlertTriangle, WifiOff, Syringe, Pill, Stethoscope, Filter, Users } from "lucide-react";
import { useOfflineData } from "@/hooks/useOfflineData";
import BackNavigationButton from "@/components/BackNavigationButton";

export const eventTypes = [
  { value: "vaccination", label: "Vaccination" },
  { value: "traitement", label: "Traitement curatif" },
  { value: "deworming", label: "Vermifuge / Déparasitage" },
  { value: "vitamine", label: "Vitamines & Fortifiants" },
  { value: "consultation", label: "Consultation vétérinaire" },
  { value: "chirurgie", label: "Chirurgie / Écornage" },
  { value: "autre", label: "Autre acte" },
];

export const vaccinations = [
  "Peste des Petits Ruminants (PPR - Ovins & Caprins)",
  "Péripneumonie Contagieuse Bovine (PPCB - Bovins)",
  "Charbon symptomatique & bactéridien (Bovins)",
  "Pasteurellose bovine / ovine",
  "Maladie de Newcastle (I-2 / LaSota - Volailles)",
  "Maladie de Gumboro (IBD - Volailles)",
  "Variole aviaire / Diphtérie (Volailles)",
  "Fièvre aphteuse",
  "Dermatose nodulaire contagieuse (LSD)",
  "Rage animale",
  "Peste porcine",
  "Autre vaccin",
];

export const medications = [
  "Oxytétracycline 20% L.A. (Retard)",
  "Pénicilline-Streptomycine",
  "Ivermectine 1% injectable (Antiparasitaire)",
  "Albendazole 10% / 2500mg (Vermifuge)",
  "Diminazène acéturate (Bérénil - Trypanosome)",
  "Isométamidium (Samorin)",
  "Lévamisole injectable / oral",
  "Fenbendazole",
  "Tylosine tartrate",
  "Amoxicilline trihydrate",
  "Sulfadimidine sodique",
  "Complexe Vitamines AD3E",
  "Fer dextran 10% (Porcelets / veaux)",
  "Anti-inflammatoire (Flunixine / Diclofénac)",
  "Autre médicament",
];

export const dosageUnits = [
  "1 ml", "2 ml", "3 ml", "5 ml", "10 ml", "15 ml", "20 ml",
  "1 comprimé", "2 comprimés", "1 sachet (eau de boisson)", "Selon posologie vétérinaire",
];

const AnimalHealthPage = () => {
  const { data: events, loading: loadingEvents, isOffline, insertRow, deleteRow } = useOfflineData({
    table: "animal_health_events",
    select: "*",
    orderBy: "event_date",
  });

  const { data: animals, loading: loadingAnimals } = useOfflineData({
    table: "animals",
    select: "id, name, group_label, identification_number, species, is_group, status",
    orderBy: "created_at",
  });

  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAnimalId, setFilterAnimalId] = useState<string>("all");

  const [form, setForm] = useState({
    animal_id: "",
    event_type: "vaccination",
    event_date: new Date().toISOString().split("T")[0],
    description: "",
    medication: "",
    dosage: "",
    cost: "",
    vet_name: "",
    next_date: "",
    notes: "",
  });

  // Resilient animal map for local name resolution
  const animalsMap = useMemo(() => {
    const map = new Map<string, any>();
    (animals || []).forEach((a: any) => map.set(a.id, a));
    return map;
  }, [animals]);

  // Active animals & lots for select input
  const activeAnimals = useMemo(() => {
    return (animals || []).filter((a: any) => (a.status || "actif") === "actif");
  }, [animals]);

  const getAnimalDisplayName = (animalId: string, joinedAnimal?: any) => {
    if (joinedAnimal?.name) return joinedAnimal.name;
    const a = animalsMap.get(animalId);
    if (!a) return "Animal";
    if (a.is_group) {
      return `[Lot] ${a.group_label || a.name || "Lot"} (${a.species})`;
    }
    return `${a.name || a.identification_number || "Animal"} (${a.species})`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animal_id) {
      toast.error("Veuillez sélectionner l'animal ou le lot concerné");
      return;
    }

    const payload = {
      animal_id: form.animal_id,
      event_type: form.event_type,
      event_date: form.event_date,
      description: form.description || null,
      medication: form.medication || null,
      dosage: form.dosage || null,
      cost: form.cost ? Number(form.cost) : 0,
      vet_name: form.vet_name || null,
      next_date: form.next_date || null,
      notes: form.notes || null,
    };

    const result = await insertRow(payload);
    if (result) {
      toast.success("Événement de santé consigné avec succès.");
      setOpen(false);
      setForm({
        animal_id: "",
        event_type: "vaccination",
        event_date: new Date().toISOString().split("T")[0],
        description: "",
        medication: "",
        dosage: "",
        cost: "",
        vet_name: "",
        next_date: "",
        notes: "",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette fiche de santé ?")) return;
    const ok = await deleteRow(id);
    if (ok) toast.success("Fiche de santé supprimée");
  };

  const upcomingReminders = useMemo(() => {
    return (events || []).filter((e: any) => e.next_date && new Date(e.next_date) >= new Date());
  }, [events]);

  const filteredEvents = useMemo(() => {
    let list = events as any[];
    if (filterType !== "all") {
      list = list.filter((e) => e.event_type === filterType);
    }
    if (filterAnimalId !== "all") {
      list = list.filter((e) => e.animal_id === filterAnimalId);
    }
    return list;
  }, [events, filterType, filterAnimalId]);

  const isVaccination = form.event_type === "vaccination";
  const loading = loadingEvents || loadingAnimals;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold flex items-center gap-2">
              <Stethoscope className="h-7 w-7 text-rose-500" />
              Carnet de Santé & Prophylaxie
            </h1>
            <p className="text-muted-foreground text-sm">
              Vaccinations officielles, traitements vétérinaires, vermifuges et rappels sanitaires
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs">
                <Plus className="h-4 w-4 mr-1.5" />
                Consigner un acte de santé
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-rose-600" />
                  Nouvel acte de santé animale
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Animal ou Lot concerné *</Label>
                  <Select value={form.animal_id} onValueChange={(v) => setForm({ ...form, animal_id: v })}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choisir un sujet ou un lot..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAnimals.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.is_group ? `[Lot] ${a.group_label || a.name || "Lot"}` : a.name || a.identification_number || "Animal"}{" "}
                          ({a.species})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeAnimals.length === 0 && (
                    <p className="text-[11px] text-amber-600 font-medium">
                      Aucun animal enregistré. Ajoutez-en d'abord dans le registre.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Type d'acte *</Label>
                    <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((t) => (
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

                {isVaccination ? (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Vaccin administré</Label>
                    <Select value={form.description} onValueChange={(v) => setForm({ ...form, description: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choisir un vaccin sahélien..." /></SelectTrigger>
                      <SelectContent>
                        {vaccinations.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Motif / Symptômes / Diagnostic</Label>
                    <Input
                      placeholder="Ex: Toux, diarrhée verdâtre, fièvre, plaie ouverte..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Molécule / Médicament</Label>
                    <Select value={form.medication} onValueChange={(v) => setForm({ ...form, medication: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                      <SelectContent>
                        {medications.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Dosage / Posologie</Label>
                    <Select value={form.dosage} onValueChange={(v) => setForm({ ...form, dosage: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Dose..." /></SelectTrigger>
                      <SelectContent>
                        {dosageUnits.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Coût du soin (FCFA)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Vétérinaire / Opérateur</Label>
                    <Input
                      placeholder="Ex: Dr. Ouédraogo, Technicien élevage..."
                      value={form.vet_name}
                      onChange={(e) => setForm({ ...form, vet_name: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Prochain rappel / Visite de contrôle</Label>
                  <Input
                    type="date"
                    value={form.next_date}
                    onChange={(e) => setForm({ ...form, next_date: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Observations & Consignes</Label>
                  <Input
                    placeholder="Temps d'attente lait/viande, précautions..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <Button type="submit" className="w-full h-10 font-bold bg-rose-600 hover:bg-rose-700 text-white mt-2">
                  Enregistrer l'acte de santé
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Rappels et alertes à venir */}
      {upcomingReminders.length > 0 && (
        <Card className="rounded-2xl border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <span className="font-bold text-sm text-foreground">
                Rappels sanitaires & vaccinations à venir ({upcomingReminders.length})
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {upcomingReminders.slice(0, 4).map((e: any) => (
                <div key={e.id} className="p-2.5 rounded-xl bg-background/80 border text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold text-foreground">{getAnimalDisplayName(e.animal_id, e.animals)}</p>
                    <p className="text-muted-foreground">{e.description || e.event_type}</p>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-semibold text-rose-600 border-rose-300">
                    {new Date(e.next_date).toLocaleDateString("fr-FR")}
                  </Badge>
                </div>
              ))}
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
          <SelectTrigger className="w-44 h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les actes</SelectItem>
            {eventTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterAnimalId} onValueChange={setFilterAnimalId}>
          <SelectTrigger className="w-56 h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les animaux & lots</SelectItem>
            {animals.map((a: any) => (
              <SelectItem key={a.id} value={a.id}>
                {a.is_group ? `[Lot] ${a.group_label || a.name || "Lot"}` : a.name || a.identification_number || "Animal"}{" "}
                ({a.species})
              </SelectItem>
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
            <p className="font-semibold text-base">Aucun événement de santé enregistré pour ces critères</p>
            <p className="text-xs text-muted-foreground">
              Utilisez le bouton ci-dessus pour consigner un vaccin, un traitement ou une consultation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((e: any) => {
            const animalName = getAnimalDisplayName(e.animal_id, e.animals);
            const typeConfig = eventTypes.find((t) => t.value === e.event_type);

            return (
              <Card key={e.id} className={`rounded-2xl border transition-all hover:shadow-xs ${e._offline ? "border-dashed border-amber-400" : ""}`}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-foreground truncate">{animalName}</span>
                        <Badge variant="outline" className="text-xs font-semibold">
                          {typeConfig?.label || e.event_type}
                        </Badge>
                        {e._offline && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">En attente</Badge>}
                      </div>
                      <p className="text-sm text-foreground/90 font-medium">
                        {e.description || e.medication || "Acte vétérinaire"}
                        {e.dosage && <span className="text-muted-foreground font-normal"> ({e.dosage})</span>}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>Date : {new Date(e.event_date).toLocaleDateString("fr-FR")}</span>
                        {e.vet_name && <span>• Opérateur : {e.vet_name}</span>}
                        {e.cost > 0 && <span className="font-bold text-foreground">• {Number(e.cost).toLocaleString()} FCFA</span>}
                        {e.next_date && (
                          <span className="text-rose-600 font-medium">• Rappel : {new Date(e.next_date).toLocaleDateString("fr-FR")}</span>
                        )}
                      </div>
                      {e.notes && <p className="text-[11px] text-muted-foreground italic truncate">« {e.notes} »</p>}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(e.id)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnimalHealthPage;
