import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { SEO_PAGES, generateWebsiteSchema, generateSoftwareApplicationSchema } from "@/lib/seoConfig";
import PublicNavbar from "@/components/public/PublicNavbar";
import Footer from "@/components/Footer";
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Database,
  Compass,
  FileText,
  Search,
  BookOpen,
} from "lucide-react";
import galleryPlantDiagnostic from "@/assets/gallery/plant-diagnostic.jpg";

export default function DiagnosticAgricolePage() {
  const navigate = useNavigate();
  const seo = SEO_PAGES.solutionDiagnostic;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={seo.title}
        description={seo.description}
        canonicalPath={seo.canonicalPath}
        keywords={seo.keywords}
        schemaJsonLd={[
          generateWebsiteSchema(),
          generateSoftwareApplicationSchema(),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Diagnostic Végétal et Identification Botanique",
            "serviceType": "Diagnostic Phytosanitaire",
            "provider": {
              "@type": "Organization",
              "name": "NAFA-AGRITECH"
            },
            "description": seo.description,
            "areaServed": "Burkina Faso, Sahel, Afrique de l'Ouest"
          }
        ]}
        breadcrumbs={[
          { name: "Accueil", url: "/" },
          { name: "Solutions", url: "/solutions" },
          { name: "Diagnostic Agricole", url: "/solutions/diagnostic-agricole" },
        ]}
      />

      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-emerald-500/10 via-background to-background border-b border-border/60">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                Moteur Botanique &amp; RAG Phytopathologique
              </Badge>
              <Badge className="bg-emerald-600 text-white text-[10px]">100% Autonome</Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground leading-tight">
              Diagnostic Agricole &amp; Identification des Cultures
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Protégez vos rendements en identifiant immédiatement les maladies foliaires, les carences nutritives
              et les adventices parasitaires. Une technologie autonome développée pour fonctionner sur le terrain,
              sans dépendre d'une connexion internet permanente.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/explorer?tab=fiches")}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md gap-2"
              >
                <Compass className="h-4 w-4" />
                <span>Tester le simulateur en accès libre</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth?mode=register")}
                className="rounded-full font-bold px-6 gap-2"
              >
                <span>Créer mon compte pour sauvegarder</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Détails Techniques & Fonctionnalités Réelles */}
        <section className="py-16 container max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">
                Une architecture en 4 étapes scientifiques certifiées
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Contrairement aux simples applications de reconnaissance d'images généralistes, NAFA-AGRITECH
                applique un pipeline agronomique rigoureux en 4 étapes conformes aux directives de l'INERA et du CILSS.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-start gap-3.5">
                  <span className="h-7 w-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Distinction stricte Culture vs Adventice</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Certification préalable du végétal. Si une mauvaise herbe parasitaire majeure est détectée (ex: <em>Striga hermonthica</em>), le système bascule directement sur le protocole d'éradication sans confusion avec une maladie de culture.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-start gap-3.5">
                  <span className="h-7 w-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Biométrie foliaire &amp; Détection des biomarqueurs</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mesure du taux d'altération de la feuille, de la surface de nécrose, des pustules éruptives de rouille et des feutrages mycéliens blanchâtres (oïdium / mildiou).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-start gap-3.5">
                  <span className="h-7 w-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Corrélation au contexte pédo-climatique sahélien</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Prise en compte de la saison culturale réelle (hivernage, contre-saison sèche), de la région administrative et du type de sol pour éliminer les faux positifs.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-start gap-3.5">
                  <span className="h-7 w-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Prescription double : Biologique &amp; Homologuée CILSS</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recommandation de solutions agroécologiques (extraits de neem, bouillie bordelaise) et de matières actives homologuées avec dosage exact par hectare et délai avant récolte (DAR).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden border border-border shadow-2xl bg-card">
                <img
                  src={galleryPlantDiagnostic}
                  alt="Analyse foliaire et diagnostic végétal NAFA-AGRITECH"
                  className="w-full h-80 sm:h-96 object-cover object-center"
                />
                <div className="p-6 space-y-3 bg-card border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Référentiels Ouverts
                    </span>
                    <Badge variant="outline" className="text-[10px]">Open Data</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    S'appuie sur le dataset international PlantVillage (54 306 images annotées), les fiches phytosanitaires INERA (Farako-Bâ &amp; Kamboinsé), le CABI Crop Protection Compendium et les listes officielles du Comité Sahélien des Pesticides (CSP-CILSS).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bannière CTA */}
          <div className="p-8 sm:p-10 rounded-3xl bg-emerald-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                Prêt à tester le diagnostic sur vos parcelles ?
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                Accédez dès maintenant au simulateur libre ou créez votre compte professionnel pour conserver l'historique de vos inspections.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                size="lg"
                onClick={() => navigate("/explorer?tab=fiches")}
                className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold rounded-2xl shadow-md text-xs sm:text-sm"
              >
                Tester le simulateur
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth?mode=register")}
                className="bg-emerald-700 text-white border-white/30 hover:bg-emerald-800 font-bold rounded-2xl text-xs sm:text-sm"
              >
                Créer un compte
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
