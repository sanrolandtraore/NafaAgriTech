import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin, Trash2, Navigation, RotateCcw, Save,
  Bug, Droplets, Leaf, AlertTriangle, Camera, StickyNote, Layers,
  Ruler, Target, Image as ImageIcon, X, Download, HardDriveDownload,
  Wifi, WifiOff, CheckCircle2, Loader2, Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  computeTilesForBBox,
  downloadMapTiles,
  getBBoxFromCoordinates,
  getCachedTileCount,
  type TileDownloadProgress,
  DEFAULT_OFFLINE_ZOOMS,
} from "@/lib/mapTileDownloader";
import {
  cacheData,
  getCachedData,
} from "@/lib/offlineDb";
import { isMissingTableError, isInvalidUuidError } from "@/hooks/useOfflineData";
import BackNavigationButton from "@/components/BackNavigationButton";

// ─── Types ───
interface Coordinate { lat: number; lng: number; }

interface FieldObservation {
  id: string;
  user_id: string;
  parcel_name: string | null;
  observation_type: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string | null;
  photo_urls: string[];
  severity: string;
  created_at: string;
}

interface ExpertParcel {
  id: string;
  user_id: string;
  name: string;
  geometry: any;
  area_ha: number;
  perimeter_m: number;
  center_lat: number | null;
  center_lng: number | null;
  notes: string | null;
  client_name: string | null;
  created_at: string;
}

const OBSERVATION_TYPES = [
  { value: "zone_malade", label: "Zone malade", icon: Bug, color: "#ef4444" },
  { value: "zone_seche", label: "Zone sèche", icon: Droplets, color: "#f59e0b" },
  { value: "zone_insectes", label: "Ravagée par insectes", icon: Bug, color: "#dc2626" },
  { value: "manque_engrais", label: "Manque d'engrais", icon: Leaf, color: "#84cc16" },
  { value: "autre", label: "Autre observation", icon: AlertTriangle, color: "#6366f1" },
];

const MAX_POINTS = 4;
const CORNER_LABELS = ["Coin 1", "Coin 2", "Coin 3", "Coin 4"];

const SEVERITY_LEVELS = [
  { value: "faible", label: "Faible", color: "bg-green-100 text-green-800" },
  { value: "moyen", label: "Moyen", color: "bg-yellow-100 text-yellow-800" },
  { value: "eleve", label: "Élevé", color: "bg-orange-100 text-orange-800" },
  { value: "critique", label: "Critique", color: "bg-red-100 text-red-800" },
];

// ─── Area / Perimeter Utils ───
function computeAreaHa(coords: Coordinate[]): number {
  if (coords.length < 3) return 0;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dLng = toRad(coords[j].lng - coords[i].lng);
    area += dLng * (2 + Math.sin(toRad(coords[i].lat)) + Math.sin(toRad(coords[j].lat)));
  }
  area = Math.abs((area * R * R) / 2);
  return Math.round((area / 10000) * 1000) / 1000;
}

function computePerimeterM(coords: Coordinate[]): number {
  if (coords.length < 2) return 0;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let perimeter = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const dLat = toRad(coords[j].lat - coords[i].lat);
    const dLng = toRad(coords[j].lng - coords[i].lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(coords[i].lat)) * Math.cos(toRad(coords[j].lat)) * Math.sin(dLng / 2) ** 2;
    perimeter += 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return Math.round(perimeter);
}

function coordsToGeoJSON(coords: Coordinate[]) {
  if (coords.length < 3) return null;
  const points = coords.map(c => [c.lng, c.lat]);
  points.push(points[0]);
  return { type: "Polygon" as const, coordinates: [points] };
}

