# 30 — Pagamentos, KYC/AML e infraestrutura técnica (marketplace B2B fechado, fundos segregados, reconciliação diária)

> Projeto Sprout (nome de trabalho) · Data de referência: **13-10-2026** · Fonte de partida: `docs/fonte/plano-estrategico-10-13.md`
> Documentos irmãos: `10-mercado.md` (mercado e preços) e `20-regulatorio.md` (enquadramento jurídico). Este documento não repete o regulatório: remete para ele quando a questão é jurídica (licenças, DSP2, AML, faturação/IVA).
> Âmbito: (1) prestadores de pagamento UE e PT; (2) KYC/KYB/AML; (3) *ledger* e reconciliação; (4) faturação portuguesa; (5) telemetria de stock; (6) segurança, conformidade e auditoria do *backoffice*; (7) arquitetura de referência e custos do piloto.
> **Não é parecer jurídico nem proposta comercial.** Os preços públicos são "a partir de" e negoceiam-se.

---

## 0. Nota metodológica e legenda

- **Limitações de acesso nesta sessão.**
  - O *proxy* bloqueou a leitura direta (HTTP 403) dos sítios dos prestadores (Stripe, Mangopay, Lemonway, Adyen, Swan, Sumsub, easypay, ifthenpay), do Banco de Portugal, do EPC, do BCE, do Portal das Finanças e do EUR-Lex. Os factos sobre esses sítios vêm de **extratos de motor de pesquisa das próprias páginas**. Ficam marcados [F] e com confiança **média**.
  - O GitHub (ficheiros *raw*) estava acessível. As licenças de *software* livre citadas foram **lidas diretamente** nos repositórios (confiança alta).
  - **O orçamento de pesquisa web esgotou-se a meio da investigação.** O limite é partilhado entre os agentes desta execução. Os temas KYC (preços por fornecedor), NIS2/DORA, faturação B2G, sensores e ERP **não puderam ser pesquisados**. Estão escritos com base em conhecimento técnico, marcados **[L]**, e listados na secção 12 para confirmar.
- **Legenda** (a mesma de `20-regulatorio.md`):
  - **[F]** facto com fonte consultada nesta sessão (primária ou secundária fiável);
  - **[L]** conhecimento técnico/legal não relido online nesta sessão (confiança média-alta; confirmar);
  - **[E]** estimativa nossa (custos, prazos);
  - **[I]** inferência ou opinião nossa;
  - **[NV]** não verificado (pode estar errado).
- As fontes estão numeradas **[Px]**. A lista completa está no fim, todas com acesso a 13-10-2026. **[Sx]** remete para as fontes de `20-regulatorio.md`.

---

## 1. Síntese executiva

1. **Há três fluxos de dinheiro, e só um deles é o problema.** Os três são: (a) **compra de mercadoria a produtores**; (b) **venda a compradores B2B** (HoReCa, distribuidores); (c) **dinheiro de investidores** para financiar lotes (via SPV, segundo `20-regulatorio.md` §11). O fluxo (c) **não deve passar por carteiras de marketplace**. Os PSP que pesquisámos excluem ou restringem "investimento" e *crowdfunding* nas suas políticas de uso aceitável (AUP) [F] [P4, P3]. O fluxo (c) vai para **contas bancárias próprias da SPV, segregadas por série** [I].
2. **Se o Sprout comprar e revender (modelo "principal"), o dinheiro do comprador é receita própria.** Nesse caso não há fundos de terceiros nem licença DSP2 nos fluxos (a) e (b) [I, confirmar com o Jurídico]. O produto *marketplace* de um PSP (carteiras segregadas, *escrow*) só é obrigatório no **modelo "agente"**: o produtor vende diretamente ao comprador e o Sprout cobra comissão. É isso que diz `20-regulatorio.md` §4.2. A tese da "captura da margem do embalador" implica, na prática, o modelo principal [I].
3. **Comparação dos prestadores UE com produto marketplace:**
   - **Lemonway** é o único com **preçário público completo**: *setup* de €5.490, suporte de €840/mês, transferência ou débito direto a 0,30% + €0,40, *payout* SEPA a €0,50, KYC de €0,40/mês por pessoa e KYB de €0,80/mês por empresa [F] [P1]. É IP autorizada pela ACPR desde 2012 e tem como segmento central as plataformas de *crowdfunding* e investimento [F] [P2].
   - **Mangopay** é IME luxemburguesa (CSSF) [F] [P3] e não publica preçário [F] [P3].
   - **Stripe Connect** é a integração mais rápida. Mas **não suporta "investment and credit services" nem *crowdfunding*** sem aprovação [F] [P4], e limita o débito direto SEPA a **€10.000 por transação** [F] [P4].
   - **Adyen** e **Swan** são infraestrutura de escala, sem preço público ou com mínimos altos (Swan "a partir de €2.990/mês", segundo terceiros [F, fonte secundária] [P6]).
   - **Treezor acabou de mudar de dono.** A Shares concluiu a compra à Société Générale a 6–7-10-2026 [F] [P7]. A ACPR sancionou a Treezor em 2024 por falhas AML (repreensão e coima de €1M) [F] [P7]. Não é para o piloto.
4. **Os PSP portugueses (easypay, ifthenpay, Eupago) não servem para valores B2B elevados.** Cobram uma percentagem sobre o valor:
   - easypay: 1,5% + €0,25, segundo a página da BBVA [F] [P8];
   - ifthenpay: Multibanco a 1,7% + €0,22 e MB WAY a 0,7% + €0,07 [F] [P9];
   - Eupago: 1,80% no preçário publicado pelo BdP em 01-2026 [F] [P10].

   Num lote de €50.000, isto custa **€750–900**, contra **€0–2** de uma transferência SEPA [E]. Use-os só para encomendas pequenas e pontuais.
5. **Rails recomendados (todos SEPA):**
   - **SCT Inst** para pagar a produtores. Desde 9-10-2025, os PSP da zona euro têm de enviar transferências imediatas e oferecer **Verificação do Beneficiário (VoP)**, e desde 9-01-2025 não podem cobrar mais por elas do que por uma SCT normal [F] [P13].
   - **SDD B2B** para cobrar à HoReCa recorrente: não há direito a reembolso de cobranças autorizadas e o banco do devedor verifica o mandato [F] [P12].
   - **SCT com referência estruturada** (RF, ISO 11649) para os restantes casos [L].
6. **O KYC/KYB português faz-se com fontes oficiais baratas, mais um fornecedor de verificação:**
   - certidão permanente do registo comercial (código de acesso);
   - RCBE;
   - Cartão de Cidadão ou Chave Móvel Digital;
   - VoP/IBAN.

   Os fornecedores internacionais (Sumsub, Veriff, Onfido/Entrust, IDnow, ComplyAdvantage) custam da ordem de **€1–2,5 por verificação de identidade**, com mínimos mensais [L/NV]. Mas o próprio PSP pode fazer KYC: na Lemonway, €0,40–0,80/mês por titular [F] [P1].
7. **A reconciliação diária é um problema de *ledger*, não de folha de cálculo.**
   - Use um *ledger* de dupla entrada imutável, com unidades duplas (€ e kg/L), e ingestão de **camt.053** (extrato de fim de dia), camt.054 e dos relatórios do PSP [L].
   - Há *ledgers open source* com licenças permissivas, verificadas no repositório:
     - **TigerBeetle**: Apache-2.0 [F] [P14];
     - **Formance Ledger**: MIT, mas o módulo de reconciliação da Formance é *Enterprise Edition* proprietária [F] [P14];
     - **Blnk**: Apache-2.0, com reconciliação incluída [F] [P14].
8. **A faturação tem de sair de *software* certificado pela AT, com ATCUD, QR e SAF-T.** A partir de **1-01-2027**, as faturas eletrónicas em PDF precisam de **assinatura ou selo eletrónico qualificado** [F] [S76].
   - **Não construa um motor de faturação próprio.** Integre por API um programa certificado (ex.: Moloni, InvoiceXpress, TOConline, PHC, Primavera) [I].
