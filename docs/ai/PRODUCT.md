# Activve — Especificação de produto

> Spec viva. Atualize ao mudar escopo/decisão. Origem: TASK-001.

## 1. Visão
**Activve** é um app de fitness que transforma um **plano personalizado** (treino + dieta + metas), gerado a partir de uma anamnese, em uma experiência diária de execução e acompanhamento — no celular, offline, com contas e sincronização.

A frase: *"Seu personal e seu nutri viram um app. Você responde a anamnese, gera o plano, sobe no Activve, e ele conduz seu dia a dia."*

## 2. Como funciona (o modelo "plan-file")
1. **Anamnese (fora do app):** um gerador (artifact/Claude) pergunta objetivo, sexo, idade, altura, peso, onde treina (casa/academia/ambos), disponibilidade, restrições, preferências.
2. **Geração:** o gerador produz um **arquivo de plano JSON** versionado (treino, dieta, meta, métricas-alvo).
3. **Import:** o usuário loga no Activve e **sobe o arquivo**. O app valida e monta tudo.
4. **Uso diário:** Activve conduz o treino (execução série a série + descanso), mostra a dieta do dia, registra peso/medidas e acompanha a meta.
5. **Evolução:** ao mudar objetivo, gera-se um novo plano e sobe de novo — **o histórico de progresso é preservado**.

Consequência: **o app não tem IA nem custo de API.** A inteligência é o output do gerador.

## 3. Público-alvo
- **Primário:** pessoa que treina pelo celular e quer um plano estruturado sem pagar mensalidade de personal/nutri. Usa diariamente, na academia ou em casa.
- **Secundário (origem do conceito):** quem recebe um plano de um profissional e quer um app para executá-lo e acompanhar progresso.
- Dispositivo principal: **celular**. Conhecimento de exercícios: variável (precisa de orientação visual).

## 4. Objetivos (v1)
- Importar um plano JSON válido e montar treino, dieta, meta e métricas a partir dele.
- Conduzir a execução do treino (registro série a série + cronômetro de descanso).
- Registrar progresso (peso, medidas) e mostrar avanço rumo à meta.
- Contas + sync: o mesmo plano e progresso em qualquer aparelho.
- Funcionar offline; sincronizar quando online.

## 5. Não-objetivos (v1)
- Gerar o plano dentro do app (a anamnese/geração é externa).
- IA no servidor / chat de coach no app.
- Rede social, comunidade, compartilhamento público.
- Integração com wearables / Apple Health / Google Fit.
- Cobrança/assinatura.
- Tracking nutricional fino (contar tudo que comeu); v1 mostra o **plano** de dieta, não diário alimentar completo.

## 6. User stories
1. Como usuário, quero **criar conta e entrar**, para meus dados ficarem salvos e sincronizados.
2. Como usuário, quero **subir meu arquivo de plano**, para o app montar meu treino, dieta e metas.
3. Como usuário, quero ver **erro claro** se o arquivo for inválido/incompatível, para saber o que corrigir.
4. Como usuário, quero ver o **treino do dia** e executá-lo **série a série**, com cronômetro de descanso, sem digitar no teclado durante o treino.
5. Como usuário, quero ver **como fazer** cada exercício (orientação/visual), porque nem sempre conheço pelo nome.
6. Como usuário, quero ver a **dieta do dia** (refeições do plano), para seguir a alimentação.
7. Como usuário, quero **registrar peso e medidas** e ver o **progresso rumo à meta**.
8. Como usuário, quero **subir um plano novo** quando meu objetivo mudar, **sem perder meu histórico**.
9. Como usuário, quero usar **offline** na academia e ver tudo sincronizar depois.

## 7. Escopo do MVP (proposto)
**Inclui:** contas/login (Supabase) · import + validação do plano JSON · Treino (render + execução série a série + timer) · orientação de exercício (instrução/mídia por id) · Dieta (visualização do plano do dia) · Meta + Métricas (peso/medidas + progresso) · offline + sync.

**Fica para v2+:** diário alimentar completo, fotos de progresso, analytics avançado, progressão de carga automática, wearables, geração de plano embutida.

## 8. Métricas de sucesso (norte, não vaidade)
- Import de um plano válido funciona de primeira (taxa de erro de parse ~0 em planos do gerador oficial).
- Usuário consegue concluir um treino registrando séries sem fricção.
- Progresso (peso/medida) visível e sincronizado entre dois aparelhos.

## 9. Perguntas em aberto
- Continuidade entre planos: como casar exercícios do plano novo com histórico do antigo (por `id` estável de exercício?). → detalhar no schema/ADR.
- Mídia de exercício: banco próprio vs. aberto (ex.: free-exercise-db) referenciado por id no plano.
- Onde hospedar o gerador (artifact avulso vs. página no próprio site).
