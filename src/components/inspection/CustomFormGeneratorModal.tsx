import { useState, useEffect } from "react";
import {
  InspectionType,
  InspectionTemplate,
  InspectionFieldSchema,
  InspectionRequiredPhotoRule,
  InspectionMeasurementRule,
  MissionCategory,
  nafaInspectionEngine,
  generateSmartFormTemplate,
} from "@/lib/nafaSmartInspectionEngine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Plus,
  Trash2,
  Settings,
  Layers,
  Camera,
  Gauge,
  CheckCircle2,
  FileText,
  Play,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

interface CustomFormGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editType?: InspectionType | null;
  editTemplate?: InspectionTemplate | null;
  onSaved: (type: InspectionType, template: InspectionTemplate, launchNow?: boolean) => void;
}

const QUICK_SUGGESTIONS = [
  { label: "Verger d'anacardiers & Goutte-à-goutte", prompt: "Audit phytosanitaire et installation goutte-à-goutte verger anacardiers 5 ha", cat: "agriculture" as MissionCategory },
  { label: "Poulailler 3 000 pondeuses & Biosécurité", prompt: "Contrôle biosécurité, ventilation et équipement avicole pour 3000 pondeuses", cat: "elevage" as MissionCategory },
  { label: "Station de pompage solaire & Forage", prompt: "Audit technique forage profond, champ solaire 5kWc et pompe immergée", cat: "agriculture" as MissionCategory },
  { label: "Étable embouche bovine 50 têtes", prompt: "Inspection étable embouche bovine, couloir de contention et abreuvoirs", cat: "elevage" as MissionCategory },
  { label: "Tracteur & Outils de travail du sol", prompt: "Contrôle technique tracteur 4RM, relevage hydraulique et charrue à disques", cat: "machinisme" as MissionCategory },
];

