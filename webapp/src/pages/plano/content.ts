import { tidyDeep } from '../../lib/format';

/* =====================================================================
   Conteúdo do plano, tirado do documento-fonte (reunião de 13/10) e da
   instrução posterior dos fundadores. Os textos citados do documento
   ficam como estão.
   ===================================================================== */

export interface PriorityZero {
  id: string;
  title: string;
  /** texto do painel-resumo (Diagnóstico crítico) */
  goal: string;
  /** mecanismo de bloqueio (Diagnóstico de risco) */
  blocker: string;
  /** ações do plano que o desbloqueiam */
  actionIds: string[];
}

export const PRIORITY_ZERO: PriorityZero[] = [
  {
    id: 'rails',
    title: 'Jurisdição & Rails Bancários UE',
    goal: 'Eliminar risco de capital retido; operar apenas com PSPs e E-money licenciados na UE com segregação de contas.',
    blocker: 'Jurisdição errada (ex.: crypto-friendly sem ponte bancária segura UE) → "dinheiro preso" e fricção de repatriação.',
    actionIds: ['ai-02', 'ai-10'],
  },
  {
    id: 'regulatorio',
    title: 'Enquadramento Regulatório (MiFID / AIFMD)',
    goal: 'Blindagem da distribuição a investidores para afastar riscos de venda irregular de instrumentos financeiros.',
    blocker: 'Promoção inadequada de instrumentos de investimento a retalho → risco regulatório (prospecto, MiFID, AIFMD/gestão de fundos).',
    actionIds: ['ai-01', 'ai-07', 'ai-08'],
  },
  {
    id: 'mismatch',
    title: 'Gestão de Mismatch Agrícola',
    goal: 'Instrumentação de hedges e contrapartes para alinhar volatilidade de colheitas com liquidação a 18 meses.',
    blocker: 'Desalinhamento entre ciclos agrícolas (colheitas voláteis ano a ano) e promessas de liquidez a 18 meses → risco de mismatch e quebra de confiança.',
    actionIds: ['ai-12', 'ai-04', 'ai-11'],
  },
];

export interface GateCriterion {
  text: string;
  /** cumprido quando estas ações estiverem concluídas; sem ações = medido no piloto */
  actionIds?: string[];
  /** de onde vem o critério: o documento de 13/10, o business plan ou uma proposta da equipa */
  source: 'documento' | 'business-plan' | 'proposta';
}

export const CRITERION_SOURCE: Record<GateCriterion['source'], string> = {
  documento: 'Documento de 13/10',
  'business-plan': 'Business plan (cenário Recomendado)',
  proposta: 'Proposta (não consta do documento de 13/10)',
};

export interface Phase {
  id: string;
  name: string;
  window: string;
  /** início e fim indicativos (YYYY-MM) no calendário agrícola */
  from: string;
  to: string;
  summary: string;
  scope: string[];
  gate?: { title: string; criteria: GateCriterion[] };
}

