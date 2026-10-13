import { PALETE, SACA_KG, tidyDeep } from '../lib/format';
import type {
  HedgeCoverage,
  JourneyStage,
  Lot,
  LotEconomics,
  Milestone,
  QualityAnalysis,
  RiskFactor,
  WorldId,
} from './types';
import { JOURNEY_STAGES } from './types';

/* =====================================================================
   Lotes de demonstração (fictícios). Os números derivam de poucos
   parâmetros (referência, desconto, aquisição, custos) para serem
   coerentes em todas as páginas.
   ===================================================================== */

const round = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;
const roundTo = (x: number, step: number) => Math.round(x / step) * step;

/** Parte da margem bruta dos co-financiadores e reserva de primeira perda. */
export const INVESTOR_SHARE = 0.65;
export const RESERVE_SHARE = 0.1;
export const SETTLEMENT_MONTHS = 18;
export const EXTENSION_MONTHS = 6;

function economics(o: { ref: number; discount: number; acq: number; costs: number; decimals: number }): LotEconomics {
  const buyerPrice = round(o.ref * (1 - o.discount), o.decimals);
  const fundingPrice = round(o.acq + o.costs, o.decimals);
  const grossMargin = round(buyerPrice - fundingPrice, o.decimals);
  const mid = (grossMargin * INVESTOR_SHARE) / fundingPrice;
  const high = roundTo(mid, 0.005);
  const low = Math.max(0, roundTo(mid - 0.02, 0.005));
  return {
    refPrice: o.ref,
    discountPct: o.discount,
    buyerPrice,
    acquisitionPrice: o.acq,
    costsPerUnit: o.costs,
    fundingPrice,
    grossMargin,
    investorShare: INVESTOR_SHARE,
    reserveShare: RESERVE_SHARE,
    expectedRange: [round(low, 3), round(high, 3)],
  };
}

const STAGE_NOTES: Record<WorldId, Record<JourneyStage, string>> = {
  azeite: {
    colhido: 'Azeitona colhida e moída no lagar no próprio dia.',
    analisado: 'Análise físico-química e painel de prova publicados.',
    'em-deposito': 'Azeite transferido para IBC selados com o número do lote.',
    'em-venda': 'Lote oferecido a compradores B2B abaixo da referência de mercado.',
    expedido: 'Últimos IBC entregues ao comprador.',
    liquidado: 'Comprador pagou; liquidação feita aos co-financiadores.',
  },
  agua: {
    colhido: 'Lote de engarrafamento fechado na linha.',
    analisado: 'Análise microbiológica e físico-química de conformidade publicada.',
    'em-deposito': 'Paletes em armazém, identificadas com o número do lote.',
    'em-venda': 'Paletes oferecidas a distribuição e HoReCa.',
    expedido: 'Últimas paletes entregues ao comprador.',
    liquidado: 'Comprador pagou; liquidação feita aos co-financiadores.',
  },
  cafe: {
    colhido: 'Cereja colhida, seca no terreiro e descascada.',
    analisado: 'Classificação física e prova SCA publicadas.',
    'em-deposito': 'Sacas de 60 kg em armazém na origem.',
    'em-venda': 'Café verde oferecido a torrefações.',
    expedido: 'Contentor embarcado para Leixões.',
    liquidado: 'Comprador pagou; liquidação feita aos co-financiadores.',
  },
};

function milestones(world: WorldId, done: Partial<Record<JourneyStage, string>>, planned: Partial<Record<JourneyStage, string>> = {}, notes: Partial<Record<JourneyStage, string>> = {}): Milestone[] {
  return JOURNEY_STAGES.map((stage) => ({
    stage,
    date: done[stage],
    planned: planned[stage],
    done: Boolean(done[stage]),
    note: notes[stage] ?? STAGE_NOTES[world][stage],
  }));
}

/* ------------------------------------------------------- riscos */

function oliveRisks(extra: Partial<Record<string, Partial<RiskFactor>>> = {}): RiskFactor[] {
  const base: RiskFactor[] = [
    {
      id: 'preco',
      title: 'Queda do preço de referência',
      body: 'O preço do azeite na origem caiu mais de 35 % desde o início de 2025. Se a referência descer abaixo do preço de entrada, a margem desaparece e pode haver perda de capital.',
      severity: 'alta',
      mitigation: 'Venda a prazo de parte do volume, cláusulas de indexação, reserva de primeira perda e extensão até 6 meses.',
    },
    {
      id: 'qualidade',
      title: 'Desclassificação do azeite',
      body: 'Um virgem extra pode descer a virgem se a acidez, os peróxidos ou o painel de prova mudarem durante a armazenagem. Um azeite virgem vende-se 15–25 % abaixo.',
      severity: 'media',
      mitigation: 'Análise à entrada e a cada 4 meses, armazenagem sob azoto a 15–18 °C e sem luz.',
    },
    {
      id: 'prazo',
      title: 'Atraso nas vendas',
      body: 'Se o lote não for vendido dentro da janela, a liquidação atrasa. A extensão tem custos de armazenagem que reduzem o resultado.',
      severity: 'media',
      mitigation: 'Compradores pré-qualificados e venda a prazo de parte do volume antes da expedição.',
    },
    {
      id: 'contraparte',
      title: 'Incumprimento do comprador',
      body: 'Um comprador pode pagar tarde ou não pagar. O lote só liquida quando o dinheiro entra na conta segregada.',
      severity: 'media',
      mitigation: 'Seguro de crédito e pagamento antes da expedição para compradores sem histórico.',
    },
    {
      id: 'custodia',
      title: 'Perda física em custódia',
      body: 'Derrame, contaminação ou incêndio no armazém do produtor afetam a mercadoria que garante o lote.',
      severity: 'baixa',
      mitigation: 'Seguro de mercadoria, IBC selados com o número do lote e inventário mensal com fotografia.',
    },
    {
      id: 'liquidez',
      title: 'Capital imobilizado, sem mercado secundário',
      body: 'Não há forma de vender a posição antes da liquidação. O capital fica comprometido até 18 meses, ou 24 com extensão.',
      severity: 'alta',
      mitigation: 'Comprometer apenas capital de que não precisa nesse prazo. A simulação de campanha mostra cenários de perda.',
    },
  ];
  return base.map((r) => ({ ...r, ...(extra[r.id] ?? {}) }));
}

