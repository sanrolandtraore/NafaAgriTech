import SettingsPage from "@/components/SettingsPage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { getStoredProviderSubscription, SUBSCRIPTION_PLANS, isSubscriptionActive, getSubscriptionDaysRemaining } from "@/lib/providerSubscription";
import { Clock } from "lucide-react";
import { getStoredPartnerKyc } from "@/lib/partnerKyc";
import { PartnerVerifiedBadge } from "@/components/partner/PartnerVerifiedBadge";

const PartenaireSettingsTab = () => {
  const sub = getStoredProviderSubscription();
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === sub.tier) || SUBSCRIPTION_PLANS[2];
  const kyc = getStoredPartnerKyc();
  const isActiveSub = isSubscriptionActive(sub);
  const daysLeft = getSubscriptionDaysRemaining(sub);

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
                <Clock className="h-3 w-3 mr-1" /> Expiré
              </Badge>
            )}
          </div>
          <CardDescription>
            Formule actuelle : <strong>{plan.title}</strong> ({sub.companyName})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Valide jusqu'au <strong>{new Date(sub.endDate).toLocaleDateString("fr-FR")}</strong>. Votre compte donne accès à l'ensemble des outils d'aide à la décision NAFA - AGRITECH : Diagnostic avancé, Ordonnances signées, Scouting terrain, Flotte de location et Offres de vente.
          </p>
          <Button asChild size="sm" className={isActiveSub ? "gradient-primary text-primary-foreground font-semibold" : "bg-amber-600 hover:bg-amber-700 text-white font-semibold"}>
            <Link to="/dashboard/partenaire-abonnement">
              {isActiveSub ? "Modifier ou renouveler mon abonnement" : "Réactiver mon abonnement maintenant"} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
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