9. **Telemetria:**
   - **Fase 0:** CSV diário por SFTP ou API a partir do ERP do lagar.
   - **Fase 1:** sensores **radar sem contacto** nos depósitos de inox, com leitura a cada 15 min e agregação horária [L/E].
   - **Fase 2:** reconciliação semanal sensor vs. ERP vs. *ledger*, e auditoria física por terceiro em cada lote financiado [I].
   - O stock que garante investidores deve ficar em **armazém geral com conhecimento de depósito/*warrant*** (Código Comercial, arts. 408.º ss.) ou com penhor registado [L, confirmar com o Jurídico].
10. **Conformidade:**
    - **RGPD** aplica-se já (com AIPD, porque há biometria no KYC) [L].
    - **DORA não se aplica** a um marketplace não licenciado. Passa a aplicar-se se o Sprout se tornar IP/IME/ECSP/gestora [L].
    - **NIS2** só se aplica acima de 50 trabalhadores ou €10M de volume de negócios (setores "alimentar – distribuição por grosso" e "mercados em linha") [L].
    - **ISO 27001:2022** é uma meta para a fase 2, não uma condição do piloto [I].
    - **O *backoffice* "reverse engineered" é o maior risco técnico-jurídico imediato.** Precisa de auditoria de proveniência (direitos de autor, segredos comerciais, termos de uso, Lei do Cibercrime), SBOM e *pentest* **antes** de tocar em dinheiro real [I].

---

## 2. Os fluxos de dinheiro do Sprout e o que decide o *rail*

### 2.1 Três fluxos, três tratamentos

| Fluxo | Quem paga → quem recebe | Natureza | *Rail* recomendado [I] | Licença necessária? |
|---|---|---|---|---|
| **(a) Compra de lote** | Sprout/SPV → produtor (ex.: Lagar do Val) | Pagamento de fornecedor, a 30/60 dias (UTP, ver `10-mercado.md` §6) | SCT ou **SCT Inst** a partir de conta bancária própria, com VoP | Não (fundos próprios) [I] |
| **(b) Venda B2B** | Comprador (HoReCa/distribuidor) → Sprout (principal) **ou** → produtor (agente) | Principal: receita própria. Agente: fundos de terceiros | Principal: **SDD B2B** + SCT para IBAN virtual/referência RF. Agente: **PSP marketplace** com carteiras e *escrow* | Principal: não [I]. Agente: sim, a do PSP; o Sprout atua como prestador técnico ou agente da IP (`20-regulatorio.md` §4.1–4.2) |
| **(c) Investidores** | Investidor qualificado → SPV (obrigações), SPV → investidor (juro e reembolso) | Financiamento: regime de valores mobiliários, não de pagamentos (`20-regulatorio.md` §2) | **Conta bancária da SPV, uma por série**. Subscrição só por transferência a partir de conta em nome do investidor | Depende da qualificação jurídica. **Nunca em carteiras de marketplace** [I] |

### 2.2 Principal vs. agente: consequências técnicas

| Dimensão | Principal (compra e revende) | Agente (intermedeia, cobra comissão) |
|---|---|---|
| Dinheiro do comprador | Receita do Sprout | Fundos do produtor, com salvaguarda obrigatória (DSP2, art. 10.º) [S32] |
| Infraestrutura mínima | Banco + *ledger* + faturação certificada | PSP marketplace (carteira por utilizador, KYC pelo PSP, *split*) + *ledger* espelho |
| Faturação | O Sprout fatura ao comprador e recebe fatura do produtor | O produtor fatura ao comprador (diretamente ou por autofaturação/terceiro) e o Sprout fatura a comissão (IVA a 23%) [L] |
| Risco | Inventário, preço e crédito do comprador | Operacional e reputacional; risco de crédito mitigado por pré-pagamento ou *escrow* |
| Custo de pagamentos | Baixo (bancário) | 0,3–1,1% do GMV com preçário de lista (§10) [E] |
| Coerência com a tese "margem do embalador" | **Alta** | Baixa: a comissão não captura o diferencial granel→prateleira (`10-mercado.md`) |

**Leitura [I]:** para o piloto (azeite + água), o modelo principal é mais simples em pagamentos e mais coerente com a tese. O PSP marketplace passa a ser útil quando o Sprout abrir a produtores terceiros que vendam em nome próprio (fase 2), ou se o Jurídico concluir que o modelo é de agente.

### 2.3 Diagrama de fluxos (piloto recomendado)

```
          INVESTIDORES QUALIFICADOS (≥ €100k; KYC + origem de fundos)
                     │ SCT (conta em nome próprio)
                     ▼
       ┌──────────────────────────────┐        juro/reembolso (SCT)
       │ SPV — conta bancária Série 1 │ ─────────────────────────────▶ investidores
       │ (segregada; 1 conta/série)   │
       └──────────────┬───────────────┘
                      │ financia a compra do lote (contrato SPV↔OpCo: venda / mandato / penhor)
                      ▼
  PRODUTOR ◀── SCT Inst + VoP (30/60 d) ── ┌──────────────────────────────┐
  (Lagar do Val)                            │ OpCo Sprout — conta operação │ ◀── SDD B2B / SCT c/ ref. RF ── COMPRADORES B2B
                                            │ + conta reserva IVA/impostos  │                                 (HoReCa, distribuidores)
                                            └──────────────┬───────────────┘
                                                           │ camt.053 diário (todas as contas) + relatórios PSP
                                                           ▼
                                            LEDGER DUPLA ENTRADA ──▶ RECONCILIAÇÃO D+1 ──▶ DASHBOARD DE RISCO
```

---

## 3. Prestadores de pagamento licenciados na UE

### 3.1 Tabela comparativa

| Prestador | Licença e regulador | Modelo marketplace | Salvaguarda/segregação | B2B de valor elevado | Fluxos relevantes | *Onboarding* da plataforma [E] | Preço indicativo | Restrição a "investimento" |
|---|---|---|---|---|---|---|---|---|
| **Mangopay** | IME autorizada pela **CSSF** (Luxemburgo) [F] [P3]; IME no Reino Unido pela FCA desde 11-2023 [F] [P3] | Carteiras de moeda eletrónica por utilizador (comprador, vendedor, comissões); *escrow* até à entrega [F] [P3] | Fundos em conta salvaguardada, com moeda eletrónica equivalente creditada na carteira. "Não é banco"; sem garantia de depósitos [F] [P3] | Sim, por transferência. Contas virtuais/IBAN virtual em várias moedas [F, secundária] [P3] | Cartões, transferência, SDD; *payouts* SEPA | 4–10 semanas (revisão do caso de uso + contrato) | **Sem preçário público** [F] [P3]. Deck antigo, sem data: cartão a 1,8% + €0,18; SDD a €0,60 (<€10k) [F, desatualizado?] [P3] | Lista de proibidos "não exaustiva", com levantamento **caso a caso** [F] [P3]. Esquema Amex proíbe investimento, futuros, *commodities* e *equity crowdfunding* [F] [P3] |
| **Lemonway** | **IP autorizada pela ACPR** (França) desde 2012, com passaporte UE [F] [P2] | Contas de pagamento (*e-wallets*) por utilizador. Mais de 170 plataformas registadas como **agentes** na ACPR [F] [P2] | Fundos segregados (regime de IP) [L] | Sim. Opção de *payout* no próprio dia [F] [P1] | Cartão, transferência, débito direto, *payouts* SEPA/não-SEPA | 4–8 semanas | *Setup* **€5.490**; suporte **€840/mês**; cartão 1,10% + €0,25; transferência/débito 0,30% + €0,40; *payout* SEPA €0,50 (fora SEPA €9); KYC €0,40/mês; KYB €0,80/mês; acima de €7M/ano, cotação própria [F] [P1] | É o **segmento central**: ~200 plataformas de *crowdfunding* (dados de 2018–2019) [F] [P2]. Exige que a plataforma esteja ela própria enquadrada (ECSP/agente) [I] |
| **Stripe Connect** | IME irlandesa (Stripe Payments Europe, Banco Central da Irlanda) [L] | Contas conectadas (Standard/Express/Custom); *split* e *payouts* | Regime de IME [L] | Limitado: **SDD até €10.000 por transação** [F] [P4] | Cartões, SDD, transferências (saldo de cliente) [L]; *payouts*; *instant payouts* a 1% [F] [P4] | Dias a 2 semanas | €2 por conta ativa/mês + 0,25% + €0,10 por *payout* (valores EUR de 01-2024, fonte secundária) [F] [P4]; EUA: US$2 + 0,25% + US$0,25 [F] [P4] | "Not able to support... investment and credit services... crowdfunding" sem aprovação [F] [P4]. *Equity crowdfunding* só em AU, DE, FR, SG, UK e US, segundo terceiro (05-2026) [F, secundária] [P4] |
| **Adyen for Platforms** | Banco (Adyen N.V., licença bancária DNB) [L] | *Balance platform*: contas de saldo por titular | Fundos em banco [L] | Sim (escala *enterprise*) | Todos os métodos; *payouts*; transferências | 2–4 meses; orientado a grandes volumes [E] | Taxas por pagamento + serviços de plataforma (*payouts*, KYC) faturados mensalmente. **Sem preçário público** [F] [P5] | Não verificado [NV] |
| **Swan** | **IME autorizada pela ACPR**, REGAFI 86245, passaporte EEE [F] [P6] | BaaS: contas com IBAN, cartões, SEPA/SEPA Inst. *Escrow* tem de ser construído pela plataforma [I] | Regime de IME | Sim (contas e IBAN locais FR/DE/ES/NL/IT, segundo terceiro; **sem IBAN PT listado**) [F, secundária] [P6] | SCT, SCT Inst, SDD [F, secundária] [P6] | 4–8 semanas | "A partir de **€2.990/mês**" (agregadores, 2023–2025) vs. €900/mês (2020) [F, secundária] [P6] | Não verificado [NV] |
| **Treezor** | IME autorizada pela ACPR, com "todos os serviços de pagamento" [F] [P7] | BaaS (contas, cartões, transferências) | Regime de IME | Sim | SCT, SCT Inst, SDD [L] | n.d. | Sem preçário público [F] [P7] | Não verificado. **Risco de contraparte:** sanção AML da ACPR em 04-2024 (repreensão e €1M); venda à Shares anunciada a 29-01-2026, recapitalização de €8M a 17-03-2026, fecho a 6/7-10-2026 [F] [P7] |

### 3.2 Notas por prestador

- **Mangopay [F] [P3]:**
  - Advent International é acionista maioritária desde 04-2022, com injeção de €75M; o Crédit Mutuel Arkéa ficou como minoritário.
  - O modelo de carteiras serve marketplaces de bens (o caso Vinted é citado).
  - Fatura a plataforma no início de cada mês. Cobra automaticamente a partir das comissões acumuladas na carteira de *fees* ou, se não chegarem, por débito direto.
  - **Implicação [I]:** é boa para *escrow* comprador→produtor no modelo agente. O preço é opaco e há revisão caso a caso de qualquer componente "investimento".
- **Lemonway [F] [P1, P2]:**
  - Volume declarado: **€10,5 mil M** de fluxos em 2024 e ~1.200 plataformas.
  - Preçário transparente. Para o B2B de valor elevado, **a parte percentual de 0,30% nos *pay-ins* por transferência é o custo dominante**: €150 num lote de €50.000. Negociar um **teto por transação** é obrigatório [I].
  - A experiência com plataformas de investimento torna-a a escolha natural se, na fase 2, o fluxo de investidores passar por uma plataforma ECSP parceira [I].
- **Stripe Connect [F] [P4]:**
  - A *taxa de conta ativa* só é cobrada nos meses em que a conta recebe um *payout* (segundo a Sharetribe, 01-2024).
  - Desde 1-06-2024, o SDD tem taxas separadas para disputas e falhas [F] [P4].
  - **Implicação [I]:** é o caminho "plug and play" que o documento-fonte procura, **apenas para o fluxo (b)** com encomendas abaixo de €10k. Usar a Stripe para dinheiro de investidores viola a AUP e arrisca o congelamento de fundos, precisamente o "dinheiro preso" que o documento-fonte quer evitar.
- **Adyen [F] [P5]:**
  - As taxas por transação são deduzidas na captura. Os *payouts*, transferências e verificações KYC aparecem na **fatura mensal**.
  - **Implicação [I]:** é excessiva para o piloto. Faz sentido quando houver cartões em volume.
- **Swan [F] [P6]:**
  - É forte em IBAN dedicados e SEPA Instant. É uma conta (BaaS), não um *escrow* de marketplace.
  - O preço mínimo publicado por terceiros (~€3k/mês) não se justifica no piloto [I].
- **Treezor [F] [P7]:** acabou de mudar de controlo acionista e tem historial sancionatório AML recente. **Excluir do piloto** [I].

### 3.3 Opções portuguesas (Multibanco, MB WAY, SIBS)

| Prestador | Estatuto | Preço publicado | Fonte e data | Adequação [I] |
|---|---|---|---|---|
| **easypay** | Instituição de pagamento portuguesa [L]. Registo no BdP **não confirmado nesta sessão** [NV] | **€0,25 + 1,5%**, igual para Visa, Mastercard, MB WAY, Multibanco e débito direto. Sem mensalidade. +2% para cartões fora do SEPA e +1% para cartões empresariais | Página BBVA/easypay (pode ser condição BBVA) [F] [P8] | Encomendas pequenas e clientes ocasionais |
| **ifthenpay** | Diz-se "instituição de pagamento autorizada e supervisionada pelo BdP" [F] [P9] | **Multibanco €0,22 + 1,7%**; **MB WAY €0,07 + 0,7%**. Sem mensalidade nem fidelização. Transfere diariamente o valor líquido | ifthenpay.com (a página refere previsões para 2024; o preço pode estar desatualizado) [F] [P9] | Igual |
| **Eupago** | Preçário publicado no Portal do Cliente Bancário do BdP (código 8709) [F] [P10] | Multibanco **1,80%** e MB WAY **1,80%**, mais componente fixa (no texto extraído: €0,35 e €0,10, legibilidade baixa) | BdP, preçário de 28-01-2026 [F] [P10] | Igual |
| **SIBS (MB WAY / referências)** | Rede e esquema nacional [L] | Via *gateways*/adquirentes | — | — |

