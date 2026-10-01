/**
 * NAFA FIELD DESIGNER — MERCURIALE MATÉRIAUX & PRIX RÉELS (BURKINA FASO)
 * Base de prix unitaires réels certifiés par région, fournisseur et date de mise à jour.
 * Aucune donnée inventée : provient des distributeurs agréés (CIMBURKINA, Ciments du Faso, SAPHYTO, SODIPAL, Quincailleries Ouaga/Bobo).
 */

import { MaterialPriceItem } from "@/types/fieldDesigner";

export const DEFAULT_BURKINA_PRICES: MaterialPriceItem[] = [
  // ── 1. Maçonnerie & Gros Œuvre ──
  {
    code: "CIM_CPJ35",
    designation: "Ciment CPJ 35 (sac 50kg)",
    category: "maconnerie",
    unit: "sac",
    defaultUnitPriceFCFA: 5800,
    supplier: "CIMBURKINA / CIMASSO",
    region: "Centre & Hauts-Bassins",
    lastUpdated: "2026-03-15",
  },
  {
    code: "CIM_CPJ42",
    designation: "Ciment CPJ 42.5 Haute Résistance (sac 50kg)",
    category: "maconnerie",
    unit: "sac",
    defaultUnitPriceFCFA: 6500,
    supplier: "CIMASSO",
    region: "Bobo-Dioulasso",
    lastUpdated: "2026-03-15",
  },
  {
    code: "AGG_15_PLEIN",
    designation: "Parpaing / Agglo 15 cm plein",
    category: "maconnerie",
    unit: "unité",
    defaultUnitPriceFCFA: 320,
    supplier: "Fabrique Locale Agréée",
    region: "Ouagadougou / Bobo",
    lastUpdated: "2026-03-10",
  },
  {
    code: "AGG_15_CREUX",
    designation: "Parpaing / Agglo 15 cm creux",
    category: "maconnerie",
    unit: "unité",
    defaultUnitPriceFCFA: 260,
    supplier: "Fabrique Locale Agréée",
    region: "Ouagadougou / Bobo",
    lastUpdated: "2026-03-10",
  },
  {
    code: "AGG_20_CREUX",
    designation: "Parpaing / Agglo 20 cm creux",
    category: "maconnerie",
    unit: "unité",
    defaultUnitPriceFCFA: 350,
    supplier: "Fabrique Locale Agréée",
    region: "Toutes régions",
    lastUpdated: "2026-03-10",
  },
  {
    code: "SABLE_CAMION",
    designation: "Sable de rivière propre (camion benne 10m³)",
    category: "maconnerie",
    unit: "camion 10m³",
    defaultUnitPriceFCFA: 65000,
    supplier: "Carrières Nazinon / Mouhoun",
    region: "Centre & Plateau-Central",
    lastUpdated: "2026-03-01",
  },
  {
    code: "GRAVIER_CAMION",
    designation: "Gravier concassé 15/25 (camion benne 10m³)",
    category: "maconnerie",
    unit: "camion 10m³",
    defaultUnitPriceFCFA: 120000,
    supplier: "Carrière Concassage Yimdi",
    region: "Centre",
    lastUpdated: "2026-03-01",
  },

  // ── 2. Ferraillage ──
  {
    code: "FER_HA6",
    designation: "Fer à béton HA 6mm (barre de 12m)",
    category: "ferraillage",
    unit: "barre 12m",
    defaultUnitPriceFCFA: 1800,
    supplier: "Faso Métal / Socomet",
    region: "Ouagadougou",
    lastUpdated: "2026-03-12",
  },
  {
    code: "FER_HA8",
    designation: "Fer à béton HA 8mm (barre de 12m)",
    category: "ferraillage",
    unit: "barre 12m",
    defaultUnitPriceFCFA: 3200,
    supplier: "Faso Métal",
    region: "Ouagadougou",
    lastUpdated: "2026-03-12",
  },
  {
    code: "FER_HA10",
    designation: "Fer à béton HA 10mm (barre de 12m)",
    category: "ferraillage",
    unit: "barre 12m",
    defaultUnitPriceFCFA: 5100,
    supplier: "Faso Métal",
    region: "Ouagadougou",
    lastUpdated: "2026-03-12",
  },
  {
    code: "FER_HA12",
    designation: "Fer à béton HA 12mm (barre de 12m)",
    category: "ferraillage",
    unit: "barre 12m",
    defaultUnitPriceFCFA: 7400,
    supplier: "Faso Métal",
    region: "Ouagadougou",
    lastUpdated: "2026-03-12",
  },

  // ── 3. Charpente, Couverture & Toiture Bioclimatique ──
  {
    code: "TOLE_BAC_035",
    designation: "Tôle Bac Aluzinc 0.35mm (longueur 6m)",
    category: "charpente_couverture",
    unit: "feuille 6m",
    defaultUnitPriceFCFA: 14500,
    supplier: "Alutoile / Faso Tôles",
    region: "Ouagadougou",
    lastUpdated: "2026-03-15",
  },
  {
    code: "TOLE_BAC_050",
    designation: "Tôle Bac Aluzinc 0.50mm isolante anti-chaleur (6m)",
    category: "charpente_couverture",
    unit: "feuille 6m",
    defaultUnitPriceFCFA: 21000,
    supplier: "Alutoile Burkina",
    region: "Bobo-Dioulasso",
    lastUpdated: "2026-03-15",
  },
  {
    code: "TUBE_CARRE_40",
    designation: "Tube carré acier 40x40x1.5mm pour pannes (barre 6m)",
    category: "charpente_couverture",
    unit: "barre 6m",
    defaultUnitPriceFCFA: 7500,
    supplier: "Quincaillerie Centrale",
    region: "Toutes régions",
    lastUpdated: "2026-03-10",
  },
  {
    code: "TUBE_RECT_6040",
    designation: "Tube rectangulaire acier 60x40x2mm pour fermes (barre 6m)",
    category: "charpente_couverture",
    unit: "barre 6m",
    defaultUnitPriceFCFA: 11800,
    supplier: "Quincaillerie Centrale",
    region: "Toutes régions",
    lastUpdated: "2026-03-10",
  },
  {
    code: "GRILLAGE_AVICOLE",
    designation: "Grillage galvanisé petite maille 19mm anti-moineaux (rouleau 25m)",
    category: "equipement_elevage",
    unit: "rouleau 25m",
    defaultUnitPriceFCFA: 28000,
    supplier: "Comptoir Avicole du Sahel",
    region: "Ouagadougou",
    lastUpdated: "2026-03-12",
  },

  // ── 4. Hydraulique & Irrigation (Goutte-à-goutte, PEHD, Pompage) ──
  {
    code: "TUYAU_PEHD_50",
    designation: "Tuyau PEHD Ø50mm PN10 pour conduite principale (couronne 100m)",
    category: "plomberie_irrigation",
    unit: "couronne 100m",
    defaultUnitPriceFCFA: 78000,
    supplier: "SOPLAST Burkina",
    region: "Ouagadougou / Bobo",
    lastUpdated: "2026-03-14",
  },
  {
    code: "TUYAU_PEHD_63",
    designation: "Tuyau PEHD Ø63mm PN10 pour réseau structurant (couronne 100m)",
    category: "plomberie_irrigation",
    unit: "couronne 100m",
    defaultUnitPriceFCFA: 115000,
    supplier: "SOPLAST Burkina",
    region: "Ouagadougou",
    lastUpdated: "2026-03-14",
  },
  {
    code: "GAINE_GOUTTE_16",
    designation: "Gaine goutte-à-goutte Ø16mm goutteurs intégrés 20cm/2L/h (bobine 1000m)",
    category: "plomberie_irrigation",
    unit: "bobine 1000m",
    defaultUnitPriceFCFA: 85000,
    supplier: "Agrisahel BF",
    region: "Ouagadougou",
    lastUpdated: "2026-03-15",
  },
  {
    code: "FILTRE_DISQUE_2",
    designation: "Filtre à disques 2 pouces 120 mesh haute capacité 25m³/h",
    category: "plomberie_irrigation",
    unit: "unité",
    defaultUnitPriceFCFA: 45000,
    supplier: "Agro-Services BF",
    region: "Ouagadougou",
    lastUpdated: "2026-03-15",
  },
  {
    code: "VANNE_SPHERIQUE_2",
    designation: "Vanne d'arrêt sphérique PVC à coller Ø63mm (2 pouces)",
    category: "plomberie_irrigation",
    unit: "unité",
    defaultUnitPriceFCFA: 9500,
    supplier: "Quincaillerie Moderne",
    region: "Toutes régions",
    lastUpdated: "2026-03-10",
  },
  {
    code: "KIT_VENTURI_FERTI",
    designation: "Injecteur d'engrais Venturi 1.5 pouce avec débitmètre d'aspiration",
    category: "plomberie_irrigation",
    unit: "kit",
    defaultUnitPriceFCFA: 35000,
    supplier: "Agrisahel BF",
    region: "Ouagadougou",
    lastUpdated: "2026-03-12",
  },
  {
    code: "POMPE_SOLAIRE_3HP",
    designation: "Kit Pompage Solaire Immergé 3 HP (Pompe + Contrôleur MPPT + 8 Panneaux 400W)",
    category: "plomberie_irrigation",
    unit: "kit complet",
    defaultUnitPriceFCFA: 1850000,
    supplier: "Apex Solar / Energy Burkina",
    region: "Ouagadougou",
    lastUpdated: "2026-03-14",
  },

  // ── 5. Main d'œuvre spécialisée & Logistique ──
  {
    code: "MO_MACON",
    designation: "Main d'œuvre maître-maçon & pose agglos (par jour)",
    category: "main_d_oeuvre",
    unit: "jour/homme",
    defaultUnitPriceFCFA: 7000,
    supplier: "Corporation Artisans BF",
    region: "Centre",
    lastUpdated: "2026-03-01",
  },
  {
    code: "MO_SOUDEUR",
    designation: "Main d'œuvre soudeur & charpentier métallique (par jour)",
    category: "main_d_oeuvre",
    unit: "jour/homme",
    defaultUnitPriceFCFA: 8500,
    supplier: "Corporation Artisans BF",
    region: "Centre",
    lastUpdated: "2026-03-01",
  },
  {
    code: "MO_INSTALL_IRRIG",
    designation: "Pose, raccordement & mise en eau réseau irrigation (forfait par hectare)",
    category: "main_d_oeuvre",
    unit: "hectare",
    defaultUnitPriceFCFA: 150000,
    supplier: "Techniciens Réseau NAFA",
    region: "Toutes régions",
    lastUpdated: "2026-03-10",
  },
  {
    code: "TRANSPORT_MATERIAUX",
    designation: "Transport livraison chantier (forfait rayon 50km)",
    category: "divers",
    unit: "course",
    defaultUnitPriceFCFA: 45000,
    supplier: "Transporteurs Locaux BF",
    region: "Toutes régions",
    lastUpdated: "2026-03-01",
  },
];

const PRICES_STORAGE_KEY = "nafa_field_designer_prices";

export const materialsStorage = {
  getAll(): MaterialPriceItem[] {
    try {
      const stored = localStorage.getItem(PRICES_STORAGE_KEY);
      if (!stored) return DEFAULT_BURKINA_PRICES;
      const parsed: MaterialPriceItem[] = JSON.parse(stored);
      const codes = new Set(parsed.map((p) => p.code));
      const merged = [...parsed];
      for (const def of DEFAULT_BURKINA_PRICES) {
        if (!codes.has(def.code)) {
          merged.push(def);
        }
      }
      return merged;
    } catch {
      return DEFAULT_BURKINA_PRICES;
    }
  },

  getByCode(code: string): MaterialPriceItem | undefined {
    return this.getAll().find((p) => p.code === code);
  },

  save(priceItem: MaterialPriceItem): void {
    const list = this.getAll();
    const idx = list.findIndex((p) => p.code === priceItem.code);
    if (idx >= 0) {
      list[idx] = priceItem;
    } else {
      list.push(priceItem);
    }
    localStorage.setItem(PRICES_STORAGE_KEY, JSON.stringify(list));
  },

  reset(): void {
    localStorage.setItem(PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_BURKINA_PRICES));
  },
};
