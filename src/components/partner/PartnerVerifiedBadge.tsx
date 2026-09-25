import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldCheck, Building2, UserCheck, Award } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PartnerKycDossier } from "@/lib/partnerKyc";

interface PartnerVerifiedBadgeProps {
  isVerified?: boolean;
  kyc?: PartnerKycDossier | null;
  partnerName?: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "badge" | "pill" | "banner";
  showPopover?: boolean;
  className?: string;
}

export const PartnerVerifiedBadge: React.FC<PartnerVerifiedBadgeProps> = ({
  isVerified = true,
  kyc,
  partnerName,
  size = "sm",
  variant = "badge",
  showPopover = true,
  className = "",
}) => {
  if (!isVerified) {
    return (
      <Badge
        variant="outline"
        className={`text-stone-500 bg-stone-100 dark:bg-stone-900 border-stone-300 dark:border-stone-800 text-[10px] font-normal ${className}`}
      >
        Non certifié
      </Badge>
    );
  }

  const isMorale = kyc?.type === "personne_morale";
  const certId = kyc?.certificationId || "NAFA-CERT-2026-BF";
  const verifiedDate = kyc?.verifiedAt
    ? new Date(kyc.verifiedAt).toLocaleDateString("fr-FR")
    : new Date().toLocaleDateString("fr-FR");

  const badgeContent = (
    <div
      className={`inline-flex items-center gap-1.5 cursor-pointer select-none transition-transform hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      {variant === "pill" ? (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold ${
            size === "xs"
              ? "text-[9px] px-1.5 py-0.5"
              : size === "sm"
              ? "text-[11px]"
              : size === "md"
              ? "text-xs px-3 py-1"
              : "text-sm px-3.5 py-1.5"
          }`}
        >
          <ShieldCheck className={size === "xs" ? "h-2.5 w-2.5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span>Partenaire Certifié</span>
        </span>
      ) : variant === "banner" ? (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
          <Award className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="text-left text-xs leading-tight">
            <p className="font-bold flex items-center gap-1">
              Compte Certifié NAFA - AGRITECH
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline" />
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {isMorale ? "Personne Morale vérifiée (RCCM / IFU)" : "Personne Physique vérifiée (CNIB / Identité)"} · {certId}
            </p>
          </div>
        </div>
      ) : (
        <Badge
          className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-xs border-0 ${
            size === "xs"
              ? "text-[9px] px-1.5 py-0"
              : size === "sm"
              ? "text-[10px] px-2 py-0.5"
              : size === "md"
              ? "text-xs px-2.5 py-1"
              : "text-sm px-3 py-1.5"
          }`}
        >
          <CheckCircle2 className={size === "xs" ? "h-2.5 w-2.5" : size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
          <span>{size === "xs" ? "Certifié" : "Partenaire Certifié"}</span>
        </Badge>
      )}
    </div>
  );

  if (!showPopover) {
    return badgeContent;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{badgeContent}</PopoverTrigger>
      <PopoverContent className="w-80 p-4 text-xs space-y-3 z-50 shadow-xl border-emerald-500/20" align="start">
        <div className="flex items-start gap-2.5 pb-2.5 border-b border-border">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 shrink-0">
            {isMorale ? <Building2 className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm flex items-center gap-1">
              {partnerName || (isMorale ? kyc?.moraleData?.companyName : `${kyc?.physiqueData?.firstName} ${kyc?.physiqueData?.lastName}`) || "Partenaire Officiel"}
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </h4>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold inline-block mt-0.5">
              {isMorale ? "Personne Morale Agréée" : "Professionnel Indépendant Certifié"}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Matricule NAFA :</span>
            <span className="font-mono font-bold text-foreground">{certId}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Date de certification :</span>
            <span className="font-medium text-foreground">{verifiedDate}</span>
          </div>

          {isMorale ? (
            <>
              {kyc?.moraleData?.rccmNumber && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Registre Commerce (RCCM) :</span>
                  <span className="font-mono text-foreground font-medium">{kyc.moraleData.rccmNumber}</span>
                </div>
              )}
              {kyc?.moraleData?.ifuNumber && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Numéro IFU :</span>
                  <span className="font-mono text-foreground font-medium">{kyc.moraleData.ifuNumber}</span>
                </div>
              )}
              {kyc?.moraleData?.managerFullName && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Représentant légal :</span>
                  <span className="text-foreground font-medium">{kyc.moraleData.managerFullName}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {kyc?.physiqueData?.docType && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Pièce d'identité ({kyc.physiqueData.docType.toUpperCase()}) :</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Vérifiée & Conforme</span>
                </div>
              )}
              {kyc?.physiqueData?.profession && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Activité :</span>
                  <span className="text-foreground font-medium">{kyc.physiqueData.profession}</span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Séquestre NAFA :</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Garantie active (30%/70%)</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/80 text-[10px] text-muted-foreground leading-relaxed">
          Ce partenaire a soumis l'intégralité de ses pièces justificatives et respecte la charte de qualité et de transparence NAFA - AGRITECH.
        </div>
      </PopoverContent>
    </Popover>
  );
};
export default PartnerVerifiedBadge;
