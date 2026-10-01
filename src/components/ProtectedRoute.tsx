import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, WifiOff, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, isOfflineSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, exiger la création de compte ou la connexion
    if (!loading && !user) {
      toast.info("Pour utiliser les fonctionnalités de NAFA-AGRITECH, vous devez d'abord créer un compte.", {
        id: "auth-required",
        duration: 4000,
      });
      const redirectUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/auth?mode=register&redirect=${redirectUrl}`, { replace: true });
    }
  }, [loading, user, location.pathname, location.search, navigate]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background gap-3 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">
          Vérification du compte utilisateur...
        </p>
      </div>
    );
  }

  return (
    <>
      {isOfflineSession && (
        <div className="bg-amber-500/90 text-white text-center py-1.5 text-xs font-medium flex items-center justify-center gap-2">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Données locales disponibles</span>
          <Badge variant="secondary" className="text-[10px] py-0">Lecture seule</Badge>
        </div>
      )}
      {children}
    </>
  );
};
