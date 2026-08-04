/**
 * Leitor de Markdown mínimo — camada pura (schema 1.3, TASK-032).
 *
 * POR QUE NÃO UMA BIBLIOTECA
 * O Documento vem dentro do arquivo de plano, que é **entrada não confiável** — este
 * projeto já teve um XSS por `videoUrl` (TASK-006). Um renderizador de Markdown genérico
 * aceita HTML embutido por padrão e resolve isso com sanitização, ou seja, com uma lista de
 * bloqueio que precisa estar sempre certa.
 *
 * Aqui o parser devolve BLOCOS DE DADOS, e o componente monta elementos React a partir
 * deles. Nenhum caminho produz HTML a partir de string, então injeção não é "bloqueada" —
 * ela é **impossível por construção**. É a mesma postura do `LineChart`, que desenha SVG à
 * mão em vez de trazer uma lib de gráfico.
 *
 * O subconjunto suportado é o que o coach de fato emite (`ACTIVVE_HEALTH_SYSTEM.md`
 * ETAPA 2): títulos, parágrafos, listas e negrito. **Todo o resto é texto literal** — nunca
 * um erro, nunca um branco.
 */

export type Inline = { text: string; bold: boolean };

export type Block =
  | { kind: "heading"; level: 1 | 2 | 3; content: Inline[] }
  | { kind: "paragraph"; content: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] };

/** Quebra `**negrito**` em pedaços. Asterisco solto continua sendo asterisco. */
export function parseInline(line: string): Inline[] {
  const out: Inline[] = [];
  let resto = line;
  while (resto.length > 0) {
    const abre = resto.indexOf("**");
    if (abre === -1) break;
    const fecha = resto.indexOf("**", abre + 2);
    if (fecha === -1) break; // marcador sem par: literal
    if (abre > 0) out.push({ text: resto.slice(0, abre), bold: false });
    const dentro = resto.slice(abre + 2, fecha);
    if (dentro.length > 0) out.push({ text: dentro, bold: true });
    resto = resto.slice(fecha + 2);
  }
  if (resto.length > 0) out.push({ text: resto, bold: false });
  return out.length > 0 ? out : [{ text: "", bold: false }];
}

const ITEM_NAO_ORDENADO = /^\s*[-*]\s+(.*)$/;
const ITEM_ORDENADO = /^\s*\d+[.)]\s+(.*)$/;

/**
 * Converte o texto em blocos. **Função total**: qualquer entrada devolve uma lista de
 * blocos — no pior caso, parágrafos de texto literal.
 */
export function parseMarkdown(source: string): Block[] {
  const linhas = source.replace(/\r\n/g, "\n").split("\n");
  const blocos: Block[] = [];
  let paragrafo: string[] = [];
  let lista: { ordered: boolean; items: string[] } | null = null;

  const fecharParagrafo = () => {
    if (paragrafo.length > 0) {
      blocos.push({ kind: "paragraph", content: parseInline(paragrafo.join(" ")) });
      paragrafo = [];
    }
  };
  const fecharLista = () => {
    if (lista) {
      blocos.push({
        kind: "list",
        ordered: lista.ordered,
        items: lista.items.map(parseInline),
      });
      lista = null;
    }
  };
  const fecharTudo = () => {
    fecharParagrafo();
    fecharLista();
  };

  for (const linha of linhas) {
    if (linha.trim() === "") {
      fecharTudo();
      continue;
    }

    const titulo = /^(#{1,3})\s+(.*)$/.exec(linha);
    if (titulo) {
      fecharTudo();
      blocos.push({
        kind: "heading",
        level: titulo[1].length as 1 | 2 | 3,
        content: parseInline(titulo[2]),
      });
      continue;
    }

    const naoOrdenado = ITEM_NAO_ORDENADO.exec(linha);
    const ordenado = naoOrdenado ? null : ITEM_ORDENADO.exec(linha);
    if (naoOrdenado || ordenado) {
      fecharParagrafo();
      const ordered = !!ordenado;
      // Trocar de tipo de lista fecha a anterior: "- a" seguido de "1. b" são duas listas.
      if (lista && lista.ordered !== ordered) fecharLista();
      if (!lista) lista = { ordered, items: [] };
      lista.items.push((naoOrdenado ?? ordenado)![1]);
      continue;
    }

    fecharLista();
    paragrafo.push(linha.trim());
  }
  fecharTudo();
  return blocos;
}

const TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
export type HeadingTag = (typeof TAGS)[number];

/**
 * Nível de título mais alto que o documento de fato usa (1 se não houver nenhum).
 *
 * Existe porque o coach às vezes começa o documento em `##`. Ancorar a hierarquia no menor
 * nível PRESENTE, e não no nível 1 teórico, evita que um documento assim comece num `<h4>`
 * pendurado sob o `<h1>` da tela — um degrau pulado que o leitor de tela anuncia.
 */
export function topHeadingLevel(blocks: Block[]): 1 | 2 | 3 {
  let topo: 1 | 2 | 3 = 3;
  let achou = false;
  for (const b of blocks) {
    if (b.kind !== "heading") continue;
    achou = true;
    if (b.level < topo) topo = b.level;
  }
  return achou ? topo : 1;
}

/**
 * Tag real para um título do documento — `<h2>`, `<h3>`… nunca `<p>`.
 *
 * POR QUE NÃO É `<h1..h3>` DIRETO
 * O documento é conteúdo DENTRO de uma tela que já tem o seu próprio `<h1>` ("Meu plano").
 * Repetir `<h1>` produziria dois topos de documento e quebraria a navegação por títulos
 * justamente para quem depende dela. `base` é o nível a partir do qual o documento se
 * encaixa na tela hospedeira.
 *
 * O deslocamento preserva a hierarquia RELATIVA do documento; um degrau pulado pelo próprio
 * autor (`#` direto para `###`) atravessa como está — inventar o nível que falta seria
 * inferir estrutura que ninguém escreveu.
 */
export function headingTag(level: 1 | 2 | 3, top: 1 | 2 | 3, base = 2): HeadingTag {
  const nivel = Math.min(Math.max(base + (level - top), base), 6);
  return TAGS[nivel - 1];
}
