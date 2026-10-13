# 20 — Enquadramento regulatório UE + Portugal (marketplace B2B e produto de investimento em lotes físicos)

> Projeto Sprout (nome de trabalho) · Data de referência: **13-10-2026** · Fonte de partida: `docs/fonte/plano-estrategico-10-13.md`
> Âmbito: (a) marketplace B2B fechado de azeite, água e café; (b) produto em que HNWI/investidores qualificados (e, segundo o documento-fonte, "investidores não sofisticados (jogadores)") financiam lotes físicos comprados 10–15% abaixo do mercado, com liquidação até 18 meses, extensão e "refunding".
> **Isto não é um parecer jurídico.** É um mapa de decisão para orientar o parecer que o Jurídico (Gonçalo Almeida) tem de emitir.

## 0. Nota metodológica e legenda

- **Limitação de acesso.** Neste ambiente, os sítios primários (EUR-Lex, ESMA, CMVM, Banco de Portugal, Diário da República, FCA, BOE) estavam bloqueados para leitura direta (proxy 403). A verificação fez-se com extratos de motores de pesquisa de fontes primárias e secundárias (escritórios de advogados, imprensa especializada). Por isso, cada afirmação traz uma etiqueta e, onde importa, a indicação de que é preciso confirmar o texto oficial.
- **Legenda:**
  - **[F]** facto com fonte (primária ou secundária fiável), verificado nesta sessão.
  - **[L]** texto legal citado de memória técnica, não relido online nesta sessão (confiança média-alta; confirmar artigo e redação).
  - **[E]** estimativa (custos e prazos de mercado).
  - **[I]** inferência ou opinião nossa.
  - **[NV]** não verificado.
- As fontes estão numeradas `[Sx]` e listadas na secção "Fontes" (todas com acesso a 13-10-2026).

---

## 1. Síntese executiva (o que decide tudo)

1. **O marketplace B2B puro, em que empresas compram e vendem mercadoria física com entrega, não é atividade financeira regulada.** Não precisa de licença CMVM nem de licença do Banco de Portugal, desde que **o dinheiro não passe pelas contas do Sprout** (é preciso usar o produto *marketplace* de um PSP/IME licenciado na UE) [I], [S31–S36].
2. **O produto para investidores é o que gera risco.** Conforme o desenho, pode ser qualificado como:
   - **instrumento financeiro**: valor mobiliário (notes) ou **derivado sobre mercadorias** liquidado em dinheiro (MiFID II, Anexo I, Secção C);
   - **OIC/FIA** (AIFMD, art. 4.º(1)(a));
   - **receção de fundos reembolsáveis**, reservada aos bancos (CRD, art. 9.º; RGICSF, arts. 8.º e 9.º);
   - **oferta de *crowdfunding*** (Reg. (UE) 2020/1503).
   Prometer "10–15% + reembolso garantido + extensão" a retalho junta quase todos estes gatilhos [I].
3. **Portugal mudou o limiar de prospeto.** Desde **1-09-2026**, o art. 109.º(4) do CVM, na redação do **DL 171/2026**, afasta o regime das ofertas ao público abaixo de **€12M por emitente ou oferente em 12 meses** (antes eram €8M). As fontes consultadas não indicam que Portugal tenha escolhido a opção de €5M [F] [S1–S5]. Ficar abaixo do limiar **não** afasta a MiFID, os PRIIPs, a reserva bancária nem as regras de publicidade [I].
4. **O retalho ("jogadores") só pode ser abordado por três vias:**
   - plataforma **ECSP** autorizada, com teto de **€5M por promotor em 12 meses**, teste de conhecimentos, simulação de perdas, 4 dias de reflexão e KIIS [F] [S9, S11, S12];
   - oferta com **intermediário autorizado** (e PRIIPs KID, se aplicável);
   - FIA comercializável a retalho.
   **Está fora de questão** comercializar diretamente a retalho um produto que promete retorno e usa mecânicas de jogo [I].
5. **Os 18 meses não podem ser impostos aos produtores.** Pela Diretiva 2019/633 (transposta pelo DL 76/2021), pagar produtos agroalimentares a mais de **30 dias** (perecíveis) ou **60 dias** (restantes) é prática proibida, quando o fornecedor fatura até €350M e o comprador é maior [F] [S74]. A janela de 18 meses tem de ficar do lado do investidor (financiamento de inventário), não do produtor [I].
6. **Piloto recomendado [I]:**
   - OpCo PT a operar o marketplace B2B sobre os rails de um PSP da UE;
   - uma **SPV PT (SA)** que emite obrigações apenas para **investidores qualificados**, ou com **subscrição mínima de €100k** por investidor (art. 1.º(4)(a)/(d) do Reg. Prospetos);
   - zero retalho, zero gamificação, zero promessa de capital garantido;
   - Luxemburgo (veículo de titularização) só quando a escala o justificar.

---

## 2. Qualificação jurídica do produto de investimento

### 2.1 Instrumento financeiro (MiFID II, Diretiva 2014/65/UE, Anexo I, Secção C) [S20–S22]

| Desenho do produto | Qualificação provável | Base |
|---|---|---|
| Investidor recebe **notes/obrigações negociáveis** emitidas por SPV ou OpCo | **Valor mobiliário** (C(1); art. 4.º(1)(44)) → MiFID para quem coloca ou aconselha; Prospetos; eventualmente PRIIPs | [L] |
| Investidor "compra" lote sem querer a mercadoria e recebe **diferença em dinheiro** indexada ao preço de mercado na liquidação | **Derivado sobre mercadorias liquidado em dinheiro** (C(5): "settled in cash or may be settled in cash at the option of one of the parties") → MiFID + EMIR + PRIIPs | [L]; ESMA C6/C7 [S22] |
| Contrato de compra a prazo **com entrega física**, fora de plataforma, **para fins comerciais** (comprador industrial/retalhista que usa o azeite) | Em regra **não é instrumento financeiro**: falha a C(7), que exige "não para fins comerciais" e características de derivado; ver art. 7.º do Reg. Del. 2017/565 | [F] [S22] |
| Compra **à vista** com entrega no prazo normal de mercado | Contrato *spot* (art. 7.º(2) Reg. Del. 2017/565) → fora da MiFID | [L] [S21] |

- **Nota ESMA [F]** [S22]: as orientações C6/C7 leem "liquidação física" de forma ampla. Incluem a entrega de documento que confira direitos de natureza dominial sobre a mercadoria, como *warehouse warrant* ou conhecimento de embarque.
- **Implicação [I]:** um "certificado de lote" com direito à mercadoria pode escapar à C(5), mas só se a entrega física for real e exercível. Se o investidor nunca recebe azeite e a opção normal é o dinheiro, é derivado.

### 2.2 Organismo de investimento coletivo / FIA (AIFMD 2011/61/UE, art. 4.º(1)(a)) [S18, S19]

- **Definição [L]:** FIA é o organismo de investimento coletivo que **levanta capital junto de vários investidores** para o investir **segundo uma política de investimento definida**, em benefício desses investidores.
- **Orientações ESMA/2013/611 [F]** [S18]: são "organismo de investimento coletivo" as entidades que
  1. não têm finalidade comercial ou industrial geral;
  2. agregam capital para gerar um **retorno agregado** (*pooled return*);
  3. não dão aos investidores poder de controlo diário.

  Os conceitos "levantar capital", "número de investidores" e "política de investimento definida" estão densificados nas mesmas orientações.
- **Teste aplicado ao Sprout [I]:**
  - Uma **sociedade comercial que efetivamente compra e revende azeite** a clientes reais, com logística e risco comercial, tem finalidade comercial e, em princípio, **não é FIA**, mesmo financiada por dívida.
  - Um **veículo passivo** que junta dinheiro de investidores para "deter lotes à espera de valorização", com regras de seleção pré-definidas e retorno partilhado (sobretudo se houver mutualização via "refunding"), **aproxima-se muito de FIA**.
- **Exclusão útil [L]:** o art. 2.º(3)(g) da AIFMD exclui as "entidades com objeto específico de titularização". É o argumento usual dos veículos de titularização luxemburgueses, mas exige parecer.
- **Se for FIA:** é preciso gestor autorizado (AIFM), ou registado se abaixo dos limiares de **€100M** (com alavancagem) ou **€500M** (sem alavancagem e sem resgates durante 5 anos) (AIFMD, art. 3.º(2)) [L]. Em Portugal, o **RGA (DL 27/2023)** criou as categorias de gestor de pequena e grande dimensão com estes mesmos cortes. Para os de pequena dimensão: **capital inicial de €75.000** e prazo de decisão de **30 dias**, contra 90 para os de grande dimensão [F] [S28]. O RGA está regulamentado pelo **Reg. CMVM 7/2023**, em vigor desde 1-01-2024 [F] [S81].
- **AIFMD II (Diretiva 2024/927):**
  - prazo de transposição: **16-04-2026** [F] [S30];
  - em 28-05-2026, o guia CMS indicava que Portugal **ainda não tinha transposto** [F] [S29]; o estado à data de hoje **não foi verificado** [NV].
- **ELTIF não serve [L]:** o Reg. 2015/760 (art. 9.º(2), na versão ELTIF 2.0) proíbe exposição direta ou indireta a **mercadorias** [S68] (artigo a confirmar no consolidado).

### 2.3 Crowdfunding (Regulamento (UE) 2020/1503 — ECSP) [S9–S17]

**Âmbito e teto**
- O regulamento abrange a facilitação de **empréstimos** e a colocação, sem tomada firme, de **valores mobiliários e instrumentos admitidos** para financiar projetos de **empresas**. Projetos de **consumidores** ficam excluídos [F] [S12].
- **Teto: €5.000.000 por promotor, em 12 meses** (art. 1.º(2)(c)). Acima disso aplicam-se MiFID e Prospetos [F] [S13].
- A indústria pede a subida para €12M. **Não foi confirmada nenhuma proposta legislativa formal** à data [F/NV] [S13].

