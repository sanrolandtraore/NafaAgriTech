/**
 * NAFA - AGRITECH : Gestionnaire de Stockage de Session d'Authentification
 * Utilise le stockage local natif sécurisé du navigateur.
 */

export function brokeredPreviewStorage() {
  if (typeof window === 'undefined') return undefined;
  return localStorage;
}
