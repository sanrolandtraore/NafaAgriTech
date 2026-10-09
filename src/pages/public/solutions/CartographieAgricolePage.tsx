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
  MapPin,
  Layers,
  CheckCircle2,
  Compass,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Globe,
  Share2,
} from "lucide-react";
import galleryGpsSurveyor from "@/assets/gallery/gps-surveyor.jpg";
import galleryAerialParcels from "@/assets/gallery/aerial-parcels.jpg";

export default function CartographieAgricolePage() {
  const navigate = useNavigate();
  const seo = SEO_PAGES.solutionCartographie;

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
            "name": "Cartographie et Arpentage GPS Agricole",
            "serviceType": "Topographie & Cartographie Agricole",
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
          { name: "Cartographie Agricole", url: "/solutions/cartographie-agricole" },
        ]}
      />

      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-emerald-500/10 via-background to-background border-b border-border/60">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                Géomatique &amp; Arpentage de Terrain
              </Badge>
              <Badge className="bg-emerald-600 text-white text-[10px]">Précision WGS84</Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground leading-tight">
              Cartographie &amp; Délimitation GPS des Exploitations
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Mesurez précisément la surface de vos champs en hectares et ares, tracez les limites foncières,
              découpez les blocs culturaux et générez des dossiers cartographiques normalisés pour les dossiers
              bancaires, bailleurs de fonds et projets de développement.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/explorer?tab=gps")}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md gap-2"
              >
                <Compass className="h-4 w-4" />
                <span>Tester le simulateur d'arpentage</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth?mode=register")}
                className="rounded-full font-bold px-6 gap-2"
              >
                <span>Créer mon compte pour enregistrer mes parcelles</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Détails Fonctionnels */}
        <section className="py-16 container max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">
                Finies les incertitudes sur les superficies réelles
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Une erreur d'estimation de 15% sur la surface d'un champ entraîne un mauvais dosage des engrais,
                un surcoût d'intrants ou un déficit d'irrigation. L'outil d'arpentage NAFA-AGRITECH garantit un calcul géométrique certifié.
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/80">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Relevé GPS en marchant ou point par point</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Faites le tour de votre parcelle avec votre smartphone en activant le mode automatique, ou marquez précisément chaque borne physique.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/80">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Calcul immédiat en hectares, m² et périmètre</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Visualisation en temps réel de la surface calculée par algorithme géodésique ellipsoïdal, idéale pour dimensionner les grillages de clôture.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/80">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Export standardisé KML &amp; GeoJSON</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Compatible avec les systèmes d'information géographiques des ministères et agences de développement rural.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden border border-border shadow-xl bg-card">
                <img
                  src={galleryAerialParcels}
                  alt="Vue aérienne parcelles agricoles découpées GPS"
                  className="w-full h-80 object-cover object-center"
                />
                <div className="p-5 bg-card border-t text-xs text-muted-foreground">
                  <strong>Cartographie multimodale :</strong> superposition sur imagerie satellite OpenStreetMap &amp; dalles hors-ligne téléchargeables pour les interventions en brousse.
                </div>
              </div>
            </div>
          </div>

          {/* Bannière de passage à l'action */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                Vous avez besoin d'un géomètre ou topographe certifié ?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Nos partenaires prestataires de services techniques peuvent intervenir directement sur votre exploitation pour des levés au drone ou station DGPS.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button asChild className="rounded-2xl bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs sm:text-sm">
                <Link to="/services">Voir les prestataires de cartographie</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
