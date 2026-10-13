# 40 — Risco e coberturas: stock físico de azeite, água e café financiado com janelas de liquidação de 18 meses

> Documento de investigação para o Sprout (marketplace B2B fechado de commodities agroalimentares, Portugal, rails UE).
> Data de referência: **13/10/2026**. Fonte de partida: `docs/fonte/plano-estrategico-10-13.md` (entregável "Tesouraria — Risco & Coberturas: definir política de hedge e contrapartes; playbook de refunding por lote").
> Lê-se em conjunto com `10-mercado.md` (preços e cadeia de valor) e `20-regulatorio.md` (qualificação jurídica do produto de investimento).

---

## Método, etiquetas e limitações (ler primeiro)

**Etiquetas**

| Etiqueta | Significado |
|---|---|
| **[F]** | Facto com fonte e URL (ver "Fontes") |
| **[C]** | Conhecimento de referência estável (norma, especificação contratual, artigo de lei) **não reconfirmado online nesta sessão**. Deve ser verificado no URL primário indicado antes de entrar em documentos para investidores |
| **[E]** | Estimativa nossa, com o método explícito |
| **[I]** | Inferência ou opinião nossa |
| **NV** | Não verificado |

Confiança: **A** (alta), **M** (média), **B** (baixa).

**Limitação desta sessão.** O orçamento partilhado de pesquisas web esgotou-se após uma única pesquisa (sobre o MFAO). A leitura direta de páginas falhou por DNS, e a política de saída de rede bloqueou os domínios primários: EUR-Lex, ESMA, CMVM, ICE, BCE, Banco de Portugal, COI, INE, Agri-food Data Portal, COSEC e Poolred.

Em consequência, este documento:
1. **reutiliza factos com fonte** recolhidos hoje (13/10/2026) nas notas `10-mercado.md` e `20-regulatorio.md`, que citam os URL originais;
2. acrescenta a pesquisa própria sobre o MFAO;
3. usa **conhecimento de referência [C]** para especificações e normas estáveis, sempre assinalado;
4. constrói **modelos próprios [E]** (carry, VaR, stress tests), reprodutíveis com os parâmetros indicados.

Nenhum número [C]/[E]/NV deve ir para um *deck* de investidores sem a verificação listada na secção 10.

---

## 0. Sumário executivo

1. **Não existe hoje cobertura em bolsa para o azeite.** O MFAO (Jaén) abriu em fevereiro de 2004. O seu sistema de compensação foi reconhecido pelo Governo espanhol em dezembro de 2003. Iniciou a dissolução em 2016, sobretudo pelo custo do EMIR, e o código de mercado (MIC XSRM) consta como **expirado, "MARKET IS CLOSED", última atualização em janeiro de 2017**. [F,M] Tudo o que resta é físico ou bilateral: contratos a prazo com lagares, indexação a Poolred/Infaoliva/DG AGRI/SIMA, fixação diferida de preço, *back-to-back* e opções OTC feitas à medida (sem mercado líquido conhecido).
2. **O risco de preço do azeite é de ordem de grandeza superior a qualquer *spread* plausível.**
   - Variação de **+160%** entre abr. 2022 (3,45 €/kg) e jan. 2024 (8,99 €/kg) e de **−63% a −66%** desde o pico até out. 2026 (3,10–3,34 €/kg). [F→I]
   - A volatilidade anualizada indicativa, estimada com os pontos disponíveis, é de **23–42%** [E].
   - Numa detenção de 18 meses, o VaR a 95% (perda unilateral) é de **37–57%** do valor do stock [E]. A margem bruta de *trading* de granel é de 4–9% [E].
3. **O custo de carregar stock (carry) é material** [E]: **~3,6% a 3 meses** e **~20% a 18 meses** do valor do lote, no cenário base (armazenagem 4 €/t/mês, seguro 0,2%/ano, custo de capital 8%/ano, análises, perdas e risco de desclassificação). O intervalo vai de 15% a 31% a 18 meses, conforme os pressupostos. O financiamento representa ~60% do carry.
4. **Conclusão estrutural [I]:** os 18 meses não podem ser o **prazo de detenção** do stock, só o **prazo legal máximo do financiamento**. Desenho proposto:
   - vencimento esperado a ~12 meses, alinhado com uma campanha (compras em nov.–fev., vendas até out.);
   - 6 meses de amortecedor para extensão condicionada;
   - stock com rotação de 2–4 meses e maioritariamente vendido *back-to-back*.
5. **A degradação de qualidade é um risco de base real** [C]: o azeite virgem extra (AOVE) tem limites legais (acidez ≤0,8%, peróxidos ≤20 meq O₂/kg, K232 ≤2,50, K270 ≤0,22, painel sem defeitos). A oxidação e a perda de frutado podem desclassificá-lo para "virgem" em 12–18 meses se as condições forem más ou se o lote entrar perto dos limites. Hoje o prémio AOVE–lampante está comprimido em 0,24 €/kg [F,M], pelo que a perda por desclassificação é baixa, mas historicamente chegou a 0,75 €/kg.
6. **O café é cobrível em bolsa**, com futuros ICE Arabica (KC) e Robusta (RC). Ainda assim, a granularidade não serve o piloto: um contrato KC são 37.500 lb (~17 t, ~107 mil USD a 2,85 USD/lb) [C/F]. A recomendação é comprar café verde **em euros, a preço fixo, a importador da UE** (que seja "operador" EUDR) e só usar ICE e *forwards* EUR/USD acima de ~50–100 t/ano [I].
7. **A água não tem cobertura financeira útil.** Os riscos são de custo (PET a ~1.250 €/t em ago. 2026 [F,B]; combustível, com o setor em "emergência" em maio de 2026 [F,M]; depósito SDR de 0,10 €/embalagem [F,A]) e de sazonalidade. Gerem-se por contrato (preço anual indexado com tetos, sobretaxa de combustível, reserva de capacidade no verão), e não por *hedge*.
8. **O risco de crédito B2B em Portugal é alto e o colateral sobre mercadoria é juridicamente exigente.**
   - Só **20,2%** das empresas pagam a horas (**11%** na restauração, com 30 dias de atraso médio) [F,A].
   - O penhor de coisas móveis exige, em regra, desapossamento ou composse (CC art. 669.º) [C]. O penhor bancário sem desapossamento é exclusivo de instituições de crédito [C].
   - A propriedade de bens genéricos só se transfere com individualização do lote (CC art. 408.º/2) [C].
   - Daí: tanques identificados e selados, contrato de depósito tripartido com o lagar e um *collateral manager* independente.
9. **"Refunding" tem de ser redefinido.** Como "reembolso garantido ao investidor" é captação de fundos reembolsáveis e repete o padrão Afinsa/Fórum Filatélico ([F,A], ver nota 20). Propomos quatro mecanismos definidos com precisão:
   - extensão condicionada com compensação;
   - amortização antecipada parcial (*cash sweep*);
   - refinanciamento (o *refunding* em sentido técnico);
   - reserva de primeira perda alimentada pelo *spread*.
10. **Stress test do *book* ilustrativo** (500 k€, 147 t de AOVE, almofada de 15%) [E]:
    - choque de −30% no preço sem cobertura: perda de **150 k€**, dos quais ~75 k€ (≈17%) para os obrigacionistas;
    - o mesmo choque com a política proposta (≤25% em aberto): perda de **60 k€**, absorvida pela almofada;
    - uma venda a prazo sem stock físico, com quebra de colheita (+60%): **−300 k€**, o cenário mais destrutivo de todos;
    - o cenário combinado excede a almofada em ~25 k€ (5% do *book*): exige extensão com *cash sweep*.

---

## 1. Azeite

### 1.1 Existe um mercado de futuros de azeite? O caso MFAO

| Data | Facto | Etiqueta |
|---|---|---|
| dez. 2003 | Acordo do Governo espanhol reconhece o sistema de compensação e liquidação do MFAO como sistema espanhol de derivados, ao abrigo da Lei 41/1999 (BOE, 17/12/2003) | [F,A] |
| fev. 2004 | Início de negociação em Jaén (MFAO, Mercado de Futuros del Aceite de Oliva; sociedade reitora supervisionada pela CNMV) | [F,M] |
| 2010 | Primeiro ano com lucro. O presidente atribuía a fraca atividade a preços estagnados e à incerteza | [F,M] |
| 2016 | Início da dissolução, atribuída sobretudo ao impacto regulatório e de custo do EMIR (compensação, reporte, capital da contraparte central). A sociedade reitora consta como **extinta** em registos comerciais | [F,M] |
| jan. 2017 | O registo MIC (ISO 10383) lista o mercado **XSRM** como **expirado**, com a nota "MARKET IS CLOSED" | [F,M] |
| Volumes negociados (contratos/ano, *open interest*) | **NV.** Não obtidos nesta sessão. A imprensa da época descreve liquidez baixa e concentrada em poucos operadores | NV |
| Especificação do contrato (lote, qualidades entregáveis) | **NV.** Conhecimento não confirmado: contratos sobre AOVE, virgem e lampante com entrega física em armazéns autorizados | NV |

**Leitura [I].** O MFAO falhou por três razões:
- falta de liquidez: os embaladores grandes (Deoleo, Sovena, Acesur) preferiram contratos bilaterais e integração vertical;
- risco de base elevado: azeite de qualidades e origens diferentes;
- custo fixo de uma contraparte central sob o EMIR, desproporcionado para um mercado pequeno.

Não há, a 13/10/2026, notícia verificada de um substituto em bolsa (nem em Espanha, nem em Itália, nem no ICE ou na Euronext). Com uma verificação de 2 minutos ao MIC e às listas de produtos da Euronext e do ICE, pode confirmar-se que continua assim.

**Consequência:** qualquer documento que fale em "hedge" de azeite tem de especificar o instrumento físico ou bilateral. "Hedge funds" ou "taxas de cobertura" genéricas não existem para este produto.

### 1.2 Instrumentos de gestão de risco de preço que restam

