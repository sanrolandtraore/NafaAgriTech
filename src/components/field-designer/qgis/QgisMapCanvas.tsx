/**
 * NAFA QGIS STUDIO — MAP CANVAS INTERACTIF
 * Espace cartographique central de type QGIS avec fond satellite ESRI HD,
 * rendu vectoriel dynamique des parcelles et arpentage/digitalisation en direct.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Field, GeoPoint, Farm } from "@/types/fieldDesigner";
import { QgisLayerVisibility } from "./QgisLayersPanel";
import { wgs84ToUtmZone30N } from "@/lib/qgisExportEngine";
import { calculatePolygonAreaM2, calculatePerimeterM } from "@/lib/fieldGpsSurvey";
import { analyzeFieldSatelliteData } from "@/lib/eosdaCropMonitoringEngine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Check,
  Undo2,
  Trash2,
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer,
  PenTool,
} from "lucide-react";

interface QgisMapCanvasProps {
  farm: Farm;
  fields: Field[];
  layers: QgisLayerVisibility;
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  activeTool: "select" | "polygon" | "irrigation" | "building";
  onFinishNewPolygon?: (points: GeoPoint[]) => void;
  onCancelDrawing?: () => void;
}

export const QgisMapCanvas: React.FC<QgisMapCanvasProps> = ({
  farm,
  fields,
  layers,
  selectedFieldId,
  onSelectField,
  activeTool,
  onFinishNewPolygon,
  onCancelDrawing,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // État des coordonnées du curseur pour la barre d'état QGIS
  const [cursorCoords, setCursorCoords] = useState<{
    lat: number;
    lng: number;
    eastingM: number;
    northingM: number;
  }>({
    lat: farm.gps?.lat || 12.37,
    lng: farm.gps?.lng || -1.52,
    eastingM: 0,
    northingM: 0,
  });

  // Points en cours de digitalisation (quand activeTool === "polygon")
  const [drawingPoints, setDrawingPoints] = useState<GeoPoint[]>([]);

  // 1. Initialisation de la carte Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Déterminer le centre par défaut
    const defaultCenter: [number, number] = farm.gps
      ? [farm.gps.lat, farm.gps.lng]
      : fields[0]?.points[0]
      ? [fields[0].points[0].lat, fields[0].points[0].lng]
      : [11.391245, -4.412154]; // Bama Vallée du Kou par défaut

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: fields.length > 0 ? 16 : 14,
      zoomControl: false, // Boutons custom plus bas
      attributionControl: false,
    });

    mapInstanceRef.current = map;
    layersGroupRef.current = L.layerGroup().addTo(map);
    drawingLayerGroupRef.current = L.layerGroup().addTo(map);

    // Écouteur de mouvement de souris pour les coordonnées en temps réel
    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      const utm = wgs84ToUtmZone30N(e.latlng.lat, e.latlng.lng);
      setCursorCoords({
        lat: Math.round(e.latlng.lat * 100000) / 100000,
        lng: Math.round(e.latlng.lng * 100000) / 100000,
        eastingM: utm.eastingM,
        northingM: utm.northingM,
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Gestion des fonds de carte (Satellite ESRI vs Plan Carto)
  const baseTileRef = useRef<L.TileLayer | null>(null);
  const labelsTileRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileRef.current) map.removeLayer(baseTileRef.current);
    if (labelsTileRef.current) map.removeLayer(labelsTileRef.current);

    if (layers.satellite) {
      // Imagerie Satellite ESRI World Imagery
      baseTileRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      ).addTo(map);

      // Étiquettes cartographiques par-dessus le satellite
      labelsTileRef.current = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);
    } else {
      // Fond vectoriel clair OpenStreetMap
      baseTileRef.current = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 19 }
      ).addTo(map);
    }
  }, [layers.satellite]);

  // 3. Rendu des couches vectorielles de parcelles et bornes
  useEffect(() => {
    const group = layersGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layers.parcelles) return;

    fields.forEach((field) => {
      if (!field.points || field.points.length < 3) return;

      const isSelected = field.id === selectedFieldId;
      const latlngs = field.points.map((p) => [p.lat, p.lng] as L.LatLngTuple);

      // Styles dynamiques par défaut
      let polygonColor = isSelected ? "#10b981" : "#16a34a";
      let polygonFill = isSelected ? "#34d399" : "#22c55e";
      let polygonOpacity = isSelected ? 0.35 : 0.2;
      let ndviBadge = "";

      // Si la couche Sentinel-2 NDVI est active, coloration thématique EOSDA
      if (layers.ndviSentinel2) {
        const areaHa = field.areaHa || field.areaM2 / 10000;
        const satAnalysis = analyzeFieldSatelliteData(field.id, field.name, areaHa, field.points, field.currentCrop || "maraichage");
        const ndvi = satAnalysis.currentIndices.ndvi;

        if (ndvi >= 0.7) {
          polygonColor = isSelected ? "#047857" : "#059669";
          polygonFill = "#10b981";
          polygonOpacity = isSelected ? 0.6 : 0.45;
        } else if (ndvi >= 0.5) {
          polygonColor = isSelected ? "#4d7c0f" : "#65a30d";
          polygonFill = "#84cc16";
          polygonOpacity = isSelected ? 0.55 : 0.4;
        } else {
          polygonColor = isSelected ? "#b45309" : "#d97706";
          polygonFill = "#f59e0b";
          polygonOpacity = isSelected ? 0.55 : 0.4;
        }

        ndviBadge = `<div class="mt-1 pt-1 border-t border-slate-200 flex items-center justify-between gap-2 text-[10px] font-mono">
          <span class="text-slate-600 font-medium">NDVI Sentinel-2:</span>
          <span class="px-1 py-0.2 rounded font-black text-white ${
            ndvi >= 0.7 ? "bg-emerald-600" : ndvi >= 0.5 ? "bg-lime-600" : "bg-amber-600"
          }">${ndvi.toFixed(2)}</span>
        </div>`;
      }

      // Polygone de parcelle
      const polygon = L.polygon(latlngs, {
        color: polygonColor,
        fillColor: polygonFill,
        weight: isSelected ? 3.5 : 2,
        fillOpacity: polygonOpacity,
      }).addTo(group);

      // Clic pour sélectionner la parcelle
      polygon.on("click", () => {
        onSelectField(field.id);
      });

      // Infobulle permanente ou au survol
      polygon.bindTooltip(
        `<div class="text-xs font-bold text-slate-900">${field.name}<br/><span class="text-emerald-700 font-mono">${(
          field.areaHa || field.areaM2 / 10000
        ).toFixed(2)} ha</span>${ndviBadge}</div>`,
        {
          permanent: isSelected,
          direction: "center",
          className: "bg-white/95 rounded-lg border border-emerald-500/30 px-2 py-1 shadow-sm font-sans",
        }
      );

      // Bornes géodésiques (si couche active)
      if (layers.bornes) {
        field.points.forEach((pt, idx) => {
          L.circleMarker([pt.lat, pt.lng], {
            radius: isSelected ? 5.5 : 4,
            color: "#e11d48",
            fillColor: "#fb7185",
            fillOpacity: 0.9,
            weight: 2,
          })
            .addTo(group)
            .bindTooltip(`B${idx + 1}`, {
              permanent: false,
              direction: "top",
              className: "text-[10px] font-mono font-bold",
            });
        });
      }
    });
  }, [fields, selectedFieldId, layers.parcelles, layers.bornes, layers.ndviSentinel2, onSelectField]);

  // 4. Gestion des clics de digitalisation (Tracé de polygone)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeTool !== "polygon") {
      setDrawingPoints([]);
      drawingLayerGroupRef.current?.clearLayers();
      return;
    }

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const newPoint: GeoPoint = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        label: `Borne P${drawingPoints.length + 1}`,
      };
      setDrawingPoints((prev) => [...prev, newPoint]);
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [activeTool, drawingPoints.length]);

  // 5. Affichage du polygone en cours de tracé
  useEffect(() => {
    const group = drawingLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (drawingPoints.length === 0) return;

    // Bornes en cours
    drawingPoints.forEach((pt, idx) => {
      L.circleMarker([pt.lat, pt.lng], {
        radius: 6,
        color: "#f59e0b",
        fillColor: "#fbbf24",
        fillOpacity: 0.9,
        weight: 2,
      })
        .addTo(group)
        .bindTooltip(`P${idx + 1}`, { permanent: true, direction: "top", className: "text-xs font-bold font-mono" });
    });

    // Ligne ou polygone
    const latlngs = drawingPoints.map((p) => [p.lat, p.lng] as L.LatLngTuple);
    if (drawingPoints.length >= 3) {
      L.polygon(latlngs, {
        color: "#f59e0b",
        fillColor: "#fbbf24",
        weight: 2.5,
        fillOpacity: 0.25,
        dashArray: "6, 6",
      }).addTo(group);
    } else if (drawingPoints.length === 2) {
      L.polyline(latlngs, {
        color: "#f59e0b",
        weight: 2,
        dashArray: "4, 4",
      }).addTo(group);
    }
  }, [drawingPoints]);

  // Calcul surface en cours de tracé
  const currentDrawingAreaM2 = calculatePolygonAreaM2(drawingPoints);
  const currentDrawingAreaHa = Math.round((currentDrawingAreaM2 / 10000) * 100) / 100;

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-border shadow-md bg-slate-950">
      {/* Conteneur Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Barre d'information & mode d'édition en cours (Digitalisation active) */}
      {activeTool === "polygon" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/85 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-amber-500/40 shadow-xl flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Tracé Polygone Parcelle
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          <div className="text-xs font-mono font-bold text-white">
            {drawingPoints.length} points • {currentDrawingAreaHa} ha ({Math.round(currentDrawingAreaM2)} m²)
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <Button
              size="sm"
              disabled={drawingPoints.length < 3}
              onClick={() => {
                if (onFinishNewPolygon && drawingPoints.length >= 3) {
                  onFinishNewPolygon(drawingPoints);
                  setDrawingPoints([]);
                }
              }}
              className="h-7 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              <Check className="h-3 w-3" />
              <span>Valider</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={drawingPoints.length === 0}
              onClick={() => setDrawingPoints((prev) => prev.slice(0, -1))}
              className="h-7 px-2 text-xs border-white/20 text-white hover:bg-white/10"
              title="Annuler le dernier point"
            >
              <Undo2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDrawingPoints([]);
                if (onCancelDrawing) onCancelDrawing();
              }}
              className="h-7 px-2 text-xs text-rose-300 hover:bg-rose-950/40"
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Boussole d'orientation Nord (Standard SIG) */}
      <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md text-white p-2 rounded-xl border border-white/15 shadow-md flex flex-col items-center select-none">
        <span className="text-[10px] font-black text-rose-500 font-mono">N</span>
        <Compass className="h-5 w-5 text-white/90 my-0.5" />
        <span className="text-[9px] font-bold text-white/60">30N</span>
      </div>

      {/* Contrôles de zoom custom (Haut-gauche) */}
      <div className="absolute bottom-10 left-4 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-8 h-8 rounded-xl bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 shadow-md transition-colors"
          title="Zoom avant"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-8 h-8 rounded-xl bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 shadow-md transition-colors"
          title="Zoom arrière"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>

      {/* Barre d'état métrique et coordonnées QGIS en bas */}
      <div className="absolute bottom-0 inset-x-0 z-10 bg-slate-950/90 backdrop-blur-md text-slate-300 px-3 py-1.5 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] font-mono select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SCR : EPSG:32630 (UTM 30N)
          </span>
          <span className="text-white/40">|</span>
          <span>
            Lat : <strong className="text-white">{cursorCoords.lat}°</strong> N
          </span>
          <span>
            Lng : <strong className="text-white">{cursorCoords.lng}°</strong> W
          </span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline">
            X : <strong className="text-white">{cursorCoords.eastingM.toLocaleString()} m</strong>
          </span>
          <span className="hidden sm:inline">
            Y : <strong className="text-white">{cursorCoords.northingM.toLocaleString()} m</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span>Échelle : 1:2500</span>
          <span className="text-white/40">•</span>
          <span>WGS 84 GRS80</span>
        </div>
      </div>
    </div>
  );
};
