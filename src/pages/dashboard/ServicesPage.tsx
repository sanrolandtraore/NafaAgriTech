import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { partnerStorage, PartnerOffer, QuoteRequest } from "@/lib/partnerStorage";
import { ProductMediaViewer } from "@/components/partner/ProductMediaViewer";
import { CropDiagnosisTool } from "@/components/expert/CropDiagnosisTool";
import {
  Plus, Microscope, Bug, Droplets, Tractor, Fish, Egg,
  ClipboardList, MapPin, GraduationCap, Trash2, Clock, CheckCircle, XCircle, Loader2,
  Wheat, Leaf, TreePine, Shield, Beef, Utensils, Heart, Baby, Waves, Mountain, Sun, Home,
  FileSearch, FileText, Award, Warehouse, Factory, ShoppingBag, QrCode, Users, Salad, Sparkles, Eye, Calculator,
  Store, Send, Search, ExternalLink, ShieldCheck, ShoppingCart, RefreshCw, Phone, Filter,
  FlaskConical, Sprout, Wrench, Calendar, ShieldAlert, LayoutDashboard, Package
} from "lucide-react";

const SERVICE_CATEGORIES = [
  {
    category: "Diagnostic IA & Conseil Scientifique",
    services: [
      { value: "diagnostic_ia", label: "Diagnostic IA (Maladie & Ravageur)", icon: Microscope, desc: "Photo de feuille ou tige analysée par vision IA avec détection de carences et recommandations." },
      { value: "ordonnance_agronomique", label: "Ordonnance phytosanitaire signée", icon: FileText, desc: "Prescription agronomique officielle délivrée par un conseiller certifié." },
      { value: "scouting_geolocalise", label: "Scouting terrain géolocalisé", icon: Eye, desc: "Audit et relevé d'observations terrain avec coordonnées GPS, intensité d'attaque et rapport." },
      { value: "calcul_agronomique", label: "Calculatrice & Plan de doses", icon: Calculator, desc: "Calcul de densité de semis, fractionnement NPK et besoins en eau selon la parcelle." },
    ],
  },
  {
    category: "Productions Végétales & Sols",
    services: [
      { value: "diagnostic_sol", label: "Diagnostic sol et aménagement", icon: Microscope, desc: "Analyse de la qualité du sol, recommandations d'amendement et plan d'aménagement." },
      { value: "diagnostic_maladie", label: "Diagnostic maladie et traitement", icon: Bug, desc: "Identification des maladies et ravageurs, prescription de traitements adaptés." },
      { value: "lutte_biologique", label: "Lutte biologique intégrée", icon: Bug, desc: "Utilisation d'auxiliaires naturels et méthodes biologiques pour la protection des cultures." },
      { value: "semences", label: "Sélection et certification semences", icon: Wheat, desc: "Conseil sur le choix variétal, semences améliorées et certification." },
      { value: "fertilisation", label: "Plan de fertilisation NPK/Urée", icon: Wheat, desc: "Plans de fertilisation organique et minérale adaptés à vos sols et cultures." },
      { value: "compostage", label: "Compostage et fumure organique", icon: Leaf, desc: "Techniques de compostage enrichi et valorisation des résidus agricoles." },
      { value: "maraichage", label: "Maraîchage et cultures horticoles", icon: Salad, desc: "Planification, rotations et itinéraires techniques en maraîchage intensif." },
      { value: "culture_bio", label: "Agriculture biologique & Agroécologie", icon: Leaf, desc: "Conversion et conduite biologique, cahier des charges et bonnes pratiques." },
      { value: "protection_cultures", label: "Protection phytosanitaire", icon: Shield, desc: "Traitements préventifs et curatifs, gestion intégrée des ravageurs." },
    ],
  },
  {
    category: "Productions Animales & Santé",
    services: [
      { value: "ferme_volaille", label: "Aviculture et fermes volailles", icon: Egg, desc: "Bâtiment d'élevage, souches adaptées, plan prophylactique et alimentation." },
      { value: "elevage_bovin", label: "Élevage bovin & embouche", icon: Beef, desc: "Conduite d'élevage bovin : alimentation, santé et amélioration génétique." },
      { value: "elevage_caprin", label: "Élevage caprin et ovin", icon: Beef, desc: "Accompagnement pour l'élevage de petits ruminants (lait et viande)." },
      { value: "nutrition_animale", label: "Nutrition & Provendes", icon: Utensils, desc: "Formulation de rations équilibrées et gestion des stocks fourragers." },
      { value: "sante_animale", label: "Santé animale & Vaccins", icon: Heart, desc: "Plans de vaccination, déparasitage et biosécurité du cheptel." },
      { value: "insemination", label: "Insémination artificielle", icon: Baby, desc: "Amélioration génétique et insémination par inséminateur agréé." },
      { value: "etang_piscicole", label: "Pisciculture & Aquaculture", icon: Fish, desc: "Aménagement d'étangs, alevinage et alimentation des poissons." },
      { value: "apiculture", label: "Apiculture moderne", icon: Bug, desc: "Installation de ruchers kényans, récolte et conditionnement du miel." },
    ],
  },
  {
    category: "Machinisme & Travaux Mécanisés",
    services: [
      { value: "ferme_agricole", label: "Mise en valeur d'exploitation", icon: Tractor, desc: "Choix du site, préparation mécanique du sol, plan cultural et calendrier." },
      { value: "irrigation", label: "Systèmes d'irrigation", icon: Droplets, desc: "Goutte-à-goutte, aspersion, pompage solaire et réseau d'adduction." },
      { value: "forage", label: "Forage et adduction d'eau", icon: Droplets, desc: "Forage de puits pastoraux et stockage d'eau pour l'exploitation." },
      { value: "amenagement_bas_fonds", label: "Aménagement de bas-fonds", icon: Waves, desc: "Travaux topographiques et diguettes pour la riziculture." },
      { value: "mecanisation", label: "Labour mécanisé & Moisson", icon: Tractor, desc: "Prestation de tracteur avec chauffeur, labours profonds et battage." },
      { value: "energie_solaire", label: "Énergie solaire agricole", icon: Sun, desc: "Pompage solaire immergé et séchage des récoltes." },
    ],
  },
];

