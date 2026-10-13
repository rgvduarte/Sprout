import { tidyDeep } from '../lib/format';
import { INVESTOR_SHARE, RESERVE_CAP, RESERVE_SHARE, SPROUT_SHARE } from './lots';
import { OLIVE_MODEL } from './valueChain';
import type { SimEvent, SimLot, SimRules } from './types';

/* =====================================================================
   Simulador de campanha · dinheiro fictício. Regras e baralho de eventos.
   Cada corrida usa uma semente (seed) para ser reproduzível.

   As regras são as dos lotes reais: a mesma partilha da margem (50 %
   cofinanciadores, 20 % operação, 30 % reserva comum) e a mesma reserva
   de primeira perda (30 % da margem de cada lote que liquida com ganho,
   até 5 % do capital), que pode esgotar-se quando vários lotes caem juntos.
   Os lotes de azeite seguem o business plan (cenário Recomendado): um lote
   de HoReCa e um de distribuidores. A água entra como hipótese de estudo:
   no piloto é cesto, em modelo de agente, e não se financia.
   ===================================================================== */

export const SIM_RULES: SimRules = {
  budget: 50000,
  months: 18,
  minAllocation: 2500,
  maxPerLot: 25000,
  shares: { investors: INVESTOR_SHARE, sprout: SPROUT_SHARE, reserve: RESERVE_SHARE },
  reserve: { shareOfMargin: RESERVE_SHARE, capOfInvested: RESERVE_CAP, initialOfInvested: 0.01 },
  extension: {
    maxMonths: 6,
    trigger: 'No mês 18, índice de origem 15 % ou mais abaixo da abertura, ou mais de 30 % do stock por vender.',
    monthlyCostPct: 0.003,
  },
  refunding: {
    trigger: 'Perda prevista do lote acima do saldo disponível da reserva comum, depois de um choque de preço.',
    description: 'Uma nova ronda refinancia a armazenagem durante 4 meses, com as vendas paradas à espera de melhor preço. Custa 1,5 % do lote e pode não recuperar a perda.',
    costPct: 0.015,
  },
  disclaimer: 'Simulação educativa · dinheiro fictício · não representa resultados reais',
};

const H = OLIVE_MODEL.horeca;
const D = OLIVE_MODEL.distribuicao;
/** Volatilidade mensal do índice de origem a granel (≈ 23–42 % ao ano em 2022–26; usa-se ≈ 24 %). */
const INDEX_VOL = 0.07;

