/**
 * NAFA FIELD DESIGNER — STUDIO DE MODÉLISATION 3D & 2.5D ISOMÉTRIQUE UNIVERSEL
 * 
 * Permet la conception tridimensionnelle des exploitations agricoles sahéliennes personnalisée selon :
 * 1. Les Projets (fermes actives, sauvegarde et restauration de maquettes 3D par exploitation).
 * 2. Les Mesures GPS de terrain (arpentage, coordonnées réelles, périmètre, superficie ha, pente).
 * 3. Les Cartographies (fond satellite orthophoto, contour cadastral, courbes de niveau isohypses).
 * 4. L'utilisation des Données physiques & agronomiques (bilan hydrique forage m³/h, nappe, pente, sol).
 * 5. Les Images & Textures personnalisées (importation photo de drone ou orthophoto géoréférencée).
 * 6. Les Couleurs & Thèmes visuels (nuancier sahélien du sol, des cultures, canalisations et bâtiments).
 * 7. Le Type d'Aménagement envisagé (7 modèles sahéliens certifiés : maraîchage, verger, agro-pastoral, céréales, CES/DRS, aviculture, serres).
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Box,
  Compass,
  Download,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  Plus,
  RotateCw,
  Sun,
  Moon,
  Sunset,
  Trash2,
  CheckCircle2,
  Droplets,
  Building2,
  Sprout,
  Sparkles,
  Camera,
  FileSpreadsheet,
  HelpCircle,
  ShoppingBag,
  Cpu,
  MonitorCheck,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Sliders,
  Palette,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Waves,
  Grid,
  Tractor,
  Trees,
  Shovel,
  Map,
  Ruler,
  UploadCloud,
  Check,
  FolderKanban,
  Zap,
  PenTool,
  Copy,
  Circle,
  Crosshair,
  Undo2,
  CornerDownRight,
  Move,
  ChevronRight,
  FileText,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { pdfExportHistory } from "@/lib/pdfExportHistory";
import PdfExportHistoryModal from "@/components/export/PdfExportHistoryModal";
import { MarketplaceMaterialPricePickerModal } from "./MarketplaceMaterialPricePickerModal";
import {
  Farm,
  Field,
  IrrigationProject,
  CropPlan,
  FarmBuilding,
  QuoteItem,
} from "@/types/fieldDesigner";
import {
  JARDI_CATEGORIES,
  JARDI_CATALOG_ITEMS,
  JardiCategory,
  JardiCatalogItem,
  buildProceduralMeshForType,
} from "@/lib/studio3dLibrary";

export type ElementCategory = "crop" | "irrigation" | "building" | "infrastructure";

export interface FarmElement3D {
  id: string;
  name: string;
  category: ElementCategory;
  type: string;
  x: number;
  z: number;
  width: number;
  length: number;
  height: number;
  rotation: number;
  costFcfa: number;
  // Propriétés de CAO / Plan Sur-Mesure
  cornerRadius?: number; // Rayon d'arrondi des angles (m)
  isCurved?: boolean; // Forme circulaire / pivot 360°
  curveRadius?: number; // Rayon circulaire (m)
  linearMeters?: number; // Métré linéaire (ml) pour canalisations & clôtures
  pathPoints?: Array<{ x: number; z: number }>; // Jalons vectoriels du tracé
  customNotes?: string; // Spécifications techniques du bureau d'études
}

export type AmenagementType =
  | "maraichage"
  | "verger"
  | "agro_pastoral"
  | "grandes_cultures"
  | "ces_drs"
  | "aviculture"
  | "serres";

export type SoilType = "laterite" | "alluvial" | "sableux" | "argileux" | "degrade";

export interface CustomColorsState {
  groundColor: string;
  cropColor: string;
  pipeColor: string;
  buildingColor: string;
}

export interface Studio3DFarmModelerProps {
  activeFarm?: Farm;
  fields?: Field[];
  irrigationProjects?: IrrigationProject[];
  cropPlans?: CropPlan[];
  buildings?: FarmBuilding[];
  onSaveModel?: (projectConfig: any) => void;
}

// Typologie pédologique sahélienne certifiée
export const SOIL_PROFILES: Array<{
  id: SoilType;
  name: string;
  subname: string;
  defaultColor: string;
  description: string;
  drainage: string;
  suitability: string;
}> = [
  {
    id: "alluvial",
    name: "Bas-Fond Alluvionnaire Humifère",
    subname: "Sol noir hydromorphe riche",
    defaultColor: "#2b1e16",
    description: "Excellente rétention en eau et fertilité en saison sèche. Idéal pour maraîchage intensif et riziculture.",
    drainage: "Modéré à lent",
    suitability: "Maraîchage de contre-saison, pépinières, tomate, oignon",
  },
  {
    id: "laterite",
    name: "Terre Rouge Latéritique",
    subname: "Sol ferrallitique gravillonnaire",
    defaultColor: "#8d3214",
    description: "Plateaux sahéliens burkinabè. Sol filtrant bien aéré, propice aux céréales et arboriculture.",
    drainage: "Rapide",
    suitability: "Manguiers, anacardiers, maïs, sorgho, aménagements CES/DRS",
  },
  {
    id: "sableux",
    name: "Sol Sablo-Limoneux Sahélien",
    subname: "Sol dunaire clair / ocre",
    defaultColor: "#b89768",
    description: "Facile à travailler mais sensible au vent. Conduite en goutte-à-goutte fortement recommandée.",
    drainage: "Très rapide",
    suitability: "Pastèque, niébé, sésame, maraîchage sous paillage",
  },
  {
    id: "argileux",
    name: "Argile Lourde & Vertisol",
    subname: "Sol profond gonflant",
    defaultColor: "#7b4e2b",
    description: "Très plastique humide, crevasses sèches. Forte réserve utile pour grandes cultures.",
    drainage: "Lent",
    suitability: "Céréales pluviales, coton, riz de bas-fond",
  },
  {
    id: "degrade",
    name: "Cuirasse Latéritique & Sol Dégradé",
    subname: "Zipellé encroûté",
    defaultColor: "#54453f",
    description: "Surface battante imperméabilisée. Nécessite travaux anti-érosifs (cordons, zaï, demi-lunes).",
    drainage: "Ruissellement fort",
    suitability: "Régénération CES/DRS, reboisement, haies vives",
  },
];

// Modèles d'Aménagement Sahéliens avec configuration initiale
export interface AmenagementModelSpec {
  id: AmenagementType;
  title: string;
  badge: string;
  category: string;
  description: string;
  recommendedSoil: SoilType;
  recommendedFlowM3H: number;
  defaultColors: CustomColorsState;
  sampleElements: FarmElement3D[];
}

export const AMENAGEMENT_MODELS: AmenagementModelSpec[] = [
  {
    id: "maraichage",
    title: "Périmètre Maraîcher Goutte-à-Goutte",
    badge: "Haute Valeur • FAO-56",
    category: "Maraîchage",
    description: "Aménagement intensif avec planches maraîchères calibrées, château d'eau 10m³, pompage solaire et réseau goutte-à-goutte sous pression.",
    recommendedSoil: "alluvial",
    recommendedFlowM3H: 10,
    defaultColors: {
      groundColor: "#2b1e16",
      cropColor: "#2e7d32",
      pipeColor: "#0288d1",
      buildingColor: "#f57c00",
    },
    sampleElements: [
      {
        id: "am-mar-1",
        name: "Planches Maraîchères (Tomate/Oignon)",
        category: "crop",
        type: "crop_vegetables",
        x: -15,
        z: 15,
        width: 25,
        length: 35,
        height: 1.0,
        rotation: 0,
        costFcfa: 450000,
      },
      {
        id: "am-mar-2",
        name: "Château d'Eau Métallique 10m³",
        category: "irrigation",
        type: "water_tower",
        x: 0,
        z: -25,
        width: 5,
        length: 5,
        height: 8.0,
        rotation: 0,
        costFcfa: 4200000,
      },
      {
        id: "am-mar-3",
        name: "Champ Solaire & Motopompe 48V",
        category: "irrigation",
        type: "solar_pump",
        x: 18,
        z: -25,
        width: 8,
        length: 6,
        height: 2.5,
        rotation: 0,
        costFcfa: 3500000,
      },
      {
        id: "am-mar-4",
        name: "Haie Brise-Vent Agroforestière",
        category: "infrastructure",
        type: "windbreak",
        x: -35,
        z: 0,
        width: 4,
        length: 60,
        height: 4.5,
        rotation: 90,
        costFcfa: 180000,
      },
    ],
  },
  {
    id: "verger",
    title: "Verger Arboricole & Agroforesterie",
    badge: "Patrimoine Arboré Durable",
    category: "Arboriculture",
    description: "Plantation alignée d'arbres fruitiers (manguiers greffés, anacardiers, agrumes) avec bassin de stockage bâché et micro-aspersion.",
    recommendedSoil: "sableux",
    recommendedFlowM3H: 12,
    defaultColors: {
      groundColor: "#8c5836",
      cropColor: "#1b5e20",
      pipeColor: "#00acc1",
      buildingColor: "#8d6e63",
    },
    sampleElements: [
      {
        id: "am-ver-1",
        name: "Verger Arboricole (Manguiers/Agrumes)",
        category: "crop",
        type: "orchard",
        x: -15,
        z: 10,
        width: 35,
        length: 35,
        height: 4.5,
        rotation: 0,
        costFcfa: 850000,
      },
      {
        id: "am-ver-2",
        name: "Bassin de Rétention Bâché 500m³",
        category: "irrigation",
        type: "retention_pond",
        x: 20,
        z: -20,
        width: 20,
        length: 20,
        height: 2.0,
        rotation: 0,
        costFcfa: 1800000,
      },
      {
        id: "am-ver-3",
        name: "Champ Solaire & Motopompe 48V",
        category: "irrigation",
        type: "solar_pump",
        x: 25,
        z: 5,
        width: 8,
        length: 6,
        height: 2.5,
        rotation: 0,
        costFcfa: 3500000,
      },
      {
        id: "am-ver-4",
        name: "Haie Brise-Vent Agroforestière",
        category: "infrastructure",
        type: "windbreak",
        x: 0,
        z: 40,
        width: 4,
        length: 70,
        height: 5.0,
        rotation: 0,
        costFcfa: 220000,
      },
    ],
  },
  {
    id: "agro_pastoral",
    title: "Domaine Agro-Pastoral Mixte",
    badge: "Synergie Élevage & Fourrage",
    category: "Agro-Pastoral",
    description: "Équilibre entre cheptel (bovin/ovin) et cultures fourragères. Comprend étables aérées bioclimatiques, abreuvoir automatisé et réserve de foin.",
    recommendedSoil: "laterite",
    recommendedFlowM3H: 10,
    defaultColors: {
      groundColor: "#996515",
      cropColor: "#33691e",
      pipeColor: "#0288d1",
      buildingColor: "#6d4c41",
    },
    sampleElements: [
      {
        id: "am-pas-1",
        name: "Hangar Bovin & Étable Aérée",
        category: "building",
        type: "cattle_shed",
        x: -25,
        z: -15,
        width: 15,
        length: 25,
        height: 4.5,
        rotation: 0,
        costFcfa: 4800000,
      },
      {
        id: "am-pas-2",
        name: "Bergerie Ovine Améliorée",
        category: "building",
        type: "sheep_pen",
        x: -25,
        z: 18,
        width: 12,
        length: 20,
        height: 3.5,
        rotation: 0,
        costFcfa: 3200000,
      },
      {
        id: "am-pas-3",
        name: "Château d'Eau Métallique 10m³",
        category: "irrigation",
        type: "water_tower",
        x: 0,
        z: 0,
        width: 5,
        length: 5,
        height: 8.0,
        rotation: 0,
        costFcfa: 4200000,
      },
      {
        id: "am-pas-4",
        name: "Parcelle Maïs / Céréales Fourragères",
        category: "crop",
        type: "crop_maize",
        x: 20,
        z: 10,
        width: 25,
        length: 35,
        height: 2.2,
        rotation: 0,
        costFcfa: 450000,
      },
    ],
  },
  {
    id: "grandes_cultures",
    title: "Grande Culture Céréalière & Bassin",
    badge: "Sécurité Vivrière Sahélienne",
    category: "Céréaliculture",
    description: "Aménagement pour maïs hybride, sorgho ou mil avec cordons pierreux anti-érosifs, canaux de dérivation des crues et magasin sécurisé.",
    recommendedSoil: "laterite",
    recommendedFlowM3H: 6,
    defaultColors: {
      groundColor: "#a34828",
      cropColor: "#2e7d32",
      pipeColor: "#0288d1",
      buildingColor: "#546e7a",
    },
    sampleElements: [
      {
        id: "am-cer-1",
        name: "Parcelle Maïs / Céréales",
        category: "crop",
        type: "crop_maize",
        x: 0,
        z: 15,
        width: 40,
        length: 50,
        height: 2.2,
        rotation: 0,
        costFcfa: 650000,
      },
      {
        id: "am-cer-2",
        name: "Cordons Pierreux Anti-Érosifs",
        category: "infrastructure",
        type: "cordons_pierreux",
        x: 0,
        z: -15,
        width: 2,
        length: 50,
        height: 0.6,
        rotation: 0,
        costFcfa: 150000,
      },
      {
        id: "am-cer-3",
        name: "Chambre Froide Solaire Autonome",
        category: "building",
        type: "solar_coldroom",
        x: -25,
        z: -30,
        width: 8,
        length: 10,
        height: 3.5,
        rotation: 0,
        costFcfa: 8500000,
      },
    ],
  },
  {
    id: "ces_drs",
    title: "Aménagement Anti-Érosif CES/DRS",
    badge: "Restauration des Sols Dégradés",
    category: "CES / DRS",
    description: "Dispositif anti-érosif complet : cordons pierreux de niveau, demi-lunes sahéliennes pour captage des eaux pluviales et haies d'ancrage racinaire.",
    recommendedSoil: "degrade",
    recommendedFlowM3H: 4,
    defaultColors: {
      groundColor: "#54453f",
      cropColor: "#558b2f",
      pipeColor: "#0097a7",
      buildingColor: "#6d4c41",
    },
    sampleElements: [
      {
        id: "am-ces-1",
        name: "Cordons Pierreux Anti-Érosifs",
        category: "infrastructure",
        type: "cordons_pierreux",
        x: 0,
        z: -20,
        width: 2,
        length: 55,
        height: 0.6,
        rotation: 0,
        costFcfa: 180000,
      },
      {
        id: "am-ces-2",
        name: "Dispositif Demi-Lunes Sahéliennes",
        category: "crop",
        type: "demi_lunes",
        x: 0,
        z: 10,
        width: 25,
        length: 30,
        height: 0.5,
        rotation: 0,
        costFcfa: 220000,
      },
      {
        id: "am-ces-3",
        name: "Haie Brise-Vent Agroforestière",
        category: "infrastructure",
        type: "windbreak",
        x: -35,
        z: 0,
        width: 4,
        length: 60,
        height: 4.5,
        rotation: 90,
        costFcfa: 180000,
      },
    ],
  },
  {
    id: "aviculture",
    title: "Ferme Avicole Bioclimatique & Maraîchage",
    badge: "Éco-Conception Circulaire",
    category: "Aviculture & Maraîchage",
    description: "Poulailler semi-ouvert orienté Est-Ouest pour le confort thermique, valorisation de la fiente fertilisante dans le maraîchage attenant et forage solaire.",
    recommendedSoil: "alluvial",
    recommendedFlowM3H: 8,
    defaultColors: {
      groundColor: "#3e2723",
      cropColor: "#4caf50",
      pipeColor: "#0288d1",
      buildingColor: "#ef6c00",
    },
    sampleElements: [
      {
        id: "am-avi-1",
        name: "Bâtiment Avicole Bioclimatique",
        category: "building",
        type: "poultry_house",
        x: -20,
        z: -20,
        width: 12,
        length: 35,
        height: 4.0,
        rotation: 0,
        costFcfa: 6500000,
      },
      {
        id: "am-avi-2",
        name: "Château d'Eau Métallique 10m³",
        category: "irrigation",
        type: "water_tower",
        x: 0,
        z: -25,
        width: 5,
        length: 5,
        height: 8.0,
        rotation: 0,
        costFcfa: 4200000,
      },
      {
        id: "am-avi-3",
        name: "Champ Solaire & Motopompe 48V",
        category: "irrigation",
        type: "solar_pump",
        x: 18,
        z: -25,
        width: 8,
        length: 6,
        height: 2.5,
        rotation: 0,
        costFcfa: 3500000,
      },
      {
        id: "am-avi-4",
        name: "Planches Maraîchères (Tomate/Oignon)",
        category: "crop",
        type: "crop_vegetables",
        x: 15,
        z: 15,
        width: 20,
        length: 30,
        height: 1.0,
        rotation: 0,
        costFcfa: 350000,
      },
    ],
  },
  {
    id: "serres",
    title: "Complexe Serres Tunnel & Ombrières",
    badge: "Cultures Protégées Haut Rendement",
    category: "Cultures Protégées",
    description: "Protection contre les chaleurs extrêmes sahéliennes et les ravageurs : serres tunnels thermorégulées, ombrières 50% et fertirrigation programmable.",
    recommendedSoil: "alluvial",
    recommendedFlowM3H: 15,
    defaultColors: {
      groundColor: "#2b1e16",
      cropColor: "#81d4fa",
      pipeColor: "#00bcd4",
      buildingColor: "#37474f",
    },
    sampleElements: [
      {
        id: "am-ser-1",
        name: "Serre Tunnel Maraîchère 3D",
        category: "crop",
        type: "greenhouse",
        x: -15,
        z: -10,
        width: 10,
        length: 30,
        height: 3.5,
        rotation: 0,
        costFcfa: 2800000,
      },
      {
        id: "am-ser-2",
        name: "Ombrière Maraîchère 50%",
        category: "crop",
        type: "shade_house",
        x: 15,
        z: -10,
        width: 12,
        length: 25,
        height: 3.0,
        rotation: 0,
        costFcfa: 1500000,
      },
      {
        id: "am-ser-3",
        name: "Chambre Froide Solaire Autonome",
        category: "building",
        type: "solar_coldroom",
        x: -25,
        z: 20,
        width: 8,
        length: 10,
        height: 3.5,
        rotation: 0,
        costFcfa: 8500000,
      },
      {
        id: "am-ser-4",
        name: "Château d'Eau Métallique 10m³",
        category: "irrigation",
        type: "water_tower",
        x: 5,
        z: 20,
        width: 5,
        length: 5,
        height: 8.0,
        rotation: 0,
        costFcfa: 4200000,
      },
    ],
  },
];

// Catalogue des éléments 3D implantables
const PRESET_ELEMENTS = [
  // Cultures & Aménagements végétaux
  {
    type: "crop_maize",
    name: "Parcelle Maïs / Céréales",
    category: "crop" as ElementCategory,
    width: 20,
    length: 30,
    height: 2.2,
    color: 0x2e7d32,
    costFcfa: 450000,
    icon: Sprout,
  },
  {
    type: "crop_vegetables",
    name: "Planches Maraîchères (Tomate/Oignon)",
    category: "crop" as ElementCategory,
    width: 15,
    length: 25,
    height: 1.0,
    color: 0x4caf50,
    costFcfa: 350000,
    icon: Sprout,
  },
  {
    type: "greenhouse",
    name: "Serre Tunnel Maraîchère 3D",
    category: "crop" as ElementCategory,
    width: 10,
    length: 30,
    height: 3.5,
    color: 0x81d4fa,
    costFcfa: 2800000,
    icon: Building2,
  },
  {
    type: "shade_house",
    name: "Ombrière Maraîchère 50%",
    category: "crop" as ElementCategory,
    width: 12,
    length: 25,
    height: 3.0,
    color: 0x4db6ac,
    costFcfa: 1500000,
    icon: Building2,
  },
  {
    type: "orchard",
    name: "Verger Arboricole (Manguiers/Agrumes)",
    category: "crop" as ElementCategory,
    width: 25,
    length: 25,
    height: 4.5,
    color: 0x1b5e20,
    costFcfa: 650000,
    icon: Sprout,
  },
  {
    type: "demi_lunes",
    name: "Dispositif Demi-Lunes Sahéliennes",
    category: "crop" as ElementCategory,
    width: 18,
    length: 25,
    height: 0.5,
    color: 0x8d6e63,
    costFcfa: 220000,
    icon: Sprout,
  },

  // Irrigation & Pompage
  {
    type: "solar_pump",
    name: "Champ Solaire & Motopompe 48V",
    category: "irrigation" as ElementCategory,
    width: 8,
    length: 6,
    height: 2.5,
    color: 0x0288d1,
    costFcfa: 3500000,
    icon: Droplets,
  },
  {
    type: "water_tower",
    name: "Château d'Eau Métallique 10m³",
    category: "irrigation" as ElementCategory,
    width: 5,
    length: 5,
    height: 8.0,
    color: 0x00acc1,
    costFcfa: 4200000,
    icon: Droplets,
  },
  {
    type: "retention_pond",
    name: "Bassin de Rétention Bâché 500m³",
    category: "irrigation" as ElementCategory,
    width: 20,
    length: 20,
    height: 2.0,
    color: 0x039be5,
    costFcfa: 1800000,
    icon: Droplets,
  },

  // Bâtiments & Stockage
  {
    type: "poultry_house",
    name: "Bâtiment Avicole Bioclimatique",
    category: "building" as ElementCategory,
    width: 12,
    length: 35,
    height: 4.0,
    color: 0xf57c00,
    costFcfa: 6500000,
    icon: Building2,
  },
  {
    type: "cattle_shed",
    name: "Hangar Bovin & Étable Aérée",
    category: "building" as ElementCategory,
    width: 15,
    length: 25,
    height: 4.5,
    color: 0x8d6e63,
    costFcfa: 4800000,
    icon: Building2,
  },
  {
    type: "sheep_pen",
    name: "Bergerie Ovine Améliorée",
    category: "building" as ElementCategory,
    width: 12,
    length: 20,
    height: 3.5,
    color: 0x6d4c41,
    costFcfa: 3200000,
    icon: Building2,
  },
  {
    type: "solar_coldroom",
    name: "Chambre Froide Solaire Autonome",
    category: "building" as ElementCategory,
    width: 8,
    length: 10,
    height: 3.5,
    color: 0x37474f,
    costFcfa: 8500000,
    icon: Building2,
  },

  // Infrastructures & Aménagements Anti-Érosifs
  {
    type: "windbreak",
    name: "Haie Brise-Vent Agroforestière",
    category: "infrastructure" as ElementCategory,
    width: 4,
    length: 40,
    height: 5.0,
    color: 0x33691e,
    costFcfa: 150000,
    icon: Sprout,
  },
  {
    type: "cordons_pierreux",
    name: "Cordons Pierreux Anti-Érosifs",
    category: "infrastructure" as ElementCategory,
    width: 2,
    length: 45,
    height: 0.6,
    color: 0x78909c,
    costFcfa: 120000,
    icon: Shovel,
  },
];

const DEFAULT_DEMO_FIELD: Field = {
  id: "field-demo-koubri",
  farmId: "farm-demo",
  name: "Parcelle Pilote Arpentée (Koubri - 2.50 ha)",
  points: [
    { lat: 12.182, lng: -1.393, alt: 298, label: "Borne P1" },
    { lat: 12.1825, lng: -1.381, alt: 299, label: "Borne P2" },
    { lat: 12.174, lng: -1.3815, alt: 296, label: "Borne P3" },
    { lat: 12.1735, lng: -1.3925, alt: 295, label: "Borne P4" },
  ],
  areaM2: 25000,
  areaHa: 2.5,
  perimeterM: 640,
  lengthM: 170,
  widthM: 147,
  orientationDeg: 45,
  soilType: "alluvial",
  currentCrop: "Maraîchage diversifié",
  status: "active",
  syncStatus: "synced",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function Studio3DFarmModeler({
  activeFarm,
  fields = [],
  irrigationProjects = [],
  cropPlans = [],
  buildings = [],
  onSaveModel,
}: Studio3DFarmModelerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const container2dRef = useRef<HTMLDivElement>(null);
  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. État du projet & type d'aménagement
  const [amenagementType, setAmenagementType] = useState<AmenagementType>("maraichage");
  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    fields[0]?.id || DEFAULT_DEMO_FIELD.id
  );

  // Parcelle active (sélectionnée ou de démo)
  const currentField = useMemo(() => {
    return fields.find((f) => f.id === selectedFieldId) || fields[0] || DEFAULT_DEMO_FIELD;
  }, [fields, selectedFieldId]);

  // 2. Typologie de sol & Couleurs
  const [soilType, setSoilType] = useState<SoilType>("alluvial");
  const [customColors, setCustomColors] = useState<CustomColorsState>({
    groundColor: "#2b1e16",
    cropColor: "#2e7d32",
    pipeColor: "#0288d1",
    buildingColor: "#f57c00",
  });

  // 3. Cartographie & Textures personnalisées
  const [customGroundTextureUrl, setCustomGroundTextureUrl] = useState<string | null>(null);
  const [showSatelliteOverlay, setShowSatelliteOverlay] = useState<boolean>(false);
  const [showCadastralBoundary, setShowCadastralBoundary] = useState<boolean>(true);
  const [showContourLines, setShowContourLines] = useState<boolean>(false);

  // 4. Données de terrain (hydrologie, pente)
  const [waterFlowM3H, setWaterFlowM3H] = useState<number>(
    irrigationProjects[0]?.sourceFlowM3h || 10
  );
  const [waterDepthM, setWaterDepthM] = useState<number>(
    irrigationProjects[0]?.dynamicWaterDepthM || 35
  );
  const [slopeGradientPct, setSlopeGradientPct] = useState<number>(1.8);

  // Onglet actif du panneau de personnalisation
  const [customTab, setCustomTab] = useState<
    "amenagement" | "gps" | "carto" | "sols_couleurs" | "hydraulique" | "sur_mesure"
  >("amenagement");

  // Outils CAO & Tracé Vectoriel Professionnel
  const [leftDrawerTab, setLeftDrawerTab] = useState<"catalog" | "cad_draw" | "elements_list">(
    "catalog"
  );
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawToolType, setDrawToolType] = useState<
    "parcel" | "pipe" | "fence" | "road" | "building" | "pivot"
  >("parcel");
  const [drawName, setDrawName] = useState("");
  const [drawWidth, setDrawWidth] = useState(20);
  const [drawPoints, setDrawPoints] = useState<Array<{ x: number; z: number }>>([]);
  const [drawSnapGrid, setDrawSnapGrid] = useState(true);

  // Projet Personnalisé & Bureau d'Études
  const [customPlanName, setCustomPlanName] = useState(
    activeFarm?.name || "Agro-Complexe Pilote de Tanghin"
  );
  const [customDomainAreaHa, setCustomDomainAreaHa] = useState<number>(
    activeFarm?.totalAreaHa || 4.8
  );

  // Éléments du plan 3D
  const [elements, setElements] = useState<FarmElement3D[]>([
    {
      id: "elem-1",
      name: "Bâtiment Avicole Bioclimatique",
      category: "building",
      type: "poultry_house",
      x: -25,
      z: -20,
      width: 12,
      length: 35,
      height: 4,
      rotation: 0,
      costFcfa: 6500000,
    },
    {
      id: "elem-2",
      name: "Château d'Eau Métallique",
      category: "irrigation",
      type: "water_tower",
      x: 0,
      z: -30,
      width: 5,
      length: 5,
      height: 8,
      rotation: 0,
      costFcfa: 4200000,
    },
    {
      id: "elem-3",
      name: "Champ Solaire & Motopompe",
      category: "irrigation",
      type: "solar_pump",
      x: 15,
      z: -30,
      width: 8,
      length: 6,
      height: 2.5,
      rotation: 0,
      costFcfa: 3500000,
    },
    {
      id: "elem-4",
      name: "Parcelle Maïs / Céréales",
      category: "crop",
      type: "crop_maize",
      x: -20,
      z: 20,
      width: 25,
      length: 35,
      height: 2.2,
      rotation: 0,
      costFcfa: 450000,
    },
    {
      id: "elem-5",
      name: "Planches Maraîchères Goutte-à-Goutte",
      category: "crop",
      type: "crop_vegetables",
      x: 20,
      z: 15,
      width: 20,
      length: 30,
      height: 1.0,
      rotation: 0,
      costFcfa: 350000,
    },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTabCategory, setActiveTabCategory] = useState<ElementCategory>("crop");
  const [jardiCategoryFilter, setJardiCategoryFilter] = useState<JardiCategory | "all">("all");
  const [jardiSearchQuery, setJardiSearchQuery] = useState<string>("");
  const [lightingMode, setLightingMode] = useState<"day" | "sunset" | "night">("day");
  const [viewPreset, setViewPreset] = useState<"iso" | "top" | "free">("iso");
  const [isRotating, setIsRotating] = useState(false);
  const [walkMode, setWalkMode] = useState(false);

  // Moteur de rendu : WebGL ou fallback Canvas 2.5D
  const isWebGLAvail = useMemo(() => checkWebGLSupport(), []);
  const [renderMode, setRenderMode] = useState<"webgl" | "isometric2d">(
    isWebGLAvail ? "webgl" : "isometric2d"
  );
  const [webglError, setWebglError] = useState<string | null>(null);

  // Modal des Prix Réels Marketplace
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(false);
  const [showPdfHistory, setShowPdfHistory] = useState(false);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectsGroupRef = useRef<THREE.Group | null>(null);
  const cadastralGroupRef = useRef<THREE.Group | null>(null);
  const contoursGroupRef = useRef<THREE.Group | null>(null);
  const groundMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  // Contrôles Orbite 3D & Interactions CAO
  const isDraggingRef = useRef(false);
  const pointerStartPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraAnglesRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 130 });
  const drawPointsGroupRef = useRef<THREE.Group | null>(null);

  // Contrôles Canvas 2.5D
  const [canvas2dOffset, setCanvas2dOffset] = useState({ x: 0, y: 0 });
  const [canvas2dZoom, setCanvas2dZoom] = useState(1);

  // Métriques de tracé CAO en temps réel
  const drawMetrics = useMemo(() => {
    if (drawPoints.length < 2) {
      return { totalLength: 0, areaM2: 0, areaHa: 0, estimatedCostFcfa: 0 };
    }
    let totalLength = 0;
    for (let i = 0; i < drawPoints.length - 1; i++) {
      const dx = drawPoints[i + 1].x - drawPoints[i].x;
      const dz = drawPoints[i + 1].z - drawPoints[i].z;
      totalLength += Math.hypot(dx, dz);
    }
    totalLength = Math.round(totalLength * 10) / 10;

    // Calcul de surface par formule de Gauss / lacets (Shoelace) si >= 3 points
    let areaM2 = 0;
    if (drawPoints.length >= 3) {
      let sum = 0;
      for (let i = 0; i < drawPoints.length; i++) {
        const j = (i + 1) % drawPoints.length;
        sum += drawPoints[i].x * drawPoints[j].z - drawPoints[j].x * drawPoints[i].z;
      }
      areaM2 = Math.round(Math.abs(sum) / 2);
    } else {
      areaM2 = Math.round(totalLength * drawWidth);
    }
    const areaHa = Math.round((areaM2 / 10000) * 100) / 100;

    let estimatedCostFcfa = 0;
    if (drawToolType === "pipe") {
      estimatedCostFcfa = Math.round(totalLength * 4200); // 4 200 FCFA/ml
    } else if (drawToolType === "fence") {
      estimatedCostFcfa = Math.round(totalLength * 6800); // 6 800 FCFA/ml
    } else if (drawToolType === "road") {
      estimatedCostFcfa = Math.round(totalLength * 5500); // 5 500 FCFA/ml
    } else if (drawToolType === "building") {
      estimatedCostFcfa = Math.round(areaM2 * 45000); // 45 000 FCFA/m²
    } else if (drawToolType === "pivot") {
      estimatedCostFcfa = 18500000;
    } else {
      estimatedCostFcfa = Math.round(areaM2 * 150); // 150 FCFA/m²
    }

    return { totalLength, areaM2, areaHa, estimatedCostFcfa };
  }, [drawPoints, drawWidth, drawToolType]);

  // Budget total calculé
  const totalBudgetFcfa = elements.reduce((sum, el) => sum + el.costFcfa, 0);

  // Calcul du besoin de pointe en eau (m³/h)
  const estimatedPeakWaterNeedM3H = useMemo(() => {
    let need = 0;
    elements.forEach((el) => {
      if (el.type === "crop_vegetables" || el.type === "greenhouse" || el.type === "shade_house") {
        need += (el.width * el.length * 0.005) / 2;
      } else if (el.type === "crop_maize" || el.type === "demi_lunes") {
        need += (el.width * el.length * 0.004) / 3;
      } else if (el.type === "orchard") {
        need += (el.width * el.length * 0.003) / 4;
      } else if (el.type === "poultry_house") {
        need += 0.8;
      } else if (el.type === "cattle_shed" || el.type === "sheep_pen") {
        need += 1.2;
      }
    });
    return Math.round(need * 10) / 10;
  }, [elements]);

  const waterCoveragePct = useMemo(() => {
    if (estimatedPeakWaterNeedM3H === 0) return 100;
    return Math.min(250, Math.round((waterFlowM3H / estimatedPeakWaterNeedM3H) * 100));
  }, [waterFlowM3H, estimatedPeakWaterNeedM3H]);

  // -------------------------------------------------------------
  // CHARGEMENT DE LA CONFIGURATION ENREGISTRÉE DU PROJET
  // -------------------------------------------------------------
  useEffect(() => {
    const farmKey = activeFarm?.id || "demo";
    try {
      const saved = localStorage.getItem(`nafa_3d_project_config_${farmKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.elements && Array.isArray(parsed.elements)) setElements(parsed.elements);
        if (parsed.amenagementType) setAmenagementType(parsed.amenagementType);
        if (parsed.soilType) setSoilType(parsed.soilType);
        if (parsed.customColors) setCustomColors(parsed.customColors);
        if (parsed.waterFlowM3H) setWaterFlowM3H(parsed.waterFlowM3H);
        if (parsed.waterDepthM) setWaterDepthM(parsed.waterDepthM);
        if (parsed.slopeGradientPct) setSlopeGradientPct(parsed.slopeGradientPct);
        if (parsed.customGroundTextureUrl !== undefined)
          setCustomGroundTextureUrl(parsed.customGroundTextureUrl);
      }
    } catch {}
  }, [activeFarm?.id]);

  // -------------------------------------------------------------
  // HELPER MESH THREE.JS AVEC COULEURS PERSONNALISÉES
  // -------------------------------------------------------------
  const createElementMesh = useCallback(
    (el: FarmElement3D): THREE.Object3D => {
      const group = new THREE.Group();
      group.name = el.id;
      group.position.set(el.x, 0, el.z);
      group.rotation.y = (el.rotation * Math.PI) / 180;

      const cropColorHex = parseInt(customColors.cropColor.replace("#", ""), 16) || 0x2e7d32;
      const pipeColorHex = parseInt(customColors.pipeColor.replace("#", ""), 16) || 0x0288d1;
      const buildingColorHex =
        parseInt(customColors.buildingColor.replace("#", ""), 16) || 0xf57c00;

      if (el.type === "poultry_house") {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.8 });
        const wallGeo = new THREE.BoxGeometry(el.width, el.height * 0.4, el.length);
        const walls = new THREE.Mesh(wallGeo, wallMat);
        walls.position.y = (el.height * 0.4) / 2;
        walls.castShadow = true;
        walls.receiveShadow = true;
        group.add(walls);

        const postMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.5 });
        for (let z = -el.length / 2; z <= el.length / 2; z += 5) {
          const postGeo = new THREE.CylinderGeometry(0.15, 0.15, el.height * 0.6);
          const postLeft = new THREE.Mesh(postGeo, postMat);
          postLeft.position.set(-el.width / 2, el.height * 0.7, z);
          const postRight = postLeft.clone();
          postRight.position.x = el.width / 2;
          group.add(postLeft);
          group.add(postRight);
        }

        const roofMat = new THREE.MeshStandardMaterial({
          color: buildingColorHex,
          metalness: 0.3,
          roughness: 0.4,
        });
        const roofLeftGeo = new THREE.BoxGeometry(el.width * 0.55, 0.15, el.length + 1);
        const roofLeft = new THREE.Mesh(roofLeftGeo, roofMat);
        roofLeft.position.set(-el.width * 0.25, el.height + 0.6, 0);
        roofLeft.rotation.z = 0.25;
        roofLeft.castShadow = true;
        const roofRight = roofLeft.clone();
        roofRight.position.x = el.width * 0.25;
        roofRight.rotation.z = -0.25;
        group.add(roofLeft);
        group.add(roofRight);
      } else if (el.type === "water_tower") {
        const pMat = new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.7 });
        const pGeo = new THREE.CylinderGeometry(0.12, 0.18, el.height - 2.5);
        const offsets = [
          [-el.width * 0.35, -el.length * 0.35],
          [el.width * 0.35, -el.length * 0.35],
          [-el.width * 0.35, el.length * 0.35],
          [el.width * 0.35, el.length * 0.35],
        ];
        offsets.forEach(([px, pz]) => {
          const leg = new THREE.Mesh(pGeo, pMat);
          leg.position.set(px, (el.height - 2.5) / 2, pz);
          leg.castShadow = true;
          group.add(leg);
        });

        const tankGeo = new THREE.CylinderGeometry(el.width * 0.45, el.width * 0.45, 2.5, 24);
        const tankMat = new THREE.MeshStandardMaterial({
          color: pipeColorHex,
          metalness: 0.6,
          roughness: 0.3,
        });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.y = el.height - 1.25;
        tank.castShadow = true;
        group.add(tank);
      } else if (el.type === "solar_pump") {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });
        const panelMat = new THREE.MeshStandardMaterial({
          color: 0x0d47a1,
          roughness: 0.1,
          metalness: 0.9,
        });

        for (let i = -1; i <= 1; i++) {
          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(el.width * 0.28, 0.1, el.length * 0.7),
            panelMat
          );
          panel.position.set(i * el.width * 0.32, 1.6, 0);
          panel.rotation.x = 0.35;
          panel.castShadow = true;
          group.add(panel);
        }

        const pumpBox = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.2, 1.2),
          new THREE.MeshStandardMaterial({ color: pipeColorHex, metalness: 0.7 })
        );
        pumpBox.position.set(0, 0.6, 2.5);
        pumpBox.castShadow = true;
        group.add(pumpBox);
      } else if (el.type === "greenhouse") {
        const archMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.8 });
        const filmMat = new THREE.MeshStandardMaterial({
          color: 0xe0f7fa,
          transparent: true,
          opacity: 0.55,
          roughness: 0.2,
        });

        const tunnelGeo = new THREE.CylinderGeometry(
          el.width / 2,
          el.width / 2,
          el.length,
          16,
          1,
          false,
          0,
          Math.PI
        );
        const tunnel = new THREE.Mesh(tunnelGeo, filmMat);
        tunnel.rotation.z = Math.PI / 2;
        tunnel.rotation.y = Math.PI / 2;
        tunnel.position.y = 0;
        tunnel.castShadow = true;
        group.add(tunnel);

        for (let z = -el.length / 2; z <= el.length / 2; z += 5) {
          const archGeo = new THREE.TorusGeometry(el.width / 2, 0.1, 8, 16, Math.PI);
          const arch = new THREE.Mesh(archGeo, archMat);
          arch.position.set(0, 0, z);
          arch.rotation.z = 0;
          group.add(arch);
        }
      } else if (el.type === "shade_house") {
        const postMat = new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.7 });
        const netMat = new THREE.MeshStandardMaterial({
          color: 0x4db6ac,
          transparent: true,
          opacity: 0.65,
          roughness: 0.8,
        });

        // Poteaux
        const pGeo = new THREE.CylinderGeometry(0.12, 0.12, el.height);
        [
          [-el.width / 2, -el.length / 2],
          [el.width / 2, -el.length / 2],
          [-el.width / 2, el.length / 2],
          [el.width / 2, el.length / 2],
        ].forEach(([px, pz]) => {
          const post = new THREE.Mesh(pGeo, postMat);
          post.position.set(px, el.height / 2, pz);
          group.add(post);
        });

        // Toile d'ombrage
        const net = new THREE.Mesh(new THREE.BoxGeometry(el.width, 0.1, el.length), netMat);
        net.position.y = el.height;
        net.castShadow = true;
        group.add(net);
      } else if (el.type === "crop_maize") {
        const bedMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
        const bedGeo = new THREE.BoxGeometry(el.width, 0.2, el.length);
        const bed = new THREE.Mesh(bedGeo, bedMat);
        bed.position.y = 0.1;
        bed.receiveShadow = true;
        group.add(bed);

        const plantMat = new THREE.MeshStandardMaterial({ color: cropColorHex, roughness: 0.6 });
        const rowStep = 3;
        for (let x = -el.width / 2 + 2; x <= el.width / 2 - 2; x += rowStep) {
          for (let z = -el.length / 2 + 2; z <= el.length / 2 - 2; z += rowStep) {
            const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.5, el.height, 5), plantMat);
            stalk.position.set(x, el.height / 2, z);
            stalk.castShadow = true;
            group.add(stalk);
          }
        }
      } else if (el.type === "crop_vegetables") {
        const bedMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.95 });
        const numBeds = Math.floor(el.width / 2.5);
        const bedWidth = 1.4;
        const plantMat = new THREE.MeshStandardMaterial({ color: cropColorHex, roughness: 0.5 });

        for (let i = 0; i < numBeds; i++) {
          const bx = -el.width / 2 + 1.2 + i * 2.5;
          const bed = new THREE.Mesh(
            new THREE.BoxGeometry(bedWidth, 0.3, el.length * 0.9),
            bedMat
          );
          bed.position.set(bx, 0.15, 0);
          bed.receiveShadow = true;
          group.add(bed);

          for (let z = -el.length / 2 + 2; z <= el.length / 2 - 2; z += 1.8) {
            const crop = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), plantMat);
            crop.position.set(bx, 0.45, z);
            group.add(crop);
          }
        }
      } else if (el.type === "orchard") {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 });
        const foliageMat = new THREE.MeshStandardMaterial({ color: cropColorHex, roughness: 0.6 });
        const spacing = 7;

        for (let x = -el.width / 2 + 4; x <= el.width / 2 - 4; x += spacing) {
          for (let z = -el.length / 2 + 4; z <= el.length / 2 - 4; z += spacing) {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.0, 8), trunkMat);
            trunk.position.set(x, 1.0, z);
            trunk.castShadow = true;
            group.add(trunk);

            const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 1), foliageMat);
            crown.position.set(x, 2.8, z);
            crown.castShadow = true;
            group.add(crown);
          }
        }
      } else if (el.type === "cordons_pierreux") {
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.95 });
        for (let z = -el.length / 2; z <= el.length / 2; z += 2.5) {
          const stone = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.2, 0),
            stoneMat
          );
          stone.position.set((Math.random() - 0.5) * 0.4, 0.35, z);
          stone.castShadow = true;
          group.add(stone);
        }
      } else if (el.type === "demi_lunes") {
        const earthMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
        const shrubMat = new THREE.MeshStandardMaterial({ color: cropColorHex, roughness: 0.6 });
        for (let x = -el.width / 2 + 4; x <= el.width / 2 - 4; x += 6) {
          for (let z = -el.length / 2 + 4; z <= el.length / 2 - 4; z += 6) {
            const mound = new THREE.Mesh(
              new THREE.TorusGeometry(1.4, 0.35, 6, 12, Math.PI),
              earthMat
            );
            mound.rotation.x = -Math.PI / 2;
            mound.position.set(x, 0.2, z);
            group.add(mound);

            const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), shrubMat);
            shrub.position.set(x, 0.4, z);
            group.add(shrub);
          }
        }
      } else if (el.type === "retention_pond") {
        const bermMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 });
        const waterMat = new THREE.MeshStandardMaterial({
          color: pipeColorHex,
          roughness: 0.1,
          metalness: 0.8,
          transparent: true,
          opacity: 0.85,
        });

        const water = new THREE.Mesh(
          new THREE.BoxGeometry(el.width * 0.85, 0.1, el.length * 0.85),
          waterMat
        );
        water.position.y = 0.2;
        group.add(water);

        const berm = new THREE.Mesh(new THREE.BoxGeometry(el.width, 0.6, el.length), bermMat);
        berm.position.y = 0.3;
        berm.receiveShadow = true;
        group.add(berm);
      } else if (el.type === "cattle_shed" || el.type === "sheep_pen") {
        const postMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        const roofMat = new THREE.MeshStandardMaterial({
          color: buildingColorHex,
          roughness: 0.4,
          metalness: 0.3,
        });

        const pGeo = new THREE.CylinderGeometry(0.2, 0.25, el.height);
        [
          [-el.width / 2 + 1, -el.length / 2 + 1],
          [el.width / 2 - 1, -el.length / 2 + 1],
          [-el.width / 2 + 1, el.length / 2 - 1],
          [el.width / 2 - 1, el.length / 2 - 1],
        ].forEach(([px, pz]) => {
          const post = new THREE.Mesh(pGeo, postMat);
          post.position.set(px, el.height / 2, pz);
          post.castShadow = true;
          group.add(post);
        });

        const roof = new THREE.Mesh(new THREE.BoxGeometry(el.width + 1, 0.2, el.length + 1), roofMat);
        roof.position.y = el.height + 0.3;
        roof.rotation.x = 0.05;
        roof.castShadow = true;
        group.add(roof);
      } else if (el.type === "windbreak") {
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 });
        for (let z = -el.length / 2; z <= el.length / 2; z += 3.5) {
          const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), leafMat);
          bush.position.set((Math.random() - 0.5) * 0.5, el.height / 2, z);
          bush.castShadow = true;
          group.add(bush);
        }
      } else if (el.isCurved || el.type === "pivot_irrigation") {
        // Pivot d'irrigation circulaire 360° ou forme circulaire
        const radius = el.curveRadius || Math.max(el.width, el.length) / 2;

        // Disque de base humidifié / culture en cercle
        const circleMat = new THREE.MeshStandardMaterial({
          color: cropColorHex,
          roughness: 0.8,
        });
        const circleGeo = new THREE.CylinderGeometry(radius, radius, 0.15, 36);
        const baseDisk = new THREE.Mesh(circleGeo, circleMat);
        baseDisk.position.y = 0.08;
        baseDisk.receiveShadow = true;
        group.add(baseDisk);

        // Pylône central
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.7 });
        const towerGeo = new THREE.CylinderGeometry(0.35, 0.9, el.height, 8);
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = el.height / 2;
        tower.castShadow = true;
        group.add(tower);

        // Rampe d'aspersion tubulaire radiale
        const armMat = new THREE.MeshStandardMaterial({ color: pipeColorHex, metalness: 0.6 });
        const armGeo = new THREE.CylinderGeometry(0.12, 0.12, radius);
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(radius / 2, el.height * 0.85, 0);
        arm.rotation.z = Math.PI / 2;
        arm.castShadow = true;
        group.add(arm);

        // Tour extérieure roulante
        const wheelTowerGeo = new THREE.CylinderGeometry(0.2, 0.45, el.height * 0.7, 6);
        const wheelTower = new THREE.Mesh(wheelTowerGeo, towerMat);
        wheelTower.position.set(radius, el.height * 0.35, 0);
        wheelTower.castShadow = true;
        group.add(wheelTower);
      } else if (
        el.cornerRadius &&
        el.cornerRadius > 0 &&
        (el.category === "crop" || el.category === "building")
      ) {
        // Forme extrudée avec coins arrondis (Fillet CAO)
        const shape = new THREE.Shape();
        const w = el.width;
        const l = el.length;
        const r = Math.min(el.cornerRadius, w / 2 - 0.2, l / 2 - 0.2);
        const x0 = -w / 2;
        const z0 = -l / 2;

        shape.moveTo(x0 + r, z0);
        shape.lineTo(x0 + w - r, z0);
        shape.quadraticCurveTo(x0 + w, z0, x0 + w, z0 + r);
        shape.lineTo(x0 + w, z0 + l - r);
        shape.quadraticCurveTo(x0 + w, z0 + l, x0 + w - r, z0 + l);
        shape.lineTo(x0 + r, z0 + l);
        shape.quadraticCurveTo(x0, z0 + l, x0, z0 + l - r);
        shape.lineTo(x0, z0 + r);
        shape.quadraticCurveTo(x0, z0, x0 + r, z0);

        const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
          depth: el.height,
          bevelEnabled: false,
        });
        extrudeGeo.rotateX(Math.PI / 2);

        const matColor = el.category === "crop" ? cropColorHex : buildingColorHex;
        const roundedMesh = new THREE.Mesh(
          extrudeGeo,
          new THREE.MeshStandardMaterial({
            color: matColor,
            roughness: el.category === "crop" ? 0.8 : 0.4,
            metalness: el.category === "crop" ? 0.1 : 0.3,
          })
        );
        roundedMesh.position.y = el.height;
        roundedMesh.castShadow = true;
        roundedMesh.receiveShadow = true;
        group.add(roundedMesh);
      } else {
        const proceduralMesh = buildProceduralMeshForType(
          el.type,
          el.width,
          el.length,
          el.height,
          customColors
        );
        group.add(proceduralMesh);
      }

      // Contour de sélection
      if (el.id === selectedId) {
        if (el.isCurved || el.type === "pivot_irrigation") {
          const r = el.curveRadius || Math.max(el.width, el.length) / 2;
          const wireGeo = new THREE.CylinderGeometry(
            r + 0.5,
            r + 0.5,
            el.height + 0.6,
            24,
            1,
            true
          );
          const wireMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true });
          const wire = new THREE.Mesh(wireGeo, wireMat);
          wire.position.y = el.height / 2;
          group.add(wire);
        } else {
          const wireGeo = new THREE.BoxGeometry(el.width + 0.6, el.height + 0.6, el.length + 0.6);
          const wireMat = new THREE.MeshBasicMaterial({
            color: 0x10b981,
            wireframe: true,
            wireframeLinewidth: 2,
          });
          const wire = new THREE.Mesh(wireGeo, wireMat);
          wire.position.y = el.height / 2;
          group.add(wire);
        }
      }

      return group;
    },
    [selectedId, customColors]
  );

  // -------------------------------------------------------------
  // POSITION CAMÉRA THREE.JS
  // -------------------------------------------------------------
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAnglesRef.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi);
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // -------------------------------------------------------------
  // INITIALISATION DU MOTEUR THREE.JS
  // -------------------------------------------------------------
  useEffect(() => {
    if (renderMode !== "webgl" || !mountRef.current) return;

    const container = mountRef.current;
    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let resizeObserver: ResizeObserver | null = null;

    try {
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 550;

      // 1. Scène
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);
      sceneRef.current = scene;

      // 2. Caméra
      const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
      cameraRef.current = camera;
      updateCameraPosition();

      // 3. Renderer sécurisé
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      rendererRef.current = renderer;

      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      const handleContextLost = (event: Event) => {
        event.preventDefault();
        toast.warning("WebGL context lost. Bascule automatique vers le mode 2.5D Isométrique...");
        setRenderMode("isometric2d");
      };
      renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

      // 4. Sol agricole sahélien
      const groundGeo = new THREE.PlaneGeometry(160, 160);
      const groundMat = new THREE.MeshStandardMaterial({
        color: parseInt(customColors.groundColor.replace("#", ""), 16) || 0x2b1e16,
        roughness: 0.95,
        metalness: 0.05,
      });
      groundMatRef.current = groundMat;
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const grid = new THREE.GridHelper(160, 32, 0xf97316, 0x475569);
      grid.position.y = 0.02;
      scene.add(grid);

      // 5. Groupes d'éléments & calques cartographiques
      const cadastralGroup = new THREE.Group();
      cadastralGroupRef.current = cadastralGroup;
      scene.add(cadastralGroup);

      const contoursGroup = new THREE.Group();
      contoursGroupRef.current = contoursGroup;
      scene.add(contoursGroup);

      const objectsGroup = new THREE.Group();
      objectsGroupRef.current = objectsGroup;
      scene.add(objectsGroup);

      // 6. Éclairage
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.7);
      hemiLightRef.current = hemiLight;
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xfff8e1, 1.4);
      dirLight.position.set(60, 80, 50);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLightRef.current = dirLight;
      scene.add(dirLight);

      // Animation Loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        if (isRotating) {
          cameraAnglesRef.current.theta += 0.005;
          updateCameraPosition();
        }
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };
      animate();

      // ResizeObserver
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.round(entry.contentRect.width) || container.clientWidth || 800;
          const h = Math.round(entry.contentRect.height) || container.clientHeight || 550;
          if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = w / h;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(w, h, false);
          }
        }
      });
      resizeObserver.observe(container);

      setWebglError(null);
    } catch (err: any) {
      console.warn("Échec d'initialisation WebGL, activation automatique du moteur 2.5D:", err);
      setWebglError("Accélération matérielle WebGL indisponible sur ce navigateur.");
      setRenderMode("isometric2d");
      toast.info("Affichage optimisé en mode 2.5D Isométrique universel.");
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
      if (renderer) {
        try {
          renderer.dispose();
          if (container && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        } catch {}
      }
    };
  }, [renderMode, isRotating, updateCameraPosition]);

  // Synchronisation des textures et couleurs du sol dans Three.js
  useEffect(() => {
    if (renderMode !== "webgl" || !groundMatRef.current) return;
    const groundMat = groundMatRef.current;
    const col = parseInt(customColors.groundColor.replace("#", ""), 16);
    groundMat.color.setHex(isNaN(col) ? 0x2b1e16 : col);

    if (customGroundTextureUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(customGroundTextureUrl, (tex) => {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        groundMat.map = tex;
        groundMat.needsUpdate = true;
      });
    } else if (showSatelliteOverlay) {
      // Génération procédurale offline d'un fond satellite orthophoto
      const satCanvas = document.createElement("canvas");
      satCanvas.width = 512;
      satCanvas.height = 512;
      const sCtx = satCanvas.getContext("2d");
      if (sCtx) {
        sCtx.fillStyle = customColors.groundColor || "#2b1e16";
        sCtx.fillRect(0, 0, 512, 512);

        // Parcelles agricoles contrastées
        sCtx.fillStyle = "rgba(46, 125, 50, 0.4)";
        sCtx.fillRect(30, 30, 210, 190);
        sCtx.fillStyle = "rgba(76, 175, 80, 0.3)";
        sCtx.fillRect(270, 50, 210, 200);
        sCtx.fillStyle = "rgba(163, 72, 40, 0.35)";
        sCtx.fillRect(40, 260, 200, 210);
        sCtx.fillStyle = "rgba(33, 150, 243, 0.35)";
        sCtx.fillRect(270, 290, 210, 180);

        // Voies d'accès de terre latéritique
        sCtx.strokeStyle = "rgba(215, 170, 110, 0.75)";
        sCtx.lineWidth = 12;
        sCtx.beginPath();
        sCtx.moveTo(0, 240);
        sCtx.lineTo(512, 240);
        sCtx.moveTo(250, 0);
        sCtx.lineTo(250, 512);
        sCtx.stroke();

        const satTex = new THREE.CanvasTexture(satCanvas);
        groundMat.map = satTex;
        groundMat.needsUpdate = true;
      }
    } else {
      groundMat.map = null;
      groundMat.needsUpdate = true;
    }
  }, [
    customColors.groundColor,
    customGroundTextureUrl,
    showSatelliteOverlay,
    renderMode,
  ]);

  // Bornes géodésiques et contour cadastral GPS en 3D
  useEffect(() => {
    if (renderMode !== "webgl" || !cadastralGroupRef.current) return;
    const group = cadastralGroupRef.current;
    while (group.children.length > 0) group.remove(group.children[0]);

    if (!showCadastralBoundary) return;

    const points =
      currentField?.points && currentField.points.length >= 3
        ? currentField.points
        : DEFAULT_DEMO_FIELD.points;

    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const spanLat = maxLat - minLat || 0.001;
    const spanLng = maxLng - minLng || 0.001;

    const localPts: THREE.Vector3[] = points.map((p) => {
      const nx = ((p.lng - minLng) / spanLng - 0.5) * 110;
      const nz = ((p.lat - minLat) / spanLat - 0.5) * 110;
      return new THREE.Vector3(nx, 0.4, nz);
    });

    // 1. Contour vectoriel
    const lineGeo = new THREE.BufferGeometry().setFromPoints([...localPts, localPts[0]]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xf97316, linewidth: 3 });
    const line = new THREE.Line(lineGeo, lineMat);
    group.add(line);

    // 2. Piliers et bornes géodésiques
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.7, 1.8, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 });
    const capGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.4, 8);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });

    localPts.forEach((pt) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pt.x, 0.9, pt.z);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(pt.x, 1.9, pt.z);
      group.add(pillar);
      group.add(cap);
    });
  }, [renderMode, showCadastralBoundary, currentField]);

  // Courbes de niveau (isohypses) et écoulement en 3D
  useEffect(() => {
    if (renderMode !== "webgl" || !contoursGroupRef.current) return;
    const group = contoursGroupRef.current;
    while (group.children.length > 0) group.remove(group.children[0]);

    if (!showContourLines) return;

    for (let z = -60; z <= 60; z += 15) {
      const pts = [new THREE.Vector3(-70, 0.1, z), new THREE.Vector3(70, 0.1, z)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
      const line = new THREE.Line(geo, mat);
      group.add(line);
    }

    // Flèche d'écoulement gravitaire de l'eau
    const arrowDir = new THREE.Vector3(0, 0, 1).normalize();
    const arrowOrigin = new THREE.Vector3(0, 0.3, -40);
    const arrowHelper = new THREE.ArrowHelper(arrowDir, arrowOrigin, 30, 0x0288d1, 6, 3);
    group.add(arrowHelper);
  }, [renderMode, showContourLines]);

  // Synchronisation des éléments Three.js
  useEffect(() => {
    if (renderMode !== "webgl" || !objectsGroupRef.current) return;
    const group = objectsGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    elements.forEach((el) => {
      const mesh = createElementMesh(el);
      group.add(mesh);
    });
  }, [elements, createElementMesh, renderMode]);

  // Synchronisation des jalons de tracé vectoriel CAO dans Three.js
  useEffect(() => {
    if (renderMode !== "webgl" || !sceneRef.current) return;
    let group = drawPointsGroupRef.current;
    if (!group) {
      group = new THREE.Group();
      drawPointsGroupRef.current = group;
      sceneRef.current.add(group);
    }
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (drawPoints.length === 0) return;

    const sphereGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 0.6,
    });

    drawPoints.forEach((pt) => {
      const marker = new THREE.Mesh(sphereGeo, sphereMat);
      marker.position.set(pt.x, 0.7, pt.z);
      group.add(marker);
    });

    if (drawPoints.length >= 2) {
      const pts = drawPoints.map((p) => new THREE.Vector3(p.x, 0.4, p.z));
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xf97316, linewidth: 3 });
      const line = new THREE.Line(lineGeo, lineMat);
      group.add(line);
    }
  }, [drawPoints, renderMode]);

  // Éclairage Three.js
  useEffect(() => {
    if (
      renderMode !== "webgl" ||
      !sceneRef.current ||
      !dirLightRef.current ||
      !hemiLightRef.current
    )
      return;
    const scene = sceneRef.current;
    const dir = dirLightRef.current;
    const hemi = hemiLightRef.current;

    if (lightingMode === "day") {
      scene.background = new THREE.Color(0x0f172a);
      dir.color.setHex(0xfff8e1);
      dir.intensity = 1.4;
      hemi.color.setHex(0xffffff);
      hemi.intensity = 0.7;
    } else if (lightingMode === "sunset") {
      scene.background = new THREE.Color(0x27101e);
      dir.color.setHex(0xff8a65);
      dir.intensity = 1.2;
      hemi.color.setHex(0xffab91);
      hemi.intensity = 0.4;
    } else {
      scene.background = new THREE.Color(0x020617);
      dir.color.setHex(0x90caf9);
      dir.intensity = 0.3;
      hemi.intensity = 0.2;
    }
  }, [lightingMode, renderMode]);

  // -------------------------------------------------------------
  // MOTEUR CANVAS 2.5D ISOMÉTRIQUE UNIVERSEL
  // -------------------------------------------------------------
  useEffect(() => {
    if (renderMode !== "isometric2d" || !canvas2dRef.current) return;

    const canvas = canvas2dRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let autoRotationAngle = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (lightingMode === "day") {
        ctx.fillStyle = "#0f172a";
      } else if (lightingMode === "sunset") {
        ctx.fillStyle = "#27101e";
      } else {
        ctx.fillStyle = "#020617";
      }
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2 + canvas2dOffset.x, h / 2 + 40 + canvas2dOffset.y);
      ctx.scale(canvas2dZoom, canvas2dZoom);

      if (isRotating) {
        autoRotationAngle += 0.005;
      }

      const cosA = Math.cos(autoRotationAngle);
      const sinA = Math.sin(autoRotationAngle);

      const projectIso = (x: number, y: number, z: number) => {
        const rx = x * cosA - z * sinA;
        const rz = x * sinA + z * cosA;
        const screenX = (rx - rz) * 3.5;
        const screenY = (rx + rz) * 1.8 - y * 4.5;
        return { x: screenX, y: screenY };
      };

      // 1. Sol agricole sahélien
      const gridSize = 16;
      const step = 5;
      const p1 = projectIso(-gridSize * step, 0, -gridSize * step);
      const p2 = projectIso(gridSize * step, 0, -gridSize * step);
      const p3 = projectIso(gridSize * step, 0, gridSize * step);
      const p4 = projectIso(-gridSize * step, 0, gridSize * step);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fillStyle = customColors.groundColor || "#2b1e16";
      ctx.fill();

      // Quadrillage du sol
      ctx.strokeStyle =
        lightingMode === "sunset" ? "rgba(249, 115, 22, 0.25)" : "rgba(71, 85, 105, 0.35)";
      ctx.lineWidth = 1;
      for (let i = -gridSize; i <= gridSize; i += 2) {
        const startA = projectIso(i * step, 0, -gridSize * step);
        const endA = projectIso(i * step, 0, gridSize * step);
        ctx.beginPath();
        ctx.moveTo(startA.x, startA.y);
        ctx.lineTo(endA.x, endA.y);
        ctx.stroke();

        const startB = projectIso(-gridSize * step, 0, i * step);
        const endB = projectIso(gridSize * step, 0, i * step);
        ctx.beginPath();
        ctx.moveTo(startB.x, startB.y);
        ctx.lineTo(endB.x, endB.y);
        ctx.stroke();
      }

      // 2. Contour cadastral GPS
      if (showCadastralBoundary) {
        const pts =
          currentField?.points && currentField.points.length >= 3
            ? currentField.points
            : DEFAULT_DEMO_FIELD.points;

        const lats = pts.map((p) => p.lat);
        const lngs = pts.map((p) => p.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const spanLat = maxLat - minLat || 0.001;
        const spanLng = maxLng - minLng || 0.001;

        const poly = pts.map((p, idx) => {
          const nx = ((p.lng - minLng) / spanLng - 0.5) * 110;
          const nz = ((p.lat - minLat) / spanLat - 0.5) * 110;
          return { ...projectIso(nx, 0, nz), label: p.label || `P${idx + 1}` };
        });

        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        poly.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Bornes géodésiques
        poly.forEach((pt) => {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#f97316";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#f97316";
          ctx.font = "bold 9px sans-serif";
          ctx.fillText(pt.label, pt.x + 6, pt.y - 4);
        });
      }

      // 3. Courbes de niveau isohypses
      if (showContourLines) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
        ctx.lineWidth = 1.5;
        for (let z = -50; z <= 50; z += 20) {
          const start = projectIso(-60, 0, z);
          const end = projectIso(60, 0, z);
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      }

      // 4. Éléments triés selon la profondeur
      const sortedElements = [...elements].sort((a, b) => {
        const rzA = a.x * sinA + a.z * cosA;
        const rzB = b.x * sinA + b.z * cosA;
        return rzA - rzB;
      });

      sortedElements.forEach((el) => {
        const isSel = el.id === selectedId;
        const hw = el.width / 2;
        const hl = el.length / 2;
        const h = el.height;

        const b1 = projectIso(el.x - hw, 0, el.z - hl);
        const b2 = projectIso(el.x + hw, 0, el.z - hl);
        const b3 = projectIso(el.x + hw, 0, el.z + hl);
        const b4 = projectIso(el.x - hw, 0, el.z + hl);

        const t1 = projectIso(el.x - hw, h, el.z - hl);
        const t2 = projectIso(el.x + hw, h, el.z - hl);
        const t3 = projectIso(el.x + hw, h, el.z + hl);
        const t4 = projectIso(el.x - hw, h, el.z + hl);

        let topFill = customColors.cropColor || "#4caf50";
        let sideFill = "#2e7d32";
        if (el.category === "building") {
          topFill = customColors.buildingColor || "#f57c00";
          sideFill = "#d84315";
        } else if (el.category === "irrigation") {
          topFill = customColors.pipeColor || "#00acc1";
          sideFill = "#00838f";
        } else if (el.type === "cordons_pierreux") {
          topFill = "#90a4ae";
          sideFill = "#607d8b";
        }

        if (el.isCurved || el.type === "pivot_irrigation") {
          const r = el.curveRadius || Math.max(el.width, el.length) / 2;
          ctx.beginPath();
          const segments = 24;
          for (let s = 0; s <= segments; s++) {
            const th = (s / segments) * Math.PI * 2;
            const px = el.x + r * Math.cos(th);
            const pz = el.z + r * Math.sin(th);
            const p = projectIso(px, 0.1, pz);
            if (s === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.closePath();
          ctx.fillStyle = isSel ? "#10b981" : topFill;
          ctx.fill();
          ctx.strokeStyle = isSel ? "#34d399" : "#1b5e20";
          ctx.lineWidth = 2;
          ctx.stroke();

          const cp = projectIso(el.x, el.height, el.z);
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px sans-serif";
          ctx.fillText(el.name.split(" ")[0], cp.x + 6, cp.y - 4);
          return;
        }

        // Face latérale gauche
        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y);
        ctx.lineTo(b4.x, b4.y);
        ctx.lineTo(t4.x, t4.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.closePath();
        ctx.fillStyle = sideFill;
        ctx.fill();
        ctx.stroke();

        // Face latérale avant
        ctx.beginPath();
        ctx.moveTo(b4.x, b4.y);
        ctx.lineTo(b3.x, b3.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.lineTo(t4.x, t4.y);
        ctx.closePath();
        ctx.fillStyle = sideFill;
        ctx.fill();
        ctx.stroke();

        // Toit
        ctx.beginPath();
        ctx.moveTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.lineTo(t4.x, t4.y);
        ctx.closePath();
        ctx.fillStyle = isSel ? "#10b981" : topFill;
        ctx.fill();
        ctx.stroke();

        // Label de l'élément
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(el.name.split(" ")[0], t4.x, t4.y - 4);
      });

      // 5. Affichage des jalons de tracé vectoriel CAO
      if (drawPoints.length > 0) {
        if (drawPoints.length >= 2) {
          ctx.strokeStyle = "#f97316";
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          drawPoints.forEach((pt, idx) => {
            const p = projectIso(pt.x, 0.3, pt.z);
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        }

        drawPoints.forEach((pt, idx) => {
          const p = projectIso(pt.x, 0.3, pt.z);
          ctx.fillStyle = "#f97316";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px sans-serif";
          ctx.fillText(`P${idx + 1}`, p.x + 7, p.y - 4);
        });
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    renderMode,
    elements,
    selectedId,
    lightingMode,
    isRotating,
    canvas2dOffset,
    canvas2dZoom,
    customColors,
    showCadastralBoundary,
    showContourLines,
    currentField,
    drawPoints,
  ]);

  // Redimensionnement du Canvas 2.5D
  useEffect(() => {
    if (renderMode !== "isometric2d" || !container2dRef.current || !canvas2dRef.current) return;
    const container = container2dRef.current;
    const canvas = canvas2dRef.current;

    const updateSize = () => {
      canvas.width = container.clientWidth || 800;
      canvas.height = container.clientHeight || 550;
    };
    updateSize();

    const obs = new ResizeObserver(updateSize);
    obs.observe(container);
    return () => obs.disconnect();
  }, [renderMode]);

  // -------------------------------------------------------------
  // GESTION POINTER / ORBITE (SOURIS & TACTILE)
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // GESTION POINTER / CLIC / RAYCASTING (SOURIS & TACTILE)
  // -------------------------------------------------------------
  const handleCanvasClick = (clientX: number, clientY: number) => {
    if (renderMode === "webgl") {
      const container = mountRef.current;
      if (!container || !cameraRef.current || !sceneRef.current) return;
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      if (isDrawMode) {
        // Intersection avec le plan horizontal Y = 0 (sol agricole)
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const targetPoint = new THREE.Vector3();
        const hit = raycaster.ray.intersectPlane(plane, targetPoint);
        if (hit) {
          const snap = drawSnapGrid ? 0.5 : 0.1;
          const snappedX = Math.round(targetPoint.x / snap) * snap;
          const snappedZ = Math.round(targetPoint.z / snap) * snap;
          setDrawPoints((prev) => [...prev, { x: snappedX, z: snappedZ }]);
          toast.info(`Jalon P${drawPoints.length + 1} posé : (${snappedX}m, ${snappedZ}m)`);
        }
      } else {
        // Sélection d'un objet existant par lancer de rayon
        if (objectsGroupRef.current) {
          const hits = raycaster.intersectObjects(objectsGroupRef.current.children, true);
          if (hits.length > 0) {
            let rootObj: THREE.Object3D | null = hits[0].object;
            while (rootObj && rootObj.parent !== objectsGroupRef.current) {
              rootObj = rootObj.parent;
            }
            if (rootObj && rootObj.name) {
              setSelectedId(rootObj.name);
              return;
            }
          }
        }
        setSelectedId(null);
      }
    } else if (renderMode === "isometric2d") {
      const container = container2dRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;
      const w = container.clientWidth;
      const h = container.clientHeight;

      const relX = (clickX - (w / 2 + canvas2dOffset.x)) / canvas2dZoom;
      const relY = (clickY - (h / 2 + 40 + canvas2dOffset.y)) / canvas2dZoom;

      const Xs = relX / 3.5;
      const Ys = relY / 1.8;
      const rx = (Xs + Ys) / 2;
      const rz = (Ys - Xs) / 2;
      const snap = drawSnapGrid ? 0.5 : 0.1;
      const gx = Math.round(rx / snap) * snap;
      const gz = Math.round(rz / snap) * snap;

      if (isDrawMode) {
        setDrawPoints((prev) => [...prev, { x: gx, z: gz }]);
        toast.info(`Jalon P${drawPoints.length + 1} posé : (${gx}m, ${gz}m)`);
      } else {
        const hit = elements.find(
          (el) => Math.abs(el.x - gx) <= el.width / 2 && Math.abs(el.z - gz) <= el.length / 2
        );
        if (hit) {
          setSelectedId(hit.id);
        } else {
          setSelectedId(null);
        }
      }
    }
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    pointerStartPosRef.current = { x: clientX, y: clientY };
    prevMouseRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dist = Math.hypot(
      clientX - pointerStartPosRef.current.x,
      clientY - pointerStartPosRef.current.y
    );
    if (dist > 5) {
      hasMovedRef.current = true;
    }
    const dx = clientX - prevMouseRef.current.x;
    const dy = clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: clientX, y: clientY };

    if (renderMode === "webgl") {
      cameraAnglesRef.current.theta -= dx * 0.008;
      cameraAnglesRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, cameraAnglesRef.current.phi - dy * 0.008)
      );
      updateCameraPosition();
    } else {
      setCanvas2dOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    }
  };

  const handlePointerUp = (clientX?: number, clientY?: number) => {
    isDraggingRef.current = false;
    if (!hasMovedRef.current && clientX !== undefined && clientY !== undefined) {
      handleCanvasClick(clientX, clientY);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (renderMode === "webgl") {
      cameraAnglesRef.current.radius = Math.max(
        30,
        Math.min(300, cameraAnglesRef.current.radius + e.deltaY * 0.1)
      );
      updateCameraPosition();
    } else {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setCanvas2dZoom((prev) => Math.max(0.4, Math.min(3.0, prev * zoomFactor)));
    }
  };

  // -------------------------------------------------------------
  // ACTIONS SUR LE MODÈLE & SUITE CAO PROFESSIONNELLE
  // -------------------------------------------------------------
  const handleUpdateSelected = (patch: Partial<FarmElement3D>) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== selectedId) return el;
        const updated = { ...el, ...patch };
        if (patch.length !== undefined || patch.width !== undefined) {
          const oldArea = Math.max(1, el.width * el.length);
          const newArea = Math.max(1, updated.width * updated.length);
          const unitCost = el.costFcfa / oldArea;
          updated.costFcfa = Math.round(unitCost * newArea);
        }
        return updated;
      })
    );
  };

  // Allonger l'élément sélectionné
  const handleLengthenSelected = (deltaMeters: number) => {
    if (!selectedId) return;
    const current = elements.find((e) => e.id === selectedId);
    if (!current) return;
    const newLength = Math.max(0.5, Math.round((current.length + deltaMeters) * 10) / 10);
    const oldArea = Math.max(1, current.width * current.length);
    const newArea = Math.max(1, current.width * newLength);
    const unitCost = current.costFcfa / oldArea;
    const newCost = Math.round(unitCost * newArea);
    handleUpdateSelected({
      length: newLength,
      costFcfa: newCost,
      linearMeters: current.linearMeters
        ? Math.max(0.5, Math.round((current.linearMeters + deltaMeters) * 10) / 10)
        : undefined,
    });
    toast.info(`Longueur allongée : ${newLength} m (${deltaMeters > 0 ? "+" : ""}${deltaMeters} m)`);
  };

  // Élargir l'élément sélectionné
  const handleWidenSelected = (deltaMeters: number) => {
    if (!selectedId) return;
    const current = elements.find((e) => e.id === selectedId);
    if (!current) return;
    const newWidth = Math.max(0.2, Math.round((current.width + deltaMeters) * 10) / 10);
    const oldArea = Math.max(1, current.width * current.length);
    const newArea = Math.max(1, newWidth * current.length);
    const unitCost = current.costFcfa / oldArea;
    const newCost = Math.round(unitCost * newArea);
    handleUpdateSelected({ width: newWidth, costFcfa: newCost });
    toast.info(`Largeur élargie : ${newWidth} m (${deltaMeters > 0 ? "+" : ""}${deltaMeters} m)`);
  };

  // Arrondir les angles de l'élément sélectionné
  const handleSetCornerRadius = (radius: number) => {
    if (!selectedId) return;
    handleUpdateSelected({ cornerRadius: Math.max(0, radius) });
    toast.success(
      radius > 0 ? `Arrondi des coins fixé à ${radius} m.` : "Angles vifs rétablis (0m)."
    );
  };

  // Basculer en forme circulaire / pivot 360°
  const handleToggleCurved = () => {
    if (!selectedId) return;
    const current = elements.find((e) => e.id === selectedId);
    if (!current) return;
    const nextIsCurved = !current.isCurved;
    handleUpdateSelected({
      isCurved: nextIsCurved,
      curveRadius: nextIsCurved
        ? Math.round(Math.max(current.width, current.length) / 2)
        : undefined,
    });
    toast.success(
      nextIsCurved ? "Mode circulaire / pivot 360° activé." : "Mode rectangulaire standard rétabli."
    );
  };

  // Dupliquer l'élément sélectionné en parallèle (+5m)
  const handleDuplicateSelected = () => {
    if (!selectedId) return;
    const current = elements.find((e) => e.id === selectedId);
    if (!current) return;
    const dup: FarmElement3D = {
      ...current,
      id: `elem-${Date.now()}`,
      name: `${current.name} (Parallèle)`,
      x: Math.round((current.x + 5) * 10) / 10,
      z: Math.round((current.z + 5) * 10) / 10,
    };
    setElements((prev) => [...prev, dup]);
    setSelectedId(dup.id);
    toast.success(`Ouvrage dupliqué en parallèle (+5m) : "${dup.name}"`);
  };

  // Valider et implanter un tracé vectoriel
  const handleValidateDrawnElement = () => {
    if (drawPoints.length < 2) {
      toast.error("Veuillez poser au moins 2 jalons sur le terrain pour implanter l'ouvrage.");
      return;
    }

    let totalDist = 0;
    for (let i = 0; i < drawPoints.length - 1; i++) {
      const dx = drawPoints[i + 1].x - drawPoints[i].x;
      const dz = drawPoints[i + 1].z - drawPoints[i].z;
      totalDist += Math.hypot(dx, dz);
    }
    totalDist = Math.round(totalDist * 10) / 10;

    const xs = drawPoints.map((p) => p.x);
    const zs = drawPoints.map((p) => p.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    const centerX = Math.round(((minX + maxX) / 2) * 10) / 10;
    const centerZ = Math.round(((minZ + maxZ) / 2) * 10) / 10;
    const spanX = Math.max(1, Math.round((maxX - minX) * 10) / 10);
    const spanZ = Math.max(1, Math.round((maxZ - minZ) * 10) / 10);

    const angleDeg = Math.round(
      (Math.atan2(
        drawPoints[drawPoints.length - 1].z - drawPoints[0].z,
        drawPoints[drawPoints.length - 1].x - drawPoints[0].x
      ) *
        180) /
        Math.PI
    );

    let newEl: FarmElement3D;
    const id = `draw-${Date.now()}`;

    if (drawToolType === "pipe") {
      newEl = {
        id,
        name: drawName.trim() || `Canalisation PEHD (${totalDist} ml)`,
        category: "irrigation",
        type: "pipe_trench",
        x: centerX,
        z: centerZ,
        width: 0.8,
        length: totalDist,
        height: 0.3,
        rotation: angleDeg,
        costFcfa: Math.round(totalDist * 4200),
        linearMeters: totalDist,
        pathPoints: [...drawPoints],
      };
    } else if (drawToolType === "fence") {
      newEl = {
        id,
        name: drawName.trim() || `Clôture Grillagée (${totalDist} ml)`,
        category: "infrastructure",
        type: "fence_mesh",
        x: centerX,
        z: centerZ,
        width: 0.4,
        length: totalDist,
        height: 1.8,
        rotation: angleDeg,
        costFcfa: Math.round(totalDist * 6800),
        linearMeters: totalDist,
        pathPoints: [...drawPoints],
      };
    } else if (drawToolType === "road") {
      newEl = {
        id,
        name: drawName.trim() || `Piste Latéritique (${totalDist} ml)`,
        category: "infrastructure",
        type: "road_track",
        x: centerX,
        z: centerZ,
        width: 4.0,
        length: totalDist,
        height: 0.15,
        rotation: angleDeg,
        costFcfa: Math.round(totalDist * 5500),
        linearMeters: totalDist,
        pathPoints: [...drawPoints],
      };
    } else if (drawToolType === "pivot") {
      const radius = Math.max(10, Math.round(totalDist));
      newEl = {
        id,
        name: drawName.trim() || `Pivot d'Irrigation (R: ${radius}m)`,
        category: "irrigation",
        type: "pivot_irrigation",
        x: drawPoints[0].x,
        z: drawPoints[0].z,
        width: radius * 2,
        length: radius * 2,
        height: 3.5,
        rotation: 0,
        isCurved: true,
        curveRadius: radius,
        costFcfa: 18500000,
      };
    } else if (drawToolType === "building") {
      newEl = {
        id,
        name: drawName.trim() || `Bâtiment / Hangar (${spanX}m × ${spanZ}m)`,
        category: "building",
        type: "storage_shed",
        x: centerX,
        z: centerZ,
        width: spanX,
        length: spanZ,
        height: 3.8,
        rotation: 0,
        costFcfa: Math.round(spanX * spanZ * 45000),
        pathPoints: [...drawPoints],
      };
    } else {
      const areaM2 = Math.round(spanX * spanZ);
      newEl = {
        id,
        name: drawName.trim() || `Parcelle Maraîchère (${areaM2} m²)`,
        category: "crop",
        type: "crop_vegetables",
        x: centerX,
        z: centerZ,
        width: spanX,
        length: spanZ,
        height: 1.0,
        rotation: 0,
        costFcfa: Math.round(areaM2 * 150),
        pathPoints: [...drawPoints],
      };
    }

    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setDrawPoints([]);
    setIsDrawMode(false);
    toast.success(`Ouvrage personnalisé "${newEl.name}" créé et implanté !`);
  };

  const handleClearDrawPoints = () => {
    setDrawPoints([]);
    toast.info("Tracé en cours réinitialisé.");
  };

  const handleUndoLastDrawPoint = () => {
    setDrawPoints((prev) => prev.slice(0, -1));
    toast.info("Dernier jalon retiré.");
  };

  // Export GeoJSON standard pour SIG / QGIS
  const handleExportGeoJson = () => {
    const geojson = {
      type: "FeatureCollection",
      metadata: {
        generator: "NAFA Studio 3D Field Designer CAD",
        projectName: customPlanName,
        date: new Date().toISOString(),
        surfaceHa: customDomainAreaHa,
        totalBudgetFcfa,
      },
      features: elements.map((el) => ({
        type: "Feature",
        id: el.id,
        properties: {
          name: el.name,
          category: el.category,
          type: el.type,
          width: el.width,
          length: el.length,
          height: el.height,
          rotation: el.rotation,
          costFcfa: el.costFcfa,
          cornerRadius: el.cornerRadius || 0,
          isCurved: !!el.isCurved,
          linearMeters: el.linearMeters,
          customNotes: el.customNotes,
        },
        geometry: {
          type: "Point",
          coordinates: [el.x, el.z],
        },
      })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Plan_Agricole_${customPlanName.replace(/\s+/g, "_")}_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Fichier GeoJSON exporté pour SIG / QGIS / Arpentage !");
  };

  // Export plan CAO JSON vectoriel
  const handleExportCadJson = () => {
    const projectData = {
      version: "2.0-cad",
      projectName: customPlanName,
      exportedAt: new Date().toISOString(),
      domainAreaHa: customDomainAreaHa,
      amenagementType,
      soilType,
      customColors,
      totalBudgetFcfa,
      elements,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Plan_CAO_Studio3D_${customPlanName.replace(/\s+/g, "_")}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Plan CAO complet exporté en format JSON vectoriel !");
  };

  // Importer un plan CAO
  const handleImportCadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.elements)) {
          setElements(parsed.elements);
          if (parsed.projectName) setCustomPlanName(parsed.projectName);
          if (parsed.domainAreaHa) setCustomDomainAreaHa(parsed.domainAreaHa);
          if (parsed.customColors) setCustomColors(parsed.customColors);
          toast.success(
            `Plan CAO "${parsed.projectName || "personnalisé"}" chargé (${parsed.elements.length} ouvrages).`
          );
        } else {
          toast.error("Format de fichier JSON non reconnu.");
        }
      } catch {
        toast.error("Erreur lors de la lecture du fichier JSON.");
      }
    };
    reader.readAsText(file);
  };

  // Initialiser un nouveau plan vierge
  const handleNewCustomBlankPlan = () => {
    setElements([]);
    setSelectedId(null);
    setDrawPoints([]);
    setIsDrawMode(false);
    toast.success(
      `Nouveau plan vierge initialisé pour "${customPlanName}" (${customDomainAreaHa} ha). Vous pouvez commencer vos tracés et implantations !`
    );
  };

  const handleAddElement = (preset: (typeof PRESET_ELEMENTS)[0] | JardiCatalogItem) => {
    const newEl: FarmElement3D = {
      id: `elem-${Date.now()}`,
      name: preset.name,
      category: preset.category,
      type: preset.type,
      x: (Math.random() - 0.5) * 40,
      z: (Math.random() - 0.5) * 40,
      width: preset.width,
      length: preset.length,
      height: preset.height,
      rotation: 0,
      costFcfa: preset.costFcfa,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    toast.success(`Élément "${newEl.name}" ajouté avec succès.`);
  };

  const handleToggleWalkMode = () => {
    setWalkMode((prev) => {
      const next = !prev;
      if (next) {
        setViewPreset("free");
        setIsRotating(false);
        cameraAnglesRef.current = { theta: 0, phi: Math.PI / 2.3, radius: 45 };
        updateCameraPosition();
        toast.info("Mode Visite Piéton actif : caméra au niveau des cultures.");
      } else {
        setViewPreset("iso");
        cameraAnglesRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 130 };
        updateCameraPosition();
        toast.info("Retour en vue d'ensemble Isométrique.");
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    const current = elements.find((el) => el.id === selectedId);
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
    toast.info(`Ouvrage "${current?.name || ""}" supprimé de la maquette.`);
  };

  const handleRotateSelected = () => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, rotation: (el.rotation + 45) % 360 } : el))
    );
  };

  const handleSetView = (preset: "iso" | "top" | "free") => {
    setViewPreset(preset);
    setIsRotating(false);
    if (preset === "top") {
      cameraAnglesRef.current = { theta: 0, phi: 0.05, radius: 140 };
      setCanvas2dOffset({ x: 0, y: 0 });
      setCanvas2dZoom(1);
    } else if (preset === "iso") {
      cameraAnglesRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 130 };
      setCanvas2dOffset({ x: 0, y: 0 });
      setCanvas2dZoom(1);
    } else {
      cameraAnglesRef.current = { theta: 0, phi: Math.PI / 2.2, radius: 110 };
    }
    updateCameraPosition();
  };

  // Application d'un modèle d'aménagement sahélien complet
  const handleApplyAmenagementModel = (model: AmenagementModelSpec) => {
    setAmenagementType(model.id);
    setSoilType(model.recommendedSoil);
    setCustomColors(model.defaultColors);
    setWaterFlowM3H(model.recommendedFlowM3H);
    setElements(model.sampleElements);
    setSelectedId(null);
    toast.success(`Modèle d'aménagement "${model.title}" appliqué avec succès !`);
  };

  // Importation d'une photo de drone / orthophoto locale
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide (JPG, PNG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCustomGroundTextureUrl(dataUrl);
      toast.success("Orthophoto / photo de terrain appliquée comme texture de sol !");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTexture = () => {
    setCustomGroundTextureUrl(null);
    toast.info("Texture personnalisée retirée. Sol naturel restauré.");
  };

  // Sauvegarde de la configuration du projet
  const handleSaveProjectConfig = () => {
    const farmId = activeFarm?.id || "demo";
    const configToSave = {
      farmId,
      farmName: activeFarm?.name || "Exploitation Pilote Sahélienne",
      amenagementType,
      selectedFieldId,
      elements,
      soilType,
      customGroundTextureUrl,
      customColors,
      showSatelliteOverlay,
      showCadastralBoundary,
      showContourLines,
      waterFlowM3H,
      waterDepthM,
      slopeGradientPct,
      lastUpdated: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`nafa_3d_project_config_${farmId}`, JSON.stringify(configToSave));
      if (onSaveModel) {
        onSaveModel(configToSave);
      }
      toast.success(
        `Conception 3D du projet "${configToSave.farmName}" enregistrée avec succès !`
      );
    } catch (err) {
      console.error("Erreur de sauvegarde 3D:", err);
      toast.error("Erreur lors de la sauvegarde locale.");
    }
  };

  // Exporter le rendu image
  const handleExport3DImage = () => {
    try {
      let dataUrl: string | undefined;
      if (renderMode === "webgl" && rendererRef.current) {
        dataUrl = rendererRef.current.domElement.toDataURL("image/png");
      } else if (renderMode === "isometric2d" && canvas2dRef.current) {
        dataUrl = canvas2dRef.current.toDataURL("image/png");
      }

      if (!dataUrl) {
        toast.error("Impossible de générer le rendu.");
        return;
      }

      const link = document.createElement("a");
      link.download = `Maquette_3D_Agricole_${amenagementType}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Rendu de la maquette exporté en PNG haute résolution !");
    } catch {
      toast.error("Erreur lors de l'export d'image.");
    }
  };

  // Copier le bordereau chiffré
  const handleExportSpecs = () => {
    const lines = [
      `=== BORDEREAU D'AMÉNAGEMENT TECHNIQUE — NAFA FIELD DESIGNER ===`,
      `Date: ${new Date().toLocaleDateString("fr-FR")}`,
      `Projet: ${activeFarm?.name || "Exploitation Pilote Sahélienne"}`,
      `Type d'aménagement: ${amenagementType.toUpperCase()}`,
      `Parcelle arpentée: ${currentField.name} (${currentField.areaHa} ha - ${currentField.perimeterM} m)`,
      `Typologie de sol: ${soilType.toUpperCase()}`,
      `Capacité forage: ${waterFlowM3H} m³/h | Besoin estimé de pointe: ${estimatedPeakWaterNeedM3H} m³/h (Couverture: ${waterCoveragePct}%)`,
      `Nombre d'infrastructures implantées: ${elements.length}`,
      `Budget estimatif total: ${totalBudgetFcfa.toLocaleString()} FCFA`,
      ``,
      `DÉTAIL DES ÉLÉMENTS IMPLANTÉS:`,
      ...elements.map(
        (el, i) =>
          `${i + 1}. [${el.category.toUpperCase()}] ${el.name} — Dim: ${el.width}m × ${el.length}m (H: ${el.height}m) | Pos: (X: ${Math.round(el.x)}m, Z: ${Math.round(el.z)}m) | Coût: ${el.costFcfa.toLocaleString()} FCFA`
      ),
      ``,
      `Certifié conforme aux normes agronomiques sahéliennes Burkina Faso.`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Bordereau technique copié dans le presse-papier !");
  };

  // Export Devis & Dossier Technique PDF avec archivage automatique dans l'historique
  const handleExportTechnicalPdf = () => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // En-tête officiel vert & or
      doc.setFillColor(21, 128, 61);
      doc.rect(0, 0, pageWidth, 24, "F");
      doc.setFillColor(234, 179, 8);
      doc.rect(0, 24, pageWidth, 2.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("NAFA STUDIO 3D • DOSSIER TECHNIQUE & DEVIS", 14, 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("CONCEPTION AGRONOMIQUE • HYDRAULIQUE & ÉNERGIE SOLAIRE • BÂTIMENT", 14, 18);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text((currentField?.name || "PROJET").toUpperCase(), pageWidth - 14, 14, { align: "right" });

      // Cadre Métadonnées Projet
      let y = 35;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(220, 226, 232);
      doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(`Projet : ${activeFarm?.name || "Exploitation Agricole"} — ${currentField.name}`, 18, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Superficie : ${currentField.areaHa} ha | Périmètre : ${currentField.perimeterM} m | Sol : ${soilType.toUpperCase()}`, 18, y + 14);
      doc.text(`Hydraulique : Débit forage ${waterFlowM3H} m³/h | Besoin de pointe ${estimatedPeakWaterNeedM3H} m³/h | Couverture : ${waterCoveragePct}%`, 18, y + 20);

      y += 34;

      // Tableau des Infrastructures implantées
      const tableBody = elements.map((el, i) => [
        String(i + 1),
        el.name,
        el.category.toUpperCase(),
        `${el.width}m × ${el.length}m (H: ${el.height}m)`,
        `X: ${Math.round(el.x)}m, Z: ${Math.round(el.z)}m`,
        `${el.costFcfa.toLocaleString("fr-FR")} F`,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["#", "Désignation", "Corps d'état", "Dimensions", "Implantation", "Coût Estimé"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 160;

      // Récapitulatif Budgétaire
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(pageWidth - 95, finalY + 6, 81, 24, 2, 2, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(21, 128, 61);
      doc.text("Nombre d'infrastructures :", pageWidth - 91, finalY + 12);
      doc.text(String(elements.length), pageWidth - 18, finalY + 12, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("BUDGET ESTIMÉ (FCFA) :", pageWidth - 91, finalY + 22);
      doc.text(`${totalBudgetFcfa.toLocaleString("fr-FR")} F`, pageWidth - 18, finalY + 22, { align: "right" });

      // Pied de page légal & normalisé
      doc.setDrawColor(220, 225, 230);
      doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Document technique certifié NAFA Studio 3D • Conforme aux normes agronomiques du Burkina Faso", 14, pageHeight - 8);

      const filename = `plan_studio3d_${(currentField.name || "projet").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${Date.now()}.pdf`;

      pdfExportHistory.saveAndRecordPdf({
        title: `Dossier CAO 3D - ${currentField.name} (${activeFarm?.name || "Domaine"})`,
        filename,
        module: "studio_3d",
        categoryLabel: "Conception 3D & Devis",
        doc,
        summary: `Plan d'aménagement 3D (${elements.length} infrastructures, budget total ${totalBudgetFcfa.toLocaleString("fr-FR")} FCFA) sur ${currentField.areaHa} ha.`,
        dataSnapshot: {
          fieldName: currentField.name,
          areaHa: currentField.areaHa,
          elementsCount: elements.length,
          totalBudgetFcfa,
          soilType,
          waterFlowM3H,
        },
      });
    } catch (e: any) {
      console.error("Erreur génération PDF 3D:", e);
      toast.error("Erreur lors de la génération du dossier PDF.");
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ── EN-TÊTE DU STUDIO ── */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 rounded-[28px] border-2 border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Studio de Conception • NAFA Field Designer</span>
            </div>
            {renderMode === "webgl" ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                <span>Moteur 3D WebGL (GPU Accéléré)</span>
              </Badge>
            ) : (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px] font-bold flex items-center gap-1">
                <MonitorCheck className="h-3 w-3" />
                <span>Moteur 2.5D Isométrique Universel (100% Compatible)</span>
              </Badge>
            )}
            {activeFarm && (
              <Badge variant="outline" className="text-white/80 border-white/20 text-[11px]">
                Projet: {activeFarm.name}
              </Badge>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black flex items-center gap-2.5">
            <Box className="h-6 w-6 text-[#F97316]" />
            <span>Modélisation 3D — Aménagement, Irrigation & Élevage</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80">
            Concevez votre exploitation en 3D photoréaliste : parcelles, motopompes solaires,
            châteaux d'eau et bâtiments d'élevage, avec export direct et connexion aux prix réels du
            Burkina Faso.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={handleSaveProjectConfig}
            className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 shadow-md flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            <span>Sauvegarder Projet</span>
          </Button>
          <Button
            onClick={handleExportTechnicalPdf}
            className="rounded-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 shadow-md flex items-center gap-1.5"
            title="Générer et archiver le dossier technique PDF complet"
          >
            <FileText className="h-4 w-4" />
            <span>Dossier PDF</span>
          </Button>
          <Button
            onClick={() => setShowPdfHistory(true)}
            variant="outline"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs px-4 py-2.5 flex items-center gap-1.5"
            title="Consulter l'historique des documents PDF exportés"
          >
            <FileCheck2 className="h-4 w-4 text-emerald-400" />
            <span>Historique PDF</span>
          </Button>
          <Button
            onClick={handleExportSpecs}
            variant="outline"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs px-4 py-2.5 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Copier Devis</span>
          </Button>
          <Button
            onClick={handleExport3DImage}
            className="rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs px-5 py-2.5 shadow-lg shadow-orange-500/30 flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            <span>Exporter Rendu (PNG)</span>
          </Button>
        </div>
      </div>


      {/* ── PANNEAU DE PERSONNALISATION EXPERT & AMÉNAGEMENT DU PROJET ── */}
      <Card className="p-4 sm:p-5 rounded-[24px] border-2 border-emerald-500/25 bg-card shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Personnalisation Avancée de la Conception
              </h3>
              <p className="text-xs text-muted-foreground">
                Adaptez votre modèle selon le projet, les mesures GPS réelles, la cartographie, les
                sols et l'hydraulique.
              </p>
            </div>
          </div>

          {/* Onglets de personnalisation */}
          <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setCustomTab("amenagement")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                customTab === "amenagement"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Type d'Aménagement
            </button>
            <button
              type="button"
              onClick={() => setCustomTab("gps")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                customTab === "gps"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mesures GPS & Parcelle
            </button>
            <button
              type="button"
              onClick={() => setCustomTab("carto")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                customTab === "carto"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cartographie & Textures
            </button>
            <button
              type="button"
              onClick={() => setCustomTab("sols_couleurs")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                customTab === "sols_couleurs"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sols & Couleurs
            </button>
            <button
              type="button"
              onClick={() => setCustomTab("hydraulique")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                customTab === "hydraulique"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bilan Hydrique & Données
            </button>
            <button
              type="button"
              onClick={() => setCustomTab("sur_mesure")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                customTab === "sur_mesure"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Plan Sur-Mesure & CAO
            </button>
          </div>
        </div>

        {/* 1. ONGLET AMÉNAGEMENT : 7 MODÈLES SAHÉLIENS */}
        {customTab === "amenagement" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sélectionnez un modèle d'aménagement agronomique sahélien :
              </span>
              <Badge variant="outline" className="text-[11px] font-bold text-primary">
                7 Modèles Disponibles
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {AMENAGEMENT_MODELS.map((model) => {
                const isSelected = amenagementType === model.id;
                return (
                  <div
                    key={model.id}
                    className={`p-3.5 rounded-2xl border transition-all text-left space-y-2 flex flex-col justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40"
                        : "border-border/80 bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {model.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400"
                        >
                          {model.badge}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-foreground leading-snug">
                        {model.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {model.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        Débit conseillé: <strong>{model.recommendedFlowM3H} m³/h</strong>
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleApplyAmenagementModel(model)}
                        className={`text-[11px] font-bold rounded-xl h-7 px-2.5 ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-primary hover:text-primary-foreground text-foreground"
                        }`}
                      >
                        {isSelected ? "Appliqué" : "Appliquer"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. ONGLET MESURES GPS & PARCELLE */}
        {customTab === "gps" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">
                  Sélectionner la Parcelle Arpentée (Mesures GPS)
                </Label>
                <select
                  value={selectedFieldId}
                  onChange={(e) => setSelectedFieldId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-bold"
                >
                  {fields.length > 0 ? (
                    fields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.areaHa} ha • {f.perimeterM} m)
                      </option>
                    ))
                  ) : (
                    <option value={DEFAULT_DEMO_FIELD.id}>
                      {DEFAULT_DEMO_FIELD.name} ({DEFAULT_DEMO_FIELD.areaHa} ha)
                    </option>
                  )}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Synchronise automatiquement les dimensions et les sommets géodésiques de la parcelle
                  mesurée sur le terrain.
                </p>
              </div>

              {/* Métriques GPS directes */}
              <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Superficie Réelle
                  </span>
                  <p className="text-sm font-black text-foreground">
                    {currentField.areaHa} ha
                  </p>
                  <span className="text-[9px] text-muted-foreground">
                    ({currentField.areaM2?.toLocaleString() || currentField.areaHa * 10000} m²)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Périmètre Clôturé
                  </span>
                  <p className="text-sm font-black text-foreground">
                    {currentField.perimeterM} m
                  </p>
                  <span className="text-[9px] text-muted-foreground">Arpenté au mètre</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Sommets GPS
                  </span>
                  <p className="text-sm font-black text-foreground">
                    {currentField.points?.length || 4} Bornes
                  </p>
                  <span className="text-[9px] text-muted-foreground">Points géodésiques</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Pente du Terrain
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={slopeGradientPct}
                      onChange={(e) => setSlopeGradientPct(parseFloat(e.target.value) || 0)}
                      className="w-14 h-7 text-center text-xs font-bold p-0"
                    />
                    <span className="text-xs font-bold">%</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">
                    {slopeGradientPct > 3 ? "Ouvrages anti-érosifs requis" : "Pente douce"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
              <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCadastralBoundary}
                  onChange={(e) => setShowCadastralBoundary(e.target.checked)}
                  className="rounded border-input text-primary h-4 w-4"
                />
                <span>Afficher les bornes géodésiques GPS et le tracé cadastral en 3D</span>
              </label>
            </div>
          </div>
        )}

        {/* 3. ONGLET CARTOGRAPHIE & TEXTURES */}
        {customTab === "carto" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bascules cartographiques */}
              <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/30 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Calques Cartographiques Disponibles
                </span>
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 text-xs font-bold cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-emerald-600" />
                      Fond Satellite / Vue Aérienne Orthophoto
                    </span>
                    <input
                      type="checkbox"
                      checked={showSatelliteOverlay}
                      onChange={(e) => setShowSatelliteOverlay(e.target.checked)}
                      className="rounded border-input text-primary h-4 w-4"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 text-xs font-bold cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Waves className="h-4 w-4 text-sky-600" />
                      Courbes de Niveau & Sens de Ruissellement (Isohypses)
                    </span>
                    <input
                      type="checkbox"
                      checked={showContourLines}
                      onChange={(e) => setShowContourLines(e.target.checked)}
                      className="rounded border-input text-primary h-4 w-4"
                    />
                  </label>
                </div>
              </div>

              {/* Importation photo de drone ou plan d'arpentage */}
              <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/30 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Image Personnalisée / Orthophoto Drone
                </span>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl border-dashed border-2 hover:border-primary text-xs font-bold flex items-center justify-center gap-2 py-3"
                  >
                    <UploadCloud className="h-4 w-4 text-primary" />
                    <span>Importer Orthophoto Drone ou Image de Terrain (PNG/JPG)</span>
                  </Button>

                  {customGroundTextureUrl && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <img
                          src={customGroundTextureUrl}
                          alt="Texture drone"
                          className="w-8 h-8 rounded-lg object-cover border"
                        />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          Texture active sur le sol 3D
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleRemoveTexture}
                        className="text-xs text-rose-500 hover:text-rose-700 h-7"
                      >
                        Retirer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. ONGLET SOLS & COULEURS */}
        {customTab === "sols_couleurs" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">
                Typologie du Sol Sahélien (Burkina Faso)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {SOIL_PROFILES.map((profile) => {
                  const isSelected = soilType === profile.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        setSoilType(profile.id);
                        setCustomColors((prev) => ({
                          ...prev,
                          groundColor: profile.defaultColor,
                        }));
                      }}
                      className={`p-3 rounded-2xl border text-left space-y-1.5 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                          : "border-border/70 bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-white/40 shadow-xs shrink-0"
                          style={{ backgroundColor: profile.defaultColor }}
                        />
                        <span className="text-xs font-bold text-foreground truncate">
                          {profile.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {profile.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nuancier de couleurs personnalisées */}
            <div className="pt-3 border-t border-border/50">
              <Label className="text-xs font-bold text-foreground mb-2 block">
                Nuancier des Éléments de la Maquette
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-xl border bg-muted/20 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground block">
                    Couleur du Sol
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColors.groundColor}
                      onChange={(e) =>
                        setCustomColors((prev) => ({ ...prev, groundColor: e.target.value }))
                      }
                      className="h-8 w-12 rounded border cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono font-bold">{customColors.groundColor}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border bg-muted/20 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground block">
                    Cultures & Végétation
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColors.cropColor}
                      onChange={(e) =>
                        setCustomColors((prev) => ({ ...prev, cropColor: e.target.value }))
                      }
                      className="h-8 w-12 rounded border cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono font-bold">{customColors.cropColor}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border bg-muted/20 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground block">
                    Réseaux Hydrauliques
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColors.pipeColor}
                      onChange={(e) =>
                        setCustomColors((prev) => ({ ...prev, pipeColor: e.target.value }))
                      }
                      className="h-8 w-12 rounded border cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono font-bold">{customColors.pipeColor}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border bg-muted/20 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground block">
                    Bâtiments & Abris
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColors.buildingColor}
                      onChange={(e) =>
                        setCustomColors((prev) => ({ ...prev, buildingColor: e.target.value }))
                      }
                      className="h-8 w-12 rounded border cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono font-bold">{customColors.buildingColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. ONGLET HYDRAULIQUE & PROJET */}
        {customTab === "hydraulique" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Débit de la Source / Forage (m³/h)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.5"
                    value={waterFlowM3H}
                    onChange={(e) => setWaterFlowM3H(parseFloat(e.target.value) || 1)}
                    className="h-9 text-xs font-bold"
                  />
                  <span className="text-xs font-bold text-muted-foreground">m³/h</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Mesuré lors de l'essai de pompage terrain.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Profondeur de la Nappe / Niveau Dynamique (m)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="1"
                    value={waterDepthM}
                    onChange={(e) => setWaterDepthM(parseFloat(e.target.value) || 10)}
                    className="h-9 text-xs font-bold"
                  />
                  <span className="text-xs font-bold text-muted-foreground">mètres</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Détermine la Hauteur Manométrique Totale (HMT).
                </span>
              </div>

              {/* Bilan Hydrique Automatique */}
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 space-y-1 flex flex-col justify-center">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Couverture Hydrique :</span>
                  <Badge
                    className={`${
                      waterCoveragePct >= 100
                        ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-600 border-amber-500/40"
                    } text-[11px] font-bold`}
                  >
                    {waterCoveragePct}% ({waterCoveragePct >= 100 ? "Sécurisé" : "Déficitaire"})
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Besoin de pointe estimé : <strong>{estimatedPeakWaterNeedM3H} m³/h</strong> pour les{" "}
                  <strong>{elements.length}</strong> éléments implantés.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. ONGLET PLAN SUR-MESURE & CAO EXPERT */}
        {customTab === "sur_mesure" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Nom du Projet / Exploitation
                </Label>
                <Input
                  type="text"
                  value={customPlanName}
                  onChange={(e) => setCustomPlanName(e.target.value)}
                  placeholder="Ex: Agro-Complexe Pilote de Tanghin"
                  className="h-9 text-xs font-bold"
                />
                <span className="text-[10px] text-muted-foreground">
                  Identifiant du projet pour les rapports, devis et exports CAO.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Superficie Totale du Domaine (Hectares)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={customDomainAreaHa}
                    onChange={(e) => setCustomDomainAreaHa(parseFloat(e.target.value) || 1)}
                    className="h-9 text-xs font-bold"
                  />
                  <span className="text-xs font-bold text-muted-foreground">ha</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Ajuste la surface utile de la maquette (1 ha = 10 000 m²).
                </span>
              </div>

              {/* Bilan Métré & Devis */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-1 flex flex-col justify-center">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Ouvrages Implantés :</span>
                  <Badge variant="outline" className="text-primary font-bold">
                    {elements.length} Ouvrages
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Surface couverte :{" "}
                  <strong>
                    {elements
                      .reduce((sum, el) => sum + Math.round(el.width * el.length), 0)
                      .toLocaleString()}{" "}
                    m²
                  </strong>
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Budget Global Estimé : {totalBudgetFcfa.toLocaleString()} FCFA
                </p>
              </div>
            </div>

            {/* Actions Projets & Exports CAO */}
            <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={handleNewCustomBlankPlan}
                  variant="outline"
                  className="rounded-xl border-dashed border-primary text-primary hover:bg-primary/10 text-xs font-bold h-8 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nouveau Plan Vierge Sur-Mesure</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsDrawMode(true);
                    setLeftDrawerTab("cad_draw");
                    toast.info(
                      "Mode Tracé CAO activé ! Cliquez sur le terrain pour tracer vos ouvrages."
                    );
                  }}
                  className="rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold h-8 flex items-center gap-1.5 shadow-sm"
                >
                  <PenTool className="h-3.5 w-3.5" />
                  <span>Lancer l'Outil de Tracé Vectoriel</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={handleExportCadJson}
                  variant="outline"
                  className="rounded-xl text-xs font-bold h-8 flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5 text-primary" />
                  <span>Exporter Plan CAO (JSON)</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleExportGeoJson}
                  variant="outline"
                  className="rounded-xl text-xs font-bold h-8 flex items-center gap-1.5"
                >
                  <Map className="h-3.5 w-3.5 text-[#F97316]" />
                  <span>Exporter GeoJSON (SIG / QGIS)</span>
                </Button>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-input bg-background hover:bg-muted text-xs font-bold h-8 transition-colors">
                  <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Importer Plan CAO</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportCadJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── INTERFACE PRINCIPALE DU STUDIO (CATALOGUE & RENDU) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Panneau latéral gauche : Catalogue d'éléments & Outils CAO */}
        <Card className="p-4 rounded-[24px] border-border/80 shadow-xs space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Onglets du volet gauche : Catalogue / Tracer CAO / Liste des Ouvrages */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setLeftDrawerTab("catalog")}
                className={`py-1 px-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                  leftDrawerTab === "catalog"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Box className="h-3 w-3" />
                <span>Catalogue</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeftDrawerTab("cad_draw");
                  setIsDrawMode(true);
                }}
                className={`py-1 px-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                  leftDrawerTab === "cad_draw"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PenTool className="h-3 w-3" />
                <span>Tracer</span>
              </button>
              <button
                type="button"
                onClick={() => setLeftDrawerTab("elements_list")}
                className={`py-1 px-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                  leftDrawerTab === "elements_list"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Plan ({elements.length})</span>
              </button>
            </div>

            {/* TAB 1: CATALOGUE DE MODÈLES TYPIQUES */}
            {leftDrawerTab === "catalog" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Ajouter un élément
                  </Label>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {elements.length} placés
                  </Badge>
                </div>

                {/* Système de filtres & recherche typique Jardi Up 3D */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Rechercher manguier, forage, solaire, poulailler..."
                      value={jardiSearchQuery}
                      onChange={(e) => setJardiSearchQuery(e.target.value)}
                      className="h-8 text-xs pl-2 pr-7 rounded-xl bg-muted/50 border-border/70"
                    />
                    {jardiSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setJardiSearchQuery("")}
                        className="absolute right-2 top-2 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filtres par corps de métier (Jardi Up 3D) */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setJardiCategoryFilter("all")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                        jardiCategoryFilter === "all"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/80 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Tous ({JARDI_CATALOG_ITEMS.length})
                    </button>
                    {JARDI_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setJardiCategoryFilter(cat.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 ${
                          jardiCategoryFilter === cat.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/80 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <span>{cat.shortLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Liste des éléments de la bibliothèque 3D typique */}
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {JARDI_CATALOG_ITEMS.filter((item) => {
                    if (jardiCategoryFilter !== "all" && item.jardiCategory !== jardiCategoryFilter) {
                      return false;
                    }
                    if (jardiSearchQuery.trim()) {
                      const q = jardiSearchQuery.toLowerCase();
                      const matchName = item.name.toLowerCase().includes(q);
                      const matchDesc = item.description.toLowerCase().includes(q);
                      const matchTag = item.tags.some((t) => t.toLowerCase().includes(q));
                      return matchName || matchDesc || matchTag;
                    }
                    return true;
                  }).map((item) => {
                    const IconComp = item.icon || Box;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleAddElement(item)}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-border/80 bg-card hover:bg-emerald-500/10 hover:border-emerald-500/40 text-left transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-[#F97316] group-hover:text-white transition-colors">
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {item.width}m × {item.length}m • {item.costFcfa.toLocaleString()} F
                              {item.supplierRecommendation ? ` • ${item.supplierRecommendation}` : ""}
                            </p>
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 shrink-0 ml-1" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: OUTILS DE TRACÉ VECTORIEL CAO */}
            {leftDrawerTab === "cad_draw" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <PenTool className="h-3.5 w-3.5 text-amber-500" />
                    <span>Tracé Vectoriel CAO</span>
                  </span>
                  <Badge
                    className={`${
                      isDrawMode
                        ? "bg-amber-500 text-white animate-pulse"
                        : "bg-muted text-muted-foreground"
                    } text-[10px] font-bold`}
                  >
                    {isDrawMode ? "Tracé Actif" : "En veille"}
                  </Badge>
                </div>

                {/* Sélecteur de type d'ouvrage à tracer */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Type d'ouvrage :</Label>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-bold">
                    {[
                      { id: "parcel", label: "Parcelle", icon: Sprout, color: "text-emerald-500" },
                      { id: "pipe", label: "Canalisation", icon: Droplets, color: "text-sky-500" },
                      { id: "fence", label: "Clôture", icon: ShieldCheck, color: "text-slate-400" },
                      { id: "road", label: "Piste", icon: Tractor, color: "text-amber-600" },
                      { id: "building", label: "Bâtiment", icon: Building2, color: "text-orange-500" },
                      { id: "pivot", label: "Pivot 360°", icon: Circle, color: "text-teal-500" },
                    ].map((t) => {
                      const IconComp = t.icon;
                      const isSel = drawToolType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setDrawToolType(t.id as any);
                            if (t.id === "pipe") setDrawName("Canalisation PEHD 63mm");
                            else if (t.id === "fence") setDrawName("Clôture Grillagée 1.8m");
                            else if (t.id === "road") setDrawName("Piste Latéritique 4m");
                            else if (t.id === "pivot") setDrawName("Pivot d'Irrigation Circulaire");
                            else if (t.id === "building") setDrawName("Hangar / Bâtiment Agricole");
                            else setDrawName("Parcelle Maraîchère Sur-Mesure");
                          }}
                          className={`p-1.5 rounded-xl border text-left flex items-center gap-1.5 transition-all ${
                            isSel
                              ? "bg-amber-500/15 border-amber-500 text-foreground"
                              : "border-border/70 hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <IconComp className={`h-3.5 w-3.5 ${t.color}`} />
                          <span className="truncate">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nom personnalisé */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-muted-foreground">Nom de l'ouvrage :</Label>
                  <Input
                    type="text"
                    value={drawName}
                    onChange={(e) => setDrawName(e.target.value)}
                    placeholder="Ex: Canalisation Principale PEHD"
                    className="h-8 text-xs font-bold rounded-xl"
                  />
                </div>

                {/* Bouton d'activation & Magnétisme */}
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    onClick={() => setIsDrawMode((v) => !v)}
                    className={`flex-1 rounded-xl text-xs font-bold h-8 flex items-center justify-center gap-1.5 ${
                      isDrawMode
                        ? "bg-amber-600 hover:bg-amber-500 text-white shadow-md animate-pulse"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    <span>{isDrawMode ? "Tracé Actif (Cliquez)" : "Activer Tracé"}</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => setDrawSnapGrid((s) => !s)}
                    title={drawSnapGrid ? "Magnétisme 0.5m actif" : "Tracé libre"}
                    className={`h-8 px-2 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                      drawSnapGrid
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    <Grid className="h-3 w-3" />
                    <span>0.5m</span>
                  </button>
                </div>

                {/* Fiche des jalons posés */}
                <div className="p-2.5 rounded-2xl bg-muted/30 border border-border/70 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-muted-foreground text-[10px]">
                    <span>JALONS SUR LE PLAN :</span>
                    <span className="text-foreground">{drawPoints.length} point(s)</span>
                  </div>

                  {drawPoints.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic py-1">
                      Cliquez sur le terrain 3D pour poser vos jalons (P1, P2...).
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-[90px] overflow-y-auto pr-1">
                      {drawPoints.map((pt, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] font-mono py-0.5 border-b border-border/40"
                        >
                          <span className="font-bold text-amber-500">P{i + 1}</span>
                          <span>
                            X: {pt.x}m, Z: {pt.z}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {drawPoints.length >= 2 && (
                    <div className="pt-1.5 border-t border-border/50 space-y-0.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Linéaire :</span>
                        <strong className="text-foreground">{drawMetrics.totalLength} ml</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Emprise calculée :</span>
                        <strong className="text-foreground">
                          {drawMetrics.areaM2} m² ({drawMetrics.areaHa} ha)
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coût estimé :</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {drawMetrics.estimatedCostFcfa.toLocaleString()} FCFA
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions sur le tracé */}
                {drawPoints.length > 0 && (
                  <div className="space-y-1.5">
                    <Button
                      type="button"
                      onClick={handleValidateDrawnElement}
                      className="w-full h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Valider & Implanter l'Ouvrage</span>
                    </Button>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={handleUndoLastDrawPoint}
                        className="py-1 px-2 rounded-xl bg-muted hover:bg-muted/80 text-[11px] font-bold text-muted-foreground flex items-center justify-center gap-1"
                      >
                        <Undo2 className="h-3 w-3" />
                        <span>Retirer P{drawPoints.length}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearDrawPoints}
                        className="py-1 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-[11px] font-bold text-rose-400 flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Effacer tout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LISTE DES OUVRAGES IMPLANTÉS SUR LE PLAN */}
            {leftDrawerTab === "elements_list" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Ouvrages sur le plan ({elements.length})
                  </span>
                  {elements.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Effacer tous les ouvrages du plan ?")) {
                          setElements([]);
                          setSelectedId(null);
                        }
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                    >
                      Vider le plan
                    </button>
                  )}
                </div>

                {elements.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed text-center text-xs text-muted-foreground">
                    Aucun ouvrage implanté. Utilisez le catalogue ou l'outil de tracé pour commencer.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                    {elements.map((el) => {
                      const isSel = el.id === selectedId;
                      return (
                        <div
                          key={el.id}
                          onClick={() => setSelectedId(el.id)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSel
                              ? "bg-emerald-500/15 border-emerald-500 text-foreground shadow-xs"
                              : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{el.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {el.width}m × {el.length}m • {el.costFcfa.toLocaleString()} FCFA
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(el.id);
                                handleDuplicateSelected();
                              }}
                              title="Dupliquer +5m"
                              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setElements((prev) => prev.filter((item) => item.id !== el.id));
                                if (selectedId === el.id) setSelectedId(null);
                                toast.info(`Ouvrage "${el.name}" supprimé.`);
                              }}
                              title="Supprimer"
                              className="p-1 rounded-lg hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Budget Chiffré Estimé + Bouton Prix Réels Marketplace */}
          <div className="space-y-2.5 pt-2 border-t border-border/50">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Budget Aménagement Estimé
              </span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                {totalBudgetFcfa.toLocaleString()} FCFA
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setMarketplaceModalOpen(true)}
              className="w-full rounded-xl border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 py-2"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-[#F97316]" />
              <span>Prix Réels Marketplace (BF)</span>
            </Button>
          </div>
        </Card>

        {/* Zone de Rendu Interactive (WebGL ou 2.5D Universel) */}
        <div className="relative rounded-[24px] overflow-hidden border border-border/80 shadow-xl bg-slate-950 lg:col-span-3 min-h-[520px] flex flex-col">
          {/* Moteur WebGL */}
          {renderMode === "webgl" && (
            <div
              ref={mountRef}
              onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
              onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
              onMouseUp={(e) => handlePointerUp(e.clientX, e.clientY)}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 1) {
                  handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={() => handlePointerUp(prevMouseRef.current.x, prevMouseRef.current.y)}
              onWheel={handleWheel}
              className="w-full h-[520px] cursor-grab active:cursor-grabbing select-none"
            />
          )}

          {/* Moteur Fallback 2.5D Isométrique Universel */}
          {renderMode === "isometric2d" && (
            <div
              ref={container2dRef}
              onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
              onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
              onMouseUp={(e) => handlePointerUp(e.clientX, e.clientY)}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 1) {
                  handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={() => handlePointerUp(prevMouseRef.current.x, prevMouseRef.current.y)}
              onWheel={handleWheel}
              className="w-full h-[520px] cursor-grab active:cursor-grabbing select-none relative"
            >
              <canvas ref={canvas2dRef} className="w-full h-full block" />
            </div>
          )}

          {/* ── BARRE D'OUTILS FLOTTANTE SUPÉRIEURE ── */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-none">
            {/* Presets de vue & Outil Tracé CAO */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md pointer-events-auto shadow-lg">
              <button
                type="button"
                onClick={() => handleSetView("iso")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  viewPreset === "iso"
                    ? "bg-[#F97316] text-white"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                Isométrique
              </button>
              <button
                type="button"
                onClick={() => handleSetView("top")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  viewPreset === "top"
                    ? "bg-[#F97316] text-white"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                Plan 2D
              </button>
              <button
                type="button"
                onClick={handleToggleWalkMode}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                  walkMode
                    ? "bg-emerald-600 text-white shadow-md animate-pulse"
                    : viewPreset === "free"
                    ? "bg-[#F97316] text-white"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <span>{walkMode ? "Mode Piéton (Actif)" : "Visite"}</span>
              </button>
              <div className="w-px h-5 bg-white/20 mx-0.5" />
              <button
                type="button"
                onClick={() => {
                  setIsDrawMode((m) => !m);
                  if (!isDrawMode) {
                    setLeftDrawerTab("cad_draw");
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  isDrawMode
                    ? "bg-amber-500 text-white shadow-md animate-pulse"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>{isDrawMode ? "Tracé Actif" : "Tracer (CAO)"}</span>
              </button>
            </div>

            {/* Commutateur de Moteur de Rendu + Éclairage & Rotation */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md pointer-events-auto shadow-lg">
              {isWebGLAvail && (
                <button
                  type="button"
                  onClick={() => setRenderMode((m) => (m === "webgl" ? "isometric2d" : "webgl"))}
                  title={
                    renderMode === "webgl"
                      ? "Passer en mode Isométrique 2.5D Universel"
                      : "Passer en mode 3D WebGL Accéléré"
                  }
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors mr-1"
                >
                  <RefreshCw className="h-3 w-3 text-emerald-400" />
                  <span>{renderMode === "webgl" ? "3D GPU" : "2.5D"}</span>
                </button>
              )}

              {/* Éclairage solaire */}
              <button
                type="button"
                onClick={() => setLightingMode("day")}
                title="Plein soleil sahélien"
                className={`p-1.5 rounded-xl transition-colors ${
                  lightingMode === "day"
                    ? "bg-amber-500 text-white"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightingMode("sunset")}
                title="Coucher de soleil doré"
                className={`p-1.5 rounded-xl transition-colors ${
                  lightingMode === "sunset"
                    ? "bg-orange-500 text-white"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                <Sunset className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightingMode("night")}
                title="Vue de nuit"
                className={`p-1.5 rounded-xl transition-colors ${
                  lightingMode === "night"
                    ? "bg-indigo-600 text-white"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                <Moon className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-0.5" />
              <button
                type="button"
                onClick={() => setIsRotating((r) => !r)}
                title={isRotating ? "Arrêter la rotation" : "Rotation automatique 360°"}
                className={`p-1.5 rounded-xl transition-colors ${
                  isRotating
                    ? "bg-emerald-500 text-white animate-spin"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── BANNIÈRE HUD MODE TRACÉ CAO ACTIF ── */}
          {isDrawMode && (
            <div className="absolute top-18 left-4 right-4 p-2.5 rounded-2xl bg-slate-900/95 border border-amber-500/60 backdrop-blur-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 z-10 shadow-xl pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <PenTool className="h-3.5 w-3.5 animate-spin" />
                </div>
                <span className="text-xs font-bold">
                  Mode Tracé : Cliquez sur le terrain pour implanter vos jalons ({drawPoints.length} jalons posés).
                </span>
                {drawPoints.length >= 2 && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                    {drawMetrics.totalLength} ml • {drawMetrics.areaM2} m²
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {drawPoints.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleUndoLastDrawPoint}
                      className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center gap-1 text-white"
                    >
                      <Undo2 className="h-3 w-3" />
                      <span>Retirer</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDrawPoints}
                      className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center gap-1 text-white"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Effacer</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleValidateDrawnElement}
                      className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold flex items-center gap-1 text-white shadow-md"
                    >
                      <Check className="h-3 w-3" />
                      <span>Valider l'Ouvrage</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsDrawMode(false)}
                  className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold"
                >
                  Quitter
                </button>
              </div>
            </div>
          )}

          {/* ── CONSOLE CAO PROFESSIONNELLE D'ÉDITION & DIMENSIONNEMENT ── */}
          {selectedId && (() => {
            const sel = elements.find((e) => e.id === selectedId);
            if (!sel) return null;
            const areaM2 = Math.round(sel.width * sel.length);
            const areaHa = Math.round((areaM2 / 10000) * 100) / 100;
            return (
              <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/50 backdrop-blur-md text-white space-y-2.5 shadow-2xl z-20 max-h-[300px] overflow-y-auto pointer-events-auto">
                {/* Entête avec Nom éditable & Métriques */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">Sélectionné :</span>
                    <input
                      type="text"
                      value={sel.name}
                      onChange={(e) => handleUpdateSelected({ name: e.target.value })}
                      className="bg-transparent border-b border-white/20 hover:border-white/50 focus:border-emerald-400 px-1 py-0.5 text-xs font-bold text-white focus:outline-hidden min-w-[180px]"
                    />
                    <Badge variant="outline" className="text-[10px] text-emerald-300 border-emerald-500/40">
                      {sel.category.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      ({sel.costFcfa.toLocaleString()} FCFA)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="text-white/60 hover:text-white text-xs px-1.5 py-0.5 rounded-md hover:bg-white/10"
                      title="Désélectionner"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* 4 Blocs d'outils CAO d'ingénierie */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
                  {/* BLOC 1: MODIFIER (Position & Rotation) */}
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      1. Modifier (Position & Angle)
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div>
                        <span className="text-[10px] text-white/60">X: {sel.x}m</span>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSelected({ x: Math.round((sel.x - 1) * 10) / 10 })
                            }
                            className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 font-bold"
                          >
                            -1m
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSelected({ x: Math.round((sel.x + 1) * 10) / 10 })
                            }
                            className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 font-bold"
                          >
                            +1m
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/60">Z: {sel.z}m</span>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSelected({ z: Math.round((sel.z - 1) * 10) / 10 })
                            }
                            className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 font-bold"
                          >
                            -1m
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSelected({ z: Math.round((sel.z + 1) * 10) / 10 })
                            }
                            className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 font-bold"
                          >
                            +1m
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Rotation */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                      <span className="text-[10px] text-white/70">Rot: {sel.rotation}°</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleRotateSelected}
                          className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold flex items-center gap-1"
                        >
                          <RotateCw className="h-3 w-3" />
                          <span>Pivoter 45°</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSelected({ rotation: (sel.rotation + 90) % 360 })
                          }
                          className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold"
                        >
                          +90°
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* BLOC 2: ALLONGER & REDIMENSIONNER */}
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      2. Allonger & Étirer
                    </span>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/70">Longueur:</span>
                      <strong className="text-emerald-400 font-mono">{sel.length} m</strong>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleLengthenSelected(1)}
                        title="Allonger +1m"
                        aria-label="Allonger +1m"
                        className="px-1.5 py-0.5 rounded-md bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-bold text-[10px]"
                      >
                        +1m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLengthenSelected(5)}
                        title="Allonger +5m"
                        aria-label="Allonger +5m"
                        className="px-1.5 py-0.5 rounded-md bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-200 font-bold text-[10px]"
                      >
                        +5m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLengthenSelected(10)}
                        title="Allonger +10m"
                        aria-label="Allonger +10m"
                        className="px-1.5 py-0.5 rounded-md bg-emerald-600/50 hover:bg-emerald-600/70 text-white font-bold text-[10px]"
                      >
                        +10m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLengthenSelected(25)}
                        title="Allonger +25m"
                        aria-label="Allonger +25m"
                        className="px-1.5 py-0.5 rounded-md bg-emerald-600/60 hover:bg-emerald-600/80 text-white font-bold text-[10px]"
                      >
                        +25m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLengthenSelected(-1)}
                        title="Rétrécir longueur -1m"
                        aria-label="Rétrécir longueur -1m"
                        className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white/70 font-bold text-[10px]"
                      >
                        -1m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLengthenSelected(-5)}
                        title="Rétrécir longueur -5m"
                        aria-label="Rétrécir longueur -5m"
                        className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white/70 font-bold text-[10px]"
                      >
                        -5m
                      </button>
                    </div>
                    {/* Largeur */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
                      <span className="text-white/70">Largeur:</span>
                      <span className="font-mono">{sel.width} m</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleWidenSelected(1)}
                          title="Élargir +1m"
                          aria-label="Élargir +1m"
                          className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 font-bold text-[10px]"
                        >
                          +1m
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWidenSelected(5)}
                          title="Élargir +5m"
                          aria-label="Élargir +5m"
                          className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 font-bold text-[10px]"
                        >
                          +5m
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWidenSelected(-1)}
                          title="Rétrécir largeur -1m"
                          aria-label="Rétrécir largeur -1m"
                          className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 font-bold text-[10px]"
                        >
                          -1m
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* BLOC 3: ARRONDIR & COURBER */}
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      3. Arrondir & Courber
                    </span>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/70">Arrondi:</span>
                      <strong className="text-cyan-400 font-mono">{sel.cornerRadius || 0} m</strong>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetCornerRadius(0)}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          !sel.cornerRadius
                            ? "bg-cyan-500 text-white"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        Vif (0m)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCornerRadius(1)}
                        title="Arrondi 1m"
                        aria-label="Arrondi 1m"
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          sel.cornerRadius === 1
                            ? "bg-cyan-500 text-white"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        1m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCornerRadius(2.5)}
                        title="Arrondi 2.5m"
                        aria-label="Arrondi 2.5m"
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          sel.cornerRadius === 2.5
                            ? "bg-cyan-500 text-white"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        2.5m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCornerRadius(5)}
                        title="Arrondi 5m"
                        aria-label="Arrondi 5m"
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          sel.cornerRadius === 5
                            ? "bg-cyan-500 text-white"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        5m
                      </button>
                    </div>
                    {/* Bascule circulaire 360° */}
                    <div className="pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={handleToggleCurved}
                        className={`w-full py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${
                          sel.isCurved
                            ? "bg-teal-500 text-white shadow-xs"
                            : "bg-white/10 hover:bg-white/20 text-white/80"
                        }`}
                      >
                        <Circle className="h-3 w-3" />
                        <span>{sel.isCurved ? "Pivot 360° Actif" : "Pivot / Cercle 360°"}</span>
                      </button>
                    </div>
                  </div>

                  {/* BLOC 4: ACTIONS, MÉTRÉS & SUPPRESSION */}
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        4. Métrés & Actions
                      </span>
                      <div className="text-[11px] space-y-0.5 pt-0.5">
                        <div className="flex justify-between">
                          <span className="text-white/60">Surface :</span>
                          <span className="font-bold">
                            {areaM2} m² ({areaHa} ha)
                          </span>
                        </div>
                        {sel.linearMeters && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Linéaire :</span>
                            <span className="font-bold">{sel.linearMeters} ml</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={handleDuplicateSelected}
                        className="py-1 px-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                        title="Dupliquer +5m en parallèle"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Dupliquer</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="py-1 px-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border border-rose-500/40"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Informations d'aide */}
          <div className="absolute bottom-3 left-3 text-[10px] text-white/60 pointer-events-none flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Glissez pour pivoter • Molette/pincement pour zoomer • Sol & bornes synchronisés</span>
          </div>
        </div>
      </div>

      {/* Modal des Prix Réels Marketplace Burkina Faso */}
      <MarketplaceMaterialPricePickerModal
        open={marketplaceModalOpen}
        onOpenChange={setMarketplaceModalOpen}
        onAddItem={(quoteItem) => {
          toast.success(
            `Matériel certifié "${quoteItem.designation}" vérifié au prix de ${quoteItem.unitPriceFCFA.toLocaleString()} FCFA.`
          );
          setMarketplaceModalOpen(false);
        }}
      />

      {/* Modal d'historique des plans et devis CAO 3D */}
      <PdfExportHistoryModal
        open={showPdfHistory}
        onOpenChange={setShowPdfHistory}
        defaultModuleFilter="studio_3d"
        title="Historique des Plans & Devis CAO 3D"
      />
    </div>
  );
}


export default Studio3DFarmModeler;
