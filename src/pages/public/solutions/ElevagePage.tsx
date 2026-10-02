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
  Beef,
  Stethoscope,
  HeartPulse,
  Scale,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import galleryLivestock from "@/assets/gallery/livestock.jpg";
import galleryVeterinaryCare from "@/assets/gallery/veterinary-care.jpg";

export default function ElevagePage() {
  const navigate = useNavigate();
  const seo = SEO_PAGES.solutionElevage;

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
            "name": "Gestion d'Élevage et Suivi Zootechnique",
            "serviceType": "Zootechnie & Santé Animale",
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
          { name: "Élevage", url: "/solutions/elevage" },
        ]}
      />

      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-emerald-500/10 via-background to-background border-b border-border/60">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                Zootechnie &amp; Santé Animale Sahélienne
              </Badge>
              <Badge className="bg-emerald-600 text-white text-[10px]">Multi-Espèces</Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground leading-tight">
              Gestion d'Élevage &amp; Suivi Zootechnique
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Optimisez la croissance et la santé de votre cheptel : suivi des lots et individus (bovins, ovins, caprins, volailles),
              calendrier prophylactique et vaccinal, rationnement alimentaire équilibré et connexion aux vétérinaires partenaires.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=register")}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md gap-2"
              >
                <span>Créer mon atelier d'élevage</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/services?cat=services_veterinaires")}
                className="rounded-full font-bold px-6 gap-2"
              >
                <span>Trouver un vétérinaire partenaire</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Détails */}
        <section className="py-16 container max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">
                Des outils professionnels pour l'embouche et le pastoralisme
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le module élevage NAFA-AGRITECH intègre les ratios nutritionnels de référence (UFL, MAD) et les vaccins obligatoires au Sahel.
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/80">
                  <HeartPulse className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Carnet de santé &amp; Alertes vaccinales</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Rappels automatiques des dates de vaccination contre la péripneumonie contagieuse bovine (PPCB), la peste des petits ruminants (PPR) et la maladie de Newcastle.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/80">
                  <Scale className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Formulateur de rations alimentaires économiques</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Équilibrez les apports énergétiques et azotés avec les sous-produits agro-industriels locaux : fane de niébé, tourteau de coton, son de maïs et pierres à lécher.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/80">
                  <Stethoscope className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Mise en relation avec des vétérinaires diplômés</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Contactez directement un docteur vétérinaire ou un technicien d'élevage agréé partenaire pour les interventions sur site.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden border border-border shadow-xl bg-card">
              <img
                src={galleryLivestock}
                alt="Élevage de bovins et ovins suivi par NAFA-AGRITECH"
                className="w-full h-80 object-cover object-center"
              />
              <div className="p-5 bg-card border-t text-xs text-muted-foreground">
                <strong>Règle d'or NAFA-AGRITECH :</strong> L'application apporte le suivi zootechnique et les calculs de rationnement. Les actes médicaux et chirurgicaux vétérinaires sont assurés par des professionnels partenaires.
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
