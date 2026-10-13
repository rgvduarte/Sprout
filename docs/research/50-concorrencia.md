# 50 — Concorrência e comparáveis: modelos de negócio, comissões, financiamento e lições

> Documento de investigação para o Sprout, um marketplace B2B fechado de *commodities* agroalimentares (azeite, água, café), com base em Portugal e *rails* da UE.
> Data de referência: **13/10/2026**. Fonte de partida: `docs/fonte/plano-estrategico-10-13.md`. Complementa `10-mercado.md`, `20-regulatorio.md`, `30-pagamentos-infra.md` e `40-risco-coberturas.md`.
> Âmbito:
> 1. marketplaces B2B agroalimentares e infraestrutura de comércio;
> 2. *crowdfunding* agrícola e de impacto (ECSP);
> 3. venda direta do produtor (CrowdFarming);
> 4. plataformas de ativos tangíveis;
> 5. financiamento de comércio e de inventário;
> 6. a analogia dos combustíveis.
>
> Inclui uma tabela comparativa, um mapa de posicionamento, a análise do fosso defensável e os pontos onde os incumbentes podem retaliar.

---

## 0. Método, etiquetas e limitações (ler primeiro)

**Limitação desta sessão. É decisiva para ler este documento.**

- **Pesquisa web:** o orçamento partilhado (200 pesquisas por execução, comum a todos os agentes) **já estava esgotado** quando esta investigação começou. As três primeiras pesquisas foram recusadas.
- **Leitura direta:** a leitura de páginas (WebFetch) falhou por DNS (`ENOTFOUND`). O acesso HTTP direto também falhou (código 000) para todos os domínios testados: crowdfarming.com, goparity.com, concorrencia.pt, sec.gov e wikipedia.org.
- **Consequência:** **nenhum facto novo sobre concorrentes foi verificado *online* nesta sessão.**
  - O conteúdo novo vem de conhecimento de referência do analista, com data de corte anterior a 2026, e está marcado **[C]**.
  - Os factos verificados vêm das notas 10, 20, 30 e 40, que citam URL consultados hoje, e mantêm a etiqueta **[F]**.
- **Fora de cobertura:** os acontecimentos de 2025–2026 (novas rondas, encerramentos, licenças ECSP concedidas, contas de 2025) não estão cobertos, salvo indicação. **Não está verificado (NV) se cada empresa estava ativa a 13/10/2026.**

**Etiquetas** (alinhadas com `40-risco-coberturas.md`):

| Etiqueta | Significado |
|---|---|
| **[F]** | Facto com fonte consultada hoje, nesta nota ou nas notas 10–40, com URL |
| **[C]** | Conhecimento de referência **não reconfirmado *online* nesta sessão**. O URL indicado é onde se deve verificar e **não foi acedido** |
| **[E]** | Estimativa nossa, com método explícito |
| **[I]** | Inferência ou opinião nossa |
| **NV** | Não verificado. Não usar sem confirmação |

