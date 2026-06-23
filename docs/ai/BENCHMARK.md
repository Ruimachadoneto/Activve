# Activve — Benchmark de mercado (segmento fitness)

> Obrigatório antes de desenhar (VISUAL_QUALITY §3 / política §30.3). Pesquisa web em 2026-06-22.
> Lente: **absorver** o que é bem recebido · **melhorar** o que irrita · **inovar** pra surpreender — sempre dentro das restrições do Activve (v1 local-first, plan-file, sem IA de servidor, anti-culpa).

## 1. Apps estudados
- **Logging de treino:** Hevy, Strong, Fitbod, JEFIT, StrengthLog.
- **Nutrição:** MacroFactor, MyFitnessPal, Cronometer; foto/IA: Cal AI, SnapCalorie, Calorie Mama.
- **Holístico / anti-culpa:** Gentler Streak (Apple Design Award), Apple Fitness.
- **Programa guiado / coaching:** Caliber, Ladder, Future, Centr, Aaptiv, BetterMe, Muscle Booster.
- **Corpo / progresso:** Progress, MacroFactor (fotos+medidas), ZOZOFIT, Shapez.
- **Logging rápido / wearable:** Strong (Watch), RepCount (voz), Motra (contagem automática).

## 2. ABSORVER — features comprovadas e amadas
| Feature | De onde | Por que funciona | Status no Activve |
|---|---|---|---|
| **Auto-preencher última sessão** (carga/reps) | Hevy | "A feature mais útil pra progressão" — você sempre sabe o que fez | MUST (já no FEATURE_MAP como "referência da última sessão") |
| **Timer de descanso auto** (dispara ao concluir série, por exercício, com háptico) | Hevy | Fluxo sem caça a botão | MUST (já previsto) |
| **Logging limpo e rápido entre séries** (steppers, sem teclado, poucos toques) | Strong/Hevy | Baixa fricção = consistência | MUST (já previsto) |
| **Performance anterior visível durante a execução** | Strong (Watch) | Contexto pra decidir a carga | MUST |
| **Gráficos de volume por grupo muscular + progressão por exercício** | Hevy/Fitbod | "As métricas que dizem se o programa funciona" | SHOULD |
| **Demonstração em vídeo + dicas de forma** | Caliber, Aaptiv, Ladder | Essencial pra iniciante que não conhece exercício pelo nome | MUST (mídia por id + "ver vídeo") |
| **Peso como TENDÊNCIA, não pontos soltos** | MacroFactor, Progress | Tira o drama do dia ruim — alinhado ao anti-culpa | MUST |
| **Fotos de progresso lado a lado** (frente/lado/costas, comparar 2 datas) | Progress, MacroFactor | "Mudança pequena fica real" | SHOULD |
| **Muitas medidas + customizáveis** (17+, custom) | Progress | Cada um acompanha o que importa | SHOULD |
| **Export / posse dos dados** | Reddit (forte desejo) | Usuário quer ser dono e poder migrar | MUST (já é pilar local-first) |
| **Onboarding: personalização → valor imediato → 1ª ação** | MyFitnessPal, estudos | Aha na 1ª sessão; 5-6 perguntas valem se o output muda visivelmente | A anamnese→plano→app JÁ é isso |
| **Voiceover/guia opcional (liga/desliga)** | Ladder | Respeita iniciante e avançado | COULD |
| **"Top 3 treinos prioritários da semana"** | Ladder | Combate paralisia de escolha | COULD (combina com agenda flexível) |
| **Plano adaptativo a partir de dados reais** (TDEE recalculado; balancear volume) | MacroFactor, Fitbod | Mantém o plano relevante | Vai pro **gerador** (não pro app) — re-anamnese gera plano novo |

## 3. MELHORAR — o que o mercado faz mal (nossa chance)
- **Paywall em feature essencial** (MyFitnessPal pôs leitor de código de barras atrás de assinatura; análises atrás de paywall). → **Activve v1 sem assinatura, sem paywall.** Diferencial enorme de confiança.
- **Upsell agressivo / cobrança-surpresa** a cada abertura. → **Zero upsell.**
- **Fricção de digitação manual** que "supera o benefício" e mata o hábito. → **Steppers + pré-preenchido + plano já diz o que fazer.**
- **Social como bloat** (maioria no Reddit treina pra si, não por likes). → **Sem rede social no Activve** (já é não-objetivo).
- **Paralisia de escolha** (excesso de opções) — driver primário de abandono. → **O plano remove a escolha:** "hoje é isto". Vantagem estrutural nossa.
- **Lock-in / export difícil.** → **Export é cidadão de 1ª classe.**
- **IA de foto de comida promete demais** (erro 15–20% de calorias — pode te jogar de déficit pra superávit). → Não dependemos disso; se entrar, com transparência de margem (e fora do v1, pois exige IA).

## 4. DESENHAR CONTRA O CHURN (por que abandonam)
Dados: ~**80% abandonam em 30 dias**; topo dos motivos = **perda de motivação/desistência da meta (38%)** e **alternativa grátis (25%)**; "efeito janeiro" (pico em jan, 40–60% cancelam até fev). Drivers de UX: **paralisia de escolha** e **fricção de entrada manual**. Também: "não vê progresso / não entende o plano / não se sente apoiado" e **expectativa irreal** (querer resultado em dias).

**Implicações de design pro Activve:**
1. **Matar a paralisia:** o plano diz o que fazer hoje (já temos).
2. **Fricção mínima** no log (steppers/pré-preenchido).
3. **Progresso visível e compreensível** sempre à mão (tendência + foto + "você está aqui na meta").
4. **Anti-culpa salva o momento de churn** (o dia/ semana perdida): nada de "você falhou", retomar é fácil. ESTE é o ponto onde quase todos perdem o usuário.
5. **Expectativa realista:** o plano tem horizonte/meta com data; comunicar que resultado leva meses.
6. **Grátis e offline** ataca direto o "fui pra alternativa grátis" e o medo com dados sensíveis.

