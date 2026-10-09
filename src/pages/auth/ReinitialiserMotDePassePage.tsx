import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import logo from "@/assets/logo.png";

export default function ReinitialiserMotDePassePage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Vérifier la présence d'une session de récupération Supabase
  useEffect(() => {
    let isMounted = true;

    const checkRecovery = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          if (session) {
            setHasValidSession(true);
          } else {
            // Écouter si un événement PASSWORD_RECOVERY arrive depuis le hash URL
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              if (event === "PASSWORD_RECOVERY" || session) {
                setHasValidSession(true);
              }
            });
            setTimeout(() => {
              if (isMounted) setCheckingSession(false);
            }, 1000);
            return () => subscription.unsubscribe();
          }
          setCheckingSession(false);
        }
      } catch (err) {
        if (isMounted) setCheckingSession(false);
      }
    };

    checkRecovery();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Le nouveau mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        setErrorMessage(error.message || "Erreur lors de la mise à jour du mot de passe.");
      } else {
        setSuccess(true);
        toast.success("Mot de passe mis à jour avec succès !");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-3 sm:p-6">
      <div className="w-full max-w-md my-6">
        <Card className="border-border/60 shadow-warm">
          <CardHeader className="text-center space-y-3 pt-6 pb-4">
            <div className="mx-auto h-16 w-16 rounded-3xl overflow-hidden bg-white shadow-md border-2 border-emerald-500/20 p-2 flex items-center justify-center">
              <img src={logo} alt="NAFA AGRITECH" className="h-full w-full object-contain rounded-2xl" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-heading font-extrabold text-foreground tracking-tight">
                Nouveau mot de passe
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 text-muted-foreground">
                Définissez un nouveau mot de passe pour votre compte NAFA AGRITECH
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-4 sm:px-6 pb-6">
            {checkingSession ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Vérification du lien de sécurité...</p>
              </div>
            ) : success ? (
              <div className="space-y-4 text-center py-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Mot de passe réinitialisé</h3>
                  <p className="text-xs text-muted-foreground">
                    Votre mot de passe a été modifié. Redirection automatique vers votre tableau de bord...
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="w-full h-11 gradient-primary text-primary-foreground font-bold text-sm rounded-xl"
                >
                  Accéder à mon espace
                </Button>
              </div>
            ) : !hasValidSession ? (
              <div className="space-y-4 text-center py-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Lien expiré ou invalide</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Le lien de réinitialisation est expiré ou a déjà été utilisé. Veuillez formuler une nouvelle demande.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => navigate("/mot-de-passe-oublie")}
                  className="w-full h-11 gradient-primary text-primary-foreground font-bold text-sm rounded-xl"
                >
                  Demander un nouveau lien
                </Button>
                <Link
                  to="/connexion"
                  className="text-xs font-semibold text-primary hover:underline block pt-2"
                >
                  Retourner à la connexion
                </Link>
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
                  <Label htmlFor="newPassword" className="text-xs font-bold text-foreground">
                    Nouveau mot de passe *
                  </Label>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                      className="pl-9 pr-9 h-11 rounded-xl text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newConfirmPassword" className="text-xs font-bold text-foreground">
                    Confirmer le nouveau mot de passe *
                  </Label>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newConfirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Répétez le nouveau mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                      className="pl-9 pr-9 h-11 rounded-xl text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
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
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <span>Mettre à jour mon mot de passe</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
