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
  /** modelo de negócio do mundo: principal (compra e venda do lote) ou agente (cesto, comissão, sem financiamento) */
  model: LotModel;
  /** p.ex. "Fase 2 · não investível", "Cesto · sem financiamento" */
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

export type LotStatus = 'em-preparacao' | 'aberto' | 'financiado' | 'em-extensao' | 'liquidado' | 'fase-2' | 'cesto';

/** Modelo do lote: principal (a Sprout compra e vende o lote, financiado por cofinanciadores) ou agente (cesto: comissão, sem stock nem fundos de terceiros). */
export type LotModel = 'principal' | 'agente';

/** Canal de venda do lote. */
export type SalesChannel = 'horeca' | 'distribuicao' | 'cesto' | 'torrefacao';

/** Linha de custo por unidade de preço (€/kg ou €/L). */
export interface CostLine {
  id: string;
  label: string;
  value: number;
}

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
  /** gatilho já executado: fração do volume vendida a prazo depois, ao índice de origem desse dia */
  executed?: { share: number; index: number; date: string };
}

export interface RiskFactor {
  id: string;
  title: string;
  body: string;
  severity: 'baixa' | 'media' | 'alta';
  mitigation: string;
}

export interface LotEconomics {
  /** principal (azeite, café) ou agente (água: cesto, comissão) */
  model: LotModel;
  /** canal de venda do lote */
  channel: SalesChannel;
  /** "HoReCa e lojas gourmet", "Distribuidores e exportadores", "Cesto HoReCa · agente", "Microtorrefações" */
  channelLabel: string;
  /**
   * Referência do canal na abertura do lote (preço embalado, não granel), €/kg ou €/L:
   * referência HoReCa embalada, preço de saída do embalador, referência B2B da água, preço a microtorrefações.
   */
  refPrice: number;
  /** nome da referência do canal, p.ex. "Referência HoReCa embalada" */
  refLabel: string;
  /** fonte ou estado da referência, p.ex. "a validar no piloto: ≥ 20 cotações com mediana ≥ 6,00 €/kg" */
  refNote: string;
  /** desconto ao comprador sobre a referência do canal (HoReCa 0,10; distribuidores 0) */
  discountPct: number;
  /** prémio de origem pago pelo comprador acima da referência, por unidade (distribuidores 0,10 €/kg) */
  originPremium: number;
  /** preço ao comprador = refPrice × (1 − discountPct) + originPremium */
  buyerPrice: number;
  /** frase pronta sobre o preço ao comprador (usar em vez de "X % abaixo da referência de Y") */
  priceBasis: string;
  /** índice de origem a granel na abertura (azeite, €/kg); na água e no café, a referência de mercado na abertura */
  indexAtOpen: number;
  /** prémio pago ao produtor acima do índice, por unidade (azeite: 0,15 HoReCa, 0,10 distribuidores) */
  producerPremium: number;
  /** preço de aquisição ao produtor = indexAtOpen + producerPremium (0 no modelo agente: a Sprout não compra) */
  acquisitionPrice: number;
  /** embalamento no co-packer, por unidade (já incluído em costsPerUnit) */
  packingCost: number;
  /** custos até à venda: embalamento, logística, armazém, custódia, análises, seguros, provisões */
  costsPerUnit: number;
  /** decomposição de costsPerUnit (soma = costsPerUnit) */
  costLines: CostLine[];
  /** custo total financiado por unidade de preço (aquisição + custos); 0 no modelo agente */
  fundingPrice: number;
  /** margem bruta por unidade de preço (no modelo agente: a comissão da Sprout) */
  grossMargin: number;
  /** comissão da Sprout sobre o valor de venda (só modelo agente) */
  commissionPct?: number;
  /** fração da margem bruta atribuída aos cofinanciadores */
  investorShare: number;
  /** fração da margem que alimenta a reserva comum de primeira perda */
  reserveShare: number;
  /** índice de origem abaixo do qual a parte sem venda a prazo vende abaixo do preço financiado */
  breakEvenIndex: number;
  /** índice de origem abaixo do qual o lote inteiro, com a sua venda a prazo, entra em perda */
  breakEvenIndexLot: number;
  /** prazo esperado até à liquidação, em meses (dentro da janela de 18) */
  expectedMonths: number;
  /** liquidação prevista, como fração do capital, [baixo, alto], antes da reserva. Não garantida. */
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
  buyer?: { segment: 'Distribuição' | 'HoReCa' | 'Retalho' | 'Cash & carry' | 'Exportação' | 'Torrefação'; descricao: string };
  refundingPlaybookId?: string;
  /** histórico ilustrativo (campanhas 2024/25 e 2025/26, antes do piloto): dados fictícios, nunca resultados */
  illustrative?: boolean;
}

