/**
 * NAFA FIELD DESIGNER — PANNEAU D'INGÉNIERIE HYDRAULIQUE DÉTERMINISTE
 * Connecté au moteur physique strict Hazen-Williams & Christiansen.
 * Aucun mock en production : calculs reproductibles en temps réel avec persistance IndexedDB.
 */

import React, { useState } from "react";
import { Field } from "@/types/fieldDesigner";
import { useHydraulicAnalysis } from "@/hooks/useHydraulicAnalysis";
import { PipeMaterial, BAR_TO_MCE, MCE_TO_BAR } from "@/utils/hydraulics/engine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
  Gauge,
  Activity,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RotateCcw,
  Waves,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Info,
} from "lucide-react";

export interface HydraulicPanelProps {
  field?: Field | null;
  onAnalysisChange?: (analysisResult: ReturnType<typeof useHydraulicAnalysis>) => void;
  className?: string;
}

export const HydraulicPanel: React.FC<HydraulicPanelProps> = ({
  field,
  onAnalysisChange,
  className = "",
}) => {
  const analysis = useHydraulicAnalysis({ field });
  const {
    input,
    result,
    missingFields,
    warnings,
    isComplete,
    isLoading,
    updateField,
    resetToDefaults,
  } = analysis;

  // Unité d'affichage pour la pression statique d'entrée (Bar ou mCE)
  const [pressureUnit, setPressureUnit] = useState<"bar" | "mce">("bar");

  // Notifie le parent si callback fourni
  React.useEffect(() => {
    if (onAnalysisChange) {
      onAnalysisChange(analysis);
    }
  }, [analysis, onAnalysisChange]);

  // Gestion sécurisée de la saisie numérique (interdit négatifs et NaN)
  const handleNumericInput = (
    key: "flowRate" | "length" | "internalDiameter" | "outletsCount" | "requiredPressure",
    rawVal: string
  ) => {
    if (rawVal === "") {
      updateField(key, 0 as any);
      return;
    }
    const parsed = parseFloat(rawVal);
    if (!Number.isNaN(parsed)) {
      updateField(key, Math.max(0, parsed) as any);
    }
  };

  // Gestion de la pression statique avec conversion d'unité
  const handleStaticPressureInput = (rawVal: string) => {
    if (rawVal === "") {
      updateField("staticPressure", 0);
      return;
    }
    const parsed = parseFloat(rawVal);
    if (!Number.isNaN(parsed)) {
      const valInBar = pressureUnit === "mce" ? parsed * MCE_TO_BAR : parsed;
      updateField("staticPressure", Math.max(0, valInBar));
    }
  };

  // Gestion du dénivelé (peut être négatif si descente)
  const handleElevationInput = (rawVal: string) => {
    if (rawVal === "" || rawVal === "-") {
      updateField("elevationDifference", 0);
      return;
    }
    const parsed = parseFloat(rawVal);
    if (!Number.isNaN(parsed)) {
      updateField("elevationDifference", parsed);
    }
  };

  const displayedStaticPressure =
    input.staticPressure !== undefined
      ? pressureUnit === "mce"
        ? Math.round(input.staticPressure * BAR_TO_MCE * 10) / 10
        : Math.round(input.staticPressure * 100) / 100
      : 0;

  return (
    <div className={`space-y-6 max-w-5xl mx-auto ${className}`}>
      {/* ── EN-TÊTE PRINCIPAL ── */}
      <Card className="rounded-3xl border-2 border-primary/20 shadow-sm overflow-hidden bg-gradient-to-b from-background to-muted/20">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-primary/10 text-primary">
                  <Waves className="h-5 w-5" />
                </span>
                <CardTitle className="text-xl sm:text-2xl font-black tracking-tight">
                  Calculateur &amp; Bilan Hydraulique (Hazen-Williams)
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Moteur déterministe d'ingénierie physique : pertes linéaires, singulières, facteur de Christiansen et point critique.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl gap-1.5 ${
                  isComplete
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                }`}
              >
                {isComplete ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Calcul Actif (Temps Réel)
                  </>
                ) : (
                  <>
                    <Info className="h-3.5 w-3.5 text-amber-600" />
                    Dimensionnement incomplet
                  </>
                )}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                className="h-8 text-xs font-semibold gap-1 rounded-xl"
                title="Rétablir les paramètres standards"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* ── ALERTE ROUGE : PRESSION INSUFFISANTE AU POINT CRITIQUE ── */}
          {result && !result.isPressureAdequate && (
            <div className="p-4 rounded-2xl bg-destructive/10 border-2 border-destructive/30 flex items-start gap-3 animate-in fade-in">
              <AlertOctagon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-black text-destructive uppercase tracking-wide">
                  Alerte Rouge : Pression résiduelle critique insuffisante
                </h4>
                <p className="text-destructive/90 font-medium">
                  La pression calculée au bout de ligne ({result.residualPressureBar.toFixed(2)} Bar) est inférieure à la pression nominale requise ({result.requiredPressureBar.toFixed(2)} Bar). Risque de sous-débit ou d'extinction des distributeurs.
                </p>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Recommandation : Augmentez le diamètre intérieur de la conduite (actuellement {input.internalDiameter} mm), réduisez le débit par secteur ou renforcez la pression source.
                </p>
              </div>
            </div>
          )}

          {/* ── BANDEAU STATUT INCOMPLET ── */}
          {!isComplete && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  Dimensionnement incomplet
                </span>
                <p className="text-amber-800 dark:text-amber-300">
                  Veuillez renseigner toutes les variables d'ingénierie obligatoires pour lancer la résolution du réseau :
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {missingFields.map((fieldKey) => (
                    <Badge key={fieldKey} variant="outline" className="bg-background text-amber-900 dark:text-amber-200 font-bold text-[10px]">
                      {fieldKey}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION ENTRÉES TECHNIQUES ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Gauge className="h-4 w-4 text-primary" />
                1. Variables d'Entrée &amp; Hydraulique Source
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Toutes les unités sont précisées
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Débit source */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Débit source circulant (m³/h) *
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={input.flowRate !== undefined && !Number.isNaN(input.flowRate) ? input.flowRate : ""}
                    onChange={(e) => handleNumericInput("flowRate", e.target.value)}
                    placeholder="Ex: 6.0"
                    className="h-10 text-xs font-mono font-bold rounded-xl pr-14"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-muted-foreground pointer-events-none">
                    m³/h
                  </span>
                </div>
              </div>

              {/* Pression statique source */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">
                    Pression statique source *
                  </Label>
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPressureUnit("bar")}
                      className={`px-1.5 py-0.5 rounded ${pressureUnit === "bar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      Bar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPressureUnit("mce")}
                      className={`px-1.5 py-0.5 rounded ${pressureUnit === "mce" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      mCE
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={displayedStaticPressure || ""}
                    onChange={(e) => handleStaticPressureInput(e.target.value)}
                    placeholder={pressureUnit === "bar" ? "Ex: 2.5" : "Ex: 25.5"}
                    className="h-10 text-xs font-mono font-bold rounded-xl pr-14"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-muted-foreground pointer-events-none">
                    {pressureUnit === "bar" ? "Bar" : "mCE"}
                  </span>
                </div>
              </div>

              {/* Longueur de conduite */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Longueur de conduite L (m) *
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={input.length !== undefined && !Number.isNaN(input.length) ? input.length : ""}
                    onChange={(e) => handleNumericInput("length", e.target.value)}
                    placeholder="Ex: 100"
                    className="h-10 text-xs font-mono font-bold rounded-xl pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-muted-foreground pointer-events-none">
                    m
                  </span>
                </div>
              </div>

              {/* Diamètre intérieur */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Diamètre intérieur utile D (mm) *
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="5"
                    step="1"
                    value={input.internalDiameter !== undefined && !Number.isNaN(input.internalDiameter) ? input.internalDiameter : ""}
                    onChange={(e) => handleNumericInput("internalDiameter", e.target.value)}
                    placeholder="Ex: 50"
                    className="h-10 text-xs font-mono font-bold rounded-xl pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-muted-foreground pointer-events-none">
                    mm
                  </span>
                </div>
              </div>

              {/* Type de matériau */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Matériau &amp; Rugosité Hazen-Williams *
                </Label>
                <Select
                  value={input.material || "PEHD"}
                  onValueChange={(val: PipeMaterial) => updateField("material", val)}
                >
                  <SelectTrigger className="h-10 text-xs font-semibold rounded-xl">
                    <SelectValue placeholder="Sélectionner le matériau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEHD">PEHD (Rugosité C = 140)</SelectItem>
                    <SelectItem value="PVC">PVC Lisse (Rugosité C = 150)</SelectItem>
                    <SelectItem value="Acier">Acier Galvanisé (Rugosité C = 100)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dénivelé topographique */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">
                    Dénivelé topographique Δh (m) *
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    + Montée / - Descente
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    value={input.elevationDifference !== undefined && !Number.isNaN(input.elevationDifference) ? input.elevationDifference : 0}
                    onChange={(e) => handleElevationInput(e.target.value)}
                    placeholder="0"
                    className="h-10 text-xs font-mono font-bold rounded-xl pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-muted-foreground pointer-events-none">
                    m
                  </span>
                </div>
              </div>

              {/* Nombre de sorties (Facteur F de Christiansen) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Nombre de sorties équidistantes N *
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={input.outletsCount !== undefined && !Number.isNaN(input.outletsCount) ? input.outletsCount : ""}
                    onChange={(e) => handleNumericInput("outletsCount", e.target.value)}
                    placeholder="1 pour conduite simple, >1 pour rampe"
                    className="h-10 text-xs font-mono font-bold rounded-xl pr-16"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-muted-foreground pointer-events-none">
                    sorties
                  </span>
                </div>
              </div>

              {/* Pression minimale requise */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Pression minimale requise émetteur (Bar)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={input.requiredPressure !== undefined && !Number.isNaN(input.requiredPressure) ? input.requiredPressure : 1.0}
                    onChange={(e) => handleNumericInput("requiredPressure", e.target.value)}
                    placeholder="1.0"
                    className="h-10 text-xs font-mono font-bold rounded-xl pr-14"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-muted-foreground pointer-events-none">
                    Bar
                  </span>
                </div>
              </div>

              {/* Info persistance IndexedDB */}
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center gap-2 text-xs text-muted-foreground self-end h-10">
                <Database className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-medium truncate">
                  Sauvegarde automatique locale IndexedDB active
                </span>
              </div>
            </div>
          </div>

          {/* ── SECTION RÉSULTATS & BILAN ÉNERGÉTIQUE ── */}
          {result && (
            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  2. Bilan Énergétique &amp; Résolution au Point Critique
                </h3>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  Facteur Christiansen F = {result.christiansenFactor}
                </span>
              </div>

              {/* Grille principale des indicateurs clés */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Vitesse d'écoulement */}
                <Card className="rounded-2xl border bg-card p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-bold">Vitesse fluide (v)</span>
                    <Zap className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="text-xl font-mono font-black text-foreground">
                    {result.velocity.toFixed(2)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">m/s</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Plage optimale : 0.5 – 2.0 m/s
                  </div>
                </Card>

                {/* 2. Pertes de charge linéaires */}
                <Card className="rounded-2xl border bg-card p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-bold">Pertes Linéaires (hf)</span>
                    <Droplets className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="text-xl font-mono font-black text-foreground">
                    {result.linearFrictionLossBar.toFixed(2)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">Bar</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    Soit {result.linearFrictionLossMce.toFixed(2)} mCE
                  </div>
                </Card>

                {/* 3. Pertes singulières + Altitude */}
                <Card className="rounded-2xl border bg-card p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-bold">Singulières &amp; Dénivelé</span>
                    {result.elevationHeadMce >= 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </div>
                  <div className="text-xl font-mono font-black text-foreground">
                    {(result.singularLossBar + result.elevationHeadBar).toFixed(2)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">Bar</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Singulières: {result.singularLossBar.toFixed(2)} Bar | Topo: {result.elevationHeadBar.toFixed(2)} Bar
                  </div>
                </Card>

                {/* 4. Pression résiduelle au point critique */}
                <Card
                  className={`rounded-2xl border-2 p-3.5 space-y-1 ${
                    result.isPressureAdequate
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-destructive/40 bg-destructive/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider">
                      Pression Résiduelle
                    </span>
                    <Gauge className={`h-3.5 w-3.5 ${result.isPressureAdequate ? "text-emerald-600" : "text-destructive"}`} />
                  </div>
                  <div className={`text-2xl font-mono font-black ${result.isPressureAdequate ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    {result.residualPressureBar.toFixed(2)}{" "}
                    <span className="text-xs font-normal">Bar</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    Requis : {result.requiredPressureBar.toFixed(2)} Bar ({result.residualPressureMce.toFixed(1)} mCE)
                  </div>
                </Card>
              </div>

              {/* Tableau récapitulatif détaillé des charges */}
              <div className="rounded-2xl border overflow-hidden bg-card text-xs">
                <div className="bg-muted/60 p-2.5 font-bold grid grid-cols-12 gap-2 text-foreground">
                  <span className="col-span-5">Composante Hydraulique</span>
                  <span className="col-span-3 text-right">Valeur en mCE</span>
                  <span className="col-span-4 text-right">Équivalent en Bar</span>
                </div>
                <div className="divide-y divide-border/60 text-[11px] font-mono">
                  <div className="p-2.5 grid grid-cols-12 gap-2">
                    <span className="col-span-5 font-medium font-sans">Pression statique initiale disponible</span>
                    <span className="col-span-3 text-right text-foreground font-bold">{result.staticPressureMce.toFixed(2)} mCE</span>
                    <span className="col-span-4 text-right text-foreground font-bold">{input.staticPressure?.toFixed(2)} Bar</span>
                  </div>
                  <div className="p-2.5 grid grid-cols-12 gap-2 text-muted-foreground">
                    <span className="col-span-5 font-sans">Perte de charge linéaire Hazen-Williams (avec Christiansen)</span>
                    <span className="col-span-3 text-right text-destructive font-semibold">- {result.linearFrictionLossMce.toFixed(2)} mCE</span>
                    <span className="col-span-4 text-right text-destructive font-semibold">- {result.linearFrictionLossBar.toFixed(2)} Bar</span>
                  </div>
                  <div className="p-2.5 grid grid-cols-12 gap-2 text-muted-foreground">
                    <span className="col-span-5 font-sans">Pertes singulières estimées (coudes, tés, vannes 10%)</span>
                    <span className="col-span-3 text-right text-destructive font-semibold">- {result.singularLossMce.toFixed(2)} mCE</span>
                    <span className="col-span-4 text-right text-destructive font-semibold">- {result.singularLossBar.toFixed(2)} Bar</span>
                  </div>
                  <div className="p-2.5 grid grid-cols-12 gap-2 text-muted-foreground">
                    <span className="col-span-5 font-sans">Impact dénivelé géodésique ({input.elevationDifference && input.elevationDifference >= 0 ? "montée" : "descente"})</span>
                    <span className="col-span-3 text-right font-semibold">
                      {result.elevationHeadMce >= 0 ? `- ${result.elevationHeadMce.toFixed(2)}` : `+ ${Math.abs(result.elevationHeadMce).toFixed(2)}`} mCE
                    </span>
                    <span className="col-span-4 text-right font-semibold">
                      {result.elevationHeadBar >= 0 ? `- ${result.elevationHeadBar.toFixed(2)}` : `+ ${Math.abs(result.elevationHeadBar).toFixed(2)}`} Bar
                    </span>
                  </div>
                  <div className="p-2.5 grid grid-cols-12 gap-2 bg-muted/40 font-bold text-foreground">
                    <span className="col-span-5 font-sans uppercase">Pression finale au point le plus défavorisé</span>
                    <span className={`col-span-3 text-right ${result.isPressureAdequate ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      {result.residualPressureMce.toFixed(2)} mCE
                    </span>
                    <span className={`col-span-4 text-right ${result.isPressureAdequate ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      {result.residualPressureBar.toFixed(2)} Bar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── GESTION DES ALERTES & SÉCURITÉ ── */}
          {warnings.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Alertes &amp; Recommandations Physiques :
              </span>
              <div className="space-y-2">
                {warnings.map((warn, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      warn.level === "danger"
                        ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
                    }`}
                  >
                    {warn.level === "danger" ? (
                      <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <span className="font-semibold leading-relaxed">{warn.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HydraulicPanel;
