import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  AlertTriangle, Edit3, UserCheck, Microscope, Search, Info, HelpCircle, Shield,
  Award, RefreshCw, Layers, CheckCheck, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { canAccessDiagnosticTools } from "@/lib/roleAccessControl";
import { DiagnosticAccessGate } from "@/components/security/DiagnosticAccessGate";
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
import { PrescriptionGenerator, type PrescriptionInitialData } from "./PrescriptionGenerator";
import {
  PLANT_SPECIES_CATALOG,
  WEED_SPECIES_CATALOG,
  DISEASE_CATALOG,
  KNOWLEDGE_BASE_DOCUMENTS,
  identifyPlant,
  executeScientificDiagnosisPipeline,
  saveValidatedDiagnosisCase,
  getStoredValidatedCases,
  PlantSpecies,
  WeedSpecies,
  DiseaseRecord,
  AgronomicContext,
  AgronomicSeason,
  SoilType,
  GrowthStage,
  ScientificDiagnosisResult,
  PlantIdentificationResult,
  ConfidenceLevel,
  ValidatedCase,
  PathogenType
} from "@/lib/scientificAgronomicRAG";

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
  engine_source?: "cloud_vision" | "inera_expert" | "expert_field_validated" | "scientific_rag";
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

const BURKINA_REGIONS = [
  "Hauts-Bassins",
  "Boucle du Mouhoun",
  "Centre (Ouagadougou)",
  "Cascades",
  "Nord",
  "Sahel",
  "Centre-Est",
  "Centre-Nord",
  "Centre-Ouest",
  "Centre-Sud",
  "Est",
  "Plateau-Central",
  "Sud-Ouest"
];

// Détection automatique de la saison selon le calendrier burkinabè
function detectCurrentSeason(): AgronomicSeason {
  const month = new Date().getMonth(); // 0 = Jan, 11 = Dec
  if (month >= 5 && month <= 9) return "hivernage"; // Juin à Octobre
  if (month >= 10 || month <= 1) return "saison_seche_fraiche"; // Novembre à Février
  return "saison_seche_chaude"; // Mars à Mai
}

