/**
 * Utilitaires d'authentification inspirés de Orange Max It
 * Support Phone-First, Code PIN, indicatifs Ouest-Africains et mémorisation d'appareil.
 */

export interface WestAfricanCountry {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  minLength: number;
  maxLength: number;
  example: string;
}

export const WEST_AFRICAN_COUNTRIES: WestAfricanCountry[] = [
  { code: "BF", name: "Burkina Faso", dialCode: "+226", flag: "🇧🇫", minLength: 8, maxLength: 8, example: "70 00 00 00" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", flag: "🇨🇮", minLength: 10, maxLength: 10, example: "07 00 00 00 00" },
  { code: "SN", name: "Sénégal", dialCode: "+221", flag: "🇸🇳", minLength: 9, maxLength: 9, example: "77 000 00 00" },
  { code: "ML", name: "Mali", dialCode: "+223", flag: "🇲🇱", minLength: 8, maxLength: 8, example: "70 00 00 00" },
  { code: "NE", name: "Niger", dialCode: "+227", flag: "🇳🇪", minLength: 8, maxLength: 8, example: "90 00 00 00" },
  { code: "BJ", name: "Bénin", dialCode: "+229", flag: "🇧🇯", minLength: 8, maxLength: 8, example: "90 00 00 00" },
  { code: "TG", name: "Togo", dialCode: "+228", flag: "🇹🇬", minLength: 8, maxLength: 8, example: "90 00 00 00" },
  { code: "GN", name: "Guinée", dialCode: "+224", flag: "🇬🇳", minLength: 9, maxLength: 9, example: "620 00 00 00" },
];

export interface RememberedUserAccount {
  phone: string;
  fullName: string;
  role?: string;
  lastLoginAt: number;
}

const REMEMBERED_ACCOUNT_KEY = "nafa_maxit_remembered_account";

export const maxItStorage = {
  getRememberedAccount(): RememberedUserAccount | null {
    try {
      const data = localStorage.getItem(REMEMBERED_ACCOUNT_KEY);
      if (!data) return null;
      return JSON.parse(data) as RememberedUserAccount;
    } catch {
      return null;
    }
  },

  saveRememberedAccount(account: RememberedUserAccount): void {
    try {
      localStorage.setItem(REMEMBERED_ACCOUNT_KEY, JSON.stringify(account));
    } catch (e) {
      console.warn("Erreur stockage compte mémorisé:", e);
    }
  },

  clearRememberedAccount(): void {
    try {
      localStorage.removeItem(REMEMBERED_ACCOUNT_KEY);
    } catch {}
  },
};

/**
 * Convertit un numéro de téléphone international en adresse e-mail synthétique
 * unique et déterministe pour Supabase Auth : phone_{digits}@nafaagritech.app
 * Cela garantit que l'inscription et la connexion par numéro de téléphone fonctionnent
 * à 100% de manière native et fiable, sans dépendre d'un fournisseur SMS externe bloquant
 * ou de l'option "Phone provider" désactivée côté Supabase.
 */
export function phoneToSyntheticEmail(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `phone_${digits}@nafaagritech.app`;
}

/**
 * Dérive un mot de passe robuste et déterministe pour Supabase Auth
 * à partir du numéro de téléphone et du code PIN secret (4 ou 6 chiffres).
 * Cela permet de satisfaire les exigences de complexité de mot de passe Supabase
 * tout en offrant une expérience fluide par Code PIN à l'utilisateur.
 */
export function deriveTechnicalPassword(phone: string, pin: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  // Format déterministe sécurisé satisfaisant les politiques Supabase (> 8 chars, mix majuscules, chiffres et symboles)
  return `Nafa@${pin}#${cleanPhone.slice(-6)}!Secure`;
}

/**
 * Formate un numéro de téléphone avec un masque partiel pour l'affichage sécurisé
 * Ex: +226 70 •• •• 52
 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/[^0-9+]/g, "");
  if (digits.length <= 6) return digits;
  const start = digits.slice(0, 6);
  const end = digits.slice(-2);
  return `${start} •• •• ${end}`;
}

/**
 * Nettoie et formate les chiffres saisis par l'utilisateur pour une lecture aérée
 */
export function formatPhoneDigits(digits: string): string {
  const clean = digits.replace(/[^0-9]/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 4) return `${clean.slice(0, 2)} ${clean.slice(2)}`;
  if (clean.length <= 6) return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6)}`;
  return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`;
}
