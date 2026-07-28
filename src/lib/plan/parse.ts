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
 * Escopo desta guarda: **só leitura rasa de `id`/`name`** percorrendo
 * workouts/exercises (o calendário de `/relatorios`). Quem faz cálculo profundo sobre
 * um plano — `buildReport`, que desce até músculos/volume/variações — precisa de
 * `validatePlan` completo; espelhar campo a campo aqui seria reescrever o schema pior.
 * O plano ATIVO também exige `validatePlan`: dele o app monta agenda, treino do dia e
 * dieta, então meia-validade não serve.
 */
export function hasReadableTraining(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const training = (value as { training?: unknown }).training;
  if (!training || typeof training !== "object") return false;
  const { workouts } = training as { workouts?: unknown };
  // Só isto: `workouts` percorrível. Nada mais.
  //
  // A guarda já foi mais rígida (exigia `weekSchedule`, depois que TODO workout tivesse
  // `exercises` de objetos) e cada aperto custou caro no review: descartava um plano
  // inteiro por um defeito localizado, e o histórico daquele ciclo regredia pra ids
  // crus. Rigidez aqui é all-or-nothing — não existe "descartar meio plano".
  //
  // O caminho certo é o oposto: cada LEITOR se protege do que desreferencia
  // (`buildExerciseMuscles` normaliza músculos/variações; `exerciseName`/`movementName`
  // pulam treino ilegível; `workoutsScheduled` ignora agenda ausente). Assim a
  // corrupção degrada só a parte afetada e o resto do ciclo continua legível.
  return Array.isArray(workouts);
}
