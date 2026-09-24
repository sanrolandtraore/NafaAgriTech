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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Filter, WifiOff, Users, Edit3, Scale, ShieldAlert, Sparkles } from "lucide-react";
import { useOfflineData } from "@/hooks/useOfflineData";
import { useDefaultLivestockFarm } from "@/hooks/useDefaultLivestockFarm";
import BackNavigationButton from "@/components/BackNavigationButton";

export const speciesOptions = [
  { value: "bovin", label: "Bovin" },
  { value: "ovin", label: "Ovin" },
  { value: "caprin", label: "Caprin" },
  { value: "porcin", label: "Porcin" },
  { value: "volaille", label: "Volaille" },
  { value: "pisciculture", label: "Pisciculture" },
];

export const GROUP_SPECIES = new Set(["volaille", "pisciculture"]);

export const sexOptions = [
  { value: "male", label: "Mâle" },
  { value: "femelle", label: "Femelle" },
  { value: "inconnu", label: "Inconnu" },
];

export const statusOptions = [
  { value: "actif", label: "Actif", variant: "default" as const },
  { value: "vendu", label: "Vendu", variant: "secondary" as const },
  { value: "mort", label: "Mort", variant: "destructive" as const },
  { value: "réformé", label: "Réformé", variant: "outline" as const },
];

export const breedsBySpecies: Record<string, string[]> = {
  bovin: ["Zébu Peulh", "Zébu Azawak", "Zébu Goudali", "N'Dama", "Baoulé", "Borgou", "Métis", "Holstein", "Charolais", "Brahman", "Autre"],
  ovin: ["Bali-Bali", "Djallonké", "Mouton du Sahel", "Oudah", "Touareg", "Peulh", "Métis", "Autre"],
  caprin: ["Chèvre rousse de Maradi", "Chèvre du Sahel", "Chèvre naine (Djallonké)", "Alpine", "Saanen", "Boer", "Métis", "Autre"],
  porcin: ["Large White", "Landrace", "Porc local", "Korhogo", "Duroc", "Piétrain", "Métis", "Autre"],
  volaille: ["Poulet bicyclette local", "Pondeuse (Lohmann/Isa Brown)", "Poulet de chair (Cobb 500)", "Pintade locale", "Canard", "Dinde", "Caille", "Autre"],
  pisciculture: ["Tilapia du Nil (Oreochromis)", "Silure / Clarias gariepinus", "Carpe", "Capitaine", "Autre"],
};

const emptyForm = {
  species: "bovin",
  is_group: false,
  group_label: "",
  group_size: "",
  mortality_count: "0",
  name: "",
  identification_number: "",
  breed: "",
  sex: "inconnu",
  birth_date: "",
  acquisition_date: new Date().toISOString().split("T")[0],
  acquisition_cost: "",
  weight_kg: "",
  notes: "",
};

