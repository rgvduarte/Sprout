import type { SimRunResult } from '../../data/types';
import { simulateFull, type DecisionChoice, type Decisions, type SimRun } from './engine';

/* Conversão entre a corrida do motor e o registo guardado no histórico do jogo. */

const DECISION_PREFIX = 'decisao:';

/** As decisões vão no fim da lista de acontecimentos, com prefixo, para se poder repetir a corrida. */
export function decisionsFromResult(r: SimRunResult): Decisions {
  const d: Decisions = {};
  for (const e of r.events) {
    if (!e.startsWith(DECISION_PREFIX)) continue;
    const [, lot, kind, choice] = e.split(':');
    if (lot && kind && (choice === 'aprovar' || choice === 'recusar')) d[`${lot}:${kind}`] = choice as DecisionChoice;
  }
  return d;
}

export const eventIdsFromResult = (r: SimRunResult) => r.events.filter((e) => !e.startsWith(DECISION_PREFIX));

export function toResult(run: SimRun, id: string, at: string): SimRunResult {
  const f = run.final!;
  const eventIds = [...new Set(run.months.flatMap((m) => m.events.map((e) => e.event.id)))];
  const decisions = Object.entries(run.decisions).map(([k, v]) => `${DECISION_PREFIX}${k}:${v}`);
  return {
    id,
    at,
    seed: run.seed,
    allocations: run.allocations.map((a) => ({ ...a })),
    invested: run.invested,
    finalValue: Math.round(f.value),
    result: f.result,
    extended: f.lots.some((l) => l.extended),
    refunded: f.lots.some((l) => l.refunded),
    events: [...eventIds, ...decisions],
  };
}

const replayCache = new Map<string, SimRun>();

/** Repete uma corrida guardada (mesma semente, lotes e decisões). */
export function replayResult(r: SimRunResult): SimRun {
  const hit = replayCache.get(r.id + r.at);
  if (hit) return hit;
  const run = simulateFull(r.seed, r.allocations, decisionsFromResult(r));
  replayCache.set(r.id + r.at, run);
  return run;
}
