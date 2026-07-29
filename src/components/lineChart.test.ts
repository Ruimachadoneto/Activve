import { describe, it, expect } from "vitest";
import { formatTick } from "./LineChart";

/**
 * TASK-021 — achado do review Codex: arredondar o tick sempre para inteiro colapsava
 * faixas curtas, e o eixo passava a contradizer a variação que a linha desenha.
 * Cenário real e comum: log de peso corporal e incremento de carga de 0,5 kg.
 */
describe("formatTick", () => {
  it("usa inteiro quando a faixa é larga o bastante", () => {
    expect(formatTick(85, 78, 85)).toBe("85");
    expect(formatTick(78, 78, 85)).toBe("78");
  });

  it("não adiciona casas decimais falsas a um extremo inteiro", () => {
    // Pego na verificação no browser: com min 61,25 o max 85 saía "85,00",
    // sugerindo uma precisão de medição que não existe.
    expect(formatTick(85, 61.25, 85)).toBe("85");
    expect(formatTick(61.25, 61.25, 85)).toBe("61,25");
  });

  it("ganha uma casa decimal quando os inteiros empatariam", () => {
    // 80,2 → 80,4: com Math.round os dois extremos virariam "80"
    expect(formatTick(80.4, 80.2, 80.4)).toBe("80,4");
    expect(formatTick(80.2, 80.2, 80.4)).toBe("80,2");
  });

  it("não estoura para fora dos valores observados ao cruzar o meio", () => {
    // 62,4 → 62,6 arredondaria para "62" e "63": rótulos FORA do que foi medido,
    // exagerando a variação (achado do ciclo 2 do review Codex).
    expect(formatTick(62.4, 62.4, 62.6)).toBe("62,4");
    expect(formatTick(62.6, 62.4, 62.6)).toBe("62,6");
  });

  it("os dois extremos nunca saem com o mesmo rótulo", () => {
    const casos: [number, number][] = [
      [80.2, 80.4],
      [62.4, 62.6],
      [62.5, 63.0],
      [70.05, 70.4],
      [100, 140],
    ];
    for (const [min, max] of casos) {
      expect(formatTick(min, min, max)).not.toBe(formatTick(max, min, max));
    }
  });

  it("faixa pouco acima de 1 unidade também mantém decimal", () => {
    // Achado do ciclo 3: a regra "faixa < 1" deixava 70,1→71,1 arredondar para 70/71,
    // rótulos fora do medido.
    expect(formatTick(70.1, 70.1, 71.1)).toBe("70,1");
    expect(formatTick(71.1, 70.1, 71.1)).toBe("71,1");
    expect(formatTick(62.6, 62.6, 63.6)).toBe("62,6");
  });

  it("preserva quarto de passo (média de cargas)", () => {
    // Achado do ciclo 4: avgLoad de 60 e 62,5 é 61,25 — `toFixed(1)` virava "61,3",
    // fora da faixa medida.
    expect(formatTick(61.25, 61.25, 66.25)).toBe("61,25");
    expect(formatTick(66.25, 61.25, 66.25)).toBe("66,25");
    expect(formatTick(11.25, 11.25, 15.75)).toBe("11,25");
  });

  it("dízima arredonda para DENTRO da faixa, nunca para fora", () => {
    const min = 61 + 1 / 3;
    const max = 66 + 2 / 3;
    const rotMin = Number(formatTick(min, min, max).replace(",", "."));
    const rotMax = Number(formatTick(max, min, max).replace(",", "."));
    expect(rotMin).toBeGreaterThanOrEqual(min);
    expect(rotMax).toBeLessThanOrEqual(max);
  });

  it("INVARIANTE: nenhum rótulo cai fora da faixa medida, em nenhuma faixa", () => {
    const casos: [number, number][] = [
      [62.4, 62.6],
      [80.2, 80.4],
      [78, 85],
      [99.6, 100.4],
      [70.1, 71.1],
      [62.6, 63.6],
      [49.9, 52.3],
      [0.4, 9.6],
      [120, 121],
      [61.25, 66.25],
      [11.25, 15.75],
      [61 + 1 / 3, 66 + 2 / 3],
      [7.125, 9.875],
    ];
    for (const [min, max] of casos) {
      for (const v of [min, max]) {
        const n = Number(formatTick(v, min, max).replace(",", "."));
        expect(n).toBeGreaterThanOrEqual(min);
        expect(n).toBeLessThanOrEqual(max);
      }
    }
  });

  it("usa vírgula decimal (pt-BR), não ponto", () => {
    expect(formatTick(80.4, 80.2, 80.4)).not.toContain(".");
  });

  it("faixa de valor único não quebra nem inventa precisão", () => {
    expect(() => formatTick(80, 80, 80)).not.toThrow();
    // "80,0" sugeriria uma medição com precisão decimal que não houve.
    expect(formatTick(80, 80, 80)).toBe("80");
    expect(formatTick(80.5, 80.5, 80.5)).toBe("80,5");
  });
});
