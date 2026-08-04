# Decisão de entrega — Abrir no Activve + PDF do usuário

> Data: 2026-08-04  
> Status: decisão aprovada para o beta fechado  
> Escopo: entrega do plano pelo GPT Activve Health Coach e entrada no app  
> Esta decisão substitui, no fluxo principal, qualquer orientação anterior de baixar e importar JSON manualmente.

---

## 1. Decisão central

O plano terá três representações, cada uma com uma função diferente:

1. **Abrir no Activve** — experiência principal do usuário;
2. **PDF do plano** — cópia humana permanente;
3. **PlanFile/JSON** — contrato técnico invisível entre GPT e app.

O usuário comum não deve conhecer, baixar, localizar, abrir ou importar JSON.

A experiência correta é:

```text
conversa concluída
→ entendimento confirmado
→ plano gerado e validado
→ botão “Abrir no Activve”
→ prévia no app
→ usuário confirma
→ plano fica ativo
→ PDF fica disponível para baixar e guardar
```

---

## 2. Abrir no Activve

Ao concluir o plano, o GPT apresenta como ação principal:

> **Seu plano está pronto.**  
> [ Abrir no Activve ]

Ao tocar:

1. o Activve abre no navegador, PWA ou app disponível;
2. recupera o plano por um token temporário;
3. valida o PlanFile no schema real;
4. mostra uma prévia amigável;
5. o usuário toca em **Adicionar ao Activve**;
6. o plano é salvo localmente;
7. o token é invalidado;
8. o usuário segue para `Meu Plano` ou `Hoje`.

O link não deve expor o conteúdo do plano nem dados pessoais na URL.

---

## 3. PDF obrigatório para o usuário

O GPT deve gerar também um **PDF completo e legível**, mesmo quando o handoff direto funcionar perfeitamente.

O PDF existe para o usuário:

- guardar uma cópia do ciclo;
- consultar fora do app;
- imprimir;
- compartilhar com profissional ou pessoa de confiança;
- acompanhar durante indisponibilidade temporária do app;
- comparar ciclos anteriores;
- manter um registro pessoal independente da plataforma.

O PDF não é um fallback improvisado. É um artefato oficial do Activve.

### 3.1 Estrutura mínima do PDF

1. capa com nome do usuário, nome do ciclo e data;
2. resumo do que foi entendido;
3. objetivo e horizonte do ciclo;
4. prioridades e limitações consideradas;
5. estratégia de treino;
6. treinos completos;
7. exercícios, séries, repetições, descansos e esforço;
8. alternativas e observações de segurança;
9. estratégia alimentar;
10. refeições, porções e substituições;
11. opções econômicas e regionais;
12. preparo e lista de compras, quando aplicável;
13. plano de bem-estar;
14. versão mínima para semanas difíceis;
15. como acompanhar o ciclo;
16. quando revisar;
17. link ou QR Code para abrir o plano no Activve;
18. identificação discreta do plano e da versão, sem payload técnico.

### 3.2 Qualidade mínima

O PDF deve:

- ser confortável de ler no celular;
- ter hierarquia visual clara;
- evitar tabelas largas e esmagadas;
- não conter JSON;
- não conter instruções técnicas;
- refletir exatamente o mesmo plano ativo no app;
- usar linguagem humana e personalizada;
- permitir impressão sem páginas quebradas de forma absurda;
- ter nome de arquivo legível, por exemplo:

```text
Activve_Rui_Ciclo_01_2026-08.pdf
```

---

## 4. Papel do PlanFile/JSON

O JSON continua existindo porque o app precisa de estrutura, IDs, relações e dados validáveis.

Ele serve para:

- transportar treino, alimentação, bem-estar e documento;
- preservar IDs entre ciclos;
- validar referências;
- alimentar o IndexedDB;
- manter continuidade histórica;
- permitir suporte técnico e backup.

Mas ele é **invisível para o usuário**.

Regra:

> O PlanFile é infraestrutura. O PDF é documento. O link é experiência.

---

## 5. Fallbacks

A degradação deve seguir esta ordem:

### Nível 1 — direto

**Abrir no Activve**.

### Nível 2 — outro aparelho

QR Code ou código curto abre o mesmo plano.

### Nível 3 — assistência do beta

O dono ajuda o participante a resgatar o plano sem pedir que ele manipule JSON.

### Nível 4 — PDF

O participante mantém o plano completo e consegue acompanhá-lo fora do app enquanto a falha é corrigida.

### Nível 5 — suporte técnico

Somente o dono ou desenvolvedor acessa o PlanFile para diagnóstico.

Removidos do fluxo do usuário:

- copiar JSON;
- salvar bloco de código;
- localizar arquivo `.json`;
- importar manualmente pelo menu como primeira experiência.

---

## 6. Entrega final do GPT

A resposta final deve ser simples:

> **Seu plano está pronto.**  
> Ele já foi preparado para o Activve e também gerei uma cópia completa em PDF para você guardar.
>
> [ Abrir no Activve ]  
> [ Baixar meu plano em PDF ]

A ação principal é sempre **Abrir no Activve**.

O PDF é sempre disponibilizado como segunda ação.

O GPT não deve exibir o JSON nem oferecer instruções técnicas, salvo em modo de suporte autorizado.

---

## 7. Retorno do app para o coach

O mesmo princípio vale no fim do ciclo.

O app deve oferecer:

- **Revisar meu ciclo** como ação principal;
- um relatório legível em PDF para o usuário guardar e anexar ao GPT;
- um arquivo estruturado interno ou embutido para preservar precisão técnica, sem exigir que o usuário o manipule.

O relatório em PDF deve incluir:

- identificação do ciclo;
- treinos planejados e realizados;
- aderência;
- cargas e progressões;
- esforço;
- exercícios trocados ou evitados;
- notas;
- recuperação;
- peso e medidas quando disponíveis;
- dados ausentes explicitamente indicados;
- resumo visual da evolução;
- principais pontos para revisão.

O usuário deve conseguir guardar tanto o plano inicial quanto o relatório final de cada ciclo.

---

## 8. Critérios de aceite do beta

A entrega está pronta quando:

- o usuário toca em **Abrir no Activve** e chega à prévia;
- não vê JSON em nenhum momento;
- consegue confirmar e ativar o plano;
- recebe o PDF automaticamente;
- o PDF corresponde ao plano do app;
- o PDF abre bem no celular;
- o PDF pode ser salvo e compartilhado;
- o QR Code funciona em outro aparelho;
- falha do handoff não faz o usuário perder o PDF;
- o dono consegue diagnosticar uma falha sem pedir edição técnica ao participante.

---

## 9. Impacto na especificação do GPT

As seções de entrega do arquivo na especificação `GPT_ACTIVVE_HEALTH_COACH_SPEC_2026-08.md` devem ser lidas com esta correção:

- **não** entregar JSON ao usuário como fluxo principal;
- gerar PlanFile internamente;
- enviar o PlanFile pela ponte de handoff;
- apresentar link de abertura;
- gerar PDF obrigatório em paralelo;
- manter JSON apenas para suporte técnico.

Esta decisão é vinculante para o desenho do beta fechado.
