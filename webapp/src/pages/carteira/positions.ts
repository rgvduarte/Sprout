import { getRegion, getWorld, marketVsEntry, REFUNDING_PLAYBOOKS, stageIndex, stageLabel } from '../../data';
import type { JourneyStage, Lot, Milestone, Tone, WorldId } from '../../data';
import type { PositionView } from '../../state';
import { addMonths, daysBetween, TODAY_DATE, toDate } from '../../lib/clock';
import { date as fmt, kgToJugs, num, PALETE, pct } from '../../lib/format';
import { physicalForAmount } from '../../lib/physical';

/* =====================================================================
   Derivações de uma posição: estado, próximo marco, janela de 18 meses,
   parte física do lote. Partilhado por Início e Carteira (o mesmo número
   tem de aparecer igual nos dois ecrãs).
   ===================================================================== */

/** Período de reflexão depois de um compromisso (política Sprout, espelha os 4 dias do ECSP). */
export const REFLECTION_DAYS = 4;

/**
 * Limites de atenção para concentração (orientação de proteção, não regra), os
 * mesmos no ritual de compromisso (/lote) e na Carteira: um só lote acima de
 * 25 %, um só produtor acima de 35 %, um só mundo acima de 80 %.
 */
export const CONCENTRATION = { lote: 0.25, produtor: 0.35, mundo: 0.8 } as const;

export interface PositionState {
  label: string;
  tone: Tone;
  /** frase curta com o pormenor (vendido, pagamento, extensão) */
  detail?: string;
}

/** Fração do lote ainda em armazém (0–1). */
export const stockFraction = (lot: Lot) => (lot.quantity > 0 ? Math.max(0, Math.min(1, lot.stock / lot.quantity)) : 0);

/** Fração do lote já vendida, a partir do stock em armazém. */
export function soldFraction(lot: Lot): number {
  if (stageIndex(lot.stage) < stageIndex('em-venda')) return 0;
  return 1 - stockFraction(lot);
}

export const unitWord = (lot: Lot, n: number) => (lot.unit === 'kg' ? 'kg' : lot.unit === 'palete' ? (n === 1 ? 'palete' : 'paletes') : n === 1 ? 'saca' : 'sacas');

/** "11 600 de 20 000 kg" */
export function stockLabel(lot: Lot): string {
  return `${num(lot.stock)} de ${num(lot.quantity)} ${unitWord(lot, lot.quantity)}`;
}

/** Estado da posição para o investidor (nunca P&L). */
export function positionState(p: PositionView): PositionState {
  const lot = p.lot;
  if (p.status === 'liquidado' || lot.status === 'liquidado') return { label: 'Liquidado', tone: 'ok' };
  if (p.status === 'aguarda-transferencia') return { label: 'Aguarda transferência', tone: 'info', detail: 'Compromisso registado; a posição conta quando a transferência SEPA chegar à conta segregada.' };
  if (lot.status === 'aberto') return { label: 'Financiamento em curso', tone: 'accent' };
  if (lot.status === 'em-extensao') {
    return { label: 'Em extensão', tone: 'warn', detail: lot.settlement.extendedTo ? `Janela estendida até ${fmt(lot.settlement.extendedTo)}.` : undefined };
  }
  const sold = soldFraction(lot);
  if (lot.stage === 'expedido') {
    const pay = lot.milestones.find((m) => m.stage === 'liquidado');
    return { label: 'Expedido · aguarda pagamento', tone: 'info', detail: pay?.planned ? `Pagamento do comprador previsto até ${fmt(pay.planned)}.` : undefined };
  }
  if (lot.stage === 'em-venda') {
    const since = lot.milestones.find((m) => m.stage === 'em-venda')?.date;
    const soldUnits = lot.quantity - lot.stock;
    return { label: `Em venda · ${pct(sold, 0)} vendido`, tone: 'accent', detail: `${num(soldUnits)} ${unitWord(lot, soldUnits)} vendidos${since ? ` desde ${fmt(since)}` : ''}; o resto continua em armazém.` };
  }
  return { label: stageLabel(lot.world, lot.stage), tone: 'neutral' };
}

/** Primeiro marco por cumprir. */
export function nextMilestone(lot: Pick<Lot, 'milestones'>): Milestone | undefined {
  return lot.milestones.find((m) => !m.done);
}

/** Etapa atual (último marco cumprido). */
export function currentStage(lot: Pick<Lot, 'milestones'>): JourneyStage | undefined {
  const done = lot.milestones.filter((m) => m.done);
  return done[done.length - 1]?.stage;
}

