import { getProducer, RECONCILIATION, TRANSACTIONS, fundedFraction, type Lot } from '../../data';
import { TODAY_DATE } from '../../lib/clock';
import { eur, pct } from '../../lib/format';
import { evaluateLot, scenario } from './metrics';
import type { Approver, BastidoresState } from './store';

/* =====================================================================
   Tesouraria: pagamentos programados, aprovações e saldos.
   Política: pagamentos acima de 50 000 € precisam de duas aprovações
   de funções diferentes. Sem numerário: só SEPA via PSP.
   ===================================================================== */

export const DOUBLE_APPROVAL_LIMIT = 50_000;
export const PSP_NAME = 'PSP parceiro (IME licenciada UE)';

/** Soma n dias úteis (seg.–sex.) a uma data 'YYYY-MM-DD'. */
export function addBusinessDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}

export interface Payout {
  id: string;
  kind: 'liquidacao' | 'produtor';
  lotId: string;
  lot: Lot;
  counterparty: string;
  amount: number;
  due?: string;
  condition: string;
  ready: boolean;
  notReadyReason?: string;
}

const BASE = scenario('base', false);

/** Pagamentos programados, derivados dos lotes (incluindo os compromissos da sessão). */
export function payouts(lots: Lot[]): Payout[] {
  const out: Payout[] = [];
  for (const lot of lots) {
    if (lot.world === 'cafe' || lot.economics.model !== 'principal') continue;
    const settle = lot.milestones.find((m) => m.stage === 'liquidado');
    if (lot.status === 'financiado' && lot.stage === 'expedido' && settle?.planned) {
      const r = evaluateLot(lot, BASE).result;
      const result = Math.min(lot.economics.expectedRange[1], r);
      const receipt = TRANSACTIONS.find((t) => t.lotId === lot.id && t.type === 'recebimento-comprador' && t.status === 'pendente');
      out.push({
        id: `liq-${lot.id}`,
        kind: 'liquidacao',
        lotId: lot.id,
        lot,
        counterparty: `${lot.funding.coFinancers} cofinanciadores`,
        amount: Math.round(lot.funding.goal * (1 + result)),
        due: settle.planned,
        condition: receipt ? `Executa depois da receção de ${eur(receipt.amount)} (${receipt.counterparty}).` : 'Executa depois da última receção do comprador.',
        ready: true,
      });
    }
    if (lot.status === 'aberto' || (lot.status === 'financiado' && lot.funding.closedAt === TODAY_DATE)) {
      const producer = getProducer(lot.producerId);
      const closed = lot.status === 'financiado';
      out.push({
        id: `prod-${lot.id}`,
        kind: 'produtor',
        lotId: lot.id,
        lot,
        counterparty: producer?.nome ?? lot.producerId,
        amount: Math.round(lot.economics.acquisitionPrice * lot.quantityBase),
        due: closed ? addBusinessDays(TODAY_DATE, 2) : undefined,
        condition: 'Pagamento ao produtor em D+2 úteis depois do fecho do financiamento.',
        ready: closed,
        notReadyReason: closed ? undefined : `Só depois do fecho do financiamento: o lote está a ${pct(fundedFraction(lot), 0)}.`,
      });
    }
  }
  return out.sort((a, b) => Number(b.ready) - Number(a.ready) || (a.due ?? '9999').localeCompare(b.due ?? '9999'));
}

export const approvalsNeeded = (p: Payout) => (p.amount > DOUBLE_APPROVAL_LIMIT ? 2 : 1);
export const approvalsOf = (p: Payout, st: BastidoresState) => st.approvals.filter((a) => a.payoutId === p.id);

export type PayoutStatusId = 'aguarda-fecho' | 'por-aprovar' | 'falta-segunda' | 'aprovado';

export function payoutStatus(p: Payout, st: BastidoresState): { id: PayoutStatusId; label: string; tone: 'neutral' | 'warn' | 'info' | 'ok' } {
  if (!p.ready) return { id: 'aguarda-fecho', label: 'Aguarda fecho', tone: 'neutral' };
  const n = approvalsOf(p, st).length;
  const need = approvalsNeeded(p);
  if (n >= need) return { id: 'aprovado', label: 'Aprovado', tone: 'ok' };
  if (n === 1) return { id: 'falta-segunda', label: 'Falta 2.ª aprovação', tone: 'warn' };
  return { id: 'por-aprovar', label: 'Por aprovar', tone: 'info' };
}

/** Verifica se uma função pode aprovar (não pode aprovar duas vezes o mesmo pagamento). */
export function canApprove(p: Payout, st: BastidoresState, by: Approver): { ok: boolean; reason?: string } {
  if (!p.ready) return { ok: false, reason: p.notReadyReason };
  const list = approvalsOf(p, st);
  if (list.length >= approvalsNeeded(p)) return { ok: false, reason: 'Já tem as aprovações necessárias.' };
  if (list.some((a) => a.by === by)) return { ok: false, reason: `${by} já aprovou. A segunda aprovação tem de vir de outra função.` };
  return { ok: true };
}

/* ------------------------------------------------------------ saldos */

export const todayEntries = TRANSACTIONS.filter((t) => t.date === TODAY_DATE && t.status === 'liquidada');
export const pendingReceipts = TRANSACTIONS.filter((t) => t.status === 'pendente');
export const lastClose = RECONCILIATION[0];

/** Saldo da conta de clientes no PSP agora: fecho de ontem + movimentos liquidados hoje. */
export const clientBalanceNow = lastClose.pspBalance + todayEntries.reduce((s, t) => s + t.amount, 0);

/** Conta operacional da Sprout (fictício): só recebe a parte da Sprout depois de cada liquidação. */
export const OPERATING = {
  balance: 41_860,
  note: 'Recebe só a parte da Sprout na margem de cada lote liquidado. Paga custos próprios: comissões do PSP, seguros e equipa.',
};
