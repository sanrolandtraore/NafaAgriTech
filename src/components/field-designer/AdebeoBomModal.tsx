/**
 * NAFA STUDIO 3D x ADEBEO / SKETCHUP
 * Modal Interactif de Calepinage, Métrés et Quantitatifs des Matériaux (BOM)
 */

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Download,
  FileText,
  Boxes,
  Zap,
  Droplets,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { FarmElement3D } from "./Studio3DFarmModeler";
import { calculateAdebeoBom, BomMaterialLine } from "@/lib/adebeoBomEngine";
import { generateAdebeoLayOutPdf } from "@/lib/adebeoLayOutPdfGenerator";
import { downloadSketchupPackage } from "@/lib/sketchupObjExporter";
import { downloadSketchupDxf } from "@/lib/sketchupDxfExporter";

export interface AdebeoBomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elements: FarmElement3D[];
  projectName?: string;
  clientName?: string;
  locality?: string;
  region?: string;
  province?: string;
  areaHa?: number;
  perimeterM?: number;
  soilType?: string;
  waterFlowM3H?: number;
}

export function AdebeoBomModal({
  open,
  onOpenChange,
  elements,
  projectName = "Projet Agricole Bioclimatique",
  clientName = "Exploitant Agricole",
  locality = "Kadiogo",
  region = "Centre",
  province = "Kadiogo",
  areaHa = 2.5,
  perimeterM = 650,
  soilType = "laterite",
  waterFlowM3H = 12,
}: AdebeoBomModalProps) {
  const [selectedLot, setSelectedLot] = useState<string>("ALL");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const bom = useMemo(() => {
    return calculateAdebeoBom(elements, projectName);
  }, [elements, projectName]);

  const filteredLines = useMemo(() => {
    if (selectedLot === "ALL") return bom.lines;
    return bom.lines.filter((l) => l.lot === selectedLot);
  }, [bom.lines, selectedLot]);

  // Export PDF LayOut 4 planches
  const handleExportLayOutPdf = () => {
    setIsExportingPdf(true);
    try {
      const { doc, filename } = generateAdebeoLayOutPdf(elements, {
        projectName,
        clientName,
        locality,
        region,
        province,
        areaHa,
        perimeterM,
        soilType,
        waterFlowM3H,
      });
      doc.save(filename);
      toast.success("Dossier LayOut A4 Paysage (4 planches) généré et archivé avec succès !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du dossier LayOut.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Wavefront OBJ 3D pour SketchUp
  const handleExportSketchupObj = () => {
    try {
      downloadSketchupPackage(elements, projectName);
      toast.success("Fichiers 3D Wavefront (.OBJ et .MTL) prêts pour SketchUp Pro !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'export SketchUp 3D.");
    }
  };

  // Export DXF CAO
  const handleExportDxf = () => {
    try {
      downloadSketchupDxf(elements, {
        projectName,
        clientName,
        locality,
      });
      toast.success("Fichier DXF CAO avec calques vectoriels exporté !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'export DXF.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-6 overflow-hidden bg-slate-950 text-slate-100 border-slate-800 shadow-2xl">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  Métrés, Calepinage & Quantitatifs des Matériaux (BOM)
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs">
                    Standard Adebeo / SketchUp
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-0.5">
                  Décompte précis des matériaux selon les normes de construction sahéliennes (DTU / INERA / CILSS) et chiffrage mercuriale en FCFA.
                </DialogDescription>
              </div>
            </div>

            {/* Actions d'Export Pro */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportSketchupObj}
                className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200 text-xs h-8"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Export SketchUp (.OBJ)
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleExportDxf}
                className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200 text-xs h-8"
              >
                <Compass className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                Export DXF CAO
              </Button>

              <Button
                size="sm"
                onClick={handleExportLayOutPdf}
                disabled={isExportingPdf}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 shadow-lg shadow-emerald-950"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Dossier LayOut (4 Planches PDF)
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Badges métriques clés */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 my-3">
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Surface Bâtie</span>
            <span className="text-base font-bold text-red-400">{bom.metrics.totalBuiltAreaM2} m²</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Parpaings de 15</span>
            <span className="text-base font-bold text-slate-200">{bom.metrics.totalCinderBlocks} U</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Ciment CPJ 35</span>
            <span className="text-base font-bold text-amber-300">{bom.metrics.totalCementBags50kg} sacs</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tôles Bac Alu</span>
            <span className="text-base font-bold text-sky-400">{bom.metrics.totalRoofingSheetsCount} U</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Réseau PEHD</span>
            <span className="text-base font-bold text-cyan-400">{bom.metrics.totalPipingLinearM} ml</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Solaire Crête</span>
            <span className="text-base font-bold text-yellow-400">{bom.metrics.totalSolarPowerWp} Wc</span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-300 uppercase tracking-wider block font-semibold">Total Devis (FCFA)</span>
            <span className="text-base font-extrabold text-emerald-400">
              {bom.grandTotalFcfa.toLocaleString("fr-FR")} F
            </span>
          </div>
        </div>

        {/* Filtres par Lot Technique */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2 scrollbar-none text-xs">
          <Button
            size="sm"
            variant={selectedLot === "ALL" ? "default" : "outline"}
            onClick={() => setSelectedLot("ALL")}
            className={`h-7 text-xs ${selectedLot === "ALL" ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold" : "bg-slate-900 border-slate-800 text-slate-300"}`}
          >
            Tous les Lots ({bom.lines.length})
          </Button>

          {bom.lotsSummary.map((lot) => (
            <Button
              key={lot.lot}
              size="sm"
              variant={selectedLot === lot.lot ? "default" : "outline"}
              onClick={() => setSelectedLot(lot.lot)}
              className={`h-7 text-xs shrink-0 ${selectedLot === lot.lot ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold" : "bg-slate-900 border-slate-800 text-slate-300"}`}
            >
              {lot.label.split("—")[1] || lot.label} ({lot.percentage}%)
            </Button>
          ))}
        </div>

        {/* Tableau scrollable du calepinage */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-900/50">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800 z-10">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Corps d'État</th>
                <th className="py-2.5 px-3">Désignation Matériau</th>
                <th className="py-2.5 px-3">Spécifications & Calepinage</th>
                <th className="py-2.5 px-3 text-center">Unité</th>
                <th className="py-2.5 px-3 text-right">Quantité</th>
                <th className="py-2.5 px-3 text-right">P.U. (FCFA)</th>
                <th className="py-2.5 px-3 text-right font-bold text-amber-300">Total (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLines.map((line, idx) => (
                <tr key={line.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-3 font-medium text-slate-400">{line.lotLabel.replace(/Lot \d+ — /, "")}</td>
                  <td className="py-2 px-3 font-semibold text-slate-200">{line.designation}</td>
                  <td className="py-2 px-3 text-slate-400 text-[11px] max-w-xs">{line.specification}</td>
                  <td className="py-2 px-3 text-center text-slate-400">{line.unit}</td>
                  <td className="py-2 px-3 text-right font-mono font-medium text-slate-200">
                    {line.quantity.toLocaleString("fr-FR")}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">
                    {line.unitPriceFcfa.toLocaleString("fr-FR")} F
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                    {line.totalPriceFcfa.toLocaleString("fr-FR")} F
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer avec récapitulatif & mention de conformité */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Calepinage certifié conforme aux normes CILSS / INERA et aux DTU ouest-africains du bâtiment.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-300">
              {filteredLines.length} ligne(s) affichée(s)
            </span>
            <div className="text-sm font-bold text-white bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
              Sous-total sélection :{" "}
              <span className="text-emerald-400">
                {filteredLines.reduce((acc, l) => acc + l.totalPriceFcfa, 0).toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
