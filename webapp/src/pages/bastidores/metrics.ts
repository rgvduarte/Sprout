import {
  HEDGE_TRIGGERS,
  INVESTOR_SHARE,
  KYC_QUEUE,
  MARKET_TODAY,
  PILOT_KPIS,
  RECONCILIATION,
  RESERVE_SHARE,
  SIM_EVENTS,
  SIM_RULES,
  type HedgeTrigger,
  type KycCase,
  type Lot,
  type WorldId,
} from '../../data';
import { addMonths, monthsBetween, TODAY_DATE, toDate } from '../../lib/clock';
import { PALETE, SACA_KG } from '../../lib/format';

/* =====================================================================
   Bastidores · contas da equipa. Funções puras sobre os lotes (já com os
   compromissos da sessão), para que piloto, risco e tesouraria batam
   certo entre si e com o resto da app.
   ===================================================================== */

/* ------------------------------------------------------------ lotes em ciclo */

export const CYCLE_STATUSES: Lot['status'][] = ['aberto', 'financiado', 'em-extensao'];

/** Lotes do piloto (azeite + água) com capital em ciclo. O café é Fase 2: sem exposição. */
export const cycleLots = (lots: Lot[]) => lots.filter((l) => l.world !== 'cafe' && CYCLE_STATUSES.includes(l.status));

/** Stock atual na unidade de preço (kg ou L). */
export function stockBase(lot: Lot): number {
  if (lot.unit === 'palete') return lot.stock * PALETE.litros;
  if (lot.unit === 'saca') return lot.stock * SACA_KG;
  return lot.stock;
}

/** Valor de um KPI dos dados de demonstração (por id). */
export const kpi = (id: string) => PILOT_KPIS.find((k) => k.id === id)!;

/** Prazo médio de venda de um lote (meses), dos KPIs do piloto. */
export const SALES_MONTHS = kpi('prazo-venda').value;

/* ------------------------------------------------------------ capital */

export interface CapitalSnapshot {
  /** compromisso de compra assumido com produtores nos lotes em ciclo */
  committed: number;
  /** montante financiado por co-financiadores */
  financed: number;
  /** por financiar nos lotes abertos */
  gap: number;
  openLots: Lot[];
}

export function capital(lots: Lot[]): CapitalSnapshot {
  const cyc = cycleLots(lots);
  const committed = cyc.reduce((s, l) => s + l.funding.goal, 0);
  const financed = cyc.reduce((s, l) => s + l.funding.raised, 0);
  return { committed, financed, gap: committed - financed, openLots: cyc.filter((l) => l.status === 'aberto') };
}

/** Fins de mês usados nos históricos (mai.–out. 2026; outubro = hoje). */
export const HISTORY_MONTHS = ['2026-05-31', '2026-06-30', '2026-07-31', '2026-08-31', '2026-09-30', TODAY_DATE];
export const HISTORY_LABELS = ['mai', 'jun', 'jul', 'ago', 'set', 'out'];

const leq = (a: string | undefined, b: string) => Boolean(a) && toDate(a!).getTime() <= toDate(b).getTime();

/** Capital financiado e lotes em ciclo no fim de cada mês, reconstruídos a partir das datas dos lotes. */
export function capitalHistory(lots: Lot[]): { financed: number[]; committed: number[]; inCycle: number[] } {
  const piloto = lots.filter((l) => l.world !== 'cafe' && l.status !== 'em-preparacao' && l.status !== 'fase-2');
  const financed: number[] = [];
  const committed: number[] = [];
  const inCycle: number[] = [];
  for (const d of HISTORY_MONTHS) {
    let f = 0;
    let c = 0;
    let n = 0;
    for (const l of piloto) {
      if (leq(l.settlement.settledAt, d)) continue;
      const isToday = d === TODAY_DATE;
      if (leq(l.funding.closedAt, d)) {
        f += l.funding.goal;
        c += l.funding.goal;
        n++;
      } else if (leq(l.funding.opensAt, d)) {
        f += isToday ? l.funding.raised : 0;
        c += l.funding.goal;
        n++;
      }
    }
    financed.push(f);
    committed.push(c);
    inCycle.push(n);
  }
  return { financed, committed, inCycle };
}

