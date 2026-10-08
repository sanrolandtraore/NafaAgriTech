import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Cpu,
  Zap,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { realAiService, AiProvider, RealAiConfig } from "@/lib/realAiService";

interface RealAiConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROVIDER_MODELS: Record<AiProvider, { label: string; value: string; recommended?: boolean }[]> = {
  anthropic: [
    { label: "Claude 3.5 Sonnet (Recommandé - Raisonnement & Vision HD)", value: "claude-3-5-sonnet-20241022", recommended: true },
    { label: "Claude 3.7 Sonnet (Dernière Génération Hybride)", value: "claude-3-7-sonnet-20250219" },
    { label: "Claude 3.5 Haiku (Ultra-Rapide & Économique)", value: "claude-3-5-haiku-20241022" },
  ],
  openrouter: [
    { label: "Anthropic Claude 3.5 Sonnet via OpenRouter", value: "anthropic/claude-3.5-sonnet", recommended: true },
    { label: "Anthropic Claude 3.7 Sonnet via OpenRouter", value: "anthropic/claude-3.7-sonnet" },
    { label: "Google Gemini 2.0 Flash via OpenRouter", value: "google/gemini-2.0-flash-001" },
    { label: "OpenAI GPT-4o via OpenRouter", value: "openai/gpt-4o" },
  ],
  gemini: [
    { label: "Google Gemini 2.0 Flash (Multimodal & Rapide)", value: "gemini-2.0-flash", recommended: true },
    { label: "Google Gemini 1.5 Pro (Haute Capacité)", value: "gemini-1.5-pro" },
  ],
  openai: [
    { label: "GPT-4o (Vision & Raisonnement)", value: "gpt-4o", recommended: true },
    { label: "GPT-4o Mini (Léger & Rapide)", value: "gpt-4o-mini" },
  ],
};

