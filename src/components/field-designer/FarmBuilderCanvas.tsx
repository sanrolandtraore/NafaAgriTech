/**
 * NAFA FIELD DESIGNER — FARM BUILDER (CONCEPTEUR DE FERME 2D AVEC GRILLE)
 * Canvas interactif 2D avec grille métrique, glisser-déplacer, rotation,
 * redimensionnement, duplication et édition des propriétés de chaque objet.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FarmBuilding, BuildingType } from "@/types/fieldDesigner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  RotateCw,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Plus,
  Compass,
  Check,
  Building,
  Home,
  Droplets,
  Layers,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface FarmBuilderCanvasProps {
  buildings: FarmBuilding[];
  onSaveBuilding: (bld: FarmBuilding) => void;
  onDeleteBuilding: (id: string) => void;
  farmName?: string;
}

const OBJECT_TEMPLATES: {
  type: BuildingType;
  label: string;
  defaultLength: number;
  defaultWidth: number;
  defaultHeight: number;
  color: string;
  subType?: string;
}[] = [
  { type: "parcelle" as any, label: "Parcelle", defaultLength: 50, defaultWidth: 30, defaultHeight: 0, color: "#16a34a" },
  { type: "poulailler", label: "Poulailler", defaultLength: 20, defaultWidth: 9, defaultHeight: 3.8, color: "#ea580c", subType: "chair" },
  { type: "etable", label: "Étable bovine", defaultLength: 24, defaultWidth: 12, defaultHeight: 4.2, color: "#854d0e", subType: "engraissement" },
  { type: "bergerie", label: "Bergerie", defaultLength: 16, defaultWidth: 8, defaultHeight: 3.5, color: "#ca8a04", subType: "ovins" },
  { type: "porcherie", label: "Porcherie", defaultLength: 15, defaultWidth: 8, defaultHeight: 3.2, color: "#db2777" },
  { type: "clapier", label: "Clapier cunicole", defaultLength: 10, defaultWidth: 5, defaultHeight: 2.8, color: "#d97706" },
  { type: "pisciculture", label: "Bassin Piscicole", defaultLength: 12, defaultWidth: 6, defaultHeight: 1.5, color: "#0284c7" },
  { type: "forage", label: "Forage", defaultLength: 3, defaultWidth: 3, defaultHeight: 1.5, color: "#2563eb" },
  { type: "bassin", label: "Bassin d'eau", defaultLength: 10, defaultWidth: 10, defaultHeight: 2.0, color: "#0ea5e9" },
  { type: "chateau_eau", label: "Château d'eau", defaultLength: 4, defaultWidth: 4, defaultHeight: 8.0, color: "#3b82f6" },
  { type: "magasin", label: "Magasin d'intrants", defaultLength: 12, defaultWidth: 6, defaultHeight: 3.5, color: "#475569" },
  { type: "serre", label: "Serre maraîchère", defaultLength: 30, defaultWidth: 8, defaultHeight: 3.5, color: "#059669" },
  { type: "hangar", label: "Hangar agricole", defaultLength: 18, defaultWidth: 10, defaultHeight: 4.5, color: "#64748b" },
  { type: "logement", label: "Logement / Bureau", defaultLength: 10, defaultWidth: 8, defaultHeight: 3.2, color: "#9333ea" },
  { type: "route", label: "Route / Piste", defaultLength: 60, defaultWidth: 4, defaultHeight: 0.1, color: "#78716c" },
  { type: "cloture", label: "Clôture", defaultLength: 80, defaultWidth: 1, defaultHeight: 2.0, color: "#a8a29e" },
];

export const FarmBuilderCanvas: React.FC<FarmBuilderCanvasProps> = ({
  buildings,
  onSaveBuilding,
  onDeleteBuilding,
  farmName,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedBuilding = buildings.find((b) => b.id === selectedId);

  // Échelle : 1 mètre = 4 pixels au zoom 1.0
  const METERS_TO_PX = 4 * zoom;

  const handlePointerDownObject = (e: React.PointerEvent, bld: FarmBuilding) => {
    e.stopPropagation();
    setSelectedId(bld.id);
    setDraggingId(bld.id);
    setDragOffset({
      x: e.clientX - bld.posX * METERS_TO_PX,
      y: e.clientY - bld.posY * METERS_TO_PX,
    });
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    if (draggingId) {
      const bld = buildings.find((b) => b.id === draggingId);
      if (bld) {
        const newPosX = Math.max(0, Math.round((e.clientX - dragOffset.x) / METERS_TO_PX));
        const newPosY = Math.max(0, Math.round((e.clientY - dragOffset.y) / METERS_TO_PX));
        onSaveBuilding({
          ...bld,
          posX: newPosX,
          posY: newPosY,
        });
      }
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handlePointerUpCanvas = () => {
    setDraggingId(null);
    setIsPanning(false);
  };

  const handleStartPan = (e: React.PointerEvent) => {
    if (e.target === canvasRef.current) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedId(null);
    }
  };

  const addNewObject = (template: typeof OBJECT_TEMPLATES[0]) => {
    const newBld: FarmBuilding = {
      id: `bld_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      farmId: "active_farm",
      name: `${template.label} ${buildings.length + 1}`,
      buildingType: template.type,
      subType: template.subType || "standard",
      lengthM: template.defaultLength,
      widthM: template.defaultWidth,
      heightM: template.defaultHeight,
      areaM2: template.defaultLength * template.defaultWidth,
      orientation: "Est-Ouest",
      ventilation: "Naturelle",
      roofType: "Tôles Bac Aluzinc",
      wallMaterial: "Agglos ciment",
      equipment: [],
      posX: Math.round(20 + Math.random() * 30),
      posY: Math.round(20 + Math.random() * 30),
      rotationDeg: 0,
      color: template.color,
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSaveBuilding(newBld);
    setSelectedId(newBld.id);
  };

  const handleRotate = () => {
    if (!selectedBuilding) return;
    const nextRot = (selectedBuilding.rotationDeg + 45) % 360;
    onSaveBuilding({
      ...selectedBuilding,
      rotationDeg: nextRot,
    });
  };

  const handleDuplicate = () => {
    if (!selectedBuilding) return;
    const dup: FarmBuilding = {
      ...selectedBuilding,
      id: `bld_${Date.now()}_dup`,
      name: `${selectedBuilding.name} (Copie)`,
      posX: selectedBuilding.posX + 10,
      posY: selectedBuilding.posY + 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSaveBuilding(dup);
    setSelectedId(dup.id);
  };

  const handleDelete = () => {
    if (!selectedBuilding) return;
    onDeleteBuilding(selectedBuilding.id);
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[750px] min-h-[600px] w-full select-none bg-background rounded-3xl border border-border overflow-hidden">
      {/* ── BARRE D'OUTILS OBJETS GLISSABLES (Palette) ── */}
      {isPaletteOpen && (
        <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-border p-4 bg-muted/20 flex flex-col gap-3 overflow-y-auto shrink-0 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Objets de la Ferme
            </h3>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                {buildings.length} placés
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setIsPaletteOpen(false)}
                title="Masquer la palette pour 100% Espace Canvas"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Cliquez sur un objet pour le poser sur le plan d'aménagement :
          </p>

        <div className="grid grid-cols-2 gap-2">
          {OBJECT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.type + tmpl.label}
              onClick={() => addNewObject(tmpl)}
              className="flex items-center gap-1.5 p-2 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:bg-primary/5 text-left text-xs font-semibold transition-all shadow-2xs"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: tmpl.color }}
              />
              <span className="truncate">{tmpl.label}</span>
            </button>
          ))}
        </div>

        {/* ── PROPRIÉTÉS DE L'OBJET SÉLECTIONNÉ ── */}
        {selectedBuilding && (
          <div className="mt-auto pt-3 border-t border-border space-y-3 bg-card p-3 rounded-2xl border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">Propriétés</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleRotate} title="Rotation 45°">
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleDuplicate} title="Dupliquer">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={handleDelete} title="Supprimer">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-[11px]">Nom / Référence</Label>
              <Input
                value={selectedBuilding.name}
                onChange={(e) => onSaveBuilding({ ...selectedBuilding, name: e.target.value })}
                className="h-8 text-xs rounded-lg mt-0.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px]">Longueur (m)</Label>
                <Input
                  type="number"
                  value={selectedBuilding.lengthM}
                  onChange={(e) => {
                    const l = parseFloat(e.target.value) || 1;
                    onSaveBuilding({
                      ...selectedBuilding,
                      lengthM: l,
                      areaM2: Math.round(l * selectedBuilding.widthM),
                    });
                  }}
                  className="h-8 text-xs rounded-lg mt-0.5"
                />
              </div>
              <div>
                <Label className="text-[11px]">Largeur (m)</Label>
                <Input
                  type="number"
                  value={selectedBuilding.widthM}
                  onChange={(e) => {
                    const w = parseFloat(e.target.value) || 1;
                    onSaveBuilding({
                      ...selectedBuilding,
                      widthM: w,
                      areaM2: Math.round(selectedBuilding.lengthM * w),
                    });
                  }}
                  className="h-8 text-xs rounded-lg mt-0.5"
                />
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground flex justify-between pt-1">
              <span>Surface : <strong>{selectedBuilding.areaM2} m²</strong></span>
              <span>Rotation : <strong>{selectedBuilding.rotationDeg}°</strong></span>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ── CANVAS 2D INTERACTIF AVEC GRILLE MÉTRIQUE ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900">
        {/* Barre de contrôle haut (Palette, Zoom, Pan, Échelle) */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 text-white shadow-md">
          {!isPaletteOpen && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2.5 text-xs font-bold text-white hover:bg-slate-800 rounded-xl flex items-center gap-1.5"
                onClick={() => setIsPaletteOpen(true)}
                title="Afficher la palette d'objets"
              >
                <PanelLeftOpen className="h-4 w-4 text-emerald-400" />
                <span className="text-[11px]">Objets</span>
              </Button>
              <div className="h-4 w-px bg-slate-700" />
            </>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-slate-800 rounded-xl" onClick={() => setZoom((z) => Math.min(3.0, z + 0.2))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-slate-800 rounded-xl" onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-mono px-2">Zoom {(zoom * 100).toFixed(0)}%</span>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-[11px] font-mono text-emerald-400 px-2">1 carreau = 5m</span>
        </div>

        {/* Espace de dessin */}
        <div
          ref={canvasRef}
          onPointerDown={handleStartPan}
          onPointerMove={handlePointerMoveCanvas}
          onPointerUp={handlePointerUpCanvas}
          className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        >
          {/* Objets placés sur la ferme */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: "0 0",
            }}
            className="absolute inset-0 pointer-events-none"
          >
            {buildings.map((bld) => {
              const isSelected = bld.id === selectedId;
              const wPx = Math.max(16, bld.lengthM * METERS_TO_PX);
              const hPx = Math.max(16, bld.widthM * METERS_TO_PX);

              return (
                <div
                  key={bld.id}
                  onPointerDown={(e) => handlePointerDownObject(e, bld)}
                  style={{
                    position: "absolute",
                    left: `${bld.posX * METERS_TO_PX}px`,
                    top: `${bld.posY * METERS_TO_PX}px`,
                    width: `${wPx}px`,
                    height: `${hPx}px`,
                    transform: `rotate(${bld.rotationDeg}deg)`,
                    transformOrigin: "center center",
                    backgroundColor: bld.color || "#15803d",
                    borderColor: isSelected ? "#facc15" : "rgba(255,255,255,0.4)",
                  }}
                  className={`pointer-events-auto rounded-lg border-2 shadow-lg flex flex-col items-center justify-center p-1 cursor-move transition-transform ${
                    isSelected ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900" : ""
                  }`}
                >
                  <span className="text-[10px] font-bold text-white text-center leading-none drop-shadow-md truncate max-w-full">
                    {bld.name}
                  </span>
                  <span className="text-[9px] text-white/90 font-mono mt-0.5">
                    {bld.lengthM}m × {bld.widthM}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