function waterRisks(): RiskFactor[] {
  return [
    {
      id: 'prazo',
      title: 'Procura sazonal e atraso nas vendas',
      body: 'A água vende-se sobretudo entre maio e setembro. Um verão fraco ou chuvoso atrasa o escoamento das paletes.',
      severity: 'media',
      mitigation: 'Contratos anuais de fornecimento com entregas mensais.',
    },
    {
      id: 'margem',
      title: 'Margem fina por litro',
      body: 'A margem é de poucos cêntimos por litro. Uma subida do transporte ou do PET come uma parte relevante do resultado.',
      severity: 'media',
      mitigation: 'Custos de transporte fixados no contrato com o comprador; PET comprado com o lote.',
    },
    {
      id: 'conservacao',
      title: 'Conservação das garrafas',
      body: 'Garrafas de PET expostas ao sol ou ao calor perdem valor comercial e podem ser recusadas pelo comprador.',
      severity: 'baixa',
      mitigation: 'Armazém coberto, rotação por data de engarrafamento e inventário mensal.',
    },
    {
      id: 'contraparte',
      title: 'Incumprimento do comprador',
      body: 'Um comprador pode pagar tarde ou não pagar. O lote só liquida quando o dinheiro entra na conta segregada.',
      severity: 'media',
      mitigation: 'Seguro de crédito e limites por comprador.',
    },
    {
      id: 'liquidez',
      title: 'Capital imobilizado, sem mercado secundário',
      body: 'Não há forma de vender a posição antes da liquidação. O capital fica comprometido até 18 meses, ou 24 com extensão.',
      severity: 'alta',
      mitigation: 'Comprometer apenas capital de que não precisa nesse prazo.',
    },
  ];
}

function coffeeRisks(): RiskFactor[] {
  return [
    {
      id: 'preco',
      title: 'Volatilidade do preço do arábica',
      body: 'O contrato ICE KC passou de cerca de 4,41 USD/lb em fevereiro de 2025 para 2,85 USD/lb em outubro de 2026. Movimentos de 20 % num trimestre são comuns.',
      severity: 'alta',
      mitigation: 'Venda de futuros KC sobre 80 % do volume até à venda física.',
    },
    {
      id: 'cambio',
      title: 'Câmbio EUR/USD',
      body: 'O café verde é cotado em dólares. Uma valorização do euro reduz o valor do lote em euros.',
      severity: 'media',
      mitigation: 'Cobertura cambial a prazo sobre o valor coberto em KC.',
    },
    {
      id: 'qualidade',
      title: 'Humidade e defeitos',
      body: 'Grão acima de 12,5 % de humidade ganha fungos; defeitos de categoria 1 tiram o lote da especialidade.',
      severity: 'media',
      mitigation: 'Classificação na origem e à chegada a Leixões, com tolerâncias no contrato.',
    },
    {
      id: 'logistica',
      title: 'Atraso no embarque',
      body: 'Congestionamento portuário ou falta de contentores atrasam a chegada e a venda.',
      severity: 'media',
      mitigation: 'Janela de embarque com margem de 60 dias e seguro de transporte.',
    },
    {
      id: 'contraparte',
      title: 'Cumprimento do produtor',
      body: 'Numa safra fraca o produtor pode entregar menos do que o contratado.',
      severity: 'media',
      mitigation: 'Pagamento contra documentos de embarque, nunca adiantado.',
    },
    {
      id: 'liquidez',
      title: 'Capital imobilizado, sem mercado secundário',
      body: 'Não há forma de vender a posição antes da liquidação.',
      severity: 'alta',
      mitigation: 'Comprometer apenas capital de que não precisa nesse prazo.',
    },
  ];
}

const EXTENSION = {
  maxMonths: EXTENSION_MONTHS,
  conditions: [
    'O preço de referência está 15 % ou mais abaixo do preço de entrada no mês 18, ou',
    'mais de 30 % do stock continua por vender no mês 18.',
  ],
  decision: 'A extensão é proposta pela Tesouraria, justificada por escrito e comunicada aos co-financiadores 30 dias antes do fim da janela. Só há uma extensão por lote.',
};

/* ------------------------------------------------------- análises */

function oliveAnalysis(o: {
  id: string; date: string; acidez: number; peroxidos: number; k232: number; k268: number; deltaK: number; md: number; mf: number; atributos: string[]; note?: string;
}): QualityAnalysis {
  const ve = o.acidez <= 0.8 && o.peroxidos <= 20 && o.k232 <= 2.5 && o.k268 <= 0.22 && o.deltaK <= 0.01 && o.md === 0 && o.mf > 0;
  return {
    id: o.id,
    lab: 'Olea Analítica · laboratório acreditado ISO/IEC 17025',
    date: o.date,
    reportId: `OA-${o.id.toUpperCase()}`,
    category: ve ? 'Azeite virgem extra' : 'Azeite virgem',
    reference: 'Reg. Delegado (UE) 2022/2104, anexo I',
    params: [
      { id: 'acidez', label: 'Acidez (ácido oleico)', value: o.acidez, unit: '%', comparator: '≤', limit: 0.8, limitLabel: '≤ 0,80', pass: o.acidez <= 0.8 },
      { id: 'peroxidos', label: 'Índice de peróxidos', value: o.peroxidos, unit: 'meq O₂/kg', comparator: '≤', limit: 20, limitLabel: '≤ 20', pass: o.peroxidos <= 20 },
      { id: 'k232', label: 'K232', value: o.k232, unit: '', comparator: '≤', limit: 2.5, limitLabel: '≤ 2,50', pass: o.k232 <= 2.5 },
      { id: 'k268', label: 'K268', value: o.k268, unit: '', comparator: '≤', limit: 0.22, limitLabel: '≤ 0,22', pass: o.k268 <= 0.22 },
      { id: 'deltaK', label: 'ΔK', value: o.deltaK, unit: '', comparator: '≤', limit: 0.01, limitLabel: '≤ 0,01', pass: o.deltaK <= 0.01 },
      { id: 'md', label: 'Mediana do defeito', value: o.md, unit: '', comparator: '=', limit: 0, limitLabel: '= 0', pass: o.md === 0 },
      { id: 'mf', label: 'Mediana do frutado', value: o.mf, unit: '', comparator: '>', limit: 0, limitLabel: '> 0', pass: o.mf > 0 },
    ],
    panel: { medianaFrutado: o.mf, medianaDefeito: o.md, atributos: o.atributos },
    note: o.note,
  };
}

