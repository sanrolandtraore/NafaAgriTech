import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/seo/SEOHead";
import { SEO_PAGES, generateWebsiteSchema } from "@/lib/seoConfig";
import PublicNavbar from "@/components/public/PublicNavbar";
import Footer from "@/components/Footer";
import { partnerStorage, PartnerEntry } from "@/lib/partnerStorage";
import {
  Building2,
  Store,
  Landmark,
  ShieldCheck,
  Search,
  MapPin,
  Phone,
  ArrowRight,
  ExternalLink,
  Award,
  Filter,
  CheckCircle2,
} from "lucide-react";
import logo from "@/assets/logo.png";

const PARTNER_CATEGORIES = [
  { id: "all", label: "Tous les partenaires" },
  { id: "fournisseur", label: "Fournisseurs d'Intrants & Matériels" },
  { id: "banque", label: "Institutions Financières & Banques" },
  { id: "assurance", label: "Assurances Agricoles" },
  { id: "programme", label: "Programmes & Projets Agricoles" },
];

export default function PartenairesPublicPage() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PartnerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  useEffect(() => {
    let active = true;
    const loadPartners = async () => {
      try {
        setLoading(true);
        const list = await partnerStorage.getEntries();
        if (active) {
          setPartners(list);
        }
      } catch (err) {
        console.error("Erreur chargement annuaire partenaires :", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadPartners();
    return () => {
      active = false;
    };
  }, []);

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchCat = selectedCat === "all" || p.category === selectedCat;
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.location && p.location.toLowerCase().includes(search.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [partners, selectedCat, search]);

  const seo = SEO_PAGES.partenaires;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={seo.title}
        description={seo.description}
        canonicalPath={seo.canonicalPath}
        keywords={seo.keywords}
        schemaJsonLd={[
          generateWebsiteSchema(),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Annuaire des Partenaires NAFA-AGRITECH",
            "description": seo.description,
            "url": "https://nafaagritech.app/partenaires"
          }
        ]}
        breadcrumbs={[
          { name: "Accueil", url: "/" },
          { name: "Partenaires", url: "/partenaires" },
        ]}
      />

      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-muted/50 via-background to-background border-b border-border/60">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-5">
            <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Écosystème Agricole Certifié
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground leading-tight">
              Annuaire des Partenaires Professionnels
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Consultez les profils publics des entreprises, fournisseurs d'intrants, bureaux d'études,
              institutions financières et structures de développement intervenant sur la plateforme.
            </p>

            <div className="pt-2">
              <Button
                asChild
                className="rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs sm:text-sm px-6"
              >
                <Link to="/auth?mode=register&role=partenaire">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>Rejoindre l'annuaire des partenaires</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Filtres et Recherche */}
        <section className="py-8 container max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un partenaire, une ville..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-2xl text-xs sm:text-sm h-11"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              {PARTNER_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors border ${
                    selectedCat === c.id
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grille des Partenaires */}
          {loading ? (
            <div className="py-20 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>Chargement des partenaires...</span>
            </div>
          ) : filteredPartners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredPartners.map((partner) => (
                <Card
                  key={partner.id}
                  className="rounded-3xl border border-border/80 hover:border-emerald-500/40 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between bg-card overflow-hidden"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-muted border border-border/60 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={partner.logo_url || logo}
                          alt={partner.name}
                          className="h-full w-full object-contain rounded-xl"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = logo;
                          }}
                        />
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
                        {partner.category}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-base font-extrabold text-foreground leading-snug">
                        {partner.name}
                      </h2>
                      {partner.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#F97316] shrink-0" />
                          <span>{partner.location}</span>
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {partner.description || "Partenaire professionnel enregistré sur le réseau NAFA-AGRITECH."}
                    </p>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
                      >
                        <Link to={`/partenaires/${partner.id}`}>
                          <span>Voir la vitrine</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>

                      {partner.phone && (
                        <a
                          href={`tel:${partner.phone}`}
                          className="text-xs font-semibold text-muted-foreground hover:text-emerald-600 flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          <span>Contact</span>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-20 px-6 rounded-3xl bg-muted/20 border-2 border-dashed border-border text-center max-w-2xl mx-auto space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Building2 className="h-7 w-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-heading font-extrabold text-foreground">
                Aucun partenaire enregistré dans cette catégorie pour le moment
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                Seuls les partenaires réels vérifiés sont répertoriés dans cet annuaire public.
              </p>
              <div className="pt-2">
                <Button
                  asChild
                  className="rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs sm:text-sm px-6"
                >
                  <Link to="/auth?mode=register&role=partenaire">
                    <span>Créer un compte partenaire</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
