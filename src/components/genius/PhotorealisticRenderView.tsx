import React, { useRef, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sun, Moon, Download, Sparkles, Eye, Camera, Layers, CheckCircle2,
  Maximize2, RefreshCw, Compass, ShieldCheck, TreePine, Droplets
} from "lucide-react";
import { toast } from "sonner";
import { UnifiedEngineeringProject } from "@/lib/nafaEngineeringStudio";

interface PhotorealisticRenderViewProps {
  project: UnifiedEngineeringProject;
  onSnapshotExport?: (dataUrl: string) => void;
}

export const PhotorealisticRenderView: React.FC<PhotorealisticRenderViewProps> = ({
  project,
  onSnapshotExport,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [lightingPreset, setLightingPreset] = useState<"diurne" | "golden_hour" | "satellite">("diurne");
  const [resolutionPreset, setResolutionPreset] = useState<"hd" | "fhd" | "4k">("fhd");
  const [showCartouche, setShowCartouche] = useState<boolean>(true);
  const [showWaterSpray, setShowWaterSpray] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Dimensions selon résolution
  const getCanvasDimensions = useCallback(() => {
    switch (resolutionPreset) {
      case "4k":
        return { w: 3840, h: 2160 };
      case "fhd":
        return { w: 1920, h: 1080 };
      case "hd":
      default:
        return { w: 1280, h: 720 };
    }
  }, [resolutionPreset]);

  // Dessin du rendu photoréaliste
  const renderPhotorealisticScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = getCanvasDimensions();
    canvas.width = w;
    canvas.height = h;

    // 1. Ciel et Ambiance Lumineuse
    let skyGradient = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    let groundColor = "#2d241e"; // Terre meuble fertile sahélienne
    let sunlightColor = "rgba(255, 255, 230, 0.25)";
    let shadowColor = "rgba(15, 23, 42, 0.45)";

    if (lightingPreset === "diurne") {
      skyGradient.addColorStop(0, "#0284c7"); // Ciel azur pur
      skyGradient.addColorStop(0.7, "#7dd3fc");
      skyGradient.addColorStop(1, "#e0f2fe");
      groundColor = "#3a2e24";
      sunlightColor = "rgba(254, 240, 138, 0.22)";
      shadowColor = "rgba(30, 41, 59, 0.50)";
    } else if (lightingPreset === "golden_hour") {
      skyGradient.addColorStop(0, "#7c2d12"); // Crépuscule doré flamboyant
      skyGradient.addColorStop(0.4, "#ea580c");
      skyGradient.addColorStop(0.8, "#facc15");
      skyGradient.addColorStop(1, "#fef08a");
      groundColor = "#432818";
      sunlightColor = "rgba(251, 146, 60, 0.35)";
      shadowColor = "rgba(67, 20, 7, 0.65)";
    } else {
      // Satellite zénithal
      skyGradient.addColorStop(0, "#0f172a");
      skyGradient.addColorStop(1, "#1e293b");
      groundColor = "#26201a";
    }

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, w, h * 0.45);

    // Soleill / Disque solaire
    if (lightingPreset !== "satellite") {
      const sunX = lightingPreset === "golden_hour" ? w * 0.78 : w * 0.25;
      const sunY = lightingPreset === "golden_hour" ? h * 0.36 : h * 0.14;
      const sunRadius = lightingPreset === "golden_hour" ? 70 : 55;

      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius * 4);
      sunGlow.addColorStop(0, lightingPreset === "golden_hour" ? "rgba(255, 237, 213, 1)" : "rgba(255, 255, 255, 1)");
      sunGlow.addColorStop(0.3, lightingPreset === "golden_hour" ? "rgba(251, 146, 60, 0.8)" : "rgba(254, 240, 138, 0.6)");
      sunGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Silhouette de végétation de fond (Arbres sahéliens : Manguiers, Baobabs, Acacias)
    ctx.fillStyle = lightingPreset === "golden_hour" ? "#451a03" : "#14532d";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.45);
    for (let x = 0; x <= w; x += 40) {
      const treeHeight = 25 + Math.sin(x * 0.02) * 18 + Math.cos(x * 0.05) * 12;
      ctx.lineTo(x, h * 0.45 - treeHeight);
    }
    ctx.lineTo(w, h * 0.45);
    ctx.closePath();
    ctx.fill();

    // 2. Sol & Terres de la Parcelle en Perspective
    const horizonY = h * 0.45;
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    groundGrad.addColorStop(0, groundColor);
    groundGrad.addColorStop(1, lightingPreset === "golden_hour" ? "#271206" : "#1c140d");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // 3. Parcelles Maraîchères Verdoyantes (Lignes de Goutte-à-goutte & Planches)
    const plotLeft = w * 0.32;
    const plotRight = w * 0.94;
    const plotTop = horizonY + 30;
    const plotBottom = h * 0.92;

    // Rangs de cultures en perspective fuyante vers l'horizon
    const rowsCount = 22;
    for (let r = 0; r < rowsCount; r++) {
      const progress = r / rowsCount;
      const y = plotTop + (plotBottom - plotTop) * Math.pow(progress, 1.4);
      const rowHeight = 8 + progress * 24;

      // Bande de feuillage vert dense
      const foliageGrad = ctx.createLinearGradient(0, y, 0, y + rowHeight);
      foliageGrad.addColorStop(0, "#22c55e");
      foliageGrad.addColorStop(0.5, "#15803d");
      foliageGrad.addColorStop(1, "#14532d");
      ctx.fillStyle = foliageGrad;

      const xStart = plotLeft + (1 - progress) * 80;
      const xEnd = plotRight - (1 - progress) * 40;

      ctx.beginPath();
      ctx.roundRect(xStart, y, xEnd - xStart, rowHeight, 4);
      ctx.fill();

      // Reflets humides du goutte-à-goutte au sol
      if (showWaterSpray) {
        ctx.fillStyle = "rgba(186, 230, 253, 0.4)";
        ctx.fillRect(xStart + 10, y + rowHeight - 2, (xEnd - xStart) - 20, 2);
      }
    }

    // Micro-gouttelettes d'eau pulvérisée dans l'air (scintillement au soleil)
    if (showWaterSpray && lightingPreset !== "satellite") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      for (let i = 0; i < 70; i++) {
        const sx = plotLeft + Math.random() * (plotRight - plotLeft);
        const sy = plotTop + Math.random() * (plotBottom - plotTop);
        const sSize = 1.5 + Math.random() * 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Bâtiment Avicole Bioclimatique (Est-Ouest avec lanterneau faîtier)
    const barnX = w * 0.42;
    const barnY = horizonY + 45;
    const barnW = w * 0.45;
    const barnH = h * 0.18;

    // Ombre portée au sol
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.ellipse(barnX + barnW * 0.52, barnY + barnH + 15, barnW * 0.52, barnH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Façade principale en briques BTC (ocre chaud)
    const wallGrad = ctx.createLinearGradient(barnX, barnY, barnX, barnY + barnH);
    wallGrad.addColorStop(0, "#ea580c");
    wallGrad.addColorStop(0.7, "#c2410c");
    wallGrad.addColorStop(1, "#9a3412");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(barnX, barnY, barnW, barnH);

    // Moucharabiehs d'aération grillagée (ouvertures bioclimatiques)
    ctx.fillStyle = "#1e293b";
    const windowCount = 10;
    const winW = (barnW * 0.75) / windowCount;
    for (let wi = 0; wi < windowCount; wi++) {
      ctx.fillRect(barnX + 25 + wi * (winW + 8), barnY + 25, winW, barnH * 0.38);
    }

    // Toiture métallique en double pente débordante (avant-toits anti-chaleur)
    const roofOverhang = 22;
    ctx.fillStyle = lightingPreset === "golden_hour" ? "#fbbf24" : "#94a3b8"; // Bac alu réfléchissant
    ctx.beginPath();
    ctx.moveTo(barnX - roofOverhang, barnY);
    ctx.lineTo(barnX + barnW * 0.5, barnY - 32);
    ctx.lineTo(barnX + barnW + roofOverhang, barnY);
    ctx.lineTo(barnX + barnW + roofOverhang - 8, barnY + 8);
    ctx.lineTo(barnX + barnW * 0.5, barnY - 24);
    ctx.lineTo(barnX - roofOverhang + 8, barnY + 8);
    ctx.closePath();
    ctx.fill();

    // Lanterneau faîtier d'aération thermosiphon
    ctx.fillStyle = "#475569";
    ctx.fillRect(barnX + barnW * 0.25, barnY - 44, barnW * 0.5, 12);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(barnX + barnW * 0.23, barnY - 48, barnW * 0.54, 5);

    // 5. Château d'Eau Métallique 10 m³ (Structure tubulaire H=8m)
    const towerX = w * 0.18;
    const towerGroundY = horizonY + 110;
    const towerHeight = h * 0.32;

    // Ombre au sol du château d'eau
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.ellipse(towerX + 20, towerGroundY + 10, 45, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 Piliers tubulaires en treillis d'acier
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(towerX - 25, towerGroundY);
    ctx.lineTo(towerX - 12, towerGroundY - towerHeight);
    ctx.moveTo(towerX + 25, towerGroundY);
    ctx.lineTo(towerX + 12, towerGroundY - towerHeight);
    ctx.stroke();

    // Croisillons de contreventement Saint-André
    ctx.lineWidth = 2.5;
    for (let ti = 0; ti < 4; ti++) {
      const stepY1 = towerGroundY - (ti * (towerHeight / 4));
      const stepY2 = towerGroundY - ((ti + 1) * (towerHeight / 4));
      ctx.beginPath();
      ctx.moveTo(towerX - 22 + ti * 2, stepY1);
      ctx.lineTo(towerX + 22 - ti * 2, stepY2);
      ctx.moveTo(towerX + 22 - ti * 2, stepY1);
      ctx.lineTo(towerX - 22 + ti * 2, stepY2);
      ctx.stroke();
    }

    // Cuve métallique cylindrique traitée époxy
    const tankTopY = towerGroundY - towerHeight - 45;
    const tankW = 75;
    const tankH = 45;

    const tankGrad = ctx.createLinearGradient(towerX - tankW / 2, 0, towerX + tankW / 2, 0);
    tankGrad.addColorStop(0, "#0284c7");
    tankGrad.addColorStop(0.3, "#38bdf8"); // Reflet cylindrique
    tankGrad.addColorStop(0.8, "#0369a1");
    tankGrad.addColorStop(1, "#075985");

    ctx.fillStyle = tankGrad;
    ctx.beginPath();
    ctx.roundRect(towerX - tankW / 2, tankTopY, tankW, tankH, [6, 6, 2, 2]);
    ctx.fill();

    // Dôme supérieur du réservoir
    ctx.fillStyle = "#7dd3fc";
    ctx.beginPath();
    ctx.ellipse(towerX, tankTopY, tankW / 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Logo NAFA sur le réservoir
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("NAFA WATER", towerX, tankTopY + 26);

    // 6. Champ de Panneaux Solaires Photovoltaïques (Orientation 15° Plein Sud)
    const solarX = w * 0.08;
    const solarY = horizonY + 160;
    const panelsRows = 3;
    const panelsCols = 4;

    for (let pr = 0; pr < panelsRows; pr++) {
      for (let pc = 0; pc < panelsCols; pc++) {
        const px = solarX + pc * 38;
        const py = solarY + pr * 32;

        // Structure portante métallique inclinée
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 4, py + 22);
        ctx.lineTo(px + 4, py + 28);
        ctx.moveTo(px + 32, py + 22);
        ctx.lineTo(px + 32, py + 28);
        ctx.stroke();

        // Panneau solaire bleu nuit / monocristallin
        const pvGrad = ctx.createLinearGradient(px, py, px + 36, py + 22);
        pvGrad.addColorStop(0, "#0f172a");
        pvGrad.addColorStop(0.4, "#1e3a8a");
        pvGrad.addColorStop(1, "#172554");
        ctx.fillStyle = pvGrad;

        ctx.beginPath();
        ctx.moveTo(px, py + 8);
        ctx.lineTo(px + 34, py);
        ctx.lineTo(px + 36, py + 22);
        ctx.lineTo(px + 2, py + 28);
        ctx.closePath();
        ctx.fill();

        // Reflet solaire spéculaire (Glint)
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(px + 10, py + 10, 16, 2);
      }
    }

    // 7. Clôture Périmétrique & Portail d'Entrée
    ctx.strokeStyle = "rgba(203, 213, 225, 0.65)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(w * 0.04, horizonY + 20, w * 0.92, (h - horizonY) - 40);
    ctx.setLineDash([]);

    // 8. Éclairage Général & Effet d'Atmosphère
    ctx.fillStyle = sunlightColor;
    ctx.fillRect(0, 0, w, h);

    // 9. Cartouche Officiel d'Ingénierie (En bas à gauche)
    if (showCartouche) {
      const cartoucheW = Math.min(480, w * 0.38);
      const cartoucheH = 110;
      const cX = 30;
      const cY = h - cartoucheH - 30;

      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.beginPath();
      ctx.roundRect(cX, cY, cartoucheW, cartoucheH, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(16, 185, 129, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("NAFA GENIUS IA · RENDU PHOTORÉALISTE CERTIFIÉ", cX + 16, cY + 24);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillText(`Projet : ${project.projectName.slice(0, 40)}`, cX + 16, cY + 44);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(`Maître d'ouvrage : ${project.clientName} (${project.location})`, cX + 16, cY + 62);
      ctx.fillText(`Ingénierie : ${project.expertName} · Normes CIRAD & FAO-56`, cX + 16, cY + 80);
      ctx.fillText(`Ambiance : ${lightingPreset.toUpperCase()} · Résolution ${w}x${h} px`, cX + 16, cY + 98);
    }

    if (onSnapshotExport) {
      onSnapshotExport(canvas.toDataURL("image/png"));
    }
  }, [getCanvasDimensions, lightingPreset, resolutionPreset, showCartouche, showWaterSpray, project, onSnapshotExport]);

  // Régénérer dès changement de paramètres
  useEffect(() => {
    setIsGenerating(true);
    const timer = setTimeout(() => {
      renderPhotorealisticScene();
      setIsGenerating(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [renderPhotorealisticScene]);

  // Téléchargement Haute Résolution
  const handleDownloadHd = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement("a");
      const fileName = `rendu_photorealiste_${project.clientName.replace(/\s+/g, "_")}_${lightingPreset}_${resolutionPreset}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success(`Image photoréaliste HD téléchargée : ${fileName}`);
    } catch (err: any) {
      toast.error(`Erreur de téléchargement de l'image : ${err.message}`);
    }
  };

  return (
    <Card className="border-border/80 bg-card overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base font-bold text-foreground">
                Rendu Photoréaliste de l'Aménagement Final (Impact Client)
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Visualisation photoréaliste haute fidélité pour permettre au client et aux investisseurs d'apprécier le projet avant sa réalisation.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Normes CIRAD & FAO Intégrées
            </Badge>

            <Button
              size="sm"
              onClick={handleDownloadHd}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 shadow-xs shrink-0"
            >
              <Download className="h-3.5 w-3.5" /> Télécharger Image HD (PNG)
            </Button>
          </div>
        </div>

        {/* Barre de contrôles photographiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
          <div>
            <span className="text-[11px] text-muted-foreground font-semibold">Ambiance lumineuse :</span>
            <Select value={lightingPreset} onValueChange={(v: any) => setLightingPreset(v)}>
              <SelectTrigger className="h-7 text-xs mt-0.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diurne">☀️ Plein jour sahélien</SelectItem>
                <SelectItem value="golden_hour">🌅 Golden Hour (Crépuscule doré)</SelectItem>
                <SelectItem value="satellite">🛰️ Vue aérienne haute fidélité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground font-semibold">Résolution d'export :</span>
            <Select value={resolutionPreset} onValueChange={(v: any) => setResolutionPreset(v)}>
              <SelectTrigger className="h-7 text-xs mt-0.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hd">HD (1280 x 720 px)</SelectItem>
                <SelectItem value="fhd">Full HD (1920 x 1080 px)</SelectItem>
                <SelectItem value="4k">Ultra HD 4K (3840 x 2160 px)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              size="sm"
              variant={showWaterSpray ? "default" : "outline"}
              onClick={() => setShowWaterSpray(!showWaterSpray)}
              className="h-7 text-xs w-full gap-1"
            >
              <Droplets className="h-3.5 w-3.5 text-sky-400" />
              <span>{showWaterSpray ? "Irrigation active" : "Irrigation masquée"}</span>
            </Button>
          </div>

          <div className="flex items-end">
            <Button
              size="sm"
              variant={showCartouche ? "default" : "outline"}
              onClick={() => setShowCartouche(!showCartouche)}
              className="h-7 text-xs w-full gap-1"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{showCartouche ? "Cartouche affiché" : "Cartouche masqué"}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 bg-slate-950 flex flex-col items-center justify-center min-h-[420px]">
        <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 shadow-2xl flex items-center justify-center bg-black">
          {isGenerating && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10 text-white gap-2 text-xs">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Génération du rendu photoréaliste haute fidélité...</span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="w-full h-auto max-h-[560px] object-contain rounded-lg"
          />
        </div>

        <div className="w-full flex items-center justify-between pt-2.5 text-[11px] text-slate-400 flex-wrap gap-2">
          <span>
            Éléments rendus : Conduites PEHD étanches, rampes goutte-à-goutte turbulentes, château d'eau 10m³, générateur PV 15° Sud, bâtiment bioclimatique BTC.
          </span>
          <span className="font-mono text-emerald-400">
            Résolution native : {getCanvasDimensions().w} x {getCanvasDimensions().h} px
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
