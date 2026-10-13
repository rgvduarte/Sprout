import { getWorld, getRegion, getProducer, MARKET_TODAY, referenceToday } from '../../data';
import type { JourneyStage, Lot, Position, Producer, Region, World, WorldId } from '../../data/types';
import { addMonths, toDate } from '../../lib/clock';
import { IBC_KG, kgToLitres, num, PALETE, plural, SACA_KG } from '../../lib/format';
import { CONCENTRATION } from '../carteira/positions';

/* =====================================================================
   Jornada do lote · números derivados (janela, tradução física, curva
   de vendas, período de reflexão, concentração). Tudo deriva dos dados
   do lote para bater certo com as outras páginas.
   ===================================================================== */

export const REFLECTION_DAYS = 4;

/* ------------------------------------------------------------ janela */

export interface LotWindow {
  /** início da janela de 18 meses (fecho do financiamento, real ou previsto) */
  start: string;
  /** fim da janela: liquidação prevista */
  end: string;
  /** fim da extensão máxima (real se o lote estiver em extensão) */
  extEnd: string;
  /** o início já aconteceu (financiamento fechado) */
  startKnown: boolean;
  extended: boolean;
  months: number;
}

const milestoneDate = (lot: Lot, stage: JourneyStage) => {
  const m = lot.milestones.find((x) => x.stage === stage);
  return m?.date ?? m?.planned;
};

export function lotWindow(lot: Lot): LotWindow {
  const s = lot.settlement;
  const months = s.windowMonths;
  let start = s.start;
  const startKnown = Boolean(start);
  if (!start) {
    const plannedEnd = s.plannedEnd ?? milestoneDate(lot, 'liquidado');
    start = plannedEnd ? addMonths(plannedEnd, -months) : (lot.funding.opensPlanned ?? lot.funding.opensAt);
  }
  const end = s.plannedEnd ?? addMonths(start, months);
  const extEnd = s.extendedTo ?? addMonths(start, months + lot.extension.maxMonths);
  return { start, end, extEnd, startKnown, extended: Boolean(s.extendedTo), months };
}

export function stageDate(lot: Lot, stage: JourneyStage): { date?: string; done: boolean } {
  const m = lot.milestones.find((x) => x.stage === stage);
  return { date: m?.date ?? m?.planned, done: Boolean(m?.done) };
}

/* ------------------------------------------------------------ datas simples */

