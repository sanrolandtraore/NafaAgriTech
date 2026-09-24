import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getEffectiveUserId } from "@/lib/deviceIdentity";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Calculator,
  Wheat,
  Sprout,
  FlaskConical,
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  RotateCcw,
  Plus,
  Trash2,
  TreePine,
  CloudSun,
  Save,
  CheckCircle2,
  ClipboardList,
  CalendarDays,
  RefreshCw,
  FolderOpen,
  ShoppingCart,
  MapPin,
} from "lucide-react";
import ProductServiceCatalog from "@/components/marketplace/ProductServiceCatalog";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  CLIMATE_ZONES_BURKINA,
  FRUIT_TREE_PRESETS,
  calculateTreeDensity,
  calculateOrchardPlan,
  PlantingPattern,
} from "@/lib/agronomicEngine";
import { WEST_AFRICA_12_CROPS } from "@/lib/cropLibraryData";

const fallbackCrops = WEST_AFRICA_12_CROPS.map(c => ({
  id: c.id,
  name: c.name_fr.split(" (")[0],
  variety: c.recommended_varieties?.[0] || "Standard",
  type: c.category === "Céréales" ? "annual" : "perennial",
  avg_yield_per_ha: (c.yield_potential_t_ha || 3) * 1000,
  avg_price_per_kg: 200,
  growth_duration_days: c.cycle_days_max || 120,
  spacing_m: 0.8,
  plants_per_ha: 50000,
  input_requirements: {
    "NPK (15-15-15)": { qty_per_ha: (c.npk_needs?.N || 100) * 2, unit: "kg" },
    "Urée 46%": { qty_per_ha: 100, unit: "kg" },
    "Fumure organique": { qty_per_ha: 2000, unit: "kg" },
  }
}));

// Prix de référence réalistes au Burkina Faso (FCFA)
const getInputDefaultPrice = (name: string): number => {
  const n = name.toLowerCase();
  if (n.includes("npk")) return 450; // 22 500 F / sac de 50 kg
  if (n.includes("urée") || n.includes("uree")) return 420; // 21 000 F / sac de 50 kg
  if (n.includes("fumure") || n.includes("compost")) return 30; // 30 000 F / tonne
  if (n.includes("semence")) return 1500; // 1 500 F / kg
  if (n.includes("phyto") || n.includes("traitement") || n.includes("insecticide")) return 5000;
  if (n.includes("plant") || n.includes("arbre")) return 1500;
  return 500;
};

// Coefficients de main-d'œuvre par hectare (estimations indicatives modifiables)
const labourCoefficients: Record<string, { labour_per_ha: number; daily_rate: number; phases: { name: string; days_per_ha: number }[] }> = {
  "Maïs": {
    labour_per_ha: 85, daily_rate: 2000,
    phases: [
      { name: "Défrichage/Labour", days_per_ha: 15 },
      { name: "Semis", days_per_ha: 8 },
      { name: "Sarclage (×2)", days_per_ha: 20 },
      { name: "Épandage engrais (×2)", days_per_ha: 8 },
      { name: "Traitement phyto", days_per_ha: 4 },
      { name: "Récolte", days_per_ha: 20 },
      { name: "Battage/Séchage", days_per_ha: 10 },
    ],
  },
  "Sorgho": {
    labour_per_ha: 75, daily_rate: 2000,
    phases: [
      { name: "Défrichage/Labour", days_per_ha: 15 },
      { name: "Semis", days_per_ha: 6 },
      { name: "Sarclage (×2)", days_per_ha: 18 },
      { name: "Épandage engrais", days_per_ha: 6 },
      { name: "Récolte", days_per_ha: 18 },
      { name: "Battage/Séchage", days_per_ha: 12 },
    ],
  },
  "Riz": {
    labour_per_ha: 120, daily_rate: 2500,
    phases: [
      { name: "Préparation pépinière", days_per_ha: 10 },
      { name: "Labour/Planage", days_per_ha: 20 },
      { name: "Repiquage", days_per_ha: 25 },
      { name: "Désherbage (×2)", days_per_ha: 20 },
      { name: "Épandage engrais (×3)", days_per_ha: 12 },
      { name: "Traitement phyto", days_per_ha: 5 },
      { name: "Récolte", days_per_ha: 18 },
      { name: "Battage/Vannage", days_per_ha: 10 },
    ],
  },
  "Coton": {
    labour_per_ha: 110, daily_rate: 2000,
    phases: [
      { name: "Labour", days_per_ha: 15 },
      { name: "Semis", days_per_ha: 8 },
      { name: "Sarclage (×3)", days_per_ha: 25 },
      { name: "Épandage engrais (×2)", days_per_ha: 10 },
      { name: "Traitement phyto (×6)", days_per_ha: 18 },
      { name: "Récolte (×3)", days_per_ha: 30 },
      { name: "Conditionnement", days_per_ha: 4 },
    ],
  },
};

const defaultLabour = {
  labour_per_ha: 70, daily_rate: 2000,
  phases: [
    { name: "Défrichage/Labour", days_per_ha: 15 },
    { name: "Semis / Trouaison", days_per_ha: 10 },
    { name: "Sarclage (×2)", days_per_ha: 16 },
    { name: "Épandage fertilisants", days_per_ha: 6 },
    { name: "Traitement / Entretien", days_per_ha: 5 },
    { name: "Récolte", days_per_ha: 15 },
    { name: "Post-récolte", days_per_ha: 5 },
  ],
};

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");
const numv = (v: string | number) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export type InputRow = { name: string; totalQty: number; unit: string; unitPrice: number };
export type PhaseRow = { name: string; totalDays: number; workers: number; dailyRate: number };

export interface SavedCropPlan {
  id: string;
  createdAt: string;
  seasonName: string;
  cropId: string;
  cropName: string;
  variety?: string;
  areaHa: number;
  parcelName?: string;
  climateZoneName: string;
  climateCoeff: number;
  expectedYieldKg: number;
  expectedRevenue: number;
  totalBudget: number;
  profit: number;
  roi: number;
  breakEvenKg: number;
  plantCount: number;
  inputRows: InputRow[];
  phaseRows: PhaseRow[];
  yieldOverride?: string;
  priceOverride?: string;
  notes?: string;
}

