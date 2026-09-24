import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, Trash2, ClipboardList, Pencil, CheckCircle2, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { partnerStorage, PartnerMission, ProviderClient } from "@/lib/partnerStorage";

const SERVICES_AGRI = [
  "conseil", "diagnostic", "traitement phytosanitaire", "labour / préparation",
  "semis", "irrigation", "récolte", "formation", "autre"
];
const SERVICES_ELEV = [
  "consultation vétérinaire", "vaccination", "déparasitage", "insémination",
  "conseil alimentation", "formation", "autre"
];

const STATUSES = [
  { value: "planifiee", label: "Planifiée" },
  { value: "en_cours", label: "En cours" },
  { value: "terminee", label: "Terminée" },
  { value: "annulee", label: "Annulée" },
];

export default function MissionsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<PartnerMission[]>([]);
  const [clients, setClients] = useState<ProviderClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerMission | null>(null);

  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [domain, setDomain] = useState<"agriculture" | "elevage">("agriculture");
  const [serviceType, setServiceType] = useState("labour / préparation");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<PartnerMission["status"]>("planifiee");
  const [price, setPrice] = useState("");
  const [paid, setPaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"actives" | "terminees" | "toutes">("actives");

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([
        partnerStorage.getMissions(user?.id),
        partnerStorage.getClients(user?.id),
      ]);
      setMissions(m);
      setClients(c);
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

  const services = domain === "elevage" ? SERVICES_ELEV : SERVICES_AGRI;

  const reset = () => {
    setEditing(null);
    setClientId("");
    setClientName("");
    setDomain("agriculture");
    setServiceType("labour / préparation");
    setTitle("");
    setDescription("");
    setLocation("");
    setDate(new Date().toISOString().slice(0, 10));
    setStatus("planifiee");
    setPrice("");
    setPaid(false);
  };

  const openEdit = (m: PartnerMission) => {
    setEditing(m);
    setClientId(m.client_id ?? "");
    setClientName(m.client_name);
    setDomain(m.domain === "elevage" ? "elevage" : "agriculture");
    setServiceType(m.service_type);
    setTitle(m.title);
    setDescription(m.description ?? "");
    setLocation(m.location_name ?? "");
    setDate(m.scheduled_date);
    setStatus(m.status);
    setPrice(m.price != null ? String(m.price) : "");
    setPaid(m.paid);
    setOpen(true);
  };

  const save = async () => {
    if (!title.trim()) {
      toast.error("Veuillez renseigner le titre de la mission.");
      return;
    }
    const resolvedName = clientId
      ? (clients.find((c) => c.id === clientId)?.client_full_name ?? clientName)
      : clientName;

    if (!resolvedName.trim()) {
      toast.error("Veuillez indiquer le client de la mission.");
      return;
    }

    setSaving(true);
    try {
      await partnerStorage.saveMission({
        id: editing?.id,
        provider_id: user?.id || "demo-partner-id",
        client_id: clientId || null,
        client_name: resolvedName.trim(),
        domain,
        service_type: serviceType,
        title: title.trim(),
        description: description.trim() || null,
        location_name: location.trim() || null,
        scheduled_date: date,
        status,
        completed_date: status === "terminee" ? (editing?.completed_date || new Date().toISOString().slice(0, 10)) : null,
        price: price ? Number(price) : null,
        paid,
      });

      toast.success(editing ? "Mission mise à jour avec succès !" : "Nouvelle mission enregistrée !");
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
    if (confirm("Supprimer cette mission ?")) {
      await partnerStorage.deleteMission(id);
      toast.success("Mission supprimée");
      loadData();
    }
  };

  const grouped = useMemo(
    () => ({
      actives: missions.filter((m) => m.status === "planifiee" || m.status === "en_cours"),
      terminees: missions.filter((m) => m.status === "terminee"),
      toutes: missions,
    }),
    [missions]
  );

  const MissionList = ({ items }: { items: PartnerMission[] }) =>
    items.length === 0 ? (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          Aucune mission dans cette catégorie.
        </CardContent>
      </Card>
    ) : (
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((m) => (
          <Card key={m.id} className="hover:border-primary/50 transition-all flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-bold leading-snug">{m.title}</CardTitle>
                <Badge
                  variant={m.status === "terminee" ? "default" : "secondary"}
                  className="text-[10px] shrink-0"
                >
                  {STATUSES.find((s) => s.value === m.status)?.label ?? m.status}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {m.client_name} · <span className="capitalize">{m.domain}</span> · {m.service_type}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Prévue le {new Date(m.scheduled_date).toLocaleDateString("fr-FR")}</span>
                {m.location_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {m.location_name}
                  </span>
                )}
              </div>

              {m.description && (
                <p className="text-muted-foreground leading-relaxed line-clamp-2">
                  {m.description}
                </p>
              )}

              {m.price != null && (
                <div className="flex items-center justify-between pt-1">
                  <span className="font-heading font-bold text-sm text-foreground">
                    {Number(m.price).toLocaleString("fr-FR")} FCFA
                  </span>
                  <Badge variant={m.paid ? "secondary" : "outline"} className="text-[10px] flex items-center gap-1">
                    {m.paid ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Payé
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 text-amber-600" /> En attente de paiement
                      </>
                    )}
                  </Badge>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t justify-end">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(m)}>
                  <Pencil className="h-3 w-3 mr-1" /> Modifier
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => remove(m.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
            <Briefcase className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-foreground tracking-tight">
              Missions & Chantiers de Prestation
            </h1>
            <p className="text-base text-muted-foreground mt-1 font-medium">
              Suivi en temps réel des chantiers agricoles, labours mécanisés, récoltes et traitements.
            </p>
          </div>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }} className="h-12 px-6 text-sm font-bold rounded-xl gradient-primary text-primary-foreground shadow-premium shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Nouvelle mission
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="h-36 animate-pulse bg-muted/40 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sélecteur direct sans nav secondaire */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveFilter("actives")}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-base font-bold transition-all ${
                activeFilter === "actives"
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>En cours</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-background/50">
                {grouped.actives.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("terminees")}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-base font-bold transition-all ${
                activeFilter === "terminees"
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Terminées</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-background/50">
                {grouped.terminees.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("toutes")}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-base font-bold transition-all ${
                activeFilter === "toutes"
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <ClipboardList className="h-5 w-5" />
              <span>Toutes les missions</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-background/50">
                {grouped.toutes.length}
              </span>
            </button>
          </div>

          <div>
            {activeFilter === "actives" && <MissionList items={grouped.actives} />}
            {activeFilter === "terminees" && <MissionList items={grouped.terminees} />}
            {activeFilter === "toutes" && <MissionList items={grouped.toutes} />}
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-heading font-bold">
              {editing ? "Modifier la mission" : "Nouvelle mission de prestation"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>Client (Exploitation ou Producteur) *</Label>
              <Select
                value={clientId || "manuel"}
                onValueChange={(v) => {
                  if (v === "manuel") {
                    setClientId("");
                  } else {
                    setClientId(v);
                    const selected = clients.find((c) => c.id === v);
                    if (selected) setClientName(selected.client_full_name);
                  }
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manuel">Saisir manuellement</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.client_full_name} {c.location ? `(${c.location})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!clientId && (
                <Input
                  className="mt-2"
                  placeholder="Nom du client ou de la coopérative"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Domaine</Label>
                <Select
                  value={domain}
                  onValueChange={(v: "agriculture" | "elevage") => {
                    setDomain(v);
                    setServiceType(v === "elevage" ? SERVICES_ELEV[0] : SERVICES_AGRI[0]);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="elevage">Élevage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Type de prestation</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Intitulé de la mission *</Label>
              <Input
                placeholder="ex: Labour mécanisé 10 ha, traitement verger..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Description & Spécifications</Label>
              <Textarea
                rows={2}
                placeholder="Surface, engins mobilisés, doses prévues..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date prévue</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Lieu d'intervention</Label>
                <Input placeholder="Commune, village..." value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Statut</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Montant total (FCFA)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="ex: 150000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="rounded text-primary"
              />
              Paiement déjà encaissé / réglé
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground font-semibold">
              {saving ? "Enregistrement…" : editing ? "Enregistrer" : "Créer la mission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
