import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, Mail, MapPin, Globe, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { partnerStorage, PartnerCategory, PartnerEntry } from "@/lib/partnerStorage";

interface Props {
  category: PartnerCategory;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const emptyForm = {
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  location: "",
  website: "",
  description: "",
  badge: "",
};

export default function PartnerEntriesPage({ category, title, subtitle, icon }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PartnerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await partnerStorage.getEntries(category);
      setItems(data);
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
  }, [category]);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const startEdit = (e: PartnerEntry) => {
    setEditing(e);
    setForm({
      name: e.name,
      contact_name: e.contact_name || "",
      phone: e.phone || "",
      email: e.email || "",
      location: e.location || "",
      website: e.website || "",
      description: e.description || "",
      badge: e.badge || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Veuillez renseigner le nom de l'organisation ou de l'entreprise.");
      return;
    }

    setSaving(true);
    try {
      await partnerStorage.saveEntry({
        id: editing?.id,
        user_id: user?.id,
        category,
        name: form.name.trim(),
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        location: form.location.trim() || null,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
        badge: form.badge.trim() || (category === "assurance" ? "Agréé CIMA" : "Acteur Certifié"),
        is_verified: true,
      });

      toast.success(editing ? "Partenaire modifié avec succès !" : "Nouveau partenaire ajouté au carnet !");
      setOpen(false);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (confirm("Supprimer cette entrée du répertoire ?")) {
      await partnerStorage.deleteEntry(id);
      toast.success("Partenaire retiré");
      loadData();
    }
  };

  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.contact_name || "").toLowerCase().includes(q) ||
      (item.location || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-0.5">{icon}</div>
          <div>
            <h1 className="text-2xl font-heading font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Badge variant="outline" className="text-[11px] text-emerald-600 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
            Offres accessibles sur la Marketplace (Agriculteurs & Éleveurs)
          </Badge>
          <Button onClick={startCreate} className="gradient-primary text-primary-foreground font-semibold shadow-xs">
            <Plus className="h-4 w-4 mr-1.5" /> {category === "banque" || category === "assurance" ? "Proposer une offre" : "Ajouter une entrée"}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, ville, spécialité…"
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="h-44 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground text-sm space-y-2">
            <p>Aucun partenaire trouvé pour cette recherche.</p>
            <Button size="sm" variant="outline" onClick={startCreate}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter une entrée
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((item) => (
            <Card key={item.id} className="hover:border-primary/50 transition-all flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold leading-snug">{item.name}</CardTitle>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[10px] shrink-0 font-medium">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                {item.contact_name && (
                  <CardDescription className="text-xs">
                    Contact : <strong>{item.contact_name}</strong>
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                {item.description && (
                  <p className="text-muted-foreground leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                )}

                <div className="space-y-1.5 pt-1 text-muted-foreground">
                  {item.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{item.location}</span>
                    </div>
                  )}
                  {item.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono">{item.phone}</span>
                    </div>
                  )}
                  {item.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>{item.email}</span>
                    </div>
                  )}
                  {item.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <a
                        href={item.website}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-foreground text-primary truncate"
                      >
                        {item.website.replace("https://", "")}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => startEdit(item)}>
                    <Pencil className="h-3 w-3 mr-1" /> Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Create / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-heading font-bold">
              {editing ? "Modifier le partenaire" : "Nouveau partenaire"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="pe-name">Nom de l'organisation / Entreprise *</Label>
              <Input
                id="pe-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ex. SAPHYTO, Coris Bank, SONAR..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pe-contact">Nom du contact / Responsable</Label>
                <Input
                  id="pe-contact"
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pe-badge">Label / Badge</Label>
                <Input
                  id="pe-badge"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="ex. Agréé CSP, Partenaire Bailleurs..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pe-phone">Téléphone</Label>
                <Input
                  id="pe-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+226 XX XX XX XX"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pe-email">Email</Label>
                <Input
                  id="pe-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@domaine.bf"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pe-loc">Localisation / Villes</Label>
                <Input
                  id="pe-loc"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="ex. Ouagadougou, Bobo, Dédougou..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pe-web">Site web</Label>
                <Input
                  id="pe-web"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pe-desc">Description des services proposés</Label>
              <Textarea
                id="pe-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Produits, conditions d'accès, types de crédits, garanties demandées..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground font-semibold">
              {saving ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter au répertoire"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
