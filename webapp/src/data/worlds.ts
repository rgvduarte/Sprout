import { tidyDeep } from '../lib/format';
import type { Region, World } from './types';

export const WORLDS: World[] = tidyDeep([
  {
    id: 'azeite',
    nome: 'O Olival',
    commodity: 'Azeite',
    tagline: 'Azeite virgem extra comprado ao lagar, guardado em depósito e vendido a granel a compradores B2B.',
    description:
      'A campanha começa em outubro, quando a azeitona chega ao lagar, e a extração corre até janeiro. O azeite fica em depósitos de inox ou em IBC de 1 000 kg, sob azoto e ao abrigo da luz, e é vendido entre fevereiro e setembro a distribuição, HoReCa e cash & carry.',
    unit: 'kg',
    priceUnit: 'kg',
    gauge: 'ibc',
    map: 'pt',
    fase: 1,
    investable: true,
    season: {
      id: '2026/27',
      label: 'Campanha 2026/27',
      phases: [
        { id: 'az-colheita', label: 'Colheita e extração', kind: 'colheita', startMonth: 10, endMonth: 1, description: 'A azeitona é colhida e moída no lagar em menos de 24 horas.' },
        { id: 'az-armazenagem', label: 'Armazenagem e vendas', kind: 'vendas', startMonth: 2, endMonth: 9, description: 'O azeite repousa em depósito e é vendido em lotes a compradores B2B.' },
      ],
    },
    vocabulario: [
      { termo: 'Lagar', definicao: 'Instalação onde a azeitona é lavada, moída e batida para separar o azeite.' },
      { termo: 'Depósito', definicao: 'Cuba de inox onde o azeite repousa sob azoto, a 15–18 °C e sem luz.' },
      { termo: 'IBC', definicao: 'Contentor de 1 000 kg numa grade metálica sobre palete. É a unidade física de um lote.' },
      { termo: 'Campanha', definicao: 'Ano agrícola do azeite: colheita de outubro a janeiro, vendas até setembro.' },
      { termo: 'Acidez', definicao: 'Ácidos gordos livres, em % de ácido oleico. Virgem extra: até 0,8 %.' },
      { termo: 'Frutado', definicao: 'Conjunto de aromas da azeitona sã, verde ou madura, avaliado pelo painel de prova.' },
    ],
    journeyLabels: { colhido: 'Colhido', analisado: 'Analisado', 'em-deposito': 'Em depósito', 'em-venda': 'Em venda', expedido: 'Expedido', liquidado: 'Liquidado' },
    hedge: {
      instrument: 'forward',
      label: 'Venda a prazo e indexação',
      description:
        'Não há um mercado de futuros líquido para azeite. A cobertura faz-se com vendas a prazo a compradores, com preço fixado, e com cláusulas de indexação a uma referência pública de preços na origem.',
    },
    physical: { container: 'IBC de 1 000 kg', containerCapacity: '1 000 kg ≈ 1 092 L', storage: 'Depósito de inox, sob azoto' },
  },
  {
    id: 'agua',
    nome: 'A Nascente',
    commodity: 'Água',
    tagline: 'Água mineral natural e de nascente, engarrafada na origem e vendida à palete.',
    description:
      'A água é captada num aquífero protegido e engarrafada na origem, como exige a lei. O que se financia são paletes já engarrafadas, em armazém, vendidas a distribuição e HoReCa com pico de procura entre maio e setembro.',
    unit: 'palete',
    priceUnit: 'L',
    gauge: 'pallet',
    map: 'pt',
    fase: 1,
    investable: true,
    season: {
      id: '2026/27',
      label: 'Ano comercial 2026/27',
      phases: [
        { id: 'ag-engarrafamento', label: 'Engarrafamento para stock', kind: 'engarrafamento', startMonth: 10, endMonth: 4, description: 'As linhas enchem stock para a época alta.' },
        { id: 'ag-procura', label: 'Época alta de procura', kind: 'procura', startMonth: 5, endMonth: 9, description: 'HoReCa e distribuição escoam as paletes.' },
      ],
    },
    vocabulario: [
      { termo: 'Aquífero', definicao: 'Formação geológica que guarda a água subterrânea e lhe dá a composição mineral.' },
      { termo: 'Captação', definicao: 'Furo ou nascente licenciada de onde a água sai para a linha de engarrafamento.' },
      { termo: 'Engarrafamento', definicao: 'Enchimento na origem. A água mineral natural não pode ser transportada a granel para engarrafar noutro sítio.' },
      { termo: 'Palete', definicao: 'Garrafas de 1,5 L × 6 por pack × 84 packs = 504 garrafas, 756 L.' },
      { termo: 'Resíduo seco', definicao: 'Sais que ficam depois de evaporar a água a 180 °C. Mede a mineralização, em mg/L.' },
    ],
    journeyLabels: { colhido: 'Engarrafado', analisado: 'Analisado', 'em-deposito': 'Em armazém', 'em-venda': 'Em venda', expedido: 'Expedido', liquidado: 'Liquidado' },
    hedge: {
      instrument: 'nenhuma',
      label: 'Sem cobertura',
      description: 'O preço da água engarrafada é estável. O risco principal é de prazo de venda e de logística, gerido com contratos anuais de fornecimento.',
    },
    physical: { container: 'Palete de 504 garrafas', containerCapacity: '504 × 1,5 L = 756 L', storage: 'Armazém coberto, à sombra' },
  },
  {
    id: 'cafe',
    nome: 'A Plantação',
    commodity: 'Café',
    tagline: 'Café verde de origem, em sacas de 60 kg. Fase 2, abre em 2027.',
    description:
      'O café chega como grão verde em sacas de 60 kg, depois da colheita da cereja, da secagem no terreiro e do descasque. O preço segue o contrato de futuros Arabica (ICE KC), o que permite cobrir a exposição de preço. O mundo já se pode explorar e jogar na Academia; o financiamento abre na Fase 2.',
    unit: 'saca',
    priceUnit: 'kg',
    gauge: 'sacks',
    map: 'cafe',
    fase: 2,
    investable: false,
    faseLabel: 'Fase 2 · abre em 2027',
    season: {
      id: '2027/28',
      label: 'Safra 2027/28 (Brasil)',
      phases: [
        { id: 'cf-floracao', label: 'Floração e enchimento do grão', kind: 'floracao', startMonth: 10, endMonth: 4, description: 'Depois das chuvas, a planta floresce e a cereja forma-se.' },
        { id: 'cf-colheita', label: 'Colheita e secagem', kind: 'colheita', startMonth: 5, endMonth: 9, description: 'A cereja é colhida e seca no terreiro ou em secadores.' },
      ],
    },
    vocabulario: [
      { termo: 'Cereja', definicao: 'O fruto do cafeeiro. Cada cereja tem normalmente dois grãos.' },
      { termo: 'Terreiro', definicao: 'Pátio onde a cereja ou o pergaminho secam ao sol, revolvidos várias vezes ao dia.' },
      { termo: 'Saca', definicao: 'Saco de juta com 60 kg de café verde. A unidade de comércio da origem.' },
      { termo: 'Pergaminho', definicao: 'Película que envolve o grão depois de retirada a polpa.' },
      { termo: 'Pontuação SCA', definicao: 'Escala de prova de 0 a 100. A partir de 80 pontos o café é de especialidade.' },
    ],
    journeyLabels: { colhido: 'Colhido', analisado: 'Classificado', 'em-deposito': 'Em armazém', 'em-venda': 'Em venda', expedido: 'Embarcado', liquidado: 'Liquidado' },
    hedge: {
      instrument: 'ice-kc',
      label: 'Futuros ICE Arabica (KC)',
      description: 'O café arábica tem um mercado de futuros líquido (ICE KC, em cêntimos de dólar por libra). Uma venda de futuros fixa o preço de uma parte do lote enquanto o café não é vendido.',
    },
    physical: { container: 'Saca de juta de 60 kg', containerCapacity: '60 kg de café verde', storage: 'Armazém seco, humidade do grão 10–12 %' },
  },
]);

