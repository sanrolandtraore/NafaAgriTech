import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus, Stethoscope, Syringe, Beef, Baby, Utensils, ShieldCheck, GraduationCap,
  ClipboardList, MapPin, Trash2, Clock, CheckCircle, XCircle, Loader2, ShoppingCart,
  Calendar, Phone,
} from "lucide-react";
import ProductServiceCatalog from "@/components/marketplace/ProductServiceCatalog";
import { isValidUuid, isMissingTableError, isInvalidUuidError } from "@/hooks/useOfflineData";
import BackNavigationButton from "@/components/BackNavigationButton";

const LIVESTOCK_SERVICE_TYPES = [
  { value: "sante_animale", label: "Soins & santé animale", icon: Stethoscope, desc: "Consultation vétérinaire, diagnostic de maladies, traitements et suivi sanitaire du troupeau." },
  { value: "vaccination", label: "Programme de vaccination", icon: Syringe, desc: "Planification et réalisation des campagnes de vaccination (PPR, PPCB, charbon, etc.)." },
  { value: "reproduction", label: "Assistance reproduction", icon: Baby, desc: "Insémination artificielle, suivi de gestation, assistance aux mises-bas difficiles." },
  { value: "nutrition_animale", label: "Conseil en nutrition animale", icon: Utensils, desc: "Formulation de rations alimentaires adaptées, gestion des pâturages et compléments." },
  { value: "amelioration_genetique", label: "Amélioration génétique", icon: Beef, desc: "Sélection des reproducteurs, croisements améliorés et conseil en races adaptées." },
  { value: "biosecurite", label: "Biosécurité & hygiène", icon: ShieldCheck, desc: "Audit sanitaire, protocoles de biosécurité, prévention des épizooties." },
  { value: "formation_elevage", label: "Formation élevage", icon: GraduationCap, desc: "Formation aux bonnes pratiques d'élevage, gestion de troupeau et techniques modernes." },
] as const;

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  en_attente: { label: "En attente", variant: "secondary", icon: Clock },
  en_cours: { label: "En cours", variant: "default", icon: Loader2 },
  terminee: { label: "Terminée", variant: "outline", icon: CheckCircle },
  annulee: { label: "Annulée", variant: "destructive", icon: XCircle },
};

type ServiceRequest = {
  id: string;
  service_type: string;
  description: string | null;
  location: string | null;
  farm_id: string | null;
  preferred_date: string | null;
  phone: string | null;
  status: string;
  expert_notes: string | null;
  estimated_cost: number | null;
  created_at: string;
};

const LivestockServicesPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"catalogue" | "demandes">("catalogue");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    service_type: "",
    description: "",
    location: "",
    preferred_date: "",
    phone: "",
  });

  const fetchAll = async () => {
    if (!user) return;
    try {
      let allReqs: ServiceRequest[] = [];
      if (isValidUuid(user.id)) {
        const rRes = await supabase.from("service_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        if (rRes.error && !isMissingTableError(rRes.error) && !isInvalidUuidError(rRes.error)) {
          console.warn("Erreur chargement service_requests:", rRes.error);
        }
        if (rRes.data && rRes.data.length > 0) {
          allReqs = rRes.data as ServiceRequest[];
          localStorage.setItem(`nafa_service_requests_${user.id}`, JSON.stringify(rRes.data));
        }
      }
      if (allReqs.length === 0) {
        const cached = localStorage.getItem(`nafa_service_requests_${user.id}`);
        if (cached) {
          allReqs = JSON.parse(cached);
        }
      }
      const livestockTypes = LIVESTOCK_SERVICE_TYPES.map(s => s.value) as readonly string[];
      setRequests(allReqs.filter(r => livestockTypes.includes(r.service_type)));
    } catch (err) {
      console.warn("LivestockServicesPage fetchAll error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service_type) {
      toast.error("Sélectionnez un type de service");
      return;
    }

    const payload = {
      user_id: user!.id,
      service_type: form.service_type,
      description: form.description || null,
      location: form.location || null,
      preferred_date: form.preferred_date || null,
      phone: form.phone || null,
      status: "en_attente",
    };

    let remoteOk = false;
    if (isValidUuid(user!.id)) {
      const { error } = await supabase.from("service_requests").insert(payload);
      if (!error) {
        remoteOk = true;
      } else if (!isMissingTableError(error) && !isInvalidUuidError(error)) {
        toast.error("Erreur: " + error.message);
        return;
      }
    }

    // Local storage persistence
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fullRow: ServiceRequest = {
      ...payload,
      id: localId,
      farm_id: null,
      created_at: new Date().toISOString(),
    } as ServiceRequest;

    const cachedKey = `nafa_service_requests_${user!.id}`;
    const existing: ServiceRequest[] = JSON.parse(localStorage.getItem(cachedKey) || "[]");
    localStorage.setItem(cachedKey, JSON.stringify([fullRow, ...existing]));

    toast.success(remoteOk ? "Demande envoyée avec succès !" : "Demande enregistrée localement !");
    setForm({ service_type: "", description: "", location: "", preferred_date: "", phone: "" });
    setOpen(false);
    fetchAll();
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler cette demande ?")) return;
    if (isValidUuid(user?.id) && !id.startsWith("local-")) {
      const { error } = await supabase.from("service_requests").update({ status: "annulee" }).eq("id", id);
      if (error && !isMissingTableError(error)) {
        toast.error(error.message);
        return;
      }
    }
    const cachedKey = `nafa_service_requests_${user?.id}`;
    const existing: ServiceRequest[] = JSON.parse(localStorage.getItem(cachedKey) || "[]");
    localStorage.setItem(
      cachedKey,
      JSON.stringify(existing.map(r => r.id === id ? { ...r, status: "annulee" } : r))
    );
    toast.success("Demande annulée");
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette demande ?")) return;
    if (isValidUuid(user?.id) && !id.startsWith("local-")) {
      const { error } = await supabase.from("service_requests").delete().eq("id", id);
      if (error && !isMissingTableError(error)) {
        toast.error(error.message);
        return;
      }
    }
    const cachedKey = `nafa_service_requests_${user?.id}`;
    const existing: ServiceRequest[] = JSON.parse(localStorage.getItem(cachedKey) || "[]");
    localStorage.setItem(
      cachedKey,
      JSON.stringify(existing.filter(r => r.id !== id))
    );
    toast.success("Demande supprimée");
    fetchAll();
  };

  const getServiceLabel = (type: string) => LIVESTOCK_SERVICE_TYPES.find(s => s.value === type)?.label || type;
  const getServiceIcon = (type: string) => LIVESTOCK_SERVICE_TYPES.find(s => s.value === type)?.icon || ClipboardList;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header et sélecteur direct de mode sans nav secondaire */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold flex items-center gap-2">
              <Stethoscope className="h-7 w-7 text-primary" /> Services & Soins Vétérinaires
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              Commandez vos produits de soin et sollicitez l'accompagnement d'experts vétérinaires
            </p>
          </div>
        </div>

        {/* Pill switcher direct */}
        <div className="inline-flex p-1.5 rounded-2xl bg-muted/80 border border-border shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("catalogue")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "catalogue"
                ? "bg-primary text-primary-foreground shadow-premium"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Produits & Offres Directes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("demandes")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "demandes"
                ? "bg-primary text-primary-foreground shadow-premium"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Mes Demandes ({requests.length})
          </button>
        </div>
      </div>

      {activeTab === "catalogue" ? (
        <div className="animate-fade-in">
          <ProductServiceCatalog
            initialCategory="sante_veterinaire"
            title="Catalogue Santé, Nutrition & Soins Pastoraux"
            description="Packs prophylactiques, vaccins, compléments alimentaires, insémination artificielle et matériel d'élevage certifiés."
            defaultRole="eleveur"
          />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-muted-foreground">
              Historique et suivi de vos demandes d'intervention vétérinaire sur site.
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground font-bold rounded-xl h-11 px-5 shadow-premium">
                  <Plus className="h-4 w-4 mr-2" />Nouvelle demande d'intervention
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Demander un service vétérinaire / élevage</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold">Type de service *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {LIVESTOCK_SERVICE_TYPES.map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, service_type: value }))}
                      className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        form.service_type === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${form.service_type === value ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <span className="text-sm font-semibold leading-tight block">{label}</span>
                        <span className="text-[11px] text-muted-foreground leading-tight">{desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label>Localisation</Label>
                  <Input placeholder="Village, commune…" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Date souhaitée</Label>
                  <Input type="date" value={form.preferred_date} onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone de contact</Label>
                  <Input placeholder="+226 70 00 00 00" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description détaillée</Label>
                <Textarea placeholder="Décrivez le problème, les symptômes observés, le nombre d'animaux concernés…" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <Button type="submit" className="w-full gradient-primary text-primary-foreground">Envoyer la demande</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Catalogue des services */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-3">Nos prestations élevage</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LIVESTOCK_SERVICE_TYPES.map(({ value, label, icon: Icon, desc }) => (
            <Card key={value} className="shadow-sm hover:shadow-warm transition-shadow cursor-pointer" onClick={() => { setForm(f => ({ ...f, service_type: value })); setOpen(true); }}>
              <CardContent className="flex items-start gap-3 pt-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Mes demandes */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-3">Mes demandes</h2>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        ) : requests.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Aucune demande de service. Cliquez sur un service ci-dessus pour commencer.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const ServiceIcon = getServiceIcon(req.service_type);
              const st = statusConfig[req.status] || statusConfig.en_attente;
              const StIcon = st.icon;
              return (
                <Card key={req.id} className="shadow-sm">
                  <CardContent className="flex items-start gap-4 pt-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <ServiceIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{getServiceLabel(req.service_type)}</p>
                        <Badge variant={st.variant} className="flex items-center gap-1 text-xs">
                          <StIcon className="h-3 w-3" />{st.label}
                        </Badge>
                      </div>
                      {req.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {req.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {req.location}
                          </span>
                        )}
                        {req.preferred_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(req.preferred_date).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                        {req.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {req.phone}
                          </span>
                        )}
                        <span>Créée le {new Date(req.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                      {req.expert_notes && (
                        <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border">
                          <p className="text-xs font-semibold text-foreground">Réponse de l'expert :</p>
                          <p className="text-xs text-muted-foreground">{req.expert_notes}</p>
                          {(req.estimated_cost ?? 0) > 0 && (
                            <p className="text-xs font-semibold text-primary mt-1">Coût estimé : {Number(req.estimated_cost).toLocaleString()} FCFA</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {req.status === "en_attente" && (
                        <Button variant="ghost" size="icon" onClick={() => handleCancel(req.id)} title="Annuler">
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      {(req.status === "annulee" || req.status === "terminee") && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(req.id)} title="Supprimer">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )}
</div>
  );
};

export default LivestockServicesPage;
