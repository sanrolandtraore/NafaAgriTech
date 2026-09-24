import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PenTool,
  Eraser,
  RotateCcw,
  Download,
  Palette,
  Check,
  Maximize2,
} from "lucide-react";

interface InspectionInteractiveSketchProps {
  initialDataUrl?: string | null;
  onSaveSketch: (dataUrl: string) => void;
  readOnly?: boolean;
}

const COLORS = [
  { label: "Noir", value: "#0f172a" },
  { label: "Vert Agence", value: "#15803d" },
  { label: "Bleu Eau", value: "#0284c7" },
  { label: "Rouge Alerte", value: "#dc2626" },
  { label: "Orange Cote", value: "#d97706" },
];

export default function InspectionInteractiveSketch({
  initialDataUrl,
  onSaveSketch,
  readOnly = false,
}: InspectionInteractiveSketchProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0].value);
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [hasContent, setHasContent] = useState(Boolean(initialDataUrl));

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set background to clean grid / white
    if (!initialDataUrl) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawGrid(ctx, canvas.width, canvas.height);
    } else {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialDataUrl;
    }
  }, [initialDataUrl]);

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    const step = 25;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? "#ffffff" : color;
    ctx.lineWidth = isEraser ? lineWidth * 3 : lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      onSaveSketch(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);
    setHasContent(false);
    onSaveSketch("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <PenTool className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Croquis de terrain interactif</span>
          <Badge variant="outline" className="text-[10px] text-muted-foreground ml-1">
            Grille métrique
          </Badge>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Palette de couleurs */}
            <div className="flex items-center gap-1 border border-border p-1 rounded-lg bg-card">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setColor(c.value);
                    setIsEraser(false);
                  }}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    color === c.value && !isEraser ? "ring-2 ring-primary scale-110" : ""
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>

            {/* Outil gomme */}
            <Button
              type="button"
              size="sm"
              variant={isEraser ? "default" : "outline"}
              onClick={() => setIsEraser(!isEraser)}
              className="h-7 text-xs px-2"
              title="Gomme"
            >
              <Eraser className="h-3.5 w-3.5 mr-1" />
              Gomme
            </Button>

            {/* Effacer tout */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClear}
              className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
              title="Réinitialiser le croquis"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Surface tactile Canvas */}
      <div className="relative border border-border rounded-xl overflow-hidden shadow-xs bg-white touch-none">
        <canvas
          ref={canvasRef}
          width={640}
          height={320}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-auto cursor-crosshair block"
        />
        {!hasContent && !readOnly && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-muted-foreground/50 text-xs italic">
            Touchez ou cliquez pour tracer le schéma (parcelle, réseau, vanne, réservoir...)
          </div>
        )}
      </div>
    </div>
  );
}
