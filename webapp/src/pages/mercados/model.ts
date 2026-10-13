import { getMiniGame, getProducer, getRegion, getWorld, isInvestable, OLIVE_CHAIN_FACTS, PRODUCER_PRICE_TODAY } from '../../data';
import type { Lot, MiniGameId, Tone, WorldId } from '../../data/types';
import { num, price } from '../../lib/format';

/* =====================================================================
   Modelo local dos Mercados: cadeia de valor ilustrativa, rótulos de
   missão, cobertura e utilitários de gráfico. Tudo derivado dos lotes
   de demonstração, para os números baterem certo com /lote e /carteira.
   ===================================================================== */

export const WORLD_ORDER: WorldId[] = ['azeite', 'agua', 'cafe'];

/** Preço por unidade no formato do mundo: €/kg com 2 casas, €/L com 3. */
export function unitPrice(world: WorldId, v: number): string {
  const unit = getWorld(world).priceUnit;
  return price(v, unit, unit === 'L' ? 3 : 2);
}

/** Valor numérico sem unidade (eixos, tabelas). */
export function priceNumber(world: WorldId, v: number): string {
  const d = getWorld(world).priceUnit === 'L' ? 3 : 2;
  return v.toLocaleString('pt-PT', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/* ------------------------------------------------------------ objetivo físico do lote */

/**
 * O objetivo físico de um lote aberto, o mesmo no Início e nos Mercados.
 * É um objetivo do lote, não uma missão de conhecimento: financiar não dá
 * pontos (as missões com pontos são só de conhecimento e diligência).
 */
export const LOT_GOAL: Record<WorldId, (lot: Lot) => string> = {
  azeite: (lot) => `${num(Math.round(lot.quantity / 1000))} IBC de 1 000 kg`,
  agua: (lot) => `${num(lot.quantity)} paletes de 504 garrafas`,
  cafe: (lot) => `${num(lot.quantity)} sacas de 60 kg`,
};

/** "Objetivo do lote: 24 IBC de 1 000 kg" */
export const lotGoalTitle = (lot: Lot) => `Objetivo do lote: ${LOT_GOAL[lot.world](lot)}`;

/** Pílula de cobertura de preço por mundo (o que protege o lote). */
export const HEDGE_PILL: Record<WorldId, { label: string; tone: Tone; detail: (lot: Lot) => string }> = {
  azeite: {
    label: 'Forward + indexação',
    tone: 'azeite',
    detail: (lot) => `${Math.round(lot.hedge.coverage * 100)} % vendido a prazo; o resto indexado à referência de origem.`,
  },
  agua: {
    label: 'Sem cobertura de preço necessária',
    tone: 'neutral',
    detail: () => 'Preço estável; o risco de prazo fica coberto por contratos anuais de fornecimento.',
  },
  cafe: {
    label: 'Futuros ICE Arabica (Fase 2)',
    tone: 'cafe',
    detail: (lot) => `${Math.round(lot.hedge.coverage * 100)} % do volume coberto com venda de futuros KC e câmbio EUR/USD.`,
  },
};

export const MINIGAME_BY_WORLD: Record<WorldId, MiniGameId> = {
  azeite: 'painel-prova',
  agua: 'le-o-rotulo',
  cafe: 'cereja-chavena',
};

export const miniGameFor = (world: WorldId) => getMiniGame(MINIGAME_BY_WORLD[world]);

/** Lotes abertos (ou, no café, em pré-visualização) de um mundo, por ordem de abertura. */
export function openLots(lots: Lot[], world: WorldId): Lot[] {
  return lots.filter((l) => l.world === world && (world === 'cafe' ? l.status === 'fase-2' : isInvestable(l))).sort((a, b) => a.funding.opensAt.localeCompare(b.funding.opensAt));
}

export const upcomingLots = (lots: Lot[], world: WorldId) => lots.filter((l) => l.world === world && l.status === 'em-preparacao');

/** Lote que dá os números ilustrativos de um mundo (o mais adiantado dos abertos). */
export function leadLot(lots: Lot[], world: WorldId): Lot {
  const open = openLots(lots, world);
  if (open.length) return [...open].sort((a, b) => b.funding.raised - a.funding.raised)[0];
  return lots.find((l) => l.world === world)!;
}

export function lotPlace(lot: Lot): string {
  const p = getProducer(lot.producerId);
  const r = getRegion(lot.regionId);
  return [p?.nome, r?.nome].filter(Boolean).join(', ');
}

/* ------------------------------------------------------------ cadeia de valor */

export interface ChainModel {
  /** lote que dá os números ilustrativos (fixo, para bater certo com /lote) */
  lotId: string;
  /** quem vende ao comprador na cadeia habitual */
  middleman: string;
  nodes: [producer: string, middleman: string, buyer: string];
  /** preço habitual pago ao produtor (hipótese de trabalho partilhada: PRODUCER_PRICE_TODAY) */
  traditionalProducer: number;
  /** o que o diferencial paga neste mercado e o que a Sprout muda */
  note: string;
}

export const CHAIN: Record<WorldId, ChainModel> = {
  azeite: {
    lotId: 'AZ-2026-021',
    middleman: 'embalador',
    nodes: ['Lagar', 'Embalador', 'Distribuição, HoReCa, retalho'],
    traditionalProducer: PRODUCER_PRICE_TODAY.azeite,
    note: `O lagar vende a granel, ao índice de origem, a um embalador que embala e revende. O diferencial até ao preço embalado paga o embalamento (${OLIVE_CHAIN_FACTS.packingCost.map((v) => num(v, 2)).join('–')} €/kg), a logística e as margens de cada intermediário; a margem líquida do embalador é só ${OLIVE_CHAIN_FACTS.packagerNetMargin.map((v) => num(v, 2)).join('–')} €/kg (${OLIVE_CHAIN_FACTS.sourceShort}). A Sprout compra o lote a granel com um prémio, manda-o embalar num co-packer (o IBC é só a unidade de armazenagem) e vende-o embalado.`,
  },
  agua: {
    lotId: 'AG-2026-007',
    middleman: 'grossista',
    nodes: ['Nascente', 'Grossista', 'Distribuição, HoReCa'],
    traditionalProducer: PRODUCER_PRICE_TODAY.agua,
    note: 'Na água não há embalador: a lei obriga a engarrafar na origem. No cesto, a Sprout é agente: junta encomendas de HoReCa, o engarrafador fatura e entrega, e a Sprout recebe uma comissão. Não compra água nem financia lotes.',
  },
  cafe: {
    lotId: 'CF-2027-001',
    middleman: 'exportador e importador',
    nodes: ['Fazenda', 'Exportador e importador', 'Torrefação'],
    traditionalProducer: PRODUCER_PRICE_TODAY.cafe,
    note: 'No café verde, a margem fica entre o exportador na origem e o importador na Europa. Na Fase 2 a Sprout compra o verde e vende-o a microtorrefações.',
  },
};

export interface ChainSegment {
  id: 'produtor' | 'premio' | 'custos' | 'spread' | 'desconto';
  label: string;
  value: number;
  /** de onde até onde, na unidade de preço */
  from: number;
  to: number;
  description: string;
}

export interface ChainNumbers {
  lot: Lot;
  model: ChainModel;
  /** modelo do lote: principal (compra, embala e vende) ou agente (cesto com comissão) */
  agent: boolean;
  ref: number;
  buyer: number;
  acquisition: number;
  traditionalProducer: number;
  /** diferencial produtor → comprador na cadeia habitual (ref − produtor habitual): embalamento, logística e margens */
  pool: number;
  premium: number;
  costs: number;
  /** margem bruta do lote (no cesto: a comissão da Sprout) */
  spread: number;
  discount: number;
  /** parte do diferencial que passa para comprador, produtor e lote (sem os custos do lote) */
  captured: number;
  split: { investors: number; reserve: number; sprout: number };
  segments: ChainSegment[];
}

export function chainFor(world: WorldId, lot: Lot): ChainNumbers {
  const model = CHAIN[world];
  const e = lot.economics;
  const ref = e.refPrice;
  const trad = model.traditionalProducer;
  const agent = e.model === 'agente';
  const who = world === 'agua' ? 'a nascente' : world === 'cafe' ? 'a fazenda' : 'o lagar';
  const pool = ref - trad;
  const discount = ref - e.buyerPrice;
  if (agent) {
    // cesto: o engarrafador vende ao comprador a buyerPrice e paga a comissão da Sprout
    const commission = e.grossMargin;
    const producerGets = e.buyerPrice - commission;
    const segments: ChainSegment[] = [
      { id: 'produtor', label: 'Preço ex-fábrica habitual', value: trad, from: 0, to: trad, description: 'O que o engarrafador recebe hoje a vender a um grossista.' },
      { id: 'premio', label: 'Ganho do engarrafador no cesto', value: producerGets - trad, from: trad, to: producerGets, description: `Vende diretamente ao comprador do cesto e recebe ${unitPrice(world, producerGets)}; passa a pagar a entrega.` },
      { id: 'spread', label: 'Comissão da Sprout', value: commission, from: producerGets, to: e.buyerPrice, description: `${Math.round((e.commissionPct ?? 0) * 100)} % do valor de venda, faturados ao engarrafador. Sem stock nem capital de cofinanciadores.` },
      { id: 'desconto', label: 'Desconto ao comprador', value: discount, from: e.buyerPrice, to: ref, description: `O comprador paga ${unitPrice(world, e.buyerPrice)} em vez de ${unitPrice(world, ref)}.` },
    ];
    return {
      lot,
      model,
      agent,
      ref,
      buyer: e.buyerPrice,
      acquisition: producerGets,
      traditionalProducer: trad,
      pool,
      premium: producerGets - trad,
      costs: 0,
      spread: commission,
      discount,
      captured: pool > 0 ? 1 : 0,
      split: { investors: 0, reserve: 0, sprout: commission },
      segments,
    };
  }
  const premium = e.acquisitionPrice - trad;
  const costs = e.costsPerUnit;
  const spread = e.buyerPrice - e.fundingPrice;
  const captured = pool > 0 ? (pool - costs) / pool : 0;
  const sproutShare = Math.max(0, 1 - e.investorShare - e.reserveShare);
  const segments: ChainSegment[] = [
    { id: 'produtor', label: world === 'azeite' ? 'Índice de origem (granel)' : 'Preço habitual ao produtor', value: trad, from: 0, to: trad, description: world === 'azeite' ? 'O que o lagar recebe hoje a vender a granel.' : `O que ${who} recebe hoje na cadeia habitual.` },
    { id: 'premio', label: 'Prémio ao produtor', value: premium, from: trad, to: e.acquisitionPrice, description: `A Sprout paga ${unitPrice(world, e.acquisitionPrice)} por origem identificada e pagamento à cabeça.` },
    {
      id: 'custos',
      label: 'Custos até à venda',
      value: costs,
      from: e.acquisitionPrice,
      to: e.fundingPrice,
      description:
        world === 'azeite'
          ? `Embalamento no co-packer (${num(e.packingCost, 2)}), logística, custódia, análises, seguro e provisões.`
          : world === 'cafe'
            ? 'Classificação, frete, seguro, armazém e cobertura KC.'
            : 'Análises, armazém, seguro e transporte.',
    },
    { id: 'spread', label: 'Margem bruta do lote', value: spread, from: e.fundingPrice, to: e.buyerPrice, description: 'Remunera os cofinanciadores, a reserva comum de primeira perda e a Sprout.' },
    { id: 'desconto', label: 'Desconto ao comprador', value: discount, from: e.buyerPrice, to: ref, description: discount > 0.0005 ? `O comprador paga ${unitPrice(world, e.buyerPrice)} em vez de ${unitPrice(world, ref)}.` : e.priceBasis },
  ];
  return {
    lot,
    model,
    agent,
    ref,
    buyer: e.buyerPrice,
    acquisition: e.acquisitionPrice,
    traditionalProducer: trad,
    pool,
    premium,
    costs,
    spread,
    discount,
    captured,
    split: { investors: spread * e.investorShare, reserve: spread * e.reserveShare, sprout: spread * sproutShare },
    segments: segments.filter((x) => x.id === 'produtor' || x.value > 0.0005),
  };
}

/** Uma frase: de onde vem a margem do lote neste mercado, com €/kg ilustrativos. */
export function marginSentence(world: WorldId, c: ChainNumbers): string {
  const p = (v: number) => unitPrice(world, v);
  const e = c.lot.economics;
  if (c.agent)
    return `No cesto, o engarrafador vende ao comprador a ${p(c.buyer)} em vez de ${p(c.ref)} e recebe ${p(c.acquisition)} em vez de cerca de ${p(c.traditionalProducer)} ex-fábrica; a Sprout fica com ${p(c.spread)} de comissão por litro. Sem financiamento.`;
  if (world === 'azeite')
    return `O lagar recebe ${p(c.acquisition)} (índice ${p(c.traditionalProducer)} mais prémio); o lote paga ${p(c.costs)} até à venda, com o embalamento no co-packer; o comprador paga ${p(c.buyer)} (${e.priceBasis}); ficam ${p(c.spread)} de margem bruta para o lote.`;
  return `A fazenda receberia ${p(c.acquisition)}; a torrefação pagaria ${p(c.buyer)} (${e.priceBasis}); a margem bruta indicativa é de ${p(c.spread)}, com futuros ICE a cobrir o preço.`;
}

/* ------------------------------------------------------------ gráficos */

/** Domínio e marcas "redondas" para um eixo y. */
export function niceDomain(min: number, max: number, target = 4): { domain: [number, number]; ticks: number[] } {
  const span = Math.max(max - min, Math.abs(max) * 0.02, 1e-6);
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v / step) * step);
  return { domain: [ticks[0], ticks[ticks.length - 1]], ticks };
}
