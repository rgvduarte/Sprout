import { createRng } from '../lib/prng';
import type { MarketPoint, MarketReference, MarketSeries, WorldId } from './types';

/* =====================================================================
   Séries de referência de mercado: índices ilustrativos, calibrados em
   pontos públicos (docs/research/00-base-factual.md §1.2–1.4, §2, §3) e
   interpolados mês a mês. Não são cotações.
   24 meses (nov. 2024 – out. 2026) + 60 dias até 13/10/2026.

   Azeite: a série é o ÍNDICE DE ORIGEM A GRANEL (média de 2 semanas
   SIMA Alentejo + Poolred AOVE, como no contrato proposto). As referências
   a que os compradores pagam são preços EMBALADOS e ficam à parte
   (OLIVE_REFERENCES): a HoReCa embalada e o preço de saída do embalador.
   Não se comparam com o granel.
   ===================================================================== */

const MONTHS = Array.from({ length: 24 }, (_, i) => {
  const total = 2024 * 12 + 10 + i; // nov. 2024 = mês índice 10
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
});

/**
 * Índice de origem AOVE a granel, €/kg. Pontos públicos usados: COI Jaén fev. 2025 (4,075),
 * Poolred início nov. 2025 (4,62), SIMA sem. 15/2026 (4,43), COI Jaén jun. 2026 (3,785),
 * SIMA jul. 2026 (3,95), out. 2026 3,40–3,80 (o modelo do business plan usa 3,50).
 * O máximo histórico (8,99 €/kg, jan. 2024) fica antes da janela.
 */
const OLIVE = [4.45, 4.3, 4.15, 4.08, 3.85, 3.55, 3.5, 3.6, 3.8, 4.05, 4.3, 4.5, 4.62, 4.6, 4.55, 4.5, 4.45, 4.43, 4.2, 3.9, 3.95, 3.8, 3.55, 3.5];
/** Referência B2B da água engarrafada 1,5 L, €/L sem IVA nem depósito SDR (hipótese do modelo: 0,40 €/L, não verificada). */
const WATER = [0.404, 0.403, 0.402, 0.401, 0.401, 0.401, 0.402, 0.404, 0.406, 0.407, 0.405, 0.403, 0.401, 0.4, 0.399, 0.399, 0.399, 0.4, 0.402, 0.404, 0.405, 0.404, 0.401, 0.4];
/** Café verde arábica entregue na UE, €/kg: ICE KC (≈ 4,41 USD/lb em fev. 2025, 2,85 em out. 2026) convertido a 1,15 USD/EUR, mais o diferencial de origem. */
const COFFEE = [7.4, 8.1, 8.9, 10.0, 9.4, 9.0, 8.7, 7.9, 7.6, 8.2, 8.6, 8.7, 8.8, 8.3, 8.0, 7.7, 7.5, 7.3, 7.2, 7.1, 7.15, 7.25, 7.1, 7.0];

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
  // o último ponto é exatamente o índice de hoje
  out[out.length - 1] = { t: '2026-10-13', value: endValue };
  return out;
}

const monthly = (values: number[]): MarketPoint[] => values.map((value, i) => ({ t: MONTHS[i], value }));
const r2 = (x: number) => Math.round(x * 100) / 100;

/** Índice de origem a granel de hoje (13/10/2026), €/kg. É o valor que o modelo do business plan usa. */
export const OLIVE_INDEX_TODAY = OLIVE[OLIVE.length - 1];

/**
 * Referências do azeite, hoje. O índice é granel; as outras duas são preços de produto embalado,
 * a que se mede o preço ao comprador. Fonte: business plan, cenário Recomendado
 * (docs/business-plan/modelo/pressupostos.json, commodities.azeite.canais).
 */
export const OLIVE_REFERENCES = {
  index: {
    label: 'Índice de origem AOVE a granel',
    today: OLIVE_INDEX_TODAY,
    note: 'Média de 2 semanas SIMA Alentejo e Poolred AOVE; a out. 2026 entre 3,40 e 3,80 €/kg (o modelo usa 3,50). É o preço a que o lagar vende a granel e a base do preço de compra.',
  },
  horeca: {
    label: 'Referência HoReCa embalada',
    today: 6.0,
    note: 'AOVE de origem identificada, 5 L, sem IVA, medido contra marca portuguesa e cash & carry do produto equivalente. Valor do cenário Recomendado, por verificar: o piloto só a aceita com ≥ 20 cotações e mediana ≥ 6,00 €/kg.',
    status: 'a validar no piloto',
  },
  packerExit: {
    label: 'Preço de saída do embalador',
    today: 4.35,
    range: [4.16, 4.51] as [number, number],
    note: 'Granel (3,50) + embalamento (0,47–0,51) + margem líquida do embalador (0,19–0,50) = 4,16–4,51 €/kg. É o preço de referência de distribuidores e exportadores.',
  },
};