/* ------------------------------------------------------------ fill rate de encomendas */

/**
 * Encomendas B2B servidas completas e no prazo (fictício, determinístico).
 * O fill rate do piloto mede o que o comprador recebeu face ao que encomendou.
 */
export const ORDER_FILL = [
  { month: 'mai', orders: 15, complete: 14 },
  { month: 'jun', orders: 19, complete: 18 },
  { month: 'jul', orders: 22, complete: 21 },
  { month: 'ago', orders: 18, complete: 17 },
  { month: 'set', orders: 21, complete: 20 },
  { month: 'out', orders: 9, complete: 9 },
];
export const ORDER_FILL_NOTE =
  'Encomendas entregues completas e no prazo sobre encomendas recebidas. Em agosto, 2 paletes do AG-2026-002 chegaram com película rasgada e foram recusadas na receção.';

export function orderFill() {
  const last90 = ORDER_FILL.slice(-3);
  const orders = last90.reduce((s, m) => s + m.orders, 0);
  const complete = last90.reduce((s, m) => s + m.complete, 0);
  return { value: complete / orders, orders, complete, history: ORDER_FILL.map((m) => m.complete / m.orders) };
}

/* ------------------------------------------------------------ KYC */

/** Datas de decisão dos casos já fechados (fictício). Os casos abertos não têm. */
export const KYC_DECIDED_AT: Record<string, string> = {
  'kyc-029': '2026-10-05',
  'kyc-028': '2026-10-03',
  'kyc-024': '2026-10-01',
  'kyc-023': '2026-10-07',
  'kyc-021': '2026-09-24',
  'kyc-020': '2026-09-15',
  'kyc-022': '2026-06-03',
  'kyc-018': '2025-02-14',
  'kyc-017': '2025-11-27',
};

export const OPEN_KYC: KycCase['status'][] = ['em-analise', 'pendente'];
export const KYC_SLA_DAYS = 10;

export const KYC_WEEKS = ['2026-09-13', '2026-09-20', '2026-09-27', '2026-10-04', '2026-10-11', TODAY_DATE];
export const KYC_WEEK_LABELS = ['13 set', '20', '27', '4 out', '11', 'hoje'];

/** Casos abertos no fim de cada semana (antes das decisões desta sessão). */
export function kycBacklogHistory(): number[] {
  return KYC_WEEKS.map((d) =>
    KYC_QUEUE.filter((c) => {
      if (!leq(c.submittedAt, d)) return false;
      const decided = KYC_DECIDED_AT[c.id];
      return OPEN_KYC.includes(c.status) || (decided !== undefined && !leq(decided, d));
    }).length,
  );
}

/* ------------------------------------------------------------ reconciliação */

export const recon = {
  last: RECONCILIATION[0],
  breaks: RECONCILIATION.filter((r) => r.difference !== 0),
  open: RECONCILIATION.filter((r) => r.status === 'em-aberto'),
  /** dias por ordem cronológica (mais antigo primeiro) */
  days: [...RECONCILIATION].reverse(),
};

/* ------------------------------------------------------------ coberturas */

export interface ParsedTrigger {
  def: HedgeTrigger;
  /** referência abaixo da qual dispara (€/kg) */
  threshold?: number;
  /** cobertura depois de disparar (0–1) */
  toCoverage?: number;
  /** preço de referência a que foi executado */
  executedAt?: number;
}

const parseNum = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'));