| Instrumento | Como funciona | Quem oferece | Eficácia | Custo/risco residual | Qualificação MiFID [F/C] | Uso no Sprout [I] |
|---|---|---|---|---|---|---|
| **Back-to-back** (compra só contra venda contratada) | O Sprout fixa a compra ao lagar e a venda ao cliente no mesmo dia, ao mesmo índice ou com a mesma referência | Interno | **Alta**: elimina o risco de preço do lote | Risco de incumprimento do comprador (renegociação se o preço cair) e do produtor (se o preço subir) | Contrato físico comercial: não é instrumento financeiro (ESMA C6/C7) [F,M] | **Instrumento principal** |
| **Contrato a prazo de preço fixo com o lagar** | O preço é fixado hoje para entregas faseadas (ex.: 12 tranches mensais), com armazenagem no lagar até à entrega | Lagares e cooperativas | Alta para o lado da compra; abre posição longa se não houver venda | O produtor incumpre se o mercado subir (quebra de colheita); exige penalização e garantia | Físico/comercial | Só com venda casada ou dentro do limite de posição aberta |
| **Contrato indexado** (Poolred, Infaoliva, DG AGRI, SIMA) | Preço = média do índice nas *n* semanas anteriores à entrega ± prémio de origem/qualidade | Prática corrente em Espanha e Portugal [C] | Transfere o risco de preço para a data de entrega; o Sprout fica com a margem fixa (prémio) | Risco de base (lote português vs. índice de Jaén) e risco de manipulação de índices pouco profundos | Físico/comercial | **Recomendado** para compras e vendas a 1–12 meses |
| **Preço a fixar** ("venda a resultas"/fixação diferida) | O lagar entrega ou deposita e escolhe o momento de fixar o preço dentro de uma janela, contra o índice | Cooperativas e embaladores espanhóis [C] | O risco fica com o produtor até à fixação | Exige financiar o stock enquanto não há preço; conflito se o produtor esperar demasiado | Físico | **Útil**: fixação simultânea com a venda ao cliente equivale a *back-to-back* automático |
| **Financiamento de stock com penhor e *haircut*** (*inventory finance*) | O investidor/SPV empresta ao produtor contra stock penhorado, com LTV de 50–65%; o produtor mantém o risco de preço; chamada de margem se o LTV subir | Bancos e *trade finance* | Muito alta para o credor, se o colateral estiver controlado | Risco jurídico (reserva de atividade de crédito no RGICSF, ver 5.3 e 10) e operacional (controlo do stock) | Crédito, não derivado | **Alternativa estrutural preferível** a que o investidor "possua" stock (ver 5.3) |
| **Opção OTC / preço mínimo garantido** | O comprador ou o *trader* garante um preço mínimo ao vendedor contra prémio, ou o inverso | Bilateral, feito à medida. **Não conhecemos mercado líquido nem *market maker*** (NV) | Média | Prémio alto e contraparte única. Se for liquidado em dinheiro, é derivado MiFID (C(10)) e cai no EMIR | Derivado se liquidado em dinheiro [F] | **Proibido no piloto**, salvo cláusula de preço mínimo embutida num contrato físico |
| **Cobertura cruzada** (girassol, colza ou palma em bolsa) | Futuros de outros óleos vegetais | Euronext, Bursa | **Baixa**: os ciclos do azeite são de oferta mediterrânica e quase não correlacionam (2023/24: azeite +160%, óleos vegetais em queda) [I] | Risco de base enorme | Derivado | **Proibido** |
| **Armazenagem estratégica** (*carry*) | Comprar em época de colheita e vender mais tarde | Interno | Não é cobertura: é **posição especulativa** | Carry de 7–20% (ver 5.2) + risco de preço | — | Só dentro do limite de posição aberta |
| **Ajudas públicas à armazenagem privada** (OCM, Reg. 1308/2013, arts. 17.º–18.º) | A Comissão abre concursos de armazenagem privada em crises de preço baixo (abertos, por exemplo, em 2012 e 2019/20 [C/NV]) | UE | Suporte indireto ao preço (piso político) | Discricionário e lento. Em set. 2026 houve um pedido ao Conselho para ativar a reserva agrícola, com existências finais da UE de ~420 kt [F,M] | — | Não contar com elas; monitorizar como sinal |

**Índices de referência para indexação [C, a verificar]:**

| Índice | Quem publica | Base | Frequência | Notas para contratos |
|---|---|---|---|---|
| **Poolred** | Fundación del Olivar (Jaén) | Transações reais comunicadas por lagares e operadores aderentes | Diária/semanal | O mais usado em Espanha. Cobertura geográfica concentrada na Andaluzia |
| **Infaoliva** | Empresa privada (Jaén) | Preços de operações e intervalos de mercado | Diária | Útil como segunda referência. A 13/10/2026 publicava 3,10 €/kg para o AOVE [F,M] |
| **Preços DG AGRI** | Comissão Europeia (Agri-food Data Portal), com base em notificações semanais dos Estados-Membros (Reg. Exec. (UE) 2017/1185 [C]) | Mercados representativos (Jaén, Córdoba, Bari, Chania, …) | Semanal | Oficial e auditável. Tem alguma latência |
| **SIMA/GPP** | Ministério da Agricultura (Portugal) | Cotações semanais por região (Alentejo, Trás-os-Montes) | Semanal | **Referência natural para o lado português.** AOVE a granel a 3,50 €/kg na semana 39/2026; intervalo de 3,40–3,80 €/kg no início de out. 2026 [F,M] |
| **COI** | Conselho Oleícola Internacional | Preços mensais na produção (Jaén, Bari, Chania) | Mensal | Bom para séries históricas; não serve para liquidação |

**Cláusula-tipo de indexação [I]:**

> Preço do lote (€/kg) = média aritmética, nas 2 semanas anteriores à entrega, de (i) Poolred AOVE e (ii) SIMA Alentejo AOVE, acrescida de um prémio de origem/qualidade *p* acordado. Se a análise à entrega classificar o lote como "virgem", aplica-se o índice "virgem" correspondente e não há prémio.

Duas fontes reduzem o risco de manipulação e de índice pouco profundo.

**Contexto legal do contrato [C/F]:**
- Fornecedor em Espanha: a *Ley de la Cadena Alimentaria* (Lei 12/2013, alterada pela Lei 16/2021) exige contrato escrito e preço que cubra o custo efetivo de produção do produtor primário [C]. Os custos de produção espanhóis vão de **2,81 €/kg** (sebe com rega) a **4,61 €/kg** (olival de montanha) [F,M]. Aos preços de out. 2026 (3,1–3,4 €/kg), comprar abaixo do mercado a produtores tradicionais espanhóis **pode violar esta regra**.
- Fornecedor em Portugal: o DL 76/2021 limita o prazo de pagamento a 30/60 dias [F,A].

### 1.3 Volatilidade histórica dos preços na origem do AOVE

**Série com fonte (Espanha, AOVE a granel, €/kg)**, retirada de `10-mercado.md`, §1.3:

| Data | €/kg | Fonte |
|---|---|---|
| 1.ª sem. abr. 2022 | 3,45 | MAPA, via EFE/Infobae |
| 1.ª sem. abr. 2023 | 5,23 | MAPA, via EFE |
| 23–29 dez. 2023 | 8,857 | Poolred |
| **2.ª sem. jan. 2024 (máximo histórico)** | **8,988** | Poolred, via Olive Oil Times |
| jun. 2024 (Jaén) | 7,85 (+32,7% homólogo) | COI |
| dez. 2024 (Jaén) | 5,30 (−28,9% homólogo) | COI |
| fev. 2025 (Jaén) | 4,075 (−53,7% homólogo) | COI |
| 1.ª sem. abr. 2025 | 3,90 | MAPA, via EFE |
| início nov. 2025 | 4,62 | Poolred, via Agroinformación |
| mar. 2026 (Jaén) | 4,385 | COI |
| jun. 2026 (Jaén) | 3,785 | COI |
| 29 set.–5 out. 2026 | 3,34 | Poolred |
| 13 out. 2026 | 3,05–3,36 (Infaoliva: 3,10) | Infobae |

**Métricas derivadas [E/I]:**

| Métrica | Valor | Método |
|---|---|---|
| Subida máxima (mínimo → pico) | **+160,5%** (3,45 → 8,988; 21 meses) | Pontos acima |
| Queda máxima (*drawdown*) desde o pico | **−62,8%** (até 3,34) / **−65,5%** (até 3,10, Infaoliva, 13/10/2026) | Pontos acima |
| Pior janela de ~15 meses para uma posição longa | **−57%** (jan. 2024 → abr. 2025) | Pontos acima |
| Volatilidade anualizada abr. 2022–out. 2026 | **~42%** | σ² = Σ ln(Pᵢ/Pᵢ₋₁)² / Σ Δtᵢ sobre 16 pontos irregulares. Inclui o efeito da tendência e mistura fontes (Poolred/COI/MAPA) |
| Volatilidade anualizada abr. 2024–out. 2026 | **~35%** | Idem |
| Volatilidade anualizada abr. 2025–out. 2026 | **~23%** | Idem: regime pós-crise |

A amostragem esparsa **subestima** a volatilidade de alta frequência. A mistura de fontes acrescenta ruído de base. Com uma série semanal Poolred ou DG AGRI (a descarregar do Agri-food Data Portal), o cálculo deve ser refeito antes do *business plan* final.

**2015–2021: série não verificada nesta sessão.** Não incluímos números para este período por não termos acedido à série primária. O ciclo é conhecido qualitativamente [C, NV]:
- preços altos em 2015 (quebra de 2014/15);
- descida até um vale em 2019–2020 (preços em Espanha perto ou abaixo do custo do olival tradicional), com ajuda à armazenagem privada da UE e a adoção, em Espanha, de mecanismos de retirada de oferta ao abrigo do art. 167.º-A da OCM;
- recuperação em 2021.

**Ação:** descarregar a série semanal DG AGRI 2015–2026 (Agri-food Data Portal, olive oil prices) e calcular a volatilidade anual por campanha, o *drawdown* máximo em janelas de 18 meses e a sazonalidade intra-campanha.

**Tradução em risco de detenção [E]** (lognormal sem tendência, P0 = 3,40 €/kg):

| Horizonte | VaR 95% (perda unilateral) com σ = 23% | σ = 30% | σ = 42% |
|---|---|---|---|
| 3 meses | 17% (0,59 €/kg) | 22% (0,74) | 29% (0,99) |
| 6 meses | 24% (0,80) | 30% (1,00) | 39% (1,31) |
| 12 meses | 32% (1,07) | 39% (1,32) | 50% (1,70) |
| 18 meses | **37% (1,26)** | **45% (1,54)** | **57% (1,94)** |

**Leitura [I].** Mesmo no regime calmo (23%), segurar stock 18 meses expõe o lote a uma perda provável de pior caso de ~1/3 do valor. Os *spreads* realistas (diferencial granel→prateleira de 0,65–2,24 €/kg antes de custos, segundo a nota 10; margem de *trading* de granel de 0,15–0,30 €/kg [E]) não pagam esse risco. Prometer retorno a 18 meses sobre stock aberto é, na substância, vender uma posição longa alavancada em azeite.

### 1.4 Vida útil e degradação de qualidade

**Limites legais por categoria** (Reg. Del. (UE) 2022/2104, Anexo I; equivalentes à norma COI/T.15/NC n.º 3) [C, verificar no texto consolidado]:

| Parâmetro | AOVE | Virgem | Lampante | O que mede |
|---|---|---|---|---|
| Acidez livre (% ácido oleico) | ≤ 0,80 | ≤ 2,0 | > 2,0 | Hidrólise (fruto danificado, atraso na moenda). **Quase não sobe em armazenagem correta** |
| Índice de peróxidos (meq O₂/kg) | ≤ 20 | ≤ 20 | — | Oxidação primária. Sobe com oxigénio, luz e calor |
| K232 | ≤ 2,50 | ≤ 2,60 | — | Dienos conjugados (oxidação primária). **Primeiro parâmetro químico a falhar** em stock velho [C] |
| K268/K270 | ≤ 0,22 | ≤ 0,25 | — | Oxidação secundária e refinação |
| ΔK | ≤ 0,01 | ≤ 0,01 | — | Deteção de refinados |
| Ésteres etílicos (FAEE, mg/kg) | ≤ 35 | — | — | Fruto fermentado. Fixado à origem; não "cura" |
| Painel organolético | Mediana de defeito = 0; frutado > 0 | Defeito ≤ 3,5; frutado > 0 | Defeito > 3,5 | **Causa mais frequente de desclassificação em stock envelhecido** (perda de frutado, aparecimento de "ranço") [C] |

**Mecanismos de degradação e boas práticas [C]:**
- **Oxigénio:** espaço de cabeça nos tanques. Mitiga-se com inertização com azoto e tanques cheios.
- **Temperatura:** idealmente 12–18 °C e estável. Acima de ~25 °C a oxidação acelera. O verão alentejano é o período crítico.
- **Luz:** irrelevante em inox; crítica em garrafa transparente.
- **Água e borras:** o azeite não filtrado com sedimento pode fermentar e desenvolver defeitos como "borras" ou "atrojado". Mitiga-se com decantação e filtração antes da armazenagem longa.
- **Metais:** contacto com ferro e cobre catalisa a oxidação. Exige-se inox AISI 304/316.

**Data de durabilidade mínima.** Nem o Reg. 2022/2104 nem a COI impõem prazo. O Reg. (UE) 1169/2011 obriga a indicar "consumir de preferência antes de", fixado pelo operador [C].
- Prática comercial: **18–24 meses após o engarrafamento** (12–18 meses em azeites *premium* que querem preservar atributos) [C/E, NV].
- A menção do ano de colheita é facultativa e só é permitida se 100% do conteúdo vier dessa colheita [C].

