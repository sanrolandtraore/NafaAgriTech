/**
 * Solveur hydraulique de réseaux maillés et ramifiés en régime permanent.
 *
 * Méthode : gradient global (Todini E., Pilati S., 1988, "A gradient algorithm for
 * the analysis of pipe networks", in Computer Applications in Water Supply, vol. 1,
 * Wiley), identique à celle d'EPANET 2 (Rossman L. A., EPANET 2 Users Manual,
 * EPA/600/R-00/057). À chaque itération on linéarise les pertes de charge de
 * chaque tronçon, on résout le système symétrique défini positif en charges aux
 * nœuds, puis on met à jour les débits.
 *
 * Limites actuelles (documentées, pas masquées) :
 * - régime permanent, un seul instant ;
 * - tronçons : conduites et pompes à courbe Q-H (les vannes de régulation viennent ensuite) ;
 * - résolution du système linéaire par élimination de Gauss dense : adaptée aux
 *   réseaux d'irrigation jusqu'à quelques centaines de nœuds.
 */

import { GRAVITY } from "./waterProperties";
import { minorLoss, pipeArea, pipeFrictionLoss, type FrictionModel } from "./friction";
import { pumpLoss, type PumpCurve } from "./pumpCurve";
import { createProvenance, type Provenance } from "../provenance";

export interface JunctionNode {
  id: string;
  type: "junction";
  /** Cote du terrain en m (informative : les charges sont des charges piézométriques). */
  elevation: number;
  /** Demande en m³/s (positive = soutirage). */
  demandM3s: number;
}

export interface ReservoirNode {
  id: string;
  type: "reservoir";
  /** Charge piézométrique fixe en m. */
  head: number;
}

export type NetworkNode = JunctionNode | ReservoirNode;

export interface PipeLink {
  id: string;
  from: string;
  to: string;
  lengthM: number;
  /** Diamètre intérieur en m. */
  diameterM: number;
  /** Rugosité absolue en mm (D-W) ou coefficient C (H-W). */
  roughness: number;
  /** Somme des coefficients de pertes singulières K du tronçon. */
  minorK?: number;
}

export interface PumpLink {
  id: string;
  /** Nœud d'aspiration. */
  from: string;
  /** Nœud de refoulement. */
  to: string;
  curve: PumpCurve;
}

export interface NetworkModel {
  nodes: NetworkNode[];
  pipes: PipeLink[];
  pumps?: PumpLink[];
  formula: "D-W" | "H-W";
  frictionModel?: FrictionModel;
  /** Viscosité cinématique en m²/s (voir waterProperties). */
  kinematicViscosity: number;
  gravity?: number;
}

export interface PumpResult {
  id: string;
  /** Débit au point de fonctionnement (m³/s). */
  flowM3s: number;
  /** Charge fournie au point de fonctionnement (m). */
  headGainM: number;
  designFlowM3s: number;
  flowRatioToDesign: number;
  warnings: string[];
}

export interface SolverOptions {
  /** Critère : Σ|ΔQ| / Σ|Q| (EPANET : 1e-3 par défaut). */
  accuracy?: number;
  maxIterations?: number;
}

export interface NodeResult {
  id: string;
  head: number;
  pressureHead: number;
}

export interface PipeResult {
  id: string;
  /** Débit en m³/s, positif de `from` vers `to`. */
  flowM3s: number;
  velocity: number;
  headLossM: number;
  /** Perte de charge unitaire en m/km. */
  headLossPerKm: number;
  reynolds: number;
  frictionFactor: number | null;
  regime: string;
}

export interface NetworkSolution {
  converged: boolean;
  iterations: number;
  relativeError: number;
  /** Plus grand défaut de continuité aux nœuds, en m³/s, après convergence. */
  maxContinuityResidualM3s: number;
  nodes: NodeResult[];
  pipes: PipeResult[];
  pumps: PumpResult[];
  provenance: Provenance;
}