function waterAnalysis(o: { id: string; date: string; residuo: number; ph: number; nitratos: number; note?: string }): QualityAnalysis {
  return {
    id: o.id,
    lab: 'Hidrolab Centro · laboratório acreditado ISO/IEC 17025',
    date: o.date,
    reportId: `HL-${o.id.toUpperCase()}`,
    category: 'Conforme',
    reference: 'Decreto-Lei 156/98 e Diretiva 2009/54/CE',
    params: [
      { id: 'residuo', label: 'Resíduo seco a 180 °C', value: o.residuo, unit: 'mg/L', comparator: '≤', limit: 50, limitLabel: '≤ 50 (muito pouco mineralizada)', pass: o.residuo <= 50 },
      { id: 'ph', label: 'pH', value: o.ph, unit: '', comparator: '≥', limit: 4.5, limitLabel: 'declarado no rótulo', pass: true },
      { id: 'nitratos', label: 'Nitratos', value: o.nitratos, unit: 'mg/L', comparator: '≤', limit: 50, limitLabel: '≤ 50', pass: o.nitratos <= 50 },
      { id: 'ecoli', label: 'E. coli', value: 0, unit: 'ufc/250 mL', comparator: '=', limit: 0, limitLabel: '0 / 250 mL', pass: true },
      { id: 'enterococos', label: 'Enterococos', value: 0, unit: 'ufc/250 mL', comparator: '=', limit: 0, limitLabel: '0 / 250 mL', pass: true },
      { id: 'pseudomonas', label: 'Pseudomonas aeruginosa', value: 0, unit: 'ufc/250 mL', comparator: '=', limit: 0, limitLabel: '0 / 250 mL', pass: true },
    ],
    note: o.note,
  };
}

function coffeeAnalysis(o: { id: string; date: string; humidade: number; cat1: number; total: number; sca: number; peneira: string; note?: string }): QualityAnalysis {
  return {
    id: o.id,
    lab: 'Classificador Q-Grader independente',
    date: o.date,
    reportId: `QG-${o.id.toUpperCase()}`,
    category: o.sca >= 80 && o.cat1 === 0 && o.total <= 5 ? 'Especialidade (amostra pré-safra)' : 'Comercial',
    reference: 'Protocolo SCA de classificação de café verde (amostra de 350 g)',
    params: [
      { id: 'humidade', label: 'Humidade do grão', value: o.humidade, unit: '%', comparator: '≤', limit: 12.5, limitLabel: '8–12,5', pass: o.humidade <= 12.5 && o.humidade >= 8 },
      { id: 'cat1', label: 'Defeitos de categoria 1', value: o.cat1, unit: '', comparator: '=', limit: 0, limitLabel: '= 0', pass: o.cat1 === 0 },
      { id: 'total', label: 'Defeitos completos (total)', value: o.total, unit: '', comparator: '≤', limit: 5, limitLabel: '≤ 5', pass: o.total <= 5 },
      { id: 'sca', label: 'Pontuação SCA', value: o.sca, unit: 'pts', comparator: '≥', limit: 80, limitLabel: '≥ 80', pass: o.sca >= 80 },
    ],
    note: `Peneira ${o.peneira}. ${o.note ?? ''}`.trim(),
  };
}

/* ------------------------------------------------------- coberturas */

const forward = (coverage: number, costPct: number, counterparty: string, trigger: string, note?: string): HedgeCoverage => ({
  instrument: 'forward',
  label: 'Venda a prazo com preço fixado',
  coverage,
  costPct,
  counterparty,
  trigger,
  note: note ?? `${Math.round(coverage * 100)} % do volume vendido a prazo; o restante segue indexado à referência de origem.`,
});

const NO_HEDGE: HedgeCoverage = {
  instrument: 'nenhuma',
  label: 'Sem cobertura de preço',
  coverage: 0,
  costPct: 0,
  note: 'Preço estável; o risco de prazo é gerido com contratos anuais de fornecimento.',
};

const kc = (coverage: number): HedgeCoverage => ({
  instrument: 'ice-kc',
  label: 'Futuros ICE Arabica (KC)',
  coverage,
  costPct: 0.015,
  counterparty: 'Corretor de futuros (a selecionar na Fase 2)',
  trigger: 'Cobertura aberta na compra; fecha à medida que o café físico é vendido.',
  note: `${Math.round(coverage * 100)} % do volume coberto com venda de futuros KC e cobertura cambial EUR/USD.`,
});

/* ------------------------------------------------------- lotes */

const kgLot = (q: number) => ({ quantity: q, unit: 'kg' as const, quantityBase: q, baseUnit: 'kg' as const });
const paleteLot = (p: number) => ({ quantity: p, unit: 'palete' as const, quantityBase: p * PALETE.litros, baseUnit: 'L' as const });
const sacaLot = (s: number) => ({ quantity: s, unit: 'saca' as const, quantityBase: s * SACA_KG, baseUnit: 'kg' as const });

const goal = (base: number, price: number) => roundTo(base * price, 10);

function lot(l: Omit<Lot, 'funding'> & { funding: Omit<Lot['funding'], 'goal'> & { goal?: number } }): Lot {
  const g = l.funding.goal ?? goal(l.quantityBase, l.economics.fundingPrice);
  // Lotes com financiamento fechado estão a 100 %.
  const raised = l.funding.closedAt ? g : l.funding.raised;
  return { ...l, funding: { ...l.funding, goal: g, raised } };
}

