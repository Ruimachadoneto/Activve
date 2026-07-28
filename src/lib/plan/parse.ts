import { planFileSchema, type PlanFile } from "./schema";

export type FieldError = { field: string; message: string };

export type ParseResult =
  | { ok: true; plan: PlanFile }
  | { ok: false; errors: FieldError[] };

const MAX_BYTES = 512 * 1024;
const SUPPORTED_MAJOR = "1";

/**
 * Lê texto bruto (arquivo ou colado), valida contra o schema do plano e
 * devolve o plano tipado ou uma lista de erros campo+motivo (entrada não confiável).
 */
export function parsePlan(text: string): ParseResult {
  if (text.length > MAX_BYTES) {
    return { ok: false, errors: [{ field: "arquivo", message: "Arquivo muito grande (máx. 512 KB)." }] };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return {
      ok: false,
      errors: [{ field: "arquivo", message: "Não conseguimos ler: o conteúdo não é um JSON válido." }],
    };
  }

  return validatePlan(json);
}

/**
 * Valida um objeto JÁ desserializado (ex.: registro lido do IndexedDB) com as MESMAS
 * regras do import — versão suportada + schema. Extraído de `parsePlan` de propósito:
 * a validação de leitura (TASK-013) não pode divergir da validação de import, senão um
 * plano aceito na entrada poderia ser rejeitado depois (ou pior, o contrário).
 */
export function validatePlan(json: unknown): ParseResult {
  const version =
    json && typeof json === "object" && "schemaVersion" in json
      ? (json as { schemaVersion?: unknown }).schemaVersion
      : undefined;

  if (typeof version === "string" && version.split(".")[0] !== SUPPORTED_MAJOR) {
    return {
      ok: false,
      errors: [
        {
          field: "schemaVersion",
          message: `Versão ${version} incompatível. Este app entende a versão 1.x — gere o plano novamente com um gerador atualizado.`,
        },
      ],
    };
  }

  const result = planFileSchema.safeParse(json);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.length ? issue.path.join(".") : "(raiz)",
      message: issue.message,
    }));
    return { ok: false, errors };
  }

  return { ok: true, plan: result.data };
}

/**
 * Guarda ESTRUTURAL para planos **históricos** (TASK-013) — deliberadamente mais fraca
 * que `validatePlan`.
 *
 * Um plano antigo é lido com um propósito só: resolver o nome do treino/exercício de
 * sessões já registradas (calendário e relatório cross-plano da TASK-018). Exigir
 * validade total ali seria pior do que o problema: um defeito num campo que essa tela
 * nem lê (ex.: `weekSchedule` apontando pra um treino removido) apagaria o nome de um
 * ciclo inteiro do histórico, que passaria a aparecer como id cru — degradação
 * silenciosa. O que realmente precisa ser garantido é só que dá para percorrer a
 * estrutura sem estourar.
 *
 * O plano ATIVO continua exigindo `validatePlan` completo: dele o app monta a agenda,
 * o treino do dia e a dieta, então meia-validade não serve.
 */
export function hasReadableTraining(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const training = (value as { training?: unknown }).training;
  if (!training || typeof training !== "object") return false;
  const { workouts, weekSchedule } = training as { workouts?: unknown; weekSchedule?: unknown };
  return Array.isArray(workouts) && Array.isArray(weekSchedule);
}