- **Limites:** as operações em caixas Multibanco têm de ser **inferiores a €100.000 por operação** [F, secundária] [P11]. O MB WAY de particulares tem limites de transferência baixos: €2.000 por transferência e receção de €5.000/mês, segundo a imprensa, para particulares [F, secundária] [P11]. Os limites para comerciantes não foram verificados [NV].
- **Custo comparado** (valor por operação, preço de lista) [E, cálculo a partir de P1, P4, P8–P10]:

| Prestador / *rail* | Encomenda HoReCa de €800 | Lote de €50.000 |
|---|---|---|
| Transferência SEPA (SCT/SCT Inst) ou SDD B2B em banco PT | €0–0,60 [E] | €0–2 [E] |
| Lemonway (transferência/débito, *pay-in*) | €2,80 | €150,40 |
| Stripe Connect (*payout* ao vendedor; sem o custo do *pay-in*) | €2,10 | €125,10 (o SDD não é possível acima de €10k) |
| ifthenpay MB WAY | €5,67 | n.a. (limites) |
| easypay (qualquer método) | €12,25 | €750,25 |
| ifthenpay Multibanco | €13,82 | €850,22 |
| Eupago Multibanco (1,80% + ~€0,35) | ~€14,75 | ~€900 |

**Conclusão [I]:** referências Multibanco e MB WAY servem como **conveniência** em encomendas pequenas. Para lotes, o *rail* é SEPA.

### 3.4 *Rails* SEPA: o que muda em 2025–2027

- **SCT Inst (Reg. (UE) 2024/886, IPR):**
  - igualdade de preço face à SCT na zona euro desde **9-01-2025**;
  - envio e **VoP** obrigatórios para PSP da zona euro desde **9-10-2025**;
  - nos Estados-Membros fora do euro, a VoP chega a 9-07-2027 [F] [P13].
  - **IP e IME da zona euro** têm prazos próprios: receber a partir de **9-01-2027** e enviar a partir de **9-04-2027** [L, confirmar]. Até lá, um PSP marketplace pode ainda não oferecer *payouts* instantâneos. Pergunte na RFP [I].
- **Teto do SCT Inst:** o teto histórico do esquema EPC era €100.000. A sua eliminação no *rulebook* de 2025 **não foi confirmada** nesta sessão [NV]. Na prática, o limite é o que cada banco define [L].
- **SDD Core vs. SDD B2B:**
  - no **B2B**, o devedor **não tem direito a reembolso** de cobranças autorizadas;
  - o banco do devedor tem de **verificar o mandato** antes do primeiro débito;
  - só pode usá-lo um "não consumidor";
  - os prazos de apresentação e devolução são mais curtos.
  - O *rulebook* SDD B2B de 2025 (v1.0) está em vigor desde **5-10-2025** [F] [P12].
  - O prazo de devolução de 2 dias úteis é o valor de referência conhecido, mas **não foi confirmado** [NV].
  - **Implicação [I]:** o SDD B2B é o melhor instrumento para a HoReCa recorrente (risco de reversão quase nulo). Exige que o banco do cliente confirme o mandato, o que gera fricção no primeiro débito.
- **Proibição de discriminação de IBAN (Reg. 260/2012, art. 9.º) [L]:** um IBAN FR, como os da Swan ou da Lemonway, é legalmente aceitável para pagadores portugueses. Mas pode causar desconfiança comercial. Prefira IBAN PT ou explique-o na fatura [I].
- **Numerário:** zero. Em Portugal há limite de €3.000 (LGT, art. 63.º-E) [S42]. Isto cumpre a "proibição de *cash-in-transit*" do documento-fonte.

### 3.5 Políticas de uso aceitável (AUP) e o produto de investimento

| Prestador | O que diz | Consequência para o fluxo (c) [I] |
|---|---|---|
| Stripe | Não suporta investimento, crédito ou *crowdfunding* sem aprovação. Contas podem ser restringidas por "crowdfunding without approval" [F] [P4] | **Proibido** usar Connect para subscrições de investidores |
| Mangopay | Lista de proibições não exaustiva, alterável, com levantamento caso a caso pela gestão. Regras dos esquemas de cartões (ex.: Amex) somam-se [F] [P3] | Só com aprovação escrita prévia e enquadramento jurídico fechado |
| Lemonway | Serve plataformas de *crowdfunding* (dívida e capital) e regista plataformas como agentes [F] [P2] | Viável **se** o Sprout (ou parceiro) for ECSP ou se o desenho for aprovado pela Lemonway. Não é atalho regulatório |
| Adyen, Swan, Treezor | Não verificado [NV] | Perguntar por escrito na RFP |

**Regra prática [I]:** descreva o caso de uso ao PSP **por escrito e com o *term sheet* real**. Um PSP que descubra *a posteriori* um fluxo de investimento congela a conta. É o "dinheiro preso" do diagnóstico do documento-fonte.

### 3.6 Bancos portugueses como *rail* principal do piloto

- **Para a SPV:** conta(s) bancária(s) **dedicadas por série**, a receber apenas de contas em nome do investidor. Mandato de pagamento claro e, se houver obrigações, eventual **representante comum dos obrigacionistas** (CSC, art. 357.º ss.) [L, confirmar com o Jurídico].
- **Para a OpCo:** conta de operação + conta de reserva fiscal (IVA). Pedir ao banco:
  - (i) **ID de credor SEPA** para SDD B2B;
  - (ii) **extratos camt.053** por *host-to-host*/SFTP/API ou exportação diária;
  - (iii) SCT Inst com VoP.

  A disponibilidade de camt.053 nos bancos portugueses **não foi verificada** [NV].
- **Risco [I]:** a abertura de conta para uma SPV que capta investidores pode demorar ou ser recusada (*de-risking*). Leve ao banco o parecer jurídico e o fluxograma AML desde o primeiro contacto.

---

## 4. KYC, KYB e AML

### 4.1 O que é preciso, mesmo sem ser entidade obrigada

O enquadramento está em `20-regulatorio.md` §5. Em resumo:
- o marketplace sem fundos de terceiros não é, em regra, entidade obrigada da Lei 83/2017;
- mas os bancos, os PSP e os investidores vão exigir KYC/KYB ao nível da lei;
- e o *screening* de sanções UE/ONU (Lei 97/2017) é uma boa prática obrigatória de facto [S43–S46].

| Contraparte | Verificações mínimas [I] | Frequência |
|---|---|---|
| **Produtor (empresa)** | NIPC; certidão permanente (gerência e forma de obrigar); RCBE; identidade dos gerentes (CC/CMD ou documento + *liveness*); IBAN em nome da empresa (VoP/declaração bancária); *screening* (sanções, PEP, *adverse media*); licenças setoriais (ex.: registo do lagar/engarrafador) | No *onboarding*; *screening* diário; certidão e RCBE revistos anualmente ou a cada alteração |
| **Comprador B2B** | NIF/NIPC; certidão permanente; RCBE; IBAN; *screening*; limite de crédito (se houver SDD ou prazo) | Igual |
| **Investidor (pessoa)** | Identidade (CC/CMD ou documento + *liveness*), morada, NIF, **origem de fundos e de património**, qualificação MiFID Anexo II ou ticket ≥€100k (`20-regulatorio.md` §11), PEP e sanções | No *onboarding*; *screening* diário; revisão anual |
| **Investidor (sociedade/veículo)** | Igual ao produtor + beneficiários efetivos + estrutura de controlo | Igual |

### 4.2 Fornecedores KYC/KYB/AML

**Atenção:** o orçamento de pesquisa web esgotou-se antes desta secção. Os preços e factos abaixo são [L] ou [NV], salvo indicação em contrário. Confirme na RFP.

| Fornecedor | Origem | Cobertura principal | Integração | Preço indicativo | Notas |
|---|---|---|---|---|---|
| **Sumsub** | Reino Unido/Chipre [L] | KYC (documento + *liveness*), KYB, AML *screening*, monitorização de transações | API/SDK, *no-code flows* | Planos públicos de ~US$1,35–1,85 por verificação, com mínimo mensal [L/NV] | Forte em KYB automatizado em muitos registos; confirmar a cobertura do registo comercial PT |
| **Onfido (Entrust)** | Reino Unido; adquirida pela Entrust em 2024 [L] | KYC documental + biometria | API/SDK | Por cotação [L] | Mudança de dono recente: verificar o *roadmap* |
| **Veriff** | Estónia [L] | KYC documental + biometria; vídeo | API/SDK | Planos *self-serve* de ~US$0,80–1,89 por verificação, com mínimos [L/NV] | Bom custo para volumes baixos |
| **IDnow** | Alemanha [L] | AutoIdent, VideoIdent, assinatura qualificada (QES) | API | Por cotação [L] | Útil se o contrato com o investidor exigir QES |
| **ComplyAdvantage** | Reino Unido [L] | *Screening* (sanções, PEP, *adverse media*), monitorização de transações | API | Por cotação; planos de entrada para PME [L/NV] | Complementa KYC documental |
| **KYC do próprio PSP** (Lemonway) | — | KYC/KYB integrado na carteira | API do PSP | **€0,40/mês por pessoa; €0,80/mês por empresa** [F] [P1] | Só cobre os titulares de carteiras do PSP, não os investidores da SPV |

