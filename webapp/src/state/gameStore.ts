import { addMonths, now, TODAY_DATE } from '../lib/clock';
import { DEMO_PROGRESS, MODULES, QUESTS, SEALS, SIM_COMPLETE_POINTS } from '../data/game';
import { DEMO_INVESTOR_ID, SEED_POSITIONS, SEED_SEALS } from '../data/investors';
import { LOTS } from '../data/lots';
import { MINI_GAMES } from '../data/minigames';
import { REGIONS } from '../data/worlds';
import type {
  EarnedSeal,
  Lot,
  MiniGameId,
  OnboardingState,
  Position,
  Quest,
  RegionState,
  SimRunResult,
  WorldId,
} from '../data/types';

/* =====================================================================
   Loja de jogo em memória. Dois perfis: a investidora de demonstração
   (Investidor qualificado e Equipa Sprout) e o Visitante. Os pontos de
   conhecimento derivam do que foi aprendido; o dinheiro nunca dá pontos.
   ===================================================================== */

export type ProfileId = 'demo' | 'visitante';

export interface ProfileState {
  modulesCompleted: { id: string; at: string; quizScore?: number }[];
  questsCompleted: { id: string; at: string }[];
  miniGames: Partial<Record<MiniGameId, { bestScore: number; plays: number; at: string }>>;
  riskRead: Record<string, string[]>;
  analysesRead: string[];
  regionsVisited: string[];
  worldsVisited: WorldId[];
  simRuns: SimRunResult[];
  /** compromissos feitos nesta sessão (dinheiro real na demonstração) */
  commitments: Position[];
  seals: EarnedSeal[];
  onboarding: OnboardingState;
}

export interface GameState {
  profiles: Record<ProfileId, ProfileState>;
  /** efeito dos compromissos da sessão nos lotes (partilhado entre perfis) */
  lotDeltas: Record<string, { raised: number; coFinancers: number }>;
}

export type GameAction =
  | { type: 'completeModule'; profile: ProfileId; moduleId: string; quizScore?: number }
  | { type: 'completeQuest'; profile: ProfileId; questId: string }
  | { type: 'recordMiniGame'; profile: ProfileId; gameId: MiniGameId; score: number }
  | { type: 'markRiskRead'; profile: ProfileId; lotId: string; factorId: string }
  | { type: 'markAnalysisRead'; profile: ProfileId; lotId: string }
  | { type: 'visitRegion'; profile: ProfileId; regionId: string }
  | { type: 'visitWorld'; profile: ProfileId; worldId: WorldId }
  | { type: 'commit'; profile: ProfileId; position: Position }
  | { type: 'recordSimRun'; profile: ProfileId; run: SimRunResult }
  | { type: 'updateOnboarding'; profile: ProfileId; patch: Partial<OnboardingState> }
  | { type: 'reset' };

const nowIso = () => now().toISOString();

function emptyProfile(): ProfileState {
  return {
    modulesCompleted: [],
    questsCompleted: [],
    miniGames: {},
    riskRead: {},
    analysesRead: [],
    regionsVisited: [],
    worldsVisited: [],
    simRuns: [],
    commitments: [],
    seals: [],
    onboarding: { status: 'nao-iniciado', step: 0, adequacao: {}, documentos: [] },
  };
}

function demoProfile(): ProfileState {
  return {
    ...emptyProfile(),
    modulesCompleted: DEMO_PROGRESS.modulesCompleted.map((m) => ({ ...m })),
    questsCompleted: DEMO_PROGRESS.questsCompleted.map((q) => ({ ...q })),
    miniGames: Object.fromEntries(DEMO_PROGRESS.miniGames.map((g) => [g.id, { bestScore: g.bestScore, plays: 3, at: g.at }])),
    regionsVisited: [...DEMO_PROGRESS.regionsVisited],
    worldsVisited: [...DEMO_PROGRESS.worldsVisited],
    seals: SEED_SEALS.map((s) => ({ ...s })),
    onboarding: {
      status: 'aprovado',
      step: 5,
      tipo: 'pessoa-coletiva',
      classe: 'qualificado',
      nome: 'Marta Calado Investimentos, Lda.',
      pais: 'Portugal',
      adequacao: {},
      documentos: ['Certidão permanente', 'RCBE', 'Comprovativo de IBAN', 'Declaração de investidor qualificado'],
      updatedAt: '2025-11-27',
    },
  };
}

export function initialGameState(): GameState {
  return { profiles: { demo: demoProfile(), visitante: emptyProfile() }, lotDeltas: {} };
}

