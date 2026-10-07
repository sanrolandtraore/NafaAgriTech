/**
 * NAFA FIELD DESIGNER
 * Le logiciel de conception et d’intervention terrain pour agronomes africains.
 * Remplace l'ancienne suite NAFA Genius Pro.
 * 
 * Modules intégrés :
 * 1. Tableau de bord « MON TERRAIN » (avec statut de synchronisation en temps réel)
 * 2. Création et gestion d'exploitations agricoles
 * 3. Mesure GPS de parcelles en direct (WGS84, m², hectares, périmètre)
 * 4. Crop Designer (Conception de culture, interlignes, densités, semences)
 * 5. Irrigation Designer (Goutte-à-goutte, aspersion, pompage solaire, PEHD)
 * 6. Livestock Building Designer (Bâtiments d'élevage bioclimatiques sahéliens)
 * 7. Farm Builder (Canvas 2D avec grille métrique)
 * 8. Devis & Métrés officiels (FCFA & export PDF)
 * 9. Rapports d'intervention & visites terrain (export PDF)
 * 10. NAFA AI Agronomy Copilot (Zéro hallucination, 5 piliers de vérité terrain)
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Farm,
  Field,
  CropPlan,
  IrrigationProject,
  FarmBuilding,
  FieldVisitReport,
  EngineeringQuoteDoc,
  SyncState,
} from "@/types/fieldDesigner";
import {
  fieldDesignerStorage,
  subscribeToSyncState,
} from "@/lib/fieldDesignerStorage";
import { syncAllDatastores, broadcastDataChange } from "@/lib/universalSyncEngine";
import { FieldGpsMeasurer } from "./FieldGpsMeasurer";
import { CropDesignerTool } from "./CropDesignerTool";
import { IrrigationDesignerTool } from "./IrrigationDesignerTool";
import { LivestockDesignerTool } from "./LivestockDesignerTool";
import { FarmBuilderCanvas } from "./FarmBuilderCanvas";
import { FieldVisitReportTool } from "./FieldVisitReportTool";
import { FieldQuotesTool } from "./FieldQuotesTool";
import { NafaAiCopilot } from "./NafaAiCopilot";
import { NewFarmModal } from "./NewFarmModal";
import { CropDiagnosisTool } from "@/components/expert/CropDiagnosisTool";
import { Studio3DFarmModeler } from "./Studio3DFarmModeler";
import { WcadiIrrigationStudio } from "./WcadiIrrigationStudio";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Compass,
  Plus,
  Navigation,
  Sprout,
  Droplets,
  Home,
  Layers,
  FileText,
  Wallet,
  Sparkles,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Microscope,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Ferme pilote initiale par défaut si aucune ferme n'existe encore
const INITIAL_DEMO_FARM: Farm = {
  id: "farm_bama_pilote",
  name: "Périmètre Maraîcher Pilote de Bama (Vallée du Kou)",
  producerName: "Issa Ouédraogo",
  producerPhone: "+226 75 77 48 52",
  locality: "Bama, Province du Houet",
  region: "Hauts-Bassins",
  province: "Houet",
  commune: "Bama",
  villageSector: "Secteur 2 Vallée du Kou",
  gps: { lat: 11.391245, lng: -4.412154, alt: 312.4 },
  farmType: "maraichage",
  totalAreaHa: 2.5,
  mainCrops: ["Oignon", "Tomate", "Maïs"],
  livestockTypes: ["Poulets locaux améliorés"],
  irrigationType: "Forage solaire + Goutte-à-goutte",
  notes: "Exploitation maraîchère sahélienne modèle. Sol limoneux alluvial de berge.",
  photos: [],
  syncStatus: "synced",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const INITIAL_DEMO_FIELD: Field = {
  id: "field_bama_1",
  farmId: "farm_bama_pilote",
  name: "Parcelle Bama A1 (Oignon Safary)",
  points: [
    { lat: 11.391245, lng: -4.412154, alt: 312.4, label: "Borne B1 - Nord-Ouest" },
    { lat: 11.391320, lng: -4.410310, alt: 312.0, label: "Borne B2 - Nord-Est" },
    { lat: 11.389950, lng: -4.410220, alt: 310.8, label: "Borne B3 - Sud-Est" },
    { lat: 11.389880, lng: -4.412080, alt: 311.2, label: "Borne B4 - Sud-Ouest" },
  ],
  areaM2: 10000,
  areaHa: 1.0,
  perimeterM: 400,
  lengthM: 100,
  widthM: 100,
  orientationDeg: 90,
  status: "active",
  syncStatus: "synced",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const FieldDesignerStudio: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // État de synchronisation temps réel
  const [syncState, setSyncState] = useState<SyncState>({
    status: navigator.onLine ? "synced" : "offline",
    pendingCount: 0,
  });

  // Onglet actif
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Données de l'espace de travail
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeFarmId, setActiveFarmId] = useState<string>("");
  const [fields, setFields] = useState<Field[]>([]);
  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [irrigationProjects, setIrrigationProjects] = useState<IrrigationProject[]>([]);
  const [buildings, setBuildings] = useState<FarmBuilding[]>([]);
  const [fieldVisits, setFieldVisits] = useState<FieldVisitReport[]>([]);
  const [quotes, setQuotes] = useState<EngineeringQuoteDoc[]>([]);

  // Modale création d'exploitation
  const [newFarmModalOpen, setNewFarmModalOpen] = useState(false);

  // Mode Simple vs Mode Expert (Progressive disclosure CAD/GIS)
  const [modeExpert, setModeExpert] = useState(false);

  // Synchronisation des abonnements
  useEffect(() => {
    const unsub = subscribeToSyncState(setSyncState);
    return unsub;
  }, []);

  // Chargement des données IndexedDB
  const loadAllData = async () => {
    let farmList = await fieldDesignerStorage.getFarms();
    if (farmList.length === 0) {
      await fieldDesignerStorage.saveFarm(INITIAL_DEMO_FARM);
      await fieldDesignerStorage.saveField(INITIAL_DEMO_FIELD);
      farmList = [INITIAL_DEMO_FARM];
    }
    setFarms(farmList);

    const activeId = farmList[0]?.id || "";
    setActiveFarmId(activeId);

    if (activeId) {
      setFields(await fieldDesignerStorage.getFields(activeId));
      setCropPlans(await fieldDesignerStorage.getCropPlans(activeId));
      setIrrigationProjects(await fieldDesignerStorage.getIrrigationProjects(activeId));
      setBuildings(await fieldDesignerStorage.getBuildings(activeId));
      setFieldVisits(await fieldDesignerStorage.getFieldVisits(activeId));
      setQuotes(await fieldDesignerStorage.getQuotes(activeId));
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Changement d'exploitation active
  const handleSelectFarm = async (farmId: string) => {
    setActiveFarmId(farmId);
    setFields(await fieldDesignerStorage.getFields(farmId));
    setCropPlans(await fieldDesignerStorage.getCropPlans(farmId));
    setIrrigationProjects(await fieldDesignerStorage.getIrrigationProjects(farmId));
    setBuildings(await fieldDesignerStorage.getBuildings(farmId));
    setFieldVisits(await fieldDesignerStorage.getFieldVisits(farmId));
    setQuotes(await fieldDesignerStorage.getQuotes(farmId));
  };

  // Support des query params d'URL pour compatibilité et tests
  useEffect(() => {
    const tabParam = searchParams.get("tab") || searchParams.get("tool");
    if (tabParam) {
      const lower = tabParam.toLowerCase();
      if (["irris", "irrigation", "eau"].includes(lower)) {
        setActiveTab("irrigation");
      } else if (["devis", "validation_devis", "chiffrage"].includes(lower)) {
        setActiveTab("devis");
      } else if (["export", "export_pro", "pdf", "dossier"].includes(lower)) {
        setActiveTab("devis");
      } else if (["diagnostic", "crop", "maladie"].includes(lower)) {
        setActiveTab("diagnostic");
      } else if (["gps", "mesure", "arpentage"].includes(lower)) {
        setActiveTab("gps");
      } else if (["crop_designer", "culture"].includes(lower)) {
        setActiveTab("crop");
      } else if (["builder", "carte", "plan"].includes(lower)) {
        setActiveTab("builder");
      } else if (["batiment", "elevage"].includes(lower)) {
        setActiveTab("batiment");
      } else if (["copilot", "ia"].includes(lower)) {
        setActiveTab("copilot");
      } else if (["modeler3d", "3d", "amenagement3d", "nafa3d", "modelisation3d"].includes(lower)) {
        setActiveTab("modeler3d");
      }
    }
  }, [searchParams]);

  const activeFarm = farms.find((f) => f.id === activeFarmId) || farms[0] || INITIAL_DEMO_FARM;

  // Handlers de sauvegarde
  const handleSaveFarm = async (f: Farm) => {
    await fieldDesignerStorage.saveFarm(f);
    broadcastDataChange("farms", f);
    await loadAllData();
    setActiveFarmId(f.id);
  };

  const handleSaveField = async (fld: Field) => {
    await fieldDesignerStorage.saveField(fld);
    broadcastDataChange("fields", fld);
    setFields(await fieldDesignerStorage.getFields(activeFarmId));
    setActiveTab("dashboard");
  };

  const handleSaveCropPlan = async (plan: CropPlan) => {
    await fieldDesignerStorage.saveCropPlan(plan);
    broadcastDataChange("crop_plans", plan);
    setCropPlans(await fieldDesignerStorage.getCropPlans(activeFarmId));
    setActiveTab("dashboard");
  };

  const handleSaveIrrigation = async (proj: IrrigationProject) => {
    await fieldDesignerStorage.saveIrrigationProject(proj);
    broadcastDataChange("irrigation_projects", proj);
    setIrrigationProjects(await fieldDesignerStorage.getIrrigationProjects(activeFarmId));
    setActiveTab("dashboard");
  };

  const handleSaveBuilding = async (bld: FarmBuilding) => {
    await fieldDesignerStorage.saveBuilding(bld);
    broadcastDataChange("buildings", bld);
    setBuildings(await fieldDesignerStorage.getBuildings(activeFarmId));
  };

  const handleDeleteBuilding = async (id: string) => {
    await fieldDesignerStorage.deleteBuilding(id);
    broadcastDataChange("buildings", { id });
    setBuildings(await fieldDesignerStorage.getBuildings(activeFarmId));
  };

  const handleSaveFieldVisit = async (visit: FieldVisitReport) => {
    await fieldDesignerStorage.saveFieldVisit(visit);
    broadcastDataChange("field_visits", visit);
    setFieldVisits(await fieldDesignerStorage.getFieldVisits(activeFarmId));
  };

  const handleSaveQuote = async (quote: EngineeringQuoteDoc) => {
    await fieldDesignerStorage.saveQuote(quote);
    broadcastDataChange("quotes", quote);
    setQuotes(await fieldDesignerStorage.getQuotes(activeFarmId));
  };

  // Synchronisation manuelle universelle
  const triggerManualSync = async () => {
    toast.info("Synchronisation globale en cours...");
    const res = await syncAllDatastores({ silent: false });
    await loadAllData();
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      {/* ── RUBAN SUPÉRIEUR COMPACT CAD/GIS (TOOLBAR PROFESSIONNELLE 80/20) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-2xl border border-emerald-500/30 shadow-lg">
        {/* Titre & Statut */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold shrink-0">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-heading font-black tracking-tight">
                NAFA FIELD DESIGNER
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-bold py-0 h-5">
                Offline-First
              </Badge>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-none mt-0.5">
              CAO &amp; SIG Agricole • 80% Espace de travail
            </p>
          </div>
        </div>

        {/* Sélecteur d'exploitation, Mode Simple/Expert & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur compact */}
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-white/70 uppercase shrink-0">Ferme:</span>
            <Select value={activeFarmId} onValueChange={handleSelectFarm}>
              <SelectTrigger className="h-7 text-xs font-bold rounded-lg border-0 bg-transparent text-white px-2 py-0 focus:ring-0 w-36 sm:w-48 truncate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {farms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} ({f.locality})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setNewFarmModalOpen(true)}
              className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20 rounded-md"
              title="Nouvelle exploitation"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Toggle Mode Simple / Mode Expert */}
          <button
            type="button"
            onClick={() => setModeExpert(!modeExpert)}
            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              modeExpert
                ? "bg-[#F97316] text-white border-orange-400 shadow-xs"
                : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
            }`}
          >
            <span>{modeExpert ? "Mode Expert ⚙" : "Mode Simple"}</span>
          </button>

          {/* Statut Sync & Bouton sync */}
          <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10 text-xs">
            {syncState.status === "synced" && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Sync
              </span>
            )}
            {syncState.status === "syncing" && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                Syncing
              </span>
            )}
            {syncState.status === "offline" && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Local
              </span>
            )}
            <button
              type="button"
              onClick={triggerManualSync}
              className="text-white/80 hover:text-white p-0.5 ml-0.5"
              title="Synchroniser"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION PAR ONGLETS MÉTIER ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-11 h-auto p-1.5 gap-1 rounded-2xl bg-muted/70">
          <TabsTrigger value="dashboard" className="h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1">
            <Compass className="h-3.5 w-3.5" />
            <span>Mon Terrain</span>
          </TabsTrigger>
          <TabsTrigger value="gps" className="h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1">
            <Navigation className="h-3.5 w-3.5" />
            <span>Mesure GPS</span>
          </TabsTrigger>
          <TabsTrigger value="crop" className="h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1">
            <Sprout className="h-3.5 w-3.5" />
            <span>Culture</span>
          </TabsTrigger>
          <TabsTrigger value="irrigation" className="h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1" aria-label="1. Modèle IRRIS — Conception">
            <Droplets className="h-3.5 w-3.5" />
            <span>Irrigation</span>
          </TabsTrigger>
          <TabsTrigger value="batiment" className="h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1">
            <Home className="h-3.5 w-3.5" />
            <span>Bâtiment</span>
          </TabsTrigger>
          <TabsTrigger value="builder" className="h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Carte 2D</span>
          </TabsTrigger>
          <TabsTrigger value="modeler3d" className="h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1" aria-label="Modélisation 3D">
            <Box className="h-3.5 w-3.5" />
            <span>Modèle 3D</span>
          </TabsTrigger>
          <TabsTrigger value="interventions" className="h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>Visites</span>
          </TabsTrigger>
          <TabsTrigger value="devis" className="h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1" aria-label="2. Devis Express en FCFA">
            <Wallet className="h-3.5 w-3.5" />
            <span>Devis FCFA</span>
          </TabsTrigger>
          <TabsTrigger value="copilot" className="h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Copilot</span>
          </TabsTrigger>
          <TabsTrigger value="diagnostic" className="h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-1" aria-label="4. Diagnostic Végétal">
            <Microscope className="h-3.5 w-3.5" />
            <span>Diagnostic</span>
          </TabsTrigger>
        </TabsList>

        {/* ── 1. DASHBOARD : MON TERRAIN ── */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Compteurs Clés */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-card p-4 rounded-2xl border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Exploitations</span>
              <span className="text-2xl font-black text-primary font-mono">{farms.length}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">En portefeuille</span>
            </div>

            <div className="bg-card p-4 rounded-2xl border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Parcelles mesurées</span>
              <span className="text-2xl font-black text-foreground font-mono">{fields.length}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                {fields.reduce((sum, f) => sum + f.areaHa, 0).toFixed(1)} ha au total
              </span>
            </div>

            <div className="bg-card p-4 rounded-2xl border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Bâtiments & Serres</span>
              <span className="text-2xl font-black text-amber-600 font-mono">{buildings.length}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Infrastructures</span>
            </div>

            <div className="bg-card p-4 rounded-2xl border shadow-2xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Visites & Rapports</span>
              <span className="text-2xl font-black text-sky-600 font-mono">{fieldVisits.length}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Interventions terrain</span>
            </div>

            <div className="bg-card p-4 rounded-2xl border shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Devis chiffrés</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">{quotes.length}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">Dossiers techniques</span>
            </div>
          </div>

          {/* ── 8 TRÈS GRANDS BOUTONS MOBILES (TOUCH-FIRST TERRAIN) ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Actions Rapides Terrain (Tactile & Mobilité)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <button
                onClick={() => setNewFarmModalOpen(true)}
                className="flex items-center gap-3.5 p-4 rounded-2xl border-2 border-emerald-500/20 bg-card hover:border-emerald-500 hover:bg-emerald-500/5 text-left transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                  +
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">Nouvelle exploitation</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Créer et géoréférencer</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("gps")}
                className="flex items-center gap-3.5 p-4 rounded-2xl border-2 border-primary/20 bg-card hover:border-primary hover:bg-primary/5 text-left transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                  <Navigation className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">Mesurer une parcelle</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Arpentage GPS temps réel</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("crop")}
                className="flex items-center gap-3.5 p-4 rounded-2xl border-2 border-green-500/20 bg-card hover:border-green-500 hover:bg-green-500/5 text-left transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                  <Sprout className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">Concevoir une culture</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Lignes, densité & semences</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("irrigation")}
                className="flex items-center gap-3.5 p-4 rounded-2xl border-2 border-sky-500/20 bg-card hover:border-sky-500 hover:bg-sky-500/5 text-left transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                  <Droplets className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">Concevoir irrigation</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Goutte-à-goutte & solaire</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("batiment")}
                className="flex items-center gap-3.5 p-4 rounded-2xl border-2 border-amber-500/20 bg-card hover:border-amber-500 hover:bg-amber-500/5 text-left transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                  <Home className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">Concevoir bâtiment</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Poulailler, étable & métrés</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("builder")}
                className="flex items-center gap-3.5 p-4 rounded-2xl border-2 border-purple-500/20 bg-card hover:border-purple-500 hover:bg-purple-500/5 text-left transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                  <Layers className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">Carte & Farm Builder</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Plan 2D et agencement</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("interventions")}
                className="flex items-center gap-3.5 p-4 rounded-2xl border-2 border-indigo-500/20 bg-card hover:border-indigo-500 hover:bg-indigo-500/5 text-left transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">Mes interventions</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Rapports de visite in-situ</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("devis")}
                className="flex items-center gap-3.5 p-4 rounded-2xl border-2 border-emerald-500/20 bg-card hover:border-emerald-500 hover:bg-emerald-500/5 text-left transition-all shadow-xs group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                  <Wallet className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">Mes devis</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Chiffrage officiel FCFA</p>
                </div>
              </button>
            </div>
          </div>

          {/* Fiche de l'exploitation active */}
          <Card className="rounded-3xl border shadow-sm">
            <CardContent className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <Badge variant="outline" className="text-xs font-bold text-primary mb-1">
                    Exploitation active
                  </Badge>
                  <h3 className="text-lg sm:text-xl font-bold">{activeFarm.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Producteur : <strong>{activeFarm.producerName}</strong> ({activeFarm.producerPhone}) • Localité : {activeFarm.locality}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("copilot")}
                  className="rounded-xl text-xs gap-1.5 border-primary/40 text-primary"
                >
                  <Sparkles className="h-4 w-4" />
                  Analyser avec AI Copilot
                </Button>
              </div>

              {activeFarm.gps && (
                <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1 font-mono">
                  <Navigation className="h-3.5 w-3.5 text-primary" />
                  <span>
                    GPS : {activeFarm.gps.lat.toFixed(5)}°N, {activeFarm.gps.lng.toFixed(5)}°W
                  </span>
                </div>
              )}

              {/* Mode Expert : Panneau Technique Avancé (Progressive Disclosure) */}
              {modeExpert && (
                <div className="pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
                  <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1">
                    <span className="font-bold text-muted-foreground uppercase text-[10px] block">Système Géodésique</span>
                    <p className="font-mono font-semibold">Ellipsoïde WGS-84 (EPSG:4326)</p>
                    <p className="text-[11px] text-muted-foreground">Projection UTM Zone 30N</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1">
                    <span className="font-bold text-muted-foreground uppercase text-[10px] block">Formule Hydraulique</span>
                    <p className="font-mono font-semibold">Hazen-Williams / Darcy-Weisbach</p>
                    <p className="text-[11px] text-muted-foreground">Pertes de charge C = 150 (PEHD)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1">
                    <span className="font-bold text-muted-foreground uppercase text-[10px] block">Bordereau &amp; Mercuriale</span>
                    <p className="font-mono font-semibold">Mercuriale BF &bull; BTP Sahélien</p>
                    <p className="text-[11px] text-muted-foreground">Indexation matériaux 2026</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 2. MESURE GPS ── */}
        <TabsContent value="gps">
          <FieldGpsMeasurer onSaveField={handleSaveField} activeFarmId={activeFarmId} />
        </TabsContent>

        {/* ── 3. CROP DESIGNER ── */}
        <TabsContent value="crop">
          <CropDesignerTool onSavePlan={handleSaveCropPlan} fields={fields} activeFarmId={activeFarmId} />
        </TabsContent>

        {/* ── 4. CONCEPTEUR D'IRRIGATION (STYLE RIVULIS WCADI) ── */}
        <TabsContent value="irrigation">
          <div className="space-y-4">
            <WcadiIrrigationStudio
              initialGpsPoints={fields[0]?.points || []}
              onSaveProject={(p) => {
                // Synchronisation avec l'état local
                handleSaveIrrigation({
                  id: p.id,
                  farmId: activeFarmId,
                  fieldId: fields[0]?.id,
                  systemType: (p.hydraulicResults.systemType === "californien" ? "gravitaire" : p.hydraulicResults.systemType) as any,
                  waterSource: (p.waterAndEnergy.waterSource === "puits_grand_diametre" ? "puits" : p.waterAndEnergy.waterSource) as any,
                  dynamicWaterDepthM: p.waterAndEnergy.dynamicWaterDepthM,
                  sourceFlowM3h: p.waterAndEnergy.sourceFlowM3h,
                  pumpType: "solaire_fil_du_soleil",
                  pumpPowerKw: p.hydraulicResults.pumpPowerKw,
                  tankHeightM: p.waterAndEnergy.waterTowerHeightM,
                  tankVolumeM3: Math.round(p.hydraulicResults.dailyVolumeM3 * 0.25),
                  mainPipeLengthM: p.hydraulicResults.mainPipeLengthM,
                  mainPipeDiameterMm: p.hydraulicResults.mainPipeDiameterMm,
                  subPipeLengthM: p.hydraulicResults.subPipeLengthM,
                  subPipeDiameterMm: p.hydraulicResults.subPipeDiameterMm,
                  lateralLengthM: p.hydraulicResults.totalDripTapeLengthM,
                  lateralSpacingM: p.cropParams.rowSpacingM,
                  emitterSpacingM: p.cropParams.emitterSpacingM,
                  emitterFlowLh: p.cropParams.emitterFlowLh,
                  totalEmittersCount: p.hydraulicResults.totalEmittersCount,
                  totalFlowRateM3h: p.hydraulicResults.sectorFlowM3h,
                  numSectors: p.hydraulicResults.numSectors,
                  dailyIrrigationHours: p.hydraulicResults.shiftDurationHours,
                  isTechnicalEstimate: false,
                  notes: `Dimensionnement WCADI : ${p.financialTotalFcfa.toLocaleString()} FCFA (Nomenclature vérifiée)`,
                  syncStatus: "pending",
                  createdAt: p.createdAt,
                  updatedAt: p.createdAt,
                });
              }}
            />
          </div>
        </TabsContent>

        {/* ── 5. LIVESTOCK BUILDING DESIGNER ── */}
        <TabsContent value="batiment">
          <LivestockDesignerTool onSaveBuilding={handleSaveBuilding} activeFarmId={activeFarmId} />
        </TabsContent>

        {/* ── 6. CARTE & FARM BUILDER ── */}
        <TabsContent value="builder">
          <FarmBuilderCanvas
            buildings={buildings}
            onSaveBuilding={handleSaveBuilding}
            onDeleteBuilding={handleDeleteBuilding}
            farmName={activeFarm.name}
          />
        </TabsContent>

        {/* ── 6B. MODÉLISATION 3D D'AMÉNAGEMENT DE FERME (NAFA 3D STUDIO) ── */}
        <TabsContent value="modeler3d">
          <Studio3DFarmModeler
            activeFarm={activeFarm}
            fields={fields}
            irrigationProjects={irrigationProjects}
            cropPlans={cropPlans}
            buildings={buildings}
          />
        </TabsContent>

        {/* ── 7. RAPPORTS D'INTERVENTION ── */}
        <TabsContent value="interventions">
          <FieldVisitReportTool
            farm={activeFarm}
            fields={fields}
            onSaveVisit={handleSaveFieldVisit}
            savedVisits={fieldVisits}
            expertName={profile?.full_name}
          />
        </TabsContent>

        {/* ── 8. DEVIS OFFICIEL FCFA ── */}
        <TabsContent value="devis">
          <FieldQuotesTool
            farm={activeFarm}
            buildings={buildings}
            irrigationProjects={irrigationProjects}
            onSaveQuote={handleSaveQuote}
            savedQuotes={quotes}
            expertName={profile?.full_name}
          />
        </TabsContent>

        {/* ── 9. NAFA AI COPILOT ── */}
        <TabsContent value="copilot">
          <NafaAiCopilot
            farm={activeFarm}
            fields={fields}
            cropPlans={cropPlans}
            irrigation={irrigationProjects[0]}
            buildings={buildings}
          />
        </TabsContent>

        {/* ── 10. DIAGNOSTIC VÉGÉTAL SCIENTIFIQUE ── */}
        <TabsContent value="diagnostic">
          <CropDiagnosisTool />
        </TabsContent>
      </Tabs>

      {/* Modale d'ajout d'exploitation */}
      <NewFarmModal
        open={newFarmModalOpen}
        onOpenChange={setNewFarmModalOpen}
        onSave={handleSaveFarm}
      />
    </div>
  );
};
