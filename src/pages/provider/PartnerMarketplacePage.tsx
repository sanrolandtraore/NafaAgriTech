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
import { Store, Search, Phone, Mail, Globe, MapPin, Send, Eye } from "lucide-react";
import { toast } from "sonner";
import { OFFER_CATEGORIES } from "./partnerCategories";
import { partnerStorage, PartnerOffer } from "@/lib/partnerStorage";
import ProductMediaViewer from "@/components/partner/ProductMediaViewer";

const catLabel = (v: string) => OFFER_CATEGORIES.find((c) => c.value === v)?.label ?? v;

export default function PartnerMarketplacePage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<PartnerOffer | null>(null);
  const [quantity, setQuantity] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await partnerStorage.getOffers();
      setOffers(data.filter((o) => o.is_active));
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
  }, []);

  const filtered = useMemo(() => offers.filter((o) => {
    const okCat = category === "all" || o.category === category;
    const q = search.trim().toLowerCase();
    const okSearch = !q || [o.title, o.partner_name, o.description, o.location_name]
      .some((f) => f?.toLowerCase().includes(q));
    return okCat && okSearch;
  }), [offers, search, category]);

  const sendQuote = async () => {
    if (!selected) return;
    if (!phone.trim()) {
      toast.error("Veuillez renseigner votre numéro de téléphone pour être contacté.");
      return;
    }

    setSending(true);
    try {
      await partnerStorage.saveQuote({
        offer_id: selected.id,
        requester_id: user?.id || "guest-farmer",
        requester_name: user?.email ? user.email.split("@")[0] : "Producteur Agricole",
        owner_id: selected.owner_id,
        quantity: quantity.trim() || null,
        needed_by: neededBy || null,
        message: message.trim() || null,
        contact_phone: phone.trim() || null,
        offer_title: selected.title,
        partner_name: selected.partner_name,
      });

      toast.success("Demande de devis transmise avec succès au partenaire !");
      setSelected(null);
      setQuantity("");
      setNeededBy("");
      setMessage("");
      setPhone("");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi de la demande");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2.5">
          <Store className="h-7 w-7 text-primary" />
          Marché des Partenaires Agréés
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Découvrez les offres de matériels, semences, intrants certifiés et services avec <strong>démonstrations photos & vidéos</strong>.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher un produit, intrant, engin ou ville…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher une offre"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {OFFER_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-72 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucune offre ne correspond à vos critères de recherche.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} className="overflow-hidden hover:border-primary/50 transition-all flex flex-col justify-between">
              <div>
                {/* Media Viewer with Photos & Videos */}
                <ProductMediaViewer
                  media={o.media}
                  fallbackImage={o.image_url}
                  title={o.title}
                  aspectRatio="video"
                />

                <CardHeader className="p-4 pb-2">
                  <Badge variant="secondary" className="w-fit text-[11px] mb-1">
                    {catLabel(o.category)}
                  </Badge>
                  <CardTitle className="text-base font-bold line-clamp-1">{o.title}</CardTitle>
                  <p className="text-xs text-muted-foreground truncate">{o.partner_name}</p>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-2.5 text-sm">
                  {o.price_indication && (
                    <p className="text-base font-heading font-bold text-primary">
                      {o.price_indication}
                      {o.unit ? <span className="text-xs font-normal text-muted-foreground"> / {o.unit}</span> : ""}
                    </p>
                  )}
                  {o.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {o.description}
                    </p>
                  )}
                  {o.location_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" /> {o.location_name}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
                    {o.contact_phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="h-3 w-3" /> {o.contact_phone}
                      </span>
                    )}
                    {o.website && (
                      <a
                        href={o.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 underline text-primary"
                      >
                        <Globe className="h-3 w-3" /> Site web
                      </a>
                    )}
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <Button
                  className="w-full gradient-primary text-primary-foreground font-semibold shadow-xs"
                  size="sm"
                  onClick={() => {
                    setSelected(o);
                    setPhone(user?.phone || "+226 ");
                  }}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Demander un devis
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quote Request Modal */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-heading font-bold">
              Demande de devis — {selected?.title}
            </DialogTitle>
            <CardDescription className="text-xs">
              Destinataire : <strong>{selected?.partner_name}</strong>
            </CardDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="q-qty">Quantité souhaitée</Label>
              <Input
                id="q-qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="ex. 20 sacs, 5 hectares, 2 semaines…"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="q-date">Besoin prévu pour le</Label>
              <Input
                id="q-date"
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="q-phone">Votre téléphone (WhatsApp ou direct) *</Label>
              <Input
                id="q-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+226 XX XX XX XX"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="q-msg">Message / Spécifications particulières</Label>
              <Textarea
                id="q-msg"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Précisez votre localité, délai, type de sol..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Annuler
            </Button>
            <Button onClick={sendQuote} disabled={sending} className="gradient-primary text-primary-foreground font-semibold">
              {sending ? "Envoi…" : "Envoyer la demande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
