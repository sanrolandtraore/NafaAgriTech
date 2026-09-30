/**
 * NAFA FIELD DESIGNER — MODULE DE MESURE GPS DE PARCELLE
 * Arpentage de terrain in-situ au Burkina Faso :
 * - Mode marche autour de la parcelle (A → B → C → D → A)
 * - Calcul temps réel : m², hectares, périmètre, distances et précision
 * - Correction, ajout/suppression de point et fermeture de polygone
 * - Très grands boutons tactiles adaptés aux smartphones et conditions plein soleil
 */

import React, { useState, useEffect, useRef } from "react";
import { GeoPoint, Field } from "@/types/fieldDesigner";
import {
  calculateDistanceM,
  calculatePolygonAreaM2,
  calculatePerimeterM,
  calculateFieldDimensions,
} from "@/lib/fieldGpsSurvey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Square,
  Plus,
  Trash2,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  Compass,
  MapPin,
  Navigation,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface FieldGpsMeasurerProps {
  onSaveField: (field: Field) => void;
  activeFarmId: string;
}

export const FieldGpsMeasurer: React.FC<FieldGpsMeasurerProps> = ({
  onSaveField,
  activeFarmId,
}) => {
  const [fieldName, setFieldName] = useState("Parcelle 1");
  const [isRecording, setIsRecording] = useState(false);
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [currentAccuracyM, setCurrentAccuracyM] = useState<number | null>(null);
  const [distanceWalkedM, setDistanceWalkedM] = useState(0);
  const [isClosed, setIsClosed] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  // Surface & Périmètre calculés en direct
  const areaM2 = calculatePolygonAreaM2(points);
  const areaHa = Math.round((areaM2 / 10000) * 100) / 100;
  const perimeterM = calculatePerimeterM(points);
  const dimensions = calculateFieldDimensions(points);

  // Gestion du GPS natif du téléphone
  const startRecording = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non supportée sur cet appareil.");
      return;
    }

    setIsRecording(true);
    setIsClosed(false);
    toast.success("Mesure GPS démarrée. Marchez le long des limites de la parcelle.");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude } = pos.coords;
        setCurrentAccuracyM(Math.round(accuracy));

        const newPoint: GeoPoint = {
          lat: latitude,
          lng: longitude,
          alt: altitude ? Math.round(altitude) : undefined,
          accuracy: Math.round(accuracy),
          timestamp: Date.now(),
        };

        setPoints((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const dist = calculateDistanceM(last, newPoint);
            // N'enregistre automatiquement que si l'agronome a avancé d'au moins 2 mètres
            if (dist >= 2.0) {
              setDistanceWalkedM((d) => Math.round(d + dist));
              return [...prev, newPoint];
            }
            return prev;
          }
          return [newPoint];
        });
      },
      (err) => {
        console.warn("Erreur GPS :", err);
        toast.warning("Signal GPS faible ou instable. Veuillez vérifier vos permissions.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopRecording = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsRecording(false);
  };

  const addManualPoint = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pt: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          alt: pos.coords.altitude ? Math.round(pos.coords.altitude) : undefined,
          accuracy: Math.round(pos.coords.accuracy),
          label: `Borne B${points.length + 1}`,
          timestamp: Date.now(),
        };
        setPoints((prev) => [...prev, pt]);
        toast.success(`Borne B${points.length + 1} enregistrée.`);
      },
      () => toast.error("Impossible de lire la position actuelle.")
    );
  };

  const deleteLastPoint = () => {
    if (points.length === 0) return;
    setPoints((prev) => prev.slice(0, prev.length - 1));
    toast.info("Dernier point supprimé.");
  };

  const closePolygon = () => {
    if (points.length < 3) {
      toast.error("Il faut au minimum 3 bornes pour fermer une parcelle.");
      return;
    }
    stopRecording();
    setIsClosed(true);
    toast.success(`Parcelle fermée avec succès ! Surface calculée : ${areaHa} ha.`);
  };

  const resetSurvey = () => {
    stopRecording();
    setPoints([]);
    setDistanceWalkedM(0);
    setIsClosed(false);
  };

  const saveMeasuredField = () => {
    if (points.length < 3) {
      toast.error("Veuillez mesurer au moins 3 points.");
      return;
    }

    const field: Field = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      farmId: activeFarmId,
      name: fieldName,
      points,
      areaM2,
      areaHa,
      perimeterM,
      lengthM: dimensions.lengthM,
      widthM: dimensions.widthM,
      orientationDeg: dimensions.orientationDeg,
      status: "active",
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveField(field);
    toast.success(`Parcelle « ${fieldName} » sauvegardée.`);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* ── BANDEAU EN-TÊTE & NOM PARCELLE ── */}
      <Card className="rounded-3xl border-2 border-primary/20 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                <Navigation className="h-6 w-6 text-primary" />
                Mesure GPS de Parcelle
              </h2>
              <p className="text-xs text-muted-foreground">
                Arpentez le périmètre en marchant (A → B → C → D → A) avec votre téléphone.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {currentAccuracyM !== null && (
                <Badge
                  variant="outline"
                  className={`text-xs px-3 py-1 font-mono font-bold ${
                    currentAccuracyM <= 5
                      ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                      : currentAccuracyM <= 10
                      ? "border-amber-500 text-amber-600 bg-amber-50"
                      : "border-destructive text-destructive bg-destructive/10"
                  }`}
                >
                  Précision GPS : ±{currentAccuracyM} m
                </Badge>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold">Nom ou Référence de la Parcelle</Label>
            <Input
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Ex: Parcelle Oignon B1"
              className="h-11 rounded-xl text-sm font-semibold mt-1"
            />
          </div>

          {/* ── MÉTRIQUES TEMPS RÉEL (GRANDS CHIFFRES) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-muted/40 p-3.5 rounded-2xl border text-center">
              <span className="text-[11px] font-bold text-muted-foreground uppercase block">Superficie</span>
              <span className="text-xl sm:text-2xl font-black text-primary font-mono">{areaHa} ha</span>
              <span className="text-[10px] text-muted-foreground block">({areaM2.toLocaleString()} m²)</span>
            </div>

            <div className="bg-muted/40 p-3.5 rounded-2xl border text-center">
              <span className="text-[11px] font-bold text-muted-foreground uppercase block">Périmètre</span>
              <span className="text-xl sm:text-2xl font-black text-foreground font-mono">{perimeterM} m</span>
              <span className="text-[10px] text-muted-foreground block">{points.length} points relevés</span>
            </div>

            <div className="bg-muted/40 p-3.5 rounded-2xl border text-center">
              <span className="text-[11px] font-bold text-muted-foreground uppercase block">Distance marchée</span>
              <span className="text-xl sm:text-2xl font-black text-foreground font-mono">{distanceWalkedM} m</span>
              <span className="text-[10px] text-muted-foreground block">Parcours terrain</span>
            </div>

            <div className="bg-muted/40 p-3.5 rounded-2xl border text-center">
              <span className="text-[11px] font-bold text-muted-foreground uppercase block">Dimensions estimées</span>
              <span className="text-base sm:text-lg font-black text-foreground font-mono">
                {dimensions.lengthM}m × {dimensions.widthM}m
              </span>
              <span className="text-[10px] text-muted-foreground block">Cap : {dimensions.orientationDeg}°</span>
            </div>
          </div>

          {/* ── VISUALISATION SVG DU POLYGONE EN DIRECT ── */}
          {points.length >= 2 && (
            <div className="bg-slate-950 rounded-2xl p-4 border flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
              <span className="absolute top-2 left-3 text-[10px] font-mono text-emerald-400">
                Tracé géodésique GPS temps réel
              </span>
              <svg className="w-full h-44" viewBox="-60 -60 120 120">
                {/* Représentation normalisée centrée */}
                {(() => {
                  const minLat = Math.min(...points.map((p) => p.lat));
                  const maxLat = Math.max(...points.map((p) => p.lat));
                  const minLng = Math.min(...points.map((p) => p.lng));
                  const maxLng = Math.max(...points.map((p) => p.lng));

                  const spanLat = maxLat - minLat || 0.0001;
                  const spanLng = maxLng - minLng || 0.0001;

                  const polyCoords = points.map((p) => {
                    const x = ((p.lng - minLng) / spanLng - 0.5) * 80;
                    const y = -(((p.lat - minLat) / spanLat - 0.5) * 80);
                    return `${x},${y}`;
                  });

                  return (
                    <>
                      <polygon
                        points={polyCoords.join(" ")}
                        fill="rgba(22, 163, 74, 0.3)"
                        stroke="#22c55e"
                        strokeWidth="2.5"
                        strokeDasharray={isClosed ? "none" : "4,2"}
                      />
                      {points.map((p, idx) => {
                        const x = ((p.lng - minLng) / spanLng - 0.5) * 80;
                        const y = -(((p.lat - minLat) / spanLat - 0.5) * 80);
                        return (
                          <circle
                            key={idx}
                            cx={x}
                            cy={y}
                            r={idx === points.length - 1 ? 4 : 2.5}
                            fill={idx === points.length - 1 ? "#facc15" : "#ffffff"}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          )}

          {/* ── GRANDS BOUTONS D'ACTION TACTILES TERRAIN ── */}
          <div className="space-y-3 pt-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="w-full h-14 rounded-2xl font-black text-base gradient-primary text-primary-foreground shadow-lg gap-2"
              >
                <Play className="h-5 w-5 fill-current" />
                Démarrer la mesure
              </Button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={addManualPoint}
                  variant="outline"
                  className="h-13 rounded-2xl font-bold text-sm border-primary/40 text-primary gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Marquer une borne in-situ
                </Button>
                <Button
                  onClick={closePolygon}
                  disabled={points.length < 3}
                  className="h-13 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Fermer la parcelle
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {isRecording && (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="sm"
                  className="h-10 rounded-xl gap-1.5 text-xs font-bold"
                >
                  <Square className="h-4 w-4 fill-current" />
                  Pause
                </Button>
              )}
              <Button
                onClick={deleteLastPoint}
                disabled={points.length === 0}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl gap-1.5 text-xs font-bold"
              >
                <Undo2 className="h-4 w-4" />
                Corriger / Annuler dernier point
              </Button>
              <Button
                onClick={resetSurvey}
                disabled={points.length === 0}
                variant="ghost"
                size="sm"
                className="h-10 rounded-xl gap-1.5 text-xs text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                Reprendre à zéro
              </Button>
            </div>

            {/* Bouton de sauvegarde définitive */}
            {points.length >= 3 && (
              <Button
                onClick={saveMeasuredField}
                className="w-full h-13 rounded-2xl font-black text-sm bg-primary text-primary-foreground gap-2 mt-2"
              >
                <Save className="h-5 w-5" />
                Sauvegarder cette parcelle ({areaHa} ha)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
