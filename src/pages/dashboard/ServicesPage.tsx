import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  agronomicToolkitStorage,
  AgronomicToolItem,
  ToolkitCategory,
  TOOLKIT_CATEGORIES,
} from "@/lib/agronomicToolkitStorage";
import { AgronomicToolCard } from "@/components/agronomic/AgronomicToolCard";
import { NafaGeniusHeroCard } from "@/components/agronomic/NafaGeniusHeroCard";
import { ContextualAiModal } from "@/components/agronomic/ContextualAiModal";
import BackNavigationButton from "@/components/BackNavigationButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Star,
  Clock,
  Sparkles,
  Layers,
  Globe,
  Sprout,
  Droplets,
  PencilRuler,
  BarChart3,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

// Category icon map
const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  Layers,
  Globe,
  Sprout,
  Droplets,
  PencilRuler,
  BarChart3,
};

// Search Suggestion Chips
const SEARCH_SUGGESTIONS = [
  "Mesurer une parcelle",
  "Concevoir une irrigation",
  "Diagnostiquer une maladie",
  "Faire un devis",
  "Calculer un débit",
  "Plan de fertilisation",
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Category states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<ToolkitCategory>(
    (searchParams.get("cat") as ToolkitCategory) || "all"
  );

  // Favorites & Recents states
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    agronomicToolkitStorage.getFavoriteToolIds()
  );
  const [recentTools, setRecentTools] = useState<AgronomicToolItem[]>(() =>
    agronomicToolkitStorage.getRecentTools()
  );

  // Contextual AI Modal
  const [activeAiTool, setActiveAiTool] = useState<AgronomicToolItem | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Load favorites & recents on mount
  useEffect(() => {
    setFavoriteIds(agronomicToolkitStorage.getFavoriteToolIds());
    setRecentTools(agronomicToolkitStorage.getRecentTools());
  }, []);

  // Update URL params
  const handleCategoryChange = (cat: ToolkitCategory) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === "all") {
      newParams.delete("cat");
    } else {
      newParams.set("cat", cat);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const newParams = new URLSearchParams(searchParams);
    if (!query) {
      newParams.delete("q");
    } else {
      newParams.set("q", query);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Toggle favorite
  const handleToggleFavorite = (toolId: string) => {
    agronomicToolkitStorage.toggleFavoriteTool(toolId);
    setFavoriteIds(agronomicToolkitStorage.getFavoriteToolIds());
  };

  // Open Contextual AI modal
  const handleOpenContextualAi = (tool: AgronomicToolItem) => {
    setActiveAiTool(tool);
    setAiModalOpen(true);
  };

  // Filtered tools
  const filteredTools = useMemo(() => {
    return agronomicToolkitStorage.searchTools(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  // Favorite tools objects
  const favoriteTools = useMemo(() => {
    return favoriteIds
      .map((id) => agronomicToolkitStorage.getToolById(id))
      .filter((tool): tool is AgronomicToolItem => Boolean(tool));
  }, [favoriteIds]);

  const allToolsCount = agronomicToolkitStorage.getAllTools().length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6 animate-fade-in pb-24">
      {/* ══════════════════════════════════════════════════════
          1. EN-TÊTE PRINCIPAL & BRANDING SUITE PROFESSIONNELLE
      ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="flex items-start sm:items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-1 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Suite Professionnelle d'Ingénierie & Conseil Agronomique</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground flex items-center gap-2.5">
              <Compass className="h-7 w-7 text-[#F97316]" />
              <span>Services Agronomiques & Conseils</span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl font-medium">
              Toolkit opérationnel 1-Touch pour agronomes de terrain, consultants ruraux et bureaux d'études agricoles sahéliens.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-bold text-muted-foreground self-start md:self-auto">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>{allToolsCount} outils opérationnels 100% hors-ligne</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          2. RECHERCHE INTELLIGENTE « QUE VOULEZ-VOUS FAIRE ? »
      ══════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-card border border-border/80 shadow-xs space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="toolkit-smart-search"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground block"
          >
            Recherche intelligente
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="toolkit-smart-search"
              placeholder="Que voulez-vous faire ? (ex: Mesurer une parcelle, concevoir une irrigation, diagnostiquer...)"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-12 pl-12 pr-10 text-sm sm:text-base font-medium rounded-[20px] bg-background border-border shadow-xs focus:border-[#F97316]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                aria-label="Effacer la recherche"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-[#F97316]" /> Suggestions directes :
          </span>
          {SEARCH_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSearchChange(suggestion)}
              className="px-3 py-1 rounded-full bg-muted/80 hover:bg-[#F97316]/10 hover:text-[#F97316] text-muted-foreground font-semibold transition-all border border-border/60 hover:border-[#F97316]/40"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          3. CARTE HÉRO SPÉCIALE : 🤖 NAFA GENIUS IA
      ══════════════════════════════════════════════════════ */}
      {!searchQuery && selectedCategory === "all" && (
        <NafaGeniusHeroCard onOpenContextualModal={() => navigate("/dashboard/genius")} />
      )}

      {/* ══════════════════════════════════════════════════════
          4. SECTION « MES OUTILS FAVORIS ⭐ »
      ══════════════════════════════════════════════════════ */}
      {!searchQuery && selectedCategory === "all" && favoriteTools.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-heading font-black text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span>Mes outils favoris</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold">
                {favoriteTools.length}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {favoriteTools.map((tool) => (
              <AgronomicToolCard
                key={`fav-${tool.id}`}
                tool={tool}
                isFavorite={true}
                onToggleFavorite={handleToggleFavorite}
                onOpenContextualAi={handleOpenContextualAi}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          5. SECTION « RÉCEMMENT UTILISÉS »
      ══════════════════════════════════════════════════════ */}
      {!searchQuery && selectedCategory === "all" && recentTools.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-heading font-black text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Récemment utilisés</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {recentTools.length}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {recentTools.map((tool) => (
              <AgronomicToolCard
                key={`rec-${tool.id}`}
                tool={tool}
                isFavorite={favoriteIds.includes(tool.id)}
                onToggleFavorite={handleToggleFavorite}
                onOpenContextualAi={handleOpenContextualAi}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          6. SÉLECTEUR DE CATÉGORIES VISUELLES (PILLS)
      ══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-heading font-black text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#F97316]" />
            <span>Suite d'outils par domaine</span>
            <span className="text-xs text-muted-foreground font-semibold">
              ({filteredTools.length} outil{filteredTools.length > 1 ? "s" : ""})
            </span>
          </h2>
        </div>

        {/* Category Pills Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TOOLKIT_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const CatIcon = CATEGORY_ICON_MAP[cat.iconName] || Layers;
            const count =
              cat.id === "all"
                ? allToolsCount
                : agronomicToolkitStorage.getToolsByCategory(cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2.5 rounded-[16px] text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isActive
                    ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827] border-[#111827] dark:border-white shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <CatIcon className="h-4 w-4 shrink-0 text-[#F97316]" />
                <span>{cat.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          7. GRILLE RESPONSIVE DES OUTILS (2 mobile, 3 tablette, 4 PC)
      ══════════════════════════════════════════════════════ */}
      {filteredTools.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-[28px] bg-card border border-border space-y-3">
          <Compass className="h-12 w-12 text-muted-foreground/60 mx-auto" />
          <h3 className="text-base font-bold text-foreground">
            Aucun outil ne correspond à « {searchQuery} »
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Essayez un mot-clé plus général (ex: GPS, eau, sol, maladie, devis) ou réinitialisez les filtres.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="rounded-[16px] text-xs font-bold"
          >
            Réinitialiser la recherche
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {filteredTools.map((tool) => (
            <AgronomicToolCard
              key={tool.id}
              tool={tool}
              isFavorite={favoriteIds.includes(tool.id)}
              onToggleFavorite={handleToggleFavorite}
              onOpenContextualAi={handleOpenContextualAi}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          8. MODAL D'AIDE CONTEXTUELLE NAFA GENIUS
      ══════════════════════════════════════════════════════ */}
      <ContextualAiModal
        tool={activeAiTool}
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
      />
    </div>
  );
}