export function CropDiagnosisTool() {
  const { user, profile, primaryRole, partnerType } = useAuth();

  // Les agriculteurs et éleveurs ne doivent en aucun cas accéder au banc de diagnostic
  if (!canAccessDiagnosticTools(primaryRole, partnerType)) {
    return (
      <DiagnosticAccessGate>
        <div />
      </DiagnosticAccessGate>
    );
  }

  // ── Mode de sélection de l'espèce ──
  const [plantMode, setPlantMode] = useState<"culture" | "adventice">("culture");
  const [cropKey, setCropKey] = useState<string>("mais");
  const [weedKey, setWeedKey] = useState<string>("striga_hermonthica");
  const [symptoms, setSymptoms] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // ── Étape 2 : Contexte Agronomique ──
  const [region, setRegion] = useState<string>("Hauts-Bassins");
  const [season, setSeason] = useState<AgronomicSeason>(detectCurrentSeason);
  const [growthStage, setGrowthStage] = useState<GrowthStage>("vegetatif_tallage");
  const [soilType, setSoilType] = useState<SoilType>("sablonneux_dior");
  const [parcelName, setParcelName] = useState("");
  const [parcelHistory, setParcelHistory] = useState("");
  const [affectedOrgans, setAffectedOrgans] = useState<("feuilles" | "tiges" | "collet" | "racines" | "fruits" | "epis")[]>(["feuilles"]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // ── États d'Exécution & Résultats ──
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scientificResult, setScientificResult] = useState<ScientificDiagnosisResult | null>(null);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState<PendingDiagnosis[]>([]);
  const [history, setHistory] = useState<LocalDiagnosis[]>([]);
  const [validatedCases, setValidatedCases] = useState<ValidatedCase[]>(() => getStoredValidatedCases());

  // ── Modale Ordonnance PDF ──
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionInitialData | null>(null);

  // ── Modale / Édition de Certification Expert ──
  const [isExpertEditing, setIsExpertEditing] = useState(false);
  const [expertCauseName, setExpertCauseName] = useState("");
  const [expertCauseType, setExpertCauseType] = useState<PathogenType>("fongique");
  const [expertSeverity, setExpertSeverity] = useState("moyen");
  const [expertTreatmentBio, setExpertTreatmentBio] = useState("");
  const [expertTreatmentChemical, setExpertTreatmentChemical] = useState("");
  const [expertPreventive, setExpertPreventive] = useState("");
  const [expertIneraRef, setExpertIneraRef] = useState("Station de Recherche INERA Farako-Bâ / Kamboinsé");
  const [expertNotes, setExpertNotes] = useState("");

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // ── Statut Réseau ──
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

  const toggleOrgan = (organ: "feuilles" | "tiges" | "collet" | "racines" | "fruits" | "epis") => {
    setAffectedOrgans((prev) =>
      prev.includes(organ) ? prev.filter((o) => o !== organ) : [...prev, organ]
    );
  };

  const resetForm = () => {
    setResult(null);
    setScientificResult(null);
    setImageFile(null);
    setImagePreview("");
    setSymptoms("");
    setCoords(null);
    setParcelName("");
  };

  // ── PIPELINE SCIENTIFIQUE DE DIAGNOSTIC OBLIGATOIRE (4 ÉTAPES) ──
  const runScientificDiagnosis = async () => {
    setLoading(true);
    setResult(null);
    setScientificResult(null);

    try {
      const imageBase64 = imageFile ? await fileToBase64(imageFile) : undefined;
      const mimeType = imageFile?.type;

      // ÉTAPE 1 : Identification de l'espèce & distinction Culture vs Mauvaise Herbe (Adventice)
      const identification = identifyPlant({
        text: symptoms,
        cropKey: plantMode === "culture" ? cropKey : weedKey,
        imageBase64,
        mimeType,
      });

      // ÉTAPE 2 : Assemblage du contexte agronomique vérifié
      const context: AgronomicContext = {
        region,
        gps: coords,
        season,
        growthStage,
        soilType,
        parcelHistory: parcelHistory || undefined,
        symptoms,
        affectedOrgans,
      };

      // Si mode hors-ligne, mise en file d'attente automatique
      if (!navigator.onLine) {
        await addPendingDiagnosis({
          cropKey: plantMode === "culture" ? cropKey : weedKey,
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

      // ÉTAPES 3 & 4 : Recherche RAG Scientifique et Validation
      const pipelineOutput = executeScientificDiagnosisPipeline({
        identification,
        context,
        localValidatedCases: validatedCases,
      });

      setScientificResult(pipelineOutput);

      if (!pipelineOutput.step4Validation.isConfirmed || !pipelineOutput.step4Validation.primaryDiagnosis) {
        // Arrêt ou incertitude : règle de vérité réelle
        setIsExpertEditing(true);
        setExpertCauseName("");
        setExpertCauseType("fongique");
        setExpertSeverity("moyen");
        setExpertTreatmentBio("");
        setExpertTreatmentChemical("");
        setExpertPreventive("");
        setExpertIneraRef("Station de Recherche INERA Farako-Bâ / Kamboinsé");

        toast({
          title: "Preuves scientifiques insuffisantes",
          description: pipelineOutput.step4Validation.inconclusiveNotice || "L'IA ne formule aucun diagnostic non vérifié.",
          variant: "destructive",
        });
      } else {
        const prim = pipelineOutput.step4Validation.primaryDiagnosis;
        setIsExpertEditing(false);
        setExpertCauseName(prim.name);
        setExpertCauseType(prim.pathogenType);
        setExpertSeverity("moyen");
        setExpertTreatmentBio(prim.treatmentBio);
        setExpertTreatmentChemical(prim.treatmentChemical);
        setExpertPreventive(prim.preventiveActions.join("\n"));
        setExpertIneraRef(prim.officialReferences[0] || "Référentiel INERA / CSP-CILSS");

        // Format de compatibilité pour l'ordonnance et la persistance
        const legacyFormat: Diagnosis = {
          diagnosis_summary: pipelineOutput.step4Validation.agronomicExplanation,
          cause_type: prim.pathogenType,
          cause_name: prim.name,
          confidence: prim.score / 100,
          severity: "moyen",
          treatment_bio: prim.treatmentBio,
          treatment_chemical: prim.treatmentChemical,
          preventive_actions: prim.preventiveActions,
          inera_reference: prim.officialReferences.join(" • "),
          engine_source: "scientific_rag",
          is_unrecognized: false,
        };
        setResult(legacyFormat);

        toast({
          title: "Diagnostic Scientifique Certifié",
          description: `Conforme aux référentiels officiels : ${prim.officialReferences.slice(0, 2).join(", ")}.`,
        });
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erreur d'analyse agronomique",
        description: "Impossible d'exécuter la recherche RAG scientifique.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── AMÉLIORATION CONTINUE : VALIDATION ET ENREGISTREMENT DU CAS DE TERRAIN PAR L'EXPERT ──
  const handleCertifyExpertDiagnosis = async () => {
    if (!expertCauseName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez renseigner le nom réel de l'affection ou de l'adventice constatée sur le terrain.",
        variant: "destructive",
      });
      return;
    }

    try {
      const expertName = profile?.full_name || "Dr. Oumarou Sawadogo (Agronome Référent)";
      
      // Enregistrement dans la table validated_cases pour enrichir les prochaines recherches RAG
      const createdCase = await saveValidatedDiagnosisCase({
        plantSpeciesId: plantMode === "culture" ? cropKey : weedKey,
        isWeed: plantMode === "adventice",
        weedSpeciesId: plantMode === "adventice" ? weedKey : undefined,
        diseaseCatalogId: scientificResult?.step4Validation.primaryDiagnosis?.diseaseId,
        validatedDiseaseName: expertCauseName.trim(),
        pathogenType: expertCauseType,
        contextLocation: { region, gps: coords || undefined },
        contextSeason: season,
        contextSoil: soilType,
        contextGrowthStage: growthStage,
        contextHistory: parcelHistory,
        observedSymptoms: symptoms || "Symptômes relevés in-situ",
        expertNotes: expertNotes.trim() || "Diagnostic certifié conforme INERA",
        certifiedBy: expertName,
        confidenceLevel: "Élevé",
      });

      setValidatedCases(getStoredValidatedCases());

      const updatedDiag: Diagnosis = {
        cause_name: expertCauseName.trim(),
        cause_type: expertCauseType,
        severity: expertSeverity,
        treatment_bio: expertTreatmentBio.trim() || "Traitement bio adapté défini par l'expert.",
        treatment_chemical: expertTreatmentChemical.trim() || "Traitement chimique homologué CSP défini par l'expert.",
        preventive_actions: expertPreventive.trim()
          ? expertPreventive.split("\n").filter((l) => l.trim())
          : ["Surveillance régulière de la parcelle", "Mesures prophylactiques définies par l'expert"],
        inera_reference: expertIneraRef.trim() || "Validation Terrain Expert Référent NAFA / INERA",
        diagnosis_summary: `Diagnostic terrain certifié par l'expert : ${expertCauseName.trim()} (${expertCauseType}, sévérité ${expertSeverity}). Intégré à la base de connaissances (Cas validé ${createdCase.id.slice(0, 8)}).`,
        confidence: 1.0,
        is_unrecognized: false,
        requires_expert_validation: false,
        expert_certified: true,
        certified_by: expertName,
        certified_at: new Date().toISOString(),
        engine_source: "expert_field_validated",
        expert_notes: expertNotes.trim() || undefined,
      };

      setResult(updatedDiag);
      setIsExpertEditing(false);

      // Persistance locale et distante
      await persist(updatedDiag, plantMode === "culture" ? cropKey : weedKey, symptoms, imageFile, coords, parcelName);

      toast({
        title: "Cas de terrain validé avec succès !",
        description: "Enregistré dans validated_cases. Il enrichit immédiatement les futures recherches RAG.",
      });
    } catch (err: any) {
      toast({
        title: "Erreur d'enregistrement",
        description: err.message || "Impossible de sauvegarder le cas validé.",
        variant: "destructive",
      });
    }
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
          latitude: gpsCoords?.lat ?? coords?.lat ?? null,
          longitude: gpsCoords?.lng ?? coords?.lng ?? null,
          parcel_name: parcel ?? parcelName ?? null,
        })
        .select()
        .single();

      if (error) {
        localRow.synced = false;
      } else {
        localRow.synced = true;
        localRow.id = data.id;
      }
    } catch {
      localRow.synced = false;
    }

    await addLocalHistory(user.id, localRow);
    await loadHistory();
  };

  const save = async () => {
    if (!result || !user) return;
    setSaving(true);
    try {
      await persist(result, plantMode === "culture" ? cropKey : weedKey, symptoms, imageFile, coords, parcelName);
      toast({
        title: "Analyse agronomique enregistrée",
        description: navigator.onLine
          ? "Archivée et disponible dans votre historique."
          : "Enregistrée en local dans la base IndexedDB de l'appareil.",
      });
      resetForm();
    } catch (e: any) {
      toast({ title: "Enregistré en local", description: e.message || "Consultable hors-ligne." });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPrescription = () => {
    if (!result) return;
    const initial: PrescriptionInitialData = {
      clientName: profile?.full_name || "Exploitant Agricole",
      clientPhone: profile?.phone || "",
      parcel: parcelName ? `${parcelName}${coords ? ` (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : ""}` : "",
      crop: plantMode === "culture" ? cropLabel(cropKey) : `Adventice : ${weedKey}`,
      diagnosis: `${result.cause_name} - ${result.diagnosis_summary}`,
      recommendations: result.preventive_actions ? result.preventive_actions.join("\n• ") : "",
      lines: [
        {
          product: result.treatment_bio.slice(0, 50),
          dose: "Selon protocole bio INERA",
          surface: "1 ha",
          mode: "Pulvérisation foliaire",
          dar: "0 jour (Bio)",
        },
        {
          product: result.treatment_chemical.slice(0, 50),
          dose: "Homologué CSP-CILSS",
          surface: "1 ha",
          mode: "Traitement ciblé",
          dar: "7 à 14 jours",
        },
      ],
    };
    setPrescriptionData(initial);
    setPrescriptionOpen(true);
  };

  const currentPlantInfo = useMemo(() => {
    if (plantMode === "culture") {
      return PLANT_SPECIES_CATALOG.find((p) => p.id === cropKey);
    }
    return WEED_SPECIES_CATALOG.find((w) => w.id === weedKey);
  }, [plantMode, cropKey, weedKey]);

  return (
    <Tabs defaultValue="pipeline" className="space-y-4">
      {/* Barre d'onglets principale */}
      <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/60 rounded-2xl gap-1">
        <TabsTrigger value="pipeline" className="text-xs py-2.5 font-bold gap-1.5 rounded-xl data-[state=active]:bg-card shadow-xs">
          <Microscope className="h-4 w-4 text-emerald-600" />
          <span>Diagnostic Scientifique (4 Étapes)</span>
        </TabsTrigger>
        <TabsTrigger value="weeds" className="text-xs py-2.5 font-bold gap-1.5 rounded-xl data-[state=active]:bg-card shadow-xs">
          <Leaf className="h-4 w-4 text-amber-600" />
          <span>Catalogue Adventices ({WEED_SPECIES_CATALOG.length})</span>
        </TabsTrigger>
        <TabsTrigger value="validated" className="text-xs py-2.5 font-bold gap-1.5 rounded-xl data-[state=active]:bg-card shadow-xs">
          <Award className="h-4 w-4 text-blue-600" />
          <span>Cas Validés ({validatedCases.length})</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="text-xs py-2.5 font-bold gap-1.5 rounded-xl data-[state=active]:bg-card shadow-xs">
          <History className="h-4 w-4 text-purple-600" />
          <span>Historique ({history.length})</span>
        </TabsTrigger>
      </TabsList>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET 1 : PIPELINE DE DIAGNOSTIC AGRONOMIQUE SCIENTIFIQUE (4 ÉTAPES) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <TabsContent value="pipeline" className="space-y-5">
        {!online && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
            <WifiOff className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Mode terrain hors-ligne actif : recherche dans la base locale RAG (INERA, CSP-CILSS, Yara) et synchronisation automatique au retour du réseau.</span>
          </div>
        )}

        {/* Bannière des Sources Officielles Indexées */}
        <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Référentiels & Sources Scientifiques RAG Actives :
            </span>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-700 bg-emerald-500/10 font-bold">
              Vérité Réelle Certifiée
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-foreground/80">
            <span className="px-2 py-0.5 rounded-md bg-muted">INERA</span>
            <span className="px-2 py-0.5 rounded-md bg-muted">CSP-CILSS</span>
            <span className="px-2 py-0.5 rounded-md bg-muted">CNSF</span>
            <span className="px-2 py-0.5 rounded-md bg-muted">CORAF</span>
            <span className="px-2 py-0.5 rounded-md bg-muted">CNRST</span>
            <span className="px-2 py-0.5 rounded-md bg-muted">CREAF</span>
            <span className="px-2 py-0.5 rounded-md bg-muted">SAPHYTO</span>
            <span className="px-2 py-0.5 rounded-md bg-muted">NACOSEM</span>
            <span className="px-2 py-0.5 rounded-md bg-muted">Yara International</span>
          </div>
        </div>

        {/* ─── BLOC ÉTAPE 1 : IDENTIFICATION DE LA PLANTE ─── */}
        <Card className="rounded-3xl border-2 border-emerald-500/30 shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-emerald-500/5 pb-3 border-b border-emerald-500/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center">1</span>
                <CardTitle className="text-base font-bold text-foreground">
                  Étape 1 — Identification de la Plante & Distinction Culture / Adventice
                </CardTitle>
              </div>
              <Badge className="bg-emerald-600 text-white text-xs">Obligatoire</Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              L'IA doit obligatoirement certifier l'espèce et distinguer une culture d'une mauvaise herbe avant toute recherche de maladie.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Bascule Culture vs Adventice */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlantMode("culture")}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  plantMode === "culture"
                    ? "border-emerald-600 bg-emerald-500/10 shadow-xs"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Leaf className={`h-4 w-4 ${plantMode === "culture" ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <span className="text-sm font-bold text-foreground">Culture Agricole</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Maïs, Sorgho, Mil, Riz, Tomate, Coton, etc.</p>
              </button>

              <button
                type="button"
                onClick={() => setPlantMode("adventice")}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  plantMode === "adventice"
                    ? "border-amber-600 bg-amber-500/10 shadow-xs"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${plantMode === "adventice" ? "text-amber-600" : "text-muted-foreground"}`} />
                  <span className="text-sm font-bold text-foreground">Mauvaise Herbe (Adventice)</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Striga, Souchet, Echinochloa, Comméline, etc.</p>
              </button>
            </div>

            {/* Sélecteur de Culture ou d'Adventice */}
            {plantMode === "culture" ? (
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">Culture observée sur la parcelle *</Label>
                <Select value={cropKey} onValueChange={setCropKey}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Choisir la culture" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {PLANT_SPECIES_CATALOG.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.commonName} — <em>{c.scientificName}</em> ({c.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">Mauvaise herbe suspectée / observée *</Label>
                <Select value={weedKey} onValueChange={setWeedKey}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Choisir l'adventice" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {WEED_SPECIES_CATALOG.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.commonName} — <em>{w.scientificName}</em> (Risque {w.riskLevel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Fiche d'identification botanique certifiée */}
            {currentPlantInfo && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-card border flex items-center justify-center shrink-0 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-foreground text-sm">{currentPlantInfo.commonName}</strong>
                    <span className="italic text-muted-foreground font-mono">({currentPlantInfo.scientificName})</span>
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      Famille : {currentPlantInfo.family}
                    </Badge>
                    <Badge
                      className={`text-[10px] font-bold ${
                        plantMode === "adventice"
                          ? "bg-amber-600 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {plantMode === "adventice" ? "Mauvaise herbe confirmée" : "Culture vivrière/rente"}
                    </Badge>
                  </div>
                  {"distinctiveFeatures" in currentPlantInfo && (
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      <strong>Signes distinctifs :</strong> {currentPlantInfo.distinctiveFeatures.slice(0, 2).join(" • ")}
                    </p>
                  )}
                  {"burkinaVarieties" in currentPlantInfo && (
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      <strong>Variétés certifiées INERA :</strong> {currentPlantInfo.burkinaVarieties.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Prise de photos avec consigne scientifique */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-xs">Photographies de l'échantillon (Obligatoire pour vision IA)</Label>
                <span className="text-[11px] text-muted-foreground">Angles recommandés : feuille nette, collet, fleur</span>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
              
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" className="h-11 rounded-xl font-semibold gap-2" onClick={() => cameraRef.current?.click()}>
                  <Camera className="h-4 w-4 text-emerald-600" /> Photo appareil
                </Button>
                <Button type="button" variant="outline" className="h-11 rounded-xl font-semibold gap-2" onClick={() => galleryRef.current?.click()}>
                  <ImageIcon className="h-4 w-4" /> Galerie d'images
                </Button>
              </div>

              {imagePreview && (
                <div className="relative mt-2 rounded-2xl overflow-hidden border max-h-60 flex justify-center bg-muted/20">
                  <img src={imagePreview} alt="Échantillon de plante" className="object-contain max-h-60 rounded-2xl" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => { setImageFile(null); setImagePreview(""); }}
                    className="absolute top-2 right-2 h-7 px-2.5 text-xs rounded-lg"
                  >
                    Supprimer
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── BLOC ÉTAPE 2 : VÉRIFICATION DU CONTEXTE AGRONOMIQUE ─── */}
        <Card className="rounded-3xl border-2 border-sky-500/30 shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-sky-500/5 pb-3 border-b border-sky-500/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-sky-600 text-white text-xs font-extrabold flex items-center justify-center">2</span>
                <CardTitle className="text-base font-bold text-foreground">
                  Étape 2 — Vérification du Contexte Agronomique de la Parcelle
                </CardTitle>
              </div>
              <Badge className="bg-sky-600 text-white text-xs">Explicabilité</Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Intègre la région, saison, phénologie, sol, historique et organes touchés pour éliminer les faux diagnostics.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Région */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">Région du Burkina</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BURKINA_REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Saison */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">Saison culturale</Label>
                <Select value={season} onValueChange={(v: AgronomicSeason) => setSeason(v)}>
                  <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hivernage">Hivernage (Juin - Octobre)</SelectItem>
                    <SelectItem value="saison_seche_fraiche">Saison sèche fraîche (Nov - Fév)</SelectItem>
                    <SelectItem value="saison_seche_chaude">Saison sèche chaude (Mars - Mai)</SelectItem>
                    <SelectItem value="contre_saison_irrigee">Contre-saison maraîchère irriguée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stade Phénologique */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">Stade de développement</Label>
                <Select value={growthStage} onValueChange={(v: GrowthStage) => setGrowthStage(v)}>
                  <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="levee_jeune_plant">Levée / Jeune plant (0-20j)</SelectItem>
                    <SelectItem value="vegetatif_tallage">Végétatif / Tallage actif</SelectItem>
                    <SelectItem value="floraison_epiaison">Floraison / Épiaison</SelectItem>
                    <SelectItem value="fructification_grossissement">Fructification / Remplissage grains</SelectItem>
                    <SelectItem value="maturation_recolte">Maturation / Proche récolte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type de Sol */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">Type de sol de la parcelle</Label>
                <Select value={soilType} onValueChange={(v: SoilType) => setSoilType(v)}>
                  <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sablonneux_dior">Sablonneux filtrant (Dior)</SelectItem>
                    <SelectItem value="argileux">Argileux lourd</SelectItem>
                    <SelectItem value="limoneux_alluvial">Limoneux alluvial de berge</SelectItem>
                    <SelectItem value="gravillonnaire">Gravillonnaire cuirassé</SelectItem>
                    <SelectItem value="bas_fond_hydromorphe">Bas-fond hydromorphe</SelectItem>
                    <SelectItem value="vertisol">Vertisol (Plaine Sourou)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Organes Végétaux Atteints (Multi-sélection) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold block">Organes végétaux présentant des lésions / anomalies :</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "feuilles", label: "Feuilles" },
                  { id: "tiges", label: "Tiges & Collet" },
                  { id: "racines", label: "Racines" },
                  { id: "fruits", label: "Fruits / Gousses" },
                  { id: "epis", label: "Épis / Panicules" },
                ].map((organ) => {
                  const active = affectedOrgans.includes(organ.id as any);
                  return (
                    <button
                      key={organ.id}
                      type="button"
                      onClick={() => toggleOrgan(organ.id as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        active
                          ? "bg-sky-600 text-white shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {active ? <CheckCheck className="h-3.5 w-3.5" /> : null}
                      <span>{organ.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description détaillée des symptômes */}
            <div className="space-y-1.5">
              <Label className="font-bold text-xs">Symptômes visibles détaillés *</Label>
              <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={3}
                placeholder="Ex : Taches circulaires nécrotiques avec halo jaune sur feuilles basses, présence de sciure dans le cornet, flétrissement soudain au soleil, enroulement en cigare, fleur rose le long de la tige..."
                className="rounded-xl text-xs leading-relaxed"
              />
            </div>

            {/* Coordonnées GPS & Parcelle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-xs text-muted-foreground">Référence ou nom de la parcelle</Label>
                <Input
                  value={parcelName}
                  onChange={(e) => setParcelName(e.target.value)}
                  placeholder="Ex : Parcelle Nord A3 Bama"
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
                  className="h-9 gap-1.5 text-xs rounded-xl"
                >
                  {gpsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5 text-sky-600" />}
                  {coords ? `GPS : ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Relever la position GPS in-situ"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bouton de Lancement du Diagnostic RAG */}
        <Button
          onClick={runScientificDiagnosis}
          disabled={loading}
          className="w-full h-12 gradient-primary text-primary-foreground font-bold text-sm sm:text-base rounded-2xl shadow-primary gap-2"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {loading ? "Recherche RAG dans les bases INERA, CILSS & Yara..." : "Lancer le Diagnostic Scientifique RAG"}
        </Button>

        {/* ─── BLOC ÉTAPES 3 & 4 : RÉSULTAT DU DIAGNOSTIC SCIENTIFIQUE ─── */}
        {scientificResult && (
          <Card className="rounded-3xl border-2 border-primary/40 shadow-sm overflow-hidden bg-card animate-fade-in space-y-0">
            <CardHeader className="bg-primary/10 pb-4 border-b">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-extrabold flex items-center justify-center">4</span>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Étape 4 — Résultat Validé & Explicabilité Agronomique
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs font-bold py-1 px-3 ${
                      scientificResult.step4Validation.confidenceLevel === "Élevé"
                        ? "bg-emerald-600 text-white"
                        : scientificResult.step4Validation.confidenceLevel === "Moyen"
                        ? "bg-amber-600 text-white"
                        : "bg-destructive text-white"
                    }`}
                  >
                    Confiance : {scientificResult.step4Validation.confidenceLevel}
                  </Badge>
                  <Badge variant="outline" className="text-xs uppercase font-bold">
                    Pôle : {scientificResult.step3PathogenType}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Cas d'incertitude / Non-confirmation formelle */}
              {!scientificResult.step4Validation.isConfirmed ? (
                <div className="p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-base text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                    <span>DIAGNOSTIC NON CONFIRMÉ PAR LES DONNÉES SCIENTIFIQUES</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    {scientificResult.step4Validation.inconclusiveNotice}
                  </p>
                  <p className="text-xs text-muted-foreground border-t border-amber-500/30 pt-2">
                    Conformément aux règles de rigueur scientifique de NAFA-AGRITECH, l'IA refuse de délivrer une prescription hasardeuse. Vous pouvez consigner vos observations ci-dessous pour validation par un agronome référent.
                  </p>
                </div>
              ) : (
                <>
                  {/* Affichage du Diagnostic Principal Validé */}
                  {scientificResult.step4Validation.primaryDiagnosis && (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                            Diagnostic Principal Documenté
                          </span>
                          <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-foreground">
                            {scientificResult.step4Validation.primaryDiagnosis.name}
                          </h3>
                          <p className="text-xs italic text-muted-foreground font-mono mt-0.5">
                            {scientificResult.step4Validation.primaryDiagnosis.scientificName}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsExpertEditing(!isExpertEditing)}
                          className="h-9 text-xs rounded-xl gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          {isExpertEditing ? "Fermer la certification" : "Certifier ce cas (Expert Agronome)"}
                        </Button>
                      </div>

                      {/* Explication Agronomique et Causalité */}
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-xs sm:text-sm leading-relaxed space-y-2">
                        <strong className="text-foreground block text-xs font-bold uppercase tracking-wider">
                          Raisonnement & Causalité Agronomique :
                        </strong>
                        <p className="text-foreground/90">
                          {scientificResult.step4Validation.agronomicExplanation}
                        </p>
                      </div>

                      {/* Références Officielles Citées */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-primary font-semibold bg-primary/10 border border-primary/20 p-3 rounded-2xl">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                        <span>Sources et référentiels officiels :</span>
                        {scientificResult.step4Validation.primaryDiagnosis.officialReferences.map((ref, idx) => (
                          <span key={idx} className="bg-card px-2 py-0.5 rounded-lg border border-primary/20 text-[11px]">
                            {ref}
                          </span>
                        ))}
                      </div>

                      {/* Protocoles de Traitement Biologique et Chimique CSP */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                          <h4 className="font-bold text-xs sm:text-sm flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                            <Leaf className="h-4 w-4 text-emerald-600" /> Protocole Biologique & Prophylactique (Sans Résidu)
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {scientificResult.step4Validation.primaryDiagnosis.treatmentBio}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                          <h4 className="font-bold text-xs sm:text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <AlertCircle className="h-4 w-4 text-amber-600" /> Protocole Chimique Homologué CSP-CILSS (Avec DAR)
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {scientificResult.step4Validation.primaryDiagnosis.treatmentChemical}
                          </p>
                        </div>
                      </div>

                      {/* Mesures prophylactiques */}
                      {scientificResult.step4Validation.primaryDiagnosis.preventiveActions.length > 0 && (
                        <div className="p-4 rounded-2xl bg-muted/40 border space-y-2">
                          <h4 className="font-bold text-xs sm:text-sm flex items-center gap-1.5 text-foreground">
                            <BookOpen className="h-4 w-4 text-primary" /> Mesures prophylactiques et gestion préventive
                          </h4>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                            {scientificResult.step4Validation.primaryDiagnosis.preventiveActions.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Diagnostics Différentiels */}
                  {scientificResult.step4Validation.differentialDiagnoses.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                        Diagnostics Différentiels Écartés ou Secondaires :
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {scientificResult.step4Validation.differentialDiagnoses.map((diff) => (
                          <div key={diff.diseaseId} className="p-3 rounded-xl bg-card border text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <strong className="text-foreground">{diff.name}</strong>
                              <span className="text-[10px] font-mono text-muted-foreground">{diff.score}%</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2">{diff.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ─── FORMULAIRE EXPERT DE CERTIFICATION (AMÉLIORATION CONTINUE) ─── */}
              {isExpertEditing && (
                <div className="p-5 rounded-3xl bg-muted/50 border-2 border-primary/40 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                      <UserCheck className="h-4 w-4 text-primary" /> Certification de Terrain par l'Agronome Référent
                    </h4>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                      Boucle RAG Apprenante (validated_cases)
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Chaque diagnostic confirmé sur le terrain devient un cas validé enregistré dans la table <code>validated_cases</code>. Il améliore les futures recherches RAG locales sans modifier le modèle de base.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <Label className="text-xs font-semibold">Nom certifié de la pathologie / adventice *</Label>
                      <Input
                        value={expertCauseName}
                        onChange={(e) => setExpertCauseName(e.target.value)}
                        placeholder="Ex : Mildiou de la tomate (Phytophthora)"
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Type de cause scientifique</Label>
                      <Select value={expertCauseType} onValueChange={(v: PathogenType) => setExpertCauseType(v)}>
                        <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fongique">Maladie fongique</SelectItem>
                          <SelectItem value="bacterienne">Maladie bactérienne</SelectItem>
                          <SelectItem value="virale">Maladie virale</SelectItem>
                          <SelectItem value="ravageur">Ravageur / Insecte / Acarien</SelectItem>
                          <SelectItem value="carence">Carence nutritionnelle (Guide Yara)</SelectItem>
                          <SelectItem value="stress_hydrique">Stress hydrique</SelectItem>
                          <SelectItem value="degat_mecanique">Dégât mécanique / brûlure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Sévérité in-situ</Label>
                      <Select value={expertSeverity} onValueChange={setExpertSeverity}>
                        <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faible">Faible (vigilance)</SelectItem>
                          <SelectItem value="moyen">Moyen (seuil économique atteint)</SelectItem>
                          <SelectItem value="forte">Forte (urgence d'intervention)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <Label className="text-xs font-semibold">Protocole Biologique certifié</Label>
                      <Textarea
                        rows={2}
                        value={expertTreatmentBio}
                        onChange={(e) => setExpertTreatmentBio(e.target.value)}
                        placeholder="Ex : Extrait aqueux de neem 50g/L + savon liquide le matin..."
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Protocole Chimique homologué CSP-CILSS</Label>
                      <Textarea
                        rows={2}
                        value={expertTreatmentChemical}
                        onChange={(e) => setExpertTreatmentChemical(e.target.value)}
                        placeholder="Ex : Émaméctine benzoate 50 g/kg à 250 g/ha avec DAR de 7 jours..."
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Notes d'observation de l'expert & Références</Label>
                    <Textarea
                      rows={2}
                      value={expertNotes}
                      onChange={(e) => setExpertNotes(e.target.value)}
                      placeholder="Contexte spécifique de la parcelle, antécédents, observations du sol..."
                      className="text-xs mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleCertifyExpertDiagnosis}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 rounded-xl shadow-xs"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Certifier ce Cas & Enrichir la Base RAG (Vérité Réelle)
                  </Button>
                </div>
              )}

              {/* Actions : Ordonnance PDF & Sauvegarde */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={handleOpenPrescription}
                  className="h-12 rounded-2xl font-bold border-primary text-primary hover:bg-primary/10 gap-2 shadow-xs"
                >
                  <FileText className="h-4 w-4" /> Générer Ordonnance Phytosanitaire PDF
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
            </CardContent>
          </Card>
        )}

        {/* Modale Ordonnance PDF */}
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET 2 : CATALOGUE DÉDIÉ AUX MAUVAISES HERBES (ADVENTICES DU SAHEL) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <TabsContent value="weeds" className="space-y-4">
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 space-y-1">
          <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-amber-600" /> Référentiel Malherbologique du Burkina Faso & Afrique de l'Ouest
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            L'IA NAFA Genius dispose d'une base de connaissances dédiée aux adventices majeures du Sahel pour les différencier formellement des cultures et guider le désherbage intégré sans confusion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WEED_SPECIES_CATALOG.map((weed) => (
            <Card key={weed.id} className="rounded-3xl border border-border/80 shadow-xs overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">{weed.commonName}</CardTitle>
                    <p className="text-xs italic text-muted-foreground font-mono">{weed.scientificName}</p>
                  </div>
                  <Badge
                    className={`text-[10px] font-bold ${
                      weed.riskLevel === "critique"
                        ? "bg-destructive text-white"
                        : weed.riskLevel === "eleve"
                        ? "bg-amber-600 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    Risque : {weed.riskLevel}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground pt-1">
                  <span>Famille : {weed.family}</span>
                  <span>•</span>
                  <span>Cycle : {weed.cycle}</span>
                  {weed.localNames.moore && (
                    <Badge variant="outline" className="text-[10px]">Mooré : {weed.localNames.moore}</Badge>
                  )}
                  {weed.localNames.dioula && (
                    <Badge variant="outline" className="text-[10px]">Dioula : {weed.localNames.dioula}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div>
                  <strong className="text-foreground block mb-1">Cultures menacées :</strong>
                  <div className="flex flex-wrap gap-1">
                    {weed.targetCrops.map((c) => (
                      <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <strong className="text-foreground block mb-1">Critères décisifs d'identification :</strong>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-[11px]">
                    {weed.distinctiveFeatures.map((feat, i) => (
                      <li key={i}>{feat}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <strong className="text-emerald-800 dark:text-emerald-200 block text-[11px]">Méthode de Lutte Biologique / Mécanique :</strong>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{weed.controlMethodsBio}</p>
                </div>

                <div className="p-3 rounded-xl bg-muted/60 border space-y-1">
                  <strong className="text-foreground block text-[11px]">Lutte Chimique Homologuée CSP :</strong>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{weed.controlMethodsChemical}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET 3 : CAS VALIDÉS PAR LES AGRONOMES (BOUCLE D'AMÉLIORATION RAG) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <TabsContent value="validated" className="space-y-4">
        <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/25 space-y-1">
          <h3 className="font-bold text-sm text-blue-900 dark:text-blue-200 flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-600" /> Cas de Terrain Validés par les Agronomes
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Chaque confirmation ou correction effectuée par un expert est archivée dans la table <code>validated_cases</code> et réinjectée dynamiquement dans le RAG. Le modèle de base ne subit aucune dérive tout en s'adaptant à la réalité des champs burkinabè.
          </p>
        </div>

        {validatedCases.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground rounded-3xl border-dashed">
            Aucun cas validé enregistré pour le moment. Dès qu'un agronome valide un diagnostic, il apparaîtra ici.
          </Card>
        ) : (
          <div className="space-y-3">
            {validatedCases.map((vc) => (
              <Card key={vc.id} className="rounded-2xl border border-border/80 shadow-xs p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-foreground text-sm">{vc.validatedDiseaseName}</strong>
                      <Badge className="bg-emerald-600 text-white text-[10px]">Validé Terrain</Badge>
                      <Badge variant="outline" className="text-[10px]">Cause : {vc.pathogenType}</Badge>
                      <Badge variant="secondary" className="text-[10px]">Culture : {vc.plantSpeciesId}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Certifié par : <strong>{vc.certifiedBy}</strong> • {new Date(vc.certifiedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    Région : {vc.contextLocation?.region || "Burkina Faso"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-2 rounded-xl bg-muted/40">
                  <div><span className="text-muted-foreground">Saison :</span> {vc.contextSeason}</div>
                  <div><span className="text-muted-foreground">Sol :</span> {vc.contextSoil}</div>
                  <div><span className="text-muted-foreground">Stade :</span> {vc.contextGrowthStage}</div>
                  <div><span className="text-muted-foreground">Confiance :</span> {vc.confidenceLevel}</div>
                </div>

                {vc.observedSymptoms && (
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Symptômes constatés :</strong> {vc.observedSymptoms}
                  </p>
                )}

                {vc.expertNotes && (
                  <p className="text-xs text-primary bg-primary/5 p-2 rounded-xl border border-primary/20">
                    <strong>Note agronomique :</strong> {vc.expertNotes}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET 4 : HISTORIQUE PERSONNEL DES DIAGNOSTICS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
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
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </TabsContent>
    </Tabs>
  );
}
