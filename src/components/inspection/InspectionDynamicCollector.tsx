import { useState, useEffect } from "react";
import {
  Inspection,
  InspectionType,
  InspectionTemplate,
  InspectionPhoto,
  InspectionMeasurement,
  nafaInspectionEngine,
} from "@/lib/nafaSmartInspectionEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Camera,
  Video,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Navigation,
  Compass,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  Check,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import InspectionInteractiveSketch from "./InspectionInteractiveSketch";
import InspectionSignaturePad from "./InspectionSignaturePad";
import InspectionVoiceRecorder from "./InspectionVoiceRecorder";

interface InspectionDynamicCollectorProps {
  inspection: Inspection;
  type: InspectionType;
  template: InspectionTemplate;
  onInspectionUpdated: (updated: Inspection) => void;
  onProceedToValidation: () => void;
}

export default function InspectionDynamicCollector({
  inspection,
  type,
  template,
  onInspectionUpdated,
  onProceedToValidation,
}: InspectionDynamicCollectorProps) {
  // GPS State
  const [coords, setCoords] = useState<{
    lat: number | null;
    lng: number | null;
    accuracy: number | null;
    altitude: number | null;
  }>({
    lat: inspection.latitude || null,
    lng: inspection.longitude || null,
    accuracy: inspection.gps_accuracy || null,
    altitude: inspection.altitude || null,
  });
  const [gpsLoading, setGpsLoading] = useState(false);

  // Client info state
  const [clientName, setClientName] = useState(inspection.client_name || "");
  const [clientPhone, setClientPhone] = useState(inspection.client_phone || "");
  const [clientLocation, setClientLocation] = useState(inspection.client_location || "");
  const [expertName, setExpertName] = useState(inspection.expert_name || "Expert NAFA");

  // Dynamic Fields
  const [fields, setFields] = useState<Record<string, any>>(() =>
    nafaInspectionEngine.getInspectionFields(inspection.id)
  );

  // Photos
  const [photos, setPhotos] = useState<InspectionPhoto[]>(() =>
    nafaInspectionEngine.getInspectionPhotos(inspection.id)
  );

  // Measurements
  const [measurements, setMeasurements] = useState<InspectionMeasurement[]>(() =>
    nafaInspectionEngine.getInspectionMeasurements(inspection.id)
  );

  // Video & Voice
  const [hasVoice, setHasVoice] = useState(Boolean(inspection.has_voice_recording));
  const [voiceNotes, setVoiceNotes] = useState(inspection.voice_notes_transcription || "");
  const [sketchUrl, setSketchUrl] = useState<string | null>(inspection.sketch_data_url || null);
  const [clientSigUrl, setClientSigUrl] = useState<string | null>(inspection.client_signature_url || null);
  const [expertSigUrl, setExpertSigUrl] = useState<string | null>(inspection.expert_signature_url || null);

  // Synchronisation des modifications automatiques
  const persistChanges = (extra?: Partial<Inspection>) => {
    const updated = nafaInspectionEngine.updateInspection(inspection.id, {
      client_name: clientName,
      client_phone: clientPhone,
      client_location: clientLocation,
      expert_name: expertName,
      latitude: coords.lat,
      longitude: coords.lng,
      gps_accuracy: coords.accuracy,
      altitude: coords.altitude,
      sketch_data_url: sketchUrl,
      client_signature_url: clientSigUrl,
      expert_signature_url: expertSigUrl,
      has_voice_recording: hasVoice,
      voice_notes_transcription: voiceNotes,
      ...extra,
    });
    nafaInspectionEngine.saveInspectionFields(inspection.id, fields);
    nafaInspectionEngine.saveInspectionPhotos(inspection.id, photos);
    nafaInspectionEngine.saveInspectionMeasurements(inspection.id, measurements);
    onInspectionUpdated(updated);
  };

  // Capture GPS haute précision
  const captureGPS = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par cet appareil");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          altitude: pos.coords.altitude ? Math.round(pos.coords.altitude) : null,
        };
        setCoords(c);
        setGpsLoading(false);
        persistChanges({
          latitude: c.lat,
          longitude: c.lng,
          gps_accuracy: c.accuracy,
          altitude: c.altitude,
        });
        toast.success(`Position GPS verrouillée : ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)} (±${c.accuracy}m)`);
      },
      (err) => {
        setGpsLoading(false);
        toast.error(`Signal GPS faible (${err.message}). Vérifiez l'activation de la localisation.`);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  // Gestion des photos (Checklist obligatoire & prise de vue)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, ruleKey?: string, ruleLabel?: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      const newPhoto = nafaInspectionEngine.addInspectionPhoto(inspection.id, {
        label: ruleLabel || file.name || "Photo terrain",
        photo_url: dataUrl,
        latitude: coords.lat,
        longitude: coords.lng,
        is_mandatory: Boolean(ruleKey),
      });
      const updatedList = [newPhoto, ...photos];
      setPhotos(updatedList);
      persistChanges();
      toast.success(`Photo "${newPhoto.label}" enregistrée avec géotag !`);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (photoId: string) => {
    const next = photos.filter((p) => p.id !== photoId);
    setPhotos(next);
    nafaInspectionEngine.saveInspectionPhotos(inspection.id, next);
  };

  // Gestion des mesures
  const updateMeasurementValue = (index: number, val: number) => {
    const next = [...measurements];
    const m = next[index];
    m.value = val;
    let ok = true;
    if (m.min_threshold != null && val < m.min_threshold) ok = false;
    if (m.max_threshold != null && val > m.max_threshold) ok = false;
    m.is_conforming = ok;
    setMeasurements(next);
    nafaInspectionEngine.saveInspectionMeasurements(inspection.id, next);
  };

  const addCustomMeasurement = () => {
    const newM: InspectionMeasurement = {
      id: crypto.randomUUID(),
      inspection_id: inspection.id,
      name: "Nouvelle mesure technique",
      value: 0,
      unit: "unité",
      is_conforming: true,
      notes: "Mesure libre",
    };
    const next = [...measurements, newM];
    setMeasurements(next);
    nafaInspectionEngine.saveInspectionMeasurements(inspection.id, next);
  };

  const removeMeasurement = (id: string) => {
    const next = measurements.filter((m) => m.id !== id);
    setMeasurements(next);
    nafaInspectionEngine.saveInspectionMeasurements(inspection.id, next);
  };

  // Validation avant passage au rapport
  const handleValidateAndProceed = () => {
    if (!clientName.trim()) {
      toast.error("Veuillez renseigner le nom du client ou de l'exploitation.");
      return;
    }

    // Vérification des photos obligatoires
    const mandatoryRules = template.required_photos.filter((r) => r.is_mandatory);
    const missingPhotos = mandatoryRules.filter(
      (rule) => !photos.some((p) => p.label.toLowerCase().includes(rule.label.toLowerCase()))
    );

    if (missingPhotos.length > 0) {
      toast.warning(
        `Attention : ${missingPhotos.length} photo(s) obligatoire(s) manquante(s) : ${missingPhotos.map((m) => m.label).join(", ")}`
      );
    }

    persistChanges({ status: "en_cours" });
    onProceedToValidation();
  };

  return (
    <div className="space-y-8">
      {/* ── 1. En-tête Client & Localisation Géodésique ── */}
      <Card className="border border-border shadow-xs bg-card">
        <CardHeader className="p-4 pb-2 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2 text-foreground">
              <Compass className="h-4 w-4 text-primary" />
              1. Exploitation & Coordonnées GPS Haute Précision
            </span>
            <Badge variant="outline" className="text-[10px] font-semibold">
              Mission : {type.name}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Nom du Client / Exploitation *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Ferme Agro-Pastorale Wend-Panga"
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Téléphone de contact *</Label>
              <Input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Ex: +226 70 12 34 56"
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Localité / Commune</Label>
              <Input
                value={clientLocation}
                onChange={(e) => setClientLocation(e.target.value)}
                placeholder="Ex: Bobo-Dioulasso, Secteur 22"
                className="text-xs mt-1"
              />
            </div>
          </div>

          {/* Module GPS Haute Précision */}
          <div className="p-3.5 bg-muted/40 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Navigation className="h-3.5 w-3.5 text-primary" />
                <span>Point Géodésique Relevé :</span>
                {coords.lat && coords.lng ? (
                  <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                    Verrouillé (±{coords.accuracy}m)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px]">
                    Non acquis
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {coords.lat && coords.lng
                  ? `Latitude : ${coords.lat.toFixed(6)} | Longitude : ${coords.lng.toFixed(6)} ${coords.altitude ? `| Altitude : ${coords.altitude} m` : ""}`
                  : "Acquérez la position satellite pour certifier l'inspection."}
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={captureGPS}
              disabled={gpsLoading}
              className="gradient-primary text-primary-foreground text-xs font-semibold shrink-0 gap-1.5 shadow-xs"
            >
              <MapPin className="h-3.5 w-3.5" />
              {gpsLoading ? "Acquisition satellite..." : "Acquérir GPS terrain"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Formulaire Dynamique Généré par l'IA ── */}
      <Card className="border border-border shadow-xs bg-card">
        <CardHeader className="p-4 pb-2 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2 text-foreground">
              <FileCheck className="h-4 w-4 text-primary" />
              2. Paramètres Techniques Spécifiques (Généré par NAFA Genius IA)
            </span>
            <span className="text-[11px] text-muted-foreground font-normal">
              {template.fields_schema.length} champs adaptés
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {template.fields_schema.map((schema) => {
              const currentVal = fields[schema.key] !== undefined ? fields[schema.key] : schema.defaultValue;

              if (schema.type === "select") {
                return (
                  <div key={schema.key} className="space-y-1">
                    <Label className="text-xs">
                      {schema.label} {schema.required && "*"}
                    </Label>
                    <Select
                      value={String(currentVal || "")}
                      onValueChange={(val) => {
                        const next = { ...fields, [schema.key]: val };
                        setFields(next);
                        nafaInspectionEngine.saveInspectionFields(inspection.id, next);
                      }}
                    >
                      <SelectTrigger className="text-xs mt-1">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {schema.options?.map((opt) => (
                          <SelectItem key={opt} value={opt} className="text-xs">
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              if (schema.type === "boolean") {
                return (
                  <div key={schema.key} className="flex items-center justify-between p-3 border rounded-xl bg-card">
                    <div>
                      <Label className="text-xs block font-semibold">{schema.label}</Label>
                      {schema.unit && <span className="text-[10px] text-muted-foreground">{schema.unit}</span>}
                    </div>
                    <Switch
                      checked={Boolean(currentVal)}
                      onCheckedChange={(checked) => {
                        const next = { ...fields, [schema.key]: checked };
                        setFields(next);
                        nafaInspectionEngine.saveInspectionFields(inspection.id, next);
                      }}
                    />
                  </div>
                );
              }

              if (schema.type === "textarea") {
                return (
                  <div key={schema.key} className="sm:col-span-2 md:col-span-3 space-y-1">
                    <Label className="text-xs">
                      {schema.label} {schema.required && "*"}
                    </Label>
                    <Textarea
                      value={currentVal || ""}
                      onChange={(e) => {
                        const next = { ...fields, [schema.key]: e.target.value };
                        setFields(next);
                        nafaInspectionEngine.saveInspectionFields(inspection.id, next);
                      }}
                      className="text-xs mt-1"
                      rows={2}
                    />
                  </div>
                );
              }

              return (
                <div key={schema.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">
                      {schema.label} {schema.required && "*"}
                    </Label>
                    {schema.unit && <span className="text-[10px] text-muted-foreground font-mono font-bold">{schema.unit}</span>}
                  </div>
                  <Input
                    type={schema.type === "number" ? "number" : "text"}
                    value={currentVal || ""}
                    onChange={(e) => {
                      const val = schema.type === "number" ? Number(e.target.value) : e.target.value;
                      const next = { ...fields, [schema.key]: val };
                      setFields(next);
                      nafaInspectionEngine.saveInspectionFields(inspection.id, next);
                    }}
                    className="text-xs mt-1"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Checklist des Photos Obligatoires & Prises de vue ── */}
      <Card className="border border-border shadow-xs bg-card">
        <CardHeader className="p-4 pb-2 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2 text-foreground">
              <Camera className="h-4 w-4 text-primary" />
              3. Checklist des Photographies Obligatoires & Géolocalisées
            </span>
            <Badge variant="outline" className="text-[10px]">
              {photos.length} photo(s) archivée(s)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Grille des règles de photos requises */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {template.required_photos.map((rule) => {
              const matchingPhoto = photos.find((p) => p.label.toLowerCase().includes(rule.label.toLowerCase()));
              const isTaken = Boolean(matchingPhoto);

              return (
                <div
                  key={rule.key}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    isTaken ? "bg-emerald-500/5 border-emerald-500/30" : "bg-card border-border"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-foreground line-clamp-1">{rule.label}</span>
                      {isTaken ? (
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 flex items-center gap-1 shrink-0">
                          <Check className="h-2.5 w-2.5" /> Prise
                        </Badge>
                      ) : rule.is_mandatory ? (
                        <Badge variant="destructive" className="text-[9px] shrink-0">
                          Obligatoire
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px] shrink-0">
                          Optionnelle
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{rule.description}</p>
                  </div>

                  {matchingPhoto ? (
                    <div className="mt-3 relative rounded-lg overflow-hidden border border-border group">
                      <img src={matchingPhoto.photo_url} alt={rule.label} className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(matchingPhoto.id)}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                        title="Supprimer la photo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <label className="flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-primary/40 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 cursor-pointer transition-colors">
                        <Camera className="h-3.5 w-3.5" />
                        <span>Prendre photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handlePhotoUpload(e, rule.key, rule.label)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bouton pour ajouter des photos libres supplémentaires */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
            <span className="text-muted-foreground">Ajouter une photo libre supplémentaire :</span>
            <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted font-semibold cursor-pointer text-xs transition-colors">
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>Photo libre</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handlePhotoUpload(e)}
                className="hidden"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Mesures Techniques & Vérification de Conformité ── */}
      <Card className="border border-border shadow-xs bg-card">
        <CardHeader className="p-4 pb-2 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              4. Mesures Techniques & Plages de Tolérance (Normes CIRAD/FAO)
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addCustomMeasurement}
              className="h-7 text-xs font-semibold gap-1"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              Ajouter mesure
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            {measurements.map((m, idx) => (
              <div
                key={m.id}
                className="p-3 rounded-xl border border-border/70 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 space-y-0.5">
                  <span className="font-bold text-foreground block">{m.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    Plage tolérée : {m.min_threshold != null && m.max_threshold != null ? `${m.min_threshold} à ${m.max_threshold} ${m.unit}` : "Libre"}
                    {m.notes ? ` (${m.notes})` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-32">
                    <Input
                      type="number"
                      step="any"
                      value={m.value}
                      onChange={(e) => updateMeasurementValue(idx, Number(e.target.value))}
                      className="h-8 text-xs font-mono text-right"
                    />
                    <span className="font-mono text-muted-foreground font-bold text-[11px]">{m.unit}</span>
                  </div>

                  {m.is_conforming ? (
                    <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10 text-[10px] w-24 justify-center">
                      <Check className="h-3 w-3 mr-1" /> Conforme
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] w-24 justify-center">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Hors norme
                    </Badge>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMeasurement(m.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Notes Vocales & Croquis de Terrain ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notes vocales */}
        <InspectionVoiceRecorder
          initialTranscription={voiceNotes}
          onSaveTranscription={(t) => {
            setVoiceNotes(t);
            persistChanges({ voice_notes_transcription: t });
          }}
          onVoiceRecorded={(has) => {
            setHasVoice(has);
            persistChanges({ has_voice_recording: has });
          }}
        />

        {/* Croquis de terrain tactile */}
        <InspectionInteractiveSketch
          initialDataUrl={sketchUrl}
          onSaveSketch={(url) => {
            setSketchUrl(url);
            persistChanges({ sketch_data_url: url });
          }}
        />
      </div>

      {/* ── 6. Double Signature Électronique (Client + Expert) ── */}
      <Card className="border border-border shadow-xs bg-card">
        <CardHeader className="p-4 pb-2 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2 text-foreground">
              <FileCheck className="h-4 w-4 text-primary" />
              5. Validation Légale & Double Signature Électronique
            </span>
            <span className="text-[11px] text-muted-foreground">Accord contradictoire de visite</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InspectionSignaturePad
              title="Signature du Client"
              signerName={clientName}
              role="client"
              initialSignatureUrl={clientSigUrl}
              onSaveSignature={(sig) => {
                setClientSigUrl(sig);
                persistChanges({ client_signature_url: sig });
              }}
            />

            <InspectionSignaturePad
              title="Signature de l'Expert NAFA"
              signerName={expertName}
              role="expert"
              initialSignatureUrl={expertSigUrl}
              onSaveSignature={(sig) => {
                setExpertSigUrl(sig);
                persistChanges({ expert_signature_url: sig });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── 7. Barre d'action de validation ── */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            persistChanges();
            toast.success("Brouillon sauvegardé en local dans l'appareil.");
          }}
          className="text-xs font-semibold gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          Enregistrer le brouillon
        </Button>

        <Button
          type="button"
          onClick={handleValidateAndProceed}
          className="gradient-primary text-primary-foreground text-xs sm:text-sm font-semibold px-6 shadow-xs gap-2"
        >
          <span>Valider et Générer le Rapport & Devis</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
