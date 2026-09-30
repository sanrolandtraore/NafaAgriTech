import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Mic, MicOff, Send, MapPin, Droplets, Home, FileText,
  Layers, CheckCircle2, AlertTriangle, Download, RefreshCw, Cpu,
  Compass, ShieldCheck, HelpCircle, ArrowRight, Play, BookOpen,
  UserCheck, Edit3, Sprout, Beef, Building2, Globe, Languages, ShieldAlert,
  Camera, Wrench, Store, Printer, Share2, Eye
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { partnerBrandingStorage } from "@/lib/partnerBrandingStorage";

import {
  GeoPoint,
  GeodesicSurveyResult,
  analyzeGeodesicSurvey,
  calculateFaoIrrigation,
  calculatePoultryHousing,
  generateFarmZoning,
  generateEngineeringQuote,
  certifyIrrigationDesign,
  certifyPoultryHousing,
  certifyEngineeringQuote,
  FAO_SAHEL_CROPS,
  IrrigationDesignResult,
  PoultryHousingResult,
  FarmZoningPlan,
  EngineeringQuote,
} from "@/lib/nafaGeniusEngine";

import {
  generateUnifiedEngineeringProject,
  recalculateProjectWithExpertEdits,
  UnifiedEngineeringProject,
  VERIFIED_NAFA_PARTNERS,
  ExpertMaterialUpdate,
} from "@/lib/nafaEngineeringStudio";

import {
  GeniusLanguage,
  GeniusDomain,
  ParsedGeniusAction,
  parseGeniusCommand,
  executeGeniusAction,
} from "@/lib/nafaGeniusNlu";

import {
  AGRONOMIC_KNOWLEDGE_VERSION,
  REGIONAL_CALIBRATIONS,
  recordExpertCorrection,
} from "@/lib/nafaGeniusLearning";

import { generateTechnicalDossierPdf } from "@/lib/nafaGeniusPdf";
import { SmartQuoteComparator } from "./SmartQuoteComparator";
import { CropDiagnosisTool } from "@/components/expert/CropDiagnosisTool";
import { IrrisModelStudio } from "./IrrisModelStudio";
import {
  calculateIrrisModel,
  irrisToIrrigationDesignResult,
  irrisToGeodesicSurvey,
  IrrisResult,
} from "@/lib/irrisModelEngine";

// Parcelles prédéfinies de démonstration de terrain au Burkina Faso
const PRESET_PARCELS: Record<string, { name: string; location: string; points: GeoPoint[] }> = {
  bama: {
    name: "Périmètre Maraîcher Pilote de Bama (Vallée du Kou)",
    location: "Bama, Province du Houet, Burkina Faso",
    points: [
      { lat: 11.391245, lng: -4.412154, alt: 312.4, label: "Borne B1 - Nord-Ouest (Canal)" },
      { lat: 11.391320, lng: -4.410310, alt: 312.0, label: "Borne B2 - Nord-Est (Piste)" },
      { lat: 11.389950, lng: -4.410220, alt: 310.8, label: "Borne B3 - Sud-Est (Bas-fond)" },
      { lat: 11.389880, lng: -4.412080, alt: 311.2, label: "Borne B4 - Sud-Ouest (Forage)" },
    ],
  },
  koubri: {
    name: "Domaine Agro-Pastoral Intégré de Koubri",
    location: "Koubri, Région du Centre, Burkina Faso",
    points: [
      { lat: 12.184510, lng: -1.392100, alt: 298.5, label: "Borne B1 - Entrée Principale" },
      { lat: 12.184650, lng: -1.390750, alt: 297.8, label: "Borne B2 - Limite Est" },
      { lat: 12.183420, lng: -1.390680, alt: 296.2, label: "Borne B3 - Zone Basse" },
      { lat: 12.183310, lng: -1.391980, alt: 297.1, label: "Borne B4 - Angle Ouest" },
    ],
  },
  sourou: {
    name: "Exploitation Plaine Céréalière & Fruitière du Sourou",
    location: "Di, Province du Sourou, Burkina Faso",
    points: [
      { lat: 13.045100, lng: -3.125400, alt: 265.0, label: "Borne B1 - Prise d'eau Sourou" },
      { lat: 13.045350, lng: -3.122100, alt: 264.5, label: "Borne B2 - Limite Digue Est" },
      { lat: 13.042500, lng: -3.121900, alt: 263.2, label: "Borne B3 - Collecteur Sud" },
      { lat: 13.042300, lng: -3.125200, alt: 264.1, label: "Borne B4 - Piste Principale" },
    ],
  },
};

