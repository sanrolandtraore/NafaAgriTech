import { useState, useEffect } from "react";
import {
  Inspection,
  InspectionType,
  InspectionTemplate,
  nafaInspectionEngine,
} from "@/lib/nafaSmartInspectionEngine";
import { partnerBrandingStorage } from "@/lib/partnerBrandingStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Share2,
  FolderKanban,
  Check,
  CloudOff,
  Cloud,
  Layers,
  Copy,
  Edit,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import InspectionMissionSelector from "@/components/inspection/InspectionMissionSelector";
import InspectionDynamicCollector from "@/components/inspection/InspectionDynamicCollector";
import InspectionReportViewer from "@/components/inspection/InspectionReportViewer";
import CustomFormGeneratorModal from "@/components/inspection/CustomFormGeneratorModal";

export default function SmartInspectionPage() {
  const [activeTab, setActiveTab] = useState<"new" | "history" | "sync" | "templates">("new");
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1); // 1: Choisir mission, 2: Collecte, 3: Rapport & Devis

  // Current working inspection state
  const [selectedType, setSelectedType] = useState<InspectionType | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<InspectionTemplate | null>(null);
  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);

  // History list state
  const [inspections, setInspections] = useState<Inspection[]>(() =>
    nafaInspectionEngine.getInspections()
  );
  const [customTypes, setCustomTypes] = useState<InspectionType[]>(() =>
    nafaInspectionEngine.getCustomTypes()
  );
  const [historySearch, setHistorySearch] = useState("");
  const [syncingAll, setSyncingAll] = useState(false);

  // Custom Form Modal state
  const [openGeneratorModal, setOpenGeneratorModal] = useState(false);
  const [editingType, setEditingType] = useState<InspectionType | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<InspectionTemplate | null>(null);

  // Recharger les données quand le stockage local change
  useEffect(() => {
    const handleUpdate = () => {
      setInspections(nafaInspectionEngine.getInspections());
      setCustomTypes(nafaInspectionEngine.getCustomTypes());
    };
    window.addEventListener("nafa-inspection-updated", handleUpdate);
    return () => window.removeEventListener("nafa-inspection-updated", handleUpdate);
  }, []);

  // Étape 1 -> Étape 2 : Sélection du type de mission
  const handleSelectType = async (type: InspectionType) => {
    setSelectedType(type);
    const template = nafaInspectionEngine.getTemplateForType(type.id);
    setCurrentTemplate(template);

    const branding = partnerBrandingStorage.get();
    const defaultExpertName = branding.expertName
      ? `${branding.expertName} (${branding.expertTitle || "Ingénieur Agronome"})`
      : (branding.companyName ? `Expert Référent - ${branding.companyName}` : "Expert Assermenté");

    // Création automatique de la session d'inspection avec UUID
    const newInsp = await nafaInspectionEngine.createInspection({
      inspection_type_id: type.id,
      client_name: "",
      client_phone: "",
      client_location: "Burkina Faso",
      expert_name: defaultExpertName,
    });

    setCurrentInspection(newInsp);
    setWizardStep(2);
    toast.success(`Formulaire d'inspection "${type.name}" généré automatiquement.`);
  };

  // Revenir au choix du type
  const handleResetWizard = () => {
    setSelectedType(null);
    setCurrentTemplate(null);
    setCurrentInspection(null);
    setWizardStep(1);
  };

  // Ouvrir une inspection existante depuis l'historique
  const handleOpenInspection = (insp: Inspection) => {
    const types = nafaInspectionEngine.getTypes();
    const type = types.find((t) => t.id === insp.inspection_type_id) || types[0];
    const template = nafaInspectionEngine.getTemplateForType(type.id);

    setSelectedType(type);
    setCurrentTemplate(template);
    setCurrentInspection(insp);
    setActiveTab("new");
    setWizardStep(insp.status === "validee" ? 3 : 2);
  };

  const handleDeleteInspection = (id: string) => {
    if (!confirm("Voulez-vous supprimer définitivement cette inspection ?")) return;
    nafaInspectionEngine.deleteInspection(id);
    setInspections(nafaInspectionEngine.getInspections());
    if (currentInspection?.id === id) {
      handleResetWizard();
    }
    toast.success("Inspection supprimée.");
  };

  // Synchronisation globale vers Supabase
  const handleSyncAll = async () => {
    setSyncingAll(true);
    let count = 0;
    for (const insp of inspections) {
      if (insp.sync_status !== "synced") {
        const ok = await nafaInspectionEngine.syncToSupabase(insp);
        if (ok) count++;
      }
    }
    setSyncingAll(false);
    setInspections(nafaInspectionEngine.getInspections());
    toast.success(`${count} inspection(s) synchronisée(s) vers Supabase.`);
  };

  const filteredHistory = inspections.filter((i) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      i.client_name.toLowerCase().includes(q) ||
      i.client_location.toLowerCase().includes(q) ||
      i.expert_name.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 container max-w-6xl mx-auto px-4 py-6">
      {/* ── En-tête Principal du Module ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">
              Inspection Intelligente <span className="text-primary">• NAFA Genius</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Formulaires adaptés à la mission, collecte terrain hors-ligne, plans 2D et devis chiffrés.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab !== "new" && (
            <Button
              size="sm"
              onClick={() => {
                handleResetWizard();
                setActiveTab("new");
              }}
              className="gradient-primary text-primary-foreground text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Nouvelle Inspection
            </Button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Disponible sans connexion</span>
          </div>
        </div>
      </div>

      {/* ── Navigation par Onglets ── */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 border border-border flex flex-wrap gap-1">
          <TabsTrigger value="new" className="text-xs font-semibold gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Session d'Inspection
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs font-semibold gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Formulaires Personnalisés ({customTypes.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs font-semibold gap-1.5">
            <FolderKanban className="h-3.5 w-3.5" />
            Historique ({inspections.length})
          </TabsTrigger>
          <TabsTrigger value="sync" className="text-xs font-semibold gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Synchronisation Cloud ({inspections.filter((i) => i.sync_status === "pending").length} en attente)
          </TabsTrigger>
        </TabsList>

        {/* ── ONGLET 1 : SESSION D'INSPECTION (WIZARD) ── */}
        <TabsContent value="new" className="space-y-6">
          {/* Fil d'Ariane des 3 Étapes du Workflow */}
          <div className="bg-card p-3 rounded-xl border border-border flex items-center justify-between gap-2 overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                wizardStep === 1 ? "bg-primary text-primary-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">1</span>
              <span>Type de Mission</span>
            </button>

            <span className="text-muted-foreground/40">→</span>

            <button
              type="button"
              disabled={!selectedType || !currentInspection}
              onClick={() => setWizardStep(2)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                wizardStep === 2 ? "bg-primary text-primary-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground disabled:opacity-40"
              }`}
            >
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">2</span>
              <span>Collecte Terrain</span>
            </button>

            <span className="text-muted-foreground/40">→</span>

            <button
              type="button"
              disabled={!selectedType || !currentInspection}
              onClick={() => setWizardStep(3)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                wizardStep === 3 ? "bg-primary text-primary-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground disabled:opacity-40"
              }`}
            >
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">3</span>
              <span>Rapport & Devis</span>
            </button>
          </div>

          {/* Étape 1 : Choisir le type de mission */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-lg text-foreground">
                  Étape 1 : Choisissez la mission d'inspection
                </h3>
                <p className="text-xs text-muted-foreground">
                  NAFA Genius adaptera automatiquement les mesures à relever, les photos obligatoires et le devis technique.
                </p>
              </div>

              <InspectionMissionSelector
                onSelectType={handleSelectType}
                selectedTypeId={selectedType?.id}
              />
            </div>
          )}

          {/* Étape 2 : Collecte des données terrain */}
          {wizardStep === 2 && selectedType && currentTemplate && currentInspection && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Étape 2 : Collecte des données terrain
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Mission : <strong className="text-foreground">{selectedType.name}</strong> ({selectedType.category})
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWizardStep(1)}
                  className="text-xs font-semibold gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Changer de mission
                </Button>
              </div>

              <InspectionDynamicCollector
                inspection={currentInspection}
                type={selectedType}
                template={currentTemplate}
                onInspectionUpdated={(updated) => setCurrentInspection(updated)}
                onProceedToValidation={() => setWizardStep(3)}
              />
            </div>
          )}

          {/* Étape 3 : Rapport automatique, Plans & Devis */}
          {wizardStep === 3 && selectedType && currentTemplate && currentInspection && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Étape 3 : Rapport automatique, Plans 2D & Devis Chiffré
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Généré automatiquement par NAFA Genius selon les données de terrain collectées.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWizardStep(2)}
                  className="text-xs font-semibold gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Modifier les données
                </Button>
              </div>

              <InspectionReportViewer
                inspection={currentInspection}
                type={selectedType}
                template={currentTemplate}
                onEditInspection={() => setWizardStep(2)}
                onInspectionUpdated={(updated) => setCurrentInspection(updated)}
              />
            </div>
          )}
        </TabsContent>

        {/* ── ONGLET 2 : HISTORIQUE DES INSPECTIONS ── */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Rechercher par client, localité, référence..."
                className="pl-9 text-xs"
              />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncingAll ? "animate-spin" : ""}`} />
              Sync Tout
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredHistory.map((insp) => {
              const types = nafaInspectionEngine.getTypes();
              const inspType = types.find((t) => t.id === insp.inspection_type_id) || types[0];

              return (
                <Card
                  key={insp.id}
                  className="border border-border hover:border-primary/40 bg-card p-4 rounded-xl flex flex-col justify-between shadow-xs transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground font-bold">
                        {insp.id.slice(0, 8)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={insp.status === "validee" ? "default" : "secondary"}
                          className="text-[10px] uppercase font-semibold"
                        >
                          {insp.status}
                        </Badge>
                        {insp.sync_status === "synced" ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Synchronisé cloud" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title="Hors-ligne PWA" />
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-sm text-foreground line-clamp-1">
                        {insp.client_name || "Client non renseigné"}
                      </h4>
                      <p className="text-xs text-primary font-semibold mt-0.5">
                        {inspType?.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {insp.client_location || "Burkina Faso"} • {new Date(insp.inspection_date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenInspection(insp)}
                      className="text-xs font-semibold h-7 flex-1"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Consulter
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteInspection(insp.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-12 rounded-2xl bg-card border border-border p-6 space-y-2">
              <p className="text-sm font-semibold text-foreground">Aucune inspection trouvée</p>
              <p className="text-xs text-muted-foreground">
                Lancez votre première inspection avec le bouton "Nouvelle Inspection".
              </p>
            </div>
          )}
        </TabsContent>

        {/* ── ONGLET 3 : SYNCHRONISATION CLOUD & ÉTAT HORS-LIGNE ── */}
        <TabsContent value="sync" className="space-y-4">
          <Card className="border border-border p-5 rounded-2xl bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-base text-foreground">
                  État de la synchronisation
                </h3>
                <p className="text-xs text-muted-foreground">
                  Chaque inspection enregistrée localement sur votre appareil est synchronisée automatiquement vers Supabase dès qu'une connexion internet est détectée.
                </p>
              </div>

              <Button
                size="sm"
                onClick={handleSyncAll}
                disabled={syncingAll}
                className="gradient-primary text-primary-foreground text-xs font-semibold gap-1.5 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncingAll ? "animate-spin" : ""}`} />
                Forcer la synchronisation
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-border bg-muted/40 text-center">
                <span className="text-xs text-muted-foreground block">Total Inspections</span>
                <span className="text-2xl font-bold font-heading text-foreground">{inspections.length}</span>
              </div>
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 block">Synchronisées Cloud</span>
                <span className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
                  {inspections.filter((i) => i.sync_status === "synced").length}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
                <span className="text-xs text-amber-700 dark:text-amber-300 block">En attente (PWA locale)</span>
                <span className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400">
                  {inspections.filter((i) => i.sync_status === "pending").length}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ── ONGLET 4 : FORMULAIRES PERSONNALISÉS (CONCEPTEUR & GÉNÉRATEUR) ── */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-card border border-border shadow-xs">
            <div className="space-y-1">
              <h2 className="text-lg font-heading font-extrabold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Formulaires d'Inspection Personnalisés</span>
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl">
                Générez des fiches de mission adaptées à vos cahiers des charges ou dupliquez les modèles agro-pastoraux existants. Entièrement disponible hors-ligne.
              </p>
            </div>

            <Button
              onClick={() => {
                setEditingType(null);
                setEditingTemplate(null);
                setOpenGeneratorModal(true);
              }}
              className="gradient-primary text-primary-foreground text-xs font-bold gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Générer un nouveau formulaire</span>
            </Button>
          </div>

          {/* Grille des formulaires personnalisés créés par l'utilisateur */}
          {customTypes.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl border-dashed border-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="font-heading font-bold text-base text-foreground">
                Aucun formulaire personnalisé enregistré
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Créez votre propre modèle de collecte terrain avec l'Assistant NAFA Genius ou partez de l'un des modèles agro-pastoraux recommandés ci-dessous.
              </p>
              <div className="pt-4">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingType(null);
                    setEditingTemplate(null);
                    setOpenGeneratorModal(true);
                  }}
                  className="gradient-primary text-primary-foreground text-xs font-bold gap-1.5 shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Concevoir mon premier formulaire</span>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customTypes.map((type) => {
                const template = nafaInspectionEngine.getTemplateForType(type.id);
                return (
                  <Card key={type.id} className="border-primary/30 hover:border-primary transition-all bg-card flex flex-col justify-between shadow-xs">
                    <CardHeader className="p-4 pb-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                          Formulaire Personnalisé
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {type.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {type.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {type.description}
                      </p>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-3">
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/60 text-center text-xs">
                        <div className="bg-muted/30 p-1.5 rounded-lg">
                          <span className="font-bold block text-foreground">{template.fields_schema.length}</span>
                          <span className="text-[10px] text-muted-foreground">Paramètres</span>
                        </div>
                        <div className="bg-muted/30 p-1.5 rounded-lg">
                          <span className="font-bold block text-foreground">{template.required_photos.length}</span>
                          <span className="text-[10px] text-muted-foreground">Photos</span>
                        </div>
                        <div className="bg-muted/30 p-1.5 rounded-lg">
                          <span className="font-bold block text-foreground">{template.default_measurements.length}</span>
                          <span className="text-[10px] text-muted-foreground">Mesures</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {template.generates_plan && (
                          <Badge variant="outline" className="text-[9px]">Plan 2D</Badge>
                        )}
                        {template.generates_quote && (
                          <Badge variant="outline" className="text-[9px]">Devis estimatif</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            handleSelectType(type);
                            setActiveTab("new");
                          }}
                          className="gradient-primary text-primary-foreground text-xs font-bold gap-1 flex-1 shadow-xs"
                        >
                          <Play className="h-3 w-3" />
                          <span>Démarrer</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingType(type);
                            setEditingTemplate(template);
                            setOpenGeneratorModal(true);
                          }}
                          className="h-8 px-2 text-xs"
                          title="Modifier le modèle"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const dup = nafaInspectionEngine.duplicateCustomType(type.id);
                            if (dup) {
                              setCustomTypes(nafaInspectionEngine.getCustomTypes());
                              toast.success("Modèle dupliqué avec succès.");
                            }
                          }}
                          className="h-8 px-2 text-xs"
                          title="Dupliquer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (!confirm(`Supprimer définitivement le modèle "${type.name}" ?`)) return;
                            nafaInspectionEngine.deleteCustomType(type.id);
                            setCustomTypes(nafaInspectionEngine.getCustomTypes());
                            toast.success("Modèle supprimé.");
                          }}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Section modèles de départ recommandés à dupliquer */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="space-y-0.5">
              <h3 className="font-heading font-bold text-sm text-foreground">
                Partir d'un modèle d'expertise préconfiguré
              </h3>
              <p className="text-xs text-muted-foreground">
                Dupliquez et ajustez l'un de ces modèles standards certifiés selon les réalités de votre client.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: "it-agri-goutte", name: "Goutte-à-goutte", cat: "agriculture" },
                { id: "it-agri-forage", name: "Forage & Pompage", cat: "agriculture" },
                { id: "it-elev-avicole", name: "Bâtiment Avicole", cat: "elevage" },
                { id: "it-elev-bovine", name: "Stabulation Bovine", cat: "elevage" },
              ].map((seed) => (
                <div key={seed.id} className="p-3.5 rounded-xl border border-border bg-card flex flex-col justify-between gap-2.5">
                  <div>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider mb-1">
                      {seed.cat}
                    </Badge>
                    <h4 className="font-bold text-xs text-foreground">{seed.name}</h4>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const dup = nafaInspectionEngine.duplicateCustomType(seed.id);
                      if (dup) {
                        setCustomTypes(nafaInspectionEngine.getCustomTypes());
                        setEditingType(dup.type);
                        setEditingTemplate(dup.template);
                        setOpenGeneratorModal(true);
                        toast.success(`Modèle basé sur ${seed.name} créé et prêt à être personnalisé !`);
                      }
                    }}
                    className="text-xs font-semibold gap-1 w-full"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Personnaliser</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal du générateur de formulaire personnalisé */}
      <CustomFormGeneratorModal
        open={openGeneratorModal}
        onOpenChange={setOpenGeneratorModal}
        editType={editingType}
        editTemplate={editingTemplate}
        onSaved={(type, _tmpl, launchNow) => {
          setCustomTypes(nafaInspectionEngine.getCustomTypes());
          if (launchNow) {
            handleSelectType(type);
            setActiveTab("new");
          }
        }}
      />
    </div>
  );
}