### 4.3 Especificidades portuguesas

- **Chave Móvel Digital (CMD) e Cartão de Cidadão (CC) [L]:**
  - autenticação via Autenticação.gov (AMA) com atributos certificados (nome, NIC, NIF, data de nascimento);
  - assinatura qualificada com CMD ou CC;
  - **SCAP** para atributos profissionais.
  - Uma entidade privada pode integrar-se como fornecedor de serviço mediante adesão junto da AMA. As condições e o custo **não foram verificados** [NV].
  - **Implicação [I]:** para investidores e gerentes portugueses, autenticar com CMD e assinar os contratos com CMD/CC (assinatura qualificada) é mais forte e mais barato do que vídeo-KYC.
- **eIDAS 2 / Carteira Europeia de Identidade Digital (EUDI Wallet), Reg. (UE) 2024/1183 [L]:**
  - os Estados-Membros devem disponibilizar carteiras até ao fim de 2026;
  - as entidades reguladas que exigem autenticação forte terão de as aceitar mais tarde.
  - **Implicação [I]:** desenhe o módulo KYC para aceitar "atributos verificados", não só documentos.
- **Certidão permanente do registo comercial [L]:**
  - acesso online com código, durante a validade da subscrição;
  - mostra matrícula, capital, órgãos sociais, forma de obrigar e inscrições (ex.: penhores, insolvência);
  - o preço (historicamente €25 por ano) **não foi verificado** [NV].
  - **Implicação [I]:** peça o código a cada contraparte. O sistema guarda-o e consulta-o de forma automática e periódica. O *parsing* do HTML/PDF é frágil; preveja revisão manual.
- **RCBE (Lei 89/2017):**
  - o acesso público geral foi restringido depois do acórdão do TJUE de 22-11-2022 (`20-regulatorio.md` §5) [S46];
  - as entidades obrigadas têm acesso integral [L].
  - **Implicação [I]:** peça às contrapartes o comprovativo RCBE com código de acesso e confirme os beneficiários efetivos por declaração assinada.
- **VoP e IBAN:** desde 9-10-2025, os PSP da zona euro fazem verificação nome↔IBAN em todas as transferências [F] [P13]. Guarde o resultado da VoP como evidência de titularidade.
- **IVA intracomunitário:** valide o NIF de compradores espanhóis ou de outros Estados-Membros no **VIES** [L].

### 4.4 Custo KYC no piloto [E]

- **Hipótese:** 10 produtores, 60 compradores e 10–20 investidores. Isto dá ~70 KYB e ~100 identidades (gerentes, beneficiários efetivos e investidores).
- **Com fornecedor dedicado:**
  - identidades: 100 × €1,5–2,5 = **€150–250 one-off**;
  - KYB automatizado: 70 × €3–10 = **€210–700** [E];
  - *screening* contínuo: **€100–500/mês** [E];
  - mínimos mensais de plataforma: **€150–500/mês** [L/E].
- **Total: €300–1.200/mês no arranque** [E].

---

## 5. *Ledger* e reconciliação diária

### 5.1 Princípios de desenho [L/I]

1. **Dupla entrada imutável.** Cada movimento é um lançamento com débito = crédito. As correções fazem-se por estorno, nunca por edição.
2. **Unidades duplas.** Cada lote tem conta em **€** e em **massa/volume** (kg ou L de azeite; paletes/unidades de água). A reconciliação de stock usa o mesmo motor que a do dinheiro.
3. **Uma conta-espelho por conta bancária ou carteira PSP real.** A diferença entre o saldo do *ledger* e o saldo externo é, por definição, um *break*.
4. **Estados pendente/lançado** (*two-phase*): uma ordem de pagamento cria um movimento pendente, que só é lançado quando o extrato o confirma.
5. **Idempotência e chaves de correlação:** EndToEndId (ISO 20022), referência RF no SCT, ID de mandato no SDD, ID de transação no PSP, ATCUD/n.º de fatura.

### 5.2 Plano de contas mínimo [I]

| Classe | Contas (exemplos) |
|---|---|
| Ativo — bancos | `bank:opco:operacao`, `bank:opco:reserva_iva`, `bank:spv:serie1` |
| Ativo — PSP (se modelo agente) | `psp:lemonway:carteira:{utilizador}` (espelho) |
| Ativo — inventário | `inv:lote:{id}:eur`, `inv:lote:{id}:kg` |
| Ativo — recebíveis | `ar:comprador:{id}` |
| Passivo — fornecedores | `ap:produtor:{id}` |
| Passivo — investidores | `notes:serie1:{investidor}` (capital), `notes:serie1:juro_corrido` |
| Passivo — fundos de clientes (agente) | `client_money:{utilizador}` (deve igualar a soma das carteiras PSP) |
| Rendimentos e gastos | `rev:vendas`, `rev:comissoes`, `cogs:lote:{id}`, `exp:psp_fees`, `exp:hedge` |
| Fiscal | `tax:iva_liquidado`, `tax:iva_dedutivel` |

### 5.3 Ingestão de dados externos [L]

- **Extratos bancários ISO 20022:**
  - **camt.053**: extrato de fim de dia, a **fonte de verdade** da reconciliação D+1;
  - **camt.052**: posição intradiária;
  - **camt.054**: notificação de débito/crédito, quase em tempo real.
  - Iniciação: **pain.001** (transferências) e **pain.008** (débitos diretos); relatórios de estado: **pain.002**.
- **PSP:** relatórios de liquidação diários e *webhooks* (pagamento recebido, transferência, *payout*, reembolso). Na Adyen, os *payouts* e o KYC aparecem só na fatura mensal, e o *ledger* tem de acrescer essas taxas ao longo do mês [F] [P5].
- **IBAN virtual ou referência por comprador:** atribua a cada comprador um IBAN virtual (PSP/BaaS) **ou** uma referência estruturada **RF** (ISO 11649) impressa na fatura. Sem isto, a correspondência automática desce para a correspondência por nome/valor, que é frágil.
- **Faturação:** número, ATCUD, valor e IVA de cada documento emitido, a partir da API do programa certificado (§6).
- **Stock:** *feed* ERP/sensores (§7), lançado nas contas `inv:*:kg`.

### 5.4 Algoritmo de correspondência (*matching*) [I]

1. **Determinístico:** EndToEndId ou ID PSP igual → *match* 1:1.
2. **Referência:** RF ou IBAN virtual + valor exato → *match* 1:1 ou 1:N (pagamento de várias faturas).
3. **Mandato SDD:** ID de mandato + data de cobrança + valor.
4. **Heurístico:** valor exato, data ±2 dias úteis e nome do ordenante normalizado. Exige confirmação humana.
5. **Sem correspondência** → fila de exceções com classificação:
   - *timing*: lançado mas não liquidado;
   - valor: comissão ou desconto não previsto;
   - em falta: está no banco e não no *ledger*, ou o contrário;
   - duplicado;
   - devolução/R-transaction;
   - fraude suspeita.

### 5.5 Medir *breaks*: KPI e SLA propostos [I/E]

| KPI | Definição | Meta do piloto [E] |
|---|---|---|
| **Taxa de correspondência automática** | Linhas do extrato com *match* automático ÷ total | ≥ 95% a partir do 2.º mês |
| ***Breaks* abertos (n.º e €)** | Itens sem correspondência no fecho D+1 | 0 acima de €0,01 sem explicação às 10h00 de D+1 |
| **Envelhecimento** | *Breaks* por escalão: D+1, D+2–5, >D+5 | 0 em >D+5; escalar a partir de D+2 |
| **Verificação de segregação** | Saldo bancário de cada série da SPV = passivo `notes:serieX` + caixa disponível documentada | Diferença **zero**; qualquer diferença bloqueia pagamentos |
| **Verificação de fundos de clientes** (modelo agente) | Σ saldos de carteiras no relatório PSP = Σ `client_money:*` | Diferença zero |
| **Reconciliação de stock** | \|stock no sensor − ERP − *ledger*\| ÷ stock | ≤ 0,5% semanal; >1% bloqueia novas vendas desse lote |
| **Tempo de resolução** | Mediana de horas entre a deteção e o fecho do *break* | < 24 h |
| **Taxa de R-transactions** | Devoluções e rejeições SDD ÷ cobranças | < 1% |

**SLA diário [I]:** às 07h00, a ingestão dos camt.053 de D-1 e dos relatórios PSP. Às 09h00, o *matching*. Às 10h00, o relatório assinado (Tesouraria + Compliance) com *breaks*, verificação de segregação e *fill rate*. É o "SLA diário de reconciliação" pedido no documento-fonte.

### 5.6 Ferramentas

| Ferramenta | Tipo | Licença / modelo | Reconciliação incluída | Fonte |
|---|---|---|---|---|
| **Blnk** | *Ledger* dupla entrada + reconciliação com extratos/PSP | **Apache-2.0** | Sim, segundo o README | [F] [P14] |
| **Formance Ledger** | *Ledger* programável (Numscript), PostgreSQL | **MIT** (Community Edition) | **Não na CE**. O módulo `reconciliation` é **Enterprise Edition**, com licença proprietária e restrições a produção sem subscrição | [F] [P14] |
| **TigerBeetle** | Base de dados de transações financeiras (débitos/créditos, pendentes e lançados) | **Apache-2.0** | Não (é o núcleo) | [F] [P14] |
| **PostgreSQL + tabela de lançamentos imutável** | "Faça você mesmo" | Livre | Construída à medida | [L] |
| **Modern Treasury, Numeral e semelhantes** | SaaS de operações de pagamento, *ledger* e reconciliação | Comercial; preços não verificados | Sim | [L/NV] |

**Recomendação [I]:**
- no piloto, use **PostgreSQL com um modelo de lançamentos imutável** ou o **Blnk** (Apache-2.0, reconciliação incluída);
- evite depender do módulo EE da Formance sem contrato;
- o TigerBeetle é desnecessário à escala do piloto;
- reavalie um SaaS de operações de pagamento quando houver mais de 5 contas bancárias ou mais de um PSP.

---

## 6. Faturação em Portugal: obrigações e arquitetura

### 6.1 Obrigações aplicáveis (vendedor de bens em Portugal continental)