/** Fases e gates do business plan (docs/business-plan, cap. 9 e 14), sobre as ações do documento de 13/10. */
export const PHASES: Phase[] = tidyDeep([
  {
    id: 'f0',
    name: 'Fase 0 · Preparação',
    window: '13/10/2026 a 31/01/2027',
    from: '2026-10',
    to: '2027-01',
    summary: 'Comprar a informação que decide tudo antes de entrar dinheiro de terceiros: o parecer jurídico, as cotações de referência e a prioridade zero.',
    scope: [
      'Parecer jurídico escrito às perguntas 2, 4 e 10 (SPV, quem comercializa, PRIIPs)',
      'Pelo menos 20 cotações de azeite de origem identificada para a referência HoReCa',
      'Resposta escrita de 2 ou mais distribuidores sobre o prémio de origem',
      'Jurisdição, PSP e contas segregadas; contratos padrão; política de hedge',
      'Auditoria do backoffice',
    ],
    gate: {
      title: 'Go/no-go do piloto · 31/01/2027',
      criteria: [
        { text: 'Estrutura jurídica e restrições de promoção na UE mapeadas (nota de 2 páginas)', actionIds: ['ai-01'], source: 'documento' },
        { text: 'Jurisdição primária e rails PSP/E-money UE escolhidos, com risco de repatriação avaliado', actionIds: ['ai-02'], source: 'documento' },
        { text: 'Contratos padrão Produtor↔Plataforma e Plataforma↔Investidor redigidos', actionIds: ['ai-03'], source: 'documento' },
        { text: 'Feed de stock, curva de produção e SLA de expedição da âncora; lotes mínimos e máximos validados', actionIds: ['ai-04', 'ai-05'], source: 'documento' },
        { text: 'Política de hedge e playbook de refunding aprovados', actionIds: ['ai-12'], source: 'documento' },
        { text: 'Pelo menos 20 cotações de origem identificada com mediana ≥ 6,00 €/kg', source: 'business-plan' },
        { text: 'Parecer favorável às perguntas 2, 4 e 10 do jurídico', source: 'business-plan' },
        { text: 'Resposta escrita de pelo menos 2 distribuidores sobre o prémio de origem', source: 'business-plan' },
      ],
    },
  },
  {
    id: 'f1',
    name: 'Fase 1 · Piloto fechado',
    window: '01/02/2027 a 31/07/2027 · gate a 31/08/2027',
    from: '2027-02',
    to: '2027-08',
    summary: 'Dois lagares, cerca de 36 compradores e 20 t de azeite de origem identificada, com capital próprio: mede-se o preço e a operação antes de levantar dinheiro de investidores.',
    scope: [
      'Azeite: 2 lotes de 10 t, com o Lagar do Val até 50 % do volume; 85 % com venda contratada',
      'Água como produto de cesto, em modelo de agente (2 % de comissão)',
      'Compradores: 25 HoReCa média e alta, 8 lojas gourmet e 3 distribuidores',
      'Stock financiado com capital próprio: sem obrigações antes do gate',
      'HoReCa 10 % abaixo da referência embalada; distribuidores ao preço de saída do embalador',
    ],
    gate: {
      title: 'Gate de 31/08/2027: avançar, mudar ou parar',
      criteria: [
        { text: 'Auditoria do backoffice fechada, sem vulnerabilidades críticas ou altas', actionIds: ['ai-09'], source: 'business-plan' },
        { text: '60 dias seguidos com segregação = 0 e nenhuma divergência de reconciliação acima de D+5', actionIds: ['ai-10'], source: 'business-plan' },
        { text: 'Responsável de Risco nomeado e política aprovada', actionIds: ['ai-12'], source: 'business-plan' },
        { text: '100 % dos pagamentos a produtores em 30 dias ou menos; nenhum incidente AML', source: 'business-plan' },
        { text: 'Pelo menos 2 lagares além do Lagar do Val, collateral manager, 3PL e servicer de reserva contratados', source: 'business-plan' },
        { text: 'Desempenho, pelo menos 6 de 8: GMV ≥ 90 k€; margem HoReCa ≥ 0,30 €/kg; margem dos distribuidores ≥ 0; fill rate de encomendas ≥ 95 %; ≥ 25 compradores com ≥ 60 % de recorrência; DSO ≤ 35 dias; incumprimento ≤ 0,5 %; ≥ 1 contrato ≥ 10 t para 2027/28', source: 'business-plan' },
      ],
    },
  },
  {
    id: 'f2',
    name: 'Fase 2 · Primeira série e escala',
    window: 'a partir de 01/09/2027 · campanha 2027/28',
    from: '2027-09',
    to: '2028-12',
    summary: 'Primeira série de obrigações da SPV a investidores profissionais, mais lagares de origem identificada, granel certificado em corretagem e exportação embalada.',
    scope: [
      '1.ª série de 150 k€: 100 k€ de obrigações sénior e 50 k€ de capital da SPV, para 2 a 4 profissionais',
      'Mais lagares de origem identificada; granel certificado em corretagem (0,75 % do valor)',
      'Café: só diligência e Academia; abre com go/no-go próprio, e o business plan recomendado não o prevê antes de 2030',
    ],
    gate: {
      title: 'Go/no-go da 1.ª série',
      criteria: [
        { text: 'Gate de 31/08/2027 cumprido', source: 'business-plan' },
        { text: 'Parecer favorável às perguntas 2, 4 e 10; SPV com 12 meses de registo ou exceção confirmada', source: 'business-plan' },
        { text: 'Seed fechada ou autonomia comprometida de 18 meses ou mais', source: 'business-plan' },
        { text: 'Servicer de reserva contratado e capital da SPV intacto (≥ 50 000 €)', source: 'business-plan' },
      ],
    },
  },
  {
    id: 'f3',
    name: 'Fase 3 · Abertura progressiva',
    window: 'a partir de 2029 · condicionada',
    from: '2029-01',
    to: '2029-09',
    summary: 'Expansão gradual depois de provados o preço, o risco e a tesouraria, sempre dentro do enquadramento aprovado.',
    scope: ['Trader de granel e exportação embalada (Brasil)', 'Café verde para microtorrefações, se o go/no-go o aprovar (2030 no cenário recomendado)', 'Retalho só como promotor numa plataforma ECSP de terceiros'],
  },
]);

