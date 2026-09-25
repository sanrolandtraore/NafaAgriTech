import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, WifiOff, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, isOfflineSession, isGuestSession, startGuestSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Si l'utilisateur n'est pas encore connecté, activer instantanément la session découverte terrain
    if (!loading && !user && startGuestSession) {
      let targetRole = "agriculteur";
      if (
        location.pathname.includes("expert") ||
        location.pathname.includes("services") ||
        location.pathname.includes("genius") ||
        location.pathname.includes("crop-planning") ||
        location.pathname.includes("scouting") ||
        location.pathname.includes("inspection") ||
        location.pathname.includes("crop-library") ||
        location.pathname.includes("parcels") ||
        location.pathname.includes("crops")
      ) {
        targetRole = "expert";
      } else if (
        location.pathname.includes("animal") ||
        location.pathname.includes("livestock") ||
        location.pathname.includes("veterinary")
      ) {
        targetRole = "eleveur";
      } else if (
        location.pathname.includes("partenaire") ||
        location.pathname.includes("provider")
      ) {
        targetRole = "partenaire";
      }
      void startGuestSession(targetRole);
    }
  }, [loading, user, location.pathname, startGuestSession]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {isGuestSession && (
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white text-center py-2 px-4 text-xs font-semibold flex items-center justify-between shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-2 mx-auto">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            <span>Mode Découverte Terrain 100% Hors-ligne — Vous accédez directement à toutes les fonctionnalités.</span>
          </div>
          <button
            onClick={() => navigate("/auth?mode=register")}
            className="hidden sm:inline-block px-3 py-1 rounded-full bg-white/20 hover:bg-white text-white hover:text-emerald-900 transition-colors text-[11px] font-bold shrink-0 ml-3"
          >
            Créer mon compte
          </button>
        </div>
      )}
      {isOfflineSession && !isGuestSession && (
        <div className="bg-amber-500/90 text-white text-center py-1.5 text-xs font-medium flex items-center justify-center gap-2">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Session hors-ligne — les données affichées proviennent du cache local</span>
          <Badge variant="secondary" className="text-[10px] py-0">Lecture seule</Badge>
        </div>
      )}
      {children}
    </>
  );
};