export const SIM_LOTS: SimLot[] = tidyDeep([
  {
    id: 'sim-az-a',
    world: 'azeite',
    nome: 'Azeite de origem para HoReCa e lojas gourmet',
    origem: 'Lagar fictício de montanha, DOP',
    canal: 'HoReCa: 10 % abaixo da referência embalada, vendas por tranches',
    fundingPrice: H.fundingPrice,
    priceUnit: 'kg',
    expectedMargin: Math.round(((H.margin * INVESTOR_SHARE) / H.fundingPrice) * 10000) / 10000,
    monthlyVolatility: Math.round(INDEX_VOL * (OLIVE_MODEL.indexToday / H.refPrice) * 1000) / 1000,
    indexShare: Math.round((OLIVE_MODEL.indexToday / H.refPrice) * 100) / 100,
    hedge: { available: true, instrument: 'forward', label: 'Venda a prazo de 40 % a um grossista HoReCa', coverage: 0.4, costPct: 0.006 },
    salesWindow: [4, 10],
  },
  {
    id: 'sim-az-b',
    world: 'azeite',
    nome: 'Azeite de origem para distribuidores',
    origem: 'Olival fictício de planície',
    canal: 'Distribuidores: preço de saída do embalador mais prémio de origem',
    fundingPrice: D.fundingPrice,
    priceUnit: 'kg',
    expectedMargin: Math.round(((D.margin * INVESTOR_SHARE) / D.fundingPrice) * 10000) / 10000,
    monthlyVolatility: Math.round(INDEX_VOL * (OLIVE_MODEL.indexToday / D.refPrice) * 1000) / 1000,
    indexShare: Math.round((OLIVE_MODEL.indexToday / D.refPrice) * 100) / 100,
    hedge: { available: true, instrument: 'forward', label: 'Venda contratada (offtake) de 85 % antes da compra', coverage: 0.85, costPct: 0.002 },
    salesWindow: [4, 8],
  },
  {
    id: 'sim-ag-a',
    world: 'agua',
    nome: 'Água mineral 1,5 L, comprada como principal',
    origem: 'Engarrafador fictício de serra',
    canal: 'Hipótese de estudo: a Sprout compra as paletes e adianta o depósito SDR',
    fundingPrice: 0.38,
    priceUnit: 'L',
    expectedMargin: 0.05,
    monthlyVolatility: 0.006,
    indexShare: 0,
    hedge: { available: false, instrument: 'nenhuma', label: 'Sem cobertura (preço estável)', coverage: 0, costPct: 0 },
    salesWindow: [7, 11],
    hypothesis: 'No piloto a água não se financia: entra como cesto, em modelo de agente. Este lote mostra porquê.',
  },
  {
    id: 'sim-ag-b',
    world: 'agua',
    nome: 'Água de nascente 1,5 L, comprada como principal',
    origem: 'Engarrafador fictício do Norte',
    canal: 'Hipótese de estudo: a Sprout compra as paletes e adianta o depósito SDR',
    fundingPrice: 0.375,
    priceUnit: 'L',
    expectedMargin: 0.045,
    monthlyVolatility: 0.006,
    indexShare: 0,
    hedge: { available: false, instrument: 'nenhuma', label: 'Sem cobertura (preço estável)', coverage: 0, costPct: 0 },
    salesWindow: [8, 12],
    hypothesis: 'No piloto a água não se financia: entra como cesto, em modelo de agente. Este lote mostra porquê.',
  },
  {
    id: 'sim-cf-a',
    world: 'cafe',
    nome: 'Café verde arábica natural',
    origem: 'Fazenda fictícia, Brasil, via importador UE',
    canal: 'Microtorrefações: verde comprado em EUR a um importador',
    fundingPrice: 7.25,
    priceUnit: 'kg',
    expectedMargin: 0.041,
    monthlyVolatility: 0.075,
    indexShare: 1,
    hedge: { available: true, instrument: 'forward', label: 'Preço fixo em EUR e venda contratada de 60 %', coverage: 0.6, costPct: 0.003 },
    salesWindow: [3, 9],
  },
] satisfies SimLot[]);

