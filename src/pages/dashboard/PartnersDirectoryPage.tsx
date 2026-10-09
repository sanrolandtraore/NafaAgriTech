import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Truck, ShieldCheck, FolderKanban, Landmark, Handshake, Phone, Mail, MapPin, Globe, Search, CheckCircle2 } from "lucide-react";
import { partnerStorage, PartnerCategory, PartnerEntry } from "@/lib/partnerStorage";
import { PartnerVerifiedBadge } from "@/components/partner/PartnerVerifiedBadge";

const TABS: { value: PartnerCategory; label: string; icon: any }[] = [
  { value: "fournisseur", label: "Fournisseurs d'intrants", icon: Truck },
  { value: "assurance", label: "Assurances agricoles", icon: ShieldCheck },
  { value: "banque", label: "Services bancaires & Crédit", icon: Landmark },
  { value: "programme", label: "Programmes & Projets", icon: FolderKanban },
];

export default function PartnersDirectoryPage() {
  const [items, setItems] = useState<PartnerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PartnerCategory | "all">("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await partnerStorage.getEntries();
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
  }, []);

  const filteredItems = items.filter((e) => {
    const matchesCategory = selectedCategory === "all" || e.category === selectedCategory;
    const t = q.trim().toLowerCase();
    const matchesQuery = !t ||
      e.name.toLowerCase().includes(t) ||
      (e.location || "").toLowerCase().includes(t) ||
      (e.description || "").toLowerCase().includes(t) ||
      (e.contact_name || "").toLowerCase().includes(t);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-start gap-4">
        <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
          <Handshake className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-foreground tracking-tight">
            Annuaire National des Partenaires
          </h1>
          <p className="text-base text-muted-foreground mt-1 font-medium">
            Fournisseurs certifiés, compagnies d'assurance, banques agricoles et bailleurs de fonds au Burkina Faso.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, ville, intrant, mot-clé…"
          className="pl-12 h-12 text-base rounded-xl border-border"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Filtres de catégorie directs - sans Tabs imbriqués */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground shadow-premium"
              : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Tous les partenaires ({items.length})
        </button>
        {TABS.map(({ value, label, icon: Icon }) => {
          const count = items.filter((x) => x.category === value).length;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedCategory(value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedCategory === value
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-background/50 font-extrabold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-44 animate-pulse bg-muted/40 rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-dashed rounded-2xl">
          <CardContent className="py-12 text-center text-muted-foreground space-y-2">
            <p className="text-base font-semibold text-foreground">
              {items.length === 0 ? "Aucun partenaire enregistré pour le moment" : "Aucun partenaire trouvé pour ces critères"}
            </p>
            <p className="text-sm max-w-md mx-auto">
              {items.length === 0
                ? "L'annuaire national répertorie uniquement les entreprises et institutions réelles inscrites et agréées."
                : "Essayez de modifier votre recherche ou de sélectionner une autre catégorie."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredItems.map((e) => (
            <Card key={e.id} className="card-premium hover:border-primary/50 transition-all flex flex-col justify-between shadow-card-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg font-heading font-bold leading-snug">{e.name}</CardTitle>
                  <PartnerVerifiedBadge
                    isVerified={true}
                    partnerName={e.name}
                    size="xs"
                    variant="pill"
                    showPopover={false}
                  />
                </div>
                {e.contact_name && (
                  <p className="text-sm text-muted-foreground font-medium">Contact : {e.contact_name}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {e.description && (
                  <p className="text-muted-foreground line-clamp-3 leading-relaxed font-medium">
                    {e.description}
                  </p>
                )}
                <div className="space-y-2 pt-2 border-t border-border/60 text-muted-foreground font-medium">
                  {e.location && (
                    <p className="flex items-center gap-2.5 text-foreground">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span>{e.location}</span>
                    </p>
                  )}
                  {e.phone && (
                    <p className="flex items-center gap-2.5 font-mono">
                      <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                      <a href={`tel:${e.phone}`} className="hover:text-primary font-bold">{e.phone}</a>
                    </p>
                  )}
                  {e.email && (
                    <p className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                      <a href={`mailto:${e.email}`} className="hover:text-primary truncate">{e.email}</a>
                    </p>
                  )}
                  {e.website && (
                    <p className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4 text-indigo-600 shrink-0" />
                      <a className="text-primary hover:underline truncate font-semibold" href={e.website} target="_blank" rel="noreferrer">
                        {e.website.replace("https://", "")}
                      </a>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
