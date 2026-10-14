/**
 * NAFA QGIS FIELD STUDIO
 * Console SIG unifiée et simplifiée d'ingénierie agronomique.
 * Remplace la dispersion en 10 onglets par un poste de travail cartographique
 * immersif, interactif, simple et au standard professionnel international (QGIS).
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Farm,
  Field,
  IrrigationProject,
  FarmBuilding,
  GeoPoint,
} from "@/types/fieldDesigner";
import { fieldDesignerStorage } from "@/lib/fieldDesignerStorage";
import {
  QgisLayersPanel,
  QgisLayerVisibility,
} from "./QgisLayersPanel";
import { QgisMapCanvas } from "./QgisMapCanvas";
import { QgisAttributeInspector } from "./QgisAttributeInspector";
import {
  downloadQgisGeoJson,
  downloadQgisDxf,
  parseQgisGeoJson,
} from "@/lib/qgisExportEngine";
import { calculatePolygonAreaM2, calculatePerimeterM } from "@/lib/fieldGpsSurvey";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Compass,
  Layers,
  MousePointer,
  PenTool,
  Droplets,
  Home,
  Download,
  Upload,
  FileText,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Store,
} from "lucide-react";
import { toast } from "sonner";

interface QgisFieldStudioProps {
  farms: Farm[];
  activeFarmId: string;
  onSelectFarm: (farmId: string) => void;
  onOpenNewFarmModal: () => void;
  onSwitchToLegacyTabs?: () => void;
  onGenerateOfficialPdf?: () => void;
}

export const QgisFieldStudio: React.FC<QgisFieldStudioProps> = ({
  farms,
  activeFarmId,
  onSelectFarm,
  onOpenNewFarmModal,
  onSwitchToLegacyTabs,
  onGenerateOfficialPdf,
}) => {
  const activeFarm =
    farms.find((f) => f.id === activeFarmId) ||
    farms[0] || {
      id: "demo",
      name: "Exploitation Agricole",
      producerName: "Producteur",
      producerPhone: "",
      locality: "Burkina Faso",
      region: "",
      province: "",
      commune: "",
      villageSector: "",
      farmType: "maraichage",
      totalAreaHa: 1.0,
      mainCrops: [],
      livestockTypes: [],
      irrigationType: "Goutte-à-goutte",
      photos: [],
      syncStatus: "synced",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  // Données de l'exploitation
  const [fields, setFields] = useState<Field[]>([]);
  const [buildings, setBuildings] = useState<FarmBuilding[]>([]);
  const [irrigationProjects, setIrrigationProjects] = useState<IrrigationProject[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Outil actif de la barre d'outils QGIS
  const [activeTool, setActiveTool] = useState<"select" | "polygon" | "irrigation" | "building">("select");

  // Visibilité des couches SIG
  const [layers, setLayers] = useState<QgisLayerVisibility>({
    satellite: true,
    parcelles: true,
    bornes: true,
    irrigation: true,
    cultures: true,
    batiments: true,
  });

  // Volets rétractables pour maximiser l'espace carte
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Fichier d'import GeoJSON
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chargement des données pour la ferme active
  const loadFarmData = async (farmId: string) => {
    if (!farmId) return;
    const flds = await fieldDesignerStorage.getFields(farmId);
    const blds = await fieldDesignerStorage.getBuildings(farmId);
    const irrs = await fieldDesignerStorage.getIrrigationProjects(farmId);
    setFields(flds);
    setBuildings(blds);
    setIrrigationProjects(irrs);
    if (flds.length > 0 && !selectedFieldId) {
      setSelectedFieldId(flds[0].id);
    }
  };

  useEffect(() => {
    loadFarmData(activeFarm.id);
  }, [activeFarm.id]);

  const handleToggleLayer = (key: keyof QgisLayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Sauvegarde d'une nouvelle parcelle digitalisée sur la carte
  const handleFinishNewPolygon = async (points: GeoPoint[]) => {
    if (points.length < 3) return;

    const areaM2 = calculatePolygonAreaM2(points);
    const areaHa = Math.round((areaM2 / 10000) * 100) / 100;
    const perimeterM = calculatePerimeterM(points);

    const defaultName = `Parcelle P${fields.length + 1}`;
    const fieldName = window.prompt("Nom de la nouvelle parcelle :", defaultName) || defaultName;

    const newField: Field = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      farmId: activeFarm.id,
      name: fieldName,
      points,
      areaM2,
      areaHa,
      perimeterM,
      status: "active",
      syncStatus: "synced",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fieldDesignerStorage.saveField(newField);
    toast.success(`Parcelle "${fieldName}" (${areaHa} ha) enregistrée avec succès.`);
    await loadFarmData(activeFarm.id);
    setSelectedFieldId(newField.id);
    setActiveTool("select");
  };

  // Suppression d'une parcelle
  const handleDeleteField = async (id: string) => {
    await fieldDesignerStorage.deleteField(id);
    await loadFarmData(activeFarm.id);
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  };

  // Gestion de l'import GeoJSON QGIS
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { fields: importedFields, errors } = parseQgisGeoJson(text, activeFarm.id);

      if (errors.length > 0) {
        toast.error(errors.join(" "));
        return;
      }

      if (importedFields.length === 0) {
        toast.warning("Aucun polygone de parcelle trouvé dans le fichier.");
        return;
      }

      for (const f of importedFields) {
        await fieldDesignerStorage.saveField(f);
      }

      toast.success(`${importedFields.length} parcelles importées depuis QGIS avec succès.`);
      await loadFarmData(activeFarm.id);
      setSelectedFieldId(importedFields[0].id);
    } catch (err: any) {
      toast.error(`Erreur d'import : ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;
  const activeIrrigation = irrigationProjects[0] || null;

  return (
    <div className="w-full space-y-3">
      {/* ── BARRE D'OUTILS PRINCIPALE QGIS STUDIO (TOOLBAR COMPACTE) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 p-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-2xl border border-emerald-500/30 shadow-lg">
        {/* Titre & Exploitation */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold shrink-0">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-heading font-black tracking-tight text-white">
                NAFA QGIS STUDIO
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold py-0 h-5">
                SIG Professionnel
              </Badge>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-none mt-0.5">
              Conception cartographique • Cadastre • FAO-56 • EPSG:32630 (UTM 30N)
            </p>
          </div>
        </div>

        {/* Sélecteur de ferme */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-white/70 uppercase shrink-0">Ferme :</span>
            <Select value={activeFarm.id} onValueChange={onSelectFarm}>
              <SelectTrigger className="h-7 text-xs font-bold rounded-lg border-0 bg-transparent text-white px-2 py-0 focus:ring-0 w-36 sm:w-48 truncate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {farms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} ({f.locality})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpenNewFarmModal}
              className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20 rounded-md"
              title="Nouvelle exploitation"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Outils d'export QGIS */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                downloadQgisGeoJson(activeFarm, fields, irrigationProjects, buildings);
                toast.success("Fichier GeoJSON QGIS téléchargé.");
              }}
              className="h-7 text-xs font-bold gap-1 bg-white/10 text-white border-white/20 hover:bg-white/20"
              title="Exporter au format GeoJSON pour QGIS Desktop / ArcGIS"
            >
              <Download className="h-3 w-3 text-emerald-400" />
              <span>Export QGIS</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                downloadQgisDxf(activeFarm, fields, buildings);
                toast.success("Plan vectoriel DXF métrique téléchargé.");
              }}
              className="h-7 text-xs font-bold gap-1 bg-white/10 text-white border-white/20 hover:bg-white/20"
              title="Exporter en DXF (AutoCAD / QGIS)"
            >
              <span>DXF</span>
            </Button>

            {onSwitchToLegacyTabs && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onSwitchToLegacyTabs}
                className="h-7 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-800/40 gap-1"
                title="Basculer vers la vue formulaires détaillés"
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span className="hidden sm:inline">Vue Détaillée</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── BARRE D'OUTILS SECONDAIRE D'ÉDITION VECTORIELLE (QGIS ACTION PALETTE) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-card rounded-xl border border-border shadow-2xs text-xs">
        {/* Modes de digitalisation */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={activeTool === "select" ? "default" : "outline"}
            onClick={() => setActiveTool("select")}
            className={`h-8 px-3 font-bold gap-1.5 ${
              activeTool === "select" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            }`}
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span>Sélection &amp; Mesure</span>
          </Button>

          <Button
            size="sm"
            variant={activeTool === "polygon" ? "default" : "outline"}
            onClick={() => setActiveTool("polygon")}
            className={`h-8 px-3 font-bold gap-1.5 ${
              activeTool === "polygon"
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                : "border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            <span>Tracer Parcelle (Polygone)</span>
          </Button>
        </div>

        {/* Raccourcis panneaux & import */}
        <div className="flex items-center gap-2">
          {/* Input fichier caché pour l'import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            accept=".geojson,.json"
            className="hidden"
          />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Upload className="h-3.5 w-3.5 text-sky-500" />
            <span>Importer GeoJSON</span>
          </Button>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Toggle visibilité des volets */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className={`h-8 px-2 text-xs font-bold gap-1 ${
              showLeftPanel ? "text-emerald-600" : "text-muted-foreground"
            }`}
            title="Afficher/Masquer le panneau des couches"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Couches</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowRightPanel(!showRightPanel)}
            className={`h-8 px-2 text-xs font-bold gap-1 ${
              showRightPanel ? "text-emerald-600" : "text-muted-foreground"
            }`}
            title="Afficher/Masquer l'inspecteur d'attributs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Attributs</span>
          </Button>
        </div>
      </div>

      {/* ── ESPACE DE TRAVAIL SIG TRIPTYQUE (COUCHES | MAP CANVAS | ATTRIBUTS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[580px] h-[calc(100vh-230px)] max-h-[860px]">
        {/* Volet Gauche : Gestionnaire de Couches (QGIS Layers Panel) */}
        {showLeftPanel && (
          <div className="lg:col-span-3 h-full">
            <QgisLayersPanel
              layers={layers}
              onToggleLayer={handleToggleLayer}
              fields={fields}
              buildings={buildings}
              irrigationProjects={irrigationProjects}
              selectedFieldId={selectedFieldId}
              onSelectField={setSelectedFieldId}
              onImportClick={() => fileInputRef.current?.click()}
              onAddParcelClick={() => setActiveTool("polygon")}
            />
          </div>
        )}

        {/* Zone Centrale : Map Canvas Interactif (Leaflet Satellite & Vector) */}
        <div
          className={`h-full ${
            showLeftPanel && showRightPanel
              ? "lg:col-span-6"
              : showLeftPanel || showRightPanel
              ? "lg:col-span-9"
              : "lg:col-span-12"
          }`}
        >
          <QgisMapCanvas
            farm={activeFarm}
            fields={fields}
            layers={layers}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            activeTool={activeTool}
            onFinishNewPolygon={handleFinishNewPolygon}
            onCancelDrawing={() => setActiveTool("select")}
          />
        </div>

        {/* Volet Droit : Inspecteur d'Attributs & Calculs Réels (QGIS Inspector) */}
        {showRightPanel && (
          <div className="lg:col-span-3 h-full">
            <QgisAttributeInspector
              selectedField={selectedField}
              farm={activeFarm}
              irrigationProject={activeIrrigation}
              onDeleteField={handleDeleteField}
              onGenerateQuote={onGenerateOfficialPdf}
            />
          </div>
        )}
      </div>
    </div>
  );
};
