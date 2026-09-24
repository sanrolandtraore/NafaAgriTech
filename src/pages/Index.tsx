import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin, ArrowRight, Mail, Phone, MapPinned,
  FileText, Calculator, Eye, Sparkles, Tractor, Store, ShieldCheck,
  Send, CheckCircle2, Globe, Smartphone, FlaskConical, Sprout, Beef, Wrench,
  Cpu, Stethoscope, ChevronRight, Zap, Award, Compass, Check, Layers
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { partnerStorage, PartnerOffer, PartnerEntry } from "@/lib/partnerStorage";
import ProductMediaViewer from "@/components/partner/ProductMediaViewer";
import RealPlatformMetricsCounter from "@/components/landing/RealPlatformMetricsCounter";
import PartnerLogoTicker from "@/components/landing/PartnerLogoTicker";
import UserTestimonialsSection from "@/components/landing/UserTestimonialsSection";
import logo from "@/assets/logo.png";
import galleryFarmField from "@/assets/gallery/farm-field.jpg";
import galleryLivestock from "@/assets/gallery/livestock.jpg";
import galleryDigital from "@/assets/gallery/digital-farming.jpg";
import galleryIrrigation from "@/assets/gallery/irrigation.jpg";

// Catégories du marché pour le filtre rapide
const MARKET_CATEGORIES = [
  { value: "all", label: "Toutes les offres", icon: Store },
  { value: "materiel", label: "Matériel & Machinisme", icon: Tractor },
  { value: "intrants", label: "Intrants & Fertilisants", icon: FlaskConical },
  { value: "semences", label: "Semences Certifiées", icon: Sprout },
  { value: "elevage", label: "Élevage & Provendes", icon: Beef },
  { value: "service", label: "Services & Travaux", icon: Wrench },
];

// Configuration des personas
type PersonaId = "agri" | "elevage" | "expert" | "partenaire";

interface PersonaConfig {
  id: PersonaId;
  label: string;
  badge: string;
  headline: string;
  description: string;
  tools: {
    title: string;
    description: string;
    cta: string;
    path: string;
    icon: typeof Sprout;
    highlight?: boolean;
  }[];
}

