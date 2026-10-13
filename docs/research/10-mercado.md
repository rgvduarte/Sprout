# 10 — Mercado, preços e cadeia de valor: azeite, água e café

> Documento de investigação para o Sprout (marketplace B2B fechado de commodities agroalimentares, Portugal → Ibéria).
> Data de referência: **13/10/2026**. Fonte de partida: `docs/fonte/plano-estrategico-10-13.md`.
> Âmbito: dimensão de mercado, preços, cadeia de valor e procura (azeite, água engarrafada, café), com teste quantitativo da tese "capturar 80–90% da margem do embalador e dar 10–15% de desconto".

## Método, convenções e limitações

- **Etiquetas:** **[F]** facto com fonte; **[E]** estimativa nossa (método explícito); **[I]** inferência nossa. Confiança: **A** (alta), **M** (média), **B** (baixa).
- **Conversões:** azeite 1 L = 0,916 kg (convenção técnica). Café: 1 lb = 0,4536 kg. EUR/USD de trabalho = **1,15** [E] (último valor BCE verificado: 1,1401 a 26/06/2026; ~1,16 em 19/08/2026; valor de outubro de 2026 **não verificado**).
- **Limitação importante:** nesta sessão a leitura direta de páginas (WebFetch) falhou por DNS em todos os domínios; os dados foram obtidos através de extratos indexados de motor de pesquisa das páginas citadas. Os números foram cruzados entre ≥2 fontes sempre que possível; quando só há uma fonte secundária, a confiança é rebaixada. Antes de uso em documentos para investidores, os valores marcados M/B devem ser confirmados no documento primário.
- **Campanhas:** azeite out.–set. (ex.: 2025/26 = out. 2025–set. 2026); café, ano-colheita do país.

---

## 0. Sumário executivo

1. **Azeite: o ciclo de preços inverteu-se por completo.** O virgem extra (AOVE) na origem em Espanha passou de **3,45 €/kg (abr. 2022)** para o máximo de **8,99 €/kg (jan. 2024)** e está em **3,34 €/kg (29/09–05/10/2026)**: −63% desde o pico, em 33 meses. A primeira estimativa oficial espanhola para 2026/27 é **1,60 Mt (+23%)**, o que mantém a pressão em baixa.
2. **A "margem do embalador" é pequena.** Segundo o Observatorio de la Cadena Alimentaria (Espanha), o lucro líquido do embalador de AOVE foi de **0,19–0,50 €/kg** (5–14% do preço ao público sem IVA) nas campanhas 2018/19–2020/21; o custo de embalamento ronda **0,47–0,51 €/kg**. Os grandes embaladores operam com **EBITDA de ~5–6%** das vendas (Deoleo 2025: 5,9%; Sovena 2024: ~5,5%).
3. **A aritmética da tese não fecha tal como está escrita.** Capturar 80–90% de 0,19–0,50 €/kg dá **0,15–0,45 €/kg**; um desconto de 10–15% sobre um preço de referência de 4,6–6,7 €/kg custa **0,46–1,00 €/kg**. O desconto custa 1 a 6,7 vezes o que se captura. Só fecha se o Sprout capturar o **diferencial total granel→prateleira** (1,2–2,2 €/kg, 27–34% do preço ao público sem IVA) e vender contra referências de marca ou de cash & carry português, e não contra marcas brancas espanholas.
4. **A água é economicamente pouco adequada à tese.** Portugal engarrafou ~**2.000 milhões de litros** em 2025, num mercado de **479 M€** (média ~**0,24 €/L** [I]). A água mineral natural tem de ser embalada na origem (Diretiva 2009/54/CE), pelo que **o produtor é o embalador**: não há um elo de embalamento separado para desintermediar. A logística e o depósito do SDR (**0,10 €/embalagem desde 10/04/2026**) pesam 20–40% do valor ex-fábrica [E].
5. **Café: o preço caiu mas a margem não está no grão.** O Arabica (ICE KC) bateu o recorde de **~4,41 USD/lb (fev. 2025)** e estava em **2,85 USD/lb a 09/10/2026** (−24% em termos homólogos). O Robusta passou de ~**5.800 USD/t (fev. 2025)** para **3.470 USD/t (12/10/2026)**. O grão verde vale ≤10% do valor de retalho a nível mundial (ICO). Em Portugal, a HoReCa está presa a contratos de exclusividade dos torrefatores com equipamento em comodato. É uma vertical para mais tarde.
6. **Procura:** há **74.524 empresas** de restauração e similares em Portugal (2024; 91% microempresas). Só **20,2%** das empresas portuguesas pagam a horas, e só **11%** no alojamento e restauração, onde o atraso médio é de **30 dias**.
7. **Regime legal de prazos:** o DL 118/2010 (alterado pelo DL 76/2021, que transpõe a Diretiva (UE) 2019/633) limita o pagamento de produtos alimentares a **30 dias (perecíveis)** e a **30/60 dias (não perecíveis)**, conforme os escalões de volume de negócios. **Um ciclo de 18 meses não pode aplicar-se ao pagamento ao produtor.**
8. **Dimensão [E]:** o SAM em Portugal (azeite + água no canal HoReCa) é de **~140–275 M€/ano**, e o da Ibéria é de **~0,7–1,25 mil M€/ano**. O SOM realista a 36 meses é de **1,7–8 M€ de GMV** (1.000–2.000 clientes HoReCa), com uma margem de contribuição de **0,15–1,2 M€**. O fluxo B2B HoReCa sozinho é pequeno face à ambição do documento-fonte.

---

## 1. Azeite

### 1.1 Produção por campanha (mil toneladas)

| Campanha | Mundo (COI) | UE | Espanha | Portugal | Notas |
|---|---|---|---|---|---|
| 2021/22 | **3.420** [F,M] | n.v. | **~1.500** [F,M] | **~210** [F/I,M] | PT: recorde INE de 2,29 M hl × 0,916 |
| 2022/23 | **2.570** [F,M] | **1.390** [F,M] | **~660** (652–680 conforme a fonte) [F,M] | **~126** [F,A] | Seca; INE: 1,375 M hl (−40%) |
| 2023/24 | **~2.410** (est. COI) [F,M] | **1.530** [F,M] | **853** [F,M] | **~160** [F/I,M] | INE: >1,75 M hl em 2023 |
| 2024/25 | **3.572** (provisório) [F,A] | **~2.100–2.130** [F,M] | **1.421** [F,A] | **177** [F,A] | Recuperação ibérica |
| 2025/26 | **3.440** (previsão COI, dez. 2025) [F,A] | **2.056** (previsão COI) [F,A] | **1.298,5** (fecho AICA) [F,A] | **160–179** [F,M] | PT: Olivum 160; INE ~175 (set. 2026); Governo 179 |
| 2026/27p | n.d. | n.d. | **1.602,6** (1.º aforo do MAPA, 01/10/2026) [F,A] | **~+10%** (Olivum) [F,M] | Andaluzia: 1.261,2 kt (+23,9%) |

Pontos-chave:
- A Espanha representa ~40% da produção mundial. Em 2025/26 fechou −8,6% (1.298.503 t contra 1.421.097 t), mas ficou 17% acima da média das quatro campanhas anteriores. As existências totais eram de 863.339 t em maio de 2026. [F,A]
- Em setembro de 2026, um pedido de um Estado-Membro (aparentemente a Itália) ao Conselho estimou as **existências finais da UE em 2025/26 em ~420 kt** e reportou quedas de preço superiores a 50% em zonas produtoras italianas. Pede a ativação da reserva agrícola. [F,M]
- **Portugal** é o 2.º produtor da UE em alguns anos e o 4.º noutros. O Alentejo representa ~85% da produção, e a expansão (olival intensivo e superintensivo) mantém a produção estruturalmente acima de 150 kt. O grau de autoaprovisionamento era de **247,9%** (INE). [F,M]

### 1.2 Comércio externo de Portugal

| Indicador | Valor | Período | Conf. |
|---|---|---|---|
| Exportações de azeite (valor) | **> 1.000 M€**, pelo 2.º ano consecutivo (estimativa do CEPAAL) | 2024 | M |
| Exportações (valor), 1.º semestre | ~**−35%** homólogo (efeito preço, não volume) | jan.–jun. 2025 | B |
| Excedente comercial | 92 M€ (−14% homólogo) | jan.–fev. 2026 | M |
| Destinos em volume | Espanha **37%**, seguida de França, EUA e Reino Unido; o granel vai sobretudo para Espanha e Itália, e o embalado com marca para o Brasil | 2024 | B |
| Quota de Portugal nas importações do Brasil | **62%** (vendas +20%) | 2025/26 | M |
| Importações vindas de Espanha | ~**121 kt** (2022) e ~**88 kt** (2023), através de tabelas GPP/INE | 2022–23 | B |

[I] Portugal é exportador líquido de granel para Espanha e Itália e importa granel espanhol para lotear e embalar. Os embaladores portugueses (Sovena, Gallo) operam à escala ibérica e mundial; o mercado português não é uma "ilha" de preços.

### 1.3 Preços na origem — série AOVE 2022–2026 (€/kg, granel)

