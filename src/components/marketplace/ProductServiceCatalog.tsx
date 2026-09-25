import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { partnerStorage, PartnerOffer, QuoteRequest } from "@/lib/partnerStorage";
import { getEffectiveUserId } from "@/lib/deviceIdentity";
import ProductMediaViewer from "@/components/partner/ProductMediaViewer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  ShoppingCart,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Send,
  Calendar,
  X,
  FileText,
  Trash2,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
  FlaskConical,
  Sprout,
  Wheat,
  Syringe,
  Tractor,
  Wrench,
  Landmark,
  ClipboardList,
} from "lucide-react";

export interface ProductServiceCatalogProps {
  initialCategory?: string;
  title?: string;
  description?: string;
  defaultRole?: "agriculteur" | "eleveur" | "all";
  compact?: boolean;
}

const CATEGORY_TABS = [
  { value: "all", label: "Toutes les offres", icon: Layers },
  { value: "intrants", label: "Intrants & Engrais", match: ["intrants"], icon: FlaskConical },
  { value: "semences", label: "Semences Certifiées", match: ["semences"], icon: Sprout },
  { value: "aliments_elevage", label: "Aliments Bétail", match: ["aliments_elevage", "elevage"], icon: Wheat },
  { value: "sante_veterinaire", label: "Soins Vétérinaires", match: ["sante_veterinaire", "sante_animale"], icon: Syringe },
  { value: "materiel", label: "Matériel & Équipements", match: ["materiel", "materiel_elevage"], icon: Tractor },
  { value: "services", label: "Services & Travaux", match: ["services", "services_elevage", "service"], icon: Wrench },
  { value: "finance", label: "Financement & Assurance", match: ["finance", "assurance", "banque"], icon: Landmark },
  { value: "mes_commandes", label: "Mes Commandes", isOrders: true, icon: ClipboardList },
];

