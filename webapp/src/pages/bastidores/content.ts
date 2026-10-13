import { MINI_GAMES, MODULES, QUESTS, SIM_COMPLETE_POINTS, SIM_RULES, type Quest, type QuestCriteria } from '../../data';
import { tidyDeep } from '../../lib/format';

/* =====================================================================
   Conteúdo dos Bastidores: motor de missões, revisão da gamificação,
   controlos de compliance, materiais de marketing e pré-check jurídico.
   ===================================================================== */

/* ------------------------------------------------------------ motor de missões */

export type CriteriaType = QuestCriteria['type'];

export interface EngineTrigger {
  id: string;
  label: string;
  /** de onde vem o evento */
  source: string;
  /** tipos de critério das missões que este gatilho avalia */
  criteria: CriteriaType[];
  /** o que acontece quando não há missão com pontos */
  effect?: string;
  example: string;
}

export const ENGINE_TRIGGERS: EngineTrigger[] = tidyDeep([
  {
    id: 'kyc-concluido',
    label: 'KYC concluído',
    source: 'Onboarding: verificação aprovada',
    criteria: [],
    effect: 'Abre as missões de diligência dos lotes abertos. Não dá pontos: verificar a identidade é obrigação, não mérito.',
    example: 'Registo aprovado pela equipa de Compliance',
  },
  {
    id: 'analise-lida',
    label: 'Análise lida',
    source: 'Lote: boletim de análises aberto até ao fim',
    criteria: ['analysis-read'],
    example: 'Boletim de análises do AZ-2026-021 lido até ao fim',
  },
  {
    id: 'risco-lido',
    label: 'Risco lido',
    source: 'Lote: cada fator de risco aberto',
    criteria: ['risk-read'],
    example: '6 de 6 fatores de risco do AZ-2026-021',
  },
  {
    id: 'marco-lote',
    label: 'Marco do lote',
    source: 'Diário de campanha: telemetria e jornada física',
    criteria: [],
    effect: 'Acende o marco na jornada do lote e entra no Diário. Informativo: o que acontece no lagar não é mérito de quem investiu.',
    example: 'Lagar da Ribeira Alta encheu o Depósito 2',
  },
  {
    id: 'simulacao',
    label: 'Simulação concluída',
    source: 'Simulador: 18 meses jogados e balanço lido',
    criteria: ['sim-complete'],
    example: 'Campanha simulada com dinheiro fictício',
  },
  {
    id: 'modulo',
    label: 'Módulo da Academia',
    source: 'Academia: módulo lido e questionário respondido',
    criteria: ['module'],
    example: 'O ciclo de 18 meses: liquidação, extensão e refunding',
  },
  {
    id: 'minijogo',
    label: 'Mini-jogo',
    source: 'Academia: Painel de prova, Lê o rótulo, Da cereja à chávena',
    criteria: ['minigame'],
    example: '3 atributos certos no Painel de prova',
  },
  {
    id: 'exploracao',
    label: 'Exploração de origens',
    source: 'Mercados: região ou mundo aberto no mapa',
    criteria: ['region-visit', 'world-visit'],
    example: 'Região do Minho aberta no mundo da água',
  },
  {
    id: 'confirmacao',
    label: 'Confirmação de leitura',
    source: 'O próprio utilizador marca a missão como feita',
    criteria: ['manual'],
    example: 'Cobertura de preço do lote encontrada',
  },
]);

export interface BlockedTrigger {
  id: string;
  label: string;
  reason: string;
  example: string;
}

export const BLOCKED_TRIGGERS: BlockedTrigger[] = tidyDeep([
  {
    id: 'deposito',
    label: 'Depósito ou transferência recebida',
    reason: 'Premiar a entrada de dinheiro transforma o investimento no objetivo do jogo. A diretriz de 13/10 proíbe ludificar retornos e o comportamento financeiro.',
    example: 'Transferência SEPA de 10 000 € creditada',
  },
  {
    id: 'montante',
    label: 'Montante comprometido',
    reason: 'Pontos proporcionais ao montante empurram para tickets maiores e para a concentração num lote.',
    example: 'Compromisso de 25 000 € no AZ-2026-024',
  },
  {
    id: 'volume',
    label: 'Volume acumulado investido',
    reason: 'Níveis por volume são níveis de riqueza. Os níveis da Sprout medem conhecimento.',
    example: 'Mais de 50 000 € investidos no piloto',
  },
  {
    id: 'inatividade',
    label: 'Inatividade para reinvestir',
    reason: 'Avisos do tipo "há 30 dias que não investes" são pressão para agir. Um lote de 18 meses não pede ação diária.',
    example: 'Sem compromissos nos últimos 30 dias',
  },
  {
    id: 'liquidacao',
    label: 'Liquidação ou resultado recebido',
    reason: 'Celebrar um resultado é celebrar a rentabilidade. A liquidação é comunicada com linguagem neutra, sem recompensa.',
    example: 'AZ-2025-004 liquidado com +1,8 %',
  },
]);