const defaultInitialPlans: SavedCropPlan[] = [
  {
    id: "plan-modele-mais-1ha",
    createdAt: new Date().toISOString(),
    seasonName: "Modèle de référence — Maïs (1 ha)",
    cropId: fallbackCrops[0]?.id || "sheet-mais",
    cropName: "Maïs",
    variety: "Barkas",
    areaHa: 1,
    parcelName: "Mode direct (1 ha)",
    climateZoneName: "Soudano-Sahélien",
    climateCoeff: 1.0,
    expectedYieldKg: 4500,
    expectedRevenue: 900000,
    totalBudget: 285000,
    profit: 615000,
    roi: 216,
    breakEvenKg: 1425,
    plantCount: 50000,
    inputRows: [
      { name: "NPK (15-15-15)", totalQty: 200, unit: "kg", unitPrice: 450 },
      { name: "Urée 46%", totalQty: 100, unit: "kg", unitPrice: 420 },
      { name: "Fumure organique", totalQty: 2000, unit: "kg", unitPrice: 30 },
      { name: "Semences certifiées (Barkas)", totalQty: 20, unit: "kg", unitPrice: 1500 },
    ],
    phaseRows: [
      { name: "Défrichage/Labour", totalDays: 15, workers: 1, dailyRate: 2000 },
      { name: "Semis", totalDays: 8, workers: 1, dailyRate: 2000 },
      { name: "Sarclage (×2)", totalDays: 20, workers: 1, dailyRate: 2000 },
      { name: "Épandage engrais", totalDays: 8, workers: 1, dailyRate: 2000 },
      { name: "Récolte & Post-récolte", totalDays: 25, workers: 1, dailyRate: 2000 },
    ],
    yieldOverride: "",
    priceOverride: "",
  }
];