/* ------------------------------------------------------------ mercado */

export interface MarketPoint {
  /** 'YYYY-MM' (mensal) ou 'YYYY-MM-DD' (diário) */
  t: string;
  value: number;
}

export interface MarketReference {
  id: 'horeca' | 'embalador';
  label: string;
  note: string;
  /** valor de hoje (13/10/2026) */
  today: number;
  /** série mensal derivada do índice (passagem integral da variação do granel) */
  monthly: MarketPoint[];
}

export interface MarketSeries {
  world: WorldId;
  label: string;
  unit: string;
  note: string;
  monthly: MarketPoint[];
  daily: MarketPoint[];
  /** referências embaladas derivadas do índice (só azeite) */
  references?: MarketReference[];
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
  /** posição de histórico ilustrativo (lotes anteriores ao piloto) */
  illustrative?: boolean;
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
  /** campanha encerrada: o selo já não se ganha e não conta para a completude do caderno */
  closed?: boolean;
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
  /** canal ou modelo do lote de cenário, numa frase curta */
  canal: string;
  /** € por unidade de preço (kg ou L) tudo incluído */
  fundingPrice: number;
  priceUnit: 'kg' | 'L';
  /** margem prevista para os cofinanciadores (a sua parte da margem bruta), fração do montante */
  expectedMargin: number;
  /** desvio mensal típico da referência do canal */
  monthlyVolatility: number;
  /** peso do índice de origem na referência do canal (azeite HoReCa ≈ 0,58; distribuidores ≈ 0,80; água 0) */
  indexShare: number;
  hedge: { available: boolean; instrument: HedgeInstrument; label: string; coverage: number; costPct: number };
  /** mês (1–18) em que começam e terminam as vendas, em cenário base */
  salesWindow: [number, number];
  /** nota quando o lote é uma hipótese de estudo e não existe no piloto */
  hypothesis?: string;
}

export interface SimEventEffect {
  /** choque no índice de origem (fração; −0.3 = −30 %); cada lote sente-o na proporção de indexShare */
  priceShock?: number;
  /** choque direto na referência do canal (procura), em todos os lotes atingidos */
  refShock?: number;
  /** perda de quantidade vendável antes das vendas (fração), com devolução por força maior */
  qtyLoss?: number;
  /** atraso das vendas (meses) */
  salesDelayMonths?: number;
  /** fração do stock desclassificado (azeite: VE → V) e desconto aplicado */
  downgrade?: { share: number; discount: number };
  /** aceleração de vendas (meses a menos) e prémio de preço */
  demand?: { monthsFaster: number; premium: number };
  /** custo extra (fração do montante) */
  extraCost?: number;
  /** vendas não recuperadas por insolvência de um comprador (fração do valor de venda do lote), fora do seguro */
  badDebt?: number;
  /** stock destruído ou recusado, sem devolução (fração do stock por vender) */
  writeOff?: number;
}

export interface SimEvent {
  id: string;
  title: string;
  description: string;
  worlds: WorldId[];
  /** probabilidade por mês, por lote exposto (ou por mercado, ou para toda a economia) */
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
  /** partilha da margem bruta de um lote com ganho: a mesma dos lotes reais */
  shares: { investors: number; sprout: number; reserve: number };
  /** reserva comum de primeira perda: a regra dos lotes reais, mais um saldo inicial fictício */
  reserve: { shareOfMargin: number; capOfInvested: number; initialOfInvested: number };
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
  /** indicador calculado sobre o histórico ilustrativo (dados fictícios) */
  illustrative?: boolean;
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
