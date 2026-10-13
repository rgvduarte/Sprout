import { SIM_EVENTS, SIM_LOTS, SIM_RULES } from '../../data';
import type { SimEvent, SimLot, WorldId } from '../../data/types';
import { addMonths } from '../../lib/clock';
import { eurToKg, eurToPaletes, eurToSacas, kgToBottles, MONTHS_SHORT, num, PALETE, SACA_KG, tidyDeep } from '../../lib/format';

/* =====================================================================
   Baralho do simulador: os lotes de cenário (SIM_LOTS), os acontecimentos
   partilhados (SIM_EVENTS) e dois acontecimentos próprios da água que o
   baralho partilhado não tem (subida do PET, verão quente).
   Tudo fictício. O calendário segue a campanha 2026/27: mês 1 = nov. 2026.
   ===================================================================== */

/** Primeiro mês da campanha simulada (mês 1). O mês 0 é o financiamento. */
export const SIM_START = '2026-11-01';
export const WINDOW = SIM_RULES.months; // 18
export const MAX_MONTH = SIM_RULES.months + SIM_RULES.extension.maxMonths; // 24

/** Acontecimentos que só existem neste simulador (água). */
const LOCAL_EVENTS: SimEvent[] = tidyDeep([
  {
    id: 'pet',
    title: 'Subida do PET',
    description: 'A resina PET sobe 18 % na Europa. Parte das paletes do lote ainda está por engarrafar e as pré-formas ficam mais caras.',
    worlds: ['agua'],
    probPerMonth: 0.03,
    months: [1, 6],
    effect: { extraCost: 0.009 },
    hedgeMitigates: false,
    tone: 'adverso',
  },
  {
    id: 'verao-quente',
    title: 'Verão quente',
    description: 'Uma vaga de calor longa faz disparar a procura de água engarrafada. A distribuição antecipa encomendas para não ficar sem stock.',
    worlds: ['agua'],
    probPerMonth: 0.05,
    months: [7, 10],
    effect: { demand: { monthsFaster: 2, premium: 0.02 } },
    hedgeMitigates: false,
    tone: 'favoravel',
  },
] satisfies SimEvent[]);

export const DECK_EVENTS: SimEvent[] = [...SIM_EVENTS, ...LOCAL_EVENTS];

/**
 * Âmbito de cada acontecimento: "mundo" atinge todos os lotes desse mercado
 * ao mesmo tempo (um choque de preço não escolhe lotes); "lote" atinge um só.
 */
export const EVENT_SCOPE: Record<string, 'mundo' | 'lote'> = {
  'choque-preco': 'mundo',
  'choque-kc': 'mundo',
  'colheita-fraca': 'mundo',
  'verao-chuvoso': 'mundo',
  frete: 'mundo',
  recuperacao: 'mundo',
  pet: 'mundo',
  'verao-quente': 'mundo',
  'atraso-vendas': 'lote',
  'quebra-qualidade': 'lote',
  'comprador-falha': 'lote',
  'procura-forte': 'lote',
};

/** Pares que não acontecem no mesmo verão. */
export const EXCLUSIVE: Record<string, string> = { 'verao-chuvoso': 'verao-quente', 'verao-quente': 'verao-chuvoso' };

export const getDeckEvent = (id: string) => DECK_EVENTS.find((e) => e.id === id);

/* ------------------------------------------------------------ lotes de cenário */

export const SCENARIO_LOTS: SimLot[] = SIM_LOTS;
export const getSimLot = (id: string) => SCENARIO_LOTS.find((l) => l.id === id);

/** Nome curto para listas apertadas. */
export const SHORT_NAME: Record<string, string> = {
  'sim-az-a': 'Azeite · Trás-os-Montes',
  'sim-az-b': 'Azeite · Alentejo',
  'sim-ag-a': 'Água mineral 1,5 L',
  'sim-ag-b': 'Água de nascente 1,5 L',
  'sim-cf-a': 'Café · Brasil',
};
export const shortName = (id: string) => SHORT_NAME[id] ?? getSimLot(id)?.nome ?? id;

/** Margem bruta do lote (antes da partilha 65/35), a partir da margem dos co-financiadores. */
export const grossMarginOf = (lot: SimLot, investorShare: number) => lot.expectedMargin / investorShare;

/** Preço de venda base ao comprador (€/kg ou €/L). */
export const buyerPriceOf = (lot: SimLot, investorShare: number) => lot.fundingPrice * (1 + grossMarginOf(lot, investorShare));

