/**
 * Service de gestion KYC (Know Your Customer) pour les partenaires NAFA - AGRITECH.
 * Supporte :
 *  - Personne Physique (agronome indépendant, exploitant, artisan, tractoriste)
 *  - Personne Morale (SARL, SAS, SA, Coopérative SCOOPS, ETS, ONG/Association)
 *
 * Persistance hors-ligne et synchronisation d'état avec les profils partenaires.
 */

export type KycPersonType = "personne_physique" | "personne_morale";
export type KycStatus = "non_soumis" | "en_attente" | "verifie" | "rejete";

export interface PersonnePhysiqueData {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationality: string;
  docType: "cnib" | "passeport" | "permis";
  docNumber: string;
  docExpiry: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  profession: string;
  specialty?: string;
  docFrontUrl?: string;
  docBackUrl?: string;
  selfieUrl?: string;
  certificateUrl?: string;
}

export interface PersonneMoraleData {
  companyName: string;
  legalForm: "SARL" | "SAS" | "SA" | "SCOOPS" | "GIE" | "ONG_ASSOCIATION" | "ETS";
  rccmNumber: string; // Ex: BF-OUA-01-2023-B12-00123
  ifuNumber: string;  // Ex: 00123456A
  ministerialApproval?: string; // Ex: Agrément Intrants MAAH n° 2022-045
  managerFullName: string;
  managerRole: string;
  managerDocType: "cnib" | "passeport";
  managerDocNumber: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  bankRibOrMobileMoney: string;
  rccmDocUrl?: string;
  ifuDocUrl?: string;
  approvalDocUrl?: string;
  managerDocUrl?: string;
  logoUrl?: string;
}

export interface PartnerKycDossier {
  partnerId: string;
  type: KycPersonType;
  status: KycStatus;
  submittedAt?: string;
  reviewedAt?: string;
  verifiedAt?: string;
  updatedAt?: string;
  rejectionReason?: string;
  certificationId?: string; // Ex: NAFA-CERT-2026-BF-0842
  physiqueData: PersonnePhysiqueData;
  moraleData: PersonneMoraleData;
}

const STORAGE_KEY_PREFIX = "nafa_partner_kyc_";

export const DEFAULT_PHYSIQUE_DATA: PersonnePhysiqueData = {
  firstName: "Karim",
  lastName: "Ouedraogo",
  birthDate: "1988-06-15",
  nationality: "Burkinabè",
  docType: "cnib",
  docNumber: "B12894750",
  docExpiry: "2029-08-20",
  phone: "+226 70 00 00 00",
  email: "karim.ouedraogo@nafaagritech.app",
  city: "Bobo-Dioulasso",
  address: "Secteur 22, Belleville",
  profession: "Conseiller Agricole & Opérateur Machinisme",
  specialty: "Diagnostic phytosanitaire & Arpentage GPS",
  docFrontUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
  docBackUrl: "",
  selfieUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
};

export const DEFAULT_MORALE_DATA: PersonneMoraleData = {
  companyName: "Faso Agro-Distribution SARL",
  legalForm: "SARL",
  rccmNumber: "BF-BOB-01-2021-B12-00458",
  ifuNumber: "00148920B",
  ministerialApproval: "Agrément Ministère Agriculture n° 2021/089/MAAH",
  managerFullName: "Mamadou Traoré",
  managerRole: "Gérant Associé Unique",
  managerDocType: "cnib",
  managerDocNumber: "B10459382",
  phone: "+226 75 77 48 52",
  email: "contact@faso-agro.bf",
  city: "Bobo-Dioulasso",
  address: "Avenue de l'Union Africaine, Zone Commerciale",
  bankRibOrMobileMoney: "Orange Money Marchand: +226 75 77 48 52",
  rccmDocUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
  ifuDocUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80",
  approvalDocUrl: "",
  managerDocUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
  logoUrl: "",
};

