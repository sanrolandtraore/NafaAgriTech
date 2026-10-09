import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSafeRedirectUrl } from "@/lib/safeRedirect";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Validation de votre session en cours...");

  useEffect(() => {
    let isMounted = true;

    const processAuth = async () => {
      try {
        const errorDescription = searchParams.get("error_description");
        const errorCode = searchParams.get("error");

        if (errorCode || errorDescription) {
          if (isMounted) {
            setStatus("error");
            setMessage(errorDescription || "Le lien d'authentification est invalide ou expiré.");
          }
          return;
        }

        const code = searchParams.get("code");
        const next = getSafeRedirectUrl(searchParams.get("next") || searchParams.get("redirect"), "/dashboard");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (isMounted) {
              setStatus("error");
              setMessage(error.message || "Impossible de valider le code d'authentification.");
            }
            return;
          }
        }

        // Vérifier si la session est active
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          // Attendre brièvement la propagation du token
          setTimeout(async () => {
            if (!isMounted) return;
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              setStatus("success");
              setMessage("Authentification réussie ! Redirection...");
              setTimeout(() => {
                navigate(next, { replace: true });
              }, 800);
            } else {
              setStatus("error");
              setMessage("Session introuvable. Veuillez vous reconnecter.");
            }
          }, 1200);
          return;
        }

        if (isMounted) {
          setStatus("success");
          setMessage("Authentification confirmée ! Redirection...");
          setTimeout(() => {
            navigate(next, { replace: true });
          }, 800);
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus("error");
          setMessage(err?.message || "Une erreur inattendue est survenue.");
        }
      }
    };

    processAuth();
    return () => { isMounted = false; };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <Card className="w-full max-w-md border-border/60 shadow-warm">
        <CardContent className="pt-8 pb-8 px-6 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-3xl overflow-hidden bg-white shadow-md border-2 border-emerald-500/20 p-2 flex items-center justify-center">
            <img src={logo} alt="NAFA AGRITECH" className="h-full w-full object-contain rounded-2xl" />
          </div>

          {status === "loading" && (
            <div className="space-y-3 py-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <h3 className="text-base font-bold text-foreground">Vérification en cours</h3>
              <p className="text-xs text-muted-foreground">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-3 py-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Connexion validée</h3>
              <p className="text-xs text-muted-foreground">{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 py-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Échec de validation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
              </div>
              <Button
                type="button"
                onClick={() => navigate("/connexion")}
                className="w-full h-11 gradient-primary text-primary-foreground font-bold text-sm rounded-xl flex items-center justify-center gap-2"
              >
                <span>Retourner à la page de connexion</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
