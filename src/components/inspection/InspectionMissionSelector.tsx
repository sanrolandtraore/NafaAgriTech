import { useState, useMemo, useEffect } from "react";
import {
  InspectionType,
  InspectionTemplate,
  MissionCategory,
  nafaInspectionEngine,
} from "@/lib/nafaSmartInspectionEngine";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Sprout,
  Beef,
  Wrench,
  Layers,
  ArrowRight,
  Plus,
  Droplets,
  Tractor,
  Compass,
  Sparkles,
  FlaskConical,
  MapPin,
  Microscope,
  Fish,
  Home,
  Stethoscope,
  Settings,
  Cpu,
  Share2,
  Edit,
  Copy,
  Trash2,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import CustomFormGeneratorModal from "./CustomFormGeneratorModal";

interface InspectionMissionSelectorProps {
  onSelectType: (type: InspectionType) => void;
  selectedTypeId?: string;
  onOpenFormGenerator?: () => void;
}

const CATEGORIES: { id: MissionCategory | "all" | "custom"; label: string; icon: typeof Sprout }[] = [
  { id: "all", label: "Toutes les missions", icon: Layers },
  { id: "custom", label: "Mes formulaires personnalisés", icon: Sparkles },
  { id: "agriculture", label: "Agriculture & Aménagement", icon: Sprout },
  { id: "elevage", label: "Élevage & Zootechnie", icon: Beef },
  { id: "machinisme", label: "Machinisme & Travaux", icon: Wrench },
  { id: "autre", label: "Autres services", icon: Settings },
];

// Mappeur d'icônes Lucide
const ICON_MAP: Record<string, typeof Sprout> = {
  Tractor,
  Droplets,
  Wind: Droplets,
  CloudRain: Droplets,
  Compass,
  Layers,
  Sparkles,
  FlaskConical,
  MapPin,
  Microscope,
  Beef,
  Egg: Beef,
  Fish,
  Home,
  Stethoscope,
  Droplet: Droplets,
  Wrench,
  Settings,
  Cpu,
  Share2,
};