export const SIM_EVENTS: SimEvent[] = tidyDeep([
  { id: 'choque-preco', title: 'Índice de origem −30 %', description: 'Uma colheita recorde em Espanha faz cair o índice de origem do azeite em 30 % em poucas semanas. As referências embaladas acompanham a queda do granel.', worlds: ['azeite'], probPerMonth: 0.035, months: [2, 14], effect: { priceShock: -0.3 }, hedgeMitigates: true, tone: 'adverso' },
  { id: 'choque-kc', title: 'Queda do arábica em Nova Iorque', description: 'Chuvas no Brasil melhoram a previsão da safra e o KC cai 25 %. O verde em EUR acompanha.', worlds: ['cafe'], probPerMonth: 0.05, months: [1, 12], effect: { priceShock: -0.25 }, hedgeMitigates: true, tone: 'adverso' },
  { id: 'colheita-fraca', title: 'Colheita fraca', description: 'Seca no verão reduz a produção: o índice sobe, mas o lote entrega menos do que o previsto.', worlds: ['azeite', 'cafe'], probPerMonth: 0.02, months: [1, 3], effect: { qtyLoss: 0.12, priceShock: 0.08 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'recessao', title: 'Recessão', description: 'O consumo fora de casa cai em todo o país: a HoReCa e a distribuição compram menos, pedem preço e alguns clientes deixam faturas por pagar. Atinge todos os mercados ao mesmo tempo.', worlds: ['azeite', 'agua', 'cafe'], probPerMonth: 0.016, months: [3, 13], effect: { refShock: -0.1, salesDelayMonths: 3, extraCost: 0.005, badDebt: 0.03 }, hedgeMitigates: true, tone: 'adverso' },
  { id: 'atraso-vendas', title: 'Atraso nas vendas', description: 'Um comprador adia as encomendas; as vendas escorregam três meses.', worlds: ['azeite', 'agua', 'cafe'], probPerMonth: 0.03, months: [4, 15], effect: { salesDelayMonths: 3 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'quebra-qualidade', title: 'Quebra de qualidade', description: 'A reanálise mostra peróxidos acima do limite em parte do lote: 30 % passa a virgem e vende-se 20 % abaixo.', worlds: ['azeite'], probPerMonth: 0.015, months: [5, 15], effect: { downgrade: { share: 0.3, discount: 0.2 } }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'verao-chuvoso', title: 'Verão chuvoso', description: 'Procura de água abaixo do normal entre junho e agosto; parte das paletes fica para o ano seguinte e paga armazém.', worlds: ['agua'], probPerMonth: 0.045, months: [8, 11], effect: { salesDelayMonths: 4, extraCost: 0.01, refShock: -0.03 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'frete', title: 'Subida do frete', description: 'O gasóleo e as portagens sobem; o transporte, que pesa 20–40 % do valor da água, come parte da margem.', worlds: ['agua', 'cafe'], probPerMonth: 0.025, months: [1, 18], effect: { extraCost: 0.02 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'comprador-falha', title: 'Comprador paga tarde', description: 'Um comprador entra em dificuldades; o seguro de crédito cobre 90 % depois de 120 dias.', worlds: ['azeite', 'agua', 'cafe'], probPerMonth: 0.01, months: [8, 18], effect: { salesDelayMonths: 4, extraCost: 0.01 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'comprador-insolvente', title: 'Comprador insolvente', description: 'Um comprador entra em insolvência acima do limite do seguro de crédito: uma parte das vendas do lote não se recupera.', worlds: ['azeite', 'agua', 'cafe'], probPerMonth: 0.009, months: [5, 17], effect: { badDebt: 0.1 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'stock-danificado', title: 'Stock danificado', description: 'Paletes ao calor num armazém de terceiros: as garrafas deformadas são recusadas e destruídas. O seguro não cobre dano estético.', worlds: ['agua'], probPerMonth: 0.012, months: [3, 12], effect: { writeOff: 0.15 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'derrame', title: 'Derrame no co-packer', description: 'Um IBC rompe-se no embalamento e um lote de garrafões sai com o vedante mal fechado: o stock afetado perde-se depois da franquia do seguro.', worlds: ['azeite'], probPerMonth: 0.008, months: [4, 14], effect: { writeOff: 0.05 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'humidade', title: 'Humidade no armazém', description: 'Um contentor chega com condensação: parte das sacas ganha bolor e é recusada pelas torrefações.', worlds: ['cafe'], probPerMonth: 0.01, months: [2, 10], effect: { writeOff: 0.06 }, hedgeMitigates: false, tone: 'adverso' },
  { id: 'procura-forte', title: 'Procura forte', description: 'Um distribuidor fecha um contrato grande; o lote vende-se mais depressa e com um pequeno prémio.', worlds: ['azeite', 'agua', 'cafe'], probPerMonth: 0.04, months: [3, 14], effect: { demand: { monthsFaster: 2, premium: 0.03 } }, hedgeMitigates: false, tone: 'favoravel' },
  { id: 'recuperacao', title: 'Recuperação de preço', description: 'O índice recupera 10 % depois de um inverno seco.', worlds: ['azeite', 'cafe'], probPerMonth: 0.03, months: [6, 18], effect: { priceShock: 0.1 }, hedgeMitigates: true, tone: 'favoravel' },
] satisfies SimEvent[]);
