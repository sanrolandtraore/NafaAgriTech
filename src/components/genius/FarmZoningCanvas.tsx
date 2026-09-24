import React, { useRef, useState, useEffect, useCallback } from "react";
import { FarmZoningItem, FarmZoningPlan } from "@/lib/nafaGeniusEngine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, RotateCw, ZoomIn, ZoomOut, Move, Download, Eye, Sparkles } from "lucide-react";
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

  // Sync internal items when prop changes
  useEffect(() => {
    setItems(plan.items);
  }, [plan.items]);

  // Redraw canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Fond de parcelle (teinte sable / terre fertile sahélienne)
    ctx.clearRect(0, 0, width, height);

    // Grille métrique de fond
    ctx.strokeStyle = "rgba(226, 232, 240, 0.7)";
    ctx.lineWidth = 1;
    const gridSize = 40 * scale;
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
    const padX = width * 0.04;
    const padY = height * 0.05;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    ctx.save();
    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(padX, padY, plotW, plotH);
    ctx.restore();

    // Remplissage léger du terrain
    ctx.fillStyle = "rgba(240, 253, 244, 0.45)";
    ctx.fillRect(padX, padY, plotW, plotH);

    // Overlay Bioclimatique : Rose des vents & Axe Est-Ouest
    if (showBioclimaticOverlay) {
      ctx.save();
      // Flèche Sud / Nord
      const compassX = width - 60;
      const compassY = 65;

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(compassX, compassY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Aiguille Nord (Rouge)
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(compassX, compassY - 20);
      ctx.lineTo(compassX - 6, compassY);
      ctx.lineTo(compassX + 6, compassY);
      ctx.closePath();
      ctx.fill();

      // Aiguille Sud (Bleu)
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.moveTo(compassX, compassY + 20);
      ctx.lineTo(compassX - 6, compassY);
      ctx.lineTo(compassX + 6, compassY);
      ctx.closePath();
      ctx.fill();

      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = "#ef4444";
      ctx.fillText("N", compassX - 4, compassY - 22);

      // Trait d'axe bioclimatique Est-Ouest recommandé
      ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padX, padY + plotH * 0.25);
      ctx.lineTo(padX + plotW, padY + plotH * 0.25);
      ctx.stroke();

      ctx.font = "italic 11px sans-serif";
      ctx.fillStyle = "#b45309";
      ctx.fillText("Axe Solaire Est -> Ouest (Axe idéal des bâtiments avicoles)", padX + 15, padY + plotH * 0.25 - 6);
      ctx.restore();
    }

    // Dessin de chaque élément du zonage
    items.forEach((item) => {
      const itemX = padX + (item.xPct / 100) * plotW;
      const itemY = padY + (item.yPct / 100) * plotH;
      const itemW = Math.max(30, (item.widthPct / 100) * plotW);
      const itemH = Math.max(25, (item.heightPct / 100) * plotH);

      ctx.save();
      const isSelected = item.id === selectedId;

      // Ombre portée
      ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
      ctx.shadowBlur = isSelected ? 12 : 5;
      ctx.shadowOffsetY = 3;

      // Remplissage selon l'élément
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.roundRect(itemX, itemY, itemW, itemH, 6);
      ctx.fill();

      // Bordure
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = isSelected ? "#0284c7" : "rgba(0, 0, 0, 0.25)";
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.stroke();

      // Dessin des icônes/textures internes selon le type
      if (item.type === "crop_plot") {
        // Lignes de rangs de culture (goutte-à-goutte)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1.5;
        for (let ry = itemY + 8; ry < itemY + itemH - 4; ry += 8) {
          ctx.beginPath();
          ctx.moveTo(itemX + 6, ry);
          ctx.lineTo(itemX + itemW - 6, ry);
          ctx.stroke();
        }
      } else if (item.type === "poultry_house") {
        // Lanterneau central de ventilation faîtière
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(itemX + 6, itemY + itemH / 2 - 3, itemW - 12, 6);
      } else if (item.type === "solar_array") {
        // Trame de panneaux solaires
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 1;
        const cellW = (itemW - 10) / 4;
        for (let c = 0; c < 4; c++) {
          ctx.strokeRect(itemX + 5 + c * cellW, itemY + 5, cellW - 2, itemH - 10);
        }
      } else if (item.type === "water_tower") {
        // Réservoir circulaire central
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(itemX + itemW / 2, itemY + itemH / 2, Math.min(itemW, itemH) * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Libellé de l'infrastructure
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Badge de texte lisible
      const text = item.label;
      const truncated = text.length > 28 ? text.slice(0, 26) + "..." : text;
      ctx.fillText(truncated, itemX + itemW / 2, itemY + itemH / 2);

      ctx.restore();
    });

    // Échelle graphique en bas à gauche
    ctx.save();
    ctx.fillStyle = "#334155";
    ctx.font = "10px sans-serif";
    ctx.fillText("Échelle : 1 carreau ≈ 10 mètres", padX + 6, height - 12);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padX + 6, height - 8);
    ctx.lineTo(padX + 56, height - 8);
    ctx.stroke();
    ctx.restore();
  }, [items, selectedId, scale, showBioclimaticOverlay]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Export de l'image de synthèse pour le rapport PDF
  useEffect(() => {
    if (onSnapshotReady && canvasRef.current) {
      try {
        const dataUrl = canvasRef.current.toDataURL("image/png");
        onSnapshotReady(dataUrl);
      } catch {
        // Ignorer si snapshot non dispo
      }
    }
  }, [items, onSnapshotReady]);

  // Gestion du glisser-déposer sur le Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const padX = canvas.width * 0.04;
    const padY = canvas.height * 0.05;
    const plotW = canvas.width - padX * 2;
    const plotH = canvas.height - padY * 2;

    // Détection de l'élément cliqué (parcours inverse pour sélectionner le premier au-dessus)
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const itemX = padX + (item.xPct / 100) * plotW;
      const itemY = padY + (item.yPct / 100) * plotH;
      const itemW = Math.max(30, (item.widthPct / 100) * plotW);
      const itemH = Math.max(25, (item.heightPct / 100) * plotH);

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

    const padX = canvas.width * 0.04;
    const padY = canvas.height * 0.05;
    const plotW = canvas.width - padX * 2;
    const plotH = canvas.height - padY * 2;

    const newX = curX - dragOffset.x;
    const newY = curY - dragOffset.y;

    const newXPct = Math.max(0, Math.min(90, Math.round(((newX - padX) / plotW) * 100)));
    const newYPct = Math.max(0, Math.min(90, Math.round(((newY - padY) / plotH) * 100)));

    const updated = items.map((it) => (it.id === draggingId ? { ...it, xPct: newXPct, yPct: newYPct } : it));
    setItems(updated);
    if (onPlanChange) onPlanChange(updated);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const downloadCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `plan_zonage_${plan.projectName.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Plan vectoriel exporté en image haute définition !");
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-card rounded-xl border border-border p-4 shadow-xs" ref={containerRef}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-semibold gap-1">
            <Sparkles className="h-3 w-3" /> Plan Vectoriel 2D Intéractif
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Faites glisser les infrastructures pour adapter le schéma d'aménagement.
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => setShowBioclimaticOverlay(!showBioclimaticOverlay)}
          >
            <Compass className="h-3.5 w-3.5 text-amber-600" />
            {showBioclimaticOverlay ? "Masquer rose des vents" : "Afficher axe solaire"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => setScale((s) => Math.min(1.4, s + 0.1))}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={downloadCanvasImage}
          >
            <Download className="h-3.5 w-3.5" /> Exporter PNG
          </Button>
        </div>
      </div>

      {/* Surface du Canvas interactif */}
      <div className="relative w-full overflow-hidden rounded-lg border border-border/80 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={900}
          height={520}
          className="w-full h-auto max-h-[520px] object-contain cursor-crosshair select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Légende rapide des infrastructures */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
          <div className="h-3.5 w-3.5 rounded-xs bg-[#0284c7] shrink-0" />
          <span className="truncate">Forage & Pompe Solaire</span>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
          <div className="h-3.5 w-3.5 rounded-xs bg-[#0369a1] shrink-0" />
          <span className="truncate">Château d'eau 10m³</span>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
          <div className="h-3.5 w-3.5 rounded-xs bg-[#f97316] shrink-0" />
          <span className="truncate">Bâtiment Avicole E-O</span>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
          <div className="h-3.5 w-3.5 rounded-xs bg-[#16a34a] shrink-0" />
          <span className="truncate">Maraîchage Goutte-à-Goutte</span>
        </div>
      </div>
    </div>
  );
};
