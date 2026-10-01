/**
 * BASE DE DONNÉES BOTANIQUE PROPRIÉTAIRE NAFA-AGRITECH
 * 
 * Référentiel botanique et agronomique souverain pour l'Afrique de l'Ouest et le Sahel.
 * Conçu selon les principes de la science ouverte (Open Science) et des données agronomiques
 * légalement réutilisables issues de sources scientifiques certifiées :
 * 
 * SOURCES SCIENTIFIQUES OUVERTES :
 * - INERA (Institut de l'Environnement et de Recherches Agricoles du Burkina Faso - Farako-Bâ & Kamboinsé)
 * - FAO EcoCrop (Food and Agriculture Organization Open Agronomic Database)
 * - CIRAD (Centre de Coopération Internationale en Recherche Agronomique pour le Développement)
 * - GBIF (Global Biodiversity Information Facility - CC0 / CC-BY Open Taxonomic Backbone)
 * - EPPO Global Database (Organisation Européenne et Méditerranéenne pour la Protection des Plantes)
 * - PlantVillage (Penn State & EPFL - Open Access Crop Leaf Repository)
 * - Kew Plants of the World Online (Royal Botanic Gardens Kew - Open Taxonomic Index)
 * 
 * RÈGLES DE CONCEPTION :
 * 1. 100% Autonome et local : Zéro appel à des APIs tierces propriétaires.
 * 2. Distinction stricte : Culture vivrière / maraîchère / rente vs. Adventice parasitaire (ex: Striga).
 * 3. Enrichissement continu : Alimenté par les observations terrain des agronomes partenaires NAFA.
 */

export type PlantOrganType = "leaf" | "flower" | "fruit" | "stem" | "bark" | "root" | "whole_plant";

export type AgroEcologicalZoneBF =
  | "sahel" // Zone Sahélienne Nord (Dori, Gorom-Gorom, Djibo - pluviométrie < 600 mm)
  | "nord_centre" // Zone Nord & Plateau Central (Ouahigouya, Kaya, Koupéla - 600 à 750 mm)
  | "centre_sud" // Zone Soudano-Sahélienne (Ouagadougou, Koudougou, Manga - 750 à 900 mm)
  | "ouest_sud"; // Zone Soudanienne Sud & Ouest (Bobo-Dioulasso, Banfora, Dédougou - > 900 mm)

export interface BotanicalOrganDescriptor {
  shape: string; // Ex: "Lancéolée", "Ovale cordée", "Trilobée", "Pinnatiséquée"
  margin: string; // Ex: "Entière", "Dentée", "Ondulée", "Ciliée"
  venation: string; // Ex: "Réticulée", "Parallèle", "Pennée", "Palmée"
  arrangement: string; // Ex: "Alternes", "Opposées", "En rosette", "Distiques"
  colorTypical: string; // Ex: "#2e7d32" (vert foncé), "#4caf50", "#558b2f"
  texture: string; // Ex: "Lisse", "Pubescente", "Coriace", "Rugueuse"
}

export interface NafaBotanicalSpecies {
  id: string; // Clé normalisée NAFA (ex: 'tomate', 'mais', 'striga_hermonthica')
  scientificName: string; // Nom scientifique binomial avec auteur (ex: 'Solanum lycopersicum L.')
  scientificNameWithoutAuthor: string; // Ex: 'Solanum lycopersicum'
  genus: string; // Ex: 'Solanum'
  family: string; // Ex: 'Solanaceae'
  order: string; // Ex: 'Solanales'
  commonName: string; // Nom commun français (ex: 'Tomate')
  category: "culture" | "adventice" | "arbre_fruitier" | "arbre_agroforestier" | "fourrage";
  isWeed: boolean; // Flag d'alerte immédiat pour adventice
  vernacularNames: {
    moore?: string;
    dioula?: string;
    fulfulde?: string;
    en?: string;
  };
  organs: {
    leaf: BotanicalOrganDescriptor;
    flower?: {
      color: string;
      petalsCount?: number;
      symmetry: "actinomorphe" | "zygomorphe";
      inflorescence: string;
    };
    fruit?: {
      type: string;
      colorMaturity: string;
      edible: boolean;
    };
  };
  agroEcologicalZones: AgroEcologicalZoneBF[];
  openDataSource: string;
  ineraReference?: string;
  cycleDaysRange: [number, number];
  companionCrops?: string[]; // Pour les cultures
  targetCrops?: string[]; // Pour les adventices parasites
  distinctiveFeatures: string[];
}

/**
 * CATALOGUE SCIENTIFIQUE BOTANIQUE NAFA-AGRITECH
 * Flore cultivée et adventices majeures du Burkina Faso et du Sahel.
 */