const SERVICE_TYPES = SERVICE_CATEGORIES.flatMap((c) => c.services);

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  en_attente: { label: "En attente", variant: "secondary", icon: Clock },
  acceptee: { label: "Validé par l'expert", variant: "default", icon: CheckCircle },
  en_cours: { label: "En intervention", variant: "default", icon: Loader2 },
  terminee: { label: "Terminé", variant: "outline", icon: CheckCircle },
  annulee: { label: "Annulé", variant: "destructive", icon: XCircle },
};

const quoteStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  en_attente: { label: "Demande transmise", variant: "secondary", icon: Clock },
  acceptee: { label: "Offre acceptée", variant: "default", icon: CheckCircle },
  refusee: { label: "Annulé / Indisponible", variant: "destructive", icon: XCircle },
  cloturee: { label: "Commande clôturée", variant: "outline", icon: CheckCircle },
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

const FILTER_PILLS = [
  { value: "all", label: "Toutes les offres", icon: Store },
  { value: "intrants", label: "Intrants & Engrais", icon: FlaskConical },
  { value: "semences", label: "Semences Certifiées", icon: Sprout },
  { value: "materiel", label: "Matériel & Tracteurs", icon: Tractor },
  { value: "elevage", label: "Élevage & Nutrition", icon: Beef },
  { value: "service", label: "Prestations & Travaux", icon: Wrench },
  { value: "conseil_technique", label: "Ingénierie & Conseil", icon: Microscope },
  { value: "mes_demandes", label: "Mes Demandes en Cours", icon: ClipboardList },
];

