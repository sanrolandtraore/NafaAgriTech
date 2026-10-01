// ══════════════════════════════════════════════════════════════════════════
// BASE NATIONALE DES FICHES TECHNIQUES AGRONOMIQUES NAFA
// 235 CULTURES OUEST-AFRICAINES & SAHÉLIENNES • PRIORITÉ BURKINA FASO
// Données agronomiques conformes aux standards INERA, CIRAD & FAO-56
// ══════════════════════════════════════════════════════════════════════════

export interface CropTechnicalSheetData {
  id: string;
  crop_key: string;
  name_fr: string;
  scientific_name?: string;
  category: string;
  is_burkina_priority?: boolean;
  country_origin?: string;
  regions_burkina?: string[];
  cycle_days_min: number;
  cycle_days_max: number;
  climate_zones: string[];
  seasons: string[];
  npk_needs: { N: number; P: number; K: number };
  water_needs_mm: number;
  common_pests: string[];
  common_diseases: string[];
  recommended_varieties: string[];
  yield_potential_t_ha: number;
  notes: string;
  iconName: string;
}

export const BURKINA_ALL_CROPS_TECHNICAL_SHEETS: CropTechnicalSheetData[] = [
  {
    "id": "sheet-mais-blanc-barkas",
    "crop_key": "mais_blanc",
    "name_fr": "Maïs blanc grain (Zea mays var. indentata)",
    "scientific_name": "Zea mays var. indentata",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Boucle du Mouhoun",
      "Centre-Ouest"
    ],
    "cycle_days_min": 85,
    "cycle_days_max": 120,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage (Pluviale)",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 100,
      "P": 50,
      "K": 50
    },
    "water_needs_mm": 550,
    "common_pests": [
      "Chenille légionnaire",
      "Foreurs de tiges"
    ],
    "common_diseases": [
      "Helminthosporiose",
      "Rouille",
      "Strie du maïs"
    ],
    "recommended_varieties": [
      "Barkas",
      "Bondofa",
      "Kabras",
      "Espoir (QPM)"
    ],
    "yield_potential_t_ha": 5.5,
    "notes": "Apport d'urée fractionné indispensable au semis puis au tallage.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-mais-jaune-komsaya",
    "crop_key": "mais_jaune",
    "name_fr": "Maïs jaune précoce (Zea mays var. indurata)",
    "scientific_name": "Zea mays var. indurata",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Centre-Ouest",
      "Centre-Sud"
    ],
    "cycle_days_min": 75,
    "cycle_days_max": 95,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 90,
      "P": 45,
      "K": 45
    },
    "water_needs_mm": 480,
    "common_pests": [
      "Chenille légionnaire",
      "Pucerons"
    ],
    "common_diseases": [
      "Charbon du maïs",
      "Strie bactérienne"
    ],
    "recommended_varieties": [
      "Komsaya",
      "SR21",
      "Jaune de Kamboinsé"
    ],
    "yield_potential_t_ha": 4.8,
    "notes": "Riche en provitamine A pour aviculture et nutrition infantile.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-mais-doux-maraicher",
    "crop_key": "mais_doux",
    "name_fr": "Maïs doux maraîcher (Zea mays saccharata)",
    "scientific_name": "Zea mays saccharata",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre (Koubri, Loumbila)",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 65,
    "cycle_days_max": 80,
    "climate_zones": [
      "Périmètres irrigués"
    ],
    "seasons": [
      "Contre-saison froide",
      "Hivernage"
    ],
    "npk_needs": {
      "N": 110,
      "P": 50,
      "K": 60
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Noctuelles",
      "Pyrale"
    ],
    "common_diseases": [
      "Fusariose de l'épi"
    ],
    "recommended_varieties": [
      "Golden Bantam tropicalisé",
      "Sweet Korn BF"
    ],
    "yield_potential_t_ha": 6,
    "notes": "Récolte au stade laiteux pour épis grillés vendus sur les marchés urbains.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-mais-extra-precoce",
    "crop_key": "mais_extra_precoce",
    "name_fr": "Maïs extra-précoce 60j (Zea mays TZEE)",
    "scientific_name": "Zea mays TZEE",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Centre-Nord",
      "Plateau-Central",
      "Sahel"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 75,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage court"
    ],
    "npk_needs": {
      "N": 70,
      "P": 40,
      "K": 30
    },
    "water_needs_mm": 380,
    "common_pests": [
      "Chenille légionnaire",
      "Sautériaux"
    ],
    "common_diseases": [
      "Helminthosporiose"
    ],
    "recommended_varieties": [
      "TZEE-W Pop STR",
      "TZEE-Y"
    ],
    "yield_potential_t_ha": 3.5,
    "notes": "Culture de soudure par excellence pour briser la faim avant les récoltes majeures.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-sorgho-blanc-kapelga",
    "crop_key": "sorgho_blanc",
    "name_fr": "Sorgho blanc grain (Sorghum bicolor)",
    "scientific_name": "Sorghum bicolor",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Plateau-Central",
      "Nord",
      "Centre-Ouest"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 130,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage (Pluviale)"
    ],
    "npk_needs": {
      "N": 60,
      "P": 30,
      "K": 30
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Punaise des panicules",
      "Cécidomyie",
      "Striga hermonthica"
    ],
    "common_diseases": [
      "Anthracnose",
      "Charbon de la panicule"
    ],
    "recommended_varieties": [
      "Framida",
      "Sariaso 11",
      "Kapelga",
      "Soubatimi"
    ],
    "yield_potential_t_ha": 3.5,
    "notes": "Clé de voûte de la sécurité céréalière et base du tô traditionnel.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-sorgho-rouge-dolo",
    "crop_key": "sorgho_rouge",
    "name_fr": "Sorgho rouge à dolo (Sorghum bicolor var. rouge)",
    "scientific_name": "Sorghum bicolor var. rouge",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre-Ouest",
      "Sud-Ouest",
      "Centre-Sud"
    ],
    "cycle_days_min": 100,
    "cycle_days_max": 145,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 60,
      "P": 30,
      "K": 30
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Foreurs de tiges",
      "Striga hermonthica"
    ],
    "common_diseases": [
      "Anthracnose foliaire",
      "Mildiou"
    ],
    "recommended_varieties": [
      "Gnofing",
      "Sorgho rouge local Farako-Bâ"
    ],
    "yield_potential_t_ha": 3,
    "notes": "Très prisé par les brasseries artisanales pour la préparation du dolo.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-sorgho-panifiable",
    "crop_key": "sorgho_panifiable",
    "name_fr": "Sorgho panifiable de mouture (Sorghum bicolor)",
    "scientific_name": "Sorghum bicolor",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 95,
    "cycle_days_max": 120,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 70,
      "P": 35,
      "K": 30
    },
    "water_needs_mm": 430,
    "common_pests": [
      "Pucerons jaunes",
      "Cécidomyie"
    ],
    "common_diseases": [
      "Moisissure des grains"
    ],
    "recommended_varieties": [
      "Soubatimi",
      "Fadda",
      "Grinkan"
    ],
    "yield_potential_t_ha": 4,
    "notes": "Sélectionné pour incorporation dans les farines de pain mixte et beignets.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-sorgho-fourrager-sucre",
    "crop_key": "sorgho_fourrager",
    "name_fr": "Sorgho fourrager sucré (Sorghum bicolor saccharatum)",
    "scientific_name": "Sorghum bicolor saccharatum",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Sahel",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 70,
    "cycle_days_max": 95,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage",
      "Irrigué"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 40
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Foreurs de tiges"
    ],
    "common_diseases": [
      "Helminthosporiose"
    ],
    "recommended_varieties": [
      "Sugar Drip",
      "Bicolor fourrage INERA"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Jusqu'à 25 à 30 t/ha de matière verte pour ensilage du bétail.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-sorgho-nain-striga",
    "crop_key": "sorgho_nain_striga",
    "name_fr": "Sorgho nain résistant au Striga (Sorghum bicolor ICSV)",
    "scientific_name": "Sorghum bicolor ICSV",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Plateau-Central",
      "Centre-Nord",
      "Nord"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 105,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 25
    },
    "water_needs_mm": 370,
    "common_pests": [
      "Sautériaux",
      "Punaises"
    ],
    "common_diseases": [
      "Charbon couvert"
    ],
    "recommended_varieties": [
      "ICSV 1049",
      "Sariaso 14"
    ],
    "yield_potential_t_ha": 3.2,
    "notes": "Immunité génétique au Striga hermonthica démontrée par l'INERA.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-mil-ikmp5",
    "crop_key": "mil_penicillaire",
    "name_fr": "Mil pénicillaire / Petit mil (Pennisetum glaucum)",
    "scientific_name": "Pennisetum glaucum",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel",
      "Nord",
      "Centre-Nord",
      "Est"
    ],
    "cycle_days_min": 75,
    "cycle_days_max": 100,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 50,
      "P": 25,
      "K": 25
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Mineuse de l'épi (Heliocheilus)",
      "Cantharides"
    ],
    "common_diseases": [
      "Mildiou du mil",
      "Charbon"
    ],
    "recommended_varieties": [
      "IKMP 5",
      "SOSAT-C88",
      "Misari 1"
    ],
    "yield_potential_t_ha": 2.8,
    "notes": "Aliment de base du Sahel résistant à des températures supérieures à 40°C.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-mil-sanio",
    "crop_key": "mil_sanio",
    "name_fr": "Mil Sanio / Mil tardif (Pennisetum glaucum var. Sanio)",
    "scientific_name": "Pennisetum glaucum var. Sanio",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Hauts-Bassins",
      "Cascades"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 155,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage long"
    ],
    "npk_needs": {
      "N": 65,
      "P": 30,
      "K": 30
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Foreurs de tiges",
      "Oiseaux"
    ],
    "common_diseases": [
      "Mildiou",
      "Rouille"
    ],
    "recommended_varieties": [
      "Sanio du Mouhoun",
      "Sanio Farako-Bâ"
    ],
    "yield_potential_t_ha": 3.5,
    "notes": "Paille géante très prisée pour les toitures rurales et la litière animale.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-mil-chandelle-toroniou",
    "crop_key": "mil_chandelle",
    "name_fr": "Mil à chandelle géant (Pennisetum glaucum Toroniou)",
    "scientific_name": "Pennisetum glaucum Toroniou",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Sahel (Dori, Gorom)"
    ],
    "cycle_days_min": 85,
    "cycle_days_max": 110,
    "climate_zones": [
      "Sahel"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 45,
      "P": 25,
      "K": 20
    },
    "water_needs_mm": 320,
    "common_pests": [
      "Mineuse de l'épi",
      "Oiseaux Quelea"
    ],
    "common_diseases": [
      "Charbon du mil"
    ],
    "recommended_varieties": [
      "Toroniou C1",
      "Hini Kirey"
    ],
    "yield_potential_t_ha": 2.5,
    "notes": "Chandelles compactes pouvant dépasser 1 mètre de longueur.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-mil-biofortifie-chakti",
    "crop_key": "mil_chakti",
    "name_fr": "Mil biofortifié Fer & Zinc (Pennisetum glaucum Chakti)",
    "scientific_name": "Pennisetum glaucum Chakti",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Centre-Nord",
      "Plateau-Central"
    ],
    "cycle_days_min": 65,
    "cycle_days_max": 75,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 55,
      "P": 30,
      "K": 25
    },
    "water_needs_mm": 330,
    "common_pests": [
      "Pucerons",
      "Sautériaux"
    ],
    "common_diseases": [
      "Mildiou"
    ],
    "recommended_varieties": [
      "Chakti INERA",
      "GB 8735"
    ],
    "yield_potential_t_ha": 2.9,
    "notes": "Mil précoce riche en micronutriments homologué contre l'anémie.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-riz-nerica4",
    "crop_key": "riz_nerica",
    "name_fr": "Riz pluvial NERICA 4 (Oryza sativa x glaberrima)",
    "scientific_name": "Oryza sativa x glaberrima",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 85,
    "cycle_days_max": 105,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Hivernage (Pluviale)"
    ],
    "npk_needs": {
      "N": 90,
      "P": 50,
      "K": 40
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Cécidomyie du riz",
      "Foreurs"
    ],
    "common_diseases": [
      "Pyriculariose foliaire"
    ],
    "recommended_varieties": [
      "FKR 62N (NERICA 4)",
      "NERICA 1"
    ],
    "yield_potential_t_ha": 4.5,
    "notes": "Cultivable sur plateau sans inondation ni submersion continue.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-riz-bas-fond-ts2",
    "crop_key": "riz_bas_fond",
    "name_fr": "Riz de bas-fond aménagé (Oryza sativa FKR 19 / TS2)",
    "scientific_name": "Oryza sativa FKR 19 / TS2",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Sud-Ouest",
      "Centre-Sud"
    ],
    "cycle_days_min": 105,
    "cycle_days_max": 130,
    "climate_zones": [
      "Bas-fonds aménagés"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 110,
      "P": 55,
      "K": 40
    },
    "water_needs_mm": 750,
    "common_pests": [
      "Cécidomyie",
      "Rongeurs"
    ],
    "common_diseases": [
      "Panachure jaune (RYMV)",
      "Pyriculariose"
    ],
    "recommended_varieties": [
      "TS2",
      "FKR 19",
      "FKR 45N"
    ],
    "yield_potential_t_ha": 5.8,
    "notes": "Exige de petites diguettes de rétention d'eau anti-érosion.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-riz-irrigue-bagre",
    "crop_key": "riz_irrigue",
    "name_fr": "Riz irrigué de plaine (Oryza sativa Orylux 6 / FKR 64)",
    "scientific_name": "Oryza sativa Orylux 6 / FKR 64",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre-Est (Bagré)",
      "Boucle du Mouhoun (Sourou)",
      "Cascades (Banzon)"
    ],
    "cycle_days_min": 115,
    "cycle_days_max": 140,
    "climate_zones": [
      "Périmètres irrigués"
    ],
    "seasons": [
      "Saison pluvieuse",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 130,
      "P": 60,
      "K": 50
    },
    "water_needs_mm": 900,
    "common_pests": [
      "Chilo zacconius",
      "Oiseaux Quelea"
    ],
    "common_diseases": [
      "Bactériose vasculaire",
      "Pyriculariose"
    ],
    "recommended_varieties": [
      "Orylux 6 (parfumé)",
      "FKR 64",
      "KBR 4"
    ],
    "yield_potential_t_ha": 7.5,
    "notes": "Riz d'excellence sous maîtrise totale de l'eau sur grands périmètres.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-riz-glaberrima-kassa",
    "crop_key": "riz_glaberrima",
    "name_fr": "Riz africain rouge Kassa (Oryza glaberrima)",
    "scientific_name": "Oryza glaberrima",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sud-Ouest",
      "Cascades"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 105,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 40,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Foreurs",
      "Charançons"
    ],
    "common_diseases": [
      "Résistant naturel au RYMV"
    ],
    "recommended_varieties": [
      "Kassa local",
      "Glaberrima rouge"
    ],
    "yield_potential_t_ha": 2.2,
    "notes": "Riz patrimonial ancestral à grain rouge doté d'un arôme de noisette.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-riz-flottant-sourou",
    "crop_key": "riz_flottant",
    "name_fr": "Riz flottant de crue (Oryza sativa Gambiaka)",
    "scientific_name": "Oryza sativa Gambiaka",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun (Sourou)",
      "Est"
    ],
    "cycle_days_min": 130,
    "cycle_days_max": 160,
    "climate_zones": [
      "Plaines inondables"
    ],
    "seasons": [
      "Hivernage de crue"
    ],
    "npk_needs": {
      "N": 60,
      "P": 30,
      "K": 20
    },
    "water_needs_mm": 1100,
    "common_pests": [
      "Chenilles aquatiques"
    ],
    "common_diseases": [
      "Pourriture de tige"
    ],
    "recommended_varieties": [
      "Gambiaka",
      "Indochine local"
    ],
    "yield_potential_t_ha": 3.8,
    "notes": "Élongation spectaculaire de la tige pouvant dépasser 2 mètres selon la crue.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-fonio-blanc-banfora",
    "crop_key": "fonio_blanc",
    "name_fr": "Fonio blanc précoce (Digitaria exilis)",
    "scientific_name": "Digitaria exilis",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades (Banfora, Sindou)",
      "Sud-Ouest"
    ],
    "cycle_days_min": 65,
    "cycle_days_max": 90,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 30,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Oiseaux",
      "Criquets"
    ],
    "common_diseases": [
      "Helminthosporiose"
    ],
    "recommended_varieties": [
      "Fonio de Sindou",
      "Fonio blanc INERA"
    ],
    "yield_potential_t_ha": 1.8,
    "notes": "Céréale sans gluten à faible index glycémique prospérant sur sols gravillonnaires.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-fonio-noir-iburu",
    "crop_key": "fonio_noir",
    "name_fr": "Fonio noir / Iburu (Digitaria iburua)",
    "scientific_name": "Digitaria iburua",
    "category": "Céréales",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Cascades"
    ],
    "cycle_days_min": 110,
    "cycle_days_max": 140,
    "climate_zones": [
      "Guinéen"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 35,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Pucerons",
      "Oiseaux"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Iburu traditionnel"
    ],
    "yield_potential_t_ha": 1.5,
    "notes": "Riche en acides aminés soufrés et méthionine indispensable.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-ble-irrigue-sourou",
    "crop_key": "ble_irrigue",
    "name_fr": "Blé irrigué sahélien (Triticum aestivum)",
    "scientific_name": "Triticum aestivum",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun (Sourou)",
      "Centre-Est (Bagré)"
    ],
    "cycle_days_min": 95,
    "cycle_days_max": 115,
    "climate_zones": [
      "Périmètres irrigués froids"
    ],
    "seasons": [
      "Contre-saison froide"
    ],
    "npk_needs": {
      "N": 120,
      "P": 60,
      "K": 40
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Pucerons des céréales"
    ],
    "common_diseases": [
      "Oïdium",
      "Rouille brune"
    ],
    "recommended_varieties": [
      "Giza 168",
      "Sids 1",
      "Sourou-1"
    ],
    "yield_potential_t_ha": 4.5,
    "notes": "Exige des températures nocturnes fraîches (< 18°C) en décembre-janvier.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-orge-africaine",
    "crop_key": "orge_africaine",
    "name_fr": "Orge irriguée sahélienne (Hordeum vulgare)",
    "scientific_name": "Hordeum vulgare",
    "category": "Céréales",
    "is_burkina_priority": false,
    "country_origin": "Sahel / Afrique de l'Ouest",
    "regions_burkina": [
      "Boucle du Mouhoun"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 100,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 70,
      "P": 40,
      "K": 30
    },
    "water_needs_mm": 380,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Orge 6 rangs tropicalisée"
    ],
    "yield_potential_t_ha": 3.5,
    "notes": "Tolérante à la salinité des sols et utilisée pour la brasserie artisanale.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-teff-sahelien",
    "crop_key": "teff_sahelien",
    "name_fr": "Teff d'adaptation sahélienne (Eragrostis tef)",
    "scientific_name": "Eragrostis tef",
    "category": "Céréales",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Plateau-Central",
      "Centre-Ouest"
    ],
    "cycle_days_min": 65,
    "cycle_days_max": 85,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 40,
      "P": 30,
      "K": 20
    },
    "water_needs_mm": 300,
    "common_pests": [
      "Sautériaux"
    ],
    "common_diseases": [
      "Rouille foliaire"
    ],
    "recommended_varieties": [
      "Teff blanc Magna"
    ],
    "yield_potential_t_ha": 2,
    "notes": "Micro-grain sans gluten ultra-riche en fer, calcium et protéines complètes.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-eleusine-coracana",
    "crop_key": "eleusine",
    "name_fr": "Éleusine / Mil rouge doigté (Eleusine coracana)",
    "scientific_name": "Eleusine coracana",
    "category": "Céréales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sud-Ouest",
      "Cascades"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 120,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 25
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Foreurs de tiges",
      "Oiseaux"
    ],
    "common_diseases": [
      "Pyriculariose de l'éleusine"
    ],
    "recommended_varieties": [
      "Éleusine locale Gaoua"
    ],
    "yield_potential_t_ha": 2.8,
    "notes": "Conservation record de plus de 10 ans sans attaque de charançons.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-coix-larme-job",
    "crop_key": "coix_larme_job",
    "name_fr": "Larme-de-Job / Herbe à chapelet (Coix lacryma-jobi)",
    "scientific_name": "Coix lacryma-jobi",
    "category": "Céréales",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Cascades (zones humides)"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 160,
    "climate_zones": [
      "Guinéen",
      "Bas-fonds humides"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 45,
      "P": 25,
      "K": 20
    },
    "water_needs_mm": 700,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Charbon"
    ],
    "recommended_varieties": [
      "Coix Ma-yuen"
    ],
    "yield_potential_t_ha": 2,
    "notes": "Graines décoratives d'artisanat et céréale médicinale anti-inflammatoire reconnue.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-niebe-blanc-kvx",
    "crop_key": "niebe",
    "name_fr": "Niébé blanc à œil noir (Vigna unguiculata KVx)",
    "scientific_name": "Vigna unguiculata KVx",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions",
      "Nord",
      "Centre",
      "Plateau-Central"
    ],
    "cycle_days_min": 65,
    "cycle_days_max": 75,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 20,
      "P": 40,
      "K": 20
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Thrips des fleurs (Megalurothrips)",
      "Maruca vitrata",
      "Bruches"
    ],
    "common_diseases": [
      "Anthracnose",
      "Bactériose",
      "Mosaïque jaune"
    ],
    "recommended_varieties": [
      "KVx 396-4-5-2D",
      "KVx 442-3-25",
      "Komcallé",
      "Nafi",
      "Tiligré"
    ],
    "yield_potential_t_ha": 2,
    "notes": "Fixe 40 à 80 kg N/ha gratuitement dans le sol par symbiose rhizobienne.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-niebe-rouge-precoce",
    "crop_key": "niebe_rouge",
    "name_fr": "Niébé rouge précoce 60j (Vigna unguiculata)",
    "scientific_name": "Vigna unguiculata",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Sahel",
      "Centre-Nord"
    ],
    "cycle_days_min": 55,
    "cycle_days_max": 65,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage court"
    ],
    "npk_needs": {
      "N": 15,
      "P": 35,
      "K": 20
    },
    "water_needs_mm": 280,
    "common_pests": [
      "Thrips",
      "Pucerons Aphis craccivora"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Moussa Local",
      "KVx 780-1"
    ],
    "yield_potential_t_ha": 1.6,
    "notes": "Permet deux récoltes successives sur la même saison dans les zones semi-arides.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-niebe-rampant-fourrage",
    "crop_key": "niebe_fourrager",
    "name_fr": "Niébé rampant grain et fane (Vigna unguiculata)",
    "scientific_name": "Vigna unguiculata",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre-Sud",
      "Hauts-Bassins",
      "Est"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 120,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 25,
      "P": 45,
      "K": 30
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Punaises Clavigralla",
      "Pucerons"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "KVx 745-11",
      "Yiis-Yande"
    ],
    "yield_potential_t_ha": 2.5,
    "notes": "Produit jusqu'à 3 tonnes de fanes sèches riches en protéines pour le bétail.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-arachide-bouche-ts32",
    "crop_key": "arachide_bouche",
    "name_fr": "Arachide de bouche précoce (Arachis hypogaea TS 32-1)",
    "scientific_name": "Arachis hypogaea TS 32-1",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre-Ouest",
      "Centre-Est",
      "Hauts-Bassins",
      "Est"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 105,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 20,
      "P": 40,
      "K": 30
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Aphis craccivora",
      "Iules",
      "Termites"
    ],
    "common_diseases": [
      "Rosette",
      "Cercosporiose",
      "Rouille",
      "Aflatoxines"
    ],
    "recommended_varieties": [
      "TS 32-1",
      "SH 470 P",
      "Fleur 11",
      "QH 243 C"
    ],
    "yield_potential_t_ha": 3.2,
    "notes": "Gros calibre recherché pour la bouche et la torréfaction.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-arachide-huilerie-rmp",
    "crop_key": "arachide_huilerie",
    "name_fr": "Arachide d'huilerie RMP 12 (Arachis hypogaea RMP 12)",
    "scientific_name": "Arachis hypogaea RMP 12",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 110,
    "cycle_days_max": 135,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 25,
      "P": 45,
      "K": 35
    },
    "water_needs_mm": 550,
    "common_pests": [
      "Aphis craccivora",
      "Nématodes"
    ],
    "common_diseases": [
      "Cercosporiose",
      "Rosette"
    ],
    "recommended_varieties": [
      "RMP 12",
      "RMP 91",
      "CN 94 C"
    ],
    "yield_potential_t_ha": 3.8,
    "notes": "Teneur en huile supérieure à 50%. Tourteaux de haute valeur pour bétail.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-arachide-qh243",
    "crop_key": "arachide_espagnole",
    "name_fr": "Arachide espagnole érigée (Arachis hypogaea QH 243)",
    "scientific_name": "Arachis hypogaea QH 243",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Centre-Ouest",
      "Plateau-Central"
    ],
    "cycle_days_min": 85,
    "cycle_days_max": 95,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 20,
      "P": 35,
      "K": 25
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Termites",
      "Vers blancs"
    ],
    "common_diseases": [
      "Rosette"
    ],
    "recommended_varieties": [
      "QH 243 C",
      "ICG 7878"
    ],
    "yield_potential_t_ha": 2.8,
    "notes": "Port érigé compact facilitant l'arrachage manuel et le séchage au champ.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-voandzou-sarlanso",
    "crop_key": "voandzou",
    "name_fr": "Voandzou / Pois de terre beige (Vigna subterranea Sarlanso)",
    "scientific_name": "Vigna subterranea Sarlanso",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Plateau-Central",
      "Nord",
      "Centre-Nord",
      "Centre-Sud"
    ],
    "cycle_days_min": 95,
    "cycle_days_max": 120,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 15,
      "P": 40,
      "K": 30
    },
    "water_needs_mm": 380,
    "common_pests": [
      "Bruches",
      "Nématodes",
      "Iules"
    ],
    "common_diseases": [
      "Cercosporiose",
      "Pourriture des gousses"
    ],
    "recommended_varieties": [
      "Sarlanso",
      "Kamboinsé local",
      "Manga beige"
    ],
    "yield_potential_t_ha": 2.5,
    "notes": "Gousses souterraines à haute tolérance à la sécheresse et aux sols pauvres.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-voandzou-marbre-noir",
    "crop_key": "voandzou_noir",
    "name_fr": "Voandzou marbré noir (Vigna subterranea var. marbré)",
    "scientific_name": "Vigna subterranea var. marbré",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre-Nord",
      "Nord (Yatenga)",
      "Est"
    ],
    "cycle_days_min": 105,
    "cycle_days_max": 130,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 15,
      "P": 35,
      "K": 30
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Bruches",
      "Iules"
    ],
    "common_diseases": [
      "Fusariose"
    ],
    "recommended_varieties": [
      "Local marbré de Yako",
      "Kamboinsé rouge"
    ],
    "yield_potential_t_ha": 2.2,
    "notes": "Saveur sucrée caractéristique très appréciée bouillie ou grillée.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-soja-tgx-canarana",
    "crop_key": "soja",
    "name_fr": "Soja grain non-OGM (Glycine max TGX 1910)",
    "scientific_name": "Glycine max TGX 1910",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Boucle du Mouhoun",
      "Sud-Ouest"
    ],
    "cycle_days_min": 95,
    "cycle_days_max": 115,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 25,
      "P": 60,
      "K": 40
    },
    "water_needs_mm": 550,
    "common_pests": [
      "Nezara viridula",
      "Chenilles défoliatrices"
    ],
    "common_diseases": [
      "Rouille asiatique",
      "Bactériose"
    ],
    "recommended_varieties": [
      "TGX 1910-14F",
      "Canarana",
      "Jupiter"
    ],
    "yield_potential_t_ha": 3.5,
    "notes": "40% de protéines, pilier de l'aliment de volaille et de la laiterie végétale.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-soja-export-jupiter",
    "crop_key": "soja_export",
    "name_fr": "Soja jaune de grand export (Glycine max Jupiter)",
    "scientific_name": "Glycine max Jupiter",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 105,
    "cycle_days_max": 125,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 30,
      "P": 65,
      "K": 45
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Nezara viridula"
    ],
    "common_diseases": [
      "Mosaïque du soja"
    ],
    "recommended_varieties": [
      "Jupiter tropical",
      "TGX 1448-2E"
    ],
    "yield_potential_t_ha": 3.8,
    "notes": "Calibré pour l'industrie de trituration et l'exportation agro-industrielle.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-pois-angole-cajan",
    "crop_key": "pois_angole",
    "name_fr": "Pois d'Angole / Cajan (Cajanus cajan)",
    "scientific_name": "Cajanus cajan",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 140,
    "cycle_days_max": 180,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Hivernage",
      "Saison sèche"
    ],
    "npk_needs": {
      "N": 20,
      "P": 50,
      "K": 30
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Helicoverpa armigera"
    ],
    "common_diseases": [
      "Fusarium udum"
    ],
    "recommended_varieties": [
      "Cajanus Farako-Bâ",
      "ICP 8863"
    ],
    "yield_potential_t_ha": 2.8,
    "notes": "Enracinement pivotant très profond décompactant les horizons tassés.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-pois-angole-nain",
    "crop_key": "pois_angole_nain",
    "name_fr": "Pois d'Angole nain précoce (Cajanus cajan extra-early)",
    "scientific_name": "Cajanus cajan extra-early",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Boucle du Mouhoun"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 115,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 20,
      "P": 40,
      "K": 25
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Pucerons",
      "Thrips"
    ],
    "common_diseases": [
      "Fusariose"
    ],
    "recommended_varieties": [
      "ICPL 87",
      "ICPL 151"
    ],
    "yield_potential_t_ha": 2.2,
    "notes": "Variété non photo-périodique permettant des récoltes décalées.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-pois-sucre-bobo",
    "crop_key": "pois_sucre",
    "name_fr": "Pois sucré maraîcher (Pisum sativum var. saccharatum)",
    "scientific_name": "Pisum sativum var. saccharatum",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins (Bobo)",
      "Nord (Ouahigouya)"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 75,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Novembre à Février"
    ],
    "npk_needs": {
      "N": 30,
      "P": 50,
      "K": 40
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Pucerons verts"
    ],
    "common_diseases": [
      "Oïdium",
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Mange-tout de Bobo",
      "Douce Provence"
    ],
    "yield_potential_t_ha": 8,
    "notes": "Légume primeur haut de gamme pour les circuits courts et hôtels.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-dolique-lablab",
    "crop_key": "dolique_lablab",
    "name_fr": "Dolique lablab / Haricot jacinthe (Lablab purpureus)",
    "scientific_name": "Lablab purpureus",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Hauts-Bassins",
      "Cascades"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 120,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 20,
      "P": 40,
      "K": 30
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Punaises vertes"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Rongai",
      "Highworth"
    ],
    "yield_potential_t_ha": 2.2,
    "notes": "Double usage : grains alimentaires et fauche de biomasse fourragère abondante.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-haricot-mungo",
    "crop_key": "haricot_mungo",
    "name_fr": "Haricot mungo / Soja vert (Vigna radiata)",
    "scientific_name": "Vigna radiata",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre-Ouest",
      "Plateau-Central"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 75,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 20,
      "P": 40,
      "K": 25
    },
    "water_needs_mm": 320,
    "common_pests": [
      "Thrips",
      "Bruches"
    ],
    "common_diseases": [
      "Mosaïque jaune"
    ],
    "recommended_varieties": [
      "Berken",
      "VC 1973A"
    ],
    "yield_potential_t_ha": 1.9,
    "notes": "Cuisson express sans trempage préalable, idéal pour les bouillies infantiles.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-mucuna-pruriens",
    "crop_key": "mucuna_pruriens",
    "name_fr": "Mucuna utilis / Pois mascate (Mucuna pruriens var. utilis)",
    "scientific_name": "Mucuna pruriens var. utilis",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Hauts-Bassins",
      "Sud-Ouest"
    ],
    "cycle_days_min": 130,
    "cycle_days_max": 180,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 15,
      "P": 45,
      "K": 30
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Chenilles défoliatrices"
    ],
    "common_diseases": [
      "Pourriture racinaire"
    ],
    "recommended_varieties": [
      "Mucuna utilis non piquant"
    ],
    "yield_potential_t_ha": 2.5,
    "notes": "Étouffe radicalement les adventices et restitue plus de 150 kg N/ha.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-kerstingiella-geocarpa",
    "crop_key": "kerstingiella",
    "name_fr": "Lentille de terre Kérstingiella (Macrotyloma geocarpum)",
    "scientific_name": "Macrotyloma geocarpum",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sud-Ouest",
      "Centre-Sud"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 110,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 15,
      "P": 30,
      "K": 25
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Iules",
      "Bruches"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Doyiwé local"
    ],
    "yield_potential_t_ha": 1.5,
    "notes": "Légumineuse ancestrale rare aux graines souterraines très digestes.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-haricot-tepary",
    "crop_key": "haricot_tepary",
    "name_fr": "Haricot tépary résistant sécheresse (Phaseolus acutifolius)",
    "scientific_name": "Phaseolus acutifolius",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": false,
    "country_origin": "Sahel / Afrique de l'Ouest",
    "regions_burkina": [
      "Sahel",
      "Nord"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 75,
    "climate_zones": [
      "Sahel aride"
    ],
    "seasons": [
      "Hivernage court"
    ],
    "npk_needs": {
      "N": 15,
      "P": 30,
      "K": 20
    },
    "water_needs_mm": 250,
    "common_pests": [
      "Sautériaux"
    ],
    "common_diseases": [
      "Bactériose commune"
    ],
    "recommended_varieties": [
      "Tépary blanc du Sahel"
    ],
    "yield_potential_t_ha": 1.4,
    "notes": "Prospère avec moins de 300 mm de précipitations annuelles.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-crotalaire-juncea",
    "crop_key": "crotalaire_juncea",
    "name_fr": "Crotalaire joncée nématicide (Crotalaria juncea)",
    "scientific_name": "Crotalaria juncea",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Boucle du Mouhoun"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 90,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 10,
      "P": 40,
      "K": 30
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Fusariose"
    ],
    "recommended_varieties": [
      "Crotalaire Farako-Bâ"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Engrais vert nématicide assainissant le sol avant maraîchage.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-sesbania-rostrata",
    "crop_key": "sesbania_rostrata",
    "name_fr": "Sesbania rostrata nodules de tige (Sesbania rostrata)",
    "scientific_name": "Sesbania rostrata",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun (Sourou)",
      "Cascades"
    ],
    "cycle_days_min": 50,
    "cycle_days_max": 75,
    "climate_zones": [
      "Bas-fonds inondables"
    ],
    "seasons": [
      "Pré-riziculture"
    ],
    "npk_needs": {
      "N": 0,
      "P": 30,
      "K": 20
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Galles"
    ],
    "recommended_varieties": [
      "Sesbania locale BF"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Nodulation sur tige et racines capable de fixer l'azote en milieu immergé.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-feve-tropicale",
    "crop_key": "feve_tropicale",
    "name_fr": "Fève de contre-saison (Vicia faba tropicalisée)",
    "scientific_name": "Vicia faba tropicalisée",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Nord (Ouahigouya)"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 105,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Novembre à Février"
    ],
    "npk_needs": {
      "N": 25,
      "P": 45,
      "K": 30
    },
    "water_needs_mm": 380,
    "common_pests": [
      "Pucerons noirs"
    ],
    "common_diseases": [
      "Botrytis"
    ],
    "recommended_varieties": [
      "Aguadulce tropicalisée"
    ],
    "yield_potential_t_ha": 2.8,
    "notes": "Culture d'hiver sur sols frais et humides enrichissant la terre.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-haricot-aile-carre",
    "crop_key": "haricot_aile",
    "name_fr": "Pois carré / Haricot ailé (Psophocarpus tetragonolobus)",
    "scientific_name": "Psophocarpus tetragonolobus",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 110,
    "cycle_days_max": 150,
    "climate_zones": [
      "Guinéen"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 20,
      "P": 50,
      "K": 40
    },
    "water_needs_mm": 650,
    "common_pests": [
      "Thrips"
    ],
    "common_diseases": [
      "Faux mildiou"
    ],
    "recommended_varieties": [
      "Pois carré ouest-africain"
    ],
    "yield_potential_t_ha": 2.4,
    "notes": "Plante entière comestible : gousses ailées, graines, feuilles et tubercules.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-pois-bambara-rouge",
    "crop_key": "pois_bambara",
    "name_fr": "Pois Bambara rouge de Manga (Vigna subterranea var. naine)",
    "scientific_name": "Vigna subterranea var. naine",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Passoré",
      "Yatenga",
      "Zoundwéogo"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 95,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 15,
      "P": 30,
      "K": 25
    },
    "water_needs_mm": 340,
    "common_pests": [
      "Bruches"
    ],
    "common_diseases": [
      "Fusariose"
    ],
    "recommended_varieties": [
      "Bambara rouge de Manga"
    ],
    "yield_potential_t_ha": 2.1,
    "notes": "Spéculation clé des groupements féminins en milieu sahélien.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-stylosanthes-grain",
    "crop_key": "stylosanthes_grain",
    "name_fr": "Stylosanthès grain et pâture (Stylosanthes hamata Verano)",
    "scientific_name": "Stylosanthes hamata Verano",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre-Sud",
      "Hauts-Bassins",
      "Sahel"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 130,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 0,
      "P": 40,
      "K": 20
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Criquets"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Verano INERA"
    ],
    "yield_potential_t_ha": 1.2,
    "notes": "Régénère la fertilité des parcours pastoraux dégradés.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-canavalia-ensiformis",
    "crop_key": "canavalia",
    "name_fr": "Pois sabre / Canavalia (Canavalia ensiformis)",
    "scientific_name": "Canavalia ensiformis",
    "category": "Légumineuses & Protéagineux",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins",
      "Sud-Ouest"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 160,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 20,
      "P": 40,
      "K": 30
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Canavalia blanc"
    ],
    "yield_potential_t_ha": 2.6,
    "notes": "Plante robuste de couverture étouffant le chiendent et les adventices coriaces.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-igname-blanche-kokoro",
    "crop_key": "igname_blanche",
    "name_fr": "Igname blanche précoce Kokoro (Dioscorea rotundata)",
    "scientific_name": "Dioscorea rotundata",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Passoré",
      "Sud-Ouest (Gaoua, Batié)",
      "Centre-Sud (Pô)"
    ],
    "cycle_days_min": 180,
    "cycle_days_max": 220,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Plantation déc-fév, récolte août-oct"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 120
    },
    "water_needs_mm": 800,
    "common_pests": [
      "Nématodes des tubercules",
      "Chrysomèles"
    ],
    "common_diseases": [
      "Anthracnose de l'igname",
      "Virus de la mosaïque"
    ],
    "recommended_varieties": [
      "Kokoro",
      "Kponan",
      "Laboko"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Exige de volumineuses buttes bien meubles et un tuteurage régulier.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-igname-tardive-foutou",
    "crop_key": "igname_tardive",
    "name_fr": "Igname tardive à foutou Florido (Dioscorea rotundata tardive)",
    "scientific_name": "Dioscorea rotundata tardive",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sud-Ouest",
      "Cascades"
    ],
    "cycle_days_min": 210,
    "cycle_days_max": 270,
    "climate_zones": [
      "Soudanien humide"
    ],
    "seasons": [
      "Plantation février, récolte déc"
    ],
    "npk_needs": {
      "N": 90,
      "P": 50,
      "K": 140
    },
    "water_needs_mm": 950,
    "common_pests": [
      "Cochenilles des tubercules"
    ],
    "common_diseases": [
      "Pourriture sèche de stockage"
    ],
    "recommended_varieties": [
      "Florido",
      "Bêtê-bêtê",
      "Kangba"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Aptitude exceptionnelle au stockage de longue durée (plus de 6 mois).",
    "iconName": "cookie"
  },
  {
    "id": "sheet-igname-jaune-passore",
    "crop_key": "igname_jaune",
    "name_fr": "Igname jaune du Passoré (Dioscorea cayenensis)",
    "scientific_name": "Dioscorea cayenensis",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Passoré (Yako, Arbollé)",
      "Nord"
    ],
    "cycle_days_min": 200,
    "cycle_days_max": 240,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 70,
      "P": 40,
      "K": 110
    },
    "water_needs_mm": 750,
    "common_pests": [
      "Termites des buttes"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Jaune du Passoré",
      "Assina"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Chair jaune riche en carotène fêtée annuellement lors de la fête de l'igname.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-igname-ailee-alata",
    "crop_key": "igname_ailee",
    "name_fr": "Grande igname ailée / Igname d'eau (Dioscorea alata)",
    "scientific_name": "Dioscorea alata",
    "category": "Tubercules & Racines",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Sud-Ouest",
      "Cascades"
    ],
    "cycle_days_min": 220,
    "cycle_days_max": 280,
    "climate_zones": [
      "Guinéen"
    ],
    "seasons": [
      "Hivernage long"
    ],
    "npk_needs": {
      "N": 80,
      "P": 50,
      "K": 130
    },
    "water_needs_mm": 1000,
    "common_pests": [
      "Chrysomèles"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Brazo Fuerte",
      "N'za"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Tubercules spectaculaires pouvant atteindre plus de 15 kg chacun.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-igname-amere-dumetorum",
    "crop_key": "igname_amere",
    "name_fr": "Igname amère trifoliée (Dioscorea dumetorum)",
    "scientific_name": "Dioscorea dumetorum",
    "category": "Tubercules & Racines",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Sud-Ouest"
    ],
    "cycle_days_min": 180,
    "cycle_days_max": 210,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 80
    },
    "water_needs_mm": 700,
    "common_pests": [
      "Nématodes"
    ],
    "common_diseases": [
      "Pourriture"
    ],
    "recommended_varieties": [
      "Dumetorum locale"
    ],
    "yield_potential_t_ha": 12,
    "notes": "Nécessite un trempage et une cuisson prolongée pour éliminer la dioscorine.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-manioc-doux-tms",
    "crop_key": "manioc_doux",
    "name_fr": "Manioc doux de table TMS (Manihot esculenta doux)",
    "scientific_name": "Manihot esculenta doux",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Sud-Ouest",
      "Centre-Ouest"
    ],
    "cycle_days_min": 240,
    "cycle_days_max": 300,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Toute l'année (bouturage humide)"
    ],
    "npk_needs": {
      "N": 60,
      "P": 40,
      "K": 100
    },
    "water_needs_mm": 650,
    "common_pests": [
      "Cochenille du manioc",
      "Acarien vert"
    ],
    "common_diseases": [
      "Mosaïque africaine (CMD)",
      "Bactériose (CBB)"
    ],
    "recommended_varieties": [
      "TMS 98/0505",
      "V5",
      "Six-Mois"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Faible teneur en glycosides cyanogènes, consommable directement bouilli.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-manioc-amer-amidon",
    "crop_key": "manioc_amer",
    "name_fr": "Manioc amer pour gari et attiéké (Manihot esculenta amer)",
    "scientific_name": "Manihot esculenta amer",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 300,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Pluviale"
    ],
    "npk_needs": {
      "N": 70,
      "P": 50,
      "K": 120
    },
    "water_needs_mm": 750,
    "common_pests": [
      "Acariens verts",
      "Nématodes"
    ],
    "common_diseases": [
      "Anthracnose du manioc"
    ],
    "recommended_varieties": [
      "TMS 30572",
      "Bocou 1",
      "Ampong"
    ],
    "yield_potential_t_ha": 35,
    "notes": "Rendement en fécule et amidon record pour transformation industrielle.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-manioc-jaune-vitamine-a",
    "crop_key": "manioc_jaune",
    "name_fr": "Manioc biofortifié Provitamine A (Manihot esculenta provitA)",
    "scientific_name": "Manihot esculenta provitA",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Centre-Sud"
    ],
    "cycle_days_min": 270,
    "cycle_days_max": 330,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 65,
      "P": 45,
      "K": 110
    },
    "water_needs_mm": 700,
    "common_pests": [
      "Cochenille farineuse"
    ],
    "common_diseases": [
      "Mosaïque africaine"
    ],
    "recommended_varieties": [
      "IITA Yellow 01/1371",
      "Gari d'Or"
    ],
    "yield_potential_t_ha": 28,
    "notes": "Chair jaune lumineuse enrichie en provitamine A naturelle.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-manioc-jaune-doux",
    "crop_key": "manioc_jaune_doux",
    "name_fr": "Manioc doux jaune hâtif (Manihot esculenta carotenoide)",
    "scientific_name": "Manihot esculenta carotenoide",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sud-Ouest",
      "Cascades"
    ],
    "cycle_days_min": 210,
    "cycle_days_max": 260,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Pluviale"
    ],
    "npk_needs": {
      "N": 55,
      "P": 35,
      "K": 90
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Acariens"
    ],
    "common_diseases": [
      "Mosaïque"
    ],
    "recommended_varieties": [
      "Yellow Roots BF"
    ],
    "yield_potential_t_ha": 24,
    "notes": "Variété hâtive récoltable dès le 7ème mois.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-patate-douce-blanche-bf51",
    "crop_key": "patate_douce_blanche",
    "name_fr": "Patate douce blanche BF 51 (Ipomoea batatas chair blanche)",
    "scientific_name": "Ipomoea batatas chair blanche",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Boucle du Mouhoun",
      "Centre-Ouest",
      "Centre"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 110,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 40,
      "P": 40,
      "K": 80
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Charançon de la patate (Cylas formicarius)"
    ],
    "common_diseases": [
      "Virus SPVD",
      "Fusariose"
    ],
    "recommended_varieties": [
      "BF 51",
      "Wagashi",
      "Mugande"
    ],
    "yield_potential_t_ha": 20,
    "notes": "Buttage soigné obligatoire pour protéger les tubercules des pontes de Cylas.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-patate-douce-orange-irene",
    "crop_key": "patate_douce_orange",
    "name_fr": "Patate douce orange biofortifiée (Ipomoea batatas var. orange)",
    "scientific_name": "Ipomoea batatas var. orange",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Centre (Loumbila)"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 105,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 45,
      "P": 45,
      "K": 90
    },
    "water_needs_mm": 480,
    "common_pests": [
      "Cylas formicarius",
      "Pucerons"
    ],
    "common_diseases": [
      "SPVD"
    ],
    "recommended_varieties": [
      "TIB-44006",
      "Irene",
      "Beauregard"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Recommandée par les services pédiatriques pour lutter contre les carences en vitamine A.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-patate-douce-pourpre",
    "crop_key": "patate_douce_pourpre",
    "name_fr": "Patate douce pourpre antioxydante (Ipomoea batatas var. pourpre)",
    "scientific_name": "Ipomoea batatas var. pourpre",
    "category": "Tubercules & Racines",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins",
      "Sud-Ouest"
    ],
    "cycle_days_min": 100,
    "cycle_days_max": 120,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 40,
      "P": 40,
      "K": 85
    },
    "water_needs_mm": 460,
    "common_pests": [
      "Charançons"
    ],
    "common_diseases": [
      "Pourriture racinaire"
    ],
    "recommended_varieties": [
      "Pourpre d'Afrique"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Haute teneur en anthocyanes protectrices et excellente texture à la vapeur.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-pomme-terre-ouahigouya",
    "crop_key": "pomme_de_terre",
    "name_fr": "Pomme de terre d'Ouahigouya (Solanum tuberosum)",
    "scientific_name": "Solanum tuberosum",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord (Ouahigouya, Titao)",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 75,
    "cycle_days_max": 95,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Novembre à Février"
    ],
    "npk_needs": {
      "N": 120,
      "P": 80,
      "K": 140
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Teigne de la pomme de terre",
      "Pucerons"
    ],
    "common_diseases": [
      "Mildiou",
      "Flétrissement bactérien (Ralstonia)"
    ],
    "recommended_varieties": [
      "Spunta",
      "Sahel",
      "Claustar",
      "Pamela"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Véritable trésor horticole d'hivernage de la région du Nord au Burkina Faso.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-taro-colocasia-banfora",
    "crop_key": "taro_colocasia",
    "name_fr": "Taro Colocasia de bas-fond (Colocasia esculenta)",
    "scientific_name": "Colocasia esculenta",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades (Banfora, Bérégadougou)",
      "Sud-Ouest"
    ],
    "cycle_days_min": 210,
    "cycle_days_max": 270,
    "climate_zones": [
      "Bas-fonds humides permanents"
    ],
    "seasons": [
      "Plantation mai-juin"
    ],
    "npk_needs": {
      "N": 80,
      "P": 50,
      "K": 100
    },
    "water_needs_mm": 1200,
    "common_pests": [
      "Chenilles de taro",
      "Pucerons"
    ],
    "common_diseases": [
      "Mildiou du taro (Phytophthora colocasiae)"
    ],
    "recommended_varieties": [
      "Taro blanc de Banfora",
      "Macabo local"
    ],
    "yield_potential_t_ha": 20,
    "notes": "Tolère les sols engorgés et les nappes affleurantes.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-macabo-xanthosoma",
    "crop_key": "macabo_xanthosoma",
    "name_fr": "Macabo Xanthosoma de terre ferme (Xanthosoma sagittifolium)",
    "scientific_name": "Xanthosoma sagittifolium",
    "category": "Tubercules & Racines",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Sud-Ouest",
      "Cascades"
    ],
    "cycle_days_min": 240,
    "cycle_days_max": 300,
    "climate_zones": [
      "Guinéen"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 85,
      "P": 55,
      "K": 110
    },
    "water_needs_mm": 900,
    "common_pests": [
      "Nématodes"
    ],
    "common_diseases": [
      "Pourriture racinaire"
    ],
    "recommended_varieties": [
      "Xanthosoma blanc",
      "Macabo rouge"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Exige un sol meuble et bien drainé non inondé.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-souchet-doux-blanc",
    "crop_key": "souchet_doux",
    "name_fr": "Souchet doux blanc gros calibre (Cyperus esculentus var. sativus)",
    "scientific_name": "Cyperus esculentus var. sativus",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Hauts-Bassins",
      "Sud-Ouest"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 110,
    "climate_zones": [
      "Soudanien",
      "Périmètres irrigués"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 40,
      "P": 40,
      "K": 60
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Charançons des tubercules"
    ],
    "common_diseases": [
      "Pourriture"
    ],
    "recommended_varieties": [
      "Souchet gros de Banfora"
    ],
    "yield_potential_t_ha": 3.5,
    "notes": "Matière première du lait de souchet et de l'horchata sahélienne.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-souchet-brun-traditionnel",
    "crop_key": "souchet_brun",
    "name_fr": "Souchet brun traditionnel (Cyperus esculentus)",
    "scientific_name": "Cyperus esculentus",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 100,
    "cycle_days_max": 125,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 35,
      "P": 35,
      "K": 50
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Iules"
    ],
    "common_diseases": [
      "Fusariose"
    ],
    "recommended_varieties": [
      "Brun de Sindou"
    ],
    "yield_potential_t_ha": 3,
    "notes": "Très riche en fibres insolubles et en bons lipides végétaux.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-gingembre-banfora",
    "crop_key": "gingembre",
    "name_fr": "Gingembre parfumé de Banfora (Zingiber officinale)",
    "scientific_name": "Zingiber officinale",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades (Banfora, Bansié)",
      "Sud-Ouest",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 210,
    "cycle_days_max": 260,
    "climate_zones": [
      "Soudanien humide",
      "Guinéen"
    ],
    "seasons": [
      "Plantation avril-mai"
    ],
    "npk_needs": {
      "N": 90,
      "P": 50,
      "K": 130
    },
    "water_needs_mm": 850,
    "common_pests": [
      "Nématodes gallicoles",
      "Foreurs de rhizome"
    ],
    "common_diseases": [
      "Pourriture bactérienne (Ralstonia)",
      "Pythium"
    ],
    "recommended_varieties": [
      "Gingembre jaune BF",
      "Gros de Banfora"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Paillage épais indispensable pour maintenir fraîcheur et humidité constante.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-gingembre-chinois-gros",
    "crop_key": "gingembre_chinois",
    "name_fr": "Gingembre géant d'importation (Zingiber officinale var. gros)",
    "scientific_name": "Zingiber officinale var. gros",
    "category": "Tubercules & Racines",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Cascades"
    ],
    "cycle_days_min": 240,
    "cycle_days_max": 280,
    "climate_zones": [
      "Guinéen"
    ],
    "seasons": [
      "Hivernage irrigué"
    ],
    "npk_needs": {
      "N": 110,
      "P": 60,
      "K": 150
    },
    "water_needs_mm": 950,
    "common_pests": [
      "Nématodes"
    ],
    "common_diseases": [
      "Fusariose"
    ],
    "recommended_varieties": [
      "Chinois tropicalisé"
    ],
    "yield_potential_t_ha": 24,
    "notes": "Rhizomes très volumineux et moins piquants convenant à la confiserie.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-curcuma-longa-cascades",
    "crop_key": "curcuma",
    "name_fr": "Curcuma longa / Safran des Indes (Curcuma longa)",
    "scientific_name": "Curcuma longa",
    "category": "Tubercules & Racines",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 220,
    "cycle_days_max": 270,
    "climate_zones": [
      "Soudanien humide"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 80,
      "P": 50,
      "K": 120
    },
    "water_needs_mm": 800,
    "common_pests": [
      "Chenilles des feuilles"
    ],
    "common_diseases": [
      "Pourriture molle du rhizome"
    ],
    "recommended_varieties": [
      "Curcuma de Banfora",
      "Curcuma doré"
    ],
    "yield_potential_t_ha": 16,
    "notes": "Haute teneur en curcumine thérapeutique et colorante agro-alimentaire.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-arrow-root-marante",
    "crop_key": "arrow_root",
    "name_fr": "Marante / Arrow-root tropical (Maranta arundinacea)",
    "scientific_name": "Maranta arundinacea",
    "category": "Tubercules & Racines",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Cascades"
    ],
    "cycle_days_min": 240,
    "cycle_days_max": 300,
    "climate_zones": [
      "Guinéen humide"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 50,
      "P": 40,
      "K": 80
    },
    "water_needs_mm": 800,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Marante ouest-africaine"
    ],
    "yield_potential_t_ha": 14,
    "notes": "Fécule ultra-fine idéale pour la nutrition des jeunes enfants et convalescents.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-topinambour-tropicalise",
    "crop_key": "topinambour",
    "name_fr": "Topinambour sahélien irrigué (Helianthus tuberosus)",
    "scientific_name": "Helianthus tuberosus",
    "category": "Tubercules & Racines",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins"
    ],
    "cycle_days_min": 110,
    "cycle_days_max": 140,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 60,
      "P": 40,
      "K": 100
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Noctuelles"
    ],
    "common_diseases": [
      "Sclérotiniose"
    ],
    "recommended_varieties": [
      "Topinambour blanc"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Tubercules riches en inuline prébiotique excellente pour le microbiote.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-tomate-rossol",
    "crop_key": "tomate_rossol",
    "name_fr": "Tomate de pleine saison Rossol (Solanum lycopersicum)",
    "scientific_name": "Solanum lycopersicum",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Nord",
      "Centre (Koubri, Loumbila)",
      "Boucle du Mouhoun"
    ],
    "cycle_days_min": 75,
    "cycle_days_max": 90,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison",
      "Hivernage"
    ],
    "npk_needs": {
      "N": 120,
      "P": 60,
      "K": 120
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Mineuse (Tuta absoluta)",
      "Mouches blanches (Bemisia)"
    ],
    "common_diseases": [
      "Flétrissement bactérien",
      "TYLCV"
    ],
    "recommended_varieties": [
      "Rossol",
      "Roma VF",
      "Caraïbe"
    ],
    "yield_potential_t_ha": 35,
    "notes": "Résistance génétique aux nématodes gallicoles validée en milieu sahélien.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-tomate-mongal-f1",
    "crop_key": "tomate_mongal",
    "name_fr": "Tomate hybride tropicale Mongal F1 (Solanum lycopersicum F1)",
    "scientific_name": "Solanum lycopersicum F1",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins",
      "Cascades"
    ],
    "cycle_days_min": 70,
    "cycle_days_max": 85,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Contre-saison chaude",
      "Hivernage"
    ],
    "npk_needs": {
      "N": 140,
      "P": 70,
      "K": 150
    },
    "water_needs_mm": 550,
    "common_pests": [
      "Bemisia tabaci",
      "Tuta absoluta"
    ],
    "common_diseases": [
      "Ralstonia solanacearum",
      "TYLCV"
    ],
    "recommended_varieties": [
      "Mongal F1",
      "Lindo F1"
    ],
    "yield_potential_t_ha": 45,
    "notes": "Tolérance remarquable à la chaleur excessive et au flétrissement bactérien.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-tomate-cerise-tropicale",
    "crop_key": "tomate_cerise",
    "name_fr": "Tomate cerise grappe (Solanum lycopersicum var. cerasiforme)",
    "scientific_name": "Solanum lycopersicum var. cerasiforme",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre (Ouagadougou)",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 75,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison",
      "Hivernage"
    ],
    "npk_needs": {
      "N": 100,
      "P": 50,
      "K": 110
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Acariens",
      "Mouche blanche"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Sweet Cherry BF",
      "Cerasiforme local"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Productivité continue en grappes très sucrées prisées en restauration.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-tomate-industrielle-peto",
    "crop_key": "tomate_industrielle",
    "name_fr": "Tomate industrielle concentré (Solanum lycopersicum)",
    "scientific_name": "Solanum lycopersicum",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun (Sourou)",
      "Centre-Est (Bagré)"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 100,
    "climate_zones": [
      "Périmètres irrigués"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 130,
      "P": 70,
      "K": 140
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Tuta absoluta"
    ],
    "common_diseases": [
      "Alternariose"
    ],
    "recommended_varieties": [
      "Petomech",
      "UC 82B"
    ],
    "yield_potential_t_ha": 40,
    "notes": "Forte teneur en matière sèche pour transformation industrielle en concentré.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-oignon-violet-galmi",
    "crop_key": "oignon_violet",
    "name_fr": "Oignon violet de Galmi (Allium cepa var. Galmi)",
    "scientific_name": "Allium cepa var. Galmi",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Nord (Ouahigouya)",
      "Centre-Nord",
      "Plateau-Central"
    ],
    "cycle_days_min": 100,
    "cycle_days_max": 130,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison froide"
    ],
    "npk_needs": {
      "N": 100,
      "P": 60,
      "K": 100
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Thrips de l'oignon (Thrips tabaci)"
    ],
    "common_diseases": [
      "Alternariose (taches pourpres)",
      "Pourriture basale (Fusarium)"
    ],
    "recommended_varieties": [
      "Violet de Galmi",
      "Goudami",
      "Ori"
    ],
    "yield_potential_t_ha": 35,
    "notes": "La référence absolue ouest-africaine pour l'exportation et le séchage.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-oignon-jaune-garango",
    "crop_key": "oignon_jaune",
    "name_fr": "Oignon jaune de Garango (Allium cepa jaune)",
    "scientific_name": "Allium cepa jaune",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre-Est (Garango)",
      "Centre-Sud"
    ],
    "cycle_days_min": 100,
    "cycle_days_max": 125,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 90,
      "P": 55,
      "K": 95
    },
    "water_needs_mm": 430,
    "common_pests": [
      "Thrips"
    ],
    "common_diseases": [
      "Pourriture bactérienne"
    ],
    "recommended_varieties": [
      "Jaune de Garango",
      "Texas Early Grano"
    ],
    "yield_potential_t_ha": 30,
    "notes": "Bulbes sucrés à tuniques fermes particulièrement adaptés à la cuisson locale.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-oignon-blanc-soum",
    "crop_key": "oignon_blanc",
    "name_fr": "Oignon blanc du Soum (Allium cepa blanc)",
    "scientific_name": "Allium cepa blanc",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel (Dori, Djibo)",
      "Nord"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 115,
    "climate_zones": [
      "Sahel"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 85,
      "P": 50,
      "K": 90
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Thrips"
    ],
    "common_diseases": [
      "Aspergillus niger"
    ],
    "recommended_varieties": [
      "Blanc de Soum",
      "Blanc hâtif"
    ],
    "yield_potential_t_ha": 28,
    "notes": "Arôme délicat et précoce commercialisé frais dès février.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-piment-pili-pili",
    "crop_key": "piment_fort",
    "name_fr": "Piment fort Pili-Pili / Bec d'oiseau (Capsicum frutescens)",
    "scientific_name": "Capsicum frutescens",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Centre",
      "Nord"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 130,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison",
      "Hivernage"
    ],
    "npk_needs": {
      "N": 80,
      "P": 50,
      "K": 90
    },
    "water_needs_mm": 550,
    "common_pests": [
      "Mouche des fruits",
      "Pucerons",
      "Acariens"
    ],
    "common_diseases": [
      "Anthracnose",
      "Virus de la marbrure"
    ],
    "recommended_varieties": [
      "Pili-Pili local",
      "Habanero antillais",
      "Burkina Hot"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Piquant exceptionnel (plus de 100 000 Scoville) et forte conservation séchée.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-poivron-doux-yolo",
    "crop_key": "poivron_doux",
    "name_fr": "Poivron doux Yolo Wonder (Capsicum annuum doux)",
    "scientific_name": "Capsicum annuum doux",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre",
      "Nord"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 105,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Contre-saison fraîche"
    ],
    "npk_needs": {
      "N": 110,
      "P": 60,
      "K": 120
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Thrips",
      "Pucerons"
    ],
    "common_diseases": [
      "Bactériose (Xanthomonas)",
      "Oïdium"
    ],
    "recommended_varieties": [
      "Yolo Wonder B",
      "California Wonder"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Calibre rectangulaire lourd recherché pour les marchés des grandes villes.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-poivron-jaune-tropical",
    "crop_key": "poivron_jaune",
    "name_fr": "Poivron jaune tropical doux (Capsicum annuum jaune)",
    "scientific_name": "Capsicum annuum jaune",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins"
    ],
    "cycle_days_min": 85,
    "cycle_days_max": 110,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 115,
      "P": 65,
      "K": 125
    },
    "water_needs_mm": 520,
    "common_pests": [
      "Mouche blanche"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Golden Summer"
    ],
    "yield_potential_t_ha": 24,
    "notes": "Fruits jaune d'or riches en vitamines vendus au prix fort.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-aubergine-violette-beauty",
    "crop_key": "aubergine_violette",
    "name_fr": "Aubergine ronde Black Beauty (Solanum melongena)",
    "scientific_name": "Solanum melongena",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre",
      "Centre-Ouest"
    ],
    "cycle_days_min": 85,
    "cycle_days_max": 110,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 100,
      "P": 50,
      "K": 110
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Acariens rouges",
      "Mouche blanche"
    ],
    "common_diseases": [
      "Flétrissement bactérien",
      "Verticilliose"
    ],
    "recommended_varieties": [
      "Black Beauty",
      "Bonica F1"
    ],
    "yield_potential_t_ha": 30,
    "notes": "Gros fruits pourpres piriformes à chair ferme pour sautés et sauces.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-aubergine-kumba-africaine",
    "crop_key": "aubergine_kumba",
    "name_fr": "Aubergine africaine amère Kumba (Solanum aethiopicum Kumba)",
    "scientific_name": "Solanum aethiopicum Kumba",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions",
      "Centre",
      "Nord",
      "Plateau-Central"
    ],
    "cycle_days_min": 70,
    "cycle_days_max": 95,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 60,
      "P": 40,
      "K": 60
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Altises",
      "Punaises"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Kumba amère locale",
      "Djambour"
    ],
    "yield_potential_t_ha": 20,
    "notes": "Feuilles et fruits côtelés très consommés pour stimuler l'appétit et le foie.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-aubergine-blanche-gilo",
    "crop_key": "aubergine_gilo",
    "name_fr": "Aubergine blanche d'Afrique Gilo (Solanum aethiopicum Gilo)",
    "scientific_name": "Solanum aethiopicum Gilo",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Centre-Sud"
    ],
    "cycle_days_min": 75,
    "cycle_days_max": 100,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 70,
      "P": 45,
      "K": 70
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Acariens"
    ],
    "common_diseases": [
      "Fonte des semis"
    ],
    "recommended_varieties": [
      "Gilo blanc Farako-Bâ"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Fruits ovoïdes blanchâtres lisses incontournables dans les ragoûts de viande.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-gombo-clemson-spineless",
    "crop_key": "gombo_clemson",
    "name_fr": "Gombo vert précoce Clemson (Abelmoschus esculentus Clemson)",
    "scientific_name": "Abelmoschus esculentus Clemson",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions",
      "Hauts-Bassins",
      "Nord",
      "Centre"
    ],
    "cycle_days_min": 55,
    "cycle_days_max": 70,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison irriguée"
    ],
    "npk_needs": {
      "N": 60,
      "P": 40,
      "K": 50
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Pucerons",
      "Chenille de la capsule (Earias)"
    ],
    "common_diseases": [
      "Oïdium",
      "Virus de l'enroulement jaune (YVMV)"
    ],
    "recommended_varieties": [
      "Clemson Spineless 80",
      "Sabou local"
    ],
    "yield_potential_t_ha": 12,
    "notes": "Gousses vertes sans épines cueillies tous les 2 à 3 jours pour rester tendres.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-gombo-cornu-sahel",
    "crop_key": "gombo_cornu",
    "name_fr": "Gombo cornu traditionnel du Sahel (Abelmoschus caillei)",
    "scientific_name": "Abelmoschus caillei",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Sahel",
      "Centre-Nord",
      "Plateau-Central"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 115,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 40,
      "P": 30,
      "K": 40
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Sautériaux",
      "Punaises"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Cornu du Yatenga",
      "Local Dori"
    ],
    "yield_potential_t_ha": 10,
    "notes": "Plante rustique haute supportant des sécheresses passagères sévères.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-gombo-geant-hivernage",
    "crop_key": "gombo_geant",
    "name_fr": "Gombo géant tardif de saison pluvieuse (Abelmoschus esculentus var. géant)",
    "scientific_name": "Abelmoschus esculentus var. géant",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 100,
    "cycle_days_max": 130,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 70,
      "P": 45,
      "K": 60
    },
    "water_needs_mm": 550,
    "common_pests": [
      "Foreurs"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Géant de Banfora",
      "Tombo"
    ],
    "yield_potential_t_ha": 16,
    "notes": "Troncs ligneux atteignant plus de 2,5 m et production prolongée jusqu'en décembre.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-pasteque-crimson-sweet",
    "crop_key": "pasteque_crimson",
    "name_fr": "Pastèque Crimson Sweet (Citrullus lanatus Crimson)",
    "scientific_name": "Citrullus lanatus Crimson",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Hauts-Bassins",
      "Centre-Est (Bagré)",
      "Nord"
    ],
    "cycle_days_min": 75,
    "cycle_days_max": 95,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Contre-saison",
      "Hivernage"
    ],
    "npk_needs": {
      "N": 80,
      "P": 50,
      "K": 100
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Mouche des fruits (Bactrocera)",
      "Pucerons"
    ],
    "common_diseases": [
      "Fusariose",
      "Anthracnose",
      "Oïdium"
    ],
    "recommended_varieties": [
      "Crimson Sweet",
      "Kaolack",
      "Sugar Baby"
    ],
    "yield_potential_t_ha": 40,
    "notes": "Fruits ronds rayés à chair rouge intense très sucrée et désaltérante.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-pasteque-kaolack",
    "crop_key": "pasteque_kaolack",
    "name_fr": "Pastèque rustique Kaolack (Citrullus lanatus Kaolack)",
    "scientific_name": "Citrullus lanatus Kaolack",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Boucle du Mouhoun",
      "Centre"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 100,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison",
      "Hivernage"
    ],
    "npk_needs": {
      "N": 70,
      "P": 45,
      "K": 90
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Pucerons",
      "Acariens"
    ],
    "common_diseases": [
      "Mildiou"
    ],
    "recommended_varieties": [
      "Kaolack BF",
      "Charleston Gray"
    ],
    "yield_potential_t_ha": 35,
    "notes": "Écorce résistante aux chocs de transport sur longues pistes rurales.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-melon-cantaloup-sahel",
    "crop_key": "melon_cantaloup",
    "name_fr": "Melon Cantaloup brodé sahélien (Cucumis melo var. cantalupensis)",
    "scientific_name": "Cucumis melo var. cantalupensis",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun (Sourou)",
      "Centre",
      "Nord"
    ],
    "cycle_days_min": 70,
    "cycle_days_max": 85,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 90,
      "P": 50,
      "K": 110
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Mouche des fruits",
      "Aleurodes"
    ],
    "common_diseases": [
      "Oïdium",
      "Fusariose"
    ],
    "recommended_varieties": [
      "Charentais tropicalisé",
      "Cantaloup du Sourou"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Chair orange parfumée très sucrée de haute valeur commerciale.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-courge-butternut",
    "crop_key": "courge_butternut",
    "name_fr": "Courge butternut tropicalisée (Cucurbita moschata)",
    "scientific_name": "Cucurbita moschata",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre",
      "Nord"
    ],
    "cycle_days_min": 85,
    "cycle_days_max": 110,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 70,
      "P": 40,
      "K": 80
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Mouche des cucurbitacées"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Waltham Butternut BF",
      "Moschata locale"
    ],
    "yield_potential_t_ha": 28,
    "notes": "Excellente aptitude à la conservation à température ambiante (plus de 4 mois).",
    "iconName": "sprout"
  },
  {
    "id": "sheet-concombre-court-epineux",
    "crop_key": "concombre_court",
    "name_fr": "Concombre court maraîcher (Cucumis sativus court)",
    "scientific_name": "Cucumis sativus court",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre (Koubri)",
      "Centre-Ouest"
    ],
    "cycle_days_min": 50,
    "cycle_days_max": 65,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Contre-saison",
      "Hivernage"
    ],
    "npk_needs": {
      "N": 90,
      "P": 50,
      "K": 90
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Mouche des fruits",
      "Pucerons"
    ],
    "common_diseases": [
      "Mildiou",
      "Oïdium"
    ],
    "recommended_varieties": [
      "Poinsett 76",
      "Marketer"
    ],
    "yield_potential_t_ha": 30,
    "notes": "Cycle ultra-rapide permettant jusqu'à 4 cycles de rotation par an.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-concombre-long-ashley",
    "crop_key": "concombre_long",
    "name_fr": "Concombre long Ashley (Cucumis sativus long)",
    "scientific_name": "Cucumis sativus long",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre"
    ],
    "cycle_days_min": 55,
    "cycle_days_max": 70,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 100,
      "P": 55,
      "K": 100
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Thrips"
    ],
    "common_diseases": [
      "Cladosporiose"
    ],
    "recommended_varieties": [
      "Ashley",
      "Marketmore"
    ],
    "yield_potential_t_ha": 35,
    "notes": "Fruits cylindriques droits appréciés en salade composée.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-courgette-verte-maraichere",
    "crop_key": "courgette_verte",
    "name_fr": "Courgette verte maraîchère (Cucurbita pepo)",
    "scientific_name": "Cucurbita pepo",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins (Bobo)",
      "Nord (Ouahigouya)"
    ],
    "cycle_days_min": 45,
    "cycle_days_max": 60,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Novembre à Février"
    ],
    "npk_needs": {
      "N": 80,
      "P": 50,
      "K": 80
    },
    "water_needs_mm": 380,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Oïdium",
      "Virus CMV"
    ],
    "recommended_varieties": [
      "Black Beauty courgette",
      "Diamant F1"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Récolte quotidienne des jeunes fruits tendres à fleurs épanouies.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-haricot-vert-export-bobo",
    "crop_key": "haricot_vert_export",
    "name_fr": "Haricot vert filet d'exportation (Phaseolus vulgaris)",
    "scientific_name": "Phaseolus vulgaris",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins (Bobo-Dioulasso)",
      "Cascades"
    ],
    "cycle_days_min": 50,
    "cycle_days_max": 65,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Novembre à Mars"
    ],
    "npk_needs": {
      "N": 50,
      "P": 40,
      "K": 50
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Thrips",
      "Pucerons",
      "Mouche des semis"
    ],
    "common_diseases": [
      "Rouille",
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Paulista",
      "Alhambra",
      "Valja"
    ],
    "yield_potential_t_ha": 10,
    "notes": "Filière reine d'exportation maraîchère par fret aérien vers l'Europe.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-petit-pois-maraicher",
    "crop_key": "petit_pois",
    "name_fr": "Petit pois maraîcher nain (Pisum sativum)",
    "scientific_name": "Pisum sativum",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Nord (Ouahigouya)"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 75,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Décembre à Février"
    ],
    "npk_needs": {
      "N": 30,
      "P": 45,
      "K": 35
    },
    "water_needs_mm": 320,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Ascochytose"
    ],
    "recommended_varieties": [
      "Merveille de Kelvedon"
    ],
    "yield_potential_t_ha": 6,
    "notes": "Légume délicat cultivé sur sols légers bien drainés en période fraîche.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-poivron-rouge-export",
    "crop_key": "poivron_rouge",
    "name_fr": "Poivron rouge d'exportation (Capsicum annuum rouge)",
    "scientific_name": "Capsicum annuum rouge",
    "category": "Maraîchage & Légumes-Fruits",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins"
    ],
    "cycle_days_min": 85,
    "cycle_days_max": 110,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 110,
      "P": 60,
      "K": 120
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Mouche blanche"
    ],
    "common_diseases": [
      "Bactériose"
    ],
    "recommended_varieties": [
      "Wonder Red"
    ],
    "yield_potential_t_ha": 26,
    "notes": "Fruits parfaits cueillis à complète maturité rouge pour l'hôtellerie.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-oseille-dah-blanc",
    "crop_key": "oseille_dah_blanc",
    "name_fr": "Oseille de Guinée / Dah blanc (Hibiscus sabdariffa var. altissima)",
    "scientific_name": "Hibiscus sabdariffa var. altissima",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions",
      "Centre",
      "Plateau-Central",
      "Nord"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 90,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 40
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Altises",
      "Pucerons"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Dah blanc local",
      "Sariaso Dah"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Feuilles acidulées indispensables à la sauce Dah qui accompagne le tô.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-bissap-calices-rouge",
    "crop_key": "bissap_rouge",
    "name_fr": "Bissap rouge à calices charnus (Hibiscus sabdariffa)",
    "scientific_name": "Hibiscus sabdariffa",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre-Sud",
      "Hauts-Bassins",
      "Est",
      "Centre-Ouest"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 160,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 40,
      "P": 30,
      "K": 40
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Altises des feuilles",
      "Punaises"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Vimto",
      "Koor rouge",
      "Bissap de Manga"
    ],
    "yield_potential_t_ha": 1.8,
    "notes": "Calices rouge rubis séchés pour boissons rafraîchissantes et infusions médicinales.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-amarante-verte-bitekuteku",
    "crop_key": "amarante_verte",
    "name_fr": "Amarante verte de plein champ (Amaranthus cruentus)",
    "scientific_name": "Amaranthus cruentus",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre (Ouaga)",
      "Hauts-Bassins",
      "Cascades",
      "Nord"
    ],
    "cycle_days_min": 30,
    "cycle_days_max": 45,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Toute l'année (irrigation)"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 60
    },
    "water_needs_mm": 300,
    "common_pests": [
      "Chenilles défoliatrices",
      "Altises"
    ],
    "common_diseases": [
      "Fonte des semis",
      "Choanephora"
    ],
    "recommended_varieties": [
      "Bitekuteku",
      "Local Kamboinsé"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Croissance explosive récoltable toutes les 3 semaines par coupes régulières.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-amarante-pourpre-locale",
    "crop_key": "amarante_pourpre",
    "name_fr": "Amarante pourpre anthocyanée (Amaranthus hybridus pourpre)",
    "scientific_name": "Amaranthus hybridus pourpre",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 35,
    "cycle_days_max": 50,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison",
      "Hivernage"
    ],
    "npk_needs": {
      "N": 75,
      "P": 40,
      "K": 55
    },
    "water_needs_mm": 320,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Pourriture foliaire"
    ],
    "recommended_varieties": [
      "Pourpre de Bobo"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Riche en fer et carotène avec un feuillage violet éclatant.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-morelle-noire-brede",
    "crop_key": "morelle_noire",
    "name_fr": "Morelle noire indigène / Brède (Solanum nigrum complexe)",
    "scientific_name": "Solanum nigrum complexe",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 45,
    "cycle_days_max": 65,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 60,
      "P": 35,
      "K": 50
    },
    "water_needs_mm": 380,
    "common_pests": [
      "Pucerons",
      "Acariens"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Morelle locale Farako-Bâ"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Feuilles légèrement amères dépuratives consommées en ragoût.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-feuilles-baobab-toedo",
    "crop_key": "feuilles_baobab",
    "name_fr": "Feuilles fraîches de Baobab (Adansonia digitata folia)",
    "scientific_name": "Adansonia digitata folia",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Plateau-Central",
      "Centre",
      "Nord",
      "Centre-Nord"
    ],
    "cycle_days_min": 30,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage",
      "Vergers maraîchers"
    ],
    "npk_needs": {
      "N": 30,
      "P": 20,
      "K": 30
    },
    "water_needs_mm": 250,
    "common_pests": [
      "Chenilles"
    ],
    "common_diseases": [
      "Galles foliaires"
    ],
    "recommended_varieties": [
      "Baobab maraîcher greffé"
    ],
    "yield_potential_t_ha": 8,
    "notes": "Récolte sur jeunes plants étêtés pour la poudre de feuilles Toédo / Kuka.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-feuilles-niebe-primeur",
    "crop_key": "feuilles_niebe",
    "name_fr": "Feuilles tendres de Niébé (Vigna unguiculata folia)",
    "scientific_name": "Vigna unguiculata folia",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions"
    ],
    "cycle_days_min": 25,
    "cycle_days_max": 45,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 20,
      "P": 30,
      "K": 20
    },
    "water_needs_mm": 200,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Bactériose"
    ],
    "recommended_varieties": [
      "KVx primeur",
      "Local fane"
    ],
    "yield_potential_t_ha": 6,
    "notes": "Premier légume frais consommé dès le début de l'hivernage.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-feuilles-patate-douce",
    "crop_key": "feuilles_patate",
    "name_fr": "Feuilles de patate douce maraîchère (Ipomoea batatas folia)",
    "scientific_name": "Ipomoea batatas folia",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre",
      "Boucle du Mouhoun"
    ],
    "cycle_days_min": 35,
    "cycle_days_max": 60,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 50
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Acariens"
    ],
    "common_diseases": [
      "Virus"
    ],
    "recommended_varieties": [
      "Patate feuilles BF"
    ],
    "yield_potential_t_ha": 16,
    "notes": "Feuilles d'une tendreté extrême cuites en épinards sahéliens.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-feuilles-manioc-sakasaka",
    "crop_key": "feuilles_manioc",
    "name_fr": "Feuilles de manioc doux / Saka-saka (Manihot esculenta folia)",
    "scientific_name": "Manihot esculenta folia",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 40,
    "cycle_days_max": 180,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 40,
      "P": 25,
      "K": 40
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Cochenilles"
    ],
    "common_diseases": [
      "Mosaïque"
    ],
    "recommended_varieties": [
      "Six-Mois feuilles"
    ],
    "yield_potential_t_ha": 12,
    "notes": "Base du saka-saka traditionnel, écrasé au mortier et bouilli longuement.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-corete-potagere-bulvaka",
    "crop_key": "corete_potagere",
    "name_fr": "Corète potagère / Jute / Bulvaka (Corchorus olitorius)",
    "scientific_name": "Corchorus olitorius",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Nord",
      "Plateau-Central",
      "Centre-Ouest"
    ],
    "cycle_days_min": 35,
    "cycle_days_max": 55,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 70,
      "P": 35,
      "K": 50
    },
    "water_needs_mm": 320,
    "common_pests": [
      "Altises",
      "Acariens"
    ],
    "common_diseases": [
      "Fonte des semis"
    ],
    "recommended_varieties": [
      "Bulvaka local",
      "Corète verte"
    ],
    "yield_potential_t_ha": 20,
    "notes": "Sauce gluante très nutritive facilitant l'ingestion du tô et du couscous de mil.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-epinard-malabar-baselle",
    "crop_key": "baselle_epinard",
    "name_fr": "Épinard de Malabar / Baselle rouge (Basella alba / rubra)",
    "scientific_name": "Basella alba / rubra",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Centre"
    ],
    "cycle_days_min": 45,
    "cycle_days_max": 75,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 60,
      "P": 30,
      "K": 50
    },
    "water_needs_mm": 380,
    "common_pests": [
      "Limaces",
      "Chenilles"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Baselle rouge locale"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Plante grimpante aux feuilles charnues et mucilagineuses rafraîchissantes.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-celosie-argente-soko",
    "crop_key": "celosie_soko",
    "name_fr": "Célosie argentée légume / Soko (Celosia argentea var. oleracea)",
    "scientific_name": "Celosia argentea var. oleracea",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Sud-Ouest",
      "Cascades"
    ],
    "cycle_days_min": 35,
    "cycle_days_max": 55,
    "climate_zones": [
      "Guinéen",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 65,
      "P": 35,
      "K": 50
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Pourriture racinaire"
    ],
    "recommended_varieties": [
      "Soko vert du Sud"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Légume-feuille très prisé au Bénin, Togo et Côte d'Ivoire voisine.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-vernonia-amere-ndole",
    "crop_key": "vernonia_ndole",
    "name_fr": "Vernonia amère / Ndolé (Vernonia amygdalina)",
    "scientific_name": "Vernonia amygdalina",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen humide"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 40
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Ndolé de savane humide"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Arbuste aux feuilles amères thérapeutiques lavées pour plats de prestige.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-moringa-oleifera-feuilles",
    "crop_key": "moringa_feuilles",
    "name_fr": "Moringa oleifera feuilles fraîches (Moringa oleifera folia)",
    "scientific_name": "Moringa oleifera folia",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions",
      "Centre",
      "Nord",
      "Sahel"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 50,
      "P": 40,
      "K": 40
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Chenilles défoliatrices"
    ],
    "common_diseases": [
      "Taches foliaires"
    ],
    "recommended_varieties": [
      "Moringa local CNSF"
    ],
    "yield_potential_t_ha": 12,
    "notes": "L'arbre de vie : concentration prodigieuse en acides aminés, vitamines et calcium.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-moringa-coupe-reguliere",
    "crop_key": "moringa_intensif",
    "name_fr": "Moringa en culture maraîchère intensive (Moringa oleifera var. nain)",
    "scientific_name": "Moringa oleifera var. nain",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre (Loumbila, Koubri)",
      "Nord"
    ],
    "cycle_days_min": 35,
    "cycle_days_max": 120,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Irrigation permanente"
    ],
    "npk_needs": {
      "N": 70,
      "P": 40,
      "K": 60
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Acariens"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Moringa nain PKM-1"
    ],
    "yield_potential_t_ha": 20,
    "notes": "Semis dense fauché à 20 cm du sol tous les 40 jours pour la vente de bottes.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-feuilles-gombo-sechees",
    "crop_key": "feuilles_gombo",
    "name_fr": "Feuilles fraîches et séchées de gombo (Abelmoschus esculentus folia)",
    "scientific_name": "Abelmoschus esculentus folia",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions"
    ],
    "cycle_days_min": 35,
    "cycle_days_max": 60,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 30,
      "P": 20,
      "K": 30
    },
    "water_needs_mm": 250,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Local maraîcher"
    ],
    "yield_potential_t_ha": 5,
    "notes": "Cueillies sans pénaliser la formation des gousses, séchées pour les sauces d'hivernage.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-feuilles-kapokier-rouge",
    "crop_key": "feuilles_kapokier",
    "name_fr": "Feuilles et fleurs de kapokier (Bombax costatum)",
    "scientific_name": "Bombax costatum",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Saison sèche et début pluie"
    ],
    "npk_needs": {
      "N": 20,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 300,
    "common_pests": [
      "Punaises"
    ],
    "common_diseases": [
      "Galles"
    ],
    "recommended_varieties": [
      "Kapokier sauvage"
    ],
    "yield_potential_t_ha": 4,
    "notes": "Calices floraux séchés et jeunes pousses très recherchés pour les sauces gluantes.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-feuilles-sesame-indigenes",
    "crop_key": "feuilles_sesame",
    "name_fr": "Feuilles fraîches de sésame local (Sesamum radiatum)",
    "scientific_name": "Sesamum radiatum",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Centre-Ouest",
      "Est"
    ],
    "cycle_days_min": 40,
    "cycle_days_max": 65,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 30,
      "P": 25,
      "K": 25
    },
    "water_needs_mm": 280,
    "common_pests": [
      "Chenilles"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Sésame feuilles local"
    ],
    "yield_potential_t_ha": 7,
    "notes": "Feuilles à saveur aromatique fine très digestes et riches en mucilage.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-cassia-tora-tafasa",
    "crop_key": "cassia_tora",
    "name_fr": "Cassia tora / Tafasa / Boroboro (Senna tora / Cassia tora)",
    "scientific_name": "Senna tora / Cassia tora",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel",
      "Nord",
      "Centre-Nord",
      "Plateau-Central"
    ],
    "cycle_days_min": 30,
    "cycle_days_max": 60,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 10,
      "P": 20,
      "K": 15
    },
    "water_needs_mm": 200,
    "common_pests": [
      "Criquets"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Tafasa sauvage"
    ],
    "yield_potential_t_ha": 6,
    "notes": "Plante spontanée pionnière consommée pour assainir le tube digestif.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-pourpier-maraicher",
    "crop_key": "pourpier_maraicher",
    "name_fr": "Pourpier maraîcher d'Afrique (Portulaca oleracea)",
    "scientific_name": "Portulaca oleracea",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins",
      "Nord"
    ],
    "cycle_days_min": 25,
    "cycle_days_max": 40,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 40,
      "P": 20,
      "K": 40
    },
    "water_needs_mm": 220,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Fonte des semis"
    ],
    "recommended_varieties": [
      "Pourpier doré sahélien"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Haute teneur naturelle en acides gras Oméga-3 essentiels.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-tetragone-cornue",
    "crop_key": "tetragone_cornue",
    "name_fr": "Tétragone cornue d'été (Tetragonia tetragonioides)",
    "scientific_name": "Tetragonia tetragonioides",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins"
    ],
    "cycle_days_min": 45,
    "cycle_days_max": 70,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison chaude"
    ],
    "npk_needs": {
      "N": 60,
      "P": 30,
      "K": 50
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Limaces"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Tétragone verte"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Remplace parfaitement l'épinard conventionnel pendant les mois chauds de mars-mai.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-feuilles-courge-citrouille",
    "crop_key": "feuilles_courge",
    "name_fr": "Feuilles tendres de citrouille (Cucurbita pepo folia)",
    "scientific_name": "Cucurbita pepo folia",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions"
    ],
    "cycle_days_min": 35,
    "cycle_days_max": 60,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 30,
      "P": 20,
      "K": 30
    },
    "water_needs_mm": 280,
    "common_pests": [
      "Mouche des fruits"
    ],
    "common_diseases": [
      "Mildiou"
    ],
    "recommended_varieties": [
      "Citrouille locale"
    ],
    "yield_potential_t_ha": 8,
    "notes": "Pédoncules épluchés et jeunes feuilles cuits à l'étouffée avec de la pâte d'arachide.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-laitue-batavia-blonde",
    "crop_key": "laitue_batavia",
    "name_fr": "Laitue batavia sahélienne (Lactuca sativa var. capitata)",
    "scientific_name": "Lactuca sativa var. capitata",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre (Ouaga)",
      "Nord",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 40,
    "cycle_days_max": 55,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Novembre à Février"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 70
    },
    "water_needs_mm": 300,
    "common_pests": [
      "Pucerons",
      "Limaces"
    ],
    "common_diseases": [
      "Mildiou",
      "Pourriture bactérienne"
    ],
    "recommended_varieties": [
      "Blonde de Paris",
      "Eden BF"
    ],
    "yield_potential_t_ha": 20,
    "notes": "Pommage serré croquant très demandé par les marchés urbains et supermarchés.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-laitue-romaine-chaleur",
    "crop_key": "laitue_romaine",
    "name_fr": "Laitue romaine résistante à la montée (Lactuca sativa var. longifolia)",
    "scientific_name": "Lactuca sativa var. longifolia",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 45,
    "cycle_days_max": 60,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 75,
      "P": 40,
      "K": 65
    },
    "water_needs_mm": 320,
    "common_pests": [
      "Noctuelles"
    ],
    "common_diseases": [
      "Bactériose"
    ],
    "recommended_varieties": [
      "Romaine de Bobo",
      "Verte de maraîcher"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Retarde considérablement la montée à graines sous forte insolation.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-chou-chine-petsai",
    "crop_key": "chou_chine",
    "name_fr": "Chou de Chine Pe-tsaï (Brassica rapa pekinensis)",
    "scientific_name": "Brassica rapa pekinensis",
    "category": "Légumes-Feuilles",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins (Bobo)"
    ],
    "cycle_days_min": 50,
    "cycle_days_max": 65,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Décembre à Février"
    ],
    "npk_needs": {
      "N": 90,
      "P": 45,
      "K": 80
    },
    "water_needs_mm": 360,
    "common_pests": [
      "Altises",
      "Teigne des crucifères"
    ],
    "common_diseases": [
      "Pourriture molle"
    ],
    "recommended_varieties": [
      "Granat tropicalisé"
    ],
    "yield_potential_t_ha": 28,
    "notes": "Pommes allongées très croquantes idéales pour les sautés et salades.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-chou-pomme-kkcross",
    "crop_key": "chou_kkcross",
    "name_fr": "Chou pommé hybride KK Cross F1 (Brassica oleracea capitata)",
    "scientific_name": "Brassica oleracea capitata",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord (Ouahigouya)",
      "Centre (Koubri)",
      "Hauts-Bassins",
      "Centre-Nord"
    ],
    "cycle_days_min": 65,
    "cycle_days_max": 80,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Contre-saison fraîche"
    ],
    "npk_needs": {
      "N": 120,
      "P": 60,
      "K": 120
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Teigne des crucifères (Plutella xylostella)",
      "Pucerons"
    ],
    "common_diseases": [
      "Pourriture noire bactérienne (Xanthomonas)",
      "Alternariose"
    ],
    "recommended_varieties": [
      "KK Cross F1",
      "Tropica Cross",
      "Oxylus"
    ],
    "yield_potential_t_ha": 40,
    "notes": "Champion de la résistance à la chaleur parmi les choux pommés sahéliens.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-chou-blanc-tropica",
    "crop_key": "chou_tropica",
    "name_fr": "Chou blanc plat Tropica Cross (Brassica oleracea var. plat)",
    "scientific_name": "Brassica oleracea var. plat",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Centre",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 70,
    "cycle_days_max": 85,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 110,
      "P": 55,
      "K": 110
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Plutella",
      "Altises"
    ],
    "common_diseases": [
      "Xanthomonas"
    ],
    "recommended_varieties": [
      "Tropica Cross F1"
    ],
    "yield_potential_t_ha": 38,
    "notes": "Pommes denses et plates supportant un transport de plusieurs centaines de kilomètres.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-chou-rouge-altitude",
    "crop_key": "chou_rouge",
    "name_fr": "Chou rouge maraîcher (Brassica oleracea f. rubra)",
    "scientific_name": "Brassica oleracea f. rubra",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 100,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Décembre à Février"
    ],
    "npk_needs": {
      "N": 115,
      "P": 60,
      "K": 115
    },
    "water_needs_mm": 430,
    "common_pests": [
      "Teigne"
    ],
    "common_diseases": [
      "Bactériose"
    ],
    "recommended_varieties": [
      "Roodkop tropicalisé"
    ],
    "yield_potential_t_ha": 30,
    "notes": "Coloration pourpre intense et forte valeur marchande auprès des hôtels.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-carotte-touchon-yatenga",
    "crop_key": "carotte_touchon",
    "name_fr": "Carotte demi-longue du Yatenga (Daucus carota Touchon)",
    "scientific_name": "Daucus carota Touchon",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord (Ouahigouya, Titao)",
      "Plateau-Central",
      "Centre"
    ],
    "cycle_days_min": 75,
    "cycle_days_max": 95,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Novembre à Février"
    ],
    "npk_needs": {
      "N": 70,
      "P": 50,
      "K": 110
    },
    "water_needs_mm": 380,
    "common_pests": [
      "Mouche de la carotte",
      "Nématodes"
    ],
    "common_diseases": [
      "Alternariose foliaire",
      "Pourriture sclérotique"
    ],
    "recommended_varieties": [
      "Touchon",
      "Chantenay à cœur rouge",
      "Amazonia"
    ],
    "yield_potential_t_ha": 30,
    "notes": "La carotte du Yatenga est renommée dans toute l'Afrique de l'Ouest pour sa douceur.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-carotte-hivernage-tropicale",
    "crop_key": "carotte_hivernage",
    "name_fr": "Carotte d'hivernage Amazonia (Daucus carota tropical)",
    "scientific_name": "Daucus carota tropical",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre"
    ],
    "cycle_days_min": 70,
    "cycle_days_max": 85,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 75,
      "P": 50,
      "K": 100
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Nématodes"
    ],
    "common_diseases": [
      "Alternariose"
    ],
    "recommended_varieties": [
      "Amazonia F1",
      "Brasilia"
    ],
    "yield_potential_t_ha": 24,
    "notes": "Sélectionnée pour tolérer les fortes chaleurs et l'humidité de la saison des pluies.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-navet-blanc-sahel",
    "crop_key": "navet_blanc",
    "name_fr": "Navet blanc des sables sahéliens (Brassica rapa rapifera)",
    "scientific_name": "Brassica rapa rapifera",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Centre",
      "Plateau-Central"
    ],
    "cycle_days_min": 45,
    "cycle_days_max": 60,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Novembre à Janvier"
    ],
    "npk_needs": {
      "N": 60,
      "P": 40,
      "K": 70
    },
    "water_needs_mm": 300,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Pourriture racinaire"
    ],
    "recommended_varieties": [
      "Blanc dur d'hiver",
      "Demi-long nantais"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Croissance très rapide récoltable dès 45 jours après semis direct.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-radis-rond-20jours",
    "crop_key": "radis_rond",
    "name_fr": "Radis rond rouge 20 jours (Raphanus sativus radis)",
    "scientific_name": "Raphanus sativus radis",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins",
      "Nord"
    ],
    "cycle_days_min": 20,
    "cycle_days_max": 30,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Toute l'année sous ombrière"
    ],
    "npk_needs": {
      "N": 40,
      "P": 30,
      "K": 40
    },
    "water_needs_mm": 200,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Fonte des semis"
    ],
    "recommended_varieties": [
      "Rond écarlate",
      "National"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Cycle le plus court du maraîchage sahélien, parfait pour intercaler entre planches.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-betterave-detroit-red",
    "crop_key": "betterave_rouge",
    "name_fr": "Betterave potagère Detroit (Beta vulgaris Detroit)",
    "scientific_name": "Beta vulgaris Detroit",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord (Ouahigouya)",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 65,
    "cycle_days_max": 80,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Novembre à Février"
    ],
    "npk_needs": {
      "N": 80,
      "P": 50,
      "K": 100
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Noctuelles",
      "Pucerons"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Detroit Dark Red",
      "Boltardy"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Racines rondes rouge sang sucrées riches en bétalaïnes détoxifiantes.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-ail-blanc-beregadougou",
    "crop_key": "ail_blanc",
    "name_fr": "Ail blanc parfumé de Bérégadougou (Allium sativum)",
    "scientific_name": "Allium sativum",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades (Bérégadougou)",
      "Nord (Ouahigouya)",
      "Centre-Sud"
    ],
    "cycle_days_min": 105,
    "cycle_days_max": 135,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Octobre à Février"
    ],
    "npk_needs": {
      "N": 70,
      "P": 50,
      "K": 90
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Thrips de l'ail",
      "Acariens des bulbes"
    ],
    "common_diseases": [
      "Rouille de l'ail",
      "Pourriture blanche (Sclerotium)"
    ],
    "recommended_varieties": [
      "Blanc de Bérégadougou",
      "Thermidrome"
    ],
    "yield_potential_t_ha": 12,
    "notes": "Gousses serrées à fort arôme et séchage de longue conservation en tresses.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-ail-violet-sahel",
    "crop_key": "ail_violet",
    "name_fr": "Ail violet précoce du Sahel (Allium sativum var. violet)",
    "scientific_name": "Allium sativum var. violet",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Sahel"
    ],
    "cycle_days_min": 95,
    "cycle_days_max": 120,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Novembre à Février"
    ],
    "npk_needs": {
      "N": 65,
      "P": 45,
      "K": 85
    },
    "water_needs_mm": 370,
    "common_pests": [
      "Thrips"
    ],
    "common_diseases": [
      "Pourriture"
    ],
    "recommended_varieties": [
      "Violet de Dori"
    ],
    "yield_potential_t_ha": 10,
    "notes": "Tuniques striées de violet et précocité de maturité en fin d'harmattan.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-poireau-carentan-tropical",
    "crop_key": "poireau_carentan",
    "name_fr": "Poireau d'Afrique de l'Ouest (Allium porrum)",
    "scientific_name": "Allium porrum",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre",
      "Nord"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 120,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Novembre à Mars"
    ],
    "npk_needs": {
      "N": 90,
      "P": 50,
      "K": 90
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Teigne du poireau",
      "Thrips"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Gros court de Carentan tropical"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Fûts blancs charnus après buttages successifs sur planches irriguées.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-echalote-locale-nord",
    "crop_key": "echalote_locale",
    "name_fr": "Échalote rose traditionnelle (Allium cepa aggregatum)",
    "scientific_name": "Allium cepa aggregatum",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Centre-Nord",
      "Plateau-Central"
    ],
    "cycle_days_min": 70,
    "cycle_days_max": 90,
    "climate_zones": [
      "Soudano-sahélien",
      "Nord"
    ],
    "seasons": [
      "Contre-saison",
      "Hivernage"
    ],
    "npk_needs": {
      "N": 60,
      "P": 40,
      "K": 70
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Thrips"
    ],
    "common_diseases": [
      "Pourriture des bulbes"
    ],
    "recommended_varieties": [
      "Rose du Yatenga",
      "Échalote de Manga"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Multiplication végétative par bulbilles, condiment de choix pour marinades.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-celeri-cotes-maraicher",
    "crop_key": "celeri_cotes",
    "name_fr": "Céleri à côtes maraîcher (Apium graveolens var. dulce)",
    "scientific_name": "Apium graveolens var. dulce",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 85,
    "cycle_days_max": 110,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Décembre à Mars"
    ],
    "npk_needs": {
      "N": 100,
      "P": 50,
      "K": 110
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Septoriose"
    ],
    "recommended_varieties": [
      "Plein blanc doré",
      "Tango"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Côtes croquantes aromatiques très demandées pour les bouillons et soupes.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-persil-frise-jardin",
    "crop_key": "persil_frise",
    "name_fr": "Persil frisé de pleine terre (Petroselinum crispum)",
    "scientific_name": "Petroselinum crispum",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins",
      "Nord"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 90,
    "climate_zones": [
      "Toute l'année sous ombrage"
    ],
    "seasons": [
      "Contre-saison",
      "Hivernage"
    ],
    "npk_needs": {
      "N": 60,
      "P": 35,
      "K": 50
    },
    "water_needs_mm": 320,
    "common_pests": [
      "Limaces"
    ],
    "common_diseases": [
      "Septoriose"
    ],
    "recommended_varieties": [
      "Frisé mousse",
      "Alto"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Plante condimentaire pérenne en récoltes répétées de feuilles fraîches.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-persil-plat-geant",
    "crop_key": "persil_plat",
    "name_fr": "Persil plat géant aromatique (Petroselinum crispum neapolitanum)",
    "scientific_name": "Petroselinum crispum neapolitanum",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 55,
    "cycle_days_max": 80,
    "climate_zones": [
      "Toute l'année"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 65,
      "P": 35,
      "K": 55
    },
    "water_needs_mm": 340,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Fonte des semis"
    ],
    "recommended_varieties": [
      "Géant d'Italie BF"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Arôme bien plus concentré et résistant mieux à la chaleur que le frisé.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-celeri-branche-savane",
    "crop_key": "celeri_branche",
    "name_fr": "Céleri branche parfumé (Apium graveolens secalinum)",
    "scientific_name": "Apium graveolens secalinum",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre"
    ],
    "cycle_days_min": 75,
    "cycle_days_max": 100,
    "climate_zones": [
      "Contre-saison"
    ],
    "seasons": [
      "Novembre à Mars"
    ],
    "npk_needs": {
      "N": 85,
      "P": 45,
      "K": 85
    },
    "water_needs_mm": 380,
    "common_pests": [
      "Thrips"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Céleri vert à couper"
    ],
    "yield_potential_t_ha": 20,
    "notes": "Feuillage abondant séché ou vendu frais pour aromatiser le riz gras.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-fenouil-bulbeux-irrigue",
    "crop_key": "fenouil_bulbeux",
    "name_fr": "Fenouil bulbeux irrigué (Foeniculum vulgare var. azoricum)",
    "scientific_name": "Foeniculum vulgare var. azoricum",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 100,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Décembre à Février"
    ],
    "npk_needs": {
      "N": 70,
      "P": 45,
      "K": 90
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Doux de Florence"
    ],
    "yield_potential_t_ha": 20,
    "notes": "Saveur anisée rafraîchissante très appréciée en salades méditerranéennes.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-chou-rave-maraicher",
    "crop_key": "chou_rave",
    "name_fr": "Chou-rave maraîcher blanc et violet (Brassica oleracea gongylodes)",
    "scientific_name": "Brassica oleracea gongylodes",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Nord (Ouahigouya)"
    ],
    "cycle_days_min": 55,
    "cycle_days_max": 70,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Novembre à Janvier"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 80
    },
    "water_needs_mm": 320,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Bactériose"
    ],
    "recommended_varieties": [
      "Blanc de Vienne",
      "Azur Star"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Tige renflée tendre au goût délicat de noisette consommée râpée crue ou cuite.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-brocoli-contre-saison",
    "crop_key": "brocoli_tropical",
    "name_fr": "Brocoli de contre-saison fraîche (Brassica oleracea italica)",
    "scientific_name": "Brassica oleracea italica",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord (Ouahigouya)",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 65,
    "cycle_days_max": 80,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Décembre à Février"
    ],
    "npk_needs": {
      "N": 110,
      "P": 55,
      "K": 110
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Teigne des crucifères"
    ],
    "common_diseases": [
      "Mildiou"
    ],
    "recommended_varieties": [
      "Calabrais tropicalisé",
      "Green Magic"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Inflorescences d'un vert intense riches en antioxydants et sulforaphane.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-chou-fleur-snowball",
    "crop_key": "chou_fleur",
    "name_fr": "Chou-fleur tropical Snowball (Brassica oleracea botrytis)",
    "scientific_name": "Brassica oleracea botrytis",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 70,
    "cycle_days_max": 85,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Décembre à Février"
    ],
    "npk_needs": {
      "N": 115,
      "P": 60,
      "K": 115
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Pucerons",
      "Chenilles"
    ],
    "common_diseases": [
      "Pourriture bactérienne"
    ],
    "recommended_varieties": [
      "Snowball Tropical",
      "White Corona"
    ],
    "yield_potential_t_ha": 20,
    "notes": "Pommes blanc ivoire bien serrées protégées du soleil par rabattage des feuilles.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-asperge-verte-irriguee",
    "crop_key": "asperge_verte",
    "name_fr": "Asperge verte irriguée (Asparagus officinalis)",
    "scientific_name": "Asparagus officinalis",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins"
    ],
    "cycle_days_min": 180,
    "cycle_days_max": 365,
    "climate_zones": [
      "Contre-saison irriguée"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 80,
      "P": 60,
      "K": 120
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Criocères"
    ],
    "common_diseases": [
      "Rouille de l'asperge"
    ],
    "recommended_varieties": [
      "Mary Washington tropicalisée"
    ],
    "yield_potential_t_ha": 8,
    "notes": "Turions verts primeurs à très haute valeur ajoutée marchande.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-panais-tropicalise",
    "crop_key": "panais_tropical",
    "name_fr": "Panais demi-long tropicalisé (Pastinaca sativa)",
    "scientific_name": "Pastinaca sativa",
    "category": "Légumes-Bulbes & Brassicacées",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 120,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Décembre à Février"
    ],
    "npk_needs": {
      "N": 60,
      "P": 40,
      "K": 80
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Mouche de la carotte"
    ],
    "common_diseases": [
      "Chancre"
    ],
    "recommended_varieties": [
      "Demi-long de Guernesey"
    ],
    "yield_potential_t_ha": 16,
    "notes": "Racine blanche sucrée ancienne de haute tenue en cuisson.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-coton-conventionnel-bf",
    "crop_key": "coton_blanc",
    "name_fr": "Coton blanc conventionnel SOFITEX (Gossypium hirsutum)",
    "scientific_name": "Gossypium hirsutum",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Hauts-Bassins",
      "Cascades",
      "Sud-Ouest",
      "Centre-Ouest"
    ],
    "cycle_days_min": 140,
    "cycle_days_max": 180,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 40
    },
    "water_needs_mm": 650,
    "common_pests": [
      "Ver de la capsule (Helicoverpa)",
      "Pucerons (Aphis gossypii)"
    ],
    "common_diseases": [
      "Bactériose du cotonnier",
      "Virose bleue"
    ],
    "recommended_varieties": [
      "FK 37",
      "FK 64",
      "STAM 59 A"
    ],
    "yield_potential_t_ha": 3,
    "notes": "L'or blanc burkinabè, moteur économique et premier produit d'exportation agricole.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-coton-biologique-equitable",
    "crop_key": "coton_bio",
    "name_fr": "Coton biologique et équitable UNPCB (Gossypium hirsutum bio)",
    "scientific_name": "Gossypium hirsutum bio",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre-Ouest (Koudougou)",
      "Boucle du Mouhoun",
      "Est"
    ],
    "cycle_days_min": 140,
    "cycle_days_max": 175,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 30,
      "P": 30,
      "K": 30
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Helicoverpa armigera"
    ],
    "common_diseases": [
      "Bactériose"
    ],
    "recommended_varieties": [
      "FK 37 Bio",
      "Coton blanc équitable"
    ],
    "yield_potential_t_ha": 1.8,
    "notes": "Certifié sans engrais ni pesticides de synthèse, valorisé avec prime équitable.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-sesame-blanc-export-s42",
    "crop_key": "sesame_blanc",
    "name_fr": "Sésame blanc export haute pureté (Sesamum indicum S-42)",
    "scientific_name": "Sesamum indicum S-42",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Centre-Ouest",
      "Est",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 100,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 30,
      "P": 30,
      "K": 20
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Punaise du sésame",
      "Chenille de la capsule (Antigastra)"
    ],
    "common_diseases": [
      "Cercosporiose",
      "Phyllodie du sésame"
    ],
    "recommended_varieties": [
      "S-42",
      "Gimbi",
      "Wulanda"
    ],
    "yield_potential_t_ha": 1.5,
    "notes": "Graines blanches pures recherchées en confiserie et sur le marché asiatique.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-sesame-noir-oleagineux",
    "crop_key": "sesame_noir",
    "name_fr": "Sésame noir oléagineux (Sesamum indicum var. noir)",
    "scientific_name": "Sesamum indicum var. noir",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Est",
      "Centre-Est"
    ],
    "cycle_days_min": 85,
    "cycle_days_max": 105,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 30,
      "P": 30,
      "K": 20
    },
    "water_needs_mm": 360,
    "common_pests": [
      "Antigastra"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Local noir de Fada"
    ],
    "yield_potential_t_ha": 1.4,
    "notes": "Huile de sésame noir très parfumée utilisée en cosmétique et médecine traditionnelle.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-tournesol-oleagineux-sahel",
    "crop_key": "tournesol_sahel",
    "name_fr": "Tournesol strié oléagineux (Helianthus annuus)",
    "scientific_name": "Helianthus annuus",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Centre-Ouest",
      "Centre-Sud"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 105,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage",
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 60,
      "P": 40,
      "K": 50
    },
    "water_needs_mm": 420,
    "common_pests": [
      "Oiseaux granivores",
      "Pucerons"
    ],
    "common_diseases": [
      "Sclérotiniose",
      "Rouille du tournesol"
    ],
    "recommended_varieties": [
      "Record tropical",
      "Sunfola BF"
    ],
    "yield_potential_t_ha": 2.5,
    "notes": "Tolère les sécheresses intermittentes et offre un tourteau protéique d'excellence.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-ricin-industriel-geoc",
    "crop_key": "ricin_industriel",
    "name_fr": "Ricin géant industriel (Ricinus communis)",
    "scientific_name": "Ricinus communis",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Plateau-Central",
      "Centre",
      "Nord"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 160,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 40,
      "P": 30,
      "K": 30
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Chenilles défoliatrices"
    ],
    "common_diseases": [
      "Fusariose"
    ],
    "recommended_varieties": [
      "Ricin local BF",
      "Graines géantes"
    ],
    "yield_potential_t_ha": 2.8,
    "notes": "Huile technique de haute viscosité pour l'aviation, la pharmacie et les biopolymères.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-jatropha-curcas-haie",
    "crop_key": "jatropha_curcas",
    "name_fr": "Pourghère / Jatropha curcas (Jatropha curcas)",
    "scientific_name": "Jatropha curcas",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions",
      "Plateau-Central",
      "Centre-Sud"
    ],
    "cycle_days_min": 180,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 20,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 300,
    "common_pests": [
      "Punaise du jatropha"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Jatropha de brousse"
    ],
    "yield_potential_t_ha": 3.5,
    "notes": "Haies vives défensives anti-divagation du bétail et graines pour biocarburant pur.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-canne-sucre-sosuco",
    "crop_key": "canne_a_sucre",
    "name_fr": "Canne à sucre industrielle SOSUCO (Saccharum officinarum)",
    "scientific_name": "Saccharum officinarum",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades (Bérégadougou, Banfora)"
    ],
    "cycle_days_min": 300,
    "cycle_days_max": 365,
    "climate_zones": [
      "Périmètres irrigués des Cascades"
    ],
    "seasons": [
      "Irrigation gravitaire permanente"
    ],
    "npk_needs": {
      "N": 150,
      "P": 60,
      "K": 180
    },
    "water_needs_mm": 1500,
    "common_pests": [
      "Foreurs de canne (Eldana)",
      "Cochenilles"
    ],
    "common_diseases": [
      "Charbon de la canne",
      "Rouille brune"
    ],
    "recommended_varieties": [
      "R 570",
      "CP 70-321",
      "Co 997"
    ],
    "yield_potential_t_ha": 110,
    "notes": "Poumon agro-industriel sucrier de Bérégadougou assurant le sucre national.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-tabac-blond-seche",
    "crop_key": "tabac_blond",
    "name_fr": "Tabac blond séché à l'air libre (Nicotiana tabacum blond)",
    "scientific_name": "Nicotiana tabacum blond",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 120,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 80,
      "P": 50,
      "K": 120
    },
    "water_needs_mm": 480,
    "common_pests": [
      "Pucerons du tabac",
      "Noctuelles"
    ],
    "common_diseases": [
      "Mosaïque du tabac (TMV)"
    ],
    "recommended_varieties": [
      "Virginia tropicalisé"
    ],
    "yield_potential_t_ha": 2.5,
    "notes": "Feuilles larges séchées en séchoirs traditionnels ventilés.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-tabac-brun-chiquer",
    "crop_key": "tabac_brun",
    "name_fr": "Tabac brun traditionnel à priser (Nicotiana rustica)",
    "scientific_name": "Nicotiana rustica",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Centre-Nord"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 105,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 70,
      "P": 40,
      "K": 90
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Rustica local"
    ],
    "yield_potential_t_ha": 2,
    "notes": "Forte teneur en nicotine utilisé pour la fabrication de tabac à priser et purins répulsifs.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-kenaf-textile-dah",
    "crop_key": "kenaf_textile",
    "name_fr": "Kenaf textile / Chanvre de Guinée (Hibiscus cannabinus)",
    "scientific_name": "Hibiscus cannabinus",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Centre-Sud"
    ],
    "cycle_days_min": 110,
    "cycle_days_max": 140,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 40
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Kenaf BF 1",
      "Tainung 2"
    ],
    "yield_potential_t_ha": 3.2,
    "notes": "Fibres libériennes résistantes pour sacs en toile de jute, cordages et géotextiles.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-soja-industriel-trituration",
    "crop_key": "soja_industriel",
    "name_fr": "Soja industriel de trituration (Glycine max var. huile)",
    "scientific_name": "Glycine max var. huile",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades"
    ],
    "cycle_days_min": 105,
    "cycle_days_max": 130,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 30,
      "P": 65,
      "K": 45
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Nezara"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "TGX 1448",
      "Samsoy"
    ],
    "yield_potential_t_ha": 3.6,
    "notes": "Broyage pour huile raffinée de table et tourteau d'exportation.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-palmier-huile-basfond",
    "crop_key": "palmier_huile",
    "name_fr": "Palmier à huile de bas-fond (Elaeis guineensis)",
    "scientific_name": "Elaeis guineensis",
    "category": "Cultures Industrielles",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Cascades (zones humides)",
      "Sud-Ouest"
    ],
    "cycle_days_min": 365,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen",
      "Galeries forestières"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 100,
      "P": 60,
      "K": 180
    },
    "water_needs_mm": 1400,
    "common_pests": [
      "Charançon rouge (Rhynchophorus)"
    ],
    "common_diseases": [
      "Fusariose vasculaire"
    ],
    "recommended_varieties": [
      "Tenera hybride"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Régimes de fruits riches en huile rouge brute et palmiste.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-carthame-oleagineux",
    "crop_key": "carthame_sahel",
    "name_fr": "Carthame oléagineux sahélien (Carthamus tinctorius)",
    "scientific_name": "Carthamus tinctorius",
    "category": "Cultures Industrielles",
    "is_burkina_priority": false,
    "country_origin": "Sahel / Afrique de l'Ouest",
    "regions_burkina": [
      "Nord",
      "Boucle du Mouhoun"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 120,
    "climate_zones": [
      "Sahel"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 30
    },
    "water_needs_mm": 320,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Carthame doré"
    ],
    "yield_potential_t_ha": 2.2,
    "notes": "Plante épineuse très résistante à l'aridité produisant une huile diététique.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-lin-oleagineux-froid",
    "crop_key": "lin_oleagineux",
    "name_fr": "Lin oléagineux de contre-saison (Linum usitatissimum)",
    "scientific_name": "Linum usitatissimum",
    "category": "Cultures Industrielles",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Boucle du Mouhoun (Sourou)"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 105,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Décembre à Février"
    ],
    "npk_needs": {
      "N": 60,
      "P": 35,
      "K": 40
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Thrips"
    ],
    "common_diseases": [
      "Fusariose"
    ],
    "recommended_varieties": [
      "Lin brun d'Afrique"
    ],
    "yield_potential_t_ha": 2,
    "notes": "Graines riches en acides gras Oméga-3 et mucilage végétal adoucissant.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-calotropis-soie-vegetale",
    "crop_key": "calotropis_procera",
    "name_fr": "Pommier de Sodome / Soie végétale (Calotropis procera)",
    "scientific_name": "Calotropis procera",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel",
      "Nord",
      "Plateau-Central"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel aride"
    ],
    "seasons": [
      "Pluriannuel spontané"
    ],
    "npk_needs": {
      "N": 0,
      "P": 0,
      "K": 0
    },
    "water_needs_mm": 150,
    "common_pests": [
      "Sautériaux"
    ],
    "common_diseases": [
      "Cochenilles"
    ],
    "recommended_varieties": [
      "Calotropis local"
    ],
    "yield_potential_t_ha": 1.5,
    "notes": "Soie végétale soyeuse entourant les graines pour rembourrage d'isolation thermique.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-cacao-agroforestier-sud",
    "crop_key": "cacao_sud",
    "name_fr": "Cacaoyer sous ombrage forestier (Theobroma cacao)",
    "scientific_name": "Theobroma cacao",
    "category": "Cultures Industrielles",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Sud-Ouest (galeries humides)"
    ],
    "cycle_days_min": 365,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen humide"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 80,
      "P": 50,
      "K": 100
    },
    "water_needs_mm": 1300,
    "common_pests": [
      "Mirides (capsides)",
      "Foreurs"
    ],
    "common_diseases": [
      "Pourriture brune des cabosses",
      "Swollen Shoot"
    ],
    "recommended_varieties": [
      "Forastero ouest-africain",
      "Mercedes"
    ],
    "yield_potential_t_ha": 1.5,
    "notes": "Culture sous couvert forestier dense le long des cours d'eau du Sud-Ouest frontalier.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-cafe-robusta-ombrage",
    "crop_key": "cafe_robusta",
    "name_fr": "Caféier Robusta sous ombrage (Coffea canephora)",
    "scientific_name": "Coffea canephora",
    "category": "Cultures Industrielles",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Sud-Ouest",
      "Cascades"
    ],
    "cycle_days_min": 365,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 90,
      "P": 40,
      "K": 110
    },
    "water_needs_mm": 1200,
    "common_pests": [
      "Scolyte du café"
    ],
    "common_diseases": [
      "Rouille orangée"
    ],
    "recommended_varieties": [
      "Robusta local"
    ],
    "yield_potential_t_ha": 2,
    "notes": "Cerises de café récoltées à la main sous les grands arbres de canopée.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-the-savane-lippia",
    "crop_key": "the_savane",
    "name_fr": "Thé de savane / Lippia aromatique (Lippia multiflora)",
    "scientific_name": "Lippia multiflora",
    "category": "Cultures Industrielles",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Sud-Ouest",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 40,
      "P": 30,
      "K": 40
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Chenilles"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Thé de Gambie BF"
    ],
    "yield_potential_t_ha": 3.5,
    "notes": "Feuilles séchées très aromatiques infusées contre l'hypertension et le stress.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-hevea-latex-galerie",
    "crop_key": "hevea_latex",
    "name_fr": "Hévéa à caoutchouc naturel (Hevea brasiliensis)",
    "scientific_name": "Hevea brasiliensis",
    "category": "Cultures Industrielles",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Cascades (galeries humides)"
    ],
    "cycle_days_min": 365,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen humide"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 70,
      "P": 40,
      "K": 90
    },
    "water_needs_mm": 1400,
    "common_pests": [
      "Termites"
    ],
    "common_diseases": [
      "Maladie des raies noires"
    ],
    "recommended_varieties": [
      "GT 1",
      "PB 260"
    ],
    "yield_potential_t_ha": 2.2,
    "notes": "Saignée quotidienne de l'écorce pour récolte du latex blanc brut.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-manguier-amelie-precoce",
    "crop_key": "mangue_amelie",
    "name_fr": "Manguier greffé Amélie précoce (Mangifera indica Amélie)",
    "scientific_name": "Mangifera indica Amélie",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Centre-Ouest"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Récolte mars-mai"
    ],
    "npk_needs": {
      "N": 100,
      "P": 40,
      "K": 120
    },
    "water_needs_mm": 750,
    "common_pests": [
      "Mouches des fruits (Bactrocera dorsalis)"
    ],
    "common_diseases": [
      "Anthracnose de la mangue",
      "Bactériose"
    ],
    "recommended_varieties": [
      "Amélie (Gouverneur)"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Mangue précoce sans fibres très douce ouvrant la campagne d'exportation burkinabè.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-manguier-kent-export",
    "crop_key": "mangue_kent",
    "name_fr": "Manguier Kent d'exportation (Mangifera indica Kent)",
    "scientific_name": "Mangifera indica Kent",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins (Orodara)",
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 110,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Récolte mai-juin"
    ],
    "npk_needs": {
      "N": 110,
      "P": 45,
      "K": 130
    },
    "water_needs_mm": 800,
    "common_pests": [
      "Bactrocera dorsalis"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Kent greffée"
    ],
    "yield_potential_t_ha": 25,
    "notes": "La reine de l'exportation par avion et bateau, chair ferme exempte de fibres.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-manguier-brooks-tardif",
    "crop_key": "mangue_brooks",
    "name_fr": "Manguier Brooks tardif de séchage (Mangifera indica Brooks)",
    "scientific_name": "Mangifera indica Brooks",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades"
    ],
    "cycle_days_min": 130,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Récolte juillet-août"
    ],
    "npk_needs": {
      "N": 100,
      "P": 40,
      "K": 120
    },
    "water_needs_mm": 850,
    "common_pests": [
      "Mouche des fruits"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Brooks (Retard)"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Variété maîtresse des unités artisanales et industrielles de séchage de mangues.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-manguier-keitt-gros",
    "crop_key": "mangue_keitt",
    "name_fr": "Manguier Keitt gros calibre (Mangifera indica Keitt)",
    "scientific_name": "Mangifera indica Keitt",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Récolte juin-juillet"
    ],
    "npk_needs": {
      "N": 105,
      "P": 45,
      "K": 125
    },
    "water_needs_mm": 800,
    "common_pests": [
      "Bactrocera"
    ],
    "common_diseases": [
      "Bactériose"
    ],
    "recommended_varieties": [
      "Keitt"
    ],
    "yield_potential_t_ha": 26,
    "notes": "Gros fruits vert-rosé pouvant atteindre 800 g chacun très recherchés tard en saison.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-anacardier-greffe-cajou",
    "crop_key": "anacardier_cajou",
    "name_fr": "Anacardier greffé / Pomme cajou (Anacardium occidentale)",
    "scientific_name": "Anacardium occidentale",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Sud-Ouest",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Récolte février-mai"
    ],
    "npk_needs": {
      "N": 60,
      "P": 30,
      "K": 60
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Punaise Helopeltis",
      "Foreurs de branches"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Sélection INERA Farako-Bâ",
      "Gros cajou"
    ],
    "yield_potential_t_ha": 2.5,
    "notes": "Noix de cajou de haute valeur exportable et fausse-pomme pour jus rafraîchissant.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-karite-arbre-or",
    "crop_key": "karite_arbre",
    "name_fr": "Karité amélioré / Arbre à beurre (Vitellaria paradoxa)",
    "scientific_name": "Vitellaria paradoxa",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions hors Sahel extrême",
      "Centre-Ouest",
      "Hauts-Bassins",
      "Plateau-Central"
    ],
    "cycle_days_min": 150,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Récolte mai-août"
    ],
    "npk_needs": {
      "N": 0,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Chenilles Cirina butyrospermi (Chitoumou)"
    ],
    "common_diseases": [
      "Loranthacées (parasite)"
    ],
    "recommended_varieties": [
      "Karité sélectionné INERA greffé"
    ],
    "yield_potential_t_ha": 1.2,
    "notes": "Arbre patrimonial emblématique, amandes transformées en beurre de karité mondialement réputé.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-nere-caroubier-africain",
    "crop_key": "nere_arbre",
    "name_fr": "Néré / Caroubier africain à soumbala (Parkia biglobosa)",
    "scientific_name": "Parkia biglobosa",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre-Sud",
      "Hauts-Bassins",
      "Sud-Ouest",
      "Plateau-Central"
    ],
    "cycle_days_min": 150,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Récolte mars-mai"
    ],
    "npk_needs": {
      "N": 0,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Sautériaux"
    ],
    "common_diseases": [
      "Loranthus"
    ],
    "recommended_varieties": [
      "Néré sauvage sélectionné"
    ],
    "yield_potential_t_ha": 1.5,
    "notes": "Graines fermentées pour préparer le condiment ancestral irremplaçable : le Soumbala.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-baobab-pain-de-singe",
    "crop_key": "baobab_fruit",
    "name_fr": "Baobab / Pain de singe pulpe (Adansonia digitata fruit)",
    "scientific_name": "Adansonia digitata fruit",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel",
      "Nord",
      "Plateau-Central",
      "Centre"
    ],
    "cycle_days_min": 180,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Récolte déc-mars"
    ],
    "npk_needs": {
      "N": 0,
      "P": 10,
      "K": 20
    },
    "water_needs_mm": 300,
    "common_pests": [
      "Chenilles"
    ],
    "common_diseases": [
      "Pourriture sèche"
    ],
    "recommended_varieties": [
      "Baobab géant"
    ],
    "yield_potential_t_ha": 3,
    "notes": "Pulpe blanche acidulée (pain de singe) concentrée en calcium, potassium et vitamine C.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-papayer-solo-8",
    "crop_key": "papaye_solo",
    "name_fr": "Papayer Solo 8 / Sunrise (Carica papaya Solo)",
    "scientific_name": "Carica papaya Solo",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Hauts-Bassins",
      "Centre"
    ],
    "cycle_days_min": 180,
    "cycle_days_max": 365,
    "climate_zones": [
      "Périmètres irrigués des savanes"
    ],
    "seasons": [
      "Toute l'année en verger irrigué"
    ],
    "npk_needs": {
      "N": 120,
      "P": 60,
      "K": 150
    },
    "water_needs_mm": 900,
    "common_pests": [
      "Acariens",
      "Mouche des papayes"
    ],
    "common_diseases": [
      "Anthracnose",
      "Virus PRSV"
    ],
    "recommended_varieties": [
      "Solo 8",
      "Sunrise"
    ],
    "yield_potential_t_ha": 50,
    "notes": "Petits fruits poires individuels d'une exceptionnelle douceur à chair rouge-orangée.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-papayer-red-lady-f1",
    "crop_key": "papaye_red_lady",
    "name_fr": "Papayer nain hybride Red Lady F1 (Carica papaya Red Lady)",
    "scientific_name": "Carica papaya Red Lady",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre (Koubri)",
      "Hauts-Bassins",
      "Cascades"
    ],
    "cycle_days_min": 160,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Irrigation régulière"
    ],
    "npk_needs": {
      "N": 140,
      "P": 70,
      "K": 170
    },
    "water_needs_mm": 950,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "PRSV"
    ],
    "recommended_varieties": [
      "Red Lady 786 F1"
    ],
    "yield_potential_t_ha": 70,
    "notes": "Commence à fructifier à seulement 80 cm du sol avec une rentabilité record.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-bananier-plantain-corne",
    "crop_key": "banane_plantain",
    "name_fr": "Bananier plantain Corne de Banfora (Musa paradisiaca)",
    "scientific_name": "Musa paradisiaca",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades (Banfora, Bansié)",
      "Sud-Ouest"
    ],
    "cycle_days_min": 300,
    "cycle_days_max": 365,
    "climate_zones": [
      "Bas-fonds humides irrigués"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 150,
      "P": 50,
      "K": 220
    },
    "water_needs_mm": 1300,
    "common_pests": [
      "Charançon du bananier (Cosmopolites)"
    ],
    "common_diseases": [
      "Cercosporiose noire",
      "Panama"
    ],
    "recommended_varieties": [
      "Corne 1",
      "French Sombre"
    ],
    "yield_potential_t_ha": 30,
    "notes": "Régimes lourds de plantains fermes frits en alloco ou pilés en foutou.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-bananier-cavendish-doux",
    "crop_key": "banane_cavendish",
    "name_fr": "Bananier doux Grande Naine (Musa acuminata Cavendish)",
    "scientific_name": "Musa acuminata Cavendish",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Centre-Est (Bagré)"
    ],
    "cycle_days_min": 270,
    "cycle_days_max": 365,
    "climate_zones": [
      "Périmètres irrigués"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 160,
      "P": 50,
      "K": 240
    },
    "water_needs_mm": 1400,
    "common_pests": [
      "Nématodes",
      "Charançons"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Grande Naine",
      "Poyo"
    ],
    "yield_potential_t_ha": 45,
    "notes": "Bananes de table douces produites sous micro-aspersion ou submersion continue.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-oranger-valencia-late",
    "crop_key": "oranger_valencia",
    "name_fr": "Oranger greffé Valencia Late (Citrus sinensis Valencia)",
    "scientific_name": "Citrus sinensis Valencia",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Centre-Ouest"
    ],
    "cycle_days_min": 240,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien irrigué"
    ],
    "seasons": [
      "Récolte nov-février"
    ],
    "npk_needs": {
      "N": 120,
      "P": 50,
      "K": 130
    },
    "water_needs_mm": 900,
    "common_pests": [
      "Mouche des agrumes (Ceratitis)",
      "Cochenilles"
    ],
    "common_diseases": [
      "Gommose (Phytophthora)",
      "Tristeza"
    ],
    "recommended_varieties": [
      "Valencia Late",
      "Hamlin"
    ],
    "yield_potential_t_ha": 30,
    "notes": "Oranges juteuses convenant parfaitement à l'extraction de jus frais.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-mandarinier-clementine",
    "crop_key": "mandarinier_tropical",
    "name_fr": "Mandarinier Clémentine tropicale (Citrus reticulata)",
    "scientific_name": "Citrus reticulata",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades"
    ],
    "cycle_days_min": 210,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Récolte oct-décembre"
    ],
    "npk_needs": {
      "N": 110,
      "P": 45,
      "K": 120
    },
    "water_needs_mm": 850,
    "common_pests": [
      "Cératite"
    ],
    "common_diseases": [
      "Pourriture racinaire"
    ],
    "recommended_varieties": [
      "Clémentine de Bobo",
      "Dancy"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Écorce facile à peler et quartiers sucrés sans pépins.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-citronnier-lime-tahiti",
    "crop_key": "citronnier_lime",
    "name_fr": "Citronnier vert Lime de Tahiti (Citrus aurantiifolia)",
    "scientific_name": "Citrus aurantiifolia",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions sous irrigation",
      "Hauts-Bassins",
      "Centre"
    ],
    "cycle_days_min": 180,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 90,
      "P": 40,
      "K": 100
    },
    "water_needs_mm": 750,
    "common_pests": [
      "Mineuse des agrumes",
      "Pucerons"
    ],
    "common_diseases": [
      "Chancre citrique"
    ],
    "recommended_varieties": [
      "Lime de Tahiti",
      "Citron local de Bobo"
    ],
    "yield_potential_t_ha": 20,
    "notes": "Limes vert intense hyper juteuses et indispensables en assaisonnement.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-pamplemoussier-pomelo",
    "crop_key": "pamplemousse_pomelo",
    "name_fr": "Pamplemoussier Pomelo Marsh (Citrus paradisi Marsh)",
    "scientific_name": "Citrus paradisi Marsh",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins"
    ],
    "cycle_days_min": 240,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien irrigué"
    ],
    "seasons": [
      "Récolte décembre-mars"
    ],
    "npk_needs": {
      "N": 130,
      "P": 50,
      "K": 140
    },
    "water_needs_mm": 950,
    "common_pests": [
      "Mouches des fruits"
    ],
    "common_diseases": [
      "Tristeza"
    ],
    "recommended_varieties": [
      "Marsh Seedless",
      "Star Ruby"
    ],
    "yield_potential_t_ha": 35,
    "notes": "Gros pomelos sans pépins à chair jaune ou rose très désaltérante.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-goyavier-pomme-rouge",
    "crop_key": "goyave_rouge",
    "name_fr": "Goyavier pomme chair rose (Psidium guajava rouge)",
    "scientific_name": "Psidium guajava rouge",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Hauts-Bassins",
      "Sud-Ouest"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Récolte toute l'année"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 90
    },
    "water_needs_mm": 650,
    "common_pests": [
      "Mouches des fruits"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Goyave rose de Banfora"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Parfum envoûtant et teneur en vitamine C 4 fois supérieure à celle de l'orange.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-goyavier-blanc-savane",
    "crop_key": "goyave_blanche",
    "name_fr": "Goyavier blanc des savanes (Psidium guajava blanche)",
    "scientific_name": "Psidium guajava blanche",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Fructification 2 fois/an"
    ],
    "npk_needs": {
      "N": 75,
      "P": 40,
      "K": 85
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Cératites"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Blanche de Kamboinsé"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Fruits fermes résistant bien à la manipulation pour les étals de marché.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-goyavier-fraise",
    "crop_key": "goyave_fraise",
    "name_fr": "Goyavier-fraise pourpre nain (Psidium cattleyanum)",
    "scientific_name": "Psidium cattleyanum",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Cascades"
    ],
    "cycle_days_min": 100,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen"
    ],
    "seasons": [
      "Automne-Hiver"
    ],
    "npk_needs": {
      "N": 60,
      "P": 30,
      "K": 60
    },
    "water_needs_mm": 550,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Pourriture"
    ],
    "recommended_varieties": [
      "Cattleyanum pourpre"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Petits fruits sphériques rouges à saveur de fraise des bois acidulée.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-avocatier-hass-greffe",
    "crop_key": "avocat_hass",
    "name_fr": "Avocatier greffé Hass (Persea americana Hass)",
    "scientific_name": "Persea americana Hass",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades (Banfora)",
      "Sud-Ouest",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 240,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien humide"
    ],
    "seasons": [
      "Récolte nov-février"
    ],
    "npk_needs": {
      "N": 120,
      "P": 50,
      "K": 140
    },
    "water_needs_mm": 1000,
    "common_pests": [
      "Thrips de l'avocatier",
      "Cochenilles"
    ],
    "common_diseases": [
      "Phytophthora cinnamomi (pourriture racinaire)"
    ],
    "recommended_varieties": [
      "Hass tropicalisé",
      "Fuerte"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Peau granuleuse virant au noir à maturité, chair crémeuse riche en bons lipides.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-avocatier-pollock-precoce",
    "crop_key": "avocat_pollock",
    "name_fr": "Avocatier Pollock géant antillais (Persea americana Pollock)",
    "scientific_name": "Persea americana Pollock",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 200,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen",
      "Soudanien humide"
    ],
    "seasons": [
      "Récolte juillet-septembre"
    ],
    "npk_needs": {
      "N": 110,
      "P": 45,
      "K": 130
    },
    "water_needs_mm": 1100,
    "common_pests": [
      "Acariens"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Pollock de Banfora",
      "Lula"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Fruits énormes allongés à chair fondante et légère.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-palmier-dattier-sahel",
    "crop_key": "dattier_sahel",
    "name_fr": "Palmier dattier du Sahel (Phoenix dactylifera)",
    "scientific_name": "Phoenix dactylifera",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel (Dori, Gorom-Gorom, Oudalan)",
      "Nord"
    ],
    "cycle_days_min": 200,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel aride oasien"
    ],
    "seasons": [
      "Récolte mai-août"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 120
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Charançon rouge",
      "Cochenille blanche"
    ],
    "common_diseases": [
      "Bayoud"
    ],
    "recommended_varieties": [
      "Deglet Dori",
      "Dattes locales Sahel"
    ],
    "yield_potential_t_ha": 10,
    "notes": "Reine des oasis supportant un air désertique brûlant avec les racines dans l'eau.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-palmier-ronier-borassus",
    "crop_key": "palmier_ronier",
    "name_fr": "Palmier rônier / Rônier africain (Borassus aethiopum)",
    "scientific_name": "Borassus aethiopum",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Plateau-Central",
      "Centre",
      "Cascades"
    ],
    "cycle_days_min": 365,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 0,
      "P": 10,
      "K": 10
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Oryctes du palmier"
    ],
    "common_diseases": [
      "Pourriture du bourgeon terminal"
    ],
    "recommended_varieties": [
      "Rônier local"
    ],
    "yield_potential_t_ha": 5,
    "notes": "Troncs imputrescibles pour charpentes, sève pour vin de palme et fruits gélatineux.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-grenadier-oasis-sahel",
    "crop_key": "grenadier_sahel",
    "name_fr": "Grenadier d'Oasis sahélien (Punica granatum)",
    "scientific_name": "Punica granatum",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel",
      "Nord",
      "Boucle du Mouhoun"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel irrigué"
    ],
    "seasons": [
      "Récolte mars-juin"
    ],
    "npk_needs": {
      "N": 60,
      "P": 30,
      "K": 70
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Mouche des fruits"
    ],
    "common_diseases": [
      "Éclatement des fruits"
    ],
    "recommended_varieties": [
      "Mollar tropicalisé",
      "Grenat du Sahel"
    ],
    "yield_potential_t_ha": 16,
    "notes": "Fruits rubis regorgeant d'arilles juteux très riches en punicalagines antioxydantes.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-jujubier-greffe-gola",
    "crop_key": "jujubier_pomme",
    "name_fr": "Jujubier greffé / Pomme du Sahel (Ziziphus mauritiana Gola)",
    "scientific_name": "Ziziphus mauritiana Gola",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel",
      "Nord",
      "Centre-Nord",
      "Plateau-Central"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Récolte déc-février"
    ],
    "npk_needs": {
      "N": 30,
      "P": 20,
      "K": 30
    },
    "water_needs_mm": 250,
    "common_pests": [
      "Mouche du jujube (Carpomyia)"
    ],
    "common_diseases": [
      "Oïdium du jujubier"
    ],
    "recommended_varieties": [
      "Gola",
      "Seb",
      "Umran",
      "Goutte d'Or"
    ],
    "yield_potential_t_ha": 12,
    "notes": "Fruits charnus gros comme une petite pomme très croquants et sucrés.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-tamarinier-doux-agroforesterie",
    "crop_key": "tamarinier_doux",
    "name_fr": "Tamarinier d'agroforesterie (Tamarindus indica)",
    "scientific_name": "Tamarindus indica",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions",
      "Centre",
      "Nord",
      "Sud-Ouest"
    ],
    "cycle_days_min": 180,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Récolte fév-mai"
    ],
    "npk_needs": {
      "N": 0,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Charançons des gousses"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Tamarin doux sélectionné"
    ],
    "yield_potential_t_ha": 4,
    "notes": "Gousses courbées à pulpe brune acidulée pour jus rafraîchissant et sauces épicées.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-pomme-cannelle-annone",
    "crop_key": "pomme_cannelle",
    "name_fr": "Pomme-cannelle / Annone écailleuse (Annona squamosa)",
    "scientific_name": "Annona squamosa",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Centre"
    ],
    "cycle_days_min": 100,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Récolte août-octobre"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 50
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Cochenilles farineuses"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Squamosa verte locale"
    ],
    "yield_potential_t_ha": 14,
    "notes": "Chair blanche onctueuse sucrée au parfum divin de crème anglaise à la cannelle.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-corossolier-epineux",
    "crop_key": "corossolier",
    "name_fr": "Corossolier épineux / Graviola (Annona muricata)",
    "scientific_name": "Annona muricata",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Sud-Ouest",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 140,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien humide",
      "Guinéen"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 70,
      "P": 40,
      "K": 80
    },
    "water_needs_mm": 750,
    "common_pests": [
      "Cochenilles"
    ],
    "common_diseases": [
      "Pourriture des fruits"
    ],
    "recommended_varieties": [
      "Corossol doux de Banfora"
    ],
    "yield_potential_t_ha": 20,
    "notes": "Fruits géants à chair blanche acidulée reconnue pour ses vertus toniques.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-pomme-du-cajou-fruit",
    "crop_key": "pomme_cajou",
    "name_fr": "Pomme de cajou juteuse de table (Anacardium occidentale pomme)",
    "scientific_name": "Anacardium occidentale pomme",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Sud-Ouest"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Février à Avril"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 50
    },
    "water_needs_mm": 550,
    "common_pests": [
      "Mouches"
    ],
    "common_diseases": [
      "Fermentation rapide"
    ],
    "recommended_varieties": [
      "Pomme jaune de Banfora"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Faux-fruit hyper juteux pressé pour nectar vitaminé et confiture artisanale.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-prunier-cythere-pomme",
    "crop_key": "prunier_cythere",
    "name_fr": "Prunier de Cythère / Pomme Cythère (Spondias dulcis)",
    "scientific_name": "Spondias dulcis",
    "category": "Arboriculture Fruitière",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Cascades",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen"
    ],
    "seasons": [
      "Récolte nov-janvier"
    ],
    "npk_needs": {
      "N": 60,
      "P": 35,
      "K": 60
    },
    "water_needs_mm": 700,
    "common_pests": [
      "Mouches des fruits"
    ],
    "common_diseases": [
      "Taches foliaires"
    ],
    "recommended_varieties": [
      "Cythère nain tropical"
    ],
    "yield_potential_t_ha": 22,
    "notes": "Grappes de fruits croquants acidulés mangés avec sel et piment ou en jus glacé.",
    "iconName": "cookie"
  },
  {
    "id": "sheet-artemisia-annua-locale",
    "crop_key": "artemisia",
    "name_fr": "Artemisia annua antipaludique (Artemisia annua)",
    "scientific_name": "Artemisia annua",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Plateau-Central",
      "Cascades"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 150,
    "climate_zones": [
      "Hauts-Bassins",
      "Plateau-Central",
      "Cascades"
    ],
    "seasons": [
      "Hivernage et contre-saison fraîche"
    ],
    "npk_needs": {
      "N": 60,
      "P": 40,
      "K": 60
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Pucerons",
      "Acariens"
    ],
    "common_diseases": [
      "Fonte des semis",
      "Oïdium"
    ],
    "recommended_varieties": [
      "Artemisia annua sélection INERA"
    ],
    "yield_potential_t_ha": 3.5,
    "notes": "Plante médicinale antipaludique reconnue, séchée sous ombrage pour préserver l'artémisinine.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-menthe-verte-nana",
    "crop_key": "menthe_verte",
    "name_fr": "Menthe verte pour thé maure (Mentha spicata var. nana)",
    "scientific_name": "Mentha spicata var. nana",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Nord",
      "Sahel",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 40,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudano-sahélien",
      "Sahel"
    ],
    "seasons": [
      "Toute l'année en planches irriguées"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 70
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Chenilles",
      "Pucerons"
    ],
    "common_diseases": [
      "Rouille de la menthe"
    ],
    "recommended_varieties": [
      "Nana marocaine tropicalisée",
      "Menthe de Koubri"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Incontournable pour le thé vert à la menthe des trois verres de bienvenue.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-menthe-poivree-basfond",
    "crop_key": "menthe_poivree",
    "name_fr": "Menthe poivrée rafraîchissante (Mentha x piperita)",
    "scientific_name": "Mentha x piperita",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins"
    ],
    "cycle_days_min": 50,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien frais"
    ],
    "seasons": [
      "Contre-saison"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 70
    },
    "water_needs_mm": 650,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Verticilliose"
    ],
    "recommended_varieties": [
      "Mitcham tropicalisée"
    ],
    "yield_potential_t_ha": 15,
    "notes": "Haute concentration en menthol pour tisanes digestives et arômes.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-basilic-grand-vert",
    "crop_key": "basilic_grand_vert",
    "name_fr": "Basilic grand vert doux (Ocimum basilicum)",
    "scientific_name": "Ocimum basilicum",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins",
      "Nord"
    ],
    "cycle_days_min": 45,
    "cycle_days_max": 75,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 70,
      "P": 35,
      "K": 60
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Fusariose du basilic"
    ],
    "recommended_varieties": [
      "Grand vert de Provence BF"
    ],
    "yield_potential_t_ha": 14,
    "notes": "Feuilles tendres très parfumées pour sauces fraîches et assaisonnements.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-basilic-africain-gratissimum",
    "crop_key": "basilic_africain",
    "name_fr": "Basilic africain / Kinkeliba blanc (Ocimum gratissimum)",
    "scientific_name": "Ocimum gratissimum",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions",
      "Cascades",
      "Centre-Sud"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 30,
      "P": 20,
      "K": 30
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Punaises"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Gratissimum local sauvage"
    ],
    "yield_potential_t_ha": 8,
    "notes": "Plante sacrée aux puissantes vertus antibactériennes, digestives et répulsives de moustiques.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-kinkeliba-savane-tisane",
    "crop_key": "kinkeliba_tisane",
    "name_fr": "Kinkéliba / Tisane de longue vie (Combretum micranthum)",
    "scientific_name": "Combretum micranthum",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions de savane",
      "Plateau-Central",
      "Est",
      "Centre"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Pluriannuel spontané"
    ],
    "npk_needs": {
      "N": 0,
      "P": 10,
      "K": 10
    },
    "water_needs_mm": 300,
    "common_pests": [
      "Charançons des feuilles"
    ],
    "common_diseases": [
      "Galles"
    ],
    "recommended_varieties": [
      "Combretum local"
    ],
    "yield_potential_t_ha": 2,
    "notes": "Décoction matinale purifiante du foie bue lors du jeûne et au quotidien.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-citronnelle-savanes",
    "crop_key": "citronnelle_savane",
    "name_fr": "Citronnelle des savanes à tisane (Cymbopogon citratus)",
    "scientific_name": "Cymbopogon citratus",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Centre",
      "Sud-Ouest"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Toute l'année"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 50
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Criquets"
    ],
    "common_diseases": [
      "Rouille foliaire"
    ],
    "recommended_varieties": [
      "Citronnelle de brousse"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Touffes herbacées très denses dégageant un parfum pur d'huile essentielle de citral.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-poivre-noir-sud-ouest",
    "crop_key": "poivre_noir",
    "name_fr": "Poivrier noir sous ombrage (Piper nigrum)",
    "scientific_name": "Piper nigrum",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Sud-Ouest",
      "Cascades"
    ],
    "cycle_days_min": 365,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen humide"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 90
    },
    "water_needs_mm": 1200,
    "common_pests": [
      "Nématodes"
    ],
    "common_diseases": [
      "Phytophthora"
    ],
    "recommended_varieties": [
      "Panniyur tropical"
    ],
    "yield_potential_t_ha": 2.5,
    "notes": "Liane grimpante sur tuteurs vivants produisant grains noirs et blancs.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-poivre-selim-guinee",
    "crop_key": "poivre_selim",
    "name_fr": "Poivre de Guinée / Kani / Selim (Xylopia aethiopica)",
    "scientific_name": "Xylopia aethiopica",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Sud-Ouest",
      "Cascades"
    ],
    "cycle_days_min": 365,
    "cycle_days_max": 365,
    "climate_zones": [
      "Galeries forestières"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 20,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 800,
    "common_pests": [
      "Foreurs"
    ],
    "common_diseases": [
      "Pourriture"
    ],
    "recommended_varieties": [
      "Selim de galerie"
    ],
    "yield_potential_t_ha": 3,
    "notes": "Gousses aromatiques noires fumées pilées dans le café Touba et les sauces médicinales.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-clou-girofle-savane",
    "crop_key": "clou_girofle",
    "name_fr": "Giroflier / Clous de girofle (Syzygium aromaticum)",
    "scientific_name": "Syzygium aromaticum",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Sud-Ouest"
    ],
    "cycle_days_min": 365,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen humide"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 60,
      "P": 30,
      "K": 60
    },
    "water_needs_mm": 1100,
    "common_pests": [
      "Cochenilles"
    ],
    "common_diseases": [
      "Dépérissement"
    ],
    "recommended_varieties": [
      "Giroflier tropical"
    ],
    "yield_potential_t_ha": 1.8,
    "notes": "Boutons floraux séchés puissamment antiseptiques et anesthésiques dentaires.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-cannelle-ecorce-savane",
    "crop_key": "cannelle_ecorce",
    "name_fr": "Cannelier / Écorce de cannelle (Cinnamomum verum)",
    "scientific_name": "Cinnamomum verum",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Cascades"
    ],
    "cycle_days_min": 365,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 50
    },
    "water_needs_mm": 1000,
    "common_pests": [
      "Chenilles"
    ],
    "common_diseases": [
      "Taches foliaires"
    ],
    "recommended_varieties": [
      "Cannelier de Ceylan ouest-africain"
    ],
    "yield_potential_t_ha": 2,
    "notes": "Écorce séchée en tuyaux fins au parfum chaleureux et anti-glycémique.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-poivre-ashanti-guineense",
    "crop_key": "poivre_ashanti",
    "name_fr": "Faux poivre d'Ashanti / Uziza (Piper guineense)",
    "scientific_name": "Piper guineense",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Sud-Ouest"
    ],
    "cycle_days_min": 365,
    "cycle_days_max": 365,
    "climate_zones": [
      "Guinéen humide"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 60,
      "P": 30,
      "K": 70
    },
    "water_needs_mm": 1000,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Pourriture"
    ],
    "recommended_varieties": [
      "Uziza forestier"
    ],
    "yield_potential_t_ha": 1.8,
    "notes": "Baies et feuilles très aromatiques au piquant boisé caractéristique.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-graines-nere-fermentees",
    "crop_key": "soumbala_brut",
    "name_fr": "Graines de néré pour Soumbala (Parkia biglobosa semen)",
    "scientific_name": "Parkia biglobosa semen",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Centre-Sud",
      "Passoré"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Récolte gousses mars-mai"
    ],
    "npk_needs": {
      "N": 0,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Charançons"
    ],
    "common_diseases": [
      "Moisissure"
    ],
    "recommended_varieties": [
      "Néré sauvage"
    ],
    "yield_potential_t_ha": 1.8,
    "notes": "Graines noires décortiquées et fermentées constituant la base protéique du Soumbala.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-romarin-officinal-sahel",
    "crop_key": "romarin_officinal",
    "name_fr": "Romarin officinal vivace (Salvia rosmarinus)",
    "scientific_name": "Salvia rosmarinus",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins",
      "Nord"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Pluriannuel en planches surélevées"
    ],
    "npk_needs": {
      "N": 40,
      "P": 30,
      "K": 50
    },
    "water_needs_mm": 300,
    "common_pests": [
      "Chrysomèles du romarin"
    ],
    "common_diseases": [
      "Pourriture racinaire en sol lourd"
    ],
    "recommended_varieties": [
      "Romarin pyramidal BF"
    ],
    "yield_potential_t_ha": 6,
    "notes": "Sous-arbrisseau mellifère stimulant la mémoire et parfumant les grillades.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-thym-afrique-ouest",
    "crop_key": "thym_tropical",
    "name_fr": "Thym d'Afrique de l'Ouest (Thymus vulgaris tropicalisé)",
    "scientific_name": "Thymus vulgaris tropicalisé",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Nord (Ouahigouya)"
    ],
    "cycle_days_min": 75,
    "cycle_days_max": 365,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 30,
      "P": 25,
      "K": 40
    },
    "water_needs_mm": 250,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Fonte"
    ],
    "recommended_varieties": [
      "Thym d'hiver"
    ],
    "yield_potential_t_ha": 4,
    "notes": "Herbe aromatique fine riche en thymol antiseptique respiratoire.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-coriandre-graines-feuilles",
    "crop_key": "coriandre",
    "name_fr": "Coriandre graines et feuilles (Coriandrum sativum)",
    "scientific_name": "Coriandrum sativum",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Nord",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 40,
    "cycle_days_max": 70,
    "climate_zones": [
      "Contre-saison froide"
    ],
    "seasons": [
      "Novembre à Février"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 40
    },
    "water_needs_mm": 280,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Coriandre à petites graines BF"
    ],
    "yield_potential_t_ha": 12,
    "notes": "Feuillage frais et graines rondes moulues indispensables aux currys et marinades.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-cumin-sahelien-graine",
    "crop_key": "cumin_sahel",
    "name_fr": "Cumin sahélien de contre-saison (Cuminum cyminum)",
    "scientific_name": "Cuminum cyminum",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": false,
    "country_origin": "Sahel / Afrique de l'Ouest",
    "regions_burkina": [
      "Nord",
      "Sahel"
    ],
    "cycle_days_min": 80,
    "cycle_days_max": 105,
    "climate_zones": [
      "Sahel froid"
    ],
    "seasons": [
      "Décembre à Mars"
    ],
    "npk_needs": {
      "N": 40,
      "P": 25,
      "K": 30
    },
    "water_needs_mm": 220,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Fusariose"
    ],
    "recommended_varieties": [
      "Cumin blanc du désert"
    ],
    "yield_potential_t_ha": 1.2,
    "notes": "Graines allongées très odorantes facilitant la digestion des viandes grasses.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-fenugrec-medicinal",
    "crop_key": "fenugrec",
    "name_fr": "Fenugrec médicinal graines (Trigonella foenum-graecum)",
    "scientific_name": "Trigonella foenum-graecum",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Centre-Nord"
    ],
    "cycle_days_min": 75,
    "cycle_days_max": 100,
    "climate_zones": [
      "Contre-saison fraîche"
    ],
    "seasons": [
      "Novembre à Février"
    ],
    "npk_needs": {
      "N": 15,
      "P": 35,
      "K": 25
    },
    "water_needs_mm": 260,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Fenugrec blond"
    ],
    "yield_potential_t_ha": 1.8,
    "notes": "Graines mucilagineuses réputées pour stimuler l'appétit et la lactation maternelle.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-aneth-maraicher-odorant",
    "crop_key": "aneth_odorant",
    "name_fr": "Aneth maraîcher odorant (Anethum graveolens)",
    "scientific_name": "Anethum graveolens",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 50,
    "cycle_days_max": 75,
    "climate_zones": [
      "Contre-saison"
    ],
    "seasons": [
      "Novembre à Février"
    ],
    "npk_needs": {
      "N": 50,
      "P": 30,
      "K": 40
    },
    "water_needs_mm": 300,
    "common_pests": [
      "Chenilles du machaon"
    ],
    "common_diseases": [
      "Oïdium"
    ],
    "recommended_varieties": [
      "Mammoth tropicalisé"
    ],
    "yield_potential_t_ha": 10,
    "notes": "Ombelles jaunes et fines feuilles anisées pour poissons d'eau douce et sauces fraîches.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-moringa-graines-purifiantes",
    "crop_key": "moringa_graines",
    "name_fr": "Graines oléagineuses de Moringa (Moringa oleifera semen)",
    "scientific_name": "Moringa oleifera semen",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions"
    ],
    "cycle_days_min": 150,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Récolte annuelle"
    ],
    "npk_needs": {
      "N": 30,
      "P": 30,
      "K": 30
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Charançons"
    ],
    "common_diseases": [
      "Pourriture"
    ],
    "recommended_varieties": [
      "Moringa local CNSF"
    ],
    "yield_potential_t_ha": 3,
    "notes": "Poudre de graines coagulant naturellement les particules boueuses pour purifier l'eau potable rurale.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-neem-margousier-bio",
    "crop_key": "neem_insecticide",
    "name_fr": "Neem / Margousier biopesticide (Azadirachta indica)",
    "scientific_name": "Azadirachta indica",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions",
      "Sahel",
      "Centre",
      "Nord"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 0,
      "P": 0,
      "K": 0
    },
    "water_needs_mm": 200,
    "common_pests": [
      "Cochenilles"
    ],
    "common_diseases": [
      "Galles"
    ],
    "recommended_varieties": [
      "Neem local sahélien"
    ],
    "yield_potential_t_ha": 4,
    "notes": "Graines et feuilles riches en azadirachtine servant d'insecticide bio naturel universel.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-eucalyptus-feuilles-huile",
    "crop_key": "eucalyptus_huile",
    "name_fr": "Eucalyptus camaldulensis feuilles (Eucalyptus camaldulensis)",
    "scientific_name": "Eucalyptus camaldulensis",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Plateau-Central",
      "Centre",
      "Nord"
    ],
    "cycle_days_min": 180,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 10,
      "P": 10,
      "K": 10
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Termites"
    ],
    "common_diseases": [
      "Pourriture"
    ],
    "recommended_varieties": [
      "Eucalyptus CNSF"
    ],
    "yield_potential_t_ha": 6,
    "notes": "Huile essentielle d'eucalyptol par distillation des feuilles pour baumes respiratoires.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-sene-medicinal-cassia",
    "crop_key": "sene_medicinal",
    "name_fr": "Séné médicinal de savane (Senna alexandrina / Cassia senna)",
    "scientific_name": "Senna alexandrina / Cassia senna",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel (Dori, Gorom)",
      "Nord"
    ],
    "cycle_days_min": 70,
    "cycle_days_max": 110,
    "climate_zones": [
      "Sahel aride"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 10,
      "P": 15,
      "K": 15
    },
    "water_needs_mm": 200,
    "common_pests": [
      "Chenilles"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Séné sauvage du Sahel"
    ],
    "yield_potential_t_ha": 1.5,
    "notes": "Folioles et gousses purgatives souveraines exportées vers les laboratoires pharmaceutiques.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-aloe-vera-sahelien",
    "crop_key": "aloe_vera",
    "name_fr": "Aloé vera sahélien à gel (Aloe barbadensis miller)",
    "scientific_name": "Aloe barbadensis miller",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions",
      "Centre",
      "Nord"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 20,
      "P": 20,
      "K": 40
    },
    "water_needs_mm": 200,
    "common_pests": [
      "Cochenilles"
    ],
    "common_diseases": [
      "Pourriture molle par excès d'eau"
    ],
    "recommended_varieties": [
      "Barbadensis local"
    ],
    "yield_potential_t_ha": 35,
    "notes": "Feuilles charnues regorgeant de gel cicatrisant, hydratant et apaisant cutané.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-henne-feuilles-teinture",
    "crop_key": "henne_feuilles",
    "name_fr": "Henné naturel / Lawsonia (Lawsonia inermis)",
    "scientific_name": "Lawsonia inermis",
    "category": "Aromatiques & Médicinales",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Nord",
      "Sahel",
      "Centre-Nord"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 20,
      "P": 15,
      "K": 20
    },
    "water_needs_mm": 250,
    "common_pests": [
      "Sautériaux"
    ],
    "common_diseases": [
      "Cercosporiose"
    ],
    "recommended_varieties": [
      "Henné de Dori"
    ],
    "yield_potential_t_ha": 3,
    "notes": "Feuilles séchées et pulvérisées fournissant la coloration rouge-cuivrée traditionnelle.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-brachiaria-ruziziensis",
    "crop_key": "brachiaria_fauche",
    "name_fr": "Brachiaria ruziziensis de fauche (Brachiaria ruziziensis)",
    "scientific_name": "Brachiaria ruziziensis",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Boucle du Mouhoun"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage et irrigué"
    ],
    "npk_needs": {
      "N": 60,
      "P": 30,
      "K": 30
    },
    "water_needs_mm": 550,
    "common_pests": [
      "Chenilles sp."
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Ruziziensis Farako-Bâ"
    ],
    "yield_potential_t_ha": 18,
    "notes": "Graminée fourragère appétente formant un tapis dense contre l'érosion pluviale.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-panicum-maximum-c1",
    "crop_key": "panicum_maximum",
    "name_fr": "Panicum maximum géant C1 (Panicum maximum C1)",
    "scientific_name": "Panicum maximum C1",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades",
      "Hauts-Bassins",
      "Sud-Ouest"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 80,
      "P": 40,
      "K": 40
    },
    "water_needs_mm": 700,
    "common_pests": [
      "Foreurs"
    ],
    "common_diseases": [
      "Helminthosporiose"
    ],
    "recommended_varieties": [
      "C1 Farako-Bâ",
      "Mombaça"
    ],
    "yield_potential_t_ha": 25,
    "notes": "Production phénoménale de matière sèche pour l'affouragement en vert des bovins laitiers.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-pennisetum-purpureum-elephant",
    "crop_key": "herbe_elephant",
    "name_fr": "Herbe à éléphant / Napier grass (Pennisetum purpureum)",
    "scientific_name": "Pennisetum purpureum",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Cascades (Banfora)",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 365,
    "climate_zones": [
      "Bas-fonds humides"
    ],
    "seasons": [
      "Toute l'année sous eau"
    ],
    "npk_needs": {
      "N": 90,
      "P": 40,
      "K": 50
    },
    "water_needs_mm": 900,
    "common_pests": [
      "Foreurs"
    ],
    "common_diseases": [
      "Charbon"
    ],
    "recommended_varieties": [
      "Napier local"
    ],
    "yield_potential_t_ha": 45,
    "notes": "Touffes géantes coupées toutes les 6 semaines fournissant une biomasse inégalée.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-andropogon-gayanus-gambagrass",
    "crop_key": "andropogon_gayanus",
    "name_fr": "Andropogon gayanus / Herbe du Gambie (Andropogon gayanus)",
    "scientific_name": "Andropogon gayanus",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions pastorales",
      "Centre",
      "Nord"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 30,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 350,
    "common_pests": [
      "Sautériaux"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Gayanus sélectionné"
    ],
    "yield_potential_t_ha": 12,
    "notes": "Graminée rustique autochtone résistant admirablement aux feux de brousse et au pâturage.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-cenchrus-ciliaris-bison",
    "crop_key": "cenchrus_ciliaris",
    "name_fr": "Cenchrus ciliaris / Herbe à bison (Cenchrus ciliaris)",
    "scientific_name": "Cenchrus ciliaris",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel (Oudalan, Séno)",
      "Nord"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 120,
    "climate_zones": [
      "Sahel aride"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 20,
      "P": 15,
      "K": 15
    },
    "water_needs_mm": 200,
    "common_pests": [
      "Criquets"
    ],
    "common_diseases": [
      "Charbon"
    ],
    "recommended_varieties": [
      "Cenchrus du Sahel"
    ],
    "yield_potential_t_ha": 6,
    "notes": "La graminée préférée des zébus et moutons peuls dans les zones semi-arides.",
    "iconName": "wheat"
  },
  {
    "id": "sheet-stylosanthes-guianensis",
    "crop_key": "stylosanthes_fourrage",
    "name_fr": "Stylosanthès guianensis fourrager (Stylosanthes guianensis)",
    "scientific_name": "Stylosanthes guianensis",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Hauts-Bassins",
      "Cascades",
      "Centre-Sud"
    ],
    "cycle_days_min": 75,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 0,
      "P": 35,
      "K": 20
    },
    "water_needs_mm": 500,
    "common_pests": [
      "Criquets"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "CIAT 184",
      "Cook"
    ],
    "yield_potential_t_ha": 10,
    "notes": "Légumineuse pérenne enrichissant les pâturages en protéines brutes digestibles.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-aeschynomene-histrix",
    "crop_key": "aeschynomene",
    "name_fr": "Aeschynomène fourrage de bas-fond (Aeschynomene histrix)",
    "scientific_name": "Aeschynomene histrix",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sud-Ouest",
      "Cascades"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 150,
    "climate_zones": [
      "Bas-fonds soudaniens"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 0,
      "P": 30,
      "K": 20
    },
    "water_needs_mm": 600,
    "common_pests": [
      "Altises"
    ],
    "common_diseases": [
      "Taches foliaires"
    ],
    "recommended_varieties": [
      "Histrix locale"
    ],
    "yield_potential_t_ha": 8,
    "notes": "Légumineuse rampante s'associant parfaitement aux graminées aquatiques.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-leucaena-leucocephala-haie",
    "crop_key": "leucaena_fourrage",
    "name_fr": "Leucaena leucocephala arbre fourrager (Leucaena leucocephala)",
    "scientific_name": "Leucaena leucocephala",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Centre",
      "Hauts-Bassins",
      "Cascades"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudano-sahélien",
      "Soudanien"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 0,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 450,
    "common_pests": [
      "Psylle du Leucaena"
    ],
    "common_diseases": [
      "Galles"
    ],
    "recommended_varieties": [
      "K636",
      "Cunningham"
    ],
    "yield_potential_t_ha": 14,
    "notes": "Arbre fourrager de banque de protéines taillé en haie pour l'embouche ovine.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-gliricidia-sepium-tuteur",
    "crop_key": "gliricidia_sepium",
    "name_fr": "Gliricidia sepium / Tuteur vivant (Gliricidia sepium)",
    "scientific_name": "Gliricidia sepium",
    "category": "Plantes Fourragères",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Hauts-Bassins",
      "Sud-Ouest"
    ],
    "cycle_days_min": 90,
    "cycle_days_max": 365,
    "climate_zones": [
      "Soudanien",
      "Guinéen"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 0,
      "P": 20,
      "K": 20
    },
    "water_needs_mm": 550,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Anthracnose"
    ],
    "recommended_varieties": [
      "Gliricidia local"
    ],
    "yield_potential_t_ha": 12,
    "notes": "Boutures vives délimitant les parcelles et apportant un feuillage riche en azote.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-faidherbia-albida-gao",
    "crop_key": "faidherbia_gao",
    "name_fr": "Faidherbia albida / Gao miraculeux (Faidherbia albida)",
    "scientific_name": "Faidherbia albida",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions sahéliennes",
      "Plateau-Central",
      "Nord",
      "Centre"
    ],
    "cycle_days_min": 180,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 0,
      "P": 0,
      "K": 0
    },
    "water_needs_mm": 250,
    "common_pests": [
      "Chenilles défoliatrices"
    ],
    "common_diseases": [
      "Loranthus"
    ],
    "recommended_varieties": [
      "Gao sélectionné"
    ],
    "yield_potential_t_ha": 3.5,
    "notes": "Phénologie inversée légendaire : perd ses feuilles en hivernage et nourrit le bétail en saison sèche.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-acacia-senegal-gommier",
    "crop_key": "acacia_senegal",
    "name_fr": "Gommier blanc / Gomme arabique (Senegalia senegal / Acacia senegal)",
    "scientific_name": "Senegalia senegal / Acacia senegal",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel (Dori, Gorom, Djibo)",
      "Nord"
    ],
    "cycle_days_min": 180,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel aride"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 0,
      "P": 0,
      "K": 0
    },
    "water_needs_mm": 180,
    "common_pests": [
      "Criquets pèlerins",
      "Capricornes"
    ],
    "common_diseases": [
      "Pourriture"
    ],
    "recommended_varieties": [
      "Gommier blanc INERA"
    ],
    "yield_potential_t_ha": 1.2,
    "notes": "Production de gomme arabique de premier choix exportée et gousses très riches pour les chèvres.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-acacia-seyal-gomme-rouge",
    "crop_key": "acacia_seyal",
    "name_fr": "Gommier rouge / Acacia seyal (Vachellia seyal / Acacia seyal)",
    "scientific_name": "Vachellia seyal / Acacia seyal",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel",
      "Centre-Nord",
      "Plateau-Central"
    ],
    "cycle_days_min": 150,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 0,
      "P": 0,
      "K": 0
    },
    "water_needs_mm": 220,
    "common_pests": [
      "Buprestes"
    ],
    "common_diseases": [
      "Galles"
    ],
    "recommended_varieties": [
      "Seyal local"
    ],
    "yield_potential_t_ha": 1.5,
    "notes": "Écorce rouge vif, feuillage et fleurs jaunes adorés par les troupeaux sahéliens.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-piliostigma-reticulatum",
    "crop_key": "piliostigma",
    "name_fr": "Piliostigma reticulatum / Semellier (Piliostigma reticulatum)",
    "scientific_name": "Piliostigma reticulatum",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Toutes régions sahéliennes",
      "Plateau-Central",
      "Nord"
    ],
    "cycle_days_min": 120,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel",
      "Soudano-sahélien"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 0,
      "P": 0,
      "K": 0
    },
    "water_needs_mm": 250,
    "common_pests": [
      "Sautériaux"
    ],
    "common_diseases": [
      "Mildiou"
    ],
    "recommended_varieties": [
      "Piliostigma sauvage"
    ],
    "yield_potential_t_ha": 4,
    "notes": "Gousses coriaces riches en sucres broyées pour nourrir les ruminants en pleine soudure.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-balanites-dattier-desert",
    "crop_key": "balanites_aegyptiaca",
    "name_fr": "Dattier du désert / Balanites (Balanites aegyptiaca)",
    "scientific_name": "Balanites aegyptiaca",
    "category": "Plantes Fourragères",
    "is_burkina_priority": true,
    "country_origin": "Burkina Faso (Prioritaire)",
    "regions_burkina": [
      "Sahel",
      "Nord",
      "Centre-Nord"
    ],
    "cycle_days_min": 150,
    "cycle_days_max": 365,
    "climate_zones": [
      "Sahel aride"
    ],
    "seasons": [
      "Pluriannuel"
    ],
    "npk_needs": {
      "N": 0,
      "P": 0,
      "K": 0
    },
    "water_needs_mm": 150,
    "common_pests": [
      "Chenilles de Balanites"
    ],
    "common_diseases": [
      "Galles"
    ],
    "recommended_varieties": [
      "Balanites du Séno"
    ],
    "yield_potential_t_ha": 2.5,
    "notes": "L'arbre providentiel du berger sahélien : fruits sucrés, amandes oléagineuses et feuillage vert permanent.",
    "iconName": "sprout"
  },
  {
    "id": "sheet-chloris-gayana-rhodes",
    "crop_key": "chloris_gayana",
    "name_fr": "Herbe de Rhodes / Chloris gayana (Chloris gayana)",
    "scientific_name": "Chloris gayana",
    "category": "Plantes Fourragères",
    "is_burkina_priority": false,
    "country_origin": "Afrique de l'Ouest / CEDEAO",
    "regions_burkina": [
      "Boucle du Mouhoun",
      "Hauts-Bassins"
    ],
    "cycle_days_min": 60,
    "cycle_days_max": 180,
    "climate_zones": [
      "Soudano-sahélien"
    ],
    "seasons": [
      "Hivernage"
    ],
    "npk_needs": {
      "N": 40,
      "P": 25,
      "K": 25
    },
    "water_needs_mm": 400,
    "common_pests": [
      "Pucerons"
    ],
    "common_diseases": [
      "Rouille"
    ],
    "recommended_varieties": [
      "Katambora"
    ],
    "yield_potential_t_ha": 14,
    "notes": "Stolonifère robuste colonisant rapidement les sols sablo-argileux dégradés.",
    "iconName": "wheat"
  }
];

// Rétrocompatibilité totale avec les modules existants
export const WEST_AFRICA_12_CROPS = BURKINA_ALL_CROPS_TECHNICAL_SHEETS;
