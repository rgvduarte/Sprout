import { tidyDeep } from '../lib/format';
import { createRng } from '../lib/prng';
import { LOTS } from './lots';
import type { HedgeTrigger, KycCase, PilotKpi, ReconciliationRun, RefundingPlaybook, Transaction } from './types';

/* =====================================================================
   Bastidores (equipa Sprout): piloto, risco, tesouraria e compliance.
   Funções da equipa, nunca nomes de pessoas (esses só aparecem em /plano).
   ===================================================================== */

/* ------------------------------------------------------------ indicadores calculados sobre os lotes */

const DAY = 86_400_000;
const monthsBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / DAY / 30.4375;

/** Prazo médio de venda: do fecho do financiamento à última expedição, lotes financiados já expedidos. */
const SHIPPED = LOTS.filter((l) => l.economics.model === 'principal' && l.funding.closedAt && l.milestones.some((m) => m.stage === 'expedido' && m.done && m.date));
const SALES_MONTHS = Math.round((SHIPPED.reduce((s, l) => s + monthsBetween(l.funding.closedAt!, l.milestones.find((m) => m.stage === 'expedido')!.date!), 0) / Math.max(1, SHIPPED.length)) * 10) / 10;

/** Financiamento dos lotes abertos desde 01/10/2026 (volume financiado sobre oferecido). */
const OFFERED = LOTS.filter((l) => l.economics.model === 'principal' && l.funding.opensAt >= '2026-10-01' && (l.status === 'aberto' || Boolean(l.funding.closedAt)));
const FUNDED_SHARE = Math.round((OFFERED.reduce((s, l) => s + l.funding.raised, 0) / Math.max(1, OFFERED.reduce((s, l) => s + l.funding.goal, 0))) * 100) / 100;

const SETTLED = LOTS.filter((l) => l.economics.model === 'principal' && l.status === 'liquidado');

/**
 * Indicadores do piloto. Todos calculados sobre o histórico ilustrativo e os lotes de demonstração:
 * o piloto só começa em fevereiro de 2027. Os ids mantêm-se (Bastidores procura-os por id).
 */
export const PILOT_KPIS: PilotKpi[] = tidyDeep([
  { id: 'fill-rate', label: 'Taxa de financiamento dos lotes (volume financiado sobre oferecido)', value: FUNDED_SHARE, format: 'pct', target: 0.8, higherIsBetter: true, status: FUNDED_SHARE >= 0.8 ? 'ok' : 'warn', note: `Lotes abertos desde 01/10/2026: ${OFFERED.map((l) => l.id).join(' e ')}, abertos há poucos dias. Não é o fill rate de encomendas: esse está no indicador seguinte.`, history: [0.71, 0.84, 0.92, 0.88, 0.81, FUNDED_SHARE], illustrative: true },
  { id: 'fill-rate-encomendas', label: 'Fill rate de encomendas (entregues completas e no prazo)', value: 0.96, format: 'pct', target: 0.95, higherIsBetter: true, status: 'ok', note: 'Encomendas entregues completas e no prazo sobre encomendas recebidas, últimos 90 dias. É a métrica do documento de 13/10 e do gate do piloto (≥ 95 %).', history: [0.93, 0.94, 0.97, 0.95, 0.96, 0.96], illustrative: true },
  { id: 'base', label: 'Desconto realizado na HoReCa face à referência embalada', value: -0.101, format: 'pct', target: -0.1, higherIsBetter: false, status: 'ok', note: 'Média ponderada das vendas HoReCa dos últimos 90 dias. Banda do piloto: 8–12 %. Nos distribuidores não há desconto: o preço é o de saída do embalador mais o prémio de origem.', history: [-0.098, -0.1, -0.103, -0.099, -0.101, -0.101], illustrative: true },
  { id: 'sla-produtor', label: 'Pagamentos a produtores em ≤ 30 dias', value: 1, format: 'pct', target: 1, higherIsBetter: true, status: 'ok', note: '25 de 25 pagamentos dentro de 30 dias, como pede o DL 118/2010; a mediana foi de 2 dias úteis.', history: [1, 1, 1, 1, 1, 1], illustrative: true },
  { id: 'sla-investidor', label: 'Liquidações a cofinanciadores dentro da janela', value: 1, format: 'pct', target: 1, higherIsBetter: true, status: 'ok', note: `${SETTLED.length} lotes liquidados (${SETTLED.map((l) => l.id).join(' e ')}), ambos dentro da janela de 18 meses; um deles com perda.`, history: [1, 1, 1, 1, 1, 1], illustrative: true },
  { id: 'reconciliacao', label: 'Dias reconciliados sem diferença em aberto', value: 30, format: 'num', target: 30, higherIsBetter: true, status: 'ok', note: '2 diferenças nos últimos 30 dias, ambas explicadas e fechadas no dia seguinte.', history: [30, 30, 29, 30, 30, 30], illustrative: true },
  { id: 'prazo-venda', label: 'Prazo médio de venda de um lote', value: SALES_MONTHS, format: 'meses', target: 9, higherIsBetter: false, status: SALES_MONTHS <= 9 ? 'ok' : SALES_MONTHS <= 12 ? 'warn' : 'crit', note: `Do fecho do financiamento à última expedição, lotes já expedidos (${SHIPPED.map((l) => l.id).join(', ')}). Calculado sobre os lotes; alvo de metade da janela de 18 meses.`, history: [8.9, 8.4, 8.1, 7.8, 7.6, SALES_MONTHS], illustrative: true },
]);

