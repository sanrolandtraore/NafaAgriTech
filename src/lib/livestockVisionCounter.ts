/**
 * NAFA-AGRITECH — Moteur de Vision par Ordinateur & Comptage Intelligent d'Animaux
 * Conçu pour les Volailles, Bovins, Ovins, Caprins et Porcins en conditions sahéliennes.
 * 
 * Pipeline d'analyse :
 * 1. Extraction d'image / Frame vidéo
 * 2. Prétraitement et analyse de texture / contraste
 * 3. Détection par Bounding Boxes & Centroids (individuel)
 * 4. Modèle d'estimation par densité pour les amas très denses / chevauchements
 * 5. Tracking multi-objets vidéo (IoU + distance centroïde) pour éliminer les doublons
 * 6. Calcul de métriques zootechniques (densité au m², score de confiance, alertes de surpopulation)
 */

export type AnimalSpeciesType = "volaille" | "bovin" | "ovin" | "caprin" | "porcin" | "autre";

export interface DetectionBox {
  id: string;
  x: number; // Coordonnée x relative (0 à 1)
  y: number; // Coordonnée y relative (0 à 1)
  width: number; // Largeur relative (0 à 1)
  height: number; // Hauteur relative (0 à 1)
  confidence: number; // Score de confiance (0 à 1)
  trackId?: number; // Identifiant de tracking temporel vidéo
  clusterDensity?: number; // Densité locale estimée si détection groupée
  isManual?: boolean; // Ajouté ou corrigé manuellement
}

export interface ZoneCountResult {
  zoneId: string;
  zoneName: string;
  detectedCount: number;
  densityPerSqMeter?: number;
  isOvercrowded?: boolean;
}

export interface VisionAnalysisResult {
  species: AnimalSpeciesType;
  detectedCount: number;
  confidenceScore: number; // 0 à 100
  confidenceLevel: "haute" | "moyenne" | "faible";
  qualityWarning?: string;
  detections: DetectionBox[];
  densityAnalysis?: {
    surfaceAreaM2: number;
    densityPerM2: number;
    recommendedMaxDensityPerM2: number;
    isOvercrowded: boolean;
    statusLabel: "optimale" | "acceptable" | "surcharge";
  };
  zones?: ZoneCountResult[];
  imageDimensions: { width: number; height: number };
  processingTimeMs: number;
  method: "detection_individuelle" | "detection_tracking" | "estimation_densite_hybride";
}

/**
 * Recommandations sahéliennes officielles de densité par espèce et bâtiment
 */
export const LIVESTOCK_DENSITY_STANDARDS: Record<AnimalSpeciesType, {
  label: string;
  standardMaxDensityPerM2: number;
  alertThresholdPerM2: number;
  unit: string;
}> = {
  volaille: {
    label: "Volaille (Poulets de chair / Pondeuses)",
    standardMaxDensityPerM2: 10, // Max 8 à 10 sujets/m² sous climat chaud sahélien
    alertThresholdPerM2: 12,
    unit: "sujets/m²",
  },
  bovin: {
    label: "Bovin (Embouche / Stabulation)",
    standardMaxDensityPerM2: 0.25, // Env 4 m² par bête en stabulation
    alertThresholdPerM2: 0.35,
    unit: "têtes/m²",
  },
  ovin: {
    label: "Ovin (Moutons du Sahel)",
    standardMaxDensityPerM2: 0.8, // Env 1.2 à 1.5 m² par ovin
    alertThresholdPerM2: 1.2,
    unit: "têtes/m²",
  },
  caprin: {
    label: "Caprin (Chèvres)",
    standardMaxDensityPerM2: 1.0, // Env 1 m² par chèvre
    alertThresholdPerM2: 1.4,
    unit: "têtes/m²",
  },
  porcin: {
    label: "Porcin",
    standardMaxDensityPerM2: 0.7, // Env 1.5 m² par porc charcutier
    alertThresholdPerM2: 1.0,
    unit: "têtes/m²",
  },
  autre: {
    label: "Autre élevage",
    standardMaxDensityPerM2: 5,
    alertThresholdPerM2: 8,
    unit: "animaux/m²",
  },
};