const CropPlanningPage = () => {
  const { user } = useAuth();
  const [parcels, setParcels] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>(fallbackCrops);
  const [climateZones, setClimateZones] = useState<any[]>(CLIMATE_ZONES_BURKINA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"simulateur" | "mes-campagnes" | "catalogue">("simulateur");

  // Selection state
  const [selectedParcel, setSelectedParcel] = useState("");
  const [selectedCrop, setSelectedCrop] = useState(fallbackCrops[0]?.id || "");
  const [manualArea, setManualArea] = useState("1");
  const [selectedClimateZoneId, setSelectedClimateZoneId] = useState("soudano_sahelien");

  // Saved plans state
  const storageKey = `nafa_saved_crop_plans_${getEffectiveUserId(user?.id)}`;
  const [savedPlans, setSavedPlans] = useState<SavedCropPlan[]>([]);

  // Mode Verger / Arboriculture
  const [orchardPresetId, setOrchardPresetId] = useState<string>("manguier_greffe");
  const [orchardPattern, setOrchardPattern] = useState<PlantingPattern>("carre");
  const [rowSpacingM, setRowSpacingM] = useState<number>(10);
  const [plantSpacingM, setPlantSpacingM] = useState<number>(10);
  const [manurePerHoleKg, setManurePerHoleKg] = useState<number>(20);
  const [npkPerHoleG, setNpkPerHoleG] = useState<number>(250);

  // Editable rows
  const [inputRows, setInputRows] = useState<InputRow[]>([]);
  const [phaseRows, setPhaseRows] = useState<PhaseRow[]>([]);
  const [yieldOverride, setYieldOverride] = useState<string>("");
  const [priceOverride, setPriceOverride] = useState<string>("");

  // Charge saved plans from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedPlans(parsed);
        } else {
          setSavedPlans(defaultInitialPlans);
          localStorage.setItem(storageKey, JSON.stringify(defaultInitialPlans));
        }
      } else {
        setSavedPlans(defaultInitialPlans);
        localStorage.setItem(storageKey, JSON.stringify(defaultInitialPlans));
      }
    } catch {
      setSavedPlans(defaultInitialPlans);
    }
  }, [storageKey]);

  // Load backend references
  useEffect(() => {
    Promise.all([
      supabase.from("parcels").select("id, name, area_ha, calculated_area_ha, soil_type, irrigation_type, farms(id, name, climate_zone_id, climate_zones(id, name, climate_coefficient))"),
      supabase.from("crop_references").select("*"),
      supabase.from("climate_zones").select("*"),
    ]).then(([pRes, cRes, czRes]) => {
      setParcels(pRes.data || []);
      const loadedCrops = (cRes.data && cRes.data.length > 0) ? cRes.data : fallbackCrops;
      setCrops(loadedCrops);

      // Assurer que la culture sélectionnée existe bien dans la liste chargée
      setSelectedCrop(prev => {
        const found = loadedCrops.some(c => c.id === prev);
        return found ? prev : loadedCrops[0]?.id || fallbackCrops[0].id;
      });

      if (czRes.data && czRes.data.length > 0) {
        setClimateZones(czRes.data);
      }
      setLoading(false);
    }).catch(() => {
      setCrops(fallbackCrops);
      setLoading(false);
    });
  }, []);

  const parcel = parcels.find(p => p.id === selectedParcel);
  // Résolution sécurisée : ne peut jamais être undefined
  const crop = crops.find(c => c.id === selectedCrop) || crops[0] || fallbackCrops[0];
  const area = manualArea ? (parseFloat(manualArea) > 0 ? parseFloat(manualArea) : 1) : (parcel?.calculated_area_ha || parcel?.area_ha || 1);

  // Synchronisation automatique de la zone climatique dès qu'une parcelle est choisie
  useEffect(() => {
    if (parcel?.farms?.climate_zones?.id) {
      setSelectedClimateZoneId(parcel.farms.climate_zones.id);
    } else if (parcel?.farms?.climate_zone_id) {
      setSelectedClimateZoneId(parcel.farms.climate_zone_id);
    }
  }, [selectedParcel, parcel]);

  const activeClimateZone = useMemo(() => {
    const found = climateZones.find(cz => cz.id === selectedClimateZoneId || cz.name?.toLowerCase().includes(selectedClimateZoneId.toLowerCase()));
    if (found) return found;
    return CLIMATE_ZONES_BURKINA.find(cz => cz.id === selectedClimateZoneId) || CLIMATE_ZONES_BURKINA[1];
  }, [climateZones, selectedClimateZoneId]);

  const climateCoeff = activeClimateZone?.climate_coefficient || 1.0;

  // Détection culture pérenne ou verger
  const isPerennial = crop?.type === "perennial" || crop?.name?.toLowerCase().includes("mangu") || crop?.name?.toLowerCase().includes("anacard");

  // Calcul du verger
  const orchardPlan = useMemo(() => {
    return calculateOrchardPlan({
      areaHa: area,
      rowSpacingM,
      plantSpacingM,
      pattern: orchardPattern,
      manurePerHoleKg,
      npkPerHoleG,
      avgYieldPerTreeKg: 70,
      pricePerKg: crop?.avg_price_per_kg || 200,
      climateCoefficient: climateCoeff,
    });
  }, [area, rowSpacingM, plantSpacingM, orchardPattern, manurePerHoleKg, npkPerHoleG, crop, climateCoeff]);

  // Suggestions dérivées de la culture et de la surface avec prix par défaut burkinabè
  const suggestedInputs: InputRow[] = useMemo(() => {
    if (!crop) return [];
    let reqs = crop.input_requirements;
    if (!reqs || Object.keys(reqs).length === 0) {
      reqs = {
        "NPK (15-15-15)": { qty_per_ha: 200, unit: "kg" },
        "Urée 46%": { qty_per_ha: 100, unit: "kg" },
        "Fumure organique": { qty_per_ha: 2000, unit: "kg" },
        "Semences certifiées": { qty_per_ha: 20, unit: "kg" },
      };
    }
    return Object.entries(reqs).map(([name, v]: [string, any]) => {
      const qtyPerHa = v.qty_per_ha || v.quantity_per_ha || 0;
      return {
        name,
        totalQty: Math.round(qtyPerHa * area * 100) / 100,
        unit: v.unit || "kg",
        unitPrice: getInputDefaultPrice(name),
      };
    });
  }, [crop, area]);

  const suggestedPhases: PhaseRow[] = useMemo(() => {
    const labourData = crop ? (labourCoefficients[crop.name] || defaultLabour) : defaultLabour;
    return labourData.phases.map(p => ({
      name: p.name,
      totalDays: Math.round(p.days_per_ha * area * 10) / 10,
      workers: 1,
      dailyRate: labourData.daily_rate || 2000,
    }));
  }, [crop, area]);

  const resetToSuggestions = () => {
    setInputRows(suggestedInputs);
    setPhaseRows(suggestedPhases);
    setYieldOverride("");
    setPriceOverride("");
    toast.success("Valeurs par défaut restaurées");
  };

  // Chargement automatique lors du changement de culture ou superficie
  useEffect(() => {
    if (crop && area > 0) {
      setInputRows(suggestedInputs);
      setPhaseRows(suggestedPhases);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCrop, area]);

  // Calculs sur les lignes modifiables
  const totalInputCost = inputRows.reduce((s, i) => s + i.totalQty * i.unitPrice, 0);
  const totalLabourDays = phaseRows.reduce((s, p) => s + p.totalDays * p.workers, 0);
  const totalLabourCost = phaseRows.reduce((s, p) => s + p.totalDays * p.workers * p.dailyRate, 0);

  // Rendement et Chiffre d'affaires estimé
  const baseYieldPerHa = crop?.avg_yield_per_ha && crop.avg_yield_per_ha > 0 ? crop.avg_yield_per_ha : 3000;
  const effYieldPerHa = yieldOverride ? numv(yieldOverride) : Math.round(baseYieldPerHa * climateCoeff);
  const effPricePerKg = priceOverride ? numv(priceOverride) : (crop?.avg_price_per_kg && crop.avg_price_per_kg > 0 ? crop.avg_price_per_kg : 200);
  const expectedYield = Math.round(effYieldPerHa * area);
  const expectedRevenue = Math.round(expectedYield * effPricePerKg);
  const plantCount = isPerennial && orchardPlan.totalTrees > 0
    ? orchardPlan.totalTrees
    : (crop?.plants_per_ha ? Math.round(crop.plants_per_ha * area) : Math.round(50000 * area));

  const totalBudget = totalInputCost + totalLabourCost;
  const profit = expectedRevenue - totalBudget;
  const roi = totalBudget > 0 ? Math.round(((expectedRevenue - totalBudget) / totalBudget) * 100) : 0;
  const breakEvenKg = effPricePerKg ? Math.round(totalBudget / effPricePerKg) : 0;

  const hasResult = area > 0 && !!crop;

  // Fonctions d'édition
  const updateInput = (i: number, patch: Partial<InputRow>) =>
    setInputRows(rows => rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const addInput = () =>
    setInputRows(rows => [...rows, { name: "Nouvel intrant", totalQty: 0, unit: "kg", unitPrice: 500 }]);
  const removeInput = (i: number) =>
    setInputRows(rows => rows.filter((_, idx) => idx !== i));

  const updatePhase = (i: number, patch: Partial<PhaseRow>) =>
    setPhaseRows(rows => rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const addPhase = () =>
    setPhaseRows(rows => [...rows, { name: "Nouvelle phase", totalDays: 0, workers: 1, dailyRate: 2000 }]);
  const removePhase = (i: number) =>
    setPhaseRows(rows => rows.filter((_, idx) => idx !== i));

  // Injection verger
  const applyOrchardToInputs = () => {
    if (orchardPlan.totalTrees <= 0) return;
    const newInputs: InputRow[] = [
      { name: `Plants greffés (${crop?.name || "Arbres"})`, totalQty: orchardPlan.totalTrees, unit: "plants", unitPrice: 1500 },
      { name: "Fumure organique de fond (compost)", totalQty: orchardPlan.totalManureKg, unit: "kg", unitPrice: 30 },
      { name: "Engrais NPK de fond (trouaison)", totalQty: orchardPlan.totalNpkKg, unit: "kg", unitPrice: 500 },
    ];
    setInputRows(prev => [...prev.filter(r => !r.name.includes("Plants") && !r.name.includes("Fumure")), ...newInputs]);
    toast.success(`Ajouté : ${orchardPlan.totalTrees} plants et fertilisation pour verger !`);
  };

  // Enregistrement résilient (Local + Supabase synchrone)
  const savePlanToDatabase = async () => {
    if (!crop?.id) {
      toast.error("Veuillez sélectionner une culture.");
      return;
    }
    setSaving(true);
    try {
      const currentYear = new Date().getFullYear();
      const seasonName = `Campagne ${currentYear} — ${crop.name} (${area} ha)`;

      const newPlan: SavedCropPlan = {
        id: "plan-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
        seasonName,
        cropId: crop.id,
        cropName: crop.name,
        variety: crop.variety,
        areaHa: area,
        parcelName: parcel?.name || `Superficie directe (${area} ha)`,
        climateZoneName: activeClimateZone?.name || "Zone nationale",
        climateCoeff,
        expectedYieldKg: expectedYield,
        expectedRevenue,
        totalBudget,
        profit,
        roi,
        breakEvenKg,
        plantCount,
        inputRows: [...inputRows],
        phaseRows: [...phaseRows],
        yieldOverride,
        priceOverride,
        notes: `Zone: ${activeClimateZone?.name} (Coeff ${climateCoeff}). Superficie: ${area} ha.`,
      };

      // 1. Sauvegarde locale garantie immédiate
      const updated = [newPlan, ...savedPlans.filter(p => p.id !== newPlan.id)];
      setSavedPlans(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));

      // 2. Synchronisation Supabase en tâche de fond (best-effort)
      if (user) {
        try {
          let targetParcelId = parcel?.id;
          if (!targetParcelId) {
            const { data: existingFarm } = await supabase
              .from("farms")
              .select("id")
              .eq("user_id", user.id)
              .limit(1)
              .maybeSingle();

            let farmId = existingFarm?.id;
            if (!farmId) {
              const { data: newFarm } = await supabase
                .from("farms")
                .insert({ user_id: user.id, name: "Mon Exploitation" })
                .select("id")
                .single();
              farmId = newFarm?.id;
            }

            if (farmId) {
              const { data: newParcel } = await supabase
                .from("parcels")
                .insert({
                  farm_id: farmId,
                  name: `Parcelle ${crop.name} (${area} ha)`,
                  area_ha: area,
                })
                .select("id")
                .single();
              targetParcelId = newParcel?.id;
            }
          }

          if (targetParcelId) {
            const { data: cycleData } = await supabase
              .from("crop_cycles")
              .insert({
                parcel_id: targetParcelId,
                crop_reference_id: crop.id.length > 20 ? crop.id : null,
                season: seasonName,
                start_date: new Date().toISOString().split("T")[0],
                expected_yield_kg: expectedYield,
                expected_revenue: expectedRevenue,
                status: "planning",
                notes: newPlan.notes,
              })
              .select()
              .single();

            if (cycleData?.id) {
              await supabase.from("investment_plans").insert({
                crop_cycle_id: cycleData.id,
                total_input_cost: totalInputCost,
                total_labor_cost: totalLabourCost,
                total_equipment_cost: 0,
                total_transport_cost: 0,
                total_investment: totalBudget,
                expected_revenue: expectedRevenue,
                expected_roi_percent: roi,
                break_even_yield_kg: breakEvenKg,
              });

              if (inputRows.length > 0) {
                const inputInserts = inputRows.map(i => ({
                  crop_cycle_id: cycleData.id,
                  input_name: i.name,
                  quantity_per_ha: area > 0 ? Math.round((i.totalQty / area) * 100) / 100 : i.totalQty,
                  total_quantity: i.totalQty,
                  unit: i.unit,
                  unit_price: i.unitPrice,
                  total_cost: Math.round(i.totalQty * i.unitPrice),
                }));
                await supabase.from("crop_cycle_inputs").insert(inputInserts);
              }
            }
          }
        } catch (syncErr) {
          console.warn("Synchronisation distante (non-bloquante) :", syncErr);
        }
      }

      toast.success(`Campagne « ${seasonName} » enregistrée dans « Mes Campagnes Planifiées » !`);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  // Recharger une campagne sauvegardée dans le simulateur
  const handleReloadPlan = (plan: SavedCropPlan) => {
    setSelectedCrop(plan.cropId);
    setManualArea(plan.areaHa.toString());
    setInputRows(plan.inputRows || []);
    setPhaseRows(plan.phaseRows || []);
    setYieldOverride(plan.yieldOverride || "");
    setPriceOverride(plan.priceOverride || "");
    setActiveTab("simulateur");
    toast.success(`Campagne « ${plan.seasonName} » rechargée dans le simulateur !`);
  };

  // Supprimer une campagne sauvegardée
  const handleDeletePlan = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Voulez-vous supprimer cette planification ?")) return;
    const next = savedPlans.filter(p => p.id !== id);
    setSavedPlans(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    toast.success("Campagne supprimée.");
  };

  // Générateur PDF universel (pour la simulation courante ou un plan sauvegardé)
  const exportPDFFromData = (p: {
    seasonName: string;
    cropName: string;
    variety?: string;
    parcelName?: string;
    areaHa: number;
    climateZoneName?: string;
    climateCoeff?: number;
    expectedYieldKg: number;
    expectedRevenue: number;
    totalBudget: number;
    profit: number;
    roi: number;
    breakEvenKg: number;
    plantCount?: number;
    inputRows: InputRow[];
    phaseRows: PhaseRow[];
    totalInputCost: number;
    totalLabourCost: number;
  }) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`NAFA - AGRITECH — Plan de production & Rentabilité`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Titre : ${p.seasonName} | Parcelle: ${p.parcelName || "Direct"} | Superficie: ${p.areaHa} ha`, 14, 26);
    doc.text(`Culture: ${p.cropName}${p.variety ? ` (${p.variety})` : ""} | Zone: ${p.climateZoneName || "Burkina Faso"} (Coeff ${p.climateCoeff || 1.0}×) | Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 32);

    doc.setFontSize(11);
    doc.text(`Rendement estimé: ${fmt(p.expectedYieldKg)} kg`, 14, 42);
    doc.text(`Revenu estimé: ${fmt(p.expectedRevenue)} FCFA`, 14, 48);
    doc.text(`Budget nécessaire: ${fmt(p.totalBudget)} FCFA`, 14, 54);
    doc.text(`Profit potentiel: ${fmt(p.profit)} FCFA (ROI: ${p.roi}%)`, 14, 60);
    doc.text(`Seuil de rentabilité: ${fmt(p.breakEvenKg)} kg`, 14, 66);
    if (p.plantCount && p.plantCount > 0) doc.text(`Nombre de plants / arbres: ${fmt(p.plantCount)}`, 14, 72);

    autoTable(doc, {
      startY: 78,
      head: [["Intrant", "Quantité", "Unité", "Prix unit.", "Coût total (FCFA)"]],
      body: p.inputRows.map(i => [i.name, i.totalQty, i.unit, fmt(i.unitPrice), fmt(i.totalQty * i.unitPrice)]),
      foot: [["", "", "", "TOTAL INTRANTS", fmt(p.totalInputCost)]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 120, 74] },
    });

    const y1 = (doc as any).lastAutoTable?.finalY || 140;
    autoTable(doc, {
      startY: y1 + 8,
      head: [["Phase de travail", "Jours", "Ouvriers", "Taux/jour", "Coût (FCFA)"]],
      body: p.phaseRows.map(ph => [ph.name, ph.totalDays, ph.workers, fmt(ph.dailyRate), fmt(ph.totalDays * ph.workers * ph.dailyRate)]),
      foot: [["", "", "", "TOTAL MAIN D'ŒUVRE", fmt(p.totalLabourCost)]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 120, 74] },
    });

    doc.save(`plan_production_${p.cropName}_${p.areaHa}ha.pdf`);
    toast.success("Fichier PDF exporté avec succès !");
  };

  const exportCurrentPDF = () => {
    if (!hasResult) return;
    exportPDFFromData({
      seasonName: `Campagne ${new Date().getFullYear()} (${crop.name})`,
      cropName: crop.name,
      variety: crop.variety,
      parcelName: parcel?.name || "Mode direct (superficie manuelle)",
      areaHa: area,
      climateZoneName: activeClimateZone?.name,
      climateCoeff,
      expectedYieldKg: expectedYield,
      expectedRevenue,
      totalBudget,
      profit,
      roi,
      breakEvenKg,
      plantCount,
      inputRows,
      phaseRows,
      totalInputCost,
      totalLabourCost,
    });
  };

  if (loading) return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* En-tête de page & sélecteur de mode direct (sans tabs imbriqués) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-border/80 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Sprout className="h-4 w-4" /> Espace Producteur Agricole
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold flex items-center gap-3 text-foreground tracking-tight">
            <Calculator className="h-9 w-9 text-primary" />
            Planification & Calcul Agronomique
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl font-medium">
            Simulateur de rentabilité, rendements climatiques burkinabè, itinéraire cultural et suivi de vos campagnes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <div className="grid grid-cols-3 sm:inline-flex p-1.5 rounded-2xl bg-muted/80 border border-border shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("simulateur")}
              className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                activeTab === "simulateur"
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span>Simulateur</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mes-campagnes")}
              className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                activeTab === "mes-campagnes"
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span>Campagnes</span>
              {savedPlans.length > 0 && (
                <span className="hidden sm:inline-flex ml-1.5 px-2 py-0.5 rounded-full text-xs font-extrabold bg-primary/20 text-primary">
                  {savedPlans.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("catalogue")}
              className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                activeTab === "catalogue"
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span>Boutique</span>
            </button>
          </div>

          <Button asChild variant="secondary" className="h-11 sm:h-12 px-4 sm:px-5 text-sm sm:text-base font-bold rounded-xl border border-border/80 shadow-xs hover:border-primary/40 shrink-0">
            <Link to="/dashboard/services">
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
              Services Experts
            </Link>
          </Button>
        </div>
      </div>

      {/* MODE 1 : SIMULATEUR & CALCUL AGRONOMIQUE */}
      {activeTab === "simulateur" && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-end gap-3">
            {hasResult && (
              <>
                <Button onClick={savePlanToDatabase} disabled={saving} className="h-12 px-6 text-base font-bold rounded-xl gradient-primary text-primary-foreground shadow-premium">
                  <Save className="h-5 w-5 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer la campagne"}
                </Button>
                <Button onClick={exportCurrentPDF} variant="outline" className="h-12 px-6 text-base font-bold rounded-xl border-border hover:border-primary/50">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Exporter PDF
                </Button>
              </>
            )}
          </div>

          <Card className="card-premium border-border/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-heading font-bold flex items-center gap-2">
                <Sprout className="h-5 w-5 text-primary" />
                Paramètres de la parcelle & Agro-climatologie
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                Configurez la parcelle, la culture et la zone agro-climatique du Burkina Faso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">
                    Parcelle {parcels.length === 0 && <span className="text-xs text-muted-foreground font-normal">(Optionnel)</span>}
                  </Label>
                  <Select
                    value={selectedParcel || "manuel"}
                    onValueChange={(val) => setSelectedParcel(val === "manuel" ? "" : val)}
                  >
                    <SelectTrigger className="h-12 text-base rounded-xl">
                      <SelectValue placeholder="Mode direct (superficie libre)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manuel">
                        Mode direct (superficie libre en ha)
                      </SelectItem>
                      {parcels.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {p.calculated_area_ha || p.area_ha} ha {p.calculated_area_ha ? "(GPS)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Culture</Label>
                  <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                    <SelectTrigger className="h-12 text-base rounded-xl">
                      <SelectValue placeholder="Choisir la culture" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.variety ? ` (${c.variety})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">
                    Superficie (ha) {parcel?.calculated_area_ha && <Badge variant="outline" className="ml-1 text-xs">GPS</Badge>}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    min="0.1"
                    className="h-12 text-base rounded-xl font-medium"
                    value={manualArea || (parcel?.calculated_area_ha || parcel?.area_ha || "1")}
                    onChange={e => setManualArea(e.target.value)}
                    placeholder="Superficie en ha"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <CloudSun className="h-4 w-4 text-amber-500" />
                    Zone agro-climatique
                  </Label>
                  <Select value={selectedClimateZoneId} onValueChange={setSelectedClimateZoneId}>
                    <SelectTrigger className="h-12 text-base rounded-xl">
                      <SelectValue placeholder="Zone climatique" />
                    </SelectTrigger>
                    <SelectContent>
                      {climateZones.map(cz => (
                        <SelectItem key={cz.id} value={cz.id}>
                          {cz.name} (Coeff: {cz.climate_coefficient}×)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Badge informatif climat */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 p-3.5 rounded-xl border border-border/60">
                <Badge variant="secondary" className="text-xs font-bold px-2.5 py-1">
                  Coeff climat : {climateCoeff}×
                </Badge>
                <span className="font-medium">
                  {activeClimateZone?.description || "Pluviométrie et climat appliqués au rendement."}
                </span>
              </div>

              {hasResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-border">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-foreground">Rendement attendu (kg/ha) [Ajusté climat: {climateCoeff}×]</Label>
                    <Input
                      type="number" step="any"
                      className="h-12 text-base rounded-xl font-medium"
                      value={yieldOverride}
                      onChange={e => setYieldOverride(e.target.value)}
                      placeholder={`Calculé: ${effYieldPerHa} kg/ha`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-foreground">Prix de vente unitaire (FCFA/kg)</Label>
                    <Input
                      type="number" step="any"
                      className="h-12 text-base rounded-xl font-medium"
                      value={priceOverride}
                      onChange={e => setPriceOverride(e.target.value)}
                      placeholder={`Suggéré: ${crop?.avg_price_per_kg || 200}`}
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <Button variant="outline" size="sm" onClick={resetToSuggestions} className="w-full h-12 text-sm font-bold rounded-xl border-border">
                      <RotateCcw className="h-4 w-4 mr-2" /> Restaurer les suggestions
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Module spécifique Arboriculture / Arbres fruitiers */}
          {hasResult && (
            <Card className="border-emerald-500/30 bg-emerald-50/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TreePine className="h-5 w-5 text-emerald-600" />
                      Moteur de Densité Fruitière & Vergers (Arboriculture)
                    </CardTitle>
                    <CardDescription>
                      Espacements, trouaison et fertilisation de fond pour manguiers, anacardiers, agrumes, etc.
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={applyOrchardToInputs} className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                    <Plus className="h-4 w-4 mr-1" />
                    Appliquer aux intrants
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Modèle fruitier</Label>
                    <Select
                      value={orchardPresetId}
                      onValueChange={(val) => {
                        setOrchardPresetId(val);
                        const p = FRUIT_TREE_PRESETS.find(x => x.id === val);
                        if (p) {
                          setOrchardPattern(p.defaultPattern);
                          setRowSpacingM(p.defaultRowSpacingM);
                          setPlantSpacingM(p.defaultPlantSpacingM);
                          setManurePerHoleKg(p.defaultHoleManureKg);
                          setNpkPerHoleG(p.defaultHoleNpkG);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FRUIT_TREE_PRESETS.map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Disposition</Label>
                    <Select value={orchardPattern} onValueChange={(val: any) => setOrchardPattern(val)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carre" className="text-xs">Carré (D × D)</SelectItem>
                        <SelectItem value="rectangle" className="text-xs">Rectangle (D1 × D2)</SelectItem>
                        <SelectItem value="quinconce" className="text-xs">Quinconce (+15% densité)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Interligne (m)</Label>
                    <Input type="number" step="0.5" min="1" value={rowSpacingM} onChange={e => setRowSpacingM(numv(e.target.value))} className="h-8 text-xs" />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Interplant (m)</Label>
                    <Input type="number" step="0.5" min="1" value={plantSpacingM} onChange={e => setPlantSpacingM(numv(e.target.value))} className="h-8 text-xs" />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Fumure / trou (kg)</Label>
                    <Input type="number" step="1" min="0" value={manurePerHoleKg} onChange={e => setManurePerHoleKg(numv(e.target.value))} className="h-8 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-muted/40 rounded-lg text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Densité d'arbres</p>
                    <p className="text-lg font-bold text-emerald-700">{orchardPlan.treeDensityPerHa} / ha</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total arbres à planter</p>
                    <p className="text-lg font-bold text-emerald-700">{fmt(orchardPlan.totalTrees)} plants</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trous de plantation</p>
                    <p className="text-lg font-bold">{fmt(orchardPlan.totalTrees)} trous</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fumure organique totale</p>
                    <p className="text-lg font-bold text-amber-700">{orchardPlan.totalManureTonnes} t <span className="text-xs font-normal">({fmt(orchardPlan.totalManureKg)} kg)</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Engrais NPK de fond</p>
                    <p className="text-lg font-bold text-blue-700">{fmt(orchardPlan.totalNpkKg)} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cartes KPI de synthèse */}
          {hasResult && (
            <>              {/* Cartes KPI de synthèse */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                <Card className="card-premium border-primary/30">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-muted-foreground">Superficie</CardTitle>
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Sprout className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-heading font-extrabold tracking-tight">{area} <span className="text-base font-semibold text-muted-foreground">ha</span></p>
                    {parcel?.calculated_area_ha && (
                      <p className="text-xs text-primary font-bold mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" /> Polygone GPS vérifié
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="card-premium border-border/80">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-muted-foreground">Rendement estimé</CardTitle>
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                      <Wheat className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-heading font-extrabold tracking-tight text-foreground">{fmt(expectedYield)} <span className="text-base font-semibold text-muted-foreground">kg</span></p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">({fmt(effYieldPerHa)} kg/ha)</p>
                  </CardContent>
                </Card>

                <Card className="card-premium border-border/80">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-muted-foreground">Budget nécessaire</CardTitle>
                    <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-heading font-extrabold tracking-tight text-destructive">{fmt(totalBudget)} <span className="text-base font-semibold text-muted-foreground">F</span></p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">Intrants + main-d'œuvre</p>
                  </CardContent>
                </Card>

                <Card className="card-premium border-border/80">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-muted-foreground">Revenu estimé</CardTitle>
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-heading font-extrabold tracking-tight text-primary">{fmt(expectedRevenue)} <span className="text-base font-semibold text-muted-foreground">F</span></p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">Prix suggéré ou personnalisé</p>
                  </CardContent>
                </Card>

                <Card className={`card-premium ${profit >= 0 ? "border-emerald-500/40 bg-emerald-500/5 shadow-glow" : "border-destructive/40 bg-destructive/5"}`}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-muted-foreground">Bénéfice & ROI</CardTitle>
                    <div className={`p-2 rounded-xl ${profit >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-heading font-extrabold tracking-tight ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      {profit >= 0 ? "+" : ""}{fmt(profit)} <span className="text-base font-semibold text-muted-foreground">F</span>
                    </p>
                    <p className="text-xs font-bold text-foreground/80 mt-1">
                      ROI: <span className="text-primary">{roi}%</span> · Seuil: {fmt(breakEvenKg)} kg
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tableaux Intrants & Main-d'œuvre */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="card-premium border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-xl font-heading font-bold flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-primary" />
                        Intrants & Semences
                      </CardTitle>
                      <CardDescription className="text-sm font-medium">Ajustez les doses, engrais et prix selon vos achats</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={addInput} className="h-10 px-4 text-sm font-bold rounded-xl border-border hover:border-primary/50">
                      <Plus className="h-4 w-4 mr-1.5" /> Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {inputRows.length === 0 ? (
                      <p className="text-base text-muted-foreground py-6 text-center">Aucun intrant — cliquez sur « Ajouter »</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border">
                              <TableHead className="text-sm font-bold">Intrant</TableHead>
                              <TableHead className="text-right text-sm font-bold">Quantité</TableHead>
                              <TableHead className="text-sm font-bold">Unité</TableHead>
                              <TableHead className="text-right text-sm font-bold">Prix unit.</TableHead>
                              <TableHead className="text-right text-sm font-bold">Coût</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inputRows.map((i, idx) => (
                              <TableRow key={idx} className="border-border/60">
                                <TableCell>
                                  <Input value={i.name} onChange={e => updateInput(idx, { name: e.target.value })} className="h-10 text-sm font-medium rounded-lg" />
                                </TableCell>
                                <TableCell>
                                  <Input type="number" step="any" value={i.totalQty}
                                    onChange={e => updateInput(idx, { totalQty: numv(e.target.value) })} className="h-10 w-24 text-right text-sm font-medium rounded-lg" />
                                </TableCell>
                                <TableCell>
                                  <Input value={i.unit} onChange={e => updateInput(idx, { unit: e.target.value })} className="h-10 w-20 text-sm font-medium rounded-lg" />
                                </TableCell>
                                <TableCell>
                                  <Input type="number" step="any" value={i.unitPrice}
                                    onChange={e => updateInput(idx, { unitPrice: numv(e.target.value) })} className="h-10 w-24 text-right text-sm font-medium rounded-lg" />
                                </TableCell>
                                <TableCell className="text-right font-bold text-sm whitespace-nowrap">{fmt(i.totalQty * i.unitPrice)}</TableCell>
                                <TableCell>
                                  <Button size="icon" variant="ghost" onClick={() => removeInput(idx)} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-bold text-sm">
                              <TableCell colSpan={4} className="font-bold">Total intrants</TableCell>
                              <TableCell className="text-right font-extrabold text-primary">{fmt(totalInputCost)} FCFA</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    <div className="pt-4 mt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Besoin d'acheter ces semences certifiées ou engrais ?
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setActiveTab("catalogue")}
                        className="gradient-primary text-primary-foreground text-xs font-bold rounded-xl h-9 shadow-xs"
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                        Commander sur le catalogue
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-premium border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-xl font-heading font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-secondary" />
                        Main d'œuvre & Travaux
                      </CardTitle>
                      <CardDescription className="text-sm font-medium">Planification des journées de travail et ouvriers par phase</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={addPhase} className="h-10 px-4 text-sm font-bold rounded-xl border-border hover:border-primary/50">
                      <Plus className="h-4 w-4 mr-1.5" /> Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-sm font-bold">Phase</TableHead>
                            <TableHead className="text-right text-sm font-bold">Jours</TableHead>
                            <TableHead className="text-right text-sm font-bold">Ouvriers</TableHead>
                            <TableHead className="text-right text-sm font-bold">Taux/jour</TableHead>
                            <TableHead className="text-right text-sm font-bold">Coût</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {phaseRows.map((p, idx) => (
                            <TableRow key={idx} className="border-border/60">
                              <TableCell>
                                <Input value={p.name} onChange={e => updatePhase(idx, { name: e.target.value })} className="h-10 text-sm font-medium rounded-lg" />
                              </TableCell>
                              <TableCell>
                                <Input type="number" step="any" value={p.totalDays}
                                  onChange={e => updatePhase(idx, { totalDays: numv(e.target.value) })} className="h-10 w-20 text-right text-sm font-medium rounded-lg" />
                              </TableCell>
                              <TableCell>
                                <Input type="number" step="1" min="1" value={p.workers}
                                  onChange={e => updatePhase(idx, { workers: numv(e.target.value) })} className="h-10 w-20 text-right text-sm font-medium rounded-lg" />
                              </TableCell>
                              <TableCell>
                                <Input type="number" step="any" value={p.dailyRate}
                                  onChange={e => updatePhase(idx, { dailyRate: numv(e.target.value) })} className="h-10 w-24 text-right text-sm font-medium rounded-lg" />
                              </TableCell>
                              <TableCell className="text-right font-bold text-sm whitespace-nowrap">{fmt(p.totalDays * p.workers * p.dailyRate)}</TableCell>
                              <TableCell>
                                <Button size="icon" variant="ghost" onClick={() => removePhase(idx)} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-bold text-sm">
                            <TableCell colSpan={2} className="font-bold">Total main d'œuvre</TableCell>
                            <TableCell className="text-right font-bold">{fmt(totalLabourDays)} j·h</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-extrabold text-primary">{fmt(totalLabourCost)} FCFA</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Récapitulatif Budgétaire */}
              <Card className="card-premium border-primary/30">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="text-xl font-heading font-bold">Récapitulatif budgétaire & Actions</CardTitle>
                    <CardDescription className="text-sm font-medium">Bilan financier complet prévisionnel avant validation</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={savePlanToDatabase} disabled={saving} className="h-11 px-5 text-sm font-bold rounded-xl gradient-primary text-primary-foreground shadow-premium">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Enregistrement..." : "Enregistrer la campagne"}
                    </Button>
                    <Button onClick={exportCurrentPDF} variant="outline" className="h-11 px-5 text-sm font-bold rounded-xl border-border hover:border-primary/50">
                      <FileText className="h-4 w-4 mr-2 text-primary" /> Exporter PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/40">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Coût intrants</p>
                      <p className="text-2xl font-heading font-extrabold text-foreground">{fmt(totalInputCost)} <span className="text-sm font-semibold text-muted-foreground">F</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Coût main d'œuvre</p>
                      <p className="text-2xl font-heading font-extrabold text-foreground">{fmt(totalLabourCost)} <span className="text-sm font-semibold text-muted-foreground">F</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Budget total prévisionnel</p>
                      <p className="text-2xl font-heading font-extrabold text-destructive">{fmt(totalBudget)} <span className="text-sm font-semibold text-muted-foreground">F</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Profit net potentiel</p>
                      <p className={`text-2xl font-heading font-extrabold ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                        {profit >= 0 ? "+" : ""}{fmt(profit)} <span className="text-sm font-semibold text-muted-foreground">F</span>
                      </p>
                    </div>
                  </div>
                  {plantCount > 0 && (
                    <>
                      <Separator className="my-4" />
                      <p className="text-sm font-medium text-muted-foreground">
                        <strong className="text-foreground">{fmt(plantCount)}</strong> plants/arbres · Durée estimée : <strong className="text-foreground">{crop.growth_duration_days || "—"}</strong> jours ·
                        Seuil de rentabilité : <strong className="text-foreground">{fmt(breakEvenKg)} kg</strong> · ROI estimé : <strong className="text-primary">{roi}%</strong>
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* MODE 2 : MES CAMPAGNES PLANIFIÉES */}
      {activeTab === "mes-campagnes" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-heading font-bold">Campagnes et Cycles enregistrés</h2>
              <p className="text-sm font-medium text-muted-foreground">
                Consultez, rechargez dans le simulateur ou téléchargez les fiches PDF de vos campagnes passées et prévisionnelles.
              </p>
            </div>
            <Button onClick={() => setActiveTab("simulateur")} className="h-11 px-5 text-sm font-bold rounded-xl gradient-primary text-primary-foreground shadow-premium">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle planification
            </Button>
          </div>

          {savedPlans.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center space-y-3">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                <h3 className="font-semibold text-foreground">Aucune campagne enregistrée pour le moment</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Utilisez le simulateur pour concevoir votre premier itinéraire cultural, estimer vos intrants et sauvegarder votre campagne.
                </p>
                <Button size="sm" onClick={() => setActiveTab("simulateur")}>
                  Ouvrir le simulateur
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savedPlans.map((plan) => (
                <Card key={plan.id} className="shadow-xs hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <CardTitle className="text-base font-bold text-foreground">
                            {plan.seasonName}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                            {plan.cropName} {plan.variety ? `(${plan.variety})` : ""}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {plan.areaHa} hectare(s) · {plan.parcelName || "Direct"} · {plan.climateZoneName}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-[11px] shrink-0">
                        {new Date(plan.createdAt).toLocaleDateString("fr-FR")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 text-center text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Rendement</span>
                        <span className="font-bold text-foreground">{fmt(plan.expectedYieldKg)} kg</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Budget</span>
                        <span className="font-bold text-destructive">{fmt(plan.totalBudget)} F</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Bénéfice estimé</span>
                        <span className={`font-bold ${plan.profit >= 0 ? "text-primary" : "text-destructive"}`}>
                          {plan.profit >= 0 ? "+" : ""}{fmt(plan.profit)} F
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>ROI prévisionnel : <strong className="text-foreground">{plan.roi}%</strong></span>
                      <span>Seuil rentabilité : <strong className="text-foreground">{fmt(plan.breakEvenKg)} kg</strong></span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleReloadPlan(plan)}
                        className="text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Recharger dans le simulateur
                      </Button>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportPDFFromData({
                            seasonName: plan.seasonName,
                            cropName: plan.cropName,
                            variety: plan.variety,
                            parcelName: plan.parcelName,
                            areaHa: plan.areaHa,
                            climateZoneName: plan.climateZoneName,
                            climateCoeff: plan.climateCoeff,
                            expectedYieldKg: plan.expectedYieldKg,
                            expectedRevenue: plan.expectedRevenue,
                            totalBudget: plan.totalBudget,
                            profit: plan.profit,
                            roi: plan.roi,
                            breakEvenKg: plan.breakEvenKg,
                            plantCount: plan.plantCount,
                            inputRows: plan.inputRows || [],
                            phaseRows: plan.phaseRows || [],
                            totalInputCost: (plan.inputRows || []).reduce((s, i) => s + i.totalQty * i.unitPrice, 0),
                            totalLabourCost: (plan.phaseRows || []).reduce((s, p) => s + p.totalDays * p.workers * p.dailyRate, 0),
                          })}
                          className="text-xs"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          PDF
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => handleDeletePlan(plan.id, e)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Supprimer la planification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 3 : CATALOGUE PRODUITS & SERVICES PARTENAIRES */}
      {activeTab === "catalogue" && (
        <div className="animate-fade-in">
          <ProductServiceCatalog
            title="Catalogue Produits & Services Partenaires"
            description="Commandez vos semences certifiées, engrais minéraux, produits phytosanitaires, prestations de machinisme et accédez aux financements directement depuis votre tableau de bord."
            defaultRole="agriculteur"
          />
        </div>
      )}
    </div>
  );
};

export default CropPlanningPage;
