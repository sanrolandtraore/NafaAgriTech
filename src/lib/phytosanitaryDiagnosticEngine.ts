/**
 * MOTEUR DE DIAGNOSTIC PHYTOSANITAIRE DIFFÉRENTIEL PROPRIÉTAIRE NAFA-AGRITECH
 * 
 * Principes agronomiques :
 * 1. Comparaison rigoureuse des observations d'imagerie et des symptômes avec la bibliothèque validée.
 * 2. Multi-hypothèses ordonnées (diagnostic principal + diagnostics différentiels plausibles).
 * 3. Distinction stricte entre :
 *    - Observations visuelles constatées (pixels, colorimétrie, organes, lésions)
 *    - Conclusions diagnostiques confirmées
 * 4. Détection proactive des incertitudes avec questions complémentaires de terrain.
 * 5. Zéro invention de probabilités arbitraires, de traitements fictifs ou de pesticides non homologués.
 * 6. Respect impératif des autorisations CSP-CILSS et référentiels INERA.
 */

import {
  PlantHealthCase,
  TreatmentProtocol,
  DiagnosticRule,
  phytosanitaryStorage,
  PHYTO_CASES_CATALOG,
} from "./phytosanitaryLibrary";
import type { FoliarImageAnalysisResult } from "./plantVisionAnalyzer";

export interface VisualObservationItem {
  featureName: string;
  organ: string;
  visualEvidence: string;
  source: "analyse_d_image" | "constat_de_terrain";
}

export interface DiagnosticHypothesis {
  caseId: string;
  diseaseNameFr: string;
  scientificName: string;
  category: string;
  likelihoodRank: "très_plausible" | "plausible" | "possible_à_confirmer";
  plausibilityScorePercent: number; // Score calculé sur l'adéquation symptômes/conditions (0-100)
  matchingSymptoms: string[];
  differingFeatures: string[];
  keyDifferentiationRule: string;
  recommendedConfirmationTest: string;
  biologicalProtocol?: TreatmentProtocol;
  chemicalCspProtocol?: TreatmentProtocol;
  prophylacticProtocol?: TreatmentProtocol;
  isCspApproved: boolean;
  cspReference?: string;
  riskLevel: string;
}

export interface ClarificationQuestion {
  id: string;
  questionText: string;
  whyNeeded: string;
  possibleAnswers: { label: string; value: string; supportsCaseId: string }[];
  fieldActionGuide: string; // Ex: "Couper la tige au ras du sol et plonger dans l'eau"
}

export interface PhytoDiagnosticResult {
  cropId: string;
  cropNameFr: string;
  visualObservations: VisualObservationItem[];
  primaryHypothesis: DiagnosticHypothesis | null;
  differentialHypotheses: DiagnosticHypothesis[];
  uncertaintyLevel: "faible" | "moderee" | "elevee";
  requiresFieldConfirmation: boolean;
  clarificationQuestions: ClarificationQuestion[];
  diagnosticExplanation: string;
  agronomicDisclaimer: string;
}

export interface DiagnosisInput {
  cropId: string;
  affectedOrgan?: "feuilles" | "tiges" | "fruits" | "collet" | "racines" | "epis";
  symptomsDescription?: string;
  season?: "hivernage" | "saison_seche_fraiche" | "saison_seche_chaude";
  imageAnalysis?: FoliarImageAnalysisResult;
  answeredClarifications?: Record<string, string>;
}

/**
 * Exécute le pipeline complet de diagnostic phytosanitaire différentiel
 */
