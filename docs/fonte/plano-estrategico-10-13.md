# 10-13 Plano Estratégico e Arquitetura de Marketplace B2B para Commodities Agroalimentares

> Transcrição fiel do documento-fonte (resumo da reunião de 13/10). Serve de referência única para a webapp, o resumo em PDF e o business plan.

## Painel-resumo (página 1 do original)

Etiquetas: Estratégia & Execução B2B · Agroalimentar · Alinhamento 14h45–16h

**Marketplace B2B de Commodities Agro** — Desintermediação produtiva, captura de margem do embalador e estruturação financeira com liquidação a 18 meses.

### Tese Económica — Captura de Spread
- Eliminação de intermediários tradicionais e margem concentrada.
- **80–90%** — Margem do embalador capturada.
- **10–15%** — Desconto ao cliente vs. mercado.
- Spread operacional retido com hedging.

### Arquitetura de Valor — Pilares do Sistema Operacional (Azeite · Água · Café)
- **Oferta Direta** — Acesso mapeado a produtores com stock e telemetria em tempo real (ex.: Lagar do Val).
- **Ciclo de 18 Meses** — Janelas previsíveis de liquidação com mecanismos de extensão e refunding para choques.
- **Target Investidores** — Ativo palpável e auditável para HNWIs vs. especulação e day trading.
- **Estratégia Go-To-Market** — Fase 1: Marketplace Fechado para controlo rigoroso de KYC/AML e liquidez.

### Diagnóstico Crítico (Prioridade Zero) — Mecanismos de Bloqueio & Regulação
Evitar fricções financeiras fatais e desalinhamentos de tesouraria.
- **Jurisdição & Rails Bancários UE** — Eliminar risco de capital retido; operar apenas com PSPs e E-Money licenciados na UE com segregação de contas.
- **Enquadramento Regulatório (MiFID / AIFMD)** — Blindagem da distribuição a investidores para afastar riscos de venda irregular de instrumentos financeiros.
- **Gestão de Mismatch Agrícola** — Instrumentação de hedges e contrapartes para alinhar volatilidade de colheitas com liquidação a 18 meses.

### Decisão de Produto (Diretriz Aprovada) — Seriedade Financeira vs. Gamificação
Posicionamento institucional sem ruído regulatório.
- **UX Permitida** — Acompanhamento operacional, painéis de colheita, badges de compliance e rastreabilidade de lotes.
- **Proibição Estrita** — Zero ludificação de retornos financeiros ou volatilidade, prevenindo escrutínio de supervisores.
- **Escopo do Piloto Fechado** — Coorte restrita (Azeite + Água), contratos padronizados com cláusulas de força maior, SLA diário de reconciliação e medição de fill rate.

### Plano de Execução — Próximos Passos & Responsáveis (Entregáveis de Ativação do Piloto)
| Responsável | Área | Entregáveis | Foco |
|---|---|---|---|
| Gonçalo Almeida | Jurídico & Compliance | Nota de 2 páginas sobre SPV e restrições de promoção UE; Minutas contratuais (18M, extensão, força maior) | Jurisdição e rails PSP |
| Pedro Marques | Operações & Oferta | Feed de stock e curva de produção anual; SLA de expedição e lotes mínimos | Âncora: Lagar do Val |
| Speaker 1 | Produto & Comercial | Lista de produtores e target 10–15% desc.; Deck de roadshow com disclaimers | Target: Investidores qualificados |
| Speaker 2 | Tecnologia & Sistemas | Auditoria do backoffice e eliminação de riscos; Integração de PSP/KYC e dashboard de risco | Segregação diária de contas |
| Tesouraria | Risco & Coberturas | Definir política de hedge e contrapartes; Playbook de refunding por lote | Owner a designar |

## Sinopse Central

A oportunidade real é construir um marketplace B2B de commodities agroalimentares (azeite, água, café etc.) ancorado no acesso direto a produtores e na captura da margem do embalador (80–90%), apoiado por estrutura jurídica e mecanismos de liquidação em janelas de 18 meses com coberturas de risco; a prova é o acesso já mapeado a produtores (ex.: Lagar do Val/Pedro Marques, stock quase em tempo real), parceiros jurídicos (Gonçalo Almeida) e um desenho preliminar de teses de jurisdição/pagamentos, enquanto o subtexto revela dois vetores: (1) urgência e medo de executar por já existir um backoffice "reverse engineered" e a perceção de que com um modelo mais "plug and play" monetizariam em 12 horas; e (2) intenção de diferenciar-se dos mercados comoditizados/fechados (ex.: combustíveis, travados por middlemen e comissões absurdas) via desintermediação produtiva e estrutura de risco clara para investidores não sofisticados (jogadores, HNWIs), com desconto de 10–15% ao preço de mercado, liquidação previsível e planos de hedge/refunding; o que está em jogo é transformar uma tese com ativos reais e âncoras de oferta numa operação compliant, escalável e defensável, antes que escolhas erradas de jurisdição, pagamentos ou promoção a investidores criem bloqueios bancários, risco regulatório e destruição de confiança; nós somos um negócio de liquidez operacional sobre ativos físicos e, se assumirmos o compromisso, teremos de fechar arquitetura legal/pagamentos, instrumentar risco e lançar um piloto fechado com governança de compliance desde o dia zero.

## Arquitetura do Marketplace e Tese de Valor

