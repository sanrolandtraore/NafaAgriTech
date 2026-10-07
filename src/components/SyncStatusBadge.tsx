import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Database
} from "lucide-react";
import { 
  getSyncCounts, 
  onSyncStatusChange, 
  syncPendingRecords, 
  retryFailedRecords,
  resolveStuckSyncErrors
} from "@/lib/dexieDb";
import {
  syncAllDatastores,
  onUniversalSyncChange,
  UniversalSyncSummary,
  getUniversalSyncSummary
} from "@/lib/universalSyncEngine";

export const SyncStatusBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [syncSummary, setSyncSummary] = useState<UniversalSyncSummary>(getUniversalSyncSummary());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // 1. Online / Offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      handleManualSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 2. Reactive subscription to Universal Sync Engine (unifies all datastores)
    const unsubscribe = onUniversalSyncChange((newSummary) => {
      setSyncSummary(newSummary);
      setIsSyncing(newSummary.status === "syncing");
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  const handleResolveStuck = async () => {
    setIsSyncing(true);
    try {
      await resolveStuckSyncErrors();
      await syncAllDatastores({ silent: false });
    } catch (e) {
      console.error("Erreur déblocage synchronisation:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      await syncAllDatastores({ silent: false });
    } catch (e) {
      console.error("Erreur synchronisation universelle:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalPending = syncSummary.totalPending;
  const hasError = syncSummary.status === "error" || syncSummary.totalFailed > 0;
  const lastSyncTime = syncSummary.lastSyncedAt;

  // Détermination du statut visuel WhatsApp-style
  // Erreur
  if (hasError) {
    const errorCount = syncSummary.totalFailed || 1;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button 
            type="button"
            className="inline-flex items-center gap-1.5 py-1 px-3 text-xs font-semibold rounded-full border border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300 hover:bg-red-500/25 transition cursor-pointer shadow-xs"
            title="Des données n'ont pas pu être synchronisées"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            <span>{errorCount} échec{errorCount > 1 ? "s" : ""}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3 text-xs space-y-2.5 shadow-lg" align="end">
          <div className="flex items-center justify-between font-semibold text-foreground border-b pb-1.5">
            <span className="flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Erreur de synchronisation
            </span>
            <span className="text-[11px] text-muted-foreground">{errorCount} bloqué(s)</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Certaines modifications locales n'ont pas pu être poussées vers le serveur. Vos données restent conservées en sécurité sur cet appareil.
          </p>
          <div className="pt-1 flex flex-col gap-2 border-t border-border/50">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{totalPending} en attente</span>
              <span className="text-emerald-600 font-semibold">100% Sauvegardé en local</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="default"
                disabled={isSyncing}
                onClick={handleResolveStuck}
                className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                title="Conserver définitivement en sécurité locale et débloquer"
              >
                <CheckCircle2 className="h-3 w-3" />
                Débloquer & Conserver
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isSyncing || !isOnline}
                onClick={handleManualSync}
                className="h-7 text-xs gap-1 border-red-300 hover:bg-red-50 text-red-700"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                Réessayer
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // En attente (offline ou modifications en file)
  if (totalPending > 0 || !isOnline) {
    const label = !isOnline 
      ? (totalPending > 0 ? `Hors-ligne (${totalPending})` : "Hors-ligne")
      : `${totalPending} en attente`;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button 
            type="button"
            className="inline-flex items-center gap-1.5 py-1 px-3 text-xs font-semibold rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 transition cursor-pointer shadow-xs"
            title="Données sauvegardées localement en attente de synchronisation"
          >
            <Clock className={`h-3.5 w-3.5 text-amber-600 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 text-xs space-y-2 shadow-lg" align="end">
          <div className="flex items-center justify-between font-semibold text-foreground border-b pb-1.5">
            <span className="flex items-center gap-1.5 text-amber-600">
              {!isOnline ? <WifiOff className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {!isOnline ? "Mode Hors-ligne (WhatsApp-style)" : "Synchronisation en attente"}
            </span>
          </div>
          <p className="text-muted-foreground text-[11px]">
            {!isOnline 
              ? "Vous travaillez en toute autonomie hors connexion. Toutes vos saisies sont enregistrées immédiatement dans IndexedDB et partiront dès le retour du réseau."
              : `${totalPending} opération(s) locale(s) attendent la synchronisation Supabase.`}
          </p>
          <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Global : {syncSummary.totalSynced} synchronisé(s)</span>
            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                disabled={isSyncing}
                onClick={handleManualSync}
                className="h-7 text-xs gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                Pousser
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Synchronisé
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          type="button"
          className="inline-flex items-center gap-1.5 py-1 px-3 text-xs font-semibold rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer shadow-xs"
          title="Toutes les données sont synchronisées"
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>Synchronisé</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 text-xs space-y-2 shadow-lg" align="end">
        <div className="flex items-center justify-between font-semibold text-foreground border-b pb-1.5">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Données à jour
          </span>
          <Wifi className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <p className="text-muted-foreground text-[11px]">
          Toutes vos modifications locales sont synchronisées avec la base Supabase. Vos données sont résilientes et sécurisées.
        </p>
        <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{lastSyncTime ? `Dernière synchro : ${lastSyncTime}` : "En direct"}</span>
          <Button
            size="sm"
            variant="ghost"
            disabled={isSyncing}
            onClick={handleManualSync}
            className="h-6 px-2 text-[11px] gap-1 hover:bg-emerald-50 text-emerald-700"
          >
            <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? "animate-spin" : ""}`} />
            Vérifier
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
