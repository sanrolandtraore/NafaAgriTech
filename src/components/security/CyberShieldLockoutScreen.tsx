import React, { useState, useEffect } from "react";
import { QuarantineState, CyberShieldSystem } from "@/lib/cyberShieldEngine";
import { ShieldAlert, Lock, AlertOctagon, Terminal, Key, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CyberShieldLockoutScreenProps {
  quarantine: QuarantineState;
}

export const CyberShieldLockoutScreen: React.FC<CyberShieldLockoutScreenProps> = ({ quarantine }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [overrideKey, setOverrideKey] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  useEffect(() => {
    const calculateRemaining = () => {
      const diff = Math.max(0, Math.floor((new Date(quarantine.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(diff);
      if (diff === 0) {
        window.location.reload();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [quarantine.expiresAt]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const success = CyberShieldSystem.releaseQuarantine(overrideKey);
    if (success) {
      setIsUnlocked(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setErrorMsg("Clé de sécurité administrateur invalide. Accès refusé par le bouclier autonome.");
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/95 p-4 sm:p-6 backdrop-blur-md text-slate-100 font-sans">
      <div className="w-full max-w-xl rounded-2xl border border-red-500/40 bg-slate-900/95 p-6 sm:p-8 shadow-2xl shadow-red-950/50 relative overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 shadow-inner">
            <ShieldAlert className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Bouclier Autonome IPS/RASP Actif
              </span>
              <span className="text-xs font-mono text-slate-400">Score de Risque : {quarantine.score}/100</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Accès Interrompu & Quarantaine Autonome
            </h1>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 mb-6 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
            <span>RÉFÉRENCE INCIDENT :</span>
            <span className="text-red-400 font-bold">{quarantine.incidentId}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
            <span>VECTEUR DÉTECTÉ :</span>
            <span className="text-amber-400 font-semibold">{quarantine.threatCategory}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
            <span>EMPREINTE TERMINAL :</span>
            <span className="text-slate-300 truncate max-w-[240px]">{quarantine.fingerprint}</span>
          </div>
          <div className="text-slate-300 pt-1 leading-relaxed">
            <span className="text-slate-500 block text-[11px] mb-1 font-sans font-semibold">MOTIF D'INTERCEPTION :</span>
            {quarantine.reason}
          </div>
        </div>

        {/* Actions Autonomes Exécutées */}
        <div className="space-y-2 mb-6 text-xs text-slate-300">
          <div className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-2">
            <Terminal className="h-3.5 w-3.5 text-red-400" />
            Mesures de Sécurité Appliquées Immédiatement :
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Révocation immédiate des sessions et purge des jetons locaux.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Mise sous séquestre temporaire du terminal sans intervention humaine.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Empreinte scellée dans le registre d'audit cryptographique infalsifiable.</span>
          </div>
        </div>

        {/* Compteur d'expiration */}
        <div className="rounded-xl bg-red-950/30 border border-red-800/40 p-3.5 flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5 text-xs text-red-300">
            <AlertOctagon className="h-4 w-4 text-red-400 shrink-0" />
            <span>Levée automatique de la quarantaine dans :</span>
          </div>
          <div className="text-base font-bold font-mono text-red-400">
            {formatTime(secondsRemaining)}
          </div>
        </div>

        {/* Formulaire de Déblocage Administrateur */}
        <form onSubmit={handleUnlock} className="space-y-3 pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Key className="h-3.5 w-3.5 text-amber-400" />
              Déblocage d'urgence Administrateur :
            </span>
            <span className="text-[10px] text-slate-500">Clé d'intervention</span>
          </div>

          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Saisir la clé d'urgence..."
              value={overrideKey}
              onChange={(e) => setOverrideKey(e.target.value)}
              className="bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-500 h-9"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-9 px-4 text-xs font-semibold border-amber-600/50 hover:bg-amber-600/20 text-amber-400 shrink-0"
            >
              Débloquer
            </Button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 font-medium animate-fade-in">{errorMsg}</p>
          )}

          {isUnlocked && (
            <p className="text-xs text-emerald-400 font-medium animate-fade-in flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Déblocage validé. Réinitialisation de la plateforme en cours...
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
