import { addMonths } from '../../lib/clock';
import { getLot, getProducer, INVESTOR_SHARE, OLIVE_CHAIN_FACTS, PRODUCER_PRICE_TODAY, RECONCILIATION, RESERVE_SHARE, SIM_RULES } from '../../data';

/* =====================================================================
   Números da apresentação, derivados dos dados de demonstração para que
   batam certo com o resto da app. O preço que o lagar recebe hoje na cadeia
   habitual é uma hipótese de trabalho (PRODUCER_PRICE_TODAY, partilhada com
   Mercados e a Jornada do lote), assinalada onde aparece. O bloco entre esse
   preço e a referência é o diferencial granel → comprador, não a margem do
   embalador: a margem líquida do embalador é só uma parte (valor verificado).
   ===================================================================== */

const r2 = (x: number) => Math.round(x * 100) / 100;

/** O lote que a apresentação segue de perto. */
export const FOCUS_LOT_ID = 'AZ-2026-021';
export const FOCUS_PRODUCER_ID = 'lagar-ribeira-alta';

const lot = getLot(FOCUS_LOT_ID)!;
const producer = getProducer(FOCUS_PRODUCER_ID)!;
const eco = lot.economics;

/** Hipótese de trabalho: €/kg que o lagar recebe hoje quando vende a granel (dados partilhados). */
const PRODUCER_TODAY = PRODUCER_PRICE_TODAY.azeite;

export const CHAIN = (() => {
  const ref = eco.refPrice; // 4,48
  const buyer = eco.buyerPrice; // 3,94
  const discount = r2(ref - buyer); // 0,54
  const premium = r2(eco.acquisitionPrice - PRODUCER_TODAY); // 0,12
  const costs = eco.costsPerUnit; // 0,21
  const spread = eco.grossMargin; // 0,41
  const differential = r2(ref - PRODUCER_TODAY); // 1,28: embalamento, logística e margens de intermediação
  const redistributed = r2(premium + discount + spread); // 1,07
  const investors = r2(spread * INVESTOR_SHARE);
  const reserve = r2(spread * RESERVE_SHARE);
  return {
    ref,
    buyer,
    discount,
    discountPct: eco.discountPct,
    premium,
    costs,
    spread,
    differential,
    /** margem líquida do embalador verificada (parte do diferencial), €/kg */
    packagerMargin: OLIVE_CHAIN_FACTS.packagerNetMargin,
    /** custo de embalamento verificado (parte do diferencial), €/kg */
    packing: OLIVE_CHAIN_FACTS.packingCost,
    redistributed,
    producerToday: PRODUCER_TODAY,
    producerSprout: eco.acquisitionPrice,
    /** fração do diferencial que passa para comprador, produtor e ciclo (o resto paga os custos do lote) */
    capturedShare: redistributed / differential,
    spreadSplit: { investors, reserve, ops: r2(spread - investors - reserve) },
    shares: { investors: INVESTOR_SHARE, reserve: RESERVE_SHARE, ops: r2(1 - INVESTOR_SHARE - RESERVE_SHARE) },
    lotKg: lot.quantityBase,
  };
})();

/** Janela de 18 meses do lote em foco: termina na liquidação prevista. */
export const CYCLE = (() => {
  const end = lot.settlement.plannedEnd!;
  const start = addMonths(end, -lot.settlement.windowMonths);
  return {
    start,
    end,
    months: lot.settlement.windowMonths,
    extensionMonths: lot.extension.maxMonths,
    extendedEnd: addMonths(end, lot.extension.maxMonths),
    forwardNote: lot.hedge.note,
    refundingCostPct: SIM_RULES.refunding.costPct,
  };
})();

export const LAGAR = { nome: producer.nome, localidade: producer.localidade, variedades: lot.title.replace('Virgem extra ', '') };

/** Reconciliação diária dos últimos 30 dias (Bastidores). */
export const RECON = {
  days: RECONCILIATION.length,
  resolved: RECONCILIATION.filter((r) => r.status === 'diferenca-resolvida').length,
  open: RECONCILIATION.filter((r) => r.status === 'em-aberto').length,
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