const quoteStatusConfig: Record<string, { label: string; badgeClass: string; icon: any }> = {
  en_attente: {
    label: "Demande transmise",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  acceptee: {
    label: "Commande validée",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  refusee: {
    label: "Indisponible",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    icon: X,
  },
  cloturee: {
    label: "Clôturée",
    badgeClass: "bg-muted text-muted-foreground border-border",
    icon: CheckCircle2,
  },
};

export default function ProductServiceCatalog({
  initialCategory = "all",
  title = "Catalogue des Produits & Services Partenaires",
  description = "Sélectionnez vos semences, engrais, provendes, soins vétérinaires ou prestations mécanisées directement.",
  defaultRole = "all",
  compact = false,
}: ProductServiceCatalogProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [myQuotes, setMyQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Selection & Order Modal
  const [selectedOffer, setSelectedOffer] = useState<PartnerOffer | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [orderForm, setOrderForm] = useState({
    quantity: "1",
    needed_by: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    delivery_location: "",
    contact_phone: "",
    notes: "",
  });

  const loadData = async () => {
    try {
      const [allOffers, allQuotes] = await Promise.all([
        partnerStorage.getOffers(),
        partnerStorage.getQuotes(),
      ]);
      setOffers(allOffers.filter((o) => o.is_active));
      const currentUserId = getEffectiveUserId(user?.id);
      const userQuotes = allQuotes.filter(
        (q) => q.requester_id === currentUserId || (user && q.requester_id === user.id)
      );
      setMyQuotes(userQuotes);
    } catch (err) {
      console.error("Erreur de chargement du catalogue:", err);
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

  // Pre-fill phone if available in profile
  useEffect(() => {
    if (profile?.phone && !orderForm.contact_phone) {
      setOrderForm((prev) => ({ ...prev, contact_phone: profile.phone || "" }));
    }
  }, [profile]);

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      // Category filter
      if (selectedCategory !== "all") {
        const catConfig = CATEGORY_TABS.find((c) => c.value === selectedCategory);
        if (catConfig?.match) {
          if (!catConfig.match.includes(o.category)) return false;
        } else if (o.category !== selectedCategory) {
          return false;
        }
      }

      // Search query filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = o.title.toLowerCase().includes(q);
        const matchDesc = (o.description || "").toLowerCase().includes(q);
        const matchPartner = o.partner_name.toLowerCase().includes(q);
        const matchLoc = (o.location_name || "").toLowerCase().includes(q);
        return matchTitle || matchDesc || matchPartner || matchLoc;
      }

      return true;
    });
  }, [offers, selectedCategory, search]);

  const handleOpenOrder = (offer: PartnerOffer) => {
    setSelectedOffer(offer);
    setOrderForm({
      quantity: "1",
      needed_by: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      delivery_location: profile?.city || "",
      contact_phone: profile?.phone || "",
      notes: "",
    });
    setOrderModalOpen(true);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;

    if (!orderForm.contact_phone.trim()) {
      toast.error("Veuillez renseigner votre numéro de téléphone pour que le partenaire puisse vous contacter.");
      return;
    }

    setSubmitting(true);
    try {
      const requesterName =
        profile?.full_name || profile?.display_name || user?.email?.split("@")[0] || "Exploitant Agricole";

      const quoteMessage = `Commande directe : ${selectedOffer.title}. Quantité : ${orderForm.quantity} ${
        selectedOffer.unit || "unité(s)"
      }. Livraison : ${orderForm.delivery_location || "Non précisée"}. Précisions : ${
        orderForm.notes || "Aucune remarque spécifique."
      }`;

      await partnerStorage.saveQuote({
        offer_id: selectedOffer.id,
        requester_id: getEffectiveUserId(user?.id),
        requester_name: requesterName,
        owner_id: selectedOffer.owner_id || "partner-agritech",
        quantity: `${orderForm.quantity} ${selectedOffer.unit || "unité(s)"}`,
        needed_by: orderForm.needed_by || null,
        contact_phone: orderForm.contact_phone.trim(),
        message: quoteMessage,
        offer_title: selectedOffer.title,
        partner_name: selectedOffer.partner_name,
        status: "en_attente",
      });

      toast.success(
        `Commande transmise avec succès à ${selectedOffer.partner_name} ! Vous serez recontacté au ${orderForm.contact_phone}.`
      );
      setOrderModalOpen(false);
      setSelectedOffer(null);
      await loadData();
      // Auto-switch to my orders tab to view status
      setSelectedCategory("mes_commandes");
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la transmission de la commande : " + (err?.message || "Veuillez réessayer"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelQuote = async (id: string) => {
    if (!confirm("Voulez-vous vraiment annuler cette demande ?")) return;
    try {
      await partnerStorage.updateQuoteStatus(id, "refusee", "Annulée par l'exploitant");
      toast.success("Demande annulée.");
      await loadData();
    } catch (err) {
      toast.error("Erreur lors de l'annulation.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Écosystème Partenaires Officiels
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            {title}
          </h2>
          <p className="text-base text-muted-foreground mt-1 max-w-3xl font-medium">{description}</p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-10 px-4 rounded-xl border-border hover:border-primary/40 text-sm font-semibold flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Category Filter Pills (Direct Switcher sans nav imbriquée) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((cat) => {
          const isActive = selectedCategory === cat.value;
          const count = cat.isOrders
            ? myQuotes.length
            : cat.value === "all"
            ? offers.length
            : offers.filter((o) => (cat.match ? cat.match.includes(o.category) : o.category === cat.value)).length;

          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-premium"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {(() => {
                const CatIcon = cat.icon;
                return CatIcon ? <CatIcon className="h-4 w-4 shrink-0" /> : null;
              })()}
              <span>{cat.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                  isActive ? "bg-white/20 text-white" : "bg-muted text-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1 : MES COMMANDES & DEVIS */}
      {selectedCategory === "mes_commandes" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Mes Commandes & Demandes de Devis ({myQuotes.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="text-xs font-bold rounded-lg"
            >
              Retourner au catalogue
            </Button>
          </div>

          {myQuotes.length === 0 ? (
            <Card className="card-premium text-center py-12">
              <CardContent className="space-y-3">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-lg font-bold text-foreground">Vous n'avez pas encore passé de commande</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Sélectionnez les semences certifiées, engrais, provendes ou prestations dont vous avez besoin sur le
                  catalogue ci-dessus.
                </p>
                <Button
                  onClick={() => setSelectedCategory("all")}
                  className="mt-2 gradient-primary text-primary-foreground font-bold rounded-xl"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Explorer le catalogue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myQuotes.map((q) => {
                const conf = quoteStatusConfig[q.status] || quoteStatusConfig["en_attente"];
                const StatusIcon = conf.icon;
                return (
                  <Card key={q.id} className="card-premium border-border/80 hover:border-primary/40 transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-bold text-foreground leading-snug">
                            {q.offer_title || "Commande Produit / Prestation"}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Fournisseur :{" "}
                            <strong className="text-foreground">{q.partner_name || "Partenaire NAFA - AGRITECH"}</strong>
                          </p>
                        </div>
                        <Badge variant="outline" className={`font-bold px-2.5 py-1 text-xs shrink-0 ${conf.badgeClass}`}>
                          <StatusIcon className="h-3.5 w-3.5 mr-1" />
                          {conf.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-xl border border-border/50">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Quantité demandée</span>
                          <span className="font-bold text-foreground text-sm">{q.quantity || "1 unité"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Date souhaitée</span>
                          <span className="font-bold text-foreground text-sm">
                            {q.needed_by ? new Date(q.needed_by).toLocaleDateString("fr-FR") : "Dès que possible"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Téléphone fourni</span>
                          <span className="font-semibold text-foreground">{q.contact_phone || "Non renseigné"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Date de commande</span>
                          <span className="font-semibold text-foreground">
                            {new Date(q.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>

                      {q.message && (
                        <div className="text-xs text-muted-foreground bg-background p-2.5 rounded-lg border border-border/40">
                          <span className="font-bold text-foreground block mb-0.5">Détail :</span>
                          {q.message}
                        </div>
                      )}

                      {q.response && (
                        <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                          <span className="font-bold block mb-0.5 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Réponse du partenaire :
                          </span>
                          {q.response}
                        </div>
                      )}

                      {q.status === "en_attente" && (
                        <div className="flex justify-end pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelQuote(q.id)}
                            className="text-xs text-destructive hover:bg-destructive/10 h-8"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Annuler la demande
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2 : CATALOGUE PRODUITS & SERVICES */
        <div className="space-y-6">
          {selectedCategory === "sante_veterinaire" && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Syringe className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-foreground text-base">
                    Module Spécialisé — Cabinets & Docteurs Vétérinaires Agréés (ONV-BF)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                    Consultez l'annuaire officiel des partenaires vétérinaires certifiés : fiches cabinets, tarifs officiels (FCFA), zones d'intervention, urgences 24/7 et réservation directe d'actes zootechniques.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/dashboard/veterinary-services")}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 shadow-xs"
              >
                Consulter les Cabinets Partenaires
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par produit, intrant, engrais, aliment bétail, localité ou partenaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-12 pr-10 text-base font-medium rounded-2xl border-border bg-card shadow-xs focus:border-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Catalog grid */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredOffers.length === 0 ? (
            <Card className="card-premium text-center py-16">
              <CardContent className="space-y-3">
                <Package className="h-14 w-14 mx-auto text-muted-foreground/40" />
                <h3 className="text-xl font-bold text-foreground">Aucun produit ou service trouvé</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Aucun résultat ne correspond à votre filtre actuel. Essayez d'élargir la recherche ou sélectionnez
                  "Toutes les offres".
                </p>
                <Button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearch("");
                  }}
                  variant="outline"
                  className="mt-2 font-bold rounded-xl"
                >
                  Afficher tout le catalogue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => (
                <Card
                  key={offer.id}
                  className="card-premium flex flex-col justify-between overflow-hidden border-border/80 hover:border-primary/50 transition-all hover:shadow-premium group"
                >
                  <div>
                    {/* Media / Photo */}
                    <div className="relative overflow-hidden rounded-t-2xl">
                      <ProductMediaViewer
                        media={offer.media}
                        fallbackImage={offer.image_url}
                        title={offer.title}
                        aspectRatio="video"
                        className="rounded-t-2xl group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-3 left-3 bg-background/90 backdrop-blur-md text-foreground border-border text-xs font-extrabold capitalize shadow-xs">
                        {offer.category.replace("_", " ")}
                      </Badge>
                    </div>

                    <CardHeader className="p-4 pb-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="truncate">{offer.partner_name}</span>
                      </div>
                      <CardTitle className="text-lg font-heading font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {offer.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 space-y-3">
                      {offer.description && (
                        <p className="text-xs text-muted-foreground font-medium line-clamp-3 leading-relaxed">
                          {offer.description}
                        </p>
                      )}

                      {offer.location_name && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{offer.location_name}</span>
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* Card footer with Price and CTA */}
                  <div className="p-4 border-t border-border/80 bg-muted/20 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-bold">
                          Tarif indicatif
                        </span>
                        <span className="text-lg font-extrabold text-primary">
                          {offer.price_indication || "Sur devis"}
                        </span>
                      </div>
                      {offer.unit && (
                        <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                          / {offer.unit}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleOpenOrder(offer)}
                        className="flex-1 h-11 text-sm font-extrabold rounded-xl gradient-primary text-primary-foreground shadow-premium hover:opacity-95"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Sélectionner / Commander
                      </Button>
                      {offer.contact_phone && (
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 rounded-xl shrink-0 border-border hover:border-primary/50 text-foreground"
                          title={`Appeler ${offer.partner_name}`}
                        >
                          <a href={`tel:${offer.contact_phone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SELECTION & ORDER MODAL */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-6 rounded-3xl">
          <DialogHeader className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider w-fit">
              <ShoppingCart className="h-3.5 w-3.5" /> Commande Directe & Devis
            </div>
            <DialogTitle className="text-xl md:text-2xl font-heading font-extrabold text-foreground">
              Sélectionner ce produit / service
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Votre demande sera transmise en temps réel au partenaire fournisseur agréé.
            </DialogDescription>
          </DialogHeader>

          {selectedOffer && (
            <form onSubmit={handleSubmitOrder} className="space-y-5 pt-2">
              {/* Product summary card */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/80 flex items-start gap-4">
                {selectedOffer.image_url ? (
                  <img
                    src={selectedOffer.image_url}
                    alt={selectedOffer.title}
                    className="h-16 w-16 rounded-xl object-cover shrink-0 border border-border/80"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> {selectedOffer.partner_name}
                  </span>
                  <h4 className="font-bold text-foreground text-sm leading-snug line-clamp-2 mt-0.5">
                    {selectedOffer.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-extrabold text-primary">
                      {selectedOffer.price_indication || "Tarif sur devis"}
                    </span>
                    {selectedOffer.unit && (
                      <span className="text-xs text-muted-foreground">/ {selectedOffer.unit}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-foreground">
                    Quantité souhaitée ({selectedOffer.unit || "unités"}) *
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                    className="h-11 rounded-xl text-base font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-foreground">Date souhaitée de mise à disposition</Label>
                  <Input
                    type="date"
                    value={orderForm.needed_by}
                    onChange={(e) => setOrderForm({ ...orderForm, needed_by: e.target.value })}
                    className="h-11 rounded-xl text-base font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-foreground">Numéro de téléphone de contact *</Label>
                  <Input
                    type="tel"
                    required
                    placeholder="+226 XX XX XX XX"
                    value={orderForm.contact_phone}
                    onChange={(e) => setOrderForm({ ...orderForm, contact_phone: e.target.value })}
                    className="h-11 rounded-xl text-base font-semibold"
                  />
                  <span className="text-[11px] text-muted-foreground">Le fournisseur vous appellera pour confirmation.</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-foreground">Lieu / Commune de livraison</Label>
                  <Input
                    type="text"
                    placeholder="Ex: Bobo-Dioulasso, Koubri, Koudougou..."
                    value={orderForm.delivery_location}
                    onChange={(e) => setOrderForm({ ...orderForm, delivery_location: e.target.value })}
                    className="h-11 rounded-xl text-base font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-foreground">Précisions ou instructions complémentaires</Label>
                <Textarea
                  placeholder="Ex: Livraison en bordure de parcelle, conditionnement en sacs de 50 kg, besoin d'un chauffeur expérimenté..."
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  rows={3}
                  className="rounded-xl text-sm font-medium"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOrderModalOpen(false)}
                  className="h-11 rounded-xl font-bold"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-11 px-6 rounded-xl gradient-primary text-primary-foreground font-extrabold shadow-premium"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Transmission en cours..." : "Confirmer ma commande"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