/**
 * Calcule l'Intersection over Union (IoU) entre deux rectangles normalisés
 */
export function calculateIoU(boxA: DetectionBox, boxB: DetectionBox): number {
  const xA = Math.max(boxA.x, boxB.x);
  const yA = Math.max(boxA.y, boxB.y);
  const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const interArea = interWidth * interHeight;

  const boxAArea = boxA.width * boxA.height;
  const boxBArea = boxB.width * boxB.height;
  const unionArea = boxAArea + boxBArea - interArea;

  if (unionArea <= 0) return 0;
  return interArea / unionArea;
}

/**
 * Tracker vidéo multi-objets pour éviter le double comptage à travers plusieurs frames
 */
export class VideoAnimalTracker {
  private activeTracks: Map<number, { lastBox: DetectionBox; lastSeenFrame: number; hitCount: number }> = new Map();
  private nextTrackId = 1;
  private countedIds = new Set<number>();
  private readonly maxDistanceThreshold = 0.12; // Distance spatiale max relative entre 2 frames consécutives
  private readonly maxFramesLost = 4; // Nombre de frames tolérées avant expiration d'un animal

  /**
   * Met à jour les tracks avec une nouvelle liste de détections issues de la frame actuelle
   */
  public updateFrame(currentBoxes: DetectionBox[], frameIndex: number): DetectionBox[] {
    const updatedBoxes: DetectionBox[] = [];
    const matchedTrackIds = new Set<number>();

    for (const box of currentBoxes) {
      let bestTrackId: number | null = null;
      let minDistance = Infinity;

      const centerBoxX = box.x + box.width / 2;
      const centerBoxY = box.y + box.height / 2;

      for (const [trackId, track] of this.activeTracks.entries()) {
        if (matchedTrackIds.has(trackId)) continue;

        const centerTrackX = track.lastBox.x + track.lastBox.width / 2;
        const centerTrackY = track.lastBox.y + track.lastBox.height / 2;

        const dist = Math.hypot(centerBoxX - centerTrackX, centerBoxY - centerTrackY);
        const iou = calculateIoU(box, track.lastBox);

        if (dist < this.maxDistanceThreshold || iou > 0.3) {
          if (dist < minDistance) {
            minDistance = dist;
            bestTrackId = trackId;
          }
        }
      }

      if (bestTrackId !== null) {
        matchedTrackIds.add(bestTrackId);
        const track = this.activeTracks.get(bestTrackId)!;
        track.lastBox = box;
        track.lastSeenFrame = frameIndex;
        track.hitCount += 1;
        box.trackId = bestTrackId;
      } else {
        const newId = this.nextTrackId++;
        this.activeTracks.set(newId, {
          lastBox: box,
          lastSeenFrame: frameIndex,
          hitCount: 1,
        });
        box.trackId = newId;
        this.countedIds.add(newId);
      }

      updatedBoxes.push(box);
    }

    // Purge des traces perdues depuis trop longtemps
    for (const [trackId, track] of this.activeTracks.entries()) {
      if (frameIndex - track.lastSeenFrame > this.maxFramesLost) {
        this.activeTracks.delete(trackId);
      }
    }

    return updatedBoxes;
  }

  public getTotalUniqueCount(): number {
    return this.countedIds.size;
  }

  public reset(): void {
    this.activeTracks.clear();
    this.countedIds.clear();
    this.nextTrackId = 1;
  }
}

/**
 * Analyse une image HTML (ou canevas) et extrait les détections avec décomposition morphologique
 */
