# Activve — Brief de produto e design (para gerar mockups)

> Documento autossuficiente para pedir mockups a uma IA (ex.: GPT) ou a um designer. Resume o que é o Activve, o que faz, as features e a direção visual.

## O que é
**Activve** é um app de fitness (PWA, mobile-first) que **executa e acompanha** um plano personalizado de **treino + dieta + metas**. A inteligência (o "coach") é **externa**: um gerador de IA faz uma **anamnese** e produz um **arquivo de plano**; o app importa esse arquivo e vira o **parceiro diário** de execução e acompanhamento. O app **não tem IA nem login no v1**: é **local-first** (dados no aparelho), offline, sem assinatura.

## Como funciona (ciclo fechado)
1. **Anamnese** num gerador externo (objetivo, sexo, idade, altura, peso, onde treina — casa/academia/ambos, disponibilidade, restrições).
2. O gerador produz um **arquivo de plano** (treino, dieta, meta, métricas-alvo).
3. O usuário **sobe o arquivo** no Activve; o app monta tudo.
4. **Uso diário:** treino guiado **série a série** + cronômetro de descanso, dieta do dia, registro de peso/medidas, progresso à meta, **mapa muscular** de recuperação.
5. O app **exporta um relatório** de progresso que volta ao gerador; ele **ajusta** e devolve um **plano novo** — preservando o histórico.
Ciclo: `plano → executa → relatório → ajusta → novo plano`.

## Usuário-alvo
Pessoa que treina pelo celular (academia ou casa), quer um plano estruturado sem pagar personal/nutri, e **nem sempre conhece exercícios pelo nome**. Uso diário, muitas vezes à noite, às vezes com pressa na academia.

## Princípios (estética e produto)
- **Premium = precisão, calma, espaço, tipografia, consistência** — NÃO excesso de cards/gradientes/sombras. **Nada de cara de template ou "gerado por IA".**
- **Anti-culpa:** sem streak punitivo, sem "você falhou", sem BMI/% de gordura em destaque, sem anéis de meta a fechar. Progresso enquadrado de forma positiva; **peso como tendência**, não número solto.
- **Privacidade:** dados sensíveis ficam no aparelho.
- **Sem fricção:** o plano diz o que fazer hoje; logar série é rápido, **sem teclado** (steppers + valores pré-preenchidos).
- **Identidade própria**, não genérica de fitness.

## Plataforma e direção visual sugerida
PWA **mobile-first**. Direção preferida: **"Calm Coach"** — **dark-first**, fundo quase-preto azulado, **muito respiro**, tipografia limpa, **UM acento** (verde-água/teal), cantos suaves, hairlines sutis. Sugira alternativas se tiver algo melhor, mantendo a maturidade e o anti-culpa.
**Evite:** muitos cards aninhados, gradientes decorativos, sombras pesadas, emojis como ícones, tipografia gigante, silhuetas infantis.

## Telas principais a desenhar (alta fidelidade, mobile)
1. **Onboarding / import do plano:** subir/colar o arquivo, **preview do plano** antes de confirmar, erro claro se inválido.
2. **Hoje:** saudação, **treino do dia** (foco, nº de exercícios, duração, CTA "começar"), **progresso da semana** (sem culpa), atalho pro corpo.
3. **Treino (lista do dia):** cada exercício com foto/"como fazer" e botão de **variação**.
4. **Modo treino (execução):** exercício atual com mídia, **registro série a série com steppers** (carga/reps), "concluir série", **cronômetro de descanso** (anel + presets 45/60/90s), navegação entre exercícios.
5. **"Como fazer" do exercício:** passos em texto + foto/gif/vídeo + as **≥2 variações** (com equipamento) para trocar quando a **máquina está ocupada / falta equipamento / casa vs. academia**.
6. **Dieta do dia:** refeições com itens/macros, **marcar refeição feita**, lista de compras.
7. **Corpo:** **mapa muscular (corpo humano, frente e costas)** com músculos trabalhados e **status de recuperação**; peso (tendência) e medidas; **fotos de progresso** (comparar antes/depois).
8. **Relatório / export:** resumo do período (treino, dieta, avanço à meta) para enviar ao coach.
9. **Settings:** unidades, tema, gerenciar/exportar dados.

## Componentes-destaque (capricho extra aqui)
- **Mapa muscular anatômico** (corpo humano frente+costas) com "heat" de recuperação (**trabalhado / recuperando / pronto**). Corpo humano de verdade — nada de silhueta de bolinha e pauzinho.
- **Seletor de variação** de exercício (mesma série, equipamento diferente).
- **Stepper de série** (sem teclado) + **cronômetro de descanso** (anel).
- **Gráfico de tendência de peso** (linha suave, sem dramatizar oscilação).

## Pedido
Gere **mockups de alta fidelidade, mobile, premium e com identidade própria** (não genérico) dessas telas, priorizando: **Hoje, Modo treino, Corpo (mapa muscular)**. Mostre 2–3 variações de direção visual se quiser.
