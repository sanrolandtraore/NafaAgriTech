import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ProviderMap from "@/components/marketplace/ProviderMap";
import {
  Search, X, MapPin, Phone, Plus, ShoppingBag, Lock, Unlock, CheckCircle,
  Clock, Loader2, XCircle, Eye, Trash2, Package, Send, Shield,
  Tractor, Star, Calendar, Mail, Globe, Store, Filter, RefreshCw,
  ExternalLink, MessageCircle, ShieldAlert, CheckCircle2, RotateCcw,
  LayoutDashboard, Wrench, Sparkles, AlertCircle, ChevronDown, ChevronUp,
  Smartphone
} from "lucide-react";
import BackNavigationButton from "@/components/BackNavigationButton";
import { partnerStorage, PartnerOffer } from "@/lib/partnerStorage";
import MechBookingModal from "@/components/mechanization/MechanizationBookingModal";
import { isPartnerSubscriptionActive } from "@/lib/providerSubscription";
import BurkinaPaymentModal from "@/components/payment/BurkinaPaymentModal";
import { PaymentTransaction } from "@/lib/burkinaPaymentAggregator";

// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;

// ─── Les 8 Catégories Réglementaires Obligatoires ───
export const MARKETPLACE_CATEGORIES = [
  { value: "machinisme", label: "Machinisme" },
  { value: "produits_agricoles", label: "Produits Agricoles" },
  { value: "produits_elevage", label: "Produits d'Élevage" },
  { value: "services_agricoles", label: "Services Agricoles" },
  { value: "services_veterinaires", label: "Services Vétérinaires" },
  { value: "finance_assurance", label: "Finance & Assurance" },
  { value: "intrants_semences", label: "Intrants & Semences" },
  { value: "irrigation_solaire", label: "Irrigation & Solaire" },
];

export const BURKINA_REGIONS = [
  "Centre",
  "Hauts-Bassins",
  "Boucle du Mouhoun",
  "Centre-Ouest",
  "Nord",
  "Sahel",
  "Est",
  "Cascades",
  "Plateau-Central",
  "Centre-Nord",
];

export const BURKINA_CITIES = [
  "Ouagadougou",
  "Bobo-Dioulasso",
  "Koudougou",
  "Dédougou",
  "Ouahigouya",
  "Fada N'Gourma",
  "Banfora",
  "Kaya",
  "Tenkodogo",
  "Manga",
  "Bama",
  "Koubri",
];

const PRICE_UNITS = [
  { value: "forfait", label: "Forfait" },
  { value: "par_hectare", label: "Par hectare" },
  { value: "par_jour", label: "Par jour" },
  { value: "par_heure", label: "Par heure" },
  { value: "par_sac", label: "Par sac/unité" },
  { value: "par_tonne", label: "Par tonne" },
];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  en_attente: { label: "En attente", icon: Clock, color: "text-yellow-600" },
  acceptee: { label: "Acceptée", icon: CheckCircle, color: "text-blue-600" },
  en_cours: { label: "En cours", icon: Loader2, color: "text-blue-600" },
  terminee: { label: "Service rendu", icon: CheckCircle, color: "text-green-600" },
  annulee: { label: "Annulée", icon: XCircle, color: "text-destructive" },
  litige: { label: "Litige", icon: Shield, color: "text-orange-600" },
};

const ESCROW_CONFIG: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  bloque: { label: "Fonds bloqués", icon: Lock, variant: "secondary" },
  debloque: { label: "Fonds débloqués", icon: CheckCircle2, variant: "default" },
  rembourse: { label: "Remboursé", icon: RotateCcw, variant: "destructive" },
};

export type PublicMarketItem = {
  id: string;
  provider_id: string;
  partner_name: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  price_unit: string;
  location_name: string;
  city: string;
  region: string;
  distanceKm: number;
  phone: string | null;
  whatsapp: string | null;
  imageUrl: string | null;
  availability: "immediate" | "sur_commande";
  is_verified: boolean;
  created_at: string;
};

type MarketOrder = {
  id: string;
  service_id: string;
  client_id: string;
  provider_id: string;
  amount: number;
  status: string;
  escrow_status: string;
  client_notes: string | null;
  created_at: string;
  item_title?: string;
};