/* ------------------------------------------------------------ derivados */

export function allPositions(profile: ProfileState, profileId: ProfileId): Position[] {
  const seed = profileId === 'demo' ? SEED_POSITIONS.filter((p) => p.investorId === DEMO_INVESTOR_ID) : [];
  return [...seed, ...profile.commitments];
}

export function miniGamePoints(profile: ProfileState): number {
  return MINI_GAMES.reduce((sum, g) => {
    const r = profile.miniGames[g.id];
    return sum + (r ? Math.round((Math.min(r.bestScore, g.maxScore) / g.maxScore) * g.maxPoints) : 0);
  }, 0);
}

export function knowledgePoints(profile: ProfileState): number {
  const modules = profile.modulesCompleted.reduce((s, m) => s + (MODULES.find((x) => x.id === m.id)?.points ?? 0), 0);
  const quests = profile.questsCompleted.reduce((s, q) => s + (QUESTS.find((x) => x.id === q.id)?.points ?? 0), 0);
  const sim = profile.simRuns.length > 0 ? SIM_COMPLETE_POINTS : 0;
  return modules + quests + miniGamePoints(profile) + sim;
}

function questSatisfied(q: Quest, p: ProfileState): boolean {
  const c = q.criteria;
  switch (c.type) {
    case 'module':
      return p.modulesCompleted.some((m) => m.id === c.moduleId);
    case 'minigame':
      return (p.miniGames[c.gameId]?.bestScore ?? 0) >= c.minScore;
    case 'risk-read': {
      const lot = LOTS.find((l) => l.id === c.lotId);
      const read = p.riskRead[c.lotId] ?? [];
      return Boolean(lot) && lot!.riskFactors.every((r) => read.includes(r.id));
    }
    case 'analysis-read':
      return p.analysesRead.includes(c.lotId);
    case 'sim-complete':
      return p.simRuns.length > 0;
    case 'region-visit':
      return p.regionsVisited.includes(c.regionId);
    case 'world-visit':
      return p.worldsVisited.includes(c.worldId);
    case 'manual':
      return false;
  }
}

/** Fecha missões cumpridas e selos ganhos por diligência ou compromisso. */
function settle(p: ProfileState, profileId: ProfileId): ProfileState {
  const at = nowIso();
  const done = new Set(p.questsCompleted.map((q) => q.id));
  const newQuests = QUESTS.filter((q) => !done.has(q.id) && questSatisfied(q, p)).map((q) => ({ id: q.id, at }));
  const questsCompleted = newQuests.length ? [...p.questsCompleted, ...newQuests] : p.questsCompleted;
  const doneAfter = new Set(questsCompleted.map((q) => q.id));

  const earned = new Set(p.seals.map((s) => s.sealId));
  const positions = allPositions(p, profileId);
  const newSeals: EarnedSeal[] = [];
  for (const seal of SEALS) {
    if (earned.has(seal.id)) continue;
    const commitLot = seal.earnable !== 'diligencia'
      ? positions.find((pos) => {
          const lot = LOTS.find((l) => l.id === pos.lotId);
          return lot && lot.producerId === seal.producerId && lot.campanha === seal.campanha;
        })
      : undefined;
    if (commitLot) {
      newSeals.push({ sealId: seal.id, at, by: 'compromisso', lotId: commitLot.lotId });
      continue;
    }
    if (seal.earnable !== 'compromisso' && seal.questIds.length > 0 && seal.questIds.every((id) => doneAfter.has(id))) {
      newSeals.push({ sealId: seal.id, at, by: 'diligencia' });
    }
  }
  if (!newQuests.length && !newSeals.length) return p;
  return { ...p, questsCompleted, seals: newSeals.length ? [...p.seals, ...newSeals] : p.seals };
}

function updateProfile(state: GameState, id: ProfileId, fn: (p: ProfileState) => ProfileState): GameState {
  const next = settle(fn(state.profiles[id]), id);
  if (next === state.profiles[id]) return state;
  return { ...state, profiles: { ...state.profiles, [id]: next } };
}

