import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSafeRedirectUrl } from "@/lib/safeRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Wheat, Beef, Handshake, GraduationCap, Briefcase,
  ArrowRight, ArrowLeft, Lock, Mail, User, Phone, CheckCircle2,
  AlertCircle, Loader2, ShieldCheck, Sparkles, KeyRound
} from "lucide-react";
import logo from "@/assets/logo.png";
import { PartnerProfileType, PARTNER_PROFILE_LIST } from "@/lib/partnerProfiles";
import { cn } from "@/lib/utils";
import { MaxItPhoneInput } from "@/components/auth/MaxItPhoneInput";
import { MaxItPinPad } from "@/components/auth/MaxItPinPad";
import {
  WEST_AFRICAN_COUNTRIES,
  WestAfricanCountry,
  deriveTechnicalPassword,
  maxItStorage,
} from "@/lib/maxItAuthUtils";

const AGRICULTURAL_PROFILES = [
  { id: "agriculteur", label: "Agriculteur / Producteur", icon: Wheat, desc: "Exploitant agricole, maraîcher, céréalier" },
  { id: "eleveur", label: "Éleveur / Agro-pasteur", icon: Beef, desc: "Bovins, ovins, caprins, aviculture" },
  { id: "partenaire", label: "Partenaire Agricole", icon: Handshake, desc: "Fournisseur d'intrants, machinisme, crédit" },
  { id: "agent_technique", label: "Conseiller / Agent Technique", icon: Briefcase, desc: "Agronome, encadreur de terrain" },
  { id: "formation", label: "Centre de Formation / Étudiant", icon: GraduationCap, desc: "Formation agronomique et rurale" },
];

type InscriptionMode = "maxit_phone" | "classic_email";
type InscriptionStep = "step_identity" | "step_activity" | "step_pin";

