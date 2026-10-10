import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSafeRedirectUrl } from "@/lib/safeRedirect";
import { hasOfflineCredentials } from "@/lib/offlineAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowRight, ArrowLeft, Lock, Mail, Phone,
  AlertCircle, Loader2, WifiOff, CheckCircle2, ShieldCheck,
  UserCheck, RefreshCw, KeyRound, Sparkles
} from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { MaxItPhoneInput } from "@/components/auth/MaxItPhoneInput";
import { MaxItPinPad } from "@/components/auth/MaxItPinPad";
import {
  WEST_AFRICAN_COUNTRIES,
  WestAfricanCountry,
  maxItStorage,
  deriveTechnicalPassword,
  maskPhoneNumber,
  RememberedUserAccount,
} from "@/lib/maxItAuthUtils";

type AuthMode = "maxit_phone" | "classic_email";
type PhoneStep = "enter_phone" | "enter_pin" | "enter_otp";

export default function ConnexionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, primaryRole, signIn, signInOffline, signInWithPhoneOtp, verifyPhoneOtp } = useAuth();

  const redirectParam = searchParams.get("redirect");
  const targetUrl = getSafeRedirectUrl(redirectParam, "/dashboard");
  const isLoggedOut = searchParams.get("deconnecte") === "true";

  // Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      navigate(targetUrl, { replace: true });
    }
  }, [user, navigate, targetUrl]);

  // Mode principal : Max It par Téléphone (défaut) ou Classique par E-mail
  const [authMode, setAuthMode] = useState<AuthMode>("maxit_phone");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("enter_phone");

  // Pays sélectionné (Burkina Faso par défaut)
  const [selectedCountry, setSelectedCountry] = useState<WestAfricanCountry>(WEST_AFRICAN_COUNTRIES[0]);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Compte mémorisé sur l'appareil (style Orange Max It)
  const [rememberedAccount, setRememberedAccount] = useState<RememberedUserAccount | null>(null);

  // Mode Email / Mot de passe classique
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

    // Détecter un compte déjà mémorisé sur l'appareil
    const remembered = maxItStorage.getRememberedAccount();
    if (remembered) {
      setRememberedAccount(remembered);
      // Extraire le pays et les chiffres si possible
      const matchingCountry = WEST_AFRICAN_COUNTRIES.find((c) => remembered.phone.startsWith(c.dialCode));
      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
        setPhoneDigits(remembered.phone.slice(matchingCountry.dialCode.length));
      } else {
        setPhoneDigits(remembered.phone.replace(/[^0-9]/g, "").slice(-8));
      }
      setPhoneStep("enter_pin");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Numéro complet au format international standard E.164
  const getFullPhoneNumber = () => {
    return `${selectedCountry.dialCode}${phoneDigits}`;
  };

  // Passer à l'étape PIN depuis la saisie du numéro
  const handlePhoneContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (phoneDigits.length < selectedCountry.minLength) {
      setErrorMessage(`Veuillez saisir un numéro valide à ${selectedCountry.minLength} chiffres pour le ${selectedCountry.name}.`);
      return;
    }

    setPhoneStep("enter_pin");
    setPinCode("");
  };

  // Soumission Connexion Code PIN (Max It)
  const handlePinSubmit = async (pinToVerify?: string) => {
    const currentPin = pinToVerify || pinCode;
    if (currentPin.length < 4) {
      setErrorMessage("Veuillez saisir votre code secret complet à 4 chiffres.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const fullPhone = getFullPhoneNumber();
    const technicalPassword = deriveTechnicalPassword(fullPhone, currentPin);

    try {
      // 1. Si hors-ligne : déverrouillage sécurisé local avec PBKDF2
      if (!isOnline) {
        const { error: offlineErr } = await signInOffline(fullPhone, technicalPassword);
        if (offlineErr) {
          // Essayer aussi avec le PIN brut si enregistré par une version précédente
          const { error: rawPinErr } = await signInOffline(fullPhone, currentPin);
          if (rawPinErr) {
            setErrorMessage("Code secret hors-ligne incorrect ou aucun compte synchronisé sur cet appareil.");
            setLoading(false);
            return;
          }
        }

        toast.success("Connexion locale réussie (Mode sans connexion)");
        navigate(targetUrl, { replace: true });
        return;
      }

      // 2. Connexion en ligne (Supabase Auth)
      // On teste d'abord avec le mot de passe dérivé du PIN
      let loginResult = await signIn(fullPhone, technicalPassword, "phone");

      // Si échec (ex: compte créé avec PIN direct ou mot de passe standard), essayer le mot de passe PIN direct
      if (loginResult.error) {
        const fallbackResult = await signIn(fullPhone, currentPin, "phone");
        if (!fallbackResult.error) {
          loginResult = fallbackResult;
        }
      }

      if (loginResult.error) {
        const msg = loginResult.error.message || "";
        if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
          setErrorMessage("Code secret incorrect pour ce numéro de téléphone.");
        } else if (msg.includes("User not found")) {
          setErrorMessage("Aucun compte associé à ce numéro. Souhaitez-vous créer un compte ?");
        } else {
          setErrorMessage(msg || "Erreur de connexion.");
        }
      } else {
        // Mémoriser le compte pour la prochaine ouverture (expérience Max It)
        maxItStorage.saveRememberedAccount({
          phone: fullPhone,
          fullName: rememberedAccount?.fullName || profile?.full_name || "Utilisateur",
          lastLoginAt: Date.now(),
        });

        toast.success("Bon retour sur NAFA AGRITECH !");
        navigate(targetUrl, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur de connexion réseau.");
    } finally {
      setLoading(false);
    }
  };

  // Demande de code SMS temporaire (secours)
  const handleRequestSmsOtp = async () => {
    setLoading(true);
    setErrorMessage(null);
    const fullPhone = getFullPhoneNumber();

    try {
      const res = await signInWithPhoneOtp(fullPhone);
      if (res.error) {
        setErrorMessage(res.error.message || "Impossible d'envoyer le code SMS pour l'instant.");
      } else {
        setPhoneStep("enter_otp");
        toast.success("Code de sécurité envoyé par SMS au " + fullPhone);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  // Validation du code OTP reçu par SMS
  const handleVerifySmsOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setErrorMessage("Veuillez saisir le code complet à 6 chiffres.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    const fullPhone = getFullPhoneNumber();

    try {
      const res = await verifyPhoneOtp(fullPhone, otpCode.trim());
      if (res.error) {
        setErrorMessage(res.error.message || "Code SMS incorrect ou expiré.");
      } else if (res.isNewUser) {
        navigate(`/inscription?phone=${encodeURIComponent(fullPhone)}&redirect=${encodeURIComponent(targetUrl)}`);
      } else {
        maxItStorage.saveRememberedAccount({
          phone: fullPhone,
          fullName: rememberedAccount?.fullName || "Utilisateur",
          lastLoginAt: Date.now(),
        });
        toast.success("Connexion réussie !");
        navigate(targetUrl, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la vérification du code.");
    } finally {
      setLoading(false);
    }
  };

  // Soumission Connexion Classique par E-mail
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setErrorMessage("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
      return;
    }

    setLoading(true);

    try {
      if (!isOnline) {
        const { error: offlineErr } = await signInOffline(trimmedEmail, password);
        if (offlineErr) {
          setErrorMessage(offlineErr.message || "Identifiants hors-ligne introuvables.");
        } else {
          toast.success("Connexion hors-ligne réussie !");
          navigate(targetUrl, { replace: true });
        }
        setLoading(false);
        return;
      }

      const { error } = await signIn(trimmedEmail, password, "email");
      if (error) {
        setErrorMessage("Adresse e-mail ou mot de passe incorrect.");
      } else {
        toast.success("Bon retour sur NAFA AGRITECH !");
        navigate(targetUrl, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  // Changer de compte (réinitialiser le compte mémorisé)
  const handleChangeAccount = () => {
    setRememberedAccount(null);
    setPhoneStep("enter_phone");
    setPhoneDigits("");
    setPinCode("");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6 text-foreground">
      <div className="w-full max-w-md my-4">
        {/* Barre supérieure navigation */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 shadow-2xs transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-[#F97316]" />
            <span>Accueil</span>
          </Button>

          <Link
            to={`/inscription${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
            className="text-xs font-bold text-[#F97316] hover:underline bg-[#F97316]/10 px-3 py-1.5 rounded-xl border border-[#F97316]/30 flex items-center gap-1.5"
          >
            <span>Créer un compte</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Carte principale d'authentification style Orange Max It */}
        <Card className="border-border/60 shadow-2xl bg-card/95 backdrop-blur-xl rounded-3xl overflow-hidden border">
          {/* Bannière Header élégante */}
          <div className="p-6 pb-4 text-center space-y-3 bg-gradient-to-b from-[#F97316]/10 to-transparent">
            <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-3xl overflow-hidden bg-white shadow-lg border-2 border-[#F97316]/30 p-2 flex items-center justify-center">
              <img src={logo} alt="NAFA AGRITECH" className="h-full w-full object-contain rounded-2xl" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316] text-[11px] font-extrabold uppercase tracking-wider mb-1">
                <Sparkles className="h-3 w-3" />
                <span>Connexion Rapide</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight">
                Bienvenue sur <span className="text-[#F97316]">NAFA</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
                Plateforme agro-pastorale et ingénierie de terrain
              </p>
            </div>
          </div>

          <CardContent className="p-5 sm:p-6 pt-2 space-y-5">
            {/* Alertes d'état */}
            {isLoggedOut && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Déconnexion effectuée avec succès.</span>
              </div>
            )}

            {!isOnline && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                <WifiOff className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Mode hors-ligne actif. Déverrouillez avec votre code secret PIN local.</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* ── MODE 1 : CONNEXION TYPE ORANGE MAX IT (PHONE & PIN) ── */}
            {authMode === "maxit_phone" && (
              <div className="space-y-4">
                {/* Cas A : Compte mémorisé sur l'appareil (Re-bonjour) */}
                {rememberedAccount && phoneStep === "enter_pin" && (
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#F97316]/10 text-[#F97316] font-bold text-sm flex items-center justify-center border border-[#F97316]/20">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-foreground leading-tight">
                          {rememberedAccount.fullName}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">
                          {maskPhoneNumber(rememberedAccount.phone)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleChangeAccount}
                      className="text-[11px] font-bold text-muted-foreground hover:text-foreground h-8 px-2"
                    >
                      Changer
                    </Button>
                  </div>
                )}

                {/* ÉTAPE 1 : Saisie du numéro de téléphone */}
                {phoneStep === "enter_phone" && (
                  <form onSubmit={handlePhoneContinue} className="space-y-4">
                    <div>
                      <Label className="text-xs font-bold text-foreground mb-1.5 block">
                        Votre numéro de téléphone mobile *
                      </Label>
                      <MaxItPhoneInput
                        country={selectedCountry}
                        onCountryChange={setSelectedCountry}
                        phoneNumber={phoneDigits}
                        onPhoneNumberChange={setPhoneDigits}
                        autoFocus
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || phoneDigits.length < selectedCountry.minLength}
                      className="w-full h-12 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>Continuer</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                )}

                {/* ÉTAPE 2 : Saisie du Code Secret PIN (Clavier Tactile Max It) */}
                {phoneStep === "enter_pin" && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    {!rememberedAccount && (
                      <div className="flex items-center justify-between px-1">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {selectedCountry.flag} {getFullPhoneNumber()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPhoneStep("enter_phone")}
                          className="text-xs text-[#F97316] hover:underline font-bold"
                        >
                          Modifier le numéro
                        </button>
                      </div>
                    )}

                    {/* Pavé de Code Secret PIN Max It */}
                    <MaxItPinPad
                      pin={pinCode}
                      onPinChange={setPinCode}
                      pinLength={4}
                      onComplete={(completedPin) => handlePinSubmit(completedPin)}
                      disabled={loading}
                      label="Entrez votre Code Secret à 4 chiffres"
                    />

                    {/* Bouton de confirmation PIN */}
                    <Button
                      type="button"
                      disabled={loading || pinCode.length < 4}
                      onClick={() => handlePinSubmit()}
                      className="w-full h-12 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Vérification...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Se connecter</span>
                        </>
                      )}
                    </Button>

                    {/* Options secondaires de récupération */}
                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <button
                        type="button"
                        onClick={handleRequestSmsOtp}
                        className="text-muted-foreground hover:text-foreground font-semibold"
                      >
                        Code oublié ? Recevoir un SMS
                      </button>
                      <Link
                        to="/mot-de-passe-oublie"
                        className="text-muted-foreground hover:text-[#F97316] font-semibold"
                      >
                        Assistance
                      </Link>
                    </div>
                  </div>
                )}

                {/* ÉTAPE 3 : Secours OTP par SMS */}
                {phoneStep === "enter_otp" && (
                  <form onSubmit={handleVerifySmsOtp} className="space-y-4 animate-in fade-in duration-200">
                    <div className="text-center space-y-1">
                      <p className="text-xs font-bold text-foreground">
                        Saisissez le code à 6 chiffres reçu par SMS
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        au {getFullPhoneNumber()}
                      </p>
                    </div>

                    <div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Ex: 123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                        className="h-12 text-center font-mono text-2xl tracking-widest rounded-2xl"
                        autoFocus
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full h-12 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-sm rounded-2xl"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider le code SMS"}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setPhoneStep("enter_pin")}
                        className="text-xs text-[#F97316] hover:underline font-bold"
                      >
                        Retour à la saisie du code secret PIN
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ── MODE 2 : CONNEXION CLASSIQUE PAR E-MAIL (BUREAU / EXPERT) ── */}
            {authMode === "classic_email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-foreground">
                    Adresse e-mail professionnelle *
                  </Label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
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
                    <Label htmlFor="password" className="text-xs font-bold text-foreground">
                      Mot de passe *
                    </Label>
                    <Link
                      to="/mot-de-passe-oublie"
                      className="text-[11px] font-bold text-[#F97316] hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-9 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-sm rounded-xl"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter par e-mail"}
                </Button>
              </form>
            )}

            {/* Séparateur et bascule de mode */}
            <div className="pt-2 border-t border-border/60 text-center">
              {authMode === "maxit_phone" ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("classic_email");
                    setErrorMessage(null);
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 mx-auto py-1"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Se connecter plutôt avec une adresse e-mail</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("maxit_phone");
                    setErrorMessage(null);
                  }}
                  className="text-xs font-bold text-[#F97316] hover:underline flex items-center justify-center gap-1.5 mx-auto py-1"
                >
                  <Phone className="h-3.5 w-3.5 text-[#F97316]" />
                  <span>Se connecter avec mon numéro de mobile (Max It)</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pied de page informatif et rassurant */}
        <div className="mt-4 text-center space-y-2">
          <p className="text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Sécurité renforcée • Données certifiées conformes Burkina Faso</span>
          </p>
        </div>
      </div>
    </div>
  );
}