**Deriva típica e risco de desclassificação [C/E; números exatos NV].**
- Em granel bem conservado (inox, N₂, <18 °C), um AOVE que entre com folga confortável (por exemplo, K232 ~1,8, peróxidos <10, frutado ≥3) mantém normalmente a categoria **12–18 meses**.
- Um lote que entre perto dos limites (por exemplo, K232 >2,2, frutado <2, ou colhido tarde) pode cair para "virgem" em **3–9 meses**, sobretudo se atravessar um verão sem controlo de temperatura.
- Em garrafa, a degradação é mais rápida depois de aberta e em PET ou vidro claro.
- *Proxies* de frescura usados fora da UE (pirofeofitinas e o rácio 1,2-DAG, nas normas alemã e australiana) são bons indicadores antecipados para o *dashboard*, mas não têm valor legal na UE [C].

**Impacto económico da desclassificação [F/I].** O diferencial AOVE–lampante comprimiu para **0,24 €/kg** em 2026 (era 0,75 €/kg um ano antes) [F,M]. O diferencial AOVE–virgem é menor. No modelo usamos 0,20–0,60 €/kg (6–18% do valor). A ferramenta de UX "rastreabilidade do lote" do documento-fonte deve mostrar a ficha analítica com data. É também o controlo de risco.

**Regras de qualidade propostas para lotes financiados [I]:**
1. Análise físico-química completa e painel organolético acreditado (laboratório ISO 17025, painel reconhecido pela COI) **na entrada e a cada 4 meses**.
2. Critério de entrada mais exigente do que o legal: K232 ≤ 2,10, peróxidos ≤ 12, K270 ≤ 0,18, frutado ≥ 2,5, defeito = 0.
3. Idade máxima à entrada de 6 meses desde a moenda. Nenhum lote fica no balanço para lá de 15 meses desde a moenda nem atravessa um segundo verão sem nova análise e decisão do Comité de Risco.
4. Gatilho de venda obrigatória em 30 dias: K232 ≥ 2,30, peróxidos ≥ 15 ou frutado < 2,0.

### 1.5 Custos de armazenagem (€/t/mês) em lagares e armazéns ibéricos

**NV: não encontrámos nesta sessão tabelas públicas de tarifas.** A prática conhecida [C] é armazenagem em tanques de inox do próprio lagar ou cooperativa, faturada por mês e tonelada, ou incluída no preço quando o lagar guarda o azeite vendido até à retirada.

**Estimativa [E] de 2–8 €/t/mês (base: 4 €/t/mês = 0,004 €/kg/mês), pelo método de custo:**
- capacidade de tanque de inox de 200–400 €/t, amortizada em 15–20 anos a 5–6% (≈1,5–3,5 €/t/mês);
- azoto, energia de climatização, limpezas e mão de obra (≈0,5–2 €/t/mês);
- margem do armazenista.

**Ação:** pedir cotação escrita ao Lagar do Val e a mais dois lagares do Alentejo (com azoto, temperatura registada, selagem e acesso de inspetor), e ainda a um armazém de granéis líquidos alimentares (por exemplo, nos portos de Sines ou Setúbal) como alternativa.

---

## 2. Café

### 2.1 Especificações dos futuros ICE [C, verificar nas páginas de produto do ICE]

| Item | **Arabica "Coffee C" (KC)**, ICE Futures U.S. | **Robusta (RC)**, ICE Futures Europe |
|---|---|---|
| Tamanho do contrato | 37.500 lb (≈ 17,0 t ≈ 283 sacas de 60 kg) | 10 t métricas (≈ 167 sacas) |
| Cotação | Cêntimos de USD por lb | USD por tonelada |
| Variação mínima | 0,05 ¢/lb = **18,75 USD** por contrato | 1 USD/t = **10 USD** por contrato |
| Meses | mar., mai., jul., set., dez. | jan., mar., mai., jul., set., nov. |
| Liquidação | Entrega física de café arábica lavado de origens elegíveis, com prémios ou descontos por origem e certificação de qualidade, em armazéns licenciados nos EUA e na Europa (incluindo Antuérpia, Hamburgo/Bremen e Barcelona) | Entrega física de robusta, com classes de qualidade, em armazéns ICE na Europa e nos EUA |
| Nocional a 9–12 out. 2026 | 2,85 USD/lb × 37.500 = **≈106.900 USD** (≈ 93 k€ a 1,15) [F/E] | 3.470 USD/t × 10 = **34.700 USD** (≈ 30 k€) [F/E] |
| Margem inicial | **NV.** É publicada pela ICE Clear US/Europe e foi revista várias vezes em 2024–2025 com a volatilidade. Ordem de grandeza: 5–15% do nocional [E] | **NV.** Idem |

### 2.2 Preços 2023–2026 (de `10-mercado.md`, §3.1)

| Referência | Valor | Data | Etiqueta |
|---|---|---|---|
| Composto ICO | 1,53 USD/lb | set. 2023 | [F,A] |
| Arabica KC, recorde | ~4,30–4,41 USD/lb | fev. 2025 | [F,M] |
| Arabica KC | 4,24 (máximo de 52 semanas) | 23/10/2025 | [F,M] |
| Arabica KC | 2,45 (mínimo de 52 semanas) | 09/06/2026 | [F,M] |
| Arabica KC | **2,85** (−24,4% homólogo; −35% desde o recorde) | 09/10/2026 | [F,M] |
| Robusta, recorde | ~5.788–5.821 USD/t | fev. 2025 | [F,M] |
| Robusta | **3.470** USD/t (contrato de nov.; −40% desde o recorde) | 12/10/2026 | [F,M] |
| Fundamentais | Colheita mundial 2026/27 prevista pela USDA em **189,7 M sacas (+6%)**. Stocks certificados de arábica no ICE no mínimo de 2,75 anos (227.992 sacas, ago. 2026) | 2026 | [F,M] |

**Leitura [I].** A curva de 2025–26 mostra quedas de 35–45% em 16–20 meses, comparáveis às do azeite. A diferença é que existe um instrumento líquido para as cobrir.

### 2.3 Custo típico de cobertura [E; componentes NV]

Exemplo: cobrir 1 contrato KC durante 6 meses.

| Componente | Ordem de grandeza | Nota |
|---|---|---|
| Comissões e taxas (corretor + bolsa + câmara) | 10–30 USD por contrato (ida e volta) [E/NV] | Irrelevante face ao nocional (~0,03%) |
| Custo de oportunidade da margem inicial | ~10% × 107 k USD × ~4%/ano × 0,5 ≈ **210 USD** [E] | Depende das taxas USD (NV) |
| **Liquidez para margem de variação** | Uma subida de 20% gera uma chamada de **~21 k USD** por contrato vendido | **É o custo real**: exige uma linha de liquidez dedicada |
| *Roll* e base | Diferenciais de origem e de qualidade face ao KC; *roll* entre vencimentos | O risco de base fica sempre com o *hedger* |
| **Total explícito** | **< 0,5% do nocional por semestre** | Mais o custo implícito da liquidez |

### 2.4 Cobertura cambial EUR/USD [C/I]

- **Exposição:** o café verde é cotado em USD e o Sprout vende em EUR. O último BCE verificado é de **1,1401 (26/06/2026)** [F,A]. O valor de out. 2026 é NV; a nota 10 usa 1,15 [E].
- **Instrumento:** *forward* cambial com banco da UE, entregável, do montante e na data de pagamento ao fornecedor.
- **Custo:** o diferencial de juro (pontos *forward*) mais o *spread* do banco (0,1–0,5% em tickets pequenos [E/NV]). Se as taxas em USD estiverem acima das do EUR, como em 2025–26 [C/NV], o comprador em EUR que compra USD a prazo obtém taxa a prazo mais favorável do que a *spot*.
- **Regulação [C]:** um *forward* cambial entregável celebrado para pagar bens identificáveis beneficia da exceção de "meio de pagamento" (Reg. Del. (UE) 2017/565, art. 10.º). Não é instrumento financeiro MiFID e, por remissão, não é derivado para efeitos do EMIR. Os futuros ICE são derivados em bolsa: uma contraparte não financeira (NFC-) tem obrigações de reporte EMIR, normalmente delegadas no corretor, e precisa de LEI. **Confirmar com o jurídico.**

### 2.5 Recomendação para o Sprout [I]

- **Piloto: sem café** (alinhado com as notas 10 e 20: EUDR aplicável a 30/12/2026 e HoReCa presa a contratos de exclusividade).
- **Fase 2:** comprar verde **em EUR, a preço fixo, a importador da UE** que seja "operador" EUDR. O importador absorve o ICE e o câmbio no preço; o custo de cobertura fica embutido no seu *spread*.
- Alternativa: contrato PTBF ("preço a fixar" contra o KC mais diferencial), com fixação simultânea à venda ao torrefator.
- **ICE direto** só acima de ~50–100 t/ano (3–6 contratos KC), com corretor regulado na UE, linha de liquidez para margens e política aprovada (secção 7).

---

## 3. Água engarrafada

### 3.1 Estabilidade de preço e fatores de risco

| Fator | Dado | Etiqueta | Peso no custo ex-fábrica [E] |
|---|---|---|---|
| Preço médio do mercado PT | ~0,24 €/L (479 M€ / ~2.000 M L, 2025) | [F/I,M] | — |
| **Resina PET** virgem *bottle grade* | ~1.250 €/t (ago. 2026, ChemOrbis); outras fontes indicam 850–1.100 €/t | [F,B] | Garrafa, tampa, rótulo e palete: 0,03–0,05 €/L (**13–20%**) |
| **rPET** alimentar (obrigatório ≥25% desde 2025, Dir. 2019/904, art. 6.º) | 1.600–1.680 €/t (início de 2025, ICIS) | [F,M]/[F,A] | O prémio do rPET encarece a garrafa e aumenta com as metas de 30% em 2030 [C] |
| **Energia e combustível** | O transporte rodoviário descreveu uma "situação de emergência" pelos combustíveis em maio de 2026 (guerra com o Irão) | [F,M] | Transporte troncal: 0,015–0,018 €/L por 300 km; *last mile* HoReCa: 0,03–0,08 €/L. **Logística total: 20–40%** |
| **Depósito SDR (Volta)** | 0,10 € por embalagem < 3 L, desde 10/04/2026; obrigatório a partir de 10/08/2026 | [F,A] | ~28% do valor de uma garrafa de 1,5 L. É **risco de tesouraria e reconciliação**, não de preço |
| **Sazonalidade** | Pico de procura no verão (jun.–set.), com tensão de capacidade nos engarrafadores e de transporte | [C] | Risco de rutura de stock e de *fill rate*, mais do que de preço |

### 3.2 Há cobertura útil? Não [I]

- **Não existe futuro europeu líquido sobre PET**: os contratos de PET e de PTA/PX negociados na China não servem um operador ibérico [C/NV].
- O gasóleo tem futuros (ICE Low Sulphur Gasoil) [C], mas a exposição do Sprout a combustível é de dezenas de milhares de euros por ano no máximo. Uma cobertura em bolsa custaria mais em estrutura do que protege.
- **Gestão por contrato:**
  1. preço anual com o engarrafador, revisão trimestral indexada a índices publicados (energia, PET) e teto/piso de ±5–8%;
  2. sobretaxa de combustível explícita com transportadores;
  3. reserva de capacidade e de stock pré-posicionado para jun.–set.;
  4. conta de depósitos SDR segregada e reconciliada diariamente (o documento-fonte já exige reconciliação diária).
- **Validade:** a água em PET tem data de durabilidade fixada pelo produtor, tipicamente de 1–2 anos [C/NV]. O risco é de armazenagem (calor, luz solar, odores) e não de desclassificação.
- **Conclusão:** a água **não deve entrar no produto de investimento** (alinhado com as notas 10 e 20). No *marketplace* B2B, o risco é operacional.

---

## 4. Crédito e contraparte

### 4.1 Risco de crédito dos compradores B2B em Portugal

