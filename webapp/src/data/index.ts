import { CAMPAIGN_EVENTS } from './events';
import { LEVELS, MODULES, QUESTS, SEALS, SIM_COMPLETE_POINTS } from './game';
import { DEMO_INVESTOR_ID, INVESTORS, SEED_POSITIONS } from './investors';
import { LOTS } from './lots';
import { MARKET, MARKET_TODAY } from './market';
import { MINI_GAMES } from './minigames';
import { PRODUCERS } from './producers';
import type {
  JourneyStage,
  KnowledgeLevel,
  Lot,
  LotStatus,
  MapId,
  MiniGameId,
  Position,
  Tone,
  WorldId,
} from './types';
import { REGIONS, WORLDS } from './worlds';

/* =====================================================================
   Seletores puros sobre os dados estáticos. Para valores que o jogo altera
   (financiamento de um lote depois de um compromisso, posições, selos,
   regiões iluminadas) usar useData() de src/state.
   ===================================================================== */

export * from './types';
export { WORLDS, REGIONS } from './worlds';
export { PRODUCERS } from './producers';
export { LOTS, INVESTOR_SHARE, RESERVE_SHARE, SETTLEMENT_MONTHS, EXTENSION_MONTHS } from './lots';
export { MARKET, MARKET_TODAY } from './market';
export { INVESTORS, DEMO_INVESTOR_ID, SEED_POSITIONS, SEED_SEALS } from './investors';
export { LEVELS, MODULES, QUESTS, SEALS, DEMO_PROGRESS, SIM_COMPLETE_POINTS } from './game';
export * from './minigames';
export { SIM_RULES, SIM_LOTS, SIM_EVENTS } from './simulator';
export { CAMPAIGN_EVENTS, EVENT_KIND_LABEL } from './events';
export { PILOT_KPIS, RECONCILIATION, KYC_QUEUE, HEDGE_TRIGGERS, REFUNDING_PLAYBOOKS, TRANSACTIONS } from './backstage';
export { EXECUTION_PLAN, ACTION_ITEMS, SOURCE_DOC, PRODUCT_DIRECTIVE } from './plan';

/* ------------------------------------------------------------ mundos e mapa */

export const WORLD_IDS: WorldId[] = ['azeite', 'agua', 'cafe'];
export const isWorldId = (v: string | undefined): v is WorldId => v === 'azeite' || v === 'agua' || v === 'cafe';

export const getWorld = (id: WorldId) => WORLDS.find((w) => w.id === id)!;
export const getRegion = (id: string) => REGIONS.find((r) => r.id === id);
export const getRegionsByMap = (map: MapId) => REGIONS.filter((r) => r.map === map);
export const getRegionsByWorld = (world: WorldId) => REGIONS.filter((r) => r.worlds.includes(world));

export const getProducer = (id: string) => PRODUCERS.find((p) => p.id === id);
export const getProducersByWorld = (world: WorldId) => PRODUCERS.filter((p) => p.world === world);
export const getProducersByRegion = (regionId: string) => PRODUCERS.filter((p) => p.regionId === regionId);

/* ------------------------------------------------------------ lotes */

export const getLot = (id: string) => LOTS.find((l) => l.id === id);
export const getLotsByWorld = (world: WorldId) => LOTS.filter((l) => l.world === world);
export const getLotsByProducer = (producerId: string) => LOTS.filter((l) => l.producerId === producerId);
export const getLotsByRegion = (regionId: string) => LOTS.filter((l) => l.regionId === regionId);

/** Lotes onde é possível comprometer capital hoje. */
export const isInvestable = (lot: Lot) => lot.status === 'aberto' && lot.funding.raised < lot.funding.goal;
export const fundedFraction = (lot: Pick<Lot, 'funding'>) => (lot.funding.goal > 0 ? Math.min(1, lot.funding.raised / lot.funding.goal) : 0);
export const remainingToFund = (lot: Pick<Lot, 'funding'>) => Math.max(0, lot.funding.goal - lot.funding.raised);

/** Montante máximo que um compromisso pode ter neste lote. */
export const maxCommit = (lot: Lot) => Math.min(lot.funding.maxTicket, remainingToFund(lot));

