import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Camera,
  Activity,
  ClipboardList,
  Store,
  Users,
  FileText,
  Receipt,
  Wallet,
  Building2,
  BadgeCheck,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Droplets,
  Scale,
} from "lucide-react";
import BackNavigationButton from "@/components/BackNavigationButton";
import { LIVESTOCK_DENSITY_STANDARDS } from "@/lib/livestockVisionCounter";

export interface VetToolItem {
  id: string;
  title: string;
  category: "clinique_terrain" | "eleveurs_missions" | "facturation_cabinet";
  categoryLabel: string;
  description: string;
  route: string;
  icon: React.ElementType;
  badges: string[];
  keywords: string[];
}

export const VETERINARY_TOOLS: VetToolItem[] = [
  // ── Pôle 1 : Actes Cliniques & Terrain ──
  {
    id: "vet-smart-counting",
    title: "Station Couloir : SmaRt Counting & Pesée (Norme IMV)",
    category: "clinique_terrain",
    categoryLabel: "Actes Cliniques & Terrain",
    description: "Comptage automatique bidirectionnel en couloir d'embarquement (précision 99,9%), exclusion des silhouettes humaines, estimation biométrique Smart Weight et certificat officiel.",
    route: "/dashboard/animal-counting?method=imv_corridor",
    icon: ShieldCheck,
    badges: ["Norme IMV Technologies", "Précision 99.9%", "Smart Weight", "EIP"],
    keywords: ["imv", "smart counting", "couloir", "porc", "bovin", "ovin", "pesee", "poids", "tripwire", "eip", "abattoir", "embarquement"],
  },
  {
    id: "vet-comptage",
    title: "Comptage & Densité d'Élevage",
    category: "clinique_terrain",
    categoryLabel: "Actes Cliniques & Terrain",
    description: "Audit d'effectifs in-situ par vision optique, analyse des quadrats (norme FAO), calcul de la charge UBT et détection de surpopulation.",
    route: "/dashboard/animal-counting",
    icon: Camera,
    badges: ["Vision IA", "Norme FAO", "Densité", "Hors ligne"],
    keywords: ["comptage", "densite", "animaux", "volailles", "bovins", "quadrats", "fao", "ubt", "troupeau"],
  },
  {
    id: "vet-interventions",
    title: "Interventions & Soins Terrain",
    category: "clinique_terrain",
    categoryLabel: "Actes Cliniques & Terrain",
    description: "Rapports d'intervention zoo-sanitaire : vaccinations collectives, déparasitages, césariennes, bilans de santé et prescriptions.",
    route: "/dashboard/interventions",
    icon: Activity,
    badges: ["Terrain", "Soins", "Ordonnance", "Hors ligne"],
    keywords: ["interventions", "soins", "vaccination", "visite", "terrain", "ordonnance", "consultation"],
  },
  {
    id: "vet-proposer-services",
    title: "Proposer mes Services & Soins Vétérinaires",
    category: "clinique_terrain",
    categoryLabel: "Actes Cliniques & Terrain",
    description: "Publiez et configurez vos actes médicaux (consultations, chirurgies, prophylaxie, inséminations, forfaits) visibles exclusivement dans le catalogue des éleveurs.",
    route: "/dashboard/partenaire-mes-offres",
    icon: Store,
    badges: ["Proposer des soins", "Tarifs FCFA", "Visible Éleveurs"],
    keywords: ["proposer", "services", "tarifs", "prestations", "actes", "soins", "eleveurs", "consultation", "vaccination", "chirurgie"],
  },
  {
    id: "vet-catalogue-preview",
    title: "Aperçu du Catalogue (Vue Éleveur)",
    category: "clinique_terrain",
    categoryLabel: "Actes Cliniques & Terrain",
    description: "Prévisualisation du catalogue public réservé aux éleveurs pour vérifier l'affichage de vos actes, tarifs et disponibilités.",
    route: "/dashboard/livestock-services",
    icon: ClipboardList,
    badges: ["Vue Éleveurs", "Aperçu Public"],
    keywords: ["catalogue", "vue eleveur", "apercu", "prestations", "clinique", "docteur"],
  },

  // ── Pôle 2 : Éleveurs & Missions ──
  {
    id: "vet-clients",
    title: "Portefeuille Éleveurs & Clients",
    category: "eleveurs_missions",
    categoryLabel: "Dossiers Éleveurs & Suivi",
    description: "Fichier des fermes et exploitations suivies : historique sanitaire, taille des troupeaux, contacts directs et tournées programmées.",
    route: "/dashboard/provider-clients",
    icon: Users,
    badges: ["Éleveurs", "Fermes", "Suivi sanitaire"],
    keywords: ["clients", "eleveurs", "fermes", "troupeaux", "portefeuille", "carnet"],
  },
  {
    id: "vet-quote-requests",
    title: "Demandes de Devis & Réservations",
    category: "eleveurs_missions",
    categoryLabel: "Dossiers Éleveurs & Suivi",
    description: "Traitement des sollicitations d'éleveurs : urgences sanitaires, demandes de campagnes de vaccination et devis d'interventions.",
    route: "/dashboard/quote-requests",
    icon: FileText,
    badges: ["Demandes", "Urgences", "Missions"],
    keywords: ["demandes", "devis", "reservations", "urgences", "alertes", "eleveurs"],
  },

  // ── Pôle 3 : Facturation & Cabinet ──
  {
    id: "vet-factures",
    title: "Facturation & Proformas en FCFA",
    category: "facturation_cabinet",
    categoryLabel: "Facturation & Gestion Cabinet",
    description: "Édition instantanée de factures proformas, certificats sanitaires et reçus de soins vétérinaires conformes en FCFA.",
    route: "/dashboard/partenaire-factures",
    icon: Receipt,
    badges: ["Factures", "FCFA", "Proformas", "PDF"],
    keywords: ["facturation", "proformas", "factures", "honoraires", "recus", "fcfa"],
  },
  {
    id: "vet-revenus",
    title: "Chiffre d'Affaires & Règlements",
    category: "facturation_cabinet",
    categoryLabel: "Facturation & Gestion Cabinet",
    description: "Suivi des encaissements des consultations, honoraires de campagne et marge sur produits de santé animale.",
    route: "/dashboard/revenus",
    icon: Wallet,
    badges: ["Recettes", "Finances", "Trésorerie"],
    keywords: ["revenus", "chiffre d'affaires", "recettes", "reglements", "comptabilite"],
  },
  {
    id: "vet-partner-space",
    title: "Mon Espace Partenaire (Vitrine Publique)",
    category: "facturation_cabinet",
    categoryLabel: "Facturation & Gestion Cabinet",
    description: "Présentation de la clinique ou du cabinet vétérinaire, équipe de praticiens, horaires d'ouverture et avis certifiés.",
    route: "/dashboard/partner-space",
    icon: Building2,
    badges: ["Vitrine", "Cabinet", "Visibilité"],
    keywords: ["vitrine", "espace partenaire", "clinique", "presentation", "cabinet", "avis"],
  },
  {
    id: "vet-kyc",
    title: "Agrément & Ordre des Vétérinaires",
    category: "facturation_cabinet",
    categoryLabel: "Facturation & Gestion Cabinet",
    description: "Certification officielle, numéro d'inscription à l'Ordre National des Vétérinaires et attestation d'exercice conforme.",
    route: "/dashboard/partenaire-kyc",
    icon: BadgeCheck,
    badges: ["Ordre National", "Agrément", "Conformité"],
    keywords: ["agrement", "ordre des veterinaires", "certification", "kyc", "conformite", "docteur"],
  },
];

