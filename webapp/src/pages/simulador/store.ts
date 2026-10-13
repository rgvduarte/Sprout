import { useCallback, useSyncExternalStore } from 'react';
import type { ProfileId } from '../../state';
import type { Allocation, Decisions } from './engine';

/* =====================================================================
   Estado da sessão do simulador (em memória, por perfil): fase, rascunho e
   decisões da corrida. Sobrevive à navegação entre ecrãs; volta ao início
   ao recarregar. A adesão à Liga e o pseudónimo vivem na loja partilhada
   (useGame().league), com o resto do progresso de jogo.
   ===================================================================== */

export type Phase = 'setup' | 'play' | 'debrief';

export interface SimSession {
  phase: Phase;
  /** rascunho da distribuição (todos os lotes do baralho; 0 = fora) */
  draft: Allocation[];
  draftSeed: number;
  /** corrida em jogo ou em balanço */
  seed: number;
  allocations: Allocation[];
  decisions: Decisions;
  /** último mês revelado */
  month: number;
  /** id da corrida já guardada no histórico (balanço lido) */
  recordedRunId?: string;
  /** a rever um balanço antigo (não grava) */
  reviewing?: boolean;
  /** pontos de conhecimento dados ao abrir este balanço */
  pointsAwarded: number;
  /** muda a cada corrida nova (reinicia o estado local do jogo) */
  runNonce: number;
  /** corridas seguidas desde a última pausa (para o aviso de pausa) */
  streak: number;
  /** o aviso de pausa foi visto nesta série */
  pauseAcknowledgedAt: number;
}

/**
 * Semente da primeira campanha: o índice de origem cai 30 % em março, a Tesouraria propõe
 * refunding, o lote de distribuidores sem cobertura acaba em perda e esgota a reserva comum.
 */
export const DEFAULT_SEED = 1118;

export const DEFAULT_DRAFT: Allocation[] = [
  { simLotId: 'sim-az-a', amount: 17500, hedged: true },
  { simLotId: 'sim-az-b', amount: 12500, hedged: false },
  { simLotId: 'sim-ag-a', amount: 15000, hedged: false },
  { simLotId: 'sim-ag-b', amount: 0, hedged: false },
  { simLotId: 'sim-cf-a', amount: 0, hedged: false },
];

function initial(): SimSession {
  return {
    phase: 'setup',
    draft: DEFAULT_DRAFT.map((a) => ({ ...a })),
    draftSeed: DEFAULT_SEED,
    seed: DEFAULT_SEED,
    allocations: [],
    decisions: {},
    month: 0,
    pointsAwarded: 0,
    runNonce: 0,
    streak: 0,
    pauseAcknowledgedAt: 0,
  };
}

const sessions: Record<ProfileId, SimSession> = { demo: initial(), visitante: initial() };
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useSimSession(profile: ProfileId): [SimSession, (patch: Partial<SimSession> | ((s: SimSession) => Partial<SimSession>)) => void] {
  const state = useSyncExternalStore(
    subscribe,
    () => sessions[profile],
    () => sessions[profile],
  );
  const update = useCallback(
    (patch: Partial<SimSession> | ((s: SimSession) => Partial<SimSession>)) => {
      const cur = sessions[profile];
      const p = typeof patch === 'function' ? patch(cur) : patch;
      sessions[profile] = { ...cur, ...p };
      listeners.forEach((l) => l());
    },
    [profile],
  );
  return [state, update];
}

/** Próxima semente a partir da atual (determinística, 4 dígitos). */
export function nextSeed(seed: number): number {
  let x = (seed * 2654435761) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 1274126177) >>> 0;
  return 1000 + (x % 9000);
}

/** Pseudónimos da liga (vocabulário do campo, nunca nomes de pessoas). */
export const PSEUDONYMS = ['Mó de Granito', 'Ramo Verde', 'Decantação', 'Prensa Fria', 'Folha de Oliveira', 'Rega Gota a Gota', 'Cinta de Palete', 'Juta Nova'];
