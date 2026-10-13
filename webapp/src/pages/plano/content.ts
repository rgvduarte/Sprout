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
}

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

export const PHASES: Phase[] = tidyDeep([
  {
    id: 'f0',
    name: 'Fase 0 · Fundações',
    window: 'a partir de 13/10/2026 · datas por fixar',
    from: '2026-10',
    to: '2026-12',
    summary: 'Fechar a prioridade zero antes de entrar o primeiro euro de um investidor.',
    scope: ['Estrutura jurídica e restrições de promoção', 'Jurisdição, PSP e contas segregadas', 'Contratos padrão (18 meses, extensão, força maior)', 'Política de hedge e playbook de refunding', 'Auditoria do backoffice'],
    gate: {
      title: 'Go/no-go do piloto',
      criteria: [
        { text: 'Estrutura jurídica e restrições de promoção na UE mapeadas (nota de 2 páginas)', actionIds: ['ai-01'] },
        { text: 'Jurisdição primária e rails PSP/E-money UE escolhidos, com risco de repatriação avaliado', actionIds: ['ai-02'] },
        { text: 'Contratos padrão Produtor↔Plataforma e Plataforma↔Investidor redigidos', actionIds: ['ai-03'] },
        { text: 'Feed de stock, curva de produção e SLA de expedição da âncora; lotes mínimos e máximos validados', actionIds: ['ai-04', 'ai-05'] },
        { text: 'Coorte piloto de investidores qualificados e processo KYC definidos', actionIds: ['ai-07'] },
        { text: 'Backoffice auditado, sem dependências de "reverse engineering" sensíveis', actionIds: ['ai-09'] },
        { text: 'PSP/KYC-AML integrados com segregação de contas e reconciliação diária', actionIds: ['ai-10'] },
        { text: 'Política de hedge e playbook de refunding aprovados', actionIds: ['ai-12'] },
      ],
    },
  },
  {
    id: 'f1',
    name: 'Fase 1 · Piloto fechado azeite + água',
    window: 'campanha 2026/27 · indicativo',
    from: '2027-01',
    to: '2027-09',
    summary: 'Marketplace fechado, coorte restrita de produtores e investidores qualificados, contratos padronizados.',
    scope: ['Azeite e água engarrafada', 'Só investidores qualificados', 'Descontos fixos de 10–15 % ao comprador', 'Liquidação a 18 meses com extensão condicionada'],
    gate: {
      title: 'Go/no-go da Fase 2',
      criteria: [
        { text: 'Fill rate de encomendas ≥ 95 % em dois trimestres seguidos' },
        { text: 'Variação de base dentro da banda de 10–15 % abaixo da referência' },
        { text: 'SLA de pagamento a produtores (D+2) ≥ 95 % e liquidações a investidores 100 % dentro da janela' },
        { text: 'Reconciliação diária sem diferenças em aberto há mais de 1 dia útil' },
        { text: 'Nenhum bloqueio bancário nem incidente regulatório' },
        { text: 'Corretor de futuros KC e cobertura cambial EUR/USD contratados para o café' },
      ],
    },
  },
  {
    id: 'f2',
    name: 'Fase 2 · Café e mais produtores',
    window: 'campanha 2027/28 · abre em 2027',
    from: '2027-10',
    to: '2028-09',
    summary: 'Entra o café verde, com cobertura em futuros ICE KC, e alargam-se as coortes de produtores de azeite e água.',
    scope: ['Café verde de origens já em diligência', 'Mais lagares e nascentes', 'Mesma coorte de investidores qualificados'],
    gate: {
      title: 'Go/no-go da abertura progressiva',
      criteria: [
        { text: 'Duas campanhas liquidadas dentro da janela, com relatório final por lote' },
        { text: 'Licença ou enquadramento para investidores não sofisticados (ECSP ou equivalente), com teste de conhecimentos e simulação de perdas' },
        { text: 'Parecer jurídico favorável sobre a promoção a retalho' },
        { text: 'Tesouraria e reserva de primeira perda dimensionadas para o volume novo' },
      ],
    },
  },
  {
    id: 'f3',
    name: 'Fase 3 · Abertura progressiva',
    window: 'a partir de 2028 · condicionada',
    from: '2028-10',
    to: '2029-09',
    summary: 'Expansão gradual depois de provado o risco e a tesouraria, sempre dentro do enquadramento aprovado.',
    scope: ['Novas coortes de investidores, por patamares', 'Novos mercados só com cobertura adequada'],
  },
]);

export const PILOT_SCOPE = {
  inScope: tidyDeep([
    { label: 'Coorte restrita', text: 'Azeite + Água, com contratos padronizados e cláusulas de força maior.' },
    { label: 'Âncora de oferta', text: 'Lagar do Val (Pedro Marques): feed de stock e curva de produção.' },
    { label: 'Investidores', text: 'Só qualificados, com KYC/AML e marketplace fechado.' },
    { label: 'Preço ao comprador', text: 'Política de descontos fixos, 10–15 % abaixo da referência de mercado.' },
    { label: 'Ciclo financeiro', text: 'Liquidação em 18 meses com regras de extensão condicionada e playbook de refunding.' },
    { label: 'Pagamentos', text: 'PSPs/E-money licenciados na UE; segregação de fundos, reconciliação diária; proibição de cash-in-transit.' },
    { label: 'Métricas', text: 'Fill rate, variação de base vs. preço de mercado, SLA de pagamentos a produtor e investidor, SLA diário de reconciliação.' },
  ]),
  outOfScope: tidyDeep([
    'Café (fica para a Fase 2; explorável na Academia, não investível)',
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
    context: 'Coorte restrita, contratos padronizados com cláusulas de força maior.',
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
    title: 'Tese económica: captura de 80–90 % da margem do embalador, com 10–15 % de desconto ao cliente',
    context: 'Desintermediação produtiva com spread operacional retido e coberto.',
    origin: 'Reunião de 13/10',
    status: 'decidida',
  },
]);