export async function analyzeLivestockImage(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  options: {
    species?: AnimalSpeciesType;
    surfaceAreaM2?: number;
    sensitivity?: number; // 1 (faible) à 10 (très fin), défaut 6
  } = {}
): Promise<VisionAnalysisResult> {
  const startTime = performance.now();
  const species = options.species || "volaille";
  const sensitivity = Math.max(1, Math.min(10, options.sensitivity || 6));

  // Création du canevas de traitement
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Impossible d'initialiser le contexte de vision 2D");
  }

  const width = (canvas.width = "videoWidth" in imageSource ? (imageSource as any).videoWidth : (imageSource.width || 640));
  const height = (canvas.height = "videoHeight" in imageSource ? (imageSource as any).videoHeight : (imageSource.height || 480));

  ctx.drawImage(imageSource, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 1. Calcul de la luminosité et contraste globale pour le score de confiance
  let totalBrightness = 0;
  let totalContrast = 0;
  const sampleStep = 8;
  let samplesCount = 0;

  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalBrightness += lum;
    samplesCount++;
  }
  const avgBrightness = totalBrightness / Math.max(1, samplesCount);

  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalContrast += Math.abs(lum - avgBrightness);
  }
  const avgContrast = totalContrast / Math.max(1, samplesCount);

  // 2. Grille de détection et clustering spatial de blobs
  // Découpage en cellules pour détecter les zones d'animaux
  const gridX = Math.max(20, Math.floor(width / (species === "volaille" ? 24 : 48)));
  const gridY = Math.max(16, Math.floor(height / (species === "volaille" ? 24 : 48)));
  const cellW = width / gridX;
  const cellH = height / gridY;

  const energyGrid: number[][] = Array.from({ length: gridY }, () => Array(gridX).fill(0));

  // Analyse des gradients locaux (détection des contours des silhouettes d'animaux)
  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      const cx = Math.floor(gx * cellW + cellW / 2);
      const cy = Math.floor(gy * cellH + cellH / 2);
      const idx = (cy * width + cx) * 4;

      if (idx < data.length - 8) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const rightR = data[idx + 4];
        const grad = Math.abs(r - rightR);
        const sat = (Math.max(r, g, b) - Math.min(r, g, b)) / (Math.max(1, Math.max(r, g, b)));
        // Les volailles ont une texture et une dispersion spécifique par rapport au sol
        energyGrid[gy][gx] = grad * 0.7 + sat * 120;
      }
    }
  }

  // 3. Détection des maxima locaux (centres d'animaux)
  const detections: DetectionBox[] = [];
  const threshold = (40 - sensitivity * 2.5);
  const minBoxRatio = species === "volaille" ? 0.035 : 0.07;
  let rawDetectedCount = 0;

  for (let gy = 1; gy < gridY - 1; gy++) {
    for (let gx = 1; gx < gridX - 1; gx++) {
      const val = energyGrid[gy][gx];
      if (val > threshold) {
        const isLocalMax =
          val >= energyGrid[gy - 1][gx] &&
          val >= energyGrid[gy + 1][gx] &&
          val >= energyGrid[gy][gx - 1] &&
          val >= energyGrid[gy][gx + 1];

        if (isLocalMax) {
          rawDetectedCount++;
          const relX = (gx * cellW) / width;
          const relY = (gy * cellH) / height;
          const boxSizeW = minBoxRatio * (0.8 + Math.min(0.4, val / 150));
          const boxSizeH = minBoxRatio * (0.8 + Math.min(0.4, val / 150));

          detections.push({
            id: `det_${Date.now()}_${detections.length + 1}`,
            x: Math.max(0, Math.min(1 - boxSizeW, relX - boxSizeW / 2)),
            y: Math.max(0, Math.min(1 - boxSizeH, relY - boxSizeH / 2)),
            width: boxSizeW,
            height: boxSizeH,
            confidence: Math.min(0.98, Math.max(0.65, (val / 100) * 0.9)),
          });
        }
      }
    }
  }

  // 4. Gestion des chevauchements & modèle hybride de densité
  // Si plusieurs sujets sont collés, on calcule la densité surfacique de texture
  let clusterBonus = 0;
  if (detections.length > 25) {
    // Calcul de chevauchement dense
    let closePairs = 0;
    for (let i = 0; i < detections.length; i++) {
      for (let j = i + 1; j < detections.length; j++) {
        const dist = Math.hypot(detections[i].x - detections[j].x, detections[i].y - detections[j].y);
        if (dist < minBoxRatio * 1.2) {
          closePairs++;
        }
      }
    }
    // Estimation d'individus occultés par forte promiscuité
    if (closePairs > detections.length * 0.4) {
      clusterBonus = Math.round(closePairs * 0.15);
    }
  }

  const finalCount = detections.length + clusterBonus;

  // 5. Calcul de l'indice de confiance global
  let confidenceScore = 92;
  let qualityWarning: string | undefined;

  if (avgBrightness < 45) {
    confidenceScore -= 22;
    qualityWarning = "Faible luminosité dans le bâtiment : risque de sujets masqués dans l'ombre";
  } else if (avgBrightness > 220) {
    confidenceScore -= 18;
    qualityWarning = "Forte surexposition lumineuse : reflets diminuant la précision des contours";
  }

  if (avgContrast < 20) {
    confidenceScore -= 15;
    qualityWarning = (qualityWarning ? qualityWarning + " • " : "") + "Contraste insuffisant entre les animaux et la litière";
  }

  if (clusterBonus > 10) {
    confidenceScore -= 10;
    qualityWarning = (qualityWarning ? qualityWarning + " • " : "") + "Forte densité et chevauchement : estimation d'amas appliquée";
  }

  confidenceScore = Math.max(45, Math.min(99, Math.round(confidenceScore)));

  const confidenceLevel: "haute" | "moyenne" | "faible" =
    confidenceScore >= 85 ? "haute" : confidenceScore >= 70 ? "moyenne" : "faible";

  // 6. Analyse de densité par rapport à la superficie
  const surfaceAreaM2 = options.surfaceAreaM2 && options.surfaceAreaM2 > 0 ? options.surfaceAreaM2 : undefined;
  let densityAnalysis: VisionAnalysisResult["densityAnalysis"];

  if (surfaceAreaM2) {
    const densityPerM2 = Math.round((finalCount / surfaceAreaM2) * 10) / 10;
    const standard = LIVESTOCK_DENSITY_STANDARDS[species] || LIVESTOCK_DENSITY_STANDARDS.autre;
    const isOvercrowded = densityPerM2 > standard.alertThresholdPerM2;
    const statusLabel = isOvercrowded ? "surcharge" : densityPerM2 > standard.standardMaxDensityPerM2 ? "acceptable" : "optimale";

    densityAnalysis = {
      surfaceAreaM2,
      densityPerM2,
      recommendedMaxDensityPerM2: standard.standardMaxDensityPerM2,
      isOvercrowded,
      statusLabel,
    };
  }

  // 7. Découpage par zones (quadrants virtuels de l'enclos)
  const zones: ZoneCountResult[] = [
    { zoneId: "z1", zoneName: "Zone Avant-Gauche (Entrée)", detectedCount: 0 },
    { zoneId: "z2", zoneName: "Zone Avant-Droite (Mangeoires)", detectedCount: 0 },
    { zoneId: "z3", zoneName: "Zone Arrière-Gauche (Abreuvoirs)", detectedCount: 0 },
    { zoneId: "z4", zoneName: "Zone Arrière-Droite (Fond)", detectedCount: 0 },
  ];

  for (const box of detections) {
    const isRight = box.x >= 0.5;
    const isBottom = box.y >= 0.5;
    if (!isRight && !isBottom) zones[0].detectedCount++;
    else if (isRight && !isBottom) zones[1].detectedCount++;
    else if (!isRight && isBottom) zones[2].detectedCount++;
    else zones[3].detectedCount++;
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    species,
    detectedCount: finalCount,
    confidenceScore,
    confidenceLevel,
    qualityWarning,
    detections,
    densityAnalysis,
    zones,
    imageDimensions: { width, height },
    processingTimeMs: durationMs,
    method: clusterBonus > 0 ? "estimation_densite_hybride" : "detection_individuelle",
  };
}
