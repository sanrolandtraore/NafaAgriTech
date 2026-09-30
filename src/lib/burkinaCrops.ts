// Cultures et spéculations agricoles produites au Burkina Faso (Référence exhaustive INERA / DGEP / Ministère de l'Agriculture)
export interface CropOption {
  key: string;
  label: string;
  group: string;
  scientificName?: string;
  typicalCycleDays?: number;
  mainRegions?: string[];
}

export const BURKINA_CROPS: CropOption[] = [
  // ── 1. Céréales ──
  { key: "mais", label: "Maïs (blanc / jaune)", group: "Céréales", scientificName: "Zea mays", typicalCycleDays: 95, mainRegions: ["Hauts-Bassins", "Cascades", "Boucle du Mouhoun", "Centre-Ouest"] },
  { key: "sorgho_blanc", label: "Sorgho blanc", group: "Céréales", scientificName: "Sorghum bicolor", typicalCycleDays: 110, mainRegions: ["Centre", "Plateau-Central", "Centre-Sud", "Nord"] },
  { key: "sorgho_rouge", label: "Sorgho rouge (dolo)", group: "Céréales", scientificName: "Sorghum bicolor var. rouge", typicalCycleDays: 120, mainRegions: ["Hauts-Bassins", "Centre-Ouest", "Sud-Ouest"] },
  { key: "mil", label: "Mil pénicillaire (Petit mil)", group: "Céréales", scientificName: "Pennisetum glaucum", typicalCycleDays: 85, mainRegions: ["Sahel", "Nord", "Centre-Nord", "Est"] },
  { key: "riz_pluvial", label: "Riz pluvial (plateau)", group: "Céréales", scientificName: "Oryza sativa / NERICA", typicalCycleDays: 95, mainRegions: ["Hauts-Bassins", "Cascades", "Sud-Ouest"] },
  { key: "riz_irrigue", label: "Riz irrigué (plaines aménagées)", group: "Céréales", scientificName: "Oryza sativa", typicalCycleDays: 120, mainRegions: ["Boucle du Mouhoun (Sourou)", "Centre-Est (Bagré)", "Cascades (Banzon)"] },
  { key: "riz_bas_fond", label: "Riz de bas-fond", group: "Céréales", scientificName: "Oryza sativa / FKR", typicalCycleDays: 115, mainRegions: ["Hauts-Bassins", "Centre-Sud", "Centre-Est"] },
  { key: "fonio", label: "Fonio", group: "Céréales", scientificName: "Digitaria exilis", typicalCycleDays: 75, mainRegions: ["Cascades", "Sud-Ouest", "Hauts-Bassins"] },
  { key: "ble", label: "Blé irrigué", group: "Céréales", scientificName: "Triticum aestivum", typicalCycleDays: 100, mainRegions: ["Boucle du Mouhoun (Sourou)", "Centre-Est (Bagré)"] },

  // ── 2. Légumineuses & Protéagineux ──
  { key: "niebe", label: "Niébé (haricot blanc / rouge)", group: "Légumineuses", scientificName: "Vigna unguiculata", typicalCycleDays: 70, mainRegions: ["Toutes régions", "Nord", "Centre", "Plateau-Central"] },
  { key: "arachide", label: "Arachide", group: "Légumineuses", scientificName: "Arachis hypogaea", typicalCycleDays: 100, mainRegions: ["Centre-Est", "Centre-Ouest", "Hauts-Bassins", "Est"] },
  { key: "voandzou", label: "Voandzou (pois de terre)", group: "Légumineuses", scientificName: "Vigna subterranea", typicalCycleDays: 110, mainRegions: ["Plateau-Central", "Centre-Nord", "Nord", "Centre-Sud"] },
  { key: "soja", label: "Soja", group: "Légumineuses", scientificName: "Glycine max", typicalCycleDays: 105, mainRegions: ["Hauts-Bassins", "Cascades", "Boucle du Mouhoun", "Sud-Ouest"] },
  { key: "pois_angole", label: "Pois d'Angole (pois cajan)", group: "Légumineuses", scientificName: "Cajanus cajan", typicalCycleDays: 150, mainRegions: ["Hauts-Bassins", "Sud-Ouest"] },
  { key: "pois_sucre", label: "Pois sucré", group: "Légumineuses", scientificName: "Pisum sativum", typicalCycleDays: 65, mainRegions: ["Hauts-Bassins", "Nord"] },
  { key: "dolique", label: "Dolique (lablab)", group: "Légumineuses", scientificName: "Lablab purpureus", typicalCycleDays: 85, mainRegions: ["Boucle du Mouhoun", "Hauts-Bassins"] },

  // ── 3. Tubercules, Racines & Bulbes ──
  { key: "igname", label: "Igname", group: "Tubercules & racines", scientificName: "Dioscorea spp.", typicalCycleDays: 210, mainRegions: ["Passoré", "Sud-Ouest", "Centre-Sud (Pô)", "Liptako"] },
  { key: "manioc", label: "Manioc", group: "Tubercules & racines", scientificName: "Manihot esculenta", typicalCycleDays: 300, mainRegions: ["Hauts-Bassins", "Cascades", "Sud-Ouest", "Centre-Ouest"] },
  { key: "patate_douce", label: "Patate douce (chair blanche)", group: "Tubercules & racines", scientificName: "Ipomoea batatas", typicalCycleDays: 100, mainRegions: ["Hauts-Bassins", "Boucle du Mouhoun", "Centre-Ouest"] },
  { key: "patate_orange", label: "Patate douce à chair orange (enrichie vit. A)", group: "Tubercules & racines", scientificName: "Ipomoea batatas var. orange", typicalCycleDays: 95, mainRegions: ["Hauts-Bassins", "Cascades", "Centre"] },
  { key: "pomme_de_terre", label: "Pomme de terre", group: "Tubercules & racines", scientificName: "Solanum tuberosum", typicalCycleDays: 90, mainRegions: ["Nord (Titao, Ouahigouya)", "Hauts-Bassins"] },
  { key: "taro", label: "Taro (macabo)", group: "Tubercules & racines", scientificName: "Colocasia esculenta", typicalCycleDays: 240, mainRegions: ["Cascades", "Sud-Ouest", "Hauts-Bassins"] },
  { key: "souchet", label: "Souchet doux (chufa)", group: "Tubercules & racines", scientificName: "Cyperus esculentus", typicalCycleDays: 105, mainRegions: ["Cascades", "Hauts-Bassins", "Sud-Ouest"] },
  { key: "gingembre", label: "Gingembre", group: "Tubercules & racines", scientificName: "Zingiber officinale", typicalCycleDays: 240, mainRegions: ["Cascades", "Hauts-Bassins", "Sud-Ouest"] },
  { key: "curcuma", label: "Curcuma", group: "Tubercules & racines", scientificName: "Curcuma longa", typicalCycleDays: 240, mainRegions: ["Cascades", "Sud-Ouest"] },

  // ── 4. Cultures de rente, industrielles & fibres ──
  { key: "coton", label: "Coton conventionnel", group: "Cultures de rente", scientificName: "Gossypium hirsutum", typicalCycleDays: 145, mainRegions: ["Boucle du Mouhoun", "Hauts-Bassins", "Cascades", "Sud-Ouest", "Est"] },
  { key: "coton_bio", label: "Coton biologique équitable", group: "Cultures de rente", scientificName: "Gossypium hirsutum bio", typicalCycleDays: 140, mainRegions: ["Centre-Ouest", "Boucle du Mouhoun", "Est"] },
  { key: "sesame", label: "Sésame (blanc / bigarré)", group: "Cultures de rente", scientificName: "Sesamum indicum", typicalCycleDays: 90, mainRegions: ["Boucle du Mouhoun", "Est", "Hauts-Bassins", "Centre-Ouest"] },
  { key: "anacarde", label: "Anacardier (noix de cajou)", group: "Cultures de rente", scientificName: "Anacardium occidentale", typicalCycleDays: 365, mainRegions: ["Cascades", "Sud-Ouest", "Hauts-Bassins"] },
  { key: "karite", label: "Karité (parcs arborés)", group: "Cultures de rente", scientificName: "Vitellaria paradoxa", typicalCycleDays: 365, mainRegions: ["Toutes régions hors Sahel"] },
  { key: "canne_a_sucre", label: "Canne à sucre", group: "Cultures de rente", scientificName: "Saccharum officinarum", typicalCycleDays: 360, mainRegions: ["Cascades (Bérégadougou, Bansié)"] },
  { key: "tournesol", label: "Tournesol", group: "Cultures de rente", scientificName: "Helianthus annuus", typicalCycleDays: 95, mainRegions: ["Hauts-Bassins", "Boucle du Mouhoun"] },
  { key: "hibiscus", label: "Oseille de Guinée (Bissap calices)", group: "Cultures de rente", scientificName: "Hibiscus sabdariffa", typicalCycleDays: 130, mainRegions: ["Centre", "Centre-Nord", "Plateau-Central", "Nord"] },
  { key: "tabac", label: "Tabac", group: "Cultures de rente", scientificName: "Nicotiana tabacum", typicalCycleDays: 110, mainRegions: ["Boucle du Mouhoun", "Hauts-Bassins"] },
  { key: "jatropha", label: "Jatropha (pourghère)", group: "Cultures de rente", scientificName: "Jatropha curcas", typicalCycleDays: 365, mainRegions: ["Centre-Ouest", "Plateau-Central"] },
  { key: "ricin", label: "Ricin", group: "Cultures de rente", scientificName: "Ricinus communis", typicalCycleDays: 120, mainRegions: ["Hauts-Bassins", "Centre-Nord"] },

  // ── 5. Maraîchage & Légumes de plein champ ──
  { key: "tomate", label: "Tomate maraîchère", group: "Maraîchage", scientificName: "Solanum lycopersicum", typicalCycleDays: 90, mainRegions: ["Hauts-Bassins", "Centre (Koubri, Loumbila)", "Nord", "Cascades"] },
  { key: "oignon", label: "Oignon bulbe (Violet de Galmi)", group: "Maraîchage", scientificName: "Allium cepa", typicalCycleDays: 110, mainRegions: ["Nord (Ouahigouya)", "Boucle du Mouhoun", "Centre", "Centre-Nord"] },
  { key: "chou", label: "Chou pommé", group: "Maraîchage", scientificName: "Brassica oleracea var. capitata", typicalCycleDays: 85, mainRegions: ["Centre", "Hauts-Bassins", "Nord", "Boucle du Mouhoun"] },
  { key: "aubergine", label: "Aubergine violette", group: "Maraîchage", scientificName: "Solanum melongena", typicalCycleDays: 100, mainRegions: ["Hauts-Bassins", "Centre", "Cascades"] },
  { key: "aubergine_africaine", label: "Aubergine africaine (djatou / gombo local)", group: "Maraîchage", scientificName: "Solanum aethiopicum", typicalCycleDays: 90, mainRegions: ["Toutes régions"] },
  { key: "gombo", label: "Gombo", group: "Maraîchage", scientificName: "Abelmoschus esculentus", typicalCycleDays: 65, mainRegions: ["Toutes régions", "Cascades", "Hauts-Bassins"] },
  { key: "piment", label: "Piment fort", group: "Maraîchage", scientificName: "Capsicum frutescens", typicalCycleDays: 100, mainRegions: ["Hauts-Bassins", "Cascades", "Centre", "Sud-Ouest"] },
  { key: "piment_oiseau", label: "Piment bec d'oiseau", group: "Maraîchage", scientificName: "Capsicum frutescens var.", typicalCycleDays: 105, mainRegions: ["Sud-Ouest", "Cascades"] },
  { key: "poivron", label: "Poivron doux", group: "Maraîchage", scientificName: "Capsicum annuum", typicalCycleDays: 95, mainRegions: ["Centre", "Hauts-Bassins", "Nord"] },
  { key: "carotte", label: "Carotte", group: "Maraîchage", scientificName: "Daucus carota", typicalCycleDays: 85, mainRegions: ["Nord (Ouahigouya)", "Centre", "Hauts-Bassins"] },
  { key: "laitue", label: "Laitue (salade)", group: "Maraîchage", scientificName: "Lactuca sativa", typicalCycleDays: 45, mainRegions: ["Ceintures vertes urbaines", "Koubri", "Bobo"] },
  { key: "concombre", label: "Concombre", group: "Maraîchage", scientificName: "Cucumis sativus", typicalCycleDays: 60, mainRegions: ["Hauts-Bassins", "Centre", "Cascades"] },
  { key: "courgette", label: "Courgette", group: "Maraîchage", scientificName: "Cucurbita pepo", typicalCycleDays: 55, mainRegions: ["Hauts-Bassins", "Centre"] },
  { key: "courge", label: "Courge / citrouille", group: "Maraîchage", scientificName: "Cucurbita moschata", typicalCycleDays: 110, mainRegions: ["Toutes régions"] },
  { key: "haricot_vert", label: "Haricot vert (filet d'exportation)", group: "Maraîchage", scientificName: "Phaseolus vulgaris", typicalCycleDays: 60, mainRegions: ["Centre (Koubri)", "Boucle du Mouhoun", "Nord"] },
  { key: "betterave", label: "Betterave potagère", group: "Maraîchage", scientificName: "Beta vulgaris", typicalCycleDays: 75, mainRegions: ["Nord", "Hauts-Bassins"] },
  { key: "navet", label: "Navet", group: "Maraîchage", scientificName: "Brassica rapa", typicalCycleDays: 60, mainRegions: ["Nord", "Centre"] },
  { key: "ail", label: "Ail", group: "Maraîchage", scientificName: "Allium sativum", typicalCycleDays: 120, mainRegions: ["Nord", "Hauts-Bassins", "Centre-Nord"] },
  { key: "echalote", label: "Échalote", group: "Maraîchage", scientificName: "Allium ascalonicum", typicalCycleDays: 80, mainRegions: ["Boucle du Mouhoun", "Centre-Nord"] },
  { key: "poireau", label: "Poireau", group: "Maraîchage", scientificName: "Allium ampeloprasum", typicalCycleDays: 110, mainRegions: ["Nord", "Hauts-Bassins"] },
  { key: "radis", label: "Radis", group: "Maraîchage", scientificName: "Raphanus sativus", typicalCycleDays: 30, mainRegions: ["Centre", "Hauts-Bassins"] },
  { key: "amarante", label: "Amarante (boroboro)", group: "Maraîchage", scientificName: "Amaranthus cruentus", typicalCycleDays: 35, mainRegions: ["Toutes régions"] },
  { key: "oseille_feuille", label: "Oseille feuille (dah)", group: "Maraîchage", scientificName: "Hibiscus sabdariffa var. viridis", typicalCycleDays: 45, mainRegions: ["Toutes régions"] },
  { key: "corete_potagere", label: "Corète potagère (kplala / adémè)", group: "Maraîchage", scientificName: "Corchorus olitorius", typicalCycleDays: 40, mainRegions: ["Hauts-Bassins", "Cascades", "Centre"] },
  { key: "epinard", label: "Épinard", group: "Maraîchage", scientificName: "Spinacia oleracea", typicalCycleDays: 50, mainRegions: ["Centre", "Hauts-Bassins"] },
  { key: "celeri", label: "Céleri", group: "Maraîchage", scientificName: "Apium graveolens", typicalCycleDays: 90, mainRegions: ["Centre", "Hauts-Bassins"] },
  { key: "persil", label: "Persil", group: "Maraîchage", scientificName: "Petroselinum crispum", typicalCycleDays: 70, mainRegions: ["Centre", "Hauts-Bassins"] },
  { key: "menthe", label: "Menthe", group: "Maraîchage", scientificName: "Mentha spicata", typicalCycleDays: 60, mainRegions: ["Ceintures maraîchères"] },
  { key: "pasteque", label: "Pastèque maraîchère", group: "Maraîchage", scientificName: "Citrullus lanatus", typicalCycleDays: 85, mainRegions: ["Boucle du Mouhoun", "Centre", "Nord", "Hauts-Bassins"] },
  { key: "melon", label: "Melon", group: "Maraîchage", scientificName: "Cucumis melo", typicalCycleDays: 80, mainRegions: ["Boucle du Mouhoun", "Centre"] },

  // ── 6. Fruits & Arboriculture fruitière ──
  { key: "mangue", label: "Manguier (Amélie, Kent, Brooks, Keitt)", group: "Fruits", scientificName: "Mangifera indica", typicalCycleDays: 365, mainRegions: ["Hauts-Bassins (Orodara)", "Cascades (Banfora)", "Sud-Ouest"] },
  { key: "banane", label: "Bananier (banane douce / plantain)", group: "Fruits", scientificName: "Musa paradisiaca", typicalCycleDays: 300, mainRegions: ["Cascades", "Hauts-Bassins", "Sud-Ouest"] },
  { key: "papaye", label: "Papayer (Solo, Red Lady)", group: "Fruits", scientificName: "Carica papaya", typicalCycleDays: 270, mainRegions: ["Hauts-Bassins", "Cascades", "Centre"] },
  { key: "agrumes", label: "Agrumes (oranger, citronnier, mandarinier)", group: "Fruits", scientificName: "Citrus spp.", typicalCycleDays: 365, mainRegions: ["Hauts-Bassins", "Cascades"] },
  { key: "citronnier", label: "Citronnier (lime / citron vert)", group: "Fruits", scientificName: "Citrus aurantiifolia", typicalCycleDays: 365, mainRegions: ["Hauts-Bassins", "Cascades", "Centre-Sud"] },
  { key: "oranger", label: "Oranger doux", group: "Fruits", scientificName: "Citrus sinensis", typicalCycleDays: 365, mainRegions: ["Hauts-Bassins", "Cascades"] },
  { key: "goyave", label: "Goyavier", group: "Fruits", scientificName: "Psidium guajava", typicalCycleDays: 365, mainRegions: ["Hauts-Bassins", "Cascades", "Centre"] },
  { key: "ananas", label: "Ananas", group: "Fruits", scientificName: "Ananas comosus", typicalCycleDays: 450, mainRegions: ["Cascades (Comoé)", "Sud-Ouest"] },
  { key: "avocat", label: "Avocatier", group: "Fruits", scientificName: "Persea americana", typicalCycleDays: 365, mainRegions: ["Hauts-Bassins", "Cascades", "Sud-Ouest"] },
  { key: "grenadier", label: "Grenadier", group: "Fruits", scientificName: "Punica granatum", typicalCycleDays: 365, mainRegions: ["Nord", "Plateau-Central", "Hauts-Bassins"] },
  { key: "tamarin", label: "Tamarinier", group: "Fruits", scientificName: "Tamarindus indica", typicalCycleDays: 365, mainRegions: ["Toutes régions"] },
  { key: "baobab", label: "Baobab (pulpe & feuilles)", group: "Fruits", scientificName: "Adansonia digitata", typicalCycleDays: 365, mainRegions: ["Toutes régions sahéliennes & soudaniennes"] },
  { key: "jujube", label: "Jujubier (pomme du Sahel)", group: "Fruits", scientificName: "Ziziphus mauritiana", typicalCycleDays: 365, mainRegions: ["Sahel", "Nord", "Centre-Nord"] },
  { key: "dattier_desert", label: "Dattier du désert (Balanites)", group: "Fruits", scientificName: "Balanites aegyptiaca", typicalCycleDays: 365, mainRegions: ["Sahel", "Nord", "Centre-Nord", "Est"] },
  { key: "neree", label: "Néré (graines à soumbala)", group: "Fruits", scientificName: "Parkia biglobosa", typicalCycleDays: 365, mainRegions: ["Hauts-Bassins", "Cascades", "Sud-Ouest", "Centre-Sud"] },
  { key: "lannea_raisinier", label: "Raisinier sauvage (Lannea)", group: "Fruits", scientificName: "Lannea microcarpa", typicalCycleDays: 365, mainRegions: ["Zone soudano-sahélienne"] },

  // ── 7. Cultures Fourragères & Pastorales ──
  { key: "niebe_fourrager", label: "Niébé fourrager", group: "Fourrages", scientificName: "Vigna unguiculata var. fourrage", typicalCycleDays: 60, mainRegions: ["Toutes régions"] },
  { key: "mucuna", label: "Mucuna (pois mascate)", group: "Fourrages", scientificName: "Mucuna pruriens", typicalCycleDays: 120, mainRegions: ["Hauts-Bassins", "Boucle du Mouhoun", "Cascades"] },
  { key: "brachiaria", label: "Brachiaria (graminée pérenne)", group: "Fourrages", scientificName: "Brachiaria ruziziensis", typicalCycleDays: 180, mainRegions: ["Hauts-Bassins", "Cascades", "Centre-Sud"] },
  { key: "sorgho_fourrager", label: "Sorgho fourrager", group: "Fourrages", scientificName: "Sorghum sudanense", typicalCycleDays: 80, mainRegions: ["Centre", "Boucle du Mouhoun", "Nord"] },
  { key: "panicum", label: "Panicum maximum (herbe de Guinée)", group: "Fourrages", scientificName: "Megathyrsus maximus", typicalCycleDays: 150, mainRegions: ["Hauts-Bassins", "Cascades", "Centre-Sud"] },
  { key: "cenchrus", label: "Cenchrus ciliaris (cram-cram amélioré)", group: "Fourrages", scientificName: "Cenchrus ciliaris", typicalCycleDays: 70, mainRegions: ["Sahel", "Nord"] },
  { key: "herbe_elephant", label: "Herbe à éléphant (Pennisetum)", group: "Fourrages", scientificName: "Pennisetum purpureum", typicalCycleDays: 120, mainRegions: ["Cascades", "Hauts-Bassins"] },
  { key: "stylosanthes", label: "Stylosanthes hamata", group: "Fourrages", scientificName: "Stylosanthes hamata", typicalCycleDays: 90, mainRegions: ["Zone sahélienne et soudanienne"] },

  // ── 8. Plantes Aromatiques, Médicinales & Agroforestières ──
  { key: "moringa", label: "Moringa (arbre de vie)", group: "Aromatiques & Médicinales", scientificName: "Moringa oleifera", typicalCycleDays: 90, mainRegions: ["Toutes régions"] },
  { key: "artemisia", label: "Artemisia annua", group: "Aromatiques & Médicinales", scientificName: "Artemisia annua", typicalCycleDays: 120, mainRegions: ["Hauts-Bassins", "Plateau-Central"] },
  { key: "citronnelle", label: "Citronnelle", group: "Aromatiques & Médicinales", scientificName: "Cymbopogon citratus", typicalCycleDays: 90, mainRegions: ["Hauts-Bassins", "Cascades", "Centre"] },
  { key: "henne", label: "Henné", group: "Aromatiques & Médicinales", scientificName: "Lawsonia inermis", typicalCycleDays: 180, mainRegions: ["Nord", "Sahel", "Centre"] },
];

export const CROP_GROUPS = Array.from(new Set(BURKINA_CROPS.map((c) => c.group)));

export const cropLabel = (key?: string | null): string =>
  BURKINA_CROPS.find((c) => c.key === key)?.label ?? (key || "Non précisée");

export const getCropByKey = (key?: string | null): CropOption | undefined =>
  BURKINA_CROPS.find((c) => c.key === key);

export const getCropsByGroup = (group: string): CropOption[] =>
  BURKINA_CROPS.filter((c) => c.group.toLowerCase() === group.toLowerCase());
