import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { SEO_PAGES, generateWebsiteSchema, generateArticleSchema } from "@/lib/seoConfig";
import PublicNavbar from "@/components/public/PublicNavbar";
import Footer from "@/components/Footer";
import {
  BookOpen,
  MapPin,
  Cpu,
  Droplets,
  Layers,
  Wrench,
  Beef,
  ArrowRight,
  Clock,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export const EDITORIAL_ARTICLES = [
  {
    id: "mesurer-parcelle-gps",
    title: "Comment mesurer une parcelle agricole avec précision par GPS ?",
    category: "Topographie & Cartographie",
    icon: MapPin,
    readTime: "4 min",
    solutionLink: "/solutions/cartographie-agricole",
    summary: "Méthode pas-à-pas pour calculer la surface exacte d'un champ en hectares et en centiares grâce au GPS d'un smartphone Android ou d'une antenne externe, sans équipement onéreux.",
    content: `
### 1. Pourquoi la précision de surface est-elle capitale ?
Dans l'agriculture sahélienne, la majorité des producteurs sous-estiment ou surestiment la superficie réelle de leurs parcelles de 15 à 30%. Les conséquences directes sont lourdes :
- **Sous-dosage ou surdosage d'intrants :** Un mauvais calcul du nombre de sacs d'engrais NPK ou de semences certifiées par hectare.
- **Dossiers de crédit rejetés :** Les institutions financières et microfinances exigent un plan parcellaire borné avec coordonnées GPS vérifiables.
- **Conflits fonciers :** Risque de litiges entre voisins sur les limites des champs en période d'hivernage.

### 2. Le protocole d'arpentage sur le terrain
Pour obtenir un relevé de haute fidélité avec l'outil de cartographie NAFA-AGRITECH :
1. **Attendre la stabilisation du signal GPS :** Ouvrez l'outil en plein air et vérifiez que la précision affichée est inférieure à 3 mètres (vert).
2. **Faire le tour de la parcelle à pied :** Longez rigoureusement les limites physiques (haies vives, bornes en béton, sentiers, cordons pierreux).
3. **Marquer chaque angle :** Aux sommets du polygone, marquez un point fixe pour garantir la rectitude des segments.
4. **Fermer la boucle :** Revenez au point de départ exact pour déclencher le calcul géodésique WGS84 de l'aire et du périmètre.

### 3. Exploitation du fichier de sortie
Le dossier technique généré fournit immédiatement la surface en hectares et mètres carrés, ainsi qu'un export KML / GeoJSON prêt à être joint aux demandes de financement ou transmis à un cabinet de topographie.
    `,
  },
  {
    id: "identifier-maladie-culture",
    title: "Comment identifier une maladie sur une culture et éviter les confusions ?",
    category: "Protection des Cultures",
    icon: Cpu,
    readTime: "5 min",
    solutionLink: "/solutions/diagnostic-agricole",
    summary: "Guide pratique pour distinguer une carence nutritive d'une attaque fongique ou d'une invasion parasitaire (mildiou, oïdium, rouille, Striga) avec des solutions homologuées.",
    content: `
### 1. La règle d'or : observer la répartition des symptômes
Avant d'appliquer le moindre traitement phytosanitaire, il est indispensable de poser un diagnostic différentiel rigoureux :
- **Une carence minérale** (azote, potassium, magnésium) s'étend généralement de façon progressive et symétrique sur l'ensemble de la planche ou du champ, débutant souvent par les feuilles les plus âgées à la base.
- **Une attaque fongique ou bactérienne** se manifeste par des foyers isolés avec des taches de formes irrégulières, souvent entourées d'un halo chlorotique.
- **Une attaque de ravageurs** présente des morsures, des galeries, des déjections ou des enroulements foliaires nets.

### 2. Ne jamais confondre culture et adventice parasitaire
Dans les zones de culture de céréales (maïs, sorgho, mil), la présence de pieds rabougris avec un jaunissement nervaire est très fréquemment causée par le *Striga hermonthica*, une mauvaise herbe parasite dont les suçoirs s'attachent directement aux racines de la culture. Traiter les feuilles contre une maladie fongique dans ce cas est totalement inefficace.

### 3. Traiter au bon moment avec la bonne matière active
Privilégiez toujours la lutte intégrée : assainissement des parcelles, arrachage précoce avant grenaison pour le Striga, et application de bouillie bordelaise ou d'extraits de neem dès les premiers symptômes.
    `,
  },
  {
    id: "choisir-systeme-irrigation",
    title: "Comment choisir et dimensionner son système d'irrigation au Sahel ?",
    category: "Hydraulique & Énergie",
    icon: Droplets,
    readTime: "6 min",
    solutionLink: "/solutions/irrigation",
    summary: "Comparatif entre goutte-à-goutte et aspersion selon la disponibilité en eau du forage, l'ensoleillement et la rentabilité pour les cultures maraîchères (tomate, oignon, piment).",
    content: `
### 1. Goutte-à-goutte vs Aspersion : quel choix pour votre exploitation ?
En zone sahélienne où l'évaporation est intense (plus de 6 mm/jour en saison sèche chaude) :
- **Le goutte-à-goutte** est la solution reine pour le maraîchage (tomate, oignon, pastèque, piment). Il permet d'économiser de 40% à 60% d'eau par rapport à l'arrosage par submersion, en apportant l'eau directement au collet sans mouiller le feuillage (ce qui réduit drastiquement les maladies fongiques).
- **La micro-aspersion** convient mieux aux pépinières, au fourrage et aux cultures denses nécessitant une humidification d'ambiance.

### 2. Le dimensionnement du pompage solaire photovoltaïque
Pour dimensionner une installation solaire durable :
1. **Mesurer le débit d'exploitation du forage (m³/h) :** Ne jamais dimensionner une pompe au-delà du débit critique du forage pour éviter son ensablement.
2. **Calculer la Hauteur Manométrique Totale (HMT) :** Elle correspond à la profondeur de la pompe + dénivelé jusqu'au bassin + pertes de charge dans les tuyaux + pression de service résiduelle (1 à 2 bars).
3. **Prévoir un surdimensionnement de 20% des panneaux :** En raison de la poussière d'harmattan et des températures élevées qui réduisent le rendement des cellules solaires au Sahel.
    `,
  },
  {
    id: "trouver-prestataire-agricole",
    title: "Comment trouver et contractualiser avec un prestataire agricole qualifié ?",
    category: "Services Techniques",
    icon: Wrench,
    readTime: "4 min",
    solutionLink: "/services",
    summary: "Critères essentiels pour choisir un prestataire de labour mécanisé, de forage ou de pulvérisation, et sécuriser ses prestations de campagne sans mauvaises surprises.",
    content: `
### 1. L'importance du calendrier dans les travaux mécanisés
En début d'hivernage, la demande en tracteurs et motoculteurs explose. Un retard de 10 jours dans le labour ou le semis peut faire perdre jusqu'à 30% du rendement final en raison du raccourcissement du cycle des pluies. Réserver son prestataire plusieurs semaines à l'avance est une condition sine qua non de réussite.

### 2. Les points de vigilance techniques
- **Pour le labour :** Exigez une profondeur de travail minimale de 20 à 25 cm pour briser la semelle de labour sans remonter les horizons stériles.
- **Pour le forage :** Vérifiez que le foreur réalise un essai de pompage d'au moins 4 heures pour certifier le débit pérenne, et qu'il pose des crépines et un massif filtrant de gravier calibré.
- **Pour les soins vétérinaires :** Exigez que les vaccins soient transportés sous chaîne de froid stricte (glacière avec accumulateurs de froid).
    `,
  },
];

export default function RessourcesPage() {
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const seo = SEO_PAGES.ressources;

  const currentArticle = EDITORIAL_ARTICLES.find((a) => a.id === selectedArticle);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={seo.title}
        description={seo.description}
        canonicalPath={seo.canonicalPath}
        keywords={seo.keywords}
        schemaJsonLd={[
          generateWebsiteSchema(),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Guides et Bonnes Pratiques Agricoles NAFA-AGRITECH",
            "description": seo.description,
            "url": "https://nafaagritech.app/ressources"
          }
        ]}
        breadcrumbs={[
          { name: "Accueil", url: "/" },
          { name: "Ressources & Guides", url: "/ressources" },
        ]}
      />

      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-muted/50 via-background to-background border-b border-border/60">
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-5">
            <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Connaissances Pratiques &amp; Guides Techniques
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground leading-tight">
              Guides &amp; Bonnes Pratiques Agricoles Sahéliennes
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Des dossiers rédigés par des agronomes et techniciens de terrain pour vous aider à maîtriser
              la cartographie GPS, l'irrigation, la protection phytosanitaire et la gestion d'exploitation.
            </p>
          </div>
        </section>

        {/* Section Principale */}
        <section className="py-12 container max-w-5xl mx-auto px-4 sm:px-6">
          {currentArticle ? (
            /* Vue Détail de l'Article */
            <div className="space-y-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedArticle(null)}
                className="rounded-full text-xs font-bold text-muted-foreground hover:text-foreground mb-4"
              >
                &larr; Retour à tous les guides
              </Button>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-bold text-emerald-600">
                    {currentArticle.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Lecture {currentArticle.readTime}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-foreground leading-tight">
                  {currentArticle.title}
                </h2>
              </div>

              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm prose dark:prose-invert max-w-none text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {currentArticle.content}
              </div>

              <div className="p-6 rounded-3xl bg-muted/40 border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Envie de passer à la pratique ?</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Découvrez la solution NAFA-AGRITECH correspondante pour appliquer ces recommandations.
                  </p>
                </div>
                <Button asChild className="rounded-full bg-emerald-600 text-white font-bold text-xs shrink-0">
                  <Link to={currentArticle.solutionLink}>
                    <span>Découvrir l'outil</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            /* Liste des Articles */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {EDITORIAL_ARTICLES.map((art) => {
                const Icon = art.icon;
                return (
                  <Card
                    key={art.id}
                    className="rounded-3xl border border-border/80 hover:border-emerald-500/40 shadow-sm hover:shadow-lg transition-all duration-300 bg-card flex flex-col justify-between overflow-hidden"
                  >
                    <CardContent className="p-6 sm:p-7 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {art.category}
                          </Badge>
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="h-3 w-3" />
                            {art.readTime}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">
                          {art.title}
                        </h2>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {art.summary}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedArticle(art.id)}
                          className="rounded-xl text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 p-0"
                        >
                          <span>Lire le guide complet</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
