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

  it("nenhum rótulo cai fora da faixa medida", () => {
    const casos: [number, number][] = [
      [62.4, 62.6],
      [80.2, 80.4],
      [78, 85],
      [99.6, 100.4],
    ];
    for (const [min, max] of casos) {
      for (const v of [min, max]) {
        const n = Number(formatTick(v, min, max).replace(",", "."));
        expect(n).toBeGreaterThanOrEqual(Math.floor(min));
        expect(n).toBeLessThanOrEqual(Math.ceil(max));
        expect(Math.abs(n - v)).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it("usa vírgula decimal (pt-BR), não ponto", () => {
    expect(formatTick(80.4, 80.2, 80.4)).not.toContain(".");
  });

  it("faixa de valor único não quebra", () => {
    expect(() => formatTick(80, 80, 80)).not.toThrow();
    expect(formatTick(80, 80, 80)).toBe("80,0");
  });
});
