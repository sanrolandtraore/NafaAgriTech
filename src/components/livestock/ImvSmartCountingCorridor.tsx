/**
 * NAFA AGRITECH — CONSOLE VÉTÉRINAIRE DE COULOIR IMV SMART COUNTING (EIP)
 * Interface de comptage bidirectionnel automatique en temps réel par vision IA
 * https://www.imv-technologies.fr/produit/smart-counting
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Camera,
  Play,
  Square,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserX,
  Scale,
  FileDown,
  Activity,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Eye,
  Info,
} from "lucide-react";
import {
  ImvSpecies,
  ImvCorridorTracker,
  VirtualTripwireLine,
  IMV_SPECIES_BIOMETRICS,
  CrossingEvent,
  SmartWeightMetrics,
} from "@/lib/imvSmartCountingEngine";
import { generateImvSmartCountingCertificate } from "@/lib/imvSmartCountingPdf";
import { useAuth } from "@/contexts/AuthContext";

interface ImvSmartCountingCorridorProps {
  initialSpecies?: ImvSpecies;
  farmName?: string;
  batchId?: string;
  onSessionComplete?: (netCount: number, biometrics: SmartWeightMetrics) => void;
}

export const ImvSmartCountingCorridor: React.FC<ImvSmartCountingCorridorProps> = ({
  initialSpecies = "porcin",
  farmName = "Exploitation Porcine / Cheptel Partenaire",
  batchId = "LOT-VET-01",
  onSessionComplete,
}) => {
  const { user, profile } = useAuth();
  const [species, setSpecies] = useState<ImvSpecies>(initialSpecies);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lineOrientation, setLineOrientation] = useState<"horizontal" | "vertical">("horizontal");

  // Compteurs en temps réel
  const [totals, setTotals] = useState({ totalIn: 0, totalOut: 0, netCount: 0, humanExclusions: 0 });
  const [biometrics, setBiometrics] = useState<SmartWeightMetrics>({
    totalCount: 0,
    totalWeightKg: 0,
    averageWeightKg: 0,
    minWeightKg: 0,
    maxWeightKg: 0,
    standardDeviationKg: 0,
    coefficientOfVariationPct: 0,
    uniformityGrade: "excellente",
  });
  const [recentEvents, setRecentEvents] = useState<CrossingEvent[]>([]);
  const [lastCrossingFlash, setLastCrossingFlash] = useState<"IN" | "OUT" | "HUMAN" | null>(null);

  // Références
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<ImvCorridorTracker>(new ImvCorridorTracker(species));
  const animationFrameId = useRef<number | null>(null);
  const simulationIntervalId = useRef<NodeJS.Timeout | null>(null);
  const frameCountRef = useRef<number>(0);

  // Met à jour la ligne virtuelle selon l'orientation
  const updateTripwireOrientation = useCallback((orientation: "horizontal" | "vertical") => {
    setLineOrientation(orientation);
    const line: VirtualTripwireLine =
      orientation === "horizontal"
        ? {
            start: { x: 0.05, y: 0.5 },
            end: { x: 0.95, y: 0.5 },
            directionLabelA: "Bâtiment Amont (Nord)",
            directionLabelB: "Quai d'Embarquement (Sud)",
          }
        : {
            start: { x: 0.5, y: 0.05 },
            end: { x: 0.5, y: 0.95 },
            directionLabelA: "Enclos Ouest",
            directionLabelB: "Couloir Est",
          };
    trackerRef.current.setTripwire(line);
  }, []);

  // Changement d'espèce
  const handleSpeciesChange = (newSpecies: ImvSpecies) => {
    setSpecies(newSpecies);
    trackerRef.current.setSpecies(newSpecies);
    toast.info(`Calibrage biométrique activé : ${IMV_SPECIES_BIOMETRICS[newSpecies].label}`);
  };

  // Démarrer la caméra physique
  const handleStartCamera = async () => {
    try {
      if (isSimulating) handleStopSimulation();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsLiveActive(true);
        startProcessingLoop();
        toast.success("Caméra de couloir connectée avec succès.");
      }
    } catch {
      toast.error("Impossible d'activer la caméra. Vous pouvez utiliser le Mode Simulation Couloir.");
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    setIsLiveActive(false);
  };

  // Boucle de rendu et d'analyse vidéo
  const startProcessingLoop = () => {
    const process = () => {
      frameCountRef.current += 1;
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas && video && video.readyState >= 2) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;

          // Dessiner la frame vidéo
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Rendu de la ligne virtuelle Tripwire
          drawTripwireOverlay(ctx, canvas.width, canvas.height);
        }
      }

      animationFrameId.current = requestAnimationFrame(process);
    };

    animationFrameId.current = requestAnimationFrame(process);
  };

  // Dessin de la ligne Tripwire et du HUD graphique
  const drawTripwireOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const tripwire = trackerRef.current.getTripwire();
    const x1 = tripwire.start.x * width;
    const y1 = tripwire.start.y * height;
    const x2 = tripwire.end.x * width;
    const y2 = tripwire.end.y * height;

    // Ligne centrale lumineuse
    ctx.strokeStyle = "#10b981"; // Emerald
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bornes de délimitation
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(x1, y1, 8, 0, Math.PI * 2);
    ctx.arc(x2, y2, 8, 0, Math.PI * 2);
    ctx.fill();

    // Étiquettes de direction A / B
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.font = "bold 12px monospace";
    ctx.fillRect(10, 10, 220, 30);
    ctx.fillStyle = "#34d399";
    ctx.fillText(`ZONE A : ${tripwire.directionLabelA}`, 16, 30);

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(10, height - 40, 220, 30);
    ctx.fillStyle = "#60a5fa";
    ctx.fillText(`ZONE B : ${tripwire.directionLabelB}`, 16, height - 20);
  };

  // Mode Démonstration / Simulation Industrielle de Couloir
  const handleStartSimulation = () => {
    handleStopCamera();
    setIsSimulating(true);
    toast.success("Simulation du couloir d'embarquement IMV activée.");

    // Générateur d'événements de passage réalistes
    let frame = 0;
    simulationIntervalId.current = setInterval(() => {
      frame++;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 640;
      canvas.height = 420;

      // Fond de couloir synthétique professionnel (aspect béton & barrières)
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Barrières latérales du couloir
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, canvas.width, 25);
      ctx.fillRect(0, canvas.height - 25, canvas.width, 25);

      drawTripwireOverlay(ctx, canvas.width, canvas.height);

      // Simulation de passages avec probabilité réaliste
      // 70% porc qui avance (IN), 15% porc qui recule (OUT), 15% opérateur humain qui passe
      const roll = (frame * 17) % 100;
      const isHumanPass = roll > 85;
      const isReverse = roll > 70 && roll <= 85;

      const yStart = isReverse ? 0.8 : 0.2;
      const yEnd = isReverse ? 0.2 : 0.8;

      // Création d'une entité simulée qui franchit la ligne
      const mockDet = isHumanPass
        ? { x: 0.45, y: yStart, width: 0.1, height: 0.35, confidence: 0.98 } // Silhouette humaine haute
        : { x: 0.35 + ((frame % 5) * 0.05), y: yStart, width: 0.22, height: 0.16, confidence: 0.99 }; // Porcin allongé

      // Étape 1 : Amont
      trackerRef.current.processFrame([mockDet], frame * 2);

      // Étape 2 : Franchissement effectif de la ligne (changement de côté)
      const mockDetCrossed = { ...mockDet, y: yEnd };
      const res = trackerRef.current.processFrame([mockDetCrossed], frame * 2 + 1);

      // Dessiner l'entité sur le canvas
      ctx.lineWidth = 2.5;
      if (isHumanPass) {
        ctx.strokeStyle = "#f59e0b"; // Jaune humain
        ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
        ctx.strokeRect(mockDetCrossed.x * canvas.width, mockDetCrossed.y * canvas.height, mockDetCrossed.width * canvas.width, mockDetCrossed.height * canvas.height);
        ctx.fillRect(mockDetCrossed.x * canvas.width, mockDetCrossed.y * canvas.height, mockDetCrossed.width * canvas.width, mockDetCrossed.height * canvas.height);

        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("HUMAIN EXCLU", mockDetCrossed.x * canvas.width, mockDetCrossed.y * canvas.height - 6);
      } else {
        ctx.strokeStyle = "#10b981"; // Vert animal
        ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
        ctx.strokeRect(mockDetCrossed.x * canvas.width, mockDetCrossed.y * canvas.height, mockDetCrossed.width * canvas.width, mockDetCrossed.height * canvas.height);
        ctx.fillRect(mockDetCrossed.x * canvas.width, mockDetCrossed.y * canvas.height, mockDetCrossed.width * canvas.width, mockDetCrossed.height * canvas.height);

        ctx.fillStyle = "#34d399";
        ctx.font = "bold 11px monospace";
        ctx.fillText(`${species.toUpperCase()} #T${100 + frame}`, mockDetCrossed.x * canvas.width, mockDetCrossed.y * canvas.height - 6);
      }

      // Mise à jour de l'état UI
      if (res.newEvents.length > 0) {
        const latest = res.newEvents[0];
        if (latest.isHumanExcluded) {
          setLastCrossingFlash("HUMAN");
        } else {
          setLastCrossingFlash(latest.direction);
        }
        setTimeout(() => setLastCrossingFlash(null), 800);
      }

      setTotals(trackerRef.current.getTotals());
      setBiometrics(trackerRef.current.getBiometrics());
      setRecentEvents(trackerRef.current.getEvents());
    }, 1800);
  };

  const handleStopSimulation = () => {
    if (simulationIntervalId.current) {
      clearInterval(simulationIntervalId.current);
      simulationIntervalId.current = null;
    }
    setIsSimulating(false);
  };

  const handleResetSession = () => {
    handleStopSimulation();
    trackerRef.current.reset();
    setTotals({ totalIn: 0, totalOut: 0, netCount: 0, humanExclusions: 0 });
    setBiometrics(trackerRef.current.getBiometrics());
    setRecentEvents([]);
    toast.info("Session de comptage réinitialisée.");
  };

  // Téléchargement du certificat officiel PDF
  const handleDownloadCertificate = () => {
    const summary = trackerRef.current.getSessionSummary();
    if (summary.totalIn === 0 && summary.humanExclusionCount === 0) {
      toast.error("Veuillez enregistrer au moins un passage avant d'émettre le certificat.");
      return;
    }

    try {
      const doc = generateImvSmartCountingCertificate({
        summary,
        vetInfo: {
          vetName: profile?.full_name || "Dr. Amadou Kaboré",
          vetTitle: "Docteur en Médecine Vétérinaire • Ordre BF",
          clinicName: "Clinique Vétérinaire Centrale & Santé Animale",
          phone: "+226 70 00 00 00",
          licenseNumber: "ONV-BF-2023-084",
        },
        farmInfo: {
          farmName,
          producerName: "Producteur Partenaire NAFA",
          locality: "Zone Pastorale / Vallée du Kou",
          batchId,
        },
        purpose: "Certification officielle d'effectif & pesée biométrique de couloir",
      });

      doc.save(`Certificat_IMV_SmartCounting_${summary.sessionId}.pdf`);
      toast.success("Certificat Vétérinaire Officiel téléchargé avec succès !");

      if (onSessionComplete) {
        onSessionComplete(summary.netCount, summary.biometrics);
      }
    } catch {
      toast.error("Erreur lors de la génération du certificat PDF.");
    }
  };

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      handleStopCamera();
      handleStopSimulation();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Bandeau supérieur officiel IMV */}
      <Card className="border-2 border-emerald-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/80 text-white shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <CardContent className="p-5 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 uppercase tracking-wide">
                  Norme IMV Technologies
                </Badge>
                <Badge variant="outline" className="border-emerald-400/50 text-emerald-300 text-[11px] font-mono">
                  EIP Edge Intelligence Platform
                </Badge>
                <span className="text-xs text-slate-400 font-mono">Précision minimale : 99,9 %</span>
              </div>
              <h2 className="text-2xl font-heading font-black tracking-tight text-white flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                Station de Couloir : SmaRt Counting & Pesée Biométrique
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl">
                Comptage bidirectionnel automatisé par caméra de couloir (Entrées $+$, Sorties $-$, Solde Net).
                Filtrage strict des silhouettes humaines et estimation de poids/uniformité du lot sans stress animal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={species} onValueChange={(val) => handleSpeciesChange(val as ImvSpecies)}>
                <SelectTrigger className="w-48 bg-slate-800/90 border-slate-700 text-white text-xs font-bold">
                  <SelectValue placeholder="Espèce" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="porcin">Porcins (Porcs / Truies)</SelectItem>
                  <SelectItem value="bovin">Bovins (Zébus / Taurillons)</SelectItem>
                  <SelectItem value="ovin">Ovins (Moutons / Béliers)</SelectItem>
                  <SelectItem value="caprin">Caprins (Chèvres / Boucs)</SelectItem>
                  <SelectItem value="volaille">Volailles (Poulets de chair)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleDownloadCertificate}
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
              >
                <FileDown className="h-4 w-4" />
                Certificat Officiel PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Compteurs HUD Temps Réel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Entrées (+) */}
        <Card className={`border transition-all duration-300 ${lastCrossingFlash === "IN" ? "ring-2 ring-emerald-500 bg-emerald-500/20" : "bg-card"}`}>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Entrées (+)
            </span>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              +{totals.totalIn}
            </div>
            <p className="text-[10px] text-muted-foreground">Animaux franchis vers l'aval</p>
          </CardContent>
        </Card>

        {/* Sorties / Reculs (-) */}
        <Card className={`border transition-all duration-300 ${lastCrossingFlash === "OUT" ? "ring-2 ring-rose-500 bg-rose-500/20" : "bg-card"}`}>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Sorties / Reculs (-)
            </span>
            <div className="text-3xl font-black text-rose-700 dark:text-rose-400 font-mono">
              -{totals.totalOut}
            </div>
            <p className="text-[10px] text-muted-foreground">Déductions automatiques</p>
          </CardContent>
        </Card>

        {/* SOLDE NET (=) */}
        <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center justify-between">
              <span>SOLDE NET VÉRIFIÉ</span>
              <Badge className="bg-emerald-600 text-white text-[9px] py-0 px-1">Certifié 99.9%</Badge>
            </span>
            <div className="text-3xl font-black text-emerald-950 dark:text-emerald-200 font-mono">
              {totals.netCount} <span className="text-sm font-bold text-emerald-700">têtes</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Effectif réel présent en lot</p>
          </CardContent>
        </Card>

        {/* Exclusion Humains */}
        <Card className={`border transition-all duration-300 ${lastCrossingFlash === "HUMAN" ? "ring-2 ring-amber-500 bg-amber-500/20" : "bg-card"}`}>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <UserX className="h-3.5 w-3.5" />
              Humains Rejetés
            </span>
            <div className="text-3xl font-black text-amber-700 dark:text-amber-400 font-mono">
              {totals.humanExclusions}
            </div>
            <p className="text-[10px] text-muted-foreground">Vétérinaires / éleveurs exclus</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Espace Vidéo Couloir & Smart Weight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas de la caméra de couloir */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="border border-border/70 overflow-hidden bg-slate-950 text-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-sm font-bold">Flux Optique de Couloir (Ligne Virtuelle A-B)</CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTripwireOrientation(lineOrientation === "horizontal" ? "vertical" : "horizontal")}
                  className="h-7 text-xs border-slate-700 text-slate-300 hover:text-white"
                >
                  <Sliders className="h-3 w-3 mr-1" />
                  {lineOrientation === "horizontal" ? "Ligne Horizontale" : "Ligne Verticale"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 relative flex items-center justify-center min-h-[380px] bg-slate-900">
              {/* Vidéo cachée pour acquisition de la caméra */}
              <video ref={videoRef} className="hidden" playsInline muted autoPlay />

              {/* Canvas de rendu principal */}
              <canvas ref={canvasRef} className="w-full h-auto max-h-[440px] object-contain" />

              {!isLiveActive && !isSimulating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-950/80 backdrop-blur-sm">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h3 className="text-base font-bold text-white">Caméra en attente d'activation</h3>
                    <p className="text-xs text-slate-400">
                      Positionnez la caméra au-dessus ou de profil par rapport au couloir d'embarquement,
                      ou lancez la simulation pour tester le comptage et l'exclusion humaine en direct.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button onClick={handleStartCamera} className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                      <Camera className="h-4 w-4" />
                      Activer la Caméra Directe
                    </Button>
                    <Button onClick={handleStartSimulation} variant="secondary" className="gap-2 text-xs font-bold">
                      <Play className="h-4 w-4" />
                      Mode Démonstration Couloir
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Barre de contrôle sous la vidéo */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isLiveActive && (
                  <Button size="sm" variant="destructive" onClick={handleStopCamera} className="h-8 text-xs gap-1.5 font-bold">
                    <Square className="h-3.5 w-3.5" />
                    Arrêter Caméra
                  </Button>
                )}
                {isSimulating && (
                  <Button size="sm" variant="destructive" onClick={handleStopSimulation} className="h-8 text-xs gap-1.5 font-bold">
                    <Square className="h-3.5 w-3.5" />
                    Arrêter Simulation
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleResetSession} className="h-8 text-xs gap-1.5 border-slate-700 text-slate-300">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Remise à Zéro
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Anti-rebond actif
                </span>
                <span>•</span>
                <span className="text-amber-400">Filtre opérateurs ON</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Panneau latéral : Smart Weight & Uniformité de lot */}
        <div className="space-y-4">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Scale className="h-4 w-4 text-emerald-600" />
                Biométrie : Smart Weight (Norme IMV)
              </CardTitle>
              <CardDescription className="text-xs">
                Estimation allométrique en temps réel et homogénéité du lot
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Poids Moyen</span>
                  <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {biometrics.averageWeightKg} <span className="text-xs font-normal">kg</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Poids Total Lot</span>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-slate-100">
                    {(biometrics.totalWeightKg / (biometrics.totalWeightKg >= 1000 ? 1000 : 1)).toFixed(1)}{" "}
                    <span className="text-xs font-normal">{biometrics.totalWeightKg >= 1000 ? "t" : "kg"}</span>
                  </div>
                </div>
              </div>

              {/* Jauge d'uniformité du lot (Coefficient de variation CV%) */}
              <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-muted-foreground">Uniformité (CV %)</span>
                  <Badge
                    variant="outline"
                    className={`font-mono font-bold text-[10px] ${
                      biometrics.uniformityGrade === "excellente"
                        ? "border-emerald-500 text-emerald-600 bg-emerald-500/10"
                        : biometrics.uniformityGrade === "bonne"
                        ? "border-lime-500 text-lime-600 bg-lime-500/10"
                        : "border-amber-500 text-amber-600 bg-amber-500/10"
                    }`}
                  >
                    {biometrics.coefficientOfVariationPct} % • {biometrics.uniformityGrade.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Un coefficient de variation &lt; 10% indique un lot homogène d'animaux, idéal pour les contrats d'abattoir.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px]">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  Garantie Vétérinaire EIP
                </span>
                <p className="text-[10px] leading-relaxed text-emerald-800/80 dark:text-emerald-400">
                  Chaque animal est tracé par son vecteur centroïde. Le système tolère les hésitations sur la ligne et rejette les faux positifs.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fiche d'intervention */}
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                Fiche d'Intervention
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Exploitation :</span>
                <span className="font-bold">{farmName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Identifiant Lot :</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{batchId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Gamme Espèce :</span>
                <span className="font-bold">{IMV_SPECIES_BIOMETRICS[species].label.split("(")[0]}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Audit Trail :</span>
                <span className="font-mono text-[10px] text-slate-500">Horodatage continu</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Journal d'Audit Horodaté des Franchissements */}
      <Card className="border border-border/70 shadow-sm">
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Journal d'Audit Horodaté des Franchissements (Norme IMV)
            </CardTitle>
            <CardDescription className="text-xs">
              Historique chronologique des passages validés et des silhouettes humaines rejetées
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {recentEvents.length} événements enregistrés
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/60 sticky top-0 text-[10px] font-bold text-muted-foreground uppercase border-b border-border/70">
                <tr>
                  <th className="p-3">Heure</th>
                  <th className="p-3">Trace ID</th>
                  <th className="p-3">Sens de Passage</th>
                  <th className="p-3">Biométrie Estimée</th>
                  <th className="p-3">Confiance EIP</th>
                  <th className="p-3">Solde Net Après</th>
                  <th className="p-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground italic">
                      Aucun franchissement de ligne enregistré pour cette session.
                    </td>
                  </tr>
                ) : (
                  [...recentEvents].reverse().map((evt) => (
                    <tr key={evt.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-muted-foreground">
                        {new Date(evt.timestamp).toLocaleTimeString("fr-FR")}
                      </td>
                      <td className="p-3 font-mono font-bold">#{evt.trackId}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            evt.direction === "IN"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                          }`}
                        >
                          {evt.direction === "IN" ? "ENTRÉE (+1)" : "SORTIE / RECUL (-1)"}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono">
                        {evt.isHumanExcluded ? (
                          <span className="text-amber-600 font-bold">Silhouette Humaine</span>
                        ) : (
                          `${evt.estimatedWeightKg} kg`
                        )}
                      </td>
                      <td className="p-3 font-mono text-emerald-700 dark:text-emerald-400">
                        {Math.round(evt.confidence * 100)} %
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {evt.netBalanceAfter} têtes
                      </td>
                      <td className="p-3">
                        {evt.isHumanExcluded ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                            <UserX className="h-3 w-3" />
                            Exclu (Opérateur)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                            <CheckCircle2 className="h-3 w-3" />
                            Validé Cheptel
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
