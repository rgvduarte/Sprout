import { tidyDeep } from '../lib/format';
import { createRng } from '../lib/prng';
import type { HedgeTrigger, KycCase, PilotKpi, ReconciliationRun, RefundingPlaybook, Transaction } from './types';

/* =====================================================================
   Bastidores (equipa Sprout): piloto, risco, tesouraria e compliance.
   Funções da equipa, nunca nomes de pessoas (esses só aparecem em /plano).
   ===================================================================== */

export const PILOT_KPIS: PilotKpi[] = tidyDeep([
  { id: 'fill-rate', label: 'Fill rate dos lotes abertos na campanha', value: 0.78, format: 'pct', target: 0.8, higherIsBetter: true, status: 'warn', note: 'Volume financiado sobre volume oferecido desde 01/10/2026, incluindo lotes fechados no mesmo período.', history: [0.71, 0.84, 0.92, 0.88, 0.81, 0.78] },
  { id: 'base', label: 'Desconto médio ao comprador vs. referência', value: -0.121, format: 'pct', target: -0.12, higherIsBetter: false, status: 'ok', note: 'Média ponderada por volume das vendas dos últimos 90 dias.', history: [-0.118, -0.12, -0.122, -0.119, -0.121, -0.121] },
  { id: 'sla-produtor', label: 'Pagamentos a produtores em ≤ 2 dias úteis', value: 0.96, format: 'pct', target: 0.95, higherIsBetter: true, status: 'ok', note: '24 de 25 pagamentos no prazo; 1 atrasou por IBAN mal validado.', history: [0.9, 0.93, 1, 0.95, 0.96, 0.96] },
  { id: 'sla-investidor', label: 'Liquidações a investidores no prazo', value: 1, format: 'pct', target: 1, higherIsBetter: true, status: 'ok', note: '3 lotes liquidados desde junho de 2026, todos dentro da janela.', history: [1, 1, 1, 1, 1, 1] },
  { id: 'reconciliacao', label: 'Dias reconciliados sem diferença em aberto', value: 30, format: 'num', target: 30, higherIsBetter: true, status: 'ok', note: '2 diferenças nos últimos 30 dias, ambas explicadas e fechadas no dia seguinte.', history: [30, 30, 29, 30, 30, 30] },
  { id: 'prazo-venda', label: 'Prazo médio de venda de um lote', value: 7.8, format: 'meses', target: 9, higherIsBetter: false, status: 'ok', note: 'Do fecho do financiamento à última expedição, lotes de 2025.', history: [9.4, 8.9, 8.6, 8.1, 7.9, 7.8] },
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

export const HEDGE_TRIGGERS: HedgeTrigger[] = [
  { id: 'ht-021', lotId: 'AZ-2026-021', instrument: 'forward', description: 'Subir a venda a prazo de 50 % para 70 % do volume', threshold: 'Referência < 4,10 €/kg', current: '4,48 €/kg', status: 'armado', updatedAt: '2026-10-13' },
  { id: 'ht-024', lotId: 'AZ-2026-024', instrument: 'forward', description: 'Subir a venda a prazo de 40 % para 60 % do volume', threshold: 'Referência < 4,05 €/kg', current: '4,48 €/kg', status: 'armado', updatedAt: '2026-10-13' },
  { id: 'ht-014', lotId: 'AZ-2026-014', instrument: 'forward', description: 'Subir a venda a prazo de 50 % para 70 % do volume', threshold: 'Referência < 4,05 €/kg', current: '4,48 €/kg', status: 'armado', updatedAt: '2026-10-13' },
  { id: 'ht-031', lotId: 'AZ-2025-031', instrument: 'forward', description: 'Subir a venda a prazo de 50 % para 70 % do volume', threshold: 'Referência < 4,20 €/kg', current: '4,48 €/kg', status: 'armado', updatedAt: '2026-10-13' },
  { id: 'ht-009', lotId: 'AZ-2026-009', instrument: 'forward', description: 'Subir a venda a prazo de 40 % para 60 % do volume', threshold: 'Referência < 4,10 €/kg', current: '4,48 €/kg', status: 'armado', updatedAt: '2026-10-13' },
  { id: 'ht-017', lotId: 'AZ-2025-017', instrument: 'forward', description: 'Cobrir o restante do volume a preço fixo', threshold: 'Referência < 4,70 €/kg', current: 'Executado a 4,60 €/kg', status: 'executado', updatedAt: '2026-02-11' },
  { id: 'ht-cf1', lotId: 'CF-2027-001', instrument: 'ice-kc', description: 'Reduzir o volume a contratar na origem', threshold: 'KC < 2,60 USD/lb', current: '2,85 USD/lb', status: 'inativo', updatedAt: '2026-10-09' },
];

/* ------------------------------------------------------------ refunding */

export const REFUNDING_PLAYBOOKS: RefundingPlaybook[] = tidyDeep([
  {
    id: 'pb-azeite-preco',
    world: 'azeite',
    title: 'Choque de preço no azeite',
    trigger: 'Referência 15 % ou mais abaixo do preço de entrada durante 10 dias úteis seguidos.',
    appliesTo: ['AZ-2025-017', 'AZ-2025-031', 'AZ-2026-003', 'AZ-2026-009', 'AZ-2026-014', 'AZ-2026-019', 'AZ-2026-021', 'AZ-2026-024'],
    steps: [
      { order: 1, title: 'Alerta e confirmação do preço em duas fontes', owner: 'Tesouraria', sla: '24 h' },
      { order: 2, title: 'Revisão de stock, cobertura e reserva de primeira perda', owner: 'Comité de risco', sla: '48 h' },
      { order: 3, title: 'Executar o gatilho de cobertura seguinte', owner: 'Tesouraria', sla: '5 dias úteis' },
      { order: 4, title: 'Comunicar aos co-financiadores cenário base e adverso', owner: 'Produto & Comercial, com Jurídico', sla: '5 dias úteis' },
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
    id: 'pb-agua-prazo',
    world: 'agua',
    title: 'Vendas atrasadas na água',
    trigger: 'Menos de 50 % das paletes vendidas no mês 12.',
    appliesTo: ['AG-2026-002', 'AG-2026-003', 'AG-2026-005', 'AG-2026-007', 'AG-2026-010'],
    steps: [
      { order: 1, title: 'Rever rotação do armazém e datas de engarrafamento', owner: 'Operações', sla: '5 dias úteis' },
      { order: 2, title: 'Abrir canal secundário (cash & carry, exportação Galiza)', owner: 'Produto & Comercial', sla: '30 dias' },
      { order: 3, title: 'Propor extensão com custo de armazenagem explícito', owner: 'Comité de risco', sla: '30 dias antes do fim da janela' },
    ],
  },
  {
    id: 'pb-cafe-preco',
    world: 'cafe',
    title: 'Queda do KC (Fase 2)',
    trigger: 'KC 20 % abaixo do preço de entrada em 30 dias.',
    appliesTo: ['CF-2027-001', 'CF-2027-002'],
    steps: [
      { order: 1, title: 'Verificar margem de garantia na corretora', owner: 'Tesouraria', sla: '24 h' },
      { order: 2, title: 'Reforçar cobertura cambial EUR/USD', owner: 'Tesouraria', sla: '48 h' },
      { order: 3, title: 'Comunicar aos co-financiadores', owner: 'Produto & Comercial', sla: '5 dias úteis' },
    ],
  },
]);

/* ------------------------------------------------------------ transações */

export const TRANSACTIONS: Transaction[] = [
  { id: 'tx-2041', date: '2026-10-13', type: 'entrada-investidor', counterparty: 'Quinta das Lajes Holding, SA', lotId: 'AZ-2026-021', amount: 10000, rail: 'SEPA Instant', status: 'liquidada' },
  { id: 'tx-2040', date: '2026-10-12', type: 'entrada-investidor', counterparty: 'Family Office Atlântico Norte, Lda.', lotId: 'AZ-2026-024', amount: 10000, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2039', date: '2026-10-12', type: 'entrada-investidor', counterparty: 'Rui Teixeira Fonseca', lotId: 'AZ-2026-021', amount: 5000, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2038', date: '2026-10-12', type: 'custo-operacional', counterparty: 'Olea Analítica', lotId: 'AZ-2026-024', amount: -420, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2037', date: '2026-10-11', type: 'entrada-investidor', counterparty: 'Helena Brito Gestão de Patrimónios, Lda.', lotId: 'AZ-2026-021', amount: 12500, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2036', date: '2026-10-10', type: 'entrada-investidor', counterparty: 'Sociedade Agrícola Vale do Sorraia, SA', lotId: 'AZ-2026-021', amount: 8400, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2035', date: '2026-10-09', type: 'entrada-investidor', counterparty: 'Agro Invest Tejo, SA', lotId: 'AG-2026-007', amount: 5000, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2034', date: '2026-10-09', type: 'custo-operacional', counterparty: 'Olea Analítica', lotId: 'AZ-2026-021', amount: -420, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2033', date: '2026-10-08', type: 'entrada-investidor', counterparty: 'Norte Patrimonial, Lda.', lotId: 'AG-2026-007', amount: 4300, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2032', date: '2026-10-07', type: 'recebimento-comprador', counterparty: 'Cadeia de supermercados regional, Centro', lotId: 'AZ-2025-031', amount: 6216, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2031', date: '2026-10-07', type: 'entrada-investidor', counterparty: 'Family Office Atlântico Norte, Lda.', lotId: 'AG-2026-007', amount: 7000, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2030', date: '2026-10-06', type: 'entrada-investidor', counterparty: 'Quinta das Lajes Holding, SA', lotId: 'AG-2026-007', amount: 2500, rail: 'SEPA Instant', status: 'liquidada' },
  { id: 'tx-2029', date: '2026-10-06', type: 'custo-operacional', counterparty: 'Hidrolab Centro', lotId: 'AG-2026-007', amount: -310, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2028', date: '2026-10-05', type: 'custo-operacional', counterparty: 'Transportes do Interior, Lda.', lotId: 'AG-2026-003', amount: -1840, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2027', date: '2026-10-02', type: 'custo-operacional', counterparty: 'PSP · comissões de setembro', amount: -186, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2026', date: '2026-10-01', type: 'recebimento-comprador', counterparty: 'Distribuidor HoReCa, Lisboa', lotId: 'AZ-2025-017', amount: 12168, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2024', date: '2026-09-23', type: 'recebimento-comprador', counterparty: 'Grossista HoReCa, Braga', lotId: 'AG-2026-002', amount: 5398, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2022', date: '2026-09-17', type: 'recebimento-comprador', counterparty: 'Cash & carry, Coimbra', lotId: 'AZ-2026-009', amount: 5124, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2021', date: '2026-09-09', type: 'recebimento-comprador', counterparty: 'Cadeia de supermercados regional, Centro', lotId: 'AZ-2025-031', amount: 7992, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2020', date: '2026-09-05', type: 'recebimento-comprador', counterparty: 'Grossista HoReCa, Braga', lotId: 'AG-2026-002', amount: 4318, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2019', date: '2026-09-01', type: 'custo-operacional', counterparty: 'Seguro de mercadoria · prémio trimestral', amount: -2140, rail: 'SEPA', status: 'liquidada' },
  { id: 'tx-2042', date: '2026-10-13', type: 'recebimento-comprador', counterparty: 'Distribuidor HoReCa, Algarve', lotId: 'AZ-2026-003', amount: 34928, rail: 'SEPA', status: 'pendente' },
  { id: 'tx-2043', date: '2026-10-13', type: 'recebimento-comprador', counterparty: 'Cash & carry, Porto', lotId: 'AG-2026-003', amount: 14878, rail: 'SEPA', status: 'pendente' },
];