export const NAFA_BOTANICAL_CATALOG: NafaBotanicalSpecies[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SOLANACÉES MARAÎCHÈRES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "tomate",
    scientificName: "Solanum lycopersicum L.",
    scientificNameWithoutAuthor: "Solanum lycopersicum",
    genus: "Solanum",
    family: "Solanaceae",
    order: "Solanales",
    commonName: "Tomate",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Koom-kamba",
      dioula: "Tomati",
      fulfulde: "Kooje",
      en: "Tomato",
    },
    organs: {
      leaf: {
        shape: "Pennatiséquée découpée",
        margin: "Dentée irrégulière",
        venation: "Pennée saillante",
        arrangement: "Alternes spiralées",
        colorTypical: "#2e7d32",
        texture: "Poilue glanduleuse odorante",
      },
      flower: {
        color: "Jaune vif",
        petalsCount: 5,
        symmetry: "actinomorphe",
        inflorescence: "Cyme unipare hélicoïde",
      },
      fruit: {
        type: "Baie charnue pulpeuse",
        colorMaturity: "Rouge écarlate à orangé",
        edible: true,
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "FAO EcoCrop 1993 • INERA Fiche Maraîchage • PlantVillage Tomato Baseline",
    ineraReference: "INERA Variétés Mongal F1, Nadira, Petomech",
    cycleDaysRange: [75, 110],
    distinctiveFeatures: [
      "Feuilles composées très découpées à odeur aromatique caractéristique au froissement",
      "Fleurs jaunes en étoiles de 5 pétales recourbés",
      "Tiges épaisses couvertes de poils glanduleux sécréteurs",
    ],
  },
  {
    id: "piment",
    scientificName: "Capsicum annuum L.",
    scientificNameWithoutAuthor: "Capsicum annuum",
    genus: "Capsicum",
    family: "Solanaceae",
    order: "Solanales",
    commonName: "Piment & Poivron",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Kiparé",
      dioula: "Foronto",
      fulfulde: "Chitta",
      en: "Chili Pepper",
    },
    organs: {
      leaf: {
        shape: "Ovale acuminée",
        margin: "Entière lisse",
        venation: "Pennée fine",
        arrangement: "Alternes simples",
        colorTypical: "#1b5e20",
        texture: "Glabre luisante",
      },
      flower: {
        color: "Blanc crème",
        petalsCount: 5,
        symmetry: "actinomorphe",
        inflorescence: "Solitaire à l'aisselle des rameaux",
      },
      fruit: {
        type: "Baie creuse indéhiscente piquante",
        colorMaturity: "Rouge écarlate, vert ou jaune",
        edible: true,
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "FAO EcoCrop 580 • CIRAD Mémento de l'Agronome",
    ineraReference: "INERA Sélection Piment Goutte d'Or",
    cycleDaysRange: [90, 140],
    distinctiveFeatures: [
      "Feuilles simples entières vert brillant sans poils glanduleux",
      "Fleurs pendantes blanches solitaires aux nœuds de ramification",
      "Rameaux dichotomiques formant un port en buisson dressé",
    ],
  },
  {
    id: "aubergine",
    scientificName: "Solanum aethiopicum L.",
    scientificNameWithoutAuthor: "Solanum aethiopicum",
    genus: "Solanum",
    family: "Solanaceae",
    order: "Solanales",
    commonName: "Aubergine locale (Kumba / Djambourou)",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Koumba",
      dioula: "Djambourou",
      fulfulde: "Yalo",
      en: "African Eggplant",
    },
    organs: {
      leaf: {
        shape: "Ovale lobée large",
        margin: "Sinusoïdale à lobes arrondis",
        venation: "Pennée proéminente",
        arrangement: "Alternes",
        colorTypical: "#33691e",
        texture: "Duveteuse parfois épineuse sur nervures",
      },
      flower: {
        color: "Blanc étoilé",
        petalsCount: 5,
        symmetry: "actinomorphe",
        inflorescence: "Fascicules axillaires",
      },
      fruit: {
        type: "Baie côtelée ferme",
        colorMaturity: "Vert marbré puis rouge orangé",
        edible: true,
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "PROTA (Plant Resources of Tropical Africa) • INERA Farako-Bâ",
    cycleDaysRange: [80, 120],
    distinctiveFeatures: [
      "Grandes feuilles lobées à limbe robuste et revers grisâtre",
      "Fruits sphériques ou aplatis très côtelés consommés verts ou mûrs",
    ],
  },
  {
    id: "pomme_de_terre",
    scientificName: "Solanum tuberosum L.",
    scientificNameWithoutAuthor: "Solanum tuberosum",
    genus: "Solanum",
    family: "Solanaceae",
    order: "Solanales",
    commonName: "Pomme de Terre",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Pometeer",
      dioula: "Pomi",
      en: "Potato",
    },
    organs: {
      leaf: {
        shape: "Imparipennée",
        margin: "Entière ou légèrement ondulée",
        venation: "Pennée",
        arrangement: "Alternes",
        colorTypical: "#2e7d32",
        texture: "Légèrement pubescente",
      },
      flower: {
        color: "Blanc à violet clair",
        petalsCount: 5,
        symmetry: "actinomorphe",
        inflorescence: "Cymes terminales",
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "CIP (International Potato Center) • INERA Farako-Bâ",
    cycleDaysRange: [75, 105],
    distinctiveFeatures: [
      "Plante herbacée à tiges anguleuses dressées puis étalées",
      "Tubercules souterrains à peau jaune ou rouge",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CÉRÉALES SAHÉLIENNES & GRAMINÉES MAJEURES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "mais",
    scientificName: "Zea mays L.",
    scientificNameWithoutAuthor: "Zea mays",
    genus: "Zea",
    family: "Poaceae",
    order: "Poales",
    commonName: "Maïs",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Kamaana",
      dioula: "Kaba",
      fulfulde: "Makkari",
      en: "Maize",
    },
    organs: {
      leaf: {
        shape: "Rubanée linéaire allongée",
        margin: "Ondulée scabre",
        venation: "Parallèle striée avec nervure centrale blanche",
        arrangement: "Distique alterne le long de la tige",
        colorTypical: "#2e7d32",
        texture: "Rugueuse avec poils courts épars",
      },
      flower: {
        color: "Panicule terminale jaune doré (fleurs mâles) et soies soyeuses (fleurs femelles)",
        symmetry: "actinomorphe",
        inflorescence: "Panicule plumeuse au sommet et épi axillaire",
      },
      fruit: {
        type: "Caryopse serré en rangées régulières sur la rafle",
        colorMaturity: "Jaune d'or ou blanc nacré",
        edible: true,
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "CIMMYT Open Data • INERA Farako-Bâ • FAO EcoCrop 2221",
    ineraReference: "INERA Variétés Barka, Espoir, SR21, FBC6",
    cycleDaysRange: [80, 115],
    distinctiveFeatures: [
      "Feuilles larges rubanées à nervure centrale blanche très visible",
      "Tige robuste cylindrique pleine avec racines adventives d'ancrage en échasses",
      "Épi enveloppé de spathes à soies soyeuses caractéristiques",
    ],
  },
  {
    id: "sorgho",
    scientificName: "Sorghum bicolor (L.) Moench",
    scientificNameWithoutAuthor: "Sorghum bicolor",
    genus: "Sorghum",
    family: "Poaceae",
    order: "Poales",
    commonName: "Sorgho (Blanc / Rouge)",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Kazuiiga (rouge) / Ka-pesgo (blanc)",
      dioula: "Keninke",
      fulfulde: "Bayeeri",
      en: "Sorghum",
    },
    organs: {
      leaf: {
        shape: "Lancéolée rubanée étroite",
        margin: "Denticulée coupante",
        venation: "Parallèle très dense",
        arrangement: "Alternes distiques",
        colorTypical: "#388e3c",
        texture: "Cireuse couverte de pruine blanchâtre",
      },
      flower: {
        color: "Panicule dressée compacte ou lâche brun-roux à blanc crème",
        symmetry: "actinomorphe",
        inflorescence: "Panicule terminale volumineuse",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "ICRISAT Open Crop Data • INERA Kamboinsé",
    ineraReference: "INERA Variétés Sariaso, Kapèlga, ICSV 1049",
    cycleDaysRange: [90, 130],
    distinctiveFeatures: [
      "Revêtement pruineux cireux blanc sur la tige et la gaine foliaire réduisant l'évaporation",
      "Panicule terminale dressée compacte ou demi-lâche de grains ronds",
    ],
  },
  {
    id: "mil",
    scientificName: "Pennisetum glaucum (L.) R.Br.",
    scientificNameWithoutAuthor: "Pennisetum glaucum",
    genus: "Pennisetum",
    family: "Poaceae",
    order: "Poales",
    commonName: "Mil pénicillaire / Petit mil",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Kazuiiga / Ki",
      dioula: "Sagnan",
      fulfulde: "Gauri",
      en: "Pearl Millet",
    },
    organs: {
      leaf: {
        shape: "Rubanée allongée étroite",
        margin: "Scabre coupante",
        venation: "Parallèle",
        arrangement: "Alternes distiques",
        colorTypical: "#4caf50",
        texture: "Poilue scabre",
      },
      flower: {
        color: "Chandelle cylindrique compacte duveteuse grisâtre",
        symmetry: "actinomorphe",
        inflorescence: "Faux épi en chandelle dense de 20 à 60 cm",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud"],
    openDataSource: "ICRISAT Pearl Millet Compendium • INERA Dori",
    cycleDaysRange: [75, 110],
    distinctiveFeatures: [
      "Inflorescence en longue chandelle compacte velue très serrée",
      "Robustesse extrême au stress hydrique et sols sableux dunaires",
    ],
  },
  {
    id: "riz",
    scientificName: "Oryza sativa L.",
    scientificNameWithoutAuthor: "Oryza sativa",
    genus: "Oryza",
    family: "Poaceae",
    order: "Poales",
    commonName: "Riz (Bas-fond & Pluvial)",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Mui",
      dioula: "Malo",
      fulfulde: "Maaroori",
      en: "Rice",
    },
    organs: {
      leaf: {
        shape: "Linéaire dressée à retombante",
        margin: "Finement scabre",
        venation: "Parallèle avec ligule et oreillettes ciliées",
        arrangement: "Alternes",
        colorTypical: "#43a047",
        texture: "Scabre au toucher vers l'apex",
      },
      flower: {
        color: "Panicule étalée retombante vert pâle puis jaune doré",
        symmetry: "actinomorphe",
        inflorescence: "Panicule rameuse retombante à maturité",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "AfricaRice Open Access • INERA Farako-Bâ • FAO EcoCrop 1600",
    ineraReference: "INERA Variétés FKR 19, FKR 62N (NERICA), Sahel 108, TS2",
    cycleDaysRange: [90, 130],
    distinctiveFeatures: [
      "Présence d'une ligule membraneuse longue et d'oreillettes ciliées à la base du limbe",
      "Tallage abondant formant une touffe dense en milieu humide ou inondé",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. LÉGUMINEUSES & PROTÉAGINEUX SAHÉLIENS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "niebe",
    scientificName: "Vigna unguiculata (L.) Walp.",
    scientificNameWithoutAuthor: "Vigna unguiculata",
    genus: "Vigna",
    family: "Fabaceae",
    order: "Fabales",
    commonName: "Niébé / Haricot local",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Benga",
      dioula: "Sô",
      fulfulde: "Nyebbe",
      en: "Cowpea",
    },
    organs: {
      leaf: {
        shape: "Trifoliée à folioles ovales losangiques",
        margin: "Entière lisse",
        venation: "Réticulée",
        arrangement: "Alternes trifoliolées à stipules bien visibles",
        colorTypical: "#2e7d32",
        texture: "Glabre ou légèrement pubescente",
      },
      flower: {
        color: "Violette, pourpre ou blanche papilionacée",
        petalsCount: 5,
        symmetry: "zygomorphe",
        inflorescence: "Grappe axillaire sur long pédoncule",
      },
      fruit: {
        type: "Gousse pendante linéaire cylindrique",
        colorMaturity: "Crème paille à brun clair",
        edible: true,
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "IITA Open Data • INERA Kamboinsé • FAO EcoCrop 2138",
    ineraReference: "INERA Variétés KVx 399-05, Komcallé, Tiligré",
    cycleDaysRange: [60, 85],
    distinctiveFeatures: [
      "Feuilles composées de 3 grandes folioles régulières à pointe légèrement effilée",
      "Fleurs papilionacées violettes ou blanches portées par paire en haut d'un long pédoncule",
      "Nodosités racinaires fixatrices d'azote visibles sur les racines saines",
    ],
  },
  {
    id: "arachide",
    scientificName: "Arachis hypogaea L.",
    scientificNameWithoutAuthor: "Arachis hypogaea",
    genus: "Arachis",
    family: "Fabaceae",
    order: "Fabales",
    commonName: "Arachide",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Nanguri",
      dioula: "Tiganin / Tiga",
      fulfulde: "Biriiji",
      en: "Groundnut / Peanut",
    },
    organs: {
      leaf: {
        shape: "Paripennée à 4 folioles obovales (2 paires)",
        margin: "Entière ciliée",
        venation: "Pennée délicate",
        arrangement: "Alternes composées tétrafoliolées",
        colorTypical: "#388e3c",
        texture: "Légèrement veloutée",
      },
      flower: {
        color: "Jaune orangé vif à étendard strié de rouge",
        petalsCount: 5,
        symmetry: "zygomorphe",
        inflorescence: "Fascicules axillaires basaux",
      },
      fruit: {
        type: "Gousse souterraine indéhiscente réticulée à 2-3 graines",
        colorMaturity: "Coque beige ridée souterraine",
        edible: true,
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "ICRISAT Groundnut Compendium • INERA Saria",
    ineraReference: "INERA Variétés SH 470P, Fleur 11, RMP 12",
    cycleDaysRange: [90, 120],
    distinctiveFeatures: [
      "Feuilles caractéristiques formées exactement de 4 folioles régulières en 2 paires",
      "Gynophores (aiguilles) courbés s'enfonçant sous terre pour former les gousses après floraison",
    ],
  },
  {
    id: "soja",
    scientificName: "Glycine max (L.) Merr.",
    scientificNameWithoutAuthor: "Glycine max",
    genus: "Glycine",
    family: "Fabaceae",
    order: "Fabales",
    commonName: "Soja",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Soya",
      dioula: "Soya",
      en: "Soybean",
    },
    organs: {
      leaf: {
        shape: "Trifoliée ovale acuminée",
        margin: "Entière",
        venation: "Réticulée",
        arrangement: "Alternes",
        colorTypical: "#2e7d32",
        texture: "Densement pubescente poils fauve ou gris",
      },
      flower: {
        color: "Blanche ou violet pâle",
        petalsCount: 5,
        symmetry: "zygomorphe",
        inflorescence: "Petits racèmes axillaires",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "IITA Soybean Research • INERA Farako-Bâ",
    cycleDaysRange: [85, 115],
    distinctiveFeatures: [
      "Plante entière couverte d'un duvet de poils soyeux fauves caractéristiques",
      "Gousses pendantes droites ou falciformes très duveteuses en paquets serrés",
    ],
  },
  {
    id: "sesame",
    scientificName: "Sesamum indicum L.",
    scientificNameWithoutAuthor: "Sesamum indicum",
    genus: "Sesamum",
    family: "Pedaliaceae",
    order: "Lamiales",
    commonName: "Sésame",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Suma",
      dioula: "Béné",
      fulfulde: "Mori",
      en: "Sesame",
    },
    organs: {
      leaf: {
        shape: "Lancéolée allongée (feuilles supérieures) et lobée (base)",
        margin: "Entière ou dentée",
        venation: "Pennée réticulée",
        arrangement: "Opposées à la base, alternes au sommet",
        colorTypical: "#33691e",
        texture: "Légèrement pubescente",
      },
      flower: {
        color: "Blanc rosé tubuleuse en clochete à lèvres",
        symmetry: "zygomorphe",
        inflorescence: "Fleurs solitaires à l'aisselle des feuilles",
      },
      fruit: {
        type: "Capsule oblongue dressée déhiscente à 4 sillons",
        colorMaturity: "Vert devenant beige à maturité",
        edible: true,
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "FAO EcoCrop 1957 • INERA Kamboinsé",
    cycleDaysRange: [80, 105],
    distinctiveFeatures: [
      "Tige quadrangulaire sillonnée dressée",
      "Fleurs en clochettes tubuleuses semblables à des digitales",
      "Capsules dressées le long de la tige s'ouvrant par le haut pour libérer les graines",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. AUTRES CULTURES MARAÎCHÈRES ET TUBERCULES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "oignon",
    scientificName: "Allium cepa L.",
    scientificNameWithoutAuthor: "Allium cepa",
    genus: "Allium",
    family: "Amaryllidaceae",
    order: "Asparagales",
    commonName: "Oignon",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Zaba",
      dioula: "Jaba",
      fulfulde: "Tingyeere",
      en: "Onion",
    },
    organs: {
      leaf: {
        shape: "Tubulaire cylindrique creuse acuminée",
        margin: "Lisse continue",
        venation: "Parallèle imperceptible",
        arrangement: "Alternes imbriquées formant une gaine à la base",
        colorTypical: "#388e3c",
        texture: "Lisse cireuse glauque creuse",
      },
      flower: {
        color: "Ombelle sphérique de petites fleurs blanches à vert pâle",
        symmetry: "actinomorphe",
        inflorescence: "Ombelle globuleuse portée par une hampe creuse",
      },
      fruit: {
        type: "Bulbe souterrain formé de tuniques charnues superposées",
        colorMaturity: "Violet pourpre (Violet de Galmi), paille ou blanc",
        edible: true,
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "AVRDC World Vegetable Center • INERA Kamboinsé",
    ineraReference: "INERA Variétés Violet de Galmi, Gandiol, Damani",
    cycleDaysRange: [90, 120],
    distinctiveFeatures: [
      "Feuilles creuses cylindriques tubulaires à forte odeur soufrée alliacée",
      "Hampe florale renflée au milieu portant une sphère de fleurs blanches protégée par une spathe",
      "Bulbe globuleux enveloppé de tuniques écailleuses papyracées",
    ],
  },
  {
    id: "gombo",
    scientificName: "Abelmoschus esculentus (L.) Moench",
    scientificNameWithoutAuthor: "Abelmoschus esculentus",
    genus: "Abelmoschus",
    family: "Malvaceae",
    order: "Malvales",
    commonName: "Gombo",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Maana",
      dioula: "Gban",
      fulfulde: "Bameere",
      en: "Okra",
    },
    organs: {
      leaf: {
        shape: "Palmatilobée à 3-5 lobes profonds",
        margin: "Dentée crénelée",
        venation: "Palmée",
        arrangement: "Alternes sur long pétiole",
        colorTypical: "#2e7d32",
        texture: "Scabre poils rudes piquants",
      },
      flower: {
        color: "Jaune pâle à centre pourpre marron foncé très contrasté",
        petalsCount: 5,
        symmetry: "actinomorphe",
        inflorescence: "Fleurs solitaires à l'aisselle des feuilles",
      },
      fruit: {
        type: "Capsule pyramidale allongée à 5-8 côtes mucilagineuse",
        colorMaturity: "Vert foncé, parfois pourpre",
        edible: true,
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "PROTA Malvaceae • INERA Fiche Maraîchère",
    cycleDaysRange: [60, 90],
    distinctiveFeatures: [
      "Fleurs magnifiques jaune d'or avec un cœur pourpre lie-de-vin spectaculaire",
      "Fruits en pyramide à côtes mucilagineux au toucher",
      "Feuilles palmées à pétioles vigoureux",
    ],
  },
  {
    id: "manioc",
    scientificName: "Manihot esculenta Crantz",
    scientificNameWithoutAuthor: "Manihot esculenta",
    genus: "Manihot",
    family: "Euphorbiaceae",
    order: "Malpighiales",
    commonName: "Manioc",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Banga",
      dioula: "Bananba",
      en: "Cassava",
    },
    organs: {
      leaf: {
        shape: "Palmatiséquée à 3-7 lobes lancéolés étroits",
        margin: "Entière",
        venation: "Palmée proéminente",
        arrangement: "Alternes spiralées sur long pétiole rouge ou vert",
        colorTypical: "#1b5e20",
        texture: "Lisse glabre luisante",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "IITA Cassava Compendium • INERA Farako-Bâ",
    cycleDaysRange: [240, 365],
    distinctiveFeatures: [
      "Feuilles en éventail découpées comme une main à longs pétioles fins",
      "Tige ligneuse noueuse avec cicatrices foliaires très proéminentes",
      "Racines tubéreuses renflées cylindriques riches en fécule",
    ],
  },
  {
    id: "coton",
    scientificName: "Gossypium hirsutum L.",
    scientificNameWithoutAuthor: "Gossypium hirsutum",
    genus: "Gossypium",
    family: "Malvaceae",
    order: "Malvales",
    commonName: "Coton / Cotonnière",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Laamdo",
      dioula: "Kotoni",
      fulfulde: "Hottollo",
      en: "Cotton",
    },
    organs: {
      leaf: {
        shape: "Palmatilobée à 3 lobes triangulaires acuminés",
        margin: "Entière",
        venation: "Palmée saillante avec nectaires sous les nervures",
        arrangement: "Alternes",
        colorTypical: "#2e7d32",
        texture: "Duveteuse pubescente",
      },
      flower: {
        color: "Blanc crème le matin virant au rose pourpre le soir",
        petalsCount: 5,
        symmetry: "actinomorphe",
        inflorescence: "Solitaire aisselle",
      },
      fruit: {
        type: "Capsule s'ouvrant en 3 à 5 loges libérant les fibres de coton blanc",
        colorMaturity: "Vert puis brun desséché éclatant",
        edible: false,
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "SOFITEX / INERA Bobo-Dioulasso • CIRAD Cotton Research",
    cycleDaysRange: [120, 160],
    distinctiveFeatures: [
      "Fleurs changeant de couleur au cours de la journée (crème puis rose)",
      "Feuilles trilobées à nectaires foliaires caractéristiques sous la face inférieure",
      "Capsules (boles) libérant à maturité une touffe de fibre blanche pure",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ARBRES FRUITIERS & AGROFORESTIERS SAHÉLIENS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "manguier",
    scientificName: "Mangifera indica L.",
    scientificNameWithoutAuthor: "Mangifera indica",
    genus: "Mangifera",
    family: "Anacardiaceae",
    order: "Sapindales",
    commonName: "Manguier",
    category: "arbre_fruitier",
    isWeed: false,
    vernacularNames: {
      moore: "Manga",
      dioula: "Mangoro",
      fulfulde: "Mangoroore",
      en: "Mango Tree",
    },
    organs: {
      leaf: {
        shape: "Oblongue lancéolée coriace",
        margin: "Ondulée entière",
        venation: "Pennée saillante dense",
        arrangement: "Alternes en bouquets terminaux",
        colorTypical: "#1b5e20",
        texture: "Coriace luisante face supérieure, jeune pousse rouge cuivré",
      },
      flower: {
        color: "Jaunâtre rosée en grandes panicules pyramidales terminales",
        symmetry: "actinomorphe",
        inflorescence: "Panicule florifère terminale pyramidale",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "CIRAD Fiches Arbres Fruitiers • INERA Bérégadougou",
    ineraReference: "INERA Variétés Amélie (Gouverneur), Brooks, Kent, Keitt",
    cycleDaysRange: [120, 150],
    distinctiveFeatures: [
      "Jeunes feuilles d'un rouge violacé/cuivré devenant vert sombre luisant très coriaces",
      "Grand arbre à cime dense arrondie apportant un ombrage épais toute l'année",
      "Inflorescences en thyrses pyramidaux très denses portant des centaines de petites fleurs",
    ],
  },
  {
    id: "anacardier",
    scientificName: "Anacardium occidentale L.",
    scientificNameWithoutAuthor: "Anacardium occidentale",
    genus: "Anacardium",
    family: "Anacardiaceae",
    order: "Sapindales",
    commonName: "Anacardier / Noyer de cajou",
    category: "arbre_fruitier",
    isWeed: false,
    vernacularNames: {
      moore: "Kasuw",
      dioula: "Suma-yiri / Kaju",
      en: "Cashew Tree",
    },
    organs: {
      leaf: {
        shape: "Obovale arrondie au sommet",
        margin: "Entière",
        venation: "Pennée saillante claire",
        arrangement: "Alternes spiralées",
        colorTypical: "#2e7d32",
        texture: "Épaisse très coriace glabre",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "INERA Banfora • CIRAD Anacardier",
    cycleDaysRange: [100, 130],
    distinctiveFeatures: [
      "Feuilles épaisses obovales au sommet très arrondi ou émarginé",
      "Faux-fruit en pomme charnue jaune ou rouge surmonté de la noix grise réniforme (vraie graine)",
    ],
  },
  {
    id: "karite",
    scientificName: "Vitellaria paradoxa C.F.Gaertn.",
    scientificNameWithoutAuthor: "Vitellaria paradoxa",
    genus: "Vitellaria",
    family: "Sapotaceae",
    order: "Ericales",
    commonName: "Karité",
    category: "arbre_agroforestier",
    isWeed: false,
    vernacularNames: {
      moore: "Taanga",
      dioula: "Shi yiri",
      fulfulde: "Karehi",
      en: "Shea Tree",
    },
    organs: {
      leaf: {
        shape: "Oblongue allongée ondulée",
        margin: "Ondulée régulière",
        venation: "Pennée dense parallèle",
        arrangement: "Fasciculées au sommet des rameaux épais",
        colorTypical: "#33691e",
        texture: "Coriace luisante",
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "INERA CNRST Parc Agroforestier • CIRAD Vitellaria",
    cycleDaysRange: [120, 160],
    distinctiveFeatures: [
      "Écorce profondément crevassée en écailles rectangulaires épaisses (résistance au feu de brousse)",
      "Feuilles réunies en touffes au bout des branches à marges ondulées",
      "Noix riches en beurre végétal comestible et cosmétique",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ADVENTICES MAJEURES DU SAHEL (MAUVAISES HERBES & PARASITES)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "striga_hermonthica",
    scientificName: "Striga hermonthica (Delile) Benth.",
    scientificNameWithoutAuthor: "Striga hermonthica",
    genus: "Striga",
    family: "Orobanchaceae",
    order: "Lamiales",
    commonName: "Striga pourpre / Herbe des sorcières",
    category: "adventice",
    isWeed: true,
    vernacularNames: {
      moore: "Wilinga / Wieto / Wibga",
      dioula: "Sigin / Sikura",
      fulfulde: "Dodonko / Duule",
      en: "Purple Witchweed",
    },
    organs: {
      leaf: {
        shape: "Linéaire étroite réduite",
        margin: "Entière ou rarement à 1-2 dents",
        venation: "Uninervée",
        arrangement: "Opposées décussées devenant alternes en haut",
        colorTypical: "#558b2f",
        texture: "Scabre rugueuse raide",
      },
      flower: {
        color: "Rose vif éclatant, violette ou pourpre à gorge blanche",
        petalsCount: 5,
        symmetry: "zygomorphe",
        inflorescence: "Épi terminal dressé très visible",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "CABI Invasive Species Compendium • INERA Malherbologie Farako-Bâ • CILSS",
    ineraReference: "INERA Protocole de Lutte Intégrée contre le Striga",
    cycleDaysRange: [60, 90],
    targetCrops: ["mais", "sorgho", "mil", "riz"],
    distinctiveFeatures: [
      "Fleurs rose vif à gorge blanche très voyantes au-dessus de la végétation céréalière",
      "Plante hémiparasite racinaire fixée par des suçoirs (haustoria) sur les racines des céréales",
      "Provoque un rabougrissement sévère et des brûlures foliaires sur la culture hôte",
    ],
  },
  {
    id: "striga_gesnerioides",
    scientificName: "Striga gesnerioides (Willd.) Vatke",
    scientificNameWithoutAuthor: "Striga gesnerioides",
    genus: "Striga",
    family: "Orobanchaceae",
    order: "Lamiales",
    commonName: "Striga du niébé",
    category: "adventice",
    isWeed: true,
    vernacularNames: {
      moore: "Wib-benga",
      dioula: "Sikura-sô",
      en: "Cowpea Witchweed",
    },
    organs: {
      leaf: {
        shape: "Écailleuse minuscule atrophiée",
        margin: "Entière",
        venation: "Invisible",
        arrangement: "Écailles alternes charnues",
        colorTypical: "#795548",
        texture: "Succulente écailleuse",
      },
      flower: {
        color: "Mauve pâle, blanche ou bleuâtre",
        petalsCount: 5,
        symmetry: "zygomorphe",
        inflorescence: "Épi dense à tiges multiples ramifiées",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud"],
    openDataSource: "IITA / INERA Cowpea Protection",
    cycleDaysRange: [50, 75],
    targetCrops: ["niebe"],
    distinctiveFeatures: [
      "Parasite exclusif des racines du niébé",
      "Tiges jaunâtres, brunâtres ou violacées presque sans chlorophylle, ramifiées en touffe",
      "Fleurs bleu mauve pâle ou blanches",
    ],
  },
  {
    id: "cyperus_rotundus",
    scientificName: "Cyperus rotundus L.",
    scientificNameWithoutAuthor: "Cyperus rotundus",
    genus: "Cyperus",
    family: "Cyperaceae",
    order: "Poales",
    commonName: "Souchet rond / Herbe à oignon",
    category: "adventice",
    isWeed: true,
    vernacularNames: {
      moore: "Zab-toko",
      dioula: "Tigadaga",
      fulfulde: "Moutouri",
      en: "Purple Nutsedge",
    },
    organs: {
      leaf: {
        shape: "Linéaire rubanée en V carénée",
        margin: "Lisse",
        venation: "Parallèle",
        arrangement: "Tristique (3 rangées disposées à 120°)",
        colorTypical: "#1b5e20",
        texture: "Lisse luisante vert foncé",
      },
      flower: {
        color: "Épillets brun rougeâtre à pourpre en ombelle terminale",
        symmetry: "actinomorphe",
        inflorescence: "Ombelle d'épillets fins brun cuivré",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "EPPO Global Database • CABI CPC • INERA",
    cycleDaysRange: [30, 60],
    distinctiveFeatures: [
      "Tige nettement triangulaire à angles vifs sans nœuds",
      "Réseau souterrain complexe de rhizomes et petits tubercules amers noirs très persistants",
      "Considéré comme l'une des pires adventices vivaces au monde en maraîchage",
    ],
  },
  {
    id: "cynodon_dactylon",
    scientificName: "Cynodon dactylon (L.) Pers.",
    scientificNameWithoutAuthor: "Cynodon dactylon",
    genus: "Cynodon",
    family: "Poaceae",
    order: "Poales",
    commonName: "Chiendent pied-de-poule / Gros chiendent",
    category: "adventice",
    isWeed: true,
    vernacularNames: {
      moore: "Nawa-toko",
      dioula: "Woro-woro",
      en: "Bermuda Grass",
    },
    organs: {
      leaf: {
        shape: "Linéaire aiguë courte",
        margin: "Scabre",
        venation: "Parallèle",
        arrangement: "Distique le long des stolons",
        colorTypical: "#4caf50",
        texture: "Poils fins à la gorge de la gaine",
      },
      flower: {
        color: "Inflorescence digitée en 4-7 épis rayonnant comme les doigts d'une main",
        symmetry: "actinomorphe",
        inflorescence: "Épis digités terminaux violacés ou vert-pâle",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "CIRAD Malherbologie Tropicale • EPPO Global Database",
    cycleDaysRange: [30, 90],
    distinctiveFeatures: [
      "Inflorescence caractéristique étalée en ombrelle avec 4 à 6 doigts rayonnants",
      "Stolons rampants superficiels et rhizomes profonds formant un gazon dense étouffant les cultures",
    ],
  },
  {
    id: "commelina_benghalensis",
    scientificName: "Commelina benghalensis L.",
    scientificNameWithoutAuthor: "Commelina benghalensis",
    genus: "Commelina",
    family: "Commelinaceae",
    order: "Commelinales",
    commonName: "Comméline du Bengale / Oreille de lièvre",
    category: "adventice",
    isWeed: true,
    vernacularNames: {
      moore: "Tomb-toko",
      dioula: "Bafing-dolo",
      en: "Benghal Dayflower",
    },
    organs: {
      leaf: {
        shape: "Ovale elliptique charnue",
        margin: "Entière ou légèrement ondulée ciliée",
        venation: "Parallèle courbée",
        arrangement: "Alternes engainantes",
        colorTypical: "#2e7d32",
        texture: "Subcharnue velue aux gaines (poils roux)",
      },
      flower: {
        color: "Bleu ciel éclatant à 3 pétales inégaux",
        petalsCount: 3,
        symmetry: "zygomorphe",
        inflorescence: "Spathe en entonnoir",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "EPPO • CIRAD Malherbologie",
    cycleDaysRange: [40, 75],
    distinctiveFeatures: [
      "Fleurs bleu ciel intense éphémères émergeant d'une spathe en forme de poche",
      "Gaines foliaires bordées de soies rousses caractéristiques",
      "Produit des fleurs et graines aériennes ET des fleurs souterraines cléistogames",
    ],
  },
  {
    id: "eichhornia_crassipes",
    scientificName: "Pontederia crassipes Mart. (syn. Eichhornia crassipes)",
    scientificNameWithoutAuthor: "Pontederia crassipes",
    genus: "Pontederia",
    family: "Pontederiaceae",
    order: "Commelinales",
    commonName: "Jacinthe d'eau",
    category: "adventice",
    isWeed: true,
    vernacularNames: {
      moore: "Koom-wibga",
      dioula: "Jiyiri",
      en: "Water Hyacinth",
    },
    organs: {
      leaf: {
        shape: "Réniforme orbiculaire charnue luisante",
        margin: "Entière",
        venation: "Parallèle arquée",
        arrangement: "Rosette flottante",
        colorTypical: "#1b5e20",
        texture: "Pétiole très renflé spongieux en bulbe plein d'air",
      },
      flower: {
        color: "Bleu violacé lavande avec une tache jaune cerclée de bleu sur le pétale supérieur",
        petalsCount: 6,
        symmetry: "zygomorphe",
        inflorescence: "Épi dressé robuste au centre de la rosette",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "Global Invasive Species Database (GISD) • Office National de l'Eau (ONEA)",
    cycleDaysRange: [15, 30],
    distinctiveFeatures: [
      "Plante aquatique flottante à pétioles renflés en flotteurs spongieux",
      "Épis floraux magnifiques lilas ornés d'un œil jaune au centre",
      "Envahit les barrages et canaux d'irrigation burkinabè, provoquant une évapotranspiration massive",
    ],
  },
  {
    id: "fonio",
    scientificName: "Digitaria exilis (Kippist) Stapf",
    scientificNameWithoutAuthor: "Digitaria exilis",
    genus: "Digitaria",
    family: "Poaceae",
    order: "Poales",
    commonName: "Fonio blanc",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Kra",
      dioula: "Fini",
      fulfulde: "Fonio",
      en: "White Fonio",
    },
    organs: {
      leaf: {
        shape: "Linéaire fine allongée",
        margin: "Scabre",
        venation: "Parallèle",
        arrangement: "Alternes distiques",
        colorTypical: "#388e3c",
        texture: "Lisse à gaine glabre",
      },
      flower: {
        color: "Verdâtre à jaune paille",
        symmetry: "actinomorphe",
        inflorescence: "Racèmes digités terminaux très fins",
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "CIRAD Fonio Open Science • INERA Kamboinsé",
    cycleDaysRange: [70, 100],
    distinctiveFeatures: [
      "Céréale sahélienne rustique tolérante à la sécheresse et aux sols pauvres",
      "Grains minuscules vêtus très riches en acides aminés soufrés",
    ],
  },
  {
    id: "pois_de_terre",
    scientificName: "Vigna subterranea (L.) Verdc.",
    scientificNameWithoutAuthor: "Vigna subterranea",
    genus: "Vigna",
    family: "Fabaceae",
    order: "Fabales",
    commonName: "Pois de terre / Voandzou",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Kourba / Koula",
      dioula: "Tiganinkourou",
      fulfulde: "Dobi",
      en: "Bambara Groundnut",
    },
    organs: {
      leaf: {
        shape: "Trifoliée à folioles elliptiques à lancéolées",
        margin: "Entière",
        venation: "Pennée réticulée",
        arrangement: "Alternes érigées sur longs pétioles",
        colorTypical: "#2e7d32",
        texture: "Glabre subcoriace",
      },
      flower: {
        color: "Jaune pâle à blanc crème",
        petalsCount: 5,
        symmetry: "zygomorphe",
        inflorescence: "Paires de fleurs au ras du collet",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "FAO EcoCrop 2137 • INERA Kamboinsé",
    cycleDaysRange: [90, 130],
    distinctiveFeatures: [
      "Plante herbacée touffue sans tige rampante apparente",
      "Gousses globuleuses souterraines renfermant 1 à 2 graines rondes très dures multicolores",
    ],
  },
  {
    id: "patate_douce",
    scientificName: "Ipomoea batatas (L.) Lam.",
    scientificNameWithoutAuthor: "Ipomoea batatas",
    genus: "Ipomoea",
    family: "Convolvulaceae",
    order: "Solanales",
    commonName: "Patate douce",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Wasa-wasa",
      dioula: "Woso",
      fulfulde: "Kudere",
      en: "Sweet Potato",
    },
    organs: {
      leaf: {
        shape: "Cœur cordiforme ou lobée palmée",
        margin: "Entière ou profondément digitée",
        venation: "Palmée",
        arrangement: "Alternes spiralées",
        colorTypical: "#2e7d32",
        texture: "Glabre ou légèrement poilue",
      },
      flower: {
        color: "Blanc violacé rosé en entonnoir",
        petalsCount: 5,
        symmetry: "actinomorphe",
        inflorescence: "Fleurs solitaires à l'aisselle",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "CIP Open Data • INERA Farako-Bâ Variétés à Chair Orange",
    cycleDaysRange: [90, 120],
    distinctiveFeatures: [
      "Tiges rampantes vigoureuses couvrant densément le sol",
      "Tubercules fusiformes riches en provitamine A (variétés orange CIP)",
    ],
  },
  {
    id: "igname",
    scientificName: "Dioscorea rotundata Poir.",
    scientificNameWithoutAuthor: "Dioscorea rotundata",
    genus: "Dioscorea",
    family: "Dioscoreaceae",
    order: "Dioscoreales",
    commonName: "Igname blanche",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Youka",
      dioula: "Kou",
      en: "White Yam",
    },
    organs: {
      leaf: {
        shape: "Cordée acuminée en forme de cœur",
        margin: "Entière",
        venation: "Palmatinerve arquée typique",
        arrangement: "Opposées sur tiges épineuses",
        colorTypical: "#1b5e20",
        texture: "Coriace luisante",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "IITA Yam Programme • INERA Fiche Igname Sud-Ouest",
    cycleDaysRange: [180, 240],
    distinctiveFeatures: [
      "Liane grimpante volubile s'enroulant vers la droite (dextrorse)",
      "Grosses tiges portant de petites épines recourbées",
    ],
  },
  {
    id: "moringa",
    scientificName: "Moringa oleifera Lam.",
    scientificNameWithoutAuthor: "Moringa oleifera",
    genus: "Moringa",
    family: "Moringaceae",
    order: "Brassicales",
    commonName: "Moringa / Arbre de vie",
    category: "arbre_agroforestier",
    isWeed: false,
    vernacularNames: {
      moore: "Arzàntiga",
      dioula: "Néverdier",
      fulfulde: "Gawri",
      en: "Moringa / Drumstick Tree",
    },
    organs: {
      leaf: {
        shape: "Tripennée à folioles obovales minuscules",
        margin: "Entière",
        venation: "Pennée délicate",
        arrangement: "Alternes composées plumeuses",
        colorTypical: "#43a047",
        texture: "Tendre comestible très riche en fer et vitamines",
      },
      flower: {
        color: "Blanc crème odorante",
        petalsCount: 5,
        symmetry: "zygomorphe",
        inflorescence: "Panicules axillaires étalées",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "ICRAF Agroforestry • INERA Kamboinsé",
    cycleDaysRange: [60, 365],
    distinctiveFeatures: [
      "Feuilles plumeuses tripennées d'un vert clair très frais",
      "Longues gousses triangulaires pendantes cannelées en forme de baguettes",
    ],
  },
  {
    id: "baobab",
    scientificName: "Adansonia digitata L.",
    scientificNameWithoutAuthor: "Adansonia digitata",
    genus: "Adansonia",
    family: "Malvaceae",
    order: "Malvales",
    commonName: "Baobab africain",
    category: "arbre_agroforestier",
    isWeed: false,
    vernacularNames: {
      moore: "Toéga",
      dioula: "Sira",
      fulfulde: "Boki",
      en: "African Baobab",
    },
    organs: {
      leaf: {
        shape: "Digitée palmée à 5-7 folioles",
        margin: "Entière",
        venation: "Pennée",
        arrangement: "Alternes en bouquets terminaux",
        colorTypical: "#2e7d32",
        texture: "Subcoriace (feuilles consommées en sauce 'Toéga')",
      },
      flower: {
        color: "Blanche cireuse pendante à étamines pourpres",
        petalsCount: 5,
        symmetry: "actinomorphe",
        inflorescence: "Fleur solitaire pendante au bout d'un long pédoncule",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "ICRAF • CIRAD Forêts Sahéliennes",
    cycleDaysRange: [120, 3650],
    distinctiveFeatures: [
      "Tronc pachycaule colossal cylindrique à écorce lisse grise argentée",
      "Fruits ligneux ovoïdes veloutés contenant la pulpe blanche acidulée ('pain de singe')",
    ],
  },
  {
    id: "nere",
    scientificName: "Parkia biglobosa (Jacq.) R.Br. ex G.Don",
    scientificNameWithoutAuthor: "Parkia biglobosa",
    genus: "Parkia",
    family: "Fabaceae",
    order: "Fabales",
    commonName: "Néré / Arbre à soumbala",
    category: "arbre_agroforestier",
    isWeed: false,
    vernacularNames: {
      moore: "Roaonga",
      dioula: "Nèrè",
      fulfulde: "Narehi",
      en: "African Locust Bean",
    },
    organs: {
      leaf: {
        shape: "Bipennée à très nombreuses petites folioles étroites",
        margin: "Entière",
        venation: "Linéaire",
        arrangement: "Alternes plumeuses",
        colorTypical: "#1b5e20",
        texture: "Finement coriace",
      },
      flower: {
        color: "Rouge pourpre vif en pompon sphérique compact",
        symmetry: "actinomorphe",
        inflorescence: "Capitule globuleux pendant caractéristique",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "INERA Dindéresso • CIRAD Mémento de l'Agronome",
    cycleDaysRange: [150, 3650],
    distinctiveFeatures: [
      "Capitules floraux rouges écarlates pendants en forme de massues sphériques",
      "Gousses brunes courbées pendantes contenant graines fermentées pour soumbala et pulpe jaune sucrée",
    ],
  },
  {
    id: "neem",
    scientificName: "Azadirachta indica A.Juss.",
    scientificNameWithoutAuthor: "Azadirachta indica",
    genus: "Azadirachta",
    family: "Meliaceae",
    order: "Sapindales",
    commonName: "Neem / Margousier",
    category: "arbre_agroforestier",
    isWeed: false,
    vernacularNames: {
      moore: "Neem-tiga",
      dioula: "Neem",
      fulfulde: "Ganki",
      en: "Neem Tree",
    },
    organs: {
      leaf: {
        shape: "Imparipennée à folioles falciformes acuminées",
        margin: "Dentée en scie aiguë",
        venation: "Pennée saillante",
        arrangement: "Alternes",
        colorTypical: "#2e7d32",
        texture: "Glabre amère (biopesticide naturel à azadirachtine)",
      },
      flower: {
        color: "Blanc crème très odorante",
        petalsCount: 5,
        symmetry: "actinomorphe",
        inflorescence: "Panicules axillaires retombantes",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "FAO Forestry • INERA Protection des Végétaux",
    cycleDaysRange: [120, 3650],
    distinctiveFeatures: [
      "Folioles falciformes courbées comme une faucille à dents aiguës",
      "Écorce et feuilles très amères réputées comme répulsif phytosanitaire",
    ],
  },
  {
    id: "papayer",
    scientificName: "Carica papaya L.",
    scientificNameWithoutAuthor: "Carica papaya",
    genus: "Carica",
    family: "Caricaceae",
    order: "Brassicales",
    commonName: "Papayer",
    category: "arbre_fruitier",
    isWeed: false,
    vernacularNames: {
      moore: "Pipayu",
      dioula: "Mangaye",
      en: "Papaya",
    },
    organs: {
      leaf: {
        shape: "Palmatilobée géante découpée",
        margin: "Lobée dentée",
        venation: "Palmatinerve creuse",
        arrangement: "Couronne terminale au sommet du stipe",
        colorTypical: "#388e3c",
        texture: "Longs pétioles creux cylindriques",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "CIRAD Fruitiers Tropicaux • INERA Farako-Bâ",
    cycleDaysRange: [240, 365],
    distinctiveFeatures: [
      "Stipe droit non ramifié creux marqué par les cicatrices foliaires",
      "Couronne terminale de très grandes feuilles palmées sur de longs pétioles creux",
    ],
  },
  {
    id: "bananier",
    scientificName: "Musa acuminata Colla",
    scientificNameWithoutAuthor: "Musa acuminata",
    genus: "Musa",
    family: "Musaceae",
    order: "Zingiberales",
    commonName: "Bananier",
    category: "arbre_fruitier",
    isWeed: false,
    vernacularNames: {
      moore: "Bana-tiga",
      dioula: "Namasa",
      en: "Banana",
    },
    organs: {
      leaf: {
        shape: "Oblongue géante à limbe entier",
        margin: "Entière se déchirant au vent",
        venation: "Pennée rectiligne saillante",
        arrangement: "Spiralée formant un pseudo-tronc",
        colorTypical: "#2e7d32",
        texture: "Cireuse épaisse",
      },
    },
    agroEcologicalZones: ["ouest_sud"],
    openDataSource: "FAO EcoCrop • INERA Périmètre Irrigué de Bama",
    cycleDaysRange: [270, 365],
    distinctiveFeatures: [
      "Fausses tiges formées par l'emboîtement des gaines foliaires",
      "Grandes feuilles monumentales souvent effilochées transversalement par le vent",
    ],
  },
  {
    id: "citronnier",
    scientificName: "Citrus limon (L.) Osbeck",
    scientificNameWithoutAuthor: "Citrus limon",
    genus: "Citrus",
    family: "Rutaceae",
    order: "Sapindales",
    commonName: "Citronnier / Limettier",
    category: "arbre_fruitier",
    isWeed: false,
    vernacularNames: {
      moore: "Lembu-karga",
      dioula: "Lemuna",
      en: "Lemon / Lime",
    },
    organs: {
      leaf: {
        shape: "Ovale lancéolée luisante",
        margin: "Finement crénelée",
        venation: "Pennée",
        arrangement: "Alternes",
        colorTypical: "#1b5e20",
        texture: "Coriace ponctuée de glandes d'huiles essentielles",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "CIRAD Agrumes Sahéliens • INERA Orodara",
    cycleDaysRange: [180, 3650],
    distinctiveFeatures: [
      "Feuilles aromatiques dégageant un parfum citronné intense au froissement",
      "Rameaux souvent pourvus d'épines axillaires rigides",
    ],
  },
  {
    id: "pasteque",
    scientificName: "Citrullus lanatus (Thunb.) Matsum. & Nakai",
    scientificNameWithoutAuthor: "Citrullus lanatus",
    genus: "Citrullus",
    family: "Cucurbitaceae",
    order: "Cucurbitales",
    commonName: "Pastèque",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Kaanre",
      dioula: "Pastiki",
      en: "Watermelon",
    },
    organs: {
      leaf: {
        shape: "Pennatilobée profondément découpée à lobes arrondis",
        margin: "Ondulée sinuée",
        venation: "Pennée palmée",
        arrangement: "Alternes rampantes",
        colorTypical: "#2e7d32",
        texture: "Scabre velue rude au toucher",
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "FAO EcoCrop 756 • INERA Kamboinsé",
    cycleDaysRange: [75, 95],
    distinctiveFeatures: [
      "Tiges rampantes à vrilles bifides ramifiées",
      "Feuilles profondément pennatilobées à lobes très arrondis velus",
    ],
  },
  {
    id: "concombre",
    scientificName: "Cucumis sativus L.",
    scientificNameWithoutAuthor: "Cucumis sativus",
    genus: "Cucumis",
    family: "Cucurbitaceae",
    order: "Cucurbitales",
    commonName: "Concombre",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Kokombre",
      dioula: "Kokombri",
      en: "Cucumber",
    },
    organs: {
      leaf: {
        shape: "Trilobée triangulaire cordée à la base",
        margin: "Denticulée épineuse fine",
        venation: "Palmatinerve",
        arrangement: "Alternes grimpantes",
        colorTypical: "#388e3c",
        texture: "Hispide poilue piquante",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "FAO EcoCrop • INERA Maraîchage Périurbain",
    cycleDaysRange: [50, 70],
    distinctiveFeatures: [
      "Feuilles triangulaires à poils rudes hispides",
      "Vrilles simples non ramifiées s'accrochant aux tuteurs",
    ],
  },
  {
    id: "courgette",
    scientificName: "Cucurbita pepo L.",
    scientificNameWithoutAuthor: "Cucurbita pepo",
    genus: "Cucurbita",
    family: "Cucurbitaceae",
    order: "Cucurbitales",
    commonName: "Courgette & Courge maraîchère",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Wèré",
      dioula: "Jé",
      en: "Zucchini / Squash",
    },
    organs: {
      leaf: {
        shape: "Palmatilobée à 5 lobes triangulaires profonds",
        margin: "Dentée",
        venation: "Palmatinerve très saillante",
        arrangement: "Alternes non coureuses ou semi-buissonnantes",
        colorTypical: "#2e7d32",
        texture: "Rude couverte de poils piquants blancs",
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "FAO EcoCrop • INERA",
    cycleDaysRange: [45, 65],
    distinctiveFeatures: [
      "Grandes feuilles souvent marbrées de taches argentées anguleuses",
      "Pétioles creux garnis de poils raides presque épineux",
    ],
  },
  {
    id: "chou",
    scientificName: "Brassica oleracea L. var. capitata",
    scientificNameWithoutAuthor: "Brassica oleracea",
    genus: "Brassica",
    family: "Brassicaceae",
    order: "Brassicales",
    commonName: "Chou cabus pommé",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Shu",
      dioula: "Su",
      en: "Cabbage",
    },
    organs: {
      leaf: {
        shape: "Orbiculaire charnue se chevauchant en pomme dense",
        margin: "Ondulée entière",
        venation: "Pennée à grosse côte centrale blanche",
        arrangement: "Rosette serrée formant une pomme compacte",
        colorTypical: "#4db6ac",
        texture: "Pruineuse glauque vert bleuté recouverte de cire",
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "FAO EcoCrop • INERA Maraîchage",
    cycleDaysRange: [75, 100],
    distinctiveFeatures: [
      "Feuilles épaisses cireuses glauques imperméables à l'eau",
      "Formation d'une pomme sphérique dense au centre de la rosette",
    ],
  },
  {
    id: "carotte",
    scientificName: "Daucus carota L.",
    scientificNameWithoutAuthor: "Daucus carota",
    genus: "Daucus",
    family: "Apiaceae",
    order: "Apiales",
    commonName: "Carotte",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Karote",
      dioula: "Karoti",
      en: "Carrot",
    },
    organs: {
      leaf: {
        shape: "Bi-tripennatiséquée finement découpée en lanières étroites",
        margin: "Dentée en segments fins",
        venation: "Pennée fine",
        arrangement: "Rosette basale dressée",
        colorTypical: "#2e7d32",
        texture: "Légèrement pubescente très aromatique",
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud"],
    openDataSource: "FAO EcoCrop • INERA Maraîchage Loumbila",
    cycleDaysRange: [80, 110],
    distinctiveFeatures: [
      "Feuillage plumeux très finement dentelé en dentelle",
      "Racine pivotante conique tubérisée orange vif",
    ],
  },
  {
    id: "ail",
    scientificName: "Allium sativum L.",
    scientificNameWithoutAuthor: "Allium sativum",
    genus: "Allium",
    family: "Amaryllidaceae",
    order: "Asparagales",
    commonName: "Ail cultivé",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Layé",
      dioula: "Laye",
      en: "Garlic",
    },
    organs: {
      leaf: {
        shape: "Linéaire plate carénée en V",
        margin: "Entière",
        venation: "Parallèle",
        arrangement: "Distiques alternes engainantes",
        colorTypical: "#388e3c",
        texture: "Glabre solide à forte odeur alliacée",
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud"],
    openDataSource: "FAO EcoCrop • INERA",
    cycleDaysRange: [100, 140],
    distinctiveFeatures: [
      "Feuilles plates carénées (contrairement à l'oignon qui a des feuilles creuses cylindriques)",
      "Bulbe composé de caïeux entourés d'une tunique blanche",
    ],
  },
  {
    id: "gingembre",
    scientificName: "Zingiber officinale Roscoe",
    scientificNameWithoutAuthor: "Zingiber officinale",
    genus: "Zingiber",
    family: "Zingiberaceae",
    order: "Zingiberales",
    commonName: "Gingembre",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Yamaku",
      dioula: "Niamaku",
      en: "Ginger",
    },
    organs: {
      leaf: {
        shape: "Lancéolée étroite acuminée",
        margin: "Entière",
        venation: "Parallèle fine",
        arrangement: "Distiques sur fausses tiges",
        colorTypical: "#2e7d32",
        texture: "Glabre très aromatique piquante",
      },
    },
    agroEcologicalZones: ["ouest_sud"],
    openDataSource: "FAO EcoCrop • INERA Orodara",
    cycleDaysRange: [210, 270],
    distinctiveFeatures: [
      "Tiges dressées portant des feuilles étroites distiques vert sombre",
      "Rhizome charnu horizontal tubérisé très odorant et piquant",
    ],
  },
  {
    id: "acacia_senegal",
    scientificName: "Senegalia senegal (L.) Britton (syn. Acacia senegal)",
    scientificNameWithoutAuthor: "Senegalia senegal",
    genus: "Senegalia",
    family: "Fabaceae",
    order: "Fabales",
    commonName: "Gommier blanc / Acacia à gomme arabique",
    category: "arbre_agroforestier",
    isWeed: false,
    vernacularNames: {
      moore: "Gom-tiga",
      dioula: "Gomi",
      fulfulde: "Patuki",
      en: "Gum Arabic Tree",
    },
    organs: {
      leaf: {
        shape: "Bipennée à 3-6 paires de pennes et très petites folioles",
        margin: "Entière",
        venation: "Fine",
        arrangement: "Alternes fasciculées aux nœuds",
        colorTypical: "#558b2f",
        texture: "Subcoriace glauque",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre"],
    openDataSource: "FAO Forestry • INERA Dori Sahel",
    cycleDaysRange: [180, 3650],
    distinctiveFeatures: [
      "Épines disposées par 3 sous chaque nœud : l'épine centrale courbée vers le bas, les deux latérales vers le haut",
      "Exsude la gomme arabique naturelle très recherchée",
    ],
  },
  {
    id: "rottboellia_cochinchinensis",
    scientificName: "Rottboellia cochinchinensis (Lour.) Clayton",
    scientificNameWithoutAuthor: "Rottboellia cochinchinensis",
    genus: "Rottboellia",
    family: "Poaceae",
    order: "Poales",
    commonName: "Herbe piquant / Rottboellia",
    category: "adventice",
    isWeed: true,
    vernacularNames: {
      moore: "Kas-toko",
      dioula: "Bafing-tchi",
      en: "Itch Grass",
    },
    organs: {
      leaf: {
        shape: "Linéaire rubanée longue",
        margin: "Scabre coupante",
        venation: "Parallèle",
        arrangement: "Alternes dressées",
        colorTypical: "#388e3c",
        texture: "Gaines et limbes hérissés de poils raides très piquants et urticants",
      },
      flower: {
        color: "Verdâtre en épi cylindrique articulé",
        symmetry: "actinomorphe",
        inflorescence: "Épis cylindriques articulés se brisant nœud par nœud à maturité",
      },
    },
    agroEcologicalZones: ["centre_sud", "ouest_sud"],
    openDataSource: "CABI CPC • CIRAD Malherbologie • INERA Farako-Bâ",
    cycleDaysRange: [45, 90],
    distinctiveFeatures: [
      "Poils siliceux raides transparents sur la gaine provoquant d'intenses démangeaisons",
      "Épi floral cylindrique articulé rigide se fragmentant spontanément en petits segments",
      "Adventice majeure très agressive dans le maïs et le coton",
    ],
  },
  {
    id: "amaranthus_spinosus",
    scientificName: "Amaranthus spinosus L.",
    scientificNameWithoutAuthor: "Amaranthus spinosus",
    genus: "Amaranthus",
    family: "Amaranthaceae",
    order: "Caryophyllales",
    commonName: "Amarante épineuse",
    category: "adventice",
    isWeed: true,
    vernacularNames: {
      moore: "Boroboro-goa",
      dioula: "Boron-nin-sonron",
      en: "Spiny Amaranth",
    },
    organs: {
      leaf: {
        shape: "Ovale lancéolée à marge ondulée",
        margin: "Entière à ondulée",
        venation: "Pennée saillante",
        arrangement: "Alternes",
        colorTypical: "#2e7d32",
        texture: "Glabre portant 2 épines rigides aiguës à la base de chaque pétiole",
      },
      flower: {
        color: "Verdâtre en glomérules denses épineux",
        symmetry: "actinomorphe",
        inflorescence: "Épis denses terminaux et axillaires piquants",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "EPPO Global Database • CIRAD Malherbologie",
    cycleDaysRange: [30, 75],
    distinctiveFeatures: [
      "Deux épines très acérées longues de 0.5 à 1.5 cm à l'aisselle de chaque feuille",
      "Adventice des bas-fonds et décharges hautement compétitive",
    ],
  },
  {
    id: "portulaca_oleracea",
    scientificName: "Portulaca oleracea L.",
    scientificNameWithoutAuthor: "Portulaca oleracea",
    genus: "Portulaca",
    family: "Portulacaceae",
    order: "Caryophyllales",
    commonName: "Pourpier maraîcher",
    category: "adventice",
    isWeed: true,
    vernacularNames: {
      moore: "Nambooré",
      dioula: "Misikolo",
      en: "Purslane",
    },
    organs: {
      leaf: {
        shape: "Spatulée obovale charnue sans pétiole",
        margin: "Entière lisse",
        venation: "Peu visible succulente",
        arrangement: "Opposées ou subverticillées au sommet des tiges",
        colorTypical: "#388e3c",
        texture: "Succulente charnue gorgée d'eau",
      },
      flower: {
        color: "Jaune vif miniature",
        petalsCount: 5,
        symmetry: "actinomorphe",
        inflorescence: "Fleurs sessiles solitaires ou en glomérules terminaux",
      },
    },
    agroEcologicalZones: ["sahel", "nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "EPPO • FAO EcoCrop",
    cycleDaysRange: [25, 50],
    distinctiveFeatures: [
      "Tiges rampantes charnues rougeâtres gorgées de suc",
      "Feuilles grasses succulentes vert brillant très résistantes au dessèchement",
    ],
  },
  {
    id: "dolique",
    scientificName: "Lablab purpureus (L.) Sweet",
    scientificNameWithoutAuthor: "Lablab purpureus",
    genus: "Lablab",
    family: "Fabaceae",
    order: "Fabales",
    commonName: "Dolique lablab / Haricot jacinthe",
    category: "culture",
    isWeed: false,
    vernacularNames: {
      moore: "Beng-kamba",
      dioula: "Soso-ba",
      en: "Hyacinth Bean / Lablab",
    },
    organs: {
      leaf: {
        shape: "Trifoliée à folioles larges rhomboïdales",
        margin: "Entière",
        venation: "Pennée réticulée",
        arrangement: "Alternes vigoureuses",
        colorTypical: "#1b5e20",
        texture: "Glabre à légèrement pubescente",
      },
      flower: {
        color: "Violet pourpre vif ou blanche",
        petalsCount: 5,
        symmetry: "zygomorphe",
        inflorescence: "Longs racèmes dressés au-dessus du feuillage",
      },
    },
    agroEcologicalZones: ["nord_centre", "centre_sud", "ouest_sud"],
    openDataSource: "FAO EcoCrop • INERA Recherches Fourragères",
    cycleDaysRange: [80, 130],
    distinctiveFeatures: [
      "Légumineuse fourragère grimpante à port très vigoureux couvrant le sol",
      "Gousses aplaties larges violacées ou vertes à hile blanc saillant sur la graine",
    ],
  },
];

/**
 * Recherche une espèce dans la base botanique NAFA par nom scientifique ou nom commun
 */
export function findNafaBotanicalSpecies(query: string): NafaBotanicalSpecies | null {
  if (!query || query.trim().length === 0) return null;
  const clean = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // 1. Recherche par ID exact
  const byId = NAFA_BOTANICAL_CATALOG.find((s) => s.id === clean);
  if (byId) return byId;

  // 2. Recherche par nom scientifique ou nom sans auteur
  const bySci = NAFA_BOTANICAL_CATALOG.find(
    (s) =>
      s.scientificNameWithoutAuthor.toLowerCase().includes(clean) ||
      clean.includes(s.scientificNameWithoutAuthor.toLowerCase())
  );
  if (bySci) return bySci;

  // 3. Recherche par nom commun français
  const byCommon = NAFA_BOTANICAL_CATALOG.find(
    (s) =>
      s.commonName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(clean) ||
      clean.includes(s.commonName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  );
  if (byCommon) return byCommon;

  // 4. Recherche par noms vernaculaires (Mooré, Dioula, Fulfulde)
  const byLocal = NAFA_BOTANICAL_CATALOG.find((s) => {
    return Object.values(s.vernacularNames).some(
      (v) =>
        v &&
        v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(clean)
    );
  });
  if (byLocal) return byLocal;

  return null;
}

/**
 * Statistiques officielles de la Base Botanique Propriétaire NAFA-AGRITECH
 */
export function getNafaBotanicalDatabaseStats() {
  const total = NAFA_BOTANICAL_CATALOG.length;
  const crops = NAFA_BOTANICAL_CATALOG.filter((s) => !s.isWeed).length;
  const weeds = NAFA_BOTANICAL_CATALOG.filter((s) => s.isWeed).length;
  const families = Array.from(new Set(NAFA_BOTANICAL_CATALOG.map((s) => s.family))).length;

  return {
    totalSpecies: total,
    cropsCount: crops,
    weedsCount: weeds,
    familiesCount: families,
    scientificStandards: [
      "INERA Farako-Bâ & Kamboinsé (Burkina Faso)",
      "FAO EcoCrop (Agronomie Sahélienne)",
      "CIRAD Mémento de l'Agronome",
      "GBIF & EPPO Global Taxonomy",
      "PlantVillage Open Access Baseline",
    ],
    isAutonomous: true,
    externalApiRequired: false,
    version: "2026.1-SAHEL-OPEN-DATA",
  };
}

/**
 * Dépôts scientifiques ouverts officiels référencés
 */
export const OPEN_DATA_REPOSITORIES = {
  inera: {
    institution: "Institut de l'Environnement et de Recherches Agricoles (INERA Burkina Faso)",
    stations: ["Farako-Bâ (Bobo-Dioulasso)", "Kamboinsé (Ouagadougou)", "Saria (Koudougou)"],
    license: "Open Data Public Research • Ministère de l'Enseignement Supérieur et de l'Innovation",
  },
  fao_ecocrop: {
    institution: "Food and Agriculture Organization (FAO)",
    database: "EcoCrop Crop Environmental Requirements Database",
    license: "CC-BY-IGO Open Data",
  },
  cirad: {
    institution: "CIRAD & Agritrop Open Science Repository",
    reference: "Mémento de l'Agronome Sahélien & CIRAD Malherbologie Tropicale",
    license: "Open Science Publication",
  },
  gbif: {
    institution: "Global Biodiversity Information Facility (GBIF)",
    database: "GBIF Backbone Taxonomy (Burkina Faso Checklists)",
    license: "CC0 / CC-BY 4.0",
  },
  plantvillage: {
    institution: "Penn State University & EPFL",
    database: "PlantVillage Open Foliar Pathology Dataset",
    openBaseline: true,
    license: "Open Access Research",
  },
  eppo: {
    institution: "European and Mediterranean Plant Protection Organization (EPPO)",
    database: "EPPO Global Database of Plant Pests and Weeds",
    license: "Open Regulatory Data",
  },
};

/**
 * Récupère tous les taxons de cultures (vivrières, rente, fruitiers, agroforesterie)
 */
export function getNafaCropTaxa(): NafaBotanicalSpecies[] {
  return NAFA_BOTANICAL_CATALOG.filter((s) => !s.isWeed);
}

/**
 * Récupère tous les taxons d'adventices (mauvaises herbes, parasites)
 */
export function getNafaWeedTaxa(): NafaBotanicalSpecies[] {
  return NAFA_BOTANICAL_CATALOG.filter((s) => s.isWeed);
}