/* ------------------------------------------------------------ calendário */

/** 'YYYY-MM-DD' do primeiro dia do mês m da campanha (m = 0 é out. 2026). */
export const monthDate = (m: number) => addMonths(SIM_START, m - 1);

/** "mai. 2027" */
export function monthLabel(m: number): string {
  const [y, mm] = monthDate(m).split('-').map(Number);
  return `${MONTHS_SHORT[mm - 1]}. ${y}`;
}

/** "mai." */
export function monthShort(m: number): string {
  const mm = Number(monthDate(m).split('-')[1]);
  return MONTHS_SHORT[mm - 1];
}

/** Mês civil 1–12 do mês m da campanha. */
export const calendarMonth = (m: number) => Number(monthDate(m).split('-')[1]);
export const calendarYear = (m: number) => Number(monthDate(m).split('-')[0]);

/** Nota da estação para o mês civil (azeite e água, Portugal). */
export const SEASON_NOTE: Record<number, string> = tidyDeep({
  1: 'Últimas moendas da campanha. O azeite novo repousa e decanta nos depósitos.',
  2: 'Começa a época de vendas do azeite novo. A água ainda está em engarrafamento para stock.',
  3: 'Os compradores fecham contratos de primavera. As linhas de água enchem o armazém.',
  4: 'Engarrafamento de água para o verão. O azeite vende-se a ritmo constante.',
  5: 'A procura de água começa a subir com o calor.',
  6: 'Época alta da água: a HoReCa escoa paletes todas as semanas.',
  7: 'Pico de procura de água. O azeite vende-se mais devagar no verão.',
  8: 'Calor e férias: a distribuição repõe stock de água.',
  9: 'Fim da época alta. Saem as primeiras previsões da próxima colheita de azeite.',
  10: 'Começa a colheita da azeitona. Os lagares voltam a moer.',
  11: 'Colheita e moenda nos lagares. Os depósitos enchem.',
  12: 'Fim da colheita no Norte. Primeiras análises do azeite novo.',
});

/** Fase do mundo num mês civil: forte (colheita/engarrafamento) ou leve. */
export function phaseOf(world: WorldId, calMonth: number): { label: string; strong: boolean } {
  if (world === 'azeite') return calMonth >= 10 || calMonth <= 1 ? { label: 'Colheita e extração', strong: true } : { label: 'Armazenagem e vendas', strong: false };
  if (world === 'agua') return calMonth >= 5 && calMonth <= 9 ? { label: 'Época alta de procura', strong: true } : { label: 'Engarrafamento para stock', strong: false };
  return calMonth >= 5 && calMonth <= 9 ? { label: 'Colheita e secagem (Brasil)', strong: true } : { label: 'Floração e enchimento do grão', strong: false };
}

/* ------------------------------------------------------------ físico */

export interface SimPhysical {
  /** unidades do lote (kg, paletes, sacas) */
  units: number;
  unitLabel: string;
  primary: string;
  secondary: string;
}

/** Traduz um montante fictício em mercadoria do lote de cenário. */
export function simPhysical(lot: SimLot, amount: number): SimPhysical {
  if (lot.world === 'azeite') {
    const kgv = eurToKg(amount, lot.fundingPrice);
    return { units: kgv, unitLabel: 'kg', primary: `${num(kgv)} kg`, secondary: `≈ ${num(kgToBottles(kgv))} garrafas de 0,75 L` };
  }
  if (lot.world === 'agua') {
    const paletes = eurToPaletes(amount, lot.fundingPrice);
    return { units: paletes, unitLabel: 'paletes', primary: `${num(paletes, 1)} paletes`, secondary: `≈ ${num(Math.floor(paletes * PALETE.garrafas))} garrafas de 1,5 L` };
  }
  const sacas = eurToSacas(amount, lot.fundingPrice);
  return { units: sacas, unitLabel: 'sacas', primary: `${num(sacas, 1)} sacas`, secondary: `≈ ${num(sacas * SACA_KG)} kg de café verde` };
}

/** Quantidade física em texto curto, na unidade do lote. */
export function unitsText(lot: SimLot, units: number): string {
  if (lot.world === 'azeite') return `${num(units)} kg`;
  if (lot.world === 'agua') return `${num(units, 1)} paletes`;
  return `${num(units, 1)} sacas`;
}

/** Montante → unidades do lote. */
export function amountToUnits(lot: SimLot, amount: number): number {
  return simPhysical(lot, amount).units;
}
