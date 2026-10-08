/**
 * NAFA FIELD DESIGNER — CONCEPTEUR D'IRRIGATION
 * Dimensionnement hydraulique : goutte-à-goutte, aspersion, micro-aspersion, pivot, gravitaire.
 * Conduites PEHD, pompage solaire, découpage en secteurs et filtration.
 */

import React, { useState } from "react";
import {
  IrrigationSystemType,
  WaterSourceType,
  PumpType,
  IrrigationProject,
  Field,
} from "@/types/fieldDesigner";
import { computeIrrigationDesign } from "@/lib/fieldIrrigationDesignerEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, Save, Cpu, ShieldCheck, AlertCircle, Wrench, Layers } from "lucide-react";
import { toast } from "sonner";

interface IrrigationDesignerToolProps {
  onSaveProject: (project: IrrigationProject) => void;
  fields: Field[];
  activeFarmId: string;
}

export const IrrigationDesignerTool: React.FC<IrrigationDesignerToolProps> = ({
  onSaveProject,
  fields,
  activeFarmId,
}) => {
  const [systemType, setSystemType] = useState<IrrigationSystemType>("goutte_a_goutte");
  const [waterSource, setWaterSource] = useState<WaterSourceType>("forage");
  const [pumpType, setPumpType] = useState<PumpType>("solaire_fil_du_soleil");
  const [dynamicDepthM, setDynamicDepthM] = useState<number>(35);
  const [sourceFlowM3h, setSourceFlowM3h] = useState<number>(6.0);
  const [areaHa, setAreaHa] = useState<number>(fields[0]?.areaHa || 1.0);
  const [selectedFieldId, setSelectedFieldId] = useState<string>(fields[0]?.id || "");

  // Calcul du réseau
  const result = computeIrrigationDesign({
    areaHa,
    systemType,
    waterSource,
    dynamicWaterDepthM: dynamicDepthM,
    sourceFlowM3h,
    pumpType,
    cropKey: "maraichage",
  });

  // États éditables par l'expert
  const [mainPipeDiam, setMainPipeDiam] = useState<number>(result.mainPipeDiameterMm);
  const [customSectors, setCustomSectors] = useState<number>(result.numSectors);
  const [pumpPower, setPumpPower] = useState<number>(result.pumpPowerKw);

  const handleSave = () => {
    const project: IrrigationProject = {
      id: `irrig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      farmId: activeFarmId,
      fieldId: selectedFieldId || undefined,
      systemType,
      waterSource,
      dynamicWaterDepthM: dynamicDepthM,
      sourceFlowM3h,
      pumpType,
      pumpPowerKw: pumpPower,
      tankHeightM: result.tankHeightM,
      tankVolumeM3: result.tankVolumeM3,
      mainPipeLengthM: result.mainPipeLengthM,
      mainPipeDiameterMm: mainPipeDiam,
      subPipeLengthM: result.subPipeLengthM,
      subPipeDiameterMm: result.subPipeDiameterMm,
      lateralLengthM: result.lateralLengthM,
      lateralSpacingM: result.lateralSpacingM,
      emitterSpacingM: result.emitterSpacingM,
      emitterFlowLh: result.emitterFlowLh,
      totalEmittersCount: result.totalEmittersCount,
      totalFlowRateM3h: result.totalFlowRateM3h,
      numSectors: customSectors,
      dailyIrrigationHours: result.dailyIrrigationHours,
      isTechnicalEstimate: true,
      notes: result.technicalSummary,
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveProject(project);
    toast.success("Réseau d'irrigation enregistré avec succès.");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="rounded-3xl border-2 border-primary/20 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                <Droplets className="h-6 w-6 text-sky-600" />
                Concepteur de Système d'Irrigation
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dimensionnement hydraulique conforme aux normes CIRAD / IRRINN & FAO-56.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-bold text-sky-600 border-sky-600/30">
              Hydraulique & Solaire
            </Badge>
          </div>

          {/* ── AVERTISSEMENT ESTIMATION TECHNIQUE OBLIGATOIRE ── */}
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-start gap-3 text-xs">
            <AlertCircle className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-sky-950 dark:text-sky-200">
                Estimation technique certifiée terrain
              </span>
              <p className="text-sky-800/90 dark:text-sky-300 text-[11px] leading-relaxed">
                Les valeurs hydrauliques calculées sont des estimations techniques rigoureuses. Vous avez toute liberté pour ajuster les diamètres, la pompe et la sectorisation selon l'offre du marché local.
              </p>
            </div>
          </div>

          {/* ── PARAMÈTRES D'ENTRÉE HYDRAULIQUE ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-bold">Technologie d'irrigation</Label>
              <Select value={systemType} onValueChange={(v: IrrigationSystemType) => setSystemType(v)}>
                <SelectTrigger className="h-11 rounded-xl text-xs font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goutte_a_goutte">Goutte-à-goutte régulé</SelectItem>
                  <SelectItem value="aspersion">Aspersion basse ou moyenne pression</SelectItem>
                  <SelectItem value="micro_aspersion">Micro-aspersion sous frondaison</SelectItem>
                  <SelectItem value="pivot">Pivot d'irrigation circulaire</SelectItem>
                  <SelectItem value="gravitaire">Réseau gravitaire californien</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Source d'eau</Label>
              <Select value={waterSource} onValueChange={(v: WaterSourceType) => setWaterSource(v)}>
                <SelectTrigger className="h-11 rounded-xl text-xs font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forage">Forage profond</SelectItem>
                  <SelectItem value="puits">Puits maraîcher grand diamètre</SelectItem>
                  <SelectItem value="cours_deau">Cours d'eau • Fleuve</SelectItem>
                  <SelectItem value="barrage">Barrage • Retenue d'eau</SelectItem>
                  <SelectItem value="reseau">Réseau d'adduction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Mode de pompage</Label>
              <Select value={pumpType} onValueChange={(v: PumpType) => setPumpType(v)}>
                <SelectTrigger className="h-11 rounded-xl text-xs font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solaire_fil_du_soleil">Solaire au fil du soleil (MPPT)</SelectItem>
                  <SelectItem value="solaire_batteries">Solaire avec stockage batteries</SelectItem>
                  <SelectItem value="electrique_reseau">Électrique Réseau SONABEL</SelectItem>
                  <SelectItem value="motopompe_diesel">Motopompe Diesel</SelectItem>
                  <SelectItem value="motopompe_essence">Motopompe Essence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-bold">Superficie à irriguer (ha)</Label>
              <Input
                type="number"
                step="0.1"
                value={areaHa}
                onChange={(e) => setAreaHa(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="h-11 rounded-xl text-xs font-mono font-bold mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Profondeur dynamique eau (m)</Label>
              <Input
                type="number"
                value={dynamicDepthM}
                onChange={(e) => setDynamicDepthM(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-11 rounded-xl text-xs font-mono font-bold mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Débit disponible de la source (m³.h)</Label>
              <Input
                type="number"
                step="0.5"
                value={sourceFlowM3h}
                onChange={(e) => setSourceFlowM3h(Math.max(1, parseFloat(e.target.value) || 1))}
                className="h-11 rounded-xl text-xs font-mono font-bold mt-1"
              />
            </div>
          </div>

          {/* ── RÉSULTATS DU DIMENSIONNEMENT HYDRAULIQUE (ÉDITABLES) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-card border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Tuyau PEHD Principal</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-bold">Ø</span>
                <Input
                  type="number"
                  value={mainPipeDiam}
                  onChange={(e) => setMainPipeDiam(parseInt(e.target.value) || 32)}
                  className="h-8 font-mono font-black text-base p-1 border-0 shadow-none w-16"
                />
                <span className="text-xs font-mono">mm</span>
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1">
                Longueur : {result.mainPipeLengthM} m
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Sectorisation</span>
              <Input
                type="number"
                value={customSectors}
                onChange={(e) => setCustomSectors(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-8 font-mono font-black text-base p-1 border-0 shadow-none text-sky-600 mt-1"
              />
              <span className="text-[10px] text-muted-foreground block mt-1">
                Secteurs recommandés
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Puissance Pompe</span>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number"
                  step="0.1"
                  value={pumpPower}
                  onChange={(e) => setPumpPower(parseFloat(e.target.value) || 0.5)}
                  className="h-8 font-mono font-black text-base p-1 border-0 shadow-none w-16"
                />
                <span className="text-xs font-mono">kW</span>
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1">
                Env. {(pumpPower * 1.34).toFixed(1)} HP
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Réservoir • Château d'eau</span>
              <div className="h-8 font-mono font-black text-base flex items-center text-primary mt-1">
                {result.tankVolumeM3} m³
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1">
                Hauteur : {result.tankHeightM} m
              </span>
            </div>
          </div>

          {/* ── DÉTAILS TECHNIQUES COMPLÉMENTAIRES ── */}
          <div className="p-4 rounded-2xl bg-muted/40 border space-y-2 text-xs">
            <span className="font-bold text-foreground block">Spécifications des rampes et émetteurs :</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted-foreground">
              <div>Longueur totale des rampes : <strong>{result.lateralLengthM.toLocaleString()} m</strong></div>
              <div>Nombre d'émetteurs : <strong>{result.totalEmittersCount.toLocaleString()}</strong></div>
              <div>Temps journalier par secteur : <strong>{result.dailyIrrigationHours} h</strong></div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full h-13 rounded-2xl font-black text-sm bg-sky-600 hover:bg-sky-700 text-white gap-2"
          >
            <Save className="h-5 w-5" />
            Enregistrer la Conception Hydraulique
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