| Indicador | Valor | Período | Etiqueta |
|---|---|---|---|
| Empresas que pagam dentro do prazo | **20,2%** (média europeia de 52% no fim de 2025); Portugal é penúltimo entre 37 países | maio 2026 | [F,A] |
| Distribuição dos atrasos | 65,2% até 30 dias; 9% entre 30 e 90 dias; 5,6% acima de 90 dias | maio 2026 | [F,A] |
| Alojamento e restauração | Só **11%** pagam a horas; **atraso médio de 30 dias** (o pior setor) | maio 2026 | [F,A] |
| Grossistas | Atraso médio de 19 dias | maio 2026 | [F,A] |
| Empresas em risco de atraso grave (>90 dias) | **~66 mil (12%)**, contra 43 mil um ano antes | 2026 | [F,A] |
| Juros de mora B2B | Taxa BCE + 8 p.p. (DL 62/2013) | em vigor | [F,A] |
| Prazo máximo de pagamento a fornecedores agroalimentares | 30 dias (perecíveis) / 60 dias (restantes), por escalões de volume de negócios (Dir. 2019/633; DL 118/2010 com o DL 76/2021) | em vigor | [F,A] |
| Insolvências (n.º e taxa, 2025–2026) | **NV.** Publicadas mensalmente pelo barómetro Informa D&B e nas perspetivas da Coface e da Allianz Trade | — | NV |

**Leitura [I].** A HoReCa é micro (91% microempresas, nota 10), paga tarde e tem "encerramentos silenciosos" (AHRESP, abr. 2026). O risco de crédito está no **cliente pequeno sem informação financeira**, precisamente o que as seguradoras de crédito cobrem pior.

### 4.2 Seguro de crédito: fornecedores e prémios indicativos

| Seguradora | Presença em PT [C] | Notas [C/NV] |
|---|---|---|
| **COSEC** (Companhia de Seguro de Créditos) | Seguradora portuguesa especializada | Ligada ao grupo Allianz Trade (estrutura acionista atual **NV**). Gere, por conta do Estado, os seguros de crédito à exportação com garantia do Estado |
| **Allianz Trade** (ex-Euler Hermes) | Sucursal em Portugal | Líder mundial |
| **Coface** | Sucursal em Portugal | Publica estudos de risco por país e setor |
| **Crédito y Caución / Atradius** | Sucursal em Portugal | Forte em Espanha, útil para clientes espanhóis na fase 2 |

**Prémios e condições indicativos [E/NV, pedir cotação]:**
- Apólice global B2B doméstica: **0,1%–0,6% do volume de negócios seguro**, mais alto em setores de risco como a restauração.
- **Prémio mínimo anual de alguns milhares de euros**: com GMV-piloto de 0,1–0,4 M€ (nota 10), o prémio mínimo pode exceder 1% do volume.
- Indemnização de 85–90% da perda; limites de crédito por cliente aprovados pela seguradora; limite discricionário para clientes pequenos (tipicamente alguns milhares de euros) sem análise individual; franquia ou primeira perda por conta do segurado.

**Alternativas e complementos [C/I]:**
- **Débito direto SEPA B2B:** o devedor empresarial não tem direito a reembolso de débitos autorizados, ao contrário do esquema CORE. É o instrumento mais eficaz para a HoReCa, desde que o PSP do Sprout o suporte.
- **Pré-pagamento ou pagamento na entrega** via PSP (cartão, MB Way empresas, transferência imediata com VoP).
- **Factoring sem recurso** (bancário) para clientes de maior dimensão.
- **Reserva de propriedade** (CC art. 409.º) até ao pagamento integral, estipulada por escrito até à entrega para ser oponível à massa insolvente (CIRE art. 104.º) [C]. Em azeite vendido e consumido rapidamente, o valor prático é limitado.
- **Limites internos:** limite de crédito por cliente e exposição máxima por cliente de 20% dos recebíveis (ver política).

### 4.3 Risco de entrega do produtor

| Risco | Exemplo | Mitigação contratual [I] |
|---|---|---|
| Quebra de colheita (seca, geada, calor) | Espanha 2022/23: ~660 kt (−55%) [F,M] | Força maior **com lista fechada** e prova (dados de produção do INE/SIMA, declaração da seguradora agrícola); tolerância de volume de ±10% |
| Incumprimento oportunista quando o preço sobe | O produtor vende a terceiro a preço *spot* mais alto | Penalização = (preço de reposição − preço contratado) × quantidade em falta; retenção de 5–10% do preço até à entrega final, ou garantia bancária/seguro-caução em contratos grandes |
| Falha de qualidade | Lote entregue como AOVE classifica-se como virgem | Especificação analítica no contrato; análise contraditória (amostra tripla selada); ajuste automático para o índice da categoria real |
| Concentração | O Lagar do Val é a âncora | Limite de 40–50% do *book* por produtor no piloto; segundo e terceiro lagar contratados antes da primeira emissão |
| Insolvência do produtor com o stock do Sprout lá depositado | Os credores do lagar reclamam o azeite | Individualização (tanque, selo, lote, registo de existências), contrato de depósito escrito, *collateral manager* e reconciliação física mensal (ver 4.4) |

**Nota legal [C].** O art. 437.º do CC (alteração anormal das circunstâncias) **não cobre** a volatilidade de preço, que é risco próprio do contrato (STJ, 2025, ver nota 20). Força maior e ajustes têm de estar escritos.

### 4.4 Garantias sobre mercadoria em Portugal [C, confirmar com o Gonçalo Almeida]

