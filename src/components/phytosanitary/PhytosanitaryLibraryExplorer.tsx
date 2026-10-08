import React, { useState, useMemo } from "react";
import {
  PlantHealthCase,
  PHYTO_CROPS,
  phytosanitaryStorage,
  searchPhytosanitaryLibrary,
  PlantHealthCategory,
  RiskLevel,
  ExpertValidation,
} from "@/lib/phytosanitaryLibrary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Sprout,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
  BookOpen,
  Info,
  Layers,
  Leaf,
  Bug,
  Activity,
  Award,
  Check,
  Share2,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  WifiOff,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessDiagnosticTools } from "@/lib/roleAccessControl";

interface PhytosanitaryLibraryExplorerProps {
  initialCropId?: string;
  onSelectCaseForDiagnosis?: (caseItem: PlantHealthCase) => void;
}

export default function PhytosanitaryLibraryExplorer({
  initialCropId,
  onSelectCaseForDiagnosis,
}: PhytosanitaryLibraryExplorerProps) {
  const { primaryRole, partnerType, profile } = useAuth();
  const isExpert = canAccessDiagnosticTools(primaryRole, partnerType) && (primaryRole === "expert" || partnerType === "expert_agronome" || primaryRole === "admin");

  const [query, setQuery] = useState("");
  const [selectedCropId, setSelectedCropId] = useState<string>(initialCropId || "toutes");
  const [selectedCategory, setSelectedCategory] = useState<PlantHealthCategory | "toutes">("toutes");
  const [selectedOrgan, setSelectedOrgan] = useState<string>("tous");
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | "tous">("tous");
  const [offlineOnly, setOfflineOnly] = useState(false);

  const [activeCaseModal, setActiveCaseModal] = useState<PlantHealthCase | null>(null);
  const [activeTabDetail, setActiveTabDetail] = useState<string>("symptomes");

  // État Validation Expert
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationDecision, setValidationDecision] = useState<"approved" | "rejected" | "correction_requested">("approved");
  const [validationNotes, setValidationNotes] = useState("");

  const [downloadedIds, setDownloadedIds] = useState<string[]>(() =>
    phytosanitaryStorage.getDownloadedCaseIds()
  );

  // Filtrage réactif
  const filteredCases = useMemo(() => {
    return searchPhytosanitaryLibrary({
      query,
      cropId: selectedCropId,
      category: selectedCategory,
      organ: selectedOrgan,
      riskLevel: selectedRisk,
      offlineOnly,
    });
  }, [query, selectedCropId, selectedCategory, selectedOrgan, selectedRisk, offlineOnly]);

  const handleToggleOffline = (caseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isNowDownloaded = phytosanitaryStorage.toggleOfflineDownload(caseId);
    setDownloadedIds(phytosanitaryStorage.getDownloadedCaseIds());
    if (isNowDownloaded) {
      toast.success("Fiche téléchargée pour consultation hors-ligne intégrale");
    } else {
      toast.info("Fiche retirée du cache hors-ligne");
    }
  };

  const handleSaveValidation = () => {
    if (!activeCaseModal) return;
    if (!validationNotes.trim()) {
      toast.error("Veuillez renseigner une note d'expertise agronomique");
      return;
    }

    const validation: ExpertValidation = {
      id: `val_${Date.now()}`,
      caseId: activeCaseModal.id,
      expertName: profile?.full_name || "Agronome Référent",
      institution: "INERA / Ordre des Agronomes BF",
      decision: validationDecision,
      reviewNotes: validationNotes.trim(),
      validatedAt: new Date().toISOString(),
    };

    phytosanitaryStorage.addExpertValidation(validation);
    setActiveCaseModal(phytosanitaryStorage.getCaseById(activeCaseModal.id) || null);
    setIsValidationModalOpen(false);
    setValidationNotes("");
    toast.success("Validation enregistrée dans le registre agronomique certifié");
  };

  return (
    <div className="space-y-6">
      {/* ─── BANDEAU EN-TÊTE DE LA BIBLIOTHÈQUE ─── */}
      <div className="bg-card border rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary/30 font-bold text-[11px] uppercase tracking-wide">
                Référentiel National Propriétaire
              </Badge>
              <Badge variant="secondary" className="text-[11px] font-semibold">
                TOM2024 • INERA • CSP-CILSS
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground mt-1 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary shrink-0" />
              Bibliothèque Phytosanitaire Intelligente
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-3xl">
              Base de connaissances agronomiques certifiées : recherche de bio-agresseurs, photos de référence haute résolution au champ, diagnostic différentiel et protocoles de lutte intégrée (IPM) homologués au Burkina Faso.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={offlineOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setOfflineOnly(!offlineOnly)}
              className="text-xs gap-1.5 h-9 shrink-0"
            >
              <WifiOff className="h-4 w-4" />
              <span>{offlineOnly ? "Mode Hors-ligne Actif" : "Fiches Hors-ligne"}</span>
            </Button>
          </div>
        </div>

        {/* ─── BARRE DE RECHERCHE & FILTRES RAPIDES ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Recherche textuelle */}
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une maladie, un ravageur, symptôme ou nom local..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-10 rounded-xl"
            />
          </div>

          {/* Filtre Culture */}
          <div className="sm:col-span-3">
            <Select value={selectedCropId} onValueChange={setSelectedCropId}>
              <SelectTrigger className="text-xs sm:text-sm h-10 rounded-xl">
                <SelectValue placeholder="Toutes les cultures" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les cultures</SelectItem>
                {PHYTO_CROPS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.commonNameFr} ({c.scientificName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre Catégorie de Bio-agresseur */}
          <div className="sm:col-span-2">
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
              <SelectTrigger className="text-xs sm:text-sm h-10 rounded-xl">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes catégories</SelectItem>
                <SelectItem value="ravageur">Ravageurs</SelectItem>
                <SelectItem value="fongique">Fongiques</SelectItem>
                <SelectItem value="bacterienne">Bactériennes</SelectItem>
                <SelectItem value="virale">Virales</SelectItem>
                <SelectItem value="carence">Carences</SelectItem>
                <SelectItem value="stress_abiotique">Stress abiotiques</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtre Organe */}
          <div className="sm:col-span-2">
            <Select value={selectedOrgan} onValueChange={setSelectedOrgan}>
              <SelectTrigger className="text-xs sm:text-sm h-10 rounded-xl">
                <SelectValue placeholder="Organe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous organes</SelectItem>
                <SelectItem value="feuilles">Feuilles</SelectItem>
                <SelectItem value="tiges">Tiges</SelectItem>
                <SelectItem value="fruits">Fruits</SelectItem>
                <SelectItem value="collet">Collet</SelectItem>
                <SelectItem value="racines">Racines</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ─── SÉLECTEUR DE CULTURES EN PILLS ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <Button
            size="sm"
            variant={selectedCropId === "toutes" ? "default" : "outline"}
            onClick={() => setSelectedCropId("toutes")}
            className="text-xs h-8 rounded-full shrink-0"
          >
            Toutes ({searchPhytosanitaryLibrary().length})
          </Button>
          {PHYTO_CROPS.map((crop) => {
            const count = searchPhytosanitaryLibrary({ cropId: crop.id }).length;
            const isSelected = selectedCropId === crop.id;
            return (
              <Button
                key={crop.id}
                size="sm"
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSelectedCropId(crop.id)}
                className="text-xs h-8 rounded-full shrink-0 gap-1.5"
              >
                <Sprout className="h-3.5 w-3.5" />
                <span>{crop.commonNameFr}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* ─── RÉSULTATS : GRILLE DE FICHES PHYTOSANITAIRES ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>{filteredCases.length} fiches réelles trouvées</span>
          <span>Indexation conforme INERA Farako-Bâ & CILSS</span>
        </div>

        {filteredCases.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground space-y-3">
            <Info className="h-10 w-10 mx-auto text-primary/40" />
            <h3 className="text-base font-bold text-foreground">Aucune fiche ne correspond aux filtres</h3>
            <p className="text-xs max-w-md mx-auto">
              Essayez d'élargir votre recherche en sélectionnant « Toutes les cultures » ou en effaçant les filtres de catégorie.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setSelectedCropId("toutes");
                setSelectedCategory("toutes");
                setSelectedOrgan("tous");
                setOfflineOnly(false);
              }}
              className="text-xs"
            >
              Réinitialiser les filtres
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.map((caseItem) => {
              const isDownloaded = downloadedIds.includes(caseItem.id);
              const crop = PHYTO_CROPS.find((c) => c.id === caseItem.cropId);
              const heroImage = caseItem.images.find((img) => img.isReferenceHero) || caseItem.images[0];

              return (
                <Card
                  key={caseItem.id}
                  onClick={() => setActiveCaseModal(caseItem)}
                  className="rounded-2xl border hover:border-primary/50 transition-all shadow-xs hover:shadow-md cursor-pointer overflow-hidden flex flex-col group bg-card"
                >
                  {/* Photo de référence */}
                  <div className="relative aspect-video w-full bg-muted/60 overflow-hidden flex items-center justify-center">
                    {heroImage ? (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-950/20 to-emerald-900/40 flex items-center justify-center p-3 text-center">
                        <div className="space-y-1">
                          <Leaf className="h-8 w-8 text-primary mx-auto opacity-70 group-hover:scale-110 transition-transform" />
                          <span className="text-[11px] font-medium text-muted-foreground line-clamp-2">
                            {heroImage.captionFr}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Leaf className="h-8 w-8 text-muted-foreground/40" />
                    )}

                    {/* Badge Catégorie */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <Badge className="text-[10px] font-bold uppercase tracking-wider bg-background/90 text-foreground border shadow-xs">
                        {caseItem.category}
                      </Badge>
                      {crop && (
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {crop.commonNameFr}
                        </Badge>
                      )}
                    </div>

                    {/* Bouton Téléchargement Hors-ligne */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handleToggleOffline(caseItem.id, e)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 hover:bg-background text-foreground shadow-xs"
                      title={isDownloaded ? "Disponible hors-ligne" : "Télécharger pour usage hors-ligne"}
                    >
                      {isDownloaded ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Download className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>

                  {/* Corps de la carte */}
                  <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                          {caseItem.diseaseNameFr}
                        </h3>
                        {caseItem.riskLevel === "critique" && (
                          <Badge variant="destructive" className="text-[9px] uppercase font-bold py-0">
                            Critique
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground italic font-serif mt-0.5">
                        {caseItem.scientificName}
                      </p>

                      {caseItem.localNames && (caseItem.localNames.moore || caseItem.localNames.dioula) && (
                        <p className="text-[11px] text-muted-foreground/80 mt-1">
                          Noms locaux : {[caseItem.localNames.moore, caseItem.localNames.dioula].filter(Boolean).join(" • ")}
                        </p>
                      )}

                      <p className="text-xs text-foreground/85 line-clamp-2 mt-2 leading-relaxed">
                        {caseItem.epidemiology}
                      </p>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Validé INERA
                      </span>
                      <span className="font-medium text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        Consulter la fiche <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL FICHE DÉTAILLÉE COMPLÈTE ─── */}
      <Dialog open={!!activeCaseModal} onOpenChange={(open) => !open && setActiveCaseModal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
          {activeCaseModal && (
            <div>
              {/* Header de la Fiche */}
              <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border-b space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                      {activeCaseModal.category}
                    </Badge>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                      Statut : Validé INERA / CILSS
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleOffline(activeCaseModal.id)}
                    className="text-xs gap-1.5 h-8"
                  >
                    {downloadedIds.includes(activeCaseModal.id) ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> Disponible Hors-ligne
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" /> Télécharger Hors-ligne
                      </>
                    )}
                  </Button>
                </div>

                <DialogTitle className="text-xl sm:text-2xl font-bold font-heading text-foreground mt-1">
                  {activeCaseModal.diseaseNameFr}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground italic font-serif">
                  {activeCaseModal.scientificName} — Organes atteints : {activeCaseModal.affectedOrgans.join(", ")}
                </DialogDescription>
              </div>

              {/* Contenu à Onglets */}
              <div className="p-5 space-y-4">
                <Tabs value={activeTabDetail} onValueChange={setActiveTabDetail}>
                  <TabsList className="grid grid-cols-4 w-full h-10 rounded-xl">
                    <TabsTrigger value="symptomes" className="text-xs font-bold">
                      Symptômes
                    </TabsTrigger>
                    <TabsTrigger value="differentiel" className="text-xs font-bold">
                      Diagnostic Différentiel
                    </TabsTrigger>
                    <TabsTrigger value="traitements" className="text-xs font-bold">
                      Protocoles IPM
                    </TabsTrigger>
                    <TabsTrigger value="validation" className="text-xs font-bold">
                      Validation Expert
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB 1 : SYMPTÔMES & ÉPIDÉMIOLOGIE */}
                  <TabsContent value="symptomes" className="space-y-4 pt-3">
                    <div className="p-3.5 rounded-xl bg-muted/50 border text-xs leading-relaxed text-foreground/90">
                      <strong>Épidémiologie & Comportement au champ :</strong> {activeCaseModal.epidemiology}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                        Symptômes caractéristiques par organe
                      </h4>
                      <div className="space-y-2.5">
                        {activeCaseModal.symptoms.map((sym) => (
                          <div key={sym.id} className="p-3 rounded-xl border bg-card space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground capitalize flex items-center gap-1.5">
                                <Leaf className="h-3.5 w-3.5 text-primary" />
                                {sym.organ}
                              </span>
                              {sym.isPrimary && (
                                <Badge variant="secondary" className="text-[10px] py-0 font-bold">
                                  Symptôme Clé
                                </Badge>
                              )}
                            </div>
                            <p className="text-foreground/90 leading-relaxed">{sym.descriptionFr}</p>
                            {sym.visualPattern && (
                              <p className="text-[11px] text-muted-foreground">
                                <strong>Motif phénotypique :</strong> {sym.visualPattern.replace(/_/g, " ")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 2 : DIAGNOSTIC DIFFÉRENTIEL & CONFUSIONS */}
                  <TabsContent value="differentiel" className="space-y-4 pt-3">
                    {activeCaseModal.rules.map((rule) => (
                      <div key={rule.id} className="space-y-3">
                        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1.5 text-xs">
                          <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            Critère déterminant de différenciation
                          </span>
                          <p className="text-foreground/90 leading-relaxed font-medium">
                            {rule.differentiationKey}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5 text-xs">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            Méthode de confirmation au champ
                          </span>
                          <p className="text-foreground/90 leading-relaxed">
                            {rule.confirmationMethod}
                          </p>
                        </div>

                        {rule.confusingCases && rule.confusingCases.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                              Pathologies ou causes créant des confusions
                            </h4>
                            <div className="space-y-2">
                              {rule.confusingCases.map((cc, idx) => (
                                <div key={idx} className="p-3 rounded-xl border bg-muted/30 text-xs space-y-1">
                                  <strong className="text-foreground block">{cc.caseName}</strong>
                                  <p className="text-muted-foreground">{cc.confusingFeature}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </TabsContent>

                  {/* TAB 3 : PROTOCOLES IPM (BIOLOGIQUE & CHIMIQUE CSP) */}
                  <TabsContent value="traitements" className="space-y-4 pt-3">
                    <div className="space-y-3">
                      {activeCaseModal.protocols.map((proto) => {
                        const isBio = proto.protocolType === "biologique";
                        const isChem = proto.protocolType === "chimique_csp";
                        const isPrev = proto.protocolType === "preventif" || proto.protocolType === "cultural";

                        return (
                          <Card
                            key={proto.id}
                            className={`rounded-xl border ${
                              isBio
                                ? "border-emerald-500/40 bg-emerald-500/5"
                                : isChem
                                ? "border-blue-500/40 bg-blue-500/5"
                                : "border-slate-500/30 bg-slate-500/5"
                            }`}
                          >
                            <CardHeader className="py-2.5 px-3.5 border-b">
                              <div className="flex items-center justify-between flex-wrap gap-1.5">
                                <Badge
                                  className={`text-[10px] font-bold uppercase ${
                                    isBio
                                      ? "bg-emerald-600 text-white"
                                      : isChem
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-700 text-white"
                                  }`}
                                >
                                  {isBio ? "Protocole Biologique" : isChem ? "Homologué CSP-CILSS" : "Mesure Préventive"}
                                </Badge>
                                {proto.cspRegistrationNumber && (
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    N° CSP : {proto.cspRegistrationNumber}
                                  </span>
                                )}
                              </div>
                              <CardTitle className="text-sm font-bold mt-1">{proto.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3.5 space-y-2 text-xs">
                              <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                                {proto.instructions}
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t text-[11px]">
                                {proto.activeSubstance && (
                                  <div>
                                    <strong className="text-muted-foreground">Matière active :</strong> {proto.activeSubstance}
                                  </div>
                                )}
                                <div>
                                  <strong className="text-muted-foreground">Dosage préconisé :</strong> {proto.dosage}
                                </div>
                                {proto.preHarvestIntervalDays !== undefined && (
                                  <div>
                                    <strong className="text-red-600">Délai Avant Récolte (DAR) :</strong> {proto.preHarvestIntervalDays} jours
                                  </div>
                                )}
                              </div>

                              {proto.safetyWarnings && (
                                <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg">
                                  <strong>Consignes de sécurité :</strong> {proto.safetyWarnings}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* TAB 4 : VALIDATION EXPERT & TRAÇABILITÉ */}
                  <TabsContent value="validation" className="space-y-4 pt-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                        Historique des validations par les pairs agronomes
                      </h4>
                      {isExpert && (
                        <Button
                          size="sm"
                          onClick={() => setIsValidationModalOpen(true)}
                          className="text-xs gap-1.5 h-8 bg-emerald-700 hover:bg-emerald-600 text-white"
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Ajouter une validation
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {activeCaseModal.validations && activeCaseModal.validations.length > 0 ? (
                        activeCaseModal.validations.map((val) => (
                          <div key={val.id} className="p-3.5 rounded-xl border bg-card text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground">{val.expertName}</span>
                              <Badge
                                variant={val.decision === "approved" ? "default" : "destructive"}
                                className="text-[10px] uppercase font-bold"
                              >
                                {val.decision === "approved" ? "Certifié Conforme" : val.decision}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground block">
                              {val.institution} • {new Date(val.validatedAt).toLocaleDateString("fr-FR")}
                            </span>
                            <p className="text-foreground/90 bg-muted/40 p-2.5 rounded-lg text-[11px]">
                              « {val.reviewNotes} »
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Aucune validation complémentaire enregistrée.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Bouton de pied de page pour lancer le diagnostic avec cette référence */}
              {onSelectCaseForDiagnosis && (
                <div className="p-4 border-t bg-muted/20 flex justify-end">
                  <Button
                    onClick={() => {
                      onSelectCaseForDiagnosis(activeCaseModal);
                      setActiveCaseModal(null);
                    }}
                    className="gap-2 text-xs font-bold bg-primary text-primary-foreground"
                  >
                    <Activity className="h-4 w-4" />
                    Utiliser comme référence pour le diagnostic
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL D'AJOUT DE VALIDATION EXPERT ─── */}
      <Dialog open={isValidationModalOpen} onOpenChange={setIsValidationModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              Validation Agronomique Officielle
            </DialogTitle>
            <DialogDescription className="text-xs">
              Attestation par les pairs agronomes conformément aux directives de la DPV et de l'INERA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-bold">Décision d'expertise</Label>
              <Select value={validationDecision} onValueChange={(v: any) => setValidationDecision(v)}>
                <SelectTrigger className="text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approuvé & Certifié au champ</SelectItem>
                  <SelectItem value="correction_requested">Demande de précisions</SelectItem>
                  <SelectItem value="rejected">Rejeté (Non conforme au Sahel)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Observations & Notes techniques *</Label>
              <Textarea
                placeholder="Précisez les observations au champ, les observations microscopiques ou la conformité aux homologations locales..."
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                rows={4}
                className="text-xs mt-1"
              />
            </div>

            <Button onClick={handleSaveValidation} className="w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white mt-2">
              Enregistrer la certification agronomique
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
