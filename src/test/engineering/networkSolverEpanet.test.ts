/**
 * Validation du solveur de réseau contre EPANET 2.2 (via WNTR).
 *
 * Les valeurs attendues sont générées par `engine_python/validation/generate_epanet_reference.py`
 * et lues dans `fixtures/epanetReference.json`. Elles ne sont jamais saisies à la main.
 *
 * On passe à notre solveur les constantes internes d'EPANET (g = 32.2 ft/s², ν = 1.1e-5 ft²/s)
 * pour comparer les algorithmes à constantes égales. L'effet de la constante g physique
 * (9.80665 au lieu de 9.81456 m/s²) est mesuré séparément.
 */
import { describe, it, expect } from "vitest";
import reference from "../fixtures/epanetReference.json";
import { solveNetwork, type NetworkModel } from "../../engineering/hydraulics/networkSolver";
import { fitSinglePointCurve, fitThreePointCurve } from "../../engineering/hydraulics/pumpCurve";

type RefPump = { id: string; from: string; to: string; curvePoints: Array<[number, number]> };
type RefNet = {
  model: Omit<NetworkModel, "kinematicViscosity" | "pumps"> & { pumps?: RefPump[] };
  expectedHeads: Record<string, number>;
  expectedFlowsM3s: Record<string, number>;
};

const nets = reference.networks as unknown as Record<string, RefNet>;

function asModel(net: RefNet, gravity: number | undefined): NetworkModel {
  const { pumps, ...rest } = net.model;
  return {
    ...rest,
    pumps: (pumps ?? []).map((p) => ({
      id: p.id,
      from: p.from,
      to: p.to,
      curve:
        p.curvePoints.length === 1
          ? fitSinglePointCurve({ flowM3s: p.curvePoints[0][0], headM: p.curvePoints[0][1] })
          : fitThreePointCurve(
              p.curvePoints.map(([q, h]) => ({ flowM3s: q, headM: h })) as [
                { flowM3s: number; headM: number },
                { flowM3s: number; headM: number },
                { flowM3s: number; headM: number },
              ],
            ),
    })),
    kinematicViscosity: reference.epanetKinematicViscosity,
    gravity,
    // EPANET 2.2 utilise Swamee-Jain, pas Colebrook exact.
    frictionModel: "swamee-jain",
  } as NetworkModel;
}

const HEAD_TOLERANCE_M = 1e-3; // 1 mm de colonne d'eau
const FLOW_REL_TOLERANCE = 1e-4; // 0.01 %

describe("Solveur de réseau vs EPANET 2.2 (constantes identiques)", () => {
  for (const [name, net] of Object.entries(nets)) {
    it(`${name} : charges aux nœuds et débits dans les conduites`, () => {
      const sol = solveNetwork(asModel(net, reference.epanetGravity));
      expect(sol.converged).toBe(true);

      let maxHeadErr = 0;
      for (const n of sol.nodes) {
        const err = Math.abs(n.head - net.expectedHeads[n.id]);
        maxHeadErr = Math.max(maxHeadErr, err);
      }
      let maxFlowRelErr = 0;
      for (const p of [...sol.pipes, ...sol.pumps]) {
        const exp = net.expectedFlowsM3s[p.id];
        const err = Math.abs(p.flowM3s - exp) / Math.max(Math.abs(exp), 1e-6);
        maxFlowRelErr = Math.max(maxFlowRelErr, err);
      }
      // Résumé écrit dans la sortie du test pour traçabilité.
      console.log(
        `[EPANET] ${name}: écart max charge = ${maxHeadErr.toExponential(2)} m, ` +
          `écart relatif max débit = ${maxFlowRelErr.toExponential(2)}, itérations = ${sol.iterations}`,
      );
      expect(maxHeadErr).toBeLessThan(HEAD_TOLERANCE_M);
      expect(maxFlowRelErr).toBeLessThan(FLOW_REL_TOLERANCE);
    });
  }
});

describe("Propriétés physiques du solveur", () => {
  it("respecte la conservation de la masse à chaque nœud (défaut < 1e-9 m³/s)", () => {
    for (const net of Object.values(nets)) {
      const sol = solveNetwork(asModel(net, undefined));
      expect(sol.converged).toBe(true);
      expect(sol.maxContinuityResidualM3s).toBeLessThan(1e-9);
    }
  });

  it("le débit entrant du réservoir égale la somme des demandes", () => {
    for (const net of Object.values(nets)) {
      const model = asModel(net, undefined);
      const sol = solveNetwork(model);
      const totalDemand = model.nodes.reduce(
        (s, n) => s + (n.type === "junction" ? n.demandM3s : 0),
        0,
      );
      const reservoirIds = new Set(
        model.nodes.filter((n) => n.type === "reservoir").map((n) => n.id),
      );
      let totalReservoirOutflow = 0;
      for (const p of [...sol.pipes, ...sol.pumps]) {
        const def = [...model.pipes, ...(model.pumps ?? [])].find((x) => x.id === p.id)!;
        if (reservoirIds.has(def.from)) totalReservoirOutflow += p.flowM3s;
        if (reservoirIds.has(def.to)) totalReservoirOutflow -= p.flowM3s;
      }
      expect(Math.abs(totalReservoirOutflow - totalDemand)).toBeLessThan(1e-9);
    }
  });

  it("quantifie l'effet de la constante g physique (9.80665) par rapport à celle d'EPANET", () => {
    const net = nets["grid_dw_turbulent"];
    const withEpanetG = solveNetwork(asModel(net, reference.epanetGravity));
    const withPhysicalG = solveNetwork(asModel(net, undefined));
    let maxDiff = 0;
    for (let i = 0; i < withEpanetG.nodes.length; i++) {
      maxDiff = Math.max(maxDiff, Math.abs(withEpanetG.nodes[i].head - withPhysicalG.nodes[i].head));
    }
    console.log(`[g] écart max de charge dû à g (9.80665 vs EPANET 9.81456) = ${maxDiff.toFixed(4)} m`);
    // Borne attendue : environ 0.08 % des pertes totales (~14 m) soit ~1.1 cm.
    expect(maxDiff).toBeLessThan(0.05);
  });

  it("refuse un réseau sans source ou avec une portion isolée", () => {
    const base = nets["branched_irrigation_dw"];
    const noSource = {
      ...asModel(base, undefined),
      nodes: asModel(base, undefined).nodes.filter((n) => n.type !== "reservoir"),
      pipes: asModel(base, undefined).pipes.filter((p) => p.from !== "R"),
    };
    expect(() => solveNetwork(noSource)).toThrow(/Réseau invalide/);

    const isolated = asModel(base, undefined);
    isolated.nodes = [...isolated.nodes, { id: "X", type: "junction", elevation: 90, demandM3s: 0.001 }];
    expect(() => solveNetwork(isolated)).toThrow(/non relié/);
  });
});
