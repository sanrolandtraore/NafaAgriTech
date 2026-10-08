import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Droplets,
  Sun,
  Gauge,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Package,
  FileText,
  RotateCcw,
  Sliders,
  Settings2,
  Plus,
  Trash2,
  Store,
  ChevronDown,
  ChevronUp,
  Cpu,
  Workflow
} from "lucide-react";
import {
  IrrisInput,
  IrrisResult,
  IRRIS_CROPS,
  IRRIS_SEASONS,
  IRRIS_METHODS,
  IRRIS_ENERGY_SOURCES,
  IRRIS_PUMP_TYPES,
  IRRIS_PIPE_MATERIALS,
  calculateIrrisModel,
  IrrisWaterSourceType,
  IrrisCropKey,
  IrrisSeason,
  IrrisMethod,
  IrrisPumpingMode,
  IrrisEnergySource,
  IrrisPumpType,
  IrrisPipeMaterial,
} from "@/lib/irrisModelEngine";
import { QuoteItem } from "@/lib/nafaGeniusEngine";

interface IrrisModelStudioProps {
  onResultsCalculated?: (result: IrrisResult) => void;
  onNavigateToQuote?: () => void;
}

// Fournisseurs de référence Marketplace du Burkina Faso
const MARKETPLACE_SUPPLIERS = [
  "FASO SOLAIRE & POMPAGE SARL (Marketplace)",
  "AGRODIA BURKINA (Irrigation & Plastique)",
  "SODIMEX SAHEL SA (Matériaux & Métallurgie)",
  "TROPIC AGRO & HYDRAULIQUE (Marketplace)",
  "Cabinet d'Expertise Agréé NAFA",
  "Fournisseur Marketplace Local / Offre Directe",
];

