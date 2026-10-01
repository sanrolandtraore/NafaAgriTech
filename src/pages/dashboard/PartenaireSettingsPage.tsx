import { useState } from "react";
import SettingsPage from "@/components/SettingsPage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, BadgeCheck, Clock, Wallet, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { getStoredProviderSubscription, SUBSCRIPTION_PLANS, isSubscriptionActive, getSubscriptionDaysRemaining } from "@/lib/providerSubscription";
import { getStoredPartnerKyc } from "@/lib/partnerKyc";
import { PartnerVerifiedBadge } from "@/components/partner/PartnerVerifiedBadge";
import { useAuth } from "@/contexts/AuthContext";
import { burkinaPaymentAggregator, PartnerPayoutSettings } from "@/lib/burkinaPaymentAggregator";
import { toast } from "sonner";

const PartenaireSettingsTab = () => {
  const { user } = useAuth();
  const sub = getStoredProviderSubscription(user?.id);
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === sub.tier) || SUBSCRIPTION_PLANS[2];
  const partnerId = user?.id || "current";
  const kyc = getStoredPartnerKyc(partnerId);
  const isActiveSub = isSubscriptionActive(sub);
  const daysLeft = getSubscriptionDaysRemaining(sub);

  const [payout, setPayout] = useState<PartnerPayoutSettings>(() =>
    burkinaPaymentAggregator.getPartnerPayoutSettings(partnerId)
  );
  const [savingPayout, setSavingPayout] = useState(false);

  const handleSavePayout = () => {
    setSavingPayout(true);
    try {
      burkinaPaymentAggregator.savePartnerPayoutSettings({
        ...payout,
        partnerId,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Coordonnées de versement enregistrées avec succès !");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSavingPayout(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Carte Statut KYC & Certification */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Vérification d'Identité & Certification KYC
            </CardTitle>
            <PartnerVerifiedBadge
              isVerified={kyc.status === "verifie"}
              kyc={kyc}
              partnerName={sub.companyName}
              size="sm"
              variant="pill"
            />
          </div>
          <CardDescription>
            {kyc.type === "personne_morale" ? "Personne Morale (Entreprise, Coopérative, Établissement)" : "Personne Physique (Indépendant, Conseiller, Artisan)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {kyc.status === "verifie" ? (
            <p className="text-muted-foreground">
              Votre compte est officiellement <strong>Certifié NAFA - AGRITECH</strong> avec le matricule <span className="font-mono font-bold text-foreground">{kyc.certificationId}</span>. Vos coordonnées, documents légaux ({kyc.type === "personne_morale" ? `RCCM ${kyc.moraleData.rccmNumber}` : `CNIB ${kyc.physiqueData.docNumber}`}) sont validés.
            </p>
          ) : kyc.status === "en_attente" ? (
            <p className="text-muted-foreground">
              Votre dossier de vérification est <strong>en cours d'examen</strong> par l'équipe de conformité NAFA - AGRITECH. Vous recevrez le badge certifié dès validation.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Faites certifier votre compte pour débloquer le badge officiel de confiance, sécuriser les commandes des agriculteurs et figurer en tête de l'annuaire des partenaires.
            </p>
          )}
          <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-xl border-border">
            <Link to="/dashboard/partenaire-kyc">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
              Gérer mon dossier KYC & Certification <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Carte Abonnement Prestataire & Partenaire */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Abonnement Prestataire & Partenaire
            </CardTitle>
            {isActiveSub ? (
              <Badge className="bg-emerald-600 text-white font-semibold">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Actif {daysLeft > 0 ? `(${daysLeft}j)` : ""}
              </Badge>
            ) : (
              <Badge variant="destructive" className="font-semibold">
                <Clock className="h-3 w-3 mr-1" /> Expiré / Inactif
              </Badge>
            )}
          </div>
          <CardDescription>
            Formule actuelle : <strong>{plan.title}</strong> ({sub.companyName})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Valide jusqu'au <strong>{new Date(sub.endDate).toLocaleDateString("fr-FR")}</strong>. Votre abonnement est obligatoire pour que vos produits et services soient visibles par les acheteurs sur le Marketplace national.
          </p>
          <Button asChild size="sm" className={isActiveSub ? "gradient-primary text-primary-foreground font-semibold" : "bg-amber-600 hover:bg-amber-700 text-white font-semibold"}>
            <Link to="/dashboard/partenaire-abonnement">
              {isActiveSub ? "Modifier ou renouveler mon abonnement" : "Activer mon abonnement maintenant"} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Carte Coordonnées de Versement des Ventes / Prestations (Mobile Money & Banque) */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> Coordonnées de Versement (Ventes & Prestations)
            </CardTitle>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Paiements Sécurisés NAFA
            </Badge>
          </div>
          <CardDescription>
            Configurez le compte Mobile Money ou bancaire où NAFA-AGRITECH débloquera les fonds de vos commandes et missions sous séquestre garanti.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Mode de réception préféré</Label>
            <RadioGroup
              value={payout.accountType}
              onValueChange={(val: any) => setPayout((prev) => ({ ...prev, accountType: val }))}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-2.5 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="orange_money" id="pay_om" />
                <Label htmlFor="pay_om" className="text-xs cursor-pointer font-medium">Orange Money BF</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-2.5 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="moov_money" id="pay_moov" />
                <Label htmlFor="pay_moov" className="text-xs cursor-pointer font-medium">Moov Money BF</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-2.5 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="wave" id="pay_wave" />
                <Label htmlFor="pay_wave" className="text-xs cursor-pointer font-medium">Wave Burkina</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-2.5 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="virement_bancaire" id="pay_vir" />
                <Label htmlFor="pay_vir" className="text-xs cursor-pointer font-medium">Compte Bancaire (RIB)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nom du titulaire / Raison Sociale</Label>
              <Input
                placeholder="Ex: Société Agricole Faso SARL"
                value={payout.accountName}
                onChange={(e) => setPayout((prev) => ({ ...prev, accountName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Numéro Mobile Money de réception</Label>
              <Input
                placeholder="+226 70 XX XX XX"
                value={payout.phoneNumber}
                onChange={(e) => setPayout((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>
          </div>

          {payout.accountType === "virement_bancaire" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Banque burkinabè</Label>
                <Input
                  placeholder="Ex: Coris Bank International, Ecobank BF, BOA"
                  value={payout.bankName || ""}
                  onChange={(e) => setPayout((prev) => ({ ...prev, bankName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Numéro de RIB (23 caractères)</Label>
                <Input
                  placeholder="BF023 01001 02145879001 45"
                  value={payout.ribNumber || ""}
                  onChange={(e) => setPayout((prev) => ({ ...prev, ribNumber: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSavePayout}
              disabled={savingPayout}
              className="gradient-primary text-primary-foreground font-bold text-xs gap-1.5 rounded-xl shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              {savingPayout ? "Enregistrement..." : "Enregistrer les coordonnées de versement"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PartenaireSettingsPage = () => (
  <SettingsPage
    roleLabel="Entreprise Prestataire"
    roleSpecificTab={<PartenaireSettingsTab />}
    roleSpecificTabLabel="Abonnement & Entreprise"
  />
);

export default PartenaireSettingsPage;
