import { num, PALETE, pct, SACA_KG, tidyDeep, tidyText } from '../lib/format';
import { MARKET_TODAY, marketAt, OLIVE_REFERENCES } from './market';
import type {
  CostLine,
  HedgeCoverage,
  JourneyStage,
  Lot,
  LotEconomics,
  Milestone,
  QualityAnalysis,
  RiskFactor,
  WorldId,
} from './types';
import { JOURNEY_STAGES } from './types';
import { OLIVE_MODEL, WATER_AGENT } from './valueChain';

/* =====================================================================
   Lotes de demonstração (fictícios). Os números do azeite saem do
   business plan, cenário Recomendado, unit economics do piloto de 2027
   (valueChain.ts → OLIVE_MODEL): compra ao lagar ao índice de origem com
   prémio, embalamento num co-packer, venda por canal. Cada lote tem um
   canal: HoReCa e lojas gourmet (10 % abaixo de uma referência embalada
   documentada) ou distribuidores e exportadores (preço de saída do
   embalador + prémio de origem, sem desconto, com venda contratada).
   A água é cesto em modelo de agente: comissão, sem financiamento.
   Os lotes das campanhas 2024/25 e 2025/26 são histórico ilustrativo:
   o piloto só começa em fevereiro de 2027.
   ===================================================================== */

const round = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;
const r2 = (x: number) => round(x, 2);
const roundTo = (x: number, step: number) => Math.round(x / step) * step;
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

/* ------------------------------------------------------- partilha e reserva (uma só regra) */

/** Partilha da margem bruta de um lote: cofinanciadores, operação da Sprout e reserva comum de primeira perda. */
export const INVESTOR_SHARE = 0.5;
export const SPROUT_SHARE = 0.2;
export const RESERVE_SHARE = 0.3;
/** Teto da reserva: fração do capital financiado em curso. */
export const RESERVE_CAP = 0.05;
export const SETTLEMENT_MONTHS = 18;
export const EXTENSION_MONTHS = 6;
/** Queda do índice de origem face à abertura do lote que permite propor extensão ou refunding. */
export const PRICE_TRIGGER = 0.15;

/**
 * Regra única da reserva de primeira perda (business plan, pressupostos.json →
 * financiamento.reserva_primeira_perda: 30 % da margem de cada lote, até 5 % do saldo vivo).
 */
export const RESERVE_RULE = {
  shareOfMargin: RESERVE_SHARE,
  capOfOutstanding: RESERVE_CAP,
  text: 'A reserva de primeira perda é comum a todos os lotes: recebe 30 % da margem de cada lote quando o lote liquida, até 5 % do capital financiado em curso, e absorve perdas antes dos cofinanciadores enquanto tiver saldo. Pode esgotar-se.',
  short: '30 % da margem de cada lote, até 5 % do capital em curso',
};

/** Glossário dos preços: os mesmos termos em todas as páginas. */
export const PRICE_TERMS = tidyDeep([
  { termo: 'Índice de origem', definicao: 'Preço do azeite virgem extra a granel na origem: média de 2 semanas SIMA Alentejo e Poolred. É a base do preço pago ao lagar e o que move os gatilhos de cobertura, extensão e refunding.' },
  { termo: 'Referência do canal', definicao: 'Preço do produto embalado no canal de venda: a referência HoReCa embalada (6,00 €/kg, a validar no piloto) ou o preço de saída do embalador para distribuidores (4,35 €/kg).' },
  { termo: 'Preço financiado', definicao: 'O que os cofinanciadores pagam por kg: aquisição ao lagar mais todos os custos até à venda, incluindo o embalamento no co-packer.' },
  { termo: 'Preço ao comprador', definicao: 'O que o comprador paga: na HoReCa, 10 % abaixo da referência; nos distribuidores, o preço de saída do embalador mais o prémio de origem.' },
]);

/* ------------------------------------------------------- economia por canal */

type OliveChannel = 'horeca' | 'distribuicao';

const lines = (xs: { id: string; label: string; value: number }[]): CostLine[] => xs.map((c) => ({ ...c, value: round(c.value, 4) }));

function range(margin: number, funding: number): [number, number] {
  if (funding <= 0) return [0, 0];
  const mid = (Math.max(0, margin) * INVESTOR_SHARE) / funding;
  // meio ponto percentual mais próximo, com os empates para baixo (nunca arredonda a favor)
  const high = Math.round(mid * 200 - 1e-9) / 200;
  return [round(Math.max(0, high - 0.02), 3), round(high, 3)];
}

/**
 * Economia de um lote de azeite. O índice de origem na abertura move o preço de compra e,
 * por passagem integral, a referência embalada do canal; os custos são os do piloto de 2027.
 */
function oliveEconomics(o: { channel: OliveChannel; index: number; coverage: number; expectedMonths: number; pilot?: boolean }): LotEconomics {
  const m = OLIVE_MODEL[o.channel];
  const delta = o.index - OLIVE_MODEL.indexToday;
  const refPrice = r2(m.refPrice + delta);
  const acquisitionPrice = r2(o.index + m.producerPremium);
  const buyerPrice = r2(refPrice * (1 - m.discountPct) + m.originPremium);
  const costLines = lines(
    m.costs.map((c) =>
      c.id === 'perdas' ? { ...c, value: 0.005 * acquisitionPrice } : c.id === 'credito' ? { ...c, value: (o.channel === 'horeca' ? 0.006 : 0.003) * buyerPrice } : c,
    ),
  );
  const costsPerUnit = r2(sum(costLines.map((c) => c.value)));
  const fundingPrice = r2(acquisitionPrice + costsPerUnit);
  const grossMargin = r2(buyerPrice - fundingPrice);
  const open = 1 - o.coverage;
  const d = m.discountPct;
  const beDelta = (fundingPrice - m.originPremium) / (1 - d) - refPrice;
  const beLotDelta = open > 0 ? -grossMargin / ((1 - d) * open) : -o.index;
  const priceBasis =
    o.channel === 'horeca'
      ? `10 % abaixo da referência HoReCa embalada (${num(refPrice, 2)} €/kg${o.pilot ? ', a validar no piloto' : ' na abertura'})`
      : `preço de saída do embalador (${num(refPrice, 2)} €/kg) mais prémio de origem de ${num(m.originPremium, 2)} €/kg, sem desconto`;
  return {
    model: 'principal',
    channel: o.channel,
    channelLabel: m.label,
    refPrice,
    refLabel: o.channel === 'horeca' ? OLIVE_REFERENCES.horeca.label : OLIVE_REFERENCES.packerExit.label,
    refNote:
      o.channel === 'horeca'
        ? o.pilot
          ? 'AOVE de origem identificada, 5 L, sem IVA. Valor do business plan (cenário Recomendado) por verificar: o piloto só o aceita com ≥ 20 cotações e mediana ≥ 6,00 €/kg.'
          : `Referência derivada do índice de origem na abertura (índice + 2,50 €/kg). Histórico ilustrativo.`
        : 'Granel + embalamento (0,47–0,51 €/kg) + margem líquida do embalador (0,19–0,50 €/kg): 4,16–4,51 €/kg com o granel a 3,50.',
    discountPct: d,
    originPremium: m.originPremium,
    buyerPrice,
    priceBasis: tidyText(priceBasis),
    indexAtOpen: o.index,
    producerPremium: m.producerPremium,
    acquisitionPrice,
    packingCost: m.packing,
    costsPerUnit,
    costLines,
    fundingPrice,
    grossMargin,
    investorShare: INVESTOR_SHARE,
    reserveShare: RESERVE_SHARE,
    breakEvenIndex: r2(o.index + beDelta),
    breakEvenIndexLot: r2(Math.max(0, o.index + beLotDelta)),
    expectedMonths: o.expectedMonths,
    expectedRange: range(grossMargin, fundingPrice),
  };
}

/** Água em modelo de agente: o engarrafador vende e recebe; a Sprout recebe comissão. Nada a financiar. */
function waterAgentEconomics(): LotEconomics {
  const refPrice = WATER_AGENT.refB2B;
  const buyerPrice = round(refPrice * (1 - WATER_AGENT.discount), 3);
  return {
    model: 'agente',
    channel: 'cesto',
    channelLabel: 'Cesto HoReCa · agente',
    refPrice,
    refLabel: 'Referência B2B da água 1,5 L',
    refNote: 'Hipótese do modelo (0,40 €/L sem IVA nem depósito SDR), não verificada: o preço HoReCa por litro ainda não tem fonte.',
    discountPct: WATER_AGENT.discount,
    originPremium: 0,
    buyerPrice,
    priceBasis: tidyText(`10 % abaixo da referência B2B (${num(refPrice, 2)} €/L): o engarrafador fatura e entrega, e a Sprout recebe ${pct(WATER_AGENT.commissionPct, 0)} de comissão`),
    indexAtOpen: refPrice,
    producerPremium: 0,
    acquisitionPrice: 0,
    packingCost: 0,
    costsPerUnit: 0,
    costLines: [],
    fundingPrice: 0,
    grossMargin: round(buyerPrice * WATER_AGENT.commissionPct, 4),
    commissionPct: WATER_AGENT.commissionPct,
    investorShare: 0,
    reserveShare: 0,
    breakEvenIndex: 0,
    breakEvenIndexLot: 0,
    expectedMonths: 0,
    expectedRange: [0, 0],
  };
}

