import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  Sprout,
  Compass,
  Store,
  Users,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";
import galleryFormation from "@/assets/gallery/formation.jpg";
import galleryAgronomistTablet from "@/assets/gallery/agronomist-tablet.jpg";

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-[#F97316]/20">
      {/* ── Barre Supérieure ── */}
      <header className="border-b border-border/80 bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl border border-border/60 hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Retour à l'accueil"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden bg-white shadow-2xs border border-emerald-500/20 p-0.5 flex items-center justify-center shrink-0">
                <img src={logo} alt="NAFA-AGRITECH" className="h-full w-full object-contain rounded-lg" />
              </div>
              <span className="font-heading font-extrabold text-base sm:text-lg">
                NAFA <span className="text-[#F97316]">- AGRITECH</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/contact")}
              className="rounded-full text-xs font-semibold"
            >
              Contact
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/auth?mode=register")}
              className="rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-bold shadow-xs"
            >
              S'inscrire
            </Button>
          </div>
        </div>
      </header>

      {/* ── Contenu Principal ── */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-muted/40 via-background to-background border-b border-border/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] text-xs font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>À propos de NAFA-AGRITECH</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight leading-tight">
              La technologie au service de l'agriculture africaine
            </h1>

            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Solutions agricoles, services techniques et technologies pour accompagner les producteurs, agronomes, éleveurs et entreprises agricoles en Afrique.
            </p>
          </div>
        </section>

        {/* Section Mission & Vision */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                  Notre Vocation
                </span>
                <h2 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight">
                  Construire le socle numérique de l'agri-business sahélien
                </h2>
              </div>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Fondée à <strong>Bobo-Dioulasso</strong>, capitale économique et carrefour agricole du Burkina Faso, <strong>NAFA-AGRITECH</strong> conçoit des solutions logicielles et techniques adaptées aux réalités du terrain ouest-africain.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm">Disponibilité sans connexion (Priorité au local)</h3>
                    <p className="text-xs text-muted-foreground">
                      Collecte de données parcellaires, fiches d'inspection et relevés GPS opérationnels en zone blanche avec synchronisation intelligente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm">Normes agronomiques certifiées</h3>
                    <p className="text-xs text-muted-foreground">
                      Algorithmes calibrés sur les données scientifiques de l'INERA Farako-Bâ, la méthode FAO-56 pour l'irrigation et les mercuriales officielles locales.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#F97316]/10 text-[#F97316] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm">Écosystème unifié & Marché Vitrine</h3>
                    <p className="text-xs text-muted-foreground">
                      Mise en relation directe entre producteurs ruraux, agronomes indépendants, cliniques vétérinaires et distributeurs d'intrants certifiés.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative rounded-[28px] overflow-hidden shadow-2xl border border-border">
              <img
                src={galleryAgronomistTablet}
                alt="Équipe agronomique NAFA-AGRITECH"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                <Badge className="bg-[#F97316] text-white border-0 text-[10px] font-bold">
                  Siège opérationnel
                </Badge>
                <h4 className="text-lg font-heading font-bold">Bobo-Dioulasso, Burkina Faso</h4>
                <p className="text-xs text-white/80">Au plus près des bassins cotonniers, céréaliers et maraîchers du Sahel.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Coordonnées Officielles */}
        <section className="py-12 bg-muted/30 border-y border-border/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold">Coordonnées Officielles</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Contactez directement notre siège ou nos équipes techniques.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#F97316]/10 text-[#F97316] flex items-center justify-center mx-auto">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-sm">Adresse</h3>
                <p className="text-xs text-muted-foreground">Bobo-Dioulasso, Burkina Faso</p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#F97316]/10 text-[#F97316] flex items-center justify-center mx-auto">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-sm">Email Officiel</h3>
                <a href="mailto:nafaagritech@gmail.com" className="text-xs text-[#F97316] hover:underline block font-medium">
                  nafaagritech@gmail.com
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#F97316]/10 text-[#F97316] flex items-center justify-center mx-auto">
                  <Phone className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-sm">Téléphones</h3>
                <div className="space-y-0.5 text-xs text-muted-foreground font-medium">
                  <a href="tel:+22675774852" className="hover:text-foreground block">+226 75 77 48 52</a>
                  <a href="tel:+22650134920" className="hover:text-foreground block">+226 50 13 49 20</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
};

export default AboutPage;
