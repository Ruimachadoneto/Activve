# TASK-027 — Cobertura de mídia dos exercícios + escala do calendário

> **Status: MERGEADA em `main`.** Origem: feedback de uso real do usuário em 2026-07-30,
> logo após o merge da TASK-026.

## O que o usuário reportou

1. *"a escala de intensidade do calendário ficou muito sutil e não dá pra ver facilmente
   diferença, o que praticamente deixa a escala morta."*
2. *"percebi que existem treinos sem imagens, isso aí é um impacto direto ao core do app,
   não podemos deixar ocorrer."*

---

## 1. Escala do calendário: opacidade → geometria

**Causa medida:** eu tinha codificado volume em **opacidade** (14%→44%). Opacidade tem
teto de contraste — o acento acima de ~44% derruba o número do dia abaixo do AA (medido:
3,6:1). A faixa que sobrava era sutil demais para comparar dois dias de relance, que era o
ponto do mapa. A restrição de acessibilidade e a de legibilidade estavam brigando pelo
mesmo canal visual.

**Correção:** a cor ficou **fixa** (40% do acento) e o que varia é a **altura** do nível
dentro da célula, de baixo para cima. Altura não tem custo de contraste.

- Alturas de **41% a 100%** na mesma amostra onde antes a diferença era alpha 0,20→0,44.
- Contraste passou a ser **uniforme em 5,6:1** — antes variava de 4,94 a ~8, e ficava pior
  justamente nos dias de maior volume.
- Base tênue de 10% atrás do nível: dia treinado de volume baixo continua lendo como
  "treinei" em vez de parecer célula vazia.

**Regra que fica:** quando um canal visual esbarra em acessibilidade, trocar de canal
costuma ser melhor do que espremer o mesmo.

---

## 2. Mídia: casamento estrutural (28% → 100% na amostra)

**Medido antes de mexer:** numa amostra de 60 nomes realistas de plano, o dicionário de
string EXATA resolvia **17 (28%)**.

**Causa:** o formato estava errado, não faltavam chaves. Quase toda falha era "movimento
conhecido + um modificador" — `remada baixa` casava, `remada baixa no cabo` não;
`agachamento livre` casava, `agachamento livre com barra` não. Enumerar combinações não
converge: cada plano novo pede outra chave.

**Solução:** casar por **estrutura**.
- `scripts/build-exercise-index.mjs` gera `exerciseIndex.generated.ts` a partir do
  free-exercise-db: **37 núcleos de movimento**, 440 variações, com tags derivadas do
  próprio catálogo (equipamento + palavras do nome em inglês).
- O resolvedor identifica o núcleo no nome PT-BR e escolhe, dentro dele, a variação cujas
  tags mais combinam com os modificadores. **Modificador desconhecido deixa de quebrar o
  match: ele apenas não pontua.**
- Precedência: `mediaId` do plano → dicionário curado → estrutural → `null`.

**A garantia que sobrevive:** nunca atravessamos movimentos. Sem núcleo reconhecido,
`null` — "supino" jamais devolve agachamento, e "esteira"/"alongamento" continuam sem
foto. Dentro do núcleo, cair numa variação próxima é honesto: é o mesmo movimento, e o
nome exibido continua sendo o do plano, não o da foto.

**O dicionário curado não morreu** — virou o que devia ser: uma lista curta de
**idiomatismos**, palavras que não descrevem mecânica ("remada baixa", "abdominal infra",
"tríceps banco").

### Auditoria: o número não bastava

Os 60 resultados foram conferidos **um a um**. "Não-nulo" não é "certo" — e a auditoria
achou 6 matches errados que o teste de cobertura teria deixado passar:
- alongamento entrando como exercício (`Tríceps francês` → `Tricep_Side_Stretch`;
  `Agachamento búlgaro` → `Sit_Squats`) → filtro por categoria de força;
- equipamento `other` (trenó, banda assistida) sem tag **parecia genérico** e ganhava o
  desempate de campeões óbvios (`Band_Assisted_Pull-Up` vencia `Pullups`) → tag própria
  com peso 3 na penalidade;
- `"barra w"` contém `"barra"`: o nome pedia os dois equipamentos e toda variação de barra
  reta ganhava um acerto de graça.

### Review Codex: 4 achados [P1], todos da MESMA forma

| Achado | Sintoma |
|---|---|
| `/chin/` casava dentro de ma-**CHIN**-e | toda variação de máquina ganhava tag `supinada` falsa |
| desempate caía na ordem do arquivo | "agachamento no smith" → `Smith_Machine_Pistol_Squat` |
| `kickback` cru | `Glute_Kickback` no núcleo de tríceps → foto de glúteo |
| `\brow\b` sem plural | `Seated_Cable_Rows` fora do índice → `Shotgun_Row` |

Quatro achados da mesma família em duas rodadas: **regex sobre nome em inglês deixando
entrar movimento errado no núcleo**. Corrigir regex a regex não converge.

**Fechando a classe:** o gerador agora valida cada entrada contra a **musculatura** que o
catálogo declara (primário OU secundário). Um exercício de glúteo não pode morar no núcleo
de tríceps, escreva-se o nome como se escrever — a guarda é ortogonal ao nome. O script
**reporta cada descarte** (6 hoje), então um erro de bucketing novo aparece na hora de
gerar, não meses depois na tela do usuário.

O critério "primário OU secundário" veio de dado: o catálogo classifica supino fechado
como **tríceps**-primário (peito é secundário), e só-primário descartava variações
legítimas.

---

## Gates
`typecheck` ✓ · `lint` ✓ · **244/244** testes ✓ · `build` ✓ (eram 229 antes da task).

## Verificação
- 60 nomes realistas resolvem, conferidos um a um; URLs de 8 ids checadas (HTTP 200).
- No browser em 390×844: plano com nomes que antes falhavam
  ("Supino inclinado com halteres", "Elevação lateral sentado", "Remada baixa no cabo
  aberta", "Agachamento búlgaro") → 4 fotos distintas, **0 imagens quebradas**.
- Calendário: alturas 41%→100%, contraste uniforme 5,6:1.

## Pendência fora do repo (agora menos crítica)
O gerador (artifact do GPT) ainda não emite `mediaId` — material em
`docs/ai/GENERATOR_1.1.md`. Com o casamento estrutural, isso deixou de ser a diferença
entre ter e não ter foto; virou só a diferença entre a variação exata e uma próxima.

## Como regenerar o índice
```bash
node scripts/build-exercise-index.mjs
```