/* --------------------------------------------------------------------
   Mapa de mosaico (hexágonos pointy-top, offset odd-r). Não é um contorno
   geográfico: é um esquema norte→sul de Portugal e um arquipélago de origens.
   -------------------------------------------------------------------- */
export const REGIONS: Region[] = [
  { id: 'minho', nome: 'Minho', map: 'pt', tiles: [{ col: 0, row: 0 }], worlds: ['agua'], description: 'Granito e chuva abundante: águas de muito baixa mineralização.' },
  { id: 'tras-os-montes', nome: 'Trás-os-Montes', map: 'pt', tiles: [{ col: 1, row: 0 }, { col: 2, row: 0 }, { col: 1, row: 1 }], worlds: ['azeite', 'agua'], description: 'Olivais de sequeiro em socalcos; Verdeal, Madural e Cobrançosa.' },
  { id: 'douro', nome: 'Douro', map: 'pt', tiles: [{ col: 0, row: 1 }], worlds: ['azeite'], description: 'Olival de encosta entre vinhas, em xisto.' },
  { id: 'beira-litoral', nome: 'Beira Litoral', map: 'pt', tiles: [{ col: 0, row: 2 }, { col: 0, row: 3 }], worlds: ['agua'], description: 'Bacias sedimentares e águas termais históricas.' },
  { id: 'beira-interior', nome: 'Beira Interior', map: 'pt', tiles: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 1, row: 3 }], worlds: ['azeite', 'agua'], description: 'Serra da Estrela e Gardunha: nascentes de altitude e olival tradicional de Galega.' },
  { id: 'estremadura', nome: 'Lisboa e Oeste', map: 'pt', tiles: [{ col: 0, row: 4 }, { col: 0, row: 5 }], worlds: [], description: 'Grandes centros de consumo e plataformas de distribuição.' },
  { id: 'ribatejo', nome: 'Ribatejo', map: 'pt', tiles: [{ col: 1, row: 4 }], worlds: ['azeite'], description: 'Olival de vale, solos de aluvião junto ao Tejo.' },
  { id: 'alentejo', nome: 'Alentejo', map: 'pt', tiles: [{ col: 2, row: 4 }, { col: 1, row: 5 }, { col: 0, row: 6 }, { col: 1, row: 6 }, { col: 2, row: 6 }, { col: 0, row: 7 }, { col: 1, row: 7 }], worlds: ['azeite'], description: 'A maior área de olival do país; Galega, Cobrançosa e Cordovil junto ao Guadiana.' },
  { id: 'algarve', nome: 'Algarve', map: 'pt', tiles: [{ col: 0, row: 8 }, { col: 1, row: 8 }], worlds: ['azeite', 'agua'], description: 'Serra de Monchique e barrocal: origens em avaliação para a campanha 2027/28.' },

  { id: 'huila', nome: 'Huila', country: 'Colômbia', map: 'cafe', tiles: [{ col: 0, row: 0 }], worlds: ['cafe'], description: 'Arábica lavado de altitude, 1 500–2 000 m, duas colheitas por ano.' },
  { id: 'narino', nome: 'Nariño', country: 'Colômbia', map: 'cafe', tiles: [{ col: 0, row: 1 }], worlds: ['cafe'], description: 'Vulcânico e muito alto; acidez viva.' },
  { id: 'alta-mogiana', nome: 'Alta Mogiana', country: 'Brasil', map: 'cafe', tiles: [{ col: 2, row: 1 }], worlds: ['cafe'], description: 'Planalto entre São Paulo e Minas Gerais; naturais e cereja descascado.' },
  { id: 'sul-de-minas', nome: 'Sul de Minas', country: 'Brasil', map: 'cafe', tiles: [{ col: 2, row: 2 }], worlds: ['cafe'], description: 'A maior região produtora de arábica do Brasil.' },
  { id: 'cerrado-mineiro', nome: 'Cerrado Mineiro', country: 'Brasil', map: 'cafe', tiles: [{ col: 3, row: 1 }], worlds: ['cafe'], description: 'Estações bem marcadas e colheita mecanizada.' },
  { id: 'sidama', nome: 'Sidama', country: 'Etiópia', map: 'cafe', tiles: [{ col: 5, row: 0 }], worlds: ['cafe'], description: 'Variedades autóctones, pequenos produtores e estações de lavagem.' },
  { id: 'guji', nome: 'Guji', country: 'Etiópia', map: 'cafe', tiles: [{ col: 5, row: 1 }], worlds: ['cafe'], description: 'Naturais secos em camas suspensas.' },
  { id: 'planalto-central', nome: 'Planalto Central', country: 'Vietname', map: 'cafe', tiles: [{ col: 8, row: 1 }], worlds: ['cafe'], description: 'Robusta em grande escala; Đắk Lắk é o centro do comércio.' },
];
