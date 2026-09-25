import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BarChart3,
  PencilRuler,
  Calculator,
  Microscope,
  FileSpreadsheet,
  Wallet,
  FileText,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from "lucide-react";

interface NafaGeniusHeroCardProps {
  onOpenContextualModal?: () => void;
}

export const NafaGeniusHeroCard: React.FC<NafaGeniusHeroCardProps> = ({
  onOpenContextualModal,
}) => {
  const navigate = useNavigate();

  const ACTIONS = [
    {
      label: "Analyser",
      route: "/dashboard/expert-analytics",
      icon: BarChart3,
      desc: "Données & KPIs",
    },
    {
      label: "Concevoir",
      route: "/dashboard/genius?action=concevoir",
      icon: PencilRuler,
      desc: "Ferme 2D/3D & Eau",
    },
    {
      label: "Calculer",
      route: "/dashboard/expert-calculator",
      icon: Calculator,
      desc: "Débits, Semis & NPK",
    },
    {
      label: "Diagnostiquer",
      route: "/dashboard/expert-diagnosis",
      icon: Microscope,
      desc: "Vision IA & Pathologies",
    },
    {
      label: "Générer un plan",
      route: "/dashboard/genius?action=plan",
      icon: FileSpreadsheet,
      desc: "CAD & Réseau Hydraulique",
    },
    {
      label: "Générer un devis",
      route: "/dashboard/quote-requests",
      icon: Wallet,
      desc: "Chiffrage officiel FCFA",
    },
    {
      label: "Générer un rapport",
      route: "/dashboard/smart-inspection",
      icon: FileText,
      desc: "PDF & Audit certifié",
    },
  ];

  return (
    <Card className="relative overflow-hidden rounded-[28px] border-2 border-[#F97316]/40 bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#111827] text-white p-5 sm:p-7 shadow-xl">
      {/* Background Decorative Grid */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#F97316]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Brand identity & Title */}
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F97316]/20 border border-[#F97316]/30 text-[#F97316] text-xs font-black uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span>Copilote d'Ingénierie & Diagnostic IA • 100% Hors-Ligne</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-black tracking-tight flex items-center gap-2.5">
              <span>NAFA Genius</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-black tracking-wide">
                Pro
              </span>
            </h2>
            <p className="text-sm sm:text-base font-medium text-white/90 mt-1">
              Votre copilote d'ingénierie agricole certifié Sahel.
            </p>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Modélisez vos parcelles, dimensionnez vos réseaux d'irrigation, diagnostiquez les cultures par vision IA et chiffrez vos devis en FCFA sans connexion Internet.
          </p>
        </div>

        {/* Right Side: Launch button */}
        <div className="shrink-0 self-start lg:self-center">
          <Button
            onClick={() => navigate("/dashboard/genius")}
            className="h-12 px-6 rounded-[20px] bg-[#F97316] hover:bg-[#ea580c] text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/30 gap-2 transition-transform active:scale-95"
          >
            <Cpu className="h-4 w-4" />
            <span>Ouvrir NAFA Genius IA</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Direct Action Chips ── */}
      <div className="relative z-10 mt-6 pt-5 border-t border-white/10">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
          Actions d'ingénierie directe :
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {ACTIONS.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.route)}
                className="group flex flex-col items-start p-2.5 rounded-[16px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F97316]/50 transition-all text-left"
              >
                <div className="flex items-center gap-1.5 w-full text-[#F97316] group-hover:translate-x-0.5 transition-transform">
                  <ActionIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-heading font-bold text-xs text-white group-hover:text-[#F97316] transition-colors truncate">
                    {action.label}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium truncate mt-1">
                  {action.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
