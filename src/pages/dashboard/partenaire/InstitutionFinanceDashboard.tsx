import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Landmark,
  ShieldCheck,
  Megaphone,
  FileText,
  Plus,
  Phone,
  CheckCircle2,
  Clock,
  Trash2,
  Pencil,
  ExternalLink,
  DollarSign,
  Sparkles,
  Building2,
  BadgeCheck,
  Search,
  Tag,
  AlertCircle,
  HelpCircle,
  Eye,
  Filter,
  Layers,
  Calendar,
  Send,
  MessageCircle,
  TrendingUp,
  Percent,
  Coins,
  Store,
  Users,
  Check,
  X,
} from "lucide-react";
import { partnerStorage, PartnerOffer, QuoteRequest } from "@/lib/partnerStorage";
import { getEffectiveUserId } from "@/lib/deviceIdentity";
import { getStoredPartnerKyc } from "@/lib/partnerKyc";

export default function InstitutionFinanceDashboard() {
  const { user, profile } = useAuth();
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("offres");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Formulaire de Création / Modification Service & Produit Financier
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<PartnerOffer | null>(null);

  const [formOffer, setFormOffer] = useState({
    title: "",
    financeType: "credit", // credit, microfinance, assurance, subvention, pub_marketing
    description: "",
    rate: "6.5% / an",
    minAmount: "100000",
    maxAmount: "10000000",
    duration: "6 à 12 mois",
    targetAudience: "Agriculteurs & Coopératives",
    region: "Toutes les régions",
    phone: "",
    whatsapp: "",
    email: "",
    imageUrl: "",
    marketingBadge: "AGRÉÉ BCEAO / CIMA",
    ctaLabel: "Demander ce financement",
    isActive: true,
  });

  const kyc = useMemo(() => getStoredPartnerKyc(user?.id), [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allOffers = await partnerStorage.getOffers();
      // Filtrer les offres de finance de cet utilisateur ou de démonstration institutionnelle
      const myOffers = allOffers.filter(
        (o) =>
          o.category === "financement" ||
          o.category.includes("banque") ||
          o.category.includes("assurance") ||
          o.category.includes("finance") ||
          (user && o.owner_id === user.id)
      );
      setOffers(myOffers);

      const allQuotes = await partnerStorage.getQuotes();
      setQuotes(allQuotes);
    } catch (e) {
      console.error("Erreur chargement données finance:", e);
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

  // Statistiques KPIs
  const stats = useMemo(() => {
    const credits = offers.filter(
      (o) => (o as any).finance_type === "credit" || o.title.toLowerCase().includes("crédit") || o.title.toLowerCase().includes("prêt")
    );
    const assurances = offers.filter(
      (o) => (o as any).finance_type === "assurance" || o.title.toLowerCase().includes("assurance")
    );
    const pubs = offers.filter(
      (o) => (o as any).finance_type === "pub_marketing" || Boolean((o as any).campaign_badge)
    );
    const pendingQuotes = quotes.filter((q) => q.status === "en_attente");

    return {
      total: offers.length,
      active: offers.filter((o) => o.is_active).length,
      creditsCount: credits.length,
      assurancesCount: assurances.length,
      pubsCount: pubs.length,
      quotesCount: quotes.length,
      pendingQuotesCount: pendingQuotes.length,
    };
  }, [offers, quotes]);

  const openCreateModal = (defaultType = "credit") => {
    setEditingOffer(null);
    setFormOffer({
      title: "",
      financeType: defaultType,
      description: "",
      rate: defaultType === "assurance" ? "4.5% du capital" : "6.5% / an",
      minAmount: defaultType === "microfinance" ? "50000" : "200000",
      maxAmount: defaultType === "microfinance" ? "2000000" : "15000000",
      duration: defaultType === "assurance" ? "Campagne agricole (1 an)" : "6 à 12 mois",
      targetAudience: "Producteurs, Éleveurs et Coopératives",
      region: "Toutes les régions du Burkina Faso",
      phone: profile?.phone || "+226 20 00 00 00",
      whatsapp: profile?.phone || "+226 70 00 00 00",
      email: user?.email || "contact@institution-finance.bf",
      imageUrl: "",
      marketingBadge: defaultType === "pub_marketing" ? "OFFRE SPÉCIALE CAMPAGNE" : "AGRÉÉ CIMA / BCEAO",
      ctaLabel: defaultType === "assurance" ? "Souscrire à cette police" : "Demander ce crédit",
      isActive: true,
    });
    setIsOfferDialogOpen(true);
  };

  const openEditModal = (offer: PartnerOffer) => {
    setEditingOffer(offer);
    const fo = offer as any;
    setFormOffer({
      title: offer.title,
      financeType: fo.finance_type || "credit",
      description: offer.description || "",
      rate: fo.interest_rate || offer.price_indication || "6.5% / an",
      minAmount: String(fo.min_amount || "100000"),
      maxAmount: String(fo.max_amount || "10000000"),
      duration: fo.duration_months || "6 à 12 mois",
      targetAudience: fo.target_audience || "Agriculteurs & Éleveurs",
      region: offer.location_name || "Toutes les régions",
      phone: offer.contact_phone || "",
      whatsapp: offer.contact_phone || "",
      email: offer.contact_email || "",
      imageUrl: offer.image_url || (offer.images && offer.images[0]) || "",
      marketingBadge: fo.campaign_badge || "ACTEUR AGRÉÉ",
      ctaLabel: fo.marketing_cta || "Demander ce financement",
      isActive: offer.is_active,
    });
    setIsOfferDialogOpen(true);
  };

  const handleSaveOffer = async () => {
    if (!formOffer.title.trim()) {
      toast.error("Veuillez donner un titre à votre service ou campagne.");
      return;
    }

    try {
      const ownerId = getEffectiveUserId(user?.id);
      const partnerName = profile?.full_name || "Établissement Financier & Assurance";

      const payload: any = {
        id: editingOffer?.id,
        owner_id: ownerId,
        partner_name: partnerName,
        category: "financement",
        title: formOffer.title.trim(),
        description: formOffer.description.trim() || null,
        price_indication: `${formOffer.rate} (De ${Number(formOffer.minAmount || 0).toLocaleString()} à ${Number(formOffer.maxAmount || 0).toLocaleString()} FCFA)`,
        unit: formOffer.duration,
        location_name: formOffer.region,
        contact_phone: formOffer.phone,
        contact_email: formOffer.email,
        image_url: formOffer.imageUrl || null,
        images: formOffer.imageUrl ? [formOffer.imageUrl] : [],
        is_active: formOffer.isActive,
        finance_type: formOffer.financeType,
        interest_rate: formOffer.rate,
        min_amount: Number(formOffer.minAmount) || 0,
        max_amount: Number(formOffer.maxAmount) || 0,
        duration_months: formOffer.duration,
        target_audience: formOffer.targetAudience,
        campaign_badge: formOffer.marketingBadge,
        is_sponsored: formOffer.financeType === "pub_marketing",
        marketing_cta: formOffer.ctaLabel,
      };

      await partnerStorage.saveOffer(payload);
      toast.success(
        editingOffer
          ? "Offre financière mise à jour avec succès !"
          : "Nouveau service financier publié sur la plateforme !"
      );
      setIsOfferDialogOpen(false);
      loadData();
    } catch (e: any) {
      toast.error("Erreur lors de l'enregistrement de l'offre.");
    }
  };

  const handleToggleActive = async (offer: PartnerOffer) => {
    await partnerStorage.toggleOfferActive(offer.id);
    toast.info(offer.is_active ? "Offre masquée du marketplace" : "Offre publiée en ligne sur le marketplace");
    loadData();
  };

  const handleDeleteOffer = async (id: string) => {
    if (confirm("Confirmer la suppression de cette offre financière ?")) {
      await partnerStorage.deleteOffer(id);
      toast.success("Offre retirée avec succès.");
      loadData();
    }
  };

  const handleUpdateQuoteStatus = async (quoteId: string, newStatus: "acceptee" | "refusee" | "cloturee") => {
    await partnerStorage.updateQuoteStatus(quoteId, newStatus);
    toast.success(`Statut de la demande mis à jour : ${newStatus}`);
    loadData();
  };

  // Filtrage des offres
  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const fo = o as any;
      const matchesSearch =
        !q ||
        o.title.toLowerCase().includes(q) ||
        (o.description || "").toLowerCase().includes(q) ||
        (fo.target_audience || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterType === "all") return true;
      if (filterType === "credit") return fo.finance_type === "credit" || o.title.toLowerCase().includes("crédit") || o.title.toLowerCase().includes("prêt");
      if (filterType === "assurance") return fo.finance_type === "assurance" || o.title.toLowerCase().includes("assurance");
      if (filterType === "pub") return fo.finance_type === "pub_marketing" || Boolean(fo.campaign_badge);
      if (filterType === "subvention") return fo.finance_type === "subvention" || o.title.toLowerCase().includes("subvention") || o.title.toLowerCase().includes("programme");
      return true;
    });
  }, [offers, searchQuery, filterType]);

  // Simulateur de calcul financier pour l'institution
  const [simAmount, setSimAmount] = useState<number>(1000000);
  const [simRate, setSimRate] = useState<number>(6.5);
  const [simMonths, setSimMonths] = useState<number>(9);
  const [simMode, setSimMode] = useState<"in_fine" | "amortissable">("in_fine");

  const simResult = useMemo(() => {
    const totalInterests = (simAmount * (simRate / 100) * simMonths) / 12;
    const totalDue = simAmount + totalInterests;
    const monthlyPayment = simMonths > 0 ? totalDue / simMonths : 0;
    return {
      interests: Math.round(totalInterests),
      totalDue: Math.round(totalDue),
      monthly: Math.round(monthlyPayment),
    };
  }, [simAmount, simRate, simMonths]);

  return (
    <div className="space-y-6 container max-w-7xl mx-auto px-4 py-6 animate-fade-in pb-12">
      {/* Header Institutionnel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Landmark className="h-7 w-7 text-emerald-600" />
              Espace Finance, Crédit & Assurance Agricole
            </h1>
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 text-xs">
              <BadgeCheck className="h-3.5 w-3.5" />
              Établissement Agréé
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Pilotez vos offres de crédit de campagne, polices d'assurance récolte & bétail, subventions et campagnes de marketing financier visibles auprès des producteurs du Burkina Faso.
          </p>
        </div>

        {/* Boutons d'Action Rapide de Création */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => openCreateModal("credit")}
            className="gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Nouveau Crédit
          </Button>
          <Button
            onClick={() => openCreateModal("assurance")}
            variant="outline"
            className="gap-1.5 font-bold border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Nouvelle Assurance
          </Button>
          <Button
            onClick={() => openCreateModal("pub_marketing")}
            variant="outline"
            className="gap-1.5 font-bold border-amber-500/50 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <Megaphone className="h-4 w-4 text-amber-600" />
            Lancer Pub / Promo
          </Button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border shadow-xs bg-card hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Crédits & Financements</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{stats.creditsCount}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Disponibles sur Marketplace</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Coins className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs bg-card hover:border-blue-500/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assurances Agricoles</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{stats.assurancesCount}</h3>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">Polices & Garanties actives</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs bg-card hover:border-amber-500/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campagnes Marketing & Pub</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{stats.pubsCount}</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Bannières sponsorisées en ligne</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Megaphone className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs bg-card hover:border-purple-500/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Demandes Reçues</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{stats.quotesCount}</h3>
              <p className="text-[11px] text-purple-600 font-medium mt-0.5">
                {stats.pendingQuotesCount} en attente de traitement
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation par Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-xl grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="offres" className="gap-2 font-bold text-xs md:text-sm">
            <Coins className="h-4 w-4" />
            Catalogue & Services ({offers.length})
          </TabsTrigger>
          <TabsTrigger value="marketing" className="gap-2 font-bold text-xs md:text-sm">
            <Megaphone className="h-4 w-4" />
            Campagnes Pub & Visuels ({stats.pubsCount})
          </TabsTrigger>
          <TabsTrigger value="demandes" className="gap-2 font-bold text-xs md:text-sm">
            <FileText className="h-4 w-4" />
            Dossiers Clients ({quotes.length})
          </TabsTrigger>
          <TabsTrigger value="simulateur" className="gap-2 font-bold text-xs md:text-sm">
            <TrendingUp className="h-4 w-4" />
            Simulateur Sahélien
          </TabsTrigger>
        </TabsList>

        {/* ═══ ONGLET 1 : CATALOGUE DE FINANCEMENTS & ASSURANCES ═══ */}
        <TabsContent value="offres" className="space-y-4 pt-2">
          {/* Barre de Recherche et Filtres */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit financier, taux, cible..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className="h-8 text-xs font-semibold"
              >
                Tous
              </Button>
              <Button
                variant={filterType === "credit" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("credit")}
                className="h-8 text-xs font-semibold"
              >
                Crédits
              </Button>
              <Button
                variant={filterType === "assurance" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("assurance")}
                className="h-8 text-xs font-semibold"
              >
                Assurances
              </Button>
              <Button
                variant={filterType === "subvention" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("subvention")}
                className="h-8 text-xs font-semibold"
              >
                Subventions
              </Button>
              <Button
                variant={filterType === "pub" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("pub")}
                className="h-8 text-xs font-semibold"
              >
                Publicités
              </Button>
            </div>
          </div>

          {/* Grille des Offres Financières */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Chargement des produits financiers...
            </div>
          ) : filteredOffers.length === 0 ? (
            <Card className="border-dashed border-2 p-8 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <Landmark className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base">Aucun service financier trouvé</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Vous n'avez pas encore publié de service de crédit, d'assurance ou de campagne marketing correspondant à vos critères.
                </p>
              </div>
              <Button onClick={() => openCreateModal("credit")} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Créer une première offre de crédit
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOffers.map((offer) => {
                const fo = offer as any;
                const isCredit = fo.finance_type === "credit" || offer.title.toLowerCase().includes("crédit");
                const isAssurance = fo.finance_type === "assurance" || offer.title.toLowerCase().includes("assurance");
                const isPub = fo.finance_type === "pub_marketing" || Boolean(fo.campaign_badge);

                return (
                  <Card key={offer.id} className="border border-border/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      {/* Image / Visuel si présent */}
                      {offer.image_url && (
                        <div className="h-36 w-full overflow-hidden rounded-t-xl bg-muted relative">
                          <img
                            src={offer.image_url}
                            alt={offer.title}
                            className="h-full w-full object-cover"
                          />
                          {fo.campaign_badge && (
                            <Badge className="absolute top-2 left-2 bg-amber-500 text-black font-extrabold text-[10px] shadow-sm">
                              {fo.campaign_badge}
                            </Badge>
                          )}
                        </div>
                      )}

                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={
                              isCredit
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 text-[10px] font-bold uppercase"
                                : isAssurance
                                ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 text-[10px] font-bold uppercase"
                                : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 text-[10px] font-bold uppercase"
                            }
                          >
                            {isCredit ? "Crédit & Prêt" : isAssurance ? "Assurance Agricole" : isPub ? "Campagne Pub" : "Subvention"}
                          </Badge>

                          <Badge
                            variant={offer.is_active ? "default" : "secondary"}
                            className={offer.is_active ? "bg-emerald-600 text-white text-[10px]" : "text-[10px] text-muted-foreground"}
                          >
                            {offer.is_active ? "En Ligne (Marketplace)" : "Hors Ligne"}
                          </Badge>
                        </div>

                        <CardTitle className="text-base font-bold mt-2 line-clamp-2">
                          {offer.title}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-2 mt-1">
                          {offer.description || "Aucune description détaillée."}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="p-4 pt-1 space-y-2 text-xs">
                        {fo.interest_rate && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                            <span className="font-semibold text-muted-foreground">Taux / Prime :</span>
                            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                              {fo.interest_rate}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
                          <div>
                            <span className="font-semibold block text-foreground">Échéance :</span>
                            <span>{fo.duration_months || offer.unit || "Post-récolte"}</span>
                          </div>
                          <div>
                            <span className="font-semibold block text-foreground">Cible :</span>
                            <span className="truncate block">{fo.target_audience || "Agriculteurs"}</span>
                          </div>
                        </div>

                        {offer.location_name && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <span className="font-semibold text-foreground">Zone :</span> {offer.location_name}
                          </p>
                        )}
                      </CardContent>
                    </div>

                    <div className="p-4 pt-0 border-t flex items-center justify-between gap-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(offer)}
                        className="text-xs h-8 px-2 font-medium"
                      >
                        {offer.is_active ? "Masquer" : "Publier"}
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(offer)}
                          className="h-8 text-xs font-semibold"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ ONGLET 2 : CAMPAGNES PUB & MARKETING FINANCIER ═══ */}
        <TabsContent value="marketing" className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/20">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-600" />
                Campagnes Publicitaires & Affiches Marketing sur le Marketplace
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Diffusez des bannières sponsorisées, offres promotionnelles saisonnières de prêt intrants et assurances pour toucher instantanément les coopératives et agriculteurs.
              </p>
            </div>
            <Button
              onClick={() => openCreateModal("pub_marketing")}
              className="font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Créer une Nouvelle Campagne Pub
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visualisation en direct du rendu Marketplace */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-600" />
                Aperçu en direct (Vue Agriculteur / Marketplace)
              </h3>

              {offers.filter((o) => (o as any).finance_type === "pub_marketing" || (o as any).campaign_badge).length === 0 ? (
                <div className="p-8 border-2 border-dashed rounded-xl text-center text-xs text-muted-foreground">
                  Aucune publicité active pour le moment. Cliquez sur "Créer une Nouvelle Campagne Pub" pour concevoir votre premier visuel sponsorisé.
                </div>
              ) : (
                offers
                  .filter((o) => (o as any).finance_type === "pub_marketing" || (o as any).campaign_badge)
                  .map((pub) => {
                    const fo = pub as any;
                    return (
                      <div
                        key={pub.id}
                        className="rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-emerald-500/5 p-4 space-y-3 shadow-md relative"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className="bg-amber-500 text-black font-extrabold text-[11px] uppercase tracking-wider">
                            {fo.campaign_badge || "SPONSORISÉ"}
                          </Badge>
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            {pub.partner_name}
                          </span>
                        </div>

                        {pub.image_url && (
                          <div className="h-44 w-full rounded-xl overflow-hidden bg-black/10">
                            <img src={pub.image_url} alt={pub.title} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <h4 className="font-extrabold text-base text-foreground">{pub.title}</h4>
                          <p className="text-xs text-muted-foreground">{pub.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t text-xs">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {fo.interest_rate || "Conditions préférentielles"}
                          </span>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8">
                            {fo.marketing_cta || "Demander ce financement"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Conseils Marketing & Réglementation Financière */}
            <div className="space-y-4">
              <Card className="border border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Bonnes Pratiques de Marketing Financier Agricole
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p>
                      <strong>Synchronisation avec le calendrier agricole :</strong> Publiez vos offres de crédit d'intrants 60 jours avant les premières pluies (avril-mai) et vos offres d'assurance avant le semis.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p>
                      <strong>Transparence des taux et garanties :</strong> Indiquez clairement le taux d'intérêt annuel effectif global (TEG) et les facilités de remboursement (in fine après la vente des récoltes).
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p>
                      <strong>Agrément & Confiance :</strong> L'indication de votre agrément (BCEAO pour banques/SFD ou CIMA pour assurances) renforce instantanément le taux de conversion des producteurs.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Raccourci vers Paramètres KYC */}
              <Card className="border border-emerald-500/20 bg-emerald-500/5 shadow-xs">
                <CardContent className="p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-foreground flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    Conformité Réglementaire & Agrément
                  </h4>
                  <p className="text-muted-foreground">
                    Votre statut vérifié permet d'afficher automatiquement le badge officiel certifié sur toutes vos publicités et offres financières.
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full text-xs font-bold mt-2">
                    <Link to="/dashboard/partenaire-kyc">Gérer mes agréments & documents KYC</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ═══ ONGLET 3 : DOSSIERS & DEMANDES DE FINANCEMENT REÇUES ═══ */}
        <TabsContent value="demandes" className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Dossiers de Financement & Souscriptions Reçues ({quotes.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Demandes de crédit, microfinance et souscriptions d'assurance transmises par les producteurs.
              </p>
            </div>
          </div>

          {quotes.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm">Aucune demande reçue pour l'instant</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Dès qu'un agriculteur ou éleveur manifestera son intérêt pour vos offres de crédit ou d'assurance sur le marketplace, ses coordonnées s'afficheront ici.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {quotes.map((q) => (
                <Card key={q.id} className="border border-border/80 shadow-xs p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{q.requester_name || "Exploitant Agricole"}</span>
                      <Badge
                        variant={q.status === "acceptee" ? "default" : q.status === "refusee" ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {q.status === "acceptee" ? "Dossier Validé" : q.status === "refusee" ? "Rejeté" : "En attente"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Produit sollicité :</strong> {q.offer_title || "Demande de financement direct"}
                    </p>
                    {q.message && (
                      <p className="text-xs bg-muted/50 p-2 rounded-lg text-foreground max-w-xl">
                        "{q.message}"
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Date : {new Date(q.created_at).toLocaleDateString("fr-FR")}</span>
                      {q.contact_phone && <span>Tél : <strong>{q.contact_phone}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {q.contact_phone && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      >
                        <a href={`tel:${q.contact_phone}`}>
                          <Phone className="h-3 w-3 mr-1" />
                          Appeler
                        </a>
                      </Button>
                    )}
                    {q.contact_phone && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-bold text-emerald-600 border-emerald-400 hover:bg-emerald-50"
                      >
                        <a
                          href={`https://wa.me/${q.contact_phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="h-3 w-3 mr-1 text-emerald-600" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                    {q.status === "en_attente" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateQuoteStatus(q.id, "acceptee")}
                        className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Accepter
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ ONGLET 4 : SIMULATEUR FINANCIER & CRÉDIT SAHÉLIEN ═══ */}
        <TabsContent value="simulateur" className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Percent className="h-5 w-5 text-emerald-600" />
                  Paramètres de Simulation
                </CardTitle>
                <CardDescription className="text-xs">
                  Modélisez vos offres de prêt adaptées aux cycles de récolte du Burkina Faso.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Montant du Financement (FCFA)</Label>
                  <Input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value) || 0)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Taux d'intérêt annuel (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={simRate}
                      onChange={(e) => setSimRate(Number(e.target.value) || 0)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Durée du crédit (mois)</Label>
                    <Input
                      type="number"
                      value={simMonths}
                      onChange={(e) => setSimMonths(Number(e.target.value) || 1)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Modalité de remboursement</Label>
                  <Select value={simMode} onValueChange={(v: any) => setSimMode(v)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_fine">In Fine post-récolte (Capital + Intérêts à l'échéance)</SelectItem>
                      <SelectItem value="amortissable">Mensualités régulières (Amortissable classique)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-500/30 bg-emerald-500/5 shadow-xs flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-emerald-600" />
                  Résultat de l'Échéancier Prévisionnel
                </CardTitle>
                <CardDescription className="text-xs">
                  Modèle conforme aux pratiques bancaires agricoles en zone UEMOA.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm py-1 border-b">
                    <span className="text-muted-foreground">Capital emprunté :</span>
                    <strong className="text-foreground">{simAmount.toLocaleString()} FCFA</strong>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1 border-b">
                    <span className="text-muted-foreground">Intérêts totaux ({simRate}% sur {simMonths} mois) :</span>
                    <strong className="text-amber-700 dark:text-amber-400">+{simResult.interests.toLocaleString()} FCFA</strong>
                  </div>
                  <div className="flex items-center justify-between text-base py-2 font-black border-t-2 border-emerald-500/40">
                    <span className="text-foreground">Montant Total Remboursé :</span>
                    <span className="text-emerald-700 dark:text-emerald-400 text-lg">
                      {simResult.totalDue.toLocaleString()} FCFA
                    </span>
                  </div>
                  {simMode === "amortissable" && (
                    <div className="flex items-center justify-between text-xs py-1 text-muted-foreground">
                      <span>Mensualité estimée :</span>
                      <strong>{simResult.monthly.toLocaleString()} FCFA / mois</strong>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="p-4 pt-0">
                <Button
                  onClick={() => {
                    openCreateModal("credit");
                    setFormOffer((prev) => ({
                      ...prev,
                      title: `Crédit Campagne ${simMonths} Mois`,
                      rate: `${simRate}% / an`,
                      minAmount: String(simAmount),
                      maxAmount: String(simAmount * 3),
                      duration: `${simMonths} mois (${simMode === "in_fine" ? "In fine post-récolte" : "Mensualités"})`,
                    }));
                  }}
                  className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Transformer cette simulation en Offre Publique
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ MODALE DE CRÉATION & ÉDITION FINANCE & MARKETING ═══ */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-600" />
              {editingOffer ? "Modifier le Produit Financier" : "Créer une Offre Financière ou Campagne Marketing"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Renseignez les conditions financières, taux, montants, et visuels publicitaires pour publication sur la marketplace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Type d'opération */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Type de Produit / Service *</Label>
                <Select
                  value={formOffer.financeType}
                  onValueChange={(v) => {
                    setFormOffer({
                      ...formOffer,
                      financeType: v,
                      rate: v === "assurance" ? "4.5% du capital" : v === "subvention" ? "Subvention 50%" : "6.5% / an",
                      marketingBadge: v === "pub_marketing" ? "OFFRE PROMO SAISONNIÈRE" : "AGRÉÉ CIMA / BCEAO",
                    });
                  }}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Crédit Campagne Agricole / Intrants</SelectItem>
                    <SelectItem value="microfinance">Microcrédit Rural & Caution Solidaire</SelectItem>
                    <SelectItem value="assurance">Assurance Récolte, Bétail & Indicielle</SelectItem>
                    <SelectItem value="subvention">Fonds d'Appui & Programme Subventionné</SelectItem>
                    <SelectItem value="pub_marketing">Campagne Publicitaire & Bannière Sponsorisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Badge Marketing Promotionnel</Label>
                <Input
                  placeholder="Ex: SPONSORISÉ, AGRÉÉ CIMA, TAUX BONIFIÉ..."
                  value={formOffer.marketingBadge}
                  onChange={(e) => setFormOffer({ ...formOffer, marketingBadge: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Titre & Slogan */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Intitulé de l'Offre / Titre Publicitaire *</Label>
              <Input
                placeholder="Ex: Crédit Intrants Céréales 2026 - Déblocage en 48h"
                value={formOffer.title}
                onChange={(e) => setFormOffer({ ...formOffer, title: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            {/* Description détaillée */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description, Conditions & Critères d'Éligibilité</Label>
              <Textarea
                placeholder="Précisez les cultures éligibles, garanties requises, caution solidaire pour groupements paysans..."
                value={formOffer.description}
                onChange={(e) => setFormOffer({ ...formOffer, description: e.target.value })}
                rows={3}
                className="text-xs"
              />
            </div>

            {/* Paramètres Financiers : Taux, Montants, Durée */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/40 rounded-xl border">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Taux d'intérêt / Prime</Label>
                <Input
                  placeholder="Ex: 6.5% / an ou 4% prime"
                  value={formOffer.rate}
                  onChange={(e) => setFormOffer({ ...formOffer, rate: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Montant Min (FCFA)</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={formOffer.minAmount}
                  onChange={(e) => setFormOffer({ ...formOffer, minAmount: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Montant Max (FCFA)</Label>
                <Input
                  type="number"
                  placeholder="10000000"
                  value={formOffer.maxAmount}
                  onChange={(e) => setFormOffer({ ...formOffer, maxAmount: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Cible, Région, Durée */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Échéance / Durée</Label>
                <Input
                  placeholder="Ex: 6 à 12 mois (post-récolte)"
                  value={formOffer.duration}
                  onChange={(e) => setFormOffer({ ...formOffer, duration: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Public Cible</Label>
                <Input
                  placeholder="Ex: Cotonculteurs, Éleveurs..."
                  value={formOffer.targetAudience}
                  onChange={(e) => setFormOffer({ ...formOffer, targetAudience: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Zone / Région Couverte</Label>
                <Input
                  placeholder="Ex: Hauts-Bassins, Mouhoun..."
                  value={formOffer.region}
                  onChange={(e) => setFormOffer({ ...formOffer, region: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Visuel Publicitaire & Image */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Lien URL Image / Affiche Publicitaire / Flyer</Label>
              <Input
                placeholder="https://... image de votre bannière publicitaire"
                value={formOffer.imageUrl}
                onChange={(e) => setFormOffer({ ...formOffer, imageUrl: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            {/* Contacts & Bouton d'action CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Téléphone Agence</Label>
                <Input
                  placeholder="+226 XX XX XX XX"
                  value={formOffer.phone}
                  onChange={(e) => setFormOffer({ ...formOffer, phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Conseiller</Label>
                <Input
                  placeholder="contact@banque.bf"
                  value={formOffer.email}
                  onChange={(e) => setFormOffer({ ...formOffer, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bouton d'Action (CTA)</Label>
                <Input
                  placeholder="Ex: Souscrire en ligne"
                  value={formOffer.ctaLabel}
                  onChange={(e) => setFormOffer({ ...formOffer, ctaLabel: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)} className="text-xs">
              Annuler
            </Button>
            <Button onClick={handleSaveOffer} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              {editingOffer ? "Mettre à jour l'offre" : "Publier l'Offre sur la Marketplace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