function parseTrigger(def: HedgeTrigger): ParsedTrigger {
  const th = def.threshold.match(/<\s*([\d,.]+)/);
  const to = def.description.match(/para\s*(\d+)\s*%/);
  const ex = def.status === 'executado' ? def.current.match(/([\d,.]+)\s*€/) : null;
  return {
    def,
    threshold: th ? parseNum(th[1]) : undefined,
    toCoverage: to ? Number(to[1]) / 100 : def.status === 'executado' ? 1 : undefined,
    executedAt: ex ? parseNum(ex[1]) : undefined,
  };
}

export const TRIGGERS: ParsedTrigger[] = HEDGE_TRIGGERS.map(parseTrigger);
export const triggerFor = (lotId: string) => TRIGGERS.find((t) => t.def.lotId === lotId);

/* ------------------------------------------------------------ teste de esforço */

export type ScenarioId = 'base' | 'preco-15' | 'preco-30' | 'colheita-fraca' | 'atraso-3m';

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  /** choque na referência por mundo */
  price: Partial<Record<WorldId, number>>;
  /** meses de atraso nas vendas */
  delay: number;
  /** perda de volume nos lotes ainda em preparação */
  qtyLossPrep: number;
  /** mundos onde o choque de preço se aplica */
  priceWorlds: WorldId[];
}

const simEffect = (id: string) => SIM_EVENTS.find((e) => e.id === id)?.effect ?? {};
const WEAK = simEffect('colheita-fraca');
const DELAY = simEffect('atraso-vendas');

/** Cenários do teste de esforço. Colheita fraca e atraso usam os mesmos parâmetros do Simulador. */
export function scenario(id: ScenarioId, includeWater: boolean): Scenario {
  const worlds: WorldId[] = includeWater ? ['azeite', 'agua'] : ['azeite'];
  const shock = (v: number) => Object.fromEntries(worlds.map((w) => [w, v])) as Partial<Record<WorldId, number>>;
  switch (id) {
    case 'base':
      return { id, label: 'Hoje', description: 'Referências de 13/10/2026, sem choque.', price: {}, delay: 0, qtyLossPrep: 0, priceWorlds: [] };
    case 'preco-15':
      return { id, label: 'Preço −15 %', description: 'A referência cai 15 % e fica lá até à venda.', price: shock(-0.15), delay: 0, qtyLossPrep: 0, priceWorlds: worlds };
    case 'preco-30':
      return { id, label: 'Preço −30 %', description: 'A referência cai 30 %, como no choque do Simulador.', price: shock(-0.3), delay: 0, qtyLossPrep: 0, priceWorlds: worlds };
    case 'colheita-fraca':
      return {
        id,
        label: 'Colheita fraca',
        description: `Volume dos lotes em preparação desce ${Math.round((WEAK.qtyLoss ?? 0.12) * 100)} % e a referência do azeite sobe ${Math.round((WEAK.priceShock ?? 0.08) * 100)} %.`,
        price: { azeite: WEAK.priceShock ?? 0.08 },
        delay: 0,
        qtyLossPrep: WEAK.qtyLoss ?? 0.12,
        priceWorlds: ['azeite'],
      };
    case 'atraso-3m':
      return {
        id,
        label: 'Atraso de 3 meses',
        description: `As vendas atrasam ${DELAY.salesDelayMonths ?? 3} meses; cada mês a mais custa ${String(SIM_RULES.extension.monthlyCostPct * 100).replace('.', ',')} % do montante em armazenagem.`,
        price: {},
        delay: DELAY.salesDelayMonths ?? 3,
        qtyLossPrep: 0,
        priceWorlds: [],
      };
  }
}

export const SCENARIO_IDS: ScenarioId[] = ['base', 'preco-15', 'preco-30', 'colheita-fraca', 'atraso-3m'];