export default function VeterinaireHubPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredTools = useMemo(() => {
    return VETERINARY_TOOLS.filter((tool) => {
      const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        tool.title.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div
      data-testid="veterinaire-hub-page"
      className="space-y-8 max-w-7xl mx-auto px-4 py-6 animate-fade-in pb-24"
    >
      {/* ══════════════════════════════════════════════════════
          1. EN-TÊTE PRINCIPAL : CONSOLE VÉTÉRINAIRE UNIFIÉE
      ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="flex items-start sm:items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/20 text-[11px] font-extrabold uppercase px-2.5 py-0.5">
                Module Partenaire Vétérinaire
              </Badge>
              <Badge variant="outline" className="text-muted-foreground text-[11px] font-semibold">
                Bloc Tout-en-un
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground flex items-center gap-2.5">
              <Stethoscope className="h-7 w-7 text-emerald-600" />
              <span>Console Vétérinaire & Santé Animale</span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl font-medium">
              Toutes les fonctionnalités d'interventions zoo-sanitaires, comptage optique de cheptel, audit de densité FAO, gestion des dossiers éleveurs et facturation du cabinet réunies dans un bloc unifié pour simplifier votre pratique quotidienne.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start md:self-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>{VETERINARY_TOOLS.length} outils métier opérationnels</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-bold text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Normes INERA • CIRDES • FAO</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          2. BANNIÈRE HERO D'ACTION RAPIDE (LES 3 ACTIONS PHARES)
      ══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-[28px] border-2 border-emerald-600/30 bg-gradient-to-br from-emerald-600/10 via-background to-sky-600/10 p-6 sm:p-7 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600 text-white font-black text-xs px-3 py-1 shadow-xs">
                OUTILS D'AIDE À LA DÉCISION RÉELS
              </Badge>
              <Badge variant="outline" className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                Zéro Simulation • Données Scientifiques
              </Badge>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black text-foreground">
              Comptage Haute Précision, Soins de Terrain & Suivi Sanitaire
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Dénombrez les animaux sans biais par vision morphologique et quadrats FAO, vérifiez la charge UBT et la conformité de densité au m², et générez des ordonnances et rapports d'intervention horodatés pour les éleveurs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-background/80 border border-border/60 text-xs">
                <Camera className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-foreground">1. Comptage & Densité</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-background/80 border border-border/60 text-xs">
                <Activity className="h-4 w-4 text-sky-600 shrink-0" />
                <span className="font-semibold text-foreground">2. Interventions terrain</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-background/80 border border-border/60 text-xs">
                <Receipt className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-semibold text-foreground">3. Facturation FCFA</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-2.5">
            <Button
              type="button"
              onClick={() => navigate("/dashboard/animal-counting")}
              className="h-12 px-6 text-sm font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-600/25 transition-all flex items-center gap-2"
            >
              <span>Lancer le Comptage d'Animaux</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/interventions")}
                className="flex-1 h-9 text-xs font-bold rounded-xl border-border hover:bg-muted"
              >
                <Activity className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Interventions
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/partenaire-factures")}
                className="flex-1 h-9 text-xs font-bold rounded-xl border-border hover:bg-muted"
              >
                <Receipt className="h-3.5 w-3.5 mr-1 text-primary" />
                Facturation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          3. RECHERCHE INTELLIGENTE « QUE VOULEZ-VOUS FAIRE ? »
      ══════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-card border border-border/80 shadow-xs space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="vet-smart-search"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground block"
          >
            Recherche dans le module vétérinaire
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="vet-smart-search"
              placeholder="Que voulez-vous faire ? (ex: compter des volailles, intervention, devis éleveur, facturer...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 pr-10 text-sm sm:text-base font-medium rounded-[20px] bg-background border-border shadow-xs focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Suggestions directes :
          </span>
          {[
            "Comptage et densité",
            "Nouvelle intervention",
            "Dossiers éleveurs",
            "Créer une facture proforma",
            "Catalogue de soins",
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setSearchQuery(chip)}
              className="px-3 py-1 rounded-full bg-muted/80 hover:bg-emerald-600/10 hover:text-emerald-600 text-muted-foreground font-semibold transition-all border border-border/60 hover:border-emerald-600/40"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          4. SÉLECTEUR DE PÔLES THÉMATIQUES (PILLS)
      ══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-heading font-black text-foreground flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-emerald-600" />
            <span>Catalogue Unifié — Pratique Clinique & Prestations Vétérinaires</span>
            <span className="text-xs text-muted-foreground font-semibold">
              ({filteredTools.length} outil{filteredTools.length > 1 ? "s" : ""})
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "all", label: "Toutes les fonctionnalités", count: VETERINARY_TOOLS.length },
            {
              id: "clinique_terrain",
              label: "Actes Cliniques & Terrain",
              count: VETERINARY_TOOLS.filter((t) => t.category === "clinique_terrain").length,
            },
            {
              id: "eleveurs_missions",
              label: "Dossiers Éleveurs & Missions",
              count: VETERINARY_TOOLS.filter((t) => t.category === "eleveurs_missions").length,
            },
            {
              id: "facturation_cabinet",
              label: "Facturation & Gestion Cabinet",
              count: VETERINARY_TOOLS.filter((t) => t.category === "facturation_cabinet").length,
            },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-[16px] text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isActive
                    ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827] border-[#111827] dark:border-white shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          5. GRILLE DES OUTILS VÉTÉRINAIRES
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Card
              key={tool.id}
              onClick={() => navigate(tool.route)}
              className="cursor-pointer group hover:border-emerald-600/50 hover:shadow-md transition-all rounded-[22px] border border-border/80 bg-card overflow-hidden flex flex-col justify-between"
            >
              <CardHeader className="p-5 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {tool.categoryLabel}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {tool.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {tool.badges.map((badge) => (
                    <Badge
                      key={badge}
                      variant="outline"
                      className="text-[10px] font-semibold border-border/60 text-muted-foreground"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Accéder à l'outil</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
