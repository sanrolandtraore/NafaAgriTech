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
  Cpu,
  MapPin,
  Sprout,
  Droplets,
  Layers,
  Beef,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Store,
  Compass,
  FileCheck,
  Wrench,
  Building2,
} from "lucide-react";

import galleryPlantDiagnostic from "@/assets/gallery/plant-diagnostic.jpg";
import galleryGpsSurveyor from "@/assets/gallery/gps-surveyor.jpg";
import galleryAerialParcels from "@/assets/gallery/aerial-parcels.jpg";
import galleryIrrigation from "@/assets/gallery/irrigation.jpg";
import galleryFarmField from "@/assets/gallery/farm-field.jpg";
import galleryLivestock from "@/assets/gallery/livestock.jpg";
import galleryDigital from "@/assets/gallery/digital-farming.jpg";

export const SOLUTIONS_LIST = [
  {
    id: "diagnostic-agricole",
    title: "Diagnostic Végétal & Moteur Botanique Autonome",
    slug: "/solutions/diagnostic-agricole",
    icon: Cpu,
    category: "Phytosanitaire & Botanique",
    headline: "Identifier instantanément les maladies, ravageurs et adventices sans dépendre d'une connexion internet.",
    description: "Algorithme d'analyse d'images foliaires calibré sur 54 306 clichés étalons et adossé aux bases scientifiques ouvertes de l'INERA et de la FAO. Prescription biologique et conventionnelle homologuée Sahel.",
    image: galleryPlantDiagnostic,
    features: [
      "Distinction stricte Culture vs Adventice parasitaire (Striga, etc.)",
      "Détection visuelle des altérations : nécroses, chloroses, rouilles",
      "Prescriptions validées CILSS / CSP avec doses par hectare",
      "Mode 100% hors-ligne pour les zones de grande culture",
    ],
  },
  {
    id: "cartographie-agricole",
    title: "Cartographie Géodésique & Délimitation GPS",
    slug: "/solutions/cartographie-agricole",
    icon: MapPin,
    category: "Topographie & Foncier",
    headline: "Mesurer la superficie exacte, le périmètre et découper les parcelles avec précision géodésique.",
    description: "Relevé des bornes GPS sur le terrain à pied ou en engin, correction géodésique WGS84, affichage satellite haute résolution et export aux formats officiels KML / GeoJSON pour les dossiers de crédit et projets.",
    image: galleryGpsSurveyor,
    features: [
      "Calcul automatique de la surface en hectares et centiares",
      "Découpage en sous-parcelles et plan de rotation",
      "Export de plans parcellaires certifiés pour bailleurs et banques",
      "Compatible smartphones Android et capteurs GPS externes",
    ],
  },
  {
    id: "conseils-agronomiques",
    title: "Conseils Agronomiques & Itinéraires Techniques",
    slug: "/solutions/conseils-agronomiques",
    icon: Sprout,
    category: "Agronomie Sahélienne",
    headline: "Optimiser les rendements grâce aux référentiels variétaux et aux calendriers culturaux officiels.",
    description: "Fiches techniques variétales détaillées pour le maïs, le sorgho, le riz, le niébé, l'arachide, l'oignon et le coton. Recommandations de fertilisation NPK fractionnée et densité de semis optimale.",
    image: galleryFarmField,
    features: [
      "Variétés améliorées certifiées INERA / NACOSEM",
      "Calcul des doses d'engrais NPK et Urée selon le type de sol",
      "Calendrier phénologique adapté aux saisons sahéliennes",
      "Protocoles de lutte intégrée et protection agroécologique",
    ],
  },
  {
    id: "irrigation",
    title: "Conception Hydraulique & Pompage Solaire FAO-56",
    slug: "/solutions/irrigation",
    icon: Droplets,
    category: "Génie Rural & Eau",
    headline: "Dimensionner les réseaux d'irrigation goutte-à-goutte et par aspersion en optimisant la ressource hydrique.",
    description: "Moteur de calcul hydraulique intégrant l'évapotranspiration de référence (ETo), le débit des forages, les pertes de charge linéaires et singulières, et la puissance photovoltaïque requise.",
    image: galleryIrrigation,
    features: [
      "Calcul des besoins hydriques journaliers de pointe (mm/jour)",
      "Dimensionnement des diamètres PEHD / PVC et goutteurs",
      "Calcul de la Hauteur Manométrique Totale (HMT) et débit m³/h",
      "Génération du dossier technique avec devis instantané",
    ],
  },
  {
    id: "suivi-exploitation",
    title: "Suivi d'Exploitation & Cahier de Culture Numérique",
    slug: "/solutions/suivi-exploitation",
    icon: Layers,
    category: "Gestion de Ferme",
    headline: "Centraliser les activités, les intrants, la main-d'œuvre et la rentabilité financière de vos campagnes.",
    description: "Outil complet de traçabilité agricole : planification des labours, semis, sarclages, traitements, récoltes, suivi des dépenses et calcul de la marge nette à l'hectare.",
    image: galleryAerialParcels,
    features: [
      "Journal d'interventions journalières horodaté",
      "Gestion des stocks d'engrais, semences et produits",
      "Bilan financier automatisé (charges vs recettes de vente)",
      "Accessible sur mobile avec synchronisation automatique",
    ],
  },
  {
    id: "elevage",
    title: "Gestion d'Élevage & Suivi Zootechnique",
    slug: "/solutions/elevage",
    icon: Beef,
    category: "Production Animale",
    headline: "Suivre la santé du cheptel, les cycles de reproduction et formuler des rations équilibrées.",
    description: "Module dédié aux éleveurs pastoraux et modernes : fiches individuelles ou par lot (bovins, ovins, caprins, porcins, volailles), alertes vaccinales et optimisation alimentaire à base de sous-produits locaux.",
    image: galleryLivestock,
    features: [
      "Calendrier de vaccination et déparasitage périodique",
      "Formulation de rations équilibrées (son, tourteau, fanes)",
      "Suivi de la reproduction, gestation et mises bas",
      "Bilan technico-économique de l'atelier d'embouche ou ponte",
    ],
  },
  {
    id: "ia-copilote",
    title: "NAFA Genius — Copilote d'Ingénierie de Terrain",
    slug: "/solutions/ia-copilote",
    icon: Sparkles,
    category: "Intelligence Embarquée",
    headline: "L'ingénieur agronome virtuel dans la poche, capable de dimensionner et chiffrer vos projets en quelques secondes.",
    description: "Assistant d'aide à la décision unifié qui relie géodésie, hydraulique et devis en FCFA aux prix du marché local. Conçu pour fonctionner sans interruption en zone blanche.",
    image: galleryDigital,
    features: [
      "Chiffrage instantané des devis de travaux d'aménagement",
      "Corrélation intelligente sol - climat - variété - eau",
      "Génération de rapports PDF techniques professionnels",
      "Respect strict des normes agronomiques du Burkina Faso",
    ],
  },
];

