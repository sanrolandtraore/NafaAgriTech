/**
 * NAFA FIELD DESIGNER — NAFA AI COPILOT
 * Copilote agronomique senior d'ingénierie et d'aménagement de terrain.
 * Respecte strictement la séparation :
 * 🟢 Données mesurées | 🔵 Données saisies | 🧮 Calculs | 💡 Hypothèses | 🎯 Recommandations
 */

import React, { useState } from "react";
import { Farm, Field, CropPlan, IrrigationProject, FarmBuilding } from "@/types/fieldDesigner";
import { runFieldAiCopilot, CopilotOutput } from "@/lib/fieldAiCopilotEngine";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
  Compass,
  Sprout,
  ShieldCheck,
  Edit3,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface NafaAiCopilotProps {
  farm: Farm;
  fields: Field[];
  cropPlans: CropPlan[];
  irrigation?: IrrigationProject;
  buildings: FarmBuilding[];
}

export const NafaAiCopilot: React.FC<NafaAiCopilotProps> = ({
  farm,
  fields,
  cropPlans,
  irrigation,
  buildings,
}) => {
  const [analysis, setAnalysis] = useState<CopilotOutput>(() =>
    runFieldAiCopilot({ farm, fields, cropPlans, irrigation, buildings })
  );

  const [validatedSections, setValidatedSections] = useState<Record<number, boolean>>({});

  const toggleValidation = (idx: number) => {
    setValidatedSections((prev) => {
      const next = !prev[idx];
      toast.success(next ? "Recommandation validée par l'agronome." : "Validation retirée.");
      return { ...prev, [idx]: next };
    });
  };

  const refreshAnalysis = () => {
    const updated = runFieldAiCopilot({ farm, fields, cropPlans, irrigation, buildings });
    setAnalysis(updated);
    toast.info("Analyse du Copilote actualisée avec les données terrain.");
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "measured":
        return <Badge className="bg-emerald-600 text-white font-bold text-[10px]">🟢 Données mesurées</Badge>;
      case "input":
        return <Badge className="bg-sky-600 text-white font-bold text-[10px]">🔵 Données saisies</Badge>;
      case "calculated":
        return <Badge className="bg-purple-600 text-white font-bold text-[10px]">🧮 Calculs</Badge>;
      case "hypothesis":
        return <Badge className="bg-amber-600 text-white font-bold text-[10px]">💡 Hypothèses (À valider)</Badge>;
      case "recommendation":
        return <Badge className="bg-indigo-600 text-white font-bold text-[10px]">🎯 Recommandations</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="rounded-3xl border-2 border-primary/20 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
                <Sparkles className="h-3.5 w-3.5" />
                <span>NAFA AI Agronomy Copilot</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                Copilote d'Aménagement & Décision Agronomique
              </h2>
              <p className="text-xs text-muted-foreground">
                Analyse contextuelle 100% basée sur vos données réelles. L'agronome reste le seul décideur.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={refreshAnalysis} className="h-9 text-xs rounded-xl gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Actualiser
            </Button>
          </div>

          {/* Règle Déontologique Fondamentale */}
          <div className="p-3.5 rounded-2xl bg-muted/60 border text-xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">
                Principe déontologique : AI propose → AGRONOME valide → AGRONOME modifie → PLAN FINAL
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Zéro hallucination • Référentiel INERA Farako-Bâ
            </span>
          </div>

          {/* ── LES 5 SECTIONS STRUCTURÉES ── */}
          <div className="space-y-4">
            {analysis.sections.map((sec, idx) => (
              <div key={idx} className="p-4 rounded-2xl border bg-card/60 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-foreground">{sec.title}</span>
                    {getCategoryBadge(sec.category)}
                  </div>
                  {sec.category === "recommendation" && (
                    <Button
                      size="sm"
                      variant={validatedSections[idx] ? "default" : "outline"}
                      onClick={() => toggleValidation(idx)}
                      className={`h-7 px-2.5 text-xs rounded-lg gap-1 font-bold ${
                        validatedSections[idx] ? "bg-emerald-600 text-white" : ""
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {validatedSections[idx] ? "Validé par l'expert" : "Valider cette recommandation"}
                    </Button>
                  )}
                </div>

                <ul className="space-y-1.5 pl-2 text-xs text-foreground/90">
                  {sec.items.map((it, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── CONSEIL D'OPTIMISATION SPATIALE ── */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-amber-600" />
              Recommandation d'optimisation spatiale de la ferme
            </span>
            <p className="text-amber-800/90 dark:text-amber-300 leading-relaxed text-[11px]">
              {analysis.spatialOptimizationTip}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