export interface LotRisk {
  lot: Lot;
  /** quantidade total e stock, na unidade de preço */
  Q: number;
  S: number;
  market: number;
  /** variação da referência desde a entrada */
  refChange: number;
  /** base: preço de venda contratado face à referência de hoje */
  basis: number;
  h0: number;
  h: number;
  trigger?: ParsedTrigger;
  triggerFired: boolean;
  /** volume sem cobertura (unidade de preço) */
  exposure: number;
  realized: number;
  /** marcação a mercado do stock (margem não realizada) */
  unrealized: number;
  extraCost: number;
  /** margem bruta total prevista do lote */
  margin: number;
  reserve: number;
  /** resultado previsto para co-financiadores, fração do montante */
  result: number;
  extension: boolean;
  extensionReason?: string;
  refunding: boolean;
  refundingReason?: string;
  monthsLeft: number;
  monthsNeeded: number;
}

function salesStartOffset(lot: Lot): number {
  const m = lot.milestones.find((x) => x.stage === 'em-venda');
  if (!m || m.done || !m.planned) return 0;
  return Math.max(0, monthsBetween(TODAY_DATE, m.planned));
}

/** Avalia um lote num cenário. Ver PRESSUPOSTOS para as regras em texto. */
export function evaluateLot(lot: Lot, sc: Scenario): LotRisk {
  const e = lot.economics;
  const Q = lot.quantityBase;
  const S = stockBase(lot);
  const shock = sc.price[lot.world] ?? 0;
  const market = MARKET_TODAY[lot.world] * (1 + shock);
  const trigger = triggerFor(lot.id);
  const h0 = lot.hedge.coverage;
  let h = h0;
  let extraPrice = 0;
  let triggerFired = false;
  if (trigger?.def.status === 'executado' && trigger.executedAt) {
    h = 1;
    extraPrice = trigger.executedAt * (1 - e.discountPct);
  } else if (trigger?.def.status === 'armado' && trigger.threshold && trigger.toCoverage && market < trigger.threshold) {
    h = Math.max(h0, trigger.toCoverage);
    extraPrice = trigger.threshold * (1 - e.discountPct);
    triggerFired = true;
  }
  const unitValue = h0 * e.buyerPrice + (h - h0) * extraPrice + (1 - h) * market * (1 - e.discountPct);
  const realized = (Q - S) * (e.buyerPrice - e.fundingPrice);
  const unrealized = S * (unitValue - e.fundingPrice);
  const extraCost = sc.delay > 0 && S > 0 ? sc.delay * SIM_RULES.extension.monthlyCostPct * lot.funding.goal : 0;
  const margin = realized + unrealized - extraCost;
  const reserve = RESERVE_SHARE * Math.max(0, e.grossMargin * Q);
  const goal = lot.funding.goal;
  const result = margin >= 0 ? (INVESTOR_SHARE * margin) / goal : Math.min(0, margin + reserve) / goal;

  // prazo: o stock vende-se ao ritmo médio do piloto, a partir do início das vendas
  const end = lot.settlement.extendedTo ?? lot.settlement.plannedEnd ?? addMonths(TODAY_DATE, lot.settlement.windowMonths);
  const monthsLeft = monthsBetween(TODAY_DATE, end);
  const monthsNeeded = S > 0 ? salesStartOffset(lot) + SALES_MONTHS * (S / Q) + sc.delay : 0;
  const unsoldAtEnd = S > 0 ? Math.min(S / Q, Math.max(0, (monthsNeeded - monthsLeft) / SALES_MONTHS)) : 0;

  const alreadyExtended = lot.status === 'em-extensao';
  const priceCond = S > 0 && h < 1 && market <= e.refPrice * 0.85;
  // num lote já em extensão não há segunda extensão: qualquer stock por vender no fim conta
  const timeCond = alreadyExtended ? unsoldAtEnd > 0.005 : unsoldAtEnd > 0.3;
  const condition = priceCond || timeCond;
  const reason = priceCond
    ? `Referência ${Math.round((1 - market / e.refPrice) * 100)} % abaixo da entrada, com ${Math.round((1 - h) * 100)} % do stock sem cobertura.`
    : timeCond
      ? `${Math.round(unsoldAtEnd * 100)} % do lote ficaria por vender no fim da ${alreadyExtended ? 'extensão' : 'janela'}.`
      : undefined;
  const lossBeyondReserve = margin + reserve < 0 && sc.priceWorlds.includes(lot.world);
  const refunding = (alreadyExtended && condition) || lossBeyondReserve;
  const extension = !alreadyExtended && condition;

  return {
    lot,
    Q,
    S,
    market,
    refChange: market / e.refPrice - 1,
    basis: e.buyerPrice / (market * 1) - 1,
    h0,
    h,
    trigger,
    triggerFired,
    exposure: S * (1 - h),
    realized,
    unrealized,
    extraCost,
    margin,
    reserve,
    result,
    extension,
    extensionReason: extension ? reason : undefined,
    refunding,
    refundingReason: refunding
      ? alreadyExtended && condition
        ? `Já usou a extensão. ${reason ?? ''}`.trim()
        : 'Perda prevista acima da reserva de primeira perda depois do choque de preço.'
      : undefined,
    monthsLeft,
    monthsNeeded,
  };
}