export default function RealAiConfigModal({ open, onOpenChange }: RealAiConfigModalProps) {
  const [config, setConfig] = useState<RealAiConfig>(realAiService.getConfig());
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; latencyMs?: number; error?: string } | null>(null);

  useEffect(() => {
    if (open) {
      setConfig(realAiService.getConfig());
      setTestStatus(null);
    }
  }, [open]);

  const handleProviderChange = (provider: AiProvider) => {
    const defaultModel = PROVIDER_MODELS[provider][0]?.value || "";
    setConfig((prev) => ({
      ...prev,
      provider,
      model: defaultModel,
    }));
    setTestStatus(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await realAiService.testConnection(config.provider, config.apiKey, config.model);
      setTestStatus(res);
      if (res.success) {
        toast.success(`Connexion réussie avec ${config.provider.toUpperCase()} (${res.latencyMs} ms) !`);
      } else {
        toast.error(`Échec du test : ${res.error}`);
      }
    } catch (e: any) {
      setTestStatus({ success: false, error: e?.message || "Erreur de connexion" });
      toast.error("Impossible de joindre le fournisseur d'IA.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    realAiService.saveConfig(config);
    toast.success("Configuration de l'IA réelle enregistrée avec succès !");
    onOpenChange(false);
  };

  const handleClear = () => {
    setConfig({
      provider: "anthropic",
      apiKey: "",
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.3,
      maxTokens: 2048,
    });
    realAiService.saveConfig({
      provider: "anthropic",
      apiKey: "",
      model: "claude-3-5-sonnet-20241022",
    });
    setTestStatus(null);
    toast.info("Configuration réinitialisée (mode local).");
  };

  const isConfigured = Boolean(config.apiKey && config.apiKey.trim().length > 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Moteur d'IA Réelle Personnalisée
            </DialogTitle>
            <Badge
              variant={isConfigured ? "default" : "outline"}
              className={
                isConfigured
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white gap-1"
                  : "border-amber-500 text-amber-700 dark:text-amber-400 gap-1"
              }
            >
              {isConfigured ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {isConfigured ? "IA Réelle Active" : "Mode Local / Heuristique"}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Connectez directement un modèle d'IA avancé (<strong>Anthropic Claude 3.5 Sonnet</strong>, Gemini ou GPT-4o) pour obtenir des diagnostics visuels haute fidélité, des ordonnances sur-mesure et un copilote agronomique expert.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Sélection du Fournisseur */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase">Fournisseur d'IA</Label>
            <Tabs value={config.provider} onValueChange={(v) => handleProviderChange(v as AiProvider)}>
              <TabsList className="grid grid-cols-4 w-full h-10">
                <TabsTrigger value="anthropic" className="text-xs font-semibold gap-1">
                  Claude
                  <span className="text-[10px] bg-primary/20 text-primary px-1 rounded hidden sm:inline">Pro</span>
                </TabsTrigger>
                <TabsTrigger value="openrouter" className="text-xs font-semibold">
                  OpenRouter
                </TabsTrigger>
                <TabsTrigger value="gemini" className="text-xs font-semibold">
                  Gemini
                </TabsTrigger>
                <TabsTrigger value="openai" className="text-xs font-semibold">
                  OpenAI
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Sélection du Modèle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase">Modèle d'IA</Label>
            <Select
              value={config.model}
              onValueChange={(val) => setConfig((prev) => ({ ...prev, model: val }))}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Sélectionner le modèle..." />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_MODELS[config.provider].map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Saisie de la Clé API */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                Clé API {config.provider === "anthropic" ? "Anthropic (sk-ant-...)" : config.provider === "openrouter" ? "OpenRouter (sk-or-...)" : config.provider === "gemini" ? "Google AI (AIza...)" : "OpenAI (sk-...)"}
              </Label>
              {config.provider === "anthropic" && (
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline"
                >
                  Obtenir une clé Claude
                </a>
              )}
              {config.provider === "openrouter" && (
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline"
                >
                  Obtenir une clé OpenRouter
                </a>
              )}
            </div>

            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder={
                  config.provider === "anthropic"
                    ? "sk-ant-api03-..."
                    : config.provider === "openrouter"
                    ? "sk-or-v1-..."
                    : config.provider === "gemini"
                    ? "AIzaSy..."
                    : "sk-proj-..."
                }
                value={config.apiKey}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, apiKey: e.target.value }));
                  setTestStatus(null);
                }}
                className="pr-10 font-mono text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Votre clé est stockée uniquement en local dans votre navigateur. Aucune donnée n'est partagée.
            </p>
          </div>

          {/* Bouton Tester la connexion & retour */}
          <div className="pt-1 space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting || !config.apiKey}
              className="w-full gap-2 text-xs font-semibold"
            >
              <Zap className={`h-3.5 w-3.5 ${isTesting ? "animate-spin text-amber-500" : "text-amber-500"}`} />
              {isTesting ? "Vérification en cours avec l'API..." : "Tester la connexion API"}
            </Button>

            {testStatus && (
              <div
                className={`p-2.5 rounded-md text-xs border flex items-start gap-2 ${
                  testStatus.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                {testStatus.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <p className="font-bold">Connexion opérationnelle !</p>
                      <p className="text-[11px]">Latence mesurée : {testStatus.latencyMs} ms. Le modèle {config.model} répond parfaitement.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Échec de la connexion :</p>
                      <p className="text-[11px]">{testStatus.error}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Encadré d'assurance scientifique */}
          <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Ce que l'IA Réelle apporte à vos outils :
            </div>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-[11px]">
              <li><strong>Diagnostic foliaire multimodal :</strong> Examen de vraies photos de plantes par Claude Vision.</li>
              <li><strong>Solutions adaptées au Burkina Faso :</strong> Dosages biologiques INERA et homologations CSP-CILSS chiffrées en FCFA.</li>
              <li><strong>Copilote agronomique :</strong> Réponse sur-mesure à vos questions complexes en français et langues locales.</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:gap-0 pt-2 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Réinitialiser
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs font-bold gradient-primary text-primary-foreground gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Enregistrer la configuration
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
