import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, Search, Loader2, Sparkles, Filter, CheckSquare, 
  Square, Copy, Calculator, X, ChevronDown, ChevronUp, 
  Sprout, Wheat, Cookie, Droplets, MapPin, Calendar, ArrowRight, Share2, Layers
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BURKINA_ALL_CROPS_TECHNICAL_SHEETS, CropTechnicalSheetData } from "@/lib/cropLibraryData";

// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;

const ITEMS_PER_PAGE = 24;

export default function CropLibraryPage() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<CropTechnicalSheetData[]>(BURKINA_ALL_CROPS_TECHNICAL_SHEETS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [cycleFilter, setCycleFilter] = useState<string>("all");
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Tentative de récupération distante pour mise à jour éventuelle,
    // en préservant systématiquement les 235 cultures locales complètes.
    Promise.resolve(db.from("crop_technical_sheets").select("*").order("name_fr")).then(({ data }) => {
      if (data && data.length >= BURKINA_ALL_CROPS_TECHNICAL_SHEETS.length) {
        setSheets(data as CropTechnicalSheetData[]);
      } else {
        setSheets(BURKINA_ALL_CROPS_TECHNICAL_SHEETS);
      }
    }).catch(() => {
      setSheets(BURKINA_ALL_CROPS_TECHNICAL_SHEETS);
    });
  }, []);

  // Décompte par catégories pour l'ergonomie
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    sheets.forEach(s => {
      map.set(s.category, (map.get(s.category) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sheets]);

  const burkinaCount = useMemo(() => {
    return sheets.filter(s => s.is_burkina_priority).length;
  }, [sheets]);

  // Filtrage multi-critères complet
  const filtered = useMemo(() => {
    return sheets.filter(s => {
      // 1. Recherche texte (nom, nom scientifique, ravageurs, maladies, variétés, régions, notes)
      const q = search.trim().toLowerCase();
      let matchSearch = true;
      if (q) {
        matchSearch = 
          s.name_fr.toLowerCase().includes(q) ||
          s.crop_key.toLowerCase().includes(q) ||
          (s.scientific_name?.toLowerCase().includes(q) ?? false) ||
          (s.notes?.toLowerCase().includes(q) ?? false) ||
          s.recommended_varieties.some(v => v.toLowerCase().includes(q)) ||
          s.common_pests.some(p => p.toLowerCase().includes(q)) ||
          s.common_diseases.some(d => d.toLowerCase().includes(q)) ||
          (s.regions_burkina?.some(r => r.toLowerCase().includes(q)) ?? false);
      }

      // 2. Filtre Catégorie
      const matchCategory = categoryFilter === "all" || s.category === categoryFilter;

      // 3. Filtre Origine / Priorité
      let matchOrigin = true;
      if (originFilter === "burkina") {
        matchOrigin = !!s.is_burkina_priority;
      } else if (originFilter === "sahel") {
        matchOrigin = s.climate_zones.some(z => z.toLowerCase().includes("sahel"));
      } else if (originFilter === "cedeao") {
        matchOrigin = !s.is_burkina_priority;
      }

      // 4. Filtre Zone agro-climatique
      let matchZone = true;
      if (zoneFilter !== "all") {
        matchZone = s.climate_zones.some(z => z.toLowerCase().includes(zoneFilter.toLowerCase()));
      }

      // 5. Filtre Durée de Cycle
      let matchCycle = true;
      const minCycle = s.cycle_days_min || 0;
      const maxCycle = s.cycle_days_max || 999;
      if (cycleFilter === "court") {
        matchCycle = maxCycle <= 75;
      } else if (cycleFilter === "moyen") {
        matchCycle = minCycle >= 70 && maxCycle <= 115;
      } else if (cycleFilter === "long") {
        matchCycle = minCycle >= 100 && maxCycle <= 180;
      } else if (cycleFilter === "perenne") {
        matchCycle = maxCycle > 180;
      }

      return matchSearch && matchCategory && matchOrigin && matchZone && matchCycle;
    });
  }, [sheets, search, categoryFilter, originFilter, zoneFilter, cycleFilter]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, originFilter, zoneFilter, cycleFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filtered.map(f => f.id);
    setSelectedIds(new Set(allFilteredIds));
    toast.success(`${allFilteredIds.length} cultures sélectionnées`);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    toast.info("Sélection réinitialisée");
  };

  const copySheetData = (sheet: CropTechnicalSheetData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = `FICHE TECHNIQUE AGRONOMIQUE
Nom : ${sheet.name_fr}
Nom scientifique : ${sheet.scientific_name || "N/A"}
Catégorie : ${sheet.category}
Priorité Burkina : ${sheet.is_burkina_priority ? "Oui (INERA / Sahel)" : "Afrique de l'Ouest / CEDEAO"}
Régions BF : ${sheet.regions_burkina?.join(", ") || "Toutes régions"}
Cycle végétatif : ${sheet.cycle_days_min} à ${sheet.cycle_days_max} jours
Zones agro-climatiques : ${sheet.climate_zones.join(", ")}
Saisons : ${sheet.seasons.join(", ")}
Formule NPK : N ${sheet.npk_needs.N} - P ${sheet.npk_needs.P} - K ${sheet.npk_needs.K} kg/ha
Besoin en eau ETc : ${sheet.water_needs_mm} mm
Potentiel de rendement : ${sheet.yield_potential_t_ha} t/ha
Variétés recommandées : ${sheet.recommended_varieties.join(", ")}
Ravageurs majeurs : ${sheet.common_pests.join(", ")}
Maladies courantes : ${sheet.common_diseases.join(", ")}
Notes agronomiques : ${sheet.notes}`;

    navigator.clipboard.writeText(text);
    toast.success(`Fiche ${sheet.name_fr} copiée dans le presse-papier !`);
  };

  const copySelectedSummary = () => {
    const selectedList = sheets.filter(s => selectedIds.has(s.id));
    if (selectedList.length === 0) return;

    const summary = selectedList.map(s => 
      `• ${s.name_fr} [${s.category}] - Cycle: ${s.cycle_days_min}-${s.cycle_days_max}j - Eau: ${s.water_needs_mm}mm - Rendement: ${s.yield_potential_t_ha} t/ha - NPK: ${s.npk_needs.N}-${s.npk_needs.P}-${s.npk_needs.K}`
    ).join("\n");

    navigator.clipboard.writeText(`RÉSUMÉ AGRONOMIQUE (${selectedList.length} CULTURES SÉLECTIONNÉES) :\n\n${summary}`);
    toast.success(`Résumé de ${selectedList.length} culture(s) copié !`);
  };

  const resetAllFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setOriginFilter("all");
    setZoneFilter("all");
    setCycleFilter("all");
  };

  const isFiltersActive = search || categoryFilter !== "all" || originFilter !== "all" || zoneFilter !== "all" || cycleFilter !== "all";

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4 py-4">
      {/* En-tête principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
                Fiches Techniques Agronomiques
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Base complète de <strong className="text-foreground">{sheets.length} cultures</strong> adaptées au Sahel et à l'Afrique de l'Ouest (priorité Burkina Faso INERA & FAO-56).
              </p>
            </div>
          </div>
        </div>

        {/* Badges compteurs rapides */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge variant="outline" className="px-2.5 sm:px-3 py-1 text-xs font-semibold border-primary/30 bg-primary/5 text-primary">
            🌾 {sheets.length} Cultures
          </Badge>
          <Badge variant="secondary" className="px-2.5 sm:px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            ★ {burkinaCount} BF Priorité
          </Badge>
          {selectedIds.size > 0 && (
            <Badge variant="default" className="px-2.5 sm:px-3 py-1 text-xs font-bold">
              ✓ {selectedIds.size} sélectionnée(s)
            </Badge>
          )}
        </div>
      </div>

      {/* Barre de sélection active si cultures cochées */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/40 bg-gradient-to-r from-primary/10 via-background to-primary/5 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">
                <strong className="text-primary">{selectedIds.size}</strong> culture(s) sélectionnée(s)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <Button size="sm" variant="outline" onClick={copySelectedSummary} className="text-xs gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copier le résumé
              </Button>
              <Button size="sm" variant="outline" onClick={clearSelection} className="text-xs gap-1.5 text-muted-foreground">
                <X className="h-3.5 w-3.5" />
                Vider la sélection
              </Button>
              <Button 
                size="sm" 
                className="text-xs gap-1.5 gradient-primary text-primary-foreground font-semibold"
                onClick={() => navigate("/dashboard/expert-calculator")}
              >
                <Calculator className="h-3.5 w-3.5" />
                Calculer les intrants
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boîte des Filtres Multi-Niveaux */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4 space-y-4">
          {/* Ligne 1 : Recherche texte & Filtre Rapide d'Origine */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="relative md:col-span-7">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-9 h-10 text-sm" 
                placeholder="Rechercher par culture, nom scientifique, variété INERA, maladie..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
              {search && (
                <button 
                  onClick={() => setSearch("")} 
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sélecteur Origine / Priorité */}
            <div className="md:col-span-5">
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Priorité pays / région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌍 Toutes les origines ({sheets.length})</SelectItem>
                  <SelectItem value="burkina">★ Priorité Burkina Faso ({burkinaCount})</SelectItem>
                  <SelectItem value="sahel">☀️ Sahel & Soudano-sahélien</SelectItem>
                  <SelectItem value="cedeao">🌿 Complémentaires CEDEAO ({sheets.length - burkinaCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ligne 2 : Filtres Catégorie, Zone et Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Catégories */}
            <div>
              <label className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-1 block">
                Catégorie agronomique
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">Toutes catégories ({sheets.length})</SelectItem>
                  {categories.map(([cat, count]) => (
                    <SelectItem key={cat} value={cat}>
                      {cat} ({count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zone agro-climatique */}
            <div>
              <label className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-1 block">
                Zone Agro-Climatique
              </label>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes zones</SelectItem>
                  <SelectItem value="sahel">Sahel (200 - 600 mm)</SelectItem>
                  <SelectItem value="soudano-sahélien">Soudano-sahélien (600 - 900 mm)</SelectItem>
                  <SelectItem value="soudanien">Soudanien (900 - 1100 mm)</SelectItem>
                  <SelectItem value="guinéen">Guinéen / Humide (&gt; 1100 mm)</SelectItem>
                  <SelectItem value="bas-fond">Bas-fonds &amp; Périmètres irrigués</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Durée du cycle */}
            <div>
              <label className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-1 block">
                Durée du cycle végétatif
              </label>
              <Select value={cycleFilter} onValueChange={setCycleFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous cycles</SelectItem>
                  <SelectItem value="court">Très court (&le; 75 jours - Soudure)</SelectItem>
                  <SelectItem value="moyen">Moyen (75 à 115 jours)</SelectItem>
                  <SelectItem value="long">Long (110 à 180 jours)</SelectItem>
                  <SelectItem value="perenne">Pérenne / Arbres (&gt; 180 jours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ligne 3 : Compteur de résultats et bouton de réinitialisation */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Affichage de <strong className="text-foreground">{filtered.length}</strong> culture(s) sur {sheets.length}
              </span>
              {isFiltersActive && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={resetAllFilters} 
                  className="h-7 text-xs text-primary px-2 gap-1 hover:bg-primary/5"
                >
                  <X className="h-3 w-3" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={selectAllFiltered} 
                className="h-7 text-xs gap-1"
                disabled={filtered.length === 0}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Sélectionner ces {filtered.length}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille des Fiches Techniques */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Chargement des fiches techniques...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-muted/20 space-y-3">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
          <h3 className="font-semibold text-base">Aucune culture ne correspond aux filtres</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Essayez de modifier votre recherche textuelle ou réinitialisez les critères de filtrage.
          </p>
          <Button size="sm" variant="outline" onClick={resetAllFilters}>
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paginatedItems.map(sheet => {
              const isOpen = openedId === sheet.id;
              const isSelected = selectedIds.has(sheet.id);

              return (
                <Card 
                  key={sheet.id}
                  className={`transition-all duration-200 border cursor-pointer hover:border-primary/50 hover:shadow-xs ${
                    isSelected ? "border-primary bg-primary/[0.02]" : "border-border/60"
                  }`}
                  onClick={() => setOpenedId(isOpen ? null : sheet.id)}
                >
                  <CardContent className="p-3.5 sm:p-4 space-y-3">
                    {/* En-tête de la carte */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 sm:gap-2.5 flex-1 min-w-0">
                        <div 
                          className="pt-0.5 shrink-0" 
                          onClick={(e) => toggleSelect(sheet.id, e)}
                        >
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(sheet.id)}
                            className="h-4 w-4 rounded data-[state=checked]:bg-primary"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug break-words">
                              {sheet.name_fr}
                            </h3>
                            {sheet.is_burkina_priority && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
                                ★ BF
                              </Badge>
                            )}
                          </div>
                          {sheet.scientific_name && (
                            <p className="text-xs italic text-muted-foreground truncate">
                              {sheet.scientific_name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                          title="Copier la fiche"
                          onClick={(e) => copySheetData(sheet, e)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                          title={isOpen ? "Replier" : "Déplier"}
                        >
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Ligne d'attributs clés compacts */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Badge variant="outline" className="text-[10px] sm:text-[11px] font-normal bg-muted/40">
                        {sheet.category}
                      </Badge>
                      <span className="text-[10px] sm:text-[11px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {sheet.cycle_days_min}-{sheet.cycle_days_max} j
                      </span>
                      <span className="text-[10px] sm:text-[11px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-800 dark:text-blue-300">
                        <Droplets className="h-3 w-3 shrink-0" />
                        {sheet.water_needs_mm} mm
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        Rdt : {sheet.yield_potential_t_ha} t/ha
                      </span>
                    </div>

                    {/* Régions Burkina */}
                    {sheet.regions_burkina && sheet.regions_burkina.length > 0 && (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0 text-primary/70" />
                        <span className="truncate">{sheet.regions_burkina.join(", ")}</span>
                      </div>
                    )}

                    {/* Section détaillée dépliable */}
                    {isOpen && (
                      <div className="pt-3 mt-2 border-t border-dashed space-y-2.5 text-xs">
                        {/* NPK */}
                        {sheet.npk_needs && (
                          <div className="p-2.5 rounded bg-muted/30 border border-muted flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="font-semibold text-foreground">Formule NPK recommandée :</span>
                            <span className="font-mono font-bold text-primary text-[11px] sm:text-xs">
                              N: {sheet.npk_needs.N} • P₂O₅: {sheet.npk_needs.P} • K₂O: {sheet.npk_needs.K} kg/ha
                            </span>
                          </div>
                        )}

                        {/* Variétés */}
                        {sheet.recommended_varieties && sheet.recommended_varieties.length > 0 && (
                          <div>
                            <strong className="text-foreground">Variétés homologuées (INERA / Sahel) : </strong>
                            <span className="text-muted-foreground">{sheet.recommended_varieties.join(", ")}</span>
                          </div>
                        )}

                        {/* Ravageurs & Maladies */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {sheet.common_pests && sheet.common_pests.length > 0 && (
                            <div className="p-2 rounded bg-red-500/5 border border-red-500/15">
                              <span className="font-semibold text-red-700 dark:text-red-400 block mb-0.5">
                                Ravageurs majeurs :
                              </span>
                              <p className="text-muted-foreground text-[11px] leading-relaxed">
                                {sheet.common_pests.join(", ")}
                              </p>
                            </div>
                          )}

                          {sheet.common_diseases && sheet.common_diseases.length > 0 && (
                            <div className="p-2 rounded bg-amber-500/5 border border-amber-500/15">
                              <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">
                                Maladies courantes :
                              </span>
                              <p className="text-muted-foreground text-[11px] leading-relaxed">
                                {sheet.common_diseases.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Saisons et Zones */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {sheet.seasons.map(sea => (
                            <Badge key={sea} variant="outline" className="text-[10px] bg-secondary/30">
                              {sea}
                            </Badge>
                          ))}
                          {sheet.climate_zones.map(z => (
                            <Badge key={z} variant="outline" className="text-[10px] text-muted-foreground">
                              {z}
                            </Badge>
                          ))}
                        </div>

                        {/* Notes agronomiques */}
                        {sheet.notes && (
                          <p className="italic text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10 text-[11px]">
                            💡 {sheet.notes}
                          </p>
                        )}

                        {/* Boutons d'action sur la fiche */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 sm:h-7 text-xs gap-1.5 w-full sm:w-auto"
                            onClick={(e) => copySheetData(sheet, e)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copier la fiche
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 sm:h-7 text-xs gap-1.5 gradient-primary text-primary-foreground font-semibold w-full sm:w-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/expert-calculator?crop=${sheet.crop_key}`);
                            }}
                          >
                            <Calculator className="h-3.5 w-3.5" />
                            Calculer les intrants
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination si plusieurs pages */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
              <span className="text-center sm:text-left">
                Page <strong className="text-foreground">{currentPage}</strong> sur {totalPages} ({filtered.length} cultures)
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = Math.min(currentPage - 2 + i, totalPages);
                    }
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={currentPage === pageNum ? "default" : "outline"}
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
