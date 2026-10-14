/**
 * NAFA AGRITECH — PILL & MODAL DE GÉOLOCALISATION & MOTEUR MÉTIER TEMPS RÉEL
 * 
 * Affiche la position de l'utilisateur capturée dès le login (GPS Navigateur ou IP)
 * et permet de visualiser l'état de synchronisation du moteur métier agronomique & vétérinaire.
 */

import React, { useState } from "react";
import {
  MapPin,
  RefreshCw,
  Compass,
  Sprout,
  Droplets,
  Sun,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRealtimeEngineContext } from "@/hooks/useRealtimeEngineContext";

export function RealtimeEngineLocationPill({ className = "" }: { className?: string }) {
  const { location, context, isSyncing, refreshLocation } = useRealtimeEngineContext();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleManualRefresh = async () => {
    try {
      await refreshLocation();
      toast.success("Position et contexte du moteur métier actualisés en temps réel !");
    } catch {
      toast.error("Impossible d'actualiser la géolocalisation.");
    }
  };

  const isGps = location.method === "browser_gps";
  const isIp = location.method === "ip_lookup";

  return (
    <>
      {/* Bouton Pill Compact */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
          isGps
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            : isIp
            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
            : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
        } ${className}`}
        title="Localisation & Contexte Moteur Métier en Temps Réel"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isGps ? "bg-emerald-400" : isIp ? "bg-cyan-400" : "bg-amber-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isGps ? "bg-emerald-500" : isIp ? "bg-cyan-500" : "bg-amber-500"
            }`}
          />
        </span>

        <MapPin className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate max-w-[130px] sm:max-w-[180px]">
          {location.city} ({location.region})
        </span>

        <span className="text-[10px] uppercase font-bold opacity-75 px-1 py-0.2 rounded bg-black/20">
          {isGps ? "GPS" : isIp ? "IP" : "REF"}
        </span>
      </button>

      {/* Modal Détails & Contexte Métier */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-5 bg-slate-950 text-slate-100 border-slate-800 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    isGps ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400"
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                    {location.city}
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {location.region}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    {location.country} • Province du {location.province}
                  </DialogDescription>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleManualRefresh}
                disabled={isSyncing}
                className="h-8 px-2.5 text-xs bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </DialogHeader>

          {/* Mode de Détection */}
          <div className="my-3 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Mécanisme de Détection :</span>
              <span className="font-bold flex items-center gap-1.5 text-white">
                {isGps ? (
                  <>
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    Navigateur HTML5 (GPS Précis)
                  </>
                ) : isIp ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Estimation Réseau / IP
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    Référentiel National Local
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Coordonnées GPS :</span>
              <span className="font-mono text-slate-200">
                {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Précision Estimée :</span>
              <span className="font-mono text-slate-200">± {location.accuracyM} m</span>
            </div>

            {location.distanceToToponymKm !== undefined && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Distance Pôle Agricole :</span>
                <span className="font-mono text-slate-200">{location.distanceToToponymKm} km</span>
              </div>
            )}
          </div>

          {/* Paramètres du Moteur Métier Synchronisés */}
          {context && (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <span>Contexte Moteur Métier (Temps Réel)</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Synchronisé
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" /> ETo FAO-56
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {context.climate.fao56EToMmDay} mm/jour
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" /> Température & Climat
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {context.climate.temperatureC}°C ({context.climate.relativeHumidityPct}%)
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Saison Agro-Climatique :</span>
                <span className="font-semibold text-emerald-400">{context.climate.seasonLabel}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Zone Écologique & Sol :</span>
                <span className="font-semibold text-slate-200">
                  {context.agroZone.name} — Sol {context.agroZone.dominantSoil.toUpperCase()}
                </span>
              </div>

              {/* Alertes sanitaires en cours */}
              {(context.phytosanitaryAlerts.length > 0 || context.veterinaryAlerts.length > 0) && (
                <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/30 space-y-1.5">
                  <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Alertes Sanitaires Actives
                  </span>
                  {context.phytosanitaryAlerts.map((a) => (
                    <div key={a.id} className="text-[11px] text-red-300">
                      • <strong>{a.name}</strong> ({a.targetCrops.join(", ")})
                    </div>
                  ))}
                  {context.veterinaryAlerts.map((v) => (
                    <div key={v.id} className="text-[11px] text-amber-300">
                      • <strong>{v.name}</strong> ({v.targetSpecies.join(", ")})
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Architecture Event-Driven NAFA</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Conforme CSP-CILSS
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RealtimeEngineLocationPill;
