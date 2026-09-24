/**
 * NAFA - AGRITECH : Compteur Dynamique Réel d'Utilisateurs et Partenaires
 * 
 * Zéro Donnée Fictive :
 * - Dénombre en temps réel les agriculteurs, les éleveurs, les entreprises partenaires
 *   et les agronomes/vétérinaires enregistrés sur la plateforme.
 * - Conçu pour inspirer une confiance immédiate avec label de transparence certifié.
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Sprout,
  Beef,
  Building2,
  Stethoscope,
  Users,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { usePlatformMetrics } from "@/lib/platformMetrics";

export const RealPlatformMetricsCounter: React.FC = () => {
  const { metrics, loading } = usePlatformMetrics();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      <div className="bg-card/80 backdrop-blur-xs border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        {/* Header Strip with Live Transparency Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                Écosystème Actif NAFA-AGRITECH
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="h-3 w-3" /> Données Réelles
                </Badge>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Comptage dynamique certifié des acteurs inscrits et utilisant la plateforme
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground self-start sm:self-auto bg-muted/50 px-2.5 py-1 rounded-full border border-border/50">
            <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span>Compteur en direct</span>
          </div>
        </div>

        {/* 4 Dynamic Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Tile 1: Agriculteurs */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-background border border-border/70 hover:border-emerald-500/40 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Agriculteurs</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sprout className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground">
                {loading ? "..." : metrics.farmersCount}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Producteurs & Maraîchers
              </span>
            </div>
          </div>

          {/* Tile 2: Éleveurs */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-background border border-border/70 hover:border-amber-500/40 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Éleveurs</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Beef className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground">
                {loading ? "..." : metrics.breedersCount}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Pasteurs & Cheptels
              </span>
            </div>
          </div>

          {/* Tile 3: Entreprises Partenaires */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-background border border-border/70 hover:border-primary/40 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Partenaires</span>
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground">
                {loading ? "..." : metrics.partnersCount}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Entreprises & Institutions
              </span>
            </div>
          </div>

          {/* Tile 4: Agronomes & Vétérinaires */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-background border border-border/70 hover:border-indigo-500/40 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Experts Métiers</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Stethoscope className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground">
                {loading ? "..." : metrics.expertsCount}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Agronomes & Vétérinaires
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealPlatformMetricsCounter;
