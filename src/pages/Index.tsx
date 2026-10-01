import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  ClipboardCheck,
  Cpu,
  Droplets,
  FileText,
  Layers,
  Tractor,
  Sprout,
  Beef,
  Wrench,
  Stethoscope,
  Landmark,
  Store,
  Award,
  ArrowRight,
  Home,
  MessageSquare,
  User,
  ChevronRight,
  ShieldCheck,
  Phone,
  Mail,
  MapPinned,
  ArrowUp,
  Compass,
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { partnerStorage, PartnerEntry } from "@/lib/partnerStorage";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";
import galleryFarmField from "@/assets/gallery/farm-field.jpg";
import galleryLivestock from "@/assets/gallery/livestock.jpg";
import galleryDigital from "@/assets/gallery/digital-farming.jpg";
import galleryIrrigation from "@/assets/gallery/irrigation.jpg";
import galleryHarvest from "@/assets/gallery/harvest.jpg";
import galleryFormation from "@/assets/gallery/formation.jpg";
import galleryAgronomistTablet from "@/assets/gallery/agronomist-tablet.jpg";
import galleryPartnerWarehouse from "@/assets/gallery/partner-warehouse.jpg";
import galleryGpsSurveyor from "@/assets/gallery/gps-surveyor.jpg";
import galleryPlantDiagnostic from "@/assets/gallery/plant-diagnostic.jpg";
import galleryEngineeringQuote from "@/assets/gallery/engineering-quote.jpg";
import galleryAerialParcels from "@/assets/gallery/aerial-parcels.jpg";
import galleryTractorPlowing from "@/assets/gallery/tractor-plowing.jpg";
import galleryFreshHarvest from "@/assets/gallery/fresh-harvest.jpg";
import galleryVeterinaryCare from "@/assets/gallery/veterinary-care.jpg";
import galleryAgriServices from "@/assets/gallery/agri-services.jpg";
import galleryAgriFinance from "@/assets/gallery/agri-finance.jpg";

import { RealModuleIcon } from "@/components/ui/RealModuleIcon";
import { prefetchRoute } from "@/lib/routePrefetcher";

// ── 1. Configuration des 4 Espaces Métiers (Images 100% Uniques) ──
const SPACES_CONFIG = [
  {
    id: "experts",
    title: "Agronomes & Vétérinaires",
    path: "/dashboard/field-designer",
    icon: Compass,
    realIcon: "field-designer",
    image: galleryDigital,
    badge: "NAFA FIELD DESIGNER",
  },
  {
    id: "partenaires",
    title: "Partenaires",
    path: "/dashboard/partenaire-abonnement",
    icon: Award,
    realIcon: "finance",
    image: galleryPartnerWarehouse,
    badge: "Fournisseurs & Banques",
  },
  {
    id: "producteurs",
    title: "Agriculteurs & Éleveurs",
    path: "/marketplace?role=producteurs",
    icon: Store,
    realIcon: "livestock",
    image: galleryLivestock,
    badge: "Marketplace Vitrine",
  },
  {
    id: "marketplace",
    title: "Marketplace Intrants & Services",
    path: "/marketplace?cat=produits_agricoles&role=producteurs",
    icon: ShoppingBag,
    realIcon: "marketplace",
    image: galleryFreshHarvest,
    badge: "Semences & Matériels",
  },
];

// ── 2. Configuration des 6 Outils Intelligents (Images 100% Uniques) ──
const SMART_TOOLS = [
  { id: "gps", word: "GPS", icon: MapPin, realIcon: "gps", path: "/dashboard/scouting", image: galleryGpsSurveyor },
  { id: "inspection", word: "Inspection", icon: ClipboardCheck, realIcon: "diagnostic", path: "/dashboard/smart-inspection", image: galleryFarmField },
  { id: "diagnostic", word: "Diagnostic", icon: Cpu, realIcon: "diagnostic", path: "/dashboard/expert-diagnosis", image: galleryPlantDiagnostic },
  { id: "irrigation", word: "Irrigation", icon: Droplets, realIcon: "irrigation", path: "/dashboard/genius", image: galleryIrrigation },
  { id: "devis", word: "Devis", icon: FileText, realIcon: "quote", path: "/dashboard/quote-requests", image: galleryEngineeringQuote },
  { id: "cartographie", word: "Cartographie", icon: Layers, realIcon: "cartography", path: "/dashboard/expert-cartography", image: galleryAerialParcels },
];

