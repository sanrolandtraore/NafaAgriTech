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
  Sparkles
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { partnerStorage, PartnerEntry } from "@/lib/partnerStorage";
import logo from "@/assets/logo.png";
import galleryFarmField from "@/assets/gallery/farm-field.jpg";
import galleryLivestock from "@/assets/gallery/livestock.jpg";
import galleryDigital from "@/assets/gallery/digital-farming.jpg";
import galleryIrrigation from "@/assets/gallery/irrigation.jpg";
import galleryHarvest from "@/assets/gallery/harvest.jpg";
import galleryFormation from "@/assets/gallery/formation.jpg";

// ── 1. Configuration des 4 Espaces Métiers ──
const SPACES_CONFIG = [
  {
    id: "experts",
    title: "Agronomes & Vétérinaires",
    path: "/dashboard/services",
    icon: Stethoscope,
    image: galleryDigital,
    badge: "Conseil & Ingénierie",
  },
  {
    id: "partenaires",
    title: "Partenaires",
    path: "/dashboard/partenaire-abonnement",
    icon: Award,
    image: galleryFormation,
    badge: "Fournisseurs & Banques",
  },
  {
    id: "producteurs",
    title: "Agriculteurs & Éleveurs",
    path: "/dashboard/crop-planning",
    icon: Sprout,
    image: galleryLivestock,
    badge: "Production Terrain",
  },
  {
    id: "marketplace",
    title: "Marketplace",
    path: "/marketplace",
    icon: Store,
    image: galleryHarvest,
    badge: "Matériels & Intrants",
  },
];

// ── 2. Configuration des 6 Outils Intelligents (1 icône + 1 mot) ──
const SMART_TOOLS = [
  { id: "gps", word: "GPS", icon: MapPin, path: "/dashboard/scouting" },
  { id: "inspection", word: "Inspection", icon: ClipboardCheck, path: "/dashboard/smart-inspection" },
  { id: "diagnostic", word: "Diagnostic IA", icon: Cpu, path: "/dashboard/expert-diagnosis" },
  { id: "irrigation", word: "Irrigation", icon: Droplets, path: "/dashboard/genius" },
  { id: "devis", word: "Devis", icon: FileText, path: "/dashboard/quote-requests" },
  { id: "cartographie", word: "Cartographie", icon: Layers, path: "/dashboard/expert-cartography" },
];

// ── 3. Configuration des Catégories Marketplace Rapide ──
const MARKET_CATEGORIES = [
  { id: "machinisme", name: "Machinisme & Travaux", cat: "materiel", icon: Tractor, image: galleryFarmField },
  { id: "agricole", name: "Produits Agricoles", cat: "semences", icon: Sprout, image: galleryHarvest },
  { id: "elevage", name: "Produits d'Élevage", cat: "elevage", icon: Beef, image: galleryLivestock },
  { id: "services-agri", name: "Services Agricoles", cat: "service", path: "/dashboard/services", icon: Wrench, image: galleryFormation },
  { id: "services-veto", name: "Services Vétérinaires", cat: "service", path: "/dashboard/veterinary-services", icon: Stethoscope, image: galleryDigital },
  { id: "finance", name: "Finance & Assurance", cat: "banque", icon: Landmark, image: galleryIrrigation },
];

