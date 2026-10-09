import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Compass,
  MapPin,
  Play,
  Square,
  Plus,
  Trash2,
  Droplets,
  Zap,
  Layers,
  FileDown,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Store,
  Activity,
} from "lucide-react";
import { GeoPoint, Field } from "@/types/fieldDesigner";
import { HydraulicPanel } from "@/components/irrigation/HydraulicPanel";
import {
  calculatePolygonAreaM2,
  calculatePerimeterM,
  calculateFieldDimensions,
} from "@/lib/fieldGpsSurvey";
import {
  IrrigationCropType,
  WaterSourceType,
  EnergySourceType,
  SystemTechniqueType,
  WCADI_CROP_STANDARDS,
  computeWcadiIrrigationProject,
  WcadiHydraulicProject,
  HydraulicMaterialItem,
} from "@/lib/nafaWcadiHydraulicEngine";
import { generateWcadiHydraulicPdf } from "@/lib/nafaWcadiHydraulicPdf";

interface WcadiIrrigationStudioProps {
  initialGpsPoints?: GeoPoint[];
  onSaveProject?: (project: WcadiHydraulicProject) => void;
}

export const WcadiIrrigationStudio: React.FC<WcadiIrrigationStudioProps> = ({
  initialGpsPoints,
  onSaveProject,
}) => {
  // 1. État de l'arpentage GPS
  const [gpsPoints, setGpsPoints] = useState<GeoPoint[]>(
    initialGpsPoints && initialGpsPoints.length >= 3
      ? initialGpsPoints
      : [
          { lat: 12.3501, lng: -1.5201 },
          { lat: 12.3502, lng: -1.5112 },
          { lat: 12.3425, lng: -1.5115 },
          { lat: 12.3424, lng: -1.5203 },
        ]
  );
  const [isRecordingGps, setIsRecordingGps] = useState(false);
  const [gpsAccuracyM, setGpsAccuracyM] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // 2. Paramètres de culture et d'infrastructure
  const [projectName, setProjectName] = useState("Aménagement Hydraulique Parcelle Nord");
  const [clientName, setClientName] = useState("Exploitant Partenaire");
  const [cropKey, setCropKey] = useState<IrrigationCropType>("tomate");
  const [systemType, setSystemType] = useState<SystemTechniqueType>("goutte_a_goutte");
  const [waterSource, setWaterSource] = useState<WaterSourceType>("forage");
  const [energySource, setEnergySource] = useState<EnergySourceType>("solaire_fil_du_soleil");
  const [sourceFlowM3h, setSourceFlowM3h] = useState<number>(8.0);
  const [dynamicWaterDepthM, setDynamicWaterDepthM] = useState<number>(35);
  const [waterTowerHeightM, setWaterTowerHeightM] = useState<number>(4);

  // 3. Projet calculé en direct
  const [project, setProject] = useState<WcadiHydraulicProject | null>(null);

  // Calcul du projet dès modification des paramètres
  useEffect(() => {
    const proj = computeWcadiIrrigationProject({
      projectName,
      points: gpsPoints,
      cropKey,
      waterSource,
      energySource,
      sourceFlowM3h,
      dynamicWaterDepthM,
      waterTowerHeightM,
      systemType,
    });
    setProject(proj);
  }, [
    gpsPoints,
    cropKey,
    systemType,
    waterSource,
    energySource,
    sourceFlowM3h,
    dynamicWaterDepthM,
    waterTowerHeightM,
    projectName,
  ]);

  // Arpentage GPS en direct
  const startGpsWalk = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation indisponible sur ce navigateur.");
      return;
    }
    setIsRecordingGps(true);
    setGpsPoints([]);
    toast.success("Arpentage démarré : marchez le long des bordures de votre champ.");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsAccuracyM(Math.round(accuracy));

        const pt: GeoPoint = { lat: latitude, lng: longitude };
        setGpsPoints((prev) => {
          // Évite d'ajouter deux points trop proches (< 2m)
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const dist = Math.hypot(last.lat - pt.lat, last.lng - pt.lng) * 111000;
            if (dist < 2.5) return prev;
          }
          return [...prev, pt];
        });
      },
      (err) => {
        toast.error("Erreur GPS : " + err.message);
        stopGpsWalk();
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  };

  const stopGpsWalk = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsRecordingGps(false);
    toast.info(`Arpentage terminé avec ${gpsPoints.length} balises GPS enregistrées.`);
  };

  // Ajout manuel d'un point
  const handleAddManualPoint = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsPoints((prev) => [...prev, { lat: pos.coords.latitude, lng: pos.coords.longitude }]);
          toast.success("Balise GPS enregistrée à votre position actuelle.");
        },
        () => toast.error("Impossible de récupérer la coordonnée GPS.")
      );
    }
  };

  // Export PDF
  const handleExportPdf = () => {
    if (!project) return;
    const pdf = generateWcadiHydraulicPdf(project, clientName);
    pdf.save(`NAFA_HYDRAULIQUE_${project.cropParams.cropKey}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Dossier technique d'irrigation NAFA Hydraulics téléchargé avec succès.");
  };

  // Sauvegarde
  const handleSave = () => {
    if (!project) return;
    if (onSaveProject) onSaveProject(project);
    toast.success("Projet hydraulique enregistré dans votre espace exploitation !");
  };

  // Métriques du terrain
  const areaM2 = Math.round(calculatePolygonAreaM2(gpsPoints));
  const areaHa = Math.round((areaM2 / 10000) * 100) / 100;
  const perimeterM = Math.round(calculatePerimeterM(gpsPoints));

  return (
    <div className="space-y-6">
      {/* Bandeau d'en-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-heading font-extrabold flex items-center gap-2 text-foreground">
              <Droplets className="h-6 w-6 text-primary" />
              Dimensionnement Hydraulique & Réseau (NAFA Hydraulics)
            </h2>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              Ingénierie NAFA Hydraulics • Normes agronomiques certifiées
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Arpentez le champ, calculez les tuyaux PEHD exacts, les débits de secteur, la puissance solaire et chiffrez les matériels en FCFA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1.5 font-bold">
            <FileDown className="h-4 w-4" />
            Exporter PDF Officiel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5 font-bold gradient-primary text-primary-foreground">
            <Save className="h-4 w-4" />
            Enregistrer le Projet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Arpentage GPS & Paramétrage */}
        <div className="lg:col-span-5 space-y-4">
          {/* Module 1 : Arpentage GPS de terrain */}
          <Card className="border-primary/20 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Compass className="h-4 w-4 text-primary" />
                  1. Arpentage des Bordures (GPS)
                </CardTitle>
                {gpsAccuracyM !== null && (
                  <Badge variant="outline" className="text-[10px]">
                    Précision: ±{gpsAccuracyM}m
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Marchez le long des limites de votre parcelle pour mesurer la surface exacte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Résumé de l'arpentage */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 border text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Superficie</p>
                  <p className="text-sm font-extrabold text-foreground">{areaHa} ha</p>
                  <p className="text-[10px] text-muted-foreground">{areaM2.toLocaleString()} m²</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Périmètre</p>
                  <p className="text-sm font-extrabold text-foreground">{perimeterM} m</p>
                  <p className="text-[10px] text-muted-foreground">clôture</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Balises GPS</p>
                  <p className="text-sm font-extrabold text-foreground">{gpsPoints.length}</p>
                  <p className="text-[10px] text-muted-foreground">points</p>
                </div>
              </div>

              {/* Boutons d'action GPS */}
              <div className="flex items-center gap-2">
                <Button
                  variant={isRecordingGps ? "destructive" : "default"}
                  size="sm"
                  onClick={isRecordingGps ? stopGpsWalk : startGpsWalk}
                  className="flex-1 gap-1.5 font-bold"
                >
                  {isRecordingGps ? (
                    <>
                      <Square className="h-4 w-4" /> Stopper la mesure
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" /> Lancer l'arpentage GPS
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleAddManualPoint} className="gap-1 text-xs">
                  <MapPin className="h-3.5 w-3.5" /> Balise
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGpsPoints([])}
                  className="h-8 px-2 text-destructive"
                  title="Effacer les balises"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Module 2 : Paramètres de Conception */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                2. Culture, Eau & Énergie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Culture à irriguer</Label>
                  <Select value={cropKey} onValueChange={(v) => setCropKey(v as IrrigationCropType)}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tomate">Tomate maraîchère</SelectItem>
                      <SelectItem value="oignon">Oignon du Sahel</SelectItem>
                      <SelectItem value="piment">Piment / Poivron</SelectItem>
                      <SelectItem value="mais">Maïs doux / grain</SelectItem>
                      <SelectItem value="mangue">Verger Manguiers</SelectItem>
                      <SelectItem value="agrumes">Verger Agrumes</SelectItem>
                      <SelectItem value="papaye">Papayer Solo</SelectItem>
                      <SelectItem value="choux">Chou pommé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Technique d'irrigation</Label>
                  <Select value={systemType} onValueChange={(v) => setSystemType(v as SystemTechniqueType)}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goutte_a_goutte">Goutte-à-goutte (Drip)</SelectItem>
                      <SelectItem value="aspersion">Aspersion classique</SelectItem>
                      <SelectItem value="micro_aspersion">Micro-aspersion verger</SelectItem>
                      <SelectItem value="californien">Réseau californien</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Ressource en eau</Label>
                  <Select value={waterSource} onValueChange={(v) => setWaterSource(v as WaterSourceType)}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forage">Forage profond</SelectItem>
                      <SelectItem value="puits_grand_diametre">Puits maraîcher</SelectItem>
                      <SelectItem value="bassin_barrage">Bassin ou retenue</SelectItem>
                      <SelectItem value="fleuve_cours_eau">Cours d'eau / Fleuve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Énergie de pompage</Label>
                  <Select value={energySource} onValueChange={(v) => setEnergySource(v as EnergySourceType)}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solaire_fil_du_soleil">Solaire (Fil du soleil)</SelectItem>
                      <SelectItem value="solaire_hybride_batterie">Solaire hybride</SelectItem>
                      <SelectItem value="reseau_sonabel">Réseau électrique</SelectItem>
                      <SelectItem value="groupe_electrogene">Groupe électrogène</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground font-semibold">Débit source (m³/h)</Label>
                  <Input
                    type="number"
                    value={sourceFlowM3h}
                    onChange={(e) => setSourceFlowM3h(Number(e.target.value) || 1)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground font-semibold">Prof. eau (m)</Label>
                  <Input
                    type="number"
                    value={dynamicWaterDepthM}
                    onChange={(e) => setDynamicWaterDepthM(Number(e.target.value) || 0)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground font-semibold">Château d'eau (m)</Label>
                  <Input
                    type="number"
                    value={waterTowerHeightM}
                    onChange={(e) => setWaterTowerHeightM(Number(e.target.value) || 0)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne Droite : Résultats Hydrauliques, Tuyaux, Pompage & Chiffrage */}
        <div className="lg:col-span-7 space-y-4">
          {project && (
            <Tabs defaultValue="hydraulics" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="hydraulics" className="text-xs font-bold">
                  Synthèse Réseau
                </TabsTrigger>
                <TabsTrigger value="hazen_williams" className="text-xs font-bold gap-1">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Moteur Hazen-Williams
                </TabsTrigger>
                <TabsTrigger value="bom" className="text-xs font-bold">
                  Devis ({project.billOfMaterials.length})
                </TabsTrigger>
                <TabsTrigger value="canvas" className="text-xs font-bold">
                  Plan CAD
                </TabsTrigger>
              </TabsList>

              {/* Onglet 1 : Dimensionnement Hydraulique */}
              <TabsContent value="hydraulics" className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-card border rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Besoin journalier</p>
                    <p className="text-lg font-extrabold text-foreground">{project.hydraulicResults.dailyVolumeM3} m³</p>
                    <p className="text-[10px] text-muted-foreground">ETc : {project.cropParams.dailyEtcMm} mm/j</p>
                  </div>
                  <div className="p-3 bg-card border rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Secteurs (Shifts)</p>
                    <p className="text-lg font-extrabold text-foreground">{project.hydraulicResults.numSectors}</p>
                    <p className="text-[10px] text-muted-foreground">{project.hydraulicResults.sectorFlowM3h} m³/h/secteur</p>
                  </div>
                  <div className="p-3 bg-card border rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">HMT Totale</p>
                    <p className="text-lg font-extrabold text-foreground">{project.hydraulicResults.hmtMce} mCE</p>
                    <p className="text-[10px] text-muted-foreground">Pertes de charge incl.</p>
                  </div>
                  <div className="p-3 bg-card border rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Pompe Solaire</p>
                    <p className="text-lg font-extrabold text-primary">
                      {project.hydraulicResults.pumpPowerKw} kW
                    </p>
                    <p className="text-[10px] text-muted-foreground">({project.hydraulicResults.pumpPowerHp} CV)</p>
                  </div>
                </div>

                {/* Synthèse des Tuyaux & Longueurs */}
                <Card>
                  <CardHeader className="py-3 px-4 border-b">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Nomenclature des Canalisations & Gaines (Calcul Exact)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded bg-muted/30 border">
                        <span className="font-bold text-foreground">Conduite Maîtresse PEHD 100 PN10 :</span>
                        <p className="text-base font-extrabold text-primary mt-1">
                          {project.hydraulicResults.mainPipeBarsCount} barres de 6m
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Diamètre calculé : Ø{project.hydraulicResults.mainPipeDiameterMm} mm • Longueur totale : {project.hydraulicResults.mainPipeLengthM} m
                        </p>
                      </div>

                      <div className="p-2.5 rounded bg-muted/30 border">
                        <span className="font-bold text-foreground">Canalisation Secondaire PEHD PN6 :</span>
                        <p className="text-base font-extrabold text-primary mt-1">
                          {project.hydraulicResults.subPipeLengthM} mètres linéaires
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Diamètre distributeur : Ø{project.hydraulicResults.subPipeDiameterMm} mm avec vannes d'arrêt
                        </p>
                      </div>

                      <div className="p-2.5 rounded bg-muted/30 border">
                        <span className="font-bold text-foreground">Gaines Goutte-à-Goutte Ø16mm :</span>
                        <p className="text-base font-extrabold text-primary mt-1">
                          {project.hydraulicResults.totalDripRollsCount} bobines de 1000m
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {project.hydraulicResults.totalDripTapeLengthM.toLocaleString()} m de rampes • {project.hydraulicResults.totalEmittersCount.toLocaleString()} goutteurs
                        </p>
                      </div>

                      <div className="p-2.5 rounded bg-muted/30 border">
                        <span className="font-bold text-foreground">Indicateurs de Précision NAFA Hydraulics :</span>
                        <p className="text-base font-extrabold text-emerald-600 mt-1">
                          Uniformité {project.hydraulicResults.emissionUniformityPct}% (EU)
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Longueur max admissible rampe : {project.hydraulicResults.maxLateralRunLengthM} m (perte max 10%)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet 2 : Devis & Nomenclature Marketplace */}
              <TabsContent value="bom" className="space-y-4 pt-2">
                <Card>
                  <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Matériels Chiffrés avec les Fournisseurs Agréés
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Prix réels constatés au Burkina Faso (Agrodia, Faso Solaire, Tropic Agro)
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1 text-primary border-primary font-mono font-bold">
                      <Store className="h-3 w-3" />
                      {project.financialTotalFcfa.toLocaleString()} FCFA
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Désignation</TableHead>
                          <TableHead className="text-xs">Quantité</TableHead>
                          <TableHead className="text-xs">Prix Unit.</TableHead>
                          <TableHead className="text-xs">Total HT</TableHead>
                          <TableHead className="text-xs">Fournisseur</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {project.billOfMaterials.map((item) => (
                          <TableRow key={item.id} className="text-xs">
                            <TableCell className="font-medium">
                              {item.designation}
                              <p className="text-[10px] text-muted-foreground">{item.specifications}</p>
                            </TableCell>
                            <TableCell className="font-bold">
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell>{item.unitPriceFcfa.toLocaleString()} F</TableCell>
                            <TableCell className="font-bold text-foreground">
                              {item.totalPriceFcfa.toLocaleString()} F
                            </TableCell>
                            <TableCell className="text-[11px] text-muted-foreground">
                              {item.sourceSupplierName}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet 3 : Plan Réseau CAD 2D interactif */}
              <TabsContent value="canvas" className="space-y-4 pt-2">
                <Card className="p-4 bg-slate-950 text-white rounded-lg min-h-[340px] flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Schéma Unifilaire & Réseau Hydraulique
                    </span>
                    <span className="text-xs text-slate-400">
                      Échelle métrique 1:{Math.round(perimeterM / 4)}
                    </span>
                  </div>

                  {/* SVG simplifié représentant le tracé NAFA Hydraulics */}
                  <div className="h-[240px] w-full flex items-center justify-center p-4">
                    <svg viewBox="0 0 500 240" className="w-full h-full stroke-emerald-500 fill-none">
                      {/* Enceinte de la parcelle */}
                      <polygon
                        points="50,30 450,30 430,210 70,210"
                        className="stroke-emerald-400/80 stroke-2 fill-emerald-950/20"
                      />

                      {/* Station de pompage / Forage */}
                      <circle cx="60" cy="120" r="10" className="fill-blue-500 stroke-blue-200" />
                      <text x="50" y="145" className="fill-white text-[9px] font-mono">
                        FORAGE
                      </text>

                      {/* Conduite maîtresse PEHD */}
                      <line x1="70" y1="120" x2="420" y2="120" className="stroke-blue-400 stroke-[4]" />
                      <text x="220" y="112" className="fill-blue-300 text-[10px] font-bold">
                        PEHD Ø{project.hydraulicResults.mainPipeDiameterMm}mm PN10
                      </text>

                      {/* Rampes de goutte-à-goutte */}
                      {[60, 90, 150, 180].map((y, idx) => (
                        <g key={idx}>
                          <line x1="90" y1={y} x2="410" y2={y} className="stroke-emerald-400/60 stroke-1 stroke-dasharray-2" />
                          <circle cx="90" cy={y} r="3" className="fill-emerald-400" />
                          <circle cx="410" cy={y} r="3" className="fill-emerald-400" />
                        </g>
                      ))}

                      {/* Vannes de secteurs */}
                      <rect x="180" y="114" width="12" height="12" className="fill-amber-400 stroke-black stroke-1" />
                      <rect x="300" y="114" width="12" height="12" className="fill-amber-400 stroke-black stroke-1" />
                      <text x="170" y="140" className="fill-amber-300 text-[8px]">
                        VANNE S1
                      </text>
                      <text x="290" y="140" className="fill-amber-300 text-[8px]">
                        VANNE S2
                      </text>
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> Conduite maîtresse
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" /> Rampes goutte-à-goutte
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-amber-400 inline-block" /> Vannes de secteurs
                      </span>
                    </div>
                    <span>{project.hydraulicResults.numSectors} secteurs d'arrosage</span>
                  </div>
                </Card>
              </TabsContent>

              {/* Onglet 4 : Analyse & Moteur Hydraulique Déterministe Hazen-Williams */}
              <TabsContent value="hazen_williams" className="pt-2">
                <HydraulicPanel
                  field={{
                    id: "wcadi_survey_field",
                    farmId: "active_farm",
                    name: projectName || "Parcelle arpentée",
                    points: gpsPoints,
                    areaM2,
                    areaHa,
                    perimeterM,
                    status: "active",
                    syncStatus: "synced",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};
