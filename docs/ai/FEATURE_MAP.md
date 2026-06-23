# Activve — Mapa de features (MoSCoW)

> Saída do brainstorm de produto (TASK-001). Vivo: reavaliar a cada fase.
> Decisões-chave (2026-06-22): **v1 é local-first SEM conta** · agenda **flexível** · dieta **ver + marcar refeição**.

## Decisões que moldam a arquitetura (ler antes do ADR)
1. **Local-first sem conta no v1.** App 100% funcional offline, dados em IndexedDB. **Sem Supabase/auth/sync no v1.** Contas + sync entre aparelhos = **Fase 2** (isolada). Consequência: **export/backup do plano e do progresso é MUST no v1** (sem nuvem, o usuário não pode perder dados ao trocar de aparelho/limpar o navegador).
2. **Agenda flexível.** `weekSchedule` é sugestão; o usuário faz qualquer treino em qualquer dia. O conceito de "hoje" não pode quebrar se treinar fora da ordem.
3. **Dieta = ver + marcar refeição feita** (adesão), não diário alimentar.
4. **Continuidade de histórico.** Subir plano novo cria um **período**; nunca apaga logs antigos (casados por `exercise.id`). O modelo local já nasce assim.
5. **Princípio anti-culpa** (restrição de produto). Proíbe: streak punitivo, "você falhou X dias", BMI/% gordura em destaque, anéis de meta a fechar. Progresso é enquadrado de forma positiva; oscilação de peso vira tendência, não vergonha.
6. **Risco técnico aceito:** cronômetro de descanso em PWA com app em background/tela bloqueada é frágil (iOS). Prototipar cedo; plano B = som/notificação/aviso ao reabrir.

## MUST (v1)
- **Fundação local-first:** IndexedDB como fonte de verdade; PWA instalável; offline total.
- **Import do plano:** upload `.json` + colar texto; **validação com erro claro** (campo + motivo); **preview/confirmar** antes de aplicar; rejeição de `schemaVersion` incompatível.
- **Empty states e erros** em toda tela (sem plano, sem treino hoje, falha de import).
- **Treino:** treino de hoje (agenda flexível) · execução **série a série** com steppers (sem teclado) · **timer de descanso** · marcar série/exercício/treino · "como fazer" (instrução/mídia por `mediaId` com fallback) · trocar por variação.
- **Dieta:** refeições do dia + macros/kcal · **marcar refeição feita**.
- **Meta/Corpo:** meta do plano · registrar peso e medidas · progresso visual (tendência).
- **Histórico/continuidade:** sessões e logs persistidos por período; subir plano novo preserva histórico.
- **Export/backup** (JSON) e **import do backup** — substitui a nuvem no v1.
- **Settings:** unidades (kg/cm), tema, gerenciar/limpar dados.
- **Design anti-culpa** aplicado.

## SHOULD (v1 se couber, senão v1.1)
- Referência da **última sessão** por exercício · **sugestão de progressão de carga** (bateu o topo das reps).
- **Lista de compras** e prep (do plano) · troca de refeição.
- **Fotos de progresso** (local; cuidado com tamanho no IndexedDB).
- **Lembretes/notificações** best-effort (treino hoje, pesagem, fim do descanso).
- Aquecimento · notas/flag de dor por exercício · histórico/calendário de sessões · duração estimada da sessão.
- Tema claro/escuro.

## COULD (oportunista)
- Calculadora de anilhas · superséries/circuito · estimativa de 1RM · reordenar/pular exercício com motivo.
- Água · marcos/celebração (anti-culpa) · tendência avançada/platô.
- Tratamento de deload/semana leve marcada no plano.

## WON'T (v1 — fases futuras)
- **Contas + login + sync entre aparelhos (Supabase)** → Fase 2.
- Multiusuário real → Fase 2 (depende de contas).
- Diário alimentar completo (contar tudo) → v2.
- Apple Health / Google Fit / wearables · widget/watch.
- Compartilhar progresso / social.
- % de gordura / BMI em destaque (conflita com anti-culpa).
- Geração de plano embutida no app (continua no gerador externo).
- i18n além de pt-BR (por ora).

## Banco de casos extremos (viram requisitos/validação)
**Import:** inválido / versão incompatível · parcial (treino ok, dieta faltando — definir: aceitar parcial?) · re-subir o mesmo (idempotência) · 0 treinos/refeições · `mediaId` inexistente (fallback) · unidade lb vs kg · macros que não fecham com kcal · arquivo grande (perf) · subir 2º plano (novo período, preserva histórico).
**Treino:** treinou fora do dia agendado · pulou dias (catch-up, sem culpa) · interrompeu no meio (retomar) · casa sem peso (carga opcional) · exercício que não pode fazer (swap/skip com motivo) · timer em background/tela bloqueada · navegador fechou/celular morreu (não perder séries) · academia sem internet (já é offline) · deload.
**Dieta/Corpo:** comeu fora do plano (sem culpa) · meta batida → sugerir novo plano · data da meta passou sem bater (re-planejar) · oscilação de peso (tendência) · fotos (privacidade/tamanho).
**Dados:** limpar dados do navegador (risco de perda → reforça export) · trocar de aparelho (export/import manual no v1) · IndexedDB cheio/cota.

## Próximo
ADR-001 deve registrar: **v1 local-first (IndexedDB, sem Supabase)**, modelo de dados local (planos/períodos/logs/medidas), estratégia de import/validação, export/backup, e o **caminho de evolução para Fase 2 (Supabase/contas/sync)** sem reescrever o v1.
