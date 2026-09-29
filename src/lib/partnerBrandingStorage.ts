/**
 * Stockage local du profil de marque pour agronomes et partenaires
 * Permet la personnalisation complète des devis, rapports d'inspection et dossiers PDF
 * sans mention de plateforme tierce si configuré.
 */

export interface PartnerBranding {
  companyName: string;
  expertName: string;
  expertTitle: string;
  logoText: string;
  logoImage?: string; // Data URL base64 si fourni
  tagline: string;
  phone: string;
  email: string;
  address: string;
  registrationNumber: string; // Numéro d'agrément ou RCCM
  primaryColor: string;
  accentColor: string;
}

const STORAGE_KEY = "nafa_partner_branding_v1";

const DEFAULT_BRANDING: PartnerBranding = {
  companyName: "",
  expertName: "",
  expertTitle: "Ingénieur Agronome & Conseil",
  logoText: "",
  tagline: "Cabinet d'Ingénierie & d'Expertise Agronomique de Terrain",
  phone: "",
  email: "",
  address: "",
  registrationNumber: "",
  primaryColor: "#15803d",
  accentColor: "#eab308",
};

export const partnerBrandingStorage = {
  get(): PartnerBranding {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...DEFAULT_BRANDING };
      return { ...DEFAULT_BRANDING, ...JSON.parse(stored) };
    } catch {
      return { ...DEFAULT_BRANDING };
    }
  },

  save(branding: Partial<PartnerBranding>): void {
    try {
      const current = this.get();
      const updated = { ...current, ...branding };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("partner-branding-updated", { detail: updated }));
    } catch (e) {
      console.error("partnerBrandingStorage.save error:", e);
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  isConfigured(): boolean {
    const b = this.get();
    return b.companyName.trim().length > 0 || b.logoText.trim().length > 0;
  },

  getDisplayName(): string {
    const b = this.get();
    if (b.companyName.trim()) return b.companyName.trim();
    if (b.logoText.trim()) return b.logoText.trim();
    return "Cabinet d'Ingénierie Agronomique";
  },

  getHeaderLine(): string {
    const b = this.get();
    if (b.tagline.trim()) return b.tagline.trim();
    return "ÉTUDES TECHNIQUES • GÉODÉSIE • HYDRAULIQUE & BÂTIMENTS RURAUX";
  },

  getFooterText(): string {
    const b = this.get();
    const parts: string[] = [];
    if (b.companyName.trim()) parts.push(b.companyName.trim());
    if (b.registrationNumber.trim()) parts.push(`Agrément : ${b.registrationNumber.trim()}`);
    if (b.phone.trim()) parts.push(b.phone.trim());
    if (b.email.trim()) parts.push(b.email.trim());
    if (parts.length === 0) {
      return "Dossier technique d'expertise agronomique • Conforme normes professionnelles en vigueur";
    }
    return parts.join(" • ");
  }
};
