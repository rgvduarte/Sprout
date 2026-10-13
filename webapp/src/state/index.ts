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
import type { CampaignEvent, CancelledCommitment, EarnedSeal, LeagueState, Investor, KnowledgeLevel, LearningGoalState, Lot, OriginSealDef, Position, Producer, Region, RegionState, RewardRequest, WorldId } from '../data/types';
import type { TelemetryState } from '../lib/useLiveFeed';
import { FeedContext, FeedRefContext, GameContext, RoleContext, TEAM_VIEW_MESSAGE, ThemeContext, type CommitFailure, type GameActions } from './AppProvider';
import { allPositions, knowledgePoints, mergeLot, regionStates } from './gameStore';

export { AppProvider, ROLES, ROLE_LABEL, THEMES, THEME_LABEL, applyTheme, REFLECTION_DAYS, reflectionEndOf, TEAM_VIEW_MESSAGE } from './AppProvider';
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

/**
 * Diário ao vivo (eventos gerados nesta sessão), telemetria dos produtores e
 * estado de pausa. Re-renderiza a cada leitura (~6,5 s): usar só em widgets do
 * Diário e da telemetria, nunca no topo de uma página.
 */
export const useFeed = () => need(useContext(FeedContext), 'useFeed');

/** Telemetria dos produtores (depósitos, armazéns), ao vivo. Só para widgets de telemetria. */
export function useTelemetry(): TelemetryState {
  return useFeed().telemetry;
}

/** Diário de campanha: eventos ao vivo desta sessão + histórico, mais recente primeiro. Só para widgets do Diário. */
export function useCampaignEvents(): CampaignEvent[] {
  const { events } = useFeed();
  return useMemo(() => [...events, ...CAMPAIGN_EVENTS], [events]);
}

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
  /** Liga de campanha (Simulador, dinheiro fictício) */
  league: LeagueState;
  /** pode comprometer capital (onboarding aprovado, e não é a vista da equipa) */
  canCommit: boolean;
  /** motivo genérico de bloqueio, independente do lote */
  commitBlock: Extract<CommitFailure, 'onboarding' | 'bloqueado' | 'equipa'> | null;
  commitBlockMessage: string | null;
  /**
   * Vista da equipa: lê os dados da investidora de demonstração, mas o que
   * a equipa aprende, joga ou abre fica num perfil próprio e não pode
   * comprometer capital em nome da investidora.
   */
  teamView: boolean;
}

/** Estado do jogo do perfil ativo + ações. */
export function useGame(): GameView {
  const ctx = need(useContext(GameContext), 'useGame');
  const { profile, actions, profileId, teamView } = ctx;
  return useMemo(() => {
    const points = knowledgePoints(profile);
    const { level, next, progress } = levelForPoints(points);
    const modules = new Set(profile.modulesCompleted.map((m) => m.id));
    const quests = new Map(profile.questsCompleted.map((q) => [q.id, q.at]));
    const status = profile.onboarding.status;
    const commitBlock = teamView ? 'equipa' : status === 'aprovado' ? null : status === 'bloqueado' ? 'bloqueado' : 'onboarding';
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
      league: profile.league,
      canCommit: commitBlock === null,
      commitBlock,
      commitBlockMessage:
        commitBlock === 'equipa'
          ? TEAM_VIEW_MESSAGE
          : commitBlock === 'bloqueado'
            ? 'O piloto está fechado a investidores qualificados.'
            : commitBlock === 'onboarding'
              ? 'Para comprometer capital é preciso concluir o registo e a verificação.'
              : null,
      teamView,
    };
  }, [profile, actions, profileId, teamView]);
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
  /**
   * @deprecated usar useCampaignEvents() no widget que mostra o Diário. Aqui é
   * uma leitura no momento (não re-renderiza a cada leitura ao vivo).
   */
  events: CampaignEvent[];
  /** @deprecated usar useTelemetry() no widget de telemetria (leitura no momento, sem re-render). */
  telemetry: TelemetryState;
}

const VISITOR: Investor = { id: 'visitante', nome: 'Visitante', tipo: 'pessoa-singular', classe: 'nao-qualificado', kyc: 'nao-iniciado', pais: 'Portugal' };

/**
 * Dados do perfil ativo: lotes, posições, selos, regiões. Os números batem
 * certo em todas as páginas. Não depende do Diário ao vivo: as leituras de
 * telemetria (a cada ~6,5 s) não voltam a calcular lotes nem posições nem
 * re-renderizam as páginas; os widgets do Diário usam useCampaignEvents() e
 * useTelemetry().
 */
export function useData(): DataView {
  const ctx = need(useContext(GameContext), 'useData');
  const feedRef = need(useContext(FeedRefContext), 'useData');
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
      get events() {
        return [...feedRef.current.events, ...CAMPAIGN_EVENTS];
      },
      get telemetry() {
        return feedRef.current.telemetry;
      },
    };
  }, [state.lotDeltas, profile, profileId, feedRef]);
}
