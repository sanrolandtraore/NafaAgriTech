"""Génère les résultats de référence EPANET 2.2 (via WNTR) pour valider le solveur TypeScript.

Les réseaux sont définis ici de manière déterministe, résolus par EPANET, puis
exportés en JSON avec les charges et débits attendus. Le test Vitest
`src/test/engineering/networkSolverEpanet.test.ts` relit ce fichier et compare.

Usage (depuis engine_python) :
    .venv/Scripts/python.exe validation/generate_epanet_reference.py
"""

from __future__ import annotations

import json
from pathlib import Path

import wntr

FT = 0.3048
# Constantes internes d'EPANET, reprises pour isoler l'écart d'algorithme de l'écart de constantes.
EPANET_GRAVITY = 32.2 * FT  # 32.2 ft/s²
EPANET_VISCOSITY = 1.1e-5 * FT**2  # 1.1e-5 ft²/s (viscosité relative 1.0)

OUT = Path(__file__).resolve().parents[2] / "src" / "test" / "fixtures" / "epanetReference.json"


def build_grid(demands, diameters_m, lengths_m, roughness, formula, minor):
    """Réseau maillé à 2 boucles : 1 réservoir, 6 nœuds.

        R -- J1 -- J2 -- J3
              |     |     |
             J4 -- J5 -- J6
    """
    nodes = [
        {"id": "R", "type": "reservoir", "head": 80.0},
        {"id": "J1", "type": "junction", "elevation": 52.0, "demandM3s": demands[0]},
        {"id": "J2", "type": "junction", "elevation": 50.0, "demandM3s": demands[1]},
        {"id": "J3", "type": "junction", "elevation": 48.0, "demandM3s": demands[2]},
        {"id": "J4", "type": "junction", "elevation": 51.0, "demandM3s": demands[3]},
        {"id": "J5", "type": "junction", "elevation": 49.0, "demandM3s": demands[4]},
        {"id": "J6", "type": "junction", "elevation": 47.0, "demandM3s": demands[5]},
    ]
    topo = [
        ("P0", "R", "J1"),
        ("P1", "J1", "J2"),
        ("P2", "J2", "J3"),
        ("P3", "J1", "J4"),
        ("P4", "J2", "J5"),
        ("P5", "J3", "J6"),
        ("P6", "J4", "J5"),
        ("P7", "J5", "J6"),
    ]
    pipes = []
    for i, (pid, a, b) in enumerate(topo):
        pipes.append(
            {
                "id": pid,
                "from": a,
                "to": b,
                "lengthM": lengths_m[i],
                "diameterM": diameters_m[i],
                "roughness": roughness,
                "minorK": minor[i],
            }
        )
    return {"nodes": nodes, "pipes": pipes, "formula": formula}


def build_branched():
    """Réseau ramifié d'irrigation : tronc + 3 antennes, avec dénivelé marqué."""
    nodes = [
        {"id": "R", "type": "reservoir", "head": 150.0},
        {"id": "T1", "type": "junction", "elevation": 100.0, "demandM3s": 0.0},
        {"id": "T2", "type": "junction", "elevation": 96.0, "demandM3s": 0.0},
        {"id": "A1", "type": "junction", "elevation": 94.0, "demandM3s": 0.0045},
        {"id": "A2", "type": "junction", "elevation": 92.0, "demandM3s": 0.0060},
        {"id": "A3", "type": "junction", "elevation": 99.0, "demandM3s": 0.0030},
    ]
    pipes = [
        {"id": "T0", "from": "R", "to": "T1", "lengthM": 650.0, "diameterM": 0.1018, "roughness": 0.01, "minorK": 1.5},
        {"id": "T1", "from": "T1", "to": "T2", "lengthM": 420.0, "diameterM": 0.0816, "roughness": 0.01, "minorK": 0.9},
        {"id": "B1", "from": "T2", "to": "A1", "lengthM": 180.0, "diameterM": 0.0636, "roughness": 0.01, "minorK": 0.4},
        {"id": "B2", "from": "T2", "to": "A2", "lengthM": 260.0, "diameterM": 0.0636, "roughness": 0.01, "minorK": 0.4},
        {"id": "B3", "from": "T1", "to": "A3", "lengthM": 300.0, "diameterM": 0.0508, "roughness": 0.01, "minorK": 0.4},
    ]
    return {"nodes": nodes, "pipes": pipes, "formula": "D-W"}


def build_pumped(curve_points):
    """Réseau ramifié alimenté par une pompe : R (90 m) -> pompe -> S -> tronc -> antennes.

    `curve_points` : liste de (débit m³/s, charge m). Un seul point = courbe 1 point EPANET.
    """
    net = build_branched()
    net["nodes"][0]["head"] = 90.0
    net["nodes"].insert(1, {"id": "S", "type": "junction", "elevation": 90.0, "demandM3s": 0.0})
    net["pipes"][0]["from"] = "S"
    net["pumps"] = [{"id": "PU1", "from": "R", "to": "S", "curvePoints": curve_points}]
    return net


