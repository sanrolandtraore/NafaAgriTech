import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  BookOpen,
  Leaf,
  Bug,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Eye,
  Info,
  ChevronRight,
  Droplets,
  Layers,
} from "lucide-react";
import {
  PlantHealthCase,
  PHYTO_CROPS,
  phytosanitaryStorage,
  searchPhytosanitaryLibrary,
  PlantHealthCategory,
} from "@/lib/phytosanitaryLibrary";
import { PrescriptionGenerator } from "./PrescriptionGenerator";

interface CropDiagnosisToolProps {
  enforceRoleGate?: boolean;
}

export function CropDiagnosisTool({ enforceRoleGate = false }: CropDiagnosisToolProps = {}) {
  // Sélection des critères d'observation de terrain
  const [selectedCropId, setSelectedCropId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedOrgan, setSelectedOrgan] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cas actuellement consulté en détail
  const [activeCase, setActiveCase] = useState<PlantHealthCase | null>(null);

  // État du générateur de prescription
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);

  // Liste complète des cas certifiés issus du référentiel
  const allCases = useMemo(() => phytosanitaryStorage.getAllCases(), []);

  // Filtrage direct et déterministe
  const filteredCases = useMemo(() => {
    return allCases.filter((item) => {
      if (selectedCropId !== "all" && item.cropId !== selectedCropId) return false;
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (
        selectedOrgan !== "all" &&
        !item.affectedOrgans.includes(selectedOrgan as any)
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.diseaseNameFr.toLowerCase().includes(query);
        const matchScientific = item.scientificName.toLowerCase().includes(query);
        const matchSymptom = item.symptoms.some((s) => s.descriptionFr.toLowerCase().includes(query));
        if (!matchName && !matchScientific && !matchSymptom) return false;
      }
      return true;
    });
  }, [allCases, selectedCropId, selectedCategory, selectedOrgan, searchQuery]);

  return (
    <div className="space-y-6">
      {/* En-tête informatif */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-muted/30 to-background">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary text-primary font-bold text-xs">
                Référentiel Homologué INERA & CSP-CILSS
              </Badge>
              <Badge variant="secondary" className="text-xs">
                100% Déterministe & Sans Aléas
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Guide d'Identification Phytosanitaire par Observation Terrain
            </h2>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Consultez les pathologies végétales et ravageurs avérés du Burkina Faso. Identifiez précisément les symptômes réels constatés sur votre culture sans approximation ni faux diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCropId("all");
                setSelectedCategory("all");
                setSelectedOrgan("all");
                setSearchQuery("");
                setActiveCase(null);
              }}
              className="text-xs h-8"
            >
              Réinitialiser filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Barre de sélection multicritères */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Culture */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Culture concernée</Label>
              <Select value={selectedCropId} onValueChange={setSelectedCropId}>
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue placeholder="Toutes les cultures" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les cultures ({allCases.length})</SelectItem>
                  {PHYTO_CROPS.map((crop) => (
                    <SelectItem key={crop.id} value={crop.id}>
                      {crop.commonNameFr} ({crop.scientificName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Organe affecté */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Organe touché</Label>
              <Select value={selectedOrgan} onValueChange={setSelectedOrgan}>
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue placeholder="Tous les organes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les organes</SelectItem>
                  <SelectItem value="feuilles">Feuilles</SelectItem>
                  <SelectItem value="tiges">Tiges / Collet</SelectItem>
                  <SelectItem value="fruits">Fruits / Épis</SelectItem>
                  <SelectItem value="racines">Racines</SelectItem>
                  <SelectItem value="collet">Collet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Type d'affection */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Nature de l'affection</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue placeholder="Toutes natures" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes natures</SelectItem>
                  <SelectItem value="fongique">Champignon (Fongique)</SelectItem>
                  <SelectItem value="bacterienne">Bactérie</SelectItem>
                  <SelectItem value="virale">Virus</SelectItem>
                  <SelectItem value="ravageur">Ravageur / Chenille / Insecte</SelectItem>
                  <SelectItem value="carence">Carence minérale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. Recherche textuelle par symptôme */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Recherche symptôme ou nom</Label>
              <div className="relative mt-1">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                <Input
                  placeholder="Ex: flétrissement, taches, pourriture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille des cas et Panneau de consultation détaillée */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Liste des fiches */}
        <div className={activeCase ? "lg:col-span-5 space-y-3" : "lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
          {filteredCases.length === 0 ? (
            <Card className="col-span-full p-8 text-center text-muted-foreground space-y-2">
              <BookOpen className="h-10 w-10 mx-auto text-primary/40" />
              <p className="text-sm font-semibold">Aucune fiche ne correspond à ces critères d'observation.</p>
              <p className="text-xs">Modifiez les filtres de culture ou d'organe pour élargir la recherche.</p>
            </Card>
          ) : (
            filteredCases.map((item) => {
              const crop = PHYTO_CROPS.find((c) => c.id === item.cropId);
              const isSelected = activeCase?.id === item.id;

              return (
                <Card
                  key={item.id}
                  onClick={() => setActiveCase(item)}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    isSelected ? "border-2 border-primary bg-primary/5 shadow-sm" : "border-border/80"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                          {crop?.commonNameFr || "Culture"}
                        </span>
                        <h3 className="font-bold text-sm text-foreground leading-snug">
                          {item.diseaseNameFr}
                        </h3>
                        <p className="text-[11px] italic text-muted-foreground">
                          {item.scientificName}
                        </p>
                      </div>
                      <Badge
                        variant={item.category === "ravageur" ? "destructive" : "secondary"}
                        className="text-[10px] uppercase font-semibold shrink-0"
                      >
                        {item.category}
                      </Badge>
                    </div>

                    {/* Symptôme principal */}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.symptoms[0]?.descriptionFr || item.epidemiology}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t text-[11px] text-muted-foreground">
                      <span>
                        Organes : {item.affectedOrgans.join(", ")}
                      </span>
                      <span className="text-primary font-semibold flex items-center gap-0.5">
                        Consulter <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Détail complet de la fiche sélectionnée */}
        {activeCase && (
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-2 border-primary shadow-sm sticky top-4">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge className="bg-primary text-primary-foreground font-semibold text-xs mb-1">
                      Fiche Pathologique Certifiée INERA
                    </Badge>
                    <CardTitle className="text-xl font-extrabold text-foreground">
                      {activeCase.diseaseNameFr}
                    </CardTitle>
                    <CardDescription className="text-xs italic">
                      Nom scientifique : {activeCase.scientificName}
                    </CardDescription>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveCase(null)}
                    className="text-xs"
                  >
                    Fermer
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-5 text-xs max-h-[72vh] overflow-y-auto">
                {/* 1. Symptômes précis d'observation */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-emerald-600" />
                    Symptômes Observables sur le Terrain
                  </h4>
                  <div className="space-y-1.5 pl-2">
                    {activeCase.symptoms.map((s, idx) => (
                      <div key={idx} className="p-2 rounded bg-muted/30 border flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground capitalize">{s.organ} :</strong>{" "}
                          <span className="text-muted-foreground">{s.descriptionFr}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Critère déterminant de différenciation (pour ne pas confondre) */}
                {activeCase.rules.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1 text-amber-900 dark:text-amber-200">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      Critère Déterminant pour Trancher Sans Erreur
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {activeCase.rules[0]?.differentiationKey}
                    </p>
                    {activeCase.rules[0]?.confirmationMethod && (
                      <p className="text-[11px] font-medium pt-1">
                        Test de confirmation terrain : {activeCase.rules[0].confirmationMethod}
                      </p>
                    )}
                  </div>
                )}

                {/* 3. Traitements homologués CSP-CILSS et Agro-Écologiques */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Protocoles de Traitement & Protection
                  </h4>

                  <div className="space-y-2">
                    {activeCase.protocols.map((p, idx) => (
                      <div key={idx} className="p-3 rounded-lg border bg-card space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground text-xs">{p.title}</span>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {p.protocolType === "biologique" ? "Bio-pesticide / Préventif" : "Homologation CSP"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{p.instructions}</p>
                        {p.dosage && (
                          <div className="font-mono text-[11px] text-foreground bg-muted/40 p-1.5 rounded">
                            Dosage certifié : {p.dosage}
                            {p.preHarvestIntervalDays && ` • Délai avant récolte : ${p.preHarvestIntervalDays} jours`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions : Prescription officielle */}
                <div className="pt-2 border-t flex flex-wrap gap-2">
                  <Button
                    onClick={() => setIsPrescriptionOpen(true)}
                    className="gradient-primary text-primary-foreground font-bold gap-2 text-xs flex-1"
                  >
                    <FileText className="h-4 w-4" />
                    Rédiger une Prescription d'Expert pour ce Cas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogue de rédaction d'ordonnance / prescription officielle */}
      {isPrescriptionOpen && activeCase && (
        <PrescriptionGenerator
          initialData={{
            diagnosis: `${activeCase.diseaseNameFr} (${activeCase.scientificName})`,
            crop: activeCase.cropId,
            recommendations: activeCase.protocols[0]?.instructions || "",
          }}
          onClose={() => setIsPrescriptionOpen(false)}
        />
      )}
    </div>
  );
}
