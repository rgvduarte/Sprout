import type { WorldId } from './types';

/* =====================================================================
   Cadeia de valor: um só sítio para os números que várias páginas mostram
   (Apresentação, Mercados, Jornada do lote, Academia, Simulador).

   Fonte única: business plan, cenário Recomendado
   (docs/business-plan/modelo/pressupostos.json e resultados.json,
   folha de unit economics, piloto de 2027). Factos verificados:
   docs/research/00-base-factual.md §1.2–1.4 e §2.

   Azeite. O lagar vende a granel ao índice de origem (≈ 3,50 €/kg em
   out. 2026). A Sprout compra-lhe azeite de origem identificada com um
   prémio, manda-o embalar num co-packer (o IBC é só a unidade de
   armazenagem) e vende-o embalado por dois canais:
   - HoReCa e lojas gourmet, 10 % abaixo de uma referência HoReCa embalada
     documentada (6,00 €/kg sem IVA no Recomendado, a validar no piloto);
   - distribuidores e exportadores, ao preço de saída do embalador
     (4,35 €/kg) mais um prémio de origem verificada, sem desconto.
   O bloco entre o granel e o preço embalado NÃO é a margem do embalador:
   paga embalamento, logística e as margens de todos os intermediários.

   Água. Modelo de agente (cesto): o engarrafador fatura e entrega, o
   comprador paga-lhe, a Sprout recebe uma comissão. Sem stock, sem fundos
   de terceiros, sem lotes para financiar.
   ===================================================================== */

/** Preço que o produtor (ou o fornecedor) recebe hoje na cadeia habitual, por kg ou L. */
export const PRODUCER_PRICE_TODAY: Record<WorldId, number> = { azeite: 3.5, agua: 0.24, cafe: 7.0 };

/** O que PRODUCER_PRICE_TODAY mede, por mundo. */
export const PRODUCER_PRICE_LABEL: Record<WorldId, string> = {
  azeite: 'Índice de origem a granel: o que o lagar recebe ao vender a granel',
  agua: 'Preço ex-fábrica médio do engarrafador',
  cafe: 'Verde em EUR ao importador UE (operador EUDR)',
};

/** Nome e conteúdo do diferencial produtor → comprador, por mundo. */
export const CHAIN_DIFFERENTIAL: Record<WorldId, { label: string; short: string; contains: string }> = {
  azeite: { label: 'Diferencial granel → embalado', short: 'Diferencial', contains: 'embalamento, logística e margens de intermediação' },
  agua: { label: 'Diferencial ex-fábrica → comprador', short: 'Diferencial', contains: 'transporte, armazém e margem do grossista' },
  cafe: { label: 'Diferencial importador → torrefação', short: 'Diferencial', contains: 'logística, crédito e margem de quem vende o verde à torrefação' },
};

/**
 * Valores verificados da cadeia do azeite virgem extra, €/kg.
 * Fonte: Observatorio de la Cadena Alimentaria (Ministerio de Agricultura, Espanha),
 * estudos da cadeia de valor do AOVE, campanhas 2018/19 a 2020/21.
 */
export const OLIVE_CHAIN_FACTS = {
  /** custo de embalamento */
  packingCost: [0.47, 0.51] as [number, number],
  /** margem líquida do embalador */
  packagerNetMargin: [0.19, 0.5] as [number, number],
  /** a mesma margem em fração do preço de venda ao público sem IVA */
  packagerNetMarginOfRetail: [0.049, 0.141] as [number, number],
  sourceShort: 'Observatório da cadeia alimentar de Espanha, campanhas 2018/19 a 2020/21',
};

/**
 * Unit economics do azeite no piloto de 2027, cenário Recomendado, €/kg
 * (resultados.json → unit_economics.piloto_2027_eur_kg e horeca_gourmet_20t / distribuidores_exportacao_30t).
 * Custos por canal, já com o embalamento no co-packer. Margem antes do seguro de crédito.
 */
