import { INVESTOR_SHARE, SIM_RULES } from '../../data';
import type { SimEvent, SimLot, WorldId } from '../../data/types';
import { createRng, type Rng } from '../../lib/prng';
import { eur, num, pct } from '../../lib/format';
import { DECK_EVENTS, EVENT_SCOPE, EXCLUSIVE, MAX_MONTH, SCENARIO_LOTS, WINDOW, buyerPriceOf, getSimLot, monthLabel, shortName, unitsText, amountToUnits } from './deck';

/* =====================================================================
   Motor do Simulador de campanha (dinheiro fictício).

   Contas por euro financiado, para que a mesma semente dê a mesma campanha
   qualquer que seja a distribuição: a aleatoriedade do mercado e dos lotes
   sai de fluxos próprios (semente × mundo, semente × lote) que nunca
   dependem das escolhas do jogador. Assim dá para comparar "e se?" com
   rigor: mesma campanha, sem coberturas, sem reserva, sem extensão.

   Modelo (simplificado, educativo):
   - Preço de referência por lote: passeio aleatório com regresso à média
     (choques de mercado partilhados por mundo) e choques de acontecimentos.
   - Receita = unidades vendidas × preço de venda base × índice efetivo.
     A cobertura fixa o preço de uma fração do volume (índice 1 nessa parte).
   - Margem bruta positiva: 65 % para os co-financiadores. Perda: é toda dos
     co-financiadores, depois de a reserva de primeira perda absorver até 5 %
     do lote.
   - Mês 18: extensão (até 6 meses, 0,3 %/mês) se a referência estiver 15 %
     ou mais abaixo da entrada, ou se faltar vender mais de 30 % do stock;
     sem extensão, o que resta vai em venda de fecho com 3 % de desconto.
   - Depois de um choque de preço, se a perda prevista passar a reserva,
     propõe-se uma ronda de refunding: 1,5 % do lote, vendas em pausa 4 meses.
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
  scope: 'mundo' | 'lote';
  world: WorldId;
  month: number;
  hits: EventHit[];
}

export type NoticeKind = 'vendas' | 'refunding' | 'refunding-recusado' | 'extensao' | 'venda-fecho' | 'liquidado' | 'retoma';

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
  /** índice da referência face à entrada (1 = igual) */
  priceIndex: number;
  /** liquidação estimada para os co-financiadores, € fictícios */
  value: number;
  /** resultado estimado (fração do montante) */
  result: number;
  /** quanto a reserva está a absorver (€) */
  reserveUsed: number;
  status: LotStatus;
  salesFrom: number;
  salesTo: number;
  pausedUntil: number;
  extended: boolean;
  refunded: boolean;
  downgraded: number;
  delayed: number;
  premium: number;
  settledAt?: number;
}

export interface MonthState {
  month: number;
  lots: LotSnap[];
  /** soma das liquidações estimadas (só lotes), € fictícios */
  value: number;
  events: AppliedEvent[];
  notices: Notice[];
}

export interface Pending {
  month: number;
  simLotId: string;
  kind: DecisionKind;
  /** resultado previsto do lote para os co-financiadores (fração), já com a reserva */
  projected: number;
  /** resultado bruto previsto do lote (fração), antes da partilha e da reserva */
  gross: number;
  priceIndex: number;
  rem: number;
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
  final?: { value: number; result: number; lots: LotFinal[]; maxDrawdown: number };
}

/* ------------------------------------------------------------ parâmetros */

/** regresso à média do índice de preço, por mês */
const MEAN_REVERSION = 0.06;
const FIRE_SALE_DISCOUNT = 0.03;
const REFUNDING_PAUSE = 4;
const FORCE_MAJEURE_REFUND = 0.9;
const RESERVE = SIM_RULES.firstLossReservePct;
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
  fireSale: boolean;
  settledAt?: number;
  startedSelling: boolean;
  events: string[];
}