/** Café verde (Fase 2): compra em EUR, a preço fixo, a um importador UE; venda a microtorrefações, sem desconto. */
function coffeeEconomics(o: { acq: number; ref: number; index: number; coverage: number; expectedMonths: number }): LotEconomics {
  const buyerPrice = o.ref;
  const costLines = lines([
    { id: 'logistica', label: 'Logística do armazém do importador à torrefação', value: 0.15 },
    { id: 'pagamentos', label: 'Operação e pagamentos', value: 0.03 },
    { id: 'credito', label: 'Provisão de crédito (0,6 % das vendas)', value: 0.006 * buyerPrice },
    { id: 'cambio', label: 'Cobertura cambial EUR/USD (0,3 % das compras)', value: 0.003 * o.acq },
  ]);
  const costsPerUnit = r2(sum(costLines.map((c) => c.value)));
  const fundingPrice = r2(o.acq + costsPerUnit);
  const grossMargin = r2(buyerPrice - fundingPrice);
  const open = 1 - o.coverage;
  const beRatio = fundingPrice / o.ref;
  const beLotRatio = open > 0 ? 1 - grossMargin / (open * o.ref) : 0;
  return {
    model: 'principal',
    channel: 'torrefacao',
    channelLabel: 'Microtorrefações',
    refPrice: o.ref,
    refLabel: 'Preço do verde a microtorrefações',
    refNote: 'Verde de especialidade entregue em Portugal. Hipótese do business plan (7,85 €/kg no lote-tipo), por verificar com torrefações.',
    discountPct: 0,
    originPremium: 0,
    buyerPrice,
    priceBasis: tidyText(`preço de venda a microtorrefações (${num(o.ref, 2)} €/kg), sem desconto`),
    indexAtOpen: o.index,
    producerPremium: 0,
    acquisitionPrice: o.acq,
    packingCost: 0,
    costsPerUnit,
    costLines,
    fundingPrice,
    grossMargin,
    investorShare: INVESTOR_SHARE,
    reserveShare: RESERVE_SHARE,
    breakEvenIndex: r2(o.index * beRatio),
    breakEvenIndexLot: r2(o.index * Math.max(0, beLotRatio)),
    expectedMonths: o.expectedMonths,
    expectedRange: range(grossMargin, fundingPrice),
  };
}

/* ------------------------------------------------------- jornada */

const STAGE_NOTES: Record<WorldId, Record<JourneyStage, string>> = {
  azeite: {
    colhido: 'Azeitona colhida e moída no lagar no próprio dia.',
    analisado: 'Análise físico-química e painel de prova publicados.',
    'em-deposito': 'Azeite selado em IBC com o número do lote. O IBC é só a unidade de armazenagem.',
    'em-venda': 'Embalado por tranches no co-packer e vendido pelo canal do lote.',
    expedido: 'Últimas paletes de garrafões entregues aos compradores.',
    liquidado: 'Compradores pagaram; liquidação feita aos cofinanciadores.',
  },
  agua: {
    colhido: 'Lote de engarrafamento fechado na linha.',
    analisado: 'Análise microbiológica e físico-química de conformidade publicada.',
    'em-deposito': 'Paletes no armazém do engarrafador, identificadas com o número do lote.',
    'em-venda': 'Paletes no cesto dos clientes HoReCa: o engarrafador fatura e entrega.',
    expedido: 'Últimas paletes entregues pelo engarrafador.',
    liquidado: 'Compradores pagaram ao engarrafador; comissão da Sprout faturada.',
  },
  cafe: {
    colhido: 'Cereja colhida e processada na origem.',
    analisado: 'Classificação física e prova SCA publicadas.',
    'em-deposito': 'Sacas de 60 kg no armazém do importador, na UE, já desalfandegadas.',
    'em-venda': 'Café verde oferecido a microtorrefações.',
    expedido: 'Últimas sacas entregues às torrefações.',
    liquidado: 'Torrefações pagaram; liquidação feita aos cofinanciadores.',
  },
};

function milestones(world: WorldId, done: Partial<Record<JourneyStage, string>>, planned: Partial<Record<JourneyStage, string>> = {}, notes: Partial<Record<JourneyStage, string>> = {}): Milestone[] {
  return JOURNEY_STAGES.map((stage) => ({
    stage,
    date: done[stage],
    planned: planned[stage],
    done: Boolean(done[stage]),
    note: notes[stage] ?? STAGE_NOTES[world][stage],
  }));
}

/* ------------------------------------------------------- riscos */

const eurKg = (v: number) => `${num(v, 2)} €/kg`;

function oliveRisks(e: LotEconomics, coverage: number): RiskFactor[] {
  const horeca = e.channel === 'horeca';
  const open = 1 - coverage;
  const beDrop = e.breakEvenIndex / e.indexAtOpen - 1;
  const beLotDrop = e.breakEvenIndexLot / e.indexAtOpen - 1;
  return tidyDeep([
    {
      id: 'preco',
      title: 'Queda do índice de origem',
      body:
        `O índice de origem do azeite caiu mais de 60 % desde o máximo de janeiro de 2024 (≈ 9 €/kg) e em 2025–26 andou entre ≈ 3,5 e 4,6 €/kg. Este lote abriu com o índice a ${eurKg(e.indexAtOpen)} e um preço financiado de ${eurKg(e.fundingPrice)}. ` +
        (open > 0
          ? `Os ${pct(open, 0)} sem venda a prazo vendem abaixo do preço financiado se o índice descer abaixo de ≈ ${eurKg(e.breakEvenIndex)} (${pct(beDrop, 0)}); ` +
            (coverage > 0 ? `com a venda a prazo, o lote inteiro só entra em perda abaixo de ≈ ${eurKg(e.breakEvenIndexLot)} (${pct(beLotDrop, 0)}), antes de custos extra.` : 'sem venda a prazo, é o lote inteiro.')
          : 'Todo o volume está vendido a prazo: o risco passa a ser o do comprador cumprir.'),
      severity: horeca ? 'alta' : 'media',
      mitigation: horeca
        ? 'Venda a prazo de parte do volume, gatilho que a aumenta se o índice cair, reserva comum de primeira perda e extensão até 6 meses.'
        : 'Venda contratada (offtake) de pelo menos 85 % do volume antes da compra ao lagar; o resto fica dentro do limite de stock em aberto da política de risco.',
    },
    {
      id: 'qualidade',
      title: 'Desclassificação do azeite',
      body: 'Um virgem extra pode descer a virgem se a acidez, os peróxidos ou o painel de prova mudarem durante a armazenagem. Um azeite virgem vende-se 15–25 % abaixo.',
      severity: 'media',
      mitigation: 'Análise à entrada e a cada 4 meses, armazenagem sob azoto a 15–18 °C e sem luz, e embalamento por tranches para não guardar garrafões meses a fio.',
    },
    {
      id: 'prazo',
      title: 'Atraso nas vendas',
      body: horeca
        ? 'A HoReCa compra em encomendas pequenas e recorrentes. Se os clientes forem menos do que o previsto, o stock demora mais a escoar e a armazenagem come margem.'
        : 'Se o comprador atrasar as entregas do contrato, o lote demora mais a escoar. A extensão tem custos que reduzem o resultado.',
      severity: 'media',
      mitigation: horeca ? 'Lista de clientes pré-qualificados, embalamento por tranches e extensão condicionada.' : 'Calendário de entregas no contrato e penalização por atraso.',
    },
    {
      id: 'contraparte',
      title: 'Incumprimento do comprador',
      body: horeca
        ? 'Um restaurante ou uma loja pode pagar tarde ou não pagar. O lote só liquida quando o dinheiro entra na conta segregada.'
        : 'Um distribuidor pode cancelar entregas do contrato, pagar tarde ou não pagar. O lote só liquida quando o dinheiro entra na conta segregada.',
      severity: 'media',
      mitigation: `Seguro de crédito com limite por comprador, provisão de ${horeca ? '0,6' : '0,3'} % das vendas no preço financiado e pagamento antes da expedição para quem não tem histórico.`,
    },
    {
      id: 'custodia',
      title: 'Perda física em custódia',
      body: 'Derrame, contaminação ou incêndio no lagar, no co-packer ou no armazém logístico afetam a mercadoria que garante o lote.',
      severity: 'baixa',
      mitigation: 'Seguro de mercadoria, IBC selados com o número do lote, custódia por um collateral manager independente e inventário mensal com fotografia.',
    },
    {
      id: 'liquidez',
      title: 'Capital imobilizado, sem mercado secundário',
      body: `Não há forma de vender a posição antes da liquidação. A liquidação esperada é ao fim de ≈ ${e.expectedMonths} meses, mas o capital pode ficar comprometido até 18 meses, ou 24 com extensão.`,
      severity: 'alta',
      mitigation: 'Comprometer apenas capital de que não precisa nesse prazo. O Simulador de campanha mostra cenários de perda.',
    },
  ]);
}

