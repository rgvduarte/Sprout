import { SIM_RULES } from '../../data';
import type { SimEvent, SimLot, WorldId } from '../../data/types';
import { createRng, type Rng } from '../../lib/prng';
import { eur, num, pct, tidyText } from '../../lib/format';
import { DECK_EVENTS, EVENT_SCOPE, EXCLUSIVE, MAX_MONTH, SCENARIO_LOTS, WINDOW, buyerPriceOf, getSimLot, monthLabel, shortName, unitsText, amountToUnits } from './deck';

/* =====================================================================
   Motor do Simulador de campanha (dinheiro fictício).

   Contas por euro financiado, para que a mesma semente dê a mesma campanha
   qualquer que seja a distribuição: a aleatoriedade do mercado, da economia
   e dos lotes sai de fluxos próprios (semente × mundo, semente × economia,
   semente × lote) que nunca dependem das escolhas do jogador. Assim dá para
   comparar "e se?" com rigor: mesma campanha, sem coberturas, sem reserva,
   sem extensão.

   Modelo (simplificado, educativo), com as regras dos lotes reais:
   - Referência de cada lote: passeio aleatório com regresso à média, com o
     choque do mercado partilhado pelos lotes do mesmo mundo. Os choques do
     índice de origem chegam a cada lote na proporção do granel na sua
     referência (indexShare); os choques de procura (recessão) chegam a todos.
   - Receita = unidades vendidas × preço base × índice efetivo. A cobertura
     fixa o preço de uma fração do volume.
   - Perdas que nenhuma cobertura evita: comprador insolvente (vendas que não
     se recuperam), stock danificado (destruído sem devolução), desclassificação,
     atrasos e custos extra.
   - Partilha de um lote com ganho: 50 % cofinanciadores, 20 % Sprout, 30 %
     para a reserva comum. Um lote com perda fica com ela toda, menos o que a
     reserva comum ainda tiver. A reserva começa com 1 % do investido, recebe
     30 % da margem dos lotes que liquidam com ganho (até 5 % do investido) e
     paga as perdas pela ordem em que os lotes liquidam: quando vários lotes
     caem juntos, esgota-se.
   - Mês 18: extensão (até 6 meses, 0,3 %/mês) se o índice estiver 15 % ou
     mais abaixo da abertura, ou se faltar vender mais de 30 % do stock; sem
     extensão, o que resta vai em venda de fecho com 3 % de desconto.
   - Depois de um choque de preço, se a perda prevista do lote passar o saldo
     da reserva, propõe-se uma ronda de refunding: 1,5 % do lote, vendas em
     pausa 4 meses.
   ===================================================================== */

export interface Allocation {
  simLotId: string;
  amount: number;
  hedged: boolean;
}

export type DecisionKind = 'refunding' | 'extensao';
export type DecisionChoice = 'aprovar' | 'recusar';
export type Decisions = Record<string, DecisionChoice>;
export const decisionKey = (simLotId: string, kind: DecisionKind) => `${simLotId}:${kind}`;

export interface SimOptions {
  /** reserva de primeira perda ligada (por omissão sim) */
  reserve?: boolean;
  /** parar na primeira decisão sem resposta (jogo); se falso, usa a proposta da Tesouraria */
  stopAtPending?: boolean;
  /** força todas as decisões de um tipo (contrafactuais) */
  force?: Partial<Record<DecisionKind, DecisionChoice>>;
}

export interface EventHit {
  simLotId: string;
  /** variação da liquidação estimada do lote, em € fictícios */
  impact: number;
  /** quanto a cobertura evitou (só choques de preço em lotes cobertos) */
  hedgeSaved?: number;
  note: string;
}

export interface AppliedEvent {
  key: string;
  event: SimEvent;
  scope: 'mundo' | 'lote' | 'economia';
  world: WorldId;
  month: number;
  hits: EventHit[];
}

export type NoticeKind = 'vendas' | 'refunding' | 'refunding-recusado' | 'extensao' | 'venda-fecho' | 'liquidado' | 'retoma' | 'reserva';

export interface Notice {
  kind: NoticeKind;
  simLotId: string;
  month: number;
  text: string;
}

export type LotStatus = 'em-stock' | 'em-venda' | 'pausa' | 'extensao' | 'liquidado';

