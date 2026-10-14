/**
 * NAFA QGIS STUDIO — PANNEAU DES COUCHES SIG (LAYERS PANEL)
 * Interface inspirée du gestionnaire de couches officiel de QGIS.
 * Permet d'activer/masquer, réordonner et inspecter les couches vectorielles et rasters.
 */

import React from "react";
import { Field, FarmBuilding, IrrigationProject } from "@/types/fieldDesigner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Eye,
  EyeOff,
  MapPin,
  Droplets,
  Sprout,
  Home,
  Plus,
  Compass,
  Upload,
  Globe,
  Satellite,
} from "lucide-react";

export interface QgisLayerVisibility {
  satellite: boolean;
  ndviSentinel2: boolean;
  parcelles: boolean;
  bornes: boolean;
  irrigation: boolean;
  cultures: boolean;
  batiments: boolean;
}

interface QgisLayersPanelProps {
  layers: QgisLayerVisibility;
  onToggleLayer: (layerKey: keyof QgisLayerVisibility) => void;
  fields: Field[];
  buildings: FarmBuilding[];
  irrigationProjects: IrrigationProject[];
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onImportClick: () => void;
  onAddParcelClick: () => void;
}

export const QgisLayersPanel: React.FC<QgisLayersPanelProps> = ({
  layers,
  onToggleLayer,
  fields,
  buildings,
  irrigationProjects,
  selectedFieldId,
  onSelectField,
  onImportClick,
  onAddParcelClick,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-md overflow-hidden text-card-foreground">
      {/* En-tête QGIS Layers Panel */}
      <div className="p-3 bg-muted/60 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
            Couches SIG (QGIS)
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onImportClick}
            className="h-7 px-2 text-[11px] font-bold gap-1 text-muted-foreground hover:text-foreground"
            title="Importer une couche SIG GeoJSON / QGIS"
          >
            <Upload className="h-3 w-3" />
            <span>Import</span>
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={onAddParcelClick}
            className="h-7 px-2.5 text-[11px] font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Plus className="h-3 w-3" />
            <span>Tracer</span>
          </Button>
        </div>
      </div>

      {/* Liste hiérarchique des couches */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
        {/* 1. Couche Fond de Plan Satellite */}
        <div className="p-2 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
              <Checkbox
                checked={layers.satellite}
                onCheckedChange={() => onToggleLayer("satellite")}
                className="h-3.5 w-3.5 data-[state=checked]:bg-emerald-600"
              />
              <Globe className="h-3.5 w-3.5 text-sky-500" />
              <span>Imagerie Satellite ESRI HD</span>
            </label>
            <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono text-muted-foreground">
              Raster
            </Badge>
          </div>
        </div>

        {/* 1b. Couche Télédétection Sentinel-2 (NDVI / EOSDA) */}
        <div className="p-2 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-xs">
              <Checkbox
                checked={layers.ndviSentinel2}
                onCheckedChange={() => onToggleLayer("ndviSentinel2")}
                className="h-3.5 w-3.5 data-[state=checked]:bg-emerald-600"
              />
              <Satellite className="h-3.5 w-3.5 text-emerald-500" />
              <span>Sentinel-2 NDVI (EOSDA)</span>
            </label>
            <Badge variant="secondary" className="text-[9px] py-0 px-1 font-mono bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              Biomasse
            </Badge>
          </div>
        </div>

        {/* 2. Couche Parcelles Cadastrales */}
        <div className="p-2 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
              <Checkbox
                checked={layers.parcelles}
                onCheckedChange={() => onToggleLayer("parcelles")}
                className="h-3.5 w-3.5 data-[state=checked]:bg-emerald-600"
              />
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-600 shrink-0" />
              <span>Parcelles Cadastrales</span>
            </label>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] py-0 px-1.5">
              {fields.length} {fields.length > 1 ? "parcelles" : "parcelle"}
            </Badge>
          </div>

          {/* Sous-liste des parcelles cliquables pour centrage */}
          {layers.parcelles && fields.length > 0 && (
            <div className="pl-6 pt-1 space-y-1 border-l-2 border-emerald-500/20 ml-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  onClick={() => onSelectField(field.id)}
                  className={`p-1.5 rounded-lg cursor-pointer flex items-center justify-between text-[11px] transition-all ${
                    selectedFieldId === field.id
                      ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 font-black border border-emerald-500/40"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <span className="truncate pr-1">{field.name}</span>
                  <span className="font-mono text-[10px] shrink-0 font-bold">
                    {field.areaHa.toFixed(2)} ha
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Couche Bornes & Géodésie UTM */}
        <div className="p-2 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
              <Checkbox
                checked={layers.bornes}
                onCheckedChange={() => onToggleLayer("bornes")}
                className="h-3.5 w-3.5 data-[state=checked]:bg-emerald-600"
              />
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span>Bornes Cadastre & Points GPS</span>
            </label>
            <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono text-muted-foreground">
              EPSG:32630
            </Badge>
          </div>
        </div>

        {/* 4. Couche Réseau d'Irrigation */}
        <div className="p-2 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
              <Checkbox
                checked={layers.irrigation}
                onCheckedChange={() => onToggleLayer("irrigation")}
                className="h-3.5 w-3.5 data-[state=checked]:bg-emerald-600"
              />
              <Droplets className="h-3.5 w-3.5 text-sky-600" />
              <span>Réseau Hydraulique (Goutte-à-goutte)</span>
            </label>
            <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/30 text-[10px] py-0 px-1.5">
              {irrigationProjects.length > 0 ? "Actif" : "À dimensionner"}
            </Badge>
          </div>
          {layers.irrigation && (
            <p className="text-[10px] text-muted-foreground pl-6">
              Rampes PEHD, vannes de régulation &amp; groupe de pompage solaire.
            </p>
          )}
        </div>

        {/* 5. Couche Assolement & Variétés INERA */}
        <div className="p-2 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
              <Checkbox
                checked={layers.cultures}
                onCheckedChange={() => onToggleLayer("cultures")}
                className="h-3.5 w-3.5 data-[state=checked]:bg-emerald-600"
              />
              <Sprout className="h-3.5 w-3.5 text-amber-500" />
              <span>Assolement &amp; Variétés INERA</span>
            </label>
            <Badge variant="outline" className="text-[9px] py-0 px-1 text-muted-foreground">
              Thématique
            </Badge>
          </div>
        </div>

        {/* 6. Couche Bâtiments & Serres */}
        <div className="p-2 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
              <Checkbox
                checked={layers.batiments}
                onCheckedChange={() => onToggleLayer("batiments")}
                className="h-3.5 w-3.5 data-[state=checked]:bg-emerald-600"
              />
              <Home className="h-3.5 w-3.5 text-purple-500" />
              <span>Bâtiments &amp; Ouvrages</span>
            </label>
            <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px] py-0 px-1.5">
              {buildings.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Pied de panneau : Système de Coordonnées QGIS */}
      <div className="p-2.5 bg-muted/40 border-t flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-mono font-bold">SCR : EPSG:32630</span>
        <span className="font-medium">UTM 30N (WGS 84)</span>
      </div>
    </div>
  );
};
