import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Baby, WifiOff, CheckCircle2, HeartHandshake, Calendar, Filter, Sparkles } from "lucide-react";
import { useOfflineData, isValidUuid } from "@/hooks/useOfflineData";
import { useDefaultLivestockFarm } from "@/hooks/useDefaultLivestockFarm";
import { calculateExpectedBirthDate, getGestationPeriodDays } from "@/lib/livestockEngine";
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
  const { user } = useAuth();
  const { farmId } = useDefaultLivestockFarm();
  const effectiveFarmId = (farmId && isValidUuid(farmId))
    ? farmId
    : (user && isValidUuid(user.id))
    ? user.id
    : "10000000-1000-4000-8000-100000000000";

  const { data: events, loading: loadingEvents, isOffline, insertRow, updateRow, deleteRow } = useOfflineData({
    table: "animal_reproductions",
    select: "*",
    orderBy: "event_date",
  });

  const { data: animals, loading: loadingAnimals, insertRow: insertAnimal } = useOfflineData({
    table: "animals",
    select: "*",
    orderBy: "name",
  });

  const { insertRow: insertExpense } = useOfflineData({
    table: "livestock_expenses",
    select: "*",
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
    autoAddToCheptel: true,
    notes: "",
  });

  const animalsMap = useMemo(() => {
    const map = new Map<string, any>();
    (animals || []).forEach((a: any) => map.set(a.id, a));
    return map;
  }, [animals]);

  const activeAnimals = useMemo(() => {
    return (animals || []).filter((a: any) => {
      const st = (a.status || "actif").toString().toLowerCase();
      return st === "actif";
    });
  }, [animals]);

  const { explicitFemales, unspecifiedAnimals, otherActiveAnimals, males } = useMemo(() => {
    const femalesList: any[] = [];
    const unspecifiedList: any[] = [];
    const othersList: any[] = [];
    const malesList: any[] = [];

    activeAnimals.forEach((a: any) => {
      const s = (a.sex || "").toString().trim().toLowerCase();
      if (s === "femelle" || s === "female" || s === "f") {
        femalesList.push(a);
      } else if (!s || s === "inconnu" || s === "unknown" || a.is_group) {
        unspecifiedList.push(a);
      } else if (s === "male" || s === "mâle" || s === "m") {
        malesList.push(a);
        othersList.push(a);
      } else {
        othersList.push(a);
      }
    });

    return {
      explicitFemales: femalesList,
      unspecifiedAnimals: unspecifiedList,
      otherActiveAnimals: othersList,
      males: malesList,
    };
  }, [activeAnimals]);

  // Quick Add Female Reproductrice inline state & handler
  const [quickAddFemaleOpen, setQuickAddFemaleOpen] = useState(false);
  const [quickFemale, setQuickFemale] = useState({
    name: "",
    identification_number: "",
    species: "bovin",
    breed: "",
  });
  const [addingFemale, setAddingFemale] = useState(false);

  const handleQuickAddFemale = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nameOrId = quickFemale.name.trim() || quickFemale.identification_number.trim();
    if (!nameOrId) {
      toast.error("Veuillez renseigner au moins un nom ou un numéro pour la reproductrice");
      return;
    }

    setAddingFemale(true);
    try {
      const displayName = quickFemale.name.trim() || `Femelle #${quickFemale.identification_number.trim()}`;
      const payload: any = {
        farm_id: effectiveFarmId,
        species: quickFemale.species,
        is_group: false,
        name: displayName,
        identification_number: quickFemale.identification_number.trim() || null,
        breed: quickFemale.breed.trim() || null,
        sex: "femelle",
        status: "actif",
        acquisition_date: new Date().toISOString().split("T")[0],
        acquisition_cost: 0,
        notes: "Créée directement depuis le suivi de reproduction",
      };

      const result = await insertAnimal(payload);
      const newAnimalId = result?.id;
      if (newAnimalId) {
        let expected = form.expected_birth_date;
        if (["saillie", "insemination", "gestation"].includes(form.event_type) && form.event_date) {
          expected = calculateExpectedBirthDate(form.event_date, quickFemale.species);
        }
        setForm((prev) => ({
          ...prev,
          animal_id: newAnimalId,
          expected_birth_date: expected,
        }));
        toast.success(`Reproductrice "${displayName}" enregistrée et sélectionnée !`);
        setQuickAddFemaleOpen(false);
        setQuickFemale({ name: "", identification_number: "", species: "bovin", breed: "" });
      } else {
        toast.error("Erreur lors de l'enregistrement de la reproductrice");
      }
    } catch (err: any) {
      console.error("handleQuickAddFemale error:", err);
      toast.error("Impossible d'enregistrer la reproductrice");
    } finally {
      setAddingFemale(false);
    }
  };

  const getAnimalDisplayName = (animalId: string) => {
    const a = animalsMap.get(animalId);
    if (!a) return "Animal";
    return `${a.name || a.identification_number || a.group_label || "Animal"} (${a.species})`;
  };

  const handleAnimalSelect = (animalId: string) => {
    const animal = animalsMap.get(animalId);
    let expected = form.expected_birth_date;
    if (animal && ["saillie", "insemination", "gestation"].includes(form.event_type) && form.event_date) {
      expected = calculateExpectedBirthDate(form.event_date, animal.species);
    }
    setForm((prev) => ({
      ...prev,
      animal_id: animalId,
      expected_birth_date: expected,
    }));
  };

  const handleEventDateChange = (date: string) => {
    const animal = animalsMap.get(form.animal_id);
    let expected = form.expected_birth_date;
    if (animal && ["saillie", "insemination", "gestation"].includes(form.event_type) && date) {
      expected = calculateExpectedBirthDate(date, animal.species);
    }
    setForm((prev) => ({
      ...prev,
      event_date: date,
      expected_birth_date: expected,
    }));
  };

  const handleEventTypeChange = (type: string) => {
    const animal = animalsMap.get(form.animal_id);
    let expected = form.expected_birth_date;
    if (animal && ["saillie", "insemination", "gestation"].includes(type) && form.event_date) {
      expected = calculateExpectedBirthDate(form.event_date, animal.species);
    }
    setForm((prev) => ({
      ...prev,
      event_type: type,
      expected_birth_date: expected,
    }));
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
      // Synchronisation immédiate avec la comptabilité pastorale
      const reproCost = Number(form.cost || 0);
      if (reproCost > 0 && insertExpense) {
        try {
          const typeLabel = reproTypes.find((t) => t.value === form.event_type)?.label || form.event_type;
          await insertExpense({
            farm_id: effectiveFarmId,
            animal_id: form.animal_id || null,
            category: "sante",
            description: `Acte de reproduction : ${typeLabel}`,
            amount: reproCost,
            expense_date: form.event_date,
            notes: form.notes ? `Reproduction - ${form.notes}` : "Synchronisé automatiquement depuis le suivi de reproduction",
          });
          toast.info(`Frais de reproduction (${reproCost.toLocaleString()} FCFA) synchronisés en comptabilité`);
        } catch (_syncErr) {
          // non-blocking
        }
      }

      toast.success("Événement de reproduction enregistré avec succès.");
      setOpenCreate(false);
      setQuickAddFemaleOpen(false);
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
      autoAddToCheptel: true,
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
      const aliveCount = Number(birthForm.offspring_alive || 0);
      if (birthForm.autoAddToCheptel && aliveCount > 0 && insertAnimal) {
        const mother = animalsMap.get(resolvingGestation.animal_id);
        const species = mother?.species || "bovin";
        const isGroupSpecies = ["volaille", "pisciculture"].includes(species) || aliveCount > 4;

        try {
          if (isGroupSpecies) {
            await insertAnimal({
              farm_id: effectiveFarmId,
              species,
              is_group: true,
              group_label: `Portée de ${mother?.name || "reproductrice"} (${aliveCount} nés)`,
              group_size: aliveCount,
              mortality_count: 0,
              name: `Portée de ${mother?.name || "reproductrice"}`,
              status: "actif",
              birth_date: birthForm.actual_birth_date,
              acquisition_date: birthForm.actual_birth_date,
              acquisition_cost: 0,
              notes: `Issu de la mise bas du ${birthForm.actual_birth_date} (Mère: ${mother?.name || mother?.identification_number || "Inconnue"})`,
            });
            toast.info(`${aliveCount} jeune(s) ajouté(s) comme lot dans le cheptel.`);
          } else {
            for (let i = 1; i <= aliveCount; i++) {
              const suffix = aliveCount > 1 ? ` #${i}` : "";
              const youngName = species === "bovin" ? "Veau" : species === "ovin" ? "Agneau" : species === "caprin" ? "Chevreau" : "Porcelet";
              await insertAnimal({
                farm_id: effectiveFarmId,
                species,
                is_group: false,
                name: `${youngName} de ${mother?.name || "Mère"}${suffix}`,
                breed: mother?.breed || null,
                sex: "inconnu",
                status: "actif",
                birth_date: birthForm.actual_birth_date,
                acquisition_date: birthForm.actual_birth_date,
                acquisition_cost: 0,
                notes: `Issu de la mise bas du ${birthForm.actual_birth_date} (Mère: ${mother?.name || mother?.identification_number || "Inconnue"})`,
              });
            }
            toast.info(`${aliveCount} jeune(s) enregistré(s) individuellement dans le cheptel.`);
          }
        } catch (_err) {
          // non-blocking
        }
      }

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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <span>Reproductrice (Mère) *</span>
                      {form.animal_id && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1 text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                          Sélectionnée
                        </Badge>
                      )}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuickAddFemaleOpen(!quickAddFemaleOpen)}
                      className="h-6 px-2 text-[11px] font-bold text-sky-700 hover:text-sky-800 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/50"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {quickAddFemaleOpen ? "Fermer formulaire" : "Ajouter une reproductrice"}
                    </Button>
                  </div>

                  {quickAddFemaleOpen && (
                    <div className="p-3 bg-sky-50/80 dark:bg-sky-950/30 rounded-lg border border-sky-200 dark:border-sky-800 space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                          Création rapide d'une reproductrice
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuickAddFemaleOpen(false)}
                          className="text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          Annuler
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[11px]">Nom ou Surnom *</Label>
                          <Input
                            placeholder="Ex: Bella, Blanchette..."
                            value={quickFemale.name}
                            onChange={(e) => setQuickFemale({ ...quickFemale, name: e.target.value })}
                            className="h-8 text-xs bg-white dark:bg-card"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px]">N° Boucle / ID</Label>
                          <Input
                            placeholder="Ex: BF-042"
                            value={quickFemale.identification_number}
                            onChange={(e) => setQuickFemale({ ...quickFemale, identification_number: e.target.value })}
                            className="h-8 text-xs bg-white dark:bg-card"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[11px]">Espèce</Label>
                          <Select
                            value={quickFemale.species}
                            onValueChange={(v) => setQuickFemale({ ...quickFemale, species: v })}
                          >
                            <SelectTrigger className="h-8 text-xs bg-white dark:bg-card"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bovin">Bovin (Vache / Génisse)</SelectItem>
                              <SelectItem value="ovin">Ovin (Brebis)</SelectItem>
                              <SelectItem value="caprin">Caprin (Chèvre)</SelectItem>
                              <SelectItem value="porcin">Porcin (Truie)</SelectItem>
                              <SelectItem value="volaille">Volaille (Poule / Pondeuse)</SelectItem>
                              <SelectItem value="pisciculture">Pisciculture (Géniteur)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[11px]">Race (optionnelle)</Label>
                          <Input
                            placeholder="Ex: Zébu Peulh, Djallonké..."
                            value={quickFemale.breed}
                            onChange={(e) => setQuickFemale({ ...quickFemale, breed: e.target.value })}
                            className="h-8 text-xs bg-white dark:bg-card"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleQuickAddFemale()}
                        disabled={addingFemale || (!quickFemale.name.trim() && !quickFemale.identification_number.trim())}
                        className="w-full h-8 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white"
                      >
                        {addingFemale ? "Enregistrement..." : "Enregistrer et sélectionner comme mère"}
                      </Button>
                    </div>
                  )}

                  <Select value={form.animal_id || undefined} onValueChange={handleAnimalSelect}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder={loadingAnimals ? "Chargement des animaux..." : "Choisir la femelle reproductrice..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {/* Si l'animal sélectionné n'est pas dans les listes filtrées (ex: créé hors ligne), le garder visible */}
                      {form.animal_id && animalsMap.has(form.animal_id) && !explicitFemales.some((a: any) => a.id === form.animal_id) && !unspecifiedAnimals.some((a: any) => a.id === form.animal_id) && !otherActiveAnimals.some((a: any) => a.id === form.animal_id) && (
                        <SelectItem value={form.animal_id}>
                          {getAnimalDisplayName(form.animal_id)}
                        </SelectItem>
                      )}

                      {/* Groupe 1 : Femelles confirmées */}
                      {explicitFemales.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                            Femelles confirmées ({explicitFemales.length})
                          </SelectLabel>
                          {explicitFemales.map((a: any) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name || a.identification_number || "Femelle"} ({a.species}{a.identification_number ? ` • #${a.identification_number}` : ""})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}

                      {/* Groupe 2 : Sujets avec sexe non spécifié ou lots */}
                      {unspecifiedAnimals.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-amber-700 dark:text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                            Sujets & Lots reproducteurs ({unspecifiedAnimals.length})
                          </SelectLabel>
                          {unspecifiedAnimals.map((a: any) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.is_group ? `[Lot] ${a.group_label || a.name || "Lot"}` : a.name || a.identification_number || "Animal"} ({a.species})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}

                      {/* Groupe 3 : Autres sujets actifs du cheptel */}
                      {otherActiveAnimals.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                            Autres sujets du cheptel ({otherActiveAnimals.length})
                          </SelectLabel>
                          {otherActiveAnimals.map((a: any) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name || a.identification_number || "Animal"} ({a.species} • {a.sex || "Sujet"})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}

                      {activeAnimals.length === 0 && (
                        <SelectItem value="__none__" disabled>
                          Aucun animal dans le cheptel — Utilisez le bouton d'ajout ci-dessus
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  {activeAnimals.length === 0 && !quickAddFemaleOpen && (
                    <div className="flex items-center justify-between p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-200">
                      <span>Votre cheptel n'a pas encore d'animaux enregistrés.</span>
                      <button
                        type="button"
                        onClick={() => setQuickAddFemaleOpen(true)}
                        className="font-bold underline text-amber-900 dark:text-amber-100 hover:text-sky-700 ml-1"
                      >
                        Créer une reproductrice
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Type d'acte *</Label>
                    <Select value={form.event_type} onValueChange={handleEventTypeChange}>
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
                      onChange={(e) => handleEventDateChange(e.target.value)}
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Reproducteur (Père ou référence semence)</Label>
                  <Select value={form.partner_id || undefined} onValueChange={(v) => setForm({ ...form, partner_id: v === "none" ? "" : v })}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choisir un mâle du cheptel ou laisser vide..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Aucun mâle / Semence externe --</SelectItem>
                      {males.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name || a.identification_number || "Mâle"} ({a.species})
                        </SelectItem>
                      ))}
                      {unspecifiedAnimals.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name || a.identification_number || "Sujet"} ({a.species})
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

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold cursor-pointer">Intégrer immédiatement au cheptel</Label>
                  <p className="text-[11px] text-muted-foreground">Crée automatiquement les nouveaux nés dans le registre</p>
                </div>
                <Switch
                  checked={birthForm.autoAddToCheptel}
                  onCheckedChange={(checked) => setBirthForm({ ...birthForm, autoAddToCheptel: checked })}
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
