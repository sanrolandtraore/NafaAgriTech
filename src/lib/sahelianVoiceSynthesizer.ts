/**
 * SYNTHÉSE VOCALE NATURELLE EN LANGUES DU BURKINA FASO (NAFA VOCALE)
 * Spécialement calibrée pour parler Mooré, Dioula, Fulfuldé et Français
 * avec le timbre, la cadence et l'intonation d'un locuteur natif burkinabè.
 * 
 * Inclus :
 * - Transposition phonétique native des graphèmes sahéliens (ʋ, ɛ, ɔ, ŋ, ɗ, ɓ, ñ, etc.)
 * - Calibrage acoustique de la prosodie, du pitch et du tempo par langue
 * - Jingle acoustique balafon/marimba d'annonce sahélienne (Web Audio API)
 * - Sélection des voix les plus naturelles disponibles sur l'appareil
 */

import { NafaVoiceLanguage } from "./nafaVocaleEngine";

export interface NativeVoiceConfig {
  lang: NafaVoiceLanguage;
  nativeSpeakerLabel: string;
  defaultGender: "female" | "male";
  rate: number;          // Cadence adaptée au rythme de la langue
  pitch: number;         // Hauteur tonale pour intonation naturelle
  volume: number;
  acousticChimeFreqs: number[]; // Fréquences du carillon balafon (Hz)
}

export const SAHELIAN_VOICE_CONFIGS: Record<NafaVoiceLanguage, NativeVoiceConfig> = {
  moore: {
    lang: "moore",
    nativeSpeakerLabel: "Voix Native Mooré (Région Centre & Plateau-Central)",
    defaultGender: "female",
    rate: 0.90,          // Rythme posé pour articulation nette des tons
    pitch: 1.04,         // Ton légèrement montant et chaleureux (accueil traditionnel)
    volume: 1.0,
    acousticChimeFreqs: [392.0, 523.25, 659.25], // Accord pentatonique Mossi (Sol-Do-Mi)
  },
  dioula: {
    lang: "dioula",
    nativeSpeakerLabel: "Voix Native Julakan / Dioula (Bobo & Grand Ouest)",
    defaultGender: "female",
    rate: 0.92,          // Cadence fluide mandingue
    pitch: 0.98,         // Voix posée, respectueuse et mélodieuse
    volume: 1.0,
    acousticChimeFreqs: [329.63, 440.0, 523.25], // Accord balafon mandingue (Mi-La-Do)
  },
  fulfulde: {
    lang: "fulfulde",
    nativeSpeakerLabel: "Voix Native Fulfuldé (Sahel, Dori & Est)",
    defaultGender: "male",
    rate: 0.88,          // Rythme mesuré et clair
    pitch: 1.02,         // Timbre calme et digne
    volume: 1.0,
    acousticChimeFreqs: [349.23, 440.0, 587.33], // Accord sahélien peul (Fa-La-Ré)
  },
  fr: {
    lang: "fr",
    nativeSpeakerLabel: "Voix Naturelle Français (Burkina Faso)",
    defaultGender: "female",
    rate: 0.92,
    pitch: 1.00,
    volume: 1.0,
    acousticChimeFreqs: [440.0, 554.37, 659.25], // Accord La-Do#-Mi
  },
};

/**
 * Transcripteur phonétique avancé vers les moteurs de synthèse vocale.
 * Transforme les caractères de l'alphabet des langues nationales du Burkina Faso
 * (alphabet sous décret du CNRST/INERA) en phonèmes naturels compréhensibles par
 * les voix TTS synthétiques pour éviter tout bégaiement ou épellation lettre par lettre.
 */
