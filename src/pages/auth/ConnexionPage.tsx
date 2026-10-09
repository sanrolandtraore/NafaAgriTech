import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSafeRedirectUrl } from "@/lib/safeRedirect";
import { hasOfflineCredentials } from "@/lib/offlineAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowRight, ArrowLeft, Lock, Mail, Phone,
  AlertCircle, Loader2, Eye, EyeOff, WifiOff, CheckCircle2, ShieldCheck
} from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export default function ConnexionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signInOffline, signInWithPhoneOtp, verifyPhoneOtp } = useAuth();

  const redirectParam = searchParams.get("redirect");
  const targetUrl = getSafeRedirectUrl(redirectParam, "/dashboard");
  const isLoggedOut = searchParams.get("deconnecte") === "true";

  // Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      navigate(targetUrl, { replace: true });
    }
  }, [user, navigate, targetUrl]);

  // Mode de connexion : "email" par défaut, "phone" en option
  const [method, setMethod] = useState<"email" | "phone">("email");

  // Champs Email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Champs Téléphone OTP
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [hasCachedCreds, setHasCachedCreds] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    hasOfflineCredentials().then(setHasCachedCreds);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Soumission Connexion Email / Mot de passe
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    if (!password) {
      setErrorMessage("Veuillez renseigner votre mot de passe.");
      return;
    }

    setLoading(true);

    try {
      // Mode hors-ligne : tentative de déverrouillage local si disponible
      if (!isOnline) {
        const { error: offlineErr } = await signInOffline(trimmedEmail, password);
        if (offlineErr) {
          setErrorMessage(offlineErr.message || "Identifiants hors-ligne introuvables ou incorrects.");
        } else {
          toast.success("Connexion hors-ligne réussie !");
          navigate(targetUrl, { replace: true });
        }
        setLoading(false);
        return;
      }

      const { error } = await signIn(trimmedEmail, password, "email");

      if (error) {
        if (error.message?.includes("Invalid login credentials") || error.message?.includes("invalid_credentials")) {
          setErrorMessage("Adresse e-mail ou mot de passe incorrect.");
        } else if (error.message?.includes("Email not confirmed")) {
          setErrorMessage("Votre adresse e-mail n'a pas encore été confirmée. Veuillez vérifier votre boîte de réception.");
        } else {
          setErrorMessage(error.message || "Erreur de connexion.");
        }
      } else {
        toast.success("Bon retour sur NAFA AGRITECH !");
        navigate(targetUrl, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur réseau. Vérifiez votre connexion Internet.");
    } finally {
      setLoading(false);
    }
  };

  // Envoi code OTP Téléphone
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length < 8) {
      setErrorMessage("Veuillez saisir un numéro de téléphone valide à 8 chiffres.");
      return;
    }

    const fullPhone = phone.startsWith("+") ? phone : (cleaned.length === 8 ? "+226" + cleaned : "+" + cleaned);
    setLoading(true);

    try {
      const res = await signInWithPhoneOtp(fullPhone);
      if (res.error) {
        setErrorMessage(res.error.message || "Erreur lors de l'envoi du code.");
      } else {
        setOtpSent(true);
        toast.success("Code de sécurité généré pour " + fullPhone);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  // Vérification code OTP Téléphone
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpCode.trim().length !== 6) {
      setErrorMessage("Veuillez saisir le code complet à 6 chiffres.");
      return;
    }

    const cleaned = phone.replace(/[^0-9]/g, "");
    const fullPhone = phone.startsWith("+") ? phone : (cleaned.length === 8 ? "+226" + cleaned : "+" + cleaned);
    setLoading(true);

    try {
      const res = await verifyPhoneOtp(fullPhone, otpCode.trim());
      if (res.error) {
        setErrorMessage(res.error.message || "Code incorrect ou expiré.");
      } else if (res.isNewUser) {
        navigate(`/inscription?phone=${encodeURIComponent(fullPhone)}&redirect=${encodeURIComponent(targetUrl)}`);
      } else {
        toast.success("Connexion réussie !");
        navigate(targetUrl, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur de validation du code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-3 sm:p-6">
      <div className="w-full max-w-lg my-6">
        {/* Navigation retour */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-white/80 dark:bg-card/80 backdrop-blur-md rounded-xl border border-border/60 shadow-2xs hover:bg-accent transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-[#F97316]" />
            <span>Accueil</span>
          </Button>

          <Link
            to={`/inscription${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
            className="text-xs font-bold text-primary hover:underline"
          >
            Pas de compte ? S'inscrire
          </Link>
        </div>

        <Card className="border-border/60 shadow-warm">
          <CardHeader className="text-center space-y-3 pt-6 pb-4">
            <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-3xl overflow-hidden bg-white shadow-md border-2 border-emerald-500/20 p-2 flex items-center justify-center">
              <img src={logo} alt="NAFA AGRITECH" className="h-full w-full object-contain rounded-2xl" />
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight">
                Connexion <span className="text-gradient-warm">NAFA AGRITECH</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                Accédez à votre espace exploitation et à vos outils d'ingénierie
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-4 sm:px-6 pb-6">
            {isLoggedOut && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Vous avez été déconnecté avec succès.</span>
              </div>
            )}

            {!isOnline && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Mode hors-ligne actif. {hasCachedCreds ? "Vos identifiants en cache vous permettent d'accéder aux données locales." : "Une connexion préalable est requise pour le premier accès hors-ligne."}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Sélecteur de méthode (Email / Téléphone) */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted border border-border">
              <button
                type="button"
                onClick={() => { setMethod("email"); setErrorMessage(null); }}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  method === "email"
                    ? "bg-background shadow-xs text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Mail className="h-3.5 w-3.5" />
                <span>E-mail</span>
              </button>
              <button
                type="button"
                onClick={() => { setMethod("phone"); setErrorMessage(null); }}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  method === "phone"
                    ? "bg-background shadow-xs text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Téléphone / SMS</span>
              </button>
            </div>

            {/* FORMULAIRE 1 : CONNEXION PAR EMAIL */}
            {method === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="loginEmail" className="text-xs font-bold text-foreground">
                    Adresse e-mail *
                  </Label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="loginEmail"
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

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="loginPassword" className="text-xs font-bold text-foreground">
                      Mot de passe *
                    </Label>
                    <Link
                      to="/mot-de-passe-oublie"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="loginPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-9 pr-9 h-11 rounded-xl text-sm"
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 gradient-primary text-primary-foreground font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* FORMULAIRE 2 : CONNEXION PAR TÉLÉPHONE (OTP) */}
            {method === "phone" && (
              <div>
                {!otpSent ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phoneLogin" className="text-xs font-bold text-foreground">
                        Numéro de téléphone (Burkina Faso / Afrique de l'Ouest) *
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-input bg-muted/60 text-xs font-bold shrink-0">
                          <span>🇧🇫</span>
                          <span>+226</span>
                        </div>
                        <Input
                          id="phoneLogin"
                          type="tel"
                          placeholder="70 00 00 00"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          disabled={loading}
                          className="h-11 rounded-xl text-sm font-semibold"
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Envoi du code...</span>
                        </>
                      ) : (
                        <>
                          <span>Recevoir mon code de sécurité</span>
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Modifier le numéro ({phone})
                    </button>

                    <div className="space-y-1.5 text-center">
                      <Label htmlFor="otpInput" className="text-xs font-bold text-foreground block">
                        Saisissez le code à 6 chiffres
                      </Label>
                      <Input
                        id="otpInput"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="• • • • • •"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        required
                        disabled={loading}
                        className="text-center font-mono text-2xl tracking-[0.4em] font-extrabold h-14 rounded-xl border-2 border-emerald-500/40"
                        autoFocus
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Validation...</span>
                        </>
                      ) : (
                        <span>Valider et accéder à mon compte</span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}

            <div className="text-center pt-3 border-t border-border/60">
              <p className="text-xs text-muted-foreground">
                Vous n'avez pas encore de compte ?{" "}
                <Link
                  to={`/inscription${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
                  className="font-bold text-primary hover:underline"
                >
                  Inscrivez-vous gratuitement
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