| Data/período | Espanha (AOVE) | Fonte | Conf. |
|---|---|---|---|
| 1.ª semana de abr. 2022 | **3,45** | MAPA (via EFE) | M |
| 1.ª semana de abr. 2023 | **5,23** | MAPA (via EFE) | M |
| 23–29 dez. 2023 | **8,857** | Poolred | M |
| 2.ª semana de jan. 2024 (**pico**) | **8,988** (Poolred); 9,20 (Oleoestepa) | Olive Oil Times / imprensa | A |
| 1.ª semana de abr. 2024 | **7,84** | MAPA (via EFE) | M |
| jun. 2024 (Jaén) | **7,85** (+32,7% homólogo) | COI | A |
| dez. 2024 (Jaén) | **5,30** (−28,9%) | COI | A |
| fev. 2025 (Jaén) | **4,075** (−53,7%) | COI | A |
| 1.ª semana de abr. 2025 | **3,90** | MAPA (via EFE) | M |
| início de nov. 2025 | **4,62** (subiu de 4,39) | Poolred | M |
| jan./fev. 2026 (Jaén) | **4,07** (−2,5%) | COI | A |
| 16–22 mar. 2026 (Jaén) | **4,385** (+14,8%) | COI | A |
| 15–21 jun. 2026 (Jaén) | **3,785** (+7,5%) | COI | A |
| semana de 31 ago. 2026 | **3,58** (357,68 €/100 kg) | CE, via EVOO Index | M |
| 19–25 set. 2026 | **3,39** (−20% homólogo; o mínimo de mais de 2 anos) | Poolred | M |
| **29 set.–5 out. 2026** | **3,34** | Poolred | M |
| 13 out. 2026 | 3,05–3,36 (Infaoliva 3,10; Almazaras de Córdoba 3,05; Junta de Andalucía 3,36) | Infobae | M |

- Médias de campanha (agregador secundário de Poolred): **2024/25 = 3,89 €/kg**; **2025/26 = 4,31 €/kg** (até dez. 2025). [F,B]
- O diferencial entre AOVE e lampante comprimiu para **0,24 €/kg** (era 0,75 €/kg um ano antes). O prémio de qualidade está quase anulado. [F,M]
- **Portugal (SIMA/GPP e CE):** AOVE a granel a **4,43 €/kg** na semana 15/2026 (−31% homólogo); **3,95 €/kg** (395 €/100 kg) em jul. 2026; **3,50 €/kg** na semana 39/2026 (Oleista); intervalo de **3,40–3,80 €/kg** no início de out. 2026. Em Trás-os-Montes, o granel enfrenta a concorrência de azeite tunisino importado. [F,M]
- **Custos de produção (Espanha, AEMO, via imprensa):** 2,81 €/kg em sebe com rega e até **4,61 €/kg** em olival de montanha. A OliveA situa o limiar do olival tradicional em ~5 €/kg. O estudo do Observatorio para 2020/21 dava 1,44–4,33 €/kg. [F,M] [I] Aos preços atuais (3,1–3,6 €/kg), **o olival tradicional opera abaixo do custo**. Isto cria vendedores motivados, mas também risco de abandono de oferta.

### 1.4 Preços no retalho

**Portugal (AOVE, €/L com IVA a 6%; Observatório de Preços Agroalimentares/GPP):**

| Data | €/L | Conf. |
|---|---|---|
| 2022 | ~4 | M |
| Pico de 2024 | ~10 | M |
| 4 nov. 2024 | **8,69** | A |
| 6 out. 2025 | **6,55** | A |
| 26 jan. 2026 | **6,52** | A |
| Média de 23/03–19/04/2026 | **6,48** (−13% homólogo) | A |
| 20 abr. 2026 | **6,77** | A |

- Azeite virgem (não extra): 7,98 → 5,07 €/L entre nov. 2024 e out. 2025. A Casa do Azeite reporta vendas no mercado nacional **+30%** em jan.–out. 2025, ainda 8% abaixo da média de 2021–23. [F,A]
- **Preço "à porta do lagar" (SIMA):** AOVE em garrafão de 5 L a **6,08 €/L** (média nacional, mar. 2026), contra ~4,06 €/L de granel equivalente. A diferença de ~2 €/L é o que um lagar capta ao vender embalado diretamente. Não foi verificado se o preço inclui IVA. [F,M]

**Espanha (marca branca líder, com IVA a 4%):** AOVE Hacendado (Mercadona) a **4,35 €/L** (garrafa de 1 L, 12/10/2026) e **3,80 €/L** (garrafão de 5 L, 29/09/2026). [F,M] Sem IVA, isto corresponde a 4,57 €/kg e 3,99 €/kg [I]. **Contra 3,34 €/kg na origem, o garrafão de 5 L deixa 0,65 €/kg para embalamento, margem do embalador, logística e retalho.** É um preço de produto-chamariz.

### 1.5 Cadeia de valor — decomposição da margem (Observatorio de la Cadena Alimentaria, Espanha)

Não existe um estudo português equivalente publicado (o Observatório português só publica preços na produção e no consumo). O estudo espanhol de referência (MAPA/Universidade de Jaén) cobre as campanhas 2018/19, 2019/20 e 2020/21. A atualização acordada em 2023 **não tem resultados publicados que tenhamos encontrado**.

**Campanha 2019/20 (€/kg, AOVE, mercado espanhol):**

| Elo | €/kg | % do PVP s/ IVA | Notas |
|---|---|---|---|
| Aquisição de granel (olivicultor + lagar) | **2,117** [I] | 59,7% | Derivado: 3,086 − 0,470 − 0,499 |
| Custo de embalamento | **0,470** [F,M] | 13,3% | Média ponderada |
| **Margem líquida do embalador** | **0,499** [F,M] | **14,1%** | Ano de margem alta |
| Preço de venda do embalador | **3,086** [F,M] | 87,1% | |
| Custo de distribuição | **0,272** [F,M] | 7,7% | |
| Margem líquida da distribuição | **0,186** [F,M] | 5,2% | |
| **PVP** | **3,544** [F,M] | 100% | |

- **2018/19:** preço do embalador 3,167 €/kg; PVP 3,829 €/kg; **margem do embalador 0,187 €/kg (4,9% do PVP)**. [F,M]
- **2020/21:** PVP médio s/ IVA **3,666 €/kg** (3,394 no discount e 3,835 em hipermercados); custo de embalamento médio **0,514 €/kg** (intervalo de **0,293 a 1,589 €/kg** consoante o embalador); **lucro do embalador 0,206 €/kg (5,6%)**; lucro do lagar **0,001 €/kg**; distribuição com margem bruta de **0,051 €/kg** e resultado de **−0,231 €/kg** (o AOVE é usado como chamariz). [F,M]
- O olivicultor e o lagar geram ~70% do valor da cadeia mas recebem ~59% do preço e tiveram perdas nas duas campanhas iniciais do estudo. [F,M]

**Leitura [I]:** a "margem do embalador" é volátil (0,19–0,50 €/kg) e é apertada nas fases de alta de preços (o embalador absorve parte da subida para manter o PVP). Em percentagem, é maior quando o granel está barato, como acontece agora. O bolo relevante não é a margem líquida do embalador mas o **diferencial granel→prateleira**:

| Referência (out. 2026 / 1.º sem. 2026) | Prateleira s/ IVA (€/kg) | Granel (€/kg) | Diferencial | % da prateleira |
|---|---|---|---|---|
| ES, marca branca em garrafão de 5 L | 3,99 | 3,34 | **0,65** | 16% |
| ES, marca branca em garrafa de 1 L | 4,57 | 3,34 | **1,23** | 27% |
| PT, média de retalho de AOVE (mar.–abr. 2026) | 6,67 | 4,43 | **2,24** | 34% |

### 1.6 Embaladores: quem são e que margens têm

| Grupo | País | Dimensão | Margem | Período | Conf. |
|---|---|---|---|---|---|
| **Deoleo** (Carbonell, Bertolli, Koipe) | ES, cotada | Vendas de **~821 M€** (−17,6%); volume +11%; **8,3%** de quota mundial (Euromonitor) | Margem bruta de **15,2%** (2024: 9,9%); **EBITDA de 50 M€ = 5,9%**; dívida líquida de 86 M€ (1,7× EBITDA) | 2025 | A |
| **Sovena** (Nutrinveste; Andorinha, Oliveira da Serra) | PT/ES | Vendas de **~1,8 mil M€**; Sovena Espanha 1.320 M€; Sovena Portugal Consumer Goods ~550 M€; ~30% de quota no Brasil | **EBITDA > 100 M€ (~5,5%)**, o primeiro acima de 100 M€ | 2024 | M |
| **Acesur** (La Española, Coosur) | ES | Líder em volume em Espanha: ~60,2 M L | n.d. | 2023 | B |
| **Gallo** (Victor Guedes) | PT | "1.ª marca portuguesa e 4.ª mundial"; Brasil e Portugal como mercados principais | Contas recentes **não encontradas** | — | B |
| **Acushla** | PT (Vila Flor) | SA fundada em 2004 com capital de 1,2 M€; produtor-exportador de nicho (~87 mil L num ano citado; ~90% exportado) | Contas **não verificadas**; **não é um grande embalador** | — | B |
| Dcoop (cooperativa) | ES | Licitou a Deoleo (~470 M€, contra ~500 M€ da Coricelli, segundo a imprensa) | n.d. | 2026 | B |

