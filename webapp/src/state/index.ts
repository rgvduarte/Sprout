import { useContext, useMemo } from 'react';
import {
  getLot as getStaticLot,
  getProducer,
  getRegion,
  INVESTORS,
  DEMO_INVESTOR_ID,
  levelForPoints,
  LOTS,
  SEALS,
  CAMPAIGN_EVENTS,
} from '../data';
import type { CampaignEvent, CancelledCommitment, EarnedSeal, Investor, KnowledgeLevel, LearningGoalState, Lot, OriginSealDef, Position, Producer, Region, RegionState, RewardRequest, WorldId } from '../data/types';
import type { TelemetryState } from '../lib/useLiveFeed';
import { FeedContext, GameContext, RoleContext, ThemeContext, type CommitFailure, type GameActions } from './AppProvider';
import { allPositions, knowledgePoints, mergeLot, regionStates } from './gameStore';

export { AppProvider, ROLES, ROLE_LABEL, THEMES, THEME_LABEL, applyTheme, REFLECTION_DAYS, reflectionEndOf } from './AppProvider';
export type { Role, ThemePref, CommitResult, CommitFailure, GameActions } from './AppProvider';
export type { ProfileId, ProfileState, GameState, KycDecisionKind } from './gameStore';
export { useToast } from './toast';
export { knowledgePoints, mergeLot, transferReference } from './gameStore';

function need<T>(v: T | null, name: string): T {
  if (!v) throw new Error(`${name} fora do AppProvider`);
  return v;
}

/** Papel atual ("Ver como"): investidor | visitante | equipa. */
export const useRole = () => need(useContext(RoleContext), 'useRole');

/** Preferência de tema: system | light | dark (+ tema resolvido). */
export const useTheme = () => need(useContext(ThemeContext), 'useTheme');

/** Diário ao vivo (eventos gerados nesta sessão) e telemetria dos produtores. */
export const useFeed = () => need(useContext(FeedContext), 'useFeed');

export interface GameView extends GameActions {
  profileId: 'demo' | 'visitante';
  /** pontos de conhecimento (nunca dinheiro) */
  points: number;
  level: KnowledgeLevel;
  nextLevel?: KnowledgeLevel;
  /** 0–1 até ao próximo nível */
  levelProgress: number;
  pointsToNext: number;
  isModuleDone: (id: string) => boolean;
  isQuestDone: (id: string) => boolean;
  questCompletedAt: (id: string) => string | undefined;
  miniGameBest: (id: 'painel-prova' | 'le-o-rotulo' | 'cereja-chavena') => number | undefined;
  riskRead: (lotId: string) => string[];
  hasReadAnalysis: (lotId: string) => boolean;
  simRuns: import('../data/types').SimRunResult[];
  onboarding: import('../data/types').OnboardingState;
  /** mundos já visitados pelo perfil ativo */
  worldsVisited: WorldId[];
  /** regiões abertas no mapa */
  regionsVisited: string[];
  /** pedidos de recompensas em espécie, mais recente primeiro */
  rewardRequests: RewardRequest[];
  /** pedido de amostra deste lote, se existir (uma por lote, qualquer montante) */
  sampleRequest: (lotId: string) => RewardRequest | undefined;
  /** objetivo de aprendizagem partilhado entre registo, Início e Academia */
  learningGoal?: LearningGoalState;
  /** compromissos cancelados no período de reflexão */
  cancelled: CancelledCommitment[];
  /** pode comprometer capital (onboarding aprovado) */
  canCommit: boolean;
  /** motivo genérico de bloqueio, independente do lote */
  commitBlock: Extract<CommitFailure, 'onboarding' | 'bloqueado'> | null;
  commitBlockMessage: string | null;
}