export interface LotSnap {
  simLotId: string;
  amount: number;
  hedged: boolean;
  /** fração do stock por vender (0–1) */
  rem: number;
  /** unidades por vender (kg, paletes, sacas) */
  units: number;
  totalUnits: number;
  /** unidades vendidas neste mês */
  soldUnits: number;
  /** preço de venda de referência neste mês (€/kg ou €/L) */
  price: number;
  /** índice da referência do lote face à entrada (1 = igual) */
  priceIndex: number;
  /** liquidação estimada para os cofinanciadores, € fictícios */
  value: number;
  /** resultado estimado (fração do montante) */
  result: number;
  /** quanto a reserva comum está a absorver deste lote (€) */
  reserveUsed: number;
  /** quanto este lote entrega à reserva comum (€), se acabar com ganho */
  reserveIn: number;
  status: LotStatus;
  salesFrom: number;
  salesTo: number;
  pausedUntil: number;
  extended: boolean;
  refunded: boolean;
  downgraded: number;
  delayed: number;
  premium: number;
  /** fração do stock inicial destruída sem devolução */
  writtenOff: number;
  /** fração do valor de venda que não se recuperou (comprador insolvente) */
  badDebt: number;
  settledAt?: number;
}

export interface MonthState {
  month: number;
  lots: LotSnap[];
  /** soma das liquidações estimadas (só lotes), € fictícios */
  value: number;
  /** saldo estimado da reserva comum no fim da campanha, € fictícios */
  reserve: number;
  events: AppliedEvent[];
  notices: Notice[];
}

export interface Pending {
  month: number;
  simLotId: string;
  kind: DecisionKind;
  /** resultado previsto do lote para os cofinanciadores (fração), já com a reserva */
  projected: number;
  /** resultado bruto previsto do lote (fração), antes da partilha e da reserva */
  gross: number;
  priceIndex: number;
  rem: number;
  /** saldo disponível da reserva comum quando a proposta é feita (€) */
  reserveAvailable: number;
  /** meses de extensão propostos */
  extMonths?: number;
}

export interface LotFinal {
  simLotId: string;
  amount: number;
  hedged: boolean;
  revenue: number;
  refunds: number;
  costHedge: number;
  costEvents: number;
  costExtension: number;
  costRefunding: number;
  /** resultado bruto do lote (antes da partilha e da reserva) */
  gross: number;
  /** parte da Sprout (20 % da margem, só com ganho) */
  sprout: number;
  /** entrega à reserva comum (30 % da margem, só com ganho, até ao teto) */
  reserveIn: number;
  /** perda absorvida pela reserva comum */
  reserveUsed: number;
  value: number;
  result: number;
  settledAt: number;
  extended: boolean;
  refunded: boolean;
  fireSale: boolean;
  events: string[];
}

export interface SimRun {
  seed: number;
  allocations: Allocation[];
  decisions: Decisions;
  options: SimOptions;
  months: MonthState[];
  pending?: Pending;
  complete: boolean;
  /** último mês calculado */
  end: number;
  invested: number;
  /** soma das liquidações (só no fim) */
  final?: { value: number; result: number; lots: LotFinal[]; maxDrawdown: number; reserveStart: number; reserveEnd: number; reserveExhausted: boolean };
}

/* ------------------------------------------------------------ parâmetros */

/** regresso à média do índice de preço, por mês */
const MEAN_REVERSION = 0.06;
const FIRE_SALE_DISCOUNT = 0.03;
const REFUNDING_PAUSE = 4;
const FORCE_MAJEURE_REFUND = 0.9;
const SHARES = SIM_RULES.shares;
const RESERVE = SIM_RULES.reserve;
const EXT_COST = SIM_RULES.extension.monthlyCostPct;
const REFUNDING_COST = SIM_RULES.refunding.costPct;
const WORLDS: WorldId[] = ['azeite', 'agua', 'cafe'];
const EPS = 1e-9;

/* ------------------------------------------------------------ estado interno */

interface LotSim {
  lot: SimLot;
  amount: number;
  hedged: boolean;
  coverage: number;
  gm: number;
  lnP: number;
  rem: number;
  rev: number;
  refunds: number;
  costHedge: number;
  costEvents: number;
  costExtension: number;
  costRefunding: number;
  quality: number;
  premium: number;
  s: number;
  e: number;
  pausedUntil: number;
  extended: boolean;
  extEnd: number;
  refunded: boolean;
  refundingDeclined: boolean;
  downgraded: number;
  delayed: number;
  writtenOff: number;
  badDebt: number;
  fireSale: boolean;
  settledAt?: number;
  startedSelling: boolean;
  events: string[];
}

const costs = (l: LotSim) => l.costHedge + l.costEvents + l.costExtension + l.costRefunding;
const priceIdx = (l: LotSim) => Math.exp(l.lnP);
/** Índice de origem implícito na referência do lote (para o gatilho de extensão). */
const indexLevel = (l: LotSim) => (l.lot.indexShare > 0 ? 1 + (priceIdx(l) - 1) / l.lot.indexShare : priceIdx(l));
const effIndex = (l: LotSim, P = priceIdx(l), hedged = l.hedged) => (hedged ? l.coverage + (1 - l.coverage) * P : P);
const unitFactor = (l: LotSim, P = priceIdx(l), hedged = l.hedged) => (1 + l.gm) * effIndex(l, P, hedged) * l.quality * (1 + l.premium);

