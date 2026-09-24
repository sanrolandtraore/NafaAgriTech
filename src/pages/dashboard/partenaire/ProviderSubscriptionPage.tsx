import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  ShieldCheck, Check, Sparkles, Tractor, Store, Wrench, Microscope, FileText,
  Eye, Calculator, MapPin, Users, ArrowRight, Zap, Phone, CheckCircle2, Clock
} from "lucide-react";
import { toast } from "sonner";
import BackNavigationButton from "@/components/BackNavigationButton";
import { supabase } from "@/integrations/supabase/client";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
  SubscriptionTier,
  ProviderActivityType,
  getStoredProviderSubscription,
  saveProviderSubscription,
  ProviderSubscription,
  isSubscriptionActive,
  getSubscriptionDaysRemaining,
} from "@/lib/providerSubscription";
import { useAuth } from "@/contexts/AuthContext";

export default function ProviderSubscriptionPage() {
  const { user, profile } = useAuth();
  const [sub, setSub] = useState<ProviderSubscription>(() => getStoredProviderSubscription(user?.id));
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);

  // Form fields for subscription modal
  const initialCompany = (sub.companyName && !sub.companyName.includes("Mon Entreprise")) 
    ? sub.companyName 
    : (user?.user_metadata?.company_name as string) || profile?.full_name || "";
  const initialPhone = (sub.phone && sub.phone !== "+226 70 00 00 00" && sub.phone !== "+226 ")
    ? sub.phone
    : profile?.phone || user?.phone || "+226 ";

  const [companyName, setCompanyName] = useState(initialCompany);
  const [activityType, setActivityType] = useState<ProviderActivityType>(sub.activityType || "services_agronomiques");
  const [phone, setPhone] = useState(initialPhone);
  const [paymentMethod, setPaymentMethod] = useState<"orange_money" | "moov_money" | "wave" | "virement">("orange_money");
  const [transactionRef, setTransactionRef] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // If metadata has subscription data, synchronize
    const metaSub = user?.user_metadata?.provider_subscription as ProviderSubscription | undefined;
    if (metaSub && metaSub.tier) {
      saveProviderSubscription(metaSub, user?.id);
      setSub(metaSub);
    } else {
      setSub(getStoredProviderSubscription(user?.id));
    }

    const handler = (e: any) => {
      const updated = e?.detail || getStoredProviderSubscription(user?.id);
      setSub(updated);
    };
    window.addEventListener("nafa-subscription-updated", handler);
    return () => window.removeEventListener("nafa-subscription-updated", handler);
  }, [user]);

  const openSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    const existingName = (sub.companyName && !sub.companyName.includes("Mon Entreprise")) ? sub.companyName : "";
    setCompanyName(existingName || (user?.user_metadata?.company_name as string) || profile?.full_name || "");
    const existingPhone = (sub.phone && sub.phone !== "+226 70 00 00 00" && sub.phone !== "+226 ") ? sub.phone : "";
    setPhone(existingPhone || profile?.phone || user?.phone || "+226 ");
    setTransactionRef("");
    setSubscribeModalOpen(true);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;
    if (!companyName.trim()) {
      toast.error("Veuillez renseigner le nom de votre entreprise");
      return;
    }
    if (!phone.trim() || phone.trim() === "+226") {
      toast.error("Veuillez renseigner un numéro de téléphone de contact");
      return;
    }

    setProcessing(true);
    try {
      const now = new Date();
      const isCurrentlyActive = isSubscriptionActive(sub);
      const currentEnd = sub.endDate ? new Date(sub.endDate) : now;
      const baseDate = (isCurrentlyActive && sub.tier === selectedPlan.id && currentEnd > now) ? currentEnd : now;
      const durationDays = selectedPlan.id === "free" ? 3650 : (billingCycle === "annual" ? 365 : 30);
      const endDate = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const updated: ProviderSubscription = {
        tier: selectedPlan.id,
        activityType,
        companyName,
        phone,
        email: profile?.email || user?.email || sub.email,
        location: sub.location || "Burkina Faso",
        serviceArea: sub.location || "Burkina Faso",
        contactPhone: phone,
        contactEmail: profile?.email || user?.email || sub.email,
        startDate: now.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        isActive: true,
        paymentMethod: selectedPlan.id === "free" ? "especes" : paymentMethod,
        paymentReference: selectedPlan.id === "free" ? "FREE-TRIAL" : (transactionRef || `PAY-${Math.floor(100000 + Math.random() * 900000)}`),
        toolsUnlocked: [
          "diagnostic_ia",
          "ordonnances_pdf",
          "scouting_gps",
          "location_materiel",
          "calculatrice_agro",
          "cartographie_gps",
          "carnet_clients",
          "marketplace_offres",
        ],
      };

      saveProviderSubscription(updated, user?.id);
      setSub(updated);

      if (user?.id) {
        await supabase.auth.updateUser({
          data: {
            provider_subscription: updated,
            company_name: companyName,
          }
        }).catch(err => console.warn("Supabase auth updateUser metadata sync bypassed:", err));
      }

      setProcessing(false);
      setSubscribeModalOpen(false);
      toast.success(`Abonnement ${selectedPlan.title} activé avec succès ! Tous les outils NAFA - AGRITECH sont débloqués.`);
    } catch (err: any) {
      setProcessing(false);
      toast.error(err.message || "Erreur lors de l'activation");
    }
  };

  const activePlanInfo = SUBSCRIPTION_PLANS.find(p => p.id === sub.tier) || SUBSCRIPTION_PLANS[2];
  const isActiveSub = isSubscriptionActive(sub);
  const daysLeft = getSubscriptionDaysRemaining(sub);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <BackNavigationButton fallbackTo="/dashboard" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Entreprises Prestataires & Partenaires
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Abonnements & Outils Professionnels NAFA - AGRITECH
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base max-w-2xl">
            Abonnez votre entreprise de <strong>Services agronomiques</strong>, <strong>Vente d'intrants</strong> ou <strong>Location de matériel</strong> pour débloquer l'ensemble des outils technologiques d'aide à la décision.
          </p>
        </div>

        {/* Current status pill */}
        <div className="bg-card border rounded-2xl p-4 shadow-sm min-w-[260px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Statut actuel</span>
            {isActiveSub ? (
              <Badge className="bg-emerald-600 text-white font-semibold">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Actif {daysLeft > 0 ? `(${daysLeft}j)` : ""}
              </Badge>
            ) : (
              <Badge variant="destructive" className="font-semibold">
                <Clock className="h-3 w-3 mr-1" /> Expiré
              </Badge>
            )}
          </div>
          <p className="text-base font-bold text-foreground mt-1">{activePlanInfo.title}</p>
          <p className="text-xs text-muted-foreground">
            {sub.companyName || "Mon Entreprise Partenaire"} • {isActiveSub ? `Jusqu'au ${new Date(sub.endDate).toLocaleDateString("fr-FR")}` : "Renouvellement requis"}
          </p>
        </div>
      </div>

      {/* Unlocked tools preview row for subscribed provider */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">Vos outils NAFA - AGRITECH débloqués pour votre activité</h3>
          </div>
          <span className="text-xs font-medium text-primary">Prêts à l'emploi sur le terrain</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/dashboard/expert-diagnosis"
            className="p-3 bg-background rounded-xl border border-border hover:border-primary transition-all flex items-center gap-2 text-xs font-semibold shadow-xs"
          >
            <Microscope className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">Diagnostic IA Végétal</span>
          </Link>
          <Link
            to="/dashboard/expert-prescriptions"
            className="p-3 bg-background rounded-xl border border-border hover:border-primary transition-all flex items-center gap-2 text-xs font-semibold shadow-xs"
          >
            <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="truncate">Ordonnances PDF Signées</span>
          </Link>
          <Link
            to="/dashboard/scouting"
            className="p-3 bg-background rounded-xl border border-border hover:border-primary transition-all flex items-center gap-2 text-xs font-semibold shadow-xs"
          >
            <Eye className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="truncate">Scouting Terrain GPS</span>
          </Link>
          <Link
            to="/dashboard/equipment"
            className="p-3 bg-background rounded-xl border border-border hover:border-primary transition-all flex items-center gap-2 text-xs font-semibold shadow-xs"
          >
            <Tractor className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="truncate">Location & Flotte Matériel</span>
          </Link>
          <Link
            to="/dashboard/expert-calculator"
            className="p-3 bg-background rounded-xl border border-border hover:border-primary transition-all flex items-center gap-2 text-xs font-semibold shadow-xs"
          >
            <Calculator className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="truncate">Calculatrice Doses & Semis</span>
          </Link>
          <Link
            to="/dashboard/expert-cartography"
            className="p-3 bg-background rounded-xl border border-border hover:border-primary transition-all flex items-center gap-2 text-xs font-semibold shadow-xs"
          >
            <MapPin className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="truncate">Cartographie Polygone GPS</span>
          </Link>
          <Link
            to="/dashboard/partenaire-mes-offres"
            className="p-3 bg-background rounded-xl border border-border hover:border-primary transition-all flex items-center gap-2 text-xs font-semibold shadow-xs"
          >
            <Store className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="truncate">Vente Intrants & Offres</span>
          </Link>
          <Link
            to="/dashboard/expert-clients"
            className="p-3 bg-background rounded-xl border border-border hover:border-primary transition-all flex items-center gap-2 text-xs font-semibold shadow-xs"
          >
            <Users className="h-4 w-4 text-teal-600 shrink-0" />
            <span className="truncate">Carnet Clients & Tournées</span>
          </Link>
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex flex-col items-center justify-center gap-3 pt-2">
        <div className="bg-muted p-1 rounded-xl inline-flex items-center gap-1 border">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              billingCycle === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Facturation Mensuelle
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              billingCycle === "annual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Facturation Annuelle
            <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-bold">
              -17% (2 mois offerts)
            </span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = sub.tier === plan.id;
          const price = billingCycle === "annual" ? plan.annualPriceFCFA : plan.monthlyPriceFCFA;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl transition-all duration-200 ${
                plan.popular
                  ? "border-2 border-primary shadow-lg scale-[1.02] bg-card"
                  : "border border-border hover:border-primary/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider py-0.5 px-3 rounded-full shadow-sm">
                  Le plus adapté aux prestataires
                </div>
              )}

              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {plan.targetBadge}
                    </Badge>
                    {isCurrent && (
                      <Badge className={isActiveSub ? "bg-emerald-600 text-white text-[10px]" : "bg-amber-600 text-white text-[10px]"}>
                        {isActiveSub ? "Actuel" : "Expiré"}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg font-heading">{plan.title}</CardTitle>
                  <CardDescription className="text-xs min-h-[32px]">{plan.tagline}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="border-y py-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono">
                        {price.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-xs text-muted-foreground">FCFA</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        /{billingCycle === "annual" ? "an" : "mois"}
                      </span>
                    </div>
                    {billingCycle === "annual" && plan.monthlyPriceFCFA > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Équivaut à {(plan.annualPriceFCFA / 12).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA/mois
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Inclus dans l'abonnement :</p>
                    <ul className="space-y-2">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.toolsIncluded.length > 0 && (
                    <div className="pt-2 border-t space-y-1.5">
                      <p className="text-[11px] font-semibold text-foreground">Outils métier intégrés :</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.toolsIncluded.map((tool, idx) => (
                          <span key={idx} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                            {tool.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>

              <CardFooter className="pt-2">
                <Button
                  onClick={() => openSubscribe(plan)}
                  variant={isCurrent && isActiveSub ? "outline" : plan.popular ? "default" : "secondary"}
                  className={`w-full font-semibold ${
                    plan.popular && (!isCurrent || !isActiveSub) ? "gradient-primary text-primary-foreground shadow-warm" : ""
                  }`}
                >
                  {isCurrent ? (isActiveSub ? "Renouveler / Prolonger" : "Réactiver cet abonnement") : "Souscrire cet abonnement"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Subscription Dialog Modal */}
      <Dialog open={subscribeModalOpen} onOpenChange={setSubscribeModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Souscription : {selectedPlan?.title}
            </DialogTitle>
            <DialogDescription>
              Enregistrez votre entreprise prestataire et confirmez l'activation de votre accès professionnel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Nom de l'entreprise / Structure *</Label>
              <Input
                placeholder="Ex: AgriServices Faso SARL, Coopérative Maraîchère..."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Domaine d'activité principal *</Label>
              <Select value={activityType} onValueChange={(v: any) => setActivityType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="services_agronomiques">Services agronomiques & Traitements phyto</SelectItem>
                  <SelectItem value="location_materiel">Location de matériel & Mécanisation (tracteurs, drones)</SelectItem>
                  <SelectItem value="vente_intrants">Vente d'intrants, semences & fertilisants</SelectItem>
                  <SelectItem value="polyvalent">Multi-activités (Services, Vente & Location)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Téléphone WhatsApp / Contact *</Label>
                <Input
                  placeholder="+226 70 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Périodicité</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md text-xs font-semibold flex items-center">
                  {selectedPlan?.id === "free" ? "Illimité (Découverte)" : (billingCycle === "annual" ? "Annuel (365 jours)" : "Mensuel (30 jours)")}
                </div>
              </div>
            </div>

            {selectedPlan?.id === "free" ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>L'accès <strong>Découverte</strong> est 100% gratuit et s'active immédiatement sans aucun paiement.</span>
              </div>
            ) : (
              <>
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs font-semibold">Mode de paiement professionnel</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v: any) => setPaymentMethod(v)}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-2.5 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="orange_money" id="om" />
                      <Label htmlFor="om" className="text-xs cursor-pointer font-medium">Orange Money BF (*144#)</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-2.5 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="moov_money" id="moov" />
                      <Label htmlFor="moov" className="text-xs cursor-pointer font-medium">Moov Money (*555#)</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-2.5 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="wave" id="wave" />
                      <Label htmlFor="wave" className="text-xs cursor-pointer font-medium">Wave Burkina</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-2.5 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="virement" id="vir" />
                      <Label htmlFor="vir" className="text-xs cursor-pointer font-medium">Virement bancaire / Facture</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Référence ou Numéro de transaction (optionnel)</Label>
                  <Input
                    placeholder="Ex: OM-39281920 ou Référence chèque/virement"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Montant à régler : <strong className="text-foreground">
                      {(billingCycle === "annual" ? selectedPlan?.annualPriceFCFA : selectedPlan?.monthlyPriceFCFA)?.toLocaleString("fr-FR")} FCFA
                    </strong>
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubscribeModalOpen(false)}>Annuler</Button>
            <Button
              onClick={handleConfirmSubscription}
              disabled={processing}
              className="gradient-primary text-primary-foreground"
            >
              {processing ? "Activation en cours..." : "Confirmer et activer l'accès"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