export function executeDifferentialDiagnosis(input: DiagnosisInput): PhytoDiagnosticResult {
  const {
    cropId,
    affectedOrgan = "feuilles",
    symptomsDescription = "",
    season = "hivernage",
    imageAnalysis,
    answeredClarifications = {},
  } = input;

  const allCases = phytosanitaryStorage.getAllCases();
  const eligibleCases = allCases.filter((c) => c.cropId === cropId);

  // 1. EXTRACTION DES OBSERVATIONS VISUELLES STRICTES
  const visualObservations: VisualObservationItem[] = [];

  if (imageAnalysis && imageAnalysis.hasImage) {
    if (imageAnalysis.measuredMetrics.chlorosisPercent > 10) {
      visualObservations.push({
        featureName: "Chlorose foliaire mesurée",
        organ: imageAnalysis.identifiedOrgan || affectedOrgan,
        visualEvidence: `${Math.round(imageAnalysis.measuredMetrics.chlorosisPercent)}% de surface décolorée / jaunissante`,
        source: "analyse_d_image",
      });
    }

    if (imageAnalysis.measuredMetrics.necrosisPercent > 5) {
      visualObservations.push({
        featureName: "Nécrose tissulaire",
        organ: imageAnalysis.identifiedOrgan || affectedOrgan,
        visualEvidence: `${Math.round(imageAnalysis.measuredMetrics.necrosisPercent)}% de surface foliaire nécrosée / desséchée`,
        source: "analyse_d_image",
      });
    }

    imageAnalysis.detectedVisualLesions.forEach((lesion) => {
      visualObservations.push({
        featureName: lesion,
        organ: imageAnalysis.identifiedOrgan || affectedOrgan,
        visualEvidence: "Motif détecté par analyse spatiale des pixels",
        source: "analyse_d_image",
      });
    });
  }

  if (symptomsDescription.trim()) {
    visualObservations.push({
      featureName: "Symptômes rapportés au champ",
      organ: affectedOrgan,
      visualEvidence: symptomsDescription.trim(),
      source: "constat_de_terrain",
    });
  }

  // 2. ÉVALUATION DIFFÉRENTIELLE SUR LES CAS ÉLIGIBLES DE LA CULTURE
  const scoredCases: { caseItem: PlantHealthCase; score: number; matchCount: number; matching: string[]; differing: string[] }[] = [];

  const normalizedInputText = [
    symptomsDescription.toLowerCase(),
    ...(imageAnalysis?.detectedVisualLesions || []).map((l) => l.toLowerCase()),
    affectedOrgan.toLowerCase(),
  ].join(" ");

  eligibleCases.forEach((c) => {
    let score = 0;
    const matching: string[] = [];
    const differing: string[] = [];

    // Correspondance d'organe
    if (c.affectedOrgans.includes(affectedOrgan as any)) {
      score += 25;
      matching.push(`Organe atteint concordant (${affectedOrgan})`);
    } else {
      differing.push(`Organe primaire différent (${c.affectedOrgans.join(", ")})`);
    }

    // Correspondance des symptômes
    c.symptoms.forEach((sym) => {
      const symDesc = sym.descriptionFr.toLowerCase();
      const pattern = sym.visualPattern?.toLowerCase() || "";
      const color = sym.colorPhenotype?.toLowerCase() || "";

      let matched = false;

      if (pattern && normalizedInputText.includes(pattern)) matched = true;
      if (color && normalizedInputText.includes(color)) matched = true;

      // Recherche par mots-clés agronomiques
      const keywords = symDesc.split(/\s+/).filter((w) => w.length > 4);
      const matchesKeyword = keywords.some((kw) => normalizedInputText.includes(kw));

      if (matched || matchesKeyword) {
        score += sym.isPrimary ? 25 : 15;
        matching.push(sym.descriptionFr);
      }
    });

    // Prise en compte de la saison sahélienne
    const mainRule = c.rules[0];
    if (mainRule?.favorableWeather?.seasons) {
      if (mainRule.favorableWeather.seasons.includes(season)) {
        score += 15;
        matching.push(`Conditions agrométéorologiques favorables (${season.replace(/_/g, " ")})`);
      }
    }

    // Prise en compte des réponses aux questions de clarification
    Object.entries(answeredClarifications).forEach(([questionId, answerVal]) => {
      if (answerVal === c.id) {
        score += 40;
        matching.push("Confirmation par test de terrain spécifique");
      }
    });

    scoredCases.push({
      caseItem: c,
      score: Math.min(score, 98), // Pas de 100% artificiel sans confirmation de laboratoire
      matchCount: matching.length,
      matching,
      differing,
    });
  });

  // Trier par pertinence décroissante
  scoredCases.sort((a, b) => b.score - a.score);

  // 3. CONSTRUCTION DES HYPOTHÈSES HIÉRARCHISÉES
  const hypotheses: DiagnosticHypothesis[] = scoredCases.map((sc, index) => {
    const c = sc.caseItem;
    const rule = c.rules[0] || {
      differentiationKey: "Examen minutieux de l'organe atteint requis.",
      confirmationMethod: "Observation à la loupe et suivi de l'évolution sur 48h.",
    };

    let rank: "très_plausible" | "plausible" | "possible_à_confirmer" = "possible_à_confirmer";
    if (sc.score >= 70 && index === 0) rank = "très_plausible";
    else if (sc.score >= 45) rank = "plausible";

    const bioProto = c.protocols.find((p) => p.protocolType === "biologique");
    const chemProto = c.protocols.find((p) => p.protocolType === "chimique_csp");
    const prevProto = c.protocols.find((p) => p.protocolType === "preventif" || p.protocolType === "cultural");

    return {
      caseId: c.id,
      diseaseNameFr: c.diseaseNameFr,
      scientificName: c.scientificName,
      category: c.category,
      likelihoodRank: rank,
      plausibilityScorePercent: sc.score,
      matchingSymptoms: sc.matching,
      differingFeatures: sc.differing,
      keyDifferentiationRule: rule.differentiationKey,
      recommendedConfirmationTest: rule.confirmationMethod,
      biologicalProtocol: bioProto,
      chemicalCspProtocol: chemProto,
      prophylacticProtocol: prevProto,
      isCspApproved: !!chemProto?.cspRegistrationNumber,
      cspReference: chemProto?.cspRegistrationNumber,
      riskLevel: c.riskLevel,
    };
  });

  const primaryHypothesis = hypotheses[0] || null;
  const differentialHypotheses = hypotheses.slice(1, 4);

  // 4. ÉVALUATION DU NIVEAU D'INCERTITUDE & GÉNÉRATION DES QUESTIONS AU CHAMP
  let uncertaintyLevel: "faible" | "moderee" | "elevee" = "elevee";
  if (primaryHypothesis && primaryHypothesis.plausibilityScorePercent >= 75) {
    // Si l'écart avec la 2e hypothèse est grand
    const secondScore = differentialHypotheses[0]?.plausibilityScorePercent || 0;
    if (primaryHypothesis.plausibilityScorePercent - secondScore >= 20) {
      uncertaintyLevel = "faible";
    } else {
      uncertaintyLevel = "moderee";
    }
  } else if (primaryHypothesis && primaryHypothesis.plausibilityScorePercent >= 45) {
    uncertaintyLevel = "moderee";
  }

  // Création des questions de confirmation différentielles si deux hypothèses sont proches
  const clarificationQuestions: ClarificationQuestion[] = [];

  if (primaryHypothesis && differentialHypotheses.length > 0) {
    const rival = differentialHypotheses[0];
    const diffDiff = Math.abs(primaryHypothesis.plausibilityScorePercent - rival.plausibilityScorePercent);

    if (diffDiff < 30 || uncertaintyLevel !== "faible") {
      // Question ciblée pour trancher
      if (primaryHypothesis.caseId.includes("ralstonia") || rival.caseId.includes("ralstonia")) {
        clarificationQuestions.push({
          id: "q_ralstonia_test_eau",
          questionText: "Avez-vous effectué le test du verre d'eau sur la tige de tomate au collet ?",
          whyNeeded: "Permet de trancher avec certitude absolue entre le Flétrissement bactérien (Ralstonia) et une fusariose ou un stress hydrique.",
          fieldActionGuide: "Couper un segment de tige de 5 cm au collet et le tremper dans un verre d'eau claire sans remuer.",
          possibleAnswers: [
            { label: "Oui, des filets laiteux s'écoulent en continu (Positif)", value: "case_tom_ralstonia", supportsCaseId: "case_tom_ralstonia" },
            { label: "Non, l'eau reste limpide, aucun filament (Négatif)", value: "other", supportsCaseId: "" },
          ],
        });
      }

      if (primaryHypothesis.caseId.includes("tuta") || rival.caseId.includes("tuta")) {
        clarificationQuestions.push({
          id: "q_tuta_mines",
          questionText: "Les taches sur les feuilles contiennent-elles des grains noirs (excréments) à l'intérieur ?",
          whyNeeded: "Distingue les mines transparentes de Tuta absoluta des brûlures fongiques ou de la mouche mineuse (Liriomyza).",
          fieldActionGuide: "Déchirer délicatement l'épiderme translucide d'une feuille atteinte et examiner avec une loupe x10.",
          possibleAnswers: [
            { label: "Oui, présence nette d'excréments noirs granuleux", value: "case_tom_tuta_absoluta", supportsCaseId: "case_tom_tuta_absoluta" },
            { label: "Non, taches sèches sans résidus ni déjections", value: "other", supportsCaseId: "" },
          ],
        });
      }

      if (primaryHypothesis.caseId.includes("spodoptera") || rival.caseId.includes("spodoptera")) {
        clarificationQuestions.push({
          id: "q_spodoptera_cornet",
          questionText: "Le cornet du maïs contient-il un dépôt abondant semblable à de la sciure humide ?",
          whyNeeded: "Signe clinique distinctif de la Chenille légionnaire d'automne (Spodoptera frugiperda).",
          fieldActionGuide: "Écarter doucement les feuilles centrales du cornet pour inspecter le fond de la cavité.",
          possibleAnswers: [
            { label: "Oui, abondante sciure brune et feuilles rongées", value: "case_mais_spodoptera", supportsCaseId: "case_mais_spodoptera" },
            { label: "Non, pas de sciure au cœur", value: "other", supportsCaseId: "" },
          ],
        });
      }
    }
  }

  // 5. EXPLICATION AGRONOMIQUE STRUCTURÉE
  let explanation = "";
  if (!primaryHypothesis || primaryHypothesis.plausibilityScorePercent < 25) {
    explanation = "Les observations fournies ne permettent pas de dégager une pathologie certaine avec le référentiel actuel. Une inspection complémentaire de la plante entière et du système racinaire est préconisée.";
  } else {
    explanation = `L'analyse différentielle retient prioritairement « ${primaryHypothesis.diseaseNameFr} » (${primaryHypothesis.scientificName}) avec un indice de concordance de ${primaryHypothesis.plausibilityScorePercent}%. ` +
      `Critère déterminant : ${primaryHypothesis.keyDifferentiationRule} ` +
      (differentialHypotheses.length > 0 ? `Autres hypothèses à surveiller : ${differentialHypotheses.map((d) => d.diseaseNameFr).join(", ")}.` : "");
  }

  const cropMeta = PHYTO_CASES_CATALOG.find((c) => c.cropId === cropId);

  return {
    cropId,
    cropNameFr: cropMeta ? cropId.charAt(0).toUpperCase() + cropId.slice(1) : cropId,
    visualObservations,
    primaryHypothesis,
    differentialHypotheses,
    uncertaintyLevel,
    requiresFieldConfirmation: uncertaintyLevel !== "faible",
    clarificationQuestions,
    diagnosticExplanation: explanation,
    agronomicDisclaimer: "Recommandations délivrées à titre d'aide à la décision agronomique selon les référentiels INERA et CSP-CILSS. Tout traitement chimique demeure soumis aux homologations sahéliennes officielles et au respect strict des Délais Avant Récolte (DAR).",
  };
}
