import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, Loader2, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";

export default function VerifierEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resendVerificationEmail } = useAuth();

  const emailParam = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!emailParam) {
      toast.error("Adresse e-mail introuvable.");
      return;
    }

    setResending(true);
    try {
      const { error } = await resendVerificationEmail(emailParam);
      if (error) {
        toast.error("Impossible de renvoyer l'e-mail : " + error.message);
      } else {
        setResent(true);
        toast.success("E-mail de confirmation renvoyé avec succès !");
      }
    } catch (err: any) {
      toast.error("Erreur réseau : " + (err?.message || "Veuillez réessayer."));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-3 sm:p-6">
      <div className="w-full max-w-md my-6">
        <div className="mb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/connexion")}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-white/80 dark:bg-card/80 backdrop-blur-md rounded-xl border border-border/60 shadow-2xs hover:bg-accent transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-[#F97316]" />
            <span>Aller à la connexion</span>
          </Button>
        </div>

        <Card className="border-border/60 shadow-warm">
          <CardHeader className="text-center space-y-3 pt-6 pb-4">
            <div className="mx-auto h-16 w-16 rounded-3xl overflow-hidden bg-white shadow-md border-2 border-emerald-500/20 p-2 flex items-center justify-center">
              <img src={logo} alt="NAFA AGRITECH" className="h-full w-full object-contain rounded-2xl" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-heading font-extrabold text-foreground tracking-tight">
                Vérifiez votre adresse e-mail
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 text-muted-foreground">
                Finalisation de votre inscription NAFA AGRITECH
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-4 sm:px-6 pb-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Mail className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Lien de confirmation expédié</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Un e-mail contenant votre lien d'activation sécurisé a été envoyé à :
              </p>
              {emailParam && (
                <div className="py-1 px-3 rounded-lg bg-muted text-xs font-mono font-bold text-foreground inline-block">
                  {emailParam}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60 text-[11px] text-muted-foreground text-left space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Instructions :
              </p>
              <p>1. Ouvrez votre messagerie et cliquez sur le bouton de confirmation.</p>
              <p>2. Si le message n'apparaît pas, inspectez votre dossier de courriers indésirables (spams).</p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={resending || resent}
                onClick={handleResend}
                className="w-full h-11 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
              >
                {resending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : resent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>E-mail renvoyé !</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Renvoyer l'e-mail de confirmation</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={() => navigate("/connexion")}
                className="w-full h-11 gradient-primary text-primary-foreground font-bold text-sm rounded-xl flex items-center justify-center gap-2"
              >
                <span>Accéder à la connexion</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
