import { useSyncExternalStore } from 'react';
import type { GoalId, RewardId } from './content';

/* =====================================================================
   Estado local da Academia (objetivo de aprendizagem e pedidos de
   recompensas), em memória como o resto do jogo: dura a sessão e
   volta ao início ao recarregar.
   ===================================================================== */

export type ProfileKey = 'demo' | 'visitante';

export interface RewardRequest {
  id: string;
  rewardId: RewardId;
  /** data do pedido (ISO) */
  at: string;
  /** o que foi pedido: lote, sessão, local */
  detail: string;
  status: string;
  lotId?: string;
}

export interface AcademiaLocal {
  goal: GoalId | null;
  goalSetAt?: string;
  requests: RewardRequest[];
}

let state: Record<ProfileKey, AcademiaLocal> = {
  demo: {
    goal: 'azeite',
    goalSetAt: '2026-01-12',
    requests: [
      { id: 'rq-1', rewardId: 'certificado', at: '2026-01-12', detail: 'Certificado de Provador', status: 'Emitido' },
      { id: 'rq-2', rewardId: 'amostra', at: '2026-06-20', detail: 'Frasco de 250 ml do AZ-2026-014 · morada registada', status: 'Entregue a 02/07/2026', lotId: 'AZ-2026-014' },
    ],
  },
  visitante: { goal: null, requests: [] },
};

const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function update(profile: ProfileKey, fn: (s: AcademiaLocal) => AcademiaLocal) {
  state = { ...state, [profile]: fn(state[profile]) };
  listeners.forEach((l) => l());
}

export function useAcademiaLocal(profile: ProfileKey): AcademiaLocal {
  return useSyncExternalStore(
    subscribe,
    () => state[profile],
    () => state[profile],
  );
}

export function setGoal(profile: ProfileKey, goal: GoalId | null, at: string) {
  update(profile, (s) => ({ ...s, goal, goalSetAt: goal ? at : undefined }));
}

export function addRequest(profile: ProfileKey, req: Omit<RewardRequest, 'id'>) {
  update(profile, (s) => ({ ...s, requests: [{ ...req, id: `rq-${s.requests.length + 1}-${req.rewardId}` }, ...s.requests] }));
}