export function addDays(iso: string, days: number): string {
  const d = toDate(iso.slice(0, 10));
  return new Date(d.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/** Último dia do período de reflexão (cancelamento sem custos). */
export const reflectionEnd = (committedAt: string) => addDays(committedAt.slice(0, 10), REFLECTION_DAYS);

/** Data-limite da transferência SEPA: 5 dias depois do fim da reflexão. */
export const transferDue = (committedAt: string) => addDays(reflectionEnd(committedAt), 5);

/** Primeiro extrato mensal: dia 5 do mês seguinte ao compromisso (o mesmo calendário da Carteira). */
export function firstStatement(committedAt: string): string {
  const [y, m] = committedAt.slice(0, 7).split('-').map(Number);
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  return `${next.y}-${String(next.m).padStart(2, '0')}-05`;
}

/* ------------------------------------------------------------ vocabulário por mundo */

export interface WorldCopy {
  colheitaNav: string;
  colheitaTitle: string;
  colheitaLead: string;
  mission: string;
  containerSingular: string;
  containerPlural: string;
  sample: string;
  terrainLabel: string;
  stockWhere: string;
}

export const WORLD_COPY: Record<WorldId, WorldCopy> = {
  azeite: {
    colheitaNav: 'Colheita',
    colheitaTitle: 'Colheita e extração',
    colheitaLead: 'A azeitona foi moída no próprio dia. O azeite do lote está pesado, separado e analisado por um laboratório acreditado.',
    mission: 'Objetivo do lote',
    containerSingular: 'IBC',
    containerPlural: 'IBC',
    sample: 'frasco de 250 mL do lote, com o número do lote e a data de extração',
    terrainLabel: 'Socalcos de olival e lagar',
    stockWhere: 'nos depósitos do lagar',
  },
  agua: {
    colheitaNav: 'Engarrafamento',
    colheitaTitle: 'Captação e engarrafamento',
    colheitaLead: 'A água foi engarrafada na origem, como manda a lei. As paletes estão contadas em armazém e a composição foi confirmada por um laboratório acreditado.',
    mission: 'Objetivo do lote',
    containerSingular: 'palete',
    containerPlural: 'paletes',
    sample: 'pack de 6 garrafas de 1,5 L do lote de engarrafamento',
    terrainLabel: 'Serra, estratos do aquífero e linha de engarrafamento',
    stockWhere: 'em armazém',
  },
  cafe: {
    colheitaNav: 'Colheita',
    colheitaTitle: 'Da cereja à saca',
    colheitaLead: 'A cereja é colhida, seca no terreiro e descascada até ficar o grão verde que viaja em sacas de 60 kg.',
    mission: 'Objetivo do lote',
    containerSingular: 'saca',
    containerPlural: 'sacas',
    sample: 'amostra de 350 g de café verde',
    terrainLabel: 'Plantação em socalcos e terreiro de secagem',
    stockWhere: 'em armazém',
  },
};

/* ------------------------------------------------------------ física */

/** Quantidade total do lote em objetos: "24 IBC de 1 000 kg · ≈ 26 201 L". */
export function lotPhysicalDetail(lot: Lot): string {
  if (lot.world === 'azeite') return `${plural(lot.storage.containers, lot.storage.container.startsWith('IBC') ? 'IBC' : 'depósito', lot.storage.container.startsWith('IBC') ? 'IBC' : 'depósitos')} · ≈ ${num(kgToLitres(lot.quantity))} L`;
  if (lot.world === 'agua') return `${num(lot.quantity * PALETE.garrafas)} garrafas de 1,5 L · ${num(lot.quantityBase)} L`;
  return `${num(lot.quantity * SACA_KG)} kg de café verde`;
}

/** Unidades físicas na unidade de contentor do lote (IBC, paletes, sacas). */
export function containersFor(lot: Lot, base: number): string {
  if (lot.world === 'azeite') return `${num(base / IBC_KG, 1)} IBC`;
  if (lot.world === 'agua') return `${num(base / PALETE.litros, 1)} paletes`;
  return `${num(base / SACA_KG, 1)} sacas`;
}

export function stockLabel(lot: Lot, units = lot.stock): string {
  if (lot.unit === 'kg') return `${num(units)} kg`;
  if (lot.unit === 'palete') return plural(units, 'palete', 'paletes');
  return plural(units, 'saca', 'sacas');
}

/* ------------------------------------------------------------ preço */

export function priceDecimals(lot: Pick<Lot, 'world'>) {
  return lot.world === 'agua' ? 3 : 2;
}

export interface MarginSplit {
  perUnit: number;
  investors: number;
  operation: number;
  reserve: number;
  /** reserva estimada para o lote inteiro, se vender como previsto (€) */
  reserveTotal: number;
}

export function marginSplit(lot: Lot): MarginSplit {
  const e = lot.economics;
  const perUnit = e.grossMargin;
  const investors = perUnit * e.investorShare;
  const reserve = perUnit * e.reserveShare;
  const operation = perUnit - investors - reserve;
  return { perUnit, investors, operation, reserve, reserveTotal: reserve * lot.quantityBase };
}

/**
 * Variação do índice de mercado (no azeite, o índice de origem a granel) desde a
 * abertura do lote: granel com granel, nunca granel com o preço embalado.
 */
export function referenceChange(lot: Lot): number {
  const e = lot.economics;
  return e.indexAtOpen > 0 ? MARKET_TODAY[lot.world] / e.indexAtOpen - 1 : 0;
}

/** Variação da referência do canal (preço embalado) desde a abertura: segue o índice de origem. */
export function channelRefChange(lot: Lot): number {
  const e = lot.economics;
  return e.refPrice > 0 ? referenceToday(lot) / e.refPrice - 1 : 0;
}

/** Lote em modelo de agente (cesto de água): sem financiamento, sem stock da Sprout. */
export const isAgentLot = (lot: Pick<Lot, 'economics'>) => lot.economics.model === 'agente';

/* ------------------------------------------------------------ curva de vendas */

/** Fração cumulativa vendida numa data (cenário base): curva em S entre "em venda" e "expedido". */
export function salesShareAt(lot: Lot, iso: string): number {
  const a = stageDate(lot, 'em-venda').date;
  const b = stageDate(lot, 'expedido').date;
  if (!a || !b) return 0;
  const t = (toDate(iso).getTime() - toDate(a).getTime()) / (toDate(b).getTime() - toDate(a).getTime());
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/* ------------------------------------------------------------ contexto */

export interface LotContext {
  world: World;
  producer: Producer;
  region: Region;
  copy: WorldCopy;
}

export function lotContext(lot: Lot): LotContext {
  return { world: getWorld(lot.world), producer: getProducer(lot.producerId)!, region: getRegion(lot.regionId)!, copy: WORLD_COPY[lot.world] };
}

/* ------------------------------------------------------------ concentração */

export interface Concentration {
  totalAfter: number;
  worldShare: number;
  producerShare: number;
  lotShare: number;
  producerName: string;
  worldName: string;
  /** avisos protetores (nunca para empurrar mais capital) */
  notes: { tone: 'warn' | 'info'; text: string }[];
  byWorld: { world: WorldId; amount: number }[];
}

/** Efeito de um compromisso na diversificação da carteira ativa. */
export function concentrationAfter(positions: (Position & { lot: Lot })[], lot: Lot, amount: number, producerName: string): Concentration {
  const active = positions.filter((p) => p.status !== 'liquidado');
  const totalBefore = active.reduce((s, p) => s + p.amount, 0);
  const totalAfter = totalBefore + amount;
  const sumWhere = (pred: (p: Position & { lot: Lot }) => boolean) => active.filter(pred).reduce((s, p) => s + p.amount, 0);
  const worldAmt = sumWhere((p) => p.lot.world === lot.world) + amount;
  const producerAmt = sumWhere((p) => p.lot.producerId === lot.producerId) + amount;
  const lotAmt = sumWhere((p) => p.lotId === lot.id) + amount;
  const worldShare = totalAfter > 0 ? worldAmt / totalAfter : 0;
  const producerShare = totalAfter > 0 ? producerAmt / totalAfter : 0;
  const lotShare = totalAfter > 0 ? lotAmt / totalAfter : 0;
  const worldName = getWorld(lot.world).commodity.toLowerCase();
  const notes: Concentration['notes'] = [];
  if (totalBefore === 0) {
    notes.push({ tone: 'info', text: 'Seria o teu primeiro lote: todo o montante financiado ficaria num só produtor. Num piloto, comprometer pouco no primeiro lote dá para acompanhar um ciclo inteiro antes de decidir mais.' });
  } else {
    if (lotShare > CONCENTRATION.lote) notes.push({ tone: 'warn', text: `Este lote passaria a valer ${Math.round(lotShare * 100)} % do teu montante financiado, acima do limite de atenção de ${Math.round(CONCENTRATION.lote * 100)} % por lote (o mesmo da Carteira). Um problema de qualidade ou um comprador que não paga pesa muito no conjunto.` });
    if (producerShare > CONCENTRATION.produtor) notes.push({ tone: 'warn', text: `${producerName} passaria a ter ${Math.round(producerShare * 100)} % do teu montante financiado, acima do limite de atenção de ${Math.round(CONCENTRATION.produtor * 100)} % por produtor. Repartir por produtores reduz o efeito de um único armazém ou contraparte.` });
    if (worldShare > CONCENTRATION.mundo) notes.push({ tone: 'info', text: `Ficarias com ${Math.round(worldShare * 100)} % em ${worldName}. Os lotes de ${worldName} reagem ao mesmo preço de referência ao mesmo tempo.` });
  }
  const worlds: WorldId[] = ['azeite', 'agua', 'cafe'];
  const byWorld = worlds
    .map((w) => ({ world: w, amount: sumWhere((p) => p.lot.world === w) + (w === lot.world ? amount : 0) }))
    .filter((x) => x.amount > 0);
  return { totalAfter, worldShare, producerShare, lotShare, producerName, worldName, notes, byWorld };
}

/* ------------------------------------------------------------ capítulos */

export type ChapterId = 'origem' | 'colheita' | 'preco' | 'ciclo' | 'riscos' | 'compromisso' | 'acompanhamento' | 'liquidacao' | 'abertura' | 'cesto';

export function endingFor(lot: Lot): ChapterId {
  if (lot.status === 'cesto' || lot.economics.model === 'agente') return 'cesto';
  if (lot.status === 'aberto') return 'compromisso';
  if (lot.status === 'liquidado') return 'liquidacao';
  if (lot.status === 'em-preparacao') return 'abertura';
  return 'acompanhamento';
}

export const ENDING_LABEL: Record<string, string> = {
  compromisso: 'Compromisso',
  acompanhamento: 'Acompanhamento',
  liquidacao: 'Liquidação',
  abertura: 'Abertura',
  cesto: 'Cesto',
};

/** Simulação associada (mesmos parâmetros do lote, dinheiro fictício). */
export function simLotFor(lot: Lot): string | undefined {
  if (lot.world === 'azeite') return lot.regionId === 'alentejo' ? 'sim-az-b' : 'sim-az-a';
  if (lot.world === 'agua') return lot.regionId === 'minho' ? 'sim-ag-b' : 'sim-ag-a';
  return 'sim-cf-a';
}
