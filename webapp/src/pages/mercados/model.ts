import { getMiniGame, getProducer, getRegion, getWorld, isInvestable } from '../../data';
import type { Lot, MiniGameId, Tone, WorldId } from '../../data/types';
import { price } from '../../lib/format';

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

/* ------------------------------------------------------------ missões */

export const MISSION_TITLE: Record<WorldId, (lot: Lot) => string> = {
  azeite: (lot) => `encher o depósito com ${Math.round(lot.quantity / 1000)} IBC de 1 000 kg`,
  agua: (lot) => `encher o armazém com ${lot.quantity} paletes de 504 garrafas`,
  cafe: (lot) => `encher a tulha com ${lot.quantity} sacas de 60 kg`,
};

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
  /** preço habitual pago ao produtor (ilustrativo), na unidade de preço do mundo */
  traditionalProducer: number;
  /** porque é que a parte capturada difere da tese de 80–90 % */
  note: string;
}

export const CHAIN: Record<WorldId, ChainModel> = {
  azeite: {
    lotId: 'AZ-2026-021',
    middleman: 'embalador',
    nodes: ['Lagar', 'Embalador', 'Distribuição, HoReCa, retalho'],
    traditionalProducer: 3.08,
    note: 'O lagar vende a granel a um embalador, que embala e revende à distribuição. A Sprout compra o lote em IBC e vende-o diretamente.',
  },
  agua: {
    lotId: 'AG-2026-007',
    middleman: 'grossista',
    nodes: ['Nascente', 'Grossista', 'Distribuição, HoReCa'],
    traditionalProducer: 0.175,
    note: 'Na água não há embalador: a lei obriga a engarrafar na origem. A margem que muda de mãos é a do grossista, e a logística pesa mais por litro.',
  },
  cafe: {
    lotId: 'CF-2027-001',
    middleman: 'exportador e importador',
    nodes: ['Fazenda', 'Exportador e importador', 'Torrefação'],
    traditionalProducer: 5.45,
    note: 'No café verde, a margem fica entre o exportador na origem e o importador na Europa. Na Fase 2 a Sprout compra à fazenda e vende à torrefação.',
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
  ref: number;
  buyer: number;
  acquisition: number;
  traditionalProducer: number;
  /** margem do intermediário na cadeia habitual (ref − produtor habitual) */
  pool: number;
  premium: number;
  costs: number;
  spread: number;
  discount: number;
  /** parte da margem do intermediário que muda de mãos (sem os custos do lote) */
  captured: number;
  split: { investors: number; reserve: number; sprout: number };
  segments: ChainSegment[];
}

export function chainFor(world: WorldId, lot: Lot): ChainNumbers {
  const model = CHAIN[world];
  const e = lot.economics;
  const ref = e.refPrice;
  const trad = model.traditionalProducer;
  const premium = e.acquisitionPrice - trad;
  const costs = e.costsPerUnit;
  const spread = e.buyerPrice - e.fundingPrice;
  const discount = ref - e.buyerPrice;
  const pool = ref - trad;
  const captured = pool > 0 ? (pool - costs) / pool : 0;
  const sproutShare = Math.max(0, 1 - e.investorShare - e.reserveShare);
  const who = world === 'agua' ? 'a nascente' : world === 'cafe' ? 'a fazenda' : 'o lagar';
  const segments: ChainSegment[] = [
    { id: 'produtor', label: 'Preço habitual ao produtor', value: trad, from: 0, to: trad, description: `O que ${who} recebe hoje na cadeia habitual.` },
    { id: 'premio', label: 'Prémio ao produtor', value: premium, from: trad, to: e.acquisitionPrice, description: `A Sprout paga ${unitPrice(world, e.acquisitionPrice)} por compra direta e pagamento à cabeça.` },
    { id: 'custos', label: 'Custos do lote', value: costs, from: e.acquisitionPrice, to: e.fundingPrice, description: world === 'agua' ? 'Análises, armazém, seguro e transporte.' : world === 'cafe' ? 'Classificação, frete, seguro, armazém e cobertura KC.' : 'Análises, armazenagem sob azoto, seguro e cobertura.' },
    { id: 'spread', label: 'Spread do lote', value: spread, from: e.fundingPrice, to: e.buyerPrice, description: 'Remunera os co-financiadores, a reserva de primeira perda e a Sprout.' },
    { id: 'desconto', label: 'Desconto ao comprador', value: discount, from: e.buyerPrice, to: ref, description: `O comprador paga ${unitPrice(world, e.buyerPrice)} em vez de ${unitPrice(world, ref)}.` },
  ];
  return {
    lot,
    model,
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
    segments,
  };
}

/** Uma frase: como se captura a margem neste mercado, com €/kg ilustrativos. */
export function marginSentence(world: WorldId, c: ChainNumbers): string {
  const p = (v: number) => unitPrice(world, v);
  if (world === 'azeite')
    return `O lagar recebe ${p(c.acquisition)} em vez de cerca de ${p(c.traditionalProducer)}; o comprador paga ${p(c.buyer)} em vez dos ${p(c.ref)} da referência; ficam ${p(c.spread)} de spread para o lote, depois de ${p(c.costs)} de custos.`;
  if (world === 'agua')
    return `A nascente recebe ${p(c.acquisition)} em vez de cerca de ${p(c.traditionalProducer)}; o comprador paga ${p(c.buyer)} em vez de ${p(c.ref)}; ficam ${p(c.spread)} de spread por litro, porque a logística pesa mais do que no azeite.`;
  return `A fazenda receberia ${p(c.acquisition)} em vez de cerca de ${p(c.traditionalProducer)}; a torrefação pagaria ${p(c.buyer)} em vez de ${p(c.ref)}; o spread indicativo é de ${p(c.spread)}, com futuros ICE a cobrir o preço.`;
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
