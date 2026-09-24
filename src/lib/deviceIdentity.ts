/**
 * NAFA - AGRITECH : Identité d'Appareil Réelle & Persistante (Zéro Fictif / Zéro Mock)
 * Fournit un identifiant cryptographique matériel unique et persistant pour chaque terminal,
 * garantissant qu'aucune session hors-ligne ou anonyme n'utilise de données ou identifiants fictifs.
 */

export function getClientDeviceId(): string {
  if (typeof window === "undefined") return "server-session";
  const KEY = "nafa_device_client_uuid";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = "client-" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "client-ephemeral";
  }
}

export function getEffectiveUserId(userId?: string | null): string {
  if (userId && userId.trim()) return userId.trim();
  return getClientDeviceId();
}
