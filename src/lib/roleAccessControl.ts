/**
 * NAFA-AGRITECH — Contrôle d'Accès & Cloisonnement Métier des Outils de Diagnostic
 * 
 * RÈGLE FONDAMENTALE DE SÉCURITÉ ET DE DÉONTOLOGIE :
 * Les agriculteurs et éleveurs ne doivent en aucun cas avoir accès direct aux outils
 * d'établissement de diagnostic et de prescription.
 * Cette fonctionnalité est STRICTEMENT RÉSERVÉE aux partenaires prestataires de service
 * accrédités en agronomie et santé animale (Cabinets d'agronomie, Cliniques vétérinaires).
 */

export interface RoleDiagnosticAccess {
  allowed: boolean;
  reason?: string;
  recommendedRoute?: string;
}

/**
 * Détermine si le profil actuel est autorisé à utiliser les bancs de diagnostic et de prescription.
 */
export function canAccessDiagnosticTools(
  role: string | null | undefined,
  partnerType?: string | null | undefined
): boolean {
  if (!role) return false;

  const normalizedRole = role.trim().toLowerCase();

  // 1. Interdiction stricte et absolue pour les agriculteurs et exploitants végétaux
  if (normalizedRole === "agriculteur" || normalizedRole === "farmer") {
    return false;
  }

  // 2. Interdiction stricte et absolue pour les éleveurs et pasteurs
  if (normalizedRole === "eleveur") {
    return false;
  }

  // 3. Rôles d'experts techniques et administration
  if (
    normalizedRole === "agent_technique" ||
    normalizedRole === "expert" ||
    normalizedRole === "admin" ||
    normalizedRole === "manager"
  ) {
    return true;
  }

  // 4. Comptes Partenaires : Uniquement les prestataires agréés en Agronomie ou Vétérinaire
  if (normalizedRole === "partenaire") {
    const pt = (partnerType || "").trim().toLowerCase();
    if (
      pt === "expert_agronome" ||
      pt === "elevage_veterinaire" ||
      pt === "polyvalent"
    ) {
      return true;
    }
    // Les autres partenaires (fournisseurs d'intrants, machinistes, banques/assurances) n'ont pas accès
    return false;
  }

  return false;
}

/**
 * Fournit une explication métier contextualisée en cas d'interdiction d'accès.
 */
export function getDiagnosticAccessInfo(
  role: string | null | undefined,
  partnerType?: string | null | undefined
): RoleDiagnosticAccess {
  const allowed = canAccessDiagnosticTools(role, partnerType);
  if (allowed) {
    return { allowed: true };
  }

  const normalizedRole = (role || "").trim().toLowerCase();

  if (normalizedRole === "agriculteur" || normalizedRole === "farmer") {
    return {
      allowed: false,
      reason:
        "Conformément à la déontologie et aux réglementations agronomiques (INERA / CIRAD), l'établissement de diagnostics phytosanitaires officiels et la prescription de molécules actives sont strictement réservés aux experts et cabinets d'agronomie agréés.",
      recommendedRoute: "/dashboard/marketplace",
    };
  }

  if (normalizedRole === "eleveur") {
    return {
      allowed: false,
      reason:
        "Conformément aux normes vétérinaires nationales et sous-régionales, les outils de diagnostic clinique du bétail et d'émission d'ordonnances sont réservés exclusivement aux docteurs vétérinaires et techniciens de santé animale agréés.",
      recommendedRoute: "/dashboard/livestock-services",
    };
  }

  return {
    allowed: false,
    reason:
      "Ce banc de diagnostic est strictement réservé aux partenaires prestataires de services spécialisés en agronomie ou médecine vétérinaire.",
    recommendedRoute: "/dashboard",
  };
}
