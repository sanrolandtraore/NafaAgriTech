import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Phone, KeyRound, User, Wheat, Beef, Handshake, ArrowLeft, ArrowRight,
  ShieldCheck, CheckCircle2, Lock, Mail, Store, WifiOff, Sparkles, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { hasOfflineCredentials } from "@/lib/offlineAuth";
import logo from "@/assets/logo.png";
import {
  PartnerProfileType,
  PARTNER_PROFILE_LIST,
  PARTNER_PROFILES,
} from "@/lib/partnerProfiles";
import { partnerTypeIcons } from "@/components/RoleSidebar";
import { HoneyTokenField } from "@/components/security/HoneyTokenField";
import { CyberShieldIDS, CyberShieldSystem, VelocitySentinel } from "@/lib/cyberShieldEngine";

type AuthFlow = "whatsapp" | "classic";
type WhatsAppStep = "phone" | "otp" | "profile";
type ClassicMode = "login" | "register" | "forgot";

const cleanPhone = (p: string) => p.replace(/[^0-9+]/g, "");
const normalizePhone = (p: string) => {
  const c = cleanPhone(p);
  if (c.startsWith("+")) return c;
  if (c.startsWith("00")) return "+" + c.slice(2);
  if (c.length === 8) return "+226" + c;
  return c.startsWith("226") ? "+" + c : "+226" + c;
};
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signInWithPhoneOtp, verifyPhoneOtp, signIn, signUp, signInOffline } = useAuth();

  // Redirection immédiate si déjà connecté
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Mode principal : "whatsapp" (par défaut, ultra simple) ou "classic" (fallback mot de passe)
  const initialMode = searchParams.get("mode") === "register" || searchParams.get("mode") === "signup" ? "register" : "login";
  const [flow, setFlow] = useState<AuthFlow>("whatsapp");
  const [waStep, setWaStep] = useState<WhatsAppStep>("phone");
  const [classicMode, setClassicMode] = useState<ClassicMode>(initialMode);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "register" || mode === "signup") {
      setClassicMode("register");
    } else if (mode === "login") {
      setClassicMode("login");
    }
  }, [searchParams]);

  // Champs WhatsApp
  const [rawPhone, setRawPhone] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [waFullName, setWaFullName] = useState("");
  const [waRole, setWaRole] = useState<"agriculteur" | "eleveur" | "partenaire">("agriculteur");
  const [waPartnerType, setWaPartnerType] = useState<PartnerProfileType>("fournisseur_intrants");
  const [waCompanyName, setWaCompanyName] = useState("");
  const [waServicesOffered, setWaServicesOffered] = useState("");
  const [waServiceArea, setWaServiceArea] = useState("");

  // Champs Classic
  const [classicMethod, setClassicMethod] = useState<"phone" | "email">("phone");
  const [classicPhone, setClassicPhone] = useState("");
  const [classicEmail, setClassicEmail] = useState("");
  const [classicPassword, setClassicPassword] = useState("");
  const [classicFullName, setClassicFullName] = useState("");
  const [classicRole, setClassicRole] = useState<string>("agriculteur");
  const [classicPartnerType, setClassicPartnerType] = useState<PartnerProfileType>("fournisseur_intrants");
  const [classicCompany, setClassicCompany] = useState("");
  const [classicServices, setClassicServices] = useState("");
  const [classicArea, setClassicArea] = useState("");

  // État général
  const [loading, setLoading] = useState(false);
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

  // Pré-remplir les services par défaut du partenaire
  useEffect(() => {
    if (waPartnerType && PARTNER_PROFILES[waPartnerType] && !waServicesOffered) {
      const p = PARTNER_PROFILES[waPartnerType];
      setWaServicesOffered(p.defaultProducts.slice(0, 3).join(", ") + " — " + p.defaultServices.slice(0, 2).join(", "));
    }
  }, [waPartnerType]);

  // -------------------------------------------------------------
  // FLOW WHATSAPP (SIMPLICITÉ MAXIMALE)
  // -------------------------------------------------------------

  // Étape 1 : Saisie numéro WhatsApp
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = rawPhone.replace(/[^0-9]/g, "");
    if (cleaned.length < 8) {
      toast.error("Veuillez saisir un numéro de téléphone valide à 8 chiffres (Burkina Faso).");
      return;
    }
    const fullPhone = normalizePhone(rawPhone);

    setLoading(true);
    try {
      const res = await signInWithPhoneOtp(fullPhone);
      if (res.error) {
        toast.error("Erreur lors de l'envoi du code : " + res.error.message);
      } else {
        toast.success(`Code envoyé au ${fullPhone} !`, {
          description: "Utilisez le code 123456 pour valider instantanément.",
        });
        setWaStep("otp");
      }
    } catch (err: any) {
      toast.error("Erreur inattendue : " + (err?.message || "Vérifiez votre connexion"));
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérification du code OTP (6 chiffres)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpToken.trim().length !== 6) {
      toast.error("Veuillez saisir le code à 6 chiffres.");
      return;
    }
    const fullPhone = normalizePhone(rawPhone);

    setLoading(true);
    try {
      // Tentative de validation
      const res = await verifyPhoneOtp(fullPhone, otpToken.trim());
      if (res.error) {
        toast.error(res.error.message || "Code incorrect.");
      } else if (res.isNewUser) {
        // Nouveau compte : demander le nom et rôle
        toast.success("Code vérifié !", {
          description: "Veuillez renseigner votre nom pour finaliser votre compte.",
        });
        setWaStep("profile");
      } else {
        // Compte déjà connu : redirection directe
        toast.success("Connexion réussie !", {
          description: "Bon retour sur NAFA - AGRITECH !",
        });
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error("Erreur de vérification : " + (err?.message || "Erreur inconnue"));
    } finally {
      setLoading(false);
    }
  };

  // Étape 3 : Finalisation du profil
  const handleFinalizeProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waFullName.trim()) {
      toast.error("Veuillez renseigner votre nom complet.");
      return;
    }

    if (waRole === "partenaire") {
      if (!waCompanyName.trim()) {
        toast.error("Veuillez indiquer le nom de votre entreprise ou structure.");
        return;
      }
      if (!waServicesOffered.trim()) {
        toast.error("Veuillez décrire brièvement les produits ou services proposés.");
        return;
      }
    }

    const fullPhone = normalizePhone(rawPhone);
    setLoading(true);
    try {
      const res = await verifyPhoneOtp(fullPhone, otpToken.trim() || "123456", {
        fullName: waFullName.trim(),
        role: waRole,
        partnerType: waRole === "partenaire" ? waPartnerType : undefined,
        companyName: waRole === "partenaire" ? waCompanyName.trim() : undefined,
        servicesOffered: waRole === "partenaire" ? waServicesOffered.trim() : undefined,
        serviceArea: waRole === "partenaire" ? (waServiceArea.trim() || "Burkina Faso") : undefined,
      });

      if (res.error) {
        toast.error("Erreur lors de l'enregistrement du profil : " + res.error.message);
      } else {
        toast.success("Bienvenue sur NAFA - AGRITECH !", {
          description: `Connecté en tant que ${waRole === "partenaire" ? PARTNER_PROFILES[waPartnerType]?.title || "Partenaire" : waRole}.`,
        });
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error("Erreur : " + (err?.message || "Erreur inconnue"));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // FLOW CLASSIQUE (MOT DE PASSE FALLBACK)
  // -------------------------------------------------------------
  const handleClassicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const authId = classicMethod === "phone" ? normalizePhone(classicPhone) : classicEmail.trim().toLowerCase();
    if (!authId) {
      toast.error("Identifiant requis");
      setLoading(false);
      return;
    }

    // 1. Analyse Autonome IDS / IPS anti-injections (XSS, SQLi, NoSQL)
    const scan = CyberShieldIDS.inspectPayload({ authId, classicPassword, classicFullName });
    if (scan.isThreat && scan.score >= 50) {
      CyberShieldSystem.registerIncident({
        threatCategory: scan.categories[0] || "ANOMALOUS_PAYLOAD",
        severity: scan.severity,
        score: scan.score,
        details: `Vecteur hostile intercepté sur le formulaire auth : ${scan.details.join(" | ")}`,
        autonomousAction: scan.autonomousAction,
      });
      toast.error("Vecteur suspect intercepté et bloqué par le bouclier de sécurité autonome.");
      setLoading(false);
      return;
    }

    // 2. Sentinelle anti-brute force et régulation de vélocité
    const vel = VelocitySentinel.checkAndRecordAttempt("auth_classic_" + authId);
    if (vel.isBlocked) {
      toast.error(`Sécurité : Compte temporairement verrouillé pour protection anti-brute force (${vel.remainingLockoutSeconds}s restantes).`);
      setLoading(false);
      return;
    }

    if (classicMode === "login") {
      if (!isOnline) {
        const { error } = await signInOffline(authId, classicPassword);
        if (error) toast.error(error.message);
        else {
          VelocitySentinel.reset("auth_classic_" + authId);
          toast.success("Connexion hors-ligne réussie !");
          navigate("/dashboard");
        }
        setLoading(false);
        return;
      }

      const { error } = await signIn(authId, classicPassword, classicMethod);
      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "Identifiants ou mot de passe incorrects." : error.message);
      } else {
        VelocitySentinel.reset("auth_classic_" + authId);
        toast.success("Connexion réussie !");
        navigate("/dashboard");
      }
    } else if (classicMode === "register") {
      if (!classicFullName.trim()) {
        toast.error("Nom complet requis");
        setLoading(false);
        return;
      }
      const partnerMeta = classicRole === "partenaire" ? {
        partner_type: classicPartnerType,
        company_name: classicCompany.trim() || classicFullName.trim(),
        services_offered: classicServices.trim(),
        service_area: classicArea.trim() || "Burkina Faso",
      } : undefined;

      const { error } = await signUp(
        authId,
        classicPassword,
        classicFullName.trim(),
        classicRole,
        classicMethod === "phone" ? authId : undefined,
        classicMethod === "email" ? authId : undefined,
        classicMethod,
        partnerMeta
      );

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Compte créé avec succès ! Connectez-vous.");
        setClassicMode("login");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero p-3 sm:p-4">
      <div className="w-full max-w-lg my-6 flex flex-col items-start">
        {/* Bouton Retour sur la page d'accueil */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-white/80 dark:bg-card/80 backdrop-blur-md rounded-xl border border-border/60 shadow-2xs hover:bg-accent transition-all active:scale-95"
          aria-label="Retour sur la page d'accueil"
        >
          <ArrowLeft className="h-4 w-4 text-[#F97316]" />
          <span>Retour sur la page d'accueil</span>
        </Button>

        <Card className="w-full border-border/60 shadow-warm animate-fade-in">
          <CardHeader className="text-center space-y-3 pt-6 pb-4">
            <img src={logo} alt="NAFA - AGRITECH" className="mx-auto h-20 w-auto drop-shadow-md" />
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight">
                NAFA <span className="text-gradient-warm">- AGRITECH</span>
              </CardTitle>
              <CardDescription className="text-sm mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                La technologie au service de l'agriculture africaine
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-4 sm:px-6 pb-6">
            {/* Onglets Principaux : Connexion / S'inscrire */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted border border-border">
              <button
                type="button"
                onClick={() => {
                  setClassicMode("login");
                  setWaStep("phone");
                }}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  classicMode === "login"
                    ? "bg-background shadow-xs text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Connexion</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setClassicMode("register");
                  setWaStep("phone");
                }}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  classicMode === "register"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>S'inscrire</span>
              </button>
            </div>

            {/* Avertissement hors-ligne si besoin */}
            {!isOnline && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                <WifiOff className="h-4 w-4 shrink-0" />
                <span>Mode hors-ligne détecté. Vos données locales restent accessibles.</span>
              </div>
            )}

            {/* ======================================================== */}
            {/* VUE 1 : FLOW WHATSAPP (PAR DÉFAUT - ULTRA SIMPLE)        */}
            {/* ======================================================== */}
            {flow === "whatsapp" && (
              <div className="space-y-4">
                {/* ÉTAPE 1 : NUMÉRO DE TÉLÉPHONE */}
                {waStep === "phone" && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                          {classicMode === "register"
                            ? "Inscription instantanée par numéro WhatsApp"
                            : "Connexion instantanée par numéro"}
                        </h4>
                        <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                          {classicMode === "register"
                            ? "Inscrivez-vous en 30 secondes avec votre numéro WhatsApp. Aucun mot de passe complexe à retenir."
                            : "Entrez simplement votre numéro de téléphone (comme sur WhatsApp). Aucun mot de passe complexe à mémoriser."}
                        </p>
                      </div>
                    </div>

                  <div className="space-y-2">
                    <Label htmlFor="waPhone" className="text-sm font-bold text-foreground">
                      Votre numéro de téléphone (Burkina Faso)
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-input bg-muted/60 text-sm font-bold shrink-0">
                        <span className="text-base">🇧🇫</span>
                        <span className="text-foreground">+226</span>
                      </div>
                      <Input
                        id="waPhone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="70 12 34 56"
                        value={rawPhone}
                        onChange={(e) => setRawPhone(e.target.value)}
                        required
                        className="text-base sm:text-lg font-semibold h-12 rounded-xl"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Exemple : 70 00 00 00, 76 00 00 00, 65 00 00 00
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                  >
                    {loading ? (
                      "Envoi en cours..."
                    ) : (
                      <>
                        Continuer <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* ÉTAPE 2 : CODE DE CONFIRMATION (OTP) */}
              {waStep === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setWaStep("phone")}
                    className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Modifier le numéro ({normalizePhone(rawPhone)})
                  </button>

                  <div className="text-center space-y-1">
                    <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 mb-1">
                      <KeyRound className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Code de confirmation</h3>
                    <p className="text-xs text-muted-foreground">
                      Saisissez le code à 6 chiffres envoyé au <strong className="text-foreground">{normalizePhone(rawPhone)}</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Input
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ""))}
                      required
                      className="text-center font-mono text-2xl tracking-[0.4em] font-extrabold h-14 rounded-xl border-2 border-emerald-500/40 focus:border-emerald-600"
                      autoFocus
                    />
                    {/* Badge d'aide au test instantané */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setOtpToken("123456")}
                        className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Code de test rapide : <strong>123456</strong> (Cliquer)
                      </button>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Renvoyer
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || otpToken.length !== 6}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    {loading ? "Vérification..." : "Vérifier le code"}
                  </Button>
                </form>
              )}

              {/* ÉTAPE 3 : FINALISATION DU PROFIL (RÔLE ET MÉTIER) */}
              {waStep === "profile" && (
                <form onSubmit={handleFinalizeProfile} className="space-y-4">
                  <div className="text-center space-y-1 pb-1">
                    <div className="inline-flex p-2.5 rounded-full bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Finalisez votre espace</h3>
                    <p className="text-xs text-muted-foreground">
                      Choisissez votre profil pour adapter automatiquement NAFA - AGRITECH à vos activités.
                    </p>
                  </div>

                  {/* Nom complet */}
                  <div className="space-y-1.5">
                    <Label htmlFor="waFullName" className="text-xs font-bold">
                      Votre nom et prénom (ou nom du gérant) *
                    </Label>
                    <Input
                      id="waFullName"
                      placeholder="Ex: Traoré Roland"
                      value={waFullName}
                      onChange={(e) => setWaFullName(e.target.value)}
                      required
                      className="rounded-xl h-11"
                      autoFocus
                    />
                  </div>

                  {/* Choix du Rôle Principal */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      Quel est votre rôle principal ? *
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setWaRole("agriculteur")}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all",
                          waRole === "agriculteur"
                            ? "border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-bold"
                            : "border-border hover:border-emerald-600/40 text-muted-foreground"
                        )}
                      >
                        <Wheat className="h-5 w-5 text-emerald-600" />
                        <span className="text-xs">Agriculteur</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWaRole("eleveur")}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all",
                          waRole === "eleveur"
                            ? "border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-200 font-bold"
                            : "border-border hover:border-amber-600/40 text-muted-foreground"
                        )}
                      >
                        <Beef className="h-5 w-5 text-amber-600" />
                        <span className="text-xs">Éleveur</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWaRole("partenaire")}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all",
                          waRole === "partenaire"
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border hover:border-primary/40 text-muted-foreground"
                        )}
                      >
                        <Handshake className="h-5 w-5 text-primary" />
                        <span className="text-xs">Partenaire</span>
                      </button>
                    </div>
                  </div>

                  {/* SPÉCIALISATION DU PARTENAIRE (SI PARTENAIRE SÉLECTIONNÉ) */}
                  {waRole === "partenaire" && (
                    <div className="space-y-3 pt-2 pb-2 border-t border-border">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <Store className="h-4 w-4" />
                          Spécialisation métier du partenaire (Profil non unifié) *
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Sélectionnez votre branche pour ouvrir votre espace dédié :
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PARTNER_PROFILE_LIST.filter((p) => p.id !== "polyvalent").map((p) => {
                          const IconComp = partnerTypeIcons[p.id] || Handshake;
                          const isSelected = waPartnerType === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setWaPartnerType(p.id);
                                const profileMeta = PARTNER_PROFILES[p.id];
                                if (profileMeta) {
                                  setWaServicesOffered(
                                    profileMeta.defaultProducts.slice(0, 3).join(", ") +
                                    " — " +
                                    profileMeta.defaultServices.slice(0, 2).join(", ")
                                  );
                                }
                              }}
                              className={cn(
                                "flex items-start gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all",
                                isSelected
                                  ? "border-primary bg-primary/10 shadow-xs"
                                  : "border-border hover:border-primary/40 hover:bg-muted/50"
                              )}
                            >
                              <div
                                className={cn(
                                  "p-2 rounded-lg shrink-0",
                                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}
                              >
                                <IconComp className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold block text-foreground truncate">{p.shortLabel}</span>
                                <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{p.tagline}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="waCompany" className="text-xs font-semibold">
                          Nom de votre entreprise ou structure *
                        </Label>
                        <Input
                          id="waCompany"
                          placeholder="Ex: SAPHYTO, Faso Machinisme, Cabinet Agro-Sahel…"
                          value={waCompanyName}
                          onChange={(e) => setWaCompanyName(e.target.value)}
                          required
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="waServices" className="text-xs font-semibold">
                          Produits et services proposés aux producteurs *
                        </Label>
                        <Textarea
                          id="waServices"
                          rows={2}
                          placeholder="Ex: Engrais NPK, semences certifiées, location tracteur…"
                          value={waServicesOffered}
                          onChange={(e) => setWaServicesOffered(e.target.value)}
                          required
                          className="rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="waArea" className="text-xs font-semibold">
                          Zone d'intervention (Ville / Région)
                        </Label>
                        <Input
                          id="waArea"
                          placeholder="Ex: Bobo-Dioulasso, Ouagadougou, Boucle du Mouhoun…"
                          value={waServiceArea}
                          onChange={(e) => setWaServiceArea(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 gradient-primary text-primary-foreground font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-md transition-all mt-2"
                  >
                    {loading ? "Création en cours..." : "Accéder à mon espace NAFA - AGRITECH"}
                  </Button>
                </form>
              )}

              {/* Lien discret de bascule vers le mode classique */}
              <div className="pt-2 text-center border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setFlow("classic")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Ou se connecter avec un e-mail et un mot de passe
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VUE 2 : MODE CLASSIQUE (E-MAIL / MOT DE PASSE FALLBACK)  */}
          {/* ======================================================== */}
          {flow === "classic" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <button
                  type="button"
                  onClick={() => setFlow("whatsapp")}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion rapide WhatsApp
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setClassicMode("login")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold",
                      classicMode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Connexion
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassicMode("register")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold",
                      classicMode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Inscription
                  </button>
                </div>
              </div>

              {/* Choix Méthode Classic (Phone ou Email) */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/60 border border-border">
                <button
                  type="button"
                  onClick={() => setClassicMethod("phone")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all",
                    classicMethod === "phone" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Phone className="h-3.5 w-3.5" /> Téléphone
                </button>
                <button
                  type="button"
                  onClick={() => setClassicMethod("email")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all",
                    classicMethod === "email" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </button>
              </div>

              <form onSubmit={handleClassicSubmit} className="space-y-3.5">
                <HoneyTokenField trapId="auth_hp_token" name="_auth_security_trap" />
                {classicMode === "register" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="classicName" className="text-xs font-bold">
                      Nom complet *
                    </Label>
                    <Input
                      id="classicName"
                      placeholder="Ex: Oumarou Sawadogo"
                      value={classicFullName}
                      onChange={(e) => setClassicFullName(e.target.value)}
                      required
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                )}

                {classicMethod === "phone" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="cPhone" className="text-xs font-bold">
                      Numéro de téléphone *
                    </Label>
                    <Input
                      id="cPhone"
                      type="tel"
                      placeholder="+226 70 00 00 00"
                      value={classicPhone}
                      onChange={(e) => setClassicPhone(e.target.value)}
                      required
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="cEmail" className="text-xs font-bold">
                      Adresse email *
                    </Label>
                    <Input
                      id="cEmail"
                      type="email"
                      placeholder="agri@exemple.bf"
                      value={classicEmail}
                      onChange={(e) => setClassicEmail(e.target.value)}
                      required
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="cPassword" className="text-xs font-bold">
                    Mot de passe *
                  </Label>
                  <Input
                    id="cPassword"
                    type="password"
                    placeholder="••••••••"
                    value={classicPassword}
                    onChange={(e) => setClassicPassword(e.target.value)}
                    required
                    minLength={8}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 gradient-primary text-primary-foreground font-bold text-sm rounded-xl mt-2"
                >
                  {loading ? "Chargement..." : classicMode === "login" ? "Se connecter" : "Créer mon compte"}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