**Investidor sofisticado (Anexo II) [F]** [S11]
- Pessoa singular tem de cumprir pelo menos **dois de três** critérios:
  1. rendimento bruto ≥ **€60.000/ano**, ou carteira > **€100.000** (inclui depósitos);
  2. ≥ **1 ano** de experiência profissional no setor financeiro;
  3. **10 transações de dimensão significativa por trimestre** nos 4 trimestres anteriores.
- O estatuto é **pedido pelo investidor e tem validade de 2 anos**.

**Investidor não sofisticado [F]** [S12, S9]
- Art. 21.º:
  - **teste de conhecimentos de entrada**;
  - **simulação da capacidade de suportar perdas**, calculada como 10% do património líquido;
  - acima do **maior de €1.000 ou 5% do património líquido**: aviso de risco e consentimento expresso.

  Há uma fonte secundária que lê "o menor"; a leitura correta, conforme o texto, é "o maior" [L].
- Art. 22.º: **período de reflexão pré-contratual de 4 dias de calendário**, durante o qual pode revogar sem custos.
- Art. 23.º: **KIIS**, a ficha de informação fundamental do investimento.

**Pontos críticos para o Sprout**
- **SPV no ECSP [F]** [S10]: só é permitido para **um ativo ilíquido ou indivisível**, analisado em transparência (art. 3.º(6)). A ESMA lê "ilíquido" de forma estrita. Um stock de azeite é, à partida, **líquido e divisível**, o que torna discutível usar SPV ECSP por lote [I].
- **Conflitos (art. 8.º) [F]** [S10, S17]: o prestador ECSP **não pode ter participação em ofertas na sua plataforma**, nem participar em SPV interposta. Segundo a Bird & Bird, também não pode intermediar promotores que detenham ≥20% do seu capital (texto a confirmar). Conclusão [I]: o Sprout **não deve ser ao mesmo tempo ECSP e promotor dos seus lotes**. O caminho é ser **promotor numa plataforma ECSP de terceiros**.
- **Fundos e pagamentos [L]:** o ECSP tem de guardar fundos e processar pagamentos através de PSP licenciado, ou ter licença própria (art. 10.º).
- **Requisitos de licença própria [L]:**
  - fundos próprios: o maior de **€25.000** ou ¼ dos custos fixos anuais (art. 11.º);
  - decisão de autorização em **3 meses** após processo completo (art. 12.º).

**Portugal**
- O **DL 66/2023** (8-08-2023) alterou e republicou a **Lei 102/2015** para executar o ECSP. A CMVM é a autoridade competente para o *crowdfunding* de capital e por empréstimo. As plataformas existentes tiveram **até 10-11-2023** para se adaptar [F] [S14, S15].
- O *crowdfunding* de **donativo e recompensa** continua no regime nacional da Lei 102/2015 [F/I] [S15].
- O **Reg. CMVM 3/2025** remete para a definição ECSP de investidor não sofisticado [F] [S14 (via pesquisa)].
- **Raize:** obteve autorização ECSP, segundo a Abreu Advogados [F] [S16]; a data não foi verificada [NV].
- **Goparity:** não verificado [NV].

### 2.4 Oferta pública e prospeto (Regulamento (UE) 2017/1129, alterado pelo *Listing Act*, Reg. 2024/2809) [S1–S8, S24]

| Regra | Conteúdo | Estado |
|---|---|---|
| Limiar UE de isenção | **€12M por emitente/oferente em 12 meses**, em regime único, aplicável desde **5-06-2026**; os Estados-Membros podem fixar um limiar nacional inferior, nunca abaixo de **€5M** | [F] [S6, S7] |
| **Portugal: limiar efetivo** | Até 31-08-2026: **€8M** (CVM, art. 109.º(4), versão de 2022) [F] [S8]. Desde **1-09-2026**: **€12M** (DL 171/2026, de 26-08) [F] [S1–S5]. Não há indicação de que PT tenha optado pelos €5M | Data de produção de efeitos do n.º 4 inferida do consolidado [I] |
| Art. 1.º(4)(a) | Oferta só a **investidores qualificados** → sem prospeto | [L] |
| Art. 1.º(4)(b) | Oferta a **menos de 150 pessoas singulares ou coletivas por Estado-Membro**, excluindo qualificados | [L] |
| Art. 1.º(4)(c)/(d) | Valor nominal unitário **≥ €100.000**, ou **≥ €100.000 por investidor** | [L] |
| Abaixo do limiar | Os Estados-Membros podem exigir **informação nacional** proporcional. Não se verificou se a CMVM exige documento informativo para ofertas abaixo de €12M | [NV] |

- **"Investidor qualificado" ≠ "HNWI" [L]** [S82]: o qualificado é o **cliente profissional** da MiFID (Anexo II). Uma pessoa rica só o é **a pedido**, se cumprir **dois de três** critérios:
  - 10 transações significativas por trimestre;
  - carteira **> €500.000**;
  - ≥1 ano no setor financeiro.

  A Sprout deve documentar esta avaliação, não presumi-la.

### 2.5 PRIIPs (Reg. 1286/2014)

- O regulamento abrange produtos cujo montante reembolsável varia com valores de referência ou com o desempenho de ativos **"que não são diretamente adquiridos pelo investidor de retalho"**. Ativos detidos diretamente ficam fora [F] [S23].
- **Implicação [I]:**
  - notes ou empréstimos com retorno ligado ao preço do azeite, vendidos a retalho → **KID obrigatório**;
  - propriedade direta do lote pelo investidor → em princípio fora dos PRIIPs, mas com os problemas fiscais e de OIC descritos em 2.2 e 8.6.

### 2.6 Reserva bancária: receção de depósitos ou outros fundos reembolsáveis

- **UE [F]** [S25]: o art. 9.º da CRD proíbe a quem não é instituição de crédito a atividade de receber do público depósitos ou outros fundos reembolsáveis. Segundo a EBA, a proibição só releva se for exercida **como atividade** e **junto do público**. O art. 4.º(1)(1) do CRR define instituição de crédito [L].
- **PT [F/L]** [S26, S27]:
  - RGICSF, **art. 8.º**: exclusividade das instituições de crédito;
  - **art. 9.º**: exclui do conceito de fundos reembolsáveis os obtidos por **emissão de obrigações nos termos e limites do Código das Sociedades Comerciais**;
  - **art. 200.º**: crime de **atividade ilícita de receção de depósitos e outros fundos reembolsáveis**.

  Redação atual a confirmar no consolidado de 21-01-2026 [NV].
- **Implicação [I]:** "entregue-nos €X; devolvemos €X + 10–15% em 18 meses; se correr mal, fazemos *refunding*" é, na substância, **captação de fundos reembolsáveis**. O caminho legal é **emitir obrigações** (SA/SPV) ou passar por plataforma ECSP ou FIA, nunca "contratos de participação" atípicos.

---

## 3. Portugal: supervisores, diplomas e alertas

| Tema | Diploma / entidade | Ponto-chave | Etiqueta |
|---|---|---|---|
| Valores mobiliários e ofertas | **CVM** (DL 486/99), revisto pelo **DL 171/2026** (em vigor desde 1-09-2026, com efeitos faseados em 2028 e 2030) | Limiar de €12M; transpõe o *Listing Act* e a Dir. 2024/790 (MiFID) | [F] [S1–S5] |
| Qualidade da informação | CVM, art. 7.º | A informação tem de ser completa, verdadeira, atual, clara, objetiva e lícita | [L] |
| Gestão de ativos | **RGA, DL 27/2023** (desde 28/29-05-2023) + **Reg. CMVM 7/2023** | Gestor de pequena dimensão: €75k de capital; categoria residual "outros OIA" para ativos não financeiros | [F] [S28, S81] |
| Titularização | **DL 453/99**, alterado pelo **DL 77/2026** (12-03-2026, em vigor na publicação) | Clarifica que as operações *sem tranches* ou de *tranche única* cabem no conceito nacional; STC/FTC sob supervisão da CMVM; regime de **créditos** (não de mercadorias) | [F] [S64] |
| Pagamentos e moeda eletrónica | **RJSPME, DL 91/2018** (transpõe a DSP2) | Licença BdP para serviços de pagamento; exclusões no art. 5.º (redes restritas na al. k), agente comercial noutra alínea) | [F] [S31]; alínea do agente comercial [NV] |
| Banca | **RGICSF, DL 298/92** | Arts. 8.º, 9.º e 200.º (ver 2.6) | [F/L] [S26, S27] |
| *Crowdfunding* | **Lei 102/2015**, alterada pelo DL 66/2023 | Capital e empréstimo → ECSP/CMVM; donativo e recompensa → regime nacional | [F] [S14, S15] |
| Influenciadores | CMVM, comunicação de 3/2025; Circular Anual de Intermediação 2025 | A angariação e a publicidade de serviços de investimento estão reservadas a intermediários e agentes vinculados; um *disclaimer* não chega; a CMVM vai reforçar a fiscalização | [F] [S52, S53] |
| Alertas | CMVM | **Cimovelpark** (alerta de 4-09-2020): "investimento em aluguer de estacionamentos" com rentabilidade, por entidade não autorizada. Segundo a imprensa, a CMVM emitiu cerca de 100 alertas desde 2020 | [F] [S61, S53] |

- **Alertas sobre ativos tangíveis:** não se encontrou nenhum alerta CMVM ou BdP **dedicado a vinho, arte ou mercadorias** [NV]. O padrão de alerta da CMVM é o caso Cimovelpark: ativo físico, promessa de rentabilidade e entidade não autorizada. É exatamente o perfil de risco do produto Sprout se mal desenhado [I].

---

## 4. Pagamentos

### 4.1 Quando é preciso licença