/** valor bruto por € financiado (vendas + devoluções − custos + stock ao preço de hoje) */
function grossPerEur(l: LotSim, hedged = l.hedged): number {
  return l.rev + l.refunds - costs(l) + l.rem * unitFactor(l, priceIdx(l), hedged);
}

interface BookEntry {
  value: number;
  result: number;
  reserveUsed: number;
  reserveIn: number;
  sprout: number;
  gross: number;
}

/**
 * Liquidação de cada lote com a reserva comum: os lotes liquidam pela ordem prevista
 * (os já liquidados primeiro, depois pelo fim da janela de vendas). Um lote com ganho
 * reparte a margem (50/20/30) e alimenta a reserva até ao teto; um lote com perda
 * usa o que a reserva tiver nesse momento.
 */
function book(lots: LotSim[], invested: number, reserveOn: boolean, override?: { id: string; hedged: boolean }): { entries: Map<string, BookEntry>; start: number; end: number } {
  const active = lots.filter((l) => l.amount > 0);
  const order = [...active].sort((a, b) => (a.settledAt ?? 1e6) - (b.settledAt ?? 1e6) || a.e - b.e || a.lot.id.localeCompare(b.lot.id));
  const cap = RESERVE.capOfInvested * invested;
  const start = reserveOn ? RESERVE.initialOfInvested * invested : 0;
  let pool = start;
  const entries = new Map<string, BookEntry>();
  for (const l of order) {
    const hedged = override && override.id === l.lot.id ? override.hedged : l.hedged;
    const G = grossPerEur(l, hedged) - 1;
    const gross = G * l.amount;
    if (G >= 0) {
      const reserveIn = reserveOn ? Math.max(0, Math.min(SHARES.reserve * gross, cap - pool)) : 0;
      pool += reserveIn;
      const value = l.amount + SHARES.investors * gross;
      entries.set(l.lot.id, { value, result: value / l.amount - 1, reserveUsed: 0, reserveIn, sprout: SHARES.sprout * gross, gross });
    } else {
      const used = reserveOn ? Math.min(-gross, pool) : 0;
      pool -= used;
      const value = l.amount + gross + used;
      entries.set(l.lot.id, { value, result: value / l.amount - 1, reserveUsed: used, reserveIn: 0, sprout: 0, gross });
    }
  }
  return { entries, start, end: pool };
}

/** Saldo da reserva disponível agora: o que entrou dos lotes já liquidados, menos o que já pagou. */
function reserveNow(lots: LotSim[], invested: number, reserveOn: boolean): number {
  if (!reserveOn) return 0;
  const settled = lots.filter((l) => l.amount > 0 && l.settledAt !== undefined);
  return book(settled, invested, reserveOn).end;
}

function snap(l: LotSim, t: number, soldFrac: number, entry: BookEntry): LotSnap {
  const totalUnits = amountToUnits(l.lot, l.amount);
  const P = priceIdx(l);
  let status: LotStatus = 'em-stock';
  if (l.settledAt !== undefined) status = 'liquidado';
  else if (l.extended && t > WINDOW) status = 'extensao';
  else if (t <= l.pausedUntil && t >= 1) status = 'pausa';
  else if (t >= l.s && t <= l.e) status = 'em-venda';
  return {
    simLotId: l.lot.id,
    amount: l.amount,
    hedged: l.hedged,
    rem: l.rem,
    units: l.rem * totalUnits,
    totalUnits,
    soldUnits: soldFrac * totalUnits,
    price: buyerPriceOf(l.lot) * P,
    priceIndex: P,
    value: entry.value,
    result: entry.result,
    reserveUsed: entry.reserveUsed,
    reserveIn: entry.reserveIn,
    status,
    salesFrom: l.s,
    salesTo: l.extended ? l.extEnd : l.e,
    pausedUntil: l.pausedUntil,
    extended: l.extended,
    refunded: l.refunded,
    downgraded: l.downgraded,
    delayed: l.delayed,
    premium: l.premium,
    writtenOff: l.writtenOff,
    badDebt: l.badDebt,
    settledAt: l.settledAt,
  };
}

/* ------------------------------------------------------------ texto dos efeitos */

function signedEur(v: number) {
  return eur(Math.round(v), { sign: true, decimals: 0 });
}

