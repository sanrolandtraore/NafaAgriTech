import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Loader2, Camera, ImageIcon, Sparkles, AlertCircle, CheckCircle2, Save, WifiOff,
  Clock, History, Trash2, MapPin, Navigation, BookOpen, CloudOff, FileText, ShieldCheck, Leaf,
  AlertTriangle, Edit3, UserCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { BURKINA_CROPS, CROP_GROUPS, cropLabel } from "@/lib/burkinaCrops";
import {
  addPendingDiagnosis,
  getPendingDiagnoses,
  removePendingDiagnosis,
  getLocalHistory,
  saveLocalHistory,
  addLocalHistory,
  type PendingDiagnosis,
  type LocalDiagnosis,
} from "@/lib/offlineDiagnoses";
import { findLocalAgronomicAdvice, type OfflineAgronomicAdvice } from "@/lib/offlineAgronomicKnowledge";
import { recordExpertCorrection } from "@/lib/nafaGeniusLearning";
import { PrescriptionGenerator, type PrescriptionInitialData } from "./PrescriptionGenerator";

export interface Diagnosis {
  diagnosis_summary: string;
  cause_type: string;
  cause_name: string;
  confidence: number;
  severity: string;
  treatment_bio: string;
  treatment_chemical: string;
  preventive_actions: string[];
  inera_reference?: string;
  engine_source?: "cloud_vision" | "inera_expert" | "expert_field_validated";
  is_unrecognized?: boolean;
  requires_expert_validation?: boolean;
  expert_certified?: boolean;
  certified_by?: string;
  certified_at?: string;
  expert_notes?: string;
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function CropDiagnosisTool() {
  const { user, profile } = useAuth();
  const [cropKey, setCropKey] = useState<string>("");
  const [symptoms, setSymptoms] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [parcelName, setParcelName] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState<PendingDiagnosis[]>([]);
  const [history, setHistory] = useState<LocalDiagnosis[]>([]);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionInitialData | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // ── Compléments & Certification Terrain par l'Expert ──
  const [isExpertEditing, setIsExpertEditing] = useState(false);
  const [expertCauseName, setExpertCauseName] = useState("");
  const [expertCauseType, setExpertCauseType] = useState("maladie");
  const [expertSeverity, setExpertSeverity] = useState("moyen");
  const [expertTreatmentBio, setExpertTreatmentBio] = useState("");
  const [expertTreatmentChemical, setExpertTreatmentChemical] = useState("");
  const [expertPreventive, setExpertPreventive] = useState("");
  const [expertIneraRef, setExpertIneraRef] = useState("Station de Recherche INERA Farako-Bâ / Kamboinsé");
  const [expertNotes, setExpertNotes] = useState("");

  // ── Statut de Connexion ──
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // ── Géolocalisation GPS Terrain ──
  const captureGPS = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS non supporté", description: "Ce navigateur ne supporte pas la géolocalisation.", variant: "destructive" });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        toast({ title: "Position GPS acquise", description: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` });
      },
      (err) => {
        setGpsLoading(false);
        toast({ title: "Signal GPS introuvable", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  // ── Historique local et synchronisation ──
  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      const local = await getLocalHistory(user.id);
      setHistory(local);
      if (!navigator.onLine) return;
      const { data } = await supabase
        .from("crop_diagnoses")
        .select("*")
        .eq("expert_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) {
        const rows = data.map((d: any) => ({ ...d, synced: true })) as LocalDiagnosis[];
        const unsynced = local.filter((l) => !l.synced);
        const merged = [...unsynced, ...rows];
        setHistory(merged);
        await saveLocalHistory(user.id, merged);
      }
    } catch (err) {
      console.warn("Erreur chargement historique:", err);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
    getPendingDiagnoses().then(setPending);
  }, [loadHistory]);

  const onFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast({ title: "Image trop volumineuse", description: "Le fichier ne doit pas dépasser 8 Mo.", variant: "destructive" });
      return;
    }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const resetForm = () => {
    setResult(null);
    setImageFile(null);
    setImagePreview("");
    setSymptoms("");
    setCoords(null);
    setParcelName("");
  };

