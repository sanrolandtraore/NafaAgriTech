/**
 * NAFA Vocale - Moteur d'assistance vocale en langues sahéliennes pour les producteurs agricoles
 * Conçu spécialement pour les agriculteurs et éleveurs qui ne savent ni lire ni écrire.
 * Supporte : Français, Mooré, Dioula, Fulfuldé.
 */

import {
  playNativeSahelianSpeech,
  convertToSahelianPhonetics,
  SAHELIAN_VOICE_CONFIGS,
  findBestNaturalVoice,
} from "./sahelianVoiceSynthesizer";

export type NafaVoiceLanguage = "fr" | "moore" | "dioula" | "fulfulde";

export interface NafaVoiceLanguageInfo {
  code: NafaVoiceLanguage;
  name: string;
  nativeName: string;
  region: string;
  flagLabel: string;
  welcomeVoiceText: string;
  sampleQueries: {
    label: string;
    speechText: string;
    translationFr: string;
  }[];
}

export const NAFA_VOICE_LANGUAGES: Record<NafaVoiceLanguage, NafaVoiceLanguageInfo> = {
  fr: {
    code: "fr",
    name: "Français",
    nativeName: "Français (Burkina)",
    region: "National",
    flagLabel: "BF",
    welcomeVoiceText: "Bonjour ! Je suis NAFA Vocale. Envoyez-moi un message vocal pour trouver des semences, engrais, tracteurs ou du bétail.",
    sampleQueries: [
      {
        label: "Labour au tracteur à Bobo",
        speechText: "Bonjour, je cherche un tracteur disponible pour faire du labour de 4 hectares vers Bobo-Dioulasso rapidement.",
        translationFr: "Demande de location de tracteur pour labour à Bobo-Dioulasso",
      },
      {
        label: "Semences de maïs & Engrais NPK",
        speechText: "Je veux acheter des semences de maïs certifiées et des sacs d'engrais NPK 14-23-14 à Ouagadougou.",
        translationFr: "Achat de semences de maïs et engrais NPK à Ouagadougou",
      },
      {
        label: "Motopompe solaire d'irrigation",
        speechText: "J'ai besoin d'une motopompe solaire d'irrigation avec tuyaux goutte-à-goutte pour mon maraîchage.",
        translationFr: "Recherche de motopompe et matériel d'irrigation solaire",
      },
      {
        label: "Aliments bétail & Vétérinaire",
        speechText: "Je cherche des tourteaux et des aliments concentrés pour mes bœufs à Koudougou.",
        translationFr: "Aliments pour bétail et soins vétérinaires à Koudougou",
      },
    ],
  },
  moore: {
    code: "moore",
    name: "Mooré",
    nativeName: "Mooré (Mossi)",
    region: "Centre, Plateau-Central, Nord, Centre-Nord",
    flagLabel: "MO",
    welcomeVoiceText: "Ne y beogo ! Mam yaa NAFA Vocale. Tʋm-y koɛɛga tɩ m sõng-y n paam toraaktɛɛr, koodo, engrais bɩ rũmsi.",
    sampleQueries: [
      {
        label: "Toraaktɛɛr labour yĩnga Bobo",
        speechText: "Ne y beogo, mam baooda toraaktɛɛr n na n kood hektaare a naase Bobo-Dioulasso pʋgẽ.",
        translationFr: "Je cherche un tracteur pour labourer 4 hectares vers Bobo-Dioulasso.",
      },
      {
        label: "Kamaana budo la Engrais NPK",
        speechText: "M baooda kamaana budo sõama la engrais NPK saka a yiibu Ouagadougou pʋgẽ.",
        translationFr: "Je cherche des semences de maïs et de l'engrais NPK à Ouaga.",
      },
      {
        label: "Koom motopompe solaire",
        speechText: "M baooda motopompe solaire koom yĩnga maraîchage zĩigẽ.",
        translationFr: "Je recherche une motopompe solaire pour mon champ maraîcher.",
      },
      {
        label: "Rũmsi dɩtla la tĩim",
        speechText: "Mam baooda tourteau la rũm-dɩtla m nii wã yĩnga Koudougou.",
        translationFr: "Je cherche des aliments et tourteau pour mes bœufs à Koudougou.",
      },
    ],
  },
  dioula: {
    code: "dioula",
    name: "Dioula",
    nativeName: "Julakan (Dioula)",
    region: "Hauts-Bassins, Cascades, Boucle du Mouhoun",
    flagLabel: "DI",
    welcomeVoiceText: "I ni sogoma ! N'tɔgɔ NAFA Vocale. I ka kuma ci n ma, n bɛna i dɛmɛ ka traktɛri, si, fari walima baganw sɔrɔ.",
    sampleQueries: [
      {
        label: "Traktɛri sɔrɔli labour kama Bobo",
        speechText: "I ni ce, n bɛ traktɛri dɔ fɛ ka hectare naani sɛnɛkɛ Bobo-Dioulasso kɔnɔ.",
        translationFr: "Je veux un tracteur pour labourer 4 hectares à Bobo-Dioulasso.",
      },
      {
        label: "Kaba si ni Fari NPK",
        speechText: "N bɛ kaba si certifiée ni fari NPK sisekisɛ boro fila fɛ Ouagadougou.",
        translationFr: "Je cherche des semences de maïs et de l'engrais NPK à Ouaga.",
      },
      {
        label: "Dji pompe solaire",
        speechText: "N bɛ dji pompe motopompe solaire fɛ n ka nakɔ dji dɔnni kama.",
        translationFr: "Je recherche une motopompe solaire pour arroser mon jardin.",
      },
      {
        label: "Bagan balo ni Dokotoro",
        speechText: "N bɛ balo ni tourteau fɛ n ka misi kama Koudougou.",
        translationFr: "Je cherche du tourteau et des aliments pour mes vaches à Koudougou.",
      },
    ],
  },
  fulfulde: {
    code: "fulfulde",
    name: "Fulfuldé",
    nativeName: "Fulfulde (Peul)",
    region: "Sahel, Est, Nord",
    flagLabel: "FU",
    welcomeVoiceText: "Jam waali ! Miin woni NAFA Vocale. Nelam haala maa, mi wallete heɓde aawdi, lekki ngesa, traktɛɛr malla jawdi.",
    sampleQueries: [
      {
        label: "Traktɛɛr remrude Bobo",
        speechText: "Jam waali, mi ɗon ɗaɓɓa traktɛɛr ngam remde hektaar nayi Bobo-Dioulasso.",
        translationFr: "Je cherche un tracteur pour labourer 4 hectares à Bobo-Dioulasso.",
      },
      {
        label: "Aawdi kaba e Lekki NPK",
        speechText: "Mi ɗon yidi soodde aawdi kaba e buuhi NPK ɗiɗi Ouagadougou.",
        translationFr: "Je veux acheter des semences de maïs et de l'engrais NPK à Ouaga.",
      },
      {
        label: "Pompe ndiyam naange",
        speechText: "Mi ɗon ɗaɓɓa pompe ndiyam naange ngam yarnugol ngesa am.",
        translationFr: "Je recherche une motopompe solaire pour irriguer mon champ.",
      },
      {
        label: "Ñamri jawdi e Doktoro",
        speechText: "Mi ɗon ɗaɓɓa tourteau e ñamri na'i am Koudougou.",
        translationFr: "Je cherche des aliments et tourteau pour mon bétail à Koudougou.",
      },
    ],
  },
};

