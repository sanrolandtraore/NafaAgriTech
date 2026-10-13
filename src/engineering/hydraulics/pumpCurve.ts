/**
 * Courbes de pompes centrifuges.
 *
 * Modèle : H(Q) = h0 - r·Q^n  (charge fournie en m, débit en m³/s), c'est le modèle
 * d'EPANET (Rossman, EPANET 2 Users Manual, EPA/600/R-00/057, §3.2 et App. D).
 * - Courbe à 1 point : EPANET impose h0 = 1.33334·H, et un débit maximal à 2·Q.
 * - Courbe à 3 points : (0, h0), (Q2, H2), (Q3, H3), avec h0 > H2 > H3.
 *
 * Les valeurs numériques de catalogue ne sont PAS fournies par ce module : elles
 * doivent venir de la fiche technique du fabricant du modèle de pompe choisi.
 */

export interface CurvePoint {
  /** Débit en m³/s. */
  flowM3s: number;
  /** Charge en m. */
  headM: number;
}

export interface PumpCurve {
  /** Charge à débit nul (m). */
  h0: number;
  r: number;
  n: number;
  /** Débit nominal (point de rendement de référence) en m³/s, utile comme point de départ du solveur. */
  designFlowM3s: number;
  /** Débit maximal où la charge s'annule, en m³/s. */
  maxFlowM3s: number;
  source: "1-point" | "3-points";
}

/** Charge fournie par la pompe à un débit donné (≥ 0). */
export function pumpHeadGain(curve: PumpCurve, flowM3s: number): number {
  const q = Math.max(0, flowM3s);
  return curve.h0 - curve.r * q ** curve.n;
}

export function fitSinglePointCurve(point: CurvePoint): PumpCurve {
  if (!(point.flowM3s > 0) || !(point.headM > 0)) {
    throw new RangeError("Point de fonctionnement de pompe invalide (débit et charge > 0 requis).");
  }
  return fitThreePointCurve(
    [
      { flowM3s: 0, headM: 1.33334 * point.headM },
      { flowM3s: point.flowM3s, headM: point.headM },
      { flowM3s: 2 * point.flowM3s, headM: 0 },
    ],
    "1-point",
  );
}

export function fitThreePointCurve(
  points: [CurvePoint, CurvePoint, CurvePoint],
  source: "1-point" | "3-points" = "3-points",
): PumpCurve {
  const [p1, p2, p3] = points;
  if (p1.flowM3s !== 0) {
    throw new RangeError("Le premier point doit être à débit nul (charge de barbotage).");
  }
  if (!(p1.headM > p2.headM && p2.headM > p3.headM) || !(p2.flowM3s > 0) || !(p3.flowM3s > p2.flowM3s)) {
    throw new RangeError(
      "Courbe de pompe non physique : la charge doit décroître strictement quand le débit croît.",
    );
  }
  const h0 = p1.headM;
  const n = Math.log((h0 - p2.headM) / (h0 - p3.headM)) / Math.log(p2.flowM3s / p3.flowM3s);
  const r = (h0 - p2.headM) / p2.flowM3s ** n;
  if (!(r > 0) || !(n > 0) || n > 20) {
    throw new RangeError(`Ajustement de la courbe de pompe impossible (r = ${r}, n = ${n}).`);
  }
  return {
    h0,
    r,
    n,
    designFlowM3s: p2.flowM3s,
    maxFlowM3s: (h0 / r) ** (1 / n),
    source,
  };
}

/**
 * Perte de charge équivalente d'une pompe pour le solveur de réseau : -H(Q) pour Q ≥ 0.
 * Pour Q < 0 (écoulement inverse, bloqué par le clapet d'une vraie installation), on
 * impose une forte résistance linéaire afin que le solveur ramène le débit vers zéro.
 */
export function pumpLoss(curve: PumpCurve, flowM3s: number): { headLossM: number; gradient: number } {
  if (flowM3s >= 0) {
    const q = flowM3s;
    return {
      headLossM: -(curve.h0 - curve.r * q ** curve.n),
      gradient: Math.max(curve.r * curve.n * Math.max(q, 1e-9) ** (curve.n - 1), 1e-9),
    };
  }
  const BIG = 1e8;
  return { headLossM: -curve.h0 + BIG * flowM3s, gradient: BIG };
}