export const OLIVE_MODEL = {
  indexToday: 3.5,
  horeca: {
    label: 'HoReCa e lojas gourmet',
    producerPremium: 0.15,
    refPrice: 6.0,
    discountPct: 0.1,
    originPremium: 0,
    packing: 0.55,
    /** linhas de custo (sem a aquisição), €/kg */
    costs: [
      { id: 'embalamento', label: 'Embalamento no co-packer (5 L e vidro)', value: 0.55 },
      { id: 'logistica', label: 'Logística e entrega fracionada', value: 0.3 },
      { id: '3pl', label: 'Armazém logístico e picking (3PL)', value: 0.06 },
      { id: 'custodia', label: 'Custódia e inspeção (collateral manager)', value: 0.1 },
      { id: 'armazenagem', label: 'Armazenagem em IBC (≈ 6 meses)', value: 0.024 },
      { id: 'analises', label: 'Análises e painel de prova', value: 0.03 },
      { id: 'seguro', label: 'Seguro do stock', value: 0.0036 },
      { id: 'perdas', label: 'Perdas físicas (0,5 % do valor)', value: 0.01825 },
      { id: 'desclassificacao', label: 'Provisão para desclassificação', value: 0.018 },
      { id: 'credito', label: 'Provisão de crédito (0,6 % das vendas)', value: 0.0324 },
      { id: 'pagamentos', label: 'Pagamentos bancários', value: 0.01 },
    ],
    buyerPrice: 5.4,
    fundingPrice: 4.80,
    margin: 0.6,
    lotTonnes: 20,
  },
  distribuicao: {
    label: 'Distribuidores e exportadores',
    producerPremium: 0.1,
    refPrice: 4.35,
    discountPct: 0,
    originPremium: 0.1,
    packing: 0.45,
    costs: [
      { id: 'embalamento', label: 'Embalamento no lagar (paletes de 5 L)', value: 0.45 },
      { id: 'logistica', label: 'Logística até ao distribuidor', value: 0.1 },
      { id: 'custodia', label: 'Custódia e inspeção (collateral manager)', value: 0.04 },
      { id: 'armazenagem', label: 'Armazenagem (≈ 1 mês)', value: 0.004 },
      { id: 'analises', label: 'Análises e painel de prova', value: 0.02 },
      { id: 'seguro', label: 'Seguro do stock', value: 0.0006 },
      { id: 'perdas', label: 'Perdas físicas (0,5 % do valor)', value: 0.018 },
      { id: 'desclassificacao', label: 'Provisão para desclassificação', value: 0.003 },
      { id: 'credito', label: 'Provisão de crédito (0,3 % das vendas)', value: 0.01335 },
      { id: 'pagamentos', label: 'Pagamentos bancários', value: 0.005 },
    ],
    buyerPrice: 4.45,
    fundingPrice: 4.25,
    margin: 0.2,
    lotTonnes: 30,
  },
  source: 'Business plan, cenário Recomendado: unit economics do piloto de 2027 (HoReCa 20 t, distribuidores 30 t)',
};

/** Água em modelo de agente: o engarrafador vende, a Sprout recebe comissão. Business plan, cenário Recomendado. */
export const WATER_AGENT = {
  /** referência B2B (HoReCa e distribuição), €/L sem IVA nem SDR — hipótese não verificada */
  refB2B: 0.4,
  /** preço ex-fábrica médio, €/L */
  exFactory: 0.24,
  /** desconto ao comprador do cesto */
  discount: 0.1,
  /** comissão da Sprout sobre o valor de venda */
  commissionPct: 0.02,
  note: 'O engarrafador fatura e entrega ao comprador, e o comprador paga-lhe a ele. A Sprout fatura uma comissão de 2 % ao engarrafador: sem stock, sem depósitos SDR e sem dinheiro de cofinanciadores.',
};

/** Tese original dos fundadores (documento de 13/10/2026). Está por validar no piloto. */
export const FOUNDERS_THESIS = {
  packagerMarginCaptured: [0.8, 0.9] as [number, number],
  buyerDiscount: [0.1, 0.15] as [number, number],
  status: 'tese original dos fundadores, por validar no piloto',
};