const costs = (l: LotSim) => l.costHedge + l.costEvents + l.costExtension + l.costRefunding;
const priceIdx = (l: LotSim) => Math.exp(l.lnP);
const effIndex = (l: LotSim, P = priceIdx(l), hedged = l.hedged) => (hedged ? l.coverage + (1 - l.coverage) * P : P);
const unitFactor = (l: LotSim, P = priceIdx(l), hedged = l.hedged) => (1 + l.gm) * effIndex(l, P, hedged) * l.quality * (1 + l.premium);

/** valor bruto por € financiado (vendas + devoluções − custos + stock ao preço de hoje) */
function grossPerEur(l: LotSim, hedged = l.hedged): number {
  return l.rev + l.refunds - costs(l) + l.rem * unitFactor(l, priceIdx(l), hedged);
}

/** liquidação dos co-financiadores por € financiado, a partir do resultado bruto G */
function investorPerEur(G: number, reserve: boolean): { value: number; reserveUsed: number } {
  if (G >= 0) return { value: 1 + INVESTOR_SHARE * G, reserveUsed: 0 };
  const reserveUsed = reserve ? Math.min(-G, RESERVE) : 0;
  return { value: 1 + G + reserveUsed, reserveUsed };
}

function lotValue(l: LotSim, reserve: boolean, hedged = l.hedged) {
  const r = investorPerEur(grossPerEur(l, hedged) - 1, reserve);
  return { value: r.value * l.amount, reserveUsed: r.reserveUsed * l.amount, result: r.value - 1 };
}

function snap(l: LotSim, t: number, soldFrac: number, reserve: boolean): LotSnap {
  const v = lotValue(l, reserve);
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
    price: buyerPriceOf(l.lot, INVESTOR_SHARE) * P,
    priceIndex: P,
    value: v.value,
    result: v.result,
    reserveUsed: v.reserveUsed,
    status,
    salesFrom: l.s,
    salesTo: l.extended ? l.extEnd : l.e,
    pausedUntil: l.pausedUntil,
    extended: l.extended,
    refunded: l.refunded,
    downgraded: l.downgraded,
    delayed: l.delayed,
    premium: l.premium,
    settledAt: l.settledAt,
  };
}

/* ------------------------------------------------------------ texto dos efeitos */

function signedEur(v: number) {
  return eur(Math.round(v), { sign: true, decimals: 0 });
}

function effectNote(ev: SimEvent, l: LotSim, t: number, extra: { lost?: number; hedgeSaved?: number }): string {
  const fx = ev.effect;
  const parts: string[] = [];
  if (fx.priceShock) {
    const shock = pct(fx.priceShock, 0, { sign: true });
    if (l.hedged && ev.hedgeMitigates) {
      parts.push(
        fx.priceShock < 0
          ? `Referência ${shock}. A cobertura fixa ${pct(l.coverage, 0)} do volume, por isso só o resto sente o choque.`
          : `Referência ${shock}. Só os ${pct(1 - l.coverage, 0)} sem cobertura aproveitam a subida.`,
      );
    } else {
      parts.push(fx.priceShock < 0 ? `Referência ${shock}. Sem cobertura, todo o stock por vender perde valor.` : `Referência ${shock} sobre todo o stock por vender.`);
    }
  }
  if (fx.qtyLoss && extra.lost) parts.push(`O lote entrega menos ${unitsText(l.lot, extra.lost)}. A cláusula de força maior devolve 90 % do adiantamento dessa parte.`);
  if (fx.salesDelayMonths) {
    const end = l.e;
    parts.push(`Vendas até ${monthLabel(end)}${end > WINDOW ? ', depois do mês 18: pode ser preciso extensão' : ''}.`);
  }
  if (fx.downgrade) parts.push(`${pct(fx.downgrade.share, 0)} do stock passa a azeite virgem e vende-se ${pct(fx.downgrade.discount, 0)} abaixo.`);
  if (fx.demand) parts.push(`Vende ${fx.demand.monthsFaster} meses mais cedo, com prémio de ${pct(fx.demand.premium, 0)}.`);
  if (fx.extraCost) parts.push(`Custo extra de ${pct(fx.extraCost, 1)} do montante (${eur(fx.extraCost * l.amount, { decimals: 0 })}).`);
  void t;
  return parts.join(' ');
}