function waterRisks(): RiskFactor[] {
  return tidyDeep([
    {
      id: 'modelo',
      title: 'Sem financiamento: a Sprout é agente',
      body: 'A Sprout não compra estas paletes. O engarrafador vende, fatura e recebe; a Sprout recebe 2 % de comissão. Não há capital de cofinanciadores neste lote.',
      severity: 'baixa',
      mitigation: 'Contrato de agência com o engarrafador e faturação direta ao comprador.',
    },
    {
      id: 'prazo',
      title: 'Procura sazonal',
      body: 'A água vende-se sobretudo entre maio e setembro. Um verão fraco ou chuvoso atrasa o escoamento das paletes e a comissão.',
      severity: 'media',
      mitigation: 'A água entra no cesto de clientes HoReCa que já compram azeite, com entregas mensais.',
    },
    {
      id: 'margem',
      title: 'Margem fina e depósito SDR',
      body: 'Como principal, a Sprout teria de adiantar 0,10 € de depósito SDR por garrafa e pagar o transporte, numa margem de poucos cêntimos por litro. É por isso que a água entra como agente.',
      severity: 'media',
      mitigation: 'Modelo de agente: o depósito e o transporte ficam com o engarrafador.',
    },
    {
      id: 'conservacao',
      title: 'Conservação das garrafas',
      body: 'Garrafas de PET expostas ao sol ou ao calor perdem valor comercial e podem ser recusadas pelo comprador.',
      severity: 'baixa',
      mitigation: 'Armazém coberto, rotação por data de engarrafamento e inventário mensal no engarrafador.',
    },
    {
      id: 'contraparte',
      title: 'Incumprimento do comprador',
      body: 'O risco de crédito é do engarrafador, que fatura. A comissão da Sprout só se recebe quando o comprador paga.',
      severity: 'baixa',
      mitigation: 'Limites por comprador e débito direto SEPA nas encomendas recorrentes.',
    },
  ]);
}

function coffeeRisks(): RiskFactor[] {
  return tidyDeep([
    {
      id: 'preco',
      title: 'Volatilidade do preço do arábica',
      body: 'O contrato ICE KC passou de cerca de 4,41 USD/lb em fevereiro de 2025 para 2,85 USD/lb em outubro de 2026. Movimentos de 20 % num trimestre são comuns. Comprar em EUR a um importador fixa o preço de compra, não o de venda.',
      severity: 'alta',
      mitigation: 'Compra a preço fixo em EUR e venda contratada a torrefações de parte do volume. Futuros KC só acima de 50–100 t por ano.',
    },
    {
      id: 'eudr',
      title: 'Regulamento da desflorestação (EUDR)',
      body: 'Desde 30/12/2026 (grandes e médias empresas) e 30/06/2027 (micro e pequenas), o café só entra na UE com prova de que não vem de terra desflorestada.',
      severity: 'media',
      mitigation: 'Compra a um importador UE que é o operador EUDR e entrega a declaração de diligência de cada lote.',
    },
    {
      id: 'qualidade',
      title: 'Humidade e defeitos',
      body: 'Grão acima de 12,5 % de humidade ganha fungos (norma ICO: 8–12,5 %); defeitos de categoria 1 tiram o lote da especialidade.',
      severity: 'media',
      mitigation: 'Classificação na origem e à chegada ao armazém do importador, com tolerâncias no contrato.',
    },
    {
      id: 'logistica',
      title: 'Atraso no embarque',
      body: 'Congestionamento portuário ou falta de contentores atrasam a chegada à UE e a venda.',
      severity: 'media',
      mitigation: 'A Sprout só compra o café já desalfandegado no armazém do importador.',
    },
    {
      id: 'contraparte',
      title: 'Cumprimento do fornecedor',
      body: 'Numa safra fraca a origem pode entregar menos do que o contratado e o importador pode não ter o lote.',
      severity: 'media',
      mitigation: 'Pagamento contra entrega no armazém, nunca adiantado.',
    },
    {
      id: 'liquidez',
      title: 'Capital imobilizado, sem mercado secundário',
      body: 'Não há forma de vender a posição antes da liquidação.',
      severity: 'alta',
      mitigation: 'Comprometer apenas capital de que não precisa nesse prazo.',
    },
  ]);
}

/* ------------------------------------------------------- extensão */

function extension(world: WorldId, indexAtOpen: number): Lot['extension'] {
  if (world === 'agua') {
    return {
      maxMonths: 0,
      conditions: ['Não se aplica: a água entra como cesto, sem financiamento nem janela de liquidação.'],
      decision: 'Sem extensão: a Sprout não tem stock nem capital de cofinanciadores na água.',
    };
  }
  const floor = r2(indexAtOpen * (1 - PRICE_TRIGGER));
  const name = world === 'azeite' ? 'O índice de origem' : 'A referência do café verde';
  return {
    maxMonths: EXTENSION_MONTHS,
    conditions: tidyDeep([
      `${name} está 15 % ou mais abaixo do da abertura do lote (de ${eurKg(indexAtOpen)} para ${eurKg(floor)} ou menos) no mês 18, ou`,
      'mais de 30 % do stock continua por vender no mês 18.',
    ]),
    decision: 'A extensão é proposta pela Tesouraria, justificada por escrito e comunicada aos cofinanciadores 30 dias antes do fim da janela. Só há uma extensão por lote.',
  };
}

/* ------------------------------------------------------- análises */

function oliveAnalysis(o: {
  id: string; date: string; acidez: number; peroxidos: number; k232: number; k268: number; deltaK: number; md: number; mf: number; atributos: string[]; note?: string;
}): QualityAnalysis {
  const ve = o.acidez <= 0.8 && o.peroxidos <= 20 && o.k232 <= 2.5 && o.k268 <= 0.22 && o.deltaK <= 0.01 && o.md === 0 && o.mf > 0;
  return {
    id: o.id,
    lab: 'Olea Analítica · laboratório acreditado ISO/IEC 17025',
    date: o.date,
    reportId: `OA-${o.id.toUpperCase()}`,
    category: ve ? 'Azeite virgem extra' : 'Azeite virgem',
    reference: 'Reg. Delegado (UE) 2022/2104, anexo I',
    params: [
      { id: 'acidez', label: 'Acidez (ácido oleico)', value: o.acidez, unit: '%', comparator: '≤', limit: 0.8, limitLabel: '≤ 0,80', pass: o.acidez <= 0.8 },
      { id: 'peroxidos', label: 'Índice de peróxidos', value: o.peroxidos, unit: 'meq O₂/kg', comparator: '≤', limit: 20, limitLabel: '≤ 20', pass: o.peroxidos <= 20 },
      { id: 'k232', label: 'K232', value: o.k232, unit: '', comparator: '≤', limit: 2.5, limitLabel: '≤ 2,50', pass: o.k232 <= 2.5 },
      { id: 'k268', label: 'K268', value: o.k268, unit: '', comparator: '≤', limit: 0.22, limitLabel: '≤ 0,22', pass: o.k268 <= 0.22 },
      { id: 'deltaK', label: 'ΔK', value: o.deltaK, unit: '', comparator: '≤', limit: 0.01, limitLabel: '≤ 0,01', pass: o.deltaK <= 0.01 },
      { id: 'md', label: 'Mediana do defeito', value: o.md, unit: '', comparator: '=', limit: 0, limitLabel: '= 0', pass: o.md === 0 },
      { id: 'mf', label: 'Mediana do frutado', value: o.mf, unit: '', comparator: '>', limit: 0, limitLabel: '> 0', pass: o.mf > 0 },
    ],
    panel: { medianaFrutado: o.mf, medianaDefeito: o.md, atributos: o.atributos },
    note: o.note,
  };
}

function waterAnalysis(o: { id: string; date: string; residuo: number; ph: number; nitratos: number; note?: string }): QualityAnalysis {
  return {
    id: o.id,
    lab: 'Hidrolab Centro · laboratório acreditado ISO/IEC 17025',
    date: o.date,
    reportId: `HL-${o.id.toUpperCase()}`,
    category: 'Conforme',
    reference: 'Decreto-Lei 156/98 e Diretiva 2009/54/CE',
    params: [
      { id: 'residuo', label: 'Resíduo seco a 180 °C', value: o.residuo, unit: 'mg/L', comparator: '≤', limit: 50, limitLabel: '≤ 50 (muito pouco mineralizada)', pass: o.residuo <= 50 },
      { id: 'ph', label: 'pH', value: o.ph, unit: '', comparator: '≥', limit: 4.5, limitLabel: 'declarado no rótulo', pass: true },
      { id: 'nitratos', label: 'Nitratos', value: o.nitratos, unit: 'mg/L', comparator: '≤', limit: 50, limitLabel: '≤ 50', pass: o.nitratos <= 50 },
      { id: 'ecoli', label: 'E. coli', value: 0, unit: 'ufc/250 mL', comparator: '=', limit: 0, limitLabel: '0 / 250 mL', pass: true },
      { id: 'enterococos', label: 'Enterococos', value: 0, unit: 'ufc/250 mL', comparator: '=', limit: 0, limitLabel: '0 / 250 mL', pass: true },
      { id: 'pseudomonas', label: 'Pseudomonas aeruginosa', value: 0, unit: 'ufc/250 mL', comparator: '=', limit: 0, limitLabel: '0 / 250 mL', pass: true },
    ],
    note: o.note,
  };
}

