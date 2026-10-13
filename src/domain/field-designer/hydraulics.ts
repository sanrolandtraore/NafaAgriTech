/**
 * Deterministic irrigation calculations for FIELD DESIGNER.
 *
 * SI units throughout: flow m³/s, diameter m, length m, pressure head mCE.
 * This module intentionally has no UI, Three.js, map, network, or AI dependency.
 * Results are engineering estimates and require validation against site measurements
 * and review by a qualified irrigation/hydraulic professional before construction.
 */

export type ChristiansenResult = {
  /** Christiansen multiple-outlet reduction factor, dimensionless. */
  factor: number;
  outlets: number;
  exponent: number;
};

export type HazenWilliamsInput = {
  /** Flow entering the pipe, m³/s. */
  flowM3s: number;
  /** Internal pipe diameter, metres. */
  diameterM: number;
  /** Pipe length, metres. */
  lengthM: number;
  /** Hazen-Williams C coefficient; must be positive. */
  roughnessC: number;
  /** Number of equally spaced outlets, including the first outlet. */
  outlets?: number;
  /** Flow exponent; use 1.852 for Hazen-Williams. */
  exponent?: number;
};

export type HydraulicResult = {
  frictionLossM: number;
  reductionFactor: number;
  estimatedLossM: number;
  inputFlowM3s: number;
  diameterM: number;
  lengthM: number;
  roughnessC: number;
  outlets: number;
  assumptions: string[];
};

export type PressureCheck = {
  requiredHeadM: number;
  availableHeadM: number;
  marginM: number;
  sufficient: boolean;
  status: "ok" | "warning";
  message: string;
};

function assertFinitePositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number greater than zero`);
  }
}

/**
 * Christiansen F factor for multiple equally spaced outlets with a uniform
 * inlet flow distribution. The common approximation is:
 * F = 1/(m+1) + 1/(2N) + sqrt(m-1)/(6N²)
 * where m is the flow exponent and N the number of outlets.
 * For a single outlet there is no multiple-outlet reduction.
 */
export function christiansenFactor(
  outlets: number,
  exponent = 1.852,
): ChristiansenResult {
  if (!Number.isInteger(outlets) || outlets < 1) {
    throw new RangeError("outlets must be an integer >= 1");
  }
  assertFinitePositive("exponent", exponent);
  if (outlets === 1) return { factor: 1, outlets, exponent };

  const n = outlets;
  const factor =
    1 / (exponent + 1) +
    1 / (2 * n) +
    Math.sqrt(exponent - 1) / (6 * n * n);

  // The formula is an approximation; guard against invalid numeric results.
  if (!Number.isFinite(factor) || factor <= 0 || factor > 1) {
    throw new RangeError("Could not compute a physically valid Christiansen factor");
  }
  return { factor, outlets, exponent };
}

/**
 * Computes Hazen-Williams friction head loss in SI units.
 * hf = 10.67 * L * Q^1.852 / (C^1.852 * d^4.871)
 * Q is the full inlet flow for a single pipe; when outlets > 1, a
 * Christiansen reduction factor estimates loss for equally spaced outlets.
 *
 * IMPORTANT: this model does not cover elevation changes, fittings, filters,
 * valves, emitters, transient pressure, or non-uniform outlet spacing.
 */
export function calculateHazenWilliams(
  input: HazenWilliamsInput,
): HydraulicResult {
  const {
    flowM3s,
    diameterM,
    lengthM,
    roughnessC,
    outlets = 1,
    exponent = 1.852,
  } = input;

  assertFinitePositive("flowM3s", flowM3s);
  assertFinitePositive("diameterM", diameterM);
  assertFinitePositive("lengthM", lengthM);
  assertFinitePositive("roughnessC", roughnessC);
  if (!Number.isInteger(outlets) || outlets < 1) {
    throw new RangeError("outlets must be an integer >= 1");
  }
  assertFinitePositive("exponent", exponent);

  const frictionLossM =
    (10.67 * lengthM * flowM3s ** exponent) /
    (roughnessC ** exponent * diameterM ** 4.871);

  const reductionFactor = christiansenFactor(outlets, exponent).factor;
  const estimatedLossM = frictionLossM * reductionFactor;

  if (![frictionLossM, estimatedLossM].every(Number.isFinite)) {
    throw new RangeError("Hydraulic result is outside the supported numeric range");
  }

  return {
    frictionLossM,
    reductionFactor,
    estimatedLossM,
    inputFlowM3s: flowM3s,
    diameterM,
    lengthM,
    roughnessC,
    outlets,
    assumptions: [
      "Hazen-Williams empirical equation in SI units",
      "Steady-state flow",
      "Constant internal pipe diameter and roughness coefficient",
      outlets > 1
        ? "Christiansen approximation assumes equally spaced outlets and uniform outlet distribution"
        : "Single pipe with no multiple-outlet reduction",
      "Elevation, fittings, valves, filters, emitters and water-hammer effects are excluded",
    ],
  };
}

/**
 * Compares available head with the required head at the hydraulically critical
 * point. Inputs must already include elevation and local losses where applicable.
 */
export function checkPressureHead(
  availableHeadM: number,
  requiredHeadM: number,
  minimumMarginM = 0,
): PressureCheck {
  if (!Number.isFinite(availableHeadM) || availableHeadM < 0) {
    throw new RangeError("availableHeadM must be finite and >= 0");
  }
  assertFinitePositive("requiredHeadM", requiredHeadM);
  if (!Number.isFinite(minimumMarginM) || minimumMarginM < 0) {
    throw new RangeError("minimumMarginM must be finite and >= 0");
  }

  const marginM = availableHeadM - requiredHeadM;
  const sufficient = marginM >= minimumMarginM;

  return {
    availableHeadM,
    requiredHeadM,
    marginM,
    sufficient,
    status: sufficient ? "ok" : "warning",
    message: sufficient
      ? "La charge disponible satisfait la charge requise et la marge minimale."
      : "PRESSION INSUFFISANTE : vérifier le diamètre, le débit, la longueur, le dénivelé et la pompe.",
  };
}

/** Converts pressure in bar to metres of water column (approx. at 20°C). */
export function barToMetresWaterColumn(bar: number): number {
  if (!Number.isFinite(bar) || bar < 0) {
    throw new RangeError("bar must be finite and >= 0");
  }
  return (bar * 100_000) / (998.2 * 9.80665);
}

/** Converts litres per second to cubic metres per second. */
export function litresPerSecondToM3s(litresPerSecond: number): number {
  if (!Number.isFinite(litresPerSecond) || litresPerSecond < 0) {
    throw new RangeError("litresPerSecond must be finite and >= 0");
  }
  return litresPerSecond / 1000;
}

/** Converts millimetres to metres. */
export function millimetresToMetres(millimetres: number): number {
  if (!Number.isFinite(millimetres) || millimetres <= 0) {
    throw new RangeError("millimetres must be finite and > 0");
  }
  return millimetres / 1000;
}
