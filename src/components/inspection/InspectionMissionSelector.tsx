import { useState, useMemo } from "react";
import {
  InspectionType,
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface InspectionMissionSelectorProps {
  onSelectType: (type: InspectionType) => void;
  selectedTypeId?: string;
}

const CATEGORIES: { id: MissionCategory | "all"; label: string; icon: typeof Sprout }[] = [
  { id: "all", label: "Toutes les missions", icon: Layers },
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
}: InspectionMissionSelectorProps) {
  const [types, setTypes] = useState<InspectionType[]>(() => nafaInspectionEngine.getTypes());
  const [selectedCat, setSelectedCat] = useState<MissionCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [openNewTypeDialog, setOpenNewTypeDialog] = useState(false);

  // Formulaire pour ajouter un nouveau type (extensibilité)
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeCat, setNewTypeCat] = useState<MissionCategory>("agriculture");
  const [newTypeDesc, setNewTypeDesc] = useState("");

  const filteredTypes = useMemo(() => {
    return types.filter((t) => {
      const matchCat = selectedCat === "all" || t.category === selectedCat;
      const matchSearch =
        search === "" ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [types, selectedCat, search]);

  const handleCreateCustomType = () => {
    if (!newTypeName.trim()) {
      toast.error("Veuillez saisir le nom de la nouvelle mission");
      return;
    }
    const created = nafaInspectionEngine.registerCustomType({
      name: newTypeName.trim(),
      code: `CUSTOM_${newTypeName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_")}`,
      category: newTypeCat,
      description: newTypeDesc.trim() || "Type d'inspection personnalisé créé par l'expert.",
      iconName: "Sparkles",
      is_active: true,
    });
    setTypes(nafaInspectionEngine.getTypes());
    setOpenNewTypeDialog(false);
    setNewTypeName("");
    setNewTypeDesc("");
    toast.success(`Nouveau type "${created.name}" ajouté avec succès !`);
    onSelectType(created);
  };

  return (
    <div className="space-y-6">
      {/* Barre d'action supérieure avec recherche et ajout */}
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

        {/* Modal d'extensibilité pour ajouter un nouveau type */}
        <Dialog open={openNewTypeDialog} onOpenChange={setOpenNewTypeDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-xs font-semibold shrink-0 gap-1.5 border-dashed border-primary/40 hover:border-primary">
              <Plus className="h-4 w-4 text-primary" />
              <span>Nouveau type d'inspection</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Ajouter un nouveau type de mission
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs">Catégorie</Label>
                <Select value={newTypeCat} onValueChange={(v: MissionCategory) => setNewTypeCat(v)}>
                  <SelectTrigger className="text-xs mt-1">
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

              <div>
                <Label className="text-xs">Intitulé de la mission</Label>
                <Input
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Ex: Inspection de station d'épuration agro..."
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Description & Objectif terrain</Label>
                <Textarea
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  placeholder="Précisez les éléments clés à observer lors de cette mission..."
                  className="text-xs mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => setOpenNewTypeDialog(false)}>
                  Annuler
                </Button>
                <Button size="sm" className="gradient-primary text-primary-foreground font-semibold" onClick={handleCreateCustomType}>
                  Créer et générer le formulaire IA
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres par catégories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCat === cat.id;
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
            </button>
          );
        })}
      </div>

      {/* Grille des types de missions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTypes.map((type) => {
          const Icon = ICON_MAP[type.iconName] || Sprout;
          const isSelected = selectedTypeId === type.id;

          return (
            <Card
              key={type.id}
              onClick={() => onSelectType(type)}
              className={`cursor-pointer transition-all duration-200 border hover:shadow-xs active:scale-[0.99] flex flex-col justify-between ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40"
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
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold uppercase tracking-wider shrink-0 border-border"
                  >
                    {type.category}
                  </Badge>
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
                  <span>Générer le formulaire IA</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTypes.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-card border border-border space-y-2">
          <p className="text-sm font-semibold text-foreground">Aucune mission trouvée pour "{search}"</p>
          <p className="text-xs text-muted-foreground">
            Utilisez le bouton "Nouveau type d'inspection" pour créer cette mission sur mesure.
          </p>
        </div>
      )}
    </div>
  );
}