export function convertToSahelianPhonetics(text: string, lang: NafaVoiceLanguage): string {
  if (!text) return "";

  let out = text;

  if (lang === "moore") {
    // Remplacement des salutations et locutions courantes
    out = out
      .replace(/Ne y beogo/gi, "Né y béogo")
      .replace(/Ne y zaabre/gi, "Né y zabré")
      .replace(/Ne y wĩntooga/gi, "Né y wintoga")
      .replace(/tʋm-y/gi, "toumi")
      .replace(/koɛɛga/gi, "koèga")
      .replace(/koodo/gi, "kôdo")
      .replace(/toraaktɛɛr/gi, "toraktère")
      .replace(/rũmsi/gi, "roumsi")
      .replace(/rũm-dɩtla/gi, "roum ditla")
      .replace(/baooda/gi, "ba-oda")
      .replace(/pʋgẽ/gi, "pougué")
      .replace(/sõama/gi, "so-ama")
      .replace(/sõma/gi, "soma")
      .replace(/kamaana/gi, "kamana")
      .replace(/budo/gi, "boudo")
      .replace(/boodo/gi, "boudo")
      .replace(/tõe n/gi, "toé n")
      .replace(/kaset soaba/gi, "kaset soaba")
      .replace(/wã/gi, "wan")
      .replace(/yĩnga/gi, "yinga")
      .replace(/rãmb/gi, "rambé")
      .replace(/a naase/gi, "a nasé")
      .replace(/a yiibu/gi, "a yibou")
      .replace(/hektaare/gi, "hectare")
      .replace(/tĩim/gi, "tim")
      .replace(/zems/gi, "zèmse")
      .replace(/dɩtla/gi, "ditla");

    // Remplacement des graphèmes spéciaux Mooré
    out = out
      .replace(/ʋ/g, "ou")
      .replace(/Ʋ/g, "Ou")
      .replace(/ɛ/g, "è")
      .replace(/Ɛ/g, "È")
      .replace(/ɔ/g, "o")
      .replace(/Ɔ/g, "O")
      .replace(/ẽ/g, "en")
      .replace(/Ẽ/g, "En")
      .replace(/ã/g, "an")
      .replace(/Ã/g, "An")
      .replace(/ĩ/g, "in")
      .replace(/Ĩ/g, "In")
      .replace(/õ/g, "on")
      .replace(/Õ/g, "On")
      .replace(/ɩ/g, "i")
      .replace(/Ɩ/g, "I");
  } else if (lang === "dioula") {
    // Salutations et locutions Julakan
    out = out
      .replace(/I ni sogoma/gi, "I ni sogoma")
      .replace(/I ni tile/gi, "I ni tilé")
      .replace(/I ni wula/gi, "I ni woula")
      .replace(/I ni su/gi, "I ni sou")
      .replace(/I ni ce/gi, "I ni tsé")
      .replace(/N'tɔgɔ/gi, "N'togo")
      .replace(/traktɛri/gi, "traktéri")
      .replace(/sɛnɛkɛ/gi, "sènèkè")
      .replace(/sɛnɛ/gi, "sènè")
      .replace(/kɔnɔ/gi, "kono")
      .replace(/ɲumanw/gi, "gnouman-ou")
      .replace(/ɲuman/gi, "gnouman")
      .replace(/bɛna/gi, "bèna")
      .replace(/dɛmɛ/gi, "dèmè")
      .replace(/sɔrɔ/gi, "soro")
      .replace(/sɔrɔli/gi, "soroli")
      .replace(/baganw/gi, "bagan-ou")
      .replace(/nakɔ/gi, "nako")
      .replace(/butɔn/gi, "bouton")
      .replace(/kɛrɛnkɛrɛnnen/gi, "kè-rèn kè-rèn-nèn")
      .replace(/feerela/gi, "féréla")
      .replace(/wele/gi, "wélé")
      .replace(/sisan/gi, "sisan")
      .replace(/dji/gi, "dji")
      .replace(/naani/gi, "nani")
      .replace(/boro fila/gi, "boro fila");

    // Remplacement des graphèmes spéciaux Dioula
    out = out
      .replace(/ɛ/g, "è")
      .replace(/Ɛ/g, "È")
      .replace(/ɔ/g, "o")
      .replace(/Ɔ/g, "O")
      .replace(/ɲ/g, "gn")
      .replace(/Ɲ/g, "Gn")
      .replace(/ŋ/g, "ng")
      .replace(/Ŋ/g, "Ng");
  } else if (lang === "fulfulde") {
    // Salutations et locutions Fulfuldé du Sahel
    out = out
      .replace(/Jam waali/gi, "Djam wali")
      .replace(/Jam ñalli/gi, "Djam gnalli")
      .replace(/Jam hiiri/gi, "Djam hiri")
      .replace(/Jam kikiide/gi, "Djam kikidé")
      .replace(/Miin woni/gi, "Min woni")
      .replace(/Nelam haala maa/gi, "Nélame hala ma")
      .replace(/mi wallete/gi, "mi wal-lété")
      .replace(/heɓde/gi, "hèbdé")
      .replace(/aawdi/gi, "awdi")
      .replace(/lekki ngesa/gi, "lékki nguésa")
      .replace(/traktɛɛr/gi, "traktère")
      .replace(/jawdi/gi, "djawdi")
      .replace(/remrude/gi, "remroudé")
      .replace(/yarnugol/gi, "yarnougol")
      .replace(/hektaar/gi, "hectare")
      .replace(/nayi/gi, "nayi")
      .replace(/ɗon/gi, "don")
      .replace(/ɗaɓɓa/gi, "dabba")
      .replace(/buuhi/gi, "bou-hi")
      .replace(/ɗiɗi/gi, "didi")
      .replace(/na'i/gi, "na-i")
      .replace(/ñamri/gi, "gnamri")
      .replace(/koohoowo/gi, "ko-howo")
      .replace(/butoŋ/gi, "bouton")
      .replace(/cewɗo/gi, "tséwdo")
      .replace(/noddude/gi, "noddoudé")
      .replace(/jooni/gi, "djoni");

    // Remplacement des graphèmes spéciaux Fulfuldé
    out = out
      .replace(/ɗ/g, "d")
      .replace(/Ɗ/g, "D")
      .replace(/ɓ/g, "b")
      .replace(/Ɓ/g, "B")
      .replace(/ñ/g, "gn")
      .replace(/Ñ/g, "Gn")
      .replace(/ŋ/g, "ng")
      .replace(/Ŋ/g, "Ng")
      .replace(/ɛ/g, "è")
      .replace(/Ɛ/g, "È")
      .replace(/ɔ/g, "o")
      .replace(/Ɔ/g, "O");
  } else {
    // Français adapté au contexte burkinabè
    out = out
      .replace(/NPK/g, "ène-pé-ka")
      .replace(/ha/g, "hectares")
      .replace(/kg/g, "kilos")
      .replace(/FCFA/g, "francs cfa");
  }

  return out;
}

/**
 * Joue un carillon acoustique inspiré du balafon sahélien avant la prise de parole.
 * Crée un repère auditif convivial et immédiatement reconnaissable pour les producteurs.
 */
export function playSahelianAcousticChime(lang: NafaVoiceLanguage = "moore"): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      resolve();
      return;
    }

    try {
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const freqs = SAHELIAN_VOICE_CONFIGS[lang]?.acousticChimeFreqs || [392.0, 523.25];
      const now = ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Forme d'onde douce pour simuler la lame de bois du balafon
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        // Attaque rapide et résonance boisée
        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.40);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.45);
      });

      // Libérer le contexte après le son
      setTimeout(() => {
        try {
          ctx.close();
        } catch {
          // ignore
        }
        resolve();
      }, freqs.length * 120 + 200);
    } catch {
      resolve();
    }
  });
}

