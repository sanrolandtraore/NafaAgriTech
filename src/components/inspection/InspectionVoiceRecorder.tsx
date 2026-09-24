import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Play, Trash2, Volume2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface InspectionVoiceRecorderProps {
  initialTranscription?: string | null;
  onSaveTranscription: (text: string) => void;
  onVoiceRecorded?: (hasAudio: boolean) => void;
}

export default function InspectionVoiceRecorder({
  initialTranscription,
  onSaveTranscription,
  onVoiceRecorded,
}: InspectionVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState(initialTranscription || "");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.info("Microphone non accessible sur ce navigateur. Vous pouvez saisir vos notes dictées ci-dessous.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onVoiceRecorded?.(true);

        // Simulation de transcription agronomique automatique locale si vide
        if (!transcription.trim()) {
          const autoText = "Note vocale de terrain enregistrée : Relevé d'inspection effectué selon protocole NAFA Genius IA.";
          setTranscription(autoText);
          onSaveTranscription(autoText);
        }
        toast.success("Enregistrement vocal terminé !");
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Erreur d'accès au micro :", err);
      toast.info("Accès micro refusé ou indisponible. Saisissez votre note vocale par écrit ci-dessous.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    onVoiceRecorded?.(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3 p-3.5 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Mic className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Notes Vocales de Terrain</span>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            MediaRecorder
          </Badge>
        </div>

        {isRecording ? (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold text-rose-600 font-mono">{formatTime(recordingTime)}</span>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={stopRecording}
              className="h-7 text-xs px-2.5"
            >
              <Square className="h-3 w-3 mr-1" />
              Arrêter
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={startRecording}
            className="h-7 text-xs px-2.5 border-primary/40 hover:bg-primary/5 text-primary"
          >
            <Mic className="h-3.5 w-3.5 mr-1" />
            Enregistrer note vocale
          </Button>
        )}
      </div>

      {audioUrl && (
        <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg border border-border">
          <Volume2 className="h-4 w-4 text-primary shrink-0" />
          <audio src={audioUrl} controls className="h-8 flex-1 max-w-full" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={deleteRecording}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Transcription & Synthèse textuelle */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Transcription / Synthèse vocale :</span>
          <span className="flex items-center gap-1 text-primary">
            <Sparkles className="h-3 w-3" /> Dictée & Relevé
          </span>
        </div>
        <Textarea
          value={transcription}
          onChange={(e) => {
            setTranscription(e.target.value);
            onSaveTranscription(e.target.value);
          }}
          placeholder="Dictez ou saisissez vos observations orales sur le champ..."
          className="text-xs min-h-[60px]"
          rows={2}
        />
      </div>
    </div>
  );
}