- **Receber dinheiro do comprador ou investidor por conta do produtor** e reenviá-lo é **envio de fundos** ou **aquisição de operações de pagamento** (DSP2, Anexo I). Exige **licença de instituição de pagamento ou de moeda eletrónica**, ou atuar como **agente** de uma IP/IME [L] [S32].
- **Capital inicial [L]** [S32]:
  - IP para envio de fundos: **€20.000**;
  - outros serviços: **€125.000**;
  - IME: **€350.000** (DME2).
- **Prazo legal de decisão:** 3 meses após processo completo [L].
- **Prazo realista no BdP:** 9–18 meses [E].

### 4.2 Exclusão do agente comercial (DSP2, art. 3.º(b))

- A DSP2 exclui as operações feitas através de agente comercial autorizado a negociar ou concluir a venda **apenas em nome do ordenante ou apenas do beneficiário** [F] [S35, S36].
- **EBA, Q&A 2020_5354/5355 [F]** [S33]: uma plataforma de *e-commerce* que recebe pagamentos para o beneficiário **não está excluída por defeito**. Liquidar a dívida do pagador não basta para a exclusão.
- **Parecer EBA de 23-06-2022 [F]** [S34]: recomenda clarificar "agente" e "negociar ou concluir". Reconhece que um estreitamento afetará as plataformas que detêm ou controlam fundos.
- **PSR (texto acordado) [F]** [S35, S36]:
  - exige que o acordo dê **margem real para negociar ou concluir**;
  - limita a exclusão a **um só lado**;
  - prevê orientações EBA no prazo de um ano.
- **Conclusão [I]:** um marketplace que cobra ao comprador e paga ao produtor **não deve confiar na exclusão**. Deve usar o produto *marketplace* de um PSP licenciado na UE, com carteiras segregadas por utilizador, KYC/KYB pelo PSP e o Sprout como prestador técnico. A alternativa é tornar-se agente de uma IP.

### 4.3 Salvaguarda (DSP2, art. 10.º) [L] [S32]

- Os fundos de utilizadores não podem misturar-se com fundos próprios. Têm de ser:
  - depositados em conta separada numa instituição de crédito, ou investidos em ativos seguros e líquidos; ou
  - cobertos por seguro ou garantia.
- O documento-fonte pede "segregação diária + reconciliação diária". Está alinhado, mas **a segregação é do PSP**, não de uma conta do Sprout [I].

### 4.4 DSP3 / PSR: estado a 13-10-2026 [F] [S37–S40]

| Etapa | Data / estado |
|---|---|
| Acordo político Conselho–PE | **27-11-2025** |
| COREPER aprova; textos finais publicados | **22-04-2026** e **23-04-2026** |
| Aprovação na comissão ECON | **5-05-2026** |
| Publicação no JO | **Não confirmada.** Fontes de 10-2026 apontam para o fim de 2026 [NV] |
| Aplicação | Cerca de **21 meses** após a entrada em vigor (VoP do PSR: cerca de 27 meses), ou seja, ~2028 [F/E] |

### 4.5 Pagamentos imediatos e VoP (Reg. (UE) 2024/886) [F] [S41]

- PSP da zona euro:
  - receber transferências imediatas desde **9-01-2025**;
  - enviar transferências imediatas e oferecer **Verificação do Beneficiário (VoP)** desde **9-10-2025**.
- A VoP abrange **todas** as transferências a crédito, imediatas ou não.
- **Implicação [I]:** use VoP e IBAN verificado no *onboarding* de produtores, para reduzir fraude por troca de IBAN. Pagamentos imediatos permitem cumprir SLA diários.

### 4.6 Numerário em Portugal [F] [S42]

- **LGT, art. 63.º-E** (aditado pela Lei 92/2017, em vigor desde 23-08-2017):
  - proíbe pagar ou receber em numerário valores **≥ €3.000**, em qualquer transação;
  - o limite é **€10.000** para não residentes que não atuem como empresários;
  - pagamentos fracionados agregam-se;
  - faturas **≥ €1.000** de sujeitos passivos com contabilidade organizada pagam-se por meio que identifique o destinatário;
  - coima: €180–€4.500 (RGIT, art. 129.º(3)).
- **AMLR, art. 80.º:** teto UE de **€10.000** a partir de 10-07-2027. Os Estados-Membros podem fixar valores inferiores, e Portugal mantém €3.000 [F/L] [S43].
- **Política Sprout [I]:** **zero numerário.** É coerente com a "proibição de cash-in-transit" do documento-fonte.

---

## 5. Branqueamento de capitais e sanções

- **PT: Lei 83/2017** (BC/FT):
  - IP, IME, ECSP, empresas de investimento e gestoras são entidades obrigadas [L];
  - violar o limite de numerário é contraordenação especialmente grave (arts. 10.º e 169.º-A, segundo a ASAE) [F] [pesquisa];
  - limiar para comerciantes de bens em numerário [NV].
- **UE, pacote AML:**
  - **AMLR (Reg. 2024/1624)** aplica-se desde **10-07-2027**, diretamente (futebol: 2029) [F] [S43];
  - **AMLA** (Frankfurt) opera desde 1-07-2025 e passa a supervisionar diretamente cerca de 40 grupos de alto risco a partir de **2028** [F] [S43];
  - as normas de nível 2 ainda estavam em preparação em 08-2026 [F] [S43].
- **Estatuto do Sprout [I]:**
  - o **marketplace B2B sem fundos de terceiros e sem numerário não é, em regra, entidade obrigada**;
  - **passa a sê-lo** se tiver licença IP/IME/ECSP ou se gerir um FIA;
  - mesmo não obrigado, o PSP, os bancos e os investidores vão exigir KYC/KYB e prova de origem de fundos de nível Lei 83/2017.
- **RCBE (Lei 89/2017):**
  - alterações comunicadas em **30 dias**;
  - coimas de **€1.000 a €50.000**;
  - existência e prazo de confirmação anual [NV] [S46].
  - **TJUE C-37/20 e C-601/20 (22-11-2022)** invalidou o acesso generalizado do público à informação sobre beneficiários efetivos [L].
- **Sanções: Lei 97/2017** (medidas restritivas ONU/UE) [F] [S45]:
  - as entidades financeiras precisam de mecanismos "permanentes, rápidos e seguros" de deteção e bloqueio;
  - instrumento do BdP: **Aviso 1/2022**, que substituiu o Aviso 2/2018.
  - O Sprout deve fazer *screening* de produtores, compradores, investidores e beneficiários efetivos contra as listas UE e ONU em cada *onboarding* e diariamente [I].
- **Lista UE de países terceiros de alto risco [F]** [S44]:
  - **Reg. Del. 2025/1184**: retirou EAU, Gibraltar, Panamá e outros (efeitos a 5-08-2025);
  - **2025/1393**: acrescentou a Rússia;
  - **2026/46 e 2026/83**: acrescentaram **Bolívia e Ilhas Virgens Britânicas** (lista com 26 países desde 29-01-2026).

  Isto é relevante para o eixo "jurisdição *crypto-friendly*" (secção 7).

---

## 6. Marketing e distribuição

- **MiFID II, art. 24.º(3)** [L] [S20]:
  - toda a informação, incluindo comunicações publicitárias, tem de ser **correta, clara e não enganosa**;
  - as comunicações publicitárias têm de ser **claramente identificáveis** como tal;
  - concretizado no **art. 44.º do Reg. Del. 2017/565**: desempenho passado, simulações e cenários futuros, apresentação equilibrada de riscos.
- **Fundos: Reg. 2019/1156** (distribuição transfronteiriça) + **Orientações ESMA34-45-1272** (aplicáveis desde **2-02-2022**) [F] [S47]:
  - identificação como comunicação publicitária;
  - riscos e benefícios com igual destaque;
  - informação correta, clara e não enganosa, incluindo *online*.
- **Supervisão ESMA [F]** [S48]: a **CSA 2023 + *mystery shopping*** (relatório de 27-05-2024) concluiu que a conformidade é globalmente aceitável, mas com lacunas:
  - identificação clara da publicidade;
  - equilíbrio risco/benefício;
  - alegações de sustentabilidade sem prova.
- **Gamificação e práticas de envolvimento digital:**
  - ESMA, Discussion Paper ESMA35-43-3682 (12-2023): gamificação, *nudging*, notificações *push*, *dark patterns*, finfluenciadores [F] [S49];
  - as orientações de *product governance* (03-2023) já pedem que se avalie se a gamificação serve o mercado-alvo [F] [S49];
  - posição final ESMA após o DP [NV].
  - **IOSCO** publicou em **19-05-2025** três relatórios finais (finfluenciadores, *trading* imitativo, práticas de envolvimento digital e gamificação), em formato de boas práticas [F] [S50].
- **Finfluenciadores:** ver a ficha PT da ESMA (01-2026) e a comunicação CMVM (03-2025) [F] [S51, S52]:
  - recomendação personalizada = consultoria (serviço autorizado);
  - aplica-se o MAR (abuso de mercado);
  - *disclaimer* não basta.
- **Estratégia de Investimento de Retalho (RIS)** [F] [S54]:
  - acordo político a **18-12-2025**;
  - texto técnico endossado pelo Conselho em **06-2026** (votação a 5-06, segundo o BNP);
  - **plenário do PE pendente**, indicativamente 09-2026 e não confirmado [NV];
  - aplicação estimada em ~2029 [E];
  - conteúdo: diretiva *omnibus* (MiFID, UCITS, AIFMD, IDD) + alteração aos PRIIPs; **value for money**; regras reforçadas de comunicações e práticas de marketing.
- ***Reverse solicitation* (MiFID II, art. 42.º)** [F] [S55]:
  - só vale para iniciativa **exclusiva** do cliente;
  - *disclaimers* e caixas "I agree" não valem;
  - qualquer promoção por pessoa que atue pela entidade desqualifica a exceção;
  - não permite comercializar depois outras categorias de produtos.
- **Consumo e jogo [L/I]:**
  - práticas comerciais desleais: DL 57/2008 (B2C);
  - cláusulas contratuais gerais: DL 446/85 (extensões unilaterais podem ser abusivas);
  - mecânicas com prémio aleatório associado a apostas em dinheiro podem cair no **regime do jogo** (RJO, DL 66/2015; SRIJ) [L].