function effectNote(ev: SimEvent, l: LotSim, extra: { lost?: number; destroyed?: number }): string {
  const fx = ev.effect;
  const parts: string[] = [];
  const shock = (fx.priceShock ?? 0) * l.lot.indexShare + (fx.refShock ?? 0);
  if (fx.priceShock && l.lot.indexShare <= 0 && !fx.refShock) {
    parts.push('A referência deste lote não depende do índice de origem: o choque não lhe chega.');
  } else if (Math.abs(shock) > EPS) {
    const label = pct(shock, 0, { sign: true });
    const via = fx.priceShock && l.lot.indexShare < 0.999 && l.lot.indexShare > 0 ? ` (o granel pesa ${pct(l.lot.indexShare, 0)} na referência do lote)` : '';
    if (l.hedged && ev.hedgeMitigates) {
      parts.push(
        shock < 0
          ? `Referência do lote ${label}${via}. A cobertura fixa ${pct(l.coverage, 0)} do volume, por isso só o resto sente o choque.`
          : `Referência do lote ${label}${via}. Só os ${pct(1 - l.coverage, 0)} sem cobertura aproveitam a subida.`,
      );
    } else {
      parts.push(shock < 0 ? `Referência do lote ${label}${via}. Sem cobertura, todo o stock por vender perde valor.` : `Referência do lote ${label}${via} sobre todo o stock por vender.`);
    }
  }
  if (fx.qtyLoss && extra.lost) parts.push(`O lote entrega menos ${unitsText(l.lot, extra.lost)}. A cláusula de força maior devolve 90 % do adiantamento dessa parte.`);
  if (fx.writeOff && extra.destroyed) parts.push(`${unitsText(l.lot, extra.destroyed)} perdem-se, sem devolução.`);
  if (fx.badDebt) parts.push(`${pct(fx.badDebt, 0)} do valor de venda do lote não se recupera.`);
  if (fx.salesDelayMonths) {
    const end = l.e;
    parts.push(`Vendas até ${monthLabel(end)}${end > WINDOW ? ', depois do mês 18: pode ser preciso extensão' : ''}.`);
  }
  if (fx.downgrade) parts.push(`${pct(fx.downgrade.share, 0)} do stock passa a azeite virgem e vende-se ${pct(fx.downgrade.discount, 0)} abaixo.`);
  if (fx.demand) parts.push(`Vende ${fx.demand.monthsFaster} meses mais cedo, com prémio de ${pct(fx.demand.premium, 0)}.`);
  if (fx.extraCost) parts.push(`Custo extra de ${pct(fx.extraCost, 1)} do montante (${eur(fx.extraCost * l.amount, { decimals: 0 })}).`);
  return tidyText(parts.join(' '));
}

/* ------------------------------------------------------------ simulação */

function deckFor(world: WorldId, scope: 'mundo' | 'lote'): SimEvent[] {
  return DECK_EVENTS.filter((e) => e.worlds.includes(world) && (EVENT_SCOPE[e.id] ?? 'lote') === scope);
}
const ECONOMY_EVENTS = () => DECK_EVENTS.filter((e) => EVENT_SCOPE[e.id] === 'economia');

