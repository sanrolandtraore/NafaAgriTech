import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface PageLoaderProps {
  label?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ label = "Chargement ultra-rapide..." }) => {
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(65), 50);
    const timer2 = setTimeout(() => setProgress(90), 150);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="relative w-full min-h-[40vh] flex flex-col items-center justify-center p-6 space-y-4 animate-fade-in">
      {/* ── Top loading bar instantanée (façon YouTube / GitHub) ── */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted/40 z-50 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-[#F97316] to-emerald-400 transition-all duration-300 ease-out shadow-xs shadow-orange-500/50"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Skeleton animé élégant sans à-coups ── */}
      <div className="w-full max-w-2xl space-y-3 p-4 rounded-2xl bg-card/60 border border-border/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-1/3 bg-muted rounded-md animate-pulse" />
            <div className="h-3 w-1/2 bg-muted/70 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="h-28 w-full bg-muted/40 rounded-xl animate-pulse" />
      </div>

      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-[#F97316] animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
};

export default PageLoader;