- O mercado espanhol de azeite embalado somou **349 M L** no 1.º semestre de 2025/26 (−0,9%). O consumo interior espanhol em 2024/25 foi de **~495,8 kt** (AICA, via imprensa). [F,M]
- [I] Um EBITDA de 5–6% sobre um preço de ~4–5 €/kg equivale a **~0,20–0,30 €/kg**, o que é coerente com o Observatorio. Os embaladores ganham pela escala, pelo loteamento, pelas marcas e pela gestão de risco de preço, não por um "sobrepreço" fácil de capturar.

### 1.7 Teste quantitativo da tese do documento-fonte

Tese: "capturar 80–90% da margem do embalador + 10–15% de desconto ao cliente + spread operacional retido".

**Parâmetros:** granel PT de 3,6 €/kg [F,M]; embalamento de 0,51 €/kg [F,M]; logística até à HoReCa de 0,15–0,30 €/kg [E]; pagamentos, KYC e operação de 0,05–0,10 €/kg [E]. **Custo entregue do Sprout ≈ 4,4 €/kg (≈ 4,0 €/L)** [E].

| Cenário | Preço de referência s/ IVA | Preço Sprout (−10% a −15%) | Margem Sprout/kg | Veredicto |
|---|---|---|---|---|
| A. Contra marca branca ES 5 L | 3,99 | 3,39–3,59 | **−0,99 a −0,79** | Não fecha |
| B. Contra marca branca ES 1 L | 4,57 | 3,88–4,11 | **−0,50 a −0,27** | Não fecha |
| C. Contra a média do retalho PT | 6,67 | 5,67–6,00 | **+1,29 a +1,62** (23–27%) | Fecha, mas a HoReCa não compra a esta referência |
| D. Só "margem do embalador" | Captura 0,8–0,9 × 0,19–0,50 = **0,15–0,45** | Desconto custa 0,46–1,00 | **−0,85 a −0,01** | Não fecha |

**Conclusão [I]:** com a definição literal ("margem do embalador"), a tese é **aritmeticamente inconsistente**. Fecha apenas se (i) o bolo for o diferencial granel→prateleira, (ii) o produto for diferenciado (DOP, monovarietal, *single estate*, rastreabilidade de lote) e vendido contra referências de marca portuguesa e de cash & carry, e (iii) o embalamento for feito pelo próprio lagar a ≤0,5 €/kg. O preço de cash & carry português para AOVE em 5 L (Recheio/Makro) **não foi verificado**. É o dado n.º 1 a recolher no terreno.

### 1.8 Risco de preço e cobertura

- **Não existe um mercado de futuros de azeite operacional.** O MFAO (Jaén, supervisionado pela CNMV, a operar desde 2004) iniciou a dissolução em 2016, sobretudo pelo impacto do EMIR, e consta como sociedade extinta. [F,M] A cobertura só é possível com contratos físicos a prazo, opções OTC bilaterais ou *back-to-back* com compradores.
- **Volatilidade em janelas próximas de 18 meses [I]:** abr. 2022 → dez. 2023 (20 meses): 3,45 → 8,86 €/kg (**+157%**). jan. 2024 → abr. 2025 (15 meses): 8,99 → 3,90 €/kg (**−57%**). Qualquer *spread* de 0,2–1,6 €/kg é dominado pelo risco de preço da posição em stock.
- **Fatores para 2026/27:** a Espanha prevê 1,60 Mt (+23%), a Andaluzia 1,26 Mt (+23,9%), e o 1.º semestre de 2026 foi o mais quente de que há registo em Espanha (risco para o rendimento em gordura). As previsões variam entre 1,4 e 1,6 Mt. [F,M]

---

## 2. Água engarrafada

### 2.1 Volume e valor em Portugal

| Indicador | Valor | Período | Fonte | Conf. |
|---|---|---|---|---|
| Produção engarrafada | **1.802,8 M L** (+7%; mineral natural ~44%, nascente ~56%) | 2023 | DGEG (folheto 2023) | M |
| Produção engarrafada | **1.858 M L** | 2024 | APIAM (com base na DGEG) | M |
| Produção engarrafada | **~2.000 M L** (+7,9%) | 2025 | DGEG, "Águas em Números" | M |
| **Valor de mercado** | **479 M€ (+9%)** | 2025 | DGEG, "Águas em Números" | M |
| Valor médio por litro | **~0,24 €/L** | 2025 | [I] 479 M€ ÷ ~2.000 M L | M |
| Consumo per capita (Continente) | **182 L** (123 L em 2015) | 2024 | DGEG, via JN | M |
| Exportação | ~**2%** da produção, para 66 países | n.d. | APIAM | M |
| Estrutura | 27–32 unidades de engarrafamento; APIAM com 19 empresas (85% do setor); emprego no engarrafamento de 1.390 (+7,4%) | vários | APIAM/DGEG | M |
| Mercado sem gás | > 90% do mercado | 2018 | Nielsen, via Distribuição Hoje | B |

### 2.2 Principais operadores

- **Sociedade da Água de Luso** (Luso, Cruzeiro), integrada na Sociedade Central de Cervejas e Bebidas (grupo Heineken). Vendia ~178 M L/ano em 2017. As contas recentes **não foram verificadas**. [F,M]
- **Super Bock Group** (Vitalis, Pedras Salgadas, Vidago, Melgaço): vendas do grupo > 500 M€ (2023). A **água lisa representa ~5% das vendas em valor** do grupo, "porque o preço unitário é baixo". Investe 10 M€ até 2030 em Castelo de Vide (Vitalis). A Pedras lidera a água com gás. [F,M]
- Outros (Águas de Monchique, Serra da Estrela, Caramulo, Fastio e as marcas de distribuidor): presença confirmada pelo setor, mas **quotas e contas não verificadas**. Não foi encontrada uma quota de marca própria (MDD) em litros.

### 2.3 Preços por litro

| Nível | Valor | Fonte | Conf. |
|---|---|---|---|
| Valor médio do mercado PT | ~0,24 €/L | [I] DGEG | M |
| Espanha, retalho a lares | **0,233 €/L** (2.968,3 M L; 691,4 M€) | [I] Mercasa 2024 | M |
| Espanha, fora do lar | 613,3 M L, **17%** do volume total | Mercasa 2024 | M |
| PT, marca branca em garrafão de 5 L | ≥ 0,38 €/garrafão (~0,08 €/L), sem data | Doutor Finanças | B |
| PT, HoReCa (formatos pequenos e vidro) | **Não verificado.** Hipótese de trabalho: 0,30–0,60 €/L à saída do distribuidor | [E] | B |

### 2.4 Embalagem, logística e depósito — a "densidade de valor"

- **Origem obrigatória:** a água mineral natural e a água de nascente têm de ser **embaladas na origem** e o tratamento é muito restrito (Diretiva 2009/54/CE). [F,M] [I] O engarrafador é o dono da captação. **Não há um "embalador intermediário" a desintermediar.**
- **PET:** desde 2025, as garrafas PET de bebidas têm de incorporar **≥25% de plástico reciclado** (Diretiva (UE) 2019/904, art. 6.º). [F,A] As ofertas de PET virgem *bottle grade* na Europa estavam em ~**1.250 €/t** em ago. 2026 (ChemOrbis), com outras fontes a indicar 850–1.100 €/t [F,B]. O rPET alimentar custava **1.600–1.680 €/t** no início de 2025 (ICIS) [F,M].
  - [E] Garrafa de 1,5 L com 25–30 g de PET: ~0,03–0,05 €/garrafa, ou seja **0,02–0,03 €/L**. Com tampa, rótulo, retráctil e palete: **0,03–0,05 €/L, cerca de 13–20% do valor médio ex-fábrica**.
- **Transporte:** um camião completo Lisboa–Porto custava **250–270 €** (2021, ANTRAM). Em maio de 2026 o setor descreve uma "situação de emergência" pelos combustíveis (guerra com o Irão). [F,M]
  - [E] Com ~20.000 L por camião e 300–350 € em 2026, o transporte troncal custa **~0,015–0,018 €/L (6–7% do valor ex-fábrica)** por cada 300 km.
  - [E] A entrega fracionada à HoReCa custa 0,03–0,08 €/L (13–33%). **A logística total pesa 20–40% do valor ex-fábrica.**
- **SDR (Volta):** em vigor desde **10/04/2026**, com depósito de **0,10 €** por embalagem de plástico ou metal de bebidas com menos de 3 L. É obrigatório para todas as embalagens colocadas no mercado a partir de 10/08/2026. [F,A] [I] Numa garrafa de 1,5 L (~0,36 € ex-fábrica), o depósito equivale a **~28% do valor do produto**; numa de 0,33 L, a mais de 100%. Exige tesouraria e reconciliação de depósitos.
- **IVA:** as águas minerais e de nascente estão na taxa intermédia (Lista II, verba 1.11; **13%** no continente), segundo doutrina administrativa de 2016. **A confirmar na redação de 2026.** [F,B]

### 2.5 Adequação da água à tese

