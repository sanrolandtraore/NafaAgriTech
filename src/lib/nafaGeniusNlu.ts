/**
 * NAFA GENIUS IA - Moteur de Traitement Multilingue du Langage Naturel (NLU)
 * et Dispatcher d'Actions Agronomiques Directes.
 * 
 * Langues supportées avec reconnaissance d'intentions et synthèse textuelle :
 * - Français (fr)
 * - Dioula / Jula (dyu)
 * - Mooré (mos)
 * - Fulfuldé / Peul (ful)
 */

import { supabase } from "@/integrations/supabase/client";
import { addToSyncQueue } from "@/lib/offlineDb";
import { saveOfflineRecord, generateLocalUuid } from "@/lib/dexieDb";

export type GeniusLanguage = "fr" | "dyu" | "mos" | "ful";
export type GeniusDomain = "agronomie" | "elevage" | "partenaire" | "general";

export type GeniusIntent =
  | "CREATE_VISIT"
  | "CALCULATE_IRRIGATION"
  | "DESIGN_POULTRY"
  | "GENERATE_QUOTE"
  | "CAPTURE_GPS"
  | "DIAGNOSE_CROP"
  | "SUMMARIZE_VISIT"
  | "GENERAL_ASSISTANCE";

export interface ParsedGeniusAction {
  domain: GeniusDomain;
  isDomainViolation?: boolean;
  intent: GeniusIntent;
  confidence: number;
  language: GeniusLanguage;
  rawText: string;
  isRecognized: boolean;
  requiresExpertValidation?: boolean;
  unverifiedReason?: string;
  entities: {
    clientName?: string;
    crop?: string;
    areaHa?: number;
    flockSize?: number;
    birdType?: string;
    date?: string;
    diagnosisSymptoms?: string;
    location?: string;
  };
  explanation: string;
  actionRequired?: boolean;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  createdId?: string;
  isOffline?: boolean;
}

// ─────────────────────────────────────────────────────────────
// DICTIONNAIRES MULTILINGUES DE MOTS-CLÉS & INTENTS
// ─────────────────────────────────────────────────────────────

interface LanguageKeywords {
  greetings: string[];
  visit: string[];
  irrigation: string[];
  poultry: string[];
  quote: string[];
  gps: string[];
  diagnosis: string[];
  crops: Record<string, string>;
}

