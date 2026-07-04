import { describe, it, expect } from "vitest";
import { MUSCLE_LABEL, muscleLabel, equipmentLabel } from "./labels";
import { MUSCLES, EQUIPMENT } from "./schema";

describe("MUSCLE_LABEL", () => {
  it("cobre TODOS os músculos do vocabulário do schema", () => {
    for (const m of MUSCLES) {
      expect(MUSCLE_LABEL[m], `sem rótulo para "${m}"`).toBeTruthy();
    }
    expect(Object.keys(MUSCLE_LABEL).length).toBe(MUSCLES.length);
  });

  it("muscleLabel retorna PT-BR", () => {
    expect(muscleLabel("chest")).toBe("Peito");
    expect(muscleLabel("hamstrings")).toBe("Posterior de coxa");
  });
});

describe("equipmentLabel", () => {
  it("cobre todos os equipamentos do schema", () => {
    for (const e of EQUIPMENT) {
      expect(equipmentLabel(e)).not.toBe(e); // todos têm rótulo PT próprio
    }
  });
});