**Proibido para o Sprout (direto e sem rodeios)**
1. Promover junto de retalho ("jogadores") lotes com "retorno de 10–15%", "capital protegido" ou "refunding", sem a via ECSP, prospeto ou intermediário autorizado.
2. Rankings de rentabilidade, *streaks*, *badges* associados a investimento, notificações de "oportunidade a expirar", confetti em retornos.
3. Finfluenciadores pagos para falar do produto de investimento.
4. Usar "investidor qualificado" como etiqueta de marketing, sem a avaliação do Anexo II.
5. Contar com *reverse solicitation* para investidores fora de Portugal.

---

## 7. Jurisdição da OpCo e da SPV

### 7.1 Comparação

| Critério | **Portugal** | **Luxemburgo** | **Irlanda** | **Não-UE "crypto-friendly"** (ex.: EAU, BVI) |
|---|---|---|---|---|
| Veículo-tipo | SA emitente de obrigações (CSC); **STC/FTC** (DL 453/99, alterado pelo DL 77/2026), mas só para **créditos** | **Veículo de titularização** (Lei de 22-03-2004, alterada em 2022, em vigor desde 8-03-2022): compartimentos; risco de quaisquer ativos [F/L] [S62] | **Sec. 110 TCA 1997**: ativos qualificados incluem *commodities*; mínimo de **€10M** de ativos na primeira aquisição [F] [S63] | *Offshore* SPV / emissor de *tokens* |
| Licença | SA: nenhuma, se a colocação for privada; STC: autorização CMVM | Só precisa de autorização CSSF se emitir **ao público** e **de forma contínua**: público = não profissionais + denominação < €100k + sem colocação privada; contínuo = **> 3 emissões por exercício** [F] [S62] | Notificação à Revenue; sem licença para colocação privada | Licença local (por ex., VARA). **Sem passaporte UE**; MiCA (ART) se oferecer *tokens* na UE [F/L] [S67] |
| Investidores possíveis | Qualificados / ≥€100k / <150 por Estado-Membro; retalho com prospeto ou abaixo de €12M e intermediário | Profissionais ou colocação privada sem autorização; retalho exige autorização CSSF | Profissionais / colocação privada | **Na UE, os mesmos limites** (a lei aplica-se onde está o investidor) |
| Encaixe com *commodities* | Bom para OpCo e SA; STC não serve para stock físico, só para recebíveis | Muito bom (desenhado para risco de ativos diversos) [I] | Uma fonte diz que só valem *commodities* negociadas em **bolsa reconhecida**; o azeite não é [F/NV] [S63] | — |
| Bancos e rails UE | Ótimo | Ótimo | Ótimo | **Risco elevado**: *de-risking*, diligência reforçada; as **BVI estão na lista UE de alto risco desde 29-01-2026** [F] [S44] |
| Repatriação de fundos | Nula | Nula | Nula | **Alta**: "dinheiro preso", origem de fundos, VoP e IBAN de PSP fora da UE [I] |
| Custo de constituição | €15–40k [E] | €40–100k; €15–30k por compartimento em plataformas multi-emissão [E/NV] | €40–80k [E] | Baixo no arranque, alto no custo bancário e reputacional [E] |
| Custo anual | €10–30k [E] | €40–80k [E] | €40–80k [E] | — |
| Prazo | 1–2 meses [E] | 2–4 meses [E] | 2–3 meses [E] | 1–2 meses, mas meses ou anos para conseguir banco UE [E] |

### 7.2 Notas de estrutura

- **Securitisation Regulation (2017/2402):**
  - só há "titularização" UE se houver **tranching** do risco de crédito;
  - notas de *tranche* única ficam fora [L];
  - se houver *tranches* e venda a retalho, o art. 3.º exige **teste de adequação**, e para carteiras ≤ €500k impõe máximo de **10%** e mínimo de **€10.000** [F] [S65].
- **Notas de *trade finance***: obrigações ou notas de curto prazo de uma SA/SPV, garantidas por penhor de stock (*warehouse receipts*) e cessão de recebíveis de compradores B2B. É o instrumento mais limpo para "financiar lotes a 18 meses" [I].
- **Fundo (RAIF/QIAIF/OIA PT):**
  - RAIF sem aprovação de produto pela CSSF; capital mínimo de **€1,25M** [F] [S66];
  - mínimo por investidor *well-informed* de €100k [NV];
  - só faz sentido com AIFM terceiro e escala > €10–20M [I].

---

## 8. Direito alimentar, comercial e fiscal que toca o produto

### 8.1 Azeite

- **Reg. 1308/2013, Anexo VII, Parte VIII:** categorias [L].
- **Reg. Del. (UE) 2022/2104** (normas de comercialização; consolidado com 2024/1401) [F] [S69]:
  - categorias e misturas;
  - embalagem e rotulagem;
  - origem;
  - n.º da embaladora;
  - menções facultativas e ano de colheita;
  - revoga o Reg. 2568/91.
- **Reg. Exec. (UE) 2022/2105**: controlos de conformidade e métodos de análise [F] [S69].
- **Implicação [I]:** cada lote precisa de **análise físico-química + painel organolético** antes de ser listado. Um lote "virgem extra" que desce a "virgem" muda o preço em dezenas de pontos percentuais. É risco de base que tem de entrar no *pricing* e no contrato com o investidor.

### 8.2 Água

- **Diretiva 2009/54/CE**, transposta por **DL 156/98** e **DL 72/2004** [F] [S70].
- Só águas minerais naturais **reconhecidas** (lista da DGEG), engarrafadas na origem [F] [S70].
- **Implicação [I]:** não há "lotes" de água a granel para financiar. O produto é água engarrafada de engarrafadores licenciados. O financiamento por investidores faz pouco sentido (baixo valor por volume, IVA a 13%, ver 8.6). A água deve ficar **só no marketplace B2B**.

### 8.3 Café

- **EUDR (Reg. 2023/1115)**, adiado pelo **Reg. 2025/2650**, aplica-se a partir de **30-12-2026** (grandes e médios operadores) e **30-06-2027** (micro e pequenos) [F] [S72].
- Exige declaração de diligência devida, com geolocalização das parcelas.
- O café **solúvel** foi acrescentado por ato delegado de 13-07-2026, com efeitos a 30-12-2027. Fonte única (ECF) [NV].
- **Implicação [I]:** **adiar o café** para depois do piloto. Em alternativa, comprar só a importadores que assumam o papel de "operador" EUDR.

### 8.4 Rastreabilidade

- **Reg. 178/2002, art. 18.º**: princípio "um passo atrás, um passo à frente". É preciso identificar o fornecedor e o cliente empresarial imediatos e fornecer a informação às autoridades a pedido [F] [S71].
- O "*lot tracking*" do produto deve ser desenhado para servir de **registo legal**, não só de UX [I].

### 8.5 Contratos

- **Código Civil, art. 790.º** [F] [S73]:
  - a impossibilidade **objetiva, definitiva e não imputável** extingue a obrigação;
  - uma dificuldade financeira não é impossibilidade.
- **Art. 437.º** (alteração anormal das circunstâncias) [F] [S73]:
  - permite resolver ou modificar o contrato, mas só fora dos **"riscos próprios do contrato"**;
  - o STJ (2025) recusou aplicá-lo a um risco inerente ao negócio.
  - **Implicação [I]:** a **volatilidade de preços é risco próprio** de contratos de mercadorias. Não conte com o art. 437.º. É preciso uma cláusula de força maior explícita (quebra de colheita, interdição sanitária, ...) e um mecanismo contratual de ajuste de preço e entrega.
- **Incoterms® 2020 (ICC)** [L] [S87]:
  - definem risco, custos e entrega, mas **não transferem a propriedade** (essa questão vai para o contrato e a reserva de propriedade);
  - no mercado nacional, usar FCA ou DAP [I].
- **Prazos de pagamento [F]** [S74, S75]:
  - **DL 76/2021** (transpõe a Dir. 2019/633; altera o regime PIRC, DL 166/2013; vigência a confirmar entre 1-11-2021 e 1-11-2022 [NV]) proíbe prazos superiores a **30 dias** (perecíveis) ou **60 dias** (restantes) quando o fornecedor fatura ≤ €350M;
  - fiscalização pela ASAE;
  - o azeite e o café (Anexo I do TFUE) estão abrangidos; a água engarrafada, provavelmente não [I];
  - **DL 62/2013** (atrasos de pagamento): juros de mora B2B à taxa BCE + 8 p.p. [F].

### 8.6 Faturação e IVA (Portugal continental)

**Faturação**
- Software certificado pela AT (**Portaria 363/2010**) [L].
- **ATCUD** obrigatório desde **1-01-2023**, com comunicação prévia de séries [F] [S76].
- **QR code** (Portaria 195/2020) [F] [S76].
- **SAF-T(PT)** mensal até ao dia 5 [F/NV] [S76]. O SAF-T da contabilidade passa para 2028 (exercício de 2027) [F] [S76].
- **PDF aceite como fatura eletrónica até 31-12-2026** (OE 2026, Lei 73-A/2025, art. 95.º). **Desde 1-01-2027** é preciso **assinatura ou selo eletrónico qualificado** [F] [S76].
- **ViDA (Dir. 2025/516)**: faturação eletrónica estruturada (EN 16931) obrigatória no **B2B intracomunitário a partir de 1-07-2030** [F] [S77].

**IVA [F/I] [S78]**

| Produto | Taxa | Base |
|---|---|---|
| Azeite | **6%** (Lista I; verba 1.5.1 segundo informação vinculativa da AT) | [F] |
| Água mineral natural / de nascente / de mesa, sem outras substâncias | **13%** (Lista II, verba 1.11, segundo informação vinculativa n.º 10884) | [F]; algumas fontes comerciais dizem 6%, em conflito |
| Águas com outras substâncias | **23%** | [F] |
| Café (grão / moído / cápsulas) | **23%** (não consta das Listas I e II; os 13% de cafetaria são serviço de restauração) | [I], a confirmar por informação vinculativa |
| Comissão do marketplace | **23%** | [L] |