export const PILOT_SCOPE = {
  inScope: tidyDeep([
    { label: 'Coorte restrita', text: 'Azeite de origem identificada; água como produto de cesto, em modelo de agente. Contratos padronizados com cláusulas de força maior.' },
    { label: 'Âncora de oferta', text: 'Lagar do Val (Pedro Marques): feed de stock e curva de produção, até 50 % do volume do piloto.' },
    { label: 'Investidores', text: 'Só qualificados e profissionais, com KYC/AML e marketplace fechado. No piloto, o stock é financiado com capital próprio; a 1.ª série de obrigações só sai depois do gate.' },
    { label: 'Preço ao comprador', text: 'HoReCa e lojas gourmet: 10 % abaixo da referência embalada (6,00 €/kg, a validar com 20 cotações). Distribuidores: preço de saída do embalador mais prémio de origem, sem desconto. O documento de 13/10 falava em 10–15 % para todos.' },
    { label: 'Ciclo financeiro', text: 'Documento de 13/10: liquidação em 18 meses com extensão condicionada e playbook de refunding. Business plan: os 18 meses passam a vencimento legal, com vencimento esperado numa campanha (M12) e extensão condicionada até M18. Reserva comum de primeira perda com 30 % da margem de cada lote, até 5 % do capital em curso.' },
    { label: 'Pagamentos', text: 'PSPs/E-money licenciados na UE; segregação de fundos, reconciliação diária; proibição de cash-in-transit.' },
    { label: 'Métricas', text: 'Fill rate de encomendas, desconto realizado, SLA de pagamentos a produtor (≤ 30 dias) e investidor, SLA diário de reconciliação.' },
  ]),
  outOfScope: tidyDeep([
    'Café (Fase 2: só diligência e Academia, não investível; o business plan recomendado não o prevê antes de 2030)',
    'Água como lote financiado: entra como cesto, em modelo de agente',
    'Investidores não qualificados e promoção ao retalho',
    'Mercado secundário de posições',
    'Numerário e jurisdições sem ponte bancária segura na UE',
  ]),
};

export const DIRECTIVE_2026_10_13 = {
  tese: 'Gamificação só é aceitável como camada de UX para educação/transparência (ex.: painéis de colheita, metas de lote, badges de compliance).',
  antitese: '"Game" sobre retornos ou risco induz comportamento inadequado e chama supervisão regulatória.',
  sintese: 'UX educativo e de acompanhamento operacional; zero ludificação de performance financeira.',
};

export const FOUNDERS_QUOTES = ['cria a webapp para investimento nos mercados que foram falados, uma gamificação do conceito', 'tem de ter um quê de feeling gamified no ponto do investimento', 'sem AI slop no design nem no funcionamento'];

export const ALLOWED = tidyDeep([
  { title: 'Conhecimento', text: 'Níveis Aprendiz → Mestre de campanha, missões de diligência e mini-jogos com conteúdo real.' },
  { title: 'Colheita física', text: 'Mundos, mapa de origens, Diário de campanha, jornada do lote e o medidor físico (IBC, palete, sacas).' },
  { title: 'Simulador com dinheiro fictício', text: 'O único sítio onde retorno e risco são jogados, com perdas possíveis e etiqueta permanente.' },
  { title: 'Ritual de compromisso', text: 'Fatores de risco lidos, montante traduzido em mercadoria, confirmação por pressão contínua e selo de lacre.' },
  { title: 'Coleção e recompensas', text: 'Selos e cartas de origem não transferíveis; recompensas em espécie e conhecimento.' },
]);

export const FORBIDDEN = tidyDeep([
  'Pontos, XP ou níveis ligados a montantes investidos',
  'Rankings ou comparação social de investidores e rentabilidades',
  'Streaks, confetes ou celebrações ligadas a dinheiro',
  'Empurrões para maximizar retorno, contagens decrescentes, escassez',
  'P&L verde/vermelho a piscar; roletas e caixas-surpresa',
  'Qualquer promessa ou "garantia" de rentabilidade',
]);

export interface Decision {
  id: string;
  date: string;
  title: string;
  context: string;
  origin: string;
  status: 'decidida' | 'proposta' | 'em-aberto' | 'revogada';
  session?: boolean;
}

export const DECISION_STATUS: Record<Decision['status'], { label: string; tone: 'ok' | 'info' | 'warn' | 'neutral' }> = {
  decidida: { label: 'Decidida', tone: 'ok' },
  proposta: { label: 'Proposta', tone: 'info' },
  'em-aberto': { label: 'Em aberto', tone: 'warn' },
  revogada: { label: 'Revogada', tone: 'neutral' },
};

