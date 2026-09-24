import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Trash2, Pencil, Search, Store, Video, Image as ImageIcon, Phone, MapPin, Tag, Copy, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";
import { OFFER_CATEGORIES } from "./partnerCategories";
import { partnerStorage, PartnerOffer, MediaItem } from "@/lib/partnerStorage";
import ProductMediaUploader from "@/components/partner/ProductMediaUploader";
import ProductMediaViewer from "@/components/partner/ProductMediaViewer";

const emptyForm = {
  partner_name: "",
  category: "intrants",
  title: "",
  description: "",
  price_indication: "",
  unit: "",
  location_name: "",
  contact_phone: "",
  contact_email: "",
  website: "",
  media: [] as MediaItem[],
};

export default function MyOffersPage() {
  const { user, profile } = useAuth();
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerOffer | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await partnerStorage.getOffers(user?.id);
      setOffers(data);
    } catch (e) {
      console.error("Error loading offers", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
    const handleUpdate = () => loadOffers();
    window.addEventListener("nafa-partner-data-updated", handleUpdate);
    return () => window.removeEventListener("nafa-partner-data-updated", handleUpdate);
  }, [user]);

  const setField = (k: keyof typeof emptyForm, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      partner_name: profile?.full_name || "Mon Entreprise Agricole",
      contact_phone: profile?.phone || "+226 ",
      media: [],
    });
    setOpen(true);
  };

  const openEdit = (o: PartnerOffer) => {
    setEditing(o);
    setForm({
      partner_name: o.partner_name,
      category: o.category,
      title: o.title,
      description: o.description ?? "",
      price_indication: o.price_indication ?? "",
      unit: o.unit ?? "",
      location_name: o.location_name ?? "",
      contact_phone: o.contact_phone ?? "",
      contact_email: o.contact_email ?? "",
      website: o.website ?? "",
      media: o.media || [],
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Veuillez saisir le titre de votre produit ou service.");
      return;
    }
    if (!form.partner_name.trim()) {
      toast.error("Veuillez indiquer le nom de votre entreprise.");
      return;
    }

    setSaving(true);
    try {
      await partnerStorage.saveOffer({
        id: editing?.id,
        owner_id: user?.id || "demo-partner-id",
        partner_name: form.partner_name.trim(),
        category: form.category,
        title: form.title.trim(),
        description: form.description || null,
        price_indication: form.price_indication || null,
        unit: form.unit || null,
        location_name: form.location_name || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        website: form.website || null,
        media: form.media,
      });

      toast.success(editing ? "Offre mise à jour avec succès !" : "Nouvelle offre publiée avec succès !");
      setOpen(false);
      loadOffers();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (o: PartnerOffer) => {
    const newState = await partnerStorage.toggleOfferActive(o.id);
    toast.info(newState ? "Offre publiée en ligne" : "Offre masquée");
    loadOffers();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Confirmez-vous la suppression de ce produit / service ?")) {
      await partnerStorage.deleteOffer(id);
      toast.success("Offre supprimée du catalogue");
      loadOffers();
    }
  };

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const matchCat = categoryFilter === "all" || o.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        o.title.toLowerCase().includes(q) ||
        (o.description || "").toLowerCase().includes(q) ||
        (o.location_name || "").toLowerCase().includes(q) ||
        o.partner_name.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [offers, searchQuery, categoryFilter]);

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2.5">
            <Store className="h-7 w-7 text-primary" />
            Mes Produits & Services ({offers.length})
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publiez vos offres avec <strong>photos et vidéos démonstratives</strong> pour les agriculteurs et éleveurs.
          </p>
        </div>
        <Button onClick={openNew} className="gradient-primary text-primary-foreground font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Publier un produit / service
        </Button>
      </div>

      {/* Storefront Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-primary/5 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Store className="h-3.5 w-3.5" /> Votre Vitrine Partenaire Dédiée & URL Unique
          </div>
          <h2 className="text-base font-heading font-bold text-foreground">
            Boutique publique NAFA - AGRITECH en ligne
          </h2>
          <p className="text-xs text-muted-foreground">
            Toutes vos offres validées sont visibles sur votre lien unique, ainsi que dans le catalogue des agriculteurs et la page d'accueil.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-semibold"
            onClick={() => {
              const url = `${window.location.origin}/partenaire/${user?.id || 'demo-partner-id'}`;
              navigator.clipboard.writeText(url);
              toast.success("Lien unique de votre vitrine copié !");
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Copier mon lien
          </Button>
          <Button
            asChild
            size="sm"
            className="gradient-primary text-primary-foreground text-xs font-semibold gap-2 shadow-xs"
          >
            <Link to={`/partenaire/${user?.id || 'demo-partner-id'}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" /> Voir ma vitrine publique
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, mot-clé, ville…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

      {/* Offers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-72 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <Package className="h-12 w-12 text-muted-foreground/60 mx-auto" />
            <h3 className="font-heading font-semibold text-lg">Aucun produit ou service trouvé</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ajoutez vos engrais, semences certifiées, matériels à louer ou prestations avec des photos et vidéos.
            </p>
            <Button onClick={openNew} variant="outline" className="mt-2">
              <Plus className="h-4 w-4 mr-1.5" /> Créer ma première offre
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((o) => (
            <Card key={o.id} className="overflow-hidden hover:border-primary/50 transition-all flex flex-col justify-between">
              <div>
                {/* Media Viewer Component (Images + Videos) */}
                <ProductMediaViewer
                  media={o.media}
                  fallbackImage={o.image_url}
                  title={o.title}
                  aspectRatio="video"
                />

                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[11px] capitalize">
                      {OFFER_CATEGORIES.find((c) => c.value === o.category)?.label || o.category}
                    </Badge>
                    <Badge variant={o.is_active ? "secondary" : "outline"} className="text-[11px] flex items-center gap-1.5">
                      {o.is_active ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" /> En ligne
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 shrink-0" /> Masquée
                        </>
                      )}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold line-clamp-1 mt-1">
                    {o.title}
                  </CardTitle>
                  <CardDescription className="text-xs truncate flex items-center gap-1">
                    <span>{o.partner_name}</span>
                    {o.location_name && (
                      <span className="flex items-center gap-0.5 text-muted-foreground">
                        · <MapPin className="h-3 w-3 shrink-0" /> {o.location_name}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-2">
                  {o.price_indication && (
                    <p className="text-base font-heading font-bold text-primary">
                      {o.price_indication}
                      {o.unit ? <span className="text-xs font-normal text-muted-foreground"> / {o.unit}</span> : ""}
                    </p>
                  )}
                  {o.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {o.description}
                    </p>
                  )}
                  {o.contact_phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                      <Phone className="h-3 w-3 text-primary" /> {o.contact_phone}
                    </p>
                  )}
                </CardContent>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 pt-2 border-t bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={o.is_active}
                    onCheckedChange={() => handleToggleActive(o)}
                    aria-label="Statut en ligne"
                  />
                  <span className="text-xs text-muted-foreground font-medium">
                    {o.is_active ? "Visible" : "Cachée"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(o)} className="h-8 text-xs">
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(o.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog with ProductMediaUploader */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {editing ? "Modifier le produit / service" : "Publier une nouvelle offre"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Media Uploader: Images & Videos */}
            <ProductMediaUploader
              media={form.media}
              onChange={(newMedia) => setField("media", newMedia)}
              maxFiles={8}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="o-title">Titre du produit ou service *</Label>
                <Input
                  id="o-title"
                  placeholder="ex: Tracteur 75 CV, Semences Maïs FBC6..."
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="o-category">Catégorie</Label>
                <Select value={form.category} onValueChange={(v) => setField("category", v)}>
                  <SelectTrigger id="o-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFER_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="o-desc">Description détaillée</Label>
              <Textarea
                id="o-desc"
                rows={3}
                placeholder="Précisez les caractéristiques, l'efficacité, la disponibilité et les modalités de livraison..."
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="o-price">Prix indicatif (FCFA)</Label>
                <Input
                  id="o-price"
                  placeholder="ex: 25 000 FCFA"
                  value={form.price_indication}
                  onChange={(e) => setField("price_indication", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-unit">Unité de mesure</Label>
                <Input
                  id="o-unit"
                  placeholder="ex: sac 50kg, hectare, jour, litre..."
                  value={form.unit}
                  onChange={(e) => setField("unit", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="o-partner">Nom de votre entreprise / enseigne *</Label>
                <Input
                  id="o-partner"
                  value={form.partner_name}
                  onChange={(e) => setField("partner_name", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-loc">Localisation / Zone couverte</Label>
                <Input
                  id="o-loc"
                  placeholder="ex: Bobo-Dioulasso, Ouagadougou..."
                  value={form.location_name}
                  onChange={(e) => setField("location_name", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="o-phone">Téléphone contact</Label>
                <Input
                  id="o-phone"
                  placeholder="+226 XX XX XX XX"
                  value={form.contact_phone}
                  onChange={(e) => setField("contact_phone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-email">Email contact</Label>
                <Input
                  id="o-email"
                  type="email"
                  placeholder="contact@domaine.bf"
                  value={form.contact_email}
                  onChange={(e) => setField("contact_email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-web">Site web (optionnel)</Label>
                <Input
                  id="o-web"
                  placeholder="https://..."
                  value={form.website}
                  onChange={(e) => setField("website", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground font-semibold">
              {saving ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Publier l'offre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
