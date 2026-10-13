/* =====================================================================
   Sprout · tipos do domínio (dados de demonstração, fictícios)
   ===================================================================== */

export type WorldId = 'azeite' | 'agua' | 'cafe';
export type MapId = 'pt' | 'cafe';
export type Unit = 'kg' | 'palete' | 'saca';
export type GaugeKind = 'ibc' | 'pallet' | 'sacks';
export type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'crit' | 'info' | 'azeite' | 'agua' | 'cafe' | 'seal';

/* ------------------------------------------------------------ mundos */

export interface GlossaryTerm {
  termo: string;
  definicao: string;
}

export type SeasonPhaseKind = 'colheita' | 'armazenagem' | 'vendas' | 'engarrafamento' | 'procura' | 'secagem' | 'embarque' | 'floracao';

export interface SeasonPhase {
  id: string;
  label: string;
  kind: SeasonPhaseKind;
  /** mês inicial 1–12 */
  startMonth: number;
  /** mês final 1–12 (pode ser < startMonth: atravessa o ano) */
  endMonth: number;
  description: string;
}

export interface World {
  id: WorldId;
  /** "O Olival", "A Nascente", "A Plantação" */
  nome: string;
  commodity: string;
  /** Uma linha, sem marketing. */
  tagline: string;
  description: string;
  unit: Unit;
  /** unidade de preço apresentada: 'kg' ou 'L' */
  priceUnit: 'kg' | 'L';
  gauge: GaugeKind;
  map: MapId;
  fase: 1 | 2;
  investable: boolean;
  /** p.ex. "Fase 2 · abre em 2027" */
  faseLabel?: string;
  season: { id: string; label: string; phases: SeasonPhase[] };
  vocabulario: GlossaryTerm[];
  journeyLabels: Record<JourneyStage, string>;
  hedge: { instrument: HedgeInstrument; label: string; description: string };
  /** físico: o que um lote é, em objetos */
  physical: { container: string; containerCapacity: string; storage: string };
}

/* ------------------------------------------------------------ mapa */

export interface Tile {
  /** coluna (offset odd-r, hexágonos pointy-top) */
  col: number;
  row: number;
}

export interface Region {
  id: string;
  nome: string;
  map: MapId;
  /** país (mapa do café) */
  country?: string;
  tiles: Tile[];
  /** mundos com produtores ou origem relevante nesta região */
  worlds: WorldId[];
  description: string;
}

export type RegionState = 'unexplored' | 'learned' | 'participated';

/* ------------------------------------------------------------ produtores */

export interface TelemetryUnit {
  id: string;
  label: string;
  capacity: number;
  level: number;
}

export interface TelemetryConfig {
  kind: 'depositos' | 'armazem' | 'sacas' | 'nenhuma';
  unitLabel: 'kg' | 'paletes' | 'sacas';
  units: TelemetryUnit[];
  /** recebe eventos ao vivo durante a campanha */
  live: boolean;
  /** incremento por leitura (unidades de unitLabel) */
  ratePerReading: [number, number];
}

export interface Producer {
  id: string;
  nome: string;
  world: WorldId;
  regionId: string;
  localidade: string;
  initials: string;
  story: string;
  /** variedades (azeite), tipo de água, variedade de café */
  variedades: string[];
  certifications: string[];
  capacidade: string;
  since: string;
  fase: 1 | 2;
  telemetry: TelemetryConfig;
}

/* ------------------------------------------------------------ lotes */

export type JourneyStage = 'colhido' | 'analisado' | 'em-deposito' | 'em-venda' | 'expedido' | 'liquidado';
export const JOURNEY_STAGES: JourneyStage[] = ['colhido', 'analisado', 'em-deposito', 'em-venda', 'expedido', 'liquidado'];

export type LotStatus = 'em-preparacao' | 'aberto' | 'financiado' | 'em-extensao' | 'liquidado' | 'fase-2';

export interface Milestone {
  stage: JourneyStage;
  /** data real (cumprido) */
  date?: string;
  /** data prevista (por cumprir) */
  planned?: string;
  note: string;
  done: boolean;
}