export default function InspectionMissionSelector({
  onSelectType,
  selectedTypeId,
  onOpenFormGenerator,
}: InspectionMissionSelectorProps) {
  const [types, setTypes] = useState<InspectionType[]>(() => nafaInspectionEngine.getTypes());
  const [selectedCat, setSelectedCat] = useState<MissionCategory | "all" | "custom">("all");
  const [search, setSearch] = useState("");

  // Modal de création/génération de formulaire sur-mesure
  const [openGeneratorModal, setOpenGeneratorModal] = useState(false);
  const [editingType, setEditingType] = useState<InspectionType | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<InspectionTemplate | null>(null);

  // Recharger types si mise à jour
  useEffect(() => {
    const handleUpdate = () => {
      setTypes(nafaInspectionEngine.getTypes());
    };
    window.addEventListener("nafa-inspection-updated", handleUpdate);
    return () => window.removeEventListener("nafa-inspection-updated", handleUpdate);
  }, []);

  const customCount = useMemo(() => types.filter((t) => !t.is_system).length, [types]);

  const filteredTypes = useMemo(() => {
    return types.filter((t) => {
      const matchCat =
        selectedCat === "all"
          ? true
          : selectedCat === "custom"
          ? !t.is_system
          : t.category === selectedCat;

      const matchSearch =
        search === "" ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [types, selectedCat, search]);

  const handleEditCustomType = (e: React.MouseEvent, type: InspectionType) => {
    e.stopPropagation();
    const template = nafaInspectionEngine.getTemplateForType(type.id);
    setEditingType(type);
    setEditingTemplate(template);
    setOpenGeneratorModal(true);
  };

  const handleDuplicateType = (e: React.MouseEvent, type: InspectionType) => {
    e.stopPropagation();
    const duplicated = nafaInspectionEngine.duplicateCustomType(type.id);
    if (duplicated) {
      setTypes(nafaInspectionEngine.getTypes());
      toast.success(`Formulaire "${duplicated.type.name}" dupliqué avec succès.`);
    }
  };

  const handleDeleteCustomType = (e: React.MouseEvent, type: InspectionType) => {
    e.stopPropagation();
    if (!confirm(`Supprimer définitivement le formulaire personnalisé "${type.name}" ?`)) return;
    const ok = nafaInspectionEngine.deleteCustomType(type.id);
    if (ok) {
      setTypes(nafaInspectionEngine.getTypes());
      toast.success("Formulaire personnalisé supprimé.");
    }
  };

  const handleOpenNewGenerator = () => {
    if (onOpenFormGenerator) {
      onOpenFormGenerator();
    } else {
      setEditingType(null);
      setEditingTemplate(null);
      setOpenGeneratorModal(true);
    }
  };

  const handleSavedForm = (type: InspectionType, _template: InspectionTemplate, launchNow?: boolean) => {
    setTypes(nafaInspectionEngine.getTypes());
    if (launchNow) {
      onSelectType(type);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre d'action supérieure avec recherche et création */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une mission (ex: irrigation, goutte-à-goutte, piscicole, bovine, forage...)"
            className="pl-9 text-xs sm:text-sm bg-card border-border"
          />
        </div>

        {/* Bouton de génération de formulaire sur-mesure */}
        <Button
          size="sm"
          onClick={handleOpenNewGenerator}
          className="text-xs font-semibold shrink-0 gap-1.5 gradient-primary text-primary-foreground shadow-xs"
        >
          <Sparkles className="h-4 w-4" />
          <span>Générer un formulaire personnalisé</span>
        </Button>
      </div>

      {/* Filtres par catégories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCat === cat.id;
          const count = cat.id === "custom" ? customCount : undefined;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              {count !== undefined && count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grille des types de missions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTypes.map((type) => {
          const Icon = ICON_MAP[type.iconName] || Sprout;
          const isSelected = selectedTypeId === type.id;
          const isCustom = !type.is_system;

          return (
            <Card
              key={type.id}
              onClick={() => onSelectType(type)}
              className={`cursor-pointer transition-all duration-200 border hover:shadow-xs active:scale-[0.99] flex flex-col justify-between group ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40"
                  : isCustom
                  ? "border-primary/40 hover:border-primary bg-card/90"
                  : "border-border hover:border-primary/40 bg-card"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    {isCustom && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20 shrink-0"
                      >
                        Personnalisé
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold uppercase tracking-wider shrink-0 border-border"
                    >
                      {type.category}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-heading font-bold text-sm text-foreground line-clamp-1">
                    {type.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {type.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                  <span className="flex items-center gap-1">
                    <span>Lancer la mission</span>
                  </span>

                  <div className="flex items-center gap-1">
                    {isCustom && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEditCustomType(e, type)}
                          className="h-7 px-1.5 text-muted-foreground hover:text-foreground"
                          title="Modifier le modèle"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteCustomType(e, type)}
                          className="h-7 px-1.5 text-muted-foreground hover:text-destructive"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDuplicateType(e, type)}
                      className="h-7 px-1.5 text-muted-foreground hover:text-primary"
                      title="Dupliquer et personnaliser"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 ml-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTypes.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-card border border-border space-y-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {selectedCat === "custom"
                ? "Vous n'avez pas encore créé de formulaire personnalisé"
                : `Aucune mission trouvée pour "${search}"`}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Utilisez le bouton "Générer un formulaire personnalisé" pour concevoir votre fiche sur-mesure ou dupliquez un modèle existant.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleOpenNewGenerator}
            className="gradient-primary text-primary-foreground text-xs font-bold gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Créer mon premier formulaire</span>
          </Button>
        </div>
      )}

      {/* Modal interactif du générateur de formulaire */}
      <CustomFormGeneratorModal
        open={openGeneratorModal}
        onOpenChange={setOpenGeneratorModal}
        editType={editingType}
        editTemplate={editingTemplate}
        onSaved={handleSavedForm}
      />
    </div>
  );
}
