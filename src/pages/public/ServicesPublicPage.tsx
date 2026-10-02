import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/seo/SEOHead";
import { SEO_PAGES, generateWebsiteSchema } from "@/lib/seoConfig";
import PublicNavbar from "@/components/public/PublicNavbar";
import Footer from "@/components/Footer";
import { partnerStorage, PartnerOffer } from "@/lib/partnerStorage";
import {
  Wrench,
  Tractor,
  Droplets,
  Stethoscope,
  Landmark,
  Sprout,
  ShieldCheck,
  Search,
  MapPin,
  Phone,
  ArrowRight,
  Store,
  UserCheck,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";

const SERVICE_CATEGORIES = [
  { id: "all", label: "Toutes les prestations", icon: Wrench },
  { id: "machinisme", label: "Machinisme & Travaux", icon: Tractor },
  { id: "services_agricoles", label: "Services Agricoles", icon: Sprout },
  { id: "irrigation_solaire", label: "Forage & Irrigation", icon: Droplets },
  { id: "services_veterinaires", label: "Soins Vétérinaires", icon: Stethoscope },
  { id: "finance_assurance", label: "Finance & Assurance", icon: Landmark },
];

export default function ServicesPublicPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get("cat") || "all";

  const [selectedCat, setSelectedCat] = useState(catParam);
  const [search, setSearch] = useState("");
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedCat(catParam);
  }, [catParam]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await partnerStorage.getOffers();
        if (active) {
          // Filtrer uniquement les offres de type service actives
          const activeServices = data.filter((o) => o.is_active);
          setOffers(activeServices);
        }
      } catch (err) {
        console.error("Erreur chargement services partenaires :", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const handleCategoryChange = (catId: string) => {
    setSelectedCat(catId);
    if (catId === "all") {
      searchParams.delete("cat");
    } else {
      searchParams.set("cat", catId);
    }
    setSearchParams(searchParams);
  };

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const matchCat =
        selectedCat === "all" ||
        o.category === selectedCat ||
        (selectedCat === "machinisme" && (o.category?.includes("machinisme") || o.category?.includes("tracteur")));
      const matchSearch =
        !search.trim() ||
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.partner_name.toLowerCase().includes(search.toLowerCase()) ||
        (o.location_name && o.location_name.toLowerCase().includes(search.toLowerCase())) ||
        (o.description && o.description.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [offers, selectedCat, search]);

  const seo = SEO_PAGES.services;

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
            "name": "Services techniques agricoles proposés par les partenaires NAFA-AGRITECH",
            "description": seo.description,
            "url": "https://nafaagritech.app/services"
          }
        ]}
        breadcrumbs={[
          { name: "Accueil", url: "/" },
          { name: "Services Partenaires", url: "/services" },
        ]}
      />

      <PublicNavbar />

      <main className="flex-1">
        {/* En-tête de page */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-muted/50 via-background to-background border-b border-border/60">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-5">
            <Badge className="bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-600/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Prestataires Techniques Qualifiés
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground leading-tight">
              Services techniques proposés par nos partenaires
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              NAFA-AGRITECH facilite la découverte et la mise en relation avec des partenaires techniques
              proposant des services réels aux producteurs et éleveurs en Afrique de l'Ouest.
            </p>

            {/* Avertissement de Positionnement Clair (Règle Absolue CTO) */}
            <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-left">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-semibold">Clarification importante :</strong> NAFA-AGRITECH
                fournit la solution numérique d'aide à la décision et de mise en relation. Les travaux physiques
                (labours, forages, installations d'irrigation, soins vétérinaires) sont réalisés sous la responsabilité
                exclusive des entreprises et professionnels partenaires certifiés.
              </div>
            </div>
          </div>
        </section>

        {/* Barre de Recherche et Filtres */}
        <section className="py-8 container max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Champ de recherche */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un service, une ville, un partenaire..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-2xl text-xs sm:text-sm h-11"
              />
            </div>

            {/* Bouton Devenir Partenaire */}
            <Button
              asChild
              className="rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs sm:text-sm shrink-0"
            >
              <Link to="/auth?mode=register&role=partenaire">
                <Store className="h-4 w-4 mr-2" />
                <span>Proposer mes services sur la plateforme</span>
              </Link>
            </Button>
          </div>

          {/* Onglets de Catégories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SERVICE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-card text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Grille des Offres Réelles */}
          {loading ? (
            <div className="py-20 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>Chargement des offres certifiées...</span>
            </div>
          ) : filteredOffers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredOffers.map((offer) => (
                <Card
                  key={offer.id}
                  className="rounded-3xl border border-border/80 hover:border-emerald-500/40 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col bg-card"
                >
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
                          {offer.category.replace(/_/g, " ")}
                        </Badge>
                        {offer.location_name && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-[#F97316]" />
                            {offer.location_name}
                          </span>
                        )}
                      </div>

                      <h2 className="text-base font-extrabold text-foreground leading-snug">
                        {offer.title}
                      </h2>

                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {offer.description || "Prestation technique proposée par un partenaire certifié."}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                            Partenaire prestataire
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {offer.partner_name}
                          </span>
                        </div>
                        {offer.price_indication && (
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Tarif</span>
                            <span className="text-xs font-extrabold text-[#F97316]">
                              {offer.price_indication} {offer.unit ? `(${offer.unit})` : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          asChild
                          size="sm"
                          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          <Link to={`/marketplace/${offer.id}`}>
                            <span>Consulter l'offre</span>
                            <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* État Vide Professionnel Obligatoire (CTO) */
            <div className="py-20 px-6 rounded-3xl bg-muted/20 border-2 border-dashed border-border text-center max-w-2xl mx-auto space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Wrench className="h-7 w-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-heading font-extrabold text-foreground">
                Aucun service technique disponible dans cette sélection pour le moment
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                Seules les prestations réelles proposées par des prestataires et partenaires enregistrés sont affichées sur cette page.
                Aucune fausse offre n'est créée artificiellement.
              </p>
              <div className="pt-2">
                <Button
                  asChild
                  className="rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs sm:text-sm px-6"
                >
                  <Link to="/auth?mode=register&role=partenaire">
                    <Store className="h-4 w-4 mr-2" />
                    <span>Devenir partenaire technique et publier une offre</span>
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