/** Estado do jogo do perfil ativo + ações. */
export function useGame(): GameView {
  const ctx = need(useContext(GameContext), 'useGame');
  const { profile, actions, profileId } = ctx;
  return useMemo(() => {
    const points = knowledgePoints(profile);
    const { level, next, progress } = levelForPoints(points);
    const modules = new Set(profile.modulesCompleted.map((m) => m.id));
    const quests = new Map(profile.questsCompleted.map((q) => [q.id, q.at]));
    const status = profile.onboarding.status;
    const commitBlock = status === 'aprovado' ? null : status === 'bloqueado' ? 'bloqueado' : 'onboarding';
    return {
      ...actions,
      profileId,
      points,
      level,
      nextLevel: next,
      levelProgress: progress,
      pointsToNext: next ? next.minPoints - points : 0,
      isModuleDone: (id) => modules.has(id),
      isQuestDone: (id) => quests.has(id),
      questCompletedAt: (id) => quests.get(id),
      miniGameBest: (id) => profile.miniGames[id]?.bestScore,
      riskRead: (lotId) => profile.riskRead[lotId] ?? [],
      hasReadAnalysis: (lotId) => profile.analysesRead.includes(lotId),
      simRuns: profile.simRuns,
      onboarding: profile.onboarding,
      worldsVisited: profile.worldsVisited,
      regionsVisited: profile.regionsVisited,
      rewardRequests: profile.rewardRequests,
      sampleRequest: (lotId) => profile.rewardRequests.find((r) => r.rewardId === 'amostra' && r.lotId === lotId),
      learningGoal: profile.learningGoal,
      cancelled: profile.cancelled,
      canCommit: commitBlock === null,
      commitBlock,
      commitBlockMessage:
        commitBlock === 'bloqueado'
          ? 'O piloto está fechado a investidores qualificados.'
          : commitBlock === 'onboarding'
            ? 'Para comprometer capital é preciso concluir o registo e a verificação.'
            : null,
    };
  }, [profile, actions, profileId]);
}

export interface PositionView extends Position {
  lot: Lot;
  producer: Producer;
}

export interface SealView {
  def: OriginSealDef;
  producer: Producer;
  region: Region;
  earned?: EarnedSeal;
}

export interface DataView {
  /** todos os lotes, com o efeito dos compromissos da sessão */
  lots: Lot[];
  getLot: (id: string) => Lot | undefined;
  lotsByWorld: (world: WorldId) => Lot[];
  /** posições do perfil ativo (sementes + compromissos da sessão) */
  positions: PositionView[];
  /** soma das posições ativas (montante financiado) */
  totalFinanced: number;
  investor: Investor;
  seals: SealView[];
  earnedSeals: SealView[];
  regionStates: Record<string, RegionState>;
  /** diário: ao vivo + histórico, mais recente primeiro */
  events: CampaignEvent[];
  telemetry: TelemetryState;
}

const VISITOR: Investor = { id: 'visitante', nome: 'Visitante', tipo: 'pessoa-singular', classe: 'nao-qualificado', kyc: 'nao-iniciado', pais: 'Portugal' };

/** Dados vivos do perfil ativo. Os números batem certo em todas as páginas. */
export function useData(): DataView {
  const ctx = need(useContext(GameContext), 'useData');
  const feed = need(useContext(FeedContext), 'useData');
  const { state, profile, profileId } = ctx;
  return useMemo(() => {
    const lots = LOTS.map((l) => mergeLot(l, state.lotDeltas));
    const byId = new Map(lots.map((l) => [l.id, l]));
    const positions: PositionView[] = allPositions(profile, profileId).map((p) => {
      const lot = byId.get(p.lotId) ?? getStaticLot(p.lotId)!;
      return { ...p, lot, producer: getProducer(lot.producerId)! };
    });
    const earnedMap = new Map(profile.seals.map((s) => [s.sealId, s]));
    const seals: SealView[] = SEALS.map((def) => ({ def, producer: getProducer(def.producerId)!, region: getRegion(def.regionId)!, earned: earnedMap.get(def.id) }));
    const investor =
      profileId === 'demo'
        ? INVESTORS.find((i) => i.id === DEMO_INVESTOR_ID)!
        : { ...VISITOR, nome: profile.onboarding.nome ?? VISITOR.nome, kyc: profile.onboarding.status === 'aprovado' ? 'aprovado' : profile.onboarding.status === 'bloqueado' ? 'bloqueado' : profile.onboarding.status === 'em-analise' ? 'em-analise' : 'nao-iniciado', classe: profile.onboarding.classe ?? 'nao-qualificado' } as Investor;
    return {
      lots,
      getLot: (id) => byId.get(id),
      lotsByWorld: (world) => lots.filter((l) => l.world === world),
      positions,
      totalFinanced: positions.filter((p) => p.status !== 'liquidado').reduce((s, p) => s + p.amount, 0),
      investor,
      seals,
      earnedSeals: seals.filter((s) => s.earned),
      regionStates: regionStates(profile, profileId),
      events: [...feed.events, ...CAMPAIGN_EVENTS],
      telemetry: feed.telemetry,
    };
  }, [state.lotDeltas, profile, profileId, feed.events, feed.telemetry]);
}

