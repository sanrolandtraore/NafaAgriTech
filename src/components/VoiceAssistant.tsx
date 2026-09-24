import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Mic, MicOff, X, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VoiceResult = {
  intent: string;
  response_message: string;
  service_data?: {
    service_type?: string;
    description?: string;
    location?: string;
    preferred_date?: string;
    phone?: string;
  };
  equipment_data?: {
    equipment_type?: string;
    search_query?: string;
    start_date?: string;
    end_date?: string;
    location?: string;
  };
  navigation?: string;
};

type VoiceAssistantProps = {
  onServiceRequest?: (data: VoiceResult["service_data"]) => void;
  onEquipmentSearch?: (data: VoiceResult["equipment_data"]) => void;
};

const NAVIGATION_MAP: Record<string, string> = {
  services: "/dashboard/services",
  equipment: "/dashboard/equipment",
  dashboard: "/dashboard",
  farms: "/dashboard/farms",
  parcels: "/dashboard/parcels",
  animals: "/dashboard/livestock",
  genius: "/dashboard/genius",
};

const VoiceAssistant = ({ onServiceRequest, onEquipmentSearch }: VoiceAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsProcessing(true);

    try {
      const currentPage = location.pathname.split("/").pop() || "dashboard";
      const { data, error } = await supabase.functions.invoke("voice-assistant", {
        body: { transcript: text, context: currentPage },
      });

      if (error) throw error;
      const result = data as VoiceResult;

      setMessages((prev) => [...prev, { role: "assistant", text: result.response_message }]);
      speak(result.response_message);

      // Handle navigation
      if (result.navigation && result.navigation !== "none" && NAVIGATION_MAP[result.navigation]) {
        setTimeout(() => navigate(NAVIGATION_MAP[result.navigation!]), 1500);
      }

      // Handle service request auto-fill
      if (result.intent === "service_request" && result.service_data) {
        if (onServiceRequest) {
          onServiceRequest(result.service_data);
        } else if (!location.pathname.includes("services")) {
          setTimeout(() => navigate("/dashboard/services", { state: { voiceData: result.service_data } }), 2000);
        }
      }

      // Handle equipment search
      if (result.intent === "equipment_rental" && result.equipment_data) {
        if (onEquipmentSearch) {
          onEquipmentSearch(result.equipment_data);
        }
      }
    } catch (e) {
      console.error("Voice processing error:", e);
      const errorMsg = "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.";
      setMessages((prev) => [...prev, { role: "assistant", text: errorMsg }]);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [location.pathname, navigate, onServiceRequest, onEquipmentSearch, speak]);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
      if (finalTranscript) {
        processTranscript(finalTranscript);
        setTranscript("");
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        toast.error("Veuillez autoriser l'accès au microphone.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (messages.length === 0) {
      const welcome = "Bonjour ! Je suis votre assistant vocal NAFA - AGRITECH. Dites-moi ce dont vous avez besoin. Par exemple: «Je veux louer un tracteur» ou «J'ai besoin d'un diagnostic de sol».";
      setMessages([{ role: "assistant", text: welcome }]);
      speak(welcome);
    }
  }, [messages.length, speak]);

  const handleClose = useCallback(() => {
    stopListening();
    stopSpeaking();
    setIsOpen(false);
  }, [stopListening, stopSpeaking]);

  return (
    <>
      {/* Floating WhatsApp-style button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse"
          aria-label="Assistant vocal"
        >
          <Mic className="h-6 w-6" />
        </button>
      )}

      {/* Voice assistant panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[340px] max-h-[500px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Mic className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Assistant Vocal</p>
                <p className="text-xs text-primary-foreground/70">
                  {isListening ? "Écoute en cours..." : isProcessing ? "Traitement..." : isSpeaking ? "Synthèse vocale..." : "Prêt"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[320px]">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}

            {transcript && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-primary/60 text-primary-foreground rounded-br-sm italic">
                  {transcript}...
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3 py-2 bg-muted rounded-bl-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="border-t border-border p-3 flex items-center justify-center gap-3">
            {isSpeaking && (
              <Button variant="outline" size="icon" onClick={stopSpeaking} className="h-10 w-10 rounded-full">
                <Volume2 className="h-4 w-4" />
              </Button>
            )}

            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center transition-all duration-200",
                isListening
                  ? "bg-destructive text-destructive-foreground scale-110 animate-pulse shadow-lg"
                  : "bg-primary text-primary-foreground hover:scale-105 shadow-md",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
              aria-label={isListening ? "Arrêter" : "Parler"}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

            {isListening && (
              <div className="flex gap-1 items-center">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-destructive rounded-full animate-pulse"
                    style={{
                      height: `${12 + Math.random() * 16}px`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Helper text */}
          <p className="text-center text-[10px] text-muted-foreground pb-2 px-3">
            Appuyez sur le micro et parlez en français
          </p>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;