| Obrigação | Conteúdo | Estado | Fonte |
|---|---|---|---|
| ***Software* certificado pela AT** | Programas de faturação certificados (Portaria 363/2010): assinatura e encadeamento de documentos, exportação SAF-T(PT) | Em vigor | [L] [S76] |
| **ATCUD** | Código único: validação da série + número sequencial. Séries comunicadas à AT antes de usar | Obrigatório desde **1-01-2023** | [F] [S76] |
| **QR code** | Na fatura e documentos fiscalmente relevantes (Portaria 195/2020) | Em vigor | [F] [S76] |
| **Comunicação de faturas (e-Fatura)** | SAF-T(PT) de faturação mensal ou *webservice*, até ao dia 5 do mês seguinte | Em vigor (prazo do dia 5 a confirmar) | [F/NV] [S76] |
| **SAF-T da contabilidade** | Entrega do ficheiro contabilístico | Adiado para 2028 (exercício de 2027) | [F] [S76] |
| **Fatura eletrónica em PDF** | PDF simples aceite **até 31-12-2026**. **Desde 1-01-2027**: assinatura ou selo eletrónico **qualificado** | OE 2026 (Lei 73-A/2025, art. 95.º) | [F] [S76] |
| **Documentos de transporte** | Bens em circulação (DL 147/2003): comunicação prévia à AT e código AT no documento | Em vigor; limiares e dispensas a confirmar | [L] |
| **Faturação eletrónica B2G** | Faturas estruturadas (norma EN 16931 / CIUS-PT) em contratos públicos (CCP) | Em vigor. Prazos para PME **não verificados** | [L/NV] |
| **ViDA** | Faturação eletrónica estruturada (EN 16931) no B2B intracomunitário | A partir de **1-07-2030** | [F] [S77] |
| **Conservação** | Faturas e registos: prazo fiscal (10 anos, segundo a prática) e AML (7 anos, Lei 83/2017) | Em vigor | [L] |

### 6.2 Quem fatura o quê

- **Principal:**
  - o produtor fatura ao Sprout (IVA a 6% no azeite e 13% na água, segundo `20-regulatorio.md` §8.6 [S78]);
  - o Sprout fatura ao comprador;
  - os ajustes de preço (desclassificação do lote, quebra) fazem-se por **nota de crédito**.
- **Agente:**
  - o produtor fatura ao comprador, com o próprio *software* ou por **autofaturação/faturação por terceiros**. Isto exige acordo prévio e cumprimento das regras do CIVA (art. 36.º) [L, confirmar com o contabilista];
  - o Sprout fatura a comissão (IVA a 23%).
  - Na prática, os pequenos produtores não têm API de faturação. A autofaturação pelo Sprout centraliza o processo, mas transfere responsabilidade e complexidade [I].
- **SPV:** os juros de obrigações não estão sujeitos a IVA como transmissão de bens (operação financeira isenta [L], `20-regulatorio.md` §8.6). Há retenção na fonte de IRS/IRC sobre juros, a confirmar com o fiscalista [L/NV].

### 6.3 Implicações para a arquitetura [I]

1. **Nunca emita faturas a partir do código do Sprout.** Use uma **API de um programa certificado** (Moloni, InvoiceXpress, TOConline, Vendus, PHC GO, Primavera Jasmin, Sage). O Sprout cria o rascunho e o programa certificado emite, assina, atribui o ATCUD e comunica à AT. Certificar *software* próprio é um projeto à parte (meses) e não traz vantagem no piloto.
2. **Guarde no *ledger*** o n.º do documento, o ATCUD, o *hash*/assinatura, o URL do PDF e o estado da comunicação. A reconciliação cruza faturas, recebimentos (RF) e IVA.
3. **Imprima a referência RF e o IBAN (virtual) na fatura.** É o que permite ≥95% de correspondência automática.
4. **A partir de 1-01-2027**, o fornecedor de faturação tem de suportar **selo eletrónico qualificado** (de um QTSP). Confirme-o no contrato.
5. **Documentos de transporte** para cada expedição a partir do lagar ou do armazém, gerados pelo mesmo programa certificado e ligados ao lote (rastreabilidade).
6. **Exporte o SAF-T mensalmente** e entregue-o ao contabilista certificado. O fecho mensal só se faz depois da reconciliação diária estar a zeros.

---

## 7. Telemetria de stock e rastreabilidade

### 7.1 Sensores de nível em depósitos de azeite [L/E]

| Tecnologia | Princípio | Precisão típica [L] | Prós | Contras | Custo indicativo [E] |
|---|---|---|---|---|---|
| **Radar sem contacto (FMCW, ~80 GHz)** | Tempo de voo de micro-ondas | ±1–3 mm | Não toca no alimento; imune a vapor e temperatura; feixe estreito em depósitos altos de inox | Custo; instalação na tampa | €500–1.500 por sensor + *gateway* |
| **Ultrassons** | Eco acústico | ~0,25–0,5% da gama | Barato; muitos modelos IoT com bateria | Sensível a espuma, condensação, temperatura e geometria | €150–400 |
| **Pressão hidrostática** | Pressão da coluna de líquido no fundo | ~0,1–0,5% | Robusto; dá massa diretamente (com densidade) | Contacto com o alimento (exige materiais aptos, Reg. 1935/2004) e furo no fundo | €300–900 |
| **Células de carga** | Peso do depósito | Alta | Massa direta | Só em depósitos pequenos ou novos | €1.000+ |

- **Conversão:** volume → massa com densidade de ~0,91–0,92 kg/L para o azeite, corrigida pela temperatura [L]. Use a **massa (kg) como unidade contabilística**, porque é a unidade de preço do granel (`10-mercado.md`).
- **Conectividade:** LoRaWAN, NB-IoT/LTE-M ou 4G. Mensalidade de €2–15 por dispositivo [E].
- **Frequência recomendada [I]:**
  - leitura a cada **15 min** (deteta saídas não registadas);
  - envio à plataforma **horário**;
  - alarme imediato se a variação for superior a X L sem ordem associada;
  - "foto" diária às 00h00 para a reconciliação.

### 7.2 ERP nas PME portuguesas e modos de integração [L]

| ERP / faturação | Perfil típico | Integração provável | Nota |
|---|---|---|---|
| **PHC (CS/GO)** | PME industriais e comerciais | API (PHC GO), exportação CSV, base SQL Server (*on-premises*) | Pedir acesso só de leitura a vistas de stock |
| **Primavera (V10 / Jasmin / ROSE)** | PME e médias empresas | API REST (cloud), exportação CSV | — |
| **Sage (50/100)** | PME | Exportação CSV; API limitada | — |
| **Moloni, InvoiceXpress, TOConline, Vendus** | Micro e pequenas empresas, cloud | API REST pública | Mais faturação do que gestão de stock por depósito |
| **Folha de cálculo** | Lagares pequenos | Upload CSV / formulário | Comum; prever validação forte |
| **EDI GS1 (EANCOM: INVRPT, DESADV, ORDERS)** | Engarrafadores de água que já vendem à grande distribuição | VAN ou AS2 | Útil para a água (paletes, SSCC/GTIN) |

### 7.3 Contrato de dados do *feed* de stock (proposta para Pedro Marques / Lagar do Val) [I]

- **Fase 0 (semana 1):** **CSV diário por SFTP** ou carregamento na plataforma, até às 23h00. Um ficheiro por dia, com *hash*.
- **Fase 1 (mês 1–2):** **API REST** (*push* do ERP ou *pull* pelo Sprout) com eventos: entrada de produção, transferência entre depósitos, reserva de lote, expedição, amostra para análise.
- **Fase 2 (mês 2–4):** **sensores radar** nos depósitos dos lotes do piloto. Sinal a cada 15 min, por MQTT ou HTTP.

Campos mínimos por registo:

| Campo | Exemplo | Obrigatório |
|---|---|---|
| `timestamp` (ISO 8601, UTC) | 2026-10-13T23:00:00Z | Sim |
| `producer_id`, `site_id`, `tank_id` | LDV, LDV-01, T07 | Sim |
| `lot_id` / campanha | LDV-2026-AOVE-07 / 2026/27 | Sim |
| Categoria (Reg. 2022/2104) | AOVE / AOV / lampante | Sim |
| `volume_l`, `temperature_c`, `mass_kg` (calculada) | 18.250 / 17,5 / 16.735 | Sim |
| `book_stock_kg` (ERP) e `reserved_kg` | 16.800 / 10.000 | Sim |
| Última análise (acidez, peróxidos, K232, K270, ΔK, painel) + data + laboratório + PDF | 0,22% … | Por lote |
| Evento (produção / transferência / reserva / expedição) + documento (guia, fatura) | — | Por evento |

### 7.4 Reconciliação física [I]

- **Diária:** sensor vs. ERP do produtor. Tolerância de ±0,5%, que cobre evaporação, borras e temperatura.
- **Semanal:** ERP vs. *ledger* do Sprout (`inv:lote:*:kg`).
- **Por lote financiado:** inspeção independente na constituição e na libertação do lote, com selagem do depósito, amostragem e análise acreditada. Exemplos de inspetores: SGS, Bureau Veritas, laboratório acreditado IPAC. Custo de €300–1.500 por inspeção [E].
- Os **dados do sensor nunca substituem** a inspeção física quando há investidores [I].

### 7.5 Rastreabilidade e títulos de armazém

- **Reg. (CE) 178/2002, art. 18.º:** rastreabilidade "um passo atrás, um passo à frente" para todos os operadores [S71].
- **Normas de comercialização do azeite (Reg. Del. 2022/2104 e Reg. Exec. 2022/2105):** categoria, análises e painel [S69]. Os registos de existências e as declarações a autoridades nacionais **não foram verificados** [NV].
- **Armazéns gerais (Código Comercial, arts. 408.º ss.) [L]:** permitem emitir **conhecimento de depósito** e ***warrant*** (título de penhor) sobre mercadoria depositada. É um mecanismo antigo mas adequado para dar aos investidores da SPV uma **garantia real sobre o lote**. A alternativa é o penhor mercantil com desapossamento por terceiro depositário. **A confirmar com o Jurídico** [L/I].
- **GS1 [L]:** GTIN (produto), GLN (localização), SSCC (palete). Eventos de rastreabilidade no padrão **EPCIS 2.0**. Útil para a água e para o azeite embalado.

### 7.6 Água e café

- **Água:** o stock está em paletes num armazém, não em depósitos. A fonte é o WMS/ERP do engarrafador, por EDI ou CSV, e o controlo faz-se por SSCC [L/I].
- **Café:** fora do piloto (EUDR, `20-regulatorio.md` §11.5). Quando entrar, o stock é verde, em sacas, em armazém de importador. Use certificados de armazém e documentação EUDR, não sensores [I].

---

## 8. Segurança e conformidade

### 8.1 RGPD [L]