export const questsFor = (t: EngineTrigger): Quest[] => QUESTS.filter((q) => t.criteria.includes(q.criteria.type));
export const triggerForQuest = (q: Quest) => ENGINE_TRIGGERS.find((t) => t.criteria.includes(q.criteria.type));

/** Pontos de conhecimento possíveis, por origem (nenhuma é dinheiro). */
export const POINT_SOURCES = [
  { label: 'Módulos da Academia', count: MODULES.length, points: MODULES.reduce((s, m) => s + m.points, 0) },
  { label: 'Missões de conhecimento', count: QUESTS.length, points: QUESTS.reduce((s, q) => s + q.points, 0) },
  { label: 'Mini-jogos', count: MINI_GAMES.length, points: MINI_GAMES.reduce((s, g) => s + g.maxPoints, 0) },
  // a campanha simulada já conta como missão (q-simulador); só há uma linha própria se existir um bónus à parte
  ...(SIM_COMPLETE_POINTS > 0 ? [{ label: 'Primeira campanha simulada (bónus)', count: 1, points: SIM_COMPLETE_POINTS }] : []),
];

/* ------------------------------------------------------------ revisão da gamificação */

export interface Pattern {
  id: string;
  name: string;
  refs: string;
  /** o que o padrão faz na referência */
  original: string;
  /** como a Sprout o adapta (adotado) ou o que faz em vez dele (rejeitado) */
  sprout: string;
  why: string;
  where?: { label: string; href: string }[];
}

