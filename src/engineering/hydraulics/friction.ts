/**
 * Pertes de charge linéaires et singulières en conduite circulaire pleine.
 *
 * Références :
 * - Darcy-Weisbach : h = f (L/D) v²/(2g).
 * - Colebrook C. F. (1939), "Turbulent flow in pipes, with particular reference to
 *   the transition region between the smooth and rough pipe laws",
 *   J. Inst. Civil Eng. 11, 133-156. Résolution exacte par méthode de Newton.
 * - Swamee P. K., Jain A. K. (1976), "Explicit equations for pipe-flow problems",
 *   J. Hydraul. Div. ASCE 102(5), 657-664. Formule utilisée par EPANET 2.
 * - Zone de transition 2000 < Re < 4000 : interpolation cubique de Dunlop (1991),
 *   identique à EPANET 2.2 (Rossman L. A. et al., EPANET 2.2 User Manual, EPA/600/R-20/133).
 * - Hazen-Williams : coefficient converti exactement depuis la forme américaine
 *   d'EPANET (4.727 en ft et cfs) pour une concordance numérique stricte.
 */

import { GRAVITY } from "./waterProperties";

export type FrictionModel = "colebrook" | "swamee-jain";
export type FlowRegime = "laminaire" | "transition" | "turbulent";

const FT = 0.3048;
const CFS = FT ** 3;

/** Coefficient Hazen-Williams SI équivalent exact à celui d'EPANET (≈ 10.66). */
export const HAZEN_WILLIAMS_SI_COEFFICIENT =
  4.727 * FT ** 4.871 * CFS ** -1.852;

export const HAZEN_WILLIAMS_FLOW_EXPONENT = 1.852;
export const HAZEN_WILLIAMS_DIAMETER_EXPONENT = 4.871;

export function pipeArea(diameterM: number): number {
  return (Math.PI * diameterM * diameterM) / 4;
}

export function reynoldsNumber(
  flowM3s: number,
  diameterM: number,
  kinematicViscosity: number,
): number {
  const v = Math.abs(flowM3s) / pipeArea(diameterM);
  return (v * diameterM) / kinematicViscosity;
}

export function flowRegime(re: number): FlowRegime {
  if (re < 2000) return "laminaire";
  if (re < 4000) return "transition";
  return "turbulent";
}

/** Swamee-Jain (explicite). Valide pour 5e3 ≤ Re ≤ 1e8 et 1e-6 ≤ ε/D ≤ 1e-2. */
export function swameeJainFactor(re: number, relativeRoughness: number): number {
  const y = relativeRoughness / 3.7 + 5.74 / re ** 0.9;
  const l = Math.log10(y);
  return 0.25 / (l * l);
}

/**
 * Colebrook-White résolu par Newton sur x = 1/√f :
 * F(x) = x + 2 log10(ε/(3.7D) + 2.51 x / Re) = 0
 */
export function colebrookFactor(re: number, relativeRoughness: number): number {
  const a = relativeRoughness / 3.7;
  const b = 2.51 / re;
  let x = 1 / Math.sqrt(swameeJainFactor(re, relativeRoughness));
  for (let i = 0; i < 50; i++) {
    const inner = a + b * x;
    const fx = x + 2 * Math.log10(inner);
    const dfx = 1 + (2 * b) / (inner * Math.LN10);
    const dx = fx / dfx;
    x -= dx;
    if (Math.abs(dx) < 1e-14 * Math.abs(x)) break;
  }
  return 1 / (x * x);
}

/** Résidu de l'équation de Colebrook, utilisé pour les contrôles de qualité. */
export function colebrookResidual(f: number, re: number, relativeRoughness: number): number {
  return (
    1 / Math.sqrt(f) +
    2 * Math.log10(relativeRoughness / 3.7 + 2.51 / (re * Math.sqrt(f)))
  );
}

/**
 * Facteur de frottement de Darcy pour tous les régimes.
 * La zone de transition reprend l'interpolation cubique d'EPANET 2.2, qui
 * raccorde 64/Re (Re = 2000) à la loi turbulente choisie (Re = 4000).
 */
export function darcyFrictionFactor(
  re: number,
  relativeRoughness: number,
  model: FrictionModel = "colebrook",
): number {
  if (!(re > 0)) return 0;
  if (re < 2000) return 64 / re;
  const turbulent = (r: number) =>
    model === "colebrook"
      ? colebrookFactor(r, relativeRoughness)
      : swameeJainFactor(r, relativeRoughness);
  if (re >= 4000) return turbulent(re);

  if (model === "swamee-jain") {
    // Formule EPANET 2.2 (hydcoeffs.c) : polynôme cubique en r = Re/2000.
    const AB = 5.74 / 4000 ** 0.9;
    const A9 = -2 / Math.LN10;
    const AC = -2 * 0.9 * 2 / Math.LN10 * AB;
    const y2 = relativeRoughness / 3.7 + AB;
    const y3 = A9 * Math.log(y2);
    const fa = 1 / (y3 * y3);
    const fb = (2 + AC / (y2 * y3)) * fa;
    const r = re / 2000;
    const x1 = 7 * fa - fb;
    const x2 = 0.128 - 17 * fa + 2.5 * fb;
    const x3 = -0.128 + 13 * fa - 2 * fb;
    const x4 = r * (0.032 - 3 * fa + 0.5 * fb);
    return x1 + r * (x2 + r * (x3 + x4));
  }

  // Colebrook : interpolation cubique d'Hermite en Re entre 64/Re et Colebrook(4000),
  // avec pentes exactes aux deux bornes (continuité C¹).
  const f0 = 64 / 2000;
  const d0 = -64 / (2000 * 2000);
  const f1 = turbulent(4000);
  const h = 1e-3 * 4000;
  const d1 = (turbulent(4000 + h) - f1) / h;
  const t = (re - 2000) / 2000;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * f0 +
    (t3 - 2 * t2 + t) * 2000 * d0 +
    (-2 * t3 + 3 * t2) * f1 +
    (t3 - t2) * 2000 * d1
  );
}

