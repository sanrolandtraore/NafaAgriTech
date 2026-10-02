import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SEOHead } from "@/components/seo/SEOHead";
import { generateProductSchema, generateServiceSchema, generateWebsiteSchema } from "@/lib/seoConfig";
import PublicNavbar from "@/components/public/PublicNavbar";
import Footer from "@/components/Footer";
import { partnerStorage, PartnerOffer } from "@/lib/partnerStorage";
import {
  MapPin,
  Phone,
  Mail,
  Store,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Share2,
  Send,
  MessageCircle,
  FileText,
  ShieldCheck,
  Package,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

export default function OfferDetailPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<PartnerOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: "",
    phone: "",
    quantity: "1",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchOffer = async () => {
      try {
        setLoading(true);
        if (!offerId) return;
        const allOffers = await partnerStorage.getOffers();
        const found = allOffers.find((o) => o.id === offerId || o.title.toLowerCase().replace(/\s+/g, "-") === offerId);
        if (active) {
          if (found && found.is_active) {
            setOffer(found);
          } else {
            setOffer(null);
          }
        }
      } catch (e) {
        console.error("Erreur chargement offre :", e);
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchOffer();
    return () => {
      active = false;
    };
  }, [offerId]);

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.name || !quoteForm.phone) {
      toast.error("Veuillez renseigner votre nom et votre numéro de téléphone.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setQuoteOpen(false);
      toast.success("Votre demande de devis a été transmise directement au partenaire.");
      setQuoteForm({ name: "", phone: "", quantity: "1", message: "" });
    }, 600);
  };

  const isService = offer?.category?.includes("service") || offer?.category?.includes("machinisme");

  const pageTitle = offer
    ? `${offer.title} | ${offer.partner_name} — NAFA-AGRITECH`
    : "Offre Marketplace | NAFA-AGRITECH";

  const pageDescription = offer?.description
    ? offer.description.slice(0, 160)
    : "Offre réelle proposée par un partenaire certifié sur la Marketplace NAFA-AGRITECH.";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath={`/marketplace/${offerId || ""}`}
        noindex={!offer || !offer.is_active}
        schemaJsonLd={
          offer && offer.is_active
            ? isService
              ? generateServiceSchema({
                  name: offer.title,
                  description: pageDescription,
                  providerName: offer.partner_name,
                  category: offer.category,
                  areaServed: offer.location_name || "Burkina Faso",
                  serviceUrl: `/marketplace/${offer.id}`,
                })
              : generateProductSchema({
                  name: offer.title,
                  description: pageDescription,
                  sellerName: offer.partner_name,
                  category: offer.category,
                  imageUrl: offer.image_url || undefined,
                  productUrl: `/marketplace/${offer.id}`,
                })
            : generateWebsiteSchema()
        }
        breadcrumbs={[
          { name: "Accueil", url: "/" },
          { name: "Marketplace", url: "/marketplace" },
          { name: offer?.title || "Détail de l'offre", url: `/marketplace/${offerId || ""}` },
        ]}
      />

      <PublicNavbar />

      <main className="flex-1 py-8 sm:py-12 container max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/marketplace")}
            className="rounded-full text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour à la Marketplace</span>
          </Button>
        </div>

        {loading ? (
          <div className="py-24 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Chargement des détails de l'offre...</span>
          </div>
        ) : offer ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne Principale : Image & Description */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl overflow-hidden border border-border/80 bg-muted/30 shadow-md">
                <div className="relative h-72 sm:h-96 w-full bg-muted flex items-center justify-center">
                  <img
                    src={offer.image_url || (offer.images && offer.images[0]) || logo}
                    alt={offer.title}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = logo;
                    }}
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-emerald-600 text-white font-bold text-xs uppercase shadow-sm">
                      {offer.category.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4 bg-card">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                      Publié le {new Date(offer.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    {offer.location_name && (
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#F97316]" />
                        {offer.location_name}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground leading-tight">
                    {offer.title}
                  </h1>

                  <div className="pt-2 border-t border-border/60">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
                      Description de la prestation / du produit
                    </h2>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                      {offer.description || "Aucune description détaillée fournie par le partenaire."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne Latérale : Fiche Partenaire & CTA Devis */}
            <div className="space-y-6">
              <Card className="rounded-3xl border border-border/80 shadow-md p-6 space-y-5 bg-card">
                {/* Prix indicatif */}
                <div className="space-y-1 pb-4 border-b border-border/60">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Tarification</span>
                  <div className="text-2xl font-black text-[#F97316]">
                    {offer.price_indication ? `${offer.price_indication}` : "Sur devis"}
                    {offer.unit && (
                      <span className="text-xs font-semibold text-muted-foreground ml-1">
                        / {offer.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Identité du Partenaire */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Proposé par</span>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted border p-1 flex items-center justify-center shrink-0">
                      <Store className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground">{offer.partner_name}</h2>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Partenaire certifié
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton d'action */}
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => setQuoteOpen(true)}
                    className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-6 shadow-md gap-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Demander un devis au partenaire</span>
                  </Button>

                  {offer.contact_phone && (
                    <Button
                      variant="outline"
                      asChild
                      className="w-full rounded-2xl font-bold text-xs py-5"
                    >
                      <a href={`tel:${offer.contact_phone}`} className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4 text-[#F97316]" />
                        <span>Appeler directement</span>
                      </a>
                    </Button>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 text-[11px] text-muted-foreground leading-relaxed border">
                  <strong>Engagement qualité :</strong> Les commandes et devis sont négociés directement entre l'acheteur et le partenaire agréé sans commission cachée.
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* État non trouvé */
          <div className="py-20 px-6 rounded-3xl bg-muted/20 border-2 border-dashed border-border text-center max-w-lg mx-auto space-y-4">
            <Package className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Cette offre n'est plus disponible</h2>
            <p className="text-xs text-muted-foreground">
              L'offre demandée a été retirée ou n'est plus active.
            </p>
            <Button asChild className="rounded-full bg-emerald-600 text-white text-xs font-bold px-6">
              <Link to="/marketplace">Explorer la Marketplace</Link>
            </Button>
          </div>
        )}
      </main>

      {/* Modal Demande de devis */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Demande de devis : {offer?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transmettez vos coordonnées au partenaire {offer?.partner_name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendQuote} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Votre nom complet *</Label>
              <Input
                placeholder="Ex: Idrissa Ouédraogo"
                value={quoteForm.name}
                onChange={(e) => setQuoteForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Téléphone / WhatsApp *</Label>
              <Input
                placeholder="Ex: +226 70 00 00 00"
                value={quoteForm.phone}
                onChange={(e) => setQuoteForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Quantité ou superficie souhaitée</Label>
              <Input
                placeholder="Ex: 2 hectares, 50 sacs, 1 prestation..."
                value={quoteForm.quantity}
                onChange={(e) => setQuoteForm((prev) => ({ ...prev, quantity: e.target.value }))}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Précisions ou besoins spécifiques</Label>
              <Textarea
                placeholder="Indiquez la localisation exacte de votre champ ou exploitation, la date souhaitée..."
                value={quoteForm.message}
                onChange={(e) => setQuoteForm((prev) => ({ ...prev, message: e.target.value }))}
                rows={3}
                className="rounded-xl text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-5"
            >
              {submitting ? "Transmission..." : "Envoyer la demande de devis"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
