/**
 * NAFA AGRITECH — EVENT-DRIVEN ARCHITECTURE (BUS D'ÉVÉNEMENTS MÉTIER)
 * 
 * Permet l'actualisation en temps réel et réactive de tous les modules
 * lors des événements du cycle de vie (connexion utilisateur, capture GPS/IP,
 * mise à jour météo/FAO-56, alertes phytosanitaires, adaptation des prix).
 */

export type NafaEventType =
  | "auth:login"
  | "auth:logout"
  | "location:detected"
  | "location:error"
  | "engine:sync_started"
  | "engine:sync_completed"
  | "engine:sync_error"
  | "agro:alert_emitted";

export type EventHandler<T = any> = (payload: T) => void;

class NafaEventBus {
  private listeners: Map<NafaEventType, Set<EventHandler>> = new Map();
  private lastPayloads: Map<NafaEventType, any> = new Map();

  /**
   * S'abonner à un événement
   */
  public on<T = any>(event: NafaEventType, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Retourne la fonction de désabonnement pour les useEffect React
    return () => this.off(event, handler);
  }

  /**
   * S'abonner une seule fois
   */
  public once<T = any>(event: NafaEventType, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (payload: T) => {
      this.off(event, wrapper);
      handler(payload);
    };
    return this.on(event, wrapper);
  }

  /**
   * Se désabonner
   */
  public off<T = any>(event: NafaEventType, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Émettre un événement à tous les abonnés
   */
  public emit<T = any>(event: NafaEventType, payload: T): void {
    this.lastPayloads.set(event, payload);
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[EventBus] Erreur dans le handler de "${event}":`, err);
        }
      });
    }
  }

  /**
   * Récupérer le dernier payload émis pour cet événement
   */
  public getLastPayload<T = any>(event: NafaEventType): T | undefined {
    return this.lastPayloads.get(event);
  }

  /**
   * Vider tous les abonnés (utile pour les tests)
   */
  public clear(): void {
    this.listeners.clear();
    this.lastPayloads.clear();
  }
}

export const nafaEventBus = new NafaEventBus();
export default nafaEventBus;
