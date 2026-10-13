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
  Flame,
  Move,
} from "lucide-react";
import { toast } from "sonner";
import agronomistImg from "@/assets/gallery/agronomist-tablet.jpg";

interface MessageItem {
  id: string;
  sender: "user" | "copilot";
  text: string;
  category?: string;
  suggestedActions?: Array<{
    title: string;
    target_route: string;
    icon: string;
  }>;
  timestamp: string;
}

/**
 * Extrait proprement le prénom de l'utilisateur pour une salutation courtoise et personnalisée.
 * Retire les titres honorifiques (Dr., Ing., Prof., M., Mme, etc.).
 */
export function extractFirstName(fullName?: string | null): string {
  if (!fullName) return "";
  let clean = fullName.trim();
  const honorificsRegex = /^(dr\.?|ing\.?|prof\.?|pr\.?|m\.?|mme\.?|mlle\.?|monsieur|madame|mademoiselle|maître|me\.?)\s+/i;
  while (honorificsRegex.test(clean)) {
    clean = clean.replace(honorificsRegex, "").trim();
  }
  if (!clean) return "";

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";

  const first = parts[0];
  return first
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join("-");
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

  const firstName = extractFirstName(profile?.full_name);

  // Position flottante libre (permet à l'icône de bouger partout sur l'écran avec sauvegarde et repositionnement adaptatif)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem("nafa_copilot_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          const clampedX = Math.max(12, Math.min((typeof window !== "undefined" ? window.innerWidth : 1024) - 76, parsed.x));
          const clampedY = Math.max(12, Math.min((typeof window !== "undefined" ? window.innerHeight : 768) - 100, parsed.y));
          return { x: clampedX, y: clampedY };
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // Réajuster la position lors d'un redimensionnement de l'écran pour éviter que l'icône sorte du viewport
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => {
        if (!prev) return null;
        const clampedX = Math.max(12, Math.min(window.innerWidth - 76, prev.x));
        const clampedY = Math.max(12, Math.min(window.innerHeight - 100, prev.y));
        return { x: clampedX, y: clampedY };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number }>({
    clientX: 0,
    clientY: 0,
    startX: 0,
    startY: 0,
  });
  const movedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    isDraggingRef.current = true;
    movedRef.current = false;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: rect.left,
      startY: rect.top,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignorer si la capture du pointeur n'est pas supportée
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      movedRef.current = true;
    }

    if (movedRef.current) {
      const newX = Math.max(12, Math.min(window.innerWidth - 76, dragStartRef.current.startX + deltaX));
      const newY = Math.max(12, Math.min(window.innerHeight - 100, dragStartRef.current.startY + deltaY));
      setPos({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignorer si la capture du pointeur n'est plus active
    }

    if (movedRef.current) {
      setPos((current) => {
        if (current) {
          try {
            localStorage.setItem("nafa_copilot_pos", JSON.stringify(current));
          } catch {
            // Ignorer si localStorage inaccessible
          }
        }
        return current;
      });
    } else {
      // C'était un simple clic sans déplacement : ouvrir l'assistant
      setIsOpen(true);
    }
  };

  // Initialisation à l'ouverture ou connexion avec salutation par prénom et assistance ultra-personnalisée
  useEffect(() => {
    if (messages.length === 0) {
      const isAuth = !!user;
      const userRole = primaryRole || (isAuth ? "agriculteur" : "visiteur");
      const currentFirstName = extractFirstName(profile?.full_name);

      let welcomeText = "";
      let suggestedActions = [
        { title: "Diagnostic Photo Végétal", target_route: isAuth ? "/dashboard/diagnostic" : "/diagnostic", icon: "Camera" },
        { title: "Explorer la Plateforme", target_route: "/explorer", icon: "Compass" },
        { title: "Marché & Intrants", target_route: "/marketplace", icon: "Store" },
      ];

      if (userRole === "agriculteur") {
        welcomeText = currentFirstName
          ? `Bonjour ${currentFirstName} ! Je suis Nafa assistant, à vos côtés sur votre exploitation. Que souhaitez-vous vérifier aujourd'hui sur vos cultures, vos besoins en fertilisants ou la météo de vos parcelles ?`
          : `Bonjour ! Je suis Nafa assistant, ravi de vous accompagner. Que souhaitez-vous vérifier aujourd'hui sur vos cultures, vos fertilisants ou vos parcelles ?`;
        suggestedActions = [
          { title: "Scanner une Plante Malade", target_route: isAuth ? "/dashboard/diagnostic" : "/diagnostic", icon: "Camera" },
          { title: "Marché des Intrants & Travaux", target_route: isAuth ? "/dashboard/marketplace" : "/marketplace", icon: "Store" },
          { title: "Planification des Cultures", target_route: isAuth ? "/dashboard/crop-planning" : "/explorer", icon: "Sprout" },
        ];
      } else if (userRole === "eleveur") {
        welcomeText = currentFirstName
          ? `Bonjour ${currentFirstName} ! Je suis Nafa assistant. Votre suivi de cheptel et de zootechnie est actif. Avez-vous une question sur la conduite de votre élevage, l'optimisation des rations ou la santé de vos animaux ?`
          : `Bonjour ! Je suis Nafa assistant. Votre espace d'élevage et de zootechnie est actif. Avez-vous une question sur la conduite de votre cheptel, l'alimentation ou la santé animale ?`;
        suggestedActions = [
          { title: "Mon Cheptel & Animaux", target_route: isAuth ? "/dashboard/animals" : "/explorer", icon: "Beef" },
          { title: "Comptage & Densité Bâtiment", target_route: isAuth ? "/dashboard/animal-counting" : "/explorer", icon: "Camera" },
          { title: "Réserver un Vétérinaire", target_route: isAuth ? "/dashboard/livestock-services" : "/marketplace", icon: "ShieldCheck" },
        ];
      } else if (userRole === "agronome") {
        welcomeText = currentFirstName
          ? `Bonjour ${currentFirstName} ! Je suis Nafa assistant. Vos outils d'ingénierie agronomique, arpentage GPS métrique et conception 3D sont prêts. Quel projet de terrain étudiez-vous aujourd'hui ?`
          : `Bonjour Confrère ! Je suis Nafa assistant. Vos outils d'ingénierie agronomique, arpentage GPS métrique et conception 3D sont prêts. Quel projet étudiez-vous ?`;
        suggestedActions = [
          { title: "Studio CAO & Parcelles 3D", target_route: isAuth ? "/dashboard/field-designer" : "/explorer", icon: "Compass" },
          { title: "Bibliothèque Phytosanitaire", target_route: isAuth ? "/dashboard/crop-library" : "/fiches-techniques", icon: "Sprout" },
          { title: "Calculateur Hydraulique FAO-56", target_route: isAuth ? "/dashboard/expert-calculator" : "/explorer", icon: "Layers" },
        ];
      } else if (userRole === "veterinaire") {
        welcomeText = currentFirstName
          ? `Bonjour Dr. ${currentFirstName} ! Je suis Nafa assistant. Vos dossiers de soins, suivi épidémiologique et ordonnances sont synchronisés. Que souhaitez-vous consulter pour vos éleveurs ?`
          : `Bonjour Docteur ! Je suis Nafa assistant. Vos dossiers de soins, suivi épidémiologique et ordonnances sont synchronisés. Que souhaitez-vous consulter ?`;
        suggestedActions = [
          { title: "Interventions & Soins", target_route: isAuth ? "/dashboard/interventions" : "/explorer", icon: "ShieldCheck" },
          { title: "Audit Zootechnique Cheptel", target_route: isAuth ? "/dashboard/animal-counting" : "/explorer", icon: "Camera" },
          { title: "Demandes Éleveurs", target_route: isAuth ? "/dashboard/quote-requests" : "/explorer", icon: "FileText" },
        ];
      } else if (userRole === "fournisseur") {
        welcomeText = currentFirstName
          ? `Bonjour ${currentFirstName} ! Je suis Nafa assistant. Vos catalogues de produits, stocks d'intrants et demandes de devis sont à jour. Souhaitez-vous gérer une offre ou répondre à un client ?`
          : `Bonjour ! Je suis Nafa assistant. Vos catalogues, stocks de matériel et demandes de devis sont à jour. Souhaitez-vous gérer une offre ou répondre à un client ?`;
        suggestedActions = [
          { title: "Mes Offres & Catalogue", target_route: isAuth ? "/dashboard/partenaire-mes-offres" : "/marketplace", icon: "Store" },
          { title: "Demandes de Devis", target_route: isAuth ? "/dashboard/quote-requests" : "/explorer", icon: "FileText" },
        ];
      } else if (userRole === "institution_agri") {
        welcomeText = currentFirstName
          ? `Bonjour ${currentFirstName} ! Je suis Nafa assistant. Vos dossiers de financement agricole et vos produits d'assurance indicielle sont prêts pour instruction. Que souhaitez-vous analyser ?`
          : `Bonjour ! Je suis Nafa assistant. Vos dossiers de financement agricole et produits d'assurance sont prêts pour instruction.`;
        suggestedActions = [
          { title: "Dossiers de Financement", target_route: isAuth ? "/dashboard/partenaire-demandes" : "/explorer", icon: "FileText" },
          { title: "Assurance Agricole", target_route: isAuth ? "/dashboard/partenaire-assurance" : "/solutions", icon: "ShieldCheck" },
        ];
      } else {
        welcomeText = currentFirstName
          ? `Bonjour ${currentFirstName} ! Je suis Nafa assistant, votre conseiller agricole et technique intelligent. Comment puis-je vous aider dans vos activités aujourd'hui ?`
          : `Bonjour et bienvenue sur NAFA ! Je suis Nafa assistant, votre conseiller agricole et technique intelligent. Comment puis-je vous aider dans vos activités aujourd'hui ?`;
      }

      setMessages([
        {
          id: "msg-welcome",
          sender: "copilot",
          text: welcomeText,
          category: "bienvenue",
          suggestedActions,
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

      // Adapter les routes selon que l'utilisateur est authentifié ou visiteur
      const adaptedActions = res.suggested_actions?.map((act) => {
        let route = act.target_route;
        if (!user && route.startsWith("/dashboard/")) {
          if (route.includes("diagnostic")) route = "/diagnostic";
          else if (route.includes("marketplace")) route = "/marketplace";
          else if (route.includes("crop-library")) route = "/fiches-techniques";
          else route = "/explorer";
        }
        return { ...act, target_route: route };
      });

      const copilotMsg: MessageItem = {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        text: res.reply,
        category: res.category,
        suggestedActions: adaptedActions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      console.warn("Moteur distant indisponible, bascule de secours locale active :", err);
      // Réponse locale intelligente de secours
      const fallbackReply = generateOfflineCopilotReply(q, primaryRole || "agriculteur", !!user, firstName);
      setMessages((prev) => [
        ...prev,
        {
          id: `copilot-fallback-${Date.now()}`,
          sender: "copilot",
          text: fallbackReply.text,
          category: fallbackReply.category,
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
    // Si la route est sous /dashboard et l'utilisateur n'est pas connecté, aller vers /diagnostic ou rediriger vers connexion
    if (!user && route.startsWith("/dashboard/")) {
      if (route.includes("diagnostic")) {
        navigate("/diagnostic");
        return;
      }
      if (route.includes("marketplace")) {
        navigate("/marketplace");
        return;
      }
      navigate(`/connexion?redirect=${encodeURIComponent(route)}`);
      return;
    }
    navigate(route);
  };

  // Suggestions rapides contextualisées selon le profil et les besoins spécifiques de l'utilisateur
  const quickPromptsByRole: Record<string, Array<{ label: string; query: string }>> = {
    agriculteur: [
      { label: "🐛 Chenille légionnaire & ravageurs", query: "Quel traitement contre la chenille légionnaire du maïs ?" },
      { label: "🧪 Calcul engrais NPK & Urée", query: "Quelle quantité d'engrais NPK et Urée pour 1 hectare de maïs ?" },
      { label: "💧 Irrigation & Pompe solaire", query: "Comment calculer le besoin en eau FAO-56 et le pompage solaire ?" },
      { label: "💰 Prix Forage en FCFA", query: "Quel est le coût indicatif d'un forage et château d'eau en FCFA ?" },
    ],
    eleveur: [
      { label: "🐔 Densité & ventilation bâtiment", query: "Quelle est la densité maximale en poulailler sahélien ?" },
      { label: "💉 Calendrier vaccinal & soins", query: "Quel est le calendrier de vaccination PPR pour ovins et Newcastle pour volailles ?" },
      { label: "🌾 Ration alimentaire bétail", query: "Comment composer une ration équilibrée pour bovins à moindre coût ?" },
      { label: "🌡️ Risque stress thermique THI", query: "Comment prévenir le stress thermique quand le THI dépasse 78 ?" },
    ],
    agronome: [
      { label: "📐 Calcul hydraulique FAO-56 & HMT", query: "Comment dimensionner les pertes de charge Hazen-Williams et la HMT d'une pompe ?" },
      { label: "🗺️ Arpentage GPS & Studio 3D", query: "Comment exporter ma parcelle arpentée en DXF ou Wavefront OBJ 3D ?" },
      { label: "🔬 Clés phytosanitaires INERA", query: "Quelles sont les clés de diagnostic INERA pour la tomate et l'oignon ?" },
      { label: "💰 Devis quantitatif DQE", query: "Comment chiffrer un devis d'aménagement hydraulique d'un hectare ?" },
    ],
    veterinaire: [
      { label: "🩺 Diagnostic épizooties", query: "Quels sont les biomarqueurs différentiels pour la PPR et la maladie de Newcastle ?" },
      { label: "⚠️ Délais d'attente (DAR)", query: "Quels sont les délais d'attente DAR lait et viande pour les antibiotiques usuels ?" },
      { label: "💉 Protocoles de prophylaxie", query: "Quel protocole vaccinal officiel recommander pour un cheptel caprin au Sahel ?" },
      { label: "📋 Devis d'intervention", query: "Comment éditer un compte-rendu d'intervention et un devis conforme à l'Ordre ?" },
    ],
    fournisseur: [
      { label: "📦 Actualiser mes stocks & prix", query: "Comment mettre à jour mon catalogue d'engrais et semences certifiées ?" },
      { label: "📄 Répondre aux devis", query: "Comment émettre une facture proforma certifiée pour un groupement de producteurs ?" },
      { label: "🌾 Produits homologués CILSS", query: "Quels produits phytosanitaires sont strictement homologués par le CSP-CILSS ?" },
      { label: "🚚 Suivi des commandes clients", query: "Comment organiser le suivi des commandes d'intrants expédiées ?" },
    ],
    institution_agri: [
      { label: "🏦 Analyser dossier de crédit", query: "Quels sont les critères de rentabilité et de trésorerie pour financer un forage ?" },
      { label: "🛡️ Risque assurance climat", query: "Comment fonctionne l'assurance indicielle sécheresse par données satellitaires ?" },
      { label: "📑 Conformité foncière & KYC", query: "Quels documents fonciers (APFR, bail rural) exiger pour un prêt agricole ?" },
      { label: "📊 Ratios de rentabilité agricole", query: "Quels sont les ratios de marge brute standard pour les céréales et maraîchage ?" },
    ],
  };

  const activePrompts = quickPromptsByRole[primaryRole || ""] || [
    { label: "🐛 Chenille légionnaire", query: "Quel traitement contre la chenille légionnaire du maïs ?" },
    { label: "💧 Irrigation & Pompe solaire", query: "Comment calculer le besoin en eau FAO-56 et le pompage solaire ?" },
    { label: "🐔 Élevage & cheptel", query: "Quelle est la densité maximale en poulailler sahélien ?" },
    { label: "💰 Prix Forage en FCFA", query: "Quel est le coût indicatif d'un forage et château d'eau en FCFA ?" },
  ];

  return (
    <>
      {/* Bouton Flottant Déclencheur avec Vraie Image & Bougie d'Allumage Déplaçable */}
      {!isOpen && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={
            pos
              ? { left: `${pos.x}px`, top: `${pos.y}px` }
              : { right: "20px", bottom: "80px" }
          }
          className="fixed z-50 flex items-center gap-2.5 cursor-grab active:cursor-grabbing select-none group touch-none"
          title="Nafa assistant (Glissez pour déplacer l'icône sur l'écran • Cliquez pour ouvrir)"
        >
          {/* Badge indicatif textuel au survol ou visible */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-xl border border-emerald-500/40 backdrop-blur-md">
            <Move className="h-3 w-3 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            <span>Nafa assistant</span>
            <span className="flex items-center gap-0.5 text-amber-400 text-[10px]">
              <Flame className="h-3 w-3 fill-amber-400 animate-pulse" />
              <span>En ligne</span>
            </span>
          </div>

          {/* Bouton Avatar avec Vraie Image Réaliste et Bougie d'Allumage */}
          <div className="relative">
            <div className="h-14 w-14 rounded-full p-0.5 bg-gradient-to-tr from-emerald-600 via-amber-400 to-emerald-500 shadow-2xl hover:scale-105 active:scale-95 transition-transform overflow-visible ring-2 ring-emerald-500/30">
              <div className="h-full w-full rounded-full overflow-hidden border-2 border-slate-950 bg-slate-900 relative">
                <img
                  src={agronomistImg}
                  alt="Nafa assistant - Expert Terrain Réel"
                  className="h-full w-full object-cover object-center pointer-events-none"
                />
              </div>
            </div>

            {/* Voyant / Bougie d'Allumage Active (Témoin lumineux chaud et pulsant) */}
            <div
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border-2 border-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/50"
              title="Nafa assistant opérationnel en direct"
            >
              <Flame className="h-3.5 w-3.5 text-white fill-amber-200 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Panneau Modal / Tiroir de Nafa assistant */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[460px] max-h-[85vh] h-[640px] flex flex-col bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-6">
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border-b border-emerald-500/20">
            <div className="flex items-center gap-3">
              {/* Avatar avec vraie image et voyant d'activité */}
              <div className="relative">
                <div className="h-10 w-10 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-amber-400 shadow-md">
                  <div className="h-full w-full rounded-full overflow-hidden border border-slate-900">
                    <img
                      src={agronomistImg}
                      alt="Nafa assistant"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-500 border border-slate-900 flex items-center justify-center shadow-xs">
                  <Flame className="h-2.5 w-2.5 text-white fill-amber-200 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">Nafa assistant</h3>
                  <Badge variant="outline" className="text-[9px] font-extrabold bg-amber-500/15 text-amber-300 border-amber-500/40 px-1.5 py-0 flex items-center gap-1">
                    <Flame className="h-2.5 w-2.5 fill-amber-300" />
                    <span>Actif</span>
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">
                  {firstName ? (
                    <span className="text-emerald-400 font-medium">Bonjour {firstName} !</span>
                  ) : (
                    <span>Assistance Agricole Personnalisée</span>
                  )}
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
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 w-fit">
                <Sparkles className="h-4 w-4 animate-spin text-emerald-400" />
                <span>Nafa assistant analyse vos données...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides adaptées aux besoins du rôle */}
          <div className="px-3 py-1.5 bg-slate-900/40 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {activePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.query)}
                className="text-[10px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-md whitespace-nowrap transition-colors"
              >
                {p.label}
              </button>
            ))}
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

/** Fonction de secours locale avec raisonnement expert sahélien et salutation personnalisée */
function generateOfflineCopilotReply(query: string, role: string, isAuth: boolean = false, firstName?: string) {
  const q = query.toLowerCase();

  const diagRoute = isAuth ? "/dashboard/diagnostic" : "/diagnostic";
  const marketRoute = isAuth ? "/dashboard/marketplace" : "/marketplace";
  const designerRoute = isAuth ? "/dashboard/field-designer" : "/explorer";
  const salutation = firstName ? `Bonjour ${firstName} ! ` : "Bonjour ! ";

  if (q.includes("chenille") || q.includes("mais") || q.includes("ravageur")) {
    return {
      text: `${salutation}Voici les recommandations de Nafa assistant :\n\n### Identification : Chenille Légionnaire d'Automne (Spodoptera frugiperda)\n• Traitement Bio : Azadirachtine (Huile de Neem 50 ml / 15L d'eau) pulvérisée au cœur du cornet au crépuscule.\n• Traitement Homologué CSP-CILSS : Émamectine Benzoate 50 g/kg (ex: Emastar) à dose de 250 g/ha (DAR 7 jours).\n• Test terrain : Observer le 'Y' inversé caractéristique sur la tête de la chenille.`,
      category: "agronomie",
      actions: [{ title: "Scanner la culture", target_route: diagRoute, icon: "Camera" }],
    };
  }

  if (q.includes("eau") || q.includes("pompe") || q.includes("irrigation") || q.includes("forage")) {
    return {
      text: `${salutation}Voici l'analyse hydraulique de Nafa assistant :\n\n### Bilan Hydraulique & Pompage Solaire Sahélien\n• Évapotranspiration ETo de référence : 5.5 à 6.5 mm/jour en saison sèche.\n• Pertes de charge Hazen-Williams : Maintenir la vitesse d'eau entre 1.0 m/s et 1.8 m/s dans le PEHD.\n• Coût moyen forage productif 50m au Burkina : 3 500 000 à 4 500 000 FCFA.`,
      category: "hydraulique",
      actions: [{ title: "Concevoir le Réseau d'Irrigation 3D", target_route: designerRoute, icon: "Compass" }],
    };
  }

  return {
    text: `${salutation}Je suis Nafa assistant, à vos côtés en mode local. Comment puis-je vous aider dans vos activités aujourd'hui ?`,
    category: "aide_plateforme",
    actions: [
      { title: "Marché des Services", target_route: marketRoute, icon: "Store" },
      { title: "Diagnostic Végétal", target_route: diagRoute, icon: "Camera" },
    ],
  };
}
