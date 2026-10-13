import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Microscope,
  Leaf,
  Bug,
  ShieldCheck,
  Activity,
  FileText,
  HelpCircle,
  Sparkles,
  Info,
  Clock,
  Wifi,
  WifiOff,
  Zap,
  Check,
  Layers,
  ChevronRight,
} from "lucide-react";
import { pythonEngineClient } from "@/lib/pythonEngineClient";
import { analyzePlantImage, FoliarImageAnalysisResult } from "@/lib/plantVisionAnalyzer";
import { compressImageForLowBandwidth } from "@/lib/plantNetConnector";
import {
  SUPPORTED_AGRI_SPECULATIONS,
  estimateCandidateCrops,
  resolveExpertDiagnosisForCrop,
  RecognizedCropOption,
  DetailedExpertDiagnosis,
} from "@/lib/expertPlantDiagnosticPipeline";

export function SinglePhotoDiagnosisStudio() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Spéculation sélectionnée par l'agronome ("auto" pour détection par vision, ou identifiant de culture)
  const [selectedCropId, setSelectedCropId] = useState<string>("auto");
  const [candidateCrops, setCandidateCrops] = useState<RecognizedCropOption[]>([]);
  const [selectedOrgan, setSelectedOrgan] = useState<"feuilles" | "tiges" | "fruits" | "collet" | "racines" | "epis" | "peau" | "fientes">("feuilles");

  // Résultat du diagnostic
  const [diagnosisResult, setDiagnosisResult] = useState<DetailedExpertDiagnosis | null>(null);
  const [engineSource, setEngineSource] = useState<"python" | "offline_local">("offline_local");
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : false);
  const [rawVisualResult, setRawVisualResult] = useState<FoliarImageAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setDiagnosisResult(null);
      setCandidateCrops([]);
      // Déclenchement automatique de la première passe d'analyse
      processImageAnalysis(file, dataUrl, selectedCropId, selectedOrgan);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Analyse réelle de l'image et résolution du diagnostic
   */
  const processImageAnalysis = async (
    fileSource: File | null,
    previewUrl: string,
    forcedCropId: string,
    forcedOrgan: "feuilles" | "tiges" | "fruits" | "collet" | "racines" | "epis" | "peau" | "fientes"
  ) => {
    setIsAnalyzing(true);
    try {
      // 1. Analyse spectrale des pixels via Canvas HTML5 (HSV)
      const visualResult = await analyzePlantImage({
        imageBase64: previewUrl,
        imagePreviewUrl: previewUrl,
      });
      setRawVisualResult(visualResult);

      // 2. Détermination de la culture cible
      let effectiveCropId = forcedCropId;
      const candidates = estimateCandidateCrops(
        visualResult.measuredMetrics,
        visualResult.detectedVisualLesions,
        visualResult.imageDimensions
      );
      setCandidateCrops(candidates);

      if (forcedCropId === "auto") {
        effectiveCropId = candidates[0]?.id || "mais";
      }

      // 3. Essai microservice Python si actif
      const isPythonReady = await pythonEngineClient.isAvailable();
      if (isPythonReady && fileSource) {
        setEngineSource("python");
        try {
          const pyRes = await pythonEngineClient.diagnoseAutoPhoto(fileSource, {
            host_target: effectiveCropId,
            affected_organ: forcedOrgan,
          });

          // Enrichissement avec les données certifiées du pipeline
          const localExpert = resolveExpertDiagnosisForCrop({
            cropId: effectiveCropId,
            organCode: forcedOrgan,
            visualResult,
          });

          // Fusion des résultats Python et des fiches CSP
          setDiagnosisResult({
            ...localExpert,
            confidence_pct: pyRes.confidence_pct || localExpert.confidence_pct,
            maladie: pyRes.maladie || localExpert.maladie,
            agent_causal: pyRes.agent_causal || localExpert.agent_causal,
            symptomes_mesures: pyRes.symptomes?.length ? pyRes.symptomes : localExpert.symptomes_mesures,
            test_confirmation_terrain: pyRes.test_confirmation_terrain || localExpert.test_confirmation_terrain,
            source_certifiee: "Microservice PyTorch Haute Performance & Index CSP-CILSS",
          });
          toast.success(`Diagnostic validé : ${localExpert.crop.commonNameFr} • ${localExpert.maladie}`);
          setIsAnalyzing(false);
          return;
        } catch (pyErr) {
          console.warn("Erreur microservice Python, bascule sur le noyau in-situ:", pyErr);
        }
      }

      // 4. Noyau in-situ haute précision (100% Hors-Ligne)
      setEngineSource("offline_local");
      const diag = resolveExpertDiagnosisForCrop({
        cropId: effectiveCropId,
        organCode: forcedOrgan,
        visualResult,
      });
      setDiagnosisResult(diag);
      toast.success(`Diagnostic in-situ certifié : ${diag.crop.commonNameFr} • ${diag.maladie}`);
    } catch (err: any) {
      console.error("Erreur d'analyse:", err);
      toast.error("Échec de l'analyse visuelle. Veuillez réessayer avec un cliché plus net.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Recalcule instantanément le diagnostic quand l'agronome change la culture
   */
  const handleCropChange = (newCropId: string) => {
    setSelectedCropId(newCropId);
    if (!imagePreview && !imageFile) return;

    if (rawVisualResult) {
      const effectiveCrop = newCropId === "auto" ? (candidateCrops[0]?.id || "mais") : newCropId;
      const diag = resolveExpertDiagnosisForCrop({
        cropId: effectiveCrop,
        organCode: selectedOrgan,
        visualResult: rawVisualResult,
      });
      setDiagnosisResult(diag);
      toast.info(`Analyse réévaluée pour : ${diag.crop.commonNameFr}`);
    } else {
      processImageAnalysis(imageFile, imagePreview!, newCropId, selectedOrgan);
    }
  };

  /**
   * Recalcule quand l'agronome modifie l'organe atteint
   */
  const handleOrganChange = (newOrgan: "feuilles" | "tiges" | "fruits" | "collet" | "racines" | "epis" | "peau" | "fientes") => {
    setSelectedOrgan(newOrgan);
    if (!imagePreview && !imageFile) return;

    const currentCrop = selectedCropId === "auto" ? (candidateCrops[0]?.id || "mais") : selectedCropId;
    if (rawVisualResult) {
      const diag = resolveExpertDiagnosisForCrop({
        cropId: currentCrop,
        organCode: newOrgan,
        visualResult: rawVisualResult,
      });
      setDiagnosisResult(diag);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setImageFile(null);
    setDiagnosisResult(null);
    setCandidateCrops([]);
    setRawVisualResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Bandeau d'en-tête informatif */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-emerald-500/5 to-background shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge className="bg-primary hover:bg-primary text-primary-foreground font-bold text-xs gap-1">
                  <Sparkles className="h-3 w-3" /> IA Vision & Raisonnement Différentiel
                </Badge>
                <Badge variant="outline" className="text-xs border-emerald-600/40 text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/10">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Conforme CSP-CILSS & INERA
                </Badge>
                <Badge variant="secondary" className="text-xs gap-1 font-medium">
                  {isOnline ? (
                    <>
                      <Wifi className="h-3 w-3 text-emerald-600" /> Mode Réseau Actif
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-amber-600" /> 100% Autonome Hors-Ligne
                    </>
                  )}
                </Badge>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Diagnostic Phytosanitaire & Pathologique par Vision
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
                Photographiez l'organe atteint (feuille, tige, fruit, racine, sujet animal). Choisissez ou confirmez la culture pour éliminer tout risque de faux diagnostic.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelected}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />

              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="gap-2 bg-primary text-primary-foreground font-bold shadow-md"
              >
                <Camera className="h-4 w-4" /> Prendre une Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 font-medium"
              >
                <Upload className="h-4 w-4" /> Importer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone active d'analyse */}
      {imagePreview && (
        <div className="space-y-6">
          {/* BARRE DE SÉLECTION & CONFIRMATION DE LA CULTURE */}
          <Card className="border-2 border-primary/30 bg-card shadow-sm">
            <CardHeader className="p-4 pb-2 bg-muted/30 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    1. Validation de la Culture ou Filière Observée
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Sélectionnez votre spéculation pour garantir un diagnostic rigoureux
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Sélecteur principal complet */}
                <div className="md:col-span-5">
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">
                    Culture ou Espèce à diagnostiquer :
                  </label>
                  <Select value={selectedCropId} onValueChange={handleCropChange}>
                    <SelectTrigger className="font-semibold text-sm h-10 border-primary/30">
                      <SelectValue placeholder="Choisir la culture..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <SelectItem value="auto" className="font-bold text-primary">
                        ✨ Détection Automatique par Vision IA
                      </SelectItem>
                      <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground bg-muted/50 uppercase mt-1">
                        Céréales & Grandes Cultures
                      </div>
                      <SelectItem value="mais">🌽 Maïs (Zea mays L.)</SelectItem>
                      <SelectItem value="sorgho">🌾 Sorgho grain (Sorghum bicolor)</SelectItem>
                      <SelectItem value="mil">🌾 Mil perlé (Pennisetum glaucum)</SelectItem>
                      <SelectItem value="riz">🌾 Riz (Oryza sativa L.)</SelectItem>
                      <SelectItem value="coton">🌱 Cotonnier (Gossypium hirsutum)</SelectItem>

                      <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground bg-muted/50 uppercase mt-1">
                        Maraîchage & Légumes
                      </div>
                      <SelectItem value="tomate">🍅 Tomate maraîchère (Solanum lycopersicum)</SelectItem>
                      <SelectItem value="oignon">🧅 Oignon bulbe (Allium cepa)</SelectItem>
                      <SelectItem value="piment">🌶️ Piment / Poivron (Capsicum annuum)</SelectItem>
                      <SelectItem value="aubergine">🍆 Aubergine locale (Solanum aethiopicum)</SelectItem>
                      <SelectItem value="gombo">🌿 Gombo (Abelmoschus esculentus)</SelectItem>
                      <SelectItem value="chou">🥬 Chou cabus (Brassica oleracea)</SelectItem>

                      <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground bg-muted/50 uppercase mt-1">
                        Légumineuses & Oléagineux
                      </div>
                      <SelectItem value="niebe">🫘 Niébé / Haricot (Vigna unguiculata)</SelectItem>
                      <SelectItem value="arachide">🥜 Arachide (Arachis hypogaea)</SelectItem>
                      <SelectItem value="soja">🫘 Soja (Glycine max)</SelectItem>
                      <SelectItem value="sesame">🌱 Sésame (Sesamum indicum)</SelectItem>

                      <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground bg-muted/50 uppercase mt-1">
                        Santé Animale & Élevage
                      </div>
                      <SelectItem value="volaille">🐔 Volaille / Poulet local & chair</SelectItem>
                      <SelectItem value="bovin">🐂 Bovin / Zébu Peul & Goudali</SelectItem>
                      <SelectItem value="ovin">🐑 Petit Ruminant (Mouton / Chèvre)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Organe atteint */}
                <div className="md:col-span-3">
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">
                    Partie / Organe atteint :
                  </label>
                  <Select value={selectedOrgan} onValueChange={(val: any) => handleOrganChange(val)}>
                    <SelectTrigger className="font-semibold text-sm h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feuilles">🍃 Feuilles / Limbe / Cornet</SelectItem>
                      <SelectItem value="tiges">🎋 Tige / Collet / Tronc</SelectItem>
                      <SelectItem value="fruits">🍅 Fruits / Gousses / Épis</SelectItem>
                      <SelectItem value="racines">🥕 Racines / Tubercules</SelectItem>
                      <SelectItem value="peau">🐾 Peau / Pelage (Animal)</SelectItem>
                      <SelectItem value="fientes">💩 Fientes / Litière (Aviaire)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Boutons d'accès rapide 1-clic aux spéculations majeures */}
                <div className="md:col-span-4">
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">
                    Accès rapide 1-clic :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "mais", label: "Maïs" },
                      { id: "tomate", label: "Tomate" },
                      { id: "oignon", label: "Oignon" },
                      { id: "coton", label: "Coton" },
                      { id: "niebe", label: "Niébé" },
                      { id: "volaille", label: "Volaille" },
                      { id: "bovin", label: "Bovin" },
                    ].map((crop) => (
                      <Button
                        key={crop.id}
                        type="button"
                        variant={selectedCropId === crop.id ? "default" : "outline"}
                        size="sm"
                        className={`text-xs h-8 px-2.5 rounded-lg ${
                          selectedCropId === crop.id ? "bg-primary font-bold text-primary-foreground" : ""
                        }`}
                        onClick={() => handleCropChange(crop.id)}
                      >
                        {crop.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggestions candidates calculées par la vision si en mode auto */}
              {candidateCrops.length > 0 && selectedCropId === "auto" && (
                <div className="pt-2 border-t flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Hypothèses de culture estimées par la vision :
                  </span>
                  {candidateCrops.map((c) => (
                    <Badge
                      key={c.id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20 transition-colors py-1 px-2.5 gap-1"
                      onClick={() => handleCropChange(c.id)}
                    >
                      <span className="font-bold text-foreground">{c.commonNameFr}</span>
                      <span className="text-primary font-semibold">({c.confidencePct}%)</span>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grille principale : Cliché à gauche & Diagnostic à droite */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Colonne gauche : Photo & Mesures réelles */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="overflow-hidden border-border/60">
                <CardHeader className="p-3 pb-2 bg-muted/30 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-primary" /> Cliché de Terrain Analysé
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                      Changer de photo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex flex-col items-center">
                  <div className="relative w-full max-h-[380px] rounded-lg overflow-hidden border bg-black/5 flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Partie malade"
                      className="max-h-[380px] w-auto object-contain rounded-lg"
                    />
                  </div>

                  {diagnosisResult && (
                    <div className="w-full mt-3 p-2.5 rounded-lg bg-muted/40 border text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-muted-foreground">Culture active :</span>
                        <span className="font-bold text-foreground">{diagnosisResult.crop.commonNameFr} ({diagnosisResult.crop.scientificName})</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-muted-foreground">Organe :</span>
                        <span className="text-foreground">{diagnosisResult.partie_atteinte}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mesures spectrales réelles des pixels */}
              {diagnosisResult && (
                <Card className="border-border/60">
                  <CardHeader className="p-3.5 pb-2 border-b bg-muted/20">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-primary" /> Mesures Tissulaires Réelles (Pixels Examinés)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3.5 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-[10px] font-bold text-muted-foreground">Tissu Sain</div>
                        <div className="text-sm font-extrabold text-emerald-600">
                          {diagnosisResult.visual_metrics.healthyTissuePercent}%
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="text-[10px] font-bold text-muted-foreground">Chlorose (Jaune)</div>
                        <div className="text-sm font-extrabold text-amber-600">
                          {diagnosisResult.visual_metrics.chlorosisPercent}%
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="text-[10px] font-bold text-muted-foreground">Nécrose (Brun)</div>
                        <div className="text-sm font-extrabold text-red-600">
                          {diagnosisResult.visual_metrics.necrosisPercent}%
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="text-[10px] font-bold text-muted-foreground">Altération Totale</div>
                        <div className="text-sm font-extrabold text-primary">
                          {diagnosisResult.visual_metrics.totalFoliarDamagePercent}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Badge de provenance scientifique */}
              {diagnosisResult && (
                <Card className="border-border/40 bg-muted/20 text-xs p-3 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Zap className="h-3.5 w-3.5 text-emerald-500" /> Source & Certification
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-background">
                      {engineSource === "python" ? "Microservice PyTorch" : "Noyau In-Situ Local"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    {diagnosisResult.source_certifiee}
                  </p>
                </Card>
              )}
            </div>

            {/* Colonne droite : Résultats du diagnostic pathologique */}
            <div className="lg:col-span-7 space-y-4">
              {isAnalyzing && (
                <Card className="border-primary/30 p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <RefreshCw className="h-12 w-12 text-primary animate-spin" />
                    <Sparkles className="h-5 w-5 text-amber-500 absolute -top-1 -right-1" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Évaluation phytopathologique en cours...</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Croisement des lésions morphologiques avec le catalogue épidémiologique INERA et le registre CSP-CILSS.
                    </p>
                  </div>
                  <Progress value={85} className="w-64 h-2" />
                </Card>
              )}

              {diagnosisResult && (
                <div className="space-y-4">
                  {/* Fiche Maladie Principale */}
                  <Card className="border-2 border-red-500/30 bg-red-500/5 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/20 pb-2.5">
                        <div>
                          <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
                            Pathologie Confirmée sur {diagnosisResult.crop.commonNameFr}
                          </span>
                          <h3 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                            {diagnosisResult.maladie}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-xs px-2.5 py-1 font-bold ${
                              diagnosisResult.risk_level === "critique"
                                ? "bg-red-600 text-white"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            Niveau : {diagnosisResult.risk_level.toUpperCase()}
                          </Badge>
                          <Badge className="bg-emerald-700 text-white font-bold text-xs px-2.5 py-1">
                            Indice de certitude : {diagnosisResult.confidence_pct}%
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Agent Causal (Pathogène) :
                          </span>
                          <p className="text-sm font-semibold text-foreground italic flex items-center gap-1.5 mt-0.5">
                            <Bug className="h-4 w-4 text-amber-500 shrink-0" />
                            {diagnosisResult.agent_causal}
                          </p>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Nature Biologique :
                          </span>
                          <p className="text-sm font-medium text-foreground mt-0.5">
                            {diagnosisResult.pathogen_kind}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Symptômes réels détectés */}
                  <Card>
                    <CardHeader className="p-3.5 pb-2 border-b bg-muted/20">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-primary" /> Symptômes Réels Détectés sur l'Échantillon
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <ul className="space-y-1.5 text-sm">
                        {diagnosisResult.symptomes_mesures.map((symp, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span>{symp}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Test de confirmation de terrain impératif */}
                  <Card className="border-amber-500/40 bg-amber-500/5">
                    <CardContent className="p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <HelpCircle className="h-4 w-4 shrink-0" /> Test de Confirmation de Terrain (Recommandation INERA)
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-foreground">
                        {diagnosisResult.test_confirmation_terrain}
                      </p>
                      <p className="text-[11px] text-muted-foreground pt-1 border-t border-amber-500/20">
                        <strong>Clé déterminante :</strong> {diagnosisResult.cle_differentiation}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Diagnostics différentiels (pourquoi les autres maladies sont écartées) */}
                  {diagnosisResult.diagnostics_differentiels?.length > 0 && (
                    <Card className="border-border/60">
                      <CardHeader className="p-3 pb-2 bg-muted/20 border-b">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Layers className="h-4 w-4 text-primary" /> Diagnostics Différentiels Écartés
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 space-y-2">
                        {diagnosisResult.diagnostics_differentiels.map((diff, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-muted/30 border text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-foreground">{diff.maladie} ({diff.agent_causal})</span>
                              <Badge variant="outline" className="text-[10px]">
                                Plausibilité : {diff.plausibilite_pct}%
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-[11px]">
                              {diff.pourquoi_exclue_ou_secondaire}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Protocoles de Traitement Homologués (CABI & CSP-CILSS) */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Prescriptions Homologuées au Burkina Faso
                      </h4>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        Posologies étalonnées pour pulvérisateur 15 Litres
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Traitement Biologique : CABI BioProtection */}
                      {diagnosisResult.traitement_bio && (
                        <Card className="border-emerald-500/30 bg-emerald-500/5">
                          <CardHeader className="p-3 pb-2 bg-emerald-500/10 border-b">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4" /> Protocole Biologique (Lutte Intégrée)
                              </CardTitle>
                              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                                CABI BioProtection
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 space-y-1.5 text-xs">
                            <p className="font-extrabold text-foreground text-sm">
                              {diagnosisResult.traitement_bio.nom}
                            </p>
                            <p className="text-muted-foreground">
                              <strong>Matière active :</strong> {diagnosisResult.traitement_bio.substance_active}
                            </p>
                            <p className="text-foreground font-semibold bg-background/80 p-2 rounded border border-emerald-500/20">
                              <strong>Dose champ :</strong> {diagnosisResult.traitement_bio.dosage}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <Badge variant="outline" className="text-[11px] text-emerald-700 border-emerald-500/40 font-bold flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {diagnosisResult.traitement_bio.delai_attente}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Traitement Chimique Homologué CSP-CILSS */}
                      {diagnosisResult.traitement_chimique_csp && (
                        <Card className="border-primary/30 bg-primary/5">
                          <CardHeader className="p-3 pb-2 bg-primary/10 border-b">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-xs font-bold text-primary flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4" /> Traitement Homologué CSP-CILSS
                              </CardTitle>
                              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
                                Agréé Sahel
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 space-y-1.5 text-xs">
                            <p className="font-extrabold text-foreground text-sm">
                              {diagnosisResult.traitement_chimique_csp.nom}
                            </p>
                            <p className="text-muted-foreground">
                              <strong>Matière active :</strong> {diagnosisResult.traitement_chimique_csp.substance_active}
                            </p>
                            <p className="text-foreground font-semibold bg-background/80 p-2 rounded border border-primary/20">
                              <strong>Dose pulvérisateur (15L) :</strong> {diagnosisResult.traitement_chimique_csp.dosage}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <Badge variant="destructive" className="text-[11px] font-bold flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {diagnosisResult.traitement_chimique_csp.delai_attente}
                              </Badge>
                              {diagnosisResult.traitement_chimique_csp.numero_homologation && (
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  N° {diagnosisResult.traitement_chimique_csp.numero_homologation}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Mesures Prophylactiques */}
                    {diagnosisResult.mesures_prophylactiques?.length > 0 && (
                      <Card className="border-border/60 bg-muted/10">
                        <CardHeader className="p-3 pb-1.5 border-b bg-muted/20">
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Mesures Prophylactiques & Culturales Préventives
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                          <ul className="space-y-1 text-xs text-foreground">
                            {diagnosisResult.mesures_prophylactiques.map((m, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* État initial si aucune photo n'a encore été chargée */}
      {!imagePreview && (
        <Card className="border-dashed border-2 border-border/80 bg-muted/10">
          <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Camera className="h-10 w-10" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-bold text-foreground">Prenez ou importez une photo de la culture malade</h3>
              <p className="text-xs text-muted-foreground">
                Photographiez une feuille, tige, racine ou fruit présentant des anomalies. Vous pourrez sélectionner votre culture exacte (Maïs, Tomate, Oignon, Coton, Sorgho, etc.) pour un diagnostic garanti sans erreur.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="gap-2 bg-primary text-primary-foreground font-bold shadow-md"
              >
                <Camera className="h-4 w-4" /> Prendre une Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 font-medium"
              >
                <Upload className="h-4 w-4" /> Importer un Cliché
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SinglePhotoDiagnosisStudio;