const AnimalsPage = () => {
  const { user } = useAuth();
  const { farmId } = useDefaultLivestockFarm();
  const { data: animals, loading, isOffline, insertRow, updateRow, deleteRow } = useOfflineData({
    table: "animals",
    select: "*",
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<any | null>(null);

  // Filters
  const [filterSpecies, setFilterSpecies] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<"all" | "individual" | "group">("all");
  const [filterStatus, setFilterStatus] = useState<string>("actif");

  const [form, setForm] = useState(emptyForm);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    group_label: "",
    identification_number: "",
    weight_kg: "",
    status: "actif",
    mortality_count: "0",
    group_size: "",
    notes: "",
  });

  const handleSpeciesChange = (v: string) => {
    setForm((f) => ({ ...f, species: v, breed: "", is_group: GROUP_SPECIES.has(v) }));
  };

  const effectiveFarmId = farmId || (user ? `nafa_farm_${user.id}` : "default_farm");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.is_group && (!form.group_size || Number(form.group_size) < 1)) {
      toast.error("Veuillez indiquer l'effectif initial du lot");
      return;
    }

    const payload: any = {
      farm_id: effectiveFarmId,
      species: form.species,
      is_group: form.is_group,
      group_label: form.is_group ? (form.group_label || null) : null,
      group_size: form.is_group ? Number(form.group_size) : null,
      mortality_count: form.is_group ? (form.mortality_count ? Number(form.mortality_count) : 0) : 0,
      name: form.is_group ? (form.group_label || null) : (form.name || null),
      identification_number: form.identification_number || null,
      breed: form.breed || null,
      sex: form.is_group ? "inconnu" : form.sex,
      status: "actif",
      birth_date: form.birth_date || null,
      acquisition_date: form.acquisition_date,
      acquisition_cost: form.acquisition_cost ? Number(form.acquisition_cost) : 0,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      notes: form.notes || null,
    };

    const result = await insertRow(payload);
    if (result) {
      toast.success(form.is_group ? "Lot enregistré avec succès ✓" : "Animal ajouté au registre ✓");
      setOpenCreate(false);
      setForm({ ...emptyForm, acquisition_date: new Date().toISOString().split("T")[0] });
    }
  };

  const handleOpenEdit = (animal: any) => {
    setEditingAnimal(animal);
    setEditForm({
      name: animal.name || "",
      group_label: animal.group_label || animal.name || "",
      identification_number: animal.identification_number || "",
      weight_kg: animal.weight_kg != null ? String(animal.weight_kg) : "",
      status: animal.status || "actif",
      mortality_count: animal.mortality_count != null ? String(animal.mortality_count) : "0",
      group_size: animal.group_size != null ? String(animal.group_size) : "",
      notes: animal.notes || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnimal) return;

    const updates: any = {
      status: editForm.status,
      weight_kg: editForm.weight_kg ? Number(editForm.weight_kg) : null,
      notes: editForm.notes || null,
    };

    if (editingAnimal.is_group) {
      updates.group_label = editForm.group_label || null;
      updates.name = editForm.group_label || null;
      updates.mortality_count = editForm.mortality_count ? Number(editForm.mortality_count) : 0;
      if (editForm.group_size) updates.group_size = Number(editForm.group_size);
    } else {
      updates.name = editForm.name || null;
      updates.identification_number = editForm.identification_number || null;
    }

    const ok = await updateRow(editingAnimal.id, updates);
    if (ok) {
      toast.success("Mise à jour enregistrée ✓");
      setEditingAnimal(null);
    }
  };

  const handleDelete = async (id: string, isGroup: boolean) => {
    if (!confirm(isGroup ? "Supprimer ce lot du registre ?" : "Supprimer cet animal du registre ?")) return;
    const ok = await deleteRow(id);
    if (ok) toast.success("Supprimé du registre");
  };

  const filtered = useMemo(() => {
    let list = animals as any[];
    if (filterSpecies !== "all") list = list.filter((a) => a.species === filterSpecies);
    if (filterMode === "individual") list = list.filter((a) => !a.is_group);
    if (filterMode === "group") list = list.filter((a) => a.is_group);
    if (filterStatus !== "all") {
      list = list.filter((a) => (a.status || "actif") === filterStatus);
    }
    return list;
  }, [animals, filterSpecies, filterMode, filterStatus]);

  // Overall counts for quick KPIs
  const summaryStats = useMemo(() => {
    let totalActifs = 0;
    let totalMortalites = 0;
    let totalVendus = 0;

    (animals as any[]).forEach((a) => {
      const st = a.status || "actif";
      if (st === "actif") {
        if (a.is_group) {
          const alive = Math.max(0, (a.group_size || 0) - (a.mortality_count || 0));
          totalActifs += alive;
          totalMortalites += Number(a.mortality_count || 0);
        } else {
          totalActifs += 1;
        }
      } else if (st === "vendu") {
        totalVendus += a.is_group ? Number(a.group_size || 1) : 1;
      } else if (st === "mort") {
        totalMortalites += a.is_group ? Number(a.group_size || 1) : 1;
      }
    });

    return { totalActifs, totalMortalites, totalVendus, totalRegistered: animals.length };
  }, [animals]);

  const currentBreeds = breedsBySpecies[form.species] || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* En-tête avec bouton retour */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold flex items-center gap-2">
              Registre des Animaux & Troupeaux
            </h1>
            <p className="text-muted-foreground text-sm">
              Suivi individuel et par lots (bovins, ovins, caprins, volailles, pisciculture)
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
              <Button className="h-10 font-bold shadow-xs">
                <Plus className="h-4 w-4 mr-1.5" />
                Ajouter au cheptel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{form.is_group ? "Nouveau lot d'animaux (Volaille / Pisciculture)" : "Nouvel animal (Bovin, Ovin, Caprin...)"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Espèce *</Label>
                    <Select value={form.species} onValueChange={handleSpeciesChange}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {speciesOptions.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Race / Souche sahélienne</Label>
                    <Select value={form.breed} onValueChange={(v) => setForm({ ...form, breed: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choisir une race..." /></SelectTrigger>
                      <SelectContent>
                        {currentBreeds.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border p-3 bg-muted/40">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-bold">Suivi par lot / groupe</p>
                      <p className="text-[11px] text-muted-foreground">Activé d'office pour volailles et poissons</p>
                    </div>
                  </div>
                  <Switch checked={form.is_group} onCheckedChange={(v) => setForm({ ...form, is_group: v })} />
                </div>

                {form.is_group ? (
                  <div className="space-y-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Nom ou référence du lot *</Label>
                      <Input
                        placeholder="Ex: Lot poulets chair n°4, Bassin Tilapia B1"
                        value={form.group_label}
                        onChange={(e) => setForm({ ...form, group_label: e.target.value })}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Effectif mis en place *</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Ex: 500"
                          value={form.group_size}
                          onChange={(e) => setForm({ ...form, group_size: e.target.value })}
                          required
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Mortalités initiales</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={form.mortality_count}
                          onChange={(e) => setForm({ ...form, mortality_count: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Nom / Nom usuel</Label>
                        <Input
                          placeholder="Ex: Bella, Sultan, Rougeot"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Sexe</Label>
                        <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {sexOptions.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">N° d'identification (Boucle / Tatouage)</Label>
                      <Input
                        placeholder="Ex: BF-042-2026, BOUCLE-88"
                        value={form.identification_number}
                        onChange={(e) => setForm({ ...form, identification_number: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">{form.is_group ? "Date de mise en place" : "Date de naissance"}</Label>
                    <Input
                      type="date"
                      value={form.birth_date}
                      onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Date d'acquisition</Label>
                    <Input
                      type="date"
                      value={form.acquisition_date}
                      onChange={(e) => setForm({ ...form, acquisition_date: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Coût {form.is_group ? "du lot" : "d'achat"} (FCFA)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.acquisition_cost}
                      onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Poids initial {form.is_group ? "moyen " : ""}(kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 25"
                      value={form.weight_kg}
                      onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Observations / Origine</Label>
                  <Input
                    placeholder="Ex: Acheté au marché à bétail de Pouytenga..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <Button type="submit" className="w-full h-10 font-bold mt-2">
                  Enregistrer dans le cheptel
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border bg-card shadow-xs">
          <p className="text-xs text-muted-foreground font-semibold">Cheptel vif actif</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{summaryStats.totalActifs} têtes</p>
        </div>
        <div className="p-3.5 rounded-2xl border bg-card shadow-xs">
          <p className="text-xs text-muted-foreground font-semibold">Lots & Individus</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{summaryStats.totalRegistered} fiches</p>
        </div>
        <div className="p-3.5 rounded-2xl border bg-card shadow-xs">
          <p className="text-xs text-muted-foreground font-semibold">Vendus</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{summaryStats.totalVendus}</p>
        </div>
        <div className="p-3.5 rounded-2xl border bg-card shadow-xs">
          <p className="text-xs text-muted-foreground font-semibold">Mortalités déclarées</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{summaryStats.totalMortalites}</p>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="flex gap-2 flex-wrap items-center bg-muted/40 p-2.5 rounded-2xl border border-border/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground px-2">
          <Filter className="h-3.5 w-3.5" />
          Filtres :
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="actif">Actifs uniquement</SelectItem>
            <SelectItem value="vendu">Vendus</SelectItem>
            <SelectItem value="mort">Morts</SelectItem>
            <SelectItem value="réformé">Réformés</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterMode} onValueChange={(v: any) => setFilterMode(v)}>
          <SelectTrigger className="w-36 h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tout le cheptel</SelectItem>
            <SelectItem value="individual">Individuels</SelectItem>
            <SelectItem value="group">Lots & bandes</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSpecies} onValueChange={setFilterSpecies}>
          <SelectTrigger className="w-40 h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes espèces</SelectItem>
            {speciesOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grille des animaux */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground space-y-3">
            <p className="font-semibold text-base">Aucun animal ne correspond aux filtres sélectionnés</p>
            <p className="text-xs text-muted-foreground">
              Cliquez sur "Ajouter au cheptel" pour enregistrer votre premier sujet ou lot.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a: any) => {
            const alive = a.is_group ? Math.max(0, (a.group_size || 0) - (a.mortality_count || 0)) : null;
            const currentStatus = a.status || "actif";

            const statusBadgeConfig: Record<string, { label: string; className: string }> = {
              actif: { label: "Actif", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
              vendu: { label: "Vendu", className: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
              mort: { label: "Mort", className: "bg-rose-500/10 text-rose-700 border-rose-500/30" },
              réformé: { label: "Réformé", className: "bg-slate-500/10 text-slate-700 border-slate-500/30" },
            };

            const stBadge = statusBadgeConfig[currentStatus] || { label: currentStatus, className: "" };

            return (
              <Card key={a.id} className={`rounded-2xl border transition-all hover:shadow-md ${a._offline ? "border-dashed border-amber-400" : ""}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-base flex items-center gap-1.5">
                        {a.is_group && <Users className="h-4 w-4 text-primary shrink-0" />}
                        <span className="truncate">{a.group_label || a.name || a.identification_number || "Sans nom"}</span>
                        {a._offline && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">En attente</Badge>}
                      </p>
                      {a.breed && <p className="text-xs text-muted-foreground font-medium">{a.breed}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className={`text-xs ${stBadge.className}`}>
                        {stBadge.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {speciesOptions.find((s) => s.value === a.species)?.label || a.species}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/60">
                    {a.is_group ? (
                      <>
                        <span className="font-bold text-foreground">
                          Effectif : <span className="text-emerald-600">{alive}</span> / {a.group_size}
                        </span>
                        <span>Mortalités : <strong className="text-rose-600">{a.mortality_count || 0}</strong></span>
                        {a.weight_kg && <span>Poids moy : <strong>{a.weight_kg} kg</strong></span>}
                        {a.birth_date && <span>Mise en place : {new Date(a.birth_date).toLocaleDateString("fr-FR")}</span>}
                      </>
                    ) : (
                      <>
                        {a.identification_number && <span>N° boucle : <strong className="text-foreground">{a.identification_number}</strong></span>}
                        <span>Sexe : <strong>{sexOptions.find((s) => s.value === a.sex)?.label || a.sex}</strong></span>
                        {a.weight_kg && (
                          <span className="flex items-center gap-1">
                            <Scale className="h-3 w-3 text-primary" />
                            Poids : <strong className="text-foreground">{a.weight_kg} kg</strong>
                          </span>
                        )}
                        {a.birth_date && <span>Né le : {new Date(a.birth_date).toLocaleDateString("fr-FR")}</span>}
                      </>
                    )}
                    {a.acquisition_cost > 0 && <span>Coût : {Number(a.acquisition_cost).toLocaleString()} FCFA</span>}
                  </div>

                  {a.notes && (
                    <p className="text-[11px] text-muted-foreground italic truncate">
                      « {a.notes} »
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(a)}
                      className="h-8 text-xs font-bold gap-1 rounded-xl"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-primary" />
                      Modifier / Suivi
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(a.id, a.is_group)}
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

      {/* Modal de Modification & Suivi Zootechnique */}
      <Dialog open={Boolean(editingAnimal)} onOpenChange={(open) => !open && setEditingAnimal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Mise à jour zootechnique & statut
            </DialogTitle>
          </DialogHeader>
          {editingAnimal && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Statut actuel *</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editingAnimal.is_group ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Nom du lot</Label>
                    <Input
                      value={editForm.group_label}
                      onChange={(e) => setEditForm({ ...editForm, group_label: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Effectif initial</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editForm.group_size}
                        onChange={(e) => setEditForm({ ...editForm, group_size: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Mortalités cumulées</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editForm.mortality_count}
                        onChange={(e) => setEditForm({ ...editForm, mortality_count: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setEditForm({ ...editForm, mortality_count: String(Number(editForm.mortality_count || 0) + 1) })}
                    >
                      +1 mort
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setEditForm({ ...editForm, mortality_count: String(Number(editForm.mortality_count || 0) + 5) })}
                    >
                      +5 morts
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setEditForm({ ...editForm, mortality_count: String(Number(editForm.mortality_count || 0) + 10) })}
                    >
                      +10 morts
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Nom de l'animal</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">N° d'identification</Label>
                    <Input
                      value={editForm.identification_number}
                      onChange={(e) => setEditForm({ ...editForm, identification_number: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  Poids actuel {editingAnimal.is_group ? "moyen " : ""}(kg) — Suivi GMQ
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 280"
                  value={editForm.weight_kg}
                  onChange={(e) => setEditForm({ ...editForm, weight_kg: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Notes & Observations</Label>
                <Input
                  placeholder="Évolution, état corporel, vaccin récent..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingAnimal(null)}>
                  Annuler
                </Button>
                <Button type="submit" className="font-bold">
                  Enregistrer les modifications
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnimalsPage;