export interface QualityParam {
  id: string;
  label: string;
  value: number;
  unit: string;
  comparator: '≤' | '≥' | '>' | '<' | '=';
  limit: number;
  /** texto do limite legal, p.ex. "≤ 0,80 (virgem extra)" */
  limitLabel: string;
  pass: boolean;
}

export interface QualityAnalysis {
  id: string;
  lab: string;
  date: string;
  reportId: string;
  /** classificação resultante, p.ex. "Azeite virgem extra" */
  category: string;
  reference: string;
  params: QualityParam[];
  /** painel sensorial (azeite) */
  panel?: { medianaFrutado: number; medianaDefeito: number; atributos: string[] };
  note?: string;
}

export type HedgeInstrument = 'forward' | 'indexacao' | 'ice-kc' | 'nenhuma';

export interface HedgeCoverage {
  instrument: HedgeInstrument;
  label: string;
  /** fração do volume coberto (0–1) */
  coverage: number;
  /** custo em fração do montante financiado */
  costPct: number;
  counterparty?: string;
  trigger?: string;
  note: string;
}

export interface RiskFactor {
  id: string;
  title: string;
  body: string;
  severity: 'baixa' | 'media' | 'alta';
  mitigation: string;
}

export interface LotEconomics {
  /** referência de mercado (preço a que o comprador B2B compra hoje), €/kg ou €/L */
  refPrice: number;
  /** desconto ao comprador (0.10–0.15) */
  discountPct: number;
  /** preço de venda ao comprador = ref × (1 − desconto) */
  buyerPrice: number;
  /** preço de aquisição ao produtor */
  acquisitionPrice: number;
  /** análises, armazenagem, seguro, logística, cobertura */
  costsPerUnit: number;
  /** custo total financiado por unidade de preço (aquisição + custos) */
  fundingPrice: number;
  /** margem bruta por unidade de preço */
  grossMargin: number;
  /** fração da margem bruta atribuída aos co-financiadores */
  investorShare: number;
  /** fração da margem que a Sprout retém para a reserva de primeira perda */
  reserveShare: number;
  /** liquidação prevista em 18 meses, como fração do capital, [baixo, alto]. Não garantida. */
  expectedRange: [number, number];
}

export interface Lot {
  id: string;
  world: WorldId;
  producerId: string;
  regionId: string;
  campanha: string;
  title: string;
  product: string;
  /** quantidade na unidade do mundo (kg, paletes, sacas) */
  quantity: number;
  unit: Unit;
  /** equivalente em kg (azeite/café) ou litros (água) */
  quantityBase: number;
  baseUnit: 'kg' | 'L';
  economics: LotEconomics;
  funding: {
    goal: number;
    raised: number;
    coFinancers: number;
    minTicket: number;
    maxTicket: number;
    opensAt: string;
    /** data em que o financiamento fechou (100 %) */
    closedAt?: string;
    /** data prevista para abertura (lotes em preparação) */
    opensPlanned?: string;
  };
  status: LotStatus;
  stage: JourneyStage;
  milestones: Milestone[];
  settlement: {
    windowMonths: number;
    start?: string;
    plannedEnd?: string;
    extendedTo?: string;
    settledAt?: string;
    /** resultado efetivo como fração do capital (pode ser negativo) */
    settledResult?: number;
  };
  extension: { maxMonths: number; conditions: string[]; decision: string };
  hedge: HedgeCoverage;
  analyses: QualityAnalysis[];
  riskFactors: RiskFactor[];
  storage: { local: string; container: string; containers: number };
  /** stock físico atual no armazenamento (unidade do lote) */
  stock: number;
  buyer?: { segment: 'Distribuição' | 'HoReCa' | 'Retalho' | 'Cash & carry' | 'Exportação'; descricao: string };
  refundingPlaybookId?: string;
}

/* ------------------------------------------------------------ mercado */

export interface MarketPoint {
  /** 'YYYY-MM' (mensal) ou 'YYYY-MM-DD' (diário) */
  t: string;
  value: number;
}

export interface MarketSeries {
  world: WorldId;
  label: string;
  unit: string;
  note: string;
  monthly: MarketPoint[];
  daily: MarketPoint[];
}

/* ------------------------------------------------------------ investidores */