const PERSONAS: PersonaConfig[] = [
  {
    id: "agri",
    label: "Agriculteur & Maraîcher",
    badge: "Production Végétale",
    headline: "Protégez vos récoltes et maximisez vos rendements",
    description: "Planification des cultures, calcul précis des doses d'engrais et accès direct aux semences certifiées du Burkina Faso.",
    tools: [
      {
        title: "Planification des Cultures",
        description: "Gestion des calendriers de semis, suivi des cycles culturaux et rendements parcellaires adaptés au Sahel.",
        cta: "Planifier mes cultures",
        path: "/dashboard/crop-planning",
        icon: Sprout,
        highlight: true,
      },
      {
        title: "Calculateur Doses & Engrais",
        description: "Calculez vos fractionnements NPK, densités de semis et besoins en eau ETc adaptés à votre sol sahélien.",
        cta: "Calculer mes doses",
        path: "/dashboard/expert-calculator",
        icon: Calculator,
      },
      {
        title: "Semences & Intrants Agréés",
        description: "Achetez directement vos semences certifiées et fertilisants auprès des boutiques agréées au juste prix.",
        cta: "Voir les offres",
        path: "/marketplace",
        icon: Sprout,
      },
    ],
  },
  {
    id: "elevage",
    label: "Éleveur & Pasteur",
    badge: "Production Animale",
    headline: "Pilotez la santé de votre cheptel et optimisez la nutrition",
    description: "Carnet sanitaire numérique, alertes épidémiques, suivi vaccinal et approvisionnement direct en provendes de qualité certifiée.",
    tools: [
      {
        title: "Santé & Carnet Sanitaire",
        description: "Fiches de soins, calendrier de prophylaxie et respect strict des délais d'attente lait et viande.",
        cta: "Ouvrir le suivi",
        path: "/dashboard/livestock",
        icon: Stethoscope,
        highlight: true,
      },
      {
        title: "Alimentation & Provendes",
        description: "Formulation des rations journalières et commande directe auprès des provenderies partenaires agréées.",
        cta: "Trouver des provendes",
        path: "/marketplace",
        icon: Beef,
      },
      {
        title: "Gestion du Troupeau",
        description: "Inventaire bovin, ovin et caprin, suivi des pesées, saillies et rentabilité de votre exploitation.",
        cta: "Gérer le cheptel",
        path: "/dashboard/livestock",
        icon: Layers,
      },
    ],
  },
  {
    id: "expert",
    label: "Agronome & Vétérinaire",
    badge: "Conseil & Ingénierie",
    headline: "Concevez des exploitations modernes et délivrez des ordonnances",
    description: "Copilote NAFA Genius pour concevoir des plans 2D/3D et réseaux d'irrigation, éditer des ordonnances certifiées et scouter le terrain.",
    tools: [
      {
        title: "Copilote NAFA Genius",
        description: "Conception automatique de plans 2D côtés, réseaux d'irrigation Hazen-Williams, rendu photoréaliste et devis multi-fournisseurs.",
        cta: "Lancer le copilote",
        path: "/dashboard/genius",
        icon: Cpu,
        highlight: true,
      },
      {
        title: "Ordonnances Certifiées",
        description: "Édition d'ordonnances phytosanitaires et vétérinaires officielles au format PDF avec signature et QR code.",
        cta: "Créer une ordonnance",
        path: "/dashboard/expert-prescriptions",
        icon: FileText,
      },
      {
        title: "Scouting Terrain GPS",
        description: "Relevés d'observations parcellaires géolocalisés, suivi d'infestation et cartographie des alertes épidémiques.",
        cta: "Ouvrir le scouting",
        path: "/dashboard/scouting",
        icon: Eye,
      },
    ],
  },
  {
    id: "partenaire",
    label: "Entreprise & Fournisseur",
    badge: "B2B & Distribution",
    headline: "Distribuez vos matériels et services aux producteurs du Sahel",
    description: "Ouvrez votre vitrine officielle, intégrez vos tarifs dans le comparateur de devis NAFA Genius et recevez les commandes en direct.",
    tools: [
      {
        title: "Vitrine Marketplace Agréée",
        description: "Exposez vos équipements solaires, tracteurs, semences et fertilisants avec démonstrations photos et vidéos.",
        cta: "Explorer le marché",
        path: "/marketplace",
        icon: Store,
        highlight: true,
      },
      {
        title: "Intégration Chiffrage Genius",
        description: "Vos catalogues et prix de gros sont automatiquement pris en compte dans les devis d'ingénierie générés pour les clients.",
        cta: "Rejoindre le réseau",
        path: "/dashboard/partenaire-abonnement",
        icon: Award,
      },
      {
        title: "Demandes de Devis Directes",
        description: "Recevez les demandes qualifiées de devis et commandes de matériel émanant de coopératives et grands domaines.",
        cta: "Voir les demandes",
        path: "/dashboard/quote-requests",
        icon: Send,
      },
    ],
  },
];

// Sources de données scientifiques vérifiées (RAG)
const SCIENTIFIC_SOURCES = [
  { name: "INERA", desc: "Institut Environnement & Recherches Agricoles" },
  { name: "CIRAD", desc: "Recherche Agronomique Internationale" },
  { name: "FAO-56", desc: "Normes Mondiales d'Irrigation" },
  { name: "CSP-CILSS", desc: "Comité Sahélien des Pesticides" },
  { name: "CNSF", desc: "Centre National Semences Forestières" },
  { name: "Mercuriale BF", desc: "Prix Officiels de Référence" },
];