function coffeeAnalysis(o: { id: string; date: string; humidade: number; cat1: number; total: number; sca: number; peneira: string; note?: string }): QualityAnalysis {
  return {
    id: o.id,
    lab: 'Classificador Q-Grader independente',
    date: o.date,
    reportId: `QG-${o.id.toUpperCase()}`,
    category: o.sca >= 80 && o.cat1 === 0 && o.total <= 5 ? 'Especialidade (amostra pré-safra)' : 'Comercial',
    reference: 'Protocolo SCA de classificação de café verde (amostra de 350 g)',
    params: [
      { id: 'humidade', label: 'Humidade do grão', value: o.humidade, unit: '%', comparator: '≤', limit: 12.5, limitLabel: '8–12,5', pass: o.humidade <= 12.5 && o.humidade >= 8 },
      { id: 'cat1', label: 'Defeitos de categoria 1', value: o.cat1, unit: '', comparator: '=', limit: 0, limitLabel: '= 0', pass: o.cat1 === 0 },
      { id: 'total', label: 'Defeitos completos (total)', value: o.total, unit: '', comparator: '≤', limit: 5, limitLabel: '≤ 5', pass: o.total <= 5 },
      { id: 'sca', label: 'Pontuação SCA', value: o.sca, unit: 'pts', comparator: '≥', limit: 80, limitLabel: '≥ 80', pass: o.sca >= 80 },
    ],
    note: `Peneira ${o.peneira}. ${o.note ?? ''}`.trim(),
  };
}

/* ------------------------------------------------------- coberturas */

/** Venda a prazo com preço fixado (HoReCa: grossista e lojas gourmet). */
const forward = (coverage: number, counterparty: string, trigger: string, note: string, executed?: HedgeCoverage['executed']): HedgeCoverage => ({
  instrument: 'forward',
  label: 'Venda a prazo com preço fixado',
  coverage,
  costPct: 0,
  counterparty,
  trigger,
  note: tidyText(note),
  executed,
});

/** Venda contratada antes da compra ao lagar (distribuidores e exportadores): back-to-back. */
const offtake = (coverage: number, counterparty: string, priceKg: number, note?: string, executed?: HedgeCoverage['executed']): HedgeCoverage => ({
  instrument: 'forward',
  label: 'Venda contratada (offtake) a preço fixo',
  coverage,
  costPct: 0,
  counterparty,
  trigger: 'Contrato assinado antes da compra ao lagar; o volume em aberto vende-se a prazo se o índice de origem descer abaixo do ponto de equilíbrio.',
  note: tidyText(note ?? `${pct(coverage, 0)} do volume vendido antes da compra a ${eurKg(priceKg)}; o resto vende-se ao preço do mês.`),
  executed,
});

const AGENT_HEDGE: HedgeCoverage = {
  instrument: 'nenhuma',
  label: 'Sem cobertura: modelo de agente',
  coverage: 0,
  costPct: 0,
  note: 'A Sprout não tem stock nem preço em risco: o engarrafador vende e fatura, a Sprout recebe comissão.',
};

const eurFixed = (coverage: number, counterparty: string): HedgeCoverage => ({
  instrument: 'forward',
  label: 'Compra em EUR a preço fixo e venda contratada',
  coverage,
  costPct: 0.003,
  counterparty,
  trigger: 'Preço de compra fixado com o importador; vendas a torrefações contratadas antes da compra.',
  note: tidyText(`${pct(coverage, 0)} do volume vendido a torrefações antes da compra. Abaixo de 50–100 t por ano não há futuros KC: o câmbio cobre-se com um forward EUR/USD.`),
});

/* ------------------------------------------------------- lotes */

const kgLot = (q: number) => ({ quantity: q, unit: 'kg' as const, quantityBase: q, baseUnit: 'kg' as const });
const paleteLot = (p: number) => ({ quantity: p, unit: 'palete' as const, quantityBase: p * PALETE.litros, baseUnit: 'L' as const });
const sacaLot = (s: number) => ({ quantity: s, unit: 'saca' as const, quantityBase: s * SACA_KG, baseUnit: 'kg' as const });

const goal = (base: number, price: number) => roundTo(base * price, 10);

/** Índice de origem no mês de abertura do lote (série de mercado). */
const indexAt = (world: WorldId, iso: string) => marketAt(world, iso);

function lot(l: Omit<Lot, 'funding'> & { funding: Omit<Lot['funding'], 'goal'> & { goal?: number } }): Lot {
  const g = l.funding.goal ?? goal(l.quantityBase, l.economics.fundingPrice);
  // Lotes com financiamento fechado estão a 100 %.
  const raised = l.funding.closedAt ? g : l.funding.raised;
  return { ...l, funding: { ...l.funding, goal: g, raised } };
}

const WATER_FUNDING = (opensAt: string): Lot['funding'] => ({ goal: 0, raised: 0, coFinancers: 0, minTicket: 0, maxTicket: 0, opensAt });

/* --- AZ-2025-009: o lote do histórico ilustrativo que liquidou com perda, calculado pela regra da reserva --- */

const E004 = oliveEconomics({ channel: 'distribuicao', index: indexAt('azeite', '2025-01'), coverage: 0.85, expectedMonths: 7 });
const GOAL004 = goal(30000, E004.fundingPrice);
const RESULT004 = 0.018;
/** Margem realizada do AZ-2025-004 (o resultado dos cofinanciadores é metade dela) e a parte que foi para a reserva. */
const MARGIN004 = (RESULT004 * GOAL004) / INVESTOR_SHARE;
const RESERVE_IN004 = Math.round(MARGIN004 * RESERVE_SHARE);

const E009 = oliveEconomics({ channel: 'horeca', index: indexAt('azeite', '2025-02'), coverage: 0.4, expectedMonths: 9 });
const GOAL009 = goal(18000, E009.fundingPrice);
const RESULT009 = -0.034;
/** A reserva tinha só o que o AZ-2025-004 lhe deu e esgotou-se; o resto da perda ficou com os cofinanciadores. */
const RESERVE_USED009 = RESERVE_IN004;
const GROSS009 = RESULT009 - RESERVE_USED009 / GOAL009;

