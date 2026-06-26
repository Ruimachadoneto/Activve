import { describe, it, expect } from "vitest";
import { resolveMuscleImage } from "./muscleImage";

describe("resolveMuscleImage", () => {
  it("push (peito+ombro+tríceps) → empurrar", () => {
    expect(resolveMuscleImage(["chest", "chest", "front_delts", "triceps"])).toBe("empurrar");
  });

  it("peito isolado → peito", () => {
    expect(resolveMuscleImage(["chest", "chest"])).toBe("peito");
  });

  it("pull (costas+bíceps) → puxar", () => {
    expect(resolveMuscleImage(["lats", "upper_back", "biceps"])).toBe("puxar");
  });

  it("costas sem bíceps → costas", () => {
    expect(resolveMuscleImage(["lats", "upper_back"])).toBe("costas");
  });

  it("ombro isolado → ombros", () => {
    expect(resolveMuscleImage(["side_delts", "front_delts"])).toBe("ombros");
  });

  it("quad/leg day → pernas", () => {
    expect(resolveMuscleImage(["quads", "quads", "glutes"])).toBe("pernas");
  });

  it("foco glúteo → gluteos", () => {
    expect(resolveMuscleImage(["glutes", "glutes"])).toBe("gluteos");
  });

  it("glúteo + posterior → posterior", () => {
    expect(resolveMuscleImage(["glutes", "hamstrings"])).toBe("posterior");
  });

  it("panturrilha → panturrilha", () => {
    expect(resolveMuscleImage(["calves", "calves"])).toBe("panturrilha");
  });

  it("full body (superior + inferior) → corpo", () => {
    expect(resolveMuscleImage(["chest", "quads"])).toBe("corpo");
  });

  it("sem dados → corpo (fallback)", () => {
    expect(resolveMuscleImage([])).toBe("corpo");
  });
});
