import React from "react";
import { useNavigate } from "react-router-dom";
import { AgronomicToolItem, agronomicToolkitStorage } from "@/lib/agronomicToolkitStorage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  ArrowRight,
  Sparkles,
  Wifi,
  WifiOff,
  ClipboardCheck,
  MapPin,
  Ruler,
  Maximize2,
  Navigation,
  Compass,
  LocateFixed,
  Microscope,
  Sprout,
  Leaf,
  Activity,
  Bug,
  FlaskConical,
  Wheat,
  BookOpen,
  Eye,
  Droplets,
  Gauge,
  Pipette,
  Sun,
  ShowerHead,
  Waves,
  Zap,
  PencilRuler,
  Boxes,
  Building2,
  Home,
  FileSpreadsheet,
  Wallet,
  ClipboardList,
  FileCheck,
  BarChart3,
  PieChart,
  History,
  Download,
} from "lucide-react";

// Icon resolution registry
const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardCheck,
  MapPin,
  Ruler,
  Maximize2,
  Navigation,
  Compass,
  LocateFixed,
  Microscope,
  Sprout,
  Leaf,
  Activity,
  Bug,
  FlaskConical,
  Wheat,
  BookOpen,
  Eye,
  Droplets,
  Gauge,
  Pipette,
  Sun,
  ShowerHead,
  Waves,
  Zap,
  PencilRuler,
  Boxes,
  Building2,
  Home,
  FileSpreadsheet,
  Wallet,
  ClipboardList,
  FileCheck,
  BarChart3,
  PieChart,
  History,
  Download,
};

interface AgronomicToolCardProps {
  tool: AgronomicToolItem;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
  onOpenContextualAi: (tool: AgronomicToolItem) => void;
  compact?: boolean;
}

export const AgronomicToolCard: React.FC<AgronomicToolCardProps> = ({
  tool,
  isFavorite,
  onToggleFavorite,
  onOpenContextualAi,
  compact = false,
}) => {
  const navigate = useNavigate();
  const IconComponent = ICON_MAP[tool.iconName] || Sprout;

  const handleOpenTool = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    agronomicToolkitStorage.recordToolUsage(tool.id);
    navigate(tool.route);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(tool.id);
  };

  const handleAiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenContextualAi(tool);
  };

  return (
    <Card
      onClick={() => handleOpenTool()}
      className={`group relative overflow-hidden rounded-[24px] border border-border/80 bg-card hover:bg-card/95 hover:border-[#F97316]/50 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between p-3.5 sm:p-5 select-none ${
        compact ? "min-h-[160px]" : "min-h-[190px] sm:min-h-[210px]"
      }`}
    >
      {/* ── Top Bar: Icon + Star + Offline Badge ── */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Main Visual Icon Container */}
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-[#F97316] group-hover:text-white transition-all duration-300 shadow-xs">
              <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
            </div>
            {tool.badges.includes("IA") && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F97316] text-white text-[9px] font-black shadow-xs">
                IA
              </span>
            )}
          </div>

          {/* Quick Actions (Favoris + Aide IA) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleAiClick}
              title="Aide contextuelle NAFA Genius"
              aria-label={`Aide IA pour ${tool.title}`}
              className="p-1.5 rounded-full text-muted-foreground/70 hover:text-[#F97316] hover:bg-[#F97316]/10 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleStarClick}
              title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              className={`p-1.5 rounded-full transition-colors ${
                isFavorite
                  ? "text-amber-500 hover:text-amber-600 bg-amber-500/10"
                  : "text-muted-foreground/50 hover:text-amber-500 hover:bg-muted"
              }`}
            >
              <Star
                className={`h-4 w-4 ${isFavorite ? "fill-amber-500" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* ── Tool Title & Short 1-line Description ── */}
        <div className="space-y-1">
          <h3 className="font-heading font-black text-xs sm:text-sm text-foreground tracking-tight line-clamp-1 group-hover:text-[#F97316] transition-colors">
            {tool.title}
          </h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-snug">
            {tool.description}
          </p>
        </div>
      </div>

      {/* ── Footer: Badges + Action Button « Ouvrir » ── */}
      <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2 mt-3">
        {/* Offline Badge */}
        <div className="flex items-center gap-1.5">
          {tool.isOffline ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden xs:inline">Hors ligne</span>
              <span className="xs:hidden">Off</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[10px] font-bold">
              <Wifi className="w-3 h-3" />
              <span className="hidden xs:inline">En ligne</span>
            </span>
          )}
        </div>

        {/* Bouton « Ouvrir » */}
        <Button
          size="sm"
          onClick={handleOpenTool}
          className="h-7 px-2.5 sm:px-3 rounded-[12px] text-[11px] font-bold bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:bg-[#F97316] dark:hover:bg-[#F97316] dark:hover:text-white transition-all shadow-2xs gap-1 group-hover:translate-x-0.5"
        >
          <span>Ouvrir</span>
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
};
