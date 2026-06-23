# Política de qualidade visual e maturidade de produto

> Obrigatória para toda task/feature com interface. Lida sob demanda (referenciada em `AGENTS.md §16`).
> Adiciona regras; nunca enfraquece outras. Em conflito, vale a regra mais rigorosa.
> Origem: destilada da constituição operacional que já entregou auditoria **PASS** em projeto anterior. Aqui é conceito/processo — nunca copiar telas de referências.

## 1. Princípio
A meta é o mais alto nível de qualidade visual, UX, maturidade de produto, refinamento, consistência, identidade, usabilidade, acessibilidade, credibilidade e acabamento. "Premium" NÃO é excesso visual — é precisão, coerência, identidade, confiança, clareza, boa densidade e atenção a detalhe. A interface deve parecer feita por equipe madura de produto/design/engenharia, nunca por um gerador de templates. Nada está concluído só porque funciona, compila ou parece bonito em uma resolução.

## 2. Aparência proibida vs. exigida
- **Proibido parecer:** protótipo escolar, slides, template genérico, dashboard automático, "cara de IA", conjunto aleatório de cards, landing genérica, demo técnica sem maturidade.
- **Exigido parecer:** real, profissional, confiável, consistente, pronto para uso diário e para produção, adequado ao público (treino/dieta no celular).

## 3. Benchmark ANTES de desenhar (obrigatório)
Antes de direção visual/IA/layout de produto ou feature visual relevante: pesquisar concorrentes diretos/indiretos e líderes do segmento fitness; padrões de UX/UI; onboarding; navegação; densidade; estados; microinterações; erros comuns. Registrar em `docs/ai/` (produtos analisados, padrões, prós/contras, decisões adotadas/rejeitadas, justificativa, adaptação ao contexto). Dribbble/Behance só como referência estética complementar — prioridade é produto real em uso. **A implementação visual não começa antes do benchmark concluído.**

## 4. Referências e identidade
Escolher 3–7 referências de alta qualidade por similaridade de contexto. Extrair princípios, padrões e comportamentos — **nunca copiar**. O resultado final tem identidade própria.

## 5. Direção visual + design system documentado
Definir direção EXPLÍCITA: conceito, personalidade, princípios, tom, densidade, superfícies, ícones, tipografia, cor, movimento, contraste, abordagem mobile/desktop. Manter `docs/DESIGN_SYSTEM.md`: tipografia/escala/pesos, cores e semânticas, superfícies, espaçamento/grid/breakpoints, raios/sombras/elevação, ícones, botões/inputs/selects/checkboxes/radios, cards/listas/tabs/modais/drawers/toasts, navegação, estados, responsividade, acessibilidade, animações. Nenhuma tela inventa padrão fora do sistema sem justificativa.

## 6. Proibições explícitas
Páginas só de cards; cards dentro de cards sem motivo; grid de cards universal; excesso de gradientes/sombras/glass/bordas arredondadas; emoji como ícone principal; cores de destaque demais; widgets só pra preencher; hero genérica; slogans vazios; tipografia gigante; espaço vazio sem intenção; botão colorido pra toda ação; tela sem ação principal; componentes inconsistentes; animações que atrasam; layout de landing dentro de app; conteúdo fictício como real; lorem ipsum; microcopy vaga.

## 7. Hierarquia e densidade
Toda tela: foco principal; ação primária clara; secundárias discretas; destrutivas diferenciadas; agrupamento lógico; alinhamento consistente; ritmo visual; redução de ruído; feedback imediato; contexto de localização. Se tudo chama atenção, nada chama. **fitapp é produto de consumo:** descoberta, fluidez, clareza, orientação, baixa fricção, progressão clara, confiança.

## 8. Estados obrigatórios
Conforme aplicável: loading/skeleton, vazio, erro, sucesso, sem permissão, offline, timeout, dados parciais, ação em andamento/concluída/desabilitada, confirmação e confirmação destrutiva, desfazer, falha de sync, sessão expirada, sem resultados, primeira utilização/onboarding, erros de validação/rede/servidor e "tentar novamente". **Tela sem estados completos é protótipo, não produto.**

## 9. Microcopy
Clara, específica, curta, humana, orientada à ação. Evitar "Clique aqui", "Enviar" sem contexto, "Algo deu errado", placeholders genéricos, jargão. Erros explicam: o que ocorreu, por quê, o que fazer, como tentar de novo, se houve perda de dados.

## 10. Fluxo de feature visual (a 1ª versão nunca é final)
benchmark → direção visual → arquitetura da informação → wireframe → design system → implementação → validação funcional → screenshots → auditoria visual → lista de problemas → refinamento → nova captura → comparação antes/depois → revisão independente → aprovação. Registrar tudo no STATUS/handoff.

## 11. Auditoria e resoluções
Avaliar estrutura, consistência, qualidade, usabilidade, responsividade e acessibilidade. Classificar **PASS | NEEDS REFINEMENT | FAIL**. Testar no mínimo: 375×812, 390×844, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080; além de zoom 125/150%, textos longos, listas vazias/extensas, teclado e navegação sem mouse.

## 12. Gate visual
Nenhuma feature visual conclui com item reprovado. Não aplicável: `N/A — motivo` (nunca omitir).

```yaml
visual_quality_gate:
  market_research: pass
  competitor_analysis: pass
  reference_analysis: pass
  product_direction: pass
  visual_direction: pass
  information_architecture: pass
  design_system_alignment: pass
  hierarchy: pass
  consistency: pass
  density: pass
  responsive: pass
  accessibility: pass
  states_complete: pass
  microcopy: pass
  visual_qa: pass
  polish_pass: pass
  screenshot_review: pass
  before_after_comparison: pass
  product_design_review: pass
  non_generic_appearance: pass
  production_ready: pass
```

## 13. Papel: Product Design Director (revisor visual)
Conduz benchmark, define/critica direção visual, audita screenshots, compara antes/depois, valida o design system e classifica PASS/NEEDS/FAIL. **Quem implementou a UI não pode ser seu único aprovador.** No fluxo Claude+Codex, o revisor visual é o modelo/sessão que não implementou. Existe o agente `product-design-director` disponível para esse papel.

## 14. Checklist de aprovação (responder antes de aprovar)
Parece produto real e pronto pra uso diário? Feito por equipe experiente? Tem identidade própria? Hierarquia e densidade corretas? O usuário sabe onde está e o que pode fazer? Componentes do mesmo sistema? Transmite confiança? Estados completos? Funciona sem depender de animação? Diferencia-se de template? Coerência entre telas? Acabamento de produção? Está no nível ou acima dos líderes do segmento? — Se a interface parece "alguém tentando impressionar com cards, gradientes e sombras", refazer.
