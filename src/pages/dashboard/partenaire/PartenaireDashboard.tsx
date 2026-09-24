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
import { toast } from "sonner";
import {
  Store,
  Plus,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Pencil,
  ExternalLink,
  Copy,
  SlidersHorizontal,
  Package,
  Briefcase,
  FileText,
  FlaskConical,
  Tractor,
  Microscope,
  Beef,
  Landmark,
  Handshake,
  MessageSquare,
  Video,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  DollarSign,
  Tag,
  AlertCircle,
  BadgeCheck,
  ShieldCheck,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredProviderSubscription } from "@/lib/providerSubscription";
import {
  partnerStorage,
  PartnerOffer,
  QuoteRequest,
  PartnerMission,
  MediaItem,
} from "@/lib/partnerStorage";
import { getEffectiveUserId } from "@/lib/deviceIdentity";
import {
  PARTNER_PROFILES,
  PARTNER_PROFILE_LIST,
  PartnerProfileType,
} from "@/lib/partnerProfiles";
import { OFFER_CATEGORIES } from "@/pages/provider/partnerCategories";
import ProductMediaUploader from "@/components/partner/ProductMediaUploader";
import ProductMediaViewer from "@/components/partner/ProductMediaViewer";
import { PartnerVerifiedBadge } from "@/components/partner/PartnerVerifiedBadge";
import { getStoredPartnerKyc, PartnerKycDossier } from "@/lib/partnerKyc";

const getProfileIcon = (iconName: string, className = "h-5 w-5") => {
  switch (iconName) {
    case "FlaskConical":
      return <FlaskConical className={className} />;
    case "Tractor":
      return <Tractor className={className} />;
    case "Microscope":
      return <Microscope className={className} />;
    case "Beef":
      return <Beef className={className} />;
    case "Landmark":
      return <Landmark className={className} />;
    default:
      return <Handshake className={className} />;
  }
};

const UNIT_OPTIONS = [
  { value: "sac de 50 kg", label: "Sac de 50 kg" },
  { value: "sac de 100 kg", label: "Sac de 100 kg" },
  { value: "litre", label: "Litre (L)" },
  { value: "bidon 20L", label: "Bidon de 20 Litres" },
  { value: "tonne", label: "Tonne" },
  { value: "kg", label: "Kilogramme (kg)" },
  { value: "hectare", label: "Hectare (ha)" },
  { value: "journée", label: "Journée" },
  { value: "heure machine", label: "Heure machine" },
  { value: "tête de bétail", label: "Tête de bétail / sujet" },
  { value: "consultation", label: "Consultation / séance" },
  { value: "forfait", label: "Forfait complet" },
  { value: "autre", label: "Autre unité personnalisée..." },
];

