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
  Sprout,
  CheckCircle2,
  Calendar,
  Compass,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Wheat,
  Activity,
} from "lucide-react";
import galleryFarmField from "@/assets/gallery/farm-field.jpg";

export default function ConseilsAgronomiquesPage() {
  const navigate = useNavigate();
  const seo = SEO_PAGES.solutionConseils;

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
            "name": "Conseils Agronomiques et Fiches Techniques Sahéliennes",
            "serviceType": "Conseil Agricole & Vulgarisation",
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
          { name: "Conseils Agronomiques", url: "/solutions/conseils-agronomiques" },
        ]}
      />

      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-emerald-500/10 via-background to-background border-b border-border/60">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                Agronomie Sahélienne &amp; Vulgarisation
              </Badge>
              <Badge className="bg-emerald-600 text-white text-[10px]">Référentiels INERA</Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground leading-tight">
              Conseils Agronomiques &amp; Fiches Techniques
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Accédez à des recommandations scientifiques éprouvées pour sécuriser et démultiplier vos récoltes :
              choix variétal certifié, date de semis optimale, fertilisation NPK fractionnée et protection intégrée
              adaptées aux zones soudanienne, soudano-sahélienne et sahélienne.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/fiches-techniques")}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md gap-2"
              >
                <BookOpen className="h-4 w-4" />
                <span>Consulter les fiches techniques des cultures</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth?mode=register")}
                className="rounded-full font-bold px-6 gap-2"
              >
                <span>Créer mon compte</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Contenu Détaillé */}
        <section className="py-16 container max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border border-border/80 p-6 space-y-3 bg-card shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                <Wheat className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Semences &amp; Variétés Améliorées</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Catalogue exhaustif des semences certifiées au Burkina Faso (maïs Barka/Espoir, sorgho blanc, riz FKR, niébé KVx, sésame S-42, arachide). Cycle, résistance à la sécheresse et potentiel de rendement.
              </p>
            </Card>

            <Card className="rounded-3xl border border-border/80 p-6 space-y-3 bg-card shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center font-bold">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Fertilisation Raisonnée</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Plans d'apport d'engrais NPK et Urée fractionnés aux stades phénologiques critiques (tallage, floraison). Équilibre entre fumure organique (compost) et minérale selon la teneur du sol.
              </p>
            </Card>

            <Card className="rounded-3xl border border-border/80 p-6 space-y-3 bg-card shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-sky-600/10 text-sky-600 flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Protection Agroécologique</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lutte intégrée contre la chenille légionnaire d'automne, le Striga, les viroses et les pourritures. Préparations locales à base de neem et bio-pesticides homologués.
              </p>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