/** Résout A x = b par élimination de Gauss avec pivot partiel. A est modifiée. */
export function solveDenseLinearSystem(a: number[][], b: number[]): number[] {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    let best = Math.abs(a[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(a[r][col]);
      if (v > best) {
        best = v;
        pivot = r;
      }
    }
    if (best < 1e-300) {
      throw new Error(
        "Réseau singulier : au moins une portion n'est reliée à aucun réservoir (charge indéterminée).",
      );
    }
    if (pivot !== col) {
      [a[pivot], a[col]] = [a[col], a[pivot]];
      [b[pivot], b[col]] = [b[col], b[pivot]];
    }
    const diag = a[col][col];
    for (let r = col + 1; r < n; r++) {
      const factor = a[r][col] / diag;
      if (factor === 0) continue;
      for (let c = col; c < n; c++) a[r][c] -= factor * a[col][c];
      b[r] -= factor * b[col];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = b[r];
    for (let c = r + 1; c < n; c++) sum -= a[r][c] * x[c];
    x[r] = sum / a[r][r];
  }
  return x;
}

export function validateNetwork(model: NetworkModel): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const n of model.nodes) {
    if (ids.has(n.id)) errors.push(`Identifiant de nœud dupliqué : ${n.id}`);
    ids.add(n.id);
  }
  if (!model.nodes.some((n) => n.type === "reservoir")) {
    errors.push("Aucun réservoir ou source à charge fixe : le réseau n'a pas de référence de pression.");
  }
  const linkIds = new Set<string>();
  for (const p of model.pipes) {
    if (linkIds.has(p.id)) errors.push(`Identifiant de conduite dupliqué : ${p.id}`);
    linkIds.add(p.id);
    if (!ids.has(p.from) || !ids.has(p.to)) errors.push(`Conduite ${p.id} : nœud inconnu.`);
    if (p.from === p.to) errors.push(`Conduite ${p.id} : départ et arrivée identiques.`);
    if (!(p.lengthM > 0)) errors.push(`Conduite ${p.id} : longueur invalide.`);
    if (!(p.diameterM > 0)) errors.push(`Conduite ${p.id} : diamètre invalide.`);
    if (!(p.roughness > 0)) errors.push(`Conduite ${p.id} : rugosité invalide.`);
  }
  for (const pu of model.pumps ?? []) {
    if (linkIds.has(pu.id)) errors.push(`Identifiant de tronçon dupliqué : ${pu.id}`);
    linkIds.add(pu.id);
    if (!ids.has(pu.from) || !ids.has(pu.to)) errors.push(`Pompe ${pu.id} : nœud inconnu.`);
    if (pu.from === pu.to) errors.push(`Pompe ${pu.id} : aspiration et refoulement identiques.`);
  }
  // Connexité : tout nœud doit être relié à un réservoir.
  const adj = new Map<string, string[]>();
  for (const n of model.nodes) adj.set(n.id, []);
  for (const p of [...model.pipes, ...(model.pumps ?? [])]) {
    adj.get(p.from)?.push(p.to);
    adj.get(p.to)?.push(p.from);
  }
  const seen = new Set<string>();
  const stack = model.nodes.filter((n) => n.type === "reservoir").map((n) => n.id);
  stack.forEach((s) => seen.add(s));
  while (stack.length) {
    const cur = stack.pop()!;
    for (const nb of adj.get(cur) ?? []) {
      if (!seen.has(nb)) {
        seen.add(nb);
        stack.push(nb);
      }
    }
  }
  for (const n of model.nodes) {
    if (!seen.has(n.id)) errors.push(`Nœud ${n.id} non relié à une source.`);
  }
  return errors;
}

