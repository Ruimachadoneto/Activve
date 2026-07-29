# TASK-025 — Super upgrade visual "Vivid" (Fase 1)

## Metadados
- Status: `review` · Risco: `médio` (visual em todas as telas + lógica nova de recorde)
- Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-025-vivid-claude` · Base: `main`

## Origem
Pedido do usuário: elevar o app a outro nível — "irreconhecível de forma positiva" — liberando
explicitamente os limites de sobriedade da documentação. A decisão está registrada no
`DESIGN_SYSTEM.md` §0.1 (direção v3), junto com o que **continua** não negociável: honestidade de
dados, anti-culpa, plan-file e acessibilidade. Liberou-se estética, não integridade.

## Entregue nesta fase
1. **Atmosfera global** (`globals.css`): dois campos de luz fixos no canvas (teal/azul, ≤9%),
   `.card-lift` (relevo), `.text-grad-accent`, brilho ambiente no `.elev-focus`, `.stagger`
   por nth-child (zero configuração por tela).
2. **Nav flutuante**: pílula fixa com blur e aba ativa destacada. O espaçador vive DENTRO do
   componente — nenhuma das 7 telas precisou mudar padding.
3. **Herói vira gauge**: arco semicircular (r=82), preenchimento por `stroke-dashoffset`
   (composited), brilho na cor semântica, número central 56px. Anima com a contagem existente;
   com `prefers-reduced-motion` nasce no valor final.
4. **Modo Treino imersivo (registro B)**: a foto do exercício, desfocada e escurecida
   (`blur-2xl`, 16% de opacidade), vira a atmosfera do topo — o blur pesado é o que torna
   utilizável o fundo branco das fotos do free-exercise-db.
5. **Recorde pessoal**: `bestPreviousLoad` puro em `session.ts` (+5 testes) — maior carga em
   sessões concluídas do MESMO movimento (variação não cruza com base). Ao concluir série com
   carga acima, selo com troféu + anel de luz + vibração `[40,60,40]`. **Sem histórico não
   celebra** (primeiro treino não tem recorde a bater — celebração barata não é celebração).

## Achado da verificação (não do review)
O overlay de descanso abria NO MESMO FRAME por cima do selo — a celebração nunca seria vista.
Corrigido com um compasso de 1,6s: selo sozinho em cena, depois o descanso. Também corrigida a
vírgula pt-BR no selo ("62,5 kg", não "62.5 kg").

## Evidências (browser 390×844, DOM + screenshots)
- Hoje: atmosfera, gauge 32% em laranja com halo, nav pílula, nome em gradiente, stagger.
- Treino: backdrop respirando a cor da foto; selo "Recorde pessoal · 65 kg" aparece sozinho
  (`descansoAbriuJunto: false`) e o descanso abre após o compasso.
- Gates: typecheck ✓ · lint ✓ · **200/200** ✓ · build ✓ · console limpo.

## Fora desta fase (próximas)
Tela de conclusão de treino celebrada; Corpo/Relatórios no tratamento v3; registro C.

## Pendente
- [ ] Gate visual do usuário + aprovação de merge.