export function simulate(seed: number, allocations: Allocation[], decisions: Decisions = {}, options: SimOptions = {}): SimRun {
  const reserveOn = options.reserve !== false;
  const stopAtPending = options.stopAtPending === true;
  const byId = new Map(allocations.filter((a) => a.amount > 0).map((a) => [a.simLotId, a]));

  const lots: LotSim[] = SCENARIO_LOTS.map((lot) => {
    const a = byId.get(lot.id);
    const amount = a?.amount ?? 0;
    const hedged = Boolean(a?.hedged && lot.hedge.available);
    return {
      lot,
      amount,
      hedged,
      coverage: lot.hedge.coverage,
      gm: lot.expectedMargin / SHARES.investors,
      lnP: 0,
      rem: amount > 0 ? 1 : 0,
      rev: 0,
      refunds: 0,
      costHedge: hedged ? lot.hedge.costPct : 0,
      costEvents: 0,
      costExtension: 0,
      costRefunding: 0,
      quality: 1,
      premium: 0,
      s: lot.salesWindow[0],
      e: lot.salesWindow[1],
      pausedUntil: 0,
      extended: false,
      extEnd: 0,
      refunded: false,
      refundingDeclined: false,
      downgraded: 0,
      delayed: 0,
      writtenOff: 0,
      badDebt: 0,
      fireSale: false,
      settledAt: amount > 0 ? undefined : 0,
      startedSelling: false,
      events: [],
    };
  });
  const active = () => lots.filter((l) => l.amount > 0);
  const invested = active().reduce((s, l) => s + l.amount, 0);

  const rngWorld: Record<WorldId, Rng> = { azeite: createRng(`${seed}:mundo:azeite`), agua: createRng(`${seed}:mundo:agua`), cafe: createRng(`${seed}:mundo:cafe`) };
  const rngEconomy = createRng(`${seed}:economia`);
  const rngLot = new Map(lots.map((l) => [l.lot.id, createRng(`${seed}:lote:${l.lot.id}`)]));
  const happenedWorld: Record<WorldId, Set<string>> = { azeite: new Set(), agua: new Set(), cafe: new Set() };
  const happenedEconomy = new Set<string>();
  const happenedLot = new Map(lots.map((l) => [l.lot.id, new Set<string>()]));

  const months: MonthState[] = [];
  const snapAll = (t: number, sold: Map<string, number>) => {
    const b = book(lots, invested, reserveOn);
    const list = active().map((l) => snap(l, t, sold.get(l.lot.id) ?? 0, b.entries.get(l.lot.id)!));
    return { list, reserve: b.end };
  };
  const pushMonth = (t: number, sold: Map<string, number>, events: AppliedEvent[], notices: Notice[]) => {
    const s = snapAll(t, sold);
    months.push({ month: t, lots: s.list, value: s.list.reduce((acc, x) => acc + x.value, 0), reserve: s.reserve, events, notices });
  };
  pushMonth(0, new Map(), [], []);

  const decide = (l: LotSim, kind: DecisionKind): DecisionChoice | undefined => options.force?.[kind] ?? decisions[decisionKey(l.lot.id, kind)];

  let pending: Pending | undefined;
  let end = 0;
  let exhaustedNoticed = false;

  /** Lotes sem stock por vender ficam liquidados neste mês. */
  const settle = (t: number, notices: Notice[]) => {
    for (const l of active()) {
      if (l.settledAt === undefined && l.rem <= EPS) {
        l.rem = 0;
        l.settledAt = t;
        const b = book(lots, invested, reserveOn);
        const v = b.entries.get(l.lot.id)!;
        const extra = v.reserveUsed > 0.5 ? ` A reserva comum absorveu ${eur(v.reserveUsed, { decimals: 0 })} da perda.` : v.reserveIn > 0.5 ? ` ${eur(v.reserveIn, { decimals: 0 })} da margem foram para a reserva comum.` : '';
        notices.push({ kind: 'liquidado', simLotId: l.lot.id, month: t, text: tidyText(`Lote liquidado: ${eur(v.value, { decimals: 0 })} fictícios (${pct(v.result, 1, { sign: true })}).${extra}`) });
        if (reserveOn && !exhaustedNoticed && v.reserveUsed > 0.5 && reserveNow(lots, invested, reserveOn) < 0.5) {
          exhaustedNoticed = true;
          notices.push({ kind: 'reserva', simLotId: l.lot.id, month: t, text: 'A reserva comum esgotou-se: daqui em diante, as perdas ficam inteiras com os cofinanciadores de cada lote.' });
        }
      }
    }
  };

  for (let t = 1; t <= MAX_MONTH; t++) {
    const events: AppliedEvent[] = [];
    const notices: Notice[] = [];
    const sold = new Map<string, number>();

    /* 1. sorteios (sempre os mesmos, qualquer que seja a distribuição) */
    const z: Record<WorldId, number> = { azeite: 0, agua: 0, cafe: 0 };
    const triggered: { ev: SimEvent; world: WorldId; scope: AppliedEvent['scope']; lotId?: string }[] = [];
    for (const ev of ECONOMY_EVENTS()) {
      const roll = rngEconomy.next();
      if (happenedEconomy.has(ev.id) || t < ev.months[0] || t > ev.months[1] || roll >= ev.probPerMonth) continue;
      happenedEconomy.add(ev.id);
      triggered.push({ ev, world: ev.worlds[0], scope: 'economia' });
    }
    for (const w of WORLDS) {
      const rng = rngWorld[w];
      z[w] = rng.normal();
      for (const ev of deckFor(w, 'mundo')) {
        const roll = rng.next();
        const excl = EXCLUSIVE[ev.id];
        if (happenedWorld[w].has(ev.id) || (excl && happenedWorld[w].has(excl))) continue;
        if (t < ev.months[0] || t > ev.months[1] || roll >= ev.probPerMonth) continue;
        happenedWorld[w].add(ev.id);
        triggered.push({ ev, world: w, scope: 'mundo' });
      }
    }
    for (const l of lots) {
      const rng = rngLot.get(l.lot.id)!;
      for (const ev of deckFor(l.lot.world, 'lote')) {
        const roll = rng.next();
        const done = happenedLot.get(l.lot.id)!;
        if (done.has(ev.id) || t < ev.months[0] || t > ev.months[1] || roll >= ev.probPerMonth) continue;
        done.add(ev.id);
        triggered.push({ ev, world: l.lot.world, scope: 'lote', lotId: l.lot.id });
      }
    }

    /* 2. preço: passeio com regresso à média, choque partilhado por mundo */
    for (const l of lots) l.lnP = (1 - MEAN_REVERSION) * l.lnP + l.lot.monthlyVolatility * z[l.lot.world];

    /* 3. custos da extensão em curso */
    for (const l of active()) if (l.extended && t > WINDOW && l.rem > EPS) l.costExtension += EXT_COST;

    /* 4. acontecimentos */
    const shocked = new Set<string>();
    for (const { ev, world, scope, lotId } of triggered) {
      const targets = lots.filter((l) => (lotId ? l.lot.id === lotId : scope === 'economia' ? ev.worlds.includes(l.lot.world) : l.lot.world === world));
      const hits: EventHit[] = [];
      const fx = ev.effect;
      for (const l of targets) {
        const exposed = l.amount > 0 && l.rem > EPS;
        const shock = (fx.priceShock ?? 0) * l.lot.indexShare + (fx.refShock ?? 0);
        const moveP = Math.abs(shock) > EPS ? Math.log(Math.max(0.05, 1 + shock)) : 0;
        if (!exposed) {
          // o choque move a referência do mercado mesmo sem exposição
          l.lnP += moveP;
          continue;
        }
        const before = book(lots, invested, reserveOn).entries.get(l.lot.id)!;
        const beforeBare = book(lots, invested, reserveOn, { id: l.lot.id, hedged: false }).entries.get(l.lot.id)!;
        l.lnP += moveP;
        let lost = 0;
        let destroyed = 0;
        if (fx.qtyLoss && t < l.s) {
          const f = l.rem * fx.qtyLoss;
          l.rem -= f;
          l.refunds += f * FORCE_MAJEURE_REFUND;
          lost = f * amountToUnits(l.lot, l.amount);
        }
        if (fx.writeOff) {
          const f = l.rem * fx.writeOff;
          l.rem -= f;
          l.writtenOff += f;
          destroyed = f * amountToUnits(l.lot, l.amount);
        }
        if (fx.badDebt) {
          l.costEvents += fx.badDebt * (1 + l.gm);
          l.badDebt += fx.badDebt;
        }
        if (fx.salesDelayMonths) {
          if (t < l.s) l.s = Math.min(MAX_MONTH, l.s + fx.salesDelayMonths);
          l.e = Math.min(MAX_MONTH, l.e + fx.salesDelayMonths);
          l.delayed += fx.salesDelayMonths;
        }
        if (fx.downgrade) {
          l.quality *= 1 - fx.downgrade.share * fx.downgrade.discount;
          l.downgraded += fx.downgrade.share;
        }
        if (fx.demand) {
          l.e = Math.max(l.e - fx.demand.monthsFaster, t, l.s, l.pausedUntil + 1);
          l.premium += fx.demand.premium;
        }
        if (fx.extraCost) l.costEvents += fx.extraCost;
        const after = book(lots, invested, reserveOn).entries.get(l.lot.id)!;
        let hedgeSaved: number | undefined;
        if (moveP !== 0 && ev.hedgeMitigates && l.hedged) {
          const afterBare = book(lots, invested, reserveOn, { id: l.lot.id, hedged: false }).entries.get(l.lot.id)!;
          hedgeSaved = after.value - before.value - (afterBare.value - beforeBare.value);
        }
        if (shock < 0) shocked.add(l.lot.id);
        l.events.push(ev.id);
        hits.push({ simLotId: l.lot.id, impact: after.value - before.value, hedgeSaved, note: effectNote(ev, l, { lost, destroyed }) });
      }
      if (hits.length) events.push({ key: `${t}:${ev.id}:${lotId ?? (scope === 'economia' ? 'economia' : world)}`, event: ev, scope, world: hits.length ? getSimLot(hits[0].simLotId)!.world : world, month: t, hits });
    }

    /* 5. refunding depois de um choque de preço */
    for (const l of active()) {
      if (!shocked.has(l.lot.id) || l.refunded || l.refundingDeclined || l.rem <= EPS || t > WINDOW - 2) continue;
      const G = grossPerEur(l) - 1;
      const available = reserveNow(lots, invested, reserveOn);
      if (G >= 0 || -G * l.amount <= available) continue;
      const choice = decide(l, 'refunding');
      if (!choice && stopAtPending) {
        const projected = book(lots, invested, reserveOn).entries.get(l.lot.id)!.result;
        pending = { month: t, simLotId: l.lot.id, kind: 'refunding', projected, gross: G, priceIndex: priceIdx(l), rem: l.rem, reserveAvailable: available };
        break;
      }
      if ((choice ?? 'aprovar') === 'aprovar') {
        l.refunded = true;
        l.costRefunding += REFUNDING_COST;
        const newS = Math.max(l.s, t + REFUNDING_PAUSE + 1);
        const shift = newS - Math.max(l.s, t + 1);
        l.s = newS;
        l.e = Math.min(MAX_MONTH, Math.max(l.e + shift, l.s));
        l.pausedUntil = t + REFUNDING_PAUSE;
        notices.push({ kind: 'refunding', simLotId: l.lot.id, month: t, text: tidyText(`Ronda de refunding aprovada: a armazenagem fica refinanciada ${REFUNDING_PAUSE} meses à espera de melhor preço. Custo de ${eur(REFUNDING_COST * l.amount, { decimals: 0 })}.`) });
      } else {
        l.refundingDeclined = true;
        notices.push({ kind: 'refunding-recusado', simLotId: l.lot.id, month: t, text: 'Refunding recusado: o lote continua a vender ao preço de mercado.' });
      }
    }
    if (pending) {
      pushMonth(t, sold, events, notices);
      end = t;
      break;
    }

    /* 6. vendas */
    for (const l of active()) {
      if (l.rem <= EPS) continue;
      const inWindow = t <= WINDOW || (l.extended && t <= l.extEnd);
      // último mês da extensão (ou do horizonte): vende-se o que resta, mesmo em pausa
      const lastCall = (l.extended && t === l.extEnd) || t === MAX_MONTH;
      if (!lastCall && (!inWindow || t < l.s || t > l.e || t <= l.pausedUntil)) continue;
      const left = lastCall ? 1 : Math.max(1, l.e - t + 1);
      const f = l.rem / left;
      l.rem -= f;
      l.rev += f * unitFactor(l);
      sold.set(l.lot.id, f);
      if (!l.startedSelling) {
        l.startedSelling = true;
        notices.push({
          kind: 'vendas',
          simLotId: l.lot.id,
          month: t,
          text: tidyText(`Primeiras vendas: ${unitsText(l.lot, f * amountToUnits(l.lot, l.amount))} a ${num(buyerPriceOf(l.lot) * priceIdx(l), l.lot.priceUnit === 'L' ? 3 : 2)} €/${l.lot.priceUnit}.`),
        });
      } else if (l.pausedUntil > 0 && t === l.pausedUntil + 1) {
        notices.push({ kind: 'retoma', simLotId: l.lot.id, month: t, text: tidyText(`Fim da pausa do refunding: as vendas retomam com a referência ${pct(priceIdx(l) - 1, 0, { sign: true })} face à entrada.`) });
      }
    }

    /* 7. fim da janela de 18 meses */
    if (t === WINDOW) {
      for (const l of active()) {
        if (l.rem <= EPS) continue;
        const idx = indexLevel(l);
        const priceTrig = idx <= 0.85;
        const stockTrig = l.rem > 0.3;
        if (priceTrig || stockTrig) {
          const extMonths = priceTrig ? SIM_RULES.extension.maxMonths : Math.min(SIM_RULES.extension.maxMonths, Math.max(2, Math.ceil(l.rem * 10)));
          const choice = decide(l, 'extensao');
          if (!choice && stopAtPending) {
            const entry = book(lots, invested, reserveOn).entries.get(l.lot.id)!;
            pending = { month: t, simLotId: l.lot.id, kind: 'extensao', projected: entry.result, gross: grossPerEur(l) - 1, priceIndex: priceIdx(l), rem: l.rem, reserveAvailable: reserveNow(lots, invested, reserveOn), extMonths };
            break;
          }
          if ((choice ?? 'aprovar') === 'aprovar') {
            l.extended = true;
            l.extEnd = WINDOW + extMonths;
            l.s = WINDOW + 1;
            l.e = l.extEnd;
            notices.push({
              kind: 'extensao',
              simLotId: l.lot.id,
              month: t,
              text: tidyText(
                `Extensão de ${extMonths} meses: ${priceTrig ? `${l.lot.world === 'azeite' ? 'o índice de origem' : 'a referência'} está ${pct(1 - idx, 0)} abaixo da abertura` : `falta vender ${pct(l.rem, 0)} do stock`}. Custa 0,3 % do montante por mês.`,
              ),
            });
            continue;
          }
        }
        const units = l.rem * amountToUnits(l.lot, l.amount);
        l.rev += l.rem * unitFactor(l) * (1 - FIRE_SALE_DISCOUNT);
        sold.set(l.lot.id, (sold.get(l.lot.id) ?? 0) + l.rem);
        l.rem = 0;
        l.fireSale = true;
        notices.push({ kind: 'venda-fecho', simLotId: l.lot.id, month: t, text: tidyText(`Venda de fecho no mês 18: ${unitsText(l.lot, units)} vendidos com ${pct(FIRE_SALE_DISCOUNT, 0)} de desconto.`) });
      }
      if (pending) {
        settle(t, notices);
        pushMonth(t, sold, events, notices);
        end = t;
        break;
      }
    }

    /* 8. liquidação */
    settle(t, notices);

    pushMonth(t, sold, events, notices);
    end = t;
    if (t >= WINDOW && active().every((l) => l.settledAt !== undefined)) break;
  }

  const complete = !pending && active().every((l) => l.settledAt !== undefined);
  const run: SimRun = { seed, allocations, decisions, options, months, pending, complete, end, invested };
  if (complete) {
    const b = book(lots, invested, reserveOn);
    const finals: LotFinal[] = active().map((l) => {
      const v = b.entries.get(l.lot.id)!;
      return {
        simLotId: l.lot.id,
        amount: l.amount,
        hedged: l.hedged,
        revenue: l.rev * l.amount,
        refunds: l.refunds * l.amount,
        costHedge: l.costHedge * l.amount,
        costEvents: l.costEvents * l.amount,
        costExtension: l.costExtension * l.amount,
        costRefunding: l.costRefunding * l.amount,
        gross: v.gross,
        sprout: v.sprout,
        reserveIn: v.reserveIn,
        reserveUsed: v.reserveUsed,
        value: v.value,
        result: v.result,
        settledAt: l.settledAt ?? end,
        extended: l.extended,
        refunded: l.refunded,
        fireSale: l.fireSale,
        events: l.events,
      };
    });
    const value = finals.reduce((s, f) => s + f.value, 0);
    run.final = {
      value,
      result: invested > 0 ? value / invested - 1 : 0,
      lots: finals,
      maxDrawdown: maxDrawdown(months, invested),
      reserveStart: b.start,
      reserveEnd: b.end,
      reserveExhausted: reserveOn && finals.some((f) => f.reserveUsed > 0.5) && b.end < 0.5,
    };
  }
  return run;
}

