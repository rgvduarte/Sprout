import { managementScore, simulateFull, type Allocation, type Decisions, type ScoreBreakdown } from './engine';

/* =====================================================================
   Liga de campanha 2026/27: coorte fictícia de gestores com pseudónimo,
   a jogar com dinheiro fictício. Todos jogam a mesma campanha (a semente
   da época); o jogador entra com a primeira campanha completa que jogar
   com essa semente, sem repetições. Ordena pela Pontuação de gestão,
   nunca pelo resultado. Os números saem do mesmo motor que o jogador usa.
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

/**
 * Semente da época 2026/27: todos os gestores jogam a mesma campanha, com os mesmos
 * acontecimentos. Só a gestão (lotes, montantes, coberturas, decisões) muda o resultado.
 */
export const LEAGUE_SEED = 1307;
export const LEAGUE_SEASON = '2026/27';

const COHORT_DEF: Omit<CohortManager, 'id' | 'seed'>[] = [
  { pseudonym: 'Moenda Lenta', style: 'Quatro lotes, azeite com cobertura', allocations: [A('sim-az-a', 12500, true), A('sim-az-b', 12500, true), A('sim-ag-a', 12500), A('sim-ag-b', 12500)], debriefRead: true },
  { pseudonym: 'Galega Velha', style: 'Azeite HoReCa coberto e duas águas', allocations: [A('sim-az-a', 20000, true), A('sim-ag-a', 15000), A('sim-ag-b', 15000)], debriefRead: true },
  { pseudonym: 'Vento Suão', style: 'Tudo em preço volátil, sem cobertura', allocations: [A('sim-az-a', 25000), A('sim-cf-a', 25000)], debriefRead: false },
  { pseudonym: 'Cobrançosa', style: 'Só azeite, sem cobertura nem refunding', allocations: [A('sim-az-a', 25000), A('sim-az-b', 25000)], decisions: { 'sim-az-a:refunding': 'recusar', 'sim-az-b:refunding': 'recusar' }, debriefRead: false },
  { pseudonym: 'Nascente Alta', style: 'Só água, comprada como principal', allocations: [A('sim-ag-a', 25000), A('sim-ag-b', 25000)], debriefRead: true },
  { pseudonym: 'Tulha Zero', style: 'Só azeite, com cobertura', allocations: [A('sim-az-a', 25000, true), A('sim-az-b', 25000, true)], debriefRead: true },
  { pseudonym: 'Terreiro', style: 'Três mundos, tudo coberto', allocations: [A('sim-cf-a', 20000, true), A('sim-ag-a', 15000), A('sim-az-a', 15000, true)], debriefRead: true },
  { pseudonym: 'Verdeal', style: 'Azeite HoReCa sem cobertura e um pouco de água', allocations: [A('sim-az-a', 25000), A('sim-ag-a', 10000)], debriefRead: false },
  { pseudonym: 'Pergaminho', style: 'Café sem cobertura e água', allocations: [A('sim-cf-a', 25000), A('sim-ag-b', 25000)], debriefRead: true },
  { pseudonym: 'Depósito 4', style: 'Quatro lotes, cobertura parcial', allocations: [A('sim-az-a', 12500, true), A('sim-az-b', 12500), A('sim-ag-a', 12500), A('sim-ag-b', 12500)], debriefRead: true },
  { pseudonym: 'Serra Fria', style: 'Água com um lote de distribuidores coberto', allocations: [A('sim-ag-b', 25000), A('sim-az-b', 10000, true)], debriefRead: true },
  { pseudonym: 'Madural', style: 'Azeite HoReCa sem cobertura e água', allocations: [A('sim-az-a', 25000), A('sim-ag-a', 25000)], debriefRead: true },
  { pseudonym: 'Palete Cheia', style: 'Quase só água', allocations: [A('sim-ag-a', 25000), A('sim-ag-b', 20000), A('sim-az-b', 5000, true)], debriefRead: true },
  { pseudonym: 'Cereja Madura', style: 'Café e azeite, ambos cobertos', allocations: [A('sim-cf-a', 25000, true), A('sim-az-a', 25000, true)], debriefRead: true },
  { pseudonym: 'Lagar Frio', style: 'Azeite de distribuidores sem cobertura, café coberto', allocations: [A('sim-az-b', 25000), A('sim-cf-a', 15000, true), A('sim-ag-a', 10000)], debriefRead: true },
  { pseudonym: 'Cordovil', style: 'Três lotes voláteis, todos cobertos', allocations: [A('sim-az-a', 15000, true), A('sim-az-b', 15000, true), A('sim-cf-a', 15000, true)], debriefRead: true },
  { pseudonym: 'Azeitona Negra', style: 'Só azeite, metade coberta', allocations: [A('sim-az-b', 25000), A('sim-az-a', 25000, true)], debriefRead: true },
  { pseudonym: 'Aquífero', style: 'Água, azeite coberto, café a descoberto', allocations: [A('sim-ag-a', 20000), A('sim-az-b', 20000, true), A('sim-cf-a', 10000)], debriefRead: true },
  { pseudonym: 'Saca 60', style: 'Café e azeite de distribuidores, sem cobertura', allocations: [A('sim-cf-a', 25000), A('sim-az-b', 25000)], debriefRead: false },
  { pseudonym: 'Picual 7', style: 'Três mundos, cobertura onde existe', allocations: [A('sim-az-a', 20000, true), A('sim-ag-a', 15000), A('sim-cf-a', 10000, true)], debriefRead: true },
];

export const COHORT: CohortManager[] = COHORT_DEF.map((d, i) => ({ ...d, id: `gestor-${i + 1}`, seed: LEAGUE_SEED }));

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