// ─── Component ───
const ExpertCartographyPage = () => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const drawLayerRef = useRef<L.FeatureGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Drawing state
  const [drawingMode, setDrawingMode] = useState<"none" | "polygon" | "marker">("none");
  const [polygonPoints, setPolygonPoints] = useState<Coordinate[]>([]);

  // Data state
  const [observations, setObservations] = useState<FieldObservation[]>([]);
  const [parcels, setParcels] = useState<ExpertParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState<string | null>(null);

  // New observation dialog
  const [showObsDialog, setShowObsDialog] = useState(false);
  const [newObsCoord, setNewObsCoord] = useState<Coordinate | null>(null);
  const [obsForm, setObsForm] = useState({
    title: "", description: "", observation_type: "zone_malade", severity: "moyen", parcel_name: "",
  });
  const [obsPhotos, setObsPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  // Save parcel dialog
  const [showParcelDialog, setShowParcelDialog] = useState(false);
  const [parcelForm, setParcelForm] = useState({ name: "", client_name: "", notes: "" });

  // ─── Offline Map Caching State ───
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadScope, setDownloadScope] = useState<"all" | "selected" | "visible">("all");
  const [downloadTargetParcelId, setDownloadTargetParcelId] = useState<string>("all");
  const [cachedTileCount, setCachedTileCount] = useState<number>(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<TileDownloadProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Connectivity listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check cached tiles count on load
  const refreshCachedCount = useCallback(async () => {
    const count = await getCachedTileCount();
    setCachedTileCount(count);
  }, []);

  useEffect(() => {
    refreshCachedCount();
  }, [refreshCachedCount]);

  // ─── Fetch data (with IndexedDB fallback for parcels and observations) ───
  const fetchData = useCallback(async () => {
    if (!user) return;
    const cacheKey = `user-${user.id}`;

    if (navigator.onLine) {
      try {
        const [obsRes, parcelRes] = await Promise.all([
          supabase.from("field_observations").select("*").order("created_at", { ascending: false }),
          supabase.from("expert_parcels").select("*").order("created_at", { ascending: false }),
        ]);
        if (obsRes.error && (isMissingTableError(obsRes.error) || isInvalidUuidError(obsRes.error))) {
          const cachedObs = await getCachedData("field_observations", cacheKey);
          if (cachedObs) setObservations(cachedObs as FieldObservation[]);
        } else if (obsRes.data) {
          setObservations(obsRes.data as FieldObservation[]);
          await cacheData("field_observations", cacheKey, obsRes.data);
        }
        if (parcelRes.error && (isMissingTableError(parcelRes.error) || isInvalidUuidError(parcelRes.error))) {
          const cachedParcels = await getCachedData("expert_parcels", cacheKey);
          if (cachedParcels) setParcels(cachedParcels as ExpertParcel[]);
        } else if (parcelRes.data) {
          setParcels(parcelRes.data as ExpertParcel[]);
          await cacheData("expert_parcels", cacheKey, parcelRes.data);
        }
      } catch (err) {
        console.warn("Erreur réseau cartographie, repli sur le cache local:", err);
        const [cachedObs, cachedParcels] = await Promise.all([
          getCachedData("field_observations", cacheKey),
          getCachedData("expert_parcels", cacheKey),
        ]);
        if (cachedObs) setObservations(cachedObs as FieldObservation[]);
        if (cachedParcels) setParcels(cachedParcels as ExpertParcel[]);
      }
    } else {
      const [cachedObs, cachedParcels] = await Promise.all([
        getCachedData("field_observations", cacheKey),
        getCachedData("expert_parcels", cacheKey),
      ]);
      if (cachedObs) setObservations(cachedObs as FieldObservation[]);
      if (cachedParcels) setParcels(cachedParcels as ExpertParcel[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Trigger Tile Pre-caching for Parcels ───
  const startTileDownload = async () => {
    if (!navigator.onLine) {
      toast.error("Une connexion internet active est requise pour pré-télécharger les fonds de carte.");
      return;
    }

    // Determine coordinates to cover
    let coordsToCover: Coordinate[] = [];

    if (downloadScope === "visible" && mapInstance.current) {
      const bounds = mapInstance.current.getBounds();
      coordsToCover = [
        { lat: bounds.getSouth(), lng: bounds.getWest() },
        { lat: bounds.getNorth(), lng: bounds.getEast() },
      ];
    } else if (downloadScope === "selected" || (downloadTargetParcelId && downloadTargetParcelId !== "all")) {
      const targetId = downloadTargetParcelId !== "all" ? downloadTargetParcelId : selectedParcel;
      const target = parcels.find(p => p.id === targetId);
      if (target?.geometry?.coordinates?.[0]) {
        coordsToCover = target.geometry.coordinates[0].map((c: number[]) => ({ lat: c[1], lng: c[0] }));
      } else if (target?.center_lat && target?.center_lng) {
        coordsToCover = [{ lat: Number(target.center_lat), lng: Number(target.center_lng) }];
      }
    } else {
      // "all" assigned parcels
      parcels.forEach(p => {
        if (p.geometry?.coordinates?.[0]) {
          p.geometry.coordinates[0].forEach((c: number[]) => {
            coordsToCover.push({ lat: c[1], lng: c[0] });
          });
        } else if (p.center_lat && p.center_lng) {
          coordsToCover.push({ lat: Number(p.center_lat), lng: Number(p.center_lng) });
        }
      });
      // also include observations
      observations.forEach(obs => {
        coordsToCover.push({ lat: Number(obs.latitude), lng: Number(obs.longitude) });
      });
    }

    if (coordsToCover.length === 0) {
      if (polygonPoints.length > 0) {
        coordsToCover = polygonPoints;
      } else if (mapInstance.current) {
        const center = mapInstance.current.getCenter();
        coordsToCover = [{ lat: center.lat, lng: center.lng }];
      }
    }

    const bbox = getBBoxFromCoordinates(coordsToCover, 0.008); // ~800m de marge
    // Calculate tile URLs
    const urls = computeTilesForBBox(bbox, DEFAULT_OFFLINE_ZOOMS);

    if (urls.length === 0) {
      toast.info("Aucune tuile nécessaire pour cette sélection.");
      return;
    }

    setDownloading(true);
    abortControllerRef.current = new AbortController();

    try {
      toast.loading(`Téléchargement de ${urls.length} tuiles en cours...`, { id: "tile-download" });
      const result = await downloadMapTiles(
        urls,
        (progress) => setDownloadProgress(progress),
        abortControllerRef.current.signal
      );

      toast.success(
        `Zone cartographique téléchargée ! ${result.completed} tuiles stockées pour consultation hors-ligne.`,
        { id: "tile-download" }
      );
      await refreshCachedCount();
    } catch (err: any) {
      if (err.name === "AbortError" || err.message === "Download aborted") {
        toast.info("Téléchargement de la carte interrompu.", { id: "tile-download" });
      } else {
        toast.error("Erreur lors de la mise en cache de la carte: " + (err.message || "Erreur réseau"), {
          id: "tile-download",
        });
      }
    } finally {
      setDownloading(false);
      abortControllerRef.current = null;
    }
  };

  const cancelTileDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // ─── Initialize Map ───
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [12.37, -1.52],
      zoom: 6,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
    }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    const drawLayer = L.featureGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);
    drawLayerRef.current = drawLayer;
    markersLayerRef.current = markersLayer;
    mapInstance.current = map;

    // Map click handler
    map.on("click", (e: L.LeafletMouseEvent) => {
      const event = new CustomEvent("map-click", { detail: { lat: e.latlng.lat, lng: e.latlng.lng } });
      window.dispatchEvent(event);
    });

    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  // ─── Map click listener ───
  useEffect(() => {
    const handler = (e: Event) => {
      const { lat, lng } = (e as CustomEvent).detail;
      if (drawingMode === "polygon") {
        setPolygonPoints(prev => prev.length >= MAX_POINTS ? prev : [...prev, { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 }]);
      } else if (drawingMode === "marker") {
        setNewObsCoord({ lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 });
        setShowObsDialog(true);
        setDrawingMode("none");
      }
    };
    window.addEventListener("map-click", handler);
    return () => window.removeEventListener("map-click", handler);
  }, [drawingMode]);

  // ─── Render saved observations on map ───
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    observations.forEach(obs => {
      const typeInfo = OBSERVATION_TYPES.find(t => t.value === obs.observation_type) || OBSERVATION_TYPES[4];
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${typeInfo.color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([Number(obs.latitude), Number(obs.longitude)], { icon }).addTo(markersLayerRef.current!);

      const photoHtml = obs.photo_urls?.length
        ? `<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">${obs.photo_urls.map(u => `<img src="${u}" style="width:60px;height:60px;object-fit:cover;border-radius:4px" />`).join("")}</div>`
        : "";

      marker.bindPopup(`
        <div style="max-width:250px">
          <strong>${obs.title}</strong>
          <div style="margin:4px 0"><span style="background:${typeInfo.color};color:white;padding:2px 8px;border-radius:9999px;font-size:11px">${typeInfo.label}</span></div>
          ${obs.description ? `<p style="font-size:13px;margin:6px 0">${obs.description}</p>` : ""}
          ${photoHtml}
          <p style="font-size:11px;color:#888;margin-top:6px">${new Date(obs.created_at).toLocaleDateString("fr-FR")}</p>
        </div>
      `);
    });
  }, [observations]);

  // ─── Render saved parcels on map ───
  useEffect(() => {
    if (!drawLayerRef.current) return;
    drawLayerRef.current.clearLayers();

    // Render current drawing polygon
    if (polygonPoints.length > 0) {
      const latlngs = polygonPoints.map(c => [c.lat, c.lng] as L.LatLngTuple);
      if (polygonPoints.length >= 3) {
        L.polygon(latlngs, { color: "#22784a", fillColor: "#22784a", fillOpacity: 0.2, weight: 2 }).addTo(drawLayerRef.current);
      }
      polygonPoints.forEach((c, i) => {
        L.circleMarker([c.lat, c.lng], { radius: 6, color: "#22784a", fillColor: "#22784a", fillOpacity: 0.8, weight: 2 })
          .addTo(drawLayerRef.current!).bindTooltip(CORNER_LABELS[i] || `P${i + 1}`, { permanent: true, direction: "top", className: "text-xs" });
      });
    }

    // Render saved parcels
    parcels.forEach(p => {
      if (!p.geometry?.coordinates) return;
      const isSelected = selectedParcel === p.id;
      const coords = p.geometry.coordinates[0].map((c: number[]) => [c[1], c[0]] as L.LatLngTuple);
      L.polygon(coords, {
        color: isSelected ? "#3b82f6" : "#22784a",
        fillColor: isSelected ? "#3b82f6" : "#22784a",
        fillOpacity: isSelected ? 0.3 : 0.15,
        weight: isSelected ? 3 : 2,
      }).addTo(drawLayerRef.current!).bindPopup(`
        <div><strong>${p.name}</strong><br/>${p.area_ha} ha · ${p.perimeter_m?.toLocaleString("fr-FR")} m
        ${p.client_name ? `<br/>Client: ${p.client_name}` : ""}
        ${p.notes ? `<br/><em>${p.notes}</em>` : ""}</div>
      `);
    });
  }, [polygonPoints, parcels, selectedParcel]);

  // ─── Capture a corner with GPS ───
  const captureGPSPoint = () => {
    if (!navigator.geolocation) { toast.error("GPS non disponible"); return; }
    if (drawingMode === "polygon" && polygonPoints.length >= MAX_POINTS) {
      toast.info("Les 4 coins sont déjà enregistrés");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coord = { lat: Math.round(pos.coords.latitude * 1e6) / 1e6, lng: Math.round(pos.coords.longitude * 1e6) / 1e6 };
        if (drawingMode === "polygon") {
          setPolygonPoints(prev => prev.length >= MAX_POINTS ? prev : [...prev, coord]);
          mapInstance.current?.setView([coord.lat, coord.lng], 17);
          toast.success(`${CORNER_LABELS[polygonPoints.length]} capturé (±${Math.round(pos.coords.accuracy)}m)`);
        } else {
          setNewObsCoord(coord);
          setShowObsDialog(true);
          mapInstance.current?.setView([coord.lat, coord.lng], 17);
        }
      },
      (err) => toast.error("Erreur GPS: " + err.message),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };


  // ─── Save Parcel ───
  const saveParcel = async () => {
    if (!user || polygonPoints.length < 3) return;
    setSaving(true);
    const geometry = coordsToGeoJSON(polygonPoints);
    const area_ha = computeAreaHa(polygonPoints);
    const perimeter_m = computePerimeterM(polygonPoints);
    const center_lat = polygonPoints.reduce((s, c) => s + c.lat, 0) / polygonPoints.length;
    const center_lng = polygonPoints.reduce((s, c) => s + c.lng, 0) / polygonPoints.length;

    const { error } = await supabase.from("expert_parcels").insert({
      user_id: user.id,
      name: parcelForm.name || `Parcelle ${new Date().toLocaleDateString("fr-FR")}`,
      geometry,
      area_ha,
      perimeter_m,
      center_lat,
      center_lng,
      notes: parcelForm.notes || null,
      client_name: parcelForm.client_name || null,
    });

    if (error) {
      if (isMissingTableError(error) || isInvalidUuidError(error)) {
        const localParcel: ExpertParcel = {
          id: `local-${Date.now()}`,
          name: parcelForm.name.trim(),
          geometry,
          area_ha,
          perimeter_m,
          center_lat,
          center_lng,
          notes: parcelForm.notes || null,
          client_name: parcelForm.client_name || null,
          created_at: new Date().toISOString(),
        } as any;
        setParcels(prev => [localParcel, ...prev]);
        toast.success(`Parcelle sauvegardée localement — ${area_ha} ha`);
        setPolygonPoints([]);
        setShowParcelDialog(false);
        setParcelForm({ name: "", client_name: "", notes: "" });
        setDrawingMode("none");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(`Parcelle sauvegardée — ${area_ha} ha`);
      setPolygonPoints([]);
      setShowParcelDialog(false);
      setParcelForm({ name: "", client_name: "", notes: "" });
      setDrawingMode("none");
      fetchData();
    }
    setSaving(false);
  };

  // ─── Save Observation ───
  const saveObservation = async () => {
    if (!user || !newObsCoord) return;
    setSaving(true);

    // Upload photos
    const photoUrls: string[] = [];
    for (const file of obsPhotos) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("field-observations").upload(path, file);
      if (uploadErr) { toast.error("Erreur upload photo"); continue; }
      const { data: urlData } = supabase.storage.from("field-observations").getPublicUrl(path);
      photoUrls.push(urlData.publicUrl);
    }

    const { error } = await supabase.from("field_observations").insert({
      user_id: user.id,
      latitude: newObsCoord.lat,
      longitude: newObsCoord.lng,
      title: obsForm.title || "Observation",
      description: obsForm.description || null,
      observation_type: obsForm.observation_type,
      severity: obsForm.severity,
      parcel_name: obsForm.parcel_name || null,
      photo_urls: photoUrls,
    });

    if (error) {
      if (isMissingTableError(error) || isInvalidUuidError(error)) {
        const localObs: FieldObservation = {
          id: `local-${Date.now()}`,
          user_id: user.id,
          latitude: newObsCoord.lat,
          longitude: newObsCoord.lng,
          title: obsForm.title || "Observation",
          description: obsForm.description || null,
          observation_type: obsForm.observation_type,
          severity: obsForm.severity,
          parcel_name: obsForm.parcel_name || null,
          photo_urls: photoUrls,
          created_at: new Date().toISOString(),
        } as any;
        setObservations(prev => [localObs, ...prev]);
        toast.success("Observation enregistrée localement");
        setShowObsDialog(false);
        setNewObsCoord(null);
        setObsForm({ title: "", description: "", observation_type: "zone_malade", severity: "moyen", parcel_name: "" });
        setObsPhotos([]);
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Observation enregistrée");
      setShowObsDialog(false);
      setNewObsCoord(null);
      setObsForm({ title: "", description: "", observation_type: "zone_malade", severity: "moyen", parcel_name: "" });
      setObsPhotos([]);
      fetchData();
    }
    setSaving(false);
  };

  // ─── Delete observation ───
  const deleteObservation = async (id: string) => {
    if (!id.startsWith("local-")) {
      const { error } = await supabase.from("field_observations").delete().eq("id", id);
      if (error && !isMissingTableError(error) && !isInvalidUuidError(error)) {
        toast.error(error.message);
        return;
      }
    }
    setObservations(prev => prev.filter(o => o.id !== id));
    toast.success("Observation supprimée");
  };

  // ─── Delete parcel ───
  const deleteParcel = async (id: string) => {
    if (!id.startsWith("local-")) {
      const { error } = await supabase.from("expert_parcels").delete().eq("id", id);
      if (error && !isMissingTableError(error) && !isInvalidUuidError(error)) {
        toast.error(error.message);
        return;
      }
    }
    setParcels(prev => prev.filter(p => p.id !== id));
    toast.success("Parcelle supprimée");
  };

  const areaHa = computeAreaHa(polygonPoints);
  const perimeterM = computePerimeterM(polygonPoints);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[500px]" />
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <BackNavigationButton fallbackTo="/dashboard" />
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Cartographie GPS
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Mesurez un champ avec 4 coins GPS, obtenez la superficie en hectares et réutilisez-la dans les calculs
          </p>
        </div>
      </div>

      {/* ─── Barre d'outils cartographie terrain NAFA - AGRITECH ─── */}
      <Card className="shadow-md border-stone-200 dark:border-stone-800 bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-stone-900 to-stone-950 px-4 py-2.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-400 text-stone-950 font-black text-[10px] tracking-wider uppercase px-2 py-0.5 rounded">
              GPS TERRAIN
            </Badge>
            <span className="text-xs font-semibold text-stone-300">Arpentage haute précision & Cartographie hors-ligne</span>
          </div>

          <div className="flex items-center gap-2">
            {!isOnline ? (
              <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-300 border-amber-400/50 gap-1 font-bold">
                <WifiOff className="h-3.5 w-3.5" /> Hors-ligne
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-400/50 gap-1 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                GPS / Réseau Actif
              </Badge>
            )}
            {cachedTileCount > 0 && (
              <Badge variant="secondary" className="text-xs gap-1 hidden sm:inline-flex bg-stone-800 text-stone-200 border border-stone-700">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {cachedTileCount} tuiles stockées
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2.5 items-center">
              <Button
                size="sm"
                variant={drawingMode === "polygon" ? "default" : "outline"}
                onClick={() => { setDrawingMode(drawingMode === "polygon" ? "none" : "polygon"); setPolygonPoints([]); }}
                className={`h-10 px-4 rounded-xl text-xs font-bold gap-2 ${
                  drawingMode === "polygon" ? "bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-md" : "border-stone-300 dark:border-stone-700"
                }`}
              >
                <Layers className="h-4 w-4" /> Arpenter un champ (4 coins GPS)
              </Button>
              <Button
                size="sm"
                variant={drawingMode === "marker" ? "default" : "outline"}
                onClick={() => setDrawingMode(drawingMode === "marker" ? "none" : "marker")}
                className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 border-stone-300 dark:border-stone-700"
              >
                <Target className="h-4 w-4" /> Poser observation
              </Button>

              <div className="hidden sm:block border-l border-border mx-1 h-7" />

              {drawingMode === "polygon" && (
                <Button
                  size="sm"
                  onClick={captureGPSPoint}
                  disabled={polygonPoints.length >= MAX_POINTS}
                  className="h-10 px-4 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  {polygonPoints.length >= MAX_POINTS ? "4 coins validés" : `Enregistrer le ${CORNER_LABELS[polygonPoints.length]}`}
                </Button>
              )}
              {drawingMode === "marker" && (
                <Button size="sm" variant="outline" onClick={captureGPSPoint} className="h-10 px-4 rounded-xl text-xs font-semibold gap-2">
                  <Navigation className="h-4 w-4" /> Ma position actuelle
                </Button>
              )}
              {polygonPoints.length > 0 && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setPolygonPoints([])} className="h-10 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground">
                    <RotateCcw className="h-4 w-4 mr-1" /> Recommencer
                  </Button>
                  {polygonPoints.length >= 3 && (
                    <Button size="sm" onClick={() => setShowParcelDialog(true)} className="h-10 px-4 rounded-xl text-xs font-black bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 gap-2 shadow-md">
                      <Save className="h-4 w-4" /> Enregistrer la parcelle ({areaHa} ha)
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Offline Caching Action Button */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-10 px-4 rounded-xl gap-2 font-bold text-xs border-amber-500/40 hover:bg-amber-500/10 text-stone-800 dark:text-amber-300 shadow-sm"
                onClick={() => setShowDownloadDialog(true)}
                data-testid="download-map-area-btn"
                title="Download Map Area for offline use"
              >
                <HardDriveDownload className="h-4 w-4 text-amber-500" />
                <span>Download Map Area</span>
              </Button>
            </div>
          </div>
          {drawingMode === "polygon" && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Déplacez-vous sur la bordure du champ et validez chaque coin. Cibles tactiles optimisées pour usage extérieur en plein soleil.
              </p>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-sm flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-stone-900 dark:text-stone-100">{polygonPoints.length} sur {MAX_POINTS}</span> coins enregistrés
                  <span className="mx-2">•</span>
                  Périmètre estimé : <strong className="font-mono">{perimeterM.toLocaleString("fr-FR")} m</strong>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500 uppercase font-bold tracking-wider">Superficie : </span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">{areaHa} ha</span>
                </div>
              </div>
            </div>
          )}
          {drawingMode === "marker" && (
            <p className="text-xs text-muted-foreground mt-2">
              Cliquez ou touchez un point sur la carte pour signaler un foyer d'adventices, une panne ou un stress hydrique.
            </p>
          )}

        </CardContent>
      </Card>

      {/* ─── Map ─── */}
      <div ref={mapRef} style={{ height: "500px", width: "100%" }} className="rounded-lg border overflow-hidden shadow-sm" />

      {/* ─── Side panels ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Parcels list */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" /> Parcelles enregistrées ({parcels.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parcels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune parcelle dessinée</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {parcels.map(p => (
                  <div
                    key={p.id}
                    className={`rounded-lg border p-3 cursor-pointer transition-colors ${selectedParcel === p.id ? "bg-primary/5 border-primary" : "hover:bg-muted/50"}`}
                    onClick={() => {
                      setSelectedParcel(selectedParcel === p.id ? null : p.id);
                      if (p.center_lat && p.center_lng) mapInstance.current?.setView([Number(p.center_lat), Number(p.center_lng)], 16);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.area_ha} ha · {Number(p.perimeter_m).toLocaleString("fr-FR")} m
                          {p.client_name && ` · ${p.client_name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                          title="Télécharger cette parcelle hors-ligne"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParcel(p.id);
                            setDownloadScope("selected");
                            setDownloadTargetParcelId(p.id);
                            setShowDownloadDialog(true);
                          }}
                        >
                          <HardDriveDownload className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteParcel(p.id); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observations list */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" /> Observations ({observations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {observations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune observation</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {observations.map(obs => {
                  const typeInfo = OBSERVATION_TYPES.find(t => t.value === obs.observation_type) || OBSERVATION_TYPES[4];
                  const sevInfo = SEVERITY_LEVELS.find(s => s.value === obs.severity);
                  return (
                    <div key={obs.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => mapInstance.current?.setView([Number(obs.latitude), Number(obs.longitude)], 18)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{obs.title}</p>
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: typeInfo.color, color: typeInfo.color }}>
                              {typeInfo.label}
                            </Badge>
                            {sevInfo && <Badge variant="outline" className={`text-[10px] ${sevInfo.color}`}>{sevInfo.label}</Badge>}
                          </div>
                          {obs.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{obs.description}</p>}
                          {obs.photo_urls?.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {obs.photo_urls.map((url, i) => (
                                <img key={i} src={url} alt="" className="h-10 w-10 rounded object-cover" />
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(obs.created_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); deleteObservation(obs.id); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Save Parcel Dialog ─── */}
      <Dialog open={showParcelDialog} onOpenChange={setShowParcelDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Enregistrer la parcelle</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-sm">
              <strong>{areaHa}</strong> ha · <strong>{perimeterM.toLocaleString("fr-FR")}</strong> m périmètre · {polygonPoints.length} sommets
            </div>
            <div className="space-y-2">
              <Label>Nom de la parcelle</Label>
              <Input value={parcelForm.name} onChange={e => setParcelForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Parcelle Nord" />
            </div>
            <div className="space-y-2">
              <Label>Nom du client</Label>
              <Input value={parcelForm.client_name} onChange={e => setParcelForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Ex: Ouedraogo Ibrahim" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={parcelForm.notes} onChange={e => setParcelForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observations générales..." rows={3} />
            </div>
            <Button onClick={saveParcel} disabled={saving} className="w-full">
              {saving ? "Enregistrement..." : "Sauvegarder la parcelle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── New Observation Dialog ─── */}
      <Dialog open={showObsDialog} onOpenChange={v => { setShowObsDialog(v); if (!v) setNewObsCoord(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading">Nouvelle observation</DialogTitle></DialogHeader>
          {newObsCoord && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 border p-2 text-xs font-mono flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{newObsCoord.lat}, {newObsCoord.lng}</span>
              </div>
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input value={obsForm.title} onChange={e => setObsForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Tache brune sur feuilles" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={obsForm.observation_type} onValueChange={v => setObsForm(f => ({ ...f, observation_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OBSERVATION_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sévérité</Label>
                  <Select value={obsForm.severity} onValueChange={v => setObsForm(f => ({ ...f, severity: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITY_LEVELS.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nom de la parcelle (optionnel)</Label>
                <Input value={obsForm.parcel_name} onChange={e => setObsForm(f => ({ ...f, parcel_name: e.target.value }))} placeholder="Ex: Parcelle Nord" />
              </div>
              <div className="space-y-2">
                <Label>Description / Notes</Label>
                <Textarea value={obsForm.description} onChange={e => setObsForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez l'observation..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Photos</Label>
                <Input type="file" accept="image/*" multiple onChange={e => setObsPhotos(Array.from(e.target.files || []))} />
                {obsPhotos.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {obsPhotos.map((f, i) => (
                      <div key={i} className="relative">
                        <img src={URL.createObjectURL(f)} alt="" className="h-16 w-16 rounded object-cover" />
                        <button className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5" onClick={() => setObsPhotos(ps => ps.filter((_, j) => j !== i))}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={saveObservation} disabled={saving} className="w-full">
                {saving ? "Enregistrement..." : "Enregistrer l'observation"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* ─── Download Map Area Dialog ─── */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <HardDriveDownload className="h-5 w-5 text-primary" /> Télécharger la zone cartographique
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Pré-mettez en cache les tuiles satellite haute résolution et le réseau routier pour permettre aux éclaireurs de terrain d'inspecter et de positionner les points GPS même en zone blanche sans connexion internet.
            </p>

            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> État du cache local
                </span>
                <span className="font-mono text-primary font-semibold">{cachedTileCount} tuiles</span>
              </div>
              <p className="text-muted-foreground">
                Les fonds de carte sont conservés dans le stockage local de l'appareil et réutilisés instantanément lors des interventions terrain.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Périmètre à télécharger</Label>
              <Select
                value={downloadTargetParcelId}
                onValueChange={(val) => {
                  setDownloadTargetParcelId(val);
                  setDownloadScope(val === "all" ? "all" : val === "visible" ? "visible" : "selected");
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Sélectionner le périmètre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Toutes les parcelles assignées ({parcels.length} parcelles)
                  </SelectItem>
                  {mapInstance.current && (
                    <SelectItem value="visible">
                      Zone actuellement visible à l'écran
                    </SelectItem>
                  )}
                  {parcels.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.area_ha ? `(${p.area_ha} ha)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Download Progress */}
            {downloading && downloadProgress && (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    Téléchargement des tuiles...
                  </span>
                  <span className="font-mono">{downloadProgress.percent}%</span>
                </div>
                <Progress value={downloadProgress.percent} className="h-2" />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{downloadProgress.completed} / {downloadProgress.total} tuiles</span>
                  {downloadProgress.failed > 0 && (
                    <span className="text-amber-600">{downloadProgress.failed} ignorées</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              {downloading ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={cancelTileDownload}
                >
                  Annuler le téléchargement
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowDownloadDialog(false)}
                  >
                    Fermer
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={startTileDownload}
                    disabled={!isOnline}
                    data-testid="confirm-download-map-area"
                  >
                    <Download className="h-4 w-4" />
                    Download Map Area
                  </Button>
                </>
              )}
            </div>

            {!isOnline && (
              <p className="text-[11px] text-destructive text-center">
                Connexion hors-ligne : reconnectez-vous au réseau pour télécharger de nouveaux fonds de carte.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertCartographyPage;