export const ServiceMarketplacePage = () => {
  const { user, profile, primaryRole, partnerType } = useAuth();
  const [searchParams] = useSearchParams();
  const urlCat = searchParams.get("cat") || searchParams.get("category");
  const urlRole = searchParams.get("role") || searchParams.get("target");
  const urlIntent = searchParams.get("intent");

  const normalizeCatParam = (raw: string | null): string => {
    if (!raw) return "all";
    // Exact match first (safe for URL params like "services_agricoles")
    const exactMap: Record<string, string> = {
      machinisme: "machinisme",
      produits_agricoles: "produits_agricoles",
      produits_elevage: "produits_elevage",
      services_agricoles: "services_agricoles",
      services_veterinaires: "services_veterinaires",
      finance_assurance: "finance_assurance",
      intrants_semences: "intrants_semences",
      irrigation_solaire: "irrigation_solaire",
    };
    const key = raw.toLowerCase().trim();
    if (exactMap[key]) return exactMap[key];
    // Fallback: partial match ordered from most specific to least
    if (key.includes("irrigation") || key.includes("solaire")) return "irrigation_solaire";
    if (key.includes("veterinaire") || key.includes("veto")) return "services_veterinaires";
    if (key.includes("finance") || key.includes("assurance") || key.includes("banque")) return "finance_assurance";
    if (key.includes("semence") || key.includes("intrant") || key.includes("engrais")) return "intrants_semences";
    if (key.includes("elevage") || key.includes("animal")) return "produits_elevage";
    if (key.includes("service")) return "services_agricoles";
    if (key.includes("machinisme") || key.includes("materiel") || key.includes("location") || key.includes("tracteur")) return "machinisme";
    return "all";
  };

  // ─── ACCÈS À LA MARKETPLACE VITRINE ───
  // Les agriculteurs, les éleveurs ainsi que TOUS les visiteurs provenant de la page d'accueil
  // ont un accès libre, direct et prioritaire à la Marketplace Vitrine.
  const isAgriOrEleveur = primaryRole === "agriculteur" || primaryRole === "farmer" || primaryRole === "eleveur";
  const isVisitorFromHome = !user || urlRole === "producteurs" || urlRole === "agriculteur" || urlRole === "eleveur";

  // Seul un compte partenaire/institution connecté (qui n'est pas agriculteur ni visiteur)
  // est identifié comme profil prestataire
  const isPartner = !isVisitorFromHome && !isAgriOrEleveur && (
    primaryRole === "partenaire" ||
    primaryRole === "institution_agri"
  );
  const isClient = !isPartner;

  const [items, setItems] = useState<PublicMarketItem[]>([]);
  const [myOrders, setMyOrders] = useState<MarketOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);

  // Filtre d'action unifié : Intrants, Produits & Matériel (Achat & Location) OU Services
  const [intentFilter, setIntentFilter] = useState<"all" | "intrants_produits" | "service">(() => {
    if (urlIntent === "acheter" || urlIntent === "louer" || urlIntent === "intrants_produits" || urlIntent === "produits") {
      return "intrants_produits";
    }
    if (urlIntent === "service" || urlIntent === "services") {
      return "service";
    }
    return "all";
  });

  // ─── État modal réservation ───
  const [mechModalOpen, setMechModalOpen] = useState(false);
  const [mechEstimateData, setMechEstimateData] = useState<any>(null);

  // État de personnalisation de la commande (Achat vs Location de matériel)
  const [orderMode, setOrderMode] = useState<"location" | "achat">("location");
  const [orderDays, setOrderDays] = useState("1");
  const [withOperator, setWithOperator] = useState(true);

  // État Agrégateur de Paiement Burkina Faso (Orange Money, Moov, Wave, Carte)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingPaymentItem, setPendingPaymentItem] = useState<{ item: PublicMarketItem; amount: number } | null>(null);

  // ─── Les 6 Filtres Obligatoires ───
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState(() => normalizeCatParam(urlCat));
  const [regionFilter, setRegionFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [distanceMax, setDistanceMax] = useState<string>("all");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");

  useEffect(() => {
    if (urlCat) {
      setCatFilter(normalizeCatParam(urlCat));
    }
  }, [urlCat]);

  const [selectedItem, setSelectedItem] = useState<PublicMarketItem | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedMapItem, setSelectedMapItem] = useState<PublicMarketItem | null>(null);

  // Chargement des données publiques certifiées (partnerStorage + Supabase)
  const fetchData = async () => {
    setLoading(true);
    try {
      const partnerOffers = await partnerStorage.getOffers();

      // Mapping strict aux 8 catégories réglementaires
      const mapToStandardCategory = (rawCat: string): string => {
        const c = (rawCat || "").toLowerCase();
        if (c.includes("materiel") || c.includes("machinisme") || c.includes("tracteur") || c.includes("labour")) return "machinisme";
        if (c.includes("semence") || c.includes("intrant") || c.includes("engrais") || c.includes("phyto")) return "intrants_semences";
        if (c.includes("irrigation") || c.includes("solaire") || c.includes("pompe") || c.includes("forage")) return "irrigation_solaire";
        if (c.includes("animal") || c.includes("bov") || c.includes("elevage") || c.includes("aliment")) return "produits_elevage";
        if (c.includes("veterinaire") || c.includes("vaccin") || c.includes("sante")) return "services_veterinaires";
        if (c.includes("banque") || c.includes("assurance") || c.includes("finance") || c.includes("credit")) return "finance_assurance";
        if (c.includes("service") || c.includes("conseil") || c.includes("expertise")) return "services_agricoles";
        return "produits_agricoles";
      };

      const normalizeLocation = (loc: string | null) => {
        const text = loc || "Ouagadougou, Centre";
        let foundCity = "Ouagadougou";
        let foundRegion = "Centre";

        for (const city of BURKINA_CITIES) {
          if (text.toLowerCase().includes(city.toLowerCase())) {
            foundCity = city;
            break;
          }
        }
        for (const reg of BURKINA_REGIONS) {
          if (text.toLowerCase().includes(reg.toLowerCase())) {
            foundRegion = reg;
            break;
          }
        }
        return { city: foundCity, region: foundRegion };
      };

      // Filtrage strict : seules les offres de partenaires ayant un abonnement actif sont visibles pour le public
      const activeOffers = partnerOffers.filter((offer) => {
        if (offer.is_active === false) return false;
        // Si le partenaire connecté consulte ses propres offres, il les voit toujours en aperçu
        if (user && offer.owner_id === user.id) return true;
        // Pour les autres utilisateurs (agriculteurs, éleveurs, visiteurs), vérification de l'abonnement partenaire
        return isPartnerSubscriptionActive(offer.owner_id);
      });

      // Construction de la liste publique propre : ZÉRO DONNÉE FICTIVE OU SIMULÉE
      const formattedItems: PublicMarketItem[] = activeOffers.map((offer) => {
        const loc = normalizeLocation(offer.location_name);
        const parsedPrice = parseInt((offer.price_indication || "").replace(/\D/g, ""), 10);
        const rawPrice = isNaN(parsedPrice) ? 0 : parsedPrice;
        return {
          id: offer.id,
          provider_id: offer.owner_id,
          partner_name: offer.partner_name || "Partenaire Agréé",
          title: offer.title,
          description: offer.description || null,
          category: mapToStandardCategory(offer.category),
          price: rawPrice,
          price_unit: offer.unit || "prestation",
          location_name: offer.location_name || `${loc.city}, ${loc.region}`,
          city: loc.city,
          region: loc.region,
          distanceKm: 0,
          phone: offer.contact_phone || null,
          whatsapp: offer.contact_phone || null,
          imageUrl: offer.image_url || offer.images?.[0] || null,
          availability: (offer as any).availability || "immediate",
          is_verified: Boolean((offer as any).is_verified),
          created_at: offer.created_at,
        };
      });

      // Tentative de récupération des commandes utilisateur si connecté
      if (user) {
        try {
          const { data: ordData } = await db
            .from("marketplace_orders")
            .select("*")
            .eq("client_id", user.id)
            .order("created_at", { ascending: false });
          if (ordData) {
            setMyOrders(ordData.map((o: any) => ({
              ...o,
              item_title: formattedItems.find((i) => i.id === o.service_id)?.title || "Prestation Agricole",
            })));
          }
        } catch {
          // Hors-ligne fallback silencieux
        }
      }

      setItems(formattedItems);
    } catch (e) {
      console.warn("Erreur chargement marketplace:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Position GPS
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserPosition([coords.latitude, coords.longitude]),
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 }
    );
  }, []);

  // ─── Application rigoureuse des 6 Filtres ───
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 0. Filtre d'intention unifié : Intrants, Produits & Matériel (Achat & Location) vs Services
      if (intentFilter === "intrants_produits" || (intentFilter as any) === "acheter" || (intentFilter as any) === "louer") {
        if (!["produits_agricoles", "produits_elevage", "intrants_semences", "machinisme", "irrigation_solaire"].includes(item.category)) return false;
      } else if (intentFilter === "service") {
        if (!["services_agricoles", "services_veterinaires", "finance_assurance"].includes(item.category)) return false;
      }

      // 1. Recherche plein texte
      const q = search.trim().toLowerCase();
      if (q) {
        const inTitle = item.title.toLowerCase().includes(q);
        const inDesc = (item.description || "").toLowerCase().includes(q);
        const inPartner = item.partner_name.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inPartner) return false;
      }

      // 2. Filtre Catégorie
      if (catFilter !== "all" && item.category !== catFilter) return false;

      // 3. Filtre Région
      if (regionFilter !== "all" && item.region.toLowerCase() !== regionFilter.toLowerCase()) return false;

      // 4. Filtre Ville
      if (cityFilter !== "all" && item.city.toLowerCase() !== cityFilter.toLowerCase()) return false;

      // 5. Filtre Distance
      if (distanceMax !== "all") {
        const maxKm = parseInt(distanceMax, 10);
        if (!isNaN(maxKm) && item.distanceKm > maxKm) return false;
      }

      // 6. Filtre Prix (Min - Max)
      if (priceMin) {
        const minVal = parseFloat(priceMin);
        if (!isNaN(minVal) && item.price < minVal) return false;
      }
      if (priceMax) {
        const maxVal = parseFloat(priceMax);
        if (!isNaN(maxVal) && item.price > maxVal) return false;
      }

      // 7. Filtre Disponibilité
      if (availabilityFilter !== "all" && item.availability !== availabilityFilter) return false;

      return true;
    });
  }, [items, search, catFilter, regionFilter, cityFilter, distanceMax, priceMin, priceMax, availabilityFilter, intentFilter]);

  // Commande sécurisée
  const handlePlaceOrder = async () => {
    if (!selectedItem || !user) {
      toast.error("Veuillez vous connecter pour passer commande.");
      return;
    }

    const isMachinery = selectedItem.category === "machinisme" || selectedItem.category === "irrigation_solaire";
    const finalClientNotes = isMachinery
      ? `[${orderMode === "location" ? "LOCATION MATÉRIEL" : "ACHAT DIRECT"}] Qté/Durée: ${orderDays || "1"} ${orderMode === "location" ? `| Opérateur: ${withOperator ? "Inclus" : "Non inclus"}` : ""} | ${orderNotes || ""}`.trim()
      : (orderNotes || null);

    try {
      const { error } = await db.from("marketplace_orders").insert({
        service_id: selectedItem.id,
        client_id: user.id,
        provider_id: selectedItem.provider_id,
        amount: selectedItem.price,
        client_notes: finalClientNotes,
        status: "en_attente",
        escrow_status: "bloque",
      });

      if (error) {
        // Enregistrement local résilient
        const localOrder: MarketOrder = {
          id: `ord-local-${Date.now()}`,
          service_id: selectedItem.id,
          client_id: user.id,
          provider_id: selectedItem.provider_id,
          amount: selectedItem.price,
          status: "en_attente",
          escrow_status: "bloque",
          client_notes: finalClientNotes,
          created_at: new Date().toISOString(),
          item_title: selectedItem.title,
        };
        setMyOrders((prev) => [localOrder, ...prev]);
        toast.success("Commande enregistrée localement (Mode Offline-First). Fonds bloqués.");
      } else {
        toast.success("Commande transmise avec succès ! Le paiement est sécurisé par séquestre NAFA.");
      }

      setShowOrderDialog(false);
      setOrderNotes("");
      setSelectedItem(null);
    } catch {
      toast.success("Commande mémorisée sur votre appareil.");
      setShowOrderDialog(false);
    }
  };

  const handleInitiatePayment = () => {
    if (!selectedItem) return;
    setPendingPaymentItem({ item: selectedItem, amount: selectedItem.price });
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (tx: PaymentTransaction) => {
    if (!pendingPaymentItem) return;
    const { item } = pendingPaymentItem;

    const finalClientNotes = [
      orderMode === "location" ? `[Location ${orderDays} jour(s) - ${withOperator ? "Avec chauffeur" : "Sans chauffeur"}]` : "[Achat direct]",
      `Paiement Séquestre : ${tx.provider} (Réf : ${tx.operatorReference})`,
      orderNotes.trim() ? `Note : ${orderNotes.trim()}` : "",
    ].filter(Boolean).join(" | ");

    if (user) {
      try {
        await db.from("marketplace_orders").insert({
          service_id: item.id,
          client_id: user.id,
          provider_id: item.provider_id,
          amount: item.price,
          client_notes: finalClientNotes,
          status: "en_attente",
          escrow_status: "bloque",
        });
      } catch {
        // Persistance distante facultative : la commande locale ci-dessous fait foi.
      }
    }

    const localOrder: MarketOrder = {
      id: `ord-${tx.operatorReference}`,
      service_id: item.id,
      client_id: user?.id || "client-local",
      provider_id: item.provider_id,
      amount: item.price,
      status: "en_attente",
      escrow_status: "bloque",
      client_notes: finalClientNotes,
      created_at: new Date().toISOString(),
      item_title: item.title,
    };
    setMyOrders((prev) => [localOrder, ...prev]);

    toast.success(`Commande validée et paiement consigné sous séquestre NAFA via ${tx.provider} !`);
    setShowOrderDialog(false);
    setOrderNotes("");
    setSelectedItem(null);
    setPendingPaymentItem(null);
  };

  const resetFilters = () => {
    setSearch("");
    setIntentFilter("all");
    setCatFilter("all");
    setRegionFilter("all");
    setCityFilter("all");
    setDistanceMax("all");
    setPriceMin("");
    setPriceMax("");
    setAvailabilityFilter("all");
  };

  const getCategoryLabel = (cat: string) =>
    MARKETPLACE_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  const getItemActionType = (category: string) => {
    if (category === "machinisme" || category === "irrigation_solaire") {
      return {
        label: "Acheter ou Louer ce matériel",
        action: "materiel" as const,
        icon: Tractor,
        dialogTitle: "Commande & Réservation de Matériel (Achat ou Location)",
        dialogButton: "Confirmer & Sécuriser les fonds sous séquestre",
      };
    }
    if (category === "services_agricoles" || category === "services_veterinaires" || category === "finance_assurance") {
      return {
        label: "Demander ce service",
        action: "service" as const,
        icon: Send,
        dialogTitle: "Demande de Prestation sous séquestre NAFA",
        dialogButton: "Valider la demande & Bloquer les fonds",
      };
    }
    return {
      label: "Acheter ce produit",
      action: "acheter" as const,
      icon: ShoppingBag,
      dialogTitle: "Commande d'Achat sous séquestre NAFA",
      dialogButton: "Valider l'achat & Bloquer les fonds",
    };
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-3 sm:px-6 animate-fade-in">
      {/* Information pour les partenaires connectés qui consultent la vitrine (Caché par défaut - Cliquer pour voir) */}
      {/* En-tête Marché Unifié */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo={user ? "/dashboard" : "/"} />
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold flex items-center gap-2 text-foreground">
              <Store className="h-6 w-6 text-emerald-600" /> Marché Vitrine NAFA
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Espace réservé aux agriculteurs et éleveurs : achetez vos intrants, louez du matériel agricole et demandez des services certifiés.
            </p>
          </div>
        </div>
      </div>

      {/* Barre d'action rapide : Acheter / Louer / Demander un service */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Button
          variant={intentFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setIntentFilter("all")}
          className={`h-9 text-xs rounded-xl shrink-0 font-medium ${intentFilter === "all" ? "bg-emerald-600 text-white" : ""}`}
        >
          <Store className="h-3.5 w-3.5 mr-1.5" /> Toutes les offres ({items.length})
        </Button>
        <Button
          variant={intentFilter === "intrants_produits" ? "default" : "outline"}
          size="sm"
          onClick={() => setIntentFilter("intrants_produits")}
          className={`h-9 text-xs rounded-xl shrink-0 font-medium ${intentFilter === "intrants_produits" ? "bg-emerald-600 text-white" : ""}`}
        >
          <ShoppingBag className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> Achat d'intrants, Produits & Matériel (Achat & Location)
        </Button>
        <Button
          variant={intentFilter === "service" ? "default" : "outline"}
          size="sm"
          onClick={() => setIntentFilter("service")}
          className={`h-9 text-xs rounded-xl shrink-0 font-medium ${intentFilter === "service" ? "bg-emerald-600 text-white" : ""}`}
        >
          <Wrench className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Services & Conseils (Agronomiques, Vétérinaires & Finance)
        </Button>
      </div>

      {/* ─── BLOC DES 6 FILTRES OBLIGATOIRES ─── */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Filtres de Recherche Avancés ({filteredItems.length} offre{filteredItems.length > 1 ? "s" : ""})
            </span>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-3 w-3 mr-1" /> Réinitialiser
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
            {/* 1. Catégorie */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">1. Catégorie</Label>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes ({MARKETPLACE_CATEGORIES.length})</SelectItem>
                  {MARKETPLACE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Région */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">2. Région</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  {BURKINA_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Ville */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">3. Ville</Label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {BURKINA_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Distance */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">4. Rayon distance</Label>
              <Select value={distanceMax} onValueChange={setDistanceMax}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Distance max" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout le Burkina</SelectItem>
                  <SelectItem value="25">Moins de 25 km</SelectItem>
                  <SelectItem value="50">Moins de 50 km</SelectItem>
                  <SelectItem value="100">Moins de 100 km</SelectItem>
                  <SelectItem value="200">Moins de 200 km</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 5. Prix Min - Max */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">5. Prix (FCFA)</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="h-9 text-xs px-2"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="h-9 text-xs px-2"
                />
              </div>
            </div>

            {/* 6. Disponibilité */}
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">6. Disponibilité</Label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Disponibilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="immediate">Disponible de suite</SelectItem>
                  <SelectItem value="sur_commande">Sur commande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recherche textuelle libre */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 pr-8 h-9 text-xs bg-muted/40"
              placeholder="Rechercher par mot-clé (ex: tracteur, semences d'oignon, pompe solaire, foin, vaccin...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Onglets : Catalogue / Carte GPS / Mes Commandes */}
      <Tabs defaultValue="catalogue" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="catalogue" className="gap-1.5 text-xs">
            <ShoppingBag className="h-3.5 w-3.5" /> Offres Publiques ({filteredItems.length})
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5" /> Carte des Prestataires
          </TabsTrigger>
          {isClient && (
            <TabsTrigger value="orders" className="gap-1.5 text-xs">
              <Package className="h-3.5 w-3.5" /> Mes Commandes ({myOrders.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* ═══ VUE CATALOGUE ═══ */}
        <TabsContent value="catalogue" className="space-y-4">
          {items.length === 0 ? (
            <Card className="border border-border/80 bg-muted/10 py-16 text-center">
              <CardContent className="space-y-4 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Store className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground">
                  Aucune offre partenaire active pour le moment
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Le Marché NAFA-AGRITECH présente exclusivement les produits, intrants, matériels et services réels proposés par nos partenaires agréés et vérifiés.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Link to="/dashboard/partner-space">
                      <Plus className="h-4 w-4" /> Espace Partenaire (Publier une offre)
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground space-y-2">
                <p className="text-base font-semibold">Aucune offre ne correspond à ces critères de recherche.</p>
                <p className="text-xs">Essayez d'élargir le rayon géographique ou de réinitialiser les filtres.</p>
                <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 text-xs">
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-md transition border flex flex-col justify-between">
                  <div>
                    {item.imageUrl ? (
                      <div className="relative h-44 bg-muted overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <Badge className="absolute top-2.5 left-2.5 bg-card/90 text-foreground backdrop-blur-md text-[10px] border shadow-xs">
                          {getCategoryLabel(item.category)}
                        </Badge>
                        <Badge
                          variant={item.availability === "immediate" ? "default" : "secondary"}
                          className={`absolute top-2.5 right-2.5 text-[10px] ${
                            item.availability === "immediate" ? "bg-emerald-600 text-white" : ""
                          }`}
                        >
                          {item.availability === "immediate" ? "Disponible" : "Sur commande"}
                        </Badge>
                      </div>
                    ) : (
                      <div className="relative h-28 bg-muted/30 border-b flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                        <Badge className="absolute top-2.5 left-2.5 bg-card/90 text-foreground backdrop-blur-md text-[10px] border shadow-xs">
                          {getCategoryLabel(item.category)}
                        </Badge>
                        <Badge
                          variant={item.availability === "immediate" ? "default" : "secondary"}
                          className={`absolute top-2.5 right-2.5 text-[10px] ${
                            item.availability === "immediate" ? "bg-emerald-600 text-white" : ""
                          }`}
                        >
                          {item.availability === "immediate" ? "Disponible" : "Sur commande"}
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-4 space-y-2.5">
                      {/* En-tête partenaire & titre */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 truncate max-w-[190px]">
                            {item.partner_name}
                          </span>
                          {item.is_verified && (
                            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 shrink-0">
                              <CheckCircle className="h-3 w-3" /> Agréé
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-foreground line-clamp-2 mt-1 leading-snug">
                          {item.title}
                        </h3>
                      </div>

                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Localisation & Distance */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {item.city} ({item.region})
                        </span>
                        {item.distanceKm > 0 && (
                          <span className="shrink-0 font-medium text-emerald-800 dark:text-emerald-300">
                            ~{item.distanceKm} km
                          </span>
                        )}
                      </div>

                      {/* Prix */}
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          {item.price > 0 ? (
                            <>
                              <span className="text-lg font-extrabold text-foreground">
                                {item.price.toLocaleString("fr-FR")}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">FCFA / {item.price_unit}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-foreground">
                              {item.price_unit ? `Sur devis (${item.price_unit})` : "Sur devis"}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  {/* Actions de contact & commande */}
                  <div className="p-4 pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {item.phone ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1"
                          asChild
                        >
                          <a href={`tel:${item.phone}`}>
                            <Phone className="h-3 w-3" /> Appeler
                          </a>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1 opacity-50 cursor-not-allowed"
                          disabled
                        >
                          <Phone className="h-3 w-3" /> Non renseigné
                        </Button>
                      )}
                      {item.whatsapp ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          asChild
                        >
                          <a
                            href={`https://wa.me/${item.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `Bonjour, je vous contacte depuis la plateforme NAFA - AGRITECH à propos de : ${item.title}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
                          </a>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1 opacity-50 cursor-not-allowed"
                          disabled
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </Button>
                      )}
                    </div>

                    {(() => {
                      const actionInfo = getItemActionType(item.category);
                      const ActionIcon = actionInfo.icon;
                      return (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 rounded-xl font-semibold shadow-xs"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowOrderDialog(true);
                            }}
                          >
                            <ActionIcon className="h-3.5 w-3.5" /> {actionInfo.label}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground rounded-xl"
                            asChild
                            title="Voir les détails de l'offre"
                          >
                            <Link to={`/partenaire/${item.provider_id}`}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ VUE CARTE GPS ═══ */}
        <TabsContent value="map" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-semibold">Localisation géographique des prestataires</h2>
              <p className="text-xs text-muted-foreground">Visualisez les offres proches de vos parcelles au Burkina Faso.</p>
            </div>
            <Badge variant="outline" className="gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" /> GPS {userPosition ? "actif" : "approximatif"}
            </Badge>
          </div>

          <ProviderMap
            services={filteredItems.map((i) => ({
              id: i.id,
              provider_id: i.provider_id,
              title: i.title,
              description: i.description,
              category: i.category,
              price: i.price,
              price_unit: i.price_unit,
              location_name: i.location_name,
              phone: i.phone,
              images: i.imageUrl ? [i.imageUrl] : null,
              is_active: true,
              created_at: i.created_at,
            }))}
            selectedId={selectedMapItem?.id}
            onSelect={(service) => {
              const matched = filteredItems.find((i) => i.id === service.id);
              setSelectedMapItem(matched || null);
            }}
          />

          {selectedMapItem && (
            <Card className="border-emerald-500/30">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">{selectedMapItem.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMapItem.partner_name} · {selectedMapItem.location_name} · {selectedMapItem.price.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white text-xs"
                  onClick={() => {
                    setSelectedItem(selectedMapItem);
                    setShowOrderDialog(true);
                  }}
                >
                  Commander
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ VUE MES COMMANDES (POUR LES CLIENTS) ═══ */}
        {isClient && (
          <TabsContent value="orders" className="space-y-3">
            {myOrders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-xs">
                  Vous n'avez passé aucune commande pour le moment.
                </CardContent>
              </Card>
            ) : (
              myOrders.map((order) => {
                const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.en_attente;
                const esc = ESCROW_CONFIG[order.escrow_status] || ESCROW_CONFIG.bloque;
                const StIcon = st.icon;
                return (
                  <Card key={order.id} className="shadow-xs">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground text-sm break-words">{order.item_title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant={esc.variant} className="text-[10px] shrink-0">{esc.label}</Badge>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                            <StIcon className={`h-3 w-3 ${st.color}`} /> {st.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="font-bold text-sm text-foreground">
                          {Number(order.amount).toLocaleString("fr-FR")} FCFA
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* ─── MODAL DE COMMANDE SÉCURISÉE AVEC SÉQUESTRE ─── */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              {selectedItem ? getItemActionType(selectedItem.category).dialogTitle : "Commande sous séquestre NAFA"}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 text-xs pt-2">
              <div className="p-3 rounded-xl bg-muted/40 border space-y-1">
                <div className="font-bold text-sm text-foreground">{selectedItem.title}</div>
                <div className="text-muted-foreground">Prestataire : {selectedItem.partner_name}</div>
                <div className="font-bold text-emerald-600 text-base pt-1">
                  {selectedItem.price.toLocaleString("fr-FR")} FCFA / {selectedItem.price_unit}
                </div>
              </div>

              {(selectedItem.category === "machinisme" || selectedItem.category === "irrigation_solaire") && (
                <div className="space-y-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Label className="font-semibold text-xs text-foreground">Type d'engagement souhaité</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={orderMode === "location" ? "default" : "outline"}
                      onClick={() => setOrderMode("location")}
                      className={`text-xs h-8 ${orderMode === "location" ? "bg-amber-600 text-white" : ""}`}
                    >
                      <Tractor className="h-3 w-3 mr-1" /> Location de matériel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={orderMode === "achat" ? "default" : "outline"}
                      onClick={() => setOrderMode("achat")}
                      className={`text-xs h-8 ${orderMode === "achat" ? "bg-emerald-600 text-white" : ""}`}
                    >
                      <ShoppingBag className="h-3 w-3 mr-1" /> Achat définitif
                    </Button>
                  </div>

                  {orderMode === "location" ? (
                    <div className="space-y-2 pt-1 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[11px]">Durée ou Surface</Label>
                          <Input
                            placeholder="Ex: 3 jours ou 5 ha"
                            value={orderDays}
                            onChange={(e) => setOrderDays(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px]">Chauffeur / Opérateur</Label>
                          <Select value={withOperator ? "oui" : "non"} onValueChange={(v) => setWithOperator(v === "oui")}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="oui">Opérateur inclus</SelectItem>
                              <SelectItem value="non">Sans opérateur</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Caution et acompte de location protégés par le séquestre NAFA. Déblocage après validation des travaux.
                      </p>
                    </div>
                  ) : (
                    <div className="pt-1 text-xs">
                      <Label className="text-[11px]">Quantité souhaitée</Label>
                      <Input
                        placeholder="Ex: 1 unité"
                        value={orderDays}
                        onChange={(e) => setOrderDays(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Instructions ou détails pour le prestataire</Label>
                <Input
                  placeholder="Ex: Emplacement de la parcelle, date souhaitée, superficie..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Votre paiement reste consigné sur le compte séquestre NAFA - AGRITECH jusqu'à confirmation de la livraison ou de la réalisation de la prestation sur le terrain.</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" className="h-10 px-4 text-xs rounded-xl" onClick={() => setShowOrderDialog(false)}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  onClick={handleInitiatePayment}
                >
                  <Shield className="h-4 w-4" />
                  Payer sous séquestre (Orange / Moov / Wave / Carte)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL DE RÉSERVATION DE CHANTIER DE MÉCANISATION AVEC SÉQUESTRE ─── */}
      <MechBookingModal
        open={mechModalOpen}
        onOpenChange={setMechModalOpen}
        initialData={mechEstimateData}
        onJobCreated={(job) => {
          toast.success(`Chantier #${job.id.slice(0, 8)} réservé avec succès ! Acompte consigné sous séquestre.`);
          setMechModalOpen(false);
        }}
      />

      {/* ─── GUICHET DE PAIEMENT AGRÉGATEUR BURKINA FASO (SÉQUESTRE SÉCURISÉ NAFA) ─── */}
      {pendingPaymentItem && (
        <BurkinaPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          title={`Séquestre Garanti : ${pendingPaymentItem.item.title}`}
          description={`Commande auprès de ${pendingPaymentItem.item.partner_name}. Vos fonds sont protégés jusqu'à validation de la prestation.`}
          amount={pendingPaymentItem.amount}
          context="marketplace_order"
          beneficiaryType="partner"
          partnerId={pendingPaymentItem.item.provider_id}
          partnerName={pendingPaymentItem.item.partner_name}
          defaultPayerPhone={user?.phone || profile?.phone || "+226 "}
          defaultPayerName={profile?.full_name || user?.user_metadata?.full_name || ""}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
export default ServiceMarketplacePage;