## 5. INOVAR — onde o Activve pode surpreender (nossa posição única)
A própria arquitetura plan-file é a inovação. Explorar:

1. **"Seu coach é um arquivo seu" (portabilidade total).** Plano + progresso são um arquivo que você possui, leva, faz backup e **entrega ao seu personal/nutri de verdade** pra ele ajustar. Todo mundo te prende; nós te libertamos. Transforma a reclamação nº1 (posse de dados) em feature central.
2. **Profissional humano no loop, sem backend.** Como o plano é um documento, um personal/nutricionista pode **gerar/editar** o arquivo e te entregar (ou importar seu export e devolver ajustado). Entrega o "coach humano" (que Caliber/Future cobram caro) sem o app precisar de servidor.
3. **Anti-culpa aplicado a um plano estruturado.** Gentler Streak é anti-culpa mas sem plano; logging apps têm plano mas são frios. Activve une os dois: plano sério + execução que **não pune** falha (descanso faz parte, retomar é natural, progresso positivo).
4. **Privacidade por padrão como argumento.** Dados de corpo/foto **nunca saem do aparelho** (v1). Num mercado que vende seus dados, isso é confiança — e marketing honesto.
5. **Continuidade com "diff" de plano.** Ao subir plano novo, o app mostra **o que mudou** e preserva seu histórico (casado por `exercise.id`). Ninguém faz re-plan sem zerar progresso.
6. **Mídia sem hospedar vídeo.** Imagens de execução (banco aberto free-exercise-db) + "ver vídeo" via busca no YouTube pelo nome — resolve forma do iniciante sem custo/infra (aprendizado da Bárbara).
7. **(Futuro) Logging por voz** entre séries (mãos ocupadas) — RepCount faz em ~2s; cabe como COULD.

## 6. Síntese estratégica
O Activve não compete por "mais features". Compete por **três coisas que o mercado erra junto**: (a) **sem paywall/sem lock-in** (você é dono), (b) **sem fricção/sem paralisia** (o plano conduz), (c) **anti-culpa** (sobrevive ao dia perdido). A inovação de marca é a **portabilidade do plano** — "leve seu coach com você". Tudo isso é viável **dentro** do v1 local-first.

## 7. Fontes
- [Fitbod — Best Workout Tracker Apps 2026](https://fitbod.me/blog/best-workout-tracker-apps-for-2026/) · [Sensai — Hevy vs Strong vs Fitbod vs Jefit](https://www.sensai.fit/blog/hevy-vs-strong-vs-fitbod-vs-jefit) · [Hevy — Rest Timer](https://www.hevyapp.com/features/workout-rest-timer/) · [Hevy features](https://www.hevyapp.com/features/)
- [Fitia — Best macro tracker apps 2026](https://fitia.app/learn/article/best-macro-tracker-apps-2026/) · [Macronutrient Calculator — apps compared](https://www.macronutrientcalculator.org/blog/macro-tracking-apps/) · [MacroFactor — progress photos & body metrics](https://macrofactorapp.com/progress-photos-and-body-measurement-tracker/)
- [Sketch — How Gentler Streak brings kindness to fitness](https://www.sketch.com/blog/gentler-streak/) · [Apple Developer — Behind the Design: Gentler Streak](https://developer.apple.com/news/?id=3m0ht22s)
- [Setgraph — Best Workout App Reddit](https://setgraph.app/ai-blog/best-workout-app-reddit) · [DEV — Fitness App Paywalls UX patterns](https://dev.to/paywallpro/top-fitness-app-paywalls-ux-patterns-pricing-insights-2868)
- [Yu-kai Chou — Top 10 Gamification in Fitness](https://yukaichou.com/gamification-analysis/top-10-gamification-in-fitness/) · [RazFit — Best gamified workout apps 2026](https://razfit.app/gamification-fitness/best-gamified-workout-apps-2026/)
- [Cal AI review (Vora)](https://askvora.com/blog/cal-ai-acquisition-photo-food-logging) · [Clinical Nutrition Report — AI photo calorie benchmark 2026](https://clinicalnutritionreport.com/research/ai-photo-calorie-benchmark-2026/)
- [UXCam — Apps with great onboarding](https://uxcam.com/blog/10-apps-with-great-user-onboarding/) · [Adapty — Onboarding best practices 2026](https://adapty.io/blog/how-to-fix-your-onboarding-flow/)
- [findyouredge — Best strength apps for Apple Watch 2026](https://www.findyouredge.app/news/best-strength-training-apps-apple-watch-2026) · [JEFIT — log sets on smartwatch 2026](https://www.jefit.com/wp/guide/best-apps-to-log-sets-and-reps-on-smartwatch-in-2026-top-7-tested/)
- [RetentionCheck — Fitness app churn 2026](https://retentioncheck.com/churn-benchmarks/fitness-apps) · [Vocal — Why most fitness apps lose 80% in 30 days](https://vocal.media/01/why-most-fitness-apps-lose-80-of-users-in-30-days) · [JMIR — When and why adults abandon lifestyle apps](https://www.jmir.org/2024/1/e56897)
- [BarBend — Caliber review](https://barbend.com/caliber-fitness-app-review/) · [Garage Gym Reviews — Best workout apps 2026](https://www.garagegymreviews.com/best-workout-apps) · [QuickFitPros — apps with video tutorials](https://quickfitpros.com/fitness-apps-with-video-tutorials)