export const SEED_DECISIONS: Decision[] = tidyDeep([
  {
    id: 'd-11',
    date: '2026-10-13',
    title: 'Os 18 meses passam a vencimento legal: vencimento esperado numa campanha (M12), extensão condicionada até M18',
    context: 'Segurar azeite 18 meses custa carry e risco de preço sem futuros para cobrir; o business plan proíbe-o por política e tira «refunding» do vocabulário do investidor. Os lotes de demonstração da webapp ainda seguem a decisão d-04 (janela de 18 meses e extensão de 6): falta alinhar.',
    origin: 'Business plan de 13/10/2026',
    status: 'proposta',
  },
  {
    id: 'd-10',
    date: '2026-10-13',
    title: 'Calendário do business plan: Fase 0 até 31/01/2027, piloto de fevereiro a julho de 2027 com capital próprio, gate a 31/08/2027',
    context: 'Hoje é Fase 0. Os lotes e posições anteriores ao piloto que a webapp mostra são histórico ilustrativo, com dados fictícios.',
    origin: 'Business plan de 13/10/2026',
    status: 'proposta',
  },
  {
    id: 'd-09',
    date: '2026-10-13',
    title: 'Economia do azeite pelo cenário Recomendado do business plan',
    context: 'Compra ao lagar ao índice de origem (≈ 3,50 €/kg) mais prémio; embalamento num co-packer; HoReCa 10 % abaixo da referência embalada de 6,00 €/kg (a validar); distribuidores ao preço de saída do embalador (4,35 €/kg) mais 0,10 €/kg de prémio de origem. Água em modelo de agente. Uma só regra de reserva: 30 % da margem de cada lote, até 5 % do capital em curso.',
    origin: 'Business plan de 13/10/2026',
    status: 'proposta',
  },
  {
    id: 'd-08',
    date: '2026-10-13',
    title: 'Responsável de Risco & Tesouraria: a designar',
    context: 'Política de hedge, contrapartes e playbook de refunding precisam de um dono antes do go/no-go do piloto.',
    origin: 'Reunião de 13/10',
    status: 'em-aberto',
  },
  {
    id: 'd-07',
    date: '2026-10-13',
    title: 'A webapp é uma app de investimento gamificada à volta do conhecimento, da colheita física e de um simulador com dinheiro fictício',
    context: 'Atualiza a ênfase do documento na consola B2B: a app do investidor lidera e a consola passa a Bastidores. Zero gamificação de retornos reais.',
    origin: 'Instrução dos fundadores, depois da reunião',
    status: 'decidida',
  },
  {
    id: 'd-06',
    date: '2026-10-13',
    title: 'Gamificação só como UX educativa e de acompanhamento; zero ludificação de retornos',
    context: 'Diretriz aprovada: acompanhamento operacional, painéis de colheita, badges de compliance e rastreabilidade de lotes.',
    origin: 'Reunião de 13/10',
    status: 'decidida',
  },
  {
    id: 'd-05',
    date: '2026-10-13',
    title: 'Operar só com PSPs e E-money licenciados na UE, contas segregadas e reconciliação diária; sem cash-in-transit',
    context: 'Evita capital retido e bloqueios bancários ao primeiro movimento.',
    origin: 'Reunião de 13/10',
    status: 'decidida',
  },
  {
    id: 'd-04',
    date: '2026-10-13',
    title: 'Liquidação em janelas de 18 meses, com extensão condicionada e refunding por lote',
    context: 'Alinha o ciclo agrícola com a liquidez prometida aos investidores.',
    origin: 'Reunião de 13/10',
    status: 'decidida',
  },
  {
    id: 'd-03',
    date: '2026-10-13',
    title: 'Piloto com coorte azeite + água; café fica para a Fase 2',
    context: 'Coorte restrita, contratos padronizados com cláusulas de força maior. O business plan põe a água no cesto, em modelo de agente, sem lotes para financiar.',
    origin: 'Reunião de 13/10',
    status: 'decidida',
  },
  {
    id: 'd-02',
    date: '2026-10-13',
    title: 'Fase 1 é um marketplace fechado, só com investidores qualificados',
    context: 'Controlo rigoroso de KYC/AML e liquidez antes de qualquer abertura.',
    origin: 'Reunião de 13/10',
    status: 'decidida',
  },
  {
    id: 'd-01',
    date: '2026-10-13',
    title: 'Tese económica original: captar 80–90 % da margem do embalador, com 10–15 % de desconto ao cliente',
    context: 'Por validar no piloto. Os valores verificados (Observatório da cadeia alimentar de Espanha) dão 0,19–0,50 €/kg de margem líquida ao embalador, uma parte pequena do diferencial entre o granel e o embalado (0,85 €/kg até ao preço de saída do embalador; 2,50 €/kg até à referência HoReCa), que paga também embalamento, logística e outras margens. Sozinha, essa margem não financia 10–15 % de desconto. O piloto mede a referência HoReCa e o prémio de origem com cotações reais.',
    origin: 'Reunião de 13/10; revista com a base factual',
    status: 'em-aberto',
  },
]);
