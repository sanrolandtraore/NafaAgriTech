import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin, ArrowRight, Mail, Phone, MapPinned, ChevronLeft, ChevronRight,
  Microscope, FileText, Calculator, Eye, Sparkles, Tractor, Store, ShieldCheck,
  ExternalLink, Send, CheckCircle2, Globe, Smartphone, Handshake, FlaskConical, Sprout, Beef, Wrench
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { partnerStorage, PartnerOffer, PartnerEntry } from "@/lib/partnerStorage";
import ProductMediaViewer from "@/components/partner/ProductMediaViewer";
import logo from "@/assets/logo.png";
import galleryFarmField from "@/assets/gallery/farm-field.jpg";
import galleryLivestock from "@/assets/gallery/livestock.jpg";
import galleryFormation from "@/assets/gallery/formation.jpg";
import galleryHarvest from "@/assets/gallery/harvest.jpg";
import galleryDigital from "@/assets/gallery/digital-farming.jpg";
import galleryIrrigation from "@/assets/gallery/irrigation.jpg";
import videoHarvest from "@/assets/gallery/harvest-video.mp4";
import videoLivestock from "@/assets/gallery/livestock-video.mp4";
import videoIrrigation from "@/assets/gallery/irrigation-video.mp4";

// ── Données galerie NAFA - AGRITECH ──
const galleryItems: { src: string; title: string; desc: string; type: "image" | "video" }[] = [
  { src: galleryFarmField, title: "Champs de mil au coucher du soleil", desc: "Récolte traditionnelle dans la savane", type: "image" },
  { src: videoHarvest, title: "Récolte en action", desc: "Scènes de récolte sous le soleil doré", type: "video" },
  { src: galleryLivestock, title: "Élevage bovin au Sahel", desc: "Troupeau en pâturage naturel", type: "image" },
  { src: videoLivestock, title: "Vie pastorale", desc: "Le quotidien de l'élevage en savane", type: "video" },
  { src: galleryFormation, title: "Séance de formation", desc: "Producteurs en session d'apprentissage", type: "image" },
  { src: galleryHarvest, title: "Marché de produits frais", desc: "Diversité des cultures locales", type: "image" },
  { src: videoIrrigation, title: "Irrigation moderne", desc: "Systèmes d'arrosage en fonctionnement", type: "video" },
  { src: galleryDigital, title: "Agriculture numérique", desc: "La technologie au service du terrain", type: "image" },
  { src: galleryIrrigation, title: "Systèmes d'irrigation", desc: "Modernisation des pratiques agricoles", type: "image" },
];

const HOME_CATEGORY_FILTERS = [
  { value: "all", label: "Toutes les offres", icon: Store },
  { value: "materiel", label: "Matériel & Machinisme", icon: Tractor },
  { value: "intrants", label: "Intrants & Fertilisants", icon: FlaskConical },
  { value: "semences", label: "Semences Certifiées", icon: Sprout },
  { value: "elevage", label: "Élevage & Nutrition", icon: Beef },
  { value: "service", label: "Services & Travaux", icon: Wrench },
];