def build_pump_to_reservoir(curve_points):
    """Pompe vers un réservoir plus haut : le débit résulte de l'intersection courbe/réseau.

    R1 (90 m) -> pompe -> S -> conduite (800 m, DN100) -> R2 (125 m). Aucune demande imposée.
    """
    nodes = [
        {"id": "R1", "type": "reservoir", "head": 90.0},
        {"id": "S", "type": "junction", "elevation": 90.0, "demandM3s": 0.0},
        {"id": "R2", "type": "reservoir", "head": 125.0},
    ]
    pipes = [
        {"id": "L1", "from": "S", "to": "R2", "lengthM": 800.0, "diameterM": 0.1018,
         "roughness": 0.01, "minorK": 2.0},
    ]
    pumps = [{"id": "PU1", "from": "R1", "to": "S", "curvePoints": curve_points}]
    return {"nodes": nodes, "pipes": pipes, "pumps": pumps, "formula": "D-W"}


def to_wntr(net):
    wn = wntr.network.WaterNetworkModel()
    wn.options.hydraulic.headloss = net["formula"]
    wn.options.hydraulic.accuracy = 1e-8
    wn.options.hydraulic.trials = 1000
    wn.options.time.duration = 0
    for n in net["nodes"]:
        if n["type"] == "reservoir":
            wn.add_reservoir(n["id"], base_head=n["head"])
        else:
            wn.add_junction(n["id"], base_demand=n["demandM3s"], elevation=n["elevation"])
    for p in net["pipes"]:
        rough = p["roughness"] / 1000.0 if net["formula"] == "D-W" else p["roughness"]
        wn.add_pipe(
            p["id"], p["from"], p["to"],
            length=p["lengthM"], diameter=p["diameterM"],
            roughness=rough, minor_loss=p.get("minorK", 0.0),
        )
    for i, pu in enumerate(net.get("pumps", [])):
        cname = f"CURVE_{i}"
        wn.add_curve(cname, "HEAD", [tuple(pt) for pt in pu["curvePoints"]])
        wn.add_pump(pu["id"], pu["from"], pu["to"], pump_type="HEAD", pump_parameter=cname)
    return wn


def main():
    nets = {}

    nets["grid_dw_turbulent"] = build_grid(
        demands=[0.0020, 0.0030, 0.0025, 0.0015, 0.0035, 0.0020],
        diameters_m=[0.1018, 0.0816, 0.0636, 0.0816, 0.0636, 0.0636, 0.0636, 0.0508],
        lengths_m=[500, 300, 250, 280, 320, 260, 300, 240],
        roughness=0.01,
        formula="D-W",
        minor=[1.5, 0.9, 0.9, 0.9, 1.3, 0.9, 0.4, 0.4],
    )
    nets["grid_hw_with_minor"] = build_grid(
        demands=[0.0020, 0.0030, 0.0025, 0.0015, 0.0035, 0.0020],
        diameters_m=[0.1018, 0.0816, 0.0636, 0.0816, 0.0636, 0.0636, 0.0636, 0.0508],
        lengths_m=[500, 300, 250, 280, 320, 260, 300, 240],
        roughness=140.0,
        formula="H-W",
        minor=[1.5, 0.9, 0.9, 0.9, 1.3, 0.9, 0.4, 0.4],
    )
    nets["branched_irrigation_dw"] = build_branched()
    nets["grid_dw_transition_low_flow"] = build_grid(
        demands=[0.00005, 0.00005, 0.00005, 0.00005, 0.00005, 0.00005],
        diameters_m=[0.0204, 0.0204, 0.0204, 0.0204, 0.0204, 0.0204, 0.0204, 0.0204],
        lengths_m=[120, 80, 80, 90, 90, 80, 90, 80],
        roughness=0.01,
        formula="D-W",
        minor=[0, 0, 0, 0, 0, 0, 0, 0],
    )
    nets["pumped_three_point_curve"] = build_pumped([(0.0, 45.0), (0.0135, 40.0), (0.027, 28.0)])
    nets["pumped_single_point_curve"] = build_pumped([(0.0135, 38.0)])
    nets["pump_operating_point_three_point"] = build_pump_to_reservoir(
        [(0.0, 48.0), (0.012, 42.0), (0.024, 28.0)]
    )
    nets["pump_operating_point_single_point"] = build_pump_to_reservoir([(0.012, 42.0)])

    out = {
        "generator": f"WNTR {wntr.__version__} / EPANET 2.2",
        "epanetGravity": EPANET_GRAVITY,
        "epanetKinematicViscosity": EPANET_VISCOSITY,
        "networks": {},
    }
    for name, net in nets.items():
        wn = to_wntr(net)
        sim = wntr.sim.EpanetSimulator(wn)
        res = sim.run_sim()
        heads = res.node["head"].iloc[0].to_dict()
        flows = res.link["flowrate"].iloc[0].to_dict()
        out["networks"][name] = {
            "model": net,
            "expectedHeads": {k: float(v) for k, v in heads.items()},
            "expectedFlowsM3s": {k: float(v) for k, v in flows.items()},
        }
        print(name, "OK", {k: round(v, 3) for k, v in heads.items()})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print("écrit :", OUT)


if __name__ == "__main__":
    main()