export type InvestorClass = 'profissional' | 'qualificado' | 'nao-qualificado';
export type KycStatus = 'aprovado' | 'em-analise' | 'pendente' | 'bloqueado' | 'recusado' | 'nao-iniciado';

export interface Investor {
  id: string;
  nome: string;
  tipo: 'pessoa-coletiva' | 'pessoa-singular';
  classe: InvestorClass;
  kyc: KycStatus;
  pais: string;
  since?: string;
  nota?: string;
  demo?: boolean;
}

export type PositionStatus = 'ativo' | 'liquidado' | 'aguarda-transferencia';

export interface Position {
  id: string;
  investorId: string;
  lotId: string;
  amount: number;
  committedAt: string;
  fundedAt?: string;
  status: PositionStatus;
  /** resultado efetivo, se liquidado */
  settledResult?: number;
  /** compromisso feito nesta sessão de demonstração */
  session?: boolean;
}

/* ------------------------------------------------------------ jogo */

export interface OriginSealDef {
  id: string;
  producerId: string;
  regionId: string;
  world: WorldId;
  campanha: string;
  initials: string;
  /** como se ganha: compromisso num lote do produtor/campanha, ou missões de diligência */
  earnable: 'compromisso' | 'diligencia' | 'ambos';
  questIds: string[];
}

export interface EarnedSeal {
  sealId: string;
  at: string;
  by: 'compromisso' | 'diligencia';
  lotId?: string;
}

export type LevelId = 'aprendiz' | 'provador' | 'lagareiro' | 'mestre';