export default function SolutionsPage() {
  const navigate = useNavigate();
  const seo = SEO_PAGES.solutionsHub;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={seo.title}
        description={seo.description}
        canonicalPath={seo.canonicalPath}
        keywords={seo.keywords}
        schemaJsonLd={[generateWebsiteSchema(), generateSoftwareApplicationSchema()]}
        breadcrumbs={[
          { name: "Accueil", url: "/" },
          { name: "Solutions", url: "/solutions" },
        ]}
      />

      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-muted/50 via-background to-background border-b border-border/60">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Suite Technologique Agricole Complète
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground leading-tight">
              Des solutions numériques concrètes pour{" "}
              <span className="text-[#F97316]">l'agriculture et l'élevage africains</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              NAFA-AGRITECH développe des outils numériques d'aide à la décision qui répondent aux réalités
              du terrain sahélien : connexion limitée, contraintes hydriques, sols spécifiques et circuits économiques locaux.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/explorer")}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md gap-2"
              >
                <Compass className="h-4 w-4" />
                <span>Tester les simulateurs libres</span>
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

        {/* Grille des 7 Solutions Majeures */}
        <section className="py-16 sm:py-20 container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SOLUTIONS_LIST.map((sol) => {
              const Icon = sol.icon;
              return (
                <Card
                  key={sol.id}
                  className="rounded-3xl border border-border/80 hover:border-emerald-500/40 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group bg-card"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <img
                      src={sol.image}
                      alt={sol.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/95 text-slate-900 font-bold text-[10px] uppercase shadow-sm">
                        {sol.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h2 className="text-base font-extrabold leading-tight text-white drop-shadow-sm line-clamp-1">
                          {sol.title}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {sol.headline}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-border/60">
                      {sol.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3">
                      <Button
                        variant="outline"
                        asChild
                        className="w-full rounded-2xl group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors font-bold text-xs justify-between"
                      >
                        <Link to={sol.slug}>
                          <span>Découvrir la solution</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Section Partenaires & Marketplace */}
        <section className="py-14 bg-muted/30 border-t border-border/60">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">
              Besoin de travaux d'aménagement ou d'intrants certifiés ?
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              NAFA-AGRITECH ne réalise pas elle-même les travaux physiques de terrain : elle vous met en relation
              avec un réseau certifié d'entreprises partenaires, prestataires de labour, foreurs, pépiniéristes et vétérinaires.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Button asChild className="rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white font-bold px-6">
                <Link to="/services">
                  <Wrench className="h-4 w-4 mr-2" />
                  <span>Voir les services techniques partenaires</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="rounded-full font-bold px-6">
                <Link to="/partenaires">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>Consulter l'annuaire des partenaires</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
