import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { parsePlan } from "./parse";

describe("examples/plano-exemplo.json", () => {
  it("é um plano válido (guarda contra drift do schema)", () => {
    const text = readFileSync(join(process.cwd(), "examples", "plano-exemplo.json"), "utf8");
    const result = parsePlan(text);
    if (!result.ok) {
      console.error("Erros no plano-exemplo.json:", result.errors);
    }
    expect(result.ok).toBe(true);
  });
});