- **Implicação fiscal crítica [I]:** se o investidor **adquirir a propriedade do lote**, cada transmissão de bens é tributada (6–23%). O investidor particular não deduz IVA, o que destrói o *spread* de 10–15%. Financiar por **dívida** (operação financeira isenta, CIVA art. 9.º, n.º 27 [L]) evita esta fuga de IVA.

---

## 9. Precedentes e lições

| Caso | Facto | Lição |
|---|---|---|
| **Fórum Filatélico & Afinsa** (Espanha) | Intervenção a **9-05-2006**; cerca de **460.000** clientes; buraco acima de **€4,6 mil milhões**, segundo a LegalToday (um trabalho académico estima €3,5 mil milhões e mais de 400.000 investidores). **Afinsa**: a Audiencia Nacional condenou 11 dirigentes, com penas até **12 anos** (07-2016). **Fórum**: a AN condenou 20 de 27 arguidos (07-2018); o **Supremo confirmou a burla piramidal** (03-2020), com penas até 11 anos e 10 meses e multa de €49,7M ao ex-presidente. O Estado não foi responsabilizado (TS, 12-2010). Resposta legislativa: **Ley 43/2007**, que obriga a **garantia individualizada** (seguro-caução ou garantia bancária) em vendas de bens com oferta de restituição do preço [F] [S56] | Ativo "tangível" + **recompra ou retorno prometido** + pagamento de retornos com dinheiro novo = esquema de investimento disfarçado. A ausência de regulação à data **não protegeu** os gestores: houve responsabilidade penal e o legislador fechou a lacuna |
| **Asset Land** (UK, **[2016] UKSC 17**) | Terrenos vendidos em lotes individuais: os investidores eram **proprietários** das parcelas, mas o Supremo declarou o esquema **organismo de investimento coletivo** não autorizado, porque o operador controlava o conjunto [F] [S57] | Propriedade individual do lote **não afasta** a qualificação como OIC se o operador gere o todo |
| **Capital Alternatives** (UK) | Esquemas de **colheitas de arroz** (Serra Leoa) e créditos de carbono considerados OIC (High Court 2014; CoA 2015; restituição de **£16,9M → £18,7M** em 2018) [F] [S58] | Precedente **agrícola** direto: "financie a colheita e receba a margem" = OIC |
| **Park First** (UK) | Lugares de estacionamento em aeroportos: a FCA concluiu que eram OIC (2017); ação judicial em 10-2019; cerca de **4.600** investidores e **£230M**; acordos de compensação [F] [S59] | Ativo físico + rendimento prometido + operador central = OIC |
| **Barris de whisky** (UK) | Não regulados pela FCA (sem FSCS); a City of London Police registou **89** casos e **> £3M** de perdas em 2023; a ASA agiu contra a Capgroup (ex-London Cask Company) por alegações enganosas (07-2026) [F] [S60] | Mesmo "não regulado" atrai polícia, publicidade (ASA) e dano reputacional |
| **Cimovelpark** (PT) | Alerta CMVM (09-2020): estacionamentos com rentabilidade prometida, entidade não autorizada [F] [S61] | Em Portugal, o padrão de alerta é este. O Sprout seria lido pelo mesmo prisma |

**Lição única [I]:** **lote físico + operador que gere, armazena e revende + retorno prometido ao investidor = investimento coletivo** (ou captação de fundos reembolsáveis), independentemente do rótulo "compra de mercadoria". A "palpabilidade" do ativo é argumento comercial, não defesa jurídica.

---

## 10. Árvore de decisão

```
P1. O dinheiro entra para COMPRAR mercadoria que o próprio pagador usa ou revende no seu negócio,
    com entrega física (ou título representativo exercível)?
 ├─ SIM → A. MARKETPLACE B2B PURO (comércio)
 │        • Rails: PSP/IME da UE (produto marketplace); Sprout = prestador técnico/agente comercial*
 │        • Licenças: nenhuma financeira (*não contar com a exclusão do agente comercial se cobrar a ambos os lados)
 │        • Regras: UTP (≤30/60 d ao produtor), faturação AT, IVA, rastreabilidade, sanções
 │        • Público: empresas (compradores e produtores). Investidores: nenhum
 └─ NÃO (o pagador quer RETORNO financeiro) → P2
P2. O retorno está prometido/fixo e o capital é "reembolsável" (incl. "refunding")?
 ├─ SIM e SEM ser via obrigações/ECSP/FIA → ✖ PROIBIDO (reserva bancária: RGICSF arts. 8.º/9.º; crime art. 200.º)
 └─ via OBRIGAÇÕES/NOTES (dívida) → P3
P3. Quem são os investidores?
 ├─ Só QUALIFICADOS, ou ticket ≥ €100k, ou <150 não-qualificados por Estado-Membro
 │     → C. SPV NOTES / PRIVATE PLACEMENT
 │        • Sem prospeto (art. 1.º(4)(a)/(b)/(c)/(d)); sem KID (não-retalho)
 │        • Colocação: emitente vende diretamente OU intermediário autorizado (o Sprout não pode "colocar" sem licença MiFID)
 │        • AIF? Não, se a SPV/OpCo for empresa comercial real; risco se for veículo passivo com mutualização
 │        • Custo [E] €15–40k; prazo [E] 1–2 meses (PT SA). Escala: Lux SV
 ├─ RETALHO até €5M/12m por promotor
 │     → D. PARCERIA COM PLATAFORMA ECSP (ex.: Raize — confirmar)
 │        • Licença: do parceiro (CMVM); Sprout = promotor
 │        • Proteções: teste de conhecimentos, simulação de perdas, aviso >max(€1k; 5% PL), 4 dias de reflexão, KIIS
 │        • Custo: comissões da plataforma [NV]; prazo [E] 2–4 meses
 └─ RETALHO > €5M ou oferta pública ampla
       → Oferta pública com intermediário autorizado + prospeto (>€12M) ou regime nacional (<€12M) + PRIIPs KID se aplicável
         [E] 6–12 meses; custo >€100k. NÃO recomendado na fase 1
P4. O retorno depende de um conjunto de lotes geridos discricionariamente pelo Sprout, com política de investimento e mutualização?
 └─ SIM → E. FIA (AIFMD/RGA) com AIFM autorizado (próprio: PT pequena dimensão €75k de capital; ou terceiro + RAIF/OIA)
          • Público: profissionais (e retalho só com regime específico); ELTIF vedado a mercadorias
          • Custo [E] €100–250k de setup; €80–200k/ano; prazo [E] 3–9 meses
P5. O investidor recebe só a diferença de preço em dinheiro (sem entrega)?
 └─ SIM → derivado sobre mercadorias (MiFID C(5)) → empresa de investimento + EMIR + PRIIPs → ✖ fora de alcance
P6. Tokenizar lotes numa jurisdição não-UE?
 └─ → MiCA (ART: autorização art. 16.º; isenção ≤€5M ou só qualificados) ou MiFID se for instrumento financeiro;
      banca UE com EDD; ✖ não recomendado
```

### 10.1 Tabela de estruturas

| Estrutura | Licenças / quem as detém | Público permitido | Limite | Custo inicial [E] | Prazo [E] | Veredicto piloto [I] |
|---|---|---|---|---|---|---|
| **A. Marketplace B2B puro** | Nenhuma (PSP licenciado faz os pagamentos) | Empresas | — | €5–20k (jurídico + integração PSP) | 1–3 meses | **Sim, já** |
| **B. Principal (Sprout compra e revende com capital próprio ou linhas bancárias)** | Nenhuma | Bancos / *factoring* / *confirming* | Balanço | Baixo | 1–3 meses | **Sim**, complemento de A |
| **C. SPV *notes* a qualificados / ≥€100k** | Nenhuma se for colocação privada direta do emitente; MiFID se o Sprout colocar por terceiros | Qualificados, ≥€100k/investidor, <150 por Estado-Membro | Sem teto legal fora das isenções | €15–40k (PT); €40–100k (Lux) | 1–2 (PT) / 2–4 (Lux) meses | **Sim**: o veículo de investimento do piloto |
| **D. Parceria ECSP** | Licença ECSP do parceiro (CMVM) | Sofisticados e não sofisticados | **€5M/12m** por promotor | Comissões [NV] + jurídico €10–20k | 2–4 meses | **Fase 2**, se houver procura de retalho |
| **E. FIA + AIFM** | AIFM (próprio ou terceiro) + CMVM/CSSF | Profissionais (retalho só com regime próprio) | Limiares AIFMD | €100–250k | 3–9 meses | **Não** para o piloto |
| **F. Licenças próprias (IP/ECSP/empresa de investimento)** | Sprout | Conforme licença | — | €150–500k + equipa de *compliance* | 9–18 meses | **Não** |
| **G. Venda direta a "jogadores" com retorno prometido** | — | — | — | — | — | **✖ Proibido** |

---

## 11. Implicações para o Sprout

1. **Separe juridicamente os dois negócios desde o dia zero.**
   - **Sprout Marketplace** (OpCo PT, B2B, receita por comissão ou spread);
   - **Sprout Capital** (SPV PT, SA, que emite obrigações).

   Nunca misture fundos de investidores com fluxos do marketplace. Um supervisor ou banco que veja os dois na mesma conta presume o pior.
2. **Corte o segmento "jogadores" no piloto.** Investidores só qualificados ou com ticket mínimo de **€100k**. Abaixo disso, só via plataforma ECSP de terceiros (fase 2) e com o teto de €5M/ano.
3. **Reescreva o produto como dívida, não como "compra de lote com promessa":**
   - obrigações com juro (fixo ou fixo + variável ligado à margem realizada), garantidas por penhor de stock e cessão de recebíveis;
   - maturidade até 18 meses;
   - **opção de extensão do emitente**, divulgada como risco;
   - **sem garantia de capital**;
   - "refunding" passa a ser uma **reserva de liquidez/contingência da SPV**, descrita como tal e nunca como "reembolso garantido".