export interface NafaVoiceAnalysisResult {
  language: NafaVoiceLanguage;
  transcript: string;
  understoodNeedFr: string;
  detectedCategory: string;
  detectedCity: string | null;
  detectedAction: "louer" | "acheter" | "service";
  voiceReplyText: string;
  voiceSpokenText: string;
  matchingKeywords: string[];
  filterParams: {
    category?: string;
    search?: string;
    city?: string;
  };
}

// Mots-clés multilingues par intention
const DICTIONARY: Record<string, { category: string; action: "louer" | "acheter" | "service"; keywords: string[] }> = {
  machinisme: {
    category: "machinisme",
    action: "louer",
    keywords: [
      "tracteur", "traktɛri", "traktɛɛr", "toraaktɛɛr", "labour", "labourage", "hersage",
      "motoculteur", "machine", "batteuse", "moissonneuse", "remrude", "sɛnɛ", "koodo"
    ],
  },
  intrants_semences: {
    category: "intrants_semences",
    action: "acheter",
    keywords: [
      "semence", "semences", "graine", "graines", "maïs", "kaba", "kamaana", "sorgho", "sayi", "kãsenga",
      "bayeri", "oignon", "jaba", "tinaare", "tomate", "tamati", "tomaati", "niébé", "bẽnga", "soso", "ñebbe",
      "riz", "mui", "malo", "maaro", "engrais", "npk", "urée", "uree", "fari", "tĩim", "tiim", "lekki", "faynde",
      "biopesticide", "phyto", "fertilisant", "aawdi", "si", "budo", "boodo"
    ],
  },
  irrigation_solaire: {
    category: "irrigation_solaire",
    action: "louer",
    keywords: [
      "pompe", "motopompe", "solaire", "irrigation", "eau", "koom", "ji", "dji", "ndiyam",
      "goutte", "forage", "arrosage", "kɔlɔn", "woyndu", "yarnugol"
    ],
  },
  produits_elevage: {
    category: "produits_elevage",
    action: "acheter",
    keywords: [
      "aliment", "aliments", "bétail", "betail", "tourteau", "provende", "vache", "bœuf", "boeuf", "mouton",
      "misi", "nii", "naye", "na'i", "baali", "saga", "piisi", "rũmsi", "bagan", "jawdi", "ñamri", "balo", "volaille"
    ],
  },
  services_veterinaires: {
    category: "services_veterinaires",
    action: "service",
    keywords: [
      "vétérinaire", "veterinaire", "vaccin", "vaccination", "soin", "soins", "malade", "dokotoro", "doctor"
    ],
  },
};