- Componentes do sistema
  - **Oferta:** Produtores mapeados (azeite, água, café), com vantagem logística e qualidade (ex.: Lagar do Val) e visibilidade de stock quase em tempo real.
  - **Margem:** Captura da margem do embalador (80–90%) ao conectar produtor→mercado, oferecendo 10–15% de desconto ao cliente final e ainda retendo spread operacional.
  - **Ciclo financeiro:** Janelas de 18 meses com liquidação prevista; possibilidade de "refunding" e extensão se houver choque de preços.
  - **Risco:** Estudo de coberturas (hedge funds/taxas de cobertura) para mitigar volatilidade e choques de procura/oferta.
  - **Legal/Compliance:** Âncora jurídica com advogado (Gonçalo Almeida); decisão crítica de jurisdição e regras de promoção a investidores para evitar bloqueios bancários/regulatórios.
  - **Go-to-Market:** Roadshows a investidores não sofisticados com apelo a ativo palpável, auditável e estável vs. day trading/real estate especulativo.
- Sistema-alvo
  - Marketplace fechado (fase 1) para controlar KYC/AML, qualidade e liquidez; expansão progressiva após prova de risco e tesouraria.

## Diagnóstico de Risco: Jurisdição, Pagamentos e Distribuição

- Mecanismo de bloqueio
  - Jurisdição errada (ex.: crypto-friendly sem ponte bancária segura UE) → "dinheiro preso" e fricção de repatriação.
  - Promoção inadequada de instrumentos de investimento a retalho → risco regulatório (prospecto, MiFID, AIFMD/gestão de fundos).
  - Desalinhamento entre ciclos agrícolas (colheitas voláteis ano a ano) e promessas de liquidez a 18 meses → risco de mismatch e quebra de confiança.
- Raiz política/operacional
  - Subtexto de urgência ("monetizar em 12 horas") vs. realidade de compliance e rails de pagamento; sem disciplina, a operação implode ao primeiro bloqueio bancário.
  - Aprendizado negativo do mercado de combustíveis (múltiplos intermediários, comissões colossais, club fechado) reforça a tese de desintermediação produtiva em agro.

## Proposta de Execução: Piloto Fechado com Hedge e Governança

- Desenho do piloto
  - Coorte limitada de produtores (ex.: azeite + água) e investidor-alvo qualificado, com contratos padronizados, cláusulas de força maior e política de descontos fixos.
  - Liquidação em 18 meses com regras de extensão condicionada; métricas: fill rate, variação de base vs. preço de mercado, SLA de pagamentos a produtor e investidor.
- Infraestrutura crítica
  - **Pagamentos/KYC-AML:** PSPs/E-money licenciados na UE; segregação de fundos, reconciliação diária; proibição de cash-in-transit.
  - **Compliance:** Framework de classificação do produto financeiro (pré-check com advogado), materiais de marketing com disclaimers e distribuição restrita.
  - **Risco:** Parametrização de hedge (gatilhos, contrapartes, limites de custo) e playbook de "refunding".

## Decisão de Produto: Gamificação vs. Seriedade Financeira

- **Tese:** Gamificação só é aceitável como camada de UX para educação/transparência (ex.: painéis de colheita, metas de lote, badges de compliance).
- **Antítese:** "Game" sobre retornos ou risco induz comportamento inadequado e chama supervisão regulatória.
- **Síntese:** UX educativo e de acompanhamento operacional; zero ludificação de performance financeira.

## Agenda e Coordenação

- Janela de discussão operacional já marcada entre as partes (14h45–16h aprox.); foco deve ser validação de trilhos legais/pagamentos e escopo do piloto.

## Próximos Passos (Action Items)

**@Gonçalo Almeida (Jurídico)**
- [ ] Mapear a estrutura jurídica adequada (SPV vs. plataforma de intermediação) e restrições de promoção a investidores (UE) com nota de 2 páginas — [TBD]
- [ ] Propor jurisdição primária e rails de pagamento compatíveis (PSP/E-money UE), incluindo risco de repatriação — [TBD]
- [ ] Rascunhar contratos padrão Produtor↔Plataforma e Plataforma↔Investidor com cláusulas de 18 meses, extensão e força maior — [TBD]

**@Pedro Marques (Lagar do Val/Operações)**
- [ ] Fornecer feed de stock (formato e frequência), curva de produção anual e SLA de expedição para o piloto — [TBD]
- [ ] Validar capacidade mínima/máxima de lote e requisitos de qualidade/auditoria — [TBD]

**@Speaker 1 (Produto/Comercial)**
- [ ] Consolidar lista de produtores iniciais (azeite, água, café) com volumes, preços e descontos-alvo (10–15%) — [TBD]
- [ ] Definir coorte piloto de investidores (qualificados), com critérios de elegibilidade e processo KYC — [TBD]
- [ ] Preparar deck de roadshow com métricas operacionais, estrutura de risco e disclaimers jurídicos aprovados — [TBD]

**@Speaker 2 (Tecnologia/Operações)**
- [ ] Auditar o backoffice atual (segurança, conformidade, logs) e remover dependências de "reverse engineering" sensíveis — [TBD]
- [ ] Integrar PSP/KYC-AML (UE) e configurar segregação de contas + reconciliação diária — [TBD]
- [ ] Implementar dashboard de risco (preço de mercado vs. contrato, gatilhos de hedge, PnL do lote) — [TBD]

**@Risco/Tesouraria (Owner a designar)**
- [ ] Definir política de hedge (instrumentos permitidos, limites de custo, contrapartes, gatilhos) e playbook de "refunding" — [TBD]
