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
  RotateCcw
} from "lucide-react";
import {
  IrrisInput,
  IrrisResult,
  IRRIS_CROPS,
  IRRIS_SEASONS,
  IRRIS_METHODS,
  calculateIrrisModel,
  IrrisWaterSourceType,
  IrrisCropKey,
  IrrisSeason,
  IrrisMethod,
  IrrisPumpingMode,
} from "@/lib/irrisModelEngine";

interface IrrisModelStudioProps {
  onResultsCalculated?: (result: IrrisResult) => void;
  onNavigateToQuote?: () => void;
}

export const IrrisModelStudio: React.FC<IrrisModelStudioProps> = ({
  onResultsCalculated,
  onNavigateToQuote,
}) => {
  // Saisie par défaut adaptée au terrain sahélien (ex: 0.5 hectare de tomate sur forage de 25m)
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
  });

  const [result, setResult] = useState<IrrisResult>(() => calculateIrrisModel(form));

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
    toast.success("Dimensionnement Modèle IRRIS calculé avec succès !");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bannière Titre Modèle IRRIS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-950 via-blue-900 to-slate-900 text-white border border-sky-800/40 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
              <Droplets className="h-4 w-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-heading font-black tracking-tight">
              Modèle IRRIS — Conception & Dimensionnement Solaire
            </h2>
            <Badge className="bg-sky-500/30 text-sky-200 border-sky-400/30 text-[10px] px-2 py-0.5">
              Standard Practica / IRRINN Sahel
            </Badge>
          </div>
          <p className="text-xs text-sky-100/80 max-w-2xl leading-relaxed">
            Outil de dimensionnement express adapté à l'Afrique : calcul direct du volume journalier, de la HMT, de la puissance solaire crête et sélection de pompe.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
        {/* Colonne Gauche : Formulaire de Paramétrage IRRIS (5 colonnes) */}
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
                {/* Raccourcis parcelles courantes en Afrique */}
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

          {/* 3. Distribution & Pompage */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                3. Distribution & Pompage Solaire
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
        </div>

        {/* Colonne Droite : Tableau de Bord des Résultats IRRIS (7 colonnes) */}
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

          {/* Grille des 4 Métriques Clés */}
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
              <p className="text-[10px] text-muted-foreground">Géo {result.geometricHeadM}m + Pertes {result.frictionLossM}m</p>
            </Card>

            <Card className="border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                Puissance Solaire
              </span>
              <p className="text-xl font-heading font-black text-foreground">
                {result.solarPvWattPeak} <span className="text-xs font-normal text-muted-foreground">Wc</span>
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">{result.pvPanelsCount} panneaux {result.panelUnitWp}W</p>
            </Card>
          </div>

          {/* Spécifications du Système Recommandé IRRIS */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Configuration Matérielle Recommandée IRRIS
                </span>
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-500 text-emerald-700">
                  Prêt pour le Terrain
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-card border border-border/80 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Pompe Solaire Immergée</span>
                  <p className="font-bold text-sm text-foreground">{result.recommendedPumpModel}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Puissance moteur recommandée : <strong>{result.motorPowerKw} kW</strong>
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border/80 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Contrôleur & Variateur MPPT</span>
                  <p className="font-bold text-sm text-foreground">{result.recommendedController}</p>
                  <p className="text-[11px] text-muted-foreground">Régulation automatique selon ensoleillement</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-card border border-border/80 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Champ Photovoltaïque</span>
                  <p className="font-bold text-sm text-foreground">
                    {result.pvPanelsCount} Panneaux Monocristallins ({result.solarPvWattPeak} Wc au total)
                  </p>
                  <p className="text-[11px] text-muted-foreground">Orientation recommandée : Plein Sud, inclinaison 15°</p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border/80 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Capacité Réservoir Tampon</span>
                  <p className="font-bold text-sm text-foreground">
                    {result.recommendedTankVolumeM3} m³ (Château d'eau)
                  </p>
                  <p className="text-[11px] text-muted-foreground">Garantit 24h d'autonomie pour la parcelle</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bordereau Quantitatif Estimatif en FCFA */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-600" />
                  Bordereau Quantitatif Estimatif (Mercuriale FCFA)
                </CardTitle>
                <span className="font-heading font-black text-sm text-emerald-700 dark:text-emerald-300">
                  Total : {result.totalCostFcfa.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border/60 text-[10px] uppercase font-bold text-muted-foreground">
                    <tr>
                      <th className="py-2 px-3">Désignation</th>
                      <th className="py-2 px-2 text-center">Qté</th>
                      <th className="py-2 px-2 text-right">Prix Unitaire</th>
                      <th className="py-2 px-3 text-right">Montant Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {result.billOfMaterials.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3">
                          <p className="font-semibold text-foreground">{item.designation}</p>
                          <p className="text-[10px] text-muted-foreground">{item.specifications}</p>
                        </td>
                        <td className="py-2 px-2 text-center font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {item.unitPriceFcfa.toLocaleString("fr-FR")} F
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                          {item.totalPriceFcfa.toLocaleString("fr-FR")} F
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action direct vers Devis & Dossier PDF */}
              {onNavigateToQuote && (
                <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    Transférer directement ce dimensionnement dans le devis officiel :
                  </p>
                  <Button
                    size="sm"
                    onClick={onNavigateToQuote}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-8 px-4 rounded-xl gap-1.5"
                  >
                    <span>Valider dans le Devis Express</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
