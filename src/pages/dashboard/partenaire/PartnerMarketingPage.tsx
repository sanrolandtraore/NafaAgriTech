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
  Megaphone,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Sparkles,
  CheckCircle2,
  Calendar,
  Phone,
  MessageCircle,
  ExternalLink,
  Store,
  Tag,
  BadgeCheck,
} from "lucide-react";
import { partnerStorage, PartnerOffer } from "@/lib/partnerStorage";
import { getEffectiveUserId } from "@/lib/deviceIdentity";
import BackNavigationButton from "@/components/BackNavigationButton";

export default function PartnerMarketingPage() {
  const { user, profile } = useAuth();
  const [campaigns, setCampaigns] = useState<PartnerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<PartnerOffer | null>(null);

  const [form, setForm] = useState({
    title: "",
    badge: "SPONSORISÉ",
    description: "",
    rate: "Taux bonifié spécial campagne",
    targetAudience: "Tous producteurs & éleveurs",
    imageUrl: "",
    ctaLabel: "Demander ce financement",
    phone: "",
    whatsapp: "",
    isActive: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await partnerStorage.getOffers();
      const myCampaigns = all.filter(
        (o) =>
          (o as any).finance_type === "pub_marketing" ||
          Boolean((o as any).campaign_badge) ||
          ((o.category === "financement" || o.category.includes("finance")) && (user && o.owner_id === user.id))
      );
      setCampaigns(myCampaigns);
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
  }, [user]);

  const openNew = () => {
    setEditingCampaign(null);
    setForm({
      title: "",
      badge: "SPONSORISÉ",
      description: "",
      rate: "Taux bonifié spécial campagne",
      targetAudience: "Producteurs de coton, maïs, sésame & éleveurs",
      imageUrl: "",
      ctaLabel: "Souscrire maintenant",
      phone: profile?.phone || "+226 20 00 00 00",
      whatsapp: profile?.phone || "+226 70 00 00 00",
      isActive: true,
    });
    setOpenModal(true);
  };

  const openEdit = (c: PartnerOffer) => {
    setEditingCampaign(c);
    const fo = c as any;
    setForm({
      title: c.title,
      badge: fo.campaign_badge || "SPONSORISÉ",
      description: c.description || "",
      rate: fo.interest_rate || c.price_indication || "",
      targetAudience: fo.target_audience || "Agriculteurs & Éleveurs",
      imageUrl: c.image_url || (c.images && c.images[0]) || "",
      ctaLabel: fo.marketing_cta || "Demander ce financement",
      phone: c.contact_phone || "",
      whatsapp: c.contact_phone || "",
      isActive: c.is_active,
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Veuillez saisir le titre ou slogan de la campagne publicitaire.");
      return;
    }

    try {
      const ownerId = getEffectiveUserId(user?.id);
      const partnerName = profile?.full_name || "Établissement Financier & Assurance";

      const payload: any = {
        id: editingCampaign?.id,
        owner_id: ownerId,
        partner_name: partnerName,
        category: "financement",
        title: form.title.trim(),
        description: form.description.trim() || null,
        price_indication: form.rate,
        unit: "Campagne saisonnière",
        contact_phone: form.phone,
        image_url: form.imageUrl || null,
        images: form.imageUrl ? [form.imageUrl] : [],
        is_active: form.isActive,
        finance_type: "pub_marketing",
        interest_rate: form.rate,
        target_audience: form.targetAudience,
        campaign_badge: form.badge,
        is_sponsored: true,
        marketing_cta: form.ctaLabel,
      };

      await partnerStorage.saveOffer(payload);
      toast.success(editingCampaign ? "Campagne publicitaire mise à jour !" : "Campagne publicitaire diffusée sur le Marché !");
      setOpenModal(false);
      loadData();
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement de la campagne.");
    }
  };

  const handleToggle = async (c: PartnerOffer) => {
    await partnerStorage.toggleOfferActive(c.id);
    toast.info(c.is_active ? "Campagne publicitaire mise en pause" : "Campagne publicitaire active en ligne");
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer définitivement cette campagne publicitaire ?")) {
      await partnerStorage.deleteOffer(id);
      toast.success("Campagne supprimée");
      loadData();
    }
  };

  return (
    <div className="space-y-6 container max-w-6xl mx-auto px-4 py-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Megaphone className="h-7 w-7 text-amber-600" />
              Campagnes Publicitaires & Marketing Financier
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Créez des bannières sponsorisées, offres de taux réduit et visuels publicitaires diffusés sur le Marché NAFA-AGRITECH.
            </p>
          </div>
        </div>

        <Button onClick={openNew} className="font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-xs">
          <Plus className="h-4 w-4" />
          Créer une Campagne Pub
        </Button>
      </div>

      {/* Grille des Campagnes Actives */}
      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Chargement des campagnes...</div>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed border-2 p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <Megaphone className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base">Aucune campagne publicitaire en cours</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Lancez dès maintenant une publicité ciblée pour mettre en avant vos crédits intrants, microcrédits ou assurances auprès des milliers d'agriculteurs de la plateforme.
            </p>
          </div>
          <Button onClick={openNew} className="font-bold bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="h-4 w-4 mr-1.5" />
            Lancer ma première publicité
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((camp) => {
            const fo = camp as any;
            return (
              <Card key={camp.id} className="border-2 border-amber-500/30 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  {camp.image_url ? (
                    <div className="h-44 w-full overflow-hidden bg-black/10 relative">
                      <img src={camp.image_url} alt={camp.title} className="w-full h-full object-cover" />
                      <Badge className="absolute top-2.5 left-2.5 bg-amber-500 text-black font-black text-xs uppercase shadow-sm">
                        {fo.campaign_badge || "SPONSORISÉ"}
                      </Badge>
                      <Badge
                        variant={camp.is_active ? "default" : "secondary"}
                        className={`absolute top-2.5 right-2.5 text-[10px] ${
                          camp.is_active ? "bg-emerald-600 text-white" : "bg-black/60 text-white backdrop-blur-xs"
                        }`}
                      >
                        {camp.is_active ? "En diffusion active" : "En pause"}
                      </Badge>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent flex items-center justify-between border-b">
                      <Badge className="bg-amber-500 text-black font-black text-xs uppercase">
                        {fo.campaign_badge || "SPONSORISÉ"}
                      </Badge>
                      <Badge variant={camp.is_active ? "default" : "secondary"} className="text-[10px]">
                        {camp.is_active ? "En diffusion" : "En pause"}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-bold">{camp.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2 mt-1">
                      {camp.description || "Aucune description promotionnelle."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-2 text-xs">
                    {fo.interest_rate && (
                      <p className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                        {fo.interest_rate}
                      </p>
                    )}
                    {fo.target_audience && (
                      <p className="text-muted-foreground text-[11px]">
                        <strong>Cible :</strong> {fo.target_audience}
                      </p>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 pt-2 border-t flex items-center justify-between gap-2 bg-muted/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(camp)}
                    className="h-8 text-xs font-semibold"
                  >
                    {camp.is_active ? "Mettre en pause" : "Activer la diffusion"}
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(camp)}
                      className="h-8 text-xs font-semibold"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(camp.id)}
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

      {/* Modale de Création / Modification de Campagne Pub */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-amber-600" />
              {editingCampaign ? "Modifier la Campagne Publicitaire" : "Nouvelle Publicité ou Bannière Marketing"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configurez le titre publicitaire, le badge marketing, le taux ou l'avantage promotionnel et l'image de bannière.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Badge Publicitaire *</Label>
                <Input
                  placeholder="Ex: SPONSORISÉ, OFFRE SAISONNIÈRE, TAUX BONIFIÉ..."
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Avantage / Taux Mis en Avant</Label>
                <Input
                  placeholder="Ex: Taux 5% bonifié, 0 frais de dossier..."
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Titre / Slogan Publicitaire *</Label>
              <Input
                placeholder="Ex: Campagne Coton 2026 : Votre crédit intrants accordé en 48h !"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Message & Argumentaire Promotionnel</Label>
              <Textarea
                placeholder="Expliquez les atouts de votre offre, conditions de souscription pour les coopératives..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">URL de l'Affiche Publicitaire / Bannière</Label>
              <Input
                placeholder="https://... lien vers l'image ou l'affiche promotionnelle"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Public Cible</Label>
                <Input
                  placeholder="Ex: Cotonculteurs, maraîchers, éleveurs..."
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bouton d'Action (Call To Action)</Label>
                <Input
                  placeholder="Ex: Souscrire en ligne, Contacter l'agence"
                  value={form.ctaLabel}
                  onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Téléphone / WhatsApp Contact</Label>
              <Input
                placeholder="+226 XX XX XX XX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setOpenModal(false)} className="text-xs">
              Annuler
            </Button>
            <Button onClick={handleSave} className="font-bold bg-amber-600 hover:bg-amber-700 text-white text-xs">
              {editingCampaign ? "Mettre à jour" : "Diffuser la Campagne sur le Marché"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