export function getDefaultKycDossier(partnerId: string = "current"): PartnerKycDossier {
  return {
    partnerId,
    type: "personne_morale",
    status: "non_soumis",
    physiqueData: { ...DEFAULT_PHYSIQUE_DATA },
    moraleData: { ...DEFAULT_MORALE_DATA },
  };
}

/**
 * Récupère le dossier KYC enregistré localement pour ce partenaire.
 */
export function getStoredPartnerKyc(partnerId: string = "current"): PartnerKycDossier {
  if (typeof window === "undefined") {
    return getDefaultKycDossier(partnerId);
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${partnerId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getDefaultKycDossier(partnerId),
        ...parsed,
        physiqueData: { ...DEFAULT_PHYSIQUE_DATA, ...(parsed.physiqueData || {}) },
        moraleData: { ...DEFAULT_MORALE_DATA, ...(parsed.moraleData || {}) },
      };
    }
  } catch (e) {
    console.warn("Erreur lecture dossier KYC:", e);
  }
  return getDefaultKycDossier(partnerId);
}

/**
 * Sauvegarde le dossier KYC et émet un événement DOM global.
 */
export function savePartnerKyc(dossier: PartnerKycDossier): void {
  if (typeof window === "undefined") return;
  try {
    const key = `${STORAGE_KEY_PREFIX}${dossier.partnerId || "current"}`;
    localStorage.setItem(key, JSON.stringify(dossier));
    window.dispatchEvent(
      new CustomEvent("nafa-partner-kyc-updated", {
        detail: { partnerId: dossier.partnerId, status: dossier.status, isVerified: dossier.status === "verifie" },
      })
    );
  } catch (e) {
    console.error("Erreur sauvegarde dossier KYC:", e);
  }
}

/**
 * Soumet le dossier pour examen par le comité de conformité NAFA - AGRITECH.
 */
export function submitKycDossier(
  partnerId: string = "current",
  type: KycPersonType,
  data: Partial<PartnerKycDossier>
): PartnerKycDossier {
  const current = getStoredPartnerKyc(partnerId);
  const updated: PartnerKycDossier = {
    ...current,
    ...data,
    partnerId,
    type,
    status: "en_attente",
    submittedAt: new Date().toISOString(),
    rejectionReason: undefined,
  };
  savePartnerKyc(updated);
  return updated;
}

/**
 * Valide et certifie le dossier KYC (Simulateur / Approbation automatique ou manuelle).
 * Attribue le matricule de certification officiel NAFA.
 */
export function approveKycDossier(partnerId: string = "current"): PartnerKycDossier {
  const current = getStoredPartnerKyc(partnerId);
  const now = new Date();
  const year = now.getFullYear();
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const prefix = current.type === "personne_morale" ? "PM" : "PP";
  const certNumber = `NAFA-CERT-${year}-BF-${prefix}${randomId}`;

  const updated: PartnerKycDossier = {
    ...current,
    status: "verifie",
    reviewedAt: now.toISOString(),
    verifiedAt: now.toISOString(),
    certificationId: current.certificationId || certNumber,
    rejectionReason: undefined,
  };

  savePartnerKyc(updated);
  return updated;
}

/**
 * Rejette un dossier KYC en fournissant un motif de non-conformité.
 */
export function rejectKycDossier(reason: string, partnerId: string = "current"): PartnerKycDossier {
  const current = getStoredPartnerKyc(partnerId);
  const updated: PartnerKycDossier = {
    ...current,
    status: "rejete",
    reviewedAt: new Date().toISOString(),
    rejectionReason: reason,
  };
  savePartnerKyc(updated);
  return updated;
}

/**
 * Réinitialise le dossier KYC pour recommencer la soumission.
 */
export function resetKycDossier(partnerId: string = "current"): PartnerKycDossier {
  const reset = getDefaultKycDossier(partnerId);
  savePartnerKyc(reset);
  return reset;
}

/**
 * Vérifie si le partenaire est certifié KYC.
 */
export function isPartnerKycVerified(partnerId: string = "current"): boolean {
  const dossier = getStoredPartnerKyc(partnerId);
  return dossier.status === "verifie";
}