export const ADOPTED: Pattern[] = tidyDeep([
  {
    id: 'missoes',
    name: 'Missões ativadas por eventos',
    refs: 'Smartico, Solitics',
    original: 'Gatilho → lógica → tarefa → recompensa, com barra de progresso e resposta em menos de 1 segundo.',
    sprout: 'Motor alimentado por conhecimento, diligência e eventos da colheita física: análises lidas, riscos abertos, simulações concluídas, marcos do lote. Nunca por depósitos, montantes ou volume.',
    why: 'A missão leva o investidor a ler o que decide o risco do lote (análises, fatores de risco, cobertura) antes de decidir.',
    where: [
      { label: 'Academia', href: '/academia' },
      { label: 'Motor de missões', href: '/bastidores?sec=motor' },
    ],
  },
  {
    id: 'niveis',
    name: 'Pontos e níveis',
    refs: 'Smartico',
    original: 'Pontos acumulados sobem níveis que dão vantagens.',
    sprout: 'Pontos só de conhecimento: Aprendiz → Provador → Lagareiro → Mestre de campanha. Cada nível abre conhecimento e acesso (relatório técnico completo, prova guiada online, visita ao lagar), nunca vantagens financeiras.',
    why: 'Sem descontos de comissões, sem melhores preços, sem prioridade na alocação: o nível não muda o que se ganha nem o que se arrisca.',
    where: [{ label: 'Academia', href: '/academia' }],
  },
  {
    id: 'liga',
    name: 'Rankings e torneios',
    refs: 'Smartico, Solitics; CFA Institute sobre competições com dinheiro virtual',
    original: 'Tabelas de classificação e torneios sazonais entre utilizadores.',
    sprout: 'Só dentro do Simulador: Liga de campanha opcional, com pseudónimo, por campanha e com dinheiro fictício, ordenada pela Pontuação de gestão (resultado face à perda máxima, coberturas e diversificação, balanço lido), nunca pelo maior retorno.',
    why: 'Quem lidera a Liga é quem gere bem o risco, não quem arriscou mais. Onde há dinheiro real não existe ranking.',
    where: [{ label: 'Simulador', href: '/academia/simulador' }],
  },
  {
    id: 'recompensas',
    name: 'Catálogo de recompensas',
    refs: 'Smartico (loja de recompensas), PlayEstates',
    original: 'Recompensas trocadas por pontos ou desbloqueadas por objetivos.',
    sprout: 'Recompensas da colheita, em espécie e conhecimento: amostra do lote que acompanhas, prova guiada online com o mestre lagareiro, visita ao lagar na campanha, certificado de Provador, relatório técnico. Qualquer cofinanciador pode pedir a amostra do seu lote, seja qual for o montante.',
    why: 'Participação, não tamanho: nenhuma recompensa em dinheiro, bónus ou proporcional ao capital.',
    where: [{ label: 'Caderno de colheita', href: '/caderno' }],
  },
  {
    id: 'colecao',
    name: 'Colecionáveis',
    refs: 'PlayEstates (cartas e tokens)',
    original: 'Cartas e tokens colecionáveis, muitas vezes negociáveis.',
    sprout: 'Cartas de origem e Selos de origem com dados reais do lote (região, variedade, acidez, data de extração, quantidade, campanha). Não transferíveis, não resgatáveis, sem mercado.',
    why: 'Guardam a memória de onde vem o produto. Não são ativos nem podem passar a ser.',
    where: [{ label: 'Caderno de colheita', href: '/caderno' }],
  },
  {
    id: 'educacao',
    name: 'Progressão educativa e diversificação',
    refs: 'Coral (Z1); Ontario Securities Commission',
    original: 'Educação para principiantes com arte 3D; metas, acompanhamento do progresso e recompensas por diversificar.',
    sprout: 'Objetivos de aprendizagem com progresso; mundos ilustrados em axonometria (olival e lagar, nascente e engarrafamento, plantação e terreiro); vista de diversificação que avisa quando um lote ou produtor domina a carteira.',
    why: 'Os empurrões que protegem são o lado bom da gamificação: o aviso de concentração puxa para a segurança, não para o volume.',
    where: [
      { label: 'Mercados', href: '/mercados' },
      { label: 'Carteira', href: '/carteira' },
    ],
  },
  {
    id: 'tickets',
    name: 'Tickets baixos e liquidez explicada',
    refs: 'Fundrise, Arrived, RealtyMogul',
    original: 'Entradas de 10 a 100 dólares, participação fracionada, distribuições trimestrais e penalizações de resgate antecipado explícitas.',
    sprout: 'Ticket mínimo por lote (2 500 € na água, 5 000 € no azeite), fração física do investidor no lote, cadência dos extratos e termos de saída em linguagem simples: janela de 18 meses, extensão condicionada, refunding e nenhum mercado secundário no piloto.',
    why: 'No piloto, o público continua restrito a investidores qualificados; o ticket baixo serve a diversificação, não a abertura ao retalho.',
    where: [{ label: 'Lote AZ-2026-021', href: '/lote/AZ-2026-021' }],
  },
  {
    id: 'tempo-real',
    name: 'Feedback em tempo real',
    refs: 'Solitics',
    original: 'Reação a eventos em menos de 1 segundo.',
    sprout: 'O Diário de campanha e o progresso das missões reagem a eventos (telemetria simulada dos depósitos e das linhas de engarrafamento) com movimento calmo.',
    why: 'Mostra que o ativo é físico e está a acontecer; não há números a piscar.',
    where: [{ label: 'Início', href: '/' }],
  },
  {
    id: 'protecao',
    name: 'Mecânicas de proteção',
    refs: 'ECSP, Reg. (UE) 2020/1503 (período de reflexão)',
    original: 'Período de reflexão pré-contratual de 4 dias de calendário, em que o investidor não sofisticado pode revogar a oferta ou a manifestação de interesse sem penalização.',
    sprout: 'Período de reflexão depois de cada compromisso (cancelamento sem custos durante 4 dias), mostrado como uma faixa calma, nunca como pressão; pausa sugerida depois de muitas simulações seguidas; avisos de concentração.',
    why: 'A Sprout aplica-o como política própria no piloto, mesmo sem licença ECSP.',
    where: [{ label: 'Simulador', href: '/academia/simulador' }],
  },
]);

