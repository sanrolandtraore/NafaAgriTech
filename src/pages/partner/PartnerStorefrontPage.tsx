import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  partnerStorage,
  PartnerOffer,
  PartnerProfile
} from "@/lib/partnerStorage";
import { ProductMediaViewer } from "@/components/partner/ProductMediaViewer";
import {
  Phone, Mail, MessageCircle, Share2, MapPin, CheckCircle2, ShieldCheck,
  Search, ArrowLeft, Store, Package, Tractor, Beef, FileText, Send, Sparkles, Globe, Award,
  Sprout, Wheat, ClipboardList, ShieldAlert, LayoutDashboard
} from "lucide-react";
import logo from "@/assets/logo.png";
import { PartnerVerifiedBadge } from "@/components/partner/PartnerVerifiedBadge";
import { getStoredPartnerKyc, PartnerKycDossier } from "@/lib/partnerKyc";
import { useAuth } from "@/contexts/AuthContext";

export default function PartnerStorefrontPage() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const { user, primaryRole, partnerType } = useAuth();
  const isPartner = !!user && (primaryRole === "partenaire" || primaryRole === "agent_technique" || primaryRole === "expert" || primaryRole === "formation" || (partnerType != null && partnerType !== ""));

  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [kyc, setKyc] = useState<PartnerKycDossier>(() => getStoredPartnerKyc(partnerId || "current"));

  useEffect(() => {
    const handleKycUpdate = () => {
      setKyc(getStoredPartnerKyc(partnerId || "current"));
    };
    window.addEventListener("nafa-partner-kyc-updated", handleKycUpdate);
    return () => window.removeEventListener("nafa-partner-kyc-updated", handleKycUpdate);
  }, [partnerId]);

  // Quote / Order Modal state
  const [selectedOffer, setSelectedOffer] = useState<PartnerOffer | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    requester_name: "",
    contact_phone: "",
    quantity: "1",
    needed_by: "",
    message: "",
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);

  const loadStorefront = async () => {
    setLoading(true);
    try {
      const targetId = partnerId || "demo-partner-id";
      const [p, o] = await Promise.all([
        partnerStorage.getPartnerProfile(targetId),
        partnerStorage.getOffersByPartner(targetId),
      ]);
      setPartner(p);
      setOffers(o);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger la vitrine du partenaire.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorefront();
  }, [partnerId]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: partner?.name || "Vitrine Partenaire NAFA - AGRITECH",
          text: `Découvrez les produits et services de ${partner?.name} sur NAFA - AGRITECH :`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Lien de la vitrine copié dans le presse-papier !");
  };

  const handleOpenQuote = (offer: PartnerOffer) => {
    setSelectedOffer(offer);
    setQuoteForm({
      requester_name: "",
      contact_phone: "",
      quantity: "1",
      needed_by: "",
      message: `Bonjour, je suis intéressé par votre offre « ${offer.title} ». Merci de m'indiquer vos disponibilités.`,
    });
    setQuoteOpen(true);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !partner) return;
    if (!quoteForm.contact_phone.trim()) {
      toast.error("Veuillez renseigner votre numéro de téléphone pour être recontacté.");
      return;
    }

    setSubmittingQuote(true);
    try {
      await partnerStorage.saveQuote({
        offer_id: selectedOffer.id,
        owner_id: selectedOffer.owner_id || partner.id,
        requester_id: "public-client",
        requester_name: quoteForm.requester_name.trim() || "Producteur Agricole",
        contact_phone: quoteForm.contact_phone.trim(),
        quantity: quoteForm.quantity.trim(),
        needed_by: quoteForm.needed_by || null,
        message: quoteForm.message.trim(),
        offer_title: selectedOffer.title,
        partner_name: partner.name,
      });

      toast.success("Votre demande a été transmise avec succès au partenaire !");
      setQuoteOpen(false);
    } catch {
      toast.error("Erreur lors de l'envoi de la demande.");
    } finally {
      setSubmittingQuote(false);
    }
  };

  const categories: { id: string; label: string; icon?: React.ElementType }[] = [
    { id: "all", label: "Toutes les offres", icon: Store },
    { id: "materiel", label: "Matériel & Travaux", icon: Tractor },
    { id: "intrants", label: "Intrants & Bio-intrants", icon: Sprout },
    { id: "semences", label: "Semences Certifiées", icon: Wheat },
    { id: "elevage", label: "Élevage & Nutrition", icon: Beef },
    { id: "service", label: "Expertise & Conseil", icon: ClipboardList },
  ];

  const filteredOffers = offers.filter((o) => {
    const matchesCat = selectedCategory === "all" || o.category === selectedCategory;
    const matchesSearch =
      search === "" ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      (o.description && o.description.toLowerCase().includes(search.toLowerCase())) ||
      (o.location_name && o.location_name.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const cleanPhone = (p: string) => p.replace(/[^0-9+]/g, "");

  if (isPartner) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-xl w-full bg-card rounded-3xl border border-border/80 p-6 sm:p-8 text-center space-y-6 shadow-sm">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-foreground">
              Accès Vitrine Non Autorisé aux Partenaires
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La vitrine marketplace est exclusivement réservée aux <strong>agriculteurs et éleveurs</strong> pour acheter des intrants, louer des équipements ou demander des prestations.
            </p>
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/60 text-left text-xs text-muted-foreground space-y-2 mt-4">
              <p className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                <Store className="h-4 w-4 text-emerald-600" />
                Votre Espace Personnel & Tableau de Bord Dédié :
              </p>
              <p className="leading-relaxed">
                En tant que partenaire, vous disposez exclusivement de votre <strong>Espace Personnel</strong> et de votre <strong>Tableau de Bord</strong> pour publier et modifier vos services et produits, traiter les devis reçus et piloter votre activité.
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
                <LayoutDashboard className="h-4 w-4 mr-2" /> Mon Tableau de Bord
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <img src={logo} alt="NAFA - AGRITECH" className="h-12 w-auto mx-auto animate-pulse" />
          <p className="text-sm font-medium text-muted-foreground">Chargement de la vitrine partenaire…</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-6 space-y-4">
          <Store className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-heading font-bold">Partenaire introuvable</h2>
          <p className="text-sm text-muted-foreground">Cette sous-page de partenaire n'existe pas ou n'est plus active.</p>
          <Button asChild className="gradient-primary text-primary-foreground">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/80 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <img src={logo} alt="NAFA - AGRITECH" className="h-7 w-auto" />
            <span className="hidden sm:inline">Accueil NAFA - AGRITECH</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleShare} className="text-xs gap-1.5 rounded-xl">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Partager la vitrine</span>
            </Button>
            <Button asChild size="sm" className="gradient-primary text-primary-foreground text-xs font-semibold rounded-xl">
              <Link to="/auth">Connexion / Espace Pro</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner with Partner Profile */}
      <div className="relative">
        <div className="h-48 md:h-64 w-full bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 relative overflow-hidden">
          <img
            src={partner.cover}
            alt="Couverture"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-20">
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-background bg-muted overflow-hidden shrink-0 shadow-lg">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">
                      {partner.name}
                    </h1>
                    <PartnerVerifiedBadge
                      isVerified={partner.verified || kyc.status === "verifie"}
                      kyc={kyc}
                      partnerName={partner.name}
                      size="sm"
                      variant="pill"
                    />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-primary flex items-center gap-1.5">
                    <Store className="h-4 w-4" /> {partner.category}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" /> {partner.location}
                  </p>
                </div>
              </div>

              {/* Direct Communication Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {partner.phone && (
                  <Button asChild size="sm" className="gradient-primary text-primary-foreground font-semibold rounded-xl gap-2 shadow-xs">
                    <a href={`tel:${cleanPhone(partner.phone)}`}>
                      <Phone className="h-4 w-4" /> Appeler
                    </a>
                  </Button>
                )}
                {partner.whatsapp && (
                  <Button asChild size="sm" variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 font-semibold rounded-xl gap-2">
                    <a
                      href={`https://wa.me/${cleanPhone(partner.whatsapp).replace("+", "")}?text=Bonjour%20${encodeURIComponent(partner.name)}%2C%20je%20vous%20contacte%20depuis%20votre%20vitrine%20NAFA%20-%20AGRITECH.`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}
                {partner.email && (
                  <Button asChild size="sm" variant="outline" className="rounded-xl gap-2 text-xs font-medium">
                    <a href={`mailto:${partner.email}`}>
                      <Mail className="h-4 w-4" /> Email
                    </a>
                  </Button>
                )}
                {partner.website && (
                  <Button asChild size="sm" variant="ghost" className="rounded-xl gap-2 text-xs font-medium">
                    <a href={partner.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" /> Site Web
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Certification & Trust Banner */}
            {(partner.verified || kyc.status === "verifie") && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      Partenaire Certifié & Agréé NAFA - AGRITECH
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline" />
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Matricule officiel : <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{kyc.certificationId || "NAFA-CERT-2026-BF"}</span> · {kyc.type === "personne_morale" ? `Personne Morale (${kyc.moraleData.legalForm})` : "Personne Physique Accréditée"} · Garantie Anti-fraude & Conformité
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 shrink-0 hidden sm:inline-flex">
                  Compte Vérifié
                </Badge>
              </div>
            )}

            {/* Description */}
            <div className="pt-2 border-t border-border/60">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {partner.description}
              </p>
            </div>

            {/* Quick Guarantees & Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 text-center">
                <p className="text-xs font-semibold text-muted-foreground">Catalogue actif</p>
                <p className="text-xl font-heading font-bold text-foreground mt-0.5">{offers.length} offre(s)</p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 text-center">
                <p className="text-xs font-semibold text-muted-foreground">Zone couverte</p>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 line-clamp-1">{partner.location.split(",")[0]}</p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 text-center">
                <p className="text-xs font-semibold text-muted-foreground">Paiement sécurisé</p>
                <p className="text-xs font-bold text-foreground mt-1">Mobile Money</p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 text-center">
                <p className="text-xs font-semibold text-muted-foreground">Attestation NAFA - AGRITECH</p>
                <p className="text-xs font-bold text-primary mt-1">Agréé & Vérifié</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Catalogue Produits, Matériels & Services
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Commandez en direct ou demandez un devis sans intermédiaire
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit ou service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <Button
                key={c.id}
                variant={selectedCategory === c.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(c.id)}
                className="text-xs rounded-xl h-8 shrink-0 whitespace-nowrap gap-1.5"
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span>{c.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <Card className="rounded-2xl border-dashed p-10 text-center space-y-3">
            <Store className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold">Aucun article ne correspond à votre recherche.</p>
            <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSelectedCategory("all"); }}>
              Réinitialiser les filtres
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <Card
                key={offer.id}
                className="rounded-3xl border border-border/80 overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all flex flex-col justify-between bg-card group"
              >
                <div>
                  {/* Media Banner with Photos & Video Player */}
                  <ProductMediaViewer
                    title={offer.title}
                    images={offer.images && offer.images.length > 0 ? offer.images : offer.image_url ? [offer.image_url] : []}
                    videos={offer.videos || []}
                    media={offer.media || []}
                    className="h-48 w-full"
                  />

                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider bg-muted/60">
                        {offer.category}
                      </Badge>
                      {offer.location_name && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 line-clamp-1">
                          <MapPin className="h-3 w-3 shrink-0" /> {offer.location_name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                      {offer.title}
                    </h3>

                    {offer.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {offer.description}
                      </p>
                    )}

                    {offer.price_indication && (
                      <div className="pt-2 border-t border-border/60 flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Prix unitaire</span>
                        <span className="text-base font-heading font-extrabold text-primary">
                          {offer.price_indication} {offer.unit ? `/ ${offer.unit}` : ""}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-5 pt-0">
                  <Button
                    type="button"
                    onClick={() => handleOpenQuote(offer)}
                    className="w-full gradient-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-xs gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> Commander / Demander un devis
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Quote / Order Modal */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Commander ou Demander un Devis</DialogTitle>
            <DialogDescription className="text-xs">
              Votre demande sera directement adressée à <strong>{partner.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedOffer && (
            <form onSubmit={handleSubmitQuote} className="space-y-4 pt-2">
              <div className="p-3 rounded-xl bg-muted/60 border text-xs space-y-1">
                <p className="font-semibold text-foreground line-clamp-1">{selectedOffer.title}</p>
                {selectedOffer.price_indication && (
                  <p className="font-extrabold text-primary text-sm">
                    {selectedOffer.price_indication} {selectedOffer.unit ? `/ ${selectedOffer.unit}` : ""}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Votre nom complet *</Label>
                <Input
                  required
                  placeholder="Ex : M. Ouédraogo Souleymane"
                  value={quoteForm.requester_name}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, requester_name: e.target.value }))}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Numéro de téléphone WhatsApp / Appel *</Label>
                <Input
                  required
                  type="tel"
                  placeholder="+226 70 00 00 00"
                  value={quoteForm.contact_phone}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Quantité / Hectares</Label>
                  <Input
                    placeholder="Ex : 2 sacs, 5 ha"
                    value={quoteForm.quantity}
                    onChange={(e) => setQuoteForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Date souhaitée</Label>
                  <Input
                    type="date"
                    value={quoteForm.needed_by}
                    onChange={(e) => setQuoteForm((f) => ({ ...f, needed_by: e.target.value }))}
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Détails de la demande / Localité</Label>
                <Textarea
                  rows={3}
                  value={quoteForm.message}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, message: e.target.value }))}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Garantie Séquestre NAFA - AGRITECH :</strong> Aucun paiement anticipé n'est débloqué sans votre confirmation de réception ou de réalisation.
                </span>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setQuoteOpen(false)} className="rounded-xl text-xs">
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={submittingQuote} className="gradient-primary text-primary-foreground font-semibold rounded-xl text-xs gap-1.5">
                  <Send className="h-3.5 w-3.5" /> {submittingQuote ? "Envoi en cours…" : "Envoyer ma demande"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