/** Maior queda do valor estimado face ao máximo anterior (fração). */
export function maxDrawdown(months: MonthState[], invested: number, upTo = Infinity): number {
  let peak = invested;
  let dd = 0;
  for (const m of months) {
    if (m.month > upTo) break;
    peak = Math.max(peak, m.value);
    if (peak > 0) dd = Math.max(dd, (peak - m.value) / peak);
  }
  return dd;
}

/** Corrida completa sem paragens (contrafactuais e liga). */
export function simulateFull(seed: number, allocations: Allocation[], decisions: Decisions = {}, options: Omit<SimOptions, 'stopAtPending'> = {}): SimRun {
  return simulate(seed, allocations, decisions, { ...options, stopAtPending: false });
}

/* ------------------------------------------------------------ pontuação de gestão */

export interface ScoreBreakdown {
  total: number;
  riskReturn: number;
  coverage: number;
  diversification: number;
  debrief: number;
  /** fração do capital em lotes com preço volátil que tinha cobertura; null se não havia */
  coverageShare: number | null;
  /** índice de concentração (Herfindahl) por lote */
  hhi: number;
  worlds: number;
  result: number;
  drawdown: number;
}

export const SCORE_RULES = {
  riskReturnMax: 50,
  coverageMax: 20,
  diversificationMax: 20,
  debriefPoints: 10,
  drawdownWeight: 1.5,
  floor: -0.1,
  ceiling: 0.08,
} as const;