export const LOTS: Lot[] = tidyDeep([
  /* ============================ AZEITE · histórico ilustrativo ============================ */
  lot({
    id: 'AZ-2025-004',
    world: 'azeite',
    producerId: 'olival-guadiana',
    regionId: 'alentejo',
    campanha: '2024/25',
    title: 'Virgem extra Galega e Cordovil',
    product: 'Azeite virgem extra DOP Moura, embalado em garrafões de 5 L para distribuição',
    ...kgLot(30000),
    economics: E004,
    funding: { raised: 0, coFinancers: 11, minTicket: 5000, maxTicket: 30000, opensAt: '2025-01-08', closedAt: '2025-01-20' },
    status: 'liquidado',
    stage: 'liquidado',
    milestones: milestones('azeite', { colhido: '2024-12-12', analisado: '2024-12-20', 'em-deposito': '2025-01-22', 'em-venda': '2025-02-03', expedido: '2025-06-30', liquidado: '2025-08-29' }, {}, {
      liquidado: `Liquidado com ${pct(RESULT004, 1, { sign: true })} do capital. Dos ${num(Math.round(MARGIN004))} € de margem, 30 % (${num(RESERVE_IN004)} €) foram para a reserva comum de primeira perda.`,
    }),
    settlement: { windowMonths: 18, start: '2025-01-20', plannedEnd: '2026-07-20', settledAt: '2025-08-29', settledResult: RESULT004 },
    extension: extension('azeite', E004.indexAtOpen),
    hedge: offtake(0.85, 'Distribuidor alimentar, Lisboa', E004.buyerPrice),
    analyses: [oliveAnalysis({ id: 'az2025004-1', date: '2024-12-20', acidez: 0.24, peroxidos: 7.9, k232: 1.92, k268: 0.15, deltaK: 0.002, md: 0, mf: 4.6, atributos: ['Frutado maduro', 'Amargo ligeiro', 'Picante médio'] })],
    riskFactors: oliveRisks(E004, 0.85),
    storage: { local: 'Lagar do Olival do Guadiana, Moura', container: 'IBC de 1 000 kg', containers: 30 },
    stock: 0,
    buyer: { segment: 'Distribuição', descricao: 'distribuidor alimentar, Lisboa' },
    refundingPlaybookId: 'pb-azeite-preco',
    illustrative: true,
  }),
  lot({
    id: 'AZ-2025-009',
    world: 'azeite',
    producerId: 'lagar-ribeira-alta',
    regionId: 'tras-os-montes',
    campanha: '2024/25',
    title: 'Virgem extra Verdeal e Madural',
    product: 'Azeite virgem extra DOP Trás-os-Montes, em garrafões de 5 L para HoReCa e lojas gourmet',
    ...kgLot(18000),
    economics: E009,
    funding: { raised: 0, coFinancers: 8, minTicket: 5000, maxTicket: 25000, opensAt: '2025-02-10', closedAt: '2025-02-21' },
    status: 'liquidado',
    stage: 'liquidado',
    milestones: milestones(
      'azeite',
      { colhido: '2025-01-14', analisado: '2025-01-24', 'em-deposito': '2025-02-24', 'em-venda': '2025-03-03', expedido: '2025-10-15', liquidado: '2025-11-28' },
      {},
      {
        liquidado: `Liquidado com ${pct(RESULT009, 1, { sign: true })} do capital. O resultado bruto foi ${pct(GROSS009, 1, { sign: true })}: 4 500 kg perderam a categoria de virgem extra e o resto vendeu-se com o índice até 14 % abaixo da abertura. A reserva comum tinha ${num(RESERVE_USED009)} € (30 % da margem do AZ-2025-004) e absorveu-os todos; o resto da perda ficou com os cofinanciadores.`,
      },
    ),
    settlement: { windowMonths: 18, start: '2025-02-21', plannedEnd: '2026-08-21', settledAt: '2025-11-28', settledResult: RESULT009 },
    extension: extension('azeite', E009.indexAtOpen),
    hedge: forward(0.4, 'Grossista HoReCa, Porto', 'Sem gatilho adicional.', `40 % do volume vendido a prazo a ${eurKg(E009.buyerPrice)}; o resto vendeu-se por tranches ao preço do mês.`),
    analyses: [
      oliveAnalysis({ id: 'az2025009-1', date: '2025-01-24', acidez: 0.18, peroxidos: 6.2, k232: 1.81, k268: 0.13, deltaK: 0.001, md: 0, mf: 5.1, atributos: ['Frutado verde', 'Amargo médio', 'Picante intenso'] }),
      oliveAnalysis({ id: 'az2025009-2', date: '2025-07-10', acidez: 0.41, peroxidos: 21.4, k232: 2.38, k268: 0.2, deltaK: 0.006, md: 0, mf: 3.6, atributos: ['Frutado maduro', 'Amargo ligeiro'], note: 'Reanálise aos 5 meses: 4 500 kg (depósito 2) com peróxidos acima do limite do virgem extra, vendidos como virgem. O resto manteve a categoria.' }),
    ],
    riskFactors: oliveRisks(E009, 0.4),
    storage: { local: 'Lagar da Ribeira Alta, Mirandela', container: 'IBC de 1 000 kg', containers: 18 },
    stock: 0,
    buyer: { segment: 'HoReCa', descricao: 'HoReCa e lojas gourmet, Porto e Norte' },
    refundingPlaybookId: 'pb-azeite-preco',
    illustrative: true,
  }),
  (() => {
    const e = oliveEconomics({ channel: 'distribuicao', index: indexAt('azeite', '2025-03'), coverage: 0.85, expectedMonths: 24 });
    return lot({
      id: 'AZ-2025-017',
      world: 'azeite',
      producerId: 'herdade-monte-claro',
      regionId: 'ribatejo',
      campanha: '2024/25',
      title: 'Virgem extra Galega',
      product: 'Azeite virgem extra Galega de vale, embalado em garrafões de 5 L para distribuição HoReCa',
      ...kgLot(26000),
      economics: e,
      funding: { raised: 0, coFinancers: 9, minTicket: 5000, maxTicket: 25000, opensAt: '2025-02-27', closedAt: '2025-03-10' },
      status: 'em-extensao',
      stage: 'em-venda',
      milestones: milestones(
        'azeite',
        { colhido: '2025-01-30', analisado: '2025-02-12', 'em-deposito': '2025-03-14', 'em-venda': '2025-04-01' },
        { expedido: '2027-02-15', liquidado: '2027-03-10' },
        { 'em-venda': 'Em venda. Janela estendida 6 meses: o comprador do contrato cancelou metade das entregas e 40 % do stock estava por vender no mês 18.' },
      ),
      settlement: { windowMonths: 18, start: '2025-03-10', plannedEnd: '2026-09-10', extendedTo: '2027-03-10' },
      extension: extension('azeite', e.indexAtOpen),
      hedge: offtake(
        0.45,
        'Distribuidor HoReCa, Lisboa',
        e.buyerPrice,
        `85 % vendido a prazo a ${eurKg(e.buyerPrice)} a um distribuidor HoReCa de Lisboa, que cancelou metade das entregas em 2025: ficaram cumpridos 45 %. O gatilho de 16/09/2026 vendeu a prazo os 40 % por vender a 4,50 €/kg.`,
        { share: 0.4, index: 3.55, date: '2026-09-16' },
      ),
      analyses: [
        oliveAnalysis({ id: 'az2025017-1', date: '2025-02-12', acidez: 0.27, peroxidos: 8.4, k232: 1.98, k268: 0.16, deltaK: 0.003, md: 0, mf: 4.2, atributos: ['Frutado maduro', 'Amargo ligeiro', 'Picante ligeiro'] }),
        oliveAnalysis({ id: 'az2025017-2', date: '2026-08-20', acidez: 0.38, peroxidos: 12.6, k232: 2.21, k268: 0.19, deltaK: 0.004, md: 0, mf: 3.1, atributos: ['Frutado maduro', 'Amargo ligeiro'], note: 'Reanálise aos 18 meses: mantém a categoria virgem extra.' }),
      ],
      riskFactors: oliveRisks(e, 0.85),
      storage: { local: 'Nave climatizada da Herdade Monte Claro, Santarém', container: 'IBC de 1 000 kg', containers: 26 },
      stock: 10400,
      buyer: { segment: 'Distribuição', descricao: 'distribuidor HoReCa, Lisboa' },
      refundingPlaybookId: 'pb-azeite-preco',
      illustrative: true,
    });
  })(),
  (() => {
    const e = oliveEconomics({ channel: 'horeca', index: indexAt('azeite', '2025-11'), coverage: 0.4, expectedMonths: 18 });
    return lot({
      id: 'AZ-2025-031',
      world: 'azeite',
      producerId: 'lagar-serra-gardunha',
      regionId: 'beira-interior',
      campanha: '2025/26',
      title: 'Virgem extra Galega, colheita precoce',
      product: 'Azeite virgem extra de frutado verde, em garrafões de 5 L e vidro para HoReCa e lojas gourmet',
      ...kgLot(20000),
      economics: e,
      funding: { raised: 0, coFinancers: 6, minTicket: 5000, maxTicket: 25000, opensAt: '2025-11-24', closedAt: '2025-12-05' },
      status: 'financiado',
      stage: 'em-venda',
      milestones: milestones('azeite', { colhido: '2025-10-28', analisado: '2025-11-12', 'em-deposito': '2025-12-09', 'em-venda': '2026-03-02' }, { expedido: '2027-01-15', liquidado: '2027-06-05' }),
      settlement: { windowMonths: 18, start: '2025-12-05', plannedEnd: '2027-06-05' },
      extension: extension('azeite', e.indexAtOpen),
      hedge: forward(
        0.4,
        'Grossista HoReCa, Centro',
        'Gatilho executado a 18/05/2026, com o índice a 4,20 €/kg: a venda a prazo subiu de 40 % para 60 %.',
        `40 % do volume vendido a prazo a ${eurKg(e.buyerPrice)}; mais 20 % a 6,03 €/kg depois do gatilho de maio de 2026. O resto vende-se por tranches ao preço do mês.`,
        { share: 0.2, index: 4.2, date: '2026-05-18' },
      ),
      analyses: [
        oliveAnalysis({ id: 'az2025031-1', date: '2025-11-12', acidez: 0.19, peroxidos: 5.8, k232: 1.79, k268: 0.12, deltaK: 0.001, md: 0, mf: 5.8, atributos: ['Frutado verde', 'Amargo intenso', 'Picante intenso'] }),
        oliveAnalysis({ id: 'az2025031-2', date: '2026-07-14', acidez: 0.26, peroxidos: 9.1, k232: 1.97, k268: 0.15, deltaK: 0.002, md: 0, mf: 4.9, atributos: ['Frutado verde', 'Amargo médio', 'Picante médio'], note: 'Reanálise aos 8 meses.' }),
      ],
      riskFactors: oliveRisks(e, 0.4),
      storage: { local: 'Lagar Serra da Gardunha, Fundão', container: 'IBC de 1 000 kg', containers: 20 },
      stock: 11600,
      buyer: { segment: 'HoReCa', descricao: 'HoReCa e lojas gourmet, Centro' },
      refundingPlaybookId: 'pb-azeite-preco',
      illustrative: true,
    });
  })(),
  (() => {
    const e = oliveEconomics({ channel: 'distribuicao', index: indexAt('azeite', '2026-01'), coverage: 0.85, expectedMonths: 11 });
    return lot({
      id: 'AZ-2026-003',
      world: 'azeite',
      producerId: 'olival-guadiana',
      regionId: 'alentejo',
      campanha: '2025/26',
      title: 'Virgem extra Cobrançosa e Galega',
      product: 'Azeite virgem extra, embalado em garrafões de 5 L para distribuição HoReCa',
      ...kgLot(28000),
      economics: e,
      funding: { raised: 0, coFinancers: 10, minTicket: 5000, maxTicket: 25000, opensAt: '2026-01-05', closedAt: '2026-01-15' },
      status: 'financiado',
      stage: 'expedido',
      milestones: milestones(
        'azeite',
        { colhido: '2025-12-04', analisado: '2025-12-16', 'em-deposito': '2026-01-19', 'em-venda': '2026-02-02', expedido: '2026-10-02' },
        { liquidado: '2026-12-01' },
        { expedido: 'Últimas 8 paletes de garrafões de 5 L entregues a distribuidor HoReCa no Algarve; pagamento a 60 dias.' },
      ),
      settlement: { windowMonths: 18, start: '2026-01-15', plannedEnd: '2027-07-15' },
      extension: extension('azeite', e.indexAtOpen),
      hedge: offtake(0.85, 'Distribuidor HoReCa, Algarve', e.buyerPrice),
      analyses: [oliveAnalysis({ id: 'az2026003-1', date: '2025-12-16', acidez: 0.22, peroxidos: 7.1, k232: 1.88, k268: 0.14, deltaK: 0.002, md: 0, mf: 4.8, atributos: ['Frutado maduro', 'Amargo médio', 'Picante médio'] })],
      riskFactors: oliveRisks(e, 0.85),
      storage: { local: 'Lagar do Olival do Guadiana, Moura', container: 'IBC de 1 000 kg', containers: 28 },
      stock: 0,
      buyer: { segment: 'Distribuição', descricao: 'distribuidor HoReCa, Algarve' },
      refundingPlaybookId: 'pb-azeite-preco',
      illustrative: true,
    });
  })(),
  (() => {
    const e = oliveEconomics({ channel: 'distribuicao', index: indexAt('azeite', '2026-02'), coverage: 0.85, expectedMonths: 12 });
    return lot({
      id: 'AZ-2026-009',
      world: 'azeite',
      producerId: 'lagar-serra-gardunha',
      regionId: 'beira-interior',
      campanha: '2025/26',
      title: 'Virgem extra Galega e Cobrançosa',
      product: 'Azeite virgem extra, embalado em garrafões de 5 L para cash & carry',
      ...kgLot(16000),
      economics: e,
      funding: { raised: 0, coFinancers: 5, minTicket: 5000, maxTicket: 20000, opensAt: '2026-02-09', closedAt: '2026-02-20' },
      status: 'financiado',
      stage: 'em-venda',
      milestones: milestones('azeite', { colhido: '2026-01-08', analisado: '2026-01-21', 'em-deposito': '2026-02-24', 'em-venda': '2026-04-06' }, { expedido: '2026-12-15', liquidado: '2027-02-15' }),
      settlement: { windowMonths: 18, start: '2026-02-20', plannedEnd: '2027-08-20' },
      extension: extension('azeite', e.indexAtOpen),
      hedge: offtake(0.85, 'Cash & carry, Coimbra', e.buyerPrice, `85 % vendido a prazo a ${eurKg(e.buyerPrice)}, com entregas mensais até dezembro de 2026. Os 15 % em aberto foram vendidos a prazo a 18/05/2026, com o índice a 4,20 €/kg.`, { share: 0.15, index: 4.2, date: '2026-05-18' }),
      analyses: [oliveAnalysis({ id: 'az2026009-1', date: '2026-01-21', acidez: 0.29, peroxidos: 8.8, k232: 2.02, k268: 0.16, deltaK: 0.003, md: 0, mf: 4.4, atributos: ['Frutado verde', 'Amargo médio', 'Picante médio'] })],
      riskFactors: oliveRisks(e, 0.85),
      storage: { local: 'Lagar Serra da Gardunha, Fundão', container: 'IBC de 1 000 kg', containers: 16 },
      stock: 9800,
      buyer: { segment: 'Cash & carry', descricao: 'cash & carry, Coimbra' },
      refundingPlaybookId: 'pb-azeite-preco',
      illustrative: true,
    });
  })(),
  (() => {
    const e = oliveEconomics({ channel: 'distribuicao', index: indexAt('azeite', '2026-06'), coverage: 0.85, expectedMonths: 11 });
    return lot({
      id: 'AZ-2026-014',
      world: 'azeite',
      producerId: 'herdade-monte-claro',
      regionId: 'ribatejo',
      campanha: '2025/26',
      title: 'Virgem extra Galega e Arbequina',
      product: 'Azeite virgem extra, lote isolado em IBC, a embalar em garrafões de 5 L para distribuição',
      ...kgLot(22000),
      economics: e,
      funding: { raised: 0, coFinancers: 7, minTicket: 5000, maxTicket: 25000, opensAt: '2026-06-02', closedAt: '2026-06-18' },
      status: 'financiado',
      stage: 'em-deposito',
      milestones: milestones(
        'azeite',
        { colhido: '2026-01-26', analisado: '2026-05-28', 'em-deposito': '2026-06-25' },
        { 'em-venda': '2026-11-02', expedido: '2027-03-31', liquidado: '2027-05-31' },
        { 'em-deposito': '22 IBC selados com o número AZ-2026-014 na nave climatizada.' },
      ),
      settlement: { windowMonths: 18, start: '2026-06-18', plannedEnd: '2027-12-18' },
      extension: extension('azeite', e.indexAtOpen),
      hedge: offtake(0.85, 'Distribuidor alimentar, Lisboa', e.buyerPrice, `85 % vendido a prazo a ${eurKg(e.buyerPrice)}, com entregas de novembro a março. Os 15 % em aberto foram vendidos a prazo a 16/09/2026, com o índice a 3,55 €/kg.`, { share: 0.15, index: 3.55, date: '2026-09-16' }),
      analyses: [oliveAnalysis({ id: 'az2026014-1', date: '2026-05-28', acidez: 0.31, peroxidos: 9.4, k232: 2.04, k268: 0.17, deltaK: 0.003, md: 0, mf: 4.1, atributos: ['Frutado maduro', 'Amargo ligeiro', 'Picante médio'] })],
      riskFactors: oliveRisks(e, 0.85),
      storage: { local: 'Nave climatizada da Herdade Monte Claro, Santarém', container: 'IBC de 1 000 kg', containers: 22 },
      stock: 22000,
      buyer: { segment: 'Distribuição', descricao: 'distribuidor alimentar, Lisboa' },
      refundingPlaybookId: 'pb-azeite-preco',
      illustrative: true,
    });
  })(),

  /* ============================ AZEITE · campanha 2026/27 ============================ */
  (() => {
    const e = oliveEconomics({ channel: 'horeca', index: indexAt('azeite', '2026-10'), coverage: 0.4, expectedMonths: 11, pilot: true });
    return lot({
      id: 'AZ-2026-019',
      world: 'azeite',
      producerId: 'lagar-serra-gardunha',
      regionId: 'beira-interior',
      campanha: '2026/27',
      title: 'Virgem extra Galega, colheita precoce',
      product: 'Azeite novo de frutado verde, para HoReCa e lojas gourmet em garrafões de 5 L e vidro',
      ...kgLot(18000),
      economics: e,
      funding: { raised: 0, coFinancers: 0, minTicket: 5000, maxTicket: 20000, opensAt: '2026-10-23', opensPlanned: '2026-10-23' },
      status: 'em-preparacao',
      stage: 'colhido',
      milestones: milestones('azeite', { colhido: '2026-10-08' }, { analisado: '2026-10-21', 'em-deposito': '2026-11-06', 'em-venda': '2027-02-01', expedido: '2027-07-30', liquidado: '2027-09-30' }),
      settlement: { windowMonths: 18 },
      extension: extension('azeite', e.indexAtOpen),
      hedge: forward(0.4, 'A contratar', 'Venda a prazo contratada antes da abertura do financiamento.', '40 % do volume a vender a prazo a grossista HoReCa e lojas gourmet antes da abertura; o resto vende-se por tranches ao preço do mês.'),
      analyses: [],
      riskFactors: oliveRisks(e, 0.4),
      storage: { local: 'Lagar Serra da Gardunha, Fundão', container: 'Depósito de inox', containers: 1 },
      stock: 14250,
      refundingPlaybookId: 'pb-azeite-preco',
    });
  })(),
  (() => {
    const e = oliveEconomics({ channel: 'horeca', index: indexAt('azeite', '2026-10'), coverage: 0.4, expectedMonths: 11, pilot: true });
    return lot({
      id: 'AZ-2026-021',
      world: 'azeite',
      producerId: 'lagar-ribeira-alta',
      regionId: 'tras-os-montes',
      campanha: '2026/27',
      title: 'Virgem extra Verdeal e Cobrançosa',
      product: 'Azeite novo virgem extra DOP Trás-os-Montes, para HoReCa e lojas gourmet em garrafões de 5 L',
      ...kgLot(24000),
      economics: e,
      funding: { raised: 50900, coFinancers: 7, minTicket: 5000, maxTicket: 25000, opensAt: '2026-10-10' },
      status: 'aberto',
      stage: 'analisado',
      milestones: milestones(
        'azeite',
        { colhido: '2026-10-05', analisado: '2026-10-09' },
        { 'em-deposito': '2026-10-30', 'em-venda': '2027-02-01', expedido: '2027-07-30', liquidado: '2027-09-30' },
        {
          colhido: 'Primeiras moendas da campanha; 24 000 kg separados nos depósitos 1 e 2.',
          analisado: 'Acidez 0,21 %, painel sem defeitos, frutado verde 5,4.',
          'em-deposito': 'Transferência para 24 IBC selados com o número do lote, depois de fechado o financiamento. O embalamento em garrafões de 5 L faz-se por tranches no co-packer.',
        },
      ),
      settlement: { windowMonths: 18, plannedEnd: '2028-04-30' },
      extension: extension('azeite', e.indexAtOpen),
      hedge: forward(
        0.4,
        'Grossista HoReCa e lojas gourmet, Norte',
        'Se o índice de origem descer abaixo de 3,15 €/kg (−10 %), a venda a prazo sobe para 60 %.',
        `40 % do volume (9 600 kg) vendido a prazo a ${eurKg(e.buyerPrice)}, com entregas de fevereiro a julho de 2027; o resto vende-se por tranches a clientes HoReCa ao preço do mês.`,
      ),
      analyses: [oliveAnalysis({ id: 'az2026021-1', date: '2026-10-09', acidez: 0.21, peroxidos: 6.8, k232: 1.86, k268: 0.14, deltaK: 0.002, md: 0, mf: 5.4, atributos: ['Frutado verde', 'Amargo médio', 'Picante intenso'], note: 'Notas de folha de oliveira, erva cortada e amêndoa verde.' })],
      riskFactors: oliveRisks(e, 0.4),
      storage: { local: 'Lagar da Ribeira Alta, Mirandela', container: 'IBC de 1 000 kg', containers: 24 },
      stock: 24000,
      buyer: { segment: 'HoReCa', descricao: 'HoReCa e lojas gourmet, Norte' },
      refundingPlaybookId: 'pb-azeite-preco',
    });
  })(),
  (() => {
    const e = oliveEconomics({ channel: 'distribuicao', index: indexAt('azeite', '2026-10'), coverage: 0.85, expectedMonths: 9, pilot: true });
    return lot({
      id: 'AZ-2026-024',
      world: 'azeite',
      producerId: 'olival-guadiana',
      regionId: 'alentejo',
      campanha: '2026/27',
      title: 'Virgem extra Galega e Cordovil',
      product: 'Azeite novo virgem extra DOP Moura, em paletes de garrafões de 5 L para distribuição e exportação',
      ...kgLot(30000),
      economics: e,
      funding: { raised: 18900, coFinancers: 3, minTicket: 5000, maxTicket: 30000, opensAt: '2026-10-12' },
      status: 'aberto',
      stage: 'analisado',
      milestones: milestones(
        'azeite',
        { colhido: '2026-10-03', analisado: '2026-10-11' },
        { 'em-deposito': '2026-11-10', 'em-venda': '2027-02-01', expedido: '2027-05-31', liquidado: '2027-07-30' },
      ),
      settlement: { windowMonths: 18, plannedEnd: '2028-05-10' },
      extension: extension('azeite', e.indexAtOpen),
      hedge: offtake(0.85, 'Distribuidor alimentar, Lisboa, e exportador para o Brasil', e.buyerPrice, `85 % do volume (25 500 kg) vendido antes da compra a ${eurKg(e.buyerPrice)}: preço de saída do embalador mais 0,10 €/kg de prémio de origem. Os 15 % em aberto vendem-se ao preço do mês.`),
      analyses: [oliveAnalysis({ id: 'az2026024-1', date: '2026-10-11', acidez: 0.26, peroxidos: 7.4, k232: 1.9, k268: 0.15, deltaK: 0.002, md: 0, mf: 4.7, atributos: ['Frutado maduro', 'Amargo ligeiro', 'Picante médio'], note: 'Notas de tomate maduro e frutos secos.' })],
      riskFactors: oliveRisks(e, 0.85),
      storage: { local: 'Lagar do Olival do Guadiana, Moura', container: 'IBC de 1 000 kg', containers: 30 },
      stock: 30000,
      buyer: { segment: 'Distribuição', descricao: 'distribuidor alimentar, Lisboa, e exportador para o Brasil' },
      refundingPlaybookId: 'pb-azeite-preco',
    });
  })(),

  /* ============================ ÁGUA · cesto, modelo de agente ============================ */
  lot({
    id: 'AG-2025-011',
    world: 'agua',
    producerId: 'aguas-fonte-fria',
    regionId: 'beira-interior',
    campanha: '2024/25',
    title: 'Água mineral natural 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6',
    ...paleteLot(260),
    economics: waterAgentEconomics(),
    funding: WATER_FUNDING('2025-04-03'),
    status: 'cesto',
    stage: 'liquidado',
    milestones: milestones('agua', { colhido: '2025-03-14', analisado: '2025-03-19', 'em-deposito': '2025-04-03', 'em-venda': '2025-04-15', expedido: '2026-06-30', liquidado: '2026-07-31' }),
    settlement: { windowMonths: 18 },
    extension: extension('agua', 0),
    hedge: AGENT_HEDGE,
    analyses: [waterAnalysis({ id: 'ag2025011-1', date: '2025-03-19', residuo: 31, ph: 5.9, nitratos: 1.2 })],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém de Águas da Fonte Fria, Manteigas', container: 'Palete de 504 garrafas', containers: 260 },
    stock: 0,
    buyer: { segment: 'HoReCa', descricao: 'clientes HoReCa do cesto, Centro' },
    illustrative: true,
  }),
  lot({
    id: 'AG-2026-002',
    world: 'agua',
    producerId: 'nascente-serra-verde',
    regionId: 'minho',
    campanha: '2025/26',
    title: 'Água de nascente 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6',
    ...paleteLot(300),
    economics: waterAgentEconomics(),
    funding: WATER_FUNDING('2026-03-13'),
    status: 'cesto',
    stage: 'em-venda',
    milestones: milestones('agua', { colhido: '2026-02-20', analisado: '2026-02-26', 'em-deposito': '2026-03-13', 'em-venda': '2026-05-04' }, { expedido: '2027-03-31', liquidado: '2027-05-15' }),
    settlement: { windowMonths: 18 },
    extension: extension('agua', 0),
    hedge: AGENT_HEDGE,
    analyses: [waterAnalysis({ id: 'ag2026002-1', date: '2026-02-26', residuo: 22, ph: 6.1, nitratos: 0.8 })],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém da Nascente da Serra Verde, Terras de Bouro', container: 'Palete de 504 garrafas', containers: 300 },
    stock: 118,
    buyer: { segment: 'HoReCa', descricao: 'clientes HoReCa do cesto, Braga' },
    illustrative: true,
  }),
  lot({
    id: 'AG-2026-003',
    world: 'agua',
    producerId: 'aguas-fonte-fria',
    regionId: 'beira-interior',
    campanha: '2025/26',
    title: 'Água mineral natural 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6',
    ...paleteLot(240),
    economics: waterAgentEconomics(),
    funding: WATER_FUNDING('2026-02-04'),
    status: 'cesto',
    stage: 'expedido',
    milestones: milestones(
      'agua',
      { colhido: '2026-01-15', analisado: '2026-01-21', 'em-deposito': '2026-02-04', 'em-venda': '2026-04-01', expedido: '2026-10-06' },
      { liquidado: '2026-11-20' },
      { expedido: 'Últimas 60 paletes entregues pelo engarrafador a cash & carry, Porto; pagamento a 45 dias.' },
    ),
    settlement: { windowMonths: 18 },
    extension: extension('agua', 0),
    hedge: AGENT_HEDGE,
    analyses: [waterAnalysis({ id: 'ag2026003-1', date: '2026-01-21', residuo: 30, ph: 5.9, nitratos: 1.1 })],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém de Águas da Fonte Fria, Manteigas', container: 'Palete de 504 garrafas', containers: 240 },
    stock: 0,
    buyer: { segment: 'Cash & carry', descricao: 'cash & carry, Porto' },
    illustrative: true,
  }),
  lot({
    id: 'AG-2026-005',
    world: 'agua',
    producerId: 'nascente-serra-verde',
    regionId: 'minho',
    campanha: '2025/26',
    title: 'Água de nascente 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6',
    ...paleteLot(280),
    economics: waterAgentEconomics(),
    funding: WATER_FUNDING('2026-07-28'),
    status: 'cesto',
    stage: 'em-deposito',
    milestones: milestones('agua', { colhido: '2026-07-06', analisado: '2026-07-10', 'em-deposito': '2026-07-28' }, { 'em-venda': '2026-11-02', expedido: '2027-08-31', liquidado: '2027-10-15' }),
    settlement: { windowMonths: 18 },
    extension: extension('agua', 0),
    hedge: AGENT_HEDGE,
    analyses: [waterAnalysis({ id: 'ag2026005-1', date: '2026-07-10', residuo: 23, ph: 6.0, nitratos: 0.9 })],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém da Nascente da Serra Verde, Terras de Bouro', container: 'Palete de 504 garrafas', containers: 280 },
    stock: 280,
    buyer: { segment: 'HoReCa', descricao: 'clientes HoReCa do cesto, Norte e Galiza' },
    illustrative: true,
  }),
  lot({
    id: 'AG-2026-007',
    world: 'agua',
    producerId: 'aguas-fonte-fria',
    regionId: 'beira-interior',
    campanha: '2026/27',
    title: 'Água mineral natural 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6, lote de engarrafamento L2609',
    ...paleteLot(320),
    economics: waterAgentEconomics(),
    funding: WATER_FUNDING('2026-10-06'),
    status: 'cesto',
    stage: 'analisado',
    milestones: milestones(
      'agua',
      { colhido: '2026-10-02', analisado: '2026-10-05' },
      { 'em-deposito': '2026-11-03', 'em-venda': '2027-03-01', expedido: '2027-09-30', liquidado: '2027-11-15' },
      { colhido: 'Lote L2609 engarrafado na linha 2 entre 29/09 e 02/10.', liquidado: 'Compradores pagam ao engarrafador; a comissão da Sprout é faturada no fecho de cada mês.' },
    ),
    settlement: { windowMonths: 18 },
    extension: extension('agua', 0),
    hedge: AGENT_HEDGE,
    analyses: [waterAnalysis({ id: 'ag2026007-1', date: '2026-10-05', residuo: 29, ph: 5.8, nitratos: 1.0, note: 'Composição estável face às análises de 2025.' })],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém de Águas da Fonte Fria, Manteigas', container: 'Palete de 504 garrafas', containers: 320 },
    stock: 320,
    buyer: { segment: 'HoReCa', descricao: 'clientes HoReCa do cesto de azeite, Centro' },
  }),
  lot({
    id: 'AG-2026-010',
    world: 'agua',
    producerId: 'nascente-serra-verde',
    regionId: 'minho',
    campanha: '2026/27',
    title: 'Água de nascente 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6',
    ...paleteLot(260),
    economics: waterAgentEconomics(),
    funding: WATER_FUNDING('2026-11-03'),
    status: 'cesto',
    stage: 'colhido',
    milestones: milestones('agua', { colhido: '2026-10-09' }, { analisado: '2026-10-28', 'em-deposito': '2026-11-10', 'em-venda': '2027-04-01', expedido: '2027-09-30', liquidado: '2027-11-15' }, { colhido: 'Engarrafamento em curso: 142 de 260 paletes.' }),
    settlement: { windowMonths: 18 },
    extension: extension('agua', 0),
    hedge: AGENT_HEDGE,
    analyses: [],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém da Nascente da Serra Verde, Terras de Bouro', container: 'Palete de 504 garrafas', containers: 260 },
    stock: 142,
  }),

  /* ============================ CAFÉ (Fase 2) ============================ */
  (() => {
    const e = coffeeEconomics({ acq: 7.0, ref: 7.85, index: marketAt('cafe', '2026-10'), coverage: 0.6, expectedMonths: 4 });
    return lot({
      id: 'CF-2027-001',
      world: 'cafe',
      producerId: 'fazenda-alto-mogiana',
      regionId: 'alta-mogiana',
      campanha: '2027/28',
      title: 'Arábica natural, Mundo Novo',
      product: 'Café verde, peneira 16/17, natural, comprado em EUR a um importador UE',
      ...sacaLot(320),
      economics: e,
      funding: { raised: 0, coFinancers: 0, minTicket: 5000, maxTicket: 25000, opensAt: '2027-10-15', opensPlanned: '2027-10-15' },
      status: 'fase-2',
      stage: 'colhido',
      milestones: milestones(
        'cafe',
        {},
        { colhido: '2027-07-15', analisado: '2027-08-20', 'em-deposito': '2027-10-08', 'em-venda': '2027-10-15', expedido: '2027-12-15', liquidado: '2028-01-31' },
        { colhido: 'Cereja colhida e seca no terreiro, depois descascada (processo natural).' },
      ),
      settlement: { windowMonths: 18, plannedEnd: '2029-04-30' },
      extension: extension('cafe', e.indexAtOpen),
      hedge: eurFixed(0.6, 'Importador UE (operador EUDR) e microtorrefações, a selecionar na Fase 2'),
      analyses: [coffeeAnalysis({ id: 'cf2027001-0', date: '2026-09-18', humidade: 11.2, cat1: 0, total: 4, sca: 82.5, peneira: '16/17', note: 'Amostra da safra 2026/27 recolhida na due diligence: chocolate, frutos secos, corpo médio.' })],
      riskFactors: coffeeRisks(),
      storage: { local: 'Armazém do importador, Leixões (previsto)', container: 'Saca de 60 kg', containers: 320 },
      stock: 0,
    });
  })(),
  (() => {
    const e = coffeeEconomics({ acq: 8.1, ref: 9.0, index: marketAt('cafe', '2026-10'), coverage: 0.6, expectedMonths: 5 });
    return lot({
      id: 'CF-2027-002',
      world: 'cafe',
      producerId: 'finca-los-naranjos',
      regionId: 'huila',
      campanha: '2027/28',
      title: 'Arábica lavado, Caturra e Castillo',
      product: 'Café verde, peneira 15+, lavado, comprado em EUR a um importador UE',
      ...sacaLot(150),
      economics: e,
      funding: { raised: 0, coFinancers: 0, minTicket: 5000, maxTicket: 20000, opensAt: '2027-11-03', opensPlanned: '2027-11-03' },
      status: 'fase-2',
      stage: 'colhido',
      milestones: milestones(
        'cafe',
        {},
        { colhido: '2027-06-20', analisado: '2027-07-25', 'em-deposito': '2027-10-20', 'em-venda': '2027-11-03', expedido: '2028-01-31', liquidado: '2028-03-15' },
        { colhido: 'Cereja despolpada, fermentada e lavada no beneficio; pergaminho seco ao sol (processo lavado).' },
      ),
      settlement: { windowMonths: 18, plannedEnd: '2029-05-15' },
      extension: extension('cafe', e.indexAtOpen),
      hedge: eurFixed(0.6, 'Importador UE (operador EUDR) e microtorrefações, a selecionar na Fase 2'),
      analyses: [coffeeAnalysis({ id: 'cf2027002-0', date: '2026-09-25', humidade: 10.8, cat1: 0, total: 3, sca: 84.25, peneira: '15+', note: 'Amostra da mitaca 2026: panela, laranja, acidez média-alta.' })],
      riskFactors: coffeeRisks(),
      storage: { local: 'Armazém do importador, Leixões (previsto)', container: 'Saca de 60 kg', containers: 150 },
      stock: 0,
    });
  })(),
]);