| Critério | Avaliação |
|---|---|
| Margem de embalador a capturar | **Nula**: o embalamento na origem é obrigatório |
| Valor por kg | ~0,24 €/kg, cerca de 15–25 vezes menos que o azeite |
| Peso da logística | 20–40% do valor [E] |
| Diferenciação | Marca e origem; o consumidor HoReCa escolhe a marca pedida pelo cliente final |
| Volatilidade de preço | Baixa; o risco está nos custos (PET, energia, combustível) e não num preço de mercado |
| Prazos de pagamento | Produto não perecível; a HoReCa atrasa-se em média 30 dias |
| **Veredicto [I]** | **Inadequada para "captura de margem" e para um produto de investimento a 18 meses.** Só se justifica como produto de cesto para densificar rotas de entrega de azeite, ou como marca própria para grupos HoReCa, com contrato de fornecimento a um engarrafador |

---

## 3. Café

### 3.1 Preços internacionais (ICE)

**Arabica, ICE "Coffee C" (KC), USD/lb:**

| Data | Valor | Fonte | Conf. |
|---|---|---|---|
| set. 2023 (indicador composto ICO, média mensal; não é o KC) | 1,53 | ICO | A |
| jun. 2024 (composto ICO) | 2,27, o máximo de 13 anos | ICO, via ESM | A |
| set. 2024 | máximo de 2,75 | Barchart | M |
| 30 jan. 2025 | 3,77 (intradiário) | Reuters, via NST | A |
| **início de fev. 2025 (recorde)** | **~4,30–4,41** | Perfect Daily Grind | M |
| 23 out. 2025 | 4,24 (máximo de 52 semanas) | Macrotrends | M |
| out. 2025 (composto ICO) | 3,26 | ICO | A |
| 9 jun. 2026 | 2,45 (mínimo de 52 semanas) | Macrotrends | M |
| jun. 2026 (média) | 2,57 | USDA FAS | A |
| 5 out. 2026 | 2,93 (fecho) | ICE | M |
| **9 out. 2026** | **2,85** (−24,4% homólogo) | Macrotrends | M |

**Robusta, ICE Europe (RC), USD/t:**

| Data | Valor | Fonte | Conf. |
|---|---|---|---|
| 1.º semestre de 2023 | máximo de ~2.729 | imprensa vietnamita | B |
| **fev. 2025 (recorde)** | **~5.788–5.821** | Comunicaffe | M |
| meados de set. 2026 | 3.430 (contrato de nov.) | Reuters, via Business Recorder | M |
| **12 out. 2026** | **3.470** (contrato de nov.) | Helena Coffee | M |

- **Fundamentais:** a USDA prevê a colheita mundial de 2026/27 em **189,7 M sacas (+6%, recorde)**, com o Arabica do Brasil a crescer +25% para 47,5 M sacas. A CONAB é mais conservadora (66,7 M sacas no total do Brasil). Os stocks certificados de Arabica no ICE estavam no mínimo de 2,75 anos (227.992 sacas, ago. 2026). [F,A/M]
- **Conversão [I]:** 2,85 USD/lb equivale a 6,28 USD/kg, ou **~5,5 €/kg de Arabica verde**. 3.470 USD/t equivale a **~3,0 €/kg de Robusta verde**. Com ~15–20% de perda na torra [E], o grão verde representa ~3,7–6,7 € por kg de café torrado.
- **Cobertura:** existem futuros líquidos no ICE (contratos de 37.500 lb e de 10 t), pelo que é possível cobrir o risco de preço, ao contrário do azeite. Fica a exposição cambial EUR/USD, cuja última leitura verificada foi de 1,1401 a 26/06/2026.

### 3.2 Mercado português