/* ------------------------------------------------------------ reconciliação: 30 dias */

export const RECONCILIATION: ReconciliationRun[] = (() => {
  const rng = createRng('reconciliacao-30d');
  const out: ReconciliationRun[] = [];
  let balance = 386_420;
  const start = Date.UTC(2026, 8, 13); // 13/09/2026
  for (let i = 0; i < 30; i++) {
    const d = new Date(start + i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    const weekday = d.getUTCDay();
    const flow = weekday === 0 || weekday === 6 ? 0 : Math.round(rng.range(-14_000, 18_000) / 10) * 10;
    balance += flow;
    let difference = 0;
    let status: ReconciliationRun['status'] = 'conciliado';
    let note: string | undefined;
    if (iso === '2026-09-22') {
      difference = 250;
      status = 'diferenca-resolvida';
      note = 'Transferência SEPA de investidor creditada pelo PSP antes do registo interno; acertada a 23/09.';
    }
    if (iso === '2026-10-02') {
      difference = -40;
      status = 'diferenca-resolvida';
      note = 'Comissão do PSP debitada sem fatura associada; fatura recebida e lançada a 03/10.';
    }
    out.push({
      date: iso,
      pspBalance: balance,
      ledgerBalance: balance - difference,
      difference,
      status,
      note,
      closedAt: `${iso}T19:${String(rng.int(5, 55)).padStart(2, '0')}:00+01:00`,
    });
  }
  return out.reverse(); // mais recente primeiro
})();

/* ------------------------------------------------------------ KYC / KYB */

export const KYC_QUEUE: KycCase[] = [
  { id: 'kyc-031', investorId: 'inv-ribeirinho', nome: 'Capital Ribeirinho, SA', tipo: 'pessoa-coletiva', classe: 'profissional', submittedAt: '2026-10-08', status: 'em-analise', risco: 'medio', flags: ['Beneficiário efetivo em validação', 'Sede fora de Portugal'], responsavel: 'Compliance' },
  { id: 'kyc-030', investorId: 'inv-joao-antunes', nome: 'João Pedro Antunes', tipo: 'pessoa-singular', classe: 'qualificado', submittedAt: '2026-10-06', status: 'pendente', risco: 'baixo', flags: ['Falta comprovativo de origem de fundos'], responsavel: 'Compliance' },
  { id: 'kyc-029', investorId: 'inv-carla-mendes', nome: 'Carla Mendes', tipo: 'pessoa-singular', classe: 'nao-qualificado', submittedAt: '2026-10-05', status: 'bloqueado', risco: 'baixo', flags: ['Investidora não qualificada: piloto fechado'], responsavel: 'Compliance' },
  { id: 'kyc-028', investorId: 'inv-tiago-sardinha', nome: 'Tiago Sardinha', tipo: 'pessoa-singular', classe: 'nao-qualificado', submittedAt: '2026-10-03', status: 'bloqueado', risco: 'baixo', flags: ['Investidor não qualificado: lista de interesse da Fase 2'], responsavel: 'Compliance' },
  { id: 'kyc-027', nome: 'Herdeiros de A. Barreiros, Lda.', tipo: 'pessoa-coletiva', classe: 'qualificado', submittedAt: '2026-10-02', status: 'em-analise', risco: 'medio', flags: ['Estrutura com 3 níveis de participação'], responsavel: 'Compliance' },
  { id: 'kyc-026', nome: 'Mar e Serra Capital, Lda.', tipo: 'pessoa-coletiva', classe: 'qualificado', submittedAt: '2026-09-30', status: 'em-analise', risco: 'baixo', flags: [], responsavel: 'Compliance' },
  { id: 'kyc-025', nome: 'Inês Vasconcelos Lobo', tipo: 'pessoa-singular', classe: 'qualificado', submittedAt: '2026-09-29', status: 'pendente', risco: 'baixo', flags: ['Questionário de experiência incompleto'], responsavel: 'Compliance' },
  { id: 'kyc-024', nome: 'Agro Invest Tejo, SA', tipo: 'pessoa-coletiva', classe: 'profissional', submittedAt: '2026-09-26', status: 'aprovado', risco: 'baixo', flags: [], responsavel: 'Compliance' },
  { id: 'kyc-023', nome: 'Duarte Meireles', tipo: 'pessoa-singular', classe: 'qualificado', submittedAt: '2026-09-24', status: 'recusado', risco: 'elevado', flags: ['Pessoa politicamente exposta sem origem de fundos demonstrada'], responsavel: 'Compliance' },
  { id: 'kyc-022', investorId: 'inv-quinta-lajes', nome: 'Quinta das Lajes Holding, SA', tipo: 'pessoa-coletiva', classe: 'qualificado', submittedAt: '2025-05-27', status: 'aprovado', risco: 'baixo', flags: [], responsavel: 'Compliance' },
  { id: 'kyc-021', nome: 'Norte Patrimonial, Lda.', tipo: 'pessoa-coletiva', classe: 'qualificado', submittedAt: '2026-09-18', status: 'aprovado', risco: 'baixo', flags: [], responsavel: 'Compliance' },
  { id: 'kyc-020', nome: 'Sofia Rebelo Carvalho', tipo: 'pessoa-singular', classe: 'nao-qualificado', submittedAt: '2026-09-15', status: 'bloqueado', risco: 'baixo', flags: ['Investidora não qualificada: piloto fechado'], responsavel: 'Compliance' },
  { id: 'kyc-019', nome: 'Fundação Terras Altas', tipo: 'pessoa-coletiva', classe: 'profissional', submittedAt: '2026-09-11', status: 'em-analise', risco: 'medio', flags: ['Estatutos a confirmar poderes de investimento'], responsavel: 'Compliance' },
  { id: 'kyc-018', investorId: 'inv-helena-brito', nome: 'Helena Brito Gestão de Patrimónios, Lda.', tipo: 'pessoa-coletiva', classe: 'qualificado', submittedAt: '2025-02-10', status: 'aprovado', risco: 'baixo', flags: [], responsavel: 'Compliance' },
  { id: 'kyc-017', investorId: 'inv-marta-calado', nome: 'Marta Calado Investimentos, Lda.', tipo: 'pessoa-coletiva', classe: 'qualificado', submittedAt: '2025-11-21', status: 'aprovado', risco: 'baixo', flags: [], responsavel: 'Compliance' },
];

/* ------------------------------------------------------------ coberturas */

/** Gatilhos de cobertura, em termos do índice de origem a granel (o mesmo que move a extensão e o refunding). */
export const HEDGE_TRIGGERS: HedgeTrigger[] = tidyDeep([
  { id: 'ht-021', lotId: 'AZ-2026-021', instrument: 'forward', description: 'Subir a venda a prazo de 40 % para 60 % do volume', threshold: 'Índice de origem < 3,15 €/kg', current: '3,50 €/kg', status: 'armado', updatedAt: '2026-10-13' },
  { id: 'ht-024', lotId: 'AZ-2026-024', instrument: 'forward', description: 'Vender a prazo os 15 % em aberto', threshold: 'Índice de origem < 3,30 €/kg', current: '3,50 €/kg', status: 'armado', updatedAt: '2026-10-13' },
  { id: 'ht-014', lotId: 'AZ-2026-014', instrument: 'forward', description: 'Vender a prazo os 15 % em aberto', threshold: 'Índice de origem < 3,60 €/kg', current: 'Executado a 3,55 €/kg', status: 'executado', updatedAt: '2026-09-16' },
  { id: 'ht-031', lotId: 'AZ-2025-031', instrument: 'forward', description: 'Subir a venda a prazo de 40 % para 60 % do volume', threshold: 'Índice de origem < 4,20 €/kg', current: 'Executado a 4,20 €/kg', status: 'executado', updatedAt: '2026-05-18' },
  { id: 'ht-009', lotId: 'AZ-2026-009', instrument: 'forward', description: 'Vender a prazo os 15 % em aberto', threshold: 'Índice de origem < 4,20 €/kg', current: 'Executado a 4,20 €/kg', status: 'executado', updatedAt: '2026-05-18' },
  { id: 'ht-017', lotId: 'AZ-2025-017', instrument: 'forward', description: 'Vender a prazo o stock por vender', threshold: 'Índice de origem < 3,60 €/kg', current: 'Executado a 3,55 €/kg', status: 'executado', updatedAt: '2026-09-16' },
  { id: 'ht-cf1', lotId: 'CF-2027-001', instrument: 'forward', description: 'Reduzir o volume a comprar ao importador', threshold: 'KC < 2,60 USD/lb', current: '2,85 USD/lb', status: 'inativo', updatedAt: '2026-10-09' },
]);

/* ------------------------------------------------------------ refunding */

export const REFUNDING_PLAYBOOKS: RefundingPlaybook[] = tidyDeep([
  {
    id: 'pb-azeite-preco',
    world: 'azeite',
    title: 'Choque de preço no azeite',
    trigger: 'Índice de origem 15 % ou mais abaixo do da abertura do lote durante 10 dias úteis seguidos.',
    appliesTo: ['AZ-2025-017', 'AZ-2025-031', 'AZ-2026-003', 'AZ-2026-009', 'AZ-2026-014', 'AZ-2026-019', 'AZ-2026-021', 'AZ-2026-024'],
    steps: [
      { order: 1, title: 'Alerta e confirmação do preço em duas fontes', owner: 'Tesouraria', sla: '24 h' },
      { order: 2, title: 'Revisão de stock, cobertura e saldo da reserva comum de primeira perda', owner: 'Comité de risco', sla: '48 h' },
      { order: 3, title: 'Executar o gatilho de cobertura seguinte', owner: 'Tesouraria', sla: '5 dias úteis' },
      { order: 4, title: 'Comunicar aos cofinanciadores cenário base e adverso', owner: 'Produto & Comercial, com Jurídico', sla: '5 dias úteis' },
      { order: 5, title: 'Propor extensão ou ronda de refunding', owner: 'Comité de risco', sla: '30 dias antes do fim da janela' },
      { order: 6, title: 'Executar e publicar relatório final do lote', owner: 'Tesouraria e Operações', sla: 'Na liquidação' },
    ],
  },
  {
    id: 'pb-azeite-qualidade',
    world: 'azeite',
    title: 'Desclassificação de um lote de azeite',
    trigger: 'Reanálise fora de um limite de virgem extra (acidez, peróxidos, K232, K268 ou painel).',
    appliesTo: ['AZ-2025-017', 'AZ-2025-031', 'AZ-2026-009', 'AZ-2026-014'],
    steps: [
      { order: 1, title: 'Contra-análise em segundo laboratório acreditado', owner: 'Operações', sla: '7 dias' },
      { order: 2, title: 'Separar fisicamente os IBC afetados', owner: 'Operações', sla: '48 h' },
      { order: 3, title: 'Acionar cláusula de ajuste de preço com o produtor', owner: 'Jurídico & Compliance', sla: '10 dias úteis' },
      { order: 4, title: 'Recolocar o volume afetado como azeite virgem', owner: 'Produto & Comercial', sla: '30 dias' },
    ],
  },
  {
    id: 'pb-cafe-preco',
    world: 'cafe',
    title: 'Queda do café verde (Fase 2)',
    trigger: 'Referência do café verde 15 % ou mais abaixo da da abertura durante 10 dias úteis seguidos.',
    appliesTo: ['CF-2027-001', 'CF-2027-002'],
    steps: [
      { order: 1, title: 'Confirmar o preço fixado com o importador e as vendas contratadas', owner: 'Tesouraria', sla: '24 h' },
      { order: 2, title: 'Reforçar a cobertura cambial EUR/USD', owner: 'Tesouraria', sla: '48 h' },
      { order: 3, title: 'Comunicar aos cofinanciadores', owner: 'Produto & Comercial', sla: '5 dias úteis' },
    ],
  },
]);

/* ------------------------------------------------------------ transações */

/**
 * Movimentos desde 01/09/2026 na conta segregada (demonstração). A água não aparece: em modelo de
 * agente, o comprador paga ao engarrafador e a comissão da Sprout entra na conta operacional.
 */
export const TRANSACTIONS: Transaction[] = [
  { id: 'tx-2041', date: '2026-10-13', type: 'entrada-investidor', counterparty: 'Quinta das Lajes Holding, SA', lotId: 'AZ-2026-021', amount: 10000, rail: 'SEPA Instant', status: 'liquidada' },
  { id: 'tx-2040', date: '2026-10-12', type: 'entrada-investidor', counterparty: 'Family Office Atlântico Norte, Lda.', lotId: 'AZ-2026-024', amount: 10000, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2039', date: '2026-10-12', type: 'entrada-investidor', counterparty: 'Rui Teixeira Fonseca', lotId: 'AZ-2026-021', amount: 5000, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2038', date: '2026-10-12', type: 'custo-operacional', counterparty: 'Olea Analítica', lotId: 'AZ-2026-024', amount: -420, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2037', date: '2026-10-11', type: 'entrada-investidor', counterparty: 'Helena Brito Gestão de Patrimónios, Lda.', lotId: 'AZ-2026-021', amount: 12500, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2036', date: '2026-10-10', type: 'entrada-investidor', counterparty: 'Sociedade Agrícola Vale do Sorraia, SA', lotId: 'AZ-2026-021', amount: 8400, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2034', date: '2026-10-09', type: 'custo-operacional', counterparty: 'Olea Analítica', lotId: 'AZ-2026-021', amount: -420, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2033', date: '2026-10-08', type: 'entrada-investidor', counterparty: 'Norte Patrimonial, Lda.', lotId: 'AZ-2026-024', amount: 4300, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2032', date: '2026-10-07', type: 'recebimento-comprador', counterparty: 'Clientes HoReCa e lojas gourmet, Centro', lotId: 'AZ-2025-031', amount: 9801, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2031', date: '2026-10-07', type: 'custo-operacional', counterparty: 'Embaladora do Interior · co-packer', lotId: 'AZ-2025-031', amount: -990, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2027', date: '2026-10-02', type: 'custo-operacional', counterparty: 'PSP · comissões de setembro', amount: -186, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2026', date: '2026-10-01', type: 'recebimento-comprador', counterparty: 'Distribuidor HoReCa, Lisboa', lotId: 'AZ-2025-017', amount: 11700, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2022', date: '2026-09-17', type: 'recebimento-comprador', counterparty: 'Cash & carry, Coimbra', lotId: 'AZ-2026-009', amount: 6540, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2021', date: '2026-09-09', type: 'recebimento-comprador', counterparty: 'Clientes HoReCa e lojas gourmet, Centro', lotId: 'AZ-2025-031', amount: 7938, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2019', date: '2026-09-01', type: 'custo-operacional', counterparty: 'Seguro de mercadoria · prémio trimestral', amount: -2140, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2042', date: '2026-10-13', type: 'recebimento-comprador', counterparty: 'Distribuidor HoReCa, Algarve', lotId: 'AZ-2026-003', amount: 35200, rail: 'SEPA', status: 'pendente' },
];