/* ------------------------------------------------------- reserva comum (histórico ilustrativo) */

/**
 * Saldo da reserva comum de primeira perda, pela regra única (RESERVE_RULE), a partir dos lotes
 * liquidados do histórico ilustrativo. O AZ-2025-004 pagou 30 % da sua margem; o AZ-2025-009 usou tudo.
 */
export const RESERVE_POOL = {
  asOf: '2026-10-13',
  entries: [
    { date: '2025-08-29', lotId: 'AZ-2025-004', amount: RESERVE_IN004, note: '30 % da margem do lote' },
    { date: '2025-11-28', lotId: 'AZ-2025-009', amount: -RESERVE_USED009, note: 'Perda do lote absorvida até esgotar a reserva' },
  ],
  balance: RESERVE_IN004 - RESERVE_USED009,
  next: { lotId: 'AZ-2026-003', date: '2026-12-01', note: 'A próxima entrada prevista é a do AZ-2026-003, na liquidação.' },
  illustrative: true,
};

/* ------------------------------------------------------- preços de hoje */

/** Variação do índice de mercado entre a abertura do lote e um valor dado. Azeite: em €/kg (passagem integral); outros: proporcional. */
function shift(lot: Pick<Lot, 'world' | 'economics'>, index: number): { abs: number; ratio: number } {
  const e = lot.economics;
  return { abs: index - e.indexAtOpen, ratio: e.indexAtOpen > 0 ? index / e.indexAtOpen : 1 };
}

