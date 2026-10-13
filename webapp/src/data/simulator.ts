import { tidyDeep } from '../lib/format';
import type { SimEvent, SimLot, SimRules } from './types';

/* =====================================================================
   Simulador de campanha · dinheiro fictício. Regras e baralho de eventos.
   Cada corrida usa uma semente (seed) para ser reproduzível.
   ===================================================================== */

export const SIM_RULES: SimRules = {
  budget: 50000,
  months: 18,
  minAllocation: 2500,
  maxPerLot: 25000,
  firstLossReservePct: 0.05,
  extension: {
    maxMonths: 6,
    trigger: 'No mês 18, referência 15 % ou mais abaixo da entrada, ou mais de 30 % do stock por vender.',
    monthlyCostPct: 0.003,
  },
  refunding: {
    trigger: 'Perda prevista acima da reserva de primeira perda depois de um choque de preço.',
    description: 'Uma nova ronda refinancia a armazenagem por até 6 meses à espera de melhor preço. Custa 1,5 % do lote e pode não recuperar a perda.',
    costPct: 0.015,
  },
  disclaimer: 'Simulação educativa · dinheiro fictício · não representa resultados reais',
};

export const SIM_LOTS: SimLot[] = [
  {
    id: 'sim-az-a',
    world: 'azeite',
    nome: 'Azeite virgem extra, Trás-os-Montes',
    origem: 'Lagar fictício de montanha',
    fundingPrice: 3.53,
    priceUnit: 'kg',
    expectedMargin: 0.075,
    monthlyVolatility: 0.035,
    hedge: { available: true, instrument: 'forward', label: 'Venda a prazo de 50 %', coverage: 0.5, costPct: 0.01 },
    salesWindow: [5, 14],
  },
  {
    id: 'sim-az-b',
    world: 'azeite',
    nome: 'Azeite virgem extra, Alentejo',
    origem: 'Olival fictício de planície',
    fundingPrice: 3.47,
    priceUnit: 'kg',
    expectedMargin: 0.077,
    monthlyVolatility: 0.04,
    hedge: { available: true, instrument: 'indexacao', label: 'Indexação + venda a prazo de 40 %', coverage: 0.4, costPct: 0.009 },
    salesWindow: [4, 13],
  },
  {
    id: 'sim-ag-a',
    world: 'agua',
    nome: 'Água mineral natural 1,5 L',
    origem: 'Engarrafador fictício de serra',
    fundingPrice: 0.222,
    priceUnit: 'L',
    expectedMargin: 0.079,
    monthlyVolatility: 0.006,
    hedge: { available: false, instrument: 'nenhuma', label: 'Sem cobertura (preço estável)', coverage: 0, costPct: 0 },
    salesWindow: [6, 12],
  },
  {
    id: 'sim-ag-b',
    world: 'agua',
    nome: 'Água de nascente 1,5 L',
    origem: 'Engarrafador fictício do Norte',
    fundingPrice: 0.213,
    priceUnit: 'L',
    expectedMargin: 0.076,
    monthlyVolatility: 0.006,
    hedge: { available: false, instrument: 'nenhuma', label: 'Sem cobertura (preço estável)', coverage: 0, costPct: 0 },
    salesWindow: [7, 13],
  },
  {
    id: 'sim-cf-a',
    world: 'cafe',
    nome: 'Café verde arábica natural',
    origem: 'Fazenda fictícia, Brasil',
    fundingPrice: 6.22,
    priceUnit: 'kg',
    expectedMargin: 0.045,
    monthlyVolatility: 0.07,
    hedge: { available: true, instrument: 'ice-kc', label: 'Futuros ICE KC sobre 80 %', coverage: 0.8, costPct: 0.015 },
    salesWindow: [3, 9],
  },
];

export const SIM_EVENTS: SimEvent[] = tidyDeep([
  { id: 'choque-preco', title: 'Choque de preço −30 %', description: 'Uma colheita recorde em Espanha faz cair a referência de origem em 30 % em poucas semanas.', worlds: ['azeite'], probPerMonth: 0.035, months: [2, 16], effect: { priceShock: -0.3 }, hedgeMitigates: true, tone: 'adverso' },
  { id: 'choque-kc', title: 'Queda do arábica em Nova Iorque', description: 'Chuvas no Brasil melhoram a previsão da safra e o KC cai 25 %.', worlds: ['cafe'], probPerMonth: 0.05, months: [1, 12], effect: { priceShock: -0.25 }, hedgeMitigates: true, tone: 'adverso' },
  { id: 'colheita-fraca', title: 'Colheita fraca', description: 'Seca no verão reduz a produção; o preço sobe, mas o lote entrega menos do que o previsto.', worlds: ['azeite', 'cafe'], probPerMonth: 0.02, months: [1, 4], effect: { qtyLoss: 0.12, priceShock: 0.08 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'atraso-vendas', title: 'Atraso nas vendas', description: 'Um comprador adia as encomendas; as vendas escorregam três meses.', worlds: ['azeite', 'agua', 'cafe'], probPerMonth: 0.03, months: [4, 15], effect: { salesDelayMonths: 3 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'quebra-qualidade', title: 'Quebra de qualidade', description: 'A reanálise mostra peróxidos acima do limite em parte do lote: 30 % passa a virgem e vende-se 20 % abaixo.', worlds: ['azeite'], probPerMonth: 0.015, months: [6, 16], effect: { downgrade: { share: 0.3, discount: 0.2 } }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'verao-chuvoso', title: 'Verão chuvoso', description: 'Procura de água abaixo do normal entre junho e agosto; parte das paletes fica para o ano seguinte.', worlds: ['agua'], probPerMonth: 0.04, months: [8, 11], effect: { salesDelayMonths: 4, extraCost: 0.004 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'frete', title: 'Subida do frete', description: 'O gasóleo e as portagens sobem; o transporte come parte da margem.', worlds: ['agua', 'cafe'], probPerMonth: 0.025, months: [1, 18], effect: { extraCost: 0.012 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'comprador-falha', title: 'Comprador paga tarde', description: 'Um comprador entra em dificuldades; o seguro de crédito cobre 90 % depois de 120 dias.', worlds: ['azeite', 'agua', 'cafe'], probPerMonth: 0.01, months: [8, 18], effect: { salesDelayMonths: 4, extraCost: 0.01 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'procura-forte', title: 'Procura forte', description: 'Um distribuidor fecha um contrato grande; o lote vende-se mais depressa e com um pequeno prémio.', worlds: ['azeite', 'agua', 'cafe'], probPerMonth: 0.04, months: [3, 14], effect: { demand: { monthsFaster: 2, premium: 0.03 } }, hedgeMitigates: false, tone: 'favoravel' },
  { id: 'recuperacao', title: 'Recuperação de preço', description: 'A referência recupera 10 % depois de um inverno seco.', worlds: ['azeite', 'cafe'], probPerMonth: 0.03, months: [6, 18], effect: { priceShock: 0.1 }, hedgeMitigates: true, tone: 'favoravel' },
]);
