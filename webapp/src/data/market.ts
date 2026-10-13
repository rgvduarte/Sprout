import { createRng } from '../lib/prng';
import type { MarketPoint, MarketSeries, WorldId } from './types';

/* =====================================================================
   Séries de referência de mercado: índices ilustrativos e fictícios,
   coerentes com os preços de referência dos lotes. Não são cotações reais.
   24 meses (nov. 2024 – out. 2026) + 60 dias até 13/10/2026.
   ===================================================================== */

const MONTHS = Array.from({ length: 24 }, (_, i) => {
  const total = 2024 * 12 + 10 + i; // nov. 2024 = mês índice 10
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
});

const OLIVE = [7.4, 7.25, 7.1, 6.85, 6.6, 6.3, 6.05, 5.8, 5.55, 5.4, 5.25, 5.15, 5.1, 5.05, 4.95, 4.85, 4.75, 4.68, 4.6, 4.55, 4.5, 4.47, 4.46, 4.48];
const WATER = [0.288, 0.288, 0.29, 0.29, 0.289, 0.287, 0.284, 0.282, 0.281, 0.281, 0.282, 0.283, 0.284, 0.284, 0.283, 0.281, 0.279, 0.277, 0.276, 0.276, 0.277, 0.278, 0.279, 0.28];
const COFFEE = [8.1, 8.45, 8.9, 9.4, 9.15, 8.8, 8.55, 8.3, 8.05, 7.95, 7.85, 7.9, 7.8, 7.7, 7.75, 7.6, 7.5, 7.55, 7.45, 7.4, 7.35, 7.42, 7.38, 7.4];

function daily(world: WorldId, monthly: number[], decimals: number, vol: number): MarketPoint[] {
  const rng = createRng(`market-daily-${world}`);
  const out: MarketPoint[] = [];
  const end = Date.UTC(2026, 9, 13);
  const startValue = monthly[monthly.length - 3];
  const endValue = monthly[monthly.length - 1];
  let noise = 0;
  for (let i = 59; i >= 0; i--) {
    const d = new Date(end - i * 86_400_000);
    const progress = (59 - i) / 59;
    noise = noise * 0.7 + rng.normal() * vol;
    const value = startValue + (endValue - startValue) * progress + noise * endValue;
    const iso = d.toISOString().slice(0, 10);
    out.push({ t: iso, value: Math.round(value * 10 ** decimals) / 10 ** decimals });
  }
  // o último ponto é exatamente a referência de hoje
  out[out.length - 1] = { t: '2026-10-13', value: endValue };
  return out;
}

const monthly = (values: number[]): MarketPoint[] => values.map((value, i) => ({ t: MONTHS[i], value }));

export const MARKET: MarketSeries[] = [
  {
    world: 'azeite',
    label: 'Referência azeite virgem extra a granel',
    unit: '€/kg',
    note: 'Índice ilustrativo do preço pago por compradores B2B em Portugal. Dados fictícios.',
    monthly: monthly(OLIVE),
    daily: daily('azeite', OLIVE, 2, 0.004),
  },
  {
    world: 'agua',
    label: 'Referência água engarrafada 1,5 L à palete',
    unit: '€/L',
    note: 'Índice ilustrativo do preço à palete para distribuição e HoReCa. Dados fictícios.',
    monthly: monthly(WATER),
    daily: daily('agua', WATER, 3, 0.0015),
  },
  {
    world: 'cafe',
    label: 'Referência café verde arábica, entregue na UE',
    unit: '€/kg',
    note: 'Índice ilustrativo construído a partir do diferencial típico sobre o ICE KC. Dados fictícios.',
    monthly: monthly(COFFEE),
    daily: daily('cafe', COFFEE, 2, 0.006),
  },
];

/** Referência de hoje (13/10/2026) por mundo. */
export const MARKET_TODAY: Record<WorldId, number> = {
  azeite: OLIVE[OLIVE.length - 1],
  agua: WATER[WATER.length - 1],
  cafe: COFFEE[COFFEE.length - 1],
};
