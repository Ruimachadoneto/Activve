import { describe, it, expect } from "vitest";
import { headingTag, parseInline, parseMarkdown, topHeadingLevel } from "./markdown";

const texto = (b: ReturnType<typeof parseMarkdown>[number]) =>
  b.kind === "list" ? b.items.map((i) => i.map((x) => x.text).join("")) : b.content.map((x) => x.text).join("");

describe("parseMarkdown — blocos", () => {
  it("títulos de 1 a 3 níveis", () => {
    const b = parseMarkdown("# Um\n\n## Dois\n\n### Três");
    expect(b.map((x) => x.kind)).toEqual(["heading", "heading", "heading"]);
    expect(b.map((x) => (x.kind === "heading" ? x.level : 0))).toEqual([1, 2, 3]);
  });

  it("linhas seguidas viram UM parágrafo; linha em branco separa", () => {
    const b = parseMarkdown("uma linha\ne a continuação\n\noutro parágrafo");
    expect(b).toHaveLength(2);
    expect(texto(b[0])).toBe("uma linha e a continuação");
  });

  it("listas com - e com número", () => {
    const b = parseMarkdown("- a\n- b\n\n1. x\n2. y");
    expect(b).toHaveLength(2);
    expect(b[0].kind === "list" && b[0].ordered).toBe(false);
    expect(texto(b[0])).toEqual(["a", "b"]);
    expect(b[1].kind === "list" && b[1].ordered).toBe(true);
  });

  it("trocar de tipo de lista fecha a anterior", () => {
    const b = parseMarkdown("- a\n1. b");
    expect(b).toHaveLength(2);
  });

  it("entrada vazia devolve lista vazia, não estoura", () => {
    expect(parseMarkdown("")).toEqual([]);
    expect(parseMarkdown("\n\n  \n")).toEqual([]);
  });

  it("CRLF do Windows não vira lixo", () => {
    expect(parseMarkdown("# A\r\n\r\ntexto")).toHaveLength(2);
  });
});

describe("títulos viram <h> reais, encaixados na tela", () => {
  /*
   * O documento é lido por quem navega por títulos. Renderizá-lo como `<p>` estilizado
   * apagava a estrutura numa tela cuja tarefa é LER — o achado [P2] do review.
   */
  const niveis = (fonte: string, base = 2) => {
    const blocos = parseMarkdown(fonte);
    const topo = topHeadingLevel(blocos);
    return blocos
      .filter((b) => b.kind === "heading")
      .map((b) => headingTag(b.kind === "heading" ? b.level : 1, topo, base));
  };

  it("documento que começa em # se encaixa a partir de h2 (a tela já tem o h1)", () => {
    expect(niveis("# Um\n\n## Dois\n\n### Três")).toEqual(["h2", "h3", "h4"]);
  });

  it("documento que começa em ## não pula degrau — vira h2, não h3", () => {
    expect(niveis("## Rotina\n\n### Detalhe")).toEqual(["h2", "h3"]);
  });

  it("degrau pulado pelo autor atravessa como está — não se inventa o nível que falta", () => {
    expect(niveis("# Um\n\n### Três")).toEqual(["h2", "h4"]);
  });

  it("sem título nenhum, topo é 1 e nada estoura", () => {
    expect(topHeadingLevel(parseMarkdown("só texto"))).toBe(1);
    expect(niveis("só texto")).toEqual([]);
  });

  it("base configurável: numa tela que encaixa mais fundo, desloca junto", () => {
    expect(niveis("# Um\n\n## Dois", 3)).toEqual(["h3", "h4"]);
  });

  it("nunca passa de h6", () => {
    expect(headingTag(3, 1, 6)).toBe("h6");
  });
});

describe("parseInline — negrito", () => {
  it("separa negrito do resto", () => {
    expect(parseInline("um **dois** três")).toEqual([
      { text: "um ", bold: false },
      { text: "dois", bold: true },
      { text: " três", bold: false },
    ]);
  });

  it("marcador sem par continua sendo texto", () => {
    expect(parseInline("isto ** não fecha")).toEqual([{ text: "isto ** não fecha", bold: false }]);
  });

  it("sempre devolve ao menos um pedaço", () => {
    expect(parseInline("")).toEqual([{ text: "", bold: false }]);
  });
});

describe("segurança: o Documento vem de arquivo NÃO CONFIÁVEL", () => {
  /*
   * O parser devolve DADOS e o componente monta elementos React — nenhum caminho produz
   * HTML a partir de string. Estes testes fixam a propriedade que garante isso: markup
   * hostil atravessa como TEXTO LITERAL, nunca como estrutura.
   */
  it("tag de script vira texto, não bloco", () => {
    const b = parseMarkdown("<script>alert(1)</script>");
    expect(b).toHaveLength(1);
    expect(b[0].kind).toBe("paragraph");
    expect(texto(b[0])).toBe("<script>alert(1)</script>");
  });

  it("img com onerror também é só texto", () => {
    const b = parseMarkdown('<img src=x onerror="alert(1)">');
    expect(texto(b[0])).toBe('<img src=x onerror="alert(1)">');
  });

  it("link com javascript: não vira link — não há link nenhum", () => {
    // O subconjunto não suporta links de propósito: sem `href`, não existe a classe de
    // problema que derrubou o `videoUrl` na TASK-006.
    const b = parseMarkdown("[clique](javascript:alert(1))");
    expect(b[0].kind).toBe("paragraph");
    expect(texto(b[0])).toContain("javascript:alert(1)");
  });

  it("documento gigante não trava o parser", () => {
    const grande = Array.from({ length: 5000 }, (_, i) => `- item ${i}`).join("\n");
    const b = parseMarkdown(grande);
    expect(b).toHaveLength(1);
    expect(b[0].kind === "list" && b[0].items).toHaveLength(5000);
  });
});