/** Data da liquidação prevista: o marco "liquidado" (cumprido ou previsto), senão o fim da janela. */
export function plannedSettlement(lot: Lot): string | undefined {
  const m = lot.milestones.find((x) => x.stage === 'liquidado');
  return m?.date ?? m?.planned ?? lot.settlement.extendedTo ?? lot.settlement.plannedEnd;
}

export interface WindowInfo {
  start: string;
  end: string;
  extEnd?: string;
  /** a janela ainda não começou (o financiamento não fechou) */
  projected: boolean;
}

/** Janela de 18 meses do lote (projetada a partir do fim previsto se ainda não começou). */
export function windowOf(lot: Lot): WindowInfo {
  const months = lot.settlement.windowMonths;
  if (lot.settlement.start) {
    return { start: lot.settlement.start, end: lot.settlement.plannedEnd ?? addMonths(lot.settlement.start, months), extEnd: lot.settlement.extendedTo, projected: false };
  }
  if (lot.settlement.plannedEnd) return { start: addMonths(lot.settlement.plannedEnd, -months), end: lot.settlement.plannedEnd, projected: true };
  return { start: TODAY_DATE, end: addMonths(TODAY_DATE, months), projected: true };
}

/** Mês da janela em que estamos (1–18), ou 0 se ainda não começou. */
export function windowMonth(lot: Lot): number {
  const w = windowOf(lot);
  if (w.projected) return 0;
  const d = daysBetween(w.start, TODAY_DATE);
  return d < 0 ? 0 : Math.min(lot.settlement.windowMonths + 6, Math.floor(d / 30.4375) + 1);
}

export interface PhysicalShare {
  /** "3 750 kg" */
  primary: string;
  /** "≈ 818 garrafões de 5 L" */
  secondary: string;
  shareOfLot: number;
  /** quantidade base (kg ou L) */
  base: number;
  /** unidades do lote (kg, paletes, sacas) */
  units: number;
}

export function physicalShare(p: Pick<PositionView, 'lot' | 'amount'>): PhysicalShare {
  const ph = physicalForAmount(p.lot, p.amount);
  return { primary: ph.primary, secondary: ph.secondary, shareOfLot: ph.shareOfLot, base: ph.base, units: ph.units };
}

/** Pegada física das posições ativas: kg de azeite, paletes de água, sacas de café. */
export function footprint(positions: PositionView[]) {
  const active = positions.filter((p) => p.status !== 'liquidado');
  const by = (w: WorldId) => active.filter((p) => p.lot.world === w);
  const oliveKg = by('azeite').reduce((s, p) => s + physicalForAmount(p.lot, p.amount).base, 0);
  const paletes = by('agua').reduce((s, p) => s + physicalForAmount(p.lot, p.amount).units, 0);
  const sacas = by('cafe').reduce((s, p) => s + physicalForAmount(p.lot, p.amount).units, 0);
  return {
    oliveKg,
    oliveJugs: kgToJugs(oliveKg),
    oliveLots: by('azeite').length,
    paletes,
    waterBottles: Math.floor(paletes * PALETE.garrafas),
    waterLots: by('agua').length,
    sacas,
    coffeeLots: by('cafe').length,
  };
}

/** Variação da referência de mercado desde a entrada no lote (informação, não P&L). */
export function referenceChange(lot: Lot) {
  return marketVsEntry(lot);
}

export function playbookFor(lot: Lot) {
  return REFUNDING_PLAYBOOKS.find((pb) => pb.id === lot.refundingPlaybookId);
}

/** Fim do período de reflexão (só compromissos desta sessão, à espera de transferência). */
export function reflectionUntil(p: Pick<PositionView, 'committedAt' | 'status'>): string | undefined {
  if (p.status !== 'aguarda-transferencia') return undefined;
  const d = toDate(p.committedAt);
  const end = new Date(d.getTime() + REFLECTION_DAYS * 86_400_000);
  return end.toISOString();
}

export function regionName(lot: Lot) {
  return getRegion(lot.regionId)?.nome ?? '';
}

export function worldName(world: WorldId) {
  return getWorld(world).nome;
}

/** Ordena posições pela próxima data relevante (marco seguinte). */
export function byNextDate(a: PositionView, b: PositionView): number {
  const da = nextMilestone(a.lot)?.planned ?? plannedSettlement(a.lot) ?? '9999';
  const db = nextMilestone(b.lot)?.planned ?? plannedSettlement(b.lot) ?? '9999';
  return da.localeCompare(db);
}

/** Casas decimais com que um valor foi registado (para não arredondar boletins). */
export function decimalsOf(...values: number[]): number {
  return Math.min(3, Math.max(0, ...values.map((v) => (String(v).split('.')[1] ?? '').length)));
}
