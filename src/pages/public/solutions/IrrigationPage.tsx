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
  Droplets,
  Sun,
  CheckCircle2,
  Compass,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Gauge,
  Activity,
} from "lucide-react";
import galleryIrrigation from "@/assets/gallery/irrigation.jpg";

export default function IrrigationPage() {
  const navigate = useNavigate();
  const seo = SEO_PAGES.solutionIrrigation;

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
            "name": "Conception et Dimensionnement d'Irrigation Agricole",
            "serviceType": "Génie Rural & Hydraulique Agricole",
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
          { name: "Irrigation", url: "/solutions/irrigation" },
        ]}
      />

      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-emerald-500/10 via-background to-background border-b border-border/60">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                Hydraulique Agricole &amp; Solaire
              </Badge>
              <Badge className="bg-emerald-600 text-white text-[10px]">Norme FAO-56</Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground leading-tight">
              Conception &amp; Optimisation de l'Irrigation Agricole
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Dimensionnez avec précision vos réseaux de goutte-à-goutte, micro-aspersion et systèmes de pompage
              photovoltaïque. Évitez les surcoûts d'équipement et garantissez un arrosage régulier à chaque pied de culture.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/explorer?tab=irrigation")}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md gap-2"
              >
                <Compass className="h-4 w-4" />
                <span>Tester le calculateur d'irrigation</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/services?cat=irrigation_solaire")}
                className="rounded-full font-bold px-6 gap-2"
              >
                <span>Trouver un installateur d'irrigation</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Détails Techniques */}
        <section className="py-16 container max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">
                L'ingénierie hydraulique mise à la portée de tous
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le module d'irrigation NAFA-AGRITECH applique les équations physiques d'écoulement sous pression
                et les coefficients culturaux de la FAO pour adapter le débit d'eau au climat sahélien.
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/80">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Besoins en eau journaliers (ETc = ETo × Kc)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Prise en compte de l'évapotranspiration de pointe de votre région (jusqu'à 7.5 mm/jour en période chaude) pour éviter le stress hydrique en maraîchage.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/80">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Dimensionnement PEHD, PVC &amp; Pertes de charge</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Calcul automatique des diamètres optimaux pour maintenir une pression homogène de la première à la dernière rampe.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/80">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Calibrage Pompe Solaire &amp; Panneaux (Watt-crête)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Détermination de la puissance photovoltaïque requise selon l'ensoleillement journalier moyen (5 à 6 heures équivalentes) et la profondeur du forage.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden border border-border shadow-xl bg-card">
                <img
                  src={galleryIrrigation}
                  alt="Installation d'irrigation goutte-à-goutte en plein champ"
                  className="w-full h-80 object-cover object-center"
                />
                <div className="p-5 bg-card border-t text-xs text-muted-foreground">
                  <strong>Positionnement officiel :</strong> NAFA-AGRITECH fournit les calculs et le dossier de conception numérique. L'installation physique des pompes et réseaux est réalisée par les entreprises et techniciens partenaires enregistrés.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
