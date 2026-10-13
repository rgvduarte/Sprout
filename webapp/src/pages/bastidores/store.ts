import { useSyncExternalStore } from 'react';
import { now } from '../../lib/clock';

/* =====================================================================
   Estado da equipa nos Bastidores, só nesta sessão (em memória, como o
   resto do jogo): decisões de KYC, reconciliação de hoje, aprovações de
   pagamentos, revisão de materiais e ensaios do motor de missões.
   ===================================================================== */

export type KycAction = 'aprovar' | 'pedir-info' | 'rejeitar';
export interface KycDecision {
  caseId: string;
  action: KycAction;
  note: string;
  at: string;
}

export type Approver = 'Tesouraria' | 'Operações' | 'Compliance' | 'Comité de risco';
export const APPROVERS: Approver[] = ['Tesouraria', 'Operações', 'Compliance', 'Comité de risco'];
export interface Approval {
  payoutId: string;
  by: Approver;
  at: string;
}

export interface ReconRun {
  date: string;
  at: string;
  psp: number;
  ledger: number;
  matched: number;
}

export interface EngineProbe {
  id: string;
  at: string;
  triggerId: string;
  lotId?: string;
  accepted: boolean;
  questIds: string[];
  ms: number;
}

export interface BastidoresState {
  kyc: KycDecision[];
  recon: ReconRun | null;
  approvals: Approval[];
  /** disclaimers assinalados por material */
  materials: Record<string, string[]>;
  /** material aprovado para distribuição restrita (data) */
  materialsApproved: Record<string, string>;
  /** ecrãs com nota de capital em risco verificados (rota → data) */
  screensVerified: Record<string, string>;
  gamReviewAt: string | null;
  probes: EngineProbe[];
}

const initial = (): BastidoresState => ({
  kyc: [],
  recon: null,
  approvals: [],
  materials: {
    'mat-deck': ['capital-risco', 'sem-garantia', 'qualificados', 'ilustrativo'],
    'mat-apresentacao': ['capital-risco', 'sem-garantia', 'qualificados', 'sem-secundario', 'ilustrativo', 'psp'],
    'mat-ficha-021': ['capital-risco', 'sem-garantia', 'qualificados', 'sem-secundario', 'psp'],
    'mat-email-007': ['capital-risco', 'qualificados'],
    'mat-social': [],
  },
  materialsApproved: {},
  screensVerified: {},
  gamReviewAt: null,
  probes: [],
});

let state: BastidoresState = initial();
let probeSeq = 0;
const listeners = new Set<() => void>();

function set(fn: (s: BastidoresState) => BastidoresState) {
  state = fn(state);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useBastidores(): BastidoresState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

const stamp = () => now().toISOString();

export const actions = {
  decideKyc(caseId: string, action: KycAction, note: string) {
    set((s) => ({ ...s, kyc: [...s.kyc, { caseId, action, note: note.trim(), at: stamp() }] }));
  },
  runRecon(run: Omit<ReconRun, 'at'>) {
    set((s) => ({ ...s, recon: { ...run, at: stamp() } }));
  },
  approve(payoutId: string, by: Approver) {
    set((s) => ({ ...s, approvals: [...s.approvals, { payoutId, by, at: stamp() }] }));
  },
  toggleDisclaimer(materialId: string, itemId: string) {
    set((s) => {
      const list = s.materials[materialId] ?? [];
      const next = list.includes(itemId) ? list.filter((x) => x !== itemId) : [...list, itemId];
      const approved = { ...s.materialsApproved };
      if (!next.includes(itemId)) delete approved[materialId];
      return { ...s, materials: { ...s.materials, [materialId]: next }, materialsApproved: approved };
    });
  },
  approveMaterial(materialId: string) {
    set((s) => ({ ...s, materialsApproved: { ...s.materialsApproved, [materialId]: stamp() } }));
  },
  toggleScreen(route: string) {
    set((s) => {
      const next = { ...s.screensVerified };
      if (next[route]) delete next[route];
      else next[route] = stamp();
      return { ...s, screensVerified: next };
    });
  },
  recordGamReview() {
    set((s) => ({ ...s, gamReviewAt: stamp() }));
  },
  /** Regista um ensaio do motor e devolve o id. */
  probe(p: Omit<EngineProbe, 'id' | 'at'>): string {
    const id = `probe-${++probeSeq}`;
    set((s) => ({ ...s, probes: [{ ...p, id, at: stamp() }, ...s.probes].slice(0, 12) }));
    return id;
  },
};

/** Última decisão de um caso KYC nesta sessão. */
export const lastDecision = (s: BastidoresState, caseId: string) => [...s.kyc].reverse().find((d) => d.caseId === caseId);