4. **Pague aos produtores em 30/60 dias (UTP).** O prazo de 18 meses é do financiamento do inventário, não do produtor. Mostre ao produtor o pagamento rápido como vantagem comercial: é o melhor argumento de *sourcing*.
5. **Piloto = azeite (com investidores) + água (só marketplace).**
   - A água tem margem e valor unitário baixos, IVA a 13% e oferta só de engarrafadores licenciados.
   - **Adie o café** até ter capacidade EUDR (aplicável a 30-12-2026). Em alternativa, compre só a importadores que sejam "operadores" EUDR.
6. **Rails de pagamento:**
   - integre um PSP/IME da UE com produto marketplace (carteiras segregadas, KYC/KYB, VoP, pagamentos imediatos);
   - **o Sprout nunca recebe dinheiro de terceiros na sua conta**;
   - política de **zero numerário**.

   Assim desaparece a necessidade de licença BdP e o risco de "dinheiro preso".
7. **Jurisdição:**
   - piloto com **OpCo e SPV em Portugal**;
   - **Luxemburgo** (veículo de titularização por compartimentos) só quando houver investidores internacionais e mais de €5–10M;
   - **rejeite estruturas não-UE ou *crypto***: as BVI estão na lista UE de alto risco desde 01-2026, o MiCA/MiFID aplica-se na mesma aos investidores da UE e o risco de repatriação é real.
8. **Qualificação de investidores:** "HNWI" não chega. Implemente o teste do **Anexo II MiFID** (pedido escrito + 2 de 3 critérios, incl. carteira > €500k) ou o ticket mínimo de €100k. Guarde a evidência.
9. **Marketing:**
   - um único *deck* para qualificados, rotulado "comunicação publicitária", com riscos e benefícios com o mesmo destaque, cenários adversos (quebra de colheita, desclassificação do azeite, preço −30%) e sem "garantido";
   - nada em redes sociais sobre o produto de investimento;
   - sem finfluenciadores;
   - os *roadshows* são privados e com lista fechada.
10. **UX:** mantenha a diretriz aprovada e torne-a regra de produto, com revisão de *compliance* em cada *release*.
    - **Permitido:** painéis operacionais (colheita, stock, rastreabilidade, *badges* de *compliance* dos produtores).
    - **Proibido:** gamificação de retornos, rankings, notificações de urgência.
11. **Contratos:**
    - força maior explícita e lista fechada (o art. 437.º não cobre a volatilidade);
    - Incoterms 2020 (FCA/DAP) + cláusula de transmissão de propriedade;
    - especificação do lote por **análise e painel** (Reg. 2022/2104/2105) com tolerâncias e ajuste de preço em caso de desclassificação.
12. **Fiscal:**
    - faturação certificada com ATCUD/QR;
    - **assinatura qualificada a partir de 1-01-2027**;
    - não ponha investidores particulares como proprietários de lotes (fuga de IVA). Dívida = operação financeira isenta.
13. **AML e sanções**, mesmo sem ser entidade obrigada:
    - KYC/KYB de nível Lei 83/2017;
    - *screening* diário UE/ONU (Lei 97/2017);
    - RCBE em ordem.

    Prepare-se para o AMLR (10-07-2027) se avançar para ECSP ou licenças.
14. **Antes do primeiro euro de investidor**, obtenha um **parecer jurídico escrito**, com o *term sheet* final, sobre:
    1. FIA vs. empresa comercial (ESMA/2013/611);
    2. RGICSF, arts. 8.º/9.º (exceção das obrigações);
    3. MiFID C(1)/C(5);
    4. isenção de prospeto aplicável;
    5. quem pode colocar as obrigações.

    É a "nota de 2 páginas" do Gonçalo, mas com estas cinco perguntas.
15. **Calendário realista [E]:**
    - marketplace B2B em 1–3 meses;
    - primeira emissão da SPV para qualificados em 2–3 meses;
    - parceria ECSP em 3–6 meses;
    - FIA em 6–9 meses;
    - licenças próprias em 9–18 meses.

    "Monetizar em 12 horas" só é possível do lado B2B, nunca do lado investidor.

---

## 12. Itens não verificados / a confirmar com advogado

- Redação exata do novo **art. 109.º(4) CVM** (DL 171/2026); data de produção de efeitos dessa norma (1-09-2026, inferida do consolidado); se a CMVM exige documento informativo abaixo de €12M.
- **Publicação no JO da DSP3/PSR** (não confirmada a 13-10-2026).
- **Votação final da RIS** no plenário do PE (não confirmada).
- **Transposição da AIFMD II** em Portugal após 28-05-2026.
- Redação atual dos **arts. 8.º, 9.º e 200.º do RGICSF**; alínea do RJSPME com a exclusão do agente comercial.
- Limiar de comerciantes em numerário na **Lei 83/2017**; prazo de confirmação anual do **RCBE**.
- Capital mínimo da **STC** (DL 453/99, após o DL 77/2026).
- Data da autorização ECSP da **Raize**; estado da **Goparity**.
- **IVA**: água a 13% (fontes comerciais dizem 6%; a informação vinculativa da AT diz 13%); café a 23% (inferido).
- **EUDR**: ato delegado sobre o café solúvel (13-07-2026), fonte única.
- **Sec. 110 (IE)**: se *commodities* não cotadas em bolsa são "ativos qualificados".
- **RAIF**: mínimo de €100k para investidor *well-informed* (alteração de 2023).
- Posição final da **ESMA** sobre gamificação/DEPs após o DP de 2023.
- Regime de **comunicação prévia** das plataformas de recompensa (Lei 102/2015).
- Todos os **custos e prazos [E]** são estimativas de mercado, não cotações.
- Capitais mínimos e prazos citados de memória **[L]** (DSP2 art. 7.º, ECSP arts. 11.º/12.º, AIFMD art. 9.º e similares): confirmar no texto oficial.

---

## Fontes (acesso a 13-10-2026)