Confiança: **A** (alta), **M** (média), **B** (baixa). As fontes estão numeradas **[R#]** na secção "Fontes".

**Regra de uso:** nenhum número [C] ou NV entra no *business plan* nem no *deck* sem passar pela lista de verificação da secção 13. Não demos intervalos "de memória" para comissões, retornos ou incumprimentos das plataformas quando não temos confiança neles. Nesses casos escrevemos **NV**.

---

## 1. Síntese executiva

1. **Não conhecemos um marketplace digital transacional de azeite a granel com escala em Portugal ou Espanha** [C,M]. A pesquisa não foi possível nesta sessão.
   - O granel transaciona-se por três canais: corretores, venda direta do lagar ao embalador, e cooperativas de 2.º grau ou comercializadoras (Dcoop, Interóleo) [C,M].
   - A referência de preço é o **Poolred** [F].
   - O espaço está vazio por uma razão económica [I]: numa *commodity* homogénea com corretagem barata, uma comissão de marketplace não paga a operação.
2. **Os marketplaces B2B agroalimentares que sobreviveram não cobram comissão sobre a *commodity*** [C,M].
   - Uns vendem *software* ou dados. A Choco vende ao distribuidor e não ao restaurante. A Covantis é infraestrutura de pós-negociação dos próprios *traders*. O Poolred e a Mintec/Expana publicam ou vendem preços.
   - Outros atuam como **principal**, com serviço de qualidade e logística (Tridge, Algrano).
   - O modelo principal com logística própria em frescos queimou capital (Frubana) [C,B].
3. **Os incumbentes digitalizam juntos; não se deixam desintermediar.**
   - A Covantis foi criada por ADM, Bunge, Cargill, COFCO International, Louis Dreyfus e Viterra [C,M].
   - No azeite, a resposta provável de Sovena, Deoleo e Dcoop a um entrante são **contratos e adiantamentos aos lagares**, e não uma plataforma aberta [I].
4. **Os análogos estruturais mais próximos do Sprout não são agrícolas.**
   - **Liv-ex:** bolsa B2B fechada de vinho fino, desde 2000, só para comerciantes membros. Tem contratos padronizados, liquidação, armazém associado e índices de preço [C,M].
   - ***En primeur* de Bordéus**, para o ciclo de 18 meses: o comprador paga o vinho cerca de 18–24 meses antes da entrega, através de corretores e *négociants* [C,M].
   - O *en primeur* **funciona quando o comprador espera valorização e trava quando os preços caem** [C,M]. É precisamente o regime atual do azeite: **−63% desde o pico de jan. 2024** [F, nota 10].
5. **O *crowdfunding* agrícola regulado já existe e tem dono.**
   - Plataformas: **Miimosa** (FR, especialista agroalimentar, ECSP) [C,M]; **Goparity** (PT, impacto; estado ECSP NV) e **Raize** (PT, crédito a PME, autorização ECSP [F]); **Lendahand** (NL, ECSP) [C,M].
   - Regras: teto de **€5M por promotor em 12 meses**, teste de conhecimentos e período de reflexão de 4 dias [F].
   - **O Sprout não deve ser plataforma ECSP**, por causa dos conflitos de interesse do art. 8.º do ECSP. Deve ser **promotor numa plataforma de terceiros**, na fase 2 [F/I].
6. **A CrowdFarming prova que um produtor se financia com pré-pagamento em espécie, sem instrumento financeiro** [C,M].
   - O modelo é a "adoção" de uma árvore com entrega da colheita.
   - É *asset-light*: o produtor envia diretamente ao cliente.
   - Vende **acima** do preço de retalho, graças à rastreabilidade e à história do produto.
   - É o contrário da tese "10–15% de desconto": **o valor está no prémio, não no desconto** [I].
7. **Nos ativos tangíveis, quem chega ao retalho passa pelo direito dos valores mobiliários.**
   - **Masterworks** e **Vint** usam a **Reg A+** da SEC (oferta qualificada por obra ou por coleção). **AcreTrader** e **FarmTogether** usam a **Reg D 506(c)**, só para investidores acreditados [C,M].
   - A base é o caso ***Howey*** (1946): plantações de citrinos vendidas com contrato de serviço são um valor mobiliário [C,A].
   - No Reino Unido, os barris de whisky "não regulados" geraram fraude e alertas policiais [F]. Lotes de propriedade individual geridos pelo operador foram qualificados como OIC: Asset Land (terrenos) e Capital Alternatives (**arroz**) [F].
8. **No financiamento de comércio, as quedas vêm sempre de colateral não verificado e de *funding* desalinhado.**
   - **Greensill** (2021): seguro retirado, recebíveis "futuros", concentração, e cerca de US$10 mil M em fundos do Credit Suisse congelados [C,A/M].
   - **Stenn** (12-2024): entrou em administração depois de o HSBC pôr em causa faturas e pagamentos [C,M].
   - **Qingdao** (2014): recibos de armazém duplicados [C,A]. **Hin Leong** (2020) [C,M].
   - Para o Sprout, **a verificação independente do stock e dos recebíveis é o produto, não um custo** [I].
9. **A analogia dos combustíveis é fraca como evidência e deve sair do *deck*** [I].
   - Em Portugal, o combustível é um **oligopólio verticalmente integrado**: refinação só na Galp desde o fecho de Matosinhos (2021), logística primária partilhada. **A maior parcela do preço são impostos**, e não comissões de intermediários [C,M].
   - No azeite, o Observatorio espanhol mede uma margem líquida do embalador de **0,19–0,50 €/kg** e uma **margem negativa da distribuição no AOVE em 2020/21 (−0,231 €/kg)**: o azeite serve de chamariz [F].
   - O "clube fechado" do azeite é **a prateleira e o cabaz do distribuidor**, e não uma cadeia de comissões.
10. **Fosso defensável possível [I]:** ser **o sítio onde um lote português de azeite é verificado, custodiado, precificado e financiável**. Na prática, um Liv-ex do azeite, com *collateral manager* e um índice ancorado no Poolred e no SIMA.
    - Inclui acesso preferencial a lagares âncora, pagos em ≤30 dias.
    - **Não são fosso:** o desconto, a UX e a "captura de 80–90% da margem do embalador".
11. **Onde os incumbentes retaliam [I]:**
    - a distribuição e o *cash & carry* (Recheio, Makro) baixam o preço do AOVE *standard*, que já usam como chamariz;
    - os embaladores (Sovena, Gallo, Acesur) bloqueiam a oferta com adiantamentos e contratos aos lagares;
    - os engarrafadores de água e os torrefatores usam exclusividades na HoReCa.

    A retaliação é **muito provável no produto *standard*** e **pouco provável no lote diferenciado de origem identificada**.

---

## 2. Marketplaces B2B agroalimentares e infraestrutura de comércio

### 2.1 Casos

| Caso | País, ano | O que faz | Receita | Financiamento / escala | Lição para o Sprout |
|---|---|---|---|---|---|
| **Agrofy** [R1] | Argentina, 2015 [C,M] | Marketplace agro *online* (máquinas, insumos, veículos, imóveis rurais), com meio de informação próprio e serviços financeiros [C,M] | Anúncios e *leads* pagos pelo vendedor, mais comissão no *e-commerce* de insumos [C,M]. Percentagens **NV** | Capital de risco, com o SoftBank Latin America Fund numa ronda de 2021 [C,M]. Montante **NV** | No agro B2B, a monetização começou em classificados e *leads*, e não em comissão sobre *commodities* |
| **Grão Direto** [R2] | Brasil, ~2016 [C,B] | Negociação digital de grãos (soja, milho) entre produtores e compradores [C,M] | **NV** | **NV** | Funciona ao lado de futuros líquidos (B3/CBOT). **O azeite não os tem** [F, nota 10] |
| **Covantis** [R3] | Suíça, operacional em 2021 [C,M] | Plataforma (*blockchain*) de **pós-negociação**: documentação e execução de cargas de grãos e oleaginosas [C,M] | Taxas de membros ou por carga, **NV** | Consórcio de ADM, Bunge, Cargill, COFCO Intl, LDC e Viterra [C,M] | Os incumbentes **digitalizam o pós-*trade* entre si**. A fricção que se paga está na documentação, na qualidade e na liquidação |
| **Choco** [R4] | Alemanha, 2018 [C,M] | Aplicação de encomendas restaurante→fornecedor. Depois, *software* e IA para distribuidores alimentares [C,M] | Grátis para restaurantes. *SaaS* pago pelo distribuidor [C,M] | Avaliação de ~US$1,2 mil M (2022) [C,M]; reestruturação e mudança para IA [C,M] | Na HoReCa, **a relação é do distribuidor**. A Choco acabou a vender-lhe ferramentas em vez de o substituir |
| **Frubana** [R5] | Colômbia, 2018 [C,M] | Abastecimento B2B de restaurantes (frescos), com logística própria [C,M] | Margem de revenda (principal) [C,M] | Capital de risco relevante (**NV**); saída de mercados em 2022–23 [C,B] | Principal com logística própria e margens de frescos queima capital. **Aviso** |
| **Tridge** [R6] | Coreia do Sul, 2015 [C,M] | *Sourcing* B2B agroalimentar global e dados de preço. Passou a executar transações, com inspeção de qualidade [C,M] | Margem ou comissão nas transações, mais subscrição de dados [C,M] | **NV** | No transfronteiriço, o valor está na **verificação de qualidade e na execução**, e não em listar ofertas |
| **Algrano** [R7] | Suíça, 2013 [C,M] | Marketplace de **café verde** em *direct trade* entre produtores e torrefatores, com amostras, logística e financiamento [C,M] | Taxa sobre a transação, **NV** | **NV** | É o modelo a copiar se o café entrar como *sourcing* de verde para microtorrefatores (nota 10, §6.5) |
| **Liv-ex** [R8] | Reino Unido, 2000 [C,M] | Bolsa **B2B fechada** de vinho fino para comerciantes membros: contratos padronizados, liquidação, armazém associado, índices (Liv-ex 100) [C,M] | Comissões de transação e subscrição de dados [C,M]. Percentagens **NV** | Centenas de membros [C,B] | **Análogo estrutural n.º 1** (ver 2.3) |
| **Mintec / Expana** [R9] | Reino Unido [C,M] | Dados e índices de preço de matérias-primas alimentares, incluindo azeite [C,M] | Subscrição | **NV** | Concorrente se o Sprout quiser vender "índice de preço". Não é fosso por si |
| **Tradecloud** [R10] | Países Baixos [C,M] | Colaboração na cadeia de abastecimento: confirmação de encomendas e entregas entre fabricantes e fornecedores [C,M] | *SaaS* | — | **Não é marketplace agro.** Serve só de referência de integração ERP/encomendas |
| **Freshflow** [R11] | Alemanha [C,B] | IA para encomendas e reposição de frescos no retalho [C,B] | *SaaS* | **NV** | **Não é marketplace.** Fora do perímetro competitivo |
| **Agrimp** | **NV** | Existência, sede e modelo **não confirmados** | — | — | **Excluído** até verificação |

### 2.2 Como se transaciona hoje o azeite a granel (Ibéria)

| Mecanismo | O que é | Quem paga | Relevância |
|---|---|---|---|
| **Poolred** [R12] | Sistema de informação de preços na origem da Fundación para la Promoción y el Desarrollo del Olivar y del Aceite de Oliva (Jaén). Baseia-se em transações reais comunicadas pelos operadores aderentes [C,M]. É a série citada pela imprensa (ex.: AOVE a **3,34 €/kg** em 29/09–05/10/2026) [F, nota 10] | Não é marketplace; condições de acesso **NV** | **Referência contratual natural**: preço do lote = Poolred (ou SIMA PT) ± diferencial de qualidade e origem [I] |
| **MFAO** | Mercado de futuros de azeite (Jaén, desde 2004). **Iniciou a dissolução em 2016**, sobretudo pelo impacto do EMIR, e está extinto [F, notas 10 e 40] | — | Não há cobertura cotada. A cobertura é comercial (*back-to-back*; nota 40) |
| **Corretores de azeite** | Intermediários de granel entre lagares e embaladores ou exportadores [C,M] | Corretagem; quem a paga e a taxa são **NV**. [E] Provavelmente inferior a 1% do valor; confirmar com 2–3 corretores | É o **teto prático de comissão** para um marketplace de granel indiferenciado [I] |
| **Cooperativas de 2.º grau / comercializadoras** (Dcoop; Interóleo Picual Jaén) [R13] | Concentram o azeite das cooperativas associadas. A Dcoop também embala e vende marcas próprias [C,M]. A Interóleo vende granel a embaladores por procedimentos competitivos [C,B]. A Dcoop **licitou a Deoleo** (~470 M€) [F,B, nota 10] | Margem própria | **A desintermediação "a partir de baixo" já existe**: os produtores integraram-se verticalmente. O Sprout não traz isso de novo em Espanha [I] |
| **Venda direta lagar → embalador** | Os grandes embaladores (Sovena, Deoleo, Acesur, Gallo) compram granel aos lagares e lotam-no [F,M, nota 10] | Margem do embalador: **0,19–0,50 €/kg** (5–14% do PVP s/ IVA); EBITDA de ~5–6% [F] | O "bolo" do embalador é pequeno e volátil [F, nota 10] |
| **Portugal** | **Não identificámos** plataforma transacional de granel ou de azeite B2B com escala [C,M; pesquisa impossível]. Canais: corretores, venda a embaladores, cooperativas e exportação de granel para Espanha e Itália [F, nota 10, §1.2] | — | Pode haver espaço **local**, mas a liquidez de preço está em Jaén [I] |

### 2.3 Liv-ex e *en primeur*: os análogos que melhor explicam o Sprout

**Liv-ex [C,M] [R8]:**

- é um **mercado fechado**: só comerciantes admitidos, sem retalho;
- negoceia **contratos padronizados**: condição, origem, armazém e prazo de entrega;
- tem liquidação e **custódia associada**, o que reduz o risco de contraparte;
- publica **índices de preço** usados por toda a indústria, incluindo a imprensa e os fundos de vinho.

[I] É, quase ponto por ponto, o "Marketplace Fechado para controlo rigoroso de KYC/AML e liquidez" do documento-fonte. A lição: o valor de um mercado fechado vem da **padronização do contrato e da confiança na entrega**, e não do desconto.

***En primeur* de Bordéus [C,M]:**

- os *châteaux* vendem o vinho **antes do engarrafamento**, com entrega cerca de 2 anos depois;
- a venda passa pela *Place de Bordeaux*: corretores (*courtiers*, com comissão de ~2% segundo a prática citada no setor [C,M]), *négociants* e importadores;
- é, literalmente, um **"clube fechado" de intermediários que financia o produtor 18–24 meses antes da entrega**. É uma analogia melhor do que os combustíveis.
- Nas campanhas recentes, com preços em queda, os compradores *en primeur* ficaram com **perdas face ao mercado secundário**, e as campanhas travaram [C,M].

[I] **Lição direta:** um ciclo de 18 meses financiado por compradores ou investidores só se vende em mercado de alta. Com o AOVE em mínimos de 2 anos e uma colheita espanhola prevista em +23% [F, nota 10], **ninguém racional paga hoje azeite com 18 meses de antecedência sem desconto profundo ou sem juro**. O produto tem de ser **crédito colateralizado** (nota 40, §9.5) e não "pré-compra com valorização".

### 2.4 Lições da secção 2 [I]

1. **A comissão sobre *commodity* homogénea tem teto baixo.** O corretor está abaixo de 1% [E] e o embalador ganha ~5–6% de EBITDA [F]. Um marketplace "agente" de granel indiferenciado não paga KYC, logística, qualidade e reconciliação diária.
2. **Paga-se pela fricção do pós-negociação:** qualidade verificada, documentação, logística, liquidação garantida e financiamento. Covantis, Tridge, Algrano e Liv-ex ganham aí.
3. **Na HoReCa ganha quem tem a relação diária e o cabaz** (o distribuidor). A Choco converteu-se em fornecedora do distribuidor.
4. **O modelo principal com logística própria exige margem bruta alta**, e no azeite ela só existe no produto diferenciado (nota 10, cenário C: +23–27%).

---

## 3. *Crowdfunding* agrícola e de impacto (ECSP)

### 3.1 Regras comuns (Reg. (UE) 2020/1503), de `20-regulatorio.md`

- Teto de **€5M por promotor em 12 meses**. Para investidores não sofisticados: teste de conhecimentos, simulação da capacidade de suportar perdas, **4 dias de reflexão** e **KIIS** [F] [R20, R21].
- **Conflitos (art. 8.º):** a plataforma **não pode ter participação** nas ofertas que aloja nem participar em SPV interposta [F] [R21].
- **Portugal:** a CMVM é a autoridade competente. Lei 102/2015, alterada pelo DL 66/2023 [F] [R22].
- **Donativo e recompensa** ficam no regime nacional, fora do ECSP [F] [R22]. [C,M] Em Portugal, estas plataformas comunicam-se à Direção-Geral do Consumidor; confirmar na Lei 102/2015 republicada.
- **Pagamentos:** os fundos têm de passar por PSP licenciado. A Lemonway (IP, ACPR) tem as plataformas de *crowdfunding* como segmento central e preçário público: *setup* de €5.490, €840/mês, 0,30% + €0,40 por transferência [F] [R23].

### 3.2 Plataformas

| Plataforma | País, licença | Segmento | Ticket mínimo | Retorno típico | Incumprimento | Comissões | Relevância |
|---|---|---|---|---|---|---|---|
| **Miimosa** [R14] | França, fundada ~2015 [C,M]. ECSP autorizado pela AMF [C,M]; data **NV** | **Agricultura e alimentação**: donativo/recompensa e empréstimos [C,M] | **NV** | **NV** | **NV** | Pagas sobretudo pelo promotor [C,B]; percentagens **NV** | **Muito alta.** Única especialista agro de escala na UE que conhecemos. É parceiro ou modelo para a fase 2 |
| **Goparity** [R15] | Portugal, fundada 2017 [C,M]. Estado ECSP **NV** (nota 20) | Impacto: energia, eficiência, social, agro [C,M] | Baixo (**NV**) | **NV** | **NV** | **NV** | **Alta.** Base de pequenos investidores de impacto em PT. Candidato a parceiro na fase 2 |
| **Raize** [R16] | Portugal, fundada 2014 [C,M]. **Autorização ECSP** (assessoria da Abreu) [F]; data **NV** | Crédito a PME [C,M] | **NV** | **NV** | Publica estatísticas (**NV**) | **NV** | **Alta.** A nota 20 já a indica como parceiro ECSP possível |
| **Lendahand** [R17] | Países Baixos, fundada ~2012 [C,M]. ECSP via AFM [C,M] | Impacto em mercados emergentes, incluindo PME agro, através de parceiros locais [C,M] | **NV** | **NV** | **NV** | Pagas pelo mutuário [C,B] | **Média.** Mostra o crédito a PME agro via originador local, que é o papel possível do Sprout perante uma plataforma |

**Nota:** todos os números de retorno, incumprimento e comissão destas plataformas estão **NV**. Recolhê-los é a tarefa n.º 2 da secção 13: KIIS de 3 campanhas recentes de cada uma, página de estatísticas e registo ESMA/CMVM.

### 3.3 Economia para o Sprout como promotor [E]

Método: o custo do capital de retalho, convertido em €/kg de azeite em stock.

- **Granel AOVE** a ~3,5 €/kg [F, nota 10: 3,34–3,50 €/kg em set.–out. 2026].
- **Hipótese de custo total ECSP:** juro ao investidor + comissão da plataforma amortizada + custos jurídicos e KIIS ≈ **10–13%/ano**. É uma hipótese [E/NV], a substituir por cotações reais.
- **Custo por kg:**
  - 10% × 3,5 = **0,35 €/kg/ano**;
  - 13% × 3,5 = **0,46 €/kg/ano**;
  - num lote detido 18 meses, **0,53–0,68 €/kg**.
- **Comparação:** a margem líquida histórica do embalador é de **0,19–0,50 €/kg** [F].

**Conclusão [I]:** o capital de *crowdfunding* de retalho **consome sozinho toda a "margem do embalador"** que a tese quer capturar. O ECSP só faz sentido se:

- financiar **recebíveis já vendidos** (rotação de 30–60 dias), e não stock parado; ou
- financiar o **lote diferenciado**, com margem de +1,3–1,6 €/kg [F/E, nota 10, cenário C].

### 3.4 Lições [I]

1. O ECSP é um **canal de distribuição de dívida**, não um modelo de negócio. As plataformas ganham comissões, e o risco de crédito fica no investidor e na reputação do promotor.
2. **O teto de €5M em 12 meses chega para o piloto e para os anos 1–3**: a série-tipo da nota 40 é de 100–150 k€. Não é restrição relevante no curto prazo.
3. **O retalho exige retorno em dinheiro, previsível e explicado.** Isto colide com a volatilidade do azeite (+157% e −57% em janelas de 15–20 meses [F, nota 10]). Só dívida *senior* colateralizada, com almofada subordinada do patrocinador (nota 40), é apresentável numa KIIS.
4. A Miimosa juntou **donativo/recompensa** (fora do ECSP) e **empréstimo** (ECSP). Para o Sprout, a componente "recompensa em espécie" (secção 4) pode servir os "jogadores" do documento-fonte **sem produto financeiro** [I; confirmar com o Jurídico].

---

## 4. Venda direta do produtor: CrowdFarming (e a "adoção" de oliveiras)

**Factos [C,M] [R18]:**

- fundada em **2017** em Valência por **Gonzalo e Gabriel Úrculo**, a partir da exploração familiar (Naranjas del Carmen);
- dois produtos: (a) **adoção** de uma árvore, colmeia, animal ou parcela, com entrega periódica da colheita; (b) **caixas avulsas**;
- **o agricultor fixa o preço** e **envia diretamente** ao consumidor; a plataforma não detém stock;
- o mercado principal é a Alemanha, com centenas de agricultores em vários países europeus;
- inclui **oliveiras e azeite**;
- a receita e a comissão retida **não foram verificadas (NV)**.

O modelo de "adoção de oliveira" existe também noutros operadores, como o Nudo, em Itália/Reino Unido [C,B].

**O que funciona e porquê [I]:**

1. **Pré-pagamento em espécie:** a adoção financia o agricultor antes da colheita, e o adotante recebe **produto e não dinheiro**. Sem retorno monetário, a qualificação como instrumento financeiro ou OIC é muito mais difícil. É exatamente o que falta à tese dos "jogadores".
2. **Asset-light:** sem armazém nem stock próprio; o custo logístico é pago pelo cliente em cada caixa.
3. **Prémio, não desconto:** o consumidor paga perto ou acima do retalho em troca de origem, frescura e história. **Isto contradiz a tese de 10–15% de desconto** e confirma a nota 10, §6.3: a margem está no produto diferenciado e rastreado.
4. **O azeite encaixa**, porque não é perecível e tem valor alto por kg. A água não encaixa (nota 10, §2.5).

**Limites do modelo para o Sprout [I]:**

- É **B2C** (consumidor final), com custo de aquisição de cliente e de *marketing* incompatível com um piloto B2B fechado.
- Se a adoção trouxer opção de **revenda, recompra ou valor em dinheiro**, o enquadramento muda:
  - Espanha: Ley 43/2007, que obriga a garantia individualizada [F] [R27];
  - Portugal: leitura da CMVM, à luz do alerta Cimovelpark [F] [R27].
- **Regra:** entrega física obrigatória, **sem *cash-out***.

---

## 5. Plataformas de ativos tangíveis (vinho, whisky, arte, terra agrícola)

### 5.1 Casos

| Caso | Ativo | Via regulatória | Investidor-alvo | Comissões | Escala / estado | Lição |
|---|---|---|---|---|---|---|
| **Masterworks** [R19] | Arte (quadros) | **SEC Reg A+ (Tier 2)**: uma oferta qualificada por obra, num emitente ou série dedicada, com *offering circular* e relatórios à SEC [C,M] | Retalho EUA (a Reg A+ admite não acreditados, com limites) | **1,5%/ano** (cobrado por diluição) **+ 20% da mais-valia na venda** [C,M] | Série A de **US$110M** com avaliação **> US$1 mil M** (out. 2021) [C,M] | Fracionar um ativo tangível para retalho exige o **regime completo de valores mobiliários** e reporte contínuo |
| **Vint** [R19] | Vinho e espirituosas | **SEC Reg A+**, com série por coleção [C,M] | Retalho EUA | Comissão de *sourcing* embutida no preço, mais armazenagem e seguro [C,B]; valores **NV** | **NV** | Igual. Custódia profissional como base da confiança |
| **Cult Wines** [R24] | Carteiras geridas de vinho fino | Reino Unido: vinho **não é investimento regulado pela FCA**. Propriedade direta do cliente em armazém aduaneiro [C,M] | HNWI | Comissão anual de gestão sobre ativos [C,M]; % **NV** | **NV** | Funciona por propriedade direta e custódia independente. O risco de reclassificação existe (Asset Land) |
| **Wine Owners** [R25] | Vinho | Gestão de garrafeira e bolsa *peer-to-peer* [C,M] | Colecionadores e comerciantes | Comissão de transação [C,B]; valores **NV** | **NV** | Mostra a liquidez secundária como serviço |
| **Barris de whisky** (vários) | Barris | **Não regulados** pela FCA, sem FSCS [F] | Retalho | *Mark-ups* elevados [C,B] | **89** casos e **> £3M** de perdas em 2023 (City of London Police). A ASA agiu contra a Capgroup (07-2026) [F] [R27] | O "ativo palpável" sem regulação atrai fraude, polícia e reguladores de publicidade |
| **AcreTrader** [R26] | Terra agrícola (EUA) | **SEC Reg D 506(c)**, só investidores **acreditados**, uma LLC por quinta [C,M] | Acreditados | Comissão anual de gestão de ~0,75% [C,B]; outras **NV** | **NV** | Restringir a acreditados é o caminho rápido, equivalente ao "só qualificados ou ticket ≥ €100k" da nota 20 |
| **FarmTogether** [R26] | Terra agrícola (EUA) | **Reg D 506(c)**, acreditados; também tem fundo [C,M] | Acreditados | Anual + taxas iniciais [C,B]; valores **NV** | **NV** | Idem. A passagem para fundo mostra a escala via veículo coletivo regulado |
| **Farmfolio** [R26] | Plantações na América Latina, com contrato de gestão [C,B] | **NV** | **NV** | **NV** | **NV** | **Padrão *Howey*** (terra + contrato de serviço). Estrutura a **não** copiar |
| ***SEC v. W.J. Howey Co.*** (1946) [R28] | Plantações de citrinos com contrato de serviço | O Supremo dos EUA qualificou o conjunto como *investment contract* (valor mobiliário) [C,A] | — | — | — | **Precedente fundador.** O equivalente europeu está na nota 20, §9: Asset Land, Capital Alternatives (arroz), Park First [F] |

### 5.2 Lições [I]

1. **Nenhuma plataforma de ativo tangível chegou ao retalho com escala fora do direito dos valores mobiliários.** Ou se regista a oferta (Reg A+, prospeto, ECSP), ou se fica pelos acreditados ou qualificados (Reg D; isenções do Reg. Prospetos).
2. **O modelo de comissões é do gestor de ativos:** 1–3% ao ano mais *carry* [E; Masterworks: 1,5% + 20% [C,M]]. Se o Sprout cobrar "spread operacional retido" a investidores, está **a cobrar como gestor**. Isso reforça a leitura AIFMD/OIC da nota 20.
3. **A custódia independente** (armazém aduaneiro, depositário, *collateral manager*) é o que torna o ativo "auditável". Sem ela, o argumento "palpável" é só *marketing*.
4. **O "não regulado" não protege:** whisky (Reino Unido), Fórum Filatélico/Afinsa (Espanha) e Cimovelpark (Portugal) [F, nota 20].

---

## 6. Financiamento de comércio e de inventário

### 6.1 Marketplaces e financiadores

| Caso | Modelo | Via / licença | Lição |
|---|---|---|---|
| **Incomlend** [R29] | Marketplace de **faturas de exportação** (Singapura, ~2016): exportadores vendem faturas a investidores profissionais e institucionais [C,M] | Licença da MAS **NV** | Só investidores profissionais. O valor está na **verificação do devedor** e no seguro de crédito |
| **Tradewind Finance** [R30] | *Factoring* de exportação e financiamento de comércio (origem alemã) [C,B] | **NV** | **Não é marketplace.** É financiador especializado; é o tipo de parceiro de *funding* possível |
| **Stenn** [R31] | Financiamento de faturas a PME exportadoras (Reino Unido) | Entrou em **administração em 12-2024** depois de o **HSBC** (credor) levantar dúvidas sobre pagamentos ligados a faturas (~US$192M, segundo a imprensa da época) [C,M]. Fora avaliada em ~US$900M meses antes [C,B] | A **verificação independente** de faturas e devedores falhou. Crescer mais depressa do que os controlos destrói o financiamento bancário de um dia para o outro |
| **Greensill Capital** [R32] | *Supply chain finance*: notas distribuídas por fundos do Credit Suisse | **Insolvência em 03-2021**, depois de perder o seguro de crédito. Cerca de **US$10 mil M** em fundos SCF do Credit Suisse suspensos. Forte concentração no GFG Alliance. Financiamento de "recebíveis futuros" sem fatura [C,A/M]. A FINMA concluiu, em fev. 2023, falhas graves de gestão de risco no Credit Suisse [C,M] | Quatro falhas, por ordem: (1) colateral que não existia ainda; (2) dependência de **um** seguro; (3) concentração; (4) *funding* de curto prazo (fundos líquidos) para ativos que não rodavam |

### 6.2 Fraudes de inventário (colateral físico)

- **Qingdao (China, 2014):** o mesmo stock de metais foi dado em garantia várias vezes, com **recibos de armazém duplicados** [C,A] [R33].
- **Hin Leong (Singapura, 2020):** um *trader* de petróleo ocultou perdas com transações e stocks fictícios e deixou dívidas de **~US$3,5 mil M** a dezenas de bancos [C,M] [R33].
- [I] Um stock de azeite num lagar terceiro tem **o mesmo perfil de risco**: o mesmo tanque pode servir de garantia a dois credores, a qualidade pode degradar-se e o depositário pode entrar em insolvência. A nota 40, §4.4, já prescreve o necessário:
  - tanques individualizados e selados;
  - contrato de depósito tripartido;
  - *collateral manager* independente;
  - penhor mercantil ou armazéns gerais (Código Comercial).

### 6.3 Como os bancos financiam stock de mercadorias [C,M]

O padrão de *commodity trade finance* tem quatro elementos:

- ***borrowing base*** com *advance rates* por tipo de colateral;
- ***collateral management agreement*** com inspetora independente (SGS, Bureau Veritas, Control Union);
- **cobertura de preço exigida** para stock "aberto";
- **seguro do stock** cedido ao banco.

Os parâmetros indicativos para o Sprout estão na nota 40, §5.3: 60–70% do stock vendido *back-to-back*, 40–50% do stock aberto, 80–85% dos recebíveis seguros [E].

Em Espanha, as cooperativas recebem habitualmente **adiantamentos de campanha** de caixas rurais [C,B; NV]. Em Portugal, o equivalente provável é o **Crédito Agrícola** [I; NV]. **Estes bancos são concorrentes diretos do "Sprout Capital"** no financiamento do lagar [I].

### 6.4 Lições [I]

1. **A verificação é o produto.** Um investidor não compra "azeite"; compra a certeza de que o azeite existe, tem a categoria declarada, não está penhorado a outro e será vendido. Telemetria, análise laboratorial, selagem e *collateral manager* são **o que justifica a comissão** do Sprout.
2. **Nunca financiar o que ainda não existe** (lição Greensill): sem colheita feita, sem stock em tanque, nada de financiamento ao investidor.
3. **Diversificar *funding* e seguro** desde a série 2. Um único financiador ou segurador é um ponto único de falha (Greensill, Stenn).
4. **Alinhar o *funding* com a rotação real**: *soft bullet* a 12 meses com extensão a 18 (nota 40, §9.1), e não liquidez prometida sobre stock lento.

---

## 7. A analogia dos combustíveis em Portugal

O documento-fonte diz que o mercado de combustíveis está "travado por *middlemen* e comissões absurdas" e é um "clube fechado". O que se sabe:

| Elemento | Facto ou conhecimento | Etiqueta |
|---|---|---|
| Refinação | A Galp é a única refinadora em Portugal (Sines) desde que **Matosinhos deixou de refinar em 2021** | [C,A] [R34] |
| Logística primária | Oleoduto multiprodutos Sines→Aveiras e parque de Aveiras, explorados pela CLC (Companhia Logística de Combustíveis), com acionistas petrolíferos | [C,M] [R34] |
| Formação do PVP | Cotação internacional (Platts), frete, logística, incorporação de biocombustíveis, margens de comercialização e **impostos (ISP, taxa de carbono, IVA a 23%)**. Os impostos representam **cerca de metade** do PVP, conforme o período e o produto | [C,M] [R35] |
| Supervisão | A **ERSE** e a **ENSE** acompanham preços e margens. A **Lei 69-A/2021** permitiu ao Governo fixar **margens máximas** de comercialização de combustíveis simples e GPL | [C,M] [R35, R36] |
| Autoridade da Concorrência | A AdC estudou o setor várias vezes e mantém-no em acompanhamento. Não conseguimos verificar nesta sessão as conclusões, os estudos mais recentes, nem eventuais decisões sancionatórias | **NV** [R37] |

**Avaliação [I]:**

- **Onde a analogia vale:**
  - o combustível é uma *commodity* em que o cliente final não vê a formação do preço;
  - há **barreiras de acesso** à logística e à oferta (refinação única, parques partilhados), o que dificulta entrar e desintermediar.
- **Onde a analogia falha:**
  1. O combustível **não** tem "muitos intermediários"; tem **poucos operadores verticalmente integrados**.
  2. A parcela grande do preço é **fiscal**, e não comissão. "Comissões colossais" não é a descrição suportada pelos dados públicos que conhecemos [C,M].
  3. No azeite, os dados que temos (Observatorio, Espanha) mostram o contrário de "comissões absurdas":
     - margem líquida do embalador de 0,19–0,50 €/kg (5–14% do PVP);
     - margem líquida da distribuição de 5,2% em 2019/20 e **negativa em 2020/21** (−0,231 €/kg);
     - **o lagar com lucro de 0,001 €/kg** em 2020/21 [F] [R38].
  4. O diferencial granel→prateleira (16–34% do PVP s/ IVA [F, nota 10]) é sobretudo **custo**: embalagem 0,47–0,51 €/kg, logística, marca e risco de preço. Não é renda de intermediário.
- **Analogia melhor:**
  - o "clube fechado" do azeite é **o acesso à prateleira**: concursos de marca branca, cabaz do *cash & carry*, exclusividades na HoReCa;
  - e, para o ciclo financeiro, a ***Place de Bordeaux*** (secção 2.3).
- **Recomendação:** retirar os combustíveis do *deck*. Se ficarem, só com dados ERSE/AdC citados e verificados. Um investidor ou supervisor que conheça o setor desmonta a analogia em 2 minutos e passa a desconfiar do resto.

---

## 8. Tabela comparativa consolidada

Legenda da relevância: **A** = modelo a estudar ou parceiro direto; **M** = lição parcial; **B** = contexto.

| Caso | Modelo | Quem paga | Comissão / *take rate* | Via regulatória | Escala | Relevância para o Sprout |
|---|---|---|---|---|---|---|
| Corretores de azeite | Intermediação de granel | Comprador e/ou vendedor (**NV**) | **[E] < 1%** (NV) | Atividade comercial | Dominante no granel ibérico [C,M] | **A**: teto de comissão no granel indiferenciado |
| Poolred | Informação de preços | **NV** | Não aplicável | Fundação privada | Referência ibérica [F] | **A**: índice contratual |
| Dcoop / Interóleo | Concentração da oferta, venda ou embalamento | Comprador (margem) | Margem própria (**NV**) | Cooperativa / sociedade comercial | Líderes em Espanha [C,M] | **A**: concorrente pela oferta; desintermediação já feita pelos produtores |
| Sovena, Deoleo, Acesur, Gallo | Embalamento e marca (principal) | Retalho, HoReCa, exportação | EBITDA ~5–6% [F] | — | Sovena ~1,8 mil M€; Deoleo ~821 M€ [F] | **A**: incumbentes que retaliam |
| Recheio, Makro, *foodservice* | Grossista / *cash & carry* | HoReCa (margem) | AOVE com margem baixa ou negativa (chamariz) [F, Observatorio ES] | — | Recheio ~1,4 mil M€ (2025) [F] | **A**: concorrente do cabaz HoReCa |
| Agrofy | Classificados + *e-commerce* agro | Vendedor | **NV** | — | **NV** | **B** |
| Grão Direto | Marketplace de grãos | **NV** | **NV** | — | **NV** | **B**: existe ao lado de futuros líquidos |
| Covantis | Pós-negociação de grãos | Membros (*traders*) | Por carga ou subscrição (**NV**) | — | Consórcio dos 6 maiores [C,M] | **M**: incumbentes digitalizam juntos |
| Choco | *SaaS* para distribuidores | Distribuidor | *SaaS*; restaurantes grátis [C,M] | — | ~US$1,2 mil M (2022) [C,M] | **M**: a relação HoReCa é do distribuidor |
| Frubana | Principal com logística (frescos) | Restaurante | Margem de revenda | — | Retração 2022–23 [C,B] | **M**: aviso |
| Tridge | *Sourcing* global + execução + dados | Comprador e vendedor | **NV** | — | **NV** | **M** |
| Algrano | *Direct trade* de café verde | **NV** | **NV** | — | **NV** | **A** se o café entrar (fase 2) |
| Liv-ex | Bolsa B2B fechada de vinho | Comprador e vendedor (membros) | Comissão por transação (**NV**) | Atividade comercial (bem físico) | Centenas de membros [C,B] | **A**: análogo n.º 1 |
| *En primeur* (Bordéus) | Venda antecipada via *courtiers/négociants* | *Château* (corretagem) | *Courtier* ~2% [C,M] | Comercial | Mercado de referência do vinho fino | **A**: análogo do ciclo de 18 meses; trava em baixa |
| Miimosa | ECSP agro + donativo/recompensa | Promotor (**NV**) | **NV** | ECSP (AMF) [C,M] | **NV** | **A**: parceiro ou modelo na fase 2 |
| Goparity | ECSP impacto | Promotor (**NV**) | **NV** | CMVM; ECSP **NV** | **NV** | **A**: parceiro PT na fase 2 |
| Raize | ECSP crédito a PME | Mutuário (**NV**) | **NV** | ECSP (CMVM) [F] | **NV** | **A**: parceiro PT na fase 2 |
| Lendahand | ECSP impacto (mercados emergentes) | Mutuário [C,B] | **NV** | ECSP (AFM) [C,M] | **NV** | **M** |
| CrowdFarming | Venda direta e adoção (B2C) | Consumidor; o agricultor paga comissão | **NV** | Comércio eletrónico | Centenas de agricultores [C,M] | **A**: pré-pagamento em espécie sem instrumento financeiro |
| Masterworks | Arte fracionada | Investidor | 1,5%/ano + 20% da mais-valia [C,M] | SEC Reg A+ [C,M] | > US$1 mil M de avaliação (2021) [C,M] | **M**: custo regulatório do retalho |
| Vint | Vinho fracionado | Investidor | **NV** | SEC Reg A+ [C,M] | **NV** | **M** |
| Cult Wines | Gestão de carteiras de vinho | Investidor | Anual sobre ativos (**NV**) | Não regulado no Reino Unido [C,M] | **NV** | **M**: propriedade direta + custódia |
| Whisky (vários) | Venda de barris | Investidor | *Mark-up* (**NV**) | Não regulado [F] | Perdas > £3M (2023) [F] | **A como aviso** |
| AcreTrader / FarmTogether | Terra agrícola fracionada | Investidor | ~0,75–1%/ano + taxas [C,B] | SEC Reg D 506(c) [C,M] | **NV** | **M**: só acreditados |
| Incomlend | Marketplace de faturas | Exportador; o investidor recebe o desconto | **NV** | Licença MAS **NV** | **NV** | **M** |
| Stenn | Financiamento de faturas | PME exportadora | **NV** | — | Administração 12-2024 [C,M] | **A como aviso** |
| Greensill | *Supply chain finance* | Fornecedor / comprador | **NV** | — | Insolvência 03-2021 [C,A] | **A como aviso** |
| Lemonway (infraestrutura) | IP para marketplaces e *crowdfunding* | Plataforma | 0,30% + €0,40 por transferência; €840/mês [F] | IP (ACPR) [F] | ~200 plataformas [F] | **A**: *rail* (nota 30) |

**Referências de comissão por classe de modelo [E, ordem de grandeza da prática de mercado, não verificada nesta sessão]:**

| Classe | Comissão típica |
|---|---|
| Corretagem de granel | < 1% |
| Marketplace B2B agente em *commodity* | ~0,5–3% |
| Principal B2B curado (*foodservice*) | Margem bruta de 10–25%, com margem líquida de um dígito baixo |
| ECSP | Comissão de alguns % do montante captado, paga pelo promotor |
| Ativos alternativos | 1–3%/ano + *carry* de 10–20% |
| Marketplace de faturas | Comissão de plataforma de ~1%, com rendimento de um dígito alto para o investidor |

---

## 9. Mapa de posicionamento

Eixo horizontal: **quem é o cliente**, do comprador comercial que consome o bem ao investidor que quer retorno em dinheiro.
Eixo vertical: **integração física**, da plataforma que só faz *software*, dados ou intermediação à que toma posse ou custodia o ativo.

```
                               ALTA INTEGRAÇÃO FÍSICA (posse / custódia)
                                              ▲
  Sovena·Deoleo·Gallo ●   Recheio·Makro ●     │          ● Cult Wines     ● Masterworks · Vint
        Dcoop ●  Frubana ●                    │          ● AcreTrader · FarmTogether
                                              │   ┌─────────────────────────────────────────┐
     ◆ SPROUT FASE 1 (principal, lote         │   │ ZONA DE PERIGO                          │
       diferenciado, back-to-back)            │   │ retorno em € + operador gere o ativo    │
        Tridge ●   Algrano ●                  │   │ (Asset Land, Capital Alternatives,      │
              ● Liv-ex (custódia + contratos) │   │  Park First, whisky, Fórum Filatélico,  │
                                              │   │  Howey)                                 │
                                              │   │      ✖ SPROUT "tese original"           │
                                              │   │        (retalho, 10–15%, refunding)     │
                                              │   └─────────────────────────────────────────┘
 COMPRADOR ◄──────────────────────────────────┼───────────────────────────────────────────► INVESTIDOR
 COMERCIAL      ● CrowdFarming (B2C,          │        ◆ SPROUT CAPITAL (SPV: notes colateralizadas,
 (consome)        pré-pagamento em espécie)   │          só qualificados; credor, não dono do stock)
     ● Corretores de azeite                   │   ● Miimosa · Goparity · Raize · Lendahand (ECSP)
     ● Choco   ● Agrofy   ● Grão Direto       │   ● Incomlend
     ● Covantis (pós-trade)                   │   † Greensill · † Stenn
     ● Poolred · Mintec (dados de preço)      │
                                              ▼
                     BAIXA INTEGRAÇÃO FÍSICA (software / dados / intermediação)
```

**Leitura [I]:**

- **O quadrante superior direito é a zona de perigo.** Todos os precedentes sancionados ou fraudulentos (nota 20, §9) estão lá. A tese original, com retalho, "retorno" e *refunding*, cai nele.
- **O posicionamento recomendado divide o Sprout em dois:**
  - ◆ **Sprout Marketplace**, à esquerda e em cima: principal B2B em lotes diferenciados, com custódia verificada;
  - ◆ **Sprout Capital**, à direita e ao centro: credor colateralizado, só para qualificados, sem posse do risco de preço.
- **Os dois lados ligam-se só pelo colateral verificado**, nunca por fluxos misturados (nota 20, §11.1).
- **Espaço livre:** não há, na Ibéria, um "Liv-ex do azeite" que combine contrato padronizado, custódia verificada, índice ligado ao Poolred e financiamento. É aí que o Sprout pode estar sozinho [I].

---

## 10. Fosso defensável

### 10.1 O que **não** é fosso [I]

| Candidato | Porque não protege |
|---|---|
| Desconto de 10–15% | A distribuição já vende AOVE com margem negativa [F] e iguala o preço quando quiser. Além disso, a aritmética não fecha contra a marca branca espanhola [F, nota 10, §1.7] |
| "Captura de 80–90% da margem do embalador" | Vale 0,15–0,45 €/kg [F/E, nota 10] e é menor do que o custo de capital de retalho (secção 3.3) |
| UX, painéis, *badges* | Copiáveis em semanas; não mudam o custo nem o risco |
| *Backoffice* "plug and play" | O documento-fonte reconhece que é *reverse engineered*. É risco (nota 30), não ativo |
| Conformidade com KYC/AML e PSP | Necessária, mas comprável (Lemonway e outros [F]). É condição de jogo, não fosso |

### 10.2 O que **pode** ser fosso, por ordem de força [I]

1. **Lotes verificados e financiáveis (padrão de dados mais custódia).**
   - Cada lote tem telemetria de tanque, análise físico-química e painel, selagem, cadeia de custódia e *collateral manager*.
   - Se o Sprout for **o padrão que bancos e investidores aceitam como colateral**, cada lote novo torna o seguinte mais barato de financiar. É um efeito de rede de dados e de confiança, que um corretor não replica e que um embalador não quer oferecer aos concorrentes.
2. **Acesso preferencial à oferta (lagares âncora), pago depressa.**
   - Contratos plurianuais de *offtake* com o Lagar do Val e com mais 2–3 lagares (nota 40 exige-o).
   - Pagamento em **≤30 dias por SCT Inst** (notas 20 e 30). Num ano de preços abaixo do custo do olival tradicional [F, nota 10], **a liquidez rápida é o argumento mais forte junto do lagar**.
   - Defensável enquanto o Sprout pagar mais depressa e com menos atrito do que o embalador.
3. **Contrato padronizado e índice de referência para o granel português.**
   - A cotação é Poolred ou SIMA ± diferencial de qualidade e origem, publicada pelo Sprout a partir das suas transações.
   - **Atenção:** o Poolred e o SIMA já publicam preços. O índice só é fosso **combinado** com 1 e 2.
4. **Marca de origem B2B** (lote, lagar, DOP ou monovarietal) para HoReCa média e alta, *gourmet* e exportação.
   - É a lição da CrowdFarming: o cliente paga pelo rastreado.
   - Fosso fraco sozinho, mas é a **fonte da margem** que financia 1–3.

**O teste de fosso a usar no *business plan* [I]:** passados 24 meses, um banco aceita um lote "certificado Sprout" como colateral com um *advance rate* melhor do que um lote não certificado? Se sim, há fosso. Se não, o Sprout é um distribuidor de azeite com *software*.

---

## 11. Onde e como os incumbentes retaliam

| Incumbente | Alavanca de retaliação | Gatilho | Probabilidade [I] | Sinal precoce | Mitigação |
|---|---|---|---|---|---|
| **Distribuição e *cash & carry*** (Recheio, Makro, *foodservice*: Bidfood, Garcias…) [F, nota 10] | Preço de AOVE *standard* (já é chamariz [F]); cabaz completo; crédito comercial; entrega diária | Sprout com quota visível em clientes HoReCa de um distribuidor | **Alta** no produto *standard*; **baixa** no lote diferenciado | Promoções de AOVE 5 L dirigidas à HoReCa; contratos de exclusividade de sortido | Não competir no 5 L *standard*. Vender lote de origem identificada e complementar o distribuidor (ou vender **através** dele, como a Choco) |
| **Embaladores** (Sovena, Gallo, Acesur, Deoleo) [F, nota 10] | Adiantamentos de campanha e contratos de compra com lagares; preço de compra acima do mercado pontual; recusa de comprar a quem venda ao Sprout | Sprout a absorver mais de 1–2% do granel PT ou um lagar de referência | **Média** (o Sprout é pequeno nos anos 1–2) | Ofertas de *offtake* plurianual ao Lagar do Val | *Offtake* plurianual com cláusula de primeira opção; pagamento ≤30 dias; não depender de um só lagar (≤50% no ano 1, nota 40) |
| **Cooperativas de 2.º grau** (Dcoop e similares) | Integração vertical já feita; preço e serviço aos associados | Sprout a procurar oferta em Espanha | **Média** | — | Começar em Portugal (Alentejo, Trás-os-Montes), onde não há equivalente [I] |
| **Engarrafadores de água** (Super Bock Group, Sociedade da Água de Luso) [C,M] | Donos das captações (embalamento na origem obrigatório [F]); acordos HoReCa ligados a cerveja e refrigerantes | Qualquer tentativa de vender água com desconto | **Alta** | Recusa de fornecimento ou preço igual ao do distribuidor | **Retirar a água do piloto** (nota 10, §6.4) ou usar marca própria contratada |
| **Torrefatores** (Delta e outros) [F, nota 10] | Comodato de equipamento e exclusividade com compra mínima | Entrada no café HoReCa | **Muito alta** | — | Café só como *sourcing* de verde para microtorrefatores, na fase 2 |
| **Bancos e caixas agrícolas** (Crédito Agrícola; caixas rurais em Espanha) [C,B] | Adiantamentos de campanha ao lagar a custo bancário | Sprout Capital a financiar lagares | **Média** | Ofertas de linhas de campanha aos lagares parceiros | Parceria: o banco como mutuante e o Sprout como originador e verificador do colateral (nota 40, §9.5) |
| **Corretores** | Preço de corretagem; relação pessoal com lagares e embaladores | Sprout no granel indiferenciado | **Baixa a média** | — | Integrá-los como utilizadores (contrato padronizado e custódia) em vez de os combater |
| **Incumbentes via regulador** | Queixa à CMVM, ao BdP ou à ASAE sobre a promoção do produto de investimento ou sobre rotulagem | *Marketing* agressivo a retalho | **Média**, se houver retalho | Pedidos de informação da CMVM | Regras da nota 20, §11: só qualificados, sem gamificação, sem "garantido" |

---

## 12. Implicações para o Sprout

1. **Mudar a narrativa de "desintermediação com desconto" para "infraestrutura de confiança para lotes físicos".**
   - Os comparáveis que valem dinheiro (Liv-ex, Covantis, Algrano, Masterworks) vendem padronização, verificação e custódia, e não descontos.
   - No *deck*, a frase central passa a ser: "o único sítio onde um lote de azeite português é verificado, custodiado, precificado e financiável".
2. **Modelo de receita em três camadas [I/E]:**
   - (a) margem de **principal** em lotes diferenciados (+1,3–1,6 €/kg no cenário C da nota 10);
   - (b) **comissão de estruturação e verificação** no Sprout Capital, por exemplo 1–2% do lote financiado, mais *spread* sobre o custo de *funding*. A fixar com o Jurídico, porque cobrar como gestor reforça a leitura OIC;
   - (c) mais tarde, **dados e índice** para lagares, bancos e compradores.
   - **Não** basear o modelo em comissão de agente sobre granel: o teto é o do corretor, abaixo de 1% [E].
3. **Copiar a estrutura do Liv-ex no piloto:**
   - membros admitidos com KYB;
   - contrato-padrão (categoria, análise, tanque, prazo, Incoterm, base de preço Poolred/SIMA);
   - liquidação contra entrega via PSP (nota 30);
   - custódia com *collateral manager*.

   É o "Marketplace Fechado" do documento-fonte, agora com conteúdo operacional.
4. **Servir os "jogadores" com recompensa em espécie, nunca com retorno em dinheiro.**
   - O modelo CrowdFarming (adoção de oliveira ou pré-compra de colheita com entrega de azeite) permite envolver pequenos clientes **sem produto financeiro**.
   - Condições: **sem opção de revenda, recompra ou *cash-out*** (Ley 43/2007; Asset Land; alerta Cimovelpark). Confirmar com o Gonçalo Almeida o regime de recompensa da Lei 102/2015.
   - Tudo o que pague dinheiro fica para qualificados (Sprout Capital) ou para uma ECSP de terceiros (fase 2).
5. **Escolher já o parceiro ECSP da fase 2 e pedir números reais.** Pedir a Raize, Goparity e Miimosa:
   - comissões ao promotor;
   - taxas de juro das últimas 10 campanhas agro ou PME;
   - incumprimento por coorte;
   - tempo de captação.

   Com o custo de capital de retalho provável na casa dos dois dígitos baixos [E], **só faz sentido financiar recebíveis curtos ou lotes diferenciados**, nunca stock indiferenciado parado 18 meses (secção 3.3).
6. **Adotar as lições Greensill e Stenn como regras de produto (não negociáveis):**
   - nada financiado sem stock existente em tanque selado;
   - confirmação independente de cada recebível junto do devedor;
   - ≥2 fontes de *funding* e de seguro a partir da série 2;
   - limites de concentração por lagar e por comprador (nota 40);
   - auditoria física trimestral.

   Comunicá-las aos investidores como diferenciação.
7. **Retirar a analogia dos combustíveis do *deck* e trocá-la por dados da cadeia de valor do azeite.**
   - Os dados públicos que conhecemos mostram um oligopólio integrado com carga fiscal alta, e não "comissões absurdas".
   - Os dados do Observatorio mostram margens pequenas no embalador e negativas na distribuição.
   - Se a analogia ficar, só com números ERSE/AdC verificados (secção 13).
8. **Atacar onde a retaliação é fraca:**
   - azeite de origem identificada para HoReCa média e alta, *gourmet* e exportação, com lagares portugueses;
   - **fora**: água (o engarrafador é dono da captação), café HoReCa (comodatos) e AOVE 5 L *standard* (chamariz do *cash & carry*);
   - com o distribuidor, procurar **parceria** (vender através dele) antes de concorrência frontal.
9. **Transformar a concorrência dos bancos em canal.**
   - Caixas agrícolas e bancos já adiantam campanha a lagares e cooperativas [C,B].
   - O Sprout deve propor-se como **originador e verificador de colateral** para um banco parceiro. Isso resolve também a reserva de atividade de crédito (nota 40, §9.5) e torna o fosso de "lote financiável" mensurável (secção 10.2).
10. **Medir o fosso desde o dia 1.** Indicadores:
    - *advance rate* obtido por lote certificado face a não certificado;
    - custo de *funding* por série;
    - percentagem da oferta dos lagares âncora sob contrato;
    - prazo médio de pagamento ao produtor;
    - número de membros compradores ativos;
    - quebras de reconciliação.

    São estes os números que um investidor de *venture* vai pedir, por comparação com Liv-ex e Covantis.
11. **Não tentar levantar capital de risco com a narrativa "marketplace agro".** Os comparáveis financiados com avaliações altas em 2021–22 (Choco, Masterworks; Frubana como aviso) mostram que o capital de risco premiou escala e *software*, e castigou margem fina com logística [C,M/B]. O Sprout deve financiar o piloto com capital próprio e *business angels* do setor, e levantar capital de risco só depois de provar o fosso do lote financiável.

---

## 13. Itens não verificados — lista de verificação priorizada

Fazer **antes** de usar no *business plan* ou no *deck*. Ordem = impacto na decisão.

1. **Comissões, juros e incumprimentos de Raize, Goparity, Miimosa e Lendahand.** KIIS de 3 campanhas recentes de cada uma, página de estatísticas, registo ESMA de prestadores ECSP [R20] e lista da CMVM. Confirmar o **estado ECSP da Goparity** e as datas de autorização.
2. **Prática de corretagem no granel de azeite** (taxa, quem paga, prazos). Por entrevista a 2–3 corretores PT/ES e ao Lagar do Val.
3. **Existência de plataformas digitais de granel de azeite em PT/ES** (2024–2026). Pesquisas sugeridas: "plataforma venta aceite granel online", "marketplace azeite granel", "subasta aceite granel cooperativas".
4. **AdC, ERSE e ENSE sobre combustíveis:** estudos e decisões da AdC; relatórios de margens da ERSE; aplicação efetiva da Lei 69-A/2021; peso dos impostos no PVP em 2025–26.
5. **CrowdFarming:** receita 2024/2025, número de agricultores e clientes, comissão retida, condições da adoção de oliveiras (preço e litros por ano).
6. **Liv-ex:** número de membros, comissões, regras de liquidação e armazém.
7. ***En primeur*:** corretagem dos *courtiers* (~2%) e evolução das campanhas 2023–2026.
8. **Masterworks, Vint, AcreTrader, FarmTogether:** comissões atuais e via regulatória nas *offering circulars* e formulários D (SEC EDGAR [R19]); estado das empresas em 2026.
9. **Stenn:** cronologia da administração, montantes e conclusões dos administradores. **Greensill:** conclusões da FINMA e do *Treasury Committee* britânico.
10. **Choco, Agrofy, Tridge, Algrano, Grão Direto, Frubana:** rondas, avaliações e estado em 2026.
11. **Agrimp, Freshflow, Tradecloud:** confirmar o que fazem (aqui tratados como fora do perímetro).
12. **Adiantamentos de campanha** de caixas rurais (ES) e do Crédito Agrícola (PT) a lagares: condições e taxas.
13. **Poolred:** regras de adesão, operadores aderentes e uso como índice contratual (licença de uso dos dados).
14. **Regime da recompensa em espécie** na Lei 102/2015 (comunicação à DGC) e fronteira com a Ley 43/2007 e com o alerta CMVM.

---

## Fontes

Data de acesso indicada: 13-10-2026.

- **[F]**: URL citado e consultado hoje por esta investigação (via notas 10–40), através de extratos de motor de pesquisa ou leitura direta, conforme indicado nessas notas.
- **[C]**: URL canónico para verificação, **não acedido nesta sessão** (sem pesquisa web e sem leitura direta disponíveis).

**Comparáveis e mercado (todos [C], não acedidos)**

- [R1] Agrofy — https://www.agrofy.com.ar/
- [R2] Grão Direto — https://www.graodireto.com.br/
- [R3] Covantis — https://www.covantis.io/
- [R4] Choco — https://choco.com/
- [R5] Frubana — https://www.frubana.com/
- [R6] Tridge — https://www.tridge.com/
- [R7] Algrano — https://www.algrano.com/
- [R8] Liv-ex — https://www.liv-ex.com/
- [R9] Mintec / Expana — https://www.mintecglobal.com/
- [R10] Tradecloud — https://www.tradecloud1.com/
- [R11] Freshflow — https://www.freshflow.ai/
- [R12] Poolred (Fundación del Olivar) — https://www.poolred.com/
- [R13] Dcoop — https://www.dcoop.es/ ; Interóleo — NV (domínio não confirmado)
- [R14] Miimosa — https://miimosa.com/ ; AMF (registo de prestadores) — https://www.amf-france.org/
- [R15] Goparity — https://goparity.com/ ; CMVM — https://www.cmvm.pt/
- [R17] Lendahand — https://www.lendahand.com/ ; AFM (registos) — https://www.afm.nl/en/sector/registers
- [R18] CrowdFarming — https://www.crowdfarming.com/
- [R19] SEC EDGAR (Masterworks, Vint: *offering circulars* Reg A+) — https://www.sec.gov/edgar/search/ ; Masterworks — https://www.masterworks.com/ ; Vint — https://www.vint.co/
- [R24] Cult Wines — https://www.wineinvestment.com/
- [R25] Wine Owners — https://www.wineowners.com/
- [R26] AcreTrader — https://acretrader.com/ ; FarmTogether — https://farmtogether.com/ ; Farmfolio — https://farmfolio.net/
- [R28] *SEC v. W.J. Howey Co.*, 328 U.S. 293 (1946) — https://supreme.justia.com/cases/federal/us/328/293/
- [R29] Incomlend — https://www.incomlend.com/
- [R30] Tradewind Finance — https://www.tradewindfinance.com/
- [R31] Stenn — https://www.stenn.com/ (estado após a administração NV)
- [R32] FINMA (procedimento Credit Suisse/Greensill, fev. 2023) — https://www.finma.ch/en/news/ ; UK Parliament, Treasury Committee, "Lessons from Greensill Capital" (2021) — https://committees.parliament.uk/
- [R33] Qingdao (2014) e Hin Leong (2020): verificar na imprensa financeira (Reuters, FT, Bloomberg) — sem URL verificado nesta sessão
- [R34] Galp (refinaria de Sines; fim da refinação em Matosinhos) — https://www.galp.com/ ; CLC — https://www.clc.pt/
- [R35] ERSE (combustíveis: preços e margens) — https://www.erse.pt/ ; ENSE — https://www.ense-epe.pt/
- [R36] Lei 69-A/2021 (Diário da República) — https://diariodarepublica.pt/
- [R37] Autoridade da Concorrência — https://www.concorrencia.pt/

**Regulatório, mercado e infraestrutura reutilizados das notas 10–40 ([F], consultados hoje nessas notas)**

- [R16] Iberian Lawyer, Abreu/Raize, autorização ECSP — https://iberianlawyer.com/?p=189959
- [R20] Reg. (UE) 2020/1503 (ECSP), EUR-Lex — https://eur-lex.europa.eu/eli/reg/2020/1503/oj/eng ; ESMA, portal de registos ([C], não acedido) — https://registers.esma.europa.eu/
- [R21] ESMA, Q&A ECSP (SPV, art. 3.º(6), art. 8.º) — https://www.esma.europa.eu/node/200683 ; cópia — https://www.dirittobancario.it/wp-content/uploads/2022/05/ESMA-QA-Crowdfunding-ECSPR.pdf ; Bird & Bird — https://www.twobirds.com/en/insights/2021/germany/ecspr-ongoing-requirements-and-conduct-obligations-for-crowdfunding-services
- [R22] DL 66/2023 — https://files.diariodarepublica.pt/1s/2023/08/15300/0000200029.pdf ; Lei 102/2015 republicada (Lexpoint) — https://lexpoint.pt/Fileget.aspx?FileId=50645
- [R23] Lemonway, preçário *marketplace* — https://lemonway.com/en/pricing-marketplace ; Lemonway, "About" — https://lemonway.com/en/about-lemonway ; Crowdfund Insider (licença ACPR) — https://www.crowdfundinsider.com/?p=134677
- [R27] Precedentes:
  - City of London Police, whisky (11-2023) — https://www.cityoflondon.police.uk/news/city-of-london/news/2023/november/dont-make-pour-decisions-that-leave-your-finances-on-the-rocks-city-of-london-police-urges-people-to-stay-vigilant-over-misleading-whisky-investment-ads/
  - ASA/Capgroup (07-2026) — https://whiskymonkeys.com/en/news/uk-watchdog-cracks-down-on-whisky-cask-investment-firm-over-misleading-claims
  - UKSC, Asset Land [2016] UKSC 17 — https://caselaw.nationalarchives.gov.uk/uksc/2016/17
  - FCA, Capital Alternatives — https://www.fca.org.uk/news/press-releases/fca-wins-case-against-capital-alternatives
  - FCA, Park First — https://www.fca.org.uk/news/news-stories/fca-action-respect-park-first-limited
  - Afinsa e Fórum Filatélico (LegalToday) — https://www.legaltoday.com/actualidad-juridica/noticias-de-derecho/la-audiencia-nacional-condena-a-11-directivos-de-afinsa-con-penas-de-hasta-12-anos-de-prision-2016-07-28/
  - Ley 43/2007 (reprodução) — https://www.granada.org/inet/wordenanz.nsf/712f4d0bcb4a7b72c125788d002413aa/1340e9b59da1b556c1257d23003a98c7!OpenDocument
  - Alerta CMVM Cimovelpark (ECO, 21-09-2020) — https://eco.sapo.pt/2020/09/21/nem-na-crise-da-divida-soberana-houve-tanta-gente-a-tentar-enganar-investidores/
- [R38] MAPA, estudo da cadeia de valor do AOVE 2019/20 — https://www.mapa.gob.es/dam/mapa/contenido/alimentacion/temas/consumo-y-tendencias-en-alimentacion/observatorio-cadena-alimentaria-abril-2016/estudios-e-informes/estudiodelacadenadevalordelaove2019-202008062021.pdf ; MAPA, estudo 2018/19–2019/20 — https://www.mapa.gob.es/dam/mapa/contenido/alimentacion/temas/consumo-y-tendencias-en-alimentacion/observatorio-cadena-alimentaria-abril-2016/estudios-e-informes/estudiodecadenadevalordelaovecampanas2018-20192019-2020.pdf
- [R39] Deoleo, resultados de 2025 — https://deoleo.com/en/deoleo-increases-ebitda-by-50-to-e50m-and-achieves-a-net-profit-of-e20m/ ; Forbes Portugal (Sovena) — https://www.forbespt.com/forbes-os-50-mais-ricos-manuel-alfredo-de-mello-e-os-milhoes-do-negocio-do-azeite/
- [R40] Jerónimo Martins, relatório anual de 2025 (Recheio) — https://reports.jeronimomartins.com/annual-report/2025/management-report/environment-in-2025/portugal.html ; Informa D&B/DBK (grossistas para hotelaria) — https://www.informadb.pt/media/jutmyonc/20260223_sumario_dbk_grossista_produtos_alimentares_hotelaria.pdf
- [R41] MFAO extinta (eInforma) — https://www.einforma.com/informacion-empresa/mfao-rectora-mercado-futuros-aceite-oliva ; Wikipédia (MFAO) — https://es.wikipedia.org/wiki/Mercado_de_Futuros_del_Aceite_de_Oliva
- [R42] Poolred via Agroinformación (nov. 2025) — https://agroinformacion.com/el-precio-en-origen-del-aceite-de-oliva-virgen-extra-sube-un-53-la-ultima-semana-y-se-situa-en-462-euros-el-kilo-segun-el-sistema-poolred/
- [R43] Diretiva 2009/54/CE (águas minerais naturais) — https://eur-lex.europa.eu/eli/dir/2009/54/oj
- [R44] Tribunal da Relação de Guimarães (contrato de fornecimento de café: comodato e exclusividade) — https://jurisprudencia.pt/acordao/220334/