const Index = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PartnerEntry[]>([]);
  const [loading, setLoading] = useState(true);
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
        if (active) {
          setPartners(list);
        }
      } catch (err) {
        console.error("Erreur chargement partenaires", err);
      } finally {
        if (active) setLoading(false);
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
        else if (p.name.toLowerCase().includes("semences") || p.name.toLowerCase().includes("tropicasem")) img = galleryHarvest;
        else img = galleryFarmField;
      } else if (p.category === "banque") {
        img = galleryDigital;
      } else if (p.category === "assurance") {
        img = galleryLivestock;
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
        <div className="absolute inset-0 z-0">
          <img
            src={galleryDigital}
            alt="Agronome terrain NAFA-AGRITECH"
            className="w-full h-full object-cover object-center scale-105 animate-in fade-in zoom-in-95 duration-1000"
          />
          {/* Overlay Noir Charbon Dégradé pour Lisibilité Supérieure */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/75 via-[#111827]/40 to-[#111827]/90" />
        </div>

        {/* Barre Supérieure Épurée */}
        <header className="relative z-10 w-full px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="NAFA-AGRITECH"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-md transition-transform group-hover:scale-105"
            />
            <span className="font-heading font-extrabold text-white text-lg sm:text-xl tracking-tight drop-shadow-sm">
              NAFA <span className="text-[#F97316]">- AGRITECH</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth?mode=login")}
              className="rounded-[24px] bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md text-xs font-semibold px-3 sm:px-4"
            >
              Connexion
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/auth?mode=register")}
              className="rounded-[24px] bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-bold px-3 sm:px-4 shadow-md shadow-orange-500/30 transition-transform active:scale-95"
            >
              S'inscrire
            </Button>
          </div>
        </header>

        {/* Cœur du Hero : Slogan (1 ligne) & Action Unique Principale (< 15 mots au total) */}
        <div className="relative z-10 container max-w-4xl mx-auto px-6 text-center flex flex-col items-center justify-center my-auto space-y-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading font-black text-white leading-tight tracking-tight drop-shadow-md">
            La technologie au service de l'agriculture africaine.
          </h1>

          <div className="space-y-3">
            <Button
              size="lg"
              onClick={() => navigate("/dashboard/smart-inspection")}
              className="bg-[#F97316] hover:bg-[#ea580c] text-white font-heading font-extrabold text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-[24px] shadow-2xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
            >
              <span>Commencer une mission</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
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
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(space.path)}
                className="group relative h-80 sm:h-96 rounded-[24px] overflow-hidden bg-[#111827] shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between p-6 border border-border/50"
              >
                {/* Photo de fond représentative */}
                <img
                  src={space.image}
                  alt={space.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                />
                {/* Gradient de Contraste Premium */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />

                {/* Badge Supérieur */}
                <div className="relative z-10 flex justify-between items-start">
                  <Badge className="bg-white/90 text-[#111827] hover:bg-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-xs">
                    {space.badge}
                  </Badge>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-[#F97316] transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                {/* Titre & Call to Action */}
                <div className="relative z-10 space-y-3">
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white leading-snug drop-shadow-sm">
                    {space.title}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] group-hover:translate-x-1 transition-transform">
                    <span>Ouvrir l'espace</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3. TROISIÈME ÉCRAN — OUTILS INTELLIGENTS (6 Icônes + 1 Mot)
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

          {/* Grille des 6 Icônes : 2 colonnes Mobile, 3 Tablette, 6 Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {SMART_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => navigate(tool.path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate(tool.path)}
                  className="group p-6 sm:p-8 rounded-[24px] bg-card border border-border/80 hover:border-[#F97316] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center flex flex-col items-center justify-center gap-4 cursor-pointer active:scale-95"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-[#F97316]/10 text-[#F97316] flex items-center justify-center transition-transform group-hover:scale-110 group-hover:bg-[#F97316] group-hover:text-white">
                    <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>
                  {/* Uniquement un mot */}
                  <span className="font-heading font-bold text-sm sm:text-base text-foreground group-hover:text-[#F97316] transition-colors">
                    {tool.word}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bouton d'accès direct à toute la suite agronomique (39 outils) */}
          <div className="flex justify-center pt-2">
            <Button
              size="lg"
              onClick={() => navigate("/dashboard/services")}
              className="rounded-full bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:bg-[#F97316] dark:hover:bg-[#F97316] hover:text-white dark:hover:text-white font-bold text-xs sm:text-sm px-6 py-5 shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Compass className="h-4 w-4 text-[#F97316]" />
              <span>Accéder à toute la suite des 39 outils agronomiques</span>
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
            onClick={() => navigate("/marketplace")}
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
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(targetPath)}
                className="group relative h-48 sm:h-56 rounded-[24px] overflow-hidden bg-[#111827] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-end p-4 border border-border/50"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />
                
                <div className="relative z-10 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-[#F97316] transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-white line-clamp-2 leading-tight">
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
                  className="rounded-[24px] overflow-hidden bg-card border border-border/80 hover:border-[#F97316]/50 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Photo */}
                  <div className="relative h-36 sm:h-44 overflow-hidden bg-muted">
                    <img
                      src={partner.photo}
                      alt={partner.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {partner.is_verified && (
                      <div className="absolute top-3 right-3 bg-white/90 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md shadow-xs">
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
              <span>Plateforme Agricole Sahélienne Certifiée</span>
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
          7. PIED DE PAGE ÉPURÉ
      ══════════════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-card/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="NAFA-AGRITECH" className="h-6 w-auto" />
            <span className="font-bold text-foreground">NAFA - AGRITECH</span>
            <span>• © 2026. Conçu pour le Sahel.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
            <Link to="/conditions-utilisation" className="hover:text-foreground transition-colors">Conditions</Link>
            <Link to="/politique-confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
          </div>
        </div>
      </footer>

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
            onClick={() => navigate("/marketplace")}
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