export default function ServicesPage() {
  const { user, profile, primaryRole, partnerType } = useAuth();
  const isPartner = !!user && (primaryRole === "partenaire" || primaryRole === "agent_technique" || primaryRole === "expert" || primaryRole === "formation" || (partnerType != null && partnerType !== ""));
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [partnerQuotes, setPartnerQuotes] = useState<QuoteRequest[]>([]);
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [aiDiagnosisOpen, setAiDiagnosisOpen] = useState(false);

  const [form, setForm] = useState({
    service_type: "",
    description: "",
    location: "",
    farm_id: "",
    preferred_date: "",
    phone: "",
  });

  // Partner Offers State
  const [partnerOffers, setPartnerOffers] = useState<PartnerOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [offerSearch, setOfferSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Quote Request State
  const [quoteOffer, setQuoteOffer] = useState<PartnerOffer | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    requester_name: "",
    contact_phone: "",
    quantity: "1",
    needed_by: "",
    location: "",
    message: "",
  });

  const localRequestsKey = `nafa_local_service_requests_${user?.id || "demo"}`;

  const fetchAll = async () => {
    try {
      const rawLocal = localStorage.getItem(localRequestsKey);
      const localReqs: ServiceRequest[] = rawLocal ? JSON.parse(rawLocal) : [];

      let remoteReqs: ServiceRequest[] = [];
      let remoteFarms: any[] = [];

      if (user) {
        try {
          const [rRes, fRes] = await Promise.all([
            supabase.from("service_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
            supabase.from("farms").select("id, name"),
          ]);
          remoteReqs = (rRes.data as ServiceRequest[]) || [];
          remoteFarms = fRes.data || [];
        } catch (sbErr) {
          console.warn("Service requests fallback:", sbErr);
        }
      }

      const mergedMap = new Map<string, ServiceRequest>();
      remoteReqs.forEach((r) => mergedMap.set(r.id, r));
      localReqs.forEach((r) => {
        if (!mergedMap.has(r.id)) mergedMap.set(r.id, r);
      });
      const finalRequests = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRequests(finalRequests);
      setFarms(remoteFarms);

      const [loadedOffers, quotes] = await Promise.all([
        partnerStorage.getOffers(),
        partnerStorage.getQuotes(user?.id),
      ]);
      setPartnerOffers(loadedOffers);
      setPartnerQuotes(quotes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const handleUpdate = () => fetchAll();
    window.addEventListener("nafa-partner-data-updated", handleUpdate);
    return () => window.removeEventListener("nafa-partner-data-updated", handleUpdate);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service_type) {
      toast.error("Veuillez sélectionner un type de service");
      return;
    }

    const newReq: ServiceRequest = {
      id: `local-req-${Date.now()}`,
      service_type: form.service_type,
      description: form.description || null,
      location: form.location || null,
      farm_id: form.farm_id || null,
      preferred_date: form.preferred_date || null,
      phone: form.phone || null,
      status: "en_attente",
      expert_notes: null,
      estimated_cost: null,
      created_at: new Date().toISOString(),
    };

    if (user) {
      try {
        const { data, error } = await supabase.from("service_requests").insert([{
          user_id: user.id,
          service_type: form.service_type,
          description: form.description || null,
          location: form.location || null,
          farm_id: form.farm_id || null,
          preferred_date: form.preferred_date || null,
          phone: form.phone || null,
          status: "en_attente",
        }]).select();
        if (data && data[0]) {
          newReq.id = data[0].id;
        }
      } catch (err) {
        console.warn("Insert fallback local:", err);
      }
    }

    const rawLocal = localStorage.getItem(localRequestsKey);
    const existing: ServiceRequest[] = rawLocal ? JSON.parse(rawLocal) : [];
    existing.unshift(newReq);
    localStorage.setItem(localRequestsKey, JSON.stringify(existing));

    setRequests((prev) => [newReq, ...prev.filter((r) => r.id !== newReq.id)]);
    toast.success("Demande d'intervention transmise avec succès !");
    setForm({ service_type: "", description: "", location: "", farm_id: "", preferred_date: "", phone: "" });
    setOpen(false);
    setActiveFilter("mes_demandes");
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler cette demande ?")) return;
    if (user) {
      await supabase.from("service_requests").update({ status: "annulee" }).eq("id", id);
    }
    const rawLocal = localStorage.getItem(localRequestsKey);
    if (rawLocal) {
      const existing: ServiceRequest[] = JSON.parse(rawLocal);
      const updated = existing.map((r) => (r.id === id ? { ...r, status: "annulee" } : r));
      localStorage.setItem(localRequestsKey, JSON.stringify(updated));
    }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "annulee" } : r)));
    toast.success("Demande annulée");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette demande ?")) return;
    if (user) {
      await supabase.from("service_requests").delete().eq("id", id);
    }
    const rawLocal = localStorage.getItem(localRequestsKey);
    if (rawLocal) {
      const existing: ServiceRequest[] = JSON.parse(rawLocal);
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(localRequestsKey, JSON.stringify(updated));
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success("Demande supprimée");
  };

  const handleOpenQuote = (offer: PartnerOffer) => {
    setQuoteOffer(offer);
    setQuoteForm({
      requester_name: profile?.full_name || "",
      contact_phone: profile?.phone || "",
      quantity: "1",
      needed_by: "",
      location: "",
      message: `Bonjour, je suis exploitant agricole et intéressé par votre offre « ${offer.title} ». Merci de m'indiquer vos conditions et disponibilités.`,
    });
    setQuoteOpen(true);
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteOffer) return;
    if (!quoteForm.contact_phone.trim()) {
      toast.error("Veuillez renseigner votre numéro de téléphone pour être recontacté.");
      return;
    }

    setQuoteSending(true);
    try {
      const fullMessage = [
        quoteForm.message.trim(),
        quoteForm.location ? `Lieu : ${quoteForm.location}` : null,
      ].filter(Boolean).join("\n\n");

      await partnerStorage.saveQuote({
        offer_id: quoteOffer.id,
        offer_title: quoteOffer.title,
        owner_id: quoteOffer.owner_id,
        partner_name: quoteOffer.partner_name,
        requester_id: user?.id || "demo-farmer",
        requester_name: quoteForm.requester_name.trim() || profile?.full_name || "Exploitant Agricole",
        contact_phone: quoteForm.contact_phone.trim(),
        quantity: quoteForm.quantity.trim() || null,
        needed_by: quoteForm.needed_by || null,
        message: fullMessage || null,
        status: "en_attente",
      });

      toast.success(`Votre commande a été envoyée à ${quoteOffer.partner_name} !`);
      setQuoteOpen(false);
      window.dispatchEvent(new CustomEvent("nafa-partner-data-updated"));
      fetchAll();
      setActiveFilter("mes_demandes");
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue lors de l'envoi de la commande.");
    } finally {
      setQuoteSending(false);
    }
  };

  const handleCancelQuote = async (id: string) => {
    if (!confirm("Annuler cette demande de devis ?")) return;
    await partnerStorage.updateQuoteStatus(id, "refusee", "Demande annulée par l'agriculteur.");
    toast.success("Demande annulée.");
    window.dispatchEvent(new CustomEvent("nafa-partner-data-updated"));
    fetchAll();
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm("Supprimer cette demande de votre historique ?")) return;
    await partnerStorage.deleteQuote(id);
    toast.success("Demande supprimée.");
    window.dispatchEvent(new CustomEvent("nafa-partner-data-updated"));
    fetchAll();
  };

  const getServiceLabel = (type: string) => SERVICE_TYPES.find((s) => s.value === type)?.label || type;

  // Filtrage direct des offres
  const filteredOffers = useMemo(() => {
    return partnerOffers.filter((o) => {
      const matchCat =
        activeFilter === "all" ||
        activeFilter === "mes_demandes" ||
        activeFilter === "conseil_technique" ||
        o.category === activeFilter;

      const q = offerSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        o.title.toLowerCase().includes(q) ||
        (o.description || "").toLowerCase().includes(q) ||
        (o.location_name || "").toLowerCase().includes(q) ||
        o.partner_name.toLowerCase().includes(q);
      return matchCat && matchQuery && o.is_active;
    });
  }, [partnerOffers, activeFilter, offerSearch]);

  const totalMyRequests = partnerQuotes.length + requests.length;

  if (isPartner) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-foreground">
            Accès Réservé aux Agriculteurs & Éleveurs
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
            La vitrine d'approvisionnement et de services est exclusivement réservée aux exploitants agricoles et éleveurs pour commander des intrants et solliciter des prestations.
          </p>
          <div className="p-4 rounded-xl bg-card border border-border/70 text-left text-xs text-muted-foreground space-y-2 mt-4">
            <p className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
              <Store className="h-4 w-4 text-emerald-600" />
              Espace Personnel Partenaire Dédié :
            </p>
            <p className="leading-relaxed">
              En tant que partenaire, vous disposez exclusivement de votre <strong>Espace Personnel</strong> et de votre <strong>Tableau de Bord</strong> pour publier, modifier et gérer vos services et produits, consulter les devis reçus et suivre vos commandes.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm h-11 px-5 rounded-xl font-semibold shadow-xs">
            <Link to="/dashboard/partner-space?tab=services">
              <Package className="h-4 w-4 mr-2" /> Gérer mes Services & Produits
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto text-sm h-11 px-5 rounded-xl">
            <Link to="/dashboard/partner-space?tab=dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" /> Mon Tableau de Bord Partenaire
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Top Banner Premium & Lisible */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/25 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider">
            <Store className="h-4 w-4" />
            Boutique & Services Partenaires Agréés
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-foreground tracking-tight">
            Services & Approvisionnement Agricole
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Commandez vos semences certifiées, engrais NPK/Urée, locations d'engins mécanisés (tracteurs, batteuses) et sollicitez un accompagnement agronomique officiel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            onClick={() => setAiDiagnosisOpen(true)}
            className="h-12 px-5 gradient-primary text-primary-foreground text-sm font-bold rounded-2xl shadow-primary gap-2"
          >
            <Microscope className="h-5 w-5" /> Diagnostic IA Immédiat
          </Button>

          <Button
            onClick={() => setActiveFilter("mes_demandes")}
            variant={activeFilter === "mes_demandes" ? "default" : "outline"}
            className="h-12 px-5 text-sm font-bold rounded-2xl gap-2 shadow-xs"
          >
            <ClipboardList className="h-4 w-4" />
            Mes Demandes
            {totalMyRequests > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-primary text-primary-foreground font-bold">
                {totalMyRequests}
              </span>
            )}
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 px-5 text-foreground text-sm font-bold rounded-2xl gap-2 shadow-xs">
                <Plus className="h-5 w-5 text-primary" /> Demander un service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl font-bold">Demander une prestation technique</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Sélectionnez la prestation requise pour votre parcelle ou élevage.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                <div className="space-y-4">
                  <Label className="font-bold text-sm text-foreground">Type de service requis *</Label>
                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                    {SERVICE_CATEGORIES.map(({ category, services }) => (
                      <div key={category} className="space-y-2">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">{category}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {services.map(({ value, label, icon: Icon, desc }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, service_type: value }))}
                              className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition-all ${
                                form.service_type === value
                                  ? "border-primary bg-primary/10 shadow-xs"
                                  : "border-border hover:border-primary/40 hover:bg-muted/40"
                              }`}
                            >
                              <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${form.service_type === value ? "text-primary" : "text-muted-foreground"}`} />
                              <div>
                                <span className="text-sm font-bold text-foreground block leading-snug">{label}</span>
                                <span className="text-xs text-muted-foreground leading-relaxed block mt-0.5">{desc}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Téléphone de contact *</Label>
                    <Input
                      required
                      placeholder="+226 70 00 00 00"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="h-11 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Localisation ou Village</Label>
                    <Input
                      placeholder="Ex: Commune de Koudougou"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      className="h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Description détaillée de votre besoin</Label>
                  <Textarea
                    rows={3}
                    placeholder="Précisez la superficie, le type de culture ou la situation observée…"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="rounded-xl text-sm leading-relaxed"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" className="w-full h-12 gradient-primary text-primary-foreground font-bold text-base rounded-2xl shadow-primary">
                    Envoyer ma demande d'intervention
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bannière Interactive Diagnostic IA Immédiat */}
      <div className="bg-gradient-to-r from-emerald-500/15 via-primary/10 to-emerald-500/5 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
            <Microscope className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-foreground text-base sm:text-lg">
                Diagnostic Végétal Express par IA & Expertise INERA
              </h3>
              <Badge className="bg-emerald-600 text-white text-[10px] font-bold py-0.5 px-2 rounded-full">
                Opérationnel
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Photographiez vos feuilles, tiges ou ravageurs (chenilles légionnaires, thrips, mildiou, carences NPK) pour obtenir instantanément le diagnostic certifié et les protocoles de traitement biologiques et chimiques homologués CSP.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setAiDiagnosisOpen(true)}
          className="shrink-0 h-12 px-6 gradient-primary text-primary-foreground font-bold rounded-2xl gap-2 shadow-primary text-sm w-full sm:w-auto"
        >
          <Sparkles className="h-4 w-4" /> Diagnostiquer maintenant
        </Button>
      </div>

      {/* Modale Plein Écran Diagnostic IA Immédiat */}
      <Dialog open={aiDiagnosisOpen} onOpenChange={setAiDiagnosisOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2 text-foreground">
              <Microscope className="h-6 w-6 text-primary" />
              Diagnostic IA & Vision Agronomique Ouest-Africaine
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Moteur Scientifique INERA Burkina & Comité Sahélien des Pesticides (CSP-CILSS). Fonctionne en ligne et hors-ligne sur le terrain.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <CropDiagnosisTool />
          </div>
        </DialogContent>
      </Dialog>

      {/* Barre de Recherche et Filtres Directs (Sans barres de navigation secondaires cachées) */}
      <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom d'intrant, semence, tracteur, partenaire ou ville…"
            value={offerSearch}
            onChange={(e) => setOfferSearch(e.target.value)}
            className="pl-12 h-13 text-base rounded-2xl border-border/80 bg-background/50 focus:bg-background"
          />
        </div>

        {/* Pilules de Filtrage Direct */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {FILTER_PILLS.map((pill) => {
            const isSelected = activeFilter === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => setActiveFilter(pill.value)}
                className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm scale-102"
                    : "bg-muted/70 text-foreground/80 hover:bg-muted hover:text-foreground"
                }`}
              >
                {pill.icon && <pill.icon className="h-4 w-4 shrink-0" />}
                <span>{pill.label}</span>
                {pill.value === "mes_demandes" && totalMyRequests > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-xs font-extrabold ${isSelected ? "bg-white text-primary" : "bg-primary text-white"}`}>
                    {totalMyRequests}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* VUE 1 : MES DEMANDES EN COURS (Si sélectionné dans les filtres directs) */}
      {activeFilter === "mes_demandes" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                Suivi de vos demandes et commandes
              </h2>
              <p className="text-sm text-muted-foreground">
                Consultez le statut en temps réel de vos commandes auprès des partenaires agréés.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchAll} className="h-10 text-xs font-semibold rounded-xl gap-2">
              <RefreshCw className="h-4 w-4" /> Actualiser
            </Button>
          </div>

          {/* Commandes auprès des partenaires */}
          <div className="space-y-3">
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" /> Commandes Partenaires ({partnerQuotes.length})
            </h3>
            {partnerQuotes.length === 0 ? (
              <Card className="rounded-2xl border-dashed text-center py-8">
                <CardContent className="space-y-2">
                  <Store className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-base font-semibold">Aucune commande partenaire pour le moment</p>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez un intrant ou un engin dans le catalogue pour transmettre une commande.
                  </p>
                </CardContent>
              </Card>
            ) : (
              partnerQuotes.map((quote) => {
                const st = quoteStatusConfig[quote.status] || quoteStatusConfig.en_attente;
                const StIcon = st.icon;
                return (
                  <Card key={quote.id} className="rounded-2xl border hover:border-primary/40 transition-colors shadow-xs">
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Store className="h-6 w-6" />
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-foreground leading-snug">
                              {quote.offer_title || "Prestation partenaire"}
                            </h4>
                            <Badge variant={st.variant} className="flex items-center gap-1.5 text-xs font-semibold py-0.5 px-2.5 rounded-full">
                              <StIcon className="h-3.5 w-3.5" />
                              {st.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                            <span>Partenaire : <strong className="text-foreground font-semibold">{quote.partner_name}</strong></span>
                            {quote.quantity && <span>Quantité : <strong className="text-foreground">{quote.quantity}</strong></span>}
                            {quote.needed_by && <span>Date souhaitée : <strong>{new Date(quote.needed_by).toLocaleDateString("fr-FR")}</strong></span>}
                          </div>
                          {quote.message && (
                            <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/60">
                              {quote.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {quote.status === "en_attente" && (
                          <Button size="sm" variant="outline" className="text-destructive text-xs h-9 rounded-xl" onClick={() => handleCancelQuote(quote.id)}>
                            <XCircle className="h-4 w-4 mr-1.5" /> Annuler
                          </Button>
                        )}
                        {(quote.status === "refusee" || quote.status === "cloturee") && (
                          <Button size="sm" variant="ghost" className="text-destructive text-xs h-9 rounded-xl" onClick={() => handleDeleteQuote(quote.id)}>
                            <Trash2 className="h-4 w-4 mr-1.5" /> Supprimer
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Demandes d'interventions techniques */}
          <div className="space-y-3 pt-4">
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <Microscope className="h-4 w-4 text-emerald-600" /> Demandes d'Interventions Techniques ({requests.length})
            </h3>
            {requests.length === 0 ? (
              <Card className="rounded-2xl border-dashed text-center py-8">
                <CardContent className="space-y-2">
                  <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-base font-semibold">Aucune demande d'intervention</p>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur « Demander un service » pour planifier un diagnostic ou un chantier.
                  </p>
                </CardContent>
              </Card>
            ) : (
              requests.map((req) => {
                const st = statusConfig[req.status] || statusConfig.en_attente;
                const StIcon = st.icon;
                return (
                  <Card key={req.id} className="rounded-2xl border hover:border-primary/40 transition-colors shadow-xs">
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-foreground">{getServiceLabel(req.service_type)}</h4>
                          <Badge variant={st.variant} className="flex items-center gap-1.5 text-xs font-semibold py-0.5 px-2.5 rounded-full">
                            <StIcon className="h-3.5 w-3.5" /> {st.label}
                          </Badge>
                        </div>
                        {req.description && <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {req.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{req.location}</span>
                            </span>
                          )}
                          {req.preferred_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{new Date(req.preferred_date).toLocaleDateString("fr-FR")}</span>
                            </span>
                          )}
                          {req.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{req.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {req.status === "en_attente" && (
                          <Button size="sm" variant="outline" className="text-destructive text-xs h-9 rounded-xl" onClick={() => handleCancel(req.id)}>
                            <XCircle className="h-4 w-4 mr-1.5" /> Annuler
                          </Button>
                        )}
                        {(req.status === "annulee" || req.status === "terminee") && (
                          <Button size="sm" variant="ghost" className="text-destructive text-xs h-9 rounded-xl" onClick={() => handleDelete(req.id)}>
                            <Trash2 className="h-4 w-4 mr-1.5" /> Supprimer
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      ) : activeFilter === "conseil_technique" ? (
        /* VUE 2 : CATALOGUE TECHNIQUE ET FORMATIONS */
        <div className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
              Prestations agronomiques et d'ingénierie
            </h2>
            <p className="text-sm text-muted-foreground">
              Sélectionnez une prestation pour réserver une intervention d'expert sur vos parcelles.
            </p>
          </div>

          <div className="space-y-8">
            {SERVICE_CATEGORIES.map(({ category, services }) => (
              <div key={category} className="space-y-3">
                <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
                  {category}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map(({ value, label, icon: Icon, desc }) => (
                    <Card
                      key={value}
                      className="card-premium cursor-pointer border-border hover:border-primary/60 transition-all p-5 rounded-2xl"
                      onClick={() => {
                        if (value === "diagnostic_ia") {
                          setAiDiagnosisOpen(true);
                        } else {
                          setForm((f) => ({ ...f, service_type: value }));
                          setOpen(true);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-foreground leading-snug">{label}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VUE 3 : CATALOGUE DES OFFRES PARTENAIRES (AFFICHAGE DIRECT) */
        <div className="space-y-6">
          {loadingOffers ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-96 rounded-3xl" />
              ))}
            </div>
          ) : filteredOffers.length === 0 ? (
            <Card className="rounded-3xl border-dashed text-center py-16 shadow-xs">
              <CardContent className="space-y-3">
                <Store className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-xl font-bold font-heading">Aucune offre trouvée</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Aucun produit ou prestation ne correspond à vos filtres actuels. Modifiez votre recherche ou découvrez d'autres catégories.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl mt-2 font-bold"
                  onClick={() => { setOfferSearch(""); setActiveFilter("all"); }}
                >
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => (
                <Card
                  key={offer.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card hover:shadow-premium hover:-translate-y-1 transition-all duration-300"
                >
                  <div>
                    {/* Media Header */}
                    <div className="relative h-48 bg-muted overflow-hidden">
                      {offer.media && offer.media.length > 0 ? (
                        <div className="h-full w-full">
                          <ProductMediaViewer media={offer.media} title={offer.title} />
                        </div>
                      ) : offer.image_url ? (
                        <img
                          src={offer.image_url}
                          alt={offer.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                          <Store className="h-12 w-12" />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-background/95 text-foreground border border-border/60 backdrop-blur-md text-xs font-bold py-1 px-3 rounded-full shadow-xs">
                        {offer.category.toUpperCase()}
                      </Badge>
                    </div>

                    <CardContent className="p-5 space-y-3">
                      {/* Partenaire Info */}
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                        <Link
                          to={`/partenaire/${offer.owner_id}`}
                          className="hover:text-primary transition-colors flex items-center gap-1.5 truncate max-w-[210px]"
                          title="Voir la vitrine officielle de ce partenaire"
                        >
                          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{offer.partner_name}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                        </Link>
                        {offer.location_name && (
                          <span className="flex items-center gap-1 shrink-0 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {offer.location_name}
                          </span>
                        )}
                      </div>

                      {/* Titre de l'offre */}
                      <h3 className="font-heading font-extrabold text-lg text-foreground leading-snug line-clamp-2">
                        {offer.title}
                      </h3>

                      {/* Description */}
                      {offer.description && (
                        <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                          {offer.description}
                        </p>
                      )}

                      {/* Prix */}
                      {offer.price_indication && (
                        <div className="pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground block font-medium">Tarif indicatif :</span>
                          <span className="text-xl font-heading font-extrabold text-primary">
                            {Number(offer.price_indication).toLocaleString("fr-FR")} F CFA
                            {offer.unit && <span className="text-xs text-muted-foreground font-normal ml-1">/ {offer.unit}</span>}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* Actions directes */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-11 rounded-xl text-xs font-bold border-border hover:bg-muted"
                    >
                      <Link to={`/partenaire/${offer.owner_id}`} target="_blank">
                        <Store className="h-3.5 w-3.5 mr-1 text-primary" /> Vitrine
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenQuote(offer)}
                      className="h-11 rounded-xl text-xs font-bold gradient-primary text-primary-foreground shadow-xs gap-1"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Commander
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Commande & Devis Partenaire */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Commander / Demande de devis
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Votre demande sera transmise en direct au partenaire agréé avec notification.
            </DialogDescription>
          </DialogHeader>

          {quoteOffer && (
            <div className="bg-muted/50 p-4 rounded-2xl border border-border/70 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-background overflow-hidden shrink-0 border border-border">
                {quoteOffer.media && quoteOffer.media.length > 0 ? (
                  <img src={quoteOffer.media[0].url} alt="" className="w-full h-full object-cover" />
                ) : quoteOffer.image_url ? (
                  <img src={quoteOffer.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary"><Store className="h-6 w-6" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">{quoteOffer.title}</p>
                <p className="text-xs text-muted-foreground truncate">Partenaire : {quoteOffer.partner_name}</p>
                {quoteOffer.price_indication && (
                  <p className="text-sm font-extrabold text-primary mt-0.5">
                    {Number(quoteOffer.price_indication).toLocaleString("fr-FR")} F CFA {quoteOffer.unit && `/ ${quoteOffer.unit}`}
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSendQuote} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Votre Nom ou Exploitation *</Label>
                <Input
                  required
                  placeholder="Ex: Coopérative Wend-Panga"
                  value={quoteForm.requester_name}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, requester_name: e.target.value }))}
                  className="h-11 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Téléphone WhatsApp / Appel *</Label>
                <Input
                  required
                  placeholder="+226 70 00 00 00"
                  value={quoteForm.contact_phone}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  className="h-11 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Quantité ou Superficie (ha)</Label>
                <Input
                  placeholder="Ex: 5 sacs, 2 ha, 3 jours…"
                  value={quoteForm.quantity}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="h-11 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Date souhaitée</Label>
                <Input
                  type="date"
                  value={quoteForm.needed_by}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, needed_by: e.target.value }))}
                  className="h-11 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Lieu d'intervention ou de livraison</Label>
              <Input
                placeholder="Ex: Commune de Koudougou, Village de Villy"
                value={quoteForm.location}
                onChange={(e) => setQuoteForm((f) => ({ ...f, location: e.target.value }))}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Précisions pour le partenaire</Label>
              <Textarea
                rows={3}
                placeholder="Indiquez vos besoins particuliers, heure de livraison…"
                value={quoteForm.message}
                onChange={(e) => setQuoteForm((f) => ({ ...f, message: e.target.value }))}
                className="rounded-xl text-sm leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="h-12 rounded-xl text-sm font-semibold" onClick={() => setQuoteOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={quoteSending} className="h-12 gradient-primary text-primary-foreground font-bold text-sm rounded-xl shadow-primary">
                {quoteSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Envoyer ma commande
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
