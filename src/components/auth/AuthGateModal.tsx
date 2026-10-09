import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserPlus,
  LogIn,
  Sparkles,
} from "lucide-react";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actionLabel?: string;
  redirectUrl?: string;
  simulationPayload?: any;
}

export function AuthGateModal({
  open,
  onOpenChange,
  title = "Créez votre compte gratuit pour sauvegarder",
  description = "Vous venez de tester un outil NAFA-AGRITECH. Créez votre compte gratuitement pour sauvegarder vos calculs, parcelles, diagnostics et projets.",
  actionLabel = "Enregistrer mon résultat",
  redirectUrl = "/dashboard",
  simulationPayload,
}: AuthGateModalProps) {
  const navigate = useNavigate();

  const handleRegister = () => {
    if (simulationPayload) {
      try {
        sessionStorage.setItem("nafa_pending_simulation", JSON.stringify(simulationPayload));
      } catch (e) {
        // ignore quota errors
      }
    }
    onOpenChange(false);
    navigate(`/auth?mode=register&redirect=${encodeURIComponent(redirectUrl)}`);
  };

  const handleLogin = () => {
    if (simulationPayload) {
      try {
        sessionStorage.setItem("nafa_pending_simulation", JSON.stringify(simulationPayload));
      } catch (e) {
        // ignore quota errors
      }
    }
    onOpenChange(false);
    navigate(`/auth?mode=login&redirect=${encodeURIComponent(redirectUrl)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 sm:p-7 border-border bg-card shadow-2xl">
        <DialogHeader className="text-center sm:text-left space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto sm:mx-0">
            <Sparkles className="h-6 w-6 text-[#F97316]" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-heading font-black text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Avantages immédiats du compte gratuit */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-2.5 my-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Ce que votre compte gratuit débloque :
          </p>
          <ul className="space-y-1.5 text-xs text-foreground font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Sauvegarde permanente de vos parcelles et simulations</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Génération de dossiers techniques & devis officiels en FCFA</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Passation de commandes sur le marché et réservation d'engins</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Synchronisation locale 100% disponible sans connexion</span>
            </li>
          </ul>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-2.5 pt-2">
          <Button
            size="lg"
            onClick={handleRegister}
            className="w-full bg-[#F97316] hover:bg-[#ea580c] text-white font-heading font-extrabold text-sm sm:text-base py-5 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>Créer mon compte gratuitement</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogin}
              className="flex-1 rounded-xl text-xs font-semibold h-10 border-border"
            >
              <LogIn className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <span>J'ai déjà un compte</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl text-xs text-muted-foreground hover:text-foreground h-10"
            >
              Continuer à tester
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuthGateModal;
