import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function DeconnexionPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const performSignOut = async () => {
      try {
        await signOut();
      } catch (err) {
        console.warn("Erreur lors de la déconnexion :", err);
      } finally {
        if (isMounted) {
          navigate("/connexion?deconnecte=true", { replace: true });
        }
      }
    };

    performSignOut();
    return () => { isMounted = false; };
  }, [signOut, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-hero p-4 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-semibold text-muted-foreground">
        Déconnexion en cours...
      </p>
    </div>
  );
}