export function solveNetwork(model: NetworkModel, options: SolverOptions = {}): NetworkSolution {
  const errors = validateNetwork(model);
  if (errors.length) throw new Error(`Réseau invalide :\n- ${errors.join("\n- ")}`);

  const accuracy = options.accuracy ?? 1e-8;
  const maxIter = options.maxIterations ?? 200;
  const g = model.gravity ?? GRAVITY;
  const nu = model.kinematicViscosity;

  const index = new Map<string, number>();
  model.nodes.forEach((n, i) => index.set(n.id, i));
  const junctionIdx: number[] = [];
  const unknownOf = new Map<number, number>();
  model.nodes.forEach((n, i) => {
    if (n.type === "junction") {
      unknownOf.set(i, junctionIdx.length);
      junctionIdx.push(i);
    }
  });
  const nUnknown = junctionIdx.length;

  const heads = model.nodes.map((n) => (n.type === "reservoir" ? n.head : 0));
  // Charge initiale : moyenne des réservoirs (point de départ raisonnable).
  const resHeads = model.nodes.filter((n): n is ReservoirNode => n.type === "reservoir").map((n) => n.head);
  const meanHead = resHeads.reduce((s, h) => s + h, 0) / resHeads.length;
  model.nodes.forEach((n, i) => {
    if (n.type === "junction") heads[i] = meanHead;
  });

  const nPipes = model.pipes.length;
  const pumpList = model.pumps ?? [];
  const nLinks = nPipes + pumpList.length;
  const from = [...model.pipes.map((p) => index.get(p.from)!), ...pumpList.map((p) => index.get(p.from)!)];
  const to = [...model.pipes.map((p) => index.get(p.to)!), ...pumpList.map((p) => index.get(p.to)!)];
  // Débits initiaux : 1 ft/s en conduite, débit nominal en pompe, comme EPANET (sans effet sur la solution).
  const flows = [
    ...model.pipes.map((p) => pipeArea(p.diameterM) * 0.3048),
    ...pumpList.map((p) => p.curve.designFlowM3s),
  ];

  const demand = model.nodes.map((n) => (n.type === "junction" ? n.demandM3s : 0));

  const evalPipe = (k: number, q: number) => {
    const p = model.pipes[k];
    const fr = pipeFrictionLoss({
      flowM3s: q,
      lengthM: p.lengthM,
      diameterM: p.diameterM,
      kinematicViscosity: nu,
      roughness: p.roughness,
      formula: model.formula,
      frictionModel: model.frictionModel,
      gravity: g,
    });
    const mn = minorLoss(q, p.diameterM, p.minorK ?? 0, g);
    return { h: fr.headLossM + mn.headLossM, grad: Math.max(fr.gradient + mn.gradient, 1e-12), fr };
  };

  const evalLink = (k: number, q: number): { h: number; grad: number } => {
    if (k < nPipes) {
      const r = evalPipe(k, q);
      return { h: r.h, grad: r.grad };
    }
    const pl = pumpLoss(pumpList[k - nPipes].curve, q);
    return { h: pl.headLossM, grad: pl.gradient };
  };

  let iterations = 0;
  let relErr = Infinity;
  let converged = false;

  while (iterations < maxIter) {
    iterations++;
    const a: number[][] = Array.from({ length: nUnknown }, () => new Array<number>(nUnknown).fill(0));
    const rhs = new Array<number>(nUnknown).fill(0);
    for (let u = 0; u < nUnknown; u++) rhs[u] = -demand[junctionIdx[u]];

    const pk = new Array<number>(nLinks);
    const yk = new Array<number>(nLinks);
    for (let k = 0; k < nLinks; k++) {
      const { h, grad } = evalLink(k, flows[k]);
      const p = 1 / grad;
      pk[k] = p;
      yk[k] = p * h;
      const i1 = from[k];
      const i2 = to[k];
      const u1 = unknownOf.get(i1);
      const u2 = unknownOf.get(i2);
      const qy = flows[k] - yk[k];
      if (u2 !== undefined) {
        rhs[u2] += qy;
        a[u2][u2] += p;
        if (u1 !== undefined) a[u2][u1] -= p;
        else rhs[u2] += p * heads[i1];
      }
      if (u1 !== undefined) {
        rhs[u1] -= qy;
        a[u1][u1] += p;
        if (u2 !== undefined) a[u1][u2] -= p;
        else rhs[u1] += p * heads[i2];
      }
    }

    if (nUnknown > 0) {
      const sol = solveDenseLinearSystem(a, rhs);
      for (let u = 0; u < nUnknown; u++) heads[junctionIdx[u]] = sol[u];
    }

    let sumDq = 0;
    let sumQ = 0;
    for (let k = 0; k < nLinks; k++) {
      const qNew = flows[k] - yk[k] + pk[k] * (heads[from[k]] - heads[to[k]]);
      sumDq += Math.abs(qNew - flows[k]);
      sumQ += Math.abs(qNew);
      flows[k] = qNew;
    }
    relErr = sumQ > 0 ? sumDq / sumQ : 0;
    if (!Number.isFinite(relErr)) throw new Error("Divergence numérique du solveur de réseau.");
    if (relErr < accuracy) {
      converged = true;
      break;
    }
  }

  // Défaut de continuité résiduel aux nœuds.
  const balance = new Array<number>(model.nodes.length).fill(0);
  for (let k = 0; k < nLinks; k++) {
    balance[to[k]] += flows[k];
    balance[from[k]] -= flows[k];
  }
  let maxResidual = 0;
  for (const i of junctionIdx) maxResidual = Math.max(maxResidual, Math.abs(balance[i] - demand[i]));

  const nodes: NodeResult[] = model.nodes.map((n, i) => ({
    id: n.id,
    head: heads[i],
    pressureHead: n.type === "junction" ? heads[i] - n.elevation : 0,
  }));
  const pipes: PipeResult[] = model.pipes.map((p, k) => {
    const { h, fr } = evalPipe(k, flows[k]);
    return {
      id: p.id,
      flowM3s: flows[k],
      velocity: Math.sign(flows[k]) * fr.velocity,
      headLossM: h,
      headLossPerKm: (Math.abs(h) / p.lengthM) * 1000,
      reynolds: fr.reynolds,
      frictionFactor: fr.frictionFactor,
      regime: fr.regime,
    };
  });

  const pumpResults: PumpResult[] = pumpList.map((pu, j) => {
    const k = nPipes + j;
    const q = flows[k];
    const gain = heads[to[k]] - heads[from[k]];
    const warnings: string[] = [];
    if (q < 0) warnings.push("Débit inverse : un clapet anti-retour est nécessaire.");
    if (q > pu.curve.maxFlowM3s * 0.999) warnings.push("Pompe au-delà de son débit maximal de courbe.");
    if (q > 0 && q < 0.3 * pu.curve.designFlowM3s) {
      warnings.push("Débit très inférieur au débit nominal : risque de recirculation et d'échauffement.");
    }
    if (q > 1.25 * pu.curve.designFlowM3s) {
      warnings.push("Débit supérieur à 125 % du débit nominal : risque de cavitation et de surcharge moteur.");
    }
    return {
      id: pu.id,
      flowM3s: q,
      headGainM: gain,
      designFlowM3s: pu.curve.designFlowM3s,
      flowRatioToDesign: q / pu.curve.designFlowM3s,
      warnings,
    };
  });

  const provenance = createProvenance(
    "nafa-network-solver",
    "1.1.0",
    [
      { name: "Gradient global (Todini-Pilati)", reference: "Todini & Pilati (1988), Computer Applications in Water Supply, Wiley" },
      model.formula === "D-W"
        ? { name: model.frictionModel === "swamee-jain" ? "Darcy-Weisbach / Swamee-Jain" : "Darcy-Weisbach / Colebrook-White", reference: "Colebrook (1939) ; Swamee & Jain (1976) J. Hydraul. Div. ASCE 102(5)" }
        : { name: "Hazen-Williams", reference: "Coefficient SI équivalent à EPANET 2 (4.727 en unités US)" },
      ...(pumpList.length
        ? [{ name: "Courbe de pompe H = h0 - r·Q^n", reference: "Rossman, EPANET 2 Users Manual, EPA/600/R-00/057" }]
        : []),
    ],
    ["Régime permanent", "Écoulement en charge, conduites pleines", `g = ${g} m/s²`, `ν = ${nu} m²/s`],
    converged ? [] : [`Non convergé après ${iterations} itérations (erreur relative ${relErr})`],
  );

  return {
    converged,
    iterations,
    relativeError: relErr,
    maxContinuityResidualM3s: maxResidual,
    nodes,
    pipes,
    pumps: pumpResults,
    provenance,
  };
}