export const REJECTED: Pattern[] = tidyDeep([
  {
    id: 'roletas',
    name: 'Roletas e caixas-surpresa',
    refs: 'Mecânicas comuns em apps de trading gamificadas',
    original: 'Recompensas aleatórias por girar uma roda ou abrir uma caixa.',
    sprout: 'Nenhuma recompensa depende da sorte.',
    why: 'É uma mecânica de lotaria: associa investir a sorte e pode ser tratada como jogo de fortuna ou azar.',
  },
  {
    id: 'play-to-earn',
    name: 'Play-to-earn em ativos reais',
    refs: 'PlayEstates',
    original: 'Jogar dá frações de ativos reais ou tokens com valor.',
    sprout: 'O jogo dá conhecimento e acesso, nunca participação num lote.',
    why: 'Distribuir frações de ativos por jogar arrisca valores mobiliários não registados e lotaria.',
  },
  {
    id: 'pontos-dinheiro',
    name: 'Pontos ou níveis por depósitos e volume',
    refs: 'Programas de fidelização de corretoras',
    original: 'Mais dinheiro investido, mais pontos e melhor nível.',
    sprout: 'Pontos só por aprendizagem e diligência; o motor bloqueia estes gatilhos.',
    why: 'Premeia montante e concentração. Contraria a diretriz aprovada a 13/10.',
  },
  {
    id: 'streaks',
    name: 'Sequências diárias (streaks)',
    refs: 'Apps de hábitos e de trading',
    original: 'Contador de dias seguidos que se perde se falhares um dia.',
    sprout: 'Nada conta dias seguidos.',
    why: 'Cria pressão para voltar e agir. Num lote de 18 meses não há nada para fazer todos os dias.',
  },
  {
    id: 'ranking-real',
    name: 'Rankings com dinheiro real',
    refs: 'Smartico, Solitics (tabelas de traders)',
    original: 'Classificação de utilizadores pela rentabilidade real.',
    sprout: 'Só a Liga do Simulador, com dinheiro fictício e Pontuação de gestão.',
    why: 'A comparação social de rentabilidades induz risco excessivo e chama a supervisão.',
  },
  {
    id: 'confetes',
    name: 'Confetes e celebrações em ganhos',
    refs: 'Apps de trading de retalho',
    original: 'Animações de festa quando uma operação dá lucro.',
    sprout: 'O selo de lacre marca a origem e a participação; a liquidação é comunicada sem celebração.',
    why: 'Celebrar a rentabilidade é ludificar a performance financeira, o que a diretriz proíbe.',
  },
  {
    id: 'escassez',
    name: 'Contagens decrescentes e escassez',
    refs: 'Ofertas de crowdfunding imobiliário',
    original: '"Só faltam 2 vagas!", relógios a contar até ao fecho.',
    sprout: 'Mostra-se quanto falta financiar, sem relógio nem urgência; há período de reflexão depois do compromisso.',
    why: 'A pressão para decidir depressa é o contrário de uma decisão informada.',
  },
  {
    id: 'descontos',
    name: 'Descontos de comissões por atividade',
    refs: 'Corretoras com níveis de cliente',
    original: 'Quanto mais negoceias, menos pagas.',
    sprout: 'Os custos do lote são iguais para todos os cofinanciadores.',
    why: 'É um benefício financeiro por atividade: um incentivo a investir mais, não melhor.',
  },
]);

/* ------------------------------------------------------------ controlos de gamificação (compliance) */

/** Rotas com dinheiro real que têm de mostrar a nota de capital em risco. */
export const MONEY_SCREENS = [
  { route: '/', label: 'Início' },
  { route: '/carteira', label: 'Carteira' },
  { route: '/mercados/azeite', label: 'Mundo do azeite' },
  { route: '/mercados/agua', label: 'Mundo da água' },
  { route: '/lote/AZ-2026-021', label: 'Lote AZ-2026-021 e ritual de compromisso' },
  { route: '/lote/AG-2026-007', label: 'Lote AG-2026-007 e ritual de compromisso' },
];

export const SIM_LABEL_OK = SIM_RULES.disclaimer === 'Simulação educativa · dinheiro fictício · não representa resultados reais';

/* ------------------------------------------------------------ materiais de marketing */

export const DISCLAIMERS = tidyDeep([
  { id: 'capital-risco', label: 'Capital em risco: pode haver perda de parte ou da totalidade do capital' },
  { id: 'sem-garantia', label: 'Sem promessa de rentabilidade: "liquidação prevista", nunca "lucro garantido"' },
  { id: 'qualificados', label: 'Destinado apenas a investidores qualificados (piloto fechado)' },
  { id: 'sem-secundario', label: 'Sem mercado secundário: capital imobilizado até 18 meses, ou 24 com extensão' },
  { id: 'ilustrativo', label: 'Números ilustrativos assinalados como tal' },
  { id: 'psp', label: 'Fundos em conta segregada num PSP licenciado na UE' },
]);

export interface Material {
  id: string;
  title: string;
  kind: string;
  owner: string;
  href?: string;
  /** bloqueado por regra, independentemente dos avisos */
  blocked?: string;
}

