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
