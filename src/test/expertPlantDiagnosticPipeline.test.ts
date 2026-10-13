import { describe, it, expect } from "vitest";
import {
  SUPPORTED_AGRI_SPECULATIONS,
  estimateCandidateCrops,
  resolveExpertDiagnosisForCrop,
} from "../lib/expertPlantDiagnosticPipeline";
import type { FoliarImageAnalysisResult } from "../lib/plantVisionAnalyzer";

describe("Pipeline de Diagnostic Phytosanitaire & Zootechnique Expert (INERA & CSP-CILSS)", () => {
  const dummyVisualResult: FoliarImageAnalysisResult = {
    hasImage: true,
    imageDimensions: { width: 1024, height: 768 },
    measuredMetrics: {
      healthyTissuePercent: 70.0,
      necrosisPercent: 18.0,
      chlorosisPercent: 10.0,
      powderyMildewPercent: 0.0,
      rustPustulePercent: 2.0,
      totalFoliarDamagePercent: 30.0,
    },
    detectedVisualLesions: [
      "Perforations déchiquetées irrégulières",
      "Taches foliaires nécrotiques",
    ],
    identifiedOrgan: "feuilles",
    severityLevel: "moyen",
    visualDiagnosisRationale: "Échantillon analysé",
  };

  it("supporte toutes les grandes spéculations burkinabè et sahéliennes sans omission", () => {
    const ids = SUPPORTED_AGRI_SPECULATIONS.map((s) => s.id);
    expect(ids).toContain("mais");
    expect(ids).toContain("tomate");
    expect(ids).toContain("oignon");
    expect(ids).toContain("sorgho");
    expect(ids).toContain("coton");
    expect(ids).toContain("niebe");
    expect(ids).toContain("arachide");
    expect(ids).toContain("riz");
    expect(ids).toContain("volaille");
    expect(ids).toContain("bovin");
  });

  it("estime des hypothèses de cultures distinctes et cohérentes selon les signatures visuelles", () => {
    const candidates = estimateCandidateCrops(
      dummyVisualResult.measuredMetrics,
      dummyVisualResult.detectedVisualLesions,
      dummyVisualResult.imageDimensions
    );
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates[0].confidencePct).toBeGreaterThan(0);
    expect(candidates[0].reason).toBeDefined();
  });

  it("diagnostique rigoureusement le Maïs sans jamais attribuer une maladie de tomate", () => {
    const diagMais = resolveExpertDiagnosisForCrop({
      cropId: "mais",
      organCode: "feuilles",
      visualResult: dummyVisualResult,
    });

    expect(diagMais.crop.id).toBe("mais");
    expect(diagMais.crop.commonNameFr).toBe("Maïs");
    // Ne doit JAMAIS être une maladie de tomate ou de mineuse
    expect(diagMais.maladie).not.toContain("tomate");
    expect(diagMais.maladie).not.toContain("Tuta");
    expect(diagMais.agent_causal).not.toContain("Tuta absoluta");

    // Doit être la chenille légionnaire (Spodoptera frugiperda)
    expect(diagMais.agent_causal).toContain("Spodoptera frugiperda");
    expect(diagMais.test_confirmation_terrain).toContain("Y");
    expect(diagMais.traitement_chimique_csp).toBeDefined();
    expect(diagMais.traitement_chimique_csp?.delai_attente).toContain("DAR");
    expect(diagMais.traitement_bio).toBeDefined();
  });

  it("diagnostique rigoureusement la Tomate avec ses bio-agresseurs spécifiques", () => {
    const visualTomate: FoliarImageAnalysisResult = {
      ...dummyVisualResult,
      detectedVisualLesions: ["Taches concentriques en cible de tir", "Nécroses foliaires"],
      measuredMetrics: {
        ...dummyVisualResult.measuredMetrics,
        necrosisPercent: 22.0,
      },
    };

    const diagTomate = resolveExpertDiagnosisForCrop({
      cropId: "tomate",
      organCode: "feuilles",
      visualResult: visualTomate,
    });

    expect(diagTomate.crop.id).toBe("tomate");
    expect(diagTomate.crop.commonNameFr).toBe("Tomate");
    expect(diagTomate.maladie).toContain("Alternariose");
    expect(diagTomate.agent_causal).toContain("Alternaria solani");
    expect(diagTomate.test_confirmation_terrain).toContain("loupe");
  });

  it("diagnostique le flétrissement bactérien de la tomate sur la tige avec le test du verre d'eau", () => {
    const visualWilt: FoliarImageAnalysisResult = {
      ...dummyVisualResult,
      identifiedOrgan: "tiges",
      measuredMetrics: {
        ...dummyVisualResult.measuredMetrics,
        chlorosisPercent: 2.0,
        necrosisPercent: 25.0,
      },
    };

    const diagWilt = resolveExpertDiagnosisForCrop({
      cropId: "tomate",
      organCode: "tiges",
      visualResult: visualWilt,
    });

    expect(diagWilt.maladie).toContain("Flétrissement bactérien");
    expect(diagWilt.agent_causal).toContain("Ralstonia solanacearum");
    expect(diagWilt.test_confirmation_terrain).toContain("verre d'eau");
  });

  it("diagnostique rigoureusement l'Oignon avec Thrips tabaci ou Alternaria porri", () => {
    const visualOignon: FoliarImageAnalysisResult = {
      ...dummyVisualResult,
      detectedVisualLesions: ["Argenture foliaire et mouchetures blanches"],
      measuredMetrics: {
        ...dummyVisualResult.measuredMetrics,
        chlorosisPercent: 14.0,
        powderyMildewPercent: 0.0,
      },
    };

    const diagOignon = resolveExpertDiagnosisForCrop({
      cropId: "oignon",
      organCode: "feuilles",
      visualResult: visualOignon,
    });

    expect(diagOignon.crop.id).toBe("oignon");
    expect(diagOignon.crop.commonNameFr).toBe("Oignon");
    expect(diagOignon.agent_causal).toContain("Thrips tabaci");
    expect(diagOignon.test_confirmation_terrain).toContain("papier blanc");
  });

  it("diagnostique la filière Avicole / Volaille sans confusion avec le végétal", () => {
    const visualVolaille: FoliarImageAnalysisResult = {
      ...dummyVisualResult,
      identifiedOrgan: "fientes" as any,
      measuredMetrics: {
        ...dummyVisualResult.measuredMetrics,
        rustPustulePercent: 3.5, // imitation coloration sang
      },
    };

    const diagVolaille = resolveExpertDiagnosisForCrop({
      cropId: "volaille",
      organCode: "fientes",
      visualResult: visualVolaille,
    });

    expect(diagVolaille.crop.id).toBe("volaille");
    expect(diagVolaille.crop.domain).toBe("animal");
    expect(diagVolaille.maladie).toContain("Coccidiose");
    expect(diagVolaille.agent_causal).toContain("Eimeria");
    expect(diagVolaille.partie_atteinte).toContain("Fientes");
  });

  it("diagnostique la filière Bovine sans confusion avec le végétal", () => {
    const diagBovin = resolveExpertDiagnosisForCrop({
      cropId: "bovin",
      organCode: "peau",
      visualResult: dummyVisualResult,
    });

    expect(diagBovin.crop.id).toBe("bovin");
    expect(diagBovin.crop.domain).toBe("animal");
    expect(diagBovin.maladie).toContain("Dermatose Nodulaire");
    expect(diagBovin.test_confirmation_terrain).toContain("Palpation");
  });
});