/** Diferença fixa entre cada referência embalada e o índice, hoje (passagem integral da variação do granel). */
const OLIVE_SPREAD = { horeca: OLIVE_REFERENCES.horeca.today - OLIVE_INDEX_TODAY, embalador: OLIVE_REFERENCES.packerExit.today - OLIVE_INDEX_TODAY };

const OLIVE_PACKAGED: MarketReference[] = [
  {
    id: 'horeca',
    label: OLIVE_REFERENCES.horeca.label,
    note: 'Derivada do índice: a diferença de hoje (2,50 €/kg) mantém-se constante. Por validar no piloto.',
    today: OLIVE_REFERENCES.horeca.today,
    monthly: OLIVE.map((v, i) => ({ t: MONTHS[i], value: r2(v + OLIVE_SPREAD.horeca) })),
  },
  {
    id: 'embalador',
    label: OLIVE_REFERENCES.packerExit.label,
    note: 'Derivada do índice: granel + embalamento + margem do embalador, com a diferença de hoje (0,85 €/kg) constante.',
    today: OLIVE_REFERENCES.packerExit.today,
    monthly: OLIVE.map((v, i) => ({ t: MONTHS[i], value: r2(v + OLIVE_SPREAD.embalador) })),
  },
];

export const MARKET: MarketSeries[] = [
  {
    world: 'azeite',
    label: OLIVE_REFERENCES.index.label,
    unit: '€/kg',
    note: 'Índice ilustrativo: liga pontos públicos (COI, Poolred, SIMA) com interpolação mensal. É granel na origem; o preço ao comprador mede-se contra referências embaladas. Não é uma cotação.',
    monthly: monthly(OLIVE),
    daily: daily('azeite', OLIVE, 2, 0.004),
    references: OLIVE_PACKAGED,
  },
  {
    world: 'agua',
    label: 'Referência B2B água engarrafada 1,5 L',
    unit: '€/L',
    note: 'Preço de referência a HoReCa e distribuição, sem IVA nem depósito SDR. Hipótese do modelo (0,40 €/L), não verificada: o preço HoReCa por litro ainda não tem fonte. Dados fictícios.',
    monthly: monthly(WATER),
    daily: daily('agua', WATER, 3, 0.0012),
  },
  {
    world: 'cafe',
    label: 'Café verde arábica entregue na UE',
    unit: '€/kg',
    note: 'Índice ilustrativo: ICE KC convertido em €/kg a 1,15 USD/EUR, mais o diferencial de origem. É o preço de compra do verde em EUR a um importador; não é uma cotação.',
    monthly: monthly(COFFEE),
    daily: daily('cafe', COFFEE, 2, 0.006),
  },
];

/** Referência de mercado de hoje (13/10/2026) por mundo. No azeite é o índice de origem a granel. */
export const MARKET_TODAY: Record<WorldId, number> = {
  azeite: OLIVE_INDEX_TODAY,
  agua: WATER[WATER.length - 1],
  cafe: COFFEE[COFFEE.length - 1],
};

/** Nome curto da referência de mercado de cada mundo (o que MARKET_TODAY mede). */
export const MARKET_LABEL: Record<WorldId, string> = {
  azeite: 'Índice de origem a granel',
  agua: 'Referência B2B da água',
  cafe: 'Verde arábica entregue na UE',
};

/** Valor mensal da série de um mundo num mês 'YYYY-MM' (o mais próximo dentro da janela). */
export function marketAt(world: WorldId, ym: string): number {
  const values = world === 'azeite' ? OLIVE : world === 'agua' ? WATER : COFFEE;
  const i = MONTHS.indexOf(ym.slice(0, 7));
  if (i >= 0) return values[i];
  return ym.slice(0, 7) < MONTHS[0] ? values[0] : values[values.length - 1];
}