- **Papéis:**
  - o Sprout é **responsável pelo tratamento** dos dados de contrapartes e investidores;
  - PSP, fornecedor KYC, *cloud* e faturação são **subcontratantes** (art. 28.º, com acordo escrito);
  - o PSP é também **responsável autónomo** pelos seus deveres AML.
- **AIPD (art. 35.º):** obrigatória na prática. O KYC usa **biometria** (*liveness*/reconhecimento facial = dados biométricos para identificação, art. 9.º), faz *screening* de PEP e *adverse media* e avalia a solvência.
- **Registo de atividades (art. 30.º)**, **notificação de violações à CNPD em 72 h (art. 33.º)** e **prazos de conservação** (AML: 7 anos; fiscal: segundo a lei; *marketing*: até à oposição).
- **Localização:** dados na UE/EEE, com regiões *cloud* da UE. Transferências para fora da UE (ex.: fornecedor KYC com processamento fora da UE) exigem decisão de adequação ou cláusulas contratuais-tipo.

### 8.2 DORA (Reg. (UE) 2022/2554) [L]

- Aplica-se desde **17-01-2025** às **entidades financeiras** do art. 2.º: instituições de crédito, IP, IME, empresas de investimento, prestadores de serviços de *crowdfunding*, gestoras de FIA, entre outras.
- **Marketplace B2B não licenciado: não se aplica.**
- **Passa a aplicar-se se** o Sprout obtiver licença de IP/IME, ECSP, empresa de investimento ou AIFM. Nesse caso traz gestão de risco TIC, registo de incidentes, testes de resiliência e registo de informação dos fornecedores TIC.
- **Efeito indireto:** os PSP e bancos, que estão sujeitos à DORA, vão impor cláusulas contratuais (auditoria, notificação de incidentes, subcontratação) ao Sprout, se este for agente ou prestar serviços TIC relevantes [L/I].

### 8.3 NIS2 (Diretiva (UE) 2022/2555) [L]

- Setores do Anexo II relevantes:
  - **"Produção, transformação e distribuição de produtos alimentares"** (empresas do setor alimentar envolvidas na distribuição por grosso e na produção ou transformação industrial);
  - **"Prestadores de serviços digitais – mercados em linha"**.
- **Regra de dimensão:** em geral, só entidades **médias ou grandes** (≥50 trabalhadores, ou volume de negócios e balanço >€10M).
- **Transposição em Portugal:** o novo regime jurídico da cibersegurança (DL n.º 125/2025) **foi identificado mas não confirmado nesta sessão** [L/NV].
- **Implicação [I]:** o Sprout fica **fora do âmbito** no piloto. Desenhe já as medidas mínimas do art. 21.º (gestão de risco, incidentes, continuidade, cadeia de fornecimento, MFA, cifra), porque a escala ou o próprio PSP vão exigi-las.

### 8.4 Normas e enquadramentos

- **ISO/IEC 27001:2022 [L]:** a transição da versão de 2013 terminou em 31-10-2025. A certificação custa €15–50k no primeiro ano (consultoria + auditoria) [E]. **Meta para a fase 2** [I]. No piloto, alinhe os controlos com o Anexo A sem certificar.
- **OWASP ASVS 5.0.0 (05-2025):** é a versão estável atual do padrão de verificação de segurança de aplicações [F] [P15]. Use o **Nível 2** como critério de aceitação do *backoffice* e da *webapp* [I].
- **CycloneDX (ECMA-424)** para o SBOM [F] [P15].

### 8.5 *Audit logging* [L/I]

- **O que registar:**
  - autenticação;
  - alterações de permissões;
  - criação e alteração de contrapartes, IBAN e limites;
  - aprovação de pagamentos;
  - alterações de preço e de lote;
  - leituras de dados KYC;
  - exportações;
  - ações de administrador;
  - alterações de configuração.
- **Formato:** quem, o quê, quando (UTC, NTP), de onde (IP/dispositivo), o objeto antes e depois, e a correlação com o lançamento do *ledger*.
- **Integridade:** *append-only*, encadeamento por *hash* e armazenamento **WORM** (ex.: *object lock* em modo *compliance*), com cópia fora da conta de produção.
- **Princípio dos quatro olhos** em: alteração de IBAN de produtor, pagamentos acima de um limiar, libertação de lote financiado e alteração de regras de reconciliação.
- **Conservação:** eventos financeiros e KYC durante pelo menos **7 anos** (AML) e documentos fiscais pelo prazo legal [L].

### 8.6 Auditoria do *backoffice* "reverse engineered"

O documento-fonte reconhece um *backoffice* "reverse engineered" e pede para "remover dependências de *reverse engineering* sensíveis". **Antes de tocar em dinheiro, KYC ou dados de investidores, faça uma auditoria em três camadas** [I].

**A. Riscos jurídicos (com o Jurídico) [L]:**

| Risco | Base | Pergunta de auditoria |
|---|---|---|
| Direitos de autor sobre *software* | DL 252/94 (programas de computador; transpõe a diretiva hoje codificada na Dir. 2009/24/CE). A descompilação só é permitida para interoperabilidade | Houve descompilação ou cópia de código ou recursos de um produto de terceiros? Para que fim? |
| Segredos comerciais | Dir. (UE) 2016/943 (CPI, arts. 313.º ss.). A engenharia inversa de um produto obtido licitamente é lícita, **salvo proibição contratual** | Os termos de uso ou a licença do produto original proibiam engenharia inversa? |
| Contratos/ToS de APIs | Acesso a APIs não documentadas de terceiros (PSP, bancos, bolsas, *marketplaces*) | Há chamadas a *endpoints* não oficiais, *scraping* ou credenciais partilhadas? |
| Acesso a contas de pagamento | DSP2 e RTS (Reg. Del. 2018/389): o acesso de terceiros a contas faz-se por interface dedicada e com licença AISP/PISP | Há *screen scraping* de *homebanking*? (Se sim, eliminar) |
| Cibercrime | Lei 109/2009 (acesso ilegítimo, interceção) | Algum componente contorna autenticação ou proteções técnicas? |
| Titularidade do código | Programadores externos: sem cessão escrita, os direitos podem não pertencer ao Sprout | Existem contratos de cessão ou licença de todo o código? |
| Licenças *open source* | GPL/AGPL: a AGPL obriga a disponibilizar o código fonte a utilizadores via rede | Há componentes AGPL modificados no serviço? |
| RGPD | Dados pessoais importados ou copiados de outro sistema sem base legal | O *backoffice* contém dados reais de terceiros? |

**B. Verificação técnica (ferramentas *open source*, licenças verificadas [F] [P15]):**

| Passo | Ferramenta | Licença |
|---|---|---|
| SBOM | Syft → CycloneDX (ECMA-424) | Apache-2.0 |
| Licenças e direitos de autor no código | ScanCode Toolkit; FOSSology | Apache-2.0; GPL-2.0 |
| Vulnerabilidades de dependências | OSV-Scanner; Trivy | Apache-2.0; Apache-2.0 |
| Segredos no histórico Git | Gitleaks; TruffleHog | MIT; AGPL-3.0 (uso interno sem problema) |
| SAST | Semgrep (CE) | LGPL-2.1 |
| Verificação de requisitos | OWASP ASVS 5.0.0, Nível 2 | CC BY-SA |

**C. *Checklist* de aceitação [I]:**
1. Inventário de componentes, dados e integrações externas (incluindo URLs chamados em produção).
2. Proveniência: histórico Git completo, autores, contratos de cessão e ausência de código de terceiros sem licença (ScanCode + revisão manual dos módulos críticos).
3. Zero segredos no repositório. Rotação de todas as credenciais existentes.
4. Zero dependências com CVE crítica ou alta sem mitigação.
5. Autenticação: MFA obrigatória no *backoffice*, SSO, sessões curtas, RBAC com separação entre operações, tesouraria e compliance.
6. Pagamentos: nenhum segredo de PSP no *frontend*. *Webhooks* assinados e validados. Idempotência.
7. *Logging* conforme §8.5 e testado com a pergunta "quem alterou o IBAN X e quem aprovou?".
8. *Pentest* externo (*black* + *grey box*) antes do *go-live*: €5–15k [E].
9. *Backup* e *restore* testados (RPO ≤ 1 h, RTO ≤ 4 h) [E].
10. **Decisão por módulo:** manter / reescrever em "*clean room*" / substituir por SaaS. **Regra [I]:** se a proveniência de um módulo não puder ser provada, reescreva-o. Ledger, pagamentos e KYC são sempre de proveniência limpa.

---

## 9. Arquitetura de referência (piloto)

```
┌──────────────────────────────── CANAIS ─────────────────────────────────┐
│ WebApp Comprador │ Portal Produtor │ Portal Investidor* │ Backoffice     │
│ (catálogo, encom.)│ (stock, lotes)  │ (*desligado até    │ (ops, tesour., │
│                   │                 │  parecer jurídico) │  compliance)   │
└───────────┬───────────────┬──────────────────┬─────────────────┬────────┘
            ▼               ▼                  ▼                 ▼
┌──────────────────────────── SERVIÇOS NÚCLEO (UE) ────────────────────────┐
│ Identidade & RBAC (SSO+MFA) │ Contrapartes/KYC-KYB orquestração + casos │
│ Catálogo & Lotes (€ + kg)   │ Encomendas & Contratos (18M, força maior) │
│ LEDGER dupla entrada (Postgres/Blnk) ◀──▶ RECONCILIAÇÃO D+1 (matching)  │
│ Risco: preço mercado vs contrato, gatilhos hedge, PnL lote, fill rate   │
│ Documentos & Assinatura (CMD/CC/QES) │ Telemetria (MQTT/HTTP→séries)   │
│ Audit log (append-only, hash-chain → WORM)                              │
└──────┬──────────────┬──────────────┬──────────────┬──────────────┬──────┘
       ▼              ▼              ▼              ▼              ▼
  Banco(s) PT     PSP marketplace  KYC/KYB +      Faturação       ERP/CSV/SFTP
  OpCo + SPV      (fase 2/agente:  screening      certificada AT  + sensores
  SCT/Inst/SDD    Lemonway ou      (Sumsub/Veriff (API; ATCUD,    (Lagar do Val)
  camt.053/054    Mangopay)        /ComplyAdv.)   QR, SAF-T, selo
                                   + CMD/RCBE/    qualificado 2027)
                                   certidão perm.
```

