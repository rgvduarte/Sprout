import { createContext, useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { getLot, getProducer, getQuest, getSeal, getSealForLot, isInvestable, levelForPoints, maxCommit } from '../data';
import type { LearningGoalState, MiniGameId, OnboardingState, Position, RewardRequest, SimRunResult, WorldId } from '../data/types';
import { daysBetween, now, TODAY_DATE } from '../lib/clock';
import { eur } from '../lib/format';
import { readStorage, STORAGE_KEYS, writeStorage } from '../lib/storage';
import { useLiveFeed, type LiveFeed } from '../lib/useLiveFeed';
import { useMediaQuery } from '../lib/useMediaQuery';
import { gameReducer, initialGameState, knowledgePoints, mergeLot, type GameState, type KycDecisionKind, type ProfileId, type ProfileState } from './gameStore';
import { ToastProvider, useToast } from './toast';

/* =====================================================================
   AppProvider: papel ("Ver como"), tema, diário ao vivo e loja de jogo.
   ===================================================================== */

export type Role = 'investidor' | 'visitante' | 'equipa';
export const ROLES: Role[] = ['investidor', 'visitante', 'equipa'];
export const ROLE_LABEL: Record<Role, string> = {
  investidor: 'Investidor qualificado',
  visitante: 'Visitante',
  equipa: 'Equipa Sprout',
};

export type ThemePref = 'system' | 'light' | 'dark';
export const THEMES: ThemePref[] = ['system', 'light', 'dark'];
export const THEME_LABEL: Record<ThemePref, string> = { system: 'Sistema', light: 'Claro', dark: 'Escuro' };

/** Aplica o tema ao <html>: "Sistema" remove data-theme. */
export function applyTheme(theme: ThemePref) {
  const el = document.documentElement;
  if (theme === 'system') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', theme);
}

/** Dias do período de reflexão depois de um compromisso (política Sprout, à imagem dos 4 dias do ECSP). */
export const REFLECTION_DAYS = 4;

/** Último dia do período de reflexão ('YYYY-MM-DD'). */
export function reflectionEndOf(committedAt: string): string {
  const d = new Date(`${committedAt.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + REFLECTION_DAYS);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------ contextos */

export interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  roleLabel: string;
  profileId: ProfileId;
  isTeam: boolean;
  isVisitor: boolean;
}

export interface ThemeCtx {
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  resolved: 'light' | 'dark';
}

export type CommitFailure = 'onboarding' | 'bloqueado' | 'lote-indisponivel' | 'riscos-por-ler' | 'montante-minimo' | 'montante-maximo';

export type CommitResult =
  | { ok: true; position: Position; sealId?: string; firstSealForOrigin: boolean }
  | { ok: false; reason: CommitFailure; message: string };

export interface GameActions {
  completeModule: (moduleId: string, quizScore?: number) => void;
  completeQuest: (questId: string) => void;
  recordMiniGame: (gameId: MiniGameId, score: number) => void;
  markRiskRead: (lotId: string, factorId: string) => void;
  markAnalysisRead: (lotId: string) => void;
  visitRegion: (regionId: string) => void;
  visitWorld: (worldId: WorldId) => void;
  recordSimRun: (run: SimRunResult) => void;
  updateOnboarding: (patch: Partial<OnboardingState>) => void;
  /** Compromisso de capital (demonstração). Valida e devolve o motivo se recusar. */
  commitToLot: (lotId: string, amount: number) => CommitResult;
  /** Valida sem comprometer (para desativar o botão com motivo). */
  checkCommit: (lotId: string, amount: number) => CommitResult | { ok: true; position?: undefined };
  /**
   * Cancela um compromisso desta sessão dentro do período de reflexão: a posição
   * sai da carteira, o lote volta ao financiamento anterior e o selo ganho só por
   * este compromisso sai do Caderno (o conhecimento e as missões ficam).
   */
  cancelCommitment: (positionId: string) => { ok: true } | { ok: false; message: string };
  /** Pede uma recompensa em espécie (amostra, sessão, visita, relatório, certificado). */
  requestReward: (request: Omit<RewardRequest, 'id' | 'at'> & { at?: string }) => RewardRequest;
  /** Define (ou limpa) o objetivo de aprendizagem do perfil ativo. */
  setLearningGoal: (goal: Omit<LearningGoalState, 'setAt'> | null) => void;
  /** Decisão da equipa de compliance sobre o registo de um perfil (Bastidores). */
  decideKyc: (profile: ProfileId, decision: KycDecisionKind, note: string) => void;
  resetDemo: () => void;
}

export interface GameCtx {
  state: GameState;
  profileId: ProfileId;
  profile: ProfileState;
  actions: GameActions;
}

export const RoleContext = createContext<RoleCtx | null>(null);
export const ThemeContext = createContext<ThemeCtx | null>(null);
export const GameContext = createContext<GameCtx | null>(null);
export const FeedContext = createContext<LiveFeed | null>(null);

/* ------------------------------------------------------------ provider */

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppState>{children}</AppState>
    </ToastProvider>
  );
}

function AppState({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => readStorage(STORAGE_KEYS.role, ROLES, 'investidor'));
  const [theme, setThemeState] = useState<ThemePref>(() => readStorage(STORAGE_KEYS.theme, THEMES, 'system'));
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [state, dispatch] = useReducer(gameReducer, undefined, initialGameState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const { toast } = useToast();

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    writeStorage(STORAGE_KEYS.role, r);
  }, []);

  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t);
    writeStorage(STORAGE_KEYS.theme, t);
  }, []);

  useEffect(() => applyTheme(theme), [theme]);

  const profileId: ProfileId = role === 'visitante' ? 'visitante' : 'demo';
  const profileRef = useRef(profileId);
  profileRef.current = profileId;
  const profile = state.profiles[profileId];

  /* ---- avisos de missões, níveis e selos (conhecimento, nunca dinheiro) ---- */
  const seen = useRef<{ profile: ProfileId; quests: Set<string>; seals: Set<string>; points: number }>({
    profile: profileId,
    quests: new Set(profile.questsCompleted.map((q) => q.id)),
    seals: new Set(profile.seals.map((s) => s.sealId)),
    points: knowledgePoints(profile),
  });
  useEffect(() => {
    const s = seen.current;
    const points = knowledgePoints(profile);
    if (s.profile !== profileId) {
      seen.current = { profile: profileId, quests: new Set(profile.questsCompleted.map((q) => q.id)), seals: new Set(profile.seals.map((x) => x.sealId)), points };
      return;
    }
    for (const q of profile.questsCompleted) {
      if (s.quests.has(q.id)) continue;
      s.quests.add(q.id);
      const quest = getQuest(q.id);
      if (quest) toast({ tone: 'accent', title: `Missão cumprida: ${quest.title}`, description: `+${quest.points} pontos de conhecimento.` });
    }
    for (const earned of profile.seals) {
      if (s.seals.has(earned.sealId)) continue;
      s.seals.add(earned.sealId);
      if (earned.by !== 'diligencia') continue; // o selo por compromisso é carimbado no ritual do lote
      const seal = getSeal(earned.sealId);
      const producer = seal && getProducer(seal.producerId);
      if (seal && producer) toast({ tone: 'seal', title: `Selo de origem: ${producer.nome} · ${seal.campanha}`, description: 'Ganho por diligência. Já está no teu Caderno de colheita.' });
    }
    const before = levelForPoints(s.points).level;
    const after = levelForPoints(points).level;
    if (after.minPoints > before.minPoints) toast({ tone: 'accent', title: `Novo nível de conhecimento: ${after.nome}`, description: after.description });
    s.points = points;
  }, [profile, profileId, toast]);

  /* ---- ações ---- */
  const checkCommit = useCallback(
    (lotId: string, amount: number): CommitResult | { ok: true; position?: undefined } => {
      const st = stateRef.current;
      const pid = profileRef.current;
      const p = st.profiles[pid];
      const base = getLot(lotId);
      if (!base) return { ok: false, reason: 'lote-indisponivel', message: 'Este lote não existe.' };
      const lot = mergeLot(base, st.lotDeltas);
      if (p.onboarding.status === 'bloqueado')
        return { ok: false, reason: 'bloqueado', message: 'O piloto está fechado a investidores qualificados. A tua classificação não permite comprometer capital nesta fase.' };
      if (p.onboarding.status !== 'aprovado') return { ok: false, reason: 'onboarding', message: 'Para comprometer capital é preciso concluir o registo e a verificação (KYC/KYB).' };
      if (!isInvestable(lot)) return { ok: false, reason: 'lote-indisponivel', message: 'Este lote não está aberto a financiamento.' };
      const read = p.riskRead[lotId] ?? [];
      const missing = lot.riskFactors.filter((r) => !read.includes(r.id)).length;
      if (missing > 0) return { ok: false, reason: 'riscos-por-ler', message: `Faltam ler ${missing} de ${lot.riskFactors.length} fatores de risco.` };
      const max = maxCommit(lot);
      const min = Math.min(lot.funding.minTicket, max);
      if (amount < min) return { ok: false, reason: 'montante-minimo', message: `O montante mínimo neste lote é ${eur(min)}.` };
      if (amount > max) return { ok: false, reason: 'montante-maximo', message: `O montante máximo neste lote é ${eur(max)}.` };
      return { ok: true };
    },
    [],
  );

  const commitSeq = useRef(0);
  const rewardSeq = useRef(0);

  const actions = useMemo<GameActions>(() => {
    const pid = () => profileRef.current;
    return {
      completeModule: (moduleId, quizScore) => dispatch({ type: 'completeModule', profile: pid(), moduleId, quizScore }),
      completeQuest: (questId) => dispatch({ type: 'completeQuest', profile: pid(), questId }),
      recordMiniGame: (gameId, score) => dispatch({ type: 'recordMiniGame', profile: pid(), gameId, score }),
      markRiskRead: (lotId, factorId) => dispatch({ type: 'markRiskRead', profile: pid(), lotId, factorId }),
      markAnalysisRead: (lotId) => dispatch({ type: 'markAnalysisRead', profile: pid(), lotId }),
      visitRegion: (regionId) => dispatch({ type: 'visitRegion', profile: pid(), regionId }),
      visitWorld: (worldId) => dispatch({ type: 'visitWorld', profile: pid(), worldId }),
      recordSimRun: (run) => dispatch({ type: 'recordSimRun', profile: pid(), run }),
      updateOnboarding: (patch) => dispatch({ type: 'updateOnboarding', profile: pid(), patch }),
      resetDemo: () => dispatch({ type: 'reset' }),
      checkCommit,
      commitToLot: (lotId, amount) => {
        const check = checkCommit(lotId, amount);
        if (!check.ok) return check as CommitResult;
        const st = stateRef.current;
        const p = st.profiles[pid()];
        const lot = getLot(lotId)!;
        const sealDef = getSealForLot(lot);
        const alreadyHasSeal = sealDef ? p.seals.some((s) => s.sealId === sealDef.id) : true;
        const at = now();
        commitSeq.current += 1;
        const position: Position = {
          id: `pos-s${commitSeq.current}-${lotId}`,
          investorId: pid() === 'demo' ? 'inv-marta-calado' : 'visitante',
          lotId,
          amount: Math.round(amount),
          committedAt: at.toISOString(),
          status: 'aguarda-transferencia',
          session: true,
        };
        dispatch({ type: 'commit', profile: pid(), position });
        return { ok: true, position, sealId: sealDef?.id, firstSealForOrigin: !alreadyHasSeal };
      },
      cancelCommitment: (positionId) => {
        const p = stateRef.current.profiles[pid()];
        const pos = p.commitments.find((x) => x.id === positionId);
        if (!pos) return { ok: false, message: 'Este compromisso já não está ativo.' };
        if (daysBetween(TODAY_DATE, reflectionEndOf(pos.committedAt)) < 0) return { ok: false, message: 'O período de reflexão deste compromisso já terminou.' };
        dispatch({ type: 'cancelCommitment', profile: pid(), positionId });
        return { ok: true };
      },
      requestReward: (req) => {
        rewardSeq.current += 1;
        const request: RewardRequest = { ...req, id: `rq-s${rewardSeq.current}-${req.rewardId}`, at: req.at ?? now().toISOString() };
        dispatch({ type: 'requestReward', profile: pid(), request });
        return request;
      },
      setLearningGoal: (goal) => dispatch({ type: 'setLearningGoal', profile: pid(), goal: goal ? { ...goal, setAt: now().toISOString() } : undefined }),
      decideKyc: (profile, decision, note) => dispatch({ type: 'decideKyc', profile, decision, note }),
    };
  }, [checkCommit]);

  const feed = useLiveFeed({ enabled: true });

  const roleValue = useMemo<RoleCtx>(
    () => ({ role, setRole, roleLabel: ROLE_LABEL[role], profileId, isTeam: role === 'equipa', isVisitor: role === 'visitante' }),
    [role, setRole, profileId],
  );
  const themeValue = useMemo<ThemeCtx>(() => ({ theme, setTheme, resolved: theme === 'system' ? (systemDark ? 'dark' : 'light') : theme }), [theme, setTheme, systemDark]);
  const gameValue = useMemo<GameCtx>(() => ({ state, profileId, profile, actions }), [state, profileId, profile, actions]);

  return (
    <RoleContext.Provider value={roleValue}>
      <ThemeContext.Provider value={themeValue}>
        <GameContext.Provider value={gameValue}>
          <FeedContext.Provider value={feed}>{children}</FeedContext.Provider>
        </GameContext.Provider>
      </ThemeContext.Provider>
    </RoleContext.Provider>
  );
}
