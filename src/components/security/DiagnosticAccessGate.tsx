import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDiagnosticAccessInfo } from "@/lib/roleAccessControl";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  Stethoscope,
  Microscope,
  FileCheck2,
  Users,
  LayoutDashboard,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DiagnosticAccessGateProps {
  children: React.ReactNode;
}

export const DiagnosticAccessGate: React.FC<DiagnosticAccessGateProps> = ({ children }) => {
  const { primaryRole, partnerType } = useAuth();
  const navigate = useNavigate();
  const accessInfo = getDiagnosticAccessInfo(primaryRole, partnerType);

  if (accessInfo.allowed) {
    return <>{children}</>;
  }

  const isFarmer = primaryRole === "agriculteur" || primaryRole === "farmer";
  const isBreeder = primaryRole === "eleveur";

  return (
    <div className="max-w-4xl mx-auto my-6 p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header Card */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-card shadow-md overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-600 to-primary" />

        <CardHeader className="pt-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <Badge
                  variant="outline"
                  className="mb-1.5 text-xs font-semibold border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                >
                  Fonctionnalité Réservée aux Partenaires Agréés
                </Badge>
                <CardTitle className="text-xl sm:text-2xl font-bold font-heading text-foreground">
                  Accès Restreint : Outils de Diagnostic Officiel
                </CardTitle>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border/60 self-start sm:self-auto">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
              Normes INERA • CIRAD • Vétérinaires
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2 pb-8">
          {/* Motivation Déontologique & Règlementaire */}
          <div className="rounded-xl border border-border/80 bg-background/80 p-4.5 space-y-3 text-sm text-foreground/90 leading-relaxed shadow-2xs">
            <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-emerald-600" />
              Règle de Déontologie et Cloisonnement Métier
            </div>
            <p>{accessInfo.reason}</p>
            <p className="text-xs text-muted-foreground">
              Les agriculteurs et éleveurs n'ont pas accès direct à la manipulation des bancs de diagnostic et de prescription. Seuls les professionnels agréés et diplômés peuvent poser un acte technique officiel engageant la santé des cultures ou des troupeaux.
            </p>
          </div>

          {/* Comment Bénéficier d'un Diagnostic Professionnel */}
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5 space-y-3">
            <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {isFarmer
                ? "Comment faire diagnostiquer vos parcelles et cultures ?"
                : isBreeder
                ? "Comment faire soigner et diagnostiquer votre troupeau ?"
                : "Comment solliciter un diagnostic d'expert ?"}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isFarmer
                ? "Vous pouvez commander un passage d'un cabinet d'agronomie partenaire sur votre exploitation. L'expert effectuera le scan haute résolution, les mesures de sol et vous délivrera une ordonnance phytosanitaire officielle certifiée."
                : isBreeder
                ? "Vous pouvez demander l'intervention d'une clinique vétérinaire partenaire pour une consultation de cheptel, une campagne de vaccination ou un protocole de soins personnalisé."
                : "Consultez le catalogue des prestations pour réserver l'intervention d'un partenaire agréé."}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                onClick={() => navigate(accessInfo.recommendedRoute || "/dashboard/marketplace")}
                className="gradient-primary text-white font-semibold text-xs h-10 px-5 rounded-xl shadow-xs flex items-center gap-2"
              >
                {isFarmer ? (
                  <>
                    <Microscope className="h-4 w-4" />
                    Solliciter un cabinet d'agronomie agréé
                  </>
                ) : (
                  <>
                    <Stethoscope className="h-4 w-4" />
                    Contacter un vétérinaire partenaire
                  </>
                )}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/dashboard/partners-directory")}
                className="text-xs h-10 px-4 rounded-xl border-border"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Voir l'annuaire des experts
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="text-xs h-10 px-4 text-muted-foreground hover:text-foreground"
              >
                <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
