/**
 * NAFA FIELD DESIGNER — RAPPORT DE VISITE TERRAIN & INTERVENTION
 * Saisie in-situ sur smartphone ou tablette :
 * - Date, heure, GPS in-situ, parcelle, culture, stade phénologique
 * - Observations, mesures, photos, travaux réalisés, recommandations
 * - Génération instantanée de rapport PDF officiel partageable avec le producteur
 */

import React, { useState } from "react";
import { FieldVisitReport, Farm, Field } from "@/types/fieldDesigner";
import { exportFieldVisitPdf, saveFieldVisitReportPdf } from "@/lib/fieldDesignerPdfExport";
import PdfExportHistoryModal from "@/components/export/PdfExportHistoryModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MapPin,
  Calendar,
  Clock,
  Camera,
  Download,
  Share2,
  Save,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";

interface FieldVisitReportToolProps {
  farm: Farm;
  fields: Field[];
  onSaveVisit: (visit: FieldVisitReport) => void;
  savedVisits: FieldVisitReport[];
  expertName?: string;
}

export const FieldVisitReportTool: React.FC<FieldVisitReportToolProps> = ({
  farm,
  fields,
  onSaveVisit,
  savedVisits,
  expertName,
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string>(fields[0]?.id || "");
  const [visitDate, setVisitDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [visitTime, setVisitTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [cropObserved, setCropObserved] = useState<string>("Oignon / Maraîchage");
  const [growthStage, setGrowthStage] = useState<string>("Grossissement des bulbes (Mi-cycle)");
  const [observations, setObservations] = useState<string>(
    "Parcelle vigoureuse. Léger début de thrips sur la bordure nord-est. Irrigation régulière au goutte-à-goutte."
  );
  const [measurements, setMeasurements] = useState<string>("Humidité sol : 65%, Pression rampes : 1.1 bar");
  const [worksDone, setWorksDone] = useState<string>(
    "Désherbage manuel des interlignes, purge des rampes de refoulement, apport foliaire de purin de neem."
  );
  const [recommendations, setRecommendations] = useState<string>(
    "Maintenir 2h d'arrosage le matin tôt. Éviter tout excès d'azote pour prévenir la pourriture molle en conservation."
  );
  const [nextVisitDate, setNextVisitDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    farm.gps ? { lat: farm.gps.lat, lng: farm.gps.lng } : null
  );
  const [showPdfHistory, setShowPdfHistory] = useState(false);

  const captureGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("Position GPS in-situ relevée.");
      },
      () => toast.error("Impossible de capter la position GPS.")
    );
  };

  const handleSave = () => {
    const report: FieldVisitReport = {
      id: `visit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      farmId: farm.id,
      fieldId: selectedFieldId || undefined,
      visitDate,
      visitTime,
      gps: coords || undefined,
      cropObserved,
      growthStage,
      observations,
      photos: [],
      measurements,
      worksDone,
      recommendations,
      nextVisitDate,
      expertName: expertName || "Ingénieur Agronome",
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveVisit(report);
    toast.success("Rapport d'intervention enregistré avec succès.");
  };

  const handleExportPdf = (report: FieldVisitReport) => {
    const targetField = fields.find((f) => f.id === report.fieldId);
    saveFieldVisitReportPdf(report, farm, targetField);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="rounded-3xl border-2 border-primary/20 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Rapport d'Intervention & Visite Terrain
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consignez vos constatations in-situ et générez un PDF professionnel instantané.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPdfHistory(true)}
                className="h-8 text-xs font-bold rounded-xl gap-1.5 border-primary/30 hover:bg-primary/10"
                title="Consulter l'historique des rapports PDF"
              >
                <FileText className="h-3.5 w-3.5 text-primary" />
                Historique PDF
              </Button>
              <Badge variant="outline" className="text-xs font-bold text-primary">
                Visite In-Situ
              </Badge>
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold">Date de l'intervention</Label>
              <Input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="h-10 rounded-xl text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Heure</Label>
              <Input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="h-10 rounded-xl text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Parcelle inspectée</Label>
              <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                <SelectTrigger className="h-10 rounded-xl text-xs font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.areaHa} ha)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── GPS IN-SITU ── */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border">
            <div className="flex items-center gap-2 text-xs">
              <Navigation className="h-4 w-4 text-primary" />
              <span>
                {coords
                  ? `Position GPS relevée : ${coords.lat.toFixed(5)}°N, ${coords.lng.toFixed(5)}°W`
                  : "Position GPS non encore captée"}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={captureGPS} className="h-8 text-xs rounded-xl gap-1">
              <MapPin className="h-3.5 w-3.5" /> Relever GPS
            </Button>
          </div>

          {/* ── CULTURE ET STADE ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold">Culture observée</Label>
              <Input
                value={cropObserved}
                onChange={(e) => setCropObserved(e.target.value)}
                className="h-10 rounded-xl text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Stade phénologique</Label>
              <Input
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value)}
                className="h-10 rounded-xl text-xs mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold">Mesures physiques in-situ (humidité, débits, taille plants)</Label>
            <Input
              value={measurements}
              onChange={(e) => setMeasurements(e.target.value)}
              className="h-10 rounded-xl text-xs mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-bold">Constatations & Diagnostic de terrain</Label>
            <Textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="rounded-xl text-xs mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-bold">Travaux réalisés lors de la visite</Label>
            <Textarea
              rows={2}
              value={worksDone}
              onChange={(e) => setWorksDone(e.target.value)}
              className="rounded-xl text-xs mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-bold">Prescriptions & Recommandations prioritaires</Label>
            <Textarea
              rows={2}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="rounded-xl text-xs mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-bold">Date de la prochaine visite de suivi</Label>
            <Input
              type="date"
              value={nextVisitDate}
              onChange={(e) => setNextVisitDate(e.target.value)}
              className="h-10 rounded-xl text-xs mt-1 max-w-xs"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              className="flex-1 h-12 rounded-2xl font-black text-sm gradient-primary text-primary-foreground gap-2"
            >
              <Save className="h-5 w-5" />
              Enregistrer le Rapport d'Intervention
            </Button>
            <Button
              onClick={() => {
                handleSave();
                const tempReport: FieldVisitReport = {
                  id: "temp",
                  farmId: farm.id,
                  fieldId: selectedFieldId,
                  visitDate,
                  visitTime,
                  gps: coords || undefined,
                  cropObserved,
                  growthStage,
                  observations,
                  photos: [],
                  measurements,
                  worksDone,
                  recommendations,
                  nextVisitDate,
                  expertName: expertName || "Ingénieur Agronome",
                  syncStatus: "pending",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                handleExportPdf(tempReport);
              }}
              variant="outline"
              className="h-12 rounded-2xl font-black text-sm border-primary text-primary gap-2 px-5"
            >
              <Download className="h-5 w-5" />
              Générer PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── HISTORIQUE DES INTERVENTIONS SUR CETTE FERME ── */}
      {savedVisits.length > 0 && (
        <Card className="rounded-3xl border shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Historique des interventions enregistrées ({savedVisits.length})
            </h3>
            <div className="divide-y divide-border">
              {savedVisits.map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-foreground">
                      Visite du {v.visitDate} à {v.visitTime}
                    </span>
                    <span className="text-muted-foreground block text-[11px] truncate max-w-md">
                      {v.cropObserved} • {v.observations.slice(0, 60)}...
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportPdf(v)}
                    className="h-8 text-xs rounded-xl gap-1 shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal d'historique des rapports de visite PDF */}
      <PdfExportHistoryModal
        open={showPdfHistory}
        onOpenChange={setShowPdfHistory}
        defaultModuleFilter="field_designer"
        title="Historique des Rapports de Visite Terrain"
      />
    </div>
  );
};