/* ------------------------------------------------------------ simulação */

function worldEvents(world: WorldId, scope: 'mundo' | 'lote'): SimEvent[] {
  return DECK_EVENTS.filter((e) => e.worlds.includes(world) && (EVENT_SCOPE[e.id] ?? 'lote') === scope);
}

export function simulate(seed: number, allocations: Allocation[], decisions: Decisions = {}, options: SimOptions = {}): SimRun {
  const reserve = options.reserve !== false;
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
      gm: lot.expectedMargin / INVESTOR_SHARE,
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
      fireSale: false,
      settledAt: amount > 0 ? undefined : 0,
      startedSelling: false,
      events: [],
    };
  });
  const active = () => lots.filter((l) => l.amount > 0);
  const invested = active().reduce((s, l) => s + l.amount, 0);

  const rngWorld: Record<WorldId, Rng> = { azeite: createRng(`${seed}:mundo:azeite`), agua: createRng(`${seed}:mundo:agua`), cafe: createRng(`${seed}:mundo:cafe`) };
  const rngLot = new Map(lots.map((l) => [l.lot.id, createRng(`${seed}:lote:${l.lot.id}`)]));
  const happenedWorld: Record<WorldId, Set<string>> = { azeite: new Set(), agua: new Set(), cafe: new Set() };
  const happenedLot = new Map(lots.map((l) => [l.lot.id, new Set<string>()]));

  const months: MonthState[] = [];
  const snapAll = (t: number, sold: Map<string, number>) => active().map((l) => snap(l, t, sold.get(l.lot.id) ?? 0, reserve));
  const first = snapAll(0, new Map());
  months.push({ month: 0, lots: first, value: first.reduce((s, x) => s + x.value, 0), events: [], notices: [] });

  const decide = (l: LotSim, kind: DecisionKind): DecisionChoice | undefined => options.force?.[kind] ?? decisions[decisionKey(l.lot.id, kind)];

  let pending: Pending | undefined;
  let end = 0;

  /** Lotes sem stock por vender ficam liquidados neste mês. */
  const settle = (t: number, notices: Notice[]) => {
    for (const l of active()) {
      if (l.settledAt === undefined && l.rem <= EPS) {
        l.rem = 0;
        l.settledAt = t;
        const v = lotValue(l, reserve);
        notices.push({ kind: 'liquidado', simLotId: l.lot.id, month: t, text: `Lote liquidado: ${eur(v.value, { decimals: 0 })} fictícios (${pct(v.result, 1, { sign: true })}).` });
      }
    }
  };

  for (let t = 1; t <= MAX_MONTH; t++) {
    const events: AppliedEvent[] = [];
    const notices: Notice[] = [];
    const sold = new Map<string, number>();

    /* 1. sorteios (sempre os mesmos, qualquer que seja a distribuição) */
    const z: Record<WorldId, number> = { azeite: 0, agua: 0, cafe: 0 };
    const triggered: { ev: SimEvent; world: WorldId; lotId?: string }[] = [];
    for (const w of WORLDS) {
      const rng = rngWorld[w];
      z[w] = rng.normal();
      for (const ev of worldEvents(w, 'mundo')) {
        const roll = rng.next();
        const excl = EXCLUSIVE[ev.id];
        if (happenedWorld[w].has(ev.id) || (excl && happenedWorld[w].has(excl))) continue;
        if (t < ev.months[0] || t > ev.months[1] || roll >= ev.probPerMonth) continue;
        happenedWorld[w].add(ev.id);
        triggered.push({ ev, world: w });
      }
    }
    for (const l of lots) {
      const rng = rngLot.get(l.lot.id)!;
      for (const ev of worldEvents(l.lot.world, 'lote')) {
        const roll = rng.next();
        const done = happenedLot.get(l.lot.id)!;
        if (done.has(ev.id) || t < ev.months[0] || t > ev.months[1] || roll >= ev.probPerMonth) continue;
        done.add(ev.id);
        triggered.push({ ev, world: l.lot.world, lotId: l.lot.id });
      }
    }

    /* 2. preço: passeio com regresso à média, choque partilhado por mundo */
    for (const l of lots) l.lnP = (1 - MEAN_REVERSION) * l.lnP + l.lot.monthlyVolatility * z[l.lot.world];

    /* 3. custos da extensão em curso */
    for (const l of active()) if (l.extended && t > WINDOW && l.rem > EPS) l.costExtension += EXT_COST;

    /* 4. acontecimentos */
    const shocked = new Set<string>();
    for (const { ev, world, lotId } of triggered) {
      const scope = lotId ? 'lote' : 'mundo';
      const targets = lots.filter((l) => (lotId ? l.lot.id === lotId : l.lot.world === world));
      const hits: EventHit[] = [];
      for (const l of targets) {
        const exposed = l.amount > 0 && l.rem > EPS;
        // o choque de preço move a referência do mercado mesmo sem exposição
        if (ev.effect.priceShock) l.lnP += Math.log(1 + ev.effect.priceShock);
        if (!exposed) {
          if (ev.effect.priceShock) {
            /* sem posição: só a referência muda */
          }
          continue;
        }
        // valor antes (com o preço já movido de volta, para medir só o efeito)
        if (ev.effect.priceShock) l.lnP -= Math.log(1 + ev.effect.priceShock);
        const before = lotValue(l, reserve);
        const beforeBare = lotValue(l, reserve, false);
        if (ev.effect.priceShock) l.lnP += Math.log(1 + ev.effect.priceShock);
        const fx = ev.effect;
        let lost = 0;
        if (fx.qtyLoss && t < l.s) {
          const f = l.rem * fx.qtyLoss;
          l.rem -= f;
          l.refunds += f * FORCE_MAJEURE_REFUND;
          lost = f * amountToUnits(l.lot, l.amount);
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
          l.e = Math.max(l.e - fx.demand.monthsFaster, t, l.s);
          l.premium += fx.demand.premium;
        }
        if (fx.extraCost) l.costEvents += fx.extraCost;
        const after = lotValue(l, reserve);
        let hedgeSaved: number | undefined;
        if (fx.priceShock && ev.hedgeMitigates && l.hedged) {
          const afterBare = lotValue(l, reserve, false);
          hedgeSaved = after.value - before.value - (afterBare.value - beforeBare.value);
        }
        if (fx.priceShock && fx.priceShock < 0) shocked.add(l.lot.id);
        l.events.push(ev.id);
        hits.push({ simLotId: l.lot.id, impact: after.value - before.value, hedgeSaved, note: effectNote(ev, l, t, { lost }) });
      }
      if (hits.length) events.push({ key: `${t}:${ev.id}:${lotId ?? world}`, event: ev, scope, world, month: t, hits });
    }

    /* 5. refunding depois de um choque de preço */
    for (const l of active()) {
      if (!shocked.has(l.lot.id) || l.refunded || l.refundingDeclined || l.rem <= EPS || t > WINDOW - 2) continue;
      const G = grossPerEur(l) - 1;
      if (G >= -RESERVE) continue;
      const choice = decide(l, 'refunding');
      if (!choice && stopAtPending) {
        pending = { month: t, simLotId: l.lot.id, kind: 'refunding', projected: investorPerEur(G, reserve).value - 1, gross: G, priceIndex: priceIdx(l), rem: l.rem };
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
        notices.push({ kind: 'refunding', simLotId: l.lot.id, month: t, text: `Ronda de refunding aprovada: a armazenagem fica refinanciada ${REFUNDING_PAUSE} meses à espera de melhor preço. Custo de ${eur(REFUNDING_COST * l.amount, { decimals: 0 })}.` });
      } else {
        l.refundingDeclined = true;
        notices.push({ kind: 'refunding-recusado', simLotId: l.lot.id, month: t, text: 'Refunding recusado: o lote continua a vender ao preço de mercado.' });
      }
    }
    if (pending) {
      const lotsSnap = snapAll(t, sold);
      months.push({ month: t, lots: lotsSnap, value: lotsSnap.reduce((s, x) => s + x.value, 0), events, notices });
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
          text: `Primeiras vendas: ${unitsText(l.lot, f * amountToUnits(l.lot, l.amount))} a ${num(buyerPriceOf(l.lot, INVESTOR_SHARE) * priceIdx(l), l.lot.priceUnit === 'L' ? 3 : 2)} €/${l.lot.priceUnit}.`,
        });
      } else if (l.pausedUntil > 0 && t === l.pausedUntil + 1) {
        notices.push({ kind: 'retoma', simLotId: l.lot.id, month: t, text: `Fim da pausa do refunding: as vendas retomam com a referência ${pct(priceIdx(l) - 1, 0, { sign: true })} face à entrada.` });
      }
    }

    /* 7. fim da janela de 18 meses */
    if (t === WINDOW) {
      for (const l of active()) {
        if (l.rem <= EPS) continue;
        const P = priceIdx(l);
        const priceTrig = P <= 0.85;
        const stockTrig = l.rem > 0.3;
        if (priceTrig || stockTrig) {
          const extMonths = priceTrig ? SIM_RULES.extension.maxMonths : Math.min(SIM_RULES.extension.maxMonths, Math.max(2, Math.ceil(l.rem * 10)));
          const choice = decide(l, 'extensao');
          if (!choice && stopAtPending) {
            pending = { month: t, simLotId: l.lot.id, kind: 'extensao', projected: lotValue(l, reserve).result, gross: grossPerEur(l) - 1, priceIndex: P, rem: l.rem, extMonths };
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
              text: `Extensão de ${extMonths} meses: ${priceTrig ? `a referência está ${pct(1 - P, 0)} abaixo da entrada` : `faltam vender ${pct(l.rem, 0)} do stock`}. Custa 0,3 % do montante por mês.`,
            });
            continue;
          }
        }
        const units = l.rem * amountToUnits(l.lot, l.amount);
        l.rev += l.rem * unitFactor(l) * (1 - FIRE_SALE_DISCOUNT);
        sold.set(l.lot.id, (sold.get(l.lot.id) ?? 0) + l.rem);
        l.rem = 0;
        l.fireSale = true;
        notices.push({ kind: 'venda-fecho', simLotId: l.lot.id, month: t, text: `Venda de fecho no mês 18: ${unitsText(l.lot, units)} vendidos com ${pct(FIRE_SALE_DISCOUNT, 0)} de desconto.` });
      }
      if (pending) {
        settle(t, notices);
        const lotsSnap = snapAll(t, sold);
        months.push({ month: t, lots: lotsSnap, value: lotsSnap.reduce((s, x) => s + x.value, 0), events, notices });
        end = t;
        break;
      }
    }

    /* 8. liquidação */
    settle(t, notices);

    const lotsSnap = snapAll(t, sold);
    months.push({ month: t, lots: lotsSnap, value: lotsSnap.reduce((s, x) => s + x.value, 0), events, notices });
    end = t;
    if (t >= WINDOW && active().every((l) => l.settledAt !== undefined)) break;
  }

  const complete = !pending && active().every((l) => l.settledAt !== undefined);
  const run: SimRun = { seed, allocations, decisions, options, months, pending, complete, end, invested };
  if (complete) {
    const finals: LotFinal[] = active().map((l) => {
      const v = lotValue(l, reserve);
      const gross = (grossPerEur(l) - 1) * l.amount;
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
        gross,
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
    run.final = { value, result: invested > 0 ? value / invested - 1 : 0, lots: finals, maxDrawdown: maxDrawdown(months, invested) };
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
  ceiling: 0.1,
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