/** Referência do canal a um dado índice (por omissão, o de hoje). */
export function referenceToday(lot: Pick<Lot, 'world' | 'economics'>, index: number = MARKET_TODAY[lot.world]): number {
  const e = lot.economics;
  if (e.model === 'agente') return e.refPrice;
  const s = shift(lot, index);
  return r2(lot.world === 'azeite' ? e.refPrice + s.abs : e.refPrice * s.ratio);
}

/** Preço ao comprador da parte sem venda a prazo, a um dado índice. */
export function buyerPriceAtIndex(lot: Pick<Lot, 'world' | 'economics'>, index: number = MARKET_TODAY[lot.world]): number {
  const e = lot.economics;
  if (e.model === 'agente') return e.buyerPrice;
  return r2(referenceToday(lot, index) * (1 - e.discountPct) + e.originPremium);
}

/**
 * Resultado previsto para os cofinanciadores (fração do capital, antes da reserva) se a parte
 * sem venda a prazo vendesse a um dado índice. A parte coberta fica ao preço da abertura.
 * É uma estimativa, não uma previsão: não inclui custos extra nem atrasos.
 */
export function projectedResult(lot: Pick<Lot, 'world' | 'economics' | 'hedge'>, index: number = MARKET_TODAY[lot.world]): { buyerPriceOpen: number; margin: number; result: number } {
  const e = lot.economics;
  if (e.model === 'agente' || e.fundingPrice <= 0) return { buyerPriceOpen: e.buyerPrice, margin: 0, result: 0 };
  const cov = lot.hedge.coverage;
  const ex = lot.hedge.executed;
  const exShare = ex ? Math.min(ex.share, 1 - cov) : 0;
  const buyerPriceOpen = buyerPriceAtIndex(lot, index);
  const exMargin = ex ? buyerPriceAtIndex(lot, ex.index) - e.fundingPrice : 0;
  const margin = cov * e.grossMargin + exShare * exMargin + (1 - cov - exShare) * (buyerPriceOpen - e.fundingPrice);
  const result = margin >= 0 ? (INVESTOR_SHARE * margin) / e.fundingPrice : margin / e.fundingPrice;
  return { buyerPriceOpen, margin: round(margin, 4), result: round(result, 4) };
}