const Index = () => {
  const navigate = useNavigate();
  const [partnerOffers, setPartnerOffers] = useState<PartnerOffer[]>([]);
  const [partnersList, setPartnersList] = useState<PartnerEntry[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [activePersona, setActivePersona] = useState<PersonaId>("agri");

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [offers, pList] = await Promise.all([
          partnerStorage.getOffers(),
          partnerStorage.getEntries(),
        ]);
        if (!cancelled) {
          setPartnerOffers(offers.filter(o => o.is_active));
          setPartnersList(pList);
        }
      } catch (e) {
        console.error("Erreur de chargement des partenaires", e);
      } finally {
        if (!cancelled) setLoadingPartners(false);
      }
    };
    void loadData();
    return () => { cancelled = true; };
  }, []);

  const filteredOffers = useMemo(() => {
    if (selectedCat === "all") return partnerOffers;
    return partnerOffers.filter(o => o.category === selectedCat);
  }, [partnerOffers, selectedCat]);

  const currentPersona = useMemo(() => {
    return PERSONAS.find(p => p.id === activePersona) || PERSONAS[0];
  }, [activePersona]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0 selection:bg-primary/20">
      {/* ── 1. Minimalist Top Navigation ── */}
      <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-border/80 transition-all">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img
              src={logo}
              alt="NAFA-AGRITECH"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-base sm:text-lg leading-tight tracking-tight">
                NAFA <span className="text-primary">- AGRITECH</span>
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hidden sm:block">
                Copilote Agricole & Pastoral
              </span>
            </div>
          </Link>

          {/* Uniquement les différents acteurs listés en entête */}
          <nav aria-label="Acteurs NAFA-AGRITECH" className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold">
            {PERSONAS.map((persona) => {
              const isActive = activePersona === persona.id;
              return (
                <a
                  key={persona.id}
                  href="#personas"
                  onClick={(e) => {
                    e.preventDefault();
                    setActivePersona(persona.id);
                    const el = document.getElementById("personas");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`px-3 py-1.5 rounded-full transition-all duration-150 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {persona.label}
                </a>
              );
            })}
          </nav>

          {/* Actions & Theme */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="gradient-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-95"
            >
              Se connecter
            </Button>
          </div>
        </div>

        {/* Barre des 4 acteurs en entête pour écrans mobiles & tablettes */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-t border-border/50 scrollbar-none">
          {PERSONAS.map((persona) => {
            const isActive = activePersona === persona.id;
            return (
              <a
                key={persona.id}
                href="#personas"
                onClick={(e) => {
                  e.preventDefault();
                  setActivePersona(persona.id);
                  const el = document.getElementById("personas");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {persona.label}
              </a>
            );
          })}
        </div>
      </header>

      {/* ── 2. Hero Section : Compréhension en 30 secondes ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background pt-10 sm:pt-14 pb-12 border-b border-border/50">
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-20 dark:opacity-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl" />
        </div>

        <div className="container max-w-5xl mx-auto px-4 text-center space-y-6">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-primary/20 shadow-xs text-[11px] sm:text-xs font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Plateforme Agro-Pastorale & Ingénierie • 100% Hors-Ligne • Certifié Sahel</span>
          </div>

          {/* Punchy Headline (Ultra-clear, under 30s) */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.15]">
            L'agriculture et l'élevage intelligents,{" "}
            <span className="text-primary underline decoration-amber-500 decoration-4 underline-offset-4">
              à portée de main.
            </span>
          </h1>

          {/* 1-Line Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            Planification intelligente de vos cultures, suivi sanitaire du cheptel et devis instantanés auprès de partenaires certifiés du Sahel.
          </p>

          {/* 4 Trust Numbers Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2">
            <div className="p-2.5 rounded-xl bg-card border border-border/70 text-center shadow-xs">
              <span className="font-heading font-bold text-lg text-primary block">&lt; 30 sec</span>
              <span className="text-[11px] text-muted-foreground font-medium">Prise en main</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border/70 text-center shadow-xs">
              <span className="font-heading font-bold text-lg text-emerald-600 dark:text-emerald-400 block">100%</span>
              <span className="text-[11px] text-muted-foreground font-medium">Hors-Ligne PWA</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border/70 text-center shadow-xs">
              <span className="font-heading font-bold text-lg text-amber-600 dark:text-amber-400 block">0</span>
              <span className="text-[11px] text-muted-foreground font-medium">Hallucination (INERA)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border/70 text-center shadow-xs">
              <span className="font-heading font-bold text-lg text-foreground block">
                {partnersList.length > 0 ? partnersList.length : "10"}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">Partenaires Certifiés</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Compteur Dynamique Réel (Agriculteurs, Éleveurs, Entreprises Partenaires) ── */}
      <RealPlatformMetricsCounter />

      {/* ── Bande Défilante des Partenaires Officiels (Logo Ticker) ── */}
      <PartnerLogoTicker />

      {/* ── 3. Interactive Persona Cockpit (Airbnb / Figma style) ── */}
      <section id="personas" className="py-12 bg-muted/30 border-y border-border scroll-mt-20">
        <div className="container max-w-5xl mx-auto px-4 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block">
              Adapté à votre métier
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              Une interface taillée pour chaque acteur
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Choisissez votre profil pour découvrir vos outils dédiés en un clic.
            </p>
          </div>

          {/* Segmented Pill Selector (Horizontal scrollable on small mobile) */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {PERSONAS.map((p) => {
              const isSelected = p.id === activePersona;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePersona(p.id)}
                  className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm scale-105"
                      : "bg-card text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  {p.id === "agri" && <Sprout className="h-4 w-4" />}
                  {p.id === "elevage" && <Beef className="h-4 w-4" />}
                  {p.id === "expert" && <Stethoscope className="h-4 w-4" />}
                  {p.id === "partenaire" && <Store className="h-4 w-4" />}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Persona Showcase Card */}
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div className="space-y-1">
                <Badge variant="secondary" className="text-[11px] font-semibold">
                  {currentPersona.badge}
                </Badge>
                <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                  {currentPersona.headline}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  {currentPersona.description}
                </p>
              </div>
            </div>

            {/* 3 Tools for this Persona */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentPersona.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.title}
                    className={`rounded-xl p-5 border flex flex-col justify-between transition-all ${
                      tool.highlight
                        ? "bg-primary/5 border-primary/40 shadow-xs"
                        : "bg-background border-border"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          tool.highlight ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {tool.highlight && (
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            Recommandé
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-sm sm:text-base text-foreground">
                          {tool.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(tool.path)}
                        variant={tool.highlight ? "default" : "outline"}
                        className={`w-full text-xs font-semibold justify-between ${
                          tool.highlight ? "gradient-primary text-primary-foreground" : ""
                        }`}
                      >
                        <span>{tool.cta}</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Offres & Partenaires Agréés (Marketplace Strip) ── */}
      <section className="py-12 bg-background">
        <div className="container max-w-6xl mx-auto px-4 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Store className="h-4 w-4" /> Marché Certifié du Sahel
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                Matériels & Intrants de nos Partenaires
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Prix vérifiés en FCFA, fiches techniques et contact direct des distributeurs agréés.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/marketplace")}
              className="text-xs font-semibold self-start sm:self-auto shrink-0"
            >
              <span>Toutes les offres ({partnerOffers.length})</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {MARKET_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCat === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCat(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-card text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Offers Grid */}
          {loadingPartners ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-card border animate-pulse" />
              ))}
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-card border border-border text-muted-foreground text-xs p-6">
              Aucune offre dans cette catégorie pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredOffers.slice(0, 6).map((offer) => (
                <Card
                  key={offer.id}
                  className="overflow-hidden flex flex-col justify-between border-border/80 hover:border-primary/40 hover:shadow-xs transition-all duration-200 bg-card"
                >
                  <div>
                    {/* Media Viewer */}
                    <div className="bg-muted max-h-48 overflow-hidden">
                      <ProductMediaViewer media={offer.media || []} title={offer.title} />
                    </div>

                    <CardContent className="p-4 space-y-2.5">
                      {/* Partner Name & Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/partenaire/${offer.owner_id}`}
                          className="text-xs font-semibold text-primary hover:underline truncate"
                        >
                          {offer.partner_name}
                        </Link>
                        <Badge variant="outline" className="text-[10px] shrink-0 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Agréé
                        </Badge>
                      </div>

                      {/* Title & Price */}
                      <div>
                        <h3 className="font-heading font-bold text-sm leading-snug line-clamp-2 text-foreground">
                          {offer.title}
                        </h3>
                        {offer.price_indication ? (
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-base font-heading font-bold text-primary">
                              {offer.price_indication}
                            </span>
                            {offer.unit && (
                              <span className="text-[11px] text-muted-foreground">/ {offer.unit}</span>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs font-semibold text-muted-foreground">Tarif sur devis</p>
                        )}
                      </div>

                      {/* Location */}
                      {offer.location_name && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
                          <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                          <span className="truncate">{offer.location_name}</span>
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* 1-Tap CTA */}
                  <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold w-full"
                    >
                      <Link to={`/partenaire/${offer.owner_id}`}>
                        Vitrine
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="gradient-primary text-primary-foreground text-xs font-semibold w-full"
                    >
                      <Link to="/auth">
                        Commander
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Directory Strip */}
          <div className="pt-4 border-t border-border/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center mb-3">
              Entreprises & Fournisseurs Agréés
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {partnersList.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to={`/partenaire/${p.id}`}
                  className="bg-card border border-border/80 hover:border-primary/50 p-2.5 rounded-xl flex items-center gap-2.5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    {p.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {p.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {p.location || "Burkina Faso"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Scientific Trust & Institutional RAG ── */}
      <section className="py-10 bg-muted/40 border-y border-border">
        <div className="container max-w-5xl mx-auto px-4 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <Check className="h-3.5 w-3.5" /> Référentiels Techniques & RAG Scientifique
          </div>
          <h3 className="text-lg sm:text-xl font-heading font-bold text-foreground">
            Des calculs et recommandations vérifiés, zéro réponse imaginaire
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            NAFA Genius IA indexe et applique rigoureusement les données publiques et normes agronomiques officielles du Sahel.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
            {SCIENTIFIC_SOURCES.map((source) => (
              <div
                key={source.name}
                className="bg-card border border-border/80 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-xs"
              >
                <span className="font-heading font-bold text-sm text-primary">{source.name}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 leading-tight">
                  {source.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Field Performance (Why Farmers Trust NAFA) ── */}
      <section className="py-12 bg-background">
        <div className="container max-w-5xl mx-auto px-4 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block">
              Conçu pour le terrain
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              Rapide. Léger. Fonctionnel sans connexion.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-5 rounded-2xl border border-border space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Smartphone className="h-5 w-5" />
              </div>
              <h4 className="font-heading font-bold text-sm text-foreground">Smartphones Modestes</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Optimisé pour les téléphones Android d'entrée de gamme. Zéro ralentissement.
              </p>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="font-heading font-bold text-sm text-foreground">100% Hors-Ligne</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Consultez vos fiches techniques et parcelles même en zone rurale sans 3G/4G.
              </p>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-heading font-bold text-sm text-foreground">Données Souveraines</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vos parcelles et carnets restent votre propriété privée, stockés en local.
              </p>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <h4 className="font-heading font-bold text-sm text-foreground">Ancrage Sahélien</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Développé au Burkina Faso en adéquation avec les réalités agro-écologiques locales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Retours d'Expérience Réels (Zéro Avis Fictif) ── */}
      <UserTestimonialsSection />

      {/* ── 8. Clean Modern Footer ── */}
      <footer className="border-t border-border bg-muted/50">
        <div className="container max-w-5xl mx-auto px-4 py-10 space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-3">
              <img src={logo} alt="NAFA - AGRITECH" className="h-10 w-auto" />
              <p className="text-xs font-semibold text-foreground">NAFA - AGRITECH</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                La technologie au service de l'agriculture et de l'élevage au Burkina Faso.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Accès Rapides</h4>
              <nav className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <Link to="/dashboard/crop-planning" className="hover:text-foreground transition-colors">
                  Planification des Cultures
                </Link>
                <Link to="/dashboard/livestock" className="hover:text-foreground transition-colors">
                  Santé du Bétail
                </Link>
                <Link to="/dashboard/genius" className="hover:text-foreground transition-colors">
                  Copilote NAFA Genius
                </Link>
                <Link to="/marketplace" className="hover:text-foreground transition-colors">
                  Marché & Intrants
                </Link>
              </nav>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Légal</h4>
              <nav className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <Link to="/mentions-legales" className="hover:text-foreground transition-colors">
                  Mentions légales
                </Link>
                <Link to="/conditions-utilisation" className="hover:text-foreground transition-colors">
                  Conditions d'utilisation
                </Link>
                <Link to="/politique-confidentialite" className="hover:text-foreground transition-colors">
                  Politique de confidentialité
                </Link>
              </nav>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Contact Direct</h4>
              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPinned className="h-3.5 w-3.5 shrink-0" />
                  BOBO DIOULASSO, Burkina Faso
                </span>
                <a href="tel:+22675774852" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  +226 75774852 / +226 50134920
                </a>
                <a href="mailto:contact@nafa-agritech.com" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  contact@nafa-agritech.com
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <p>© 2026 NAFA - AGRITECH. Tous droits réservés.</p>
            <p>Conçu pour les agriculteurs, éleveurs et experts du Sahel.</p>
          </div>
        </div>
      </footer>

      {/* ── 9. Sticky Mobile Action Bar (Uber / Google Maps 1-thumb launchpad) ── */}
      <aside aria-label="Actions rapides mobiles" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border px-2 py-2 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("personas");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex flex-col items-center gap-0.5 text-primary active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Sprout className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">Métiers</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard/livestock")}
          className="flex flex-col items-center gap-0.5 text-amber-600 dark:text-amber-400 active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Beef className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">Troupeau</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/marketplace")}
          className="flex flex-col items-center gap-0.5 text-foreground active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Store className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">Marché</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard/genius")}
          className="flex flex-col items-center gap-0.5 text-indigo-600 dark:text-indigo-400 active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <Cpu className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">Génie IA</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/auth")}
          className="flex flex-col items-center gap-0.5 text-muted-foreground active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">Compte</span>
        </button>
      </aside>
    </div>
  );
};

export default Index;