| Figura | Base legal | Requisitos-chave | Utilidade para o Sprout |
|---|---|---|---|
| **Penhor civil de coisas móveis** | CC, arts. 666.º e ss. | Só produz efeitos com **entrega** da coisa (ou de documento que confira a sua exclusiva disponibilidade) ao credor ou a terceiro; admite **composse** se privar o dono de dispor materialmente da coisa (art. 669.º) | Funciona com o stock depositado num terceiro (armazém ou *collateral manager*) ou num tanque selado com dupla chave |
| **Penhor mercantil** | Código Comercial, arts. 397.º–402.º | Garante obrigação comercial. Admite **entrega simbólica**, incluindo pelo endosso da cautela de penhor de mercadorias depositadas em armazéns gerais (art. 398.º) | Base para *warehouse receipts* |
| **Armazéns gerais** (conhecimento de depósito + cautela de penhor/*warrant*) | Código Comercial, arts. 408.º–424.º | Armazém geral autorizado emite títulos endossáveis | Juridicamente elegante, mas **pouco usado em Portugal** [I/NV]. Verificar se existe armazém geral que aceite granéis alimentares |
| **Penhor bancário sem desapossamento** | DL 29 833, de 17/08/1939 (e legislação conexa) | Só a favor de **instituições de crédito**; o dono mantém a posse; a disposição indevida é crime | Útil se um **banco** financiar o stock. **Não aproveita a uma SPV não bancária** |
| **Penhor financeiro** | DL 105/2004 | Só numerário, instrumentos financeiros e créditos | Não serve para mercadoria; serve para a conta de reserva |
| **Transmissão de propriedade** | CC, art. 408.º | Por mero efeito do contrato, mas, em **coisa genérica**, só com a sua **determinação** (n.º 2; ver também art. 541.º) | Um "lote" só é da SPV se estiver individualizado: tanque n.º X, selo, quantidade medida, ficha analítica |
| **Penhor e cessão de créditos** (recebíveis) | CC, arts. 679.º e ss. e 577.º e ss. | Eficácia face ao devedor com **notificação** (arts. 583.º e 681.º) | Garantir as notas com recebíveis de compradores B2B |
| Possível **penhor mercantil sem desapossamento com registo** para credores não bancários | — | **NV**: verificar se foi aprovado regime deste tipo (medida discutida no Programa Capitalizar, 2016–17) | Se existir, simplifica muito a estrutura |

**Estrutura recomendada para colateral do piloto [I]:**
1. Contrato de **depósito tripartido** entre a SPV ou OpCo (depositante/credor), o lagar (depositário) e um ***collateral manager*** independente. Para este papel, uma entidade de inspeção (SGS, Bureau Veritas, Control Union ou similar) que **detém em nome do credor** e emite certificados de existências.
2. **Tanques dedicados e selados**, com telemetria de nível e temperatura no *dashboard* (o "feed de stock" que o Pedro Marques vai fornecer). Libertação só contra ordem escrita do credor.
3. Penhor mercantil (ou propriedade, se a SPV comprar) sobre o lote individualizado, mais cessão dos recebíveis da venda.
4. Seguro do stock com a SPV como **beneficiária** (*loss payee*).

### 4.5 Seguro do stock [C/E]

- **Coberturas:** multirriscos (incêndio, inundação, fenómenos sísmicos, roubo), **derrame e contaminação** (rutura de tanque) e perdas por falha de climatização se a apólice o permitir.
- **Transporte:** apólice de mercadorias transportadas, com cláusulas tipo ICC (A).
- **Prémio indicativo:** 0,1–0,3% do valor por ano [E/NV]. No modelo usamos 0,2%.
- **Exclusões a negociar:** deterioração gradual ("vício próprio"), que normalmente é excluída. A degradação de qualidade **não é segurável**: gere-se com as regras do §1.4.

---

## 5. Desfasamento entre colheita anual e promessa de liquidez a 18 meses

### 5.1 O calendário físico

| Mês | Out | Nov | Dez | Jan | Fev | Mar–Jun | Jul–Set | Out (N+1) | Nov–Abr (N+1) |
|---|---|---|---|---|---|---|---|---|---|
| Colheita e moenda (PT/ES) | Início | Pico | Pico | Fim | — | — | — | Nova colheita | — |
| Stock disponível no lagar | Baixo | Sobe | Sobe | **Máximo** | Máximo | Desce | Mínimo | Renova | — |
| Risco de qualidade | — | Baixo | Baixo | Baixo | Baixo | Médio | **Alto (verão)** | — | Alto para azeite da campanha anterior |
| Série-tipo de financiamento (proposta) | — | **Emissão (M0)** | Compras | Compras | Compras | Vendas | Vendas | **Reembolso esperado (M12)** | **Amortecedor até M18 (vencimento legal)** |

**Leitura [I].** Uma campanha de azeite dura 12 meses. Uma nota de 18 meses só se justifica como **vencimento legal com 6 meses de amortecedor** (estrutura *soft bullet*: vencimento esperado em M12, vencimento final em M18). Não se justifica como período de detenção. Se o capital for levantado a 18 meses e o stock rodar a 3 meses, o capital fica parado parte do ano; o *book* tem de ser dimensionado à procura contratada (ver 5.5).

### 5.2 Modelo de carry do inventário [E]

Lote de **20 t de AOVE a 3,40 €/kg** (68 k€). Os parâmetros são explícitos para recalcular.

| Componente (€/kg) | 3 meses | 6 meses | 12 meses | 18 meses | Pressuposto (base) |
|---|---|---|---|---|---|
| Armazenagem | 0,012 | 0,024 | 0,048 | 0,072 | 4 €/t/mês |
| Seguro do stock | 0,002 | 0,003 | 0,007 | 0,010 | 0,20%/ano do valor |
| **Financiamento** | **0,068** | **0,136** | **0,272** | **0,408** | **8%/ano** (custo do capital do investidor) |
| Análises (físico-química + painel) | 0,015 | 0,030 | 0,060 | 0,075 | 300 € por análise, na entrada e a cada 4 meses |
| Perdas físicas (borras, decantação, manuseamento) | 0,017 | 0,017 | 0,017 | 0,017 | 0,5% uma vez |
| Desclassificação esperada | 0,009 | 0,015 | 0,045 | 0,090 | Probabilidade de 3/5/15/30% × 0,30 €/kg |
| **Carry total** | **0,123** | **0,225** | **0,449** | **0,672** | |
| **% do valor do lote** | **3,6%** | **6,6%** | **13,2%** | **19,8%** | |
| Cenário baixo (2 €/t/mês; 0,1%; 6%; 0,20 €/kg) | 2,8% | 5,1% | 10,0% | 14,7% | |
| Cenário alto (8 €/t/mês; 0,3%; 12%; 0,60 €/kg) | 5,3% | 9,8% | 20,0% | 30,7% | |

**Custo mais risco a 18 meses** = carry (~20%) + VaR95 de preço sem cobertura (37–57%, §1.3). Contra margens de 4–9% em granel [E], ou mesmo 16–34% no diferencial granel→prateleira antes de embalamento e logística (nota 10), **a detenção longa sem venda contratada não é financiável sem transferir o risco de preço para o investidor**. Isso tem as consequências regulatórias da nota 20: é derivado ou FIA, e não dívida.

### 5.3 Padrões de mitigação — definições precisas

| # | Padrão | Definição operacional | O que resolve | O que não resolve | Recomendação [I] |
|---|---|---|---|---|---|
| **P1** | **Financiamento casado por lote** (*matched funding*) | Cada lote tem financiamento próprio (sub-série ou compartimento) com vencimento = data de venda contratada + 60 dias. O reembolso vem só dos recebíveis desse lote | Transparência; sem mutualização entre investidores; fácil de auditar | Custo fixo por lote; capital parado entre lotes | **Usar para lotes grandes** (> 50 t) ou vendas a prazo a compradores de grande dimensão |
| **P2** | ***Borrowing base* rotativa** | A série financia uma carteira de lotes. O montante utilizável é a soma de (valor de mercado × *advance rate*) dos lotes elegíveis mais os recebíveis elegíveis × *advance rate*. *Advance rate* indicativo: 60–70% do stock vendido *back-to-back*, 40–50% do stock aberto, 80–85% dos recebíveis seguros [E] | Usa o capital todo o ano; o *haircut* absorve choques de preço | Exige cálculo diário e dados fiáveis (que o *dashboard* de risco já prevê) | **Padrão por defeito** para a série de piloto |
| **P3** | **Reserva de primeira perda** financiada pelo *spread* | Conta segregada (penhor financeiro a favor do agente dos obrigacionistas) alimentada por **30% da margem bruta realizada de cada lote**, até um teto de **5% do saldo vivo** das notas. Absorve perdas antes do capital sénior e não é distribuível enquanto houver notas vivas | Almofada crescente sem custo de capital explícito | Começa vazia: no início só protege o capital do patrocinador | **Obrigatório**, a par de **10% de capital subordinado do patrocinador** (*skin in the game*) |
| **P4a** | **Recompra pelo produtor** (*buy-back*) | O lagar obriga-se a recomprar o lote não vendido, numa data D, ao preço de compra mais um custo acordado | Transfere o risco residual de preço para o produtor | Risco de crédito de um produtor que, aos preços atuais, opera abaixo do custo [F,M]. Na prática é uma opção de venda vendida pelo produtor | Só com garantia bancária ou seguro-caução. **Evitar no piloto** |
| **P4b** | ***Offtake* / *take-or-pay*** com comprador B2B | O comprador compromete um volume mínimo por período, a preço fixo ou indexado; se não levantar, paga a diferença (*take-or-pay*) ou uma penalização | Garante a saída do stock e é a base do *back-to-back* | HoReCa micro não assina *take-or-pay* exequível. Só é realista com distribuidores, grupos HoReCa, embaladores e exportadores | **Exigir** *offtake* para qualquer lote acima de 10 t |
| **P5** | **Extensão condicionada com compensação** | Opção **do emitente**, prevista nos termos e condições desde o dia 0, de prorrogar o reembolso de M12 até M18 se, e só se, se verificar um **gatilho objetivo** (secção 8). Exige: aviso com 30 dias; *step-up* do cupão de **+200 a +300 p.b.** durante a extensão; ***cash sweep*** de 100% das receitas líquidas; proibição de novas compras abertas | Evita a venda forçada em mínimo de mercado | Não cria valor: só dá tempo. Se o preço não recuperar, a perda materializa-se em M18 | **Sim**, uma única extensão, divulgada como risco no documento de oferta |
| **P6** | **Amortização antecipada parcial** (*cash sweep*) | Sempre que a caixa livre da série exceda X% do saldo vivo (por exemplo, 10%), reembolso *pro rata* ao par mais juros corridos | Reduz a exposição à medida que os lotes se vendem e alinha capital com stock | Reinvestimento: o investidor recebe capital antes do previsto | **Sim**, automático e mensal |
| **P7** | **Refinanciamento** (*refunding* em sentido técnico) | Reembolso de uma série com o produto de uma nova série; o investidor pode optar por receber em dinheiro ou trocar para a nova série (*rollover*) | Continuidade do financiamento entre campanhas | Depende de acesso a novo capital: **não pode ser prometido**; em crise falha precisamente quando é preciso | **Sim, como opção, nunca como garantia** |
| **P8** | **Liquidação em espécie** | Entregar azeite em vez de dinheiro aos investidores que optem | Sai do stock sem vender em mínimo | IVA (6%) não dedutível para particulares; logística; problemas de qualificação C6/C7 e MiFID (nota 20) | **Não usar** |
| ✖ | **"Refunding" como reembolso garantido** ao investidor em caso de choque | Promessa de devolver o capital ou o capital mais um retorno, independentemente do resultado dos lotes | — | **Captação de fundos reembolsáveis** (reservada a bancos); padrão Afinsa/Fórum Filatélico (ativo tangível + recompra prometida) [F,A] | **Proibido**. A palavra "refunding" sai dos materiais para investidores |

**Hierarquia de absorção de perdas (*waterfall*) proposta [I]:**
1. margem do próprio lote;
2. reserva de primeira perda (P3);
3. capital subordinado do patrocinador (10%);
4. extensão (P5) com *cash sweep* (P6);
5. obrigacionistas sénior.

Atenção: subordinar o patrocinador sobre carteiras com **recebíveis** pode configurar *tranching* de risco de crédito, com efeitos no Regulamento de Titularização (UE) 2017/2402 (nota 20). **Validar com o jurídico.**

**Alternativa estrutural preferível [I]: financiar o produtor e não possuir o stock.** A SPV financia o stock do lagar com penhor, LTV máximo de 60–65% e chamada de margem a 75%. O lagar mantém o risco de preço. Com LTV de 60%, uma queda de 30% leva o rácio a ~86% (0,60/0,70) **sem perda para o credor**, desde que o colateral esteja controlado.

**Risco jurídico NV:** a concessão de crédito a título profissional é atividade reservada em Portugal (RGICSF). Pode ser necessário enquadrá-la como **pré-pagamento comercial de mercadoria** pela OpCo, com cessão da posição à SPV, ou recorrer a um banco parceiro como mutuante, com a SPV a subscrever ou a participar. **Pergunta n.º 1 para o Gonçalo.**

### 5.4 Stress tests do *book* ilustrativo [E]

**Pressupostos:**
- *Book* de **500 k€** em AOVE a 3,40 €/kg (≈147 t), financiado por notas sénior de 450 k€ e capital subordinado do patrocinador de 50 k€.
- Reserva de primeira perda já constituída em 25 k€ (5%). **Almofada total = 75 k€ (15%).**
- Política: ≤25% do stock em aberto; 75% vendido *back-to-back*; recebíveis de 150 k€.

| Cenário | Descrição | Perda sem a política | Perda com a política | Para os obrigacionistas sénior (com a política) |
|---|---|---|---|---|
| **S1** Choque de preço −30% | Queda imediata de 30% no índice | **−150 k€** (stock todo aberto) → obrigacionistas perdem ~75 k€ (**≈17%**) | **−60 k€**: 37,5 k€ do stock aberto mais 22,5 k€ de 20% dos compradores *back-to-back* que renegoceiam | **0** (almofada remanescente de 15 k€) |
| **S2** Quebra de colheita | Preço +60%; os produtores entregam só 70% do contratado a prazo, já vendido a preço fixo | Sem força maior nem tolerância: o stock aberto ganha +75 k€ e a recompra da falta custa −67,5 k€ (**+7,5 k€ líquido**) | Com força maior e tolerância repassadas ao comprador (falta líquida de 20%): +75 k€ − 45 k€ = **+30 k€** | 0 |
| **S2b** Venda a prazo **sem** stock nem contrato de compra firme | Vender 100% a prazo, a preço fixo, sem físico, e o preço subir +60% | **−300 k€** (≈60% do *book*) | Proibido pela política | **Perda de ~225 k€ (50%)** se fosse permitido |
| **S3** Incumprimento de compradores | 10% dos recebíveis | −15 k€ | Com seguro de crédito (limites sobre 70% dos recebíveis e indemnização de 90%): **−5,6 k€** | 0 |
| **S4** Desclassificação | 25% do stock passa de AOVE a virgem; penalização de 0,30–0,60 €/kg | −11 k€ a −22 k€ | Igual, mas reduzida pelas regras de qualidade (entrada exigente, testes a cada 4 meses) | 0 |
| **S5** Combinado | S1 (com a política) + S3 (com seguro) + S4 (0,45 €/kg) + atraso de 3 meses nas vendas (carry extra de 3,6% ≈ 18 k€) | ≈ −250 k€ sem política | **≈ −100 k€** | Excede a almofada em **~25 k€ (5,6% da série sénior)**. Ativa a **extensão P5** com *cash sweep*; se o preço não recuperar até M18, perda de ~5–6% para os sénior |

**Ritmo de constituição da reserva (P3) [E].** Com 4 rotações por ano (~590 t/ano) e 30% da margem bruta para a reserva:

| Margem bruta | Margem bruta anual | Contributo anual para a reserva | Meses até 5% (25 k€) |
|---|---|---|---|
| 0,15 €/kg | 88 k€ | 26 k€ | 11 |
| 0,20 €/kg | 118 k€ | 35 k€ | 8,5 |
| 0,30 €/kg | 176 k€ | 53 k€ | 5,7 |

**Alerta de escala [I].** ~590 t/ano (≈2,0 M€ a preço de compra) é **5 a 20 vezes** o GMV-piloto HoReCa estimado na nota 10 (0,1–0,4 M€). O *book* de 500 k€ só é realista com compradores a montante (distribuidores, embaladores, exportadores). Para um piloto só HoReCa, a série deve ter **100–150 k€**.

### 5.5 Regras de dimensionamento que saem dos testes [I]

1. **Exposição aberta máxima** = (capital subordinado + reserva de primeira perda) ÷ 0,30, ou 25% do *book*, o que for menor. Garante que um choque de −30% não toca no sénior.
2. **Tamanho da série** ≤ 3 meses de vendas contratadas (*offtake* assinado) + 1 mês de stock de segurança.
3. **Proibição absoluta** de venda a prazo sem stock físico ou contrato de compra firme de produtor com garantia (o cenário S2b é o único que destrói a estrutura).
4. **Seguro de crédito ou SEPA B2B** obrigatório para recebíveis contados na *borrowing base*.

---

## 6. Seguros agrícolas e paramétricos

| Instrumento | Enquadramento [C, NV nos detalhes] | Quem compra | Relevância para o Sprout [I] |
|---|---|---|---|
| **SIPAC / seguro de colheitas** (Portugal) | Sistema Integrado de Proteção contra as Aleatoriedades Climáticas: seguro de colheitas com apoio público ao prémio, mecanismos de compensação e Fundo de Calamidades. As coberturas típicas para olival incluem incêndio, raio, granizo, geada, tornado e tromba de água; **a seca não é, em regra, coberta pelo seguro de colheitas clássico** (NV). O apoio aos prémios é enquadrado pelo PEPAC 2023–2027 | Produtor | **Exigir prova de seguro ao produtor** nos contratos a prazo; aumenta a capacidade do lagar de honrar penalizações |
| **Regra UE de apoio a seguros** | Reg. (UE) 2021/2115, art. 76.º: apoio até **70%** dos custos elegíveis; perdas acima de um limiar não superior a **20%** da produção média [C] | Estado-Membro → produtor | Explica porque o seguro agrícola é barato para o produtor |
| **Agroseguro** (Espanha) | Sistema de *Seguros Agrarios Combinados* (Lei 87/1978): plano anual com subvenção da ENESA; linha de olival com coberturas de granizo, geada, incêndio, vento e "restantes adversidades climáticas" em certos módulos (NV se inclui seca no olival de sequeiro) | Produtor espanhol | Na fase 2 (compras em Espanha), exigir apólice Agroseguro ao fornecedor |
| **Seguro paramétrico** (índice de chuva, temperatura ou NDVI por satélite) | Paga quando o índice cruza um limiar, sem peritagem. Há exemplos institucionais de índice satélite para pastagens (Agroseguro) [C/NV]; resseguradoras e *MGAs* oferecem coberturas à medida | Produtor, cooperativa ou comprador | **Risco de base** (o índice não é a produção do lagar). O risco do Sprout não é a colheita, é o preço e a entrega. **Não comprar no piloto**; reconsiderar se houver contratos a prazo plurianuais com volume garantido |
| **Ajuda à armazenagem privada e reserva agrícola UE** | OCM, arts. 17.º–18.º e 219.º e ss.; em set. 2026 havia um pedido ao Conselho para ativar a reserva agrícola [F,M] | Mercado | Piso político incerto: **sinal**, não cobertura |

---

## 7. TEMPLATE — Política de Cobertura de Risco (Hedge Policy) do Sprout

> **Estado:** minuta v0.1 para adaptação. Aprovação: Conselho de Administração da OpCo e órgão de administração da SPV, antes da primeira emissão. Revisão: anual, ou após qualquer violação de limite ou cenário S5.

**1. Objetivo**
1.1 Proteger o capital dos obrigacionistas e a margem operacional contra variações de preço, qualidade, crédito, entrega e câmbio associadas aos lotes físicos financiados.
1.2 **A cobertura não é fonte de lucro.** É proibida qualquer posição com intenção especulativa.

**2. Âmbito**
2.1 Produtos: azeite (AOVE e virgem), água engarrafada (só *marketplace*, fora do produto de investimento) e café verde (fase 2).
2.2 Entidades: Sprout Marketplace (OpCo) e Sprout Capital (SPV).

**3. Apetite de risco e limites**

| Limite | Valor do piloto | Medição |
|---|---|---|
| Exposição aberta máxima (stock sem venda contratada) | min(25% do *book*; (capital subordinado + reserva) ÷ 0,30) | Diária, ao índice (média Poolred + SIMA) |
| Exposição curta (venda a prazo sem físico ou compra firme garantida) | **0** | Diária |
| Idade máxima do lote | 6 meses desde a moenda à entrada; 15 meses no balanço | Por lote |
| Concentração por produtor | ≤ 50% do *book* no 1.º ano; ≤ 35% a partir do 2.º | Mensal |
| Concentração por comprador | ≤ 20% dos recebíveis; ≤ 10% sem seguro de crédito | Diária |
| Prazo médio de recebimento (DSO) | ≤ 30 dias; alerta a 40 dias | Semanal |
| Perda máxima num choque de −30% | ≤ 100% da almofada (capital subordinado + reserva) | Mensal e a cada novo lote |
| Café (fase 2): exposição USD não coberta | ≤ 10% das compras em USD dos próximos 3 meses | Semanal |

**4. Instrumentos permitidos**

| Produto | Permitido | Condições |
|---|---|---|
| Azeite | Venda *back-to-back* a preço fixo ou indexado; compra a prazo a preço fixo ou indexado com lagar; fixação diferida simultânea com a venda; cláusulas de preço mínimo/máximo **embutidas** em contratos físicos | Contrato escrito; especificação analítica; força maior com lista fechada; garantia ou retenção acima de 50 k€ |
| Café | Compra em EUR a preço fixo a importador UE; PTBF com fixação simultânea; futuros ICE KC/RC só com aprovação do Comité, acima de 50 t/ano | Corretor membro de câmara ICE, regulado na UE; linha de liquidez para margens ≥ 30% do nocional coberto |
| Câmbio | *Forward* entregável EUR/USD para pagamentos de bens identificados | Banco da UE; prazo ≤ 12 meses; montante ≤ fatura ou contrato |
| Água | Só contratuais (preço anual indexado com teto, sobretaxa de combustível) | — |
| Crédito | Seguro de crédito; SEPA B2B; factoring sem recurso | Seguradora autorizada (ASF ou passaporte UE) |
| Stock | Seguro multirriscos e de transporte, com a SPV como beneficiária | — |

**5. Instrumentos e práticas proibidos**
- Derivados liquidados em dinheiro sobre azeite (inclui opções OTC).
- Cobertura cruzada com outros óleos.
- Venda de opções a descoberto.
- Vendas a prazo sem físico.
- Criptoativos.
- Alavancagem fora da *borrowing base*.
- Venda de derivados ou produtos com retorno indexado a investidores.
- Cobertura feita por pessoas não autorizadas.

**6. Contrapartes elegíveis**
- **Físicas:**
  - KYB completo;
  - contas dos últimos 2 anos;
  - certificação de segurança alimentar;
  - limite interno aprovado;
  - nenhum incidente grave nos últimos 12 meses (Informa D&B).
- **Financeiras:**
  - instituição de crédito ou empresa de investimento autorizada na UE;
  - para ICE, corretor *clearing member* ou com acesso de compensação.
- **Armazenistas:**
  - lagar ou armazém com tanques em inox, N₂ e registo de temperatura;
  - acesso para inspeção sem aviso;
  - contrato de depósito tripartido com *collateral manager*.
- **Seguradoras:** autorizadas pela ASF ou com passaporte UE.

**7. Limites de custo da cobertura**
7.1 O custo total anual das coberturas não pode exceder **30% da margem bruta esperada** do *book*. Inclui:
- descontos concedidos para fixar preço;
- prémios de seguro de crédito e de stock;
- custo de *forwards*;
- comissões e custo de margens ICE.
7.2 Se o custo exceder o limite, reduz-se a exposição (vender ou não comprar) em vez de cobrir mais caro.

**8. Gatilhos e ações**

| Gatilho | Nível | Ação obrigatória | Prazo |
|---|---|---|---|
| Índice cai ≥ 10% face ao preço de entrada do lote aberto | Amarelo | Congelar novas compras abertas; rever *offtake* | 24 h |
| Índice cai ≥ 20% | Laranja | Vender ou contratar *back-to-back* ≥ 50% do stock aberto; recalcular a *borrowing base* | 5 dias úteis |
| Índice cai ≥ 30%, ou a almofada fica abaixo de 50% | Vermelho | Exposição aberta a zero; avaliar extensão (P5); informar o agente dos obrigacionistas | 10 dias úteis |
| K232 ≥ 2,30, peróxidos ≥ 15 ou frutado < 2,0 | Qualidade | Vender em ≤ 30 dias ou reclassificar o preço | 30 dias |
| DSO de um comprador > 45 dias | Crédito | Suspender entregas; ativar o seguro | Imediato |
| Entregas de um produtor < 90% do contratado no mês | Entrega | Ativar penalização; acionar o fornecedor alternativo | 5 dias úteis |
| Telemetria do tanque: variação de nível sem ordem de saída, ou temperatura > 25 °C durante 48 h | Operacional | Inspeção física pelo *collateral manager* | 48 h |

**9. Governação**
9.1 **Responsável de Risco e Tesouraria:** nomeado antes da primeira emissão (o documento-fonte deixa "owner a designar"); reporta ao CEO e ao órgão da SPV.
9.2 **Comité de Risco:**
- membros: Risco/Tesouraria, que preside, CEO, Operações, Jurídico e Compliance; um membro independente com direito de veto em matérias da SPV;
- reuniões mensais e extraordinárias a qualquer gatilho laranja ou vermelho.
9.3 **Quatro olhos:** qualquer contrato de cobertura ou de venda a prazo acima de 25 k€ exige duas assinaturas, uma delas de fora da área comercial.
9.4 ***Dashboard* diário:**
- preço de mercado vs. contrato por lote;
- exposição aberta;
- almofada;
- *borrowing base*;
- idade e qualidade dos lotes;
- DSO;
- concentração;
- gatilhos ativos;
- PnL por lote.
9.5 **Violação de limite:** comunicação ao Comité em 24 h; plano de regularização em 5 dias úteis; registo no livro de incidentes; reporte trimestral aos obrigacionistas.
9.6 **Auditoria:** contagem física trimestral pelo *collateral manager*; revisão anual da política por entidade externa.

**10. Contabilidade e regulação**
- **Contabilidade de cobertura** (NCRF 27 / IFRS 9) só se documentada desde o início; caso contrário, ao justo valor por resultados.
- **EMIR:** obter LEI. Os *forwards* de "meio de pagamento" estão fora do âmbito. Os futuros ICE exigem reporte (delegável). Confirmar o estatuto NFC-.
- **Comunicação:** o desempenho das coberturas é reportado aos obrigacionistas sem gamificação, em linha com a diretriz de produto do documento-fonte.

---

## 8. TEMPLATE — Playbook de liquidez e extensão por lote (ex-"refunding")

> **Estado:** minuta v0.1. Aplica-se a cada lote financiado pela SPV.
> **Terminologia:** nos documentos para investidores usa-se "Mecanismos de liquidez e extensão". A palavra "refunding" é usada só internamente, no sentido técnico de refinanciamento (P7).

**A. Ficha do lote (obrigatória antes do financiamento)**

| Campo | Exemplo / regra |
|---|---|
| ID do lote | PT-AZ-2026-001 |
| Produtor / depositário | Lagar do Val (contrato de depósito n.º …) |
| Tanque(s) / selos | T-07, selos n.º …; telemetria ativa (sim/não) |
| Categoria / campanha / data de moenda | AOVE, 2026/27, 2026-11-20 |
| Análise de entrada (laboratório, data) | Acidez, peróxidos, K232, K270, ΔK, FAEE, painel |
| Quantidade medida (kg) e método | Medição volumétrica × densidade 0,916 |
| Preço de compra / índice / prémio | 3,40 €/kg; Poolred + SIMA, médias de 2 semanas; prémio 0,10 €/kg |
| Estado de cobertura | % vendido *back-to-back*; compradores; preço/índice de venda; *offtake* (sim/não) |
| Financiamento | Série S-2026-A; *advance rate*; data de reembolso esperada / data final |
| Colateral | Propriedade ou penhor; cessão de recebíveis notificada (sim/não) |
| Seguros | Apólice de stock n.º …; crédito (limites por comprador) |
| Gatilhos de saída | Data-limite de venda; limites de qualidade (secção 7, ponto 8) |

**B. Estados do lote e ações**

| Estado | Critério | Ação | Quem decide |
|---|---|---|---|
| **Verde** | ≥ 75% vendido; índice ≥ −10% face à entrada; qualidade dentro dos limites; idade < 9 meses | Operação normal; *cash sweep* mensal | Operações |
| **Amarelo** | Índice −10% a −20%; ou vendido < 50% a 60 dias do reembolso esperado; ou K232 entre 2,10 e 2,30 | Esforço comercial dirigido; propostas a compradores alternativos (distribuidores, embaladores); nova análise | Risco/Tesouraria |
| **Laranja** | Índice −20% a −30%; ou vendido < 50% a 30 dias; ou qualidade no gatilho de venda | Vender ≥ 50% ao melhor preço firme; preparar a extensão; nota prévia ao agente dos obrigacionistas | Comité de Risco |
| **Vermelho** | Índice ≤ −30%; ou almofada < 50%; ou incumprimento do produtor ou depositário | Ativar a extensão P5 (se os critérios se verificarem); *cash sweep* de 100%; congelar novas compras da série | Comité de Risco + órgão da SPV |
| **Negro** | Perda que esgota a almofada, fraude ou perda física do stock | Evento de incumprimento nos termos das notas; execução do colateral; acionar seguros; comunicação regulatória se aplicável | Órgão da SPV + agente dos obrigacionistas |

**C. Calendário de decisão por série (vencimento esperado M12, final M18)**

| Data | Verificação | Decisão possível |
|---|---|---|
| M12 − 90 dias | Projeção de caixa por lote: vendas contratadas, recebíveis, stock aberto ao índice | Plano comercial; eventual oferta de refinanciamento (P7) para a série seguinte |
| M12 − 60 dias | Teste de cobertura: (caixa + recebíveis elegíveis + stock × *haircut*) ÷ saldo sénior | Se ≥ 105%: reembolso normal previsto. Se < 105%: preparar a extensão |
| M12 − 30 dias | **Último dia para notificar a extensão** (P5), com fundamento no gatilho objetivo | Notificação aos obrigacionistas com: gatilho verificado, situação de cada lote, plano de venda, *step-up* aplicado |
| M12 | Reembolso esperado | Reembolso total, ou parcial *pro rata* mais extensão do remanescente |
| M12 → M18 | *Cash sweep* mensal; proibição de compras abertas; relatório mensal | Amortizações parciais à medida das vendas |
| M18 | Vencimento final | Reembolso do saldo; se insuficiente, *waterfall* e execução do colateral |

**D. Critérios objetivos para a extensão (P5): todos cumulativos**
1. Pelo menos um gatilho de mercado: índice ≤ −20% face ao preço médio de entrada dos lotes abertos, **ou** procura contratada < 50% do stock a 60 dias de M12.
2. A extensão é **economicamente racional**: a venda forçada imediata produziria uma perda superior ao custo esperado da extensão (carry de 6 meses mais *step-up*), segundo um cálculo do responsável de Risco validado pelo membro independente.
3. Os lotes estão aptos para mais 6 meses: qualidade dentro dos limites e idade < 15 meses no fim da extensão.
4. Só **uma** extensão por série, com duração máxima de 6 meses.

**E. Compensação na extensão**
- *Step-up* do cupão: **+250 p.b.** anualizados sobre o saldo prorrogado (intervalo de 200–300 p.b.).
- *Cash sweep*: 100% das receitas líquidas dos lotes para amortização *pro rata*.
- Retenção da margem do patrocinador: comissões de gestão e distribuições ao patrocinador suspensas até ao reembolso integral do sénior.
- Informação: relatório mensal por lote (estado, preço vs. entrada, análises, vendas).

**F. Amortização antecipada parcial (P6)**
- Fórmula mensal: Amortização = max(0; caixa livre da série − 10% × saldo vivo − reserva de primeira perda em constituição) × 100%, *pro rata*, ao par mais juros corridos.
- Sem penalização para o investidor nem para o emitente.

**G. Refinanciamento (P7)**
- Oferta de troca para a série seguinte, com igualdade de tratamento, preço ao par e informação completa.
- A adesão é voluntária. O emitente **nunca** pode condicionar o reembolso da série antiga à subscrição da nova.
- A colocação da nova série segue as mesmas regras de isenção de prospeto e de investidores qualificados (nota 20).

**H. Comunicação-tipo ao investidor (extensão)** — conteúdo mínimo:
1. gatilho verificado e data;
2. situação de cada lote (quantidade, preço de entrada, índice atual, % vendido, qualidade);
3. almofada disponível;
4. plano de venda;
5. *step-up* e regras de *cash sweep*;
6. riscos (incluindo perda de capital).

Sem linguagem promocional e sem promessas de recuperação de preço.

**I. Pós-mortem obrigatório**
Para cada lote que chegue a laranja ou pior: causa raiz, eficácia dos gatilhos e alteração da política, em 30 dias.

---

## 9. Implicações para o Sprout

1. **Os 18 meses são o vencimento legal, não o prazo de detenção.** A série-tipo deve ser *soft bullet*: emissão em novembro, compras em nov.–fev., reembolso esperado em M12 e extensão condicionada até M18. Comunicar "liquidação esperada a 12 meses, máxima a 18 meses, com extensão nos termos X", e nunca "liquidação a 18 meses garantida".
2. **Riscar "hedge funds" e "taxas de cobertura" do *deck*.** Não há mercado de futuros de azeite desde o fecho do MFAO (2016–17). A cobertura do Sprout é **comercial**: *back-to-back*, indexação, *offtake* e limites de posição aberta. Dizê-lo assim é mais credível perante investidores e supervisores.
3. **Regra de ouro: nada de stock aberto acima da almofada.** Exposição aberta ≤ (capital subordinado + reserva) ÷ 0,30, e ≤ 25% do *book*. **Exposição curta = 0** (o cenário S2b destrói a estrutura).
4. **O patrocinador tem de pôr capital à frente.** 10% de capital subordinado mais uma reserva de primeira perda alimentada por 30% da margem de cada lote (teto de 5%). Sem *skin in the game*, a estrutura é uma posição longa em azeite vendida a terceiros.
5. **Preferir financiar o produtor a possuir o stock.** Um empréstimo ou pré-pagamento com penhor e LTV ≤ 60–65% deixa o risco de preço no lagar e põe o investidor num crédito colateralizado. É a estrutura clássica de *trade finance* e encaixa no "notes garantidas por stock e recebíveis" da nota 20. **Validar a reserva de atividade de crédito (RGICSF)**; se bloquear, usar um banco parceiro como mutuante.
6. **"Refunding" sai do vocabulário externo.** É substituído por quatro mecanismos definidos: extensão condicionada (P5), amortização antecipada parcial (P6), refinanciamento voluntário (P7) e reserva de primeira perda (P3). Qualquer "reembolso garantido" é captação de fundos reembolsáveis e repete Afinsa/Fórum.
7. **A qualidade é o risco escondido do azeite.** Os critérios de entrada mais exigentes do que a lei, a análise a cada 4 meses, a idade máxima e a proibição de atravessar um segundo verão sem decisão são a "rastreabilidade de lote" do produto, agora com função de controlo de risco. O Lagar do Val tem de garantir inox com N₂, registo de temperatura, selagem e telemetria antes de qualquer lote financiado.
8. **O colateral exige individualização e um terceiro.** Tanques dedicados e selados, contrato de depósito tripartido e *collateral manager* independente. O penhor bancário sem desapossamento não serve a uma SPV, e sem individualização o "lote" não é juridicamente da SPV.
9. **Concentração no Lagar do Val é o risco n.º 1 do piloto.** Limite de 50% no 1.º ano e um segundo e terceiro lagar contratados antes da primeira emissão. A âncora também é um ponto único de falha (insolvência, fraude, incêndio).
10. **Dimensionar a série à procura assinada, não à ambição.** Com GMV-piloto HoReCa de 0,1–0,4 M€, a primeira série deve ter **100–150 k€**. Séries de 0,5 M€ ou mais só com *offtake* de distribuidores, embaladores ou exportadores.
11. **Crédito HoReCa:** SEPA B2B ou pré-pagamento como regra; seguro de crédito só quando o volume diluir o prémio mínimo; limite por cliente; DSO como KPI diário.
12. **Água:** sem *hedge*. Contratos anuais indexados com tetos, sobretaxa de combustível, reserva de capacidade de verão e conta SDR segregada. Fora do produto de investimento.
13. **Café:** só na fase 2, comprado em EUR a preço fixo a importador da UE e operador EUDR. ICE e *forwards* só acima de ~50–100 t/ano, com linha de liquidez para margens.
14. **Seguros:** exigir aos produtores prova de seguro de colheitas (SIPAC ou Agroseguro); seguro de stock e de transporte com a SPV como beneficiária. **Não comprar paramétrico no piloto**: o risco do Sprout é de preço e de entrega, não de clima.
15. **Momento de mercado (out. 2026).** Preços no mínimo de 2 anos e colheita espanhola prevista em +23% são favoráveis para fixar compras *back-to-back*, mas **não justificam posições longas de "reversão à média"**. O custo de produção do olival tradicional (até 4,61 €/kg) não é um piso de preço, e as ajudas da UE são incertas e lentas.
16. **Nomear já o responsável de Risco e Tesouraria** (o documento-fonte tem "owner a designar"). Perfil: *trade finance* ou tesouraria de *trading* de *commodities*. Sem esta pessoa e sem a política aprovada pelo órgão da SPV, não há primeira emissão.

---

## 10. Itens não verificados (verificar antes de usar com investidores)

**MFAO**
- Volumes negociados, especificação dos contratos e data formal da dissolução e extinção (BOE/BORME, CNMV).
- Confirmação de que não existe hoje nenhum futuro de azeite em bolsa (listas de produtos da Euronext e do ICE; registo MIC).

**Preços e volatilidade do azeite**
- Série semanal de preços do AOVE 2015–2026 (DG AGRI ou Poolred). A volatilidade, os *drawdowns* e a sazonalidade foram calculados só com os pontos de 2022–2026.

**Qualidade e armazenagem do azeite**
- Limites do Reg. Del. (UE) 2022/2104, Anexo I (texto consolidado com o Reg. 2024/1401).
- Prática de durabilidade de 18–24 meses e taxas de deriva de K232 e peróxidos em armazenagem (literatura técnica e COI).
- Tarifas de armazenagem em lagares e armazéns ibéricos (€/t/mês). Os 2–8 €/t/mês são estimativa de custo.

**Café e câmbio**
- Especificações e margens atuais dos futuros ICE KC e RC; comissões de corretores da UE.
- EUR/USD de out. 2026; taxas de juro USD e EUR (pontos *forward*); Euribor de out. 2026.

**Água**
- Futuros de PET na China e sua irrelevância; validade típica da água em PET.

**Crédito e seguros**
- Estatísticas de insolvências em Portugal 2025–2026 (Informa D&B, Coface, Allianz Trade).
- Estrutura acionista atual da COSEC; prémios indicativos e prémios mínimos de seguro de crédito (pedir 3 cotações); prémio de seguro de stock.

**Colateral (direito português)**
- Redação atual dos arts. 669.º, 408.º e 409.º do CC, dos arts. 397.º–424.º do Código Comercial e do art. 104.º do CIRE.
- Vigência e âmbito do DL 29 833/1939.
- Existência de regime de penhor mercantil sem desapossamento com registo para credores não bancários.

**Regulação financeira e fiscal**
- RGICSF: reserva da concessão de crédito a título profissional e exceções (crédito comercial, pré-pagamento).
- Exceção de "meio de pagamento" (Reg. Del. 2017/565, art. 10.º) e obrigações EMIR de uma NFC- para futuros em bolsa.
- Efeito do Regulamento de Titularização sobre o capital subordinado do patrocinador.

**Seguros agrícolas**
- SIPAC: diploma em vigor, coberturas do olival, taxa de apoio no PEPAC, cobertura de seca.
- Agroseguro: linha de olival e cobertura de seca.

**Lei espanhola da cadeia alimentar**
- Lei 12/2013 com a Lei 16/2021: regra do custo de produção e sua aplicação a compradores estrangeiros.

**Modelo**
- Todos os parâmetros [E] do modelo de carry e dos stress tests: probabilidades de desclassificação, margem bruta de *trading* (0,15–0,30 €/kg), taxa de renegociação de compradores (20%) e *advance rates*.

---

## Fontes

Data de acesso: **13/10/2026**. Os grupos A e B foram consultados através de extratos indexados de motor de pesquisa (ver "Limitações"). O grupo C não foi acedido nesta sessão: são as referências primárias onde verificar os itens [C].

**A. Pesquisa própria desta sessão (MFAO)**
- ISO 10383 MIC, registo XSRM (TradingHours) — https://www.tradinghours.com/mic/s/xsrm
- BOE, 17/12/2003 (reconhecimento do sistema de compensação e liquidação do MFAO, Lei 41/1999) — https://www.boe.es/boe/dias/2003/12/17/pdfs/A44977-44977.pdf
- BOE, 19/12/2002 (enquadramento do mercado) — https://boe.gob.es/boe/dias/2002/12/19/pdfs/A44671-44674.pdf
- Olive Oil Times, "Stagnant Prices, Uncertainty Take Toll on Olive Oil Futures" — https://www.oliveoiltimes.com/business/europe/olive-oil-futures/15950
- Estrategias de Inversión (MFAO) — https://www.estrategiasdeinversion.com/actualidad/noticias/bolsa-espana/7041
- Repositório Comillas (estudo sobre o MFAO) — https://repositorio.comillas.edu/jspui/handle/11531/9448
- MAPA, Vida Rural n.º 120 (2000), projeto do mercado de futuros — https://www.mapa.gob.es/ministerio/pags/Biblioteca/Revistas/pdf_vrural/Vrural_2000_120_22_24.pdf
- Mercacei (MFAO) — https://www.mercacei.com/pdf/otrosaceites1452.pdf

**B. Factos reutilizados das notas 10 e 20 (fontes originais)**

*Azeite: preços, produção e futuros*
- Wikipédia ES, MFAO — https://es.wikipedia.org/wiki/Mercado_de_Futuros_del_Aceite_de_Oliva
- eInforma, MFAO Rectora (extinta) — https://www.einforma.com/informacion-empresa/mfao-rectora-mercado-futuros-aceite-oliva
- Olive Oil Times, recorde de jan. 2024 — https://oliveoiltimes.com/briefs/prices-set-records-in-spain/115541
- Agroportal, preços de 2023 em máximos — https://www.agroportal.pt/los-precios-en-origen-del-aceite-cierran-2023-en-maximos-historicos
- COI, preços (jun. 2024) — https://www.internationaloliveoil.org/wp-content/uploads/2024/06/IOC-prices-rev-0-1.html
- COI, preços (dez. 2024) — https://internationaloliveoil.org/wp-content/uploads/2024/12/IOC-prices-rev-0-1.html
- COI, preços (fev. 2025) — https://www.internationaloliveoil.org/wp-content/uploads/2025/03/IOC-prices-rev-0-1.html
- COI, estatísticas jan./fev. 2026 — https://www.internationaloliveoil.org/olive-sector-statistics-january-february-2026/
- COI, estatísticas abr. 2026 — https://www.internationaloliveoil.org/olive-sector-statistics-april-2026/
- COI, estatísticas jun.–jul. 2026 — https://www.internationaloliveoil.org/statistiques-du-secteur-oleicole-juin-juillet-2026/
- Infobae/EFE, abr. 2025 — https://www.infobae.com/espana/agencias/2025/04/16/el-precio-en-origen-del-aceite-de-oliva-virgen-extra-se-acerca-a-los-niveles-de-2022/
- Agroinformación (Poolred, nov. 2025) — https://agroinformacion.com/el-precio-en-origen-del-aceite-de-oliva-virgen-extra-sube-un-53-la-ultima-semana-y-se-situa-en-462-euros-el-kilo-segun-el-sistema-poolred/
- Navarra Exports (set. 2026) — https://navarraexports.com/en/market-intelligence/spanish-olive-oil-prices-september-2026-bulk-buyers
- Wikifarmer, semana 41/2026 — https://wikifarmer.com/library/en/article/olive-oil-prices-spain-national-aforo-2026-27
- COAG Jaén — https://coagjaen.es/precio-aceite-2-de-octubre/
- Oleista, preços — https://oleista.com/en/prices
- Infobae, 13/10/2026 — https://www.infobae.com/espana/2026/10/13/precio-del-aceite-de-oliva-en-espana-este-martes-13-de-octubre/
- EVOO Index (dados CE) — https://evooindex.eu/spain
- Agroportal, SIMA semana 21–27 set. 2026 — https://www.agroportal.pt/azeite-e-azeitona-21-a-27-de-setembro-de-2026/
- SIMA, boletim n.º 30/2026 — https://www.agroportal.pt/wp-content/uploads/2026/07/azei_News30.pdf
- Agrodigital, 1.º aforo de 2026/27 — https://www.agrodigital.com/2026/10/02/aforo-aceite-oliva/
- AgroCLM, fecho de 2025/26 — https://www.agroclm.com/2026/05/12/la-produccion-final-de-aceite-de-oliva-de-la-campana-2025-2026-roza-las-13-millones-de-toneladas/
- Conselho da UE, ST-13543-2026 (existências e reserva agrícola) — https://data.consilium.europa.eu/doc/document/ST-13543-2026-INIT/x/pdf
- El Debate (custos de produção AEMO) — https://www.eldebate.com/espana/andalucia/20251005/revolucion-silenciosa-olivar-andaluz-futuro-aceite-pasa-riego-mecanizacion_340745.html
- Agronews (limiar OliveA) — https://www.agronewscastillayleon.com/aceite-oliva-olivea-precios-5-euros-olivar-tradicional
- CNBC (calor de 2026) — https://www.cnbc.com/2026/07/17/spain-olive-oil-europe-heat-climate.html

*Café e câmbio*
- ICE, Coffee C — https://www.ice.com/products/15/Coffee-C-Futures
- ICE, Robusta — https://www.ice.com/products/37089079/Robusta-Coffee-Futures
- Macrotrends — https://www.macrotrends.net/2535/coffee-prices-historical-chart-data
- Perfect Daily Grind (fev. 2025) — https://perfectdailygrind.com/2025/02/coffee-prices-record-highs-roasters/
- Comunicaffe — https://www.comunicaffe.com/arabica-coffee-futures-reach-new-record-highs-london-closes-slightly-down/
- Barchart (ago. 2026) — https://www.barchart.com/story/news/4004695/slow-pace-of-brazil-harvest-and-tight-inventories-boost-coffee-prices
- Yahoo/Barchart (USDA 2026/27) — https://finance.yahoo.com/markets/commodities/articles/coffee-prices-fall-usda-predicts-183327017.html
- Helena Coffee (12/10/2026) — https://www.helenacoffee.vn/coffee-prices-today-october-12-2026/
- ICO, relatório de mercado de set. 2023 — https://ico.org/documents/cy2022-23/cmr-0923-e.pdf
- BCE, taxa de referência de 26/06/2026 — https://www.ecb.europa.eu/stats/exchange/eurofxref/shared/pdf/2026/06/20260626.pdf

*Água*
- DGEG, Águas em Números — https://www.dgeg.gov.pt/pt/destaques/aguas-em-numeros-estatisticas-dos-recursos-hidrogeologicos-e-geotermicos/
- ChemOrbis (PET) — https://www.chemorbis.com/en/free-pet-prices-news
- Packaging Europe (ICIS, rPET) — https://packagingeurope.com/comment/why-are-some-brands-focusing-on-cost-over-circularity/12674.article
- Diretiva (UE) 2019/904 — https://eur-lex.europa.eu/eli/dir/2019/904/oj
- Ambiente Online (SDR) — https://www.ambienteonline.pt/destaques/sistema-de-deposito-e-reembolso-arranca-a-10-de-abril-de-2026
- Renascença (ANTRAM, 2026) — https://rr.pt/noticia/pais/2026/05/24/transportadoras-a-beira-do-limite-o-setor-esta-completamente-asfixiado/471894/

*Crédito, pagamentos e contratos*
- Informa D&B (pagamentos, jul. 2026) — https://blog.informadb.pt/2026/07/empresas-portuguesas-estao-entre-as-que-mais-se-atrasam-nos-pagamentos-em-todo-o-mundo/
- Jornal Económico (66 mil empresas em risco) — https://jornaleconomico.sapo.pt/noticias/empresas-portuguesas-em-risco-de-atrasos-graves-disparam-para-66-mil-diz-informa-db/
- Diretiva (UE) 2019/633 — https://eur-lex.europa.eu/eli/dir/2019/633/oj
- DL 76/2021 (GPP/PARCA) — https://sima.gpp.pt/images/Producao_e_Mercados/OrgProducao_CadeiaAlimentar/PARCA/DL_76_2021.pdf
- ASAE, FAQ sobre prazos de pagamento — https://www.asae.gov.pt/perguntas-frequentes1/area-alimentar/prazos-de-pagamento-obrigatorios-para-produtos-alimentares-faqs.aspx
- DL 62/2013 — https://diariodarepublica.pt/dr/detalhe/decreto-lei/62-2013-261160
- Julgar (alteração anormal das circunstâncias) — https://julgar.pt/wp-content/uploads/2020/07/20200725-JULGAR-A-alteração-anormal-das-circunstâncias-Sandra-R-Luís-1.pdf
- STJ (art. 437.º) — https://jurisprudencia.pt/acordao/208981

*Regulação financeira e precedentes*
- ESMA, Orientações C6/C7 (ESMA-70-156-869) — https://www.esma.europa.eu/sites/default/files/library/esma-70-156-869_guidelines_on_c6_c7_application_of_mifid_ii_annex_1_ro.pdf
- Reg. Del. (UE) 2017/565 — https://eur-lex.europa.eu/eli/reg_del/2017/565/oj/eng
- LegalToday (Afinsa, 2016) — https://www.legaltoday.com/actualidad-juridica/noticias-de-derecho/la-audiencia-nacional-condena-a-11-directivos-de-afinsa-con-penas-de-hasta-12-anos-de-prision-2016-07-28/
- CGPJ/TS (Fórum Filatélico) — https://www.poderjudicial.es/cgpj/es/Poder-Judicial/Tribunal-Supremo/Noticias-Judiciales/El-Tribunal-Supremo-confirma-la-estafa-piramidal-de-Forum-Filatelico-y-establece-penas-de-entre-seis-meses-y-once-anos-de-carcel-para-16-acusados

**C. Referências primárias para verificar os itens [C] (não acedidas nesta sessão)**
- Reg. Del. (UE) 2022/2104 (normas de comercialização do azeite) — https://eur-lex.europa.eu/eli/reg_del/2022/2104/oj
- Reg. Exec. (UE) 2022/2105 (métodos de análise) — https://eur-lex.europa.eu/eli/reg_impl/2022/2105/oj
- Reg. (UE) 1308/2013 (OCM; armazenagem privada, art. 167.º-A) — https://eur-lex.europa.eu/eli/reg/2013/1308/oj
- Reg. Exec. (UE) 2017/1185 (notificação de preços) — https://eur-lex.europa.eu/eli/reg_impl/2017/1185/oj
- Agri-food Data Portal, preços do azeite — https://agridata.ec.europa.eu/extensions/DataPortal/olive-oil.html
- Reg. (UE) 1169/2011 (informação ao consumidor; durabilidade) — https://eur-lex.europa.eu/eli/reg/2011/1169/oj
- COI, norma comercial COI/T.15/NC n.º 3 — https://www.internationaloliveoil.org/what-we-do/chemistry-standardisation-unit/standards-and-methods/
- Poolred — https://www.poolred.com/
- Reg. (UE) 2021/2115 (Planos Estratégicos da PAC; art. 76.º, gestão de riscos) — https://eur-lex.europa.eu/eli/reg/2021/2115/oj
- Reg. (UE) 648/2012 (EMIR) e Reg. (UE) 2019/834 (EMIR Refit) — https://eur-lex.europa.eu/eli/reg/2012/648/oj ; https://eur-lex.europa.eu/eli/reg/2019/834/oj
- Reg. (UE) 2017/2402 (Titularização) — https://eur-lex.europa.eu/eli/reg/2017/2402/oj
- Código Civil (penhor, arts. 666.º–685.º; transmissão, art. 408.º; reserva de propriedade, art. 409.º) — https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/1966-34509075
- Código Comercial (penhor mercantil, arts. 397.º–402.º; armazéns gerais, arts. 408.º–424.º) — https://diariodarepublica.pt/dr/legislacao-consolidada/carta-de-lei/1888-34570075
- CIRE (art. 104.º) — https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/2004-34529775
- DL 105/2004 (contratos de garantia financeira) — https://diariodarepublica.pt/dr/detalhe/decreto-lei/105-2004-523145
- RGICSF (DL 298/92) — https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/1992-34489975
- Banco de Portugal, SEPA Direct Debit B2B — https://www.bportugal.pt/
- COSEC — https://www.cosec.pt/
- Allianz Trade Portugal — https://www.allianz-trade.pt/
- Coface Portugal — https://www.coface.pt/
- Atradius Crédito y Caución Portugal — https://atradius.pt/
- GPP, seguros agrícolas / SIPAC — https://www.gpp.pt/
- Agroseguro — https://agroseguro.es/
- ICE Clear US / ICE Clear Europe (margens) — https://www.ice.com/clear-us/risk-management ; https://www.ice.com/clear-europe/risk-management
- Ley 12/2013 (cadeia alimentar, Espanha), consolidada no BOE — https://www.boe.es/buscar/act.php?id=BOE-A-2013-8554