export const IrrisModelStudio: React.FC<IrrisModelStudioProps> = ({
  onResultsCalculated,
  onNavigateToQuote,
}) => {
  // Saisie par défaut adaptée au terrain sahélien
  const [form, setForm] = useState<IrrisInput>({
    sourceType: "forage",
    dynamicWaterDepthM: 25,
    sourceFlowM3h: 5.0,
    dischargeDistanceM: 40,
    areaHa: 0.5,
    cropKey: "tomate",
    season: "seche_chaude",
    method: "goutte_a_goutte",
    pumpingMode: "fil_du_soleil",
    tankHeightM: 4,
    // Personnalisation expert par défaut
    energySource: "solaire_pur",
    pumpType: "solaire_immergee_dc",
    pipeMaterial: "pehd_pn10",
    customPipeDiameterMm: 50,
    customDripperSpacingM: 0.3,
  });

  const [result, setResult] = useState<IrrisResult>(() => calculateIrrisModel(form));
  const [showAdvancedCustomization, setShowAdvancedCustomization] = useState<boolean>(true);
  const [isAddingNewItem, setIsAddingNewItem] = useState<boolean>(false);
  const [newItem, setNewItem] = useState<{
    designation: string;
    specifications: string;
    unit: QuoteItem["unit"];
    quantity: number;
    unitPriceFcfa: number;
    supplierName: string;
  }>({
    designation: "",
    specifications: "",
    unit: "u",
    quantity: 1,
    unitPriceFcfa: 50000,
    supplierName: MARKETPLACE_SUPPLIERS[0],
  });

  // Mise à jour d'un champ principal avec recalcul
  const updateField = <K extends keyof IrrisInput>(field: K, value: IrrisInput[K]) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      const newRes = calculateIrrisModel(updated);
      setResult(newRes);
      if (onResultsCalculated) onResultsCalculated(newRes);
      return updated;
    });
  };

  const handleQuickArea = (ha: number) => {
    updateField("areaHa", ha);
  };

  const handleRecalculate = () => {
    const res = calculateIrrisModel(form);
    setResult(res);
    if (onResultsCalculated) onResultsCalculated(res);
    toast.success("Dimensionnement Modèle IRRIS recalculé avec succès !");
  };

  // Modification directe d'une ligne du bordereau / prix marketplace
  const handleUpdateBomItem = (index: number, field: keyof QuoteItem, value: any) => {
    const currentBOM = [...result.billOfMaterials];
    if (!currentBOM[index]) return;

    const item = { ...currentBOM[index], [field]: value };
    if (field === "quantity" || field === "unitPriceFcfa") {
      item.totalPriceFcfa = Math.round(Number(item.quantity) * Number(item.unitPriceFcfa));
    }
    item.isCustomized = true;
    currentBOM[index] = item;

    setForm((prev) => {
      const updated = { ...prev, customBillOfMaterials: currentBOM };
      const newRes = calculateIrrisModel(updated);
      setResult(newRes);
      if (onResultsCalculated) onResultsCalculated(newRes);
      return updated;
    });
  };

  // Suppression d'une ligne d'équipement du bordereau
  const handleDeleteBomItem = (index: number) => {
    const currentBOM = result.billOfMaterials.filter((_, idx) => idx !== index);
    setForm((prev) => {
      const updated = { ...prev, customBillOfMaterials: currentBOM };
      const newRes = calculateIrrisModel(updated);
      setResult(newRes);
      if (onResultsCalculated) onResultsCalculated(newRes);
      return updated;
    });
    toast.info("Équipement retiré du bordereau.");
  };

  // Ajout d'une ligne d'équipement sur-mesure au bordereau
  const handleAddCustomItem = () => {
    if (!newItem.designation.trim()) {
      toast.error("Veuillez saisir la désignation de l'équipement.");
      return;
    }

    const createdItem: QuoteItem = {
      code: `EXP-CUST-${Date.now().toString().slice(-4)}`,
      category: "reseau_hydraulique",
      designation: newItem.designation.trim(),
      specifications: newItem.specifications.trim() || "Spécifié sur-mesure par l'Expert selon offre Marketplace",
      unit: newItem.unit,
      quantity: Number(newItem.quantity) || 1,
      unitPriceFcfa: Number(newItem.unitPriceFcfa) || 0,
      totalPriceFcfa: Math.round((Number(newItem.quantity) || 1) * (Number(newItem.unitPriceFcfa) || 0)),
      supplierName: newItem.supplierName,
      isCustomized: true,
    };

    const currentBOM = [...result.billOfMaterials, createdItem];
    setForm((prev) => {
      const updated = { ...prev, customBillOfMaterials: currentBOM };
      const newRes = calculateIrrisModel(updated);
      setResult(newRes);
      if (onResultsCalculated) onResultsCalculated(newRes);
      return updated;
    });

    setNewItem({
      designation: "",
      specifications: "",
      unit: "u",
      quantity: 1,
      unitPriceFcfa: 50000,
      supplierName: MARKETPLACE_SUPPLIERS[0],
    });
    setIsAddingNewItem(false);
    toast.success("Équipement ajouté au devis avec succès !");
  };

  // Modèles rapides d'équipements pour le terrain sahélien
  const applyQuickItemTemplate = (
    designation: string,
    specifications: string,
    unitPriceFcfa: number,
    unit: QuoteItem["unit"] = "u"
  ) => {
    setNewItem({
      designation,
      specifications,
      unit,
      quantity: 1,
      unitPriceFcfa,
      supplierName: MARKETPLACE_SUPPLIERS[1],
    });
    setIsAddingNewItem(true);
  };

  // Réinitialiser les surcharges expert et revenir aux valeurs calculées automatiquement
  const handleResetToStandard = () => {
    const resetForm: IrrisInput = {
      ...form,
      energySource: "solaire_pur",
      customEnergyLabel: undefined,
      customSolarWp: undefined,
      pumpType: "solaire_immergee_dc",
      customPumpModel: undefined,
      customPumpPowerKw: undefined,
      customPumpPriceFcfa: undefined,
      pipeMaterial: "pehd_pn10",
      customPipeDiameterMm: 50,
      customDripperSpacingM: 0.3,
      customPipePricePerMeterFcfa: undefined,
      customBillOfMaterials: undefined,
    };

    setForm(resetForm);
    const newRes = calculateIrrisModel(resetForm);
    setResult(newRes);
    if (onResultsCalculated) onResultsCalculated(newRes);
    toast.success("Bordereau et paramètres réinitialisés aux standards IRRIS.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bannière Titre Modèle IRRIS avec Badge Personnalisation Expert */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-950 via-blue-900 to-slate-900 text-white border border-sky-800/40 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
              <Droplets className="h-4 w-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-heading font-black tracking-tight">
              Modèle IRRIS — Conception & Personnalisation Ingénieur
            </h2>
            <Badge className="bg-sky-500/30 text-sky-200 border-sky-400/30 text-[10px] px-2 py-0.5">
              Standard Practica / IRRINN Sahel
            </Badge>
            {result.isExpertCustomized && (
              <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/30 text-[10px] px-2 py-0.5 font-mono">
                Configuration Sur-Mesure Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-sky-100/80 max-w-2xl leading-relaxed">
            Liberté totale pour l'expert en génie rural : ajustez librement la source d'énergie, le type de tuyauterie, le modèle de pompe et les prix unitaires selon les offres réelles du marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {result.isExpertCustomized && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetToStandard}
              className="border-sky-400/40 text-sky-200 hover:bg-sky-800/50 text-xs h-9 px-3 rounded-xl gap-1.5"
              title="Rétablir les calculs standards IRRIS"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Rétablir Standards</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleRecalculate}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Recalculer</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Formulaire de Paramétrage IRRIS & Personnalisation Expert (5 colonnes) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Source d'eau */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Gauge className="h-4 w-4 text-sky-600" />
                1. Source d'Eau & Forage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <Label className="text-xs font-semibold text-foreground">Type de ressource en eau</Label>
                <Select
                  value={form.sourceType}
                  onValueChange={(v: IrrisWaterSourceType) => updateField("sourceType", v)}
                >
                  <SelectTrigger className="h-8 mt-1 text-xs">
                    <SelectValue placeholder="Choisir la ressource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forage">Forage tubé profond</SelectItem>
                    <SelectItem value="puits">Puits ouvert / puits maraîcher</SelectItem>
                    <SelectItem value="surface">Eau de surface (Rivière, barrage, canal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-foreground">Niveau dynamique (m)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={form.dynamicWaterDepthM}
                    onChange={(e) => updateField("dynamicWaterDepthM", Number(e.target.value) || 1)}
                    className="h-8 mt-1 text-xs font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground">Profondeur d'eau au pompage</span>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-foreground">Débit source (m³/h)</Label>
                  <Input
                    type="number"
                    step={0.5}
                    min={0.5}
                    max={50}
                    value={form.sourceFlowM3h}
                    onChange={(e) => updateField("sourceFlowM3h", Number(e.target.value) || 0.5)}
                    className="h-8 mt-1 text-xs font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground">Débit exploitable mesuré</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground">Distance refoulement (mètres)</Label>
                <Input
                  type="number"
                  min={5}
                  max={500}
                  value={form.dischargeDistanceM}
                  onChange={(e) => updateField("dischargeDistanceM", Number(e.target.value) || 10)}
                  className="h-8 mt-1 text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Parcelle & Culture */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                2. Parcelle & Culture
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">Superficie à irriguer (ha)</Label>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                    {Math.round(form.areaHa * 10000)} m² ({form.areaHa} ha)
                  </span>
                </div>
                <Input
                  type="number"
                  step={0.1}
                  min={0.05}
                  max={20}
                  value={form.areaHa}
                  onChange={(e) => updateField("areaHa", Number(e.target.value) || 0.1)}
                  className="h-8 mt-1 text-xs font-mono"
                />
                {/* Raccourcis parcelles courantes */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[0.25, 0.5, 1.0, 2.0].map((ha) => (
                    <Button
                      key={ha}
                      type="button"
                      size="sm"
                      variant={form.areaHa === ha ? "default" : "outline"}
                      onClick={() => handleQuickArea(ha)}
                      className={`h-6 text-[10px] px-2 rounded-full ${form.areaHa === ha ? "bg-emerald-700 text-white" : ""}`}
                    >
                      {ha} ha
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground">Culture sahélienne</Label>
                <Select
                  value={form.cropKey}
                  onValueChange={(v: IrrisCropKey) => updateField("cropKey", v)}
                >
                  <SelectTrigger className="h-8 mt-1 text-xs">
                    <SelectValue placeholder="Sélectionner la culture" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(IRRIS_CROPS).map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label} ({c.waterNeedMmDay} mm/j)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground">Saison climatique</Label>
                <Select
                  value={form.season}
                  onValueChange={(v: IrrisSeason) => updateField("season", v)}
                >
                  <SelectTrigger className="h-8 mt-1 text-xs">
                    <SelectValue placeholder="Sélectionner la saison" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IRRIS_SEASONS).map(([k, s]) => (
                      <SelectItem key={k} value={k}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 3. Distribution & Stockage */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                3. Distribution & Stockage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <Label className="text-xs font-semibold text-foreground">Méthode d'irrigation</Label>
                <Select
                  value={form.method}
                  onValueChange={(v: IrrisMethod) => updateField("method", v)}
                >
                  <SelectTrigger className="h-8 mt-1 text-xs">
                    <SelectValue placeholder="Méthode d'irrigation" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IRRIS_METHODS).map(([k, m]) => (
                      <SelectItem key={k} value={k}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-foreground">Mode de pompage</Label>
                  <Select
                    value={form.pumpingMode}
                    onValueChange={(v: IrrisPumpingMode) => updateField("pumpingMode", v)}
                  >
                    <SelectTrigger className="h-8 mt-1 text-xs">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fil_du_soleil">Fil du soleil (Château)</SelectItem>
                      <SelectItem value="direct_reseau">Solaire direct au réseau</SelectItem>
                      <SelectItem value="hybride">Solaire hybride (Secours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-foreground">Hauteur château (m)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={form.tankHeightM}
                    onChange={(e) => updateField("tankHeightM", Number(e.target.value) || 0)}
                    className="h-8 mt-1 text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. PERSONNALISATION AVANCÉE DE L'EXPERT (Énergie, Pompe, Tuyauterie) */}
          <Card className="border-2 border-primary/30 shadow-sm bg-primary/5">
            <CardHeader
              className="py-3 px-4 bg-primary/10 border-b border-primary/20 cursor-pointer flex flex-row items-center justify-between"
              onClick={() => setShowAdvancedCustomization(!showAdvancedCustomization)}
            >
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                4. Personnalisation Ingénieur (Liberté Totale)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                  Sur-Mesure
                </Badge>
                {showAdvancedCustomization ? (
                  <ChevronUp className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-primary" />
                )}
              </div>
            </CardHeader>

            {showAdvancedCustomization && (
              <CardContent className="p-4 space-y-4 text-xs">
                {/* A. Source d'Énergie */}
                <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      A. Source d'Énergie du Projet
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Libre choix</span>
                  </div>

                  <Select
                    value={form.energySource || "solaire_pur"}
                    onValueChange={(v: IrrisEnergySource) => updateField("energySource", v)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Sélectionner l'énergie" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(IRRIS_ENERGY_SOURCES).map((e) => (
                        <SelectItem key={e.key} value={e.key}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    {IRRIS_ENERGY_SOURCES[form.energySource || "solaire_pur"]?.description}
                  </p>

                  {/* Puissance crête solaire personnalisée si solaire */}
                  {IRRIS_ENERGY_SOURCES[form.energySource || "solaire_pur"]?.isSolar && (
                    <div className="pt-1.5 border-t border-border/50 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px] text-foreground font-semibold">Puissance Crête (Wc)</Label>
                        <Input
                          type="number"
                          step={100}
                          placeholder={`Auto (${result.solarPvWattPeak} Wc)`}
                          value={form.customSolarWp || ""}
                          onChange={(e) => updateField("customSolarWp", e.target.value ? Number(e.target.value) : undefined)}
                          className="h-7 text-xs font-mono mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-foreground font-semibold">Libellé personnalisé</Label>
                        <Input
                          placeholder="Ex: Solaire + Groupe secours"
                          value={form.customEnergyLabel || ""}
                          onChange={(e) => updateField("customEnergyLabel", e.target.value || undefined)}
                          className="h-7 text-xs mt-0.5"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* B. Choix & Modèle de Pompe */}
                <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-blue-600" />
                      B. Pompe & Motorisation
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Marque & Puissance</span>
                  </div>

                  <div>
                    <Label className="text-[11px] text-foreground">Type de pompe</Label>
                    <Select
                      value={form.pumpType || "solaire_immergee_dc"}
                      onValueChange={(v: IrrisPumpType) => updateField("pumpType", v)}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1 bg-background">
                        <SelectValue placeholder="Type de pompe" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(IRRIS_PUMP_TYPES).map((p) => (
                          <SelectItem key={p.key} value={p.key}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] text-foreground font-semibold">
                      Modèle / Marque libre (selon stock client ou marketplace)
                    </Label>
                    <Input
                      placeholder="Ex: Lorentz PS2-1800 HR-07 / Grundfos SQFlex / Honda GP160"
                      value={form.customPumpModel || ""}
                      onChange={(e) => updateField("customPumpModel", e.target.value || undefined)}
                      className="h-7 text-xs mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <Label className="text-[11px] text-foreground">Puissance moteur (kW)</Label>
                      <Input
                        type="number"
                        step={0.1}
                        placeholder={`Auto (${result.motorPowerKw} kW)`}
                        value={form.customPumpPowerKw || ""}
                        onChange={(e) => updateField("customPumpPowerKw", e.target.value ? Number(e.target.value) : undefined)}
                        className="h-7 text-xs font-mono mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-foreground">Prix Pompe (FCFA)</Label>
                      <Input
                        type="number"
                        step={10000}
                        placeholder="Ex: 850000"
                        value={form.customPumpPriceFcfa || ""}
                        onChange={(e) => updateField("customPumpPriceFcfa", e.target.value ? Number(e.target.value) : undefined)}
                        className="h-7 text-xs font-mono mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* C. Tuyauterie & Distribution */}
                <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Workflow className="h-3.5 w-3.5 text-emerald-600" />
                      C. Tuyauterie, Conduites & Goutteurs
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Matériau & Ø</span>
                  </div>

                  <div>
                    <Label className="text-[11px] text-foreground">Matériau de canalisation</Label>
                    <Select
                      value={form.pipeMaterial || "pehd_pn10"}
                      onValueChange={(v: IrrisPipeMaterial) => updateField("pipeMaterial", v)}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1 bg-background">
                        <SelectValue placeholder="Matériau" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(IRRIS_PIPE_MATERIALS).map((m) => (
                          <SelectItem key={m.key} value={m.key}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-foreground">Diamètre Ø (mm)</Label>
                      <Select
                        value={String(form.customPipeDiameterMm || 50)}
                        onValueChange={(v) => updateField("customPipeDiameterMm", Number(v))}
                      >
                        <SelectTrigger className="h-7 text-xs mt-0.5 bg-background font-mono">
                          <SelectValue placeholder="Diamètre" />
                        </SelectTrigger>
                        <SelectContent>
                          {[32, 40, 50, 63, 75, 90, 110].map((d) => (
                            <SelectItem key={d} value={String(d)}>
                              Ø {d} mm (DN{d})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[11px] text-foreground">Espacement Goutteurs</Label>
                      <Select
                        value={String(form.customDripperSpacingM || 0.3)}
                        onValueChange={(v) => updateField("customDripperSpacingM", Number(v))}
                      >
                        <SelectTrigger className="h-7 text-xs mt-0.5 bg-background font-mono">
                          <SelectValue placeholder="Espacement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.2">20 cm (Planches intensives)</SelectItem>
                          <SelectItem value="0.3">30 cm (Standard maraîcher)</SelectItem>
                          <SelectItem value="0.4">40 cm (Sol argileux)</SelectItem>
                          <SelectItem value="0.5">50 cm (Sol filtrant / arbres)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] text-foreground">Prix du mètre de tuyau (FCFA/ml)</Label>
                    <Input
                      type="number"
                      placeholder="Prix automatique au mètre"
                      value={form.customPipePricePerMeterFcfa || ""}
                      onChange={(e) => updateField("customPipePricePerMeterFcfa", e.target.value ? Number(e.target.value) : undefined)}
                      className="h-7 text-xs font-mono mt-0.5"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Colonne Droite : Tableau de Bord des Résultats IRRIS & Bordereau Marketplace Interactif (7 colonnes) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Alerte Viabilité Source d'Eau */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              result.isSourceViable
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
            }`}
          >
            {result.isSourceViable ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="font-bold">
                {result.isSourceViable ? "Viabilité Hydraulique Certifiée IRRIS" : "Attention : Débit Forage Limitant"}
              </span>
              <p className="leading-relaxed text-[11px] opacity-90">{result.sourceViabilityMessage}</p>
            </div>
          </div>

          {/* Grille des 4 Métriques Clés avec impact instantané des personnalisations */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border border-sky-500/30 bg-sky-500/5 p-3 space-y-1">
              <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider block">
                Volume Journalier
              </span>
              <p className="text-xl font-heading font-black text-foreground">
                {result.dailyGrossWaterVolumeM3} <span className="text-xs font-normal text-muted-foreground">m³/jour</span>
              </p>
              <p className="text-[10px] text-muted-foreground">Efficience : {result.irrigationEfficiencyPct}%</p>
            </Card>

            <Card className="border border-blue-500/30 bg-blue-500/5 p-3 space-y-1">
              <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider block">
                Débit Pompe Requis
              </span>
              <p className="text-xl font-heading font-black text-foreground">
                {result.requiredPumpFlowM3h} <span className="text-xs font-normal text-muted-foreground">m³/h</span>
              </p>
              <p className="text-[10px] text-muted-foreground">Base 5.5 h soleil utile</p>
            </Card>

            <Card className="border border-purple-500/30 bg-purple-500/5 p-3 space-y-1">
              <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider block">
                HMT Totale
              </span>
              <p className="text-xl font-heading font-black text-foreground">
                {result.totalHeadHmtM} <span className="text-xs font-normal text-muted-foreground">mCE</span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Ø{result.effectivePipeDiameterMm}mm • Pertes {result.frictionLossM}m
              </p>
            </Card>

            <Card className="border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                {result.isSolarPowered ? "Puissance Solaire" : "Puissance Moteur"}
              </span>
              <p className="text-xl font-heading font-black text-foreground">
                {result.isSolarPowered ? (
                  <>
                    {result.solarPvWattPeak} <span className="text-xs font-normal text-muted-foreground">Wc</span>
                  </>
                ) : (
                  <>
                    {result.motorPowerKw} <span className="text-xs font-normal text-muted-foreground">kW</span>
                  </>
                )}
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold truncate">
                {result.isSolarPowered
                  ? `${result.pvPanelsCount} panneaux ${result.panelUnitWp}W`
                  : result.energySourceLabel}
              </p>
            </Card>
          </div>

          {/* Synthèse du Système Validé par l'Expert */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="py-2.5 px-4 bg-muted/30 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Configuration Technique Retenue
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-mono border-sky-500 text-sky-700 dark:text-sky-300">
                    {result.energySourceLabel}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500 text-emerald-700 dark:text-emerald-300">
                    {result.pipeMaterialLabel.split(" ")[0]} Ø{result.effectivePipeDiameterMm}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3.5 space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-card border border-border/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Pompe & Motorisation</span>
                  <p className="font-bold text-xs text-foreground">{result.recommendedPumpModel}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Puissance moteur : <strong>{result.motorPowerKw} kW</strong>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Régulation & Pilotage</span>
                  <p className="font-bold text-xs text-foreground">{result.recommendedController}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Conforme aux contraintes de la source d'énergie
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bordereau Quantitatif & Devis Marketplace Interactif (Édition Totale par l'Expert) */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/60">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-600" />
                    Bordereau & Prix Marketplace Interactifs (Chiffreur Expert)
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    L'expert peut modifier les prix unitaires, quantités et fournisseurs selon l'offre du marketplace.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-sm text-emerald-700 dark:text-emerald-300">
                    Total : {result.totalCostFcfa.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border/60 text-[10px] uppercase font-bold text-muted-foreground">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[200px]">Désignation & Fournisseur du Marché</th>
                      <th className="py-2.5 px-2 text-center w-20">Qté</th>
                      <th className="py-2.5 px-2 text-right min-w-[110px]">Prix Unit. (FCFA)</th>
                      <th className="py-2.5 px-3 text-right min-w-[110px]">Total (FCFA)</th>
                      <th className="py-2.5 px-2 text-center w-10">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {result.billOfMaterials.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3">
                          <p className="font-semibold text-foreground">{item.designation}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{item.specifications}</p>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-background border-border text-foreground font-medium">
                              <Store className="h-2.5 w-2.5 mr-1 text-emerald-600" />
                              {item.supplierName || MARKETPLACE_SUPPLIERS[0]}
                            </Badge>
                            {item.isCustomized && (
                              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] py-0 px-1">
                                Modifié
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Quantité éditable */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateBomItem(idx, "quantity", Number(e.target.value) || 1)}
                              className="h-7 w-16 text-center text-xs font-mono p-1 bg-background"
                            />
                            <span className="text-[10px] text-muted-foreground">{item.unit}</span>
                          </div>
                        </td>

                        {/* Prix unitaire éditable */}
                        <td className="py-2 px-2 text-right">
                          <Input
                            type="number"
                            step={100}
                            value={item.unitPriceFcfa}
                            onChange={(e) => handleUpdateBomItem(idx, "unitPriceFcfa", Number(e.target.value) || 0)}
                            className="h-7 w-24 text-right text-xs font-mono p-1 ml-auto bg-background"
                          />
                        </td>

                        {/* Total de la ligne recalculé */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                          {item.totalPriceFcfa.toLocaleString("fr-FR")} F
                        </td>

                        {/* Suppression de la ligne */}
                        <td className="py-2 px-2 text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteBomItem(idx)}
                            className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-md"
                            title="Supprimer cet équipement"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Formulaire d'ajout rapide d'équipement sur-mesure */}
              <div className="p-3 bg-muted/20 border-t border-border/60 space-y-3">
                {!isAddingNewItem ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-muted-foreground">Ajouts rapides terrain :</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyQuickItemTemplate("Tête de filtration à disques 2\"", "Filtration 120 mesh avec manomètres de pression différentielle", 145000, "kit")}
                        className="h-6 text-[10px] px-2 rounded-full"
                      >
                        + Filtre disques 2"
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyQuickItemTemplate("Injecteur Venturi 2\" pour fertigation", "Kit complet avec vanne doseuse et tuyau d'aspiration", 45000, "kit")}
                        className="h-6 text-[10px] px-2 rounded-full"
                      >
                        + Injecteur Venturi
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyQuickItemTemplate("Citerne souple tampon 10 m³", "Réservoir bâche PVC armée traitée anti-UV 900g/m²", 480000, "u")}
                        className="h-6 text-[10px] px-2 rounded-full"
                      >
                        + Citerne 10 m³
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyQuickItemTemplate("Clôture de protection forage & champ solaire", "Grillage galvanisé hauteur 1.80m avec portillon cadenassé", 220000, "forfait")}
                        className="h-6 text-[10px] px-2 rounded-full"
                      >
                        + Clôture sécurité
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingNewItem(true)}
                      className="h-7 text-xs border-dashed border-emerald-600/50 text-emerald-700 dark:text-emerald-300 gap-1 rounded-lg"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Ajouter un article libre</span>
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5 text-emerald-600" />
                        Nouvel équipement sur-mesure (Marketplace)
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingNewItem(false)}
                        className="h-6 text-[11px] text-muted-foreground"
                      >
                        Annuler
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <Label className="text-[11px]">Désignation de l'article *</Label>
                        <Input
                          placeholder="Ex: Électrovanne 24V programmable"
                          value={newItem.designation}
                          onChange={(e) => setNewItem({ ...newItem, designation: e.target.value })}
                          className="h-7 text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Fournisseur du Marché</Label>
                        <Select
                          value={newItem.supplierName}
                          onValueChange={(v) => setNewItem({ ...newItem, supplierName: v })}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5">
                            <SelectValue placeholder="Fournisseur" />
                          </SelectTrigger>
                          <SelectContent>
                            {MARKETPLACE_SUPPLIERS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <Label className="text-[11px]">Quantité</Label>
                        <Input
                          type="number"
                          min={1}
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) || 1 })}
                          className="h-7 text-xs font-mono mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Unité</Label>
                        <Select
                          value={newItem.unit}
                          onValueChange={(v: QuoteItem["unit"]) => setNewItem({ ...newItem, unit: v })}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="u">Unité (u)</SelectItem>
                            <SelectItem value="m">Mètre (m)</SelectItem>
                            <SelectItem value="ml">Mètre linéaire (ml)</SelectItem>
                            <SelectItem value="kit">Kit complet</SelectItem>
                            <SelectItem value="forfait">Forfait</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px]">Prix unitaire (FCFA)</Label>
                        <Input
                          type="number"
                          step={500}
                          value={newItem.unitPriceFcfa}
                          onChange={(e) => setNewItem({ ...newItem, unitPriceFcfa: Number(e.target.value) || 0 })}
                          className="h-7 text-xs font-mono mt-0.5"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={handleAddCustomItem}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-7 px-3 rounded-lg"
                      >
                        Enregistrer cet article au bordereau
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action direct vers Devis & Dossier PDF */}
                {onNavigateToQuote && (
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground">
                      Transférer directement ce dimensionnement personnalisé dans le devis officiel :
                    </p>
                    <Button
                      size="sm"
                      onClick={onNavigateToQuote}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-8 px-4 rounded-xl gap-1.5 shrink-0"
                    >
                      <span>Valider dans le Devis Express</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