const addUnique = <T,>(list: T[], item: T) => (list.includes(item) ? list : [...list, item]);

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'reset':
      return initialGameState();
    case 'completeModule':
      return updateProfile(state, action.profile, (p) =>
        p.modulesCompleted.some((m) => m.id === action.moduleId)
          ? p
          : { ...p, modulesCompleted: [...p.modulesCompleted, { id: action.moduleId, at: nowIso(), quizScore: action.quizScore }] },
      );
    case 'completeQuest':
      return updateProfile(state, action.profile, (p) =>
        p.questsCompleted.some((q) => q.id === action.questId) ? p : { ...p, questsCompleted: [...p.questsCompleted, { id: action.questId, at: nowIso() }] },
      );
    case 'recordMiniGame':
      return updateProfile(state, action.profile, (p) => {
        const prev = p.miniGames[action.gameId];
        return {
          ...p,
          miniGames: {
            ...p.miniGames,
            [action.gameId]: { bestScore: Math.max(prev?.bestScore ?? 0, action.score), plays: (prev?.plays ?? 0) + 1, at: nowIso() },
          },
        };
      });
    case 'markRiskRead':
      return updateProfile(state, action.profile, (p) => {
        const list = p.riskRead[action.lotId] ?? [];
        if (list.includes(action.factorId)) return p;
        return { ...p, riskRead: { ...p.riskRead, [action.lotId]: [...list, action.factorId] } };
      });
    case 'markAnalysisRead':
      return updateProfile(state, action.profile, (p) => (p.analysesRead.includes(action.lotId) ? p : { ...p, analysesRead: [...p.analysesRead, action.lotId] }));
    case 'visitRegion':
      return updateProfile(state, action.profile, (p) => (p.regionsVisited.includes(action.regionId) ? p : { ...p, regionsVisited: addUnique(p.regionsVisited, action.regionId) }));
    case 'visitWorld':
      return updateProfile(state, action.profile, (p) => (p.worldsVisited.includes(action.worldId) ? p : { ...p, worldsVisited: addUnique(p.worldsVisited, action.worldId) }));
    case 'recordSimRun':
      return updateProfile(state, action.profile, (p) => ({ ...p, simRuns: [action.run, ...p.simRuns].slice(0, 20) }));
    case 'updateOnboarding':
      return updateProfile(state, action.profile, (p) => ({ ...p, onboarding: { ...p.onboarding, ...action.patch, updatedAt: nowIso() } }));
    case 'commit': {
      const { position } = action;
      const delta = state.lotDeltas[position.lotId] ?? { raised: 0, coFinancers: 0 };
      const already = allPositions(state.profiles[action.profile], action.profile).some((p) => p.lotId === position.lotId);
      const withLot: GameState = {
        ...state,
        lotDeltas: { ...state.lotDeltas, [position.lotId]: { raised: delta.raised + position.amount, coFinancers: delta.coFinancers + (already ? 0 : 1) } },
      };
      return updateProfile(withLot, action.profile, (p) => ({ ...p, commitments: [...p.commitments, position] }));
    }
  }
}

/* ------------------------------------------------------------ vistas derivadas */

/** Lote com o efeito dos compromissos da sessão. */
export function mergeLot(lot: Lot, deltas: GameState['lotDeltas']): Lot {
  const d = deltas[lot.id];
  if (!d) return lot;
  const raised = Math.min(lot.funding.goal, lot.funding.raised + d.raised);
  const full = raised >= lot.funding.goal;
  return {
    ...lot,
    funding: { ...lot.funding, raised, coFinancers: lot.funding.coFinancers + d.coFinancers, closedAt: full ? TODAY_DATE : lot.funding.closedAt },
    status: full && lot.status === 'aberto' ? 'financiado' : lot.status,
    settlement: full && !lot.settlement.start ? { ...lot.settlement, start: TODAY_DATE, plannedEnd: addMonths(TODAY_DATE, lot.settlement.windowMonths) } : lot.settlement,
  };
}

export function regionStates(profile: ProfileState, profileId: ProfileId): Record<string, RegionState> {
  const positions = allPositions(profile, profileId);
  const participated = new Set(positions.map((p) => LOTS.find((l) => l.id === p.lotId)?.regionId).filter(Boolean) as string[]);
  const learned = new Set<string>(profile.regionsVisited);
  for (const s of profile.seals) {
    const seal = SEALS.find((x) => x.id === s.sealId);
    if (seal) learned.add(seal.regionId);
  }
  for (const lotId of [...profile.analysesRead, ...Object.keys(profile.riskRead)]) {
    const lot = LOTS.find((l) => l.id === lotId);
    if (lot) learned.add(lot.regionId);
  }
  return Object.fromEntries(
    REGIONS.map((r) => [r.id, participated.has(r.id) ? 'participated' : learned.has(r.id) ? 'learned' : 'unexplored']),
  ) as Record<string, RegionState>;
}
