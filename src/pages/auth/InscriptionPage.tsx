import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSafeRedirectUrl } from "@/lib/safeRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Wheat, Beef, Handshake, GraduationCap, Briefcase,
  ArrowRight, ArrowLeft, Lock, Mail, User, Phone, CheckCircle2,
  AlertCircle, Loader2, Eye, EyeOff, ShieldCheck
} from "lucide-react";
import logo from "@/assets/logo.png";
import { PartnerProfileType, PARTNER_PROFILE_LIST } from "@/lib/partnerProfiles";
import { cn } from "@/lib/utils";

const AGRICULTURAL_PROFILES = [
  { id: "agriculteur", label: "Agriculteur / Producteur", icon: Wheat, desc: "Exploitant agricole, maraîcher, céréalier" },
  { id: "eleveur", label: "Éleveur / Agro-pasteur", icon: Beef, desc: "Bovins, ovins, caprins, aviculture" },
  { id: "partenaire", label: "Partenaire Agricole", icon: Handshake, desc: "Fournisseur d'intrants, machinisme, bureau d'études" },
  { id: "agent_technique", label: "Conseiller / Agent Technique", icon: Briefcase, desc: "Agronome, encadreur de terrain, vulgarisateur" },
  { id: "formation", label: "Centre de Formation / Étudiant", icon: GraduationCap, desc: "Apprenant ou formateur en sciences agronomiques" },
];

export default function InscriptionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp } = useAuth();

  const redirectParam = searchParams.get("redirect");
  const targetUrl = getSafeRedirectUrl(redirectParam, "/dashboard");

  // Redirection si l'utilisateur est déjà authentifié
  useEffect(() => {
    if (user) {
      navigate(targetUrl, { replace: true });
    }
  }, [user, navigate, targetUrl]);

  // États du formulaire
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("agriculteur");
  const [partnerType, setPartnerType] = useState<PartnerProfileType>("fournisseur_intrants");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation côté client
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Veuillez renseigner votre nom complet (au moins 2 caractères).");
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    if (role === "partenaire" && !companyName.trim()) {
      setErrorMessage("Veuillez préciser le nom de votre entreprise ou organisation partenaire.");
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
        password,
        trimmedName,
        role,
        trimmedPhone || undefined,
        trimmedEmail,
        "email",
        partnerMeta
      );

      if (error) {
        if (error.message?.includes("User already registered") || error.message?.includes("already exists")) {
          setErrorMessage("Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.");
        } else if (error.message?.includes("Password should be at least")) {
          setErrorMessage("Le mot de passe doit comporter au moins 8 caractères.");
        } else {
          setErrorMessage(error.message || "Erreur lors de la création du compte.");
        }
      } else {
        toast.success("Compte créé avec succès !");
        // Si Supabase envoie un email de vérification, guider l'utilisateur
        navigate(`/verifier-email?email=${encodeURIComponent(trimmedEmail)}&redirect=${encodeURIComponent(targetUrl)}`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Une erreur réseau est survenue. Veuillez vérifier votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-3 sm:p-6">
      <div className="w-full max-w-xl my-6">
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
            to={`/connexion${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
            className="text-xs font-bold text-primary hover:underline"
          >
            Déjà inscrit ? Se connecter
          </Link>
        </div>

        <Card className="border-border/60 shadow-warm">
          <CardHeader className="text-center space-y-3 pt-6 pb-4">
            <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-3xl overflow-hidden bg-white shadow-md border-2 border-emerald-500/20 p-2 flex items-center justify-center">
              <img src={logo} alt="NAFA AGRITECH" className="h-full w-full object-contain rounded-2xl" />
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight">
                Créer un compte <span className="text-gradient-warm">NAFA AGRITECH</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                Plateforme agro-pastorale intégrée et ingénierie rurale
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-4 sm:px-6 pb-6">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom complet */}
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
                    className="pl-9 h-11 rounded-xl text-sm"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email & Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-foreground">
                    Adresse e-mail *
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
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-foreground">
                    Téléphone (optionnel)
                  </Label>
                  <div className="relative">
                    <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+226 70 00 00 00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      className="pl-9 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Sélection du Profil Agricole */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-bold text-foreground">
                  Votre activité principale *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          "flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-xs font-bold text-primary"
                            : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold block truncate">{p.label}</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">{p.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spécification Partenaire si applicable */}
              {role === "partenaire" && (
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="text-xs font-bold">
                      Nom de l'entreprise ou structure *
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="Ex: Société Sahélienne d'Agro-Distribution"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required={role === "partenaire"}
                      disabled={loading}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="partnerType" className="text-xs font-bold">
                      Spécialisation métier du partenaire
                    </Label>
                    <select
                      id="partnerType"
                      value={partnerType}
                      onChange={(e) => setPartnerType(e.target.value as PartnerProfileType)}
                      disabled={loading}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {PARTNER_PROFILE_LIST.filter(p => p.id !== "polyvalent").map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Mots de passe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold text-foreground">
                    Mot de passe *
                  </Label>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-foreground">
                    Confirmer le mot de passe *
                  </Label>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Répétez le mot de passe"
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
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Vos données sont protégées par chiffrement et sécurisées sur l'infrastructure NAFA AGRITECH.</span>
              </div>

              {/* Bouton de soumission */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 gradient-primary text-primary-foreground font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Création du compte en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-3 border-t border-border/60">
              <p className="text-xs text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Link
                  to={`/connexion${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
                  className="font-bold text-primary hover:underline"
                >
                  Connectez-vous ici
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
