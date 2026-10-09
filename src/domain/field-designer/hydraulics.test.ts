import { describe, expect, it } from "vitest";
import {
  barToMetresWaterColumn,
  calculateHazenWilliams,
  checkPressureHead,
  christiansenFactor,
  litresPerSecondToM3s,
  millimetresToMetres,
} from "./hydraulics";

describe("FIELD DESIGNER hydraulic calculation core", () => {
  it("returns no Christiansen reduction for a single outlet", () => {
    expect(christiansenFactor(1).factor).toBe(1);
  });

  it("computes a valid reduction factor for multiple outlets", () => {
    const result = christiansenFactor(20);
    expect(result.factor).toBeGreaterThan(0);
    expect(result.factor).toBeLessThan(1);
  });

  it("estimates Hazen-Williams loss deterministically", () => {
    const input = {
      flowM3s: 0.001,
      diameterM: 0.032,
      lengthM: 50,
      roughnessC: 140,
      outlets: 1,
    };
    const first = calculateHazenWilliams(input);
    const second = calculateHazenWilliams(input);
    expect(first.estimatedLossM).toBeGreaterThan(0);
    expect(first.estimatedLossM).toBeCloseTo(second.estimatedLossM, 12);
    expect(first.assumptions.length).toBeGreaterThan(0);
  });

  it("reduces estimated friction loss for multiple equally spaced outlets", () => {
    const base = {
      flowM3s: 0.001,
      diameterM: 0.032,
      lengthM: 50,
      roughnessC: 140,
    };
    const single = calculateHazenWilliams({ ...base, outlets: 1 });
    const multiple = calculateHazenWilliams({ ...base, outlets: 20 });
    expect(multiple.estimatedLossM).toBeLessThan(single.estimatedLossM);
  });

  it("flags insufficient pressure head", () => {
    const result = checkPressureHead(8, 12, 1);
    expect(result.status).toBe("warning");
    expect(result.sufficient).toBe(false);
    expect(result.message).toContain("PRESSION INSUFFISANTE");
  });

  it("accepts adequate pressure head with margin", () => {
    expect(checkPressureHead(15, 12, 2).sufficient).toBe(true);
  });

  it("validates invalid hydraulic inputs", () => {
    expect(() =>
      calculateHazenWilliams({
        flowM3s: 0,
        diameterM: 0.032,
        lengthM: 50,
        roughnessC: 140,
      }),
    ).toThrow(RangeError);
    expect(() => christiansenFactor(0)).toThrow(RangeError);
  });

  it("converts field units to SI", () => {
    expect(litresPerSecondToM3s(2)).toBeCloseTo(0.002);
    expect(millimetresToMetres(32)).toBeCloseTo(0.032);
    expect(barToMetresWaterColumn(1)).toBeCloseTo(10.21, 1);
  });
});