| Indicador | Valor | Período | Conf. |
|---|---|---|---|
| Faturação do setor (torrefação e comercialização) | **695 M€** (+6,9%); 92 empresas | 2024 | A |
| Série | 530 (2021), 590 (2022), 660 (2023) M€ | 2021–23 | A |
| Exportações (torrado e solúvel) / importações | 134 M€ (+9,8%) / 255 M€ (+12,8%) | 2024 | A |
| Consumo per capita | ~5,5 kg/ano (AICC/FIPA, sem data) | n.d. | B |
| Densidade de pontos de venda | 1 por cada 160 habitantes (média europeia: ~400) | n.d. | B |
| **Grupo Nabeiro-Delta** | **650 M€** (+12%), dos quais ~400 M€ em Portugal; exportação de 35%; o crescimento veio da HoReCa e de Espanha | 2025 | A |
| Delta (contexto) | ~570 M€ (+14%) em 2024, depois de "quatro anos com resultados negativos ou próximos de zero" | 2024 | M |
| **Nestlé Portugal** (Buondi, Sical, Tofa, Christina, Nescafé, Starbucks) | Vendas de 677 M€ (2022), com o café a pesar mais de 50%; fábrica no Porto | 2022 | M |
| **Massimo Zanetti Beverage Ibéria** (Segafredo, Nicola, Chave d'Ouro) | Formada em 2017 como 3.º operador | 2017 | M |
| Retalho: café torrado moído | Média de 4,31 €/250 g em 2025 (+0,90 €); **5,15 €/250 g** no fim de mar. 2026 (+14% no 1.º trimestre) | 2025–26 | A |
| HoReCa: bica | ~0,90 € em 2025, a caminho de ≥1 € | 2025 | M |

### 3.3 Onde está a margem

- A nível mundial, as exportações de café verde (~20 mil M USD) valem **≤10%** dos >200 mil M USD de valor no retalho (ICO, 2019). A ICO (Coffee Development Report 2020) conclui que o valor é captado sobretudo por torrefatores e comerciantes nos países consumidores. [F,M]
- **Portugal [I]:** o grão verde custa ~3–7 €/kg de torrado; o retalho vende a ~20,6 €/kg (5,15 €/250 g, com IVA); a HoReCa vende a ~130–140 €/kg servido (≈7 g por bica a ~0,90–1,00 €). A margem está na **torra, marca, distribuição e serviço**.
- **Contratos HoReCa:** a jurisprudência portuguesa (TRG) descreve o contrato-tipo como uma figura complexa que combina comodato de equipamento, publicidade e exclusividade, com compra mínima (no caso, **12 kg/mês até 432 kg**). [F,M] [I] O café HoReCa está **"trancado" pelos torrefatores**. Um marketplace não entra sem financiar equipamento e sem substituir a relação comercial.
- **Adequação [I]:** o grão verde é hedgeável e tem preço transparente, mas o cliente natural seria o pequeno torrefator (o setor tem 92 empresas) e não a HoReCa. É uma vertical a avaliar depois do piloto, como *sourcing* de verde para microtorrefatores.

---

## 4. Procura em Portugal

### 4.1 HoReCa

- **74.524 empresas** de restauração e similares, com **324.130 trabalhadores** (2024, INE via AHRESP); **91% microempresas** e 51% empresários em nome individual. [F,M] A partir de 2025 aplica-se a CAE Rev.4, o que obriga a cuidado nas comparações. O canal HORECA empregava 337,8 mil pessoas no 2.º trimestre de 2025 (+9,4%). [F,M]
- A AHRESP reporta pressão sobre custos e "encerramentos silenciosos" de microempresas (abr. 2026). A inflação na restauração foi de 5,8% em 2024. [F,M]
- O número de estabelecimentos de alojamento turístico em 2024 **não foi verificado**. Houve 31,6 M hóspedes e 80,3 M dormidas (2024, +5,2% e +4,0%). [F,M]
- **Espanha (expansão):** > 300.000 estabelecimentos de hotelaria, com vendas de 166,2 mil M€ e 1,85 M empregos (Anuário de 2025). O anuário de 2024 contava 263.508 estabelecimentos de restauração. [F,M]

### 4.2 Distribuição grossista e cash & carry

| Operador | Valor | Período | Conf. |
|---|---|---|---|
| **Recheio** (Jerónimo Martins) | **~1,4 mil M€** (+3%; LFL +3%) | 2025 | A |
| Recheio | 673 M€ (+2,5%) | 1.º semestre de 2026 | A |
| **Makro Portugal** (Metro) | 351 M€, o último valor público encontrado | 2019/20 | B |
| Aviludo (adquirida pela Metro) | 152 M€ | ano anterior à aquisição | M |
| Grossistas de produtos alimentares para hotelaria (DBK/Informa D&B) | 1.330 M€ (2019); 1.100 M€ (2021); o estudo de jan. 2026 cobre 38 empresas (Bidfood, Garcias, Makro, Sogenave, …) | 2019–21 | M |

[I] A HoReCa compra em cash & carry (Recheio/Makro) e a distribuidores *foodservice* com entrega, crédito e sortido amplo. O Sprout concorre com o **cesto completo** destes operadores, e não só com o preço de um produto.

### 4.3 Comportamento de pagamentos (Informa D&B, dados de maio de 2026)

- Só **20,2%** das empresas portuguesas cumprem os prazos (a média europeia era de 52% no fim de 2025). Portugal é penúltimo entre 37 países. [F,A]
- 65,2% atrasam-se até 30 dias, 9% entre 30 e 90 dias e 5,6% mais de 90 dias. [F,A]
- **Alojamento e restauração:** atraso médio de **30 dias**; só **11%** pagam a horas, o pior setor. Grossistas: atraso médio de 19 dias. Grandes empresas: só 4% pagam a horas. [F,A]
- **~66 mil empresas (12%)** estão em risco de atrasos superiores a 90 dias (eram 43 mil no ano anterior). [F,A]

### 4.4 Regime legal de prazos de pagamento

| Instrumento | Regra relevante | Conf. |
|---|---|---|
| **Diretiva (UE) 2019/633** (práticas comerciais desleais na cadeia agroalimentar) | Pagamento a **>30 dias para perecíveis** e a **>60 dias para outros produtos agroalimentares** é proibido. Aplica-se por escalões de volume de negócios do fornecedor face ao comprador (2/10/50/150/350 M€) | A |
| **DL 118/2010**, alterado pelo **DL 76/2021** (publicado a 27/08/2021; em vigor a 01/11/2021) | Art. 3.º-A: perecíveis ≤ 30 dias; não perecíveis 30 ou 60 dias, consoante a categoria do comprador e os escalões de volume de negócios a partir de 2 M€ (tabela completa **a confirmar**). O prazo conta da entrega ou da fatura, a que for posterior. Resumos de faturas até 20 dias (no regime de 30) ou 50 dias (no de 60). Fiscalização pela ASAE. Aplica-se só a alimentos para consumo humano | M |
| **Diretiva 2011/7/UE** (atrasos de pagamento) | B2B: até 60 dias, salvo se não for manifestamente abusivo; juros de mora e indemnização | A |
| Proposta de **Regulamento de atrasos de pagamento** (limite de 30 dias) | O Parlamento aprovou o seu texto em abr. 2024; o processo está **bloqueado no Conselho**, sem acordo conhecido em 2026 | M |

[I] Duas consequências:
- **Montante:** o Sprout, enquanto comprador de azeite e água a produtores, **não pode diferir o pagamento ao produtor para 18 meses**, pelo menos quando os escalões se aplicarem e em qualquer caso por boa prática. O ciclo de 18 meses só pode existir **do lado do capital**, e não da compra ao produtor.
- **Jusante:** a lei limita o prazo que a HoReCa pode exigir, mas a realidade é de 30 dias de atraso médio. São necessários débito direto SEPA, pré-pagamento ou seguro de crédito e factoring.

---

## 5. TAM / SAM / SOM — estimativas [E]

Todos os valores desta secção são **estimativas nossas**, com o método indicado. Usam preços de 2025–2026 e devem ser recalculados a cada campanha.

| Camada | Componente | Método | Valor anual |
|---|---|---|---|
| **TAM PT** | Azeite, consumo aparente | 45–65 kt [E, conf. B: per capita de 3,7 kg na crise de 2022/23 (COI) como piso, mais a recuperação de +30% em 2025 (Casa do Azeite)] × 6,67 €/kg (retalho s/ IVA) | **~300–435 M€** (a preço de retalho); ~160–235 M€ (a preço de origem) |
| | Água | DGEG 2025 | **479 M€** (~2.000 M L) |
| | Café | Informa D&B 2024 | **695 M€** |
| | Oferta de azeite PT (lado do produtor) | 175 kt × 3,4–4,4 €/kg | ~0,6–0,77 mil M€ |
| **SAM PT** (HoReCa + retalho independente; azeite + água) | Azeite | Quota HoReCa de 20–30% [E, não verificado] → 9–19,5 kt × 4,5–5,5 €/kg | ~40–107 M€ |
| | Água | 17% fora do lar (proxy Espanha, Mercasa) × ~1.960 M L → ~335 M L × 0,30–0,50 €/L [E] | ~100–168 M€ |
| | **Total** | | **~140–275 M€** |
| **SAM Ibéria** | Espanha: azeite | 496 kt × 20–30% × 4,0–4,5 €/kg | ~0,40–0,67 mil M€ |
| | Espanha: água | 613 M L fora do lar × 0,30–0,50 €/L | ~0,18–0,31 mil M€ |
| | **Total Ibéria** (PT + ES) | | **~0,7–1,25 mil M€** |
| **SOM PT** (36 meses) | Por cliente HoReCa: azeite ~150–300 L/ano e água ~3.000–5.000 L/ano [E, derivado do SAM ÷ n.º de empresas] | GMV de ~1,7–4,1 mil € por cliente por ano | |
| | Piloto fechado (12 meses) | 50–100 clientes | **~0,1–0,4 M€ de GMV** |
| | Ano 3 | 1.000–2.000 clientes (1,3–2,7% das empresas HoReCa) | **~1,7–8 M€ de GMV** (0,6–3% do SAM PT) |
| | Margem de contribuição | 8–15% do GMV [E] | **~0,15–1,2 M€** |

**Leitura [I]:** o fluxo B2B HoReCa é **pequeno e fragmentado**. Não sustenta, por si, uma estrutura de capital com investidores, SPV e janelas de 18 meses. Os bolos maiores estão a montante:
- **Granel PT:** ~0,6–0,77 mil M€ a preço de origem. É um mercado de corretagem e trading entre lagares, embaladores e exportadores.
- **Exportação embalada:** acima de 1 mil M€.

Se o objetivo do produto de investimento for financiar stock, o ativo subjacente natural é o **granel de lagar armazenado e certificado** (warehouse receipts), e não a venda fracionada à HoReCa.

---

## 6. Implicações para o Sprout

1. **Reescrever a tese económica.** Abandonar "80–90% da margem do embalador" como métrica. Ela vale 0,19–0,50 €/kg e não financia um desconto de 10–15% (cenário D: −0,85 a −0,01 €/kg). A métrica correta é a **percentagem do diferencial granel→prateleira captada**: hoje é de 0,65–2,24 €/kg, ou seja 16–34% do preço de prateleira sem IVA. O deck de *roadshow* não deve usar o 80–90% sem esta correção. É um risco de afirmação enganosa perante investidores.
2. **Definir a referência do desconto.** "10–15% abaixo do mercado" só é viável contra marcas portuguesas e preços de cash & carry, e **não contra marcas brancas espanholas** (cenários A e B são negativos). Antes do piloto, recolher 20–30 cotações reais de Recheio, Makro e distribuidores *foodservice* para AOVE em 5 L e água por formato. Fixar a política de desconto em **€/L sobre uma referência observada**, e não em percentagem sobre um "mercado" abstrato.
3. **Diferenciar para ter margem.** Com o AOVE a 3,1–3,6 €/kg e o prémio sobre o lampante comprimido a 0,24 €/kg, o *commodity* puro não tem margem. A oferta inicial deve ser **azeite de origem identificada** (lagar âncora, lote, DOP ou monovarietal, ficha analítica), vendido a HoReCa média/alta e a lojas *gourmet*. A rastreabilidade de lote que o documento-fonte já prevê na UX é, afinal, a fonte da margem.
4. **Retirar a água do piloto, ou reduzi-la a "produto de cesto".** Não há embalador a desintermediar (embalamento na origem obrigatório). O valor é de ~0,24 €/L, a logística pesa 20–40% e o depósito Volta é de 0,10 € por embalagem. O piloto deve ser **azeite + um segundo produto não perecível de alto valor por kg** (ex.: vinagre, conservas ou mel de produtores parceiros). Se a água ficar, deve ser só como marca própria contratada a um engarrafador para um grupo HoReCa, ou como enchimento de rotas.
5. **Adiar o café e redefini-lo como *sourcing* de verde.** A HoReCa está presa a exclusividades e comodatos dos torrefatores; a margem está na torra e na marca. Se entrar, deve ser como fornecedor de verde para microtorrefatores, com cobertura em ICE KC/RC e cobertura cambial EUR/USD.
6. **O risco de preço domina tudo; não prometer liquidação a 18 meses sobre stock não coberto.** O azeite variou +157% (abr. 2022 → dez. 2023) e −57% (jan. 2024 → abr. 2025) em janelas de 15–20 meses, e **não tem futuros cotados** desde a extinção do MFAO. A política de cobertura (o entregável da Tesouraria) tem de assentar em **operações *back-to-back*** (comprar só com venda contratada a preço fixo), contratos a prazo com lagares e limites de stock em dias de vendas. Não se deve apostar em "hedge funds". Qualquer retorno ao investidor indexado ao *spread* é, na prática, uma posição longa em azeite.
7. **Separar o ciclo do produtor do ciclo do capital.** O DL 118/2010 (com o DL 76/2021) e a Diretiva 2019/633 limitam o pagamento ao produtor a 30–60 dias. O contrato padrão Produtor↔Plataforma deve prever **pagamento ≤30 dias** (ou na entrega). As janelas de 18 meses, a extensão e o *refunding* só podem existir no contrato Plataforma↔Investidor, o que reforça a necessidade da nota jurídica sobre SPV, AIFMD e prospeto.
8. **Planear a tesouraria para devedores lentos.** Com 11% da HoReCa a pagar a horas e 30 dias de atraso médio, o piloto deve exigir **débito direto SEPA ou pré-pagamento**, com limite de crédito por cliente e seguro de crédito. O *fill rate* e o DSO devem ser KPI diários a par da reconciliação. O SLA de "reconciliação diária" do documento-fonte tem de incluir os depósitos do SDR, se houver água.
9. **Ajustar a ambição à escala real.** O SOM a 36 meses é de 1,7–8 M€ de GMV e 0,15–1,2 M€ de margem. Se a ambição for maior, o modelo deve olhar para **o granel a montante** (lagar → embaladores e exportadores; ~0,6–0,77 mil M€ por ano em Portugal) e para a **exportação embalada para o Brasil**, onde Portugal tem 62% das importações. A tese de "liquidez operacional sobre ativos físicos" encaixa melhor em stock de granel certificado do que em entregas HoReCa.
10. **Calendário favorável à compra, desfavorável ao *mark-to-market*.** Com a campanha 2026/27 a começar e uma colheita espanhola prevista de 1,6 Mt, os preços de origem deverão manter-se baixos no inverno de 2026/27 [I]. É bom para fixar contratos de compra com o lagar âncora. É mau para qualquer promessa de valorização do stock a investidores.
11. **Recolher dados que faltam antes do business plan final:**
    - preço de cash & carry PT (AOVE em 5 L, água por formato);
    - contas da Gallo, Sovena 2025, SAL/Luso e Super Bock (via Informa D&B);
    - consumo aparente de azeite em PT (COI/GPP);
    - quota HoReCa do azeite;
    - tabela completa de escalões do art. 3.º-A do DL 118/2010;
    - EUR/USD de outubro de 2026.

---

## 7. Itens não verificados (ou de baixa confiança)

- Produção mundial e da UE em 2021/22–2023/24 com tabelas primárias do COI e da DG AGRI. Os valores usados vêm de citações na imprensa (AFP, The Grocer, OFI).
- Produção de Portugal em 2025/26: as fontes divergem (160 / 175 / 179 kt).
- Consumo aparente de azeite em Portugal em 2024/25 e 2025/26: **não encontrado**. O intervalo de 45–65 kt é estimativa nossa.
- Exportações de azeite de Portugal em 2025 (ano completo, valor e volume) e importações de Espanha em 2024–2025.
- Preço de AOVE em cash & carry ou *foodservice* em Portugal (Recheio, Makro, distribuidores).
- Margens e contas recentes da Gallo, da Acushla e da Sovena (2025).
- Resultados da atualização do estudo de cadeia de valor do AOVE (Observatorio, iniciada em 2023).
- Faturação e quotas atuais da Sociedade da Água de Luso, das águas do Super Bock Group, das Águas de Monchique e das marcas próprias. Preços HoReCa da água por litro.
- Peso de cada garrafa PET e custo logístico por litro: são hipóteses de engenharia, a validar com um engarrafador.
- Preço do Robusta em outubro de 2026 a partir de fonte primária ICE (usado: Helena Coffee e Reuters). EUR/USD de outubro de 2026.
- Número de estabelecimentos de alojamento turístico em 2024. Vendas da Makro Portugal depois de 2019/20.
- Taxa de IVA atual da água engarrafada (13%?) e do café vendido no retalho.
- Tabela completa de escalões de volume de negócios do art. 3.º-A do DL 118/2010 (30 vs 60 dias, regra específica para compradores HoReCa).
- Quota HoReCa no consumo de azeite e de água em Portugal (usámos hipóteses de 20–30% e 17%).

---

## Fontes

Todas acedidas a 13/10/2026 (através de extratos de pesquisa; ver a limitação no início).

**Azeite: produção, mercado e política**
- COI, Olive sector statistics, dez. 2025 — https://www.internationaloliveoil.org/olive-sector-statistics-december-2025-and-forecasts/
- COI, jan./fev. 2026 — https://www.internationaloliveoil.org/olive-sector-statistics-january-february-2026/
- COI, abr. 2026 — https://www.internationaloliveoil.org/olive-sector-statistics-april-2026/
- COI, jun.–jul. 2026 — https://www.internationaloliveoil.org/statistiques-du-secteur-oleicole-juin-juillet-2026/
- COI, mar. 2025 (consumo per capita) — https://www.internationaloliveoil.org/olive-sector-statistics-march-2025/
- COI, preços (jun. 2024) — https://www.internationaloliveoil.org/wp-content/uploads/2024/06/IOC-prices-rev-0-1.html
- COI, preços (dez. 2024) — https://internationaloliveoil.org/wp-content/uploads/2024/12/IOC-prices-rev-0-1.html
- COI, preços (fev. 2025) — https://www.internationaloliveoil.org/wp-content/uploads/2025/03/IOC-prices-rev-0-1.html
- AFP, via The Local — https://www.thelocal.es/20240627/stress-test-olive-oil-producers-adapt-to-climate-change
- The Grocer — https://www.thegrocer.co.uk/commodities/olive-oil-markets-catch-a-break-as-spain-production-estimates-are-bumped/684371.article
- OFI Magazine — https://www.ofimagazine.com/news/eu-2024-25-olive-oil-production-to-rise-by-a-third-after-two-challenging-years
- Olive Oil Times, UE 2024/25 — https://www.oliveoiltimes.com/business/supply-rebound-pushes-prices-down-as-uncertainty-clouds-outlook/144039
- Comissão Europeia, DG AGRI (perspetivas) — https://agriculture.ec.europa.eu/document/download/beb64ad4-c447-4fe3-92b8-7c0be682065b_en
- Comissão Europeia, DG AGRI (balanço, mar. 2025) — https://agriculture.ec.europa.eu/document/download/cd2c7470-4d1c-4cdc-8c9f-83b37a427719_en
- Conselho da UE, ST-13543-2026 — https://data.consilium.europa.eu/doc/document/ST-13543-2026-INIT/x/pdf
- Oleista, situação do mercado espanhol (dez. 2024) — https://oleista.com/en/mercado/spanish-olive-oil-market-situation-december-2024
- Agronews, fecho AICA 2025/26 — https://www.agronewscastillayleon.com/produccion-aceite-oliva-1298000-toneladas-cosecha-2026-2027
- AgroCLM — https://www.agroclm.com/2026/05/12/la-produccion-final-de-aceite-de-oliva-de-la-campana-2025-2026-roza-las-13-millones-de-toneladas/
- Agrodigital, aforo nacional 2026/27 — https://www.agrodigital.com/2026/10/02/aforo-aceite-oliva/
- Agronews, aforo da Andaluzia — https://www.agronewscastillayleon.com/andalucia-produccion-aceite-oliva-2026-2027-aforo/
- Agronews, consumo interior AICA 2024/25 — https://www.agronewscastillayleon.com/aceite-oliva-resultados-25
- Agronews, azeite embalado (349 M L) — https://www.agronewscastillayleon.com/ventas-aceite-envasado-2026-349-millones-litros
- Agroportal, previsão INE 2022 — https://bo.agroportal.pt/producao-de-azeite-devera-cair-40-em-2022-mas-ser-a-4-a-melhor-campanha-de-sempre-ine
- Renascença, recorde de 2021 — https://rr.pt/noticia/amp/economia/2022/02/17/producao-de-azeite-atinge-niveis-recorde-e-a-de-cereais-de-inverno-esta-em-minimos-historicos/272869/
- Olive Oil Times, Portugal — https://oliveoiltimes.com/production/portugal-enjoys-record-high-off-year-harvest/118415
- INE, ESC 2024 Alentejo — https://www.ine.pt/scripts/esc2024/A1_ALÉMTEJO.pdf
- Notícias ao Minuto (INE, EA 2024) — https://www.noticiasaominuto.com/economia/2686786/preco-do-azeite-desce-quase-30-em-2024
- Renascença, exportações de 2024 — https://rr.pt/noticia/amp/pais/2025/05/21/portugal-deve-ter-exportado-mais-de-mil-milhoes-de-euros-de-azeite-em-2024/426351/
- CNN Portugal — https://cnnportugal.iol.pt/azeite/exportacoes/exportacoes-de-azeite-vao-ultrapassar-os-mil-milhoes-de-euros-pelo-segundo-ano-consecutivo/20250521/682dca74d34e3f0bae9e74f8
- Agroportal, semana de 21–27 set. 2026 — https://www.agroportal.pt/azeite-e-azeitona-21-a-27-de-setembro-de-2026/
- Veja Portugal (179 kt) — https://www.vejaportugal.pt/2026/07/03/producao-nacional-de-azeite-devera-atingir-179-mil-toneladas-na-campanha-2025-2026/
- Observador (Olivum 2026/27) — https://observador.pt/2026/09/23/producao-de-azeite-em-portugal-pode-crescer-10-em-2026-2027-e-aproximar-se-das-177-mil-toneladas-da-campanha-anterior/
- JN (autoaprovisionamento) — https://www.jn.pt/nacional/artigo/portugal-produz-mais-azeite-e-vinho-do-que-consome/18109107
- Portugal Global (Brasil) — https://portugalglobal.pt/noticias/2026/agosto/azeite-portugues-conquista-o-brasil-com-subida-de-20/
- SIMA/GPP, boletim azeite (comércio) — https://www.agroportal.pt/wp-content/uploads/2025/01/azei_News52.pdf

**Azeite: preços**
- Olive Oil Times, recorde de jan. 2024 — https://oliveoiltimes.com/briefs/prices-set-records-in-spain/115541
- Agroportal, preços de 2023 em máximos — https://www.agroportal.pt/los-precios-en-origen-del-aceite-cierran-2023-en-maximos-historicos
- Infobae/EFE, abr. 2025 — https://www.infobae.com/espana/agencias/2025/04/16/el-precio-en-origen-del-aceite-de-oliva-virgen-extra-se-acerca-a-los-niveles-de-2022/
- Agroinformación (Poolred, nov. 2025) — https://agroinformacion.com/el-precio-en-origen-del-aceite-de-oliva-virgen-extra-sube-un-53-la-ultima-semana-y-se-situa-en-462-euros-el-kilo-segun-el-sistema-poolred/
- AgroCLM (dez. 2025) — https://www.agroclm.com/2025/12/12/precio-medio-en-origen-del-aceite-de-oliva-12-diciembre-2025/
- Navarra Exports (set. 2026) — https://navarraexports.com/en/market-intelligence/spanish-olive-oil-prices-september-2026-bulk-buyers
- Wikifarmer, semana 41/2026 — https://wikifarmer.com/library/en/article/olive-oil-prices-spain-national-aforo-2026-27
- COAG Jaén — https://coagjaen.es/precio-aceite-2-de-octubre/
- Oleista, preços — https://oleista.com/en/prices
- Infobae, 13/10/2026 — https://www.infobae.com/espana/2026/10/13/precio-del-aceite-de-oliva-en-espana-este-martes-13-de-octubre/
- EVOO Index (dados CE) — https://evooindex.eu/spain
- CNBC (Deoleo, jul. 2026) — https://www.cnbc.com/2026/07/17/spain-olive-oil-europe-heat-climate.html
- Agroportal, SIMA semana 15/2026 — https://www.agroportal.pt/cotacoes-azeite-e-azeitona-6-a12-de-abril-de-2026/
- SIMA, boletim n.º 12/2026 — https://www.agroportal.pt/wp-content/uploads/2026/03/azei_News12.pdf
- SIMA, boletim n.º 30/2026 — https://www.agroportal.pt/wp-content/uploads/2026/07/azei_News30.pdf
- Observatório de Preços Agroalimentares, período 4/2026 — https://observatorioagroalimentar.gov.pt/wp-content/uploads/2026/05/Observatorio_Resumo_Periodo-042026.pdf
- Observador (Lusa, jul. 2026) — https://observador.pt/2026/07/02/azeite-virgem-extra-mais-caro-025-euros-por-litro-entre-janeiro-e-abril/
- Renascença (dez. 2025) — https://rr.pt/noticia/economia/2025/12/05/litro-de-azeite-ficou-291-euros-mais-barato-no-ultimo-ano/450569/
- Postal (pico de ~10 €/L) — https://postal.pt/nacional/descidas-no-preco-do-azeite-preocupam-produtores-nao-podemos-voltar-aos-valores-de-2021/
- Preços Mercadona — https://www.aceitedeoliva.com/precios-aceite-de-oliva-mercadona/
- RadarSuper (garrafão de 5 L) — https://radarsuper.com/mercadona/p/aceite-oliva-virgen-extra-hacendado-garrafa-14727
- IVA em Espanha — https://www.conversoriaecnae.es/iva/tipos-de-iva
- AT, informação vinculativa (IVA do azeite a 6%) — https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/informacoes_vinculativas/despesa/civa/Documents/PIV_29955.pdf
- DNotícias (OE2026) — https://www.dnoticias.pt/2025/10/10/466111-governo-propoe-iva-de-6-para-a-producao-de-azeite/

**Azeite: cadeia de valor, custos, embaladores, futuros**
- MAPA, estudo de cadeia de valor do AOVE 2019/20 — https://www.mapa.gob.es/dam/mapa/contenido/alimentacion/temas/consumo-y-tendencias-en-alimentacion/observatorio-cadena-alimentaria-abril-2016/estudios-e-informes/estudiodelacadenadevalordelaove2019-202008062021.pdf
- MAPA, estudo 2018/19–2019/20 — https://www.mapa.gob.es/dam/mapa/contenido/alimentacion/temas/consumo-y-tendencias-en-alimentacion/observatorio-cadena-alimentaria-abril-2016/estudios-e-informes/estudiodecadenadevalordelaovecampanas2018-20192019-2020.pdf
- Universidade de Oviedo (TFM) — https://digibuo.uniovi.es/dspace/bitstream/handle/10651/74571/TFM_EnriqueCandanedoMorala.pdf
- Interempresas (2020/21) — https://www.interempresas.net/Produccion-Aceite/474711-Actualizado-el-estudio-de-la-cadena-de-valor-del-aceite-de-oliva-virgen-extra.html
- Mercacei — https://www.mercacei.com/noticia/58760/actualidad/publicadas-las-conclusiones-del-estudio-de-la-cadena-de-valor-del-aceite-de-oliva-virgen-extra.html
- Olimerca — https://www.olimerca.com/noticiadet/ya-se-conoce-la-cadena-de-valor-del-aceite-de-oliva-virgen-extra/0351a1f671b6f4e2f1d78f742ea3180d
- elEconomista (atualização de 2023) — https://www.eleconomista.es/retail-consumo/noticias/12208374/03/23/El-observatorio-de-la-cadena-analizara-los-precios-del-aceite-la-leche-la-miel-y-la-fruta.html
- El Debate (custos AEMO) — https://www.eldebate.com/espana/andalucia/20251005/revolucion-silenciosa-olivar-andaluz-futuro-aceite-pasa-riego-mecanizacion_340745.html
- Agronews (limiar OliveA) — https://www.agronewscastillayleon.com/aceite-oliva-olivea-precios-5-euros-olivar-tradicional
- Deoleo, resultados de 2025 — https://deoleo.com/en/deoleo-increases-ebitda-by-50-to-e50m-and-achieves-a-net-profit-of-e20m/
- IEAF (análise Deoleo) — https://institutodeanalistas.com/wp-content/uploads/ole_20260302_1.pdf
- elEconomista (quota Deoleo) — https://www.eleconomista.es/retail-consumo/noticias/14009896/08/26/deoleo-consolida-su-trono-mundial-y-duplica-la-cuota-de-mercado-de-su-principal-competidor-en-plena-venta.html
- Cordópolis (licitação Deoleo) — https://cordopolis.eldiario.es/cordoba-hoy/sociedad/espana-e-italia-vuelven-disputarse-liderazgo-aceite-oliva-claves-batalla-deoleo_1_13466441.html
- ECO (Sovena) — https://eco.sapo.pt/entrevista/sovena-vence-onde-muitas-empresas-falharam-temos-perto-de-30-de-quota-no-brasil/
- Grande Consumo (Sovena Espanha) — https://grandeconsumo.com/sovena-espanha-cresce-107-e-reforca-aposta-no-girassol-e-no-azeite/
- Forbes Portugal (Sovena) — https://www.forbespt.com/forbes-os-50-mais-ricos-manuel-alfredo-de-mello-e-os-milhoes-do-negocio-do-azeite/
- Statista (embaladores em Espanha) — https://es.statista.com/estadisticas/499404/volumen-de-produccion-de-las-empresas-lideres-de-aceite-de-oliva-envasado-espana
- Infotrustgo (Acushla) — https://infotrustgo.pt/en/companies/acushla-sa
- Agroportal (Acushla) — https://www.agroportal.pt/?p=731231
- Agroportal (Gallo) — https://bo.agroportal.pt/?p=949270
- Wikipédia (MFAO) — https://es.wikipedia.org/wiki/Mercado_de_Futuros_del_Aceite_de_Oliva
- eInforma (MFAO extinta) — https://www.einforma.com/informacion-empresa/mfao-rectora-mercado-futuros-aceite-oliva

**Água**
- DGEG, Águas em Números — https://www.dgeg.gov.pt/pt/destaques/aguas-em-numeros-estatisticas-dos-recursos-hidrogeologicos-e-geotermicos/
- DGEG, folheto estatístico de 2023 (cópia) — https://www.apren.pt/contents/publicationsothers/dsrhg-folhetoestatistica-nr2-2023.pdf
- DGEG, Estatística 2024 — https://www.dgeg.gov.pt/pt/estatistica/geologia/recursos-hidrogeologicos-e-geotermicos/engarrafamento/estatistica-2024/
- APIAM, números do setor — https://www.apiam.pt/setor/os-numeros-do-setor/6
- JN (182 L) — https://www.jn.pt/nacional/artigo/consumo-de-agua-engarrafada-nao-para-de-crescer-cada-portugues-consumiu-182-litros-em-2024/17958234
- Executive Digest — https://executivedigest.sapo.pt/consumo-de-agua-engarrafada-em-portugal-atinge-recorde-em-2024-cada-pessoa-bebeu-em-media-182-litros/
- Distribuição Hoje (2018) — https://www.distribuicaohoje.com/insights/mercado-de-agua-engarrafada-faturou-mais-37-milhoes-nos-dois-ultimos-anos/
- Mercasa, aguas envasadas — https://www.mercasa.es/wp-content/uploads/2026/02/Aguas-envasadas.pdf
- Doutor Finanças — https://www.doutorfinancas.pt/financas-pessoais/poupar-agua-engarrafada/
- Público (Luso) — https://www.publico.pt/2017/08/23/economia/noticia/a-longevidade-do-luso-dentro-de-178-milhoes-de-litros-de-agua-1783015
- DN (Super Bock Group) — https://www.dn.pt/economia/o-super-bock-group-nao-e-uma-empresa-arrivista-privilegiamos-o-medio-e-longo-prazo-2
- DN (investimento em Castelo de Vide) — https://www.dn.pt/economia/super-bock-group-investe-10-milhoes-no-negocio-das-aguas-em-castelo-de-vide-2
- Forbes Portugal (Super Bock) — https://www.forbespt.com/?p=179397
- Marketeer (águas) — https://marketeer.sapo.pt/aguas-em-movimento
- Diretiva 2009/54/CE — https://eur-lex.europa.eu/eli/dir/2009/54/oj
- Síntese EUR-Lex da Diretiva 2009/54/CE — https://eur-lex.europa.eu/EN/legal-content/summary/eu-standards-for-natural-mineral-waters.html
- Diretiva (UE) 2019/904 — https://eur-lex.europa.eu/eli/dir/2019/904/oj
- ChemOrbis (PET) — https://www.chemorbis.com/en/free-pet-prices-news
- Packaging Europe (ICIS, rPET) — https://packagingeurope.com/comment/why-are-some-brands-focusing-on-cost-over-circularity/12674.article
- Ambiente Online (SDR) — https://www.ambienteonline.pt/destaques/sistema-de-deposito-e-reembolso-arranca-a-10-de-abril-de-2026
- SDR Portugal — https://sdrportugal.pt/en/
- APED (SDR) — https://aped.pt/novo-sistema-de-deposito-e-reembolso/
- Renascença (ANTRAM, 2021) — https://rr.pt/noticia/pais/2021/10/16/antram-transportadores-rodoviarios-de-mercadorias-estao-no-limite/257171/
- Renascença (ANTRAM, 2026) — https://rr.pt/noticia/pais/2026/05/24/transportadoras-a-beira-do-limite-o-setor-esta-completamente-asfixiado/471894/
- Informador (IVA das águas) — https://informador.pt/legislacao/doutrina-administrativa/processo-n-o-10884-2016/

**Café**
- ICE, Coffee C — https://www.ice.com/products/15/Coffee-C-Futures
- ICE, Robusta — https://www.ice.com/products/37089079/Robusta-Coffee-Futures
- Macrotrends — https://www.macrotrends.net/2535/coffee-prices-historical-chart-data
- Perfect Daily Grind (fev. 2025) — https://perfectdailygrind.com/2025/02/coffee-prices-record-highs-roasters/
- Comunicaffe — https://www.comunicaffe.com/arabica-coffee-futures-reach-new-record-highs-london-closes-slightly-down/
- NST/Reuters — https://www.nst.com.my/amp/business/economy/2025/01/1168725/coffees-record-highs-continue-it-approaches-us4-lb
- Barchart (set. 2024) — https://www.barchart.com/story/news/30029608/is-coffee-percolating-to-a-new-record-high
- Barchart (ago. 2026) — https://www.barchart.com/story/news/4004695/slow-pace-of-brazil-harvest-and-tight-inventories-boost-coffee-prices
- ICO, relatório de mercado de set. 2023 — https://ico.org/documents/cy2022-23/cmr-0923-e.pdf
- ICO, I-CIP mar. 2025 — https://icocoffee.org/documents/prices/I-CIP_March2025.pdf
- ICO, I-CIP out. 2025 — https://icocoffee.org/documents/prices/I-CIP_October2025.pdf
- ESM (máximo de 13 anos) — https://www.esmmagazine.com/index.php/a-brands/world-coffee-prices-hit-13-year-high-268937
- USDA FAS, Brazil Coffee Annual 2026 — https://www.fas.usda.gov/data/gain-report/2026/06/Coffee%20Annual_Brasilia_Brazil_BR2026-0025.pdf
- Yahoo/Barchart (USDA 2026/27) — https://finance.yahoo.com/markets/commodities/articles/coffee-prices-fall-usda-predicts-183327017.html
- Helena Coffee (12/10/2026) — https://www.helenacoffee.vn/coffee-prices-today-october-12-2026/
- Business Recorder (Robusta) — https://www.brecorder.com/news/40440002/robusta-coffee-prices-down-in-vietnam
- BCE, taxa de referência de 26/06/2026 — https://www.ecb.europa.eu/stats/exchange/eurofxref/shared/pdf/2026/06/20260626.pdf
- Pound Sterling Live (séries BCE 2026) — https://www.poundsterlinglive.com/ecb/exchange-rates/eurngn?year=2026
- Informa D&B, café 2024 — https://blog.informadb.pt/2025/05/faturacao-do-setor-do-cafe-aumenta-69-em-2024-e-atinge-os-695-milhoes-de-euros/
- Informa D&B, café 2023 — https://blog.informadb.pt/2024/04/mercado-do-cafe-cresceu-mais-de-8-em-2023-e-vale-660-milhoes-de-euros/
- Jornal de Negócios (Delta 2025) — https://www.jornaldenegocios.pt/empresas/detalhe/faturacao-do-grupo-delta-cafes-sobe-12-em-2025-para-650-milhoes-de-euros
- Forbes Portugal (Delta 2024) — https://www.forbespt.com/?p=158191
- ECO (fábrica Nestlé do Porto) — https://eco.sapo.pt/reportagem/starbucks-ja-bebe-25-do-cafe-produzido-na-fabrica-da-nestle-no-porto/
- Agroportal (Nestlé 2022) — https://www.agroportal.pt/vendas-da-nestle-portugal-aumentaram-83-em-2022/
- FIPA/AICC — https://www.fipa.pt/competitividade/aicc-comemora-dia-internacional-do-cafe
- DECO PROteste (preço do café) — https://www.deco.proteste.pt/familia-consumo/supermercado/noticias/preco-cafe-subiu-64-centimos-desde-inicio-ano
- Idealista (bica) — https://www.idealista.pt/news/node/71417
- Tribunal da Relação de Guimarães (contrato de fornecimento de café) — https://jurisprudencia.pt/acordao/220334/
- ICO/BCA (valor da cadeia) — https://britishcoffeeassociation.org/wp-content/uploads/2021/12/ICO-201903-ED-BCA-sustainability-commiteee-ver3-1.pdf
- ICO, Coffee Development Report 2020 — https://ico.org/documents/cy2020-21/ed-2357e-cdr-2020.pdf

**Procura, distribuição e enquadramento legal**
- TNews (AHRESP, 2024) — https://tnews.pt/ahresp-setor-da-restauracao-revela-se-instavel-em-2024-devido-a-localizacao-dos-negocios/
- AHRESP, economia — https://ahresp.com/economia/
- Barlavento (AHRESP) — https://www.barlavento.pt/restauracao-custos-consumo-restaurantes-fecham-ahresp/
- AHRESP (inflação de 2024) — https://ahresp.com/2025/02/restauracao-e-similares-regista-inflacao-media-de-58-em-2024/
- Postal (turismo 2024) — https://postal.pt/nacional/turismo-internacional-bate-recordes-29-milhoes-de-nao-residentes-visitaram-portugal-em-2024/
- Hostelería de España, Anuário de 2025 — https://otea.es/wp-content/uploads/2025/12/ANUARIO-HOSTELERIA-2025.pdf
- Jornal de Negócios (Jerónimo Martins 2025) — https://www.jornaldenegocios.pt/empresas/comercio/detalhe/vendas-da-jeronimo-martins-cresceram-7-6-para-35-9-mil-milhoes-em-2025
- Distribuição Hoje (Jerónimo Martins, 1.º semestre de 2026) — https://www.distribuicaohoje.com/retalho/jeronimo-martins-lucros/
- Jerónimo Martins, relatório anual de 2025 — https://reports.jeronimomartins.com/annual-report/2025/management-report/environment-in-2025/portugal.html
- Sábado (Makro Portugal) — https://www.sabado.pt/sabermais/makro-portugal
- Restauración News (Makro Espanha) — https://restauracionnews.com/2026/04/makro-resultados-2025/
- Informa D&B/DBK (grossistas para hotelaria) — https://www.informadb.pt/media/jutmyonc/20260223_sumario_dbk_grossista_produtos_alimentares_hotelaria.pdf
- ESM (Metro adquire Aviludo) — https://www.esmmagazine.com/metro/wholesaler-metro-acquires-portugals-aviludo-group-111770
- Informa D&B (pagamentos, jul. 2026) — https://blog.informadb.pt/2026/07/empresas-portuguesas-estao-entre-as-que-mais-se-atrasam-nos-pagamentos-em-todo-o-mundo/
- Jornal Económico (66 mil empresas em risco) — https://jornaleconomico.sapo.pt/noticias/empresas-portuguesas-em-risco-de-atrasos-graves-disparam-para-66-mil-diz-informa-db/
- Diretiva (UE) 2019/633 — https://eur-lex.europa.eu/eli/dir/2019/633/oj
- Comissão Europeia, práticas comerciais desleais — https://agriculture.ec.europa.eu/common-agricultural-policy/agri-food-supply-chain/unfair-trading-practices_en
- DL 76/2021 (PGDL) — https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?artigo_id=3459A0008&nid=3459&tabela=leis&pagina=1&ficha=1
- ASAE, FAQ sobre prazos de pagamento — https://www.asae.gov.pt/perguntas-frequentes1/area-alimentar/prazos-de-pagamento-obrigatorios-para-produtos-alimentares-faqs.aspx
- ECO (entrada em vigor a 01/11/2021) — https://eco.sapo.pt/2021/11/01/novas-regras-para-travar-praticas-comerciais-desleais-entram-hoje-em-vigor/
- Diretiva 2011/7/UE — https://eur-lex.europa.eu/eli/dir/2011/7/oj
- Parlamento Europeu, legislative train (atrasos de pagamento) — https://www.europarl.europa.eu/legislative-train/theme-a-europe-fit-for-the-digital-age/file-late-payments-directive-revision
- LatePayClaim (estado da proposta) — https://latepayclaim.com/blog/eu-late-payment-regulation-2026