// ── 3. Configuration des Catégories Marketplace Rapide (Images 100% Uniques) ──
const MARKET_CATEGORIES = [
  { id: "machinisme", name: "Machinisme & Travaux", cat: "machinisme", path: "/marketplace?cat=machinisme&role=producteurs", icon: Tractor, realIcon: "tractor", image: galleryTractorPlowing },
  { id: "agricole", name: "Produits Agricoles", cat: "produits_agricoles", path: "/marketplace?cat=produits_agricoles&role=producteurs", icon: Sprout, realIcon: "crops", image: galleryHarvest },
  { id: "elevage", name: "Produits d'Élevage", cat: "produits_elevage", path: "/marketplace?cat=produits_elevage&role=producteurs", icon: Beef, realIcon: "livestock", image: galleryVeterinaryCare },
  { id: "services-agri", name: "Services Agricoles", cat: "services_agricoles", path: "/marketplace?cat=services_agricoles&role=producteurs", icon: Wrench, realIcon: "field-designer", image: galleryAgriServices },
  { id: "services-veto", name: "Services Vétérinaires", cat: "services_veterinaires", path: "/marketplace?cat=services_veterinaires&role=producteurs", icon: Stethoscope, realIcon: "veterinary", image: galleryFormation },
  { id: "finance", name: "Finance & Assurance", cat: "finance_assurance", path: "/marketplace?cat=finance_assurance&role=producteurs", icon: Landmark, realIcon: "finance", image: galleryAgriFinance },
];