export default function CustomFormGeneratorModal({
  open,
  onOpenChange,
  editType,
  editTemplate,
  onSaved,
}: CustomFormGeneratorModalProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "general" | "fields" | "photos" | "measurements">("ai");

  // Form identity
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MissionCategory>("agriculture");
  const [description, setDescription] = useState("");
  const [generatesPlan, setGeneratesPlan] = useState(true);
  const [generatesQuote, setGeneratesQuote] = useState(true);

  // Schema arrays
  const [fields, setFields] = useState<InspectionFieldSchema[]>([]);
  const [photos, setPhotos] = useState<InspectionRequiredPhotoRule[]>([]);
  const [measurements, setMeasurements] = useState<InspectionMeasurementRule[]>([]);

  // AI prompt state
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  // Field creation sub-form
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "select" | "boolean" | "textarea">("text");
  const [newFieldUnit, setNewFieldUnit] = useState("");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldHint, setNewFieldHint] = useState("");

  // Photo creation sub-form
  const [newPhotoLabel, setNewPhotoLabel] = useState("");
  const [newPhotoDesc, setNewPhotoDesc] = useState("");
  const [newPhotoMandatory, setNewPhotoMandatory] = useState(true);

  // Measurement creation sub-form
  const [newMeasureName, setNewMeasureName] = useState("");
  const [newMeasureUnit, setNewMeasureUnit] = useState("");
  const [newMeasureMin, setNewMeasureMin] = useState("");
  const [newMeasureMax, setNewMeasureMax] = useState("");
  const [newMeasureNorm, setNewMeasureNorm] = useState("");

  // Initialize or reset form
  useEffect(() => {
    if (editType && editTemplate) {
      setName(editType.name);
      setCategory(editType.category);
      setDescription(editType.description);
      setGeneratesPlan(Boolean(editTemplate.generates_plan));
      setGeneratesQuote(Boolean(editTemplate.generates_quote));
      setFields([...editTemplate.fields_schema]);
      setPhotos([...editTemplate.required_photos]);
      setMeasurements([...editTemplate.default_measurements]);
      setActiveTab("general");
    } else {
      setName("");
      setCategory("agriculture");
      setDescription("");
      setGeneratesPlan(true);
      setGeneratesQuote(true);
      setFields([]);
      setPhotos([]);
      setMeasurements([]);
      setAiPrompt("");
      setActiveTab("ai");
    }
  }, [editType, editTemplate, open]);

  // Handle Smart AI generation
  const handleGenerateAi = (overridePrompt?: string, overrideCat?: MissionCategory) => {
    const promptText = overridePrompt || aiPrompt;
    const cat = overrideCat || category;

    if (!promptText.trim()) {
      toast.error("Veuillez renseigner un objectif ou un intitulé de mission.");
      return;
    }

    setGenerating(true);
    setTimeout(() => {
      const generated = generateSmartFormTemplate({
        prompt: promptText,
        name: name || promptText.slice(0, 45),
        category: cat,
      });

      setName(generated.name);
      setCategory(generated.category);
      setDescription(generated.description);
      setFields(generated.fields_schema);
      setPhotos(generated.required_photos);
      setMeasurements(generated.default_measurements);
      setGeneratesPlan(generated.generates_plan);
      setGeneratesQuote(generated.generates_quote);

      setGenerating(false);
      setActiveTab("general");
      toast.success("Structure du formulaire générée avec succès ! Vous pouvez la personnaliser.");
    }, 350);
  };

  // Add field to list
  const handleAddField = () => {
    if (!newFieldLabel.trim()) {
      toast.error("Veuillez renseigner le libellé du champ.");
      return;
    }

    const key = `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const optionsArray = newFieldType === "select"
      ? newFieldOptions.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const newField: InspectionFieldSchema = {
      key,
      label: newFieldLabel.trim(),
      type: newFieldType,
      unit: newFieldUnit.trim() || undefined,
      options: optionsArray,
      required: newFieldRequired,
      hint: newFieldHint.trim() || undefined,
    };

    setFields([...fields, newField]);
    setNewFieldLabel("");
    setNewFieldUnit("");
    setNewFieldOptions("");
    setNewFieldHint("");
    setNewFieldRequired(false);
    toast.success("Champ ajouté au formulaire.");
  };

  const handleRemoveField = (index: number) => {
    const updated = [...fields];
    updated.splice(index, 1);
    setFields(updated);
  };

  // Add photo rule
  const handleAddPhoto = () => {
    if (!newPhotoLabel.trim()) {
      toast.error("Veuillez renseigner le titre du cliché requis.");
      return;
    }

    const key = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setPhotos([
      ...photos,
      {
        key,
        label: newPhotoLabel.trim(),
        description: newPhotoDesc.trim() || "Consigne de prise de vue sur le terrain.",
        is_mandatory: newPhotoMandatory,
      },
    ]);

    setNewPhotoLabel("");
    setNewPhotoDesc("");
    setNewPhotoMandatory(true);
    toast.success("Photo requise ajoutée.");
  };

  const handleRemovePhoto = (index: number) => {
    const updated = [...photos];
    updated.splice(index, 1);
    setPhotos(updated);
  };

  // Add measurement rule
  const handleAddMeasurement = () => {
    if (!newMeasureName.trim() || !newMeasureUnit.trim()) {
      toast.error("Veuillez renseigner le nom et l'unité de la mesure.");
      return;
    }

    setMeasurements([
      ...measurements,
      {
        name: newMeasureName.trim(),
        unit: newMeasureUnit.trim(),
        min_threshold: newMeasureMin ? parseFloat(newMeasureMin) : undefined,
        max_threshold: newMeasureMax ? parseFloat(newMeasureMax) : undefined,
        default_norm: newMeasureNorm.trim() || undefined,
      },
    ]);

    setNewMeasureName("");
    setNewMeasureUnit("");
    setNewMeasureMin("");
    setNewMeasureMax("");
    setNewMeasureNorm("");
    toast.success("Point de mesure ajouté.");
  };

  const handleRemoveMeasurement = (index: number) => {
    const updated = [...measurements];
    updated.splice(index, 1);
    setMeasurements(updated);
  };

  // Save the custom template
  const handleSave = (launchNow = false) => {
    if (!name.trim()) {
      toast.error("Veuillez donner un nom à votre formulaire personnalisé.");
      setActiveTab("general");
      return;
    }

    if (fields.length === 0) {
      toast.error("Veuillez ajouter au moins un champ ou paramètre à collecter.");
      setActiveTab("fields");
      return;
    }

    const result = nafaInspectionEngine.saveCustomFormTemplate({
      typeId: editType?.id,
      name: name.trim(),
      category,
      description: description.trim() || "Formulaire d'inspection sur-mesure créé par l'agronome.",
      fields_schema: fields,
      required_photos: photos,
      default_measurements: measurements,
      generates_plan: generatesPlan,
      generates_quote: generatesQuote,
    });

    toast.success(`Formulaire "${result.type.name}" enregistré avec succès !`);
    onSaved(result.type, result.template, launchNow);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* En-tête */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card/50">
          <DialogTitle className="text-base sm:text-lg font-heading font-extrabold flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              {editType ? `Modifier le Formulaire : ${editType.name}` : "Générateur de Formulaire Personnalisé"}
            </span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Concevez votre propre fiche d'audit et collecte terrain avec NAFA Genius, disponible 100% hors-ligne.
          </p>
        </DialogHeader>

        {/* Corps avec onglets */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
            <TabsList className="grid grid-cols-5 w-full bg-muted/70 p-1 text-xs mb-4">
              <TabsTrigger value="ai" className="text-xs font-semibold gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Assistant IA</span>
              </TabsTrigger>
              <TabsTrigger value="general" className="text-xs font-semibold gap-1">
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Général</span>
              </TabsTrigger>
              <TabsTrigger value="fields" className="text-xs font-semibold gap-1">
                <Layers className="h-3.5 w-3.5" />
                <span>Champs ({fields.length})</span>
              </TabsTrigger>
              <TabsTrigger value="photos" className="text-xs font-semibold gap-1">
                <Camera className="h-3.5 w-3.5" />
                <span>Photos ({photos.length})</span>
              </TabsTrigger>
              <TabsTrigger value="measurements" className="text-xs font-semibold gap-1">
                <Gauge className="h-3.5 w-3.5" />
                <span>Mesures ({measurements.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* ── ONGLET 1 : ASSISTANT IA ── */}
            <TabsContent value="ai" className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Génération automatique de formulaire selon votre mission</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Décrivez votre intervention terrain ou choisissez l'une des suggestions ci-dessous. NAFA Genius structurera automatiquement les champs, la checklist photo et les mesures techniques adaptées.
                </p>

                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-semibold">Description ou objectif de la mission</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: Audit d'un verger d'anacardiers de 10 ha avec système de goutte-à-goutte solaire et clôture périmétrique..."
                    className="text-xs min-h-[80px]"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Catégorie :</Label>
                    <Select value={category} onValueChange={(v: MissionCategory) => setCategory(v)}>
                      <SelectTrigger className="h-8 text-xs w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agriculture">Agriculture</SelectItem>
                        <SelectItem value="elevage">Élevage</SelectItem>
                        <SelectItem value="machinisme">Machinisme</SelectItem>
                        <SelectItem value="autre">Autre service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => handleGenerateAi()}
                    disabled={generating || !aiPrompt.trim()}
                    className="gradient-primary text-primary-foreground text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {generating ? "Génération en cours..." : "Générer la structure"}
                  </Button>
                </div>
              </div>

              {/* Suggestions rapides */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Suggestions prêtes à l'emploi :
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiPrompt(s.prompt);
                        setCategory(s.cat);
                        handleGenerateAi(s.prompt, s.cat);
                      }}
                      className="text-left p-3 rounded-lg border border-border bg-card hover:bg-accent/60 transition-colors text-xs space-y-1 group"
                    >
                      <div className="font-semibold text-foreground group-hover:text-primary flex items-center justify-between">
                        <span>{s.label}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{s.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ── ONGLET 2 : GÉNÉRAL ── */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nom du formulaire personnalisé *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Inspection Verger d'Agrumes & Goutte-à-goutte"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Catégorie technique</Label>
                  <Select value={category} onValueChange={(v: MissionCategory) => setCategory(v)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agriculture">Agriculture & Aménagement</SelectItem>
                      <SelectItem value="elevage">Élevage & Zootechnie</SelectItem>
                      <SelectItem value="machinisme">Machinisme & Travaux</SelectItem>
                      <SelectItem value="autre">Autre service technique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description & Consignes de terrain</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Précisez les consignes d'intervention, objectifs et points d'attention prioritaires..."
                  className="text-xs min-h-[80px]"
                />
              </div>

              {/* Toggles fonctionnalités */}
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Livrables & Analyse Automatisée
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Générer un plan 2D technique avec cotations</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Produit un schéma vectoriel SVG avec échelle et cotations automatiques.
                    </p>
                  </div>
                  <Switch checked={generatesPlan} onCheckedChange={setGeneratesPlan} />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Générer un devis chiffré estimatif en FCFA</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Calcule les fournitures, matériels et main d'œuvre aux prix réels certifiés BF.
                    </p>
                  </div>
                  <Switch checked={generatesQuote} onCheckedChange={setGeneratesQuote} />
                </div>
              </div>
            </TabsContent>

            {/* ── ONGLET 3 : CHAMPS & PARAMÈTRES ── */}
            <TabsContent value="fields" className="space-y-4">
              {/* Ajout d'un nouveau champ */}
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ajouter un paramètre à collecter sur le terrain</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px]">Libellé du champ *</Label>
                    <Input
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Ex: Espacement entre les lignes"
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Type de donnée</Label>
                    <Select value={newFieldType} onValueChange={(v: any) => setNewFieldType(v)}>
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texte court</SelectItem>
                        <SelectItem value="number">Nombre / Valeur</SelectItem>
                        <SelectItem value="select">Menu déroulant (Choix)</SelectItem>
                        <SelectItem value="boolean">Oui / Non</SelectItem>
                        <SelectItem value="textarea">Texte long / Notes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newFieldType === "number" && (
                  <div className="space-y-1">
                    <Label className="text-[11px]">Unité de mesure (optionnel)</Label>
                    <Input
                      value={newFieldUnit}
                      onChange={(e) => setNewFieldUnit(e.target.value)}
                      placeholder="Ex: m, m², ha, bar, m³/h, kg, têtes, FCFA..."
                      className="text-xs h-8"
                    />
                  </div>
                )}

                {newFieldType === "select" && (
                  <div className="space-y-1">
                    <Label className="text-[11px]">Options (séparées par une virgule)</Label>
                    <Input
                      value={newFieldOptions}
                      onChange={(e) => setNewFieldOptions(e.target.value)}
                      placeholder="Ex: Sableux, Limoneux, Argileux, Latéritique"
                      className="text-xs h-8"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={newFieldRequired} onCheckedChange={setNewFieldRequired} id="field-req" />
                    <Label htmlFor="field-req" className="text-xs cursor-pointer">
                      Champ obligatoire sur le terrain
                    </Label>
                  </div>

                  <Button size="sm" onClick={handleAddField} className="h-8 text-xs font-bold gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter ce paramètre
                  </Button>
                </div>
              </div>

              {/* Liste des champs configurés */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Champs actuels du formulaire ({fields.length})
                </Label>
                {fields.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center border border-dashed rounded-xl">
                    Aucun champ configuré. Utilisez l'assistant IA ou ajoutez des champs ci-dessus.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {fields.map((f, idx) => (
                      <div
                        key={f.key || idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <span>{f.label}</span>
                            {f.required && (
                              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                                Requis
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span className="capitalize">Type : {f.type}</span>
                            {f.unit && <span>• Unité : {f.unit}</span>}
                            {f.options && <span>• {f.options.length} options</span>}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── ONGLET 4 : CHECKLIST PHOTOS ── */}
            <TabsContent value="photos" className="space-y-4">
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Ajouter une prise de vue obligatoire</span>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Intitulé de la photo requise *</Label>
                  <Input
                    value={newPhotoLabel}
                    onChange={(e) => setNewPhotoLabel(e.target.value)}
                    placeholder="Ex: Tête de forage et vanne de refoulement"
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Consignes de cadrage pour l'agronome</Label>
                  <Input
                    value={newPhotoDesc}
                    onChange={(e) => setNewPhotoDesc(e.target.value)}
                    placeholder="Ex: Prendre en gros plan le manomètre et les raccords..."
                    className="text-xs h-8"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={newPhotoMandatory} onCheckedChange={setNewPhotoMandatory} id="photo-mand" />
                    <Label htmlFor="photo-mand" className="text-xs cursor-pointer">
                      Photo bloquante pour validation
                    </Label>
                  </div>

                  <Button size="sm" onClick={handleAddPhoto} className="h-8 text-xs font-bold gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter le cliché
                  </Button>
                </div>
              </div>

              {/* Liste des photos requises */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Checklist photographique ({photos.length})
                </Label>
                {photos.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center border border-dashed rounded-xl">
                    Aucune photo requise configurée pour ce formulaire.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {photos.map((p, idx) => (
                      <div
                        key={p.key || idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <span>{p.label}</span>
                            {p.is_mandatory && (
                              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                                Obligatoire
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{p.description}</p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePhoto(idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── ONGLET 5 : MESURES & TOLÉRANCES ── */}
            <TabsContent value="measurements" className="space-y-4">
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" />
                  <span>Ajouter une mesure technique avec seuils de conformité</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px]">Paramètre mesuré *</Label>
                    <Input
                      value={newMeasureName}
                      onChange={(e) => setNewMeasureName(e.target.value)}
                      placeholder="Ex: Débit au refoulement"
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Unité *</Label>
                    <Input
                      value={newMeasureUnit}
                      onChange={(e) => setNewMeasureUnit(e.target.value)}
                      placeholder="Ex: m³/h, bar, °C, pH..."
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Seuil Min</Label>
                    <Input
                      type="number"
                      value={newMeasureMin}
                      onChange={(e) => setNewMeasureMin(e.target.value)}
                      placeholder="Ex: 5"
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Seuil Max</Label>
                    <Input
                      type="number"
                      value={newMeasureMax}
                      onChange={(e) => setNewMeasureMax(e.target.value)}
                      placeholder="Ex: 25"
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Norme de référence</Label>
                    <Input
                      value={newMeasureNorm}
                      onChange={(e) => setNewMeasureNorm(e.target.value)}
                      placeholder="Ex: Normes professionnelles"
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button size="sm" onClick={handleAddMeasurement} className="h-8 text-xs font-bold gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter cette mesure
                  </Button>
                </div>
              </div>

              {/* Liste des mesures */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Mesures techniques sous contrôle ({measurements.length})
                </Label>
                {measurements.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center border border-dashed rounded-xl">
                    Aucune mesure technique configurée.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {measurements.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <span>{m.name}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {m.unit}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {m.min_threshold !== undefined && m.max_threshold !== undefined
                              ? `Plage tolérée : ${m.min_threshold} à ${m.max_threshold} ${m.unit}`
                              : "Mesure indicative"}
                            {m.default_norm && ` • Norme : ${m.default_norm}`}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMeasurement(idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Pied de dialogue */}
        <DialogFooter className="p-4 sm:p-5 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Annuler
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              className="text-xs font-semibold gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Enregistrer le modèle</span>
            </Button>

            <Button
              size="sm"
              onClick={() => handleSave(true)}
              className="gradient-primary text-primary-foreground text-xs font-bold gap-1.5 shadow-xs"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Enregistrer et Démarrer l'Inspection</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
