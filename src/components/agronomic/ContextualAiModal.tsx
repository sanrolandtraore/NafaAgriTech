import React from "react";
import { useNavigate } from "react-router-dom";
import { AgronomicToolItem } from "@/lib/agronomicToolkitStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Bot, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";

interface ContextualAiModalProps {
  tool: AgronomicToolItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContextualAiModal: React.FC<ContextualAiModalProps> = ({
  tool,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();

  if (!tool) return null;

  const handleLaunchWithPrompt = (promptText: string) => {
    onOpenChange(false);
    navigate(`/dashboard/genius?tool=${encodeURIComponent(tool.id)}&prompt=${encodeURIComponent(promptText)}`);
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Consigne copiée dans le presse-papier !");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[28px] p-6 border border-border shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F97316]/10 text-[#F97316] text-xs font-black uppercase tracking-wider w-fit">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span>IA Contextuelle NAFA Genius</span>
          </div>

          <DialogTitle className="text-xl font-heading font-black text-foreground flex items-center gap-2">
            <span>{tool.title}</span>
          </DialogTitle>

          <DialogDescription className="text-xs text-muted-foreground">
            {tool.contextualAi.roleDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Context Card */}
          <div className="p-3.5 rounded-[18px] bg-muted/50 border border-border text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Bot className="h-4 w-4 text-[#F97316]" />
              <span>Contexte Métier Détecté</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              En ouvrant <strong>{tool.title}</strong>, NAFA Genius charge automatiquement les abaques techniques, règles INERA et formules hydrauliques correspondantes.
            </p>
          </div>

          {/* Quick Prompts */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wide block">
              Actions d'aide rapide en 1-clic :
            </span>
            <div className="space-y-2">
              {tool.contextualAi.suggestedActions.map((action, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-[16px] bg-card border border-border/80 hover:border-[#F97316]/50 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground block group-hover:text-[#F97316] transition-colors truncate">
                      {action.label}
                    </span>
                    <p className="text-[11px] text-muted-foreground italic truncate">
                      "{action.prompt}"
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(action.prompt)}
                      title="Copier la consigne"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <Button
                      size="sm"
                      onClick={() => handleLaunchWithPrompt(action.prompt)}
                      className="h-8 px-2.5 rounded-[12px] bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-bold gap-1"
                    >
                      <span>Lancer</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-[16px] text-xs font-bold"
          >
            Fermer
          </Button>

          <Button
            onClick={() => {
              onOpenChange(false);
              navigate(tool.route);
            }}
            className="rounded-[16px] bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:bg-[#F97316] dark:hover:bg-[#F97316] dark:hover:text-white font-bold text-xs gap-1.5"
          >
            <span>Accéder directement à l'outil</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
