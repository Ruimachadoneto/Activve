import { describe, it, expect } from "vitest";
import { MUSCLE_LABEL, muscleLabel, equipmentLabel, textoVisivel } from "./labels";
import { MUSCLES, EQUIPMENT } from "./schema";

describe("textoVisivel — campo presente não é conteúdo", () => {
  it("texto de verdade volta sem as pontas", () => {
    expect(textoVisivel("  Você treina de manhã.  ")).toBe("Você treina de manhã.");
  });

  it("só espaços, tab ou quebra de linha é ausência de conteúdo", () => {
    expect(textoVisivel("   ")).toBeUndefined();
    expect(textoVisivel("\n\t ")).toBeUndefined();
    expect(textoVisivel("")).toBeUndefined();
  });

  it("campo ausente continua ausente", () => {
    expect(textoVisivel(undefined)).toBeUndefined();
  });
});

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
