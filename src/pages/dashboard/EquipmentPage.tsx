import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineData } from "@/hooks/useOfflineData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Tractor,
  Wrench,
  Plus,
  Trash2,
  Edit2,
  WifiOff,
  Search,
  Filter,
  Sparkles,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Layers,
  Fuel,
  Gauge,
  Smartphone,
  ShieldCheck,
  Zap,
  Truck,
  Wheat,
  Star,
  ExternalLink,
  ChevronRight,
  Share2,
  Sprout,
  FileText,
} from "lucide-react";
import MechanizationEstimatorCard from "@/components/mechanization/MechanizationEstimatorCard";
import MechanizationBookingModal from "@/components/mechanization/MechanizationBookingModal";
import MechanizationUssdSimulator from "@/components/mechanization/MechanizationUssdSimulator";
import { listMechanizationMachines, listMechanizationServices, listMyMechanizationJobs } from "@/components/mechanization/repository";
import { MechanizationJob, MechanizationMachine, MechanizationService } from "@/components/mechanization/types";

const statusColors: Record<string, string> = {
  disponible: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  en_maintenance: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  hors_service: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  disponible: "Opérationnel",
  en_maintenance: "En maintenance",
  hors_service: "Hors service",
};

const typeLabels: Record<string, string> = {
  outil: "Outil attelé",
  machine: "Tracteur / Machine",
  vehicule: "Véhicule utilitaire",
  irrigation: "Motopompe / Irrigation",
  stockage: "Équipement de stockage",
};