export const MATERIALS: Material[] = tidyDeep([
  { id: 'mat-deck', title: 'Deck de roadshow, versão 0.3', kind: 'Apresentação', owner: 'Produto & Comercial' },
  { id: 'mat-apresentacao', title: 'Página de apresentação da webapp', kind: 'Página', owner: 'Produto & Comercial', href: '/apresentacao' },
  { id: 'mat-ficha-021', title: 'Ficha do lote AZ-2026-021', kind: 'PDF para investidores qualificados', owner: 'Operações' },
  { id: 'mat-email-007', title: 'Email de abertura do AG-2026-007', kind: 'Email à coorte', owner: 'Produto & Comercial' },
  {
    id: 'mat-social',
    title: 'Publicação em rede social sobre o piloto',
    kind: 'Publicação pública',
    owner: 'Produto & Comercial',
    blocked: 'Promoção pública proibida no piloto fechado: só comunicação direta a investidores qualificados da coorte.',
  },
]);

/* ------------------------------------------------------------ classificação do produto */

export interface Framework {
  id: string;
  name: string;
  ref: string;
  question: string;
  hypothesis: string;
  ifYes: string;
}

export const FRAMEWORKS: Framework[] = tidyDeep([
  {
    id: 'mifid',
    name: 'MiFID II',
    ref: 'Diretiva 2014/65/UE',
    question: 'A participação num lote é um instrumento financeiro (valor mobiliário, instrumento do mercado monetário ou derivado)?',
    hypothesis: 'Contrato de financiamento de um lote físico, sem negociabilidade nem mercado secundário.',
    ifYes: 'Distribuição só através de entidade autorizada; regras de adequação e de informação ao cliente.',
  },
  {
    id: 'aifmd',
    name: 'AIFMD',
    ref: 'Diretiva 2011/61/UE',
    question: 'Juntar capital de vários investidores em lotes geridos pela Sprout configura um organismo de investimento alternativo?',
    hypothesis: 'Cada lote é um contrato autónomo, sem política de investimento comum nem gestão discricionária.',
    ifYes: 'Gestor autorizado ou registado, depositário e limites de comercialização.',
  },
  {
    id: 'ecsp',
    name: 'Financiamento colaborativo (ECSP)',
    ref: 'Reg. (UE) 2020/1503',
    question: 'A Sprout é um prestador de serviços de financiamento colaborativo? Se sim, aplica-se a licença e, para não sofisticados, o teste de conhecimentos e a simulação da capacidade de suportar perdas.',
    hypothesis: 'Piloto só com investidores qualificados; licença avaliada antes da abertura progressiva (Fase 3). O Simulador cumpre uma função educativa semelhante, mas não é a simulação do art. 21.º, n.º 5 (capacidade de suportar perdas, 10 % do património líquido calculado a partir de rendimentos, ativos e compromissos): essa terá de ser implementada no registo antes da abertura a investidores não sofisticados.',
    ifYes: 'Licença junto da CMVM, ficha de informação fundamental por oferta, período de reflexão de 4 dias e avisos para investidores não sofisticados.',
  },
  {
    id: 'prospetos',
    name: 'Regulamento dos Prospetos',
    ref: 'Reg. (UE) 2017/1129',
    question: 'Há oferta pública de valores mobiliários? Que isenções se aplicam (investidores qualificados, montante total da oferta)?',
    hypothesis: 'Oferta dirigida só a investidores qualificados, isenta de prospeto.',
    ifYes: 'Prospeto aprovado ou documento de isenção antes de qualquer oferta fora da coorte.',
  },
  {
    id: 'priips',
    name: 'PRIIPs',
    ref: 'Reg. (UE) 1286/2014',
    question: 'O produto é um PRIIP vendido a investidores não profissionais, com obrigação de documento de informação fundamental?',
    hypothesis: 'Sem investidores não profissionais no piloto, não há documento de informação fundamental a entregar.',
    ifYes: 'Documento de informação fundamental por lote antes da abertura ao retalho.',
  },
  {
    id: 'fundos-reembolsaveis',
    name: 'Fundos reembolsáveis',
    ref: 'Regime geral das instituições de crédito (atividade reservada)',
    question: 'Receber capital com promessa de devolução pode ser receção de fundos reembolsáveis do público, reservada a instituições de crédito?',
    hypothesis: 'O capital não tem reembolso garantido: há risco de perda e a liquidação depende da venda do lote.',
    ifYes: 'Estrutura alternativa (SPV, emissão de títulos) ou parceria com entidade autorizada.',
  },
]);
