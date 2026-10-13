import { useSyncExternalStore } from 'react';
import { ACTION_ITEMS } from '../../data';
import { now } from '../../lib/clock';
import { SEED_DECISIONS, type Decision } from './content';

/* =====================================================================
   Estado do plano nesta sessão (em memória): estado de cada ação,
   proposta de responsável da Tesouraria e decisões registadas.
   ===================================================================== */

export type ItemStatus = 'por-iniciar' | 'em-curso' | 'bloqueado' | 'concluido';
export const ITEM_STATUSES: ItemStatus[] = ['por-iniciar', 'em-curso', 'bloqueado', 'concluido'];
export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  'por-iniciar': 'Por iniciar',
  'em-curso': 'Em curso',
  bloqueado: 'Bloqueado',
  concluido: 'Concluído',
};

export interface PlanoState {
  status: Record<string, ItemStatus>;
  changedAt: Record<string, string>;
  treasuryProposal: string | null;
  decisions: Decision[];
}

const initial = (): PlanoState => ({
  status: Object.fromEntries(ACTION_ITEMS.map((a) => [a.id, a.done ? 'concluido' : 'por-iniciar'])),
  changedAt: {},
  treasuryProposal: null,
  decisions: SEED_DECISIONS,
});

let state: PlanoState = initial();
let seq = 0;
const listeners = new Set<() => void>();
const set = (fn: (s: PlanoState) => PlanoState) => {
  state = fn(state);
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const usePlano = () => useSyncExternalStore(subscribe, () => state, () => state);

const stamp = () => now().toISOString();

export const planoActions = {
  setStatus(id: string, status: ItemStatus) {
    set((s) => ({ ...s, status: { ...s.status, [id]: status }, changedAt: { ...s.changedAt, [id]: stamp() } }));
  },
  proposeTreasury(owner: string | null) {
    set((s) => {
      const decisions = owner
        ? [
            {
              id: `d-s${++seq}`,
              date: stamp(),
              title: `Proposta: ${owner} assume Risco & Tesouraria até haver responsável`,
              context: 'Define a política de hedge e o playbook de refunding enquanto a área não tem dono. A confirmar pelos fundadores.',
              origin: 'Registado nesta sessão',
              status: 'proposta' as const,
              session: true,
            },
            ...s.decisions,
          ]
        : s.decisions;
      return { ...s, treasuryProposal: owner, decisions };
    });
  },
  addDecision(d: Omit<Decision, 'id' | 'date' | 'session' | 'origin'>) {
    set((s) => ({ ...s, decisions: [{ ...d, id: `d-s${++seq}`, date: stamp(), origin: 'Registado nesta sessão', session: true }, ...s.decisions] }));
  },
};