export interface PipeLossInput {
  flowM3s: number;
  lengthM: number;
  diameterM: number;
  kinematicViscosity: number;
  /** Rugosité absolue en mm (Darcy-Weisbach) ou coefficient C (Hazen-Williams). */
  roughness: number;
  formula: "D-W" | "H-W";
  frictionModel?: FrictionModel;
  /** Accélération de la pesanteur (m/s²). Défaut : valeur normale 9.80665. */
  gravity?: number;
}

export interface PipeLossResult {
  headLossM: number;
  /** Dérivée dh/dQ (m par m³/s), utilisée par le solveur de réseau. */
  gradient: number;
  velocity: number;
  reynolds: number;
  frictionFactor: number | null;
  regime: FlowRegime;
}

/**
 * Perte de charge linéaire signée (même signe que le débit) et son gradient.
 * Le gradient est n·h/Q (n = 1 en laminaire, 2 en turbulent pour D-W, 1.852 pour H-W),
 * avec un plancher numérique pour les débits quasi nuls.
 */
export function pipeFrictionLoss(input: PipeLossInput): PipeLossResult {
  const { flowM3s, lengthM, diameterM, kinematicViscosity, roughness, formula } = input;
  const q = Math.abs(flowM3s);
  const sign = flowM3s < 0 ? -1 : 1;
  const area = pipeArea(diameterM);
  const velocity = q / area;
  const reynolds = (velocity * diameterM) / kinematicViscosity;
  const regime = flowRegime(reynolds);
  const qFloor = 1e-9;

  if (formula === "H-W") {
    const r =
      (HAZEN_WILLIAMS_SI_COEFFICIENT * lengthM) /
      (roughness ** HAZEN_WILLIAMS_FLOW_EXPONENT *
        diameterM ** HAZEN_WILLIAMS_DIAMETER_EXPONENT);
    const qe = Math.max(q, qFloor);
    const h = r * q ** HAZEN_WILLIAMS_FLOW_EXPONENT;
    const gradient = HAZEN_WILLIAMS_FLOW_EXPONENT * r * qe ** (HAZEN_WILLIAMS_FLOW_EXPONENT - 1);
    return { headLossM: sign * h, gradient, velocity, reynolds, frictionFactor: null, regime };
  }

  const relRough = roughness / 1000 / diameterM;
  const g = input.gravity ?? GRAVITY;
  const k = (8 * lengthM) / (Math.PI * Math.PI * g * diameterM ** 5);
  if (q < qFloor) {
    // Limite laminaire : h = 128 ν L Q / (π g D⁴), gradient constant.
    const lam = (128 * kinematicViscosity * lengthM) / (Math.PI * g * diameterM ** 4);
    return {
      headLossM: sign * lam * q,
      gradient: lam,
      velocity,
      reynolds,
      frictionFactor: reynolds > 0 ? 64 / reynolds : null,
      regime: "laminaire",
    };
  }
  const f = darcyFrictionFactor(reynolds, relRough, input.frictionModel ?? "colebrook");
  const h = f * k * q * q;
  const n = regime === "laminaire" ? 1 : 2;
  return { headLossM: sign * h, gradient: (n * h) / q, velocity, reynolds, frictionFactor: f, regime };
}

/** Perte singulière h = K v²/(2g), signée, et son gradient. */
export function minorLoss(
  flowM3s: number,
  diameterM: number,
  kTotal: number,
  gravity: number = GRAVITY,
): { headLossM: number; gradient: number } {
  if (kTotal <= 0) return { headLossM: 0, gradient: 0 };
  const m = (8 * kTotal) / (Math.PI * Math.PI * gravity * diameterM ** 4);
  const q = Math.abs(flowM3s);
  return { headLossM: Math.sign(flowM3s) * m * q * q, gradient: 2 * m * Math.max(q, 1e-9) };
}

/**
 * Coefficients K de pertes singulières.
 * Source : Idelchik I. E., "Handbook of Hydraulic Resistance", 3e éd. (1994) et
 * Crane Co., "Flow of Fluids Through Valves, Fittings and Pipe", TP-410 (2009),
 * valeurs médianes pour raccords de petits diamètres (DN 20-110).
 */
export const FITTING_K: Readonly<Record<string, { k: number; label: string }>> = {
  coude_90_standard: { k: 0.9, label: "Coude 90° standard" },
  coude_90_grand_rayon: { k: 0.45, label: "Coude 90° grand rayon" },
  coude_45: { k: 0.4, label: "Coude 45°" },
  te_passage_direct: { k: 0.4, label: "Té, passage direct" },
  te_derivation: { k: 1.3, label: "Té, dérivation" },
  vanne_opercule_ouverte: { k: 0.15, label: "Vanne à opercule ouverte" },
  vanne_papillon_ouverte: { k: 0.8, label: "Vanne papillon ouverte" },
  vanne_a_bille_ouverte: { k: 0.05, label: "Vanne à bille ouverte" },
  clapet_anti_retour_battant: { k: 2.0, label: "Clapet anti-retour à battant" },
  crepine_avec_clapet: { k: 7.0, label: "Crépine avec clapet de pied" },
  entree_franche: { k: 0.5, label: "Entrée franche (réservoir → conduite)" },
  sortie_libre: { k: 1.0, label: "Sortie dans un réservoir" },
};
