/**
 * NAFA FIELD DESIGNER — LIVESTOCK BUILDING DESIGNER
 * Bâtiments d'élevage bioclimatiques sahéliens et calcul instantané des métrés.
 * Poulailler, étable, bergerie, porcherie, clapier, bassin piscicole.
 */

import React, { useState } from "react";
import { BuildingType, FarmBuilding } from "@/types/fieldDesigner";
import { recommendLivestockBuilding } from "@/lib/fieldLivestockDesignerEngine";
import { generateBuildingBillOfQuantities } from "@/lib/fieldMaterialsEstimator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Save, Sliders, CheckCircle2, Wrench, ShieldCheck, Box, ShoppingBag, Tag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MarketplaceMaterialPricePickerModal } from "./MarketplaceMaterialPricePickerModal";
import { QuoteItem } from "@/types/fieldDesigner";

interface LivestockDesignerToolProps {
  onSaveBuilding: (bld: FarmBuilding) => void;
  activeFarmId: string;
}

export const LivestockDesignerTool: React.FC<LivestockDesignerToolProps> = ({
  onSaveBuilding,
  activeFarmId,
}) => {
  const [buildingType, setBuildingType] = useState<BuildingType>("poulailler");
  const [subType, setSubType] = useState<string>("chair");
  const [targetCapacity, setTargetCapacity] = useState<number>(2000);

  // Modèle initial recommandé
  const recommended = recommendLivestockBuilding({
    buildingType,
    subType,
    targetCapacity,
  });

  // États personnalisables par l'agronome
  const [buildingName, setBuildingName] = useState(recommended.name);
  const [lengthM, setLengthM] = useState<number>(recommended.lengthM);
  const [widthM, setWidthM] = useState<number>(recommended.widthM);
  const [heightM, setHeightM] = useState<number>(recommended.heightM);
  const [orientation, setOrientation] = useState<string>(recommended.orientation);
  const [ventilation, setVentilation] = useState<string>(recommended.ventilation);
  const [wallMaterial, setWallMaterial] = useState<string>(recommended.wallMaterial);

  const currentAreaM2 = Math.round(lengthM * widthM);

  // Recalcul instantané des métrés
  const tempBuilding: FarmBuilding = {
    id: "temp",
    farmId: activeFarmId,
    name: buildingName,
    buildingType,
    subType,
    capacityAnimals: targetCapacity,
    lengthM,
    widthM,
    heightM,
    areaM2: currentAreaM2,
    orientation,
    ventilation,
    roofType: recommended.roofType,
    wallMaterial,
    equipment: recommended.equipment,
    posX: 20,
    posY: 20,
    rotationDeg: 0,
    syncStatus: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // État des prix personnalisés Marketplace Burkina Faso
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [targetLineId, setTargetLineId] = useState<string | null>(null);
  const [targetLineDesignation, setTargetLineDesignation] = useState<string | null>(null);

  const boq = generateBuildingBillOfQuantities(tempBuilding);

  // Articles avec prix appliqués depuis le marketplace
  const computedItems: QuoteItem[] = React.useMemo(() => {
    return boq.items.map((it, idx) => {
      const lineKey = it.id || `line_${idx}`;
      const customP = customPrices[lineKey];
      if (customP !== undefined) {
        return {
          ...it,
          id: lineKey,
          unitPriceFCFA: customP,
          totalFCFA: Math.round(it.quantity * customP),
        };
      }
      return {
        ...it,
        id: lineKey,
      };
    });
  }, [boq.items, customPrices]);

  const totalMaterialsFCFA = React.useMemo(() => {
    return computedItems.reduce((acc, it) => acc + it.totalFCFA, 0);
  }, [computedItems]);

  const totalGeneralFCFA = totalMaterialsFCFA + boq.laborCostFCFA + boq.transportCostFCFA;

  const handleApplyMarketplacePrice = (
    lineId: string,
    newPriceFCFA: number,
    _designation?: string,
    _unit?: string
  ) => {
    setCustomPrices((prev) => ({
      ...prev,
      [lineId]: newPriceFCFA,
    }));
    toast.success(`Prix réel appliqué : ${newPriceFCFA.toLocaleString("fr-FR")} FCFA`);
  };

  const handleOpenPickerForLine = (lineId: string, designation: string) => {
    setTargetLineId(lineId);
    setTargetLineDesignation(designation);
    setPickerModalOpen(true);
  };

  const handleApplyPreset = (type: BuildingType, sub: string, cap: number) => {
    setBuildingType(type);
    setSubType(sub);
    setTargetCapacity(cap);
    const rec = recommendLivestockBuilding({ buildingType: type, subType: sub, targetCapacity: cap });
    setBuildingName(rec.name);
    setLengthM(rec.lengthM);
    setWidthM(rec.widthM);
    setHeightM(rec.heightM);
    setOrientation(rec.orientation);
    setVentilation(rec.ventilation);
    setWallMaterial(rec.wallMaterial);
  };

  const handleSave = () => {
    const finalBuilding: FarmBuilding = {
      ...tempBuilding,
      id: `bld_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    };
    onSaveBuilding(finalBuilding);
    toast.success(`Bâtiment « ${finalBuilding.name} » enregistré avec ses métrés et prix réels.`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="rounded-3xl border-2 border-primary/20 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                <Home className="h-6 w-6 text-amber-600" />
                Concepteur de Bâtiments d'Élevage & Agricoles
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Architecture bioclimatique sahélienne : ventilation passive et métrés automatiques.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-bold text-amber-600 border-amber-600/30">
              Normes Bioclimatiques Sahel
            </Badge>
          </div>

          {/* ── SÉLECTION RAPIDE TYPE & EFFECTIF CIBLE ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-bold">Type de bâtiment</Label>
              <Select
                value={buildingType}
                onValueChange={(v: BuildingType) => {
                  const defaultSub = v === "poulailler" ? "chair" : v === "etable" ? "engraissement" : "standard";
                  handleApplyPreset(v, defaultSub, targetCapacity);
                }}
              >
                <SelectTrigger className="h-11 rounded-xl text-xs font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poulailler">Poulailler (chair, ponte, poussins)</SelectItem>
                  <SelectItem value="etable">Étable bovine (engraissement, laitière)</SelectItem>
                  <SelectItem value="bergerie">Bergerie ovine / caprine</SelectItem>
                  <SelectItem value="porcherie">Porcherie moderne</SelectItem>
                  <SelectItem value="clapier">Clapier cunicole</SelectItem>
                  <SelectItem value="pisciculture">Bassin piscicole</SelectItem>
                  <SelectItem value="magasin">Magasin de stockage / intrants</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Spécialisation</Label>
              <Select
                value={subType}
                onValueChange={(sub) => handleApplyPreset(buildingType, sub, targetCapacity)}
              >
                <SelectTrigger className="h-11 rounded-xl text-xs font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buildingType === "poulailler" && (
                    <>
                      <SelectItem value="chair">Poulets de chair (gavage)</SelectItem>
                      <SelectItem value="pondeuses">Poules pondeuses</SelectItem>
                      <SelectItem value="poussins">Poussinière • Démarrage</SelectItem>
                    </>
                  )}
                  {buildingType === "etable" && (
                    <>
                      <SelectItem value="engraissement">Bovins engraissement • embouche</SelectItem>
                      <SelectItem value="laitieres">Vaches laitières</SelectItem>
                    </>
                  )}
                  {buildingType !== "poulailler" && buildingType !== "etable" && (
                    <SelectItem value="standard">Standard</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Capacité • Effectif animaux</Label>
              <Input
                type="number"
                value={targetCapacity}
                onChange={(e) => {
                  const cap = Math.max(1, parseInt(e.target.value) || 1);
                  setTargetCapacity(cap);
                  const rec = recommendLivestockBuilding({ buildingType, subType, targetCapacity: cap });
                  setLengthM(rec.lengthM);
                  setWidthM(rec.widthM);
                }}
                className="h-11 rounded-xl text-xs font-mono font-bold mt-1"
                placeholder="Ex: 2000"
              />
            </div>
          </div>

          {/* ── DIMENSIONS PHYSIQUES (100% ÉDITABLES PAR L'AGRONOME) ── */}
          <div className="bg-muted/30 p-4 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                Dimensions & Géométrie du Bâtiment
              </h3>
              <Badge variant="outline" className="text-xs font-mono font-bold">
                Surface au sol : {currentAreaM2} m²
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] font-bold">Longueur (m)</Label>
                <Input
                  type="number"
                  value={lengthM}
                  onChange={(e) => setLengthM(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="h-10 rounded-xl text-xs font-mono font-bold mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold">Largeur (m)</Label>
                <Input
                  type="number"
                  value={widthM}
                  onChange={(e) => setWidthM(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="h-10 rounded-xl text-xs font-mono font-bold mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold">Hauteur faîtage (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={heightM}
                  onChange={(e) => setHeightM(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="h-10 rounded-xl text-xs font-mono font-bold mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-[11px]">Orientation thermique</Label>
                <Input
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  className="h-9 rounded-xl text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px]">Ventilation & Lanterneau</Label>
                <Input
                  value={ventilation}
                  onChange={(e) => setVentilation(e.target.value)}
                  className="h-9 rounded-xl text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* ── MÉTRÉS AUTOMATIQUES & MATÉRIAUX ESTIMÉS ── */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-xs uppercase tracking-wider block text-primary">
                Métrés &amp; Estimation des Matériaux (Prix Réels Burkina Faso)
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setTargetLineId(null);
                  setTargetLineDesignation(null);
                  setPickerModalOpen(true);
                }}
                className="h-8 text-xs font-semibold gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 rounded-xl"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                <span>Sélectionner Prix Réels Marché (BF)</span>
              </Button>
            </div>

            <div className="rounded-2xl border overflow-hidden">
              <div className="bg-muted/60 p-2.5 text-xs font-bold grid grid-cols-12 gap-2">
                <span className="col-span-5">Désignation du matériau</span>
                <span className="col-span-1 text-center">Unité</span>
                <span className="col-span-1 text-center">Qté</span>
                <span className="col-span-3 text-right">P.U. Marché</span>
                <span className="col-span-2 text-right">Montant (F)</span>
              </div>
              <div className="divide-y divide-border/60 max-h-64 overflow-y-auto bg-card text-xs">
                {computedItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-2.5 grid grid-cols-12 gap-2 items-center hover:bg-muted/20">
                    <span className="col-span-5 font-medium truncate">{item.designation}</span>
                    <span className="col-span-1 text-center text-muted-foreground">{item.unit}</span>
                    <span className="col-span-1 text-center font-mono font-bold">{item.quantity}</span>
                    <div className="col-span-3 flex items-center justify-end gap-1.5">
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {item.unitPriceFCFA.toLocaleString("fr-FR")} F
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPickerForLine(item.id, item.designation)}
                        className="h-6 px-1.5 text-[10px] font-semibold gap-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                        title="Choisir le prix réel certifié sur le Marché"
                      >
                        <Tag className="h-3 w-3" />
                        Prix Réel
                      </Button>
                    </div>
                    <span className="col-span-2 text-right font-mono font-bold text-primary">
                      {item.totalFCFA.toLocaleString("fr-FR")} F
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-primary/10 p-3 flex items-center justify-between text-xs font-bold border-t">
                <span>Total Estimé Matériaux &amp; Pose :</span>
                <span className="text-sm font-mono font-black text-primary">
                  {totalGeneralFCFA.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full h-13 rounded-2xl font-black text-sm bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            <Save className="h-5 w-5" />
            Enregistrer ce Bâtiment &amp; ses Métrés
          </Button>

          {/* Modale de Sélection des Prix Réels Marketplace */}
          <MarketplaceMaterialPricePickerModal
            open={pickerModalOpen}
            onOpenChange={setPickerModalOpen}
            targetLineId={targetLineId}
            targetLineDesignation={targetLineDesignation}
            onAddItem={(newItem) => {
              setCustomPrices((prev) => ({
                ...prev,
                [newItem.id]: newItem.unitPriceFCFA,
              }));
              toast.success(`Matériau « ${newItem.designation} » appliqué au projet !`);
            }}
            onApplyPriceToLine={handleApplyMarketplacePrice}
          />
        </CardContent>
      </Card>
    </div>
  );
};