// ── Auto-scroll carousel hook ──
function useCarousel(length: number, interval = 4000) {
  const [index, setIndex] = useState(0);
  const prev = useCallback(() => setIndex(i => (i - 1 + length) % length), [length]);
  const next = useCallback(() => setIndex(i => (i + 1) % length), [length]);
  useEffect(() => {
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [next, interval]);
  return { index, setIndex, prev, next };
}

const Index = () => {
  const navigate = useNavigate();
  const [partnerOffers, setPartnerOffers] = useState<PartnerOffer[]>([]);
  const [partnersList, setPartnersList] = useState<PartnerEntry[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [loadingPartners, setLoadingPartners] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [offers, pList] = await Promise.all([
          partnerStorage.getOffers(),
          partnerStorage.getPartners(),
        ]);
        if (!cancelled) {
          setPartnerOffers(offers.filter(o => o.is_active));
          setPartnersList(pList);
        }
      } catch (e) {
        console.error("Error loading partner data", e);
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

  const galleryCarousel = useCarousel(galleryItems.length, 5000);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="gradient-hero min-h-[85vh] flex items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-secondary blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="container max-w-5xl mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
            <img src={logo} alt="NAFA - AGRITECH" className="h-28 sm:h-32 w-auto drop-shadow-lg" />
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-primary-foreground uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground shrink-0" />
              <span>Plateforme Intelligente NAFA - AGRITECH</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-extrabold text-primary-foreground tracking-tight">
                NAFA <span className="text-gradient-warm">- AGRITECH</span>
              </h1>
              <p className="text-xl sm:text-2xl text-emerald-200 font-semibold italic max-w-2xl mx-auto">
                « La technologie au service de l'agriculture africaine »
              </p>
            </div>
            <p className="text-base md:text-lg text-primary-foreground/90 max-w-3xl leading-relaxed">
              Le partenaire technologique de référence des producteurs, maraîchers, éleveurs et coopératives au Burkina Faso et en Afrique. 
              Diagnostic IA des maladies, ordonnances agronomiques certifiées, calculatrice agro, scouting géolocalisé et accès direct aux intrants et matériels.
            </p>
            <div className="flex gap-4 flex-wrap justify-center pt-2">
              <Button size="lg" onClick={() => navigate("/auth")} className="gradient-warm text-accent-foreground font-semibold px-8 shadow-warm hover:opacity-90 transition-opacity">
                Accéder aux services <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="border-black bg-black text-white hover:bg-black/90 hover:text-white font-medium">
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* OFFRES & PRODUITS DES PARTENAIRES AGRÉÉS (Photos, Vidéos & Vitrines Dédiées) */}
      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="container max-w-6xl mx-auto px-4 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Store className="h-3.5 w-3.5" /> Catalogue & Vitrines Partenaires
            </div>
            <h2 className="text-3xl font-heading font-bold">
              Offres & Équipements de nos <span className="text-gradient-warm">Partenaires Agréés</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Découvrez les semences certifiées, fertilisants, matériels motorisés et services publiés par nos entreprises partenaires avec démonstrations vidéos. Chaque partenaire dispose de sa boutique unique.
            </p>
          </div>

          {/* Filtres par catégorie */}
          <div className="flex flex-wrap justify-center gap-2">
            {HOME_CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCat(cat.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedCat === cat.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card hover:bg-muted text-foreground border border-border"
                }`}
              >
                {cat.icon && <cat.icon className="h-3.5 w-3.5 shrink-0" />}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Grille des offres partenaires */}
          {loadingPartners ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-card border animate-pulse" />
              ))}
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground bg-card border rounded-2xl p-8">
              Aucune offre dans cette catégorie pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.slice(0, 6).map((offer) => (
                <Card key={offer.id} className="overflow-hidden flex flex-col justify-between hover:shadow-warm transition-all duration-300 border-border/80 hover:border-primary/40 bg-card">
                  <div>
                    {/* Visionneuse média intégrée avec vidéos/photos */}
                    <div className="bg-muted">
                      <ProductMediaViewer media={offer.media || []} title={offer.title} />
                    </div>

                    <CardContent className="p-4 space-y-3">
                      {/* En-tête partenaire & lien vers sous-page unique */}
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/partenaire/${offer.owner_id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group truncate"
                          title="Visiter la vitrine dédiée du partenaire"
                        >
                          <Store className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                          <span className="truncate">{offer.partner_name}</span>
                        </Link>
                        <Badge variant="outline" className="text-[10px] shrink-0 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Agréé
                        </Badge>
                      </div>

                      {/* Titre & Prix */}
                      <div>
                        <h3 className="font-heading font-bold text-base leading-snug line-clamp-2">
                          {offer.title}
                        </h3>
                        {offer.price_indication ? (
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-lg font-heading font-bold text-primary">
                              {offer.price_indication}
                            </span>
                            {offer.unit && (
                              <span className="text-xs text-muted-foreground">/ {offer.unit}</span>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs font-semibold text-muted-foreground">Tarif sur devis</p>
                        )}
                      </div>

                      {/* Description */}
                      {offer.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {offer.description}
                        </p>
                      )}

                      {/* Localisation */}
                      {offer.location_name && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                          <span>{offer.location_name}</span>
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* Boutons d'action */}
                  <div className="p-4 pt-0 border-t border-border/40 mt-3 grid grid-cols-2 gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold w-full"
                    >
                      <Link to={`/partenaire/${offer.owner_id}`}>
                        <Store className="h-3.5 w-3.5 mr-1 text-primary" />
                        Vitrine
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="gradient-primary text-primary-foreground text-xs font-semibold w-full shadow-xs"
                    >
                      <Link to="/auth">
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Commander
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Bandeau des boutiques et partenaires officiels */}
          <div className="pt-4 border-t border-border/60">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center mb-4">
              Boutiques officielles & Partenaires agréés NAFA - AGRITECH
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {partnersList.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to={`/partenaire/${p.id}`}
                  className="bg-card border border-border/80 hover:border-primary/50 hover:shadow-xs p-3 rounded-xl flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                    {p.name.charAt(0)}
                  </div>
                  <div className="w-full">
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

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <h2 className="text-3xl font-heading font-bold">
              Plateforme AgriTech & <span className="text-gradient-warm">Aide à la Décision</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Tous les outils d'aide à la décision et de productivité agronomique réunis pour producteurs, conseillers techniques et coopératives.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Microscope, title: "Diagnostic IA Végétal", desc: "Prenez une photo de feuille ou tige : l'intelligence artificielle identifie instantanément ravageurs, maladies et carences minérales." },
              { icon: FileText, title: "Ordonnances Certifiées", desc: "Génération automatique d'ordonnances phytosanitaires au format PDF signées avec posologie exacte et délais avant récolte." },
              { icon: Calculator, title: "Calculatrice Agro & Doses", desc: "Calculez précisément les densités de semis, fractionnements NPK, besoins en eau ETc et projections de rendement." },
              { icon: Eye, title: "Scouting Terrain Géolocalisé", desc: "Relevés d'observations sur le terrain avec capture GPS, photos datées et génération de rapports de patrouille." },
              { icon: MapPin, title: "Cartographie & Parcelles", desc: "Délimitez vos parcelles par GPS, calculez les surfaces réelles et pilotez les cycles culturaux saison par saison." },
              { icon: Tractor, title: "Mécanisation & Intrants", desc: "Accédez en direct aux partenaires agricoles agréés NAFA - AGRITECH : labour tracteur, pulvérisation de précision, semences certifiées et fertilisants." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-warm transition-all duration-300 hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Provider Subscription Highlight */}
          <div className="mt-12 bg-gradient-to-r from-primary/15 via-primary/5 to-muted/40 border border-primary/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Entreprises & Prestataires
              </div>
              <h3 className="text-2xl font-heading font-bold text-foreground">
                Vous êtes prestataire de services, vendeur d'intrants ou loueur de matériel ?
              </h3>
              <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                Abonnez votre entreprise pour équiper vos équipes avec les outils professionnels NAFA - AGRITECH : Diagnostic IA, Ordonnances signées, Scouting terrain, gestion de flotte de location et vitrine marketplace.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="gradient-primary text-primary-foreground font-semibold px-6 shadow-warm shrink-0 hover:opacity-95"
            >
              Découvrir les formules pro <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Gallery Carousel */}
      <section className="py-20 bg-muted/50">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-4">
            Découvrez le <span className="text-gradient-warm">terrain</span>
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Des champs de mil aux marchés locaux, notre plateforme accompagne chaque étape.
          </p>

          <div className="relative">
            <button
              onClick={galleryCarousel.prev}
              className="absolute left-2 md:-left-5 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-background/90 border border-border shadow-lg hover:bg-accent transition-colors"
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={galleryCarousel.next}
              className="absolute right-2 md:-right-5 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-background/90 border border-border shadow-lg hover:bg-accent transition-colors"
              aria-label="Image suivante"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>

            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${galleryCarousel.index * 100}%)` }}
              >
                {galleryItems.map((item, i) => (
                  <div key={i} className="flex-shrink-0 w-full relative">
                    <div className="aspect-[16/9] overflow-hidden">
                      {item.type === "video" ? (
                        <video
                          src={item.src}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.src}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading={i === 0 ? "eager" : "lazy"}
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                      <h3 className="text-xl md:text-2xl font-heading font-bold text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm md:text-base text-white/80">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {galleryItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => galleryCarousel.setIndex(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === galleryCarousel.index ? "w-8 bg-primary" : "w-2.5 bg-border hover:bg-muted-foreground/40"
                  }`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* À propos */}
      <section className="py-20 bg-background">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">
            À propos de <span className="text-gradient-warm">NAFA - AGRITECH</span>
          </h2>
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">NAFA - AGRITECH</strong> est une startup agritech basée à <strong className="text-foreground">BOBO DIOULASSO, Burkina Faso</strong>, dédiée à la modernisation de l'agriculture en Afrique de l'Ouest.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Notre mission : fournir aux agriculteurs, éleveurs et experts agronomes des outils et formations numériques simples et accessibles pour gérer leurs exploitations, optimiser leurs rendements et améliorer leurs revenus.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Fondée par des passionnés du monde rural, notre équipe combine expertise agricole locale et innovation technologique pour répondre aux défis concrets du terrain.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Globe, label: "Conçu en Afrique, pour l'Afrique" },
                { icon: Smartphone, label: "Accessible hors connexion" },
                { icon: Handshake, label: "Formations agriculture & élevage" },
                { icon: ShieldCheck, label: "Données sécurisées" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-card rounded-xl p-4 border border-border text-center shadow-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted">
        <div className="container max-w-5xl mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-1 space-y-3">
              <img src={logo} alt="NAFA - AGRITECH" className="h-12 w-auto" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">NAFA - AGRITECH</p>
                <p className="text-xs text-muted-foreground">La technologie au service de l'agriculture africaine.</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Ressources légales</h4>
              <nav className="flex flex-col gap-2">
                <Link to="/mentions-legales" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mentions légales</Link>
                <Link to="/conditions-utilisation" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Conditions d'utilisation</Link>
                <Link to="/politique-confidentialite" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Politique de confidentialité</Link>
              </nav>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Contact</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4 shrink-0" />
                  BOBO DIOULASSO, Burkina Faso
                </span>
                <a href="mailto:contact@nafa-agritech.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="h-4 w-4 shrink-0" />
                  contact@nafa-agritech.com
                </a>
                <a href="tel:+22675774852" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4 shrink-0" />
                  +226 75774852 / +226 50134920
                </a>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Suivez-nous</h4>
              <div className="flex gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" aria-label="Facebook">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" aria-label="X (Twitter)">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" aria-label="LinkedIn">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://wa.me/22675774852" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" aria-label="WhatsApp">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© 2026 NAFA - AGRITECH. Tous droits réservés.</p>
            <p className="text-xs text-muted-foreground">La technologie au service de l'agriculture africaine</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