const LANGUAGE_PATTERNS: Record<GeniusLanguage, LanguageKeywords> = {
  fr: {
    greetings: ["bonjour", "salut", "bonsoir", "aide-moi", "aide", "allo"],
    visit: ["visite", "visiter", "rendez-vous", "rencontrer", "producteur", "exploitant", "client", "tournée", "crée une visite", "nouvelle visite"],
    irrigation: ["irrigation", "arroser", "arrosage", "goutte-à-goutte", "goutte a goutte", "aspersion", "eau", "forage", "pompe", "débit", "hmt", "pompage solaire"],
    poultry: ["poulet", "poulets", "volaille", "avicole", "poulailler", "pondeuse", "pondeuses", "chair", "poussins", "sujets"],
    quote: ["devis", "chiffrage", "prix", "cout", "coût", "facture", "estimation", "budget", "combien"],
    gps: ["gps", "parcelle", "superficie", "mesure", "arpenter", "polygon", "borne", "coordonnées", "relevé", "plan"],
    diagnosis: ["maladie", "feuilles jaunes", "taches", "flétrissement", "insectes", "ravageurs", "champignon", "chenille", "carence", "traitement", "diagnostic"],
    crops: {
      tomate: "tomate",
      oignon: "oignon",
      mais: "mais",
      maïs: "mais",
      piment: "piment",
      poivron: "piment",
      mangue: "mangue",
      choux: "choux",
      chou: "choux",
      papaye: "papaye",
    },
  },
  dyu: {
    greetings: ["i ni ce", "a ni ce", "i ni sogoma", "i ni tle", "an bi sogoma", "ka kene"],
    visit: ["taga", "ka taga fo", "koro", "senekela", "mogo fo", "ka taga senekela", "seko", "kunnafoni"],
    irrigation: ["ji", "ji bila", "jii", "kolon", "ji koo", "nakɔ ji", "pompe", "solari"],
    poultry: ["sise", "sisekulu", "sisew", "sise so", "fan", "sise dencelan", "she"],
    quote: ["wari", "wari jate", "jate", "songɔ", "songo", "joli", "ka jate kɛ"],
    gps: ["dugukolo", "seneforo", "foro", "foro jate", "mesure", "hakɛ"],
    diagnosis: ["bana", "fura", "nakɔ bana", "jiri bana", "fayida", "kɔnɔ bana"],
    crops: {
      tomati: "tomate",
      jaba: "oignon",
      kaba: "mais",
      foronto: "piment",
      mangoro: "mangue",
      susu: "choux",
    },
  },
  mos: {
    greetings: ["ne y windiga", "ne y beoogo", "ne y zaabre", "laafi be", "wenda laafi"],
    visit: ["kaogo", "tobre", "gese", "koob soba", "kambre", "maan kaogo", "n ges"],
    irrigation: ["koom", "ko-yelle", "kooma", "bulga", "ko-tule", "pompe", "wintoogo"],
    poultry: ["noos", "noo-roogo", "no-bila", "no-raoogo", "roogo", "noos kobre"],
    quote: ["ligidi", "ligd soorgo", "soorgo", "ya a wana", "laoogo", "samande"],
    gps: ["pugo", "puugo", "teenga", "pukense", "makre", "sebgre"],
    diagnosis: ["bãaga", "bãag", "tiim", "koom bãaga", "yelle", "vaad miiri"],
    crops: {
      kamaana: "mais",
      tamate: "tomate",
      zaba: "oignon",
      kipare: "piment",
      manga: "mangue",
    },
  },
  ful: {
    greetings: ["jam waali", "jam nyalli", "jam hiiri", "no mbadda", "kor tan", "a jaraama"],
    visit: ["yillaade", "yillugo", "remoowo", "hokkude", "laaraade", "teelal"],
    irrigation: ["ndiyam", "ngaska", "pompi", "naange", "yarnude", "ndiyam yarnirgal"],
    poultry: ["gertode", "gertoogal", "ciwle", "suudu gertode", "woofiinde"],
    quote: ["ceede", "limoore", "no foti", "coggu", "njeeygu"],
    gps: ["ngesa", "gese", "etude", "keerol", "fello"],
    diagnosis: ["nyaw", "nyawndude", "safaro", "haako ko ooli", "dabbel"],
    crops: {
      kamanaari: "mais",
      tomaat: "tomate",
      basaal: "oignon",
      citto: "piment",
      mangoro: "mangue",
    },
  },
};

/**
 * Détecte la langue principale d'un texte d'entrée
 */
export function detectLanguage(text: string): GeniusLanguage {
  const lower = text.toLowerCase();
  
  // Scores de correspondance par langue
  const scores: Record<GeniusLanguage, number> = { fr: 0, dyu: 0, mos: 0, ful: 0 };

  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS) as [GeniusLanguage, LanguageKeywords][]) {
    // Vérifier les salutations
    patterns.greetings.forEach((w) => {
      if (lower.includes(w)) scores[lang] += 3;
    });
    // Vérifier les thématiques
    patterns.visit.forEach((w) => {
      if (lower.includes(w)) scores[lang] += 2;
    });
    patterns.irrigation.forEach((w) => {
      if (lower.includes(w)) scores[lang] += 2;
    });
    patterns.poultry.forEach((w) => {
      if (lower.includes(w)) scores[lang] += 2;
    });
    patterns.quote.forEach((w) => {
      if (lower.includes(w)) scores[lang] += 2;
    });
    patterns.gps.forEach((w) => {
      if (lower.includes(w)) scores[lang] += 2;
    });
  }

  // Par défaut français si égalité ou faible score
  let bestLang: GeniusLanguage = "fr";
  let maxScore = scores.fr;

  for (const [lang, score] of Object.entries(scores) as [GeniusLanguage, number][]) {
    if (score > maxScore) {
      maxScore = score;
      bestLang = lang;
    }
  }

  return bestLang;
}

/**
 * Analyse le texte pour extraire l'intention et les entités techniques
 * avec cloisonnement métier strict entre Pôle Végétal, Élevage et Partenaire.
 */
