import React, { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Navigation,
  MapPin,
  Play,
  Square,
  Plus,
  Trash2,
  FileDown,
  Layers,
  Save,
  RotateCcw,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileText,
  Clock,
  ArrowUp,
  ArrowDown,
  Crosshair,
  Share2,
  Globe,
  Upload,
  Download,
  Eye,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import {
  SurveyWaypoint,
  GpsSurveySession,
  WaypointCategory,
  calculateDistanceM,
  calculateBearingDeg,
  calculatePolygonAreaM2,
  calculatePerimeterM,
  calculateCentroid,
  toDMS,
  parseDMSToDD,
  toApproximateUtmZone30N,
  enrichWaypoints,
  gpsSurveyStorage,
  exportToGeoJson,
  exportToGpx,
  exportToKml,
  exportToCsv,
  generateGpsSurveyPdf,
} from "@/lib/gpsSurveyEngine";

import { partnerBrandingStorage } from "@/lib/partnerBrandingStorage";
import { pdfExportHistory } from "@/lib/pdfExportHistory";
import PdfExportHistoryModal from "@/components/export/PdfExportHistoryModal";
import BackNavigationButton from "@/components/BackNavigationButton";
import { useOfflineData } from "@/hooks/useOfflineData";

const CATEGORY_LABELS: Record<WaypointCategory, string> = {
  borne: "Borne de limite",
  sommet: "Sommet de parcelle",
  forage: "Forage hydraulique",
  puits: "Puits maraîcher",
  batiment: "Bâtiment / Hangar",
  magasin: "Magasin de stockage",
  cloture: "Angle de clôture",
  arbre_repere: "Arbre repère",
  autre: "Point d'intérêt",
};

export default function GpsSurveyPage() {
  // ─── 1. ÉTAT DU LEVÉ ET DE LA SESSION ───
  const [sessionName, setSessionName] = useState<string>("Levé Topographique N°1");
  const [parcelName, setParcelName] = useState<string>("Parcelle Principale");
  const [clientName, setClientName] = useState<string>("");
  const [producerPhone, setProducerPhone] = useState<string>("");
  const [locality, setLocality] = useState<string>("Ouagadougou");
  const [waypoints, setWaypoints] = useState<SurveyWaypoint[]>([]);
  const [isPolygonClosed, setIsPolygonClosed] = useState<boolean>(true);

  // ─── 2. ÉTAT DU GPS EN DIRECT ───
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [livePos, setLivePos] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  } | null>(null);

  // Mode marche continue (track en direct)
  const [isAutoTracking, setIsAutoTracking] = useState<boolean>(false);
  const [trackDistanceThresholdM, setTrackDistanceThresholdM] = useState<number>(3);
  const watchIdRef = useRef<number | null>(null);

  // ─── 3. MODALES ET INTERFACES ───
  const [showManualAddModal, setShowManualAddModal] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState({
    label: "",
    category: "borne" as WaypointCategory,
    latStr: "",
    lngStr: "",
    altitudeStr: "",
    notes: "",
  });
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showPdfHistory, setShowPdfHistory] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showSaveToParcelModal, setShowSaveToParcelModal] = useState<boolean>(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");

  // ─── 4. CARTE LEAFLET ───
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const liveLocationMarkerRef = useRef<L.CircleMarker | null>(null);
  const liveAccuracyCircleRef = useRef<L.Circle | null>(null);
  const [mapLayerType, setMapLayerType] = useState<"satellite" | "streets">("satellite");
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);

  // ─── 5. DONNÉES LOCALES / SUPABASE ───
  const { data: farms } = useOfflineData({ table: "farms", select: "id, name" });
  const { insertRow: insertParcel } = useOfflineData({ table: "parcels", select: "id, name" });
  const [savedSessions, setSavedSessions] = useState<GpsSurveySession[]>([]);

  // Recharger les sessions sauvegardées
  useEffect(() => {
    setSavedSessions(gpsSurveyStorage.getAll());
    const handleUpdate = () => setSavedSessions(gpsSurveyStorage.getAll());
    window.addEventListener("nafa_gps_surveys_updated", handleUpdate);
    return () => window.removeEventListener("nafa_gps_surveys_updated", handleUpdate);
  }, []);

  // ─── 6. DÉMARRAGE ET SURVEILLANCE GPS ───
  const startGpsMonitoring = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation GPS n'est pas supportée sur cet appareil.");
      return;
    }

    if (watchIdRef.current !== null) return;

    setGpsActive(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude, speed, heading } = pos.coords;
        const currentData = {
          lat: Math.round(latitude * 1000000) / 1000000,
          lng: Math.round(longitude * 1000000) / 1000000,
          accuracy: Math.round(accuracy * 10) / 10,
          altitude: altitude ? Math.round(altitude * 10) / 10 : undefined,
          speed: speed ? Math.round(speed * 3.6 * 10) / 10 : undefined,
          heading: heading ? Math.round(heading) : undefined,
        };
        setLivePos(currentData);

        // Si le mode marche continue est actif, vérifier la distance depuis le dernier point
        if (isAutoTracking) {
          setWaypoints((prev) => {
            if (prev.length > 0) {
              const last = prev[prev.length - 1];
              const dist = calculateDistanceM(last, currentData);
              if (dist >= trackDistanceThresholdM) {
                const newPoint: SurveyWaypoint = {
                  id: `wp_${Date.now()}_${prev.length + 1}`,
                  index: prev.length + 1,
                  label: `P${prev.length + 1}`,
                  category: "sommet",
                  lat: currentData.lat,
                  lng: currentData.lng,
                  altitude: currentData.altitude,
                  accuracy: currentData.accuracy,
                  timestamp: Date.now(),
                };
                return enrichWaypoints([...prev, newPoint], isPolygonClosed);
              }
              return prev;
            } else {
              const firstPoint: SurveyWaypoint = {
                id: `wp_${Date.now()}_1`,
                index: 1,
                label: "P1",
                category: "sommet",
                lat: currentData.lat,
                lng: currentData.lng,
                altitude: currentData.altitude,
                accuracy: currentData.accuracy,
                timestamp: Date.now(),
              };
              return [firstPoint];
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
  }, [isAutoTracking, trackDistanceThresholdM, isPolygonClosed]);

  const stopGpsMonitoring = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsActive(false);
  }, []);

  useEffect(() => {
    startGpsMonitoring();
    return () => {
      stopGpsMonitoring();
    };
  }, [startGpsMonitoring, stopGpsMonitoring]);

  // ─── 7. INITIALISATION DE LA CARTE LEAFLET ───
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centrage initial sur le Burkina Faso
    const map = L.map(mapContainerRef.current, {
      center: [12.3714, -1.5197],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    // Fond Satellite
    const satLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    );
    const satLabels = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    );
    const satGroup = L.layerGroup([satLayer, satLabels]).addTo(map);
    satelliteLayerRef.current = satGroup as any;

    // Fond Rues OSM
    const streetLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 19 }
    );
    streetLayerRef.current = streetLayer;

    // Couches géométriques
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Bascule du fond de carte
  const handleToggleMapLayer = (layer: "satellite" | "streets") => {
    setMapLayerType(layer);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layer === "satellite") {
      streetLayerRef.current?.remove();
      satelliteLayerRef.current?.addTo(map);
    } else {
      satelliteLayerRef.current?.remove();
      streetLayerRef.current?.addTo(map);
    }
  };

  // Mise à jour de la position GPS en direct sur la carte
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !livePos) return;

    const latLng: [number, number] = [livePos.lat, livePos.lng];

    if (!liveLocationMarkerRef.current) {
      // Marqueur bleu avec halo pulsant
      const marker = L.circleMarker(latLng, {
        radius: 8,
        fillColor: "#0284c7",
        color: "#ffffff",
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);
      liveLocationMarkerRef.current = marker;

      // Cercle de précision
      const circle = L.circle(latLng, {
        radius: livePos.accuracy,
        color: "#0284c7",
        weight: 1,
        fillColor: "#38bdf8",
        fillOpacity: 0.15,
      }).addTo(map);
      liveAccuracyCircleRef.current = circle;

      // Premier centrage automatique
      map.setView(latLng, 16);
    } else {
      liveLocationMarkerRef.current.setLatLng(latLng);
      if (liveAccuracyCircleRef.current) {
        liveAccuracyCircleRef.current.setLatLng(latLng);
        liveAccuracyCircleRef.current.setRadius(livePos.accuracy);
      }
    }
  }, [livePos]);

  // Mise à jour des points et polygone du levé sur la carte
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Nettoyer les marqueurs précédents
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }
    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }
    if (polylineLayerRef.current) {
      polylineLayerRef.current.remove();
      polylineLayerRef.current = null;
    }

    if (waypoints.length === 0) return;

    const latLngs = waypoints.map((w) => [w.lat, w.lng] as [number, number]);

    // 2. Dessiner les marqueurs de bornes
    waypoints.forEach((wp) => {
      const isFirst = wp.index === 1;
      const html = `
        <div style="
          background: ${isFirst ? "#15803d" : "#0f766e"};
          color: white;
          border: 2px solid white;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 11px;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 6px rgba(0,0,0,0.35);
        ">
          ${wp.index}
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-survey-marker",
        html,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const utm = toApproximateUtmZone30N(wp.lat, wp.lng);
      const marker = L.marker([wp.lat, wp.lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #15803d; font-size: 13px;">${wp.label}</strong> (${CATEGORY_LABELS[wp.category]})<br/>
          <strong>Lat :</strong> ${wp.lat.toFixed(6)}° (${toDMS(wp.lat, true)})<br/>
          <strong>Lng :</strong> ${wp.lng.toFixed(6)}° (${toDMS(wp.lng, false)})<br/>
          <strong>UTM 30N :</strong> X=${utm.easting} Y=${utm.northing}<br/>
          <strong>Précision :</strong> ±${wp.accuracy ?? 0}m | <strong>Alt :</strong> ${wp.altitude ?? 0}m<br/>
          ${wp.distanceToNextM ? `<strong>Vers point suivant :</strong> ${wp.distanceToNextM} m (Cap ${wp.bearingToNextDeg}°)` : ""}
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayerRef.current?.addLayer(marker);
    });

    // 3. Dessiner le polygone ou polyline
    if (waypoints.length >= 3 && isPolygonClosed) {
      const polygon = L.polygon(latLngs, {
        color: "#16a34a",
        weight: 3,
        fillColor: "#22c55e",
        fillOpacity: 0.25,
      }).addTo(map);
      polygonLayerRef.current = polygon;
    } else if (waypoints.length >= 2) {
      const polyline = L.polyline(latLngs, {
        color: "#eab308",
        weight: 3,
        dashArray: "6, 6",
      }).addTo(map);
      polylineLayerRef.current = polyline;
    }
  }, [waypoints, isPolygonClosed]);

  // ─── 8. CALCULS GÉODÉSIQUES EN TEMPS RÉEL ───
  const areaM2 = calculatePolygonAreaM2(waypoints);
  const areaHa = Math.round((areaM2 / 10000) * 1000) / 1000;
  const perimeterM = calculatePerimeterM(waypoints);
  const centroid = calculateCentroid(waypoints);
  const averageAccuracyM =
    waypoints.length > 0
      ? Math.round((waypoints.reduce((s, w) => s + (w.accuracy || 0), 0) / waypoints.length) * 10) / 10
      : 0;

  // ─── 9. ACTIONS DE LEVÉ DE POINTS ───

  // Capturer la position GPS courante
  const handleCaptureCurrentPosition = () => {
    if (!livePos) {
      toast.error("Signal GPS non acquis. Veuillez patienter ou vérifier l'autorisation de géolocalisation.");
      return;
    }

    const nextIdx = waypoints.length + 1;
    const newPoint: SurveyWaypoint = {
      id: `wp_${Date.now()}_${nextIdx}`,
      index: nextIdx,
      label: `Borne P${nextIdx}`,
      category: "borne",
      lat: livePos.lat,
      lng: livePos.lng,
      altitude: livePos.altitude,
      accuracy: livePos.accuracy,
      timestamp: Date.now(),
    };

    const nextWaypoints = enrichWaypoints([...waypoints, newPoint], isPolygonClosed);
    setWaypoints(nextWaypoints);

    toast.success(`Point P${nextIdx} capturé (Précision ±${livePos.accuracy}m).`);
  };

  // Ajout manuel d'un point par coordonnées
  const handleSaveManualPoint = () => {
    const lat = parseDMSToDD(manualForm.latStr);
    const lng = parseDMSToDD(manualForm.lngStr);

    if (lat === null || lng === null) {
      toast.error("Veuillez saisir des coordonnées valides (ex: 12.371428 ou 12° 22' 17\" N).");
      return;
    }

    const nextIdx = waypoints.length + 1;
    const newPoint: SurveyWaypoint = {
      id: `wp_${Date.now()}_${nextIdx}`,
      index: nextIdx,
      label: manualForm.label.trim() || `Borne P${nextIdx}`,
      category: manualForm.category,
      lat,
      lng,
      altitude: manualForm.altitudeStr ? parseFloat(manualForm.altitudeStr) : undefined,
      accuracy: 0,
      timestamp: Date.now(),
      notes: manualForm.notes.trim() || undefined,
    };

    const nextWaypoints = enrichWaypoints([...waypoints, newPoint], isPolygonClosed);
    setWaypoints(nextWaypoints);
    setShowManualAddModal(false);

    setManualForm({
      label: "",
      category: "borne",
      latStr: "",
      lngStr: "",
      altitudeStr: "",
      notes: "",
    });

    toast.success(`Point ${newPoint.label} ajouté manuellement.`);
  };

  // Supprimer un point
  const handleRemovePoint = (indexToRemove: number) => {
    const filtered = waypoints.filter((_, idx) => idx !== indexToRemove);
    setWaypoints(enrichWaypoints(filtered, isPolygonClosed));
    toast.info("Point retiré du levé.");
  };

  // Réorganiser un point
  const handleMovePoint = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= waypoints.length) return;

    const copy = [...waypoints];
    const item = copy.splice(fromIndex, 1)[0];
    copy.splice(toIndex, 0, item);

    setWaypoints(enrichWaypoints(copy, isPolygonClosed));
  };

  // Centrer la carte sur un point précis
  const handleZoomToPoint = (wp: SurveyWaypoint) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setView([wp.lat, wp.lng], 18);
    }
  };

  // Centrer la carte sur l'ensemble de la parcelle
  const handleFitBoundsToField = () => {
    const map = mapInstanceRef.current;
    if (!map || waypoints.length === 0) return;

    const bounds = L.latLngBounds(waypoints.map((w) => [w.lat, w.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  };

  // Centrer sur la position de l'utilisateur
  const handleCenterOnUser = () => {
    const map = mapInstanceRef.current;
    if (map && livePos) {
      map.setView([livePos.lat, livePos.lng], 17);
    }
  };

  // ─── 10. SAUVEGARDE & PERSISTANCE DU LEVÉ ───
  const handleSaveSession = () => {
    if (waypoints.length === 0) {
      toast.error("Aucun point GPS dans ce levé.");
      return;
    }

    const session: GpsSurveySession = {
      id: `survey_${Date.now()}`,
      title: sessionName,
      parcelName,
      clientName: clientName || "Client NAFA",
      producerPhone,
      locality,
      surveyDate: new Date().toISOString(),
      mode: isPolygonClosed ? "polygon" : "waypoints",
      waypoints,
      areaM2,
      areaHa,
      perimeterM,
      centroid,
      averageAccuracyM,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    gpsSurveyStorage.save(session);
    setSavedSessions(gpsSurveyStorage.getAll());
    toast.success("Levé topographique enregistré dans votre base locale avec succès !");
  };

  // Charger une session précédente
  const handleLoadSession = (session: GpsSurveySession) => {
    setSessionName(session.title);
    setParcelName(session.parcelName);
    setClientName(session.clientName);
    setProducerPhone(session.producerPhone || "");
    setLocality(session.locality);
    setWaypoints(session.waypoints);
    setIsPolygonClosed(session.mode === "polygon");
    setShowHistoryModal(false);

    toast.success(`Levé « ${session.title} » restauré (${session.waypoints.length} points).`);

    setTimeout(() => {
      const map = mapInstanceRef.current;
      if (map && session.waypoints.length > 0) {
        const bounds = L.latLngBounds(session.waypoints.map((w) => [w.lat, w.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }, 200);
  };

  // ─── 11. EXPORTS ET RAPPORTS PDF ───

  // Export PDF Officiel
  const handleExportPdf = () => {
    if (waypoints.length === 0) {
      toast.error("Veuillez d'abord relever des coordonnées GPS.");
      return;
    }

    const session: GpsSurveySession = {
      id: `survey_${Date.now()}`,
      title: sessionName,
      parcelName,
      clientName: clientName || "Client NAFA",
      producerPhone,
      locality,
      surveyDate: new Date().toISOString(),
      mode: isPolygonClosed ? "polygon" : "waypoints",
      waypoints,
      areaM2,
      areaHa,
      perimeterM,
      centroid,
      averageAccuracyM,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const branding = partnerBrandingStorage.get();
    const doc = generateGpsSurveyPdf(session, branding);

    const filename = `Proces_Verbal_Leve_GPS_${parcelName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Enregistrement dans l'historique universel des PDF (avec téléchargement automatique)
    pdfExportHistory.saveAndRecordPdf({
      title: `Procès-Verbal de Levé GPS — ${parcelName}`,
      filename,
      module: "cartography",
      categoryLabel: "Levé Topographique & Géodésie",
      doc,
      clientName: clientName || undefined,
      summary: `Arpentage officiel : ${waypoints.length} bornes. Superficie nette : ${areaHa} ha (${areaM2} m²). Périmètre : ${perimeterM} m. Précision satellite moyenne : ±${averageAccuracyM}m.`,
      dataSnapshot: {
        parcelName,
        clientName,
        locality,
        areaHa,
        areaM2,
        perimeterM,
        pointsCount: waypoints.length,
        averageAccuracyM,
      },
    });
  };

  // Téléchargement d'un fichier texte (GeoJSON, GPX, KML, CSV)
  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJson = () => {
    const session = createCurrentSessionSnapshot();
    const json = exportToGeoJson(session);
    downloadTextFile(json, `Leve_${parcelName.replace(/\s+/g, "_")}.geojson`, "application/geo+json");
    toast.success("Fichier GeoJSON exporté.");
  };

  const handleExportGpx = () => {
    const session = createCurrentSessionSnapshot();
    const gpx = exportToGpx(session);
    downloadTextFile(gpx, `Leve_${parcelName.replace(/\s+/g, "_")}.gpx`, "application/gpx+xml");
    toast.success("Fichier GPX exporté (compatible Garmin/GPS).");
  };

  const handleExportKml = () => {
    const session = createCurrentSessionSnapshot();
    const kml = exportToKml(session);
    downloadTextFile(kml, `Leve_${parcelName.replace(/\s+/g, "_")}.kml`, "application/vnd.google-earth.kml+xml");
    toast.success("Fichier KML exporté (compatible Google Earth).");
  };

  const handleExportCsv = () => {
    const session = createCurrentSessionSnapshot();
    const csv = exportToCsv(session);
    downloadTextFile(csv, `Coordonnees_Bornes_${parcelName.replace(/\s+/g, "_")}.csv`, "text/csv;charset=utf-8;");
    toast.success("Fichier CSV des bornes exporté.");
  };

  const createCurrentSessionSnapshot = (): GpsSurveySession => ({
    id: `survey_${Date.now()}`,
    title: sessionName,
    parcelName,
    clientName: clientName || "Client NAFA",
    producerPhone,
    locality,
    surveyDate: new Date().toISOString(),
    mode: isPolygonClosed ? "polygon" : "waypoints",
    waypoints,
    areaM2,
    areaHa,
    perimeterM,
    centroid,
    averageAccuracyM,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // ─── 12. ENREGISTREMENT DANS LES PARCELLES DE L'APPLICATION ───
  const handleSaveToAppParcels = async () => {
    if (!selectedFarmId) {
      toast.error("Veuillez sélectionner l'exploitation agricole de rattachement.");
      return;
    }
    if (waypoints.length < 3) {
      toast.error("Il faut au minimum 3 sommets pour enregistrer une parcelle cadastrale.");
      return;
    }

    const ring = waypoints.map((w) => [w.lng, w.lat]);
    ring.push([waypoints[0].lng, waypoints[0].lat]);

    const geometry = {
      type: "Polygon",
      coordinates: [ring],
    };

    try {
      await insertParcel({
        farm_id: selectedFarmId,
        name: parcelName,
        area_ha: areaHa,
        calculated_area_ha: areaHa,
        perimeter_m: perimeterM,
        latitude: centroid.lat,
        longitude: centroid.lng,
        geometry,
        status: "active",
      });

      setShowSaveToParcelModal(false);
      toast.success(`Parcelle « ${parcelName} » (${areaHa} ha) enregistrée dans votre exploitation !`);
    } catch (_e) {
      toast.error("Erreur lors de l'enregistrement de la parcelle.");
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ─── EN-TÊTE DE LA PAGE ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-foreground flex items-center gap-2">
              <Navigation className="h-6 w-6 text-primary" />
              Levé de Coordonnées GPS & Arpentage
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Relevé topographique de terrain, bornage géodésique WGS84, calcul de surface nette et rapports officiels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHistoryModal(true)}
            className="text-xs font-semibold gap-1.5 border-primary/30 hover:bg-primary/10"
          >
            <Clock className="h-4 w-4 text-primary" />
            Mes Levés ({savedSessions.length})
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPdfHistory(true)}
            className="text-xs font-semibold gap-1.5 border-primary/30 hover:bg-primary/10"
          >
            <FileText className="h-4 w-4 text-primary" />
            Historique PDF
          </Button>

          <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5 font-mono text-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> WGS84 / UTM 30N
          </Badge>
        </div>
      </div>

      {/* ─── BANDEAU DE STATUT DU SIGNAL GPS ─── */}
      <Card className="border-primary/20 bg-gradient-to-r from-background via-muted/20 to-primary/5">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  livePos
                    ? livePos.accuracy <= 5
                      ? "bg-emerald-500 animate-pulse"
                      : livePos.accuracy <= 10
                      ? "bg-amber-500"
                      : "bg-red-500"
                    : "bg-muted-foreground"
                }`}
              />
              <div>
                <span className="font-bold text-foreground">
                  {livePos ? "Signal Satellite Fixé" : "Recherche de satellites..."}
                </span>
                <span className="text-muted-foreground ml-2">
                  Précision :{" "}
                  <strong className={livePos && livePos.accuracy <= 5 ? "text-emerald-600 font-mono" : "font-mono"}>
                    {livePos ? `±${livePos.accuracy} m` : "En attente"}
                  </strong>
                </span>
              </div>
            </div>

            {livePos && (
              <div className="flex items-center gap-4 text-muted-foreground font-mono text-[11px]">
                <span>
                  Lat : <strong className="text-foreground">{livePos.lat.toFixed(6)}°</strong> ({toDMS(livePos.lat, true)})
                </span>
                <span>
                  Lng : <strong className="text-foreground">{livePos.lng.toFixed(6)}°</strong> ({toDMS(livePos.lng, false)})
                </span>
                {livePos.altitude !== undefined && (
                  <span>
                    Alt : <strong className="text-foreground">{livePos.altitude} m</strong>
                  </span>
                )}
                {livePos.speed !== undefined && (
                  <span>
                    Vitesse : <strong className="text-foreground">{livePos.speed} km/h</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── 4 CARTES DE MÉTRIQUES EN TEMPS RÉEL ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-2 border-primary/20 bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
              Superficie Nette
            </span>
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {areaHa.toFixed(3)} <span className="text-sm font-normal text-muted-foreground">ha</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {areaM2.toLocaleString("fr-FR")} m²
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
              Périmètre Total
            </span>
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {perimeterM.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">m</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {(perimeterM / 1000).toFixed(3)} km de clôture
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
              Bornes & Sommets
            </span>
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {waypoints.length} <span className="text-sm font-normal text-muted-foreground">points</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isPolygonClosed ? "Polygone fermé" : "Tracé ouvert"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
              Précision Moyenne
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
              {waypoints.length > 0 ? `±${averageAccuracyM} m` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {averageAccuracyM > 0 && averageAccuracyM <= 3
                ? "Qualité centimétrique/haute"
                : averageAccuracyM <= 8
                ? "Conforme arpentage agricole"
                : "Standard satellite"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── DISPOSITION PRINCIPALE (CARTE + CONTRÔLES + TABLEAU) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLONNE GAUCHE (7 COLONNES) : CARTE ET GRANDES ACTIONS TACTILES */}
        <div className="lg:col-span-7 space-y-4">
          {/* CARTE LEAFLET */}
          <Card className="overflow-hidden border-2 border-primary/20 shadow-md">
            <div className="relative w-full h-[400px] sm:h-[480px]">
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* CONTRÔLES FLOTTANTS SUR LA CARTE */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCenterOnUser}
                  className="h-9 w-9 p-0 rounded-xl shadow-md bg-background/90 hover:bg-background"
                  title="Centrer sur ma position"
                >
                  <Crosshair className="h-4 w-4 text-primary" />
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleFitBoundsToField}
                  disabled={waypoints.length === 0}
                  className="h-9 w-9 p-0 rounded-xl shadow-md bg-background/90 hover:bg-background"
                  title="Ajuster sur la parcelle"
                >
                  <Compass className="h-4 w-4 text-primary" />
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleToggleMapLayer(mapLayerType === "satellite" ? "streets" : "satellite")}
                  className="h-9 w-9 p-0 rounded-xl shadow-md bg-background/90 hover:bg-background"
                  title="Basculer Satellite / Rues"
                >
                  <Layers className="h-4 w-4 text-primary" />
                </Button>
              </div>

              {/* Indicateur de couche active */}
              <div className="absolute bottom-3 left-3 z-10 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                {mapLayerType === "satellite" ? "Imagerie Satellite ArcGIS" : "Rues & Chemins OSM"}
              </div>
            </div>
          </Card>

          {/* ─── BOUTONS D'ACTION TACTILE PLEIN SOLEIL (TRÈS GRANDS BOUTONS TERRAIN) ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* BOUTON CAPTURER BORNE */}
            <Button
              size="lg"
              onClick={handleCaptureCurrentPosition}
              disabled={!livePos}
              className="h-16 gap-3 text-base font-extrabold gradient-primary text-primary-foreground shadow-md rounded-2xl"
            >
              <MapPin className="h-6 w-6 shrink-0" />
              <div className="text-left">
                <div className="leading-tight">Capturer ce Point (P{waypoints.length + 1})</div>
                <div className="text-[11px] font-normal opacity-90">
                  Précision actuelle {livePos ? `±${livePos.accuracy} m` : "recherche..."}
                </div>
              </div>
            </Button>

            {/* BOUTON MARCHE CONTINUE (TRACK) */}
            <Button
              size="lg"
              variant={isAutoTracking ? "destructive" : "outline"}
              onClick={() => setIsAutoTracking(!isAutoTracking)}
              className="h-16 gap-3 text-base font-extrabold border-2 rounded-2xl shadow-sm"
            >
              {isAutoTracking ? <Square className="h-6 w-6 shrink-0 animate-pulse" /> : <Play className="h-6 w-6 shrink-0" />}
              <div className="text-left">
                <div className="leading-tight">
                  {isAutoTracking ? "Arrêter le Tracé Continu" : "Mode Marche Continue"}
                </div>
                <div className="text-[11px] font-normal opacity-80">
                  {isAutoTracking ? "Capture active tous les 3m..." : "Enregistrement automatique en marchant"}
                </div>
              </div>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowManualAddModal(true)}
              className="text-xs font-bold gap-1.5 rounded-xl h-10 border-primary/30"
            >
              <Plus className="h-4 w-4" />
              Saisie Clavier
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPolygonClosed(!isPolygonClosed)}
              disabled={waypoints.length < 3}
              className="text-xs font-bold gap-1.5 rounded-xl h-10 border-primary/30"
            >
              <RotateCcw className="h-4 w-4" />
              {isPolygonClosed ? "Ouvrir Tracé" : "Fermer Polygone"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setWaypoints([])}
              disabled={waypoints.length === 0}
              className="text-xs font-bold gap-1.5 rounded-xl h-10 text-destructive hover:text-destructive border-destructive/30"
            >
              <Trash2 className="h-4 w-4" />
              Réinitialiser
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveSession}
              disabled={waypoints.length === 0}
              className="text-xs font-bold gap-1.5 rounded-xl h-10 text-emerald-600 border-emerald-500/30"
            >
              <Save className="h-4 w-4" />
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* COLONNE DROITE (5 COLONNES) : TABLEAU DES BORNES & EXPORTS */}
        <div className="lg:col-span-5 space-y-4">
          {/* PARAMÉTRAGE DE L'EXPLOITATION DU CHANTIER */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Dossier du Chantier</span>
                <Badge variant="outline" className="text-[10px]">
                  Système WGS84
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-bold">Nom du Levé</Label>
                  <Input
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="h-8 text-xs mt-1"
                    placeholder="Ex: Bornage Zone Nord"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold">Nom de la Parcelle</Label>
                  <Input
                    value={parcelName}
                    onChange={(e) => setParcelName(e.target.value)}
                    className="h-8 text-xs mt-1"
                    placeholder="Ex: Parcelle Tomate 1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-bold">Client / Producteur</Label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="h-8 text-xs mt-1"
                    placeholder="Ex: Oumar Traoré"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold">Localité / Commune</Label>
                  <Input
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="h-8 text-xs mt-1"
                    placeholder="Ex: Bama, Houet"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TABLEAU DES BORNES LEVÉES */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Bornes & Coordonnées ({waypoints.length})
                </CardTitle>
              </div>
              {waypoints.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {isPolygonClosed ? "Polygone fermé" : "En cours"}
                </span>
              )}
            </CardHeader>

            <CardContent className="p-0 max-h-[340px] overflow-y-auto divide-y">
              {waypoints.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
                  <Navigation className="h-8 w-8 mx-auto text-primary/40" />
                  <p className="font-bold text-foreground">Aucune coordonnée relevée</p>
                  <p className="text-[11px]">
                    Marchez sur le terrain et cliquez sur « Capturer ce Point » à chaque borne de votre parcelle.
                  </p>
                </div>
              ) : (
                waypoints.map((wp, idx) => {
                  const utm = toApproximateUtmZone30N(wp.lat, wp.lng);
                  return (
                    <div key={wp.id} className="p-3 hover:bg-muted/30 transition-colors space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-primary-foreground font-mono text-[10px] h-5 px-1.5">
                            {wp.index}
                          </Badge>
                          <span className="font-bold text-foreground">{wp.label}</span>
                          <span className="text-[10px] text-muted-foreground">({CATEGORY_LABELS[wp.category]})</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleZoomToPoint(wp)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Voir sur la carte"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMovePoint(idx, "up")}
                            disabled={idx === 0}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMovePoint(idx, "down")}
                            disabled={idx === waypoints.length - 1}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemovePoint(idx)}
                            className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-muted-foreground">
                        <div>Lat : {wp.lat.toFixed(6)}°</div>
                        <div>Lng : {wp.lng.toFixed(6)}°</div>
                        <div>DMS : {toDMS(wp.lat, true)}</div>
                        <div>UTM : X={utm.easting} Y={utm.northing}</div>
                      </div>

                      {wp.distanceToNextM && (
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-between pt-0.5 border-t border-dashed">
                          <span>Segment vers point suivant : {wp.distanceToNextM} m</span>
                          <span>Cap : {wp.bearingToNextDeg}°</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* ─── ACTIONS D'EXPORT ET INTÉGRATION CADASTRALE ─── */}
          <div className="space-y-2 pt-1">
            <Button
              size="lg"
              onClick={handleExportPdf}
              disabled={waypoints.length === 0}
              className="w-full gap-2 font-bold gradient-primary text-primary-foreground shadow-sm rounded-xl"
            >
              <FileDown className="h-4 w-4" />
              Télécharger le Procès-Verbal Officiel PDF
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(true)}
                disabled={waypoints.length === 0}
                className="gap-2 text-xs font-bold rounded-xl"
              >
                <Download className="h-4 w-4" />
                Formats SIG (GeoJSON / GPX)
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowSaveToParcelModal(true)}
                disabled={waypoints.length < 3}
                className="gap-2 text-xs font-bold rounded-xl border-primary/40 text-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" />
                Créer la Parcelle
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODALE D'AJOUT MANUEL PAR COORDONNÉES ─── */}
      <Dialog open={showManualAddModal} onOpenChange={setShowManualAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Ajouter une Borne Manuellement
            </DialogTitle>
            <DialogDescription className="text-xs">
              Saisissez les coordonnées en Degrés Décimaux (ex: 12.371428) ou en Degrés Minutes Secondes (ex: 12° 22' 17.1" N).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-bold">Identifiant / Nom de la Borne</Label>
              <Input
                placeholder={`Borne P${waypoints.length + 1}`}
                value={manualForm.label}
                onChange={(e) => setManualForm({ ...manualForm, label: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Type de repère</Label>
              <Select
                value={manualForm.category}
                onValueChange={(v) => setManualForm({ ...manualForm, category: v as WaypointCategory })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borne">Borne de limite</SelectItem>
                  <SelectItem value="sommet">Sommet de parcelle</SelectItem>
                  <SelectItem value="forage">Forage hydraulique</SelectItem>
                  <SelectItem value="puits">Puits maraîcher</SelectItem>
                  <SelectItem value="batiment">Bâtiment / Hangar</SelectItem>
                  <SelectItem value="magasin">Magasin de stockage</SelectItem>
                  <SelectItem value="cloture">Angle de clôture</SelectItem>
                  <SelectItem value="arbre_repere">Arbre repère</SelectItem>
                  <SelectItem value="autre">Autre point d'intérêt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Latitude (DD ou DMS)</Label>
                <Input
                  placeholder="12.371428 ou 12° 22' 17N"
                  value={manualForm.latStr}
                  onChange={(e) => setManualForm({ ...manualForm, latStr: e.target.value })}
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Longitude (DD ou DMS)</Label>
                <Input
                  placeholder="-1.519725 ou 1° 31' 11W"
                  value={manualForm.lngStr}
                  onChange={(e) => setManualForm({ ...manualForm, lngStr: e.target.value })}
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Altitude en mètres (Optionnel)</Label>
              <Input
                type="number"
                placeholder="Ex: 310"
                value={manualForm.altitudeStr}
                onChange={(e) => setManualForm({ ...manualForm, altitudeStr: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Notes / Observations</Label>
              <Textarea
                placeholder="Ex: Borne en béton avec marque peinture blanche"
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                rows={2}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowManualAddModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveManualPoint} className="gradient-primary text-primary-foreground font-bold">
              Ajouter ce Point
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODALE HISTORIQUE DES LEVÉS EFFECTUÉS ─── */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Mes Levés GPS Enregistrés
            </DialogTitle>
            <DialogDescription className="text-xs">
              Consultez et restaurez vos arpentages de parcelles et relevés géodésiques précédents.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[350px] overflow-y-auto divide-y py-2">
            {savedSessions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                Aucun levé topographique enregistré en mémoire locale.
              </div>
            ) : (
              savedSessions.map((s) => (
                <div key={s.id} className="p-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{s.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Parcelle : <strong>{s.parcelName}</strong> • {s.areaHa} ha ({s.areaM2} m²) • {s.waypoints.length} bornes
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(s.surveyDate).toLocaleDateString("fr-FR")} • {s.locality}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleLoadSession(s)}
                      className="text-xs font-bold gap-1"
                    >
                      Restaurer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => gpsSurveyStorage.delete(s.id)}
                      className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODALE D'EXPORTATION SIG (GEOJSON / GPX / KML / CSV) ─── */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Exporter les Données Géospatiales
            </DialogTitle>
            <DialogDescription className="text-xs">
              Formats interopérables compatibles avec QGIS, ArcGIS, Google Earth et les terminaux GPS Garmin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-2.5 py-3">
            <Button
              variant="outline"
              onClick={handleExportGeoJson}
              className="justify-between h-12 rounded-xl text-xs font-bold"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-emerald-600" />
                <div className="text-left">
                  <div>GeoJSON (.geojson)</div>
                  <div className="text-[10px] font-normal text-muted-foreground">Pour QGIS, ArcGIS et Web SIG</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              onClick={handleExportGpx}
              className="justify-between h-12 rounded-xl text-xs font-bold"
            >
              <div className="flex items-center gap-2.5">
                <Navigation className="h-4 w-4 text-sky-600" />
                <div className="text-left">
                  <div>GPX (.gpx)</div>
                  <div className="text-[10px] font-normal text-muted-foreground">Pour GPS Garmin, eTrex et OsmAnd</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              onClick={handleExportKml}
              className="justify-between h-12 rounded-xl text-xs font-bold"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-amber-600" />
                <div className="text-left">
                  <div>KML (.kml)</div>
                  <div className="text-[10px] font-normal text-muted-foreground">Pour Google Earth Pro & Google Maps</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              onClick={handleExportCsv}
              className="justify-between h-12 rounded-xl text-xs font-bold"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <div>Tableur CSV / Excel (.csv)</div>
                  <div className="text-[10px] font-normal text-muted-foreground">Tableau complet des coordonnées DD, DMS et UTM</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODALE D'ENREGISTREMENT DANS UNE PARCELLE ─── */}
      <Dialog open={showSaveToParcelModal} onOpenChange={setShowSaveToParcelModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Créer la Parcelle dans une Exploitation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ce levé GPS sera immédiatement injecté dans la liste officielle des parcelles avec sa géométrie et sa superficie calculée ({areaHa} ha).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3">
            <div>
              <Label className="text-xs font-bold">Sélectionner l'Exploitation Agricole</Label>
              <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choisir une exploitation..." />
                </SelectTrigger>
                <SelectContent>
                  {farms && farms.length > 0 ? (
                    farms.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default_farm">Exploitation Principale</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Nom de la Parcelle</Label>
              <Input
                value={parcelName}
                onChange={(e) => setParcelName(e.target.value)}
                className="mt-1"
                placeholder="Ex: Parcelle Maraîchère N°1"
              />
            </div>

            <div className="p-3 rounded-lg border bg-muted/40 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Superficie nette :</span>
                <span className="font-bold">{areaHa} ha ({areaM2} m²)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Périmètre mesuré :</span>
                <span className="font-bold">{perimeterM} mètres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre de sommets :</span>
                <span className="font-bold">{waypoints.length} bornes WGS84</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSaveToParcelModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveToAppParcels} className="gradient-primary text-primary-foreground font-bold">
              Confirmer & Enregistrer la Parcelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODALE D'HISTORIQUE UNIVERSEL DES RAPPORTS PDF ─── */}
      <PdfExportHistoryModal
        open={showPdfHistory}
        onOpenChange={setShowPdfHistory}
        defaultModuleFilter="cartography"
        title="Historique des Procès-Verbaux de Levé GPS"
      />
    </div>
  );
}
