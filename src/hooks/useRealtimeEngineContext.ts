/**
 * NAFA AGRITECH — HOOK REACT POUR LE MOTEUR MÉTIER TEMPS RÉEL (EVENT-DRIVEN)
 * 
 * Permet à n'importe quel composant (Tableau de bord, Fiches techniques,
 * Marketplace, Irrigation IRRIS, Hub Vétérinaire) d'accéder instantanément
 * au contexte géolocalisé et de réagir en temps réel aux événements de position.
 */

import { useState, useEffect, useCallback } from "react";
import nafaEventBus from "@/services/eventBus";
import userGeolocationService, { UserLocationState } from "@/services/userGeolocationService";
import businessEngineSyncService, { RealtimeEngineContext } from "@/services/businessEngineSyncService";

export function useRealtimeEngineContext() {
  const [location, setLocation] = useState<UserLocationState>(() =>
    userGeolocationService.getCurrentLocation()
  );
  const [context, setContext] = useState<RealtimeEngineContext | null>(() =>
    businessEngineSyncService.getCurrentContext()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(() =>
    businessEngineSyncService.getIsSyncing()
  );

  useEffect(() => {
    // 1. Abonnement à la détection de géolocalisation
    const unsubLocation = nafaEventBus.on<UserLocationState>("location:detected", (newLoc) => {
      setLocation(newLoc);
    });

    // 2. Abonnement au début de synchronisation métier
    const unsubStart = nafaEventBus.on("engine:sync_started", () => {
      setIsSyncing(true);
    });

    // 3. Abonnement à l'achèvement de la synchronisation métier
    const unsubDone = nafaEventBus.on<RealtimeEngineContext>("engine:sync_completed", (newCtx) => {
      setContext(newCtx);
      setIsSyncing(false);
    });

    const unsubError = nafaEventBus.on("engine:sync_error", () => {
      setIsSyncing(false);
    });

    return () => {
      unsubLocation();
      unsubStart();
      unsubDone();
      unsubError();
    };
  }, []);

  const refreshLocation = useCallback(async () => {
    setIsSyncing(true);
    try {
      const loc = await userGeolocationService.detectLocationAtLogin({ forceRefresh: true });
      await businessEngineSyncService.syncEngineWithLocation(loc);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    location,
    context,
    isSyncing,
    refreshLocation,
    lastSyncedAt: context?.syncedAt || location.detectedAt,
  };
}

export default useRealtimeEngineContext;
