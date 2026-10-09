import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Trash2, Navigation, RotateCcw, Plus } from "lucide-react";
import { toast } from "sonner";

interface Coordinate {
  lat: number;
  lng: number;
}

interface GPSPolygonCaptureProps {
  value: Coordinate[];
  onChange: (coords: Coordinate[]) => void;
  onCenterDetected?: (lat: number, lng: number) => void;
}

const MAX_POINTS = 100;

// Haversine area calculation (client-side preview & offline calculation)
export function computeAreaHa(coords: Coordinate[]): number {
  if (coords.length < 3) return 0;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = toRad(coords[i].lat);
    const lat2 = toRad(coords[j].lat);
    const dLng = toRad(coords[j].lng - coords[i].lng);
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs((area * R * R) / 2);
  return Math.round((area / 10000) * 1000) / 1000;
}

export function computePerimeterM(coords: Coordinate[]): number {
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

export const GPSPolygonCapture = React.forwardRef<HTMLDivElement, GPSPolygonCaptureProps>(({ value, onChange, onCenterDetected }, ref) => {
  const [capturing, setCapturing] = useState(false);

  const captureCurrentPosition = useCallback(() => {
    if (value.length >= MAX_POINTS) {
      toast.info(`Maximum ${MAX_POINTS} points atteint`);
      return;
    }
    if (!navigator.geolocation) {
      toast.error("GPS non disponible sur cet appareil");
      return;
    }
    setCapturing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoord: Coordinate = {
          lat: Math.round(pos.coords.latitude * 1000000) / 1000000,
          lng: Math.round(pos.coords.longitude * 1000000) / 1000000,
        };
        const next = [...value, newCoord].slice(0, MAX_POINTS);
        onChange(next);
        if (value.length === 0 && onCenterDetected) {
          onCenterDetected(newCoord.lat, newCoord.lng);
        }
        toast.success(`Point ${next.length}/${MAX_POINTS} capturé (±${Math.round(pos.coords.accuracy)}m)`);
        setCapturing(false);
      },
      (err) => {
        toast.error("Erreur GPS: " + err.message);
        setCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [value, onChange, onCenterDetected]);

  const removePoint = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const areaHa = computeAreaHa(value);
  const perimeterM = computePerimeterM(value);
  const getPointLabel = (i: number) => (i < 4 ? ["Coin 1", "Coin 2", "Coin 3", "Coin 4"][i] : `Sommet P${i + 1}`);

  return (
    <div ref={ref} className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-medium">Points GPS ({value.length}/{MAX_POINTS})</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={captureCurrentPosition}
            disabled={capturing || value.length >= MAX_POINTS}
          >
            {capturing ? <Navigation className="h-4 w-4 mr-1 animate-pulse" /> : <MapPin className="h-4 w-4 mr-1" />}
            {capturing ? "Capture..." : value.length >= MAX_POINTS ? "Complet" : `Capturer ${getPointLabel(value.length)}`}
          </Button>
          {value.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
              <RotateCcw className="h-4 w-4 mr-1" />Effacer
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 rounded-lg bg-muted/30 border p-2.5 text-xs text-muted-foreground">
        <span>Placez-vous successivement aux bornes/coins de la parcelle pour délimiter le polygone.</span>
        <a
          href="/dashboard/gps-survey"
          className="font-bold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
        >
          Ouvrir l'outil de Levé GPS complet &rarr;
        </a>
      </div>

      {value.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-2 space-y-1 max-h-[160px] overflow-y-auto">
          {value.map((coord, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="font-mono">
                {getPointLabel(i)}: {coord.lat}, {coord.lng}
              </span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePoint(i)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {value.length >= 3 && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-1">
          <p className="text-sm font-medium text-primary flex items-center gap-1">
            <Plus className="h-3 w-3" /> Polygone — {value.length} sommets
          </p>
          <div className="flex gap-4 text-sm">
            <span><strong>{areaHa}</strong> ha</span>
            <span><strong>{perimeterM.toLocaleString("fr-FR")}</strong> m périmètre</span>
          </div>
        </div>
      )}
    </div>
  );
});

GPSPolygonCapture.displayName = "GPSPolygonCapture";

export const coordsToGeoJSON = (coords: { lat: number; lng: number }[]) => {
  if (coords.length < 3) return null;
  const points = coords.map((c) => [c.lng, c.lat]);
  points.push(points[0]);
  return { type: "Polygon" as const, coordinates: [points] };
};