export default function InscriptionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp } = useAuth();

  const redirectParam = searchParams.get("redirect");
  const targetUrl = getSafeRedirectUrl(redirectParam, "/dashboard");

  // Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      navigate(targetUrl, { replace: true });
    }
  }, [user, navigate, targetUrl]);

  // Mode principal : Max It par Téléphone (défaut) ou Classique par E-mail
  const [inscriptionMode, setInscriptionMode] = useState<InscriptionMode>("maxit_phone");
  const [step, setStep] = useState<InscriptionStep>("step_identity");

  // Données du compte
  const [selectedCountry, setSelectedCountry] = useState<WestAfricanCountry>(WEST_AFRICAN_COUNTRIES[0]);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("agriculteur");
  const [partnerType, setPartnerType] = useState<PartnerProfileType>("fournisseur_intrants");
  const [companyName, setCompanyName] = useState("");

  // Code Secret PIN (4 chiffres)
  const [pinCode, setPinCode] = useState("");
  const [confirmPinCode, setConfirmPinCode] = useState("");
  const [isConfirmingPin, setIsConfirmingPin] = useState(false);

  // Inscription classique Email
  const [email, setEmail] = useState("");
  const [classicPassword, setClassicPassword] = useState("");
  const [classicConfirmPassword, setClassicConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pré-remplir le numéro si présent dans l'URL
  useEffect(() => {
    const phoneParam = searchParams.get("phone");
    if (phoneParam) {
      const cleanDigits = phoneParam.replace(/[^0-9]/g, "");
      const matching = WEST_AFRICAN_COUNTRIES.find((c) => phoneParam.startsWith(c.dialCode));
      if (matching) {
        setSelectedCountry(matching);
        setPhoneDigits(cleanDigits.slice(matching.dialCode.length - 1));
      } else {
        setPhoneDigits(cleanDigits.slice(-8));
      }
    }
  }, [searchParams]);

  const getFullPhoneNumber = () => {
    return `${selectedCountry.dialCode}${phoneDigits}`;
  };

  // Étape 1 vers Étape 2 (Identité -> Activité)
  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Veuillez renseigner votre nom et prénom (au moins 2 caractères).");
      return;
    }

    if (phoneDigits.length < selectedCountry.minLength) {
      setErrorMessage(`Veuillez saisir un numéro de téléphone valide à ${selectedCountry.minLength} chiffres pour le ${selectedCountry.name}.`);
      return;
    }

    setStep("step_activity");
  };

  // Étape 2 vers Étape 3 (Activité -> Code Secret PIN)
  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (role === "partenaire" && !companyName.trim()) {
      setErrorMessage("Veuillez préciser le nom de votre entreprise ou structure.");
      return;
    }

    setStep("step_pin");
    setIsConfirmingPin(false);
    setPinCode("");
    setConfirmPinCode("");
  };

  // Gestion du PIN et confirmation PIN (Étape 3)
  const handlePinComplete = (enteredPin: string) => {
    if (!isConfirmingPin) {
      // Passer à la confirmation du PIN
      setIsConfirmingPin(true);
      setConfirmPinCode("");
      toast.info("Confirmez votre code secret à 4 chiffres.");
    } else {
      // Valider la concordance des PIN
      if (enteredPin !== pinCode) {
        setErrorMessage("Les codes secrets ne correspondent pas. Recommencez la saisie.");
        setIsConfirmingPin(false);
        setPinCode("");
        setConfirmPinCode("");
      } else {
        // Enregistrer le compte
        finalizeMaxItRegistration(enteredPin);
      }
    }
  };

  // Enregistrement final du compte Max It
  const finalizeMaxItRegistration = async (confirmedPin: string) => {
    setLoading(true);
    setErrorMessage(null);

    const fullPhone = getFullPhoneNumber();
    const technicalPassword = deriveTechnicalPassword(fullPhone, confirmedPin);

    try {
      const partnerMeta = role === "partenaire" ? {
        partner_type: partnerType,
        company_name: companyName.trim() || fullName.trim(),
        services_offered: "",
        service_area: selectedCountry.name,
      } : undefined;

      const { error } = await signUp(
        fullPhone,
        technicalPassword,
        fullName.trim(),
        role,
        fullPhone,
        undefined,
        "phone",
        partnerMeta
      );

      if (error) {
        if (error.message?.includes("User already registered") || error.message?.includes("already_exists")) {
          setErrorMessage("Ce numéro de téléphone est déjà enregistré. Connectez-vous avec votre code secret.");
        } else {
          setErrorMessage(error.message || "Erreur lors de la création du compte.");
        }
      } else {
        // Mémoriser le compte pour la prochaine session
        maxItStorage.saveRememberedAccount({
          phone: fullPhone,
          fullName: fullName.trim(),
          role,
          lastLoginAt: Date.now(),
        });

        toast.success("Compte NAFA créé avec succès ! Bienvenue !");
        navigate(targetUrl, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur de création de compte.");
    } finally {
      setLoading(false);
    }
  };

  // Inscription classique E-mail / Mot de passe
  const handleClassicEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Veuillez renseigner votre nom complet.");
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    if (classicPassword.length < 8) {
      setErrorMessage("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (classicPassword !== classicConfirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const partnerMeta = role === "partenaire" ? {
        partner_type: partnerType,
        company_name: companyName.trim() || trimmedName,
        services_offered: "",
        service_area: "Burkina Faso",
      } : undefined;

      const { error } = await signUp(
        trimmedEmail,
        classicPassword,
        trimmedName,
        role,
        phoneDigits ? getFullPhoneNumber() : undefined,
        trimmedEmail,
        "email",
        partnerMeta
      );

      if (error) {
        setErrorMessage(error.message || "Erreur lors de l'inscription.");
      } else {
        toast.success("Compte créé ! Vérifiez votre adresse e-mail.");
        navigate(`/verifier-email?email=${encodeURIComponent(trimmedEmail)}`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur d'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-6 text-foreground">
      <div className="w-full max-w-lg my-4">
        {/* Navigation retour */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (step === "step_pin") {
                setStep("step_activity");
              } else if (step === "step_activity") {
                setStep("step_identity");
              } else {
                navigate("/connexion");
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 shadow-2xs transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-[#F97316]" />
            <span>{step === "step_identity" ? "Connexion" : "Retour"}</span>
          </Button>

          <Link
            to={`/connexion${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
            className="text-xs font-bold text-[#F97316] hover:underline bg-[#F97316]/10 px-3 py-1.5 rounded-xl border border-[#F97316]/30 flex items-center gap-1.5"
          >
            <span>Déjà inscrit ? Se connecter</span>
          </Link>
        </div>

        {/* Carte principale d'inscription type Max It */}
        <Card className="border-border/60 shadow-2xl bg-card/95 backdrop-blur-xl rounded-3xl overflow-hidden border">
          {/* Header Orange Max It */}
          <div className="p-6 pb-4 text-center space-y-3 bg-gradient-to-b from-[#F97316]/10 to-transparent">
            <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-3xl overflow-hidden bg-white shadow-lg border-2 border-[#F97316]/30 p-2 flex items-center justify-center">
              <img src={logo} alt="NAFA AGRITECH" className="h-full w-full object-contain rounded-2xl" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316] text-[11px] font-extrabold uppercase tracking-wider mb-1">
                <Sparkles className="h-3 w-3" />
                <span>Inscription Rapide Max It</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight">
                Créer un compte <span className="text-[#F97316]">NAFA</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
                Accès direct aux outils agronomiques et de terrain
              </p>
            </div>

            {/* Indicateur d'étapes (1 -> 2 -> 3) pour Max It */}
            {inscriptionMode === "maxit_phone" && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className={cn("h-2 rounded-full transition-all", step === "step_identity" ? "w-8 bg-[#F97316]" : "w-2 bg-muted")} />
                <div className={cn("h-2 rounded-full transition-all", step === "step_activity" ? "w-8 bg-[#F97316]" : "w-2 bg-muted")} />
                <div className={cn("h-2 rounded-full transition-all", step === "step_pin" ? "w-8 bg-[#F97316]" : "w-2 bg-muted")} />
              </div>
            )}
          </div>

          <CardContent className="p-5 sm:p-6 pt-2 space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* ── MODE MAX IT PAR TÉLÉPHONE & CODE PIN ── */}
            {inscriptionMode === "maxit_phone" && (
              <div className="space-y-4">
                {/* ÉTAPE 1 : Identité & Numéro de téléphone */}
                {step === "step_identity" && (
                  <form onSubmit={handleIdentitySubmit} className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-xs font-bold text-foreground">
                        Nom et Prénom *
                      </Label>
                      <div className="relative">
                        <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Ex: Oumarou Sawadogo"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          disabled={loading}
                          className="pl-9 h-12 rounded-2xl text-sm"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        Numéro de téléphone mobile *
                      </Label>
                      <MaxItPhoneInput
                        country={selectedCountry}
                        onCountryChange={setSelectedCountry}
                        phoneNumber={phoneDigits}
                        onPhoneNumberChange={setPhoneDigits}
                        disabled={loading}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !fullName.trim() || phoneDigits.length < selectedCountry.minLength}
                      className="w-full h-12 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-2"
                    >
                      <span>Continuer vers mon profil</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                )}

                {/* ÉTAPE 2 : Choix de l'activité agricole */}
                {step === "step_activity" && (
                  <form onSubmit={handleActivitySubmit} className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-foreground">
                        Votre activité principale *
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        {AGRICULTURAL_PROFILES.map((p) => {
                          const IconComp = p.icon;
                          const isSelected = role === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setRole(p.id)}
                              disabled={loading}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all",
                                isSelected
                                  ? "border-[#F97316] bg-[#F97316]/10 text-foreground font-bold shadow-xs"
                                  : "border-border/80 hover:border-[#F97316]/40 text-muted-foreground hover:text-foreground bg-card"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                isSelected ? "bg-[#F97316] text-white" : "bg-muted text-muted-foreground"
                              )}>
                                <IconComp className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold block">{p.label}</span>
                                <span className="text-[11px] text-muted-foreground line-clamp-1">{p.desc}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {role === "partenaire" && (
                      <div className="space-y-1.5 p-3 rounded-2xl bg-muted/40 border border-border">
                        <Label htmlFor="companyName" className="text-xs font-bold">
                          Nom de l'entreprise ou structure *
                        </Label>
                        <Input
                          id="companyName"
                          placeholder="Ex: Société Agro-Semences Sahel"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          disabled={loading}
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-2"
                    >
                      <span>Créer mon code secret PIN</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                )}

                {/* ÉTAPE 3 : Définition et confirmation du Code Secret PIN Max It */}
                {step === "step_pin" && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-center space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F97316]/10 text-[#F97316] text-xs font-extrabold">
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>{isConfirmingPin ? "Étape 3B : Confirmation du PIN" : "Étape 3A : Choix du PIN"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">
                        Ce code à 4 chiffres protégera votre compte et permettra de vous connecter en 1 seconde.
                      </p>
                    </div>

                    {!isConfirmingPin ? (
                      <MaxItPinPad
                        pin={pinCode}
                        onPinChange={setPinCode}
                        pinLength={4}
                        onComplete={handlePinComplete}
                        disabled={loading}
                        label="Choisissez un code secret à 4 chiffres"
                      />
                    ) : (
                      <MaxItPinPad
                        pin={confirmPinCode}
                        onPinChange={setConfirmPinCode}
                        pinLength={4}
                        onComplete={handlePinComplete}
                        disabled={loading}
                        label="Confirmez à nouveau votre code secret"
                      />
                    )}

                    {loading && (
                      <div className="flex items-center justify-center gap-2 text-xs text-[#F97316] font-bold py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Création et sécurisation de votre compte...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── MODE CLASSIQUE E-MAIL ── */}
            {inscriptionMode === "classic_email" && (
              <form onSubmit={handleClassicEmailSubmit} className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <Label htmlFor="classicFullName" className="text-xs font-bold text-foreground">
                    Nom et Prénom *
                  </Label>
                  <Input
                    id="classicFullName"
                    placeholder="Ex: Oumarou Sawadogo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="classicEmail" className="text-xs font-bold text-foreground">
                    Adresse e-mail *
                  </Label>
                  <Input
                    id="classicEmail"
                    type="email"
                    placeholder="agri@exemple.bf"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="classicPass" className="text-xs font-bold text-foreground">
                      Mot de passe *
                    </Label>
                    <Input
                      id="classicPass"
                      type="password"
                      placeholder="Min. 8 car."
                      value={classicPassword}
                      onChange={(e) => setClassicPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                      className="h-11 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="classicConfirm" className="text-xs font-bold text-foreground">
                      Confirmation *
                    </Label>
                    <Input
                      id="classicConfirm"
                      type="password"
                      placeholder="Répétez"
                      value={classicConfirmPassword}
                      onChange={(e) => setClassicConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                      className="h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-sm rounded-xl"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer mon compte par e-mail"}
                </Button>
              </form>
            )}

            {/* Bascule vers inscription par email */}
            <div className="pt-2 border-t border-border/60 text-center">
              {inscriptionMode === "maxit_phone" ? (
                <button
                  type="button"
                  onClick={() => {
                    setInscriptionMode("classic_email");
                    setErrorMessage(null);
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 mx-auto py-1"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>S'inscrire plutôt avec une adresse e-mail</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setInscriptionMode("maxit_phone");
                    setErrorMessage(null);
                  }}
                  className="text-xs font-bold text-[#F97316] hover:underline flex items-center justify-center gap-1.5 mx-auto py-1"
                >
                  <Phone className="h-3.5 w-3.5 text-[#F97316]" />
                  <span>S'inscrire avec mon numéro mobile (Max It)</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pied de page */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Disponible sans connexion Internet (Mode local sécurisé)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