export const STATUS_LABEL: Record<LotStatus, string> = {
  'em-preparacao': 'Em preparação',
  aberto: 'Aberto a financiamento',
  financiado: 'Financiado',
  'em-extensao': 'Em extensão',
  liquidado: 'Liquidado',
  'fase-2': 'Fase 2 · pré-visualização',
};

export const STATUS_TONE: Record<LotStatus, Tone> = {
  'em-preparacao': 'neutral',
  aberto: 'accent',
  financiado: 'info',
  'em-extensao': 'warn',
  liquidado: 'ok',
  'fase-2': 'cafe',
};

export const stageLabel = (world: WorldId, stage: JourneyStage) => getWorld(world).journeyLabels[stage];
export const stageIndex = (stage: JourneyStage) => ['colhido', 'analisado', 'em-deposito', 'em-venda', 'expedido', 'liquidado'].indexOf(stage);

/** Unidade física da quantidade do lote, em texto. */
export function unitLabel(lot: Pick<Lot, 'unit' | 'quantity'>): string {
  const n = lot.quantity;
  if (lot.unit === 'kg') return 'kg';
  if (lot.unit === 'palete') return n === 1 ? 'palete' : 'paletes';
  return n === 1 ? 'saca' : 'sacas';
}

/** Unidade de preço do lote: 'kg' ou 'L'. */
export const priceUnit = (lot: Pick<Lot, 'world'>) => getWorld(lot.world).priceUnit;

/** Referência de mercado de hoje e variação face à referência de entrada do lote. */
export function marketVsEntry(lot: Lot): { today: number; entry: number; change: number } {
  const today = MARKET_TODAY[lot.world];
  return { today, entry: lot.economics.refPrice, change: today / lot.economics.refPrice - 1 };
}

export const getMarketSeries = (world: WorldId) => MARKET.find((m) => m.world === world)!;

/* ------------------------------------------------------------ investidores */

export const getInvestor = (id: string) => INVESTORS.find((i) => i.id === id);
export const getDemoInvestor = () => getInvestor(DEMO_INVESTOR_ID)!;
export const getSeedPositions = (investorId: string = DEMO_INVESTOR_ID): Position[] => SEED_POSITIONS.filter((p) => p.investorId === investorId);

/* ------------------------------------------------------------ jogo */

export const getLevels = () => LEVELS;
export function levelForPoints(points: number): { level: KnowledgeLevel; next?: KnowledgeLevel; progress: number } {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (points >= l.minPoints) idx = i;
  });
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const progress = next ? (points - level.minPoints) / (next.minPoints - level.minPoints) : 1;
  return { level, next, progress: Math.max(0, Math.min(1, progress)) };
}

export const getModule = (id: string) => MODULES.find((m) => m.id === id);
export const getModulesByWorld = (world: WorldId | 'geral') => MODULES.filter((m) => m.world === world);
export const getQuest = (id: string) => QUESTS.find((q) => q.id === id);
export const getQuestsByLot = (lotId: string) => QUESTS.filter((q) => q.lotId === lotId);
export const getQuestsByWorld = (world: WorldId | 'geral') => QUESTS.filter((q) => q.world === world);
export const getSeal = (id: string) => SEALS.find((s) => s.id === id);
/** Selo de origem correspondente a um lote (produtor + campanha). */
export const getSealForLot = (lot: Pick<Lot, 'producerId' | 'campanha'>) => SEALS.find((s) => s.producerId === lot.producerId && s.campanha === lot.campanha);
export const getMiniGame = (id: MiniGameId) => MINI_GAMES.find((g) => g.id === id)!;

/* ------------------------------------------------------------ diário */

export const getEvents = (filter: { world?: WorldId; lotId?: string; producerId?: string; limit?: number } = {}) => {
  const list = CAMPAIGN_EVENTS.filter(
    (e) => (!filter.world || e.world === filter.world) && (!filter.lotId || e.lotId === filter.lotId) && (!filter.producerId || e.producerId === filter.producerId),
  );
  return filter.limit ? list.slice(0, filter.limit) : list;
};

export const TOTAL_KNOWLEDGE_POINTS =
  MODULES.reduce((s, m) => s + m.points, 0) + QUESTS.reduce((s, q) => s + q.points, 0) + MINI_GAMES.reduce((s, g) => s + g.maxPoints, 0) + SIM_COMPLETE_POINTS;
