import { useSyncExternalStore } from 'react';
import type { Position } from '../../data/types';
import { now } from '../../lib/clock';

/* =====================================================================
   Registo local da jornada: cancelamentos dentro do período de reflexão e
   pedidos de amostra. A loja partilhada (src/state) ainda não tem ação de
   cancelamento; até lá, este registo vive em memória nesta sessão.
   ===================================================================== */

export interface CancelEntry {
  key: string;
  profileId: string;
  lotId: string;
  amount: number;
  at: string;
}

export interface SampleEntry {
  key: string;
  lotId: string;
  option: 'sede' | 'visita';
  at: string;
}

interface LedgerState {
  cancelled: Record<string, CancelEntry>;
  samples: Record<string, SampleEntry>;
}

let state: LedgerState = { cancelled: {}, samples: {} };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const getSnapshot = () => state;

export function useLedger(): LedgerState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Chave estável de uma posição (o id repete-se depois de reiniciar a demonstração; a data não). */
export const positionKey = (p: Pick<Position, 'id' | 'committedAt'>) => `${p.id}@${p.committedAt}`;

export function cancelCommitment(p: Position, profileId: string) {
  const key = positionKey(p);
  if (state.cancelled[key]) return;
  state = { ...state, cancelled: { ...state.cancelled, [key]: { key, profileId, lotId: p.lotId, amount: p.amount, at: now().toISOString() } } };
  emit();
}

export const sampleKey = (profileId: string, lotId: string) => `${profileId}:${lotId}`;

export function requestSample(profileId: string, lotId: string, option: SampleEntry['option']) {
  const key = sampleKey(profileId, lotId);
  if (state.samples[key]) return;
  state = { ...state, samples: { ...state.samples, [key]: { key, lotId, option, at: now().toISOString() } } };
  emit();
}