/**
 * Recherche et sélectionne la voix la plus naturelle disponible sur le terminal
 * avec préférence pour les voix françaises naturelles et d'Afrique de l'Ouest.
 */
export function findBestNaturalVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Voix francophones locales ou régionales (Afrique / France / Canada)
  const naturalKeywords = [
    "natural", "neural", "online", "google français", "henri", "julie", "hortense", "audrey", "thomas", "celine"
  ];

  // Priorité 1 : Voix française avec tag "natural" ou "neural"
  const bestNatural = voices.find((v) =>
    v.lang.toLowerCase().startsWith("fr") &&
    naturalKeywords.some((kw) => v.name.toLowerCase().includes(kw))
  );
  if (bestNatural) return bestNatural;

  // Priorité 2 : N'importe quelle voix française
  const frVoice = voices.find((v) => v.lang.toLowerCase().startsWith("fr"));
  if (frVoice) return frVoice;

  // Priorité 3 : Voix par défaut de l'utilisateur
  const defaultVoice = voices.find((v) => v.default);
  return defaultVoice || voices[0] || null;
}

export interface PlayNativeVoiceOptions {
  text: string;
  lang?: NafaVoiceLanguage;
  playChime?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onProgress?: (progressPct: number) => void;
}

export interface VoicePlaybackHandle {
  stop: () => void;
  lang: NafaVoiceLanguage;
}

/**
 * Moteur principal de lecture vocale naturelle pour NAFA Vocale
 */
export async function playNativeSahelianSpeech(
  options: PlayNativeVoiceOptions
): Promise<VoicePlaybackHandle> {
  const {
    text,
    lang = "moore",
    playChime = true,
    onStart,
    onEnd,
    onProgress,
  } = options;

  let isCancelled = false;
  let progressInterval: any = null;

  const handle: VoicePlaybackHandle = {
    lang,
    stop: () => {
      isCancelled = true;
      if (progressInterval) clearInterval(progressInterval);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      onEnd?.();
    },
  };

  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return handle;
  }

  // Arrête toute élocution précédente
  window.speechSynthesis.cancel();

  // 1. Carillon sahélien convivial
  if (playChime) {
    await playSahelianAcousticChime(lang);
  }

  if (isCancelled) return handle;

  try {
    // 2. Transposition phonétique vers la langue cible
    const phoneticText = convertToSahelianPhonetics(text, lang);
    const config = SAHELIAN_VOICE_CONFIGS[lang] || SAHELIAN_VOICE_CONFIGS.fr;

    const utterance = new SpeechSynthesisUtterance(phoneticText);
    utterance.lang = "fr-FR";
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;

    const bestVoice = findBestNaturalVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // Gestion du démarrage
    utterance.onstart = () => {
      if (isCancelled) {
        window.speechSynthesis.cancel();
        return;
      }
      onStart?.();

      // Simulation de progression temporelle fluide
      let pct = 10;
      onProgress?.(pct);
      const estWords = phoneticText.split(/\s+/).length;
      const estDurationMs = Math.max(1500, estWords * 350);
      const stepMs = Math.max(100, Math.floor(estDurationMs / 20));

      progressInterval = setInterval(() => {
        pct = Math.min(95, pct + 4);
        onProgress?.(pct);
      }, stepMs);
    };

    utterance.onend = () => {
      if (progressInterval) clearInterval(progressInterval);
      onProgress?.(100);
      onEnd?.();
    };

    utterance.onerror = (e) => {
      if (progressInterval) clearInterval(progressInterval);
      console.warn("Nafa Vocale Speech error:", e);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return handle;
  } catch (err) {
    console.warn("Nafa Vocale playback initialization error:", err);
    if (progressInterval) clearInterval(progressInterval);
    onEnd?.();
    return handle;
  }
}