| Decisão | Escolha recomendada [I] | Alternativa | Porquê |
|---|---|---|---|
| Modelo comercial | **Principal** (compra e revenda) | Agente + PSP marketplace | Coerente com a tese de margem; pagamentos baratos; sem fundos de terceiros |
| Contas | Banco PT: OpCo (operação + reserva de IVA) + SPV (uma conta por série) | IME/BaaS (Swan) | Segregação "dura" e verificável, sem AUP de PSP sobre o fluxo de investidores |
| Cobrança B2B | **SDD B2B** (recorrente) + SCT com RF; MB/MB WAY só em encomendas pequenas | PSP marketplace com IBAN virtual | Custo e risco de reversão |
| Pagamento a produtores | **SCT Inst + VoP**, a 30/60 dias (UTP) | SCT normal | SLA diário e prova de titularidade |
| KYC | Fornecedor dedicado (KYC + KYB + *screening*) + CMD/CC + certidão permanente + RCBE | KYC do PSP | Cobre também investidores da SPV, que não estão no PSP |
| *Ledger* | PostgreSQL com lançamentos imutáveis ou Blnk (Apache-2.0) | Formance CE (MIT, sem reconciliação) | Simplicidade e licença |
| Faturação | API de programa certificado AT | Certificar *software* próprio | Prazo e risco |
| Telemetria | CSV diário → API → radar em 15 min | Só ERP | Prova independente de stock para investidores |
| *Cloud* | Região UE, com IaC, KMS e *object lock* para *logs* | — | RGPD e auditabilidade |

---

## 10. Tabela de custos do piloto (6 meses)

**Hipóteses [E]:**
- 10 produtores, 60 compradores B2B e 10–20 investidores qualificados;
- **GMV mensal de €120k** em ~150 encomendas de ~€800;
- 2 compras de lote por mês a €40k;
- uma série da SPV de €0,5–1M;
- 4–6 depósitos instrumentados no Lagar do Val.

### 10.1 Opção A — recomendada (principal + bancos PT + KYC dedicado)

