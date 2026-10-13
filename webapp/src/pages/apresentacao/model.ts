import { addMonths } from '../../lib/clock';
import { getLot, getProducer, INVESTOR_SHARE, OLIVE_CHAIN_FACTS, OLIVE_MODEL, OLIVE_REFERENCES, PRODUCER_PRICE_TODAY, RESERVE_RULE, RESERVE_SHARE, SIM_RULES, SPROUT_SHARE } from '../../data';

/* =====================================================================
   Números da apresentação, derivados dos dados de demonstração para que
   batam certo com o resto da app e com o business plan (cenário
   Recomendado). O lote em foco é de HoReCa: o lagar vende a granel ao
   índice de origem; a Sprout compra-lhe com prémio, manda embalar num
   co-packer e vende 10 % abaixo de uma referência HoReCa embalada (a
   validar no piloto). O bloco entre o granel e a referência embalada não é
   a margem do embalador: paga embalamento, logística e margens.
   A apresentação não cita lotes passados nem indicadores como prova: o
   piloto só começa em 2027.
   ===================================================================== */

const r2 = (x: number) => Math.round(x * 100) / 100;

/** O lote que a apresentação segue de perto. */
export const FOCUS_LOT_ID = 'AZ-2026-021';
export const FOCUS_PRODUCER_ID = 'lagar-ribeira-alta';

const lot = getLot(FOCUS_LOT_ID)!;
const producer = getProducer(FOCUS_PRODUCER_ID)!;
const eco = lot.economics;

/** €/kg que o lagar recebe hoje quando vende a granel: o índice de origem (dados partilhados). */
const PRODUCER_TODAY = PRODUCER_PRICE_TODAY.azeite;

export const CHAIN = (() => {
  const ref = eco.refPrice; // 6,00: referência HoReCa embalada
  const buyer = eco.buyerPrice; // 5,40
  const discount = r2(ref - buyer); // 0,60
  const premium = r2(eco.acquisitionPrice - PRODUCER_TODAY); // 0,15
  const packing = eco.packingCost; // 0,55 no co-packer
  const costs = r2(eco.costsPerUnit - packing); // 0,60: logística, 3PL, custódia, análises, seguros, provisões
  const spread = eco.grossMargin; // 0,60
  const differential = r2(ref - PRODUCER_TODAY); // 2,50: granel → embalado
  const redistributed = r2(premium + discount + spread); // 1,35
  const investors = r2(spread * INVESTOR_SHARE);
  const reserve = r2(spread * RESERVE_SHARE);
  const d = OLIVE_MODEL.distribuicao;
  return {
    ref,
    buyer,
    discount,
    discountPct: eco.discountPct,
    premium,
    packing,
    costs,
    spread,
    differential,
    /** margem líquida do embalador verificada (parte do diferencial), €/kg */
    packagerMargin: OLIVE_CHAIN_FACTS.packagerNetMargin,
    /** custo de embalamento verificado (parte do diferencial), €/kg */
    packingRange: OLIVE_CHAIN_FACTS.packingCost,
    redistributed,
    producerToday: PRODUCER_TODAY,
    producerSprout: eco.acquisitionPrice,
    /** fração do diferencial que passa para comprador, produtor e lote (o resto paga embalamento e custos) */
    capturedShare: redistributed / differential,
    spreadSplit: { investors, reserve, ops: r2(spread - investors - reserve) },
    shares: { investors: INVESTOR_SHARE, reserve: RESERVE_SHARE, ops: SPROUT_SHARE },
    reserveRule: RESERVE_RULE.short,
    lotKg: lot.quantityBase,
    refLabel: OLIVE_REFERENCES.horeca.label,
    /** o outro canal do plano, para a nota: distribuidores e exportadores */
    distributors: { ref: d.refPrice, premium: d.originPremium, buyer: d.buyerPrice, funding: d.fundingPrice, margin: d.margin },
  };
})();

/** Janela de 18 meses do lote em foco e a liquidação esperada dentro dela. */
export const CYCLE = (() => {
  const end = lot.settlement.plannedEnd!;
  const start = addMonths(end, -lot.settlement.windowMonths);
  const expected = lot.milestones.find((m) => m.stage === 'liquidado')?.planned ?? end;
  return {
    start,
    end,
    expected,
    months: lot.settlement.windowMonths,
    extensionMonths: lot.extension.maxMonths,
    extendedEnd: addMonths(end, lot.extension.maxMonths),
    forwardNote: lot.hedge.note,
    refundingCostPct: SIM_RULES.refunding.costPct,
    indexAtOpen: eco.indexAtOpen,
    indexFloor: r2(eco.indexAtOpen * 0.85),
    breakEvenIndexLot: eco.breakEvenIndexLot,
  };
})();

export const LAGAR = { nome: producer.nome, localidade: producer.localidade, variedades: lot.title.replace('Virgem extra ', '') };

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