const Index = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PartnerEntry[]>(() => {
    try {
      return partnerStorage.getEntriesSync();
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchPartners = async () => {
      try {
        const list = await partnerStorage.getEntries();
        if (active && list.length > 0) {
          setPartners(list);
        }
      } catch (err) {
        console.error("Erreur chargement partenaires", err);
      }
    };
    void fetchPartners();
    return () => {
      active = false;
    };
  }, []);

  // Attribution d'une distance réaliste et photo authentique par partenaire
  const partnerDistanceMap = useMemo(() => {
    const distances = ["1.8 km", "2.4 km", "3.2 km", "4.6 km", "5.1 km", "7.8 km", "9.2 km", "12.0 km"];
    return partners.slice(0, 8).map((p, idx) => {
      const city = p.location ? p.location.split(",")[0].split("(")[0].trim() : "Burkina Faso";
      const dist = distances[idx % distances.length];
      
      let img = galleryFormation;
      if (p.category === "fournisseur") {
        if (p.name.toLowerCase().includes("irrigation") || p.name.toLowerCase().includes("agrodia")) img = galleryIrrigation;
        else if (p.name.toLowerCase().includes("semences") || p.name.toLowerCase().includes("tropicasem")) img = galleryFreshHarvest;
        else img = galleryPartnerWarehouse;
      } else if (p.category === "banque") {
        img = galleryAgriFinance;
      } else if (p.category === "assurance") {
        img = galleryAgriServices;
      }

      return {
        ...p,
        distanceStr: `${city} • ${dist}`,
        photo: img,
      };
    });
  }, [partners]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111827] text-foreground font-sans pb-24 md:pb-28 selection:bg-[#F97316]/20">
      
      {/* ══════════════════════════════════════════════════════
          1. PREMIER ÉCRAN — HERO PREMIUM (Plein Écran, Max 10-15 mots)
      ══════════════════════════════════════════════════════ */}
      <section className="relative h-screen min-h-[640px] w-full flex flex-col justify-between overflow-hidden">
        {/* Visuel Réel Plein Écran (Agronome sur le terrain avec tablette / drone) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={galleryAgronomistTablet}
            alt="Agronome terrain NAFA-AGRITECH"
            className="w-full h-full object-cover object-center scale-105 animate-in fade-in zoom-in-95 duration-1000 transition-transform duration-1000 ease-out"
          />
          {/* Overlay Noir Charbon Dégradé pour Lisibilité Supérieure */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/75 via-[#111827]/40 to-[#111827]/90" />
        </div>

        {/* Barre Supérieure Épurée et Responsive */}
        <header className="relative z-10 w-full px-3.5 sm:px-6 py-3.5 sm:py-6 flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md shadow-md border border-white/30 p-1 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <img
                src={logo}
                alt="NAFA-AGRITECH"
                className="h-full w-full object-contain rounded-xl"
              />
            </div>
            <span className="font-heading font-extrabold text-white text-base sm:text-xl tracking-tight drop-shadow-sm">
              NAFA <span className="text-[#F97316]">- AGRITECH</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth?mode=login")}
              className="rounded-[24px] bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md text-[11px] sm:text-xs font-semibold px-2.5 sm:px-4"
            >
              Connexion
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/auth?mode=register")}
              className="rounded-[24px] bg-[#F97316] hover:bg-[#ea580c] text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 shadow-md shadow-orange-500/30 transition-transform active:scale-95"
            >
              S'inscrire
            </Button>
          </div>
        </header>

        {/* Cœur du Hero : Slogan (1 ligne) & Actions Principales */}
        <div className="relative z-10 container max-w-4xl mx-auto px-6 text-center flex flex-col items-center justify-center my-auto space-y-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading font-black text-white leading-tight tracking-tight drop-shadow-md">
            La technologie au service de l'agriculture africaine.
          </h1>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/marketplace?role=producteurs")}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-extrabold text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-[24px] shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Store className="h-5 w-5" />
                <span>Marketplace Vitrine</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                onClick={() => navigate("/dashboard/smart-inspection")}
                className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white font-heading font-extrabold text-base sm:text-lg px-7 sm:px-9 py-6 sm:py-7 rounded-[24px] shadow-2xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Commencer une mission</span>
              </Button>
            </div>
            <p className="text-xs text-white/80 font-medium">
              Nouveau sur NAFA ?{" "}
              <button
                type="button"
                onClick={() => navigate("/auth?mode=register")}
                className="underline font-bold text-[#F97316] hover:text-white transition-colors"
              >
                S'inscrire
              </button>
            </p>
          </div>
        </div>

        {/* Indicateur de Défilement Délicat */}
        <div className="relative z-10 pb-8 flex justify-center text-white/60">
          <a
            href="#espaces"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("espaces");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex flex-col items-center gap-1 hover:text-white transition-colors"
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest">Explorer</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce" />
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2. DEUXIÈME ÉCRAN — CHOISISSEZ VOTRE ESPACE (4 Grandes Cartes)
      ══════════════════════════════════════════════════════ */}
      <section id="espaces" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 space-y-8 scroll-mt-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-foreground tracking-tight">
            Choisissez votre espace
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Accédez directement à vos outils métiers et services certifiés.
          </p>
        </div>

        {/* Grille Responsive : 2 colonnes Mobile, 2 Tablette, 4 Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SPACES_CONFIG.map((space) => {
            const Icon = space.icon;
            return (
              <div
                key={space.id}
                onClick={() => navigate(space.path)}
                onMouseEnter={() => prefetchRoute(space.path)}
                onTouchStart={() => prefetchRoute(space.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(space.path)}
                className="group relative h-80 sm:h-96 rounded-[24px] overflow-hidden bg-[#111827] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer flex flex-col justify-between p-6 border border-border/50"
              >
                {/* Photo de fond représentative avec zoom subtil */}
                <img
                  src={space.image}
                  alt={space.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 group-hover:rotate-[0.5deg] transition-transform duration-700 ease-out"
                />
                {/* Effet shimmer lumineux balayant au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                {/* Gradient de Contraste Premium */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />

                {/* Badge Supérieur Flottant avec vraie icône réelle */}
                <div className="relative z-10 flex justify-between items-start">
                  <Badge className="bg-white/95 text-[#111827] hover:bg-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-sm animate-float-slow">
                    {space.badge}
                  </Badge>
                  <RealModuleIcon
                    type={(space as any).realIcon || "crops"}
                    size="md"
                    className="shadow-md border-2 border-white/40 group-hover:scale-110 group-hover:rotate-3 transition-transform"
                  />
                </div>

                {/* Titre & Call to Action avec transition fluide */}
                <div className="relative z-10 space-y-3">
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white leading-snug drop-shadow-sm group-hover:text-white transition-colors">
                    {space.title}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] group-hover:translate-x-2 transition-transform duration-300">
                    <span>Ouvrir l'espace</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Accès Direct Agriculteurs & Éleveurs à la Marketplace Vitrine ── */}
        <div className="rounded-[28px] bg-gradient-to-r from-emerald-950/90 via-[#111827] to-teal-950/90 border border-emerald-500/40 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <Store className="h-3.5 w-3.5" />
              <span>Marketplace Vitrine Agriculteurs & Éleveurs</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight">
              Accès direct à la Marketplace Vitrine : intrants, machinisme, élevage & finance
            </h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-2xl">
              Agriculteurs et éleveurs accèdent librement aux catalogues et services certifiés : réservez vos labours, achetez vos semences et engrais, programmez des soins vétérinaires ou sollicitez des financements et assurances.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <Button
              size="sm"
              onClick={() => navigate("/marketplace?cat=services_agricoles&role=producteurs")}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 shadow-md transition-transform active:scale-95"
            >
              Services Agricoles
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/marketplace?cat=services_veterinaires&role=producteurs")}
              className="rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 shadow-md transition-transform active:scale-95"
            >
              Services Vétérinaires
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/marketplace?cat=machinisme&role=producteurs")}
              className="rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 shadow-md transition-transform active:scale-95"
            >
              Machinisme
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/marketplace?role=producteurs")}
              className="rounded-full bg-white text-[#111827] hover:bg-emerald-50 font-bold text-xs px-4 py-2.5 shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span>Ouvrir la Marketplace Vitrine</span>
              <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3. TROISIÈME ÉCRAN — OUTILS INTELLIGENTS (Vraies Images + 1 Mot)
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-muted/20 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-foreground tracking-tight">
              Outils intelligents
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Fonctionnalités agronomiques et pastorales haute précision.
            </p>
          </div>

          {/* Grille des 6 Outils avec Vraies Images Photographiques : 2 colonnes Mobile, 3 Tablette, 6 Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {SMART_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => navigate(tool.path)}
                  onMouseEnter={() => prefetchRoute(tool.path)}
                  onTouchStart={() => prefetchRoute(tool.path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate(tool.path)}
                  className="group relative h-48 sm:h-56 rounded-[24px] overflow-hidden bg-[#111827] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer flex flex-col justify-end p-4 border border-border/60 active:scale-95"
                >
                  {/* Vraie image photographique haute fidélité */}
                  <img
                    src={tool.image}
                    alt={tool.word}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-115 group-hover:rotate-1 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-105"
                  />
                  {/* Effet shimmer lumineux balayant au survol */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                  {/* Dégradé pour lisibilité parfaite */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/50 to-transparent" />

                  {/* Badge & Titre avec vrai contraste */}
                  <div className="relative z-10 space-y-2">
                    <RealModuleIcon
                      type={(tool as any).realIcon || "crops"}
                      size="sm"
                      className="shadow-sm border border-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                    />
                    <span className="font-heading font-extrabold text-sm sm:text-base text-white block group-hover:text-[#F97316] group-hover:translate-x-0.5 transition-all drop-shadow-sm">
                      {tool.word}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bouton d'accès direct à la suite NAFA FIELD DESIGNER */}
          <div className="flex justify-center pt-2">
            <Button
              size="lg"
              onClick={() => navigate("/dashboard/field-designer")}
              className="rounded-full bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:bg-[#F97316] dark:hover:bg-[#F97316] hover:text-white dark:hover:text-white font-bold text-xs sm:text-sm px-6 py-5 shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Compass className="h-4 w-4 text-[#F97316]" />
              <span>Accéder à la suite complète NAFA FIELD DESIGNER</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════
          4. QUATRIÈME ÉCRAN — MARKETPLACE RAPIDE (Aperçu des Catégories)
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-foreground tracking-tight">
              Marketplace rapide
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Explorez les catalogues certifiés des distributeurs locaux.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/marketplace?role=producteurs")}
            className="rounded-[24px] text-xs font-semibold self-start sm:self-auto border-border hover:border-[#F97316]"
          >
            <span>Toutes les catégories</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>

        {/* Aperçu des 6 Catégories avec Grandes Images */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {MARKET_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const targetPath = (cat as any).path || `/marketplace?cat=${cat.cat}`;
            return (
              <div
                key={cat.id}
                onClick={() => navigate(targetPath)}
                onMouseEnter={() => prefetchRoute(targetPath)}
                onTouchStart={() => prefetchRoute(targetPath)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(targetPath)}
                className="group relative h-48 sm:h-56 rounded-[24px] overflow-hidden bg-[#111827] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer flex flex-col justify-end p-4 border border-border/50 active:scale-95"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-115 group-hover:rotate-1 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-105"
                />
                {/* Effet shimmer lumineux balayant au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />
                
                <div className="relative z-10 space-y-1.5">
                  <RealModuleIcon
                    type={(cat as any).realIcon || "crops"}
                    size="sm"
                    className="shadow-sm border border-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                  />
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-white line-clamp-2 leading-tight group-hover:text-white transition-colors">
                    {cat.name}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5. CINQUIÈME ÉCRAN — PARTENAIRES PROCHES (Cartes Épurées)
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-muted/20 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-foreground tracking-tight">
              Partenaires proches
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Distributeurs agréés, provenderies et institutions certifiées à proximité.
            </p>
          </div>

          {/* Cartes Partenaires : Photo, Nom, Distance, Bouton "Voir" (Aucune description longue) */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 rounded-[24px] bg-card border animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {partnerDistanceMap.map((partner) => (
                <div
                  key={partner.id}
                  className="rounded-[24px] overflow-hidden bg-card border border-border/80 hover:border-[#F97316]/50 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between group"
                >
                  {/* Photo */}
                  <div className="relative h-36 sm:h-44 overflow-hidden bg-muted">
                    <img
                      src={partner.photo}
                      alt={partner.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    {/* Effet shimmer lumineux */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                    {partner.is_verified && (
                      <div className="absolute top-3 right-3 bg-white/90 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md shadow-xs animate-float-slow">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span>Agréé</span>
                      </div>
                    )}
                  </div>

                  {/* Nom, Distance, Bouton Voir */}
                  <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-3">
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-sm sm:text-base text-foreground line-clamp-1 group-hover:text-[#F97316] transition-colors">
                        {partner.name.split(" (")[0]}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-[#F97316] shrink-0" />
                        <span className="truncate">{partner.distanceStr}</span>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => navigate(`/partenaire/${partner.id}`)}
                      className="w-full rounded-[24px] bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:bg-[#F97316] dark:hover:bg-[#F97316] hover:text-white dark:hover:text-white text-xs font-bold transition-colors"
                    >
                      Voir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6. BANNIÈRE D'INSCRIPTION & REJOINDRE L'ÉCOSYSTÈME
      ══════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-[32px] bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#111827] text-white p-8 sm:p-12 border border-border/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F97316]/20 border border-[#F97316]/40 text-[#F97316] text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Plateforme Agricole Certifiée</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
              Rejoignez dès aujourd'hui l'écosystème NAFA-AGRITECH
            </h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Agriculteurs, éleveurs, agronomes, vétérinaires et entreprises partenaires : créez votre compte gratuit et accédez aux outils professionnels 100% hors-ligne.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=register")}
              className="w-full sm:w-auto rounded-[24px] bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-sm px-6 py-6 shadow-lg shadow-orange-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>S'inscrire sur la plateforme</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth?mode=login")}
              className="w-full sm:w-auto rounded-[24px] bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md text-sm font-semibold px-6 py-6"
            >
              Connexion
            </Button>
          </div>
        </div>
      </section>

      {/* Bouton d'Action Flottant : Retour sur la page d'accueil */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Retour sur la page d'accueil"
          className="fixed bottom-20 right-4 z-40 px-3.5 py-2 rounded-full bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-xl border border-border flex items-center gap-2 text-xs font-bold hover:scale-105 active:scale-95 transition-all animate-in fade-in slide-in-from-bottom-2"
        >
          <ArrowUp className="h-4 w-4 text-[#F97316]" />
          <span>Retour sur la page d'accueil</span>
        </button>
      )}

      {/* ══════════════════════════════════════════════════════
          7. PIED DE PAGE COMPLET NAFA-AGRITECH
      ══════════════════════════════════════════════════════ */}
      <Footer />

      {/* ══════════════════════════════════════════════════════
          8. NAVIGATION INFÉRIEURE FIXE (Mobile & Web App Bar)
          Le bouton central devient l'action principale.
      ══════════════════════════════════════════════════════ */}
      <nav
        aria-label="Navigation principale inférieure"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border-t border-border shadow-2xl px-4 py-2"
      >
        <div className="max-w-md mx-auto flex items-center justify-between relative">
          
          {/* 1. Accueil / Retour sur la page d'accueil */}
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              navigate("/");
            }}
            aria-label="Retour sur la page d'accueil"
            className="flex flex-col items-center gap-1 text-[#F97316] active:scale-95 transition-transform w-14"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-bold">Accueil</span>
          </button>

          {/* 2. Marketplace */}
          <button
            type="button"
            onClick={() => navigate("/marketplace?role=producteurs")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground active:scale-95 transition-transform w-14"
          >
            <Store className="h-5 w-5" />
            <span className="text-[10px] font-bold">Marketplace</span>
          </button>

          {/* 3. PROJETS / ACTION PRINCIPALE CENTRALE */}
          <div className="flex flex-col items-center -mt-6">
            <button
              type="button"
              onClick={() => navigate("/dashboard/smart-inspection")}
              aria-label="Commencer une mission"
              className="w-14 h-14 rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white flex items-center justify-center shadow-lg shadow-orange-500/40 active:scale-90 transition-transform"
            >
              <ClipboardCheck className="h-7 w-7" />
            </button>
            <span className="text-[10px] font-extrabold text-[#F97316] mt-1">Projets</span>
          </div>

          {/* 4. Messages */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/quote-requests")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground active:scale-95 transition-transform w-14"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px] font-bold">Messages</span>
          </button>

          {/* 5. Profil */}
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground active:scale-95 transition-transform w-14"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-bold">Profil</span>
          </button>

        </div>
      </nav>

    </div>
  );
};

export default Index;
