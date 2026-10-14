/**
 * NAFA QGIS STUDIO — MODALE D'ANALYSE SATELLITAIRE TYPE EOSDA CROP MONITORING
 * Intègre la constellation Sentinel-2 de l'ESA :
 * - Indices multispectraux (NDVI, NDWI, MSAVI, NDRE)
 * - Détection précoce du stress hydrique
 * - Cartes de zonage VRA pour la fertilisation de précision (INERA)
 * - Déclenchement de mission de scouting terrain géolocalisée
 */

import React, { useState } from "react";
import { Field, Farm } from "@/types/fieldDesigner";
import {
  analyzeFieldSatelliteData,
  CropMonitoringAnalysis,
} from "@/lib/eosdaCropMonitoringEngine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Satellite,
  Globe,
  Droplets,
  Sprout,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

interface QgisEosdaSatelliteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: Field | null;
  farm: Farm;
  onTriggerScoutingMission?: (analysis: CropMonitoringAnalysis) => void;
}

export const QgisEosdaSatelliteModal: React.FC<QgisEosdaSatelliteModalProps> = ({
  open,
  onOpenChange,
  field,
  farm,
  onTriggerScoutingMission,
}) => {
  if (!field) return null;

  const analysis: CropMonitoringAnalysis = analyzeFieldSatelliteData(
    field.id,
    field.name,
    field.areaHa || field.areaM2 / 10000,
    field.points,
    field.currentCrop || "maraichage"
  );

  const [activeTab, setActiveTab] = useState<"indices" | "vra" | "scouting">("indices");

  const handleLaunchScouting = () => {
    if (onTriggerScoutingMission) {
      onTriggerScoutingMission(analysis);
    }
    toast.success(`Mission de scouting terrain assignée pour la parcelle "${field.name}".`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
              <Satellite className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                EOSDA CROP MONITORING • SENTINEL-2
                <Badge className="bg-sky-500/15 text-sky-600 border-sky-500/30 text-[10px] py-0">
                  Télédétection ESA
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Analyse multispectrale et vigueur de biomasse • Parcelle :{" "}
                <strong className="text-foreground">{field.name}</strong> ({field.areaHa.toFixed(2)} ha)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── ONGLETS D'ANALYSE SATELITTAIRE ── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4 pt-2">
          <TabsList className="grid grid-cols-3 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="indices" className="text-xs font-bold gap-1.5 py-1.5">
              <Globe className="h-3.5 w-3.5" />
              <span>Indices Végétatifs</span>
            </TabsTrigger>
            <TabsTrigger value="vra" className="text-xs font-bold gap-1.5 py-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Zonage VRA (Engrais)</span>
            </TabsTrigger>
            <TabsTrigger value="scouting" className="text-xs font-bold gap-1.5 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span>Scouting Connecté</span>
            </TabsTrigger>
          </TabsList>

          {/* ── 1. ONGLET INDICES MULTISPECTRAUX ── */}
          <TabsContent value="indices" className="space-y-4">
            {/* Statut Global */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/20 via-sky-950/20 to-emerald-950/20 border border-emerald-500/30 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-extrabold text-sm text-foreground">
                    {analysis.vegetationStatus.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysis.vegetationStatus.description}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                Passage : {analysis.analysisDate}
              </Badge>
            </div>

            {/* 4 Jauges d'Indices Spécialisés */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* NDVI */}
              <div className="p-3 rounded-xl bg-card border border-border shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">NDVI</span>
                  <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px] py-0 px-1 font-mono">
                    {analysis.currentIndices.ndvi}
                  </Badge>
                </div>
                <Progress value={analysis.currentIndices.ndvi * 100} className="h-1.5 bg-muted" />
                <span className="text-[10px] text-muted-foreground block">
                  Vigueur de biomasse et photosynthèse
                </span>
              </div>

              {/* NDWI (Stress Hydrique) */}
              <div className="p-3 rounded-xl bg-card border border-border shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">NDWI</span>
                  <Badge className="bg-sky-500/15 text-sky-600 text-[10px] py-0 px-1 font-mono">
                    {analysis.currentIndices.ndwi}
                  </Badge>
                </div>
                <Progress value={analysis.currentIndices.ndwi * 100} className="h-1.5 bg-muted" />
                <span className="text-[10px] text-muted-foreground block">
                  Teneur en eau foliaire (Stress hydrique)
                </span>
              </div>

              {/* MSAVI (Sol Sahélien) */}
              <div className="p-3 rounded-xl bg-card border border-border shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">MSAVI</span>
                  <Badge className="bg-amber-500/15 text-amber-600 text-[10px] py-0 px-1 font-mono">
                    {analysis.currentIndices.msavi}
                  </Badge>
                </div>
                <Progress value={analysis.currentIndices.msavi * 100} className="h-1.5 bg-muted" />
                <span className="text-[10px] text-muted-foreground block">
                  Ajusté aux sols semi-arides sahéliens
                </span>
              </div>

              {/* NDRE (Chlorophylle active) */}
              <div className="p-3 rounded-xl bg-card border border-border shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">NDRE</span>
                  <Badge className="bg-purple-500/15 text-purple-600 text-[10px] py-0 px-1 font-mono">
                    {analysis.currentIndices.ndre}
                  </Badge>
                </div>
                <Progress value={analysis.currentIndices.ndre * 100} className="h-1.5 bg-muted" />
                <span className="text-[10px] text-muted-foreground block">
                  Teneur en azote et chlorophylle active
                </span>
              </div>
            </div>

            {/* Série Temporelle des 5 Passages Sentinel-2 */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                Dynamique Phénologique Temporelle (Constellation Sentinel-2)
              </span>
              <div className="border rounded-xl overflow-hidden divide-y text-xs">
                {analysis.timeSeries.map((pass, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between bg-card hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono font-bold text-foreground">{pass.date}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 text-muted-foreground">
                        {pass.satellite}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-[11px]">
                      <span>Nuages : {pass.cloudCoverPct}%</span>
                      <span>
                        NDVI : <strong className="text-emerald-600">{pass.ndvi}</strong>
                      </span>
                      <span>
                        NDWI : <strong className="text-sky-600">{pass.ndwi}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── 2. ONGLET ZONAGE VRA (FERTILISATION VARIABLE) ── */}
          <TabsContent value="vra" className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-sm text-foreground block">
                  Modulation Intra-Parcellaire des Engrais (VRA)
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Économisez jusqu'à <strong>{analysis.vraZoning.inputSavingsPct}%</strong> d'intrants en dosant selon la vigueur mesurée par satellite.
                </p>
              </div>
              <Badge className="bg-amber-600 text-white font-bold text-xs py-1 px-2.5">
                -{analysis.vraZoning.inputSavingsPct}% d'intrants
              </Badge>
            </div>

            {/* Cartographie des 3 zones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {analysis.vraZoning.zones.map((zone) => (
                <div
                  key={zone.zoneId}
                  className={`p-3 rounded-xl border space-y-2.5 ${
                    zone.productivityLevel === "elevee"
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : zone.productivityLevel === "moyenne"
                      ? "bg-sky-500/5 border-sky-500/30"
                      : "bg-rose-500/5 border-rose-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-foreground truncate">{zone.name.split(":")[0]}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {zone.areaHa} ha ({zone.areaPct}%)
                    </Badge>
                  </div>

                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">NDVI Moyen :</span>
                      <strong className="text-foreground">{zone.avgNdvi}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">NPK 14-23-14 :</span>
                      <strong className="text-emerald-700 dark:text-emerald-300">
                        {zone.recommendedNpkBags} sacs (50kg)
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Urée 46% :</span>
                      <strong className="text-emerald-700 dark:text-emerald-300">
                        {zone.recommendedUreaBags} sacs (50kg)
                      </strong>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground border-t pt-1.5">
                    {zone.specificRecommendation}
                  </p>
                </div>
              ))}
            </div>

            {/* Bilan des sacs */}
            <div className="p-3 bg-muted/40 rounded-xl flex items-center justify-between text-xs font-bold">
              <span>Total Recommandation VRA pour {field.areaHa.toFixed(2)} ha :</span>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-emerald-700 dark:text-emerald-300">
                  {analysis.vraZoning.totalNpkBags} sacs NPK
                </span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-300">
                  {analysis.vraZoning.totalUreaBags} sacs Urée
                </span>
              </div>
            </div>
          </TabsContent>

          {/* ── 3. ONGLET SCOUTING CONNECTÉ ── */}
          <TabsContent value="scouting" className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-500" />
                <h4 className="font-extrabold text-sm text-foreground">
                  Diagnostic Satellitaire Prédictif
                </h4>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {analysis.scoutingRecommendation.diagnosisHypothesis}
              </p>

              <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Niveau de vigilance :</span>
                  <Badge
                    className={
                      analysis.scoutingRecommendation.priority === "critique"
                        ? "bg-rose-600 text-white"
                        : "bg-emerald-600 text-white"
                    }
                  >
                    Priorité {analysis.scoutingRecommendation.priority}
                  </Badge>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">Point GPS cible d'inspection :</span>
                  <span className="font-bold text-foreground">
                    {field.points[0]?.lat.toFixed(5)}° N, {field.points[0]?.lng.toFixed(5)}° W
                  </span>
                </div>
              </div>

              <Button
                onClick={handleLaunchScouting}
                className="w-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
              >
                <MapPin className="h-4 w-4" />
                <span>Déclencher une mission d'inspection terrain pour cette parcelle</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
