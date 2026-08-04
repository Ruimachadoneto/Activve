import { headingTag, parseMarkdown, topHeadingLevel, type Inline } from "@/lib/plan/markdown";

/**
 * Renderiza o Documento do coach (schema 1.3).
 *
 * Monta **elementos React** a partir dos blocos de `parseMarkdown` — nunca HTML a partir de
 * string. O Documento vem do arquivo de plano, que é entrada não confiável, e por este
 * caminho a injeção não é bloqueada: ela é impossível (ver o raciocínio em `markdown.ts`).
 *
 * **Registro C — Editorial** (`DESIGN_SYSTEM` §0): medida de linha curta e entrelinha larga.
 *
 * `headingBase` é o nível de `<h>` em que o documento se encaixa na tela hospedeira: numa
 * tela cujo `<h1>` já é o título da página, os títulos do documento começam em `<h2>`.
 */
export function Markdown({ source, headingBase = 2 }: { source: string; headingBase?: number }) {
  const blocks = parseMarkdown(source);
  const topo = topHeadingLevel(blocks);

  const inline = (content: Inline[]) =>
    content.map((pedaco, i) =>
      pedaco.bold ? (
        <strong key={i} className="font-medium text-ink">
          {pedaco.text}
        </strong>
      ) : (
        <span key={i}>{pedaco.text}</span>
      ),
    );

  return (
    <div className="flex flex-col">
      {blocks.map((b, i) => {
        if (b.kind === "heading") {
          // O degrau Display (§3.1) fica reservado ao título da TELA; aqui a hierarquia
          // interna do documento usa os degraus abaixo dele. O ESTILO segue o nível lógico
          // do Markdown; a TAG segue a posição na tela (`headingTag`) — são perguntas
          // diferentes e responder as duas com o mesmo número é o que produzia `<p>`.
          const Tag = headingTag(b.level, topo, headingBase);
          const cls =
            b.level === 1
              ? "mt-7 first:mt-0 text-[22px] font-medium leading-tight tracking-tight text-ink"
              : b.level === 2
                ? "mt-6 first:mt-0 text-[17px] font-medium leading-snug text-ink"
                : // `text-faint` (o padrão de eyebrow do app) mede 3,3:1 sobre o fundo e
                  // reprova no AA. Numa tela cuja tarefa é LER, um título ilegível é o
                  // mesmo defeito por outro canal.
                  "mt-5 first:mt-0 text-[11px] uppercase tracking-wider text-muted";
          return (
            <Tag key={i} className={cls}>
              {inline(b.content)}
            </Tag>
          );
        }
        if (b.kind === "list") {
          const Tag = b.ordered ? "ol" : "ul";
          return (
            <Tag
              key={i}
              className={`mt-2.5 flex flex-col gap-1.5 pl-5 ${b.ordered ? "list-decimal" : "list-disc"} marker:text-faint`}
            >
              {b.items.map((item, j) => (
                <li key={j} className="max-w-[46ch] text-[15px] leading-relaxed text-muted">
                  {inline(item)}
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={i} className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted">
            {inline(b.content)}
          </p>
        );
      })}
    </div>
  );
}
