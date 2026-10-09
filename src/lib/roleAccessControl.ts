/**
 * NAFA-AGRITECH — Contrôle d'Accès & Habilitations Métier des Outils de Diagnostic
 * 
 * RÈGLE D'ACCÈS ET D'AIDE À LA DÉCISION :
 * - Le diagnostic phytosanitaire et l'identification visuelle IA sont AUTORISÉS
 *   à l'ensemble des acteurs (agriculteurs, éleveurs, techniciens, experts et partenaires)
 *   comme outil d'aide à la décision et d'auto-évaluation de terrain.
 * - L'émission et la signature d'ordonnances et de prescriptions phytosanitaires
 *   officielles avec engagement juridique restent réservées aux ingénieurs et cabinets agréés.
 */

export interface RoleDiagnosticAccess {
  allowed: boolean;
  tier: "official_prescription" | "advisory_field_diagnosis";
  reason?: string;
  recommendedRoute?: string;
  canSignPrescription: boolean;
}

/**
 * Détermine si le profil actuel est autorisé à utiliser les outils de diagnostic IA.
 * Autorise les agriculteurs, éleveurs, experts, techniciens et partenaires.
 */
export function canAccessDiagnosticTools(
  role: string | null | undefined,
  _partnerType?: string | null | undefined
): boolean {
  // L'outil de diagnostic IA est un outil universel d'aide à la décision agronomique de terrain
  // Toute personne accédant à l'outil peut l'utiliser pour analyser ses cultures ou son cheptel.
  if (!role) return true; // Permettre également l'essai découverte

  const normalizedRole = role.trim().toLowerCase();
  
  // Tous les rôles de terrain ont accès au diagnostic IA
  if (
    normalizedRole === "agriculteur" ||
    normalizedRole === "farmer" ||
    normalizedRole === "eleveur" ||
    normalizedRole === "agent_technique" ||
    normalizedRole === "expert" ||
    normalizedRole === "admin" ||
    normalizedRole === "manager" ||
    normalizedRole === "partenaire" ||
    normalizedRole === "formation" ||
    normalizedRole === "viewer"
  ) {
    return true;
  }

  return true;
}

/**
 * Détermine si le profil est habilité à émettre et signer des ordonnances phytosanitaires officielles.
 */
export function canSignOfficialPrescriptions(
  role: string | null | undefined,
  partnerType?: string | null | undefined
): boolean {
  if (!role) return false;
  const normalizedRole = role.trim().toLowerCase();

  if (
    normalizedRole === "expert" ||
    normalizedRole === "agent_technique" ||
    normalizedRole === "admin" ||
    normalizedRole === "manager"
  ) {
    return true;
  }

  if (normalizedRole === "partenaire") {
    const pt = (partnerType || "").trim().toLowerCase();
    return pt === "expert_agronome" || pt === "elevage_veterinaire" || pt === "polyvalent";
  }

  return false;
}

/**
 * Fournit une explication métier contextualisée sur le niveau d'habilitation.
 */
export function getDiagnosticAccessInfo(
  role: string | null | undefined,
  partnerType?: string | null | undefined
): RoleDiagnosticAccess {
  const allowed = canAccessDiagnosticTools(role, partnerType);
  const canSign = canSignOfficialPrescriptions(role, partnerType);
  const normalizedRole = (role || "").trim().toLowerCase();

  if (canSign) {
    return {
      allowed: true,
      tier: "official_prescription",
      canSignPrescription: true,
      reason: "Habilitation d'expert certifié : émission et signature d'ordonnances agronomiques officielles.",
      recommendedRoute: "/dashboard/expert-prescriptions",
    };
  }

  const isFarmer = normalizedRole === "agriculteur" || normalizedRole === "farmer";
  const isBreeder = normalizedRole === "eleveur";

  return {
    allowed,
    tier: "advisory_field_diagnosis",
    canSignPrescription: false,
    reason: isFarmer
      ? "Mode Aide à la décision de terrain : fiches techniques et recommandations agro-écologiques INERA / CSP-CILSS. Pour une ordonnance officielle certifiée, vous pouvez solliciter un cabinet d'agronomie partenaire."
      : isBreeder
      ? "Mode Conseil & Suivi d'élevage : recommandations zootechniques. Pour une prescription vétérinaire officielle, contactez un docteur vétérinaire partenaire."
      : "Mode Découverte : fiches techniques et référentiels scientifiques.",
    recommendedRoute: "/dashboard/crop-library",
  };
}