  /**
   * Diagnostic Hybride Résilient :
   * 1. Tentative d'appel Edge Function Cloud Gemini (avec timeout).
   * 2. Si échec ou indisponibilité réseau, basculement transparent sur le moteur expert local INERA.
   */
  const executeHybridDiagnosis = async (payload: {
    imageBase64?: string;
    mimeType?: string;
    cropKey: string;
    symptoms: string;
  }): Promise<Diagnosis> => {
    // Si en ligne, tenter l'analyse Cloud avec un délai maximum de 12 secondes
    if (navigator.onLine) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout réseau Cloud")), 12000)
        );

        const invokePromise = supabase.functions.invoke("diagnose-crop", { body: payload });
        const res: any = await Promise.race([invokePromise, timeoutPromise]);

        if (res?.data?.success && res?.data?.diagnosis) {
          return {
            ...res.data.diagnosis,
            engine_source: "cloud_vision",
            inera_reference: "Analyse Multimodale Gemini & Protocole INERA",
          };
        }
      } catch (cloudErr) {
        console.warn("Échec Edge Function Cloud, basculement Moteur Expert INERA :", cloudErr);
      }
    }

    // Basculement Moteur Expert Local Scientifique INERA
    const localAdvice = findLocalAgronomicAdvice(payload.cropKey, payload.symptoms, !!payload.imageBase64);
    if (localAdvice) {
      return {
        diagnosis_summary: localAdvice.diagnosis_summary,
        cause_type: localAdvice.cause_type,
        cause_name: localAdvice.cause_name,
        confidence: localAdvice.confidence,
        severity: localAdvice.severity,
        treatment_bio: localAdvice.treatment_bio,
        treatment_chemical: localAdvice.treatment_chemical,
        preventive_actions: localAdvice.preventive_actions,
        inera_reference: localAdvice.inera_reference || "Fiche de référence INERA / CSP-CILSS",
        engine_source: "inera_expert",
        is_unrecognized: false,
        requires_expert_validation: false,
      };
    }

    // Règle absolue de Vérité Réelle des Données :
    // Si aucun cas ne correspond avec certitude dans la base de connaissances INERA,
    // l'IA le signale formellement et ne produit aucun diagnostic arbitraire.
    return {
      diagnosis_summary: "Les symptômes décrits ou l'image transmise ne correspondent à aucune affection certifiée dans la base scientifique INERA avec une certitude suffisante.",
      cause_type: "inconnu",
      cause_name: "Affection Non Reconnue avec Certitude",
      confidence: 0.15,
      severity: "indéterminé",
      treatment_bio: "En attente de diagnostic terrain par un ingénieur / conseiller agronomique agréé.",
      treatment_chemical: "Aucun traitement chimique ne doit être appliqué sans identification préalable certifiée par un expert.",
      preventive_actions: [
        "Isoler les plants symptomatiques pour éviter une contagion potentielle",
        "Prendre des photos nettes sous plusieurs angles (feuilles, tiges, collet)",
        "Faire appel à un ingénieur agronome référent pour prélèvement et diagnostic de terrain",
      ],
      inera_reference: "Signalement Terrain - En attente d'expertise humaine INERA",
      engine_source: "inera_expert",
      is_unrecognized: true,
      requires_expert_validation: true,
    };
  };

  const diagnose = async () => {
    if (!imageFile && !symptoms.trim() && !cropKey) {
      toast({
        title: "Données insuffisantes",
        description: "Veuillez sélectionner une culture, prendre une photo ou décrire les symptômes observés.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const imageBase64 = imageFile ? await fileToBase64(imageFile) : undefined;
      const mimeType = imageFile?.type;

      // Si mode hors-ligne, mise en file d'attente automatique avec GPS
      if (!navigator.onLine) {
        await addPendingDiagnosis({
          cropKey,
          symptoms,
          imageBase64,
          mimeType,
          imagePreview,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          parcelName: parcelName || undefined,
        });
        setPending(await getPendingDiagnoses());
      }

      // Calcul du diagnostic hybride résilient
      const diag = await executeHybridDiagnosis({ imageBase64, mimeType, cropKey, symptoms });
      setResult(diag);

      if (diag.is_unrecognized) {
        setIsExpertEditing(true);
        setExpertCauseName("");
        setExpertCauseType("maladie");
        setExpertSeverity("moyen");
        setExpertTreatmentBio("");
        setExpertTreatmentChemical("");
        setExpertPreventive("");
        setExpertIneraRef("Station de Recherche INERA / Contrôle Phyto");
        toast({
          title: "Affection non reconnue avec certitude",
          description: "Donnée non certifiée. Veuillez apporter des compléments d'expertise ci-dessous.",
          variant: "destructive",
        });
      } else {
        setIsExpertEditing(false);
        setExpertCauseName(diag.cause_name);
        setExpertCauseType(diag.cause_type);
        setExpertSeverity(diag.severity);
        setExpertTreatmentBio(diag.treatment_bio);
        setExpertTreatmentChemical(diag.treatment_chemical);
        setExpertPreventive(diag.preventive_actions ? diag.preventive_actions.join("\n") : "");
        setExpertIneraRef(diag.inera_reference || "Fiche Technique INERA");
        toast({
          title: "Diagnostic Agronomique Établi",
          description: "Conforme aux protocoles de recherche INERA Burkina.",
        });
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'établir le diagnostic. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Validation et Certification Terrain par l'Expert ──
  const handleCertifyExpertDiagnosis = async () => {
    if (!expertCauseName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez renseigner le nom réel de l'affection constatée sur le terrain.",
        variant: "destructive",
      });
      return;
    }

    const updatedDiag: Diagnosis = {
      ...result!,
      cause_name: expertCauseName.trim(),
      cause_type: expertCauseType,
      severity: expertSeverity,
      treatment_bio: expertTreatmentBio.trim() || "Traitement bio adapté défini par l'expert.",
      treatment_chemical: expertTreatmentChemical.trim() || "Traitement chimique homologué CSP défini par l'expert.",
      preventive_actions: expertPreventive.trim()
        ? expertPreventive.split("\n").filter((l) => l.trim())
        : ["Surveillance régulière de la parcelle", "Mesures prophylactiques définies par l'expert"],
      inera_reference: expertIneraRef.trim() || "Validation Terrain Expert Référent NAFA / INERA",
      diagnosis_summary: `Diagnostic de terrain certifié par l'expert : ${expertCauseName.trim()} (${expertCauseType}, sévérité ${expertSeverity}).`,
      confidence: 1.0,
      is_unrecognized: false,
      requires_expert_validation: false,
      expert_certified: true,
      certified_by: profile?.full_name || "Expert Agronome Agréé",
      certified_at: new Date().toISOString(),
      engine_source: "expert_field_validated",
      expert_notes: expertNotes.trim() || undefined,
    };

    setResult(updatedDiag);
    setIsExpertEditing(false);

    // Enregistrement supervisé dans le corpus d'apprentissage NAFA Genius
    try {
      await recordExpertCorrection({
        category: "diagnosis_protocol",
        context: {
          region: "Burkina Faso",
          cropOrAnimal: cropKey,
          initialRecommendation: {
            symptoms,
            initialDiag: result?.cause_name,
          },
        },
        correctedValue: {
          cause_name: expertCauseName.trim(),
          cause_type: expertCauseType,
          severity: expertSeverity,
          treatment_bio: expertTreatmentBio.trim(),
          treatment_chemical: expertTreatmentChemical.trim(),
        },
        expertJustification: `Diagnostic terrain certifié par ${profile?.full_name || "Expert"}. Notes: ${expertNotes.trim() || "Conforme INERA"}`,
        expertUserId: user?.id,
      });
    } catch (err) {
      console.warn("Enregistrement corpus supervisé ignoré :", err);
    }

    // Sauvegarde immédiate
    await persist(updatedDiag, cropKey, symptoms, imageFile, coords, parcelName);
    toast({
      title: "Diagnostic certifié avec succès !",
      description: "Donnée réelle enregistrée et intégrée au corpus de connaissances de la plateforme.",
    });
  };

  // ── Sauvegarde et Archivage Sécurisé ──
  const persist = async (
    diag: Diagnosis,
    crop: string,
    symp: string,
    file: File | null,
    gpsCoords?: { lat: number; lng: number } | null,
    parcel?: string | null
  ) => {
    if (!user) return;
    const localRow: LocalDiagnosis = {
      id: `local-${Date.now()}`,
      crop_key: crop || null,
      symptoms_input: symp || null,
      diagnosis_summary: diag.diagnosis_summary,
      confidence: diag.confidence,
      treatment_bio: diag.treatment_bio,
      treatment_chemical: diag.treatment_chemical,
      ai_response: diag,
      latitude: gpsCoords?.lat ?? coords?.lat ?? null,
      longitude: gpsCoords?.lng ?? coords?.lng ?? null,
      parcel_name: parcel ?? parcelName ?? null,
      created_at: new Date().toISOString(),
      synced: false,
    };

    if (!navigator.onLine) {
      await addLocalHistory(user.id, localRow);
      await loadHistory();
      return;
    }

    let imagePath: string | null = null;
    if (file) {
      try {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
        const { error: upErr } = await supabase.storage.from("crop-diagnoses").upload(path, file);
        if (!upErr) imagePath = path;
      } catch (upEx) {
        console.warn("Échec upload image distant :", upEx);
      }
    }

    try {
      const { data, error } = await supabase
        .from("crop_diagnoses")
        .insert({
          expert_id: user.id,
          image_path: imagePath,
          crop_key: crop || null,
          symptoms_input: symp || null,
          ai_response: diag as any,
          diagnosis_summary: diag.diagnosis_summary,
          confidence: diag.confidence,
          treatment_bio: diag.treatment_bio,
          treatment_chemical: diag.treatment_chemical,
        })
        .select()
        .single();

      if (!error && data) {
        await addLocalHistory(user.id, {
          ...(data as any),
          latitude: localRow.latitude,
          longitude: localRow.longitude,
          parcel_name: localRow.parcel_name,
          synced: true,
        });
      } else {
        await addLocalHistory(user.id, localRow);
      }
    } catch {
      await addLocalHistory(user.id, localRow);
    }
    await loadHistory();
  };

  const save = async () => {
    if (!result || !user) return;
    setSaving(true);
    try {
      await persist(result, cropKey, symptoms, imageFile, coords, parcelName);
      toast({
        title: "Analyse enregistrée",
        description: navigator.onLine
          ? "Archivée et disponible dans votre historique."
          : "Enregistrée en local dans la base de données de l'appareil (IndexedDB).",
      });
      resetForm();
    } catch (e: any) {
      toast({ title: "Enregistré en local", description: e.message || "Consultable hors-ligne." });
    } finally {
      setSaving(false);
    }
  };

  // ── Préparation de l'ordonnance à partir du diagnostic ──
  const handleOpenPrescription = () => {
    if (!result) return;
    const initial: PrescriptionInitialData = {
      clientName: profile?.full_name || "Exploitant Agricole",
      clientPhone: profile?.phone || "",
      parcel: parcelName ? `${parcelName}${coords ? ` (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : ""}` : "",
      crop: cropLabel(cropKey),
      diagnosis: `${result.cause_name} - ${result.diagnosis_summary}`,
      recommendations: result.preventive_actions ? result.preventive_actions.join("\n• ") : "",
      lines: [
        {
          product: result.treatment_bio.slice(0, 50),
          dose: "Selon protocole bio",
          surface: "1 ha",
          mode: "Pulvérisation foliaire",
          dar: "0 jour (Bio)",
        },
        {
          product: result.treatment_chemical.slice(0, 50),
          dose: "Homologué CSP",
          surface: "1 ha",
          mode: "Traitement ciblé",
          dar: "7 à 14 jours",
        },
      ],
    };
    setPrescriptionData(initial);
    setPrescriptionOpen(true);
  };

  // ── Synchronisation de la file d'attente au retour en ligne ──
  const processPending = useCallback(async () => {
    if (!navigator.onLine || !user) return;
    const list = await getPendingDiagnoses();
    if (!list.length) return;
    for (const item of list) {
      try {
        const diag = await executeHybridDiagnosis({
          imageBase64: item.imageBase64,
          mimeType: item.mimeType,
          cropKey: item.cropKey,
          symptoms: item.symptoms,
        });
        const gps = item.latitude != null && item.longitude != null ? { lat: item.latitude, lng: item.longitude } : null;
        await persist(diag, item.cropKey, item.symptoms, null, gps, item.parcelName);
        await removePendingDiagnosis(item.id);
      } catch {
        // En attente
      }
    }
    setPending(await getPendingDiagnoses());
    toast({ title: "Analyses de terrain synchronisées avec succès !" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (online) processPending();
  }, [online, processPending]);

  const discardPending = async (id: string) => {
    await removePendingDiagnosis(id);
    setPending(await getPendingDiagnoses());
  };

  return (
    <Tabs defaultValue="new" className="space-y-4">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="new">
          <Sparkles className="h-4 w-4 mr-1.5 text-primary" />
          Nouvelle analyse
        </TabsTrigger>
        <TabsTrigger value="history">
          <History className="h-4 w-4 mr-1.5" />
          Historique {history.length ? `(${history.length})` : ""}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="new" className="space-y-4">
        {!online && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-700 dark:text-amber-300">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>Mode terrain hors-ligne actif : analyse instantanée par le moteur expert INERA et synchronisation automatique au retour du réseau.</span>
          </div>
        )}

        {pending.length > 0 && (
          <Card className="p-3.5 space-y-2 border-primary/30 bg-primary/5 rounded-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Clock className="h-4 w-4" />
              {pending.length} analyse(s) de terrain en attente de synchronisation
            </div>
            {pending.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground bg-background p-2 rounded-xl border">
                <span className="flex-1 truncate">
                  <strong>{cropLabel(p.cropKey)}</strong> — {p.symptoms || "Photo enregistrée"}
                  {p.latitude && ` (GPS : ${p.latitude.toFixed(3)}, ${p.longitude?.toFixed(3)})`}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => discardPending(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </Card>
        )}

        <Card className="p-5 space-y-4 rounded-3xl border shadow-sm">
          <div>
            <Label className="font-bold text-sm">Culture concernée</Label>
            <Select value={cropKey} onValueChange={setCropKey}>
              <SelectTrigger className="mt-1 h-11 rounded-xl">
                <SelectValue placeholder="Choisir la culture observée" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {CROP_GROUPS.map((g) => (
                  <SelectGroup key={g}>
                    <SelectLabel className="font-bold text-primary">{g}</SelectLabel>
                    {BURKINA_CROPS.filter((c) => c.group === g).map((c) => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-bold text-sm">Photo de la plante / feuille / ravageur</Label>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <Button type="button" variant="outline" className="h-11 rounded-xl font-semibold gap-2" onClick={() => cameraRef.current?.click()}>
                <Camera className="h-4 w-4 text-primary" /> Prendre une photo
              </Button>
              <Button type="button" variant="outline" className="h-11 rounded-xl font-semibold gap-2" onClick={() => galleryRef.current?.click()}>
                <ImageIcon className="h-4 w-4" /> Galerie d'images
              </Button>
            </div>
            {imagePreview && (
              <div className="relative mt-3 rounded-2xl overflow-hidden border max-h-64 flex justify-center bg-muted/30">
                <img src={imagePreview} alt="Aperçu de la plante analysée" className="object-contain max-h-64 rounded-2xl" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => { setImageFile(null); setImagePreview(""); }}
                  className="absolute top-2 right-2 h-7 px-2 text-xs rounded-lg"
                >
                  Supprimer
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label className="font-bold text-sm">Symptômes ou observations de terrain</Label>
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
              placeholder="Ex : feuilles jaunes en V inversé, trous de chenilles dans les cornets, flétrissement soudain, taches pourpres, présence de toiles ou pucerons..."
              className="mt-1 rounded-xl text-sm leading-relaxed"
            />
          </div>

          {/* Géolocalisation & Identifiant Parcelle Terrain */}
          <div className="rounded-2xl border p-4 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Coordonnées GPS & Parcelle
              </Label>
              {coords && (
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Position acquise
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nom ou référence de la parcelle</Label>
                <Input
                  value={parcelName}
                  onChange={(e) => setParcelName(e.target.value)}
                  placeholder="Ex : Parcelle Nord A2, Bas-fond Bama…"
                  className="h-9 text-xs rounded-xl mt-1"
                />
              </div>
              <div className="flex flex-col justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={captureGPS}
                  disabled={gpsLoading}
                  className="h-9 gap-1.5 text-xs w-full rounded-xl"
                >
                  {gpsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5 text-primary" />}
                  {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Relever la position GPS"}
                </Button>
              </div>
            </div>
            {coords && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span>Lat : {coords.lat.toFixed(5)} | Lng : {coords.lng.toFixed(5)}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setCoords(null)} className="h-5 px-1 text-[11px] text-destructive hover:bg-destructive/10">
                  Effacer coordonnées
                </Button>
              </div>
            )}
          </div>

          <Button onClick={diagnose} disabled={loading} className="w-full h-12 gradient-primary text-primary-foreground font-bold text-base rounded-2xl shadow-primary">
            {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Sparkles className="h-5 w-5 mr-2" />}
            {loading ? "Analyse agronomique en cours..." : "Lancer le Diagnostic IA Opérationnel"}
          </Button>
        </Card>

        {/* Résultat du Diagnostic */}
        {result && (
          <Card className="p-6 space-y-5 border-2 border-primary/40 rounded-3xl shadow-sm bg-card animate-fade-in">
            {/* 1. Alerte Explicite en cas de Non-Reconnaissance */}
            {result.is_unrecognized && (
              <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <span>SYMPTÔMES NON RECONNUS AVEC CERTITUDE PAR L'IA</span>
                  </div>
                  <Badge variant="outline" className="text-[11px] bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 font-mono">
                    Donnée non certifiée INERA
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Conformément au protocole de vérité des données réelles de NAFA AGRITECH, l'IA ne génère pas de diagnostic ni de traitement non vérifié. Les observations de terrain nécessitent la validation ou les compléments d'un ingénieur / expert agréé.
                </p>
              </div>
            )}

            {/* 2. Badge de Certification Terrain par l'Expert */}
            {result.expert_certified && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-between flex-wrap gap-2 text-xs font-semibold">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  Diagnostic certifié par l'Expert Terrain : <strong className="text-foreground">{result.certified_by}</strong>
                </span>
                <Badge className="bg-emerald-600 text-white text-[10px]">Vérité Réelle Certifiée</Badge>
              </div>
            )}

            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                  result.is_unrecognized ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                }`}>
                  {result.is_unrecognized ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-heading font-extrabold text-foreground">{result.cause_name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{result.diagnosis_summary}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs uppercase font-bold py-1 px-3 rounded-full">
                  {result.cause_type}
                </Badge>
                <Badge variant={result.severity === "forte" ? "destructive" : "secondary"} className="text-xs font-bold py-1 px-3 rounded-full">
                  Gravité {result.severity}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold py-1 px-3 rounded-full ${
                    result.is_unrecognized
                      ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                      : "bg-primary/10 text-primary border-primary/30"
                  }`}
                >
                  Certitude {Math.round(result.confidence * 100)}%
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsExpertEditing(!isExpertEditing)}
                  className="h-8 text-xs rounded-full gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {isExpertEditing ? "Fermer compléments" : "Compléter / Valider (Expert)"}
                </Button>
              </div>
            </div>

            {/* 3. Formulaire d'Apport d'Informations Complémentaires par l'Expert */}
            {isExpertEditing && (
              <div className="p-5 rounded-2xl bg-muted/40 border-2 border-primary/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                    <UserCheck className="h-4 w-4 text-primary" /> Apport d'Informations Complémentaires par l'Expert Terrain
                  </h4>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Saisie Réelle
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  En tant qu'expert référent, saisissez les données réelles constatées sur la parcelle. Elles remplaceront les hypothèses de l'IA et enrichiront le corpus supervisé.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <Label className="text-xs font-semibold">Nom réel de la pathologie / cause *</Label>
                    <Input
                      value={expertCauseName}
                      onChange={(e) => setExpertCauseName(e.target.value)}
                      placeholder="Ex : Mildiou de la tomate (Phytophthora infestans)"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Type de cause réelle</Label>
                    <Select value={expertCauseType} onValueChange={setExpertCauseType}>
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maladie" className="text-xs">Maladie fongique / bactérienne</SelectItem>
                        <SelectItem value="ravageur" className="text-xs">Ravageur / Insecte / Acarien</SelectItem>
                        <SelectItem value="carence" className="text-xs">Carence minérale (N, P, K, etc.)</SelectItem>
                        <SelectItem value="stress_hydrique" className="text-xs">Stress hydrique (excès/manque)</SelectItem>
                        <SelectItem value="stress_thermique" className="text-xs">Stress thermique / échaudage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Gravité évaluée sur place</Label>
                    <Select value={expertSeverity} onValueChange={setExpertSeverity}>
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faible" className="text-xs">Faible (surveillance)</SelectItem>
                        <SelectItem value="moyen" className="text-xs">Moyen (intervention requise)</SelectItem>
                        <SelectItem value="forte" className="text-xs">Forte (urgence phytosanitaire)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-xs font-semibold">Protocole Biologique certifié (Sans résidu)</Label>
                    <Textarea
                      rows={2}
                      value={expertTreatmentBio}
                      onChange={(e) => setExpertTreatmentBio(e.target.value)}
                      placeholder="Ex : Huile de neem 50ml/10L d'eau au savon noir le matin..."
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Protocole Chimique homologué CSP-CILSS</Label>
                    <Textarea
                      rows={2}
                      value={expertTreatmentChemical}
                      onChange={(e) => setExpertTreatmentChemical(e.target.value)}
                      placeholder="Ex : Mancozèbe 80% WP à 2 kg/ha avec délai avant récolte de 7 jours..."
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-xs font-semibold">Mesures prophylactiques (1 par ligne)</Label>
                    <Textarea
                      rows={2}
                      value={expertPreventive}
                      onChange={(e) => setExpertPreventive(e.target.value)}
                      placeholder="Arracher et incinérer les plants infectés&#10;Désinfecter les sécateurs à l'eau de javel"
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Référence INERA / Notes de l'Expert</Label>
                    <Textarea
                      rows={2}
                      value={expertNotes}
                      onChange={(e) => setExpertNotes(e.target.value)}
                      placeholder="Observations particulières du sol, climat ou historique cultural..."
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCertifyExpertDiagnosis}
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm rounded-xl"
                >
                  <CheckCircle2 className="h-4 w-4" /> Valider et Certifier ce Diagnostic (Vérité Terrain)
                </Button>
              </div>
            )}

            {result.inera_reference && (
              <div className="flex items-center gap-2 text-xs text-primary font-semibold bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Référence Scientifique : {result.inera_reference}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <Leaf className="h-4 w-4" /> Protocole Biologique (Sans résidu)
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{result.treatment_bio}</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4" /> Protocole Chimique Homologué CSP-CILSS
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{result.treatment_chemical}</p>
              </div>
            </div>

            {result.preventive_actions && result.preventive_actions.length > 0 && (
              <div className="p-4 rounded-2xl bg-muted/40 border space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-primary" /> Mesures prophylactiques & Prévention
                </h4>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {result.preventive_actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions Rapides : Ordonnance PDF & Enregistrement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleOpenPrescription}
                className="h-12 rounded-2xl font-bold border-primary text-primary hover:bg-primary/10 gap-2 shadow-xs"
              >
                <FileText className="h-4 w-4" /> Générer Ordonnance PDF
              </Button>

              <Button
                onClick={save}
                disabled={saving}
                className="h-12 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-primary gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer l'analyse
              </Button>
            </div>
          </Card>
        )}

        {/* Modale d'Édition et Génération de l'Ordonnance Officielle */}
        <Dialog open={prescriptionOpen} onOpenChange={setPrescriptionOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Ordonnance Phytosanitaire Officielle
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Document technique conforme aux recommandations INERA et homologations CSP-CILSS.
              </DialogDescription>
            </DialogHeader>
            {prescriptionData && (
              <PrescriptionGenerator
                initialData={prescriptionData}
                onClose={() => setPrescriptionOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </TabsContent>

      <TabsContent value="history">
        {history.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground rounded-3xl border-dashed">
            Aucune analyse agronomique enregistrée pour le moment.
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {history.map((h) => (
              <AccordionItem key={h.id} value={h.id} className="border rounded-2xl px-4 bg-card shadow-xs">
                <AccordionTrigger className="text-left py-4 hover:no-underline">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-sm truncate">{cropLabel(h.crop_key)}</span>
                      {h.parcel_name && (
                        <Badge variant="secondary" className="text-[10px] font-semibold rounded-md">
                          {h.parcel_name}
                        </Badge>
                      )}
                      {h.synced === false && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 font-semibold">
                          <CloudOff className="h-2.5 w-2.5" /> En attente sync
                        </Badge>
                      )}
                      {h.confidence != null && (
                        <Badge variant="outline" className="text-[10px] shrink-0 font-bold">
                          {Math.round(h.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {new Date(h.created_at).toLocaleDateString("fr-FR")} — {h.diagnosis_summary}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-xs pt-1 pb-4 border-t">
                  {h.latitude && h.longitude && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-mono bg-primary/5 p-2 rounded-xl">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>Coordonnées GPS : {h.latitude.toFixed(5)}, {h.longitude.toFixed(5)}</span>
                    </div>
                  )}
                  {h.symptoms_input && (
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Symptômes notés :</strong> {h.symptoms_input}
                    </p>
                  )}
                  {h.treatment_bio && (
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <strong className="text-emerald-700 dark:text-emerald-300 block mb-1">Traitement bio INERA :</strong>
                      <span className="text-muted-foreground whitespace-pre-wrap">{h.treatment_bio}</span>
                    </div>
                  )}
                  {h.treatment_chemical && (
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <strong className="text-amber-700 dark:text-amber-300 block mb-1">Traitement chimique CSP :</strong>
                      <span className="text-muted-foreground whitespace-pre-wrap">{h.treatment_chemical}</span>
                    </div>
                  )}
                  {Array.isArray(h.ai_response?.preventive_actions) && (
                    <div>
                      <strong className="text-foreground block mb-1">Actions préventives :</strong>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        {h.ai_response.preventive_actions.map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </TabsContent>
    </Tabs>
  );
}
