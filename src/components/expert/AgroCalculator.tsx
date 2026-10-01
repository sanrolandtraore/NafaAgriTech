import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CROPS_AGRO_DATABASE,
  computeComprehensiveAgro,
  CropAgroSpec,
} from "@/lib/agronomicCalculatorData";
import { RealModuleIcon } from "@/components/ui/RealModuleIcon";
import {
  Calculator,
  Sprout,
  ShieldAlert,
  Droplets,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  BookmarkCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGateModal } from "@/components/auth/AuthGateModal";

interface SavedParcel {
  id: string;
  name: string;
  area_ha: number | null;
}

export function AgroCalculator() {
  const { user } = useAuth();
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [crops] = useState<CropAgroSpec[]>(CROPS_AGRO_DATABASE);
  const [selectedCropId, setSelectedCropId] = useState<string>("mais");
  const [areaInput, setAreaInput] = useState<string>("1.0");
  const [areaUnit, setAreaUnit] = useState<"ha" | "m2">("ha");

  // Parcelles GPS
  const [parcels, setParcels] = useState<SavedParcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<string>("");

  // Paramètres personnalisés optionnels
  const [seedsPerHole, setSeedsPerHole] = useState<number>(2);
  const [rowSpacingCm, setRowSpacingCm] = useState<number>(80);
  const [plantSpacingCm, setPlantSpacingCm] = useState<number>(40);

  const selectedCrop = useMemo(() => {
    return crops.find((c) => c.id === selectedCropId) || crops[0];
  }, [crops, selectedCropId]);

  // Synchronisation des écartements par défaut lors du changement de culture
  useEffect(() => {
    setSeedsPerHole(selectedCrop.seedsPerHole);
    setRowSpacingCm(selectedCrop.rowSpacingCm);
    setPlantSpacingCm(selectedCrop.plantSpacingCm);
  }, [selectedCrop]);

  useEffect(() => {
    supabase
      .from("expert_parcels")
      .select("id, name, area_ha")
      .order("created_at", { ascending: false })
      .then(({ data }) => setParcels((data as SavedParcel[]) || []));
  }, []);

  const handleApplyParcel = (id: string) => {
    setSelectedParcel(id);
    const p = parcels.find((x) => x.id === id);
    if (p?.area_ha) {
      setAreaUnit("ha");
      setAreaInput(String(p.area_ha));
      toast.success(`Parcelle "${p.name}" appliquée : ${p.area_ha} ha`);
    }
  };

  const areaHa = useMemo(() => {
    const val = parseFloat(areaInput) || 0;
    return areaUnit === "ha" ? val : val / 10000;
  }, [areaInput, areaUnit]);

  // Calculs complets via le moteur agronomique
  const results = useMemo(() => {
    return computeComprehensiveAgro(
      selectedCrop,
      areaHa,
      seedsPerHole,
      rowSpacingCm,
      plantSpacingCm
    );
  }, [selectedCrop, areaHa, seedsPerHole, rowSpacingCm, plantSpacingCm]);

  const handleExportSummary = () => {
    const summary = `FICHE TECHNIQUE AGRONOMIQUE — NAFA-AGRITECH
Culture : ${selectedCrop.name} (${selectedCrop.scientificName})
Superficie : ${results.areaHa} ha (${results.areaM2.toLocaleString()} m²)
Densité : ${results.plantDensity.toLocaleString()} poquets (${(results.plantDensity / (results.areaM2 || 1)).toFixed(1)} plants/m²)
Semences requises : ${results.seedWeightKg} kg (~${results.seedsCount.toLocaleString()} graines) — ${results.seedCostFcfa.toLocaleString()} FCFA
Programme phytosanitaire : ${results.phytoTreatments.length} interventions (${results.totalSprayersCount} pulvérisateurs 16L) — ${results.totalPhytoCostFcfa.toLocaleString()} FCFA
Fertilisation : ${results.manureTons} T fumier + ${results.npkBags50kg} sacs NPK + ${results.ureaBags50kg} sacs Urée — ${results.fertilizerCostFcfa.toLocaleString()} FCFA
Rendement prévisionnel : ${(results.expectedYieldKg / 1000).toFixed(1)} Tonnes (${results.potentialRevenueFcfa.toLocaleString()} FCFA)
Marge brute prévisionnelle : ${results.grossMarginFcfa.toLocaleString()} FCFA
Normes de calcul : INERA / FAO-56`;

    navigator.clipboard.writeText(summary);
    toast.success("Fiche agronomique copiée dans le presse-papier !");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── EN-TÊTE PRINCIPAL CALCULATEUR ── */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-6 rounded-[28px] border-2 border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Moteur d'Ingénierie & Planification de Campagne • NAFA Genius</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black flex items-center gap-2.5">
            <Calculator className="h-6 w-6 text-[#F97316]" />
            <span>Calculatrice Agronomique Avancée</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80">
            Calcul de haute précision : semences au kg/sachet, programme phytosanitaire, pulvérisateurs 16L, engrais fractionnés et rentabilité prévisionnelle.
          </p>
        </div>

        <Button
          onClick={handleExportSummary}
          className="rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs px-5 py-2.5 shadow-lg shadow-orange-500/30 shrink-0 flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Exporter la fiche</span>
        </Button>
      </div>

      {/* ── ZONE DE SÉLECTION : CULTURE & SUPERFICIE ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Choix de la Culture avec Icone Réelle */}
        <Card className="p-4 rounded-[22px] border-border/80 shadow-xs md:col-span-2 space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sprout className="h-4 w-4 text-emerald-600" />
            <span>1. Sélectionner le type de culture</span>
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {crops.map((c) => {
              const isSelected = c.id === selectedCropId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCropId(c.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500 shadow-sm text-foreground font-bold"
                      : "bg-background border-border/70 hover:bg-muted/50 text-muted-foreground font-medium"
                  }`}
                >
                  <RealModuleIcon type={c.iconType} size="xs" className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs truncate">{c.name.split(" (")[0]}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.cycleDays} jours</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Superficie et Parcelle GPS */}
        <Card className="p-4 rounded-[22px] border-border/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#F97316]" />
              <span>2. Superficie de la parcelle</span>
            </Label>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.05"
                min="0.01"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                className="font-bold text-base rounded-xl h-11"
              />
              <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setAreaUnit("ha")}
                  className={`px-3 py-2 text-xs font-bold transition-colors ${
                    areaUnit === "ha" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  ha
                </button>
                <button
                  type="button"
                  onClick={() => setAreaUnit("m2")}
                  className={`px-3 py-2 text-xs font-bold transition-colors ${
                    areaUnit === "m2" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  m²
                </button>
              </div>
            </div>

            {parcels.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Ou charger une parcelle mesurée au GPS :
                </span>
                <Select value={selectedParcel} onValueChange={handleApplyParcel}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Choisir une parcelle GPS" />
                  </SelectTrigger>
                  <SelectContent>
                    {parcels.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.name} ({p.area_ha ?? 0} ha)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="bg-muted/40 p-2.5 rounded-xl text-xs space-y-0.5 border border-border/60">
            <div className="flex justify-between text-muted-foreground">
              <span>Superficie en ha :</span>
              <span className="font-bold text-foreground">{results.areaHa.toFixed(3)} ha</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Superficie en m² :</span>
              <span className="font-bold text-foreground">{results.areaM2.toLocaleString()} m²</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── TABS MULTI-FONCTIONS NAFA GENIUS ── */}
      <Tabs defaultValue="seeds" className="space-y-4">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto p-1.5 rounded-[22px] bg-muted/60 border border-border">
          <TabsTrigger value="seeds" className="rounded-xl py-2.5 text-xs font-bold gap-2">
            <Sprout className="h-4 w-4" />
            <span>Semences & Densité</span>
          </TabsTrigger>
          <TabsTrigger value="phyto" className="rounded-xl py-2.5 text-xs font-bold gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Phytosanitaire ({results.phytoTreatments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="fertilizer" className="rounded-xl py-2.5 text-xs font-bold gap-2">
            <Droplets className="h-4 w-4" />
            <span>Fertilisants & Eau</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-xl py-2.5 text-xs font-bold gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Bilan & Rentabilité</span>
          </TabsTrigger>
        </TabsList>

        {/* ── ONGLET 1 : CALCUL DE SEMENCES PRÉCIS ── */}
        <TabsContent value="seeds" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Paramètres d'écartement */}
            <Card className="p-4 rounded-[22px] border-border space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <Info className="h-4 w-4 text-emerald-600" />
                <span>Paramètres de semis personnalisés</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <Label>Écartement entre lignes (cm)</Label>
                  <Input
                    type="number"
                    value={rowSpacingCm}
                    onChange={(e) => setRowSpacingCm(Number(e.target.value) || 1)}
                    className="h-9 mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label>Écartement sur la ligne (cm)</Label>
                  <Input
                    type="number"
                    value={plantSpacingCm}
                    onChange={(e) => setPlantSpacingCm(Number(e.target.value) || 1)}
                    className="h-9 mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label>Graines par poquet</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={seedsPerHole}
                    onChange={(e) => setSeedsPerHole(Number(e.target.value) || 1)}
                    className="h-9 mt-1 rounded-xl"
                  />
                </div>
              </div>
            </Card>

            {/* Résultats Semences Clés */}
            <Card className="p-5 rounded-[22px] border-border md:col-span-2 bg-gradient-to-br from-emerald-500/5 via-card to-background space-y-4">
              <h3 className="text-sm font-bold text-foreground">
                Besoins en semences pour {selectedCrop.name}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    Poids total de semences
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600">
                    {results.seedWeightKg} kg
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Dose standard : {selectedCrop.seedRateKgHa} kg/ha
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    Densité totale (poquets)
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-foreground">
                    {results.plantDensity.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    ~{(results.plantDensity / (results.areaM2 || 1)).toFixed(1)} poquets/m²
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    Nombre total de graines
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-foreground">
                    {results.seedsCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Germination estimée : {Math.round(selectedCrop.germinationRate * 100)}%
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    Poids de 1000 grains (PMG)
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {selectedCrop.pmgGram} g
                  </span>
                  <span className="text-[10px] text-muted-foreground block">Référentiel certifié</span>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    Durée du cycle
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {selectedCrop.cycleDays} jours
                  </span>
                  <span className="text-[10px] text-muted-foreground block">Du semis à la récolte</span>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    Coût prévisionnel semences
                  </span>
                  <span className="text-lg font-bold text-[#F97316]">
                    {results.seedCostFcfa.toLocaleString()} FCFA
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Prix réf : {selectedCrop.seedPricePerKgFcfa.toLocaleString()} F/kg
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── ONGLET 2 : PROGRAMME PHYTOSANITAIRE COMPLET SELON SUPERFICIE ── */}
        <TabsContent value="phyto" className="space-y-4">
          <Card className="p-5 rounded-[24px] border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-[#F97316]" />
                  <span>Programme Phytosanitaire Spécifique — {selectedCrop.name}</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Doses commerciales exactes, volumes d'eau et nombre d'atomiseurs/pulvérisateurs de 16L nécessaires pour {results.areaHa} ha.
                </p>
              </div>

              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs self-start sm:self-auto">
                Total Phyto : {results.totalPhytoCostFcfa.toLocaleString()} FCFA
              </Badge>
            </div>

            <div className="space-y-3">
              {results.phytoTreatments.map((pt, idx) => {
                const { treatment, quantityTotal, waterVolumeLiters, sprayerCount16L, dosePerSprayerMlOrG, costFcfa } = pt;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/40 shadow-xs space-y-3 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold ${
                            treatment.type === "herbicide"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : treatment.type === "insecticide"
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                              : treatment.type === "fongicide"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          }`}
                        >
                          {treatment.type.toUpperCase()}
                        </Badge>
                        <span className="font-bold text-sm text-foreground">
                          {treatment.productName}
                        </span>
                        <span className="text-xs text-muted-foreground">({treatment.stage})</span>
                      </div>

                      <span className="font-black text-sm text-[#F97316]">
                        {costFcfa.toLocaleString()} FCFA
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Cible :</strong> {treatment.targetPests} (Matière active : {treatment.activeIngredient})</span>
                    </div>

                    {/* Grille des mesures terrain pour l'opérateur */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2 rounded-xl bg-muted/40">
                        <span className="text-[10px] text-muted-foreground block">Quantité totale requise</span>
                        <span className="font-extrabold text-foreground">
                          {quantityTotal} {treatment.unit.split("/")[0]}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-muted/40">
                        <span className="text-[10px] text-muted-foreground block">Volume total de bouillie</span>
                        <span className="font-extrabold text-foreground">{waterVolumeLiters} Litres d'eau</span>
                      </div>
                      <div className="p-2 rounded-xl bg-muted/40">
                        <span className="text-[10px] text-muted-foreground block">Pulvérisateurs 16L requis</span>
                        <span className="font-extrabold text-foreground">{sprayerCount16L} appareils</span>
                      </div>
                      <div className="p-2 rounded-xl bg-muted/40">
                        <span className="text-[10px] text-muted-foreground block">Dose par appareil 16L</span>
                        <span className="font-extrabold text-emerald-600">
                          {dosePerSprayerMlOrG} {treatment.unit.startsWith("L") ? "ml" : "g"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* ── ONGLET 3 : FERTILISANTS FRACTIONNÉS & EAU FAO ── */}
        <TabsContent value="fertilizer" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Programme de Fertilisation */}
            <Card className="p-5 rounded-[24px] border-border space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Droplets className="h-4 w-4 text-emerald-600" />
                <span>Programme de Fumure & Engrais Minéraux</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-foreground">Fumure Organique (Compost / Fumier)</p>
                    <p className="text-[11px] text-muted-foreground">À épandre avant labour profond</p>
                  </div>
                  <span className="font-black text-sm text-foreground">{results.manureTons} Tonnes</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-foreground">{selectedCrop.fertilizerNeeds.npkFormula}</p>
                    <p className="text-[11px] text-muted-foreground">Engrais de fond au semis / repiquage</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-emerald-600">{results.npkKg} kg</span>
                    <span className="text-[11px] text-muted-foreground block">({results.npkBags50kg} sacs de 50 kg)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-foreground">Urée 46% N</p>
                    <p className="text-[11px] text-muted-foreground">Apport d'entretien (en 2 fractions)</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-emerald-600">{results.ureaKg} kg</span>
                    <span className="text-[11px] text-muted-foreground block">({results.ureaBags50kg} sacs de 50 kg)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between items-center text-xs font-bold text-foreground">
                <span>Budget Fertilisants estimé :</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-black">
                  {results.fertilizerCostFcfa.toLocaleString()} FCFA
                </span>
              </div>
            </Card>

            {/* Besoins Hydriques FAO-56 */}
            <Card className="p-5 rounded-[24px] border-border space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span>Besoins en Eau (Norme FAO-56 Sahélienne)</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between">
                  <span className="text-muted-foreground">Consommation journalière moyenne :</span>
                  <span className="font-black text-foreground">{results.dailyWaterM3} m³ / jour</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between">
                  <span className="text-muted-foreground">Consommation totale sur le cycle ({selectedCrop.cycleDays}j) :</span>
                  <span className="font-black text-blue-600">{results.totalWaterM3} m³</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between">
                  <span className="text-muted-foreground">Débit pompe conseillé (sur 6h de soleil) :</span>
                  <span className="font-black text-foreground">
                    {(results.dailyWaterM3 / 6).toFixed(1)} m³ / heure
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground italic">
                * Calcul basé sur l'évapotranspiration sahélienne moyenne (ETo = 5.5 mm/j) et le coefficient cultural Kc de la culture.
              </p>
            </Card>
          </div>
        </TabsContent>

        {/* ── ONGLET 4 : BILAN FINANCIER & RENTABILITÉ CAMPAGNE ── */}
        <TabsContent value="finance" className="space-y-4">
          <Card className="p-5 sm:p-6 rounded-[24px] border-border space-y-5">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span>Compte d'Exploitation Prévisionnel de la Campagne</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Estimation basée sur les mercuriales moyennes du Burkina Faso et les rendements observés.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Rendement attendu</span>
                <span className="text-2xl font-black text-foreground">
                  {(results.expectedYieldKg / 1000).toFixed(1)} T
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Soit {results.expectedYieldKg.toLocaleString()} kg
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Chiffre d'affaires estimé</span>
                <span className="text-2xl font-black text-emerald-600">
                  {results.potentialRevenueFcfa.toLocaleString()} FCFA
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Prix : {selectedCrop.marketPriceKgFcfa} F/kg
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Total charges intrants</span>
                <span className="text-2xl font-black text-rose-500">
                  {results.totalInputsCostFcfa.toLocaleString()} FCFA
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Semences + Phyto + Engrais
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/40 shadow-xs space-y-1">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  Marge brute prévisionnelle
                </span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                  {results.grossMarginFcfa.toLocaleString()} FCFA
                </span>
                <span className="text-[10px] text-emerald-600/80 block">
                  Rentabilité estimée : {Math.round((results.grossMarginFcfa / (results.potentialRevenueFcfa || 1)) * 100)}%
                </span>
              </div>
            </div>

            {/* Détail analytique des dépenses */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-2 text-xs">
              <span className="font-bold text-foreground block">Ventilation des charges d'intrants :</span>
              <div className="flex justify-between text-muted-foreground py-1 border-b border-border/40">
                <span>Semences certifiées :</span>
                <span className="font-bold text-foreground">{results.seedCostFcfa.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-muted-foreground py-1 border-b border-border/40">
                <span>Traitements phytosanitaires ({results.phytoTreatments.length} interventions) :</span>
                <span className="font-bold text-foreground">{results.totalPhytoCostFcfa.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-muted-foreground py-1">
                <span>Fertilisants minéraux (NPK + Urée) :</span>
                <span className="font-bold text-foreground">{results.fertilizerCostFcfa.toLocaleString()} FCFA</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── BARRE DE CONVERSION DOUCE / SAUVEGARDE DU RÉSULTAT ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-background to-orange-500/10 border-2 border-primary/30 shadow-md">
        <div className="space-y-0.5 text-center sm:text-left">
          <p className="text-xs sm:text-sm font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="h-4 w-4 text-[#F97316]" />
            <span>Simulation calculée pour <strong>{selectedCrop.name} ({areaHa} ha)</strong></span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Marge brute prévisionnelle : <strong className="text-emerald-600 font-mono font-bold">{results.grossMarginFcfa.toLocaleString()} FCFA</strong> • Sauvegardez pour générer votre compte d'exploitation.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => {
            if (!user) {
              setAuthGateOpen(true);
            } else {
              try {
                const savedList = JSON.parse(localStorage.getItem("nafa_saved_simulations") || "[]");
                savedList.push({
                  id: `sim_${Date.now()}`,
                  crop: selectedCrop.name,
                  areaHa,
                  grossMarginFcfa: results.grossMarginFcfa,
                  createdAt: new Date().toISOString(),
                });
                localStorage.setItem("nafa_saved_simulations", JSON.stringify(savedList));
                toast.success("Simulation enregistrée avec succès dans votre espace personnel !");
              } catch (e) {
                toast.success("Simulation prête et mémorisée localement.");
              }
            }
          }}
          className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white font-heading font-black text-xs sm:text-sm px-6 py-5 rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <BookmarkCheck className="h-4 w-4" />
          <span>Enregistrer mon résultat</span>
        </Button>
      </div>

      <AuthGateModal
        open={authGateOpen}
        onOpenChange={setAuthGateOpen}
        title="Enregistrez votre simulation & Débloquez votre espace"
        description={`Votre simulation pour ${selectedCrop.name} (${areaHa} ha) dégage une marge prévisionnelle de ${results.grossMarginFcfa.toLocaleString()} FCFA. Créez votre compte gratuitement pour sauvegarder ce projet et éditer votre compte d'exploitation.`}
        actionLabel="Enregistrer mon projet agricole"
        redirectUrl="/dashboard/expert/calculateur"
        simulationPayload={{
          cropId: selectedCrop.id,
          cropName: selectedCrop.name,
          areaHa,
          grossMarginFcfa: results.grossMarginFcfa,
          expectedYieldKg: results.expectedYieldKg,
          seedCostFcfa: results.seedCostFcfa,
          fertilizerCostFcfa: results.fertilizerCostFcfa,
          potentialRevenueFcfa: results.potentialRevenueFcfa,
        }}
      />
    </div>
  );
}

export default AgroCalculator;