export const NafaGeniusStudio: React.FC = () => {
  const { profile, user } = useAuth();
  const [searchParams] = useSearchParams();

  // État Langue & Assistant Vocal
  const [selectedLanguage, setSelectedLanguage] = useState<GeniusLanguage>("fr");
  const [activeDomain, setActiveDomain] = useState<GeniusDomain>("agronomie");
  const [inputText, setInputText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [nluResult, setNluResult] = useState<ParsedGeniusAction | null>(null);
  const [lastActionResult, setLastActionResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("irris");

  // Synchronisation avec l'URL (permet l'ouverture directe d'un outil)
  useEffect(() => {
    const tabParam = searchParams.get("tab") || searchParams.get("tool");
    if (tabParam) {
      const lower = tabParam.toLowerCase();
      if (["irris", "irrigation", "fao", "cirad", "eau", "pompe", "solaire", "geodesie", "terrain", "gps", "surface", "arpentage"].includes(lower)) {
        setActiveTab("irris");
      } else if (["devis", "chiffrage", "quote", "validation_devis", "prix"].includes(lower)) {
        setActiveTab("validation_devis");
      } else if (["export", "export_pro", "pdf", "dossier"].includes(lower)) {
        setActiveTab("export_pro");
      } else if (["diagnostic", "crop", "maladie", "adventice"].includes(lower)) {
        setActiveTab("diagnostic");
      } else {
        setActiveTab("irris");
      }
    }
  }, [searchParams]);

  // Relevé Géodésique & GPS
  const [gpsPoints, setGpsPoints] = useState<GeoPoint[]>(PRESET_PARCELS.bama.points);
  const [clientName, setClientName] = useState<string>("Issa Ouédraogo");
  const [clientPhone, setClientPhone] = useState<string>("+226 75 77 48 52");
  const [farmLocation, setFarmLocation] = useState<string>(PRESET_PARCELS.bama.location);

  // Modèle Typique IRRIS (Irrigation & Pompage Solaire - CIRAD / IRRINN / Sahel)
  const defaultIrris = calculateIrrisModel({
    sourceType: "forage",
    dynamicWaterDepthM: 45,
    sourceFlowM3h: 6.0,
    dischargeDistanceM: 50,
    areaHa: 1.0,
    cropKey: "tomate",
    season: "seche_chaude",
    method: "goutte_a_goutte",
    pumpingMode: "fil_du_soleil",
    tankHeightM: 4,
  });

  const [irrisResult, setIrrisResult] = useState<IrrisResult>(defaultIrris);
  const [surveyResult, setSurveyResult] = useState<GeodesicSurveyResult>(() =>
    irrisToGeodesicSurvey(defaultIrris, PRESET_PARCELS.bama.location)
  );

  // Dimensionnement Irrigation FAO-56
  const [selectedCrop, setSelectedCrop] = useState<string>("tomate");
  const [selectedSeason, setSelectedSeason] = useState<"saison_seche_chaude" | "saison_seche_froide" | "hivernage">("saison_seche_chaude");
  const [boreholeDepthM, setBoreholeDepthM] = useState<number>(60);
  const [waterTableDepthM, setWaterTableDepthM] = useState<number>(35);
  const [irrigationResult, setIrrigationResult] = useState<IrrigationDesignResult | null>(() =>
    irrisToIrrigationDesignResult(defaultIrris)
  );

  // Bâtiment Avicole Bioclimatique
  const [includePoultry, setIncludePoultry] = useState<boolean>(false);
  const [poultryFlockSize, setPoultryFlockSize] = useState<number>(2000);
  const [poultryBirdType, setPoultryBirdType] = useState<"poulet_chair" | "poule_pondeuse" | "poulet_local_ameliore">("poulet_chair");
  const [poultryResult, setPoultryResult] = useState<PoultryHousingResult | null>(null);

  // Plan d'aménagement & Devis
  const [farmZoningPlan, setFarmZoningPlan] = useState<FarmZoningPlan | null>(null);
  const [engineeringQuote, setEngineeringQuote] = useState<EngineeringQuote | null>(() =>
    generateEngineeringQuote(
      "Issa Ouédraogo",
      "+226 75 77 48 52",
      PRESET_PARCELS.bama.location,
      "Dr. Oumarou Sawadogo (Ingénieur Rural)",
      "Projet IRRIS - Tomate (1.0 ha)",
      defaultIrris.billOfMaterials
    )
  );
  const [canvasSnapshotDataUrl, setCanvasSnapshotDataUrl] = useState<string | undefined>(undefined);
  const [photorealisticSnapshotDataUrl, setPhotorealisticSnapshotDataUrl] = useState<string | undefined>(undefined);

  // Mise à jour réactive dès calcul du modèle IRRIS
  const handleIrrisCalculated = (res: IrrisResult) => {
    setIrrisResult(res);
    const adaptedIrrigation = irrisToIrrigationDesignResult(res);
    const adaptedSurvey = irrisToGeodesicSurvey(res, farmLocation);
    setIrrigationResult(adaptedIrrigation);
    setSurveyResult(adaptedSurvey);

    const quote = generateEngineeringQuote(
      clientName,
      clientPhone,
      farmLocation,
      profile?.full_name || "Dr. Oumarou Sawadogo (Ingénieur Rural)",
      `Projet IRRIS - ${res.input.cropKey} (${res.input.areaHa} ha)`,
      res.billOfMaterials
    );
    setEngineeringQuote(quote);

    const unifiedSeason = res.input.season === "seche_froide"
      ? "saison_seche_froide"
      : res.input.season === "hivernage"
        ? "hivernage"
        : "saison_seche_chaude";

    const newUnified = generateUnifiedEngineeringProject({
      survey: adaptedSurvey,
      clientName,
      clientPhone,
      location: farmLocation,
      expertName: profile?.full_name || "Dr. Oumarou Sawadogo (Ingénieur Rural)",
      cropKey: res.input.cropKey,
      season: unifiedSeason,
      includePoultry: false,
      boreholeDepthM: res.input.dynamicWaterDepthM,
      waterTableDepthM: Math.round(res.input.dynamicWaterDepthM * 0.6),
    });
    setUnifiedProject(newUnified);
  };

  // Copilote Unifié d'Ingénierie Agro-Pastorale (CIRAD / FAO-56 / Partenaires Agréés)
  const [unifiedProject, setUnifiedProject] = useState<UnifiedEngineeringProject>(() =>
    generateUnifiedEngineeringProject({
      survey: analyzeGeodesicSurvey(PRESET_PARCELS.bama.points),
      clientName: "Issa Ouédraogo",
      clientPhone: "+226 75 77 48 52",
      location: PRESET_PARCELS.bama.location,
      expertName: "Dr. Oumarou Sawadogo (Ingénieur Rural)",
      cropKey: "tomate",
      season: "saison_seche_chaude",
      includePoultry: true,
      poultryBirdType: "poulet_chair",
      poultryFlockSize: 2000,
      boreholeDepthM: 60,
      waterTableDepthM: 35,
    })
  );

  // Apprentissage supervisé & Calibration
  const [selectedRegion, setSelectedRegion] = useState<string>("hauts_bassins");
  const [expertNote, setExpertNote] = useState<string>("");

  // États pour apport d'informations complémentaires & certification terrain par l'expert
  const [isExpertEditingIrrigation, setIsExpertEditingIrrigation] = useState<boolean>(false);
  const [expertMeasuredFlow, setExpertMeasuredFlow] = useState<number | "">("");
  const [expertMeasuredDynamicLevel, setExpertMeasuredDynamicLevel] = useState<number | "">("");
  const [expertIrrigationNotes, setExpertIrrigationNotes] = useState<string>("");

  const [isExpertEditingPoultry, setIsExpertEditingPoultry] = useState<boolean>(false);
  const [expertAdjustedFlock, setExpertAdjustedFlock] = useState<number | "">("");
  const [expertPoultryNotes, setExpertPoultryNotes] = useState<string>("");

  const [isExpertEditingQuote, setIsExpertEditingQuote] = useState<boolean>(false);
  const [expertQuoteNotes, setExpertQuoteNotes] = useState<string>("");

  const recognitionRef = useRef<any>(null);

  // Recalcul géodésique automatique dès que les points changent
  useEffect(() => {
    const analyzed = analyzeGeodesicSurvey(gpsPoints);
    setSurveyResult(analyzed);
  }, [gpsPoints]);

  // Recalcul du projet complet (Irrigation + Aviculture + Zonage + Unifié + Devis)
  const computeFullEngineeringProject = useCallback(() => {
    const areaHa = surveyResult.areaHa || 1.5;

    // 1. Irrigation FAO-56
    const irResult = calculateFaoIrrigation({
      areaHa,
      cropKey: selectedCrop,
      season: selectedSeason,
      boreholeDepthM,
      waterTableDepthM,
    });
    setIrrigationResult(irResult);

    // 2. Aviculture CIRAD
    let pResult: PoultryHousingResult | null = null;
    if (includePoultry) {
      pResult = calculatePoultryHousing({
        birdType: poultryBirdType,
        flockSize: poultryFlockSize,
      });
      setPoultryResult(pResult);
    } else {
      setPoultryResult(null);
    }

    // 3. Plan de zonage
    const zoning = generateFarmZoning(surveyResult, `Aménagement ${clientName}`, clientName, {
      includePoultry,
      poultryFlockSize,
      cropType: selectedCrop,
    });
    setFarmZoningPlan(zoning);

    // 4. Copilote Unifié d'Ingénierie (CIRAD / FAO / Partenaires)
    const newUnified = generateUnifiedEngineeringProject({
      survey: surveyResult,
      clientName,
      clientPhone,
      location: farmLocation,
      expertName: profile?.full_name || "Dr. Oumarou Sawadogo (Ingénieur Rural)",
      cropKey: selectedCrop,
      season: selectedSeason,
      includePoultry,
      poultryBirdType,
      poultryFlockSize,
      boreholeDepthM,
      waterTableDepthM,
    });
    setUnifiedProject(newUnified);

    // 5. Devis officiel complet synchronisé avec les offres des partenaires agréés
    const quote = generateEngineeringQuote(
      clientName,
      clientPhone,
      farmLocation,
      profile?.full_name || "Ingénieur Agronome Référent",
      `Projet Aménagement Agro-Hydraulique & Élevage (${areaHa} ha)`,
      newUnified.billOfMaterials.map((m) => ({
        code: m.code,
        designation: `${m.designation} (${m.selectedSupplierId ? VERIFIED_NAFA_PARTNERS[m.selectedSupplierId]?.name || m.selectedSupplierId : "Fournisseur Agréé"})`,
        specifications: m.materialSpecification,
        unit: m.unit,
        quantity: m.expertQuantity,
        unitPriceFcfa: m.selectedPriceFcfa,
        totalPriceFcfa: m.totalPriceFcfa,
      }))
    );
    setEngineeringQuote(quote);
  }, [
    surveyResult,
    selectedCrop,
    selectedSeason,
    boreholeDepthM,
    waterTableDepthM,
    includePoultry,
    poultryFlockSize,
    poultryBirdType,
    clientName,
    clientPhone,
    farmLocation,
    profile?.full_name,
  ]);

  // Mise à jour réactive du projet lorsque l'expert modifie un équipement, prix ou fournisseur
  const handleUnifiedProjectUpdate = (updated: UnifiedEngineeringProject) => {
    setUnifiedProject(updated);
    if (engineeringQuote) {
      setEngineeringQuote({
        ...engineeringQuote,
        items: updated.billOfMaterials.map((m) => ({
          code: m.code,
          designation: `${m.designation} (${m.selectedSupplierId ? VERIFIED_NAFA_PARTNERS[m.selectedSupplierId]?.name || m.selectedSupplierId : "Fournisseur Agréé"})`,
          specifications: m.materialSpecification,
          unit: m.unit,
          quantity: m.expertQuantity,
          unitPriceFcfa: m.selectedPriceFcfa,
          totalPriceFcfa: m.totalPriceFcfa,
        })),
        subtotalEquipmentFcfa: updated.financialSummary.totalMaterialsEquipmentFcfa,
        laborCostFcfa: updated.financialSummary.totalLaborFcfa,
        logisticsCostFcfa: updated.financialSummary.totalLogisticsTransportFcfa,
        contingenciesFcfa: updated.financialSummary.contingenciesFcfa,
        totalCostFcfa: updated.financialSummary.grandTotalFcfa,
        expertCertified: updated.isExpertValidated,
        certifiedBy: updated.expertName,
      });
    }
  };

  // Export CSV du bordereau de commande partenaires
  const handleExportPartnerCsv = () => {
    const headers = "Code,Désignation,Spécifications,Unité,Quantité,Fournisseur,Prix Unitaire (FCFA),Total (FCFA)\n";
    const rows = unifiedProject.billOfMaterials
      .map((m) => {
        const supplier = VERIFIED_NAFA_PARTNERS[m.selectedSupplierId]?.name || m.selectedSupplierId;
        return `"${m.code}","${m.designation.replace(/"/g, '""')}","${m.materialSpecification.replace(/"/g, '""')}","${m.unit}",${m.expertQuantity},"${supplier}",${m.selectedPriceFcfa},${m.totalPriceFcfa}`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bordereau_fournisseurs_${clientName.replace(/\s+/g, "_")}_${surveyResult.areaHa}ha.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Bordereau de commande partenaires exporté en CSV !");
  };

  // Exécution du calcul initial
  useEffect(() => {
    computeFullEngineeringProject();
  }, [computeFullEngineeringProject]);

  // Certification expert terrain pour l'irrigation
  const handleCertifyIrrigation = async () => {
    if (!irrigationResult) return;
    const expertName = profile?.full_name || "Dr. Oumarou Sawadogo (Ingénieur Rural)";
    const certified = certifyIrrigationDesign(irrigationResult, expertName, expertIrrigationNotes, {
      measuredBoreholeYieldM3h: expertMeasuredFlow !== "" ? Number(expertMeasuredFlow) : undefined,
      dynamicWaterLevelM: expertMeasuredDynamicLevel !== "" ? Number(expertMeasuredDynamicLevel) : undefined,
    });
    setIrrigationResult(certified);
    setIsExpertEditingIrrigation(false);

    await recordExpertCorrection({
      category: "irrigation_friction",
      context: {
        region: selectedRegion,
        cropOrAnimal: selectedCrop,
        areaHa: surveyResult.areaHa,
        initialHmt: irrigationResult.totalHeadHmtM,
      },
      correctedValue: {
        certifiedHmt: certified.totalHeadHmtM,
        certifiedSolarWp: certified.solarPvWattPeak,
        expertMeasuredFlow: expertMeasuredFlow || undefined,
        expertMeasuredDynamicLevel: expertMeasuredDynamicLevel || undefined,
      },
      expertJustification: expertIrrigationNotes || "Certification terrain basée sur les mesures in-situ réelles.",
      expertUserId: user?.id,
    });

    toast.success("Irrigation certifiée avec succès par l'Expert Terrain (Vérité Réelle INERA) !");
  };

  // Certification expert terrain pour le bâtiment avicole
  const handleCertifyPoultry = async () => {
    if (!poultryResult) return;
    const expertName = profile?.full_name || "Dr. Oumarou Sawadogo (Zootechnicien)";
    const certified = certifyPoultryHousing(poultryResult, expertName, expertPoultryNotes, {
      actualFlockSize: expertAdjustedFlock !== "" ? Number(expertAdjustedFlock) : undefined,
    });
    setPoultryResult(certified);
    setIsExpertEditingPoultry(false);

    toast.success("Bâtiment avicole certifié conforme aux normes sahéliennes réelles !");
  };

  // Certification expert terrain pour le devis mercuriale
  const handleCertifyQuote = async () => {
    if (!engineeringQuote) return;
    const expertName = profile?.full_name || "Dr. Oumarou Sawadogo (Expert Chiffreur)";
    const certified = certifyEngineeringQuote(engineeringQuote, expertName, expertQuoteNotes);
    setEngineeringQuote(certified);
    setIsExpertEditingQuote(false);

    toast.success("Devis certifié conforme à la mercuriale officielle du Burkina Faso !");
  };

  // Traitement d'une commande textuelle ou vocale
  const handleProcessCommand = async (text: string) => {
    if (!text.trim()) return;
    const parsed = parseGeniusCommand(text, activeDomain);
    setNluResult(parsed);

    // Si violation de cloisonnement métier absolu
    if (parsed.isDomainViolation) {
      toast.error(parsed.explanation);
      return;
    }

    // Si instruction non reconnue avec certitude : Règle stricte de vérité réelle
    if (!parsed.isRecognized) {
      toast.warning("Instruction non reconnue avec certitude : le calcul nécessite des données terrain certifiées.");
      return;
    }

    // Si une entité est reconnue, adapter automatiquement l'état du studio
    if (parsed.entities.clientName) {
      setClientName(parsed.entities.clientName);
    }
    if (parsed.entities.crop) {
      setSelectedCrop(parsed.entities.crop);
    }
    if (parsed.entities.flockSize) {
      setIncludePoultry(true);
      setPoultryFlockSize(parsed.entities.flockSize);
    }

    // Basculer vers l'onglet pertinent
    if (parsed.intent === "CAPTURE_GPS" || parsed.intent === "CALCULATE_IRRIGATION" || parsed.intent === "DESIGN_POULTRY") setActiveTab("irris");
    if (parsed.intent === "GENERATE_QUOTE") setActiveTab("validation_devis");
    if (parsed.intent === "DIAGNOSE_CROP") setActiveTab("diagnostic");

    const lower = text.toLowerCase();
    if (lower.includes("gps") || lower.includes("surface") || lower.includes("arpentage") || lower.includes("terrain") || lower.includes("borne") || lower.includes("eau") || lower.includes("pompe") || lower.includes("irrigation") || lower.includes("solaire") || lower.includes("irris")) {
      setActiveTab("irris");
    } else if (lower.includes("devis") || lower.includes("prix") || lower.includes("fcfa") || lower.includes("chiffrage") || lower.includes("fournisseur")) {
      setActiveTab("validation_devis");
    } else if (lower.includes("pdf") || lower.includes("export") || lower.includes("dossier")) {
      setActiveTab("export_pro");
    } else if (lower.includes("diagnostic") || lower.includes("maladie") || lower.includes("plante") || lower.includes("feuille") || lower.includes("adventice")) {
      setActiveTab("diagnostic");
    }

    // Si action directe (ex: création de visite)
    if (parsed.actionRequired) {
      const res = await executeGeniusAction(parsed);
      setLastActionResult(res);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } else {
      toast.info(parsed.explanation);
    }
  };

  // Reconnaissance vocale Web Speech API
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage === "fr" ? "fr-FR" : "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleProcessCommand(transcript);
      setIsListening(false);
    };
    recognition.onerror = (err: any) => {
      console.warn("Erreur micro :", err);
      setIsListening(false);
      toast.error("Écoute interrompue. Veuillez réessayer.");
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Capture GPS en temps réel sur le terrain
  const captureGpsPosition = () => {
    if (!navigator.geolocation) {
      toast.error("GPS non disponible sur cet appareil.");
      return;
    }

    toast.loading("Acquisition du point GPS satellite WGS84...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss();
        const newPoint: GeoPoint = {
          lat: Math.round(pos.coords.latitude * 1000000) / 1000000,
          lng: Math.round(pos.coords.longitude * 1000000) / 1000000,
          alt: pos.coords.altitude ? Math.round(pos.coords.altitude * 10) / 10 : 310,
          label: `Borne relevée B${gpsPoints.length + 1} (±${Math.round(pos.coords.accuracy)}m)`,
          timestamp: Date.now(),
        };
        setGpsPoints((prev) => [...prev, newPoint]);
        toast.success(`Borne B${gpsPoints.length + 1} enregistrée avec précision ±${Math.round(pos.coords.accuracy)}m !`);
      },
      (err) => {
        toast.dismiss();
        toast.error(`Erreur GPS : ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 20000 }
    );
  };

  // Téléchargement du dossier technique certifié PDF
  const handleExportPdf = () => {
    if (!engineeringQuote) return;
    try {
      const branding = partnerBrandingStorage.get();
      const isCustom = partnerBrandingStorage.isConfigured();

      const expertName = branding.expertName || profile?.full_name || "Dr. Oumarou Sawadogo";
      const expertTitle = branding.expertTitle || "Expert Senior en Génie Rural & Agronomie";
      const expertOrg = branding.companyName || "Cabinet d'Expertise Agronomique";

      const doc = generateTechnicalDossierPdf({
        survey: surveyResult,
        irrigation: irrigationResult || undefined,
        poultry: poultryResult || undefined,
        quote: engineeringQuote,
        client: {
          name: clientName,
          phone: clientPhone,
          location: farmLocation,
        },
        expert: {
          name: expertName,
          title: expertTitle,
          organization: expertOrg,
        },
        canvasSnapshotDataUrl,
        branding,
      });

      const filePrefix = isCustom && branding.companyName
        ? branding.companyName.toLowerCase().replace(/[^a-z0-9]/g, "_")
        : "dossier_technique";
      const fileName = `${filePrefix}_${clientName.replace(/\s+/g, "_")}_${surveyResult.areaHa}ha.pdf`;
      doc.save(fileName);
      toast.success(`Dossier technique officiel téléchargé : ${fileName}`);
    } catch (err: any) {
      toast.error(`Erreur de génération PDF : ${err.message}`);
    }
  };

  // Enregistrement d'une calibration supervisée
  const handleSaveCorrection = async () => {
    if (!expertNote.trim()) {
      toast.error("Veuillez renseigner une note de justification technique.");
      return;
    }

    await recordExpertCorrection({
      category: "irrigation_friction",
      context: {
        region: selectedRegion,
        cropOrAnimal: selectedCrop,
        initialRecommendation: {
          hmt: irrigationResult?.totalHeadHmtM,
          solarWp: irrigationResult?.solarPvWattPeak,
        },
      },
      correctedValue: {
        adjustedHmt: irrigationResult?.totalHeadHmtM,
      },
      expertJustification: expertNote,
      expertUserId: user?.id,
    });

    toast.success("Calibration technique enregistrée dans le corpus supervisé INERA !");
    setExpertNote("");
  };

  return (
    <div className="space-y-5">
      {/* En-tête Premium NAFA Genius */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white shadow-lg border border-emerald-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">NAFA Genius</h1>
            <Badge className="bg-emerald-500/25 text-emerald-200 border-emerald-400/30 text-xs px-2.5 py-0.5 font-mono">
              v{AGRONOMIC_KNOWLEDGE_VERSION}
            </Badge>
            <Badge variant="outline" className="text-xs text-emerald-300 border-emerald-600/50">
              Disponible sans connexion
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl">
            Suite complète d'ingénierie agronomique de terrain, disponible sans connexion.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
          {/* Sélecteur de cloisonnement métier */}
          <Select value={activeDomain} onValueChange={(val: GeniusDomain) => setActiveDomain(val)}>
            <SelectTrigger className="w-[150px] h-9 text-xs bg-emerald-900/60 border-emerald-700 text-white font-medium">
              <SelectValue placeholder="Pôle métier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agronomie">
                <span className="flex items-center gap-1.5">
                  <Sprout className="h-3.5 w-3.5 text-emerald-600" /> Pôle Végétal
                </span>
              </SelectItem>
              <SelectItem value="elevage">
                <span className="flex items-center gap-1.5">
                  <Beef className="h-3.5 w-3.5 text-amber-600" /> Pôle Élevage
                </span>
              </SelectItem>
              <SelectItem value="partenaire">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" /> Partenaire
                </span>
              </SelectItem>
              <SelectItem value="general">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-slate-600" /> Général
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedLanguage} onValueChange={(val: GeniusLanguage) => setSelectedLanguage(val)}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-emerald-900/60 border-emerald-700 text-white">
              <SelectValue placeholder="Langue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">
                <span className="flex items-center gap-1.5 font-medium">
                  <Languages className="h-3.5 w-3.5 text-muted-foreground" /> Français (FR)
                </span>
              </SelectItem>
              <SelectItem value="dyu">
                <span className="flex items-center gap-1.5 font-medium">
                  <Languages className="h-3.5 w-3.5 text-muted-foreground" /> Dioula (DYU)
                </span>
              </SelectItem>
              <SelectItem value="mos">
                <span className="flex items-center gap-1.5 font-medium">
                  <Languages className="h-3.5 w-3.5 text-muted-foreground" /> Mooré (MOS)
                </span>
              </SelectItem>
              <SelectItem value="ful">
                <span className="flex items-center gap-1.5 font-medium">
                  <Languages className="h-3.5 w-3.5 text-muted-foreground" /> Fulfuldé (FUL)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={handleExportPdf}
            className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Dossier PDF
          </Button>
        </div>
      </div>

      {/* Barre de Commande Vocale & Multimodale Intelligente */}
      <Card className="border-emerald-500/20 bg-card/95 shadow-sm">
        <CardContent className="p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={
                  selectedLanguage === "dyu"
                    ? "Kuma walima sɛbɛli kɛ (ex: N'bɛ fɛ ka 2 hectares tomate jii koo jate...)"
                    : selectedLanguage === "mos"
                    ? "Gomde bɩ sebre (ex: Maan kaogo kambre koob soba Issa yĩnga...)"
                    : selectedLanguage === "ful"
                    ? "Haaldu walla windu (ex: Hiisu ndiyam ngesa 2ha tomaat...)"
                    : "Parlez ou écrivez (ex: Crée une visite pour Issa, calcule l'irrigation pour 2ha de tomate...)"
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleProcessCommand(inputText)}
                className="pr-10 h-11 text-sm bg-background/80"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleListening}
                className={`absolute right-1 top-1 h-9 w-9 rounded-lg transition-all ${
                  isListening ? "bg-red-500 text-white animate-pulse" : "text-emerald-600 hover:bg-emerald-500/10"
                }`}
                title="Microphone (Appuyez pour parler)"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>

            <Button
              className="h-11 px-4 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 gap-1.5 font-medium"
              onClick={() => handleProcessCommand(inputText)}
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Exécuter</span>
            </Button>
          </div>

          {/* Suggestions d'actions rapides simples de terrain */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-muted-foreground font-semibold shrink-0">Outils de terrain :</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs rounded-full shrink-0 border-sky-500/30 text-sky-800 dark:text-sky-300"
              onClick={() => setActiveTab("irris")}
            >
              <Droplets className="h-3 w-3 mr-1 text-sky-600" />
              « 1. Modèle IRRIS (Irrigation & Pompage Solaire) »
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs rounded-full shrink-0 border-rose-500/30 text-rose-800 dark:text-rose-300"
              onClick={() => setActiveTab("validation_devis")}
            >
              <FileText className="h-3 w-3 mr-1 text-rose-600" />
              « 2. Devis Express en FCFA »
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs rounded-full shrink-0 border-teal-500/30 text-teal-800 dark:text-teal-300"
              onClick={() => setActiveTab("export_pro")}
            >
              <Download className="h-3 w-3 mr-1 text-teal-600" />
              « 3. Dossier & Devis PDF »
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs rounded-full shrink-0 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              onClick={() => setActiveTab("diagnostic")}
            >
              <Sprout className="h-3 w-3 mr-1 text-emerald-600" />
              « 4. Diagnostic Végétal »
            </Button>
          </div>

          {/* Affichage de la compréhension */}
          {nluResult && (
            <div
              className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                nluResult.isDomainViolation
                  ? "bg-red-50 dark:bg-red-950/40 border-red-500/40 text-red-950 dark:text-red-100"
                  : !nluResult.isRecognized
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500/40 text-amber-950 dark:text-amber-100"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/20 text-emerald-950 dark:text-emerald-100"
              }`}
            >
              <div className="flex items-center justify-between font-semibold flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  {nluResult.isDomainViolation ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                      <span className="text-red-700 dark:text-red-300 font-bold">
                        CLOISONNEMENT MÉTIER RESPECTÉ
                      </span>
                    </>
                  ) : !nluResult.isRecognized ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="text-amber-700 dark:text-amber-300 font-bold">
                        INSTRUCTION NON RECONNUE AVEC CERTITUDE
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      Intention reconnue : {nluResult.intent} (Confiance : {Math.round(nluResult.confidence * 100)}%)
                    </>
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] text-foreground">
                    Pôle : {nluResult.domain.toUpperCase()}
                  </Badge>
                  {nluResult.requiresExpertValidation && !nluResult.isDomainViolation && (
                    <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-500/50 bg-amber-500/10 font-medium">
                      Validation Expert Requise
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] text-foreground">
                    Langue : {nluResult.language.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <p className={!nluResult.isRecognized ? "text-amber-900 dark:text-amber-200 font-medium" : "text-muted-foreground"}>
                {nluResult.explanation}
              </p>
              {!nluResult.isRecognized && (
                <div className="pt-1 text-[11px] text-amber-800/90 dark:text-amber-300/90 border-t border-amber-500/20 flex items-start gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Règle de Vérité Réelle :</strong> Aucune valeur hallucinée n'est produite. Vous pouvez sélectionner directement les onglets ci-dessous pour renseigner les mesures réelles ou solliciter la certification d'un ingénieur de terrain.</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onglets Principaux du Studio d'Ingénierie Simple & Adapté */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-muted/60 rounded-xl gap-1">
          <TabsTrigger value="irris" className="text-xs py-2 px-2 gap-1.5 data-[state=active]:bg-background shadow-xs font-semibold">
            <Droplets className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <span className="truncate">1. Modèle IRRIS</span>
          </TabsTrigger>
          <TabsTrigger value="validation_devis" className="text-xs py-2 px-2 gap-1.5 data-[state=active]:bg-background shadow-xs font-semibold">
            <FileText className="h-3.5 w-3.5 text-rose-600 shrink-0" />
            <span className="truncate">2. Devis Express en FCFA</span>
          </TabsTrigger>
          <TabsTrigger value="export_pro" className="text-xs py-2 px-2 gap-1.5 data-[state=active]:bg-background shadow-xs font-semibold">
            <Download className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span className="truncate">3. Dossier & Devis PDF</span>
          </TabsTrigger>
          <TabsTrigger value="diagnostic" className="text-xs py-2 px-2 gap-1.5 data-[state=active]:bg-background shadow-xs font-semibold">
            <Sprout className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">4. Diagnostic Végétal</span>
          </TabsTrigger>
        </TabsList>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* ONGLET 1 : MODÈLE TYPIQUE IRRIS (IRRIGATION & SOLAIRE)    */}
        {/* ═════════════════════════════════════════════════════════ */}
        <TabsContent value="irris" className="space-y-4">
          <IrrisModelStudio
            onResultsCalculated={handleIrrisCalculated}
            onNavigateToQuote={() => setActiveTab("validation_devis")}
          />
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* ÉTAPE 3 : DEVIS ESTIMATIF EXPRESS EN FCFA & FOURNISSEURS   */}
        {/* ═════════════════════════════════════════════════════════ */}
        <TabsContent value="validation_devis" className="space-y-4">
          {engineeringQuote && (
            <Card className="p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-foreground">
                      DEVIS ESTIMATIF ET QUANTITATIF N° {engineeringQuote.quoteNumber}
                    </h3>
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-xs">
                      {partnerBrandingStorage.isConfigured()
                        ? `Certifié par ${partnerBrandingStorage.get().companyName || partnerBrandingStorage.get().logoText}`
                        : "Devis d'Ingénierie Certifié"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Émis le {engineeringQuote.date} • Valable 30 jours jusqu'au {engineeringQuote.validUntil}
                  </p>
                </div>

                <Button
                  onClick={handleExportPdf}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 shadow-sm"
                >
                  <Download className="h-4 w-4" /> Télécharger Dossier Certifié (PDF)
                </Button>
              </div>

              {/* Source de Vérité Réelle & Statut de Certification */}
              <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Source certifiée :</strong> {engineeringQuote.groundTruthSource}</span>
                </span>
                {engineeringQuote.expertCertified ? (
                  <Badge className="bg-emerald-600 text-white gap-1 text-[11px]">
                    <CheckCircle2 className="h-3 w-3" /> Devis Certifié In-Situ : {engineeringQuote.certifiedBy}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-[11px] gap-1 bg-amber-500/10">
                    <AlertTriangle className="h-3 w-3" /> Devis standard (Validation mercuriale requise)
                  </Badge>
                )}
              </div>

              {/* Tableau du BPU */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted font-bold text-muted-foreground">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Désignation des Ouvrages & Équipements</th>
                      <th className="p-2.5">Unité</th>
                      <th className="p-2.5">Quantité</th>
                      <th className="p-2.5 text-right">Prix Unit. (FCFA)</th>
                      <th className="p-2.5 text-right">Total HT (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {engineeringQuote.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-2.5 font-mono text-muted-foreground">{item.code}</td>
                        <td className="p-2.5">
                          <p className="font-semibold text-foreground">{item.designation}</p>
                          <span className="text-[10px] text-muted-foreground">{item.specifications}</span>
                        </td>
                        <td className="p-2.5">{item.unit}</td>
                        <td className="p-2.5 font-mono font-semibold">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono">{item.unitPriceFcfa.toLocaleString()} F</td>
                        <td className="p-2.5 text-right font-mono font-bold text-foreground">
                          {item.totalPriceFcfa.toLocaleString()} F
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section de Certification des Prix Fournisseurs par l'Expert */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    Certification des Prix Fournisseurs & Conformité Mercuriale par l'Expert
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                    onClick={() => setIsExpertEditingQuote(!isExpertEditingQuote)}
                  >
                    <Edit3 className="h-3 w-3" />
                    {isExpertEditingQuote ? "Fermer" : "Ajuster / Certifier"}
                  </Button>
                </div>

                {isExpertEditingQuote && (
                  <div className="space-y-3 pt-2 border-t border-border text-xs">
                    <div>
                      <Label className="text-xs font-semibold">Notes d'ajustement mercuriale / Prix constatés sur les marchés locaux</Label>
                      <Textarea
                        placeholder="Ex: Prix vérifiés auprès des quincailleries partenaires à Bobo-Dioulasso et Ouagadougou..."
                        value={expertQuoteNotes}
                        onChange={(e) => setExpertQuoteNotes(e.target.value)}
                        className="text-xs min-h-[60px] mt-1"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleCertifyQuote}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 shadow-sm"
                      >
                        <UserCheck className="h-3.5 w-3.5" /> Certifier la Conformité Mercuriale Terrain
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Récapitulatif financier et conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-2 text-xs">
                  <h4 className="font-bold text-foreground">Modalités Contractuelles & Échéancier</h4>
                  <ul className="space-y-1.5 text-muted-foreground">
                    <li>• Acompte de 50% à la validation de la commande</li>
                    <li>• 35% à la livraison et vérification du matériel sur site</li>
                    <li>• 15% à la réception technique définitive et mise en eau</li>
                    <li>• Garantie constructeur 24 à 36 mois sur pompe solaire et panneaux</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-emerald-500/10">
                    <span className="text-muted-foreground">Sous-total Équipements</span>
                    <span className="font-mono font-bold">{engineeringQuote.subtotalEquipmentFcfa.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-500/10">
                    <span className="text-muted-foreground">Main-d'œuvre & Pose (14%)</span>
                    <span className="font-mono font-bold">{engineeringQuote.laborCostFcfa.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-500/10">
                    <span className="text-muted-foreground">Transport & Manutention (5%)</span>
                    <span className="font-mono font-bold">{engineeringQuote.logisticsCostFcfa.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-500/10">
                    <span className="text-muted-foreground">Imprévus techniques (4%)</span>
                    <span className="font-mono font-bold">{engineeringQuote.contingenciesFcfa.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-extrabold text-emerald-800 dark:text-emerald-200">
                    <span>MONTANT TOTAL CLÉ EN MAIN</span>
                    <span className="font-mono">{engineeringQuote.totalCostFcfa.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                {/* Comparateur des offres partenaires locaux (Optionnel) */}
                <div className="pt-2 border-t">
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-bold text-foreground flex items-center justify-between p-2.5 rounded-xl bg-muted/40 hover:bg-muted">
                      <span className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-emerald-600" />
                        Comparer les prix des fournisseurs partenaires locaux (Optionnel)
                      </span>
                      <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="pt-3">
                      <SmartQuoteComparator
                        project={unifiedProject}
                        onProjectUpdate={handleUnifiedProjectUpdate}
                      />
                    </div>
                  </details>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("irris")}
                    className="text-xs"
                  >
                    ← Retour Étape 1 : Modèle IRRIS
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab("export_pro")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1 font-semibold"
                  >
                    Passer à l'Étape 3 (Dossier & Devis PDF) <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* ÉTAPE 4 : DOSSIER TECHNIQUE & DEVIS OFFICIEL (PDF/CSV)     */}
        {/* ═════════════════════════════════════════════════════════ */}
        <TabsContent value="export_pro" className="space-y-4">
          <Card className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                    <Download className="h-5 w-5 text-emerald-600" />
                    Dossier Technique & Devis Prêt à Imprimer
                  </h3>
                  <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-xs">
                    Certifié Conforme
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Génération des livrables techniques et financiers pour le client, les partenaires et les comités de financement.
                </p>
              </div>

              <Button
                onClick={handleExportPdf}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 shadow-md h-10 px-4"
              >
                <Download className="h-4 w-4" /> Télécharger le Dossier PDF
              </Button>
            </div>

            {/* Grille des 2 livrables simples de terrain */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Livrable 1 : Dossier PDF Complet */}
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h4 className="text-xs font-bold text-foreground">Dossier Technique & Devis Complet (PDF)</h4>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Document officiel complet avec cartouche de votre cabinet, coordonnées GPS WGS84, note de calcul hydraulique, devis chiffré en FCFA et sceau de certification.
                </p>
                <Button
                  size="sm"
                  onClick={handleExportPdf}
                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Télécharger en PDF (1-clic)
                </Button>
              </div>

              {/* Livrable 2 : Bordereau Matériaux CSV */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-emerald-700" />
                  <h4 className="text-xs font-bold text-foreground">Bordereau Quincaillerie & Matériaux (CSV)</h4>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Fichier structuré contenant les quantités exactes, références matériel et prix unitaires en FCFA pour achat auprès des quincailleries locales.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportPartnerCsv}
                  className="w-full text-xs gap-1.5 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                >
                  <Download className="h-3.5 w-3.5" /> Exporter en CSV (Excel)
                </Button>
              </div>
            </div>

            {/* Checklist de conformité pour financement */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-3 text-xs">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Conformité aux Normes Agronomiques Sahéliennes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Calcul d'évapotranspiration conforme aux normes agronomiques certifiées</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Vitesse d'écoulement PEHD dimensionnée selon les règles de l'art</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Bâtiment avicole bioclimatique adapté au climat sahélien</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Prix certifiés mercuriale locale en FCFA</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab("validation_devis")}
                className="text-xs"
              >
                ← Retour Étape 2 : Devis Express en FCFA
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab("diagnostic")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1 font-semibold"
              >
                Consulter le Diagnostic Végétal (Étape 4) <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* DIAGNOSTIC AGRONOMIQUE RAG SCIENTIFIQUE (INERA, CSP, YARA)*/}
        {/* ═════════════════════════════════════════════════════════ */}
        <TabsContent value="diagnostic" className="space-y-4">
          <CropDiagnosisTool />
        </TabsContent>
      </Tabs>

      {/* Module d'Apprentissage Continu Supervisé (Section R&D Terrain) */}
      <Card className="border-border/80 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-foreground">
              Apprentissage Continu & Calibration Régionale (R&D Terrain)
            </h3>
          </div>
          <Badge variant="outline" className="text-xs">
            Corpus INERA Actif
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <Label className="text-xs font-semibold">Région agro-écologique</Label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REGIONAL_CALIBRATIONS).map(([key, reg]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {reg.regionName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold">Observation technique / Correction d'ingénieur</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Ex: Majorer perte de charge de 5% due à la teneur en limon de l'eau du canal..."
                value={expertNote}
                onChange={(e) => setExpertNote(e.target.value)}
                className="h-8 text-xs"
              />
              <Button size="sm" onClick={handleSaveCorrection} className="h-8 text-xs bg-slate-800 text-white shrink-0">
                Enregistrer au corpus
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