- [S1] DL 171/2026 (DR, 1.ª série, n.º 165, 26-08-2026) — https://files.diariodarepublica.pt/1s/2026/08/16500/0001000051.pdf
- [S2] DR, Análise Jurídica do DL 171/2026 — https://diariodarepublica.pt/dr/analise-juridica/informacoes-gerais/decreto-lei/171-2026-1161839915
- [S3] CVM consolidado (DR) — https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/1999-34575175
- [S4] CMS, "Revision to the Portuguese Securities Code" — https://cms.law/en/prt/news-information/revision-to-the-portuguese-securities-code-capital-markets
- [S5] Cuatrecasas, "Alterações Código Valores Mobiliários" — https://www.cuatrecasas.com/pt/portugal/comercial-e-societario/art/alteracoes-codigo-valores-mobiliarios ; Jornal Económico — https://jornaleconomico.sapo.pt/noticias/portugal-alivia-regras-de-admissao-a-bolsa-e-transpoe-pacote-listing-act-da-ue-o-que-muda/ ; Idealista (guia, 29-08-2026) — https://www.idealista.pt/news/financas/economia/2026/08/29/77353-guia-pratico-sobre-as-novidades-do-codigo-de-valores-mobiliarios
- [S6] AMF, Listing Act — https://www.amf-france.org/en/news-publications/depth/listing-act
- [S7] Arthur Cox, Listing Act no JO — https://www.arthurcox.com/insights/listing-act-published-in-official-journal-update-on-changes-to-prospectus-and-market-abuse-regulations-debt-securities/ ; Mondaq/MFSA — https://www.mondaq.com/financial-services/1804666/mfsa-circular-on-amendments-to-the-prospectus-regulation-and-market-abuse-regulation-under-the-eu-listing-act
- [S8] Informador, CVM art. 109.º (versão de 2022, €8M) — https://informador.pt/legislacao/lexit/codigos/direito-comercial/codigo-dos-valores-mobiliarios/titulo-iii-ofertas-publicas/capitulo-i-disposicoes-comuns-5/seccao-i-principios-gerais-2/artigo-109-o-oferta-publica
- [S9] Reg. (UE) 2020/1503 (ECSP), EUR-Lex — https://eur-lex.europa.eu/eli/reg/2020/1503/oj/eng ; índice — https://lexaris.de/library/tableofcontents/2032668
- [S10] ESMA, Q&A ECSP (SPV, art. 3.º(6), art. 8.º) — https://www.esma.europa.eu/node/200683 ; cópia — https://www.dirittobancario.it/wp-content/uploads/2022/05/ESMA-QA-Crowdfunding-ECSPR.pdf
- [S11] act legal, "Crowdfunding services in light of ECSP Regulation" — https://actlegal.com/publications/crowdfunding-services-in-light-of-ecsp-regulation ; Enerfip — https://help.enerfip.eu/en/regulation/sophisticated
- [S12] Oxford Business Law Blog (ECSP) — https://blogs.law.ox.ac.uk/business-law-blog/blog/2020/08/regulation-european-crowdfunding-service-providers-business-close ; Jeantet — https://jeantet.fr/en/2020/11/new-european-framework-for-crowdfunding
- [S13] European Digital Finance Association, carta sobre o limiar ECSP — https://europeandigitalfinance.eu/letter-raising-ecsp-threshold/
- [S14] DL 66/2023 (DR) — https://files.diariodarepublica.pt/1s/2023/08/15300/0000200029.pdf ; Reg. CMVM 3/2025 — https://dre.tretas.org/dre/6145267/regulamento-da-cmvm-3-2025-de-17-de-abril
- [S15] Lei 102/2015 republicada (Lexpoint) — https://lexpoint.pt/Fileget.aspx?FileId=50645
- [S16] Iberian Lawyer, Abreu/Raize ECSP — https://iberianlawyer.com/?p=189959
- [S17] Bird & Bird, ECSPR conduct obligations — https://www.twobirds.com/en/insights/2021/germany/ecspr-ongoing-requirements-and-conduct-obligations-for-crowdfunding-services
- [S18] ESMA/2013/611, Guidelines on key concepts of the AIFMD — https://prod.finanssivalvonta.fi/contentassets/0a617ea0f9c74761a1aafdc551050be2/2013-611_guidelines_on_key_concepts_of_the_aifmd_-_en.pdf
- [S19] Diretiva 2011/61/UE (AIFMD) — https://eur-lex.europa.eu/eli/dir/2011/61/oj/eng
- [S20] Diretiva 2014/65/UE (MiFID II) — https://eur-lex.europa.eu/eli/dir/2014/65/oj/eng
- [S21] Reg. Del. (UE) 2017/565 — https://eur-lex.europa.eu/eli/reg_del/2017/565/oj/eng
- [S22] ESMA, Orientações C6/C7 (ESMA-70-156-869) — https://www.esma.europa.eu/sites/default/files/library/esma-70-156-869_guidelines_on_c6_c7_application_of_mifid_ii_annex_1_ro.pdf ; FSMA, circular 2019_17 — https://www.fsma.be/sites/default/files/legacy/content/EN/Circ/2019/fsma_2019_17-1_en.pdf
- [S23] Reg. (UE) 1286/2014 (PRIIPs) — https://eur-lex.europa.eu/eli/reg/2014/1286/oj/eng
- [S24] Reg. (UE) 2017/1129 (Prospetos) — https://eur-lex.europa.eu/eli/reg/2017/1129/oj/eng
- [S25] CRD, art. 9.º — https://www.legislation.gov.uk/eudr/2013/36/article/9/data.html ; EBA Q&A 2014_1626 — https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2014_1626 ; EBA Opinion on OFIs — https://www.eba.europa.eu/sites/default/files/documents/10180/2019769/b20f96ae-9339-4dea-8014-ae19de1c7f73/Opinion%20on%20OFIs%20%28EBA-Op-2017-13%29.pdf
- [S26] ROA, A. Saraiva Matias, "Regime Sancionatório em Direito Bancário" (2002) — https://portal.oa.pt/publicacoes/revista-da-ordem-dos-advogados/ano-2002/ano-62-vol-ii-abr-2002/temas-e-referencias/armindo-saraiva-matias-regime-sancionatorio-em-direito-bancario/
- [S27] RGICSF (vLex) — https://vlex.pt/vid/decreto-lei-n-298-1034385751
- [S28] Morais Leitão, Legal Alert RGA — https://www.mlgts.pt/xms/files/site_2018/Newsletters/2023/Asset_Management_Regime_-_Legal_Alert_ML_-EN-.pdf ; PLMJ — https://www.plmj.com/xms/files/07_Guias_e_Manuais/2023/Regime_da_Gestao_de_Ativos_230503.pdf ; Abreu — https://abreuadvogados.com/wp-content/uploads/2023/05/O-novo-regime-de-gestao-de-ativos-3.pdf
- [S29] CMS, AIFMD II Implementation — Portugal — https://cms.law/en/int/expert-guides/aifmd-ii-implementation-across-jurisdictions/Portugal
- [S30] Sérvulo, AIFMD II / UCITS VI — https://www.servulo.com/pt/investigacao-e-conhecimento/Novas-Regras-Europeias-sobre-OIC-a-AIFMD-II-UCITS-VI/8799/
- [S31] DL 91/2018 (RJSPME), Lexpoint — https://lexpoint.pt/conteudos/1082/84578/legislacao/decreto-lei-no-912018-dr-no-2172018-serie-i-de-12112018 ; Abreu, aviso BdP sobre redes restritas — https://abreuadvogados.com/wp-content/uploads/2023/03/Aviso-do-Banco-de-Portugal-regulamenta-a-exclusao-relativa-a-redes-restritas-2.pdf
- [S32] Diretiva (UE) 2015/2366 (DSP2) — https://eur-lex.europa.eu/eli/dir/2015/2366/oj/eng
- [S33] EBA Q&A 2020_5354 — https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2020_5354 ; 2020_5355 — https://eba.europa.eu/single-rule-book-qa/qna/view/publicId/2020_5355
- [S34] Sidley, "PSD3: what to expect based on the EBA opinion" — https://www.sidley.com/en/insights/newsupdates/2022/07/psd3-what-to-expect-based-on-the-european-banking-authority-opinion
- [S35] Vixio, "EU's PSR 'The Last Sweep' for Commercial Agent Exclusion" — https://www.vixio.com/insights/pc-eus-psr-last-sweep-commercial-agent-exclusion
- [S36] Addleshaw Goddard, PSD2 exclusions — https://www.addleshawgoddard.com/globalassets/insights/financial-regulation/in-the-know-payments-PSD2-exclusions.pdf ; Simmons & Simmons — https://www.simmons-simmons.com/en/publications/cmanzeyn1009cvch0q9u61uva/relevant-exclusions-under-the-psd3-psr
- [S37] Worldline (2026), PSD3/PSR timeline — https://worldline.com/en/home/main-navigation/resources/blogs/2026/the-scope-and-timeline-are-locked-in-for-psd3-and-psr-what-should-psps-know
- [S38] Norton Rose Fulbright, PSD3 e PSR — https://www.nortonrosefulbright.com/en/knowledge/publications/cedd39c6/psd3-and-psr-from-provisional-agreement-to-2026-readiness
- [S39] Adyen, PSD3 Explained (atualizado em 12-10-2026) — https://www.adyen.com/knowledge-hub/psd3
- [S40] Open Banking Tracker, PSD3/PSR readiness — https://www.openbankingtracker.com/guides/psd3-psr-readiness
- [S41] Bird & Bird, Instant Payments Regulation — https://twobirds.com/en/insights/2024/global/instant-payments-regulation ; MHC — https://mhc.ie/latest/insights/instant-payments-regulation-update ; Reg. 2024/886 — https://eur-lex.europa.eu/eli/reg/2024/886/oj/eng
- [S42] LGT, art. 63.º-E (Portal das Finanças) — https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/lgt/Pages/lgt63e.aspx ; OCC — https://www.occ.pt/noticias/pagamentos-em-numerario ; APCMC — https://apcmc.pt/legislacao/pagar-receber-numerario-permitido-apenas-ate-3-000/
- [S43] CSSF, AMLR/AMLD6/AMLA — https://www.cssf.lu/en/2024/06/the-new-aml-cft-regulation-the-sixth-aml-cft-directive-and-the-future-eu-aml-cft-supervisor/ ; DLA Piper — https://www.dlapiper.com/en/insights/publications/global-anti-corruption-perspective/new-eu-anti-money-laundering-rules-what-to-know ; Persona (08-2026) — https://withpersona.com/blog/what-is-amlr ; Reg. 2024/1624 — https://eur-lex.europa.eu/eli/reg/2024/1624/oj/eng
- [S44] Bird & Bird, lista UE de alto risco (2025) — https://www.twobirds.com/en/insights/2025/germany/eu-liste-der-lnder-und-gebiete-mit-hohem-risiko-fr-geldwsche-und-terrorismusfinanzierung-gendert ; (2026) — https://cm.twobirds.com/en/insights/2026/eu-list-of-highrisk-countries-and-jurisdictions-for-money-laundering-and-terrorism-financing-amended
- [S45] Lei 97/2017 (DR) — https://diariodarepublica.pt/dr/detalhe/lei/97-2017-108041476 ; BdP, boas práticas sobre medidas restritivas — https://www.bportugal.pt/sites/default/files/anexos/documentos-relacionados/boas_praticas_relativas_a_execucao_de_medidas_restritivas.pdf
- [S46] OCC, Guia prático RCBE — https://portal.occ.pt/sites/default/files/public/2023-11/Guia_Pratico_RCBEa.pdf ; CMS, novas regras sobre beneficiários efetivos — https://cms.law/pt/prt/news-information/novas-regras-sobre-beneficiarios-efetivos ; Doutor Finanças — https://www.doutorfinancas.pt/?p=51090
- [S47] ESMA, Guidelines on marketing communications (ESMA34-45-1272) — https://www.esma.europa.eu/document/guidelines-marketing-communications-under-regulation-cross-border-distribution-funds
- [S48] ESMA, relatório sobre os requisitos de marketing MiFID II (27-05-2024) — https://www.esma.europa.eu/press-news/esma-news/esma-reports-application-mifid-ii-marketing-requirements
- [S49] ESMA, Discussion Paper ESMA35-43-3682 — https://www.esma.europa.eu/sites/default/files/2023-12/ESMA35-43-3682_Discussion_Paper_on_MiFID_II_investor_protection_topics_linked_to_digitalisation.pdf
- [S50] IOSCO, Media Release (19-05-2025) — https://www.iosco.org/news/pdf/IOSCONEWS768.pdf
- [S51] ESMA, ficha Finfluencers (PT, 01-2026) — https://www.esma.europa.eu/sites/default/files/2026-01/PT_Portugal_pt_-_Finfluencers_factsheet.pdf
- [S52] DECO PROteste (14-03-2025) — https://www.deco.proteste.pt/investe/investimentos/mercados-moedas/noticias/2025/03/comecou-regulacao-finfluencers ; DN — https://www.dn.pt/economia/influenciadores-financeiros-também-podem-estar-sujeitos-às-regras-do-mercado-de-capitais ; Cuatrecasas, Circular Anual 2025 — https://www.cuatrecasas.com/pt/latam/financeiro/art/cmvm-publica-circular-anual-de-intermediacao-e-financiamento-2025-1
- [S53] Renascença (03-03-2025) — https://rr.pt/artigo/explicador-renascenca/2025/03/03/banco-de-portugal-vai-fiscalizar-influencers-financeiros-com-ia/415980/
- [S54] Matheson, RIS — https://www.matheson.com/insights/the-retail-investment-strategy-building-retail-investors-trust-in-capital-markets/ ; BNP Paribas, RIS guide — https://globalmarkets.cib.bnpparibas/the-retail-investment-strategy-guide/ ; Regulation Tomorrow (12-2025) — https://www.regulationtomorrow.com/2025/12/retail-investment-strategy-council-and-parliament-agree-on-package-to-empower-consumers-while-boosting-markets/ ; PE, Legislative Train — https://www.europarl.europa.eu/legislative-train/package-retail-investment-package/file-retail-investment-strategy
- [S55] ESMA, Statement on reverse solicitation (ESMA35-43-2509) — https://www.esma.europa.eu/sites/default/files/library/esma35-43-2509%5Fstatement%5Fon%5Freverse%5Fsolicitation.pdf
- [S56] LegalToday, Afinsa (2016) — https://www.legaltoday.com/actualidad-juridica/noticias-de-derecho/la-audiencia-nacional-condena-a-11-directivos-de-afinsa-con-penas-de-hasta-12-anos-de-prision-2016-07-28/ ; CGPJ/TS, Fórum Filatélico — https://www.poderjudicial.es/cgpj/es/Poder-Judicial/Tribunal-Supremo/Noticias-Judiciales/El-Tribunal-Supremo-confirma-la-estafa-piramidal-de-Forum-Filatelico-y-establece-penas-de-entre-seis-meses-y-once-anos-de-carcel-para-16-acusados ; LegalToday, TS 2020 — https://www.legaltoday.com/actualidad-juridica/noticias-de-derecho/el-ts-confirma-la-estafa-piramidal-de-forum-filatelico-y-establece-penas-de-entre-6-meses-y-11-anos-de-carcel-para-16-acusados-2020-03-06/ ; Última Hora, TS 2010 — https://www.ultimahora.es/noticias/nacional/2010/12/29/28965/el-tribunal-supremo-exime-al-estado-de-pagar-a-los-afectados-de-forum-y-afinsa.html ; Ley 43/2007 (BOE n.º 299, 14-12-2007; reprodução) — https://www.granada.org/inet/wordenanz.nsf/712f4d0bcb4a7b72c125788d002413aa/1340e9b59da1b556c1257d23003a98c7!OpenDocument ; Comillas (estudo académico) — https://repositorio.comillas.edu/rest/bitstreams/147915/retrieve
- [S57] UKSC, Asset Land Investment plc v FCA [2016] UKSC 17 — https://caselaw.nationalarchives.gov.uk/uksc/2016/17
- [S58] FCA, Capital Alternatives — https://www.fca.org.uk/news/press-releases/fca-wins-case-against-capital-alternatives ; RPC — https://www.rpclegal.com/thinking/financial-services-regulatory-and-risk/fca-success/
- [S59] FCA, Park First — https://www.fca.org.uk/news/news-stories/fca-action-respect-park-first-limited ; https://fca.org.uk/news/press-releases/conditional-resolution-proceedings-park-first-and-senior-management
- [S60] City of London Police (11-2023) — https://www.cityoflondon.police.uk/news/city-of-london/news/2023/november/dont-make-pour-decisions-that-leave-your-finances-on-the-rocks-city-of-london-police-urges-people-to-stay-vigilant-over-misleading-whisky-investment-ads/ ; ASA/Capgroup (07-2026) — https://whiskymonkeys.com/en/news/uk-watchdog-cracks-down-on-whisky-cask-investment-firm-over-misleading-claims
- [S61] Idealista, alerta CMVM Cimovelpark — https://www.idealista.pt/news/node/44491 ; ECO (21-09-2020) — https://eco.sapo.pt/2020/09/21/nem-na-crise-da-divida-soberana-houve-tanta-gente-a-tentar-enganar-investidores/
- [S62] CMS Luxemburgo, Securitisation Law changes — https://cms.law/en/lux/legal-updates/luxembourg-securitisation-law-new-changes-and-new-opportunities ; Norton Rose Fulbright — https://www.nortonrosefulbright.com/en/knowledge/publications/01f379c6/bill-amending-the-luxembourg-securitisation-law-adopted ; Mondaq (entrada em vigor) — https://www.mondaq.com/securities/1204788/entry-into-force-of-the-draft-law-7825-amending-the-2004-securitisation-law
- [S63] Revenue (IE), TDM Part 04-09-01 (10-2025) — https://www.revenue.ie/en/tax-professionals/tdm/income-tax-capital-gains-tax-corporation-tax/part-04/04-09-01-20251001115033.pdf ; Oireachtas — https://www.oireachtas.ie/en/debates/question/2022-02-09/58/
- [S64] DL 77/2026 (DR) — https://files.diariodarepublica.pt/1s/2026/03/05000/0000500007.pdf ; ECO (12-03-2026) — https://eco.sapo.pt/2026/03/12/novas-regras-de-titularizacao-de-creditos-bancarios-entram-em-vigor/
- [S65] ESMA ISR, SECR art. 3.º — https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/secr/article-3-selling-securitisations-retail
- [S66] CMS, The RAIF — https://cms.law/en/int/legal-updates/the-raif-luxembourg-s-new-unregulated-investment-vehicle
- [S67] ESMA ISR, MiCA art. 16.º — https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-16-authorisation
- [S68] Reg. ELTIF consolidado (ELTIF 2.0) — https://service.betterregulation.com/sites/default/files/Great%20Fund%20Insights_%20ELTIF%20Regulation_%20consolidated%20text%20including%20ELTIF%202.0.pdf
- [S69] Reg. Del. 2022/2104 — https://eur-lex.europa.eu/eli/reg_del/2022/2104/oj/eng ; índice — https://lexaris.eu/library/tableofcontents/2022015 ; Reg. Exec. 2022/2105 — https://eur-lex.europa.eu/eli/reg_impl/2022/2105/oj/eng ; AGRINFO — https://agrinfo.eu/book-of-reports/olive-oil-marketing-standards/pdf
- [S70] DGEG, Natural Mineral Water — https://www.dgeg.gov.pt/en/vertical-areas/geology/hydrogeological-resources/exploitation-of-natural-mineral-water/bottling/
- [S71] Reg. 178/2002 — https://eur-lex.europa.eu/eli/reg/2002/178/oj/eng ; Reg. Exec. 931/2011 — https://eur-lex.europa.eu/eli/reg_impl/2011/931/oj/eng
- [S72] HQTS, EUDR adiado — https://www.hqts.com/eudr-postponed/ ; ECF, EUDR — https://www.ecf-coffee.org/european-union-deforestation-regulation-eudr/
- [S73] Julgar, alteração anormal das circunstâncias — https://julgar.pt/wp-content/uploads/2020/07/20200725-JULGAR-A-alteração-anormal-das-circunstâncias-Sandra-R-Luís-1.pdf ; jurisprudência, art. 790.º — https://jurisprudencia.pt/acordao/198853/pdf ; STJ (art. 437.º) — https://jurisprudencia.pt/acordao/208981
- [S74] DL 76/2021 (GPP/PARCA) — https://sima.gpp.pt/images/Producao_e_Mercados/OrgProducao_CadeiaAlimentar/PARCA/DL_76_2021.pdf ; SRS Legal — https://www.srslegal.pt/xms/files/Arquivo/2022-06-16/Newsletter_UNFAIR_TRADE_PRACTICES_Transposition_of_UTP_Directive.pdf ; Belzuz — https://belzuz.com/?p=3830 ; BLE (DE) — https://www.ble.de/EN/Topics/Market-Organisation/UTP/UTP.html?nn=647888
- [S75] DL 62/2013 (DR) — https://diariodarepublica.pt/dr/detalhe/decreto-lei/62-2013-261160 ; CMS, payment terms Portugal — https://cms.law/en/int/expert-guides/cms-expert-guide-to-payment-term-legislation/portugal
- [S76] InvoiceXpress, elementos obrigatórios — https://invoicexpress.com/blog/elementos-obrigatorios-faturas/ ; Garrigues, ATCUD — https://www.garrigues.com/pt/pt-PT/news/covid-19-atcud-so-em-2023-e-novo-adiamento-no-cumprimento-obrigacoes-tributarias ; InvoiceXpress, assinatura adiada para 2027 — https://invoicexpress.com/blog/assinatura-digital-nas-faturas-adiada-para-2027/ ; Rádio Alto Minho — https://radioaltominho.pt/noticias/fatura-eletronica-2027/ ; ECO, SAF-T contabilidade — https://eco.sapo.pt/2025/10/10/governo-volta-a-adiar-obrigatoriedade-de-entrega-do-ficheiro-saf-t-da-contabilidade/ ; CentralGest — https://www.centralgest.com/noticia/797/assinatura-digital-nas-faturas-adiada-para-2027
- [S77] Eurofiscalis, ViDA 2030 — https://www.eurofiscalis.com/en/intra-eu-e-invoicing-2030/
- [S78] Portal das Finanças, listas do CIVA — https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/civa_rep/Pages/c-iva-listas.aspx ; PIV 29248 (azeite) — https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/informacoes_vinculativas/despesa/civa/Documents/PIV_29248.pdf ; Informação vinculativa 10884 (águas, 13%) — http://www.fa-cont.com/INFORMACAO%20VINCULATIVA%2010884%20IVA%20AGUA%20GAS%20NATURAL%2013%25.pdf ; InvoiceXpress, taxas 2026 — https://invoicexpress.com/blog/taxas-iva-portugal/
- [S81] Abreu, Reg. CMVM 7/2023 — https://abreuadvogados.com/wp-content/uploads/2024/01/Implementing-Rules-of-the-Asset-Management-Regime-–-CMVM-Regulation-no.-7-2023.pdf
- [S82] ESMA ISR, MiFID II Anexo II — https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mifid-ii/annex-ii
- [S87] ICC, Incoterms® 2020 — https://iccwbo.org/business-solutions/incoterms-rules/incoterms-2020/