const BURKINA_CITIES_ALIASES: Record<string, string> = {
  bobo: "Bobo-Dioulasso",
  "bobo-dioulasso": "Bobo-Dioulasso",
  ouaga: "Ouagadougou",
  ouagadougou: "Ouagadougou",
  koudougou: "Koudougou",
  banfora: "Banfora",
  dedougou: "Dédougou",
  dédougou: "Dédougou",
  ouahigouya: "Ouahigouya",
  kaya: "Kaya",
  fada: "Fada N'Gourma",
  tenkodogo: "Tenkodogo",
  manga: "Manga",
  bama: "Bama",
  koubri: "Koubri",
};

/**
 * Analyse le message vocal (texte ou transcription) et extrait l'intention exacte
 */
export function analyzeVoiceQuery(
  rawText: string,
  selectedLanguage: NafaVoiceLanguage = "fr"
): NafaVoiceAnalysisResult {
  const text = (rawText || "").toLowerCase().trim();

  // 1. Détection de la ville
  let detectedCity: string | null = null;
  for (const [alias, realName] of Object.entries(BURKINA_CITIES_ALIASES)) {
    if (text.includes(alias)) {
      detectedCity = realName;
      break;
    }
  }

  // 2. Détection de la catégorie
  let bestCategory = "intrants_semences";
  let bestAction: "louer" | "acheter" | "service" = "acheter";
  let maxScore = 0;
  const matchedKeywords: string[] = [];

  for (const [catKey, info] of Object.entries(DICTIONARY)) {
    let score = 0;
    for (const kw of info.keywords) {
      if (text.includes(kw)) {
        score += 1;
        matchedKeywords.push(kw);
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestCategory = catKey;
      bestAction = info.action;
    }
  }

  // Fallback si rien de spécifique n'a été reconnu
  if (maxScore === 0) {
    if (text.includes("louer") || text.includes("machine") || text.includes("travail")) {
      bestCategory = "machinisme";
      bestAction = "louer";
    } else {
      bestCategory = "intrants_semences";
      bestAction = "acheter";
    }
  }

  // 3. Construction des explications dans la langue de l'agriculteur
  let understoodNeedFr = "";
  let voiceReplyText = "";
  let voiceSpokenText = "";

  const cityLabel = detectedCity ? ` à ${detectedCity}` : "";

  if (bestCategory === "machinisme") {
    understoodNeedFr = `Location ou travaux de machinisme agricole (Tracteur / Labour / Matériel)${cityLabel}`;
    switch (selectedLanguage) {
      case "moore":
        voiceReplyText = `M wʋma fo koɛɛga sõma. Fo baooda toraaktɛɛr bɩ machinisme tʋʋma${detectedCity ? ` ${detectedCity} pʋgẽ` : ""}. M paama ofert rãmb sõama. Ges-y la f bool kaset soaba sisan !`;
        voiceSpokenText = `M wʋma fo koɛɛga sõma. Fo baooda toraaktɛɛr. M paama ofert rãmb sõama. Ges-y n bool kaset soaba.`;
        break;
      case "dioula":
        voiceReplyText = `N ye i ka kuma mɛn ka ɲɛ. I bɛ traktɛri walima sɛnɛkɛ minanw sɔrɔli fɛ${detectedCity ? ` ${detectedCity} kɔnɔ` : ""}. N ye ofert ɲumanw sɔrɔ. I bɛ se ka butɔn kɛrɛnkɛrɛnnen digi ka feerela wele sisan !`;
        voiceSpokenText = `N ye i ka kuma mɛn ka ɲɛ. I bɛ traktɛri fɛ. Ofert ɲumanw bɛ yen. Digi ka feerela wele sisan.`;
        break;
      case "fulfulde":
        voiceReplyText = `Mi nani haala maa lobbo. A ɗon ɗaɓɓa traktɛɛr malla remrugal${detectedCity ? ` nder ${detectedCity}` : ""}. Mi heɓii jaabi lobbi. Pettu butoŋ cewɗo ngam noddude koohoowo !`;
        voiceSpokenText = `Mi nani haala maa lobbo. A ɗon ɗaɓɓa traktɛɛr. Mi heɓii jaabi lobbi. Noddu koohoowo jooni.`;
        break;
      default:
        voiceReplyText = `J'ai bien compris votre message vocal. Vous recherchez un tracteur ou du matériel agricole${cityLabel}. Voici les offres disponibles vérifiées par NAFA. Appuyez sur le grand bouton vert pour appeler directement le prestataire.`;
        voiceSpokenText = `J'ai bien compris votre demande de tracteur et matériel agricole. Voici les offres disponibles. Vous pouvez appuyer sur le bouton vert pour appeler le prestataire.`;
        break;
    }
  } else if (bestCategory === "intrants_semences") {
    understoodNeedFr = `Achat d'intrants ou de semences certifiées (Engrais NPK, Urée, Semences)${cityLabel}`;
    switch (selectedLanguage) {
      case "moore":
        voiceReplyText = `M wʋma fo koɛɛga sõma. Fo baooda semences certifiées bɩ engrais NPK${detectedCity ? ` ${detectedCity} pʋgẽ` : ""}. M paama ofert sõama. F tõe n boola kaset soaba sisan !`;
        voiceSpokenText = `M wʋma fo koɛɛga sõma. Fo baooda semences certifiées la engrais NPK. M paama ofert rãmb sõama. Bool kaset soaba sisan !`;
        break;
      case "dioula":
        voiceReplyText = `N ye i ka kuma mɛn ka ɲɛ. I bɛ si ɲuman walima fari NPK fɛ${detectedCity ? ` ${detectedCity} kɔnɔ` : ""}. Ofert ɲumanw bɛ yen. Digi ka feerela wele sisan !`;
        voiceSpokenText = `N ye i ka kuma mɛn ka ɲɛ. I bɛ si ni fari fɛ. Digi ka feerela wele sisan.`;
        break;
      case "fulfulde":
        voiceReplyText = `Mi nani haala maa lobbo. A ɗon yidi aawdi lobbiri malla lekki ngesa NPK${detectedCity ? ` nder ${detectedCity}` : ""}. Jaabi lobbi ɗon. Pettu ngam noddude !`;
        voiceSpokenText = `Mi nani haala maa lobbo. A ɗon yidi aawdi e lekki ngesa. Pettu ngam noddude koohoowo !`;
        break;
      default:
        voiceReplyText = `J'ai bien compris votre message vocal. Vous cherchez des semences certifiées ou de l'engrais${cityLabel}. Voici les fournisseurs disponibles. Vous pouvez les appeler directement ou leur envoyer un WhatsApp.`;
        voiceSpokenText = `J'ai bien compris votre demande pour les semences et l'engrais. Voici les fournisseurs certifiés à votre disposition.`;
        break;
    }
  } else if (bestCategory === "irrigation_solaire") {
    understoodNeedFr = `Équipement d'irrigation, motopompe solaire ou forage${cityLabel}`;
    switch (selectedLanguage) {
      case "moore":
        voiceReplyText = `M wʋma fo koɛɛga. Fo baooda motopompe solaire bɩ koom tʋʋma${detectedCity ? ` ${detectedCity} pʋgẽ` : ""}. M wilga-y ofert nins sẽn be wã !`;
        voiceSpokenText = `M wum-a fo koɛɛga. Fo baooda motopompe koom yĩnga. Ges-y ofert rãmb.`;
        break;
      case "dioula":
        voiceReplyText = `N ye i ka kuma mɛn. I bɛ dji pompe motopompe solaire fɛ${detectedCity ? ` ${detectedCity} kɔnɔ` : ""}. Ofert ɲumanw bɛ yen !`;
        voiceSpokenText = `N ye i ka kuma mɛn. I bɛ motopompe fɛ. Ofert bɛ yen.`;
        break;
      case "fulfulde":
        voiceReplyText = `Mi nani haala maa. A ɗon ɗaɓɓa pompe ndiyam naange${detectedCity ? ` nder ${detectedCity}` : ""}. Jaabi lobbi ɗon !`;
        voiceSpokenText = `Mi nani haala maa. A ɗon ɗaɓɓa pompe ndiyam naange. Jaabi ɗon.`;
        break;
      default:
        voiceReplyText = `J'ai bien compris votre demande. Vous recherchez une motopompe solaire ou du matériel d'irrigation${cityLabel}. Voici les offres disponibles.`;
        voiceSpokenText = `J'ai bien compris votre besoin en motopompe solaire et irrigation. Voici les équipements disponibles.`;
        break;
    }
  } else if (bestCategory === "produits_elevage") {
    understoodNeedFr = `Aliments pour bétail, tourteaux, provendes ou animaux d'élevage${cityLabel}`;
    switch (selectedLanguage) {
      case "moore":
        voiceReplyText = `M wʋma fo koɛɛga sõma. Fo baooda rũm-dɩtla bɩ tourteau fo nii wã yĩnga${detectedCity ? ` ${detectedCity} pʋgẽ` : ""}. Ofert sõama be n bilga. F tõe n boola kaset soaba sisan !`;
        voiceSpokenText = `M wʋma fo koɛɛga sõma. Fo baooda rũm-dɩtla la tourteau fo nii wã yĩnga. Ofert sõama be n bilga. Bool-y kaset soaba sisan !`;
        break;
      case "dioula":
        voiceReplyText = `N ye i ka kuma mɛn ka ɲɛ. I bɛ balo ni tourteau sɔrɔli fɛ i ka misi kama${detectedCity ? ` ${detectedCity} kɔnɔ` : ""}. Ofert ɲumanw bɛ yen. Digi ka feerela wele sisan !`;
        voiceSpokenText = `N ye i ka kuma mɛn ka ɲɛ. I bɛ balo ni tourteau fɛ i ka misi kama. Ofert ɲumanw bɛ yen. Digi ka feerela wele !`;
        break;
      case "fulfulde":
        voiceReplyText = `Mi nani haala maa lobbo. A ɗon ɗaɓɓa tourteau e ñamri na'i maa${detectedCity ? ` nder ${detectedCity}` : ""}. Jaabi lobbi ɗon. Pettu butoŋ ngam noddude koohoowo !`;
        voiceSpokenText = `Mi nani haala maa lobbo. A ɗon ɗaɓɓa tourteau e ñamri na'i maa. Jaabi lobbi ɗon. Pettu ngam noddude !`;
        break;
      default:
        voiceReplyText = `J'ai bien compris votre demande. Vous recherchez des aliments pour bétail ou des tourteaux${cityLabel}. Voici les offres disponibles. Appuyez sur Appeler pour contacter le vendeur.`;
        voiceSpokenText = `J'ai bien compris votre demande d'aliments et soins pour bétail. Voici les offres disponibles pour vos animaux.`;
        break;
    }
  } else if (bestCategory === "services_veterinaires") {
    understoodNeedFr = `Soins vétérinaires, vaccins ou santé animale${cityLabel}`;
    switch (selectedLanguage) {
      case "moore":
        voiceReplyText = `M wʋma fo koɛɛga. Fo baooda dokotoro bɩ tĩim fo rũmsi yĩnga${detectedCity ? ` ${detectedCity} pʋgẽ` : ""}. Dokotoro rãmb kaset soaba be n bilga !`;
        voiceSpokenText = `M wʋma fo koɛɛga. Fo baooda dokotoro rũmsi yĩnga. Bool-y dokotoro sisan.`;
        break;
      case "dioula":
        voiceReplyText = `N ye i ka kuma mɛn. I bɛ bagan dokotoro walima furaw fɛ${detectedCity ? ` ${detectedCity} kɔnɔ` : ""}. Dokotoro sɔrɔlen bɛ yen. Digi ka wele !`;
        voiceSpokenText = `N ye i ka kuma mɛn. I bɛ bagan dokotoro fɛ. Digi ka dokotoro wele sisan.`;
        break;
      case "fulfulde":
        voiceReplyText = `Mi nani haala maa. A ɗon ɗaɓɓa doktoro jawdi malla lekki na'i${detectedCity ? ` nder ${detectedCity}` : ""}. Doktoro'en ɗon. Pettu ngam noddude !`;
        voiceSpokenText = `Mi nani haala maa. A ɗon ɗaɓɓa doktoro jawdi. Noddu doktoro jooni.`;
        break;
      default:
        voiceReplyText = `J'ai bien compris votre message vocal. Vous recherchez un vétérinaire ou des soins pour vos animaux${cityLabel}. Voici les professionnels certifiés disponibles.`;
        voiceSpokenText = `J'ai bien compris votre besoin vétérinaire. Voici les professionnels certifiés disponibles pour soigner vos animaux.`;
        break;
    }
  } else {
    understoodNeedFr = `Recherche de produits ou services agricoles & d'élevage${cityLabel}`;
    switch (selectedLanguage) {
      case "moore":
        voiceReplyText = `M wʋma fo koɛɛga sõma. M tigma ofert rãmb sõama sẽn zems fo tʋʋmdã. Ges-y n bool kaset soaba !`;
        voiceSpokenText = `M wʋma fo koɛɛga sõma. Ges-y ofert rãmb n bool kaset soaba.`;
        break;
      case "dioula":
        voiceReplyText = `N ye i ka kuma mɛn ka ɲɛ. N ye feere ɲumanw sɔrɔ min bɛ bɛn i ka haaju ma. I bɛ se ka feerela wele sisan !`;
        voiceSpokenText = `N ye i ka kuma mɛn. Feerew bɛ yen. Digi ka feerela wele sisan.`;
        break;
      case "fulfulde":
        voiceReplyText = `Mi nani haala maa lobbo. Mi heɓii ko potɗaa e haaju maa. Pettu butoŋ ngam noddude !`;
        voiceSpokenText = `Mi nani haala maa lobbo. Mi heɓii ko potɗaa. Noddu koohoowo jooni.`;
        break;
      default:
        voiceReplyText = `J'ai bien compris votre message vocal. Voici les meilleures offres répondant à votre besoin${cityLabel}. Appuyez sur le bouton pour contacter le fournisseur.`;
        voiceSpokenText = `J'ai bien compris votre demande. Voici les offres correspondantes pour vous.`;
        break;
    }
  }

  return {
    language: selectedLanguage,
    transcript: rawText,
    understoodNeedFr,
    detectedCategory: bestCategory,
    detectedCity,
    detectedAction: bestAction,
    voiceReplyText,
    voiceSpokenText,
    matchingKeywords: matchedKeywords,
    filterParams: {
      category: bestCategory,
      city: detectedCity || undefined,
      search: matchedKeywords[0] || undefined,
    },
  };
}

/**
 * Lit le message à voix haute avec le synthétiseur vocal sahélien naturel
 */
export function playVoiceSpeech(
  text: string,
  lang: NafaVoiceLanguage = "fr",
  onEnd?: () => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return false;
  }

  try {
    playNativeSahelianSpeech({
      text,
      lang,
      playChime: true,
      onEnd,
    });
    return true;
  } catch (e) {
    console.warn("Speech synthesis error:", e);
    onEnd?.();
    return false;
  }
}

export {
  playNativeSahelianSpeech,
  convertToSahelianPhonetics,
  SAHELIAN_VOICE_CONFIGS,
  findBestNaturalVoice,
};