| Rubrica | *Setup* (one-off) | Mensal | Por transação | Base |
|---|---|---|---|---|
| Contas bancárias OpCo (2) + SPV (1–2), ID de credor SDD, canal de extratos | €0–500 | €30–150 | SCT/SCT Inst €0–1,5; SDD B2B €0,20–0,60; devolução SDD €2–10 | [E] (preçários bancários não verificados) |
| KYC/KYB/*screening* (fornecedor dedicado) | €0–2.000 | €300–1.200 | Identidade ~€1–2,5; KYB ~€3–10 | [L/NV] + [E] |
| Fontes oficiais PT (certidões permanentes, RCBE) | — | €20–100 | Por certidão [NV] | [E] |
| *Ledger* + reconciliação (*open source*; desenvolvimento interno) | 4–8 semanas de 1 engenheiro (custo interno) | Incluído na *cloud* | — | [F] licenças [P14]; [E] esforço |
| *Cloud* UE (aplicação, BD gerida, *backups*, *logs* WORM, monitorização) | €0–1.000 | €300–1.000 | — | [E] |
| Faturação certificada com API | €0–500 | €20–100 | — | [E] |
| Selo eletrónico qualificado (obrigatório a partir de 1-01-2027) | €100–400/ano | — | — | [F] obrigação [S76]; [E] preço |
| Telemetria (4–6 sensores radar + *gateway* + instalação) | €3.000–9.000 | €20–90 (conectividade e plataforma) | — | [E] |
| Inspeção independente por lote financiado | — | — | €300–1.500 por inspeção | [E] |
| Auditoria do *backoffice* (código + proveniência) + *pentest* | €10.000–25.000 | — | — | [E] |
| AIPD/RGPD + políticas de segurança (externo) | €3.000–8.000 | — | — | [E] |
| **Total Opção A** | **≈ €16–47k** | **≈ €0,7–2,6k** | **≈ 0,03–0,1% do GMV** (sem inspeções) | [E] |

### 10.2 Opção B — acrescento se o modelo for agente (PSP marketplace, preçário de lista Lemonway)

| Rubrica | *Setup* | Mensal | Por transação | Base |
|---|---|---|---|---|
| Lemonway, preçário de lista | **€5.490** | **€840** (suporte) | *Pay-in* por transferência/débito **0,30% + €0,40**; *payout* SEPA **€0,50**; KYC **€0,40/mês por pessoa**; KYB **€0,80/mês por empresa** | [F] [P1] |
| Aplicado às hipóteses | €5.490 | €840 + 150 × (€2,40 + €0,40) + 12 × €0,50 + 70 × €0,80 + 100 × €0,40 ≈ **€1.360** | ≈ **1,1% do GMV** de €120k (a ~€500k/mês com o mesmo ticket médio desce para ~0,5%; tende para 0,30% + custos fixos) | [E] cálculo |
| Integração técnica (carteiras, *webhooks*, reconciliação espelho) | 3–6 semanas de 1 engenheiro | — | — | [E] |

**Sensibilidade [E]:**
- num lote de €50.000, o *pay-in* Lemonway custa **€150**, o *payout* Stripe Connect **€125** e uma transferência SEPA bancária **€0–2** (§3.3);
- um teto negociado de ~€25 por *pay-in* [I] reduz o custo de um lote de €50.000 de €150 para €25. Nas encomendas pequenas (€800 → €2,80) o teto não altera nada: aí o custo dominante é a mensalidade de €840.

---

## 11. Implicações para o Sprout

1. **Decida já "principal vs. agente". Recomendação: principal no piloto.** Esta decisão define pagamentos, faturação e licenças, antes de qualquer escolha de PSP. Ser principal é a única forma de capturar o diferencial granel→prateleira e elimina a questão DSP2 nos fluxos de mercadoria. Confirme por escrito com o Gonçalo Almeida.
2. **O dinheiro dos investidores nunca entra numa carteira de marketplace nem numa conta da OpCo.**
   - Usa contas bancárias da SPV, **uma por série**, e só recebe de contas em nome do investidor.
   - A reconciliação diária verifica que "saldo da série = passivo da série ± movimentos documentados", com tolerância zero.
   - É esta a "segregação diária de contas" que o documento-fonte pede.
3. **"Monetizar em 12 horas" só é possível no B2B e só com uma ferramenta tipo Stripe Connect.** Mesmo assim, as encomendas ficam abaixo de €10k em SDD e não pode haver dinheiro de investidores nesse fluxo. A via sustentável é banco + SDD B2B + SCT Inst, operacional em 2–6 semanas [E].
4. **Faça uma RFP curta a dois PSP marketplace (Lemonway e Mangopay) durante o piloto, para a fase 2.**
   - Peça: (i) aceitação escrita do caso de uso completo, incluindo a SPV; (ii) **teto por *pay-in*** no B2B; (iii) prazo para SCT Inst nos *payouts* (as IP/IME só são obrigadas em 2027 [L]); (iv) IBAN virtual PT ou de outro país; (v) relatórios diários de liquidação; (vi) custo de saída e portabilidade de dados KYC.
   - Exclua a Treezor (mudança de controlo e historial AML) e a Stripe para qualquer fluxo de investimento.
5. **Não use Multibanco/MB WAY como *rail* principal.** A 1,5–1,8% do valor, destroem o *spread* (o desconto-alvo de 10–15% e uma margem real de 0,15–1,2 €/kg, segundo `10-mercado.md`). Use-os só para encomendas pequenas e clientes novos.
6. **O KYC tem de cobrir investidores fora do PSP.** Escolha um fornecedor dedicado (KYC + KYB + *screening*) e integre CMD/CC para portugueses. Guarde as evidências 7 anos. Faça *screening* diário a todas as contrapartes e aos beneficiários efetivos.
7. **Construa o *ledger* antes da UI.**
   - *Ledger* de dupla entrada com € e kg, contas-espelho por banco, PSP, lote e série;
   - camt.053 diário e referência RF em todas as faturas;
   - KPI de *breaks* do §5.5.
   - O "dashboard de risco" pedido ao Speaker 2 lê do *ledger*, não de folhas de cálculo.
8. **Faturação certificada por API desde o primeiro dia, com selo qualificado garantido para 1-01-2027.** As notas de crédito tratam as desclassificações e os ajustes de lote. Os documentos de transporte ficam ligados ao `lot_id`.
9. **Pedido concreto ao Pedro Marques:**
   - CSV diário (esquema do §7.3) a partir da próxima semana;
   - lista de depósitos (volume, altura, material, acesso à tampa) para orçamentar sensores radar;
   - laboratório e calendário de análises por lote.
   - Sem *feed* diário e inspeção física, **não há lote financiável**.
10. **Garantia real para investidores:** estude com o Jurídico **armazém geral + *warrant*** (Código Comercial) ou penhor com depositário terceiro. A telemetria serve para monitorizar a garantia, não para a substituir.
11. **O *backoffice* "reverse engineered" fica em quarentena** até à auditoria do §8.6. Ledger, pagamentos e KYC devem ser código de proveniência limpa, escrito ou licenciado pelo Sprout. Se houver *scraping* de bancos ou PSP, elimine-o já: é ilegal sem licença AISP e viola as AUP.
12. **Conformidade proporcional:**
    - RGPD/AIPD agora;
    - ASVS 5.0 Nível 2 como *gate* de *release*;
    - logs WORM;
    - quatro olhos em IBAN e pagamentos.
    - DORA e NIS2 não se aplicam no piloto, mas desenhe já para elas.
    - ISO 27001 só na fase 2, quando houver bancos, PSP ou investidores institucionais a pedi-la.
13. **Orçamento do piloto [E]:** **€16–47k de *setup* e €0,7–2,6k/mês** (Opção A). Acrescente **€5,5k + ~€1,4k/mês** se for preciso PSP marketplace (Opção B). O maior custo único é a auditoria do *backoffice* e o *pentest*. O maior custo variável é, de longe, o *pay-in* percentual dos PSP.

---

## 12. Itens não verificados / a confirmar

- **Preços KYC** (Sumsub, Veriff, Onfido/Entrust, IDnow, ComplyAdvantage): o orçamento de pesquisa esgotou-se. Valores [L/NV]; pedir cotação.
- **Preçário Stripe Connect em EUR para Portugal:** os valores de €2 por conta ativa e 0,25% + €0,10 por *payout* vêm de fonte secundária de 01-2024. Também não foi verificada a taxa de *pay-in* por transferência bancária ou SDD da Stripe em Portugal.
- **Preços Mangopay, Adyen e Treezor:** sem preçário público. **Swan:** €2.990/mês só confirmado por agregadores.
- **Lemonway:** a moeda dos valores não está explícita na página (presumivelmente €). O agrupamento "transferência e débito direto a 0,30% + €0,40" deve ser confirmado.
- **easypay:** se o preço de €0,25 + 1,5% é geral ou condição BBVA; registo no BdP. **ifthenpay:** data do preço. **Eupago:** componente fixa exata.
- Limites MB WAY e referências Multibanco para comerciantes.
- **IPR:** datas de obrigação de SCT Inst para IP/IME (9-01-2027 receção; 9-04-2027 envio) [L]. Eliminação do teto de €100k do SCT Inst no *rulebook* EPC de 2025 [NV]. Prazo de devolução do SDD B2B [NV].
- Disponibilidade de camt.053 e IBAN virtuais nos bancos portugueses; custo de SDD B2B nos bancos PT.
- **CMD:** condições e custo de adesão de entidades privadas à Autenticação.gov; preço atual da certidão permanente.
- **NIS2:** diploma de transposição em Portugal (DL 125/2025?) e data de produção de efeitos.
- **DORA:** confirmação do âmbito se o Sprout se tornar agente de uma IP.
- **Faturação:** prazo de comunicação SAF-T (dia 5); limiares do regime de bens em circulação; prazos B2G para PME; regras exatas de autofaturação (CIVA, art. 36.º); retenção na fonte sobre juros da SPV.
- Registos e declarações obrigatórias de existências de azeite em Portugal.
- Regime dos armazéns gerais e *warrants* (Código Comercial) e a sua utilização prática atual.
- Especificações e preços de sensores radar/ultrassons; quota dos ERP nas PME portuguesas.

---

## Fontes (acesso a 13-10-2026)

**Prestadores de pagamento**
- [P1] Lemonway, preçário marketplace — https://lemonway.com/en/pricing-marketplace ; preçário geral — https://lemonway.com/en/pricing ; política de preços — https://support.lemonway.com/hc/en-us/articles/360016283278-What-is-Lemonway-s-pricing-policy ; Fitgap (setup €5.490) — https://us.fitgap.com/products/lemonway
- [P2] Lemonway, "About" (fluxos de 2024, n.º de plataformas) — https://lemonway.com/en/about-lemonway ; Crowdfund Insider (licença ACPR 2012, passaporte, plataformas de *crowdfunding*) — https://www.crowdfundinsider.com/?p=134677 ; https://www.crowdfundinsider.com/2018/07/136507-leading-european-payment-platform-lemon-way-receives-e10-million-investment-to-fuel-hypergrowth/ ; https://www.crowdfundinsider.com/?p=144476
- [P3] Mangopay, aviso legal (IME CSSF) — https://mangopay.com/legal-notice ; preçário — https://mangopay.com/pricing ; salvaguarda — https://blog.mangopay.com/en/home/how-mangopay-holds-and-safeguards-funds-within-the-wallet-ecosystem ; negócios proibidos — https://mangopay.com/en-gb/prohibited-businesses ; Amex — https://docs.mangopay.com/guides/payment-methods/card/amex ; FCA EMI (11-2023) — https://www.fintechfutures.com/paytech/mangopay-secures-uk-emi-licence-from-the-fca ; Advent (2022) — https://www.fintechfutures.com/cross-border-payments/advent-international-acquires-european-paytech-mangopay-invests-75m ; The Paypers (IBAN virtuais) — https://thepaypers.com/payments/company-information/mangopay ; deck comercial antigo — https://cdn.mediactive-network.net/events/vivatech/uploads/services/surcouche/Sales-Deck-1_1623860158_HK2K8T.pdf
- [P4] Stripe Connect, preços (locais US/PL/NO) — https://stripe.com/it-us/connect/pricing ; https://stripe.com/pl/connect/pricing ; https://stripe.com/sv-no/connect/pricing ; Sharetribe, valores EUR (01-2024) — https://sharetribe.com/help/en/articles/8803821-stripe-s-processing-fees ; Instant Payouts — https://docs.stripe.com/docs/payouts/instant-payouts ; SEPA Direct Debit (limite €10.000) — https://docs.stripe.com/payments/sepa-debit ; alteração SDD 06-2024 — https://support.stripe.com/questions/june-2024-pricing-update-for-sepa-direct-debit ; negócios restritos (FAQ) — https://support.stripe.com/questions/restricted-business-list-faqs ; lista — https://stripe.com/legal/restricted-businesses ; Conduct Atlas (05-2026) — https://conductatlas.com/platform/stripe/stripe-restricted-businesses-list/equity-crowdfunding-jurisdiction-restrictions/
- [P5] Adyen, relatórios e taxas (plataformas) — https://docs.adyen.com/platforms/reports-and-fees ; reconciliação de taxas — https://docs.adyen.com/platforms/reconciliation-use-cases/reconcile-fees ; Combined Financial Services Guide — https://adyen.com/legal/combined-financial-services-guide
- [P6] Swan, blog (IME ACPR, REGAFI 86245) — https://www.swan.io/blog-posts/why-embedded-banking-works-best-when-compliance-comes-first ; Codego vs Swan (IBAN locais, SEPA Inst) — https://codegotech.com/vs-swan ; Fitgap (€2.990/mês) — https://us.fitgap.com/products/022380/swan ; SPEEDA Edge — https://sp-edge.com/companies/736089 ; TechCrunch (2020, €900/mês) — https://techcrunch.com/2020/09/15/bank-as-a-service-startup-swan-helps-other-companies-issue-cards-accounts-and-ibans ; Lago (modelo de preço) — https://getlago.com/resources/templates/swan
- [P7] Treezor, todos os serviços de pagamento — https://www.treezor.com/en/press/treezor-1st-french-money-institution-authorized-for-all-payment-services/ ; aviso legal — https://www.treezor.com/legal-notice/ ; Boursorama (29-01-2026) — https://www.boursorama.com/bourse/actualites/la-societe-generale-va-revendre-la-fintech-treezor-a-shares-590ac8174e5580b339d6c13100e3c29e ; Maddyness (29-01-2026) — https://www.maddyness.com/2026/01/29/shares-la-fintech-de-benjamin-chemla-va-soffrir-treezor-aupres-de-societe-generale/ ; Mind Fintech (recapitalização) — https://www.mind.eu.com/fintech/article/societe-generale-recapitalise-treezor-au-prix-plancher-une-premiere-depuis-sa-creation/ ; FrenchWeb (fecho, 10-2026) — https://www.frenchweb.fr/de-treezor-a-boursobank-societe-generale-redessine-ses-priorites-numeriques/463787 ; Wikipédia FR — https://fr.wikipedia.org/wiki/Treezor
- [P8] BBVA Portugal / easypay (preço) — https://www.bbva.pt/en/empresas/servicos/e-commerce/easypay.html ; easypay MB WAY — https://www.easypay.pt/en/payment-methods/mb-way ; referências Multibanco — https://support.easypay.pt/en/knowledge-base/o-que-são-referências-multibanco-easypay
- [P9] ifthenpay (preços, estatuto) — https://ifthenpay.com/
- [P10] Banco de Portugal, Portal do Cliente Bancário, preçário Eupago (28-01-2026) — https://clientebancario.bportugal.pt/sites/default/files/precario/8709_/8709_PRE_20260128003707.pdf ; versão de 2022 — https://clientebancario.bportugal.pt/sites/default/files/precario/8709_/8709_PRE_20220704000610.pdf
- [P11] Postal (limites MB WAY 2025) — https://postal.pt/economia/mb-way-em-2025-quanto-posso-transferir-e-como-configurar-os-limites/ ; Rankia (limite Multibanco) — https://www.rankia.pt/financas-pessoais/transferencias-por-multibanco-qual-o-limite-maximo/

**Esquemas SEPA e regulação de pagamentos**
- [P12] EPC, SDD B2B Rulebook 2025 v1.0 — https://europeanpaymentscouncil.eu/sites/default/files/kb/file/2024-11/EPC222-07%202025%20SDD%20B2B%20Rulebook%20version%201.0.pdf ; EPC, SDD B2B C2PSP IG 2025 — https://www.europeanpaymentscouncil.eu/sites/default/files/kb/file/2025-10/EPC131-08%20SDD%20B2B%20C2PSP%20IG%202025%20V1.0.pdf ; EPC147-14 (confirmação de mandatos) — https://www.dirittobancario.it/wp-content/uploads/sites/default/files/allegati/epc147-14_guidance_for_sdd_b2b_mandate_confirmations.pdf ; Nordea, descrição SDD — https://www.nordea.com/en/doc/sdd-service-description-mandate-creditor.pdf
- [P13] BCE, Instant Payments Regulation — https://www.ecb.europa.eu/paym/retail/instant_payments/html/instant_payments_regulation.en.html ; Bird & Bird — https://twobirds.com/en/insights/2024/global/instant-payments-regulation ; Vixio — https://www.vixio.com/insights/pc-regulatory-influencer-adapting-speed-instant-payments-regulations

***Software* (lido diretamente no GitHub)**
- [P14] TigerBeetle (LICENSE Apache-2.0, README) — https://github.com/tigerbeetle/tigerbeetle ; Formance Ledger (MIT, README) — https://github.com/formancehq/ledger ; Formance stack/payments (MIT + EE) — https://github.com/formancehq/stack/blob/main/LICENSE ; Formance reconciliation (licença EE) — https://github.com/formancehq/reconciliation/blob/main/LICENSE ; Blnk (Apache-2.0, README) — https://github.com/blnkfinance/blnk
- [P15] OWASP ASVS 5.0.0 (05-2025) — https://github.com/OWASP/ASVS ; CycloneDX (ECMA-424) — https://github.com/CycloneDX/specification ; Syft — https://github.com/anchore/syft ; ScanCode Toolkit — https://github.com/aboutcode-org/scancode-toolkit ; FOSSology — https://github.com/fossology/fossology ; OSV-Scanner — https://github.com/google/osv-scanner ; Trivy — https://github.com/aquasecurity/trivy ; Gitleaks — https://github.com/gitleaks/gitleaks ; TruffleHog — https://github.com/trufflesecurity/trufflehog ; Semgrep — https://github.com/semgrep/semgrep

**Remissões para `20-regulatorio.md`** (lista completa e URL nesse documento): [S32] DSP2; [S41] IPR; [S42] numerário (LGT, art. 63.º-E); [S43] AMLR/AMLA; [S45] Lei 97/2017 e BdP; [S46] RCBE; [S69] normas do azeite; [S71] Reg. 178/2002; [S76] faturação (ATCUD, QR, SAF-T, assinatura qualificada 2027); [S77] ViDA; [S78] taxas de IVA.
