import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic, Square, Play, Pause, Trash2, Send, Phone, MessageCircle,
  Volume2, VolumeX, CheckCheck, RefreshCw, Sparkles, Tractor,
  ShoppingBag, MapPin, CheckCircle2, ChevronRight, X, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import {
  NAFA_VOICE_LANGUAGES,
  NafaVoiceLanguage,
  analyzeVoiceQuery,
  NafaVoiceAnalysisResult,
  playVoiceSpeech,
  playNativeSahelianSpeech,
  SAHELIAN_VOICE_CONFIGS,
} from "@/lib/nafaVocaleEngine";
import { PublicMarketItem } from "@/pages/dashboard/ServiceMarketplacePage";

interface VoiceMessage {
  id: string;
  sender: "user" | "assistant";
  audioUrl?: string;
  durationSeconds: number;
  timeString: string;
  transcriptText: string;
  language: NafaVoiceLanguage;
  analysis?: NafaVoiceAnalysisResult;
  matchedItems?: PublicMarketItem[];
}

interface NafaVocaleAssistantProps {
  catalogItems: PublicMarketItem[];
  onApplyFilter?: (params: { category?: string; city?: string; search?: string }) => void;
  className?: string;
}

export default function NafaVocaleAssistant({
  catalogItems = [],
  onApplyFilter,
  className = "",
}: NafaVocaleAssistantProps) {
  const [selectedLang, setSelectedLang] = useState<NafaVoiceLanguage>("fr");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [tempAudioUrl, setTempAudioUrl] = useState<string | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);
  const recognizedTextRef = useRef<string>("");
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const playbackHandleRef = useRef<{ stop: () => void } | null>(null);

  // Historique des messages vocaux de la session
  const [messages, setMessages] = useState<VoiceMessage[]>(() => {
    const langInfo = NAFA_VOICE_LANGUAGES["fr"];
    return [
      {
        id: "msg-welcome",
        sender: "assistant",
        durationSeconds: 6,
        timeString: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        transcriptText: langInfo.welcomeVoiceText,
        language: "fr",
      },
    ];
  });

  // Quand l'utilisateur change de langue, on met à jour le message d'accueil si nécessaire
  const handleLanguageChange = (lang: NafaVoiceLanguage) => {
    if (playbackHandleRef.current) {
      playbackHandleRef.current.stop();
    }
    setCurrentlyPlayingId(null);
    setPlayProgress(0);

    setSelectedLang(lang);
    const langInfo = NAFA_VOICE_LANGUAGES[lang];
    const newWelcomeMsg: VoiceMessage = {
      id: `msg-welcome-${lang}-${Date.now()}`,
      sender: "assistant",
      durationSeconds: 5,
      timeString: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      transcriptText: langInfo.welcomeVoiceText,
      language: lang,
    };
    setMessages((prev) => [newWelcomeMsg, ...prev.filter((m) => !m.id.startsWith("msg-welcome"))]);

    playNativeSahelianSpeech({
      text: langInfo.welcomeVoiceText,
      lang,
      playChime: true,
      onStart: () => setCurrentlyPlayingId(newWelcomeMsg.id),
      onProgress: (pct) => setPlayProgress(pct),
      onEnd: () => {
        setCurrentlyPlayingId(null);
        setPlayProgress(0);
      },
    }).then((handle) => {
      playbackHandleRef.current = handle;
    });

    toast.success(`Langue vocale : ${langInfo.nativeName}`);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if (playbackHandleRef.current) {
        playbackHandleRef.current.stop();
      }
    };
  }, []);

  // Démarre l'enregistrement audio
  const startRecording = async () => {
    try {
      recognizedTextRef.current = "";

      // Tentative de reconnaissance vocale Web Speech API en parallèle
      if (typeof window !== "undefined") {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          try {
            const recog = new SpeechRecognition();
            recog.lang = selectedLang === "fr" ? "fr-FR" : "fr-BF";
            recog.continuous = true;
            recog.interimResults = true;
            recog.onresult = (event: any) => {
              let text = "";
              for (let i = 0; i < event.results.length; i++) {
                text += event.results[i][0].transcript + " ";
              }
              recognizedTextRef.current = text.trim();
            };
            recog.start();
            speechRecognitionRef.current = recog;
          } catch {
            // Ignorer si non supporté
          }
        }
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.info("Microphone non disponible. Vous pouvez utiliser les messages vocaux pré-enregistrés.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setTempAudioUrl(url);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Erreur microphone:", err);
      toast.info("Accès micro refusé. Vous pouvez appuyer sur les boutons vocaux pré-enregistrés.");
    }
  };

  // Arrête l'enregistrement audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    }
  };

  // Annule l'enregistrement en cours
  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setTempAudioUrl(null);
    setRecordingSeconds(0);
    toast.info("Message vocal annulé");
  };

  // Envoie le message vocal enregistré
  const sendRecordedVoiceMessage = (overrideText?: string) => {
    const textToAnalyze = overrideText || recognizedTextRef.current || NAFA_VOICE_LANGUAGES[selectedLang].sampleQueries[0].speechText;
    const duration = recordingSeconds > 0 ? recordingSeconds : 4;

    // Analyse sémantique par NAFA Vocale
    const analysis = analyzeVoiceQuery(textToAnalyze, selectedLang);

    // Filtrer les articles correspondants dans le catalogue actuel
    const matched = catalogItems.filter((item) => {
      let matches = false;
      if (item.category === analysis.detectedCategory) matches = true;
      if (analysis.detectedCity && item.city.toLowerCase().includes(analysis.detectedCity.toLowerCase())) {
        matches = true;
      }
      return matches;
    }).slice(0, 3);

    // Si rien ne matche strictement, fournir les meilleurs éléments de la catégorie
    const finalMatched = matched.length > 0
      ? matched
      : catalogItems.filter((i) => i.category === analysis.detectedCategory).slice(0, 3);

    const nowString = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    // 1. Message de l'agriculteur
    const userMsg: VoiceMessage = {
      id: `user-msg-${Date.now()}`,
      sender: "user",
      audioUrl: tempAudioUrl || undefined,
      durationSeconds: duration,
      timeString: nowString,
      transcriptText: textToAnalyze,
      language: selectedLang,
    };

    // 2. Réponse vocale de NAFA Vocale
    const assistantMsg: VoiceMessage = {
      id: `assistant-msg-${Date.now() + 1}`,
      sender: "assistant",
      durationSeconds: 8,
      timeString: nowString,
      transcriptText: analysis.voiceReplyText,
      language: selectedLang,
      analysis,
      matchedItems: finalMatched,
    };

    setMessages((prev) => [assistantMsg, userMsg, ...prev]);

    // Vocalise la réponse immédiatement avec la voix naturelle sahélienne
    if (playbackHandleRef.current) {
      playbackHandleRef.current.stop();
    }
    setCurrentlyPlayingId(assistantMsg.id);
    setPlayProgress(10);

    playNativeSahelianSpeech({
      text: analysis.voiceSpokenText,
      lang: selectedLang,
      playChime: true,
      onStart: () => {
        setCurrentlyPlayingId(assistantMsg.id);
      },
      onProgress: (pct) => {
        setPlayProgress(pct);
      },
      onEnd: () => {
        setCurrentlyPlayingId(null);
        setPlayProgress(0);
      },
    }).then((handle) => {
      playbackHandleRef.current = handle;
    });

    // Réinitialise l'état d'enregistrement
    setAudioBlob(null);
    setTempAudioUrl(null);
    setRecordingSeconds(0);

    toast.success("Message vocal analysé avec succès !");
  };

  // Lance un exemple vocal pré-enregistré (1 clic pour non-lecteur)
  const handleQuickVoiceSample = (sample: { speechText: string; label: string }) => {
    recognizedTextRef.current = sample.speechText;
    setRecordingSeconds(5);
    sendRecordedVoiceMessage(sample.speechText);
  };

  // Lecture / Pause d'un message vocal
  const togglePlayMessage = (msg: VoiceMessage) => {
    if (currentlyPlayingId === msg.id) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if (playbackHandleRef.current) {
        playbackHandleRef.current.stop();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setCurrentlyPlayingId(null);
      setPlayProgress(0);
      return;
    }

    if (playbackHandleRef.current) {
      playbackHandleRef.current.stop();
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    setCurrentlyPlayingId(msg.id);
    setPlayProgress(10);

    if (msg.audioUrl) {
      // Lecture du fichier audio enregistré par l'utilisateur
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio();
      }
      audioElementRef.current.src = msg.audioUrl;
      audioElementRef.current.ontimeupdate = () => {
        if (audioElementRef.current && audioElementRef.current.duration > 0) {
          const progress = (audioElementRef.current.currentTime / audioElementRef.current.duration) * 100;
          setPlayProgress(progress);
        }
      };
      audioElementRef.current.onended = () => {
        setCurrentlyPlayingId(null);
        setPlayProgress(0);
      };
      audioElementRef.current.play().catch(() => {
        setCurrentlyPlayingId(null);
      });
    } else {
      // Synthèse vocale naturelle sahélienne (Mooré, Dioula, Fulfuldé, Français)
      playNativeSahelianSpeech({
        text: msg.transcriptText,
        lang: msg.language,
        playChime: true,
        onStart: () => {
          setCurrentlyPlayingId(msg.id);
          setPlayProgress(10);
        },
        onProgress: (pct) => {
          setPlayProgress(pct);
        },
        onEnd: () => {
          setCurrentlyPlayingId(null);
          setPlayProgress(0);
        },
      }).then((handle) => {
        playbackHandleRef.current = handle;
      });
    }
  };

  const currentLangInfo = NAFA_VOICE_LANGUAGES[selectedLang];

  return (
    <Card className={`border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 via-background to-background shadow-md overflow-hidden ${className}`}>
      {/* ─── EN-TÊTE NAFA VOCALE ─── */}
      <div className="bg-emerald-600 text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
            <Mic className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-extrabold text-base sm:text-lg tracking-tight">
                NAFA Vocale — Assistance Vocale Agricole
              </h2>
              <Badge className="bg-white/20 text-white border-0 text-[10px] font-bold">
                100% Sans Écriture
              </Badge>
            </div>
            <p className="text-xs text-white/90 mt-0.5">
              Parlez en <strong>Français</strong> comme sur WhatsApp pour trouver vos besoins (matériel, semences, intrants, bétail).
            </p>
          </div>
        </div>

        {/* Badge de langue officielle : Français */}
        <div className="flex items-center gap-2 bg-black/25 px-3 py-1.5 rounded-2xl shrink-0 self-start sm:self-auto border border-white/20">
          <Volume2 className="h-4 w-4 text-amber-300" />
          <span className="text-xs font-bold text-white">Français (Burkina)</span>
        </div>
      </div>

      {/* ─── BANNIÈRE VOIX NATURELLE EN FRANÇAIS ─── */}
      <div className="bg-emerald-700/90 text-white/95 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/30">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-amber-300 shrink-0" />
          <span className="font-medium">
            <strong>Voix Naturelle :</strong> Synthèse vocale fluide en Français (Burkina Faso)
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            const langInfo = NAFA_VOICE_LANGUAGES[selectedLang];
            playNativeSahelianSpeech({
              text: langInfo.welcomeVoiceText,
              lang: selectedLang,
              playChime: true,
            });
          }}
          className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>Tester la voix</span>
        </button>
      </div>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* ─── ZONE DES EXEMPLES VOCAUX EN 1 CLIC (Idéal pour non-lecteur) ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" /> Exemples vocaux prêts à écouter ({currentLangInfo.name}) :
            </span>
            <span className="text-[11px]">Touchez pour tester immédiatement</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentLangInfo.sampleQueries.map((sample, idx) => (
              <Button
                key={idx}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickVoiceSample(sample)}
                className="h-auto py-2.5 px-3 justify-start text-left border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-xl group transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mr-2.5 group-hover:scale-110 transition-transform">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground truncate">
                    {sample.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {sample.translationFr}
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600 ml-1 shrink-0" />
              </Button>
            ))}
          </div>
        </div>

        {/* ─── FIL DE DISCUSSION STYLE WHATSAPP AUDIO ─── */}
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            const isPlaying = currentlyPlayingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-2`}
              >
                {/* Bulle vocale WhatsApp */}
                <div
                  className={`max-w-[92%] sm:max-w-[80%] rounded-2xl p-3 sm:p-3.5 shadow-xs border transition-all ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-tr-none border-emerald-500"
                      : "bg-card text-foreground rounded-tl-none border-emerald-500/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Bouton Play / Pause WhatsApp */}
                    <button
                      type="button"
                      onClick={() => togglePlayMessage(msg)}
                      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 ${
                        isUser
                          ? "bg-white text-emerald-700 hover:bg-white/90"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                      title={isPlaying ? "Mettre en pause" : "Écouter le message vocal"}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5 fill-current" />
                      ) : (
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Barres d'onde sonore WhatsApp */}
                    <div className="flex-1 min-w-[130px] space-y-1">
                      <div className="flex items-center gap-1 h-6">
                        {[40, 70, 95, 60, 45, 80, 100, 50, 75, 90, 60, 40, 85, 95, 70, 50].map((h, i) => {
                          const barProgress = (i / 16) * 100;
                          const isFilled = isPlaying && barProgress <= playProgress;
                          return (
                            <span
                              key={i}
                              style={{ height: `${h}%` }}
                              className={`w-1 rounded-full transition-all duration-200 ${
                                isUser
                                  ? isFilled ? "bg-amber-300" : "bg-white/40"
                                  : isFilled ? "bg-emerald-600" : "bg-muted-foreground/30"
                              }`}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className={isUser ? "text-white/80" : "text-muted-foreground"}>
                          {isPlaying ? `Lecture en cours...` : `0:0${msg.durationSeconds}`}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={isUser ? "text-white/80" : "text-muted-foreground"}>
                            {msg.timeString}
                          </span>
                          <CheckCheck className={`h-3.5 w-3.5 ${isUser ? "text-sky-300" : "text-sky-500"}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transcription du vocal pour accompagnateur éventuel */}
                  <div className={`mt-2 pt-2 border-t text-xs leading-relaxed ${
                    isUser ? "border-white/20 text-white/90" : "border-border/60 text-muted-foreground"
                  }`}>
                    <p className="font-medium italic">"{msg.transcriptText}"</p>
                  </div>
                </div>

                {/* ─── CARTES DES PRODUITS / SERVICES TROUVÉS PAR NAFA VOCALE ─── */}
                {!isUser && msg.matchedItems && msg.matchedItems.length > 0 && (
                  <div className="w-full max-w-[95%] sm:max-w-[85%] space-y-2 mt-1">
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="font-extrabold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Offres trouvées pour vous :
                      </span>
                      {onApplyFilter && msg.analysis && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onApplyFilter(msg.analysis!.filterParams)}
                          className="h-6 text-[11px] text-emerald-700 hover:text-emerald-800 p-0 font-bold"
                        >
                          Voir tout dans le catalogue &rarr;
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {msg.matchedItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-card border-2 border-emerald-500/30 hover:border-emerald-500 shadow-xs flex flex-col justify-between space-y-2"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[140px]">
                                {item.partner_name}
                              </span>
                              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30">
                                {item.city}
                              </Badge>
                            </div>
                            <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 mt-1">
                              {item.title}
                            </h4>
                            <div className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                              {item.price.toLocaleString("fr-FR")} FCFA <span className="text-[11px] text-muted-foreground font-normal">/ {item.price_unit}</span>
                            </div>
                          </div>

                          {/* GRANDS BOUTONS TÉLÉPHONE & WHATSAPP (CONÇUS POUR ANALPHABÈTES) */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/60">
                            <Button
                              size="sm"
                              className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-1"
                              asChild
                            >
                              <a href={`tel:${item.phone}`}>
                                <Phone className="h-3.5 w-3.5" /> Appeler
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-xl gap-1"
                              asChild
                            >
                              <a
                                href={`https://wa.me/${(item.whatsapp || item.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(
                                  `Bonjour, je vous contacte depuis NAFA Vocale concernant : ${item.title}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── BARRE D'ENREGISTREMENT VOCAL WHATSAPP ─── */}
        <div className="p-3 bg-muted/40 border border-emerald-500/30 rounded-2xl space-y-3">
          {isRecording ? (
            /* Mode enregistrement en cours */
            <div className="flex items-center justify-between gap-3 bg-red-500/10 p-3 rounded-xl border border-red-500/30 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-600 animate-ping" />
                <span className="font-mono font-bold text-sm text-red-700 dark:text-red-400">
                  0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  Enregistrement en cours en <strong>{currentLangInfo.name}</strong>...
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelRecording}
                  className="h-9 px-3 text-destructive hover:bg-destructive/10 text-xs font-bold rounded-xl"
                  title="Annuler"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={stopRecording}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-1.5 shadow-sm"
                >
                  <Square className="h-3.5 w-3.5 fill-current" /> Terminer
                </Button>
              </div>
            </div>
          ) : tempAudioUrl ? (
            /* Message enregistré prêt à l'envoi */
            <div className="flex items-center justify-between gap-3 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">Message vocal prêt à être envoyé</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Durée : {recordingSeconds}s · Langue : {currentLangInfo.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelRecording}
                  className="h-9 px-2 text-destructive hover:bg-destructive/10 rounded-xl"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => sendRecordedVoiceMessage()}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-1.5 shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" /> Envoyer à NAFA Vocale
                </Button>
              </div>
            </div>
          ) : (
            /* Bouton Micro WhatsApp Prêt */
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Envoyer un message vocal en {currentLangInfo.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Appuyez sur le micro vert et expliquez votre besoin à voix haute.
                  </p>
                </div>
              </div>

              <Button
                onClick={startRecording}
                className="h-12 w-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                title="Enregistrer un message vocal"
              >
                <Mic className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
