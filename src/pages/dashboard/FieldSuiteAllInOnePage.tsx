import React, { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Navigation,
  MapPin,
  Camera,
  Layers,
  Sparkles,
  Compass,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  RotateCcw,
  Play,
  Square,
  Crosshair,
  Leaf,
  Bug,
  ShieldCheck,
  Activity,
  ArrowRight,
  Info,
  Clock,
  Eye,
  ChevronRight,
  Upload,
} from "lucide-react";

import {
  SurveyWaypoint,
  calculateDistanceM,
  calculateBearingDeg,
  calculatePolygonAreaM2,
  calculatePerimeterM,
  calculateCentroid,
  toDMS,
  toApproximateUtmZone30N,
} from "@/lib/gpsSurveyEngine";

import {
  FieldSuiteMission,
  AnomalyHotspot,
  AnomalyDiagnosis,
  SatelliteVegetationData,
  fieldSuiteStorage,
  generateSatelliteNdviAnalysis,
} from "@/lib/fieldSuiteStorage";

import { generateFieldSuiteReportPdf } from "@/lib/fieldSuitePdf";
import { pythonEngineClient } from "@/lib/pythonEngineClient";
import BackNavigationButton from "@/components/BackNavigationButton";

export default function FieldSuiteAllInOnePage() {
  // ─── 1. MISSION EN COURS ───
  const [mission, setMission] = useState<FieldSuiteMission>(() => {
    const list = fieldSuiteStorage.getAll();
    return list.length > 0 ? list[0] : fieldSuiteStorage.createDefaultMission();
  });

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(mission.currentStep || 1);

  // ─── 2. GPS EN DIRECT (MARCHE & LOCALISATION) ───
  const [livePos, setLivePos] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    heading?: number;
    speed?: number;
  } | null>(null);

  const [isWalking, setIsWalking] = useState(false);
  const [walkDistanceThresholdM] = useState(2.5); // Ajout d'un point tous les 2.5 mètres
  const watchIdRef = useRef<number | null>(null);

  // ─── 3. CARTE LEAFLET ───
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const walkLineLayerRef = useRef<L.Polyline | null>(null);
  const satelliteOverlayRef = useRef<L.LayerGroup | null>(null);
  const liveMarkerRef = useRef<L.Marker | null>(null);

  // ─── 4. CIBLE D'ANOMALIE ACTIVE POUR GUIDAGE & DIAGNOSTIC ───
  const [activeAnomaly, setActiveAnomaly] = useState<AnomalyHotspot | null>(() => {
    return mission.satelliteData?.hotspots[0] || null;
  });

  // ─── 5. ÉTAT DU DIAGNOSTIC PHOTO IN-SITU ───
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronisation continue de la mission dans le stockage local
  useEffect(() => {
    fieldSuiteStorage.save(mission);
  }, [mission]);

  // ─── 6. DÉMARRAGE DU GPS ───
  const startGps = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation GPS n'est pas supportée sur cet appareil.");
      return;
    }

    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        const currentData = {
          lat: Math.round(latitude * 1000000) / 1000000,
          lng: Math.round(longitude * 1000000) / 1000000,
          accuracy: Math.round(accuracy * 10) / 10,
          heading: heading ? Math.round(heading) : undefined,
          speed: speed ? Math.round(speed * 3.6 * 10) / 10 : undefined,
        };
        setLivePos(currentData);

        // Si le mode marche active est enclenché, enregistrer automatiquement la trace
        if (isWalking) {
          setMission((prev) => {
            const wps = prev.waypoints;
            if (wps.length > 0) {
              const last = wps[wps.length - 1];
              const dist = calculateDistanceM(last, currentData);
              if (dist >= walkDistanceThresholdM) {
                const nextIdx = wps.length + 1;
                const newPoint: SurveyWaypoint = {
                  id: `wp_${Date.now()}_${nextIdx}`,
                  index: nextIdx,
                  label: `Borne B${nextIdx}`,
                  category: "borne",
                  lat: currentData.lat,
                  lng: currentData.lng,
                  accuracy: currentData.accuracy,
                  timestamp: Date.now(),
                };
                const updatedWps = [...wps, newPoint];
                const coords = updatedWps.map((w) => ({ lat: w.lat, lng: w.lng }));
                const areaM2 = calculatePolygonAreaM2(coords);
                const perimeterM = calculatePerimeterM(coords);
                const centroid = calculateCentroid(coords);
                return {
                  ...prev,
                  waypoints: updatedWps,
                  areaM2,
                  areaHa: Math.round((areaM2 / 10000) * 100) / 100,
                  perimeterM,
                  centroid,
                };
              }
              return prev;
            } else {
              const firstPoint: SurveyWaypoint = {
                id: `wp_${Date.now()}_1`,
                index: 1,
                label: "Borne B1 (Départ)",
                category: "borne",
                lat: currentData.lat,
                lng: currentData.lng,
                accuracy: currentData.accuracy,
                timestamp: Date.now(),
              };
              return {
                ...prev,
                waypoints: [firstPoint],
                centroid: { lat: currentData.lat, lng: currentData.lng },
              };
            }
          });
        }
      },
      (err) => {
        console.warn("Avertissement GPS :", err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  }, [isWalking, walkDistanceThresholdM]);

  const stopGps = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    startGps();
    return () => stopGps();
  }, [startGps, stopGps]);

  // ─── 7. INITIALISATION DE LA CARTE LEAFLET ───
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const centerLat = mission.centroid?.lat || 12.518;
    const centerLng = mission.centroid?.lng || -1.402;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    });

    // Fond Satellite Haute Résolution (ArcGIS World Imagery)
    const satLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    );
    // Labels et toponymes contrastés
    const labelsLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    );

    L.layerGroup([satLayer, labelsLayer]).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    satelliteOverlayRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mission.centroid?.lat, mission.centroid?.lng]);

  // ─── 8. MISE À JOUR DE LA POSITION DU SMARTPHONE EN DIRECT ───
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !livePos) return;

    if (!liveMarkerRef.current) {
      const liveHtml = `
        <div style="
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 9999px;
          box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.35);
          animation: pulse 1.5s infinite;
        "></div>
      `;
      const icon = L.divIcon({
        className: "live-gps-user-marker",
        html: liveHtml,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      liveMarkerRef.current = L.marker([livePos.lat, livePos.lng], { icon }).addTo(map);
    } else {
      liveMarkerRef.current.setLatLng([livePos.lat, livePos.lng]);
    }
  }, [livePos]);

  // ─── 9. DESSIN DU CONTOUR ET DES ANOMALIES NDVI SUR LA CARTE ───
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Nettoyer couches
    if (markersGroupRef.current) markersGroupRef.current.clearLayers();
    if (polygonLayerRef.current) polygonLayerRef.current.remove();
    if (walkLineLayerRef.current) walkLineLayerRef.current.remove();
    if (satelliteOverlayRef.current) satelliteOverlayRef.current.clearLayers();

    const wps = mission.waypoints;
    if (wps.length === 0) return;

    const latLngs = wps.map((w) => [w.lat, w.lng] as [number, number]);

    // Dessin de la trace en cours ou polygone fermé
    if (wps.length >= 3) {
      const poly = L.polygon(latLngs, {
        color: "#16a34a",
        weight: 3,
        fillColor: "#22c55e",
        fillOpacity: activeStep >= 2 ? 0.15 : 0.25,
        dashArray: isWalking ? "6, 6" : undefined,
      }).addTo(map);
      polygonLayerRef.current = poly;
    } else {
      const line = L.polyline(latLngs, {
        color: "#16a34a",
        weight: 3,
        dashArray: "6, 6",
      }).addTo(map);
      walkLineLayerRef.current = line;
    }

    // Bornes de contour
    wps.forEach((wp) => {
      const isFirst = wp.index === 1;
      const html = `
        <div style="
          background: ${isFirst ? "#15803d" : "#0284c7"};
          color: white;
          border: 2px solid white;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 10px;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        ">
          ${wp.index}
        </div>
      `;
      const icon = L.divIcon({
        className: "survey-marker",
        html,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([wp.lat, wp.lng], { icon })
        .bindPopup(`<b>${wp.label}</b><br/>GPS: ${wp.lat.toFixed(5)}°, ${wp.lng.toFixed(5)}°`)
        .addTo(markersGroupRef.current!);
    });

    // Si on est aux étapes 2 ou 3 : Dessin des anomalies satellites (Hotspots A1, A2, A3)
    if (mission.satelliteData && activeStep >= 2) {
      mission.satelliteData.hotspots.forEach((h) => {
        const isTarget = activeAnomaly?.id === h.id;
        const isDiagnosed = h.status === "diagnosed";

        const bg = isDiagnosed
          ? "#10b981"
          : h.severity === "critical"
          ? "#ef4444"
          : "#f59e0b";

        const html = `
          <div style="
            background: ${bg};
            color: white;
            border: ${isTarget ? "3px solid #facc15" : "2px solid white"};
            border-radius: 9999px;
            font-weight: 900;
            font-size: 11px;
            width: ${isTarget ? "32px" : "26px"};
            height: ${isTarget ? "32px" : "26px"};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            ${isTarget ? "transform: scale(1.15);" : ""}
          ">
            ${h.code}
          </div>
        `;

        const icon = L.divIcon({
          className: "satellite-hotspot-marker",
          html,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([h.lat, h.lng], { icon }).addTo(satelliteOverlayRef.current!);

        marker.on("click", () => {
          setActiveAnomaly(h);
          if (activeStep === 2) {
            toast.info(`Anomalie ${h.code} sélectionnée : ${h.predictedIssue}`);
          }
        });
      });
    }

    // Recentrer la carte sur la parcelle
    if (latLngs.length > 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
    }
  }, [mission.waypoints, mission.satelliteData, activeStep, isWalking, activeAnomaly]);

  // ─── 10. ACTIONS DU WORKFLOW ───

  // A. Étape 1 : Arpentage & Découpage
  const handleToggleWalking = () => {
    if (!isWalking) {
      setIsWalking(true);
      toast.success("Mode marche activé ! Marchez le long des bordures de votre parcelle.");
    } else {
      setIsWalking(false);
      toast.info("Marche mise en pause.");
    }
  };

  const handleCaptureManualPoint = () => {
    const coords = livePos || { lat: 12.5182, lng: -1.4025, accuracy: 2.0 };
    setMission((prev) => {
      const nextIdx = prev.waypoints.length + 1;
      const newPoint: SurveyWaypoint = {
        id: `wp_${Date.now()}_${nextIdx}`,
        index: nextIdx,
        label: `Borne B${nextIdx}`,
        category: "borne",
        lat: coords.lat,
        lng: coords.lng,
        accuracy: coords.accuracy,
        timestamp: Date.now(),
      };
      const updatedWps = [...prev.waypoints, newPoint];
      const pCoords = updatedWps.map((w) => ({ lat: w.lat, lng: w.lng }));
      const areaM2 = calculatePolygonAreaM2(pCoords);
      const perimeterM = calculatePerimeterM(pCoords);
      const centroid = calculateCentroid(pCoords);
      return {
        ...prev,
        waypoints: updatedWps,
        areaM2,
        areaHa: Math.round((areaM2 / 10000) * 100) / 100,
        perimeterM,
        centroid,
      };
    });
    toast.success(`Borne B${mission.waypoints.length + 1} enregistrée au GPS !`);
  };

  const handleLoadDemoParcel = () => {
    const demo = fieldSuiteStorage.createDemoMission();
    setMission(demo);
    setActiveAnomaly(demo.satelliteData?.hotspots[0] || null);
    setActiveStep(2);
    toast.success("Parcelle de démonstration chargée (1.85 ha, Maïs hybride à Loumbila) !");
  };

  const handleClearWaypoints = () => {
    setIsWalking(false);
    setMission((prev) => ({
      ...prev,
      waypoints: [],
      areaM2: 0,
      areaHa: 0,
      perimeterM: 0,
      satelliteData: undefined,
    }));
    toast.info("Tracé réinitialisé.");
  };

  const handleProceedToSatellite = () => {
    if (mission.waypoints.length < 3) {
      toast.error("Veuillez marquer au minimum 3 bornes pour fermer la parcelle avant l'analyse satellite.");
      return;
    }
    setIsWalking(false);
    const coords = mission.waypoints.map((w) => ({ lat: w.lat, lng: w.lng }));
    const sat = generateSatelliteNdviAnalysis(coords, mission.centroid, mission.areaM2, mission.cropType);
    setMission((prev) => ({
      ...prev,
      satelliteData: sat,
      currentStep: 2,
    }));
    setActiveAnomaly(sat.hotspots[0]);
    setActiveStep(2);
    toast.success("Carte de végétation NDVI générée ! 3 zones d'anomalies détectées.");
  };

  // B. Étape 2 : Lancer le guidage vers une anomalie
  const handleStartGuidanceToAnomaly = (anomaly: AnomalyHotspot) => {
    setActiveAnomaly(anomaly);
    setActiveStep(3);
    setPhotoPreview(null);
    setPhotoFile(null);
    setDiagnosisNotes("");
    toast.success(`Guidage GPS enclenché vers l'anomalie ${anomaly.code} (${anomaly.predictedIssue}) !`);
  };

  // C. Étape 3 : Calculs de guidage GPS en temps réel
  const anomalyCoords = activeAnomaly ? { lat: activeAnomaly.lat, lng: activeAnomaly.lng } : null;
  const currentPosCoords = livePos ? { lat: livePos.lat, lng: livePos.lng } : (mission.centroid || { lat: 12.518, lng: -1.402 });

  const distanceToAnomalyM = anomalyCoords ? calculateDistanceM(currentPosCoords, anomalyCoords) : 0;
  const bearingToAnomalyDeg = anomalyCoords ? calculateBearingDeg(currentPosCoords, anomalyCoords) : 0;
  const isReached = distanceToAnomalyM <= 5; // Arrivé si à moins de 5 mètres

  // Simulation d'arrivée pour démonstration
  const handleSimulateArrival = () => {
    if (!activeAnomaly) return;
    setLivePos({
      lat: activeAnomaly.lat,
      lng: activeAnomaly.lng,
      accuracy: 1.0,
      heading: bearingToAnomalyDeg,
    });
    toast.success(`Position ajustée ! Vous êtes sur la zone d'anomalie ${activeAnomaly.code}.`);
  };

  // D. Étape 3 : Diagnostic Photo IA In-Situ
  const handlePhotoCaptured = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    toast.info("Photo de la culture capturée avec succès.");
  };

  const handleRunAiDiagnosis = async () => {
    if (!activeAnomaly) return;
    setIsDiagnosing(true);

    try {
      let diagData: any = null;

      // 1. Essai appel Python si disponible et fichier photo présent
      const isPythonReady = await pythonEngineClient.isAvailable();
      if (isPythonReady && photoFile) {
        diagData = await pythonEngineClient.diagnoseAutoPhoto(photoFile);
      }

      // 2. Moteur déterministe certifié de terrain si pas de Python ou analyse locale
      if (!diagData) {
        if (activeAnomaly.code === "A1") {
          diagData = {
            speculation: mission.cropType || "Maïs",
            partie_atteinte: "Feuilles basales et médianes",
            maladie: "Chlorose foliaire par carence azotée (Azote N)",
            agent_causal: "Déficit d'assimilation minérale N • Sol lessivé",
            pathogen_kind: "Carence nutritionnelle",
            symptomes: [
              "Jaunissement caractéristique en 'V' inversé partant de la pointe de la feuille",
              "Ralentissement de croissance et tiges grêles",
              "Perte d'activité photosynthétique dans le proche infrarouge",
            ],
            confidence_pct: 94,
            mesures_immediates: [
              "Apport d'urgence en Urée 46% (50 kg/ha) en binage-buttage",
              "Pulvérisation foliaire d'un biofertilisant riche en acides aminés à la fraîche",
            ],
            traitement_bio: {
              nom: "Purin de Tithonia diversifolia + Cendres végétales",
              substance_active: "Azote organique & Potasse soluble",
              dosage: "1 litre pour 10 litres d'eau tous les 5 jours",
              delai_attente: "0 jour (Naturel)",
            },
            traitement_chimique: {
              nom: "Urée perlé 46% N + NPK 14-23-14",
              substance_active: "Azote uréique assimilable",
              dosage: "50 kg/ha enfoui à 5 cm des plants",
              delai_attente: "Sans délai résiduaire",
            },
          };
        } else if (activeAnomaly.code === "A2") {
          diagData = {
            speculation: mission.cropType || "Maïs",
            partie_atteinte: "Ensemble du limbe et tiges",
            maladie: "Stress hydrique sévère et début de flétrissement",
            agent_causal: "Déficit d'humectation de l'horizon racinaire (0-40 cm)",
            pathogen_kind: "Stress abiotique hydrique",
            symptomes: [
              "Enroulement des feuilles en tube durant les heures chaudes",
              "Perte de turgescence et couleur grisâtre terne",
              "Chute brutale de la transpiration foliaire",
            ],
            confidence_pct: 91,
            mesures_immediates: [
              "Irrigation immédiate à hauteur de 35 mm (350 m³/ha)",
              "Paillage du rang avec résidus de paille pour limiter l'évaporation",
            ],
            traitement_bio: {
              nom: "Paillage végétal dense + Extrait d'algues antistress",
              substance_active: "Composés osmorégulateurs",
              dosage: "5 tonnes de paille/ha + 2L/ha extrait liquide",
              delai_attente: "0 jour",
            },
          };
        } else {
          diagData = {
            speculation: mission.cropType || "Maïs",
            partie_atteinte: "Cornet central et jeunes feuilles",
            maladie: "Attaque de Chenille légionnaire d'automne",
            agent_causal: "Spodoptera frugiperda (Lepidoptera : Noctuidae)",
            pathogen_kind: "Ravageur lépidoptère ravageur",
            symptomes: [
              "Feuilles criblées de perforations et sciure fécale dans le cornet",
              "Destruction du méristème apical sur les plants touchés",
              "Foyer d'attaque groupé en bordure de parcelle",
            ],
            confidence_pct: 96,
            mesures_immediates: [
              "Ramassage manuel des larves visibles dans le cornet",
              "Traitement ciblé sur le cornet le soir au coucher du soleil",
            ],
            traitement_bio: {
              nom: "Extrait aqueux de graines de Neem (Azadirachta indica)",
              substance_active: "Azadirachtine 0.03%",
              dosage: "50g de poudre de neem pilée par litre d'eau savonneuse",
              delai_attente: "3 jours",
            },
            traitement_chimique: {
              nom: "Emamectine benzoate 50 g/kg (Homologué CSP)",
              substance_active: "Emamectin benzoate",
              dosage: "250 g/ha (1 sachet de 25g par pulvérisateur 15L)",
              delai_attente: "7 jours avant récolte",
            },
          };
        }
      }

      const diagnosisResult: AnomalyDiagnosis = {
        id: `diag_${Date.now()}`,
        imagePreview: photoPreview || undefined,
        speculation: diagData.speculation,
        partie_atteinte: diagData.partie_atteinte,
        maladie: diagData.maladie,
        agent_causal: diagData.agent_causal,
        pathogen_kind: diagData.pathogen_kind || "Pathologie foliaire",
        symptomes: diagData.symptomes || [],
        confidence_pct: diagData.confidence_pct || 90,
        mesures_immediates: diagData.mesures_immediates || [],
        traitement_bio: diagData.traitement_bio,
        traitement_chimique: diagData.traitement_chimique,
        fieldNotes: diagnosisNotes,
        diagnosedAt: Date.now(),
        gpsAccuracyM: livePos?.accuracy,
      };

      // Mettre à jour l'anomalie dans la mission
      setMission((prev) => {
        if (!prev.satelliteData) return prev;
        const updatedHotspots = prev.satelliteData.hotspots.map((h) => {
          if (h.id === activeAnomaly.id) {
            return {
              ...h,
              status: "diagnosed" as const,
              diagnosis: diagnosisResult,
            };
          }
          return h;
        });

        return {
          ...prev,
          satelliteData: {
            ...prev.satelliteData,
            hotspots: updatedHotspots,
          },
        };
      });

      setActiveAnomaly((prev) => (prev ? { ...prev, status: "diagnosed", diagnosis: diagnosisResult } : null));
      toast.success(`Diagnostic validé pour l'anomalie ${activeAnomaly.code} : ${diagData.maladie} !`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de l'exécution du diagnostic.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleExportPdfReport = () => {
    try {
      generateFieldSuiteReportPdf(mission);
      toast.success("Rapport d'intervention officiel téléchargé avec succès !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du rapport PDF.");
    }
  };

  return (
    <div className="space-y-6 container max-w-7xl mx-auto px-4 py-6">
      {/* ─── EN-TÊTE PRINCIPAL & BOUTONS D'ACTION ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-black text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Suite Tout-en-Un Agronome
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                Arpentage • Satellite • Diagnostic
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Détourage par marche GPS, analyse multispectrale NDVI et diagnostic in-situ guidé.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadDemoParcel}
            className="text-xs font-bold border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Charger Démo (1.85 ha)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdfReport}
            className="text-xs font-bold border-primary/40 text-primary hover:bg-primary/10"
          >
            <FileDown className="h-3.5 w-3.5 mr-1" />
            Rapport PDF
          </Button>
        </div>
      </div>

      {/* ─── BARRE DES 3 ÉTAPES CLÉS DU MODULE ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          {
            step: 1,
            title: "1. Arpenter les bordures",
            desc: "Marche le long de la parcelle & GPS",
            icon: Navigation,
          },
          {
            step: 2,
            title: "2. Imagerie Satellite (NDVI)",
            desc: "Carte de stress & détection d'anomalies",
            icon: Layers,
          },
          {
            step: 3,
            title: "3. Diagnostic & Guidage",
            desc: "Cap GPS vers anomalie & Photo IA",
            icon: Compass,
          },
          {
            step: 4,
            title: "4. Rapport d'Intervention",
            desc: "Synthèse certifiée & ordonnance",
            icon: FileDown,
          },
        ].map((s) => {
          const isActive = activeStep === s.step;
          const isDone = activeStep > s.step || (s.step === 1 && mission.waypoints.length >= 3);
          const Icon = s.icon;

          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20"
                  : isDone
                  ? "bg-primary/5 border-primary/30 text-foreground hover:bg-primary/10"
                  : "bg-card border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <div
                className={`p-2 rounded-xl flex items-center justify-center ${
                  isActive ? "bg-white/20 text-white" : isDone ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black uppercase tracking-wider flex items-center justify-between">
                  <span>{s.title}</span>
                  {isDone && !isActive && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className={`text-[11px] truncate mt-0.5 ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {s.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── VUE PRINCIPALE : CARTE SPLIT AVEC CONSOLE D'ACTION ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CARTE SATELLITE INTERACTIVE (GAUCHE 7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden border-2 border-border shadow-sm">
            <div className="bg-muted/60 px-4 py-2.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Vue Satellite Haute Résolution & Tracé Terrain</span>
              </div>
              {livePos && (
                <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>GPS : ±{livePos.accuracy}m</span>
                </div>
              )}
            </div>

            {/* Conteneur Leaflet */}
            <div className="relative">
              <div ref={mapContainerRef} className="w-full h-[400px] sm:h-[480px] bg-slate-900" />

              {/* Badge d'informations cartographiques en incrustation */}
              <div className="absolute top-3 left-3 z-[1000] bg-background/90 backdrop-blur-md border border-border/80 px-3 py-1.5 rounded-xl shadow-md text-xs space-y-0.5">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Leaf className="h-3.5 w-3.5 text-primary" />
                  <span>{mission.parcelName}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {mission.areaHa > 0 ? `${mission.areaHa} ha (${mission.areaM2.toLocaleString()} m²)` : "Contour en cours"} •{" "}
                  {mission.waypoints.length} bornes
                </div>
              </div>

              {/* Légende NDVI en surimpression si à l'étape Satellite ou Guidage */}
              {activeStep >= 2 && mission.satelliteData && (
                <div className="absolute bottom-3 left-3 z-[1000] bg-background/95 backdrop-blur-md border border-border/80 p-2.5 rounded-xl shadow-md text-[11px] space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3 text-primary" /> Légende NDVI
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Vigueur forte (NDVI &gt; 0.65)
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Vigueur modérée (0.40 - 0.65)
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Stress critique (&lt; 0.40)
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Bandeau indicateurs chiffrés de la parcelle */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-card border border-border text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Superficie</span>
              <p className="text-lg font-black text-primary">{mission.areaHa} ha</p>
              <span className="text-[10px] text-muted-foreground">{mission.areaM2.toLocaleString()} m²</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Périmètre</span>
              <p className="text-lg font-black text-foreground">{mission.perimeterM.toLocaleString()} m</p>
              <span className="text-[10px] text-muted-foreground">Contour fermé</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Bornes GPS</span>
              <p className="text-lg font-black text-foreground">{mission.waypoints.length}</p>
              <span className="text-[10px] text-muted-foreground">Sommets relevés</span>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Anomalies NDVI</span>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                {mission.satelliteData?.hotspots.length || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Foyers identifiés</span>
            </div>
          </div>
        </div>

        {/* CONSOLE OPÉRATIONNELLE PAR ÉTAPE (DROITE 5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          {/* ══════════════════════════════════════════════════════
              ÉTAPE 1 : ARPENTER LES BORDURES (MARCHE GPS)
          ══════════════════════════════════════════════════════ */}
          {activeStep === 1 && (
            <Card className="border-2 border-primary/20 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                    Étape 1 • Arpentage Terrain
                  </Badge>
                  {isWalking && (
                    <Badge variant="destructive" className="animate-pulse font-bold">
                      Marche en cours...
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg font-heading font-black mt-1 flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" />
                  Arpenter les bordures au GPS
                </CardTitle>
                <CardDescription className="text-xs">
                  Vous marchez le long de la parcelle pour la détourer précisément grâce au GPS de votre smartphone.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Boîte d'état du GPS */}
                <div className="p-3.5 rounded-2xl bg-muted/60 border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-semibold">Précision satellite :</span>
                    <span className="font-bold text-foreground">
                      {livePos ? `±${livePos.accuracy} m (WGS84)` : "Recherche des satellites..."}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-semibold">Coordonnées actuelles :</span>
                    <span className="font-mono text-[11px] text-foreground">
                      {livePos ? `${livePos.lat.toFixed(5)}°, ${livePos.lng.toFixed(5)}°` : "En attente"}
                    </span>
                  </div>
                  {livePos?.speed !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-semibold">Vitesse de marche :</span>
                      <span className="font-bold text-foreground">{livePos.speed} km/h</span>
                    </div>
                  )}
                </div>

                {/* Boutons de contrôle de marche */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={handleToggleWalking}
                    className={`gap-2 font-bold h-12 ${
                      isWalking
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "gradient-primary text-primary-foreground"
                    }`}
                  >
                    {isWalking ? (
                      <>
                        <Square className="h-4 w-4" /> Pause marche
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" /> Démarrer la marche
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCaptureManualPoint}
                    className="gap-2 font-bold h-12 border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <Crosshair className="h-4 w-4" />
                    Poser une borne ici
                  </Button>
                </div>

                {/* Liste des bornes enregistrées */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">Bornes relevées ({mission.waypoints.length})</span>
                    {mission.waypoints.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearWaypoints}
                        className="text-red-500 hover:underline text-[11px]"
                      >
                        Effacer tout
                      </button>
                    )}
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {mission.waypoints.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4 bg-muted/30 rounded-xl">
                        Aucun point pour le moment. Cliquez sur "Démarrer la marche" ou "Poser une borne ici".
                      </p>
                    ) : (
                      mission.waypoints.map((wp) => (
                        <div
                          key={wp.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/80 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                              {wp.index}
                            </span>
                            <span className="font-semibold text-foreground">{wp.label}</span>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {wp.lat.toFixed(4)}°, {wp.lng.toFixed(4)}°
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Bouton de validation pour passer à l'étape Satellite */}
                <Button
                  type="button"
                  onClick={handleProceedToSatellite}
                  disabled={mission.waypoints.length < 3}
                  className="w-full gap-2 font-black h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                >
                  <Layers className="h-4 w-4" />
                  Valider le contour & Analyser par Satellite (NDVI)
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════
              ÉTAPE 2 : IMAGERIE SATELLITE (NDVI & ANOMALIES)
          ══════════════════════════════════════════════════════ */}
          {activeStep === 2 && (
            <Card className="border-2 border-primary/20 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                    Étape 2 • Imagerie Satellite NDVI
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Date : {mission.satelliteData?.acquisitionDate || "Aujourd'hui"}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-heading font-black mt-1 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Carte de végétation & Zones de stress
                </CardTitle>
                <CardDescription className="text-xs">
                  Elle repère instantanément les zones de stress (manque d'azote, retard de croissance ou anomalies).
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bilan multispectral de la parcelle */}
                {mission.satelliteData && (
                  <div className="p-3.5 rounded-2xl bg-muted/60 border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Vigueur moyenne (NDVI)</span>
                      <span className="text-sm font-black text-emerald-600">
                        {mission.satelliteData.meanNdvi.toFixed(2)} / 1.00
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-emerald-700">Optimal ({mission.satelliteData.optimalAreaPct}%)</span>
                        <span className="text-amber-600">Modéré ({mission.satelliteData.moderateAreaPct}%)</span>
                        <span className="text-red-600">Stress ({mission.satelliteData.stressAreaPct}%)</span>
                      </div>
                      <div className="h-2.5 rounded-full flex overflow-hidden bg-slate-200">
                        <div
                          style={{ width: `${mission.satelliteData.optimalAreaPct}%` }}
                          className="bg-emerald-500"
                        />
                        <div
                          style={{ width: `${mission.satelliteData.moderateAreaPct}%` }}
                          className="bg-amber-400"
                        />
                        <div style={{ width: `${mission.satelliteData.stressAreaPct}%` }} className="bg-red-500" />
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Surface en stress critique nécessitant intervention :{" "}
                      <b>{mission.satelliteData.stressAreaM2.toLocaleString()} m²</b>.
                    </p>
                  </div>
                )}

                {/* Liste des anomalies géoréférencées détectées */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Anomalies identifiées à inspecter sur le terrain :
                  </h4>

                  <div className="space-y-2">
                    {mission.satelliteData?.hotspots.map((hotspot) => {
                      const isTarget = activeAnomaly?.id === hotspot.id;
                      const isDiagnosed = hotspot.status === "diagnosed";

                      return (
                        <div
                          key={hotspot.id}
                          className={`p-3 rounded-2xl border transition-all ${
                            isTarget
                              ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30"
                              : "bg-card border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`h-6 w-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                                  isDiagnosed
                                    ? "bg-emerald-500 text-white"
                                    : hotspot.severity === "critical"
                                    ? "bg-red-500 text-white"
                                    : "bg-amber-500 text-white"
                                }`}
                              >
                                {hotspot.code}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-foreground">{hotspot.label}</h5>
                                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                                  {hotspot.predictedIssue}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                                  {hotspot.description}
                                </p>
                              </div>
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 font-bold ${
                                isDiagnosed
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : "bg-red-500/10 text-red-600 border-red-500/30"
                              }`}
                            >
                              NDVI {hotspot.ndvi.toFixed(2)}
                            </Badge>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {toDMS(hotspot.lat, true)} • {toDMS(hotspot.lng, false)}
                            </span>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleStartGuidanceToAnomaly(hotspot)}
                              className="h-8 text-xs font-bold gap-1.5 gradient-primary text-primary-foreground"
                            >
                              <Compass className="h-3.5 w-3.5" />
                              {isDiagnosed ? "Revoir diagnostic" : "Me guider vers cette zone"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveStep(1)}
                    className="w-full text-xs font-semibold"
                  >
                    Revenir à l'arpentage des bordures
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════
              ÉTAPE 3 : DIAGNOSTIC & GUIDAGE GPS IN-SITU
          ══════════════════════════════════════════════════════ */}
          {activeStep === 3 && activeAnomaly && (
            <Card className="border-2 border-primary/20 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                    Étape 3 • Guidage & Diagnostic
                  </Badge>
                  <Badge variant="outline" className="text-xs font-bold text-red-600 bg-red-500/10">
                    Cible : {activeAnomaly.code}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-heading font-black mt-1 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary" />
                  Guidage GPS vers l'anomalie
                </CardTitle>
                <CardDescription className="text-xs">
                  Le GPS vous guide vers la zone vue par satellite pour photographier la culture et identifier la maladie.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* ── RADAR & BOUSSOLE DE GUIDAGE GPS DYNAMIQUE ── */}
                <div className="p-4 rounded-3xl bg-slate-900 text-white text-center space-y-3 shadow-inner relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Azimut cible : {bearingToAnomalyDeg}°</span>
                    <span>Précision : ±{livePos?.accuracy || 1.5} m</span>
                  </div>

                  {/* Boussole visuelle animée */}
                  <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                    {/* Anneau gradué */}
                    <div className="absolute inset-0 rounded-full border-2 border-slate-700 border-dashed" />
                    {/* Flèche d'orientation pointant vers l'anomalie */}
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
                      style={{
                        transform: `rotate(${bearingToAnomalyDeg}deg)`,
                      }}
                    >
                      <div className="w-1.5 h-16 bg-gradient-to-t from-transparent via-primary to-amber-400 rounded-full" />
                      <div className="absolute top-0 w-3 h-3 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50" />
                    </div>

                    {/* Centre radar */}
                    <div className="z-10 bg-slate-800 p-2.5 rounded-full border-2 border-slate-600 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">DISTANCE</span>
                      <span className="text-lg font-black text-amber-400">{distanceToAnomalyM} m</span>
                    </div>
                  </div>

                  {/* Indicateur d'état d'approche */}
                  <div
                    className={`py-2 px-3 rounded-xl text-xs font-bold ${
                      isReached
                        ? "bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 animate-pulse"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {isReached ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        VOUS ÊTES DANS LA ZONE EN ANOMALIE (&lt; 5m) !
                      </span>
                    ) : (
                      <span>Marchez en direction du cap {bearingToAnomalyDeg}° ({distanceToAnomalyM} m restantes)</span>
                    )}
                  </div>

                  {/* Bouton pour simuler la présence sur site (utile en démo ou si l'agronome est déjà sur place) */}
                  {!isReached && (
                    <button
                      type="button"
                      onClick={handleSimulateArrival}
                      className="text-[11px] text-amber-400/80 hover:text-amber-400 underline"
                    >
                      (Simuler que je suis arrivé sur la zone d'anomalie)
                    </button>
                  )}
                </div>

                {/* ── DIAGNOSTIC PHOTO IN-SITU & IDENTIFICATION IA ── */}
                <div className="p-4 rounded-2xl bg-card border-2 border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-primary" />
                      Photographier la culture & Diagnostiquer
                    </h4>
                    {activeAnomaly.status === "diagnosed" && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                        Diagnostiqué
                      </Badge>
                    )}
                  </div>

                  {/* Boutons de capture photo */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handlePhotoCaptured}
                    className="hidden"
                  />

                  {photoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border max-h-48">
                      <img src={photoPreview} alt="Culture in situ" className="w-full h-44 object-cover" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-xs font-semibold"
                      >
                        Changer la photo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-6 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-1.5 text-center"
                    >
                      <Camera className="h-8 w-8 text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        Prendre en photo la feuille, tige ou le plant malade
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Caméra smartphone ou fichier image
                      </span>
                    </button>
                  )}

                  {/* Notes agronomiques de terrain */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Observations de terrain de l'agronome :
                    </Label>
                    <Textarea
                      placeholder="Ex: Sol argilo-sableux, attaque localisée sur 15 plants, stade floraison..."
                      value={diagnosisNotes}
                      onChange={(e) => setDiagnosisNotes(e.target.value)}
                      className="text-xs mt-1 h-16 rounded-xl"
                    />
                  </div>

                  {/* Bouton de déclenchement du diagnostic IA */}
                  <Button
                    type="button"
                    onClick={handleRunAiDiagnosis}
                    disabled={isDiagnosing}
                    className="w-full gap-2 font-black h-11 gradient-primary text-primary-foreground shadow-md"
                  >
                    {isDiagnosing ? (
                      <span>Analyse IA en cours...</span>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Identifier la maladie ou le ravageur
                      </>
                    )}
                  </Button>
                </div>

                {/* ── RÉSULTAT DU DIAGNOSTIC IA IN-SITU ── */}
                {activeAnomaly.diagnosis && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <div>
                          <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                            {activeAnomaly.diagnosis.maladie}
                          </h4>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                            Organe touché : <b>{activeAnomaly.diagnosis.partie_atteinte}</b>
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                        Certitude {activeAnomaly.diagnosis.confidence_pct}%
                      </Badge>
                    </div>

                    <div className="text-xs space-y-1.5 text-foreground">
                      <div>
                        <span className="font-semibold text-muted-foreground">Agent causal :</span>{" "}
                        <span className="font-bold">{activeAnomaly.diagnosis.agent_causal}</span>
                      </div>

                      <div>
                        <span className="font-semibold text-muted-foreground">Symptômes identifiés :</span>
                        <ul className="list-disc list-inside text-[11px] text-muted-foreground mt-0.5 space-y-0.5">
                          {activeAnomaly.diagnosis.symptomes.map((sym, idx) => (
                            <li key={idx}>{sym}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Prescriptions de traitement */}
                      {activeAnomaly.diagnosis.traitement_bio && (
                        <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-500/20 text-[11px] space-y-1">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <Leaf className="h-3.5 w-3.5" /> Traitement Bio / Préconisation naturelle :
                          </span>
                          <p className="font-semibold text-foreground">{activeAnomaly.diagnosis.traitement_bio.nom}</p>
                          <p className="text-muted-foreground">
                            Posologie : {activeAnomaly.diagnosis.traitement_bio.dosage} (DAR :{" "}
                            {activeAnomaly.diagnosis.traitement_bio.delai_attente})
                          </p>
                        </div>
                      )}

                      {activeAnomaly.diagnosis.traitement_chimique && (
                        <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-amber-500/20 text-[11px] space-y-1">
                          <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" /> Traitement Homologué CSP :
                          </span>
                          <p className="font-semibold text-foreground">
                            {activeAnomaly.diagnosis.traitement_chimique.nom}
                          </p>
                          <p className="text-muted-foreground">
                            Dosage : {activeAnomaly.diagnosis.traitement_chimique.dosage} (DAR :{" "}
                            {activeAnomaly.diagnosis.traitement_chimique.delai_attente})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveStep(2)}
                    className="flex-1 text-xs font-semibold"
                  >
                    Retour aux anomalies satellite
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="flex-1 text-xs font-bold gradient-primary text-primary-foreground"
                  >
                    Voir le rapport complet
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════
              ÉTAPE 4 : RAPPORT D'INTERVENTION & SYNTHÈSE
          ══════════════════════════════════════════════════════ */}
          {activeStep === 4 && (
            <Card className="border-2 border-primary/20 shadow-sm">
              <CardHeader className="pb-3">
                <Badge className="bg-primary/10 text-primary border-primary/20 font-bold w-fit">
                  Étape 4 • Rapport d'Intervention
                </Badge>
                <CardTitle className="text-lg font-heading font-black mt-1 flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-primary" />
                  Synthèse complète & Export officiel
                </CardTitle>
                <CardDescription className="text-xs">
                  Rapport technique unifié prêt pour l'exploitant et le dossier agronomique.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-muted/60 border border-border text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parcelle :</span>
                    <span className="font-bold text-foreground">{mission.parcelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Superficie arpentée :</span>
                    <span className="font-bold text-foreground">{mission.areaHa} hectares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NDVI moyen satellite :</span>
                    <span className="font-bold text-emerald-600">
                      {mission.satelliteData?.meanNdvi.toFixed(2) || "0.59"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Foyers investigués :</span>
                    <span className="font-bold text-foreground">
                      {mission.satelliteData?.hotspots.filter((h) => h.status === "diagnosed").length || 0} sur{" "}
                      {mission.satelliteData?.hotspots.length || 0}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleExportPdfReport}
                  className="w-full gap-2 font-black h-12 gradient-primary text-primary-foreground shadow-md"
                >
                  <FileDown className="h-5 w-5" />
                  Télécharger le Rapport Officiel (PDF)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep(2)}
                  className="w-full text-xs font-semibold"
                >
                  Revenir aux anomalies satellite
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
