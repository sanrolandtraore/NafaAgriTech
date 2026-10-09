/**
 * NAFA - AGRITECH : Validation de Redirection Sécurisée
 * Prévient les attaques par redirection ouverte (Open Redirect).
 */

export function getSafeRedirectUrl(target: string | null | undefined, defaultPath = "/dashboard"): string {
  if (!target || typeof target !== "string") {
    return defaultPath;
  }

  const trimmed = target.trim();
  if (!trimmed) return defaultPath;

  // Rejeter explicitement les schémas non sécurisés (javascript:, data:, file:, etc.)
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return defaultPath;
  }

  // Si c'est une URL absolue complète, autoriser uniquement si elle correspond au même origin
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    try {
      if (typeof window !== "undefined" && window.location?.origin) {
        const parsed = new URL(trimmed, window.location.origin);
        if (parsed.origin === window.location.origin) {
          return parsed.pathname + parsed.search + parsed.hash;
        }
      }
    } catch {
      return defaultPath;
    }
    return defaultPath;
  }

  // Bloquer les chemins relatifs au protocole qui mènent vers des domaines externes (ex: //evil.com, /\\evil.com)
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.startsWith("\\")) {
    return defaultPath;
  }

  // Ne doit autoriser que les chemins internes relatifs à la racine
  if (!trimmed.startsWith("/")) {
    return defaultPath;
  }

  return trimmed;
}

export const sanitizeRedirectUrl = getSafeRedirectUrl;
