import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  clearRestTimer,
  loadRestTimer,
  remainingOf,
  saveRestTimer,
  type RestTimerState,
} from "./restTimer";

/** `localStorage` de mentira — a infra de teste do projeto é node-only, sem jsdom. */
function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    get size() {
      return map.size;
    },
  };
}

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  storage = fakeStorage();
  vi.stubGlobal("window", { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const base: RestTimerState = {
  endAt: 1_000_000,
  duration: 90,
  pausedRemaining: null,
  sessionId: "p1:A:2026-07-30",
  exerciseId: "supino",
  alerted: false,
};

describe("restTimer — sobreviver a sair do app", () => {
  it("salva e devolve o descanso da mesma sessão", () => {
    saveRestTimer(base);
    expect(loadRestTimer("p1:A:2026-07-30", 999_000)).toEqual(base);
  });

  it("não devolve descanso de outra sessão", () => {
    // Treino de ontem, ou o outro treino do dia: o cronômetro não pode reaparecer ali.
    saveRestTimer(base);
    expect(loadRestTimer("p1:B:2026-07-30", 999_000)).toBeNull();
  });

  it("não ressuscita descanso velho, e limpa o registro", () => {
    saveRestTimer(base);
    // 31 min depois do fim: o usuário não está mais "naquele descanso".
    expect(loadRestTimer(base.sessionId, base.endAt + 31 * 60 * 1000)).toBeNull();
    expect(storage.size).toBe(0);
  });

  it("descanso PAUSADO não expira pelo relógio", () => {
    // Pausado, o tempo real não corre — voltar horas depois deve encontrar o mesmo valor.
    const pausado = { ...base, pausedRemaining: 45 };
    saveRestTimer(pausado);
    expect(loadRestTimer(base.sessionId, base.endAt + 5 * 60 * 60 * 1000)).toEqual(pausado);
  });

  it("registro corrompido não derruba a leitura e é descartado", () => {
    storage.setItem("activve:rest-timer", "{ isso não é json");
    expect(loadRestTimer(base.sessionId)).toBeNull();
    expect(storage.size).toBe(0);
  });

  it("registro com formato inesperado é descartado", () => {
    storage.setItem("activve:rest-timer", JSON.stringify({ endAt: "agora" }));
    expect(loadRestTimer(base.sessionId)).toBeNull();
    expect(storage.size).toBe(0);
  });

  it("limpar apaga de verdade", () => {
    saveRestTimer(base);
    clearRestTimer();
    expect(loadRestTimer(base.sessionId, 999_000)).toBeNull();
  });

  it("storage indisponível não quebra nada", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem() {
          throw new Error("bloqueado");
        },
        setItem() {
          throw new Error("bloqueado");
        },
        removeItem() {
          throw new Error("bloqueado");
        },
      },
    });
    // Sem storage o descanso só perde a memória; não pode derrubar a tela de treino.
    expect(() => saveRestTimer(base)).not.toThrow();
    expect(() => clearRestTimer()).not.toThrow();
    expect(loadRestTimer(base.sessionId)).toBeNull();
  });
});

describe("remainingOf — o tempo vem do relógio, não de decremento", () => {
  it("rodando, calcula a partir do instante de fim", () => {
    expect(remainingOf(base, base.endAt - 30_000)).toBe(30);
  });

  it("nunca devolve negativo depois do fim", () => {
    expect(remainingOf(base, base.endAt + 60_000)).toBe(0);
  });

  it("pausado devolve o que estava congelado, ignorando o relógio", () => {
    const pausado = { ...base, pausedRemaining: 42 };
    expect(remainingOf(pausado, base.endAt + 10_000_000)).toBe(42);
  });

  it("o tempo que passou FORA do app conta — é o ponto de persistir", () => {
    // Saiu com 90s, ficou 70s noutro app: volta faltando 20, não 90.
    saveRestTimer(base);
    const voltou = loadRestTimer(base.sessionId, base.endAt - 20_000)!;
    expect(remainingOf(voltou, base.endAt - 20_000)).toBe(20);
  });
});
