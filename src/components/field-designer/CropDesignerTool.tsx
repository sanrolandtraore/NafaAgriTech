/**
 * NAFA FIELD DESIGNER — CROP DESIGNER (CONCEPTION DE CULTURE)
 * Planification des lignes de plantation, densités, écartements et semences.
 * Permet à l'agronome de modifier manuellement TOUTES les valeurs.
 */

import React, { useState, useEffect } from "react";
import { CropConfig, CropPlan, PlantingType, Field } from "@/types/fieldDesigner";
import { cropsStorage } from "@/lib/fieldDesignerCrops";
import { computeCropPlan } from "@/lib/fieldCropDesignerEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, Save, Sliders, RefreshCw, Compass, Droplets, Layers } from "lucide-react";
import { toast } from "sonner";

interface CropDesignerToolProps {
  onSavePlan: (plan: CropPlan) => void;
  fields: Field[];
  activeFarmId: string;
}

export const CropDesignerTool: React.FC<CropDesignerToolProps> = ({
  onSavePlan,
  fields,
  activeFarmId,
}) => {
  const allCrops = cropsStorage.getAll();

  const [selectedCropId, setSelectedCropId] = useState<string>("oignon");
  const [selectedVariety, setSelectedVariety] = useState<string>("Safary");
  const [selectedFieldId, setSelectedFieldId] = useState<string>(fields[0]?.id || "manual");
  const [areaHa, setAreaHa] = useState<number>(fields[0]?.areaHa || 1.0);

  const selectedCrop = allCrops.find((c) => c.id === selectedCropId) || allCrops[0];

  const [rowSpacingCm, setRowSpacingCm] = useState<number>(selectedCrop.recommendedRowSpacingCm);
  const [plantSpacingCm, setPlantSpacingCm] = useState<number>(selectedCrop.recommendedPlantSpacingCm);
  const [orientationDeg, setOrientationDeg] = useState<number>(90); // Est-Ouest par défaut
  const [plantingType, setPlantingType] = useState<PlantingType>("repiquage");

  // Synchronisation avec la culture choisie
  useEffect(() => {
    if (selectedCrop) {
      setRowSpacingCm(selectedCrop.recommendedRowSpacingCm);
      setPlantSpacingCm(selectedCrop.recommendedPlantSpacingCm);
      setSelectedVariety(selectedCrop.commonVarieties[0] || "Standard");
    }
  }, [selectedCropId]);

  // Synchronisation avec la parcelle sélectionnée
  useEffect(() => {
    if (selectedFieldId !== "manual") {
      const f = fields.find((item) => item.id === selectedFieldId);
      if (f) setAreaHa(f.areaHa);
    }
  }, [selectedFieldId, fields]);

  // Calcul automatique
  const computed = computeCropPlan({
    areaHa,
    crop: selectedCrop,
    variety: selectedVariety,
    rowSpacingCm,
    plantSpacingCm,
    orientationDeg,
    plantingType,
  });

  // États éditables par l'agronome (l'agronome peut surcharger les calculs automatiques)
  const [numRows, setNumRows] = useState<number>(computed.numRows);
  const [numPlants, setNumPlants] = useState<number>(computed.numPlants);
  const [densityHa, setDensityHa] = useState<number>(computed.densityPlantsHa);
  const [seedQtyKg, setSeedQtyKg] = useState<number>(computed.seedQuantityKg);

  useEffect(() => {
    setNumRows(computed.numRows);
    setNumPlants(computed.numPlants);
    setDensityHa(computed.densityPlantsHa);
    setSeedQtyKg(computed.seedQuantityKg);
  }, [computed.numRows, computed.numPlants, computed.densityPlantsHa, computed.seedQuantityKg]);

  const handleSave = () => {
    const plan: CropPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      farmId: activeFarmId,
      fieldId: selectedFieldId,
      cropId: selectedCrop.id,
      cropName: selectedCrop.name,
      variety: selectedVariety,
      areaHa,
      rowSpacingCm,
      plantSpacingCm,
      orientationDeg,
      plantingType,
      numRows,
      numPlants,
      densityPlantsHa: densityHa,
      totalRowLengthM: computed.totalRowLengthM,
      seedQuantityKg: seedQtyKg,
      estimatedYieldTonnes: computed.estimatedYieldTonnes,
      waterNeedsM3Day: computed.waterNeedsM3Day,
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSavePlan(plan);
    toast.success(`Plan de culture « ${selectedCrop.name} » enregistré avec succès.`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="rounded-3xl border-2 border-primary/20 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                <Sprout className="h-6 w-6 text-primary" />
                Concevoir une Parcelle & Lignes de Plantation
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Modélisez l'interligne, la densité et les besoins en eau (modifiables à 100%).
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30">
              Référentiel INERA / FAO-56
            </Badge>
          </div>

          {/* ── SÉLECTION CULTURE & PARCELLE ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-bold">Culture</Label>
              <Select value={selectedCropId} onValueChange={setSelectedCropId}>
                <SelectTrigger className="h-11 rounded-xl text-xs font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {allCrops.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Variété recommandée / semée</Label>
              <Select value={selectedVariety} onValueChange={setSelectedVariety}>
                <SelectTrigger className="h-11 rounded-xl text-xs font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedCrop.commonVarieties.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Parcelle cible</Label>
              <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                <SelectTrigger className="h-11 rounded-xl text-xs font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Saisie manuelle superficie</SelectItem>
                  {fields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.areaHa} ha)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── PARAMÈTRES AGRONOMIQUES ÉDITABLES ── */}
          <div className="bg-muted/30 p-4 rounded-2xl border space-y-4">
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              Écartements & Géométrie de plantation
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-[11px] font-bold">Superficie (ha)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={areaHa}
                  onChange={(e) => setAreaHa(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="h-10 rounded-xl text-xs font-mono font-bold mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold">Interligne (cm)</Label>
                <Input
                  type="number"
                  value={rowSpacingCm}
                  onChange={(e) => setRowSpacingCm(Math.max(5, parseInt(e.target.value) || 5))}
                  className="h-10 rounded-xl text-xs font-mono font-bold mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold">Espacement plants (cm)</Label>
                <Input
                  type="number"
                  value={plantSpacingCm}
                  onChange={(e) => setPlantSpacingCm(Math.max(2, parseInt(e.target.value) || 2))}
                  className="h-10 rounded-xl text-xs font-mono font-bold mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold">Orientation des lignes</Label>
                <Select
                  value={orientationDeg.toString()}
                  onValueChange={(v) => setOrientationDeg(parseInt(v))}
                >
                  <SelectTrigger className="h-10 rounded-xl text-xs font-semibold mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">Est-Ouest (90° - Recommandé Sahel)</SelectItem>
                    <SelectItem value="0">Nord-Sud (0°)</SelectItem>
                    <SelectItem value="45">Nord-Est / Sud-Ouest (45°)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── RÉSULTATS CALCULÉS & MODIFIABLES PAR L'AGRONOME ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-card border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Lignes de plantation</span>
              <Input
                type="number"
                value={numRows}
                onChange={(e) => setNumRows(parseInt(e.target.value) || 0)}
                className="h-9 font-mono font-black text-lg p-1 border-0 shadow-none"
              />
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Longueur tot. : {computed.totalRowLengthM.toLocaleString()} m
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Nombre total de plants</span>
              <Input
                type="number"
                value={numPlants}
                onChange={(e) => setNumPlants(parseInt(e.target.value) || 0)}
                className="h-9 font-mono font-black text-lg p-1 border-0 shadow-none text-primary"
              />
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Densité : {densityHa.toLocaleString()} plants/ha
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Semences nécessaires</span>
              <Input
                type="number"
                step="0.01"
                value={seedQtyKg}
                onChange={(e) => setSeedQtyKg(parseFloat(e.target.value) || 0)}
                className="h-9 font-mono font-black text-lg p-1 border-0 shadow-none"
              />
              <span className="text-[10px] text-muted-foreground block mt-0.5">Kilogrammes requis</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Besoin en eau journalier</span>
              <div className="h-9 font-mono font-black text-lg flex items-center text-sky-600">
                {computed.waterNeedsM3Day} m³/j
              </div>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Rendement est. : {computed.estimatedYieldTonnes} t
              </span>
            </div>
          </div>

          {/* ── APERÇU SVG DES RANGS DE CULTURE ── */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 self-start mb-2 flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              Schéma des lignes de plantation ({selectedCrop.name} • {numRows} rangs)
            </span>
            <svg className="w-full h-32 bg-emerald-900/10 rounded-xl" viewBox="0 0 100 100">
              {computed.plantingRowCoordinates.map((coord, idx) => (
                <line
                  key={idx}
                  x1={coord.x1}
                  y1={coord.y1}
                  x2={coord.x2}
                  y2={coord.y2}
                  stroke="#16a34a"
                  strokeWidth="1.2"
                  strokeDasharray="2,1"
                />
              ))}
            </svg>
            <span className="text-[10px] text-muted-foreground mt-2">
              Orientation : {orientationDeg}° (Interligne {rowSpacingCm}cm • Espacement {plantSpacingCm}cm)
            </span>
          </div>

          <Button
            onClick={handleSave}
            className="w-full h-13 rounded-2xl font-black text-sm gradient-primary text-primary-foreground gap-2"
          >
            <Save className="h-5 w-5" />
            Enregistrer ce Plan de Culture
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
