import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Mail, AlertCircle, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import logo from "@/assets/logo.png";

export default function MotDePasseOubliePage() {
  const navigate = useNavigate();
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPasswordForEmail(trimmedEmail);
      if (error) {
        setErrorMessage(error.message || "Impossible d'envoyer l'e-mail de réinitialisation.");
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
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
            <span>Retour à la connexion</span>
          </Button>
        </div>

        <Card className="border-border/60 shadow-warm">
          <CardHeader className="text-center space-y-3 pt-6 pb-4">
            <div className="mx-auto h-16 w-16 rounded-3xl overflow-hidden bg-white shadow-md border-2 border-emerald-500/20 p-2 flex items-center justify-center">
              <img src={logo} alt="NAFA AGRITECH" className="h-full w-full object-contain rounded-2xl" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-heading font-extrabold text-foreground tracking-tight">
                Mot de passe oublié ?
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 text-muted-foreground">
                Recevez un lien sécurisé pour redéfinir votre mot de passe
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-4 sm:px-6 pb-6">
            {submitted ? (
              <div className="space-y-4 text-center py-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">E-mail de récupération envoyé</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Si un compte correspond à <strong className="text-foreground">{email}</strong>, un lien sécurisé de réinitialisation y a été expédié.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60 text-[11px] text-muted-foreground text-left space-y-1">
                  <p className="font-semibold text-foreground">Conseils :</p>
                  <p>• Vérifiez également votre dossier de courriers indésirables (spams).</p>
                  <p>• Le lien expire sous quelques minutes pour votre sécurité.</p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                    className="w-full h-10 text-xs font-bold rounded-xl"
                  >
                    Renvoyer ou changer d'adresse e-mail
                  </Button>
                  <Link
                    to="/connexion"
                    className="text-xs font-bold text-primary hover:underline text-center pt-1"
                  >
                    Retourner à la page de connexion
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="resetEmail" className="text-xs font-bold text-foreground">
                    Votre adresse e-mail de connexion *
                  </Label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="agri@exemple.bf"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-9 h-11 rounded-xl text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 gradient-primary text-primary-foreground font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Envoyer le lien de réinitialisation</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/connexion"
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Vous vous souvenez de votre mot de passe ? Se connecter
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
