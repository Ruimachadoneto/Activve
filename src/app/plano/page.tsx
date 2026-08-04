"use client";

import Link from "next/link";
import { ChevronLeft, Quote, Sparkles } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { PlanErrorState } from "@/components/PlanErrorState";
import { Markdown } from "@/components/Markdown";

/**
 * "Meu plano" — o Documento do coach, por extenso (schema 1.3).
 *
 * POR QUE ESTA TELA EXISTE
 * O coach faz uma anamnese profunda (orçamento, onde a pessoa faz compras, hobbies,
 * refúgios mentais) e entrega DOIS artefatos: o arquivo do app e um Documento em Markdown
 * com o plano explicado. Até aqui só o primeiro atravessava — o Documento ficava no chat e
 * se perdia. Resultado: uma consulta de 30 minutos sobre a vida da pessoa chegava ao app
 * como treino + dieta + meta, e o plano parecia template mesmo não sendo.
 *
 * Esta tela é o artefato que mais comunica personalização, e era o único que não existia.
 *
 * **Registro C — Editorial** (`DESIGN_SYSTEM` §0): a tarefa aqui é LER. Tipografia
 * protagonista, medida de linha curta, sem cartões disputando atenção.
 */
export default function PlanoPage() {
  const { loading, plan, invalid } = useActivePlan();

  if (invalid) return <PlanErrorState errors={invalid.errors} />;

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 items-center justify-center px-5">
        <p className="text-sm text-muted">Carregando…</p>
      </main>
    );
  }

  const p = plan?.plan;
  const wellness = p?.wellness;
  /*
    O schema aceita `title: "   "` (é `min(1)` sobre a string crua), e um hábito sem
    título visível é uma linha em branco que ainda contaria como conteúdo. A régua é a
    mesma dos outros campos, aplicada AQUI e não na importação: recusar o arquivo inteiro
    por causa de um hábito em branco jogaria fora treino e dieta bons — a desproporção que
    a TASK-013 decidiu evitar.
  */
  const habits = (wellness?.habits ?? []).filter((h) => h.title.trim().length > 0);

  /*
    CAMPO PRESENTE NÃO É CONTEÚDO.
    O schema aceita `wellness: {}` e `{habits: []}` num plano 1.3 válido, e aceita `context`
    e `document` só com espaços. Perguntar "o campo existe?" fazia a tela contar isso como
    conteúdo: suprimia o aviso de formato anterior E desenhava um card em branco — o pior
    dos dois mundos, porque some a explicação e sobra a moldura.
    Uma régua só decide o que aparece e se o aviso aparece; sem ela, a mesma pergunta seria
    respondida em quatro lugares com respostas diferentes (a classe de bug das TASK-016/029).
  */
  const contexto = p?.context?.trim() ?? "";
  const documento = p?.document?.trim() ?? "";
  const resumoBemEstar = wellness?.summary?.trim() ?? "";
  const temBemEstar = resumoBemEstar.length > 0 || habits.length > 0;
  const temAlgo = documento.length > 0 || contexto.length > 0 || temBemEstar;

  return (
    <main className="stagger mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-6">
      <header className="flex items-center gap-3">
        <Link
          href="/mais"
          aria-label="Voltar"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <div>
          <h1 className="text-xl font-medium tracking-tight">Meu plano</h1>
          <p className="mt-0.5 text-sm text-muted">Por extenso, do jeito que foi montado.</p>
        </div>
      </header>

      {!p ? (
        <section className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="text-[30px] font-medium leading-[1.15] tracking-tight">Nenhum plano ainda</h2>
          <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-muted">
            Quando você importar um plano, ele aparece aqui inteiro.
          </p>
          <Link
            href="/import"
            className="mt-6 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent"
          >
            Importar plano
          </Link>
        </section>
      ) : (
        <>
          {/*
            O ESPELHO primeiro. É o resumo que o coach confirmou antes de gerar — e é o que
            transforma a tela de "um plano" em "o MEU plano". Vem antes do documento porque
            é a resposta à pergunta que a pessoa tem ao abrir: "isto entendeu a minha vida?"
          */}
          {contexto ? (
            <section className="mt-6 rounded-card border border-accent/25 bg-accent/[0.04] p-5">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-accent">
                <Quote size={13} aria-hidden /> O que entendi de você
              </p>
              <p className="mt-2.5 max-w-[46ch] text-[15px] leading-relaxed text-ink">{contexto}</p>
            </section>
          ) : null}

          {temBemEstar ? (
            <section className="mt-4 rounded-card border border-line bg-surface p-5">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-faint">
                <Sparkles size={13} aria-hidden className="text-recovering" /> Bem-estar
              </p>
              {resumoBemEstar ? (
                <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-muted">
                  {resumoBemEstar}
                </p>
              ) : null}
              {habits.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3.5">
                  {habits.map((h) => {
                    // Mesma régua nos campos auxiliares: um `when` só com espaços viraria
                    // um "·" pendurado, e um `why` em branco, um parágrafo fantasma.
                    const quando = h.when?.trim() ?? "";
                    const porque = h.why?.trim() ?? "";
                    return (
                      <li key={h.id}>
                        <p className="text-sm font-medium text-ink">
                          {h.title.trim()}
                          {quando ? <span className="font-normal text-faint"> · {quando}</span> : null}
                        </p>
                        {/* O `why` é o que separa "medite 10 min" de um plano de verdade. */}
                        {porque ? (
                          <p className="mt-1 max-w-[44ch] text-[13px] leading-relaxed text-muted">
                            {porque}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <p className="mt-4 text-xs leading-relaxed text-faint">
                Isto é apoio, não cobrança. Nenhum destes itens é marcado, contado ou cobrado.
              </p>
            </section>
          ) : null}

          {documento ? (
            <section aria-label="Plano por extenso" className="mt-6 border-t border-line pt-6">
              <Markdown source={documento} />
            </section>
          ) : null}

          {!temAlgo ? (
            /*
              Plano de schema antigo (1.0–1.2): válido, só não carrega estes campos. Dizer
              isso é melhor que uma tela vazia sem explicação — e aponta a saída.
            */
            <section className="mt-8 rounded-card border border-line bg-surface p-5">
              <h2 className="text-lg font-medium">Este plano não trouxe o texto completo</h2>
              <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-muted">
                Ele foi gerado num formato anterior, que só carregava treino e dieta. O treino
                continua funcionando normalmente — o que falta aqui é a explicação por extenso.
                No próximo ciclo, peça o plano atualizado ao coach.
              </p>
            </section>
          ) : null}
        </>
      )}

      <BottomNav active="mais" />
    </main>
  );
}
