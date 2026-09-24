import React, { useRef, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Wrench, Droplets, Zap, ShieldCheck, Download, Edit3, CheckCircle2,
  AlertTriangle, RefreshCw, ZoomIn, ZoomOut, ArrowRight, Gauge, Activity
} from "lucide-react";
import { toast } from "sonner";
import {
  UnifiedEngineeringProject,
  TechnicalNetworkNode,
  TechnicalNetworkPipe
} from "@/lib/nafaEngineeringStudio";

interface TechnicalNetworkPlanViewProps {
  project: UnifiedEngineeringProject;
  onProjectUpdate?: (updated: UnifiedEngineeringProject) => void;
}

export const TechnicalNetworkPlanView: React.FC<TechnicalNetworkPlanViewProps> = ({
  project,
  onProjectUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [nodes, setNodes] = useState<TechnicalNetworkNode[]>(project.networkNodes);
  const [pipes, setPipes] = useState<TechnicalNetworkPipe[]>(project.networkPipes);
  const [selectedNode, setSelectedNode] = useState<TechnicalNetworkNode | null>(null);
  const [selectedPipe, setSelectedPipe] = useState<TechnicalNetworkPipe | null>(null);
  const [isEditingNode, setIsEditingNode] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1.0);

  // Synchronisation avec les props
  useEffect(() => {
    setNodes(project.networkNodes);
    setPipes(project.networkPipes);
  }, [project.networkNodes, project.networkPipes]);

  // Dessin du schéma P&ID unifilaire d'ingénierie hydraulique & électrique
  const drawNetworkCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Fond blanc technique millimétré
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Grille de dessin technique CAO (Bleu clair 20px)
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.8;
    const gridSize = 30 * scale;
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

    // Cartouche technique supérieur
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(10, 10, width - 20, 40);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, width - 20, 40);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("SCHÉMA TECHNIQUE D'IMPLANTATION & RÉSEAU HYDRAULIQUE (P&ID)", 25, 34);

    ctx.fillStyle = "#64748b";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`Normes : CIRAD Hydraulique Tropicale / FAO-56 · Conduite Maîtresse PEHD Ø${project.hydraulics.mainPipeDiameterMm} PN10`, 480, 34);

    // 1. Tracé des Canalisations (Pipes)
    for (const pipe of pipes) {
      const fromNode = nodes.find((n) => n.id === pipe.fromNodeId);
      const toNode = nodes.find((n) => n.id === pipe.toNodeId);
      if (!fromNode || !toNode) continue;

      const x1 = (fromNode.xPct / 100) * width;
      const y1 = (fromNode.yPct / 100) * height;
      const x2 = (toNode.xPct / 100) * width;
      const y2 = (toNode.yPct / 100) * height;

      // Conduite principale avec épaisseur proportionnelle au diamètre
      ctx.strokeStyle = pipe.color || "#0284c7";
      ctx.lineWidth = Math.max(3, pipe.nominalDiameterMm / 15) * scale;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Flèche de sens d'écoulement de l'eau
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const angle = Math.atan2(y2 - y1, x2 - x1);

      ctx.fillStyle = pipe.color || "#0284c7";
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX - 10 * Math.cos(angle - Math.PI / 6), midY - 10 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(midX - 10 * Math.cos(angle + Math.PI / 6), midY - 10 * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      // Étiquette technique du tuyau
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${pipe.label} (L=${pipe.lengthM}m, ΔH=${pipe.headLossM}m)`, midX, midY - 10);
    }

    // 2. Tracé des Nœuds & Appareillages (Nodes P&ID)
    for (const node of nodes) {
      const nx = (node.xPct / 100) * width;
      const ny = (node.yPct / 100) * height;

      const isSelected = selectedNode?.id === node.id;

      // Boîtier / Symbole normalisé selon le type
      ctx.save();

      // Ombre de sélection
      if (isSelected) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.strokeRect(nx - 24, ny - 24, 48, 48);
      }

      switch (node.type) {
        case "borehole":
          ctx.fillStyle = "#0284c7";
          ctx.beginPath();
          ctx.arc(nx, ny, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#0369a1";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("F1", nx, ny + 4);
          break;

        case "pump":
          ctx.fillStyle = "#059669";
          ctx.beginPath();
          ctx.moveTo(nx - 14, ny + 12);
          ctx.lineTo(nx, ny - 14);
          ctx.lineTo(nx + 14, ny + 12);
          ctx.closePath();
          ctx.fill();
          break;

        case "water_tower":
          ctx.fillStyle = "#0369a1";
          ctx.fillRect(nx - 18, ny - 22, 36, 44);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("10m³", nx, ny + 3);
          break;

        case "filter_station":
          ctx.fillStyle = "#d97706";
          ctx.beginPath();
          ctx.roundRect(nx - 20, ny - 14, 40, 28, 4);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("FILTRE", nx, ny + 3);
          break;

        case "fertigation_injector":
          ctx.fillStyle = "#7c3aed";
          ctx.beginPath();
          ctx.moveTo(nx - 12, ny - 10);
          ctx.lineTo(nx + 12, ny);
          ctx.lineTo(nx - 12, ny + 10);
          ctx.closePath();
          ctx.fill();
          break;

        case "sector_valve":
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.moveTo(nx - 12, ny - 10);
          ctx.lineTo(nx, ny);
          ctx.lineTo(nx - 12, ny + 10);
          ctx.lineTo(nx + 12, ny - 10);
          ctx.lineTo(nx, ny);
          ctx.lineTo(nx + 12, ny + 10);
          ctx.closePath();
          ctx.fill();
          break;

        case "solar_pv_array":
          ctx.fillStyle = "#1e3a8a";
          ctx.fillRect(nx - 22, ny - 14, 44, 28);
          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(nx - 22, ny - 14, 44, 28);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("PV SOL", nx, ny + 3);
          break;

        case "mppt_inverter":
          ctx.fillStyle = "#475569";
          ctx.fillRect(nx - 16, ny - 16, 32, 32);
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(nx, ny - 6, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("MPPT", nx, ny + 8);
          break;

        default:
          ctx.fillStyle = "#64748b";
          ctx.beginPath();
          ctx.arc(nx, ny, 10, 0, Math.PI * 2);
          ctx.fill();
      }

      ctx.restore();

      // Libellé de l'équipement
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(node.label, nx, ny + 28);

      // Détail technique
      ctx.fillStyle = "#64748b";
      ctx.font = "9px Inter, sans-serif";
      ctx.fillText(node.specs.slice(0, 36), nx, ny + 40);
    }
  }, [nodes, pipes, selectedNode, scale, project.hydraulics.mainPipeDiameterMm]);

  useEffect(() => {
    drawNetworkCanvas();
  }, [drawNetworkCanvas]);

  // Clic sur le canvas pour sélectionner un équipement
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Rechercher le nœud cliqué
    for (const node of nodes) {
      const nx = (node.xPct / 100) * canvas.width;
      const ny = (node.yPct / 100) * canvas.height;
      const dist = Math.hypot(clickX - nx, clickY - ny);
      if (dist <= 30) {
        setSelectedNode(node);
        setIsEditingNode(true);
        return;
      }
    }
  };

  // Enregistrement des modifications apportées par l'expert sur le nœud
  const handleSaveNodeEdits = () => {
    if (!selectedNode) return;

    const updatedNodes = nodes.map((n) => (n.id === selectedNode.id ? selectedNode : n));
    setNodes(updatedNodes);

    if (onProjectUpdate) {
      onProjectUpdate({
        ...project,
        networkNodes: updatedNodes,
      });
    }

    setIsEditingNode(false);
    toast.success(`Spécifications de « ${selectedNode.label} » mises à jour !`);
  };

  // Téléchargement du plan technique en PNG
  const handleDownloadPlan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `plan_technique_reseau_${project.clientName.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Schéma technique réseau téléchargé (PNG Haute Définition) !");
  };

  return (
    <Card className="border-border/80 bg-card overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-sky-600" />
              <CardTitle className="text-base font-bold text-foreground">
                Plans Techniques Réseaux (Hydraulique, Pompage & Vannes)
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Conception technique conforme CIRAD & FAO : tracé des canalisations PEHD, vannes de régulation, station de filtration et câblage solaire.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setScale((s) => Math.max(0.8, s - 0.1))}
              className="h-8 w-8 p-0"
              title="Zoom arrière"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setScale((s) => Math.min(1.5, s + 0.1))}
              className="h-8 w-8 p-0"
              title="Zoom avant"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPlan}
              className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-semibold gap-1.5 shadow-xs"
            >
              <Download className="h-3.5 w-3.5" /> Exporter Schéma P&ID (PNG)
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Canvas de dessin CAO */}
        <div className="relative w-full overflow-x-auto rounded-xl border border-border bg-white shadow-inner flex justify-center">
          <canvas
            ref={canvasRef}
            width={1000}
            height={480}
            onClick={handleCanvasClick}
            className="w-full max-w-[1000px] h-auto cursor-pointer block"
            title="Cliquez sur un équipement pour modifier ses spécifications techniques"
          />
        </div>

        {/* Tableau récapitulatif des canalisations et pertes de charge CIRAD */}
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2 text-xs">
          <h4 className="font-bold text-foreground flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-sky-600" />
            Métré et Bilan Hydraulique des Conduites (CIRAD / Hazen-Williams C=140)
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-[11px] text-muted-foreground">
                  <th className="py-1 px-2 font-semibold">Tronçon</th>
                  <th className="py-1 px-2 font-semibold">Matériau & Pression</th>
                  <th className="py-1 px-2 font-semibold">Diamètre Nominal (DN)</th>
                  <th className="py-1 px-2 font-semibold">Longueur</th>
                  <th className="py-1 px-2 font-semibold">Vitesse (m/s)</th>
                  <th className="py-1 px-2 font-semibold">Perte de charge (m)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs font-mono">
                {pipes.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-1.5 px-2 font-sans font-medium text-foreground">{p.label}</td>
                    <td className="py-1.5 px-2 text-muted-foreground">{p.material.replace(/_/g, " ")}</td>
                    <td className="py-1.5 px-2 font-bold text-sky-700 dark:text-sky-300">Ø{p.nominalDiameterMm} mm</td>
                    <td className="py-1.5 px-2">{p.lengthM} m</td>
                    <td className="py-1.5 px-2">
                      <span className={p.flowVelocityMs > 1.8 ? "text-amber-600 font-bold" : "text-emerald-600"}>
                        {p.flowVelocityMs.toFixed(2)} m/s
                      </span>
                    </td>
                    <td className="py-1.5 px-2 font-bold">{p.headLossM.toFixed(1)} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal d'édition d'un équipement par l'expert */}
        <Dialog open={isEditingNode} onOpenChange={setIsEditingNode}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-sky-600" />
                Ajustement Technique : {selectedNode?.label}
              </DialogTitle>
            </DialogHeader>

            {selectedNode && (
              <div className="space-y-3 py-2 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Désignation de l'équipement</Label>
                  <Input
                    value={selectedNode.label}
                    onChange={(e) => setSelectedNode({ ...selectedNode, label: e.target.value })}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Spécifications techniques & Référence</Label>
                  <Input
                    value={selectedNode.specs}
                    onChange={(e) => setSelectedNode({ ...selectedNode, specs: e.target.value })}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Diamètre Nominal DN (mm)</Label>
                    <Input
                      type="number"
                      value={selectedNode.dnMm || ""}
                      onChange={(e) => setSelectedNode({ ...selectedNode, dnMm: Number(e.target.value) })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Débit de transit (m³/h)</Label>
                    <Input
                      type="number"
                      value={selectedNode.flowM3h || ""}
                      onChange={(e) => setSelectedNode({ ...selectedNode, flowM3h: Number(e.target.value) })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditingNode(false)} className="h-8 text-xs">
                Annuler
              </Button>
              <Button size="sm" onClick={handleSaveNodeEdits} className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-semibold">
                Valider les Spécifications
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
