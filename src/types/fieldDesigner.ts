/**
 * NAFA FIELD DESIGNER
 * Types & Schémas du Logiciel de Conception et d'Intervention Terrain
 * pour Agronomes Africains (Burkina Faso & Afrique de l'Ouest)
 */

export interface GeoPoint {
  lat: number;
  lng: number;
  alt?: number;
  accuracy?: number;
  label?: string;
  timestamp?: number;
}

export type FarmType =
  | 'agriculture'
  | 'maraichage'
  | 'arboriculture'
  | 'elevage'
  | 'pisciculture'
  | 'agri_elevage'
  | 'ferme_integree'
  | 'autre';

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface Farm {
  id: string;
  name: string;
  producerName: string;
  producerPhone: string;
  locality: string;
  region: string;
  province: string;
  commune: string;
  villageSector: string;
  gps?: {
    lat: number;
    lng: number;
    alt?: number;
  };
  farmType: FarmType;
  totalAreaHa: number;
  mainCrops: string[];
  livestockTypes: string[];
  irrigationType: string;
  notes?: string;
  photos: string[];
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Field {
  id: string;
  farmId: string;
  name: string;
  points: GeoPoint[];
  areaM2: number;
  areaHa: number;
  perimeterM: number;
  lengthM?: number;
  widthM?: number;
  orientationDeg?: number;
  soilType?: string;
  currentCrop?: string;
  status: 'active' | 'fallow' | 'preparation';
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export type CropCategory =
  | 'maraichage'
  | 'cereale'
  | 'legumineuse'
  | 'arboriculture'
  | 'tubercule'
  | 'fourrage'
  | 'industrielle';

export interface CropConfig {
  id: string;
  name: string;
  category: CropCategory;
  commonVarieties: string[];
  recommendedRowSpacingCm: number;
  recommendedPlantSpacingCm: number;
  recommendedDensityHa: number;
  sowingDepthCm: number;
  cycleDays: number;
  waterRequirementMm: number;
  kcInit: number;
  kcMid: number;
  kcEnd: number;
  isCustom?: boolean;
}

export type PlantingType =
  | 'semis_direct'
  | 'repiquage'
  | 'poquets'
  | 'billons'
  | 'planches'
  | 'lignes_simples'
  | 'lignes_jumeles';

export interface CropPlan {
  id: string;
  farmId: string;
  fieldId: string;
  cropId: string;
  cropName: string;
  variety: string;
  areaHa: number;
  rowSpacingCm: number;
  plantSpacingCm: number;
  orientationDeg: number;
  plantingType: PlantingType;
  numRows: number;
  numPlants: number;
  densityPlantsHa: number;
  totalRowLengthM: number;
  seedQuantityKg: number;
  estimatedYieldTonnes?: number;
  waterNeedsM3Day?: number;
  notes?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export type IrrigationSystemType =
  | 'goutte_a_goutte'
  | 'aspersion'
  | 'micro_aspersion'
  | 'pivot'
  | 'gravitaire';

export type WaterSourceType =
  | 'forage'
  | 'puits'
  | 'cours_deau'
  | 'barrage'
  | 'reseau';

export type PumpType =
  | 'solaire_fil_du_soleil'
  | 'solaire_batteries'
  | 'electrique_reseau'
  | 'motopompe_diesel'
  | 'motopompe_essence';

export interface IrrigationProject {
  id: string;
  farmId: string;
  fieldId?: string;
  systemType: IrrigationSystemType;
  waterSource: WaterSourceType;
  dynamicWaterDepthM: number;
  sourceFlowM3h: number;
  pumpType: PumpType;
  pumpPowerKw: number;
  tankHeightM: number;
  tankVolumeM3: number;
  mainPipeLengthM: number;
  mainPipeDiameterMm: number;
  subPipeLengthM: number;
  subPipeDiameterMm: number;
  lateralLengthM: number;
  lateralSpacingM: number;
  emitterSpacingM: number;
  emitterFlowLh: number;
  totalEmittersCount: number;
  totalFlowRateM3h: number;
  numSectors: number;
  dailyIrrigationHours: number;
  isTechnicalEstimate: boolean;
  notes?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export type BuildingType =
  | 'poulailler'
  | 'etable'
  | 'bergerie'
  | 'porcherie'
  | 'clapier'
  | 'pisciculture'
  | 'magasin'
  | 'serre'
  | 'hangar'
  | 'logement'
  | 'forage'
  | 'bassin'
  | 'chateau_eau'
  | 'route'
  | 'cloture';

export interface FarmBuilding {
  id: string;
  farmId: string;
  name: string;
  buildingType: BuildingType;
  subType?: string;
  capacityAnimals?: number;
  lengthM: number;
  widthM: number;
  heightM: number;
  areaM2: number;
  orientation: string;
  ventilation: string;
  roofType: string;
  wallMaterial: string;
  equipment: string[];
  posX: number;
  posY: number;
  rotationDeg: number;
  color?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export type MaterialCategory =
  | 'maconnerie'
  | 'charpente_couverture'
  | 'ferraillage'
  | 'plomberie_irrigation'
  | 'equipement_elevage'
  | 'cloture'
  | 'main_d_oeuvre'
  | 'divers';

export interface MaterialPriceItem {
  code: string;
  designation: string;
  category: MaterialCategory;
  unit: string;
  defaultUnitPriceFCFA: number;
  supplier: string;
  region: string;
  lastUpdated: string;
}

export interface QuoteItem {
  id: string;
  designation: string;
  category: MaterialCategory;
  unit: string;
  quantity: number;
  unitPriceFCFA: number;
  totalFCFA: number;
}

export interface EngineeringQuoteDoc {
  id: string;
  farmId: string;
  title: string;
  clientName: string;
  clientPhone: string;
  items: QuoteItem[];
  laborCostFCFA: number;
  transportCostFCFA: number;
  contingenciesCostFCFA: number;
  subtotalMaterialsFCFA: number;
  totalGeneralFCFA: number;
  notes?: string;
  status: 'draft' | 'validated' | 'submitted';
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FieldVisitReport {
  id: string;
  farmId: string;
  fieldId?: string;
  visitDate: string;
  visitTime: string;
  gps?: { lat: number; lng: number };
  cropObserved?: string;
  growthStage?: string;
  observations: string;
  photos: string[];
  measurements?: string;
  recommendations: string;
  worksDone?: string;
  nextVisitDate?: string;
  expertName: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SyncState {
  status: 'synced' | 'syncing' | 'error' | 'offline';
  pendingCount: number;
  lastSyncedAt?: string;
  errorMsg?: string;
}
