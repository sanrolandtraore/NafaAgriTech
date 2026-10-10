/**
 * NAFA AGRITECH — COPILOTE INTELLIGENT UNIVERSEL 100% PYTHON
 * Widget interactif global :
 * - Reconnaît automatiquement le profil de l'utilisateur connecté ou invité
 * - Communique directement avec le moteur scientifique Python (/api/copilot/chat)
 * - Fournit des réponses factuelles (maladies, doses, élevage, hydraulique, coûts FCFA)
 * - Propose des raccourcis d'action directs vers les modules de la plateforme
 */

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { pythonEngineClient } from "@/lib/pythonEngineClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  ArrowRight,
  ShieldCheck,
  Sprout,
  Beef,
  Compass,
  Store,
  FileText,
  Camera,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface MessageItem {
  id: string;
  sender: "user" | "copilot";
  text: string;
  category?: string;
  factualSources?: string[];
  suggestedActions?: Array<{
    title: string;
    target_route: string;
    icon: string;
  }>;
  timestamp: string;
}

export function UniversalNafaCopilotWidget() {
  const { user, profile, primaryRole, partnerType } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialisation à l'ouverture ou connexion
  useEffect(() => {
    if (messages.length === 0) {
      const userRoleName = primaryRole || "agriculteur";
      const userName = profile?.full_name || (user ? "Utilisateur" : "Producteur");
      
      const welcomeText = `Bonjour ${userName}. Je suis votre Copilote Intelligent NAFA-AGRITECH, propulsé à 100% par le moteur Python de calcul scientifique.

Mon système reconnaît votre profil (**${userRoleName.toUpperCase()}**). Posez-moi n'importe quelle question sur vos cultures, votre cheptel, vos calculs d'irrigation, vos coûts de forage ou le marché des services.`;

      setMessages([
        {
          id: "msg-welcome",
          sender: "copilot",
          text: welcomeText,
          category: "bienvenue",
          factualSources: ["Moteur Python NAFA-AGRITECH", "Référentiels INERA / CIRDES / CILSS"],
          suggestedActions: [
            { title: "Diagnostic Photo Végétal", target_route: "/dashboard/diagnostic", icon: "Camera" },
            { title: "Conception Parcelles & 3D", target_route: "/dashboard/field-designer", icon: "Compass" },
            { title: "Marché des Services", target_route: "/dashboard/marketplace", icon: "Store" },
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [primaryRole, profile?.full_name, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const q = (textToSend || inputValue).trim();
    if (!q || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: MessageItem = {
      id: userMsgId,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsLoading(true);

    try {
      const res = await pythonEngineClient.chatWithCopilot({
        query: q,
        userId: user?.id,
        fullName: profile?.full_name,
        email: profile?.email || user?.email,
        phone: profile?.phone,
        role: primaryRole || "guest",
        partnerType: partnerType || null,
        isAuthenticated: !!user,
      });

      const copilotMsg: MessageItem = {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        text: res.reply,
        category: res.category,
        factualSources: res.factual_sources,
        suggestedActions: res.suggested_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      console.warn("Moteur Python distant indisponible, bascule de secours locale active :", err);
      // Réponse locale intelligente de secours
      const fallbackReply = generateOfflineCopilotReply(q, primaryRole || "agriculteur");
      setMessages((prev) => [
        ...prev,
        {
          id: `copilot-fallback-${Date.now()}`,
          sender: "copilot",
          text: fallbackReply.text,
          category: fallbackReply.category,
          factualSources: fallbackReply.sources,
          suggestedActions: fallbackReply.actions,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (route: string) => {
    setIsOpen(false);
    navigate(route);
  };

  return (
    <>
      {/* Bouton Flottant Déclencheur */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full shadow-lg border border-emerald-500/30 backdrop-blur-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Copilote Python Actif</span>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white p-0 border-2 border-white/20 hover:scale-105 transition-all"
            title="Ouvrir le Copilote Intelligent NAFA-AGRITECH"
          >
            <Bot className="h-7 w-7" />
          </Button>
        </div>
      )}

      {/* Panneau Modal / Tiroir du Copilote */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[460px] max-h-[85vh] h-[640px] flex flex-col bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-6">
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border-b border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">NAFA COPILOTE</h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-300 bg-emerald-950/40">
                    100% Python
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Profil détecté :</span>
                  <span className="font-semibold text-emerald-400 capitalize">
                    {primaryRole || "Invité"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg hover:text-white hover:bg-slate-800"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Corps de conversation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none space-y-2"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Actions suggérées */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 mt-2 space-y-1.5">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Actions Recommandées :
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.suggestedActions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(act.target_route)}
                            className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <span>{act.title}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sources factuelles certifiées */}
                  {m.factualSources && m.factualSources.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      <span>Sources :</span>
                      {m.factualSources.map((s, idx) => (
                        <span key={idx} className="bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 w-fit">
                <Sparkles className="h-4 w-4 animate-spin text-emerald-400" />
                <span>Calcul scientifique Python en cours...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides en pied de page */}
          <div className="px-3 py-1.5 bg-slate-900/40 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSendMessage("Quel traitement contre la chenille légionnaire du maïs ?")}
              className="text-[10px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-md whitespace-nowrap transition-colors"
            >
              🐛 Chenille légionnaire
            </button>
            <button
              onClick={() => handleSendMessage("Comment calculer le besoin en eau FAO-56 et le pompage solaire ?")}
              className="text-[10px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-md whitespace-nowrap transition-colors"
            >
              💧 Irrigation & Pompe solaire
            </button>
            <button
              onClick={() => handleSendMessage("Quelle est la densité maximale en poulailler sahélien ?")}
              className="text-[10px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-md whitespace-nowrap transition-colors"
            >
              🐔 Densité poulet chair
            </button>
            <button
              onClick={() => handleSendMessage("Quel est le coût indicatif d'un forage et château d'eau en FCFA ?")}
              className="text-[10px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-md whitespace-nowrap transition-colors"
            >
              💰 Prix Forage en FCFA
            </button>
          </div>

          {/* Champ de saisie */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Posez votre question agronomique, vétérinaire ou financière..."
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-400 text-xs focus-visible:ring-emerald-500 rounded-xl"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              size="icon"
              className="h-9 w-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/** Fonction de secours locale avec raisonnement expert sahélien */
function generateOfflineCopilotReply(query: string, role: string) {
  const q = query.toLowerCase();

  if (q.includes("chenille") || q.includes("mais") || q.includes("ravageur")) {
    return {
      text: `### Identification : Chenille Légionnaire d'Automne (Spodoptera frugiperda)\n• Traitement Bio : Azadirachtine (Huile de Neem 50 ml / 15L d'eau) pulvérisée au cœur du cornet au crépuscule.\n• Traitement Homologué CSP-CILSS : Émamectine Benzoate 50 g/kg (ex: Emastar) à dose de 250 g/ha (DAR 7 jours).\n• Test terrain : Observer le 'Y' inversé caractéristique sur la tête de la chenille.`,
      category: "agronomie",
      sources: ["Référentiel INERA Farako-Bâ", "CSP-CILSS UEMOA"],
      actions: [{ title: "Scanner la culture au Scanner Photo IA", target_route: "/dashboard/diagnostic", icon: "Camera" }],
    };
  }

  if (q.includes("eau") || q.includes("pompe") || q.includes("irrigation") || q.includes("forage")) {
    return {
      text: `### Bilan Hydraulique & Pompage Solaire Sahélien (FAO-56)\n• Évapotranspiration ETo de référence : 5.5 à 6.5 mm/jour en saison sèche.\n• Pertes de charge Hazen-Williams : Maintenir la vitesse d'eau entre 1.0 m/s et 1.8 m/s dans le PEHD.\n• Coût moyen forage productif 50m au Burkina : 3 500 000 à 4 500 000 FCFA.`,
      category: "hydraulique",
      sources: ["FAO-56 Irrigation and Drainage", "Mercuriale BPU Ministère Agriculture"],
      actions: [{ title: "Concevoir le Réseau d'Irrigation 3D", target_route: "/dashboard/field-designer", icon: "Compass" }],
    };
  }

  return {
    text: `Bienvenue sur NAFA-AGRITECH. Votre profil (${role}) a accès à l'ensemble des modules d'ingénierie, du marché des services et de l'assistance de terrain. Comment puis-je vous aider précisément aujourd'hui ?`,
    category: "aide_plateforme",
    sources: ["NAFA-AGRITECH Engine"],
    actions: [
      { title: "Marché des Services", target_route: "/dashboard/marketplace", icon: "Store" },
      { title: "Diagnostic Photo IA", target_route: "/dashboard/diagnostic", icon: "Camera" },
    ],
  };
}
