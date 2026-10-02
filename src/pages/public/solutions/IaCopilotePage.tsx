import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { SEO_PAGES, generateWebsiteSchema, generateSoftwareApplicationSchema } from "@/lib/seoConfig";
import PublicNavbar from "@/components/public/PublicNavbar";
import Footer from "@/components/Footer";
import {
  Sparkles,
  FileCheck,
  Calculator,
  Compass,
  ArrowRight,
  ShieldCheck,
  Cpu,
  WifiOff,
} from "lucide-react";
import galleryDigital from "@/assets/gallery/digital-farming.jpg";

export default function IaCopilotePage() {
  const navigate = useNavigate();
  const seo = SEO_PAGES.solutionIaCopilote;

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
            "@type": "SoftwareApplication",
            "name": "NAFA Genius Copilote Agronomique",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "All (Web, Android PWA)",
            "description": seo.description,
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "XOF"
            }
          }
        ]}
        breadcrumbs={[
          { name: "Accueil", url: "/" },
          { name: "Solutions", url: "/solutions" },
          { name: "Copilote IA NAFA Genius", url: "/solutions/ia-copilote" },
        ]}
      />

      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-emerald-500/10 via-background to-background border-b border-border/60">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                Copilote Unifié d'Ingénierie de Terrain
              </Badge>
              <Badge className="bg-emerald-600 text-white text-[10px]">100% Hors-Ligne</Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground leading-tight">
              NAFA Genius — Copilote d'Ingénierie Agronomique
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              L'assistant d'aide à la décision qui unifie arpentage géodésique, hydraulique FAO-56,
              aviculture bioclimatique et chiffrage instantané de devis en FCFA.
              Conçu pour fonctionner au champ sans réseau.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/explorer")}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md gap-2"
              >
                <Compass className="h-4 w-4" />
                <span>Tester NAFA Genius en démonstration</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth?mode=register")}
                className="rounded-full font-bold px-6 gap-2"
              >
                <span>Créer mon compte professionnel</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Détails */}
        <section className="py-16 container max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border border-border/80 p-6 space-y-3 bg-card shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                <WifiOff className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Autonomie Totale Hors-Ligne</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Toutes les formules d'ingénierie et tables agronomiques sont embarquées localement. Vous calculez vos devis et calibrez vos systèmes directement au milieu des champs sans signal 4G.
              </p>
            </Card>

            <Card className="rounded-3xl border border-border/80 p-6 space-y-3 bg-card shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center font-bold">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Devis Instantanés en FCFA</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Génération immédiate des coûts de terrassement, tuyauteries PEHD, raccords, pompes solaires et clôtures selon la mercuriale des prix réels du marché ouest-africain.
              </p>
            </Card>

            <Card className="rounded-3xl border border-border/80 p-6 space-y-3 bg-card shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-sky-600/10 text-sky-600 flex items-center justify-center font-bold">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Dossiers Techniques PDF</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Édition de rapports complets prêts à signer avec le logo de votre cabinet d'agronomie ou bureau d'études grâce au système de marque blanche partenaire.
              </p>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