export const EquipmentPage = () => {
  // Existing offline data for farmer's private equipment
  const {
    data: equipment,
    loading,
    isOffline,
    insertRow,
    updateRow,
    deleteRow,
  } = useOfflineData({
    table: "equipment",
    select: "*, farms(name)",
  });

  const [farms, setFarms] = useState<any[]>([]);
  const [parcels, setParcels] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    farm_id: "",
    name: "",
    type: "machine",
    status: "disponible",
    purchase_date: "",
    purchase_cost: "",
    notes: "",
  });

  // NAFA - AGRITECH Hub State
  const [activeTab, setActiveTab] = useState<string>("hub");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [jobs, setJobs] = useState<MechanizationJob[]>([]);
  const [machines, setMachines] = useState<MechanizationMachine[]>([]);
  const [services, setServices] = useState<MechanizationService[]>([]);

  // Booking modal trigger state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBookingData, setSelectedBookingData] = useState<{
    service?: MechanizationService;
    machine?: MechanizationMachine;
    areaHa?: number;
    totalCost?: number;
    depositAmount?: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("farms").select("id,name"),
      supabase.from("parcels").select("id,name,area_ha"),
      listMechanizationMachines(),
      listMechanizationServices(),
      listMyMechanizationJobs(),
    ]).then(([farmsResult, parcelsResult, machineData, serviceData, jobData]) => {
      setFarms(farmsResult.data || []); setParcels(parcelsResult.data || []);
      setMachines(machineData); setServices(serviceData); setJobs(jobData);
    }).catch((error) => console.warn("Hub mécanisation:", error));
  }, []);

  const resetForm = () => {
    setForm({
      farm_id: "",
      name: "",
      type: "machine",
      status: "disponible",
      purchase_date: "",
      purchase_cost: "",
      notes: "",
    });
    setEditing(null);
  };

  const handlePrivateEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      purchase_cost: parseFloat(form.purchase_cost) || 0,
      purchase_date: form.purchase_date || null,
    };
    if (editing) {
      const ok = await updateRow(editing.id, payload);
      if (ok) toast.success("Équipement modifié !");
    } else {
      const result = await insertRow(payload);
      if (result) toast.success("Équipement ajouté à votre parc privé !");
    }
    resetForm();
    setOpenModal(false);
  };

  const handleCreateJob = (newJob: MechanizationJob) => {
    setJobs((current) => [newJob, ...current]);
    setActiveTab("chantiers");
  };

  const handleValidateJob = async (jobId: string) => {
    const { data, error } = await supabase
      .from("mechanization_jobs")
      .update({ job_status: "termine", escrow_status: "solde_debloque" })
      .eq("id", jobId)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Validation chantier:", error);
      toast.error("Impossible de valider le chantier.");
      return;
    }

    const updatedJob: MechanizationJob = {
      id: data.id,
      serviceType: data.service_type,
      parcelName: data.parcel_name,
      areaHa: Number(data.area_ha),
      totalCost: Number(data.total_cost),
      depositAmount: Number(data.deposit_amount),
      paymentMethod: data.payment_method,
      escrowStatus: data.escrow_status,
      jobStatus: data.job_status,
      operatorName: data.operator_name ?? "En attente d'affectation",
      operatorPhone: data.operator_phone ?? "",
      fieldAgentName: data.field_agent_name ?? "Non affecté",
      fieldAgentPhone: data.field_agent_phone ?? "",
      scheduledDate: data.scheduled_date,
      machineName: data.machine_name ?? "À affecter",
      engineHoursStart: data.engine_hours_start == null ? undefined : Number(data.engine_hours_start),
      engineHoursEnd: data.engine_hours_end == null ? undefined : Number(data.engine_hours_end),
      notes: data.notes ?? "",
    };

    setJobs((current) => current.map((job) => job.id === jobId ? updatedJob : job));
    toast.success("Chantier validé.");
  };

  // Filter machines
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const matchCat = categoryFilter === "all" || m.category === categoryFilter;
      const matchSearch =
        searchQuery === "" ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.brandModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.verifiedPartner.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [machines, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* NAFA - AGRITECH Field Mechanization Hero Header */}
      <section className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden bg-gradient-to-br from-stone-950 via-emerald-950 to-amber-950 shadow-2xl border border-emerald-500/20">
        <div className="absolute -right-6 -bottom-8 opacity-10 select-none pointer-events-none">
          <Tractor className="w-56 h-56" />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-400 text-stone-950 font-black tracking-wider text-[11px] px-3 py-1 uppercase rounded-md shadow-sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-stone-950" />
                NAFA - AGRITECH MÉCANISATION
              </Badge>
              <Badge variant="outline" className="text-emerald-300 border-emerald-500/30 bg-emerald-950/40 text-[11px] font-medium backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                Opérateurs Certifiés & Séquestre Mobile Money
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {isOffline ? (
                <Badge variant="outline" className="bg-amber-500/20 border-amber-400/40 text-amber-300 text-xs gap-1.5">
                  <WifiOff className="h-3 w-3" /> Mode Hors-ligne / USSD Prêt
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-500/20 border-emerald-400/30 text-emerald-300 text-xs gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Réseau Prestataires Actif
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-heading">
              Louez ou Déployez du Matériel Agricole de Précision
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
              Service officiel <strong>NAFA - AGRITECH Mécanisation</strong> : réservation sans friction de tracteurs 4WD, pulvérisateurs drones RTK et moissonneuses. Réservation en ligne ou par <strong>code USSD *384*226#</strong>, opérateurs qualifiés et paiement sécurisé libéré uniquement à la validation des travaux sur le terrain.
            </p>
          </div>

          {/* High-Contrast Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-stone-900/80 backdrop-blur-md rounded-2xl p-3.5 border border-stone-800/80 shadow-sm hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold uppercase tracking-wider">
                <span>Flotte Active</span>
                <Tractor className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 mt-1">48 Engins</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Tracteurs, drones & moissonneuses</p>
            </div>

            <div className="bg-stone-900/80 backdrop-blur-md rounded-2xl p-3.5 border border-stone-800/80 shadow-sm hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold uppercase tracking-wider">
                <span>Délai Terrain</span>
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-1">24h - 48h</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Intervention bord-champ garantie</p>
            </div>

            <div className="bg-stone-900/80 backdrop-blur-md rounded-2xl p-3.5 border border-stone-800/80 shadow-sm hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold uppercase tracking-wider">
                <span>Inclusion USSD</span>
                <Smartphone className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1">*384*226#</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Accessible sans connexion internet</p>
            </div>

            <div className="bg-stone-900/80 backdrop-blur-md rounded-2xl p-3.5 border border-stone-800/80 shadow-sm hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold uppercase tracking-wider">
                <span>Séquestre Garanti</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-1">100%</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Paiement libéré après votre audit</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
          <TabsList className="bg-muted/60 p-1 rounded-2xl h-auto gap-1">
            <TabsTrigger value="hub" className="rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Tractor className="h-4 w-4 text-emerald-600" />
              Hub Matériel & Machines
            </TabsTrigger>
            <TabsTrigger value="chantiers" className="rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm relative">
              <Clock className="h-4 w-4 text-blue-600" />
              Mes Chantiers
              {jobs.filter((j) => j.jobStatus !== "termine").length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-600 text-white font-bold">
                  {jobs.filter((j) => j.jobStatus !== "termine").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="prive" className="rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Wrench className="h-4 w-4 text-amber-600" />
              Mon Parc Privé ({equipment.length})
            </TabsTrigger>
            <TabsTrigger value="ussd" className="rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Smartphone className="h-4 w-4 text-purple-600" />
              Inclusion USSD & Agents
            </TabsTrigger>
          </TabsList>

          {activeTab === "prive" && (
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setOpenModal(true);
              }}
              className="gap-1.5 rounded-xl text-xs h-9"
            >
              <Plus className="h-4 w-4" />
              Ajouter un équipement
            </Button>
          )}
        </div>

        {/* TAB 1: HUB MATERIEL */}
        <TabsContent value="hub" className="space-y-6 focus-visible:outline-none">
          {/* Instant Estimator Card */}
          <MechanizationEstimatorCard
            userParcels={parcels}
            onBookNow={(est) => {
              setSelectedBookingData({
                service: est.service,
                areaHa: est.areaHa,
                totalCost: est.totalCost,
                depositAmount: est.depositAmount,
              });
              setBookingModalOpen(true);
            }}
          />

          {/* Vetted Machinery Catalog */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Catalogue de Matériel & Partenaires Agréés NAFA - AGRITECH
                </h3>
                <p className="text-xs text-muted-foreground">
                  Engins géolocalisés avec opérateurs qualifiés et carburant inclus
                </p>
              </div>

              {/* Category selector & search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Filtrer par modèle ou ville..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs w-48 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: "all", label: "Tous les engins", icon: Layers },
                { id: "tracteur", label: "Tracteurs 4WD", icon: Tractor },
                { id: "drone", label: "Drones Agricoles", icon: Zap },
                { id: "moissonneuse", label: "Moissonneuses", icon: Wheat },
                { id: "motoculteur", label: "Motoculteurs", icon: Sprout },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <Button
                    key={c.id}
                    variant={categoryFilter === c.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(c.id)}
                    className="h-8 text-xs rounded-xl px-3 whitespace-nowrap gap-1.5"
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    <span>{c.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Machines Grid - Catalogue NAFA - AGRITECH */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMachines.map((machine) => (
                <Card
                  key={machine.id}
                  className="rounded-2xl border-stone-200 dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden bg-card group"
                >
                  {/* Equipment Photography Banner */}
                  <div className="relative h-44 w-full bg-stone-900 overflow-hidden">
                    <img
                      src={machine.imageUrl || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80"}
                      alt={machine.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <Badge
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border shadow-md ${
                          machine.status === "disponible"
                            ? "bg-emerald-500 text-stone-950 border-emerald-400 font-bold"
                            : "bg-amber-500 text-stone-950 border-amber-400 font-bold"
                        }`}
                      >
                        {machine.status === "disponible" ? "● DISPONIBLE" : "○ EN MISSION"}
                      </Badge>
                      <div className="flex items-center text-xs text-amber-300 font-bold bg-stone-900/80 backdrop-blur px-2.5 py-1 rounded-md border border-stone-700/60">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 mr-1" />
                        {machine.rating} <span className="text-stone-400 text-[10px] ml-1">({machine.completedJobs} chantiers)</span>
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-[11px] text-amber-400 font-mono font-bold tracking-wider uppercase">
                        {machine.brandModel} {machine.powerHp ? `• ${machine.powerHp} CV` : ""}
                      </p>
                      <h3 className="text-base font-black truncate drop-shadow-sm text-white">
                        {machine.title}
                      </h3>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          {machine.location}
                        </span>
                        <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-semibold">
                          {machine.region}
                        </span>
                      </div>

                      {/* Technical Specs Strip */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-stone-100 dark:bg-stone-900/70 border border-stone-200/80 dark:border-stone-800 text-xs">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Rendement estimé</p>
                          <p className="font-mono font-bold text-foreground mt-0.5">~{machine.dailyCapacityHa} ha / jour</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Compteur Horamètre</p>
                          <p className="font-mono font-bold text-foreground mt-0.5">{machine.engineHours || 800} heures</p>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Coopérative :</span>
                          <span className="font-semibold text-foreground truncate max-w-[190px]">{machine.verifiedPartner}</span>
                        </div>
                      </div>

                      {/* Implements tag list */}
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Équipements & Outils inclus</p>
                        <div className="flex flex-wrap gap-1">
                          {machine.implementsIncluded.map((imp) => (
                            <span
                              key={imp}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-900 dark:text-amber-200 font-medium border border-amber-500/20"
                            >
                              {imp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between gap-2 mt-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tarif Clé en Main</p>
                        <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {machine.pricePerHa.toLocaleString()}{" "}
                          <span className="text-xs font-semibold text-muted-foreground">F/ha</span>
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedBookingData({
                            machine,
                            areaHa: 3.0,
                            totalCost: machine.pricePerHa * 3.0,
                            depositAmount: Math.round(machine.pricePerHa * 3.0 * 0.3),
                          });
                          setBookingModalOpen(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs rounded-xl h-9 px-4 gap-1.5 shadow-md hover:shadow-lg transition-all"
                      >
                        <Zap className="h-3.5 w-3.5 fill-stone-950" />
                        Réserver
                        <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: LIVE CHANTIERS TRACKER */}
        <TabsContent value="chantiers" className="space-y-4 focus-visible:outline-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Missions & Chantiers de Mécanisation Commandés
              </h3>
              <p className="text-xs text-muted-foreground">
                Suivi de l'avancement, coordonnées du conducteur et gestion du séquestre
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {jobs.map((job) => {
              const statusStep =
                job.jobStatus === "demande_recue"
                  ? 1
                  : job.jobStatus === "operateur_en_route"
                  ? 2
                  : job.jobStatus === "travail_en_cours"
                  ? 3
                  : job.jobStatus === "controle_qualite"
                  ? 4
                  : 5;

              return (
                <Card key={job.id} className="rounded-2xl border-border/70 overflow-hidden shadow-sm bg-card">
                  <CardHeader className="p-4 sm:p-5 pb-3 bg-muted/20 border-b">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                          <Tractor className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">{job.id}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="font-bold text-sm text-foreground">{job.serviceType}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{job.parcelName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${
                            job.jobStatus === "termine"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                              : "bg-blue-500/10 text-blue-700 border-blue-500/30 animate-pulse"
                          }`}
                        >
                          {job.jobStatus === "demande_recue" && "Demande Enregistrée"}
                          {job.jobStatus === "operateur_en_route" && "Conducteur en transit vers la parcelle"}
                          {job.jobStatus === "travail_en_cours" && "Labour / Récolte en cours"}
                          {job.jobStatus === "controle_qualite" && "Contrôle qualité Agent Terrain"}
                          {job.jobStatus === "termine" && "Chantier Réceptionné & Terminé"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-5">
                    {/* Visual Progress Steps */}
                    <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-semibold">
                      {[
                        { num: 1, label: "Enregistré" },
                        { num: 2, label: "En transit" },
                        { num: 3, label: "Chantier en cours" },
                        { num: 4, label: "Audit Terrain" },
                        { num: 5, label: "Clôturé" },
                      ].map((st) => {
                        const isDone = st.num <= statusStep;
                        const isCurrent = st.num === statusStep;
                        return (
                          <div key={st.num} className="space-y-1">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                isDone ? "bg-emerald-600" : "bg-muted"
                              }`}
                            />
                            <span
                              className={`block truncate ${
                                isCurrent
                                  ? "text-primary font-bold"
                                  : isDone
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/30 border text-xs">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Conducteur & Machine
                        </p>
                        <p className="font-bold text-foreground mt-0.5">{job.operatorName}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{job.machineName}</p>
                        <a
                          href={`tel:${job.operatorPhone}`}
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold mt-1"
                        >
                          <Phone className="h-3 w-3" /> {job.operatorPhone}
                        </a>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Agent Terrain Superviseur
                        </p>
                        <p className="font-bold text-foreground mt-0.5">{job.fieldAgentName}</p>
                        <p className="text-[11px] text-muted-foreground">Audit de profondeur & horamètre</p>
                        <a
                          href={`tel:${job.fieldAgentPhone}`}
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold mt-1"
                        >
                          <Phone className="h-3 w-3" /> {job.fieldAgentPhone}
                        </a>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Finances & Séquestre
                        </p>
                        <p className="text-sm font-black font-mono text-emerald-600 mt-0.5">
                          {job.totalCost.toLocaleString()} FCFA
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Acompte : {job.depositAmount.toLocaleString()} FCFA (
                          {job.escrowStatus === "acompte_bloque" ? "Séquestre bloqué" : "Fonds débloqués"})
                        </p>
                        <Badge variant="outline" className="text-[9px] mt-1 bg-background uppercase">
                          Via {job.paymentMethod.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    {job.notes && (
                      <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-xl flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span><strong>Consignes :</strong> {job.notes}</span>
                      </p>
                    )}

                    {/* Actions footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {job.scheduledDate}
                      </span>

                      {job.jobStatus !== "termine" ? (
                        <Button
                          size="sm"
                          onClick={() => handleValidateJob(job.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-2 shadow-md hover:shadow-lg transition-all"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Valider la fin des travaux & Débloquer le paiement
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                          <CheckCircle2 className="h-4 w-4" />
                          Chantier clôturé & Fonds transférés au prestataire
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 3: PRIVATE EQUIPMENT & MAINTENANCE */}
        <TabsContent value="prive" className="space-y-4 focus-visible:outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-2xl border">
            <div>
              <h3 className="font-bold text-base text-foreground">Gestion de Votre Parc Matériel Interne</h3>
              <p className="text-xs text-muted-foreground">
                Gérez vos propres outils, tracteurs et pompes d'irrigation. Vous pouvez également les rentabiliser en les louant sur le Hub Matériel NAFA - AGRITECH !
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setOpenModal(true);
              }}
              className="rounded-xl text-xs gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Nouveau Matériel
            </Button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Chargement des équipements...</div>
          ) : equipment.length === 0 ? (
            <Card className="rounded-2xl border-dashed p-8 text-center space-y-3">
              <Wrench className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
              <p className="text-sm font-semibold text-foreground">Aucun équipement privé enregistré</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Ajoutez vos machines, tracteurs ou outils pour suivre leurs coûts d'amortissement et leur carnet d'entretien.
              </p>
              <Button size="sm" onClick={() => setOpenModal(true)} className="rounded-xl text-xs">
                Ajouter un premier équipement
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map((item: any) => (
                <Card key={item.id} className="rounded-2xl border-border/70 hover:shadow-warm transition-all bg-card flex flex-col justify-between">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className={`text-[10px] font-semibold ${statusColors[item.status] || "bg-muted text-foreground"}`}>
                        {statusLabels[item.status] || item.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                        {typeLabels[item.type] || item.type}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground mt-1">{item.name}</CardTitle>
                    {item.farms?.name && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        Exploitation : {item.farms.name}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-3">
                    <div className="p-2.5 rounded-xl bg-muted/40 text-xs space-y-1 border">
                      {item.purchase_cost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valeur d'achat :</span>
                          <span className="font-mono font-bold">{Number(item.purchase_cost).toLocaleString()} FCFA</span>
                        </div>
                      )}
                      {item.purchase_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mise en service :</span>
                          <span className="font-mono">{new Date(item.purchase_date).toLocaleDateString("fr-FR")}</span>
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-muted-foreground italic pt-1 border-t mt-1">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* NAFA - AGRITECH monetization button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast.info(
                          `Votre ${item.name} a été proposé aux agents de terrain pour intégration au pool de location inter-paysans.`
                        )
                      }
                      className="w-full text-[11px] h-7 rounded-xl border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1"
                    >
                      <Share2 className="h-3 w-3 text-emerald-600" />
                      Rentabiliser sur le Hub Matériel
                    </Button>

                    <div className="flex items-center justify-end gap-1 pt-2 border-t">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => {
                          setEditing(item);
                          setForm({
                            farm_id: item.farm_id || "",
                            name: item.name,
                            type: item.type || "machine",
                            status: item.status || "disponible",
                            purchase_date: item.purchase_date || "",
                            purchase_cost: String(item.purchase_cost || ""),
                            notes: item.notes || "",
                          });
                          setOpenModal(true);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                        onClick={async () => {
                          if (confirm("Supprimer cet équipement ?")) {
                            await deleteRow(item.id);
                            toast.success("Équipement supprimé");
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: USSD OFFLINE SIMULATOR & FIELD AGENTS */}
        <TabsContent value="ussd" className="space-y-4 focus-visible:outline-none">
          <MechanizationUssdSimulator />
        </TabsContent>
      </Tabs>

      {/* Booking Modal for Mechanization Hub */}
      <MechanizationBookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        initialData={selectedBookingData}
        onJobCreated={handleCreateJob}
        userParcels={parcels}
      />

      {/* Private Equipment Modal (Existing feature preservation) */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editing ? "Modifier l'équipement privé" : "Ajouter un équipement privé"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePrivateEquipmentSubmit} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Nom du matériel *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Tracteur Massey Ferguson 240, Charrue 3 disques..."
                className="text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Catégorie *</Label>
                <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, label]) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Statut opérationnel *</Label>
                <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, label]) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {farms.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Exploitation associée</Label>
                <Select value={form.farm_id} onValueChange={(val) => setForm({ ...form, farm_id: val })}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Choisir une exploitation..." />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Coût d'achat (FCFA)</Label>
                <Input
                  type="number"
                  value={form.purchase_cost}
                  onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                  placeholder="0"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Date d'acquisition</Label>
                <Input
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes / Caractéristiques techniques</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ex: Horamètre 1 200h, révision vidange à faire à 1 500h"
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenModal(false)} className="text-xs">
                Annuler
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                {editing ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default EquipmentPage;