/** Pontuação de gestão: risco-retorno + cobertura + diversificação + balanço lido. */
export function managementScore(input: { allocations: Allocation[]; result: number; drawdown: number; debriefRead: boolean }): ScoreBreakdown {
  const allocs = input.allocations.filter((a) => a.amount > 0);
  const total = allocs.reduce((s, a) => s + a.amount, 0) || 1;
  const x = input.result - SCORE_RULES.drawdownWeight * input.drawdown;
  const rr = SCORE_RULES.riskReturnMax * Math.min(1, Math.max(0, (x - SCORE_RULES.floor) / (SCORE_RULES.ceiling - SCORE_RULES.floor)));
  const hedgeable = allocs.filter((a) => getSimLot(a.simLotId)?.hedge.available);
  const hedgeableAmt = hedgeable.reduce((s, a) => s + a.amount, 0);
  const coverageShare = hedgeableAmt > 0 ? hedgeable.filter((a) => a.hedged).reduce((s, a) => s + a.amount, 0) / hedgeableAmt : null;
  const cov = SCORE_RULES.coverageMax * (coverageShare ?? 1);
  const hhi = allocs.reduce((s, a) => s + (a.amount / total) ** 2, 0);
  const worlds = new Set(allocs.map((a) => getSimLot(a.simLotId)?.world)).size;
  const div = (SCORE_RULES.diversificationMax / 2) * Math.min(1, Math.max(0, (1 - hhi) / 0.75)) + (worlds >= 2 ? SCORE_RULES.diversificationMax / 2 : 0);
  const deb = input.debriefRead ? SCORE_RULES.debriefPoints : 0;
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    total: Math.round(rr + cov + div + deb),
    riskReturn: round1(rr),
    coverage: round1(cov),
    diversification: round1(div),
    debrief: deb,
    coverageShare,
    hhi,
    worlds,
    result: input.result,
    drawdown: input.drawdown,
  };
}

/* ------------------------------------------------------------ utilitários */

export const signed = signedEur;

/** Lotes da corrida em ordem estável do baralho. */
export function orderedAllocations(allocations: Allocation[]): Allocation[] {
  return SCENARIO_LOTS.map((l) => allocations.find((a) => a.simLotId === l.id)).filter((a): a is Allocation => Boolean(a && a.amount > 0));
}

export { shortName };