export const LOTS: Lot[] = tidyDeep([
  /* ============================ AZEITE ============================ */
  lot({
    id: 'AZ-2025-004',
    world: 'azeite',
    producerId: 'olival-guadiana',
    regionId: 'alentejo',
    campanha: '2024/25',
    title: 'Virgem extra Galega e Cordovil',
    product: 'Azeite virgem extra a granel, colheita de dezembro',
    ...kgLot(30000),
    economics: economics({ ref: 7.1, discount: 0.12, acq: 5.4, costs: 0.24, decimals: 2 }),
    funding: { raised: 169200, coFinancers: 11, minTicket: 5000, maxTicket: 30000, opensAt: '2025-01-08', closedAt: '2025-01-20' },
    status: 'liquidado',
    stage: 'liquidado',
    milestones: milestones('azeite', { colhido: '2024-12-12', analisado: '2024-12-20', 'em-deposito': '2025-01-22', 'em-venda': '2025-02-03', expedido: '2026-05-28', liquidado: '2026-06-30' }),
    settlement: { windowMonths: 18, start: '2025-01-20', plannedEnd: '2026-07-20', settledAt: '2026-06-30', settledResult: 0.018 },
    extension: EXTENSION,
    hedge: forward(0.6, 0.011, 'Distribuidor alimentar, Lisboa', 'Cobertura fixa desde a compra.'),
    analyses: [oliveAnalysis({ id: 'az2025004-1', date: '2024-12-20', acidez: 0.24, peroxidos: 7.9, k232: 1.92, k268: 0.15, deltaK: 0.002, md: 0, mf: 4.6, atributos: ['Frutado maduro', 'Amargo ligeiro', 'Picante médio'] })],
    riskFactors: oliveRisks(),
    storage: { local: 'Lagar do Olival do Guadiana, Moura', container: 'IBC de 1 000 kg', containers: 30 },
    stock: 0,
    buyer: { segment: 'Distribuição', descricao: 'distribuidor alimentar, Lisboa' },
    refundingPlaybookId: 'pb-azeite-preco',
  }),
  lot({
    id: 'AZ-2025-009',
    world: 'azeite',
    producerId: 'lagar-ribeira-alta',
    regionId: 'tras-os-montes',
    campanha: '2024/25',
    title: 'Virgem extra Verdeal e Madural',
    product: 'Azeite virgem extra a granel, DOP Trás-os-Montes',
    ...kgLot(18000),
    economics: economics({ ref: 6.85, discount: 0.13, acq: 5.25, costs: 0.26, decimals: 2 }),
    funding: { raised: 99180, coFinancers: 8, minTicket: 5000, maxTicket: 25000, opensAt: '2025-02-10', closedAt: '2025-02-21' },
    status: 'liquidado',
    stage: 'liquidado',
    milestones: milestones(
      'azeite',
      { colhido: '2025-01-14', analisado: '2025-01-24', 'em-deposito': '2025-02-24', 'em-venda': '2025-03-03', expedido: '2026-07-30', liquidado: '2026-08-14' },
      {},
      { liquidado: 'Liquidado com perda de 3,4 % do capital depois de a reserva de primeira perda absorver 5 % do valor do lote.' },
    ),
    settlement: { windowMonths: 18, start: '2025-02-21', plannedEnd: '2026-08-21', settledAt: '2026-08-14', settledResult: -0.034 },
    extension: EXTENSION,
    hedge: forward(0.4, 0.009, 'Cash & carry, Porto', 'Cobertura fixa desde a compra.'),
    analyses: [oliveAnalysis({ id: 'az2025009-1', date: '2025-01-24', acidez: 0.18, peroxidos: 6.2, k232: 1.81, k268: 0.13, deltaK: 0.001, md: 0, mf: 5.1, atributos: ['Frutado verde', 'Amargo médio', 'Picante intenso'] })],
    riskFactors: oliveRisks(),
    storage: { local: 'Lagar da Ribeira Alta, Mirandela', container: 'Depósito de inox', containers: 1 },
    stock: 0,
    buyer: { segment: 'Cash & carry', descricao: 'cash & carry, Porto' },
    refundingPlaybookId: 'pb-azeite-preco',
  }),
  lot({
    id: 'AZ-2025-017',
    world: 'azeite',
    producerId: 'herdade-monte-claro',
    regionId: 'ribatejo',
    campanha: '2024/25',
    title: 'Virgem extra Galega',
    product: 'Azeite virgem extra a granel, Galega de vale',
    ...kgLot(26000),
    economics: economics({ ref: 6.6, discount: 0.12, acq: 5.02, costs: 0.25, decimals: 2 }),
    funding: { raised: 137020, coFinancers: 9, minTicket: 5000, maxTicket: 25000, opensAt: '2025-02-27', closedAt: '2025-03-10' },
    status: 'em-extensao',
    stage: 'em-venda',
    milestones: milestones(
      'azeite',
      { colhido: '2025-01-30', analisado: '2025-02-12', 'em-deposito': '2025-03-14', 'em-venda': '2025-04-01' },
      { expedido: '2027-02-15', liquidado: '2027-03-10' },
      { 'em-venda': 'Em venda. Janela estendida 6 meses: a referência caiu 32 % e 40 % do stock estava por vender no mês 18.' },
    ),
    settlement: { windowMonths: 18, start: '2025-03-10', plannedEnd: '2026-09-10', extendedTo: '2027-03-10' },
    extension: EXTENSION,
    hedge: forward(0.5, 0.01, 'Distribuidor HoReCa, Lisboa', 'Gatilho executado em fevereiro de 2026: cobertura do restante a 4,60 €/kg.'),
    analyses: [
      oliveAnalysis({ id: 'az2025017-1', date: '2025-02-12', acidez: 0.27, peroxidos: 8.4, k232: 1.98, k268: 0.16, deltaK: 0.003, md: 0, mf: 4.2, atributos: ['Frutado maduro', 'Amargo ligeiro', 'Picante ligeiro'] }),
      oliveAnalysis({ id: 'az2025017-2', date: '2026-08-20', acidez: 0.38, peroxidos: 12.6, k232: 2.21, k268: 0.19, deltaK: 0.004, md: 0, mf: 3.1, atributos: ['Frutado maduro', 'Amargo ligeiro'], note: 'Reanálise aos 18 meses: mantém a categoria virgem extra.' }),
    ],
    riskFactors: oliveRisks(),
    storage: { local: 'Nave climatizada da Herdade Monte Claro, Santarém', container: 'IBC de 1 000 kg', containers: 26 },
    stock: 10400,
    buyer: { segment: 'HoReCa', descricao: 'distribuidor HoReCa, Lisboa' },
    refundingPlaybookId: 'pb-azeite-preco',
  }),
  lot({
    id: 'AZ-2025-031',
    world: 'azeite',
    producerId: 'lagar-serra-gardunha',
    regionId: 'beira-interior',
    campanha: '2025/26',
    title: 'Virgem extra Galega, colheita precoce',
    product: 'Azeite virgem extra a granel, frutado verde',
    ...kgLot(20000),
    economics: economics({ ref: 5.05, discount: 0.12, acq: 3.78, costs: 0.22, decimals: 2 }),
    funding: { raised: 80000, coFinancers: 6, minTicket: 5000, maxTicket: 25000, opensAt: '2025-11-24', closedAt: '2025-12-05' },
    status: 'financiado',
    stage: 'em-venda',
    milestones: milestones('azeite', { colhido: '2025-10-28', analisado: '2025-11-12', 'em-deposito': '2025-12-09', 'em-venda': '2026-03-02' }, { expedido: '2027-01-15', liquidado: '2027-06-05' }),
    settlement: { windowMonths: 18, start: '2025-12-05', plannedEnd: '2027-06-05' },
    extension: EXTENSION,
    hedge: forward(0.5, 0.01, 'Cadeia de supermercados regional, Centro', 'Se a referência descer abaixo de 4,20 €/kg, a cobertura sobe para 70 %.'),
    analyses: [
      oliveAnalysis({ id: 'az2025031-1', date: '2025-11-12', acidez: 0.19, peroxidos: 5.8, k232: 1.79, k268: 0.12, deltaK: 0.001, md: 0, mf: 5.8, atributos: ['Frutado verde', 'Amargo intenso', 'Picante intenso'] }),
      oliveAnalysis({ id: 'az2025031-2', date: '2026-07-14', acidez: 0.26, peroxidos: 9.1, k232: 1.97, k268: 0.15, deltaK: 0.002, md: 0, mf: 4.9, atributos: ['Frutado verde', 'Amargo médio', 'Picante médio'], note: 'Reanálise aos 8 meses.' }),
    ],
    riskFactors: oliveRisks(),
    storage: { local: 'Lagar Serra da Gardunha, Fundão', container: 'IBC de 1 000 kg', containers: 20 },
    stock: 11600,
    buyer: { segment: 'Retalho', descricao: 'cadeia de supermercados regional, Centro' },
    refundingPlaybookId: 'pb-azeite-preco',
  }),
  lot({
    id: 'AZ-2026-003',
    world: 'azeite',
    producerId: 'olival-guadiana',
    regionId: 'alentejo',
    campanha: '2025/26',
    title: 'Virgem extra Cobrançosa e Galega',
    product: 'Azeite virgem extra a granel',
    ...kgLot(28000),
    economics: economics({ ref: 4.95, discount: 0.11, acq: 3.7, costs: 0.21, decimals: 2 }),
    funding: { raised: 109480, coFinancers: 10, minTicket: 5000, maxTicket: 25000, opensAt: '2026-01-05', closedAt: '2026-01-15' },
    status: 'financiado',
    stage: 'expedido',
    milestones: milestones(
      'azeite',
      { colhido: '2025-12-04', analisado: '2025-12-16', 'em-deposito': '2026-01-19', 'em-venda': '2026-02-02', expedido: '2026-10-02' },
      { liquidado: '2026-12-01' },
      { expedido: '28 IBC entregues a distribuidor HoReCa no Algarve; pagamento a 60 dias.' },
    ),
    settlement: { windowMonths: 18, start: '2026-01-15', plannedEnd: '2027-07-15' },
    extension: EXTENSION,
    hedge: forward(0.6, 0.011, 'Distribuidor HoReCa, Algarve', 'Cobertura fixa desde a compra.'),
    analyses: [oliveAnalysis({ id: 'az2026003-1', date: '2025-12-16', acidez: 0.22, peroxidos: 7.1, k232: 1.88, k268: 0.14, deltaK: 0.002, md: 0, mf: 4.8, atributos: ['Frutado maduro', 'Amargo médio', 'Picante médio'] })],
    riskFactors: oliveRisks(),
    storage: { local: 'Lagar do Olival do Guadiana, Moura', container: 'IBC de 1 000 kg', containers: 28 },
    stock: 0,
    buyer: { segment: 'HoReCa', descricao: 'distribuidor HoReCa, Algarve' },
    refundingPlaybookId: 'pb-azeite-preco',
  }),
  lot({
    id: 'AZ-2026-009',
    world: 'azeite',
    producerId: 'lagar-serra-gardunha',
    regionId: 'beira-interior',
    campanha: '2025/26',
    title: 'Virgem extra Galega e Cobrançosa',
    product: 'Azeite virgem extra a granel',
    ...kgLot(16000),
    economics: economics({ ref: 4.85, discount: 0.12, acq: 3.6, costs: 0.21, decimals: 2 }),
    funding: { raised: 60960, coFinancers: 5, minTicket: 5000, maxTicket: 20000, opensAt: '2026-02-09', closedAt: '2026-02-20' },
    status: 'financiado',
    stage: 'em-venda',
    milestones: milestones('azeite', { colhido: '2026-01-08', analisado: '2026-01-21', 'em-deposito': '2026-02-24', 'em-venda': '2026-04-06' }, { expedido: '2027-03-01', liquidado: '2027-08-20' }),
    settlement: { windowMonths: 18, start: '2026-02-20', plannedEnd: '2027-08-20' },
    extension: EXTENSION,
    hedge: forward(0.4, 0.009, 'Cash & carry, Coimbra', 'Se a referência descer abaixo de 4,10 €/kg, a cobertura sobe para 60 %.'),
    analyses: [oliveAnalysis({ id: 'az2026009-1', date: '2026-01-21', acidez: 0.29, peroxidos: 8.8, k232: 2.02, k268: 0.16, deltaK: 0.003, md: 0, mf: 4.4, atributos: ['Frutado verde', 'Amargo médio', 'Picante médio'] })],
    riskFactors: oliveRisks(),
    storage: { local: 'Lagar Serra da Gardunha, Fundão', container: 'IBC de 1 000 kg', containers: 16 },
    stock: 9800,
    buyer: { segment: 'Cash & carry', descricao: 'cash & carry, Coimbra' },
    refundingPlaybookId: 'pb-azeite-preco',
  }),
  lot({
    id: 'AZ-2026-014',
    world: 'azeite',
    producerId: 'herdade-monte-claro',
    regionId: 'ribatejo',
    campanha: '2025/26',
    title: 'Virgem extra Galega e Arbequina',
    product: 'Azeite virgem extra a granel, lote isolado em IBC',
    ...kgLot(22000),
    economics: economics({ ref: 4.55, discount: 0.12, acq: 3.36, costs: 0.22, decimals: 2 }),
    funding: { raised: 78760, coFinancers: 7, minTicket: 5000, maxTicket: 25000, opensAt: '2026-06-02', closedAt: '2026-06-18' },
    status: 'financiado',
    stage: 'em-deposito',
    milestones: milestones(
      'azeite',
      { colhido: '2026-01-26', analisado: '2026-05-28', 'em-deposito': '2026-06-25' },
      { 'em-venda': '2026-11-02', expedido: '2027-06-30', liquidado: '2027-12-18' },
      { 'em-deposito': '22 IBC selados com o número AZ-2026-014 na nave climatizada.' },
    ),
    settlement: { windowMonths: 18, start: '2026-06-18', plannedEnd: '2027-12-18' },
    extension: EXTENSION,
    hedge: forward(0.5, 0.01, 'Distribuidor alimentar, Lisboa', 'Se a referência descer abaixo de 4,05 €/kg, a cobertura sobe para 70 %.'),
    analyses: [oliveAnalysis({ id: 'az2026014-1', date: '2026-05-28', acidez: 0.31, peroxidos: 9.4, k232: 2.04, k268: 0.17, deltaK: 0.003, md: 0, mf: 4.1, atributos: ['Frutado maduro', 'Amargo ligeiro', 'Picante médio'] })],
    riskFactors: oliveRisks(),
    storage: { local: 'Nave climatizada da Herdade Monte Claro, Santarém', container: 'IBC de 1 000 kg', containers: 22 },
    stock: 22000,
    buyer: { segment: 'Distribuição', descricao: 'distribuidor alimentar, Lisboa' },
    refundingPlaybookId: 'pb-azeite-preco',
  }),
  lot({
    id: 'AZ-2026-019',
    world: 'azeite',
    producerId: 'lagar-serra-gardunha',
    regionId: 'beira-interior',
    campanha: '2026/27',
    title: 'Virgem extra Galega, colheita precoce',
    product: 'Azeite novo, frutado verde',
    ...kgLot(18000),
    economics: economics({ ref: 4.48, discount: 0.12, acq: 3.3, costs: 0.21, decimals: 2 }),
    funding: { raised: 0, coFinancers: 0, minTicket: 5000, maxTicket: 20000, opensAt: '2026-10-23', opensPlanned: '2026-10-23' },
    status: 'em-preparacao',
    stage: 'colhido',
    milestones: milestones('azeite', { colhido: '2026-10-08' }, { analisado: '2026-10-21', 'em-deposito': '2026-11-06', 'em-venda': '2027-02-01', expedido: '2027-09-30', liquidado: '2028-05-06' }),
    settlement: { windowMonths: 18 },
    extension: EXTENSION,
    hedge: forward(0.5, 0.01, 'A contratar', 'Cobertura contratada antes da abertura do financiamento.'),
    analyses: [],
    riskFactors: oliveRisks(),
    storage: { local: 'Lagar Serra da Gardunha, Fundão', container: 'Depósito de inox', containers: 1 },
    stock: 14250,
    refundingPlaybookId: 'pb-azeite-preco',
  }),
  lot({
    id: 'AZ-2026-021',
    world: 'azeite',
    producerId: 'lagar-ribeira-alta',
    regionId: 'tras-os-montes',
    campanha: '2026/27',
    title: 'Virgem extra Verdeal e Cobrançosa',
    product: 'Azeite novo virgem extra a granel, DOP Trás-os-Montes',
    ...kgLot(24000),
    economics: economics({ ref: 4.48, discount: 0.12, acq: 3.32, costs: 0.21, decimals: 2 }),
    funding: { raised: 50900, coFinancers: 7, minTicket: 5000, maxTicket: 25000, opensAt: '2026-10-10' },
    status: 'aberto',
    stage: 'analisado',
    milestones: milestones(
      'azeite',
      { colhido: '2026-10-05', analisado: '2026-10-09' },
      { 'em-deposito': '2026-10-27', 'em-venda': '2027-02-01', expedido: '2027-09-30', liquidado: '2028-04-30' },
      {
        colhido: 'Primeiras moendas da campanha; 24 000 kg separados nos depósitos 1 e 2.',
        analisado: 'Acidez 0,21 %, painel sem defeitos, frutado verde 5,4.',
        'em-deposito': 'Transferência para 24 IBC selados com o número do lote, depois de fechado o financiamento.',
      },
    ),
    settlement: { windowMonths: 18, plannedEnd: '2028-04-30' },
    extension: EXTENSION,
    hedge: forward(0.5, 0.01, 'Cadeia de distribuição alimentar, Norte', 'Se a referência descer abaixo de 4,10 €/kg, a cobertura sobe para 70 %.', '50 % do volume vendido a prazo a 3,96 €/kg, com entregas de fevereiro a junho de 2027; o restante segue indexado à referência de origem.'),
    analyses: [oliveAnalysis({ id: 'az2026021-1', date: '2026-10-09', acidez: 0.21, peroxidos: 6.8, k232: 1.86, k268: 0.14, deltaK: 0.002, md: 0, mf: 5.4, atributos: ['Frutado verde', 'Amargo médio', 'Picante intenso'], note: 'Notas de folha de oliveira, erva cortada e amêndoa verde.' })],
    riskFactors: oliveRisks(),
    storage: { local: 'Lagar da Ribeira Alta, Mirandela', container: 'IBC de 1 000 kg', containers: 24 },
    stock: 24000,
    buyer: { segment: 'Distribuição', descricao: 'cadeia de distribuição alimentar, Norte' },
    refundingPlaybookId: 'pb-azeite-preco',
  }),
  lot({
    id: 'AZ-2026-024',
    world: 'azeite',
    producerId: 'olival-guadiana',
    regionId: 'alentejo',
    campanha: '2026/27',
    title: 'Virgem extra Galega e Cordovil',
    product: 'Azeite novo virgem extra a granel, DOP Moura',
    ...kgLot(30000),
    economics: economics({ ref: 4.46, discount: 0.13, acq: 3.26, costs: 0.21, decimals: 2 }),
    funding: { raised: 18900, coFinancers: 3, minTicket: 5000, maxTicket: 30000, opensAt: '2026-10-12' },
    status: 'aberto',
    stage: 'analisado',
    milestones: milestones(
      'azeite',
      { colhido: '2026-10-03', analisado: '2026-10-11' },
      { 'em-deposito': '2026-11-10', 'em-venda': '2027-02-01', expedido: '2027-09-30', liquidado: '2028-05-10' },
    ),
    settlement: { windowMonths: 18, plannedEnd: '2028-05-10' },
    extension: EXTENSION,
    hedge: forward(0.4, 0.009, 'Distribuidor alimentar, Lisboa', 'Se a referência descer abaixo de 4,05 €/kg, a cobertura sobe para 60 %.'),
    analyses: [oliveAnalysis({ id: 'az2026024-1', date: '2026-10-11', acidez: 0.26, peroxidos: 7.4, k232: 1.9, k268: 0.15, deltaK: 0.002, md: 0, mf: 4.7, atributos: ['Frutado maduro', 'Amargo ligeiro', 'Picante médio'], note: 'Notas de tomate maduro e frutos secos.' })],
    riskFactors: oliveRisks(),
    storage: { local: 'Lagar do Olival do Guadiana, Moura', container: 'IBC de 1 000 kg', containers: 30 },
    stock: 30000,
    buyer: { segment: 'Distribuição', descricao: 'distribuidor alimentar, Lisboa' },
    refundingPlaybookId: 'pb-azeite-preco',
  }),

  /* ============================ ÁGUA ============================ */
  lot({
    id: 'AG-2025-011',
    world: 'agua',
    producerId: 'aguas-fonte-fria',
    regionId: 'beira-interior',
    campanha: '2024/25',
    title: 'Água mineral natural 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6',
    ...paleteLot(260),
    economics: economics({ ref: 0.29, discount: 0.12, acq: 0.198, costs: 0.032, decimals: 3 }),
    funding: { raised: 45210, coFinancers: 6, minTicket: 2500, maxTicket: 15000, opensAt: '2025-03-24', closedAt: '2025-04-02' },
    status: 'liquidado',
    stage: 'liquidado',
    milestones: milestones('agua', { colhido: '2025-03-14', analisado: '2025-03-19', 'em-deposito': '2025-04-03', 'em-venda': '2025-04-15', expedido: '2026-06-30', liquidado: '2026-07-31' }),
    settlement: { windowMonths: 18, start: '2025-04-02', plannedEnd: '2026-10-02', settledAt: '2026-07-31', settledResult: 0.064 },
    extension: EXTENSION,
    hedge: NO_HEDGE,
    analyses: [waterAnalysis({ id: 'ag2025011-1', date: '2025-03-19', residuo: 31, ph: 5.9, nitratos: 1.2 })],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém de Águas da Fonte Fria, Manteigas', container: 'Palete de 504 garrafas', containers: 260 },
    stock: 0,
    buyer: { segment: 'HoReCa', descricao: 'grossista HoReCa, Centro' },
    refundingPlaybookId: 'pb-agua-prazo',
  }),
  lot({
    id: 'AG-2026-002',
    world: 'agua',
    producerId: 'nascente-serra-verde',
    regionId: 'minho',
    campanha: '2025/26',
    title: 'Água de nascente 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6',
    ...paleteLot(300),
    economics: economics({ ref: 0.27, discount: 0.12, acq: 0.182, costs: 0.031, decimals: 3 }),
    funding: { raised: 48310, coFinancers: 5, minTicket: 2500, maxTicket: 15000, opensAt: '2026-03-02', closedAt: '2026-03-12' },
    status: 'financiado',
    stage: 'em-venda',
    milestones: milestones('agua', { colhido: '2026-02-20', analisado: '2026-02-26', 'em-deposito': '2026-03-13', 'em-venda': '2026-05-04' }, { expedido: '2027-03-31', liquidado: '2027-09-12' }),
    settlement: { windowMonths: 18, start: '2026-03-12', plannedEnd: '2027-09-12' },
    extension: EXTENSION,
    hedge: NO_HEDGE,
    analyses: [waterAnalysis({ id: 'ag2026002-1', date: '2026-02-26', residuo: 22, ph: 6.1, nitratos: 0.8 })],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém da Nascente da Serra Verde, Terras de Bouro', container: 'Palete de 504 garrafas', containers: 300 },
    stock: 118,
    buyer: { segment: 'HoReCa', descricao: 'grossista HoReCa, Braga' },
    refundingPlaybookId: 'pb-agua-prazo',
  }),
  lot({
    id: 'AG-2026-003',
    world: 'agua',
    producerId: 'aguas-fonte-fria',
    regionId: 'beira-interior',
    campanha: '2025/26',
    title: 'Água mineral natural 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6',
    ...paleteLot(240),
    economics: economics({ ref: 0.28, discount: 0.12, acq: 0.188, costs: 0.032, decimals: 3 }),
    funding: { raised: 39920, coFinancers: 5, minTicket: 2500, maxTicket: 15000, opensAt: '2026-01-26', closedAt: '2026-02-03' },
    status: 'financiado',
    stage: 'expedido',
    milestones: milestones(
      'agua',
      { colhido: '2026-01-15', analisado: '2026-01-21', 'em-deposito': '2026-02-04', 'em-venda': '2026-04-01', expedido: '2026-10-06' },
      { liquidado: '2026-11-20' },
      { expedido: 'Últimas 60 paletes expedidas para cash & carry, Porto; pagamento a 45 dias.' },
    ),
    settlement: { windowMonths: 18, start: '2026-02-03', plannedEnd: '2027-08-03' },
    extension: EXTENSION,
    hedge: NO_HEDGE,
    analyses: [waterAnalysis({ id: 'ag2026003-1', date: '2026-01-21', residuo: 30, ph: 5.9, nitratos: 1.1 })],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém de Águas da Fonte Fria, Manteigas', container: 'Palete de 504 garrafas', containers: 240 },
    stock: 0,
    buyer: { segment: 'Cash & carry', descricao: 'cash & carry, Porto' },
    refundingPlaybookId: 'pb-agua-prazo',
  }),
  lot({
    id: 'AG-2026-005',
    world: 'agua',
    producerId: 'nascente-serra-verde',
    regionId: 'minho',
    campanha: '2025/26',
    title: 'Água de nascente 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6',
    ...paleteLot(280),
    economics: economics({ ref: 0.275, discount: 0.12, acq: 0.186, costs: 0.031, decimals: 3 }),
    funding: { raised: 45940, coFinancers: 6, minTicket: 2500, maxTicket: 15000, opensAt: '2026-07-13', closedAt: '2026-07-22' },
    status: 'financiado',
    stage: 'em-deposito',
    milestones: milestones('agua', { colhido: '2026-07-06', analisado: '2026-07-10', 'em-deposito': '2026-07-28' }, { 'em-venda': '2026-11-02', expedido: '2027-08-31', liquidado: '2028-01-22' }),
    settlement: { windowMonths: 18, start: '2026-07-22', plannedEnd: '2028-01-22' },
    extension: EXTENSION,
    hedge: NO_HEDGE,
    analyses: [waterAnalysis({ id: 'ag2026005-1', date: '2026-07-10', residuo: 23, ph: 6.0, nitratos: 0.9 })],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém da Nascente da Serra Verde, Terras de Bouro', container: 'Palete de 504 garrafas', containers: 280 },
    stock: 280,
    buyer: { segment: 'HoReCa', descricao: 'contrato anual com grossista HoReCa, Galiza' },
    refundingPlaybookId: 'pb-agua-prazo',
  }),
  lot({
    id: 'AG-2026-007',
    world: 'agua',
    producerId: 'aguas-fonte-fria',
    regionId: 'beira-interior',
    campanha: '2026/27',
    title: 'Água mineral natural 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6, lote de engarrafamento L2609',
    ...paleteLot(320),
    economics: economics({ ref: 0.28, discount: 0.11, acq: 0.19, costs: 0.032, decimals: 3 }),
    funding: { raised: 18800, coFinancers: 4, minTicket: 2500, maxTicket: 15000, opensAt: '2026-10-06' },
    status: 'aberto',
    stage: 'analisado',
    milestones: milestones(
      'agua',
      { colhido: '2026-10-02', analisado: '2026-10-05' },
      { 'em-deposito': '2026-11-03', 'em-venda': '2027-03-01', expedido: '2027-09-30', liquidado: '2028-05-03' },
      { colhido: 'Lote L2609 engarrafado na linha 2 entre 29/09 e 02/10.' },
    ),
    settlement: { windowMonths: 18, plannedEnd: '2028-05-03' },
    extension: EXTENSION,
    hedge: NO_HEDGE,
    analyses: [waterAnalysis({ id: 'ag2026007-1', date: '2026-10-05', residuo: 29, ph: 5.8, nitratos: 1.0, note: 'Composição estável face às análises de 2025.' })],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém de Águas da Fonte Fria, Manteigas', container: 'Palete de 504 garrafas', containers: 320 },
    stock: 320,
    buyer: { segment: 'Distribuição', descricao: 'distribuidor de bebidas, Centro' },
    refundingPlaybookId: 'pb-agua-prazo',
  }),
  lot({
    id: 'AG-2026-010',
    world: 'agua',
    producerId: 'nascente-serra-verde',
    regionId: 'minho',
    campanha: '2026/27',
    title: 'Água de nascente 1,5 L',
    product: 'Garrafas PET de 1,5 L, packs de 6',
    ...paleteLot(260),
    economics: economics({ ref: 0.275, discount: 0.12, acq: 0.184, costs: 0.031, decimals: 3 }),
    funding: { raised: 0, coFinancers: 0, minTicket: 2500, maxTicket: 15000, opensAt: '2026-11-03', opensPlanned: '2026-11-03' },
    status: 'em-preparacao',
    stage: 'colhido',
    milestones: milestones('agua', { colhido: '2026-10-09' }, { analisado: '2026-10-28', 'em-deposito': '2026-11-10', 'em-venda': '2027-04-01', expedido: '2027-09-30', liquidado: '2028-05-10' }, { colhido: 'Engarrafamento em curso: 142 de 260 paletes.' }),
    settlement: { windowMonths: 18 },
    extension: EXTENSION,
    hedge: NO_HEDGE,
    analyses: [],
    riskFactors: waterRisks(),
    storage: { local: 'Armazém da Nascente da Serra Verde, Terras de Bouro', container: 'Palete de 504 garrafas', containers: 260 },
    stock: 142,
    refundingPlaybookId: 'pb-agua-prazo',
  }),

  /* ============================ CAFÉ (Fase 2) ============================ */
  lot({
    id: 'CF-2027-001',
    world: 'cafe',
    producerId: 'fazenda-alto-mogiana',
    regionId: 'alta-mogiana',
    campanha: '2027/28',
    title: 'Arábica natural, Mundo Novo',
    product: 'Café verde, peneira 16/17, natural',
    ...sacaLot(320),
    economics: economics({ ref: 7.4, discount: 0.1, acq: 5.8, costs: 0.42, decimals: 2 }),
    funding: { raised: 0, coFinancers: 0, minTicket: 5000, maxTicket: 25000, opensAt: '2027-05-03', opensPlanned: '2027-05-03' },
    status: 'fase-2',
    stage: 'colhido',
    milestones: milestones('cafe', {}, { colhido: '2027-07-15', analisado: '2027-08-20', 'em-deposito': '2027-09-01', 'em-venda': '2027-10-01', expedido: '2027-11-15', liquidado: '2029-03-01' }),
    settlement: { windowMonths: 18 },
    extension: EXTENSION,
    hedge: kc(0.8),
    analyses: [coffeeAnalysis({ id: 'cf2027001-0', date: '2026-09-18', humidade: 11.2, cat1: 0, total: 4, sca: 82.5, peneira: '16/17', note: 'Amostra da safra 2026/27 recolhida na due diligence: chocolate, frutos secos, corpo médio.' })],
    riskFactors: coffeeRisks(),
    storage: { local: 'Armazém da Fazenda Alto Mogiana, Franca (SP)', container: 'Saca de 60 kg', containers: 320 },
    stock: 0,
  }),
  lot({
    id: 'CF-2027-002',
    world: 'cafe',
    producerId: 'finca-los-naranjos',
    regionId: 'huila',
    campanha: '2027/28',
    title: 'Arábica lavado, Caturra e Castillo',
    product: 'Café verde, peneira 15+, lavado',
    ...sacaLot(150),
    economics: economics({ ref: 8.6, discount: 0.1, acq: 6.7, costs: 0.45, decimals: 2 }),
    funding: { raised: 0, coFinancers: 0, minTicket: 5000, maxTicket: 20000, opensAt: '2027-05-03', opensPlanned: '2027-05-03' },
    status: 'fase-2',
    stage: 'colhido',
    milestones: milestones('cafe', {}, { colhido: '2027-06-15', analisado: '2027-07-20', 'em-deposito': '2027-08-01', 'em-venda': '2027-09-01', expedido: '2027-10-15', liquidado: '2029-02-01' }),
    settlement: { windowMonths: 18 },
    extension: EXTENSION,
    hedge: kc(0.8),
    analyses: [coffeeAnalysis({ id: 'cf2027002-0', date: '2026-09-25', humidade: 10.8, cat1: 0, total: 3, sca: 84.25, peneira: '15+', note: 'Amostra da mitaca 2026: panela, laranja, acidez média-alta.' })],
    riskFactors: coffeeRisks(),
    storage: { local: 'Beneficio partilhado, Pitalito (Huila)', container: 'Saca de 60 kg', containers: 150 },
    stock: 0,
  }),
]);
