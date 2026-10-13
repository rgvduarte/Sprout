import { hashString } from '../../lib/prng';
import { managementScore, simulateFull, type Allocation, type Decisions, type ScoreBreakdown } from './engine';

/* =====================================================================
   Liga de campanha 2026/27: coorte fictícia de gestores com pseudónimo,
   a jogar com dinheiro fictício. Ordena pela Pontuação de gestão, nunca
   pelo resultado. Os números saem do mesmo motor que o jogador usa.
   ===================================================================== */

export interface CohortManager {
  id: string;
  pseudonym: string;
  /** estilo, em palavras simples (mostrado na liga) */
  style: string;
  seed: number;
  allocations: Allocation[];
  decisions?: Decisions;
  debriefRead: boolean;
}

const A = (simLotId: string, amount: number, hedged = false): Allocation => ({ simLotId, amount, hedged });
const seedOf = (name: string) => 1000 + (hashString(`liga-2026-27:${name}`) % 9000);

const COHORT_DEF: Omit<CohortManager, 'id' | 'seed'>[] & { seed?: number }[] = [
  { pseudonym: 'Moenda Lenta', style: 'Quatro lotes, azeite com cobertura', allocations: [A('sim-az-a', 12500, true), A('sim-az-b', 12500, true), A('sim-ag-a', 12500), A('sim-ag-b', 12500)], debriefRead: true },
  { pseudonym: 'Galega Velha', style: 'Azeite coberto e duas águas', allocations: [A('sim-az-a', 20000, true), A('sim-ag-a', 15000), A('sim-ag-b', 15000)], debriefRead: true },
  { pseudonym: 'Vento Suão', style: 'Tudo em preço volátil, sem cobertura', allocations: [A('sim-az-b', 25000), A('sim-cf-a', 25000)], debriefRead: false },
  { pseudonym: 'Cobrançosa', style: 'Só azeite, sem cobertura', allocations: [A('sim-az-a', 25000), A('sim-az-b', 25000)], decisions: { 'sim-az-a:refunding': 'recusar', 'sim-az-b:refunding': 'recusar' }, debriefRead: false },
  { pseudonym: 'Nascente Alta', style: 'Só água', allocations: [A('sim-ag-a', 25000), A('sim-ag-b', 25000)], debriefRead: true },
  { pseudonym: 'Tulha Zero', style: 'Só azeite, com cobertura', allocations: [A('sim-az-a', 25000, true), A('sim-az-b', 25000, true)], debriefRead: true },
  { pseudonym: 'Terreiro', style: 'Três mundos, tudo coberto', allocations: [A('sim-cf-a', 20000, true), A('sim-ag-a', 15000), A('sim-az-a', 15000, true)], debriefRead: true },
  { pseudonym: 'Verdeal', style: 'Azeite sem cobertura e um pouco de água', allocations: [A('sim-az-b', 25000), A('sim-ag-a', 10000)], debriefRead: false },
  { pseudonym: 'Pergaminho', style: 'Café sem cobertura e água', allocations: [A('sim-cf-a', 25000), A('sim-ag-b', 25000)], debriefRead: true },
  { pseudonym: 'Depósito 4', style: 'Quatro lotes, cobertura parcial', allocations: [A('sim-az-a', 12500, true), A('sim-az-b', 12500), A('sim-ag-a', 12500), A('sim-ag-b', 12500)], debriefRead: true },
  { pseudonym: 'Serra Fria', style: 'Água com um lote de azeite coberto', allocations: [A('sim-ag-b', 25000), A('sim-az-a', 10000, true)], debriefRead: true },
  { pseudonym: 'Madural', style: 'Azeite sem cobertura e água', allocations: [A('sim-az-a', 25000), A('sim-ag-a', 25000)], debriefRead: true },
  { pseudonym: 'Palete Cheia', style: 'Quase só água', allocations: [A('sim-ag-a', 25000), A('sim-ag-b', 20000), A('sim-az-b', 5000, true)], debriefRead: true },
  { pseudonym: 'Cereja Madura', style: 'Café e azeite, ambos cobertos', allocations: [A('sim-cf-a', 25000, true), A('sim-az-b', 25000, true)], debriefRead: true },
  { pseudonym: 'Lagar Frio', style: 'Azeite sem cobertura, café coberto', allocations: [A('sim-az-b', 25000), A('sim-cf-a', 15000, true), A('sim-ag-a', 10000)], debriefRead: true },
  { pseudonym: 'Cordovil', style: 'Três lotes voláteis, todos cobertos', allocations: [A('sim-az-a', 15000, true), A('sim-az-b', 15000, true), A('sim-cf-a', 15000, true)], debriefRead: true },
  { pseudonym: 'Azeitona Negra', style: 'Só azeite, metade coberta', allocations: [A('sim-az-b', 25000), A('sim-az-a', 25000, true)], debriefRead: true },
  { pseudonym: 'Aquífero', style: 'Água, azeite coberto, café a descoberto', allocations: [A('sim-ag-a', 20000), A('sim-az-b', 20000, true), A('sim-cf-a', 10000)], debriefRead: true },
  { pseudonym: 'Saca 60', style: 'Café e azeite, sem cobertura', allocations: [A('sim-cf-a', 25000), A('sim-az-a', 25000)], debriefRead: false },
  { pseudonym: 'Picual 7', style: 'Três mundos, cobertura onde existe', allocations: [A('sim-az-a', 20000, true), A('sim-ag-a', 15000), A('sim-cf-a', 10000, true)], debriefRead: true },
];

/** Sementes fixadas à mão onde a liga precisa de um exemplo claro. */
const SEED_OVERRIDE: Record<string, number> = { 'Vento Suão': 4646 };

export const COHORT: CohortManager[] = COHORT_DEF.map((d, i) => ({
  ...d,
  id: `gestor-${i + 1}`,
  seed: SEED_OVERRIDE[d.pseudonym] ?? seedOf(d.pseudonym),
}));

export interface LeagueEntry {
  id: string;
  pseudonym: string;
  style: string;
  seed: number;
  you: boolean;
  invested: number;
  result: number;
  drawdown: number;
  score: ScoreBreakdown;
  runs?: number;
}

let cache: LeagueEntry[] | null = null;

/** Entradas da coorte (calculadas uma vez). */
export function cohortEntries(): LeagueEntry[] {
  if (cache) return cache;
  cache = COHORT.map((m) => {
    const run = simulateFull(m.seed, m.allocations, m.decisions ?? {});
    const f = run.final!;
    return {
      id: m.id,
      pseudonym: m.pseudonym,
      style: m.style,
      seed: m.seed,
      you: false,
      invested: run.invested,
      result: f.result,
      drawdown: f.maxDrawdown,
      score: managementScore({ allocations: m.allocations, result: f.result, drawdown: f.maxDrawdown, debriefRead: m.debriefRead }),
    };
  });
  return cache;
}

/** Ordena pela pontuação; empate desfeito pela menor queda máxima. */
export function rankEntries(entries: LeagueEntry[]): LeagueEntry[] {
  return [...entries].sort((a, b) => b.score.total - a.score.total || a.drawdown - b.drawdown || a.pseudonym.localeCompare(b.pseudonym, 'pt-PT'));
}