export interface StressResult {
  scenario: Scenario;
  rows: LotRisk[];
  base: LotRisk[];
  totalMargin: number;
  baseMargin: number;
  extensions: LotRisk[];
  refundings: LotRisk[];
  triggers: LotRisk[];
  negative: LotRisk[];
  /** lotes em preparação afetados por perda de volume */
  prepImpact: { lot: Lot; from: number; to: number }[];
}

export function stress(lots: Lot[], id: ScenarioId, includeWater: boolean): StressResult {
  const sc = scenario(id, includeWater);
  const baseSc = scenario('base', false);
  const cyc = cycleLots(lots);
  const rows = cyc.map((l) => evaluateLot(l, sc));
  const base = cyc.map((l) => evaluateLot(l, baseSc));
  const prep = lots.filter((l) => l.status === 'em-preparacao' && l.world !== 'cafe' && (l.world === 'azeite' || sc.priceWorlds.includes(l.world)));
  return {
    scenario: sc,
    rows,
    base,
    totalMargin: rows.reduce((s, r) => s + r.margin, 0),
    baseMargin: base.reduce((s, r) => s + r.margin, 0),
    extensions: rows.filter((r) => r.extension),
    refundings: rows.filter((r) => r.refunding),
    triggers: rows.filter((r) => r.triggerFired),
    negative: rows.filter((r) => r.result < 0),
    prepImpact: sc.qtyLossPrep > 0 ? prep.map((l) => ({ lot: l, from: l.quantity, to: Math.round((l.quantity * (1 - sc.qtyLossPrep)) / 10) * 10 })) : [],
  };
}

/** Regras do teste de esforço, em texto (mostradas na página). */
export const PRESSUPOSTOS = [
  'O stock vende-se ao desconto habitual do lote face à referência; a parte coberta vende-se ao preço contratado.',
  'Um gatilho armado dispara quando a referência desce abaixo do limiar: a cobertura sobe para o nível do gatilho, ao preço do limiar.',
  'As vendas já feitas contam ao preço contratado com o comprador.',
  `O stock por vender escoa ao ritmo médio do piloto (${String(SALES_MONTHS).replace('.', ',')} meses por lote), a partir do início previsto das vendas.`,
  'Extensão: referência 15 % ou mais abaixo da entrada com stock sem cobertura, ou mais de 30 % do lote por vender no fim da janela. Uma só por lote, de até 6 meses.',
  `Refunding: lote já em extensão com stock por vender no fim ou com a referência de novo abaixo do limite, ou perda prevista acima da reserva de primeira perda (${Math.round(RESERVE_SHARE * 100)} % da margem bruta prevista) depois de um choque de preço.`,
  'O resultado dos co-financiadores é 65 % da margem bruta quando positiva; quando negativa, a reserva absorve primeiro e o resto é perda de capital.',
];