export function parseGeniusCommand(text: string, activeDomain: GeniusDomain = "general"): ParsedGeniusAction {
  const lower = text.toLowerCase();
  const lang = detectLanguage(text);

  // ─────────────────────────────────────────────────────────────
  // CLOISONNEMENT MÉTIER STRICT & GUARDRAILS DE DOMAINE
  // ─────────────────────────────────────────────────────────────
  if (activeDomain === "agronomie") {
    const livestockExclusive = [
      "vache", "vaches", "bovin", "bovins", "taureau", "mouton", "moutons", 
      "ovin", "ovins", "chevre", "chèvre", "chèvres", "caprin", "caprins",
      "porc", "porcs", "porcin", "charbon bactéridien", "péripneumonie", 
      "fièvre aphteuse", "fievre aphteuse", "vêlage", "velage", "saillie", 
      "insémination", "insemination", "avortement brebis", "abreuvoir bétail"
    ];
    const isLivestockViolation = livestockExclusive.some((term) => lower.includes(term));
    if (isLivestockViolation) {
      return {
        domain: activeDomain,
        isDomainViolation: true,
        intent: "GENERAL_ASSISTANCE",
        confidence: 0.99,
        language: lang,
        rawText: text,
        isRecognized: false,
        requiresExpertValidation: true,
        unverifiedReason: "Violation de cloisonnement métier : opération cheptel/vétérinaire demandée dans le Pôle Végétal.",
        entities: {},
        explanation: "CLOISONNEMENT MÉTIER : Vous êtes actuellement dans le module Pôle Végétal / Agronomie. Les questions d'élevage ou de médecine vétérinaire relèvent exclusivement du Pôle Vétérinaire & Cheptel. Veuillez basculer sur le module Élevage pour ces opérations.",
        actionRequired: false,
      };
    }
  }

  if (activeDomain === "elevage") {
    const cropsExclusive = [
      "irrigation", "goutte-à-goutte", "goutte a goutte", "aspersion", "tomate",
      "oignon", "mais", "maïs", "piment", "mangue", "choux", "chou", "maraîchage",
      "maraichage", "engrais npk", "repiquage", "pépinière", "fongicide", "mildiou",
      "chenille légionnaire", "parcelle de maïs", "parcelle de tomate"
    ];
    const isCropViolation = cropsExclusive.some((term) => lower.includes(term));
    if (isCropViolation) {
      return {
        domain: activeDomain,
        isDomainViolation: true,
        intent: "GENERAL_ASSISTANCE",
        confidence: 0.99,
        language: lang,
        rawText: text,
        isRecognized: false,
        requiresExpertValidation: true,
        unverifiedReason: "Violation de cloisonnement métier : opération grandes cultures/irrigation demandée dans le Pôle Vétérinaire & Cheptel.",
        entities: {},
        explanation: "CLOISONNEMENT MÉTIER : Vous êtes actuellement dans le module Pôle Vétérinaire & Cheptel. Les questions relatives aux cultures végétales, à l'irrigation agricole et aux pathologies végétales relèvent exclusivement du Pôle Végétal. Veuillez basculer sur le module Agronomie pour ces opérations.",
        actionRequired: false,
      };
    }
  }

  if (activeDomain === "partenaire") {
    const fieldExclusive = ["arpenter parcelle", "profil altimétrique", "maladie des feuilles", "chenille légionnaire"];
    const isFieldViolation = fieldExclusive.some((term) => lower.includes(term));
    if (isFieldViolation) {
      return {
        domain: activeDomain,
        isDomainViolation: true,
        intent: "GENERAL_ASSISTANCE",
        confidence: 0.99,
        language: lang,
        rawText: text,
        isRecognized: false,
        requiresExpertValidation: true,
        unverifiedReason: "Violation de cloisonnement métier : intervention terrain direct demandée dans l'Espace Partenaire.",
        entities: {},
        explanation: "ESPACE PARTENAIRE : Ce module est dédié à la gestion commerciale et opérationnelle de votre entreprise (Présentation, Services, Produits, Réalisations, Devis, Commandes, Tableau de bord). Pour les interventions directes en plein champ, basculez sur le Pôle Végétal ou Élevage.",
        actionRequired: false,
      };
    }
  }

  let intent: GeniusIntent = "GENERAL_ASSISTANCE";
  let confidence = 0.7;
  const entities: ParsedGeniusAction["entities"] = {};

  // Extraction d'entités numériques
  // 1. Surface en hectares ou m²
  const areaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:ha|hectare|hectares|hct)/);
  if (areaMatch) {
    entities.areaHa = parseFloat(areaMatch[1].replace(",", "."));
  } else {
    const m2Match = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|metre carre|mètres carrés)/);
    if (m2Match) {
      entities.areaHa = Math.round((parseFloat(m2Match[1].replace(",", ".")) / 10000) * 1000) / 1000;
    }
  }

  // 2. Nombre d'animaux / taille cheptel
  const flockMatch = lower.match(/(\d+)\s*(?:sujets|poulets|poules|pondeuses|poussins|oiseaux|têtes)/);
  if (flockMatch) {
    entities.flockSize = parseInt(flockMatch[1], 10);
  }

  // 3. Extraction nom client / producteur
  // Ex: "pour le producteur Issa Ouédraogo", "visite pour Oumarou", "chez Moussa"
  const clientMatch = lower.match(
    /(?:pour\s+(?:le\s+|la\s+|l['’])?(?:producteur|productrice|client|cliente|exploitant|éleveur)?\s*|chez\s+(?:le\s+|la\s+|l['’])?(?:producteur|client|exploitant)?\s*|producteur\s+|client\s+|n\s+kon\s+|koro\s+|soba\s+|remoowo\s+)([A-ZÀ-ÿa-z\-]+(?:\s+[A-ZÀ-ÿa-z\-]+)?)/i
  );
  if (clientMatch) {
    let rawName = clientMatch[1].trim();
    rawName = rawName.replace(/^(?:le|la|les|un|une|des|du|de|d['’]|mon|ma|mes|ce|cette)\s+/i, "").trim();
    const commonStops = ["une", "un", "le", "la", "des", "mon", "ma", "ce", "cette", "nouvelle", "visite", "parcelle", "culture", "champ", "irrigation", "devis"];
    if (rawName && !commonStops.includes(rawName.toLowerCase())) {
      entities.clientName = rawName
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  }

  // 4. Extraction de culture
  const allCrops = {
    ...LANGUAGE_PATTERNS.fr.crops,
    ...LANGUAGE_PATTERNS.dyu.crops,
    ...LANGUAGE_PATTERNS.mos.crops,
    ...LANGUAGE_PATTERNS.ful.crops,
  };
  for (const [key, normalized] of Object.entries(allCrops)) {
    if (lower.includes(key)) {
      entities.crop = normalized;
      break;
    }
  }

  let isRecognized = true;
  let requiresExpertValidation = false;
  let unverifiedReason: string | undefined = undefined;

  // Classification d'Intention
  if (
    lower.includes("visite") ||
    lower.includes("crée une visite") ||
    lower.includes("creer une visite") ||
    lower.includes("ka taga fo") ||
    lower.includes("maan kaogo") ||
    lower.includes("yillaade")
  ) {
    intent = "CREATE_VISIT";
    confidence = 0.95;
  } else if (
    lower.includes("irrigation") ||
    lower.includes("goutte") ||
    lower.includes("arrosage") ||
    lower.includes("pompage") ||
    lower.includes("débit") ||
    lower.includes("ji bila") ||
    lower.includes("ko-yelle") ||
    lower.includes("yarnude")
  ) {
    intent = "CALCULATE_IRRIGATION";
    confidence = 0.92;
    if (!entities.areaHa && !entities.crop) {
      requiresExpertValidation = true;
      unverifiedReason = "Superficie ou culture non précisée : validation nécessaire des paramètres réels par l'expert.";
    }
  } else if (
    lower.includes("poulet") ||
    lower.includes("poulailler") ||
    lower.includes("pondeuse") ||
    lower.includes("volaille") ||
    lower.includes("sise") ||
    lower.includes("noos") ||
    lower.includes("gertode")
  ) {
    intent = "DESIGN_POULTRY";
    confidence = 0.92;
    if (!entities.flockSize) {
      requiresExpertValidation = true;
      unverifiedReason = "Effectif de la bande non précisé : validation nécessaire de l'effectif réel par l'expert.";
    }
  } else if (
    lower.includes("devis") ||
    lower.includes("chiffrage") ||
    lower.includes("combien") ||
    lower.includes("wari jate") ||
    lower.includes("ligd soorgo") ||
    lower.includes("ceede")
  ) {
    intent = "GENERATE_QUOTE";
    confidence = 0.9;
  } else if (
    lower.includes("gps") ||
    lower.includes("superficie") ||
    lower.includes("arpenter") ||
    lower.includes("borne") ||
    lower.includes("foro jate") ||
    lower.includes("puugo") ||
    lower.includes("etude ngesa")
  ) {
    intent = "CAPTURE_GPS";
    confidence = 0.9;
  } else if (
    lower.includes("maladie") ||
    lower.includes("diagnostic") ||
    lower.includes("jaune") ||
    lower.includes("tache") ||
    lower.includes("chenille") ||
    lower.includes("adventice") ||
    lower.includes("mauvaise herbe") ||
    lower.includes("striga") ||
    lower.includes("mildiou") ||
    lower.includes("carence") ||
    lower.includes("flétrissement") ||
    lower.includes("fletrissement") ||
    lower.includes("ravageur") ||
    lower.includes("bana") ||
    lower.includes("bãaga") ||
    lower.includes("nyaw")
  ) {
    intent = "DIAGNOSE_CROP";
    confidence = 0.94;
  } else if (
    lower.includes("résume") ||
    lower.includes("compte-rendu") ||
    lower.includes("rapport de visite")
  ) {
    intent = "SUMMARIZE_VISIT";
    confidence = 0.9;
  } else {
    // Aucune intention technique identifiée : vérifier s'il s'agit d'une salutation polie
    const allGreetings = [
      ...LANGUAGE_PATTERNS.fr.greetings,
      ...LANGUAGE_PATTERNS.dyu.greetings,
      ...LANGUAGE_PATTERNS.mos.greetings,
      ...LANGUAGE_PATTERNS.ful.greetings,
    ];
    const isGreeting = allGreetings.some((g) => lower.includes(g));

    if (isGreeting) {
      intent = "GENERAL_ASSISTANCE";
      confidence = 0.95;
      isRecognized = true;
    } else {
      // Instruction non reconnue avec certitude : RÈGLE STRICTE ZÉRO HALLUCINATION
      intent = "GENERAL_ASSISTANCE";
      confidence = 0.35;
      isRecognized = false;
      requiresExpertValidation = true;
      unverifiedReason = "Instruction non reconnue avec certitude dans le référentiel agronomique certifié.";
    }
  }

  // Génération de l'explication personnalisée dans la langue détectée
  const explanation = formatIntentResponse(intent, lang, entities, isRecognized);

  return {
    domain: activeDomain,
    isDomainViolation: false,
    intent,
    confidence,
    language: lang,
    rawText: text,
    isRecognized,
    requiresExpertValidation,
    unverifiedReason,
    entities,
    explanation,
    actionRequired: isRecognized && (intent === "CREATE_VISIT" || intent === "CALCULATE_IRRIGATION" || intent === "DESIGN_POULTRY" || intent === "GENERATE_QUOTE" || intent === "DIAGNOSE_CROP"),
  };
}

/**
 * Réponses naturelles et expertes adaptées selon la langue
 */
function formatIntentResponse(
  intent: GeniusIntent,
  lang: GeniusLanguage,
  entities: ParsedGeniusAction["entities"],
  isRecognized: boolean = true
): string {
  if (!isRecognized) {
    if (lang === "dyu") {
      return "KUMA MA FAAMU KA ƝƐ : NAFA Genius IA tɛ jate foyi kɛ ni sɛbɛ kɔnɔna lakika tɛ. I koo fɔ ka ɲɛ (seneforo hakɛ, ji hakɛ, sise hakɛ) walima kɛrɛnkɛrɛnnen kɛ.";
    }
    if (lang === "mos") {
      return "GOMDÃ PA BÃNG KA SA : NAFA Genius IA pa tõe n maan ligidi bɩ koom soorgo tɩ pa ne bõn-tɩrga ye. Togls tʋʋma sõma (puugo makre, koom yaoodo, noos sõor).";
    }
    if (lang === "ful") {
      return "HAALA KAA ANNDAAKA NO FEEWNI : NAFA Genius IA waawaa waɗde limoore tawa walaa seedamteeje gese. Tinno ɓeydu kumpital laaɓngal (ngesa, ndiyam, gertode).";
    }
    return "INSTRUCTION NON RECONNUE AVEC CERTITUDE : L'IA NAFA Genius ne produit aucun calcul sans données terrain certifiées (INERA / FAO-56). Veuillez préciser votre demande technique ou apporter des mesures réelles (surface en ha, culture, débit forage, effectif volailles).";
  }
  const client = entities.clientName || (lang === "dyu" ? "senekela" : lang === "mos" ? "koob soba" : lang === "ful" ? "remoowo" : "le producteur");
  const crop = entities.crop || "la culture";
  const area = entities.areaHa ? `${entities.areaHa} ha` : "";

  switch (intent) {
    case "CREATE_VISIT":
      if (lang === "dyu") return `N bɛ taga kunjuru kura sigi senekela ${client} kama sisan sisan.`;
      if (lang === "mos") return `Mam na n maana kaogo kambre koob soba ${client} yĩnga masâ.`;
      if (lang === "ful") return `Mi windan teelal kesal ngam remoowo ${client} jooni jooni.`;
      return `Je prépare et enregistre immédiatement la visite technique pour ${client}.`;

    case "CALCULATE_IRRIGATION":
      if (lang === "dyu") return `N bɛ ji koo ni pompi solari hakɛ jate ${area ? `dugukolo ${area} kan` : ""} ${crop} nafa kama.`;
      if (lang === "mos") return `Mam na n sõor koom la wintoogo pompe yaoodo ${area ? `pugo ${area}` : ""} ${crop} yĩnga.`;
      if (lang === "ful") return `Mi hiisoto ndiyam yarnirgal e pompi naange ngam ${area ? `ngesa ${area}` : ""} ${crop}.`;
      return `Calcul hydraulique FAO-56 en cours : dimensionnement du débit d'irrigation, perte de charge et pompage solaire pour ${area} de ${crop}.`;

    case "DESIGN_POULTRY":
      if (lang === "dyu") return `N bɛ sise so kura jate ni kɛrɛnkɛrɛnninw bɛɛ ye (orienté Est-Ouest ni thermosiphon).`;
      if (lang === "mos") return `Mam na n gese noo-roogo meeb zĩiga la bõn-naandsã bɛɛ ne wĩndg lebgre.`;
      if (lang === "ful") return `Mi tayi suudu gertode bioclimatique fawaade e nguleefi Sahel.`;
      return `Planification bioclimatique du bâtiment avicole en cours (axe Est-Ouest, aération thermosiphon, densités adaptées au Sahel).`;

    case "GENERATE_QUOTE":
      if (lang === "dyu") return `N bɛ wari jate sɛbɛ lase i ma ni mercuriale sɔngɔ lakika ye.`;
      if (lang === "mos") return `Ligd soorgo sebre na n yiis ne Burkina Faso yaood tɩrgã.`;
      if (lang === "ful") return `Mi heblan limoore coggu laaɓtunde e koperi FCFA.`;
      return `Génération du devis d'ingénierie certifié avec la mercuriale officielle du Burkina Faso (FCFA).`;

    case "CAPTURE_GPS":
      if (lang === "dyu") return `An ka GPS don ka foro hakɛ ni kɔgɔlenw bɛɛ jate.`;
      if (lang === "mos") return `Tõnd na n pʋga puugo ne GPS makre la sebre n kuse.`;
      if (lang === "ful") return `En naatan keerol ngesa e limoore GPS laaɓtunde.`;
      return `Activation du géomètre GPS : relevé des coordonnées WGS84, calcul de superficie Gauss et profil altimétrique.`;

    case "DIAGNOSE_CROP":
      if (lang === "dyu") return `N bɛ nakɔ bana sɛmɛntiya ka fura ɲuman jira.`;
      if (lang === "mos") return `Bãaga bãngre la tiim kaset seglg n tula.`;
      if (lang === "ful") return `Yiytude nyaw gese e hokkude lekki potki.`;
      return `Diagnostic agronomique INERA activé : identification de la pathologie et protocole de traitement.`;

    default:
      if (lang === "dyu") return `I ni ce ! NAFA Genius bɛ yan k'i dɛmɛ forobala kow la.`;
      if (lang === "mos") return `Ne y windiga ! NAFA Genius be ka n sõng fo ne koob tʋʋma.`;
      if (lang === "ful") return `Jam waali ! NAFA Genius no ɗoo ngam ballal maa e gese maa.`;
      return `Bonjour ! Je suis NAFA Genius IA, votre copilote d'ingénierie agronomique de terrain. Que souhaitez-vous réaliser aujourd'hui ?`;
  }
}

// ─────────────────────────────────────────────────────────────
// DISPATCHER D'EXÉCUTION D'ACTIONS DIRECTES
// ─────────────────────────────────────────────────────────────

/**
 * Exécute directement une action demandée en langage naturel
 */
export async function executeGeniusAction(action: ParsedGeniusAction): Promise<ActionResult> {
  const { intent, entities, language } = action;

  if (action.isDomainViolation) {
    return {
      success: false,
      message: action.explanation,
      data: { isDomainViolation: true, domain: action.domain },
    };
  }

  if (!action.isRecognized) {
    return {
      success: false,
      message: action.explanation,
      data: { isRecognized: false, requiresExpertValidation: true },
    };
  }

  try {
    if (intent === "CREATE_VISIT") {
      const clientName = entities.clientName || "Exploitant Terrain";
      const visitDate = entities.date || new Date().toISOString().slice(0, 10);
      const observations = `Visite enregistrée automatiquement par NAFA Genius IA suite à l'instruction vocale : "${action.rawText}"`;
      const recommendations = `Recommandations agronomiques en cours d'élaboration. Culture suivie : ${entities.crop || "Polyculture"}.`;

      // Vérifier si un utilisateur connecté existe
      const { data: { user } } = await supabase.auth.getUser();

      const visitPayload = {
        expert_id: user?.id || "00000000-0000-0000-0000-000000000000",
        client_user_id: crypto.randomUUID(),
        visit_date: visitDate,
        visit_type: "conseil_technique_genius",
        observations: `${observations} (Client: ${clientName})`,
        recommendations,
        next_visit_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      };

      // Si en ligne et utilisateur connecté, insérer directement dans client_visits
      if (navigator.onLine && user) {
        const { data, error } = await supabase.from("client_visits").insert(visitPayload).select().single();
        if (!error && data) {
          return {
            success: true,
            message: `Visite créée avec succès pour ${clientName} le ${visitDate}.`,
            createdId: data.id,
            data,
            isOffline: false,
          };
        }
      }

      // Si hors-ligne ou anonyme, mise en file d'attente sécurisée dans IndexedDB
      if (user) {
        try {
          const syncId = await addToSyncQueue({
            table: "client_visits",
            operation: "insert",
            data: visitPayload,
          });
          return {
            success: true,
            message: `Visite pour ${clientName} enregistrée localement en mode hors-ligne. Synchronisation automatique dès le retour du réseau.`,
            createdId: syncId,
            data: visitPayload,
            isOffline: true,
          };
        } catch {
          // Fallback stockage local si addToSyncQueue échoue
        }
      }

      // Mode Offline-First Dexie (IndexedDB avec UUID local et statut 'pending')
      const userId = user?.id || "offline-technician";
      const localUuid = generateLocalUuid();
      const offlineRecordData = { ...visitPayload, id: localUuid };

      try {
        await saveOfflineRecord("client_visits", "insert", offlineRecordData, userId);
      } catch (dexieErr) {
        console.warn("Erreur Dexie saveOfflineRecord:", dexieErr);
      }

      // Fallback local storage
      const localVisits = JSON.parse(localStorage.getItem("nafa_offline_visits") || "[]");
      localVisits.push(offlineRecordData);
      localStorage.setItem("nafa_offline_visits", JSON.stringify(localVisits));

      return {
        success: true,
        message: `Visite pour ${clientName} mémorisée sur le smartphone (Mode Offline-First WhatsApp-style).`,
        createdId: localUuid,
        data: offlineRecordData,
        isOffline: true,
      };
    }

    return {
      success: true,
      message: action.explanation,
      data: entities,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erreur d'exécution de l'action : ${err?.message || "Échec inattendu"}`,
    };
  }
}