export interface KnowledgeLevel {
  id: LevelId;
  nome: string;
  minPoints: number;
  description: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface KnowledgeModule {
  id: string;
  world: WorldId | 'geral';
  title: string;
  summary: string;
  minutes: number;
  points: number;
  sections: { heading: string; body: string[] }[];
  quiz: QuizQuestion[];
}

export type QuestCriteria =
  | { type: 'module'; moduleId: string }
  | { type: 'minigame'; gameId: MiniGameId; minScore: number }
  | { type: 'risk-read'; lotId: string }
  | { type: 'analysis-read'; lotId: string }
  | { type: 'sim-complete' }
  | { type: 'region-visit'; regionId: string }
  | { type: 'world-visit'; worldId: WorldId }
  | { type: 'manual' };

export interface Quest {
  id: string;
  title: string;
  description: string;
  world: WorldId | 'geral';
  points: number;
  lotId?: string;
  sealId?: string;
  criteria: QuestCriteria;
  /** onde se cumpre (rota da app) */
  href: string;
}

/* ------------------------------------------------------------ mini-jogos */

export type MiniGameId = 'painel-prova' | 'le-o-rotulo' | 'cereja-chavena';

export interface MiniGameMeta {
  id: MiniGameId;
  world: WorldId;
  title: string;
  summary: string;
  maxScore: number;
  maxPoints: number;
}

export interface SensoryAttribute {
  id: string;
  nome: string;
  tipo: 'positivo' | 'defeito';
  descricao: string;
  causa?: string;
}

export interface OliveSample {
  id: string;
  label: string;
  origem: string;
  acidez: number;
  peroxidos: number;
  k232: number;
  k268: number;
  deltaK: number;
  medianaDefeito: number;
  medianaFrutado: number;
  /** descrição do provador */
  notas: string;
  atributos: string[];
  defeitos: string[];
}

export type OliveCategory = 'virgem-extra' | 'virgem' | 'lampante';

export interface WaterLabel {
  id: string;
  marca: string;
  tipo: 'mineral natural' | 'de nascente';
  origem: string;
  residuoSeco: number;
  ph: number;
  sodio: number;
  bicarbonato: number;
  calcio: number;
  magnesio: number;
  silica: number;
  fluoreto: number;
  co2Livre?: number;
  /** restantes iões do rótulo (mg/L): somados aos anteriores e à sílica dão a mineralização total */
  potassio: number;
  cloreto: number;
  sulfato: number;
  nitrato: number;
  carbonato?: number;
}

export interface WaterClass {
  id: string;
  label: string;
  rule: string;
  test: (w: WaterLabel) => boolean;
}

export interface CoffeeProcess {
  id: 'lavado' | 'natural' | 'honey';
  nome: string;
  descricao: string;
  perfil: string;
  passos: string[];
}

export interface CoffeeStep {
  id: string;
  order: number;
  nome: string;
  descricao: string;
}

export interface CoffeeDefect {
  id: string;
  nome: string;
  categoria: 1 | 2;
  /** n.º de grãos que conta como 1 defeito completo */
  equivalencia: number;
  descricao: string;
}

export interface CoffeeSample {
  id: string;
  label: string;
  origem: string;
  processo: CoffeeProcess['id'];
  humidade: number;
  defeitosCat1: number;
  defeitosCompletosCat2: number;
  pontuacao: number;
  notas: string;
}

/* ------------------------------------------------------------ simulador */

export interface SimLot {
  id: string;
  world: WorldId;
  nome: string;
  origem: string;
  /** € por unidade de preço (kg ou L) tudo incluído */
  fundingPrice: number;
  priceUnit: 'kg' | 'L';
  /** margem bruta esperada para os co-financiadores, fração em 18 meses */
  expectedMargin: number;
  /** desvio mensal típico do preço de referência */
  monthlyVolatility: number;
  hedge: { available: boolean; instrument: HedgeInstrument; label: string; coverage: number; costPct: number };
  /** mês (1–18) em que começam e terminam as vendas, em cenário base */
  salesWindow: [number, number];
}

export interface SimEventEffect {
  /** choque de preço (fração; −0.3 = −30 %) */
  priceShock?: number;
  /** perda de quantidade vendável (fração) */
  qtyLoss?: number;
  /** atraso das vendas (meses) */
  salesDelayMonths?: number;
  /** fração do stock desclassificado (azeite: VE → V) e desconto aplicado */
  downgrade?: { share: number; discount: number };
  /** aceleração de vendas (meses a menos) e prémio de preço */
  demand?: { monthsFaster: number; premium: number };
  /** custo extra (fração do montante) */
  extraCost?: number;
}

export interface SimEvent {
  id: string;
  title: string;
  description: string;
  worlds: WorldId[];
  /** probabilidade por mês, por lote exposto */
  probPerMonth: number;
  /** meses em que pode ocorrer (1–18) */
  months: [number, number];
  effect: SimEventEffect;
  /** a cobertura atenua o efeito de preço */
  hedgeMitigates: boolean;
  tone: 'adverso' | 'favoravel';
}

export interface SimRules {
  budget: number;
  months: number;
  minAllocation: number;
  maxPerLot: number;
  firstLossReservePct: number;
  extension: { maxMonths: number; trigger: string; monthlyCostPct: number };
  refunding: { trigger: string; description: string; costPct: number };
  disclaimer: string;
}

export interface SimRunResult {
  id: string;
  at: string;
  seed: number;
  allocations: { simLotId: string; amount: number; hedged: boolean }[];
  invested: number;
  finalValue: number;
  /** (final − investido) / investido */
  result: number;
  extended: boolean;
  refunded: boolean;
  events: string[];
}

/* ------------------------------------------------------------ diário */

export type CampaignEventKind =
  | 'telemetria'
  | 'colheita'
  | 'rececao'
  | 'analise'
  | 'engarrafamento'
  | 'financiamento'
  | 'expedicao'
  | 'venda'
  | 'liquidacao'
  | 'cobertura'
  | 'extensao'
  | 'qualidade';

export interface CampaignEvent {
  id: string;
  at: string;
  world: WorldId;
  kind: CampaignEventKind;
  producerId?: string;
  lotId?: string;
  title: string;
  detail?: string;
  live?: boolean;
}

/* ------------------------------------------------------------ bastidores */

export interface PilotKpi {
  id: string;
  label: string;
  value: number;
  format: 'pct' | 'eur' | 'num' | 'dias' | 'meses';
  target: number;
  /** maior é melhor? */
  higherIsBetter: boolean;
  status: 'ok' | 'warn' | 'crit';
  note: string;
  history: number[];
}

export interface ReconciliationRun {
  date: string;
  pspBalance: number;
  ledgerBalance: number;
  difference: number;
  status: 'conciliado' | 'diferenca-resolvida' | 'em-aberto';
  note?: string;
  closedAt: string;
}

export interface KycCase {
  id: string;
  investorId?: string;
  nome: string;
  tipo: 'pessoa-coletiva' | 'pessoa-singular';
  classe: InvestorClass;
  submittedAt: string;
  status: KycStatus;
  risco: 'baixo' | 'medio' | 'elevado';
  flags: string[];
  responsavel: string;
}

export interface HedgeTrigger {
  id: string;
  lotId: string;
  instrument: HedgeInstrument;
  description: string;
  threshold: string;
  current: string;
  status: 'armado' | 'disparado' | 'executado' | 'inativo';
  updatedAt: string;
}

export interface RefundingPlaybook {
  id: string;
  world: WorldId;
  title: string;
  trigger: string;
  steps: { order: number; title: string; owner: string; sla: string }[];
  appliesTo: string[];
}

export interface Transaction {
  id: string;
  date: string;
  type: 'entrada-investidor' | 'pagamento-produtor' | 'recebimento-comprador' | 'liquidacao-investidor' | 'custo-operacional' | 'cobertura';
  counterparty: string;
  lotId?: string;
  amount: number;
  rail: 'SEPA' | 'SEPA Instant';
  status: 'liquidada' | 'pendente' | 'em-transito';
}

export interface ExecutionPlanRow {
  responsavel: string;
  area: string;
  entregaveis: string;
  foco: string;
}

export interface ActionItem {
  id: string;
  owner: string;
  ownerLabel: string;
  text: string;
  due: string;
  done: boolean;
}

/* ------------------------------------------------------------ onboarding */

export type OnboardingStatus = 'nao-iniciado' | 'em-curso' | 'em-analise' | 'aprovado' | 'bloqueado';

export interface OnboardingState {
  status: OnboardingStatus;
  step: number;
  tipo?: 'pessoa-coletiva' | 'pessoa-singular';
  classe?: InvestorClass;
  nome?: string;
  pais?: string;
  /** respostas do teste de adequação (id → índice) */
  adequacao: Record<string, number>;
  documentos: string[];
  blockedReason?: string;
  updatedAt?: string;
  /** última decisão da equipa de compliance (Bastidores) */
  reviewDecision?: 'aprovar' | 'pedir-info' | 'rejeitar';
  reviewNote?: string;
  reviewedAt?: string;
}

/* ------------------------------------------------------------ recompensas e objetivos */

export type RewardId = 'certificado' | 'prova-online' | 'amostra' | 'relatorio' | 'visita-lagar' | 'visita-nascente' | 'prova-cafe';

export interface RewardDef {
  id: RewardId;
  title: string;
  what: string;
  /** condição de desbloqueio: nível mínimo, missões, ou participação num lote (qualquer montante) */
  unlock: { level?: LevelId; quests?: string[]; participation?: boolean };
  unlockText: string;
  /** texto do botão */
  action: string;
  kind: 'certificado' | 'sessao' | 'amostra' | 'relatorio' | 'visita';
  /** opções do pedido (datas, locais) */
  slots?: { id: string; label: string }[];
  places?: { id: string; label: string }[];
  /** o que acontece depois do pedido */
  after: string;
}

/** Pedido de recompensa em espécie (amostra, sessão, visita, relatório). Nunca dinheiro. */
export interface RewardRequest {
  id: string;
  rewardId: RewardId;
  /** data do pedido (ISO) */
  at: string;
  /** o que foi pedido: lote, sessão, local */
  detail: string;
  status: string;
  lotId?: string;
  /** opção escolhida (envio, levantamento, sessão, local) */
  option?: string;
}

/** Foco do objetivo de aprendizagem: um mundo, ou perceber o risco antes do primeiro compromisso. */
export type LearningFocus = 'risco' | WorldId;

export interface LearningGoalState {
  focus: LearningFocus;
  /** nível de conhecimento a alcançar (opcional) */
  level?: LevelId;
  setAt: string;
}

/** Compromisso cancelado dentro do período de reflexão. */
export interface CancelledCommitment {
  positionId: string;
  lotId: string;
  amount: number;
  committedAt: string;
  at: string;
}

/** Liga de campanha do Simulador: adesão voluntária, pseudónimo, dinheiro fictício. */
export interface LeagueState {
  optIn: boolean;
  /** índice na lista de pseudónimos de campo */
  pseudonymIndex: number;
}
