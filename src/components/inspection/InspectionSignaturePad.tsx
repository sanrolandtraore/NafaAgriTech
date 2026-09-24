import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Check, CheckCircle2 } from "lucide-react";

interface InspectionSignaturePadProps {
  title: string;
  signerName: string;
  role: "client" | "expert";
  initialSignatureUrl?: string | null;
  onSaveSignature: (signatureDataUrl: string) => void;
  readOnly?: boolean;
}

export default function InspectionSignaturePad({
  title,
  signerName,
  role,
  initialSignatureUrl,
  onSaveSignature,
  readOnly = false,
}: InspectionSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(initialSignatureUrl));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!initialSignatureUrl) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Ligne de signature en pointillé
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(20, canvas.height - 25);
      ctx.lineTo(canvas.width - 20, canvas.height - 25);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialSignatureUrl;
    }
  }, [initialSignatureUrl]);

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
    ctx.strokeStyle = role === "expert" ? "#1e3a8a" : "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      onSaveSignature(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 25);
    ctx.lineTo(canvas.width - 20, canvas.height - 25);
    ctx.stroke();
    ctx.setLineDash([]);

    setHasSignature(false);
    onSaveSignature("");
  };

  return (
    <div className="space-y-2 p-3 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-foreground">{title}</span>
          {hasSignature ? (
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1">
              <Check className="h-3 w-3" /> Signé
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
              En attente
            </Badge>
          )}
        </div>

        {!readOnly && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="h-6 text-[10px] text-muted-foreground hover:text-destructive px-1.5"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Effacer
          </Button>
        )}
      </div>

      <div className="relative border border-border/80 rounded-lg overflow-hidden bg-white touch-none">
        <canvas
          ref={canvasRef}
          width={400}
          height={140}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-auto cursor-crosshair block"
        />
        {!hasSignature && !readOnly && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-muted-foreground/40 text-[11px] italic">
            Signer avec le doigt ou le stylet ici
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
        <span>Signataire : <strong className="text-foreground">{signerName || "Non spécifié"}</strong></span>
        <span className="text-[10px]">Certification horodatée</span>
      </div>
    </div>
  );
}