export default function PartenaireDashboard() {
  const { user, profile, partnerType, setPartnerType } = useAuth();
  const [sub, setSub] = useState(() => getStoredProviderSubscription(user?.id));
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [missions, setMissions] = useState<PartnerMission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = (e: any) => {
      setSub(e?.detail || getStoredProviderSubscription(user?.id));
    };
    window.addEventListener("nafa-subscription-updated", handler);
    return () => window.removeEventListener("nafa-subscription-updated", handler);
  }, [user]);

  // Vue active : "offres" ou "commandes"
  const [activeTab, setActiveTab] = useState<"offres" | "commandes">("offres");

  // Dialogs
  const [isSwitchDialogOpen, setIsSwitchDialogOpen] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<PartnerOffer | null>(null);

  // Formulaire d'offre (Création & Modification avec Médias & Prix sur-mesure)
  const [offerTitle, setOfferTitle] = useState("");
  const [offerCategory, setOfferCategory] = useState("intrants");
  const [offerPriceType, setOfferPriceType] = useState<"fixed" | "quote">("fixed");
  const [offerPriceAmount, setOfferPriceAmount] = useState("");
  const [offerUnit, setOfferUnit] = useState("sac de 50 kg");
  const [offerCustomUnit, setOfferCustomUnit] = useState("");
  const [offerDesc, setOfferDesc] = useState("");
  const [offerPhone, setOfferPhone] = useState(user?.phone || "+226 ");
  const [offerLocation, setOfferLocation] = useState("Burkina Faso");
  const [offerMedia, setOfferMedia] = useState<MediaItem[]>([]);
  const [savingOffer, setSavingOffer] = useState(false);

  const activeMeta = PARTNER_PROFILES[partnerType] || PARTNER_PROFILES.fournisseur_intrants;

  const partnerId = user?.id || "current";
  const [kycDossier, setKycDossier] = useState<PartnerKycDossier>(() => getStoredPartnerKyc(partnerId));

  const loadData = async () => {
    setLoading(true);
    try {
      const [o, q, m] = await Promise.all([
        partnerStorage.getOffers(user?.id),
        partnerStorage.getQuotes(),
        partnerStorage.getMissions(user?.id),
      ]);
      setOffers(o);
      setQuotes(q);
      setMissions(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    const handleKycUpdate = () => {
      setKycDossier(getStoredPartnerKyc(partnerId));
    };
    window.addEventListener("nafa-partner-data-updated", handleUpdate);
    window.addEventListener("nafa-partner-kyc-updated", handleKycUpdate);
    return () => {
      window.removeEventListener("nafa-partner-data-updated", handleUpdate);
      window.removeEventListener("nafa-partner-kyc-updated", handleKycUpdate);
    };
  }, [user, partnerId]);

  // Ouverture du modal en mode Ajout
  const openCreateOffer = () => {
    setEditingOffer(null);
    setOfferTitle("");
    const defaultCat =
      partnerType === "fournisseur_intrants"
        ? "intrants"
        : partnerType === "machinisme_travaux"
        ? "materiel"
        : partnerType === "sante_animale"
        ? "veterinaire"
        : partnerType === "banque_microfinance"
        ? "financement"
        : "service";
    setOfferCategory(defaultCat);
    setOfferPriceType("fixed");
    setOfferPriceAmount("");
    setOfferUnit("sac de 50 kg");
    setOfferCustomUnit("");
    setOfferDesc("");
    setOfferPhone(user?.phone || profile?.phone || "+226 ");
    setOfferLocation(profile?.city || "Burkina Faso");
    setOfferMedia([]);
    setIsOfferDialogOpen(true);
  };

  // Ouverture du modal en mode Modification
  const openEditOffer = (offer: PartnerOffer) => {
    setEditingOffer(offer);
    setOfferTitle(offer.title);
    setOfferCategory(offer.category || "intrants");

    // Analyse du prix
    const rawPrice = offer.price_indication || "";
    if (
      rawPrice.toLowerCase().includes("devis") ||
      rawPrice.toLowerCase().includes("négocier") ||
      !rawPrice
    ) {
      setOfferPriceType("quote");
      setOfferPriceAmount("");
    } else {
      setOfferPriceType("fixed");
      const digits = rawPrice.replace(/[^0-9]/g, "");
      setOfferPriceAmount(digits || rawPrice);
    }

    const matchingUnit = UNIT_OPTIONS.find((u) => u.value === offer.unit);
    if (matchingUnit) {
      setOfferUnit(offer.unit || "sac de 50 kg");
      setOfferCustomUnit("");
    } else if (offer.unit) {
      setOfferUnit("autre");
      setOfferCustomUnit(offer.unit);
    } else {
      setOfferUnit("sac de 50 kg");
      setOfferCustomUnit("");
    }

    setOfferDesc(offer.description || "");
    setOfferPhone(offer.contact_phone || user?.phone || "+226 ");
    setOfferLocation(offer.location_name || "Burkina Faso");

    // Médias structurés
    const existingMedia: MediaItem[] =
      offer.media && offer.media.length > 0
        ? [...offer.media]
        : offer.image_url
        ? [{ id: "m-init-" + offer.id, type: "image", url: offer.image_url, title: offer.title }]
        : [];
    setOfferMedia(existingMedia);
    setIsOfferDialogOpen(true);
  };

  // Enregistrer ou modifier l'offre (produit / prestation)
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim()) {
      toast.error("Veuillez saisir le nom de votre produit ou service.");
      return;
    }

    setSavingOffer(true);
    try {
      let finalPrice = "Sur devis";
      if (offerPriceType === "fixed") {
        const cleanAmount = offerPriceAmount.trim().replace(/\s/g, "");
        if (cleanAmount) {
          const num = Number(cleanAmount);
          finalPrice = !isNaN(num) ? `${num.toLocaleString("fr-FR")} FCFA` : `${cleanAmount} FCFA`;
        }
      }

      const finalUnit =
        (offerUnit === "autre" ? offerCustomUnit.trim() : offerUnit.trim()) || "unité";

      const mediaList = [...offerMedia];
      const imagesList = mediaList.filter((m) => m.type === "image").map((m) => m.url);
      const videosList = mediaList.filter((m) => m.type === "video").map((m) => m.url);
      const primaryImg =
        imagesList[0] || (mediaList[0]?.type === "image" ? mediaList[0].url : null) || null;

      await partnerStorage.saveOffer({
        ...(editingOffer ? { id: editingOffer.id } : {}),
        owner_id: getEffectiveUserId(user?.id),
        partner_name: profile?.full_name || sub.companyName || "Partenaire NAFA - AGRITECH",
        category: offerCategory,
        title: offerTitle.trim(),
        description: offerDesc.trim() || null,
        price_indication: finalPrice,
        unit: finalUnit,
        location_name: offerLocation.trim() || "Burkina Faso",
        contact_phone: offerPhone.trim() || null,
        image_url: primaryImg,
        images: imagesList,
        videos: videosList,
        media: mediaList,
        is_active: true,
      });

      toast.success(
        editingOffer
          ? "Produit / Service modifié avec succès !"
          : "Produit / Service publié avec succès !"
      );
      setIsOfferDialogOpen(false);
      setEditingOffer(null);
      loadData();
    } catch (err: any) {
      toast.error("Erreur lors de l'enregistrement : " + (err?.message || "Erreur inconnue"));
    } finally {
      setSavingOffer(false);
    }
  };

  // Supprimer une offre
  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm("Voulez-vous vraiment retirer ce produit ou service du catalogue ?")) return;
    try {
      await partnerStorage.deleteOffer(offerId);
      toast.success("Offre retirée du catalogue.");
      loadData();
    } catch (err: any) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  // Traiter une commande (Accepter / Refuser)
  const handleQuoteStatus = async (quoteId: string, status: "acceptee" | "refusee") => {
    try {
      await partnerStorage.updateQuoteStatus(quoteId, status);
      toast.success(status === "acceptee" ? "Commande validée !" : "Commande déclinée.");
      loadData();
    } catch (err: any) {
      toast.error("Erreur lors de la mise à jour.");
    }
  };

  // Aperçu dynamique du prix tel qu'il apparaîtra aux producteurs
  const previewPriceDisplay = useMemo(() => {
    if (offerPriceType === "quote") return "Sur devis";
    const clean = offerPriceAmount.trim().replace(/\s/g, "");
    if (!clean) return "Sur devis";
    const num = Number(clean);
    const formatted = !isNaN(num) ? `${num.toLocaleString("fr-FR")} FCFA` : `${clean} FCFA`;
    const unitText = offerUnit === "autre" ? offerCustomUnit.trim() : offerUnit.trim();
    return unitText ? `${formatted} / ${unitText}` : formatted;
  }, [offerPriceType, offerPriceAmount, offerUnit, offerCustomUnit]);

  const pendingQuotesCount = quotes.filter((q) => q.status === "en_attente").length;
  const activeMissionsCount = missions.filter(
    (m) => m.status === "planifiee" || m.status === "en_cours"
  ).length;

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* ── 1. EN-TÊTE SIMPLIFIÉ PARTENAIRE ── */}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/15 text-primary border-primary/20 text-xs font-bold gap-1 px-3 py-1 rounded-full">
              {getProfileIcon(activeMeta.iconName, "h-3.5 w-3.5")}
              <span>{activeMeta.title}</span>
            </Badge>
            <span className="text-xs text-muted-foreground">• Compte Professionnel Agréé</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {profile?.full_name || sub.companyName || "Mon Entreprise Partenaire"}
            </h1>
            <PartnerVerifiedBadge
              isVerified={kycDossier.status === "verifie"}
              kyc={kycDossier}
              partnerName={profile?.full_name || sub.companyName}
              size="sm"
              variant="pill"
            />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {activeMeta.tagline}. Modifiez vos produits, personnalisez vos prix, vos photos et vos vidéos de démonstration en direct.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border text-xs h-10 gap-1.5 hover:bg-muted"
          >
            <Link to="/dashboard/partenaire-kyc">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
              {kycDossier.status === "verifie" ? "Certifié KYC" : "Vérification KYC"}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border text-xs h-10 gap-1.5 hover:bg-muted"
          >
            <Link to="/dashboard/partenaire-abonnement">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Abonnement {sub.tier === "enterprise" ? "Entreprise" : sub.tier === "starter" ? "Starter" : sub.tier === "free" ? "Découverte" : "Pro"}</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSwitchDialogOpen(true)}
            className="rounded-xl border-border text-xs h-10 gap-1.5 hover:bg-muted"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            Changer de profil
          </Button>

          <Button
            asChild
            variant="secondary"
            size="sm"
            className="rounded-xl text-xs h-10 gap-1.5 shadow-xs font-semibold"
          >
            <Link to="/dashboard/partenaire-vitrine">
              <Store className="h-3.5 w-3.5 text-primary" />
              Voir ma vitrine publique
            </Link>
          </Button>
        </div>
      </div>

      {/* ── BANNIÈRE KYC & STATUT DE CERTIFICATION ── */}
      {kycDossier.status === "verifie" ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                  Compte Partenaire Certifié NAFA - AGRITECH
                </span>
                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 font-bold">
                  {kycDossier.type === "personne_morale" ? "Personne Morale (RCCM/IFU)" : "Personne Physique (CNIB)"}
                </Badge>
              </div>
              <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 mt-0.5">
                Matricule officiel : <span className="font-mono font-bold">{kycDossier.certificationId || "NAFA-CERT-2026-BF"}</span> · Vos offres bénéficient de la priorité d'affichage et du badge vérifié.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs shrink-0 rounded-xl">
            <Link to="/dashboard/partenaire-kyc">
              Voir mon dossier
            </Link>
          </Button>
        </div>
      ) : kycDossier.status === "en_attente" ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-amber-950 dark:text-amber-100">
                Dossier KYC en cours d'instruction
              </span>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mt-0.5">
                Vos pièces justificatives ({kycDossier.type === "personne_morale" ? "RCCM / IFU" : "CNIB / Identité"}) sont en cours de contrôle par nos équipes de conformité.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs shrink-0 rounded-xl">
            <Link to="/dashboard/partenaire-kyc">
              Suivre le statut
            </Link>
          </Button>
        </div>
      ) : kycDossier.status === "rejete" ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-destructive text-white shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-destructive">
                Dossier KYC non conforme : action requise
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {kycDossier.rejectionReason || "Les pièces fournies sont incomplètes ou illisibles."} Veuillez soumettre à nouveau votre dossier pour obtenir le badge certifié.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="destructive" className="text-xs shrink-0 rounded-xl">
            <Link to="/dashboard/partenaire-kyc">
              Mettre à jour le dossier
            </Link>
          </Button>
        </div>
      ) : (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  Obtenez votre Badge Partenaire Certifié (KYC)
                </span>
                <Badge className="bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0 font-bold border-emerald-500/30">
                  Gratuit
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Validez votre identité (Personne Physique ou Morale) pour rassurer les acheteurs, sécuriser vos contrats et booster vos ventes.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="gradient-primary text-primary-foreground font-semibold text-xs shrink-0 rounded-xl">
            <Link to="/dashboard/partenaire-kyc">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Vérifier mon compte
            </Link>
          </Button>
        </div>
      )}

      {/* ── 2. BLOCS STATS ESSENTIELLES (3 CARTES CLAIRES) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          onClick={() => setActiveTab("offres")}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs",
            activeTab === "offres"
              ? "bg-primary/10 border-primary"
              : "bg-card border-border hover:border-primary/50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Mes Produits & Services</span>
            <div className="p-2 rounded-xl bg-primary/15 text-primary">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{offers.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Visibles avec photos et vidéos</p>
        </div>

        <div
          onClick={() => setActiveTab("commandes")}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs",
            activeTab === "commandes"
              ? "bg-primary/10 border-primary"
              : "bg-card border-border hover:border-primary/50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Commandes Reçues</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-extrabold text-foreground">{quotes.length}</p>
            {pendingQuotesCount > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                {pendingQuotesCount} en attente
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Demandes de devis & livraisons</p>
        </div>

        <Link
          to="/dashboard/missions"
          className="p-4 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all shadow-xs block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Chantiers & Prestations</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{activeMissionsCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Dossiers en cours de réalisation</p>
        </Link>
      </div>

      {/* ── 3. VUE PRINCIPALE : 2 ONGLETS DIRECTS ── */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("offres")}
          className={cn(
            "px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === "offres"
              ? "bg-foreground text-background shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Package className="h-4 w-4" /> Mes Produits & Services ({offers.length})
        </button>
        <button
          onClick={() => setActiveTab("commandes")}
          className={cn(
            "px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === "commandes"
              ? "bg-foreground text-background shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-4 w-4" /> Commandes Reçues ({quotes.length})
          {pendingQuotesCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
              {pendingQuotesCount}
            </span>
          )}
        </button>
      </div>

      {/* ── CONTENU ONGLET 1 : PRODUITS ET SERVICES AVEC MODIFICATION & MÉDIAS ── */}
      {activeTab === "offres" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Gestion de votre catalogue</h2>
              <p className="text-xs text-muted-foreground">
                Cliquez sur <strong>Modifier</strong> pour changer le prix, les photos ou les vidéos de démonstration à tout moment.
              </p>
            </div>
            <Button
              onClick={openCreateOffer}
              className="gradient-primary text-primary-foreground font-bold text-xs h-10 px-4 rounded-xl gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="h-4 w-4" /> Publier un produit / service
            </Button>
          </div>

          {offers.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
              <Package className="h-10 w-10 text-muted-foreground mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-foreground">Aucune offre publiée</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                  Publiez vos engrais, semences certifiées, matériel ou prestations avec photos et vidéos pour recevoir des commandes.
                </p>
              </div>
              <Button
                onClick={openCreateOffer}
                className="gradient-primary text-primary-foreground font-bold text-xs rounded-xl"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Publier ma première offre
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-card border border-border/80 hover:border-primary/50 transition-all rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs group"
                >
                  {/* Visuel média : Images et Vidéo interactive */}
                  <div className="relative">
                    <ProductMediaViewer
                      media={offer.media}
                      fallbackImage={offer.image_url}
                      title={offer.title}
                      aspectRatio="video"
                      className="rounded-t-2xl"
                    />
                    <Badge
                      variant="outline"
                      className="absolute top-2.5 left-2.5 bg-background/90 backdrop-blur-xs text-[10px] uppercase font-bold text-primary border-primary/30 shadow-xs"
                    >
                      {offer.category.replace("_", " ")}
                    </Badge>
                    {offer.videos && offer.videos.length > 0 && (
                      <Badge className="absolute top-2.5 right-2.5 bg-emerald-600/90 text-white border-none text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <Video className="h-3 w-3" /> Vidéo
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {offer.title}
                      </h3>
                      {offer.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {offer.description}
                        </p>
                      )}
                      {offer.location_name && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate">{offer.location_name}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-foreground text-sm">
                          {offer.price_indication}
                        </span>
                        {offer.unit && (
                          <span className="text-muted-foreground text-[11px]"> / {offer.unit}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditOffer(offer)}
                          className="h-8 px-2.5 rounded-lg text-xs font-bold border-border hover:border-primary/50 hover:bg-primary/5 text-foreground flex items-center gap-1"
                          title="Modifier les informations, le prix, les photos ou vidéos"
                        >
                          <Pencil className="h-3.5 w-3.5 text-primary" />
                          <span>Modifier</span>
                        </Button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="text-muted-foreground hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Supprimer l'offre"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CONTENU ONGLET 2 : COMMANDES ET DEVIS REÇUS ── */}
      {activeTab === "commandes" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Demandes de devis & commandes directes</h2>
            <p className="text-xs text-muted-foreground">
              Les producteurs vous contactent pour vos articles. Validez en 1 clic ou appelez-les directement.
            </p>
          </div>

          {quotes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-2">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <h4 className="text-sm font-bold text-foreground">Aucune commande en attente</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Dès qu'un agriculteur ou éleveur passe commande depuis son tableau de bord, vous recevrez la notification ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map((q) => {
                const isPending = q.status === "en_attente";
                const isAccepted = q.status === "acceptee";

                return (
                  <div
                    key={q.id}
                    className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-foreground">
                          {q.requester_name || "Exploitant Agricole"}
                        </span>
                        {q.contact_phone && (
                          <Badge variant="outline" className="text-xs font-mono gap-1 px-2 py-0">
                            <Phone className="h-3 w-3 text-emerald-600" />
                            {q.contact_phone}
                          </Badge>
                        )}
                        <Badge
                          className={cn(
                            "text-[10px] font-bold px-2 py-0 border-none",
                            isPending && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                            isAccepted && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                            q.status === "refusee" && "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          )}
                        >
                          {isPending ? "À traiter" : isAccepted ? "Validée" : "Déclinée"}
                        </Badge>
                      </div>

                      <p className="text-xs text-foreground/90 font-medium">
                        Commande pour : <strong className="text-primary">{q.quantity || "Articles"}</strong>
                        {q.needed_by && (
                          <span className="text-muted-foreground"> • Souhaité avant le {q.needed_by}</span>
                        )}
                      </p>

                      {q.message && (
                        <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/50 max-w-xl">
                          "{q.message}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {q.contact_phone && (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-xs h-9 gap-1 font-bold border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        >
                          <a href={`tel:${q.contact_phone}`}>
                            <Phone className="h-3.5 w-3.5" /> Appeler
                          </a>
                        </Button>
                      )}

                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleQuoteStatus(q.id, "acceptee")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuoteStatus(q.id, "refusee")}
                            className="text-xs h-9 rounded-xl text-muted-foreground hover:text-rose-600"
                          >
                            Décliner
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL COMPLET : CRÉATION & MODIFICATION DE PRODUIT / SERVICE (PRIX, PHOTOS, VIDÉOS) ── */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              {editingOffer ? (
                <>
                  <Pencil className="h-5 w-5 text-primary" />
                  Modifier le produit / service
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Publier un produit ou service au catalogue
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Personnalisez les détails, vos tarifs, vos photos en haute résolution et vos vidéos de démonstration pour convaincre les exploitants.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveOffer} className="space-y-5 mt-3">
            {/* 1. Informations de base */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/80">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" /> Identification du Produit / Prestation
              </h3>

              <div className="space-y-1">
                <Label htmlFor="oTitle" className="text-xs font-bold text-foreground">
                  Nom du produit ou service *
                </Label>
                <Input
                  id="oTitle"
                  placeholder="Ex: Engrais minéral NPK 14-23-14, Labour tracteur 75CV, Tourteau de coton…"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  required
                  className="rounded-xl h-11 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="oCategory" className="text-xs font-bold text-foreground">
                  Catégorie
                </Label>
                <Select value={offerCategory} onValueChange={setOfferCategory}>
                  <SelectTrigger className="rounded-xl h-11 text-sm">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFER_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-xs font-medium">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 2. Tarification personnalisée */}
            <div className="space-y-3.5 p-4 rounded-2xl bg-muted/40 border border-border/80">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-primary" /> Tarification & Unité de vente
                </h3>

                {/* Badge visuel de prévisualisation en direct */}
                <Badge className="bg-primary text-primary-foreground font-extrabold text-xs shadow-xs">
                  {previewPriceDisplay}
                </Badge>
              </div>

              {/* Mode de prix */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOfferPriceType("fixed")}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                    offerPriceType === "fixed"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  Prix chiffré (FCFA)
                </button>
                <button
                  type="button"
                  onClick={() => setOfferPriceType("quote")}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                    offerPriceType === "quote"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  Sur devis / Tarif sur mesure
                </button>
              </div>

              {offerPriceType === "fixed" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="oPriceAmount" className="text-xs font-bold text-foreground">
                      Montant en FCFA
                    </Label>
                    <div className="relative">
                      <Input
                        id="oPriceAmount"
                        type="text"
                        placeholder="Ex: 22500"
                        value={offerPriceAmount}
                        onChange={(e) => setOfferPriceAmount(e.target.value)}
                        className="rounded-xl h-11 text-sm font-bold pl-3 pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-muted-foreground">
                        FCFA
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="oUnit" className="text-xs font-bold text-foreground">
                      Par unité de
                    </Label>
                    <Select value={offerUnit} onValueChange={setOfferUnit}>
                      <SelectTrigger className="rounded-xl h-11 text-sm">
                        <SelectValue placeholder="Choisir une unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((u) => (
                          <SelectItem key={u.value} value={u.value} className="text-xs">
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {offerPriceType === "fixed" && offerUnit === "autre" && (
                <div className="space-y-1">
                  <Label htmlFor="oCustomUnit" className="text-xs font-bold text-foreground">
                    Précisez l'unité personnalisée
                  </Label>
                  <Input
                    id="oCustomUnit"
                    placeholder="Ex: carton de 12 flacons, botte de 50 kg…"
                    value={offerCustomUnit}
                    onChange={(e) => setOfferCustomUnit(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
              )}
            </div>

            {/* 3. Photos et Vidéos de démonstration */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5 text-primary" /> Photos & Vidéos de Démonstration
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Importez des photos réelles de vos produits ou de courtes vidéos pour rassurer les acheteurs.
                  </p>
                </div>
                {offerMedia.length > 0 && (
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {offerMedia.length} média{offerMedia.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              {/* Uploader interactif complet d'images et vidéos */}
              <ProductMediaUploader
                media={offerMedia}
                onChange={setOfferMedia}
                maxFiles={8}
              />
            </div>

            {/* 4. Description détaillée & conditions */}
            <div className="space-y-1">
              <Label htmlFor="oDesc" className="text-xs font-bold text-foreground">
                Description détaillée & Modalités
              </Label>
              <Textarea
                id="oDesc"
                rows={3}
                placeholder="Spécifications techniques, composition, délais de livraison, zones desservies, conseils d'utilisation…"
                value={offerDesc}
                onChange={(e) => setOfferDesc(e.target.value)}
                className="rounded-xl text-xs leading-relaxed"
              />
            </div>

            {/* 5. Contact & Localisation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="oLocation" className="text-xs font-bold text-foreground">
                  Zone de service / Magasin
                </Label>
                <Input
                  id="oLocation"
                  placeholder="Ex: Ouagadougou, Bobo-Dioulasso, Koudougou…"
                  value={offerLocation}
                  onChange={(e) => setOfferLocation(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="oPhone" className="text-xs font-bold text-foreground">
                  Numéro WhatsApp / Appel
                </Label>
                <Input
                  id="oPhone"
                  placeholder="+226 70 00 00 00"
                  value={offerPhone}
                  onChange={(e) => setOfferPhone(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOfferDialogOpen(false)}
                className="rounded-xl text-xs font-bold h-11 px-5"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={savingOffer}
                className="gradient-primary text-primary-foreground font-bold text-xs rounded-xl h-11 px-6 shadow-sm"
              >
                {savingOffer
                  ? "Enregistrement..."
                  : editingOffer
                  ? "Enregistrer les modifications"
                  : "Publier l'offre au catalogue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL CHANGEMENT DE SPÉCIALISATION PARTENAIRE ── */}
      <Dialog open={isSwitchDialogOpen} onOpenChange={setIsSwitchDialogOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Changer de spécialisation métier</DialogTitle>
            <DialogDescription className="text-xs">
              Les comptes partenaires ne sont pas unifiés : chaque métier dispose de son interface sur-mesure.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {PARTNER_PROFILE_LIST.filter((p) => p.id !== "polyvalent").map((p) => {
              const isSelected = partnerType === p.id;
              const IconComp = getProfileIcon(PARTNER_PROFILES[p.id].iconName, "h-4 w-4");

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setPartnerType(p.id);
                    setIsSwitchDialogOpen(false);
                    toast.success(`Espace adapté : ${p.title}`);
                  }}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all flex items-start gap-2.5",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg shrink-0",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {IconComp}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block text-foreground truncate">
                      {p.shortLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                      {p.tagline}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
