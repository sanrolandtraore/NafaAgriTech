import React, { useRef, useState, useEffect, useCallback } from "react";
import { FarmZoningItem, FarmZoningPlan } from "@/lib/nafaGeniusEngine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Compass, RotateCw, ZoomIn, ZoomOut, Move, Download, Eye, Sparkles,
  Ruler, Layers, CheckCircle2, Sliders, Maximize2
} from "lucide-react";
import { toast } from "sonner";

interface FarmZoningCanvasProps {
  plan: FarmZoningPlan;
  onPlanChange?: (updatedItems: FarmZoningItem[]) => void;
  onSnapshotReady?: (dataUrl: string) => void;
}

export const FarmZoningCanvas: React.FC<FarmZoningCanvasProps> = ({
  plan,
  onPlanChange,
  onSnapshotReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<FarmZoningItem[]>(plan.items);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [showBioclimaticOverlay, setShowBioclimaticOverlay] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);

  // Synchroniser les éléments lorsque le plan parent change
  useEffect(() => {
    setItems(plan.items);
  }, [plan.items]);

  const selectedItem = items.find((it) => it.id === selectedId);

  // Redessiner le canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Fond de parcelle (teinte sable / terre fertile sahélienne)
    ctx.clearRect(0, 0, width, height);

    // Grille métrique de fond (1 carreau = 10m de terrain)
    ctx.strokeStyle = "rgba(226, 232, 240, 0.75)";
    ctx.lineWidth = 1;
    const gridSize = 35 * scale;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Polygone de clôture du terrain (bordure de parcelle)
    const padX = width * 0.08;
    const padY = height * 0.10;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    // Métrés réels de la parcelle
    const areaHa = plan.survey.areaHa || 1.5;
    const areaM2 = plan.survey.areaM2 || areaHa * 10000;
    const approxWidthM = Math.round(Math.sqrt(areaM2) * 1.25);
    const approxHeightM = Math.round(areaM2 / approxWidthM);

    ctx.save();
    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 3.5;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(padX, padY, plotW, plotH);
    ctx.restore();

    // Remplissage léger du terrain
    ctx.fillStyle = "rgba(240, 253, 244, 0.45)";
    ctx.fillRect(padX, padY, plotW, plotH);

    // Rose des Vents & Axe Bioclimatique
    if (showBioclimaticOverlay) {
      ctx.save();
      const compassX = width - 55;
      const compassY = 55;

      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(compassX, compassY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Aiguille Nord (Rouge)
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(compassX, compassY - 18);
      ctx.lineTo(compassX - 5, compassY);
      ctx.lineTo(compassX + 5, compassY);
      ctx.closePath();
      ctx.fill();

      // Aiguille Sud (Bleu)
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.moveTo(compassX, compassY + 18);
      ctx.lineTo(compassX - 5, compassY);
      ctx.lineTo(compassX + 5, compassY);
      ctx.closePath();
      ctx.fill();

      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = "#ef4444";
      ctx.fillText("N", compassX - 4, compassY - 20);

      // Trait d'axe bioclimatique Est-Ouest recommandé
      ctx.strokeStyle = "rgba(234, 179, 8, 0.55)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(padX, padY + plotH * 0.25);
      ctx.lineTo(padX + plotW, padY + plotH * 0.25);
      ctx.stroke();

      ctx.font = "italic 11px sans-serif";
      ctx.fillStyle = "#b45309";
      ctx.fillText("Axe Bioclimatique Est -> Ouest (90° CIRAD / FAO)", padX + 15, padY + plotH * 0.25 - 6);
      ctx.restore();
    }

    // Dessin de chaque élément du zonage
    items.forEach((item) => {
      const itemX = padX + (item.xPct / 100) * plotW;
      const itemY = padY + (item.yPct / 100) * plotH;
      const itemW = Math.max(35, (item.widthPct / 100) * plotW);
      const itemH = Math.max(28, (item.heightPct / 100) * plotH);

      ctx.save();
      const isSelected = item.id === selectedId;

      // Ombre portée
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = isSelected ? 14 : 6;
      ctx.shadowOffsetY = 3;

      // Remplissage selon l'élément
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.roundRect(itemX, itemY, itemW, itemH, 6);
      ctx.fill();

      // Bordure
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = isSelected ? "#0284c7" : "rgba(0, 0, 0, 0.35)";
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      // Poignées de redimensionnement si sélectionné
      if (isSelected) {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2;
        const handleSize = 7;
        // 4 coins
        ctx.fillRect(itemX - handleSize / 2, itemY - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(itemX - handleSize / 2, itemY - handleSize / 2, handleSize, handleSize);

        ctx.fillRect(itemX + itemW - handleSize / 2, itemY - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(itemX + itemW - handleSize / 2, itemY - handleSize / 2, handleSize, handleSize);

        ctx.fillRect(itemX + itemW - handleSize / 2, itemY + itemH - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(itemX + itemW - handleSize / 2, itemY + itemH - handleSize / 2, handleSize, handleSize);

        ctx.fillRect(itemX - handleSize / 2, itemY + itemH - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(itemX - handleSize / 2, itemY + itemH - handleSize / 2, handleSize, handleSize);
      }

      // Textures internes selon type
      if (item.type === "crop_plot") {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1.5;
        for (let ry = itemY + 8; ry < itemY + itemH - 4; ry += 8) {
          ctx.beginPath();
          ctx.moveTo(itemX + 6, ry);
          ctx.lineTo(itemX + itemW - 6, ry);
          ctx.stroke();
        }
      } else if (item.type === "poultry_house") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.fillRect(itemX + 6, itemY + itemH / 2 - 3, itemW - 12, 6);
      } else if (item.type === "solar_array") {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = 1;
        const cellW = (itemW - 10) / 4;
        for (let c = 0; c < 4; c++) {
          ctx.strokeRect(itemX + 5 + c * cellW, itemY + 5, cellW - 2, itemH - 10);
        }
      } else if (item.type === "water_tower") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.beginPath();
        ctx.arc(itemX + itemW / 2, itemY + itemH / 2, Math.min(itemW, itemH) * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Libellé de l'infrastructure
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const text = item.label;
      const truncated = text.length > 28 ? text.slice(0, 26) + "..." : text;
      ctx.fillText(truncated, itemX + itemW / 2, itemY + itemH / 2);

      // Cotes métriques individuelles de l'infrastructure si activées
      if (showDimensions) {
        const itemWidthM = Math.round((item.widthPct / 100) * approxWidthM);
        const itemHeightM = Math.round((item.heightPct / 100) * approxHeightM);
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`${itemWidthM}m × ${itemHeightM}m`, itemX + itemW / 2, itemY + itemH - 8);
      }

      ctx.restore();
    });

    // ── LIGNES DE COTATIONS PROFESSIONNELLES (DIMENSION LINES) ──
    if (showDimensions) {
      ctx.save();
      ctx.strokeStyle = "#0284c7";
      ctx.fillStyle = "#0284c7";
      ctx.lineWidth = 1.5;

      // 1. Cotation Supérieure (Largeur Nord de la parcelle)
      const dimTopY = padY - 14;
      ctx.beginPath();
      ctx.moveTo(padX, dimTopY);
      ctx.lineTo(padX + plotW, dimTopY);
      // Flèches d'extrémité
      ctx.moveTo(padX, dimTopY - 6);
      ctx.lineTo(padX, dimTopY + 6);
      ctx.moveTo(padX + plotW, dimTopY - 6);
      ctx.lineTo(padX + plotW, dimTopY + 6);
      ctx.stroke();

      // Texte de cote au centre
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#0369a1";
      ctx.fillText(`⟵  Largeur Nord : ${approxWidthM} m  ⟶`, padX + plotW / 2, dimTopY - 5);

      // 2. Cotation Droite (Longueur Est de la parcelle)
      const dimRightX = padX + plotW + 16;
      ctx.beginPath();
      ctx.moveTo(dimRightX, padY);
      ctx.lineTo(dimRightX, padY + plotH);
      // Flèches d'extrémité
      ctx.moveTo(dimRightX - 6, padY);
      ctx.lineTo(dimRightX + 6, padY);
      ctx.moveTo(dimRightX - 6, padY + plotH);
      ctx.lineTo(dimRightX + 6, padY + plotH);
      ctx.stroke();

      // Texte de cote vertical
      ctx.save();
      ctx.translate(dimRightX + 16, padY + plotH / 2);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText(`⟵  Longueur Est : ${approxHeightM} m  ⟶`, 0, 0);
      ctx.restore();

      ctx.restore();
    }

    // Échelle graphique normalisée en bas à gauche
    ctx.save();
    const scaleBarX = padX + 6;
    const scaleBarY = height - 16;
    const segmentWidth = 25 * scale; // 25px = 10 mètres
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(scaleBarX, scaleBarY, segmentWidth, 4);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    ctx.strokeRect(scaleBarX, scaleBarY, segmentWidth * 4, 4);
    ctx.fillRect(scaleBarX + segmentWidth, scaleBarY, segmentWidth, 4);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(scaleBarX + segmentWidth * 2, scaleBarY, segmentWidth, 4);

    ctx.fillStyle = "#334155";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("0m", scaleBarX, scaleBarY - 4);
    ctx.fillText("10m", scaleBarX + segmentWidth - 6, scaleBarY - 4);
    ctx.fillText("20m", scaleBarX + segmentWidth * 2 - 6, scaleBarY - 4);
    ctx.fillText("50m", scaleBarX + segmentWidth * 4 - 6, scaleBarY - 4);
    ctx.fillText("Échelle métrique graphique", scaleBarX + segmentWidth * 4 + 14, scaleBarY + 2);
    ctx.restore();
  }, [items, selectedId, scale, showBioclimaticOverlay, showDimensions, plan.survey.areaHa, plan.survey.areaM2]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Snapshot pour PDF
  useEffect(() => {
    if (onSnapshotReady && canvasRef.current) {
      try {
        const dataUrl = canvasRef.current.toDataURL("image/png");
        onSnapshotReady(dataUrl);
      } catch {
        // Ignorer
      }
    }
  }, [items, onSnapshotReady]);

  // Interaction souris
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const padX = canvas.width * 0.08;
    const padY = canvas.height * 0.10;
    const plotW = canvas.width - padX * 2;
    const plotH = canvas.height - padY * 2;

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const itemX = padX + (item.xPct / 100) * plotW;
      const itemY = padY + (item.yPct / 100) * plotH;
      const itemW = Math.max(35, (item.widthPct / 100) * plotW);
      const itemH = Math.max(28, (item.heightPct / 100) * plotH);

      if (clickX >= itemX && clickX <= itemX + itemW && clickY >= itemY && clickY <= itemY + itemH) {
        setSelectedId(item.id);
        setDraggingId(item.id);
        setDragOffset({ x: clickX - itemX, y: clickY - itemY });
        return;
      }
    }

    setSelectedId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const curX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const curY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const padX = canvas.width * 0.08;
    const padY = canvas.height * 0.10;
    const plotW = canvas.width - padX * 2;
    const plotH = canvas.height - padY * 2;

    const newX = curX - dragOffset.x;
    const newY = curY - dragOffset.y;

    const newXPct = Math.max(0, Math.min(88, Math.round(((newX - padX) / plotW) * 100)));
    const newYPct = Math.max(0, Math.min(88, Math.round(((newY - padY) / plotH) * 100)));

    const updated = items.map((it) => (it.id === draggingId ? { ...it, xPct: newXPct, yPct: newYPct } : it));
    setItems(updated);
    if (onPlanChange) onPlanChange(updated);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Ajustement des dimensions par l'expert
  const handleUpdateItemDimensions = (newWPct: number, newHPct: number) => {
    if (!selectedId) return;
    const updated = items.map((it) =>
      it.id === selectedId
        ? {
            ...it,
            widthPct: Math.max(5, Math.min(80, newWPct)),
            heightPct: Math.max(5, Math.min(60, newHPct)),
          }
        : it
    );
    setItems(updated);
    if (onPlanChange) onPlanChange(updated);
  };

  const downloadCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `plan_2d_cote_${plan.projectName.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Plan 2D professionnel coté exporté en image haute définition !");
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-card rounded-xl border border-border p-4 shadow-xs" ref={containerRef}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-semibold gap-1">
            <Sparkles className="h-3 w-3" /> Plan 2D Coté Professionnel
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Cotations métriques, dimensions et légendes normalisées CIRAD/FAO.
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant={showDimensions ? "default" : "outline"}
            className="h-8 text-xs gap-1"
            onClick={() => setShowDimensions(!showDimensions)}
          >
            <Ruler className="h-3.5 w-3.5" />
            {showDimensions ? "Cotes affichées" : "Afficher cotations"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => setShowBioclimaticOverlay(!showBioclimaticOverlay)}
          >
            <Compass className="h-3.5 w-3.5 text-amber-600" />
            {showBioclimaticOverlay ? "Masquer rose" : "Axe Est-Ouest"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => setScale((s) => Math.min(1.4, s + 0.1))}
            title="Zoom avant"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
            title="Zoom arrière"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            onClick={downloadCanvasImage}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1 shadow-xs"
          >
            <Download className="h-3.5 w-3.5" /> Exporter Plan 2D HD
          </Button>
        </div>
      </div>

      {/* Surface du Canvas interactif */}
      <div className="relative w-full overflow-hidden rounded-lg border border-border/80 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full h-auto max-h-[540px] object-contain cursor-crosshair select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Panneau de réglage dynamique des dimensions par l'expert */}
      {selectedItem && (
        <div className="p-3 rounded-lg border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-sky-600" />
            <span className="font-bold text-foreground">Élément sélectionné : {selectedItem.label}</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">Largeur (%) :</Label>
              <Input
                type="number"
                value={selectedItem.widthPct}
                onChange={(e) => handleUpdateItemDimensions(Number(e.target.value), selectedItem.heightPct)}
                className="h-7 w-16 text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">Hauteur (%) :</Label>
              <Input
                type="number"
                value={selectedItem.heightPct}
                onChange={(e) => handleUpdateItemDimensions(selectedItem.widthPct, Number(e.target.value))}
                className="h-7 w-16 text-xs font-mono"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedId(null)}
              className="h-7 text-xs"
            >
              Terminer
            </Button>
          </div>
        </div>
      )}

      {/* Légende Technique Normalisée */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
          <div className="h-3.5 w-3.5 rounded-xs bg-[#0284c7] shrink-0" />
          <span className="truncate">Forage & Station Pompage</span>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
          <div className="h-3.5 w-3.5 rounded-xs bg-[#0369a1] shrink-0" />
          <span className="truncate">Château d'eau 10m³ (H=8m)</span>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
          <div className="h-3.5 w-3.5 rounded-xs bg-[#f97316] shrink-0" />
          <span className="truncate">Bâtiment Avicole Bioclimatique</span>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
          <div className="h-3.5 w-3.5 rounded-xs bg-[#16a34a] shrink-0" />
          <span className="truncate">Zone Maraîchère Goutte-à-Goutte</span>
        </div>
      </div>
    </div>
  );
};
